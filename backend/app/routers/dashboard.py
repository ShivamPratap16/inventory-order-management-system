"""Dashboard endpoints - aggregate counts and chart analytics.

The analytics endpoint does its number-crunching in SQL (GROUP BY / SUM / COUNT)
rather than pulling every row into Python - the database is far better at
aggregation, and it keeps the response small.
"""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.config import settings
from app.database import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=schemas.DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()

    # "Low stock" = at or below the configurable threshold.
    low_stock_products = (
        db.query(models.Product)
        .filter(models.Product.quantity_in_stock <= settings.low_stock_threshold)
        .order_by(models.Product.quantity_in_stock.asc())
        .all()
    )

    return schemas.DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_count=len(low_stock_products),
        low_stock_products=low_stock_products,
    )


@router.get("/analytics", response_model=schemas.DashboardAnalytics)
def get_analytics(db: Session = Depends(get_db)):
    # ---- Total revenue across all orders ----
    total_revenue = db.query(
        func.coalesce(func.sum(models.Order.total_amount), 0)
    ).scalar()

    # ---- Orders + revenue per day for the last 7 days ----
    # Group orders by calendar day in SQL; days with no orders won't appear, so
    # we fill those gaps with zeros in Python to get a continuous 7-point series.
    today = datetime.utcnow().date()
    start = today - timedelta(days=6)
    rows = (
        db.query(
            func.date(models.Order.created_at).label("day"),
            func.count(models.Order.id).label("orders"),
            func.coalesce(func.sum(models.Order.total_amount), 0).label("revenue"),
        )
        .filter(func.date(models.Order.created_at) >= start)
        .group_by("day")
        .all()
    )
    by_day = {str(r.day): (r.orders, float(r.revenue)) for r in rows}
    orders_per_day = []
    for i in range(7):
        d = (start + timedelta(days=i)).isoformat()
        count, revenue = by_day.get(d, (0, 0.0))
        orders_per_day.append(
            schemas.OrdersPerDay(date=d, orders=count, revenue=revenue)
        )

    # ---- Top 5 products by units sold (sum of order line quantities) ----
    top_rows = (
        db.query(
            models.Product.name.label("name"),
            func.coalesce(func.sum(models.OrderItem.quantity), 0).label("units"),
        )
        .join(models.OrderItem, models.OrderItem.product_id == models.Product.id)
        .group_by(models.Product.id)
        .order_by(func.sum(models.OrderItem.quantity).desc())
        .limit(5)
        .all()
    )
    top_products = [
        schemas.TopProduct(name=r.name, units=int(r.units)) for r in top_rows
    ]

    # ---- Stock health breakdown ----
    threshold = settings.low_stock_threshold
    healthy = (
        db.query(models.Product)
        .filter(models.Product.quantity_in_stock > threshold)
        .count()
    )
    low = (
        db.query(models.Product)
        .filter(
            models.Product.quantity_in_stock > 0,
            models.Product.quantity_in_stock <= threshold,
        )
        .count()
    )
    out = (
        db.query(models.Product)
        .filter(models.Product.quantity_in_stock == 0)
        .count()
    )

    return schemas.DashboardAnalytics(
        total_revenue=float(total_revenue),
        orders_per_day=orders_per_day,
        top_products=top_products,
        stock_breakdown=schemas.StockBreakdown(healthy=healthy, low=low, out=out),
    )
