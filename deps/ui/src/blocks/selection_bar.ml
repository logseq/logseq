(* cljs components/selection.cljs action-bar + events/ui.cljs
   :editor/show-action-bar — a popover anchored side:top/align:start on
   the first selected block. The bar offers Set tags, Add comment, Copy,
   Set property, Unset property, delete and the dots selection menu.

   Mounted once per page container as a dyn over the Editor_state
   signal; when the selected set is empty it renders nothing. *)

open Lui_elements

module S = Editor_state

let dom = Logseq_dom.dom

let action_btn key ?(title = "") ?(text = "") on_click children : t =
  dom ~key ~tag:"button"
    ~attrs:
      ([ ("type", "button"); ("tabindex", "0") ]
       @
       if title = "" then [] else [ ("title", title) ])
    ~style_class:"ui__button selection-action-button"
    ~text ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then on_click ())
    children

(* popover opened under the bar for the current selection (the dialog's
   own current_target resolves the selected uuids for batch ops) *)
let open_prop_dlg ~remove ~anchor =
  match Properties_dialog.current_target () with
  | Some tgt -> ignore (Properties_dialog.open_dialog ~remove ~anchor tgt)
  | None -> ()

(* cljs mounts the bar as a radix popover (:selection-action-bar): an
   outside pointerdown dismisses it, and container.cljs on-mouse-up
   raises it when a selection exists and the target is not inside a
   block control, button/input/textarea or link. Selection alone never
   shows it — S.action_bar is armed only by those two triggers
   (cljs show-action-bar!). Without the fixed bar's pointer-events:none
   it overlays drag targets and intercepts pointer events (e2e drag
   tests). *)
module D = Dom_ext

let listeners_installed = ref false

let install_listeners () =
  if not !listeners_installed then (
    listeners_installed := true;
    D.add_document_listener "mousedown"
      (fun e ->
        match D.target e with
        | Some el -> (
            match D.closest el ".selection-action-bar" with
            | Some _ -> ()
            | None ->
                let inside sel =
                  match D.closest el sel with Some _ -> true | None -> false
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
                  && (not (D.shift_key e))
                  && (not (D.meta_key e))
                  && (not (D.ctrl_key e))
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
        let tgt = if D.button e = 0 then D.target e else None in
        D.set_timeout
          (fun () ->
            match tgt with
            | Some el -> (
                match
                  D.closest el ".block-control-wrap,button,input,textarea,a"
                with
                | Some _ -> ()
                | None ->
                    if Editor_actions.selected_uuids () <> [] then
                      Editor_actions.show_action_bar ())
            | None -> ())
          0)
      true)

(* cljs hides the action-bar while another popup is up — fold the
   popup/cmdk flags into the same dyn source (nested dyn has no parent
   node to anchor to) *)
let rec view () : t =
  (* the editor state signal only exists once a block row has mounted —
     check it at mount time (this node's ctx fn runs after the block rows
     it follows in the children list), not at construction where it would
     permanently stay unmounted on pages that render before any block *)
  fun ctx parent ->
    if not (S.ready ()) then Logseq_dom.nothing ctx parent
    else node () ctx parent

and node () : t = (
    install_listeners ();
    let sel_sig =
      Signal.map
        (fun (st : S.t) -> (Editor_actions.selected_uuids (), st.S.action_bar))
        (S.signal ())
    in
    let source =
      let base =
        Signal.map (fun (sel, bar) -> (sel, bar, false, false)) sel_sig
      in
      let with_popup =
        match Popups_state.non_cm_popup_signal () with
        | Some ps ->
            Signal.map2 (fun (sel, bar, _, c) p -> (sel, bar, p, c)) base ps
        | None -> base
      in
      let with_cmdk =
        match Cmdk_state.open_signal () with
        | Some cs ->
            Signal.map2 (fun (sel, bar, p, _) c -> (sel, bar, p, c)) with_popup cs
        | None -> with_popup
      in
      with_cmdk
    in
    dyn
      ~equal:(fun a b -> a = b)
      (fun ( (sel : string list)
           , (bar : bool)
           , (popup : bool)
           , (cmdk : bool) ) ->
        if popup || cmdk || not bar then Logseq_dom.nothing
        else
          match sel with
      | [] -> Logseq_dom.nothing
      | first :: _ -> (
          match Editor_dom.get_element_by_id ("ls-block-" ^ first) with
          | None -> Logseq_dom.nothing
          | Some blk ->
              let l, t, _r, _b, _w = Properties_dom.el_rect blk in
              let below = t -. 2. in
              dom ~key:"sbar"
                ~style_class:
                  "ui__toolbar selection-action-bar flex items-center"
                ~attrs:
                  [ ( "style"
                    , Printf.sprintf
                        "position:fixed;left:%.0fpx;top:%.0fpx;z-index:998;pointer-events:none"
                        l (t -. 48.) )
                  ; ("data-keep-selection", "true") ]
                [ dom ~key:"sbg"
                    ~attrs:[ ("style", "pointer-events:auto") ]
                    ~style_class:
                      "ui__toolbar-group selection-action-group \
                       inline-flex items-center"
                    [ action_btn "sab-tags" ~title:(I18n.t "property/set-tags")
                        (fun () -> open_prop_dlg ~remove:false ~anchor:(l, below))
                        [ Icons.icon ~size:13. "hash" ]
                    ; action_btn "sab-cmt"
                        ~title:(I18n.t "block.comments/add-comment")
                        (fun () -> Comments.add_comment ())
                        [ Icons.icon ~size:13. "message-circle" ]
                    ; action_btn "sab-cpy" ~text:(I18n.t "ui/copy")
                        (fun () ->
                          Editor_actions.copy_selection_text ();
                          Editor_actions.clear_selection ())
                        []
                    ; action_btn "sab-setp"
                        ~text:(I18n.t "property/set-property")
                        (fun () -> open_prop_dlg ~remove:false ~anchor:(l, below))
                        []
                    ; action_btn "sab-unset"
                        ~text:(I18n.t "property/unset-property")
                        (fun () -> open_prop_dlg ~remove:true ~anchor:(l, below))
                        []
                    ; action_btn "sab-del"
                        (fun () -> Editor_actions.delete_selection ())
                        [ Icons.icon ~size:13. "trash" ]
                    ; action_btn "sab-dots"
                        (fun () ->
                          match !(Popups_state.active) with
                          | Some st ->
                              Popups_state.open_cm st ~x:l ~y:below
                                ~block_id:first ~multi:true
                          | None -> ())
                        [ Icons.icon ~size:13. "dots" ]
                    ]
                ]))
      source )
