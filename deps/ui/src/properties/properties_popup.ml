(* Positioned popup overlays — select popups, sub-panes, date pickers.
   A popup is a point-positioned popover pushed on the view-overlay
   stack, placed at the anchor element's rect (or raw coordinates for
   context menus). The popover kind portals to body level, clamps to
   the viewport and handles outside-press/Escape dismissal, so the
   openers below only measure anchors and mount views. *)

open Lui_elements
module S = Properties_state

(* one view-overlay entry per mounted popup — the key is the removal
   handle callers get back (the imperative version returned its root
   el for the same purpose) *)
let key_seq = ref 0

let next_key () =
  incr key_seq;
  "popup-" ^ string_of_int !key_seq

(* Wrap content in a positioned popover under the point (x, y). `cls`
   is the extra root class the e2e contract requires (e.g.
   "ui__popover-content", "ls-property-dropdown"). Returns the
   view-overlay key. *)
let open_at_key ~key ?(cls = "") ?padding ?anchor_target ?(right = false) ~x ~y (content : t) =
  (* cap at the space left below the anchor so long menus scroll instead
     of overflowing the viewport (radix's available-height behaviour) *)
  let avail = Ui_services.dom_viewport_height () -. y -. 8. in
  let at, anchor_offset, anchor_alignment_offset =
    match anchor_target with
    | None -> Some (x, y), 0., 0.
    | Some _ -> None, (if right then -4. else 4.), (if right then -4. else 0.)
  in
  let view =
    Ui_components.with_props
      [ Ui_components.card_shadow
      ; Ui_components.Prop.font_size "1rem"
      ; Ui_components.Prop.line_height "1.5" ]
    (popover ~key ?at ?anchor_target ~anchor:(if right then `right else `below)
      ~anchor_alignment:`start ~anchor_offset ~anchor_alignment_offset ~style_class:cls
      ?padding ~background:"hsl(var(--popover))"
      ~foreground:"hsl(var(--popover-foreground))"
      ~border_color:"hsl(var(--border))" ~border_width:1 ~corner_radius:6
      ~available_height:(Float.max avail 120.)
      ~data_attrs:[ ("role", "dialog") ]
      ~transition:Ui_components.popover_transition
      ~on_dismiss:(fun _ -> S.remove_view_overlay key)
      [ content ])
  in
  if not (S.push_view_overlay_ctxfree ~key ~view ~on_escape:(fun () -> ()))
  then
    Ui_services.log_error
      "properties_popup: .cp__overlays host not mounted yet"

let open_at ?(cls = "") ~x ~y content =
  let key = next_key () in
  open_at_key ~key ~cls ~x ~y content;
  key

(* On backends with async measurement (the native host) the anchor's
   first rect is still pending, so an element-anchored popup would
   mount at 0,0 on first open. Retry while rect_pending reports the
   measurement outstanding — a resolved rect (zero or not) is final —
   same pattern as Properties_dialog.open_for_anchor_el. *)
let measure_anchor ~is_current (anchor : Ui_services.el) f =
  let rec go tries_left =
    if not (is_current ()) then ()
    else if anchor.Ui_services.rect_pending () && tries_left > 0 then
      ignore
        (Ui_services.timers_timeout (fun () -> go (tries_left - 1)) 32)
    else
      let x, y, w, h = anchor.Ui_services.rect () in
      f x y w h
  in
  go 4

let open_from_anchor ?(cls = "") ?padding ~right (anchor : Ui_services.el) content =
  let key = next_key () in
  incr S.overlay_generation;
  let generation = !S.overlay_generation in
  let anchor_target =
    match anchor.Ui_services.attr "id" with
    | Some identifier when identifier <> "" -> Some identifier
    | _ -> None
  in
  (* Closing or superseding a pending popup must also retire its measurement. *)
  measure_anchor ~is_current:(fun () -> !S.overlay_generation = generation)
    anchor (fun x y w h ->
      let x, y = if right then x +. w -. 4., y -. 4. else x, y +. h +. 4. in
      open_at_key ~key ~cls ?padding ?anchor_target ~right ~x ~y content);
  key

let open_anchored ?cls ?padding anchor content =
  open_from_anchor ?cls ?padding ~right:false anchor content

(* submenu positioning: at the anchor's right edge, top-aligned
   (base-ui dropdown-menu-sub-content placement inline-end) *)
let open_anchored_right ?cls ?padding anchor content =
  open_from_anchor ?cls ?padding ~right:true anchor content
