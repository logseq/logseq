//! The actual native PDF extension: PDFKit owns document, selection and scrolling.
use super::raw_style;
use lui_nsh::{extensions::ExtensionContext, store::Node};
use nsh_core::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value, json};
use std::{collections::BTreeMap, path::Path, sync::Arc};

#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
pub use macos::register;

pub const NAME: &str = "logseq.pdfkit";

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
struct Rect {
    x1: f64,
    y1: f64,
    x2: f64,
    y2: f64,
    w: f64,
    h: f64,
}
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
struct Highlight {
    id: String,
    page: usize,
    color: Option<String>,
    bounding: Rect,
    rects: Vec<Rect>,
    text: String,
    image: Option<String>,
}
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
struct Model {
    path: String,
    filename: String,
    repo: String,
    identity: String,
    instance: String,
    page: usize,
    scale: String,
    highlights: Vec<Highlight>,
    reference: String,
    theme: String,
    dashed: bool,
    automenu: bool,
    labels: BTreeMap<String, String>,
}
impl Model {
    fn read(attrs: &BTreeMap<String, String>) -> Result<Self, String> {
        let get = |name: &str| attrs.get(name).cloned().unwrap_or_default();
        let path = get("path");
        if path.contains('\0')
            || (!Path::new(&path).is_absolute()
                && !url::Url::parse(&path)
                    .is_ok_and(|url| url.scheme() == "file" && url.to_file_path().is_ok()))
        {
            return Err("native PDF requires an absolute local path or file URL".into());
        }
        let boolean = |name: &str, default| -> Result<bool, String> {
            match attrs.get(name).map(String::as_str) {
                None => Ok(default),
                Some("true") => Ok(true),
                Some("false") => Ok(false),
                _ => Err(format!("PDF {name} requires true or false")),
            }
        };
        if boolean("area_mode", false)? {
            return Err("native PDF area-drag capture is not implemented".into());
        }
        if boolean("hl_mode", false)? {
            return Err("native PDF persistent highlight mode is not implemented; select text then add a highlight".into());
        }
        let theme = get("theme");
        if !matches!(theme.as_str(), "" | "light") {
            return Err(
                "native PDF paper recoloring is not implemented; use the native paper theme".into(),
            );
        }
        let page = attrs
            .get("page")
            .map_or(Ok(1), |page| page.parse::<usize>())
            .map_err(|_| "PDF page must be a positive integer")?;
        if page == 0 {
            return Err("PDF page must be positive".into());
        }
        let scale = attrs.get("scale").cloned().unwrap_or_else(|| "auto".into());
        check_scale(&scale)?;
        let highlights: Vec<Highlight> = attrs
            .get("hls")
            .map_or(Ok(Vec::new()), |value| serde_json::from_str(value))
            .map_err(|error| format!("PDF highlights: {error}"))?;
        for highlight in &highlights {
            if highlight.page == 0 {
                return Err("PDF highlight page must be positive".into());
            }
            if nsh_core::Color::parse(highlight.color.as_deref().unwrap_or("yellow")).is_none() {
                return Err("PDF highlight color must be a concrete CSS color".into());
            }
            for rect in std::iter::once(&highlight.bounding).chain(&highlight.rects) {
                if ![rect.x1, rect.y1, rect.x2, rect.y2, rect.w, rect.h]
                    .iter()
                    .all(|value| value.is_finite())
                    || rect.w <= 0.0
                    || rect.h <= 0.0
                    || rect.x2 < rect.x1
                    || rect.y2 < rect.y1
                {
                    return Err(
                        "PDF highlight coordinates must be finite normalized page rectangles"
                            .into(),
                    );
                }
            }
        }
        let labels = attrs
            .get("labels")
            .map_or(Ok(BTreeMap::new()), |value| serde_json::from_str(value))
            .map_err(|error| format!("PDF labels: {error}"))?;
        Ok(Self {
            path,
            filename: get("filename"),
            repo: get("repo"),
            identity: get("identity"),
            instance: get("instance"),
            page,
            scale,
            highlights,
            reference: get("ref_hl"),
            theme,
            dashed: boolean("dashed", false)?,
            automenu: boolean("automenu", true)?,
            labels,
        })
    }
    fn payload(&self, mut payload: Map<String, Value>) -> Value {
        payload.insert("repo".into(), self.repo.clone().into());
        payload.insert("identity".into(), self.identity.clone().into());
        payload.insert("instance".into(), self.instance.clone().into());
        Value::Object(payload)
    }
}
fn check_scale(scale: &str) -> Result<(), String> {
    if matches!(scale, "auto" | "page-fit" | "page-width")
        || scale
            .parse::<f64>()
            .is_ok_and(|value| value.is_finite() && value > 0.0)
    {
        Ok(())
    } else {
        Err("PDF scale requires auto, page-fit, page-width or a positive factor".into())
    }
}

pub(super) fn validate(node: &Node) -> Result<(), String> {
    if !cfg!(target_os = "macos") {
        return Err("this platform has no native NSH PDF provider".into());
    }
    Model::read(&raw_style::attrs(node)?)?;
    if !node.children.is_empty() {
        return Err("native PDF is a leaf and does not accept authored children".into());
    }
    Ok(())
}
pub(super) fn validate_themed(
    node: &Node,
    style: &lui_nsh::extensions::ExtensionStyle<'_>,
) -> Result<(), String> {
    raw_style::compile(node, "div", |value| style.resolve_text(value)).map(|_| ())
}
fn emit(context: &ExtensionContext, owner: Owner, name: &str, payload: Value) {
    if !owner.is_live() {
        return;
    }
    let values = json!({"name":name,"payload":payload.to_string()})
        .as_object()
        .unwrap()
        .clone();
    context
        .emitter
        .try_emit("dom-event", values)
        .expect("PDF event uses the actual canonical DOM-event schema");
}

pub(super) fn element(context: ExtensionContext) -> AnyElement {
    let model_context = context.clone();
    let model = computed(move || {
        Arc::new(
            Model::read(&raw_style::attrs(&model_context.node.get()).unwrap())
                .expect("validated PDF model"),
        )
    });
    let reference = element_ref();
    let selected = signal(false);
    let popup = signal(false);
    let error = signal(String::new());
    let owner = Owner::current();
    let callback = context.clone();
    let label = move |name: &'static str| model.get().labels.get(name).cloned().unwrap_or_default();
    let button = move |symbol: &'static str, name: &'static str, command: &'static str| {
        nsh_base::Button::element(nsh_base::ButtonProps {
            accessibility_label: Prop::bind(move || Some(label(name).into())),
            ..Default::default()
        })
        .on_event(move |event: &nsh_base::ButtonEvent| {
            if matches!(event, nsh_base::ButtonEvent::Press) {
                reference.command(command, json!(null));
            }
        })
        .p(px(6.0))
        .rounded(px(4.0))
        .hover(|style| style.bg(nsh_base::theme().muted))
        .child(text(symbol))
        .into_element()
    };
    let close = context.clone();
    let annotations = context.clone();
    let menu = nsh_base::Popover::element(nsh_base::PopoverProps {
        open: Prop::bind(move || Some(popup.get())),
        popup_style: {
            let mut popup = view()
                .p(px(8.0))
                .rounded(px(6.0))
                .bg(nsh_base::theme().background);
            nsh_core::element::Style::from(popup.style().clone()).into()
        },
        ..Default::default()
    })
    .fill(
        "trigger",
        nsh_base::Button::element(nsh_base::ButtonProps {
            disabled: Prop::bind(move || !selected.get()),
            accessibility_label: Prop::bind(move || Some(label("highlight").into())),
            ..Default::default()
        })
        .p(px(6.0))
        .child(text(move || label("highlight"))),
    )
    .on_event(move |event: &nsh_base::PopoverEvent| {
        if let nsh_base::PopoverEvent::OpenChange(open, _) = event {
            popup.set(*open);
        }
    })
    .child(
        view()
            .flex_col()
            .child(
                nsh_base::button()
                    .child(text(move || label("highlight")))
                    .on_press(move || {
                        reference.command("highlight-selection", json!(null));
                        popup.set(false);
                    }),
            )
            .child(
                nsh_base::button()
                    .child(text(move || label("copy")))
                    .on_press(move || {
                        reference.command("copy-selection", json!(null));
                        popup.set(false);
                    }),
            ),
    );
    let toolbar = nsh_base::toolbar()
        .gap(px(4.0))
        .items_center()
        .child(
            nsh_base::Button::element(nsh_base::ButtonProps {
                accessibility_label: Prop::bind(move || Some(label("close").into())),
                ..Default::default()
            })
            .child(text("×"))
            .on_event(move |event: &nsh_base::ButtonEvent| {
                if matches!(event, nsh_base::ButtonEvent::Press) {
                    emit(&close, owner, "pdf-close", model.get().payload(Map::new()));
                }
            }),
        )
        .child(text(move || model.get().filename.clone()))
        .child(button("‹", "previous", "previous-page"))
        .child(button("›", "next", "next-page"))
        .child(button("−", "zoom-out", "zoom-out"))
        .child(button("+", "zoom-in", "zoom-in"))
        .child(button("↔", "fit", "auto-fit"))
        .child(menu)
        .child(
            nsh_base::button()
                .child(text(move || label("annotations")))
                .on_press(move || {
                    emit(
                        &annotations,
                        owner,
                        "pdf-annots",
                        model.get().payload(Map::new()),
                    )
                }),
        );
    let native = native(NAME)
        .element_ref(&reference)
        .prop("model", move || {
            serde_json::to_value(&*model.get()).expect("serializable native PDF model")
        })
        .on_native_event(move |event: &NativeEvent| {
            if !owner.is_live() {
                return;
            }
            let current = model.get_untracked();
            if event.data.get("repo").and_then(Value::as_str) != Some(current.repo.as_str())
                || event.data.get("identity").and_then(Value::as_str)
                    != Some(current.identity.as_str())
                || event.data.get("instance").and_then(Value::as_str)
                    != Some(current.instance.as_str())
            {
                return;
            }
            match &*event.name {
                "selection" => {
                    let has = event
                        .data
                        .get("selected")
                        .and_then(Value::as_bool)
                        .unwrap_or(false);
                    selected.set(has);
                    popup.set(has && model.get_untracked().automenu);
                }
                "error" => error.set(
                    event
                        .data
                        .get("message")
                        .and_then(Value::as_str)
                        .unwrap_or("PDFKit error")
                        .to_owned(),
                ),
                "ready" => error.set(String::new()),
                name => emit(&callback, owner, name, event.data.clone()),
            }
        })
        .flex_1()
        .min_h(px(0.0));
    let style = context.clone();
    let id = format!("lui-{}", context.node.get_untracked().id);
    view()
        .flex_col()
        .min_h(px(0.0))
        .element_ref(&context.reference)
        .test_id(&id)
        .state_inline_style(move || {
            raw_style::compile(&style.node.get(), "div", |value| style.resolve_text(value))
                .expect("validated PDF layout")
        })
        .child(toolbar)
        .child(native)
        .child(when(
            move || !error.get().is_empty(),
            move || {
                text(move || {
                    label("error")
                        .replace("{1}", &error.get())
                        .replace("{2}", "")
                })
                .text_color(nsh_base::theme().destructive)
            },
        ))
        .into_element()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn attrs() -> BTreeMap<String, String> {
        let path = std::env::temp_dir()
            .join("logseq-pdf-contract")
            .join("Unicode 文档.pdf");
        BTreeMap::from([
            (
                "path".into(),
                path.to_str().expect("test path must be UTF-8").into(),
            ),
            ("repo".into(), "private-graph".into()),
            ("identity".into(), "document-a".into()),
            ("instance".into(), "mounted-a".into()),
        ])
    }

    #[test]
    fn native_pdf_accepts_absolute_os_paths_and_their_file_urls() {
        let mut source = attrs();
        let path = source["path"].clone();
        assert!(Path::new(&path).is_absolute());
        assert_eq!(Model::read(&source).unwrap().path, path);
        let file_url = url::Url::from_file_path(&path).unwrap().to_string();
        source.insert("path".into(), file_url.clone());
        assert_eq!(Model::read(&source).unwrap().path, file_url);
        for relative in ["", "book.pdf", "./assets/book.pdf", "../assets/book.pdf"] {
            source.insert("path".into(), relative.into());
            assert!(Model::read(&source).is_err(), "{relative}");
        }
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn native_pdf_rejects_windows_drive_relative_and_rooted_only_paths() {
        let mut source = attrs();
        source.insert("path".into(), r"C:\Graph files\Unicode 文档.pdf".into());
        assert!(Model::read(&source).is_ok());
        for relative in [r"C:book.pdf", r"\Graph\book.pdf", "/Graph/book.pdf"] {
            source.insert("path".into(), relative.into());
            assert!(Model::read(&source).is_err(), "{relative}");
        }
    }

    #[test]
    fn persisted_highlights_and_document_event_identity_remain_ocaml_owned() {
        let mut source = attrs();
        source.insert("page".into(), "3".into());
        source.insert("scale".into(), "page-width".into());
        source.insert("labels".into(), json!({"close":"Close"}).to_string());
        let rect = json!({"x1":10,"y1":20,"x2":90,"y2":35,"w":600,"h":800});
        source.insert(
            "hls".into(),
            json!([{"id":"persisted-a","page":3,"color":null,"bounding":rect,
                "rects":[rect],"text":"Existing selected text","image":null}])
            .to_string(),
        );
        let model = Model::read(&source).unwrap();
        assert_eq!(model.page, 3);
        assert_eq!(model.scale, "page-width");
        assert_eq!(model.highlights[0].id, "persisted-a");
        assert_eq!(model.highlights[0].rects[0].y2, 35.0);
        assert_eq!(model.labels["close"], "Close");
        let payload = model.payload(
            json!({"repo":"retired-graph","identity":"retired-document",
                "instance":"retired-mount","page":4})
            .as_object()
            .unwrap()
            .clone(),
        );
        assert_eq!(
            payload,
            json!({"repo":"private-graph","identity":"document-a",
                "instance":"mounted-a","page":4})
        );
        assert_eq!(Model::read(&attrs()).unwrap().page, 1);
        assert_eq!(Model::read(&attrs()).unwrap().scale, "auto");
    }

    #[test]
    fn unsupported_requests_fail_instead_of_becoming_native_noops() {
        for (name, value) in [
            ("path", "https://example.invalid/book.pdf"),
            ("path", "../assets/book.pdf"),
            ("page", "0"),
            ("page", "1.5"),
            ("scale", "NaN"),
            ("scale", "inf"),
            ("scale", "-1"),
            ("scale", "0"),
            ("area_mode", "true"),
            ("hl_mode", "true"),
            ("theme", "dark"),
            ("automenu", "enabled"),
        ] {
            let mut source = attrs();
            source.insert(name.into(), value.into());
            assert!(Model::read(&source).is_err(), "{name}={value}");
        }
        for scale in ["auto", "page-fit", "page-width", "0.5", "2"] {
            let mut source = attrs();
            source.insert("scale".into(), scale.into());
            assert!(Model::read(&source).is_ok(), "{scale}");
        }
    }

    #[test]
    fn invalid_annotation_geometry_is_rejected_before_native_publication() {
        let valid = json!({"id":"a","page":1,"color":"yellow",
            "bounding":{"x1":10,"y1":20,"x2":90,"y2":35,"w":600,"h":800},
            "rects":[],"text":"Text","image":null});
        for invalid in [
            ("/page", json!(0)),
            ("/color", json!("var(--foreground)")),
            ("/bounding/w", json!(0)),
            ("/bounding/h", json!(-1)),
            ("/bounding/x2", json!(5)),
            ("/bounding/y2", json!(1)),
        ] {
            let mut highlight = valid.clone();
            *highlight.pointer_mut(invalid.0).unwrap() = invalid.1;
            let mut source = attrs();
            source.insert("hls".into(), json!([highlight]).to_string());
            assert!(Model::read(&source).is_err(), "{}", invalid.0);
        }
    }
}
