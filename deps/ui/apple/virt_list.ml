(* Native twin of virt/virt_list.ml — windowed emission: every row mounts
   as an `if_` conditional gated by a shared emit-range signal, so only the
   rows inside the requested viewport window materialize as nodes. The
   SwiftUI scroll container reports the window it needs back via a
   "virt-window" dom-event on the list node; sliding the emit range flips
   only the boundary conditionals — no keyed diff/Move churn. The
   un-emitted prefix/suffix become spacer padding on the Swift side, sized
   by data-virt-count/data-virt-first/data-virt-last/data-virt-est. *)

open Lui_elements
module D = Logseq_dom

let enabled_min ~virtualize ~min count =
  virtualize && count > min

let enabled ~virtualize count = enabled_min ~virtualize ~min:64 count

(* Window geometry is adaptive: the initial emit covers ~1.5 screens of
   rows and the slide margin ~0.5 screen beyond the requested band, both
   derived from the row estimate so nested lists with tall rows (journals
   ~640px/day) emit a handful of rows while short rows (blocks ~32px)
   emit a few dozen. Fixed counts make the initial patch explode
   multiplicatively across nested lists (45 days x 45 blocks). *)
let initial_last est = max 3 (int_of_float (ceil (1100. /. est)))

let slide_margin est = max 4 (int_of_float (ceil (500. /. est)))

let list ?(scroll_parent_id = "main-content-container") ?(overscan = 5)
    ?(estimate_size = fun _ -> 32.) ?(initial_rows = -1) ?(list_attrs = [])
    ?(list_class = "ls-virt-list") ?(pin_key = fun () -> None)
    ?(pin_sig = fun () -> None)
    ?(data_sig = fun (_ : Lui_ui.ui_context) -> None)
    ?(on_end = fun () -> ())
    ~key_of ~render (data : 'a array) : t =
  ignore scroll_parent_id;
  ignore overscan;
  ignore pin_key;
  ignore pin_sig;
  ignore key_of;
  fun ctx parent ->
    let sched = ctx.Lui_ui.ui_scheduler in
    let est = estimate_size 0 in
    let margin = slide_margin est in
    (* [first, last] = the row index range currently emitted, in absolute
       row indexes — the requested window widened by the slide margin and
       clamped to the array. *)
    let initial = if initial_rows >= 0 then initial_rows else initial_last est in
    let win = Signal.state sched (0, initial) in
    let win_sig = win.Signal.state_signal in
    let arr_sig =
      match data_sig ctx with
      | Some s -> s
      | None -> Signal.constant sched data
    in
    (* Emit-range attrs for the SwiftUI spacer math + the end-of-data
       request; derived from (array, emit range). *)
    let range_sig =
      Signal.map2
        (fun (arr : 'a array) (first, last) ->
          let n = Array.length arr in
          let first = max 0 (min first (max 0 (n - 1))) in
          let last = max first (min last (n - 1)) in
          if last >= n - 1 then on_end ();
          (n, first, last))
        arr_sig win_sig
    in
    let attrs_sig =
      Logseq_dom.attrs_signal range_sig
        (fun (n, e_first, e_last) ->
          list_attrs
          @ [ ("data-virt-count", string_of_int n)
            ; ("data-virt-first", string_of_int e_first)
            ; ("data-virt-last", string_of_int e_last)
            ; ("data-virt-est", Printf.sprintf "%.1f" (estimate_size 0))
            ])
    in
    let on_event _name payload =
      match payload with
      | None -> ()
      | Some json -> (
          try
            match Js.Json.parseExn json with
            | Js.Json.JObject kvs -> (
                let num k =
                  match List.assoc_opt k kvs with
                  | Some v -> Js.Json.decodeNumber v
                  | None -> None
                in
                match (num "first", num "last") with
                | Some f, Some l ->
                    let arr = Signal.get arr_sig in
                    let n = Array.length arr in
                    let e_first =
                      max 0 (min (int_of_float f - margin) (max 0 (n - 1)))
                    in
                    let e_last =
                      min (n - 1)
                        (max e_first (int_of_float l + margin))
                    in
                    if Signal.get_state win <> (e_first, e_last)
                    then Signal.set win (e_first, e_last)
                | _ -> ())
            | _ -> ()
          with _ -> ())
    in
    let visible i =
      Signal.map (fun (first, last) -> i >= first && i <= last) win_sig
    in
    let children_of (arr : 'a array) =
      List.init (Array.length arr) (fun i ->
          D.if_ ~test:(visible i) (render arr.(i)))
    in
    D.dyn ~equal:(fun a b -> a == b)
      (fun arr ->
        D.dom ~style_class:list_class ~events:"virt-window"
          ~attrs_signal_v:attrs_sig
          ~on_dom_event:(fun name payload -> on_event name payload)
          (children_of arr))
      arr_sig ctx parent
