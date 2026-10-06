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

let text_of ev =
  match ev with
  | Lui_protocol.TextChanged (_, s) -> s
  | _ -> ""

(* cljs marketplace search: fuzzy title match + description substring;
   substring on title/name/description covers the e2e queries *)
let matches search pkg =
  search = ""
  || I18n.contains_ci (Plugin_host.jstr pkg "title") search
  || I18n.contains_ci (Plugin_host.jstr pkg "description") search
  || I18n.contains_ci (Plugin_host.jstr pkg "name") search

let category_ok cat pkg =
  match cat with
  | "themes" -> Plugin_host.jbool pkg "theme"
  | _ -> not (Plugin_host.jbool pkg "theme")

let search_input ~key st =
  box ~key ~style_class:"search-ctls"
    [ box ~key:(key ^ "-ic") ~style_class:"ls-search-ico"
        [ icon ~name:`search ~size:`sm [] ]
    ; input ~key:(key ^ "-in")
        ~style_class:"form-input is-small"
        ~placeholder:(t "plugin/search-plugin")
        ~text_signal:(Signal.value st)
        ~on_input:(fun ev -> Runtime.signal_set st (text_of ev))
        []
    ]

(* cljs plugins.cljs category-tabs: "Plugins (n)" / "Themes (n)" —
   the .active class rides a class_signal on the category state *)
let category_tab ~key cat_st id caption (ic : icon) n =
  let cls c =
    "ui__button ls-tab-btn" ^ if c = id then " active" else ""
  in
  Ui_parts.class_signal (Signal.value cat_st) cls
    (button ~key:(key ^ "-" ^ id)
       ~style_class:(cls (Signal.get_state cat_st))
       ~icon:ic
       ~text:(Printf.sprintf "%s (%d)" caption n)
       ~on_press:(fun _ -> Runtime.signal_set cat_st id)
       [])

let category_tabs ~key ~nums cat_st =
  let np, nt = nums in
  row ~key:(key ^ "-cats")
    ~style_class:"secondary-tabs"
    [ category_tab ~key cat_st "plugins" (t "nav/plugins")
        (`app "puzzle") np
    ; category_tab ~key cat_st "themes" (t "nav/themes")
        (`app "palette") nt
    ]

external open_url_ : string -> unit = "open" [@@mel.scope "window"]

(* cljs plugins.cljs panel-control-tabs .r: search + filter + more +
   contribute link. The filter/more buttons are inert stubs upstream
   (no handler) — kept as icon buttons for parity. *)
let control_tabs ~key ~search_st ~cat_st ~nums =
  let ghost_btn id cls (ic : icon) caption =
    button ~key:(key ^ "-" ^ id) ~variant:`ghost ~size:`icon
      ~style_class:("ui__button ls-icon-btn-md " ^ cls)
      ~icon:ic ~label:caption []
  in
  row ~key:(key ^ "-ctls") ~style_class:"control-tabs"
    ~main:`space_between ~cross:`center
    [ box ~key:(key ^ "-l") ~style_class:"l"
        [ category_tabs ~key ~nums cat_st ]
    ; row ~key:(key ^ "-r") ~style_class:"r" ~cross:`center ~gap:8
        [ search_input ~key:(key ^ "-search") search_st
        ; ghost_btn "filter" "sort-or-filter-by" (`app "filter")
            (t "cmdk.action/filter")
        ; ghost_btn "more" "more-do" (`app "dots-vertical")
            (t "header/more")
        ; text ~key:(key ^ "-contrib") 
            ~value:(t "plugin/contribute")
            ~on_press:(fun _ ->
              open_url_ "https://github.com/logseq/marketplace")
            []
        ]
    ]

let empty_item key =
  column ~key ~style_class:"ls-pl-empty" ~cross:`center
    [ icon ~name:(`app "list-search") ~width:40 ~height:40 []
    ; text ~key:(key ^ "-t") ~style_class:"ls-pl-empty-text"
        ~value:(t "plugin/empty") []
    ]

let list_wrap ~key children =
  column ~key ~style_class:"cp__plugins-item-lists"
    (box ~key:(key ^ "-in")
       ~style_class:"cp__plugins-item-lists-inner" children
     :: (if children = [] then [ empty_item (key ^ "-empty") ] else []))

(* ---------- marketplace card ---------- *)

let market_card pkg =
  let open Plugin_host in
  let id = jstr pkg "id" in
  let installed_ = Js.Dict.get installed id <> None in
  let title = jstr pkg "title" in
  let cls =
    "cp__plugins-item-card market"
    ^ if installed_ then " installed" else ""
  in
  (* cljs get-open-plugin-readme-handler: icon .l and h3 .l both open
     the readme dialog *)
  let open_readme _ = Plugin_readme.open_readme pkg in
  row ~key:("mkt-" ^ id) ~style_class:cls ~gap:12
    [ Ui_parts.pressable ~on_press:open_readme
        (box ~key:"l" ~style_class:"l link-block"
           [ box ~key:"ic" ~style_class:"plugin-icon"
               [ icon ~name:(`app "puzzle") [] ] ])
    ; column ~key:"r" ~style_class:"r" ~grow:1.
        [ row ~key:"h" ~style_class:"head" ~cross:`center ~gap:8
            [ text ~key:"t" ~style_class:"l link-block" ~value:title
                ~on_press:open_readme [] ]
        ; paragraph ~key:"desc" ~style_class:"desc"
            ~value:(jstr pkg "description") []
        ; box ~key:"flag" 
            [ row ~style_class:"ls-pl-meta"
                ~main:`space_between
                [ text ~key:"a" ~value:(jstr pkg "author") []
                ; text ~key:"i" ~value:("ID: " ^ id) [] ] ]
        ; row ~key:"ctl" ~style_class:"ctl" ~main:`space_between
            ~cross:`center
            [ box ~key:"ctl-l" ~style_class:"l" []
            ; row ~key:"ctl-r" ~style_class:"r" ~cross:`center
                [ button ~key:"btn"
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
                    []
                ]
            ]
        ]
    ]

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

let toggle_of_switch ev =
  match ev with
  | Lui_protocol.ToggleChanged (_, b) -> b
  | _ -> false

let switch_btn ~checked ~on_toggle =
  switch_ ~key:"sw" ~style_class:"ls-switch-lg" ~checked
    ~on_toggle:(fun ev -> on_toggle (toggle_of_switch ev))
    []

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
         [ button ~key:"b" ~style_class:"btn"
             ~text:(t "plugin/update" ^ " \240\159\145\137 " ^ v)
             ~on_press:(fun _ ->
               Plugin_host.check_or_update pid repo false)
             [] ]
     | None ->
         [ button ~key:"b" ~style_class:"btn"
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
  row ~key:("inst-" ^ pid)
    ~style_class:"cp__plugins-item-card" ~gap:12
    [ Ui_parts.pressable ~on_press:open_readme
        (box ~key:"l" ~style_class:"l link-block"
           [ box ~key:"ic" ~style_class:"plugin-icon"
               [ icon ~name:(`app "puzzle") [] ] ])
    ; column ~key:"r" ~style_class:"r" ~grow:1.
        [ row ~key:"h" ~style_class:"head" ~cross:`center ~gap:8
            [ text ~key:"t" ~style_class:"l link-block" ~value:name
                ~on_press:open_readme []
            ; text ~key:"v" ~style_class:"ls-pl-status" ~value:version
                [] ]
        ; paragraph ~key:"desc" ~style_class:"desc" ~value:desc []
        ; box ~key:"flag" 
            [ row ~style_class:"ls-pl-meta" ~main:`space_between
                [ text ~key:"a" ~value:(jstr web_pkg "author") []
                ; text ~key:"i" ~value:("ID: " ^ pid) [] ] ]
        ; row ~key:"ctl" ~style_class:"ctl" ~main:`space_between
            ~cross:`center
            [ box ~key:"ctl-l" ~style_class:"l"
                [ box ~key:"de" 
                    [ icon ~key:"g" ~name:`settings []
                    ; list ~key:"m" ~style:`plain
                        ~style_class:"menu-list"
                        [ menu_li ~key:"open-settings"
                            (t "plugin/open-settings") (fun () ->
                              open_settings_pid := Some pid;
                              Dialogs_state.open_ "plugin-settings")
                        (* web has no plugin-logs view or report modal
                           (cljs open-plugin-logs!/open-report-modal!) —
                           li kept for menu parity *)
                        ; list_item ~key:"logs"
                            ~text:(t "plugin/open-logs") []
                        ; list_item ~key:"report"
                            ~text:(t "plugin/report-security") []
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
                        ]
                    ]
                ]
            ; row ~key:"ctl-r" ~style_class:"r" ~cross:`center
                [ updates_btn ~pid ~plj ~web_pkg
                ; switch_btn ~checked:(not disabled)
                    ~on_toggle:(fun on ->
                      set_plugin_disabled pid (not on))
                ]
            ]
        ]
    ]

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
        ~nums:(n_plugins, n_themes)
    ; list_wrap ~key:(key ^ "-list") (List.map installed_card plugins)
    ]

let market_panel ~key ~search ~cat ~search_st ~cat_st ~pkgs ~loading =
  let filtered =
    List.filter (fun p -> category_ok cat p && matches search p) pkgs
  in
  column ~key  ~gap:8
    ([ control_tabs ~key:(key ^ "-tabs") ~search_st ~cat_st ~nums:(0, 0) ]
    @
    if loading && pkgs = [] then
      [ box ~key:"pl-loading" ~style_class:"ls-pl-loading"
          [ icon ~name:(`app "loader-2") [] ] ]
    else
      [ column ~key:(key ^ "-cnt")
          ~style_class:"cp__plugins-marketplace-cnt"
          [ list_wrap ~key:(key ^ "-list")
              (List.map market_card filtered) ] ])

(* ---------- page ---------- *)

let body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let owner = ctx.ui_scheduler in
  let tab = Signal.state owner "installed" in
  let mkt_search = Signal.state owner "" in
  let mkt_cat = Signal.state owner "plugins" in
  let inst_search = Signal.state owner "" in
  let inst_cat = Signal.state owner "plugins" in
  let pkgs = Signal.state owner ([] : Js.Json.t list) in
  let loading = Signal.state owner true in
  ignore (Plugin_host.dirty_signal owner);
  ignore
    (let* j = (Plugin_host.marketplace_pkgs owner) in
    let xs =
      match Js.Json.decodeArray j with
      | Some a -> Array.to_list a
      | None -> []
    in
    Signal.set pkgs xs;
    Signal.set loading false;
    Runtime.flush ();
    Js.Promise.resolve Js.Json.null);
  let tab_btn id label (ic : icon) =
    let cls tb =
      "ls-tab-btn" ^ if tb = id then " active" else ""
    in
    Ui_parts.class_signal (Signal.value tab) cls
      (button ~key:("tab-" ^ id)
         ~style_class:(cls (Signal.get_state tab))
         ~icon:ic ~text:(t label)
         ~on_press:(fun _ -> Runtime.signal_set tab id)
         [])
  in
  let pair a b = (a, b) in
  let node =
    reactive
      (fun (tab_now, _dirty) ->
        column ~key:"plugins-page"
          ~style_class:"cp__plugins-page web-platform"
          [ heading ~key:"pl-h" ~level:1 ~value:(t "nav/plugins") []
          ; box ~key:"pl-tabs" ~style_class:"tabs"
              [ row ~key:"pl-tabs-in" ~style_class:"tabs-inner"
                  ~cross:`center
                  [ tab_btn "installed" "plugin/installed" (`app "cube")
                  ; tab_btn "marketplace" "plugin/marketplace"
                      (`app "apps")
                  ]
              ]
          ; box ~key:"pl-panels" 
              [ (if tab_now = "marketplace" then
                   reactive
                     (fun ((search, cat), (pkg_now, load_now)) ->
                       market_panel ~key:"mkt" ~search ~cat
                         ~search_st:mkt_search ~cat_st:mkt_cat
                         ~pkgs:pkg_now ~loading:load_now)
                     (Signal.map2 pair
                        (Signal.map2 pair
                           (Signal.value mkt_search)
                           (Signal.value mkt_cat))
                        (Signal.map2 pair
                           (Signal.value pkgs) (Signal.value loading)))
                 else
                   reactive
                     (fun (search, cat) ->
                       installed_panel ~key:"inst" ~search ~cat
                         ~search_st:inst_search ~cat_st:inst_cat)
                     (Signal.map2 pair
                        (Signal.value inst_search)
                        (Signal.value inst_cat)))
              ]
          ])
      (Signal.map2 pair
         (Signal.value tab)
         (Plugin_host.dirty_value owner))
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

let json_pretty : Js.Json.t -> string =
  [%mel.raw "function (j) { return JSON.stringify(j, null, 2); }"]

let set_json_exn s =
  try Some (Js.Json.parseExn s) with _ -> None

(* cljs desc-item h2: code[key] + caret + strong[title] — heading is a
   leaf kind so this becomes a row of key text + caret + title *)
let desc_h2 key title =
  row ~key:("h-" ^ key) ~cross:`center ~gap:8
    [ text ~key:"k"  ~value:key []
    ; icon ~key:"c" ~name:(`app "caret-right") ~size:`sm []
    ; heading ~key:"t" ~level:2  ~value:title []
    ]

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
        textarea ~key:"in" ~style_class:"form-input" ~text:v
          ~on_input:(fun ev -> on_change (text_of ev))
          []
    | "color" ->
        input ~key:"in" ~style_class:"form-input" ~kind:`color ~text:v
          ~on_input:(fun ev -> on_change (text_of ev))
          []
    | "range" ->
        (* TODO(component): input type=range has no component kind —
           needs a slider kind or ~kind:`range on `input` *)
        Logseq_dom.dom ~key:"in" ~tag:"input"
          ~attrs:[ ("type", input_as); ("value", v) ]
          ~events:"change"
          ~on_dom_event:(fun n p ->
            if n = "change" then
              on_change (Platform.payload_str p "value"))
          []
    | _ ->
        input ~key:"in" ~style_class:"form-input" ~text:v
          ~on_input:(fun ev -> on_change (text_of ev))
          []
  in
  row ~key:("i-" ^ key) ~style_class:"desc-item"
    ~cross:`center
    [ desc_h2 key title
    ; box ~key:"fc" ~style_class:"form-control" ~cross:`center
        (html_desc key desc @ [ field ])
    ]

let item_toggle pid key s cur =
  let title = Plugin_host.jstr s "title" in
  let desc = Plugin_host.jstr s "description" in
  let checked =
    match Js.Json.decodeBoolean cur with
    | Some b -> b
    | None -> Plugin_host.jbool s "default"
  in
  row ~key:("t-" ^ key) ~style_class:"desc-item"
    ~cross:`center
    [ desc_h2 key title
    ; row ~key:"fc" ~style_class:"form-control" ~cross:`center ~gap:6
        (checkbox ~key:"cb" ~checked
           ~on_toggle:(fun ev ->
             match ev with
             | Lui_protocol.ToggleChanged (_, on) ->
                 set_v pid key (Js.Json.boolean on)
             | _ -> ())
           []
         :: html_desc key desc)
    ]

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
  row ~key:("e-" ^ key) ~style_class:"desc-item" ~cross:`center
    [ desc_h2 key title
    ; box ~key:"fc" ~style_class:"form-control"
        [ box ~key:"w" ~style_class:"wrap"
            ( html_desc key desc
            @ [ select ~key:"s" ~text:cur
                  (List.map
                     (fun c ->
                       menu_item ~key:c ~text:c ~selected:(c = cur)
                         ~on_press:(fun _ -> set_v pid key (jstr_ c))
                         [])
                     choices) ]
            )
        ]
    ]

let item_object key s =
  row ~key:("o-" ^ key) ~style_class:"desc-item" ~cross:`center
    [ desc_h2 key (Plugin_host.jstr s "title")
    ; box ~key:"fc" ~style_class:"form-control"
        (html_desc key (Plugin_host.jstr s "description"))
    ]

let item_button pid key s =
  let action = Plugin_host.jstr s "buttonAction" in
  row ~key:("b-" ^ key) ~style_class:"desc-item" ~cross:`center
    [ desc_h2 key (Plugin_host.jstr s "title")
    ; box ~key:"fc" ~style_class:"form-control"
        ( html_desc key (Plugin_host.jstr s "description")
        @ [ button ~key:"btn" ~style_class:"ui__button is-small"
              ~text:(Plugin_host.jstr s "buttonText")
              ~on_press:(fun _ ->
                Plugin_host.call_button_action pid action key)
              [] ]
        )
    ]

(* code mode: cljs lazy-editor renders CodeMirror — a plain textarea
   plus reset/save keeps the same settings round-trip on web *)
let code_mode_wrap owner pid code_mode =
  let content = json_pretty (Plugin_host.plugin_settings_json pid) in
  let code_txt = Signal.state owner content in
  column ~key:"cmw" ~style_class:"code-mode-wrap" ~gap:4
    [ textarea ~key:"ta" ~style_class:"form-input ls-mono"
        ~text_signal:(Signal.value code_txt)
        ~on_input:(fun ev -> Signal.set code_txt (text_of ev))
        []
    ; row ~key:"btns" ~style_class:"ls-form-actions" ~main:`end_
        [ button ~key:"reset" ~variant:`ghost ~size:`sm
            ~style_class:"ui__button is-small"
            ~text:(t "ui/reset")
            ~on_press:(fun _ -> Plugin_host.bump ())
            []
        ; button ~key:"save" ~style_class:"ui__button is-small"
            ~text:(t "ui/save")
            ~on_press:(fun _ ->
              match set_json_exn (Signal.get_state code_txt) with
              | Some j ->
                  Plugin_host.replace_plugin_settings pid j;
                  Runtime.signal_set code_mode false
              | None ->
                  Web_dom.dispatch_custom "ls:toast"
                    (Plugin_host.jobj
                       [ ("msg", jstr_ "Invalid JSON")
                       ; ("cls", jstr_ "error")
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
        [ heading ~key:"t" ~level:2
            ~value:(Plugin_host.jstr s "title") [] ]
  | "button" -> item_button pid key s
  | _ ->
      paragraph ~key:("nh-" ^ key) ~style_class:"ls-pl-warn"
        ~value:(I18n.tf "plugin/setting-not-handled" [ key ]) []

let settings_body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let owner = ctx.ui_scheduler in
  let code_mode = Signal.state owner false in
  ignore (Plugin_host.dirty_signal owner);
  let pair a b = (a, b) in
  let node =
    reactive
      (fun (_d, code) ->
        match !(Plugin_host.open_settings_pid) with
        | None -> spacer ~key:"ps-empty" []
        | Some pid ->
            let schema = Plugin_host.plugin_settings_schema pid in
            let body =
              if schema = [] then
                [ heading ~key:"none" ~level:2
                    ~style_class:"warning ls-pl-warn"
                    ~value:(t "plugin/no-settings-schema") [] ]
              else
                [ heading ~key:"id" ~level:2 ~style_class:"ls-pl-id"
                    ~value:("ID: " ^ pid) []
                ; column ~key:"in"
                    ~style_class:"cp__plugins-settings-inner" ~gap:8
                    ( box ~key:"ef" 
                        [ text ~key:"a" ~style_class:"ls-pl-link"
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
                      List.map (settings_item pid) schema )
                ]
            in
            column ~key:"ps"
              [ box ~key:"si"
                  ~style_class:"cp__settings-inner no-aside"
                  [ column ~key:"pw" ~style_class:"panel-wrap" ~gap:16
                      body ]
              ])
      (Signal.map2 pair
         (Plugin_host.dirty_value owner)
         (Signal.value code_mode))
  in
  node ctx parent
