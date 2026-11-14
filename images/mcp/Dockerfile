# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------------------------
# Build the Logseq CLI + db-worker-node (pure JS output) once on the native
# build platform; only native npm modules are installed per target platform.
# ---------------------------------------------------------------------------
FROM --platform=$BUILDPLATFORM debian:trixie-slim AS build

ARG LOGSEQ_REPO=https://github.com/SSamDav/logseq.git
ARG LOGSEQ_REF=master
ARG MISE_VERSION=v2026.8.8
ARG OCAML_VERSION=5.1.1

ENV DEBIAN_FRONTEND=noninteractive
ENV PATH=/root/.local/bin:$PATH
ENV MISE_YES=1
ENV OPAMYES=1
ENV OPAMROOTISOK=1
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash build-essential ca-certificates curl git libsecret-1-dev \
    m4 opam pkg-config python3 rsync unzip xz-utils \
  && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://mise.run | MISE_VERSION="${MISE_VERSION}" sh

WORKDIR /tooling
COPY mise.toml /tooling/mise.toml
RUN mise trust /tooling/mise.toml && mise install

RUN opam init --bare --disable-sandboxing \
  && opam switch create default "${OCAML_VERSION}"

WORKDIR /src
RUN git init . \
  && git remote add origin "${LOGSEQ_REPO}" \
  && git fetch --depth 1 origin "${LOGSEQ_REF}" \
  && git checkout --detach FETCH_HEAD

RUN mise trust /src/mise.toml && mise exec -- corepack enable

WORKDIR /src/cli
RUN opam install . --deps-only

WORKDIR /src
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    mise exec -- pnpm install --frozen-lockfile \
  && mise exec -- pnpm --dir cli install --frozen-lockfile --ignore-workspace

# The CLI and db-worker-node must report the same revision, otherwise the CLI
# keeps restarting the worker as "revision mismatch".
RUN --mount=type=cache,target=/root/.m2/repository \
    export LOGSEQ_REVISION="$(git describe --long --always)" \
  && export LOGSEQ_BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  && mise exec -- opam exec -- pnpm cli:release \
  && mise exec -- pnpm db-worker-node:release:bundle \
  && mise exec -- node scripts/prepare-cli-package.mjs \
  && mise exec -- node dist/cli-package/dist/logseq.js --version

# ---------------------------------------------------------------------------
# Install runtime dependencies for the target platform (native modules).
# ---------------------------------------------------------------------------
FROM node:24-trixie-slim AS deps

ENV DEBIAN_FRONTEND=noninteractive
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential ca-certificates libsecret-1-dev python3 \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /src/dist/cli-package /opt/logseq-cli
WORKDIR /opt/logseq-cli
RUN corepack enable \
  && pnpm install --prod --config.node-linker=hoisted

COPY images/mcp/server/package.json images/mcp/server/package-lock.json /opt/logseq-mcp/
WORKDIR /opt/logseq-mcp
RUN npm ci --omit=dev --no-audit --no-fund

# ---------------------------------------------------------------------------
# Runtime
# ---------------------------------------------------------------------------
FROM node:24-trixie-slim

LABEL org.opencontainers.image.description="Headless Logseq CLI synced with a self-hosted Logseq Sync server, exposed as an MCP server"
LABEL org.opencontainers.image.source="https://github.com/SSamDav/logseq"

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates libsecret-1-0 tini \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /opt/logseq-cli /opt/logseq-cli
COPY --from=deps /opt/logseq-mcp/node_modules /opt/logseq-mcp/node_modules
COPY images/mcp/server/package.json /opt/logseq-mcp/package.json
COPY images/mcp/server/src /opt/logseq-mcp/src

# The CLI looks for db-worker-node.js next to argv[1], which would be the
# /usr/local/bin symlink, so point it at the bundled worker explicitly.
ENV LOGSEQ_DB_WORKER_NODE_SCRIPT=/opt/logseq-cli/static/js/db-worker-node.js

RUN ln -s /opt/logseq-cli/dist/logseq.js /usr/local/bin/logseq \
  && chmod +x /opt/logseq-cli/dist/logseq.js \
  && test -f "${LOGSEQ_DB_WORKER_NODE_SCRIPT}" \
  && mkdir -p /data \
  && logseq --version \
  && HOME=/tmp/smoke logseq graph create --graph=smoke --output json \
  && HOME=/tmp/smoke logseq server start --graph=smoke --output json \
  && HOME=/tmp/smoke logseq list page --graph=smoke --output json \
  && HOME=/tmp/smoke logseq server stop --graph=smoke --output json \
  && rm -rf /tmp/smoke

# HOME holds ~/logseq (graphs, auth.json, cli.edn, kv-store.json) and MCP state.
ENV HOME=/data
ENV MCP_PORT=8080
ENV LOGSEQ_CLI_TIMEOUT_MS=60000

VOLUME ["/data"]
EXPOSE 8080

HEALTHCHECK --interval=60s --timeout=30s --start-period=120s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.MCP_PORT||8080)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "/opt/logseq-mcp/src/main.mjs"]
