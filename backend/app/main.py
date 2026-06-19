"""FastAPI application entry point.

Wires the routers together, configures CORS so the React frontend can call the
API from the browser, and creates the database tables on startup.

Note on table creation: for a small assessment project we create tables directly
with SQLAlchemy's metadata on startup. A larger production system would use a
migration tool such as Alembic instead.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import customers, dashboard, orders, products

from app import models

app = FastAPI(
    title="Inventory & Order Management API",
    description="Manage products, customers, orders and inventory.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "inventory-order-management"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}


app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)
