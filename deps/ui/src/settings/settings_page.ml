(* Settings page (#/settings) and settings dialog shared panel.
   Mirrors components/settings.cljs `settings` defc: nav aside + article
   with .panel-wrap.is-<tab> panes. State lives in Settings_state;
   theme/language select helpers in Settings_view. *)

open Lui_elements

let dom = Logseq_dom.dom
module T = I18n
module S = Settings_state
module V = Settings_view

let version = "2.0.1"

(* cljs ui/icon resolves via shui.icon.v2: svg first, font glyph as
   fallback — Icons.icon applies the same order *)
let icon ~key:_ name = Icons.icon name

(* svg/info *)
let info_icon ~key ~title =
  dom ~key ~tag:"span" ~style_class:"ls-info-icon"
    ~attrs:[ ("title", title); ("data-base-ui-tooltip-trigger", "") ]
    [ dom ~key:(key ^ "s") ~tag:"svg"
        ~attrs:
          [ ("class", "info"); ("viewBox", "0 0 16 16")
          ; ("width", "16px"); ("height", "16px") ]
        [ dom ~key:(key ^ "g") ~tag:"g"
            [ dom ~key:(key ^ "p") ~tag:"path"
                ~attrs:
                  [ ("style", "transform:scale(0.25)")
                  ; ( "d"
                    , "m32 2c-16.568 0-30 13.432-30 30s13.432 30 30 30 \
                       30-13.432 30-30-13.432-30-30-30m5 49.75h-10v-24h10v24m-5-29.5c-2.761 \
                       0-5-2.238-5-5s2.239-5 5-5c2.762 0 5 2.238 5 5s-2.238 \
                       5-5 5" )
                  ]
                []
            ]
        ]
    ]

(* ui/render-keyboard-shortcut -> span.keyboard-shortcut >
   span[style=inline-flex] > div.shui-shortcut-separate.shui-shortcut-glow
   > kbd.shui-shortcut-key *)
(* cljs print-shortcut-key (macOS): single letters uppercase, named keys
   map to their glyphs *)
let print_key k =
  match String.lowercase_ascii k with
  | "cmd" | "command" | "mod" -> "⌘"
  | "meta" -> "⌘"
  | "return" | "enter" -> "⏎"
  | "shift" -> "⇧"
  | "alt" | "option" | "opt" -> "⌥"
  | "ctrl" | "control" -> "Ctrl"
  | "space" -> "Space"
  | "up" -> "↑"
  | "down" -> "↓"
  | "left" -> "←"
  | "right" -> "→"
  | "tab" -> "Tab"
  | "delete" -> "⌫"
  | "backspace" -> "⌫"
  | s when String.length s = 1 -> String.uppercase_ascii s
  | s -> s

let kbd_seq ~key ~binding keys =
  dom ~key ~tag:"span" ~style_class:"keyboard-shortcut"
    [ dom ~key:(key ^ "w") ~tag:"span"
        ~style_class:"shui-shortcut-wrap"
        [ dom ~key:(key ^ "b") ~tag:"div"
            ~style_class:"shui-shortcut-glow shui-shortcut-separate"
            ~attrs:
              [ ("data-shortcut-binding", binding); ("aria-hidden", "true") ]
            (List.mapi
               (fun i k ->
                 dom ~key:(key ^ "-" ^ string_of_int i) ~tag:"kbd"
                   ~style_class:"shui-shortcut-key"
                   ~attrs:[ ("aria-hidden", "false") ]
                   ~text:(Platform.utf8 (print_key k)) [])
               keys)
        ]
    ]

let btn_base = "ui__button"

let variant_cls = function
  | `Solid -> "as-solid"
  | `Secondary -> "as-secondary"
  | `Outline -> "as-outline"
  | `Text -> "as-text"

let size_cls = function
  | `Default -> ""
  | `Sm -> "ls-btn-sm"

(* ui/toggle -> shui Switch size sm *)
let hidden_checkbox ~key ~on =
  dom ~key ~tag:"input"
    ~attrs:
      ([ ("type", "checkbox")
       ; ( "style"
         , "position: fixed; top: 0; left: 0; width: 1px; height: 1px; \
            clip-path: inset(50%); overflow: hidden;" ) ]
      @ if on then [ ("checked", "") ] else [])
    []

(* ui/toggle -> base-ui span.ui__switch[role=switch] + hidden input *)
let switch_el ~key ~on ~on_toggle =
  let chk = if on then "checked" else "unchecked" in
  dom ~key ~tag:"span"
    ~style_class:"ui__switch"
    ~attrs:
      [ ("role", "switch")
      ; ("aria-checked", string_of_bool on); ("data-" ^ chk, "") ]
    ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then on_toggle ())
    [ dom ~key:(key ^ "-th") ~tag:"span"
        ~style_class:"ui__switch-thumb"
        ~attrs:[ ("data-" ^ chk, "") ]
        []
    ]

(* shui/checkbox -> button role=checkbox + indicator span w/ check svg *)
let checkbox_el ~key ~on ~on_change =
  let chk = if on then "checked" else "unchecked" in
  dom ~key ~tag:"button"
    ~style_class:"ui__checkbox"
    ~attrs:
      [ ("type", "button"); ("role", "checkbox")
      ; ("aria-checked", string_of_bool on); ("data-" ^ chk, "")
      ; ("data-state", chk) ]
    ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then on_change (not on))
    (if on then
       [ dom ~key:(key ^ "-in") ~tag:"span"
           [ dom ~key:(key ^ "-ck") ~tag:"svg"
               ~style_class:"ls-icon-sm"
               ~attrs:
                 [ ("viewBox", "0 0 24 24"); ("fill", "none")
                 ; ("stroke", "currentColor"); ("stroke-width", "2")
                 ; ("stroke-linecap", "round")
                 ; ("stroke-linejoin", "round") ]
               [ dom ~key:(key ^ "-p") ~tag:"path"
                   ~attrs:[ ("d", "M20 6 9 17l-5-5") ] [] ]
           ]
       ]
     else [])

let label_el ~key ~for_ ~text ?text_signal children =
  dom ~key ~tag:"label"
    ~style_class:"ls-label"
    ~attrs:[ ("for", for_) ]
    ~text ?text_signal children

let txt ~key s = text ~key ~value:s []

(* cljs `toggle` row: label | switch (+detail); info icons are extra
   label children in cljs (sequential name) *)
let toggle_row ~key ~for_ ~label ?(label_extra = []) ?(detail = []) ~on
    ~on_toggle () =
  dom ~key
    ~style_class:"it"
    [ label_el ~key:(key ^ "-l") ~for_ ~text:label label_extra
    ; dom ~key:(key ^ "-c")
        ~style_class:"ls-it-value"
        [ dom ~key:(key ^ "-i") ~style_class:"ls-switch-wrap"
            (switch_el ~key:(key ^ "-sw") ~on ~on_toggle
             :: hidden_checkbox ~key:(key ^ "-sc") ~on
             :: detail)
        ]
    ]

(* show-brackets/wide-mode variant: label | switch | shortcut kbd *)
let shortcut_toggle_row ~key ~for_ ~label ~binding ~on ~on_toggle () =
  dom ~key
    ~style_class:"it"
    [ label_el ~key:(key ^ "-l") ~for_ ~text:label []
    ; dom ~key:(key ^ "-c")
        [ dom ~key:(key ^ "-i") ~style_class:"ls-switch-wrap ls-switch-narrow"
            [ switch_el ~key:(key ^ "-sw") ~on ~on_toggle
            ; hidden_checkbox ~key:(key ^ "-sc") ~on ]
        ]
    ; dom ~key:(key ^ "-k") ~style_class:"ls-kbd-cell"
        [ kbd_seq ~key:(key ^ "-ks") ~binding
            (String.split_on_char ' ' binding) ]
    ]

(* cljs row-with-button-action *)
let action_row ~key ~for_ ~label ?description ~actions ?(desc = [])
    ?(stretch = false) () =
  dom ~key ~style_class:"it ls-it-top"
    [ dom ~key:(key ^ "-lc") ~style_class:"ls-it-label-col"
        ([ label_el ~key:(key ^ "-l") ~for_ ~text:label [] ]
        @
        match description with
        | Some d ->
            [ dom ~key:(key ^ "-d") ~style_class:"ls-it-desc"
                ~text:d []
            ]
        | None -> [])
    ; dom ~key:(key ^ "-rc")
        ~style_class:"ls-it-actions"
        ([ dom ~key:(key ^ "-a")
             ~attrs:(if stretch then [ ("style", "width: 100%") ] else [])
             actions ]
        (* cljs renders the desc cell unconditionally *)
        @ [ dom ~key:(key ^ "-desc") ~style_class:"ls-it-side" desc ])
    ]

(* ---- general pane ---- *)

let revision = "dev" (* logseq.common.version/REVISION — goog-define default *)

let version_row () =
  action_row ~key:"ver" ~for_:"current-version" ~label:T.current_version
    ~actions:
      [ dom ~key:"ver-a" ~tag:"span"
          ~style_class:"cp__settings-app-updater"
          [ dom ~key:"ver-c" ~style_class:"ctls"
              [ dom ~key:"ver-i"
                  ~style_class:"ls-ver-wrap"
                  [ dom ~key:"ver-b" []
                  ; dom ~key:"ver-v" ~style_class:"ls-ver-text"
                      ~attrs:
                        [ ("title", T.revision_title revision) ]
                      ~text:version []
                  ; dom ~key:"ver-cl" ~tag:"a"
                      ~style_class:"fade-link"
                      ~attrs:
                        [ ("target", "_blank")
                        ; ( "href"
                          , "https://docs.logseq.com/#/page/changelog" )
                        ]
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
  action_row ~key:"lang" ~for_:"preferred_language"
    ~label:T.language_label
    ~actions:
      [ V.lang_trigger ~key:"lang-sel" ~h_cls:"ls-select-md" ~st:lang_label
          ~anchor_sel:"#settings-lang-trigger"
      ; dom ~key:"lang-sel-i" ~tag:"input"
          ~attrs:
            [ ( "style"
              , "position: fixed; top: 0; left: 0; width: 1px; height: 1px; \
                 clip-path: inset(50%); overflow: hidden;" )
            ; ("value", V.current_lang ()) ]
          []
      ]
    ()

let theme_row ctx =
  let mode = Signal.state ctx.Lui_ui.ui_scheduler (V.current_mode ()) in
  dom ~key:"theme"
    ~style_class:"it ls-it-top"
    [ dom ~key:"theme-lc" ~style_class:"ls-it-label-col"
        [ label_el ~key:"theme-l" ~for_:"toggle_theme" ~text:""
            ~text_signal:
              (Logseq_dom.reactive_text
                 (fun m ->
                   let effective =
                     if m = "system" then
                       if Browser_ui.prefers_dark () then "dark"
                       else "light"
                     else m
                   in
                   T.switch_to_theme
                     (if effective = "dark" then T.theme_light
                      else T.theme_dark))
                 (Signal.value mode))
            []
        ]
    ; dom ~key:"theme-rc"
        ~style_class:"ls-it-actions"
        [ dom ~key:"theme-a" [ V.theme_modes_ul ~st:mode ]
        ; dom ~key:"theme-desc" ~style_class:"ls-it-side"
            [ kbd_seq ~key:"theme-k" ~binding:"t t" [ "t"; "t" ] ]
        ]
    ]

let font_button ~key ~label ~active ~on_click =
  dom ~key ~tag:"button"
    ~style_class:
      (btn_base ^ " " ^ variant_cls `Secondary ^ " ls-font-btn"
     ^ if active then " ls-active" else "")
    ~attrs:
      [ ("type", "button")
      ; ("aria-pressed", string_of_bool active) ]
    ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then on_click ())
    [ dom ~key:(key ^ "-s") ~tag:"span"
        ~style_class:
          ("ls-font ls-font-" ^ String.lowercase_ascii label)
        [ dom ~key:(key ^ "-ag") ~tag:"strong" ~text:"Ag" []
        ; dom ~key:(key ^ "-sm") ~tag:"small" ~text:label []
        ]
    ]

let editor_font_row () =
  let font = S.current_editor_font () in
  let fb t label =
    font_button ~key:("font-" ^ t) ~label ~active:(font.S.ftype = t)
      ~on_click:(fun () -> S.set_editor_font_type t)
  in
  dom ~key:"font" ~style_class:"it"
    [ label_el ~key:"font-l" ~for_:"font_family" ~text:T.editor_font []
    ; dom ~key:"font-r" ~style_class:"ls-it-value-col"
        [ dom ~key:"font-btns" ~style_class:"ls-row-gap"
            [ fb "default" "Default"; fb "serif" "Serif"; fb "mono" "Mono" ]
        ; dom ~key:"font-g" ~style_class:"ls-font-global"
            [ dom ~key:"font-gl" ~tag:"label"
                ~style_class:"ls-check-row"
                [ checkbox_el ~key:"font-gc" ~on:font.S.fglobal
                    ~on_change:(fun b -> S.set_editor_font_global b)
                ; hidden_checkbox ~key:"font-gi" ~on:font.S.fglobal
                ; dom ~key:"font-gt" ~tag:"span"
                    ~style_class:"ls-check-label"
                    ~text:T.editor_font_global []
                ]
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

let accent_swatch ~key ~modal ~current color =
  let active = color = current and none = color = "none" in
  let outline = if active then "07" else "06" in
  dom ~key ~style_class:"ls-swatch-cell"
    [ dom ~key:(key ^ "-b") ~tag:"button"
        ~style_class:
          (btn_base ^ " " ^ variant_cls `Text ^ " ls-swatch")
        ~attrs:
          ([ ("type", "button"); ("title", color_label color)
           ; ( "style"
             , Printf.sprintf
                 "background-color: var(--rx-%s-09); outline-color: \
                  var(--rx-%s-%s); outline-width: %s; outline-style: \
                  solid; opacity: %s"
                 color color outline
                 (if active then "4px" else "1px")
                 (if active then "1" else "0.5") )
           ]
          @
          if modal && active then [ ("autofocus", "true") ] else [])
        ~events:"click"
        ~on_dom_event:(fun n _ -> if n = "click" then S.set_accent color)
        [ dom ~key:(key ^ "-s") ~tag:"strong"
            ~style_class:
              (if none then "ls-swatch-none"
               else
                 "ls-swatch-dot")
            ~attrs:
              [ ( "style"
                , Printf.sprintf
                    "background-color: %s; opacity: %s"
                    (if none then "" else "var(--rx-" ^ color ^ "-07)")
                    (if none || active then "1" else "0") )
              ]
            []
        ]
    ]

let accent_row ~modal =
  let current = S.current_accent () in
  let swatches =
    dom ~key:"acc-l"
      ~style_class:
        ("cp__accent-colors-list-wrap"
       ^ if modal then " as-modal-picker" else "")
      (List.mapi
         (fun i c ->
           accent_swatch ~key:("acc-" ^ string_of_int i) ~modal ~current c)
         ("none" :: "logseq" :: color_names))
  in
  dom ~key:"acc"
    [ action_row ~key:"acc-r" ~for_:"toggle_radix_theme"
        ~label:T.accent_color
        ~actions:[ swatches ] ~stretch:modal
        ~desc:
          (if modal then []
           else
             [ dom ~key:"acc-sp" ~tag:"span" ~style_class:"ls-kbd-side"
                 [ kbd_seq ~key:"acc-k" ~binding:"c c" [ "c"; "c" ] ]
             ])
        ()
    ; dom ~key:"acc-n" ~style_class:"ls-desc"
        ~text:T.accent_color_alert []
    ]

let edit_link_row ~key ~label ~button ~href ~for_ () =
  action_row ~key ~for_ ~label
    ~actions:
      [ dom ~key:(key ^ "-a") ~tag:"a"
          ~style_class:
            ("ui__link " ^ btn_base ^ " " ^ variant_cls `Solid ^ " "
             ^ size_cls `Sm)
          ~attrs:[ ("href", href); ("role", "button") ]
          ~text:button []
      ]
    ()

let general_pane ~modal ctx =
  dom ~key:"pane-general" ~style_class:"panel-wrap is-general"
    [ version_row ()
    ; language_row ctx
    ; theme_row ctx
    ; editor_font_row ()
    ; accent_row ~modal
    ; edit_link_row ~key:"cfg" ~label:T.config_custom_configuration
        ~button:T.edit_config_edn ~href:"#/file/logseq%2Fconfig.edn"
        ~for_:"config_edn" ()
    ; edit_link_row ~key:"css" ~label:T.config_custom_theme
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

let date_format_row () =
  let current = (S.value ()).S.date_format in
  let options =
    List.sort_uniq String.compare (current :: journal_formatters)
  in
  (* cljs date-format-row carries a duplicated hiccup class shorthand;
     reproduced verbatim for DOM parity *)
  dom ~key:"dfmt"
    ~style_class:"it sm:grid sm:grid-cols-3 sm:gap-4 sm:items-:div it sm:grid \
                  sm:grid-cols-3 sm:gap-4 sm:items-center"
    [ label_el ~key:"dfmt-l" ~for_:"custom_date_format"
        ~text:T.custom_date_format []
    ; dom ~key:"dfmt-r" ~style_class:"ls-it-value"
        [ dom ~key:"dfmt-w" ~style_class:"ls-select-wrap"
            [ dom ~key:"dfmt-s" ~tag:"select"
                ~style_class:"form-select is-small"
                ~attrs:[ ("value", current) ]
                ~events:"change"
                ~on_dom_event:(fun n p ->
                  if n = "change" then
                    let fmt =
                      Platform.payload_str p "value"
                    in
                    if String.trim fmt <> "" then (
                      S.set_date_format fmt;
                      Toast.success T.refresh_required;
                      Dialogs_state.close_all ()))
                (List.map
                   (fun fmt ->
                     dom ~key:("dfmt-o-" ^ fmt) ~tag:"option"
                       ~text:(date_option_text fmt)
                       ~attrs:
                         (if fmt = current
                          then [ ("selected", "selected") ]
                          else [])
                       [])
                   options)
            ]
        ]
    ]

let editor_pane () =
  dom ~key:"pane-editor" ~style_class:"panel-wrap is-editor"
    [ date_format_row ()
    ; shortcut_toggle_row ~key:"brackets" ~for_:"show_brackets"
        ~label:T.show_brackets ~binding:"t b"
        ~on:(S.config_bool "ui/show-brackets?" ~default:true)
        ~on_toggle:(fun () ->
          S.config_toggle "ui/show-brackets?" ~default:true)
        ()
    ; shortcut_toggle_row ~key:"wide" ~for_:"wide_mode" ~label:T.wide_mode
        ~binding:"t w"
        ~on:(S.storage_bool "wide-mode" ~default:false)
        ~on_toggle:S.toggle_wide_mode ()
    ; toggle_row ~key:"outdent" ~for_:"preferred_outdenting"
        ~label:T.logical_outdenting
        ~label_extra:[ info_icon ~key:"outdent-i" ~title:T.outdenting_hint ]
        ~on:(S.config_bool "editor/logical-outdenting?" ~default:false)
        ~on_toggle:(fun () ->
          S.config_toggle "editor/logical-outdenting?" ~default:false)
        ()
    ; toggle_row ~key:"fullb" ~for_:"show_full_blocks"
        ~label:T.show_full_blocks
        ~on:(S.config_bool "ui/show-full-blocks?" ~default:false)
        ~on_toggle:(fun () ->
          S.config_toggle "ui/show-full-blocks?" ~default:false)
        ()
    ; toggle_row ~key:"pasting" ~for_:"preferred_pasting_file"
        ~label:T.preferred_pasting
        ~label_extra:[ info_icon ~key:"pasting-i" ~title:T.pasting_hint ]
        ~on:(S.config_bool "editor/preferred-pasting-file?" ~default:false)
        ~on_toggle:(fun () ->
          S.config_toggle "editor/preferred-pasting-file?" ~default:false)
        ()
    ; toggle_row ~key:"autoexp" ~for_:"auto_expand_block_refs"
        ~label:T.auto_expand_refs
        ~label_extra:[ info_icon ~key:"autoexp-i" ~title:T.auto_expand_hint ]
        ~on:(S.config_bool "ui/auto-expand-block-refs?" ~default:true)
        ~on_toggle:(fun () ->
          S.config_toggle "ui/auto-expand-block-refs?" ~default:true)
        ()
    ; toggle_row ~key:"sttip" ~for_:"enable_tooltip"
        ~label:T.shortcut_tooltip
        ~on:(S.storage_bool "shortcut-tooltip?" ~default:true)
        ~on_toggle:S.toggle_shortcut_tooltip ()
    ; toggle_row ~key:"tooltips" ~for_:"enable_tooltip"
        ~label:T.tooltips
        ~on:(S.config_bool "ui/enable-tooltip?" ~default:true)
        ~on_toggle:(fun () ->
          S.config_toggle "ui/enable-tooltip?" ~default:true)
        ()
    ; toggle_row ~key:"puball" ~for_:"all pages public"
        ~label:T.all_pages_public
        ~on:(S.config_bool "publishing/all-pages-public?" ~default:false)
        ~on_toggle:(fun () ->
          S.config_toggle "publishing/all-pages-public?" ~default:false)
        ()
    ]

(* ---- keymap pane (components/shortcut.cljs page) ---- *)

let keymap_pill ~key ~title ~count ~active =
  dom ~key ~tag:"button"
    ~style_class:
      (if active then "shortcut-filter-pill--active shortcut-filter-pill"
       else "shortcut-filter-pill")
    [ dom ~key:(key ^ "t") ~tag:"span"
        ~style_class:"shortcut-filter-pill-title" ~text:title []
    ; dom ~key:(key ^ "c") ~tag:"span"
        ~style_class:"shortcut-filter-pill-count"
        ~text:(Platform.utf8 "\xc2\xb7 " ^ count) []
    ]

let keymap_controls () =
  dom ~key:"km-ctl" ~tag:"header"
    [ dom ~key:"km-pc" ~style_class:"cp__shortcut-page-x-pane-controls"
        [ dom ~key:"km-tb" ~style_class:"shortcut-toolbar-row"
            [ dom ~key:"km-sw" ~tag:"span" ~style_class:"search-input-wrap"
                [ dom ~key:"km-si" ~tag:"span" ~style_class:"search-icon"
                    [ icon ~key:"km-sic" "search" ]
                ; dom ~key:"km-in" ~tag:"input"
                    ~style_class:"form-input is-small"
                    ~attrs:[ ("placeholder", T.keymap_search_placeholder) ]
                    []
                ]
            ; dom ~key:"km-kb" ~tag:"button"
                ~style_class:"shortcut-keystroke-inactive"
                [ icon ~key:"km-kbi" "keyboard"
                ; dom ~key:"km-kbt" ~tag:"span"
                    ~text:T.keymap_search_by_keys []
                ]
            ]
        ; dom ~key:"km-pills" ~style_class:"shortcut-pills-row"
            [ dom ~key:"km-fp" ~style_class:"shortcut-filter-pills"
                [ keymap_pill ~key:"km-pa" ~title:T.keymap_all ~count:"125"
                    ~active:true
                ; keymap_pill ~key:"km-pc" ~title:T.keymap_custom ~count:"0"
                    ~active:false
                ; keymap_pill ~key:"km-pu" ~title:T.keymap_unset ~count:"18"
                    ~active:false
                ; keymap_pill ~key:"km-pd" ~title:T.keymap_disabled
                    ~count:"4" ~active:false
                ]
            ; dom ~key:"km-sec" ~style_class:"ls-toolbar-gap"
                [ dom ~key:"km-fold" ~tag:"button"
                    ~style_class:"icon-link"
                    ~attrs:[ ("aria-label", T.keymap_toggle_categories) ]
                    [ icon ~key:"km-foldi" "fold" ]
                ; dom ~key:"km-rf" ~tag:"button"
                    ~style_class:"icon-link"
                    ~attrs:[ ("aria-label", T.keymap_refresh_all) ]
                    [ icon ~key:"km-rfi" "refresh" ]
                ]
            ]
        ]
    ]

let keymap_binding ~key (b : Keymap_data.binding) =
  let open Keymap_data in
  let cls = "shui-shortcut-" ^ b.kind ^ " shui-shortcut-glow" in
  dom ~key ~tag:"span" ~style_class:"ls-dc"
    [ dom ~key:(key ^ "w") ~tag:"span"
        ~style_class:"shui-shortcut-wrap"
        [ dom ~key:(key ^ "d") ~tag:"div" ~style_class:cls
            ~attrs:
              ((if b.data = "" then []
                else [ ("data-shortcut-binding", b.data) ]))
            (List.concat
             @@ List.mapi
                  (fun i k ->
                 (if i > 0 && b.kind = "combo" then
                    [ dom
                        ~key:(key ^ "s" ^ string_of_int i)
                        ~tag:"span" ~style_class:"shui-shortcut-separator" []
                    ]
                  else [])
                 @ [ dom
                       ~key:(key ^ "k" ^ string_of_int i)
                       ~tag:"kbd" ~style_class:"shui-shortcut-key"
                       ~text:(Platform.utf8 k) []
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
  dom ~key ~tag:"li" ~style_class:"th"
    ~attrs:[ ("role", "button") ]
    [ dom ~key:(key ^ "s") ~tag:"strong" ~style_class:"ls-th-strong"
        ~text:(I18n.t (keymap_category label)) []
    ; dom ~key:(key ^ "i") ~tag:"i" ~style_class:"ls-row"
        [ icon ~key:(key ^ "c") "chevron-down" ]
    ]

let keymap_row ~key (r : Keymap_data.row) =
  let open Keymap_data in
  dom ~key ~tag:"li"
    ~style_class:"shortcut-row"
    ~attrs:[ ("role", "button") ]
    [ dom ~key:(key ^ "l") ~tag:"span" ~style_class:"label-wrap"
        [ dom ~key:(key ^ "lt") ~tag:"span" ~attrs:[ ("title", r.title) ]
            [ dom ~key:(key ^ "lx") ~tag:"span" ~style_class:"ls-kbd-label"
                ~text:(I18n.t (command_key_of r.title)) []
            ]
        ]
    ; dom ~key:(key ^ "a") ~tag:"span" ~style_class:"action-wrap"
        (if r.unset then
           [ dom ~key:(key ^ "u") ~tag:"span"
               ~style_class:"shortcut-status-label" ~text:T.keymap_unset []
           ]
         else
           List.mapi
             (fun i b ->
               keymap_binding ~key:(key ^ "b" ^ string_of_int i) b)
             r.bindings)
    ]

let keymap_pane () =
  dom ~key:"pane-keymap" ~style_class:"cp__shortcut-page-x"
    ~attrs:[ ("style", "--shortcut-header-h: 85px;") ]
    [ keymap_controls ()
    ; dom ~key:"km-art" ~tag:"article"
        [ dom ~key:"km-ul" ~tag:"ul" ~style_class:"ls-plain-list"
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
  dom ~key ~tag:"button"
    ~style_class:
      (btn_base ^ " " ^ variant_cls `Solid ^ " ls-btn-sm")
    ~attrs:[ ("type", "button") ]
    ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then on_open ())
    [ dom ~key:(key ^ "-s") ~tag:"span" ~style_class:"ls-row"
        [ dom ~key:(key ^ "-t") ~tag:"span" ~style_class:"ls-btn-label"
            ~text:label []
        ; icon ~key:(key ^ "-e") "edit"
        ]
    ]

let storage_url key default =
  match Platform.local_storage_get key with
  | Some v ->
      let v = V.unquote v in
      if String.trim v = "" then default else v
  | None -> default

let advanced_pane () =
  dom ~key:"pane-advanced" ~style_class:"panel-wrap is-advanced"
    [ toggle_row ~key:"usage" ~for_:"usage-diagnostics"
        ~label:T.usage_diagnostics
        ~detail:
          [ dom ~key:"usage-d" ~tag:"span"
              ~style_class:"ls-desc" ~text:T.usage_diagnostics_desc
              []
          ]
        ~on:(not (S.instrument_disabled ()))
        ~on_toggle:S.toggle_usage_diagnostics ()
    ; toggle_row ~key:"devm" ~for_:"developer_mode"
        ~label:T.developer_mode
        ~detail:
          [ dom ~key:"devm-d" ~tag:"div"
              ~style_class:"ls-desc" ~text:T.developer_mode_desc
              []
          ]
        ~on:(S.developer_mode ()) ~on_toggle:S.toggle_developer_mode ()
    ; action_row ~key:"syncurl" ~for_:"sync_server_url"
        ~label:T.sync_server_url
        ~actions:
          [ url_button ~key:"syncurl-b"
              ~label:(storage_url "sync-server-url" "Logseq Sync")
              ~on_open:(fun () -> Dialogs_state.open_ "sync-server")
          ]
        ()
    ; action_row ~key:"puburl" ~for_:"publish_server_url"
        ~label:T.publish_server_url
        ~actions:
          [ url_button ~key:"puburl-b"
              ~label:(storage_url "publish-server-url" T.publish_default)
              ~on_open:(fun () -> Dialogs_state.open_ "publish-server")
          ]
        ()
    ]

(* ---- features pane ---- *)

let home_page_input_events _n p =
  let value =
    Platform.payload_str p "value"
  in
  S.set_home_page value (fun res ->
      match res with
      | S.Home_ok -> Toast.success T.home_updated
      | S.Home_missing -> Toast.warning (T.page_not_found_msg value))

let home_page_row () =
  let current =
    match S.config_get "default-home" with
    | Some (Wire.Map kvs) -> (
        match Wire.get (Wire.Map kvs) "page" with
        | Some (Wire.String s) -> s
        | _ -> "")
    | _ -> ""
  in
  dom ~key:"homep"
    ~style_class:"it"
    [ label_el ~key:"homep-l" ~for_:"default page"
        ~text:T.home_default_page []
    ; dom ~key:"homep-r" ~style_class:"ls-it-value"
        [ dom ~key:"homep-w" ~style_class:"ls-select-wrap"
            [ dom ~key:"homep-in" ~tag:"input" ~id:"home-default-page"
                ~style_class:
                  "form-input is-small"
                ~attrs:[ ("value", current) ]
                ~events:"blur keypress"
                ~on_dom_event:(fun n p ->
                  match n with
                  | "blur" -> home_page_input_events n p
                  | "keypress" -> (
                      match
                        Platform.payload_str p "key"
                      with
                      | "Enter" -> home_page_input_events n p
                      | _ -> ())
                  | _ -> ())
                []
            ]
        ]
    ]

let features_pane () =
  dom ~key:"pane-features" ~style_class:"panel-wrap is-features ls-mb"
    [ home_page_row ()
    ; action_row ~key:"plugs" ~for_:"plugin_system"
        ~label:T.plugins_label
        ~actions:
          [ dom ~key:"plugs-a" ~style_class:"ls-toolbar-gap"
              [ switch_el ~key:"plugs-sw" ~on:(S.plugin_system ())
                  ~on_toggle:S.toggle_plugin_system
              ; hidden_checkbox ~key:"plugs-sc" ~on:(S.plugin_system ())
              ]
          ]
        ()
    ; action_row ~key:"cards" ~for_:"flashcards"
        ~label:T.flashcards
        ~actions:
          [ switch_el ~key:"cards-sw"
              ~on:(S.config_bool "feature/enable-flashcards?" ~default:true)
              ~on_toggle:(fun () ->
                S.config_toggle "feature/enable-flashcards?" ~default:true)
          ; hidden_checkbox ~key:"cards-sc"
              ~on:(S.config_bool "feature/enable-flashcards?" ~default:true)
          ]
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

let tab_title = function
  | "editor" -> T.settings_editor
  | "keymap" -> T.settings_keymap
  | "advanced" -> T.settings_advanced
  | "features" -> T.settings_features
  | _ -> T.settings_general

let nav_item ~key (id, label, icn) =
  dom ~key ~tag:"li" ~style_class:"settings-menu-item"
    ~attrs:[ ("data-id", id) ]
    ~style_class_signal:(Logseq_dom.reactive_class
         (fun (s : S.t) ->
           if s.tab = id then "active settings-menu-item"
           else "settings-menu-item")
         (S.signal ()))
    ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then S.set_tab id)
    [ dom ~key:(key ^ "-b") ~tag:"button"
        ~style_class:"settings-menu-link"
        ~attrs:[ ("type", "button") ]
        [ icon ~key:(key ^ "-i") icn
        ; dom ~key:(key ^ "-t") ~tag:"strong" ~text:label []
        ]
    ]

let pane_of ~modal ctx tab =
  match tab with
  | "editor" -> editor_pane ()
  | "keymap" -> keymap_pane ()
  | "advanced" -> advanced_pane ()
  | "features" -> features_pane ()
  | _ -> general_pane ~modal ctx

let article ~modal ctx =
  dom ~key:"settings-article" ~tag:"article"
    [ dom ~key:"art-h" ~tag:"header" ~style_class:"cp__settings-header"
        [ dom ~key:"art-ht" ~tag:"h1"
            ~style_class:"cp__settings-category-title"
            ~text_signal:(Logseq_dom.reactive_text (fun (s : S.t) -> tab_title s.tab) (S.signal ()))
            []
        ]
    ; dyn ~equal:( = ) (fun (s : S.t) -> pane_of ~modal ctx s.tab)
        (S.signal ())
    ]

let inner ~modal : t =
 fun ctx parent ->
  S.ensure ctx;
  S.activate ();
  let node =
    dom ~key:"settings" ~id:"settings" ~style_class:"cp__settings-main"
      [ dom ~key:"settings-inner" ~style_class:"cp__settings-inner"
          [ dom ~key:"settings-aside" ~tag:"aside"
              ~style_class:"settings-aside"
              [ dom ~key:"aside-h" ~tag:"header"
                  ~style_class:"cp__settings-header"
                  [ dom ~key:"aside-ht" ~tag:"h1"
                      ~style_class:"cp__settings-modal-title"
                      ~text:T.settings_title []
                  ]
              ; dom ~key:"aside-menu" ~tag:"ul"
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
      dom ~key:"settings-modal" ~style_class:"settings-modal"
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
  ; shortcut_toggle_row ~key:"app-wide" ~for_:"wide_mode"
      ~label:T.wide_mode ~binding:"t w"
      ~on:(S.storage_bool "wide-mode" ~default:false)
      ~on_toggle:S.toggle_wide_mode ()
  ; shortcut_toggle_row ~key:"app-brackets" ~for_:"show_brackets"
      ~label:T.show_brackets ~binding:"t b"
      ~on:(S.config_bool "ui/show-brackets?" ~default:true)
      ~on_toggle:(fun () ->
        S.config_toggle "ui/show-brackets?" ~default:true)
      ()
  ; accent_row ~modal:true
  ]

let appearance_body (x, y) : t =
 fun ctx parent ->
  S.ensure ctx;
  let right = Float.max 8. (inner_width -. x) in
  let node =
    dom ~key:"appearance-popup" ~tag:"div"
      [ (* cljs shui popup-show! dismisses on outside click — the
           transparent backdrop does the hit-testing *)
        dom ~key:"appearance-backdrop" ~tag:"div"
          ~style_class:"ls-popup-backdrop"
          ~events:"click"
          ~on_dom_event:(fun name _ ->
            if name = "click" then
              Runtime.send (Action.Appearance_set None))
          []
      ; dom ~key:"appearance-wrap" ~tag:"div"
          ~style_class:"ui__dropdown-menu-content appearance-popup"
          ~attrs:
            [ ( "style"
              , Printf.sprintf "position:fixed;right:%.0fpx;top:%.0fpx"
                  right y )
            ]
          [ dom ~key:"appearance_settings" ~id:"appearance_settings"
              ~style_class:"cp__settings-appearance-dialog-inner"
              [ dyn ~equal:( == ) (fun (_ : S.t) ->
                    dom ~key:"app-rows" (appearance_rows ctx))
                  (S.signal ()) ]
          ]
      ]
  in
  node ctx parent
