(* Native twin of virt/lazy_children.ml — emits the .block-children
   placeholder with a min-height; the host view's onAppear (inside the
   LazyVStack-windowed page) fires the "lazy-mount" dom-event which
   mounts the real children. The children spine still matches the web:
   mount order is per-block-children, same as the cljs IO gate. *)

open Lui_elements
module D = Logseq_el

let forced : (string, unit) Hashtbl.t = Hashtbl.create 8
let force uuid = Hashtbl.replace forced uuid ()

(* TODO(component): the lazy-mount dom-event is a host-side contract
   (onAppear triggers the mount); the attr half could ride ~data_attrs
   but no component kind carries a custom event channel, so the
   placeholder stays a logseq-div until the spine gets a dedicated
   extension. *)
let lazy_children ~key ~uuid ~min_height ~render : t =
 fun ctx parent ->
  let near =
    Signal.state ctx.Lui_ui.ui_scheduler (Hashtbl.mem forced uuid)
  in
  let near_sig = (Signal.value (near)) in
  (Virt_list.lazy_row ~node_key:key ~style_class:"block-children" ~key:uuid
    ~estimate_size:(fun _ -> min_height) near near_sig (render ())) ctx parent

(* Parse the uuids array out of a batched lazy-mount payload. *)
let uuids_of_payload payload =
  match payload with
  | None -> []
  | Some raw -> (
      try
        match Js.Json.decodeObject (Js.Json.parseExn raw) with
        | Some obj -> (
            match Js.Dict.get obj "uuids" with
            | Some arr -> (
                match Js.Json.decodeArray arr with
                | Some items ->
                    Array.to_list items
                    |> List.filter_map Js.Json.decodeString
                | None -> [])
            | None -> [])
        | None -> []
      with _ -> [])

(* Journal-day rows mount through a plain keyed collection (no
   virtualizer container), so on the native host each row is gated by the
   same near-viewport contract: a childless `.ls-virt-row` div with a
   min-height until the native spine reports it near the viewport. The
   container listens for one batched "lazy-mount" event carrying every
   near row's uuid — a single publish round lifts all their latches.
   Other hosts keep the eager mount — the native backend already windows the
   journals page and the web gate lives in the outer list. *)
let lazy_rows ~key ~cmp ~mount ~estimate_height ~source : t =
 fun ctx parent ->
  if Lui_ui.host ctx <> Lui_protocol.GenericHost then
    (Lui_elements.keyed ~source ~key ~cmp ~mount) ctx parent
  else begin
    let sched = ctx.Lui_ui.ui_scheduler in
    (* Latches belong to this mounted list. A global table would keep
       every disposed list's signals and scheduler reachable. *)
    let near_states : (string,bool Signal.state) Hashtbl.t = Hashtbl.create 16 in
    Signal.on_dispose ctx.Lui_ui.ui_scope (fun () -> Hashtbl.clear near_states);
    let near_of uuid =
      match Hashtbl.find_opt near_states uuid with
      | Some s -> s
      | None ->
          let s = Signal.state sched (Hashtbl.mem forced uuid) in
          Hashtbl.replace near_states uuid s;
          s
    in
    (Logseq_el.el  ~events:"lazy-mount"
       ~on_dom_event:(fun name payload ->
         if name = "lazy-mount" then
           List.iter
             (fun uuid -> Signal.set (near_of uuid) true)
             (uuids_of_payload payload))
       [ Lui_elements.keyed ~source ~key ~cmp
           ~mount:(fun bs ->
             let b = Signal.get bs in
             let uuid = key b in
             let near = near_of uuid in
             let near_sig = (Signal.value (near)) in
             Virt_list.lazy_row ~key:uuid ~estimate_size:(fun _ -> estimate_height b)
               near near_sig (mount bs)) ])
      ctx parent
  end
