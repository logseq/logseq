(* Page dropdown/context menu and the alertdialog confirm — hand-rolled
   Logseq_dom markup because e2e requires div[role='menuitem'] >
   div.text and div[role='alertdialog'], which LUI menu/dialog nodes do
   not emit. *)

let dom = Logseq_dom.dom

let string_contains s sub =
  let ls, lsub = (String.length s, String.length sub) in
  let rec go i =
    i + lsub <= ls && (String.sub s i lsub = sub || go (i + 1))
  in
  go 0

let item_class =
  "ui__dropdown-menu-item relative flex cursor-pointer select-none \
   items-center rounded-sm px-2 py-1.5 text-sm outline-none"

let item key label on_click =
  dom ~key ~style_class:item_class
    ~attrs:[ ("role", "menuitem"); ("tabindex", "-1") ]
    ~events:"click"
    ~on_dom_event:(fun name _ ->
      if name = "click" then on_click ())
    [ dom ~key:(key ^ "-l") ~text:label [] ]

(* cljs dropdown-menu-item renders its :icon before the title *)
let icon_item key label icon_name on_click =
  dom ~key ~style_class:item_class
    ~attrs:[ ("role", "menuitem"); ("tabindex", "-1") ]
    ~events:"click"
    ~on_dom_event:(fun name _ ->
      if name = "click" then on_click ())
    [ Icons.icon ~size:15. ~cls:"mr-2" icon_name
    ; dom ~key:(key ^ "-l") ~text:label [] ]

let separator key =
  dom ~key ~attrs:[ ("role", "separator") ]
    ~style_class:"ui__dropdown-menu-separator -mx-1 my-1 h-px bg-muted" []

(* items for the current route page; convert only for non-tag pages.
   Recycle navigates to the builtin "Recycle" page by name — cljs
   header.cljs shows it whenever the page identity resolves. *)
let page_items (p : Model.page) =
  (* cljs page_menu.cljs: delete hidden for contents page and
     :logseq.property/built-in? pages *)
  let del =
    if p.page_built_in then []
    else
      [ item "del" Strings.delete_page (fun () ->
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
            Strings.unfavorite_page
          else Strings.add_to_favorites
        in
        [ item "fav" label (fun () ->
              Runtime.send (Action.Page_menu_set None);
              Sidebar_state.toggle_favorite st) ]
    | None -> []
  in
  let export_page =
    item "exp-page" Strings.export_page (fun () ->
        Runtime.send (Action.Page_menu_set None);
        (match p.page_uuid with
         | Some u -> Export_state.arm u p.page_db_id
         | None -> ());
        Sidebar_state.open_dialog "export-page")
  in
  let publish_page =
    item "pub-page" Strings.publish_page (fun () ->
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
            [ item "cvt2p" Strings.convert_tag_to_page (fun () ->
                  Runtime.send
                    (Action.Confirm_set
                       (Some (Model.Confirm_convert_tag_to_page id)));
                  Runtime.flush ()) ]
        | None -> [])
    | false, true, _ -> (
        match p.page_db_id with
        | Some id ->
            [ item "cvt" Strings.convert_to_tag (fun () ->
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
  [ icon_item "settings" Strings.settings "settings" (fun () ->
        close ();
        Sidebar_state.open_dialog "settings")
  ; icon_item "plugins" Strings.plugins "apps" (fun () ->
        close ();
        Sidebar_state.open_dialog "plugins")
  ; icon_item "appearance" Strings.appearance "color-swatch" (fun () ->
        close ();
        Sidebar_state.open_dialog "settings")
  ; icon_item "recycle" Strings.recycle "trash" (fun () ->
        close ();
        Runtime.mark_nav ();
        Platform.set_location_hash "#/page/Recycle")
  ; icon_item "export" Strings.export_graph "database-export" (fun () ->
        close ();
        Sidebar_state.open_dialog "export-graph")
  ; icon_item "import" Strings.import_ "file-upload" (fun () ->
        close ();
        Platform.set_location_hash "#/import")
  ; icon_item "login" Strings.login "user" (fun () ->
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
        ( Strings.delete_page_title
        , Strings.delete_page_desc
        , fun () -> ignore (Page_ops.delete u) )
    | Model.Confirm_convert_tag_to_page id ->
        ( Strings.convert_tag_to_page
        , Strings.convert_tag_to_page_desc
        , fun () -> ignore (Page_ops.convert_tag_to_page id) )
    | Model.Confirm_delete_asset u ->
        ( Strings.asset_confirm_delete
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
               string_contains
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
            [ btn "adlg-cancel" Strings.cancel
                "inline-flex items-center justify-center rounded-md \
                 text-sm font-medium border px-4 py-2" close
            ; btn "adlg-confirm" Strings.confirm
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
      | None -> dom ~key:"menu-none" [])
