---
title: "Docker Deep-Dive: Code Examples"
tags: [docker, dockerfile, docker-compose, networking]
---

# Docker Deep-Dive: Code Examples

## 1. Multi-Stage Dockerfile

```dockerfile
# Stage 1: Build dependencies
FROM python:3.11-slim AS builder
WORKDIR /build
COPY pyproject.toml .
RUN pip install --no-cache-dir --prefix=/install .

# Stage 2: Runtime image
FROM python:3.11-slim AS runtime
COPY --from=builder /install /usr/local
WORKDIR /app
COPY src/ ./src/
EXPOSE 8000
CMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 2. Docker Compose Stack

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: airflow
      POSTGRES_PASSWORD: airflow
      POSTGRES_DB: airflow
    volumes:
      - pg-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U airflow"]
      interval: 10s
      retries: 5

  airflow-webserver:
    build: .
    command: airflow webserver
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@postgres/airflow
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      retries: 3

  airflow-scheduler:
    build: .
    command: airflow scheduler
    depends_on:
      airflow-webserver:
        condition: service_healthy
    environment:
      AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@postgres/airflow

  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@local.dev
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  pg-data:

networks:
  default:
    name: data-stack
```

## 3. Health Checks

```dockerfile
# Dockerfile health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1
```

```python
# FastAPI health endpoint
@app.get("/health")
async def health():
    return {"status": "ok", "service": "taxi-ingestion"}
```

## 4. Docker Networking

```yaml
# Custom networks for service isolation
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge

services:
  api:
    networks: [frontend, backend]
  postgres:
    networks: [backend]      # Not reachable from frontend
  nginx:
    networks: [frontend]
    ports:
      - "80:80"              # Only nginx is exposed
```

## 5. Volume Management

```yaml
volumes:
  pg-data:                   # Named volume — persists across restarts
    driver: local

services:
  postgres:
    volumes:
      - pg-data:/var/lib/postgresql/data   # Named volume
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql  # Bind mount
```

```bash
# Inspect and manage volumes
docker volume ls
docker volume inspect pg-data
docker volume rm pg-data
```

## Resources

- [Dockerfile Best Practices](https://docs.docker.com/build/building/best-practices/)
- [Compose File Reference](https://docs.docker.com/reference/compose-file/)
- [Docker Networking Guide](https://docs.docker.com/engine/network/)

:::cheat
docker build -t myapp . | Build image
docker compose up -d | Start stack detached
docker compose logs -f svc | Follow service logs
docker compose down -v | Stop and remove volumes
docker system prune -a | Clean all unused resources
:::
