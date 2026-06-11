"""Product endpoints: full CRUD with SKU-uniqueness enforcement."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app import models, schemas
from app.config import settings
from app.database import get_db

router = APIRouter(prefix="/products", tags=["Products"])

# Maps the `sort` query value to a SQLAlchemy ORDER BY expression. Anything not
# in this map falls back to newest-first.
_SORT_OPTIONS = {
    "stock_asc": models.Product.quantity_in_stock.asc(),
    "stock_desc": models.Product.quantity_in_stock.desc(),
    "price_asc": models.Product.price.asc(),
    "price_desc": models.Product.price.desc(),
    "name_asc": models.Product.name.asc(),
    "name_desc": models.Product.name.desc(),
}


def _get_product_or_404(product_id: int, db: Session) -> models.Product:
    product = db.get(models.Product, product_id)
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.post("", response_model=schemas.ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db)):
    # Business rule: SKU must be unique. Check before insert to return a clean
    # 409 instead of leaking a raw database integrity error.
    existing = db.query(models.Product).filter(models.Product.sku == payload.sku).first()
    if existing:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"A product with SKU '{payload.sku}' already exists",
        )

    product = models.Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("", response_model=list[schemas.ProductOut])
def list_products(
    search: str | None = None,
    # Comma-separated subset of: out, low, healthy (e.g. "out,low").
    stock_status: str | None = None,
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    min_stock: int | None = Query(None, ge=0),
    max_stock: int | None = Query(None, ge=0),
    sort: str | None = None,
    db: Session = Depends(get_db),
):
    """List products with optional search, multi-filter and sort.

    All filters combine with AND (each narrows the result), except the stock
    statuses, which combine with OR among themselves (an item is shown if it is
    in ANY of the selected buckets).
    """
    query = db.query(models.Product)

    # --- Search: name or SKU, case-insensitive ---
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            models.Product.name.ilike(term) | models.Product.sku.ilike(term)
        )

    # --- Stock status buckets (OR within the group) ---
    if stock_status:
        threshold = settings.low_stock_threshold
        wanted = {s.strip() for s in stock_status.split(",") if s.strip()}
        buckets = {
            "out": models.Product.quantity_in_stock == 0,
            "low": and_(
                models.Product.quantity_in_stock > 0,
                models.Product.quantity_in_stock <= threshold,
            ),
            "healthy": models.Product.quantity_in_stock > threshold,
        }
        conditions = [buckets[s] for s in wanted if s in buckets]
        if conditions:
            query = query.filter(or_(*conditions))

    # --- Price range ---
    if min_price is not None:
        query = query.filter(models.Product.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Product.price <= max_price)

    # --- Stock quantity range ---
    if min_stock is not None:
        query = query.filter(models.Product.quantity_in_stock >= min_stock)
    if max_stock is not None:
        query = query.filter(models.Product.quantity_in_stock <= max_stock)

    # --- Sort (defaults to newest first) ---
    query = query.order_by(_SORT_OPTIONS.get(sort, models.Product.id.desc()))

    return query.all()


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return _get_product_or_404(product_id, db)


@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int, payload: schemas.ProductUpdate, db: Session = Depends(get_db)
):
    product = _get_product_or_404(product_id, db)
    data = payload.model_dump(exclude_unset=True)

    # If the SKU is changing, make sure it does not collide with another product.
    if "sku" in data and data["sku"] != product.sku:
        clash = (
            db.query(models.Product)
            .filter(models.Product.sku == data["sku"], models.Product.id != product_id)
            .first()
        )
        if clash:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail=f"A product with SKU '{data['sku']}' already exists",
            )

    for field, value in data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = _get_product_or_404(product_id, db)
    # Block deletion if the product is referenced by any order, otherwise order
    # history would point at a missing product.
    if product.order_items:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Cannot delete a product that is part of existing orders",
        )
    db.delete(product)
    db.commit()
