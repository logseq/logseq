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
[src/main/frontend/dicts.cljc](https://github.com/logseq/logseq/blob/master/src/main/frontend/dicts.cljc)
and
[src/main/frontend/modules/shortcut/dicts.cljc](https://github.com/logseq/logseq/blob/master/src/main/frontend/modules/shortcut/dicts.cljc).

## Language Overview

First, let's get an overview of Logseq's languages and how many translations your
language has compared to others:

```shell
$ bb lang:list

|  :locale | :percent-translated | :translation-count |              :language |
|----------+---------------------+--------------------+------------------------|
|      :es |                 100 |                492 |                Español |
|      :tr |                 100 |                492 |                 Türkçe |
|      :en |                 100 |                492 |                English |
|      :uk |                  95 |                466 |             Українська |
|      :ru |                  95 |                466 |                Русский |
|      :ko |                  93 |                459 |                    한국어 |
|      :de |                  93 |                459 |                Deutsch |
|      :fr |                  92 |                453 |               Français |
|   :pt-PT |                  92 |                453 |    Português (Europeu) |
|   :pt-BR |                  92 |                451 | Português (Brasileiro) |
|      :sk |                  90 |                445 |             Slovenčina |
|   :zh-CN |                  90 |                441 |                   简体中文 |
|   :nb-NO |                  75 |                370 |         Norsk (bokmål) |
|      :ja |                  75 |                368 |                    日本語 |
|      :pl |                  72 |                353 |                 Polski |
|      :nl |                  72 |                353 |     Dutch (Nederlands) |
| :zh-Hant |                  71 |                349 |                   繁體中文 |
|      :it |                  71 |                349 |               Italiano |
|      :af |                  22 |                106 |              Afrikaans |
Total: 19
```

Let's try to get your language translated as close to 100% as you can!

## Edit a Language

To see what translations are missing for your language use:

```shell
$ bb lang:missing LOCALE

|                       :translation-key |                                  :string-to-translate |
|----------------------------------------+-------------------------------------------------------|
|                            :cards-view |                                            View cards |
|                                :delete |                                                Delete |
|                          :export-graph |                                          Export graph |
|                           :export-page |                                           Export page |
|                          :graph-search |                                          Search graph |
|                       :open-new-window |                                            New window |
```

Now, manually, add keys for your language to the translation files, save and rerun the above command. 
Over time you're hoping to have this list drop to zero.

Almost all translations are pretty quick. The only exceptions to this are the keys `:tutorial/text` and `:tutorial/dummy-notes`. These reference files that are part of the onboarding tutorial. Most languages don't have this translated. If you are willing to do this, we would be happy to have this translated.

### \*nix-like command

For \*nix translators, since this process is a LITTLE tedious to do it manually, here is a small **command** to process the output of `bb lang:missing` command and leave it almost ready to paste it on the dict files.

```shell
bb lang:missing LOCALE | awk -F '|' '{print $2 "\"" $3 "\""}' | sed 's/  //g' | sed 's/ :/:/g' > untranslated_strings.txt
```
transforms the output from:
```
|                       :settings-page/tab-features |                                              Features | frontend/dicts.cljs |
|              :whiteboard/link-whiteboard-or-block |                            Link whiteboard/page/block | frontend/dicts.cljs |
|                   :command.auto-complete/complete |                   Auto-complete: Choose selected item | shortcut/dicts.cljs |
|                       :command.auto-complete/next |                       Auto-complete: Select next item | shortcut/dicts.cljs |

```
to:
```
:settings-page/tab-features "Features "
:whiteboard/link-whiteboard-or-block "Link whiteboard/page/block "
:command.auto-complete/complete " Auto-complete: Choose selected item "
:command.auto-complete/next " Auto-complete: Select next item "
```

The translator just need to:

0. Ignore garbage at the beggining and end of the `untranslated_strings.txt` file.
1. In the `untranslated_strings.txt` file check which strings go to which file and since the `bb` output is ordered it is only need to split the strings in *half*.
2. After splitting the strings, copy a bunch of strings to their corresponding file and translate them. Repeat until finish.
3. Make the proper indentation.

## Fix Untranslated

There is a lot to translate and sometimes we forget to translate a string. To see what translation keys are still left for your language use :

```shell
$ bb lang:duplicates LOCALE

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
