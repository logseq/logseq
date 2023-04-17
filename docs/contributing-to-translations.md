## Intro

Thanks for your interest in improving our translations! This document provides
details on how to contribute to a translation. This document assumes you can run
commandline tools, know how to switch languages within Logseq and basic
Clojurescript familiarity. We use [tongue](https://github.com/tonsky/tongue), a
most excellent library, for our translations.

## Setup

In order to run the commands in this doc, you will need to install
[Babashka](https://github.com/babashka/babashka#installation).

## Where to Contribute

Language translations are in two files,
[frontend/dicts.cljc](https://github.com/logseq/logseq/blob/master/src/main/frontend/dicts.cljc)
and
[shortcut/dict.cljc](https://github.com/logseq/logseq/blob/master/src/main/frontend/modules/shortcut/dicts.cljc).

## Language Overview

First, let's get an overview of Logseq's languages and how many translations your
language has compared to others:

```sh
$ bb lang:list


|  :locale | :percent-translated | :translation-count |              :language |
|----------+---------------------+--------------------+------------------------|
|      :en |                 100 |                494 |                English |
|   :nb-NO |                  90 |                445 |         Norsk (bokmål) |
|   :zh-CN |                  87 |                432 |                   简体中文 |
|      :ru |                  85 |                422 |                Русский |
|   :pt-BR |                  77 |                382 | Português (Brasileiro) |
|   :pt-PT |                  76 |                373 |    Português (Europeu) |
|      :es |                  71 |                349 |                Español |
| :zh-Hant |                  55 |                272 |                   繁體中文 |
|      :af |                  51 |                253 |              Afrikaans |
|      :de |                  48 |                238 |                Deutsch |
|      :fr |                  39 |                195 |               Français |
Total: 11
```

Let's try to get your language translated as close to 100% as you can!

## Edit a Language

To see what translations are missing:

```
$ bb lang:missing
|                       :translation-key |                                  :string-to-translate |
|----------------------------------------+-------------------------------------------------------|
|                            :cards-view |                                            View cards |
|                                :delete |                                                Delete |
|                          :export-graph |                                          Export graph |
|                           :export-page |                                           Export page |
|                          :graph-search |                                          Search graph |
|                       :open-new-window |                                            New window |
...
```

Now, add keys for your language to the translation files, save and rerun the above command. Over time
you're hoping to have this list drop to zero.

Almost all translations are pretty quick. The only exceptions to this are the keys `:tutorial/text` and `:tutorial/dummy-notes`. These reference files that are part of the onboarding tutorial. Most languages don't have this translated. If you are willing to do this, we would be happy to have this translated.

## Fix Untranslated

There is a lot to translate and sometimes we forget to translate a string. To see what translation keys are still left in English:

```
$ bb lang:duplicates
Keys with duplicate values found:

|                  :translation-key | :duplicate-value |
|-----------------------------------+------------------|
|                          :general |          General |
|                           :logseq |           Logseq |
|                               :no |               No |
```

## Fix Mistakes

Sometimes, we typo a translation key or forget to use it. If this happens,
the github CI step of `bb lang:validate-translations` will detect these errors
and tell you what's wrong.

## Add a Language

To add a new language, add an entry to `frontend.dicts/languages`. Then add a
new locale keyword to `frontend.dicts/dicts` and to
`frontend.modules.shortcut.dicts/dicts` and start translating as described above.
