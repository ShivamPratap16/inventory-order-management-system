"""Dashboard summary + analytics schemas."""
from pydantic import BaseModel

# Unlike SQLAlchemy relationships (which resolve by string name), Pydantic needs
# the actual ProductOut class to build the nested model - so we import it here.
from app.schemas.product import ProductOut


class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_count: int
    low_stock_products: list[ProductOut]


# --------------------------- Analytics (charts) ---------------------------
class OrdersPerDay(BaseModel):
    date: str  # ISO date, e.g. "2026-06-11"
    orders: int
    revenue: float


class TopProduct(BaseModel):
    name: str
    units: int


class StockBreakdown(BaseModel):
    healthy: int  # above the low-stock threshold
    low: int  # at or below threshold but still > 0
    out: int  # zero stock


class DashboardAnalytics(BaseModel):
    total_revenue: float
    orders_per_day: list[OrdersPerDay]
    top_products: list[TopProduct]
    stock_breakdown: StockBreakdown
