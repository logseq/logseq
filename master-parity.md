# Master UX parity (refactor/lui)

Tracking LUI vs master (`9af1a190`) headless Chromium parity findings. Each group owns only its section.

## G3 — autocomplete & refs

| check | module | master behavior | LUI behavior | repro | severity | status |
| --- | --- | --- | --- | --- | --- | --- |
| pageref-open | 11 autocomplete | Empty `[[` popup lists 10 date shortcuts (Today … Next year) | Listed 34 date shortcuts | page `pageref-open`; edit end; type `[[` | low | fixed `135989e0bb` |
| pageref-down-enter | 11 autocomplete | `[[Exist` list is Exist \| Existing Page \| Existing Other (no New page when exact page exists); Down+Enter picks Existing Page | Always inserted New page Exist as 2nd row | page `pageref-down-enter`; type `[[Exist`, ArrowDown, Enter | med | fixed `d2f9f6071d` |
| pageref-ctrl-n-p | 11 autocomplete | ctrl+n/p walk Exist → Existing Page → Existing Other | Walked Exist → New page Exist → Existing Page | page `pageref-ctrl-n-p`; type `[[Exist`, Control+n/p | med | fixed `d2f9f6071d` |
| tag-open | 11 autocomplete | `#` popup lists built-in tags without Page | Also listed built-in Page class | page `tag-open`; type `#` | low | fixed `f7c7e893b1` |
| tag-filter | 11 autocomplete | Tag list is items only under `#ui__ac` (hint is sibling outside `#ui__ac`) | Hint text appeared inside `#ui__ac` | page `tag-filter`; type `#MyT` | low | fixed `789ca92986` |
| tag-new | 11 autocomplete | Same `#ui__ac` / hint sibling structure as master | Hint appeared inside `#ui__ac` | page `tag-new`; type `#NewTagX`, Enter | low | fixed `789ca92986` |
| tag-space-closes | 11 autocomplete | `#` popup has no Page | Included Page | page `tag-space-closes`; type `#` then space | low | fixed `f7c7e893b1` |
| tag-duplicate | 11 autocomplete | Same `#ui__ac` / hint sibling structure as master | Hint appeared inside `#ui__ac` | page `tag-duplicate`; add `#MyTag` twice | low | fixed `789ca92986` |
| slash-filter | 11 autocomplete | Filtering `/head` keeps group header Heading | Group headers dropped while filtering | page `slash-filter`; type `/head` | low | open — owned by G5 (slash popup) |
| slash-nomatch | 11 autocomplete | `/zzzzqq` with no match closes popup | Stayed open; raw key fixed by G7 (`editor.slash/no-matched-commands`) | page `slash-nomatch`; type `/zzzzqq` | med | open — owned by G5 (slash popup); raw-key fixed `4e9897330d` |
| slash-space-close | 11 autocomplete | `/` then space closes slash popup | Stayed open with full command list | page `slash-space-close`; type `/ ` | med | open — owned by G5 (slash popup) |
| slash-then-pageref | 11 autocomplete | After slash then `[[`, empty popup has 10 date items | Had 34 date items | page `slash-then-pageref`; type `/`, Backspace, `[[` | low | fixed `135989e0bb` |
| follow-link-sidebar | 13 refs/embeds | Ctrl+Shift+O inside `[[Linked Pg2]]` opens page in right sidebar | Nothing; sidebar stayed closed | caret inside ref; mod+shift+o | high | fixed `b4f17a0497` |

## G7 — i18n

Shared dictionaries: `resources/dicts/*.edn` (25 locales). LUI loads EN embedded + other locales on demand; Settings → General → Language matches master's `frontend.dicts/languages` and persists `localStorage["preferred-language"]`, then reloads.

| check | module | master behavior | LUI behavior | repro | severity | status |
| --- | --- | --- | --- | --- | --- | --- |
| recycle-delete-confirm | recycle | Hardcoded English permanent-delete confirm | Raw key `storage.recycle/delete-*-confirm-desc` | Recycle → permanent delete | high | fixed `68c632606e` (keys + zh-CN; English matches master) |
| recycle-restored-toast | recycle | No restore toast (silent) | Restore toast showed raw `storage.recycle/restored-feedback` | Recycle → Restore | med | fixed `68c632606e` |
| export-error-unexpected | export / worker | Dict key `:export/error-unexpected` | Key missing from LUI dicts; toast path ignored `:i18n-key` | Export EDN failure | high | fixed `720ba5c8c2` + `1f3cb98848` |
| storage-invalid-data-writing | worker notify | Dict key `:storage/invalid-data-writing` via `:i18n-key` | Key missing; Nil-message + i18n-key dropped | Invalid DB write notification | high | fixed `720ba5c8c2` + `1f3cb98848` |
| import-unsupported-key | i18n helper | `:graph.add-existing/unsupported-error` | Helper used missing `import/unsupported-error` | Latent helper | low | fixed `16ef4a073f` |
| slash-no-matched-key | slash popup | Hardcoded `"No matched commands"` | Raw `editor.slash/no-matched-commands` | `/zzzzqq` | med | fixed `4e9897330d` (popup-close still G5) |
| validate-db-cmdk-toasts | cmdk / (Dev) | Handler only invokes worker; worker notifies | Hardcoded `"Your graph is valid"` / `"Validation failed"` | Command palette → Validate | low | fixed `3bdd9242c4` |
| language-menu-options | settings | 25 locales from `dicts/languages` | Same 25 codes/labels | Settings → Language | high | fixed (already matched; verified) |
| language-switch-rerender | settings | `set-preferred-language!` + re-render-root | `I18n.load` + `doc_reload` (full reload) | Switch zh-CN / ja / de; reload | high | fixed (reload parity; verified) |
| language-persist | settings | `localStorage preferred-language` | Same storage key/EDN quote | Switch language; reload | high | fixed (already matched) |
| missing-key-lint | CI | `bb lang:validate-translations` (opam AST) | No opam-free LUI key check | CI | med | fixed `04149588b0` (`scripts/test-lui-i18n-keys.mjs`) |
| worker-validate-english | db-worker | Hardcoded English validate notifications | Same hardcoded English in OCaml worker | (Dev) Validate | low | needs-decision — matches master worker hardcoding; dict keys exist (`graph.validation/valid`) but neither side uses them for the broadcast body |
| a11y-english-labels | various | Mixed a11y identifiers | A few English `~label` / DnD a11y sentences remain | Screen reader / DnD | low | needs-decision — not shipped visible chrome; no matching master keys for most |
