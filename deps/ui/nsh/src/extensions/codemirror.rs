//! The app's CodeMirror contract over NSH's native code editor.
//! NSH owns text editing, selection, undo, composition and syntax rendering.
use super::{boolean, string};
use lui_nsh::{extensions::ExtensionContext, store::Node};
use nsh_base::editor::{Editor, EditorEvent, EditorProps};
use nsh_core::{keymap::When, prelude::*};
use serde_json::{Map, Value};
use std::{cell::RefCell, rc::Rc};

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
struct Source {
    role: String,
    uuid: String,
}
impl Source {
    fn read(context: &ExtensionContext) -> Self {
        Self {
            role: string(context, "source-role"),
            uuid: string(context, "uuid"),
        }
    }
    fn read_only(&self, context: &ExtensionContext) -> bool {
        boolean(context, "read-only") || (self.role == "block" && self.uuid.is_empty())
    }
}

pub(super) fn validate(node: &Node) -> Result<(), String> {
    let properties = &node
        .extension
        .as_ref()
        .expect("extension validator")
        .properties;
    match properties.get("source-role").and_then(Value::as_str) {
        Some("block" | "query") => Ok(()),
        _ => Err("logseq-codemirror requires source-role block or query".into()),
    }
}

/// Only changing the source identity replaces the native editor and its history.
/// Property changes, including language/value, keep the same native instance.
pub(super) fn element(context: ExtensionContext) -> AnyElement {
    let source_context = context.clone();
    let source = computed(move || Source::read(&source_context));
    // A bare keyed region gets an implicit auto-width View from NSH. In the
    // production Row that host collapses around the percent-width Editor.
    // Size that same root explicitly; the source-keyed Editor stays retained.
    view()
        .w_full()
        .child(each(
            move || vec![source.get()],
            Clone::clone,
            move |source, _| editor_for(context.clone(), source.get_untracked()),
        ))
        .into_element()
}

fn editor_for(context: ExtensionContext, source: Source) -> AnyElement {
    let owner = Owner::current();
    let focused = signal(false);
    let initial = SharedString::from(string(&context, "value"));
    // Scalar callback observation only; NSH owns the document, selections and
    // undo. This needs no second reference, model, or reactive copy effect.
    let observed = Rc::new(RefCell::new(initial.clone()));
    let read_only_context = context.clone();
    let read_only_source = source.clone();
    let read_only = computed(move || read_only_source.read_only(&read_only_context));
    let keys_context = context.clone();
    let keys_source = source.clone();
    let keys_value = observed.clone();
    effect(move || {
        if !focused.get() || read_only.get() {
            return;
        }
        for (native, key) in [("escape", "Escape"), ("shift+enter", "Shift-Enter")]
            .into_iter()
            .chain((keys_source.role == "query").then_some(("enter", "Enter")))
        {
            let context = keys_context.clone();
            let source = keys_source.clone();
            let value = keys_value.clone();
            on_key_with(
                native,
                KeyOptions {
                    when: When::Always,
                    for_focus: true,
                    ..Default::default()
                },
                move |_| {
                    if owner.is_live() && Source::read(&context) == source {
                        let value = value.borrow().clone();
                        emit(&context, "key", &value, Some(key));
                    }
                },
            );
        }
    });
    let value_context = context.clone();
    let value_source = source.clone();
    let value_observation = observed.clone();
    let language_context = context.clone();
    let height_context = context.clone();
    let label_context = context.clone();
    let events_context = context.clone();
    let events_source = source.clone();
    let test_id = format!("lui-{}", context.node.get_untracked().id);
    Editor::element(EditorProps {
        default_value: Some(initial).into(),
        value: Prop::bind(move || {
            // Query execution snapshots must not replace the native draft.
            if value_source.role == "query" && focused.get() {
                None
            } else {
                let value = SharedString::from(string(&value_context, "value"));
                *value_observation.borrow_mut() = value.clone();
                Some(value)
            }
        }),
        language: Prop::bind(move || language(&string(&language_context, "lang"))),
        read_only: Prop::bind(move || read_only.get()),
        auto_focus: (source.role == "query" && !source.read_only(&context)).into(),
        line_numbers: (source.role == "block").into(),
        soft_wrap: true.into(),
        min_rows: Some(1_u32).into(),
        accessibility_label: Prop::bind(move || {
            let label = string(&label_context, "accessibility-identifier");
            (!label.is_empty()).then(|| SharedString::from(label))
        }),
        ..EditorProps::initial()
    })
    .on_event(move |event: &EditorEvent| {
        if !owner.is_live() || Source::read(&events_context) != events_source {
            return;
        }
        match event {
            EditorEvent::Change(value) => {
                *observed.borrow_mut() = value.clone();
                emit(&events_context, "input", value, None);
            }
            EditorEvent::Focus => {
                focused.set(true);
                if events_source.role == "block" {
                    let value = observed.borrow().clone();
                    emit(&events_context, "focus", &value, None);
                }
            }
            EditorEvent::Blur => {
                let value = observed.borrow().clone();
                focused.set(false);
                if events_source.role == "block" {
                    emit(&events_context, "blur", &value, None);
                }
            }
            _ => {}
        }
    })
    .element_ref(&context.reference)
    .test_id(&test_id)
    .w_full()
    // Match code.css: ordinary code grows up to 1024px; calc explicitly
    // removes that limit. Keep the same Editor and its native row window.
    .max_h(move || {
        if string(&height_context, "lang")
            .trim()
            .eq_ignore_ascii_case("calc")
        {
            Length::Auto
        } else {
            Length::from(px(1024.0))
        }
    })
    .into_element()
}

fn language(name: &str) -> Option<SharedString> {
    let normalized = name.trim().to_lowercase();
    let language = match normalized.as_str() {
        "" => return None,
        "edn" | "clj" | "cljc" | "cljs" | "clojurescript" => "clojure",
        "calc" => "javascript",
        value => value,
    };
    Some(language.to_owned().into())
}

fn emit(context: &ExtensionContext, name: &str, value: &str, key: Option<&str>) {
    let mut values = Map::new();
    values.insert("name".into(), name.into());
    values.insert("value".into(), value.into());
    if let Some(key) = key {
        values.insert("key".into(), key.into());
    }
    context
        .emitter
        .try_emit("cm-event", values)
        .expect("a live CodeMirror emits its declared scalar contract");
}
