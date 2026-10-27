(* cljs components/selection.cljs action-bar + events/ui.cljs
   :editor/show-action-bar — a popover anchored side:top/align:start on
   the first selected block. The bar offers Set tags, Add comment, Copy,
   Set property, Unset property, delete and the dots selection menu.

   Mounted once per page container as a reactive over the Editor_state
   signal; when the selected set is empty it renders nothing. *)

open Lui_elements
module S = Editor_state
module Uc = Ui_components
module D = Properties_data

let view_parent_uuid uuids =
  let mounted_parent =
    List.find_map
      (fun uuid ->
        match Ui_services.dom_by_id ("ls-block-" ^ uuid) with
        | Some el -> (
            match el.Ui_services.closest "[data-pu]" with
            | Some parent -> parent.Ui_services.attr "data-pu"
            | None -> None)
        | None -> None)
      uuids
  in
  match mounted_parent with
  | Some _ as parent -> parent
  | None -> (
      match (Runtime.route (), S.selection_scope ()) with
      | Model.Block_zoom uuid, scope when scope = "zoom-" ^ uuid -> Some uuid
      | _, "main" ->
          Option.bind (Runtime.model ()).Model.route_page (fun page ->
              page.Model.page_uuid)
      | _ -> None)

let selection_context sel =
  ( Runtime.repo (),
    Runtime.route (),
    S.selection_scope (),
    if sel = [] then None else view_parent_uuid sel )

let with_cut_eligibility sel render : t =
 fun ctx parent ->
  let ((_, _, _, uuid) as key) = selection_context sel in
  match uuid with
  | None -> render None ctx parent
  | Some uuid ->
      let load =
        Ui_effect.load ~sched:ctx.Lui_ui.ui_scheduler ~scope:ctx.Lui_ui.ui_scope
          (Subs_state.task_of_promise (D.entity_by_uuid uuid))
      in
      (reactive
         (fun status ->
           let eligibility =
             match status with
             | Ui_effect.Ready entity -> (
                 match D.untag entity with
                 | Wire.Map _ as entity when D.entity_id_of entity <> None ->
                     Some
                       ( key,
                         D.getk entity "db/ident" <> Some "logseq.class/Page" )
                 | _ -> None)
             | Ui_effect.Loading | Ui_effect.Failed _ -> None
           in
           render eligibility)
         load)
        ctx parent

let parent_of (b : Model.block) =
  Option.bind b.Model.block_uuid (fun uuid ->
      Option.bind (S.find_parent uuid) fst)

let can_cut sel eligibility =
  match eligibility with
  | Some (key, true) when key = selection_context sel ->
      sel <> []
      && List.for_all
           (fun uuid ->
             match S.find uuid with
             | Some b -> Comments.comment_target_block_p ~parent:(parent_of b) b
             | None -> false)
           sel
  | _ -> false

let selection_matches snapshot uuids =
  snapshot = selection_context uuids
  && S.String_set.equal (S.selected ()) (S.String_set.of_list uuids)

let restore_bar uuids =
  let snapshot = selection_context uuids in
  fun () ->
    if uuids <> [] && selection_matches snapshot uuids && S.editing () = None
    then Editor_actions.show_action_bar ()

let open_prop_dlg ~remove uuids =
  match uuids with
  | uuid :: _ ->
      let db_id = Option.bind (S.find uuid) (fun b -> b.Model.block_db_id) in
      Properties_dialog.open_dialog ~on_close:(restore_bar uuids) ~remove
        { Properties_dialog.uuid; uuids; db_id; is_tag = false; title = "" }
  | [] -> ()

let open_tags = function
  | uuid :: _ as uuids ->
      Properties_dialog.open_for_block_with_property
        ~on_close:(restore_bar uuids) ~uuids uuid ~ident:"block/tags"
  | [] -> ()

let comment_targets uuids =
  List.filter_map S.find uuids
  |> Comments.eligible_targets ~parent_of
  |> List.filter_map (fun b -> b.Model.block_uuid)

let child_layer_open () =
  Properties_dialog.is_open ()
  ||
  match !Popups_state.active with
  | Some st -> (Popups_state.get st).Popups_state.cm <> None
  | None -> false

(* cljs mounts the bar as a radix popover (:selection-action-bar): an
   outside pointerdown dismisses it, and container.cljs on-mouse-up
   raises it when a selection exists and the target is not inside a
   block control, button/input/textarea or link. Selection alone never
   shows it — S.action_bar is armed only by those two triggers
   (cljs show-action-bar!). Without the fixed bar's pointer-events:none
   it overlays drag targets and intercepts pointer events (e2e drag
   tests). *)
let listeners_installed = State_cell.Once.make ()
let pending_show = ref None

let cancel_pending_show () =
  Option.iter Ui_services.timers_clear_timeout !pending_show;
  pending_show := None

let install_listeners () =
  State_cell.Once.run listeners_installed (fun () ->
      Ui_services.dom_on_document_event ~capture:true "pointercancel" (fun _ ->
          cancel_pending_show ());
      Ui_services.dom_on_window_event "blur" (fun _ -> cancel_pending_show ());
      Ui_services.dom_on_document_event ~capture:true "pointerdown" (fun e ->
          cancel_pending_show ();
          if child_layer_open () then ()
          else
            match e.Ui_services.target with
            | Some el -> (
                match el.Ui_services.closest ".selection-action-bar" with
                | Some _ -> ()
                | None ->
                    let inside sel =
                      match el.Ui_services.closest sel with
                      | Some _ -> true
                      | None -> false
                    in
                    (* cljs container.cljs window pointerdown →
                   hide-context-menu-and-clear-selection: a plain click
                   outside any block/input clears the selection, so the
                   later mouseup never re-raises the bar *)
                    if
                      Editor_actions.selected_uuids () <> []
                      && (not (inside ".ls-block"))
                      && (not (inside "[data-keep-selection]"))
                      && (not
                            (inside "input,textarea,select,[contenteditable]"))
                      && (not e.Ui_services.shift) && (not e.Ui_services.meta)
                      && (not e.Ui_services.ctrl)
                      && Editor_state.editing_uuid () = None
                    then Editor_actions.clear_selection ()
                    else if Editor_actions.selected_uuids () <> [] then
                      Editor_actions.hide_action_bar ())
            | None -> ());
      Ui_services.dom_on_document_event ~capture:true "pointerup" (fun e ->
          (* cljs show-selection-action-bar-for-pointer!: only a primary-
           button release can raise the bar *)
          let tgt =
            if e.Ui_services.button = 0 then e.Ui_services.target else None
          in
          let context =
            (Runtime.repo (), Runtime.route (), S.selection_scope ())
          in
          let selection = S.selected () in
          cancel_pending_show ();
          pending_show :=
            Some
              (Ui_services.timers_timeout
                 (fun () ->
                   pending_show := None;
                   if
                     context
                     <> (Runtime.repo (), Runtime.route (), S.selection_scope ())
                     || not (S.String_set.equal selection (S.selected ()))
                   then ()
                   else
                     match tgt with
                     | Some el -> (
                         match
                           el.Ui_services.closest
                             ".block-control-wrap,button,input,textarea,a"
                         with
                         | Some _ -> ()
                         | None ->
                             if
                               (not (child_layer_open ()))
                               && Editor_state.editing_uuid () = None
                               && Editor_actions.selected_uuids () <> []
                             then Editor_actions.show_action_bar ())
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
 fun ctx parent ->
  (install_listeners ();
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
             (Signal.map2
                (fun (sel, bar, p, _) c -> (sel, bar, p, c))
                with_popup cs)
       | None -> with_popup
     in
     let with_editing =
       Logseq_el.own ctx
         (Signal.map2
            (fun (sel, bar, p, c) editing ->
              (sel, bar, p || editing <> None, c))
            with_cmdk (S.editing_sig ()))
     in
     let ds = Properties_dialog.state_signal ctx.Lui_ui.ui_scheduler in
     Logseq_el.own ctx
       (Signal.map2
          (fun (sel, bar, p, c) dialog -> (sel, bar, p || dialog <> None, c))
          with_editing (Signal.value ds))
   in
   reactive
     (fun ((sel : string list), (bar : bool), (popup : bool), (cmdk : bool)) ->
       if popup || cmdk || not bar then Logseq_el.nothing
       else
         match sel with
         | [] -> Logseq_el.nothing
         | first :: _ -> (
             match
               List.find_opt
                 (fun uuid ->
                   Ui_services.dom_by_id ("ls-block-" ^ uuid) <> None)
                 sel
             with
             | None -> Logseq_el.nothing
             | Some anchor ->
                 with_cut_eligibility sel (fun eligibility ->
                     (* The retained anchor owns scroll/resize positioning and
                 viewport collision handling on both hosts. *)
                     popover ~transition:Ui_components.popover_transition
                       ~key:"sbar" ~anchor_target:("ls-block-" ^ anchor)
                       ~anchor:`above ~anchor_alignment:`start ~anchor_offset:8.
                       ~style_class:"selection-action-bar"
                       ~data_attrs:[ ("data-keep-selection", "true") ]
                       [
                         Uc.action_bar_capsule ~key:"sbg"
                           ~border_color:"hsl(var(--border))" ~border_width:1
                           (row ~key:"sbr" ~gap:0 ~cross:`stretch
                              ((* cljs shui segmented bar: tags/comment/delete/
                           more are icon-only cells; copy and the
                           property actions keep their text labels;
                           thin dividers separate every cell *)
                               let snapshot = selection_context sel in
                               let sbtn ~key ~label ?icon ?text ~on_press () =
                                 Ui_components.button ~key ~variant:`ghost
                                   ~size:`sm ~label ?icon ?text
                                   ~on_press:(fun ev ->
                                     if selection_matches snapshot sel then
                                       on_press ev)
                                   []
                               in
                               let sep k =
                                 divider ~key:k ~orientation:`vertical []
                               in
                               let items =
                                 [
                                   sbtn ~key:"sb-tag"
                                     ~label:(I18n.t "property/set-tags")
                                     ~icon:(`app "hash")
                                     ~on_press:(fun _ -> open_tags sel)
                                     ();
                                 ]
                                 @ (let targets = comment_targets sel in
                                    if targets = [] then []
                                    else
                                      [
                                        sbtn ~key:"sb-cmt"
                                          ~label:
                                            (I18n.t "block.comments/add-comment")
                                          ~icon:(`app "message-circle")
                                          ~on_press:(fun _ ->
                                            Comments.ensure_for targets)
                                          ();
                                      ])
                                 @ [
                                     sbtn ~key:"sb-cpy"
                                       ~label:(I18n.t "ui/copy")
                                       ~text:(I18n.t "ui/copy")
                                       ~on_press:(fun _ ->
                                         Editor_actions.copy_selection_text ())
                                       ();
                                     sbtn ~key:"sb-set"
                                       ~label:(I18n.t "property/set-property")
                                       ~text:(I18n.t "property/set-property")
                                       ~on_press:(fun _ ->
                                         open_prop_dlg ~remove:false sel)
                                       ();
                                     sbtn ~key:"sb-uns"
                                       ~label:(I18n.t "property/unset-property")
                                       ~text:(I18n.t "property/unset-property")
                                       ~on_press:(fun _ ->
                                         open_prop_dlg ~remove:true sel)
                                       ();
                                   ]
                                 @ (if can_cut sel eligibility then
                                      [
                                        sbtn ~key:"sb-del"
                                          ~label:
                                            (I18n.t "editor/delete-selection")
                                          ~icon:(`app "trash")
                                          ~on_press:(fun _ ->
                                            Editor_actions.delete_selection ())
                                          ();
                                      ]
                                    else [])
                                 @ [
                                     sbtn ~key:"sb-mor"
                                       ~label:(I18n.t "ui/show-more")
                                       ~icon:(`app "dots")
                                       ~on_press:(fun _ ->
                                         (* cljs: the bar's dots menu is a dropdown
                                  anchored to the trigger button — the last
                                  .lui-button in the capsule *)
                                         match
                                           ( !Popups_state.active,
                                             Ui_services.dom_query
                                               ".selection-action-bar \
                                                .lui-button:last-child" )
                                         with
                                         | Some st, Some btn ->
                                             let ax, atop, abot =
                                               Popups_state.anchor_of_el btn
                                             in
                                             Popups_state.open_cm
                                               ~allow_cut:
                                                 (can_cut sel eligibility)
                                               ~allow_delete:
                                                 (can_cut sel eligibility) st
                                               ~ax ~atop ~abot ~block_id:first
                                               ~multi:true
                                         | _ -> ())
                                       ();
                                   ]
                               in
                               List.concat_map
                                 (fun (i, item) ->
                                   if i = 0 then [ item ]
                                   else
                                     [
                                       sep (Printf.sprintf "sb-sep-%d" i); item;
                                     ])
                                 (List.mapi (fun i it -> (i, it)) items)));
                       ])))
     source)
    ctx parent
