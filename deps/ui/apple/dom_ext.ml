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

(* forward refs — the overlay table is defined below; installed there *)
let overlay_attr_fn : (element -> string -> string option option) ref =
  ref (fun _ _ -> None)

let overlay_class_fn : (element -> string option) ref =
  ref (fun _ -> None)

let el_id_attr (el : element) : string =
  match !overlay_attr_fn el "id" with
  | Some v -> Option.value v ~default:""
  | None -> Option.value (str_prop "id" el) ~default:""

(* duplicate of get_attribute below — the query section sits before it *)
let el_attr (el : element) (name : string) : string option =
  match !overlay_attr_fn el name with
  | Some verdict -> verdict
  | None -> (
      match prop "attrs" el with
      | Js.Json.JObject kvs ->
          Option.bind (List.assoc_opt name kvs) Js.Json.decodeString
      | _ -> str_prop ("attr-" ^ name) el)

(* the snapshot "class" prop mirrors style-class; elements that declare
   their class inside attrs keep it there instead — DOM semantics treat
   both as the same class list; dom-op mutations live in the overlay *)
let class_list (el : element) : string list =
  let words =
    match !overlay_class_fn el with
    | Some c -> c
    | None -> (
        match str_prop "class" el with
        | Some s when s <> "" -> s
        | _ -> (
            match el_attr el "class" with
            | Some s -> s
            | None -> ""))
  in
  List.filter (fun c -> c <> "") (String.split_on_char ' ' words)

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

(* ---------- scoped / child-combinator selectors ----------

   Element identity for :scope anchoring and `>` parent checks: prefer the
   runtime node-id, fall back to the DOM ref. *)
let el_key (el : element) : string =
  match num_prop "node-id" el with
  | Some n -> "n" ^ string_of_int (int_of_float n)
  | None -> (
      match str_prop "#ref" el with
      | Some r -> "r" ^ r
      | None -> (
          match str_prop "ref-id" el with
          | Some r -> "r" ^ r
          | None -> ""))

(* ---------- view-mutation overlay ----------

   dom-ops (set-attr/set-class/set-text) mutate the rendered SwiftUI tree
   but not runtime node props, so snapshot providers never see them.
   Matching and attribute reads merge this overlay, keyed by node-id;
   attr values are string option — None is a removal tombstone. *)
type overlay =
  { o_attrs : (string, string option) Hashtbl.t
  ; mutable o_class : string option
  ; mutable o_text : string option }

let overlays : (int, overlay) Hashtbl.t = Hashtbl.create 16

let node_id_of (el : element) : int option =
  match num_prop "node-id" el with
  | Some n -> Some (int_of_float n)
  | None -> None

let overlay_find (node : int) : overlay option =
  Hashtbl.find_opt overlays node

let overlay_get (node : int) : overlay =
  match overlay_find node with
  | Some o -> o
  | None ->
      let o =
        { o_attrs = Hashtbl.create 8; o_class = None; o_text = None }
      in
      Hashtbl.replace overlays node o;
      o

let overlay_drop (node : int) : unit = Hashtbl.remove overlays node

let overlay_set_attr (node : int) (k : string) (v : string) : unit =
  Hashtbl.replace (overlay_get node).o_attrs k (Some v)

let overlay_remove_attr (node : int) (k : string) : unit =
  Hashtbl.replace (overlay_get node).o_attrs k None

let overlay_set_class (node : int) (v : string) : unit =
  (overlay_get node).o_class <- Some v

let overlay_set_text (node : int) (v : string) : unit =
  (overlay_get node).o_text <- Some v

(* verdict: outer Some = overlay decides (Some v present / None removed);
   outer None = untouched, fall through to the snapshot *)
let overlay_attr_node (node : int) (name : string)
    : string option option =
  match overlay_find node with
  | Some o -> Hashtbl.find_opt o.o_attrs name
  | None -> None

let overlay_attr (el : element) (name : string) : string option option =
  match node_id_of el with
  | Some n -> overlay_attr_node n name
  | None -> None

let overlay_class_of (el : element) : string option =
  match node_id_of el with
  | Some n -> (
      match overlay_find n with Some o -> o.o_class | None -> None)
  | None -> None

let overlay_text_of (el : element) : string option =
  match node_id_of el with
  | Some n -> (
      match overlay_find n with Some o -> o.o_text | None -> None)
  | None -> None

let () =
  overlay_attr_fn := overlay_attr;
  overlay_class_fn := overlay_class_of

type sstep =
  { s_comb : [ `Desc | `Child ]
  ; s_comp : compound option (* None = :scope *) }

let is_scope_token t = t = ":scope"

(* split a single selector alternative into (combinator, compound) steps *)
let parse_steps (alt : string) : sstep list =
  alt
  |> String.split_on_char ' '
  |> List.filter (fun t -> t <> "")
  |> List.fold_left
       (fun (acc, next_comb) tok ->
         if tok = ">" then (acc, `Child)
         else if is_scope_token tok then
           ({ s_comb = next_comb; s_comp = None } :: acc, `Desc)
         else
           ({ s_comb = next_comb; s_comp = Some (parse_compound tok) }
              :: acc
           , `Desc))
       ([], `Desc)
  |> fst
  |> List.rev

let step_matches ~scope (el : element) (step : sstep) : bool =
  match step.s_comp with
  | None -> el_key el = el_key scope && el_key scope <> ""
  | Some c -> match_compound el c

(* match a step chain against (el, ancestors); ancestors nearest-first *)
let rec match_steps ~scope (steps : sstep list) (el : element)
    (ancestors : element list) : bool =
  match List.rev steps with
  | [] -> false
  | last :: rest -> (
      if not (step_matches ~scope el last) then false
      else
        let rec seek steps ancestors =
          match steps with
          | [] -> true
          | st :: ss -> (
              match ancestors with
              | [] -> false
              | a :: tail -> (
                  match st.s_comb with
                  | `Child ->
                      if step_matches ~scope a st then seek ss tail
                      else false
                  | `Desc ->
                      if step_matches ~scope a st then seek ss tail
                      else seek (st :: ss) tail))
        in
        seek rest ancestors)

let scoped_matches ~scope (sel : string) (el : element)
    (ancestors : element list) : bool =
  sel
  |> String.split_on_char ','
  |> List.exists (fun alt ->
         match parse_steps alt with
         | [] -> false
         | steps -> match_steps ~scope steps el ancestors)

let query_selector_all_scoped ~(scope : element) ~(els : element list)
    (sel : string) : element list =
  List.filter
    (fun el -> scoped_matches ~scope sel el (ancestors_of el))
    els

(* The apple "DOM" is the LUI extension tree — native_embed installs
   providers returning element snapshots (same shape the Swift
   LogseqDOMSnapshot emits: tag/class/id/attrs/node-id + ancestors) so the
   selector engine works unchanged. *)
let doc_elements_provider : (unit -> Js.Json.t list) ref =
  ref (fun () -> [])
let subtree_elements_provider : (int -> Js.Json.t list) ref =
  ref (fun _ -> [])

let query_selector (el : element) (sel : string) : element option =
  match num_prop "node-id" el with
  | Some id ->
      let els = !subtree_elements_provider (int_of_float id) in
      List.find_opt
        (fun e -> scoped_matches ~scope:el sel e (ancestors_of e))
        els
  | None -> None

let query_selector_all (el : element) (sel : string) : element list =
  match num_prop "node-id" el with
  | Some id ->
      let els = !subtree_elements_provider (int_of_float id) in
      query_selector_all_scoped ~scope:el ~els sel
  | None -> []

let doc_query_selector (sel : string) : element option =
  List.find_opt
    (fun el -> scoped_matches ~scope:document_el sel el (ancestors_of el))
    (!doc_elements_provider ())

let doc_query_selector_all (sel : string) : element list =
  query_selector_all_scoped ~scope:document_el
    ~els:(!doc_elements_provider ()) sel

(* ---------- element state ---------- *)

(* live (value, selectionStart, selectionEnd) per DOM id — element
   snapshots carry event-time values, but a browser's el.value tracks
   typing. Editor_dom's pre_dispatch_hook refreshes these from event
   payloads; readers fall back to the snapshot prop when no live field
   is recorded (e.g. a snapshot stored across later keystrokes). *)
let live_fields : (string, string * int * int) Hashtbl.t =
  Hashtbl.create 16

let dom_id_of (el : element) : string option =
  match str_prop "id" el with
  | Some id when id <> "" -> Some id
  | _ -> str_prop "ref-id" el

let live_field (el : element) : (string * int * int) option =
  match dom_id_of el with
  | Some id -> Hashtbl.find_opt live_fields id
  | None -> None

let get_attribute_raw (el : element) (name : string) : string option =
  match prop "attrs" el with
  | Js.Json.JObject kvs ->
      Option.bind (List.assoc_opt name kvs) Js.Json.decodeString
  | _ -> str_prop ("attr-" ^ name) el

let get_attribute (el : element) (name : string) : string option =
  match overlay_attr el name with
  | Some verdict -> verdict
  | None -> get_attribute_raw el name

let value (el : element) : string =
  match live_field el with
  | Some (v, _, _) -> v
  | None -> Option.value (str_prop "value" el) ~default:""

let set_value (el : element) (v : string) : unit =
  (match dom_id_of el with
   | Some id -> (
       match Hashtbl.find_opt live_fields id with
       | Some (_, s, e) -> Hashtbl.replace live_fields id (v, s, e)
       | None -> Hashtbl.replace live_fields id (v, 0, 0))
   | None -> ());
  Host.dom_op "set-value" (Js.Json.stringify (Js.Json.JObject [("ref", el); ("value", Js.Json.JString v)]))

let selection_start (el : element) : int =
  match live_field el with
  | Some (_, s, _) -> s
  | None ->
      Option.value
        (Option.map int_of_float (num_prop "selectionStart" el))
        ~default:0

let selection_end (el : element) : int =
  match live_field el with
  | Some (_, _, e) -> e
  | None ->
      Option.value
        (Option.map int_of_float (num_prop "selectionEnd" el))
        ~default:0

let set_selection_range (el : element) (s : int) (e : int) : unit =
  (match dom_id_of el with
   | Some id -> (
       match Hashtbl.find_opt live_fields id with
       | Some (v, _, _) -> Hashtbl.replace live_fields id (v, s, e)
       | None -> Hashtbl.replace live_fields id ("", s, e))
   | None -> ());
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

(* Document-tree snapshots carry no "rect" — the host measures on demand:
   bounding_rect fires a "measure-node" dom-op; the Swift host replies
   with a "node-rect" event whose rect lands here. Retry loops (popup
   flip measurement) see the fresh value on their next tick. *)
let rect_store : (int, Js.Json.t) Hashtbl.t = Hashtbl.create 32

let note_node_rect (j : Js.Json.t) : unit =
  match Option.map int_of_float (num_prop "nodeId" j) with
  | Some id -> (
      match prop "rect" j with
      | Js.Json.JObject _ as r -> Hashtbl.replace rect_store id r
      | _ -> Hashtbl.remove rect_store id)
  | None -> ()

let bounding_rect (el : element) : rect =
  match prop "rect" el with
  | Js.Json.JObject _ as r -> r
  | _ -> (
      (match num_prop "node-id" el with
       | Some _ ->
           Host.dom_op "measure-node"
             (Js.Json.stringify (Js.Json.JObject [("ref", el)]))
       | None -> ());
      match Option.map int_of_float (num_prop "node-id" el) with
      | Some id -> (
          match Hashtbl.find_opt rect_store id with
          | Some r -> r
          | None -> Js.Json.JObject [])
      | None -> Js.Json.JObject [])

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

let window_inner_height () = Host.inner_height ()
let window_inner_width () = Host.inner_width ()

(* The semantic topbar's dots button records its resolved anchor here on
   each press (button right edge, bottom + 4) so popups that re-anchor
   to the same trigger (appearance) can read it without a DOM query. *)
let toolbar_dots_pos : (float * float) option ref = ref None

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
          [("ref", el); ("property", Js.Json.JString name); ("value", Js.Json.JString v)]))

(* The host owns layout — ask its ScrollView to bring the row into view
   (the web twin computes the minimal scroll delta itself). *)
let scroll_row_into_view ~scroller ~row =
  Host.dom_op "scroll-row-into-view"
    (Js.Json.stringify
       (Js.Json.JObject [("scroller", scroller); ("row", row)]))

(* cljs editor.cljs popup pos: x = caret.left - 20, y = caret line
   bottom, also returning the caret line top for flip-above math.
   Textarea event targets carry "caretRect" (the IME caret rect in
   window top-left space); snapshots without it fall back to the
   element's bottom-left corner. *)
let caret_popup_pos el =
  match prop "caretRect" el with
  | Js.Json.JObject _ as r ->
      (rect_left r -. 20., rect_bottom r, rect_top r)
  | _ ->
      let r = bounding_rect el in
      (rect_left r -. 20., rect_bottom r +. 4., 0.)

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
