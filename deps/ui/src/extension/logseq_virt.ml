(* logseq-virt extension — the virtualized-list scroll boundary on web.

   The web backend virtualizes with @tanstack/virtual-core (Virtualizer
   bound to an outer scroll element). This extension owns the DOM
   contract that machinery needs — the parts a kind cannot carry
   (absolute translateY row positioning, the signal-driven spacer
   height, and the attrs the [data_attrs] vocabulary does not cover).

   Roles (the "role" prop selects the contract the adapter stamps):
     list    — .ls-virt-list root: carries the list id and the caller's
               data-* hooks (data-viewport-type). [attach] binds the
               Virtualizer to it after mount.
     spacer  — .ls-virt-spacer: total-height sizer holding the
               absolutely positioned rows.
     row     — .ls-virt-row[data-index]: translateY position the
               Virtualizer measures through the MutationObserver.
     region  — eager-mode scaffold wrapper carrying the virtuoso-era
               attrs (data-virtuoso-scroller, data-index,
               data-item-index, data-testid) plus the inline styles
               [data_attrs] cannot express (position:relative,
               overflow-anchor, box-sizing).

   The virtualizer machinery (instance registry, scroll_to_*, the
   MutationObserver measure path) and the IntersectionObserver row
   visibility contract live here because they are behaviors of the
   scroll boundary itself, not of any single view site. Native hosts
   keep their own twins (native/) and ignore this file's adapter. *)

open Lui_protocol
open Lui_web_types
module W = Webapi.Dom
module V = Virtualizer

let identifier = "logseq-virt"

let web_profile =
  { Lui_protocol.profile_os = WebOS; Lui_protocol.profile_host = WebHost }

let schema =
  Lui_extension.component identifier [ web_profile ]
    true (* rows carry arbitrary view children *)
    (* logseq-virt nodes nest (region > list > spacer > row) and row
       interiors emit logseq-<tag>/editor/codemirror widgets *)
    (identifier :: Logseq_dom.child_identifiers
     @ [ Logseq_editor.identifier; Logseq_codemirror.identifier ])
    [ Lui_extension.property "role" Lui_extension.StringScalar false
        None
    ; Lui_extension.property "index" Lui_extension.IntScalar false None
    ; Lui_extension.property "offset" Lui_extension.FloatScalar false
        None
    ; Lui_extension.property "height" Lui_extension.FloatScalar false
        None
    ; Lui_extension.property "style" Lui_extension.StringScalar false
        None
    ; Lui_extension.property "data-attrs" Lui_extension.StringScalar
        false None
    ; Lui_extension.property "style-class" Lui_extension.StringScalar
        false None
    ; Lui_extension.property "accessibility-identifier"
        Lui_extension.StringScalar false None
    ]
    []

let register registry =
  Lui_extension.register_component registry schema

(* -- emit -- *)

let emit ?key ~role ~props ~signal_props children : Lui_elements.t =
 fun context parent ->
  let node = Lui_ui.extension context identifier in
  Option.iter (Lui_ui.key context node) key;
  Lui_ui.extension_property context node "role" (StringValue role);
  List.iter
    (fun (name, value) ->
      Lui_ui.extension_property context node name value)
    props;
  List.iter
    (fun (name, s) ->
      Lui_ui.extension_property_signal context node name
        (Logseq_dom.own context s))
    signal_props;
  (match parent with
   | Some p -> Lui_ui.append context p node
   | None -> ());
  Lui_elements.mount_children context node children;
  node

let data_attr_props attrs =
  if attrs = [] then []
  else [ ("data-attrs", StringValue (data_attrs_encode attrs)) ]

(* generic scaffold wrapper — attrs + the inline style [data_attrs]
   cannot carry *)
let region ?key ?(style_class = "") ?(data_attrs = []) ?(style = "")
    (children : Lui_elements.t list) : Lui_elements.t =
  emit ?key ~role:"region"
    ~props:
      (data_attr_props data_attrs
       @ (if style = "" then [] else [ ("style", StringValue style) ])
       @
       if style_class = "" then []
       else [ ("style-class", StringValue style_class) ])
    ~signal_props:[] children

(* the virtualizer boundary element (.ls-virt-list); [attach] resolves
   it by id once the node lands in the document *)
let container ?key ~id ?(style_class = "ls-virt-list")
    ?(data_attrs = []) (children : Lui_elements.t list) : Lui_elements.t
    =
  emit ?key ~role:"list"
    ~props:
      ([ ("accessibility-identifier", StringValue id)
       ; ("style-class", StringValue style_class) ]
       @ data_attr_props data_attrs)
    ~signal_props:[] children

(* total-height sizer; [height_s] is a FloatValue px signal *)
let spacer ?key ~(height_s : wire_value Signal.signal)
    (children : Lui_elements.t list) : Lui_elements.t =
  emit ?key ~role:"spacer" ~props:[] ~signal_props:[ ("height", height_s) ]
    children

(* positioned row; [index_s] is IntValue, [offset_s] FloatValue px *)
let row ?key ~(index_s : wire_value Signal.signal)
    ~(offset_s : wire_value Signal.signal)
    (children : Lui_elements.t list) : Lui_elements.t =
  emit ?key ~role:"row" ~props:[]
    ~signal_props:[ ("index", index_s); ("offset", offset_s) ]
    children

(* -- virtualizer machinery (moved from virt_list) -- *)

type element = V.element

external get_by_id : string -> element option = "getElementById"
  [@@mel.scope "document"] [@@mel.return nullable]

external query_selector_all : element -> string -> Js.Json.t
  = "querySelectorAll" [@@mel.send]

external nl_to_array : Js.Json.t -> element array = "from"
  [@@mel.scope "Array"]

external bounding_rect : element -> Js.Json.t = "getBoundingClientRect"
  [@@mel.send]

external rect_top : Js.Json.t -> float = "top" [@@mel.get]

external rect_height : Js.Json.t -> float = "height" [@@mel.get]

external scroll_top : element -> float = "scrollTop" [@@mel.get]

type mutation_observer
type observe_opts
type mutation_record

external new_observer_records :
  (mutation_record array -> unit) -> mutation_observer
  = "MutationObserver" [@@mel.new]

external rec_added : mutation_record -> Js.Json.t = "addedNodes"
  [@@mel.get]

external observe_opts : childList:bool -> subtree:bool -> observe_opts
  = "" [@@mel.obj]

external observe :
  mutation_observer -> element -> observe_opts -> unit = "observe"
  [@@mel.send]

external disconnect : mutation_observer -> unit = "disconnect"
  [@@mel.send]

external set_timeout_id : (unit -> unit) -> int -> int = "setTimeout"
  [@@mel.scope "window"]

external clear_timeout : int -> unit = "clearTimeout"
  [@@mel.scope "window"]

type vrow = { v_index : int; v_key : string; v_start : float }

type vstate = { v_rows : vrow list; v_total : float }

(* live virtualizer instances keyed by their list element id — callers
   can drive scroll_to_index/scroll_to_key (e.g. editor
   scroll-to-block) *)
let instances : (string, V.t) Hashtbl.t = Hashtbl.create 8

(* item-key -> scroll-into-view closures, one per mounted list — lets a
   caller scroll to a row it only knows by key (e.g. a block uuid that
   fell outside the rendered window) without tracking list ids *)
let key_scrollers : (string, string -> bool) Hashtbl.t = Hashtbl.create 8

let instance_of list_id = Hashtbl.find_opt instances list_id

let scroll_to_key key =
  ignore
    (Hashtbl.fold
       (fun _ f acc -> if f key then true else acc)
       key_scrollers false)

(* editor_actions pulls the editing row back into view through this hook
   (a direct reference would close a module cycle via Block_selection) *)
let () = Editor_state.scroll_key_into_view := scroll_to_key

let scroll_to_index list_id index ?align () =
  match instance_of list_id with
  | Some v -> V.scroll_to_index v index (V.scroll_to_options ?align ())
  | None -> ()

let scroll_to_offset list_id offset =
  match instance_of list_id with
  | Some v -> V.scroll_to_offset v offset
  | None -> ()

let id_counter = ref 0

let fresh_id () =
  incr id_counter;
  "ls-virt-" ^ string_of_int !id_counter

(* ?virtualized=true forces windowing — both the Virt_list gate and the
   visibility sync key off it (cljs use-virtual-list-opts) *)
let force_virtualized () =
  Platform.query_param "virtualized" = Some "true"

(* -- row visibility contract (moved from pages/virtual_scroll.ml) --

   cljs ports block/page lists through react-virtuoso: a
   [data-virtuoso-scroller] wrapper, [data-index] rows, and unmounting
   of off-viewport rows. The OCaml UI keeps every row mounted and lets
   an IntersectionObserver toggle `visibility` instead — the layout box
   is preserved (stable scrollHeight, scrollIntoView still works) while
   off-viewport rows report as hidden, matching the observable contract
   without a real unmounting virtualizer.

   While a pointer is held down (block range selection), the same
   intersection callback plays the role of cljs virtuoso's
   items-rendered: the selection extends to each newly visible row's
   block. *)

type io
type io_opts

external io_opts : rootMargin:string -> io_opts = "" [@@mel.obj]

external new_io : (Js.Json.t array -> unit) -> io_opts -> io
  = "IntersectionObserver" [@@mel.new]

external io_observe : io -> Js.Json.t -> unit = "observe" [@@mel.send]

external entry_get : Js.Json.t -> string -> Js.Json.t = ""
  [@@mel.get_index]

external entry_bool : Js.Json.t -> string -> bool = "" [@@mel.get_index]

let set_visibility entry =
  let target = entry_get entry "target" in
  let visibility =
    if entry_bool entry "isIntersecting" then "" else "hidden"
  in
  Web_dom.js_set (Web_dom.js_get target "style") "visibility"
    (Js.Json.string visibility)

let io = ref None

let observer () =
  match !io with
  | Some o -> o
  | None ->
      let o =
        new_io
          (fun entries -> Array.iter set_visibility entries)
          (* cljs virtuoso mounts rows up to 254px beyond the viewport
             (increase-viewport-by / overscan 254) *)
          (io_opts ~rootMargin:"254px")
      in
      io := Some o;
      o

(* virt_list's onChange calls this with the rendered window's edge row
   in the scroll direction — cljs virtuoso items-rendered boundary.
   Unlike a per-entry intersection walk it can't regress the range when
   a stale row fires its observer late *)
let extend_drag uuid =
  if Block_selection.is_down () then Block_selection.extend_to uuid

(* observe every [data-index] row under a [data-virtuoso-scroller] once;
   rows LUI rebuilds lose the marker and get re-observed *)
let sync () =
  if force_virtualized () then
    let o = observer () in
    Array.iter
      (fun row ->
        match Web_dom.el_get_attr row "data-vs" with
        | Some _ -> ()
        | None ->
            Web_dom.el_set_attr row "data-vs" "1";
            io_observe o row)
      (Web_dom.query_selector_all_arr
         "[data-virtuoso-scroller] [data-index]")

(* measure every mounted [data-index] row, then prune dropped nodes *)
let measure_rows list_el (v : V.t) =
  let items = nl_to_array (query_selector_all list_el "[data-index]") in
  Array.iter
    (fun el -> V.measure_element v (Js.Nullable.return el))
    items;
  V.measure_element v Js.Nullable.null;
  (* freshly mounted rows need IntersectionObserver registration for
     pointer-down range selection (cljs virtuoso items-rendered) *)
  sync ()

let rows_of (v : V.t) =
  Array.to_list (V.get_virtual_items v)
  |> List.map (fun it ->
         { v_index = V.item_index it
         ; v_key = V.item_key it
         ; v_start = V.item_start it
         })

(* One mounted list instance: deferred virtualizer attach once the list
   element exists, scope cleanup on unmount. Called by Virt_list from a
   setTimeout so the logseq-virt node is already in the document. *)
let attach (ctx : Lui_ui.ui_context) st margin list_id scroll_parent_id
    data versions key_of overscan estimate_size pin_key pin_sig data_sig
    same_item on_end =
  match get_by_id list_id, get_by_id scroll_parent_id with
  | Some list_el, Some scroll_el ->
      margin :=
        rect_top (bounding_rect list_el)
        -. rect_top (bounding_rect scroll_el)
        +. scroll_top scroll_el;
      let index_of_key key =
        let rec idx i =
          if i >= Array.length !data then -1
          else if key_of !data.(i) = key then i
          else idx (i + 1)
        in
        idx 0
      in
      let last_scroll = ref (scroll_top scroll_el) in
      let publish v =
        let rows = rows_of v in
        let rows =
          match pin_key () with
          | Some key
            when not (List.exists (fun r -> r.v_key = key) rows) -> (
              (* keep the pinned row mounted even when it is off-window
                 (e.g. the focused editor's block after a scroll jump or
                 an insert just below the rendered edge) *)
              match index_of_key key with
              | -1 -> rows
              | i when i >= Array.length (V.measurements_cache v) -> rows
              | i ->
                  let r =
                    { v_index = i
                    ; v_key = key
                    ; v_start = V.item_start (V.measurements_cache v).(i)
                    }
                  in
                  let rec insert = function
                    | x :: rest when x.v_start <= r.v_start ->
                        x :: insert rest
                    | l -> r :: l
                  in
                  insert rows)
          | _ -> rows
        in
        Signal.set st { v_rows = rows; v_total = V.get_total_size v };
        Runtime.flush ();
        (* the last data row rendered — ask the owner for the next page
           (journals scroll-back pagination; a no-op hook on fixed-size
           lists) *)
        (match List.nth_opt rows (List.length rows - 1) with
         | Some r when r.v_index >= Array.length !data - 1 -> on_end ()
         | _ -> ());
        (* cljs virtuoso items-rendered: while a block-range drag is in
           progress the selection extends to the boundary row in the
           scroll direction — a stale mid-range row must never shrink
           it. Direction follows the scroll offset, not the rendered
           start — an overscan row appearing at the edge is not a
           scroll *)
        let cur_scroll = scroll_top scroll_el in
        let dir =
          if cur_scroll > !last_scroll then Some `Down
          else if cur_scroll < !last_scroll then Some `Up
          else None
        in
        last_scroll := cur_scroll;
        match dir, rows with
        | Some `Down, _ :: _ ->
            (match List.nth_opt rows (List.length rows - 1) with
             | Some r when r.v_index < Array.length !data ->
                 extend_drag (key_of !data.(r.v_index))
             | _ -> ())
        | Some `Up, first :: _ ->
            if first.v_index < Array.length !data then
              extend_drag (key_of !data.(first.v_index))
        | _ -> ()
      in
      let options () =
        V.options ~count:(Array.length !data)
          ~getScrollElement:(fun () -> Js.Nullable.return scroll_el)
          ~estimateSize:estimate_size ~scrollToFn:V.element_scroll
          ~observeElementRect:V.observe_element_rect
          ~observeElementOffset:V.observe_element_offset
          ~onChange:(fun inst _sync -> publish inst)
          ~getItemKey:(fun i -> key_of !data.(i))
          ~overscan ~scrollMargin:!margin
          (* the default measurement is offsetHeight (integer) —
             fractional row heights (headings, code blocks) get
             truncated and the next row then overlaps the remainder; a
             border-box rect keeps sub-pixel heights *)
          ~measureElement:(fun el _entry _inst ->
            rect_height (bounding_rect el))
          ()
      in
      let v = V.make (options ()) in
      Hashtbl.replace instances list_id v;
      Hashtbl.replace key_scrollers list_id (fun key ->
          match index_of_key key with
          | -1 -> false
          | i ->
              let it = V.get_virtual_items v in
              let rendered =
                Array.exists (fun r -> V.item_index r = i) it
              in
              (* scrolling an already-rendered row is a no-op — skip it
                 so focus retries don't churn the virtualizer
                 mid-mount *)
              if not rendered then
                V.scroll_to_index v i
                  (V.scroll_to_options ~align:"auto" ());
              true);
      let cleanup = V.did_mount v in
      V.will_update v;
      publish v;
      (* the pin target can change without a virtualizer onChange
         (editing moved to an off-window row — an insert below the
         rendered edge) — republish so its row mounts immediately *)
      let pin_sub =
        match pin_sig () with
        | Some s ->
            (* only republish when the pin target itself changed —
               keystrokes bump the same state signal but don't move the
               pin *)
            let last_pin = ref (pin_key ()) in
            Some
              (Signal.subscribe ~emit_initial:false s (fun _ ->
                   let k = pin_key () in
                   if k <> !last_pin then (
                     last_pin := k;
                     publish v)))
        | None -> None
      in
      (* spliced page snapshots push a fresh items array — swap it in
         and republish so only the touched rows re-render instead of a
         whole-list remount *)
      let prev_items : (string, 'a) Hashtbl.t = Hashtbl.create 16 in
      let data_sub =
        match data_sig with
        | Some s ->
            Some
              (Signal.subscribe ~emit_initial:false s (fun arr ->
                   (* rows are keyed mounts — swap in the new items and
                      bump the reload key only for uuids whose item
                      actually changed, so untouched rows (and their DOM
                      state) survive the splice *)
                   let old = !data in
                   data := arr;
                   Hashtbl.reset prev_items;
                   Array.iter
                     (fun it -> Hashtbl.replace prev_items (key_of it) it)
                     old;
                   let dirty =
                     ref (Array.length old <> Array.length arr)
                   in
                   Array.iteri
                     (fun i it ->
                       let k = key_of it in
                       let unchanged_at i = key_of old.(i) = k in
                       let unchanged =
                         i < Array.length old
                         && unchanged_at i
                         &&
                         match Hashtbl.find_opt prev_items k with
                         | Some old_it -> same_item old_it it
                         | None -> false
                       in
                       if not unchanged then begin
                         dirty := true;
                         match Hashtbl.find_opt prev_items k with
                         | Some old_it when same_item old_it it -> ()
                         | _ ->
                             Hashtbl.replace versions k
                               (1
                                + Option.value
                                    (Hashtbl.find_opt versions k)
                                    ~default:0)
                       end)
                     arr;
                   if !dirty then begin
                     V.set_options v (options ());
                     publish v
                   end))
        | None -> None
      in
      (* Batches that add nodes (row mounts, raw-text swaps) must
         measure in this microtask — a debounce starves under scroll
         churn and rows stay at estimate height, overlapping. Pure
         subtree churn (typing inside a mounted row) is debounced to one
         remeasure per burst *)
      let measure_timer = ref (-1) in
      let obs =
        new_observer_records (fun recs ->
            let has_add =
              Array.exists
                (fun r -> Array.length (nl_to_array (rec_added r)) > 0)
                recs
            in
            if has_add then measure_rows list_el v
            else (
              if !measure_timer >= 0 then clear_timeout !measure_timer;
              measure_timer :=
                set_timeout_id (fun () -> measure_rows list_el v) 50))
      in
      observe obs list_el (observe_opts ~childList:true ~subtree:true);
      measure_rows list_el v;
      Signal.on_dispose ctx.ui_scope (fun () ->
          if !measure_timer >= 0 then clear_timeout !measure_timer;
          Hashtbl.remove instances list_id;
          Hashtbl.remove key_scrollers list_id;
          disconnect obs;
          Option.iter Signal.dispose_subscription pin_sub;
          Option.iter Signal.dispose_subscription data_sub;
          cleanup ())
  | _ -> ()

(* -- web adapter --

   Applies the role contract as props land: rows get data-index +
   absolute translateY, the spacer gets its height sizer style, regions
   pass data-attrs/style through verbatim. No listeners or foreign DOM —
   cleanup has nothing to release. *)

type virt_state =
  { mutable role : string
  ; mutable index : int
  ; mutable offset : float
  ; mutable height : float
  ; mutable style : string
  ; mutable attr_names : string list
  }

external virt_state_get : W.Element.t -> virt_state Js.Undefined.t =
  "__lsVirt" [@@mel.get]

external virt_state_set : W.Element.t -> virt_state -> unit = "__lsVirt"
  [@@mel.set]

let state_of el =
  match Js.Undefined.toOption (virt_state_get el) with
  | Some st -> st
  | None -> invalid_arg "logseq-virt: element missing __lsVirt state"

let set_class el s = W.Element.setClassName el s

let apply_data_attrs el st payload =
  let next = data_attrs_decode payload in
  List.iter
    (fun name ->
      if not (List.mem_assoc name next) then
        W.Element.removeAttribute name el)
    st.attr_names;
  List.iter
    (fun (name, value) -> W.Element.setAttribute name value el)
    next;
  st.attr_names <- List.map fst next

(* the fixed scaffold styles are applied together — a role's style is
   rewritten wholesale whenever one of its inputs moves *)
let apply_style el st =
  match st.role with
  | "row" ->
      W.Element.setAttribute "style"
        (Printf.sprintf
           "position:absolute;top:0;left:0;width:100%%;transform:translateY(%.4fpx)"
           st.offset)
        el
  | "spacer" ->
      W.Element.setAttribute "style"
        (Printf.sprintf "height:%.4fpx;position:relative;width:100%%"
           st.height)
        el
  | _ ->
      if st.style = "" then W.Element.removeAttribute "style" el
      else W.Element.setAttribute "style" st.style el

let set_property el prop value =
  let st = state_of el in
  match prop, value with
  | "role", StringValue v ->
      st.role <- v;
      apply_style el st
  | "index", IntValue v ->
      st.index <- v;
      W.Element.setAttribute "data-index" (string_of_int v) el
  | "offset", FloatValue v ->
      st.offset <- v;
      apply_style el st
  | "height", FloatValue v ->
      st.height <- v;
      apply_style el st
  | "style", StringValue v ->
      st.style <- v;
      apply_style el st
  | "data-attrs", StringValue payload -> apply_data_attrs el st payload
  | "style-class", StringValue v -> set_class el v
  | "accessibility-identifier", StringValue v ->
      W.Element.setAttribute "id" v el
  | _ -> ()

let remove_property el prop =
  let st = state_of el in
  match prop with
  | "index" -> W.Element.removeAttribute "data-index" el
  | "offset" | "height" ->
      apply_style el st
  | "style" ->
      st.style <- "";
      apply_style el st
  | "data-attrs" ->
      List.iter
        (fun name -> W.Element.removeAttribute name el)
        st.attr_names;
      st.attr_names <- []
  | "style-class" -> set_class el ""
  | "accessibility-identifier" -> W.Element.removeAttribute "id" el
  | _ -> ()

let adapter : web_extension_adapter =
  { web_extension_create =
      (fun _node document _emit ->
        let el = W.Document.createElement "div" document in
        virt_state_set el
          { role = "region"
          ; index = 0
          ; offset = 0.
          ; height = 0.
          ; style = ""
          ; attr_names = []
          };
        el)
  ; web_extension_set_property = set_property
  ; web_extension_remove_property = remove_property
  ; web_extension_cleanup = (fun _ -> ())
  }
