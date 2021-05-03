# Logseq

[![latest release version](https://img.shields.io/github/v/release/logseq/logseq)](https://github.com/logseq/logseq/releases)
[![License](https://img.shields.io/github/license/logseq/logseq?color=blue)](https://github.com/logseq/logseq/blob/master/LICENSE.md)
[![Twitter follow](https://img.shields.io/badge/follow-%40logseq-blue.svg?style=flat&logo=twitter)](https://twitter.com/logseq)
[![discord](https://img.shields.io/discord/725182569297215569?label=discord&logo=Discord&color=blue)](https://discord.gg/KpN4eHY)
[![total](https://opencollective.com/logseq/tiers/badge.svg?color=blue)](https://opencollective.com/logseq)

[![Contributors](https://opencollective.com/logseq/tiers/sponsors.svg?avatarHeight=24&width=600)](https://opencollective.com/logseq)
[![Contributors](https://opencollective.com/logseq/tiers/backers.svg?avatarHeight=24&width=600)](https://opencollective.com/logseq)

A local-first, non-linear, outliner notebook for organizing and sharing your personal knowledge base.

Use it to organize your todo list, to write your journals, or to record your unique life.

## Why Logseq?

[Logseq](https://logseq.com) is a platform for knowledge sharing and management. It focuses on privacy, longevity, and [user control](https://www.gnu.org/philosophy/free-sw.en.html).
Notice: the backend code will be open-sourced as soon as we’re sure that the backend service meets the security standards.

The server will never store or analyze your private notes. Your data are plain text files and we currently support both Markdown and Emacs Org mode (more to be added soon).

In the unlikely event that the website is down or cannot be maintained, your data is, and will always be yours.

![Image of logseq](https://cdn.logseq.com/%2F8b9a461d-437e-4ca5-a2da-18b51077b5142020_07_25_Screenshot%202020-07-25%2013-29-49%20%2B0800.png?Expires=4749255017&Signature=Qbx6jkgAytqm6nLxVXQQW1igfcf~umV1OcG6jXUt09TOVhgXyA2Z5jHJ3AGJASNcphs31pZf4CjFQ5mRCyVKw6N8wb8Nn-MxuTJl0iI8o-jLIAIs9q1v-2cusCvuFfXH7bq6ir8Lpf0KYAprzuZ00FENin3dn6RBW35ENQwUioEr5Ghl7YOCr8bKew3jPV~OyL67MttT3wJig1j3IC8lxDDT8Ov5IMG2GWcHERSy00F3mp3tJtzGE17-OUILdeuTFz6d-NDFAmzB8BebiurYz0Bxa4tkcdLUpD5ToFHU08jKzZExoEUY8tvaZ1-t7djmo3d~BAXDtlEhC2L1YC2aVQ__&Key-Pair-Id=APKAJE5CCD6X7MP6PTEA)

## Sponsors

Our top sponsors are shown below! [[Become a sponsor](https://opencollective.com/logseq#sponsor)]

<a href="https://www.deta.sh/" target="_blank"><img width=200 height=100 src="https://uploads-ssl.webflow.com/5eb96efa78dc680fc15be3be/5ebd24f6cbf6e9ebd674656e_Logo.svg" /></a>


## Feature requests

Please go to https://discuss.logseq.com/c/feature-requests/7.

## How can I use it?

1. Make sure you have registered a [GitHub account](https://github.com/join) and already created a repository (could be an old one). _Currently we only support GitHub, but more sync options (e.g. Gitlab, Dropbox, Google Drive, WebDAV, etc.) will be added soon._

2. Visit our website <https://logseq.com/>.

3. Click the "Login with GitHub" button in the upper-right corner.

4. Following the on-screen instructions, install Logseq app on your selected repository.

5. Start writing and have fun!

## Credits

Logseq is hugely inspired by [Roam Research](https://roamresearch.com/), [Org Mode](https://orgmode.org/), [Tiddlywiki](https://tiddlywiki.com/), [Workflowy](https://workflowy.com/) and [Cuekeeper](https://github.com/talex5/cuekeeper), hats off to all of them!

Logseq is also made possible by the following projects:

- [Clojure & ClojureScript](https://clojure.org/) - A dynamic, functional, general-purpose programming language
- [DataScript](https://github.com/tonsky/datascript) - Immutable database and Datalog query-engine for Clojure, ClojureScript and JS
- [OCaml](https://ocaml.org/) & [Angstrom](https://github.com/inhabitedtype/angstrom), for the document [parser](https://github.com/mldoc/mldoc)
- [isomorphic-git](https://isomorphic-git.org/) - A pure JavaScript implementation of Git for node and browsers
- [sci](https://github.com/borkdude/sci) - Small Clojure Interpreter

![Logseq Credits](https://asset.logseq.com/static/img/credits.png)

## Learn more

- Our blog: https://logseq.com/blog - Please be sure to visit our [About page](https://logseq.com/blog/about) for the latest updates of the app
- Twitter: https://twitter.com/logseq
- Discord: https://discord.gg/KpN4eHY - Where we answer questions, discuss workflows and share tips
- Github: https://github.com/logseq/logseq - everyone is encouraged to report issues!

---

The following is for developers and designers who want to build and run Logseq locally and contribute to this project.

## Set up development environment

### 1. Requirements

- [Node.js](https://nodejs.org/en/download/) & [Yarn](https://classic.yarnpkg.com/en/docs/install/)
- [Java & Clojure](https://clojure.org/guides/getting_started). (If you run into `Execution error (FileNotFoundException) at java.io.FileInputStream/open0 (FileInputStream.java:-2). -M:cljs (No such file or directory)`, it means you have a wrong Clojure version installed. Please uninstall it and follow the instructions linked.)

### 2. Compile to JavaScript

```bash
git clone https://github.com/logseq/logseq
yarn
yarn watch
```

### 3. Open the browser

Open <http://localhost:3001>.

### 4. Build a release

```bash
yarn release
```

### 5. Run tests

Run ClojureScript tests

```bash
yarn test
```

Run Clojure tests. (Note: `.cljc` files may be tested both by ClojureScript, and Clojure.)

```bash
clj -Mtest-clj
```

## Desktop app development

### 1. Compile to JavaScript

```bash
yarn watch
```

### 2. Open the dev app

```bash
yarn dev-electron-app
```

### 3. Build a release

```bash
yarn release-electron
```

## Alternative: Docker based development environment

Basically it just pre-installs Java, Clojure and NodeJS for your convenience.

### 1. Fetch sources

```bash
git clone https://github.com/logseq/logseq
```

### 2. Build Docker image

```bash
cd logseq
docker build -t logseq-docker .
```

### 3. Run Docker container

```bash
docker run -v $(pwd):/home/logseq/logseq -p 3001:3001 -p 9630:9630 -p 8701:8701 --rm -it logseq-docker /bin/bash
```

### 4. Inside the container compile as described above

```bash
cd logseq
yarn
yarn watch
```

## Thanks

[![JetBrains](docs/assets/jetbrains.svg)](https://www.jetbrains.com/?from=logseq)
