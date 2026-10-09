(* The standard toast owns its timer, hover/focus pause, swipe and portal.
   Keep older notifications first so the renderer stacks the newest last. *)

open Lui_elements

let toast_kind_class (k : string) : string =
  match k with
  | "success" | "error" | "warning" | "info" -> k
  | _ -> "info"

(* tabler icon per kind, mirrors notification.cljs status-icon —
   builtin LUI icon names where one matches, else app-registered *)
let toast_icon (k : string) : icon =
  match k with
  | "success" -> `check_circle
  | "warning" -> `alert
  | "error" -> `x_circle
  | _ -> `info

(* tabler ti-* classes dropped: the icon kind renders its own svg on web;
   the font class would double-render behind the mask *)
let toast_icon_class (k : string) : string =
  "ui__toast-status-icon " ^ k

let toast_item (t : Model.toast) : t =
  let kind = toast_kind_class t.toast_kind in
  fun ctx parent ->
    (toast ~key:("toast-" ^ string_of_int t.toast_id)
       ~duration:(if kind = "error" then 0 else if t.toast_key = None then 1500 else 2000)
       ~label:t.toast_text
       ~on_dismiss:(fun _ -> Toast.dismiss t.toast_id)
       ~style_class:("ui__toast " ^ kind)
       ~accessibility_identifier:("toast-" ^ string_of_int t.toast_id)
       [ overlay ~key:"ti-content" ~grow:1. ~style_class:"ui__toast-content"
           [ row ~key:"ti-body" ~gap:8 ~padding_horizontal:12
               ~padding_vertical:20 ~cross:`start
               [ icon ~key:"ti-icon" ~name:(toast_icon kind)
                   ~width:20 ~height:20
                   ~style_class:(toast_icon_class kind) []
               ; text ~key:"ti-desc" ~grow:1.
                   ~style_class:"ui__toast-description"
                   ~value:t.toast_text []
               ; spacer ~width:20 []
               ]
           ; align `top_trailing
               (button ~key:"ti-close" ~variant:`ghost ~size:`icon
                   ~width:32 ~height:32
                   ~style_class:"ui__toast-close"
                   ~label:(I18n.t "ui/close")
                   ~on_press:(fun _ -> Toast.dismiss t.toast_id)
                   ~icon:`x [])
           ]
       ])
      ctx parent

let render (ms : Model.t Signal.signal) : t =
  keyed ~source:(reactive (fun m -> List.rev m.Model.toasts) ms)
    ~key:(fun t -> t.Model.toast_id) ~cmp:Int.compare
    ~mount:(fun toast_signal -> toast_item (Signal.get toast_signal))
