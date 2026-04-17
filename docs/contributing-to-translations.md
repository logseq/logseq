## Intro

Thanks for helping improve Logseq translations.

This guide is for contributors who translate existing UI text or add missing
translations for a locale. It is not the guide for changing application code,
inventing dictionary keys, or rewriting the English source text in
`src/resources/dicts/en.edn`.

If the English wording or key name is wrong, ask a developer to update
`en.edn` and follow [the key naming guide](i18n-key-naming.md).

## Setup

To run the commands in this doc, install
[Babashka](https://github.com/babashka/babashka#installation).

## Where Translations Live

Translation dictionaries live under
[src/resources/dicts/](https://github.com/logseq/logseq/blob/master/src/resources/dicts/).
Each locale has its own EDN file, for example `es.edn`.

`en.edn` is the source of truth for keys and English text. Most translation
contributors only need to edit their locale file.

## Find Missing Translations

To see the overall translation status of every locale:

```sh
bb lang:list
```

That table includes `:untranslated-count`, which shows how many English keys
are still missing for each locale, and `:same-as-en-count`, which helps you
spot locales that still contain entries copied from English.

To see which entries are missing for one locale, use `es` as an example:

```sh
bb lang:missing es
```

To print copy/paste-ready entries:

```sh
bb lang:missing es --copy
```

That command prints the missing keys and the current English value so you can
paste them into your locale file and translate them there.

## Find Entries Still Matching English

To list them for one locale, use `es` as an example:

```sh
bb lang:pseudo es
```

This is a review tool, not a hard error. Some entries may legitimately match
English, but many are unfinished translations copied from `en.edn`.

## Edit a Locale

1. Run `bb lang:missing <locale>`.
2. Add the missing keys to `src/resources/dicts/<locale>.edn`.
3. Save the file.
4. Run `bb lang:missing <locale>` again until the list is empty or contains
   only entries you want to leave for later.

Missing keys are allowed. Logseq falls back to English automatically, so do not
copy English into your locale file just to make the list shorter.

### Editing Tips

- Translate the complete sentence or label owned by the key. Do not rename keys
  or split one sentence across multiple keys.
- If the English value is a plain string, keep your locale value a plain
  string.
- Keep placeholders exactly aligned with English, for example `{1}` and `{2}`.
- If the English value uses hiccup or `(fn ...)`, keep the same outer shape and
  translate only the user-visible strings inside it. If changing that structure
  seems necessary, ask a developer for help.
- Preserve emoji and icon glyphs from `en.edn` exactly, but use punctuation
  that is natural for your language.
- If a sentence is already correct in your language without plural logic, use a
  plain string. Do not add function logic just because English does.

## Fix Mistakes

Run this before submitting translation changes:

```sh
bb lang:validate-translations
```

It checks for:

- locale keys that do not exist in `en.edn`
- dictionary keys that are no longer used
- placeholder mismatches such as `{1}` vs `{2}`
- locale entries that no longer match an English rich-translation shape

`bb lang:validate-translations` does not flag entries that still match English.
Use `bb lang:pseudo <locale>` when you want to review those separately.

To remove stale or invalid keys automatically:

```sh
bb lang:validate-translations --fix
```

`--fix` removes invalid or unused keys. It does not repair placeholder mistakes
or rewrite rich translations for you.

After editing dictionary files, run:

```sh
bb lang:format-dicts
```

This restores the repo's canonical key ordering and namespace spacing.

You do not need `bb lang:lint-hardcoded` for translation-only work. That
command is for developers who are editing UI code.

## Add a Language

To add a new language:

1. Add an entry to `frontend.dicts/languages`.
2. Create a new file under `src/resources/dicts/` and name it after the locale,
   for example `zz.edn`.
3. Add that file to `frontend.dicts/dicts`.
4. Use the `bb lang:missing <locale>` workflow to populate translations.
5. Run `bb lang:validate-translations` and `bb lang:format-dicts`.
