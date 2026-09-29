(* Imperative virtualized rows for the views tables/lists. Same
   @tanstack/virtual-core driver as virt/Virt_list (see that file for the
   DOM contract), but mounting D.el rows imperatively — the views layer
   renders raw els, not LUI elements.

   The caller rebuilds the whole list element on every refresh, so the
   mounted virtualizer is keyed to the list element's lifetime: dead
   instances are pruned when their list el leaves the document. *)

module V = Virtualizer
module D = Views_dom
module Ed = Editor_dom

external el_to_json : D.el -> V.element = "%identity"

external el_query_all : D.el -> string -> Ed.node_list = "querySelectorAll"
  [@@mel.send]

external disconnect : Ed.mutation_observer -> unit = "disconnect"
  [@@mel.send]

let id_counter = ref 0

let next_id () =
  incr id_counter;
  "ls-views-virt-" ^ string_of_int !id_counter

(* measure every mounted [data-index] row, debounced — row content edits
   (editor textContent syncs) mutate the subtree per keystroke *)
let measure_rows list_el (v : V.t) =
  let nl = el_query_all list_el "[data-index]" in
  for i = 0 to Ed.node_list_length nl - 1 do
    match Ed.node_list_item nl i with
    | Some el -> V.measure_element v (Js.Nullable.return (el_to_json el))
    | None -> ()
  done;
  V.measure_element v Js.Nullable.null

(* (list_el, cleanup) pairs for live instances; pruned when a refresh
   detaches their list el *)
let live : (D.el * (unit -> unit)) list ref = ref []

let prune () =
  live :=
    List.filter_map
      (fun (list_el, cleanup) ->
        if D.el_is_connected list_el then Some (list_el, cleanup)
        else (
          cleanup ();
          None))
      !live

let render_rows ~margin ~cache ~spacer ~data ~render_el (v : V.t) =
  D.el_set_attr spacer "style"
    (Printf.sprintf "height:%.2fpx;position:relative;width:100%%"
       (V.get_total_size v));
  let items = V.get_virtual_items v in
  let wanted = Hashtbl.create (2 * Array.length items) in
  Array.iter (fun it -> Hashtbl.replace wanted (V.item_key it) ()) items;
  let stale =
    Hashtbl.fold
      (fun k w acc -> if Hashtbl.mem wanted k then acc else (k, w) :: acc)
      cache []
  in
  List.iter
    (fun (k, w) ->
      D.el_remove w;
      Hashtbl.remove cache k)
    stale;
  Array.iter
    (fun it ->
      let key = V.item_key it in
      let idx = V.item_index it in
      let wrap =
        match Hashtbl.find_opt cache key with
        | Some w -> w
        | None ->
            let w =
              D.h ~cls:"ls-virt-row"
                ~children:
                  [
                    (if idx < Array.length data then render_el idx data.(idx)
                     else D.h ());
                  ]
                ()
            in
            Hashtbl.replace cache key w;
            w
      in
      D.el_set_attr wrap "data-index" (string_of_int idx);
      D.el_set_attr wrap "style"
        (Printf.sprintf
           "position:absolute;top:0;left:0;width:100%%;transform:translateY(%.2fpx)"
           (V.item_start it -. !margin));
      D.el_append_child spacer wrap)
    items

let attach ~list_id ~scroll_parent_id ~data ~key_of ~overscan ~estimate_size
    ~render_el ~margin ~cache ~spacer =
  match
    (Ed.get_element_by_id list_id, Ed.get_element_by_id scroll_parent_id)
  with
  | Some list_el, Some scroll_el ->
      margin :=
        D.rect_top (D.el_rect list_el)
        -. D.rect_top (D.el_rect scroll_el)
        +. D.el_scroll_top scroll_el;
      let v =
        V.make
          (V.options ~count:(Array.length data)
             ~getScrollElement:(fun () ->
               Js.Nullable.return (el_to_json scroll_el))
             ~estimateSize:estimate_size ~scrollToFn:V.element_scroll
             ~observeElementRect:V.observe_element_rect
             ~observeElementOffset:V.observe_element_offset
             ~onChange:(fun inst _sync ->
               render_rows ~margin ~cache ~spacer ~data ~render_el inst)
             ~getItemKey:(fun i -> key_of data.(i))
             ~overscan ~scrollMargin:!margin ())
      in
      let v_cleanup = V.did_mount v in
      V.will_update v;
      render_rows ~margin ~cache ~spacer ~data ~render_el v;
      let debounced_measure = D.debounce 50 in
      let obs =
        Ed.new_observer (fun () ->
            debounced_measure (fun () -> measure_rows list_el v))
      in
      Ed.observe obs list_el (Ed.observe_opts ~childList:true ~subtree:true);
      measure_rows list_el v;
      live :=
        ( list_el
        , fun () ->
            disconnect obs;
            v_cleanup () )
        :: !live
  | _ -> ()

(* A virtualized flat list over imperative [render_el] rows. Mounts a
   deferred Virtualizer once the list element is in the document. *)
let rows ?(scroll_parent_id = "main-content-container") ?(overscan = 5)
    ?(estimate_size = fun _ -> 32.) ~key_of ~render_el (data : 'a array) :
    D.el =
  prune ();
  let list_id = next_id () in
  let margin = ref 0. in
  let cache : (string, D.el) Hashtbl.t = Hashtbl.create 32 in
  let spacer = D.h ~cls:"ls-virt-spacer" () in
  let list_el =
    D.h ~cls:"ls-virt-list" ~attrs:[ ("id", list_id) ] ~children:[ spacer ]
      ()
  in
  Ed.set_timeout
    (fun () ->
      attach ~list_id ~scroll_parent_id ~data ~key_of ~overscan
        ~estimate_size ~render_el ~margin ~cache ~spacer)
    0;
  list_el
