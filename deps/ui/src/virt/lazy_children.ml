(* Lazy mount of a .block-children subtree — cljs lazy-block-children
   parity: inside :virtualize? pages, an offscreen children container
   renders an estimated-height placeholder; an IntersectionObserver with
   a 1200px root margin mounts the real children as it approaches the
   viewport. Mount is a one-way latch — once mounted the subtree stays.

   Uuids of subtrees that must mount immediately (an anchor's ancestor
   chain on scroll-to-block) go through [force]. *)

open Lui_elements

module V = Virtualizer
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


type element = V.element

external get_by_id : string -> element option = "getElementById"
  [@@mel.scope "document"] [@@mel.return nullable]

external bounding_rect : element -> Js.Json.t = "getBoundingClientRect"
  [@@mel.send]

external rect_top : Js.Json.t -> float = "top" [@@mel.get]
external rect_bottom : Js.Json.t -> float = "bottom" [@@mel.get]
external inner_height : float = "innerHeight" [@@mel.scope "window"]

type intersection_observer
type io_opts

external io_opts : rootMargin:string -> io_opts = "" [@@mel.obj]

external new_io : (Js.Json.t array -> unit) -> io_opts -> intersection_observer
  = "IntersectionObserver" [@@mel.new]

external io_observe : intersection_observer -> element -> unit = "observe"
  [@@mel.send]

external io_disconnect : intersection_observer -> unit = "disconnect"
  [@@mel.send]

external entry_intersecting : Js.Json.t -> bool = "isIntersecting" [@@mel.get]

external set_timeout : (unit -> unit) -> int -> unit = "setTimeout"
  [@@mel.scope "window"]

(* Lazy mounting needs a real, queryable DOM: a browser document
   (nodeType 9) plus IntersectionObserver. The Drive test backend
   mounts nodes without a DOM (its stub document is a nodeType-1
   element) and legacy browsers lack IO — in both cases the barrier
   could never lift, so mount eagerly. *)
let lazy_feasible : bool =
  [%mel.raw
    "typeof document !== 'undefined' && document.nodeType === 9 && typeof IntersectionObserver !== 'undefined'"]

let margin = 1200.

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

let near_viewport el =
  let r = bounding_rect el in
  let vh = inner_height in
  rect_top r < vh +. margin && rect_bottom r > -. margin

let attach ctx el_id near =
  let alive = ref true and observer = ref None in
  Signal.on_dispose ctx.Lui_ui.ui_scope (fun () ->
    alive := false;
    Option.iter io_disconnect !observer);
  let mount () =
    if !alive then begin
      Signal.set near true;
      Option.iter io_disconnect !observer;
      Runtime.flush ()
    end
  in
  match get_by_id el_id with
  (* cljs: (or forced? (nil? ref) (near?)) -> mount — a missing element
     mounts immediately rather than staying a placeholder forever *)
  | None -> mount ()
  | Some el ->
      if near_viewport el then mount ()
      else begin
        let io =
          new_io
            (fun entries ->
              if Array.exists entry_intersecting entries then
                mount ())
            (io_opts ~rootMargin:(Printf.sprintf "%.0fpx 0px" margin))
        in
        observer := Some io;
        io_observe io el
      end

let lazy_children ~key ~uuid ~min_height ~render : t =
 fun ctx parent ->
  let near =
    Signal.state ctx.Lui_ui.ui_scheduler
      (Hashtbl.mem forced uuid || not lazy_feasible)
  in
  let near_sig = (Signal.value (near)) in
  register_force ctx uuid near;
  let alive = ref true in
  Signal.on_dispose ctx.Lui_ui.ui_scope (fun () -> alive := false);
  let el_id = "lazy-" ^ key in
  if lazy_feasible && not (Hashtbl.mem forced uuid) then
    set_timeout (fun () ->
      if !alive && not (Signal.get near_sig) then attach ctx el_id near) 0;
  (column ~key ~accessibility_identifier:el_id ~style_class:"block-children"
     ~grow:1.
     [ Lui_elements.if_
         ~test:(Logseq_el.own ctx (Signal.map (fun n -> not n) near_sig))
         (spacer ~key:"lazy-ph"
            ~min_height:(int_of_float (Float.round min_height)) [])
     ; Lui_elements.if_ ~test:near_sig (render ()) ])
    ctx parent

(* Web journal rows stay eager — the page-level virtualizer owns the
   windowing and nested per-row IO gates would fight its measurements.
   Only the native twin gates rows (native first-frame cost). *)
let lazy_rows ~active_key ~key ~cmp ~mount ~estimate_height:_ ~source : t =
  ignore active_key;
  Lui_elements.keyed ~source ~key ~cmp ~mount
