# Native retained menu publication regression

The native admission runner now mounts the application's graph selector, toolbar
More menu, and two Favorites menus together with an unrelated input field.
It changes graph membership/current graph, page metadata, routes, and Favorites
order/title while checking every backend publication for a retained Button whose
direct ContextMenu presence changes. It also checks stable canonical trigger,
menu and editor identities and invokes a graph action after the previous reactive
scopes have retired.

This exercises the actual shared/native view constructors and their scope
reconciliation. It does not substitute a mock menu tree. It remains a structural
native admission probe: the Rust Headless renderer separately owns native Menu
controller, keyboard, dismissal and focus assertions.

The source was prepared without executing the native compiler or runner so the
primary build owner can serialize admission work. The runtime attachment failure
is not considered resolved until its reproduction and the updated admission
checks pass. The companion renderer diagnostic records only bounded structural
identifiers and transition direction; it contains no graph titles or user text.

## Semantic trigger keys

The view-type Menu used an unkeyed `action_button`. LUI intentionally reconciles
unkeyed children by position and component kind. Inserting an ordinary Button
before that trigger inside a rebuilt toolbar could therefore transfer the old
menu-bearing Button identity to the ordinary action and the ordinary action's
identity to the Menu trigger. Accessibility identifiers do not establish
reconciliation keys.

`Views_head.action_button` now forwards an optional key, and the view-type
trigger supplies its existing per-instance `vtype-<id>` identifier as that key.
Favorites/Recent menu Buttons likewise receive the row's stable semantic key.
No native trigger is forcibly remounted: the same action keeps its controller
when neighboring actions move. The native regression inserts/removes an ordinary
actual view action before `Views_head.display_type_el` and checks every
publication and the retained Menu identity. Renderer attachment validation is
unchanged. Runtime confirmation remains owned by the serialized build runner.
