# GPUI host interactive audit

Date: 2026-10-06 (updated after fix pass — see `devin/component-migration`
`b0620c9c`..`d47021b4` and logseq/lui PRs #126, #127, #128)
Branch audited: `devin/component-migration` @ `d47021b48f`
Auditor: Devin session `9759783d3e414c33b062400b9699f978`

## Verdict: RUNS — interactive surface works after fixes

First pass was **blocked at link** (missing `lui_ocaml_press_detail` /
`lui_ocaml_context_menu_press` bridge exports) and then hit a chain of
runtime gaps. All were fixed in this audit cycle; the host now launches,
navigates, edits, and renders icons + typeset math.

## Fixes landed during this audit

| Where | Commit | What |
|---|---|---|
| logseq `devin/component-migration` | `ab665ad268` | pointer-detail ABI exports in `apple/logseq_lui_bridge.c` + `native_embed.ml` registrations (unblocks linking) |
| logseq | `b0620c9cf2` | `native_embed` now wires `Update.apply` (not `Update.update`) so action effects run — navigation/route-load deadlocks fixed; `imperative_dom.id_of` stops treating `#ref` snapshots as imperative nodes so delegated `closest()` works |
| logseq | `f130be9846` | `apple/logseq_editor.ml` registers `Editor_sink` (native `set-input-focus`/`is-focus`); host queues `PENDING_FOCUS` until the editor entity mounts; `window.activate_window()` + `cx.activate(true)` for frontmost focus |
| logseq | `c828ca336d` | cmdk renders reuse the `S.latest_t` singleton — palette mounts correctly |
| logseq | `d47021b48f` | contextmenu target injection + `.ls-block` fallback; latex identifier splitting; `app:` icon resolver |
| logseq/lui | PR #126 merged | window-level keydown → dom-event bridge + DOM key-name mapping (unblocks cmd+k, `/`, Esc) |
| logseq/lui | PR #127 merged | `Row`/`Box` admit press/pointer events (clicks were dead) |
| logseq/lui | PR #128 open | `app_icon_svg` host hook + `Icon` fallback; `text`/`label` kinds render element children inline (fixes invisible katex/refs/tags inside block titles) |

## Scenario results

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 0 | Build (`dune @all` + `cargo build`) | PASS | Links after `ab665ad2` + lui main |
| 1 | Initial render (sidebar/page/cmdk) | PASS | Full shell mounts; journal page loads (`audit-shots/02`) |
| 2 | Block editor + CJK + caret | PASS | Click→`enter_edit`→focus lands on editor input; `insert`/`apply_input` round-trip verified; typed `audit ASCII 中文日本語 mixed text` visibly committed (typed text in `audit-shots/03`). IME marked-text not exercised (no IME session driven) |
| 3 | cmdk scroller + focus | PASS | cmd+k opens palette, query filters, Esc closes |
| 4 | popover/menu positioning | PASS (partial) | Right-click opens page-title menu and block menu at the pointer (`audit-shots/04`); menus do NOT dismiss on Esc/outside-click (no background hit target) — P2 below |
| 5 | `$$…$$` katex + pdf/asset | PASS (katex) | `$$x^2+y^2=z^2$$` and `$$E = mc^2 + \int_0^1 x\,dx$$` typeset to SVG images inline (`audit-shots/03`). pdf/asset blocks not exercised — no pdf asset in the graph |
| 6 | Resize + virtual_list | UNTESTED | not re-driven after fixes |
| 7 | Pointer detail (x/y/modifiers) | PASS (contextmenu) | `press_detail`/`context_menu_press` wired end-to-end; shift+click selection not exercised |

## Findings (severity-ranked, current)

1. **[P1] Cold start is ~8s to interactive.** IPC itself finishes ~2.9s
   after daemon reuse; the rest is OCaml publish→patch→first-frame plus
   daemon spawn. Target asked for: 300ms fully-interactive on a
   1000-journal × 100-block graph — needs IPC parallelization/lazy fetch
   and first-frame slimming. **Next work item.**
2. **[P2] Menus don't dismiss on outside-click/Escape.** No background
   hit target on gpui; `close_cm_picker` only runs from item actions.
3. **[P2] `katex-pending`/`hljs-pending` dom-ops unsupported on gpui.**
   Harmless today — the latex element renders via `is_latex_slot`
   interception — but the pending-notification path logs
   `unsupported` noise and the `initial`→ready class transition never
   runs (no visual flicker mitigation).
4. **[P3] Bare `text` nodes only render via `text_element`;** children
   were silently dropped (fixed upstream by lui #128). Any other kind
   that implicitly carries children should be audited the same way —
   `Paragraph`/`Heading` signatures take `nothing` children so they are
   safe; `Label` is covered by the same fix.
5. **[P3] `block_display_type=Some "math"`** blocks take a
   `math-block` box path — verified to render through the same latex
   slot; `\begin{env}` matrix/env handling in `latex_to_typst` is
   partial (unknown envs degrade to a parenthesized body).
6. **[P3] Env drift (process, recurring)**: opam 5.5.0 switch pins
   drift; `scripts/install-opam-deps.sh` covers the deps.

## Resolved findings from the blocked report

- ~~gpui host does not link at HEAD~~ — `ab665ad268` + lui main.
- ~~Pointer-detail path absent on OCaml side~~ — same commit registers
  all named values (`press_detail`, `context_menu_press`, `pointer_*`).
- ~~Navigation dead / route stuck on Home~~ — `b0620c9cf2`.
- ~~Block click cannot enter edit~~ — `b0620c9cf2` + `f130be9846` +
  lui #127.
- ~~cmd+k dead~~ — lui #126 + `c828ca336d`.
- ~~Right-click no context menu~~ — `d47021b48f` (event `target`
  injection + every `dom` element opts into `contextmenu`; `.ls-block`
  non-editable fallback covers the ~2px bullet hit area).
- ~~`[icon]` placeholders~~ — `d47021b48f` + lui #128 (`app_icon_svg`
  hook: bundled tabler table + custom svg set, `currentColor`→theme
  foreground, rasterized and cached).
- ~~LaTeX blank rows~~ — lui #128 `text` children + `d47021b48f`
  identifier splitting (`mc`/`x2`/`x\alpha` no longer merge into unknown
  typst identifiers).

## What's still stub / deferred

- **Native popover positioning**: popups render inline in the DOM-ish
  tree via `.ed-pos` absolute wrappers (verified working for menus);
  true anchored popover kind not emitted by the app yet.
- **Menu dismissal**: no outside-click layer on gpui (P2 above).
- **Editor IME marked text**: scratch-buffer IME exists in
  `gpui/host/src/editor.rs`; not driven end-to-end in this pass.
- **`katex-pending`/`hljs-pending` dom-ops**: unsupported on gpui;
  typeset render happens through the extension slot instead.
- **Window resize/virtual_list**: unexercised.

## Screenshots

- `audit-shots/00-initial-shell.png` — shell mount (sidebar + journal)
- `audit-shots/01-graph-loaded.png` — post-daemon graph load
- `audit-shots/02-journal-page-loaded.png` — journal page
- `audit-shots/03-icons-latex-rendered.png` — icons in sidebar +
  both `$$` formulas typeset inline
- `audit-shots/04-block-context-menu.png` — right-click block menu
