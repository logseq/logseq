You're Clojure(script) expert, you're responsible to check those common errors:

- `empty?` should be used instead of `empty` when a boolean value is expected in an expression.

- If a function does not use `d/transact!`, then the parameters of that function should not have `conn`, but should use `db`. `conn` is mutable, and `db` is immutable.

- If the arguments of `cljs-time.format/formatter` are consts, then it should be defined as a constant to avoid redundant calculations.

- Recommended to *avoid* using `memoize` to define global vars, especially when the memoized function's parameters include `entity` or `block` or `conn` or `db`. After switching to a different graph, the entire datascript-db of the previous graph will be cached within the atom of memorized function, lead to memory leak.

- Avoid using `dorun` to execute side effects; `doseq` is recommended.

- `util/web-platform?` is a not a function.

- It is recommended to use `lambdaisland.glogi` for printing logs.
  - Require `[lambdaisland.glogi :as log]` if needed.
  - Replace `js/console.error` with `log/error`.
  - Replace `js/console.warn` with `log/warn`.
  - Replace `js/console.log` with `log/info`.
  - NOTE: `log/<level>` function takes key-value pairs as arguments

- After adding a new property in `logseq.db.frontend.property/built-in-properties`, you need to add a corresponding migration in `frontend.worker.db.migrate/schema-version->updates`.
  - e.g. `["65.10" {:properties [:block/journal-day]}]`

- If common keywords are added or modified, make corresponding changes in their definitions.
  - common keywords are defined by `logseq.common.defkeywords/defkeywords`

- A function that returns a promise, and its function name starts with "<".

## i18n review rules

- Use `.i18n-lint.toml` as the source of truth for i18n lint scope, covered UI
  helpers, translated attributes, exclusions, and allowlists.
- Inside that scope, all shipped user-facing UI text must use helpers from
  `frontend.context.i18n`. Console text is exempt. Keep out-of-scope
  developer-only `(Dev)` labels inline in code/config, not in translation
  dictionaries.
- If a new user-facing surface is not represented in `.i18n-lint.toml`, flag
  the missing lint coverage.
- Reuse existing `src/resources/dicts/en.edn` keys only on exact semantic owner
  and textual role match. Otherwise follow `docs/i18n-key-naming.md`.
- Add new English source text to `src/resources/dicts/en.edn`. Add non-English
  entries only when providing actual translations. When renaming or removing
  keys, clean up stale keys in affected locale files.
- `notification/show!` and translated attributes from `.i18n-lint.toml`
  (placeholder/title/aria/label-like UI text) must not receive raw English
  string literals unless proven non-user-facing.
- For plain dynamic text, use placeholders like `{1}` and pre-format arguments
  in the caller before passing them to `t`.
- Keep complete sentences in one translation entry. Use
  `interpolate-rich-text`, `interpolate-sentence`, `locale-join-rich-text`, and
  `locale-format-*` from `frontend.context.i18n` instead of assembling text ad
  hoc in the caller.
- Function-valued translations are allowed only for real logic or hiccup rich
  text, and may only use `str`, `when`, `if`, and `=`.
- Rich text and inline links must stay in a single translation entry, not split
  across multiple keys.
- Preserve emoji/icon glyphs from `en.edn`, and use punctuation natural to each
  locale.
- Pluralization is locale-specific. Do not force English singular/plural
  structure onto other locales.
- After changing keys run `bb lang:validate-translations`; after changing UI
  text run `bb lang:lint-hardcoded`; after editing dictionary files run
  `bb lang:format-dicts`.
- If you add a new linted helper or attribute, update `.i18n-lint.toml`.

- Prohibit converting js/Uint8Array to vector. e.g. `(vec uint8-array)`
  - This operation is very slow when the Uint8Array is large (e.g. an asset).

- `:block/content` attribute is not used in the DB version; `:block/title` is the attribute that stores the main content of the block.
