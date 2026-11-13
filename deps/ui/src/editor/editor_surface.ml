(* ---------------------------------------------------------------------------
   Shared edit surface mount — the one place that assembles the
   logseq-editor node for a block-title editing session.

   Block rows (tree.ml), the comments-area title (comments.ml) and any
   future title edit all mount the same pieces:

     .editor-wrapper#editor-edit-block-<uuid>
       Edit_view.view            (lines + overlay + extension sink)
       (file uploads go through Asset_dom.pick_files — dom-op
          open-file-picker, no hidden input)

   The mounted Edit_model signal is derived from Editor_state.editing —
   the model only paints when the open editing session's uuid/scope match
   this mount, otherwise an empty model renders a harmless empty line.
   --------------------------------------------------------------------------- *)

open Lui_elements

module S = Editor_state

let mount ?(cls = "") ?owner uuid scope : t =
 fun ctx parent ->
  let accepts (e : S.editing) =
    e.S.uuid = uuid && e.S.scope = scope
    && (match owner, e.S.owner with
        | None, _ -> true
        | Some expected, S.Explicit_draft live -> expected == live
        | _ -> false)
  in
  let epoch = ref None in
  (* per-mount measurement state — the conduit writes caret/selection
     rects back through apply_input after each event; registered so
     caret moves outside apply_input (click hit-test, set_caret) can
     re-measure the overlay too *)
  let frame = Signal.state ctx.Lui_ui.ui_scheduler Edit_input.empty_frame in
  S.active_frame := Some frame;
  Signal.on_dispose ctx.Lui_ui.ui_scope (fun () ->
      match !S.active_frame with
      | Some current when current == frame -> S.active_frame := None
      | _ -> ());
  (* the conduit input mounts asynchronously (extension node) and its
     runs prop lands a patch or two later — a frame created after
     apply_focus's refresh already ran would otherwise stay empty until
     the next input event. Measure into THIS frame once the sink can
     answer; retries cover the runs-prop lag and are dropped with the
     view's scope *)
  List.iter
    (fun ms ->
      ignore
        (Ui_effect.timeout ~scope:ctx.Lui_ui.ui_scope ms (fun () ->
             match S.editing () with
             | Some e
               when accepts e ->
                 ignore (Editor_actions.refresh_overlay ~frame uuid)
             | _ -> ())))
    [ 0; 40; 120; 300 ];
  let model_sig =
    Edit_view.own ctx (Signal.map
      (fun e ->
        match e with
        | Some e when accepts e -> epoch := Some e.S.epoch; e.S.model
        | _ -> Edit_model.create ~units:S.edit_units "")
      (S.editing_sig ()))
  in
  (* keep the model selection mirrored into the host's native selection
     while this surface is the live editor — the browser computes its
     context-menu text items (Copy/Look Up) from the DOM selection at
     hit-test time, so mirroring inside the contextmenu handler lands
     too late. A collapsed range stands in for "no selection" *)
  ignore
    (Signal.own ctx.Lui_ui.ui_scope
      (Signal.subscribe ~emit_initial:true (S.editing_sig ())
       (fun (e : S.editing option) ->
          match e with
          | Some e when accepts e
                        && not (Editor_actions.initial_click_pending uuid) -> (
              match Edit_model.selection_range e.S.model with
              | Some (lo, hi) -> Editor_sink.select_range uuid lo hi
              | None ->
                  Editor_sink.select_range uuid e.S.model.caret
                    e.S.model.caret)
          | _ -> ())));
    (Ui_parts.editor_wrapper ~key:("ew-" ^ uuid)
    ~id:("editor-edit-block-" ^ uuid)
    [ Edit_view.view ~model:model_sig
        ~frame:(Signal.value (frame)) ~block_id:uuid ~cls
        ~on_input:(fun input ->
          match owner, !epoch, S.editing () with
          | None, _, _ -> !(S.surface_input) frame uuid input
          | Some owner, Some mounted, Some live
            when not (Signal.scope_is_disposed ctx.Lui_ui.ui_scope)
              && accepts live && mounted == live.S.epoch && owner#current ->
              !(S.surface_input) frame uuid input
          | _ -> ())
    ])
    ctx parent
