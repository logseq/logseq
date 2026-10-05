(* Shared settings controls — the row/button/switch primitives the
   settings page, settings dialog, appearance popup and URL editor
   dialogs are built from. DOM output mirrors components/settings.cljs
   (ui/toggle, shui Switch/Checkbox, keyboard-shortcut, it rows) — keep
   class names and attrs pixel-identical. *)


let dom = Logseq_dom.dom

(* svg/info — cljs ui/icon resolves via shui.icon.v2 *)
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

(* ui/render-keyboard-shortcut -> span.keyboard-shortcut >
   span[style=inline-flex] > div.shui-shortcut-separate.shui-shortcut-glow
   > kbd.shui-shortcut-key *)
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

(* ---- buttons ---- *)

let btn_base = "ui__button"

let variant_cls = function
  | `Solid -> "as-solid"
  | `Secondary -> "as-secondary"
  | `Outline -> "as-outline"
  | `Text -> "as-text"

let size_cls = function
  | `Default -> ""
  | `Sm -> "ls-btn-sm"

(* ui__button + variant + size, caller appends extra classes *)
let btn_cls ?(variant = `Solid) ?(size = `Default) () =
  match size with
  | `Default -> btn_base ^ " " ^ variant_cls variant
  | `Sm -> btn_base ^ " " ^ variant_cls variant ^ " " ^ size_cls `Sm

(* ---- form controls ---- *)

(* clipped off-screen but still a real form control — cljs toggle rows
   keep a hidden input mirroring the switch state *)
let hidden_style =
  "position: fixed; top: 0; left: 0; width: 1px; height: 1px; \
   clip-path: inset(50%); overflow: hidden;"

let hidden_input ~key ~attrs =
  dom ~key ~tag:"input" ~attrs:([ ("style", hidden_style) ] @ attrs) []

(* ui/toggle -> shui Switch size sm *)
let hidden_checkbox ~key ~on =
  hidden_input ~key
    ~attrs:
      ([ ("type", "checkbox") ]
      @ if on then [ ("checked", "") ] else [])

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

(* switch + mirrored hidden checkbox (+ optional detail children) —
   the switch-wrap cell contents of every toggle row *)
let switch_controls ~key ~on ~on_toggle ?(extra = []) () =
  switch_el ~key:(key ^ "-sw") ~on ~on_toggle
  :: hidden_checkbox ~key:(key ^ "-sc") ~on
  :: extra

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

(* ---- rows ---- *)

(* cljs `toggle` row: label | switch (+detail); info icons are extra
   label children in cljs. ~binding adds the show-brackets/wide-mode
   shortcut column (narrow switch wrap + ls-kbd-cell). *)
let toggle_row ~key ~for_ ~label ?(label_extra = []) ?(detail = [])
    ?binding ~on ~on_toggle () =
  match binding with
  | None ->
      dom ~key ~style_class:"it"
        [ label_el ~key:(key ^ "-l") ~for_ ~text:label label_extra
        ; dom ~key:(key ^ "-c")
            ~style_class:"ls-it-value"
            [ dom ~key:(key ^ "-i") ~style_class:"ls-switch-wrap"
                (switch_controls ~key ~on ~on_toggle ~extra:detail ())
            ]
        ]
  | Some b ->
      dom ~key ~style_class:"it"
        [ label_el ~key:(key ^ "-l") ~for_ ~text:label []
        ; dom ~key:(key ^ "-c")
            [ dom ~key:(key ^ "-i")
                ~style_class:"ls-switch-wrap ls-switch-narrow"
                (switch_controls ~key ~on ~on_toggle ())
            ]
        ; dom ~key:(key ^ "-k") ~style_class:"ls-kbd-cell"
            [ kbd_seq ~key:(key ^ "-ks") ~binding:b
                (String.split_on_char ' ' b) ]
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

(* bare .it shell: label | value cell — font/date-format/home rows *)
let it_row ~key ~for_ ~label ?(value_cls = "ls-it-value") children =
  dom ~key ~style_class:"it"
    [ label_el ~key:(key ^ "-l") ~for_ ~text:label []
    ; dom ~key:(key ^ "-r") ~style_class:value_cls children
    ]

(* row: label | <a> solid button *)
let edit_link_row ~key ~label ~button ~href ~for_ () =
  action_row ~key ~for_ ~label
    ~actions:
      [ dom ~key:(key ^ "-a") ~tag:"a"
          ~style_class:("ui__link " ^ btn_cls ~variant:`Solid ~size:`Sm ())
          ~attrs:[ ("href", href); ("role", "button") ]
          ~text:button []
      ]
    ()
