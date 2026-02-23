---
title: "Python for Data Engineering — Overview"
tags: [python, fastapi, packaging, logging]
---

# Week 1: Python for Data Engineering

## Summary

This week focuses on leveling up Python beyond scripting into production-grade engineering — proper packaging with pyproject.toml, isolated virtual environments, structured logging (not print statements), and building APIs that ingest data from external sources.

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
