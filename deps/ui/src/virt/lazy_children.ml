(* Lazy mount of a .block-children subtree — cljs lazy-block-children
   parity: inside :virtualize? pages, an offscreen children container
   renders an estimated-height placeholder; an IntersectionObserver with
   a 1200px root margin mounts the real children as it approaches the
   viewport. Mount is a one-way latch — once mounted the subtree stays.

   Uuids of subtrees that must mount immediately (an anchor's ancestor
   chain on scroll-to-block) go through [force]. *)

open Lui_elements

module V = Virtualizer
module D = Logseq_dom

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
let force uuid = Hashtbl.replace forced uuid ()

let near_viewport el =
  let r = bounding_rect el in
  let vh = inner_height in
  rect_top r < vh +. margin && rect_bottom r > -. margin

let attach ctx el_id near =
  match get_by_id el_id with
  (* cljs: (or forced? (nil? ref) (near?)) -> mount — a missing element
     mounts immediately rather than staying a placeholder forever *)
  | None -> Signal.set near true
  | Some el ->
      if near_viewport el then Signal.set near true
      else begin
        let io =
          new_io
            (fun entries ->
              if Array.exists entry_intersecting entries then
                Signal.set near true)
            (io_opts ~rootMargin:(Printf.sprintf "%.0fpx 0px" margin))
        in
        io_observe io el;
        Signal.on_dispose ctx.Lui_ui.ui_scope (fun () -> io_disconnect io)
      end

let lazy_children ~key ~uuid ~min_height ~render : t =
 fun ctx parent ->
  let near =
    Signal.state ctx.Lui_ui.ui_scheduler
      (Hashtbl.mem forced uuid || not lazy_feasible)
  in
  let near_sig = near.Signal.state_signal in
  let el_id = "lazy-" ^ key in
  if lazy_feasible && not (Hashtbl.mem forced uuid) then
    set_timeout (fun () -> attach ctx el_id near) 0;
  (box ~key ~accessibility_identifier:el_id ~style_class:"block-children"
     [ D.if_
         ~test:(Signal.map (fun n -> not n) near_sig)
         (spacer ~key:"lazy-ph"
            ~min_height:(int_of_float (Float.round min_height)) [])
     ; D.if_ ~test:near_sig (render ()) ])
    ctx parent

(* Web journal rows stay eager — the page-level virtualizer owns the
   windowing and nested per-row IO gates would fight its measurements.
   Only the native twin gates rows (gpui first-frame cost). *)
let lazy_rows ~key ~cmp ~mount ~estimate_height:_ ~source : t =
  D.keyed ~source ~key ~cmp ~mount
