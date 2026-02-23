---
title: "Python Deep Dive"
tags: [python, typing, testing]
---

# Python Deep Dive: Type Safety & Testing

:::goal
Write production-quality Python with type annotations, comprehensive tests, and clean architecture.
:::

## Type Annotations

Modern Python uses type hints to catch bugs early:

```python
from typing import Optional
from datetime import datetime

def process_trade(
    symbol: str,
    price: float,
    quantity: int,
    timestamp: Optional[datetime] = None,
) -> dict[str, any]:
    """Process a single trade event."""
    return {
        "symbol": symbol,
        "price": price,
        "quantity": quantity,
        "timestamp": timestamp or datetime.now(),
        "value": price * quantity,
    }
```

## Testing with Pytest

```python
import pytest
from my_pipeline.processor import process_trade

def test_process_trade_calculates_value():
    result = process_trade("AAPL", 150.0, 10)
    assert result["value"] == 1500.0
    assert result["symbol"] == "AAPL"

def test_process_trade_default_timestamp():
    result = process_trade("GOOG", 100.0, 5)
    assert result["timestamp"] is not None
```

## Data Pipeline Pattern

:::diagram
graph LR
    Source["Source (Kafka)"] --> Transform["Transform (Polars)"]
    Transform --> Validate["Validate (GX)"]
    Validate --> Sink["Sink (Iceberg)"]
:::

:::deliverables
- Type-annotated data models
- Pytest test suite with >80% coverage
- Mypy strict mode passing
- CI pipeline with lint + test + type check
:::
