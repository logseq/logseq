//! One window-owned bridge from the effective OCaml keymap to native shortcuts.
use lui_nsh::{
    app::{ApplicationEvents, ApplicationMutations},
    render::Renderer,
    runtime::PlatformEvent,
};
use nsh_core::{
    element::SignalEquals,
    keymap::{Key, Keystroke, When},
    prelude::*,
};
use serde::Deserialize;
use serde_json::{Value, json};
use std::{collections::BTreeMap, rc::Rc};

// Standard editor conduit keys; shared with its focused native Input owner.
pub(crate) const EDITOR_KEYS: &[(&str, &str)] = &[
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
    ("a", "a"),
    ("b", "b"),
    ("c", "c"),
    ("d", "d"),
    ("e", "e"),
    ("f", "f"),
    ("h", "h"),
    ("i", "i"),
    ("k", "k"),
    ("l", "l"),
    ("n", "n"),
    ("p", "p"),
    ("s", "s"),
    ("t", "t"),
    ("u", "u"),
    ("v", "v"),
    ("w", "w"),
    ("x", "x"),
    ("y", "y"),
    ("z", "z"),
    (";", ";"),
    (",", ","),
    (".", "."),
];

#[derive(Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
struct Snapshot {
    revision: u64,
    palette: bool,
    capture: bool,
    #[serde(rename = "palette-copy-reference")]
    palette_copy_reference: bool,
    #[serde(rename = "block-selection")]
    block_selection: bool,
    bindings: Vec<Binding>,
}
#[derive(Clone, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
struct Binding {
    stroke: String,
    command: String,
    scope: String,
}
#[derive(Clone)]
struct EditorFocus {
    node: u64,
    incarnation: u64,
    ready: Signal<bool>,
    composing: Signal<bool>,
    before_key: Rc<dyn Fn()>,
}
impl PartialEq for EditorFocus {
    fn eq(&self, other: &Self) -> bool {
        self.node == other.node && self.incarnation == other.incarnation
    }
}
type SendKey = Rc<dyn Fn(Value)>;

/// Retained by the application owner; native focus is local to its editor Input.
#[derive(Clone, Copy)]
pub(crate) struct GlobalKeyboard {
    snapshot: Signal<Option<Snapshot>>,
    editor: Signal<Option<EditorFocus>>,
    send: Signal<Option<SendKey>>,
}
impl GlobalKeyboard {
    pub(crate) fn mount() -> Self {
        let keyboard = Self {
            snapshot: signal(None),
            editor: signal(None),
            send: signal_with(None, SignalEquals::Never),
        };
        let admission = use_context::<ApplicationMutations>();
        effect(move || {
            let Some(snapshot) = keyboard.snapshot.get() else {
                return;
            };
            let Some(send) = keyboard.send.get() else {
                return;
            };
            let editor = keyboard.editor.get();
            if editor.as_ref().is_some_and(|editor| editor.composing.get()) {
                return;
            }
            let editor = editor.filter(|editor| editor.ready.get());
            install(&snapshot, editor, send, admission.clone());
        });
        keyboard
    }
    pub(crate) fn connect(self, events: ApplicationEvents, renderer: Renderer) {
        self.send.set(Some(Rc::new(move |payload| {
            if let Err(error) = events.send(PlatformEvent {
                operation: "native-key".into(),
                payload: payload.to_string(),
            }) {
                renderer.fail(error);
            }
        })));
    }
    pub(crate) fn replace(self, payload: &str) -> Result<(), String> {
        let snapshot: Snapshot =
            serde_json::from_str(payload).map_err(|error| format!("native keymap: {error}"))?;
        if snapshot.bindings.len() > 4096 {
            return Err("native keymap exceeds 4096 strokes".into());
        }
        for binding in &snapshot.bindings {
            if !matches!(
                binding.scope.as_str(),
                "editor-global"
                    | "block-editing-only"
                    | "global-non-editing-only"
                    | "global-prevent-default"
                    | "misc"
            ) {
                return Err(format!("unsupported native keymap scope {}", binding.scope));
            }
            parse(&binding.stroke)?;
        }
        self.snapshot.set(Some(snapshot));
        Ok(())
    }
    pub(crate) fn focus_editor(
        self,
        node: u64,
        incarnation: u64,
        ready: Signal<bool>,
        composing: Signal<bool>,
        before_key: Rc<dyn Fn()>,
    ) {
        self.editor.set(Some(EditorFocus {
            node,
            incarnation,
            ready,
            composing,
            before_key,
        }));
    }
    pub(crate) fn blur_editor(self, node: u64, incarnation: u64) {
        if self.editor.with_untracked(|editor| {
            editor
                .as_ref()
                .is_some_and(|editor| editor.node == node && editor.incarnation == incarnation)
        }) {
            self.editor.set(None);
        }
    }
}

fn parse(stroke: &str) -> Result<Keystroke, String> {
    if stroke.len() > 128 {
        return Err("native keystroke exceeds 128 bytes".into());
    }
    let native = stroke
        .replace("open-square-bracket", "[")
        .replace("close-square-bracket", "]");
    Keystroke::parse_with(&native, apple_keys())
        .map_err(|error| format!("native keystroke {stroke}: {error}"))
}
fn mask(stroke: Keystroke) -> u8 {
    u8::from(stroke.modifiers.shift)
        | u8::from(stroke.modifiers.alt) << 1
        | u8::from(stroke.modifiers.ctrl) << 2
        | u8::from(stroke.modifiers.cmd) << 3
}
fn editor_owns(stroke: Keystroke) -> bool {
    let name = key_name(stroke.key);
    EDITOR_KEYS.iter().any(|(_, key)| {
        *key == name
            && (key.len() != 1 || matches!(mask(stroke), 4 | 5 | 8 | 9))
            && (*key != "v" || matches!(mask(stroke), 5 | 9))
            && (*key != "x" || matches!(mask(stroke), 4 | 8))
    })
}

fn key_name(key: Key) -> String {
    match key {
        Key::Char(' ') => " ".into(),
        Key::Char(c) => c.to_string(),
        Key::Enter => "Enter".into(),
        Key::Escape => "Escape".into(),
        Key::Tab => "Tab".into(),
        Key::Backspace => "Backspace".into(),
        Key::Delete => "Delete".into(),
        Key::Insert => "Insert".into(),
        Key::Up => "ArrowUp".into(),
        Key::Down => "ArrowDown".into(),
        Key::Left => "ArrowLeft".into(),
        Key::Right => "ArrowRight".into(),
        Key::Home => "Home".into(),
        Key::End => "End".into(),
        Key::PageUp => "PageUp".into(),
        Key::PageDown => "PageDown".into(),
        Key::F(n) => format!("F{n}"),
    }
}
fn payload(stroke: Keystroke, editor: Option<&EditorFocus>) -> Value {
    let mut payload = json!({"key":key_name(stroke.key),"ctrlKey":stroke.modifiers.ctrl,"metaKey":stroke.modifiers.cmd,
        "shiftKey":stroke.modifiers.shift,"altKey":stroke.modifiers.alt,"isComposing":false,"repeat":false});
    if let Some(editor) = editor {
        payload["nodeId"] = json!(editor.node);
    }
    payload
}
fn install(
    snapshot: &Snapshot,
    editor: Option<EditorFocus>,
    send: SendKey,
    admission: Option<ApplicationMutations>,
) {
    // Deduplicate physical strokes. NSH resolves the shared command catalog;
    // OCaml remains the only sequence matcher and command dispatcher.
    let mut bindings = BTreeMap::<String, (Keystroke, u8)>::new();
    let mut add = |stroke: Keystroke, priority: u8| {
        if stroke.reserved(os()).is_none() {
            bindings
                .entry(stroke.to_string())
                .and_modify(|(_, previous)| *previous = (*previous).max(priority))
                .or_insert((stroke, priority));
        }
    };
    if snapshot.capture {
        let names = (32_u8..=126)
            .map(|c| {
                if c == 32 {
                    "space".to_owned()
                } else {
                    char::from(c).to_string()
                }
            })
            .chain((1..=24).map(|n| format!("f{n}")))
            .chain(
                [
                    "left",
                    "right",
                    "up",
                    "down",
                    "home",
                    "end",
                    "pageup",
                    "pagedown",
                    "tab",
                    "enter",
                    "escape",
                    "backspace",
                    "delete",
                    "insert",
                ]
                .map(str::to_owned),
            );
        for name in names {
            for modifiers in 0..16 {
                let prefixes = [(1, "shift+"), (2, "alt+"), (4, "ctrl+"), (8, "cmd+")]
                    .into_iter()
                    .filter_map(|(bit, prefix)| (modifiers & bit != 0).then_some(prefix))
                    .collect::<String>();
                if let Ok(stroke) = parse(&format!("{prefixes}{name}")) {
                    add(stroke, 2);
                }
            }
        }
    } else {
        for binding in &snapshot.bindings {
            if snapshot.palette
                && !matches!(
                    binding.command.as_str(),
                    "go/search" | "command-palette/toggle"
                )
            {
                continue;
            }
            if editor.is_none() && binding.scope == "block-editing-only" {
                continue;
            }
            if editor.is_some() && binding.scope == "global-non-editing-only" {
                continue;
            }
            let stroke = parse(&binding.stroke).expect("validated native keymap");
            if editor.is_some() && editor_owns(stroke) {
                continue;
            }
            // Catalog sequences are flattened for the native matcher. Their
            // printable strokes must remain native text while an editor owns
            // focus; consuming a prefix cannot be undone by OCaml later.
            add(
                stroke,
                if editor.is_some()
                    && !(matches!(stroke.key, Key::Char(_))
                        && !stroke.modifiers.cmd
                        && !stroke.modifiers.ctrl
                        && !stroke.modifiers.alt)
                {
                    2
                } else if binding.scope == "global-non-editing-only" {
                    0
                } else {
                    1
                },
            );
        }
        // Core appends its topmost overlay Cancel binding after component
        // bindings. A visible toolbar therefore dismisses first; selection
        // Escape is reachable only after that native overlay retires.
        if snapshot.block_selection && !snapshot.palette && editor.is_none() {
            add(parse("escape").expect("fixed selection key"), 0);
        }
        if snapshot.palette {
            for key in [
                "up", "down", "home", "end", "pageup", "pagedown", "enter", "escape",
            ] {
                for modifiers in ["", "shift+", "ctrl+", "cmd+"] {
                    add(
                        parse(&format!("{modifiers}{key}")).expect("fixed palette key"),
                        2,
                    );
                }
            }
            for key in ["ctrl+n", "ctrl+p"] {
                add(parse(key).expect("fixed palette key"), 2);
            }
            if snapshot.palette_copy_reference {
                add(parse("mod+c").expect("fixed palette copy"), 2);
            }
        }
    }
    for (_, (stroke, priority)) in bindings {
        let send = send.clone();
        let editor = editor.clone();
        let admission = admission.clone();
        on_key_with(
            &stroke.to_string(),
            KeyOptions {
                when: match priority {
                    0 => When::NotEditing,
                    1 => When::Auto,
                    _ => When::Always,
                },
                repeat: !snapshot.capture,
                ..Default::default()
            },
            move |_| {
                if admission
                    .as_ref()
                    .is_some_and(|admission| admission.check().is_err())
                {
                    return;
                }
                if let Some(editor) = &editor {
                    (editor.before_key)();
                }
                send(payload(stroke, editor.as_ref()));
            },
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use nsh_base::input;
    use nsh_engine::{EngineConfig, EngineContext, Root};
    use nsh_testing::Headless;
    use std::sync::{Arc, Mutex};

    #[derive(Clone)]
    struct Observed(Arc<Mutex<Vec<Value>>>);
    fn snapshot(stroke: &str, revision: u64) -> String {
        json!({"revision":revision,"palette":false,"capture":false,"palette-copy-reference":false,"block-selection":false,"bindings":[
            {"stroke":stroke,"command":"go/search","scope":"global-prevent-default"},
            {"stroke":"t","command":"ui/toggle-left-sidebar","scope":"global-non-editing-only"},
            {"stroke":"l","command":"ui/toggle-left-sidebar","scope":"global-non-editing-only"},
            {"stroke":"mod+z","command":"editor/undo","scope":"global-prevent-default"}
        ]}).to_string()
    }
    #[component]
    fn KeyboardProbe() -> impl IntoElement {
        let observed = engine_context::<Observed>().unwrap();
        let keyboard = GlobalKeyboard::mount();
        let output = observed.0.clone();
        keyboard.send.set(Some(Rc::new(move |value| {
            output.lock().unwrap().push(value)
        })));
        keyboard.replace(&snapshot("mod+k", 1)).unwrap();
        let changed = keyboard;
        on_key_with(
            "f8",
            KeyOptions {
                when: When::Always,
                ..Default::default()
            },
            move |_| {
                changed.replace(&snapshot("mod+shift+j", 2)).unwrap();
            },
        );
        let value = signal(String::new());
        view().child(
            input()
                .label("Ordinary text")
                .value(move || value.get())
                .on_change(move |text: &str| value.set(text.to_owned())),
        )
    }
    #[test]
    fn native_global_keys_follow_effective_rebinding_without_stealing_text_input_keys() {
        let observed = Observed(Arc::new(Mutex::new(Vec::new())));
        let mut config = EngineConfig::new(Root::of::<KeyboardProbe>());
        config.context = EngineContext::default().with(observed.clone());
        config.environment.os = nsh_core::platform::Os::MacOs;
        let mut app = Headless::start(config).unwrap();
        app.first_render().unwrap();
        app.press_key("meta+k").unwrap();
        app.press_key("t").unwrap();
        app.press_key("l").unwrap();
        let keys = observed
            .0
            .lock()
            .unwrap()
            .iter()
            .map(|value| value["key"].as_str().unwrap().to_owned())
            .collect::<Vec<_>>();
        assert_eq!(keys, ["k", "t", "l"]);
        app.press_key("f8").unwrap();
        app.press_key("meta+k").unwrap();
        assert_eq!(observed.0.lock().unwrap().len(), 3);
        app.press_key("meta+shift+j").unwrap();
        assert_eq!(observed.0.lock().unwrap()[3]["key"], json!("j"));
        app.type_text("label:Ordinary text", "").unwrap();
        app.press_key("t").unwrap();
        app.press_key("meta+z").unwrap();
        assert_eq!(observed.0.lock().unwrap().len(), 4);
        // A global non-editing sequence must not turn an input's normal t into
        // a document chord; native undo remains owned by the ordinary Input.
        assert!(
            app.screen()
                .input_text("label:Ordinary text")
                .unwrap()
                .is_some()
        );
    }
    fn selection_snapshot(selected: bool, palette: bool) -> String {
        json!({"revision":1,"palette":palette,"capture":false,
            "palette-copy-reference":false,"block-selection":selected,"bindings":[]})
        .to_string()
    }

    #[component]
    fn SelectionEscapeProbe() -> impl IntoElement {
        let observed = engine_context::<Observed>().unwrap();
        let keyboard = GlobalKeyboard::mount();
        let output = observed.0.clone();
        keyboard.send.set(Some(Rc::new(move |value| {
            output
                .lock()
                .unwrap()
                .push(json!({"owner":"bridge","event":value}));
        })));
        keyboard.replace(&selection_snapshot(false, false)).unwrap();
        let popup = signal(false);
        let form_value = signal(String::new());
        let editor_value = signal(String::new());
        let ready = signal(true);
        let composing = signal(false);
        let editor_ref = element_ref();
        let focus_ref = editor_ref;
        let blur_ref = editor_ref;
        let form_output = observed.0.clone();
        let editor_output = observed.0.clone();
        let popup_output = observed.0.clone();
        view()
            .flex_col()
            .w(px(400.0))
            .h(px(400.0))
            .child(
                nsh_base::button()
                    .on_press(move || {
                        keyboard.replace(&selection_snapshot(true, false)).unwrap();
                    })
                    .child(text("Select blocks")),
            )
            .child(
                nsh_base::button()
                    .on_press(move || {
                        keyboard.replace(&selection_snapshot(false, false)).unwrap();
                    })
                    .child(text("Clear selection")),
            )
            .child(
                nsh_base::button()
                    .on_press(move || {
                        keyboard.replace(&selection_snapshot(true, false)).unwrap();
                        popup.set(true);
                    })
                    .child(text("Open selection actions")),
            )
            .child(
                nsh_base::button()
                    .on_press(move || {
                        keyboard.replace(&selection_snapshot(true, true)).unwrap();
                    })
                    .child(text("Open palette")),
            )
            .child(
                nsh_core::element::input()
                    .label("Ordinary form text")
                    .value(move || form_value.get())
                    .on_change(move |value: &str| form_value.set(value.to_owned()))
                    .on_key_press(move |key: &str| {
                        form_output
                            .lock()
                            .unwrap()
                            .push(json!({"owner":"form","key":key}));
                    }),
            )
            .child(
                nsh_core::element::input()
                    .label("Block editor text")
                    .element_ref(&editor_ref)
                    .value(move || editor_value.get())
                    .on_change(move |value: &str| editor_value.set(value.to_owned()))
                    .on_focus(move || {
                        let node = u64::from(focus_ref.node().expect("mounted editor input"));
                        keyboard.focus_editor(node, 1, ready, composing, Rc::new(|| {}));
                    })
                    .on_blur(move || {
                        if let Some(node) = blur_ref.node() {
                            keyboard.blur_editor(u64::from(node), 1);
                        }
                    })
                    .on_key_press(move |key: &str| {
                        editor_output
                            .lock()
                            .unwrap()
                            .push(json!({"owner":"editor","key":key}));
                    }),
            )
            .child(when(popup, move || {
                let output = popup_output.clone();
                let outside = popup_output.clone();
                // Match LUI's actual Popover: both native dismissal paths
                // belong to this retained surface, not to the global keymap.
                overlay()
                    .on_press_outside(move |_: &nsh_core::geometry::Point<Points>| {
                        outside.lock().unwrap().push(json!({"owner":"outside"}));
                        popup.set(false);
                    })
                    .on_cancel(move || {
                        output.lock().unwrap().push(json!({"owner":"popover"}));
                        popup.set(false);
                    })
                    .child(text("Native selection actions"))
            }))
    }

    #[test]
    fn native_selection_escape_is_scoped_and_topmost_cancel_keeps_precedence() {
        let observed = Observed(Arc::new(Mutex::new(Vec::new())));
        let mut config = EngineConfig::new(Root::of::<SelectionEscapeProbe>());
        config.context = EngineContext::default().with(observed.clone());
        config.environment.os = nsh_core::platform::Os::MacOs;
        let mut app = Headless::start(config).unwrap();
        let batches = Arc::new(Mutex::new(Vec::<String>::new()));
        let trace = batches.clone();
        app.observe(move |step, batch| {
            let mut trace = trace.lock().unwrap();
            if trace.len() < 96 {
                for item in &batch.items {
                    if let nsh_core::MountItem::Keymap(keymap) = item {
                        trace.push(format!("{step}: keymap {:?}", keymap.bindings()));
                    }
                }
                let commands = batch
                    .items
                    .iter()
                    .filter_map(|item| match item {
                        nsh_core::MountItem::Command { command, .. } => {
                            Some(format!("{command:?}"))
                        }
                        _ => None,
                    })
                    .collect::<Vec<_>>();
                if !commands.is_empty() {
                    trace.push(format!("{step}: commands {commands:?}"));
                }
            }
        });
        app.wait_for("Select blocks").unwrap();
        app.press_key("escape").unwrap();
        assert!(
            observed.0.lock().unwrap().is_empty(),
            "no selection installs no Escape"
        );
        app.press("Select blocks").unwrap();
        app.press_key("escape").unwrap();
        assert_eq!(
            observed.0.lock().unwrap().as_slice(),
            [json!({"owner":"bridge","event":{
            "key":"Escape","ctrlKey":false,"metaKey":false,"shiftKey":false,
            "altKey":false,"isComposing":false,"repeat":false}})]
        );
        observed.0.lock().unwrap().clear();
        app.press("Open selection actions").unwrap();
        app.wait_for("Native selection actions").unwrap();
        app.press_key("escape").unwrap();
        app.wait_until(
            "topmost actions retired",
            std::time::Duration::from_secs(1),
            |screen| !screen.shows("Native selection actions"),
        )
        .unwrap();
        assert_eq!(
            observed.0.lock().unwrap().as_slice(),
            [json!({"owner":"popover"})],
            "one Escape cancels the popover without also clearing its selection"
        );
        app.press_key("escape").unwrap();
        let after_second_escape = observed.0.lock().unwrap().clone();
        assert_eq!(
            after_second_escape.len(),
            2,
            "next Escape reaches selection exactly once; batches={:?}; events={:?}",
            batches.lock().unwrap(),
            after_second_escape
        );
        assert_eq!(observed.0.lock().unwrap()[1]["owner"], json!("bridge"));
        app.press("Clear selection").unwrap();
        observed.0.lock().unwrap().clear();
        app.press_key("escape").unwrap();
        assert!(
            observed.0.lock().unwrap().is_empty(),
            "clearing selection removes its Escape"
        );
        app.press("Select blocks").unwrap();
        app.type_text("label:Ordinary form text", "kept").unwrap();
        observed.0.lock().unwrap().clear();
        app.press_key("escape").unwrap();
        assert!(
            observed.0.lock().unwrap().is_empty(),
            "a focused form's Escape must not reach the document bridge"
        );
        assert_eq!(
            app.screen().input_text("label:Ordinary form text").unwrap(),
            Some("kept")
        );
        observed.0.lock().unwrap().clear();
        app.press("Select blocks").unwrap();
        app.type_text("label:Block editor text", "draft").unwrap();
        observed.0.lock().unwrap().clear();
        app.press_key("escape").unwrap();
        assert!(
            observed.0.lock().unwrap().is_empty(),
            "a focused block editor's Escape must not reach a second bridge dispatcher"
        );
        assert_eq!(
            app.screen().input_text("label:Block editor text").unwrap(),
            Some("draft")
        );
        observed.0.lock().unwrap().clear();
        app.press("Open palette").unwrap();
        app.press_key("escape").unwrap();
        assert_eq!(
            observed.0.lock().unwrap().len(),
            1,
            "palette and selection deduplicate Escape"
        );
        assert_eq!(observed.0.lock().unwrap()[0]["owner"], json!("bridge"));
    }

    // These are the actual default catalog strokes and scopes, pinned by
    // the companion native OCaml assertion against Keymap_data itself.
    fn text_catalog_snapshot() -> String {
        json!({"revision":1,"palette":false,"capture":false,
            "palette-copy-reference":false,"block-selection":false,"bindings":[
                {"stroke":"t","command":"editor/toggle-number-list","scope":"global-prevent-default"},
                {"stroke":"n","command":"editor/toggle-number-list","scope":"global-prevent-default"},
                {"stroke":"p","command":"editor/add-property-deadline","scope":"global-non-editing-only"},
                {"stroke":"d","command":"editor/add-property-deadline","scope":"global-non-editing-only"},
                {"stroke":"mod+k","command":"go/search","scope":"global-prevent-default"},
                {"stroke":"alt+shift+g","command":"graph/open","scope":"editor-global"}
            ]}).to_string()
    }

    #[component]
    fn CatalogEditorProbe() -> impl IntoElement {
        let observed = engine_context::<Observed>().unwrap();
        let keyboard = GlobalKeyboard::mount();
        let output = observed.0.clone();
        keyboard.send.set(Some(Rc::new(move |value| {
            output.lock().unwrap().push(json!({"key":value}));
        })));
        keyboard.replace(&text_catalog_snapshot()).unwrap();
        let value = signal(String::new());
        let ready = signal(true);
        let composing = signal(false);
        let reference = element_ref();
        let changes = observed.0.clone();
        view().w(px(400.0)).h(px(100.0)).child(
            nsh_core::element::input()
                .test_id("native-catalog-editor")
                .element_ref(&reference)
                .value(move || value.get())
                .on_focus(move || {
                    let node = u64::from(reference.node().expect("mounted catalog editor"));
                    keyboard.focus_editor(node, 1, ready, composing, Rc::new(|| {}));
                })
                .on_blur(move || {
                    if let Some(node) = reference.node() {
                        keyboard.blur_editor(u64::from(node), 1);
                    }
                })
                .on_composition_change(move |event: &Composition| composing.set(event.composing))
                .on_change(move |text: &str| {
                    value.set(text.to_owned());
                    changes.lock().unwrap().push(json!({"input":text}));
                }),
        )
    }

    #[test]
    fn actual_catalog_prefixes_preserve_native_editor_text_and_event_order() {
        let observed = Observed(Arc::new(Mutex::new(Vec::new())));
        let mut config = EngineConfig::new(Root::of::<CatalogEditorProbe>());
        config.context = EngineContext::default().with(observed.clone());
        config.environment.os = nsh_core::platform::Os::MacOs;
        let mut app = Headless::start(config).unwrap();
        // Acquire the real native Input once. Every subsequent character goes
        // through the keyboard matcher without type_text reacquiring focus.
        app.type_text("id:native-catalog-editor", "").unwrap();
        observed.0.lock().unwrap().clear();
        for key in ["d", "r", "a", "f", "t", "n", "p", "你"] {
            app.press_key(key).unwrap();
        }
        assert_eq!(
            app.screen().input_text("id:native-catalog-editor").unwrap(),
            Some("draftnp你")
        );
        assert_eq!(
            observed.0.lock().unwrap().as_slice(),
            [
                json!({"input":"d"}),
                json!({"input":"dr"}),
                json!({"input":"dra"}),
                json!({"input":"draf"}),
                json!({"input":"draft"}),
                json!({"input":"draftn"}),
                json!({"input":"draftnp"}),
                json!({"input":"draftnp你"})
            ],
            "flattened command prefixes must not steal, duplicate or reorder native text"
        );
        app.compose("id:native-catalog-editor", "中文").unwrap();
        assert_eq!(
            app.screen().input_text("id:native-catalog-editor").unwrap(),
            Some("draftnp你中文")
        );
        observed.0.lock().unwrap().clear();
        app.press_key("meta+k").unwrap();
        let events = observed.0.lock().unwrap();
        assert_eq!(
            events.len(),
            1,
            "modified global commands still have one dispatcher"
        );
        assert_eq!(events[0]["key"]["key"], json!("k"));
        assert_eq!(events[0]["key"]["metaKey"], json!(true));
        drop(events);
        observed.0.lock().unwrap().clear();
        app.press_key("alt+shift+g").unwrap();
        let events = observed.0.lock().unwrap();
        assert_eq!(
            events.len(),
            1,
            "configured Option commands keep their existing ownership"
        );
        assert_eq!(events[0]["key"]["key"], json!("g"));
        assert_eq!(events[0]["key"]["altKey"], json!(true));
        assert_eq!(events[0]["key"]["shiftKey"], json!(true));
        assert_eq!(
            app.screen().input_text("id:native-catalog-editor").unwrap(),
            Some("draftnp你中文")
        );
    }

    #[test]
    fn native_key_scope_and_editor_fallback_ownership_keep_one_dispatcher() {
        let key = Keystroke {
            key: Key::Char('z'),
            modifiers: nsh_core::keymap::Modifiers {
                cmd: true,
                ..Default::default()
            },
        };
        assert!(editor_owns(key));
        assert!(!editor_owns(Keystroke {
            key: Key::Char('g'),
            ..key
        }));
        assert_eq!(key_name(Key::Left), "ArrowLeft");
    }
}
