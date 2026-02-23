---
title: "SQL Deep-Dive: Code Examples"
tags: [sql, postgresql, window-functions, star-schema]
---

# SQL Deep-Dive: Code Examples

## 1. Window Functions

```sql
-- Rank drivers by total revenue per month
SELECT
    driver_id,
    DATE_TRUNC('month', pickup_time) AS month,
    SUM(fare_amount)                 AS revenue,
    RANK() OVER (
        PARTITION BY DATE_TRUNC('month', pickup_time)
        ORDER BY SUM(fare_amount) DESC
    ) AS revenue_rank
FROM trips
GROUP BY driver_id, DATE_TRUNC('month', pickup_time);
```

```sql
-- Compare each trip fare to the previous trip (LAG)
SELECT
    trip_id,
    pickup_time,
    fare_amount,
    LAG(fare_amount) OVER (ORDER BY pickup_time) AS prev_fare,
    fare_amount - LAG(fare_amount) OVER (ORDER BY pickup_time) AS fare_diff
FROM trips
WHERE driver_id = 42;
```

## 2. CTEs — Readable Multi-Step Queries

```sql
WITH daily_stats AS (
    SELECT
        DATE(pickup_time) AS trip_date,
        COUNT(*)           AS trip_count,
        AVG(fare_amount)   AS avg_fare
    FROM trips
    GROUP BY DATE(pickup_time)
),
ranked_days AS (
    SELECT *,
        NTILE(4) OVER (ORDER BY trip_count) AS quartile
    FROM daily_stats
)
SELECT trip_date, trip_count, avg_fare, quartile
FROM ranked_days
WHERE quartile = 4
ORDER BY trip_count DESC;
```

## 3. Star Schema DDL

```sql
CREATE TABLE dim_date (
    date_key     INT PRIMARY KEY,
    full_date    DATE NOT NULL UNIQUE,
    year         SMALLINT NOT NULL,
    quarter      SMALLINT NOT NULL,
    month        SMALLINT NOT NULL,
    day_of_week  SMALLINT NOT NULL,
    is_weekend   BOOLEAN NOT NULL
);

CREATE TABLE dim_location (
    location_key SERIAL PRIMARY KEY,
    zone         VARCHAR(100) NOT NULL,
    borough      VARCHAR(50)  NOT NULL,
    latitude     NUMERIC(9,6),
    longitude    NUMERIC(9,6)
);

CREATE TABLE dim_payment (
    payment_key  SERIAL PRIMARY KEY,
    payment_type VARCHAR(30) NOT NULL,
    description  VARCHAR(100)
);

CREATE TABLE fact_trips (
    trip_id       BIGSERIAL PRIMARY KEY,
    date_key      INT REFERENCES dim_date(date_key),
    pickup_loc_key INT REFERENCES dim_location(location_key),
    dropoff_loc_key INT REFERENCES dim_location(location_key),
    payment_key   INT REFERENCES dim_payment(payment_key),
    fare_amount   NUMERIC(10,2) NOT NULL,
    tip_amount    NUMERIC(10,2) DEFAULT 0,
    trip_distance NUMERIC(8,2),
    duration_min  NUMERIC(8,2)
);
```

## 4. EXPLAIN ANALYZE

```sql
-- Before: sequential scan
EXPLAIN ANALYZE
SELECT * FROM fact_trips WHERE date_key BETWEEN 20240101 AND 20240131;

-- Add index
CREATE INDEX idx_fact_trips_date ON fact_trips(date_key);

-- After: index scan (compare execution time)
EXPLAIN ANALYZE
SELECT * FROM fact_trips WHERE date_key BETWEEN 20240101 AND 20240131;
```

## 5. SCD Type 2

```sql
CREATE TABLE dim_driver_scd2 (
    driver_surrogate SERIAL PRIMARY KEY,
    driver_id        INT NOT NULL,
    name             VARCHAR(100),
    license_class    VARCHAR(10),
    effective_from   DATE NOT NULL,
    effective_to     DATE DEFAULT '9999-12-31',
    is_current       BOOLEAN DEFAULT TRUE
);

-- Expire old record and insert new version
UPDATE dim_driver_scd2
SET effective_to = CURRENT_DATE - 1, is_current = FALSE
WHERE driver_id = 101 AND is_current = TRUE;

INSERT INTO dim_driver_scd2 (driver_id, name, license_class, effective_from)
VALUES (101, 'Jane Smith', 'A+', CURRENT_DATE);
```

## 6. Materialized Views

```sql
CREATE MATERIALIZED VIEW mv_monthly_revenue AS
SELECT
    d.year,
    d.month,
    l.borough,
    COUNT(*)             AS trips,
    SUM(f.fare_amount)   AS total_revenue,
    AVG(f.trip_distance) AS avg_distance
FROM fact_trips f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_location l ON f.pickup_loc_key = l.location_key
GROUP BY d.year, d.month, l.borough;

-- Refresh after loading new data
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_revenue;
```

## Resources

- [PostgreSQL Window Functions](https://www.postgresql.org/docs/current/tutorial-window.html)
- [PostgreSQL CTEs](https://www.postgresql.org/docs/current/queries-with.html)
- [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/current/sql-explain.html)

:::cheat
\dt | List tables
\d+ table_name | Describe table
EXPLAIN ANALYZE query | Execution plan
CREATE INDEX ... | Add index
REFRESH MATERIALIZED VIEW mv | Refresh view
:::
