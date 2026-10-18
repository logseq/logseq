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

let separator key = Menu_item.separator ~key ~mv:4 ~mh:(-4)

(* items for the current route page; convert only for non-tag pages.
   Recycle navigates to the builtin "Recycle" page by name — cljs
   header.cljs shows it whenever the page identity resolves. *)
let page_items (p : Model.page) =
  (* cljs page_menu.cljs: delete hidden for contents page and
     :logseq.property/built-in? pages *)
  let del =
    if p.page_built_in then []
    else
      [ item "del" (I18n.t "page/delete") (fun () ->
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
    match !Sidebar_state.st_ref, p.page_uuid with
    | Some st, Some uuid ->
        [ Menu_item.el ~key:"fav"
            ~label:(reactive (fun favorites ->
                if List.exists (fun (page : Model.page) -> page.page_uuid=Some uuid) favorites
                then (I18n.t "page/unfavorite") else (I18n.t "page/add-to-favorites"))
              (Signal.value st.Sidebar_state.favorites))
            ~on_click:(fun () ->
              Runtime.send (Action.Page_menu_set None);
              Sidebar_state.toggle_favorite_uuid st uuid) () ]
    | _ -> []
  in
  let export_page =
    item "exp-page" (I18n.t "export/page") (fun () ->
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
    item "pub-page" (I18n.t "publish/dialog-title") (fun () ->
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
            [ item "cvt2p" (I18n.t "page.convert/tag-to-page-action") (fun () ->
                  Runtime.send
                    (Action.Confirm_set
                       (Some (Model.Confirm_convert_tag_to_page id)));
                  Runtime.flush ()) ]
        | None -> [])
    | false, true, _ -> (
        match p.page_db_id with
        | Some id ->
            [ item "cvt" (I18n.t "page/convert-to-tag") (fun () ->
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
  let maskedv = (Signal.value masked) in
  (* e2e requires div[role='menuitem'] — role/tabindex ride data_attrs;
     data-menu-tail keeps it out of the open-time initial highlight *)
  box ~key:"acct-user" ~style_class:"ui__dropdown-menu-item"
    ~data_attrs:
      [ ("style", "width:100%")
      ; ("role", "menuitem"); ("tabindex", "-1"); ("data-menu-tail", "") ]
    [ Ui_components.with_props
        [ Ui_components.Prop.position `relative ]
        (column ~key:"u-span"
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
                (Ui_components.button ~key:"u-eye" ~variant:`ghost ~size:`icon
                   ~style_class:"ui__button as-ghost"
                   ~icon:
                     (reactive
                        (fun m -> if m then `app "eye" else `app "eye-off")
                        maskedv)
                   ~on_press:(fun _ ->
                     Signal.set masked (not (Runtime.signal_get masked));
                     Runtime.flush ())
                   [])
            ]
        ; (* the opacity-0/group-hover reveal and absolute right-1 top-3
             positioning have no component equivalent — the logout
             button renders inline until an imperative pass restyles it *)
          Ui_components.button ~key:"u-logout" ~variant:`ghost ~size:`icon
            ~style_class:"ui__button as-ghost"
            ~label:(I18n.t "ui/logout") ~icon:(`app "logout")
            ~on_press:(fun _ ->
              Rtc_flows.sign_out ();
              Runtime.send (Action.Page_menu_set None);
              Runtime.flush ())
            []
        ])
    ]
    ctx parent

(* app-wide entries mirror the cljs header dots menu
   (components/header.cljs toolbar-dots-menu): dialogs dispatch
   ls:open-dialog, Recycle navigates to its page. Logged in: cljs drops
   the Login item and appends hr + the user block instead. *)
let global_items () =
  let close () = Runtime.send (Action.Page_menu_set None) in
  [ icon_item "settings" (I18n.t "nav/settings") "settings" (fun () ->
        close ();
        Sidebar_state.open_dialog "settings")
  ; icon_item "plugins" (I18n.t "nav/plugins") "apps" (fun () ->
        close ();
        Sidebar_state.open_dialog "plugins")
  ; icon_item "appearance" (I18n.t "nav/appearance") "color-swatch" (fun () ->
        Runtime.send (Action.Appearance_set true))
  ; icon_item "recycle" (I18n.t "storage.recycle/title") "trash" (fun () ->
        close ();
        Runtime.mark_nav ();
        Ui_services.nav_set_hash "#/page/Recycle")
  ; icon_item "export" (I18n.t "export/graph") "database-export" (fun () ->
        close ();
        Sidebar_state.open_dialog "export-graph")
  ; icon_item "import" (I18n.t "import/title") "file-upload" (fun () ->
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
    [ icon_item ~data_attrs:[ ("data-menu-tail", "") ] "login" (I18n.t "ui/login")
        "user" (fun () ->
          close ();
          Sidebar_state.open_dialog "login") ]

let view (ax, atop, abot, with_app_items) (p : Model.page option) =
  (* mel innerWidth/innerHeight — Ui_services.dom_viewport_* serves both
     hosts *)
  let inner_width = Ui_services.dom_viewport_width () in
  let inner_height = Ui_services.dom_viewport_height () in
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
     --lui-popup-available-height = viewport space below y *)
  Ui_components.menu_surface (popover ~key:"page-menu" ~at:(x, y)
    ~available_height:
      (if flip then atop -. 5. else inner_height -. y -. 5.)
    ~role:`menu ~width:(if with_app_items then 256 else 280)
    ~transition:Ui_components.popover_transition
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
     | None, _ -> global_items ()))

(* div[role='alertdialog'] — Confirm / Cancel *)
let confirm_view (c : Model.confirm) =
  let icon_opt, title, desc, desc_cls, act =
    match c with
    | Model.Confirm_delete_page (u, page_title, permanent) ->
        ( Some (Icons.icon ~size:18. "alert-triangle")
        , (if permanent then (I18n.t "page.delete/permanent-confirm-title")
           else (I18n.t "page.delete/confirm-title"))
        , "- " ^ page_title
        , "ls-confirm-desc"
        , fun () -> ignore (Page_ops.delete u) )
    | Model.Confirm_convert_tag_to_page id ->
        ( None
        , (I18n.t "page.convert/tag-to-page-action")
        , (I18n.t "page.convert/tag-to-page-confirm-desc")
        , "ls-confirm-desc"
        , fun () -> ignore (Page_ops.convert_tag_to_page id) )
    | Model.Confirm_delete_asset u ->
        ( None
        , (I18n.t "asset/confirm-delete-image")
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
  Ui_components.alert_dialog_overlay ~key:"alertdlg-overlay"
    [ (* e2e requires div[role='alertdialog'] *)
      Ui_components.alert_dialog_content ~key:"alertdlg"
        ~data_attrs:[ ("role", "alertdialog") ]
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
                     ~min_width:0 ~font_size:"1.125rem" ~font_weight:600
                     ~line_height:"1.75rem"
                     ~style_class:"ui__alert-dialog-title" ~value:title []
                 ]
           | None ->
               heading ~key:"adlg-t" ~level:2 ~as_:`H2
                 ~font_size:"1.125rem" ~font_weight:600 ~line_height:"1.75rem"
                 ~style_class:"ui__alert-dialog-title" ~value:title [])
        ; (* cljs dialog-confirm! sends the description as :content —
             it lands in div.ui__alert-dialog-main-content (a grid sibling
             of the header), not as ui__alert-dialog-description *)
          (if desc = "" then Logseq_el.nothing
           else
             Ui_components.alert_dialog_main_content ~key:"adlg-dw"
               [ text ~key:"adlg-d" ~style_class:desc_cls ~value:desc
                   ~font_size:"0.875rem"
                   ~foreground:"var(--ls-secondary-text-color, \
                      hsl(var(--muted-foreground)))" [] ])
        ; Ui_components.alert_dialog_footer ~key:"adlg-f"
            [ (* cljs dialog-confirm footer buttons are :size :sm *)
              Ui_components.button ~key:"adlg-cancel" ~variant:`outline ~size:`sm
                ~text:(I18n.t "ui/cancel") ~style_class:"ui__button"
                ~on_press:(fun _ -> close ()) []
            ; Ui_components.button ~key:"adlg-confirm" ~variant:`primary ~size:`sm
                ~text:(I18n.t "ui/confirm") ~style_class:"ui__button"
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
            ~transition:Ui_components.popover_transition
            ~on_dismiss:(fun _ -> Runtime.send (Action.Confirm_set None); Runtime.flush ())
            [ confirm_view c ]
      | None -> Logseq_el.nothing)
