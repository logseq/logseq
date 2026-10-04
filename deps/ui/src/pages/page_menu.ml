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
              match p.page_uuid with
              | Some u -> Sidebar_state.toggle_favorite_uuid st u
              | None -> Sidebar_state.toggle_favorite st) ]
    | None -> []
  in
  let export_page =
    item "exp-page" I18n.export_page (fun () ->
        Runtime.send (Action.Page_menu_set None);
        (match p.page_uuid with
         | Some u ->
             (* cljs export-blocks gets [page-uuid] as the selection —
                top-level-uuids is always non-empty, hiding the PNG tab *)
             Export_state.arm u p.page_db_id ~has_top_level:true
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

(* cljs util/email.cljs mask-email: '@' and '.' stay visible plus the
   first and last non-separator chars; the rest become '*' *)
let mask_email email =
  let n = String.length email in
  let sep c = c = '@' || c = '.' in
  let first = ref (-1) and last = ref (-1) in
  String.iteri
    (fun i c ->
      if not (sep c) then begin
        if !first < 0 then first := i;
        last := i
      end)
    email;
  String.init n (fun i ->
      let c = email.[i] in
      if sep c || i = !first || i = !last then c else '*')

let ghost_icon_btn_cls =
  "ui__button inline-flex cursor-pointer items-center justify-center \
   whitespace-nowrap rounded-md text-sm gap-1 font-medium \
   ring-offset-background transition-colors focus-visible:outline-none \
   focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 \
   disabled:pointer-events-none disabled:opacity-50 select-none \
   hover:bg-secondary/70 hover:text-secondary-foreground active:opacity-80 \
   as-ghost box-content overflow-hidden"

(* cljs header.cljs logged-in user block: separator + inert menuitem
   with username, masked email (eye toggle) and a hover-reveal logout
   ghost button (cljs prevents the menuitem's own select) *)
let user_item () : Lui_elements.t =
 fun ctx parent ->
  let username = Option.value (Rtc_flows.username ()) ~default:"" in
  let email = Option.value (Rtc_flows.email ()) ~default:"" in
  let masked = Signal.state ctx.Lui_ui.ui_scheduler true in
  dom ~key:"acct-user" ~style_class:"ui__dropdown-menu-item w-full"
    ~attrs:[ ("role", "menuitem"); ("tabindex", "-1") ]
    [ dom ~key:"u-span" ~tag:"span"
        ~style_class:"flex flex-col relative group pt-1 w-full"
        [ dom ~key:"u-name" ~tag:"b" ~style_class:"leading-none"
            ~text:username []
        ; dom ~key:"u-mail" ~tag:"small" ~style_class:"opacity-70"
            [ dom ~key:"u-addr" ~tag:"span"
                ~style_class:"ls-email-address inline-flex items-center"
                ~attrs_signal_v:
                  (Logseq_dom.reactive_attrs
                     (fun m -> [ ("data-masked", string_of_bool m) ])
                     (Signal.value masked))
                [ dom ~key:"u-addr-t" ~tag:"span"
                    ~text_signal:
                      (Logseq_dom.reactive_text
                         (fun m -> if m then mask_email email else email)
                         (Signal.value masked))
                    []
                ; Logseq_dom.dyn ~equal:( = )
                    (fun m ->
                      dom ~key:"u-eye" ~tag:"button"
                        ~style_class:
                          (ghost_icon_btn_cls
                          ^ " ml-1 inline-flex h-auto w-auto min-w-0 \
                             border-0 bg-transparent p-0 text-current \
                             opacity-70 hover:opacity-100")
                        ~attrs:
                          [ ("type", "button")
                          ; ( "aria-label"
                            , I18n.t
                                (if m then "account/show-email-address"
                                 else "account/hide-email-address") )
                          ]
                        ~events:"click"
                        ~on_dom_event:(fun n _ ->
                          if n = "click" then begin
                            Signal.set masked
                              (not (Signal.get_state masked));
                            Runtime.flush ()
                          end)
                        [ Icons.icon ~size:14. ~cls:""
                            (if m then "eye" else "eye-off") ])
                    (Signal.value masked)
                ]
            ]
        ; dom ~key:"u-logout" ~tag:"button"
            ~style_class:
              (ghost_icon_btn_cls
              ^ " absolute right-1 top-3 h-auto w-auto min-w-0 border-0 \
                 bg-transparent p-0 text-red-rx-09 opacity-0 \
                 group-hover:opacity-100")
            ~attrs:
              [ ("type", "button")
              ; ("aria-label", I18n.t "ui/logout")
              ]
            ~events:"click"
            ~on_dom_event:(fun n _ ->
              if n = "click" then begin
                Rtc_flows.sign_out ();
                Runtime.send (Action.Page_menu_set None);
                Runtime.flush ()
              end)
            [ Icons.icon ~size:18. ~cls:"" "logout" ]
        ]
    ]
    ctx parent

(* app-wide entries mirror the cljs header dots menu
   (components/header.cljs toolbar-dots-menu): dialogs dispatch
   ls:open-dialog, Recycle navigates to its page. Logged in: cljs drops
   the Login item and appends hr + the user block instead. *)
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
        match Web_dom.query_selector ".toolbar-dots-btn" with
        | Some el ->
            let r = Web_dom.el_bounding_rect el in
            Runtime.send
              (Action.Appearance_set
                 (Some (Web_dom.rect_right r, Web_dom.rect_bottom r +. 4.)))
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
  ]
  @
  if Rtc_flows.logged_in () then
    [ separator "acct-hr"; user_item () ]
  else
    [ icon_item "login" I18n.login "user" (fun () ->
          close ();
          Sidebar_state.open_dialog "login") ]

external inner_width : float = "innerWidth" [@@mel.scope "window"]

let view (x, y, with_app_items) (p : Model.page option) =
  let style =
    if with_app_items then
      (* toolbar dots menu: x is the trigger's right edge -> anchor
         the menu's right edge to it like the cljs dropdown *)
      Printf.sprintf
        "position:fixed;right:%.0fpx;top:%.0fpx;--available-height:\
         calc(100vh - %.0fpx)"
        (Float.max 8. (inner_width -. x))
        y (y +. 8.)
    else
      Printf.sprintf
        "position:fixed;left:%.0fpx;top:%.0fpx;--available-height:\
         calc(100vh - %.0fpx)"
        (* cljs anchors a 1px point at the click; the 280px
           ls-context-menu-content centers on it *)
        (Float.max 8. (Float.min (x -. 140.) (inner_width -. 288.)))
        y (y +. 8.)
  in
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
  dom ~key ~tag:"button" ~style_class:cls ~text:label ~events:"click"
    ~on_dom_event:(fun name _ -> if name = "click" then act ())
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
  dom ~key:"alertdlg-overlay" ~tag:"div"
    ~style_class:"ui__alert-dialog-overlay"
    ~events:"click"
    ~on_dom_event:(fun name payload ->
      (* only the backdrop itself dismisses — clicks inside the
         content bubble here but target the dialog *)
      if
        name = "click"
        && I18n.contains
             (Platform.payload_str payload "targetClass")
             "ui__alert-dialog-overlay"
      then close ())
    [ dom ~key:"alertdlg" ~tag:"div"
        ~attrs:[ ("role", "alertdialog") ]
        ~style_class:"ui__alert-dialog-content"
        [ dom ~key:"adlg-t" ~tag:"h2"
            ~style_class:"ui__alert-dialog-title"
            [ (match icon_opt with
               | Some i ->
                   (* cljs dialog-confirm title: flex gap-2 items-center
                      > icon + text *)
                   dom ~key:"adlg-tw" ~style_class:"ls-alert-title"
                     [ i; dom ~key:"adlg-tx" ~text:title [] ]
               | None -> dom ~key:"adlg-tx" ~text:title []) ]
        ; dom ~key:"adlg-d" ~tag:"div"
            ~style_class:desc_cls ~text:desc []
        ; dom ~key:"adlg-f" ~tag:"div"
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
  let by_uuid u (p : Model.page) = p.page_uuid = Some u in
  match uuid, m.route_page with
  | Some u, Some p when by_uuid u p -> m.route_page
  | Some u, _ -> List.find_opt (by_uuid u) m.journals
  | None, Some _ -> m.route_page
  | None, None ->
      List.find_opt
        (fun (p : Model.page) ->
          p.page_journal_day = Some (Dates.today_journal_day ()))
        m.journals

(* stop overlay clicks from leaking to the dialog handler *)
let dialog_view (m : Model.t) =
  match m.page_menu with
  | Some (x, y, with_app, uuid) ->
      view (x, y, with_app) (resolve_menu_page m uuid)
  | None -> (
      match m.confirm with
      | Some c -> confirm_view c
      | None -> Logseq_dom.nothing)
