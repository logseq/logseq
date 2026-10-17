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

let version = Version.app

(* config.edn-backed toggle row — folds the (config_bool, config_toggle)
   pair every config toggle repeats *)
let cfg_row ~key ~label ?label_extra ?detail ?binding ~cfg ~default
    () =
  C.toggle_row ~key ~label ?label_extra ?detail ?binding
    ~on:(S.config_bool cfg ~default)
    ~on_checked:(fun checked -> S.config_set_bool cfg checked)
    ()

(* localStorage-backed toggle row *)
let storage_row ~key ~label ?label_extra ?detail ?binding ~key_ ~default
    ~on_checked () =
  C.toggle_row ~key ~label ?label_extra ?detail ?binding
    ~on:(S.storage_bool key_ ~default) ~on_checked ()

(* show-brackets and wide-mode appear in both the editor pane and the
   appearance popup — same row spec, different DOM key *)
let brackets_row ~key =
  cfg_row ~key ~label:T.show_brackets
    ~binding:"t b" ~cfg:"ui/show-brackets?" ~default:true ()

let wide_mode_row ~key =
  storage_row ~key ~label:T.wide_mode ~binding:"t w"
    ~key_:"wide-mode" ~default:false ~on_checked:S.set_wide_mode ()

(* ---- general pane ---- *)

let revision = "dev" (* logseq.common.version/REVISION — goog-define default *)

let version_row () =
  C.action_row ~key:"ver" ~label:T.current_version
    ~actions:
      [ Ui_components.with_props
          [ Ui_components.Prop.position `relative ]
          (row ~key:"ver-a" ~style_class:"cp__settings-app-updater"
             ~cross:`center ~min_height:20
             ~data_attrs:[ "style", "margin-bottom: -5px" ]
             [ Ui_components.with_props
                 [ ( Ui_components.Prop.position `relative ) ]
                 (row ~key:"ver-c" ~style_class:"ctls" ~cross:`center
                    [ row ~key:"ver-i" ~style_class:"ls-ver-wrap"
                        ~cross:`center ~gap:16 ~flex_wrap:`wrap
                        [ box ~key:"ver-b" []
                        ; text ~key:"ver-v" ~style_class:"ls-ver-text"
                            ~value:version []
                        ; Ui_components.faded_link ~key:"ver-cl"
                            ~url:"https://docs.logseq.com/#/page/changelog"
                            ~text:T.changelog ()
                        ]
                    ])
             ])
      ]
    ()

let language_row ctx =
  let lang_label =
    Signal.state ctx.Lui_ui.ui_scheduler
      (V.lang_label_for (V.current_lang ()))
  in
  C.action_row ~key:"lang"
    ~label:T.language_label
    ~actions:
      [ V.lang_trigger ~ctx ~key:"lang-sel" ~height:32
          ~st:lang_label
      ]
    ()

let theme_row ctx =
  let mode = Signal.state ctx.Lui_ui.ui_scheduler (V.current_mode ()) in
  Ui_components.form_row ~key:"theme" ~min_height:85
    ~label:
      (Ui_components.form_label ~key:"theme-l"
         ~text:""
         ~text_signal:
           (reactive
              (fun m ->
                let effective =
                  if m = "system" then
                    if Ui_services.theme_prefers_dark () then "dark"
                    else "light"
                  else m
                in
                T.switch_to_theme
                  (if effective = "dark" then T.theme_light
                   else T.theme_dark))
              (Signal.value mode))
         ())
    ~control:
      (row ~key:"theme-rc" ~cross:`center ~gap:8 ~min_width:0
         [ box ~key:"theme-a" [ V.theme_modes_ul ~st:mode ]
         ; row ~key:"theme-desc" ~cross:`center
             [ C.kbd_seq ~key:"theme-k" ~binding:"t t" [ "t"; "t" ] ]
         ])
    ()

let font_button ~key ~label ~font_family ~active ~on_click =
  Ui_components.button ~key ~variant:`secondary ~selected:active
    ~accessibility_identifier:("editor-" ^ key) ~label
    ~height:40 ~padding_horizontal:16 ~padding_vertical:0
    ~border_width:(if active then 2 else 0)
    ~border_color:"hsl(var(--primary))"
    ~style_class:(C.btn_cls ~variant:`Secondary ())
    ~on_press:(fun _ -> on_click ())
    [ Ui_components.with_props [Ui_components.Prop.font_family font_family]
        (column ~key:(key ^ "-s") ~gap:0 ~cross:`stretch ~grow:1.
        [ text ~key:(key ^ "-ag")
            ~font_size:"0.875rem" ~font_weight:700 ~line_height:"1.25rem" ~height:20
            ~text_alignment:`center ~value:"Ag" []
        ; text ~key:(key ^ "-sm")
            ~font_size:"0.7rem" ~font_weight:500 ~line_height:"1rem" ~height:16
            ~text_alignment:`center ~value:label []
        ])
    ]

let editor_font_row () =
  let font = S.current_editor_font () in
  let fb t label font_family =
    font_button ~key:("font-" ^ t) ~label ~font_family ~active:(font.S.ftype = t)
      ~on_click:(fun () -> S.set_editor_font_type t)
  in
  C.it_row ~key:"font" ~label:T.editor_font
    ~cross:`center ~min_height:80
    [ row ~key:"font-btns" ~gap:8
        [ fb "default" "Default" "var(--ls-font-family, Inter)"
        ; fb "serif" "Serif" "Lyon-Text, Georgia, ui-serif, serif"
        ; fb "mono" "Mono" "iawriter-mono, Nitti, Menlo, Courier, monospace" ]
    ; Ui_components.with_props
        [ Ui_components.Prop.font_size "0.875rem"
        ; Ui_components.Prop.line_height "1.25rem" ]
        (checkbox ~key:"font-g" ~gap:4 ~margin_top:12 ~min_height:28
          ~text:T.editor_font_global ~label:T.editor_font_global
          ~foreground:"hsl(var(--foreground) / 0.7)"
          ~checked:font.S.fglobal
          ~on_toggle:(function
            | Lui_protocol.ToggleChanged (_,checked) -> S.set_editor_font_global checked
            | _ -> ()) [])
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
  row ~key ~width:20 ~height:20 ~main:`center ~cross:`center
    ~opacity:(if active then 1. else 0.5)
    [ Ui_components.with_props
        [ Ui_components.Prop.hover_background ("var(--rx-" ^ color ^ "-09)")
        ; Ui_components.Prop.pressed_opacity 1. ]
      (Ui_components.button ~key:(key ^ "-b") ~variant:`ghost
        ~style_class:(C.btn_cls ~variant:`Text ())
        ~label:(color_label color)
        ~background:("var(--rx-" ^ color ^ "-09)")
        ~selected:active ~autofocus:(modal && active)
        ~border_color:("var(--rx-" ^ color ^ (if active then "-07)" else "-06)"))
        ~border_width:(if active then 4 else 1)
        ~width:20 ~height:20 ~corner_radius:999 ~padding:0
        ~on_press:(fun _ -> S.set_accent color)
        [ box ~key:(key ^ "-s")
           
            ~opacity:(if none || active then 1. else 0.)
            ~width:(if none then 12 else 8) ~height:(if none then 2 else 8)
            ~corner_radius:9999
            ~background:
              (if none then "#b91c1c" else "var(--rx-" ^ color ^ "-07)")
            []
        ])
    ]

let accent_row ~modal =
  let current = S.current_accent () in
  let names = "none" :: "logseq" :: color_names in
  let swatch_row ~key cs =
    row ~key ~gap:8 ~cross:`center
      (List.mapi
         (fun i c ->
           accent_swatch ~key:(key ^ "-" ^ string_of_int i) ~modal ~current c)
         cs)
  in
  let swatches =
    column ~key:"acc-l" ~gap:8 ~cross:`start
      ~margin_left:(if modal then 4 else 0)
      ~margin_bottom:(if modal then 4 else 0)
      [ swatch_row ~key:"acc-r0" (List.filteri (fun i _ -> i < 8) names)
      ; swatch_row ~key:"acc-r1" (List.filteri (fun i _ -> i >= 8) names)
      ]
  in
  column ~key:"acc"
    [ C.action_row ~key:"acc-r"
        ~label:T.accent_color ~col_gap:16 ~label_lh:"1.25rem"
        ~actions:[ swatches ] ~stretch:modal
        ~desc:
          (if modal then []
           else
             [ row ~key:"acc-sp" 
                 [ C.kbd_seq ~key:"acc-k" ~binding:"c c" [ "c"; "c" ] ]
             ])
        ()
    ; Ui_components.with_props [Ui_components.Prop.opacity 0.5]
        (text ~key:"acc-n" ~style_class:"ls-desc" ~margin_top:4
          ~font_size:"0.875rem" ~line_height:"1.25rem"
          ~value:T.accent_color_alert [])
    ]

(* The reference keeps desktop panels at 600 points and scrolls the
   article when that content exceeds the viewport. *)
let panel ~key ?(style_class="panel-wrap") ?margin_bottom children : t =
 fun ctx parent ->
  let viewport=Ui_services.viewport_width_signal ~scheduler:ctx.Lui_ui.ui_scheduler
    ~scope:ctx.Lui_ui.ui_scope in
  let children=match children with
    | first::rest -> Ui_components.with_props [Ui_components.Prop.padding_top 14] first :: rest
    | [] -> [] in
  Ui_parts.int_prop Lui_protocol.MinWidth
    ~value:(reactive (fun viewport -> if viewport>=640. then 600 else 0) viewport)
    (column ~key ~style_class ~gap:16 ~padding:4 ~max_width:600 ?margin_bottom children) ctx parent

let general_pane ~modal ctx =
  panel ~key:"pane-general"
    [ version_row ()
    ; language_row ctx
    ; theme_row ctx
    ; editor_font_row ()
    ; accent_row ~modal
    ; C.edit_link_row ~key:"cfg" ~label:T.config_custom_configuration
        ~button:T.edit_config_edn ~href:"#/file/logseq%2Fconfig.edn" ()
    ; C.edit_link_row ~key:"css" ~label:T.config_custom_theme
        ~button:T.edit_custom_css ~href:"#/file/logseq%2Fcustom.css" ()
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
  ; {js|yyyy年MM月dd日|js} ]

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
  Ui_components.menu_card ~key:("dfmt-m-" ^ key) ~max_height:288
    ~anchor:`below ~anchor_alignment:`start
    ~cls:"ls-select-content"
    ~on_dismiss:(fun _ -> V.lang_menu_close mst)
    (List.mapi
       (fun i fmt ->
         menu_item ~key:(Printf.sprintf "dfmt-mi-%d" i)
           ~text:fmt
           ~selected:(fmt = current)
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
  Ui_components.form_row ~key:"dfmt"
    ~label:
      (Ui_components.form_label ~key:"dfmt-l"
         ~text:T.custom_date_format ())
    ~control:
      (column ~key:"dfmt-w" ~max_width:320 ~cross:`stretch
         [ select ~key:"dfmt-s"
             ~width:200 ~height:29 ~corner_radius:4
             ~padding_horizontal:8
             ~background:"var(--lx-gray-03)"
             ~style_class:"form-select is-small ls-date-format"
             ~text:current
             ~on_press:(fun _ ->
               Signal.set mst (not (Runtime.signal_get mst));
               Runtime.flush ())
             []
         ; reactive ~equal:( == ) (fun open_ ->
             if open_ then dfmt_menu ~key:"dfmt" mst options current
             else spacer ~key:"dfmt-m-x" [])
             (Signal.value mst)
         ])
    ()

let editor_pane ctx =
  panel ~key:"pane-editor"
    [ date_format_row ctx
    ; brackets_row ~key:"brackets"
    ; wide_mode_row ~key:"wide"
    ; cfg_row ~key:"outdent"
        ~label:T.logical_outdenting
        ~label_extra:
          [ C.info_icon ~key:"outdent-i" ~title:T.outdenting_hint ]
        ~cfg:"editor/logical-outdenting?" ~default:false ()
    ; cfg_row ~key:"fullb"
        ~label:T.show_full_blocks
        ~cfg:"ui/show-full-blocks?" ~default:false ()
    ; cfg_row ~key:"pasting"
        ~label:T.preferred_pasting
        ~label_extra:[ C.info_icon ~key:"pasting-i" ~title:T.pasting_hint ]
        ~cfg:"editor/preferred-pasting-file?" ~default:false ()
    ; cfg_row ~key:"autoexp"
        ~label:T.auto_expand_refs
        ~label_extra:
          [ C.info_icon ~key:"autoexp-i" ~title:T.auto_expand_hint ]
        ~cfg:"ui/auto-expand-block-refs?" ~default:true ()
    ; storage_row ~key:"sttip"
        ~label:T.shortcut_tooltip ~key_:"shortcut-tooltip?" ~default:true
        ~on_checked:S.set_shortcut_tooltip ()
    ; cfg_row ~key:"tooltips"
        ~label:T.tooltips ~cfg:"ui/enable-tooltip?" ~default:true ()
    ; cfg_row ~key:"puball"
        ~label:T.all_pages_public ~cfg:"publishing/all-pages-public?"
        ~default:false ()
    ]

(* ---- keymap pane (components/shortcut.cljs page) ---- *)

let rec keymap_binding ~key (b : Keymap_data.binding) =
  let open Keymap_data in
  if b.kind = "chord" then
    row ~key ~cross:`center ~gap:4
      (String.split_on_char ' ' b.data
      |> List.mapi (fun i stroke ->
          row ~key:(string_of_int i) ~cross:`center ~gap:4
            ((if i = 0 then []
              else [ text ~value:("->") [] ])
            @ [
                keymap_binding
                  ~key:(key ^ string_of_int i)
                  {
                    kind = "combo";
                    data = stroke;
                    keys = Keymap_record.keycaps stroke;
                  };
              ])))
  else
    let cls = "shui-shortcut-" ^ b.kind ^ " shui-shortcut-glow" in
    (* ls-dc is display:contents — the box is transparent on web, so the
     shortcut cells flow as direct children of the action wrap *)
    box ~key ~style_class:"ls-dc" ~display:`contents
      [
        box ~key:(key ^ "w") ~style_class:"shui-shortcut-wrap"
          ~display:`inline_flex
          [
            row ~key:(key ^ "d") ~style_class:cls ~cross:`center
              ~data_attrs:[ ("data-shortcut-binding", b.data) ]
              [
                (let cells =
                   List.concat
                     (List.mapi
                        (fun i k ->
                          (if i > 0 && b.kind = "combo" then
                             [
                               Ui_components.keycap_separator
                                 ~key:(key ^ "s" ^ string_of_int i);
                             ]
                           else [])
                          @ [
                              Ui_components.keycap
                                ~key:(key ^ "k" ^ string_of_int i)
                                ~boxed:(b.kind = "separate") ~glow:true
                                ~min_slot:20
                                ~value:k;
                            ])
                        b.keys)
                 in
                 if b.kind = "combo" then
                   Ui_components.shortcut_combo ~key:(key ^ "sc") ~glow:true
                     cells
                 else
                   Ui_components.shortcut_separate ~key:(key ^ "sc") ~glow:false
                     cells);
              ];
          ];
      ]

type keymap_model = {
  km_query : string;
  km_filter : Keymap_data.filter;
  km_collapsed : string list;
  km_keys : string list;
  km_recording : bool;
  km_committed : bool;
  km_revision : int;
}

(* ":<id>#<handler>" -> the command.<id> dict key *)
let command_key_of (title : string) : string =
  let s =
    if String.length title > 0 && String.get title 0 = ':' then
      String.sub title 1 (String.length title - 1)
    else title
  in
  let s =
    match String.index_opt s '#' with Some i -> String.sub s 0 i | None -> s
  in
  "command." ^ s

let keymap_label row = I18n.t (command_key_of row.Keymap_data.title)

let keymap_pill st ~key ~title filter =
  let active s = s.km_filter = filter in
  Ui_components.chip_toggle ~key ~radius:9999 ~pad_v:2 ~pad_h:8
    ~font_size:"0.75rem"
    ~text:
      (reactive
         (fun s ->
           title
           ^ {js| · |js}
           ^ string_of_int
               (Keymap_data.count ~query:s.km_query ~label:keymap_label filter))
         (Signal.value st))
    ~checked:(reactive active (Signal.value st))
    ~on_toggle:(fun _ ->
      let model = Runtime.signal_get st in
      Runtime.signal_set st
        {
          model with
          km_filter =
            (if model.km_filter = filter then Keymap_data.All else filter);
        })
    ()

let keymap_recorded_keys ?(pending = false) ?(wrap = false) ?(trailing = [])
    strokes =
  row ~key:"recorded-keys" ~cross:`center ~main:`start ~gap:4 ~min_width:0
    ?grow:(if wrap then Some 1. else None)
    ~flex_wrap:(if wrap then `wrap else `nowrap)
    ~opacity:(if pending then 0.7 else 1.)
    ~data_attrs:[ ("data-recording-pending", string_of_bool pending) ]
    (List.mapi
       (fun i stroke ->
         keymap_binding
           ~key:("stroke-" ^ string_of_int i)
           {
             Keymap_data.kind =
               (if String.contains stroke '+' then "combo" else "separate");
             data = stroke;
             keys = Keymap_record.keycaps stroke;
           })
       strokes
    @ trailing)

let keymap_close_recorder st =
  Runtime.signal_set st
    { (Runtime.signal_get st) with km_recording = false; km_committed = true };
  match Ui_services.dom_query ".shortcut-keystroke-trigger" with
  | Some trigger -> trigger.Ui_services.focus ()
  | None -> ()

let keymap_focus_recorder () =
  match Ui_services.dom_query ".shortcut-filter-popover" with
  | Some popup -> popup.Ui_services.focus ()
  | None -> ()

let keymap_recorder st : t =
 fun ctx parent ->
  let timer = ref None in
  let cancel () =
    Option.iter Ui_services.timers_clear_timeout !timer;
    timer := None
  in
  Signal.on_dispose ctx.Lui_ui.ui_scope cancel;
  let clear () =
    cancel ();
    Runtime.signal_set st
      { (Runtime.signal_get st) with km_keys = []; km_committed = false };
    keymap_focus_recorder ()
  in
  let record ev =
    let model = Runtime.signal_get st in
    match
      Keymap_record.update ~strokes:model.km_keys ~committed:model.km_committed
        ev
    with
    | Keymap_record.Ignore -> ()
    | Close ->
        cancel ();
        keymap_close_recorder st
    | Set (keys, committed) ->
        cancel ();
        Runtime.signal_set st
          { model with km_keys = keys; km_committed = committed };
        if keys <> [] && not committed then
          timer :=
            Some
              (Ui_services.timers_timeout
                 (fun () ->
                   timer := None;
                   if Ui_effect.alive ctx.ui_scope then
                     Runtime.signal_set st
                       { (Runtime.signal_get st) with km_committed = true })
                 400)
  in
  Keyboard_capture.acquire ~scope:ctx.ui_scope record;
  popover ~key:"key-recorder" ~style_class:"shortcut-filter-popover"
    ~anchor:`below ~anchor_alignment:`end_ ~anchor_offset:4. ~width:288
    ~min_width:0 ~padding:0 ~corner_radius:8 ~border_width:1
    ~border_color:"hsl(var(--border))" ~background:"hsl(var(--background))"
    ~transition:Ui_components.popover_transition
    ~on_appear:(fun _ -> keymap_focus_recorder ())
    ~on_dismiss:(fun _ -> keymap_close_recorder st)
    [
      column ~gap:0 ~min_width:0
        [
          text ~font_size:"0.75rem" ~line_height:"16px" ~font_weight:500
            ~padding_horizontal:16 ~padding_vertical:8
            ~foreground:"var(--lx-gray-11)"
            ~value:(I18n.t "keymap/keystroke-filter")
            [];
          row ~cross:`center ~gap:8 ~min_height:40 ~padding_horizontal:16
            ~padding_vertical:8
            [
              reactive
                (fun model ->
                  if model.km_keys = [] then
                    text ~font_size:"0.875rem" ~min_height:24
                      ~foreground:"var(--lx-gray-11)"
                      ~value:(I18n.t "keymap/press-keys-to-filter")
                      []
                  else
                    keymap_recorded_keys ~wrap:true
                      ~pending:(not model.km_committed)
                      ~trailing:
                        [
                          Ui_components.button ~key:"remove-key-filter" ~variant:`ghost
                            ~width:16 ~height:16 ~min_width:16 ~min_height:16
                            ~padding:0 ~icon:`x
                            ~label:(I18n.t "keymap/remove-filter")
                            ~on_press:(fun _ -> clear ())
                            [];
                        ]
                      model.km_keys)
                (Signal.value st);
            ];
          Ui_components.with_props
            [ Ui_components.Prop.margin 0; Ui_components.Prop.height 1 ]
            (separator []);
          row ~cross:`center ~main:`space_between ~gap:12 ~height:28
            ~padding_horizontal:16 ~padding_vertical:6
            [
              box ~grow:1.
                [
                  if_
                    ~test:
                      (reactive
                         (fun model -> model.km_keys <> [])
                         (Signal.value st))
                    (Ui_components.button ~variant:`ghost ~min_height:0 ~height:16 ~padding:0
                       ~label:(I18n.t "keymap/clear")
                       ~on_press:(fun _ -> clear ())
                       [
                         row ~cross:`center ~gap:4
                           [
                             Icons.icon ~size:12. "refresh";
                             text ~font_size:"0.75rem" ~line_height:"16px"
                               ~value:(I18n.t "keymap/clear") [];
                           ];
                       ]);
                ];
              text ~font_size:"0.75rem" ~line_height:"16px"
                ~foreground:"var(--lx-gray-11)"
                ~value:(I18n.t "keymap/hint-close")
                [];
              text ~key:"escape" ~font_size:"0.75rem" ~line_height:"16px"
                ~value:"Esc" [];
            ];
        ];
    ]
    ctx parent

let keymap_key_control st =
  let open_ _ =
    let model = Runtime.signal_get st in
    if model.km_recording then keymap_close_recorder st
    else
      Runtime.signal_set st
        {
          model with
          km_query = "";
          km_recording = true;
          km_committed = model.km_keys <> [];
        }
  in
  row ~key:"key-search" ~cross:`center ~gap:4
    [
      row ~key:"key-anchor" ~cross:`center ~gap:4
        [
          reactive
            (fun model ->
              Ui_components.button ~variant:`outline ~key:"key-trigger"
                ~style_class:
                  ("shortcut-keystroke-trigger "
                  ^
                  if model.km_keys = [] then "shortcut-keystroke-inactive"
                  else "shortcut-keystroke-active")
                ~height:30 ~min_height:0
                ~min_width:(if model.km_keys = [] then 144 else 0)
                ~padding_vertical:0 ~padding_horizontal:10 ~corner_radius:6
                ~border_width:1
                ~border_color:"var(--lx-gray-07, hsl(var(--border)))"
                ~background:"var(--lx-gray-02, hsl(var(--muted)))"
                ~label:T.keymap_search_by_keys ~icon:(`app "keyboard")
                ?text:
                  (if model.km_keys = [] then Some T.keymap_search_by_keys
                   else None)
                ~on_press:open_
                (if model.km_keys = [] then []
                 else [ keymap_recorded_keys model.km_keys ]))
            (Signal.value st);
          if_
            ~test:
              (reactive (fun model -> model.km_keys <> []) (Signal.value st))
            (Ui_components.button ~variant:`ghost ~width:20 ~height:20 ~min_width:0
               ~min_height:0 ~padding:4 ~icon:`x
               ~label:(I18n.t "keymap/clear-keystroke-filter")
               ~on_press:(fun _ ->
                 Runtime.signal_set st
                   {
                     (Runtime.signal_get st) with
                     km_keys = [];
                     km_committed = false;
                   })
               []);
        ];
      if_
        ~test:(reactive (fun model -> model.km_recording) (Signal.value st))
        (keymap_recorder st);
    ]

let keymap_controls st =
  let categories =
    List.filter_map
      (function Keymap_data.Category title -> Some title | _ -> None)
      Keymap_data.items
  in
  column ~key:"km-ctl" ~style_class:"cp__shortcut-page-x-pane-controls" ~gap:8
    ~margin_top:22 ~margin_bottom:8
    [
      row ~key:"km-tb" ~style_class:"shortcut-toolbar-row" ~cross:`center
        ~main:`space_between ~flex_wrap:`wrap ~gap:8
        [
          box ~key:"km-sw-w" ~grow:1. ~min_width:0
            [
              Ui_components.search_row ~key:"km-sw" ~height:26
                ~font_size:"0.875rem" ~pad_left:28 ~pad_right:28 ~autofocus:true
                ~placeholder:T.keymap_search_placeholder
                ~text_signal:(reactive (fun s -> s.km_query) (Signal.value st))
                ~clear_label:(I18n.t "keymap/clear-search")
                ~on_clear:S.focus_keymap_search
                ~on_text:(fun query ->
                  Runtime.signal_set st
                    {
                      (Runtime.signal_get st) with
                      km_query = query;
                      km_keys =
                        (if String.trim query <> "" then []
                         else (Runtime.signal_get st).km_keys);
                    })
                ();
            ];
          keymap_key_control st;
        ];
      row ~key:"km-pills" ~style_class:"shortcut-pills-row" ~cross:`center
        ~main:`space_between ~gap:8 ~flex_wrap:`wrap
        [
          toggle_group ~key:"km-fp" ~gap:4 ~style_class:"shortcut-filter-pills"
            ~border_width:0 ~background:"transparent"
            [
              keymap_pill st ~key:"km-pa" ~title:T.keymap_all Keymap_data.All;
              keymap_pill st ~key:"km-pc" ~title:T.keymap_custom
                Keymap_data.Custom;
              keymap_pill st ~key:"km-pu" ~title:T.keymap_unset
                Keymap_data.Unset;
              keymap_pill st ~key:"km-pd" ~title:T.keymap_disabled
                Keymap_data.Disabled;
            ];
          if_
            ~test:
              (reactive
                 (fun model -> String.trim model.km_query = "")
                 (Signal.value st))
            (row ~key:"km-sec" ~style_class:"ls-toolbar-gap" ~cross:`center
               ~height:22 ~gap:8
               [
                 Ui_components.button ~variant:`ghost ~key:"km-fold" ~style_class:"icon-link" ~width:18
                   ~height:18 ~min_width:0 ~min_height:0 ~padding:0
                   ~label:T.keymap_toggle_categories ~icon:(`app "fold")
                   ~on_press:(fun _ ->
                     let model = Runtime.signal_get st in
                     let collapsed =
                       if
                         List.for_all
                           (fun category ->
                             List.mem category model.km_collapsed)
                           categories
                       then []
                       else categories
                     in
                     Runtime.signal_set st
                       { model with km_collapsed = collapsed })
                   [];
                 Ui_components.button ~variant:`ghost ~key:"km-rf" ~style_class:"icon-link" ~width:18
                   ~height:18 ~min_width:0 ~min_height:0 ~padding:0
                   ~label:T.keymap_refresh_all ~icon:(`app "refresh")
                   ~on_press:(fun _ ->
                     Keymap_data.reload_shortcuts ();
                     Runtime.signal_set st
                       { (Runtime.signal_get st) with km_revision = Keymap_data.revision () })
                   [];
               ]);
        ];
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

let keymap_th ~key ~collapsed ~on_press label =
  list_item ~key ~style_class:"th" ~on_press
    ~min_height:30 ~margin_bottom:8
    ~padding_vertical:4 ~padding_horizontal:8 ~corner_radius:6
    ~background:"var(--lx-gray-03, hsl(var(--muted)))"
    [ row ~grow:1. ~min_width:0 ~main:`space_between ~cross:`center ~gap:8
      [ text ~key:(key ^ "s") ~style_class:"ls-th-strong"
        ~font_size:"0.9375rem" ~line_height:"1.25rem" ~font_weight:600
        ~grow:1. ~min_width:0
        ~value:(I18n.t (keymap_category label)) []
    ; icon ~key:(key ^ "i") ~style_class:"ls-row" ~size:`sm
        ~name:(if collapsed then `chevron_right else `chevron_down) []
      ]
    ]

let keymap_row ~key (r : Keymap_data.row) =
  let open Keymap_data in
  (* the title tooltip attr was DOM-only — dropped *)
  list_item ~key ~style_class:"shortcut-row"
    ~min_height:34 ~padding_vertical:7 ~padding_horizontal:8
    [ row ~key:(key ^ "r") ~cross:`center ~main:`space_between ~grow:1.
        ~min_width:0 ~gap:12
        [ box ~key:(key ^ "l") ~grow:1. ~min_width:0
            [ text ~key:(key ^ "lx") ~style_class:"ls-kbd-label"
                ~value:(I18n.t (command_key_of r.title)) []
            ]
        ; row ~key:(key ^ "a") ~cross:`center ~gap:6
        (if r.unset then
           [ text ~key:(key ^ "u")
                ~value:T.keymap_unset
               []
           ]
         else if Keymap_data.disabled r then
           [ text ~value:T.keymap_disabled [] ]
         else
           List.mapi
             (fun i b ->
               keymap_binding ~key:(key ^ "b" ^ string_of_int i) b)
             r.bindings)
        ]
    ]

let keymap_pane () : t =
 fun context parent ->
  Keymap_data.reload_shortcuts ();
  let st =
    Signal.state context.Lui_ui.ui_scheduler
      { km_query = ""; km_filter = Keymap_data.All; km_collapsed = [];
        km_keys=[]; km_recording=false; km_committed=false;
        km_revision=Keymap_data.revision () }
  in
  let rows model =
    let items =
      Keymap_data.visible_items ~keystroke:(String.concat " " model.km_keys)
        ~query:model.km_query ~filter:model.km_filter
        ~label:keymap_label
    in
    let _, _, elements =
      List.fold_left
        (fun (category, visible, elements) item ->
          match item with
          | Keymap_data.Category label when String.trim model.km_query <> "" ->
              (label, true, elements)
          | Keymap_data.Category label ->
              let collapsed = List.mem label model.km_collapsed in
              let header =
                keymap_th ~key:("km-category-" ^ label) ~collapsed label
                  ~on_press:(fun _ ->
                    let current = Runtime.signal_get st in
                    let collapsed =
                      if List.mem label current.km_collapsed then
                        List.filter (( <> ) label) current.km_collapsed
                      else label :: current.km_collapsed
                    in
                    Runtime.signal_set st
                      { current with km_collapsed = collapsed })
              in
              (label, not collapsed, header :: elements)
          | Keymap_data.Shortcut row when visible ->
              ( category,
                visible,
                keymap_row ~key:("km-command-" ^ category ^ "-" ^ row.title) row
                :: elements )
          | _ -> (category, visible, elements))
        ("", true, []) items
    in
    if items = [] then
      column ~key:"km-empty" ~cross:`center ~gap:8 ~padding:24
        [
          icon ~name:`search ~size:`lg [];
          text ~value:(I18n.t "keymap/no-matching-shortcuts") [];
        ]
    else
      list ~key:"km-ul" ~style_class:"ls-plain-list" ~list_marker:`none
        ~margin:0 ~padding:0 (List.rev elements)
  in
  (Ui_components.with_props
     [
       Ui_components.Prop.font_size "0.875rem";
       Ui_components.Prop.line_height "1.25rem";
     ]
     (column ~key:"pane-keymap" ~style_class:"cp__shortcut-page-x" ~grow:1.
        ~min_height:0
        [
          keymap_controls st;
          scroll ~key:"km-art" ~orientation:`vertical ~grow:1. ~min_height:0
            [
              reactive
                ~equal:(fun previous current ->
                  previous.km_query = current.km_query
                  && previous.km_filter = current.km_filter
                  && previous.km_collapsed = current.km_collapsed
                  && previous.km_keys = current.km_keys
                  && previous.km_revision = current.km_revision)
                rows (Signal.value st);
            ];
        ]))
    context parent

(* ---- advanced pane ---- *)

let url_button ~key ~label ~on_open =
  Ui_components.button ~key ~variant:(C.btn_variant `Solid) ~size:`sm
    ~style_class:(C.btn_cls ~variant:`Solid ~size:`Sm ())
    ~icon:`edit ~icon_placement:`trailing ~text:label
    ~on_press:(fun _ -> on_open ()) []

(* cljs storage values are pr-str quoted — strip one pair of quotes *)
let storage_unquote v =
  let n = String.length v in
  if n >= 2 && v.[0] = '"' && v.[n - 1] = '"' then
    String.sub v 1 (n - 2)
  else v

let storage_url key default =
  match Ui_services.storage_get key with
  | Some v ->
      let v = storage_unquote v in
      if String.trim v = "" then default else v
  | None -> default

let advanced_pane () =
  panel ~key:"pane-advanced"
    [ C.toggle_row ~key:"usage"
        ~label:T.usage_diagnostics
        ~detail:
          [ text ~key:"usage-d" ~style_class:"ls-desc"
              ~value:T.usage_diagnostics_desc [] ]
        ~on:(not (S.instrument_disabled ()))
        ~on_checked:S.set_usage_diagnostics ()
    ; C.toggle_row ~key:"devm"
        ~label:T.developer_mode
        ~detail:
          [ text ~key:"devm-d" ~style_class:"ls-desc"
              ~value:T.developer_mode_desc [] ]
        ~on:(S.developer_mode ()) ~on_checked:S.set_developer_mode ()
    ; C.action_row ~key:"syncurl"
        ~label:T.sync_server_url
        ~actions:
          [ url_button ~key:"syncurl-b"
              ~label:(storage_url "sync-server-url" "Logseq Sync")
              ~on_open:(fun () -> Dialogs_state.open_ "sync-server")
          ]
        ()
    ; C.action_row ~key:"puburl"
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
  C.it_row ~key:"homep" ~label:T.home_default_page
    [ box ~key:"homep-w" ~style_class:"ls-select-wrap" ~grow:1.
        [ input ~key:"homep-in"
            ~accessibility_identifier:"home-default-page" ~width:220
            ~height:26
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
let switch_action_row ~key ~label ~on ~on_checked () =
  C.action_row ~key ~label
    ~actions:[ C.switch_el ~key:(key ^ "-sw") ~on ~on_checked ]
    ()

let features_pane ctx =
  panel ~key:"pane-features" ~style_class:"panel-wrap ls-mb" ~margin_bottom:32
    [ home_page_row ctx
    ; C.action_row ~key:"plugs"
        ~label:T.plugins_label
        ~actions:
          [ row ~key:"plugs-a" ~style_class:"ls-toolbar-gap"
              (C.switch_controls ~key:"plugs" ~on:(S.plugin_system ())
                 ~on_checked:S.set_plugin_system ())
          ]
        ()
    ; switch_action_row ~key:"cards"
        ~label:T.flashcards
        ~on:(S.config_bool "feature/enable-flashcards?" ~default:true)
        ~on_checked:(fun checked ->
          S.config_set_bool "feature/enable-flashcards?" checked)
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
  let content = C.class_signal (S.signal ())
    (fun (s : S.t) ->
      if s.tab = id then "active settings-menu-item"
      else "settings-menu-item")
    (Ui_components.nav_item ~key ~data_id:id ~icon:icn
       ~text:label
       ~selected:(reactive (fun (s : S.t) -> s.tab = id) (S.signal ()))
       ~on_press:(fun _ -> S.set_tab id) ()) in
  if id<>"keymap" then content
  else fun ctx parent ->
    let viewport=Ui_services.viewport_width_signal ~scheduler:ctx.Lui_ui.ui_scheduler
      ~scope:ctx.Lui_ui.ui_scope in
    Ui_parts.string_prop Lui_protocol.DisplayValue
      ~value:(reactive (fun viewport -> if viewport>=640. then "inline-flex" else "none") viewport)
      content ctx parent

let pane_of ~modal ctx tab =
  match tab with
  | "editor" -> editor_pane ctx
  | "keymap" -> keymap_pane ()
  | "advanced" -> advanced_pane ()
  | "features" -> features_pane ctx
  | _ -> general_pane ~modal ctx

let article ~modal ctx =
  Ui_components.with_props [Ui_components.Prop.overflow `auto]
    (column ~key:"settings-article" ~style_class:"settings-article"
    ~data_attrs:["role", "article"]
    ~padding:16 ~grow:1. ~min_height:192 ~min_width:0
       [ row ~key:"art-h" ~style_class:"cp__settings-header"
           ~cross:`center ~main:`start ~gap:8 ~height:40
           ~padding_vertical:8
           [ heading ~key:"art-ht" ~level:1
               ~style_class:"cp__settings-category-title"
               ~font_size:"1.25rem" ~font_weight:400 ~line_height:"1.75rem"
               ~value:
                 (reactive (fun (s : S.t) -> tab_title s.tab)
                    (S.signal ()))
               []
           ]
       ; reactive (fun (s : S.t) -> pane_of ~modal ctx s.tab)
           (S.signal ())
       ])

let inner ~modal : t =
 fun ctx parent ->
  S.ensure ctx;
  S.activate ();
  let viewport=Ui_services.viewport_width_signal ~scheduler:ctx.Lui_ui.ui_scheduler
    ~scope:ctx.Lui_ui.ui_scope in
  let inner_box children =
    Ui_parts.float_prop Lui_protocol.HeightViewport
      ~value:(reactive (fun viewport -> if viewport>=768. then 0.7 else 0.75) viewport)
      (row ~key:"settings-inner" ~style_class:"cp__settings-inner" ~min_width:0
        ~orientation:(reactive (fun viewport -> if viewport>=768. then `horizontal else `vertical) viewport)
        ~cross:`stretch children)
  in
  let node =
    column ~key:"settings" ~accessibility_identifier:"settings"
      [ Ui_components.with_props
          [ Ui_components.Prop.min_height_viewport 0.55
          ; ( Ui_components.Prop.max_height_viewport 0.75 ) ]
          (inner_box
             [ Ui_parts.int_prop Lui_protocol.MinWidth
                 ~value:(reactive (fun viewport -> if viewport>=768. then 256 else 160) viewport)
                 (Ui_parts.int_prop Lui_protocol.MaxWidth
                   ~value:(reactive (fun viewport -> if viewport>=768. then 256 else int_of_float viewport) viewport)
                 (column ~key:"settings-aside"
                 ~style_class:"settings-aside"
                 ~data_attrs:["role", "complementary"]
                 ~background:
                   "var(--lx-gray-03-alpha, var(--rx-gray-03-alpha))"
                 ~padding:16
                 ~gap:16
                 [ row ~key:"aside-h"
                     ~style_class:"cp__settings-header"
                     ~cross:`center ~main:`start ~gap:8 ~height:40
                     ~padding:8
                     [ heading ~key:"aside-ht" ~level:1
                         ~style_class:"cp__settings-modal-title"
                         ~font_size:"1.5rem" ~font_weight:600 ~line_height:"2rem"
                         ~data_attrs:
                           [ "style", "text-transform: lowercase" ]
                         ~value:T.settings_title []
                     ]
                 ; list ~key:"aside-menu"
                     ~style_class:"settings-menu" ~padding:0 ~gap:8 ~margin_bottom:8
                     (List.mapi
                        (fun i it ->
                          nav_item ~key:("nav-" ^ string_of_int i) it)
                        nav_items)
                 ]))
             ; article ~modal ctx
             ])
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
        ~corner_radius:12
        [ inner ~modal:false ]
    in
    node ctx parent

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
          (Ui_components.with_props
             [ Ui_components.Prop.position `fixed
             ; Ui_components.Prop.inset 0.
             ; Ui_components.Prop.z_index 40 ]
             (box ~key:"appearance-backdrop" []))
        (* cljs PopupContent right-anchors the appearance panel:
           ~620px wide, right edge ~32px from the viewport edge *)
      ; popover ~transition:Ui_components.popover_transition ~key:"appearance-wrap"
          ~at:(Ui_services.dom_viewport_width () -. 32. -. 624., y) ~width:624
          ~on_dismiss:(fun _ ->
            Runtime.send (Action.Appearance_set None))
          ~style_class:"ui__dropdown-menu-content appearance-popup"
          ~min_width:192
          [ column ~key:"appearance_settings"
              ~accessibility_identifier:"appearance_settings"
              ~style_class:"cp__settings-appearance-dialog-inner"
              ~padding:20
              [ reactive ~equal:( == ) (fun (_ : S.t) ->
                    (* cljs cp__settings-appearance-dialog-inner:
                       flex-col gap-4 between the .it rows *)
                    column ~key:"app-rows" ~gap:16 (appearance_rows ctx))
                  (S.signal ()) ]
          ]
      ]
  in
  node ctx parent
