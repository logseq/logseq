(* Native twin of virt/virt_list.ml — emits every row as a real child
   (children spine identical to the web backend / master) and lets the
   SwiftUI LazyVStack virtualize at render time: views materialize only
   when scrolled into view, the same model as logseq/chat.

   The data-virt-count attribute selects the lazy column path on the
   Swift side; the last child's onAppear fires a "virt-end" dom-event
   which drives [on_end] pagination (journals scroll-back; a no-op on
   fixed-size lists). *)

open Lui_elements
module D = Logseq_dom

let enabled_min ~virtualize ~min count =
  virtualize && count > min

let enabled ~virtualize count = enabled_min ~virtualize ~min:64 count

let list ?(scroll_parent_id = "main-content-container") ?(overscan = 5)
    ?(estimate_size = fun _ -> 32.) ?(initial_rows = -1) ?(list_attrs = [])
    ?(list_class = "ls-virt-list") ?(pin_key = fun () -> None)
    ?(pin_sig = fun () -> None)
    ?(data_sig = fun (_ : Lui_ui.ui_context) -> None)
    ?(on_end = fun () -> ())
    ?(same_item = fun (a : 'a) (b : 'a) -> a == b || a = b)
    ~key_of ~render (data : 'a array) : t =
  ignore scroll_parent_id;
  ignore overscan;
  ignore pin_key;
  ignore pin_sig;
  fun ctx parent ->
    let sched = ctx.Lui_ui.ui_scheduler in
    let arr_sig =
      match data_sig ctx with
      | Some s -> s
      | None -> Signal.constant sched data
    in
    let attrs_sig =
      Logseq_dom.attrs_signal arr_sig (fun (arr : 'a array) ->
          list_attrs
          @ [ ("data-virt-count", string_of_int (Array.length arr)) ])
    in
    (* keyed rows with a per-key render version — mirrors the web twin:
       a splice keeps untouched rows mounted (adopted by key), and only
       rows whose item fails [same_item] get a version bump that remounts
       their row.  Callers whose items repaint internally from their own
       signals (journals' journal_page_sig) pass a key-only equality so
       splices never remount a whole day subtree. *)
    let versions : (string, int) Hashtbl.t = Hashtbl.create 16 in
    let prev_items : (string, 'a) Hashtbl.t = Hashtbl.create 16 in
    let source_sig =
      let prev : 'a array option ref = ref None in
      Signal.map
        (fun (arr : 'a array) ->
          (match !prev with
           | Some old ->
               Hashtbl.reset prev_items;
               Array.iter
                 (fun it -> Hashtbl.replace prev_items (key_of it) it)
                 old;
               Array.iter
                 (fun it ->
                   let k = key_of it in
                   match Hashtbl.find_opt prev_items k with
                   | Some old_it when same_item old_it it -> ()
                   | _ ->
                       (if Sys.getenv_opt "LOGSEQ_PERF" <> None then
                          Printf.eprintf "[virt-bump] %s\n%!" k);
                       Hashtbl.replace versions k
                         (1 + Option.value (Hashtbl.find_opt versions k)
                            ~default:0))
                 arr
           | None -> ());
          prev := Some arr;
          arr)
        arr_sig
    in
    let key_of_versioned (it : 'a) =
      Printf.sprintf "%s|%d" (key_of it)
        (Option.value (Hashtbl.find_opt versions (key_of it)) ~default:0)
    in
    (* [initial_rows >= 0]: rows outside the first [initial_rows] keys
       mount behind a one-way `near` latch — cljs page-root-virtual-list
       parity where offscreen rows don't exist in the DOM at all. The
       placeholder is a childless `.ls-virt-row[data-lazy-mount]` the
       flat spine reads as a spacer; its onAppear dom-event flips `near`
       and the real row mounts in place. Row data stays in the keyed
       source, so splices keep identity either way. The eager set is
       keyed by row id, not index — indexing the source would dirty
       every downstream row signal on any splice. *)
    let eager : (string, unit) Hashtbl.t = Hashtbl.create 64 in
    if initial_rows >= 0 then
      Array.iteri
        (fun i it ->
          if i < initial_rows then Hashtbl.replace eager (key_of it) ())
        (Signal.get arr_sig);
    let near_states : (string, bool Signal.state) Hashtbl.t =
      Hashtbl.create 8
    in
    let near_of (k : string) : bool Signal.state =
      match Hashtbl.find_opt near_states k with
      | Some s -> s
      | None ->
          let s = Signal.state sched false in
          Hashtbl.replace near_states k s;
          s
    in
    let row_mount (it : 'a) : t =
      let k = key_of it in
      if initial_rows < 0 || Hashtbl.mem eager k then
        D.dom ~style_class:"ls-virt-row" [ render it ]
      else
        let near = near_of k in
        let ns = near.Signal.state_signal in
        D.dom ~style_class:"ls-virt-row"
          ~attrs_signal_v:
            (D.attrs_signal ns (fun n ->
               ("data-lazy-mount", k)
               :: (if n then []
                   else
                     [ ( "style"
                       , Printf.sprintf "min-height:%.0fpx"
                           (estimate_size 0) )
                     ])))
          ~events:"lazy-mount"
          ~on_dom_event:(fun _name _payload -> Signal.set near true)
          [ D.if_ ~test:ns (render it) ]
    in
    D.dom ~style_class:list_class ~events:"virt-end"
      ~attrs_signal_v:attrs_sig
      ~on_dom_event:(fun _name _payload -> on_end ())
      [ D.keyed
          ~source:(Signal.map Array.to_list source_sig)
          ~key:key_of_versioned ~cmp:String.compare
          ~mount:(fun item_sig -> row_mount (Signal.get item_sig)) ]
      ctx parent

(* Signal-driven row stream: same [ls-virt-list] shell but children are
   a keyed collection, so a splice republishes only the touched rows —
   on this backend every row is a real child anyway, so diffing per row
   is what keeps outliner ops cheap on huge pages (a single-block edit
   must not re-emit the whole stream). *)
let rows_sig ~key ~cmp ~mount ?(on_end = fun () -> ())
    ?(initial_rows = -1) ~estimate_size
    (source : 'a list Signal.signal) : t =
 fun ctx parent ->
  let sched = ctx.Lui_ui.ui_scheduler in
  let count_sig = Signal.map List.length source in
  let attrs_sig =
    Logseq_dom.attrs_signal count_sig (fun n ->
        [ ("data-virt-count", string_of_int n) ])
  in
  (* same lazy latch as [list]: rows outside the first [initial_rows]
     keys start as a childless `.ls-virt-row[data-lazy-mount]` spacer and
     mount their real content when the spine reports them near the
     viewport. Keyed by row id — index-based gating would dirty every
     downstream signal on a splice. *)
  let eager : (string, unit) Hashtbl.t = Hashtbl.create 64 in
  if initial_rows >= 0 then
    List.iteri
      (fun i it ->
        if i < initial_rows then Hashtbl.replace eager (key it) ())
      (Signal.get source);
  let near_states : (string, bool Signal.state) Hashtbl.t =
    Hashtbl.create 8
  in
  let near_of (k : string) : bool Signal.state =
    match Hashtbl.find_opt near_states k with
    | Some s -> s
    | None ->
        let s = Signal.state sched false in
        Hashtbl.replace near_states k s;
        s
  in
  let row_mount (item_sig : 'a Signal.signal) : t =
    let k = key (Signal.get item_sig) in
    if initial_rows < 0 || Hashtbl.mem eager k then
      D.dom ~style_class:"ls-virt-row" [ mount item_sig ]
    else
      let near = near_of k in
      let ns = near.Signal.state_signal in
      D.dom ~style_class:"ls-virt-row"
        ~attrs_signal_v:
          (D.attrs_signal ns (fun n ->
             ("data-lazy-mount", k)
             :: (if n then []
                 else
                   [ ( "style"
                     , Printf.sprintf "min-height:%.0fpx" (estimate_size 0)
                     )
                   ])))
        ~events:"lazy-mount"
        ~on_dom_event:(fun _name _payload -> Signal.set near true)
        [ D.if_ ~test:ns (mount item_sig) ]
  in
  (D.dom ~style_class:"ls-virt-list" ~events:"virt-end"
     ~attrs_signal_v:attrs_sig
     ~on_dom_event:(fun _name _payload -> on_end ())
     [ D.keyed ~source ~key ~cmp ~mount:row_mount ])
    ctx parent
