(* Popup primitives matching the shui/base-ui contract:
   .ui__dropdown-menu-content [role=menu] with menuitem/menuitemcheckbox/
   sub-triggers (keyboard: Home/End/arrows/Enter/Esc),
   .cp__select*.cp__select-input + .cp__select-results a.menu-link selects,
   and .ui__dialog-content confirm dialogs. *)

module D = Views_dom
module I = I18n

external document_body : D.el = "document.body"

(* -- popup stack management -- *)

(* open popups (menu contents, selects, dialogs) — all close on outside
   mousedown or Escape *)
let open_popups : D.el list ref = ref []

let close_top () =
  match !open_popups with
  | [] -> ()
  | p :: rest ->
      open_popups := rest;
      D.el_remove p

let close_all () =
  List.iter D.el_remove !open_popups;
  open_popups := []

let on_doc_keydown ev =
  if Editor_dom.ev_key ev = "Escape" && !open_popups <> [] then begin
    Editor_dom.stop_propagation ev;
    Editor_dom.prevent_default ev;
    close_top ()
  end

let install_listeners () =
  Overlay.on_document_press "pointerdown"
    ~els:(fun () -> !open_popups)
    ~on_hit:(function
      | None -> close_all ()
      | Some _ -> ());
  Editor_dom.document_add_listener "keydown" on_doc_keydown true

let push_popup el = open_popups := el :: !open_popups

let pop_popup el =
  open_popups := List.filter (fun p -> not (p == el)) !open_popups

(* -- positioning: fixed, anchored below trigger -- *)

let position_content ~anchor ~content ~align_end ~submenu =
  let r = D.el_rect anchor in
  let style = ref "position:fixed;z-index:50;" in
  (if submenu then begin
     (* opens right of the item, top-aligned; radix shifts the panel up
        when it would overflow the viewport bottom, and caps its height
        at the viewport so every option stays inside *)
     let h = D.rect_height (D.el_rect content) in
     let top =
       Float.max 8.
         (Float.min (D.rect_top r -. 4.)
            (D.window_inner_height -. 8. -. h))
     in
     style := !style
       ^ Printf.sprintf
           "left:%.0fpx;top:%.0fpx;max-height:%.0fpx;overflow-y:auto;"
           (D.rect_left r +. D.rect_width r -. 4.) top
           (D.window_inner_height -. 16.)
   end
   else begin
     (* radix mounts below but flips when the list would overflow the
        viewport and there is more room above; cap the height at the
        space on the chosen side so every option stays inside the
        viewport (radix's available-height behaviour) *)
     let below = D.window_inner_height -. (D.rect_bottom r +. 4.) -. 8. in
     let above = (D.rect_top r -. 4.) -. 8. in
     let open_above = below < 280. && above > below in
     let pos, avail =
       if open_above then
         ( Printf.sprintf "bottom:%.0fpx"
             (D.window_inner_height -. (D.rect_top r -. 4.))
         , above )
       else (Printf.sprintf "top:%.0fpx" (D.rect_bottom r +. 4.), below)
     in
     let horiz =
       if align_end then
         Printf.sprintf "left:%.0fpx;transform:translateX(-100%%);"
           (D.rect_left r +. D.rect_width r)
       else Printf.sprintf "left:%.0fpx;" (D.rect_left r)
     in
     style := !style
       ^ Printf.sprintf "%s%s;max-height:%.0fpx;overflow-y:auto;" horiz pos
           (Float.max avail 120.)
   end);
  D.el_set_attr content "style" !style

(* -- menu -- *)

type menu_item =
  | MItem of string * (unit -> unit)
  | MCheck of string * bool * (bool -> unit)
  | MSub of string * menu_item list
  | MCustom of D.el
  | MSep

let item_cls = Menu_item.views_item_cls

let focus_item (items : D.el array) idx =
  if idx >= 0 && idx < Array.length items then begin
    Array.iter
      (fun el ->
        D.el_set_attr el "tabindex" "-1";
        D.el_remove_attr el "data-highlighted")
      items;
    let el = items.(idx) in
    D.el_set_attr el "tabindex" "0";
    D.el_focus el;
    D.el_set_attr el "data-highlighted" ""
  end

let focusable_items content : D.el array =
  let nl = D.el_query_all content "[role=menuitem],[role=menuitemcheckbox]"
  in
  let n = Editor_dom.node_list_length nl in
  Array.of_list
    (List.filter_map
       (fun i -> Editor_dom.node_list_item nl i)
       (List.init n Fun.id))

let focused_idx items =
  let rec loop i =
    if i >= Array.length items then -1
    else if D.el_has_attr items.(i) "data-highlighted" then i
    else loop (i + 1)
  in
  loop 0

let rec menu_items_el ?(cls_prefix = "") (items : menu_item list) : D.el =
  let content =
    D.h
      ~cls:
        (cls_prefix
         ^ "ui__dropdown-menu-content z-50 min-w-[8rem] rounded-md border \
            bg-popover p-1 text-popover-foreground shadow-md")
      ~attrs:[ ("role", "menu"); ("tabindex", "-1") ] ()
  in
  List.iter
    (fun it ->
      match it with
      | MSep ->
          D.el_append_child content
            (D.h ~cls:"ui__dropdown-menu-separator -mx-1 my-1 h-px bg-muted"
               ~attrs:[ ("role", "separator") ] ())
      | MCustom el -> D.el_append_child content el
      | MItem (label, on) ->
          let el =
            D.h ~cls:(item_cls "ui__dropdown-menu-item")
              ~attrs:[ ("role", "menuitem"); ("tabindex", "-1") ] ()
          in
          D.el_append_child el
            (D.h ~tag:"span" ~cls:"flex-1" ~text:label ());
          D.el_add_listener el "click" (fun _ ->
              close_all ();
              on ());
          D.el_append_child content el
      | MCheck (label, checked, on) ->
          let el =
            D.h
              ~cls:
                (item_cls "ui__dropdown-menu-checkbox-item" ^ " capitalize")
              ~attrs:
                [ ("role", "menuitemcheckbox")
                ; ("aria-checked", string_of_bool checked)
                ; ("tabindex", "-1")
                ]
              ()
          in
          let ind =
            D.h ~tag:"span"
              ~cls:
                "absolute left-2 flex h-3.5 w-3.5 items-center \
                 justify-center" ()
          in
          (if checked then
             let c = D.icon "check" in
             Editor_dom.el_set_class c
               "ui__icon ti ls-icon-check h-4 w-4";
             D.el_append_child ind c);
          D.el_append_child el ind;
          D.el_append_child el
            (D.h ~tag:"span" ~cls:"flex-1" ~text:label ());
          D.el_add_listener el "click" (fun ev ->
              Editor_dom.stop_propagation ev;
              on (not checked);
              (* refresh check state in place — menu stays open *)
              D.el_set_attr el "aria-checked"
                (string_of_bool (not checked));
              (match checked with
               | true -> D.el_set_text_content ind ""
               | false ->
                   let c = D.icon "check" in
                   D.el_append_child ind c));
          D.el_append_child content el
      | MSub (label, sub) ->
          let el =
            D.h ~cls:(item_cls "ui__dropdown-menu-sub-trigger")
              ~attrs:
                [ ("role", "menuitem")
                ; ("aria-expanded", "false")
                ; ("tabindex", "-1")
                ]
              ()
          in
          D.el_append_child el
            (D.h ~tag:"span" ~cls:"flex-1" ~text:label ());
          (* cljs renders the raw tabler svg for submenu chevrons *)
          (match Editor_dom.tabler_svg_el "chevron-right" with
           | Some svg ->
               Editor_dom.el_set_attr svg "class"
                 "h-4 ml-auto tabler-icon tabler-icon-chevron-right w-4";
               D.el_append_child el svg
           | None ->
               D.el_append_child el
                 (D.h ~tag:"i" ~cls:"ti ti-chevron-right ml-auto h-4 w-4"
                    ()));
          let sub_open = ref false in
          let open_sub () =
            if not !sub_open then begin
              sub_open := true;
              let sc = menu_items_el ~cls_prefix sub in
              Editor_dom.el_set_class sc
                (cls_prefix
                 ^ "ui__dropdown-menu-sub-content z-50 min-w-[8rem] \
                    rounded-md border bg-popover p-1 \
                    text-popover-foreground shadow-lg");
              D.el_append_child document_body sc;
              position_content ~anchor:el ~content:sc ~align_end:false
                ~submenu:true;
              push_popup sc
            end
          in
          D.el_add_listener el "click" (fun ev ->
              Editor_dom.stop_propagation ev;
              open_sub ());
          D.el_add_listener el "mouseenter" (fun _ -> open_sub ());
          D.el_append_child content el)
    items;
  D.el_add_listener content "keydown" (fun ev ->
      let k = Editor_dom.ev_key ev in
      let items = focusable_items content in
      let idx = focused_idx items in
      (* inputs inside MCustom panes (view rename box) type freely — menu
         keys must not preventDefault their characters *)
      if Editor_dom.is_editable_target (Editor_dom.ev_target ev) then ()
      else
      match k with
      | "Home" ->
          Editor_dom.prevent_default ev;
          focus_item items 0
      | "End" ->
          Editor_dom.prevent_default ev;
          focus_item items (Array.length items - 1)
      | "ArrowDown" ->
          Editor_dom.prevent_default ev;
          focus_item items (idx + 1)
      | "ArrowUp" ->
          Editor_dom.prevent_default ev;
          focus_item items (idx - 1)
      | "ArrowRight" ->
          Editor_dom.prevent_default ev;
          if idx >= 0 && idx < Array.length items then D.el_click items.(idx)
      | "Enter" | " " ->
          Editor_dom.prevent_default ev;
          if idx >= 0 && idx < Array.length items then D.el_click items.(idx)
      | "Escape" ->
          Editor_dom.prevent_default ev;
          close_top ()
      | _ -> ());
  content

let show_menu ~anchor ?(align_end = false) ?(cls_prefix = "")
    (items : menu_item list) =
  close_all ();
  let content = menu_items_el ~cls_prefix items in
  D.el_append_child document_body content;
  position_content ~anchor ~content ~align_end ~submenu:false;
  push_popup content;
  (* shui/Base UI dropdowns focus the popup on open — menu keyboard nav
     (Home/arrows/Enter) needs a focused listener root *)
  D.el_focus content

(* -- select (cp__select) -- *)

type select_item = { si_label : string; si_value : string; si_extra : Wire.t option }

(* renders the item label row; multiple mode adds a checkbox box *)
let select_item_row it chosen multiple sel_set =
  let row =
    D.h ~cls:("flex flex-row justify-between w-full" ^ if chosen then " chosen" else "")
      ()
  in
  let left =
    D.h ~cls:"flex flex-row items-center gap-1" ()
  in
  (if multiple then
     let cb =
       D.h ~tag:"input" ~attrs:[ ("type", "checkbox") ] ()
     in
     D.el_set_checked cb (List.mem it.si_value sel_set);
     D.el_append_child left cb);
  D.el_append_child left (D.h ~tag:"span" ~text:it.si_label ());
  D.el_append_child row left;
  row

(* A select popup; on_chosen item selected? -> unit; on_apply for multiple *)
let show_select ~anchor ~items ~placeholder ?(multiple = false)
    ?(on_apply = fun _ -> ()) ?(extra : (unit -> D.el option) option)
    ?(wrap_cls = "") ~on_chosen () =
  close_all ();
  let sel_values : string list ref = ref [] in
  let sel_mem s v = List.mem v s in
  let query = ref "" in
  let chosen_idx = ref 0 in
  let inner = D.h ~cls:"cp__select cp__select-main" () in
  let input_wrap = D.h ~cls:"input-wrap" () in
  let input =
    D.h ~tag:"input"
      ~cls:"cp__select-input w-full !p-1.5"
      ~attrs:[ ("type", "text"); ("placeholder", placeholder) ] ()
  in
  D.el_append_child input_wrap input;
  let results_wrap = D.h () in
  (* cljs select: .item-results-wrap > #ui__ac.cp__select-results
     > #ui__ac-inner.hide-scrollbar (the scrollable region) *)
  let results =
    D.h ~cls:"cp__select-results" ~attrs:[ ("id", "ui__ac") ] ()
  in
  let item_results = D.h ~cls:"item-results-wrap" ~children:[ results ] () in
  D.el_append_child results_wrap item_results;
  let apply_wrap = D.h ~cls:"p-4" () in
  let filtered () =
    List.filter (fun it -> Fuzzy.score !query it.si_label > 0.) items
  in
  let rec rerender () =
    D.clear results;
    let its = filtered () in
    (match its with
     | [] ->
         if not multiple then
           D.el_append_child results
             (D.h ~cls:"px-2 py-1 opacity-50 text-sm"
                ~text:I.no_matched_result ())
     | _ ->
         let ac_inner =
           D.h ~cls:"hide-scrollbar" ~attrs:[ ("id", "ui__ac-inner") ] ()
         in
         D.el_append_child results ac_inner;
         List.iteri
           (fun i it ->
             let link_wrap = D.h ~cls:"menu-link-wrap" () in
             let a =
               D.h ~tag:"a"
                 ~cls:
                   ("flex justify-between menu-link"
                    ^ if i = !chosen_idx then " chosen" else "")
                 ~attrs:[ ("id", "ac-" ^ string_of_int i); ("tabindex", "0") ]
                 ()
             in
             D.el_append_child a
               (D.h ~tag:"span" ~cls:"flex-1"
                  ~children:
                    [ select_item_row it (i = !chosen_idx) multiple
                        !sel_values ]
                  ());
             D.el_add_listener a "click" (fun ev ->
                 Editor_dom.stop_propagation ev;
                 Editor_dom.prevent_default ev;
                 if multiple then begin
                   (if sel_mem !sel_values it.si_value then
                      sel_values :=
                        List.filter
                          (fun v -> v <> it.si_value) !sel_values
                    else sel_values := it.si_value :: !sel_values);
                   on_chosen it (sel_mem !sel_values it.si_value);
                   rerender ()
                 end else begin
                   close_all ();
                   on_chosen it true
                 end);
             D.el_append_child link_wrap a;
             D.el_append_child ac_inner link_wrap)
           its);
    (if multiple then begin
       D.clear apply_wrap;
       let btn =
         D.h ~tag:"button"
           ~cls:"ui__button inline-flex items-center justify-center text-sm"
           ~text:I.apply ()
       in
       D.el_add_listener btn "click" (fun _ ->
           close_all ();
           on_apply !sel_values);
       D.el_append_child apply_wrap btn
     end)
  in
  rerender ();
  (* extra leading content (e.g. a header row) inside the wrapper *)
  let wrap =
    if wrap_cls = "" then inner
    else begin
      let w = D.h ~cls:wrap_cls () in
      (match extra with
       | Some f -> (
           match f () with Some e -> D.el_append_child w e | None -> ())
       | None -> ());
      D.el_append_child w inner;
      w
    end
  in
  D.el_add_listener input "input" (fun _ ->
      query := Editor_dom.el_value input;
      chosen_idx := 0;
      rerender ());
  D.el_add_listener input "keydown" (fun ev ->
      match Editor_dom.ev_key ev with
      | "ArrowDown" ->
          Editor_dom.prevent_default ev;
          let its = filtered () in
          chosen_idx := min (!chosen_idx + 1) (List.length its - 1);
          rerender ()
      | "ArrowUp" ->
          Editor_dom.prevent_default ev;
          chosen_idx := max (!chosen_idx - 1) 0;
          rerender ()
      | "Enter" ->
          Editor_dom.prevent_default ev;
          (match filtered () with
           | [] -> ()
           | its -> (
               match List.nth_opt its !chosen_idx with
               | Some it ->
                   if multiple then begin
                     (if sel_mem !sel_values it.si_value then
                        sel_values :=
                          List.filter (fun v -> v <> it.si_value)
                              !sel_values
                      else sel_values := it.si_value :: !sel_values);
                     on_chosen it (sel_mem !sel_values it.si_value);
                     rerender ()
                   end else begin
                     close_all ();
                     on_chosen it true
                   end
               | None -> ()))
      | "Escape" ->
          Editor_dom.prevent_default ev;
          Editor_dom.stop_propagation ev;
          close_top ()
      | _ -> ());
  D.el_append_child inner input_wrap;
  D.el_append_child inner results_wrap;
  if multiple then D.el_append_child inner apply_wrap;
  D.el_append_child document_body wrap;
  position_content ~anchor ~content:wrap ~align_end:false ~submenu:false;
  push_popup wrap;
  Editor_dom.set_timeout (fun () -> Editor_dom.el_focus input) 0

(* -- confirm dialog -- *)

let show_dialog ~headline ~body:(body : D.el list) ~on_confirm
    ?(confirm_label = I.yes) () =
  let overlay =
    D.h ~cls:
      "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" ()
  in
  let content =
    D.h ~cls:
      "ui__dialog-content fixed left-[50%] top-[50%] z-50 grid w-full \
       max-w-2xl lg:max-w-3xl gap-4 border sm:rounded-lg bg-background \
       p-6 shadow-lg"
      ~attrs:
        [ ("role", "dialog"); ("aria-modal", "true")
        ; ("style", "transform:translate(-50%,-50%)")
        ]
      ()
  in
  let head =
    D.h ~cls:"sm:flex items-center"
      ~children:
        [ D.h ~cls:
            "mx-auto flex-shrink-0 flex items-center justify-center h-12 \
             w-12 rounded-full bg-error sm:mx-0 sm:h-10 sm:w-10"
            ~children:[ D.h ~tag:"span" ~cls:"text-error text-xl"
                          ~children:[ D.icon "alert-triangle" ] () ]
            ()
        ; D.h ~cls:"mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left"
            ~children:
              [ D.h ~tag:"h3" ~cls:"text-lg leading-6 font-medium"
                  ~attrs:[ ("id", "modal-headline") ] ~text:headline () ]
            ()
        ]
      ()
  in
  let btns =
    D.h ~cls:"pt-6 flex justify-end gap-4"
      ~children:
        [ D.h ~tag:"button" ~cls:"ui__button border px-4 py-1 rounded"
            ~text:I.cancel
            ~on_click:(fun _ ->
              pop_popup overlay;
              D.el_remove overlay)
            ()
        ; D.h ~tag:"button" ~cls:"ui__button px-4 py-1 rounded"
            ~text:confirm_label
            ~on_click:(fun _ ->
              pop_popup overlay;
              D.el_remove overlay;
              on_confirm ())
            ()
        ]
      ()
  in
  List.iter (D.el_append_child content) (head :: (body @ [ btns ]));
  D.el_append_child overlay content;
  (* clicks on the backdrop keep the dialog open (matches e2e: pointer
     release must not dismiss) *)
  D.el_append_child document_body overlay;
  push_popup overlay;
  overlay
