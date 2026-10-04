(* Base-ui style tooltips for static chrome. Triggers carry
   data-tooltip="Label" (optionally data-tooltip-keys="⌘ K" for the
   keycap row like ui/with-shortcut); the listeners here show a
   .ui__tooltip-content bubble below the trigger after the hover delay,
   flipped above at the viewport bottom. *)

module D = Dom_ext

external doc_body : D.element = "document.body"
external set_class : D.element -> string -> unit = "className" [@@mel.set]
external set_attr : D.element -> string -> string -> unit
  = "setAttribute" [@@mel.send]
external style_css : D.element -> string -> unit = "cssText"
  [@@mel.set] [@@mel.scope "style"]
external el_remove : D.element -> unit = "remove" [@@mel.send]

let shown : D.element option ref = ref None
let armed_on : D.element option ref = ref None
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
      el_remove el;
      shown := None
  | None -> ()

(* content: label span + kbd cells mirroring cmdk's shui-shortcut-key *)
let content_el ~text ~keys =
  let tip = D.create_element "div" in
  set_class tip "ui__tooltip-content ls-tooltip";
  set_attr tip "role" "tooltip";
  (* the bubble must never steal hover from its own trigger *)
  style_css tip "pointer-events:none";
  let label = D.create_element "span" in
  D.set_text_content label text;
  D.append_child tip label;
  (match keys with
   | "" -> ()
   | ks ->
       let wrap = D.create_element "span" in
       set_class wrap "ls-tooltip-keys";
       List.iter
         (fun k ->
           if k <> "" then begin
             let kbd = D.create_element "kbd" in
             set_class kbd "shui-shortcut-key";
             D.set_text_content kbd k;
             D.append_child wrap kbd
           end)
         (String.split_on_char ' ' ks);
       D.append_child tip wrap);
  tip

let show_for trig =
  match D.get_attribute trig "data-tooltip" with
  | None | Some "" -> ()
  | Some text ->
      hide ();
      let keys =
        Option.value (D.get_attribute trig "data-tooltip-keys")
          ~default:""
      in
      let tip = content_el ~text ~keys in
      D.append_child doc_body tip;
      let r = D.bounding_rect trig in
      let tr = D.bounding_rect tip in
      let w = D.rect_width tr and h = D.rect_height tr in
      let cx = D.rect_left r +. (D.rect_width r /. 2.) -. (w /. 2.) in
      let x =
        Float.max 4. (Float.min cx (D.window_inner_width -. w -. 4.))
      in
      (* base-ui default side=bottom; flip above when there's no room *)
      let y =
        if D.window_inner_height -. D.rect_bottom r -. 6. -. h >= 8. then
          D.rect_bottom r +. 6.
        else D.rect_top r -. h -. 6.
      in
      style_css tip
        (Printf.sprintf
           "position:fixed;left:%.0fpx;top:%.0fpx;z-index:99999;\
            pointer-events:none"
           x y);
      shown := Some tip

let on_mouseover ev =
  match D.target ev with
  | None -> ()
  | Some el -> (
      match D.closest el "[data-tooltip]" with
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
