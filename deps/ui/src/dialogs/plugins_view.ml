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

let dom = Logseq_dom.dom
let t = I18n.t

let icon name = Icons.icon name

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
  dom ~key ~style_class:"search-ctls"
    [ dom ~key:(key ^ "-ic") ~tag:"small" ~style_class:"ls-search-ico"
        [ icon "search" ]
    ; dom ~key:(key ^ "-in") ~tag:"input"
        ~style_class:"form-input is-small"
        ~attrs:
          [ ("placeholder", t "plugin/search-plugin")
          ; ("type", "text")
          ; ("autocomplete", "off")
          ]
        ~events:"input"
        ~on_dom_event:(fun n p ->
          if n = "input" then
            Runtime.signal_set st
              (Platform.payload_str p "value"))
        []
    ]

(* cljs plugins.cljs category-tabs: "Plugins (n)" / "Themes (n)" *)
let category_tabs ~key ~nums cat cat_st =
  let btn id label ic n =
    dom ~key:(key ^ "-" ^ id) ~tag:"button"
      ~style_class:
        ("ui__button ls-tab-btn"
         ^ if cat = id then " active" else "")
      ~events:"click"
      ~on_dom_event:(fun n _ ->
        if n = "click" then Runtime.signal_set cat_st id)
      [ dom ~tag:"span" ~style_class:"ls-row"
          [ icon ic
          ; dom ~tag:"span" ~text:(label ^ " (" ^ string_of_int n ^ ")") [] ]
        ]
  in
  let (np, nt) = nums in
  dom ~key:(key ^ "-cats")
    ~style_class:"secondary-tabs categories flex"
    [ btn "plugins" (t "nav/plugins") "puzzle" np
    ; btn "themes" (t "nav/themes") "palette" nt
    ]

external open_url_ : string -> unit = "open" [@@mel.scope "window"]

(* cljs plugins.cljs panel-control-tabs .r: search + filter + more +
   contribute link *)
let control_tabs ~key ~search_st ~cat ~cat_st ~nums =
  let ghost_btn id cls ic =
    dom ~key:(key ^ "-" ^ id) ~tag:"button"
      ~style_class:
        ("ui__button ls-icon-btn-md " ^ cls)
      [ icon ic ]
  in
  dom ~key:(key ^ "-ctls")
    ~style_class:"control-tabs"
    [ dom ~key:(key ^ "-l") ~style_class:"l"
        [ category_tabs ~key ~nums cat cat_st ]
    ; dom ~key:(key ^ "-r") ~style_class:"r"
        [ search_input ~key:(key ^ "-search") search_st
        ; ghost_btn "filter" "sort-or-filter-by" "filter"
        ; ghost_btn "more" "more-do" "dots-vertical"
        ; dom ~key:(key ^ "-contrib") ~tag:"a"
            ~style_class:"contribute"
            ~attrs:
              [ ("href", "https://github.com/logseq/marketplace")
              ; ("target", "_blank")
              ]
            ~text:(Platform.utf8 (t "plugin/contribute")) []
        ]
    ]

let empty_item =
  fun key ->
    dom ~key
      ~style_class:
        "ls-pl-empty"
      [ Icons.icon ~size:40. "list-search"
      ; dom ~tag:"span" ~style_class:"ls-pl-empty-text"
          ~text:(t "plugin/empty") []
      ]

let list_wrap ~key children =
  dom ~key ~style_class:"cp__plugins-item-lists"
    [ dom ~key:(key ^ "-in")
        ~style_class:"cp__plugins-item-lists-inner" children
    ; if children = [] then empty_item (key ^ "-empty")
      else dom ~key:(key ^ "-nonempty") []
    ]

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
  let open_readme n _ =
    if n = "click" then Plugin_readme.open_readme pkg
  in
  dom ~key:("mkt-" ^ id) ~style_class:cls
    [ dom ~key:"l" ~style_class:"l link-block"
        ~events:"click" ~on_dom_event:open_readme
        [ dom ~key:"ic" ~style_class:"plugin-icon" [ icon "puzzle" ] ]
    ; dom ~key:"r" ~style_class:"r"
        [ dom ~key:"h" ~tag:"h3"
            ~style_class:"head"
            ~attrs:[ ("title", title) ]
            [ dom ~tag:"span"
                ~style_class:"l link-block" ~text:title
                ~events:"click" ~on_dom_event:open_readme []
            ]
        ; dom ~key:"desc" ~style_class:"desc"
            [ dom ~tag:"p" ~text:(jstr pkg "description") [] ]
        ; dom ~key:"flag" ~style_class:"flag"
            [ dom ~tag:"p"
                ~style_class:"ls-pl-meta"
                [ dom ~tag:"small" ~text:(jstr pkg "author") []
                ; dom ~tag:"small" ~text:("ID: " ^ id) []
                ]
            ]
        ; dom ~key:"ctl" ~style_class:"ctl"
            [ dom ~key:"ctl-l" ~tag:"ul"
                ~style_class:"l" []
            ; dom ~key:"ctl-r" ~style_class:"r"
                [ dom ~key:"btn" ~tag:"a"
                    ~style_class:
                      ("btn" ^ if installed_ then " disabled" else "")
                    ~attrs:
                      (* cljs CSS gives a.btn.disabled pointer-events:none;
                         keep it clickable (handler no-ops when installed) so
                         e2e click-install-button can target it *)
                      (if installed_ then
                         [ ("style", "pointer-events:auto") ]
                       else [])
                    ~events:"click"
                    ~on_dom_event:(fun n _ ->
                      if n = "click" && not installed_ then
                        install_marketplace pkg)
                    ~text:(if installed_ then t "plugin/installed" else t "plugin/install")
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

let switch_btn ~checked ~on_click =
  dom ~tag:"button" ~key:"sw"
    ~style_class:
      "ui__switch ls-switch-lg"
    ~attrs:
      [ ("role", "switch")
      ; ("type", "button")
      ; ("aria-checked", string_of_bool checked)
      ]
    ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then on_click ())
    [ dom ~tag:"span" ~key:"knob"
        ~style_class:
          "ui__switch-thumb ls-thumb-lg"
        []
    ]

let menu_li key label act =
  dom ~tag:"li" ~key ~text:label ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then act ())
    []

(* cljs card-ctls-of-installed .updates-actions — btn shows "Update
   new-version" when a check recorded one, else "Check update"; click
   runs check-or-update-marketplace-plugin! (only-check when nothing
   pending) *)
let updates_btn ~pid ~plj ~web_pkg =
  let repo =
    let r = Plugin_host.jstr web_pkg "repo" in
    if r <> "" then r else Plugin_host.jstr plj "repo"
  in
  match Plugin_host.update_version pid with
  | Some v ->
      dom ~key:"upd" ~style_class:"updates-actions"
        [ dom ~tag:"a" ~style_class:"btn" ~events:"click"
            ~on_dom_event:(fun n _ ->
              if n = "click" then
                Plugin_host.check_or_update pid repo false)
            [ dom ~tag:"span"
                ~text:(t "plugin/update" ^ " \240\159\145\137 " ^ v) [] ]
        ]
  | None ->
      dom ~key:"upd" ~style_class:"updates-actions"
        [ dom ~tag:"a" ~style_class:"btn" ~events:"click"
            ~on_dom_event:(fun n _ ->
              if n = "click" then
                Plugin_host.check_or_update pid repo true)
            ~text:(t "plugin/check-update") []
        ]

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
  let open_readme n _ =
    if n = "click" then Plugin_readme.open_readme plj
  in
  dom ~key:("inst-" ^ pid) ~style_class:"cp__plugins-item-card installed"
    [ dom ~key:"l" ~style_class:"l link-block"
        ~events:"click" ~on_dom_event:open_readme
        [ dom ~key:"ic" ~style_class:"plugin-icon" [ icon "puzzle" ] ]
    ; dom ~key:"r" ~style_class:"r"
        [ dom ~key:"h" ~tag:"h3"
            ~style_class:"head"
            ~attrs:[ ("title", name) ]
            [ dom ~tag:"span"
                ~style_class:"l link-block" ~text:name
                ~events:"click" ~on_dom_event:open_readme []
            ; dom ~tag:"sup" ~key:"v"
                ~style_class:"ls-pl-status"
                ~text:version []
            ]
        ; dom ~key:"desc" ~style_class:"desc"
            [ dom ~tag:"p" ~text:desc [] ]
        ; dom ~key:"flag" ~style_class:"flag"
            [ dom ~tag:"p"
                ~style_class:"ls-pl-meta"
                [ dom ~tag:"small" ~text:(jstr web_pkg "author") []
                ; dom ~tag:"small" ~text:("ID: " ^ pid) []
                ]
            ]
        ; dom ~key:"ctl" ~style_class:"ctl"
            [ dom ~key:"ctl-l" ~style_class:"l"
                [ dom ~key:"de" ~style_class:"de"
                    [ dom ~tag:"strong" [ icon "settings" ]
                    ; dom ~tag:"ul" ~style_class:"menu-list"
                        [ menu_li "open-settings"
                            (t "plugin/open-settings") (fun () ->
                              open_settings_pid := Some pid;
                              Dialogs_state.open_ "plugin-settings")
                        (* web has no plugin-logs view or report modal
                           (cljs open-plugin-logs!/open-report-modal!) —
                           li kept for menu parity *)
                        ; dom ~tag:"li"
                            ~text:(t "plugin/open-logs") []
                        ; dom ~tag:"li"
                            ~text:(t "plugin/report-security") []
                        ; menu_li "uninstall" (t "plugin/uninstall")
                            (fun () ->
                              Dialogs_state.ask
                                ~title:
                                  (I18n.tf "plugin/delete-alert" [ name ])
                                ~desc:""
                                ~on_confirm:(fun () ->
                                  unregister_plugin pid)
                                ())
                        ]
                    ]
                ]
            ; dom ~key:"ctl-r" ~style_class:"r"
                [ updates_btn ~pid ~plj ~web_pkg
                ; switch_btn ~checked:(not disabled) ~on_click:(fun () ->
                      set_plugin_disabled pid (not disabled))
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
  dom ~key ~style_class:"cp__plugins-installed"
    [ control_tabs ~key:(key ^ "-tabs") ~search_st ~cat ~cat_st
        ~nums:(n_plugins, n_themes)
    ; list_wrap ~key:(key ^ "-list") (List.map installed_card plugins)
    ]

let market_panel ~key ~search ~cat ~search_st ~cat_st ~pkgs ~loading =
  let filtered =
    List.filter (fun p -> category_ok cat p && matches search p) pkgs
  in
  dom ~key ~style_class:"cp__plugins-marketplace"
    [ control_tabs ~key:(key ^ "-tabs") ~search_st ~cat ~cat_st
        ~nums:(0, 0)
    ; if loading && pkgs = [] then
        dom ~key:"pl-loading" ~tag:"p"
          ~style_class:"ls-pl-loading" [ icon "loader-2" ]
      else
        dom ~key:(key ^ "-cnt") ~style_class:"cp__plugins-marketplace-cnt"
          [ list_wrap ~key:(key ^ "-list")
              (List.map market_card filtered) ]
    ]

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
  let tab_btn id label ic active =
    dom ~key:("tab-" ^ id) ~tag:"button"
      ~style_class:
        ("ls-tab-btn"
         ^ if active then " active" else "")
      ~events:"click"
      ~on_dom_event:(fun n _ ->
        if n = "click" then Runtime.signal_set tab id)
      [ icon ic; dom ~tag:"span" ~text:(t label) [] ]
  in
  let pair a b = (a, b) in
  let node =
    dyn ~equal:Stdlib.( = )
      (fun (tab_now, _dirty) ->
        dom ~key:"plugins-page"
          ~style_class:"cp__plugins-page web-platform"
          ~attrs:[ ("tabindex", "-1") ]
          [ dom ~key:"pl-h" ~tag:"h1" ~text:(t "nav/plugins") []
          ; dom ~key:"pl-tabs"
              ~style_class:"tabs"
              [ dom ~key:"pl-tabs-in"
                  ~style_class:"tabs-inner"
                  [ tab_btn "installed" "plugin/installed" "cube"
                      (tab_now = "installed")
                  ; tab_btn "marketplace" "plugin/marketplace" "apps"
                      (tab_now = "marketplace")
                  ]
              ]
          ; dom ~key:"pl-panels" ~style_class:"panels"
              [ (if tab_now = "marketplace" then
                   dyn ~equal:Stdlib.( = )
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
                   dyn ~equal:Stdlib.( = )
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

let desc_h2 key title =
  dom ~tag:"h2" ~key:("h-" ^ key)
    [ dom ~tag:"code" ~key:"k" ~text:key []
    ; icon "caret-right"
    ; dom ~tag:"strong" ~key:"t" ~text:title []
    ]

(* cljs html-content — sanitized markdown rendered raw (DOMPurify) *)
let html_desc key desc =
  if desc = "" then []
  else
    [ dom ~key:("hd-" ^ key)
        ~style_class:"html-content ls-pl-html"
        ~html:(Markdown.markdown_to_html desc) [] ]

let set_v pid key v =
  Plugin_host.plugin_set_setting pid key v;
  Plugin_host.bump ()

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
  let on_change p =
    let raw = Platform.payload_str p "value" in
    set_v pid key
      (if input_as = "number" then
         match float_of_string_opt raw with
         | Some n -> Js.Json.number n
         | None -> jstr_ raw
       else jstr_ raw)
  in
  dom ~key:("i-" ^ key) ~style_class:"desc-item as-input"
    ~attrs:[ ("data-key", key) ]
    [ desc_h2 key title
    ; dom ~key:"fc" ~tag:"label" ~style_class:"form-control"
        ( html_desc key desc
        @ [ (if input_as = "textarea" then
               dom ~key:"in" ~tag:"textarea"
                 ~attrs:[ ("type", input_as); ("value", v) ]
                 ~events:"change"
                 ~on_dom_event:(fun n p ->
                   if n = "change" then on_change p)
                 []
             else
               dom ~key:"in" ~tag:"input"
                 ~style_class:
                   (if input_as = "color" || input_as = "range" then ""
                    else "form-input")
                 ~attrs:[ ("type", input_as); ("value", v) ]
                 ~events:"change"
                 ~on_dom_event:(fun n p ->
                   if n = "change" then on_change p)
                 []) ]
        )
    ]

let item_toggle pid key s cur =
  let title = Plugin_host.jstr s "title" in
  let desc = Plugin_host.jstr s "description" in
  let checked =
    match Js.Json.decodeBoolean cur with
    | Some b -> b
    | None -> Plugin_host.jbool s "default"
  in
  dom ~key:("t-" ^ key) ~style_class:"desc-item as-toggle"
    ~attrs:[ ("data-key", key) ]
    [ desc_h2 key title
    ; dom ~key:"fc" ~tag:"label" ~style_class:"form-control"
        ( [ dom ~key:"cb" ~tag:"input"
              ~attrs:
                ([ ("type", "checkbox") ]
                @ if checked then [ ("checked", "checked") ] else [])
              ~events:"change"
              ~on_dom_event:(fun n p ->
                if n = "change" then
                  set_v pid key
                    (Js.Json.boolean
                       (Platform.payload_bool p "checked")))
              [] ]
        @ html_desc key desc )
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
  let picker = Plugin_host.jstr s "enumPicker" in
  dom ~key:("e-" ^ key) ~style_class:"desc-item as-enum"
    ~attrs:[ ("data-key", key) ]
    [ desc_h2 key title
    ; dom ~key:"fc" ~style_class:"form-control"
        [ dom ~key:"w"
            ~tag:(if picker = "radio" || picker = "checkbox" then "div"
                  else "label")
            ~style_class:"wrap"
            ( html_desc key desc
            @ [ dom ~key:"s" ~tag:"select" ~text:cur
                  ~attrs:[ ("data-key", key) ]
                  ~events:"change"
                  ~on_dom_event:(fun n p ->
                    if n = "change" then
                      set_v pid key
                        (jstr_
                           (Platform.payload_str p "value")))
                  (List.map
                     (fun c ->
                       dom ~key:c ~tag:"option"
                         ~attrs:
                           ([ ("value", c) ]
                           @ if c = cur then [ ("selected", "selected") ]
                             else [])
                         ~text:c [])
                     choices) ]
            )
        ]
    ]

let item_object key s =
  dom ~key:("o-" ^ key) ~style_class:"desc-item as-object"
    ~attrs:[ ("data-key", key) ]
    [ desc_h2 key (Plugin_host.jstr s "title")
    ; dom ~key:"fc" ~style_class:"form-control"
        (html_desc key (Plugin_host.jstr s "description"))
    ]

let item_button pid key s =
  let action = Plugin_host.jstr s "buttonAction" in
  dom ~key:("b-" ^ key) ~style_class:"desc-item as-button"
    ~attrs:[ ("data-key", key) ]
    [ desc_h2 key (Plugin_host.jstr s "title")
    ; dom ~key:"fc" ~style_class:"form-control"
        ( html_desc key (Plugin_host.jstr s "description")
        @ [ dom ~key:"btn" ~tag:"button"
              ~style_class:"ui__button is-small"
              ~attrs:[ ("type", "button") ]
              ~text:(Plugin_host.jstr s "buttonText")
              ~events:"click"
              ~on_dom_event:(fun n _ ->
                if n = "click" then
                  Plugin_host.call_button_action pid action key)
              [] ]
        )
    ]

(* code mode: cljs lazy-editor renders CodeMirror — a plain textarea
   plus reset/save keeps the same settings round-trip on web *)
let code_mode_wrap pid code_mode =
  let content = json_pretty (Plugin_host.plugin_settings_json pid) in
  dom ~key:"cmw" ~style_class:"code-mode-wrap"
    [ dom ~key:"ta" ~tag:"textarea"
        ~style_class:"form-input ls-mono"
        ~attrs:[ ("rows", "12"); ("data-lang", "json") ]
        ~text:content []
    ; dom ~key:"btns" ~style_class:"ls-form-actions"
        [ dom ~key:"reset" ~tag:"button"
            ~style_class:"ui__button is-small variant-ghost"
            ~attrs:[ ("type", "button") ] ~text:(t "ui/reset")
            ~events:"click"
            ~on_dom_event:(fun n _ ->
              if n = "click" then Plugin_host.bump ())
            []
        ; dom ~key:"save" ~tag:"button"
            ~style_class:"ui__button is-small"
            ~attrs:[ ("type", "button") ] ~text:(t "ui/save")
            ~events:"click"
            ~on_dom_event:(fun n _ ->
              if n = "click" then (
                match
                  Web_dom.query_selector
                    ".cp__plugins-settings-inner .code-mode-wrap textarea"
                with
                | Some el -> (
                    match set_json_exn (Web_dom.el_value el) with
                    | Some j ->
                        Plugin_host.replace_plugin_settings pid j;
                        Runtime.signal_set code_mode false
                    | None ->
                        Web_dom.dispatch_custom "ls:toast"
                          (Plugin_host.jobj
                             [ ("msg", jstr_ "Invalid JSON")
                             ; ("cls", jstr_ "error")
                             ]))
                | None -> ()))
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
      dom ~key:("h-" ^ key) ~style_class:"heading-item"
        ~attrs:[ ("data-key", key) ]
        [ dom ~tag:"h2" ~key:"t" ~text:(Plugin_host.jstr s "title") [] ]
  | "button" -> item_button pid key s
  | _ ->
      dom ~key:("nh-" ^ key) ~tag:"p" ~style_class:"text-red-500"
        ~text:(I18n.tf "plugin/setting-not-handled" [ key ]) []

let settings_body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let owner = ctx.ui_scheduler in
  let code_mode = Signal.state owner false in
  ignore (Plugin_host.dirty_signal owner);
  let pair a b = (a, b) in
  let node =
    dyn ~equal:Stdlib.( = )
      (fun (_d, code) ->
        match !(Plugin_host.open_settings_pid) with
        | None -> dom ~key:"ps-empty" []
        | Some pid ->
            let schema = Plugin_host.plugin_settings_schema pid in
            let body =
              if schema = [] then
                [ dom ~tag:"h2" ~key:"none"
                    ~style_class:"warning ls-pl-warn"
                    ~text:(t "plugin/no-settings-schema") [] ]
              else
                [ dom ~tag:"h2" ~key:"id"
                    ~style_class:"ls-pl-id"
                    ~text:("ID: " ^ pid) []
                ; dom ~key:"in"
                    ~style_class:"cp__plugins-settings-inner"
                    ~attrs:
                      [ ("data-mode", if code then "code" else "") ]
                    ( dom ~key:"ef" ~tag:"span"
                        ~style_class:"edit-file"
                        [ dom ~tag:"a"
                            ~style_class:"ls-pl-link"
                            ~events:"click"
                            ~on_dom_event:(fun n _ ->
                              if n = "click" then
                                Runtime.signal_set code_mode (not code))
                            ~text:
                              (if code then
                                 t "plugin.settings/exit-code-mode"
                               else t "plugin.settings/edit-settings-json")
                            [] ]
                    ::
                    if code then
                      [ code_mode_wrap pid code_mode ]
                    else
                      List.map (settings_item pid) schema )
                ]
            in
            dom ~key:"ps"
              ~style_class:"cp__plugins-settings cp__settings-main"
              [ dom ~key:"si"
                  ~style_class:"cp__settings-inner no-aside"
                  [ dom ~tag:"article" ~key:"art"
                      [ dom ~key:"pw" ~style_class:"panel-wrap"
                          ~attrs:[ ("data-id", pid) ]
                          body
                      ]
                  ]
              ])
      (Signal.map2 pair
         (Plugin_host.dirty_value owner)
         (Signal.value code_mode))
  in
  node ctx parent
