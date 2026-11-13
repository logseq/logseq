# Native sidebar Help rows

## Intentional NSH presentation

The Web Help pane mirrors the frozen master markup: five text headings and fourteen circle-marker list entries, including thirteen external links and one shortcut-settings action. Its literal `display:list-item` and 19.2px marker indent have no faithful typed native equivalent. The native variant therefore uses the existing NSH ListItem baseline instead of inventing markers or rounding that indent.

The same producer and URL/translation call sites feed both presentations. Only exact NshHost selects the native helpers. The Web, SwiftUI and Kotlin branches retain the original node kinds, keys, children, inline styles, links, blank targets and shortcut button. No text, URL or translation key changes are introduced; the existing FAQ label is reused unchanged. The i18n skill and repository key/scope rules were read; no new copy helper or dictionary entry is needed.

Native Help has five semantic Heading nodes and fourteen named actionable ListItems. Each ListItem owns its sole press callback, with no nested Link or Button. Thirteen callbacks use the existing `Ui_services.env_open_url` service, also used by Help menu and Handbook. The other opens the same existing `shortcut-settings` sticky pane. Shortcut and forum icons retain their trailing position. The same original keys remain stable across model updates.

The row recipe reuses application nav density: 32px minimum, 8px horizontal/6px vertical padding, 4px radius, the existing 0.875rem/1.25rem typography, and semantic link/hover tokens. Height is not fixed, so content can grow. This intentionally differs from master's 24px text line plus circle marker and fractional indent; it is not pixel parity with the Web list. No fractional value is rounded. The real sidebar's existing Scroll remains the only scroll owner; Help adds no List, VirtualList or nested Scroll.

## Public ownership route

LUI `platform/nsh/src/controls/collections.rs:278` lowers an actionable ListItem through public `nsh_base::Button`. It supplies enabled state, semantic accessibility label/role, focus-visible outline and the standard Button Press event. The application does not install keyboard interception, custom focus state or another event dispatcher. Native keyboard delivery and actual short-window wheel geometry still require qualification; recording-host callback checks alone do not prove them.

## Source regressions

The maintained shared producer suite mounts actual `Right_sidebar_view.help_pane` under NSH, Web, SwiftUI and Kotlin profiles. It checks all five headings, fourteen action owners, all thirteen exact external URLs through the real dispatched app callback, the shortcut-pane state effect, retained native IDs, no nested scroll/action owners, and the exact original non-NSH marker/list structure and 19.2px declaration.

The existing Stub_dom `window.open` closure records URLs in a test-only ref, saved/reset/restored around fixtures. Installed Ui_services are not replaced or reinstalled. The help fixture owns one scheduler and Sidebar state per mount and preserves the prior global model/service state on exit. It does not touch an installed app, browser, graph, worker or user process.

Root owns compilation, shared tests, actual CMT carrier preflight and physical native UI qualification. This candidate is source-only and has not been executed by its author. A native follow-up should open Help through the existing right-sidebar UI, require five named headings and fourteen rows, test Tab/Enter on an owned row without opening the user's browser, and wheel to the final Terms row and back while preserving the topbar. External network/navigation and real keyboard delivery are not claimed by these source tests.
