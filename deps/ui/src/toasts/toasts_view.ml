(* Toast stack — worker :notification broadcasts land in model.toasts.
   DOM contract: .ui__toaster-viewport > .ui__toast.<kind> with a
   .ui__toast-close button and the message in .ui__toast-content. *)

open Lui_elements

let dom = Logseq_dom.dom

let toast_kind_class (k : string) : string =
  match k with
  | "success" | "error" | "warning" | "info" -> k
  | _ -> "info"

let toast_icon_class (k : string) : string =
  (* tabler icon per kind, mirrors notification.cljs status-icon *)
  let i =
    match k with
    | "success" -> "circle-check"
    | "warning" -> "alert-circle"
    | "error" -> "circle-x"
    | _ -> "info-circle"
  in
  "ui__toast-status-icon " ^ k ^ " ti ti-" ^ i

let toast_item (t : Model.toast) (idx : int) : t =
  let kind = toast_kind_class t.toast_kind in
  (* stylesheet stacks toasts via --toast-index *)
  let style = Printf.sprintf "--toast-index:%d" idx in
  fun ctx parent ->
    (* cljs notification.cljs: error toasts persist (duration 0), other
       kinds auto-dismiss *)
    if t.toast_kind <> "error" then
      Toast.schedule_dismiss ~ms:5000 t.toast_id;
    (dom ~key:("toast-" ^ string_of_int t.toast_id)
       (* radix restores pointer events per toast — the viewport is
          pointer-events:none so toasts must re-enable *)
       ~style_class:("ui__toast pointer-events-auto " ^ kind)
       ~attrs:
         [ ("data-toast-index", string_of_int idx); ("style", style) ]
       [ dom ~key:"ti-content" ~style_class:"ui__toast-content"
           [ dom ~key:"ti-header" ~style_class:"ui__toast-header"
               [ dom ~key:"ti-icon" ~tag:"i"
                   ~style_class:(toast_icon_class kind) []
               ; dom ~key:"ti-close" ~tag:"button"
                   ~style_class:"ui__toast-close"
                   ~attrs:[ ("aria-label", I18n.t "ui/close") ]
                   ~events:"click"
                   ~on_dom_event:(fun name _ ->
                     if name = "click" then Toast.dismiss t.toast_id)
                   []
               ]
           ; dom ~key:"ti-body" ~style_class:"ui__toast-body"
               [ dom ~key:"ti-text" ~style_class:"ui__toast-text"
                   [ dom ~key:"ti-desc"
                       ~style_class:"ui__toast-description"
                       ~text:t.toast_text [] ]
               ]
           ]
       ])
      ctx parent

let render (ms : Model.t Signal.signal) : t =
  dyn
    ~equal:(fun (a : Model.t) (b : Model.t) -> a.toasts = b.toasts)
    (fun (m : Model.t) ->
      match m.toasts with
      | [] -> Logseq_dom.nothing
      | ts ->
          dom ~key:"toaster" ~style_class:"ui__toaster-viewport"
            (* sonner DOM order is oldest->newest with --toast-index 0 on
               the newest (frontmost, highest z); the model appends new
               toasts last so assign the index in reverse *)
            (let n = List.length ts in
             List.mapi
               (fun i (t : Model.toast) -> toast_item t (n - 1 - i))
               ts))
    ms
