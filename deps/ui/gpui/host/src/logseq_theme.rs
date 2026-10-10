//! Logseq theme delivery for the gpui host.
//!
//! The shared OCaml layer (deps/ui/src/shared/ui_theme.ml) owns the
//! token values; it pushes a `theme-snapshot` platform request whose
//! payload is `{mode, vars, kit}`:
//! - `kit` maps gpui-kit ThemeConfig color-slot names to literals and
//!   is installed verbatim as that mode's "Logseq <Mode>" registry theme;
//! - `vars` is the resolved CSS custom-property table applied through
//!   `lui_gpui::style::set_css_var`, so `var(--ls-*)`/`var(--lx-*)`/
//!   `--lui-*` uses in extension class styles resolve to the same
//!   values the web serves from its own snapshot.
//!
//! Ordering matters: the OCaml side sends this envelope before the
//! ui-state mode flip that follows it, so by the time `Theme::change`
//! runs the registry already holds the snapshot's palette.

use gpui_kit::component::theme::{Theme, ThemeRegistry};
use gpui_kit::gpui::App;
use serde_json::json;

fn theme_name(mode: &str) -> &'static str {
    if mode == "dark" {
        "Logseq Dark"
    } else {
        "Logseq Light"
    }
}

/// Install one mode's snapshot: register its kit color slots under the
/// "Logseq <Mode>" name, refresh the Theme's per-mode config, and push
/// its css vars into the extension stylesheet's var table.
pub fn apply_snapshot(cx: &mut App, payload: &str) {
    let Ok(snap) = serde_json::from_str::<serde_json::Value>(payload) else {
        eprintln!("logseq-gpui: malformed theme-snapshot payload");
        return;
    };
    let mode = snap
        .get("mode")
        .and_then(|v| v.as_str())
        .unwrap_or("light");
    let name = theme_name(mode);
    // Rebuild the registry doc shape load_themes_from_str expects; the
    // kit map is already keyed by ThemeConfig color-slot names.
    let colors = snap.get("kit").cloned().unwrap_or_else(|| json!({}));
    let doc = json!({
        "name": "Logseq",
        "author": "logseq",
        "themes": [{
            "name": name,
            "mode": mode,
            "is_default": true,
            "colors": colors,
        }],
    });
    if let Err(err) =
        ThemeRegistry::global_mut(cx).load_themes_from_str(&doc.to_string())
    {
        eprintln!("logseq-gpui: theme-snapshot theme load failed: {err}");
        return;
    }
    if let Some(cfg) = ThemeRegistry::global(cx).themes().get(name).cloned() {
        Theme::update(cx, |theme| {
            if mode == "dark" {
                theme.dark_theme = cfg;
            } else {
                theme.light_theme = cfg;
            }
        });
    }
    if let Some(vars) = snap.get("vars").and_then(|v| v.as_object()) {
        for (name, value) in vars {
            if let Some(value) = value.as_str() {
                lui_gpui::style::set_css_var(name, value);
            }
        }
    }
}
