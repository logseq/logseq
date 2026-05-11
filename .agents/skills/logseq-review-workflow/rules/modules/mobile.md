# Mobile Review Rules

Apply when a change touches mobile UI, Capacitor plugins, platform-specific code, filesystem access, keyboard behavior, sync on mobile, or responsive layouts.

## Review focus

- Platform checks should be explicit and should not affect desktop/browser paths accidentally.
- Mobile filesystem, permission, and URI behavior should be reviewed separately from desktop paths.
- Keyboard, safe-area, touch, and viewport behavior can differ from desktop.
- Long-running operations should handle backgrounding, resume, flaky networks, and low memory.

## Red flags

- Desktop path assumptions reused for mobile local files or assets.
- Browser/Electron APIs used in Capacitor-only contexts without guards.
- Async work that assumes the app remains foregrounded.
- UI controls too dependent on hover, precise pointer behavior, or desktop shortcuts.
- Missing permission failure handling.

## Review questions

- Which platforms are affected: iOS, Android, desktop, browser?
- What happens on app background/resume?
- Are permissions denied, revoked, or delayed?
- Does layout work with safe-area and mobile keyboard?
- Are platform-specific tests/manual checks listed?

## Related modules

Load [`i18n.md`](./i18n.md) when mobile changes add or edit shipped user-facing text, notification text, translated attributes, dictionaries, or i18n lint configuration.
