# Variable-backed modal alpha

Reference: master `7dfa9b45a`; native predecessor: `1f32b060c`.
Both captures use Demo's `Native focus verified` page, 1280 x 900, scale 1,
English and explicit light mode. Graph visualization is excluded.

## Reproduction and repair

Open the header page menu and Settings over visible page content. Before,
the surrounding title/sidebar disappeared completely (`native-light-before.png`).
Master uses `bg-background/90` and retains faint page context (`master-light.png`).
The functional-color parser extracted alpha but applied it only to its fallback
color, not the normal resolved snapshot color. Apply alpha after either resolution
path. The repaired actual SDL/OpenGL app retains the underlying title/sidebar
(`native-light-after.png`); switching to dark also retains faint page context
(`native-dark-after.png`). Reset to light after verification.

## Validation

- Test first: independently derive expected alpha from the opaque background,
  rather than querying the same functional resolver as both actual and oracle.
  Added a 50% primary-color case. Before the repair, native-host tests fail with
  `functional variable colors multiply the resolved alpha`.
- After: native-host, contracts and host tests pass; shared UI suite reports
  **2072 checks, 0 failures**. Native executable and web targets build.
- Production scene test checks Dialog's full-viewport fill against independently
  computed background alpha (230), in both app theme snapshots.
- Actual native process restarted on the newly built binary; page selection,
  menu, Settings, dark and light actions performed with real desktop input.

This corrects earlier theme-ledger claims about backdrop opacity: semantic color
selection was repaired earlier, but functional alpha was not verified correctly
until this checkpoint. Settings text opacity, thumbnails, icons, spacing and
nested scrolling still differ; these captures do not establish whole-dialog parity.
