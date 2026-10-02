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
    ~key_of ~render (data : 'a array) : t =
  ignore scroll_parent_id;
  ignore overscan;
  ignore estimate_size;
  ignore pin_key;
  ignore pin_sig;
  ignore data_sig;
  fun ctx parent ->
    (D.dom ~style_class:list_class ~attrs:list_attrs
       (Array.to_list (Array.map (fun v ->
            let _ = key_of v in
            render v) data)))
      ctx parent
