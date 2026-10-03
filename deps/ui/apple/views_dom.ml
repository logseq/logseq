(* Native twin of views/views_dom.ml — imperative el creation registers a
   {#new:n} node in Shadow_dom; the Swift shadow store materializes it from
   the dom-op channel under the classified host element (an LUI node, a
   dom-id anchor, or document.body). *)

open Js.Json

type el = Js.Json.t
type ev = Js.Json.t
type rect = Js.Json.t

let new_el ?(tag = "div") () = Shadow_dom.register ~tag ()

let doc_op = Shadow_dom.doc_op
let host_fields = Shadow_dom.host_fields
let shadow_field = Shadow_dom.shadow_field
let attach_child = Shadow_dom.attach_child
let detach_child = Shadow_dom.detach_child

(* ---------- element lifecycle ops ---------- *)

let el_remove (el : el) : unit =
  detach_child el;
  (match Shadow_dom.id_of el with
   | Some id -> Shadow_dom.remove id
   | None -> ());
  doc_op "remove" (JObject ([ ("ref", el) ] @ shadow_field el))

let el_replace_children (el : el) : unit =
  (match Shadow_dom.id_of el with
   | Some id -> (
       match Shadow_dom.get id with
       | Some n ->
           List.iter
             (fun c ->
               match Shadow_dom.id_of c with
               | Some cid -> Shadow_dom.remove cid
               | None -> ())
             n.Shadow_dom.s_children;
           n.Shadow_dom.s_children <- []
       | None -> ())
   | None -> ());
  doc_op "replace-children"
    (JObject ([ ("ref", el) ] @ shadow_field el @ host_fields el))

let el_children (el : el) : Js.Json.t =
  match Shadow_dom.id_of el with
  | Some id -> (
      match Shadow_dom.get id with
      | Some n -> JArray (Array.of_list n.Shadow_dom.s_children)
      | None -> JArray [||])
  | None -> JArray [||]

let el_parent (el : el) : el option =
  match Shadow_dom.id_of el with
  | Some id -> (
      match Shadow_dom.get id with
      | Some n -> n.Shadow_dom.s_parent
      | None -> None)
  | None -> None

let el_is_connected (el : el) : bool =
  match Shadow_dom.id_of el with
  | Some _ -> el_parent el <> None
  | None -> true (* mounted snapshots are connected *)

let el_text_content (el : el) : string =
  match Shadow_dom.id_of el with
  | Some id -> (
      match Shadow_dom.get id with
      | Some n -> n.Shadow_dom.s_text
      | None -> "")
  | None -> (
      match el with
      | JObject kvs ->
          Option.bind (List.assoc_opt "text" kvs) decodeString
          |> Option.value ~default:""
      | _ -> "")

let el_set_text_content (el : el) (v : string) : unit =
  (match Shadow_dom.id_of el with
   | Some id -> (
       match Shadow_dom.get id with
       | Some n ->
           List.iter
             (fun c ->
               match Shadow_dom.id_of c with
               | Some cid -> Shadow_dom.remove cid
               | None -> ())
             n.Shadow_dom.s_children;
           n.Shadow_dom.s_children <- [];
           n.Shadow_dom.s_text <- v
       | None -> ())
   | None -> ());
  doc_op "set-text-content"
    (JObject ([ ("ref", el); ("text", JString v) ] @ shadow_field el))

let el_insert_adjacent_text (el : el) (pos : string) (v : string) : unit =
  doc_op "insert-adjacent-text"
    (JObject
       ([ ("ref", el); ("pos", JString pos); ("text", JString v) ]
       @ shadow_field el))

(* ---------- shadow event dispatch ---------- *)

(* The Swift host posts ONE "shadow-event" per UI interaction on a shadow
   node: {name, target:<shadow-id>, ...fields}. Listeners registered on
   the target and its shadow ancestors run in bubble order (respecting
   stopPropagation via the ##dispatch tag), then the event continues into
   the LUI host: the recorded parent host's node-id drives emit_event's
   LUI bubble + window/document listeners so document-level handlers
   (outside-click dismissals, a.page-ref navigation) see shadow events
   like real DOM events. *)

let collect_shadow_chain (el : el) : Shadow_dom.node list =
  let rec walk el acc =
    match Shadow_dom.id_of el with
    | Some id -> (
        match Shadow_dom.get id with
        | Some n -> (
            match n.Shadow_dom.s_parent with
            | Some p -> walk p (n :: acc)
            | None -> n :: acc)
        | None -> acc)
    | None -> acc
  in
  walk el []

let dispatch_shadow (name : string) (target_id : int)
    (fields : (string * Js.Json.t) list) : unit =
  match Shadow_dom.get target_id with
  | None -> ()
  | Some target ->
      Shadow_dom.prune_flags ();
      let did = Shadow_dom.begin_dispatch () in
      (* refresh live value/checked on the shadow from the event payload *)
      (match List.assoc_opt "value" fields with
       | Some v -> (
           match decodeString v with
           | Some s -> target.Shadow_dom.s_value <- s
           | None -> ())
       | None -> ());
      (match List.assoc_opt "checked" fields with
       | Some v -> (
           match decodeBoolean v with
           | Some b -> target.Shadow_dom.s_checked <- b
           | None -> ())
       | None -> ());
      let ev =
        JObject
          ([ ("name", JString name)
           ; ("target", Shadow_dom.snapshot target)
           ; ("##dispatch", JNumber did) ]
          @ fields)
      in
      (* bubble through the shadow chain, target first *)
      List.iter
        (fun n ->
          if not (Shadow_dom.is_stopped did) then
            List.iter
              (fun f ->
                try f ev
                with e ->
                  Printf.eprintf "[shadow %s] handler exn: %s\n%!" name
                    (Printexc.to_string e))
              (Shadow_dom.listeners_of n.Shadow_dom.s_id name))
        (List.rev
           (collect_shadow_chain
              (JObject [ ("#new", JNumber (Float.of_int target_id)) ])));
      (* default action: a[href^="#"] navigates like a real link *)
      if
        name = "click"
        && (not (Shadow_dom.is_prevented did))
        && (not (Shadow_dom.is_stopped did))
      then begin
        let rec find_href (el : el) : string option =
          match Shadow_dom.id_of el with
          | Some id -> (
              match Shadow_dom.get id with
              | Some n ->
                  if n.Shadow_dom.s_tag = "a" then
                    match Shadow_dom.get_attr n "href" with
                    | Some h -> Some h
                    | None -> (
                        match n.Shadow_dom.s_parent with
                        | Some p -> find_href p
                        | None -> None)
                  else (
                    match n.Shadow_dom.s_parent with
                    | Some p -> find_href p
                    | None -> None)
              | None -> None)
          | None -> None
        in
        match
          find_href (JObject [ ("#new", JNumber (Float.of_int target_id)) ])
        with
        | Some href when String.length href > 0 && href.[0] = '#' ->
            Runtime.mark_nav ();
            Platform.set_location_hash (Runtime.nav_hash href)
        | _ -> ()
      end;
      (* continue into the host unless stopped *)
      if not (Shadow_dom.is_stopped did) then begin
        let host =
          match target.Shadow_dom.s_parent with
          | Some p -> Shadow_dom.host_ref_of p
          | None -> Shadow_dom.Host_body
        in
        let fields' =
          match host with
          | Shadow_dom.Host_node n ->
              [ ("nodeId", JNumber (Float.of_int n)) ]
          | Shadow_dom.Host_dom_id s -> (
              match
                Option.bind
                  ((!Shadow_dom.lui_snapshot_by_dom_id) s)
                  (fun snap ->
                    match snap with
                    | JObject kvs -> (
                        match List.assoc_opt "node-id" kvs with
                        | Some v -> decodeNumber v
                        | None -> None)
                    | _ -> None)
              with
              | Some n -> [ ("nodeId", JNumber n) ]
              | None -> [])
          | _ -> []
        in
        let payload =
          match ev with
          | JObject kvs -> JObject (kvs @ fields')
          | other -> other
        in
        Platform.emit_event name payload
      end

(* posted once at module init; the Swift store's emit() lands here *)
let () =
  Platform.add_event_listener "shadow-event" (fun payload ->
      match payload with
      | JObject kvs -> (
          match
            ( List.assoc_opt "name" kvs
            , List.assoc_opt "target" kvs )
          with
          | Some name_j, Some target_j -> (
              match (decodeString name_j, decodeNumber target_j) with
              | Some name, Some t ->
                  let fields =
                    List.filter
                      (fun (k, _) -> k <> "name" && k <> "target")
                      kvs
                  in
                  dispatch_shadow name (int_of_float t) fields
              | _ -> ())
          | _ -> ())
      | _ -> ());
  (* host frame push: {frames:{<id>:{left,top,right,bottom}}} *)
  Platform.add_event_listener "shadow-frames" (fun payload ->
      match payload with
      | JObject kvs -> (
          match List.assoc_opt "frames" kvs with
          | Some (JObject frames) ->
              List.iter
                (fun (k, v) ->
                  match int_of_string_opt k with
                  | Some id -> (
                      let f key =
                        match v with
                        | JObject kvs ->
                            Option.bind (List.assoc_opt key kvs)
                              decodeNumber
                        | _ -> None
                      in
                      match
                        (f "left", f "top", f "right", f "bottom")
                      with
                      | Some l, Some t, Some r, Some b ->
                          Shadow_dom.set_rect id l t r b
                      | _ -> ())
                  | None -> ())
                frames
          | _ -> ())
      | _ -> ())

(* programmatic click → dispatch a click through the shadow listener
   chain (DOM .click() semantics: listeners fire, host continues) *)
let el_click (el : el) : unit =
  match Shadow_dom.id_of el with
  | Some id -> dispatch_shadow "click" id []
  | None -> ()

let el_blur (_ : el) : unit = ()

let el_checked (el : el) : bool =
  match Shadow_dom.id_of el with
  | Some id -> (
      match Shadow_dom.get id with
      | Some n -> n.Shadow_dom.s_checked
      | None -> false)
  | None -> (
      match el with
      | JObject kvs ->
          Option.bind (List.assoc_opt "checked" kvs) decodeBoolean
          |> Option.value ~default:false
      | _ -> false)

let el_set_checked (el : el) (b : bool) : unit =
  (match Shadow_dom.id_of el with
   | Some id -> (
       match Shadow_dom.get id with
       | Some n -> n.Shadow_dom.s_checked <- b
       | None -> ())
   | None -> ());
  doc_op "set-checked"
    (JObject ([ ("ref", el); ("checked", JBoolean b) ] @ shadow_field el))

(* ---------- tree mutation ops ---------- *)

let el_insert_before (parent : el) (child : el) (before : el option) : unit =
  Shadow_dom.insert_before parent child before

let el_append_child (parent : el) (child : el) : unit =
  Shadow_dom.append_child parent child

(* ---------- listeners ---------- *)

let el_add_listener (el : el) (name : string) (f : ev -> unit) : unit =
  match Shadow_dom.id_of el with
  | Some id -> Shadow_dom.add_listener id name f
  | None -> Platform.add_event_listener name f

let el_add_listener_capture (el : el) (name : string) (f : ev -> unit)
    : unit =
  el_add_listener el name f

let el_remove_listener (el : el) (name : string) (f : ev -> unit) : unit =
  match Shadow_dom.id_of el with
  | Some id -> Shadow_dom.remove_listener id name f
  | None -> ()

let el_contains (a : el) (b : el) : bool = Editor_dom.el_contains a b

(* ---------- attrs ---------- *)

let el_placeholder (el : el) (v : string) : unit =
  doc_op "set-attr"
    (JObject
       ([ ("ref", el); ("name", JString "placeholder"); ("value", JString v) ]
       @ shadow_field el));
  match Shadow_dom.id_of el with
  | Some id -> (
      match Shadow_dom.get id with
      | Some n -> Shadow_dom.set_attr n "placeholder" v
      | None -> ())
  | None -> ()

let el_type (el : el) (v : string) : unit =
  doc_op "set-attr"
    (JObject
       ([ ("ref", el); ("name", JString "type"); ("value", JString v) ]
       @ shadow_field el));
  match Shadow_dom.id_of el with
  | Some id -> (
      match Shadow_dom.get id with
      | Some n -> Shadow_dom.set_attr n "type" v
      | None -> ())
  | None -> ()

let el_scroll_into_view (el : el) : unit =
  doc_op "scroll-into-view" (JObject ([ ("ref", el) ] @ shadow_field el))

let el_has_attr (el : el) (name : string) : bool =
  match Shadow_dom.id_of el with
  | Some id -> (
      match Shadow_dom.get id with
      | Some n -> Shadow_dom.get_attr n name <> None
      | None -> false)
  | None -> Editor_dom.el_has_attr el name

let el_get_attr (el : el) (name : string) : string option =
  match Shadow_dom.id_of el with
  | Some id -> (
      match Shadow_dom.get id with
      | Some n -> Shadow_dom.get_attr n name
      | None -> None)
  | None -> Editor_dom.el_get_attr el name

let el_set_attr (el : el) (name : string) (v : string) : unit =
  (match Shadow_dom.id_of el with
   | Some id -> (
       match Shadow_dom.get id with
       | Some n -> Shadow_dom.set_attr n name v
       | None -> ())
   | None -> Editor_dom.record_attr_override el name v);
  doc_op "set-attr"
    (JObject
       ([ ("ref", el); ("name", JString name); ("value", JString v) ]
       @ shadow_field el))

let el_set_class (el : el) (c : string) : unit = el_set_attr el "class" c

let el_remove_attr (el : el) (name : string) : unit =
  (match Shadow_dom.id_of el with
   | Some id -> (
       match Shadow_dom.get id with
       | Some n -> Shadow_dom.remove_attr n name
       | None -> ())
   | None -> Editor_dom.remove_attr_override el name);
  doc_op "remove-attr"
    (JObject ([ ("ref", el); ("name", JString name) ] @ shadow_field el))

let el_scroll_top (_ : el) : float = 0.
let el_scroll_height (_ : el) : float = 0.
let el_client_height (_ : el) : float = 0.
let el_client_width (_ : el) : float = 0.

let el_inner_html_set (el : el) (v : string) : unit =
  doc_op "set-inner-html"
    (JObject ([ ("ref", el); ("html", JString v) ] @ shadow_field el))

let el_query_all (el : el) (sel : string) : Js.Json.t =
  Editor_dom.el_query_all el sel

let el_focus (el : el) : unit =
  doc_op "focus" (JObject ([ ("ref", el) ] @ shadow_field el))

let document_body : el = JObject [ ("#ref", JNumber (-1.)) ]
let window_inner_height : float = Host.inner_height ()

let el_rect (el : el) : rect =
  match Shadow_dom.id_of el with
  | Some id -> (
      match Shadow_dom.rect_of id with
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
    Shadow_dom.register ~tag ~cls ~attrs
      ~text:(Option.value ~default:"" text)
      ()
  in
  let id =
    match Shadow_dom.id_of j with Some i -> i | None -> assert false
  in
  let reg (name : string) (f : (ev -> unit) option) =
    match f with
    | Some g -> Shadow_dom.add_listener id name g
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
  (match Shadow_dom.id_of el with
   | Some id -> (
       match Shadow_dom.get id with
       | Some n ->
           doc_op "focus"
             (JObject
                ([ ("ref", el)
                 ; ("selectionStart", JNumber (Float.of_int (String.length n.Shadow_dom.s_value)))
                 ; ("selectionEnd", JNumber (Float.of_int (String.length n.Shadow_dom.s_value))) ]
                @ shadow_field el))
       | None -> ())
   | None -> ());
  el_focus el

let query_inside (root : el) (sel : string) : el option =
  Editor_dom.el_query root sel

let el_class_add (el : el) (c : string) : unit =
  (match Shadow_dom.id_of el with
   | Some id -> (
       match Shadow_dom.get id with
       | Some n ->
           Shadow_dom.set_attr n "class"
             (String.trim (n.Shadow_dom.s_cls ^ " " ^ c))
       | None -> ())
   | None -> ());
  doc_op "class-add"
    (JObject ([ ("ref", el); ("class", JString c) ] @ shadow_field el))

let el_class_remove (el : el) (c : string) : unit =
  (match Shadow_dom.id_of el with
   | Some id -> (
       match Shadow_dom.get id with
       | Some n ->
           Shadow_dom.set_attr n "class"
             (String.concat " "
                (List.filter
                   (fun t -> t <> "" && t <> c)
                   (String.split_on_char ' ' n.Shadow_dom.s_cls)))
       | None -> ())
   | None -> ());
  doc_op "class-remove"
    (JObject ([ ("ref", el); ("class", JString c) ] @ shadow_field el))

let el_set_value (el : el) (v : string) : unit =
  (match Shadow_dom.id_of el with
   | Some id -> (
       match Shadow_dom.get id with
       | Some n -> n.Shadow_dom.s_value <- v
       | None -> ())
   | None -> ());
  doc_op "set-value"
    (JObject ([ ("ref", el); ("value", JString v) ] @ shadow_field el))

let ev_detail (e : ev) : Js.Json.t option =
  match e with
  | JObject kvs -> List.assoc_opt "detail" kvs
  | _ -> None

let el_value (el : el) : string =
  match Shadow_dom.id_of el with
  | Some id -> (
      match Shadow_dom.get id with
      | Some n -> n.Shadow_dom.s_value
      | None -> "")
  | None -> (
      match el with
      | JObject kvs ->
          Option.bind (List.assoc_opt "value" kvs) decodeString
          |> Option.value ~default:""
      | _ -> "")
