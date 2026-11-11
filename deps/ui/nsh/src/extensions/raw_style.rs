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
        // Raw line-height is an absolute point length; NSH's bare numeric form
        // is a multiplier, so retain the unit explicitly.
        let encoded = if key == K::LineHeight && value.is_number() {
            format!("{encoded}px")
        } else {
            encoded
        };
        let numeric = encoded
            .parse::<f32>()
            .ok()
            .filter(|number| number.is_finite());
        let native = if let Some(number) = numeric {
            StyleValue::Number(number)
        } else {
            StyleValue::Str(&encoded)
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
