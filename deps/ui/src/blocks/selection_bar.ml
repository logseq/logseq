(* cljs components/selection.cljs action-bar + events/ui.cljs
   :editor/show-action-bar — a popover anchored side:top/align:start on
   the first selected block. The bar offers Set tags, Add comment, Copy,
   Set property, Unset property, delete and the dots selection menu.

   Mounted once per page container as a reactive over the Editor_state
   signal; when the selected set is empty it renders nothing. *)

open Lui_elements

module S = Editor_state
module C = Lui_element_combine
module Uc = Ui_components

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
let listeners_installed = State_cell.Once.make ()

let install_listeners () =
  State_cell.Once.run listeners_installed (fun () ->
    Ui_services.dom_on_document_event ~capture:true "mousedown"
      (fun e ->
        match e.Ui_services.target with
        | Some el -> (
            match el.Ui_services.closest ".selection-action-bar" with
            | Some _ -> ()
            | None ->
                let inside sel =
                  match el.Ui_services.closest sel with Some _ -> true | None -> false
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
                  && (not (e.Ui_services.shift))
                  && (not (e.Ui_services.meta))
                  && (not (e.Ui_services.ctrl))
                  && Editor_state.editing_uuid () = None
                then Editor_actions.clear_selection ()
                else if Editor_actions.selected_uuids () <> [] then
                  Editor_actions.hide_action_bar ())
        | None -> ());
    Ui_services.dom_on_document_event ~capture:true "mouseup"
      (fun e ->
        (* cljs show-selection-action-bar-for-pointer!: only a primary-
           button release can raise the bar *)
        let tgt = if e.Ui_services.button = 0 then e.Ui_services.target else None in
        ignore
          (Ui_services.timers_timeout
             (fun () ->
               match tgt with
               | Some el -> (
                   match
                     el.Ui_services.closest
                       ".block-control-wrap,button,input,textarea,a"
                   with
                   | Some _ -> ()
                   | None ->
                       if Editor_actions.selected_uuids () <> [] then
                         Editor_actions.show_action_bar ())
               | None -> ())
             0)))

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
      Logseq_el.own ctx
        (Signal.map2
           (fun _sel bar -> (Editor_actions.selected_uuids (), bar))
           (S.selected_sig ()) (S.action_bar_sig ()))
    in
    let source =
      let base =
        Logseq_el.own ctx
          (Signal.map (fun (sel, bar) -> (sel, bar, false, false)) sel_sig)
      in
      let with_popup =
        match Popups_state.non_cm_popup_signal () with
        | Some ps ->
            Logseq_el.own ctx
              (Signal.map2 (fun (sel, bar, _, c) p -> (sel, bar, p, c)) base ps)
        | None -> base
      in
      let with_cmdk =
        match Cmdk_state.open_signal () with
        | Some cs ->
            Logseq_el.own ctx
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
        if popup || cmdk || not bar then Logseq_el.nothing
        else
          match sel with
      | [] -> Logseq_el.nothing
      | first :: _ -> (
          match Ui_services.dom_by_id ("ls-block-" ^ first) with
          | None -> Logseq_el.nothing
          | Some blk ->
              let l, t, _w, _h = blk.Ui_services.rect () in
              (* cljs radix popover anchors the bar 48px above the first
                 selected block — popover ~at is the same point placement;
                 no ~on_dismiss: the bar's own mousedown listener decides
                 hide vs clear-selection and [data-keep-selection]
                 surfaces (its cm menu) must not dismiss it *)
              popover ~key:"sbar" ~at:(l, t -. 48.)
                ~style_class:"selection-action-bar"
                ~data_attrs:[ ("data-keep-selection", "true") ]
                [ Uc.action_bar_capsule ~key:"sbg"
                    ~border_color:"var(--lui-c-border)" ~border_width:1
                    (row ~key:"sbr" ~gap:0 ~cross:`stretch
                       ((* cljs shui segmented bar: tags/comment/delete/
                           more are icon-only cells; copy and the
                           property actions keep their text labels;
                           thin dividers separate every cell *)
                         let sbtn ~key ~label ?icon ?text ~on_press =
                           button ~key ~variant:`ghost ~size:`sm ~label
                             ?icon ?text ~on_press []
                         in
                         let sep k = divider ~key:k ~orientation:`vertical [] in
                         let items =
                           [ sbtn ~key:"sb-tag" ~label:(I18n.t "property/set-tags")
                               ~icon:(`app "hash")
                               ~on_press:(fun _ -> open_prop_dlg ~remove:false) ()
                           ; sbtn ~key:"sb-cmt" ~label:(I18n.t "block.comments/add-comment")
                               ~icon:(`app "message-circle")
                               ~on_press:(fun _ -> Comments.add_comment ()) ()
                           ; sbtn ~key:"sb-cpy" ~label:(I18n.t "ui/copy")
                               ~text:(I18n.t "ui/copy")
                               ~on_press:(fun _ ->
                                 Editor_actions.copy_selection_text ();
                                 Editor_actions.clear_selection ()) ()
                           ; sbtn ~key:"sb-set" ~label:(I18n.t "property/set-property")
                               ~text:(I18n.t "property/set-property")
                               ~on_press:(fun _ -> open_prop_dlg ~remove:false) ()
                           ; sbtn ~key:"sb-uns" ~label:(I18n.t "property/unset-property")
                               ~text:(I18n.t "property/unset-property")
                               ~on_press:(fun _ -> open_prop_dlg ~remove:true) ()
                           ; sbtn ~key:"sb-del" ~label:(I18n.t "editor/delete-selection")
                               ~icon:`trash
                               ~on_press:(fun _ ->
                                 Editor_actions.delete_selection ()) ()
                           ; sbtn ~key:"sb-mor" ~label:(I18n.t "ui/show-more")
                               ~icon:(`app "dots")
                               ~on_press:(fun _ ->
                               (* cljs: the bar's dots menu is a dropdown
                                  anchored to the trigger button — the last
                                  .lui-button in the capsule *)
                               match
                                 ( !(Popups_state.active)
                                 , Ui_services.dom_query
                                     ".selection-action-bar \
                                      .lui-button:last-child" )
                               with
                               | Some st, Some btn ->
                                   let ax, atop, abot =
                                     Popups_state.anchor_of_el btn
                                   in
                                   Popups_state.open_cm st ~ax ~atop ~abot
                                     ~block_id:first ~multi:true
                               | _ -> ()) ()
                           ]
                         in
                         List.concat_map
                           (fun (i, item) ->
                             if i = 0 then [ item ]
                             else [ sep (Printf.sprintf "sb-sep-%d" i); item ])
                           (List.mapi (fun i it -> (i, it)) items))) ]
                ))
      source )
    ctx parent
