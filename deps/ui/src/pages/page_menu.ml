(* Page dropdown/context menu and the alertdialog confirm — hand-rolled
   Logseq_el markup because e2e requires div[role='menuitem'] >
   div.text and div[role='alertdialog'], which LUI menu/dialog nodes do
   not emit. *)

open Lui_elements




let item key label on_click = Menu_item.el ~key ~label ~on_click ()

(* cljs dropdown-menu-item renders its :icon before the title *)
let icon_item ?(data_attrs = []) key label icon_name on_click =
  Menu_item.el ~key ~label ~data_attrs
    ~icon:(Icons.name_ref icon_name)
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
          if Runtime.signal_get st.Sidebar_state.favorited then
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
      Ui_services.storage_get "developer-mode"
    with
    | Some "true" | Some "\"true\"" ->
        [ item "dev-page-data" "(Dev) Show page data" (fun () ->
              Runtime.send (Action.Page_menu_set None)) ]
    | _ -> []
  in
  let plugin_items =
    (* cljs page-menu-item simple commands append after the builtin
       entries; ctx carries the clicked page name *)
    List.map
      (fun (pid, key, label) ->
        item ("plugin-" ^ pid ^ "-" ^ key) label (fun () ->
            Runtime.send (Action.Page_menu_set None);
            Plugin_host.exec_simple_command
              ~ctx:
                (Js.Dict.fromList
                   [ ("page", Js.Json.string p.Model.page_title) ])
              pid key))
      (Plugin_host.simple_commands_of_type "page-menu-item")
  in
  fav @ del @ [ export_page; publish_page ] @ convert @ dev
  @ plugin_items

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


(* cljs header.cljs logged-in user block: separator + inert menuitem
   with username, masked email (eye toggle) and a hover-reveal logout
   ghost button (cljs prevents the menuitem's own select) *)
let user_item () : Lui_elements.t =
 fun ctx parent ->
  let username = Option.value (Rtc_flows.username ()) ~default:"" in
  let email = Option.value (Rtc_flows.email ()) ~default:"" in
  let masked = Signal.state ctx.Lui_ui.ui_scheduler true in
  let maskedv = Signal.value masked in
  (* e2e requires div[role='menuitem'] — role/tabindex ride data_attrs;
     data-menu-tail keeps it out of the open-time initial highlight *)
  box ~key:"acct-user" ~style_class:"ui__dropdown-menu-item w-full"
    ~data_attrs:
      [ ("role", "menuitem"); ("tabindex", "-1"); ("data-menu-tail", "") ]
    [ column ~key:"u-span" ~style_class:"relative"
        [ text ~key:"u-name" ~value:username []
        ; row ~key:"u-mail" ~cross:`center
            [ text ~key:"u-addr-t"
                ~value_signal:
                  (Signal.map
                     (fun m -> if m then mask_email email else email)
                     maskedv)
                []
            ; Ui_parts.prop_signal Lui_protocol.AccessibilityLabel maskedv
                (fun m ->
                  I18n.t
                    (if m then "account/show-email-address"
                     else "account/hide-email-address"))
                (button ~key:"u-eye" ~variant:`ghost ~size:`icon
                   ~style_class:"ui__button as-ghost"
                   ~icon:
                     (reactive
                        (fun m -> if m then `eye else `app "eye-off")
                        maskedv)
                   ~on_press:(fun _ ->
                     Signal.set masked (not (Runtime.signal_get masked));
                     Runtime.flush ())
                   [])
            ]
        ; (* the opacity-0/group-hover reveal and absolute right-1 top-3
             positioning have no component equivalent — the logout
             button renders inline until an imperative pass restyles it *)
          button ~key:"u-logout" ~variant:`ghost ~size:`icon
            ~style_class:"ui__button as-ghost"
            ~label:(I18n.t "ui/logout") ~icon:(`app "logout")
            ~on_press:(fun _ ->
              Rtc_flows.sign_out ();
              Runtime.send (Action.Page_menu_set None);
              Runtime.flush ())
            []
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
                 (Some (Web_dom.rect_right r, Web_dom.rect_bottom r)))
        | None -> ())
  ; icon_item "recycle" I18n.recycle "trash" (fun () ->
        close ();
        Runtime.mark_nav ();
        Ui_services.nav_set_hash "#/page/Recycle")
  ; icon_item "export" I18n.export_graph "database-export" (fun () ->
        close ();
        Sidebar_state.open_dialog "export-graph")
  ; icon_item "import" I18n.import_ "file-upload" (fun () ->
        close ();
        Ui_services.nav_set_hash "#/import")
  ]
  @
  if Rtc_flows.logged_in () then
    [ separator "acct-hr"; user_item () ]
  else
    (* cljs mounts the session tail after the menu's nav list syncs, so
       base-ui's initial focus lands on the last item before it (Import);
       data-menu-tail excludes it from the initial highlight only —
       ArrowDown still reaches it *)
    [ icon_item ~data_attrs:[ ("data-menu-tail", "") ] "login" I18n.login
        "user" (fun () ->
          close ();
          Sidebar_state.open_dialog "login") ]

external inner_width : float = "innerWidth" [@@mel.scope "window"]
external inner_height : float = "innerHeight" [@@mel.scope "window"]

let view (ax, atop, abot, with_app_items) (p : Model.page option) =
  (* cljs popup-show!: pointer menus anchor to the event target
     element — ls-anchor-cx centers the positioner on ax and
     ls-anchor-top lifts it by its own height when it flips above *)
  let flip =
    (not with_app_items) && Popups_state.anchor_above atop abot
  in
  let x =
    if with_app_items then
      (* toolbar dots menu is 16rem wide (cljs header.cljs); ax is the
         desired menu right edge -> clamp it 5px inside the viewport
         like the cljs popover. The cljs menu renders its right edge
         ~1px right of the computed anchor (measured +33 inset offset),
         so -255 reproduces the observed position *)
      Float.min ax (inner_width -. 5.) -. 255.
    else
      (* the 280px ls-context-menu-content centers on the anchor *)
      Float.max 148.
        (Float.min ax (inner_width -. 148.))
  in
  let y = if flip then atop else abot in
  (* popover ~at is the same point placement the inline left/top carried;
     --available-height = viewport space below y *)
  popover ~key:"page-menu" ~at:(x, y)
    ~available_height:
      (if flip then atop -. 5. else inner_height -. y -. 5.)
    ~role:`menu
    ~on_dismiss:(fun _ -> Runtime.send (Action.Page_menu_set None))
    ~style_class:
      (if with_app_items then "ui__dropdown-menu-content ls-dots-menu"
       else
         "ui__dropdown-menu-content ls-context-menu-content \
          ls-anchor-cx"
         ^ if flip then " ls-anchor-top" else "")
    (* cljs header.cljs toolbar-dots-menu = page items + hr + app
       items; a page right-click shows page items only *)
    (match p, with_app_items with
     | Some p, true ->
         page_items p @ [ separator "pg-app" ] @ global_items ()
     | Some p, false -> page_items p
     | None, _ -> global_items ())

(* div[role='alertdialog'] — Confirm / Cancel *)
let confirm_view (c : Model.confirm) =
  let icon_opt, title, desc, desc_cls, act =
    match c with
    | Model.Confirm_delete_page (u, page_title, permanent) ->
        ( Some (Icons.icon ~size:18. "alert-triangle")
        , (if permanent then I18n.delete_page_permanent_desc
           else I18n.delete_page_desc)
        , "- " ^ page_title
        , "ls-confirm-desc"
        , fun () -> ignore (Page_ops.delete u) )
    | Model.Confirm_convert_tag_to_page id ->
        ( None
        , I18n.convert_tag_to_page
        , I18n.convert_tag_to_page_desc
        , "ls-confirm-desc"
        , fun () -> ignore (Page_ops.convert_tag_to_page id) )
    | Model.Confirm_delete_asset u ->
        ( None
        , I18n.asset_confirm_delete
        , ""
        , "ls-confirm-desc"
        , fun () -> Asset_dom.delete_asset u )
  in
  let close () =
    Runtime.send (Action.Confirm_set None);
    Runtime.flush ()
  in
  (* cljs dialog-confirm! mounts a Radix AlertDialog — outside presses
     do NOT dismiss; only Escape and the footer buttons close it.
     ~grow/~main/~cross fill + center inside the native cover layer
     (web places the same scrim with position:fixed) *)
  column ~key:"alertdlg-overlay"
    ~style_class:"ui__alert-dialog-overlay"
    ~grow:1. ~main:`center ~cross:`center
    [ (* e2e requires div[role='alertdialog'] *)
      box ~key:"alertdlg"
        ~data_attrs:[ ("role", "alertdialog") ]
        ~style_class:"ui__alert-dialog-content"
        [ (* cljs dialog-confirm title: flex gap-2 items-center > icon +
             text; the heading kind is a leaf, so the row carries the
             pair and ~as_ keeps the h2 tag *)
          (match icon_opt with
           | Some i ->
               row ~key:"adlg-tw" ~gap:8 ~cross:`center
                 ~style_class:"ls-alert-title"
                 [ i
                 ; (* grow + min_width:0 so a long title shrinks inside
                      the row and wraps instead of overflowing the
                      dialog's overflow:hidden edge (taffy does not
                      model text min-content shrink) *)
                   heading ~key:"adlg-t" ~level:2 ~as_:`H2 ~grow:1.
                     ~min_width:0
                     ~style_class:"ui__alert-dialog-title" ~value:title []
                 ]
           | None ->
               heading ~key:"adlg-t" ~level:2 ~as_:`H2
                 ~style_class:"ui__alert-dialog-title" ~value:title [])
        ; (* cljs dialog-confirm! sends the description as :content —
             it lands in div.ui__alert-dialog-main-content (a grid sibling
             of the header), not as ui__alert-dialog-description *)
          (if desc = "" then Logseq_el.nothing
           else
             box ~key:"adlg-dw"
               ~style_class:"ui__alert-dialog-main-content"
               [ text ~key:"adlg-d" ~style_class:desc_cls ~value:desc [] ])
        ; row ~key:"adlg-f" ~style_class:"ui__alert-dialog-footer"
            [ (* cljs dialog-confirm footer buttons are :size :sm *)
              button ~key:"adlg-cancel" ~variant:`outline ~size:`sm
                ~text:I18n.cancel ~style_class:"ui__button"
                ~on_press:(fun _ -> close ()) []
            ; button ~key:"adlg-confirm" ~variant:`primary ~size:`sm
                ~text:I18n.confirm ~style_class:"ui__button"
                ~on_press:(fun _ ->
                  close ();
                  act ())
                []
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
  | Some (ax, atop, abot, with_app, uuid) ->
      view (ax, atop, abot, with_app) (resolve_menu_page m uuid)
  | None -> (
      match m.confirm with
      | Some c ->
          popover ~key:"page-confirm-layer" ~style_class:"ls-dialog-layer"
            ~on_dismiss:(fun _ -> Runtime.send (Action.Confirm_set None); Runtime.flush ())
            [ confirm_view c ]
      | None -> Logseq_el.nothing)
