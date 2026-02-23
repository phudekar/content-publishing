---
title: "Python for Data Engineering — Overview"
tags: [python, fastapi, packaging, logging]
---

# Week 1: Python for Data Engineering

## Summary

This week focuses on leveling up your Python beyond scripting into production-grade engineering. You already know Python basics — now you'll learn how professional data engineers structure projects: proper packaging with `pyproject.toml`, isolated virtual environments, structured logging (not print statements), and building APIs that ingest data from external sources. The emphasis is on writing code that is testable, maintainable, and deployable — not just functional.

**Why these tools matter and what they replaced:**

- **pyproject.toml over setup.py** — Before `pyproject.toml`, Python projects used `setup.py`, which was imperative, hard to maintain, and required executing arbitrary code just to read project metadata. `pyproject.toml` is declarative, standardized (PEP 621), and understood by all modern build tools (pip, setuptools, hatch, poetry) without running code.
- **Structured logging over print()** — Before structured logging, engineers used `print()` statements for debugging. Print output cannot be filtered by severity, searched across services, or routed to monitoring systems like Datadog or CloudWatch. Python's `logging` module with JSON formatters produces machine-readable output that integrates with log aggregation pipelines.
- **FastAPI over Flask** — Before FastAPI, Flask was the standard Python web framework, but it lacked native async support, had no built-in request/response validation, and required separate libraries for OpenAPI documentation. FastAPI provides async-first design, automatic Pydantic validation, and generated interactive API docs out of the box.
- **httpx + tenacity over manual retry loops** — Before `httpx` with `tenacity`, engineers wrote manual retry loops with `requests` that were error-prone, lacked exponential backoff, and had no consistent timeout handling. `httpx` adds async support and connection pooling, while `tenacity` provides declarative retry policies with configurable backoff strategies.

## Key Topics

- **[pyproject.toml](https://packaging.python.org/en/latest/guides/writing-pyproject-toml/)** — Modern Python packaging standard replacing setup.py. Defines project metadata, dependencies, and build system in one file.
- **[venv](https://docs.python.org/3/library/venv.html) & [pip-tools](https://pip-tools.readthedocs.io/)** — Virtual environments isolate project dependencies. pip-tools generates locked requirements for reproducible builds.
- **[Structured Logging](https://docs.python.org/3/library/logging.html)** — Python's logging module with JSON formatters replaces print(). Enables log aggregation and filtering in production.
- **[httpx](https://www.python-httpx.org/)** — Modern async-capable HTTP client for Python. Supports streaming downloads, retries, and connection pooling.
- **[FastAPI](https://fastapi.tiangolo.com/)** — High-performance Python web framework with automatic OpenAPI docs. Built on Starlette and Pydantic for type-safe APIs.
- **[pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)** — Environment-driven configuration using Pydantic models. Reads from .env files with type validation.
- **[pytest](https://docs.pytest.org/)** — Python's de facto testing framework. Supports fixtures, parametrize, and plugins for async/coverage.
- **[Type Hints](https://docs.python.org/3/library/typing.html) & Dataclasses** — Python's built-in type annotation system and structured data containers. Enables mypy static type checking.

## Resources

- [Python Packaging Guide](https://packaging.python.org/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [httpx Documentation](https://www.python-httpx.org/)
- [pytest Documentation](https://docs.pytest.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)

:::goal
Build production-quality Python skills — learn to write code that other engineers can read, test, and deploy with confidence.
:::

:::deliverables
- Python project with proper packaging (pyproject.toml, src layout)
- FastAPI ingestion service pulling from a public API
- Raw JSON saved with timestamped filenames
- Structured logging throughout
- Unit tests with pytest
:::

:::diagram
graph LR
    A["Public API"] -->|httpx| B["FastAPI"]
    B -->|Download| C["httpx"]
    C -->|Write JSON| D["Local Storage"]
    D -->|Validate| E["pytest"]
:::

:::cheat
python -m venv .venv | Create virtual env
pip install -e ".[dev]" | Install editable
pytest tests/ -v | Run tests
ruff check . | Lint code
uvicorn app:app --reload | Dev server
:::
