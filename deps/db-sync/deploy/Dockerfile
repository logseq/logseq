FROM node:24-bookworm-slim@sha256:3638d9a6fe4030bd716be989438248074489337ba3275657f93595428be4fc03 AS node-runtime

FROM clojure:temurin-21-tools-deps-1.12.4.1618-bookworm-slim@sha256:e41b7b42ba9edfc0cbdff4e403606f02500287f09a03efce505efd35713d4336 AS build

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates build-essential git python3 \
 && rm -rf /var/lib/apt/lists/*

COPY --from=node-runtime /usr/local/ /usr/local/

WORKDIR /workspace

RUN npm install --global pnpm@10.33.0

# Keep dependency installation cached when only application source changes.
WORKDIR /workspace/deps/db-sync

COPY deps/db-sync/package.json deps/db-sync/pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod \
 && pnpm rebuild better-sqlite3

WORKDIR /workspace

COPY deps/common/deps.edn ./deps/common/deps.edn
COPY deps/db/deps.edn ./deps/db/deps.edn
COPY deps/graph-parser/deps.edn ./deps/graph-parser/deps.edn
COPY deps/outliner/deps.edn ./deps/outliner/deps.edn
COPY deps/db-sync/deps.edn deps/db-sync/shadow-cljs.edn ./deps/db-sync/

WORKDIR /workspace/deps/db-sync

# Cache Maven and Git dependencies independently from application source.
RUN clojure -P -M:cljs

WORKDIR /workspace

COPY deps/common ./deps/common
COPY deps/db ./deps/db
COPY deps/graph-parser ./deps/graph-parser
COPY deps/outliner ./deps/outliner
COPY deps/db-sync/src ./deps/db-sync/src
COPY resources ./resources

WORKDIR /workspace/deps/db-sync

RUN pnpm build:node-adapter

FROM node:24-bookworm-slim@sha256:3638d9a6fe4030bd716be989438248074489337ba3275657f93595428be4fc03

ENV NODE_ENV=production \
    DB_SYNC_HOST=0.0.0.0 \
    DB_SYNC_PORT=8080 \
    DB_SYNC_DATA_DIR=/var/lib/logseq-sync

WORKDIR /app

COPY --from=build /workspace/deps/db-sync/node_modules ./node_modules
COPY --from=build /workspace/deps/db-sync/worker/dist/node-adapter.js ./node-adapter.js

RUN mkdir -p /var/lib/logseq-sync \
 && chown node:node /var/lib/logseq-sync

USER node

EXPOSE 8080

CMD ["node", "node-adapter.js"]
