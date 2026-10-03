(* Shadow registry for {#new:n} elements.

   Views build their DOM imperatively (`D.h` -> `el_append_child` -> ...).
   Each {#new:n} node is materialized as a real LUI node in the runtime
   tree: semantic LUI kinds (Column/Row/ListItem/Text/TextField/...) for
   ordinary content, `logseq-<tag>` extension elements where the DOM shape
   matters — SVG subtrees, em-emoji, position:fixed/absolute popups, and
   select/img tags whose LUI kind cannot host the same children. Element
   state (attrs, children, value, listeners, rects) lives OCaml-side so
   reads and event dispatch resolve without a host round-trip, and
   closest()/query helpers see a single unified ancestor chain: shadow
   parents first, then the LUI host's own snapshot chain.

   Events: LUI nodes wire `Lui_runtime.on_event` (protocol events are
   re-emitted as DOM names through `Platform.emit_event`, which bubbles
   via runtime_parents through the per-node `dom_handlers` trampolines);
   extension elements wire the `events` prop like Logseq_dom.dom does.
   Both land in the same listener table keyed by {#new} id. *)

open Lui_protocol
open Js.Json

type el = Js.Json.t

type backing =
  | B_lui of node_kind
  | B_ext of string (* "logseq-<tag>" *)
  | B_none (* hidden / non-visual elements *)

type node =
  { s_id : int
  ; s_el : el (* the {#new:n} payload handed to callers — stable for == *)
  ; s_tag : string
  ; mutable s_cls : string
  ; mutable s_attrs : (string * string) list
  ; mutable s_text : string
  ; mutable s_children : el list (* {#new}/{#text} payloads *)
  ; mutable s_parent : el option (* parent payload passed to append/insert *)
  ; mutable s_value : string
  ; mutable s_checked : bool
  ; mutable s_lui : int (* LUI node id; 0 when unmaterialized *)
  ; mutable s_backing : backing
  ; mutable s_scope : Signal.scope option (* per-node scope for on_event *)
  ; mutable s_text_child : int (* synthesized Text child id, or 0 *)
  ; mutable s_body_attached : bool (* hosted in the body overlay layer *)
  }

let nodes : (int, node) Hashtbl.t = Hashtbl.create 256
let listeners : (int, (string * (Js.Json.t -> unit)) list) Hashtbl.t =
  Hashtbl.create 64
(* node-id -> rect in window space; filled by the "shadow-frames" channel
   (all runtime nodes, not just {#new} ones) *)
let rects : (int, float * float * float * float) Hashtbl.t =
  Hashtbl.create 64
let lui_index : (int, int) Hashtbl.t = Hashtbl.create 256 (* lui -> shadow *)
let next_id = ref 0

(* ---------- runtime wiring ---------- *)

let lui_app : Lui_runtime.application option ref = ref None
let host_scope : Signal.scope option ref = ref None

let install (app : Lui_app.t) (scope : Signal.scope) =
  lui_app := Some (Lui_app.runtime app);
  host_scope := Some scope

let app () =
  match !lui_app with
  | Some app -> app
  | None -> invalid_arg "Shadow_dom.install not called"

(* LUI-snapshot lookups — installed by editor_dom (which owns the element
   providers), used to splice the host ancestor chain into synthesized
   shadow snapshots. *)
let lui_snapshot_by_node_id : (int -> Js.Json.t option) ref =
  ref (fun _ -> None)

let lui_snapshot_by_dom_id : (string -> Js.Json.t option) ref =
  ref (fun _ -> None)

(* node-id of the element carrying this DOM id (accessibility-identifier) —
   installed by editor_dom; used to attach under dom-id hosts *)
let lui_node_by_dom_id : (string -> int option) ref = ref (fun _ -> None)

let alloc () =
  incr next_id;
  !next_id

let get id = Hashtbl.find_opt nodes id

let id_of (el : el) : int option =
  match el with
  | JObject kvs -> (
      match List.assoc_opt "#new" kvs with
      | Some v -> Option.map int_of_float (decodeNumber v)
      | None -> None)
  | _ -> None

(* ---------- backing choice ---------- *)

let cls_words s =
  String.split_on_char ' ' s
  |> List.filter (fun w -> w <> "")

let cls_has cls w = List.mem w (cls_words cls)
let cls_has_prefix cls p = List.exists (fun w ->
    String.length w >= String.length p
    && String.sub w 0 (String.length p) = p) (cls_words cls)

let attr_of attrs name = List.assoc_opt name attrs

let style_declares style prop value =
  let needle = prop ^ ":" ^ value in
  (* "position:fixed" also matches "position: fixed" *)
  let needle' = prop ^ ": " ^ value in
  let rec contains sub str =
    let l = String.length sub in
    if String.length str < l then false
    else if String.sub str 0 l = sub then true
    else contains sub (String.sub str 1 (String.length str - 1))
  in
  contains needle style || contains needle' style

let is_floating attrs cls =
  (match attr_of attrs "style" with
   | Some style ->
       style_declares style "position" "fixed"
       || style_declares style "position" "absolute"
   | None -> false)
  || cls_has cls "fixed"
  || cls_has cls "absolute"

let is_hidden attrs cls =
  (match attr_of attrs "type" with
   | Some "hidden" -> true
   | _ -> false)
  || (match attr_of attrs "style" with
      | Some style -> style_declares style "display" "none"
      | None -> false)
  || cls_has cls "hidden"
  || cls_has cls "checkbox_hidden_input"
  || attr_of attrs "aria-hidden" = Some "true"

let svg_tags =
  [ "svg"; "path"; "circle"; "rect"; "line"; "polyline"; "polygon"; "g"
  ; "defs"; "use"; "ellipse"; "tspan" ]

(* elements whose DOM shape must be preserved — no LUI kind covers them *)
let ext_tags =
  svg_tags @ [ "em-emoji"; "raw-text"; "pdf"; "iframe"; "canvas"; "video"
             ; "audio"; "img"; "i"; "select"; "option" ]

let none_tags = [ "script"; "style"; "template"; "noscript" ]

(* in-flow row when the class asks for horizontal layout *)
let rowish cls =
  cls_has cls "flex-row"
  || (cls_has cls "flex" && not (cls_has cls "flex-col"))
  || cls_has cls "inline-flex"
  || cls_has_prefix cls "ls-table-row"
  || cls_has cls "filters-row"
  || cls_has cls "ls-vf-chip-row"

let scrollable cls =
  cls_has_prefix cls "overflow-x-auto" || cls_has cls "overflow-auto"
  || cls_has cls "overflow-y-auto" || cls_has cls "overflow-x-scroll"

let text_leaf tag =
  List.mem tag
    [ "#text"; "em"; "strong"; "b"; "u"; "mark"; "small"; "kbd"; "code"
    ; "abbr"; "del"; "ins"; "q"; "s"; "sub"; "sup"; "time"; "var"; "wbr" ]

let kind_of ~tag ~cls ~attrs : node_kind option =
  match tag with
  | "input" -> (
      match attr_of attrs "type" with
      | Some ("checkbox" | "radio") -> Some Checkbox
      | Some "password" -> Some SecureField
      | Some "hidden" -> None
      | _ ->
          if cls_has cls "search" || cls_has cls "cp__select-input"
             || cls_has cls "ls-search-input" || cls_has cls "ls-view-search"
          then Some SearchField
          else Some TextField)
  | "textarea" -> Some Textarea
  | "a" | "button" | "label" -> Some ListItem
  | "button" when attr_of attrs "role" = Some "checkbox" -> Some Checkbox
  | "li" | "tr" -> Some ListItem
  | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" -> Some Heading
  | "p" -> Some Paragraph
  | "hr" -> Some Divider
  | "br" -> Some Text
  | _ when text_leaf tag -> Some Text
  | "span" -> Some (if rowish cls then ListItem else Text)
  | _ ->
      if cls_has cls "ls-vf-spacer" then Some Spacer
      else if rowish cls then Some Row
      else Some Column

(* floating shells keep the extension element so the existing out-of-flow
   positioning (LogseqStyle position:fixed -> overlay pin) applies *)
let desired_backing ~tag ~cls ~attrs : backing =
  if List.mem tag none_tags || is_hidden attrs cls then B_none
  else if List.mem tag ext_tags then B_ext ("logseq-" ^ tag)
  else if is_floating attrs cls then B_ext ("logseq-" ^ tag)
  else
    match kind_of ~tag ~cls ~attrs with
    | Some k -> B_lui k
    | None ->
        if List.mem tag Logseq_dom.tags then B_ext ("logseq-" ^ tag)
        else B_lui Column

(* ---------- class -> LUI props ---------- *)

let tailwind_px w prefix =
  let plen = String.length prefix in
  if String.length w > plen && String.sub w 0 plen = prefix then
    let rest = String.sub w plen (String.length w - plen) in
    if String.length rest >= 2 && rest.[0] = '[' then
      (* [NNNpx] arbitrary value *)
      let inner =
        try String.sub rest 1 (String.index rest ']') - 1
        with Not_found -> ""
      in
      if String.length inner >= 2
         && String.sub inner (String.length inner - 2) 2 = "px"
      then int_of_string_opt (String.sub inner 0 (String.length inner - 2))
      else None
    else
      match float_of_string_opt rest with
      | Some n -> Some (int_of_float (n *. 4.))
      | None -> None
  else None

(* emits (property, wire_value) pairs for the classes we can express *)
let cls_props cls : (property * wire_value) list =
  let props = ref [] in
  let add p v = props := (p, v) :: !props in
  List.iter
    (fun w ->
      let px prefixes =
        List.find_map (fun p -> tailwind_px w p) prefixes
      in
      match w with
      | "flex-1" | "grow" | "flex-grow" | "w-full" | "flex-auto" ->
          add GrowValue (FloatValue 1.)
      | "shrink-0" | "flex-none" -> ()
      | "items-center" -> add CrossAlignment (StringValue "center")
      | "items-start" | "items-top" ->
          add CrossAlignment (StringValue "start")
      | "items-end" | "items-bottom" ->
          add CrossAlignment (StringValue "end")
      | "items-stretch" -> add CrossAlignment (StringValue "stretch")
      | "justify-center" -> add MainAlignment (StringValue "center")
      | "justify-end" -> add MainAlignment (StringValue "end")
      | "justify-between" | "justify-space-between" ->
          add MainAlignment (StringValue "space-between")
      | "justify-start" -> add MainAlignment (StringValue "start")
      | "text-center" -> add TextAlignment (StringValue "center")
      | "text-right" -> add TextAlignment (StringValue "right")
      | "text-left" -> add TextAlignment (StringValue "left")
      | "rounded" -> add CornerRadius (IntValue 4)
      | "rounded-md" -> add CornerRadius (IntValue 6)
      | "rounded-lg" -> add CornerRadius (IntValue 8)
      | "rounded-full" -> add CornerRadius (IntValue 999)
      | "border" | "border-b" | "border-t" | "border-l" | "border-r" ->
          add BorderWidth (IntValue 1);
          add BorderColorValue (StringValue "border")
      | _ -> (
          match px [ "gap-" ] with
          | Some n -> add Gap (IntValue n)
          | None -> (
              match px [ "p-" ] with
              | Some n -> add PaddingValue (IntValue n)
              | None -> (
                  match px [ "px-" ] with
                  | Some n -> add PaddingHorizontal (IntValue n)
                  | None -> (
                      match px [ "py-" ] with
                      | Some n -> add PaddingVertical (IntValue n)
                      | None -> (
                          match px [ "pt-"; "pb-" ] with
                          | Some n -> add PaddingVertical (IntValue n)
                          | None -> (
                              match px [ "pl-"; "pr-" ] with
                              | Some n -> add PaddingHorizontal (IntValue n)
                              | None -> (
                                  match px [ "w-" ] with
                                  | Some n -> add WidthValue (IntValue n)
                                  | None -> (
                                      match px [ "h-" ] with
                                      | Some n -> add HeightValue (IntValue n)
                                      | None -> (
                                          match px [ "min-w-" ] with
                                          | Some n ->
                                              add MinWidth (IntValue n)
                                          | None -> (
                                              match px [ "min-h-" ] with
                                              | Some n ->
                                                  add MinHeight (IntValue n)
                                              | None -> (
                                                  match px [ "max-w-" ] with
                                                  | Some n ->
                                                      add MaxWidth (IntValue n)
                                                  | None -> (
                                                      match px [ "max-h-" ]
                                                      with
                                                      | Some n ->
                                                          add MaxHeight
                                                            (IntValue n)
                                                      | None -> ()))))))))))))))
    (cls_words cls);
  !props

(* ---------- dispatch flags ---------- *)

(* Per-dispatch stop/prevent flags: listeners mark the synthetic event via
   Editor_dom.stop_propagation / prevent_default which route here through
   the "##dispatch" field carried on the event payload. *)
let stopped : (float, unit) Hashtbl.t = Hashtbl.create 8
let prevented : (float, unit) Hashtbl.t = Hashtbl.create 8
let immediates : (float, unit) Hashtbl.t = Hashtbl.create 8
let dispatch_seq = ref 0
let current_did : float ref = ref 0.

let begin_dispatch () : float =
  incr dispatch_seq;
  current_did := Float.of_int !dispatch_seq;
  !current_did

(* called from the pre_dispatch hook — allocates the dispatch id for the
   event currently entering emit_event so every trampoline sees the same
   one *)
let note_dispatch () = ignore (begin_dispatch ())

let mark_stopped (d : float) = Hashtbl.replace stopped d ()
let mark_prevented (d : float) = Hashtbl.replace prevented d ()
let mark_immediate (d : float) = Hashtbl.replace immediates d ()
let is_stopped (d : float) = Hashtbl.mem stopped d
let is_prevented (d : float) = Hashtbl.mem prevented d
let is_immediate (d : float) = Hashtbl.mem immediates d

let prune_flags () =
  if Hashtbl.length stopped > 512 then Hashtbl.reset stopped;
  if Hashtbl.length prevented > 512 then Hashtbl.reset prevented;
  if Hashtbl.length immediates > 512 then Hashtbl.reset immediates

(* ---------- field access ---------- *)

let payload (n : node) : el = n.s_el

let get_attr (n : node) (name : string) : string option =
  match name with
  | "class" -> Some n.s_cls
  | "value" -> Some n.s_value
  | "checked" -> if n.s_checked then Some "" else None
  | _ -> List.assoc_opt name n.s_attrs

let set_attr (n : node) (name : string) (v : string) =
  match name with
  | "class" -> n.s_cls <- v
  | "value" -> n.s_value <- v
  | "checked" -> n.s_checked <- true
  | _ ->
      n.s_attrs <-
        (name, v)
        :: List.filter (fun (k, _) -> k <> name) n.s_attrs

let remove_attr (n : node) (name : string) =
  match name with
  | "class" -> n.s_cls <- ""
  | "checked" -> n.s_checked <- false
  | _ -> n.s_attrs <- List.filter (fun (k, _) -> k <> name) n.s_attrs

(* ---------- host classification ---------- *)

(* Where a {#new} node's parent payload attaches. The parent is either
   another {#new} node, a host element snapshot/ref (node-id, #ref), or
   document.body. *)
type host =
  | Host_node of int (* LUI node id — snapshot or {#ref:"node-N"} *)
  | Host_dom_id of string (* DOM-id anchor — {#ref:"<dom-id>"} *)
  | Host_shadow of int (* another {#new} node *)
  | Host_body (* document.body — {#ref:<=0} or the empty JObject *)

let classify_host (el : el) : host =
  let num_field key =
    match el with
    | JObject kvs ->
        Option.bind (List.assoc_opt key kvs) (fun v ->
            Option.map int_of_float (decodeNumber v))
    | _ -> None
  in
  let str_field key =
    match el with
    | JObject kvs -> Option.bind (List.assoc_opt key kvs) decodeString
    | _ -> None
  in
  match id_of el with
  | Some id -> Host_shadow id
  | None -> (
      match num_field "node-id" with
      | Some n -> Host_node n
      | None -> (
          match str_field "#ref" with
          | Some s ->
              if String.length s >= 5 && String.sub s 0 5 = "node-"
              then (
                match
                  int_of_string_opt (String.sub s 5 (String.length s - 5))
                with
                | Some n -> Host_node n
                | None -> Host_dom_id s)
              else Host_dom_id s
          | None -> (
              match num_field "#ref" with
              | Some n when n > 0 -> Host_node n
              | Some _ -> Host_body
              | None -> (
                  match str_field "ref-id" with
                  | Some s -> Host_dom_id s
                  | None -> Host_body))))

let host_key (h : host) : string =
  match h with
  | Host_node n -> "node-" ^ string_of_int n
  | Host_dom_id s -> "dom:" ^ s
  | Host_shadow n -> "new-" ^ string_of_int n
  | Host_body -> "body"

(* ---------- snapshots ---------- *)

(* Element snapshots matching the Swift LogseqDOMSnapshot shape so the
   shared selector engine (Dom_ext.closest/selector_matches) and attr
   readers work unchanged. Shadow ancestors come first (nearest-first),
   then the LUI host's own snapshot chain. *)

let prop_json key (j : el) : Js.Json.t =
  match j with
  | JObject kvs -> (
      match List.assoc_opt key kvs with
      | Some v -> v
      | None -> JNull)
  | _ -> JNull

let ancestors_list (j : el) : el list =
  match prop_json "ancestors" j with
  | JArray a -> Array.to_list a
  | _ -> []

(* flat element dict (no "ancestors") for use inside an ancestors array *)
let flat_snapshot (n : node) : el =
  JObject
    ([ ("tag", JString n.s_tag)
     ; ("class", JString n.s_cls)
     ; ("#shadow", JNumber (Float.of_int n.s_id))
     ; ("node-id", JNumber (Float.of_int (-n.s_id - 1)))
     ; ( "attrs"
       , JObject (List.map (fun (k, v) -> (k, JString v)) n.s_attrs) ) ]
    @ (match List.assoc_opt "id" n.s_attrs with
       | Some v -> [ ("id", JString v) ]
       | None -> [])
    @ (if n.s_value <> "" then [ ("value", JString n.s_value) ] else [])
    @ (if n.s_checked then [ ("checked", JBoolean true) ] else []))

(* the ancestor list for a child of `parent`: shadow parents (nearest
   first) then the LUI host node and its own ancestors *)
let rec host_ancestors (parent : el) : el list =
  match classify_host parent with
  | Host_shadow pid -> (
      match get pid with
      | Some pn ->
          flat_snapshot pn
          :: (match pn.s_parent with
              | Some p -> host_ancestors p
              | None -> [])
      | None -> [])
  | Host_node nid -> (
      match !lui_snapshot_by_node_id nid with
      | Some s -> s :: ancestors_list s
      | None -> [])
  | Host_dom_id did -> (
      match !lui_snapshot_by_dom_id did with
      | Some s -> s :: ancestors_list s
      | None -> [])
  | Host_body -> [ JObject [ ("tag", JString "body") ] ]

let snapshot (n : node) : el =
  match flat_snapshot n with
  | JObject kvs ->
      JObject
        (( "ancestors"
         , JArray
             (Array.of_list
                (match n.s_parent with
                 | Some p -> host_ancestors p
                 | None -> [])) )
        :: kvs)
  | other -> other

let snapshot_of_id id = Option.map snapshot (get id)

(* the top of a shadow node's chain: the non-shadow host ref (or body)
   reached by walking s_parent links *)
let rec host_ref_of (el : el) : host =
  match classify_host el with
  | Host_shadow pid -> (
      match get pid with
      | Some pn -> (
          match pn.s_parent with
          | Some p -> host_ref_of p
          | None -> Host_body)
      | None -> Host_body)
  | h -> h

(* ---------- listeners ---------- *)

let add_listener_record id name f =
  let cur = Option.value (Hashtbl.find_opt listeners id) ~default:[] in
  Hashtbl.replace listeners id (cur @ [ (name, f) ])

let remove_listener id name f =
  match Hashtbl.find_opt listeners id with
  | Some l ->
      Hashtbl.replace listeners id
        (List.filter (fun (n, g) -> not (n = name && g == f)) l)
  | None -> ()

let listeners_of id name =
  match Hashtbl.find_opt listeners id with
  | Some l ->
      List.filter_map
        (fun (n, f) -> if n = name then Some f else None)
        l
  | None -> []

(* ---------- event wiring ---------- *)

(* the events an emit_event dispatch can reach this node under — the
   trampoline re-checks the per-name listener list, so registering the
   full vocabulary once keeps register_dom_handler's events filter
   transparent *)
let all_event_names =
  "click pointerdown mousedown mouseup input change submit keydown \
   mouseover mouseout mouseenter mouseleave mousemove contextmenu \
   focus blur focusin focusout dismiss appear visible-range scroll \
   scroll-completed change-size dom-event"

(* DOM event names this shadow node is listening for *)
let registered_names id =
  match Hashtbl.find_opt listeners id with
  | Some l -> List.fold_left (fun acc (n, _) -> n :: acc) [] l
                |> List.sort_uniq compare
  | None -> []

let run_listeners (n : node) (name : string) (payload : Js.Json.t) =
  let did =
    match Dom_ext.num_prop "##dispatch" payload with
    | Some d -> d
    | None -> !current_did
  in
  if is_stopped did then ()
  else begin
    let ev =
      match payload with
      | JObject kvs ->
          JObject
            ([ ("##dispatch", JNumber did); ("target", snapshot n) ] @ kvs)
      | _ -> payload
    in
    List.iter
      (fun f ->
        if is_immediate did then ()
        else (try f ev with e ->
          Printf.eprintf "[shadow] listener %s exn: %s\n%!" name
            (Printexc.to_string e)))
      (listeners_of n.s_id name)
  end

(* the dom_handlers trampoline emit_event invokes while bubbling through
   this node's LUI id *)
let ensure_trampoline (n : node) =
  if n.s_lui <> 0 then
    Platform.register_dom_handler n.s_lui ~events:all_event_names
      (fun name payload ->
        match payload with
        | Some p -> (
            try run_listeners n name (Js.Json.parseExn p)
            with _ -> ())
        | None -> run_listeners n name Js.Json.null)

(* DOM names a protocol event maps to (in dispatch order) *)
let dom_names_of_event (e : event) : string list =
  match e with
  | Press _ -> [ "pointerdown"; "mousedown"; "click" ]
  | LongPress _ -> [ "contextmenu" ]
  | DoublePress _ -> [ "dblclick" ]
  | TextChanged _ -> [ "input" ]
  | ToggleChanged _ -> [ "input"; "change" ]
  | Change _ -> [ "input"; "change" ]
  | ValueChanged _ -> [ "input"; "change" ]
  | Submit _ -> [ "keydown"; "submit" ]
  | Picked _ -> [ "input"; "change" ]
  | Dismiss _ -> [ "dismiss" ]
  | Appear _ -> [ "appear" ]
  | ScrollCompleted _ -> [ "scroll-completed"; "scroll" ]
  | VisibleRange _ -> [ "visible-range" ]
  | PressModifiers _ -> []
  | ExtensionEvent _ -> []

let event_payload_fields (e : event) : (string * Js.Json.t) list =
  match e with
  | TextChanged (_, v) -> [ ("value", JString v) ]
  | ToggleChanged (_, b) -> [ ("checked", JBoolean b) ]
  | ValueChanged (_, f) ->
      [ ("value", JString (Printf.sprintf "%g" f))
      ; ("numberValue", JNumber f) ]
  | Picked (_, v) -> [ ("value", JString v) ]
  | Submit _ ->
      [ ("key", JString "Enter"); ("keyCode", JNumber 13.) ]
  | VisibleRange (_, first, last) ->
      [ ("first", JNumber (Float.of_int first))
      ; ("last", JNumber (Float.of_int last)) ]
  | _ -> []

(* translate a runtime event on this node's LUI id into DOM-style
   emit_event dispatches *)
let dispatch_lui_event (n : node) (e : event) =
  (match e with
   | TextChanged (_, v) -> n.s_value <- v
   | ToggleChanged (_, b) | Change _ ->
       (match e with
        | ToggleChanged (_, b) -> n.s_checked <- b
        | _ -> ())
   | ValueChanged (_, f) -> n.s_value <- Printf.sprintf "%g" f
   | Picked (_, v) -> n.s_value <- v
   | _ -> ());
  (match e with
   | ExtensionEvent (_, _ident, "dom-event", values) ->
       (* ext-backed nodes emit DOM events through their dom-event
          channel — same unwrap Logseq_dom.dom installs *)
       let field name =
         match String_map.find_opt name values with
         | Some (StringValue s) -> Some s
         | _ -> None
       in
       (match field "name" with
        | Some name ->
            let payload =
              match field "payload" with
              | Some p -> (try Js.Json.parseExn p with _ -> Js.Json.null)
              | None -> Js.Json.null
            in
            (* ensure the payload carries this node's id so emit_event
               bubbles from it *)
            let payload =
              match payload with
              | JObject kvs -> JObject kvs
              | _ ->
                  JObject
                    [ ("nodeId", JNumber (Float.of_int n.s_lui)) ]
            in
            Platform.emit_event name payload
        | None -> ())
   | _ ->
       let names = dom_names_of_event e in
       let fields = event_payload_fields e in
       List.iter
         (fun name ->
           let payload =
             JObject
               ([ ("name", JString name)
                ; ("nodeId", JNumber (Float.of_int n.s_lui))
                ; ("target", snapshot n)
                ; ("##dispatch", JNumber (begin_dispatch ())) ]
                @ fields)
           in
           Platform.emit_event name payload)
         names)

(* per-node scope so drop_subtree removal also drops on_event handlers *)
let node_scope (n : node) : Signal.scope =
  match n.s_scope with
  | Some s -> s
  | None -> (
      match !host_scope with
      | Some root ->
          let s = Signal.child_scope ("shadow-" ^ string_of_int n.s_id) root in
          n.s_scope <- Some s;
          s
      | None -> invalid_arg "Shadow_dom.install not called")

(* event names that need Press on the host node *)
let press_names = [ "click"; "pointerdown"; "mousedown"; "mouseup" ]

(* which *Enabled props a DOM listener name needs on this kind *)
let prop_for_listener kind name : (property * wire_value) list =
  let press () =
    if property_supported kind PressEnabled then
      [ (PressEnabled, BoolValue true) ]
    else []
  in
  let props =
    if List.mem name press_names then press ()
    else
      match name with
      | "change" | "input" -> (
          match kind with
          | Radio -> [ (ChangeEnabled, BoolValue true) ]
          | _ -> [])
      | "submit" -> (
          if property_supported kind SubmitEnabled then
            [ (SubmitEnabled, BoolValue true) ]
          else [])
      | "appear" -> (
          if property_supported kind AppearEnabled then
            [ (AppearEnabled, BoolValue true) ]
          else [])
      | "dblclick" -> (
          if property_supported kind DoublePressEnabled then
            [ (DoublePressEnabled, BoolValue true) ]
          else [])
      | "visible-range" -> (
          if property_supported kind TrackVisibleRange then
            [ (TrackVisibleRange, BoolValue true) ]
          else [])
      | _ -> []
  in
  props

(* ---------- materialization ---------- *)

(* child_ids materialized under a shadow node's s_lui *)
let index_of_lui_in (n : node) (lui : int) : int option =
  let rec loop i = function
    | [] -> None
    | c :: rest -> (
        match id_of c with
        | Some cid -> (
            match get cid with
            | Some cn ->
                if cn.s_lui = lui then Some i else loop (i + 1) rest
            | None -> loop i rest)
        | None -> loop i rest)
  in
  loop 0 n.s_children

(* how many materialized shadow children precede `child` — its index in
   the LUI children array *)
let child_index (n : node) (child_id : int) : int =
  let rec loop i = function
    | [] -> i
    | c :: rest -> (
        match id_of c with
        | Some cid ->
            if cid = child_id then i
            else
              (match get cid with
               | Some cn when cn.s_lui <> 0 -> loop (i + 1) rest
               | _ -> loop i rest)
        | None -> loop i rest)
  in
  loop 0 n.s_children

let apply_lui_props (n : node) (kind : node_kind) =
  let a = app () in
  let set p v =
    if Lui_runtime.property_value_supported a n.s_lui p v then
      Lui_runtime.set_prop a n.s_lui p v
    else if Lui_protocol.property_supported kind p then
      (* unsupported value (e.g. an unknown alignment token) — skip *)
      ()
  in
  set StyleClass (StringValue n.s_cls);
  List.iter (fun (p, v) -> set p v) (cls_props n.s_cls);
  (match attr_of n.s_attrs "id" with
   | Some id -> set AccessibilityIdentifier (StringValue id)
   | None -> ());
  (match attr_of n.s_attrs "placeholder" with
   | Some v -> set PlaceholderValue (StringValue v)
   | None -> ());
  (if List.mem_assoc "disabled" n.s_attrs
      || List.mem_assoc "readonly" n.s_attrs
   then set Enabled (BoolValue false));
  (if kind = Checkbox then set Checked (BoolValue n.s_checked));
  (if property_supported kind TextValue && n.s_value <> "" then
     set TextValue (StringValue n.s_value));
  (match kind with
   | Heading -> (
       let level =
         match n.s_tag with
         | "h1" -> 1 | "h2" -> 2 | "h3" -> 3
         | "h4" -> 4 | "h5" -> 5 | _ -> 6
       in
       set HeadingLevel (IntValue level))
   | _ -> ());
  (* inline style width/height/… (views size cells via style attr) *)
  (match attr_of n.s_attrs "style" with
   | Some style ->
       List.iter
         (fun decl ->
           match String.split_on_char ':' decl with
           | [ k; v ] -> (
               let k = String.trim k and v = String.trim v in
               let num = (* "123px" -> 123 *)
                 let vl = String.length v in
                 if vl > 2 && String.sub v (vl - 2) 2 = "px" then
                   int_of_string_opt (String.sub v 0 (vl - 2))
                 else int_of_string_opt v
               in
               match (k, num) with
               | "width", Some i -> set WidthValue (IntValue i)
               | "height", Some i -> set HeightValue (IntValue i)
               | "min-width", Some i -> set MinWidth (IntValue i)
               | "min-height", Some i -> set MinHeight (IntValue i)
               | "max-width", Some i -> set MaxWidth (IntValue i)
               | "max-height", Some i -> set MaxHeight (IntValue i)
               | _ -> ())
           | _ -> ())
         (String.split_on_char ';' style)
   | None -> ())

let apply_ext_props (n : node) =
  let a = app () in
  let names = registered_names n.s_id in
  let attrs =
    List.filter (fun (k, _) -> k <> "class") n.s_attrs
  in
  Lui_runtime.set_extension_prop a n.s_lui "attrs"
    (StringValue (Logseq_dom.attrs_json attrs));
  Lui_runtime.set_extension_prop a n.s_lui "style-class"
    (StringValue n.s_cls);
  if n.s_text <> "" then
    Lui_runtime.set_extension_prop a n.s_lui "text" (StringValue n.s_text);
  (match attr_of n.s_attrs "id" with
   | Some id ->
       Lui_runtime.set_extension_prop a n.s_lui "accessibility-identifier"
         (StringValue id)
   | None ->
       (* every shadow node gets a stable DOM id so dom-ops (focus,
          set-value, set-selection-range) can target it *)
       Lui_runtime.set_extension_prop a n.s_lui "accessibility-identifier"
         (StringValue ("shadow-" ^ string_of_int n.s_id)));
  if names <> [] then
    Lui_runtime.set_extension_prop a n.s_lui "events"
      (StringValue (String.concat " " names))

(* re-run listener wiring after (re)materialization *)
let wire_events (n : node) =
  let a = app () in
  let scope = node_scope n in
  Lui_runtime.on_event scope a n.s_lui (fun raw -> dispatch_lui_event n raw);
  ensure_trampoline n;
  match n.s_backing with
  | B_lui kind ->
      List.iter
        (fun name ->
          List.iter
            (fun (p, v) ->
              if Lui_runtime.property_value_supported a n.s_lui p v then
                Lui_runtime.set_prop a n.s_lui p v)
            (prop_for_listener kind name))
        (registered_names n.s_id)
  | B_ext _ ->
      let names = registered_names n.s_id in
      if names <> [] then
        Lui_runtime.set_extension_prop a n.s_lui "events"
          (StringValue (String.concat " " names))
  | B_none -> ()

(* A container's text: TextValue when the kind takes it, else a leading
   Text child node. *)
let sync_text (n : node) =
  match n.s_backing with
  | B_lui kind when n.s_lui <> 0 -> (
      let a = app () in
      if Lui_protocol.property_supported kind TextValue then
        Lui_runtime.set_prop a n.s_lui TextValue (StringValue n.s_text)
      else if n.s_text <> "" then begin
        let tid =
          if n.s_text_child <> 0 then n.s_text_child
          else begin
            let t = Lui_runtime.create_node a Text in
            Lui_runtime.insert_child a n.s_lui t 0;
            n.s_text_child <- t;
            t
          end
        in
        if Lui_runtime.property_value_supported a tid TextValue
             (StringValue n.s_text)
        then
          Lui_runtime.set_prop a tid TextValue (StringValue n.s_text)
      end
      else if n.s_text_child <> 0 then begin
        (try
           Lui_runtime.remove_child a n.s_lui n.s_text_child;
           Lui_runtime.drop_subtree a n.s_text_child
         with _ -> ());
        n.s_text_child <- 0
      end)
  | B_ext _ when n.s_lui <> 0 ->
      let a = app () in
      Lui_runtime.set_extension_prop a n.s_lui "text" (StringValue n.s_text)
  | _ -> ()

let materialize (n : node) =
  if n.s_lui = 0 && Option.is_some !lui_app then begin
    let a = app () in
    match desired_backing ~tag:n.s_tag ~cls:n.s_cls ~attrs:n.s_attrs with
    | B_none -> n.s_backing <- B_none
    | B_lui kind ->
        n.s_lui <- Lui_runtime.create_node a kind;
        n.s_backing <- B_lui kind;
        Hashtbl.replace lui_index n.s_lui n.s_id;
        apply_lui_props n kind;
        wire_events n;
        sync_text n
    | B_ext ident ->
        n.s_lui <- Lui_runtime.create_extension_node a ident;
        n.s_backing <- B_ext ident;
        Hashtbl.replace lui_index n.s_lui n.s_id;
        apply_ext_props n;
        wire_events n
  end

(* materialize + attach the node's existing children, in order *)
let rec materialize_children (n : node) =
  List.iter
    (fun c ->
      match id_of c with
      | Some cid -> (
          match get cid with
          | Some cn ->
              materialize cn;
              if cn.s_lui <> 0 && n.s_lui <> 0 then
                (try
                   Lui_runtime.insert_child (app ()) n.s_lui cn.s_lui
                     (List.length
                        (Lui_runtime.children (app ()) n.s_lui))
                 with _ -> ());
              materialize_children cn
          | None -> ())
      | None -> ())
    n.s_children

(* rebuild a materialized node with a different backing (kind can't
   express a newly-required behavior — e.g. a Row that gains a click
   listener, or a div that gains position:fixed) *)
let rematerialize (n : node) =
  if n.s_lui <> 0 then begin
    let a = app () in
    let old = n.s_lui in
    (* detach children first so they survive the drop *)
    List.iter
      (fun c ->
        match id_of c with
        | Some cid -> (
            match get cid with
            | Some cn when cn.s_lui <> 0 ->
                (try Lui_runtime.remove_child a old cn.s_lui with _ -> ())
            | _ -> ())
        | None -> ())
      n.s_children;
    (try Lui_runtime.remove_child a old n.s_text_child
     with _ -> ());
    n.s_text_child <- 0;
    (* find old's parent + index *)
    let parent_lui, index =
      match n.s_parent with
      | Some p -> (
          match classify_host p with
          | Host_shadow pid -> (
              match get pid with
              | Some pn ->
                  (pn.s_lui, index_of_lui_in pn old |> Option.value ~default:(-1))
              | None -> (0, -1))
          | Host_node nid -> (nid, -1)
          | Host_dom_id d -> (
              match !lui_node_by_dom_id d with
              | Some nid -> (nid, -1)
              | None -> (0, -1))
          | Host_body -> (-1, -1))
      | None -> (0, -1)
    in
    let index =
      if index < 0 && parent_lui >= 0 then
        (* locate among the parent's runtime children *)
        let rec find i = function
          | [] -> -1
          | c :: rest -> if c = old then i else find (i + 1) rest
        in
        find 0 (Lui_runtime.children a parent_lui)
      else index
    in
    (try Lui_runtime.remove_child a parent_lui old with _ -> ());
    (match n.s_scope with
     | Some s -> Signal.dispose_scope s; n.s_scope <- None
     | None -> ());
    Hashtbl.remove lui_index old;
    Hashtbl.remove Platform.dom_handlers old;
    (try Lui_runtime.drop_subtree a old with _ -> ());
    n.s_lui <- 0;
    n.s_backing <- B_none;
    materialize n;
    (* re-insert at the same position *)
    if n.s_lui <> 0 && parent_lui > 0 then
      (try
         let i = if index >= 0 then index else
           List.length (Lui_runtime.children a parent_lui) in
         Lui_runtime.insert_child a parent_lui n.s_lui i
       with _ -> ());
    (* re-attach children *)
    materialize_children n;
    if n.s_body_attached then
      Host.dom_op "body-attach"
        (Printf.sprintf "{\"nodeId\":%d}" n.s_lui)
  end

(* listener registration may force a backing change (Row -> pressable) *)
let ensure_pressable (n : node) =
  match n.s_backing with
  | B_lui kind ->
      if not (Lui_protocol.property_supported kind PressEnabled) then
        rematerialize_as_pressable n
  | _ -> ()

and rematerialize_as_pressable (n : node) =
  (* force the desired backing to a press-capable container *)
  let desired =
    if rowish n.s_cls then B_lui ListItem else B_lui Column
  in
  ignore desired;
  n.s_backing <- B_none;
  rematerialize n

let add_listener (n : node) (name : string) (f : Js.Json.t -> unit) =
  add_listener_record n.s_id name f;
  materialize n;
  if List.mem name press_names then ensure_pressable n;
  (* refresh wiring: ext nodes need the events prop extended; LUI nodes
     get their *Enabled prop *)
  if n.s_lui <> 0 then begin
    let a = app () in
    match n.s_backing with
    | B_ext _ ->
        let names = registered_names n.s_id in
        Lui_runtime.set_extension_prop a n.s_lui "events"
          (StringValue (String.concat " " names))
    | B_lui kind ->
        List.iter
          (fun (p, v) ->
            if Lui_runtime.property_value_supported a n.s_lui p v then
              Lui_runtime.set_prop a n.s_lui p v)
          (prop_for_listener kind name)
    | B_none -> ()
  end

(* ---------- rects (filled by the host's shadow-frames event) ---------- *)

let set_rect node_id l t r b = Hashtbl.replace rects node_id (l, t, r, b)
let rect_of_node_id id = Hashtbl.find_opt rects id

let rect_of (n : node) =
  if n.s_lui <> 0 then Hashtbl.find_opt rects n.s_lui else None

(* ---------- teardown ---------- *)

let rec remove id =
  match get id with
  | Some n ->
      List.iter
        (fun c ->
          match id_of c with
          | Some cid -> remove cid
          | None -> ())
        n.s_children;
      (if n.s_lui <> 0 && Option.is_some !lui_app then begin
         let a = app () in
         (* detach from the runtime parent first — drop_subtree alone
            leaves a dangling child entry on the parent *)
         (match n.s_parent with
          | Some p -> (
              match classify_host p with
              | Host_shadow pid -> (
                  match get pid with
                  | Some pn when pn.s_lui <> 0 ->
                      (try Lui_runtime.remove_child a pn.s_lui n.s_lui
                       with _ -> ())
                  | _ -> ())
              | Host_node nid ->
                  (try Lui_runtime.remove_child a nid n.s_lui with _ -> ())
              | Host_dom_id d -> (
                  match !lui_node_by_dom_id d with
                  | Some nid ->
                      (try Lui_runtime.remove_child a nid n.s_lui
                       with _ -> ())
                  | None -> ())
              | Host_body ->
                  if n.s_body_attached then
                    Host.dom_op "body-detach"
                      (Printf.sprintf "{\"nodeId\":%d}" n.s_lui);
                  n.s_body_attached <- false)
          | None -> ());
         (match n.s_scope with
          | Some s -> Signal.dispose_scope s; n.s_scope <- None
          | None -> ());
         Hashtbl.remove lui_index n.s_lui;
         Hashtbl.remove Platform.dom_handlers n.s_lui;
         (try Lui_runtime.drop_subtree a n.s_lui with _ -> ())
       end);
      Hashtbl.remove nodes id;
      Hashtbl.remove listeners id
  | None -> ()

let iter f = Hashtbl.iter f nodes

let fold f acc = Hashtbl.fold (fun id n acc -> f id n acc) nodes acc

(* ids of all {#new} descendants of a node (excluding the node itself) *)
let descendant_ids (root : int) : int list =
  let rec collect acc el =
    match id_of el with
    | Some id -> (
        match get id with
        | Some n -> List.fold_left collect (id :: acc) n.s_children
        | None -> id :: acc)
    | None -> acc
  in
  match get root with
  | Some n -> List.fold_left collect [] n.s_children
  | None -> []

(* ---------- element lifecycle ops ---------- *)

let register ?(tag = "div") ?(cls = "") ?(attrs = []) ?(text = "") () : el =
  let id = alloc () in
  let el =
    JObject
      [ ("#new", JNumber (Float.of_int id))
      ; ("tag", JString tag)
      ; ("cls", JString cls)
      ; ("text", JString text)
      ; ( "attrs"
        , JObject (List.map (fun (k, v) -> (k, JString v)) attrs) ) ]
  in
  Hashtbl.replace nodes id
    { s_id = id
    ; s_el = el
    ; s_tag = tag
    ; s_cls = cls
    ; s_attrs = attrs
    ; s_text = text
    ; s_children = []
    ; s_parent = None
    ; s_value =
        (match List.assoc_opt "value" attrs with Some v -> v | None -> "")
    ; s_checked = List.mem_assoc "checked" attrs
    ; s_lui = 0
    ; s_backing = B_none
    ; s_scope = None
    ; s_text_child = 0
    ; s_body_attached = false };
  el

let create_text s = register ~tag:"#text" ~text:s ()

(* ---------- dom-op emission (shared by views_dom and editor_dom) ---------- *)

let doc_op name payload = Host.dom_op name (Js.Json.stringify payload)

let shadow_field (el : el) : (string * Js.Json.t) list =
  match id_of el with
  | Some id -> [ ("shadow", JNumber (Float.of_int id)) ]
  | None -> []

(* attach bookkeeping: record the shadow-side parent/children so queries,
   contains() and the event ancestor chain resolve natively *)
let attach_child ~(parent : el) ~(child : el) ?before () =
  (match id_of child with
   | Some cid -> (
       match get cid with
       | Some cn -> cn.s_parent <- Some parent
       | None -> ())
   | None -> ());
  match id_of parent with
  | Some pid -> (
      match get pid with
      | Some pn ->
          let children =
            match before with
            | Some b -> (
                match id_of b with
                | Some bid ->
                    let rec insert acc = function
                      | c :: rest when id_of c = Some bid ->
                          List.rev_append acc (child :: c :: rest)
                      | c :: rest -> insert (c :: acc) rest
                      | [] -> List.rev (child :: acc)
                    in
                    insert [] pn.s_children
                | None -> pn.s_children @ [ child ])
            | None -> pn.s_children @ [ child ]
          in
          pn.s_children <- children
      | None -> ())
  | None -> ()

let detach_child (child : el) =
  match id_of child with
  | Some cid -> (
      match get cid with
      | Some cn ->
          (match cn.s_parent with
           | Some p -> (
               match id_of p with
               | Some pid -> (
                   match get pid with
                   | Some pn ->
                       pn.s_children <-
                         List.filter
                           (fun c -> id_of c <> Some cid)
                           pn.s_children
                   | None -> ())
               | None -> ())
           | None -> ());
          cn.s_parent <- None
      | None -> ())
  | None -> ()

(* ---------- real attach: materialize + insert under the host ---------- *)

let parent_lui_of (el : el) : int option =
  match classify_host el with
  | Host_shadow pid -> (
      match get pid with
      | Some pn -> if pn.s_lui = 0 then None else Some pn.s_lui
      | None -> None)
  | Host_node n -> Some n
  | Host_dom_id d -> !lui_node_by_dom_id d
  | Host_body -> None

let insert_into_parent (n : node) (parent : el) (before : el option) =
  if n.s_lui <> 0 then
    match classify_host parent with
    | Host_body ->
        (if not n.s_body_attached then begin
           n.s_body_attached <- true;
           Host.dom_op "body-attach"
             (Printf.sprintf "{\"nodeId\":%d}" n.s_lui)
         end)
    | _ -> (
        match parent_lui_of parent with
        | Some pid -> (
            let a = app () in
            let index =
              match before with
              | Some b -> (
                  match classify_host b with
                  | Host_shadow bid -> (
                      match get bid with
                      | Some bn ->
                          (* index among materialized siblings *)
                          let rec find i = function
                            | [] -> -1
                            | c :: rest ->
                                if c = bn.s_lui then i
                                else find (i + 1) rest
                          in
                          find 0 (Lui_runtime.children a pid)
                      | None -> -1)
                  | Host_node nid ->
                      let rec find i = function
                        | [] -> -1
                        | c :: rest ->
                            if c = nid then i else find (i + 1) rest
                      in
                      find 0 (Lui_runtime.children a pid)
                  | _ -> -1)
              | None -> -1
            in
            let index =
              if index >= 0 then index
              else List.length (Lui_runtime.children a pid)
            in
            try Lui_runtime.insert_child a pid n.s_lui index
            with e ->
              Printf.eprintf "[shadow] insert_child %d->%d: %s\n%!"
                n.s_lui pid (Printexc.to_string e))
        | None -> ())

let append_child (parent : el) (child : el) : unit =
  attach_child ~parent ~child ();
  (match id_of child with
   | Some cid -> (
       match get cid with
       | Some cn ->
           materialize cn;
           insert_into_parent cn parent None;
           materialize_children cn
       | None -> ())
   | None -> ())

let insert_before (parent : el) (child : el) (before : el option) : unit =
  attach_child ~parent ~child ?before ();
  (match id_of child with
   | Some cid -> (
       match get cid with
       | Some cn ->
           materialize cn;
           insert_into_parent cn parent before;
           materialize_children cn
       | None -> ())
   | None -> ())

let reparent_detached (child : el) : unit =
  (* re-insert under the recorded parent — the Swift side removed the
     visual child but our runtime link is still there *)
  match id_of child with
  | Some cid -> (
      match get cid with
      | Some cn -> (
          match cn.s_parent with
          | Some p -> insert_into_parent cn p None
          | None -> ())
      | None -> ())
  | None -> ()
