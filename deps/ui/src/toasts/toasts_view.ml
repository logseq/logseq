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

(* status-icon colors, from the dropped .ui__toast-status-icon.<kind>
   rules *)
let toast_icon_color (k : string) : string =
  match k with
  | "success" -> "var(--rx-green-09-alpha, var(--lx-green-09, hsl(142 71% 45%)))"
  | "warning" -> "var(--rx-yellow-10-alpha, var(--lx-yellow-10, hsl(45 93% 40%)))"
  | "error" -> "var(--rx-red-10-alpha, var(--lx-red-10, hsl(359 82% 48%)))"
  | _ -> "var(--rx-blue-09-alpha, var(--lx-blue-09, hsl(208 93% 48%)))"

let toast_item (t : Model.toast) : t =
  let kind = toast_kind_class t.toast_kind in
  fun ctx parent ->
    (toast ~key:("toast-" ^ string_of_int t.toast_id)
       ~duration:(if kind = "error" then 0 else if t.toast_key = None then 1500 else 2000)
       ~label:t.toast_text
       ~on_dismiss:(fun _ -> Toast.dismiss t.toast_id)
       ~style_class:kind
       [ overlay ~key:"ti-content" ~grow:1.
           [ row ~key:"ti-body" ~gap:8 ~padding_horizontal:12
               ~padding_vertical:20 ~cross:`start
               [ icon ~key:"ti-icon" ~name:(toast_icon kind)
                   ~width:20 ~height:20
                   ~foreground:(toast_icon_color kind) []
               ; Ui_components.with_props
                   [ Lui_protocol.FontSize, Lui_protocol.StringValue "0.875rem"
                   ; Lui_protocol.LineHeight, Lui_protocol.StringValue "1.25rem"
                   ; Lui_protocol.Opacity, Lui_protocol.FloatValue 0.9 ]
                   (text ~key:"ti-desc" ~grow:1.
                      ~foreground:"var(--ls-primary-text-color)"
                      ~value:t.toast_text [])
               ; spacer ~width:20 []
               ]
           ; align `top_trailing
               (button ~key:"ti-close" ~variant:`ghost ~size:`icon
                   ~width:32 ~height:32 ~corner_radius:6
                   ~foreground:
                     "color-mix(in oklab, var(--lui-c-foreground) 50%, \
                      transparent)"
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
