# Typed settings layout and native text checkpoint

## Root causes and repairs

The settings form declared its column ratios through CSS inside `data_attrs`. Native rendering ignored that web-only channel, so long labels moved switches and overflowed their cells. The shared recipe now uses typed zero-width flex bases and growth ratios. Settings panes use the reference 600px width bound and their article is a real scrolling kind rather than a column with an ignored CSS overflow rule. The desktop dialog retains its 70vh panel height.

The global-font checkbox had no intrinsic text or explicit dimensions, so its native frame collapsed. It now has a 16px frame. Actual native pointer activation produced a check mark and persisted `:global true`; a graceful close/restart restored that preference, and a later pointer activation restored `:global false`.

Native text parsed only a CSS variable's fallback, rendering the 36px page-title role as 32px. It now resolves app snapshot variables before numeric/family parsing. Native labels were measured as wrapping text but painted as single lines; labels now wrap, and measurement and painting share the declared line height. Category headings explicitly use the reference's normal weight.

Selected theme previews previously painted LUI's filled primary capsule. They retain semantic selection but paint an explicit, pointer-transparent 2px thumbnail outline instead. The outline remains visibly selected after the capsule is removed; the regression checks both conditions.

## Test-first evidence and validation

- Production native form layout first failed control alignment at 720px and 480px. It now checks alignment, width bounds, visible checkbox geometry and real checked-state dispatch.
- Native text tests separately reproduced variable fallback size, label wrapping and ignored line-height failures. The production text engine now passes their measurement/glyph assertions; ordinary button captions remain single-line.
- The theme-preview scene first failed the no-capsule assertion, then the visible-outline assertion. Both pass after the typed outline repair.
- Native paint/text/layout, platform and contract tests pass. The UI recording suite passes **2072 checks / 0 failures**. The focused search-creation/focus/persistence/graph-validation E2E also passed again after these changes.
- Actual SDL/OpenGL captures verify bounded label columns, wrapped long labels, category weight, visible/toggleable font checkbox and theme selection outline. The native text/platform checks also exercise Pango measurement and rasterization on Linux. CPU and OpenGL hosts have both been executed.

## Precise remaining issues

This is not full settings parity. First-row spacing, switch-thumb dimensions, some icons, theme-preview content, keymap editing/dispatch, custom accent propagation and preferred-font effects still require fixes/validation. Native solid-glyph opacity is a confirmed LUI renderer issue; authorization for a separate dependency-repository fix is pending. Nested dialog/article wheel targeting still differs and is not declared verified.

An independently launched master Electron bootstrap error briefly occluded the native window during capture. Those obstructed screenshots are not acceptance evidence. Clean native captures were taken after dismissing that unrelated reference setup dialog and refreshing the native surface. That also exposed a separate missing native window-expose repaint, which remains to be repaired.

Evidence files beside this document retain all visible residual differences. Linux execution does not validate macOS CoreText/AppKit behavior.
