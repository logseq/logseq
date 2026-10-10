# Review — theme CSS token layer vs the `Ui_theme` snapshot

Scope: `resources/css/theme/{colors,index,radix,vars-classic}.css` (2,660
lines, 671 unique custom properties, 2,389 definition lines) after the
migration of token→semantic mapping into
`deps/ui/src/shared/ui_theme.ml`. The snapshot is applied verbatim to
`documentElement.style` by `platform_web.ml`'s `theme_apply_snapshot`
(`root_set_prop`), invoked at boot (`app/boot.ml` →
`Settings_view.apply_theme_dom` → `Ui_theme.apply`) and on every mode
change (`sdk_ui.set_theme_mode`, `plugin_host` theme path,
`ui/system-theme?` store write). Inline `:root` custom properties beat
every stylesheet theme selector, so every static theme-level def of a
snapshot-emitted name is dead code.

## Method

- Extracted every `--name:` definition in the 4 files (with enclosing
  selector context).
- For each name counted consumers across `resources/css`, `deps/ui/**`,
  `resources/js`, `static/`: `var(--name)` uses, `setProperty`/
  `getPropertyValue` calls, and OCaml/JS/Rust string references —
  excluding the name's own definition line(s). `static/` is generated
  build output (`postcss tailwind.all.css → static/css/style.css`) with
  no tracked files, so its references mirror the sources.
- Cross-checked `--ls-*`/`--lx-*` names against the emitted table built
  from `ui_theme.ml`: `common_ls` (19) + `highlight_ls` (7) + `mode_ls`
  (13) literals emitted as `--ls-*` **and** `--lx-*` twins;
  `accent_bound` (37) emitted only as `--lx-*` → `var(--ls-<name>)`
  references; `level_vars` (`--color-level-1..6`); `lui_vars` (19);
  `canonical_vars` (42 `--lx-*`); `cmdk_vars` (8 per mode).
- Out-of-scope references recorded but not counted as consumers:
  `tailwind.config.js` (utility-class indirection + the
  `exposeColorsToCssVars` `--color-*` base vars),
  `deps/publish/src/logseq/publish/publish.css`.

## Summary

| file | unique names | consumed | dead-in-scope | snapshot overlap |
|---|---|---|---|---|
| `colors.css` | 84 | 67 | 17 (Questionable) | 0 |
| `index.css` | 21 | 21 | 0 | 0 |
| `radix.css` | 521 | 511 | 10 (9 Questionable, 1 keep-out-of-scope) | 0 |
| `vars-classic.css` | 82 | 82 | 0 | **45 DUPLICATE** |
| **union** | **671** | — | **26** | **45** |

Verdicts: **DUPLICATE** 45 names (69 def-lines) · **Questionable** 26
names (273 def-lines) · **KEEP** 600 names (2,047 def-lines).

## Classification table

### DUPLICATE of snapshot — delete static defs (45 names)

The snapshot emits each of these as literals on `documentElement` at
boot and per mode change, for **every** accent (they are all
accent-invariant — verified no `data-color` block in `colors.css`
rebinds any of them). `ui_theme_scenarios.ml`'s `required_ls_literals`
asserts the same list. All defs live in `vars-classic.css`.

| variable | def location(s) in vars-classic.css | consumers | note |
|---|---|---|---|
| `--ls-tag-text-opacity`, `--ls-tag-text-hover-opacity` | `:root` | 1, 1 | snapshot `common_ls` literals (0.8 / 1) |
| `--ls-page-text-size`, `--ls-page-title-size` | `:root` | 2, 6 | literals; `lui-overlay.css:118` keeps a scoped `--ls-page-title-size` rebind (wins in its scope — fine) |
| `--ls-main-content-max-width`, `--ls-main-content-max-width-wide` | `:root` | 6, 2 | literals |
| `--ls-font-family`, `--ls-scrollbar-width` | `:root` | 3, 2 | literals |
| `--ls-border-radius-low`, `--ls-border-radius-medium` | `:root` | 3, 1 | literals |
| `--ls-headbar-height`, `--ls-headbar-inner-top-padding` | `:root` | 3, 4 | literals |
| `--ls-left-sidebar-sm-width`, `--ls-left-sidebar-nav-btn-size` | `:root` | 2, 1 | literals |
| `--ls-native-kb-height` | `:root` | 1 | literal |
| `--ls-highlight-color-{gray,red,yellow,green,blue,purple,pink}` (7) | `:root` | 1 each | were `var(--rx-*-05)` chains; snapshot resolves the same colors to literals. Caveat: deleting this block orphans `--rx-yellow-05` (its only consumer is this line — see cascade note §6) |
| `--ls-block-bullet-color` | `:root` + light + dark logseq | 6 | `:root` def is the self-marked "For compatible. Will be deprecated" `var(--lx-gray-08)` fallback — value *differs* from the snapshot literal under non-logseq accents (see Findings §7.4). `shui.css:85` keeps a scoped rebind (fine) |
| `--ls-active-primary-color`, `--ls-active-secondary-color` | light + dark logseq | 3, 2 | `mode_ls` per-mode literals |
| `--ls-tertiary-border-color`, `--ls-guideline-color` | light + dark logseq | 2, 4 | `mode_ls` |
| `--ls-title-text-color` | light + dark logseq | 3 | `mode_ls`; light def chains `var(--ls-header-button-background)` — both emitted, values equal |
| `--ls-block-bullet-border-color` | light + dark logseq | 4 | `mode_ls` |
| `--ls-scrollbar-{foreground,background,thumb-hover}-color` (3) | light + dark logseq | 4, 3, 2 | `mode_ls` |
| `--ls-pie-bg-color`, `--ls-pie-fg-color` | light + dark logseq | 1, 1 | `mode_ls` |
| `--ls-header-button-background` | light + dark logseq | 2 | `mode_ls` |
| `--ls-page-mark-color`, `--ls-page-mark-bg-color` | light + dark logseq | 4, 4 | `common_ls` literals; previously logseq-accent-only — snapshot now delivers them for all accents |
| `--ls-button-background`, `--ls-button-background-hsl` | light + dark logseq | 4, 3 | `common_ls` (`hsl(var(--ls-button-background-hsl))` chain ≡ literal) |
| `--color-level-1..6` (6) | `.white-theme,.light-theme,html[data-theme='light']` + `html[data-theme=dark][data-color=logseq]` | 16 total | `level_vars`. Cascade note: the `.white-theme`/`.light-theme` defs land on **body** (classes applied by `theme_apply_classes`), so they outrank the html inline values for descendants — same resolved values, still redundant |

### Questionable — dead-in-repo, only wired through `tailwind.config.js` (26 names)

Zero consumers in `resources/css`/`deps/ui`/`resources/js`. Their only
reference is `tailwind.config.js`: `accent.*-alpha` / `gray.*-alpha`
color entries (→ utility classes like `bg-accent-03-alpha`, and the
`exposeColorsToCssVars` plugin's `--color-*-alpha` base vars). No
`var(--color-*-alpha)` consumer exists and no `*-alpha` utility class
appears in scanned content (`resources/**/*.html`, `deps/ui/**/*.ml` —
note `--lx-accent-*-alpha` is never even *defined* for the logseq
accent, so those utilities already resolve to nothing under the default
theme). **Decision needed**: delete the defs **and** the tailwind
`*-alpha` color entries + `gray` fallback chain in the same change, or
keep the family as accent-API surface for plugin themes.

| family | names | def-lines | location |
|---|---|---|---|
| `--lx-accent-{01,02,03,05,06,07,09,10,11,12}-alpha` | 10 | 150 | `colors.css` `body,.dark-theme,.light-theme` inside the 15 non-logseq `[data-color]` blocks. (`04` used by `lui-core.css:2946`, `08` by `shui.css:471` — those two stay) |
| `--lx-gray-{01,02,08,09,10,11,12}-alpha` | 7 | 105 | same blocks. (`03,04,05,06,07` are consumed — `lui-overlay.css:1896`, `tree.ml`, `ui_components.ml`, `shui.css` — they stay) |
| `--rx-gray-{01,02,04,05,08,09,10,11,12}-alpha` | 9 | 18 | `radix.css` `:root` + `html.dark` blocks. (`03,06,07` consumed as `var()` fallbacks in `deps/ui`/`lui-overlay.css` — they stay) |

Cascade: deleting the `--lx-accent-*-alpha`/`--lx-gray-*-alpha` defs
removes the only consumer of the non-gray `--rx-*-alpha` steps, leaving
them tailwind-only too — the alpha ladder is one coupled cleanup, not
26 independent deletions.

### KEEP (600 names)

| family | names | why |
|---|---|---|
| `--rx-<hue>-{01..12}` (+ `-alpha`) — 21 full hues + partial `yellow`(05,08,11), `sky`(11), `logseq`(no alpha) | 511 | Raw palette source data. Consumed as `var()` values by the `colors.css` accent maps, `vars-classic` highlight chains, `codemirror.lsradix.css`, `shui.css`, `deps/ui` fallbacks, `publish.css`. The snapshot does not emit palette ramps |
| `--ls-*` accent-bound (37 names) in `vars-classic.css` `html[data-theme=*][data-color=logseq]` blocks | 37 | **The logseq accent's `--ls-*` palette** — the only place these names are bound for the default accent. `accent_bound` in `ui_theme.ml` deliberately ships them as `--lx-*`→`var(--ls-*)` refs so per-accent stylesheet bindings keep resolving |
| `--ls-*` accent-bound subset (21 names) in `colors.css` non-logseq accent blocks | 21 | Same ownership — the tomato/red/blue/… palettes |
| `--lx-accent-{01..12}` / `--lx-accent-{04,08}-alpha` | 14 | Per-accent accent ramp → `colors.css` blocks; consumed by `tailwind.config.js` color entries, `shui.css`, `lui-*` css |
| `--lx-gray-{01..12}` / `--lx-gray-{03..07}-alpha` | 17 | Per-accent neutral ramp + `index.css:62` dark `--lx-gray-02`; consumed by `deps/ui`, `lui-*` css |
| shadcn/tailwind channels: `--background --foreground --card{,-foreground} --popover{,-foreground} --primary{,-foreground} --secondary{,-foreground} --muted{,-foreground} --accent{,-foreground} --destructive{,-foreground} --border --input --ring --radius` | 20 | `index.css` `:root`/dark base + `colors.css` per-accent rebinds; consumed as `hsl(var(--…))` triplets throughout `resources/css` and `deps/ui` |
| `--rx-yellow-08` | 1 | Only in-scope consumer is `deps/publish/.../publish.css` (out of audit scope but a live stylesheet) |

## `vars-classic.css` verdict

Not a dead legacy file — but it is now **two files' worth of content in
one**: (a) the `data-color=logseq` light/dark blocks holding the 37
accent-bound `--ls-*` names = the logseq accent palette (KEEP — this is
the only accent whose `--ls-*` map lives outside `colors.css`, an
asymmetry worth fixing by folding it into `colors.css`'s
`[data-color=logseq]` block), and (b) 45 names that are now
shadowed/redundant because the snapshot emits them as literals
(DUPLICATE — the whole `:root` block, the `.white-theme` levels block,
and the mode_ls/common_ls lines inside the logseq blocks). If (b) is
removed the file shrinks to the two `data-color=logseq` blocks (~75
lines) and could merge into `colors.css`, retiring the file.

## Findings / dangling references (context, not in the defined-name table)

1. **`--rx-*-hsl` never defined anywhere** — `index.css` `.primary-*`
   utilities (`--rx-{green,orange,red,yellow,purple}-10-hsl`),
   `.ui__button.as-outline` (`--rx-gray-{02,12}-hsl`), plus ~10 more
   refs in `shui.css`/`ui.css`/`lui-core.css` (`--rx-gray-{03,04,05}-hsl`,
   `--rx-red-{10,11,12}-hsl` absent too). Ten names, all dangling: the
   `.primary-*` primary-color overrides and the outline accent/channel
   rebinds silently no-op (invalid at computed-value time). Either
   generate the `-hsl` triplet twins in `radix.css` or drop the refs.
2. **Dark + logseq: `--lx-gray-03..12` undefined.** The logseq dark arm
   in `colors.css` only defines `--lx-gray-01`; `index.css` adds
   `--lx-gray-02`. Bare `var(--lx-gray-03|04|06|11|12)` consumers exist
   with no fallback: `settings_page.ml:294` background,
   `lui-core.css:3124`, `lui-overlay.css:4454/4459`,
   `shui.css:577` drop-shadow — all dead paint in dark+logseq.
   `vars-classic.css:152`'s dark `--ls-left-sidebar-text-color:
   var(--lx-gray-11)` resolves to nothing (pre-existing chain break,
   consumers fall back).
3. **`--ls-block-bullet-color` value divergence** — the deprecated
   `:root` fallback (`var(--lx-gray-08)` ≈ `#dadada`) applied under
   non-logseq accents; the snapshot now pins the logseq-classic
   `rgba(67,63,56,.25)`/`#608e91` for every accent. Tiny visible change
   for non-logseq accent users; correct per `mode_ls` ownership.
4. **Snapshot literals extend coverage for non-logseq accents** —
   `mode_ls`/`common_ls` names (`--ls-pie-*`, `--ls-scrollbar-*`,
   `--ls-active-*`, `--ls-page-mark-*`, dark `--color-level-*`) were
   previously bound only under `data-color=logseq`; the snapshot now
   supplies them (accent-consistent values) under every accent.
5. **Scoped rebinds intentionally survive** — `shui.css:85`
   `--ls-block-bullet-color`, `lui-overlay.css:118`
   `--ls-page-title-size`, and component-level `--ls-*`/`--lui-c-*`
   vars in `lui-overlay.css`/`lui-core.css`/`ui.css` override within
   their selector scope only; unaffected by the inline `:root` table.
6. **Stale hook names referenced but never defined** (resolve via
   `var()` fallbacks): `--ls-accent-color`, `--ls-caret-color`,
   `--ls-primary-color`, `--ls-quinary/-senary-background-color`,
   `--ls-font-family-code`, `--ls-color-icon-preset`,
   `--ls-win32-title-bar-height`, `--lx-popover-bg`,
   `--lx-popover-border`, `--lx-{blue-09,green-09,yellow-10,red-03,red-10,red-11,red-12}`.
   Dead plugin-extension surface — either define or prune the refs.
7. **`--ls-page-title-size`/`--ls-block-bullet-color` also defined in
   `lui-overlay.css:118`/`shui.css:85`** — component-scoped rebinding
   still wins inside those scopes; only the theme-level defs die.

## Recommended deletions (safe order)

1. `vars-classic.css`: delete the `:root` block (24 lines), the
   `.white-theme` levels block (6), and the mode_ls/common_ls lines in
   the `data-color=logseq` blocks (~39 lines); keep (or move to
   `colors.css`) the 37 accent-bound `--ls-*` defs per mode.
2. Alpha family: the 26 Questionable names **plus** `tailwind.config.js`
   `accent.*-alpha`/`gray.*-alpha` entries + `rx-NN-alpha` utilities —
   one coupled cleanup (~273 CSS lines + config entries).
3. Decide on `--rx-*-hsl` twins (Finding 1) before pruning `.primary-*`.
