---
title: "Docker & Local Data Stack — Overview"
tags: [docker, docker-compose, containers, networking]
---

# Week 3: Docker & Local Data Stack

## Summary

Containerization is non-negotiable in modern data engineering. Learn Docker from first principles: images, containers, volumes, networks, multi-stage builds. Use Docker Compose to orchestrate a multi-container local data stack.

## Key Topics

- **[Docker Images & Layers](https://docs.docker.com/build/concepts/layers/)** — Immutable filesystem snapshots built from Dockerfiles. Each instruction creates a cached layer for efficient rebuilds.
- **[Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)** — Use multiple FROM stages to separate build dependencies from runtime. Produces minimal production images.
- **[Docker Volumes](https://docs.docker.com/engine/storage/volumes/)** — Persistent storage that survives container restarts. Named volumes for databases, bind mounts for development.
- **[Docker Networking](https://docs.docker.com/engine/network/)** — Bridge networks enable container-to-container communication via service names. Port mapping exposes services to the host.
- **[Docker Compose](https://docs.docker.com/compose/)** — YAML-based multi-container orchestration. Defines services, networks, volumes, and dependencies in one file.
- **[Health Checks](https://docs.docker.com/reference/dockerfile/#healthcheck)** — Container-level liveness probes. Compose uses these to order service startup and detect failures.
- **[.dockerignore](https://docs.docker.com/build/concepts/context/#dockerignore-files)** — Excludes files from build context (like .gitignore for Docker). Reduces build time and image size.
- **[Resource Limits](https://docs.docker.com/config/containers/resource_constraints/)** — Memory and CPU constraints per container. Prevents runaway processes from affecting other services.

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Dockerfile Reference](https://docs.docker.com/reference/dockerfile/)
- [Docker Hub](https://hub.docker.com/)

:::goal
Build a complete local data infrastructure using containers.
:::

:::deliverables
- Custom multi-stage Dockerfiles for Python services
- docker-compose.yml with PostgreSQL, Airflow (webserver + scheduler), and pgAdmin
- Health checks on all services
- Persistent volumes for database data
- README with setup instructions
:::

:::diagram
graph LR
    HOST["Host"] -->|8080| AW["Airflow Web"]
    HOST -->|5050| PA["pgAdmin"]
    HOST -->|5432| PG["PostgreSQL"]
    AW -->|metadata| PG
    AS["Airflow Scheduler"] -->|metadata| PG
    PA -->|admin| PG
:::

:::cheat
docker build -t myapp . | Build image
docker compose up -d | Start stack detached
docker compose logs -f svc | Follow service logs
docker compose down -v | Stop and remove volumes
docker system prune -a | Clean all unused resources
:::
