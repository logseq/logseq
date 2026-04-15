---
name: logseq-i18n
description: "Logseq i18n workflow for adding, renaming, reviewing, or editing translation keys and user-facing strings. Use when: writing UI code with hardcoded text, adding new user-facing strings, editing translation dict files, reviewing i18n compliance, working with notification/show!, adding translatable UI attributes, or any task involving src/resources/dicts/. Also use when the user mentions i18n, translation, localization, or hardcoded strings."
---

# Logseq i18n Skill

## When This Skill Applies

- Adding or editing user-facing strings in shipped UI
- Replacing hardcoded UI text with translations
- Adding, renaming, deduplicating, or removing keys in `src/resources/dicts/`
- Reviewing code for i18n compliance
- Editing `notification/show!` calls or translatable UI attributes
- Updating i18n tooling, docs, or lint configuration

## Read These First

1. `docs/i18n-key-naming.md` for key ownership, reuse, and naming
2. `.i18n-lint.toml` for lint scope, covered helpers/attributes, exclusions,
   and allowlists
3. `src/main/frontend/context/i18n.cljs` for the translation helper APIs

Use `docs/contributing-to-translations.md` only when the task is specifically
about locale contribution workflow.

## Scope Rules

- `.i18n-lint.toml` is the source of truth for which files and APIs are checked
  for hardcoded UI text.
- Inside that scope, all shipped user-facing UI text must be internationalized.
- Console output does not need i18n. Keep out-of-scope developer-only `(Dev)`
  labels inline in code/config, not in translation dictionaries.
- If you introduce a new UI helper, alert API, translatable attribute, UI
  namespace, or shipped surface, update `.i18n-lint.toml` so lint coverage
  stays accurate.

## Use These Helpers

All translation helpers live in `frontend.context.i18n`.

| Helper | Use for |
|---|---|
| `t` | Standard translation with preferred locale |
| `tt` | Try multiple keys and return the first existing translation |
| `t-en` | Force English text when UI output also needs English console/debug output |
| `interpolate-rich-text` / `interpolate-rich-text-node` | Replace placeholders with rich-text or hiccup fragments |
| `interpolate-sentence` | Keep a full sentence in one key while inserting placeholders and inline links |
| `replace-newlines-with-br` | Render translated newline characters as `[:br]` nodes |
| `locale-join-rich-text` / `locale-join-rich-text-node` | Join rich fragments with locale-aware separators |
| `locale-format-number` / `locale-format-date` / `locale-format-time` | Locale-aware formatting for dynamic values before translation |

Do not introduce parallel i18n helpers elsewhere unless the change also updates
the shared i18n API deliberately.

## Core Rules

### Rule 1: No hardcoded shipped UI text

If the text is user-facing and in `.i18n-lint.toml` scope, hardcoded literals in
buttons, labels, placeholders, tooltips, dialogs, notifications, empty states,
and similar UI are a bug.

### Rule 2: Reuse keys by meaning, not by English text

Search `src/resources/dicts/en.edn` first. Reuse a key only when both match:

- semantic owner
- textual role

If the English text matches but the meaning differs, create a new key and follow
`docs/i18n-key-naming.md`.

### Rule 3: English source lives in `en.edn`

- Add new English source text to `src/resources/dicts/en.edn`.
- Add non-English entries only when you are also providing actual translations.
- When renaming or removing keys, update affected locale files so stale keys do
  not remain behind.
- Do not copy English into non-English locale files just to fill gaps. Tongue
  falls back to `:en`.

### Rule 4: Keep complete sentences together

- Prefer one translation entry per complete sentence or message.
- Do not split rich text or linked text across multiple keys.
- Use `interpolate-sentence` or `interpolate-rich-text*` when markup and word
  order must stay together.

### Rule 5: Prefer placeholders for plain dynamic text

Use placeholder strings like `{1}` and `{2}` for plain dynamic text. Format
arguments in the caller before passing them to `t`.

### Rule 6: Function-valued translations are restricted

Use function values only when:

- the locale needs real logic such as conditional/plural behavior, or
- the translation must return hiccup rich text

When function values are necessary, only these are allowed inside the function
body:

- `str`
- `when`
- `if`
- `=`

### Rule 7: Locale details matter

- Preserve emoji and icon glyphs from `en.edn` exactly.
- Use punctuation natural to the locale.
- Pluralization is locale-specific. Do not force English singular/plural logic
  onto every language.

## Workflow

When adding or changing user-facing text:

1. Use `.i18n-lint.toml` to confirm the text is in i18n scope.
2. Search `src/resources/dicts/en.edn` for an exact semantic match.
3. If no exact match exists, name the key with `docs/i18n-key-naming.md`.
4. Add or update the English source text in `en.edn`.
5. Replace the literal with the appropriate helper from
   `frontend.context.i18n`.
6. Add/update locale translations only where actual translations are being
   supplied.
7. If you introduced a new linted helper/attribute/surface, update
   `.i18n-lint.toml`.

## Validation

After changing keys:

```bash
bb lang:validate-translations
```

After changing shipped UI text:

```bash
bb lang:lint-hardcoded --git-changed
```

After editing dictionary files:

```bash
bb lang:format-dicts
```

`bb lang:format-dicts` is the canonical repo formatter for dictionary key
ordering and namespace spacing.

## Common Mistakes

| Mistake | Fix |
|---|---|
| Hardcoded UI string in a linted UI surface | Move it into `en.edn` and use a helper from `frontend.context.i18n` |
| Reusing a key only because the English text matches | Reuse only on exact semantic owner + role match |
| Copying English into non-English locale files | Leave the key missing unless you are adding a real translation |
| Using `(fn ...)` for plain placeholder text | Use `"..."` with `{1}`, `{2}`, ... |
| Splitting one sentence across multiple keys | Keep a single translation entry and interpolate into it |
| Adding a new linted helper but not updating `.i18n-lint.toml` | Extend the TOML config in the same change |
| Editing dict files without running `bb lang:format-dicts` | Run the formatter before finishing |
