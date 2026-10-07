(* Settings page (#/settings) and settings dialog shared panel.
   Mirrors components/settings.cljs `settings` defc: nav aside + article
   with .panel-wrap.is-<tab> panes. State lives in Settings_state;
   theme/language helpers in Settings_view; shared controls (rows,
   switches, kbd, buttons) in Settings_controls. *)

open Lui_elements

module T = I18n
module S = Settings_state
module V = Settings_view
module C = Settings_controls

let version = "2.0.2"

(* config.edn-backed toggle row — folds the (config_bool, config_toggle)
   pair every config toggle repeats *)
let cfg_row ~key ~for_ ~label ?label_extra ?detail ?binding ~cfg ~default
    () =
  C.toggle_row ~key ~for_ ~label ?label_extra ?detail ?binding
    ~on:(S.config_bool cfg ~default)
    ~on_toggle:(fun () -> S.config_toggle cfg ~default)
    ()

(* localStorage-backed toggle row *)
let storage_row ~key ~for_ ~label ?label_extra ?detail ?binding ~key_ ~default
    ~on_toggle () =
  C.toggle_row ~key ~for_ ~label ?label_extra ?detail ?binding
    ~on:(S.storage_bool key_ ~default) ~on_toggle ()

(* show-brackets and wide-mode appear in both the editor pane and the
   appearance popup — same row spec, different DOM key *)
let brackets_row ~key =
  cfg_row ~key ~for_:"show_brackets" ~label:T.show_brackets
    ~binding:"t b" ~cfg:"ui/show-brackets?" ~default:true ()

let wide_mode_row ~key =
  storage_row ~key ~for_:"wide_mode" ~label:T.wide_mode ~binding:"t w"
    ~key_:"wide-mode" ~default:false ~on_toggle:S.toggle_wide_mode ()

(* ---- general pane ---- *)

let revision = "dev" (* logseq.common.version/REVISION — goog-define default *)

let version_row () =
  C.action_row ~key:"ver" ~for_:"current-version" ~label:T.current_version
    ~actions:
      [ row ~key:"ver-a" ~style_class:"cp__settings-app-updater"
          ~cross:`center
          [ row ~key:"ver-c" ~style_class:"ctls" ~cross:`center
              [ row ~key:"ver-i" ~style_class:"ls-ver-wrap"
                  ~cross:`center
                  [ box ~key:"ver-b" []
                  ; text ~key:"ver-v" ~style_class:"ls-ver-text"
                      ~value:version []
                  ; link ~key:"ver-cl" ~style_class:"fade-link"
                      ~url:"https://docs.logseq.com/#/page/changelog"
                      ~text:T.changelog []
                  ]
              ]
          ]
      ]
    ()

let language_row ctx =
  let lang_label =
    Signal.state ctx.Lui_ui.ui_scheduler
      (V.lang_label_for (V.current_lang ()))
  in
  C.action_row ~key:"lang" ~for_:"preferred_language"
    ~label:T.language_label
    ~actions:
      [ V.lang_trigger ~ctx ~key:"lang-sel" ~h_cls:"ls-select-md"
          ~st:lang_label
      ]
    ()

let theme_row ctx =
  let mode = Signal.state ctx.Lui_ui.ui_scheduler (V.current_mode ()) in
  row ~key:"theme" ~style_class:"it ls-it-top"
    [ column ~key:"theme-lc" ~style_class:"ls-it-label-col"
        [ label ~key:"theme-l" ~style_class:"ls-label"
            ~value:
              (reactive
                 (fun m ->
                   let effective =
                     if m = "system" then
                       if Web_dom.prefers_dark () then "dark"
                       else "light"
                     else m
                   in
                   T.switch_to_theme
                     (if effective = "dark" then T.theme_light
                      else T.theme_dark))
                 (Signal.value mode))
            []
        ]
    ; row ~key:"theme-rc" ~style_class:"ls-it-actions"
        [ box ~key:"theme-a" [ V.theme_modes_ul ~st:mode ]
        ; row ~key:"theme-desc" ~style_class:"ls-it-side"
            [ C.kbd_seq ~key:"theme-k" ~binding:"t t" [ "t"; "t" ] ]
        ]
    ]

let font_button ~key ~label ~active ~on_click =
  button ~key ~variant:`secondary ~selected:active ~label
    ~style_class:
      (C.btn_cls ~variant:`Secondary () ^ " ls-font-btn"
     ^ if active then " ls-active" else "")
    ~on_press:(fun _ -> on_click ())
    [ column ~key:(key ^ "-s")
        ~style_class:
          ("ls-font ls-font-" ^ String.lowercase_ascii label)
        [ text ~key:(key ^ "-ag") ~value:"Ag" []
        ; text ~key:(key ^ "-sm") ~value:label []
        ]
    ]

let editor_font_row () =
  let font = S.current_editor_font () in
  let fb t label =
    font_button ~key:("font-" ^ t) ~label ~active:(font.S.ftype = t)
      ~on_click:(fun () -> S.set_editor_font_type t)
  in
  C.it_row ~key:"font" ~for_:"font_family" ~label:T.editor_font
    ~value_cls:"ls-it-value-col"
    [ row ~key:"font-btns" ~style_class:"ls-row-gap"
        [ fb "default" "Default"; fb "serif" "Serif"; fb "mono" "Mono" ]
    ; box ~key:"font-g" ~style_class:"ls-font-global"
        [ row ~key:"font-gl" ~cross:`center
            ~style_class:"ls-check-row"
            [ C.checkbox_el ~key:"font-gc" ~on:font.S.fglobal
                ~on_change:(fun b -> S.set_editor_font_global b)
            ; text ~key:"font-gt" ~style_class:"ls-check-label"
                ~value:T.editor_font_global []
            ]
        ]
    ]

let color_names =
  [ "tomato"; "red"; "crimson"; "pink"; "plum"; "purple"; "violet"
  ; "indigo"; "blue"; "cyan"; "teal"; "green"; "grass"; "orange" ]

let color_label = function
  | "none" -> T.accent_color_none
  | "logseq" -> T.accent_color_logseq
  | "tomato" -> T.color_tomato
  | "red" -> T.color_red
  | "crimson" -> T.color_crimson
  | "pink" -> T.color_pink
  | "plum" -> T.color_plum
  | "purple" -> T.color_purple
  | "violet" -> T.color_violet
  | "indigo" -> T.color_indigo
  | "blue" -> T.color_blue
  | "cyan" -> T.color_cyan
  | "teal" -> T.color_teal
  | "green" -> T.color_green
  | "grass" -> T.color_grass
  | _ -> T.color_orange

(* cljs settings.cljs accent-color-row: 20px rounded-full button at
   opacity .5 (1 when active), 1px/4px outline in rx-06/07, inner 8px
   dot in rx-07 hidden unless active; "none" is a red bar *)
let accent_swatch ~key ~modal ~current color =
  let active = color = current and none = color = "none" in
  box ~key ~style_class:"ls-swatch-cell"
    ~opacity:(if active then 1. else 0.5)
    [ button ~key:(key ^ "-b") ~variant:`ghost
        ~style_class:(C.btn_cls ~variant:`Text () ^ " ls-swatch")
        ~label:(color_label color)
        ~background:("var(--rx-" ^ color ^ "-09)")
        ~selected:active ~autofocus:(modal && active)
        ~border_color:("var(--rx-" ^ color ^ (if active then "-07)" else "-06)"))
        ~border_width:(if active then 4 else 1)
        ~width:20 ~height:20 ~corner_radius:999 ~padding:0
        ~on_press:(fun _ -> S.set_accent color)
        [ box ~key:(key ^ "-s")
            ~style_class:(if none then "ls-swatch-none" else "ls-swatch-dot")
            ~opacity:(if none || active then 1. else 0.)
            ?background:
              (if none then None else Some ("var(--rx-" ^ color ^ "-07)"))
            []
        ]
    ]

let accent_row ~modal =
  let current = S.current_accent () in
  let swatches =
    grid ~key:"acc-l" ~columns:8 ~gap:8
      ~style_class:
        ("cp__accent-colors-list-wrap"
       ^ if modal then " as-modal-picker" else "")
      (List.mapi
         (fun i c ->
           accent_swatch ~key:("acc-" ^ string_of_int i) ~modal ~current c)
         ("none" :: "logseq" :: color_names))
  in
  column ~key:"acc"
    [ C.action_row ~key:"acc-r" ~for_:"toggle_radix_theme"
        ~label:T.accent_color
        ~actions:[ swatches ] ~stretch:modal
        ~desc:
          (if modal then []
           else
             [ row ~key:"acc-sp" 
                 [ C.kbd_seq ~key:"acc-k" ~binding:"c c" [ "c"; "c" ] ]
             ])
        ()
    ; text ~key:"acc-n" ~style_class:"ls-desc"
        ~value:T.accent_color_alert []
    ]

let general_pane ~modal ctx =
  column ~key:"pane-general" ~style_class:"panel-wrap"
    ~gap:16 ~padding:4
    [ version_row ()
    ; language_row ctx
    ; theme_row ctx
    ; editor_font_row ()
    ; accent_row ~modal
    ; C.edit_link_row ~key:"cfg" ~label:T.config_custom_configuration
        ~button:T.edit_config_edn ~href:"#/file/logseq%2Fconfig.edn"
        ~for_:"config_edn" ()
    ; C.edit_link_row ~key:"css" ~label:T.config_custom_theme
        ~button:T.edit_custom_css ~href:"#/file/logseq%2Fcustom.css"
        ~for_:"customize_css" ()
    ]

(* ---- editor pane ---- *)

let journal_formatters =
  [ "do MMM yyyy"; "do MMMM yyyy"; "MMM do, yyyy"; "MMMM do, yyyy"
  ; "E, dd-MM-yyyy"; "E, dd.MM.yyyy"; "E, MM/dd/yyyy"; "E, yyyy/MM/dd"
  ; "EEE, dd-MM-yyyy"; "EEE, dd.MM.yyyy"; "EEE, MM/dd/yyyy"
  ; "EEE, yyyy/MM/dd"; "EEEE, dd-MM-yyyy"; "EEEE, dd.MM.yyyy"
  ; "EEEE, MM/dd/yyyy"; "EEEE, yyyy/MM/dd"; "dd-MM-yyyy"; "MM/dd/yyyy"
  ; "MM-dd-yyyy"; "MM_dd_yyyy"; "yyyy/MM/dd"; "yyyy-MM-dd"
  ; "yyyy-MM-dd EEE"; "yyyy-MM-dd EEEE"; "yyyy_MM_dd"; "yyyyMMdd"
  ; "yyyy\xe5\xb9\xb4MM\xe6\x9c\x88dd\xe6\x97\xa5" ]

(* option text reaches js as raw utf8 bytes from Melange literals *)
let date_option_text fmt = Platform.utf8 fmt

(* the cljs native <select> becomes a LUI select + anchored
   dropdown_menu, same shape as Settings_view.lang_trigger *)
let dfmt_menu_st : bool Signal.state option ref = ref None

let dfmt_menu_state ctx =
  match !dfmt_menu_st with
  | Some s -> s
  | None ->
      let s = Signal.state ctx.Lui_ui.ui_scheduler false in
      dfmt_menu_st := Some s;
      s

let dfmt_menu ~key mst options current =
  dropdown_menu ~key:("dfmt-m-" ^ key)
    ~anchor:`below ~anchor_alignment:`start
    ~style_class:"ui__dropdown-menu-content ui__select-content"
    ~on_dismiss:(fun _ -> V.lang_menu_close mst)
    (List.mapi
       (fun i fmt ->
         menu_item ~key:(Printf.sprintf "dfmt-mi-%d" i)
           ~text:(date_option_text fmt)
           ~selected:(fmt = current)
           ~style_class:"ui__dropdown-menu-item"
           ~on_press:(fun _ ->
             if String.trim fmt <> "" then (
               S.set_date_format fmt;
               Toast.success T.refresh_required;
               Dialogs_state.close_all ());
             V.lang_menu_close mst)
           [])
       options)

let date_format_row ctx =
  let current = (S.value ()).S.date_format in
  let options =
    List.sort_uniq String.compare (current :: journal_formatters)
  in
  let mst = dfmt_menu_state ctx in
  (* cljs date-format-row carries a duplicated hiccup class shorthand;
     reproduced verbatim for DOM parity *)
  row ~key:"dfmt"
    ~style_class:"it sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center"
    [ C.label_el ~key:"dfmt-l" ~for_:"custom_date_format"
        ~text:T.custom_date_format []
    ; column ~key:"dfmt-r" ~style_class:"ls-it-value"
        [ box ~key:"dfmt-w" ~style_class:"ls-select-wrap"
            [ select ~key:"dfmt-s"
                ~style_class:"ui__select-trigger form-select is-small"
                ~text:(date_option_text current)
                ~on_press:(fun _ ->
                  Signal.set mst (not (Runtime.signal_get mst));
                  Runtime.flush ())
                []
            ; reactive ~equal:( == ) (fun open_ ->
                  if open_ then dfmt_menu ~key:"dfmt" mst options current
                  else spacer ~key:"dfmt-m-x" [])
                (Signal.value mst)
            ]
        ]
    ]

let editor_pane ctx =
  column ~key:"pane-editor" ~style_class:"panel-wrap"
    ~gap:16 ~padding:4
    [ date_format_row ctx
    ; brackets_row ~key:"brackets"
    ; wide_mode_row ~key:"wide"
    ; cfg_row ~key:"outdent" ~for_:"preferred_outdenting"
        ~label:T.logical_outdenting
        ~label_extra:
          [ C.info_icon ~key:"outdent-i" ~title:T.outdenting_hint ]
        ~cfg:"editor/logical-outdenting?" ~default:false ()
    ; cfg_row ~key:"fullb" ~for_:"show_full_blocks"
        ~label:T.show_full_blocks
        ~cfg:"ui/show-full-blocks?" ~default:false ()
    ; cfg_row ~key:"pasting" ~for_:"preferred_pasting_file"
        ~label:T.preferred_pasting
        ~label_extra:[ C.info_icon ~key:"pasting-i" ~title:T.pasting_hint ]
        ~cfg:"editor/preferred-pasting-file?" ~default:false ()
    ; cfg_row ~key:"autoexp" ~for_:"auto_expand_block_refs"
        ~label:T.auto_expand_refs
        ~label_extra:
          [ C.info_icon ~key:"autoexp-i" ~title:T.auto_expand_hint ]
        ~cfg:"ui/auto-expand-block-refs?" ~default:true ()
    ; storage_row ~key:"sttip" ~for_:"enable_tooltip"
        ~label:T.shortcut_tooltip ~key_:"shortcut-tooltip?" ~default:true
        ~on_toggle:S.toggle_shortcut_tooltip ()
    ; cfg_row ~key:"tooltips" ~for_:"enable_tooltip"
        ~label:T.tooltips ~cfg:"ui/enable-tooltip?" ~default:true ()
    ; cfg_row ~key:"puball" ~for_:"all pages public"
        ~label:T.all_pages_public ~cfg:"publishing/all-pages-public?"
        ~default:false ()
    ]

(* ---- keymap pane (components/shortcut.cljs page) ---- *)

let keymap_pill ~key ~title ~count ~active =
  button ~key ~selected:active ~label:title
    ~style_class:
      (if active then "shortcut-filter-pill--active shortcut-filter-pill"
       else "shortcut-filter-pill")
    [ text ~key:(key ^ "t") 
        ~value:title []
    ; text ~key:(key ^ "c") 
        ~value:(Platform.utf8 "\xc2\xb7 " ^ count) []
    ]

let keymap_controls () =
  column ~key:"km-ctl"
    ~style_class:"cp__shortcut-page-x-pane-controls" ~gap:8
    [ row ~key:"km-tb" ~style_class:"shortcut-toolbar-row"
        [ row ~key:"km-sw" ~style_class:"search-input-wrap" ~cross:`center
            [ box ~key:"km-si" ~style_class:"search-icon"
                [ icon ~key:"km-sic" ~name:`search [] ]
            ; search_field ~key:"km-in"
                ~style_class:"form-input is-small"
                ~placeholder:T.keymap_search_placeholder ~autofocus:true
                []
            ]
        ; button ~key:"km-kb"
            ~style_class:"shortcut-keystroke-inactive"
            ~icon:(`app "keyboard") ~text:T.keymap_search_by_keys []
        ]
    ; row ~key:"km-pills" ~style_class:"shortcut-pills-row"
        [ row ~key:"km-fp" ~style_class:"shortcut-filter-pills"
            [ keymap_pill ~key:"km-pa" ~title:T.keymap_all ~count:"116"
                ~active:true
            ; keymap_pill ~key:"km-pc" ~title:T.keymap_custom ~count:"0"
                ~active:false
            ; keymap_pill ~key:"km-pu" ~title:T.keymap_unset ~count:"9"
                ~active:false
            ; keymap_pill ~key:"km-pd" ~title:T.keymap_disabled
                ~count:"4" ~active:false
            ]
        ; row ~key:"km-sec" ~style_class:"ls-toolbar-gap"
            [ button ~key:"km-fold" ~style_class:"icon-link"
                ~label:T.keymap_toggle_categories ~icon:(`app "fold") []
            ; button ~key:"km-rf" ~style_class:"icon-link"
                ~label:T.keymap_refresh_all ~icon:(`app "refresh") []
            ]
        ]
    ]

let keymap_binding ~key (b : Keymap_data.binding) =
  let open Keymap_data in
  let cls = "shui-shortcut-" ^ b.kind ^ " shui-shortcut-glow" in
  (* ls-dc is display:contents — the box is transparent on web, so the
     shortcut cells flow as direct children of the action wrap *)
  box ~key ~style_class:"ls-dc"
    [ box ~key:(key ^ "w") ~style_class:"shui-shortcut-wrap"
        [ row ~key:(key ^ "d") ~style_class:cls ~cross:`center
            ~accessibility_identifier:b.data
            (List.concat
             @@ List.mapi
                  (fun i k ->
                 (if i > 0 && b.kind = "combo" then
                    [ box
                        ~key:(key ^ "s" ^ string_of_int i)
                        ~style_class:"shui-shortcut-separator" []
                    ]
                  else [])
                 @ [ kbd
                       ~key:(key ^ "k" ^ string_of_int i)
                       ~style_class:"shui-shortcut-key"
                       ~value:(Platform.utf8 k) []
                   ])
               b.keys)
        ]
    ]

(* Category literals in keymap_data.ml map to shortcut.category/* keys *)
let keymap_category = function
  | "Basics" -> "shortcut.category/basics"
  | "Navigation" -> "shortcut.category/navigating"
  | "Block editing general" -> "shortcut.category/block-editing"
  | "Block command editing" -> "shortcut.category/block-command-editing"
  | "Block selection (press Esc to quit selection)" ->
      "shortcut.category/block-selection"
  | "Formatting" -> "shortcut.category/formatting"
  | "Toggle" -> "shortcut.category/toggle"
  | "Plugins" -> "shortcut.category/plugins"
  | _ -> "shortcut.category/others"

(* ":<id>#<handler>" -> the command.<id> dict key *)
let command_key_of (title : string) : string =
  let s =
    if String.length title > 0 && String.get title 0 = ':' then
      String.sub title 1 (String.length title - 1)
    else title
  in
  let s =
    match String.index_opt s '#' with
    | Some i -> String.sub s 0 i
    | None -> s
  in
  "command." ^ s

let keymap_th ~key label =
  list_item ~key ~style_class:"th"
    [ text ~key:(key ^ "s") ~style_class:"ls-th-strong"
        ~value:(I18n.t (keymap_category label)) []
    ; icon ~key:(key ^ "i") ~style_class:"ls-row" ~name:`chevron_down []
    ]

let keymap_row ~key (r : Keymap_data.row) =
  let open Keymap_data in
  (* the title tooltip attr was DOM-only — dropped *)
  list_item ~key ~style_class:"shortcut-row"
    [ box ~key:(key ^ "l") 
        [ text ~key:(key ^ "lx") ~style_class:"ls-kbd-label"
            ~value:(I18n.t (command_key_of r.title)) []
        ]
    ; row ~key:(key ^ "a")  ~cross:`center
        (if r.unset then
           [ text ~key:(key ^ "u")
                ~value:T.keymap_unset
               []
           ]
         else
           List.mapi
             (fun i b ->
               keymap_binding ~key:(key ^ "b" ^ string_of_int i) b)
             r.bindings)
    ]

let keymap_pane () =
  (* the cljs :auto-focus DOM effect is covered by ~autofocus on the
     search field; --shortcut-header-h was an inline CSS var no rule
     reads — dropped *)
  column ~key:"pane-keymap" ~style_class:"cp__shortcut-page-x"
    [ keymap_controls ()
    ; scroll ~key:"km-art" ~orientation:`vertical ~grow:1.
        [ list ~key:"km-ul" ~style_class:"ls-plain-list"
            (List.mapi
               (fun i it ->
                 let k = "km-i" ^ string_of_int i in
                 match (it : Keymap_data.item) with
                 | Keymap_data.Category label -> keymap_th ~key:k label
                 | Keymap_data.Shortcut r -> keymap_row ~key:k r)
               Keymap_data.items)
        ]
    ]

(* ---- advanced pane ---- *)

let url_button ~key ~label ~on_open =
  button ~key ~variant:(C.btn_variant `Solid) ~size:`sm
    ~style_class:(C.btn_cls ~variant:`Solid ~size:`Sm ())
    ~icon:`edit ~icon_placement:`trailing ~text:label
    ~on_press:(fun _ -> on_open ()) []

let storage_url key default =
  match Platform.local_storage_get key with
  | Some v ->
      let v = Platform.storage_unquote v in
      if String.trim v = "" then default else v
  | None -> default

let advanced_pane () =
  column ~key:"pane-advanced" ~style_class:"panel-wrap"
    ~gap:16 ~padding:4
    [ C.toggle_row ~key:"usage" ~for_:"usage-diagnostics"
        ~label:T.usage_diagnostics
        ~detail:
          [ text ~key:"usage-d" ~style_class:"ls-desc"
              ~value:T.usage_diagnostics_desc [] ]
        ~on:(not (S.instrument_disabled ()))
        ~on_toggle:S.toggle_usage_diagnostics ()
    ; C.toggle_row ~key:"devm" ~for_:"developer_mode"
        ~label:T.developer_mode
        ~detail:
          [ text ~key:"devm-d" ~style_class:"ls-desc"
              ~value:T.developer_mode_desc [] ]
        ~on:(S.developer_mode ()) ~on_toggle:S.toggle_developer_mode ()
    ; C.action_row ~key:"syncurl" ~for_:"sync_server_url"
        ~label:T.sync_server_url
        ~actions:
          [ url_button ~key:"syncurl-b"
              ~label:(storage_url "sync-server-url" "Logseq Sync")
              ~on_open:(fun () -> Dialogs_state.open_ "sync-server")
          ]
        ()
    ; C.action_row ~key:"puburl" ~for_:"publish_server_url"
        ~label:T.publish_server_url
        ~actions:
          [ url_button ~key:"puburl-b"
              ~label:(storage_url "publish-server-url" T.publish_default)
              ~on_open:(fun () -> Dialogs_state.open_ "publish-server")
          ]
        ()
    ]

(* ---- features pane ---- *)

(* the cljs input saved on blur AND Enter; the input kind has only
   ~on_submit (Enter) — blur-save is dropped *)
let home_page_row ctx =
  let current =
    match S.config_get "default-home" with
    | Some (Wire.Map kvs) -> (
        match Wire.get (Wire.Map kvs) "page" with
        | Some (Wire.String s) -> s
        | _ -> "")
    | _ -> ""
  in
  let home_text =
    Signal.state ctx.Lui_ui.ui_scheduler current
  in
  C.it_row ~key:"homep" ~for_:"default page" ~label:T.home_default_page
    [ box ~key:"homep-w" ~style_class:"ls-select-wrap"
        [ input ~key:"homep-in"
            ~accessibility_identifier:"home-default-page"
            ~style_class:"form-input is-small" ~text:current
            ~on_input:(fun ev ->
              match ev with
              | Lui_protocol.TextChanged (_, q) ->
                  Runtime.signal_set home_text q
              | _ -> ())
            ~on_submit:(fun _ ->
              let value = Runtime.signal_get home_text in
              S.set_home_page value (fun res ->
                  match res with
                  | S.Home_ok -> Toast.success T.home_updated
                  | S.Home_missing ->
                      Toast.warning (T.page_not_found_msg value)))
            []
        ]
    ]

(* action_row + switch cell — plugins/flashcards rows in the features
   pane use the same control pair as toggle rows, laid out as an
   action row *)
let switch_action_row ~key ~for_ ~label ~on ~on_toggle () =
  C.action_row ~key ~for_ ~label
    ~actions:[ C.switch_el ~key:(key ^ "-sw") ~on ~on_toggle ]
    ()

let features_pane ctx =
  column ~key:"pane-features" ~style_class:"panel-wrap ls-mb"
    ~gap:16 ~padding:4
    [ home_page_row ctx
    ; C.action_row ~key:"plugs" ~for_:"plugin_system"
        ~label:T.plugins_label
        ~actions:
          [ row ~key:"plugs-a" ~style_class:"ls-toolbar-gap"
              (C.switch_controls ~key:"plugs" ~on:(S.plugin_system ())
                 ~on_toggle:S.toggle_plugin_system ())
          ]
        ()
    ; switch_action_row ~key:"cards" ~for_:"flashcards"
        ~label:T.flashcards
        ~on:(S.config_bool "feature/enable-flashcards?" ~default:true)
        ~on_toggle:(fun () ->
          S.config_toggle "feature/enable-flashcards?" ~default:true)
        ()
    ]

(* ---- shell ---- *)

let nav_items =
  [ ("general", T.settings_general, "adjustments")
  ; ("editor", T.settings_editor, "writing")
  ; ("keymap", T.settings_keymap, "keyboard")
  ; ("advanced", T.settings_advanced, "bulb")
  ; ("features", T.settings_features, "app-feature")
  ]

let tab_title tab =
  match List.find_opt (fun (id, _, _) -> id = tab) nav_items with
  | Some (_, l, _) -> l
  | None -> T.settings_general

let nav_item ~key (id, label, icn) =
  C.class_signal (S.signal ())
    (fun (s : S.t) ->
      if s.tab = id then "active settings-menu-item"
      else "settings-menu-item")
    (list_item ~key ~style_class:"settings-menu-item"
       ~accessibility_identifier:id
       ~icon:(`app icn) ~text:label
       ~selected:(reactive (fun (s : S.t) -> s.tab = id) (S.signal ()))
       ~on_press:(fun _ -> S.set_tab id) [])

let pane_of ~modal ctx tab =
  match tab with
  | "editor" -> editor_pane ctx
  | "keymap" -> keymap_pane ()
  | "advanced" -> advanced_pane ()
  | "features" -> features_pane ctx
  | _ -> general_pane ~modal ctx

let article ~modal ctx =
  column ~key:"settings-article" ~style_class:"settings-article"
    [ row ~key:"art-h" ~style_class:"cp__settings-header"
        [ heading ~key:"art-ht" ~level:1
            ~style_class:"cp__settings-category-title"
            ~value:
              (reactive (fun (s : S.t) -> tab_title s.tab) (S.signal ()))
            []
        ]
    ; reactive (fun (s : S.t) -> pane_of ~modal ctx s.tab)
        (S.signal ())
    ]

let inner ~modal : t =
 fun ctx parent ->
  S.ensure ctx;
  S.activate ();
  let node =
    column ~key:"settings" ~accessibility_identifier:"settings"
      [ row ~key:"settings-inner" ~style_class:"cp__settings-inner"
          [ column ~key:"settings-aside"
              ~style_class:"settings-aside"
              [ row ~key:"aside-h"
                  ~style_class:"cp__settings-header"
                  [ heading ~key:"aside-ht" ~level:1
                      ~style_class:"cp__settings-modal-title"
                      ~value:T.settings_title []
                  ]
              ; list ~key:"aside-menu"
                  ~style_class:"settings-menu"
                  (List.mapi
                     (fun i it -> nav_item ~key:("nav-" ^ string_of_int i) it)
                     nav_items)
              ]
          ; article ~modal ctx
          ]
      ]
  in
  node ctx parent

(* page entry: #/settings *)
let view (_m : Model.t) : t = inner ~modal:false

(* dialog body: .settings-modal wrapper like cljs *)
let modal_body (_ms : Model.t Signal.signal) : t =
  fun ctx parent ->
    let node =
      (* cljs general() calls (accent-color-row false) in the settings
         dialog too — modal=true is only for the compact appearance
         popup (autofocus, as-modal-picker grid, no shortcut chips) *)
      column ~key:"settings-modal" ~style_class:"settings-modal"
        [ inner ~modal:false ]
    in
    node ctx parent

external inner_width : float = "innerWidth" [@@mel.scope "window"]

(* cljs settings.cljs appearance(): the header dots "Appearance" item opens
   a compact popup (id appearance_settings) anchored under
   .toolbar-dots-btn — five rows sharing the settings renderers, wrapped
   in the same ui__dropdown-menu-content shell as the dots menu *)
let appearance_rows ctx =
  [ theme_row ctx
  ; editor_font_row ()
  ; wide_mode_row ~key:"app-wide"
  ; brackets_row ~key:"app-brackets"
  ; accent_row ~modal:true
  ]

let appearance_body (_x, y) : t =
 fun ctx parent ->
  S.ensure ctx;
  let node =
    box ~key:"appearance-popup"
      [ (* cljs shui popup-show! dismisses on outside click — the
           transparent backdrop does the hit-testing *)
        Ui_parts.pressable
          ~on_press:(fun _ ->
            Runtime.send (Action.Appearance_set None))
          (box ~key:"appearance-backdrop"
             ~style_class:"ls-popup-backdrop" [])
        (* cljs PopupContent right-anchors the appearance panel:
           ~620px wide, right edge ~32px from the viewport edge *)
      ; popover ~key:"appearance-wrap"
          ~at:(inner_width -. 32. -. 624., y) ~width:624
          ~on_dismiss:(fun _ ->
            Runtime.send (Action.Appearance_set None))
          ~style_class:"ui__dropdown-menu-content appearance-popup"
          [ column ~key:"appearance_settings"
              ~accessibility_identifier:"appearance_settings"
              ~style_class:"cp__settings-appearance-dialog-inner"
              [ reactive ~equal:( == ) (fun (_ : S.t) ->
                    (* cljs cp__settings-appearance-dialog-inner:
                       flex-col gap-4 between the .it rows *)
                    column ~key:"app-rows" ~gap:16 (appearance_rows ctx))
                  (S.signal ()) ]
          ]
      ]
  in
  node ctx parent
