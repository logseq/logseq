(* Settings theme/language helpers shared by the settings page, dialog and
   boot. Mirrors components/settings.cljs theme-modes-row + language-row,
   state/use-theme-mode! and theme.cljs DOM effects.
   Storage keys use cljs storage.cljs `(name key)` semantics. *)

open Lui_elements

module T = I18n
module C = Settings_controls

let languages =
  [ ("en", "English"); ("fr", {js|Français|js}); ("de", "Deutsch")
  ; ("nl", "Dutch (Nederlands)"); ("zh-CN", {js|简体中文|js})
  ; ("zh-Hant", {js|繁體中文|js}); ("af", "Afrikaans"); ("ca", {js|Català|js})
  ; ("es", {js|Español|js}); ("vi", {js|Tiếng Việt|js})
  ; ("nb-NO", {js|Norsk (bokmål)|js}); ("pl", "Polski")
  ; ("pt-BR", {js|Português (Brasileiro)|js}); ("pt-PT", {js|Português (Europeu)|js})
  ; ("ru", {js|Русский|js}); ("ja", {js|日本語|js}); ("it", "Italiano")
  ; ("tr", {js|Türkçe|js}); ("uk", {js|Українська|js}); ("ko", {js|한국어|js})
  ; ("sk", {js|Slovenčina|js}); ("fa", {js|فارسی|js}); ("id", "Bahasa Indonesia")
  ; ("cs", {js|Čeština|js}); ("ar", {js|العربية|js}) ]

(* cljs :ui/system-theme? default is (or util/mac? util/win32?) — the
   service resolves the raw preference including the host default *)
let current_mode () = Ui_services.theme_mode ()

(* theme.cljs container effect: dataset.theme + .dark class on
   documentElement, dark-theme vs white-theme light-theme on body *)
let last_theme_mode = ref ""

(* cljs theme.cljs :theme-mode-changed — fires on effective-mode
   transitions (user toggle or system-follow), not on boot apply.
   Ordering is semantic: dataset -> plugin hook -> classes. *)
let apply_theme_dom effective =
  (* shared tokens land first — the snapshot is mode-stamped and the
     host installs it before the dataset/classes flip below *)
  Ui_theme.apply effective;
  Ui_services.theme_apply_dataset effective;
  if effective <> !last_theme_mode then (
    let first_apply = !last_theme_mode = "" in
    last_theme_mode := effective;
    if not first_apply then Plugin_host.fire_theme_mode_changed effective);
  Ui_services.theme_apply_classes effective

(* state/use-theme-mode!: set dataset.theme + storage; system follows
   prefers-color-scheme *)
let use_mode mode =
  let effective =
    if mode = "system" then (
      Ui_services.theme_set_system_pref true;
      if Ui_services.theme_prefers_dark () then "dark" else "light")
    else (
      Ui_services.theme_set_system_pref false;
      mode)
  in
  (* cljs stores the *effective* mode in :ui/theme even under system *)
  apply_theme_dom effective;
  Ui_services.theme_set_pref effective

let current_lang () = Ui_services.doc_preferred_lang ()

let set_language code =
  Ui_services.doc_set_lang_pref code;
  Ui_services.doc_set_lang code;
  (* fetch the new locale first so the reload boots straight into it;
     `let x = t "..."` bindings freeze at module load so a full reload is
     the honest swap — same as before lazy dicts *)
  ignore
    (I18n.load code
     |> Js.Promise.then_ (fun () ->
            Ui_services.doc_reload ();
            Js.Promise.resolve ()))

let lang_label_for code =
  match List.find_opt (fun (k, _) -> k = code) languages with
  | Some (_, l) -> l
  | None -> code

(* language dropdown — LUI select + anchored dropdown_menu (mounted =
   presented on every host; on_dismiss covers outside-tap and Escape) *)
let lang_menu_close mst =
  Signal.set mst false;
  Runtime.flush ()

let lang_menu ~key st mst =
  Ui_components.menu_card ~key:("lm-" ^ key) ~max_height:288
    ~cls:"ls-select-content"
    ~anchor:`below ~anchor_alignment:`start
    ~on_dismiss:(fun _ev -> lang_menu_close mst)
    (List.mapi
       (fun i (code, label) ->
         Ui_components.with_props
           [ Ui_components.Prop.font_size "0.875rem"
           ; Ui_components.Prop.line_height "1.25rem"
           ; Ui_components.Prop.hover_background "hsl(var(--muted))" ]
           (Lui_elements.menu_item
              ~key:(Printf.sprintf "lmi-%s-%d" key i)
              ~text:label ~selection_placement:`leading
              ~selected:(code = current_lang ())
              ~gap:8 ~padding_horizontal:8 ~padding_vertical:6
              ~corner_radius:4 ~min_height:32
              ~foreground:"hsl(var(--popover-foreground))"
              ~on_press:(fun _ev ->
                set_language code;
                Signal.set st label;
                lang_menu_close mst)
              []))
       languages)

(* li > i(mode swatch) + strong — list_item ~on_press; the .active
   ring class and the mode-* swatch classes stay reactive via
   class_signal since kinds take only a static ~style_class *)
(* cljs: .radix only when an accent color is stored — no CSS rules
   target it; dropped as dead. option_card carries the .mode-* thumbnail
   (as an <img> now, not a CSS background) + the active ring. *)
(* Native and web hosts use the same bundled theme thumbnails. *)
let theme_thumb_native ~key mode =
  file_image ~key ~path:("img/" ^ mode ^ "-theme.png")
    ~fit:`fill ~width:92 ~height:63 ~corner_radius:4 []

let theme_item ~st mode label =
  let thumbnail =
    if Ui_services.env_url_images () then
      image ~key:("tt-" ^ mode)
        ~url:("../img/" ^ mode ^ "-theme.png") ~alt:label
        ~width:92 ~height:63 ~corner_radius:4
        ~data_attrs:[ "style", "height:63.25px;object-fit:cover" ] []
    else theme_thumb_native ~key:("tt-" ^ mode) mode
  in
  C.class_signal (Signal.value st)
    (fun active -> if active = mode then "active" else "")
    (Ui_components.option_card ~key:("tm-" ^ mode) ~mode ~thumbnail ~label
       ~min_height:85
       ~selected:(reactive (fun active -> active = mode) (Signal.value st))
       ~on_press:(fun _ ->
         use_mode mode;
         Signal.set st mode;
         Runtime.flush ()) ())

(* ul.cp__theme-modes-options — needs a signal state holding the active mode *)
let theme_modes_ul ~st =
  row ~key:"tm" ~style_class:"cp__theme-modes-options" ~gap:12
    ~cross:`center ~min_height:85
    [ theme_item ~st "light" T.theme_light
    ; theme_item ~st "dark" T.theme_dark
    ; theme_item ~st "system" T.theme_system
    ]

(* shui select trigger + chevron; the popover mounts as a sibling so
   position:fixed anchors it under the trigger on both platforms *)
let lang_trigger ~(ctx : Lui_ui.ui_context) ~key ~(height : int) ~st =
  let mst = Signal.state ctx.Lui_ui.ui_scheduler false in
  fun uctx parent ->
    (* box (stack kind) so the host anchors the dropdown_menu to the
       select trigger — the cljs combobox markup maps onto select +
       anchored menu_item children *)
    Lui_elements.box ~key:(key ^ "-w")
      ~style_class:"ls-select-wrap" ~width:256 ~height
      ~max_width:320 ~corner_radius:6
      [ Ui_components.with_props
          [Ui_components.Prop.font_size "0.875rem"; Ui_components.Prop.line_height "1.25rem"]
          (Lui_elements.select ~key:(key ^ "-s")
          ~text_signal:(Signal.value st)
          ~container_relative_frame:`horizontal
          ~width:256 ~height ~corner_radius:6
          ~background:"hsl(var(--background))"
          ~border_width:1 ~border_color:"hsl(var(--border))"
          ~on_press:(fun _ev ->
            Signal.set mst (not (Runtime.signal_get mst));
            Runtime.flush ())
          [])
      ; reactive ~equal:( == ) (fun open_ ->
            if open_ then lang_menu ~key st mst
            else spacer ~key:(key ^ "-lm-x") [])
          (Signal.value mst)
      ]
      uctx parent


(* legacy simple body — kept for non-page callers; the settings dialog now
   renders the full settings panel via Settings_page.modal_body *)
let body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let mode = Signal.state ctx.ui_scheduler (current_mode ()) in
  let lang_label =
    Signal.state ctx.ui_scheduler (lang_label_for (current_lang ()))
  in
  let node =
    column ~key:"settings" ~style_class:"cp__settings" ~gap:16
      [ heading ~key:"st-h" ~level:2
          ~font_size:"1.125rem" ~font_weight:600 ~line_height:"1"
          ~data_attrs:[ ("style", "letter-spacing:-0.01em;margin:0") ]
          ~style_class:"ui__dialog-title" ~value:T.settings_title []
      ; column ~key:"st-theme" ~style_class:"ls-settings-col" ~gap:8
          [ text ~key:"st-tl" ~value:T.theme_label []
          ; theme_modes_ul ~st:mode
          ]
      ; column ~key:"st-lang" ~style_class:"ls-settings-col" ~gap:8
          [ text ~key:"st-ll" ~value:T.language_label []
          ; lang_trigger ~ctx ~key:"st-ls" ~height:40
              ~st:lang_label
          ]
      ]
  in
  node ctx parent

(* cljs ui/toggle-theme — resolve system first, then flip light/dark *)
let toggle_theme () =
  let cur =
    match current_mode () with
    | "system" ->
        if Ui_services.theme_prefers_dark () then "dark" else "light"
    | m -> m
  in
  use_mode (if cur = "dark" then "light" else "dark")
