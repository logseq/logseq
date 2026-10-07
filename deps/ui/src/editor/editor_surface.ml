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

let mount ?(cls = "") uuid scope : t =
 fun ctx parent ->
  (* per-mount measurement state — the conduit writes caret/selection
     rects back through apply_input after each event; registered so
     caret moves outside apply_input (click hit-test, set_caret) can
     re-measure the overlay too *)
  let frame = Signal.state ctx.Lui_ui.ui_scheduler Edit_input.empty_frame in
  S.active_frame := Some frame;
  (* the conduit input mounts asynchronously (extension node) and its
     runs prop lands a patch or two later — a frame created after
     apply_focus's refresh already ran would otherwise stay empty until
     the next input event. Measure into THIS frame once the sink can
     answer; retries cover the runs-prop lag *)
  List.iter
    (fun ms ->
      Web_dom.set_timeout
        (fun () ->
          match (S.editing (), Editor_sink.conduit uuid) with
          | Some e, Some conduit
            when e.S.uuid = uuid && e.S.scope = scope ->
              Signal.update frame (fun _ ->
                  Edit_input.measure conduit e.S.model)
          | _ -> ())
        ms)
    [ 0; 40; 120; 300 ];
  let model_sig =
    Signal.map
      (fun e ->
        match e with
        | Some e when e.S.uuid = uuid && e.S.scope = scope -> e.S.model
        | _ -> Edit_model.create ~units:S.edit_units "")
      (S.editing_sig ())
  in
    (Ui_parts.editor_wrapper ~key:("ew-" ^ uuid)
    ~id:("editor-edit-block-" ^ uuid)
    [ Edit_view.view ~model:model_sig
        ~frame:frame.Signal.state_signal ~block_id:uuid ~cls
        ~on_input:(Editor_keys.apply_input ~frame uuid)
    ])
    ctx parent
