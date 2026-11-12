# Native PDFKit qualification boundary

Run `cargo run --manifest-path deps/ui/nsh/Cargo.toml --example pdf_qualification -- <fresh-directory>` on macOS. The directory must not already exist. The runner always uses NSH's background application policy and inspects only its own content views. It opens no user graph or OCaml library and has a 60-second process deadline.

`ok: true` and `qualificationScope: "native-api-checks"` establish the listed PDFKit document, page, scale, real text selection, highlight projection and error behaviors. They do **not** establish readable page pixels. The first actual locked/background run passed those APIs while its AppKit content-cache images showed a blank page and a small annotation mark. Visible page text remains unqualified.

Before each capture, the harness now performs one public `PDFView.layoutDocumentView`, AppKit subtree layout and `NSView.display` operation. It records native bounds, visible rectangles, layer-backed state, pending layout/display flags, window occlusion and application activation before/after. It then captures the actual application content through the existing LUI capture implementation. No timer, display tick, layer-hosting override, PDF thumbnail or separately rendered page substitutes for the real view.

Apple documents that [`PDFView.layoutDocumentView`](https://developer.apple.com/documentation/pdfkit/pdfview/layoutdocumentview()) is already called by document/zoom operations. Therefore a missing explicit call is not an established explanation for the blank capture. [`NSView.display`](https://developer.apple.com/documentation/appkit/nsview/display()) requests drawing of the real view hierarchy where possible. Its completion and cleared pending flags alone do not prove that asynchronous PDFKit page layers contributed pixels to [`cacheDisplay`](https://developer.apple.com/documentation/appkit/nsview/cachedisplay(in:to:)).

Inspect both PNGs after every run and record the result separately from the API assertions. `appContentPixels.status` remains `unqualified`; native layer/capture limitations must be reported if the page still does not appear. Full OCaml asset persistence/toolbar behavior, hardware input, keyboard focus and non-macOS providers require separate qualification.


## Own-view comparison and native header evidence

The second actual run remained blank after explicit layout/display. Its PDFView was 900×700 and nonhidden, its document view was 800×1423 with a nonempty visible rectangle, and both had clear pending layout/display flags. `window.occlusionState` was 8192, which does not contain the public Visible bit (2). The local Apple `AppKit/NSWindow.h:186–189` defines that bit's absence as complete window occlusion; a nonempty `visibleRect` does not account for occluding windows (`NSView.h:195`). These facts do not establish a product foreground-rendering defect.

The harness now saves `*-own-view.png` by caching the actual PDFView separately from the application content cache. It also reads a bounded tree of public CALayer metadata: class ancestry, tiled-layer membership, bounds, visibility, opacity and contents presence. It never changes the layers. Compare both captures: text in the own-view image but absent from the app image would isolate an ancestor capture/composition issue. Both images remaining blank with valid layout must retain the explicit capture limitation rather than claim either pixel success or broken product text.

The local Apple SDK headers are primary evidence for the remaining distinction: `PDFKit/PDFView.h:314–319` identifies the document view and automatic layout; `QuartzCore/CATiledLayer.h:6–24` describes asynchronously supplied tiles and future updates, and prohibits replacing tiled contents; `QuartzCore/CALayer.h:557–564` warns that `renderInContext` is not the complete compositor. A null public layer contents value is not proof that its internal tile store is empty. This diagnostic neither waits for a display update nor uses `renderInContext`, direct PDF page drawing, a thumbnail or a substituted image.

## Run 3: API checks pass; both content caches remain blank

Evidence: `/tmp/logseq-nsh-pdf-qualification-20261112-run3/result.json` and its PNGs. Root reported strict Clippy and all nine real native API checks passed. Visual inspection confirmed that both `pdf-initial.png` (application content) and `pdf-initial-own-view.png` (the actual PDFView alone) are blank white. This comparison does not isolate an NSH ancestor-host defect.

Both capture stages report an inactive application, a visible but fully occluded window (`occlusionState = 8192`, no public Visible bit), and a nonhidden 900×700 PDFView. The bounded public layer observations were:

| Observation | Initial capture | Highlight capture |
| --- | ---: | ---: |
| Layers inspected | 77 | 78 |
| `PDFPageLayer` objects | 2 | 2 |
| `PDFPageLayerTile` objects | 10 | 4 |
| Page tiles with `IOSurface` contents | 5 | 4 |
| `CAPortalLayer` objects | 2 | 2 |
| Class ancestry matching `CATiledLayer` | 0 | 0 |

Every observed page, page-tile and portal layer was nonhidden, had nonzero opacity and had no pending display flag. These are runtime class-name observations, not calls to private PDFKit APIs. In particular, the earlier general CATiledLayer explanation is not a confirmed implementation diagnosis: this run exposed PDFKit page tiles and portal layers, not CATiledLayer ancestry.

Existing IOSurface tile contents alongside blank AppKit caches are consistent with a content-cache/composition limitation; they do not prove readable tile pixels, a broken document, or a product foreground-rendering failure. No layer contents were replaced and no alternate compositor or PDF page image was used. Keep `qualificationScope = native-api-checks` and `appContentPixels.status = unqualified`. Page display, full toolbar behavior and OCaml persistence still require independent evidence.
