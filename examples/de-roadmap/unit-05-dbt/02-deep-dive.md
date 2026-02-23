---
title: "dbt Deep-Dive: Code Examples"
tags: [dbt, sql, jinja, testing]
---

# dbt Deep-Dive: Code Examples

## 1. dbt_project.yml

```yaml
name: taxi_analytics
version: "1.0.0"
config-version: 2
profile: taxi_analytics

model-paths: ["models"]
test-paths: ["tests"]
macro-paths: ["macros"]
seed-paths: ["seeds"]
snapshot-paths: ["snapshots"]

models:
  taxi_analytics:
    staging:
      +materialized: view
      +schema: staging
    intermediate:
      +materialized: view
    marts:
      +materialized: table
      +schema: analytics
```

## 2. Staging Model — stg_trips.sql

```sql
-- models/staging/stg_trips.sql
with source as (
    select * from {{ source('raw', 'taxi_trips') }}
),

renamed as (
    select
        trip_id,
        pickup_datetime,
        dropoff_datetime,
        pickup_location_id,
        dropoff_location_id,
        passenger_count,
        trip_distance,
        cast(fare_amount as numeric(10,2)) as fare_amount,
        cast(tip_amount as numeric(10,2))  as tip_amount,
        payment_type
    from source
    where pickup_datetime is not null
)

select * from renamed
```

## 3. Mart Model — fct_daily_revenue.sql

```sql
-- models/marts/fct_daily_revenue.sql
with trips as (
    select * from {{ ref('stg_trips') }}
),

daily_agg as (
    select
        date_trunc('day', pickup_datetime) as trip_date,
        pickup_location_id,
        count(*)                            as total_trips,
        sum(fare_amount)                    as total_fare,
        sum(tip_amount)                     as total_tips,
        avg(trip_distance)                  as avg_distance
    from trips
    group by 1, 2
)

select * from daily_agg
```

## 4. Schema Tests — schema.yml

```yaml
# models/staging/schema.yml
version: 2

sources:
  - name: raw
    schema: public
    tables:
      - name: taxi_trips
        loaded_at_field: tpep_pickup_datetime
        freshness:
          warn_after: {count: 24, period: hour}
          error_after: {count: 48, period: hour}

models:
  - name: stg_taxi_trips
    columns:
      - name: pickup_at
        tests: [not_null]
      - name: fare_amount
        tests:
          - not_null
          - dbt_utils.accepted_range:
              min_value: 0
              max_value: 1000

  - name: stg_trips
    description: "Cleaned taxi trip records"
    columns:
      - name: trip_id
        tests:
          - unique
          - not_null
      - name: fare_amount
        tests:
          - not_null
      - name: payment_type
        tests:
          - accepted_values:
              values: [1, 2, 3, 4, 5]
      - name: pickup_location_id
        tests:
          - relationships:
              to: ref('dim_locations')
              field: location_id
```

## 5. Jinja Macro — cents_to_dollars

```sql
-- macros/cents_to_dollars.sql
{% macro cents_to_dollars(column_name, precision=2) %}
    round(cast({{ column_name }} as numeric) / 100, {{ precision }})
{% endmacro %}
```

Usage in a model:

```sql
select
    trip_id,
    {{ cents_to_dollars('fare_amount_cents') }} as fare_dollars,
    {{ cents_to_dollars('tip_amount_cents') }}  as tip_dollars
from {{ ref('stg_raw_payments') }}
```

## 6. Incremental Model

```sql
-- models/intermediate/int_trips_incremental.sql
{{
    config(
        materialized='incremental',
        unique_key='trip_id',
        incremental_strategy='merge'
    )
}}

select
    trip_id,
    pickup_datetime,
    fare_amount,
    current_timestamp as loaded_at
from {{ ref('stg_trips') }}

{% if is_incremental() %}
where pickup_datetime > (
    select max(pickup_datetime) from {{ this }}
)
{% endif %}
```

## 7. Sources & Freshness

```yaml
# models/staging/sources.yml
version: 2

sources:
  - name: raw
    database: warehouse
    schema: raw_data
    freshness:
      warn_after: { count: 12, period: hour }
      error_after: { count: 24, period: hour }
    loaded_at_field: _loaded_at
    tables:
      - name: taxi_trips
      - name: taxi_zones
```

### Sources with Per-Table Freshness

```yaml
# models/staging/sources.yml
version: 2

sources:
  - name: raw
    schema: public
    tables:
      - name: taxi_trips
        loaded_at_field: tpep_pickup_datetime
        freshness:
          warn_after: {count: 24, period: hour}
          error_after: {count: 48, period: hour}
      - name: taxi_zones
        freshness: null  # static reference data

# Check freshness: dbt source freshness
```

Run freshness check:

```bash
dbt source freshness
```

## 8. Snapshots — SCD Type 2

```sql
-- snapshots/snap_taxi_zones.sql
{% snapshot snap_taxi_zones %}
{{
    config(
        target_schema='snapshots',
        unique_key='zone_id',
        strategy='check',
        check_cols=['zone_name', 'borough']
    )
}}

select * from {{ source('raw', 'taxi_zones') }}

{% endsnapshot %}
```

## Resources

- [dbt Project Configuration](https://docs.getdbt.com/reference/dbt_project.yml)
- [dbt Sources](https://docs.getdbt.com/docs/build/sources)
- [dbt Snapshots](https://docs.getdbt.com/docs/build/snapshots)
- [dbt Incremental Models](https://docs.getdbt.com/docs/build/incremental-models)
- [Jinja Template Designer](https://jinja.palletsprojects.com/en/3.1.x/templates/)

:::cheat
dbt run | Build all models
dbt test | Run all tests
dbt docs generate | Generate docs
dbt docs serve | Serve docs site
dbt run --select staging.* | Run staging only
dbt source freshness | Check source freshness
dbt snapshot | Run snapshots
dbt run --full-refresh | Rebuild incremental
:::
