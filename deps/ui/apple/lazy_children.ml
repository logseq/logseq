(* Native twin of virt/lazy_children.ml — emits the .block-children
   placeholder with a min-height; the Swift view's onAppear (inside the
   LazyVStack-windowed page) fires the "lazy-mount" dom-event which
   mounts the real children. The children spine still matches the web:
   mount order is per-block-children, same as the cljs IO gate. *)

open Lui_elements
module D = Logseq_dom

let forced : (string, unit) Hashtbl.t = Hashtbl.create 8
let force uuid = Hashtbl.replace forced uuid ()

(* TODO(component): the lazy-mount dom-event + data-lazy-mount attr are a
   Swift-side contract (onAppear triggers the mount); no component kind
   carries a custom event/attr channel, so the placeholder stays a
   logseq-div until the spine gets a dedicated extension. *)
let lazy_children ~key ~uuid ~min_height ~render : t =
 fun ctx parent ->
  let near =
    Signal.state ctx.Lui_ui.ui_scheduler (Hashtbl.mem forced uuid)
  in
  let near_sig = near.Signal.state_signal in
  (D.dom ~key ~style_class:"block-children"
     ~attrs_signal_v:
       (D.attrs_signal near_sig (fun n ->
          (if n then []
           else
             [ ("style", Printf.sprintf "min-height:%.0fpx" min_height) ])
          @ [ ("data-lazy-mount", uuid) ]))
     ~events:"lazy-mount"
     ~on_dom_event:(fun name _payload ->
       if name = "lazy-mount" then Signal.set near true)
     [ D.if_ ~test:near_sig (render ()) ])
    ctx parent
