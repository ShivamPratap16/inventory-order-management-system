# Lightweight, production-oriented image for the FastAPI backend.
FROM python:3.12-slim

# Keep Python output unbuffered and skip writing .pyc files.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install dependencies first so this layer is cached when only app code changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# Run as a non-root user for safety.
RUN useradd --create-home appuser
USER appuser

EXPOSE 8000

# Bind to 0.0.0.0 so the container is reachable from outside. The host
# platform usually injects a $PORT env var (Render/Railway) - default to 8000.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
