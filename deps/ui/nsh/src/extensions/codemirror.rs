//! The app's CodeMirror contract over NSH's native code editor.
//! NSH owns text editing, selection, undo, composition and syntax rendering.
use super::{boolean, string};
use lui_nsh::{extensions::ExtensionContext, store::Node};
use nsh_base::editor::{Editor, EditorApi, editor};
use nsh_core::{keymap::When, prelude::*};
use serde_json::{Map, Value};

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
    each(
        move || vec![source.get()],
        Clone::clone,
        move |source, _| editor_for(context.clone(), source.get_untracked()),
    )
}

fn editor_for(context: ExtensionContext, source: Source) -> AnyElement {
    let owner = Owner::current();
    let focused = signal(false);
    let handle = component_ref::<Editor>();
    let initial = string(&context, "value");
    let read_only_context = context.clone();
    let read_only_source = source.clone();
    let read_only = computed(move || read_only_source.read_only(&read_only_context));
    let value_context = context.clone();
    let value_source = source.clone();
    let language_context = context.clone();
    let label_context = context.clone();
    let change_context = context.clone();
    let change_source = source.clone();
    let focus_context = context.clone();
    let focus_source = source.clone();
    let blur_context = context.clone();
    let blur_source = source.clone();
    let keys_context = context.clone();
    let keys_source = source.clone();
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
            on_key_with(
                native,
                KeyOptions {
                    when: When::Always,
                    for_focus: true,
                    ..Default::default()
                },
                move |_| {
                    if owner.is_live()
                        && Source::read(&context) == source
                        && let Some(api) = handle.api::<EditorApi>()
                    {
                        emit(&context, "key", &api.value(), Some(key));
                    }
                },
            );
        }
    });
    let test_id = format!("lui-{}", context.node.get_untracked().id);
    editor()
        .default_value(initial)
        .value(move || {
            // Query execution snapshots must not replace the draft being edited.
            if value_source.role == "query" && focused.get() {
                None
            } else {
                Some(SharedString::from(string(&value_context, "value")))
            }
        })
        .language(move || language(&string(&language_context, "lang")))
        .read_only(move || read_only.get())
        .auto_focus(source.role == "query" && !source.read_only(&context))
        .line_numbers(source.role == "block")
        .soft_wrap(true)
        .min_rows(1_u32)
        .accessibility_label(move || {
            let label = string(&label_context, "accessibility-identifier");
            (!label.is_empty()).then(|| SharedString::from(label))
        })
        .on_change(move |value: &SharedString| {
            if owner.is_live() && Source::read(&change_context) == change_source {
                emit(&change_context, "input", value, None);
            }
        })
        .on_focus(move || {
            if owner.is_live() && Source::read(&focus_context) == focus_source {
                focused.set(true);
                if focus_source.role == "block"
                    && let Some(api) = handle.api::<EditorApi>()
                {
                    emit(&focus_context, "focus", &api.value(), None);
                }
            }
        })
        .on_blur(move || {
            if owner.is_live() && Source::read(&blur_context) == blur_source {
                focused.set(false);
                if blur_source.role == "block"
                    && let Some(api) = handle.api::<EditorApi>()
                {
                    emit(&blur_context, "blur", &api.value(), None);
                }
            }
        })
        .component_ref(&handle)
        .element_ref(&context.reference)
        .test_id(&test_id)
        .w_full()
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
