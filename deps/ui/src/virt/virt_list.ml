(* LUI virtualized list — a flat [data] array rendered as absolutely
   positioned rows inside a total-height spacer, driven by a
   @tanstack/virtual-core Virtualizer bound to an outer scroll element
   ([scroll_parent_id], the app scroll container by default).

   DOM contract (cljs Virtuoso parity):
     <div class="ls-virt-list" id=list_id>
       <div class="ls-virt-spacer" style="height:totalSize;position:relative">
         <div class="ls-virt-row" data-index=i
              style="position:absolute;...;transform:translateY(start-margin)">

   Row measurement is dynamic: a MutationObserver registers each mounted
   [data-index] row with [Virtualizer.measure_element], which tracks sizes
   through the virtualizer's own ResizeObserver. *)

open Lui_elements

module V = Virtualizer
module D = Logseq_dom

let keyed = D.keyed

type element = V.element

(* -- local DOM helpers (elements as opaque JSON values) -- *)

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

external new_observer : (unit -> unit) -> mutation_observer
  = "MutationObserver" [@@mel.new]

external new_observer_records : (mutation_record array -> unit) -> mutation_observer
  = "MutationObserver" [@@mel.new]

external rec_added : mutation_record -> Js.Json.t = "addedNodes"
  [@@mel.get]

external observe_opts : childList:bool -> subtree:bool -> observe_opts = ""
  [@@mel.obj]

external observe : mutation_observer -> element -> observe_opts -> unit
  = "observe" [@@mel.send]

external disconnect : mutation_observer -> unit = "disconnect" [@@mel.send]

external set_timeout : (unit -> unit) -> int -> unit = "setTimeout"
  [@@mel.scope "window"]

external set_timeout_id : (unit -> unit) -> int -> int = "setTimeout"
  [@@mel.scope "window"]

external clear_timeout : int -> unit = "clearTimeout"
  [@@mel.scope "window"]

(* -- state -- *)

type vrow = { v_index : int; v_key : string; v_start : float }

type vstate = { v_rows : vrow list; v_total : float }

(* live virtualizer instances keyed by their list element id — callers can
   drive scroll_to_index/scroll_to_key (e.g. editor scroll-to-block) *)
let instances : (string, V.t) Hashtbl.t = Hashtbl.create 8

let instance_of list_id = Hashtbl.find_opt instances list_id

let scroll_to_index list_id index ?align () =
  match instance_of list_id with
  | Some v ->
      V.scroll_to_index v index (V.scroll_to_options ?align ())
  | None -> ()

let scroll_to_offset list_id offset =
  match instance_of list_id with
  | Some v -> V.scroll_to_offset v offset
  | None -> ()

let id_counter = ref 0

let next_id () =
  incr id_counter;
  "ls-virt-" ^ string_of_int !id_counter

(* cljs gating (block.cljs use-virtual-list-opts): ?virtualized=true forces
   windowing; otherwise the standalone page outliner window-renders only
   when it has >=64 top-level rows. rtc-test mode disables both unless the
   flag is set. *)
let force_virtualized () =
  Platform.query_param "virtualized" = Some "true"

let enabled_min ~virtualize ~min count =
  let force = force_virtualized () in
  (* force amplifies a virtualize:true caller — it must NOT virtualize a
     virtualize:false one (journal items' inner block lists would nest
     scrollers inside the outer journals scroller) *)
  virtualize
  && (force || count >= min)
  && not (Platform.rtc_test_mode () && not force)

let enabled ~virtualize count = enabled_min ~virtualize ~min:64 count

(* measure every mounted [data-index] row, then prune dropped nodes *)
let measure_rows list_el (v : V.t) =
  let items = nl_to_array (query_selector_all list_el "[data-index]") in
  Array.iter (fun el -> V.measure_element v (Js.Nullable.return el)) items;
  V.measure_element v Js.Nullable.null;
  (* freshly mounted rows need IntersectionObserver registration for
     pointer-down range selection (cljs virtuoso items-rendered) *)
  Virtual_scroll.sync ()

let rows_of (v : V.t) =
  Array.to_list (V.get_virtual_items v)
  |> List.map (fun it ->
         { v_index = V.item_index it
         ; v_key = V.item_key it
         ; v_start = V.item_start it
         })

(* One mounted list instance: deferred virtualizer attach once the list
   element exists, scope cleanup on unmount. *)
let attach (ctx : Lui_ui.ui_context) st margin list_id scroll_parent_id
    data key_of overscan estimate_size =
  match get_by_id list_id, get_by_id scroll_parent_id with
  | Some list_el, Some scroll_el ->
      margin :=
        rect_top (bounding_rect list_el)
        -. rect_top (bounding_rect scroll_el)
        +. scroll_top scroll_el;
      let last_scroll = ref (scroll_top scroll_el) in
      let publish v =
        let rows = rows_of v in
        Signal.set st { v_rows = rows; v_total = V.get_total_size v };
        Runtime.flush ();
        (* cljs virtuoso items-rendered: while a block-range drag is in
           progress the selection extends to the boundary row in the
           scroll direction — a stale mid-range row must never shrink it.
           Direction follows the scroll offset, not the rendered start —
           an overscan row appearing at the edge is not a scroll *)
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
             | Some r when r.v_index < Array.length data ->
                 Virtual_scroll.extend_drag (key_of data.(r.v_index))
             | _ -> ())
        | Some `Up, first :: _ ->
            if first.v_index < Array.length data then
              Virtual_scroll.extend_drag (key_of data.(first.v_index))
        | _ -> ()
      in
      let v =
        V.make
          (V.options ~count:(Array.length data)
             ~getScrollElement:(fun () -> Js.Nullable.return scroll_el)
             ~estimateSize:estimate_size
             ~scrollToFn:V.element_scroll
             ~observeElementRect:V.observe_element_rect
             ~observeElementOffset:V.observe_element_offset
             ~onChange:(fun inst _sync -> publish inst)
             ~getItemKey:(fun i -> key_of data.(i))
             ~overscan ~scrollMargin:!margin
             (* the default measurement is offsetHeight (integer) —
                fractional row heights (headings, code blocks) get
                truncated and the next row then overlaps the remainder; a
                border-box rect keeps sub-pixel heights *)
             ~measureElement:(fun el _entry _inst ->
               rect_height (bounding_rect el))
             ())
      in
      Hashtbl.replace instances list_id v;
      let cleanup = V.did_mount v in
      V.will_update v;
      publish v;
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
          disconnect obs;
          cleanup ())
  | _ -> ()

let row_attrs margin (it : vrow) =
  [ ("data-index", string_of_int it.v_index)
  ; ( "style"
    , Printf.sprintf
        "position:absolute;top:0;left:0;width:100%%;transform:translateY(%.4fpx)"
        (it.v_start -. margin) )
  ]

let list ?(scroll_parent_id = "main-content-container") ?(overscan = 5)
    ?(estimate_size = fun _ -> 32.) ?(list_attrs = [])
    ?(list_class = "ls-virt-list") ~key_of ~render (data : 'a array) : t =
 fun ctx parent ->
  let st = Signal.state ctx.ui_scheduler { v_rows = []; v_total = 0. } in
  let margin = ref 0. in
  let list_id = next_id () in
  let vstate_sig = st.Signal.state_signal in
  let spacer_attrs =
    Signal.map
      (fun s ->
        [ ( "style"
          , Printf.sprintf "height:%.4fpx;position:relative;width:100%%"
              s.v_total )
        ])
      vstate_sig
  in
  let row_mount (row_sig : vrow Signal.signal) : t =
    let row = Signal.get row_sig in
    D.dom ~key:("vr-" ^ row.v_key) ~style_class:"ls-virt-row"
      ~attrs:(reactive (fun it -> row_attrs !margin it) row_sig)
      [ if row.v_index < Array.length data then render data.(row.v_index)
        else box ~key:("vrx-" ^ row.v_key) [] ]
  in
  set_timeout
    (fun () ->
      attach ctx st margin list_id scroll_parent_id data key_of overscan
        estimate_size)
    0;
  D.dom ~key:("vl-" ^ list_id) ~id:list_id ~style_class:list_class
    ~attrs:list_attrs
    [ D.dom ~key:("vs-" ^ list_id) ~style_class:"ls-virt-spacer"
        ~attrs_signal:spacer_attrs
        [ keyed ~source:(Signal.map (fun s -> s.v_rows) vstate_sig)
            ~key:(fun r -> r.v_key) ~cmp:String.compare ~mount:row_mount
        ]
    ]
    ctx parent
