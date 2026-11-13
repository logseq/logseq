(* Settings page (#/settings) and settings dialog shared panel.
   Mirrors components/settings.cljs `settings` defc: nav aside + article
   with .panel-wrap.is-<tab> panes. State lives in Settings_state;
   theme/language helpers in Settings_view; shared controls (rows,
   switches, kbd, buttons) in Settings_controls. *)

open Lui_elements
open Promise_ext

module T = I18n
module S = Settings_state
module V = Settings_view
module C = Settings_controls

let version = Version.app

(* config.edn-backed toggle row — folds the (config_bool, config_toggle)
   pair every config toggle repeats *)
let cfg_row ~key ~label ?label_extra ?detail ?density ?binding ~cfg ~default
    () =
  C.toggle_row ~key ~label ?label_extra ?detail ?density ?binding
    ~on:(S.config_bool cfg ~default)
    ~on_checked:(fun checked -> S.config_set_bool cfg checked)
    ()

(* localStorage-backed toggle row *)
let storage_row ~key ~label ?label_extra ?detail ?density ?binding ~key_ ~default
    ~on_checked () =
  C.toggle_row ~key ~label ?label_extra ?detail ?density ?binding
    ~on:(S.storage_bool key_ ~default) ~on_checked ()

(* show-brackets and wide-mode appear in both the editor pane and the
   appearance popup — same row spec, different DOM key *)
let brackets_row ~key ?density () =
  cfg_row ~key ?density ~label:(T.t "settings.editor/show-brackets")
    ~binding:"t b" ~cfg:"ui/show-brackets?" ~default:true ()

let wide_mode_row ~key ?density () =
  storage_row ~key ?density ~label:(T.t "settings.editor/wide-mode") ~binding:"t w"
    ~key_:"wide-mode" ~default:false ~on_checked:S.set_wide_mode ()

(* ---- general pane ---- *)

let revision = "dev" (* logseq.common.version/REVISION — goog-define default *)

let desktop_update_button () : t =
 fun ctx parent ->
  match Ui_services.desktop_updates () with
  | None -> box ~display:`contents [] ctx parent
  | Some service ->
    let state = Ui_services.desktop_updates_signal
      ~scheduler:ctx.Lui_ui.ui_scheduler ~scope:ctx.Lui_ui.ui_scope service in
    let label = T.t "settings.general/check-for-updates" in
    Ui_components.button ~key:"settings-update-check" ~variant:`outline ~size:`sm
      ~accessibility_identifier:"settings-check-for-updates"
      ~label ~text:label
      ~disabled:(reactive (fun (value : Ui_services.desktop_update_state) ->
        not value.configured || value.busy) state)
      ~on_press:(fun _ -> service.check ()) [] ctx parent

let version_row () =
  C.action_row ~key:"ver" ~label:(T.t "settings.general/current-version")
    ~actions:
      [ Ui_components.with_props
          [ Ui_components.Prop.position `relative ]
          (row ~key:"ver-a" ~style_class:"cp__settings-app-updater"
             ~cross:`center ~min_height:20 ~margin_bottom:(-5)
             [ Ui_components.with_props
                 [ ( Ui_components.Prop.position `relative ) ]
                 (row ~key:"ver-c" ~style_class:"ctls" ~cross:`center
                    [ row ~key:"ver-i" ~style_class:"ls-ver-wrap"
                        ~cross:`center ~gap:16 ~flex_wrap:`wrap
                        [ desktop_update_button ()
                        ; text ~key:"ver-v" ~style_class:"ls-ver-text"
                            ~value:version []
                        ; Ui_components.faded_link ~key:"ver-cl"
                            ~url:"https://docs.logseq.com/#/page/changelog"
                            ~text:(T.t "settings.general/changelog") ()
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
    ~label:(T.t "settings.general/language")
    ~actions:
      [ V.lang_trigger ~ctx ~key:"lang-sel" ~height:32
          ~st:lang_label
      ]
    ()

let theme_row ?(density = `regular) ctx =
  let mode = Signal.state ctx.Lui_ui.ui_scheduler (V.current_mode ()) in
  Ui_components.form_row ~key:"theme" ~density ~min_height:85
    ~label:
      (Ui_components.form_label ~key:"theme-l"
         ~density
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
                  (if effective = "dark" then (T.t "settings.general/theme-light")
                   else (T.t "settings.general/theme-dark")))
              (Signal.value mode))
         ())
    ~control:
      (row ~key:"theme-rc" ~cross:`center ~gap:8 ~min_width:0 ~flex_wrap:`wrap
         [ column ~key:"theme-a" ~min_width:0 [ V.theme_modes_ul ~st:mode ]
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

let editor_font_row ?(density = `regular) () =
  let font = S.current_editor_font () in
  let fb t label font_family =
    font_button ~key:("font-" ^ t) ~label ~font_family ~active:(font.S.ftype = t)
      ~on_click:(fun () -> S.set_editor_font_type t)
  in
  C.it_row ~key:"font" ~density ~cross:`center ~label:(T.t "settings.general/editor-font")
    ~min_height:(if density=`compact then 72 else 80)
    [ row ~key:"font-btns" ~gap:8 ~min_width:0 ~flex_wrap:`wrap
        [ fb "default" "Default" "var(--ls-font-family, Inter)"
        ; fb "serif" "Serif" "Lyon-Text, Georgia, ui-serif, serif"
        ; fb "mono" "Mono" "iawriter-mono, Nitti, Menlo, Courier, monospace" ]
    ; Ui_components.with_props
        [ Ui_components.Prop.font_size "0.875rem"
        ; Ui_components.Prop.line_height "1.25rem"
        ; Ui_components.Prop.label_opacity 0.7 ]
        (Ui_components.checkbox ~key:"font-g" ~gap:4 ~margin_top:12
          ~min_height:(if density=`compact then 20 else 28)
          ~text:(T.t "settings.general/editor-font-set-global") ~label:(T.t "settings.general/editor-font-set-global")
          ~checked:font.S.fglobal
          ~on_toggle:(function
            | Lui_protocol.ToggleChanged (_,checked) -> S.set_editor_font_global checked
            | _ -> ()) [])
    ]

type accent_palette =
  | Tomato | Red | Crimson | Pink | Plum | Purple | Violet
  | Indigo | Blue | Cyan | Teal | Green | Grass | Orange

type accent_swatch = No_accent | Logseq_accent | Palette of accent_palette

type swatch_level = Step6 | Step7 | Step9

let swatch_suffix = function
  | Step6 -> "06"
  | Step7 -> "07"
  | Step9 -> "09"

let palette_name = function
  | Tomato -> "tomato" | Red -> "red" | Crimson -> "crimson" | Pink -> "pink"
  | Plum -> "plum" | Purple -> "purple" | Violet -> "violet" | Indigo -> "indigo"
  | Blue -> "blue" | Cyan -> "cyan" | Teal -> "teal" | Green -> "green"
  | Grass -> "grass" | Orange -> "orange"

(* Persisted strings remain an external boundary, never a palette constructor. *)
let accent_name = function
  | No_accent -> "none"
  | Logseq_accent -> "logseq"
  | Palette palette -> palette_name palette

let accent_swatches =
  No_accent :: Logseq_accent :: List.map (fun palette -> Palette palette)
    [Tomato; Red; Crimson; Pink; Plum; Purple; Violet; Indigo; Blue; Cyan;
     Teal; Green; Grass; Orange]

let color_label = function
  | No_accent -> T.t "settings.general/accent-color-none-desc"
  | Logseq_accent -> T.t "settings.general/accent-color-logseq"
  | Palette palette -> T.t ("color/" ^ palette_name palette)

let swatch_color swatch level =
  let suffix = swatch_suffix level in
  match swatch with
  | No_accent -> "hsl(var(--foreground))"
  | Logseq_accent -> "var(--rx-logseq-" ^ suffix ^ ")"
  | Palette palette -> "var(--rx-" ^ palette_name palette ^ "-" ^ suffix ^ ")"

let swatch_background = function
  | No_accent -> "transparent"
  | (Logseq_accent | Palette _) as swatch -> swatch_color swatch Step9

let swatch_hover_background = function
  | No_accent -> "hsl(var(--accent))"
  | (Logseq_accent | Palette _) as swatch -> swatch_color swatch Step9

(* cljs settings.cljs accent-color-row: 20px rounded-full button at
   opacity .5 (1 when active), 1px/4px outline in rx-06/07, inner 8px
   dot in rx-07 hidden unless active; "none" is a red bar *)
let accent_swatch ~key ~current color =
  let active = accent_name color = current and none = color = No_accent in
  let outline = "0 0 0 " ^ (if active then "4px " else "1px ")
    ^ swatch_color color (if active then Step7 else Step6) in
  row ~key ~height:20 ~main:`start ~cross:`center
    ~opacity:(if active then 1. else 0.5)
    [ Ui_components.with_props
        [ Ui_components.Prop.shadow outline
        ; Ui_components.Prop.focus_shadow
            (outline ^ ", 0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--ring))")
        ; Ui_components.Prop.hover_background (swatch_hover_background color)
        ; Ui_components.Prop.pressed_opacity 1. ]
      (Ui_components.button ~key:(key ^ "-b") ~variant:`ghost
        ~style_class:(C.btn_cls ~variant:`Text ())
        ~label:(color_label color)
        ~background:(swatch_background color)
        ~selected:active
        ~border_width:0
        ~width:20 ~height:20 ~corner_radius:999 ~padding:0
        ~on_press:(fun _ -> S.set_accent (accent_name color))
        [ box ~key:(key ^ "-s")
           
            ~opacity:(if none || active then 1. else 0.)
            ~width:(if none then 12 else 8) ~height:(if none then 2 else 8)
            ~corner_radius:9999
            ~background:
              (if none then "#b91c1c" else swatch_color color Step7)
            []
        ])
    ]

let accent_row ~modal =
  let current = S.current_accent () in
  let swatches =
    column ~key:"acc-l"
      ~margin_left:(if modal then 4 else 0)
      ~margin_bottom:(if modal then 4 else 0)
      [ grid ~key:"acc-grid" ~columns:8 ~gap:8
          ?container_relative_frame:(if modal then Some `horizontal else None)
          ?width:(if modal then None else Some 216) ~max_width:(if modal then 320 else 250)
          (List.mapi
             (fun i color -> accent_swatch ~key:("acc-" ^ string_of_int i) ~current color)
             accent_swatches) ]
  in
  column ~key:"acc"
    [ C.action_row ~key:"acc-r"
        ~density:`compact
        ~label:(T.t "settings.general/accent-color") ~col_gap:16 ~label_lh:"1.25rem"
        ~actions:[ swatches ] ~stretch:modal
        ~desc:
          (if modal then []
           else
             [ Ui_components.with_props [Ui_components.Prop.padding_left 24]
                 (row ~key:"acc-sp"
                    [ C.kbd_seq ~key:"acc-k" ~binding:"c c" [ "c"; "c" ] ])
             ])
        ()
    ; Ui_components.with_props [Ui_components.Prop.opacity 0.5]
        (text ~key:"acc-n" ~style_class:"ls-desc" ~margin_top:4
          ~font_size:"0.875rem" ~line_height:"1.25rem"
          ~value:(T.t "settings.general/accent-color-alert") [])
    ]

let panel ~key ?(style_class="panel-wrap") ?margin_bottom children : t =
 fun ctx parent ->
  let children=match children with
    | first::rest -> Ui_components.with_props [Ui_components.Prop.padding_top 14] first :: rest
    | [] -> [] in
  (column ~key ~style_class ~gap:16 ~padding:4 ~min_width:0 ~max_width:600
     ~container_relative_frame:`horizontal ?margin_bottom children) ctx parent

let general_pane ~modal ctx =
  panel ~key:"pane-general"
    [ version_row ()
    ; language_row ctx
    ; theme_row ctx
    ; editor_font_row ()
    ; accent_row ~modal
    ; C.edit_link_row ~key:"cfg" ~label:(T.t "settings.general/custom-configuration")
        ~button:(T.t "settings.general/edit-config-edn") ~href:"#/file/logseq%2Fconfig.edn" ()
    ; C.edit_link_row ~key:"css" ~label:(T.t "settings.general/custom-theme")
        ~button:(T.t "settings.general/edit-custom-css") ~href:"#/file/logseq%2Fcustom.css" ()
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

let dfmt_menu ~scope ~key mst options current =
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
             let settings_current = S.capture_context () in
             let active () =
               Ui_effect.alive scope && settings_current ()
             in
             if String.trim fmt <> "" && not (S.value ()).date_format_saving then
               ignore
                 ((let* saved = S.set_date_format fmt in
                   if saved && active () then begin
                     Toast.success (T.t "settings.general/refresh-required-feedback");
                     Dialogs_state.close_all ()
                   end;
                   Js.Promise.resolve ())
                  |> Js.Promise.catch (fun _ ->
                      if active () then Toast.error (T.t "ui/save-changes-error");
                      Js.Promise.resolve ()));
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
         ~text:(T.t "settings.editor/custom-date-format") ())
    ~control:
      (column ~key:"dfmt-w" ~max_width:320 ~cross:`stretch
         [ Ui_components.with_props
             [Ui_components.Prop.font_size "0.75rem"]
             (select ~key:"dfmt-s"
             ~width:200 ~height:29 ~corner_radius:4
             ~padding_horizontal:8 ~padding_vertical:0
             ~border_width:1 ~border_color:"var(--lx-gray-06)"
             ~background:"var(--lx-gray-03)"
             ~text:current
             ~disabled:(reactive (fun (s : S.t) ->
               s.journal_uuid = None || s.date_format_saving) (S.signal ()))
             ~on_press:(fun _ ->
               Signal.set mst (not (Runtime.signal_get mst));
               Runtime.flush ())
             [])
         ; reactive ~equal:( == ) (fun open_ ->
             if open_ then dfmt_menu ~scope:ctx.ui_scope ~key:"dfmt" mst options current
             else spacer ~key:"dfmt-m-x" [])
             (Signal.value mst)
         ])
    ()

let editor_pane ctx =
  panel ~key:"pane-editor"
    [ date_format_row ctx
    ; brackets_row ~key:"brackets" ()
    ; wide_mode_row ~key:"wide" ()
    ; cfg_row ~key:"outdent"
        ~label:(T.t "settings.editor/preferred-outdenting")
        ~label_extra:
          [ C.info_icon ~key:"outdent-i" ~title:(T.t "settings.editor/preferred-outdenting-tip") ]
        ~cfg:"editor/logical-outdenting?" ~default:false ()
    ; cfg_row ~key:"fullb"
        ~label:(T.t "settings.editor/show-full-blocks")
        ~cfg:"ui/show-full-blocks?" ~default:false ()
    ; cfg_row ~key:"pasting"
        ~label:(T.t "settings.editor/preferred-pasting-file")
        ~label_extra:[ C.info_icon ~key:"pasting-i" ~title:(T.t "settings.editor/preferred-pasting-file-hint") ]
        ~cfg:"editor/preferred-pasting-file?" ~default:false ()
    ; cfg_row ~key:"autoexp"
        ~label:(T.t "settings.editor/auto-expand-block-refs")
        ~label_extra:
          [ C.info_icon ~key:"autoexp-i" ~title:(T.t "settings.editor/auto-expand-block-refs-tip") ]
        ~cfg:"ui/auto-expand-block-refs?" ~default:true ()
    ; storage_row ~key:"sttip"
        ~label:(T.t "settings.editor/enable-shortcut-tooltip") ~key_:"shortcut-tooltip?" ~default:true
        ~on_checked:S.set_shortcut_tooltip ()
    ; cfg_row ~key:"tooltips"
        ~label:(T.t "settings.editor/enable-tooltip") ~cfg:"ui/enable-tooltip?" ~default:true ()
    ; cfg_row ~key:"puball"
        ~label:(T.t "settings.editor/enable-all-pages-public") ~cfg:"publishing/all-pages-public?"
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
    (* ls-dc is display:contents — the box is transparent on web, so the
     shortcut cells flow as direct children of the action wrap *)
    box ~key ~style_class:"ls-dc" ~display:`contents
      [
        Ui_parts.inline_flex_group ~key:(key ^ "w") ~style_class:"shui-shortcut-wrap"
          [
            row ~key:(key ^ "d") ~cross:`center
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
                                ~value:
                                  (if k = Cmdk_view.g_opt () then
                                     Cmdk_view.print_shortcut_key
                                       (Cmdk_host.services ()) k
                                   else k);
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

let initial_keymap () =
  { km_query = ""; km_filter = Keymap_data.All; km_collapsed = [];
    km_keys = []; km_recording = false; km_committed = false;
    km_revision = Keymap_data.revision () }

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
  let count model =
    string_of_int
      (Keymap_data.count ~query:model.km_query ~label:keymap_label filter)
  in
  reactive ~equal:(fun before after -> active before = active after)
    (fun model ->
      let checked = active model in
      Ui_components.with_props
        [ Ui_components.Prop.height_auto
        ; Ui_components.Prop.font_size "0.75rem"
        ; Ui_components.Prop.line_height "1rem"
        ; Ui_components.Prop.cursor `pointer
        ]
        (Ui_parts.string_prop Lui_protocol.AccessibilityLabel
           ~value:(reactive
             (fun model -> title ^ {js| · |js} ^ count model)
             (Signal.value st))
        (Ui_components.button ~key ~variant:`ghost
           ~foreground:
             (if checked then "var(--lx-gray-12, var(--rx-gray-12))"
              else "var(--lx-gray-09, var(--rx-gray-09))")
           ~selected:checked ~min_height:0 ~padding_vertical:2 ~padding_horizontal:8
           ~corner_radius:9999 ~border_width:1
           ~border_color:
             (if checked then "transparent"
              else "var(--lx-gray-06, var(--ls-border-color, hsl(var(--border))))")
           ~background:
             (if checked then
                "var(--lx-gray-06-alpha, var(--rx-gray-06-alpha))"
              else "transparent")
           ~on_press:(fun _ ->
             let model = Runtime.signal_get st in
             Runtime.signal_set st
               { model with
                 km_filter =
                   (if model.km_filter = filter then Keymap_data.All else filter) })
           [ row ~key:"label" ~cross:`center ~gap:0
               [ text ~key:"title" ~font_weight:(if checked then 500 else 400)
                   ~foreground:"inherit" ~value:title []
               ; Ui_components.with_props [ Ui_components.Prop.opacity 0.6 ]
                   (text ~key:"count" ~font_weight:400 ~foreground:"inherit"
                      ~value:(reactive (fun model -> {js| · |js} ^ count model)
                        (Signal.value st)) [])
               ] ])))
    (Signal.value st)

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
                            ~padding:0 ~icon:(`app "x")
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

let keymap_key_control ?editing st =
  let open_ _ =
    let model = Runtime.signal_get st in
    if model.km_recording then keymap_close_recorder st
    else begin
      Option.iter (fun state -> Runtime.signal_set state None) editing;
      Runtime.signal_set st
        {
          model with
          km_query = "";
          km_recording = true;
          km_committed = model.km_keys <> [];
        }
    end
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
                ~label:(T.t "keymap/search-by-keys") ~icon:(`app "keyboard")
                ?text:
                  (if model.km_keys = [] then Some (T.t "keymap/search-by-keys")
                   else None)
                ~on_press:open_
                (if model.km_keys = [] then []
                 else [ keymap_recorded_keys model.km_keys ]))
            (Signal.value st);
          if_
            ~test:
              (reactive (fun model -> model.km_keys <> []) (Signal.value st))
            (Ui_components.button ~variant:`ghost ~width:20 ~height:20 ~min_width:0
               ~min_height:0 ~padding:4 ~icon:(`app "x")
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

let keymap_controls ?editing st =
  let categories =
    List.filter_map
      (function Keymap_data.Category title -> Some title | _ -> None)
      Keymap_data.items
  in
  Ui_components.with_props
    [ Ui_components.Prop.position `sticky
    ; Ui_components.Prop.inset_top 0.
    ; Ui_components.Prop.z_index 10
    ; Ui_components.Prop.padding_top 20
    ; Ui_components.Prop.padding_bottom 5
    ]
  (column ~key:"km-ctl" ~style_class:"cp__shortcut-page-x-pane-controls" ~gap:8
    ~padding_horizontal:16
    ~background:"hsl(var(--background))"
    [
      row ~key:"km-tb" ~style_class:"shortcut-toolbar-row" ~cross:`center
        ~main:`space_between ~flex_wrap:`wrap ~gap:12
        [
          box ~key:"km-sw-w" ~grow:1. ~min_width:0
            [
              Ui_components.search_row ~key:"km-sw" ~height:26
                ~font_size:"0.875rem" ~pad_left:28 ~pad_right:28 ~autofocus:true
                ~placeholder:(T.t "keymap/search-placeholder")
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
          keymap_key_control ?editing st;
        ];
      row ~key:"km-pills" ~style_class:"shortcut-pills-row" ~cross:`center
        ~main:`space_between ~gap:8 ~flex_wrap:`wrap
        [
          toggle_group ~key:"km-fp" ~gap:4 ~style_class:"shortcut-filter-pills"
            ~border_width:0 ~background:"transparent"
            [
              keymap_pill st ~key:"km-pa" ~title:(T.t "keymap/all") Keymap_data.All;
              keymap_pill st ~key:"km-pc" ~title:(T.t "keymap/custom")
                Keymap_data.Custom;
              keymap_pill st ~key:"km-pu" ~title:(T.t "keymap/unset")
                Keymap_data.Unset;
              keymap_pill st ~key:"km-pd" ~title:(T.t "keymap/disabled")
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
                   ~label:(T.t "keymap/toggle-categories-pane") ~icon:(`app "fold")
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
                   ~label:(T.t "keymap/refresh-all") ~icon:(`app "refresh")
                   ~on_press:(fun _ ->
                     Keymap_data.reload_shortcuts ();
                     Runtime.signal_set st
                       { (Runtime.signal_get st) with km_revision = Keymap_data.revision () })
                   [];
               ]);
        ];
    ])

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
  Ui_components.with_props
    [Ui_components.Prop.font_size "15px"; Ui_components.Prop.line_height "1.5"]
    (list_item ~key ~style_class:"th" ~on_press
    ~margin_bottom:8
    ~padding_vertical:4 ~padding_horizontal:8 ~corner_radius:4
    ~background:"var(--lx-gray-03, hsl(var(--muted)))"
    [ row ~grow:1. ~min_width:0 ~main:`space_between ~cross:`center ~gap:8
      [ text ~key:(key ^ "s") ~style_class:"ls-th-strong"
        ~font_size:"15px" ~line_height:"1.5" ~font_weight:600
        ~grow:1. ~min_width:0
        ~value:(I18n.t (keymap_category label)) []
    ; icon ~key:(key ^ "i") ~style_class:"ls-row" ~size:`sm
        ~name:(if collapsed then `app "chevron-right" else `app "chevron-down") []
      ]
    ])

let keymap_editor st editing (r : Keymap_data.row) : t =
 fun ctx parent ->
  let id = Keymap_data.command_id r.title in
  let draft = Signal.state ctx.Lui_ui.ui_scheduler ([], false) in
  let saved = Signal.state ctx.ui_scheduler (Keymap_data.revision (), None, "") in
  let close () =
    Runtime.signal_set editing None;
    Runtime.signal_set st { (Runtime.signal_get st) with
      km_revision = Keymap_data.revision () }
  in
  let current () =
    Keymap_data.row_with_shortcut ~mac:(Ui_services.env_is_mac ()) r
      (Keymap_data.effective_shortcut id)
  in
  let persist message f =
    match f () with
    | snapshot ->
        Runtime.signal_set draft ([], false);
        Runtime.signal_set saved (Keymap_data.revision (), Some snapshot, message)
    | exception _ -> Toast.error (T.t "ui/save-changes-error")
  in
  let accept () =
    let keys, _ = Runtime.signal_get draft in
    let value = String.concat " " keys in
    if keys <> [] && not (Keymap_data.already_bound id value) then
      let peers = (Keymap_data.binding_conflicts id value).exact in
      let message = if peers = [] then T.t "keymap/shortcut-added"
        else T.t1 "keymap/reassigned-from"
          (String.concat ", " (List.map keymap_label peers)) in
      persist message (fun () -> Keymap_data.reassign_binding id value)
  in
  let record ev =
    let strokes, committed = Runtime.signal_get draft in
    let change =
      if ev.Ui_services.composing then Keymap_record.Ignore
      else if ev.key = Some "Enter" && (ev.meta || ev.ctrl) && strokes <> [] then
        (accept (); Keymap_record.Ignore)
      else if ev.key = Some "Backspace" && strokes <> [] &&
        (Keymap_data.already_bound id (String.concat " " strokes)
         || (Keymap_data.binding_conflicts id (String.concat " " strokes)).exact <> [])
      then Keymap_record.Set ([], false)
      else if ev.key = Some "Backspace" then
        match Keymap_record.key ev with
        | None -> Keymap_record.Ignore
        | Some key -> Keymap_record.Set ([key], true)
      else Keymap_record.update ~strokes ~committed ev in
    match change with
    | Ignore -> ()
    | Close -> close ()
    | Set (keys, committed) -> Runtime.signal_set draft (keys, committed)
  in
  Keyboard_capture.acquire ~scope:ctx.ui_scope record;
  popover ~key:"shortcut-customize" ~anchor:`below ~anchor_alignment:`end_
    ~width:288 ~min_width:0 ~padding:12 ~corner_radius:8
    ~background:"hsl(var(--background))" ~border_width:1
    ~border_color:"hsl(var(--border))"
    ~on_dismiss:(fun _ -> close ())
    [ column ~gap:12 ~min_width:0
        [ text ~font_weight:600 ~value:(keymap_label r) []
        ; reactive (fun _ -> column ~gap:8 ~min_width:0
            (List.mapi (fun i (binding : Keymap_data.binding) ->
              row ~key:("binding-" ^ string_of_int i) ~gap:8 ~cross:`center
                ~min_width:0 ~flex_wrap:`wrap
                [ keymap_binding ~key:("bound-" ^ string_of_int i) binding
                ; Ui_components.button ~variant:`ghost ~size:`icon
                    ~icon:(`app "x") ~label:(T.t "keymap/remove-binding")
                    ~on_press:(fun _ -> persist (T.t "keymap/shortcut-removed") (fun () ->
                        let bindings = Keymap_data.bindings id
                          |> List.filter (fun value -> not (Keymap_data.same_binding value binding.data)) in
                        Keymap_data.apply_binding_changes [id, Keymap_data.binding_value bindings])) [] ])
              (current ()).bindings)) (Signal.value saved)
        ; text ~value:(T.t "keymap/press-a-shortcut") []
        ; reactive (fun (strokes, _) -> keymap_recorded_keys ~wrap:true strokes)
            (Signal.value draft)
        ; reactive (fun (strokes, _) ->
            let value = String.concat " " strokes in
            column ~gap:4 ~min_width:0
              ((if Keymap_data.already_bound id value then
                  [text ~value:(T.t "keymap/already-bound") []]
                else []) @
               (let conflicts = Keymap_data.binding_conflicts id value in
                List.map (fun row ->
                  text ~value:(T.t1 "keymap/used-by-action" (keymap_label row)) []) conflicts.exact
                @ List.map (fun peer ->
                  row ~gap:4 ~flex_wrap:`wrap
                    [text ~value:(T.t "keymap/deactivates-chord") [];
                     text ~value:(keymap_label peer) []]) conflicts.prefix
                @ List.map (fun row ->
                  text ~value:(T.t1 "keymap/also-used-for-action" (keymap_label row)) []) conflicts.cross_context)))
            (Signal.value draft)
        ; reactive (fun (_, snapshot, message) ->
            row ~gap:8 ~min_width:0 ~flex_wrap:`wrap
              ([text ~value:message []] @ match snapshot with
               | None -> []
               | Some snapshot ->
                   [Ui_components.button ~variant:`ghost ~size:`sm
                     ~text:(T.t "keymap/undo") ~on_press:(fun _ ->
                       match Keymap_data.save_shortcuts snapshot with
                       | () -> Runtime.signal_set draft ([], false);
                           Runtime.signal_set saved (Keymap_data.revision (), None, "")
                       | exception _ -> Toast.error (T.t "ui/save-changes-error")) []]))
            (Signal.value saved)
        ; row ~gap:8 ~min_width:0 ~flex_wrap:`wrap
            [ Ui_components.button ~variant:`primary ~size:`sm
                ~text:(reactive (fun (keys, _) ->
                  if (Keymap_data.binding_conflicts id (String.concat " " keys)).exact = []
                  then T.t "ui/save" else T.t "keymap/reassign") (Signal.value draft))
                ~disabled:(reactive (fun (keys, _) -> keys = [] ||
                    Keymap_data.already_bound id (String.concat " " keys))
                    (Signal.value draft))
                ~on_press:(fun _ -> accept ()) []
            ; Ui_components.button ~variant:`outline ~size:`sm
                ~text:(T.t "keymap/reset-to-default")
                ~disabled:(reactive (fun _ -> not (Keymap_data.custom r)) (Signal.value saved))
                ~on_press:(fun _ -> persist (T.t "keymap/reset") (fun () -> Keymap_data.reset_binding id)) []
            ; Ui_components.button ~variant:`ghost ~size:`sm ~text:(T.t "ui/cancel")
                ~on_press:(fun _ -> close ()) []
            ]
        ]
    ] ctx parent

let keymap_row st editing ~key (r : Keymap_data.row) =
  let open Keymap_data in
  (* the title tooltip attr was DOM-only — dropped *)
  Ui_components.with_props
    [ Ui_components.Prop.width_auto;
      Ui_components.Prop.font_size "15px";
      Ui_components.Prop.line_height "1.4285714285714286" ]
    (list_item ~key ~style_class:"shortcut-row"
    ~padding_vertical:4 ~padding_horizontal:8
    ~margin_horizontal:(-4) ~margin_bottom:4
    ~on_press:(fun _ -> Runtime.signal_set st
        { (Runtime.signal_get st) with km_recording = false };
        Runtime.signal_set editing (Some (command_id r.title)))
    [ row ~key:(key ^ "r") ~cross:`center ~main:`space_between ~grow:1.
        ~min_width:0 ~gap:12 ~flex_wrap:`wrap
        [ box ~key:(key ^ "l") ~grow:1. ~min_width:0
            [ text ~key:(key ^ "lx") ~style_class:"ls-kbd-label"
                ~font_size:"15px" ~line_height:"1.4285714285714286"
                ~value:(I18n.t (command_key_of r.title)) []
            ]
        ; row ~key:(key ^ "a") ~cross:`center ~gap:6 ~min_width:0 ~flex_wrap:`wrap
        (if r.unset then
           [ text ~key:(key ^ "u")
                ~value:(T.t "keymap/unset")
               []
           ]
         else if Keymap_data.disabled r then
           [ text ~value:(T.t "keymap/disabled") [] ]
         else
           List.mapi
             (fun i b ->
               keymap_binding ~key:(key ^ "b" ^ string_of_int i) b)
             r.bindings)
        ]
    ; if_ ~test:(reactive (fun selected ->
        selected = Some (command_id r.title)) (Signal.value editing))
        (keymap_editor st editing r)
    ])

let keymap_pane ?state ?(embedded=false) () : t =
 fun context parent ->
  Keymap_data.reload_shortcuts ();
  let st =
    match state with
    | Some state -> state
    | None -> Signal.state context.Lui_ui.ui_scheduler (initial_keymap ())
  in
  let editing = Signal.state context.Lui_ui.ui_scheduler None in
  Signal.set st { (Runtime.signal_get st) with km_recording = false;
    km_revision = Keymap_data.revision () };
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
                keymap_row st editing ~key:("km-command-" ^ category ^ "-" ^ row.title) row
                :: elements )
          | _ -> (category, visible, elements))
        ("", true, []) items
    in
    if items = [] then
      column ~key:"km-empty" ~cross:`center ~gap:8 ~padding:24
        [
          icon ~name:(`app "search") ~size:`lg [];
          text ~value:(I18n.t "keymap/no-matching-shortcuts") [];
        ]
    else
      Ui_components.with_props [Ui_components.Prop.overflow `visible]
        (column ~key:"km-ul" ~style_class:"ls-plain-list"
          ~margin:0 ~padding_horizontal:16 ~padding_vertical:0 (List.rev elements))
  in
  (* The first li margin collapses through the master ul and article. *)
  let results_container children =
    Ui_components.with_props [Ui_components.Prop.padding_bottom 16]
      (if embedded then
         column ~key:"km-art" ~min_height:0 ~margin_top:4 children
       else
         scroll ~key:"km-art" ~orientation:`vertical ~grow:1. ~min_height:0
           ~margin_top:4 children) in
  (Ui_components.with_props
     [
       Ui_components.Prop.font_size "0.875rem";
       Ui_components.Prop.line_height "1.25rem";
       Ui_components.Prop.padding_top (if embedded then 12 else 0);
     ]
     (column ~key:"pane-keymap" ~style_class:"cp__shortcut-page-x" ~grow:(if embedded then 0. else 1.)
        ~min_height:0
        [
          keymap_controls ~editing st;
          results_container
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
    ~icon:(`app "edit") ~icon_placement:`trailing ~text:label
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
        ~label:(T.t "settings.advanced/disable-sentry")
        ~detail:
          [ text ~key:"usage-d" ~style_class:"ls-desc"
              ~value:(T.t "settings.advanced/disable-sentry-desc") [] ]
        ~on:(not (S.instrument_disabled ()))
        ~on_checked:S.set_usage_diagnostics ()
    ; C.toggle_row ~key:"devm"
        ~label:(T.t "settings.advanced/developer-mode")
        ~detail:
          [ text ~key:"devm-d" ~style_class:"ls-desc"
              ~value:(T.t "settings.advanced/developer-mode-desc") [] ]
        ~on:(S.developer_mode ()) ~on_checked:S.set_developer_mode ()
    ; C.action_row ~key:"syncurl"
        ~label:(T.t "settings.sync-server/url")
        ~actions:
          [ url_button ~key:"syncurl-b"
              ~label:(storage_url "sync-server-url" "Logseq Sync")
              ~on_open:(fun () -> Dialogs_state.open_ "sync-server")
          ]
        ()
    ; C.action_row ~key:"puburl"
        ~label:(T.t "settings-page/publish-server-url")
        ~actions:
          [ url_button ~key:"puburl-b"
              ~label:(storage_url "publish-server-url" (T.t "settings-page/publish-server-url-default"))
              ~on_open:(fun () -> Dialogs_state.open_ "publish-server")
          ]
        ()
    ]

(* ---- features pane ---- *)

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
  let saving = Signal.state ctx.Lui_ui.ui_scheduler false in
  let saved = ref current in
  C.it_row ~key:"homep" ~label:(T.t "settings.features/home-default-page")
    [ box ~key:"homep-w" ~style_class:"ls-select-wrap" ~grow:1.
        [ Ui_components.input ~key:"homep-in"
            ~accessibility_identifier:"home-default-page" ~width:220
            ~height:26
            ~submit_on_blur:true
            ~style_class:"form-input is-small"
            ~text:(reactive (fun value -> value) (Signal.value home_text))
            ~disabled:(reactive (fun value -> value) (Signal.value saving))
            ~on_input:(fun ev ->
              match ev with
              | Lui_protocol.TextChanged (_, q) ->
                  Runtime.signal_set home_text q
              | _ -> ())
            ~on_submit:(fun _ ->
              let value = Runtime.signal_get home_text in
              if value <> !saved && not (Runtime.signal_get saving) then begin
                Runtime.signal_set saving true;
                let origin = Runtime.model () in
                S.set_home_page value (fun res ->
                  if res = S.Home_ok then saved := value;
                  if Ui_effect.alive ctx.Lui_ui.ui_scope then begin
                    Runtime.signal_set saving false;
                    let current = Runtime.model () in
                    if current.Model.repo = origin.Model.repo
                       && current.Model.context_revision = origin.Model.context_revision then
                      match res with
                      | S.Home_ok -> Toast.success (T.t "settings.features/home-default-page-update-success")
                      | S.Home_missing -> Toast.warning (T.page_not_found_msg value)
                      | S.Home_error -> Toast.error (T.t "ui/save-changes-error")
                  end)
              end)
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
        ~label:(T.t "settings/plugins")
        ~actions:
          [ row ~key:"plugs-a" ~style_class:"ls-toolbar-gap"
              (C.switch_controls ~key:"plugs" ~on:(S.plugin_system ())
                 ~on_checked:S.set_plugin_system ())
          ]
        ()
    ; switch_action_row ~key:"cards"
        ~label:(T.t "settings.features/enable-flashcards")
        ~on:(S.config_bool "feature/enable-flashcards?" ~default:true)
        ~on_checked:(fun checked ->
          S.config_set_bool "feature/enable-flashcards?" checked)
        ()
    ]

(* ---- shell ---- *)

let nav_items () =
  [ ("general", (T.t "settings/general"), "adjustments")
  ; ("editor", (T.t "settings/editor"), "writing")
  ; ("keymap", (T.t "settings/keymap"), "keyboard")
  ; ("advanced", (T.t "settings/advanced"), "bulb")
  ; ("features", (T.t "settings/features"), "app-feature")
  ]

let nav_gap = 8

let nav_menu_height _viewport =
  let count = List.length (nav_items ()) in
  (count * Ui_components.nav_item_height) + ((count - 1) * nav_gap)

let nav_aside_height viewport =
  32 + 40 + 16 + nav_menu_height viewport + 8

let article_min_height = 192

let tab_title tab =
  match List.find_opt (fun (id, _, _) -> id = tab) (nav_items ()) with
  | Some (_, l, _) -> l
  | None -> (T.t "settings/general")

let nav_item ~key (id, label, icn) =
  C.class_signal (S.signal ())
    (fun (s : S.t) ->
      if s.tab = id then "active settings-menu-item"
      else "settings-menu-item")
    (Ui_components.nav_item ~key ~data_id:id ~icon:icn
       ~text:label
       ~selected:(reactive (fun (s : S.t) -> s.tab = id) (S.signal ()))
       ~on_press:(fun _ -> S.set_tab id) ())

let pane_of ~modal ~keymap ctx tab =
  match tab with
  | "editor" -> editor_pane ctx
  | "keymap" ->
      Ui_components.with_props [Ui_components.Prop.padding_top 0]
        (keymap_pane ~state:keymap ~embedded:true ())
  | "advanced" -> advanced_pane ()
  | "features" -> features_pane ctx
  | _ -> general_pane ~modal ctx

let same_config ((s : S.t),(a : Model.t)) ((t : S.t),(b : Model.t)) =
  s == t && a.repo = b.repo && a.context_revision = b.context_revision
  && a.graph_config = b.graph_config

let article ~modal ~keymap ms ctx =
  let viewport_height = 0.7 in
  let content (s : S.t) _ =
    let is_keymap = s.tab = "keymap" in
    let children =
      [ Ui_components.with_props
          [ Ui_components.Prop.padding_top (if is_keymap then 22 else 8)
          ; Ui_components.Prop.padding_bottom 8 ]
        (row ~key:"art-h" ~style_class:"cp__settings-header"
          ~cross:`center ~main:`start ~gap:8
          ?height:(if is_keymap then None else Some 40)
          ~padding_horizontal:(if is_keymap then 16 else 0)
          [ heading ~key:"art-ht" ~level:1
              ~style_class:"cp__settings-category-title"
              ~font_size:"1.25rem" ~font_weight:400 ~line_height:"1.75rem"
              ~value:
                (reactive (fun (s : S.t) -> tab_title s.tab)
                   (S.signal ()))
              []
          ])
      ; pane_of ~modal ~keymap ctx s.tab
      ]
    in
    let body =
      column ~key:"settings-article-body" ~padding:(if is_keymap then 0 else 16)
        ~min_width:0 ?min_height:(if is_keymap then None else Some 0) children
    in
    if s.tab = "keymap" then
      Ui_components.with_props
        [Ui_components.Prop.height_auto] body
    else body
  in
  Ui_components.with_props
    [Ui_components.Prop.height_viewport viewport_height]
    (scroll ~key:"settings-article" ~style_class:"settings-article" ~orientation:`vertical
    ~data_attrs:["role", "article"]
    ~grow:1. ~min_height:article_min_height ~min_width:0
       [reactive ~equal:same_config content (S.signal ()) ms])

let inner ~modal ms : t =
 fun ctx parent ->
  S.ensure ctx;
  S.activate ();
  let keymap = Signal.state ctx.Lui_ui.ui_scheduler (initial_keymap ()) in
  let viewport=Ui_services.viewport_width_signal ~scheduler:ctx.Lui_ui.ui_scheduler
    ~scope:ctx.Lui_ui.ui_scope in
  let max_height_viewport = 0.75 in
  let inner_box children =
    scroll ~key:"settings-inner" ~style_class:"cp__settings-inner"
      ~orientation:`vertical ~min_width:0
      [ Ui_parts.int_prop Lui_protocol.MinHeight
          ~value:(reactive (fun viewport ->
            if viewport>=768. then 0
            else nav_aside_height viewport + article_min_height) viewport)
          (Ui_components.with_props
            [Ui_components.Prop.max_height_viewport max_height_viewport]
            (row ~key:"settings-columns" ~min_width:0
              ~orientation:(reactive (fun viewport -> if viewport>=768. then `horizontal else `vertical) viewport)
              ~cross:`stretch children)) ]
  in
  let node =
    column ~key:"settings" ~accessibility_identifier:"settings"
      [ Ui_components.with_props
          [ Ui_components.Prop.min_height_viewport 0.55
          ; ( Ui_components.Prop.max_height_viewport max_height_viewport ) ]
          (inner_box
             [ Ui_parts.int_prop Lui_protocol.MinWidth
                 ~value:(reactive (fun viewport -> if viewport>=768. then 256 else 160) viewport)
                 (Ui_parts.int_prop Lui_protocol.MaxWidth
                   ~value:(reactive (fun viewport -> if viewport>=768. then 256 else int_of_float viewport) viewport)
                 (Ui_parts.int_prop Lui_protocol.MinHeight
                   ~value:(reactive (fun viewport ->
                     if viewport>=768. then 0
                     else nav_aside_height viewport) viewport)
                 (Ui_components.scroll_column ~key:"settings-aside"
                 ~style_class:"settings-aside"
                 ~data_attrs:["role", "complementary"]
                 ~background:
                   "var(--lx-gray-03-alpha, var(--rx-gray-03-alpha))"
                 ~padding:16
                 ~gap:16
                 [ row ~key:"aside-h"
                     ~style_class:"cp__settings-header"
                     ~cross:`center ~main:`start ~gap:8 ~height:40 ~min_height:40
                     ~padding:8
                     [ heading ~key:"aside-ht" ~level:1
                         ~style_class:"cp__settings-modal-title"
                         ~font_size:"1.5rem" ~font_weight:600 ~line_height:"2rem"
                         ~data_attrs:
                           [ "style", "text-transform: lowercase" ]
                         ~value:(T.t "nav/settings") []
                     ]
                 ; Ui_parts.int_prop Lui_protocol.MinHeight
                     ~value:(reactive (fun viewport -> nav_menu_height viewport) viewport)
                     (list ~key:"aside-menu"
                     ~style_class:"settings-menu" ~padding:0 ~gap:nav_gap ~margin_bottom:8
                     (List.mapi
                        (fun i it ->
                          nav_item ~key:("nav-" ^ string_of_int i) it)
                        (nav_items ())))
                 ])))
             ; article ~modal ~keymap ms ctx
             ])
      ]
  in
  node ctx parent

(* page entry: #/settings *)
let view ms : t = inner ~modal:false ms

(* dialog body: .settings-modal wrapper like cljs *)
let modal_body (ms : Model.t Signal.signal) : t =
  fun ctx parent ->
    let node =
      (* cljs general() calls (accent-color-row false) in the settings
         dialog too — modal=true is only for the compact appearance
         popup (as-modal-picker grid, no shortcut chips) *)
      column ~key:"settings-modal" ~style_class:"settings-modal"
        ~corner_radius:12
        [ inner ~modal:false ms ]
    in
    node ctx parent

(* cljs settings.cljs appearance(): the header dots "Appearance" item opens
   a compact popup (id appearance_settings) anchored under
   .toolbar-dots-btn — five rows sharing the settings renderers, wrapped
   in the same ui__dropdown-menu-content shell as the dots menu *)
let appearance_rows ctx =
  [ theme_row ~density:`compact ctx
  ; editor_font_row ~density:`compact ()
  ; wide_mode_row ~key:"app-wide" ~density:`compact ()
  ; brackets_row ~key:"app-brackets" ~density:`compact ()
  ; accent_row ~modal:true
  ]

let appearance_body ms : t =
 fun ctx parent ->
  S.ensure ctx;
  let native = Lui_ui.host ctx = Lui_protocol.NshHost in
  let content =
    column ~key:"appearance_settings"
      ~accessibility_identifier:"appearance_settings"
      ~style_class:"cp__settings-appearance-dialog-inner" ~padding:20
      [ reactive ~equal:same_config (fun _ _ ->
          column ~key:"app-rows" ~gap:16 (appearance_rows ctx))
          (S.signal ()) ms ] in
  let content = if native then
      Ui_components.with_props [Ui_components.Prop.max_height_viewport 0.85]
        (scroll ~key:"appearance-scroll" ~orientation:`vertical ~min_height:0
           ~accessibility_identifier:"appearance-scroll" [content])
    else content in
  let surface = if native then Ui_components.menu_surface_chrome
    else Ui_components.menu_surface in
  let node =
    surface
      (popover ~transition:Ui_components.popover_transition ~key:"appearance-wrap"
          ~anchor:`below ~anchor_target:"toolbar-dots-btn" ~anchor_alignment:`end_
          (* NSH aligns to the real trigger and owns collision placement. The
             point-anchor arrow correction belongs to the other hosts. *)
          ~anchor_alignment_offset:
            (if Lui_ui.host ctx = Lui_protocol.NshHost then 0. else -5.5)
          ~anchor_offset:0. ~width:622 ~role:`dialog
          ~on_dismiss:(fun _ ->
            Runtime.send (Action.Appearance_set false))
          ~style_class:"ui__dropdown-menu-content appearance-popup"
          ~min_width:192
          [ content ])
  in
  node ctx parent
