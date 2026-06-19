"""Dashboard summary + analytics schemas."""
from pydantic import BaseModel

from app.schemas.product import ProductOut


class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_count: int
    low_stock_products: list[ProductOut]


class OrdersPerDay(BaseModel):
    date: str
    orders: int
    revenue: float


class TopProduct(BaseModel):
    name: str
    units: int


class StockBreakdown(BaseModel):
    healthy: int
    low: int
    out: int


class DashboardAnalytics(BaseModel):
    total_revenue: float
    orders_per_day: list[OrdersPerDay]
    top_products: list[TopProduct]
    stock_breakdown: StockBreakdown
