# Frontend UI Review Rules

Apply when a change touches renderer UI components, settings screens, dialogs, context menus, pages, keyboard-visible UI, or UI state behavior.

## Review focus

- UI state should be derived from the right graph/page/window context and should reset on graph switch when needed.
- Long-running UI actions should expose progress, completion, or failure where appropriate.
- Accessibility behavior should match the component's interaction contract.
- Rendering should avoid expensive derived work in hot paths.

## Red flags

- UI state captured before graph switch or page navigation and reused afterward.
- Notifications that report success before async work has completed.
- Silent failures in user-triggered actions.
- DOM mutations outside React/Rum ownership without lifecycle cleanup.

## Review questions

- What happens on graph switch, page navigation, reload, or component remount?
- Does the UI surface failure in a user-actionable way?
- Are slow paths acceptable on large graphs?
- Are keyboard and accessibility interactions covered?

## Related modules and skills

- Load [`../libraries/datascript.md`](../libraries/datascript.md) when render behavior depends on DataScript queries or entities.
- Load [`i18n.md`](./i18n.md) for shipped UI text, notification text, translated attributes, dictionaries, or i18n lint configuration.
- Load `logseq-i18n` for detailed i18n implementation workflow.
