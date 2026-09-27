(* Settings dialog body: theme mode picker (.cp__theme-modes-options)
   and language select (.ui__select-trigger with the .ui__select-icon
   svg chevron). Mirrors components/settings.cljs theme-modes-row +
   language-row and state/use-theme-mode!. *)

open Lui_elements

let dom = Logseq_dom.dom
module T = Graphs_text

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

let current_mode () =
  let system =
    match Platform.local_storage_get "ui/system-theme?" with
    | Some v -> unquote v = "true"
    | None -> false
  in
  if system then "system"
  else
    match Platform.local_storage_get "ui/theme" with
    | Some v -> (
        match unquote v with "dark" -> "dark" | _ -> "light")
    | None -> "light"

(* state/use-theme-mode!: set dataset.theme + storage; system follows
   prefers-color-scheme *)
let use_mode mode =
  let effective =
    if mode = "system" then (
      Platform.local_storage_set "ui/system-theme?" "true";
      if Browser_ui.prefers_dark () then "dark" else "light")
    else (
      Platform.local_storage_set "ui/system-theme?" "false";
      mode)
  in
  Platform.document_set_data "theme" effective;
  Platform.local_storage_set "ui/theme" (quoted mode)

let current_lang () =
  match Platform.local_storage_get "preferred-language" with
  | Some v -> unquote v
  | None -> "en"

let set_language code =
  Platform.local_storage_set "preferred-language" (quoted code);
  Platform.document_set_lang code

let lang_dropdown_on : Webapi.Dom.Element.t option ref = ref None

let close_lang_dropdown () =
  match !lang_dropdown_on with
  | Some el ->
      Browser_ui.remove el;
      lang_dropdown_on := None
  | None -> ()

let open_lang_dropdown anchor trigger_text on_pick =
  close_lang_dropdown ();
  let menu = Browser_ui.create "div" in
  Browser_ui.set_class menu
    "ui__select-content relative z-[99999] min-w-[8rem] overflow-hidden \
     rounded-md border bg-popover text-popover-foreground shadow-md";
  let r = Browser_ui.rect_of anchor in
  Browser_ui.set_attr menu "style"
    (Printf.sprintf "position:fixed;left:%.0fpx;top:%.0fpx;z-index:99999"
       (Browser_ui.rect_left r) (Browser_ui.rect_bottom r));
  List.iter
    (fun (code, label) ->
      let it = Browser_ui.create "div" in
      Browser_ui.set_class it
        "ui__select-item relative flex w-full cursor-pointer \
         select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm";
      Browser_ui.set_text it label;
      Browser_ui.add_listener it "click" (fun _ ->
          set_language code;
          on_pick label;
          close_lang_dropdown ());
      Browser_ui.append menu it)
    languages;
  (match Browser_ui.qs "body" with
   | Some b -> Browser_ui.append b menu
   | None -> ());
  lang_dropdown_on := Some menu;
  ignore trigger_text

let theme_item ~st mode label =
  dom ~key:("tm-" ^ mode) ~tag:"li"
    ~style_class_signal:
      (Logseq_dom.class_signal (Signal.value st) (fun active ->
           if active = mode then "active" else ""))
    ~events:"click"
    ~on_dom_event:(fun n _ ->
      if n = "click" then (
        use_mode mode;
        Signal.set st mode;
        Runtime.flush ()))
    [ dom ~key:("tmi-" ^ mode) ~tag:"i" ~style_class:("mode-" ^ mode) []
    ; dom ~key:("tms-" ^ mode) ~tag:"strong" ~text:label []
    ]

let body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let mode = Signal.state ctx.ui_scheduler (current_mode ()) in
  let lang_label =
    Signal.state ctx.ui_scheduler
      (let c = current_lang () in
       match List.find_opt (fun (k, _) -> k = c) languages with
       | Some (_, l) -> l
       | None -> c)
  in
  let node =
    dom ~key:"settings" ~style_class:"cp__settings flex flex-col gap-4"
      [ dom ~key:"st-h" ~tag:"h2"
          ~style_class:
            "ui__dialog-title text-lg font-semibold leading-none \
             tracking-tight" ~text:T.settings_title []
      ; dom ~key:"st-theme" ~style_class:"flex flex-col gap-2"
          [ dom ~key:"st-tl" ~tag:"strong" ~text:T.theme_label []
          ; dom ~key:"st-tm" ~tag:"ul"
              ~style_class:"cp__theme-modes-options"
              [ theme_item ~st:mode "light" T.theme_light
              ; theme_item ~st:mode "dark" T.theme_dark
              ; theme_item ~st:mode "system" T.theme_system
              ]
          ]
      ; dom ~key:"st-lang" ~style_class:"flex flex-col gap-2"
          [ dom ~key:"st-ll" ~tag:"strong" ~text:T.language_label []
          ; dom ~key:"st-ls" ~tag:"button"
              ~style_class:
                "ui__select-trigger flex h-10 w-64 items-center \
                 justify-between rounded-md border border-input \
                 bg-background px-3 py-2 text-sm"
              ~attrs:[ ("type", "button") ]
              ~events:"click"
              ~on_dom_event:(fun n _ ->
                if n = "click" then
                  match Browser_ui.qs ".ui__select-trigger" with
                  | Some el ->
                      open_lang_dropdown el
                        (Signal.get_state lang_label)
                        (fun l ->
                          Signal.set lang_label l;
                          Runtime.flush ())
                  | None -> ())
              [ dom ~key:"lsv" ~tag:"span"
                  ~text_signal:
                    (Signal.map
                       (fun l -> Lui_protocol.StringValue l)
                       (Signal.value lang_label))
                  []
              ; dom ~key:"lsi" ~tag:"span"
                  ~style_class:
                    "ui__select-icon shrink-0 text-muted-foreground"
                  [ dom ~key:"lsvg" ~tag:"svg"
                      ~style_class:"h-4 w-4"
                      ~attrs:
                        [ ("viewBox", "0 0 24 24"); ("fill", "none")
                        ; ("stroke", "currentColor")
                        ; ("stroke-width", "2")
                        ]
                      [ dom ~key:"lsp" ~tag:"path"
                          ~attrs:[ ("d", "m6 9 6 6 6-6") ] []
                      ]
                  ]
              ]
          ]
      ]
  in
  node ctx parent
