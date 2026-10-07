(* Native twin of views/views_dom.ml — imperative el creation registers a
   {#new:n} node in Imperative_dom, which materializes it as a
   `logseq-<tag>` extension node inside the LUI runtime tree (or the
   imperative body overlay for document.body appends). Mutations push
   extension props through the normal patch flush; only live-element ops
   (focus/selection/scroll/value) still use the dom-op channel. *)

open Js.Json

type el = Js.Json.t
type ev = Js.Json.t
type rect = Js.Json.t

let new_el ?(tag = "div") () = Imperative_dom.register ~tag ()

let doc_op = Imperative_dom.doc_op
let shadow_field = Imperative_dom.shadow_field
let detach_child = Imperative_dom.detach_child

(* ---------- element lifecycle ops ---------- *)

let el_remove (el : el) : unit =
  match Imperative_dom.id_of el with
  | Some id -> Imperative_dom.remove id
  | None -> ()

let el_replace_children (el : el) : unit =
  match Imperative_dom.id_of el with
  | Some id -> (
      match Imperative_dom.get id with
      | Some n ->
          List.iter
            (fun c ->
              match Imperative_dom.id_of c with
              | Some cid -> Imperative_dom.remove cid
              | None -> ())
            n.Imperative_dom.s_children;
          n.Imperative_dom.s_children <- []
      | None -> ())
  | None -> ()

let el_children (el : el) : Js.Json.t =
  match Imperative_dom.id_of el with
  | Some id -> (
      match Imperative_dom.get id with
      | Some n -> JArray (Array.of_list n.Imperative_dom.s_children)
      | None -> JArray [||])
  | None -> JArray [||]

let el_parent (el : el) : el option =
  match Imperative_dom.id_of el with
  | Some id -> (
      match Imperative_dom.get id with
      | Some n -> n.Imperative_dom.s_parent
      | None -> None)
  | None -> None

let el_is_connected (el : el) : bool =
  match Imperative_dom.id_of el with
  | Some _ -> el_parent el <> None
  | None -> true (* mounted snapshots are connected *)

let el_text_content (el : el) : string =
  match Imperative_dom.id_of el with
  | Some id -> (
      match Imperative_dom.get id with
      | Some n -> n.Imperative_dom.s_text
      | None -> "")
  | None -> (
      match el with
      | JObject kvs ->
          Option.bind (List.assoc_opt "text" kvs) decodeString
          |> Option.value ~default:""
      | _ -> "")

let el_set_text_content (el : el) (v : string) : unit =
  match Imperative_dom.id_of el with
  | Some id -> (
      match Imperative_dom.get id with
      | Some n ->
          List.iter
            (fun c ->
              match Imperative_dom.id_of c with
              | Some cid -> Imperative_dom.remove cid
              | None -> ())
            n.Imperative_dom.s_children;
          n.Imperative_dom.s_children <- [];
          Imperative_dom.set_text n v
      | None -> ())
  | None -> ()

let el_insert_adjacent_text (el : el) (pos : string) (v : string) : unit =
  doc_op "insert-adjacent-text"
    (JObject
       ([ ("ref", el); ("pos", JString pos); ("text", JString v) ]
       @ shadow_field el))

(* ---------- imperative event dispatch ---------- *)

(* Host events on imperative elements arrive through the extension
   dom-event channel; Imperative_dom unwraps them and re-dispatches via
   Platform.emit_event, which bubbles the runtime tree (imperative and
   declarative ancestors) into the per-node dom_handlers entries and ends
   at window/document listeners. Programmatic clicks take the same path
   through Imperative_dom.dispatch. *)

let el_click (el : el) : unit =
  match Imperative_dom.id_of el with
  | Some id -> Imperative_dom.dispatch id "click" []
  | None -> ()

let el_blur (_ : el) : unit = ()

let el_checked (el : el) : bool =
  match Imperative_dom.id_of el with
  | Some id -> (
      match Imperative_dom.get id with
      | Some n -> n.Imperative_dom.s_checked
      | None -> false)
  | None -> (
      match el with
      | JObject kvs ->
          Option.bind (List.assoc_opt "checked" kvs) decodeBoolean
          |> Option.value ~default:false
      | _ -> false)

let el_set_checked (el : el) (b : bool) : unit =
  match Imperative_dom.id_of el with
  | Some id -> (
      match Imperative_dom.get id with
      | Some n ->
          if b then Imperative_dom.set_attr n "checked" ""
          else Imperative_dom.remove_attr n "checked"
      | None -> ())
  | None -> ()

(* ---------- tree mutation ops ---------- *)

let el_insert_before (parent : el) (child : el) (before : el option) : unit =
  Imperative_dom.insert_before parent child before

let el_append_child (parent : el) (child : el) : unit =
  Imperative_dom.append_child parent child

(* ---------- listeners ---------- *)

let el_add_listener (el : el) (name : string) (f : ev -> unit) : unit =
  match Imperative_dom.id_of el with
  | Some id -> Imperative_dom.add_listener id name f
  | None -> Platform.add_event_listener name f

let el_add_listener_capture (el : el) (name : string) (f : ev -> unit)
    : unit =
  el_add_listener el name f

let el_remove_listener (el : el) (name : string) (f : ev -> unit) : unit =
  match Imperative_dom.id_of el with
  | Some id -> Imperative_dom.remove_listener id name f
  | None -> ()

let el_contains (a : el) (b : el) : bool = Editor_dom.el_contains a b

(* ---------- attrs ---------- *)

let el_placeholder (el : el) (v : string) : unit =
  match Imperative_dom.id_of el with
  | Some id -> (
      match Imperative_dom.get id with
      | Some n -> Imperative_dom.set_attr n "placeholder" v
      | None -> ())
  | None -> ()

let el_type (el : el) (v : string) : unit =
  match Imperative_dom.id_of el with
  | Some id -> (
      match Imperative_dom.get id with
      | Some n -> Imperative_dom.set_attr n "type" v
      | None -> ())
  | None -> ()

let el_scroll_into_view (el : el) : unit =
  doc_op "scroll-into-view" (JObject ([ ("ref", el) ] @ shadow_field el))

let el_has_attr (el : el) (name : string) : bool =
  match Imperative_dom.id_of el with
  | Some id -> (
      match Imperative_dom.get id with
      | Some n -> Imperative_dom.get_attr n name <> None
      | None -> false)
  | None -> Editor_dom.el_has_attr el name

let el_get_attr (el : el) (name : string) : string option =
  match Imperative_dom.id_of el with
  | Some id -> (
      match Imperative_dom.get id with
      | Some n -> Imperative_dom.get_attr n name
      | None -> None)
  | None -> Editor_dom.el_get_attr el name

let el_set_attr (el : el) (name : string) (v : string) : unit =
  match Imperative_dom.id_of el with
  | Some id -> (
      match Imperative_dom.get id with
      | Some n -> Imperative_dom.set_attr n name v
      | None -> ())
  | None -> Editor_dom.record_attr_override el name v

let el_set_class (el : el) (c : string) : unit = el_set_attr el "class" c

let el_remove_attr (el : el) (name : string) : unit =
  match Imperative_dom.id_of el with
  | Some id -> (
      match Imperative_dom.get id with
      | Some n -> Imperative_dom.remove_attr n name
      | None -> ())
  | None -> Editor_dom.remove_attr_override el name

let el_scroll_top (_ : el) : float = 0.
let el_scroll_height (_ : el) : float = 0.
let el_client_height (_ : el) : float = 0.
let el_set_scroll_top (_ : el) (_ : float) : unit = ()
let el_client_width (_ : el) : float = 0.

(* innerHTML is not ported: the logseq-* element family renders text via
   the "text" prop only — callers use el_set_text_content. *)
let el_inner_html_set (_ : el) (_ : string) : unit = ()

let el_query_all (el : el) (sel : string) : Js.Json.t =
  Editor_dom.el_query_all el sel

let el_focus (el : el) : unit =
  doc_op "focus" (JObject ([ ("ref", el) ] @ shadow_field el))

(* document.body — floating elements (menus/popups) mount at the top of
   the tree so position:fixed lifts them into the window-level overlay
   layer; #app-container is the topmost app element, the body analogue *)
let document_body : el = JObject [ ("#ref", JString "app-container") ]
let window_inner_height : float = Host.inner_height ()

let window_inner_width : float = Host.inner_width ()

let el_rect (el : el) : rect =
  match Imperative_dom.id_of el with
  | Some id -> (
      match Imperative_dom.rect_of id with
      | Some (l, t, r, b) ->
          JObject
            [ ("left", JNumber l); ("top", JNumber t); ("right", JNumber r)
            ; ("bottom", JNumber b); ("width", JNumber (r -. l))
            ; ("height", JNumber (b -. t)) ]
      | None ->
          JObject
            [ ("left", JNumber 0.); ("top", JNumber 0.); ("right", JNumber 0.)
            ; ("bottom", JNumber 0.); ("width", JNumber 0.)
            ; ("height", JNumber 0.) ])
  | None -> (
      match el with
      | JObject kvs -> (
          match List.assoc_opt "rect" kvs with
          | Some r -> r
          | None -> Dom_ext.bounding_rect el)
      | _ -> Dom_ext.bounding_rect el)

let rect_top (r : rect) : float = Dom_ext.rect_top r
let rect_left (r : rect) : float = Dom_ext.rect_left r
let rect_bottom (r : rect) : float = Dom_ext.rect_bottom r
let rect_width (r : rect) : float = Dom_ext.rect_width r
let rect_height (r : rect) : float = Dom_ext.rect_height r
let ev_client_x (ev : ev) : float = Dom_ext.client_x ev
let ev_client_y (ev : ev) : float = Dom_ext.client_y ev
let ev_button (ev : ev) : int =
  Option.value
    (Option.map int_of_float (Dom_ext.num_prop "button" ev))
    ~default:0
let ev_stop_immediate (ev : ev) : unit = Editor_dom.stop_propagation ev
let el_dispatch (el : el) (_ : ev) : unit = ignore el
let now_ms () : float = Js.Date.now ()
let dispatch_custom (name : string) (detail : Js.Json.t) : unit =
  Platform.dispatch name detail
let clipboard_write (v : string) : unit Js.Promise.t =
  Host.clipboard_write v;
  Js.Promise.resolve ()
let debounce (ms : int) : (unit -> unit) -> unit =
  Editor_dom.debounce ms
let clear (el : el) : unit = el_replace_children el

let append_all (parent : el) (els : el list) : unit =
  List.iter (fun c -> el_append_child parent c) els

let h ?(tag = "div") ?(cls = "") ?(attrs = []) ?text ?title_ ?on_click
    ?on_input ?on_keydown ?on_mousedown ?(children = []) () : el =
  let attrs =
    match title_ with
    | Some t -> attrs @ [ ("title", t) ]
    | None -> attrs
  in
  let j =
    Imperative_dom.register ~tag ~cls ~attrs
      ~text:(Option.value ~default:"" text)
      ()
  in
  let id =
    match Imperative_dom.id_of j with Some i -> i | None -> assert false
  in
  let reg (name : string) (f : (ev -> unit) option) =
    match f with
    | Some g -> Imperative_dom.add_listener id name g
    | None -> ()
  in
  reg "click" on_click;
  reg "input" on_input;
  reg "keydown" on_keydown;
  reg "mousedown" on_mousedown;
  append_all j children;
  j

let create_el_ns (_ns : string) (tag : string) : el = new_el ~tag ()

let tabler_icons : (Js.Json.t -> Js.Json.t) Js.Dict.t option = None

let undefined_json : Js.Json.t = Js.Json.JNull

let svg_el (tag : string) : el = new_el ~tag ()

let icon_attr_name k = k

let json_num_str (n : float) : Js.Json.t = JNumber n

let rec append_icon_child (parent : el) (v : Js.Json.t) : unit =
  match v with
  | JArray a -> Array.iter (append_icon_child parent) a
  | _ -> el_append_child parent v

let tabler_icon_el (_name : string) : el option = None

let icon ?(cls = "") name =
  let span = new_el ~tag:"span" () in
  el_set_class span
    ("ui__icon ti ls-icon-" ^ name ^ if cls = "" then "" else " " ^ cls);
  (match tabler_icon_el name with
   | Some el -> el_append_child span el
   | None -> (
     match Editor_dom.tabler_svg_el name with
     | Some svg -> el_append_child span svg
     | None ->
       let i = new_el ~tag:"i" () in
       el_set_class i ("ti ti-" ^ name);
       el_append_child span i));
  span

let button_base_cls = "ui__button"

let variant_split_index (_ : string) = -1
let utility_groups = []
let utility_conflict (_ : string) = false
let merge_classes (toks : string list) : string =
  String.concat " " toks
let button_cls ?(variant = "default") ?(size = "default") ?(cls = "") () =
  let v =
    match variant with
    | "text" -> "as-text"
    | "ghost" -> "as-ghost"
    | "outline" -> "as-outline"
    | "secondary" -> "as-secondary"
    | "destructive" -> "as-destructive"
    | "link" -> "as-link"
    | _ -> "as-solid"
  in
  let s =
    match size with
    | "sm" -> "ls-btn-sm"
    | "xs" -> "ls-btn-xs"
    | "md" -> "ls-btn-md"
    | "lg" -> "ls-btn-lg"
    | "icon" -> "ls-btn-icon"
    | _ -> "ls-btn-default"
  in
  merge_classes [ button_base_cls; v; s; cls ]

let button_cls_str ?(variant = "") ?(size = "") (extra : string) : string =
  String.concat " "
    (List.filter (fun s -> s <> "")
       [ button_base_cls; variant; size; extra ])

(* focus + caret at end — the query source editor positions the caret
   after text injection *)
let focus_end (el : el) : unit =
  (match Imperative_dom.id_of el with
   | Some id -> (
       match Imperative_dom.get id with
       | Some n ->
           doc_op "focus"
             (JObject
                ([ ("ref", el)
                 ; ("selectionStart", JNumber (Float.of_int (String.length n.Imperative_dom.s_value)))
                 ; ("selectionEnd", JNumber (Float.of_int (String.length n.Imperative_dom.s_value))) ]
                @ shadow_field el))
       | None -> ())
   | None -> ());
  el_focus el

let query_inside (root : el) (sel : string) : el option =
  Editor_dom.el_query root sel

let el_class_add (el : el) (c : string) : unit =
  match Imperative_dom.id_of el with
  | Some id -> (
      match Imperative_dom.get id with
      | Some n ->
          Imperative_dom.set_attr n "class"
            (String.trim (n.Imperative_dom.s_cls ^ " " ^ c))
      | None -> ())
  | None -> ()

let el_class_remove (el : el) (c : string) : unit =
  match Imperative_dom.id_of el with
  | Some id -> (
      match Imperative_dom.get id with
      | Some n ->
          Imperative_dom.set_attr n "class"
            (String.concat " "
               (List.filter
                  (fun t -> t <> "" && t <> c)
                  (String.split_on_char ' ' n.Imperative_dom.s_cls)))
      | None -> ())
  | None -> ()

let el_set_value (el : el) (v : string) : unit =
  (match Imperative_dom.id_of el with
   | Some id -> (
       match Imperative_dom.get id with
       | Some n ->
           n.Imperative_dom.s_value <- v;
           Imperative_dom.push_text n
       | None -> ())
   | None -> ());
  doc_op "set-value"
    (JObject ([ ("ref", el); ("value", JString v) ] @ shadow_field el))

let ev_detail (e : ev) : Js.Json.t option =
  match e with
  | JObject kvs -> List.assoc_opt "detail" kvs
  | _ -> None

let el_value (el : el) : string =
  match Imperative_dom.id_of el with
  | Some id -> (
      match Imperative_dom.get id with
      | Some n -> n.Imperative_dom.s_value
      | None -> "")
  | None -> (
      match el with
      | JObject kvs ->
          Option.bind (List.assoc_opt "value" kvs) decodeString
          |> Option.value ~default:""
      | _ -> "")
