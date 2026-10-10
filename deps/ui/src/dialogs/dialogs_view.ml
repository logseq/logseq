(* Generic dialog host mounted in .cp__overlays. Renders the
   Dialogs_state stack: named dialogs, the text prompt and the e2ee
   ui-request modal are dialog kind modals (own scrim, focus trap,
   outside-press/Escape dismiss); the confirm layer stays a custom
   alertdialog (outside presses do NOT dismiss — Escape and the footer
   buttons are the only way out), inside a cover popover for the layer
   owner/Escape dispatch. *)

open Lui_elements


let keyed = Lui_elements.keyed

let dialog_close ~key close =
  Ui_components.dialog_close ~key ~label:I18n.close
    ~on_press:(fun _ -> close ())

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
  | "rtc-collaborators" -> Collaborators.body ms

  | "quick-add" -> Quick_add_view.body ms
  | _ -> box ~key:("empty-" ^ name) []

(* cljs shui/dialog-open! :label opts became the ls-dialog-<name> class on
   the dialog element — lui-overlay.css carried class-selector twins of
   its .ui__dialog-content[label=…] rules (settings -> app-settings,
   plugins -> plugins-dashboard, login -> user-login,
   new-graph/add-graph -> new-db-graph). The declarations migrated onto
   the element: the .lui-dialog base rule keeps only gap/pad/width/
   height for the dialog kinds emitted elsewhere (cards, views_popup,
   properties_menu, cmdk); padding repeats here so every named dialog
   carries its own spec (gpui reads the same prop). Viewport/calc
   widths, px max-widths and the login centering have no prop on the
   modal kind — they ride the documented data-attrs style pair. *)
let dialog_spec name =
  match name with
  | "settings" ->
      ( 0
      , "box-sizing:border-box;width:min(1024px, calc(100vw - 2rem));\
         max-width:min(64rem, calc(100vw - 2rem));overflow:hidden" )
  | "plugins" ->
      ( 24
      , "width:90vw;max-width:1246px;max-height:calc(100vh - 50px);\
         overflow-y:hidden" )
  | "sync-server" | "publish-server" -> (24, "max-width:42rem")
  | "plugin-readme" -> (24, "max-height:86vh;overflow:auto")
  | "export-page" -> (24, "max-height:80vh;overflow-y:auto")
  | "new-graph" | "add-graph" -> (24, "max-width:500px")
  | "login" ->
      ( 24
      , "padding-top:0;width:auto;max-width:none;align-items:center" )
  | _ -> (24, "")

(* cljs shui/dialog-open! :title — h2.ui__dialog-title (omitted when none) *)
let title_of = function
  | "new-graph" | "add-graph" -> I18n.create_new_graph
  | _ -> ""

(* dialog kind: scrim + centered card + focus trap + outside/Escape
   dismiss all come from the platform; children mount in
   .lui-dialog-body which stacks them (grid-area 1/1) so the close
   button overlays the content column. *)
let dialog_view name (ms : Model.t Signal.signal) : t =
  let title = title_of name in
  let padding, chrome = dialog_spec name in
  dialog ~key:("dlg-" ^ name) ~padding
    ~style_class:("ls-dialog-" ^ name)
    ~data_attrs:
      ((if chrome = "" then [] else [ ("style", chrome) ])
       @ (if title = "" then []
          else [ ("aria-labelledby", "ls-dialog-title-" ^ name) ]))
    ~on_dismiss:(fun _ -> Dialogs_state.close_named name)
    [ column ~key:("dlg-m-" ^ name) ~grow:1.
        ~gap:(if title = "" then 0 else 16) ~cross:`stretch
        ( (if title = "" then []
          else
            [ (* cljs shui dialog title: text-lg font-semibold
                 leading-none tracking-tight (+ tailwind preflight
                 margin reset) *)
              heading ~key:("dlg-t-" ^ name) ~level:2
                ~font_size:"1.125rem" ~font_weight:600 ~line_height:"1"
                ~data_attrs:[ ("style", "letter-spacing:-0.01em") ]
                ~style_class:"ui__dialog-title" ~value:title
                ~accessibility_identifier:("ls-dialog-title-" ^ name) [] ])
        @ [ (* scroll kind so native backends map it to their scroll
               view; ui__dialog-main-content stays as the e2e/imperative
               hook the per-dialog rules scope onto (overflow is native
               on the scroll kind) *)
            scroll ~key:("dlg-s-" ^ name)
              ~style_class:"ui__dialog-main-content" ~orientation:`vertical
              ~grow:1. ~min_height:0
              ~data_attrs:
                (if name = "login"
                 then [ ("style", "padding:0;position:relative") ]
                 else [])
              [ body_of name ms ]
          ] )
    ; dialog_close ~key:"dlg-close" (fun () -> Dialogs_state.close_named name)
    ]

(* cljs AlertDialog (shui dialog-confirm!): outside presses do NOT
   dismiss — Escape and the footer buttons are the only way out *)
let confirm_view (c : Dialogs_state.confirm) =
  Ui_components.alert_dialog_overlay ~key:"cfrm-ov"
    [ Ui_components.alert_dialog_content ~key:"cfrm"
        (* cljs ui__alert-dialog-content renders
           div[role='alertdialog'][aria-modal] — e2e confirms via
           `div[role='alertdialog'] button:text('Confirm')` *)
        ~data_attrs:
          ([ ("role", "alertdialog"); ("aria-modal", "true") ]
           @ if c.title = "" then []
               else [ ("aria-labelledby", "ls-confirm-title") ])
        (* cljs dialog/alert-inner: a confirm! with plain content
           renders ui__alert-dialog-main-content only — no header *)
        ( (if c.title = "" then
             [ column ~key:"cfrm-m"
                 [ paragraph ~key:"cfrm-mc" ~value:c.desc [] ] ]
           else
             [ Ui_components.alert_dialog_header ~key:"cfrm-h"
                 [ heading ~key:"cfrm-t" ~level:2
                     ~font_size:"1.125rem" ~font_weight:600
                     ~line_height:"1.75rem"
                     ~style_class:"ui__alert-dialog-title"
                     ~value:c.title
                     ~accessibility_identifier:"ls-confirm-title" [] ] ] )
        (* cljs dialog-confirm! puts the description in :content, wrapped
           in div.ui__alert-dialog-main-content — a grid sibling of the
           header, not AlertDialogDescription inside it *)
        @ (if c.desc = "" then []
             else
               [ Ui_components.alert_dialog_main_content ~key:"cfrm-d"
                   [ paragraph ~key:"cfrm-dp"
                       ~font_size:"1rem" ~line_height:"1.5rem"
                       ~style_class:"ls-confirm-desc"
                       ~data_attrs:[ ("style", "opacity:0.6") ]
                       ~value:c.desc [] ] ])
        @ [ (* cljs dialog-confirm footer buttons are :size :sm *)
            Ui_components.alert_dialog_footer ~key:"cfrm-f"
              [ Ui_components.dialog_btn_neutral ~key:"cfrm-cancel"
                  ~size:`sm ~variant:`outline ~text:I18n.cancel
                  ~on_press:(fun _ -> Dialogs_state.close_confirm ())
              ; (* cljs alert dialog focuses the confirm action on open *)
                Ui_components.dialog_btn_neutral ~key:"cfrm-ok" ~size:`sm
                  ~variant:`primary ~text:I18n.confirm ~autofocus:true
                  ~on_press:(fun _ -> Dialogs_state.confirm ()) ] ] ) ]
(* Prompt body — mounted inside a dialog kind in [render]; outside
   presses and Escape dismiss through ~on_dismiss. *)
let prompt_body (p : Dialogs_state.prompt) : t =
 fun ctx parent ->
  let value = Signal.state ctx.Lui_ui.ui_scheduler "" in
  let submit () =
    Dialogs_state.submit_prompt (Runtime.signal_get value)
  in
  let node =
    column ~key:"prmt-box"
      ( (if p.desc = "" then
           [ heading ~key:"prmt-h" ~level:3
               ~line_height:"1.5rem" ~font_weight:500
               ~style_class:"ls-prompt-headline" ~value:p.title
               ~data_attrs:[ ("style", "padding-bottom:0.5rem") ]
               ~accessibility_identifier:"ls-prompt-title" []
           ]
         else
           (* cljs pdf-password-input: title + desc headline *)
           [ text ~key:"prmt-t" ~value:p.title []
           ; heading ~key:"prmt-h" ~level:3
               ~line_height:"1.5rem" ~font_weight:500
               ~style_class:"ls-prompt-headline" ~value:p.desc
               ~data_attrs:[ ("style", "padding-bottom:0.5rem") ]
               ~accessibility_identifier:"ls-prompt-title" []
           ])
      @ [ input ~key:"prmt-in"
            ~style_class:"form-input ls-prompt-input"
            ~data_attrs:[ ("style", "display:block;width:100%;margin:0.5rem 0 1rem") ]
            ~autofocus:true
            ~on_input:(fun ev ->
              match ev with
              | Lui_protocol.TextChanged (_, s) ->
                  Signal.set value s
              | _ -> ())
            ~on_submit:(fun _ -> submit ())
            []
        ; Ui_components.dialog_btn_primary ~key:"prmt-ok" ~size:`sm
            ~variant:`primary ~text:I18n.submit
            ~on_press:(fun _ -> submit ()) ] )
  in
  node ctx parent

let render (ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  Dialogs_state.ensure ctx;
  Dialogs_state.init ();
  let ds = Dialogs_state.signal () in
  keyed ~source:(reactive (fun (d : Dialogs_state.t) -> d.order) ds)
    ~key:Fun.id ~cmp:Stdlib.compare
    ~mount:(fun layer_signal ->
      let layer = Signal.get layer_signal in
      let close () = match layer with
        | Dialogs_state.Named name -> Dialogs_state.close_named name
        | Dialogs_state.Confirm -> Dialogs_state.close_confirm ()
        | Dialogs_state.Prompt -> Dialogs_state.close_prompt ()
        | Dialogs_state.Ui_request -> Dialogs_state.close_top ()
      in
      (match layer with
      | Dialogs_state.Named name -> dialog_view name ms
      | Dialogs_state.Prompt ->
          reactive ~equal:(fun a b -> a.Dialogs_state.prompt == b.Dialogs_state.prompt)
            (fun d -> match d.Dialogs_state.prompt with
              | Some p ->
                  dialog ~key:"dlg-prompt" ~padding:24
                    ~style_class:"ls-dialog-prompt"
                    ~data_attrs:[ ("aria-labelledby", "ls-prompt-title") ]
                    ~on_dismiss:(fun _ -> Dialogs_state.close_prompt ())
                    [ prompt_body p
                    ; dialog_close ~key:"prmt-close" Dialogs_state.close_prompt ]
              | None -> Logseq_el.nothing) ds
      | Dialogs_state.Confirm | Dialogs_state.Ui_request ->
          let view = match layer with
            | Dialogs_state.Confirm ->
                reactive ~equal:(fun a b -> a.Dialogs_state.confirm == b.Dialogs_state.confirm)
                  (fun d -> match d.Dialogs_state.confirm with
                    | Some c -> confirm_view c | None -> Logseq_el.nothing) ds
            | Dialogs_state.Ui_request ->
                reactive ~equal:(fun a b -> a.Dialogs_state.ui_request == b.Dialogs_state.ui_request)
                  (fun d -> match d.Dialogs_state.ui_request with
                    | Some r -> Ui_requests.view r | None -> Logseq_el.nothing) ds
            | _ -> Logseq_el.nothing
          in
          (* Custom dialog chrome (confirm/e2ee) still rides a cover
             popover for the layer owner and Escape dispatch. *)
          popover ~style_class:"ls-dialog-layer"
            ~on_dismiss:(fun _ -> close ()) [ view ])
      )
    ctx parent
