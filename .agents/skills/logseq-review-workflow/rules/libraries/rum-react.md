# Rum and React Review Rules

Apply when a change touches Rum components, React interop, hooks, refs, component local state, or Hiccup rendering.

## Review focus

- Render functions should be pure except for explicitly managed lifecycle hooks.
- Component subscriptions, event listeners, timers, and async work must be cleaned up.
- Hiccup collections should have stable keys where React identity matters.
- Expensive computations should not run on every render unless cheap or memoized safely.

## Red flags

- Side effects in render bodies.
- Unstable generated keys that force remounting.
- Capturing stale graph/page/block values in event handlers.
- Direct DOM mutation that conflicts with React ownership.

## Review questions

- Does the component behave correctly after graph switch, navigation, remount, or hot reload?
- Are listeners and timers disposed?
- Are slow derived values cached in a lifecycle-safe way?
- Do tests or manual steps cover the changed UI state transitions?

## Related modules and libraries

- Load [`../modules/i18n.md`](../modules/i18n.md) for shipped UI text, notification text, translated attributes, dictionaries, or i18n lint configuration.
- Load [`glogi.md`](./glogi.md) when logging is added or changed.
