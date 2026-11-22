(* Positioned popup overlays — select popups, sub-panes, date pickers.
   A popup is a point-positioned popover pushed on the view-overlay
   stack, placed at the anchor element's rect (or raw coordinates for
   context menus). The popover kind portals to body level, clamps to
   the viewport and handles outside-press/Escape dismissal, so the
   openers below only measure anchors and mount views. *)

open Lui_elements
module S = Properties_state

let value_hover_eligible property_type =
  not (List.mem property_type ["default"; "url"; "number"; "string"; "date"; "datetime"])

let with_value_hover ~property_type content =
  if not (value_hover_eligible property_type) then content
  else Ui_components.with_props
    [ Ui_components.Prop.hover_background
        "var(--lx-gray-02, var(--ls-secondary-background-color, var(--rx-gray-02)))"
    ; Ui_components.Prop.corner_radius 4
    ; Ui_components.Prop.transition "background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)" ]
    content

(* one view-overlay entry per mounted popup — the key is the removal
   handle callers get back (the imperative version returned its root
   el for the same purpose) *)
let key_seq = ref 0

let next_key () =
  incr key_seq;
  "popup-" ^ string_of_int !key_seq

let virtual_anchor_rect (x, y, _, height) =
  let reference_width = 1. in
  let arrow_padding = 5. in
  let ratio = Ui_services.dom_device_pixel_ratio () in
  let round value = Float.floor (value *. ratio +. 0.5) /. ratio in
  let top = round y in
  (* Base UI's zero-size fallback arrow still applies its padding. *)
  round (x +. reference_width /. 2. -. arrow_padding), top,
  reference_width, round (y +. (if height > 0. then height else 1.)) -. top

let virtual_anchor_for_id identifier =
  Option.bind (Ui_services.dom_by_id identifier) (fun anchor ->
    if anchor.Ui_services.rect_pending () then None
    else
      let (_, _, width, height) as rect = anchor.Ui_services.rect () in
      if width = 0. && height = 0. then None
      else Some (virtual_anchor_rect rect))

(* Wrap content in a positioned popover under the point (x, y). `cls`
   is the extra root class the e2e contract requires (e.g.
   "ui__popover-content", "ls-property-dropdown"). Returns the
   view-overlay key. *)
let open_at_key ~key ?(role = `dialog) ?(cls = "") ?width ?padding ?anchor_source
    ?(anchor_alignment = `start) ?(fill_available = false)
    ?anchor_offset:anchor_offset_override
    ?anchor_alignment_offset:anchor_alignment_offset_override
    ?(right = false) ~x ~y (content : t) =
  (* cap at the space left below the anchor so long menus scroll instead
     of overflowing the viewport (radix's available-height behaviour) *)
  let avail = Ui_services.dom_viewport_height () -. y -. 8. in
  let target =
    match anchor_source with
    | None -> At (x, y)
    | Some source -> Anchor {
        side = (if right then `right else `below); source; align = anchor_alignment;
        offset = Option.value anchor_offset_override ~default:(if right then -4. else 0.);
        align_offset = Option.value anchor_alignment_offset_override ~default:(if right then -4. else 0.) }
  in
  let view =
    Ui_components.with_props
      [ Ui_components.card_shadow
      ; Ui_components.Prop.font_size "1rem"
      ; Ui_components.Prop.line_height "1.5" ]
    (popover ~key ~role ~target ~style_class:cls
      (* the kit caps role=menu popovers at 18rem; base-ui dropdowns only
         cap at the available height *)
      ?max_height:(if fill_available then Some (int_of_float (Float.max avail 120.))
                   else None)
      ?width ?padding ~background:"hsl(var(--popover))"
      ~foreground:(if role = `menu then "inherit" else "hsl(var(--popover-foreground))")
      ~border_color:"hsl(var(--border))" ~border_width:1 ~corner_radius:6
      ~available_height:(Float.max avail 120.)
      ~transition:Ui_components.popover_transition
      ~on_dismiss:(fun _ -> S.remove_view_overlay key)
      [ content ])
  in
  if not (S.push_view_overlay_ctxfree ~key ~view ~on_escape:(fun () -> ()))
  then
    Ui_services.log_error
      "properties_popup: .cp__overlays host not mounted yet"

let open_at ?role ?(cls = "") ~x ~y content =
  let key = next_key () in
  open_at_key ~key ?role ~cls ~x ~y content;
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

let open_from_anchor ?role ?(cls = "") ?width ?padding ?(freeze_anchor = false) ?anchor_offset
    ?anchor_alignment_offset ?(anchor_alignment = `start) ?fill_available ~right
    (anchor : Ui_services.el) content =
  let key = next_key () in
  incr S.overlay_generation;
  let generation = !S.overlay_generation in
  let anchor_target =
    match anchor.Ui_services.attr "id" with
    | Some identifier when identifier <> "" -> Some identifier
    | _ -> None
  in
  let anchor_offset =
    Option.value anchor_offset ~default:(if right then -4. else 0.)
  in
  let anchor_alignment_offset =
    Option.value anchor_alignment_offset ~default:(if right then -4. else 0.)
  in
  (* Closing or superseding a pending popup must also retire its measurement. *)
  measure_anchor ~is_current:(fun () -> !S.overlay_generation = generation)
    anchor (fun x y w h ->
      let x, y, w, h =
        if right || anchor_alignment = `center then x, y, w, h
        else virtual_anchor_rect (x, y, w, h)
      in
      let anchor_source =
        if freeze_anchor || not right then Some (Rect {x; y; width = w; height = h})
        else Option.map (fun identifier -> Target identifier) anchor_target in
      let x, y =
        if right then
          x +. w +. anchor_alignment_offset, y +. anchor_offset
        else
          x +. anchor_alignment_offset, y +. h +. anchor_offset
      in
      open_at_key ~key ?role ~cls ?width ?padding ~anchor_alignment ?fill_available
        ?anchor_source ~anchor_offset
        ~anchor_alignment_offset ~right ~x ~y content);
  key

let open_anchored ?role ?cls ?width ?padding ?freeze_anchor ?anchor_offset ?anchor_alignment_offset
    ?anchor_alignment ?fill_available anchor content =
  open_from_anchor ?role ?cls ?width ?padding ?freeze_anchor ?anchor_offset ?anchor_alignment_offset
    ?anchor_alignment ?fill_available
    ~right:false anchor content

(* submenu positioning: at the anchor's right edge, top-aligned
   (base-ui dropdown-menu-sub-content placement inline-end) *)
let open_anchored_right ?role ?cls ?padding anchor content =
  open_from_anchor ?role ?cls ?padding ~right:true anchor content
