---
title: "Python Deep-Dive: Code Examples"
tags: [python, fastapi, pytest, httpx]
---

# Python Deep-Dive: Code Examples

## 1. Project Structure

```
taxi-ingestion/
├── src/
│   └── taxi_ingestion/
│       ├── __init__.py
│       ├── app.py            # FastAPI application
│       ├── config.py          # pydantic-settings config
│       ├── ingestion.py       # httpx download logic
│       ├── logging_config.py  # Structured logging
│       └── models.py          # Data models
├── tests/
│   ├── conftest.py
│   ├── test_app.py
│   └── test_ingestion.py
├── pyproject.toml
├── .env
└── README.md
```

## 2. pyproject.toml — Modern Python Project Config

```toml
[project]
name = "taxi-ingestion"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.110",
    "uvicorn[standard]>=0.29",
    "httpx>=0.27",
    "pydantic-settings>=2.2",
    "tenacity>=8.3",
]

[project.scripts]
taxi-ingest = "taxi_ingestion.app:main"

[project.optional-dependencies]
dev = ["pytest>=8.1", "pytest-asyncio>=0.23", "pytest-cov>=5.0", "ruff>=0.4"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]
line-length = 99
target-version = "py311"
```

## 3. Structured Logging — logging_config.py

```python
import logging
import json
from datetime import datetime, timezone

class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    return logger
```

## 4. FastAPI Application — app.py

```python
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel, field_validator
from taxi_ingestion.config import Settings
from taxi_ingestion.ingestion import download_parquet
from pathlib import Path

app = FastAPI(title="Taxi Ingestion Service")
settings = Settings()

class IngestRequest(BaseModel):
    year: int
    month: int

    @field_validator("month")
    @classmethod
    def month_in_range(cls, v: int) -> int:
        if not 1 <= v <= 12:
            raise ValueError("month must be between 1 and 12")
        return v

@app.get("/health")
async def health():
    return {"status": "ok", "service": "taxi-ingestion"}

@app.post("/ingest")
async def ingest(req: IngestRequest, bg: BackgroundTasks):
    url = (
        f"https://d37ci6vzurychx.cloudfront.net/trip-data/"
        f"yellow_tripdata_{req.year}-{req.month:02d}.parquet"
    )
    dest = Path(settings.data_dir)
    bg.add_task(download_parquet, url, dest)
    return {"status": "accepted", "url": url}
```

## 5. Data Models — models.py

```python
from dataclasses import dataclass
from datetime import datetime

@dataclass
class TaxiTrip:
    vendor_id: int
    pickup_at: datetime
    dropoff_at: datetime
    passenger_count: int
    distance: float
    fare: float
    tip: float
    total: float

    def to_dict(self) -> dict:
        return {
            "vendor_id": self.vendor_id,
            "pickup_at": self.pickup_at.isoformat(),
            "dropoff_at": self.dropoff_at.isoformat(),
            "passenger_count": self.passenger_count,
            "distance": self.distance,
            "fare": self.fare,
            "tip": self.tip,
            "total": self.total,
        }

    @property
    def duration_minutes(self) -> float:
        return (self.dropoff_at - self.pickup_at).total_seconds() / 60
```

## 6. Resilient Downloads — ingestion.py

```python
import httpx
from pathlib import Path
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=30))
def download_parquet(url: str, dest: Path) -> Path:
    filepath = dest / url.split("/")[-1]
    with httpx.Client(timeout=120) as client:
        with client.stream("GET", url) as resp:
            resp.raise_for_status()
            with open(filepath, "wb") as f:
                for chunk in resp.iter_bytes(chunk_size=8192):
                    f.write(chunk)
    return filepath
```

## 7. Config with pydantic-settings — config.py

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    model_config = {"env_prefix": "TAXI_"}

    data_dir: str = "./data/raw"
    log_level: str = "INFO"
    api_base_url: str = "https://d37ci6vzurychx.cloudfront.net"
    download_timeout: int = 120
    max_retries: int = 3
```

## 8. Tests — test_app.py

```python
from fastapi.testclient import TestClient
from taxi_ingestion.app import app

client = TestClient(app)

def test_ingest_returns_accepted():
    resp = client.post("/ingest", json={"year": 2024, "month": 1})
    assert resp.status_code == 200
    assert resp.json()["status"] == "accepted"

def test_ingest_validates_month():
    resp = client.post("/ingest", json={"year": 2024, "month": 13})
    assert resp.status_code == 422

def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
```

## Resources

- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [httpx Async Guide](https://www.python-httpx.org/async/)
- [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- [Tenacity Retry Library](https://tenacity.readthedocs.io/)
- [Hatchling Build Backend](https://hatch.pypa.io/latest/)

:::cheat
python -m venv .venv | Create virtual env
pip install -e ".[dev]" | Install editable
pytest tests/ -v | Run tests
ruff check . | Lint code
uvicorn app:app --reload | Dev server
:::
