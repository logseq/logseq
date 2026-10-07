(* ported from deps/ui/src/pages/page_menu.ml — see the src/ original *)
(* Page dropdown/context menu and the alertdialog confirm — hand-rolled
   Logseq_dom markup because e2e requires div[role='menuitem'] >
   div.text and div[role='alertdialog'], which LUI menu/dialog nodes do
   not emit. *)

let dom = Logseq_dom.dom

let item key label on_click = Menu_item.el ~key ~label ~on_click ()

(* cljs dropdown-menu-item renders its :icon before the title *)
let icon_item key label icon_name on_click =
  Menu_item.el ~key ~label
    ~before:[ Icons.icon ~size:15. ~cls:"ls-menu-item-icon" icon_name ]
    ~on_click ()

let separator key = Menu_item.separator ~key

(* items for the current route page; convert only for non-tag pages.
   Recycle navigates to the builtin "Recycle" page by name — cljs
   header.cljs shows it whenever the page identity resolves. *)
let page_items (p : Model.page) =
  (* cljs page_menu.cljs: delete hidden for contents page and
     :logseq.property/built-in? pages *)
  let del =
    if p.page_built_in then []
    else
      [ item "del" I18n.delete_page (fun () ->
            match p.page_uuid with
            | Some u ->
                (* cljs: permanent wording for class/property entities
                   and today's journal *)
                let permanent =
                  p.page_is_tag || p.page_is_property
                  || (match p.page_journal_day with
                      | Some d -> d = Dates.today_journal_day ()
                      | None -> false)
                in
                Runtime.send
                  (Action.Confirm_set
                     (Some
                        (Model.Confirm_delete_page
                           (u, p.page_title, permanent))));
                Runtime.flush ()
            | None -> ()) ]
  in
  let fav =
    match !Sidebar_state.st_ref with
    | Some st ->
        let label =
          if Signal.get_state st.Sidebar_state.favorited then
            I18n.unfavorite_page
          else I18n.add_to_favorites
        in
        [ item "fav" label (fun () ->
              Runtime.send (Action.Page_menu_set None);
              Sidebar_state.toggle_favorite st) ]
    | None -> []
  in
  let export_page =
    item "exp-page" I18n.export_page (fun () ->
        Runtime.send (Action.Page_menu_set None);
        (match p.page_uuid with
         | Some u -> Export_state.arm u p.page_db_id ~has_top_level:true
         | None -> ());
        Sidebar_state.open_dialog "export-page")
  in
  let publish_page =
    item "pub-page" I18n.publish_page (fun () ->
        Runtime.send (Action.Page_menu_set None);
        (match p.page_uuid with
         | Some u -> Publish_view.arm u p.page_db_id
         | None -> ());
        Sidebar_state.open_dialog "publish-page")
  in
  (* cljs page_menu.cljs: convert-to-tag only for internal pages that are
     not built-in; convert-tag-to-page for non-built-in classes *)
  let convert =
    match p.page_is_tag, p.page_internal, p.page_built_in with
    | _, _, true -> []
    | true, _, _ -> (
        match p.page_db_id with
        | Some id ->
            [ item "cvt2p" I18n.convert_tag_to_page (fun () ->
                  Runtime.send
                    (Action.Confirm_set
                       (Some (Model.Confirm_convert_tag_to_page id)));
                  Runtime.flush ()) ]
        | None -> [])
    | false, true, _ -> (
        match p.page_db_id with
        | Some id ->
            [ item "cvt" I18n.convert_to_tag (fun () ->
                  Runtime.send (Action.Page_menu_set None);
                  ignore (Page_ops.convert_to_tag id)) ]
        | None -> [])
    | false, false, _ -> []
  in
  (* cljs page_menu.cljs: "(Dev) Show page data" in developer-mode *)
  let dev =
    match
      Platform.local_storage_get "developer-mode"
    with
    | Some "true" | Some "\"true\"" ->
        [ item "dev-page-data" "(Dev) Show page data" (fun () ->
              Runtime.send (Action.Page_menu_set None)) ]
    | _ -> []
  in
  fav @ del @ [ export_page; publish_page ] @ convert @ dev

(* app-wide entries mirror the cljs header dots menu
   (components/header.cljs toolbar-dots-menu): dialogs dispatch
   ls:open-dialog, Recycle navigates to its page. *)
let global_items () =
  let close () = Runtime.send (Action.Page_menu_set None) in
  [ icon_item "settings" I18n.settings "settings" (fun () ->
        close ();
        Sidebar_state.open_dialog "settings")
  ; icon_item "plugins" I18n.plugins "apps" (fun () ->
        close ();
        Sidebar_state.open_dialog "plugins")
  ; icon_item "appearance" I18n.appearance "color-swatch" (fun () ->
        close ();
        (* cljs :ui/toggle-appearance anchors the appearance popup to the
           dots trigger — the semantic topbar's dots press recorded the
           anchor when the menu opened *)
        match !Dom_ext.toolbar_dots_pos with
        | Some (x, y) ->
            Runtime.send (Action.Appearance_set (Some (x, y)))
        | None -> ())
  ; icon_item "recycle" I18n.recycle "trash" (fun () ->
        close ();
        Runtime.mark_nav ();
        Platform.set_location_hash "#/page/Recycle")
  ; icon_item "export" I18n.export_graph "database-export" (fun () ->
        close ();
        Sidebar_state.open_dialog "export-graph")
  ; icon_item "import" I18n.import_ "file-upload" (fun () ->
        close ();
        Platform.set_location_hash "#/import")
  ; icon_item "login" I18n.login "user" (fun () ->
        close ();
        Sidebar_state.open_dialog "login")
  ]

let inner_width () : float = Host.inner_width ()

let view (x, _atop, y, with_app_items) (p : Model.page option) =
  let style =
    if with_app_items then
      (* toolbar dots menu: x is the trigger's right edge -> anchor
         the menu's right edge to it like the cljs dropdown *)
      Printf.sprintf
        "position:fixed;right:%.0fpx;top:%.0fpx;--available-height:\
         calc(100vh - %.0fpx)"
        (Float.max 8. (inner_width () -. x))
        y (y +. 8.)
    else
      Printf.sprintf
        "position:fixed;left:%.0fpx;top:%.0fpx;--available-height:\
         calc(100vh - %.0fpx)"
        (* cljs anchors a 1px point at the click; the 280px
           ls-context-menu-content centers on it *)
        (Float.max 8. (Float.min (x -. 140.) (inner_width () -. 288.)))
        y (y +. 8.)
  in
  (* TODO(component): the popover kind now covers point positioning on
     web, but the native popover backends renders children inline (no
     positioning) — the dom shell stays until LUIApple implements
     popover placement *)
  dom ~key:"page-menu" ~tag:"div"
    (* toolbar dots menu is w-64 (cljs header.cljs); the page
       right-click keeps the context-menu look *)
    ~style_class:
      (if with_app_items then "ui__dropdown-menu-content ls-dots-menu"
       else "ui__dropdown-menu-content ls-context-menu-content")
    ~attrs:[ ("style", style); ("role", "menu") ]
    (* cljs header.cljs toolbar-dots-menu = page items + hr + app
       items; a page right-click shows page items only *)
    (match p, with_app_items with
     | Some p, true ->
         page_items p @ [ separator "pg-app" ] @ global_items ()
     | Some p, false -> page_items p
     | None, _ -> global_items ())

let btn key label cls act =
  Lui_elements.button ~key ~style_class:cls ~text:label
    ~on_press:(fun _ -> act ())
    []

(* div[role='alertdialog'] — Confirm / Cancel *)
let confirm_view (c : Model.confirm) =
  let icon_opt, title, desc, desc_cls, act =
    match c with
    | Model.Confirm_delete_page (u, page_title, permanent) ->
        ( Some (Icons.icon ~size:20. "alert-triangle")
        , (if permanent then I18n.delete_page_permanent_desc
           else I18n.delete_page_desc)
        , "- " ^ page_title
        , "ui__alert-dialog-description"
        , fun () -> ignore (Page_ops.delete u) )
    | Model.Confirm_convert_tag_to_page id ->
        ( None
        , I18n.convert_tag_to_page
        , I18n.convert_tag_to_page_desc
        , "ui__alert-dialog-description"
        , fun () -> ignore (Page_ops.convert_tag_to_page id) )
    | Model.Confirm_delete_asset u ->
        ( None
        , I18n.asset_confirm_delete
        , ""
        , "ui__alert-dialog-description"
        , fun () -> Asset_dom.delete_asset u )
  in
  let close () =
    Runtime.send (Action.Confirm_set None);
    Runtime.flush ()
  in
  (* backdrop dismiss: only the overlay itself closes — the press-detail
     payload's target_class is the deepest hit *)
  Lui_elements.column ~key:"alertdlg-overlay"
    ~style_class:"ui__alert-dialog-overlay"
    ~on_press_detail:(fun ev ->
      match ev with
      | Lui_protocol.PressDetail (_, d) ->
          if
            I18n.contains d.Lui_protocol.target_class
              "ui__alert-dialog-overlay"
          then close ()
      | _ -> ())
    [ Lui_elements.column ~key:"alertdlg"
        ~style_class:"ui__alert-dialog-content"
        [ (* cljs dialog-confirm title: flex gap-2 items-center >
             icon + text (heading is a leaf — the row carries the pair) *)
          (match icon_opt with
           | Some i ->
               Lui_elements.row ~key:"adlg-tw" ~cross:`center
                 ~style_class:"ui__alert-dialog-title ls-alert-title"
                 [ i
                 ; Lui_elements.heading ~key:"adlg-t" ~value:title [] ]
           | None ->
               Lui_elements.heading ~key:"adlg-t"
                 ~style_class:"ui__alert-dialog-title" ~value:title [])
        ; Lui_elements.text ~key:"adlg-d"
            ~style_class:desc_cls ~value:desc []
        ; Lui_elements.row ~key:"adlg-f"
            ~style_class:"ui__alert-dialog-footer"
            [ btn "adlg-cancel" I18n.cancel
                "ui__button ls-btn-outline" close
            ; btn "adlg-confirm" I18n.confirm
                "ui__button ls-btn-primary" (fun () ->
                  close ();
                  act ())
            ]
        ]
    ]

(* cljs right-sidebar/get-current-page falls back to today's journal on
   every route that isn't :page/:file — the toolbar dots menu always
   offers the page section *)
let resolve_menu_page (m : Model.t) uuid =
  let by_uuid u (p : Model.page) = p.Model.page_uuid = Some u in
  match uuid, m.route_page with
  | Some u, Some p when by_uuid u p -> m.route_page
  | Some u, _ -> List.find_opt (by_uuid u) m.journals
  | None, Some _ -> m.route_page
  | None, None ->
      List.find_opt
        (fun (p : Model.page) ->
          p.Model.page_journal_day = Some (Dates.today_journal_day ()))
        m.journals

(* stop overlay clicks from leaking to the dialog handler *)
let dialog_view (m : Model.t) =
  match m.page_menu with
  | Some (ax, atop, abot, with_app, uuid) ->
      view (ax, atop, abot, with_app) (resolve_menu_page m uuid)
  | None -> (
      match m.confirm with
      | Some c -> confirm_view c
      | None -> Lui_elements.spacer ~key:"page-menu-empty" [])
