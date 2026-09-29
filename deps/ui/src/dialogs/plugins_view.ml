(* Plugins dialog body: .cp__plugins-page.web-platform with Installed
   and Marketplace tabs. Mirrors components/plugins.cljs: .tabs >
   .tabs-inner buttons, .control-tabs with .secondary-tabs.categories
   (Plugins/Themes) + .search-ctls input, marketplace
   .cp__plugins-marketplace-cnt > .cp__plugins-item-lists >
   .cp__plugins-item-lists-inner > .cp__plugins-item-card.market cards
   and installed .cp__plugins-installed cards with a
   button[role='switch'] enable toggle. *)

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
    [ dom ~key:(key ^ "-ic") ~tag:"small" ~style_class:"absolute s1"
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
              (Platform.payload_str (Option.value p ~default:"{}") "value"))
        []
    ]

(* cljs plugins.cljs category-tabs: "Plugins (n)" / "Themes (n)" *)
let category_tabs ~key ~nums cat cat_st =
  let btn id label ic n =
    dom ~key:(key ^ "-" ^ id) ~tag:"button"
      ~style_class:
        ("ui__button inline-flex items-center justify-center gap-1 px-3           py-1.5 text-sm"
         ^ if cat = id then " active" else "")
      ~events:"click"
      ~on_dom_event:(fun n _ ->
        if n = "click" then Runtime.signal_set cat_st id)
      [ dom ~tag:"span" ~style_class:"flex items-center"
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
        ("ui__button inline-flex items-center justify-center h-8 w-8 " ^ cls)
      [ icon ic ]
  in
  dom ~key:(key ^ "-ctls")
    ~style_class:"pb-3 flex justify-between control-tabs relative"
    [ dom ~key:(key ^ "-l") ~style_class:"flex items-center l"
        [ category_tabs ~key ~nums cat cat_st ]
    ; dom ~key:(key ^ "-r") ~style_class:"flex items-center r"
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
        "flex items-center justify-center py-28 flex-col gap-2 opacity-30"
      [ Icons.icon ~size:40. "list-search"
      ; dom ~tag:"span" ~style_class:"text-sm"
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
    [ dom ~key:"l" ~style_class:"l link-block cursor-pointer"
        ~events:"click" ~on_dom_event:open_readme
        [ dom ~key:"ic" ~style_class:"plugin-icon" [ icon "puzzle" ] ]
    ; dom ~key:"r" ~style_class:"r"
        [ dom ~key:"h" ~tag:"h3"
            ~style_class:"head text-xl font-bold pt-1.5"
            ~attrs:[ ("title", title) ]
            [ dom ~tag:"span"
                ~style_class:"l link-block cursor-pointer" ~text:title
                ~events:"click" ~on_dom_event:open_readme []
            ]
        ; dom ~key:"desc" ~style_class:"desc text-xs opacity-70"
            [ dom ~tag:"p" ~text:(jstr pkg "description") [] ]
        ; dom ~key:"flag" ~style_class:"flag"
            [ dom ~tag:"p"
                ~style_class:"text-xs pr-2 flex justify-between"
                [ dom ~tag:"small" ~text:(jstr pkg "author") []
                ; dom ~tag:"small" ~text:("ID: " ^ id) []
                ]
            ]
        ; dom ~key:"ctl" ~style_class:"ctl"
            [ dom ~key:"ctl-l" ~tag:"ul"
                ~style_class:"l flex items-center" []
            ; dom ~key:"ctl-r" ~style_class:"r flex items-center"
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
      "ui__switch inline-flex h-5 w-9 items-center rounded-full \
       transition-colors"
    ~attrs:
      [ ("role", "switch")
      ; ("type", "button")
      ; ("aria-checked", string_of_bool checked)
      ]
    ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then on_click ())
    [ dom ~tag:"span" ~key:"knob"
        ~style_class:
          "ui__switch-thumb inline-block h-4 w-4 rounded-full \
           bg-white shadow"
        []
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
    [ dom ~key:"l" ~style_class:"l link-block cursor-pointer"
        ~events:"click" ~on_dom_event:open_readme
        [ dom ~key:"ic" ~style_class:"plugin-icon" [ icon "puzzle" ] ]
    ; dom ~key:"r" ~style_class:"r"
        [ dom ~key:"h" ~tag:"h3"
            ~style_class:"head text-xl font-bold pt-1.5"
            ~attrs:[ ("title", name) ]
            [ dom ~tag:"span"
                ~style_class:"l link-block cursor-pointer" ~text:name
                ~events:"click" ~on_dom_event:open_readme []
            ; dom ~tag:"sup" ~key:"v"
                ~style_class:"inline-block px-1 text-xs opacity-50"
                ~text:version []
            ]
        ; dom ~key:"desc" ~style_class:"desc text-xs opacity-70"
            [ dom ~tag:"p" ~text:desc [] ]
        ; dom ~key:"flag" ~style_class:"flag"
            [ dom ~tag:"p"
                ~style_class:"text-xs pr-2 flex justify-between"
                [ dom ~tag:"small" ~text:(jstr web_pkg "author") []
                ; dom ~tag:"small" ~text:("ID: " ^ pid) []
                ]
            ]
        ; dom ~key:"ctl" ~style_class:"ctl"
            [ dom ~key:"ctl-l" ~style_class:"l"
                [ dom ~key:"de" ~style_class:"de"
                    [ dom ~tag:"strong" [ icon "settings" ]
                    ; dom ~tag:"ul" ~style_class:"menu-list"
                        [ dom ~tag:"li" ~text:(t "plugin/open-settings") [] ]
                    ]
                ]
            ; dom ~key:"ctl-r" ~style_class:"r flex items-center"
                [ dom ~key:"upd" ~style_class:"updates-actions" []
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
          ~style_class:"flex justify-center py-20" [ icon "loader-2" ]
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
    (Js.Promise.then_
       (fun j ->
         let xs =
           match Js.Json.decodeArray j with
           | Some a -> Array.to_list a
           | None -> []
         in
         Signal.set pkgs xs;
         Signal.set loading false;
         Runtime.flush ();
         Js.Promise.resolve Js.Json.null)
       (Plugin_host.marketplace_pkgs owner));
  let tab_btn id label ic active =
    dom ~key:("tab-" ^ id) ~tag:"button"
      ~style_class:
        ("inline-flex items-center gap-1 px-3 py-1 text-sm"
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
              ~style_class:"tabs flex items-center justify-center"
              [ dom ~key:"pl-tabs-in"
                  ~style_class:"tabs-inner flex items-center"
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
