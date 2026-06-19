"""Customer endpoints: create, list, retrieve and delete."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/customers", tags=["Customers"])


def _get_customer_or_404(customer_id: int, db: Session) -> models.Customer:
    customer = db.get(models.Customer, customer_id)
    if customer is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.post("", response_model=schemas.CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(payload: schemas.CustomerCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(models.Customer).filter(models.Customer.email == payload.email).first()
    )
    if existing:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"A customer with email '{payload.email}' already exists",
        )

    customer = models.Customer(**payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("", response_model=list[schemas.CustomerOut])
def list_customers(search: str | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Customer)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            models.Customer.full_name.ilike(term)
            | models.Customer.email.ilike(term)
            | models.Customer.phone.ilike(term)
        )
    return query.order_by(models.Customer.id.desc()).all()


@router.get("/{customer_id}", response_model=schemas.CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    return _get_customer_or_404(customer_id, db)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = _get_customer_or_404(customer_id, db)
    if customer.orders:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Cannot delete a customer who has existing orders",
        )
    db.delete(customer)
    db.commit()
