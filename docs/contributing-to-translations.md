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

Language translations are under,
[src/main/frontend/dicts/](https://github.com/logseq/logseq/blob/master/src/main/frontend/dicts/) with each language having it's own file. For example, the es locale is in `es.cljc `.

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

To see what translations are missing for your language, let's run a command using `es` as the example language:

```shell
$ bb lang:missing es
|                      :translation-key |                                  :string-to-translate |         :file |
|---------------------------------------+-------------------------------------------------------+---------------|
|    :command.editor/toggle-number-list |                                    Toggle number list | dicts/es.cljc |
|     :command.whiteboard/bring-forward |                                          Move forward | dicts/es.cljc |
|    :command.whiteboard/bring-to-front |                                         Move to front | dicts/es.cljc |
...
```

Now, manually, add keys for your language to the translation files, save and rerun the above command.
Over time you're aiming to have this list drop to zero. Since this process can be tedious, there is an option to print the untranslated strings to copy and paste them to the files:

```sh
# When pasting this content, be sure to update the indentation to match the file
$ bb lang:missing es --copy

;; For dicts/es.cljc
:command.editor/toggle-number-list "Toggle number list"
:command.whiteboard/bring-forward "Move forward"
:command.whiteboard/bring-to-front "Move to front"
...
```

Almost all translations are small. The only exceptions to this are the keys `:tutorial/text` and `:tutorial/dummy-notes`. These reference files that are part of the onboarding tutorial. Most languages don't have this translated. If you are willing to do this, we would be happy to have this translated.

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

To add a new language:
* Add an entry to `frontend.dicts/languages`
* Create a new file under `src/main/frontend/dicts/` and name the file the same as the locale e.g. zz.cljc for a hypothetical zz locale.
* Add a `(def dicts {})` in that file and then add a entry in the `dicts` map in `src/main/frontend/dicts.cljc`.
* Then start translating for your language and adding entries in your language's `dicts` using the `bb lang:missing` workflow.