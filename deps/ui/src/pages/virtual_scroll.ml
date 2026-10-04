(* ?virtualized=true windowed visibility.

   cljs ports block/page lists through react-virtuoso: a
   [data-virtuoso-scroller] wrapper, [data-index] rows, and unmounting of
   off-viewport rows. The OCaml UI keeps every row mounted and lets an
   IntersectionObserver toggle `visibility` instead — the layout box is
   preserved (stable scrollHeight, scrollIntoView still works) while
   off-viewport rows report as hidden, matching the observable contract
   without a real unmounting virtualizer.

   While a pointer is held down (block range selection), the same
   intersection callback plays the role of cljs virtuoso's items-rendered:
   the selection extends to each newly visible row's block. *)

type io
type io_opts

external io_opts : rootMargin:string -> io_opts = "" [@@mel.obj]

external new_io : (Js.Json.t array -> unit) -> io_opts -> io
  = "IntersectionObserver" [@@mel.new]

external io_observe : io -> Js.Json.t -> unit = "observe" [@@mel.send]

external entry_get : Js.Json.t -> string -> Js.Json.t = "" [@@mel.get_index]

external entry_bool : Js.Json.t -> string -> bool = "" [@@mel.get_index]

let enabled () =
  match Platform.query_param "virtualized" with
  | Some "true" -> true
  | _ -> false

let set_visibility entry =
  let target = entry_get entry "target" in
  let visibility =
    if entry_bool entry "isIntersecting" then "" else "hidden"
  in
  Web_dom.js_set (Web_dom.js_get target "style") "visibility"
    (Js.Json.string visibility)



let io = ref None

let observer () =
  match !io with
  | Some o -> o
  | None ->
      let o =
        new_io
          (fun entries -> Array.iter set_visibility entries)
          (* cljs virtuoso mounts rows up to 254px beyond the viewport
             (increase-viewport-by / overscan 254) *)
          (io_opts ~rootMargin:"254px")
      in
      io := Some o;
      o

(* virt_list's onChange calls this with the rendered window's edge row in
   the scroll direction — cljs virtuoso items-rendered boundary. Unlike a
   per-entry intersection walk it can't regress the range when a stale
   row fires its observer late *)
let extend_drag uuid =
  if Block_selection.is_down () then Block_selection.extend_to uuid

(* observe every [data-index] row under a [data-virtuoso-scroller] once;
   rows LUI rebuilds lose the marker and get re-observed *)
let sync () =
  if enabled () then
    let o = observer () in
    Array.iter
      (fun row ->
        match Web_dom.el_get_attr row "data-vs" with
        | Some _ -> ()
        | None ->
            Web_dom.el_set_attr row "data-vs" "1";
            io_observe o row)
      (Web_dom.query_selector_all_arr
         "[data-virtuoso-scroller] [data-index]")
