(* Settings theme/language helpers shared by the settings page, dialog and
   boot. Mirrors components/settings.cljs theme-modes-row + language-row,
   state/use-theme-mode! and theme.cljs DOM effects.
   Storage keys use cljs storage.cljs `(name key)` semantics. *)

open Lui_elements

module T = I18n
module C = Settings_controls

let languages =
  [ ("en", "English"); ("fr", "Français"); ("de", "Deutsch")
  ; ("nl", "Dutch (Nederlands)"); ("zh-CN", "简体中文")
  ; ("zh-Hant", "繁體中文"); ("af", "Afrikaans"); ("ca", "Català")
  ; ("es", "Español"); ("vi", "Tiếng Việt")
  ; ("nb-NO", "Norsk (bokmål)"); ("pl", "Polski")
  ; ("pt-BR", "Português (Brasileiro)"); ("pt-PT", "Português (Europeu)")
  ; ("ru", "Русский"); ("ja", "日本語"); ("it", "Italiano")
  ; ("tr", "Türkçe"); ("uk", "Українська"); ("ko", "한국어")
  ; ("sk", "Slovenčina"); ("fa", "فارسی"); ("id", "Bahasa Indonesia")
  ; ("cs", "Čeština"); ("ar", "العربية") ]

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
  | Some (_, l) -> Ui_services.literal_text l
  | None -> code

(* language dropdown — LUI select + anchored dropdown_menu (mounted =
   presented on every host; on_dismiss covers outside-tap and Escape) *)
let lang_menu_close mst =
  Signal.set mst false;
  Runtime.flush ()

let lang_menu ~key st mst =
  Lui_elements.dropdown_menu ~key:("lm-" ^ key)
    ~anchor:`below ~anchor_alignment:`start
    ~style_class:"ui__dropdown-menu-content ui__select-content"
    ~on_dismiss:(fun _ev -> lang_menu_close mst)
    (List.mapi
       (fun i (code, label) ->
         let label = Ui_services.literal_text label in
         Lui_elements.menu_item
           ~key:(Printf.sprintf "lmi-%s-%d" key i)
           ~text:label
           ~selected:(code = current_lang ())
           ~style_class:"ui__dropdown-menu-item"
           ~on_press:(fun _ev ->
             set_language code;
             Signal.set st label;
             lang_menu_close mst)
           [])
       languages)

(* li > i(mode swatch) + strong — list_item ~on_press; the .active
   ring class and the mode-* swatch classes stay reactive via
   class_signal since kinds take only a static ~style_class *)
let theme_item ~st mode label =
  C.class_signal (Signal.value st)
    (fun active -> if active = mode then "active" else "")
    (list_item ~key:("tm-" ^ mode)
       ~selected:(reactive (fun active -> active = mode) (Signal.value st))
       ~on_press:(fun _ ->
         use_mode mode;
         Signal.set st mode;
         Runtime.flush ())
       [ (* cljs: .radix only when an accent color is stored
            (:ui/radix-color); mode-active draws the .active>i ring *)
         C.class_signal (Signal.value st)
           (fun active ->
             "mode-" ^ mode
             ^ (if active = mode then " mode-active" else "")
             ^ (if Ui_services.storage_get "radix-color" <> None
                then " radix"
                else ""))
           (box ~key:("tmi-" ^ mode) ~width:92 [])
       ; text ~key:("tms-" ^ mode) ~value:label []
       ])

(* ul.cp__theme-modes-options — needs a signal state holding the active mode *)
let theme_modes_ul ~st =
  list ~key:"tm" ~style_class:"cp__theme-modes-options" ~gap:12
    ~cross:`center
    [ theme_item ~st "light" T.theme_light
    ; theme_item ~st "dark" T.theme_dark
    ; theme_item ~st "system" T.theme_system
    ]

(* shui select trigger + chevron; the popover mounts as a sibling so
   position:fixed anchors it under the trigger on both platforms *)
let lang_trigger ~(ctx : Lui_ui.ui_context) ~key ~h_cls ~st =
  let mst = Signal.state ctx.Lui_ui.ui_scheduler false in
  fun uctx parent ->
    (* box (stack kind) so the host anchors the dropdown_menu to the
       select trigger — the cljs combobox markup maps onto select +
       anchored menu_item children *)
    Lui_elements.box ~key:(key ^ "-w")
      ~style_class:("ls-select-wrap " ^ h_cls)
      [ Lui_elements.select ~key:(key ^ "-s")
          ~text_signal:(Signal.value st)
          ~style_class:("ui__select-trigger " ^ h_cls)
          ~on_press:(fun _ev ->
            Signal.set mst (not (Runtime.signal_get mst));
            Runtime.flush ())
          []
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
    column ~key:"settings" ~style_class:"cp__settings"
      [ heading ~key:"st-h" ~level:2
          ~style_class:"ui__dialog-title" ~value:T.settings_title []
      ; column ~key:"st-theme" ~style_class:"ls-settings-col"
          [ text ~key:"st-tl" ~value:T.theme_label []
          ; theme_modes_ul ~st:mode
          ]
      ; column ~key:"st-lang" ~style_class:"ls-settings-col"
          [ text ~key:"st-ll" ~value:T.language_label []
          ; lang_trigger ~ctx ~key:"st-ls" ~h_cls:"ls-select-lg"
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
