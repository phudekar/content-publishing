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
│       ├── downloader.py      # httpx download logic
│       └── logging_setup.py   # Structured logging
├── tests/
│   ├── conftest.py
│   ├── test_app.py
│   └── test_downloader.py
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

[project.optional-dependencies]
dev = ["pytest>=8.1", "pytest-asyncio>=0.23", "ruff>=0.4"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

## 3. Structured Logging — JSON Formatter

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

def setup_logging(level: str = "INFO") -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    logging.basicConfig(level=level, handlers=[handler])
```

## 4. FastAPI Endpoint — POST /ingest

```python
from fastapi import FastAPI, BackgroundTasks
from taxi_ingestion.config import Settings
from taxi_ingestion.downloader import download_parquet

app = FastAPI(title="Taxi Ingestion Service")
settings = Settings()

@app.post("/ingest")
async def ingest(year: int, month: int, bg: BackgroundTasks):
    url = (
        f"https://d37ci6vzurychx.cloudfront.net/trip-data/"
        f"yellow_tripdata_{year}-{month:02d}.parquet"
    )
    bg.add_task(download_parquet, url, settings.data_dir)
    return {"status": "accepted", "url": url}
```

## 5. httpx with Retry — Resilient Downloads

```python
import httpx
from pathlib import Path
from datetime import datetime, timezone
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=30))
async def download_parquet(url: str, data_dir: str) -> Path:
    dest = Path(data_dir) / f"{datetime.now(timezone.utc):%Y%m%dT%H%M%S}.parquet"
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("GET", url) as resp:
            resp.raise_for_status()
            with open(dest, "wb") as f:
                async for chunk in resp.aiter_bytes(chunk_size=8192):
                    f.write(chunk)
    return dest
```

## 6. Config with pydantic-settings

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="TAXI_")

    data_dir: str = "./data/raw"
    log_level: str = "INFO"
    api_base_url: str = "https://d37ci6vzurychx.cloudfront.net"
    download_timeout: int = 120
    max_retries: int = 3
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
