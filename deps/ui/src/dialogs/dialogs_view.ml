(* Generic dialog host mounted in .cp__overlays. Renders the
   Dialogs_state stack: each dialog is
   .ui__dialog-overlay > .ui__dialog-content (per-name body) with a
   .ui__dialog-close button; plus a confirm layer (div[role=alertdialog]
   with Confirm/Cancel) and a text-prompt layer (.container >
   h3#modal-headline + input.form-input + Submit) used by import.
   Overlay/Escape close the topmost layer only. *)

open Lui_elements

let dom = Logseq_dom.dom

let overlay_cls =
  "ui__dialog-overlay fixed inset-0 z-50 bg-background/90 flex \
   justify-center items-center"

let content_cls =
  "ui__dialog-content fixed left-[50%] top-[50%] z-50 grid w-full \
   max-w-2xl lg:max-w-3xl gap-4 border sm:rounded-lg bg-background p-6 \
   shadow-lg ui__dialog-zoom-in"

let btn_style =
  "inline-flex items-center justify-center rounded-md text-sm \
   font-medium px-4 py-2"

let is_overlay_click payload =
  Option.fold ~none:false
    ~some:(fun p ->
      String.length
        (Platform.payload_str p "targetClass")
      > 0
      && let tc = Platform.payload_str p "targetClass" in
         let needle = "ui__dialog-overlay" in
         let ln = String.length needle and lt = String.length tc in
         let rec go i =
           i + ln <= lt && (String.sub tc i ln = needle || go (i + 1))
         in
         go 0)
    payload

let close_btn =
  dom ~key:"dlg-close" ~tag:"button"
    ~style_class:
      "ui__dialog-close absolute right-4 top-4 rounded-sm opacity-70 \
       transition-opacity hover:opacity-100"
    ~attrs:[ ("aria-label", "Close"); ("type", "button") ]
    ~events:"click"
    ~on_dom_event:(fun name _ ->
      if name = "click" then Dialogs_state.close_top ())
    [ dom ~key:"x" ~tag:"i" ~style_class:"ti ti-x h-4 w-4" [] ]

let body_of name (ms : Model.t Signal.signal) : t =
  match name with
  | "new-graph" | "add-graph" -> New_graph.body ms
  | "settings" -> Settings_page.modal_body ms
  | "plugins" -> Plugins_view.body ms
  | "login" -> Login_view.body ms
  | "import" | "importer" -> Importer.body ms
  | "export" | "export-graph" -> Exporter.body ms
  | "sync-server" -> Settings_url_view.sync_body ms
  | "publish-server" -> Settings_url_view.publish_body ms
  | _ -> box ~key:("empty-" ^ name) []

(* cljs shui/dialog-open! :label opts — drives .ui__dialog-content[label=…]
   CSS (app-settings -> max-w-5xl/overflow hidden; plugins-dashboard ->
   90vw/1246px) *)
let label_of = function
  | "settings" -> Some "app-settings"
  | "plugins" -> Some "plugins-dashboard"
  | _ -> None
let dialog_view name (ms : Model.t Signal.signal) : t =
  let is_settings = name = "settings" in  dom ~key:("dlg-ov-" ^ name) ~style_class:overlay_cls ~events:"click"
    ~attrs:(if is_settings then [ ("data-align", "top") ] else [])
    ~on_dom_event:(fun n p ->
      if n = "click" && is_overlay_click p then Dialogs_state.close_top ())
    [ dom ~key:("dlg-c-" ^ name)
        ~style_class:
          (content_cls
         ^
         match name with
         | "sync-server" | "publish-server" -> " lg:max-w-2xl"
         | _ -> "")
        ~attrs:
          ([ ("data-state", "open")
           ; ( "style"
             , if is_settings then
                 "transform: translateX(-50%); width: min(1024px,                   calc(100vw - 2rem)); max-width: calc(100vw - 2rem)"
               else "transform: translate(-50%, -50%)" )
           ]
          @
          match label_of name with
          | Some l -> [ ("label", l) ]
          | None -> [])
        [ body_of name ms; close_btn ]
    ]

let btn key label extra act =
  dom ~key ~tag:"button"
    ~style_class:(btn_style ^ " " ^ extra)
    ~attrs:[ ("type", "button") ]
    ~text:label ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then act ())
    []

let confirm_view (c : Dialogs_state.confirm) =
  dom ~key:"cfrm-ov"
    ~style_class:
      "ui__alert-dialog-overlay fixed inset-0 z-50 bg-background/80 \
       backdrop-blur-sm"
    ~events:"click"
    ~on_dom_event:(fun n payload ->
      if
        n = "click"
        && Option.fold ~none:false
             ~some:(fun p ->
               let tc = Platform.payload_str p "targetClass" in
               let needle = "ui__alert-dialog-overlay" in
               let ln = String.length needle
               and lt = String.length tc in
               let rec go i =
                 i + ln <= lt
                 && (String.sub tc i ln = needle || go (i + 1))
               in
               go 0)
             payload
      then Dialogs_state.close_confirm ())
    [ dom ~key:"cfrm"
        ~attrs:
          [ ("role", "alertdialog")
          ; ( "style"
            , "position:fixed;left:50%;top:50%;transform:translate(-50%,-50%)"
            )
          ]
        ~style_class:
          "ui__alert-dialog-content z-50 grid w-full max-w-lg gap-4 \
           border bg-background p-6 shadow-lg sm:rounded-lg"
        [ dom ~key:"cfrm-t" ~tag:"h2"
            ~style_class:
              "ui__alert-dialog-title text-lg font-semibold"
            ~text:c.title []
        ; dom ~key:"cfrm-d" ~tag:"div"
            ~style_class:
              "ui__alert-dialog-description text-sm \
               text-muted-foreground"
            ~text:c.desc []
        ; dom ~key:"cfrm-f"
            ~style_class:
              "ui__alert-dialog-footer flex flex-col-reverse \
               sm:flex-row sm:justify-end sm:space-x-2"
            [ btn "cfrm-cancel" Graphs_text.cancel "border"
                Dialogs_state.close_confirm
            ; btn "cfrm-ok" Graphs_text.confirm
                "bg-primary text-primary-foreground"
                Dialogs_state.confirm
            ]
        ]
    ]

let prompt_view (p : Dialogs_state.prompt) =
  let submit () =
    match Browser_ui.qs ".ui__dialog-content .form-input" with
    | Some el -> Dialogs_state.submit_prompt (Browser_ui.value el)
    | None -> ()
  in
  let input_events name payload =
    match name with
    | "keydown" -> (
        match
          Platform.payload_str (Option.value payload ~default:"{}") "key"
        with
        | "Enter" -> submit ()
        | _ -> ())
    | _ -> ()
  in
  dom ~key:"prmt-ov" ~style_class:overlay_cls
    [ dom ~key:"prmt-c" ~style_class:content_cls
        ~attrs:
          [ ("data-state", "open")
          ; ("style", "transform: translate(-50%, -50%)")
          ]
        [ dom ~key:"prmt-box" ~style_class:"container"
            [ dom ~key:"prmt-h" ~tag:"h3" ~id:"modal-headline"
                ~style_class:"leading-6 font-medium pb-2" ~text:p.title []
            ; dom ~key:"prmt-in" ~tag:"input"
                ~style_class:
                  "form-input block w-full sm:text-sm sm:leading-5 my-2 \
                   mb-4"
                ~attrs:
                  [ ("type", "text"); ("autocomplete", "off")
                  ; ("autofocus", "true") ]
                ~events:"keydown"
                ~on_dom_event:input_events []
            ; btn "prmt-ok" Graphs_text.submit "" (fun () -> submit ())
            ]
        ; close_btn
        ]
    ]

let render (ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  Dialogs_state.ensure ctx;
  Dialogs_state.init ();
  Graphs_mount.init ms;
  let ds = Dialogs_state.signal () in
  let dialogs_sig = Signal.map (fun (d : Dialogs_state.t) -> d.dialogs) ds in
  let confirm_sig =
    Signal.map (fun (d : Dialogs_state.t) -> d.confirm) ds
  in
  let prompt_sig =
    Signal.map (fun (d : Dialogs_state.t) -> d.prompt) ds
  in
  let node =
    box ~key:"dialogs-root"
      [ keyed ~source:dialogs_sig ~key:(fun n -> n) ~cmp:String.compare
          ~mount:(fun name_sig ->
            (* name is stable per key — sample once *)
            dialog_view (Signal.get name_sig) ms)
      ; dyn ~equal:( == ) (fun c ->
            match c with
            | Some c -> confirm_view c
            | None -> box ~key:"no-confirm" [])
          confirm_sig
      ; dyn ~equal:( == ) (fun p ->
            match p with
            | Some p -> prompt_view p
            | None -> box ~key:"no-prompt" [])
          prompt_sig
      ]
  in
  node ctx parent
