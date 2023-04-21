# NOTE: please keep it in sync with .github pipelines
# NOTE: during testing make sure to change the branch below
# NOTE: before running the build-docker GH action edit
#       build-docker.yml and change the release channel from :latest to :testing

# Builder image
FROM clojure:temurin-11-tools-deps-1.11.1.1208-bullseye-slim as builder

ARG DEBIAN_FRONTEND=noninteractive

# Install reqs
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    apt-transport-https \
    gpg

# install NodeJS & yarn
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -

RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor | \
    tee /etc/apt/trusted.gpg.d/yarn.gpg && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | \
    tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install -y nodejs yarn

WORKDIR /data

# build Logseq static resources
RUN git clone -b master https://github.com/logseq/logseq.git .

RUN yarn config set network-timeout 240000 -g && yarn install

RUN  yarn release 

# Web App Runner image
FROM nginx:1.24.0-alpine3.17

COPY --from=builder /data/static /usr/share/nginx/html

