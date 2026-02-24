---
title: "SQL Deep-Dive: Code Examples"
tags: [sql, postgresql, window-functions, star-schema]
---

# SQL Deep-Dive: Code Examples

## 1. Window Functions

```sql
-- Top trip per pickup zone by fare (ROW_NUMBER)
SELECT
    pickup_zone_id,
    trip_id,
    fare_amount,
    ROW_NUMBER() OVER (
        PARTITION BY pickup_zone_id
        ORDER BY fare_amount DESC
    ) AS rn
FROM trips;
```

```sql
-- Compare each trip fare to the previous trip by the same driver (LAG)
SELECT
    trip_id,
    driver_id,
    fare_amount,
    LAG(fare_amount) OVER (
        PARTITION BY driver_id
        ORDER BY pickup_at
    ) AS prev_fare
FROM trips;
```

```sql
-- Running total of fares ordered by pickup time
SELECT
    trip_id,
    pickup_at,
    fare_amount,
    SUM(fare_amount) OVER (
        ORDER BY pickup_at
        ROWS UNBOUNDED PRECEDING
    ) AS running_total
FROM trips;
```

```sql
-- Median fare per borough using PERCENTILE_CONT
SELECT
    borough,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY fare_amount) AS median_fare
FROM trips t
JOIN dim_location l ON t.pickup_zone_id = l.location_key
GROUP BY borough;
```

## 2. CTEs — Readable Multi-Step Queries

```sql
WITH daily_stats AS (
    SELECT
        DATE(pickup_at) AS trip_date,
        COUNT(*)         AS trip_count,
        AVG(fare_amount) AS avg_fare
    FROM trips
    GROUP BY DATE(pickup_at)
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
    location_key  SERIAL PRIMARY KEY,
    zone          VARCHAR(100) NOT NULL,
    borough       VARCHAR(50)  NOT NULL,
    service_zone  VARCHAR(30)
);

CREATE TABLE fact_trips (
    trip_sk              BIGSERIAL PRIMARY KEY,
    date_key             INT REFERENCES dim_date(date_key),
    pickup_location_key  INT REFERENCES dim_location(location_key),
    dropoff_location_key INT REFERENCES dim_location(location_key),
    passenger_count      SMALLINT,
    trip_distance        NUMERIC(8,2),
    fare_amount          NUMERIC(10,2) NOT NULL,
    tip_amount           NUMERIC(10,2) DEFAULT 0,
    total_amount         NUMERIC(10,2) NOT NULL
);
```

## 4. EXPLAIN ANALYZE

```sql
-- Analyze a join query between fact and dimension tables
EXPLAIN ANALYZE
SELECT
    d.full_date,
    l.borough,
    f.fare_amount,
    f.tip_amount,
    f.total_amount
FROM fact_trips f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_location l ON f.pickup_location_key = l.location_key
WHERE d.year = 2024 AND d.month = 1
  AND l.borough = 'Manhattan';

-- Add indexes to improve performance
CREATE INDEX idx_fact_trips_date ON fact_trips(date_key);
CREATE INDEX idx_fact_trips_pickup_loc ON fact_trips(pickup_location_key);

-- Re-run after indexing (compare execution time)
EXPLAIN ANALYZE
SELECT
    d.full_date,
    l.borough,
    f.fare_amount,
    f.tip_amount,
    f.total_amount
FROM fact_trips f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_location l ON f.pickup_location_key = l.location_key
WHERE d.year = 2024 AND d.month = 1
  AND l.borough = 'Manhattan';
```

## 5. SCD Type 2

```sql
CREATE TABLE dim_location_scd2 (
    location_sk    SERIAL PRIMARY KEY,
    location_id    INT NOT NULL,
    zone           VARCHAR(100),
    borough        VARCHAR(50),
    service_zone   VARCHAR(30),
    effective_from DATE NOT NULL,
    effective_to   DATE DEFAULT '9999-12-31',
    is_current     BOOLEAN DEFAULT TRUE
);

-- Expire old record and insert new version
UPDATE dim_location_scd2
SET effective_to = CURRENT_DATE - 1, is_current = FALSE
WHERE location_id = 42 AND is_current = TRUE;

INSERT INTO dim_location_scd2 (location_id, zone, borough, service_zone, effective_from)
VALUES (42, 'East Harlem North', 'Manhattan', 'Boro Zone', CURRENT_DATE);
```

## 6. Materialized Views

```sql
CREATE MATERIALIZED VIEW mv_daily_borough_stats AS
SELECT
    d.full_date,
    l.borough,
    COUNT(*)             AS trips,
    SUM(f.fare_amount)   AS total_fare,
    SUM(f.tip_amount)    AS total_tip,
    AVG(f.trip_distance) AS avg_distance
FROM fact_trips f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_location l ON f.pickup_location_key = l.location_key
GROUP BY d.full_date, l.borough;

-- Refresh after loading new data
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_borough_stats;
```

## 7. JSONB — Semi-Structured Data

```sql
CREATE TABLE events (
    id      SERIAL PRIMARY KEY,
    payload JSONB NOT NULL
);

-- Query nested fields
SELECT
    payload->>'event_type' AS event_type,
    payload->'metadata'->>'source' AS source,
    (payload->>'amount')::NUMERIC AS amount
FROM events
WHERE payload->>'event_type' = 'trip_completed';

-- Containment operator: find events matching a pattern
SELECT *
FROM events
WHERE payload @> '{"event_type": "trip_completed", "status": "success"}';

-- GIN index for fast JSONB queries
CREATE INDEX idx_events_payload ON events USING GIN (payload);
```

## Resources

- [PostgreSQL Window Functions](https://www.postgresql.org/docs/current/tutorial-window.html)
- [PostgreSQL CTEs](https://www.postgresql.org/docs/current/queries-with.html)
- [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/current/sql-explain.html)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)

:::cheat
\dt | List tables
\d+ table_name | Describe table
EXPLAIN ANALYZE query | Execution plan
CREATE INDEX ... | Add index
REFRESH MATERIALIZED VIEW mv | Refresh view
:::
