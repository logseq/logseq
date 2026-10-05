(* Base-ui style tooltips for static chrome. Triggers carry
   data-tooltip="Label" (optionally data-tooltip-keys="⌘ K" for the
   keycap row like ui/with-shortcut); migrated component kinds emit
   their tip text as aria-label instead (data-* attrs have no typed-prop
   channel), so [aria-label] triggers match too. The listeners here
   show a .ui__tooltip-content bubble below the trigger after the hover
   delay, flipped above at the viewport bottom. *)

module D = Web_dom



let shown : D.el option ref = ref None
let armed_on : D.el option ref = ref None
let timer = ref (-1)
let delay_ms = 500
let installed = ref false

let hide () =
  armed_on := None;
  if !timer <> -1 then begin
    D.clear_timeout !timer;
    timer := -1
  end;
  match !shown with
  | Some el ->
      D.el_remove el;
      shown := None
  | None -> ()

(* content: label span + kbd cells mirroring cmdk's shui-shortcut-key *)
let content_el ~text ~keys =
  let tip = D.create_element "div" in
  D.el_set_class tip "ui__tooltip-content ls-tooltip";
  D.el_set_attr tip "role" "tooltip";
  (* the bubble must never steal hover from its own trigger *)
  D.el_set_attr tip "style" "pointer-events:none";
  let label = D.create_element "span" in
  D.el_set_text_content label text;
  D.el_append_child tip label;
  (match keys with
   | "" -> ()
   | ks ->
       let wrap = D.create_element "span" in
       D.el_set_class wrap "ls-tooltip-keys";
       List.iter
         (fun k ->
           if k <> "" then begin
             let kbd = D.create_element "kbd" in
             D.el_set_class kbd "shui-shortcut-key";
             D.el_set_text_content kbd k;
             D.el_append_child wrap kbd
           end)
         (String.split_on_char ' ' ks);
       D.el_append_child tip wrap);
  tip

let show_for trig =
  let tip_text =
    match D.el_get_attr trig "data-tooltip" with
    | Some t when t <> "" -> Some t
    | _ -> D.el_get_attr trig "aria-label"
  in
  match tip_text with
  | None | Some "" -> ()
  | Some text ->
      hide ();
      let keys =
        Option.value (D.el_get_attr trig "data-tooltip-keys")
          ~default:""
      in
      let tip = content_el ~text ~keys in
      D.el_append_child D.document_body tip;
      let r = D.el_bounding_rect trig in
      let tr = D.el_bounding_rect tip in
      let w = D.rect_width tr and h = D.rect_height tr in
      let cx = D.rect_left r +. (D.rect_width r /. 2.) -. (w /. 2.) in
      let x =
        Float.max 4. (Float.min cx (D.win_inner_width -. w -. 4.))
      in
      (* base-ui default side=bottom; flip above when there's no room *)
      let y =
        if D.win_inner_height -. D.rect_bottom r -. 6. -. h >= 8. then
          D.rect_bottom r +. 6.
        else D.rect_top r -. h -. 6.
      in
      D.el_set_attr tip "style"
        (Printf.sprintf
           "position:fixed;left:%.0fpx;top:%.0fpx;z-index:99999;\
            pointer-events:none"
           x y);
      shown := Some tip

let on_mouseover ev =
  match D.ev_target ev with
  | None -> ()
  | Some el -> (
      match D.el_closest el "[data-tooltip], [aria-label]" with
      | Some trig -> (
          match !armed_on with
          | Some cur when cur == trig -> ()
          | _ ->
              hide ();
              armed_on := Some trig;
              timer :=
                D.set_timeout_id
                  (fun () ->
                    timer := -1;
                    armed_on := None;
                    show_for trig)
                  delay_ms)
      | None -> hide ())

let on_dismiss _ = hide ()

let install () =
  if not !installed then begin
    installed := true;
    D.add_document_listener "mouseover" on_mouseover false;
    D.add_document_listener "pointerdown" on_dismiss true;
    D.add_document_listener "keydown" on_dismiss true;
    (* tooltips die with their anchor's scroll like the tippy instance *)
    D.add_document_listener "wheel" on_dismiss true;
    D.add_document_listener "scroll" on_dismiss true
  end
