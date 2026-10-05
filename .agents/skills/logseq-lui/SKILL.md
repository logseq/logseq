---
name: logseq-lui
description: "LUI view-layer rules for deps/ui (OCaml + lui_ppx). Use whenever writing or editing deps/ui view code: component kinds, reactive/signal usage, dyn ban, if_/keyed, style_class policy, platform extension rules."
---

# deps/ui LUI View Rules

All view code in `deps/ui/src/**` and `deps/ui/apple/**` is built from
`Lui_elements` kinds + typed props. `lui_ppx` is enabled.

## Hard rules

1. **Never call `dyn` directly** — not `Lui_elements.dyn`, not
   `Logseq_dom.dyn`. `dyn` is a ppx expansion target (implementation
   detail). Writing `dyn` in view code is a bug; use `reactive` in
   children position instead.
2. **No DOM escape hatches** — no `~attrs` JSON, no `~html`, no DOM event
   name strings, no `dom ~tag` calls. Everything is a kind + typed props.
3. **Typed props are the only layout channel** — gap/padding/width/height/
   flex/alignment go through typed props, never through class names.
4. **`~style_class` carries only app-semantic classes** (e.g.
   `ui__toast`, `cp__*`) that real stylesheets target. Utility classes
   (`flex`, `gap-2`, `p-3`, `w-full`, `text-sm`, ...) are deleted, not
   preserved.
5. **The extension channel is only for genuinely platform-specific
   widgets** (editor surface, split/dock, gpui-table, pdf/media).
   Generic UI must not use extensions.

## Reactive API (the only reactive vocabulary)

`reactive` is the single reactive form. Three positions:

```ocaml
(* 1. prop position: ~p:(reactive f s) — value changes, node stays put *)
button ~icon:(reactive (fun v -> if v then `eye_off else `eye) visible) []

(* 2. children position: model -> subtree, replaces dyn *)
column [ reactive (fun m -> pane_of m.tab) model_s ]

(* 3. children position with custom comparator — ~equal leads, like
   `dyn ~equal f s`. Omit ~equal when (=) suffices (the default). *)
reactive ~equal:(fun a b -> a.id = b.id) (fun m -> view_of m) model_s

(* signal of elements, and multi-signal tuple are also supported: *)
reactive elements_s
reactive (fun (a, b) -> combined a b) s1 s2
```

- `~p:(reactive f s)` expands to `~p_signal:(Signal.map f s)` — never
  write `Signal.map` or `~p_signal:` by hand for derived props.
- Write `~p_signal:s` directly only when you already hold a `Signal.t`
  for that prop.

## Structural primitives (kept, used only when signal-driven)

```ocaml
(* mount/unmount on a bool signal *)
if_ ~test:(reactive (fun v -> v <> "") value) (button ...)

(* signal-driven list with identity *)
keyed ~source:items_s ~key:(fun it -> it.id) ~cmp:Int.compare
  ~mount:(fun item_s -> row item_s)
```

- `if_ ~test` / `keyed ~source` — these params only accept signals; no
  `_signal` suffix.
- **Static structure uses plain OCaml**: `if` for static conditions,
  `List.map`/`for` for static lists. Do not wrap static branching in
  `if_`/`reactive`.

## Decision rules

- Value changes (text, icon, disabled, class, attrs) → `reactive` prop.
- A whole subtree switches shape on a signal → `reactive` in children.
- A child mounts/unmounts on a bool signal → `if_ ~test`.
- List membership/order changes on a signal → `keyed ~source`.
- Anything else → plain OCaml.
- Nested `dyn`-inside-`dyn`/`if_` patterns are almost always wrong: the
  inner layer usually changes only props — demote it to `reactive` props.

## Signals

- Derive view state via `Signal.map` on `*_state` signals (usually
  through `reactive` sugar); never read the DOM or shared refs for view
  state.
- Do not plumb `Signal.value`/manual subscription wiring by hand.
- `dyn`/`if_`/`keyed` do NOT own the signals they consume: derive
  signals once at section emit and share them across mounts; a fresh
  `Signal.map` inside a remounting branch body leaks an upstream
  subscription on each remount.
- `Logseq_dom.own` exists only for `extension_property_signal` binding;
  it is not for view code.

## Comments and docs

All code comments and PR descriptions must be in English.
