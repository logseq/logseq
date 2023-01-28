# Logseq

[![latest release version](https://img.shields.io/github/v/release/logseq/logseq)](https://github.com/logseq/logseq/releases)
[![License](https://img.shields.io/github/license/logseq/logseq?color=blue)](https://github.com/logseq/logseq/blob/master/LICENSE.md)
[![Twitter follow](https://img.shields.io/badge/follow-%40logseq-blue.svg?style=flat&logo=twitter)](https://twitter.com/logseq)
[![forum](https://img.shields.io/badge/forum-Logseq-blue.svg?style=flat&logo=discourse)](https://discuss.logseq.com)
[![discord](https://img.shields.io/discord/725182569297215569?label=discord&logo=Discord&color=blue)](https://discord.gg/KpN4eHY)
[![total](https://opencollective.com/logseq/tiers/badge.svg?color=blue)](https://opencollective.com/logseq)

[![Contributors](https://opencollective.com/logseq/tiers/sponsors.svg?avatarHeight=24&width=600)](https://opencollective.com/logseq)
[![Contributors](https://opencollective.com/logseq/tiers/backers.svg?avatarHeight=24&width=600)](https://opencollective.com/logseq)

A local-first, non-linear, outliner notebook for organizing and sharing your personal knowledge base.

Use it to organize your todo list, to write your journals, or to record your unique life.

<a href="https://www.producthunt.com/posts/logseq?utm_source=badge-review&utm_medium=badge&utm_souce=badge-logseq#discussion-body" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/review.svg?post_id=298158&theme=light" alt="Logseq - Your joyful, private digital garden | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

## [Download our free Desktop app](https://github.com/logseq/logseq/releases)
[Sponsor our contributors on Open Collective](https://opencollective.com/logseq), Logseq will move to Stripe later!

## Why Logseq?

[Logseq](https://logseq.com) is a platform for knowledge management and collaboration. It focuses on privacy, longevity, and [user control](https://www.gnu.org/philosophy/free-sw.en.html).

The server will never store or analyze your private notes. Your data are plain text files and we currently support both Markdown and Emacs Org mode (more to be added soon).

In the unlikely event that the website is down or cannot be maintained, your data is, and will always be yours.

![Image of logseq](https://cdn.logseq.com/%2F8b9a461d-437e-4ca5-a2da-18b51077b5142020_07_25_Screenshot%202020-07-25%2013-29-49%20%2B0800.png?Expires=4749255017&Signature=Qbx6jkgAytqm6nLxVXQQW1igfcf~umV1OcG6jXUt09TOVhgXyA2Z5jHJ3AGJASNcphs31pZf4CjFQ5mRCyVKw6N8wb8Nn-MxuTJl0iI8o-jLIAIs9q1v-2cusCvuFfXH7bq6ir8Lpf0KYAprzuZ00FENin3dn6RBW35ENQwUioEr5Ghl7YOCr8bKew3jPV~OyL67MttT3wJig1j3IC8lxDDT8Ov5IMG2GWcHERSy00F3mp3tJtzGE17-OUILdeuTFz6d-NDFAmzB8BebiurYz0Bxa4tkcdLUpD5ToFHU08jKzZExoEUY8tvaZ1-t7djmo3d~BAXDtlEhC2L1YC2aVQ__&Key-Pair-Id=APKAJE5CCD6X7MP6PTEA)

## Sponsors

Our top sponsors are shown below! [[Become a sponsor](https://opencollective.com/logseq#sponsor)]

<a href="https://www.deta.sh/" target="_blank"><img width=200 height=100 src="https://uploads-ssl.webflow.com/5eb96efa78dc680fc15be3be/5ebd24f6cbf6e9ebd674656e_Logo.svg" /></a>


## Plugins documentation (Draft)
The plugins documentation is at https://logseq.github.io/plugins. Any feedback would be greatly appreciated!

## Feature requests

Please go to https://discuss.logseq.com/new-topic?category=feature-requests.

## How can I use it?

1. Download the desktop app at https://github.com/logseq/logseq/releases.
2. Start writing and have fun!

## FAQ
Please go to https://docs.logseq.com/#/page/faq.

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

- Our blog: [https://blog.logseq.com/](https://blog.logseq.com) - Please be sure to visit our [About page](https://blog.logseq.com/about) for the latest updates of the app
- Twitter: https://twitter.com/logseq
- Forum: https://discuss.logseq.com - Where we answer questions, discuss workflows and share tips
- Discord: https://discord.gg/KpN4eHY
- 中文 Discord：https://discord.gg/xYqcrXWymg
- GitHub: https://github.com/logseq/logseq - everyone is encouraged to report issues!

---

The following is for developers and designers who want to build and run Logseq locally and contribute to this project.

We have [a dedicated overview page](https://github.com/logseq/logseq/blob/master/CODEBASE_OVERVIEW.md) for Logseq's codebase overview and [a development practices page](docs/dev-practices.md).

## Set up development environment
* For setting up web app / desktop app development environment on macOS / Linux, please refer to [Develop Logseq](docs/develop-logseq.md).

* For Windows users, please refer to [Develop Logseq on Windows](docs/develop-logseq-on-windows.md) in addition.

There are more guides in [docs/](docs/), e.g. the [Guide for contributing to translations](docs/contributing-to-translations.md) and the [Docker web app guide](docs/docker-web-app-guide.md)

## How to contribute with a PR
If you would like to contribute by solving an open issue, please fork this repository and then create a branch for the fix.

Once you push your code to your fork, you'll be able to open a PR into Logseq repository. For more info you can follow this guide from [GitHub docs](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork). 

Enabling "allow edits from maintainers" for PR is highly appreciated!

There's a nice [project board](https://github.com/orgs/logseq/projects/5/views/1?pane=info
) listing items that easy for contributors to catch-up

And here a list of some [good first issues](https://github.com/logseq/logseq/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22)!

## Thanks

[![JetBrains](docs/assets/jetbrains.svg)](https://www.jetbrains.com/?from=logseq)
