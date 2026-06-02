# Shui Base UI and Tailwind v4 migration notes

This branch replaces the removed `packages/ui` React package with the ClojureScript-facing `logseq.shui` wrapper layer. Keep the wrapper thin: use Base UI primitives for behavior, keep styling in utility classes where possible, and avoid recreating Radix or shadcn component logic in `logseq.shui.components`.

Sources checked:

- Base UI Popover: https://base-ui.com/react/components/popover
- Base UI Menu: https://base-ui.com/react/components/menu
- Base UI Select: https://base-ui.com/react/components/select
- Base UI customization/events: https://base-ui.com/react/handbook/customization
- Radix Popover: https://www.radix-ui.com/primitives/docs/components/popover
- Tailwind v4 upgrade guide: https://tailwindcss.com/docs/upgrade-guide

## Base UI vs Radix

Base UI and Radix are both headless UI libraries, but their component anatomy and event APIs differ enough that direct prop forwarding is risky.

Base UI popup anatomy is explicit:

```tsx
<Popover.Root>
  <Popover.Trigger />
  <Popover.Portal>
    <Popover.Positioner sideOffset={8}>
      <Popover.Popup />
    </Popover.Positioner>
  </Popover.Portal>
</Popover.Root>
```

Radix popups usually put portal, positioning, and content props behind one `Content` wrapper in shadcn-style components. In Base UI, placement props such as `side`, `align`, `sideOffset`, `alignOffset`, `collisionPadding`, and `positionMethod` belong on `Positioner`, while classes, content events, and most DOM props belong on `Popup`.

Base UI uses `render` for composition. Radix uses `asChild`. The shui wrapper may keep accepting `:as-child true` for existing callers, but internally it must translate that to Base UI's `render` prop instead of building an alternate trigger implementation.

Base UI change callbacks receive `(value, eventDetails)`. The `eventDetails` object includes a `reason`, the DOM `event`, and methods such as `cancel` and `allowPropagation`. Radix popup content callbacks such as `onOpenAutoFocus`, `onCloseAutoFocus`, `onEscapeKeyDown`, and `onPointerDownOutside` are not one-to-one Base UI popup props. When preserving old call sites, adapt them deliberately at the wrapper boundary instead of forwarding unknown Radix props to Base UI parts.

Menu item close behavior differs in defaults and naming. Base UI uses `closeOnClick`; normal items default to close on click, but checkbox/radio-like menu items may default differently. Prefer the Base UI prop directly for new code.

Select has a Base UI-specific `alignItemWithTrigger` positioner behavior that overlaps the trigger so selected text lines up with the trigger value. This differs from the old Radix `position="popper"` mental model. New select positioning code should reason in terms of `Select.Positioner`, not Radix `Select.Content`.

## Tailwind v3 vs v4

Tailwind v4 changes the build pipeline. The PostCSS plugin moved from `tailwindcss` to `@tailwindcss/postcss`, and Tailwind now handles imports and vendor prefixing automatically. Keep `postcss-import` and `autoprefixer` out unless a concrete local build issue requires them.

Tailwind v4 CSS entry points import Tailwind with:

```css
@import "tailwindcss";
@config "./tailwind.config.js";
```

JavaScript config files are still supported, but v4 no longer auto-detects them. The `@config` directive is required for this branch while `tailwind.config.js` remains in use.

Some JavaScript config features are compatibility-only or unsupported in v4. The official guide calls out `corePlugins`, `safelist`, and `separator` as not supported by v4's JavaScript config path. Prefer CSS-first v4 features for new migration work; use existing config only to keep this branch moving.

Theme values are emitted as CSS variables in v4. Prefer CSS variables in custom CSS instead of `theme(...)` or JavaScript `resolveConfig`-style access. This branch already maps old Radix color names to CSS variables such as `--rx-gray-01`; keep that pattern instead of importing `@radix-ui/colors`.

Behavioral differences to watch in UI review:

- `hover:` only applies when the primary input device supports hover. Do not rely on hover interactions to make touch UI work.
- The default `ring` utility changed from a 3px blue ring to a 1px current-color ring.
- Default border color changed; explicit border colors are safer for UI that must match `master`.
- Buttons now use the browser default cursor unless a pointer cursor is set explicitly.
- The `hidden` attribute takes priority over display utilities.

## Branch guidance

For new shui work on this branch:

- Prefer exporting Base UI primitive parts through `util/ui-wrap` instead of creating local state machines.
- If a wrapper is needed for old call sites, keep it as a prop adapter around Base UI anatomy.
- Put positioning props on Base UI `Positioner` parts, portal props on `Portal`, and visual DOM props on `Popup`.
- Prefer utility classes and existing theme variables over adding more CSS selectors.
- Keep `.ui__*` class names only where existing app code queries or styles them.
- Verify popover, dropdown, context menu, and select with keyboard, mouse, and outside-click close behavior after adapter changes.
