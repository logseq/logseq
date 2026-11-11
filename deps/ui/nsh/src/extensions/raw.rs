//! User-authored raw markup. Application controls remain typed LUI components.
use super::{raw_style, string};
use lui_nsh::{extensions::ExtensionContext, store::Node};
use nsh_core::{keymap::Modifiers, prelude::*};
use serde_json::{Map, Value, json};

pub(super) fn validate(node: &Node) -> Result<(), String> {
    let extension = node.extension.as_ref().expect("raw extension validator");
    let tag = extension
        .identifier
        .strip_prefix("logseq-")
        .ok_or("invalid raw identifier")?;
    if tag == "dom" {
        return Ok(());
    }
    match tag {
        "div" | "span" | "a" | "button" | "textarea" | "input" | "img" | "main" | "header"
        | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "ul" | "li" | "nav" | "section"
        | "strong" | "em" | "code" | "pre" | "label" | "form" | "small" | "kbd" | "table"
        | "thead" | "tbody" | "tr" | "td" | "th" | "br" | "hr" | "article" | "aside" | "footer"
        | "u" | "mark" | "b" | "i" | "del" | "ins" | "sub" | "blockquote" | "sup" | "em-emoji" => {}
        _ => {
            return Err(format!(
                "raw <{tag}> has no native NSH implementation; use the typed component"
            ));
        }
    }
    let attrs = raw_style::attrs(node)?;
    if tag == "input"
        && !matches!(
            attrs.get("type").map(String::as_str),
            None | Some("" | "text" | "search" | "email" | "url" | "password" | "checkbox")
        )
    {
        return Err("raw input type is not supported by the native text/checkbox host".into());
    }
    raw_style::compile(node, tag, |value| {
        // Scoped tokens are resolved by the retained renderer theme at mount.
        // Their expression is application-owned, unlike raw numeric layout.
        Ok(if value.contains("var(") {
            "#000000".into()
        } else {
            value.into()
        })
    })?;
    Ok(())
}

pub(super) fn element(context: ExtensionContext) -> AnyElement {
    let tag = context
        .node
        .get_untracked()
        .extension
        .as_ref()
        .unwrap()
        .identifier
        .strip_prefix("logseq-")
        .unwrap()
        .to_owned();
    if tag == "dom" {
        // The application routes document events through its typed runtime driver.
        // This canonical carrier intentionally occupies no layout or hit area.
        return view()
            .w_0()
            .h_0()
            .element_ref(&context.reference)
            .into_element();
    }
    if tag == "input" {
        let source = context.clone();
        return each(
            move || vec![attributes(&source).get("type").cloned().unwrap_or_default()],
            Clone::clone,
            move |kind, _| input_for(context.clone(), &kind.get_untracked()),
        );
    }
    if tag == "textarea" {
        return input_for(context, "textarea");
    }
    if tag == "img" {
        let source = context.clone();
        return host(
            context,
            image(move || {
                ImageSrc::from(attributes(&source).get("src").cloned().unwrap_or_default())
            }),
        );
    }
    let contents = context.clone();
    let content = move || {
        let value = string(&contents, "text");
        if value.is_empty() && tag == "em-emoji" {
            attributes(&contents)
                .get("data-emoji")
                .cloned()
                .unwrap_or_default()
        } else {
            value
        }
    };
    let children = context.children.element();
    let tag = context
        .node
        .get_untracked()
        .extension
        .as_ref()
        .unwrap()
        .identifier[7..]
        .to_owned();
    if matches!(tag.as_str(), "button" | "a") {
        let role = if tag == "a" {
            AccessibilityRole::Link
        } else {
            AccessibilityRole::Button
        };
        return host(
            context,
            nsh_base::button()
                .role(role)
                .child(text(content))
                .child(children),
        );
    }
    if matches!(
        tag.as_str(),
        "span"
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
            | "label"
            | "em-emoji"
            | "p"
            | "h1"
            | "h2"
            | "h3"
            | "h4"
            | "h5"
            | "h6"
    ) {
        return host(context, text(content).child(children));
    }
    if tag == "br" {
        return host(context, view().h(px(1.0)).w_full());
    }
    if tag == "hr" {
        return host(
            context,
            view()
                .h(px(1.0))
                .w_full()
                .bg(move || nsh_base::theme().border)
                .role(AccessibilityRole::Separator),
        );
    }
    host(context, view().child(text(content)).child(children))
}

fn input_for(context: ExtensionContext, kind: &str) -> AnyElement {
    if kind == "checkbox" {
        let checked = context.clone();
        let mark = context.clone();
        let change = context.clone();
        let owner = Owner::current();
        return host(
            context,
            nsh_base::checkbox()
                .checked(move || attributes(&checked).contains_key("checked"))
                .on_change(move |checked: bool| {
                    emit_dom(&change, owner, "input", json!({"checked":checked}));
                    emit_dom(&change, owner, "change", json!({"checked":checked}));
                })
                .indicator(
                    view()
                        .w_4()
                        .h_4()
                        .border_1()
                        .border_color(move || nsh_base::theme().border)
                        .child(text(move || {
                            if attributes(&mark).contains_key("checked") {
                                "✓"
                            } else {
                                ""
                            }
                        })),
                ),
        );
    }
    let value = context.clone();
    let placeholder = context.clone();
    let readonly = context.clone();
    let changed = context.clone();
    let submitted = context.clone();
    let owner = Owner::current();
    host(
        context,
        nsh_base::input()
            .value(move || {
                attributes(&value)
                    .get("value")
                    .cloned()
                    .unwrap_or_else(|| string(&value, "text"))
            })
            .placeholder(move || {
                attributes(&placeholder)
                    .get("placeholder")
                    .cloned()
                    .unwrap_or_default()
            })
            .readonly(move || attributes(&readonly).contains_key("readonly"))
            .masked(kind == "password")
            .multiline(kind == "textarea")
            .on_change(move |value: &str| {
                emit_dom(&changed, owner, "input", json!({"value":value}));
                emit_dom(&changed, owner, "change", json!({"value":value}));
            })
            .on_submit(move || emit_dom(&submitted, owner, "submit", json!({}))),
    )
}

fn attributes(context: &ExtensionContext) -> std::collections::BTreeMap<String, String> {
    raw_style::attrs(&context.node.get()).expect("raw attrs were validated before publication")
}
fn host<E: Element + Interactive>(context: ExtensionContext, element: E) -> AnyElement {
    let owner = Owner::current();
    let style = context.clone();
    let disabled = context.clone();
    let label = context.clone();
    let click = context.clone();
    let down = context.clone();
    let up = context.clone();
    let enter = context.clone();
    let leave = context.clone();
    let menu = context.clone();
    let focus = context.clone();
    let blur = context.clone();
    element
        .element_ref(&context.reference)
        .state_inline_style(move || {
            let node = style.node.get();
            let tag = &node.extension.as_ref().unwrap().identifier[7..];
            raw_style::compile(&node, tag, |value| style.resolve_text(value))
                .expect("validated native raw layout and application theme")
        })
        .disabled(move || attributes(&disabled).contains_key("disabled"))
        .label(move || {
            attributes(&label)
                .get("aria-label")
                .cloned()
                .unwrap_or_else(|| string(&label, "accessibility-identifier"))
        })
        .on_press(move |event: &PressEvent| {
            emit_dom(
                &click,
                owner,
                "click",
                pointer(event.page_position, event.modifiers),
            );
            if event.clicks == 2 {
                emit_dom(
                    &click,
                    owner,
                    "dblclick",
                    pointer(event.page_position, event.modifiers),
                );
            }
        })
        .on_mouse_down(move |event: &nsh_core::MouseEvent| {
            emit_dom(
                &down,
                owner,
                "mousedown",
                pointer(event.page_position, event.modifiers),
            )
        })
        .on_mouse_up(move |event: &nsh_core::MouseEvent| {
            emit_dom(
                &up,
                owner,
                "mouseup",
                pointer(event.page_position, event.modifiers),
            )
        })
        .on_mouse_enter(move || emit_dom(&enter, owner, "mouseenter", json!({})))
        .on_mouse_leave(move || emit_dom(&leave, owner, "mouseleave", json!({})))
        .on_context_menu(move |event: &ContextMenuEvent| {
            emit_dom(
                &menu,
                owner,
                "contextmenu",
                pointer(event.page_position, event.modifiers),
            )
        })
        .on_focus(move || emit_dom(&focus, owner, "focus", json!({})))
        .on_blur(move || emit_dom(&blur, owner, "blur", json!({})))
        .into_element()
}
fn pointer(point: Point<Points>, modifiers: Modifiers) -> Value {
    json!({"clientX":point.x.0,"clientY":point.y.0,"shiftKey":modifiers.shift,"altKey":modifiers.alt,"metaKey":modifiers.cmd,"ctrlKey":modifiers.ctrl})
}
fn emit_dom(context: &ExtensionContext, owner: Owner, name: &str, payload: Value) {
    if !owner.is_live() {
        return;
    }
    let mut payload = payload
        .as_object()
        .expect("native DOM payload object")
        .clone();
    payload.insert("nodeId".into(), context.node.get_untracked().id.into());
    let mut values = Map::new();
    values.insert("name".into(), name.into());
    values.insert("payload".into(), Value::Object(payload).to_string().into());
    context
        .emitter
        .try_emit("dom-event", values)
        .expect("native raw event matches canonical schema");
}
