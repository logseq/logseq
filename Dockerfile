# Builder image
FROM clojure:openjdk-11-tools-deps-1.10.1.727 as builder

ARG DEBIAN_FRONTEND=noninteractive
ARG VERSION=undefined-docker

RUN curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs

RUN apt-get update && apt-get install ca-certificates && \
    wget --no-check-certificate -qO - https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && \
    apt-get install -y yarn

WORKDIR /src/
#get dependencies
COPY package.json .
COPY yarn.lock .
COPY static .
RUN yarn install

# copy everything else & run release
COPY . .
RUN yarn release

# Web App Runner image
FROM nginx:stable-alpine
RUN echo ${VERSION} > /usr/share/nginx/html/version.txt
COPY --from=builder /src/public/index.html /usr/share/nginx/html/
COPY --from=builder /src/static /usr/share/nginx/html



