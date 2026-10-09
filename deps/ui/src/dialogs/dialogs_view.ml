(* Generic dialog host mounted in .cp__overlays. Renders the
   Dialogs_state stack: each dialog is
   .ui__dialog-overlay > .ui__dialog-content (per-name body) with a
   .ui__dialog-close button; plus a confirm layer (alert dialog with
   Confirm/Cancel) and a text-prompt layer (headline + input + Submit)
   used by import. Overlay/Escape close the topmost layer only. *)

open Lui_elements


let keyed = Lui_elements.keyed

let overlay_cls = "ui__dialog-overlay"

let content_cls = "ui__dialog-content"

let btn_style = "ui__button ls-btn"

(* Only the scrim itself is an outside press. Card padding and empty
   content remain inside the dialog on every host. *)
let is_overlay_class tc =
  List.mem overlay_cls (String.split_on_char ' ' tc)

let close_btn close =
  button ~key:"dlg-close" ~variant:`ghost ~size:`icon
    ~style_class:"ui__dialog-close" ~icon:`x
    ~label:I18n.close
    ~on_press:(fun _ -> close ())
    []

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
   the content element — lui-overlay.css carries class-selector twins of
   its .ui__dialog-content[label=…] rules (settings -> app-settings,
   plugins -> plugins-dashboard, login -> user-login,
   new-graph/add-graph -> new-db-graph) *)
let title_of = function
  (* cljs dialog-open! :title — h2.ui__dialog-title (omitted when none) *)
  | "new-graph" | "add-graph" -> I18n.create_new_graph
  | _ -> ""
let dialog_view name (ms : Model.t Signal.signal) : t =
  (* the scrim is a column so the press detail payload can carry the
     click target's class (deepest hit) for backdrop dismissal.
     ~grow/~main/~cross fill + center inside the native cover layer
     (web places the same scrim with position:fixed + grid) *)
  column ~key:("dlg-ov-" ^ name) ~style_class:overlay_cls
    ~grow:1. ~main:`center ~cross:`center
    ~on_press_detail:(fun ev ->
      match ev with
      | Lui_protocol.PressDetail (_, d) ->
          if is_overlay_class d.Lui_protocol.target_class then
            Dialogs_state.close_named name
      | _ -> ())
    [ column ~key:("dlg-c-" ^ name)
        ?padding:(if name = "settings" then Some 0 else None)
        ~style_class:(content_cls ^ " ls-dialog-" ^ name)
        (* base-ui DialogContent carries role=dialog + aria-modal and is
           named by its DialogTitle (aria-labelledby); the title element
           below carries the matching id *)
        ~data_attrs:
          [ ("role", "dialog")
          ; ("aria-modal", "true")
          ; ("aria-labelledby", "ls-dialog-title-" ^ name) ]
        (* cljs shui dialog/core: h2.ui__dialog-title (only when the
           dialog has a title) then .ui__dialog-main-content > body *)
        [ (let title = title_of name in
           if title = "" then
             (* cljs renders a visually-hidden h2.ui__dialog-title (radix
                needs a title); display:none keeps it out of the content
                grid so it adds no 16px gap before .ui__dialog-main-content *)
             box ~key:("dlg-t-" ^ name) ~style_class:"ui__dialog-title-empty"
               ~accessibility_identifier:("ls-dialog-title-" ^ name) []
           else
             heading ~key:("dlg-t-" ^ name) ~level:2
               ~style_class:"ui__dialog-title" ~value:title
               ~accessibility_identifier:("ls-dialog-title-" ^ name) [])
        ; (* scroll kind so native backends map it to their scroll view;
             the class carries overflow-y:auto on web *)
          scroll ~key:("dlg-m-" ^ name)
            ~style_class:"ui__dialog-main-content" ~orientation:`vertical
            ~grow:1.
            [ body_of name ms ]
        ; close_btn (fun () -> Dialogs_state.close_named name) ]
    ]

(* typed variant over ls-btn-* classes — the multi-token style_class
   route left the primary styling unapplied on web (confirm button
   rendered white-on-transparent); data-variant is the typed path.
   cljs alert-dialog footer buttons are :size :sm *)
let btn key label variant act =
  button ~key ~variant ~size:`sm
    ~style_class:btn_style
    ~text:label
    ~on_press:(fun _ -> act ())
    []

let confirm_view (c : Dialogs_state.confirm) =
  (* cljs AlertDialog (shui dialog-confirm!): outside presses do NOT
     dismiss — Escape and the footer buttons are the only way out *)
  column ~key:"cfrm-ov"
    ~style_class:"ui__alert-dialog-overlay"
    [ column ~key:"cfrm"
        ~style_class:"ui__alert-dialog-content"
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
             [ column ~key:"cfrm-h"
                 ~style_class:"ui__alert-dialog-header"
                 [ heading ~key:"cfrm-t" ~level:2
                     ~style_class:"ui__alert-dialog-title"
                     ~value:c.title
                     ~accessibility_identifier:"ls-confirm-title" [] ] ] )
        (* cljs dialog-confirm! puts the description in :content, wrapped
           in div.ui__alert-dialog-main-content — a grid sibling of the
           header, not AlertDialogDescription inside it *)
        @ (if c.desc = "" then []
             else
               [ box ~key:"cfrm-d" ~style_class:"ui__alert-dialog-main-content"
                   [ paragraph ~key:"cfrm-dp"
                       ~style_class:"ls-confirm-desc" ~value:c.desc [] ] ])
        @ [ row ~key:"cfrm-f" ~style_class:"ui__alert-dialog-footer"
              [ btn "cfrm-cancel" I18n.cancel `outline
                  Dialogs_state.close_confirm
              ; (* cljs alert dialog focuses the confirm action on open *)
                button ~key:"cfrm-ok" ~variant:`primary ~size:`sm
                  ~style_class:btn_style ~text:I18n.confirm
                  ~autofocus:true
                  ~on_press:(fun _ -> Dialogs_state.confirm ())
                  []
              ]
          ] )
    ]

let prompt_view (p : Dialogs_state.prompt) : t =
 fun ctx parent ->
  let value = Signal.state ctx.Lui_ui.ui_scheduler "" in
  let submit () =
    Dialogs_state.submit_prompt (Runtime.signal_get value)
  in
  let node =
    column ~key:"prmt-ov" ~style_class:overlay_cls
      ~on_press_detail:(fun ev ->
        match ev with
        | Lui_protocol.PressDetail (_, d) ->
            if is_overlay_class d.Lui_protocol.target_class then
              Dialogs_state.close_prompt ()
        | _ -> ())
      [ column ~key:"prmt-c" ~style_class:content_cls
          ~data_attrs:
            [ ("role", "dialog")
            ; ("aria-modal", "true")
            ; ("aria-labelledby", "ls-prompt-title") ]
          [ column ~key:"prmt-box" 
              ( (if p.desc = "" then
                   [ heading ~key:"prmt-h" ~level:3
                       ~style_class:"ls-prompt-headline" ~value:p.title
                       ~accessibility_identifier:"ls-prompt-title" []
                   ]
                 else
                   (* cljs pdf-password-input: title + desc headline *)
                   [ text ~key:"prmt-t" ~value:p.title []
                   ; heading ~key:"prmt-h" ~level:3
                       ~style_class:"ls-prompt-headline" ~value:p.desc
                       ~accessibility_identifier:"ls-prompt-title" []
                   ])
              @ [ input ~key:"prmt-in"
                    ~style_class:"form-input ls-prompt-input"
                    ~autofocus:true
                    ~on_input:(fun ev ->
                      match ev with
                      | Lui_protocol.TextChanged (_, s) ->
                          Signal.set value s
                      | _ -> ())
                    ~on_submit:(fun _ -> submit ())
                    []
                ; btn "prmt-ok" I18n.submit `primary
                    (fun () -> submit ())
                ] )
          ; close_btn Dialogs_state.close_prompt
          ]
      ]
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
      let view = match layer with
      | Dialogs_state.Named name ->
          let view = dialog_view name ms in
          Ui_services.timers_later ~ms:16 (fun () ->
              match List.rev (Dialogs_state.value ()).order with
              | Dialogs_state.Named top :: _ when top = name -> (
              match Ui_services.dom_query (".ls-dialog-" ^ name) with
              | Some content ->
                  (match content.Ui_services.query "[autofocus]" with
                   | Some target -> target.Ui_services.focus ()
                   | None -> content.Ui_services.set_attr "tabindex" "-1";
                       content.Ui_services.focus ())
              | None -> ())
              | _ -> ());
          view
      | Dialogs_state.Confirm ->
          reactive ~equal:(fun a b -> a.Dialogs_state.confirm == b.Dialogs_state.confirm)
            (fun d -> match d.Dialogs_state.confirm with
              | Some c -> confirm_view c | None -> Logseq_el.nothing) ds
      | Dialogs_state.Prompt ->
          reactive ~equal:(fun a b -> a.Dialogs_state.prompt == b.Dialogs_state.prompt)
            (fun d -> match d.Dialogs_state.prompt with
              | Some p -> prompt_view p | None -> Logseq_el.nothing) ds
      | Dialogs_state.Ui_request ->
          reactive ~equal:(fun a b -> a.Dialogs_state.ui_request == b.Dialogs_state.ui_request)
            (fun d -> match d.Dialogs_state.ui_request with
              | Some r -> Ui_requests.view r | None -> Logseq_el.nothing) ds
      in
      (* Cover popovers give custom dialog chrome the same layer owner
         and Escape dispatch as dropdowns and nested popup portals. *)
      popover ~style_class:"ls-dialog-layer" ~on_dismiss:(fun _ -> close ()) [ view ])
    ctx parent
