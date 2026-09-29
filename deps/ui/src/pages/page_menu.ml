(* Page dropdown/context menu and the alertdialog confirm — hand-rolled
   Logseq_dom markup because e2e requires div[role='menuitem'] >
   div.text and div[role='alertdialog'], which LUI menu/dialog nodes do
   not emit. *)

let dom = Logseq_dom.dom

let item key label on_click = Menu_item.el ~key ~label ~on_click ()

(* cljs dropdown-menu-item renders its :icon before the title *)
let icon_item key label icon_name on_click =
  Menu_item.el ~key ~label
    ~before:[ Icons.icon ~size:15. ~cls:"mr-2" icon_name ]
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
                Runtime.send
                  (Action.Confirm_set (Some (Model.Confirm_delete_page u)));
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
         | Some u -> Export_state.arm u p.page_db_id
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
  fav @ del @ [ export_page; publish_page ] @ convert

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
           dots trigger, same as the menu itself *)
        match Dom_ext.doc_query_selector ".toolbar-dots-btn" with
        | Some el ->
            let r = Dom_ext.bounding_rect el in
            Runtime.send
              (Action.Appearance_set
                 (Some (Dom_ext.rect_right r, Dom_ext.rect_bottom r +. 4.)))
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

external inner_width : float = "innerWidth" [@@mel.scope "window"]

let view (x, y, with_app_items) (p : Model.page option) =
  let style =
    if with_app_items then
      (* toolbar dots menu: x is the trigger's right edge -> anchor
         the menu's right edge to it like the cljs dropdown *)
      Printf.sprintf "position:fixed;right:%.0fpx;top:%.0fpx"
        (Float.max 8. (inner_width -. x))
        y
    else
      Printf.sprintf "position:fixed;left:%.0fpx;top:%.0fpx"
        (Float.min x (inner_width -. 250.))
        y
  in
  dom ~key:"page-menu" ~tag:"div"
    ~style_class:
      "ui__dropdown-menu-content z-50 min-w-[8rem] rounded-md border \
       bg-popover p-1 text-popover-foreground shadow-md"
    ~attrs:[ ("style", style) ]
    (* cljs header.cljs toolbar-dots-menu = page items + hr + app
       items; a page right-click shows page items only *)
    (match p, with_app_items with
     | Some p, true ->
         page_items p @ [ separator "pg-app" ] @ global_items ()
     | Some p, false -> page_items p
     | None, _ -> global_items ())

let btn key label cls act =
  dom ~key ~tag:"button" ~style_class:cls ~text:label ~events:"click"
    ~on_dom_event:(fun name _ -> if name = "click" then act ())
    []

(* div[role='alertdialog'] — Confirm / Cancel *)
let confirm_view (c : Model.confirm) =
  let title, desc, act =
    match c with
    | Model.Confirm_delete_page u ->
        ( I18n.delete_page_title
        , I18n.delete_page_desc
        , fun () -> ignore (Page_ops.delete u) )
    | Model.Confirm_convert_tag_to_page id ->
        ( I18n.convert_tag_to_page
        , I18n.convert_tag_to_page_desc
        , fun () -> ignore (Page_ops.convert_tag_to_page id) )
    | Model.Confirm_delete_asset u ->
        ( I18n.asset_confirm_delete
        , ""
        , fun () -> Asset_dom.delete_asset u )
  in
  let close () =
    Runtime.send (Action.Confirm_set None);
    Runtime.flush ()
  in
  dom ~key:"alertdlg-overlay" ~tag:"div"
    ~style_class:
      "ui__alert-dialog-overlay fixed inset-0 z-50 bg-background/80 \
       backdrop-blur-sm"
    ~events:"click"
    ~on_dom_event:(fun name payload ->
      (* only the backdrop itself dismisses — clicks inside the
         content bubble here but target the dialog *)
      if
        name = "click"
        && Option.fold ~none:false
             ~some:(fun p ->
               I18n.contains
                 (Platform.payload_str p "targetClass")
                 "ui__alert-dialog-overlay")
             payload
      then close ())
    [ dom ~key:"alertdlg" ~tag:"div"
        ~attrs:
          [ ("role", "alertdialog")
          ; ( "style"
            , "position:fixed;left:50%;top:50%;transform:translate(-50%,-50%)" )
          ]
        ~style_class:
          "ui__alert-dialog-content z-50 grid w-full max-w-lg gap-4 \
           border bg-background p-6 shadow-lg sm:rounded-lg"
        [ dom ~key:"adlg-t" ~tag:"h2"
            ~style_class:"ui__alert-dialog-title text-lg font-semibold"
            ~text:title []
        ; dom ~key:"adlg-d" ~tag:"div"
            ~style_class:
              "ui__alert-dialog-description text-sm \
               text-muted-foreground" ~text:desc []
        ; dom ~key:"adlg-f" ~tag:"div"
            ~style_class:
              "ui__alert-dialog-footer flex flex-col-reverse \
               sm:flex-row sm:justify-end sm:space-x-2"
            [ btn "adlg-cancel" I18n.cancel
                "inline-flex items-center justify-center rounded-md \
                 text-sm font-medium border px-4 py-2" close
            ; btn "adlg-confirm" I18n.confirm
                "inline-flex items-center justify-center rounded-md \
                 text-sm font-medium bg-primary text-primary-foreground \
                 px-4 py-2" (fun () ->
                  close ();
                  act ())
            ]
        ]
    ]

(* stop overlay clicks from leaking to the dialog handler *)
let dialog_view (m : Model.t) =
  match m.page_menu with
  | Some (x, y, with_app) -> view (x, y, with_app) m.route_page
  | None -> (
      match m.confirm with
      | Some c -> confirm_view c
      | None -> Logseq_dom.nothing)
