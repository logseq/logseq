//! Raw user markup translates its declared scalar layout props to NSH styles.
//! This is not a browser CSS engine; app UI continues to use typed LUI kinds.
use lui_nsh::store::Node;
use nsh_core::{StyleDecl, StyleKey as K, StyleValue, element::Style};
use serde_json::Value;
use std::collections::BTreeMap;

pub(super) fn attrs(node: &Node) -> Result<BTreeMap<String, String>, String> {
    let properties = &node.extension.as_ref().expect("raw extension").properties;
    match properties.get("attrs").and_then(Value::as_str) {
        None | Some("") => Ok(BTreeMap::new()),
        Some(json) => serde_json::from_str(json).map_err(|error| format!("raw attrs: {error}")),
    }
}

pub(super) fn compile(
    node: &Node,
    tag: &str,
    resolve: impl Fn(&str) -> Result<String, String>,
) -> Result<Style, String> {
    let properties = &node.extension.as_ref().expect("raw extension").properties;
    let attrs = attrs(node)?;
    let mut declarations = Vec::with_capacity(properties.len() + 6);
    let mut set = |key: K, value: &Value| -> Result<(), String> {
        let encoded = match value {
            Value::String(value) => resolve(value)?,
            Value::Number(number) => number.to_string(),
            _ => return Err(format!("unsupported raw style scalar for {}", key.name())),
        };
        let encoded = encoded.trim();
        // The pinned NSH dimension parser takes point lengths as numbers;
        // strings are reserved for percentages, auto and intrinsic keywords.
        // Raw markup deliberately also accepts CSS's px spelling.
        let points = encoded.strip_suffix("px").unwrap_or(encoded).trim();
        let numeric = points
            .parse::<f32>()
            .ok()
            .filter(|number| number.is_finite());
        if let Some(percent) = encoded.strip_suffix('%')
            && percent
                .trim()
                .parse::<f32>()
                .ok()
                .is_none_or(|number| !number.is_finite())
        {
            return Err(format!("raw {} requires a finite percentage", key.name()));
        }
        let native = if let Some(number) = numeric {
            StyleValue::Number(number)
        } else {
            StyleValue::Str(encoded)
        };
        let parsed = key
            .parse_value(native)
            .map_err(|error| format!("raw {}={encoded:?}: {error:?}", key.name()))?;
        declarations.push(StyleDecl::Set(key, parsed));
        Ok(())
    };
    let horizontal = properties
        .get("orientation")
        .and_then(Value::as_str)
        .is_some_and(|value| matches!(value, "horizontal" | "row"));
    let inline = matches!(
        tag,
        "span"
            | "a"
            | "b"
            | "i"
            | "em"
            | "strong"
            | "code"
            | "small"
            | "kbd"
            | "u"
            | "mark"
            | "del"
            | "ins"
            | "sub"
            | "sup"
            | "tspan"
            | "label"
            | "em-emoji"
            | "tr"
    );
    set(
        K::FlexDirection,
        &Value::from(if horizontal || inline {
            "row"
        } else {
            "column"
        }),
    )?;
    match tag {
        "strong" | "b" | "th" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" => {
            set(K::FontWeight, &Value::from(700))?
        }
        "em" | "i" => set(K::FontStyle, &Value::from("italic"))?,
        "code" | "pre" | "kbd" => set(K::FontFamily, &Value::from("monospace"))?,
        _ => {}
    }
    // Shorthands, axes, then edges: precedence does not depend on JSON key order.
    for (name, key) in [
        ("padding", K::Padding),
        ("padding-horizontal", K::PaddingHorizontal),
        ("padding-vertical", K::PaddingVertical),
        ("padding-top", K::PaddingTop),
        ("padding-right", K::PaddingRight),
        ("padding-bottom", K::PaddingBottom),
        ("padding-left", K::PaddingLeft),
        ("margin", K::Margin),
        ("margin-horizontal", K::MarginHorizontal),
        ("margin-vertical", K::MarginVertical),
        ("margin-top", K::MarginTop),
        ("margin-right", K::MarginRight),
        ("margin-bottom", K::MarginBottom),
        ("margin-left", K::MarginLeft),
        ("width", K::Width),
        ("height", K::Height),
        ("min-width", K::MinWidth),
        ("min-height", K::MinHeight),
        ("max-width", K::MaxWidth),
        ("max-height", K::MaxHeight),
        ("gap", K::Gap),
        ("row-gap", K::RowGap),
        ("column-gap", K::ColumnGap),
        ("font-size", K::FontSize),
        ("font-weight", K::FontWeight),
        ("line-height", K::LineHeight),
        ("letter-spacing", K::LetterSpacing),
        ("opacity", K::Opacity),
        ("corner-radius", K::BorderRadius),
        ("background", K::BackgroundColor),
        ("shadow", K::BoxShadow),
        ("flex-wrap", K::FlexWrap),
        ("display", K::Display),
        ("main", K::JustifyContent),
        ("cross", K::AlignItems),
    ] {
        let fallback = attrs.get(name).map(|value| Value::from(value.clone()));
        if let Some(value) = properties.get(name).or(fallback.as_ref()) {
            if value.as_str() == Some("") {
                continue;
            }
            let alias = value.as_str().map(|value| match value {
                "space_between" => "space-between",
                "space_around" => "space-around",
                "space_evenly" => "space-evenly",
                "start" if matches!(key, K::JustifyContent | K::AlignItems) => "flex-start",
                "end" if matches!(key, K::JustifyContent | K::AlignItems) => "flex-end",
                other => other,
            });
            if matches!(key, K::Padding | K::Margin)
                && let Some(encoded) = alias
            {
                let values = encoded.split_whitespace().collect::<Vec<_>>();
                if (2..=4).contains(&values.len()) {
                    let edges = match values.as_slice() {
                        [vertical, horizontal] => [*vertical, *horizontal, *vertical, *horizontal],
                        [top, horizontal, bottom] => [*top, *horizontal, *bottom, *horizontal],
                        [top, right, bottom, left] => [*top, *right, *bottom, *left],
                        _ => unreachable!("bounded shorthand arity"),
                    };
                    let keys = if key == K::Padding {
                        [
                            K::PaddingTop,
                            K::PaddingRight,
                            K::PaddingBottom,
                            K::PaddingLeft,
                        ]
                    } else {
                        [K::MarginTop, K::MarginRight, K::MarginBottom, K::MarginLeft]
                    };
                    for (key, value) in keys.into_iter().zip(edges) {
                        set(key, &Value::from(value))?;
                    }
                    continue;
                }
            }
            match alias {
                Some(value) => set(key, &Value::from(value))?,
                None => set(key, value)?,
            }
        }
    }
    Ok(Style::from_decls(declarations))
}

#[cfg(test)]
mod tests {
    use super::*;
    use lui_nsh::store::ExtensionNode;
    use serde_json::json;

    // Element Style intentionally exposes declarations rather than native fields.
    // Compile only produces declarations, so lower them through their public
    // apply API and inspect the public native style consumed by the layout engine.
    fn lower(inline: Style) -> nsh_core::Style {
        let mut native = nsh_core::Style::default();
        for declaration in inline.decls() {
            declaration.apply(&mut native).unwrap();
        }
        native
    }
    fn parse(properties: Value) -> Result<nsh_core::Style, String> {
        let mut node = Node::default();
        node.extension.get_or_insert(ExtensionNode {
            identifier: "logseq-div".into(),
            fingerprint: String::new(),
            properties: properties.as_object().unwrap().clone(),
        });
        compile(&node, "div", |value| Ok(value.to_owned())).map(lower)
    }
    fn native(key: K, value: StyleValue<'_>) -> nsh_core::Style {
        lower(Style::from_decls([StyleDecl::Set(
            key,
            key.parse_value(value).unwrap(),
        )]))
    }
    #[test]
    fn css_raw_point_lengths_percentages_auto_and_spacing_reach_native_layout() {
        let style = parse(json!({"width":"240px", "height":"50%", "max-width":"auto",
            "padding":"4px 8px", "padding-right":"12px", "line-height":24.0}))
        .unwrap();
        assert_eq!(
            style.layout.size.width,
            native(K::Width, StyleValue::Number(240.0))
                .layout
                .size
                .width
        );
        assert_eq!(
            style.layout.size.height,
            native(K::Height, StyleValue::Str("50%")).layout.size.height
        );
        assert_eq!(
            style.layout.max_size.width,
            native(K::MaxWidth, StyleValue::Str("auto"))
                .layout
                .max_size
                .width
        );
        assert_eq!(
            style.layout.padding.top,
            native(K::PaddingTop, StyleValue::Number(4.0))
                .layout
                .padding
                .top
        );
        assert_eq!(
            style.layout.padding.right,
            native(K::PaddingRight, StyleValue::Number(12.0))
                .layout
                .padding
                .right
        );
        assert_eq!(
            style.layout.padding.left,
            native(K::PaddingLeft, StyleValue::Number(8.0))
                .layout
                .padding
                .left
        );
        assert_eq!(
            style.text.line_height,
            native(K::LineHeight, StyleValue::Number(24.0))
                .text
                .line_height
        );
    }
    #[test]
    fn unsupported_units_and_nonfinite_dimensions_fail_before_mount() {
        for value in ["240rem", "NaN%", "inf%", "1e100px", "wide"] {
            assert!(parse(json!({"width":value})).is_err(), "{value}");
        }
    }
}
