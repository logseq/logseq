(* cljs components/selection.cljs action-bar + events/ui.cljs
   :editor/show-action-bar — a popover anchored side:top/align:start on
   the first selected block. The bar offers Set tags, Add comment, Copy,
   Set property, Unset property, delete and the dots selection menu.

   Mounted once per page container as a reactive over the Editor_state
   signal; when the selected set is empty it renders nothing. *)

open Lui_elements

module S = Editor_state

let dom = Logseq_dom.dom

(* title moves to ~label (the a11y name on native hosts); icon buttons
   carry ~icon, text buttons ~text — the button kind supplies
   type=button and the icon/label spans on web *)
let action_btn key ?(title = "") ?(text = "") ?icon on_click : t =
  button ~key
    ~style_class:"ui__button selection-action-button"
    ?icon
    ~label:title ~text
    ~on_press:(fun _ -> on_click ())
    []

(* popover opened under the bar for the current selection (the dialog's
   own current_target resolves the selected uuids for batch ops) *)
let open_prop_dlg ~remove =
  match Properties_dialog.current_target () with
  | Some tgt -> ignore (Properties_dialog.open_dialog ~remove tgt)  | None -> ()

(* cljs mounts the bar as a radix popover (:selection-action-bar): an
   outside pointerdown dismisses it, and container.cljs on-mouse-up
   raises it when a selection exists and the target is not inside a
   block control, button/input/textarea or link. Selection alone never
   shows it — S.action_bar is armed only by those two triggers
   (cljs show-action-bar!). Without the fixed bar's pointer-events:none
   it overlays drag targets and intercepts pointer events (e2e drag
   tests). *)
module D = Web_dom

let listeners_installed = State_cell.Once.make ()

let install_listeners () =
  State_cell.Once.run listeners_installed (fun () ->
    D.add_document_listener "mousedown"
      (fun e ->
        match D.ev_target e with
        | Some el -> (
            match D.el_closest el ".selection-action-bar" with
            | Some _ -> ()
            | None ->
                let inside sel =
                  match D.el_closest el sel with Some _ -> true | None -> false
                in
                (* cljs container.cljs window pointerdown →
                   hide-context-menu-and-clear-selection: a plain click
                   outside any block/input clears the selection, so the
                   later mouseup never re-raises the bar *)
                if
                  Editor_actions.selected_uuids () <> []
                  && (not (inside ".ls-block"))
                  && (not (inside "[data-keep-selection]"))
                  && (not (inside "input,textarea,select,[contenteditable]"))
                  && (not (D.ev_shift e))
                  && (not (D.ev_meta e))
                  && (not (D.ev_ctrl e))
                  && Editor_state.editing_uuid () = None
                then Editor_actions.clear_selection ()
                else if Editor_actions.selected_uuids () <> [] then
                  Editor_actions.hide_action_bar ())
        | None -> ())
      true;
    D.add_document_listener "mouseup"
      (fun e ->
        (* cljs show-selection-action-bar-for-pointer!: only a primary-
           button release can raise the bar *)
        let tgt = if D.ev_button e = 0 then D.ev_target e else None in
        D.set_timeout
          (fun () ->
            match tgt with
            | Some el -> (
                match
                  D.el_closest el ".block-control-wrap,button,input,textarea,a"
                with
                | Some _ -> ()
                | None ->
                    if Editor_actions.selected_uuids () <> [] then
                      Editor_actions.show_action_bar ())
            | None -> ())
          0)
      true)

(* cljs hides the action-bar while another popup is up — fold the
   popup/cmdk flags into the same reactive source (nested reactive has no parent
   node to anchor to) *)
let rec view () : t =
  (* mount-order independent: ensure creates the editor state on first
     use, so the bar works even on pages where it precedes the first
     block row (gating on S.ready here left it permanently unmounted) *)
  fun ctx parent ->
    S.ensure ctx;
    node () ctx parent

and node () : t =
 fun ctx parent -> (
    install_listeners ();
    (* every map level holds an upstream subscription on the shared state
       signals — own each so the mount scope releases them *)
    let sel_sig =
      Logseq_dom.own ctx
        (Signal.map2
           (fun _sel bar -> (Editor_actions.selected_uuids (), bar))
           (S.selected_sig ()) (S.action_bar_sig ()))
    in
    let source =
      let base =
        Logseq_dom.own ctx
          (Signal.map (fun (sel, bar) -> (sel, bar, false, false)) sel_sig)
      in
      let with_popup =
        match Popups_state.non_cm_popup_signal () with
        | Some ps ->
            Logseq_dom.own ctx
              (Signal.map2 (fun (sel, bar, _, c) p -> (sel, bar, p, c)) base ps)
        | None -> base
      in
      let with_cmdk =
        match Cmdk_state.open_signal () with
        | Some cs ->
            Logseq_dom.own ctx
              (Signal.map2 (fun (sel, bar, p, _) c -> (sel, bar, p, c)) with_popup cs)
        | None -> with_popup
      in
      with_cmdk
    in
    reactive
      (fun ( (sel : string list)
           , (bar : bool)
           , (popup : bool)
           , (cmdk : bool) ) ->
        if popup || cmdk || not bar then Logseq_dom.nothing
        else
          match sel with
      | [] -> Logseq_dom.nothing
      | first :: _ -> (
          match Web_dom.get_element_by_id ("ls-block-" ^ first) with
          | None -> Logseq_dom.nothing
          | Some blk ->
              let l, t, _r, _b, _w = Web_dom.bounding_rect_fields blk in
              let below = t -. 2. in
              (* cljs radix popover anchors the bar 48px above the first
                 selected block — popover ~at is the same point placement;
                 no ~on_dismiss: the bar's own mousedown listener decides
                 hide vs clear-selection and [data-keep-selection]
                 surfaces (its cm menu) must not dismiss it *)
              popover ~key:"sbar" ~at:(l, t -. 48.)
                ~style_class:"selection-action-bar"
                ~data_attrs:[ ("data-keep-selection", "true") ]
                [ row ~key:"sbg"
                    ~cross:`center
                    ~style_class:"selection-action-group inline-flex pointer-events-auto"
                    [ action_btn "sab-tags" ~title:(I18n.t "property/set-tags")
                        ~icon:(`app "hash")
                        (fun () -> open_prop_dlg ~remove:false)
                    ; action_btn "sab-cmt"
                        ~title:(I18n.t "block.comments/add-comment")
                        ~icon:(`app "message-circle")
                        (fun () -> Comments.add_comment ())
                    ; action_btn "sab-cpy" ~text:(I18n.t "ui/copy")
                        (fun () ->
                          Editor_actions.copy_selection_text ();
                          Editor_actions.clear_selection ())
                    ; action_btn "sab-setp"
                        ~text:(I18n.t "property/set-property")
                        (fun () -> open_prop_dlg ~remove:false)
                    ; action_btn "sab-unset"
                        ~text:(I18n.t "property/unset-property")
                        (fun () -> open_prop_dlg ~remove:true)
                    ; action_btn "sab-del" ~icon:`trash
                        ~title:(I18n.t "editor/delete-selection")
                        (fun () -> Editor_actions.delete_selection ())
                    ; action_btn "sab-dots" ~icon:(`app "dots")
                        ~title:(I18n.t "ui/show-more")
                        (fun () ->
                          match !(Popups_state.active) with
                          | Some st ->
                              Popups_state.open_cm st ~x:l ~y:below
                                ~block_id:first ~multi:true
                          | None -> ())
                    ]
                ]))
      source )
    ctx parent
