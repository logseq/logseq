# Native code toolbar, language selection and ISO warning evidence

## Sources and execution boundary

The serial validation owner ran the two actual macOS cases below using:

| Source | Revision |
| --- | --- |
| Production Logseq UI/application code | `b78faff411fff1bd735d0e25d4df2d4792985115` |
| LUI | `f29b2473621f7a07293bbf884f135d22126d4928` |
| NSH | `adc186db7213f3ccd1eacaa836cc721e9779fd14` |
| Frozen master comparison | `29fd2edd015e12963742b985ce6d2311c074e09b` |

The cases loaded the coherent, freshly published release OCaml library,
Resources and real database worker from the actual application build. The
application Rust crate was compiled into NSH's private mixed test fixture. Both
logs explicitly report building an SDK **development host** for macOS. These
are actual AppKit input/rendering and real owned-worker tests, not standalone
installed release-process performance measurements. They do not qualify memory,
cold startup, hardware IME, every desktop platform or the complete application
UX. The fixture observers admit read-only tree/native-bounds/capture requests;
edits and choices travel through ordinary native controls and the application.

This note was prepared from preserved logs, JSON and PNGs; no new test, native
process or compiler was run while writing it. Local evidence paths are
ephemeral references, not artifacts committed to the repository.

## Code toolbar and language selection

Log: `/tmp/logseq-floating-toolbar-native-language.log`.
Case result: **PASS**, 23.0s; the test command summary reports 24.1s including
its surrounding runner work. Evidence directory:
`/var/folders/0w/_kw_j8wj2ys51lh1hr5f_vqh0000gn/T/logseq-native-code-block.lkZg2A`.

The actual case established:

1. Production insertion seeded `alpha` as a code block with language
   `plaintext`, an independently normalized fenced-code control, and a guard.
2. The toolbar began at opacity zero. Public native pointer hover on the actual
   code wrap revealed the same wrap and language trigger. The primary wrap was
   node **408**, language trigger **410**, and action row **409**. Both real
   Button frames had height **16pt**: the language control was 75×16 and Copy
   was 56×16. The 135×16 toolbar lay inside its 914×20 wrap, without the former
   separate toolbar row. The second code block's action row remained at
   opacity zero. These are measured native frames, not only declared heights.
3. Actual native editor input persisted `x` through the real worker. The
   language action opened the existing popup. Rust menu item **585** initially
   lay outside the viewport: raw AppKit bounds `[1066,-93,94,32]` and
   `intersectsViewport=false`.
4. A native wheel operation on the actual popup Scroll **560** moved that same
   Rust item to `[1066,245,94,32]`, with `intersectsViewport=true`. Native press
   selected Rust; the worker and code extension both reported `rust`, the popup
   item retired, and the original code extension **415** remained retained.
5. Native Undo restored `alpha` in the worker while preserving language `rust`,
   the original code owner and the untouched control/guard blocks, parent and
   sibling order. Recorded backend-error checks remained clear.

Frozen master hides `.extensions__code-lang` inside `.ls-code-editor-wrap` and
places its action bar absolutely at top/right with compact controls
(`components/block.css:1995–2014`). The inspected native images now show one
language caption in the overlay action and no duplicate plain badge beside the
Editor. This is bounded visible/interaction evidence, not pixel-perfect theme
or typography parity.

Inspected PNGs, relative to the evidence directory above:

- `code-toolbar.png`: compact primary toolbar overlays the first code row;
  the unfocused control code row has no visible action bar.
- `language-menu-scrolled.png`: the actual scrolled menu includes Rust.
- `after-undo.png`: selected `alpha` is restored, with Rust still shown in the
  retained toolbar.

Raw companions include `code-toolbar-geometry.json`,
`language-menu-geometry.json`, `language-menu-scrolled-geometry.json`,
`observations.jsonl` and the final canonical tree. The language flow does not
activate the application Copy button. Its live-draft clipboard behavior, the
remembered language for newly created code blocks, cross-block navigation,
long-code bounds/memory, query/file editor parity, hardware IME, dark appearance
and reduced-motion pixels remain separate qualification work.

## Invalid ISO warning, containment and dismissal

Log: `/tmp/logseq-intrinsic-owner-native-toast.log`.
Case result: **PASS**, 21.3s; the command summary reports 22.3s including runner
work. Evidence directory:
`/var/folders/0w/_kw_j8wj2ys51lh1hr5f_vqh0000gn/T/logseq-native-property-date.ZHLO9a`.

The original date value was February 28, 2024. Native entry of invalid
`2023-02-29` produced the real warning without normalizing or changing the
date, datetime, guard, blocks or their order. Native hover kept the exact
warning alive for 1700ms, exceeding its authored 1500ms lifetime, before the
close test. Thus natural timeout was not substituted for successful dismissal.

The recorded raw native frames were:

| Node | Role | AppKit content bounds `[x,y,w,h]` |
| --- | --- | --- |
| 686 | Toast card | `[1040,16,384,82]` |
| 687 | Content overlay | `[1053,29,358,56]` |
| 690 | Description | `[1093,37,280,40]` |
| 692 | Named Close Button | `[1379,41,32,32]` |

The complete overlay, description and 32×32 close target fit inside the card.
The description ended at x=1373, before the close target began at x=1379.
This resolves the earlier 24pt right overflow without an extra application
Toast controller or the parked application-specific content wrappers. The
existing NSH Toast/ToastStack retained timeout, hover pause and dismissal.

Actual native press on Close removed warning **686**. As an ordinary click
outside the property popover, it also retired calendar **575** and its draft
input. This matches frozen master's outside-dismiss policy: only the bottom
property edit icon has an exemption (`components/property/value.cljs:1000–1004`).
No property mutation accompanied dismissal. An ordinary pencil click reopened a
fresh calendar **698** with a fresh empty draft. Native valid `2024-02-29` input
then persisted the real journal reference and closed the picker. Reopening
again showed February 29 selected, and ordinary Escape closed it. Sibling and
unrelated property checks stayed intact, with no backend error.

Inspected PNG: `invalid-iso.png` in this evidence directory. It shows the
wrapped warning and contained close icon near the bottom right. Exact raw
evidence is in `invalid-iso-toast-geometry.json` and `observations.jsonl`.

### Coordinate interpretation

`native-bounds` declares AppKit window-content coordinates, not Core layout or
desktop screen coordinates. The actual NSH content container is an unflipped
NSView, so these raw bounds use a bottom-left origin. The PNG uses top-left
image coordinates. For viewport `[0,0,1440,900]`, convert a rectangle with:

```text
top_left_x = raw_x
top_left_y = 900 - raw_y - height
```

The Toast therefore starts at image y=`900−16−82=802`, exactly where it appears
in the inspected PNG. The description starts at y=823 and Close at y=827.
This is an expected coordinate conversion, not an animation mismatch or a
native-bounds defect. Relative containment comparisons use one common raw
coordinate space and remain valid. No response coordinate policy was changed.

## Subsequent admission check and remaining boundaries

The serial owner subsequently fixed the toolbar test fixture's unnecessary
assignment of its generic string-model App to the real `Native_embed.current_app`
slot. Native admission passed later at App
`6311462a89d341cba2c86c218c594ead7b7e1b8c`. That is a separate qualification from
the actual native cases above; the production UI had already compiled and run.
The admission regression covers controlled-source repaint, retained editor and
action identities, hover/focus-only opacity changes and state-slot cleanup.

These passes do not qualify the current application Copy implementation,
physical keyboard/IME hardware, installed-package restart/durability, full
light/dark UX, standalone release memory, or remaining migration modules.
