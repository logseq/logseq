(* Typed host-DOM boundary for shared feature code.

   The merged settings/sidebar modules only need a small, testable
   surface: event targets as opaque elements with a few accessors, plus
   host metrics and cross-area dispatch. Each runtime installs one real
   implementation (browser DOM on web, host event snapshots on native);
   shared code never touches Js/Web_dom/Platform directly.

   FLAG(shared-migration): candidate for folding into Ui_services when
   the coordinator extends that contract — kept local so this batch does
   not grow the services surface. *)

type el =
  { closest : string -> el option
  ; attr : string -> string option
  ; rect : unit -> float * float * float * float (* x, y, width, height *)
  ; set_style : string -> string -> unit
  ; add_class : string -> unit
  ; remove_class : string -> unit
  ; offset_width : unit -> float
  }

type ev =
  { x : float
  ; y : float
  ; shift : bool
  ; meta : bool
  ; ctrl : bool
  ; key : string option
  ; target : el option
  ; touches : (float * float) list
  ; detail : string -> string option
  ; prevent_default : unit -> unit
  }

type ops =
  { on_document_event : string -> (ev -> unit) -> unit
  ; query : string -> el option
  ; doc_root : unit -> el
  ; viewport_width : unit -> float
  ; prefers_dark : unit -> bool
  ; navigate_hash : string -> unit
  ; dispatch : string -> unit
  ; open_dialog : string -> unit
  ; encode_uri : string -> string
  ; dev_build : unit -> bool
  ; log_error : string -> unit
  ; apply_left_sidebar_width : int -> unit
  }

let installed : ops option ref = ref None

let install o =
  match !installed with
  | Some _ -> invalid_arg "UI dom ops already installed"
  | None -> installed := Some o

let ready () = Option.is_some !installed

let ops () =
  match !installed with
  | Some o -> o
  | None -> invalid_arg "UI dom ops not installed"

(* convenience accessors *)
let on_document_event name f = (ops ()).on_document_event name f
let query sel = (ops ()).query sel
let doc_root () = (ops ()).doc_root ()
let viewport_width () = (ops ()).viewport_width ()
let prefers_dark () = (ops ()).prefers_dark ()
let navigate_hash h = (ops ()).navigate_hash h
let dispatch name = (ops ()).dispatch name
let open_dialog name = (ops ()).open_dialog name
let encode_uri s = (ops ()).encode_uri s
let dev_build () = (ops ()).dev_build ()
let log_error msg = (ops ()).log_error msg
let apply_left_sidebar_width px = (ops ()).apply_left_sidebar_width px
