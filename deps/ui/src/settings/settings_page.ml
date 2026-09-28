(* Settings page (#/settings) and settings dialog shared panel.
   Mirrors components/settings.cljs `settings` defc: nav aside + article
   with .panel-wrap.is-<tab> panes. State lives in Settings_state;
   theme/language select helpers in Settings_view. *)

open Lui_elements

let dom = Logseq_dom.dom
module T = Graphs_text
module S = Settings_state
module V = Settings_view

let version = "2.0.1"

let extension_icons =
  [ "add-link"; "app-feature"; "block"; "block-search"; "cloud-exclamation"
  ; "connector"; "group"; "h-auto"; "heading-off"; "internal-link"
  ; "link-to-block"; "link-to-page"; "link-to-whiteboard"
  ; "move-to-sidebar-right"; "new-block"; "new-page"; "new-whiteboard"
  ; "new-whiteboard-element"; "object-compact"; "object-expanded"
  ; "open-as-page"; "page"; "page-search"; "references-hide"
  ; "references-show"; "select-cursor"; "text"; "ungroup"; "whiteboard"
  ; "whiteboard-element"; "whiteboard-search" ]

(* shui icon: tabler -> span.ui__icon.ti.ls-icon-<n> (i.ti inside, like
   views_dom), extension names -> span.ui__icon.tie tie-<n> font icon *)
let icon ~key name =
  if List.mem name extension_icons then
    dom ~key ~tag:"span" ~style_class:("ui__icon tie tie-" ^ name) []
  else
    dom ~key ~tag:"span" ~style_class:("ui__icon ti ls-icon-" ^ name)
      [ dom ~key:(key ^ "-i") ~tag:"i" ~style_class:("ti ti-" ^ name) [] ]

(* svg/info — <g> flattened (dom has no g tag) *)
let info_icon ~key ~title =
  dom ~key ~tag:"span" ~style_class:"flex px-2"
    ~attrs:[ ("title", title); ("data-base-ui-tooltip-trigger", "") ]
    [ dom ~key:(key ^ "s") ~tag:"svg"
        ~attrs:
          [ ("class", "info"); ("viewBox", "0 0 16 16")
          ; ("width", "16px"); ("height", "16px") ]
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

(* ui/render-keyboard-shortcut -> span.keyboard-shortcut >
   div.shui-shortcut-separate[data-shortcut-binding] > kbd.shui-shortcut-key *)
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
    [ dom ~key:(key ^ "b") ~tag:"div"
        ~style_class:"shui-shortcut-separate"
        ~attrs:
          [ ("data-shortcut-binding", binding); ("aria-hidden", "true")
          ; ("style", "white-space: nowrap; gap: 4px")
          ]
        (List.mapi
           (fun i k ->
             dom ~key:(key ^ "-" ^ string_of_int i) ~tag:"kbd"
               ~style_class:"shui-shortcut-key"
               ~attrs:[ ("aria-hidden", "true") ]
               ~text:(print_key k) [])
           keys)
    ]

let btn_base =
  "ui__button inline-flex cursor-pointer items-center justify-center \
   whitespace-nowrap rounded-md text-sm gap-1 font-medium \
   ring-offset-background transition-colors focus-visible:outline-none \
   focus-visible:ring-2 focus-visible:ring-ring \
   focus-visible:ring-offset-2 disabled:pointer-events-none \
   disabled:opacity-50 select-none"

let variant_cls = function
  | `Solid ->
      "bg-primary/90 hover:bg-primary/100 active:opacity-90 \
       text-primary-foreground hover:text-primary-foreground as-solid"
  | `Secondary ->
      "bg-secondary/70 text-secondary-foreground hover:bg-secondary/100 \
       active:opacity-80 as-secondary"
  | `Outline ->
      "border bg-background hover:bg-accent hover:text-accent-foreground \
       active:opacity-80 as-outline"
  | `Text ->
      "hover:bg-secondary/70 hover:text-secondary-foreground \
       active:opacity-80 as-text"

let size_cls = function
  | `Default -> "h-10 px-4 py-2"
  | `Sm -> "h-7 rounded px-3 py-1"

(* ui/toggle -> shui Switch size sm *)
let switch_el ~key ~on ~on_toggle =
  let chk = if on then "checked" else "unchecked" in
  dom ~key ~tag:"button"
    ~style_class:
      ("ui__switch peer inline-flex shrink-0 cursor-pointer items-center \
        rounded-full border-2 border-transparent transition-colors \
        focus-visible:outline-none focus-visible:ring-2 \
        focus-visible:ring-ring focus-visible:ring-offset-2 \
        disabled:cursor-not-allowed disabled:opacity-50 \
        data-[checked]:justify-end data-[checked]:bg-primary \
        data-[unchecked]:justify-start data-[unchecked]:bg-input \
        pr-[1px] pl-[1px] h-4.5 w-8")
    ~attrs:
      [ ("type", "button"); ("role", "switch")
      ; ("aria-checked", string_of_bool on); ("data-" ^ chk, "") ]
    ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then on_toggle ())
    [ dom ~key:(key ^ "-th") ~tag:"span"
        ~style_class:
          "pointer-events-none block rounded-full bg-background \
           shadow-lg ring-0 transition-transform h-3 w-3"
        ~attrs:[ ("data-" ^ chk, "") ]
        []
    ]

(* shui/checkbox -> button role=checkbox + indicator span w/ check svg *)
let checkbox_el ~key ~on ~on_change =
  let chk = if on then "checked" else "unchecked" in
  dom ~key ~tag:"button"
    ~style_class:
      "ui__checkbox peer h-4 w-4 shrink-0 cursor-pointer rounded-sm \
       border border-primary ring-offset-background \
       focus-visible:outline-none focus-visible:ring-2 \
       focus-visible:ring-ring focus-visible:ring-offset-2 \
       disabled:cursor-not-allowed disabled:opacity-50 \
       data-[checked]:bg-primary data-[checked]:text-primary-foreground"
    ~attrs:
      [ ("type", "button"); ("role", "checkbox")
      ; ("aria-checked", string_of_bool on); ("data-" ^ chk, "")
      ; ("data-state", chk) ]
    ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then on_change (not on))
    (if on then
       [ dom ~key:(key ^ "-in") ~tag:"span"
           [ dom ~key:(key ^ "-ck") ~tag:"svg"
               ~style_class:"h-4 w-4"
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

let label_el ~key ~for_ children =
  dom ~key ~tag:"label"
    ~style_class:"block text-sm font-medium leading-5 opacity-70"
    ~attrs:[ ("for", for_) ]
    children

let txt ~key s = text ~key ~value:s []

(* cljs `toggle` row: label | switch (+detail); info icons are extra
   label children in cljs (sequential name) *)
let toggle_row ~key ~for_ ~label ?(label_extra = []) ?(detail = []) ~on
    ~on_toggle () =
  dom ~key
    ~style_class:"it sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center"
    [ label_el ~key:(key ^ "-l") ~for_
        (txt ~key:(key ^ "-lt") label :: label_extra)
    ; dom ~key:(key ^ "-c")
        ~style_class:"rounded-md sm:max-w-tss sm:col-span-2"
        [ dom ~key:(key ^ "-i") ~style_class:"rounded-md"
            ~attrs:[ ("style", "display: flex; gap: 1rem; align-items: center") ]
            (switch_el ~key:(key ^ "-sw") ~on ~on_toggle :: detail)
        ]
    ]

(* show-brackets/wide-mode variant: label | switch | shortcut kbd *)
let shortcut_toggle_row ~key ~for_ ~label ~binding ~on ~on_toggle () =
  dom ~key
    ~style_class:"it sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center"
    [ label_el ~key:(key ^ "-l") ~for_ [ txt ~key:(key ^ "-lt") label ]
    ; dom ~key:(key ^ "-c")
        [ dom ~key:(key ^ "-i") ~style_class:"rounded-md sm:max-w-xs"
            [ switch_el ~key:(key ^ "-sw") ~on ~on_toggle ]
        ]
    ; dom ~key:(key ^ "-k")
        ~attrs:[ ("style", "text-align: right") ]
        [ kbd_seq ~key:(key ^ "-ks") ~binding
            (String.split_on_char ' ' binding) ]
    ]

(* cljs row-with-button-action *)
let action_row ~key ~for_ ~label_children ?description ~action ?(desc = [])
    ?(stretch = false) () =
  dom ~key ~style_class:"it sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start"
    [ dom ~key:(key ^ "-lc") ~style_class:"flex flex-col"
        ([ label_el ~key:(key ^ "-l") ~for_ label_children ]
        @
        match description with
        | Some d ->
            [ dom ~key:(key ^ "-d") ~style_class:"text-xs text-gray-10"
                [ d ]
            ]
        | None -> [])
    ; dom ~key:(key ^ "-rc")
        ~style_class:"mt-1 sm:mt-0 sm:col-span-2 flex items-center"
        ~attrs:
          [ ("style", "display: flex; gap: 0.5rem; align-items: center") ]
        ([ dom ~key:(key ^ "-a")
             ~attrs:(if stretch then [ ("style", "width: 100%") ] else [])
             [ action ] ]
        @
        if desc = [] then []
        else [ dom ~key:(key ^ "-desc") ~style_class:"text-sm flex" desc ])
    ]

(* ---- general pane ---- *)

let revision = "dev" (* logseq.common.version/REVISION — goog-define default *)

let version_row () =
  action_row ~key:"ver" ~for_:"current-version"
    ~label_children:[ txt ~key:"ver-lt" T.current_version ]
    ~action:
      (dom ~key:"ver-a" ~tag:"span"
         ~style_class:"cp__settings-app-updater"
         [ dom ~key:"ver-c" ~style_class:"ctls flex items-center"
             [ dom ~key:"ver-i"
                 ~style_class:
                   "mt-1 sm:mt-0 sm:col-span-2 flex gap-4 items-center \
                    flex-wrap"
                 [ dom ~key:"ver-b" []
                 ; dom ~key:"ver-v" ~style_class:"text-sm cursor"
                     ~attrs:
                       [ ("title", T.revision_title revision) ]
                     ~text:version []
                 ; dom ~key:"ver-cl" ~tag:"a"
                     ~style_class:"text-sm fade-link underline inline"
                     ~attrs:
                       [ ("target", "_blank")
                       ; ( "href"
                         , "https://docs.logseq.com/#/page/changelog" )
                       ]
                     ~text:T.changelog []
                 ]
             ]
         ])
    ()

let language_row ctx =
  let lang_label =
    Signal.state ctx.Lui_ui.ui_scheduler
      (V.lang_label_for (V.current_lang ()))
  in
  action_row ~key:"lang" ~for_:"preferred_language"
    ~label_children:[ txt ~key:"lang-lt" T.language_label ]
    ~action:
      (V.lang_trigger ~key:"lang-sel" ~h_cls:"w-64 h-8" ~st:lang_label
         ~anchor_sel:"#settings-lang-trigger")
    ()

let theme_row ctx =
  let mode = Signal.state ctx.Lui_ui.ui_scheduler (V.current_mode ()) in
  action_row ~key:"theme" ~for_:"toggle_theme"
    ~label_children:
      [ dom ~key:"theme-lt" ~tag:"span"
          ~text_signal:
            (Signal.map
               (fun m ->
                 let effective =
                   if m = "system" then
                     if Browser_ui.prefers_dark () then "dark"
                     else "light"
                   else m
                 in
                 Lui_protocol.StringValue
                   (T.switch_to_theme
                      (if effective = "dark" then T.theme_light
                       else T.theme_dark)))
               (Signal.value mode))
          []
      ]
    ~action:(V.theme_modes_ul ~st:mode)
    ~desc:
      [ kbd_seq ~key:"theme-k" ~binding:"t t" [ "t"; "t" ] ]
    ()

let font_button ~key ~label ~active ~on_click =
  dom ~key ~tag:"button"
    ~style_class:
      (btn_base ^ " " ^ variant_cls `Secondary ^ " " ^ size_cls `Default
     ^ " cursor-pointer"
     ^ if active then " !border-primary border-[2px]" else "")
    ~attrs:[ ("type", "button") ]
    ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then on_click ())
    [ dom ~key:(key ^ "-s") ~tag:"span"
        ~style_class:("flex flex-col ls-font-" ^ String.lowercase_ascii label)
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
  dom ~key:"font" ~style_class:"it sm:grid sm:grid-cols-3 sm:gap-4"
    [ label_el ~key:"font-l" ~for_:"font_family"
        [ txt ~key:"font-lt" T.editor_font ]
    ; dom ~key:"font-r" ~style_class:"flex flex-col col-span-2"
        [ dom ~key:"font-btns" ~style_class:"flex gap-2"
            [ fb "default" "Default"; fb "serif" "Serif"; fb "mono" "Mono" ]
        ; dom ~key:"font-g" ~style_class:"pt-3"
            [ dom ~key:"font-gl" ~tag:"label"
                ~style_class:"w-full flex items-center cursor-pointer"
                [ checkbox_el ~key:"font-gc" ~on:font.S.fglobal
                    ~on_change:(fun b -> S.set_editor_font_global b)
                ; dom ~key:"font-gt" ~tag:"span"
                    ~style_class:"pl-1 text-sm opacity-70"
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
  dom ~key ~style_class:"flex items-center"
    [ dom ~key:(key ^ "-b") ~tag:"button"
        ~style_class:
          (btn_base ^ " " ^ variant_cls `Text ^ " " ^ size_cls `Default
         ^ " w-5 h-5 px-1 !rounded-full flex justify-center items-center \
            transition ease-in duration-100 hover:cursor-pointer \
            hover:opacity-100")
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
              (if none then "h-0.5 w-full bg-red-700"
               else
                 "w-2 h-2 !rounded-full transition ease-in duration-100")
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
        ~label_children:[ txt ~key:"acc-lt" T.accent_color ]
        ~action:swatches ~stretch:modal
        ~desc:
          (if modal then []
           else
             [ dom ~key:"acc-sp" ~tag:"span" ~style_class:"pl-6"
                 [ kbd_seq ~key:"acc-k" ~binding:"c c" [ "c"; "c" ] ]
             ])
        ()
    ; dom ~key:"acc-n" ~style_class:"text-sm opacity-50 mt-1"
        ~text:T.accent_color_alert []
    ]

let edit_link_row ~key ~label ~button ~href ~for_ () =
  action_row ~key ~for_ ~label_children:[ txt ~key:(key ^ "-lt") label ]
    ~action:
      (dom ~key:(key ^ "-a") ~tag:"a"
         ~style_class:(btn_base ^ " " ^ variant_cls `Solid ^ " " ^ size_cls `Sm)
         ~attrs:[ ("href", href); ("type", "button") ]
         ~text:button [])
    ()

let general_pane ~modal ctx =
  dom ~key:"pane-general" ~style_class:"panel-wrap is-general"
    [ version_row ()
    ; language_row ctx
    ; theme_row ctx
    ; editor_font_row ()
    ; accent_row ~modal
    ; edit_link_row ~key:"cfg" ~label:T.config_custom_configuration
        ~button:T.edit_config_edn ~href:"#/file/logseq/config.edn"
        ~for_:"config_edn" ()
    ; edit_link_row ~key:"css" ~label:T.config_custom_theme
        ~button:T.edit_custom_css ~href:"#/file/logseq/custom.css"
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
  ; "yyyy年MM月dd日" ]

let date_format_row () =
  let current = (S.value ()).S.date_format in
  let options =
    List.sort_uniq String.compare (current :: journal_formatters)
  in
  dom ~key:"dfmt"
    ~style_class:"it sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center"
    [ label_el ~key:"dfmt-l" ~for_:"custom_date_format"
        [ txt ~key:"dfmt-lt" T.custom_date_format ]
    ; dom ~key:"dfmt-r" ~style_class:"mt-1 sm:mt-0 sm:col-span-2"
        [ dom ~key:"dfmt-w" ~style_class:"max-w-lg rounded-md"
            [ dom ~key:"dfmt-s" ~tag:"select"
                ~style_class:"form-select is-small"
                ~attrs:[ ("value", current) ]
                ~events:"change"
                ~on_dom_event:(fun n p ->
                  if n = "change" then
                    let fmt =
                      Platform.payload_str
                        (Option.value p ~default:"{}") "value"
                    in
                    if String.trim fmt <> "" then (
                      S.set_date_format fmt;
                      Toast.success T.refresh_required;
                      Dialogs_state.close_all ()))
                (List.map
                   (fun fmt ->
                     dom ~key:("dfmt-o-" ^ fmt) ~tag:"option" ~text:fmt
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

(* ---- keymap pane (shortcut editor subsystem not ported) ---- *)

let keymap_pane () = dom ~key:"pane-keymap" ~style_class:"cp__shortcut-page-x" []

(* ---- advanced pane ---- *)

let url_button ~key ~label ~on_open =
  dom ~key ~tag:"button"
    ~style_class:
      (btn_base ^ " " ^ variant_cls `Solid ^ " " ^ size_cls `Sm ^ " text-sm")
    ~attrs:[ ("type", "button") ]
    ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then on_open ())
    [ dom ~key:(key ^ "-s") ~tag:"span" ~style_class:"flex items-center"
        [ dom ~key:(key ^ "-t") ~tag:"span" ~style_class:"pr-1"
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
              ~style_class:"text-sm opacity-50" ~text:T.usage_diagnostics_desc
              []
          ]
        ~on:(not (S.instrument_disabled ()))
        ~on_toggle:S.toggle_usage_diagnostics ()
    ; toggle_row ~key:"devm" ~for_:"developer_mode"
        ~label:T.developer_mode
        ~detail:
          [ dom ~key:"devm-d" ~tag:"div"
              ~style_class:"text-sm opacity-50" ~text:T.developer_mode_desc
              []
          ]
        ~on:(S.developer_mode ()) ~on_toggle:S.toggle_developer_mode ()
    ; action_row ~key:"syncurl" ~for_:"sync_server_url"
        ~label_children:[ txt ~key:"syncurl-lt" T.sync_server_url ]
        ~action:
          (url_button ~key:"syncurl-b"
             ~label:(storage_url "sync-server-url" "Logseq Sync")
             ~on_open:(fun () -> Dialogs_state.open_ "sync-server"))
        ()
    ; action_row ~key:"puburl" ~for_:"publish_server_url"
        ~label_children:[ txt ~key:"puburl-lt" T.publish_server_url ]
        ~action:
          (url_button ~key:"puburl-b"
             ~label:(storage_url "publish-server-url" T.publish_default)
             ~on_open:(fun () -> Dialogs_state.open_ "publish-server"))
        ()
    ]

(* ---- features pane ---- *)

let home_page_input_events _n p =
  let value =
    Platform.payload_str (Option.value p ~default:"{}") "value"
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
    ~style_class:"it sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center"
    [ label_el ~key:"homep-l" ~for_:"default page"
        [ txt ~key:"homep-lt" T.home_default_page ]
    ; dom ~key:"homep-r" ~style_class:"mt-1 sm:mt-0 sm:col-span-2"
        [ dom ~key:"homep-w" ~style_class:"max-w-lg rounded-md sm:max-w-xs"
            [ dom ~key:"homep-in" ~tag:"input" ~id:"home-default-page"
                ~style_class:
                  "form-input is-small transition duration-150 \
                   ease-in-out"
                ~attrs:[ ("value", current) ]
                ~events:"blur keypress"
                ~on_dom_event:(fun n p ->
                  match n with
                  | "blur" -> home_page_input_events n p
                  | "keypress" -> (
                      match
                        Platform.payload_str
                          (Option.value p ~default:"{}") "key"
                      with
                      | "Enter" -> home_page_input_events n p
                      | _ -> ())
                  | _ -> ())
                []
            ]
        ]
    ]

let features_pane () =
  dom ~key:"pane-features" ~style_class:"panel-wrap is-features mb-8"
    [ home_page_row ()
    ; action_row ~key:"plugs" ~for_:"plugin_system"
        ~label_children:[ txt ~key:"plugs-lt" T.plugins_label ]
        ~action:
          (dom ~key:"plugs-a" ~style_class:"flex items-center gap-2"
             [ switch_el ~key:"plugs-sw" ~on:(S.plugin_system ())
                 ~on_toggle:S.toggle_plugin_system ])
        ()
    ; action_row ~key:"cards" ~for_:"flashcards"
        ~label_children:[ txt ~key:"cards-lt" T.flashcards ]
        ~action:
          (switch_el ~key:"cards-sw"
             ~on:(S.config_bool "feature/enable-flashcards?" ~default:true)
             ~on_toggle:(fun () ->
               S.config_toggle "feature/enable-flashcards?" ~default:true))
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
    ~style_class_signal:
      (Logseq_dom.class_signal
         (Signal.map (fun (s : S.t) -> s.tab) (S.signal ()))
         (fun tab ->
           if tab = id then "settings-menu-item active"
           else "settings-menu-item"))
    ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then S.set_tab id)
    [ dom ~key:(key ^ "-b") ~tag:"button"
        ~style_class:"flex items-center settings-menu-link"
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
            ~text_signal:
              (Signal.map
                 (fun (s : S.t) ->
                   Lui_protocol.StringValue (tab_title s.tab))
                 (S.signal ()))
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
              ~style_class:"md:w-64"
              ~attrs:[ ("style", "min-width: 10rem") ]
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
      dom ~key:"settings-modal" ~style_class:"settings-modal"
        [ inner ~modal:true ]
    in
    node ctx parent
