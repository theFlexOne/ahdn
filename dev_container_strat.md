# Docker-in-Docker Project Structure

## What I would do

* the **main devcontainer** is your editor/tooling shell
* an **inner Docker daemon** runs **service containers**
* **Supabase** is started by the Supabase CLI inside that inner daemon
* your **worker** and future services are started by an inner `docker compose` file on the **same inner network** as Supabase

That matches the Dev Containers model, and the official Docker-in-Docker feature is specifically for creating child containers inside the devcontainer. Its published feature metadata shows it sets an inner Docker entrypoint, runs privileged, and persists `/var/lib/docker` in a named volume. Dev Containers also mount the workspace into the container, which is what keeps the editing experience fast. ([Visual Studio Code][1])

For `ahdn`, this fits the repo well because the root app is a Vite/React/TypeScript app, the worker already has its own Node 24 package and Dockerfile, and the repo already has a `supabase/` project with Edge Functions and Deno config. The Makefile also already centralizes bootstrap/build commands. ([GitHub][2])

The one important design detail is **networking**: let Supabase keep managing its own containers, but start it with `--network-id <shared-network>`. The Supabase CLI documents `--network-id` as a global flag that tells it to use a specified Docker network instead of generating one. Docker Compose can attach your worker and future services to that same named network, and on a Compose network services are reachable by service name. ([Supabase][3])

## Recommended shape

```text
.devcontainer/
  devcontainer.json
  Dockerfile
  docker-compose.services.yml
  scripts/
    services-up.sh
    services-down.sh
```

## 1) `.devcontainer/devcontainer.json`

```json
{
  "name": "ahdn-dev",
  "build": {
    "dockerfile": "Dockerfile",
    "context": ".."
  },
  "features": {
    "ghcr.io/devcontainers/features/common-utils:2": {
      "configureZshAsDefaultShell": true
    },
    "ghcr.io/devcontainers/features/docker-in-docker:2": {
      "moby": true,
      "dockerDashComposeVersion": "v2"
    }
  },
  "remoteUser": "node",
  "workspaceFolder": "/workspaces/${localWorkspaceFolderBasename}",
  "postCreateCommand": "make app:bootstrap && deno cache supabase/functions/upload-image-files/index.ts supabase/functions/upload-video-files/index.ts",
  "postStartCommand": "bash .devcontainer/scripts/services-up.sh",
  "forwardPorts": [5173, 8080, 54321, 54322, 54323, 54324, 54325],
  "portsAttributes": {
    "5173": {
      "label": "Vite app",
      "onAutoForward": "openBrowser"
    },
    "8080": {
      "label": "Image converter worker"
    },
    "54321": {
      "label": "Supabase API / Edge Functions"
    },
    "54322": {
      "label": "Supabase Postgres"
    },
    "54323": {
      "label": "Supabase Studio",
      "onAutoForward": "openBrowser"
    },
    "54324": {
      "label": "Supabase Inbucket"
    },
    "54325": {
      "label": "Supabase SMTP"
    }
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "bradlc.vscode-tailwindcss",
        "denoland.vscode-deno",
        "ms-azuretools.vscode-docker"
      ],
      "settings": {
        "deno.enablePaths": [
          "supabase/functions"
        ],
        "typescript.tsdk": "node_modules/typescript/lib"
      }
    }
  }
}
```

This uses the DIND feature as the outer-shell mechanism, then automatically starts your inner services after the devcontainer opens. The forwarded ports line up with Vite, your worker’s `8080`, and Supabase’s documented local defaults: API `54321`, DB `54322`, Studio `54323`, and Inbucket `54324`. Your worker already listens on `PORT` defaulting to `8080` and binds `0.0.0.0`, so it is ready for containerized service use. ([GitHub][4])

## 2) `.devcontainer/Dockerfile`

```dockerfile
FROM mcr.microsoft.com/devcontainers/javascript-node:1-24-bookworm

ENV DEBIAN_FRONTEND=noninteractive
ENV DENO_INSTALL=/usr/local

RUN apt-get update && apt-get install -y --no-install-recommends \
    make \
    curl \
    ca-certificates \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deno.land/install.sh | sh

RUN npm install -g supabase
```

This keeps the main devcontainer focused on tooling: Node 24 for the repo and worker, Deno for Supabase functions, Make for your repo tasks, and the Supabase CLI for the local stack. That matches the repo’s current toolchain instead of introducing a second workflow. ([GitHub][2])

## 3) `.devcontainer/docker-compose.services.yml`

```yaml
services:
  image-converter:
    image: node:24-bookworm
    working_dir: /workspace/workers/image-converter
    command: bash -lc "npm ci && npm run dev"
    volumes:
      - ..:/workspace
      - image-converter-node-modules:/workspace/workers/image-converter/node_modules
    environment:
      PORT: "8080"
      MAX_UPLOAD_BYTES: "20971520"
      WORKER_SHARED_SECRET: "${WORKER_SHARED_SECRET:-}"
    ports:
      - "8080:8080"
    networks:
      - ahdn-inner
    restart: unless-stopped

  # future example:
  # redis:
  #   image: redis:7
  #   ports:
  #     - "6379:6379"
  #   networks:
  #     - ahdn-inner

networks:
  ahdn-inner:
    external: true

volumes:
  image-converter-node-modules:
```

I would do the worker this way for development instead of using its existing production Dockerfile directly. The existing worker Dockerfile is a multi-stage build meant to compile and run `dist/index.js`, while the package’s dev script uses `tsx` watch mode. For dev, a bind-mounted service container gives you fast iteration and still keeps the worker in its own child container. ([GitHub][5])

Also, putting future services here gives you the scaling path you asked for: Redis, a queue worker, MinIO, a local AI service, another Node worker, and so on can all join `ahdn-inner`, while Supabase joins the same network through `--network-id`. Docker’s Compose networking docs explicitly call out service-name discovery on the shared network. ([Supabase][3])

## 4) `.devcontainer/scripts/services-up.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

NETWORK_NAME="ahdn-inner"
COMPOSE_FILE=".devcontainer/docker-compose.services.yml"

if ! docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
  docker network create "$NETWORK_NAME" >/dev/null
fi

docker compose -f "$COMPOSE_FILE" up -d

if ! supabase status >/dev/null 2>&1; then
  supabase start --yes --network-id "$NETWORK_NAME"
fi
```

This is the critical piece. Your own service containers come up first on a named inner network, then `supabase start` joins that same network instead of generating an isolated one. That is what makes “Supabase + worker + future services all inside the main container, but each in their own child containers” hang together cleanly. ([Supabase][3])

## 5) `.devcontainer/scripts/services-down.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

supabase stop || true
docker compose -f .devcontainer/docker-compose.services.yml down
```

## How this behaves

Once you reopen the repo in the devcontainer:

* the **main devcontainer** gives you VS Code, Node, Deno, Make, and the Supabase CLI
* `postStartCommand` starts the **inner network**
* the worker starts as a **child container**
* `supabase start --network-id ahdn-inner` starts the Supabase stack as **child containers on the same network**
* your browser still reaches everything through forwarded localhost ports from the devcontainer ([Visual Studio Code][1])

That means:

* from your **browser/host**:

  * Vite app: `http://localhost:5173`
  * worker: `http://localhost:8080`
  * Supabase API: `http://localhost:54321`
  * Studio: `http://localhost:54323`

* from **other inner containers**:

  * worker: `http://image-converter:8080`
  * future Compose services: by their Compose service names on `ahdn-inner` ([Docker Documentation][6])

## What I would *not* do

I would **not** try to manually rewrite the full Supabase local stack into your own compose file. Your repo already has a proper `supabase/config.toml`, and the Supabase CLI is designed to manage the local stack itself. The right integration point is the shared network, not duplicating Supabase’s container orchestration by hand. ([GitHub][7])

I would also **not** use the worker’s current production Dockerfile as the default dev service because it is optimized for build-once runtime execution, not live-reload iteration. The inner compose dev container above is better for day-to-day development, while the existing worker Dockerfile stays useful for production-style builds and deployment. ([GitHub][5])

## Small optional additions

A root `.dockerignore` is worth adding because the devcontainer build context is the repo root. Excluding `node_modules`, `dist`, and temp folders keeps the devcontainer build lean. The Dev Containers docs recommend using a Dockerfile when you need to persist custom software installation in the development container, which is exactly what this setup is doing. ([Visual Studio Code][8])

[1]: https://code.visualstudio.com/docs/devcontainers/containers "Developing inside a Container"
[2]: https://raw.githubusercontent.com/theFlexOne/ahdn/main/package.json "raw.githubusercontent.com"
[3]: https://supabase.com/docs/reference/cli/introduction "CLI Reference | Supabase Docs"
[4]: https://github.com/devcontainers/features/blob/main/src/docker-in-docker/devcontainer-feature.json "features/src/docker-in-docker/devcontainer-feature.json at main · devcontainers/features · GitHub"
[5]: https://raw.githubusercontent.com/theFlexOne/ahdn/main/workers/image-converter/package.json "raw.githubusercontent.com"
[6]: https://docs.docker.com/compose/how-tos/networking/?utm_source=chatgpt.com "Networking"
[7]: https://raw.githubusercontent.com/theFlexOne/ahdn/main/supabase/config.toml "raw.githubusercontent.com"
[8]: https://code.visualstudio.com/docs/devcontainers/create-dev-container "Create a Dev Container"
