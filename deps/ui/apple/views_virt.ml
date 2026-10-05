(* Native twin of views/views_virt.ml — imperative virtualization is
   unreachable on the native path (Virt_list.enabled is always false);
   only the exported surface is provided. *)

type el = Views_dom.el

let rows ?(scroll_parent_id = "main-content-container") ?(overscan = 5)
    ?(estimate_size = fun _ -> 32.) ~key_of ~render_el (data : 'a array)
    : Views_dom.el =
  ignore scroll_parent_id;
  ignore overscan;
  ignore estimate_size;
  ignore key_of;
  ignore render_el;
  Views_dom.new_el ()
