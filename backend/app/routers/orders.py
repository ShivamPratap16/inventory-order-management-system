"""Order endpoints - the heart of the business logic.

Creating an order, in one database transaction:
  1. Validates the customer exists.
  2. Validates every referenced product exists.
  3. Checks there is enough stock for each line (rejects the whole order if not).
  4. Reduces stock for each product.
  5. Calculates the total amount from current product prices.

If anything fails, the transaction is rolled back so stock is never reduced for
an order that did not actually go through.
"""
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/orders", tags=["Orders"])


def _serialize_order(order: models.Order) -> schemas.OrderOut:
    """Build the response object, enriching it with customer/product names."""
    items = [
        schemas.OrderItemOut(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=float(item.unit_price),
            product_name=item.product.name if item.product else None,
        )
        for item in order.items
    ]
    return schemas.OrderOut(
        id=order.id,
        customer_id=order.customer_id,
        total_amount=float(order.total_amount),
        created_at=order.created_at,
        items=items,
        customer_name=order.customer.full_name if order.customer else None,
    )


@router.post("", response_model=schemas.OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(payload: schemas.OrderCreate, db: Session = Depends(get_db)):
    customer = db.get(models.Customer, payload.customer_id)
    if customer is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Customer not found")

    requested = defaultdict(int)
    for line in payload.items:
        requested[line.product_id] += line.quantity

    product_ids = sorted(requested.keys())
    locked_products = (
        db.query(models.Product)
        .filter(models.Product.id.in_(product_ids))
        .order_by(models.Product.id)
        .with_for_update()
        .all()
    )
    products_by_id = {p.id: p for p in locked_products}

    missing = [pid for pid in product_ids if pid not in products_by_id]
    if missing:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail=f"Product(s) not found: {missing}",
        )

    order = models.Order(customer_id=customer.id, total_amount=0)
    total = 0.0

    for product_id in product_ids:
        quantity = requested[product_id]
        product = products_by_id[product_id]

        if product.quantity_in_stock < quantity:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for '{product.name}': "
                    f"requested {quantity}, only {product.quantity_in_stock} available"
                ),
            )

        product.quantity_in_stock -= quantity
        line_price = float(product.price)
        total += line_price * quantity
        order.items.append(
            models.OrderItem(
                product_id=product.id, quantity=quantity, unit_price=line_price
            )
        )

    order.total_amount = round(total, 2)
    db.add(order)
    db.commit()
    db.refresh(order)
    return _serialize_order(order)


@router.get("", response_model=list[schemas.OrderOut])
def list_orders(search: str | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Order)
    if search and search.strip():
        term = search.strip()
        conditions = [models.Customer.full_name.ilike(f"%{term}%")]
        digits = term.lstrip("#")
        if digits.isdigit():
            conditions.append(models.Order.id == int(digits))
        query = query.join(models.Customer).filter(or_(*conditions))
    orders = query.order_by(models.Order.id.desc()).all()
    return [_serialize_order(o) for o in orders]


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.get(models.Order, order_id)
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Order not found")
    return _serialize_order(order)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.get(models.Order, order_id)
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Order not found")

    for item in order.items:
        product = db.get(models.Product, item.product_id)
        if product is not None:
            product.quantity_in_stock += item.quantity

    db.delete(order)
    db.commit()
