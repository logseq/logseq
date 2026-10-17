(* Shared settings controls — the row/button/switch primitives the
   settings page, settings dialog, appearance popup and URL editor
   dialogs are built from. Component-kind mirrors of
   components/settings.cljs (ui/toggle, shui Switch/Checkbox,
   keyboard-shortcut, it rows); style_class keeps the cljs semantic
   classes for web parity. *)

open Lui_elements

let class_signal = Ui_parts.class_signal

let info_icon ~key ~title =
  box ~key ~opacity:0.56
    [ Ui_components.button ~key:(key ^ "-button") ~variant:`ghost ~size:`icon
        ~style_class:"ls-info-icon" ~width:32 ~height:16 ~min_height:16
        ~padding_horizontal:8 ~padding_vertical:0 ~background:"transparent"
        ~icon:(`app "info-circle-filled") ~label:title ~tooltip:title [] ]

(* cljs print-shortcut-key (macOS): single letters uppercase, named keys
   map to their glyphs *)
let print_key k =
  match String.lowercase_ascii k with
  | "cmd" | "command" | "mod" -> {js|⌘|js}
  | "meta" -> {js|⌘|js}
  | "return" | "enter" -> {js|⏎|js}
  | "shift" -> {js|⇧|js}
  | "alt" | "option" | "opt" -> {js|⌥|js}
  | "ctrl" | "control" -> "Ctrl"
  | "space" -> "Space"
  | "up" -> {js|↑|js}
  | "down" -> {js|↓|js}
  | "left" -> {js|←|js}
  | "right" -> {js|→|js}
  | "tab" -> "Tab"
  | "delete" -> {js|⌫|js}
  | "backspace" -> {js|⌫|js}
  | s when String.length s = 1 -> String.uppercase_ascii s
  | s -> s

(* ui/render-keyboard-shortcut -> boxed+glowing separate keycaps — the
   shared keycap recipes carry the chrome the .keyboard-shortcut/
   .shui-shortcut-wrap CSS used to paint *)
let kbd_seq ~key ~binding:_ keys =
  Ui_components.shortcut_separate ~key ~glow:true
    (List.mapi
       (fun i k ->
         Ui_components.keycap ~key:(key ^ "-" ^ string_of_int i)
           ~boxed:true ~glow:true ~min_slot:20
           ~value:((print_key k)))
       keys)

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
   web, so no mirror is needed. ToggleChanged is decoded once here —
   callers get the new checked state, not the raw event. *)
let switch_el ~key ~on ~on_checked =
  switch_ ~key ~style_class:"ui__switch" ~width:32 ~height:18 ~checked:on
    ~on_toggle:(fun ev ->
      match ev with
      | Lui_protocol.ToggleChanged (_, checked) -> on_checked checked
      | _ -> ())
    []

(* switch (+ optional detail children) — the switch-wrap cell contents
   of every toggle row *)
let switch_controls ~key ~on ~on_checked ?(extra = []) () =
  switch_el ~key:(key ^ "-sw") ~on ~on_checked :: extra

(* shui/checkbox — the kind draws its own check indicator, so the cljs
   check svg child is dropped *)
let checkbox_el ~key ~on ~on_checked =
  checkbox ~key ~style_class:"ui__checkbox" ~checked:on
    ~width:16 ~height:16 ~min_width:16 ~min_height:16
    ~border_width:1 ~border_color:"hsl(var(--foreground))"
    ~on_toggle:(fun ev ->
      match ev with
      | Lui_protocol.ToggleChanged (_, checked) -> on_checked checked
      | _ -> ())
    []

(* ---- rows ---- *)

(* cljs `toggle` row: label | switch (+detail); info icons are extra
   label children in cljs. ~binding adds the show-brackets/wide-mode
   shortcut column (narrow switch wrap + right-aligned kbd cell). *)
let toggle_row ~key ~label ?(label_extra = []) ?(detail = [])
    ?binding ~on ~on_checked () =
  let control =
    row ~key:(key ^ "-i") ~gap:16 ~cross:`center ~min_height:24
      ?max_width:(match binding with Some _ -> Some 320 | None -> None)
      (switch_controls ~key ~on ~on_checked
         ~extra:(match binding with Some _ -> [] | None -> detail)
         ())
  in
  let side =
    match binding with
    | Some b ->
        [ row ~key:(key ^ "-k") ~grow:1. ~main:`end_ ~cross:`center
            [ kbd_seq ~key:(key ^ "-ks") ~binding:b
                (String.split_on_char ' ' b) ]
        ]
    | None -> []
  in
  Ui_components.form_row ~key
    ~label:(Ui_components.form_label ~key:(key ^ "-l") ~text:label ())
    ~label_extra ~control ~side ()

(* cljs row-with-button-action *)
let action_row ~key ~label ?description ~actions ?(desc = [])
    ?(stretch = false) ?(col_gap = 24) ?(label_lh = "1.75rem")
    ?(min_height = 28) () =
  Ui_components.form_row ~key ~col_gap ~min_height
    ~label:
      (Ui_components.form_label ~key:(key ^ "-l") ~line_height:label_lh
         ~text:label ())
    ?desc:
      (Option.map
         (fun d -> Ui_components.form_desc ~key:(key ^ "-d") ~value:d)
         description)
    ~control:
      (row ~key:(key ^ "-rc") ~cross:`center ~gap:8 ~min_width:0
         [ box ~key:(key ^ "-a")
             ?grow:(if stretch then Some 1. else None)
             actions
         (* cljs renders the desc cell unconditionally *)
         ; Ui_components.with_props
             [ Ui_components.Prop.font_size "0.875rem" ]
             (row ~key:(key ^ "-desc") ~cross:`center desc)
         ])
    ()

(* bare .it shell: label | value cell — font/date-format/home rows *)
let it_row ~key ~label ?(value_cls = "ls-it-value")
    ?(min_height = 28) children =
  Ui_components.form_row ~key ~min_height
    ~label:(Ui_components.form_label ~key:(key ^ "-l") ~text:label ())
    ~control:
      (column ~key:(key ^ "-r") ~style_class:value_cls ~cross:`stretch
         children)
    ()

(* row: label | <a> solid button *)
let edit_link_row ~key ~label ~button ~href ?(min_height = 28) () =
  action_row ~key ~label ~min_height
    ~actions:
      [ Ui_components.with_props
          [ Ui_components.Prop.font_size "0.875rem"
          ; Ui_components.Prop.line_height "1.25rem" ]
          (link ~key:(key ^ "-a")
             ~style_class:( btn_cls ~variant:`Solid ~size:`Sm ())
             ~url:href ~target:`self_ ~text:button
             ~background:"hsl(var(--primary) / 0.9)"
             ~foreground:"hsl(var(--primary-foreground))"
             ~height:28 ~padding_horizontal:12 ~padding_vertical:4
             ~corner_radius:4
             ~data_attrs:[ "style", "text-decoration:none" ]
             [])
      ]
    ()
