(* Shared settings controls — the row/button/switch primitives the
   settings page, settings dialog, appearance popup and URL editor
   dialogs are built from. Component-kind mirrors of
   components/settings.cljs (ui/toggle, shui Switch/Checkbox,
   keyboard-shortcut, it rows); style_class keeps the cljs semantic
   classes for web parity. *)

open Lui_elements

(* reactive style_class — kinds take only a static ~style_class, so bind
   StyleClass on the mounted node (same wrap pattern as
   Ui_parts.pressable) *)
let class_signal source f (elem : t) : t =
 fun context parent ->
  let node = elem context parent in
  Lui_ui.string_property_signal context node Lui_protocol.StyleClass
    (Signal.map f source);
  node

(* svg/info — cljs ui/icon resolves via shui.icon.v2; `info is a builtin
   icon name. The title/data-base-ui-tooltip-trigger attrs were DOM-only
   (base-ui tooltip lookup) — dropped; a tooltip affordance on kinds is
   tracked by the migration *)
let info_icon ~key ~title:_ =
  box ~key ~style_class:"ls-info-icon"
    [ icon ~key:(key ^ "i") ~name:`info ~point_size:16 [] ]

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

(* ui/render-keyboard-shortcut -> .keyboard-shortcut > .shui-shortcut-wrap
   > .shui-shortcut-separate.shui-shortcut-glow > kbd.shui-shortcut-key;
   the data-shortcut-binding/aria-hidden attrs were inert DOM markup —
   dropped *)
let kbd_seq ~key ~binding:_ keys =
  row ~key ~style_class:"keyboard-shortcut" ~cross:`center
    [ box ~key:(key ^ "w") ~style_class:"shui-shortcut-wrap"
        [ row ~key:(key ^ "b") ~cross:`center
            ~style_class:"shui-shortcut-glow shui-shortcut-separate"
            (List.mapi
               (fun i k ->
                 kbd ~key:(key ^ "-" ^ string_of_int i)
                   ~style_class:"shui-shortcut-key"
                   ~value:(Platform.utf8 (print_key k)) [])
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

(* the same variants/sizes as typed props for native hosts *)
let btn_variant = function
  | `Solid -> `primary
  | `Secondary -> `secondary
  | `Outline -> `outline
  | `Text -> `ghost

let btn_size = function
  | `Default -> `default
  | `Sm -> `sm

(* ---- form controls ---- *)

(* ui/toggle -> shui Switch size sm. The cljs hidden input mirroring the
   switch state is gone: the switch kind embeds a real checkbox input on
   web, so no mirror is needed *)
let switch_el ~key ~on ~on_toggle =
  switch_ ~key ~style_class:"ui__switch" ~checked:on
    ~on_toggle:(fun _ -> on_toggle ()) []

(* switch (+ optional detail children) — the switch-wrap cell contents
   of every toggle row *)
let switch_controls ~key ~on ~on_toggle ?(extra = []) () =
  switch_el ~key:(key ^ "-sw") ~on ~on_toggle :: extra

(* shui/checkbox — the kind draws its own check indicator, so the cljs
   check svg child is dropped *)
let checkbox_el ~key ~on ~on_change =
  checkbox ~key ~style_class:"ui__checkbox" ~checked:on
    ~on_toggle:(fun _ -> on_change (not on)) []

(* <label> takes no children in the kind schema, so label extras (info
   icons) become siblings in a row — .it label keeps its own element *)
let label_el ~key ~for_ ~text ?text_signal children =
  ignore for_;
  let l =
    match text_signal with
    | Some s -> label ~key ~style_class:"ls-label" ~value_signal:s []
    | None -> label ~key ~style_class:"ls-label" ~value:text []
  in
  match children with
  | [] -> l
  | _ -> row ~key:(key ^ "-row") ~cross:`center ~gap:4 (l :: children)

(* ---- rows ---- *)

(* cljs `toggle` row: label | switch (+detail); info icons are extra
   label children in cljs. ~binding adds the show-brackets/wide-mode
   shortcut column (narrow switch wrap + ls-kbd-cell). *)
let toggle_row ~key ~for_ ~label ?(label_extra = []) ?(detail = [])
    ?binding ~on ~on_toggle () =
  match binding with
  | None ->
      row ~key ~style_class:"it" ~gap:24
        [ label_el ~key:(key ^ "-l") ~for_ ~text:label label_extra
        ; row ~key:(key ^ "-c") ~style_class:"ls-it-value"
            [ row ~key:(key ^ "-i") ~style_class:"ls-switch-wrap"
                ~gap:16 ~cross:`center
                (switch_controls ~key ~on ~on_toggle ~extra:detail ())
            ]
        ]
  | Some b ->
      row ~key ~style_class:"it" ~gap:24
        [ label_el ~key:(key ^ "-l") ~for_ ~text:label []
        ; box ~key:(key ^ "-c")
            [ row ~key:(key ^ "-i") ~gap:16 ~cross:`center
                ~style_class:"ls-switch-wrap ls-switch-narrow"
                (switch_controls ~key ~on ~on_toggle ())
            ]
        ; box ~key:(key ^ "-k") ~style_class:"ls-kbd-cell"
            [ kbd_seq ~key:(key ^ "-ks") ~binding:b
                (String.split_on_char ' ' b) ]
        ]

(* cljs row-with-button-action *)
let action_row ~key ~for_ ~label ?description ~actions ?(desc = [])
    ?(stretch = false) () =
  row ~key ~style_class:"it ls-it-top" ~gap:24
    [ column ~key:(key ^ "-lc") ~style_class:"ls-it-label-col"
        ([ label_el ~key:(key ^ "-l") ~for_ ~text:label [] ]
        @
        match description with
        | Some d ->
            [ text ~key:(key ^ "-d") ~style_class:"ls-it-desc" ~value:d [] ]
        | None -> [])
    ; row ~key:(key ^ "-rc") ~style_class:"ls-it-actions"
        ([ box ~key:(key ^ "-a")
             ?grow:(if stretch then Some 1. else None)
             actions ]
        (* cljs renders the desc cell unconditionally *)
        @ [ row ~key:(key ^ "-desc") ~style_class:"ls-it-side" desc ])
    ]

(* bare .it shell: label | value cell — font/date-format/home rows *)
let it_row ~key ~for_ ~label ?(value_cls = "ls-it-value") children =
  row ~key ~style_class:"it" ~gap:24
    [ label_el ~key:(key ^ "-l") ~for_ ~text:label []
    ; column ~key:(key ^ "-r") ~style_class:value_cls children
    ]

(* row: label | <a> solid button *)
let edit_link_row ~key ~label ~button ~href ~for_ () =
  action_row ~key ~for_ ~label
    ~actions:
      [ link ~key:(key ^ "-a")
          ~style_class:("ui__link " ^ btn_cls ~variant:`Solid ~size:`Sm ())
          ~url:href ~text:button []
      ]
    ()
