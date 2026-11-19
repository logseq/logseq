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

let version_row () =
  C.action_row ~key:"ver" ~label:(T.t "settings.general/current-version")
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

let color_names =
  [ "tomato"; "red"; "crimson"; "pink"; "plum"; "purple"; "violet"
  ; "indigo"; "blue"; "cyan"; "teal"; "green"; "grass"; "orange" ]

let color_label = function
  | "none" -> (T.t "settings.general/accent-color-none-desc")
  | "logseq" -> (T.t "settings.general/accent-color-logseq")
  | "tomato" -> (T.t "color/tomato")
  | "red" -> (T.t "color/red")
  | "crimson" -> (T.t "color/crimson")
  | "pink" -> (T.t "color/pink")
  | "plum" -> (T.t "color/plum")
  | "purple" -> (T.t "color/purple")
  | "violet" -> (T.t "color/violet")
  | "indigo" -> (T.t "color/indigo")
  | "blue" -> (T.t "color/blue")
  | "cyan" -> (T.t "color/cyan")
  | "teal" -> (T.t "color/teal")
  | "green" -> (T.t "color/green")
  | "grass" -> (T.t "color/grass")
  | _ -> (T.t "color/orange")

(* cljs settings.cljs accent-color-row: 20px rounded-full button at
   opacity .5 (1 when active), 1px/4px outline in rx-06/07, inner 8px
   dot in rx-07 hidden unless active; "none" is a red bar *)
let accent_swatch ~key ~current color =
  let active = color = current and none = color = "none" in
  let outline = "0 0 0 " ^ (if active then "4px " else "1px ")
    ^ (if none then "hsl(var(--foreground))"
       else "var(--rx-" ^ color ^ (if active then "-07)" else "-06)")) in
  row ~key ~height:20 ~main:`start ~cross:`center
    ~opacity:(if active then 1. else 0.5)
    [ Ui_components.with_props
        [ Ui_components.Prop.shadow outline
        ; Ui_components.Prop.focus_shadow
            (outline ^ ", 0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--ring))")
        ; Ui_components.Prop.hover_background ("var(--rx-" ^ color ^ "-09)")
        ; Ui_components.Prop.pressed_opacity 1. ]
      (Ui_components.button ~key:(key ^ "-b") ~variant:`ghost
        ~style_class:(C.btn_cls ~variant:`Text ())
        ~label:(color_label color)
        ~background:("var(--rx-" ^ color ^ "-09)")
        ~selected:active
        ~border_width:0
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
  let swatches =
    column ~key:"acc-l"
      ~margin_left:(if modal then 4 else 0)
      ~margin_bottom:(if modal then 4 else 0)
      [ grid ~key:"acc-grid" ~columns:8 ~gap:8
          ?container_relative_frame:(if modal then Some `horizontal else None)
          ?width:(if modal then None else Some 216) ~max_width:(if modal then 320 else 250)
          (List.mapi
             (fun i color -> accent_swatch ~key:("acc-" ^ string_of_int i) ~current color)
             names) ]
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
        box ~key:(key ^ "w") ~style_class:"shui-shortcut-wrap"
          ~display:`inline_flex
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
           [ row ~key:"label" ~cross:`center ~gap:3
               [ text ~key:"title" ~font_weight:(if checked then 500 else 400)
                   ~foreground:"inherit" ~value:title []
               ; Ui_components.with_props [ Ui_components.Prop.opacity 0.6 ]
                   (text ~key:"count" ~font_weight:400 ~foreground:"inherit"
                      ~value:(reactive (fun model -> {js|· |js} ^ count model)
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

let keymap_escape st =
  let current = Runtime.signal_get st in
  if String.trim current.km_query = "" then Ui_services.dom_focus_body ()
  else Runtime.signal_set st { current with km_query = "" }

let keymap_controls ?editing ?identifier ?on_appear ?search_identifier st =
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
    ?accessibility_identifier:identifier ?on_appear
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
                ?input_identifier:search_identifier
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
  let timer = ref None in
  let cancel () =
    Option.iter Ui_services.timers_clear_timeout !timer;
    timer := None
  in
  Signal.on_dispose ctx.ui_scope cancel;
  let close () =
    cancel ();
    Runtime.signal_set editing None;
    Runtime.signal_set st { (Runtime.signal_get st) with
      km_revision = Keymap_data.revision () }
  in
  let current () =
    Keymap_data.row_with_shortcut ~mac:(Ui_services.env_is_mac ()) r
      (Keymap_data.effective_shortcut id)
  in
  let persist message f =
    cancel ();
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
    let strokes, evaluated = Runtime.signal_get draft in
    let conflicts = Keymap_data.binding_conflicts id (String.concat " " strokes) in
    let clear () = cancel (); Runtime.signal_set draft ([], false) in
    if ev.Ui_services.composing then ()
    else if ev.key = Some "Escape" then
      if strokes <> [] && not evaluated then clear () else close ()
    else if ev.key = Some "Enter" && (ev.meta || ev.ctrl)
        && evaluated && conflicts.exact <> [] then accept ()
    else if ev.key = Some "Backspace" && evaluated && strokes <> [] then clear ()
    else if ev.key = Some "Backspace" && strokes = [] then
      (match List.rev (Keymap_data.bindings id) with
       | [] -> ()
       | _ :: rest -> persist (T.t "keymap/shortcut-removed") (fun () ->
           Keymap_data.apply_binding_changes
             [id, Keymap_data.binding_value (List.rev rest)]))
    else if evaluated && conflicts.exact <> [] then ()
    else match Keymap_record.key ev with
      | None -> ()
      | Some key ->
          let keys = if evaluated then [key] else strokes @ [key] in
          if List.length keys <= 5 then begin
            cancel ();
            Runtime.signal_set draft (keys, false);
            timer := Some (Ui_services.timers_timeout (fun () ->
              timer := None;
              if Ui_effect.alive ctx.ui_scope then begin
                Runtime.signal_set draft (keys, true);
                if not (Keymap_data.already_bound id (String.concat " " keys))
                   && (Keymap_data.binding_conflicts id (String.concat " " keys)).exact = []
                then accept ()
              end) 400)
          end
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
                       cancel ();
                       match Keymap_data.save_shortcuts snapshot with
                       | () -> Runtime.signal_set draft ([], false);
                           Runtime.signal_set saved (Keymap_data.revision (), None, "")
                       | exception _ -> Toast.error (T.t "ui/save-changes-error")) []]))
            (Signal.value saved)
        ; divider ~height:1 ~background:"hsl(var(--border))" []
        ; reactive (fun (keys, evaluated) _ ->
            let hint label keys = row ~gap:4 ~cross:`center
              [text ~font_size:"12px" ~foreground:"var(--lx-gray-11)"
                ~value:(T.t label) []; keymap_recorded_keys keys] in
            let conflict = (Keymap_data.binding_conflicts id (String.concat " " keys)).exact <> [] in
            row ~gap:8 ~min_width:0 ~main:`space_between ~cross:`center
              [ row ~gap:4
                  (if (keys = [] || evaluated) && Keymap_data.custom (current ()) then
                    [ Ui_components.button ~variant:`ghost ~size:`sm
                        ~text:(T.t "keymap/reset")
                        ~on_press:(fun _ ->
                          let revision = Keymap_data.revision () in
                          persist (T.t "keymap/reset-to-default")
                            (fun () -> Keymap_data.reset_binding id);
                          if Keymap_data.revision () <> revision then
                            timer := Some (Ui_services.timers_timeout (fun () ->
                              timer := None;
                              if Ui_effect.alive ctx.ui_scope then close ()) 300)) [] ]
                   else [])
              ; row ~gap:8 ~cross:`center
                  ((if evaluated && conflict then
                      [hint "keymap/hint-reassign"
                        [if Ui_services.env_is_mac () then "meta+enter" else "ctrl+enter"]]
                    else [])
                   @ (if (keys = [] || evaluated) && (Keymap_data.bindings id <> [] || conflict)
                      then [hint "keymap/hint-remove" ["backspace"]] else [])
                   @ [hint (if keys <> [] && not evaluated then "keymap/hint-cancel"
                       else "keymap/hint-close") ["escape"]]) ])
            (Signal.value draft) (Signal.value saved)
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
  let viewport = Ui_services.viewport_height_signal
      ~scheduler:context.Lui_ui.ui_scheduler ~scope:context.ui_scope in
  let width = Ui_services.viewport_width_signal
      ~scheduler:context.ui_scheduler ~scope:context.ui_scope in
  let header_height = Signal.state context.ui_scheduler 120. in
  let identifier = "keymap-controls-" ^ Ui_services.env_random_uuid () in
  let measure_header () =
    Ui_effect.task ~scope:context.ui_scope (Ui_services.dom_measure_rect identifier)
      ~ok:(fun (_, _, _, height) ->
        if height > 0. then Runtime.signal_set header_height height)
      ~error:(fun error -> Ui_services.log_error ("Shortcut header measurement failed", error)) in
  let subscription = Signal.subscribe ~emit_initial:false width (fun _ -> measure_header ()) in
  Signal.on_dispose context.ui_scope (fun () -> Signal.dispose_subscription subscription);
  Keymap_data.reload_shortcuts ();
  let st =
    match state with
    | Some state -> state
    | None -> Signal.state context.Lui_ui.ui_scheduler (initial_keymap ())
  in
  let editing = Signal.state context.Lui_ui.ui_scheduler None in
  let search_identifier = identifier ^ "-search" in
  Ui_services.dom_subscribe_document_event ~scope:context.ui_scope ~capture:true
    "keydown" (fun ev ->
      if ev.Ui_services.key = Some "Escape" && not ev.composing
         && not ev.default_prevented
         && Option.fold ~none:false ~some:(fun target ->
           target.Ui_services.closest ("#" ^ search_identifier) <> None) ev.target then begin
        ev.prevent_default ();
        ev.stop_immediate ();
        keymap_escape st
      end);
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
      Ui_components.with_props
        [Ui_components.Prop.foreground "var(--lx-gray-09, var(--rx-gray-09))"]
      (Ui_parts.int_prop Lui_protocol.MinHeight
        ~value:(reactive (fun height header ->
          max 0 (int_of_float ((height *. 0.6) -. header))) viewport (Signal.value header_height))
      (column ~key:"km-empty" ~cross:`center ~main:`center ~gap:8
        ~on_appear:(fun _ -> measure_header ())
        [
          Icons.icon ~size:24. "list-search";
          text ~value:(I18n.t "keymap/no-matching-shortcuts") [];
        ]))
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
          keymap_controls ~editing ~identifier ~search_identifier
            ~on_appear:(fun _ -> measure_header ()) st;
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

let toggle_detail ~key label =
  Ui_components.with_props [Ui_components.Prop.opacity 0.5]
    (text ~key ~grow:1. ~min_width:0 ~font_size:"0.875rem"
       ~line_height:"1.25rem" ~value:(T.t label) [])

let advanced_pane () =
  panel ~key:"pane-advanced"
    [ C.toggle_row ~key:"usage"
        ~label:(T.t "settings.advanced/disable-sentry")
        ~detail:
          [ toggle_detail ~key:"usage-d" "settings.advanced/disable-sentry-desc" ]
        ~on:(not (S.instrument_disabled ()))
        ~on_checked:S.set_usage_diagnostics ()
    ; C.toggle_row ~key:"devm"
        ~label:(T.t "settings.advanced/developer-mode")
        ~detail:
          [ toggle_detail ~key:"devm-d" "settings.advanced/developer-mode-desc" ]
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
        [ Ui_components.with_props
            [ Ui_components.Prop.font_size "0.75rem"
            ; Ui_components.Prop.margin_top 4 ]
          (Ui_components.form_input ~key:"homep-in"
            ~accessibility_identifier:"home-default-page" ~width:200
            ~height:30 ~corner_radius:4
            ~submit_on_blur:true
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
            [])
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

module Account_settings = struct
  let enabled = false

  let caption value = text ~font_size:"0.875rem" ~value []
  let title value = heading ~level:2 ~font_size:"1rem" ~font_weight:600 ~value []
  let button ?(variant = `outline) value action =
    Ui_components.button ~variant ~text:value ~on_press:(fun _ -> action ()) []

  let run ctx request ~ok ~error =
    Ui_effect.task ~scope:ctx.Lui_ui.ui_scope (Subs_state.task_of_promise request)
      ~ok ~error:(fun _ -> error ())

  let request ?body method_ url =
    let open Promise_ext in
    match Collaborators.auth_init ?body ~method_ () with
    | None -> failwith "Account settings require authentication"
    | Some init ->
        let* response = Fetch.fetchWithInit url init in
        if not (Fetch.Response.ok response) then failwith "Account request failed";
        if method_ = Fetch.Delete then Js.Promise.resolve Js.Json.null
        else Fetch.Response.json response

  let body pairs =
    Fetch.BodyInit.make (Daemon_client.json_stringify (Daemon_client.jobj pairs))

  let field label value =
    column ~gap:4 ~grow:1. ~min_width:0
      [caption label; Ui_components.form_input ~label ~height:36 ~text:value []]

  let account : t =
   fun ctx parent ->
    let info = Signal.state ctx.Lui_ui.ui_scheduler None in
    let logged_in = Option.fold ~none:false ~some:(fun v -> String.trim v <> "")
        (Ui_services.storage_get "refresh-token") in
    if logged_in then
      run ctx (request ~body:(body []) Fetch.Post "https://api.logseq.com/file-sync/user_info")
        ~ok:(fun data -> Runtime.signal_set info (Some data))
        ~error:(fun () -> Runtime.signal_set info (Some Js.Json.null));
    let login () =
      Dialogs_state.close_named "settings";
      Dialogs_state.open_ "login"
    in
    let line label content =
      row ~gap:24 ~cross:`start
        [box ~width:144 [caption (T.t ("account/" ^ label))];
         column ~grow:1. ~min_width:0 ~gap:12 content]
    in
    let plan label price summary features =
      card ~grow:1. ~min_width:0 ~padding:16 ~corner_radius:8
        ~background:"var(--lx-gray-03)"
        [column ~gap:8 (title (T.t ("account/" ^ label)) :: title price
          :: caption (T.t ("account/" ^ summary))
          :: List.map (fun key -> caption (T.t ("account/" ^ key))) features)]
    in
    let view =
      if not logged_in then
        [line "authentication"
           [caption (T.t "account/benefits-desc");
            row ~gap:16 [button ~variant:`primary (T.t "account/sign-up") login;
                         button (T.t "ui/login") login]];
         card ~background:"var(--lx-gray-02)" ~padding:16 ~corner_radius:8
           [column ~gap:16
              [row ~gap:16 [title (T.tf "account/discover-sync-desc" ["Logseq Sync"]);
                            caption (T.t "account/synced-status")];
               row ~gap:16
                 [plan "plan-free" "$0" "plan-free-summary"
                    ["unlimited-unsynced-graphs"; "free-plan-sync-limit";
                     "no-asset-syncing"; "core-features"];
                  plan "plan-pro" ("$10 / " ^ T.t "account/month") "plan-pro-summary"
                    ["unlimited-unsynced-graphs"; "pro-plan-sync-limit"; "sync-assets-limit";
                     "early-access-alpha-beta"; "upcoming-cloud-features"]]]]]
      else
        [reactive (function
           | None -> caption (T.t "ui/loading")
           | Some info ->
               let status = Collaborators.jstr info "LemonStatus" in
               let pro = Option.fold ~none:false
                   ~some:(fun s -> List.mem s ["active"; "on_trial"; "cancelled"]) status
                 || (match Collaborators.jfield info "UserGroups" with
                     | Some groups ->
                         Option.fold ~none:false ~some:(Array.exists (fun group ->
                             Js.Json.decodeString group = Some "pro")) (Js.Json.decodeArray groups)
                     | None -> false) in
               let disabled value = Ui_components.button ~variant:`outline ~disabled:true ~text:value [] in
               let upgrade () =
                 let url = "https://logseqdemo.lemonsqueezy.com/checkout/buy/13e194b5-c927-41a8-af58-ed1a36d6000d" in
                 Ui_services.env_open_url
                   (match Rtc_flows.user_uuid () with None -> url | Some uuid ->
                     url ^ "?checkout[custom][user_uuid]=" ^ Ui_services.uri_encode_component uuid)
               in
               let billing =
                 match status with
                 | None -> []
                 | Some _ ->
                     let date k = Option.bind (Collaborators.jstr info k) Dates.parse in
                     let billed = match date "LemonEndsAt", date "LemonRenewsAt" with
                       | Some d, _ when d > Ui_services.time_now () -> Some ("billing-expires-on-label", d)
                       | Some d, _ -> Some ("billing-expired-on-label", d)
                       | None, Some d -> Some ("billing-next-date-label", d)
                       | _ -> None in
                     [line "billing"
                        (Option.to_list (Option.map (fun (key, d) ->
                            caption (T.tf ("account/" ^ key) [Dates.short_date_of_ts d])) billed)
                         @ [disabled (T.t "account/open-invoices")])]
               in
               column ~gap:20
                 ([line "current-plan"
                     [card ~padding:16 ~corner_radius:8 ~background:"var(--lx-gray-03)"
                        [column ~gap:12
                           ([row ~gap:12 ~main:`space_between ~cross:`center
                               (title (T.t (if pro then "account/plan-pro" else "account/plan-free")) ::
                                (if status <> None then [disabled (T.t "account/manage-plan")]
                                 else if not pro then [button (T.t "account/upgrade-plan") upgrade]
                                 else []))]
                            @ (if pro then [caption (T.tf "settings.account/synced-graphs" ["0"; "10"; "0%"])] else [])
                            @ [caption (T.tf "settings.account/storage-usage"
                                 ["0.0"; (if pro then "100" else "0.05"); "0.0%"])])]]]
                  @ billing
                  @ [line "profile"
                       [row ~gap:12 [field (T.t "account/first-name") ""; field (T.t "account/last-name") ""];
                        caption (T.t "account/username");
                        caption (Option.value ~default:"" (Rtc_flows.email ()))];
                     line "authentication"
                       [row ~gap:12
                          [button (T.t "ui/logout") (fun () ->
                               run ctx (Rtc_flows.sign_out ())
                                 ~ok:(fun () -> Dialogs_state.close_named "settings") ~error:ignore);
                           disabled (T.t "account/reset-password")];
                        disabled (T.t "account/delete-account")]]))
           (Signal.value info)]
    in
    column ~padding_vertical:8 ~gap:24 view ctx parent

  let menu ~key label selected options on_select : t =
   fun ctx parent ->
    let opened = Signal.state ctx.Lui_ui.ui_scheduler false in
    let close () = Runtime.signal_set opened false in
    column ~key ~min_width:0 ~gap:4
      [caption label;
       select ~height:36 ~border_width:1 ~border_color:"var(--lx-gray-06)" ~corner_radius:6
         ~label ~text:(reactive (fun id -> Option.value ~default:"" (List.assoc_opt id options)) selected)
         ~on_press:(fun _ -> Runtime.signal_set opened (not (Signal.get (Signal.value opened)))) [];
       if_ ~test:(Signal.value opened)
          (Ui_components.menu_card ~key:(key ^ "-menu") ~anchor:`below ~anchor_alignment:`start
             ~on_dismiss:(fun _ -> close ())
             (List.map (fun (id, name) -> menu_item ~key:id ~text:name
                ~selected:(reactive ((=) id) selected)
                ~on_press:(fun _ -> close (); on_select id) []) options))]
      ctx parent

  let pat key = T.t ("sync.personal-access-token/" ^ key)
  let permission = function
    | ("read" | "write" | "both") as value -> T.t ("sync.personal-access-token.permission/" ^ value)
    | other -> other

  let latest_pat_expiration now = Dates.add_days now 365

  let expiry value =
    if String.length value <> 10 then None
    else match Dates.parse_local_datetime value with
      | None -> None
      | Some day ->
          let end_ = Dates.shift_day day 1 -. 1. in
          let now = Ui_services.time_now () in
          if end_ > now && day <= latest_pat_expiration now then Some end_ else None

  let local_date value =
    let date = Dates.fields value in
    Printf.sprintf "%04d-%02d-%02d" date.year date.month date.day

  let expiration_picker value : t =
   fun ctx parent ->
    let opened = Signal.state ctx.Lui_ui.ui_scheduler false in
    let set = Runtime.signal_set in
    let close () = set opened false in
    let label = pat "expiration" in
    let trigger = "pat-expiration-trigger" in
    let picker =
      reactive (fun date ->
        popover ~key:"pat-expiration-calendar" ~anchor:`below ~anchor_target:trigger
          ~anchor_alignment:`start
          ~background:"hsl(var(--popover))" ~corner_radius:8 ~border_width:1
          ~border_color:"hsl(var(--border))" ~on_dismiss:(fun _ -> close ())
          [Ui_components.calendar ?initial:(Dates.parse_local_datetime date)
             ~week_starts_on:(Sdk_config.calendar_week_starts_on ())
             ~month_label:T.calendar_month_label ~day_label:T.calendar_day_label
             ~translate:T.t ~initial_focus_day:true
             ~on_pick:(fun ts ->
               let date = local_date ts in
               if Option.is_some (expiry date) then (close (); set value date)) ()])
        (Signal.value value)
    in
    column ~key:"pat-expiration" ~min_width:0 ~gap:4
      [caption label;
       column ~cross:`stretch
         [Ui_components.button ~variant:`outline ~height:36 ~label
            ~accessibility_identifier:trigger
            ~icon:(`app "calendar") ~icon_placement:`trailing
            ~data_attrs:(reactive (fun expanded ->
                ["aria-expanded", string_of_bool expanded]) (Signal.value opened))
            ~text_signal:(Signal.value value)
            ~on_press:(fun _ -> set opened (not (Signal.get (Signal.value opened)))) [];
          if_ ~test:(Signal.value opened) picker]]
      ctx parent

  let tokens : t =
   fun ctx parent ->
    let owner = ctx.Lui_ui.ui_scheduler in
    let list_state = Signal.state owner (`Loading : [`Loading | `Error | `Tokens of Js.Json.t list]) in
    let graphs = Signal.state owner [] and graph = Signal.state owner ""
    and access = Signal.state owner "both" and pending = Signal.state owner false
    and created = Signal.state owner None in
    let end_date = Signal.state owner (local_date (latest_pat_expiration (Ui_services.time_now ()))) in
    let viewport = Ui_services.viewport_width_signal ~scheduler:owner ~scope:ctx.ui_scope in
    let get s = Signal.get (Signal.value s) and set = Runtime.signal_set in
    let url = Rtc_ops.http_base () ^ "/api/v1/personal-access-tokens" in
    let failed () = set pending false; Toast.error (pat "request-error") in
    let reload () =
      run ctx (request Fetch.Get url)
        ~ok:(fun json ->
          match Option.bind (Collaborators.jfield json "tokens") Js.Json.decodeArray with
          | Some data -> set list_state (`Tokens (Array.to_list data))
          | None -> set list_state `Error)
        ~error:(fun () -> set list_state `Error)
    in
    let create () =
      match get graph, expiry (get end_date) with
      | id, Some expires when id <> "" && not (get pending) ->
          set pending true;
          run ctx
            (request Fetch.Post url ~body:(body
               ["graph-id", Js.Json.string id; "permission", Js.Json.string (get access);
                "expires-at", Js.Json.number expires]))
            ~ok:(fun json ->
              match Collaborators.jstr json "token" with
              | Some token -> set pending false; set created (Some token); reload ()
              | None -> failed ())
            ~error:failed
      | _ -> ()
    in
    let revoke id =
      Dialogs_state.ask ~title:(pat "revoke") ~desc:(pat "revoke-confirm")
        ~on_confirm:(fun () ->
          set pending true;
          run ctx (request Fetch.Delete (url ^ "/" ^ Ui_services.uri_encode_component id))
            ~ok:(fun _ -> set pending false; reload ()) ~error:failed) ()
    in
    reload ();
    run ctx (Graphs_ops.list_remote_graphs ())
      ~ok:(fun rows ->
        let items = List.map (fun (name, id, e2ee, _) ->
            (id, name ^ if e2ee then " (E2EE)" else "")) rows in
        Option.iter (fun (id, _) -> set graph id) (List.nth_opt items 0);
        set graphs items)
      ~error:ignore;
    let token_row item =
      let get key = Option.value ~default:"" (Collaborators.jstr item key) in
      let date key =
        match Collaborators.jfield item key with
        | Some v ->
            Option.fold ~none:"" ~some:Dates.short_date_of_ts
              (match Js.Json.decodeNumber v with
               | Some n -> Some n
               | None -> Option.bind (Js.Json.decodeString v) Dates.parse)
        | None -> ""
      in
      row ~key:(get "id") ~gap:12 ~cross:`center ~padding_vertical:10
        [column ~grow:1. ~min_width:0 ~gap:4
           [row ~gap:8 [text ~as_:`Code ~value:(get "token-prefix" ^ "...") [];
                        caption (if get "graph-name" = "" then pat "deleted-graph" else get "graph-name");
                        caption (permission (get "permission"))];
            caption (T.tf "sync.personal-access-token/date-summary" [date "created-at"; date "expires-at"])];
         Ui_components.button ~variant:`ghost ~text:(pat "revoke") ~icon:(`app "trash")
           ~disabled_signal:(Signal.value pending) ~on_press:(fun _ -> revoke (get "id")) []]
    in
    column ~gap:24 ~max_width:592
      [row ~gap:4 ~cross:`center [caption (pat "description");
         link ~url:"https://api.logseq.io/api-docs" ~target:`blank ~text:(pat "api-docs") []];
       column ~gap:12
         [title (pat "create-title");
          reactive (fun options width -> match options with
            | [] -> caption (pat "no-graphs")
            | options ->
                grid ~gap:12 ~columns:(if width >= 768. then 3 else 1)
                  [menu ~key:"pat-graph" (pat "graph") (Signal.value graph) options (set graph);
                   menu ~key:"pat-permission" (pat "permission") (Signal.value access)
                     (List.map (fun p -> (p, permission p)) ["read"; "write"; "both"]) (set access);
                   expiration_picker end_date])
            (Signal.value graphs) viewport;
          row [Ui_components.button ~variant:`primary ~icon:(`app "key") ~text:(pat "create")
            ~disabled:(reactive (fun id date busy -> id = "" || expiry date = None || busy)
              (Signal.value graph) (Signal.value end_date) (Signal.value pending))
            ~on_press:(fun _ -> create ()) []]];
       reactive (function None -> Logseq_el.nothing | Some token ->
         card ~padding:12 ~border_width:1 ~border_color:"var(--lx-gray-06)" ~corner_radius:6
           [column ~gap:8 [title (pat "created-title"); caption (pat "created-warning");
              row ~gap:8 [text ~grow:1. ~min_width:0 ~as_:`Code ~value:token [];
                button (T.t "ui/copy") (fun () ->
                  Ui_services.clipboard_copy token; Toast.success (pat "copied"))]]])
         (Signal.value created);
       column ~gap:8
         [title (pat "existing-title");
          reactive (function
            | `Loading -> caption (T.t "ui/loading")
            | `Error -> caption (pat "request-error")
            | `Tokens [] -> caption (pat "empty")
            | `Tokens xs -> column (List.map token_row xs)) (Signal.value list_state)]]
      ctx parent

  let encryption_key value = T.t ("encryption/" ^ value)

  let key_base64 bytes =
    let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/" in
    let len = String.length bytes in
    String.init (((len + 2) / 3) * 4) (fun index ->
      let b = index / 4 * 3 in
      let byte i = if i < len then Char.code bytes.[i] else 0 in
      match index mod 4 with
      | 0 -> alphabet.[byte b lsr 2]
      | 1 -> alphabet.[((byte b land 3) lsl 4) lor (byte (b + 1) lsr 4)]
      | 2 -> if b + 1 >= len then '=' else alphabet.[((byte (b + 1) land 15) lsl 2) lor (byte (b + 2) lsr 6)]
      | _ -> if b + 2 >= len then '=' else alphabet.[byte (b + 2) land 63])

  let encryption : t =
   fun ctx parent ->
    let owner = ctx.Lui_ui.ui_scheduler in
    let keys = Signal.state owner `Loading and mode = Signal.state owner `Default
    and status = Signal.state owner None and private_key = Signal.state owner None
    and current = Signal.state owner "" and password = Signal.state owner ""
    and reveal_open = Signal.state owner false and pending = Signal.state owner false in
    let set = Runtime.signal_set and get s = Signal.get (Signal.value s) in
    let key = encryption_key in
    let secret label state =
      column ~gap:6 [caption label;
        Ui_components.secure_field ~height:36 ~label ~text_signal:(Signal.value state)
          ~on_input:(function Lui_protocol.TextChanged (_, value) -> set state value | _ -> ()) []]
    in
    let view =
      match Ui_services.storage_get "id-token", Rtc_flows.user_uuid () with
      | Some token, Some user ->
          let s v = Wire.String v in
          let refresh = Option.value ~default:"" (Ui_services.storage_get "refresh-token") in
          let load () =
            run ctx (Runtime.invoke "thread-api/get-user-rsa-key-pair" [s token; s user])
              ~ok:(fun result -> set keys (if result = Wire.Nil then `Absent else `Pair result))
              ~error:(fun () -> set keys `Error)
          in
          let auth_args = [s token; s refresh; s user] in
          let start () =
            let open Promise_ext in
            let* _ = Rtc_ops.sync_app_state (Runtime.model ()).Model.repo in
            Js.Promise.resolve ()
          in
          run ctx (start ()) ~ok:(fun () ->
            load ();
            run ctx (Runtime.invoke1 "thread-api/get-e2ee-password" (s refresh))
              ~ok:(fun w -> Option.iter (set current) (Wire.map_get_string w "password"))
              ~error:ignore) ~error:(fun () -> set keys `Error);
          let change next =
            set status None; set password ""; set mode next
          in
          let submit mode =
            let force = mode = `Forgot in
            let message name = set status (Some (key name)) in
            if not (get pending) && String.trim (get password) <> "" then begin
              set pending true;
              let command, args, progress, success, error =
                if force then ("reset-user-rsa-key-pair", [s (get password)], "force-resetting-password",
                  "force-reset-password-successfully", "failed-to-force-reset-password")
                else ("change-e2ee-password", [s (get current); s (get password)], "updating-password",
                  "password-updated-successfully", "failed-to-update-password")
              in
              message progress;
              run ctx (Runtime.invoke ("thread-api/" ^ command) (auth_args @ args))
                ~ok:(fun _ ->
                  set current (get password); set password ""; set pending false;
                  if force then (set private_key None; load ());
                  message success)
                ~error:(fun () -> set pending false; message error)
            end
          in
          let key_line key_value =
            row ~gap:8
              [text ~as_:`Code ~grow:1. ~min_width:0 ~value:key_value [];
               button (key "copy-key") (fun () -> Ui_services.clipboard_copy key_value)]
          in
          let reveal_dialog : t =
           fun dialog_ctx parent ->
            let unlock = Signal.state owner "" and busy = Signal.state owner false
            and feedback = Signal.state owner None in
            let close () = set reveal_open false in
            let submit () =
              if not (get busy) && String.trim (get unlock) <> "" then begin
                set busy true;
                run dialog_ctx
                  (Runtime.invoke1 "thread-api/reveal-user-rsa-private-key" (s (get unlock)))
                  ~ok:(fun w ->
                    set busy false;
                    match w with
                    | Wire.Binary bytes ->
                        set private_key (Some (key_base64 bytes)); close ()
                    | _ -> set feedback (Some (key "key-unavailable")))
                  ~error:(fun () -> set busy false; set feedback (Some (key "wrong-password")))
              end
            in
            let title = key "enter-password-title" in
            Ui_components.dialog ~key:"reveal-private-key" ~width:(fun _ -> 472.)
              ~data_attrs:["aria-labelledby", "ls-reveal-private-key-title"]
              ~padding_vertical:40 ~padding_horizontal:32 ~gap:32
              ~on_dismiss:(fun _ -> close ())
              [column ~gap:32
                 [text ~font_size:"1.5rem" ~font_weight:500 ~line_height:"2rem"
                    ~accessibility_identifier:"ls-reveal-private-key-title" ~value:title [];
                  column ~gap:16
                    [column ~gap:4
                       [Ui_requests.pw_input ~height:40 ~label:title dialog_ctx ~key:"reveal-password"
                          ~placeholder:"" ~autofocus:true ~value:unlock
                          ~on_enter:submit;
                        reactive (function
                          | None -> spacer []
                          | Some value ->
                              text ~font_size:"0.875rem"
                                ~foreground:"var(--lx-yellow-10)" ~value [])
                          (Signal.value feedback)];
                     Ui_components.button ~variant:`primary ~text:(T.t "ui/submit")
                       ~disabled:(reactive (fun value busy -> String.trim value = "" || busy)
                         (Signal.value unlock) (Signal.value busy))
                       ~on_press:(fun _ -> submit ()) []]];
               Ui_components.dialog_close ~key:"reveal-close" ~label:(T.t "ui/close")
                 ~on_press:(fun _ -> close ())]
              dialog_ctx parent
          in
          let status_line = reactive (function None -> spacer [] | Some msg -> caption msg) (Signal.value status) in
          reactive (function
            | `Loading -> caption (key "fetching-key-pair")
            | `Error -> caption (T.tf "encryption/fetch-key-pair-error" [key "key-unavailable"])
            | `Absent ->
                column ~gap:8 [status_line;
                  Ui_components.button ~variant:`primary ~text:(key "init-key-pair")
                    ~disabled_signal:(Signal.value pending)
                    ~on_press:(fun _ ->
                      set pending true;
                      run ctx (Runtime.invoke "thread-api/init-user-rsa-key-pair" auth_args)
                        ~ok:(fun _ -> set status None; set pending false; load ())
                        ~error:(fun () -> set pending false;
                          set status (Some (T.tf "encryption/init-key-pair-error" [key "key-unavailable"])))) []]
            | `Pair pair ->
                let public = Option.bind (Wire.map_get_string pair "public-key") (fun encoded ->
                  try match Transit.of_string encoded with
                    | Wire.Binary bytes -> Some (key_base64 bytes)
                    | _ -> None
                  with _ -> None) in
                column ~gap:16
                  [column ~gap:4 [caption (key "public-key");
                     Option.fold ~none:(caption (key "key-unavailable")) ~some:key_line public];
                   column ~gap:4 [caption (key "private-key");
                     reactive (function Some value -> key_line value | None ->
                         row [button (key "show-private-key") (fun () -> set reveal_open true)])
                       (Signal.value private_key)];
                   if_ ~test:(Signal.value reveal_open) reveal_dialog;
                   reactive (fun mode ->
                     let explanatory =
                       if mode = `Forgot then [caption (key "forgot-password-warning")]
                       else [caption (T.t "encryption/remember-password");
                             caption (T.t "encryption/cloud-password")] in
                     column ~gap:12 (explanatory @
                       (match mode with
                        | `Default -> [row [button (key "reset-password") (fun () -> change `Reset)]; status_line]
                        | `Reset | `Forgot ->
                            (if mode = `Reset then [secret (key "current-password") current] else [])
                            @ [secret (key "set-new-password") password; status_line;
                               Ui_components.button ~variant:`primary
                                 ~text:(key (if mode = `Forgot then "force-reset-password" else "reset-password"))
                                 ~disabled:(reactive (fun value busy -> String.trim value = "" || busy)
                                     (Signal.value password) (Signal.value pending))
                                 ~on_press:(fun _ -> submit mode) []]
                            @ (if mode = `Reset then [row [button (key "forgot-password-question")
                                 (fun () -> change `Forgot)]] else [])))) (Signal.value mode)])
            (Signal.value keys)
      | _ -> spacer []
    in
    column ~padding_vertical:8 [view] ctx parent
end

(* ---- shell ---- *)

let nav_items () =
  (if Account_settings.enabled then [("account", T.t "settings/account", "user-circle")] else [])
  @ [ ("general", (T.t "settings/general"), "adjustments")
  ; ("editor", (T.t "settings/editor"), "writing")
  ; ("keymap", (T.t "settings/keymap"), "keyboard")
  ; ("advanced", (T.t "settings/advanced"), "bulb")
  ; ("features", (T.t "settings/features"), "app-feature")
  ]
  @ (if Rtc_flows.logged_in () then
       [("collaboration", T.t "settings/collaboration", "users")]
       @ (if Rtc_flows.rtc_group () then
            [("personal-access-tokens", T.t "settings/personal-access-tokens", "key")] else [])
       @ [("encryption", T.t "settings/encryption", "lock")]
     else [])
  @ (if Plugins_view.settings_plugins () <> [] then
       [("plugins-setting", T.t "settings/plugins", "puzzle")] else [])

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
       ~on_press:(fun _ ->
         if id = "plugins-setting" then
           Option.iter (fun (pid, _) -> Plugins_view.open_settings ~browse:true pid)
             (List.nth_opt (Plugins_view.settings_plugins ()) 0)
         else S.set_tab id) ())

let pane_of ~modal ~keymap ctx tab =
  match tab with
  | "editor" -> editor_pane ctx
  | "keymap" ->
      Ui_components.with_props [Ui_components.Prop.padding_top 0]
        (keymap_pane ~state:keymap ~embedded:true ())
  | "advanced" -> advanced_pane ()
  | "features" -> features_pane ctx
  | "account" when Account_settings.enabled -> Account_settings.account
  | "personal-access-tokens" when Rtc_flows.logged_in () && Rtc_flows.rtc_group () ->
      Account_settings.tokens
  | "encryption" when Rtc_flows.logged_in () -> Account_settings.encryption
  | "collaboration" when Rtc_flows.logged_in () -> Collaborators.settings_body
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
                 (Ui_components.with_props [Ui_components.Prop.overflow `auto]
                 (column ~key:"settings-aside"
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
                 ]))))
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
  let node =
    Ui_components.menu_surface
      (popover ~transition:Ui_components.popover_transition ~key:"appearance-wrap"
          ~anchor:`below ~anchor_target:"toolbar-dots-btn" ~anchor_alignment:`end_
          (* The reference point anchor's one-pixel width and five-pixel
             arrow inset put its end edge 5.5 points beyond the trigger. *)
          ~anchor_alignment_offset:(-5.5)
          ~anchor_offset:0. ~width:622 ~role:`dialog
          ~on_dismiss:(fun _ ->
            Runtime.dismiss_appearance ())
          ~style_class:"ui__dropdown-menu-content appearance-popup"
          ~min_width:192
          [ column ~key:"appearance_settings"
              ~accessibility_identifier:"appearance_settings"
              ~style_class:"cp__settings-appearance-dialog-inner"
              ~padding:20
              [ reactive ~equal:same_config (fun _ _ ->
                    (* cljs cp__settings-appearance-dialog-inner:
                       flex-col gap-4 between the .it rows *)
                    column ~key:"app-rows" ~gap:16 (appearance_rows ctx))
                  (S.signal ()) ms ]
          ])
  in
  node ctx parent
