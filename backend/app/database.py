"""Database engine, session factory and the FastAPI dependency that hands a
session to each request and always closes it afterwards.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Yield a DB session per request and guarantee it is closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
