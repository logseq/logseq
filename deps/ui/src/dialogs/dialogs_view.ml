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

(* The deepest tapped element's own class identifies the backdrop: on
   native, .ui__dialog-content fills the window (fillsOverlay), so taps
   outside the card report the content class rather than the overlay's.
   Deeper card children emit their own classes, so a direct
   ui__dialog-content hit is still a backdrop click. *)
let is_overlay_class tc =
  tc <> ""
  && List.exists
       (fun needle -> Str_util.contains tc needle)
       [ "ui__dialog-overlay"; "ui__dialog-content" ]

let close_btn =
  button ~key:"dlg-close" ~variant:`ghost ~size:`icon
    ~style_class:"ui__dialog-close" ~icon:`x
    ~label:I18n.close
    ~on_press:(fun _ -> Dialogs_state.close_top ())
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
            Dialogs_state.close_top ()
      | _ -> ())
    [ column ~key:("dlg-c-" ^ name)
        ~style_class:(content_cls ^ " ls-dialog-" ^ name)
        (* cljs shui dialog/core: h2.ui__dialog-title (only when the
           dialog has a title) then .ui__dialog-main-content > body *)
        [ (let title = title_of name in
           if title = "" then
             (* cljs renders a visually-hidden h2.ui__dialog-title (radix
                needs a title); display:none keeps it out of the content
                grid so it adds no 16px gap before .ui__dialog-main-content *)
             box ~key:("dlg-t-" ^ name) ~style_class:"ui__dialog-title-empty" []
           else
             heading ~key:("dlg-t-" ^ name) ~level:2
               ~style_class:"ui__dialog-title" ~value:title [])
        ; (* scroll kind so native backends map it to their scroll view;
             the class carries overflow-y:auto on web *)
          scroll ~key:("dlg-m-" ^ name)
            ~style_class:"ui__dialog-main-content" ~orientation:`vertical
            ~grow:1.
            [ body_of name ms ]
        ; close_btn ]
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
        ~data_attrs:[ ("role", "alertdialog"); ("aria-modal", "true") ]
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
                     ~value:c.title [] ] ] )
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
              ; btn "cfrm-ok" I18n.confirm `primary
                  Dialogs_state.confirm
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
              Dialogs_state.close_top ()
        | _ -> ())
      [ column ~key:"prmt-c" ~style_class:content_cls
          [ column ~key:"prmt-box" 
              ( (if p.desc = "" then
                   [ heading ~key:"prmt-h" ~level:3
                       ~style_class:"ls-prompt-headline" ~value:p.title []
                   ]
                 else
                   (* cljs pdf-password-input: title + desc headline *)
                   [ text ~key:"prmt-t" ~value:p.title []
                   ; heading ~key:"prmt-h" ~level:3
                       ~style_class:"ls-prompt-headline" ~value:p.desc []
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
          ; close_btn
          ]
      ]
  in
  node ctx parent

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
  Logseq_el.fragment
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
    ; reactive ~equal:( == ) (fun c ->
          match c with
          | Some c -> confirm_view c
          | None -> spacer ~key:"cfrm-none" [])
        confirm_sig
    ; reactive ~equal:( == ) (fun p ->
          match p with
          | Some p -> prompt_view p
          | None -> spacer ~key:"prmt-none" [])
        prompt_sig
    ; reactive ~equal:( == ) (fun r ->
          match r with
          | Some r -> Ui_requests.view r
          | None -> spacer ~key:"ureq-none" [])
        ureq_sig
    ]
    ctx parent
