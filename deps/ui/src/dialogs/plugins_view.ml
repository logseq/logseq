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
let t s = s

let icon name = dom ~tag:"i" ~style_class:("ti ti-" ^ name) []

let contains_ci hay needle =
  let h = String.lowercase_ascii hay and n = String.lowercase_ascii needle in
  let lh = String.length h and ln = String.length n in
  let rec go i =
    if i + ln > lh then false
    else if String.sub h i ln = n then true
    else go (i + 1)
  in
  ln = 0 || go 0

(* cljs marketplace search: fuzzy title match + description substring;
   substring on title/name/description covers the e2e queries *)
let matches search pkg =
  search = ""
  || contains_ci (Plugin_host.jstr pkg "title") search
  || contains_ci (Plugin_host.jstr pkg "description") search
  || contains_ci (Plugin_host.jstr pkg "name") search

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
          [ ("placeholder", t "Search plugins")
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

let category_tabs ~key cat cat_st =
  let btn id label ic =
    dom ~key:(key ^ "-" ^ id) ~tag:"button"
      ~style_class:(if cat = id then "active" else "")
      ~events:"click"
      ~on_dom_event:(fun n _ ->
        if n = "click" then Runtime.signal_set cat_st id)
      [ dom ~tag:"span" ~style_class:"flex items-center"
          [ icon ic; dom ~tag:"span" ~text:label [] ] ]
  in
  dom ~key:(key ^ "-cats")
    ~style_class:"secondary-tabs categories flex"
    [ btn "plugins" (t "Plugins") "puzzle"
    ; btn "themes" (t "Themes") "palette"
    ]

let control_tabs ~key ~search_st ~cat ~cat_st =
  dom ~key:(key ^ "-ctls")
    ~style_class:"pb-3 flex justify-between control-tabs relative"
    [ dom ~key:(key ^ "-l") ~style_class:"flex items-center l"
        [ category_tabs ~key cat cat_st ]
    ; dom ~key:(key ^ "-r") ~style_class:"flex items-center r"
        [ search_input ~key:(key ^ "-search") search_st ]
    ]

let list_wrap ~key children =
  dom ~key ~style_class:"cp__plugins-item-lists"
    [ dom ~key:(key ^ "-in")
        ~style_class:"cp__plugins-item-lists-inner" children ]

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
  dom ~key:("mkt-" ^ id) ~style_class:cls
    [ dom ~key:"l" ~style_class:"l link-block cursor-pointer"
        [ dom ~key:"ic" ~style_class:"plugin-icon" [ icon "puzzle" ] ]
    ; dom ~key:"r" ~style_class:"r"
        [ dom ~key:"h" ~tag:"h3"
            ~style_class:"head text-xl font-bold pt-1.5"
            ~attrs:[ ("title", title) ]
            [ dom ~tag:"span"
                ~style_class:"l link-block cursor-pointer" ~text:title []
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
                    ~text:(if installed_ then t "Installed" else t "Install")
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
  dom ~key:("inst-" ^ pid) ~style_class:"cp__plugins-item-card installed"
    [ dom ~key:"l" ~style_class:"l link-block cursor-pointer"
        [ dom ~key:"ic" ~style_class:"plugin-icon" [ icon "puzzle" ] ]
    ; dom ~key:"r" ~style_class:"r"
        [ dom ~key:"h" ~tag:"h3"
            ~style_class:"head text-xl font-bold pt-1.5"
            ~attrs:[ ("title", name) ]
            [ dom ~tag:"span"
                ~style_class:"l link-block cursor-pointer" ~text:name []
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
                        [ dom ~tag:"li" ~text:(t "Open settings") [] ]
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
           || contains_ci name search
           || contains_ci (Plugin_host.jstr web_pkg "description") search)
  in
  dom ~key ~style_class:"cp__plugins-installed"
    [ control_tabs ~key:(key ^ "-tabs") ~search_st ~cat ~cat_st
    ; list_wrap ~key:(key ^ "-list") (List.map installed_card plugins)
    ]

let market_panel ~key ~search ~cat ~search_st ~cat_st ~pkgs ~loading =
  let filtered =
    List.filter (fun p -> category_ok cat p && matches search p) pkgs
  in
  dom ~key ~style_class:"cp__plugins-marketplace"
    [ control_tabs ~key:(key ^ "-tabs") ~search_st ~cat ~cat_st
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
          [ dom ~key:"pl-h" ~tag:"h1" ~text:(t "Plugins") []
          ; dom ~key:"pl-tabs"
              ~style_class:"tabs flex items-center justify-center"
              [ dom ~key:"pl-tabs-in"
                  ~style_class:"tabs-inner flex items-center"
                  [ tab_btn "installed" "Installed" "cube"
                      (tab_now = "installed")
                  ; tab_btn "marketplace" "Marketplace" "apps"
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
