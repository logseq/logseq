(* Native twin of virt/lazy_children.ml — emits the .block-children
   placeholder with a min-height; the host view's onAppear (inside the
   LazyVStack-windowed page) fires the "lazy-mount" dom-event which
   mounts the real children. The children spine still matches the web:
   mount order is per-block-children, same as the cljs IO gate. *)

open Lui_elements
module D = Logseq_el

(* Mounted is a lifecycle projection, not viewport geometry or document order.
   Readers borrow the source; row and reader scopes jointly own its lifetime. *)
module Mounted_uuids = Stdlib.Set.Make (String)

type mounted_projection =
  { scheduler : Signal.scheduler
  ; scope : string
  ; counts : (string, int) Hashtbl.t
  ; state : Mounted_uuids.t Signal.state
  ; mutable mounted : Mounted_uuids.t
  ; mutable users : int
  }

let mounted_projections : mounted_projection list ref = ref []

let retain_mounted ctx scope =
  let projection =
    match List.find_opt (fun p ->
        p.scheduler == ctx.Lui_ui.ui_scheduler && p.scope = scope)
        !mounted_projections with
    | Some p -> p
    | None ->
        let p =
          { scheduler = ctx.Lui_ui.ui_scheduler; scope
          ; counts = Hashtbl.create 16
          ; state = Signal.state ctx.Lui_ui.ui_scheduler Mounted_uuids.empty
          ; mounted = Mounted_uuids.empty; users = 0 }
        in
        mounted_projections := p :: !mounted_projections;
        p
  in
  projection.users <- projection.users + 1;
  projection

let release_mounted projection =
  projection.users <- projection.users - 1;
  if projection.users = 0 then begin
    mounted_projections :=
      List.filter (fun p -> p != projection) !mounted_projections;
    Signal.dispose_signal (Signal.value projection.state)
  end

let mounted_uuids ~scope ctx =
  let projection = retain_mounted ctx scope in
  Signal.on_dispose ctx.Lui_ui.ui_scope (fun () -> release_mounted projection);
  Signal.value projection.state

let track_mounted ~scope ~uuid child : t =
 fun ctx parent ->
  let projection = retain_mounted ctx scope in
  let count = Option.value (Hashtbl.find_opt projection.counts uuid) ~default:0 in
  Hashtbl.replace projection.counts uuid (count + 1);
  if count = 0 then begin
    projection.mounted <- Mounted_uuids.add uuid projection.mounted;
    Signal.set projection.state projection.mounted
  end;
  Signal.on_dispose ctx.Lui_ui.ui_scope (fun () ->
    let count = Hashtbl.find projection.counts uuid in
    if count = 1 then begin
      Hashtbl.remove projection.counts uuid;
      projection.mounted <- Mounted_uuids.remove uuid projection.mounted;
      Signal.set projection.state projection.mounted
    end else Hashtbl.replace projection.counts uuid (count - 1);
    release_mounted projection);
  child ctx parent


let forced : (string, unit) Hashtbl.t = Hashtbl.create 8
let waiting : (string, (unit -> unit) list) Hashtbl.t = Hashtbl.create 8

let force uuid =
  Hashtbl.replace forced uuid ();
  List.iter (fun mount -> mount ())
    (Option.value (Hashtbl.find_opt waiting uuid) ~default:[]);
  Runtime.flush ()

let register_force ctx uuid near =
  let mount () = Signal.set near true in
  Hashtbl.replace waiting uuid
    (mount :: Option.value (Hashtbl.find_opt waiting uuid) ~default:[]);
  Signal.on_dispose ctx.Lui_ui.ui_scope (fun () ->
    let rest = List.filter (fun f -> f != mount)
        (Option.value (Hashtbl.find_opt waiting uuid) ~default:[]) in
    if rest = [] then Hashtbl.remove waiting uuid
    else Hashtbl.replace waiting uuid rest)

(* TODO(component): the lazy-mount dom-event is a host-side contract
   (onAppear triggers the mount); the attr half could ride ~data_attrs
   but no component kind carries a custom event channel, so the
   placeholder stays a logseq-div until the spine gets a dedicated
   extension. *)
let lazy_children ~key ~uuid ~min_height ~render : t =
 fun ctx parent ->
  let near =
    Signal.state ctx.Lui_ui.ui_scheduler
      (Hashtbl.mem forced uuid || not (Virt_list.lazy_spine ctx))
  in
  let near_sig = (Signal.value (near)) in
  register_force ctx uuid near;
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
let lazy_rows ~active_key ~key ~cmp ~mount ~estimate_height ~source : t =
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
           ~mount:(fun bs row_ctx row_parent ->
             let b = Signal.get bs in
             let uuid = key b in
             let near = near_of uuid in
             let near_sig = Signal.value near in
             (* Editor activation can precede the viewport event for a new row.
                Keep the latch raised until the host measures and releases it. *)
             Option.iter (fun source ->
               ignore (Signal.own row_ctx.Lui_ui.ui_scope
                 (Signal.subscribe ~emit_initial:true source (fun active ->
                   if active=Some uuid then Signal.set near true)))) active_key;
             Virt_list.lazy_row ~key:uuid ~estimate_size:(fun _ -> estimate_height b)
               ~pinned:(fun () -> match active_key with
                 | Some source -> Signal.get source=Some uuid
                 | None -> false)
               near near_sig (mount bs) row_ctx row_parent) ])
      ctx parent
  end
