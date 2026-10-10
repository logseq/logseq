//! Logseq classic palette as gpui-component themes.
//!
//! The web backend gets its look from `resources/css/theme/vars-classic.css`
//! (~77 `--ls-*` tokens); the gpui backend has no stylesheet, so the closest
//! equivalent is a `ThemeConfig` per mode loaded into the `ThemeRegistry`
//! and installed as the light/dark themes. The semantic slots below mirror
//! the same `--ls-*` mappings `lui-gpui::style::semantic_var_color` uses, so
//! views that already emit `--ls-*` colors resolve to the classic palette.

use gpui_kit::component::theme::{Theme, ThemeRegistry};
use gpui_kit::gpui::App;

const LOGSEQ_THEME: &str = r##"{
  "$schema": "https://github.com/longbridge/gpui-kit/raw/refs/heads/main/.theme-schema.json",
  "name": "Logseq",
  "author": "logseq",
  "themes": [
    {
      "name": "Logseq Light",
      "mode": "light",
      "is_default": true,
      "colors": {
        "background": "#ffffff",
        "foreground": "#433f38",
        "caret": "#433f38",
        "border": "#cccccc",
        "input.border": "#cccccc",
        "ring": "#106ba3",
        "overlay": "#00000066",
        "window.border": "#cccccc",
        "accent.background": "#dcdcdc",
        "accent.foreground": "#433f38",
        "muted.background": "#eaeaea",
        "muted.foreground": "#8a8580",
        "popover.background": "#ffffff",
        "popover.foreground": "#433f38",
        "primary.background": "#106ba3",
        "primary.active.background": "#1a537c",
        "primary.foreground": "#ffffff",
        "primary.hover.background": "#1a537c",
        "secondary.background": "#f7f7f7",
        "secondary.active.background": "#dcdcdc",
        "secondary.foreground": "#433f38",
        "secondary.hover.background": "#eaeaea",
        "selection.background": "#c0e6fd",
        "sidebar.background": "#f7f7f7",
        "sidebar.border": "#e2e2e2",
        "sidebar.foreground": "#433f38",
        "sidebar.accent.background": "#dcdcdc",
        "sidebar.accent.foreground": "#433f38",
        "sidebar.primary.background": "#106ba3",
        "sidebar.primary.foreground": "#ffffff",
        "list.background": "#ffffff",
        "list.hover.background": "#dcdcdc",
        "list.active.background": "#c0e6fd",
        "list.active.border": "#106ba3",
        "list.even.background": "#f7f7f7",
        "list.head.background": "#f7f7f7",
        "title_bar.background": "#ffffff",
        "title_bar.border": "#e2e2e2",
        "status_bar.background": "#f7f7f7",
        "status_bar.border": "#e2e2e2",
        "tab.background": "#f7f7f7",
        "tab.foreground": "#8a8580",
        "tab.active.background": "#ffffff",
        "tab.active.foreground": "#106ba3",
        "tab_bar.background": "#f7f7f7",
        "table.even.background": "#f7f7f7",
        "table.head.background": "#f7f7f7",
        "table.hover.background": "#dcdcdc",
        "table.row.border": "#e2e2e2",
        "scrollbar.background": "#f7f7f7",
        "scrollbar.thumb.background": "#cccccc",
        "scrollbar.thumb.hover.background": "#aaaaaa",
        "skeleton.background": "#eaeaea",
        "slider.background": "#dcdcdc",
        "slider.thumb.background": "#106ba3",
        "switch.background": "#dcdcdc",
        "switch.thumb.background": "#ffffff",
        "link.foreground": "#106ba3",
        "link.hover.foreground": "#1a537c",
        "link.active.foreground": "#1a537c",
        "progress.bar.background": "#106ba3",
        "base.blue": "#106ba3",
        "base.blue.light": "#c0e6fd",
        "base.cyan": "#0e7490",
        "base.cyan.light": "#a5f3fc",
        "base.green": "#15803d",
        "base.green.light": "#bbf7d0",
        "base.magenta": "#a21caf",
        "base.magenta.light": "#f5d0fe",
        "base.red": "#b91c1c",
        "base.red.light": "#fecaca",
        "base.yellow": "#a16207",
        "base.yellow.light": "#fef08a"
      }
    },
    {
      "name": "Logseq Dark",
      "mode": "dark",
      "is_default": true,
      "colors": {
        "background": "#002b36",
        "foreground": "#a4b5b6",
        "caret": "#a4b5b6",
        "border": "#0e5263",
        "input.border": "#0e5263",
        "ring": "#8abbbb",
        "overlay": "#00000088",
        "window.border": "#0e5263",
        "accent.background": "#023643",
        "accent.foreground": "#dfdfdf",
        "muted.background": "#08404f",
        "muted.foreground": "#608e91",
        "popover.background": "#023643",
        "popover.foreground": "#a4b5b6",
        "primary.background": "#0a4a5e",
        "primary.active.background": "#0e5263",
        "primary.foreground": "#dfdfdf",
        "primary.hover.background": "#0e5263",
        "secondary.background": "#023643",
        "secondary.active.background": "#08404f",
        "secondary.foreground": "#a4b5b6",
        "secondary.hover.background": "#08404f",
        "selection.background": "#0a3d4b",
        "sidebar.background": "#023643",
        "sidebar.border": "#0e5263",
        "sidebar.foreground": "#a4b5b6",
        "sidebar.accent.background": "#08404f",
        "sidebar.accent.foreground": "#dfdfdf",
        "sidebar.primary.background": "#377f91",
        "sidebar.primary.foreground": "#dfdfdf",
        "list.background": "#002b36",
        "list.hover.background": "#023643",
        "list.active.background": "#0a3d4b",
        "list.active.border": "#8abbbb",
        "list.even.background": "#03333f",
        "list.head.background": "#023643",
        "title_bar.background": "#002b36",
        "title_bar.border": "#0e5263",
        "status_bar.background": "#023643",
        "status_bar.border": "#0e5263",
        "tab.background": "#023643",
        "tab.foreground": "#608e91",
        "tab.active.background": "#002b36",
        "tab.active.foreground": "#8abbbb",
        "tab_bar.background": "#023643",
        "table.even.background": "#03333f",
        "table.head.background": "#023643",
        "table.hover.background": "#08404f",
        "table.row.border": "#0e5263",
        "scrollbar.background": "#023643",
        "scrollbar.thumb.background": "#0e5263",
        "scrollbar.thumb.hover.background": "#126277",
        "skeleton.background": "#08404f",
        "slider.background": "#08404f",
        "slider.thumb.background": "#8abbbb",
        "switch.background": "#08404f",
        "switch.thumb.background": "#a4b5b6",
        "link.foreground": "#8abbbb",
        "link.hover.foreground": "#dfdfdf",
        "link.active.foreground": "#dfdfdf",
        "progress.bar.background": "#8abbbb",
        "base.blue": "#8abbbb",
        "base.blue.light": "#0a4a5e",
        "base.cyan": "#67c8d0",
        "base.cyan.light": "#0e4a52",
        "base.green": "#7dbb8a",
        "base.green.light": "#0a4633",
        "base.magenta": "#c993d4",
        "base.magenta.light": "#4a2450",
        "base.red": "#d98a8a",
        "base.red.light": "#4d2626",
        "base.yellow": "#c9a86a",
        "base.yellow.light": "#4a3d24"
      }
    }
  ]
}"##;

/// Install the Logseq light/dark themes as the active Theme's slots.
/// Call after `gpui_kit::init` (which creates the registry) and before
/// the first `Theme::change`/`sync_system_appearance` applies colors.
pub fn apply(cx: &mut App) {
    if let Err(err) = ThemeRegistry::global_mut(cx).load_themes_from_str(LOGSEQ_THEME) {
        eprintln!("logseq-gpui: logseq theme load failed: {err}");
        return;
    }
    let registry = ThemeRegistry::global(cx);
    let light = registry.themes().get("Logseq Light").cloned();
    let dark = registry.themes().get("Logseq Dark").cloned();
    if let (Some(light), Some(dark)) = (light, dark) {
        Theme::update(cx, |theme| {
            theme.light_theme = light;
            theme.dark_theme = dark;
        });
    }

    // vars-classic.css tokens that have no gpui theme slot — page chrome
    // geometry and detail colors. `var(--x)` in length contexts resolves
    // through the same table, so sizes work too (1em -> 16px manually).
    // Light-mode values; the semantic var layer handles dark where it can.
    const VARS: &[(&str, &str)] = &[
        ("--ls-page-title-size", "36px"),
        ("--ls-page-text-size", "16px"),
        ("--ls-main-content-max-width", "960px"),
        ("--ls-main-content-max-width-wide", "1440px"),
        ("--ls-font-family", "Inter"),
        ("--ls-border-radius-low", "4px"),
        ("--ls-border-radius-medium", "8px"),
        ("--ls-headbar-height", "48px"),
        ("--ls-headbar-inner-top-padding", "0px"),
        ("--ls-left-sidebar-width", "246px"),
        ("--ls-left-sidebar-sm-width", "62px"),
        ("--ls-left-sidebar-text-color", "#433f38"),
        ("--ls-left-sidebar-nav-btn-size", "32px"),
        ("--ls-menu-hover-color", "#dcdcdc"),
        ("--ls-secondary-border-color", "#e2e2e2"),
        ("--ls-icon-color", "#433f38"),
        ("--ls-focus-ring-color", "#106ba3"),
        ("--ls-button-background", "#f7f7f7"),
        ("--ls-button-background-hsl", "#f7f7f7"),
        ("--ls-scrollbar-background-color", "#f7f7f7"),
        ("--ls-scrollbar-foreground-color", "#cccccc"),
        ("--ls-scrollbar-thumb-hover-color", "#aaaaaa"),
        ("--ls-scrollbar-width", "10px"),
        ("--ls-search-icon-color", "#433f38"),
        ("--ls-search-icon-hover-color", "#161e2e"),
        ("--ls-page-checkbox-color", "#433f38"),
        ("--ls-page-checkbox-border-color", "#433f38"),
        ("--ls-page-inline-code-bg-color", "#f7f7f7"),
        ("--ls-page-inline-code-color", "#433f38"),
        ("--ls-page-mark-color", "#c0e6fd"),
        ("--ls-page-blockquote-color", "#433f38"),
        ("--ls-page-blockquote-bg-color", "#f7f7f7"),
        ("--ls-page-blockquote-border-color", "#799bbc"),
        ("--ls-block-properties-background-color", "#f7f7f7"),
        ("--ls-page-properties-background-color", "#f7f7f7"),
        ("--ls-block-ref-link-text-color", "#106ba3"),
        ("--ls-cloze-text-color", "#106ba3"),
        ("--ls-highlight-color-blue", "#c0e6fd"),
        ("--ls-highlight-color-gray", "#eaeaea"),
        ("--ls-highlight-color-red", "#fecaca"),
        ("--ls-highlight-color-yellow", "#fef08a"),
        ("--ls-highlight-color-green", "#bbf7d0"),
        ("--ls-highlight-color-purple", "#e9d5ff"),
        ("--ls-highlight-color-pink", "#fbcfe8"),
        ("--ls-pie-bg-color", "#f7f7f7"),
        ("--ls-pie-fg-color", "#106ba3"),
        ("--ls-native-kb-height", "0px"),
        ("--ls-caret-color", "#433f38"),
    ];
    for (name, value) in VARS {
        lui_gpui::style::set_css_var(name, value);
    }
}
