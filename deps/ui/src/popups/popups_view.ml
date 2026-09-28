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

(* cljs item-render: div[title] > (icon+strong.font-normal | bare text) *)
let ac_label_el (it : S.ac_item) : t =
  let txt =
    match it.S.ai_info with
    | Some info -> it.S.ai_label ^ " — " ^ info
    | None -> it.S.ai_label
  in
  let inner =
    match it.S.ai_icon with
    | Some ic ->
        Logseq_dom.dom ~key:"ic" ~tag:"span"
          ~style_class:"flex items-center gap-1"
          [ Icons.icon ic
          ; Logseq_dom.dom ~key:"s" ~tag:"strong" ~style_class:"font-normal"
              ~text:txt [] ]
    | None -> Logseq_dom.dom ~key:"s" ~tag:"span" ~text:txt []
  in
  Logseq_dom.dom ~key:"lbl" ~tag:"div" [ inner ]
;;

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
            [ Logseq_dom.dom ~key:"flex1" ~tag:"span" ~style_class:"flex-1"
                [ dyn
                    ~equal:(fun (a : S.ac_item) b ->
                      a.S.ai_label = b.S.ai_label && a.S.ai_info = b.S.ai_info
                      && a.S.ai_icon = b.S.ai_icon)
                    (fun it -> ac_label_el it)
                    item_sig
                ]
            ]
        ]
    ]
;;

let ac_empty_placeholder (v : S.view) : t =
  let text =
    match v.S.ac with
    | Some { kind = S.Page_ref | S.Embed_ref | S.Page_embed; _ } ->
        U.t "editor/search-for-node"
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
  (* cljs PopoverContent: ui__popover-content + card classes *)
  Logseq_dom.dom ~key:"ac-pop"
    ~style_class:
      "ui__popover-content z-50 rounded-md border bg-popover \
       text-popover-foreground shadow-md outline-none"
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
                 ; ( "data-editor-popup-ref"
                   , S.popup_ref_of_kind a.S.kind ) ]
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
    ; (* cljs page-search-aux: mod+enter hint under the tag list *)
      if_
        ~test:
          (Signal.map
             (fun (v : S.view) ->
               match v.S.ac with
               | Some a ->
                   a.S.kind = S.Tag_search && a.S.query <> ""
                   && String.lowercase_ascii a.S.query <> "page"
               | None -> false)
             st.S.vs.Signal.state_signal)
        (Logseq_dom.dom ~key:"ac-hint" ~tag:"p"
           ~style_class:
             "px-1 opacity-50 text-sm flex flex-row items-center gap-2"
           [ (* shui/shortcut "mod+enter" → combo glow container *)
             Logseq_dom.dom ~key:"sc" ~tag:"div"
               ~style_class:"shui-shortcut-combo shui-shortcut-glow"
               ~attrs:
                 [ ("data-shortcut-binding", "mod+enter")
                 ; ("style", "white-space: nowrap") ]
               [ Logseq_dom.dom ~key:"k0" ~tag:"kbd"
                   ~style_class:"shui-shortcut-key"
                   ~text:(Platform.utf8 "\xe2\x8c\x98") []
               ; Logseq_dom.dom ~key:"sep1" ~tag:"span"
                   ~style_class:"shui-shortcut-separator" []
               ; Logseq_dom.dom ~key:"k1" ~tag:"kbd"
                   ~style_class:"shui-shortcut-key"
                   ~text:(Platform.utf8 "\xe2\x8f\x8e") [] ]
           ; Logseq_dom.dom ~key:"ht" ~tag:"span"
               ~text:(U.t "editor/display-tag-inline-hint") [] ])
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

(* shui button :ghost :icon + to-heading-button — full class list from
   with-button-classes so the ghost hover/size styles come out identical *)
let cm_heading_btn key title value icon : t =
  Logseq_dom.dom ~key ~tag:"button"
    ~style_class:
      "ui__button inline-flex cursor-pointer items-center justify-center \
       whitespace-nowrap rounded-md text-sm gap-1 font-medium \
       ring-offset-background transition-colors focus-visible:outline-none \
       focus-visible:ring-2 focus-visible:ring-ring \
       focus-visible:ring-offset-2 disabled:pointer-events-none \
       disabled:opacity-50 select-none hover:bg-secondary/70 \
       hover:text-secondary-foreground active:opacity-80 as-ghost \
       box-content h-6 w-6 p-1 overflow-hidden to-heading-button"
    ~attrs:
      [ ("title", title); ("data-cm-heading", value)
      ; ("style", "box-sizing: border-box; height: 30px; padding: 0; width: 30px") ]
    [ icon ]
;;

(* ui.cljs menu-heading: h-1..h-6 font icons, h-auto/heading-off ext icons *)
let cm_heading_row () : t =
  let hs =
    List.init 6 (fun i ->
        let n = string_of_int (i + 1) in
        cm_heading_btn ("h-" ^ n) (U.tf "editor/heading" [ n ]) n
          (Icons.icon ("h-" ^ n)))
  in
  Logseq_dom.dom ~key:"headings"
    ~style_class:"flex flex-row justify-between pb-2 pt-1 px-2 items-center"
    [ Logseq_dom.dom ~key:"headings-row"
        ~style_class:"flex flex-row items-center justify-between flex-1 mx-2"
        (hs
        @ [ cm_heading_btn "h-auto" (U.t "editor/auto-heading") "auto"
              (Icons.icon "h-auto")
          ; cm_heading_btn "h-rm" (U.t "editor/remove-heading") "none"
              (Icons.icon "heading-off") ]) ]
;;

(* shui/shortcut root for :combo (binding has "+") and :separate styles *)
let cm_shortcut_el (binding, caps) : t =
  let combo = String.contains binding '+' in
  let kbd i cap =
    Logseq_dom.dom ~key:("k" ^ string_of_int i) ~tag:"kbd"
      ~style_class:"shui-shortcut-key" ~text:(Platform.utf8 cap) []
  in
  let children =
    List.concat
      (List.mapi
         (fun i cap ->
           let sep =
             if combo && i > 0 then
               [ Logseq_dom.dom ~key:("sep" ^ string_of_int i) ~tag:"span"
                   ~style_class:"shui-shortcut-separator" [] ]
             else []
           in
           sep @ [ kbd i cap ])
         caps)
  in
  Logseq_dom.dom ~key:"sc" ~tag:"span" ~style_class:"ml-auto pl-2"
    [ Logseq_dom.dom ~key:"sc-box" ~tag:"div"
        ~style_class:
          (if combo then "shui-shortcut-combo shui-shortcut-glow"
           else "shui-shortcut-separate shui-shortcut-glow")
        ~attrs:
          [ ("data-shortcut-binding", binding)
          ; ( "style"
            , if combo then "white-space: nowrap"
              else "white-space: nowrap; gap: 4px" ) ]
        children ]
;;

let cm_item_cls =
  "ui__dropdown-menu-item relative flex cursor-pointer select-none \
   items-center rounded-sm px-2 py-1.5 text-sm outline-none"
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
            ~style_class:"ui__dropdown-menu-separator -mx-1 my-1 h-px bg-muted" []
      | S.Ci_colors -> cm_color_row ()
      | S.Ci_headings -> cm_heading_row ()
      | S.Ci_sub label ->
          Logseq_dom.dom ~key:"sub"
            ~style_class:
              "ui__dropdown-menu-sub-trigger flex cursor-pointer select-none \
               items-center rounded-sm px-2 py-1.5 text-sm outline-none"
            ~attrs:
              [ ("role", "menuitem"); ("aria-haspopup", "menu")
              ; ("data-cm-item", label)
              ; ("style", "cursor: pointer") ]
            [ Logseq_dom.dom ~key:"lbl" ~tag:"span" ~text:label []
            ; Icons.icon ~cls:"ml-auto h-4 w-4" "chevron-right" ]
      | S.Ci_item (label, scut, cmd) ->
          Logseq_dom.dom ~key:"item" ~style_class:cm_item_cls
            ~attrs:
              [ ("role", "menuitem"); ("data-cm-item", cmd)
              ; ("style", "cursor: pointer") ]
            (Logseq_dom.dom ~key:"lbl" ~tag:"span" ~text:label []
             :: (match scut with
                 | Some s -> [ cm_shortcut_el s ]
                 | None -> [])))
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
  (* cljs as-dropdown? context menu: dropdown-menu-content card classes
     merged with content-props class w-[280px] ls-context-menu-content *)
  Logseq_dom.dom ~key:"cm"
    ~style_class:
      "ui__dropdown-menu-content ls-context-menu-content w-[280px] z-50 \
       min-w-[8rem] rounded-md border bg-popover p-1 \
       text-popover-foreground shadow-md outline-none"
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
  Dom_ext.closest el
    ".ui__popover-content, .ls-context-menu-content, .ls-preview-popup"
  <> None
;;

(* ---- page-ref hover preview ----
   cljs popup-preview-impl: mousemove on .preview-ref-link arms a 1000ms
   show timer; leaving the link/popup starts a 300/500ms hide timer *)

let pv_show_id : int option ref = ref None
let pv_hide_id : int option ref = ref None
let pv_pending : Dom_ext.element option ref = ref None

let pv_cancel_show () =
  (match !pv_show_id with
   | Some id -> Dom_ext.clear_timeout id
   | None -> ());
  pv_show_id := None;
  pv_pending := None

let pv_cancel_hide () =
  match !pv_hide_id with
  | Some id ->
      Dom_ext.clear_timeout id;
      pv_hide_id := None
  | None -> ()

let pv_open st (wrap : Dom_ext.element) =
  pv_pending := Some wrap;
  match
    Option.bind
      (Dom_ext.query_selector wrap "a[data-ref]")
      (fun a -> Dom_ext.get_attribute a "data-ref")
  with
  | None -> ()
  | Some name ->
      let r = Dom_ext.bounding_rect wrap in
      let x = Dom_ext.rect_left r and y = Dom_ext.rect_bottom r +. 8.0 in
      ignore
        (S.fetch_preview_blocks (Router.repo ()) name
         |> Js.Promise.then_ (fun blocks ->
                (match !pv_pending with
                 | Some el when el == wrap ->
                     (* two signal sets: close -> set forces the if_
                        branch to remount so a different page's preview
                        replaces the old one *)
                     S.close_pv st;
                     S.set_pv st
                       (Some
                          { S.pv_x = x; S.pv_y = y; S.pv_blocks = blocks })
                 | _ -> ());
                Js.Promise.resolve ()))

let pv_track st el =
  if Dom_ext.closest el ".ls-preview-popup" <> None then (
    pv_cancel_show ();
    pv_cancel_hide ())
  else
    match Dom_ext.closest el ".preview-ref-link" with
    | Some wrap -> (
        pv_cancel_hide ();
        match !pv_pending with
        | Some p when p == wrap -> ()
        | _ ->
            pv_cancel_show ();
            pv_pending := Some wrap;
            pv_show_id :=
              Some
                (Dom_ext.set_timeout_id (fun () -> pv_open st wrap) 1000))
    | None -> (
        pv_cancel_show ();
        match (S.get st).S.pv, !pv_hide_id with
        | Some _, None ->
            pv_hide_id :=
              Some
                (Dom_ext.set_timeout_id (fun () -> S.close_pv st) 400)
        | _ -> ())

let pv_popover (st : S.t) : t =
  Logseq_dom.dom ~key:"pv-pop" ~style_class:"ls-preview-popup"
    ~attrs_signal_v:
      (Signal.map
         (fun (v : S.view) ->
           match v.S.pv with
           | Some p ->
               attrs_v
                 [ ( "style"
                   , Printf.sprintf
                       "position: fixed; left: %.0fpx; top: %.0fpx; \
                        z-index: 999"
                       p.S.pv_x p.S.pv_y ) ]
           | None -> attrs_v [])
         st.S.vs.Signal.state_signal)
    [ Logseq_dom.dom ~key:"pvw" ~style_class:"tippy-wrapper as-page"
        ~attrs:
          [ ("tabindex", "-1")
          ; ( "style"
            , "width: 600px; text-align: left; font-weight: 500; \
               padding-bottom: 64px" )
          ]
        [ Logseq_dom.dom ~key:"pvp" ~style_class:"page"
            [ Logseq_dom.dom ~key:"pvb" ~style_class:"ls-page-blocks"
                [ Logseq_dom.dom ~key:"pvbi"
                    ~style_class:"page-blocks-inner relative"
                    (match (S.get st).S.pv with
                     | Some p ->
                         List.map
                           (Tree.block_row ~scope:"preview"
                              ~editable:false)
                           p.S.pv_blocks
                     | None -> [])
                ]
            ]
        ]
    ]

let handle_input st (ev : Dom_ext.event) =
  match Dom_ext.target ev with
  | Some el -> (
      match Dom_ext.closest el ".editor-wrapper textarea" with
      | Some ta -> S.on_editor_input st ta
      | None -> ())
  | None -> ()
;;

let handle_keydown st (ev : Dom_ext.event) =
  if S.ac_keydown st ev then (
    Dom_ext.prevent_default ev;
    (* stopImmediate: same-target listeners registered later (the editor's
       own keydown) must not also react to the key the popup consumed *)
    Dom_ext.stop_immediate_propagation ev)
  else
    match Dom_ext.key_ ev with
    | Some "Escape" when (S.get st).S.cm <> None -> S.close_cm st
    | _ -> ()
;;

let handle_contextmenu st (ev : Dom_ext.event) =
  match Dom_ext.target ev with
  | None -> ()
  | Some el -> (
      if Dom_ext.closest el ".ls-page-title" <> None then ()
      else
      match
        Dom_ext.closest el ".bullet-container[blockid], .ls-block[blockid]"
      with
      | Some blk -> (
          match Dom_ext.get_attribute blk "blockid" with
          | Some id ->
              Dom_ext.prevent_default ev;
              Dom_ext.stop_propagation ev;
              (* cljs block-content contextmenu selects the block it
                 opened on, unless it is already in a multi-selection *)
              if not (Editor_state.is_selected id) then
                Editor_actions.select_single id;
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
      (match Dom_ext.closest el ".menu-link-wrap" with
       | Some wrap -> (
           match Dom_ext.query_selector wrap "a.menu-link" with
           | Some lnk -> S.ac_mousemove st lnk
           | None -> ())
       | None -> ());
      pv_track st el)
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
  let pv_open_sig =
    Signal.map (fun (v : S.view) -> v.S.pv <> None)
      st.S.vs.Signal.state_signal
  in
  let body =
    box ~key:"popups_view"
      [ if_ ~test:ac_open (ac_popover st)
      ; if_ ~test:cm_open (cm_popover st)
      ; if_ ~test:pv_open_sig (pv_popover st) ]
  in
  body context parent
