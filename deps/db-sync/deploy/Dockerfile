FROM eclipse-temurin:21-jdk-jammy AS build

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates build-essential git python3 \
 && curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && curl -fsSLO https://download.clojure.org/install/linux-install-1.12.4.1618.sh \
 && chmod +x linux-install-1.12.4.1618.sh \
 && ./linux-install-1.12.4.1618.sh

WORKDIR /workspace

COPY deps/common ./deps/common
COPY deps/db ./deps/db
COPY deps/graph-parser ./deps/graph-parser
COPY deps/outliner ./deps/outliner
COPY deps/db-sync ./deps/db-sync
COPY resources ./resources

RUN npm install --global pnpm@10.33.0

WORKDIR /workspace/deps/graph-parser

RUN pnpm install --frozen-lockfile --prod

WORKDIR /workspace/deps/db-sync

# Install the Node adapter and its graph-parser runtime dependencies without
# entering the root desktop workspace.
RUN pnpm install --frozen-lockfile --prod \
 && pnpm rebuild better-sqlite3 \
 && pnpm build:node-adapter

FROM node:24-bookworm-slim

ENV NODE_ENV=production \
    DB_SYNC_PORT=8080 \
    DB_SYNC_DATA_DIR=/var/lib/logseq-sync

WORKDIR /app

COPY --from=build /workspace/deps/db-sync/node_modules ./node_modules
COPY --from=build /workspace/deps/graph-parser/node_modules ./node_modules
COPY --from=build /workspace/deps/db-sync/worker/dist/node-adapter.js ./node-adapter.js

RUN mkdir -p /var/lib/logseq-sync \
 && chown node:node /var/lib/logseq-sync

USER node

EXPOSE 8080

CMD ["node", "node-adapter.js"]
