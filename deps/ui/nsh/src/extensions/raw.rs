//! User-authored raw markup. Application controls remain typed LUI components.
use super::{raw_style, string};
use lui_nsh::{
    app::{ApplicationEvents, ApplicationMutations},
    extensions::{ExtensionContext, ExtensionStyle},
    runtime::PlatformEvent,
    store::Node,
};
use nsh_core::{element::ImageSrc, keymap::Modifiers, prelude::*};
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
    if tag == "img" {
        crate::services::resources::validate_source(
            attrs.get("src").map(String::as_str).unwrap_or(""),
            attrs.get("data-asset-file").map(String::as_str),
        )?;
    }
    if let Some(graph) = attrs.get("data-asset-graph") {
        if tag != "a" {
            return Err("managed asset activation requires a link".into());
        }
        crate::services::resources::validate_asset_link(
            graph,
            attrs.get("href").map(String::as_str).unwrap_or(""),
            attrs.get("data-asset-file").map(String::as_str),
        )?;
    }
    if tag == "input"
        && !matches!(
            attrs.get("type").map(String::as_str),
            None | Some("" | "text" | "search" | "email" | "url" | "password" | "checkbox")
        )
    {
        return Err("raw input type is not supported by the native text/checkbox host".into());
    }
    Ok(())
}

/// Resolve colors and lengths against the same final scoped theme as built-in
/// controls before a transaction or theme refresh can publish any native state.
pub(super) fn validate_themed(node: &Node, style: &ExtensionStyle<'_>) -> Result<(), String> {
    let identifier = &node
        .extension
        .as_ref()
        .expect("raw extension validator")
        .identifier;
    let tag = identifier
        .strip_prefix("logseq-")
        .expect("validated raw identifier");
    if tag == "dom" {
        return Ok(());
    }
    raw_style::compile(node, tag, |value| style.resolve_text(value)).map(|_| ())
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
        let resources = use_context::<crate::services::resources::Resources>();
        return host(
            context,
            image(move || {
                let attrs = attributes(&source);
                let url = attrs.get("src").map(String::as_str).unwrap_or("");
                match resources {
                    Some(resources) => resources
                        .source(url, attrs.get("data-asset-file").map(String::as_str))
                        .expect("validated native image source"),
                    None => ImageSrc::from(url.to_owned()),
                }
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
        let disabled = context.clone();
        let label_context = context.clone();
        let activation = context.clone();
        let owner = Owner::current();
        let admission = use_context::<ApplicationMutations>();
        let resources = use_context::<crate::services::resources::Resources>();
        let events = use_context::<ApplicationEvents>();
        return component(
            context,
            nsh_base::Button::element(nsh_base::ButtonProps {
                disabled: Prop::bind(move || attributes(&disabled).contains_key("disabled")),
                role: Some(role).into(),
                accessibility_label: Prop::bind(move || label(&label_context)),
                ..nsh_base::ButtonProps::initial()
            })
            .on_event(move |event: &nsh_base::ButtonEvent| {
                if matches!(event, nsh_base::ButtonEvent::Press) {
                    if attributes(&activation).contains_key("data-asset-graph") {
                        activate_asset(
                            &activation,
                            owner,
                            admission.as_ref(),
                            resources,
                            events.clone(),
                        );
                        return;
                    }
                    // NSH's semantic event has no pointer details. A keyboard or
                    // assistive activation is still an ordinary DOM click.
                    emit_dom(&activation, owner, "click", json!({}));
                }
            })
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
                .accessibility_elements_hidden(true),
        );
    }
    host(context, view().child(text(content)).child(children))
}

fn input_for(context: ExtensionContext, kind: &str) -> AnyElement {
    if kind == "checkbox" {
        let checked = context.clone();
        let mark = context.clone();
        let change = context.clone();
        let disabled = context.clone();
        let label_context = context.clone();
        let owner = Owner::current();
        return component(
            context,
            nsh_base::Checkbox::element(nsh_base::CheckboxProps {
                checked: Prop::bind(move || attributes(&checked).contains_key("checked")),
                disabled: Prop::bind(move || attributes(&disabled).contains_key("disabled")),
                accessibility_label: Prop::bind(move || label(&label_context)),
                ..nsh_base::CheckboxProps::initial()
            })
            .on_event(move |event: &nsh_base::CheckboxEvent| {
                let nsh_base::CheckboxEvent::Change(checked) = event else {
                    return;
                };
                emit_dom(&change, owner, "click", json!({}));
                emit_dom(&change, owner, "input", json!({"checked":checked}));
                emit_dom(&change, owner, "change", json!({"checked":checked}));
            })
            .fill(
                "indicator",
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
            .on_submit(move |value: &str| {
                emit_dom(&submitted, owner, "submit", json!({"value":value}))
            }),
    )
}

fn label(context: &ExtensionContext) -> Option<SharedString> {
    let attrs = attributes(context);
    let value = attrs
        .get("aria-label")
        .or_else(|| attrs.get("alt"))
        .cloned()
        .unwrap_or_else(|| string(context, "accessibility-identifier"));
    (!value.is_empty()).then(|| value.into())
}
fn component<C: Component>(context: ExtensionContext, element: ComponentElement<C>) -> AnyElement {
    let test_id = format!("lui-{}", context.node.get_untracked().id);
    let reference = context.reference;
    element
        .element_ref(&reference)
        .test_id(&test_id)
        .state_inline_style(move || {
            let node = context.node.get();
            let tag = &node.extension.as_ref().unwrap().identifier[7..];
            raw_style::compile(&node, tag, |value| context.resolve_text(value))
                .expect("validated raw component styles and application theme")
        })
        .into_element()
}

fn attributes(context: &ExtensionContext) -> std::collections::BTreeMap<String, String> {
    raw_style::attrs(&context.node.get()).expect("raw attrs were validated before publication")
}
fn host<E: Element + Interactive + Accessible>(
    context: ExtensionContext,
    element: E,
) -> AnyElement {
    let owner = Owner::current();
    let style = context.clone();
    let disabled = context.clone();
    let label_context = context.clone();
    let click = context.clone();
    let down = context.clone();
    let up = context.clone();
    let enter = context.clone();
    let leave = context.clone();
    let menu = context.clone();
    let focus = context.clone();
    let blur = context.clone();
    let test_id = format!("lui-{}", context.node.get_untracked().id);
    element
        .element_ref(&context.reference)
        .test_id(&test_id)
        .state_inline_style(move || {
            let node = style.node.get();
            let tag = &node.extension.as_ref().unwrap().identifier[7..];
            raw_style::compile(&node, tag, |value| style.resolve_text(value))
                .expect("validated native raw layout and application theme")
        })
        .disabled(move || attributes(&disabled).contains_key("disabled"))
        .optional_label(move || label(&label_context))
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
        .on_press_down(move |event: &nsh_core::PressEvent| {
            let mut payload = pointer(event.page_position, event.modifiers);
            payload["buttons"] = 1.into();
            emit_dom(&down, owner, "pointerdown", payload.clone());
            emit_dom(&down, owner, "mousedown", payload)
        })
        .on_mouse_up(move |event: &nsh_core::MouseEvent| {
            emit_dom(
                &up,
                owner,
                "mouseup",
                pointer(event.page_position, event.modifiers),
            )
        })
        .on_mouse_enter(move |_: &nsh_core::MouseEvent| {
            emit_dom(&enter, owner, "mouseenter", json!({}))
        })
        .on_mouse_leave(move |_: &nsh_core::MouseEvent| {
            emit_dom(&leave, owner, "mouseleave", json!({}))
        })
        .on_context_menu(move |event: &ContextMenuEvent| {
            let mut payload = pointer(event.page_position, event.modifiers);
            payload["button"] = 2.into();
            emit_dom(&menu, owner, "contextmenu", payload)
        })
        .on_focus(move || emit_dom(&focus, owner, "focus", json!({})))
        .on_blur(move || emit_dom(&blur, owner, "blur", json!({})))
        .into_element()
}
fn pointer(point: Point<Points>, modifiers: Modifiers) -> Value {
    json!({"clientX":point.x.0,"clientY":point.y.0,"button":0,"buttons":0,"shiftKey":modifiers.shift,"altKey":modifiers.alt,"metaKey":modifiers.cmd,"ctrlKey":modifiers.ctrl})
}
fn emit_dom(context: &ExtensionContext, owner: Owner, name: &str, payload: Value) {
    try_emit_dom(context, owner, name, payload);
}
fn try_emit_dom(context: &ExtensionContext, owner: Owner, name: &str, payload: Value) -> bool {
    if !owner.is_live() {
        return false;
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
        .expect("native raw event matches canonical schema")
}

fn activate_asset(
    context: &ExtensionContext,
    owner: Owner,
    admission: Option<&ApplicationMutations>,
    resources: Option<crate::services::resources::Resources>,
    events: Option<ApplicationEvents>,
) {
    let attrs = attributes(context);
    if !owner.is_live()
        || attrs.contains_key("disabled")
        || admission.is_none_or(|admission| admission.check().is_err())
    {
        return;
    }
    let location = resources
        .expect("managed assets require the application resource owner")
        .asset_link(
            &attrs["data-asset-graph"],
            attrs.get("href").map(String::as_str).unwrap_or(""),
            attrs.get("data-asset-file").map(String::as_str),
        )
        .expect("managed asset link was validated before publication");
    let Some(location) = location else {
        return;
    };
    // The existing emitter checks the exact retained incarnation synchronously.
    // No asynchronous work or path request is admitted for a retired element.
    if !try_emit_dom(context, owner, "click", json!({})) {
        return;
    }
    use crate::services::resources::AssetLocation;
    enum OpenRequest {
        Path(nsh_core::element::Answer<Result<(), String>>),
        Url(nsh_core::element::Answer<bool>),
    }
    // Submit while the same synchronous admission/graph/incarnation proof is
    // still current. Only the platform completion is asynchronous.
    let request = match location {
        AssetLocation::Path(path) => OpenRequest::Path(open_path(path)),
        AssetLocation::Url(url) => OpenRequest::Url(open_url(url)),
    };
    spawn(async move {
        let result = match request {
            OpenRequest::Path(answer) => answer.await,
            OpenRequest::Url(answer) => {
                if answer.await {
                    Ok(())
                } else {
                    Err("the native host did not open the asset URL".into())
                }
            }
        };
        if let Err(error) = result {
            if owner.is_live() {
                if let Some(events) = events {
                    if let Err(error) = events.send(PlatformEvent {
                        operation: "platform-error".into(),
                        payload: json!({"operation":"open-asset","message":error}).to_string(),
                    }) {
                        eprintln!("managed asset completion: {error}");
                    }
                } else {
                    eprintln!("managed asset open: {error}");
                }
            }
        }
    });
}
