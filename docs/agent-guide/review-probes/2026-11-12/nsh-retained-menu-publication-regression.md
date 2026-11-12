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
