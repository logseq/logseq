FROM eclipse-temurin:21-jdk-jammy AS build

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates build-essential git python3 \
 && curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && curl -fsSLO https://download.clojure.org/install/linux-install-1.12.4.1618.sh \
 && chmod +x linux-install-1.12.4.1618.sh \
 && ./linux-install-1.12.4.1618.sh

WORKDIR /workspace

RUN npm install --global pnpm@10.33.0

# Keep dependency installation cached when only application source changes.
WORKDIR /workspace/deps/db-sync

COPY deps/db-sync/package.json deps/db-sync/pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod \
 && pnpm rebuild better-sqlite3

WORKDIR /workspace

COPY deps/common ./deps/common
COPY deps/db ./deps/db
COPY deps/graph-parser ./deps/graph-parser
COPY deps/outliner ./deps/outliner
COPY deps/db-sync/deps.edn deps/db-sync/shadow-cljs.edn ./deps/db-sync/
COPY deps/db-sync/src ./deps/db-sync/src
COPY resources ./resources

WORKDIR /workspace/deps/db-sync

RUN pnpm build:node-adapter

FROM node:24-bookworm-slim

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
