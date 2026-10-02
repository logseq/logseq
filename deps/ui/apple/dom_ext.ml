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

(* ---------- element queries ---------- *)

(* Event-target snapshots the Swift host attaches as "target":
   {tag, class, id, attrs: {...}, ancestors: [same shape, nearest first]}.
   closest() walks that chain — a mini selector engine covering what the
   editor/sidebar handlers use: tag, .cls, #id, [attr], [attr=v],
   compound (.a.b, tag.cls), :not(inner), descendant, and comma groups. *)

let ancestors_of (el : element) : element list =
  match el with
  | Js.Json.JObject kvs -> (
      match List.assoc_opt "ancestors" kvs with
      | Some (Js.Json.JArray a) -> Array.to_list a
      | _ -> [])
  | _ -> []

let tag_name (el : element) : string =
  Option.value (str_prop "tag" el) ~default:""

let class_list (el : element) : string list =
  match str_prop "class" el with
  | Some s ->
      List.filter
        (fun c -> c <> "")
        (String.split_on_char ' ' s)
  | None -> []

let el_id_attr (el : element) : string =
  Option.value (str_prop "id" el) ~default:""

(* duplicate of get_attribute below — the query section sits before it *)
let el_attr (el : element) (name : string) : string option =
  match prop "attrs" el with
  | Js.Json.JObject kvs ->
      Option.bind (List.assoc_opt name kvs) Js.Json.decodeString
  | _ -> str_prop ("attr-" ^ name) el

let has_attr (el : element) (name : string) : bool =
  el_attr el name <> None || (name = "class" && class_list el <> [])

type compound =
  { c_tag : string option
  ; c_classes : string list
  ; c_id : string option
  ; c_attrs : (string * string option) list
  ; c_nots : compound list }

(* parse one compound selector: [tag][.cls]*[#id]*[[attr[=v]]]*[:not(inner)]* *)
let rec parse_compound (s : string) : compound =
  let len = String.length s in
  let rec take_ident i =
    let j = ref i in
    while
      !j < len
      &&
      (let c = s.[!j] in
       (c >= 'a' && c <= 'z')
       || (c >= 'A' && c <= 'Z')
       || (c >= '0' && c <= '9')
       || c = '-' || c = '_' || c = '*' || c = '!')
    do
      incr j
    done;
    (String.sub s i (!j - i), !j)
  in
  (* balanced ')' — inner may itself contain :not(...) *)
  let take_bracket i open_c close_c =
    let depth = ref 1 in
    let j = ref (i + 1) in
    while !j < len && !depth > 0 do
      if s.[!j] = open_c then incr depth;
      if s.[!j] = close_c then decr depth;
      incr j
    done;
    (String.sub s (i + 1) (!j - i - 2), !j - 1)
  in
  let rec go i tag classes id attrs nots =
    if i >= len then
      { c_tag = tag
      ; c_classes = List.rev classes
      ; c_id = id
      ; c_attrs = List.rev attrs
      ; c_nots = List.rev nots }
    else
      match s.[i] with
      | '.' ->
          let name, j = take_ident (i + 1) in
          go j tag (name :: classes) id attrs nots
      | '#' ->
          let name, j = take_ident (i + 1) in
          go j tag classes (Some name) attrs nots
      | '[' ->
          let inner, j = take_bracket i '[' ']' in
          let name, value =
            match String.index_opt inner '=' with
            | Some eq ->
                ( String.sub inner 0 eq
                , Some
                    (String.sub inner (eq + 1)
                       (String.length inner - eq - 1)) )
            | None -> (inner, None)
          in
          go j tag classes id ((name, value) :: attrs) nots
      | ':'
        when i + 4 < len && String.sub s i 4 = ":not"
             && s.[i + 4] = '(' ->
          let inner, j = take_bracket (i + 4) '(' ')' in
          go j tag classes id attrs (parse_compound inner :: nots)
      | c
        when (c >= 'a' && c <= 'z')
             || (c >= 'A' && c <= 'Z')
             || c = '*' ->
          let name, j = take_ident i in
          go j (Some (String.lowercase_ascii name)) classes id attrs
            nots
      | _ -> go (i + 1) tag classes id attrs nots
  in
  go 0 None [] None [] []

let rec match_compound (el : element) (c : compound) : bool =
  (match c.c_tag with
   | Some t -> String.equal t (String.lowercase_ascii (tag_name el))
   | None -> true)
  && List.for_all (fun cls -> List.mem cls (class_list el)) c.c_classes
  && (match c.c_id with
      | Some i -> String.equal i (el_id_attr el)
      | None -> true)
  && List.for_all
       (fun (name, value) ->
         match value with
         | Some v -> el_attr el name = Some v
         | None -> has_attr el name)
       c.c_attrs
  && List.for_all (fun n -> not (match_compound el n)) c.c_nots

(* descendant chain: last compound matches the candidate, preceding ones
   must each match some ancestor, scanning outward in order *)
let match_chain (comps : compound list) (el : element)
    (ancestors : element list) : bool =
  match List.rev comps with
  | [] -> false
  | last :: rest -> (
      if not (match_compound el last) then false
      else
        let rec seek comps ancestors =
          match comps with
          | [] -> true
          | c :: cs -> (
              match ancestors with
              | [] -> false
              | a :: tail ->
                  if match_compound a c then seek cs tail
                  else seek (c :: cs) tail)
        in
        seek rest ancestors)

let selector_matches (sel : string) (el : element)
    (ancestors : element list) : bool =
  sel
  |> String.split_on_char ','
  |> List.exists (fun alt ->
         let comps =
           alt
           |> String.split_on_char ' '
           |> List.filter (fun c -> c <> "")
           |> List.map parse_compound
         in
         match_chain comps el ancestors)

let closest (el : element) (sel : string) : element option =
  let rec walk candidates ancestors =
    match candidates with
    | [] -> None
    | c :: rest ->
        if selector_matches sel c (rest @ ancestors) then Some c
        else walk rest (ancestors @ [ c ])
  in
  walk (el :: ancestors_of el) []

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
