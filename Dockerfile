# NOTE: please keep it in sync with .github pipelines

# Builder image
FROM clojure:openjdk-11-tools-deps-1.10.1.727 as builder

ARG DEBIAN_FRONTEND=noninteractive

RUN curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs

RUN apt-get update && apt-get install ca-certificates && \
    wget --no-check-certificate -qO - https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && \
    apt-get install -y yarn

WORKDIR /data/

# Build for static resources
RUN git clone https://github.com/logseq/logseq.git &&  cd /data/logseq && yarn && yarn release && mv ./static ./public

# Web App Runner image
FROM nginx:stable-alpine

COPY --from=builder /data/logseq/public /usr/share/nginx/html

