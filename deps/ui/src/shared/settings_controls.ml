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
    [ button ~key:(key ^ "-button") ~variant:`ghost ~size:`icon
        ~style_class:"ls-info-icon" ~width:32 ~height:16 ~min_height:16
        ~padding_horizontal:8 ~padding_vertical:0 ~background:"transparent"
        ~icon:(`app "info-circle-filled") ~label:title ~tooltip:title [] ]

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

(* ui/render-keyboard-shortcut -> boxed+glowing separate keycaps — the
   shared keycap recipes carry the chrome the .keyboard-shortcut/
   .shui-shortcut-wrap CSS used to paint *)
let kbd_seq ~key ~binding:_ keys =
  Ui_components.shortcut_separate ~key ~glow:true
    (List.mapi
       (fun i k ->
         Ui_components.keycap ~key:(key ^ "-" ^ string_of_int i)
           ~boxed:true ~glow:true ~min_slot:20
           ~value:(Ui_services.literal_text (print_key k)))
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
   web, so no mirror is needed *)
let switch_el ~key ~on ~on_toggle =
  switch_ ~key ~style_class:"ui__switch" ~width:32 ~height:18 ~checked:on
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

(* <label> takes no children in the kind schema — info icons etc. join
   the label cell through form_row's label_extra slot instead *)
let label_el ~key ~for_ ~text ?text_signal children =
  ignore for_;
  let l =
    Ui_components.form_label ~key ?text_signal ~text ()
  in
  match children with
  | [] -> l
  | _ -> row ~key:(key ^ "-row") ~cross:`center ~gap:0 (l :: children)

(* ---- rows ---- *)

(* cljs `toggle` row: label | switch (+detail); info icons are extra
   label children in cljs. ~binding adds the show-brackets/wide-mode
   shortcut column (narrow switch wrap + right-aligned kbd cell). *)
let toggle_row ~key ~for_ ~label ?(label_extra = []) ?(detail = [])
    ?binding ~on ~on_toggle () =
  ignore for_;
  let control =
    row ~key:(key ^ "-i") ~gap:16 ~cross:`center ~min_height:24
      ?max_width:(match binding with Some _ -> Some 320 | None -> None)
      (switch_controls ~key ~on ~on_toggle
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
let action_row ~key ~for_ ~label ?description ~actions ?(desc = [])
    ?(stretch = false) ?(col_gap = 24) ?(label_lh = "1.75rem") () =
  ignore for_;
  Ui_components.form_row ~key ~col_gap
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
             [ Lui_protocol.FontSize, Lui_protocol.StringValue "0.875rem" ]
             (row ~key:(key ^ "-desc") ~cross:`center desc)
         ])
    ()

(* bare .it shell: label | value cell — font/date-format/home rows *)
let it_row ~key ~for_ ~label ?(value_cls = "ls-it-value") children =
  ignore for_;
  ignore value_cls;
  Ui_components.form_row ~key
    ~label:(Ui_components.form_label ~key:(key ^ "-l") ~text:label ())
    ~control:(column ~key:(key ^ "-r") ~cross:`stretch children)
    ()

(* row: label | <a> solid button *)
let edit_link_row ~key ~label ~button ~href ~for_ () =
  action_row ~key ~for_ ~label
    ~actions:
      [ link ~key:(key ^ "-a")
          ~style_class:( btn_cls ~variant:`Solid ~size:`Sm ())
          ~url:href ~target:`self_ ~text:button []
      ]
    ()
