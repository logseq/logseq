(* Native twin of popups/dom_ext.ml.

   Elements are opaque refs (Json snapshots the host pushes with events);
   event accessors decode the Json event payload; DOM mutations go to the
   Swift host via Host.dom_op. Element *queries* (closest, query_selector)
   return None — the native renderer owns layout. *)

type element = Js.Json.t
type event = Js.Json.t
type rect = Js.Json.t

let prop name (j : Js.Json.t) : Js.Json.t =
  match j with
  | Js.Json.JObject kvs -> (
      match List.assoc_opt name kvs with
      | Some v -> v
      | None -> Js.Json.JNull)
  | _ -> Js.Json.JNull

let str_prop name j = Js.Json.decodeString (prop name j)
let num_prop name j = Js.Json.decodeNumber (prop name j)

(* ---------- events ---------- *)

let document_el : element = Js.Json.JObject []

let add_document_listener (name : string) (f : event -> unit)
    (_capture : bool) : unit =
  Platform.add_event_listener name (fun j -> f j)

let key_ (ev : event) : string option = str_prop "key" ev
let input_type (ev : event) : string =
  Option.value (str_prop "inputType" ev) ~default:""

let client_x (ev : event) : float =
  Option.value (num_prop "clientX" ev) ~default:0.

let client_y (ev : event) : float =
  Option.value (num_prop "clientY" ev) ~default:0.

let target (ev : event) : element option =
  match prop "target" ev with
  | Js.Json.JObject _ as el -> Some el
  | _ -> None

let prevent_default (_ : event) : unit = ()
let stop_propagation (_ : event) : unit = ()
let stop_immediate_propagation (_ : event) : unit = ()

(* ---------- element queries (no DOM on native) ---------- *)

let closest (_ : element) (_ : string) : element option = None
let query_selector (_ : element) (_ : string) : element option = None
let doc_query_selector (_ : string) : element option = None

(* ---------- element state ---------- *)

let get_attribute (el : element) (name : string) : string option =
  match prop "attrs" el with
  | Js.Json.JObject kvs ->
      Option.bind (List.assoc_opt name kvs) Js.Json.decodeString
  | _ -> str_prop ("attr-" ^ name) el

let value (el : element) : string =
  Option.value (str_prop "value" el) ~default:""

let set_value (el : element) (v : string) : unit =
  Host.dom_op "set-value" (Js.Json.stringify (Js.Json.JObject [("ref", el); ("value", Js.Json.JString v)]))

let selection_start (el : element) : int =
  Option.value
    (Option.map int_of_float (num_prop "selectionStart" el))
    ~default:0

let selection_end (el : element) : int =
  Option.value
    (Option.map int_of_float (num_prop "selectionEnd" el))
    ~default:0

let set_selection_range (el : element) (s : int) (e : int) : unit =
  Host.dom_op "set-selection-range"
    (Js.Json.stringify
       (Js.Json.JObject [("ref", el); ("start", Js.Json.JNumber (Float.of_int s)); ("end", Js.Json.JNumber (Float.of_int e))]))

let set_text_content (el : element) (v : string) : unit =
  Host.dom_op "set-text-content"
    (Js.Json.stringify (Js.Json.JObject [("ref", el); ("text", Js.Json.JString v)]))

let focus (el : element) : unit =
  Host.dom_op "focus" (Js.Json.stringify (Js.Json.JObject [("ref", el)]))

(* ---------- segmenter (unused path) ---------- *)

type segmenter = int

let new_segmenter (_ : string) (_ : string) : segmenter = 0
let segment _ (_ : segmenter) : string array = [||]

(* ---------- rects ---------- *)

let bounding_rect (_ : element) : rect = prop "rect" Js.Json.null

let rect_left (r : rect) : float =
  Option.value (num_prop "left" r) ~default:0.

let rect_top (r : rect) : float =
  Option.value (num_prop "top" r) ~default:0.

let rect_right (r : rect) : float =
  Option.value (num_prop "right" r) ~default:0.

let rect_bottom (r : rect) : float =
  Option.value (num_prop "bottom" r) ~default:0.

let rect_height (r : rect) : float =
  Option.value (num_prop "height" r) ~default:0.

let window_inner_height : float = 900.
let window_inner_width : float = 1440.

(* ---------- timers ---------- *)

let set_timeout (f : unit -> unit) (ms : int) : unit =
  ignore (Host.set_timeout f ms)

let set_timeout_id (f : unit -> unit) (ms : int) : int =
  Host.set_timeout f ms

let clear_timeout (id : int) : unit = Host.clear_timeout id

(* ---------- misc ---------- *)

let dispatch_custom name detail = Platform.dispatch name detail

let element (j : Js.Json.t) : element = j
let event (j : Js.Json.t) : event = j

let style_set_property (el : element) (name : string) (v : string) : unit =
  Host.dom_op "style-set-property"
    (Js.Json.stringify
       (Js.Json.JObject
          [("ref", el); ("name", Js.Json.JString name); ("value", Js.Json.JString v)]))

let scroll_row_into_view ~scroller:_ ~row:_ = ()

let caret_popup_pos el =
  let r = bounding_rect el in
  (rect_left r, rect_bottom r +. 4., 0.)

(* ---------- imperative el ops used by popups/views (D alias) ---------- *)

let el_query_all (_ : element) (_ : string) : Js.Json.t =
  Js.Json.JArray [||]

let el_remove (el : element) : unit =
  Host.dom_op "remove" (Js.Json.stringify (Js.Json.JObject [("ref", el)]))

let el_remove_attr (el : element) (name : string) : unit =
  Host.dom_op "remove-attr"
    (Js.Json.stringify
       (Js.Json.JObject [("ref", el); ("name", Js.Json.JString name)]))

let rect_width (r : rect) : float =
  Option.value (num_prop "width" r) ~default:0.

let rect_top (r : rect) : float =
  Option.value (num_prop "top" r) ~default:0.

let bool_prop (name : string) (j : Js.Json.t) : bool option =
  match j with
  | Js.Json.JObject kvs ->
      Option.bind (List.assoc_opt name kvs) Js.Json.decodeBoolean
  | _ -> None

let payload_string (p : string) (name : string) : string option =
  match (try Some (Js.Json.parseExn p) with _ -> None) with
  | Some (Js.Json.JObject kvs) ->
      Option.bind (List.assoc_opt name kvs) Js.Json.decodeString
  | _ -> None

let payload_num (p : string) (name : string) : float option =
  match (try Some (Js.Json.parseExn p) with _ -> None) with
  | Some (Js.Json.JObject kvs) ->
      Option.bind (List.assoc_opt name kvs) Js.Json.decodeNumber
  | _ -> None

let meta_key (e : Js.Json.t) : bool =
  Option.value (bool_prop "metaKey" e) ~default:false

let ctrl_key (e : Js.Json.t) : bool =
  Option.value (bool_prop "ctrlKey" e) ~default:false

let shift_key (e : Js.Json.t) : bool =
  Option.value (bool_prop "shiftKey" e) ~default:false

let alt_key (e : Js.Json.t) : bool =
  Option.value (bool_prop "altKey" e) ~default:false

let movement_x (e : Js.Json.t) : float =
  Option.value (num_prop "movementX" e) ~default:0.

let movement_y (e : Js.Json.t) : float =
  Option.value (num_prop "movementY" e) ~default:0.

let button (e : Js.Json.t) : int =
  Option.value (Option.map int_of_float (num_prop "button" e)) ~default:0
