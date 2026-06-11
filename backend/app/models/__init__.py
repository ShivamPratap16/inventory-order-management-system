"""Models package.

Re-exporting every model here does two important jobs:

1. Keeps the existing import style working - the rest of the app does
   `from app import models` and then `models.Product`, `models.Order`, etc.
   Without these re-exports that would break after splitting the file.

2. Guarantees every model class is imported (and therefore registered on
   Base.metadata) as soon as the package is imported, so
   `Base.metadata.create_all()` in main.py sees all four tables.

__all__ documents the public surface of the package.
"""
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.models.product import Product

__all__ = ["Product", "Customer", "Order", "OrderItem"]
