(* Native twin of virt/virt_list.ml — virtualization off; rows render
   eagerly (the SwiftUI list realizes cells lazily on its own). *)

open Lui_elements
module D = Logseq_dom

let enabled_min ~virtualize ~min count =
  virtualize && count > min

let enabled ~virtualize count = enabled_min ~virtualize ~min:64 count

let list ?(scroll_parent_id = "main-content-container") ?(overscan = 5)
    ?(estimate_size = fun _ -> 32.) ?(list_attrs = [])
    ?(list_class = "ls-virt-list") ?(pin_key = fun () -> None)
    ?(pin_sig = fun () -> None)
    ?(data_sig = fun (_ : Lui_ui.ui_context) -> None)
    ?(on_end = fun () -> ())
    ~key_of ~render (data : 'a array) : t =
  ignore scroll_parent_id;
  ignore overscan;
  ignore estimate_size;
  ignore pin_key;
  ignore pin_sig;
  fun ctx parent ->
    (* rows emit eagerly — the SwiftUI side lazily realizes them. A
       swapped data_sig array re-renders the children (paginated days
       append without a route re-render); rendering the LAST item asks
       the owner for the next page — the request is deduped upstream so
       repeat mounts while data is being appended are cheap *)
    let children_of (arr : 'a array) : t =
      D.dom ~style_class:list_class ~attrs:list_attrs
        (Array.to_list
           (Array.mapi
              (fun i v ->
                let _ = key_of v in
                fun ctx parent ->
                  if i = Array.length arr - 1 then on_end ();
                  render v ctx parent)
              arr))
    in
    (match data_sig ctx with
     | Some sig_ ->
         Logseq_dom.dyn
           ~equal:(fun (a : 'a array) b -> a == b) children_of sig_
     | None -> children_of data)
      ctx parent
