//! Native input conduit for the OCaml-owned block editor, never a document engine.
//!
//! Edit_view already renders rich runs and its measured caret/selection. This
//! retained, transparent 1px Input supplies native editing, surrounding text and
//! IME; its own caret is disabled, so startup must keep paintsCaret=false.
//! Public Input does not accept an external candidate-window rectangle or expose
//! selection anchor direction. Those geometry/platform limits remain explicit.
use super::string;
use lui_nsh::{
    app::ApplicationRuntime, extensions::ExtensionContext, runtime::EditorSnapshot, store::Node,
};
use nsh_core::{element::input, keymap::When, prelude::*};
use serde_json::{Map, Value, json};
use std::{
    cell::{Cell, RefCell},
    future::Future,
    pin::Pin,
    rc::Rc,
};

type SnapshotFuture = Pin<Box<dyn Future<Output = Result<Option<EditorSnapshot>, String>>>>;
type SnapshotReader = Rc<dyn Fn(String) -> SnapshotFuture>;

#[derive(Clone, PartialEq, Eq)]
struct Revision {
    block: String,
    runs: String,
    caret: i64,
    anchor: i64,
    source_version: i64,
    composition: String,
    focus: u64,
}
impl Revision {
    fn read(context: &ExtensionContext, focus: u64) -> Self {
        Self {
            block: string(context, "block-id"),
            runs: string(context, "runs"),
            caret: context
                .property("caret")
                .and_then(|v| v.as_i64())
                .unwrap_or(0),
            anchor: context
                .property("anchor")
                .and_then(|v| v.as_i64())
                .unwrap_or(0),
            source_version: context
                .property("source-version")
                .and_then(|v| v.as_i64())
                .unwrap_or(0),
            composition: string(context, "composition"),
            focus,
        }
    }
}
#[derive(Default)]
struct Transport {
    selection: (usize, usize),
    serial: u64,
    preedit: String,
    commit: Option<String>,
}

pub(super) fn validate(node: &Node) -> Result<(), String> {
    let properties = &node
        .extension
        .as_ref()
        .expect("extension validator")
        .properties;
    if properties
        .get("block-id")
        .and_then(Value::as_str)
        .is_none_or(str::is_empty)
    {
        return Err("logseq-editor requires a nonempty block-id".into());
    }
    for name in ["caret", "anchor", "source-version"] {
        if properties
            .get(name)
            .and_then(Value::as_i64)
            .is_some_and(|value| value < 0)
        {
            return Err(format!("logseq-editor {name} must be nonnegative"));
        }
    }
    if let Some(composition) = properties.get("composition").and_then(Value::as_str)
        && !composition.is_empty()
    {
        let valid = composition
            .split_once(',')
            .and_then(|(lo, hi)| Some((lo.parse::<usize>().ok()?, hi.parse::<usize>().ok()?)))
            .is_some_and(|(lo, hi)| lo <= hi);
        if !valid {
            return Err("logseq-editor composition must be an ordered byte range".into());
        }
    }
    Ok(())
}

pub(super) fn element(context: ExtensionContext) -> AnyElement {
    let runtime = use_context::<ApplicationRuntime>()
        .expect("logseq-editor requires Desktop's ApplicationRuntime context");
    let read: SnapshotReader = Rc::new(move |block| {
        let runtime = runtime.clone();
        Box::pin(async move { runtime.editor_snapshot(block).await })
    });
    let source_context = context.clone();
    let source = computed(move || string(&source_context, "block-id"));
    each(
        move || vec![source.get()],
        Clone::clone,
        move |source, _| native_sink(context.clone(), source.get_untracked(), read.clone()),
    )
    .into_element()
}

fn native_sink(context: ExtensionContext, block: String, read: SnapshotReader) -> AnyElement {
    let owner = Owner::current();
    let value = signal(String::new());
    let range = signal((0_u32, 0_u32));
    let ready = signal(false);
    let focused = signal(false);
    let composing = signal(false);
    let focus_revision = signal(0_u64);
    let state = Rc::new(RefCell::new(Transport::default()));
    let revision_context = context.clone();
    let revision = computed(move || Revision::read(&revision_context, focus_revision.get()));
    refresh(
        owner,
        revision,
        read,
        RefreshState {
            value,
            range,
            ready,
            composing,
            transport: state.clone(),
        },
    );
    bind_keys(
        owner,
        context.clone(),
        focused,
        composing,
        ready,
        state.clone(),
        block.clone(),
    );

    let change_context = context.clone();
    let change_state = state.clone();
    let selection_context = context.clone();
    let selection_state = state.clone();
    let composition_context = context.clone();
    let composition_state = state.clone();
    let focus_context = context.clone();
    let blur_context = context.clone();
    let blur_state = state.clone();
    let label_context = context.clone();
    let current =
        move |context: &ExtensionContext| owner.is_live() && string(context, "block-id") == block;
    let current: Rc<dyn Fn(&ExtensionContext) -> bool> = Rc::new(current);
    let change_current = current.clone();
    let selection_current = current.clone();
    let composition_current = current.clone();
    let focus_current = current.clone();
    let test_id = format!("lui-{}", context.node.get_untracked().id);
    input()
        .test_id(&test_id)
        .value(move || value.get())
        .selected_range(move || range.get())
        .readonly(move || !ready.get())
        .multiline(true)
        .submit_behavior(nsh_core::SubmitBehavior::Newline)
        .auto_focus(true)
        .auto_correct(false)
        .caret(false)
        .scrollbar(false)
        .text_color(nsh_core::color::transparent_black())
        .selection_color(nsh_core::color::transparent_black())
        .absolute()
        .size(px(1.0))
        .label(move || {
            let label = string(&label_context, "accessibility-identifier");
            if label.is_empty() {
                SharedString::from("block editor")
            } else {
                SharedString::from(label)
            }
        })
        .element_ref(&context.reference)
        .on_change(move |text: &str| {
            if !change_current(&change_context) || !ready.get_untracked() {
                return;
            }
            let selection = change_state.borrow().selection;
            let edit = value.with_untracked(|old| replacement(old, text, selection));
            let Some(edit) = edit else {
                return;
            };
            {
                let mut state = change_state.borrow_mut();
                state.serial += 1;
                state.selection = (edit.first + edit.text.len(), edit.first + edit.text.len());
                if composing.get_untracked() {
                    state.commit = Some(edit.text.clone());
                }
            }
            value.set(text.to_owned());
            if !composing.get_untracked() {
                emit_replacement(&change_context, edit);
            }
        })
        .on_selection_change(move |selection: &Selection| {
            if !selection_current(&selection_context)
                || !ready.get_untracked()
                || composing.get_untracked()
            {
                return;
            }
            let selected = value.with_untracked(|text| {
                Some((
                    utf16_to_byte(text, selection.start)?,
                    utf16_to_byte(text, selection.end)?,
                ))
            });
            let Some(selected) = selected else {
                eprintln!("logseq-editor: native selection is not a UTF-16 boundary");
                return;
            };
            let previous = selection_state.borrow().selection;
            if ordered(previous) == ordered(selected) {
                return;
            }
            let mut state = selection_state.borrow_mut();
            state.selection = selected;
            state.serial += 1;
            drop(state);
            emit_selection(&selection_context, selected);
        })
        .on_composition_change(move |event: &Composition| {
            if !composition_current(&composition_context) || !ready.get_untracked() {
                return;
            }
            let was_composing = composing.get_untracked();
            if event.composing {
                if !was_composing {
                    composition_state.borrow_mut().commit = None;
                    composing.set(true);
                    emit(
                        &composition_context,
                        "composition",
                        json!({"state":"start"}),
                    );
                }
                composition_state.borrow_mut().preedit = event.text.clone();
                emit(
                    &composition_context,
                    "composition",
                    json!({"state":"update","text":event.text}),
                );
            } else if was_composing {
                composing.set(false);
                let commit = composition_state.borrow_mut().commit.take();
                composition_state.borrow_mut().preedit.clear();
                emit(
                    &composition_context,
                    "composition",
                    match commit {
                        Some(text) => json!({"state":"end","text":text}),
                        None => json!({"state":"cancel"}),
                    },
                );
            }
        })
        .on_focus(move || {
            if focus_current(&focus_context) {
                focused.set(true);
                emit(&focus_context, "focus", json!({}));
                focus_revision.update(|revision| *revision += 1);
            }
        })
        .on_blur(move || {
            if current(&blur_context) {
                focused.set(false);
                composing.set(false);
                blur_state.borrow_mut().preedit.clear();
                blur_state.borrow_mut().commit = None;
                emit(&blur_context, "blur", json!({}));
            }
        })
        .into_element()
}

struct RefreshState {
    value: Signal<String>,
    range: Signal<(u32, u32)>,
    ready: Signal<bool>,
    composing: Signal<bool>,
    transport: Rc<RefCell<Transport>>,
}
fn refresh(owner: Owner, revision: Memo<Revision>, read: SnapshotReader, controls: RefreshState) {
    let RefreshState {
        value,
        range,
        ready,
        composing,
        transport: state,
    } = controls;
    // One in-flight query; metadata bursts replace its requested revision.
    // This is an app-queue barrier, not a direct worker query overtaking input.
    let wanted = Rc::new(RefCell::new(revision.get_untracked()));
    let running = Rc::new(Cell::new(false));
    effect(move || {
        *wanted.borrow_mut() = revision.get();
        if running.replace(true) {
            return;
        }
        let wanted = wanted.clone();
        let running = running.clone();
        let state = state.clone();
        let read = read.clone();
        owner.run(move || {
            spawn(async move {
                loop {
                    let requested = wanted.borrow().clone();
                    let serial = state.borrow().serial;
                    if composing.get_untracked() {
                        break;
                    }
                    let snapshot = read(requested.block.clone()).await;
                    if !owner.is_live() {
                        return;
                    }
                    if *wanted.borrow() != requested {
                        continue;
                    }
                    if state.borrow().serial == serial && !composing.get_untracked() {
                        match snapshot {
                            Ok(Some(snapshot)) => {
                                let selected = (
                                    byte_to_utf16(&snapshot.source, snapshot.anchor),
                                    byte_to_utf16(&snapshot.source, snapshot.caret),
                                );
                                if let (Some(anchor), Some(caret)) = selected {
                                    state.borrow_mut().selection =
                                        (snapshot.anchor, snapshot.caret);
                                    value.set(snapshot.source);
                                    range.set((anchor, caret));
                                    ready.set(true);
                                } else {
                                    ready.set(false);
                                    eprintln!("logseq-editor: invalid authoritative selection");
                                }
                            }
                            Ok(None) => {
                                ready.set(false);
                                eprintln!("logseq-editor: no authoritative active block snapshot");
                            }
                            Err(error) => {
                                ready.set(false);
                                eprintln!("logseq-editor snapshot failed: {error}");
                            }
                        }
                    }
                    break;
                }
                running.set(false);
            });
        });
    });
}

fn bind_keys(
    owner: Owner,
    context: ExtensionContext,
    focused: Signal<bool>,
    composing: Signal<bool>,
    ready: Signal<bool>,
    state: Rc<RefCell<Transport>>,
    block: String,
) {
    effect(move || {
        if !focused.get() || composing.get() || !ready.get() {
            return;
        }
        for (native, key) in [
            ("left", "ArrowLeft"),
            ("right", "ArrowRight"),
            ("up", "ArrowUp"),
            ("down", "ArrowDown"),
            ("home", "Home"),
            ("end", "End"),
            ("backspace", "Backspace"),
            ("delete", "Delete"),
            ("tab", "Tab"),
            ("escape", "Escape"),
            ("enter", "Enter"),
        ] {
            for mask in 0_u8..16 {
                // Modified Enter belongs to the native insertion path. The model
                // explicitly passes it; plain Enter is the block split command.
                if key == "Enter" && mask != 0 {
                    continue;
                }
                let mut chord = String::new();
                for (bit, prefix) in [(1, "shift+"), (2, "alt+"), (4, "ctrl+"), (8, "cmd+")] {
                    if mask & bit != 0 {
                        chord.push_str(prefix);
                    }
                }
                chord.push_str(native);
                if nsh_core::keymap::Keystroke::parse_with(&chord, apple_keys())
                    .expect("fixed native editor chord")
                    .reserved(os())
                    .is_some()
                {
                    continue;
                }
                let context = context.clone();
                let state = state.clone();
                let block = block.clone();
                on_key_with(
                    &chord,
                    KeyOptions {
                        when: When::Always,
                        repeat: true,
                        for_focus: true,
                        ..Default::default()
                    },
                    move |_| {
                        if owner.is_live()
                            && string(&context, "block-id") == block
                            && !composing.get_untracked()
                        {
                            state.borrow_mut().serial += 1;
                            emit(
                                &context,
                                "key",
                                json!({"key":key,"shift":mask&1!=0,"alt":mask&2!=0,"ctrl":mask&4!=0,"meta":mask&8!=0}),
                            );
                        }
                    },
                );
            }
        }
        for chord in ["ctrl+a", "cmd+a"] {
            let context = context.clone();
            let state = state.clone();
            let block = block.clone();
            on_key_with(
                chord,
                KeyOptions {
                    when: When::Always,
                    for_focus: true,
                    ..Default::default()
                },
                move |_| {
                    if owner.is_live() && string(&context, "block-id") == block {
                        state.borrow_mut().serial += 1;
                        emit(
                            &context,
                            "key",
                            json!({"key":"a","ctrl":chord=="ctrl+a","meta":chord=="cmd+a"}),
                        );
                    }
                },
            );
        }
    });
}

#[derive(Debug, PartialEq, Eq)]
struct Replacement {
    first: usize,
    last: usize,
    text: String,
}
fn replacement(old: &str, new: &str, selection: (usize, usize)) -> Option<Replacement> {
    if old == new {
        return None;
    }
    let (lo, hi) = ordered(selection);
    if old.is_char_boundary(lo)
        && old.is_char_boundary(hi)
        && new.len() >= lo + old.len() - hi
        && new.starts_with(&old[..lo])
        && new.ends_with(&old[hi..])
    {
        return Some(Replacement {
            first: lo,
            last: hi,
            text: new[lo..new.len() - (old.len() - hi)].to_owned(),
        });
    }
    let mut first = old
        .chars()
        .zip(new.chars())
        .take_while(|(a, b)| a == b)
        .map(|(c, _)| c.len_utf8())
        .sum::<usize>();
    let suffix = old[first..]
        .chars()
        .rev()
        .zip(new[first..].chars().rev())
        .take_while(|(a, b)| a == b)
        .map(|(c, _)| c.len_utf8())
        .sum::<usize>();
    first = first.min(old.len());
    Some(Replacement {
        first,
        last: old.len() - suffix,
        text: new[first..new.len() - suffix].to_owned(),
    })
}
fn ordered((a, b): (usize, usize)) -> (usize, usize) {
    (a.min(b), a.max(b))
}
fn utf16_to_byte(text: &str, offset: u32) -> Option<usize> {
    let mut units = 0_u32;
    for (byte, c) in text.char_indices() {
        if units == offset {
            return Some(byte);
        }
        units = units.checked_add(c.len_utf16() as u32)?;
        if units > offset {
            return None;
        }
    }
    (units == offset).then_some(text.len())
}
fn byte_to_utf16(text: &str, offset: usize) -> Option<u32> {
    text.is_char_boundary(offset)
        .then(|| u32::try_from(text[..offset].encode_utf16().count()).ok())
        .flatten()
}
fn emit_selection(context: &ExtensionContext, (anchor, caret): (usize, usize)) {
    emit(context, "pointer", json!({"offset":anchor,"extend":false}));
    if anchor != caret {
        emit(context, "pointer", json!({"offset":caret,"extend":true}));
    }
}
fn emit_replacement(context: &ExtensionContext, edit: Replacement) {
    emit_selection(context, (edit.first, edit.last));
    if edit.text.is_empty() {
        emit(context, "delete", json!({"kind":"selection"}));
    } else {
        emit(context, "insert", json!({"text":edit.text}));
    }
}
fn emit(context: &ExtensionContext, name: &str, values: Value) {
    let values: Map<String, Value> = values
        .as_object()
        .expect("typed editor event object")
        .clone();
    context
        .emitter
        .try_emit(name, values)
        .expect("a live block editor emits its declared scalar event contract");
}

#[cfg(test)]
#[path = "editor_tests.rs"]
mod tests;
