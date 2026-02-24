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
RUN useradd -m appuser
COPY --from=builder /install /usr/local
WORKDIR /app
COPY src/ ./src/
USER appuser
EXPOSE 8000
CMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 2. Docker Compose — Ingestion Stack

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: taxi
      POSTGRES_PASSWORD: taxi
      POSTGRES_DB: taxi
    volumes:
      - pg-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taxi"]
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 10s

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

  ingestion:
    build: .
    ports:
      - "8000:8000"
    environment:
      TAXI_DATA_DIR: /data/raw
      TAXI_DB_HOST: postgres
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s

volumes:
  pg-data:

networks:
  default:
    name: data-stack
    ipam:
      config:
        - subnet: 172.20.0.0/16
          gateway: 172.20.0.1
```

## 3. .dockerignore

```
.git
__pycache__
.env
*.pyc
.venv
data/
```

## 4. Health Checks

```dockerfile
# Dockerfile HEALTHCHECK instruction
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1
```

```python
# FastAPI health endpoint
@app.get("/health")
async def health():
    return {"status": "ok", "service": "taxi-ingestion"}
```

## 5. Docker Networking

```yaml
# Custom network with IPAM config for deterministic addressing
networks:
  default:
    name: data-stack
    ipam:
      config:
        - subnet: 172.20.0.0/16
          gateway: 172.20.0.1
```

:::diagram
graph TD
    subgraph "Docker Network: data-stack (172.20.0.0/16)"
        PG["postgres:16-alpine<br/>:5432"]
        PGA["pgadmin4<br/>:5050"]
        APP["ingestion:latest<br/>:8000"]
    end
    PGA -->|"postgres://taxi@postgres"| PG
    APP -->|"postgres://taxi@postgres"| PG
    VOL[("pg-data volume")] --- PG
:::

## 6. Volume Management

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

# Backup a named volume
docker run --rm -v pg-data:/data -v $(pwd):/backup busybox tar czf /backup/pg-backup.tar.gz /data

# Remove volume
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
