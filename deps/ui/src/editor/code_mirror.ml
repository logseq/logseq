(* CodeMirror 5 bindings + lifecycle for code-fence blocks — port of
   frontend.extensions.code. A real CodeMirror mounts on the textarea
   inside each .code-editor (emitted by Render.code_block) via the shared
   document mutation scan; instances are keyed by block uuid and pruned
   when their wrapper leaves the DOM.

   Interop is OCaml-only: the vendored npm codemirror@5 package and all
   its mode/addon modules are pulled in through [@@mel.module] externals
   (js_app emits CommonJS; a prim-named `= "pkg" [@@mel.module]` external
   binds `require("pkg")` — the CodeMirror module object for the package's
   `module.exports = CodeMirror` main and a side-effect import for the
   modes/addons whose registration happens on require). *)

open Promise_ext
module D = Editor_dom
module V = Views_dom
module S = Editor_state
module A = Editor_actions
module Ops = Outliner_ops

type cm_module
type t

external raw_require : string -> Js.Json.t = "require"

external cm_module_of_json : Js.Json.t -> cm_module = "%identity"

(* codemirror.js and every mode/addon touch `document` at load time, so
   they must not require under the node test runner — the whole ui lib is
   linked into test_main. Requires stay literal so the bundler can still
   resolve them statically; they only execute once install/mount runs in
   the browser. *)
let cm_cache : cm_module option ref = ref None

let cm () : cm_module =
  match !cm_cache with
  | Some m -> m
  | None ->
      let m = cm_module_of_json (raw_require "codemirror") in
      cm_cache := Some m;
      m

let modes_loaded = ref false

let load_modes () =
  if not !modes_loaded then begin
    modes_loaded := true;
    ignore (raw_require "codemirror");
    ignore (raw_require "codemirror/addon/edit/closebrackets");
    ignore (raw_require "codemirror/addon/edit/matchbrackets");
    ignore (raw_require "codemirror/addon/hint/show-hint");
    ignore (raw_require "codemirror/addon/selection/active-line");
    ignore (raw_require "codemirror/mode/meta");
    ignore (raw_require "codemirror/mode/apl/apl");
    ignore (raw_require "codemirror/mode/asciiarmor/asciiarmor");
    ignore (raw_require "codemirror/mode/asn.1/asn.1");
    ignore (raw_require "codemirror/mode/asterisk/asterisk");
    ignore (raw_require "codemirror/mode/brainfuck/brainfuck");
    ignore (raw_require "codemirror/mode/clike/clike");
    ignore (raw_require "codemirror/mode/clojure/clojure");
    ignore (raw_require "codemirror/mode/cmake/cmake");
    ignore (raw_require "codemirror/mode/cobol/cobol");
    ignore (raw_require "codemirror/mode/coffeescript/coffeescript");
    ignore (raw_require "codemirror/mode/commonlisp/commonlisp");
    ignore (raw_require "codemirror/mode/crystal/crystal");
    ignore (raw_require "codemirror/mode/css/css");
    ignore (raw_require "codemirror/mode/cypher/cypher");
    ignore (raw_require "codemirror/mode/d/d");
    ignore (raw_require "codemirror/mode/dart/dart");
    ignore (raw_require "codemirror/mode/diff/diff");
    ignore (raw_require "codemirror/mode/django/django");
    ignore (raw_require "codemirror/mode/dockerfile/dockerfile");
    ignore (raw_require "codemirror/mode/dtd/dtd");
    ignore (raw_require "codemirror/mode/dylan/dylan");
    ignore (raw_require "codemirror/mode/ebnf/ebnf");
    ignore (raw_require "codemirror/mode/ecl/ecl");
    ignore (raw_require "codemirror/mode/eiffel/eiffel");
    ignore (raw_require "codemirror/mode/elm/elm");
    ignore (raw_require "codemirror/mode/erlang/erlang");
    ignore (raw_require "codemirror/mode/factor/factor");
    ignore (raw_require "codemirror/mode/fcl/fcl");
    ignore (raw_require "codemirror/mode/forth/forth");
    ignore (raw_require "codemirror/mode/fortran/fortran");
    ignore (raw_require "codemirror/mode/gas/gas");
    ignore (raw_require "codemirror/mode/gfm/gfm");
    ignore (raw_require "codemirror/mode/gherkin/gherkin");
    ignore (raw_require "codemirror/mode/go/go");
    ignore (raw_require "codemirror/mode/groovy/groovy");
    ignore (raw_require "codemirror/mode/haml/haml");
    ignore (raw_require "codemirror/mode/handlebars/handlebars");
    ignore (raw_require "codemirror/mode/haskell/haskell");
    ignore (raw_require "codemirror/mode/haskell-literate/haskell-literate");
    ignore (raw_require "codemirror/mode/haxe/haxe");
    ignore (raw_require "codemirror/mode/htmlembedded/htmlembedded");
    ignore (raw_require "codemirror/mode/htmlmixed/htmlmixed");
    ignore (raw_require "codemirror/mode/http/http");
    ignore (raw_require "codemirror/mode/idl/idl");
    ignore (raw_require "codemirror/mode/javascript/javascript");
    ignore (raw_require "codemirror/mode/jinja2/jinja2");
    ignore (raw_require "codemirror/mode/jsx/jsx");
    ignore (raw_require "codemirror/mode/julia/julia");
    ignore (raw_require "codemirror/mode/livescript/livescript");
    ignore (raw_require "codemirror/mode/lua/lua");
    ignore (raw_require "codemirror/mode/markdown/markdown");
    ignore (raw_require "codemirror/mode/mathematica/mathematica");
    ignore (raw_require "codemirror/mode/mbox/mbox");
    ignore (raw_require "codemirror/mode/mirc/mirc");
    ignore (raw_require "codemirror/mode/mllike/mllike");
    ignore (raw_require "codemirror/mode/modelica/modelica");
    ignore (raw_require "codemirror/mode/mscgen/mscgen");
    ignore (raw_require "codemirror/mode/mumps/mumps");
    ignore (raw_require "codemirror/mode/nginx/nginx");
    ignore (raw_require "codemirror/mode/nsis/nsis");
    ignore (raw_require "codemirror/mode/ntriples/ntriples");
    ignore (raw_require "codemirror/mode/octave/octave");
    ignore (raw_require "codemirror/mode/oz/oz");
    ignore (raw_require "codemirror/mode/pascal/pascal");
    ignore (raw_require "codemirror/mode/pegjs/pegjs");
    ignore (raw_require "codemirror/mode/perl/perl");
    ignore (raw_require "codemirror/mode/php/php");
    ignore (raw_require "codemirror/mode/pig/pig");
    ignore (raw_require "codemirror/mode/powershell/powershell");
    ignore (raw_require "codemirror/mode/properties/properties");
    ignore (raw_require "codemirror/mode/protobuf/protobuf");
    ignore (raw_require "codemirror/mode/pug/pug");
    ignore (raw_require "codemirror/mode/puppet/puppet");
    ignore (raw_require "codemirror/mode/python/python");
    ignore (raw_require "codemirror/mode/q/q");
    ignore (raw_require "codemirror/mode/r/r");
    ignore (raw_require "codemirror/mode/rpm/rpm");
    ignore (raw_require "codemirror/mode/rst/rst");
    ignore (raw_require "codemirror/mode/ruby/ruby");
    ignore (raw_require "codemirror/mode/rust/rust");
    ignore (raw_require "codemirror/mode/sas/sas");
    ignore (raw_require "codemirror/mode/sass/sass");
    ignore (raw_require "codemirror/mode/scheme/scheme");
    ignore (raw_require "codemirror/mode/shell/shell");
    ignore (raw_require "codemirror/mode/sieve/sieve");
    ignore (raw_require "codemirror/mode/slim/slim");
    ignore (raw_require "codemirror/mode/smalltalk/smalltalk");
    ignore (raw_require "codemirror/mode/smarty/smarty");
    ignore (raw_require "codemirror/mode/solr/solr");
    ignore (raw_require "codemirror/mode/soy/soy");
    ignore (raw_require "codemirror/mode/sparql/sparql");
    ignore (raw_require "codemirror/mode/spreadsheet/spreadsheet");
    ignore (raw_require "codemirror/mode/sql/sql");
    ignore (raw_require "codemirror/mode/stex/stex");
    ignore (raw_require "codemirror/mode/stylus/stylus");
    ignore (raw_require "codemirror/mode/swift/swift");
    ignore (raw_require "codemirror/mode/tcl/tcl");
    ignore (raw_require "codemirror/mode/textile/textile");
    ignore (raw_require "codemirror/mode/tiddlywiki/tiddlywiki");
    ignore (raw_require "codemirror/mode/tiki/tiki");
    ignore (raw_require "codemirror/mode/toml/toml");
    ignore (raw_require "codemirror/mode/tornado/tornado");
    ignore (raw_require "codemirror/mode/troff/troff");
    ignore (raw_require "codemirror/mode/ttcn/ttcn");
    ignore (raw_require "codemirror/mode/ttcn-cfg/ttcn-cfg");
    ignore (raw_require "codemirror/mode/turtle/turtle");
    ignore (raw_require "codemirror/mode/twig/twig");
    ignore (raw_require "codemirror/mode/vb/vb");
    ignore (raw_require "codemirror/mode/vbscript/vbscript");
    ignore (raw_require "codemirror/mode/velocity/velocity");
    ignore (raw_require "codemirror/mode/verilog/verilog");
    ignore (raw_require "codemirror/mode/vhdl/vhdl");
    ignore (raw_require "codemirror/mode/vue/vue");
    ignore (raw_require "codemirror/mode/wast/wast");
    ignore (raw_require "codemirror/mode/webidl/webidl");
    ignore (raw_require "codemirror/mode/xml/xml");
    ignore (raw_require "codemirror/mode/xquery/xquery");
    ignore (raw_require "codemirror/mode/yacas/yacas");
    ignore (raw_require "codemirror/mode/yaml/yaml");
    ignore (raw_require "codemirror/mode/yaml-frontmatter/yaml-frontmatter");
    ignore (raw_require "codemirror/mode/z80/z80")
  end

(* addon imports — cljs extensions/code.cljs requires the same set *)





(* mode imports: cljs loads every codemirror/mode/* so findModeByName
   can resolve any fence language *)

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

external next_sibling : D.el -> D.el option = "nextElementSibling"
  [@@mel.get] [@@mel.return nullable]

external json_of_fn : (t -> unit) -> Js.Json.t = "%identity"
external json_of_cm : cm_module -> Js.Json.t = "%identity"
external window_obj : Js.Json.t = "window"
  [@@mel.scope "globalThis"]



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

let cm_mode lang =
  let m =
    match find_mode_by_name (cm ()) lang with
    | Some _ as m -> m
    | None -> find_mode_by_ext (cm ()) lang
  in
  match m with
  | Some info -> Option.value (json_string info "mime") ~default:lang
  | None -> lang

let lisp_like mode = List.mem mode [ "scheme"; "lisp"; "clojure"; "edn" ]

(* theme ("solarized <light|dark>") follows the root .dark class the same
   way cljs theme-name does via the ui/theme subscription *)
let theme_name () =
  if V.el_class_contains D.document_element "dark" then "solarized dark"
  else "solarized light"

(* -- instances keyed by block uuid -- *)

let instances : (string, t) Hashtbl.t = Hashtbl.create 8

let instance uuid =
  match Hashtbl.find_opt instances uuid with
  | Some c when V.el_is_connected (get_wrapper c) -> Some c
  | Some _ ->
      Hashtbl.remove instances uuid;
      None
  | None -> None

let prune () =
  let dead = ref [] in
  Hashtbl.iter
    (fun uuid c ->
      if not (V.el_is_connected (get_wrapper c)) then dead := uuid :: !dead)
    instances;
  List.iter (Hashtbl.remove instances) !dead

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
          V.clear res;
          List.iter
            (fun line ->
              D.el_append_child res
                (V.h ~cls:"extensions__code-calc-output-line" ~text:line
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
          D.stop_propagation ev;
          D.prevent_default ev
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
  D.stop_propagation ev;
  if S.selection_active () then
    S.set (fun st ->
        { st with
          S.selected = S.String_set.empty
        ; action_bar = false
        })

(* -- mount -- *)

let make_options ~uuid ~lang ~mode =
  let extra_keys =
    Js.Dict.fromList
      [ ("Esc", json_of_fn (fun _ -> on_escape uuid))
      ; ("Shift-Enter", json_of_fn (fun _ -> on_shift_enter uuid))
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
      ; ("extraKeys", Js.Json.object_ extra_keys)
      ]
  in
  if lang = "calc" then
    (* cljs: calc editors expand to the whole buffer *)
    Js.Dict.set opts "viewportMargin" (Js.Json.number Float.infinity);
  Js.Json.object_ opts

(* fromTextArea leaves the textarea in place (hidden) and inserts the
   .CodeMirror wrapper right after it *)
let bound el =
  match next_sibling el with
  | Some sib -> V.el_class_contains sib "CodeMirror"
  | None -> false

let uuid_of_el el =
  match D.el_closest el ".ls-block" with
  | Some block -> D.el_get_attr block "blockid"
  | None -> None

let mount uuid textarea =
  let lang =
    normalize_lang
      (Option.value (D.el_get_attr textarea "data-lang") ~default:"")
  in
  let mode = cm_mode lang in
  let c = from_textarea (cm ()) textarea (make_options ~uuid ~lang ~mode) in
  Hashtbl.replace instances uuid c;
  on_event c "change" (fun c -> on_change uuid c);
  on_event c "blur" (fun _ -> on_cm_blur uuid);
  on_event c "focus" (fun _ -> on_cm_focus uuid);
  V.el_add_listener (get_wrapper c) "keydown" (wrapper_keydown uuid c);
  V.el_add_listener (get_wrapper c) "pointerdown" (wrapper_pointerdown uuid);
  (* cljs .save()/.refresh() right after mount: textarea value -> doc
     state, then a layout pass while the container is on screen *)
  save c;
  refresh c

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
   subscribe lazily from the mutation scan instead of at install *)
let ensure_watch () =
  match !watch with
  | Some _ -> ()
  | None ->
      if S.ready () then
        watch := Some (Signal.map sync_titles (S.signal ()))

let scan roots =
  ensure_watch ();
  prune ();
  D.for_each_touched roots ".code-editor textarea" (fun el ->
      (* the selector also matches the hidden textarea inside a mounted
         .CodeMirror — skip it or fromTextArea would nest editors *)
      if
        (not (bound el))
        && D.el_closest el ".CodeMirror" = None
      then
        match uuid_of_el el with
        | Some uuid -> mount uuid el
        | None -> ())

(* -- language picker (.code-block-actions .select-language) -- *)

let picker : D.el option ref = ref None

let close_picker () =
  match !picker with
  | Some el ->
      V.el_remove el;
      picker := None
  | None -> ()

let pick_lang uuid lang =
  close_picker ();
  (match (instance uuid, find_mode_by_name (cm ()) lang) with
   | Some c, Some info -> (
       match json_string info "mode" with
       | Some m -> set_option c "mode" (Js.Json.string m)
       | None -> ())
   | _ -> ());
  ignore
    (Ops.apply_and_refresh
       [ Ops.set_block_property uuid "logseq.property.code/lang"
           (Wire.String lang) ])

let open_lang_picker uuid =
  match !picker with
  | Some _ -> close_picker ()
  | None -> (
      match
        ( D.query_selector ".cp__overlays"
        , D.query_selector
            ("#ls-block-" ^ uuid ^ " .select-language") )
      with
      | Some host, Some button ->
          let r = V.el_rect button in
          let menu =
            V.h ~cls:"ls-code-lang-picker" ~attrs:[ ("role", "menu") ] ()
          in
          V.el_set_attr menu "style"
            (Printf.sprintf "position:fixed;left:%.0fpx;top:%.0fpx;z-index:var(--ls-z-index-level-1)"
               (V.rect_left r) (V.rect_bottom r +. 4.));
          Array.iter
            (fun info ->
              match json_string info "name" with
              | Some name ->
                  let row =
                    V.h ~cls:Menu_item.base_cls ~attrs:Menu_item.item_attrs
                      ~text:name
                      ~on_click:(fun _ -> pick_lang uuid name)
                      ()
                  in
                  D.el_append_child menu row
              | None -> ())
            (mode_infos (cm ()));
          D.el_append_child host menu;
          picker := Some menu
      | _ -> ())

(* .code-block-actions copy button (cljs copy-code!: clipboard +
   "Copied!" notification) *)
let copy_button uuid =
  match instance uuid with
  | Some c ->
      ignore
        (let* () = V.clipboard_write (get_value c) in
         Runtime.send
           (Action.Toast_push
              { Model.toast_id = 0
              ; toast_key = None
              ; toast_text = I18n.t "notification/copied"
              ; toast_kind = "success"
              });
         Js.Promise.resolve ())
  | None -> ()

let installed = ref false

let install () =
  if not !installed then begin
    installed := true;
    load_modes ();
    (* hooks for editor_actions without a module cycle *)
    S.code_buffer_of := live_value;
    S.code_focus := focus_block;
    (* cljs exposes the module on window (used by extensions and dev
       helpers) *)
    Platform.set_prop window_obj "CodeMirror" (json_of_cm (cm ()));
    D.document_add_listener "mousedown"
      (fun ev ->
        match
          ( !picker
          , D.closest_sel ".ls-code-lang-picker, .code-block-actions"
              (D.ev_target ev) )
        with
        | Some _, None -> close_picker ()
        | _ -> ())
      true;
    D.register_doc_scan ~sync:true scan
  end
