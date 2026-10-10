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

external set_option : t -> string -> Js.Json.t -> unit = "setOption"
  [@@mel.send]

(* CM event handlers are invoked as (cm, event) — a 1-arg OCaml fn
   ignores the extra argument *)
external on_event : t -> string -> (t -> unit) -> unit = "on"
  [@@mel.send]

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

let instances : (string, t) Hashtbl.t = Hashtbl.create 8

let instance uuid =
  match Hashtbl.find_opt instances uuid with
  | Some c when D.el_is_connected (get_wrapper c) -> Some c
  | Some _ ->
      Hashtbl.remove instances uuid;
      None
  | None -> None

(* the CodeMirror doc value for a block — installed as the live_buffer
   provider so blur/exit commits read the CM surface, not the hidden
   textarea *)
let live_value uuid =
  match instance uuid with Some c -> Some (get_value c) | None -> None

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
  (match instance uuid with
   | Some c -> A.sync_buffer uuid (get_value c)
   | None -> ());
  A.exit_edit ~select:true

(* Shift-Enter (cljs wrapper keydown): save + insert a sibling block *)
let on_shift_enter uuid = A.insert_sibling_after uuid

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
  let v = get_value c in
  A.sync_buffer uuid v;
  Ops.schedule_save uuid v;
  update_calc c

(* cljs blur: save + drop the edit state (skipped after Esc — the escape
   path already committed) *)
let on_cm_blur uuid =
  match S.editing () with
  | Some e when e.S.uuid = uuid -> A.blur_commit ()
  | _ -> ()

(* cljs focus: edit-block! runs whenever the focused CM is not the
   current edit block — so clicking a code block enters edit state even
   when nothing was editing; the click-placed caret is kept since CM is
   already focused (focus_block short-circuits) *)
let on_cm_focus uuid =
  match S.editing () with
  | Some e when e.S.uuid = uuid -> ()
  | _ -> A.enter_edit uuid (String.length (A.model_title uuid))

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
  let key = D.ev_key ev in
  match
    (key, D.ev_ctrl ev || D.ev_meta ev, D.ev_shift ev)
  with
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
  | _ -> ()

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
      [ ("Esc", fun _ -> on_escape uuid)
      ; ("Shift-Enter", fun _ -> on_shift_enter uuid)
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
  Hashtbl.replace instances uuid c;
  on_event c "change" (fun c -> on_change uuid c);
  on_event c "blur" (fun _ -> on_cm_blur uuid);
  on_event c "focus" (fun _ -> on_cm_focus uuid);
  D.el_on (get_wrapper c) "keydown" (wrapper_keydown uuid c);
  D.el_on (get_wrapper c) "pointerdown" (wrapper_pointerdown uuid);
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
                 | Some c' when c' == c ->
                     set_option c "mode" (Js.Json.string mode)
                 | _ -> ());
                Js.Promise.resolve ()))
  | None -> ()

(* live read-only toggle for the extension's read-only prop *)
let set_read_only uuid flag =
  match instance uuid with
  | Some c -> set_option c "readOnly" (Js.Json.boolean flag)
  | None -> ()

(* cljs sync-editor-code!: a title written by another path (undo, db
   refresh, /code conversion) is pushed into an unfocused editor *)
let sync_titles (_st : S.t) =
  Hashtbl.iter
    (fun uuid _c ->
      match (instance uuid, S.find uuid) with
      | Some c, Some b ->
          let code = b.Model.block_title in
          if (not (has_focus c)) && get_value c <> code then
            set_value c code
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
let pending_mounts : (string, unit) Hashtbl.t = Hashtbl.create 4

let mount_async ?(read_only = false) uuid el =
  ensure_watch ();
  if instance uuid = None && not (Hashtbl.mem pending_mounts uuid) then begin
    Hashtbl.replace pending_mounts uuid ();
    ignore
      (ensure_core ()
       |> Js.Promise.then_ (fun () ->
              Hashtbl.remove pending_mounts uuid;
              if instance uuid = None && D.el_is_connected el then
                mount ~read_only uuid el;
              Js.Promise.resolve ()))
  end

(* The adapter releases its block-role instance on node removal. *)
let unmount uuid =
  Hashtbl.remove pending_mounts uuid;
  Hashtbl.remove instances uuid

(* -- language picker (.code-block-actions .select-language) -- *)
let picker : D.el option ref = ref None

let close_picker () =
  match !picker with
  | Some el ->
      D.el_remove el;
      picker := None
  | None -> ()

let pick_lang uuid lang =
  close_picker ();
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
  match !picker with
  | Some _ -> close_picker ()
  | None ->
      ignore
        (let* () = ensure_core () in
         (match
            ( D.query_selector ".cp__overlays"
            , D.query_selector
                ("#ls-block-" ^ uuid ^ " .select-language") )
          with
          | Some host, Some button ->
          let r = D.el_bounding_rect button in
          let menu =
            D.h ~cls:"ls-code-lang-picker" ~attrs:[ ("role", "menu") ] ()
          in
          D.el_set_attr menu "style"
            (Printf.sprintf "position:fixed;left:%.0fpx;top:%.0fpx;z-index:var(--ls-z-index-level-1)"
               (D.rect_left r) (D.rect_bottom r +. 4.));
              Array.iter
                (fun info ->
                  match json_string info "name" with
                  | Some name ->
                      let row =
                        D.h ~cls:Menu_item.base_cls
                          ~attrs:Menu_item.item_attrs ~text:name
                          ~on_click:(fun _ -> pick_lang uuid name)
                          ()
                      in
                      D.el_append_child menu row
                  | None -> ())
                (mode_infos (cm ()));
              D.el_append_child host menu;
              picker := Some menu
          | _ -> ());
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

let installed = ref false

let install () =
  if not !installed then begin
    installed := true;
    (* hooks for editor_actions without a module cycle *)
    S.code_buffer_of := live_value;
    S.code_focus := focus_block;
    D.add_document_listener "mousedown"
      (fun ev ->
        match
          ( !picker
          , D.closest_sel ".ls-code-lang-picker, .code-block-actions"
              (D.ev_target ev) )
        with
        | Some _, None -> close_picker ()
        | _ -> ())
      true
  end
