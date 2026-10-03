(* Settings theme/language helpers shared by the settings page, dialog and
   boot. Mirrors components/settings.cljs theme-modes-row + language-row,
   state/use-theme-mode! and theme.cljs DOM effects.
   Storage keys use cljs storage.cljs `(name key)` semantics. *)

open Lui_elements

let dom = Logseq_dom.dom
module T = I18n

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

let unquote s =
  let l = String.length s in
  if l >= 2 && s.[0] = '"' && s.[l - 1] = '"' then String.sub s 1 (l - 2)
  else s

let quoted v = "\"" ^ v ^ "\""

(* cljs :ui/system-theme? default is (or util/mac? util/win32?) *)
let current_mode () =
  let system =
    match Platform.local_storage_get "system-theme?" with
    | Some v -> unquote v = "true"
    | None -> Platform.desktop_os ()
  in
  if system then "system"
  else
    match Platform.local_storage_get "theme" with
    | Some v -> (
        match unquote v with "dark" -> "dark" | _ -> "light")
    | None -> "light"

(* theme.cljs container effect: dataset.theme + .dark class on
   documentElement, dark-theme vs white-theme light-theme on body *)
let apply_theme_dom effective =
  Platform.document_set_data "theme" effective;
  if effective = "dark" then (
    Platform.root_add_class "dark";
    Platform.body_add_class "dark-theme";
    Platform.body_rm_class "light-theme";
    Platform.body_rm_class "white-theme")
  else (
    Platform.root_rm_class "dark";
    Platform.body_rm_class "dark-theme";
    Platform.body_add_class "white-theme";
    Platform.body_add_class "light-theme")

(* state/use-theme-mode!: set dataset.theme + storage; system follows
   prefers-color-scheme *)
let use_mode mode =
  let effective =
    if mode = "system" then (
      Platform.local_storage_set "system-theme?" "true";
      if Browser_ui.prefers_dark () then "dark" else "light")
    else (
      Platform.local_storage_set "system-theme?" "false";
      mode)
  in
  (* cljs stores the *effective* mode in :ui/theme even under system *)
  apply_theme_dom effective;
  Platform.local_storage_set "theme" (quoted effective)

let current_lang () =
  match Platform.local_storage_get "preferred-language" with
  | Some v -> unquote v
  | None -> "en"

let set_language code =
  Platform.local_storage_set "preferred-language" (quoted code);
  Platform.document_set_lang code

let lang_label_for code =
  match List.find_opt (fun (k, _) -> k = code) languages with
  | Some (_, l) -> Platform.utf8 l
  | None -> code

(* language dropdown — LUI select + anchored dropdown_menu (mounted =
   presented on every host; on_dismiss covers outside-tap and Escape) *)
let lang_menu_st : bool Signal.state option ref = ref None

let lang_menu_state ctx =
  match !lang_menu_st with
  | Some s -> s
  | None ->
      let s = Signal.state ctx.Lui_ui.ui_scheduler false in
      lang_menu_st := Some s;
      s

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
         let label = Platform.utf8 label in
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

let theme_item ~st mode label =
  dom ~key:("tm-" ^ mode) ~tag:"li"
    ~style_class_signal:
      (Logseq_dom.class_signal (Signal.value st)
         (fun active -> if active = mode then "active" else ""))
    ~events:"click"
    ~on_dom_event:(fun n _ ->
      if n = "click" then (
        use_mode mode;
        Signal.set st mode;
        Runtime.flush ()))
    [ dom ~key:("tmi-" ^ mode) ~tag:"i"
        (* cljs: .radix only when an accent color is stored
           (:ui/radix-color); mode-active draws the .active>i ring *)
        ~style_class_signal:
          (Logseq_dom.class_signal (Signal.value st)
             (fun active ->
               "mode-" ^ mode
               ^ (if active = mode then " mode-active" else "")
               ^ (if Platform.local_storage_get "radix-color" <> None
                  then " radix"
                  else "")))
        []
    ; dom ~key:("tms-" ^ mode) ~tag:"strong" ~text:label []
    ]

(* ul.cp__theme-modes-options — needs a signal state holding the active mode *)
let theme_modes_ul ~st =
  dom ~key:"tm" ~tag:"ul" ~style_class:"cp__theme-modes-options"
    [ theme_item ~st "light" T.theme_light
    ; theme_item ~st "dark" T.theme_dark
    ; theme_item ~st "system" T.theme_system
    ]

(* shui select trigger + chevron; the popover mounts as a sibling so
   position:fixed anchors it under the trigger on both platforms *)
let lang_trigger ~(ctx : Lui_ui.ui_context) ~key ~h_cls ~st =
  let mst = lang_menu_state ctx in
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
            Signal.set mst (not (Signal.get_state mst));
            Runtime.flush ())
          []
      ; Logseq_dom.dyn ~equal:( == ) (fun open_ ->
            if open_ then lang_menu ~key st mst
            else Logseq_dom.nothing)
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
    dom ~key:"settings" ~style_class:"cp__settings"
      [ dom ~key:"st-h" ~tag:"h2"
          ~style_class:
            "ui__dialog-title" ~text:T.settings_title []
      ; dom ~key:"st-theme" ~style_class:"ls-settings-col"
          [ dom ~key:"st-tl" ~tag:"strong" ~text:T.theme_label []
          ; theme_modes_ul ~st:mode
          ]
      ; dom ~key:"st-lang" ~style_class:"ls-settings-col"
          [ dom ~key:"st-ll" ~tag:"strong" ~text:T.language_label []
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
        if Browser_ui.prefers_dark () then "dark" else "light"
    | m -> m
  in
  use_mode (if cur = "dark" then "light" else "dark")
