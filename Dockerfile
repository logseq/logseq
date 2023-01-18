# NOTE: please keep it in sync with .github pipelines
# NOTE: during testing make sure to change the branch below
# NOTE: before runing the build-docker GH action edit
#       build-docker.yml and change the release channel to testing

# Builder image
FROM clojure:openjdk-11-tools-deps-1.10.1.727 as builder

ARG DEBIAN_FRONTEND=noninteractive

RUN curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs

RUN apt-get update && apt-get install ca-certificates && \
    wget --no-check-certificate -qO - https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install -y yarn

WORKDIR /data

RUN git clone -b master https://github.com/logseq/logseq.git .

RUN yarn install --network-timeout 100000

# Build static resources
RUN  yarn release 

# Web App Runner image
FROM nginx:stable-alpine

COPY --from=builder /data/static /usr/share/nginx/html

