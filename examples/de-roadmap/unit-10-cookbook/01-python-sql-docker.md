---
title: "Cookbook: Python, SQL & Docker"
tags: [python, sql, docker, cheat-sheet]
---

# Cookbook: Python, SQL & Docker

## Python Cheat Sheet

:::cheat
python -m venv .venv | Create virtual environment
source .venv/bin/activate | Activate venv (macOS/Linux)
pip install -e ".[dev]" | Install package in editable mode
pip freeze > requirements.txt | Lock dependencies
pip-compile pyproject.toml | Generate locked deps (pip-tools)
pytest tests/ -v --cov | Run tests with coverage
ruff check . --fix | Lint and auto-fix
mypy src/ --strict | Type check
python -m build | Build distribution package
uvicorn app:app --reload | Run FastAPI dev server
:::

### Common Patterns

```python
# Retry with tenacity
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
def fetch_data(url: str) -> dict:
    resp = httpx.get(url, timeout=30)
    resp.raise_for_status()
    return resp.json()
```

```python
# Structured logging
import logging, json, sys

handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter(json.dumps({
    "ts": "%(asctime)s", "level": "%(levelname)s", "msg": "%(message)s"
})))
logger = logging.getLogger(__name__)
logger.addHandler(handler)
```

```python
# Dataclass for data contracts
from dataclasses import dataclass, asdict

@dataclass(frozen=True)
class Trade:
    symbol: str
    price: float
    quantity: int

    @property
    def value(self) -> float:
        return self.price * self.quantity
```

### Data Engineering Patterns

```python
# Atomic file writes (no partial files on crash)
import tempfile, shutil
with tempfile.NamedTemporaryFile(
    dir="data/", delete=False, suffix=".parquet"
) as tmp:
    df.to_parquet(tmp.name)
    shutil.move(tmp.name, "data/final.parquet")

# Connection pooling with context manager
from contextlib import contextmanager
from sqlalchemy import create_engine

@contextmanager
def get_engine():
    engine = create_engine(DATABASE_URL,
        pool_size=5, pool_recycle=3600)
    try:
        yield engine
    finally:
        engine.dispose()

# Parallel downloads with asyncio
import asyncio
async def download_all(urls):
    async with httpx.AsyncClient() as c:
        tasks = [c.get(url) for url in urls]
        return await asyncio.gather(*tasks)
```

### Pandas for Data Engineering

```python
# Read large files efficiently
df = pd.read_parquet("data.parquet",
    columns=["id", "amount", "ts"])  # read only needed cols

# Chunked CSV reading
for chunk in pd.read_csv("big.csv", chunksize=100_000):
    process(chunk)

# Deduplication
df = df.drop_duplicates(subset=["id"], keep="last")

# Type-safe loading
dtypes = {"id": "int64", "amount": "float64",
          "status": "category"}
df = pd.read_csv("data.csv", dtype=dtypes,
    parse_dates=["created_at"])

# Efficient groupby + agg
result = df.groupby("category").agg(
    total=("amount", "sum"),
    count=("id", "count"),
    avg=("amount", "mean"),
).reset_index()

# Write to Parquet (always prefer over CSV)
df.to_parquet("output.parquet", index=False,
    engine="pyarrow", compression="snappy")
```

## Resources

- [Python Documentation](https://docs.python.org/3/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/)
- [Docker Documentation](https://docs.docker.com/)
- [Tenacity (Retry Library)](https://tenacity.readthedocs.io/)
- [Ruff Linter](https://docs.astral.sh/ruff/)

---

## SQL Cheat Sheet

:::cheat
\dt | List all tables
\d+ table_name | Describe table with details
\di | List indexes
EXPLAIN ANALYZE query; | Show execution plan
CREATE INDEX idx ON t(col); | Create index
VACUUM ANALYZE table; | Update statistics
\copy t FROM 'file.csv' CSV HEADER | Import CSV
pg_dump -Fc db > backup.dump | Backup database
:::

### Window Functions

```sql
-- Rank, lag, running total in one query
SELECT
    date, revenue,
    ROW_NUMBER() OVER (ORDER BY revenue DESC) AS rank,
    LAG(revenue) OVER (ORDER BY date) AS prev_day,
    SUM(revenue) OVER (ORDER BY date ROWS UNBOUNDED PRECEDING) AS running_total
FROM daily_sales;
```

### CTE Pattern

```sql
WITH cleaned AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_at DESC) AS rn
    FROM raw_events
),
deduped AS (
    SELECT * FROM cleaned WHERE rn = 1
)
SELECT * FROM deduped WHERE event_type = 'purchase';
```

### Advanced SQL Patterns

```sql
-- Deduplicate rows (keep latest per key)
DELETE FROM events a USING events b
WHERE a.id < b.id
  AND a.event_key = b.event_key;

-- Or with ROW_NUMBER:
WITH ranked AS (
    SELECT *, ROW_NUMBER() OVER (
        PARTITION BY event_key
        ORDER BY created_at DESC
    ) AS rn
    FROM events
)
SELECT * FROM ranked WHERE rn = 1;

-- Gap detection (find missing dates)
WITH date_series AS (
    SELECT generate_series(
        '2024-01-01'::date,
        '2024-12-31'::date,
        '1 day'::interval
    )::date AS dt
)
SELECT dt AS missing_date
FROM date_series
LEFT JOIN daily_data d ON d.report_date = dt
WHERE d.report_date IS NULL;

-- Pivot with FILTER (PostgreSQL)
SELECT
    pickup_date,
    COUNT(*) FILTER (WHERE borough = 'Manhattan') AS manhattan,
    COUNT(*) FILTER (WHERE borough = 'Brooklyn') AS brooklyn,
    COUNT(*) FILTER (WHERE borough = 'Queens') AS queens
FROM trips JOIN zones USING (zone_id)
GROUP BY pickup_date;
```

### psql Meta-Commands

:::cheat
\dt | List tables
\d+ tablename | Describe table with details
\timing | Toggle query timing
:::

---

## Docker Cheat Sheet

:::cheat
docker build -t app . | Build image
docker run -p 8080:80 app | Run container with port mapping
docker exec -it cid bash | Shell into running container
docker logs -f container_id | Follow container logs
docker ps -a | List all containers
docker images | List local images
docker system prune -a | Remove unused resources
docker-compose up -d | Start stack in background
docker-compose down -v | Stop stack and remove volumes
docker-compose logs -f svc | Follow service logs
:::

### Multi-Stage Dockerfile

```dockerfile
# Build stage
FROM python:3.11-slim AS builder
WORKDIR /app
COPY pyproject.toml .
RUN pip install --no-cache-dir .

# Runtime stage
FROM python:3.11-slim
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY src/ /app/src/
USER 1000
CMD ["python", "-m", "app"]
```

### Docker Compose Pattern

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: warehouse
      POSTGRES_PASSWORD: ${DB_PASS}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 5

volumes:
  pgdata:
```

### Dockerfile Best Practices

```dockerfile
# 1. Use specific base tags (not :latest)
FROM python:3.11-slim

# 2. Copy dependency files first (layer caching)
COPY pyproject.toml .
RUN pip install --no-cache-dir .

# 3. Copy source code last (changes most often)
COPY src/ src/

# 4. Run as non-root user
RUN useradd -m app
USER app
```

### Docker Troubleshooting

```bash
# Debug a failing container
docker logs container_name --tail 50
docker inspect container_name | jq '.[0].State'
docker exec -it container_name /bin/sh

# Check resource usage
docker stats --no-stream

# View layer sizes in an image
docker history myimage:v1 --human

# Network debugging
docker network inspect bridge
docker exec container_name ping other_container

# Clean everything (nuclear option)
docker system prune -af --volumes

# Check what is using disk space
docker system df -v
```
