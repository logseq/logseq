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

[Logseq](https://logseq.com) is an open-source platform for knowledge sharing and management. It focuses on privacy, longevity, and user control.

The server will never store or analyze your private notes. Your data are plain text files and we currently support both Markdown and Emacs Org mode (more to be added soon).

In the unlikely event that the website is down or cannot be maintained, your data is, and will always be yours.

![Image of logseq](https://cdn.logseq.com/%2F8b9a461d-437e-4ca5-a2da-18b51077b5142020_07_25_Screenshot%202020-07-25%2013-29-49%20%2B0800.png?Expires=4749255017&Signature=Qbx6jkgAytqm6nLxVXQQW1igfcf~umV1OcG6jXUt09TOVhgXyA2Z5jHJ3AGJASNcphs31pZf4CjFQ5mRCyVKw6N8wb8Nn-MxuTJl0iI8o-jLIAIs9q1v-2cusCvuFfXH7bq6ir8Lpf0KYAprzuZ00FENin3dn6RBW35ENQwUioEr5Ghl7YOCr8bKew3jPV~OyL67MttT3wJig1j3IC8lxDDT8Ov5IMG2GWcHERSy00F3mp3tJtzGE17-OUILdeuTFz6d-NDFAmzB8BebiurYz0Bxa4tkcdLUpD5ToFHU08jKzZExoEUY8tvaZ1-t7djmo3d~BAXDtlEhC2L1YC2aVQ__&Key-Pair-Id=APKAJE5CCD6X7MP6PTEA)

## How can I use it?

1. Make sure you have registered a [GitHub account](https://github.com/join) and already created a repository (could be an old one). _Currently we only support GitHub, but more sync  options (e.g. Gitlab, Dropbox, Google Drive, WebDAV, etc.) will be added soon._

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
- Discord: https://discord.gg/KpN4eHY - Where we answer questions, disucss workflows and share tips
- Github: https://github.com/logseq/logseq - everyone is encouraged to report issues!

- - - -

The following is for developers and designers who want to build and run Logseq locally and contribute to this project.

## Set up development environment

If you are on Windows, use the [Windows setup](#windows-setup) below.

### 1. Requirements

- [Java & Clojure](https://clojure.org/guides/getting_started)

- [PostgreSQL](https://www.postgresql.org/download/)

- [Node.js](https://nodejs.org/en/download/) & [Yarn](https://classic.yarnpkg.com/en/docs/install/)

### 2. Create a GitHub app

Follow the guide at <https://docs.github.com/en/free-pro-team@latest/developers/apps/creating-a-github-app>, where the user authorization "Callback URL" should be `http://localhost:3000/auth/github`.

Remember to download the `private-key.pem` which will be used for the next step. Also take note of your `App ID`, `Client ID`, and your newly generated `Client Secret` for use in step 4.

### 3. Set up PostgreSQL

Make sure you have PostgreSQL running. You can check if it's running with `pg_ctl -D /usr/local/var/postgres status` and use `pg_ctl -D /usr/local/var/postgres start` to start it up. You'll also need to make a Logseq DB in PostgreSQL. Do that with `createdb logseq`.

### 4. Add environment variables

``` bash
export ENVIRONMENT="dev"
export JWT_SECRET="xxxxxxxxxxxxxxxxxxxx"
export COOKIE_SECRET="xxxxxxxxxxxxxxxxxxxx"
export DATABASE_URL="postgres://localhost:5432/logseq"
export GITHUB_APP2_ID="78728"
export GITHUB_APP2_KEY="xxxxxxxxxxxxxxxxxxxx" #Your Github App's Client ID
export GITHUB_APP2_SECRET="xxxxxxxxxxxxxxxxxxxx"
# Replace your-code-directory and your-app.private-key.pem with yours
export GITHUB_APP_PEM="/your-code-directory/your-app.private-key.pem"
export LOG_PATH="/tmp/logseq"
export PG_USERNAME="xxx"
export PG_PASSWORD="xxx"
```

### 5. Compile to JavaScript

``` bash
git clone https://github.com/logseq/logseq
yarn
yarn watch
```

### 6. Start the Clojure server

1.  Download jar

    Go to <https://github.com/logseq/logseq/releases>, download the `logseq.jar` and put it in the `logseq` directory.

2.  Run jar

    ``` bash
    java -Duser.timezone=UTC -jar logseq.jar
    ```

### 7. Open the browser

Open <http://localhost:3000>.

## Windows setup

### 1. Required software

Install Clojure through scoop-clojure: <https://github.com/littleli/scoop-clojure>. You can also install [Node.js](https://nodejs.org/en/), [Yarn](https://yarnpkg.com/) and [PostgreSQL](https://www.postgresql.org/download/) through scoop if you want to.

### 2. Create a GitHub app

Follow [Step 2](#2-create-a-github-app) above if you want Logseq to connect to GitHub. If not, skip this section. The `GITHUB_APP_PEM` variable in the `run-windows.bat` needs to be set with the correct directory for your system.

### 3. Set up PostgreSQL

Make sure you have PostgreSQL running. You can check if it's running with `pg_ctl status` and use `pg_ctl start` to start it up. You'll also need to make a Logseq DB in PostgreSQL. Do that with `createdb logseq`.

### 4. Download the Clojure server

Go to <https://github.com/logseq/logseq/releases>, download the `logseq.jar` and move into the root directory of repo.

### 5. Start Logseq

Run `start-windows.bat` which is located in the repo. This will open a second terminal that runs Logseq's backend server. To completely stop Logseq, you'll need to also close that second terminal that was opened.

`start-windows.bat` will try to start PostgreSQL for you if it's not already started.

## Build errors
### 1. The required namespace `devtools.preload` is not available.
Upload your clojure to at least version `1.10.1.739`.
