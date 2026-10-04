(* Generic dialog host mounted in .cp__overlays. Renders the
   Dialogs_state stack: each dialog is
   .ui__dialog-overlay > .ui__dialog-content (per-name body) with a
   .ui__dialog-close button; plus a confirm layer (div[role=alertdialog]
   with Confirm/Cancel) and a text-prompt layer (.container >
   h3#modal-headline + input.form-input + Submit) used by import.
   Overlay/Escape close the topmost layer only. *)

open Lui_elements

let dom = Logseq_dom.dom
let dyn = Logseq_dom.dyn
let keyed = Logseq_dom.keyed

let overlay_cls = "ui__dialog-overlay"

let content_cls = "ui__dialog-content"

let btn_style = "ui__button ls-btn"

let is_overlay_click payload =
  String.length
    (Platform.payload_str payload "targetClass")
  > 0
  && let tc = Platform.payload_str payload "targetClass" in
     let needle = "ui__dialog-overlay" in
     let ln = String.length needle and lt = String.length tc in
     let rec go i =
       i + ln <= lt && (String.sub tc i ln = needle || go (i + 1))
     in
     go 0

let close_btn =
  dom ~key:"dlg-close" ~tag:"button"
    ~style_class:"ui__dialog-close"
    ~attrs:[ ("type", "button") ]
    ~events:"click"
    ~on_dom_event:(fun name _ ->
      if name = "click" then Dialogs_state.close_top ())
    [ Icons.raw ~cls:"ls-icon-sm" "x" ]

let body_of name (ms : Model.t Signal.signal) : t =
  match name with
  | "new-graph" | "add-graph" -> New_graph.body ms
  | "settings" -> Settings_page.modal_body ms
  | "plugins" -> Plugins_view.body ms
  | "plugin-readme" -> Plugin_readme.body ms
  | "plugin-settings" -> Plugins_view.settings_body ms
  | "login" -> Login_view.body ms
  | "import" | "importer" -> Importer.body ms
  | "export" | "export-graph" -> Exporter.body ms
  | "export-page" -> Export_view.body ms
  | "publish-page" -> Publish_view.body ms
  | "sync-server" -> Settings_url_view.sync_body ms
  | "publish-server" -> Settings_url_view.publish_body ms

  | "quick-add" -> Quick_add_view.body ms
  | _ -> box ~key:("empty-" ^ name) []

(* cljs shui/dialog-open! :label opts — drives .ui__dialog-content[label=…]
   CSS (app-settings -> max-w-5xl/overflow hidden; plugins-dashboard ->
   90vw/1246px) *)
let label_of = function
  | "settings" -> Some "app-settings"
  | "plugins" -> Some "plugins-dashboard"
  | "plugin-readme" -> Some "plugin-readme"
  | "login" -> Some "user-login"
  | "new-graph" | "add-graph" -> Some "new-db-graph"
  | _ -> None
(* cljs dialog-open! :title — h2.ui__dialog-title text (hidden when none) *)
let title_of = function
  | "new-graph" | "add-graph" -> I18n.create_new_graph
  | _ -> ""
let dialog_view name (ms : Model.t Signal.signal) : t =
  let is_settings = name = "settings" in
  let z = Dialogs_state.z_index name in
  dom ~key:("dlg-ov-" ^ name) ~style_class:overlay_cls ~events:"click"
    ~attrs:
      (("style", Printf.sprintf "z-index:%d" z)
       :: (if is_settings then [ ("data-align", "top") ] else []))
    ~on_dom_event:(fun n p ->
      if n = "click" && is_overlay_click p then Dialogs_state.close_top ())
    [ dom ~key:("dlg-c-" ^ name)
        ~style_class:(content_cls ^ " ls-dialog-" ^ name)
        ~attrs:
          ([ ("data-state", "open")
           ; ( "style"
             , Printf.sprintf "z-index:%d" z )
           ]
          @
          match label_of name with
          | Some l -> [ ("label", l); ("role", "dialog") ]
          | None -> [ ("role", "dialog") ])
        (* cljs shui dialog/core: h2.ui__dialog-title (hidden when the
           dialog has no title) then .ui__dialog-main-content > body *)
        [ (let title = title_of name in
           dom ~key:("dlg-t-" ^ name) ~tag:"h2"
             ~style_class:
               ("ui__dialog-title" ^ if title = "" then " hidden" else "")
             ~text:title
             [])
        ; dom ~key:("dlg-m-" ^ name) ~style_class:"ui__dialog-main-content"
            [ body_of name ms ]
        ; close_btn ]
    ]

let btn key label extra act =
  dom ~key ~tag:"button"
    ~style_class:(btn_style ^ " " ^ extra)
    ~attrs:[ ("type", "button") ]
    ~text:label ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then act ())
    []

let confirm_view (c : Dialogs_state.confirm) =
  let z = Dialogs_state.z_index "confirm" in
  dom ~key:"cfrm-ov"
    ~style_class:"ui__alert-dialog-overlay"
    ~attrs:[ ("style", Printf.sprintf "z-index:%d" z) ]
    ~events:"click"
    ~on_dom_event:(fun n payload ->
      if
        n = "click"
        && let tc = Platform.payload_str payload "targetClass" in
           let needle = "ui__alert-dialog-overlay" in
           let ln = String.length needle
           and lt = String.length tc in
           let rec go i =
             i + ln <= lt
             && (String.sub tc i ln = needle || go (i + 1))
           in
           go 0
      then Dialogs_state.close_confirm ())
    [ dom ~key:"cfrm"
        ~attrs:
          [ ("role", "alertdialog")
          ; ("style", Printf.sprintf "z-index:%d" z) ]
        ~style_class:"ui__alert-dialog-content"
        [ (* cljs dialog/alert-inner: a confirm! with plain content
             renders ui__alert-dialog-main-content only — no header *)
          (if c.title = "" then
             dom ~key:"cfrm-m"
               ~style_class:"ui__alert-dialog-main-content"
               [ dom ~key:"cfrm-mc" ~tag:"p"
                   ~style_class:"font-medium mb-6" ~text:c.desc [] ]
           else
             dom ~key:"cfrm-h"
               ~style_class:"ui__alert-dialog-header"
               [ dom ~key:"cfrm-t" ~tag:"h2"
                   ~style_class:"ui__alert-dialog-title" ~text:c.title []
               ; if c.desc = "" then Logseq_dom.dom ~key:"cfrm-dx" []
                 else
                   dom ~key:"cfrm-d" ~tag:"div"
                     ~style_class:"ui__alert-dialog-description"
                     ~text:c.desc []
               ])
        ; dom ~key:"cfrm-f"
            ~style_class:"ui__alert-dialog-footer"
            [ btn "cfrm-cancel" I18n.cancel "ls-btn-outline"
                Dialogs_state.close_confirm
            ; btn "cfrm-ok" I18n.confirm "ls-btn-primary"
                Dialogs_state.confirm
            ]
        ]
    ]

let prompt_view (p : Dialogs_state.prompt) =
  let submit () =
    match Web_dom.query_selector ".ui__dialog-content .form-input" with
    | Some el -> Dialogs_state.submit_prompt (Web_dom.el_value el)
    | None -> ()
  in
  let input_events name payload =
    match name with
    | "keydown" -> (
        match
          Platform.payload_str payload "key"
        with
        | "Enter" -> submit ()
        | _ -> ())
    | _ -> ()
  in
  let z = Dialogs_state.z_index "prompt" in
  dom ~key:"prmt-ov" ~style_class:overlay_cls
    ~attrs:[ ("style", Printf.sprintf "z-index:%d" z) ]
    [ dom ~key:"prmt-c" ~style_class:content_cls
        ~attrs:
          [ ("data-state", "open")
          ; ( "style"
            , Printf.sprintf "z-index:%d;transform: translate(-50%%, -50%%)"
                z )
          ]
        [ dom ~key:"prmt-box" ~style_class:"ls-prompt-box"
            ((if p.desc = "" then
                [ dom ~key:"prmt-h" ~tag:"h3" ~id:"modal-headline"
                    ~style_class:"ls-prompt-headline" ~text:p.title [] ]
              else
                (* cljs pdf-password-input: title line + desc headline *)
                [ dom ~key:"prmt-t" ~style_class:"text-lg mb-4"
                    ~text:p.title []
                ; dom ~key:"prmt-h" ~tag:"h3" ~id:"modal-headline"
                    ~style_class:"ls-prompt-headline"
                    ~text:p.desc [] ])
            @
            [ dom ~key:"prmt-in" ~tag:"input"
                ~style_class:"form-input ls-prompt-input"
                ~attrs:
                  [ ("type", "text"); ("autocomplete", "off")
                  ; ("autofocus", "true") ]
                ~events:"keydown"
                ~on_dom_event:input_events []
            ; btn "prmt-ok" I18n.submit "ls-btn-primary" (fun () -> submit ())
            ])
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
  let ureq_sig =
    Signal.map (fun (d : Dialogs_state.t) -> d.ui_request) ds
  in
  Logseq_dom.fragment
    [ keyed ~source:dialogs_sig ~key:(fun n -> n) ~cmp:String.compare
        ~mount:(fun name_sig ->
          (* name is stable per key — sample once *)
          let v = dialog_view (Signal.get name_sig) ms in
          (* radix Dialog focuses the dialog's [autofocus] element on open
             when it has one, else the content container itself (the
             close button never gets a focus ring) *)
          (try
             ignore
               (Web_dom.set_timeout
                  (fun () ->
                    match
                      Web_dom.query_selector ".ui__dialog-content [autofocus]"
                    with
                    | Some el -> Web_dom.el_focus el
                    | None -> (
                        match Web_dom.query_selector ".ui__dialog-content" with
                        | Some el ->
                            Web_dom.el_set_attr el "tabindex" "-1";
                            Web_dom.el_focus el
                        | None -> ()))
                  16)
           with _ -> ());
          v)
    ; dyn ~equal:( == ) (fun c ->
          match c with
          | Some c -> confirm_view c
          | None -> Logseq_dom.nothing)
        confirm_sig
    ; dyn ~equal:( == ) (fun p ->
          match p with
          | Some p -> prompt_view p
          | None -> Logseq_dom.nothing)
        prompt_sig
    ; dyn ~equal:( == ) (fun r ->
          match r with
          | Some r -> Ui_requests.view r
          | None -> Logseq_dom.nothing)
        ureq_sig
    ]
    ctx parent
