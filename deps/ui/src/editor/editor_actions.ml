(* Block-editor behaviors: enter/exit edit mode, split/merge, indent,
   move, selection, clipboard, undo. All mutations flow through
   Outliner_ops (apply-outliner-ops) followed by a page refresh. *)

module S = Editor_state
module Ops = Outliner_ops

let closest sel t =
  match t with Some el -> el.Ui_services.closest sel | None -> None

let ( let* ) p f = Js.Promise.then_ f p

(* ---- buffer + focus ---- *)

let live_buffer uuid =
  (* code-fence blocks edit inside a mounted CodeMirror — its doc, not
     the block model, holds the live value. For the logseq-editor
     surface e.buffer is authoritative: it always mirrors
     e.model.source *)
  match !(S.code_buffer_of) uuid with
  | Some v -> v
  | None -> (
      match S.editing () with
      | Some e when e.uuid = uuid -> e.buffer
      | _ -> "")

(* -- edit model ---------------------------------------------------------- *)

let edit_model uuid =
  match S.editing () with
  | Some e when e.uuid = uuid -> Some e.S.model
  | _ -> None

(* republish the editing record with a new model — the view repaints off
   editing_sig. Guards uuid so ops that swapped the editing block
   mid-event aren't clobbered by a stale publish *)
let update_model uuid f =
  let moved = ref false in
  let changed = ref None in
  S.set (fun st ->
      match st.S.editing with
      | Some e when e.S.uuid = uuid ->
          let nm = f e.S.model in
          moved := nm.Edit_model.source = e.S.model.Edit_model.source
                   && nm.Edit_model.caret <> e.S.model.Edit_model.caret;
          if nm.Edit_model.source <> e.S.model.Edit_model.source then begin
            (match e.S.owner with
             | S.Persisted -> S.history_input_before := Some (S.history_editing e)
             | S.Explicit_draft owner -> changed := Some (e, owner, nm.source));
            Editor_sink.invalidate uuid
          end;
          { st with S.editing = Some (S.with_model e nm) }
      | _ -> st);
  (match !changed, S.editing () with
   | Some (before, owner, source), Some live
     when live.S.epoch == before.S.epoch && owner#current -> owner#changed source
   | _ -> ());
  if !moved then !(S.caret_changed) uuid

let caret_of uuid =
  match edit_model uuid with
  | Some m -> m.Edit_model.caret
  | None -> 0

(* ordered selection span — collapsed caret gives (c, c) *)
let sel_span_of (m : Edit_model.t) =
  match m.anchor with
  | Some a -> (min a m.caret, max a m.caret)
  | None -> (m.caret, m.caret)

let sel_span uuid =
  match edit_model uuid with
  | Some m -> sel_span_of m
  | None -> (0, 0)

(* the mousedown that opened an edit lands before the sink exists —
   hit-test its recorded coords against the now-mounted runs so the
   caret lands on the click point instead of the enter_edit default *)
let click_offset uuid (_, x, y) =
      match
        ( Editor_sink.conduit uuid
        , Ui_services.dom_by_id ("edit-block-" ^ uuid) )
      with
      | Some conduit, Some el -> (
          match closest ".block-editor" (Some el) with
          | None -> None
          | Some c when c.Ui_services.rect_pending () -> None
          | Some c ->
              let l, t, _w, _h = c.Ui_services.rect () in
              conduit.Edit_input.offset_at
                ~x:(int_of_float x - int_of_float l)
                ~y:(int_of_float y - int_of_float t))
      | _ -> None

let initial_click_pending uuid =
  match !S.pending_focus with
  | Some request -> request.S.focus_uuid = uuid && Option.is_some request.S.focus_click
  | None -> false

let cancel_pending_focus () =
  if !S.pending_focus_actions <> [] then
    Ui_services.log_error "queued editor actions cancelled because their editing context ended";
  S.pending_focus := None;
  S.pending_focus_actions := []

let focus_owned (request : S.focus_request) (editing : S.editing) =
  request.S.focus_uuid = editing.S.uuid
  && match request.S.focus_owner with
     | Some (scope, epoch) -> scope = editing.S.scope && epoch == editing.S.epoch
     | None -> true

(* splice [lo, hi) -> text; caret lands after the inserted text *)
let splice_range uuid lo hi text =
  update_model uuid (fun m -> Edit_model.splice m lo hi text)

(* replace the buffer without touching caret/selection beyond clamping —
   external resyncs (undo/redo, remote tx) go through set_source *)
let sync_buffer uuid v =
  update_model uuid (fun m -> Edit_model.set_source m v)

(* focus recovery runs one pass per Runtime.flush (wired in main.ml):
   the .ed-input a pending arm waits for mounts through a DOM patch, and
   every patch path ends in a flush — so a pass after each flush is the
   only retry the flow needs. Queued keys replay one per pass: a
   replayed nav/structural op re-enters edit mode asynchronously
   (enter_edit awaits the title ref before updating S.editing), so the
   rest wait for the next pass rather than applying against the stale
   editing block *)
let perf_keys =
  lazy
    (match Sys.getenv_opt "LOGSEQ_PERF" with
     | Some _ -> true
     | None -> false)

let focus_attempts = ref 0

(* at most one retry timer in flight: apply_focus is also invoked per
   flush and per re-arm, and when every call scheduled its own timer a
   sink that can't mount multiplied parallel retry chains instead of
   retrying once at a time *)
let retry_timer_armed = ref false

(* exponential backoff: a row that mounts a patch or two later clears
   on the early 12ms tries; a sink that can't mount yet backs off
   (12ms x8, 24ms x8, 48ms x8, 96ms x8, then ~200ms) instead of
   flooding the event loop *)
let retry_delay_ms attempts = min 200 (12 lsl (min 4 (attempts / 8)))

(* replayed keys can re-enter the queue through the flush their op
   triggers — the gate keeps a nested pass from replaying twice *)
let drain_gate = ref false

(* the arm the focus op was last emitted for — re-emitting every retry
   saturates the host's op queue while the focus event still hasn't had
   a turn, which is exactly what keeps ae from resolving. The arm
   identity (not just the uuid) keys the dedup and every arm-site resets
   it: a second edit on the same block mounts a NEW input element that
   still needs its own emit *)
let last_focus_emitted : S.focus_request option ref = ref None

let note_focus_blur uuid =
  match !S.pending_focus, S.editing () with
  | Some request, Some editing
    when focus_owned request editing && initial_click_pending uuid ->
      last_focus_emitted := Some request
  | _ -> ()

(* Accepted clicks retain their point until geometry arrives; explicit
   pointer input supersedes that point without overwriting its selection. *)
let resolve_initial_click (request : S.focus_request) (editing : S.editing) =
  match request.S.focus_click with
  | None -> true
  | Some point ->
      if !S.last_edit_input_ms > request.S.focus_armed_ms
         || !S.edit_input_seq <> request.S.focus_input_seq
      then (
        request.S.focus_click <- None;
        request.S.focus_caret <- editing.S.model.Edit_model.caret;
        true)
      else match click_offset request.S.focus_uuid point with
      | None -> false
      | Some offset ->
          let model = Edit_model.select editing.S.model ~anchor:offset ~focus:offset in
          S.set_silent (fun st ->
              match st.S.editing with
              | Some current when current.S.epoch == editing.S.epoch
                                  && current.S.scope = editing.S.scope ->
                  { st with editing = Some (S.with_model current model) }
              | _ -> st);
          request.S.focus_caret <- model.Edit_model.caret;
          request.S.focus_click <- None;
          true

let rec apply_focus () =
  (* a stale retry timer can fire after its arm was consumed or replaced;
     queued keys belong to the next landing, not the void — replay them
     against the live editing state instead of dropping the presses *)
  match !S.pending_focus with
  | None -> drain_pending_focus_actions ()
  | Some request -> (
      let uuid = request.S.focus_uuid in
      let caret = request.S.focus_caret in
      let armed_ms = request.S.focus_armed_ms in
      match S.editing () with
      | Some editing when Option.is_some request.S.focus_owner
                          && not (focus_owned request editing) ->
          cancel_pending_focus ();
          last_focus_emitted := None;
      | None when Option.is_some request.S.focus_owner -> cancel_pending_focus ()
      | None -> retry_focus ()
      | Some editing when editing.S.uuid <> uuid -> retry_focus ()
      | Some editing ->
        request.S.focus_owner <- Some (editing.S.scope, editing.S.epoch);
      if !(S.code_focus) ~caret uuid then (
        (* CodeMirror-backed code block: cm.focus() + setCursor landed *)
        S.pending_focus := None;
        focus_attempts := 0;
        last_focus_emitted := None;
        drain_pending_focus_actions ())
      else
        (* emit the focus op once per target: calling focus() on the
           conduit input is cheap but re-emitting every retry still
           floods the event loop on a row that can't mount. The emit
           waits until the sink can focus — on web the input mounts a
           patch or two after pending_focus arms, and an emit fired
           into the void would never be repeated *)
        if
          (match !last_focus_emitted with Some emitted -> emitted != request | None -> true)
          && Editor_sink.can_focus uuid
        then begin
          last_focus_emitted := Some request;
          Editor_sink.focus_input uuid
        end;
        (* emitting focus_input flushes the sink's focus event through
           apply_input -> Runtime.flush -> focus_pending, which re-enters
           apply_focus on the still-armed pending_focus — a nested call
           can land this arm first. Only land while the arm we matched
           is still the armed one: a nested landing (None) or a newer
           arm must not be stomped by this stale pass's caret *)
        if
          (Editor_sink.is_focused uuid || Option.is_some request.S.focus_click)
          && (match !S.pending_focus with Some current -> current == request | None -> false)
        then (
          (* a pending apply+refresh can still replace the sink after
             landing — only consume the pending state once the input
             really holds focus; otherwise keep retrying so the
             remounted editor gets it *)
          let ready = match S.editing () with
            | Some current when focus_owned request current -> resolve_initial_click request current
            | _ -> false
          in
          if not ready then retry_focus ()
          else begin
          S.pending_focus := None;
          focus_attempts := 0;
          last_focus_emitted := None;
          (* a landing that ran late (remount during a remote-tx
             refresh) must not stomp the caret: if the user typed
             since this focus was requested, the stored caret is
             stale — keep where the model put it *)
          if !S.last_edit_input_ms <= armed_ms then
            (match S.editing () with
             | Some e when Edit_model.selection_range e.S.model <> None -> ()
             | _ -> set_caret uuid request.S.focus_caret);
          (* the sink's runs prop and first layout can lag the landing —
             a split/merge's remount by far more than a patch or two —
             and the immediate measure then yields no caret rect, so the
             caret bar never paints until the next input event: keep
             re-measuring until the overlay has a caret rect (or this
             block stops editing). refresh_overlay reports whether a
             caret rect actually landed — checking the active frame
             directly would read a STALE frame while the new overlay is
             still mounting *)
          let rec retry_measure attempt =
            ignore
              (Ui_services.timers_timeout
                 (fun () ->
                   match S.editing () with
                   | Some e when e.S.epoch == editing.S.epoch && e.S.scope = editing.S.scope ->
                       if (not (refresh_overlay uuid)) && attempt < 25 then
                         retry_measure (attempt + 1)
                   | _ -> ())
                 (if attempt = 0 then 0 else 40))
          in
          retry_measure 0;
          drain_pending_focus_actions ()
          end)
        else if !S.pending_focus = None then ()
        else (
          if Lazy.force perf_keys then
            Printf.eprintf "PERF focus-retry t=%f uuid=%s\n%!"
              (Ui_services.time_now () /. 1000.) uuid;
          retry_focus ()))

and retry_focus () =
  incr focus_attempts;
  let waiting_for_click =
    match !S.pending_focus with
    | Some request -> Option.is_some request.S.focus_click
    | None -> false
  in
  if !focus_attempts < 50 then begin
    (* the editing row can sit outside the virtual window — a scroll
       jump (Home/End, a remount, an insert below the viewport edge)
       unmounts it and focus retries would spin forever on a sink
       that can't render. Pulling its item key back into the rendered
       range remounts the row so focus can land *)
    if !focus_attempts = 1 || !focus_attempts mod 10 = 5 then
      (match !S.pending_focus with
       | Some request ->
           (* flat stream keys are the block's own uuid — no more
              top-level key like the nested list had *)
           !(S.scroll_key_into_view) request.S.focus_uuid
       | None -> ());
    schedule_focus_retry (retry_delay_ms !focus_attempts)
  end
  else if waiting_for_click then (
    if !focus_attempts = 50 then
      Ui_services.log_error "initial click position unavailable; input remains queued until geometry arrives or editing is cancelled")
  else (
    S.pending_focus := None;
    focus_attempts := 0;
    last_focus_emitted := None;
    (* one line per exhausted arm — never mounting is a bug worth
       seeing, just not 50 PERF lines per click *)
    Ui_services.log_error
      {js|focus retry budget exhausted — editor sink never mounted|js};
    drain_pending_focus_actions ())

and schedule_focus_retry delay =
  if not !retry_timer_armed then begin
    retry_timer_armed := true;
    ignore (Ui_services.timers_timeout
      (fun () -> retry_timer_armed := false; apply_focus ()) delay)
  end

and drain_pending_focus_actions () =
  if !drain_gate
     || (match !S.pending_focus with
         | Some request -> Option.is_some request.S.focus_click
         | None -> false)
  then ()
  else
    match List.rev !S.pending_focus_actions with
    | [] -> ()
    | f :: rest ->
        drain_gate := true;
        S.pending_focus_actions := List.rev rest;
        (try f () with e -> Ui_services.log_error ("queued key replay failed", e));
        drain_gate := false;
        if !S.pending_focus_actions <> [] then schedule_focus_retry (retry_delay_ms 0)

and refresh_overlay ?frame ?model ?(flush = true) uuid =
  if flush && initial_click_pending uuid then apply_focus ();
  let frame = match frame with Some _ -> frame | None -> !S.active_frame in
  match (frame, !S.active_frame, Editor_sink.conduit uuid, S.editing ()) with
  | Some fr, Some active, Some conduit, Some e when fr == active && e.S.uuid = uuid ->
      let waiting = initial_click_pending uuid in
      let measured =
        if waiting then Edit_input.empty_frame
        else Edit_input.measure conduit (Option.value model ~default:e.S.model)
      in
      let current =
        match Signal.state_pending fr with Some v -> v | None -> Signal.get_state fr
      in
      if (waiting || Option.is_some measured.Edit_input.caret) && measured <> current then begin
        Signal.update fr (fun _ -> measured);
        if flush then Runtime.flush ()
      end;
      Option.is_some measured.Edit_input.caret
  | _ -> false

and set_caret uuid pos =
  update_model uuid (fun m -> Edit_model.select m ~anchor:pos ~focus:pos);
  ignore (refresh_overlay uuid)

(* flush-time pass over pending focus — main.ml and the test driver run
   one pass per UI flush; the retry loop rides the same entry point *)
let focus_pending () = apply_focus ()

let make_focus_request ?click ?owner uuid caret =
  let owner = match owner with
    | Some _ -> owner
    | None when S.ready () ->
        (match S.editing () with
         | Some e when e.S.uuid = uuid -> Some (e.S.scope, e.S.epoch)
         | _ -> None)
    | None -> None
  in
  { S.focus_uuid = uuid; focus_caret = caret; focus_armed_ms = !S.last_edit_input_ms
  ; focus_input_seq = !S.edit_input_seq; focus_click = click; focus_owner = owner }

let arm_focus ?(schedule = true) request =
  S.pending_focus := Some request;
  last_focus_emitted := None;
  (* pending_focus_actions intentionally kept: keys queued during the
     remount window belong to the next focus landing as well *)
  focus_attempts := 0;
  (* usually the input already exists — land right away; otherwise
     the arm rides the next flush pass *)
  if schedule then ignore (Ui_services.timers_timeout apply_focus 0)

let request_focus uuid caret = arm_focus (make_focus_request uuid caret)

let dismiss_draft ?(notify = true) (editing : S.editing) =
  match editing.S.owner, S.editing () with
  | S.Explicit_draft owner, Some live when live.S.epoch == editing.S.epoch ->
      (match !S.pending_focus with
       | Some request when focus_owned request editing -> S.pending_focus := None
       | _ -> ());
      Editor_sink.invalidate editing.S.uuid;
      S.history_input_before := None;
      S.set (fun st -> {st with S.editing = None});
      S.notify_edit_exit editing.S.uuid;
      if notify then owner#dismiss
  | _ -> ()

let submit_draft uuid =
  match S.editing () with
  | Some e when e.S.uuid = uuid ->
      (match e.S.owner with
       | S.Explicit_draft owner when owner#current
           && not (Edit_model.composing e.S.model)
           && not !S.structure_pending && !S.pending_edit_real = 0
           && !S.pending_focus_actions = [] -> owner#submit e.S.buffer
       | _ -> ())
  | _ -> ()

let draft_contains_target target =
  match S.editing (), closest ".ls-comments-area" target with
  | Some {S.owner = S.Explicit_draft owner; _}, Some area ->
      area.Ui_services.id () = "area-" ^ owner#asset_target
  | _ -> false

type split_commit =
  { persist : context:Model.t -> current:(unit -> bool) -> Wire.t option Js.Promise.t
  ; save : Ops.queued_save option
  ; context : Model.t
  ; restore : S.editing
  ; replay_after : int
  }

type split_batch =
  { owner : Ops.refresh_owner
  ; commits : split_commit Queue.t
  ; mutable running : bool
  ; mutable restore : S.editing option
  ; mutable replay_after : int
  ; mutable last_response : Wire.t option
  }

let active_split_batch : split_batch option ref = ref None
(* A retired operation must not release a newer context's input gate. *)
let structure_owner : (unit ref * unit Js.Promise.t) option ref = ref None

let split_owned batch =
  match !active_split_batch with Some active -> active == batch | None -> false

let split_current batch =
  if not (split_owned batch) then (batch.owner.cursor <- None; false)
  else Ops.refresh_current ~owner:batch.owner (Runtime.model ())

let retire_split batch =
  batch.owner.cursor <- None;
  if split_owned batch then begin
    active_split_batch := None;
    S.optimistic_split_ready := false;
    S.optimistic_input_replay := []
  end

type structure_guard =
  { structure_current : unit -> bool
  ; structure_owned : unit -> bool
  ; structure_refresh : unit -> unit Js.Promise.t
  ; structure_finish : unit -> unit
  }

let run_structure ?recover ?current_guard ~restore p finish =
  let context = Runtime.repo (), Runtime.route () in
  let owner = ref () in
  let started_at = Ui_services.time_now () in
  Ui_services.perf_mark "editor:structure-start";
  (match current_guard with
   | None -> Option.iter retire_split !active_split_batch
   | Some _ -> ());
  let context_current () =
    match current_guard with
    | Some guard -> guard.structure_current ()
    | None -> context = (Runtime.repo (), Runtime.route ())
  in
  let owned () =
    (match !structure_owner with Some (active, _) -> active == owner | None -> false)
    && match current_guard with
    | Some guard -> guard.structure_owned ()
    | None -> true
  in
  let claimed = Option.is_none current_guard || context_current () in
  (* Native promises can settle inline. Publish the owner and its completion
     before attaching callbacks, so release can recognize this operation. *)
  let completion = ref None in
  let owner_complete =
    let* finished = Js.Promise.make (fun ~resolve ~reject:_ ->
        completion := Some (fun result -> resolve (fun () -> result) [@u])) in
    finished ()
  in
  if claimed then begin
    structure_owner := Some (owner, owner_complete);
    S.structure_pending := true
  end;
  let current () = owned () && context_current () in
  let release () = if owned () then S.structure_pending := false in
  let drain () =
    if owned () && (Option.is_none current_guard || current ()) then begin
      Runtime.flush_now ();
      if owned () then S.drain_edit_actions ();
      if owned () then Ops.resume_pending_save ()
    end
  in
  let settled = p |> Js.Promise.catch (fun _ ->
      let restore = match recover with Some f -> f (current ()) | None -> restore in
      let recovery =
        if not (current ()) then Js.Promise.resolve () else
        match current_guard with
        | Some guard -> guard.structure_refresh ()
        | None -> Ops.refresh_page ()
      in
      let* () =
        match current_guard with
        | None -> recovery
        | Some _ -> recovery |> Js.Promise.catch (fun _ ->
            p)
      in
      if current () then (
        let restore =
          match restore, S.editing () with
          | Some original, Some live when original.S.epoch == live.S.epoch -> Some live
          | _ -> restore
        in
        S.set (fun st -> { st with S.editing = restore });
        match restore with
        | Some e -> request_focus e.S.uuid e.S.model.Edit_model.caret
        | None -> S.pending_focus := None);
      release ();
      drain ();
      p) in
  let finished =
    let* () = settled in
     Ui_services.perf_mark (Printf.sprintf "editor:structure-settled duration=%.1fms queued=%d"
       (Ui_services.time_now () -. started_at) (Queue.length S.pending_edit_actions));
     ignore (Ui_services.perf_mark "struct:resolved");
     release ();
     if current () then finish ();
     drain ();
     ignore (Ui_services.perf_mark "struct:drained");
     Js.Promise.resolve ()
  in
  let complete = match current_guard with
    | None -> finished
    | Some guard ->
        (let* () = finished in
         guard.structure_finish ();
         Js.Promise.resolve ())
        |> Js.Promise.catch (fun _ ->
            release ();
            guard.structure_finish ();
            finished)
  in
  (Option.get !completion) complete

(* Arm the optimistic editor now and again after canonical rows land. *)
let with_focus_after ~restore uuid caret p =
  S.click_point := None;
  request_focus uuid caret;
  run_structure ~restore p (fun () ->
    match S.editing () with
    | Some e when e.S.uuid = uuid -> request_focus uuid e.S.model.Edit_model.caret
    | _ -> ())

(* persisted/worker truth; display_title layers committed-but-unrefreshed
   buffers on top so exit-edit paints the saved text on the first frame *)
let model_title uuid =
  match S.find uuid with Some b -> b.Model.block_title | None -> ""

let display_title uuid = S.title_for uuid (model_title uuid)

let commit_result ?(after = fun () -> ()) uuid buf =
  (* compare against the persisted title, not display_title — the
     override may already hold buf (exit_edit sets it first) and
     normalization (heading strip, ref rewrite) can make the saved
     title differ from the buffer *)
  if buf <> model_title uuid then (
    let save = Ops.accept_save uuid buf in
    let title = Ops.normalized_title uuid buf in
    S.override_title uuid title;
    Ops.save_committed ~after:(fun () ->
        S.retire_title_override uuid title;
        after ()) save)
  else (
    let origin = Runtime.capture_reload_origin () in
    Option.iter Ops.release_save (Ops.take_pending_save_for uuid);
    (match origin with
     | Some origin when Runtime.reload_origin_current origin -> after ()
     | _ -> ());
    Js.Promise.resolve ())

let commit uuid buf = ignore (commit_result uuid buf)

let save_if_dirty uuid =
  match S.editing () with
  | Some e when e.S.uuid = uuid && S.is_draft e -> dismiss_draft e
  | _ -> commit uuid (Ops.trim_title uuid (live_buffer uuid))

(* deferred blur: committing synchronously on mousedown re-renders the
   tree between mousedown and mouseup, so the browser retargets the click
   to a common ancestor and enter_edit never runs. Defer one tick; a
   click into another block runs enter_edit first (save_if_dirty commits
   the old buffer) and clears this via clear_pending_blur. *)
let pending_blur_uuid : string option ref = ref None

let clear_pending_blur () = pending_blur_uuid := None

(* the marked container region ([data-cid]) containing an element —
   "main" when the target isn't inside one (page blocks are the default
   surface); scope keys the per-container editing entry *)
let scope_of_el el =
  match closest "[data-cid]" (Some el) with
  | Some host -> (
      match host.Ui_services.attr "data-cid" with
      | Some c -> c
      | None -> "main")
  | None -> "main"

let scope_of_uuid uuid =
  match Ui_services.dom_by_id ("ls-block-" ^ uuid) with
  | Some el -> scope_of_el el
  | None -> "main"

let enter_edit ?scope ?(submit_on_enter = false) uuid caret =
  if Ui_services.env_publishing () then () else
  let context = Runtime.repo (), Runtime.route () in
  let scope = match scope with Some sc -> sc | None -> scope_of_uuid uuid in
  let click = match !S.click_point with
    | (Some (u, ms, x, y) as point) when u = uuid && Ui_services.time_now () -. ms < 1500. ->
        if !S.click_point == point then S.click_point := None;
        Some (ms, x, y)
    | _ -> None
  in
  let rec enter () =
  clear_pending_blur ();
  if (match S.editing () with Some e -> e.S.uuid = uuid && e.S.scope = scope | None -> false)
  then ()
  else if (match S.editing () with Some e -> initial_click_pending e.S.uuid | None -> false) then
    S.pending_focus_actions :=
      (fun () -> if context = (Runtime.repo (), Runtime.route ()) then enter ())
      :: !S.pending_focus_actions
  else if !S.structure_pending then
    S.enqueue_edit_action ~real:true (fun () ->
      if context = (Runtime.repo (), Runtime.route ()) then
        enter ())
  else (
  (* single editing surface (cljs): a block editor opening commits any
     open property-value editor first *)
  !(S.close_property_editor) ();
  (match S.editing () with
  | Some e when e.uuid <> uuid || e.scope <> scope -> save_if_dirty e.uuid
  | _ -> ());
  match S.find uuid with
      | Some _b ->
          (* stored titles are id-ref form; the edit buffer shows page names
             (cljs id-ref->title-ref) *)
          let restore = S.editing () in
          let p =
            (let* buffer = Ops.title_on_entry uuid (display_title uuid) in
            if context = (Runtime.repo (), Runtime.route ()) then (
            (* Resolve the end position after title/reference conversion. *)
            let caret = if caret = -1 then String.length buffer else caret in
            (if Lazy.force perf_keys then
               Printf.eprintf "PERF editing-set src=enter_edit uuid=%s\n%!" uuid);
            let editing = S.mk_editing ~caret ~submit_on_enter ~uuid ~buffer ~scope ~base:buffer () in
            arm_focus ~schedule:false
              (make_focus_request ?click ~owner:(scope, editing.S.epoch) uuid caret);
            S.set (fun st ->
                { st with
                  S.editing = Some editing
                ; selection_scope = scope
                ; selected = S.String_set.empty
                ; anchor = None
                ; action_bar = false
                });
            ignore (Ui_services.timers_timeout apply_focus 0));
            Js.Promise.resolve ()) in
          run_structure ~restore p (fun () ->
              match S.editing () with
              | Some e when e.S.uuid = uuid && e.S.scope = scope ->
                  (match !S.pending_focus with
                   | Some request when focus_owned request e ->
                       if Option.is_some request.S.focus_click then apply_focus ()
                       else arm_focus request
                   | None when Option.is_none click -> request_focus uuid e.S.model.Edit_model.caret
                   | None -> ()
                   | Some _ -> ())
              | _ -> ())

  | None -> ())
  in enter ()

(* block that was under edit most recently — cljs keeps state/editing
   until another edit starts; our mousedown-blur commits earlier, so
   context commands (e.g. Add comment via cmdk) still need the block *)
let last_edit_uuid : string option ref = ref None

let rec exit_edit ~select =
  let before = S.editing () in
  if !S.structure_pending then
    S.enqueue_edit_action ~real:true (fun () ->
      if S.replay_current before (S.editing ()) then exit_edit ~select)
  else if S.ready () then
    match S.editing () with
    | None -> ()
    | Some e when S.is_draft e -> dismiss_draft e
    | Some e when initial_click_pending e.S.uuid ->
        S.pending_focus_actions := (fun () ->
          if S.replay_current before (S.editing ()) then exit_edit ~select)
          :: !S.pending_focus_actions
    | Some e ->
        last_edit_uuid := Some e.uuid;
        cancel_pending_focus ();
        let buf = Ops.trim_title e.uuid (live_buffer e.uuid) in
        let finish_exit () =
          match S.editing () with
          (* same session + same buffer text: safe to exit. Physical
             model identity is too strict — arrow-key dispatch swaps the
             session model for a refresh_lines-derived twin (same
             source, new lines table), which used to leave finish_exit
             dead. Input typed mid-commit changes source and still
             aborts the exit *)
          | Some current when current.S.uuid = e.uuid && current.S.scope = e.scope
                              && current.S.epoch == e.S.epoch
                              && String.equal current.S.model.Edit_model.source
                                   e.S.model.Edit_model.source ->
              (if Lazy.force perf_keys then
                 Printf.eprintf "PERF editing-clear src=exit_edit uuid=%s\n%!" e.uuid);
              Editor_sink.invalidate e.uuid;
              S.set (fun st ->
                  { st with
                    S.editing = None
                  ; selection_scope = e.scope
                  ; selected =
                      (if select then S.String_set.singleton e.uuid else st.selected)
                  ; anchor = (if select then Some e.uuid else st.anchor)
                    (* Escape selects the block without raising the action bar. *)
                  ; action_bar = false
                  });
              S.notify_edit_exit e.uuid
          | _ -> ()
        in
        (* Exit belongs to the editing session, even when its route changes
           while the save is pending. A newer session must remain intact. *)
        let p = commit_result ~after:finish_exit e.uuid buf in
        run_structure ~restore:(Some e) p (fun () -> ())

(* click outside the editor commits without selecting *)
let blur_commit () = exit_edit ~select:false

(* route change: persist the live buffer without refreshing — the
   navigation itself reloads whatever route is current *)
let flush_edit () =
  clear_pending_blur ();
  if S.ready () then
    match S.editing () with
    | None -> ()
  | Some e when S.is_draft e -> dismiss_draft e
  | Some e ->
      cancel_pending_focus ();
      let buf = Ops.trim_title e.uuid (live_buffer e.uuid) in
      let save =
        if buf <> model_title e.uuid then Some (Ops.accept_save e.uuid buf)
        else (
          Option.iter Ops.release_save (Ops.take_pending_save_for e.uuid);
          None)
      in
      (if Lazy.force perf_keys then
         Printf.eprintf "PERF editing-clear src=flush uuid=%s\n%!" e.uuid);
      Editor_sink.invalidate e.uuid;
      S.set (fun st -> { st with S.editing = None });
      Option.iter (fun save ->
          match !active_split_batch with
          | Some batch when batch.running && !S.optimistic_split_ready ->
              (* The final row still depends on this batch's accepted inserts. *)
              Queue.add
                { persist = (fun ~context:_ ~current:_ -> Js.Promise.resolve None)
                ; save = Some save; context = save.Ops.context; restore = e
                ; replay_after = !S.optimistic_input_seq }
                batch.commits
          | _ -> ignore (Ops.save_pending save)) save

(* property value cells open their own inline editor — entering one
   exits block editing just like a click into another block *)
let () = S.close_block_editor := blur_commit

(* Run the context commit in the same turn that observes a clean editor. *)
let after_pending_input commit =
  let context = Runtime.repo (), Runtime.route () in
  let editing = S.editing () in
  let rec drain () =
    if context <> (Runtime.repo (), Runtime.route ()) then
      Js.Promise.reject (Failure "Editor context changed before input drained")
    else if not (S.replay_current editing (S.editing ())) then
      Js.Promise.reject (Failure "Draft activation changed before input drained")
    else if !S.structure_pending then
      let _, complete = Option.get !structure_owner in
      let* () = complete in
      drain ()
    else if not (Queue.is_empty S.pending_edit_actions) then begin
      S.drain_edit_actions ();
      drain ()
    end else if !drain_gate then
      Js.Promise.reject (Failure "Editor input replay is still active")
    else match List.rev !S.pending_focus_actions with
    | action :: rest ->
        let before = !S.pending_focus_actions in
        S.pending_focus_actions := List.rev rest;
        drain_gate := true;
        let replay =
          try action (); drain_gate := false; Ok ()
          with error ->
            drain_gate := false;
            S.pending_focus_actions := before;
            Error error
        in
        (match replay with
        | Error error -> Js.Promise.reject error
        | Ok () ->
        if not !S.structure_pending
           && List.length !S.pending_focus_actions >= List.length before then
          Js.Promise.reject (Failure "Editor input has not reached its editing session")
        else drain ())
    | [] ->
        let* () = Ops.flush_pending_save () in
        if context <> (Runtime.repo (), Runtime.route ())
           || not (S.replay_current editing (S.editing ()))
           || !S.structure_pending || not (Queue.is_empty S.pending_edit_actions)
           || !S.pending_focus_actions <> [] then drain () else
        match S.editing () with
        | Some e when S.is_draft e ->
            clear_pending_blur ();
            dismiss_draft e;
            commit ()
        | Some e ->
            let buffer = Ops.trim_title e.S.uuid (live_buffer e.S.uuid) in
            if buffer <> e.S.base then begin
              let* saved = Ops.save_pending_result (Ops.accept_save e.S.uuid buffer) in
              match saved with
              | None ->
                  (match S.editing () with
                   | Some live when live.S.epoch == e.S.epoch
                       && live.S.buffer = e.S.buffer && live.S.base = e.S.base ->
                       Js.Promise.reject (Failure "Editor save made no progress before context change")
                   | _ -> drain ())
              | Some _ ->
              S.set_silent (fun st ->
                  match st.S.editing with
                  | Some live when live.S.epoch == e.S.epoch && live.S.buffer = e.S.buffer ->
                      { st with S.editing = Some { live with S.base = buffer } }
                  | _ -> st);
              drain ()
            end else begin
              clear_pending_blur ();
              cancel_pending_focus ();
              Editor_sink.invalidate e.S.uuid;
              S.set (fun st -> { st with S.editing = None });
              commit ()
            end
        | None -> commit ()
  in
  drain ()

let enter_draft ~uuid ~scope ~buffer ~(owner : S.draft_owner) =
  if not (Ui_services.env_publishing ()) && owner#current then begin
    let context = Runtime.repo (), Runtime.route () in
    let install () =
      if context = (Runtime.repo (), Runtime.route ()) && owner#current then begin
        !(S.close_property_editor) ();
        S.history_input_before := None;
        let caret = String.length buffer in
        let editing = S.mk_editing ~caret ~owner:(S.Explicit_draft owner)
            ~uuid ~scope ~buffer ~base:buffer () in
        S.set (fun st -> {st with S.editing = Some editing;
          selection_scope = scope; selected = S.String_set.empty;
          anchor = None; action_bar = false});
        arm_focus (make_focus_request ~owner:(scope, editing.S.epoch) uuid caret)
      end;
      Js.Promise.resolve ()
    in
    ignore (after_pending_input install |> Js.Promise.catch (fun error ->
      Ui_services.log_error ("Draft editor activation failed", error);
      if owner#current then owner#dismiss;
      Js.Promise.resolve ()))
  end

let schedule_blur_commit ?(keep = fun () -> false) () =
  match S.editing () with
  | None -> ()
  | Some e ->
      pending_blur_uuid := Some e.uuid;
      ignore
        (Ui_services.timers_timeout
          (fun () ->
            match !pending_blur_uuid with
            | Some u ->
                let finish () =
                  if !pending_blur_uuid = Some u then begin
                    pending_blur_uuid := None;
                    match S.editing () with
                    | Some e' when e'.uuid = u && S.replay_current (Some e) (Some e') ->
                        if not (keep ()) then blur_commit ()
                    | _ -> ()
                  end
                in
                if initial_click_pending u then
                  S.pending_focus_actions := finish :: !S.pending_focus_actions
                else finish ()
            | None -> ())
          0)

(* ---- structure ops ---- *)

(* Enter on an empty ordered-list block just removes its list marker
   (cljs remove-block-own-order-list-type!); the block keeps editing *)
let drop_own_order_list uuid buf parent_ordered =
  String.trim buf = "" && not parent_ordered
  && (match S.find uuid with
      | Some b -> b.Model.block_order_list <> None
      | None -> false)

(* cljs insert-as-sibling?: every insert on the Library page lands as a
   sibling *page* — library children are always page-typed *)
let library_context () =
  match (Runtime.model ()).Model.route_page with
  | Some p -> p.Model.page_is_library
  | None -> false

(* optimistic model edits apply to whichever store the block lives in:
   the standalone page route, or the day page inside current_journals.
   The worker delta stays authoritative and splices the real record over
   these placeholders when it lands *)
let optimistic_edit ?owner (f : Model.page -> Model.page option) =
  match !Runtime.current_page with
  | Some page -> (
      match f page with
      | Some page' ->
          Page_delta.mark_own_commit page';
          (let _ = Ui_services.perf_mark "optimistic:page-loaded" in
           Ops.send_refresh ?owner (Action.Page_loaded page'))
      | None -> ())
  | None -> (
      let rec loop acc = function
        | [] -> ()
        | (p : Model.page) :: rest -> (
            match f p with
            | Some p' ->
                Ops.send_refresh ?owner
                  (Action.Journals_spliced
                     (List.rev_append acc (p' :: rest)))
            | None -> loop (p :: acc) rest)
      in
      loop [] !Runtime.current_journals)

(* The worker knows the graph hierarchy, not the UI's focused root. *)
let within_focused_root ~outdent uuid =
  match Runtime.route () with
  | Model.Block_zoom root ->
      uuid <> root
      && (not outdent
          || match S.find_parent uuid with
             | Some (Some parent, _) -> parent.Model.block_uuid <> Some root
             | _ -> true)
  | _ -> true

let apply_indent_outdent ?parent_original uuids indent =
  let opts = Ops.current_history_opts (Wire.Map []) in
  let* cfg = Sdk_config.read_config (Runtime.repo ()) in
  let logical =
    match Wire.get cfg "editor/logical-outdenting?" with
    | None -> false
    | Some (Wire.Bool b) -> b
    | Some _ -> failwith "Logical outdenting configuration must be boolean"
  in
  if parent_original = None then
    optimistic_edit (fun p ->
        if indent then Model.indent_blocks p uuids
        else Model.outdent_blocks ~logical p uuids);
  Ops.apply_and_refresh ~opts
    [ Ops.indent_outdent ?parent_original ~logical uuids indent ]

(* cljs keydown-new-block: Enter on an empty last child outdents it
   instead of inserting a sibling (when no right sibling exists) *)
let outdent_empty_last_child uuid e b =
  let _ = (e, b) in
  if String.trim (live_buffer uuid) <> ""
     || not (within_focused_root ~outdent:true uuid) then false
  else
    match S.find_parent uuid with
    | Some (Some parent, idx) ->
        let last = List.length parent.Model.block_children - 1 in
        if idx < last then false
        else (
          with_focus_after ~restore:(Some e) uuid e.S.model.Edit_model.caret
            (apply_indent_outdent [ uuid ] false);
          true)
    | _ -> false
(* cljs compute-fst-snd-block-text: the new block's half is triml'd *)
let ltrim s =
  let n = String.length s in
  let rec go i =
    if
      i < n
      && (s.[i] = ' ' || s.[i] = '\t' || s.[i] = '\r' || s.[i] = '\n'
         || s.[i] = '\012')
    then go (i + 1)
    else i
  in
  String.sub s (go 0) (n - go 0)

(* Keep Enter's optimistic rows mounted until the ordered commit batch
   catches up. Publishing each intermediate delta would replace future
   placeholders and move the active sink underneath rapid typing. *)
let split_batch_for () =
  match !active_split_batch with
  | Some batch when split_current batch && !S.optimistic_split_ready -> batch
  | previous ->
      let entry = Option.get (Runtime.capture_reload_origin ()) in
      Option.iter retire_split previous;
      let batch =
        { owner = Ops.refresh_owner entry; commits = Queue.create (); running = false
        ; restore = None; replay_after = 0; last_response = None }
      in
      active_split_batch := Some batch;
      batch

let enqueue_split batch ~context ~save ~restore persist =
  Queue.add { persist; save; context; restore; replay_after = !S.optimistic_input_seq }
    batch.commits;
  if not batch.running then (
    batch.running <- true;
    if split_current batch then S.optimistic_split_ready := true;
    let current () = split_current batch in
    let persist_save job =
      match job.save with
      | None -> Js.Promise.resolve ()
      | Some save -> Ops.save_pending ~current save
    in
    let rec drain_saves () =
      if Queue.is_empty batch.commits then Js.Promise.resolve () else
      let job = Queue.take batch.commits in
      let operation = let* () = persist_save job in drain_saves () in
      operation |> Js.Promise.catch (fun _ ->
          let* () = drain_saves () |> Js.Promise.catch (fun later ->
              Ui_services.log_error ("split origin save failed", later);
              Js.Promise.resolve ()) in
          operation)
    in
    let rec drain () =
      ignore (current ());
      if Queue.is_empty batch.commits then (
        if not (current ()) then Js.Promise.resolve () else (
          S.optimistic_split_ready := false;
          let* () = Ops.refresh_via_delta ~owner:batch.owner batch.last_response in
          Ops.require_refresh_success batch.owner))
      else (
        let job = Queue.take batch.commits in
        batch.restore <- Some job.restore;
        batch.replay_after <- job.replay_after;
        let operation = let* () = persist_save job in
         let* response = job.persist ~context:job.context ~current in
         if current () then batch.last_response <- response;
         drain () in
        operation |> Js.Promise.catch (fun _ ->
            let* () = drain_saves () |> Js.Promise.catch (fun later ->
                Ui_services.log_error ("split origin save failed", later);
                Js.Promise.resolve ()) in
            operation))
    in
    let recover is_current =
      if split_owned batch && is_current then begin
        S.optimistic_split_ready := false;
        (match S.editing () with
         | Some e -> Option.iter Ops.release_save (Ops.take_pending_save_for e.S.uuid)
         | None -> ());
        let queued = Queue.copy S.pending_edit_actions in
        Queue.clear S.pending_edit_actions;
        List.rev !S.optimistic_input_replay
        |> List.iter (fun (seq, replay) ->
            if seq > batch.replay_after then
              S.enqueue_edit_action ~real:true (fun () -> if current () then replay ()));
        S.optimistic_input_replay := [];
        Queue.iter (fun f -> Queue.add f S.pending_edit_actions) queued
      end;
      batch.restore
    in
    let current_guard =
      { structure_current = current
      ; structure_owned = (fun () -> split_owned batch)
      ; structure_refresh = (fun () ->
          batch.owner.outcome <- None;
          let* () = Ops.refresh_page_then ~owner:batch.owner
              (fun () -> Js.Promise.resolve ()) in
          Ops.require_refresh_success batch.owner)
      ; structure_finish = (fun () -> retire_split batch)
      }
    in
    let p = drain () in
    run_structure ~recover ~current_guard ~restore:(Some restore) p (fun () ->
        S.optimistic_input_replay := [];
        match S.editing () with
        | Some e -> request_focus e.S.uuid e.S.model.Edit_model.caret
        | None -> ()))

let can_split_optimistically uuid =
  match S.editing (), S.find uuid with
  | Some e, Some b when e.S.uuid = uuid ->
      let empty = String.trim e.S.buffer = "" in
      let parent_ordered, last_child = match S.find_parent uuid with
        | Some (Some parent, idx) ->
            parent.Model.block_order_list <> None,
            idx = List.length parent.Model.block_children - 1
        | _ -> false, false in
      not (empty && last_child)
      && not (empty && not parent_ordered && b.Model.block_order_list <> None)
  | _ -> false

let split_at_cursor uuid =
  match (S.editing (), S.find uuid) with
  | Some e, Some b when e.uuid = uuid && outdent_empty_last_child uuid e b ->
      ()
  | Some e, Some b when e.uuid = uuid ->
      let perf = Sys.getenv_opt "LOGSEQ_PERF" <> None in
      let t_last = ref (Ui_services.time_now ()) in
      let mark name =
        if perf then (
          let now = Ui_services.time_now () in
          Printf.eprintf "[perf] split.%s %.1fms\n%!" name
            (now -. !t_last);
          t_last := now)
      in
      mark "entry";
      let buf = e.S.buffer
      and pos, selection_end = sel_span_of e.S.model in
      let parent_ordered =
        match S.find_parent uuid with
        | Some (Some p, _) -> p.Model.block_order_list <> None
        | _ -> false
      in
      if drop_own_order_list uuid buf parent_ordered then (
        ignore
          (Ops.apply_and_refresh
             [ Ops.remove_block_property uuid
                 "logseq.property/order-list-type" ]);
        request_focus uuid 0)
      else
        let pos = max 0 (min pos (String.length buf)) in
        let prefix = String.sub buf 0 pos in
        let suffix = ltrim (String.sub buf selection_end (String.length buf - selection_end)) in
        let focused_root = Runtime.route () = Model.Block_zoom uuid in
        let above = not focused_root && String.trim prefix = ""
                    && String.trim suffix <> "" in
        let before =
          Ops.trim_title uuid
            (if above then (if selection_end <> pos then suffix else buf)
             else prefix) in
        let after = if above then "" else suffix in
        let new_uuid = Ui_services.env_random_uuid () in
        let library = library_context () in
        let sibling =
          not focused_root
          && (above || library || S.is_collapsed_in ~scope:e.S.scope uuid
              || b.Model.block_children = [])
        in
        mark "prelude";
        let opts = Ops.history_opts ~opts:(Ops.op_opts "insert-blocks")
            ~before:(S.history_editing e)
            ~after:(S.history_editing
              (S.mk_editing ~uuid:new_uuid ~buffer:after ~scope:e.scope ~base:after ())) () in
        (* Capture this block's debounce now, before the next editor can
           schedule a save for a UUID the worker has not inserted yet. *)
        let context = Runtime.model () in
        let source = Ops.source_block uuid in
        let batch = split_batch_for () in
        let save = Ops.take_pending_save () in
        let persist ~context ~current =
          (* UI ownership may expire, but accepted edits retain their origin. *)
          let origin_repo = Option.get context.Model.repo in
          let* a = Js.Promise.all
              [| Ops.block_map_parsed_source ~origin_repo ~source uuid before
               ; Ops.block_map_parsed_source ~page:library ~origin_repo
                   ~source:false new_uuid after |] in
          Ops.submit_result ~current context opts
            ([ Ops.op "save-block" [ a.(0); Wire.Map [] ]
            ; Ops.insert_blocks [ a.(1) ] uuid ~sibling ]
            @ if above then [ Ops.move_blocks [ uuid ] new_uuid ~sibling:true ] else [])
        in
        mark "ops";
        (* optimistic insert: mount the new row and retitle the split
           block synchronously — the worker delta splices the real
           record over the placeholder when it lands *)
        optimistic_edit ~owner:batch.owner (fun p ->
            Model.split_insert ~above p ~uuid ~before
              ~new_block:
                (Model.empty_block ~uuid:new_uuid ~title:after
                   ~is_page:library)
              ~sibling);
        mark "splice";
        if split_current batch then begin
        (* the exit-edit repaint lands before the worker delta — pin the
           saved title so the row doesn't flash the pre-split text *)
        S.override_title uuid (Ops.normalized_title uuid before);
        mark "title";
        (* S.set (not silent): the old sink must unmount before the
           next keypress, or keystrokes keep landing in the stale editor *)
        (if Lazy.force perf_keys then
           Printf.eprintf "PERF editing-set src=split uuid=%s\n%!" new_uuid);
        S.set (fun st ->
            { st with
              S.editing =
                Some
                  (S.mk_editing ~uuid:new_uuid ~buffer:after ~scope:e.scope
                     ~base:after ()) });
        mark "editing";
        S.click_point := None;
        request_focus new_uuid 0;
        end;
        enqueue_split batch ~context ~save ~restore:e persist;
        mark "focus-arm"
  | _ -> ()

(* shift+Enter on a code surface (or any non-splitting editor) appends a
   fresh sibling after the block — cljs insert-new-block! *)
let insert_sibling_after ?(after_insert = fun _ -> Js.Promise.resolve ()) uuid =
  match (S.editing (), S.find uuid) with
  | Some e, Some b when e.uuid = uuid ->
      let buf = Ops.trim_title uuid (live_buffer uuid) in
      let new_uuid = Ui_services.env_random_uuid () in
      let library = library_context () in
      let sibling =
        library || S.is_collapsed_in ~scope:e.S.scope uuid
        || b.Model.block_children = []
      in
      let p =
        let* m = Ops.block_map_parsed uuid buf in
        let* () =
          Ops.apply_and_refresh ~opts:(Ops.op_opts "insert-blocks")
            [ Ops.op "save-block" [ m; Wire.Map [] ]
            ; Ops.insert_blocks
                [ Ops.block_map ~title:"" ~page:library new_uuid ]
                uuid ~sibling ]
        in
        after_insert new_uuid
      in
      optimistic_edit (fun p ->
          Model.split_insert p ~uuid ~before:buf
            ~new_block:
              (Model.empty_block ~uuid:new_uuid ~title:"" ~is_page:library)
            ~sibling);
      (* the exit-edit repaint lands before the worker delta — pin the
         saved title so the row doesn't flash the stale title *)
      S.override_title uuid (Ops.normalized_title uuid buf);
      (* S.set (not silent): the old sink must unmount before the
         next keypress, or keystrokes keep landing in the stale editor *)
      (if Lazy.force perf_keys then
         Printf.eprintf "PERF editing-set src=sibling uuid=%s\n%!" new_uuid);
      S.set (fun st ->
          { st with
            S.editing =
              Some
                (S.mk_editing ~uuid:new_uuid ~buffer:"" ~scope:e.scope
                   ~base:"" ())
          });
      with_focus_after ~restore:(Some e) new_uuid 0 p  | _ -> ()

let move_children_ops (b : Model.block) target_uuid =
  match
    List.filter_map (fun c -> c.Model.block_uuid) b.Model.block_children
  with
  | [] -> []
  | uuids -> [ Ops.move_blocks uuids target_uuid ~sibling:false ]

let is_parent_of (parent : Model.block) uuid =
  List.exists
    (fun c -> c.Model.block_uuid = Some uuid)
    parent.Model.block_children

let same_parent a_uuid b_uuid =
  match (S.find_parent a_uuid, S.find_parent b_uuid) with
  | Some (p1, _), Some (p2, _) -> (
      match (p1, p2) with
      | None, None -> true
      | Some p, Some q -> p.Model.block_uuid = q.Model.block_uuid
      | _ -> false)
  | _ -> false

(* cljs boundary-merge-allowed?: a block with children cannot merge
   across a parent boundary *)
let boundary_merge_allowed source target_uuid =
  source.Model.block_children = [] || same_parent
    (Option.value source.Model.block_uuid ~default:"")
    target_uuid

let merge_source left right =
  let whitespace = function ' ' | '\t' | '\r' | '\n' -> true | _ -> false in
  let separator =
    left <> "" && right <> ""
    && not (whitespace left.[String.length left - 1] || whitespace right.[0])
    && match List.find_opt
      (fun (r : Edit_runs.run) -> r.kind <> Edit_runs.Delim)
      (List.rev (Edit_runs.runs left)) with
      | Some { Edit_runs.cls; _ } ->
          List.exists
            (fun c -> List.mem c [ "ed-page-ref"; "ed-block-ref"; "ed-tag"; "ed-url"; "ed-link" ])
            (String.split_on_char ' ' cls)
      | _ -> false
  in
  let prefix = left ^ (if separator then " " else "") in
  prefix ^ right, String.length prefix

(* Backspace at caret 0: merge current into previous visible block *)
let merge_prev uuid =
  match
    ( S.editing ()
    , S.find uuid
    , S.prev_visible ~scope:(match S.editing () with Some e -> e.scope | None -> "main") uuid )
  with
  | Some e, Some b, Some prev when e.uuid = uuid -> (
      match prev.Model.block_uuid with
      | None -> ()
      | Some prev_uuid ->
          let buf = live_buffer uuid in
          if not (boundary_merge_allowed b prev_uuid) then ()
          else if
            String.trim prev.Model.block_title = ""
            && not (is_parent_of prev uuid)
          then (
            (* empty prev: current moves after it, prev dies *)
            let ops =
              [ Ops.move_blocks [ uuid ] prev_uuid ~sibling:true
              ; Ops.delete_blocks [ prev_uuid ]
              ]
            in
            optimistic_edit (fun p -> Model.delete_block p prev_uuid);
            S.set (fun st ->
                { st with
                  S.editing =
                    Some
                      (S.with_model e (Edit_model.set_source e.S.model buf))
                });
            with_focus_after ~restore:(Some e) uuid 0
              (Ops.apply_and_refresh
                 ~opts:(Ops.history_opts ~opts:(Ops.op_opts "delete-blocks")
                   ~before:(S.history_editing e) ~after:(S.history_cursor ()) ()) ops))
          else (
            (* title_for (override ?? model): prev's commit may still be
               in flight — the debounced save's delta only lands with
               this op, and the model title would drop typed text *)
            let ptitle = S.title_for prev_uuid prev.Model.block_title in
            (* the merged-away row repaints before the delete lands — pin
               its live buffer so it doesn't flash the stale title *)
            S.override_title uuid (Ops.normalized_title uuid buf);
            let context = Runtime.repo (), Runtime.route () in
            let p = (let* sop =
                 Ops.save_block_parsed prev_uuid (fst (merge_source ptitle buf))
               in
               let ops =
                 move_children_ops b prev_uuid
                 @ [ Ops.delete_blocks [ uuid ]; sop ]
               in
               let* pbuf = Ops.title_for_edit (String.trim ptitle) in
               let merged, caret = merge_source pbuf buf in
              if context <> (Runtime.repo (), Runtime.route ()) then Js.Promise.resolve ()
              else (
              S.set (fun st ->
                  { st with
                    S.editing =
                      Some
                        (S.mk_editing ~caret ~uuid:prev_uuid ~buffer:merged
                           ~scope:e.scope ~base:merged ()) });
              request_focus prev_uuid caret;
              Ops.apply_and_refresh
                ~opts:(Ops.history_opts ~opts:(Ops.op_opts "delete-blocks")
                  ~before:(S.history_editing e) ~after:(S.history_cursor ()) ()) ops)) in
            run_structure ~restore:(Some e) p (fun () ->
              if S.editing_uuid () = Some prev_uuid then
                request_focus prev_uuid (caret_of prev_uuid))))
  | _ -> ()

(* children of b except [except_uuid] -> move under target *)
let move_children_except_ops (b : Model.block) except_uuid target_uuid =
  match
    List.filter_map
      (fun c ->
        if c.Model.block_uuid = Some except_uuid then None
        else c.Model.block_uuid)
      b.Model.block_children
  with
  | [] -> []
  | uuids -> [ Ops.move_blocks uuids target_uuid ~sibling:false ]

(* the merge itself, once the surface has gone quiet *)
let merge_next_now uuid =
  match
    ( S.editing ()
    , S.find uuid
    , S.next_visible ~scope:(match S.editing () with Some e -> e.scope | None -> "main") uuid )
  with
  | Some e, Some b, Some next when e.uuid = uuid -> (
      match next.Model.block_uuid with
      | None -> ()
      | Some next_uuid ->
          let buf = live_buffer uuid in
          (* cljs boundary-merge-allowed?(next-block, current-block): a
             next-block with children cannot merge/delete across a parent
             boundary — gates both the empty-delete and the merge path *)
          if not (boundary_merge_allowed next uuid) then ()
          else if String.trim buf = "" then (
            (* cljs input-empty + delete-concat: the empty current block
               is deleted, its children reparented to next, next is
               edited at caret 0 *)
            let ops =
              move_children_except_ops b next_uuid next_uuid
              @ (if is_parent_of b next_uuid then
                   [ Ops.move_blocks [ next_uuid ] uuid ~sibling:true ]
                 else [])
              @ [ Ops.delete_blocks [ uuid ] ]
            in
            (* the row repaints before the delete lands — pin its live
               (empty) buffer so it doesn't flash the stale title *)
            S.override_title uuid (Ops.normalized_title uuid buf);
            let context = Runtime.repo (), Runtime.route () in
            let p = (let* nbuf =
                 Ops.title_for_edit
                   (String.trim
                      (S.title_for next_uuid next.Model.block_title))
               in
              if context <> (Runtime.repo (), Runtime.route ()) then Js.Promise.resolve ()
              else (
              S.set (fun st ->
                  { st with
                    S.editing =
                      Some
                        (S.mk_editing ~uuid:next_uuid ~buffer:nbuf
                           ~scope:e.scope ~base:nbuf ()) });
              request_focus next_uuid 0;
              Ops.apply_and_refresh
                ~opts:(Ops.history_opts ~opts:(Ops.op_opts "delete-blocks")
                  ~before:(S.history_editing e) ~after:(S.history_cursor ()) ()) ops)) in
            run_structure ~restore:(Some e) p (fun () ->
              if S.editing_uuid () = Some next_uuid then request_focus next_uuid 0))
          else (
            let ops =
              move_children_ops next uuid @ [ Ops.delete_blocks [ next_uuid ] ]

            in
            let context = Runtime.repo (), Runtime.route () in
            let p = (let* nbuf =
                 Ops.title_for_edit
                   (String.trim
                      (S.title_for next_uuid next.Model.block_title))
               in
               let merged, caret = merge_source buf nbuf in
              if context <> (Runtime.repo (), Runtime.route ()) then Js.Promise.resolve ()
              else (
              S.set (fun st ->
                  { st with
                    S.editing =
                      Some
                        (S.mk_editing ~caret ~uuid
                           ~buffer:merged ~scope:e.scope ~base:merged ())
                  });
              request_focus uuid caret;
              Ops.apply_parsed_and_refresh
                   ~opts:(Ops.history_opts ~opts:(Ops.op_opts "delete-blocks")
                     ~before:(S.history_editing e) ~after:(S.history_cursor ()) ())
                   ~rest:ops [ (uuid, merged) ])) in
            run_structure ~restore:(Some e) p (fun () ->
              if S.editing_uuid () = Some uuid then request_focus uuid (caret_of uuid))))
  | _ -> ()

(* Delete at end: merge next visible block into current. The merge only
   commits once the surface is input-quiet: a keystroke still in flight
   (queued behind a structure op, or dispatched between the arming key
   and the deferred commit) supersedes the plan — a continuous second
   Delete must not produce a merge at all. A merge_next arriving while
   a plan is armed is part of the same burst: the armed plan already
   supersedes it. *)
let merge_next uuid =
  match !S.merge_plan_seq with
  | Some _ -> ()
  | None ->
      let plan = !S.edit_input_seq in
      S.merge_plan_seq := Some plan;
      let context = Runtime.repo (), Runtime.route () in
      ignore
        (Ui_services.timers_timeout
           (fun () ->
             match !S.merge_plan_seq with
             | Some s when s = plan ->
                 S.merge_plan_seq := None;
                 if !S.edit_input_seq = plan
                    && context = (Runtime.repo (), Runtime.route ())
                 then merge_next_now uuid
             | _ -> ())
           0)

(* ---- selection ---- *)

let flat_uuids () =
  List.filter_map
    (fun b -> b.Model.block_uuid)
    (S.flat_visible ~scope:(S.interaction_scope ()) ())

let selection_forest () =
  let model = Runtime.model () in
  let scope = S.selection_scope () in
  let main_scope =
    scope = "main"
    || match Runtime.route () with Model.Block_zoom u -> scope = "zoom-" ^ u | _ -> false
  in
  if not main_scope then S.blocks_in_scope scope
  else
    let pages = match model.Model.route_page with Some p -> [p] | None -> model.journals in
    List.concat_map
      (fun (p : Model.page) -> match p.page_uuid with
         | Some uuid ->
             [{ (Model.empty_block ~uuid ~title:p.page_title ~is_page:true) with
                Model.block_db_id = p.page_db_id; block_children = p.page_blocks }]
         | None -> p.page_blocks)
      pages

type selected_snapshot =
  { selection : S.String_set.t
  ; scope : string
  ; uuids : string list
  ; blocks : Model.block list
  ; roots : Model.block list
  ; unresolved : S.String_set.t
  }

let selected_snapshot () =
  let selection = S.selected () in
  let seen = ref S.String_set.empty and ordered = ref [] in
  let blocks = ref [] and roots = ref [] in
  let rec walk under_selected forest =
    List.iter (fun (b : Model.block) ->
      let selected = match b.block_uuid with
        | Some u -> S.String_set.mem u selection
        | None -> false
      in
      (match b.block_uuid with
       | Some u when selected && not (S.String_set.mem u !seen) ->
           seen := S.String_set.add u !seen;
           ordered := u :: !ordered;
           blocks := b :: !blocks;
           if not under_selected then roots := b :: !roots
       | _ -> ());
      walk (under_selected || selected) (S.children_of b)) forest
  in
  walk false (selection_forest ());
  let unresolved = S.String_set.diff selection !seen in
  (* Selection membership survives virtualization and transient model reloads. *)
  { selection; scope = S.selection_scope (); roots = List.rev !roots
  ; blocks = List.rev !blocks; unresolved
  ; uuids = List.rev !ordered @ S.String_set.elements unresolved }

(* Worker operations consume document order, never UUID sort order. *)
let selected_uuids () =
  (selected_snapshot ()).uuids

let open_selected_block ~at_end () =
  let uuids = selected_uuids () in
  match (if at_end then List.rev uuids else uuids) with
  | uuid :: _ -> enter_edit ~scope:(S.selection_scope ()) uuid (if at_end then -1 else 0)
  | [] -> ()

let index_of lst u =
  let rec go i = function
    | x :: _ when x = u -> i
    | _ :: rest -> go (i + 1) rest
    | [] -> -1
  in
  go 0 lst

(* the page-title row is a selectable .ls-block that sits above every
   block without being part of the flat list — a selection anchored on
   it extends down into the blocks *)
let anchor_is_page_title anchor =
  let model = Runtime.model () in
  let pages = match model.Model.route_page with Some p -> [p] | None -> model.journals in
  List.exists (fun (p : Model.page) -> p.page_uuid = Some anchor) pages

(* range anchor..head (inclusive) in visible order; [] when either
   endpoint isn't a visible block (e.g. a journal row's page uuid from a
   co-mounted virt list extending on the same scroller) *)
let range_between anchor head =
  let uuids = flat_uuids () in
  let ia = index_of uuids anchor and ih = index_of uuids head in
  if ia >= 0 && ih >= 0 then
    let lo, hi = (min ia ih, max ia ih) in
    List.filteri (fun i _ -> i >= lo && i <= hi) uuids
  else if ia < 0 && ih >= 0 && anchor_is_page_title anchor then
    anchor :: List.filteri (fun i _ -> i <= ih) uuids
  else []

(* extend selection one visible step from the current head *)
let extend_selection up =
  let sel = S.selected () in
  match S.anchor () with
  | None -> ()
  | Some anchor -> (
      let uuids = flat_uuids () in
      let ordered = List.filter (fun u -> S.String_set.mem u sel) uuids in
      let head =
        match ordered with
        | [] -> None
        | first :: rest ->
            let last = List.fold_left (fun _ u -> u) first rest in
            (* The active endpoint is opposite the fixed anchor, regardless
               of the next arrow's direction. A disjoint selection starts
               a new range from its anchor. *)
            Some
              (if first = anchor
                  || (anchor_is_page_title anchor && not (List.mem anchor uuids))
               then last
               else if last = anchor then first
               else anchor)
      in
      match head with
      | None -> (
          (* only the title row selected: ArrowDown enters the block
             list from the top *)
          match (up, uuids) with
          | false, first :: _ when anchor_is_page_title anchor ->
              let range = range_between anchor first in
              S.set (fun st ->
                  { st with
                    S.selected = S.String_set.of_list range
                  ; anchor = Some anchor
                  ; action_bar = true
                  })
          | _ -> ())
      | Some h -> (
          let nbr =
            (if up
             then S.prev_visible ~scope:(S.selection_scope ())
             else S.next_visible ~scope:(S.selection_scope ()))
              h
          in
          match nbr with
          | None ->
              (* head is the topmost flat block: cljs
                 navigable-sibling-block treats .ls-page-title as a
                 block, so shift+up past it conj's the title row into
                 the selection *)
              if up && S.selection_scope () = "main" then
                (match Ui_services.dom_query ".ls-page-title .ls-block" with
                 | Some tb -> (
                     match tb.Ui_services.attr "data-blockid" with
                     | Some t when not (S.String_set.mem t sel) ->
                         S.set (fun st ->
                             { st with
                               S.selected = S.String_set.add t sel
                             ; action_bar = true
                             })
                     | _ -> ())
                 | None -> ())
          | Some nb -> (
              match nb.Model.block_uuid with
              | None -> ()
              | Some nu ->
                  let range = range_between anchor nu in
                  S.set (fun st ->
                      { st with
                        S.selected = S.String_set.of_list range
                      ; anchor = Some anchor
                      ; action_bar = true
                      }))))

let select_single_in ~scope uuid =
  S.set (fun st ->
      { st with
        S.selected = S.String_set.singleton uuid
      ; selection_scope = scope
      ; anchor = Some uuid
      ; action_bar = false
      })

let select_single uuid = select_single_in ~scope:(scope_of_uuid uuid) uuid

let select_all () =
  match flat_uuids () with
  | [] -> ()
  | first :: _ ->
      S.set (fun st ->
          { st with
            S.selected = S.String_set.of_list (flat_uuids ())
          ; anchor = Some first
          ; action_bar = false
          })

let clear_selection ?scope () =
  S.set (fun st ->
      { st with
        S.selected = S.String_set.empty
      ; selection_scope = (match scope with Some scope -> scope | None -> st.selection_scope)
      ; anchor = None
      ; action_bar = false
      })

(* cljs editor-handler/show-action-bar!: pointer gestures and
   shift+arrow selection raise the popover; bare selection changes
   (Escape, mod+a, click-clear) leave it hidden *)
let show_action_bar () =
  S.set (fun st -> { st with S.action_bar = true })

let hide_action_bar () =
  S.set (fun st -> { st with S.action_bar = false })

(* shift+arrow arriving during the pending-focus window replays here once
   focus lands: exit edit into selection, then extend one visible step *)
let shift_arrow_select up =
  match S.editing () with
  | Some _ ->
      exit_edit ~select:true;
      show_action_bar ()
  | None -> extend_selection up

(* cljs editor/select-parent: with a selection, move it to the first
   block's parent (all blocks when the parent is the page); without one,
   select all blocks *)
let select_parent () =
  match selected_uuids () with
  | u :: _ -> (
      match S.find_parent u with
      | Some (Some p, _) -> (
          match p.Model.block_uuid with
          | Some pu -> select_single_in ~scope:(S.selection_scope ()) pu
          | None -> select_all ())
      | _ -> select_all ())
  | [] -> select_all ()
(* move selection up/down one block (single-block arrow nav in normal
   mode, plain move for shift-extend callers) *)
let move_selection_focus up =
  match S.selected () |> S.String_set.elements with
  | [ cur ] -> (
      let nb =
        (if up
         then S.prev_visible ~scope:(S.selection_scope ())
         else S.next_visible ~scope:(S.selection_scope ()))
          cur
      in
      match nb with
      | Some b -> (
          match b.Model.block_uuid with
          | Some u -> select_single_in ~scope:(S.selection_scope ()) u
          | None -> ())
      | None -> ())
  | _ -> ()

(* ---- block structure ops ---- *)

let indent_or_outdent ~indent =
  let sel = S.selected () in
  let uuids =
    match S.editing_uuid () with
    | Some u when S.String_set.mem u sel -> selected_uuids ()
    | Some u -> [ u ]
    | None -> selected_uuids ()
  in
  let uuids = List.filter (within_focused_root ~outdent:(not indent)) uuids
  in
  match uuids with
  | [] -> ()
  | focus :: _ ->
      (* cljs expand-collapsed-indent-target!: indenting under a
         collapsed sibling expands it — clear the local collapsed
         override so the indented block stays visible *)
      if indent then
        List.iter
          (fun u ->
            match S.prev_sibling u with
            | Some s -> (
                match s.Model.block_uuid with
                | Some su ->
                    S.set_silent (fun st ->
                        S.collapsed_ui_transform ~scope:(S.interaction_scope ()) su
                          false
                          { st with
                            S.collapsed =
                              S.String_set.remove su st.S.collapsed
                          })
                | None -> ())
            | None -> ())
          uuids;
      (* outdent of a block rendered inside a page embed must move it next
         to the embed block, not inside the linked page — cljs
         get-first-block-original reads data-originalblockid off the ancestor
         .ls-block; the model parent is the embed block *)
      let parent_original =
        match S.find_parent focus with
        | Some (Some p, _) when p.Model.block_link <> None ->
            p.Model.block_uuid
        | _ -> None
      in
      let caret = match S.editing () with
        | Some e when e.S.uuid = focus -> e.S.model.Edit_model.caret
        | _ -> 0
      in
      with_focus_after ~restore:(S.editing ()) focus caret
        (apply_indent_outdent ?parent_original uuids indent)

let move_up_down_tail = ref (Js.Promise.resolve ())

let move_blocks_up_down ?uuid up =
  let context = Runtime.repo (), Runtime.route () in
  let scope = S.interaction_scope () in
  let move () =
    if context <> (Runtime.repo (), Runtime.route ())
       || scope <> S.interaction_scope () then Js.Promise.resolve ()
    else
      let uuids =
        match uuid, S.editing () with
        | Some uuid, Some e when e.S.uuid = uuid -> [ uuid ]
        | Some _, _ -> []
        | None, _ -> selected_uuids ()
      in
      let uuids = List.filter (within_focused_root ~outdent:false) uuids in
      match uuids with
      | [] -> Js.Promise.resolve ()
      | uuids ->
          optimistic_edit (fun p ->
              let p' = Model.move_selected_top_blocks p uuids up in
              if p' == p then None else Some p');
          let* saves =
            match uuid with
            | Some uuid ->
                let* save = Ops.save_block_parsed uuid (live_buffer uuid) in
                Js.Promise.resolve [ save ]
            | None -> Js.Promise.resolve []
          in
          (* Selection is UUIDs plus container scope, not DOM rows: keep
             it intact across refresh, never reselect over a click/Escape. *)
          Ops.apply_and_refresh ~opts:(Ops.op_opts "move-blocks-up-down")
            (saves @ [ Ops.move_up_down uuids up ])
  in
  let pending =
    Js.Promise.then_ move !move_up_down_tail
    |> Js.Promise.catch (fun e ->
           Ui_services.log_error ("move blocks failed", e);
           Js.Promise.resolve ())
  in
  move_up_down_tail := pending

let selection_delete_pending = ref false

let action_context () =
  let model = Runtime.model () in
  model.Model.repo, model.Model.route, model.Model.context_revision

let delete_selected_uuids ~selected ~scope ~before uuids =
  let context = Runtime.model () in
  let owner = Ops.refresh_owner_for None in
  let current () =
    Ops.refresh_current ?owner context
    && scope = S.selection_scope () && selected == S.selected ()
  in
  match uuids with
  | [] -> ()
  | _ when !selection_delete_pending || not (current ()) -> ()
  | first :: _ ->
      selection_delete_pending := true;
      let prev =
        match S.prev_visible ~scope first with
        | Some p -> p.Model.block_uuid
        | None -> None
      in
      let p =
        let* previous =
          match Option.bind prev S.find with
          | Some b when not (List.mem (Option.get b.Model.block_uuid) uuids) ->
              let* buffer = Ops.title_for_edit (String.trim b.Model.block_title) in
              Js.Promise.resolve (Some (Option.get b.block_uuid, buffer))
          | _ -> Js.Promise.resolve None
        in
        let after =
          match previous with
          | Some (uuid, buffer) -> Wire.Map
              [ Wire.Keyword "block-uuid", Wire.Uuid uuid
              ; Wire.Keyword "scope", Wire.String scope
              ; Wire.Keyword "caret", Wire.Int (String.length buffer)
              ; Wire.Keyword "anchor", Wire.Nil ]
          | None -> Wire.Map
              [ Wire.Keyword "scope", Wire.String scope
              ; Wire.Keyword "selected-blocks", Wire.List []
              ; Wire.Keyword "selection-anchor", Wire.Nil ]
        in
        if not (current ()) then Js.Promise.resolve ()
        else
          let* response = Ops.apply_result ~current
              ~opts:(Ops.history_opts ~before ~after ()) [Ops.delete_blocks uuids] in
          match response with
          | None -> Js.Promise.resolve ()
          | Some _ when not (current ()) -> Js.Promise.resolve ()
          | Some _ ->
              let* () = Ops.refresh_via_delta ?owner response in
              let* () =
                match owner with
                | Some owner -> Ops.require_refresh_success owner
                | None -> Js.Promise.resolve ()
              in
              if current ()
              then (
                let editing = match previous, S.editing () with
                  | Some (uuid, buffer), None when S.find uuid <> None ->
                      Some (S.mk_editing ~uuid ~buffer ~scope ~base:buffer
                              ~caret:(String.length buffer) ())
                  | _, current -> current
                in
                S.set (fun st -> {st with S.editing = editing;
                   selected = S.String_set.empty; anchor = None; action_bar = false});
                match editing with
                | Some e -> request_focus e.S.uuid e.S.model.Edit_model.caret
                | None -> ());
              Js.Promise.resolve ()
      in
      ignore
        ((let* () = p in
          selection_delete_pending := false;
          Js.Promise.resolve ())
         |> Js.Promise.catch (fun error ->
              selection_delete_pending := false;
              Ui_services.log_error ("delete-selection failed", error);
              Js.Promise.resolve ()))

let delete_selection () =
  let snapshot = selected_snapshot () in
  if S.String_set.is_empty snapshot.unresolved then
    delete_selected_uuids ~selected:snapshot.selection ~scope:snapshot.scope
      ~before:(S.history_cursor ()) snapshot.uuids
  else Ui_services.log_error "selection entities unavailable"

(* ---- drag & drop ---- *)

let rec has_drag_source_parent sources uuid =
  match S.find_parent uuid with
  | Some (Some p, _) -> (
      match p.Model.block_uuid with
      | Some parent -> S.String_set.mem parent sources || has_drag_source_parent sources parent
      | None -> false)
  | _ -> false

let is_descendant uuid ancestor =
  has_drag_source_parent (S.String_set.singleton ancestor) uuid

let begin_block_drag ~scope src =
  if scope <> S.selection_scope () || not (S.String_set.mem src (S.selected ()))
  then select_single_in ~scope src

let dragged_block_uuids src =
  if S.String_set.mem src (S.selected ()) then
    let snapshot = selected_snapshot () in
    if S.String_set.is_empty snapshot.unresolved then
      List.filter_map (fun (b : Model.block) -> b.block_uuid) snapshot.roots
    else []
  else if S.find src <> None then [ src ] else []

let can_drop_dragged_block src tgt =
  let selected = S.selected () in
  let sources =
    if S.String_set.mem src selected then selected else S.String_set.singleton src
  in
  S.find src <> None && S.find tgt <> None
  && not (S.String_set.mem tgt sources || has_drag_source_parent sources tgt)

(* cljs dnd/move-blocks: :top -> first child of the target's parent (page
   when top-level); :nested -> first child of target; :sibling -> after
   target *)
let drop_dragged_block src tgt move_to =
  if not (can_drop_dragged_block src tgt) then ()
  else
    let sources = dragged_block_uuids src in
    if sources = [] then () else
    match move_to with
    | "top" -> (
        match Runtime.capture_reload_origin () with
        | None -> ()
        | Some origin ->
            let opts = Ops.current_history_opts (Wire.Map []) in
            ignore
              (let* parent =
                 Runtime.invoke2 "thread-api/get-block-parent"
                   (Wire.String origin.Runtime.reload_repo) (Wire.Uuid tgt)
               in
               (* A displayed root may belong to a sidebar page or zoom
                  block. Resolve its real parent without borrowing the
                  main page, and retire the drop if its origin changed. *)
               if not (Runtime.reload_origin_current origin) then
                 Js.Promise.resolve ()
               else
                 match Wire.map_get_uuid parent "block/uuid" with
                 | Some pu ->
                     Ops.apply_and_refresh ~opts [ Ops.move_blocks_top sources pu ]
                 | None -> Js.Promise.resolve ()))
    | "nested" ->
        ignore
          (Ops.apply_and_refresh [ Ops.move_blocks sources tgt ~sibling:false ])
    | _ ->
        ignore
          (Ops.apply_and_refresh [ Ops.move_blocks sources tgt ~sibling:true ])

(* ---- clipboard ---- *)

let rec has_selected_ancestor sel uuid =
  match S.find_parent uuid with
  | Some (Some p, _) -> (
      match p.Model.block_uuid with
      | Some pu -> S.String_set.mem pu sel || has_selected_ancestor sel pu
      | None -> false)
  | _ -> false

(* export-blocks-as-markdown shape: every title of every selected root
   tree, children flattened with two-space indentation *)
let export_titles blocks =
  let buf = Buffer.create 256 in
  let rec go depth (b : Model.block) =
    for _ = 1 to depth do
      Buffer.add_string buf "  "
    done;
    Buffer.add_string buf "- ";
    Buffer.add_string buf b.Model.block_title;
    Buffer.add_string buf "\n";
    List.iter (go (depth + 1)) b.Model.block_children
  in
  List.iter (go 0) blocks;
  Buffer.contents buf

let selected_copy_blocks ~plain snapshot =
  if S.String_set.is_empty snapshot.unresolved then
    Some (if plain then snapshot.blocks else snapshot.roots)
  else (
    Ui_services.log_error "selection entities unavailable";
    None)

let selection_text ~plain blocks =
  if plain then String.concat "\n" (List.map (fun b -> b.Model.block_title) blocks)
  else export_titles blocks

let remember_selection_copy ~plain blocks text =
  S.clipboard := (if plain then [] else blocks);
  S.clipboard_text := text

let copy_selection ev =
  match selected_copy_blocks ~plain:false (selected_snapshot ()) with
  | None | Some [] -> ()
  | Some blocks ->
      let text = selection_text ~plain:false blocks in
      ev.Ui_services.clipboard_set "text/plain" text;
      remember_selection_copy ~plain:false blocks text;
      ev.Ui_services.prevent_default ()

let write_clipboard_text ~current text on_written =
  let write = Ui_services.clipboard_write_text text in
  let task = Ui_task.bind write (fun () ->
      if not (current ()) then Ui_task.reject Ui_task.Cancelled
      else (on_written (); Ui_task.resolve ())) in
  ignore (Ui_task.catch task (fun error ->
      (match error with Ui_task.Cancelled -> ()
       | _ -> Ui_services.log_error ("clipboard write failed", error));
      Ui_task.reject error));
  task

let clipboard_action_epoch = ref 0
let cancel_clipboard_actions () = incr clipboard_action_epoch

let clipboard_action_current () =
  let context = action_context () and state = S.value () in
  let model = Runtime.model () and owner = Ops.refresh_owner_for None in
  let generation = !(Runtime.load_gen) and epoch = !clipboard_action_epoch in
  fun () -> context = action_context () && generation = !(Runtime.load_gen)
            && Ops.refresh_current ?owner model
            && epoch = !clipboard_action_epoch && S.ready () && S.value () == state

let cut_editing_text uuid =
  match S.editing () with
  | Some editing when editing.S.uuid = uuid && Option.is_some !S.active_frame ->
      let lo,hi = sel_span_of editing.S.model in
      if lo = hi then Ui_task.resolve ()
      else
        let current = clipboard_action_current () in
        let frame = !S.active_frame in
        let epoch = !(editing.S.epoch) in
        let fresh () = current () &&
          (match frame, !S.active_frame with
           | Some original, Some live -> original == live
           | _ -> false) &&
          match S.editing () with
          | Some live -> live.S.uuid = uuid && live.S.epoch == editing.S.epoch
              && !(live.S.epoch) = epoch && live.S.model == editing.S.model
              && live.S.buffer = editing.S.buffer && sel_span_of live.S.model = (lo,hi)
          | None -> false in
        write_clipboard_text ~current:fresh
          (String.sub editing.S.buffer lo (hi-lo)) (fun () ->
            splice_range uuid lo hi "";
            Outliner_ops.schedule_save uuid (live_buffer uuid))
  | _ -> Ui_task.reject Ui_task.Cancelled

let write_selection_copy ~plain ~cut =
  let snapshot = selected_snapshot () in
  let before = S.history_cursor () in
  let current = clipboard_action_current () in
  match selected_copy_blocks ~plain snapshot with
  | None | Some [] -> ()
  | Some blocks ->
      let text = selection_text ~plain blocks in
      ignore (write_clipboard_text ~current:(fun () -> current () &&
          List.for_all (fun block ->
            match block.Model.block_uuid with
            | Some uuid -> (match S.find uuid with Some live -> live == block | None -> false)
            | None -> false) snapshot.blocks) text (fun () ->
          remember_selection_copy ~plain blocks text;
          if cut then
            delete_selected_uuids ~selected:snapshot.selection ~scope:snapshot.scope
              ~before snapshot.uuids))

let cut_block_text uuid =
  match S.find uuid with
  | None -> ()
  | Some block ->
      let current = clipboard_action_current () in
      ignore (write_clipboard_text ~current:(fun () -> current () &&
          match S.find uuid with Some live -> live == block | None -> false)
        block.Model.block_title (fun () ->
          ignore (Ops.apply_and_refresh [ Ops.delete_blocks [ uuid ] ])))

let copy_selection_text ?(plain = false) () = write_selection_copy ~plain ~cut:false
let cut_selection_text () = write_selection_copy ~plain:false ~cut:true
let cut_selection ev =
  ev.Ui_services.prevent_default ();
  cut_selection_text ()

(* ---- external paste (handler.paste.cljs/paste-copied-text) ----

   text/html runs through the html->markdown port (Html_to_md, the DOM
   equivalent of extensions/html-parser); the resulting text wins over
   plain text. A bare pasted url wraps into {{video}}/{{twitter}}.
   Block-structured text extracts into blocks worker-side; text split
   by blank lines becomes one block per paragraph; anything else is a
   plain text insert. *)

let is_url s =
  let t = String.trim s in
  Str_util.starts_with t "http://" || Str_util.starts_with t "https://"

(* extensions/video.cljs's host set — the regexes also pin the path
   shape, but for macro-wrapping a url the host check is what matters *)
let is_video_url url =
  let s = String.lowercase_ascii (String.trim url) in
  let host =
    let s =
      if Str_util.starts_with s "http://" then String.sub s 7 (String.length s - 7)
      else if Str_util.starts_with s "https://" then
        String.sub s 8 (String.length s - 8)
      else s
    in
    match String.index_opt s '/' with
    | Some i -> String.sub s 0 i
    | None -> s
  in
  let host =
    List.fold_left
      (fun h p -> if Str_util.starts_with h p then String.sub h (String.length p) (String.length h - String.length p) else h)
      host [ "www."; "m."; "player." ]
  in
  List.mem host
    [ "youtube.com"; "youtu.be"; "y2u.be"; "youtube-nocookie.com"
    ; "bilibili.com"; "vimeo.com" ]

let wrap_macro_url url =
  if is_video_url url then Some ("{{video " ^ url ^ "}}")
  else if Str_util.starts_with url "https://twitter.com" || Str_util.starts_with url "https://x.com"
  then Some ("{{twitter " ^ url ^ "}}")
  else None

(* cljs markdown-blocks?: "(^|\n)\s*(?:[-+*]|#+)\s+", a ``` fence line,
   or a $$ line makes the clipboard block-structured *)
let markdown_blocks text =
  let marker t =
    match String.length t with
    | 0 -> false
    | n -> (
        match t.[0] with
        | '-' | '+' | '*' -> n >= 2 && (t.[1] = ' ' || t.[1] = '\t')
        | '#' ->
            let hashes i = i < n && t.[i] = '#' in
            let rec count i = if hashes i then count (i + 1) else i in
            let h = count 0 in
            h >= 1 && h < n && (t.[h] = ' ' || t.[h] = '\t')
        | _ -> false)
  in
  String.split_on_char '\n' text
  |> List.exists (fun l ->
      let t = ltrim l in
      marker t || Str_util.starts_with t "```" || t = "$$")

let contains_sub hay needle =
  let n = String.length hay and m = String.length needle in
  if m = 0 then true
  else
    let rec go i = i + m <= n && (String.sub hay i m = needle || go (i + 1)) in
    go 0

(* "(?:\r?\n){2,}" — a blank-line run separates pasted paragraphs *)
let has_paragraph_break text = contains_sub text "\n\n"

(* paste-segmented-text — one "- " block per paragraph *)
let segmented_markdown text =
  let acc, last =
    List.fold_left
      (fun (acc, cur) l ->
        if String.trim l = "" then
          (match cur with
           | [] -> (acc, [])
           | _ -> (List.rev cur :: acc, []))
        else (acc, l :: cur))
      ([], [])
      (String.split_on_char '\n' text)
  in
  let paragraphs =
    List.rev (match last with [] -> acc | _ -> List.rev last :: acc)
  in
  paragraphs
  |> List.filter_map (fun p ->
      let p = String.trim (String.concat "\n" p) in
      if p = "" then None
      else
        let t = ltrim p in
        if
          Str_util.starts_with t "-" && String.length t >= 2
          && (t.[1] = ' ' || t.[1] = '\t')
        then Some p
        else Some ("- " ^ p))
  |> String.concat "\n"

(* the paste payload: html-converted markdown when it yields text, else
   a macro-wrapped url, else the plain text *)
let paste_source_text ~text ~html =
  (* cljs string/replace "\r\n" "\n" for Windows clipboards *)
  let text = String.concat "" (String.split_on_char '\r' text) in
  let html_md =
    match String.trim html with
    | "" -> None
    | _ -> (try Html_to_md.convert html with _ -> None)
  in
  match html_md with
  | Some s when String.trim s <> "" -> s
  | _ -> (
      if is_url text then
        match wrap_macro_url text with
        | Some m -> m
        | None -> text
      else text)

(* cljs edit-last-block-after-inserted! — after a paste, editing moves to
   the last inserted block so sequential pastes append in order *)
let edit_last_inserted ?scope resp =
  match Ops.last_inserted_uuid resp with
  | Some u -> enter_edit ?scope u (String.length (model_title u))
  | None -> ()

let paste_session_current () =
  let editing = S.editing () in
  let selection = S.history_cursor () in
  fun () ->
    match editing, S.editing () with
    | Some before, Some current -> before.S.epoch == current.S.epoch
    | None, None -> S.history_cursor () = selection
    | _ -> false

let paste_context_current () =
  let context = action_context () in
  let generation = !Runtime.load_gen in
  let session_current = paste_session_current () in
  fun () ->
    context = action_context () && generation = !Runtime.load_gen && session_current ()

let paste_clipboard_text uuid =
  match edit_model uuid with
  | None -> Ui_task.resolve ()
  | Some _ ->
      let current = paste_context_current () in
      Ui_task.bind (Ui_services.clipboard_read_text ()) (fun text ->
          (if current () then
             match edit_model uuid with
             | Some m ->
                 let lo, hi = sel_span_of m in
                 splice_range uuid lo hi text;
                 Ops.schedule_save uuid (live_buffer uuid)
             | None -> ());
          Ui_task.resolve ())

let paste_focus () =
  let context = Runtime.repo (), Runtime.route () in
  let session_current = paste_session_current () in
  let scope = match S.editing () with Some e -> e.S.scope | None -> S.selection_scope () in
  fun resp ->
    if context = (Runtime.repo (), Runtime.route ()) && session_current ()
    then edit_last_inserted ~scope resp

let paste_history_opts target_uuid =
  let scope = match S.editing () with
    | Some e -> e.S.scope
    | None -> scope_of_uuid target_uuid in
  let after = Wire.Map
      [ Wire.Keyword "block-uuid", Wire.Keyword "last-inserted-block"
      ; Wire.Keyword "scope", Wire.String scope
      ; Wire.Keyword "caret", Wire.Keyword "end" ] in
  Ops.history_opts ~opts:(Ops.op_opts "paste") ~before:(S.history_cursor ()) ~after ()

let paste_trees trees target_uuid ~replace_empty =
  Ops.apply_and_refresh_result ~opts:(paste_history_opts target_uuid)
    [ Ops.paste_trees trees target_uuid ~replace_empty ]

(* thread-api/paste-extract-blocks + insert-blocks — the worker turns
   markdown clipboard text into preorder block maps which insert-blocks
   places after [uuid] (cljs keep-uuid? + :outliner-real-op
   :paste-text under :outliner-op :paste) *)
let paste_markdown_blocks uuid text ~replace_empty ~sibling =
  let current = paste_context_current () in
  let repo = Runtime.repo () in
  let focus = paste_focus () in
  let opts = paste_history_opts uuid in
  let* w =
    Runtime.invoke3 "thread-api/paste-extract-blocks"
      (Wire.String repo)
      (Wire.String text)
      (Wire.String uuid)
  in
  if not (current ()) then Js.Promise.resolve () else
  match w with
  | Wire.Array (_ :: _ as maps) -> (
      let* resp =
        Ops.apply_and_refresh_result ~opts
          [ Ops.op "insert-blocks"
              [ Wire.Array maps
              ; Wire.Uuid uuid
              ; Wire.Map
                  [ Ops.kw "sibling?" (Wire.Bool sibling)
                  ; Ops.kw "keep-uuid?" (Wire.Bool true)
                  ; Ops.kw "replace-empty-target?"
                      (Wire.Bool replace_empty)
                  ; Ops.kw "outliner-op" (Wire.Keyword "paste")
                  ; Ops.kw "outliner-real-op"
                      (Wire.Keyword "paste-text") ] ] ]
      in
      (* replace-empty swaps the editing block's entity in place — resync
         the live buffer first so edit_last_inserted's save_if_dirty
         can't commit the stale "" over the pasted title *)
      let* () =
        if replace_empty then Ops.resync_open_editor ()
        else Js.Promise.resolve ()
      in
      focus resp;
      Js.Promise.resolve ())
  | _ -> Js.Promise.resolve ()

let paste_lines lines =
  let library = library_context () in
  let target = match selected_uuids () with
  | [] -> (
      (* nothing selected: append at page end *)
      match (Runtime.model ()).Model.route_page with
      | Some p -> (
          match p.Model.page_uuid with
          | None -> None
          | Some pu -> (
              match List.rev (S.page_blocks ()) with
              | last :: _ -> (
                  match last.Model.block_uuid with
                  | Some u -> Some (u, true)
                  | None -> None)
              | [] -> Some (pu, false)))
      | None -> None)
  | sel ->
      Some (List.nth sel (List.length sel - 1), true) in
  match target with
  | None -> ()
  | Some (uuid, sibling) ->
      let context = Runtime.repo (), Runtime.route () in
      ignore
        (let* blocks = Js.Promise.all (Array.of_list
           (List.map (fun title -> Ops.block_map_parsed ~page:library
               (Ui_services.env_random_uuid ()) (String.trim title)) lines)) in
         if context = (Runtime.repo (), Runtime.route ()) then
           Ops.apply_and_refresh [ Ops.insert_blocks (Array.to_list blocks) uuid ~sibling ]
         else Js.Promise.resolve ())

(* splice external clipboard text into the live model at the selection,
   repainting the surface and scheduling the debounced save like a
   typed edit *)
let splice_clipboard_text uuid text =
  match edit_model uuid with
  | Some m ->
      let lo, hi = sel_span_of m in
      update_model uuid (fun _ -> Edit_model.splice m lo hi text);
      Ops.schedule_save uuid (live_buffer uuid)
  | None -> ()

(* in-editor paste: when the event text matches what our copy/cut wrote,
   paste the stored trees (cljs internal paste); otherwise the external
   branch — html→markdown wins over plain text, block-shaped text
   extracts into blocks, blank-line text into one block per paragraph,
   and anything else splices at the cursor *)
let paste_into_editor ~clipboard:(trees, copied_text) ev =
  let clip_text = ev.Ui_services.clipboard_get "text/plain" in
  let clip_html = ev.Ui_services.clipboard_get "text/html" in
  match (S.editing (), trees) with
  | Some e, _ when S.is_draft e ->
      ev.Ui_services.prevent_default ();
      ev.Ui_services.stop_immediate ();
      let text = paste_source_text ~text:clip_text ~html:clip_html in
      if not (trees <> [] && clip_text = copied_text)
         && not (markdown_blocks text || has_paragraph_break text) then
        splice_clipboard_text e.uuid text
  | Some e, (_ :: _ as trees) when clip_text = copied_text -> (
      match S.find e.uuid with
      | Some b ->
          ev.Ui_services.prevent_default ();
          (* keep the conduit's own paste listener from splicing the
             text a second time *)
          ev.Ui_services.stop_immediate ();
          let replace_empty =
            String.trim b.Model.block_title = ""
            && String.trim e.S.buffer = ""
          in
          let focus = paste_focus () in
          ignore
            (let* resp = paste_trees trees e.uuid ~replace_empty in
            (* replace-empty swaps the editing block's entity
                      in place (same uuid, new title) — resync the live
                      model buffer first, else edit_last_inserted's
                      save_if_dirty reads the stale "" and commits it
                      over the pasted title *)
            let* () =
              (if replace_empty then Ops.resync_open_editor ()
               else Js.Promise.resolve ())
            in
            focus resp;
            Js.Promise.resolve ())
      | None -> ())
  | Some e, _ ->
      (* external paste while editing (no stored trees, or the event
         text differs from what our copy wrote) *)
      let text = paste_source_text ~text:clip_text ~html:clip_html in
      if String.trim text <> "" then (
        ev.Ui_services.prevent_default ();
        ev.Ui_services.stop_immediate ();
        let text =
          if markdown_blocks text then text
          else if has_paragraph_break text then
            segmented_markdown text
          else text
        in
        if markdown_blocks text then
          let replace_empty =
            String.trim e.S.buffer = ""
            &&
            match S.find e.uuid with
            | Some b -> String.trim b.Model.block_title = ""
            | None -> false
          in
          ignore
            (paste_markdown_blocks e.uuid text ~replace_empty
               ~sibling:true)
        else splice_clipboard_text e.uuid text)
  | None, _ -> ()

(* text or html → the extracted-block paste path when the clipboard is
   block-shaped, else the flat per-line insert *)
let paste_external ev ~text ~html =
  let text = paste_source_text ~text ~html in
  if markdown_blocks text || has_paragraph_break text then (
    let text =
      if markdown_blocks text then text else segmented_markdown text
    in
    ev.Ui_services.prevent_default ();
    match selected_uuids () with
    | _ :: _ as sel ->
        ignore
          (paste_markdown_blocks
             (List.nth sel (List.length sel - 1))
             text ~replace_empty:false ~sibling:true)
    | [] -> (
        (* nothing selected: append at page end *)
        match (Runtime.model ()).Model.route_page with
        | Some p -> (
            match List.rev (S.page_blocks ()) with
            | last :: _ -> (
                match last.Model.block_uuid with
                | Some u ->
                    ignore
                      (paste_markdown_blocks u text ~replace_empty:false
                         ~sibling:true)
                | None -> ())
            | [] -> (
                match p.Model.page_uuid with
                | Some pu ->
                    ignore
                      (paste_markdown_blocks pu text ~replace_empty:false
                         ~sibling:false)
                | None -> ()))
        | None -> ()))
  else
    let lines =
      String.split_on_char '\n' text
      |> List.filter (fun l -> String.trim l <> "")
    in
    match lines with
    | [] -> ()
    | _ ->
        ev.Ui_services.prevent_default ();
        paste_lines lines

let paste_blocks ~clipboard:((trees, copied_text) as clipboard) ev =
  match S.editing () with
  | Some _ -> paste_into_editor ~clipboard ev
  | None -> (
      match trees with
      | _ :: _ when ev.Ui_services.clipboard_get "text/plain" = copied_text -> (
          ev.Ui_services.prevent_default ();
          match selected_uuids () with
          | _ :: _ as sel ->
              let focus = paste_focus () in
              ignore
                (let* resp =
                  paste_trees trees
                    (List.nth sel (List.length sel - 1))
                    ~replace_empty:false
                in
                focus resp;
                Js.Promise.resolve ())
          | [] -> ())
      | _ ->
          paste_external ev
            ~text:(ev.Ui_services.clipboard_get "text/plain")
            ~html:(ev.Ui_services.clipboard_get "text/html"))

(* ---- misc ---- *)

let toggle_collapse ?(scope = "main") uuid =
  match S.find uuid with
  | Some b when S.children_of b <> [] ->
      if b.Model.block_default_collapsed
         && not (S.is_collapsed_in ~scope uuid)
      then
        (* view-default collapse (page child on a non-Library page): a
           click expands it locally without persisting — cljs
           temp-collapsed? takes precedence over the default *)
        S.set (fun st ->
            { st with
              S.expanded_ui =
                S.String_set.add (S.collapse_key scope uuid)
                  st.S.expanded_ui
            })
      else
        let now = not (S.effective_collapsed ~scope b) in
        S.set_collapsed ~scope uuid now;
        if not (Ui_services.env_publishing ()) then
          ignore (Ops.apply [ Ops.collapse_expand [ (uuid, now) ] ])
  | _ -> ()

let set_collapsed ?(scope = "main") uuid collapsed =
  match S.find uuid with
  | Some b when S.children_of b <> [] ->
      S.set_collapsed ~scope uuid collapsed;
      if not (Ui_services.env_publishing ()) then
        ignore (Ops.apply [ Ops.collapse_expand [ (uuid, collapsed) ] ])
  | _ -> ()

(* cljs editor/expand! / collapse!: edit mode toggles the open block,
   selection toggles every selected block, and with neither it moves one
   outline level (expand = shallowest collapsed level, collapse =
   deepest expandable level) *)
let collapse_expand ~collapse () =
  let set u want =
    match S.find u with
    | Some b
      when S.children_of b <> [] && S.effective_collapsed b <> want ->
        toggle_collapse u
    | _ -> ()
  in
  match S.editing_uuid () with
  | Some u -> set u collapse
  | None -> (
      match selected_uuids () with
      | _ :: _ as us -> List.iter (fun u -> set u collapse) us
      | [] ->
          let blocks = S.flat_all () in
          let lvl (b : Model.block) = b.Model.block_level in
          if collapse then (
            let deepest =
              List.fold_left
                (fun acc b ->
                  if S.children_of b <> [] && not (S.effective_collapsed b)
                  then max acc (lvl b)
                  else acc)
                0 blocks
            in
            List.iter
              (fun (b : Model.block) ->
                if lvl b = deepest && S.children_of b <> []
                   && not (S.effective_collapsed b)
                then
                  match b.Model.block_uuid with
                  | Some u -> toggle_collapse u
                  | None -> ())
              blocks)
          else
            let shallowest =
              List.fold_left
                (fun acc b ->
                  if S.effective_collapsed b then min acc (lvl b)
                  else acc)
                max_int blocks
            in
            List.iter
              (fun (b : Model.block) ->
                if lvl b = shallowest && S.effective_collapsed b then
                  match b.Model.block_uuid with
                  | Some u -> toggle_collapse u
                  | None -> ())
              blocks)

(* cljs editor/toggle-collapse!: edit mode toggles the open block,
   selection toggles all selected by the first block's state, otherwise
   no-op *)
let toggle_children_collapse () =
  let cur =
    match S.editing_uuid () with
    | Some u -> [ u ]
    | None -> selected_uuids ()
  in
  match cur with
  | u :: us -> (
      match S.find u with
      | Some b ->
          let want = not (S.effective_collapsed b) in
          List.iter
            (fun u ->
              match S.find u with
              | Some b
                when S.children_of b <> []
                     && S.effective_collapsed b <> want ->
                  toggle_collapse u
              | _ -> ())
            (u :: us)
      | None -> ())
  | [] -> ()

(* cljs editor/toggle-open-blocks: any collapsed block -> expand all,
   else collapse all collapsible blocks *)
let toggle_open_blocks () =
  let expandable =
    List.filter
      (fun (b : Model.block) ->
        S.children_of b <> [] || S.effective_collapsed b)
      (S.flat_all ())
  in
  let collapsed = not (List.exists S.effective_collapsed expandable) in
  let pairs =
    List.filter_map
      (fun (b : Model.block) ->
        match b.Model.block_uuid with
        | Some u when S.effective_collapsed b <> collapsed ->
            Some (u, collapsed)
        | _ -> None)
      expandable
  in
  S.set (fun st ->
      { st with
        S.collapsed =
          (if collapsed then
             List.fold_left
               (fun acc (u, _) -> S.String_set.add u acc)
               st.S.collapsed pairs
           else S.String_set.empty)
      ; S.expanded = S.String_set.empty
      });
  if pairs <> [] then ignore (Ops.apply [ Ops.collapse_expand pairs ])

let restore_history result =
  let context = action_context () in
  let editing = S.editing () in
  let current () = context = action_context ()
      && (match editing, S.editing () with
          | None, None -> true
          | Some before, Some now -> before.S.uuid = now.S.uuid
              && before.S.scope = now.S.scope && before.S.model == now.S.model
          | _ -> false) in
  let cursors = match Wire.map_get result "editor-cursors" with
    | Some (Wire.List xs) | Some (Wire.Array xs) -> xs
    | _ -> [] in
  let undo = Wire.map_get result "undo?" = Some (Wire.Bool true) in
  match (if undo then cursors else List.rev cursors) with
  | [] -> Ops.resync_open_editor ~force:true ()
  | cursor :: _ ->
      S.history_input_before := None;
      S.click_point := None;
      (match Wire.map_get_uuid cursor "block-uuid" with
       | Some uuid ->
           let scope = Option.get (Wire.map_get_string cursor "scope") in
           let* title = Ops.title_for_edit (model_title uuid) in
           if not (current ()) then Js.Promise.resolve () else
           let caret = match Wire.map_get cursor "caret" with
             | Some (Wire.Int caret) -> caret
             | Some (Wire.Keyword "end") -> String.length title
             | _ -> invalid_arg "history caret must be an offset or end" in
           let submit_on_enter = match S.editing () with
             | Some e when e.S.uuid = uuid && e.S.scope = scope -> e.S.submit_on_enter
             | _ -> false in
           let e = S.mk_editing ~caret ~submit_on_enter ~uuid ~buffer:title ~scope ~base:title () in
           let e = match Wire.map_get cursor "anchor" with
             | Some (Wire.Int anchor) ->
                 S.with_model e (Edit_model.select e.S.model ~anchor ~focus:caret)
             | _ -> e in
           S.set (fun st -> { st with S.editing = Some e;
             S.selected = S.String_set.empty; anchor = None; action_bar = false });
           request_focus uuid caret;
           Js.Promise.resolve ()
       | None ->
           let selected = match Wire.map_get cursor "selected-blocks" with
             | Some (Wire.List xs) ->
                 List.fold_left (fun acc -> function
                   | Wire.Uuid u -> S.String_set.add u acc
                   | _ -> invalid_arg "history selection must contain UUIDs") S.String_set.empty xs
             | _ -> invalid_arg "history cursor must contain editing or selection state" in
           let anchor = Wire.map_get_uuid cursor "selection-anchor" in
           let selection_scope = Option.get (Wire.map_get_string cursor "scope") in
           S.set (fun st -> { st with S.editing = None; selected; anchor;
             selection_scope; action_bar = false });
           Js.Promise.resolve ())

let () = S.restore_history := restore_history

let history_owner : Ops.refresh_owner option ref = ref None

let run_history operation =
  let context = Runtime.model () in
  let owner =
    match !history_owner with
    | Some owner when Ops.refresh_current ~owner context -> Some owner
    | _ ->
        let owner = Ops.refresh_owner_for None in
        history_owner := owner;
        owner
  in
  let rec run () =
    if not (Ops.refresh_current ?owner context) then ()
    else if !S.structure_pending then
      S.enqueue_edit_action ~real:true run
    else begin
      Option.iter (fun owner -> owner.Ops.outcome <- None) owner;
      run_structure ~restore:(S.editing ()) (operation ?owner ()) (fun () -> ())
    end
  in
  run ()

let undo () = run_history Ops.undo
let redo () = run_history Ops.redo

(* the Edit_input route for the open editor — structural intents go to
   the outliner ops; focused/menu have no surface effect yet *)
let route_of uuid : Edit_input.route =
  let draft () = match S.editing () with
    | Some e when e.S.uuid = uuid && S.is_draft e -> Some e
    | _ -> None in
  let submit_on_enter () = match S.editing () with
    | Some e when e.S.uuid = uuid -> e.S.submit_on_enter
    | _ -> false in
  { Edit_input.split_block = (fun () ->
      if Option.is_some (draft ()) then submit_draft uuid
      else if submit_on_enter () then exit_edit ~select:false else split_at_cursor uuid)
  ; merge_prev = (fun () -> if Option.is_none (draft ()) then merge_prev uuid)
  ; indent = (fun () -> if Option.is_none (draft ()) then indent_or_outdent ~indent:true)
  ; outdent = (fun () -> if Option.is_none (draft ()) then indent_or_outdent ~indent:false)
  ; cancel = (fun () -> match draft () with
      | Some e -> dismiss_draft e
      | None -> exit_edit ~select:(not (submit_on_enter ())))
  ; focused =
      (fun b ->
        S.focused_block := (if b then Some uuid else None))
  ; menu = (fun _ -> ())
  }

let conduit_of uuid =
  Option.value (Editor_sink.conduit uuid) ~default:Edit_input.no_conduit

(* fold freshly measured visual lines back into the model (line_bounds,
   first/last_line feed keys and Del_line deletes); empty measurement
   keeps the '\n' table *)
(* Browser line edges omit wrapped spaces and newline separators. Accept
   those gaps, but reject missing text or incomplete/stale measurements. *)
let measured_partitions source rs =
  let len = String.length source in
  let rec whitespace a b =
    a = b || (a < b && List.mem source.[a] [ ' '; '\n'; '\t'; '\r' ] && whitespace (a + 1) b)
  in
  match rs with
  | [] -> false
  | (lo, _) :: _ when lo <> 0 -> false
  | _ ->
      let rec go exp = function
        | [] -> exp = len
        | (a, b) :: tl -> a >= exp && b >= a && b <= len
            && whitespace exp a && go b tl
      in
      go 0 rs

let refresh_lines m (conduit : Edit_input.conduit) =
  if Edit_model.composing m then m else
  match conduit.line_ranges () with
  | rs when measured_partitions m.Edit_model.source rs ->
      Edit_model.set_lines m rs
  | _ -> m

(* wrap the model selection with a markdown marker pair *)
let wrap_selection uuid marker =
  match edit_model uuid with
  | Some m ->
      let s, e = sel_span_of m in
      let ml = String.length marker in
      update_model uuid (fun _ ->
          let inner = String.sub m.Edit_model.source s (e - s) in
          let m' =
            Edit_model.splice m s e (marker ^ inner ^ marker)
          in
          Edit_model.select m' ~anchor:(s + ml) ~focus:(e + ml))
  | None -> ()

(* arrow up/down inside editor -> move edit focus to neighbor block *)
(* ArrowUp past the first block lands in the page title — cljs
   move-cross-boundary-up-down treats .ls-page-title as a block *)
let focus_page_title () =
  (* cljs journal titles aren't editable (protected attrs — a save tx
     throws journal-page-protected-attr-updated) *)
  let journal_title =
    match Runtime.route () with
    | Model.Journals | Model.Home -> true
    | _ -> (
        match (Runtime.model ()).Model.route_page with
        | Some p -> p.Model.page_journal_day <> None
        | None -> false)
  in
  match journal_title, Ui_services.dom_query ".ls-page-title" with
  | true, _ | _, None -> ()
  | false, Some _ -> (
      Runtime.send Action.Title_edit_start;
      Runtime.flush ();
      match (Runtime.model ()).Model.route_page with
      | Some p -> (
          match p.Model.page_uuid with
          | Some u -> Editor_sink.focus_input u
          | None -> ())
      | None -> ())

let arrow_nav uuid up =
  let scope =
    match S.editing () with Some e -> e.scope | None -> "main"
  in
  let nb =
    (if up
     then S.prev_visible ~scope
     else S.next_visible ~scope)
      uuid
  in
  match nb with
  | Some b -> (
      match b.Model.block_uuid with
      | Some nu ->
          save_if_dirty uuid;
          enter_edit ~scope nu (caret_of uuid)
      | None -> ())
  | None -> if up && scope = "main" then (exit_edit ~select:false; focus_page_title ())

(* ArrowLeft/Right at a collapsed buffer edge crosses into the adjacent
   block — master keeps one logical caret across block boundaries:
   left at the buffer start lands at the previous block's end, right
   at the buffer end lands at the next block's start *)
let arrow_edge uuid up =
  let scope =
    match S.editing () with Some e -> e.scope | None -> "main"
  in
  let nb =
    (if up then S.prev_visible ~scope else S.next_visible ~scope) uuid
  in
  match nb with
  | Some b -> (
      match b.Model.block_uuid with
      | Some nu ->
          save_if_dirty uuid;
          if up then
            ignore
              (let* buffer =
                 Ops.title_on_entry nu (display_title nu)
               in
               enter_edit ~scope nu (String.length buffer);
               Js.Promise.resolve ())
          else enter_edit ~scope nu 0
      | None -> ())
  | None -> ()

(* The add-button's owner can be a page or a zoomed block in any scope. *)
let append_block ?for_page ?(scope = "main") ?(library = false) () =
  let owner =
    match for_page with
    | Some uuid -> Some (uuid, library)
    | None ->
        Option.bind (Runtime.model ()).Model.route_page (fun p ->
            Option.map (fun uuid -> (uuid, p.Model.page_is_library))
              p.Model.page_uuid)
  in
  match owner with
  | None -> ()
  | Some (puuid, library) ->
      let new_uuid = Ui_services.env_random_uuid () in
      let stage st =
        { st with
          S.editing =
            Some (S.mk_editing ~uuid:new_uuid ~buffer:"" ~scope ~base:"" ())
        ; selection_scope = scope
        ; selected = S.String_set.empty
        ; anchor = None
        ; action_bar = false
        }
      in
      (* Empty pages initialize editor state when their first row mounts. *)
      let restore = S.editing () in
      flush_edit ();
      if S.ready () then S.set stage
      else S.defer_init stage;
      with_focus_after ~restore new_uuid 0
        (Ops.apply_and_refresh
           [ Ops.insert_blocks ~bottom:true
               [ Ops.block_map ~title:"" ~page:library new_uuid ]
               puuid ~sibling:false
           ])

(* ---------- quick add (Meta+e, components/quick_add.cljs) ---------- *)

let quick_add_page_title = "Quick add"

let fetch_qa_blocks repo puuid =
  let* w =
    Runtime.invoke3 "thread-api/get-page-blocks-tree" (Wire.String repo)
      (Wire.Uuid puuid) Wire.Nil
  in
  Js.Promise.resolve (Decode.blocks_of_wire w)

(* dialog mounted + blocks loaded: open the last block for editing *)
let quick_add_open_dialog puuid blocks =
  Quick_add_state.set (fun _ ->
      { Quick_add_state.page_uuid = Some puuid; blocks });
  Dialogs_state.open_ "quick-add";
  match List.rev blocks with
  | last :: _ -> (
      match last.Model.block_uuid with
      | Some u ->
          let caret = String.length (String.trim last.Model.block_title) in
          if S.ready () then enter_edit ~scope:"quick-add" u caret
          else (
            S.defer_init (fun st ->
                { st with
                  S.editing =
                    Some
                      (S.mk_editing ~uuid:u
                         ~buffer:(String.trim last.Model.block_title)
                         ~scope:"quick-add"
                         ~base:(String.trim last.Model.block_title) ())
                });
            request_focus u caret)
      | None -> ())
  | [] -> ()

(* cljs show-quick-add: ensure an empty block exists on the "Quick add"
   page, then open the dialog *)
let open_quick_add () =
  match (Runtime.model ()).Model.repo with
  | None -> ()
  | Some repo ->
      ignore
        (let* page_w =
          Runtime.invoke2 "thread-api/get-case-page" (Wire.String repo)
            (Wire.String quick_add_page_title)
        in
        match Decode.page_of_summary page_w with
        | None -> Js.Promise.resolve ()
        | Some page -> (
            match page.Model.page_uuid with
            | None -> Js.Promise.resolve ()
            | Some puuid ->
                (let* blocks = fetch_qa_blocks repo puuid in
                match blocks with
                | _ :: _ ->
                    quick_add_open_dialog puuid blocks;
                    Js.Promise.resolve ()
                | [] ->
                    let nu = Ui_services.env_random_uuid () in
                    let* () =
                      Ops.apply
                        ~opts:(Ops.op_opts "insert-blocks")
                        [ Ops.insert_blocks
                            [ Ops.block_map ~title:"" nu ]
                            puuid ~sibling:false ]
                    in
                    let* blocks = fetch_qa_blocks repo puuid in
                    quick_add_open_dialog
                      puuid blocks;
                    Js.Promise.resolve ())))

(* move every "Quick add" child to the end of today's journal *)
let move_qa_blocks_to_today repo uuids =
  let day = Dates.today_journal_day () in
  let* page_w =
    Runtime.invoke2 "thread-api/get-journal-page-by-day" (Wire.String repo)
      (Wire.Int day)
  in
  let* tuuid_opt =
    match Decode.page_of_summary page_w with
    | Some p -> (
        match p.Model.page_uuid with
        | Some tuuid -> Js.Promise.resolve (Some tuuid)
        | None -> Js.Promise.resolve None)
    | None -> Js.Promise.resolve None
  in
  match tuuid_opt with
  | None -> Js.Promise.resolve ()
  | Some tuuid ->
      let* today_blocks = fetch_qa_blocks repo tuuid in
      let last_uuid =
        match List.rev today_blocks with
        | b :: _ -> b.Model.block_uuid
        | [] -> None
      in
      let move_op =
        match last_uuid with
        | Some l -> Ops.move_blocks uuids l ~sibling:true
        | None -> Ops.move_blocks uuids tuuid ~sibling:false
      in
      let* () = Ops.apply_and_refresh [ move_op ] in
      Dialogs_state.close_named "quick-add";
      Quick_add_state.reset ();
      Toast.success
        (I18n.t "journal/add-blocks-to-today-success");
      Js.Promise.resolve ()

(* cljs quick-add-blocks!: save the live edit, then move everything *)
let quick_add_blocks_to_today () =
  match (Runtime.model ()).Model.repo with
  | None -> ()
  | Some repo ->
      blur_commit ();
      let uuids =
        List.filter_map
          (fun b -> b.Model.block_uuid)
          (Quick_add_state.value ()).Quick_add_state.blocks
      in
      match uuids with
      | [] ->
          Dialogs_state.close_named "quick-add";
          Quick_add_state.reset ()
      | _ -> ignore (move_qa_blocks_to_today repo uuids)

let quick_add () =
  if Dialogs_state.ready () && Dialogs_state.is_open "quick-add" then
    quick_add_blocks_to_today ()
  else open_quick_add ()

(* Meta+Shift+. zoom: cljs keeps the zoomed block in edit mode across the
   redirect (state/set-editing-block-id! before redirect-to-page!) *)
let pending_zoom : string option ref = ref None

let zoom_container uuid = "zoom-" ^ uuid

let zoom_to uuid =
  (* cljs keeps the zoomed block in edit mode only when the zoom was
     invoked while that block was being edited (zoom-in!'s editing?
     branch); a plain bullet click never re-enters the editor *)
  pending_zoom :=
    (match S.editing () with
     | Some e when e.uuid = uuid -> Some uuid
     | _ -> None);
  (* the zoomed block is the zoom container's root — it expands there
     while its page-level collapse stays *)
  S.expand_root ~scope:(zoom_container uuid) uuid;
  (* cljs zoom-in! routes to /page/<block-uuid> — the page route renders
     route-block for block entities *)
  Ui_services.nav_set_hash (Runtime.nav_hash ("#/page/" ^ uuid))

let consume_pending_zoom () =
  let z = !pending_zoom in
  pending_zoom := None;
  z

(* cljs editor/zoom-out!: editing on a block-zoom route navigates to the
   parent (block zoom or its page) while keeping the block in edit mode;
   editing on a plain page is a no-op; otherwise history.back *)
let zoom_out () =
  match S.editing_uuid () with
  | Some edit_u -> (
      match Runtime.route () with
      | Model.Block_zoom uuid -> (
          match Runtime.capture_reload_origin () with
          | None -> ()
          | Some origin ->
              ignore
                (let* p =
                   Runtime.invoke2 "thread-api/get-block-parent"
                     (Wire.String origin.Runtime.reload_repo) (Wire.Uuid uuid)
                 in
                 if Runtime.reload_origin_current origin then
                   (match Wire.map_get_uuid p "block/uuid" with
                    | Some pu ->
                        (* Publish the editor handoff only with its owned
                           navigation; unrelated routes must not consume it. *)
                        pending_zoom := Some edit_u;
                        Ui_services.nav_set_hash
                          (Runtime.nav_hash ("#/page/" ^ pu))
                    | None -> ());
                 Js.Promise.resolve ()))
      | _ -> ())
  | None -> Ui_services.nav_back ()

(* -- /query (cljs commands.cljs db-based-query -> editor.cljs
   run-query-command!): create the logseq.property/query value block
   (its title is the pre-slash buffer), tag the block Query, empty its
   title, and exit editing — one transact! batch. -- *)
let run_query_command ~advanced =
  match S.editing () with
  | None -> ()
  | Some e ->
      let buf = live_buffer e.uuid in
      (* the query command empties this block's title in the same tx —
         pin it so the exit-edit repaint doesn't flash the old title *)
      S.override_title e.uuid "";
      S.set (fun st -> { st with S.editing = None });
      let quuid = Ui_services.env_random_uuid () in
      let extra =
        (* advanced-query-steps: display-type :code + code/lang clojure
           on the query value block (pre-named via new-block-id) *)
        if advanced then
          [ Ops.set_block_property quuid "logseq.property.node/display-type"
              (Wire.Keyword "code")
          ; Ops.set_block_property quuid "logseq.property.code/lang"
              (Wire.String "clojure")
          ]
        else []
      in
      let _ = () in
      ignore
        (let* sop = Ops.save_block_parsed e.uuid "" in
        let* () =
          Ops.apply_and_refresh
            ([ Ops.op "create-property-text-block"
                 [ Wire.Uuid e.uuid
                 ; Wire.Keyword "logseq.property/query"
                 ; Wire.String buf
                 ; Wire.Map
                     [ Ops.kw "set-block-property?" (Wire.Bool true)
                     ; Ops.kw "new-block-id" (Wire.Uuid quuid)
                     ]
                 ]
             ; Ops.set_block_property e.uuid "block/tags"
                 (Wire.Keyword "logseq.class/Query")
             ; sop
             ]
            @ extra)
        in
        Js.Promise.resolve ())

(* -- upload asset (cljs handler/editor/assets.cljs
   db-based-save-assets!): write each file to pfs
   /<graph>/assets/<uuid>.<ext>, then insert-blocks an Asset-tagged
   block below the editing block. An empty target reuses its uuid and
   is replaced in place. -- *)
(* The picker lives behind the ls:editor-command event (Asset_dom
   listens) — dispatching it keeps the same trigger contract the slash
   command uses without an editor_actions -> asset_dom module edge. *)
let trigger_asset_upload () =
  Ui_services.dom_dispatch_json "ls:editor-command"
    (Json.Object [ "command", Json.String "upload" ])

type asset_upload =
  { upload_repo : string
  ; upload_route : Model.route
  ; upload_target : string
  ; upload_edit : S.editing option
  ; upload_sibling : bool
  ; upload_empty : bool
  }

let capture_asset_upload () =
  let model = Runtime.model () in
  let edit = S.editing () in
  let target = match edit with
    | Some {S.owner = S.Explicit_draft owner; _} -> Some owner#asset_target
    | Some e -> Some e.S.uuid
    | None -> (match model.Model.route_page, model.Model.journals with
        | Some page, _ -> page.Model.page_uuid
        | None, page :: _ -> page.Model.page_uuid
        | None, [] -> None) in
  if Ui_services.env_publishing () then None else
  Option.bind model.Model.repo (fun repo -> Option.map (fun target ->
    let persisted = Option.fold ~none:false ~some:(fun e -> not (S.is_draft e)) edit in
    {upload_repo = repo; upload_route = Runtime.route (); upload_target = target;
     upload_edit = edit; upload_sibling = persisted;
     upload_empty = persisted && Option.fold ~none:false
       ~some:(fun e -> String.trim e.S.buffer = "") edit}) target)

let asset_upload_current upload =
  upload.upload_repo = Runtime.repo () && upload.upload_route = Runtime.route ()
  && not (Ui_services.env_publishing ())
  && match upload.upload_edit, S.editing () with
     | None, None -> true
     | Some before, Some live when before.S.epoch == live.S.epoch ->
         (match live.S.owner with S.Persisted -> true | S.Explicit_draft owner -> owner#current)
     | _ -> false

let check_asset_upload upload =
  if not (asset_upload_current upload) then failwith "Asset upload activation ended"

let commit_uploaded_assets upload blocks =
  if blocks = [] || not (asset_upload_current upload) then Js.Promise.resolve () else
  let* save_ops = match S.editing () with
    | Some e when not (S.is_draft e) && e.S.buffer <> e.S.base ->
        let* op = Ops.save_block_parsed e.S.uuid e.S.buffer in
        Js.Promise.resolve [op]
    | _ -> Js.Promise.resolve [] in
  if not (asset_upload_current upload) then Js.Promise.resolve () else
  let* () = Ops.apply_and_refresh ~opts:(Ops.op_opts "insert-blocks")
      (save_ops @ [Ops.insert_blocks ~bottom:true
        ~replace_empty_target:upload.upload_sibling blocks upload.upload_target
        ~sibling:upload.upload_sibling]) in
  if upload.upload_empty && asset_upload_current upload then Ops.resync_open_editor ()
  else Js.Promise.resolve ()

let file_ext name =
  match String.rindex_opt name '.' with
  | Some i when i + 1 < String.length name ->
      String.lowercase_ascii
        (String.sub name (i + 1) (String.length name - i - 1))
  | _ -> ""

let file_title name =
  match String.rindex_opt name '.' with
  | Some 0 | None -> name
  | Some i -> String.sub name 0 i

let asset_block_map ~uuid ~title ~ext ~size ~checksum =
  Wire.Map
    [ Ops.str "block/uuid" (Wire.Uuid uuid)
    ; Ops.str "block/title" (Wire.String title)
    ; Ops.str "logseq.property.asset/type" (Wire.String ext)
    ; Ops.str "logseq.property.asset/size" (Wire.Int size)
    ; Ops.str "logseq.property.asset/checksum" (Wire.String checksum)
    ; ( Wire.Keyword "block/tags"
      , Wire.Set [ Wire.Keyword "logseq.class/Asset" ] )
    ]

let u8_of_binary s =
  let u8 = Js.Typed_array.Uint8Array.fromLength (String.length s) in
  String.iteri
    (fun i c -> Js.Typed_array.Uint8Array.unsafe_set u8 i (Char.code c))
    s;
  u8

let save_one_asset upload pfs ~first
    (f : Ui_services.file) =
  let repo = upload.upload_repo in
  let name = f.Ui_services.file_name in
  let ext = file_ext name in
  let size = int_of_float f.Ui_services.file_size in
  let uuid =
    match (first, upload.upload_empty) with
    | true, true -> upload.upload_target
    | _ -> Ui_services.env_random_uuid ()
  in
  check_asset_upload upload;
  if ext = "" then begin
    Toast.error (I18n.tf "asset/invalid-ext-error" [name]);
    Js.Promise.resolve None
  end else
  let* bin = Subs_state.promise_of_task (f.Ui_services.file_binary ()) in
  check_asset_upload upload;
  let u8 = u8_of_binary bin in
  let* checksum = Platform.sha256_hex u8 in
  check_asset_upload upload;
  let dir = "/" ^ Platform.strip_db_prefix repo ^ "/assets" in
  let* () = Platform.pfs_ensure_dir pfs dir in
  check_asset_upload upload;
  let* () = Platform.pfs_write_file pfs (dir ^ "/" ^ uuid ^ "." ^ ext) u8 in
  Js.Promise.resolve (Some (asset_block_map ~uuid ~title:(file_title name) ~ext ~size ~checksum))

let upload_file_snapshots files =
  match capture_asset_upload (), Platform.pfs_handle () with
  | Some upload, Some pfs ->
      let rec collect i acc = function
        | [] -> commit_uploaded_assets upload (List.rev acc)
        | file :: rest ->
            let* block = save_one_asset upload pfs ~first:(i = 0) file in
            collect (i + 1) (match block with Some block -> block :: acc | None -> acc) rest in
      ignore (collect 0 [] files |> Js.Promise.catch (fun error ->
        Ui_services.log_error ("Asset upload failed", error);
        if asset_upload_current upload then
          Toast.error (I18n.t1 "ui/error-boundary-error" "asset-upload:failed");
        Js.Promise.resolve ()))
  | _ -> ()
