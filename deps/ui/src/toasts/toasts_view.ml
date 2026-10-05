(* Toast stack — worker :notification broadcasts land in model.toasts.
   Component contract: edge-anchored column > toast cards (status icon,
   close button, message). style_class retained for web parity; native
   hosts render kind defaults. Stacking order comes from
   --toast-index, assigned per child position in ui.css
   (:nth-last-child), newest toast = index 0. *)

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
    (* cljs notification.cljs: error toasts persist (duration 0);
       internal show! calls auto-dismiss at 1500ms, sdk show_msg
       (keyed) at 2000ms *)
    if t.toast_kind <> "error" then
      Toast.schedule_dismiss
        ~ms:(if t.toast_key = None then 1500 else 2000)
        t.toast_id;
    (column ~key:("toast-" ^ string_of_int t.toast_id)
       (* radix restores pointer events per toast — the viewport is
          pointer-events:none so toasts must re-enable *)
       ~style_class:("ui__toast pointer-events-auto " ^ kind)
       ~accessibility_identifier:("toast-" ^ string_of_int t.toast_id)
       [ column ~key:"ti-content" ~style_class:"ui__toast-content"
           ~corner_radius:6 ~padding:12
           [ row ~key:"ti-header" ~style_class:"ui__toast-header"
               ~main:`space_between ~cross:`center
               [ icon ~key:"ti-icon" ~name:(toast_icon kind)
                   ~style_class:(toast_icon_class kind) []
               ; button ~key:"ti-close" ~variant:`ghost ~size:`icon
                   ~style_class:"ui__toast-close"
                   ~label:(I18n.t "ui/close")
                   ~on_press:(fun _ -> Toast.dismiss t.toast_id)
                   ~icon:`x []
               ]
           ; column ~key:"ti-body" ~style_class:"ui__toast-body"
               [ text ~key:"ti-desc"
                   ~style_class:"ui__toast-text ui__toast-description"
                   ~value:t.toast_text []
               ]
           ]
       ])
      ctx parent

let render (ms : Model.t Signal.signal) : t =
  dyn
    ~equal:(fun (a : Model.t) (b : Model.t) -> a.toasts = b.toasts)
    (fun (m : Model.t) ->
      match m.toasts with
      | [] -> spacer ~key:"toaster-empty" []
      | ts -> column ~key:"toaster" ~style_class:"ui__toaster-viewport"
                (List.map toast_item ts))
    ms
