(* Autocomplete + context-menu overlays — mirrors editor.cljs
   auto-complete (.ui__popover-content > #ui__ac > #ui__ac-inner >
   [.ui__ac-group-name] .menu-link-wrap > a#ac-<i>.menu-link[.chosen])
   and content.cljs custom context menus (.ls-context-menu-content).

   Popups are positioned with fixed coordinates and dismissed on outside
   click / Escape; they sit directly under .cp__overlays (not portaled)
   since positioning is computed in viewport coords. *)

open Lui_elements

module S = Popups_state
module U = Ui_strings

let sv s = Lui_protocol.StringValue s

let attrs_v pairs = sv (Logseq_dom.attrs_json pairs)

(* -- autocomplete item ----------------------------------------------- *)

let ac_item_el (st : S.t) (item_sig : S.ac_item Signal.signal) : t =
  let pair =
    Signal.map2
      (fun (it : S.ac_item) (v : S.view) -> (it, v))
      item_sig st.S.vs.Signal.state_signal
  in
  box ~key:"ac-item"
    [ dyn
        ~equal:(fun (a : S.ac_item) b -> a.S.ai_hdr = b.S.ai_hdr)
        (fun it ->
          match it.S.ai_hdr with
          | None -> box ~key:"no-hdr" []
          | Some h ->
              Logseq_dom.dom ~key:"ghdr"
                ~style_class:"ui__ac-group-name" ~text:h [])
        item_sig
    ; Logseq_dom.dom ~key:"wrap" ~style_class:"menu-link-wrap"
        [ Logseq_dom.dom ~key:"lnk" ~tag:"a"
            ~style_class_signal:
              (Signal.map
                 (fun (it, v) ->
                   let chosen =
                     match v.S.ac with
                     | Some ac -> ac.S.chosen = it.S.ai_idx
                     | None -> false
                   in
                   sv
                     ("flex justify-between menu-link"
                    ^ if chosen then " chosen" else ""))
                 pair)
            ~attrs_signal_v:
              (Signal.map
                 (fun (it, _) ->
                   attrs_v
                     [ ("id", "ac-" ^ string_of_int it.S.ai_idx)
                     ; ("tabindex", "0") ])
                 pair)
            [ dyn
                ~equal:(fun (a : S.ac_item) b ->
                  a.S.ai_label = b.S.ai_label && a.S.ai_info = b.S.ai_info)
                (fun it ->
                  let txt =
                    match it.S.ai_info with
                    | Some info -> it.S.ai_label ^ " — " ^ info
                    | None -> it.S.ai_label
                  in
                  Logseq_dom.dom ~key:"lbl" ~tag:"span"
                    ~style_class:"flex-1" ~text:txt [])
                item_sig
            ]
        ]
    ]
;;

let ac_empty_placeholder (v : S.view) : t =
  let text =
    match v.S.ac with
    | Some { kind = S.Page_ref; _ } -> U.t "editor/search-for-node"
    | Some { kind = S.Tag_search; _ } -> U.t "editor/search-for-tag"
    | _ -> U.t "editor/block-search"
  in
  Logseq_dom.dom ~key:"ac-empty"
    ~style_class:"text-gray-500 text-sm px-4 py-2" ~text []
;;

let ac_inner (st : S.t) : t =
  (* the empty state is a sentinel keyed item: a dyn sibling of keyed would
     crash the DOM batch ("unknown DOM node"), so it lives inside the list *)
  let items_sig =
    Signal.map
      (fun (v : S.view) ->
        match v.S.ac with
        | Some a -> (match a.S.items with [] -> [ S.empty_item ] | xs -> xs)
        | None -> [])
      st.S.vs.Signal.state_signal
  in
  Logseq_dom.dom ~key:"ac-inner" ~id:"ui__ac-inner"
    ~style_class:"hide-scrollbar"
    ~attrs:[ ("style", "max-height: 290px") ]
    [ keyed ~source:items_sig ~key:(fun (it : S.ac_item) -> it.S.ai_key)
        ~cmp:Stdlib.compare
        ~mount:(fun item_sig ->
          box ~key:"ac-row"
            [ dyn
                ~equal:(fun (a : S.ac_item) b ->
                  (a.S.ai_key = S.empty_key) = (b.S.ai_key = S.empty_key))
                (fun it ->
                  if it.S.ai_key = S.empty_key then
                    ac_empty_placeholder (S.get st)
                  else ac_item_el st item_sig)
                item_sig ]) ]
;;

let ac_popover (st : S.t) : t =
  Logseq_dom.dom ~key:"ac-pop"
    ~style_class:"ui__popover-content"
    ~attrs_signal_v:
      (Signal.map
         (fun (v : S.view) ->
           match v.S.ac with
           | Some a ->
               attrs_v
                 [ ( "style"
                   , Printf.sprintf
                       "position: fixed; left: %.0fpx; top: %.0fpx; z-index: 999"
                       a.S.x a.S.y )
                 ; ("data-side", "bottom")
                 ; ("data-editor-popup-ref", "true") ]
           | None -> attrs_v [])
         st.S.vs.Signal.state_signal)
    [ Logseq_dom.dom ~key:"ac" ~id:"ui__ac"
        ~style_class_signal:
          (Signal.map
             (fun (v : S.view) ->
               sv
                 (match v.S.ac with
                  | Some a -> S.ac_class_of_kind a.S.kind
                  | None -> ""))
             st.S.vs.Signal.state_signal)
        [ ac_inner st ]
    ]
;;

(* -- context menu ---------------------------------------------------- *)

let cm_color_row () : t =
  let swatch c =
    Logseq_dom.dom ~key:("color-" ^ c) ~tag:"a"
      ~style_class:
        "cursor-pointer inline-flex items-center justify-center w-[30px] h-[30px]"
      ~attrs:
        [ ("title", U.t ("color/" ^ c)); ("data-cm-color", c)
        ; ("style", "cursor: pointer") ]
      [ Logseq_dom.dom ~key:"bg" ~style_class:"heading-bg"
          ~attrs:
            [ ( "style"
              , "background-color: var(--color-" ^ c ^ "-500)" ) ]
            [] ]
  in
  let remove =
    Logseq_dom.dom ~key:"color-rm" ~tag:"a"
      ~style_class:
        "cursor-pointer inline-flex items-center justify-center w-[30px] h-[30px]"
      ~attrs:
        [ ("title", U.t "ui/remove-background"); ("data-cm-color", "")
        ; ("style", "cursor: pointer") ]
      [ Logseq_dom.dom ~key:"bg" ~style_class:"heading-bg remove" ~text:"-" [] ]
  in
  Logseq_dom.dom ~key:"colors"
    ~style_class:"flex flex-row justify-between py-1 px-2 items-center"
    [ Logseq_dom.dom ~key:"colors-row"
        ~style_class:"flex flex-row justify-between flex-1 mx-2 mt-2"
        (List.map swatch S.colors @ [ remove ]) ]
;;

let cm_heading_row () : t =
  let btn key title value =
    Logseq_dom.dom ~key ~tag:"button"
      ~style_class:"to-heading-button cursor-pointer"
      ~attrs:[ ("title", title); ("data-cm-heading", value) ]
      []
  in
  let hs =
    List.init 6 (fun i ->
        btn ("h-" ^ string_of_int (i + 1))
          (U.tf "editor/heading" [ string_of_int (i + 1) ])
          (string_of_int (i + 1)))
  in
  Logseq_dom.dom ~key:"headings"
    ~style_class:"flex flex-row justify-between pb-2 pt-1 px-2 items-center"
    [ Logseq_dom.dom ~key:"headings-row"
        ~style_class:"flex flex-row items-center justify-between flex-1 mx-2"
        (hs
        @ [ btn "h-auto" (U.t "editor/auto-heading") "auto"
          ; btn "h-rm" (U.t "editor/remove-heading") "none" ]) ]
;;

let cm_item_el (entry_sig : S.cm_item Signal.signal) : t =
  (* keyed mounts run with parent=None, so the entry point must be a real
     node — wrap the dynamic branch in a box *)
  box ~key:"cm-entry"
    [ dyn
      ~equal:(fun (a : S.cm_item) b -> a = b)
      (function
      | S.Ci_sep ->
          Logseq_dom.dom ~key:"sep" ~attrs:[ ("role", "separator") ]
            ~style_class:"-mx-1 my-1 h-px bg-gray-06" []
      | S.Ci_colors -> cm_color_row ()
      | S.Ci_headings -> cm_heading_row ()
      | S.Ci_sub label ->
          Logseq_dom.dom ~key:"sub" ~style_class:"menu-link-wrap"
            [ Logseq_dom.dom ~key:"item"
                ~style_class:"menu-link cursor-pointer flex justify-between"
                ~attrs:
                  [ ("role", "menuitem"); ("aria-haspopup", "menu")
                  ; ("data-cm-item", label)
                  ; ("style", "cursor: pointer") ]
                [ Logseq_dom.dom ~key:"lbl" ~tag:"div"
                    ~style_class:"flex-1" ~text:label []
                ; Logseq_dom.dom ~key:"chev" ~tag:"span" ~text:"›" [] ] ]
      | S.Ci_item label ->
          Logseq_dom.dom ~key:"item-wrap" ~style_class:"menu-link-wrap"
            [ Logseq_dom.dom ~key:"item"
                ~style_class:"menu-link cursor-pointer flex justify-between"
                ~attrs:
                  [ ("role", "menuitem"); ("data-cm-item", label)
                  ; ("style", "cursor: pointer") ]
                [ Logseq_dom.dom ~key:"lbl" ~tag:"div"
                    ~style_class:"flex-1" ~text:label [] ] ])
        entry_sig ]
;;

let cm_popover (st : S.t) : t =
  let entries_sig =
    Signal.map
      (fun (v : S.view) ->
        match v.S.cm with
        | Some m -> List.mapi (fun i e -> (i, e)) m.S.entries
        | None -> [])
      st.S.vs.Signal.state_signal
  in
  Logseq_dom.dom ~key:"cm"
    ~style_class:"ls-context-menu-content w-[280px]"
    ~attrs_signal_v:
      (Signal.map
         (fun (v : S.view) ->
           match v.S.cm with
           | Some m ->
               attrs_v
                 [ ( "style"
                   , Printf.sprintf
                       "position: fixed; left: %.0fpx; top: %.0fpx; z-index: 999"
                       m.S.cx m.S.cy ) ]
           | None -> attrs_v [])
         st.S.vs.Signal.state_signal)
    [ Logseq_dom.dom ~key:"cm-wrap" ~style_class:"menu-links-wrapper"
        [ keyed ~source:entries_sig ~key:(fun ((i, _) : int * S.cm_item) -> i)
            ~cmp:Stdlib.compare
            ~mount:(fun entry_sig ->
              cm_item_el (Signal.map (fun ((_, e) : int * S.cm_item) -> e) entry_sig)) ]
    ]
;;

(* -- delegated listeners --------------------------------------------- *)

let in_popups el =
  Dom_ext.closest el ".ui__popover-content, .ls-context-menu-content"
  <> None
;;

let handle_input st (ev : Dom_ext.event) =
  match Dom_ext.target ev with
  | Some el -> (
      match Dom_ext.closest el ".editor-wrapper textarea" with
      | Some ta -> S.on_editor_input st ta ev
      | None -> ())
  | None -> ()
;;

let handle_keydown st (ev : Dom_ext.event) =
  if S.ac_keydown st ev then (
    Dom_ext.prevent_default ev;
    Dom_ext.stop_propagation ev)
  else
    match Dom_ext.key_ ev with
    | Some "Escape" when (S.get st).S.cm <> None -> S.close_cm st
    | _ -> ()
;;

let handle_contextmenu st (ev : Dom_ext.event) =
  match Dom_ext.target ev with
  | None -> ()
  | Some el -> (
      match
        Dom_ext.closest el ".bullet-container[blockid], .ls-block[blockid]"
      with
      | Some blk -> (
          match Dom_ext.get_attribute blk "blockid" with
          | Some id ->
              Dom_ext.prevent_default ev;
              Dom_ext.stop_propagation ev;
              S.open_cm st ~x:(Dom_ext.client_x ev)
                ~y:(Dom_ext.client_y ev) ~block_id:id
                ~multi:(List.length (Platform.selected_block_uuids ()) >= 2)
          | None -> ())
      | None -> ())
;;

(* run f with the value of attr on the closest matching ancestor *)
let with_data_attr el attr f =
  match Dom_ext.closest el ("[" ^ attr ^ "]") with
  | Some el2 ->
      Option.iter f (Dom_ext.get_attribute el2 attr)
  | None -> ()
;;

let ac_index_of_id id =
  if String.length id > 3 && String.sub id 0 3 = "ac-" then
    int_of_string_opt (String.sub id 3 (String.length id - 3))
  else None
;;

let handle_click st (ev : Dom_ext.event) =
  match Dom_ext.target ev with
  | None -> ()
  | Some el ->
      if not (in_popups el) then (S.close_ac st; S.close_cm st)
      else (
        Dom_ext.prevent_default ev;
        if Dom_ext.closest el "[data-cm-color]" <> None then
          with_data_attr el "data-cm-color" (S.run_cm_color st)
        else if Dom_ext.closest el "[data-cm-heading]" <> None then
          with_data_attr el "data-cm-heading" (S.run_cm_heading st)
        else if Dom_ext.closest el "[data-cm-item]" <> None then
          with_data_attr el "data-cm-item" (S.run_cm_item st)
        else
          match Dom_ext.closest el "#ui__ac-inner a.menu-link" with
          | Some lnk ->
              Option.iter
                (fun i -> S.apply_index st i)
                (Option.bind
                   (Dom_ext.get_attribute lnk "id")
                   ac_index_of_id)
          | None -> ())
;;

let handle_mousemove st (ev : Dom_ext.event) =
  match Dom_ext.target ev with
  | Some el -> (
      match Dom_ext.closest el ".menu-link-wrap" with
      | Some wrap -> (
          match Dom_ext.query_selector wrap "a.menu-link" with
          | Some lnk -> S.ac_mousemove st lnk
          | None -> ())
      | None -> ())
  | None -> ()
;;

(* preventDefault on popup mousedown so clicking a menu item never
   steals focus from the editor textarea (cljs behaves this way — the
   editor keeps focus while the autocomplete/page-ref popup is open) *)
let handle_mousedown _st (ev : Dom_ext.event) =
  match Dom_ext.target ev with
  | Some el when in_popups el -> Dom_ext.prevent_default ev
  | _ -> ()

let install_listeners st =
  Dom_ext.add_document_listener "input" (handle_input st) true;
  Dom_ext.add_document_listener "keydown" (handle_keydown st) true;
  Dom_ext.add_document_listener "contextmenu" (handle_contextmenu st) true;
  Dom_ext.add_document_listener "click" (handle_click st) true;
  Dom_ext.add_document_listener "mousedown" (handle_mousedown st) true;
  Dom_ext.add_document_listener "mousemove" (handle_mousemove st) false
;;

let render (_ms : Model.t Signal.signal) : t =
 fun context parent ->
  let st = S.make context.Lui_ui.ui_scheduler in
  install_listeners st;
  let ac_open =
    Signal.map (fun (v : S.view) -> v.S.ac <> None)
      st.S.vs.Signal.state_signal
  in
  let cm_open =
    Signal.map (fun (v : S.view) -> v.S.cm <> None)
      st.S.vs.Signal.state_signal
  in
  let body =
    box ~key:"popups_view"
      [ if_ ~test:ac_open (ac_popover st)
      ; if_ ~test:cm_open (cm_popover st) ]
  in
  body context parent
