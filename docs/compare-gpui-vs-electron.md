# GPUI native host vs Electron desktop — UI comparison audit

Date: 2026-10-06
Branches: `devin/component-migration` @ `1542d78eb9`, logseq/lui @ `main 95cde52f` (+2 local commits noted below)
Graph: `~/logseq/graphs/Demo` — same seeded journal loaded in both hosts.
Seeded content covers: inline formatting, `[[Page Ref]]`/`#tag`/external link, inline+block math, ```clojure fence, TODO/DONE, 3-level nesting, `key:: value` properties, long paragraph, second `[[Page Ref]]` (linked references).

Electron: `pnpm electron-watch` + `dev-electron-app`, deps/ui renderer via `OPAMSWITCH=5.5.0 dune build js_app` + vite (:3001).
GPUI: `deps/ui/gpui/host/target/debug/logseq-gpui` with `LOGSEQ_DB_WORKER_BIN=deps/db-worker/_build/default/bin/main.exe`.

Screenshots: `docs/compare-shots/NN-<flow>-<host>.png`.

## Findings table

| Flow | GPUI status | Severity | Notes |
|---|---|---|---|
| Window / app chrome | works | — | Native window + traffic lights, custom title bar "Logseq App(2.0.1)". Parity with Electron. |
| Left sidebar | broken | high | Sidebar renders inline on top of journal content (no flex split); `t l` does not toggle it. Electron lays out sidebar as a real column beside content. `02-sidebar-*` |
| Journal render | partial | high | Blocks render but: no bullets, no indent guides, nested Parent/Child/Grandchild all flush-left flat; Electron shows bullets + proper indent. `03-journal-*` |
| Block display — formatting | broken | high | `**bold**`, `*italic*`, `~~strike~~`, `^^highlight^^`, `` `code` `` markers are stripped but no styling applied — all plain text. Electron styles all five. `03-journal-*` |
| Block display — links | partial | medium | Page links render literal `[[<uuid>]]`. (Raw-uuid titles come from attach_title_page_refs — same raw `[[uuid]]` on Electron, shared bug.) `#tag` and external-link render unstyled text on gpui; Electron styles tag/link. `03-journal-*` |
| Block display — KaTeX | missing | medium | `$E=mc^2$`, `$$x^2+y^2=z^2$$` render as plain serif text; log shows `dom-op katex-pending unsupported`. Electron renders real KaTeX (verified, known-stub confirmed). `03-journal-*` |
| Block display — code | broken | medium | Fence renders as a chip `∨ clojure ⌄ Copy` overlapping the sidebar plus a stray `clojure` label; body text detached. Electron shows numbered `1 ```clojure / 2 (+ 1 2 3) / 3 ```` lines. `03-journal-*` |
| Block display — properties | broken | medium | `seed::/type::/rating::` collapse into one mangled run: `seed:: valuetype:: test-datarating:: 5`. Electron renders three clean property lines. `03-journal-*` |
| Block editing | broken | high | Click switches block to raw-source edit view (works!), but every keystroke inserts the character TWICE (`hello` → `hheelllloo`, committed to db). Rendered text lags ~1 event behind input. Electron: click enters edit but the `.ed-input` focus conduit never mounts — keystrokes are swallowed and the session progressively wedges (see Electron column). `05-editing-gpui` |
| cmdk / command palette | partial | medium | `cmd+k` opens the inline bottom palette; input is NOT auto-focused — typing does nothing until the field is clicked, then filtering works (no key doubling here). `Enter` on "Toggle between dark/light theme" closed the palette but did not run the command. `cmd+shift+p` produced nothing visible. Electron: same no-autofocus, then works. `06-*` |
| Context menu | partial | medium | Right-click on a block opens "Open in sidebar / Add comment / Add reaction >" — rendered inline at the bottom of the page, not floating at the cursor (popover-overlay stub, verified). Electron: right-click produced no menu (session wedged). `07-contextmenu-gpui` |
| Navigation / breadcrumbs | partial | medium | `g a`/`g j`/`g h`/`g t` all route correctly (breadcrumbs `> Pages`, `> Journals`). `cmd+[` back did nothing. Journal-list row click does not navigate (same on Electron — shared dead-press bug). `g t` → "Page not found" (tomorrow has no page — correct-ish). `08-journals-gpui`, `09-*` |
| All Pages / table | broken | high | Headers render (Page name/Backlinks/Tags/Created At/Updated At) but ZERO rows on both hosts — table body empty despite ~30 pages. `09-allpages-*` |
| Properties view | partial | medium | Property lines rendered as mangled inline text (above). Header row Add icon / Set property / # present. Not tested deeper. |
| Folding | missing | medium | No bullets/indent → no fold affordance on gpui. Journal title has a `▶` triangle (untouched). Electron bullets fold normally. |
| Search | partial | medium | `cmd+k` search UI opens; after manual focus, typing works, but results are only "Create page '<q>'" — no page/block hits (index empty on both hosts). |
| Settings | partial | low | `t s` opens full Settings page (General/Editor/Keymap/Advanced/Features, language, font, accent, config.edn/custom.css links). Dark/light/system segmented control toggles the label but gpui never applies dark colors. `t t` is a no-op on gpui. `10-settings-gpui` |
| Toasts | untested | — | Could not trigger a notification on either host in this session. |
| Light/dark appearance | broken | high | Theme state flips (settings + cmdk) but gpui host never applies dark theme — always light. Electron honors dark theme. |

## Verified known stubs (per request — confirmed, not re-reported as new)

- **Popover overlay renders inline, not floating** — confirmed via context menu (`07-contextmenu-gpui`) and cmdk/search panel (bottom inline sheet on both hosts; Electron shares the inline-sheet treatment, so this is partly shared).
- **IME marked text incomplete** — not directly exercised (no CJK input attempted).
- **Generic input DOM focus gap** — partially outdated: block editing DOES engage on gpui and keystrokes DO reach the input (the reported "keystrokes hit the router → Page not found" was not reproduced; instead chars insert twice — the double-input is a NEW finding).
- **cmdk input may ignore keystrokes** — root cause is missing autofocus; after clicking the input, filtering works on gpui (same on Electron).

## What gpui does BETTER than electron

1. **Not wedged by the store generation desync.** Electron's web store died during the audit with `store batch: expected patch generation N, received N+1` (`lui_web_store.ml` `commit_batch`) — one failed patch consumed the generation while `retained_generation` froze, so every later batch threw `Invalid_argument` and all view mounts dead-ended until restart. GPUI's native store never desynced through the same session.
2. **Boot state recovery.** GPUI relaunches straight into the journal page every time; Electron restored whatever route the crashed session left and later wedged again.
3. **Editing actually reaches the input.** On gpui, block edit mode engages and text is committed (albeit doubled). On Electron, `.ed-input` never mounts (`PERF focus-retry` floods ~50 retries then gives up), keystrokes vanish, and the session degrades.
4. **Startup latency/footprint** — gpui host is a single native binary + daemon; Electron needed vite watch + helper processes and still produced a modal "Failed to install Logseq CLI" alert on boot.

## Electron-side bugs found during the audit (not gpui findings, reported for completeness)

- **Store batch generation desync** — `expected patch generation 3, received 4` at boot: a `patch op`-level `Invalid_argument` (message swallowed by `catch_quiet`) leaves `retained_nodes` half-applied and `retained_generation` frozen; `apply_pending_batch` in `lui_runtime.ml` deliberately consumes the failed batch, so every subsequent batch mismatches and the whole renderer wedges permanently. Requires app restart. `lui_web_store.ml` `commit_batch` also does not roll back `retained_nodes` on failure.
- **Block-edit click kills the session** — the focus conduit retries, the `.ed-input` extension never mounts, and keystrokes/pointer presses stop routing (sidebar items, `g a`, `cmd+k` all dead) — combined with the desync this makes the Electron session progressively unusable.
- **Journal-list row press doesn't navigate** (shared with gpui).
- **All Pages table empty** (shared with gpui — likely a shared views/worker data path issue, `views worker call failed` also logged on Electron).
- **CLI install alert** — `cli/install` fails (`Missing CLI script at static/logseq-cli.js`) and shows a modal on every cold start.

## Environment fixes made to unblock the audit (kept local, uncommitted)

These were required to get EITHER host to render the journal at all; they are pre-existing bugs in the branch, not audit findings:

- `deps/ui/src/pages/page.ml` — added `~grow:1.` on the `pt-inner` box: without it the page-title wrapper collapsed to ~0px and all blocks painted invisibly (LUI flex children need explicit `~grow`).
- `deps/ui/src/core/web_dom.ml` — `js_call2` `[@@mel.scope "Reflect"]` external miscompiled to `o.Reflect.call`; rewrote as `[%mel.raw]` function.
- `deps/ui/js_app/main.ml` — catch logs JS stack; registered `Logseq_editor`/`Logseq_virt` adapter identifiers (needed for extension mount).
- `~/repos/lui/platform/web/melange/core/lui_web_store.ml` (local commit) — `apply_create_extension` accepts empty `""` fingerprint → resolves to expected (extension mount crashed boot before this).
- `~/repos/lui/src/lui_protocol.ml` (local commit) — `Link` kind no longer requires `UrlValue` (link ops otherwise rejected).
