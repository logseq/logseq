(* Plugins dialog body: .cp__plugins-page.web-platform with Installed
   and Marketplace tabs. Mirrors components/plugins.cljs: .tabs >
   .tabs-inner buttons, .control-tabs with .secondary-tabs.categories
   (Plugins/Themes) + .search-ctls input, marketplace
   .cp__plugins-marketplace-cnt > .cp__plugins-item-lists >
   .cp__plugins-item-lists-inner > .cp__plugins-item-card.market cards
   and installed .cp__plugins-installed cards with a
   button[role='switch'] enable toggle. *)

open Promise_ext
open Lui_elements

let t = I18n.t

(* cljs marketplace search: fuzzy title match + description substring;
   substring on title/name/description covers the e2e queries *)
let matches search pkg =
  if String.starts_with ~prefix:"@" search then
    Plugin_host.jstr pkg "author" = String.sub search 1 (String.length search - 1)
  else search = ""
  || I18n.contains_ci (Plugin_host.jstr pkg "title") search
  || I18n.contains_ci (Plugin_host.jstr pkg "description") search
  || I18n.contains_ci (Plugin_host.jstr pkg "name") search

let category_ok cat pkg =
  match cat with
  | "themes" -> Plugin_host.jbool pkg "theme"
  | _ -> not (Plugin_host.jbool pkg "theme")

let search_input ~key st : t = fun ctx parent ->
  let focused = Signal.state ctx.Lui_ui.ui_scheduler false in
  (Ui_components.search_row ~key ~height:30 ~pad_left:29
    ~background:"var(--ls-primary-background-color)"
    ~focus_background:"var(--ls-secondary-background-color)"
    ~on_focus_within:(Runtime.signal_set focused)
    ~input_opacity_signal:(reactive (fun focused -> if focused then 1. else 0.7) (Signal.value focused))
    ~autofocus:true ~clear_label:(t "ui/close")
    ~placeholder:(t "plugin/search-plugin")
    ~text_signal:(Signal.value st)
    ~on_text:(fun q -> Runtime.signal_set st q) ()) ctx parent

(* cljs plugins.cljs category-tabs: "Plugins (n)" / "Themes (n)" —
   counts render only on the installed tab (marketplace passes nil).
   chip_toggle carries the .secondary-tabs button visual. *)
let category_tab ~key cat_st id caption n =
  let text =
    match n with
    | Some n -> Printf.sprintf "%s (%d)" caption n
    | None -> caption
  in
  reactive (fun category ->
    let selected = category = id in
    toggle_button ~key:(key ^ "-" ^ id) ~variant:`ghost ~text
      ~icon:(`app (if id = "plugins" then "puzzle" else "palette"))
      ~checked:selected ~height:28 ~min_height:0 ~padding_horizontal:8
      ~corner_radius:6 ~border_width:1 ~background:"transparent"
      ~border_color:(if selected then "var(--ls-link-text-color)" else "currentColor")
      ~foreground:(if selected then "var(--ls-link-text-color)" else "inherit")
      ~on_toggle:(fun _ -> Runtime.signal_set cat_st id) [])
    (Signal.value cat_st)

let category_tabs ~key ~nums cat_st =
  let np = Option.map fst nums in
  let nt = Option.map snd nums in
  toggle_group ~key:(key ^ "-cats") ~gap:4 ~style_class:"secondary-tabs"
    [ category_tab ~key cat_st "plugins" (t "nav/plugins") np
    ; category_tab ~key cat_st "themes" (t "nav/themes") nt
    ]

let toolbar_menu ~picked ~key ~icon ~label ~items : t =
 fun ctx parent ->
  let opened = Signal.state ctx.ui_scheduler false in
  let close () = Runtime.signal_set opened false in
  row ~key
    [ Ui_components.with_props [Ui_components.Prop.position `relative]
      (Ui_components.icon_button ~key:"trigger" ~variant:`ghost ~size:`icon
        ~width:30 ~height:28 ~min_width:30 ~min_height:28
        ~icon:(`app icon) ~label
        ~on_press:(fun _ -> Runtime.signal_set opened (not (Runtime.signal_get opened)))
        (if not picked then [] else
          [Ui_components.with_props [Ui_components.Prop.position `absolute;
             Ui_components.Prop.inset_top (-2.); Ui_components.Prop.inset_right 4.;
             Ui_components.Prop.pointer_enabled false]
            (box ~width:4 ~height:4 ~corner_radius:2 ~background:"red"
               ~data_attrs:["data-plugin-option-active", ""] [])]))
    ; if_ ~test:(Signal.value opened)
        (Ui_components.menu_card ~key:"menu" ~anchor:`below ~anchor_alignment:`end_
           ~on_dismiss:(fun _ -> close ())
           (List.mapi (fun i (label, icon, checked, run) ->
              Menu_item.dropdown_el ~key:(string_of_int i) ~label ~icon:(`app icon)
                ?checked ~on_click:(fun () -> close (); run ()) ()) items))
    ] ctx parent

let contribution : t = fun ctx parent ->
  let width = Ui_services.viewport_width_signal ~scheduler:ctx.Lui_ui.ui_scheduler
    ~scope:ctx.ui_scope in
  (Ui_parts.string_prop Lui_protocol.DisplayValue
    ~value:(reactive (fun width -> if width >= 640. then "inline-flex" else "none") width)
    (Ui_components.with_props [Ui_components.Prop.position `absolute;
      Ui_components.Prop.inset_top (-39.5); Ui_components.Prop.inset_right 8.;
      Ui_components.Prop.font_size "0.75rem"; Ui_components.Prop.font_weight 500;
      Ui_components.Prop.line_height "16px"; Ui_components.Prop.opacity 0.6]
      (row ~key:"contribution" ~height:28 ~padding_horizontal:12 ~padding_vertical:4 ~cross:`center
       [link ~key:"contribute" ~url:"https://github.com/logseq/marketplace" ~target:`blank
        ~height:15 ~padding:0
        ~foreground:"var(--lx-gray-12, var(--rx-gray-12))"
        ~text:(t "plugin/contribute") []]))) ctx parent

let control_tabs ~key ~search_st ~cat_st ~nums toolbar =
  Ui_components.with_props [Ui_components.Prop.padding_bottom 12; Ui_components.Prop.position `relative]
    (row ~key:(key ^ "-ctls") ~style_class:"control-tabs" ~padding_horizontal:6
    ~main:`space_between ~cross:`center
    [ category_tabs ~key ~nums cat_st
    ; row ~key:(key ^ "-r") ~cross:`center
        (box ~width:204 ~margin_horizontal:13 ~margin_vertical:3
           [search_input ~key:(key ^ "-search") search_st] :: toolbar)
    ; contribution
    ])

let options_menu ~key ~icon ~label ~state options =
  reactive (fun current ->
    let items = List.map (fun (value, label) ->
      (label, (if current = value then "check" else "circle"), None,
       fun () -> Runtime.signal_set state value)) options in
    let picked = match options with (first, _) :: _ -> current <> first | [] -> false in
    toolbar_menu ~picked ~key ~icon ~label ~items) (Signal.value state)

let report_plugin = ref None

let open_report plugin =
  report_plugin := plugin;
  Dialogs_state.open_ "plugin-report"

let report_body (_ms : Model.t Signal.signal) =
  let address = "support@logseq.com" in
  let subject = "Report plugin from Logseq Marketplace" ^
    (match !report_plugin with Some (id, _) -> " (#" ^ id ^ ")" | None -> "") in
  let url = "mailto:" ^ address ^ "?subject=" ^ Ui_services.uri_encode_component subject in
  let message =
    match String.split_on_char '\001' (I18n.tf "plugin/report-modal-desc" ["\001"]) with
    | [before; after] ->
        paragraph
          [text ~value:before [];
           link ~url ~text:address ~foreground:"var(--ls-link-text-color)" [];
           text ~value:after []]
    | _ -> paragraph ~value:(I18n.tf "plugin/report-modal-desc" [address]) []
  in
  let header =
    match !report_plugin with
    | None -> []
    | Some (id, name) ->
        [row ~gap:4 ~cross:`center
           [icon ~name:(`app "alert-triangle") ~foreground:"var(--lx-red-11)" [];
            text ~font_weight:700 ~value:(name ^ "  #" ^ id) []]]
  in
  column ~padding:4 ~gap:8 (header @ [message])

let logs_plugin = ref None

let open_logs ~id ~name =
  logs_plugin := Some (id, name);
  Dialogs_state.open_ "plugin-logs"

let logs_body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  match !logs_plugin with
  | None -> box [] ctx parent
  | Some (id, name) ->
      let log = Signal.state ctx.ui_scheduler (Plugin_host.plugin_logs id) in
      let query = Signal.state ctx.ui_scheduler "" in
      let level = Signal.state ctx.ui_scheduler None in
      Plugin_host.watch_plugin_logs ~scope:ctx.ui_scope id (fun () ->
        Runtime.signal_set log (Plugin_host.plugin_logs id));
      let format_line entry =
        let open Plugin_host in
        let timestamp = Option.value ~default:0. (Js.Json.decodeNumber (getf entry "ts")) in
        let time = Ui_services.time_local_fields timestamp in
        Printf.sprintf "[%02d:%02d:%02d] %s [%s] %s"
          time.hours time.minutes time.seconds
          (jstr entry "level") (jstr entry "tag") (jstr entry "message") in
      column ~gap:12
        [ heading ~level:`h1 ~font_size:"1.125rem" ~font_weight:600
            ~value:(t "plugin/logs-title" ^ " · " ^ name) []
        ; row ~gap:8 ~cross:`center
            [ box ~grow:1. [Ui_components.search_row ~key:"filter" ~height:32
                ~placeholder:(t "plugin/logs-filter-placeholder")
                ~text_signal:(Signal.value query)
                ~on_text:(Runtime.signal_set query) ()]
            ; options_menu ~key:"levels" ~icon:"filter" ~label:(t "plugin/logs-level-all")
                ~state:level ((None, t "plugin/logs-level-all") ::
                  List.map (fun s -> Some s, s) ["DEBUG"; "INFO"; "WARN"; "ERROR"])
            ; Ui_components.button ~variant:`outline ~size:`sm ~text:(t "plugin/logs-copy")
                ~on_press:(fun _ ->
                  Ui_services.clipboard_copy
                    (String.concat "\n" (List.map format_line (Runtime.signal_get log)));
                  Toast.success (t "plugin/logs-copied")) []
            ; Ui_components.button ~variant:`outline ~size:`sm ~text:(t "plugin/logs-clear")
                ~on_press:(fun _ -> Plugin_host.clear_plugin_logs id) []
            ]
        ; scroll ~max_height:480 ~orientation:`vertical
            [ reactive (fun entries query level ->
                let filtered = List.filter (fun e ->
                    (level = None || level = Some (Plugin_host.jstr e "level")) &&
                    I18n.contains_ci (Plugin_host.jstr e "message") query)
                    (List.rev entries) in
                text ~white_space:`pre_wrap ~font_size:"0.75rem"
                  ~value:(if filtered = [] then t "plugin/logs-empty"
                          else String.concat "\n" (List.map format_line filtered)) [])
                (Signal.value log) (Signal.value query) (Signal.value level) ]
        ] ctx parent

let empty_item key =
  column ~key ~style_class:"ls-pl-empty" ~cross:`center ~gap:8
    ~padding_vertical:112 ~opacity:0.3
    [ icon ~name:(`app "list-search") ~width:40 ~height:40 []
    ; text ~key:(key ^ "-t") ~style_class:"ls-pl-empty-text"
        ~font_size:"0.875rem" ~value:(t "plugin/empty") []
    ]

let list_wrap ?(show_empty = true) ?padding_top ~key children : t =
 fun ctx parent ->
  let width = Ui_services.viewport_width_signal
    ~scheduler:ctx.Lui_ui.ui_scheduler ~scope:ctx.ui_scope in
  let height = Ui_services.viewport_height_signal
    ~scheduler:ctx.ui_scheduler ~scope:ctx.ui_scope in
  Ui_components.with_props
    ([ Ui_components.Prop.max_height_viewport 0.8
     ; Ui_components.Prop.overflow `auto ]
     @ Option.to_list (Option.map Ui_components.Prop.padding_top padding_top))
    (Ui_parts.int_prop Lui_protocol.HeightValue
      ~value:(reactive (fun h -> max 0 (int_of_float h - 320)) height)
    (column ~key ~style_class:"cp__plugins-item-lists"
       (if children = [] && show_empty then [ empty_item (key ^ "-empty") ]
        else
          [ (* cljs .cp__plugins-item-lists-inner is a wrapping card grid —
               the grid kind's fixed columns give equal-width cells *)
            Ui_parts.int_prop Lui_protocol.GridColumns
              ~value:(reactive (fun w -> if w >= 1024. then 3
                else if w >= 768. then 2 else 1) width)
              (grid ~key:(key ^ "-in")
                ~style_class:"cp__plugins-item-lists-inner" ~columns:1
                ~padding_horizontal:4 ~gap:12 children) ]))) ctx parent

(* ---------- marketplace card ---------- *)

let format_number n =
  if n < 1000 then string_of_int n
  else Printf.sprintf "%.2fk" (float_of_int n /. 1000.)

let market_card ~stats ~search_st pkg =
  let open Plugin_host in
  let id = jstr pkg "id" in
  let installed_ = Js.Dict.get installed id <> None in
  let title = jstr pkg "title" in
  let cls =
    " market" ^ if installed_ then " installed" else ""
  in
  (* cljs get-open-plugin-readme-handler: icon .l and h3 .l both open
     the readme dialog *)
  let open_readme _ = Plugin_readme.open_readme pkg in
  let icon_url = pkg_asset id (jstr pkg "icon") in
  let thumb =
    if icon_url = "" then icon ~key:"ic-f" ~name:(`app "folder")
      ~width:60 ~height:60 ~point_size:60 []
    else Ui_components.with_props [Ui_components.Prop.image_fit `fit]
        (image ~key:"ic-img" ~url:icon_url ~width:60 ~height:60
           ~alt:"" ~loading:`lazy_ []) in
  let repo = jstr pkg "repo" in
  Ui_components.with_props [Ui_components.Prop.overflow `hidden]
    (card ~key:("mkt-" ^ id) ~style_class:("cp__plugins-item-card" ^ cls)
       ~height:150 ~min_width:0 ~border_width:0 ~corner_radius:6
       ~padding_vertical:12 ~padding_horizontal:4
       ~foreground:"var(--ls-primary-text-color, var(--lx-gray-12))"
       ~background:"var(--ls-tertiary-background-color, hsl(var(--muted)))"
    [Ui_components.with_props [Ui_components.Prop.position `relative]
      (column ~cross:`stretch ~height:126
    [row ~key:"r" ~gap:0 ~cross:`start
    [ Ui_parts.pressable ~on_press:open_readme
        (Ui_components.with_props
           [ Ui_components.Prop.cursor `pointer ]
           (box ~key:"l" ~style_class:"l link-block"
              [ row ~key:"ic" ~style_class:"plugin-icon" ~width:76
                  ~height:76 ~opacity:0.8 ~main:`center ~cross:`center
                  [ thumb ] ]))
    ; Ui_components.with_props [Ui_components.Prop.position `relative]
      (column ~key:"r" ~style_class:"r" ~grow:1. ~min_width:0 ~height:126
        [ Ui_components.with_props [Ui_components.Prop.padding_right 24]
          (row ~key:"h" ~cross:`center ~margin_top:6 ~max_height:50
             ~main:`space_between
             [ text ~key:"t" ~style_class:"link-block" ~grow:1. ~min_width:0
                 ~font_size:"1.25rem" ~font_weight:700 ~line_height:"24px"
                 ~white_space:`nowrap ~text_overflow:`ellipsis ~overflow:`hidden
                 ~value:(if title = "" then jstr pkg "name" else title)
                 ~on_press:open_readme []
             ])
         ; Ui_components.with_props
             [ Ui_components.Prop.position `absolute
             ; Ui_components.Prop.inset_top 4.
             ; Ui_components.Prop.inset_right 2. ]
             (row ~key:"flag" ~cross:`center ~gap:8
                 ((match Js.Json.decodeBoolean (getf pkg "supportsDB") with
                   | Some supported ->
                       [ icon ~name:(`app (if supported then "database-heart" else "database-off"))
                           ~point_size:17
                           ~tooltip:(t (if supported then "plugin/supports-db" else "plugin/does-not-support-db"))
                           ~foreground:"var(--lx-gray-11)" [] ]
                   | None -> [])
                  @
                  (if repo = "" then []
                   else
                     [ link ~key:"gh-a" ~url:(gh_repo_url repo)
                         ~target:`blank ~icon:(`app "github-mark")
                         ~foreground:"var(--lx-gray-11)" ~label:"GitHub" [] ])))
         ; Ui_components.with_props
             [ Ui_components.Prop.opacity 0.7 ]
             (box ~key:"desc" ~height:60 ~padding_vertical:4
               [ text ~line_clamp:2 ~overflow:`hidden ~text_overflow:`ellipsis
                ~font_size:"0.75rem" ~line_height:"16px"
                ~value:(jstr pkg "description") [] ])
         ; Ui_components.with_props
             [ Ui_components.Prop.position `absolute
             ; Ui_components.Prop.inset_bottom 16.
             ; Ui_components.Prop.inset_left 0.
             ; Ui_components.Prop.inset_right 0.
             ; Ui_components.Prop.padding_right 8 ]
           (box ~key:"flag-meta" ~padding_vertical:4
             [ Ui_components.with_props
                 [ Ui_components.Prop.font_size "0.625rem"; Ui_components.Prop.opacity 0.8 ]
                 (row ~style_class:"ls-pl-meta"
                    ~main:`space_between
                    [ (* cljs: clicking the author searches "@author" *)
                      text ~key:"a" ~value:(jstr pkg "author")
                        ~on_press:(fun _ ->
                          Runtime.signal_set search_st
                            ("@" ^ jstr pkg "author"))
                        []
                    ; text ~key:"i" ~value:("ID: " ^ id) [] ]) ]) ]) ]
    ; Ui_components.with_props
        [ Ui_components.Prop.position `absolute
        ; Ui_components.Prop.inset_bottom (-5.)
        ; Ui_components.Prop.inset_left (-7.)
        ; Ui_components.Prop.padding_left 18
        ; Ui_components.Prop.inset_right 7. ]
      (row ~key:"ctl" ~main:`space_between
             ~cross:`center
             [ Ui_components.with_props [ Ui_components.Prop.font_size "0.875rem" ]
               (row ~key:"ctl-l" ~style_class:"l" ~cross:`center
                 ((* cljs card-ctls-of-market .l: stars + total downloads
                     from stats.json; each li is pr-3 with a 16px icon *)
                  match package_stat stats id with
                  | None -> []
                  | Some st ->
                      Ui_components.with_props [ Ui_components.Prop.padding_right 12 ]
                        (row ~key:"stars" ~cross:`center ~gap:4
                           [ icon ~name:(`app "star") ~point_size:16 []
                           ; text ~key:"n" ~value:(string_of_int st.stars)
                               [] ])
                      ::
                      (if st.downloads > 0 then
                         [ Ui_components.with_props [ Ui_components.Prop.padding_right 12 ]
                             (row ~key:"dls" ~cross:`center ~gap:4
                                [ icon ~name:(`app "cloud-down") ~point_size:16 []
                                ; text ~key:"n"
                                    ~value:(format_number st.downloads) [] ])
                         ]
                       else [])))
             ; row ~key:"ctl-r" ~style_class:"r" ~cross:`center ~gap:4
                 [ Ui_components.with_props
                     [Ui_components.Prop.font_size "0.8125rem";
                      Ui_components.Prop.font_weight 400;
                      Ui_components.Prop.line_height "1";
                      Ui_components.Prop.hover_opacity 0.8]
                    (Ui_components.button ~variant:`ghost ~key:"btn"
                     ~height:21 ~min_height:0 ~padding_horizontal:4 ~padding_vertical:4
                     ~foreground:"var(--ls-link-text-color, var(--lx-accent-11))"
                     ~style_class:
                       ("btn" ^ if installed_ then " disabled" else "")
                     (* cljs CSS gives a.btn.disabled pointer-events:none;
                        keep it clickable (handler no-ops when installed) so
                        e2e click-install-button can target it *)
                     ~text:
                       (if installed_ then t "plugin/installed"
                        else t "plugin/install")
                     ~on_press:(fun _ ->
                       if not installed_ then install_marketplace pkg)
                     [])
                 ]
             ])
    ])])

(* ---------- installed card ---------- *)

let card_name plj web_pkg pid =
  let lsmeta = Plugin_host.getf web_pkg "logseq" in
  let candidates =
    [ Plugin_host.jstr lsmeta "title"
    ; Plugin_host.jstr web_pkg "title"
    ; Plugin_host.jstr plj "title"
    ; Plugin_host.jstr web_pkg "name"
    ; Plugin_host.jstr plj "name"
    ; pid
    ]
  in
  List.find (fun s -> s <> "") candidates

let switch_btn ~checked ~on_toggle =
  Settings_controls.switch_el ~key:"sw" ~on:checked ~on_checked:on_toggle

let menu_li ~key label act =
  list_item ~key ~text:label ~on_press:(fun _ -> act ()) []

(* cljs card-ctls-of-installed .updates-actions — btn shows "Update
   new-version" when a check recorded one, else "Check update"; click
   runs check-or-update-marketplace-plugin! (only-check when nothing
   pending) *)
let updates_btn ~pid ~plj ~web_pkg =
  let repo =
    let r = Plugin_host.jstr web_pkg "repo" in
    if r <> "" then r else Plugin_host.jstr plj "repo"
  in
  box ~key:"upd" 
    (match Plugin_host.update_version pid with
     | Some v ->
         [ Ui_components.button ~variant:`primary ~key:"b" ~style_class:"btn"
             ~text:(t "plugin/update" ^ {js| 👉 |js} ^ v)
             ~on_press:(fun _ ->
               Plugin_host.check_or_update pid repo false)
             [] ]
     | None ->
         [ Ui_components.button ~variant:`primary ~key:"b" ~style_class:"btn"
             ~text:(t "plugin/check-update")
             ~on_press:(fun _ ->
               Plugin_host.check_or_update pid repo true)
             [] ])

let installed_card (pl : Js.Json.t) =
  let open Plugin_host in
  let plj = meth pl "toJSON" [| Js.Json.boolean false |] in
  let pid = jstr plj "id" in
  let web_pkg = getf plj "webPkg" in
  let name = card_name plj web_pkg pid in
  let desc = jstr web_pkg "description" in
  let version =
    let v = jstr web_pkg "version" in
    if v = "" then jstr plj "version" else v
  in
  let disabled = jbool pl "disabled" in
  let open_readme _ = Plugin_readme.open_readme plj in
  Ui_components.plugin_card ~key:("inst-" ^ pid) ~classes:""
    (row ~key:"r" ~gap:12 ~cross:`start
    [ Ui_parts.pressable ~on_press:open_readme
        (Ui_components.with_props
           [ Ui_components.Prop.cursor `pointer ]
           (box ~key:"l" ~style_class:"l link-block"
              [ row ~key:"ic" ~style_class:"plugin-icon" ~width:40
                  ~height:40 ~corner_radius:6 ~main:`center ~cross:`center
                  ~background:"var(--lx-gray-03, hsl(var(--muted)))"
                  [ icon ~name:(`app "puzzle") [] ] ]))
    ; column ~key:"r" ~style_class:"r" ~grow:1. ~min_width:0
        [ Ui_components.with_props
            [ Ui_components.Prop.font_size "1.25rem"
            ; Ui_components.Prop.font_weight 700 ]
            (row ~key:"h" ~style_class:"head" ~cross:`center ~gap:8
               ~data_attrs:[ "style", "padding-top: 6px" ]
               [ text ~key:"t" ~style_class:"l link-block" ~value:name
                   ~on_press:open_readme []
               ; Ui_components.with_props
                   [ Ui_components.Prop.opacity 0.5 ]
                   (text ~key:"v" ~style_class:"ls-pl-status"
                      ~font_size:"0.75rem" ~padding_horizontal:4
                      ~value:version []) ])
        ; Ui_components.with_props
            [ Ui_components.Prop.opacity 0.7 ]
            (paragraph ~key:"desc" ~style_class:"desc"
               ~font_size:"0.75rem" ~value:desc [])
        ; box ~key:"flag"
            [ Ui_components.with_props
                [ Ui_components.Prop.font_size "0.75rem" ]
                (row ~style_class:"ls-pl-meta" ~main:`space_between
                   ~data_attrs:[ "style", "padding-right: 8px" ]
                   [ text ~key:"a" ~value:(jstr web_pkg "author") []
                   ; text ~key:"i" ~value:("ID: " ^ pid) [] ]) ]
        ; row ~key:"ctl" ~style_class:"ctl" ~main:`space_between
            ~cross:`center
            ~data_attrs:[ "style", "margin-top: 6px" ]
            [ row ~key:"ctl-l" ~style_class:"l" ~cross:`center ~gap:4
                [ box ~key:"de"
                    [ icon ~key:"g" ~name:(`app "settings") []
                    ; Ui_components.with_props
                        [ Ui_components.Prop.position `absolute
                        ; Ui_components.Prop.z_index 20
                        ; ( Ui_components.Prop.shadow
                              "0 4px 6px -1px rgb(0 0 0 / 0.1)" ) ]
                        (list ~key:"m" ~style:`plain
                           ~style_class:"menu-list"
                           ~min_width:144 ~padding_vertical:4
                           ~corner_radius:6 ~border_width:1
                           ~border_color:"hsl(var(--border))"
                           ~background:"hsl(var(--popover))"
                           ~data_attrs:
                             [ "style", "top: 100%; right: 0; margin: 0" ]
                        [ menu_li ~key:"open-settings"
                            (t "plugin/open-settings") (fun () ->
                              open_settings_pid := Some pid;
                              Dialogs_state.open_ "plugin-settings")
                        ; menu_li ~key:"logs" (t "plugin/open-logs")
                            (fun () -> open_logs ~id:pid ~name)
                        ; menu_li ~key:"report" (t "plugin/report-security")
                            (fun () -> open_report (Some (pid, name)))
                        ; menu_li ~key:"uninstall" (t "plugin/uninstall")
                            (fun () ->
                              (* cljs plugins.cljs: content-only
                                 confirm — [:b (t :plugin/delete-alert)] *)
                              Dialogs_state.ask
                                ~title:""
                                ~desc:
                                  (I18n.tf "plugin/delete-alert" [ name ])
                                ~on_confirm:(fun () ->
                                  unregister_plugin pid)
                                ())
                        ])
                    ]
                ]
            ; row ~key:"ctl-r" ~style_class:"r" ~cross:`center ~gap:4
                [ updates_btn ~pid ~plj ~web_pkg
                ; switch_btn ~checked:(not disabled)
                    ~on_toggle:(fun on ->
                      set_plugin_disabled pid (not on))
                ]
            ]
        ]
    ])

(* ---------- panels ---------- *)

let installed_panel ~key ~search ~cat ~search_st ~cat_st =
  let plugins =
    Js.Dict.values Plugin_host.installed
    |> Array.to_list
    |> List.filter (fun pl ->
           let plj =
             Plugin_host.meth pl "toJSON" [| Js.Json.boolean false |]
           in
           let web_pkg = Plugin_host.getf plj "webPkg" in
           let is_theme =
             Plugin_host.jbool web_pkg "theme"
             || Plugin_host.jbool plj "theme"
           in
           (match cat with
            | "themes" -> is_theme
            | _ -> not is_theme)
           &&
           let name =
             card_name plj web_pkg (Plugin_host.jstr plj "id")
           in
           search = ""
           || I18n.contains_ci name search
           || I18n.contains_ci (Plugin_host.jstr web_pkg "description") search)
  in
  let all =
    Js.Dict.values Plugin_host.installed
    |> Array.to_list
    |> List.map (fun pl ->
           let plj =
             Plugin_host.meth pl "toJSON" [| Js.Json.boolean false |]
           in
           Plugin_host.jbool (Plugin_host.getf plj "webPkg") "theme"
           || Plugin_host.jbool plj "theme")
  in
  let n_themes = List.length (List.filter Fun.id all) in
  let n_plugins = List.length all - n_themes in
  column ~key ~style_class:"cp__plugins-installed" ~gap:8
    [ control_tabs ~key:(key ^ "-tabs") ~search_st ~cat_st
        ~nums:(Some (n_plugins, n_themes)) []
    ; list_wrap ~key:(key ^ "-list") (List.map installed_card plugins)
    ]

(* cljs plugins.cljs .cp__plugins-marketplace-cnt: category tabs carry
   the whole marketplace counts *)
type market_filter = All | Installed | Not_installed
type market_sort = Popular | Downloads | Stars | Title | Supports_db | Added

let sort_marketplace sort stats packages =
  let open Plugin_host in
  let now = Js.Date.now () in
  let day = 86_400_000. in
  let entries = List.map (fun pkg ->
    let id = jstr pkg "id" in
    let stat = package_stat stats id in
    let updated =
      match Js.Json.decodeObject stats with
      | Some d -> Option.fold ~none:"" ~some:(fun s -> jstr s "updated_at") (Js.Dict.get d id)
      | None -> "" in
    let age = Option.fold ~none:0. ~some:(fun ts -> (now -. ts) /. day)
        (if updated = "" then None else Ui_services.time_parse updated) in
    let added = Js.Json.decodeNumber (getf pkg "addedAt") in
    pkg, stat, age, added) packages in
  let descending key a b = compare (key b) (key a) in
  let downloads (_, stat, _, _) = Option.map (fun s -> s.downloads) stat
  and stars (_, stat, _, _) = Option.map (fun s -> s.stars) stat
  and title (pkg, _, _, _) =
    let title = jstr pkg "title" in
    String.lowercase_ascii (if title = "" then jstr pkg "name" else title) in
  let rows = match sort with
    | Downloads -> List.stable_sort (descending downloads) entries
    | Stars -> List.stable_sort (descending stars) entries
    | Title -> List.stable_sort (fun a b -> String.compare (title a) (title b)) entries
    | Supports_db ->
        List.stable_sort (descending (fun (pkg, _, _, _) -> jbool pkg "supportsDB")) entries
    | Added -> List.stable_sort (descending (fun (_, _, _, added) -> added)) entries
    | Popular ->
        let pinned, rest = List.partition (fun (_, _, _, added) ->
            Option.fold ~none:false ~some:(fun ts -> now -. ts < 6. *. day) added) entries in
        let normalize metric =
          match List.filter_map metric rest with
          | [] -> fun _ -> 0.
          | first :: others ->
              let lo, hi = List.fold_left (fun (lo, hi) n -> min lo n, max hi n)
                  (first, first) others in
              fun entry ->
                if lo = hi then 0. else
                  float_of_int (Option.value (metric entry) ~default:1 - lo)
                  /. float_of_int (hi - lo)
        in
        let norm_downloads = normalize downloads and norm_stars = normalize stars in
        let score ((_, _, age, _) as entry) =
          0.8 *. norm_downloads entry +. 0.2 *. norm_stars entry +. exp (-0.001 *. age) in
        pinned @ List.stable_sort (descending score) rest in
  List.map (fun (pkg, _, _, _) -> pkg) rows

let market_panel ~key ~search ~cat ~search_st ~pkgs ~stats ~filter ~sort ~loading =
  let filtered =
    List.filter (fun p ->
      let installed = Js.Dict.get Plugin_host.installed (Plugin_host.jstr p "id") <> None in
      category_ok cat p && matches search p &&
      (match filter with All -> true | Installed -> installed | Not_installed -> not installed)) pkgs
    |> sort_marketplace sort stats
  in
  column ~key  ~gap:8
    (if loading && pkgs = [] then
      [ row ~key:"pl-loading" ~style_class:"ls-pl-loading"
          ~main:`center ~padding_vertical:80
          [ icon ~name:(`app "loader-2") [] ] ]
    else
      [ column ~key:(key ^ "-cnt")
          ~style_class:"cp__plugins-marketplace-cnt" ~gap:8
          [ list_wrap ~show_empty:false ~padding_top:3 ~key:(key ^ "-list")
              (List.map (market_card ~stats ~search_st) filtered) ] ])

(* ---------- page ---------- *)

let body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let owner = ctx.ui_scheduler in
  let tab = Signal.state owner "installed" in
  let mkt_search = Signal.state owner "" in
  let mkt_cat = Signal.state owner "plugins" in
  let filter = Signal.state owner All in
  let sort = Signal.state owner Popular in
  let auto_updates = Signal.state owner (Plugin_host.auto_updates ()) in
  let inst_search = Signal.state owner "" in
  (* cljs show_themes/:open-pid preselects the dialog's starting tab *)
  let start_cat =
    match !Plugin_host.pending_dialog_tab with
    | Some t -> Plugin_host.pending_dialog_tab := None; t
    | None -> "plugins"
  in
  let inst_cat = Signal.state owner start_cat in
  let pkgs = Signal.state owner ([] : Js.Json.t list) in
  let stats = Signal.state owner Js.Json.null in
  let loading = Signal.state owner false in
  ignore (Plugin_host.dirty_signal owner);
  let refresh force =
    if not (Runtime.signal_get loading) then begin
      Runtime.signal_set loading true;
      let request =
        let* j = Plugin_host.marketplace_pkgs ~refresh:force owner in
        let xs = Option.fold ~none:[] ~some:Array.to_list (Js.Json.decodeArray j) in
        let* stat = Plugin_host.fetch_stats ~refresh:force () in
        Js.Promise.resolve (xs, stat)
      in
      Ui_effect.task ~scope:ctx.ui_scope (Subs_state.task_of_promise request)
        ~ok:(fun (xs, stat) ->
          Signal.set pkgs xs;
          Signal.set stats stat;
          Runtime.signal_set loading false)
        ~error:(fun err ->
          Runtime.signal_set loading false;
          Ui_services.log_error ("Plugin marketplace refresh failed", err))
    end in
  refresh false;
  let marketplace_toolbar =
    [ options_menu ~key:"filter" ~icon:"filter" ~label:(t "cmdk.action/filter")
        ~state:filter [All, t "plugin/all"; Installed, t "plugin/installed";
                       Not_installed, t "plugin/not-installed"]
    ; options_menu ~key:"sort" ~icon:"arrows-sort" ~label:(t "block/sort-order")
        ~state:sort [Popular, t "plugin/popular"; Downloads, t "plugin/downloads";
                     Stars, t "plugin/stars"; Title, I18n.tf "plugin/title" ["A - Z"];
                     Supports_db, t "plugin/supports-db"; Added, t "plugin/date-added"]
    ; reactive (fun enabled ->
        toolbar_menu ~picked:false ~key:"more" ~icon:"dots-vertical" ~label:(t "header/more")
          ~items:([ t "plugin/refresh-lists", "rotate-clockwise", None, (fun () -> refresh true)
                 ; t "plugin/report-security", "alert-triangle", None, (fun () -> open_report None)
                 ] @ if not Plugin_host.supports_auto_updates then [] else
                 [ t "plugin/auto-update-check", "refresh", Some enabled, (fun () ->
                     let next = not enabled in
                     Plugin_host.set_auto_updates next;
                     Runtime.signal_set auto_updates next;
                     Toast.show ~kind:(if next then "success" else "info")
                       (I18n.tf "plugin/auto-update-check-feedback"
                          [t (if next then "ui/on" else "ui/off")])) ]))
        (Signal.value auto_updates)
    ] in
  let tab_btn id label =
    toggle_button ~key:("tab-" ^ id) ~variant:`ghost
      ~height:28 ~min_height:0 ~padding_horizontal:10 ~corner_radius:6
      ?icon:(if id = "marketplace" then Some (`app "apps") else None)
      ~text:(t label) ~checked:(reactive ((=) id) (Signal.value tab))
      ~background:(reactive (fun selected ->
        if selected = id then "var(--lx-gray-04)" else "transparent") (Signal.value tab))
      ~foreground:"var(--ls-primary-text-color)"
      ~on_toggle:(fun _ -> Runtime.signal_set tab id) []
  in
  let pair a b = (a, b) in
  (* every derivation is owned into the mount's scope — unowned map2s
     would stay subscribed to the shared state signals after the panel
     unmounts or the tab flips *)
  let own2 f a b = Logseq_el.own ctx (Signal.map2 f a b) in
  let mkt_sig =
    own2 pair
      (own2 pair
         (own2 pair (Signal.value mkt_search) (Signal.value mkt_cat))
         (own2 pair (Signal.value pkgs) (Signal.value loading)))
      (Signal.value stats)
  in
  let inst_sig =
    own2 pair (Signal.value inst_search) (Signal.value inst_cat)
  in
  let node =
    reactive
      (fun _dirty ->
        column ~key:"plugins-page"
          ~style_class:"cp__plugins-page web-platform"
          [ Ui_components.with_props [Ui_components.Prop.padding_bottom 8]
              (heading ~key:"pl-h" ~level:`h1 ~font_size:"1.375rem" ~font_weight:600
                 ~line_height:"1.75rem" ~value:(t "nav/plugins") [])
          ; grid ~key:"pl-tabs" ~style_class:"tabs" ~columns:3 ~margin_bottom:12
              [ box []
              ; row ~main:`center ~cross:`center
                  [ row ~key:"pl-tabs-in" ~style_class:"tabs-inner"
                      ~background:"var(--lx-gray-02)" ~padding:4 ~corner_radius:6
                      ~cross:`center ~gap:8
                      [ tab_btn "installed" "plugin/installed"
                      ; tab_btn "marketplace" "plugin/marketplace" ] ]
              ; box []
              ]
          ; box ~key:"pl-panels"
              [ if_ ~test:(reactive ((=) "marketplace") (Signal.value tab))
                  (column ~key:"marketplace-panel" ~padding_vertical:5
                     [ reactive (fun pkgs ->
                         let themes = List.length
                           (List.filter (fun p -> Plugin_host.jbool p "theme") pkgs) in
                         control_tabs ~key:"mkt-tabs" ~search_st:mkt_search ~cat_st:mkt_cat
                           ~nums:(Some (List.length pkgs - themes, themes)) marketplace_toolbar)
                         (Signal.value pkgs)
                     ; reactive
                         (fun (((search, cat), (pkg_now, load_now)), stat_now) filter sort ->
                           market_panel ~key:"mkt" ~search ~cat
                             ~search_st:mkt_search ~pkgs:pkg_now ~stats:stat_now
                             ~filter ~sort ~loading:load_now)
                         mkt_sig (Signal.value filter) (Signal.value sort)
                     ])
              ; if_ ~test:(reactive ((=) "installed") (Signal.value tab))
                  (reactive
                     (fun (search, cat) ->
                       installed_panel ~key:"inst" ~search ~cat
                         ~search_st:inst_search ~cat_st:inst_cat)
                     inst_sig)
              ]
          ])
      (Plugin_host.dirty_value owner)
  in
  node ctx parent

(* ---------- plugin settings view ----------
   cljs plugins.cljs :plugins-settings + plugins_settings.cljs
   settings-container: .cp__plugins-settings.cp__settings-main >
   .cp__settings-inner.no-aside (nav? is always false on web) > article >
   .panel-wrap[data-id] > h2 "ID: pid" + .cp__plugins-settings-inner with
   desc-item.as-{input,toggle,enum,object,heading,button} schema rows or
   the code-mode editor. *)

let jstr_ = Plugin_host.jstr_

(* JSON.stringify(j, null, 2) — per-platform impl lives in plugin_host
   (FFI on web, Json tree on native) *)
let json_pretty = Plugin_host.json_pretty

let set_json_exn s =
  try Some (Js.Json.parseExn s) with _ -> None

(* cljs desc-item h2: code[key] + caret + strong[title] — heading is a
   leaf kind so this becomes a row of key text + caret + title *)
let desc_h2 key title =
  row ~key:("h-" ^ key) ~cross:`center ~gap:8
    [ text ~key:"k"  ~value:key []
    ; icon ~key:"c" ~name:(`app "caret-right") ~size:`sm []
    ; heading ~key:"t" ~level:`h2  ~value:title []
    ]

(* `.desc-item` — label row + `.form-control` control: flex, center,
   gap 8, pad 6/0, 14px. Classes stay for hooks and the inner
   html-content styling; visuals ride typed props. *)
let desc_item ~key ~label ~control =
  Ui_components.with_props
    [ Ui_components.Prop.font_size "0.875rem" ]
    (row ~key ~cross:`center ~gap:8
       ~padding_vertical:6 [ label; control ])

(* cljs html-content — sanitized markdown rendered raw (DOMPurify) *)
let html_desc key desc : t list =
  if desc = "" then []
  else
    [ box ~key:("hd-" ^ key)
        ~style_class:"html-content ls-pl-html"
        (Render_html.els_of_string (Markdown.markdown_to_html desc)) ]

let set_v pid key v =
  Plugin_host.plugin_set_setting pid key v;
  Plugin_host.bump ()

(* text inputs write without bumping — the field is its own source of
   truth while focused and a dirty re-emit would fight the caret *)
let set_v_quiet pid key v = Plugin_host.plugin_set_setting pid key v

let json_text_of j =
  match Js.Json.decodeString j with
  | Some s -> s
  | None -> Js.Json.stringify j

let item_input pid key s cur =
  let title = Plugin_host.jstr s "title" in
  let desc = Plugin_host.jstr s "description" in
  let input_as =
    let a = Plugin_host.jstr s "inputAs" in
    String.lowercase_ascii
      (if a = "" then Plugin_host.jstr s "type" else a)
  in
  let input_as = if input_as = "string" then "text" else input_as in
  let v =
    match Js.Json.decodeString cur with
    | Some s -> s
    | None -> (
        match Js.Json.decodeNumber cur with
        | Some n -> Printf.sprintf "%g" n
        | None -> "")
  in
  let on_change raw =
    set_v_quiet pid key
      (if input_as = "number" then
         match float_of_string_opt raw with
         | Some n -> Js.Json.number n
         | None -> jstr_ raw
       else jstr_ raw)
  in
  let field =
    match input_as with
    | "textarea" ->
        Ui_components.form_textarea ~key:"in" ~style_class:"form-input" ~text:v
          ~on_input:on_change
          []
    | "color" ->
        Ui_components.input ~key:"in" ~style_class:"form-input" ~kind:`color ~text:v
          ~on_input:on_change
          []
    | "range" ->
        slider ~key:"in" ~width:120 ~label:(if title = "" then key else title)
          ~value:
            (match float_of_string_opt v with
             | Some f -> f
             | None -> 0.)
          ~on_change:(fun n -> on_change (Printf.sprintf "%g" n))
          []
    | _ ->
        Ui_components.form_input ~key:"in" ~style_class:"form-input" ~text:v
          ~on_input:on_change
          []
  in
  desc_item ~key:("i-" ^ key) ~label:(desc_h2 key title)
    ~control:
      (box ~key:"fc" ~cross:`center
         (html_desc key desc @ [ field ]))

let item_toggle pid key s cur =
  let title = Plugin_host.jstr s "title" in
  let desc = Plugin_host.jstr s "description" in
  let checked =
    match Js.Json.decodeBoolean cur with
    | Some b -> b
    | None -> Plugin_host.jbool s "default"
  in
  desc_item ~key:("t-" ^ key) ~label:(desc_h2 key title)
    ~control:
      (row ~key:"fc" ~cross:`center ~gap:6
         (Ui_components.checkbox ~key:"cb" ~checked
            ~on_toggle:(fun ev ->
              match ev with
              | on ->
                  set_v pid key (Js.Json.boolean on))
            []
          :: html_desc key desc))

let item_enum pid key s cur' =
  let title = Plugin_host.jstr s "title" in
  let desc = Plugin_host.jstr s "description" in
  let choices =
    match Js.Json.decodeArray (Plugin_host.getf s "enumChoices") with
    | Some xs ->
        Array.to_list xs
        |> List.filter_map Js.Json.decodeString
    | None -> []
  in
  let cur = json_text_of cur' in
  desc_item ~key:("e-" ^ key) ~label:(desc_h2 key title)
    ~control:
      (box ~key:"fc"
         [ box ~key:"w" ~style_class:"wrap" ~grow:1. ~min_width:0
             ( html_desc key desc
             @ [ select ~key:"s" ~text:cur
                   (List.map
                      (fun c ->
                        menu_item ~key:c ~text:c ~selected:(c = cur)
                          ~on_press:(fun _ -> set_v pid key (jstr_ c))
                          [])
                      choices) ]) ])

let item_object key s =
  desc_item ~key:("o-" ^ key)
    ~label:(desc_h2 key (Plugin_host.jstr s "title"))
    ~control:
      (box ~key:"fc"
         (html_desc key (Plugin_host.jstr s "description")))

let item_button pid key s =
  let action = Plugin_host.jstr s "buttonAction" in
  desc_item ~key:("b-" ^ key)
    ~label:(desc_h2 key (Plugin_host.jstr s "title"))
    ~control:
      (box ~key:"fc"
         ( html_desc key (Plugin_host.jstr s "description")
         @ [ Ui_components.button ~variant:`primary ~key:"btn" ~style_class:"ui__button is-small"
               ~text:(Plugin_host.jstr s "buttonText")
               ~on_press:(fun _ ->
                 Plugin_host.call_button_action pid action key)
               [] ]))

(* code mode: cljs lazy-editor renders CodeMirror — a plain textarea
   plus reset/save keeps the same settings round-trip on web *)
let code_mode_wrap owner pid code_mode =
  let content = json_pretty (Plugin_host.plugin_settings_json pid) in
  let code_txt = Signal.state owner content in
  column ~key:"cmw" ~style_class:"code-mode-wrap" ~gap:4
    ~data_attrs:
      [ ( "style"
        , "padding: 4px 4px 4px 12px; margin: 0 0 32px -4px" ) ]
    [ Ui_components.with_props
        [ Ui_components.Prop.font_family "var(--ls-font-family-code, monospace)" ]
        (textarea ~key:"ta" ~style_class:"form-input ls-mono"
           ~text_signal:(Signal.value code_txt)
           ~on_input:(fun text -> Signal.set code_txt text)
           [])
    ; row ~key:"btns" ~style_class:"ls-form-actions" ~main:`end_
        [ Ui_components.button ~key:"reset" ~variant:`ghost ~size:`sm
            ~style_class:"ui__button is-small"
            ~text:(t "ui/reset")
            ~on_press:(fun _ -> Plugin_host.bump ())
            []
        ; Ui_components.button ~variant:`primary ~key:"save" ~style_class:"ui__button is-small"
            ~text:(t "ui/save")
            ~on_press:(fun _ ->
              match set_json_exn (Runtime.signal_get code_txt) with
              | Some j ->
                  Plugin_host.replace_plugin_settings pid j;
                  Runtime.signal_set code_mode false
              | None ->
                  Ui_services.dom_dispatch_json "ls:toast"
                    (Json.Object
                       [ ("msg", Json.String "Invalid JSON")
                       ; ("cls", Json.String "error")
                       ]))
            []
        ]
    ]

(* cljs settings-container: rows dispatch on :type; unknown ->
   :plugin/setting-not-handled *)
let settings_item pid s =
  let key = Plugin_host.jstr s "key" in
  let ty = Plugin_host.jstr s "type" in
  let settings = Plugin_host.plugin_settings_json pid in
  let v = Plugin_host.getf settings key in
  let val_or_default =
    match Js.Json.classify v with
    | Js.Json.JSONNull -> Plugin_host.getf s "default"
    | _ -> v
  in
  match ty with
  | "string" | "number" -> item_input pid key s val_or_default
  | "boolean" -> item_toggle pid key s val_or_default
  | "enum" -> item_enum pid key s val_or_default
  | "object" -> item_object key s
  | "heading" ->
      box ~key:("h-" ^ key) 
        [ heading ~key:"t" ~level:`h2
            ~value:(Plugin_host.jstr s "title") [] ]
  | "button" -> item_button pid key s
  | _ ->
      paragraph ~key:("nh-" ^ key) ~style_class:"ls-pl-warn"
        ~font_size:"1.125rem" ~font_weight:700 ~padding_vertical:16
        ~value:(I18n.tf "plugin/setting-not-handled" [ key ]) []

let settings_plugins () =
  let open Plugin_host in
  Js.Dict.entries installed |> Array.to_list
  |> List.filter_map (fun (id, p) ->
      if jbool p "disabled" || plugin_settings_schema id = [] then None
      else
        let opts = getf p "options" in
        let name = jstr opts "name" in
        Some (id, if name = "" then id else name))
  |> List.sort (fun (_, a) (_, b) -> String.compare a b)

let browse_settings = ref false

let open_settings ?(browse = false) id =
  browse_settings := browse;
  Plugin_host.open_settings_pid := Some id;
  Dialogs_state.open_ "plugin-settings"

let settings_body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let owner = ctx.ui_scheduler in
  let code_mode = Signal.state owner false in
  let pid_state = Signal.state owner !Plugin_host.open_settings_pid in
  let browse = !browse_settings in
  browse_settings := false;
  ignore (Plugin_host.dirty_signal owner);
  let node =
    reactive
      (fun _d code pid ->
        match pid with
        | None -> spacer ~key:"ps-empty" []
        | Some pid ->
            let schema = Plugin_host.plugin_settings_schema pid in
            let body =
              if schema = [] then
                [ heading ~key:"none" ~level:`h2
                    ~style_class:"warning ls-pl-warn"
                    ~font_size:"1.125rem" ~font_weight:700
                    ~padding_vertical:16
                    ~value:(t "plugin/no-settings-schema") [] ]
              else
                [ Ui_components.with_props
                    [ Ui_components.Prop.opacity 0.9 ]
                    (heading ~key:"id" ~level:`h2 ~style_class:"ls-pl-id"
                       ~font_size:"1.25rem"
                       ~data_attrs:
                         [ "style", "padding: 4px 8px 0" ]
                       ~value:("ID: " ^ pid) [])
                ; Ui_components.with_props
                    [ ( Ui_components.Prop.min_height_viewport 0.3 )
                    ; ( Ui_components.Prop.max_height_viewport 0.7 ) ]
                    (column ~key:"in"
                       ~style_class:"cp__plugins-settings-inner" ~gap:8
                       ~data_attrs:[ "style", "overflow-y: auto" ]
                       ( box ~key:"ef"
                           [ text ~key:"a" ~style_class:"ls-pl-link"
                               ~font_size:"0.875rem"
                               ~on_press:(fun _ ->
                                 Runtime.signal_set code_mode (not code))
                               ~value:
                              (if code then
                                 t "plugin.settings/exit-code-mode"
                               else t "plugin.settings/edit-settings-json")
                            [] ]
                       ::
                       if code then
                         [ code_mode_wrap owner pid code_mode ]
                       else
                         List.map (settings_item pid) schema ))
                ]
            in
            row ~key:"ps" ~gap:16
              ((if not browse then [] else
                  [ column ~key:"ps-nav" ~min_width:140 ~gap:4
                      (List.map (fun (id, label) ->
                          Ui_components.nav_item ~key:id ~data_id:id ~icon:"puzzle"
                            ~text:label ~selected_signal:(Signal.constant owner (id = pid))
                            ~on_press:(fun _ ->
                              Runtime.signal_set code_mode false;
                              Runtime.signal_set pid_state (Some id)) ())
                         (settings_plugins ())) ])
              @
              [ Ui_components.with_props
                  [ ( Ui_components.Prop.min_height_viewport 0.55 )
                  ; ( Ui_components.Prop.max_height_viewport 0.75 ) ]
                  (column ~key:"si"
                     ~style_class:"cp__settings-inner no-aside" ~grow:1. ~min_width:0
                     [ column ~key:"pw" ~style_class:"panel-wrap" ~gap:16
                         body ]) ]))
      (Plugin_host.dirty_value owner) (Signal.value code_mode) (Signal.value pid_state)
  in
  node ctx parent
