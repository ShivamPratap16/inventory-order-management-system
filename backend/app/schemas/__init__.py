"""Schemas package.

Re-exports every schema so the rest of the app keeps using
`from app import schemas` and then `schemas.ProductOut`, `schemas.OrderCreate`,
etc. - exactly as before the split.
"""
from app.schemas.customer import CustomerBase, CustomerCreate, CustomerOut
from app.schemas.dashboard import (
    DashboardAnalytics,
    DashboardStats,
    OrdersPerDay,
    StockBreakdown,
    TopProduct,
)
from app.schemas.order import OrderCreate, OrderItemCreate, OrderItemOut, OrderOut
from app.schemas.product import ProductBase, ProductCreate, ProductOut, ProductUpdate

__all__ = [
    "ProductBase",
    "ProductCreate",
    "ProductUpdate",
    "ProductOut",
    "CustomerBase",
    "CustomerCreate",
    "CustomerOut",
    "OrderItemCreate",
    "OrderCreate",
    "OrderItemOut",
    "OrderOut",
    "DashboardStats",
    "DashboardAnalytics",
    "OrdersPerDay",
    "StockBreakdown",
    "TopProduct",
]
