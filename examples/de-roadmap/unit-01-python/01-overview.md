---
title: "Week 1 Overview"
tags: [python, packaging, venv]
---

# Week 1: Python for Data Engineering

:::goal
Master production-grade Python packaging and environment management for data engineering projects.
:::

## Why Python?

Python is the lingua franca of data engineering. From ETL scripts to ML pipelines, Python's ecosystem powers modern data platforms:

- **Pandas / Polars** for data transformation
- **PySpark** for distributed processing
- **Airflow / Dagster** for orchestration
- **SQLAlchemy / DuckDB** for database access

## Environment Setup

```bash
# Create a virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -e ".[dev]"
```

## Project Structure

```python
# pyproject.toml — modern Python packaging
[project]
name = "my-etl-pipeline"
version = "0.1.0"
dependencies = [
    "polars>=0.20",
    "duckdb>=0.10",
]
```

:::deliverables
- Working Python virtual environment
- `pyproject.toml` with proper dependency management
- Pre-commit hooks configured
- Unit test framework (pytest) set up
:::

:::cheat
python -m venv .venv | Create virtual environment
source .venv/bin/activate | Activate venv
pip install -e ".[dev]" | Install in editable mode
pytest tests/ | Run tests
ruff check . | Lint code
:::
