(* Base-ui style tooltips for static chrome. Triggers carry
   data-tooltip="Label" (optionally data-tooltip-keys="⌘ K" for the
   keycap row like ui/with-shortcut); migrated component kinds emit
   their tip text as aria-label instead (data-* attrs have no typed-prop
   channel), so [data-tooltip]/[aria-label] triggers both match.

   The LUI `tooltip` kind can't serve this: it anchors to its own
   parent trigger child, while this service tooltips arbitrary
   foreign elements found by delegated document listeners. So the
   bubble mounts as a singleton `popover` node emitted from
   popups_view's fragment, driven by the state signal below; placement
   is the old arithmetic — mount under the trigger, measure the
   rendered bubble, then clamp to the viewport and flip above when
   there's no room below. *)

open Lui_elements

type tip = {
  tip_label : string;
  tip_keys : string;
  tip_x : float;      (* bubble left, viewport coords *)
  tip_y : float;      (* bubble top *)
  tip_arrow_x : float;(* arrow left offset inside the bubble *)
  tip_above : bool;   (* bubble sits above the trigger *)
}

let state : tip option Signal.state option ref = ref None
let armed_on : Ui_services.el option ref = ref None
let timer = ref (-1)
let delay_ms = 500
let installed = ref false

let set_tip v =
  match !state with
  | Some s ->
      Signal.set s v;
      Runtime.flush ()
  | None -> ()

let hide () =
  armed_on := None;
  if !timer <> -1 then begin
    Ui_services.timers_clear_timeout !timer;
    timer := -1
  end;
  set_tip None

(* two-phase placement: the popover mounts under the trigger first;
   once its own rect resolves we clamp x to the viewport, flip above
   when the bubble wouldn't fit below, and re-centre the arrow on the
   trigger — identical math to the imperative version *)
let show_for (trig : Ui_services.el) =
  let tip_text =
    match trig.Ui_services.attr "data-tooltip" with
    | Some t when t <> "" -> Some t
    | _ -> trig.Ui_services.attr "aria-label"
  in
  match tip_text with
  | None | Some "" -> ()
  | Some label ->
      hide ();
      let keys =
        Option.value (trig.Ui_services.attr "data-tooltip-keys")
          ~default:""
      in
      let tx, ty, tw, th = trig.Ui_services.rect () in
      let trig_cx = tx +. (tw /. 2.) in
      let trig_bottom = ty +. th in
      (* provisional mount; arrow starts centred until measured *)
      set_tip
        (Some
           { tip_label = label
           ; tip_keys = keys
           ; tip_x = trig_cx
           ; tip_y = trig_bottom
           ; tip_arrow_x = 0.
           ; tip_above = false });
      let rec place tries =
        match Ui_services.dom_query "#lui-tooltip" with
        | None -> ()
        | Some bubble ->
            let _, _, w, h = bubble.Ui_services.rect () in
            if w = 0. && h = 0. && tries > 0 then
              ignore
                (Ui_services.timers_timeout (fun () -> place (tries - 1)) 16)
            else
              let x =
                Float.max 5.
                  (Float.min (trig_cx -. (w /. 2.))
                     (Ui_services.dom_viewport_width () -. w -. 5.))
              in
              (* base-ui side=bottom, sideOffset 0 — the arrow visually
                 bridges the gap to the trigger; flip above when there's
                 no room *)
              let above =
                Ui_services.dom_viewport_height () -. trig_bottom -. h
                < 8.
              in
              set_tip
                (Some
                   { tip_label = label
                   ; tip_keys = keys
                   ; tip_x = x
                   ; tip_y = (if above then ty -. h else trig_bottom)
                   ; tip_arrow_x = trig_cx -. x -. 4.
                   ; tip_above = above })
      in
      ignore (Ui_services.timers_timeout (fun () -> place 8) 16)

(* content: label span + kbd cells mirroring cmdk's shui-shortcut-key.
   cljs with-shortcut stacks the title above the keycap row in a
   .flex.flex-col.items-start.gap-1 column; the arrow is a rotated
   square half-overlapping the bubble edge, centred on the trigger *)
let tip_view (tip : tip) : t =
  let keys_cells =
    tip.tip_keys
    |> String.split_on_char ' '
    |> List.filter (fun k -> k <> "")
    |> List.mapi (fun i k ->
        Ui_components.keycap ~key:("k" ^ string_of_int i) ~boxed:false
          ~glow:false ~min_slot:20 ~value:k)
  in
  let body =
    match keys_cells with
    | [] -> text ~key:"lbl" ~value:tip.tip_label []
    | cells ->
        Ui_components.ls_tooltip_col ~key:"col"
          [ text ~key:"lbl" ~value:tip.tip_label []
          ; Ui_components.ls_tooltip_keys ~key:"keys" cells ]
  in
  Ui_components.tooltip_content ~key:"lui-tip" ~at:(tip.tip_x, tip.tip_y)
    ~arrow_x:tip.tip_arrow_x ~above:tip.tip_above [ body ]

(* singleton bubble — one tip at a time, so the reactive can emit the
   popover directly under popups_view's fragment *)
let el : t =
 fun context parent ->
  match !state with
  | None -> Logseq_el.nothing context parent
  | Some s ->
      (reactive
         (function
           | None -> Logseq_el.nothing
           | Some tip -> tip_view tip)
         s.Signal.state_signal)
        context parent

(* mousemove rather than mouseover: gpui feeds document mousemove only
   (no per-element enter/leave), and on web the armed_on guard makes
   the extra per-move calls no-ops — moving off the trigger hits the
   `None -> hide` arm the same way mouseout would. *)
let on_mousemove (ev : Ui_services.ev) =
  match ev.Ui_services.target with
  | None -> ()
  | Some el -> (
      match el.Ui_services.closest "[data-tooltip], [aria-label]" with
      | Some trig -> (
          match !armed_on with
          | Some cur when Properties_state.same_el cur trig -> ()
          | _ ->
              hide ();
              armed_on := Some trig;
              timer :=
                Ui_services.timers_timeout
                  (fun () ->
                    timer := -1;
                    armed_on := None;
                    show_for trig)
                  delay_ms)
      | None -> hide ())

let on_dismiss _ = hide ()

let install ~scheduler =
  if not !installed then begin
    installed := true;
    state := Some (Signal.state scheduler None);
    Ui_services.dom_on_document_event "mousemove" on_mousemove;
    Ui_services.dom_on_document_event ~capture:true "pointerdown"
      on_dismiss;
    Ui_services.dom_on_document_event ~capture:true "keydown" on_dismiss;
    (* tooltips die with their anchor's scroll like the tippy instance *)
    Ui_services.dom_on_document_event ~capture:true "wheel" on_dismiss;
    Ui_services.dom_on_document_event ~capture:true "scroll" on_dismiss
  end
