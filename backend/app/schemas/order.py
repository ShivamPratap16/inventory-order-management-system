"""Order request/response schemas.

OrderItem* and Order* schemas live together because they form one request and
one response shape - the same reasoning as keeping Order + OrderItem together
in the models package.
"""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0, description="Must order at least one unit")


class OrderCreate(BaseModel):
    customer_id: int
    items: list[OrderItemCreate] = Field(..., min_length=1)


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    quantity: int
    unit_price: float
    # Convenience field so the frontend can show the product name without an
    # extra request. Populated from the related product in the router.
    product_name: str | None = None


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    customer_id: int
    total_amount: float
    created_at: datetime
    items: list[OrderItemOut]
    customer_name: str | None = None
