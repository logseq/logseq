(* CodeMirror 5 bindings + lifecycle for code-fence blocks — port of
   frontend.extensions.code. A real CodeMirror mounts on the textarea
   inside each .code-editor (emitted by Render.code_block) via the shared
   extension adapter; instances are keyed by block uuid and released
   when their extension unmounts.

   Interop is OCaml-only: the vendored npm codemirror@5 package and all
   its mode/addon modules are pulled in through [@@mel.module] externals
   (js_app emits CommonJS; a prim-named `= "pkg" [@@mel.module]` external
   binds `require("pkg")` — the CodeMirror module object for the package's
   `module.exports = CodeMirror` main and a side-effect import for the
   modes/addons whose registration happens on require). *)

open Promise_ext
module D = Web_dom
module S = Editor_state
module A = Editor_actions
module Ops = Outliner_ops

(* Web CodeMirror owns its input callbacks directly. *)
let on_native_event _ ~name:_ ~value:_ ~key:_ = ()

type cm_module
type t

external raw_require : string -> Js.Json.t = "require"


(* codemirror.js and every mode/addon touch `document` at load time, so
   they must not require under the node test runner — the whole ui lib is
   linked into test_main. The core package and addons ship as ONE lazy
   chunk (shims/lazy_assets.mjs loadCmCore) fetched on first use; a
   literal require here would pull it back into main.js, so cm () is
   fail-fast and every call site sits behind ensure_core. *)
let cm_cache : cm_module option ref = ref None

let cm () : cm_module =
  match !cm_cache with
  | Some m -> m
  | None -> failwith "codemirror core not loaded"

(* -- lazy mode loading --

   shims/lazy_assets.mjs exposes one dynamic-import chunk per
   codemirror/mode/<name>/<name>.js — each mode module imports the same
   "codemirror" package the core chunk loads, so registration lands on
   the shared CodeMirror singleton. mode_loads dedups in-flight
   loads; a rejected load is uncached so the next mount retries, and the
   editor stays plain-text — same surface an unknown language already
   gets. *)

external shim_load_cm_mode :
  Js.Json.t -> string -> Js.Json.t Js.Promise.t = "loadCmMode"
  [@@mel.send]

let mode_loads : (string, unit Js.Promise.t) Hashtbl.t = Hashtbl.create 8

let ensure_mode file : unit Js.Promise.t =
  match Hashtbl.find_opt mode_loads file with
  | Some p -> p
  | None ->
      let p =
        shim_load_cm_mode (raw_require "lui-shims/lazy-assets") file
        |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ())
        |> Js.Promise.catch (fun e ->
               Hashtbl.remove mode_loads file;
               Ui_services.log_error
                 ("codemirror mode load failed", file, e);
               Js.Promise.resolve ())
      in
      Hashtbl.replace mode_loads file p;
      p


external from_textarea : cm_module -> D.el -> Js.Json.t -> t
  = "fromTextArea" [@@mel.send]

external get_value : t -> string = "getValue" [@@mel.send]
external set_value : t -> string -> unit = "setValue" [@@mel.send]
external to_textarea : t -> unit = "toTextArea" [@@mel.send]

external set_option : t -> string -> Js.Json.t -> unit = "setOption"
  [@@mel.send]
external get_option : t -> string -> Js.Json.t = "getOption" [@@mel.send]

(* CM event handlers are invoked as (cm, event) — a 1-arg OCaml fn
   ignores the extra argument *)
external on_event : t -> string -> (t -> unit) -> unit = "on"
  [@@mel.send]
external on_dom_event : t -> string -> (t -> D.ev -> unit) -> unit = "on"
  [@@mel.send]
external ignore_cm_event : D.ev -> bool -> unit = "codemirrorIgnore"
  [@@mel.set]
external event_composing : D.ev -> bool = "isComposing" [@@mel.get]
external remove_listener : D.el -> string -> (D.ev -> unit) -> bool -> unit
  = "removeEventListener" [@@mel.send]
external get_history : t -> Js.Json.t = "getHistory" [@@mel.send]
external set_history : t -> Js.Json.t -> unit = "setHistory" [@@mel.send]
external list_selections : t -> Js.Json.t = "listSelections" [@@mel.send]
external set_selections : t -> Js.Json.t -> unit = "setSelections" [@@mel.send]

external has_focus : t -> bool = "hasFocus" [@@mel.send]
external cm_focus : t -> unit = "focus" [@@mel.send]
external save : t -> unit = "save" [@@mel.send]
external refresh : t -> unit = "refresh" [@@mel.send]

external get_wrapper : t -> D.el = "getWrapperElement" [@@mel.send]

external get_input : t -> D.el = "getInputField" [@@mel.send]
external last_line : t -> int = "lastLine" [@@mel.send]
external get_line : t -> int -> string = "getLine" [@@mel.send]

external set_cursor : t -> Js.Json.t -> unit = "setCursor" [@@mel.send]
external pos : cm_module -> int -> int -> Js.Json.t = "Pos" [@@mel.send]

external get_cursor : t -> string -> Js.Json.t = "getCursor"
  [@@mel.send]

external find_mode_by_name : cm_module -> string -> Js.Json.t option
  = "findModeByName"
  [@@mel.send] [@@mel.return nullable]

external find_mode_by_ext : cm_module -> string -> Js.Json.t option
  = "findModeByExtension"
  [@@mel.send] [@@mel.return nullable]

external mode_infos : cm_module -> Js.Json.t array = "modeInfo"
  [@@mel.get]

external window_obj : Js.Json.t = "window"
  [@@mel.scope "globalThis"]

external shim_load_cm_core : Js.Json.t -> cm_module Js.Promise.t
  = "loadCmCore"
  [@@mel.send]

(* core + addons + mode/meta arrive as one lazy chunk on first use —
   mount/picker await it; window.CodeMirror lands with the module *)
let core_load =
  lazy
    (shim_load_cm_core (raw_require "lui-shims/lazy-assets")
     |> Js.Promise.then_ (fun m ->
            cm_cache := Some m;
            (* cljs exposes the module on window (extensions/dev helpers) *)
            Web_dom.js_set window_obj "CodeMirror" m;
            Js.Promise.resolve ()))

let ensure_core () : unit Js.Promise.t = Lazy.force core_load


(* -- json helpers -- *)

let json_field j key =
  match Js.Json.decodeObject j with
  | Some o -> Js.Dict.get o key
  | None -> None

let json_string j key = Option.bind (json_field j key) Js.Json.decodeString

let json_int j key =
  Option.map int_of_float
    (Option.bind (json_field j key) Js.Json.decodeNumber)

(* -- lang/mode resolution (cljs text->cm-mode + the src-cp alias map) -- *)

let normalize_lang = function
  | "edn" | "clj" | "cljc" | "cljs" | "clojurescript" -> "clojure"
  | l -> l

(* meta.js entry for a fence language (name first, then extension) *)
let mode_info lang =
  match find_mode_by_name (cm ()) lang with
  | Some _ as m -> m
  | None -> find_mode_by_ext (cm ()) lang

(* the CM `mode:` option for a language — its declared mime, or the raw
   language string when meta.js has no entry *)
let cm_mode lang =
  match mode_info lang with
  | Some info -> Option.value (json_string info "mime") ~default:lang
  | None -> lang

(* mode file stem (mode/<stem>/<stem>.js) for a language, or None for
   unknown languages and the "null" mode *)
let mode_file lang =
  match mode_info lang with
  | Some info -> (
      match json_string info "mode" with
      | Some "null" | None -> None
      | file -> file)
  | None -> None

let lisp_like mode = List.mem mode [ "scheme"; "lisp"; "clojure"; "edn" ]

(* theme ("solarized <light|dark>") follows the root .dark class the same
   way cljs theme-name does via the ui/theme subscription *)
let theme_name () =
  if D.el_class_contains D.document_element "dark" then "solarized dark"
  else "solarized light"

(* -- instances keyed by block uuid -- *)

type composition =
  { history : Js.Json.t
  ; selections : Js.Json.t
  ; mutable cancelled : bool
  }

type block_instance =
  { cm : t
  ; mutable committed : string
  ; mutable composition : composition option
  ; mutable composition_live : bool
  ; mutable synchronizing : bool
  ; mutable listeners : (D.el * string * (D.ev -> unit) * bool) list
  }

let instances : (string, block_instance) Hashtbl.t = Hashtbl.create 8

let file_instance : block_instance option ref = ref None

let composition_sources : (unit -> bool) list ref = ref []

let register_composition_source source =
  composition_sources := source :: !composition_sources;
  fun () ->
    composition_sources :=
      List.filter (fun current -> current != source) !composition_sources

let focused_client el =
  D.el_is_connected el
  && (match D.active_element () with Some active -> active == el | None -> false)

let composition_active (ev : Ui_services.ev) =
  ev.composing
  || Hashtbl.fold
       (fun _ st active ->
         active || (st.composition_live
                    && D.el_is_connected (get_wrapper st.cm)
                    && focused_client (get_input st.cm)))
       instances false
  || (match !file_instance with
      | Some st -> st.composition_live
                   && D.el_is_connected (get_wrapper st.cm)
                   && focused_client (get_input st.cm)
      | None -> false)
  || List.exists (fun source -> source ()) !composition_sources

let with_model_update st f =
  let previous = st.synchronizing in
  st.synchronizing <- true;
  Fun.protect ~finally:(fun () -> st.synchronizing <- previous) f

let cancel_composition st =
  match st.composition with
  | None -> ()
  | Some pending ->
      pending.cancelled <- true;
      with_model_update st (fun () ->
          if get_value st.cm <> st.committed then
            set_value st.cm st.committed;
          set_history st.cm pending.history;
          set_selections st.cm pending.selections)

let release_instance uuid =
  match Hashtbl.find_opt instances uuid with
  | None -> ()
  | Some st ->
      Hashtbl.remove instances uuid;
      List.iter
        (fun (el, name, f, capture) -> remove_listener el name f capture)
        st.listeners;
      st.listeners <- [];
      cancel_composition st;
      to_textarea st.cm

let block_instance uuid =
  match Hashtbl.find_opt instances uuid with
  | Some st when D.el_is_connected (get_wrapper st.cm) -> Some st
  | Some _ ->
      release_instance uuid;
      None
  | None -> None

let current_instance uuid c =
  match block_instance uuid with
  | Some st when st.cm == c -> Some st
  | _ -> None

let instance uuid =
  Option.map (fun st -> st.cm) (block_instance uuid)

(* Exit paths must not read CM5's mutable, possibly marked document. *)
let live_value uuid =
  Option.map (fun st -> st.committed) (block_instance uuid)

(* caret = char offset over the whole doc -> {line, ch} *)
let pos_of_offset c off =
  let last = last_line c in
  let rec go line off =
    let len = String.length (get_line c line) in
    if off <= len then (line, off)
    else if line >= last then (last, len)
    else go (line + 1) (off - len - 1)
  in
  go 0 (max 0 off)

(* installed as the code-block focus provider: focus() then place the
   cursor; a click that already focused the editor keeps the native
   cursor position *)
let focus_block ~caret uuid =
  match instance uuid with
  | Some c ->
      if has_focus c then true
      else begin
        cm_focus c;
        if has_focus c then begin
          let line, ch = pos_of_offset c caret in
          set_cursor c (pos (cm ()) line ch);
          true
        end
        else false
      end
  | None -> false

(* -- editor event handlers -- *)

(* Esc (cljs extraKeys "Esc" -> save-editor!): persist + leave edit mode
   and select the block. cljs additionally re-enters raw-mode editing;
   the OCaml surface has no raw mode for code blocks, so Esc exits. *)
let on_escape uuid =
  match block_instance uuid with
  | Some st when st.composition = None ->
      A.sync_buffer uuid st.committed;
      A.exit_edit ~select:true
  | _ -> ()

(* Shift-Enter (cljs wrapper keydown): save + insert a sibling block *)
let on_shift_enter uuid =
  match block_instance uuid with
  | Some st when st.composition = None -> A.insert_sibling_after uuid
  | _ -> ()

let update_calc c =
  match D.el_closest (get_wrapper c) ".extensions__code" with
  | Some wrap -> (
      match D.el_query wrap ".extensions__code-calc" with
      | Some res ->
          D.el_replace_children res;
          List.iter
            (fun line ->
              D.el_append_child res
                (D.h ~cls:"extensions__code-calc-output-line" ~text:line
                   ()))
            (Render_calc.results (get_value c))
      | None -> ())
  | None -> ()

(* mirror cljs save-code-editor!: the doc value flows into the block
   buffer + the debounced worker save; calc results recompute live *)
let on_change uuid c =
  match current_instance uuid c with
  | Some st when not st.synchronizing && st.composition = None ->
      let v = get_value c in
      if v <> st.committed then begin
        st.committed <- v;
        A.sync_buffer uuid v;
        Ops.schedule_save uuid v;
        update_calc c
      end
  | _ -> ()

(* cljs blur: save + drop the edit state (skipped after Esc — the escape
   path already committed) *)
let on_cm_blur uuid c =
  match current_instance uuid c with
  | None -> ()
  | Some st ->
      st.composition_live <- false;
      cancel_composition st;
      (match S.editing () with
       | Some e when e.S.uuid = uuid -> A.blur_commit ()
       | _ -> ())

(* cljs focus: edit-block! runs whenever the focused CM is not the
   current edit block — so clicking a code block enters edit state even
   when nothing was editing; the click-placed caret is kept since CM is
   already focused (focus_block short-circuits) *)
let on_cm_focus uuid =
  match S.editing () with
  | Some e when e.S.uuid = uuid -> ()
  | _ -> A.enter_edit uuid (String.length (A.model_title uuid))

let composing_key st ev =
  st.composition <> None || event_composing ev || D.ev_key_code ev = 229

let on_cm_keydown uuid c ev =
  match current_instance uuid c with
  | Some st when composing_key st ev ->
      ignore_cm_event ev true;
      D.ev_stop_propagation ev
  | None ->
      ignore_cm_event ev true;
      D.ev_stop_propagation ev
  | _ -> ()

external ev_code : D.ev -> string = "code" [@@mel.get]

let cursor_start c =
  let j = get_cursor c "start" in
  match (json_int j "line", json_int j "ch") with
  | Some l, Some ch -> Some (l, ch)
  | _ -> None

let at_start c = cursor_start c = Some (0, 0)

let at_end c =
  match cursor_start c with
  | Some (l, ch) ->
      l = last_line c && ch = String.length (get_line c l)
  | None -> false

(* wrapper keydown (cljs element listener): arrows that hit a document
   boundary move to the neighbor block; Cmd/Ctrl+[ and Cmd/Ctrl+] are
   swallowed so they don't trigger browser history navigation *)
let wrapper_keydown uuid c ev =
  match current_instance uuid c with
  | None -> D.ev_stop_propagation ev
  | Some st when composing_key st ev -> D.ev_stop_propagation ev
  | Some _ -> (
      let key = D.ev_key ev in
      match (key, D.ev_ctrl ev || D.ev_meta ev, D.ev_shift ev) with
      | _, true, _ -> (
          match ev_code ev with
          | "BracketLeft" | "BracketRight" ->
              D.ev_stop_propagation ev;
              D.ev_prevent_default ev
          | _ -> ())
      | "ArrowLeft", false, false -> if at_start c then A.arrow_nav uuid true
      | "ArrowRight", false, false ->
          if at_end c then A.arrow_nav uuid false
      | "ArrowUp", false, false -> if at_start c then A.arrow_nav uuid true
      | "ArrowDown", false, false -> if at_end c then A.arrow_nav uuid false
      | _ -> ())

(* cljs pointerdown on the wrapper: stop propagation + clear the
   block-range selection *)
let wrapper_pointerdown _uuid ev =
  D.ev_stop_propagation ev;
  if S.selection_active () then
    S.set (fun st ->
        { st with
          S.selected = S.String_set.empty
        ; action_bar = false
        })

(* -- mount -- *)

let make_options ~uuid ~lang ~mode ~read_only =
  let extra_keys =
    Js.Dict.fromList
      [ ("Esc", fun c ->
            if current_instance uuid c <> None then on_escape uuid)
      ; ("Shift-Enter", fun c ->
            if current_instance uuid c <> None then on_shift_enter uuid)
      ]
  in
  let opts =
    Js.Dict.fromList
      [ ("theme", Js.Json.string (theme_name ()))
      ; ("autoCloseBrackets", Js.Json.boolean true)
      ; ("lineNumbers", Js.Json.boolean true)
      ; ("matchBrackets", Js.Json.boolean (lisp_like mode))
      ; ("styleActiveLine", Js.Json.boolean true)
      ; ("mode", Js.Json.string mode)
      ; (* do not accept TAB-in, since TAB is bound globally (cljs) *)
        ("tabIndex", Js.Json.number (-1.))
      ]
  in
  (* extraKeys values are cm callbacks, not json — set via js_set *)
  Web_dom.js_set (Js.Json.object_ opts) "extraKeys" extra_keys;
  if read_only then Js.Dict.set opts "readOnly" (Js.Json.boolean true);
  if lang = "calc" then
    (* cljs: calc editors expand to the whole buffer *)
    Js.Dict.set opts "viewportMargin" (Js.Json.number Float.infinity);
  Js.Json.object_ opts

let mount ?(read_only = false) uuid textarea =
  let lang =
    normalize_lang
      (Option.value (D.el_get_attr textarea "data-lang") ~default:"")
  in
  let mode = cm_mode lang in
  let c =
    from_textarea (cm ()) textarea
      (make_options ~uuid ~lang ~mode ~read_only)
  in
  release_instance uuid;
  let st =
    { cm = c; committed = get_value c; composition = None
    ; composition_live = false
    ; synchronizing = false; listeners = [] }
  in
  Hashtbl.replace instances uuid st;
  on_event c "change" (fun c -> on_change uuid c);
  on_event c "blur" (on_cm_blur uuid);
  on_event c "focus" (fun c ->
      if current_instance uuid c <> None then on_cm_focus uuid);
  on_dom_event c "keydown" (on_cm_keydown uuid);
  let listen el name capture f =
    D.el_listen el name f capture;
    st.listeners <- (el, name, f, capture) :: st.listeners
  in
  listen (get_input c) "compositionstart" true (fun _ ->
      if current_instance uuid c <> None then begin
        cancel_composition st;
        st.composition_live <- true;
        st.composition <- Some
          { history = get_history c; selections = list_selections c
          ; cancelled = false }
      end);
  (* CM5's textarea listener polls synchronously before this listener. *)
  listen (get_input c) "compositionend" false (fun _ ->
      match current_instance uuid c, st.composition with
      | Some _, Some pending ->
          if pending.cancelled then cancel_composition st;
          st.composition_live <- false;
          st.composition <- None;
          if not pending.cancelled then on_change uuid c
      | _ -> ());
  listen (get_wrapper c) "keydown" false (wrapper_keydown uuid c);
  listen (get_wrapper c) "pointerdown" false (fun ev ->
      if current_instance uuid c <> None then wrapper_pointerdown uuid ev);
  (* cljs .save()/.refresh() right after mount: textarea value -> doc
     state, then a layout pass while the container is on screen *)
  save c;
  refresh c;
  (* modes ship as lazy chunks — the editor paints plain-text first and
     gets its real mode once the chunk registers it. Skip the swap if
     this instance was unmounted meanwhile (stale uuid -> fresh editor) *)
  match mode_file lang with
  | Some file ->
      ignore
        (ensure_mode file
         |> Js.Promise.then_ (fun () ->
                (match instance uuid with
                 | Some c' when c' == c && Js.Json.decodeString (get_option c "mode") = Some mode ->
                     set_option c "mode" (Js.Json.string mode)
                 | _ -> ());
                Js.Promise.resolve ()))
  | None -> ()

(* live read-only toggle for the extension's read-only prop *)
let set_read_only uuid flag =
  match block_instance uuid with
  | Some st ->
      if flag then cancel_composition st;
      set_option st.cm "readOnly" (Js.Json.boolean flag)
  | None -> ()

let set_controlled_value uuid value =
  match block_instance uuid with
  | Some st when st.committed <> value
              || (st.composition = None && get_value st.cm <> value) ->
      cancel_composition st;
      st.committed <- value;
      with_model_update st (fun () -> set_value st.cm value);
      (match st.composition with
       | Some _ ->
           st.composition <- Some
             { history = get_history st.cm; selections = list_selections st.cm
             ; cancelled = true }
       | None -> ());
      update_calc st.cm
  | _ -> ()

let set_language uuid lang =
  let lang = normalize_lang lang in
  match instance uuid with
  | None -> ()
  | Some c ->
      let mode = cm_mode lang in
      set_option c "mode" (Js.Json.string mode);
      set_option c "matchBrackets" (Js.Json.boolean (lisp_like mode));
      (match mode_file lang with
       | None -> ()
       | Some file ->
           ignore
             (ensure_mode file
              |> Js.Promise.then_ (fun () ->
                     (match instance uuid with
                      | Some current when current == c && Js.Json.decodeString (get_option c "mode") = Some mode ->
                          set_option c "mode" (Js.Json.string mode)
                      | _ -> ());
                     Js.Promise.resolve ())))

(* cljs sync-editor-code!: a title written by another path (undo, db
   refresh, /code conversion) is pushed into an unfocused editor *)
let sync_titles (_st : S.t) =
  Hashtbl.iter
    (fun uuid _c ->
      match (instance uuid, S.find uuid) with
      | Some c, Some b ->
          let code = b.Model.block_title in
          if (not (has_focus c)) && get_value c <> code then
            set_controlled_value uuid code
      | _ -> ())
    instances

let watch : unit Signal.signal option ref = ref None

(* S.state throws until the first block row mounts the editor state —
   subscribe lazily from the explicit mount instead of at install *)
let ensure_watch () =
  match !watch with
  | Some _ -> ()
  | None ->
      if S.ready () then
        watch := Some (Signal.map sync_titles (S.signal ()))

(* Lazy mounts are deduplicated until the core chunk arrives. *)
let pending_mounts : (string, D.el) Hashtbl.t = Hashtbl.create 4

let mount_async uuid el =
  ensure_watch ();
  if instance uuid = None && not (Hashtbl.mem pending_mounts uuid) then begin
    Hashtbl.replace pending_mounts uuid el;
    ignore
      (ensure_core ()
       |> Js.Promise.then_ (fun () ->
              (match Hashtbl.find_opt pending_mounts uuid with
               | Some pending when pending == el ->
                   Hashtbl.remove pending_mounts uuid;
                   if instance uuid = None && D.el_is_connected el then
                     mount
                       ~read_only:(D.el_get_attr el "readonly" <> None)
                       uuid el
               | _ -> ());
              Js.Promise.resolve ()))
  end

(* The adapter releases its block-role instance on node removal. *)
let unmount uuid =
  Hashtbl.remove pending_mounts uuid;
  release_instance uuid

(* -- language picker (.code-block-actions .select-language) -- *)
(* cljs shows the picker as a menu anchored under the button —
   Views_popup.show_menu owns placement, keyboard nav and dismissal. *)

let pick_lang uuid lang =
  ignore
    (let* () = ensure_core () in
     (match (instance uuid, mode_file lang) with
      | Some c, Some file ->
          (* fetch the mode chunk first, then swap — same post-load path
             as mount *)
          ignore
            (ensure_mode file
             |> Js.Promise.then_ (fun () ->
                    (match instance uuid with
                     | Some c' when c' == c ->
                         set_option c "mode" (Js.Json.string file)
                     | _ -> ());
                    Js.Promise.resolve ()))
      | _ -> ());
     ignore
       (Ops.apply_and_refresh
          [ Ops.set_block_property uuid "logseq.property.code/lang"
              (Wire.String lang) ]);
     Js.Promise.resolve ())

let open_lang_picker uuid =
  ignore
    (let* () = ensure_core () in
     (match
        Ui_services.dom_query
          ("#ls-block-" ^ uuid ^ " .select-language")
      with
      | Some button ->
          Views_popup.show_menu ~anchor:button
            ~cls_prefix:"ls-code-lang-picker "
            (List.filter_map
               (fun info ->
                 match json_string info "name" with
                 | Some name ->
                     Some
                       (Views_popup.MItem
                          (name, fun () -> pick_lang uuid name))
                 | None -> None)
               (Array.to_list (mode_infos (cm ()))))
      | None -> ());
     Js.Promise.resolve ())

(* .code-block-actions copy button (cljs copy-code!: clipboard +
   "Copied!" notification) *)
let copy_button uuid =
  match instance uuid with
  | Some c ->
      ignore
        (Ui_task.bind (Ui_services.clipboard_write_text (get_value c)) (fun () ->
         Runtime.send
           (Action.Toast_push
              { Model.toast_id = 0
              ; toast_key = None
              ; toast_text = I18n.t "notification/copied"
              ; toast_kind = "success"
              });
         Ui_task.resolve ()))
  | None -> ()

(* File editors share committed-document semantics with code blocks,
   but publish through the file controller rather than block saves. *)

let current_file_instance c =
  match !file_instance with
  | Some st when st.cm == c && D.el_is_connected (get_wrapper c) -> Some st
  | _ -> None

let unmount_file () =
  match !file_instance with
  | Some st ->
      file_instance := None;
      List.iter
        (fun (el, name, f, capture) -> remove_listener el name f capture)
        st.listeners;
      st.listeners <- [];
      cancel_composition st;
      to_textarea st.cm
  | None -> ()

let mount_file ~on_change textarea =
  (* a previous file editor's wrapper is inert once its route unmounted —
     but release the doc before rebinding so it can't double-save *)
  unmount_file ();
  let lang =
    normalize_lang
      (Option.value (D.el_get_attr textarea "data-lang") ~default:"")
  in
  let mode = cm_mode lang in
  let publish c =
    match current_file_instance c with
    | Some st when not st.synchronizing && st.composition = None ->
        let value = get_value c in
        if value <> st.committed then begin
          st.committed <- value;
          on_change value
        end
    | _ -> ()
  in
  let extra_keys =
    Js.Dict.fromList [ ("Esc", publish) ]
  in
  let opts =
    Js.Dict.fromList
      [ ("theme", Js.Json.string (theme_name ()))
      ; ("autoCloseBrackets", Js.Json.boolean true)
      ; ("lineNumbers", Js.Json.boolean true)
      ; ("matchBrackets", Js.Json.boolean (lisp_like mode))
      ; ("styleActiveLine", Js.Json.boolean true)
      ; ("mode", Js.Json.string mode)
      ; ("tabIndex", Js.Json.number (-1.)) ]
  in
  let opts_json = Js.Json.object_ opts in
  (* extraKeys values are cm callbacks, not json — set via js_set *)
  Web_dom.js_set opts_json "extraKeys" extra_keys;
  let c = from_textarea (cm ()) textarea opts_json in
  let st =
    { cm = c; committed = get_value c; composition = None
    ; composition_live = false; synchronizing = false; listeners = [] }
  in
  file_instance := Some st;
  on_event c "change" publish;
  on_event c "blur" (fun c ->
      match current_file_instance c with
      | Some st ->
          st.composition_live <- false;
          cancel_composition st;
          publish c
      | None -> ());
  on_dom_event c "keydown" (fun c ev ->
      match current_file_instance c with
      | Some st when composing_key st ev ->
          ignore_cm_event ev true;
          D.ev_stop_propagation ev
      | None ->
          ignore_cm_event ev true;
          D.ev_stop_propagation ev
      | _ -> ());
  let listen name capture f =
    let input = get_input c in
    D.el_listen input name f capture;
    st.listeners <- (input, name, f, capture) :: st.listeners
  in
  listen "compositionstart" true (fun _ ->
      if current_file_instance c <> None then begin
        cancel_composition st;
        st.composition_live <- true;
        st.composition <- Some
          { history = get_history c; selections = list_selections c
          ; cancelled = false }
      end);
  listen "compositionend" false (fun _ ->
      match current_file_instance c, st.composition with
      | Some _, Some pending ->
          if pending.cancelled then cancel_composition st;
          st.composition_live <- false;
          st.composition <- None;
          if not pending.cancelled then publish c
      | _ -> ());
  save c;
  refresh c;
  match mode_file lang with
  | Some file ->
      ignore
        (ensure_mode file
         |> Js.Promise.then_ (fun () ->
                (match current_file_instance c with
                 | Some _ ->
                     set_option c "mode" (Js.Json.string mode)
                 | _ -> ());
                Js.Promise.resolve ()))
  | None -> ()

let mount_file_async ~on_change el =
  ignore
    (ensure_core ()
     |> Js.Promise.then_ (fun () ->
            if D.el_is_connected el then mount_file ~on_change el;
            Js.Promise.resolve ()))

(* file_view calls this after the flush that mounts its textarea;
   native has no CodeMirror so its twin is a no-op *)
let attach_file_editor ~on_change () =
  match
    D.el_query D.document_el ".ls-file-page .code-editor textarea"
  with
  | Some el -> mount_file_async ~on_change el
  | None -> ()

let installed = ref false

let install () =
  if not !installed then begin
    installed := true;
    (* hooks for editor_actions without a module cycle *)
    S.code_buffer_of := live_value;
    S.code_focus := focus_block;
    ()
  end
