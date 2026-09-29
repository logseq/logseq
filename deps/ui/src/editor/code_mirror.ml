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

module D = Editor_dom
module V = Views_dom
module S = Editor_state
module A = Editor_actions
module Ops = Outliner_ops

let ( let* ) p f = Js.Promise.then_ f p

type cm_module
type t

external cm : cm_module = "codemirror" [@@mel.module]

(* addon imports — cljs extensions/code.cljs requires the same set *)
external _closebrackets : Js.Json.t = "codemirror/addon/edit/closebrackets" [@@mel.module]

external _matchbrackets : Js.Json.t = "codemirror/addon/edit/matchbrackets" [@@mel.module]

external _showhint : Js.Json.t = "codemirror/addon/hint/show-hint" [@@mel.module]

external _activeline : Js.Json.t = "codemirror/addon/selection/active-line" [@@mel.module]

external _meta : Js.Json.t = "codemirror/mode/meta" [@@mel.module]

(* mode imports: cljs loads every codemirror/mode/* so findModeByName
   can resolve any fence language *)
external _mode_apl : Js.Json.t = "codemirror/mode/apl/apl" [@@mel.module]
external _mode_asciiarmor : Js.Json.t = "codemirror/mode/asciiarmor/asciiarmor" [@@mel.module]
external _mode_asn_1 : Js.Json.t = "codemirror/mode/asn.1/asn.1" [@@mel.module]
external _mode_asterisk : Js.Json.t = "codemirror/mode/asterisk/asterisk" [@@mel.module]
external _mode_brainfuck : Js.Json.t = "codemirror/mode/brainfuck/brainfuck" [@@mel.module]
external _mode_clike : Js.Json.t = "codemirror/mode/clike/clike" [@@mel.module]
external _mode_clojure : Js.Json.t = "codemirror/mode/clojure/clojure" [@@mel.module]
external _mode_cmake : Js.Json.t = "codemirror/mode/cmake/cmake" [@@mel.module]
external _mode_cobol : Js.Json.t = "codemirror/mode/cobol/cobol" [@@mel.module]
external _mode_coffeescript : Js.Json.t = "codemirror/mode/coffeescript/coffeescript" [@@mel.module]
external _mode_commonlisp : Js.Json.t = "codemirror/mode/commonlisp/commonlisp" [@@mel.module]
external _mode_crystal : Js.Json.t = "codemirror/mode/crystal/crystal" [@@mel.module]
external _mode_css : Js.Json.t = "codemirror/mode/css/css" [@@mel.module]
external _mode_cypher : Js.Json.t = "codemirror/mode/cypher/cypher" [@@mel.module]
external _mode_d : Js.Json.t = "codemirror/mode/d/d" [@@mel.module]
external _mode_dart : Js.Json.t = "codemirror/mode/dart/dart" [@@mel.module]
external _mode_diff : Js.Json.t = "codemirror/mode/diff/diff" [@@mel.module]
external _mode_django : Js.Json.t = "codemirror/mode/django/django" [@@mel.module]
external _mode_dockerfile : Js.Json.t = "codemirror/mode/dockerfile/dockerfile" [@@mel.module]
external _mode_dtd : Js.Json.t = "codemirror/mode/dtd/dtd" [@@mel.module]
external _mode_dylan : Js.Json.t = "codemirror/mode/dylan/dylan" [@@mel.module]
external _mode_ebnf : Js.Json.t = "codemirror/mode/ebnf/ebnf" [@@mel.module]
external _mode_ecl : Js.Json.t = "codemirror/mode/ecl/ecl" [@@mel.module]
external _mode_eiffel : Js.Json.t = "codemirror/mode/eiffel/eiffel" [@@mel.module]
external _mode_elm : Js.Json.t = "codemirror/mode/elm/elm" [@@mel.module]
external _mode_erlang : Js.Json.t = "codemirror/mode/erlang/erlang" [@@mel.module]
external _mode_factor : Js.Json.t = "codemirror/mode/factor/factor" [@@mel.module]
external _mode_fcl : Js.Json.t = "codemirror/mode/fcl/fcl" [@@mel.module]
external _mode_forth : Js.Json.t = "codemirror/mode/forth/forth" [@@mel.module]
external _mode_fortran : Js.Json.t = "codemirror/mode/fortran/fortran" [@@mel.module]
external _mode_gas : Js.Json.t = "codemirror/mode/gas/gas" [@@mel.module]
external _mode_gfm : Js.Json.t = "codemirror/mode/gfm/gfm" [@@mel.module]
external _mode_gherkin : Js.Json.t = "codemirror/mode/gherkin/gherkin" [@@mel.module]
external _mode_go : Js.Json.t = "codemirror/mode/go/go" [@@mel.module]
external _mode_groovy : Js.Json.t = "codemirror/mode/groovy/groovy" [@@mel.module]
external _mode_haml : Js.Json.t = "codemirror/mode/haml/haml" [@@mel.module]
external _mode_handlebars : Js.Json.t = "codemirror/mode/handlebars/handlebars" [@@mel.module]
external _mode_haskell : Js.Json.t = "codemirror/mode/haskell/haskell" [@@mel.module]
external _mode_haskell_literate : Js.Json.t = "codemirror/mode/haskell-literate/haskell-literate" [@@mel.module]
external _mode_haxe : Js.Json.t = "codemirror/mode/haxe/haxe" [@@mel.module]
external _mode_htmlembedded : Js.Json.t = "codemirror/mode/htmlembedded/htmlembedded" [@@mel.module]
external _mode_htmlmixed : Js.Json.t = "codemirror/mode/htmlmixed/htmlmixed" [@@mel.module]
external _mode_http : Js.Json.t = "codemirror/mode/http/http" [@@mel.module]
external _mode_idl : Js.Json.t = "codemirror/mode/idl/idl" [@@mel.module]
external _mode_javascript : Js.Json.t = "codemirror/mode/javascript/javascript" [@@mel.module]
external _mode_jinja2 : Js.Json.t = "codemirror/mode/jinja2/jinja2" [@@mel.module]
external _mode_jsx : Js.Json.t = "codemirror/mode/jsx/jsx" [@@mel.module]
external _mode_julia : Js.Json.t = "codemirror/mode/julia/julia" [@@mel.module]
external _mode_livescript : Js.Json.t = "codemirror/mode/livescript/livescript" [@@mel.module]
external _mode_lua : Js.Json.t = "codemirror/mode/lua/lua" [@@mel.module]
external _mode_markdown : Js.Json.t = "codemirror/mode/markdown/markdown" [@@mel.module]
external _mode_mathematica : Js.Json.t = "codemirror/mode/mathematica/mathematica" [@@mel.module]
external _mode_mbox : Js.Json.t = "codemirror/mode/mbox/mbox" [@@mel.module]
external _mode_mirc : Js.Json.t = "codemirror/mode/mirc/mirc" [@@mel.module]
external _mode_mllike : Js.Json.t = "codemirror/mode/mllike/mllike" [@@mel.module]
external _mode_modelica : Js.Json.t = "codemirror/mode/modelica/modelica" [@@mel.module]
external _mode_mscgen : Js.Json.t = "codemirror/mode/mscgen/mscgen" [@@mel.module]
external _mode_mumps : Js.Json.t = "codemirror/mode/mumps/mumps" [@@mel.module]
external _mode_nginx : Js.Json.t = "codemirror/mode/nginx/nginx" [@@mel.module]
external _mode_nsis : Js.Json.t = "codemirror/mode/nsis/nsis" [@@mel.module]
external _mode_ntriples : Js.Json.t = "codemirror/mode/ntriples/ntriples" [@@mel.module]
external _mode_octave : Js.Json.t = "codemirror/mode/octave/octave" [@@mel.module]
external _mode_oz : Js.Json.t = "codemirror/mode/oz/oz" [@@mel.module]
external _mode_pascal : Js.Json.t = "codemirror/mode/pascal/pascal" [@@mel.module]
external _mode_pegjs : Js.Json.t = "codemirror/mode/pegjs/pegjs" [@@mel.module]
external _mode_perl : Js.Json.t = "codemirror/mode/perl/perl" [@@mel.module]
external _mode_php : Js.Json.t = "codemirror/mode/php/php" [@@mel.module]
external _mode_pig : Js.Json.t = "codemirror/mode/pig/pig" [@@mel.module]
external _mode_powershell : Js.Json.t = "codemirror/mode/powershell/powershell" [@@mel.module]
external _mode_properties : Js.Json.t = "codemirror/mode/properties/properties" [@@mel.module]
external _mode_protobuf : Js.Json.t = "codemirror/mode/protobuf/protobuf" [@@mel.module]
external _mode_pug : Js.Json.t = "codemirror/mode/pug/pug" [@@mel.module]
external _mode_puppet : Js.Json.t = "codemirror/mode/puppet/puppet" [@@mel.module]
external _mode_python : Js.Json.t = "codemirror/mode/python/python" [@@mel.module]
external _mode_q : Js.Json.t = "codemirror/mode/q/q" [@@mel.module]
external _mode_r : Js.Json.t = "codemirror/mode/r/r" [@@mel.module]
external _mode_rpm : Js.Json.t = "codemirror/mode/rpm/rpm" [@@mel.module]
external _mode_rst : Js.Json.t = "codemirror/mode/rst/rst" [@@mel.module]
external _mode_ruby : Js.Json.t = "codemirror/mode/ruby/ruby" [@@mel.module]
external _mode_rust : Js.Json.t = "codemirror/mode/rust/rust" [@@mel.module]
external _mode_sas : Js.Json.t = "codemirror/mode/sas/sas" [@@mel.module]
external _mode_sass : Js.Json.t = "codemirror/mode/sass/sass" [@@mel.module]
external _mode_scheme : Js.Json.t = "codemirror/mode/scheme/scheme" [@@mel.module]
external _mode_shell : Js.Json.t = "codemirror/mode/shell/shell" [@@mel.module]
external _mode_sieve : Js.Json.t = "codemirror/mode/sieve/sieve" [@@mel.module]
external _mode_slim : Js.Json.t = "codemirror/mode/slim/slim" [@@mel.module]
external _mode_smalltalk : Js.Json.t = "codemirror/mode/smalltalk/smalltalk" [@@mel.module]
external _mode_smarty : Js.Json.t = "codemirror/mode/smarty/smarty" [@@mel.module]
external _mode_solr : Js.Json.t = "codemirror/mode/solr/solr" [@@mel.module]
external _mode_soy : Js.Json.t = "codemirror/mode/soy/soy" [@@mel.module]
external _mode_sparql : Js.Json.t = "codemirror/mode/sparql/sparql" [@@mel.module]
external _mode_spreadsheet : Js.Json.t = "codemirror/mode/spreadsheet/spreadsheet" [@@mel.module]
external _mode_sql : Js.Json.t = "codemirror/mode/sql/sql" [@@mel.module]
external _mode_stex : Js.Json.t = "codemirror/mode/stex/stex" [@@mel.module]
external _mode_stylus : Js.Json.t = "codemirror/mode/stylus/stylus" [@@mel.module]
external _mode_swift : Js.Json.t = "codemirror/mode/swift/swift" [@@mel.module]
external _mode_tcl : Js.Json.t = "codemirror/mode/tcl/tcl" [@@mel.module]
external _mode_textile : Js.Json.t = "codemirror/mode/textile/textile" [@@mel.module]
external _mode_tiddlywiki : Js.Json.t = "codemirror/mode/tiddlywiki/tiddlywiki" [@@mel.module]
external _mode_tiki : Js.Json.t = "codemirror/mode/tiki/tiki" [@@mel.module]
external _mode_toml : Js.Json.t = "codemirror/mode/toml/toml" [@@mel.module]
external _mode_tornado : Js.Json.t = "codemirror/mode/tornado/tornado" [@@mel.module]
external _mode_troff : Js.Json.t = "codemirror/mode/troff/troff" [@@mel.module]
external _mode_ttcn : Js.Json.t = "codemirror/mode/ttcn/ttcn" [@@mel.module]
external _mode_ttcn_cfg : Js.Json.t = "codemirror/mode/ttcn-cfg/ttcn-cfg" [@@mel.module]
external _mode_turtle : Js.Json.t = "codemirror/mode/turtle/turtle" [@@mel.module]
external _mode_twig : Js.Json.t = "codemirror/mode/twig/twig" [@@mel.module]
external _mode_vb : Js.Json.t = "codemirror/mode/vb/vb" [@@mel.module]
external _mode_vbscript : Js.Json.t = "codemirror/mode/vbscript/vbscript" [@@mel.module]
external _mode_velocity : Js.Json.t = "codemirror/mode/velocity/velocity" [@@mel.module]
external _mode_verilog : Js.Json.t = "codemirror/mode/verilog/verilog" [@@mel.module]
external _mode_vhdl : Js.Json.t = "codemirror/mode/vhdl/vhdl" [@@mel.module]
external _mode_vue : Js.Json.t = "codemirror/mode/vue/vue" [@@mel.module]
external _mode_wast : Js.Json.t = "codemirror/mode/wast/wast" [@@mel.module]
external _mode_webidl : Js.Json.t = "codemirror/mode/webidl/webidl" [@@mel.module]
external _mode_xml : Js.Json.t = "codemirror/mode/xml/xml" [@@mel.module]
external _mode_xquery : Js.Json.t = "codemirror/mode/xquery/xquery" [@@mel.module]
external _mode_yacas : Js.Json.t = "codemirror/mode/yacas/yacas" [@@mel.module]
external _mode_yaml : Js.Json.t = "codemirror/mode/yaml/yaml" [@@mel.module]
external _mode_yaml_frontmatter : Js.Json.t = "codemirror/mode/yaml-frontmatter/yaml-frontmatter" [@@mel.module]
external _mode_z80 : Js.Json.t = "codemirror/mode/z80/z80" [@@mel.module]

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

(* reference every imported binding so dune/melange keeps the emit *)
let _imports =
  [ _closebrackets; _matchbrackets; _showhint; _activeline; _meta
  ; _mode_apl
  ; _mode_asciiarmor
  ; _mode_asn_1
  ; _mode_asterisk
  ; _mode_brainfuck
  ; _mode_clike
  ; _mode_clojure
  ; _mode_cmake
  ; _mode_cobol
  ; _mode_coffeescript
  ; _mode_commonlisp
  ; _mode_crystal
  ; _mode_css
  ; _mode_cypher
  ; _mode_d
  ; _mode_dart
  ; _mode_diff
  ; _mode_django
  ; _mode_dockerfile
  ; _mode_dtd
  ; _mode_dylan
  ; _mode_ebnf
  ; _mode_ecl
  ; _mode_eiffel
  ; _mode_elm
  ; _mode_erlang
  ; _mode_factor
  ; _mode_fcl
  ; _mode_forth
  ; _mode_fortran
  ; _mode_gas
  ; _mode_gfm
  ; _mode_gherkin
  ; _mode_go
  ; _mode_groovy
  ; _mode_haml
  ; _mode_handlebars
  ; _mode_haskell
  ; _mode_haskell_literate
  ; _mode_haxe
  ; _mode_htmlembedded
  ; _mode_htmlmixed
  ; _mode_http
  ; _mode_idl
  ; _mode_javascript
  ; _mode_jinja2
  ; _mode_jsx
  ; _mode_julia
  ; _mode_livescript
  ; _mode_lua
  ; _mode_markdown
  ; _mode_mathematica
  ; _mode_mbox
  ; _mode_mirc
  ; _mode_mllike
  ; _mode_modelica
  ; _mode_mscgen
  ; _mode_mumps
  ; _mode_nginx
  ; _mode_nsis
  ; _mode_ntriples
  ; _mode_octave
  ; _mode_oz
  ; _mode_pascal
  ; _mode_pegjs
  ; _mode_perl
  ; _mode_php
  ; _mode_pig
  ; _mode_powershell
  ; _mode_properties
  ; _mode_protobuf
  ; _mode_pug
  ; _mode_puppet
  ; _mode_python
  ; _mode_q
  ; _mode_r
  ; _mode_rpm
  ; _mode_rst
  ; _mode_ruby
  ; _mode_rust
  ; _mode_sas
  ; _mode_sass
  ; _mode_scheme
  ; _mode_shell
  ; _mode_sieve
  ; _mode_slim
  ; _mode_smalltalk
  ; _mode_smarty
  ; _mode_solr
  ; _mode_soy
  ; _mode_sparql
  ; _mode_spreadsheet
  ; _mode_sql
  ; _mode_stex
  ; _mode_stylus
  ; _mode_swift
  ; _mode_tcl
  ; _mode_textile
  ; _mode_tiddlywiki
  ; _mode_tiki
  ; _mode_toml
  ; _mode_tornado
  ; _mode_troff
  ; _mode_ttcn
  ; _mode_ttcn_cfg
  ; _mode_turtle
  ; _mode_twig
  ; _mode_vb
  ; _mode_vbscript
  ; _mode_velocity
  ; _mode_verilog
  ; _mode_vhdl
  ; _mode_vue
  ; _mode_wast
  ; _mode_webidl
  ; _mode_xml
  ; _mode_xquery
  ; _mode_yacas
  ; _mode_yaml
  ; _mode_yaml_frontmatter
  ; _mode_z80
  ]

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
    match find_mode_by_name cm lang with
    | Some _ as m -> m
    | None -> find_mode_by_ext cm lang
  in
  match m with
  | Some info -> Option.value (json_string info "mime") ~default:lang
  | None -> lang

let lisp_like mode = List.mem mode [ "scheme"; "lisp"; "clojure"; "edn" ]

(* theme ("lsradix <light|dark>") follows the root .dark class the same
   way cljs theme-name does via the ui/theme subscription *)
let theme_name () =
  if V.el_class_contains D.document_element "dark" then "lsradix dark"
  else "lsradix light"

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
          set_cursor c (pos cm line ch);
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
    S.set (fun st -> { st with S.selected = S.String_set.empty })

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
  let c = from_textarea cm textarea (make_options ~uuid ~lang ~mode) in
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
  (match (instance uuid, find_mode_by_name cm lang) with
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
            (mode_infos cm);
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
    (* hooks for editor_actions without a module cycle *)
    S.code_buffer_of := live_value;
    S.code_focus := focus_block;
    (* cljs exposes the module on window (used by extensions and dev
       helpers) *)
    Platform.set_prop window_obj "CodeMirror" (json_of_cm cm);
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
