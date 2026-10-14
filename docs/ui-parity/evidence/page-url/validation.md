# Desktop Copy page URL

Reference master `7dfa9b45a`; native predecessor `8e74452cfe`.

Native page menus now include the existing translated `page/copy-url` action
after Favorites, matching desktop master. It closes the menu and writes the
page URL through the native host clipboard service. Shared formatting follows
`frontend.util.url/entity-url-for-copy` and its existing tests: prefer a
graph-qualified web page/block route, fall back to a desktop graph/entity URI
without a graph ID, and return no URL without either graph identity. Missing
page/identity warnings reuse the reference translation keys.

Native component encoding previously used URI query-value syntax, leaving
reserved characters such as `/`, `?`, `=` and `+` unescaped. Its existing
`encode_component` service now implements the reference `encodeURIComponent`
character set; desktop graph names separately preserve `encodeURI` semantics.

## Validation

- Test first: native URI character-set assertion fails; after its repair, the
  production page-menu test fails because the Copy action is absent. Both pass
  after implementation.
- Production native menu-item press writes the expected clipboard host request;
  both graph-qualified and protocol fallback branches checked independently.
- Seven shared URL regressions cover reference page/block cases, absent IDs,
  trailing base slashes, reserved characters and Unicode. Literal Unicode test
  fixtures use the existing runtime text boundary, not mojibake byte literals.
- Native executable/web/tests build; native-host/contracts/host tests pass;
  shared UI suite: **2094 checks, 0 failures**. Focused creation E2E passes.
- Actual SDL/OpenGL: new menu row visible (`native-menu.png`); click writes the
  correct journal entity URI (`native-local-only.json`). Then the disposable
  worker's existing ensure-local-graph-uuid API establishes its missing identity;
  after restart, the same click writes the graph-qualified route
  (`native-identified.json`). Actual master Electron copies the corresponding
  graph-qualified route (`master-identified.json`). The journal UUID matches;
  graph IDs differ intentionally between independent disposable graphs.

Reference copying requires stable foreground while its asynchronous browser
permission query completes. Action-scoped activation/restoration initially
left the owned clipboard sentinel unchanged; keeping this focus-sensitive
surface active and repeating the actual click produced the recorded URL.
No prior/private clipboard content was read: each check first writes an owned
fixture sentinel.

This verifies copying, not opening copied links in another app. Native import
identity preservation/registry reconciliation still needs investigation: direct
fixture import had left no live graph ID before the explicit test API call.
Full clipboard formats, menu focus/keyboard behavior, publishing actions and
deep-link launch handling remain separate parity work. No graph visualization
was opened or tested.
