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
    ~key_of ~render (data : 'a array) : t =
  ignore scroll_parent_id;
  ignore overscan;
  ignore estimate_size;
  ignore initial_rows;
  ignore pin_key;
  ignore pin_sig;
  ignore key_of;
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
    let children_of (arr : 'a array) =
      List.init (Array.length arr) (fun i -> render arr.(i))
    in
    D.dyn ~equal:(fun a b -> a == b)
      (fun arr ->
        D.dom ~style_class:list_class ~events:"virt-end"
          ~attrs_signal_v:attrs_sig
          ~on_dom_event:(fun _name _payload -> on_end ())
          (children_of arr))
      arr_sig ctx parent
