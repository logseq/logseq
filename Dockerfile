# NOTE: please keep it in sync with .github pipelines
FROM clojure:openjdk-11-tools-deps-1.10.1.727

RUN curl -sL https://deb.nodesource.com/setup_15.x | bash - && \
    apt-get install -y nodejs

RUN curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && \
    apt-get install -y yarn

RUN useradd -ms /bin/bash logseq

USER logseq
WORKDIR /home/logseq

EXPOSE 3001
EXPOSE 9630
EXPOSE 8701
