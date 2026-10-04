(* Settings theme/language helpers shared by the settings page, dialog and
   boot. Mirrors components/settings.cljs theme-modes-row + language-row,
   state/use-theme-mode! and theme.cljs DOM effects.
   Storage keys use cljs storage.cljs `(name key)` semantics. *)


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

(* cljs :ui/system-theme? default is (or util/mac? util/win32?) *)
let current_mode () =
  let system =
    match Platform.local_storage_get "system-theme?" with
    | Some v -> Platform.storage_unquote v = "true"
    | None -> Platform.desktop_os ()
  in
  if system then "system"
  else
    match Platform.local_storage_get "theme" with
    | Some v -> (
        match Platform.storage_unquote v with
        | "dark" -> "dark"
        | _ -> "light")
    | None -> "light"

(* theme.cljs container effect: dataset.theme + .dark class on
   documentElement, dark-theme vs white-theme light-theme on body *)
let apply_theme_dom effective =
  Web_dom.doc_set_data "theme" effective;
  if effective = "dark" then (
    Web_dom.doc_add_class "dark";
    Web_dom.body_add_class "dark-theme";
    Web_dom.body_rm_class "light-theme";
    Web_dom.body_rm_class "white-theme")
  else (
    Web_dom.doc_rm_class "dark";
    Web_dom.body_rm_class "dark-theme";
    Web_dom.body_add_class "white-theme";
    Web_dom.body_add_class "light-theme")

(* state/use-theme-mode!: set dataset.theme + storage; system follows
   prefers-color-scheme *)
let use_mode mode =
  let effective =
    if mode = "system" then (
      Platform.local_storage_set "system-theme?" "true";
      if Web_dom.prefers_dark () then "dark" else "light")
    else (
      Platform.local_storage_set "system-theme?" "false";
      mode)
  in
  (* cljs stores the *effective* mode in :ui/theme even under system *)
  apply_theme_dom effective;
  Platform.local_storage_set "theme" (Platform.storage_quote effective)

let current_lang () =
  match Platform.local_storage_get "preferred-language" with
  | Some v -> Platform.storage_unquote v
  | None -> "en"

let set_language code =
  Platform.local_storage_set "preferred-language"
    (Platform.storage_quote code);
  Web_dom.doc_set_lang code;
  (* fetch the new locale first so the reload boots straight into it;
     `let x = t "..."` bindings freeze at module load so a full reload is
     the honest swap — same as before lazy dicts *)
  ignore
    (I18n.load code
     |> Js.Promise.then_ (fun () ->
            Platform.location_reload ();
            Js.Promise.resolve ()))

let lang_label_for code =
  match List.find_opt (fun (k, _) -> k = code) languages with
  | Some (_, l) -> Platform.utf8 l
  | None -> code

let lang_dropdown_on : Web_dom.el option ref = ref None

let close_lang_dropdown () =
  match !lang_dropdown_on with
  | Some el ->
      Web_dom.el_remove el;
      lang_dropdown_on := None
  | None -> ()

let open_text_dropdown anchor options on_pick =
  close_lang_dropdown ();
  let menu = Web_dom.create_element "div" in
  Web_dom.el_set_class menu
    "ui__select-content relative z-[99999] min-w-[8rem] overflow-hidden \
     rounded-md border bg-popover text-popover-foreground shadow-md";
  let r = Web_dom.el_bounding_rect anchor in
  Web_dom.el_set_attr menu "style"
    (Printf.sprintf "position:fixed;left:%.0fpx;top:%.0fpx;z-index:99999"
       (Web_dom.rect_left r) (Web_dom.rect_bottom r));
  List.iter
    (fun opt ->
      let it = Web_dom.create_element "div" in
      Web_dom.el_set_class it
        "ui__select-item relative flex w-full cursor-pointer \
         select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm";
      Web_dom.el_set_text_content it opt;
      Web_dom.el_on it "click" (fun _ ->
          on_pick opt;
          close_lang_dropdown ());
      Web_dom.el_append_child menu it)
    options;
  (match Web_dom.query_selector "body" with
   | Some b -> Web_dom.el_append_child b menu
   | None -> ());
  lang_dropdown_on := Some menu

let open_lang_dropdown anchor on_pick =
  open_text_dropdown anchor
    (List.map (fun (_, l) -> Platform.utf8 l) languages)
    (fun label ->
      (match
         List.find_opt (fun (_, l) -> Platform.utf8 l = label) languages
       with
       | Some (code, _) -> set_language code
       | None -> ());
      on_pick label)

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
           (:ui/radix-color) *)
        ~style_class:
          ("mode-" ^ mode
          ^ if Platform.local_storage_get "radix-color" <> None
            then " radix"
            else "")
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

(* shui select trigger + chevron; opening the language popover like cljs *)
let lang_trigger ~key ~h_cls ~st ?(dom_id = "") ~anchor_sel =
  dom ~key ~tag:"button" ~id:dom_id
    ~style_class:
      ("ui__select-trigger " ^ h_cls)
    ~attrs:
      [ ("type", "button"); ("role", "combobox")
      ; ("aria-expanded", "false") ]
    ~events:"click"
    ~on_dom_event:(fun n _ ->
      if n = "click" then
        match Web_dom.query_selector anchor_sel with
        | Some el ->
            open_lang_dropdown el (fun l ->
                Signal.set st l;
                Runtime.flush ())
        | None -> ())
    [ dom ~key:(key ^ "v") ~tag:"span"
        ~text_signal:(Logseq_dom.reactive_text Fun.id (Signal.value st))
        []
    ; dom ~key:(key ^ "i") ~tag:"span"
        ~style_class:"ui__select-icon"
        [ dom ~key:(key ^ "svg") ~tag:"svg"
            ~style_class:"ls-icon-sm tabler-icon tabler-icon-chevron-down"
            ~attrs:
              [ ("viewBox", "0 0 24 24"); ("fill", "none")
              ; ("stroke", "currentColor"); ("stroke-width", "2")
              ]
            [ dom ~key:(key ^ "p") ~tag:"path"
                ~attrs:[ ("d", "m6 9 6 6 6-6") ] []
            ]
        ]
    ]

(* cljs ui/toggle-theme — resolve system first, then flip light/dark *)
let toggle_theme () =
  let cur =
    match current_mode () with
    | "system" ->
        if Web_dom.prefers_dark () then "dark" else "light"
    | m -> m
  in
  use_mode (if cur = "dark" then "light" else "dark")
