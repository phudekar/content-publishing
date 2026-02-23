---
title: "Docker & Local Data Stack — Overview"
tags: [docker, docker-compose, containers, networking]
---

# Week 3: Docker & Local Data Stack

## Summary

Containerization is non-negotiable in modern data engineering. This week you'll learn Docker from first principles: images, containers, volumes, networks, and multi-stage builds. Then you'll use Docker Compose to orchestrate a multi-container local data stack — the same pattern used in production. This is where most learners fall behind because they skip straight to cloud services. Resist that urge. Understanding containers deeply means you can debug deployment issues, optimize images, and work with any orchestration platform (Kubernetes, ECS, etc.) later.

**Why Docker matters and what it replaced:**

- **Containers over virtual machines** — Before Docker, engineers used virtual machines (VMs) to isolate environments. VMs are heavy (GBs vs. MBs for containers), slow to start (minutes vs. seconds), and hard to share or version. Docker solved the "works on my machine" problem by packaging code, dependencies, and OS libraries into lightweight, portable units that run identically everywhere.
- **Docker Compose over manual scripts** — Before Docker Compose, running a multi-service stack (database, web server, cache, worker) required hand-written shell scripts to start each service in the right order, wire up networking, and manage volumes. Compose declares the entire stack in a single YAML file with built-in dependency ordering, shared networks, and volume management.
- **Multi-stage builds over bloated images** — Before multi-stage builds, production images included compilers, build tools, and source code that weren't needed at runtime, resulting in large and insecure images. Multi-stage builds separate the build environment from the runtime environment, producing minimal images that contain only what's needed to run the application.

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
