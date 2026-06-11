"""Product request/response schemas."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., ge=0, description="Price must be zero or positive")
    quantity_in_stock: int = Field(..., ge=0, description="Stock cannot be negative")


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    # All optional so the client can update only the fields that changed.
    name: str | None = Field(None, min_length=1, max_length=255)
    sku: str | None = Field(None, min_length=1, max_length=100)
    price: float | None = Field(None, ge=0)
    quantity_in_stock: int | None = Field(None, ge=0)


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
