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
[src/resources/dicts/](https://github.com/logseq/logseq/blob/master/src/resources/dicts/) with each language having it's own file. For example, the es locale is in `es.edn`.

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
|    :command.editor/toggle-number-list |                                    Toggle number list | dicts/es.edn  |
|     :command.whiteboard/bring-forward |                                          Move forward | dicts/es.edn  |
|    :command.whiteboard/bring-to-front |                                         Move to front | dicts/es.edn  |
...
```

Now, manually, add keys for your language to the translation files, save and rerun the above command.
Over time you're aiming to have this list drop to zero. Since this process can be tedious, there is an option to print the untranslated strings to copy and paste them to the files:

```sh
# When pasting this content, be sure to update the indentation to match the file
$ bb lang:missing es --copy

;; For dicts/es.edn
:command.editor/toggle-number-list "Toggle number list"
:command.whiteboard/bring-forward "Move forward"
:command.whiteboard/bring-to-front "Move to front"
...
```

Almost all translations are small. The only exceptions to this are the keys `:tutorial/text` and `:tutorial/dummy-notes`. These translations are files that are part of the onboarding tutorial and can be found under [src/resources/tutorials/](https://github.com/logseq/logseq/blob/master/src/resources/tutorials/).

### Editing Tips

* Some translations may include punctuation like `:` or `!`. When translating them, please use the punctuation that makes the most sense for your language as you don't have to follow the English ones.
* Some translations may include arguments/interpolations e.g. `{1}`. If you see them in a translation, be sure to include them. These arguments are substituted in the string and are usually used something the app needs to calculate e.g. a number. See [these docs](https://github.com/tonsky/tongue#interpolation) for more examples.
## Fix Mistakes

Sometimes, we typo a translation key or forget to use it. If this happens, the
github CI step of `bb lang:validate-translations` will detect these errors and
tell you what's wrong. If you get an error about duplicate translations and this
is a valid duplication for the language, then add it to `allowed-duplicates` in
[lang.clj](https://github.com/logseq/logseq/blob/master/scripts/src/logseq/tasks/lang.clj).

## Add a Language

To add a new language:
* Add an entry to `frontend.dicts/languages`
* Create a new file under `src/resources/dicts/` and name the file the same as the locale e.g. zz.edn for a hypothetical zz locale.
* Add an entry in `frontend.dicts/dicts` referencing the file you created.
* Then start translating for your language and adding entries in your language's EDN file using the `bb lang:missing` workflow.