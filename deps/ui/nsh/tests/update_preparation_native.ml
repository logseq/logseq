(* Link with the real native application objects and C bridge; no daemon or OS
   window is opened. These checks exercise the actual native entry functions. *)
let check label condition = if not condition then failwith label
let refused operation f =
  match f () with
  | _ -> failwith ("Mutation unexpectedly admitted: " ^ operation)
  | exception Update_admission.Refused refusal ->
      check "typed admission refusal names the path" (refusal.operation = operation)

let native_entry_admission () =
  let presses = ref 0 and documents = ref 0 in
  let backend : Lui_protocol.backend = {
    backend_profile = Lui_protocol.profile Lui_protocol.MacOS Lui_protocol.NshHost;
    apply_batch = (fun _ -> true)
  } in
  let app = Lui_app.create backend Model.initial
    (fun model (_ : Action.t) -> model)
    (fun _ _ _ ->
      Lui_elements.button ~accessibility_identifier:"update-button"
        ~text:"Update admission test" ~on_press:(fun _ -> incr presses) []) in
  Native_embed.current_app := Some app;
  ignore (Lui_app.start app);
  ignore (Lui_app.flush app);
  let id = Lui_app.root_node app in
  ignore (Native_embed.press id);
  check "open input dispatches normally" (!presses = 1);
  ignore (Platform.add_event_listener "keydown" (fun _ -> incr documents));
  let gate = Update_admission.application in
  Update_admission.begin_prepare gate "1";
  refused "ordinary-ui" (fun () -> Native_embed.press id);
  refused "extension-ui" (fun () -> Native_embed.extension_event id "logseq-editor" "change" "{}");
  refused "document-ui" (fun () -> Native_embed.document_event "keydown" "{}");
  refused "editor-keyboard" (fun () -> Native_embed.keyboard_event id "{}" "{}");
  refused "semantic-agent" (fun () ->
    Native_embed.Ffi.agent (Printf.sprintf "{\"op\":\"press\",\"selector\":\"id:%d\"}" id));
  check "all native input paths leave application handlers untouched"
    (!presses = 1 && !documents = 0);
  let query, _ = Native_embed.Ffi.agent "{\"op\":\"find\",\"selector\":\"prop:accessibility-identifier=update-button\"}" in
  check "read-only queries stay live during save"
    (match Yojson.Safe.from_string query with
     | `Assoc fields -> List.assoc_opt "ok" fields = Some (`Bool true)
     | _ -> false);
  Update_admission.finish_save gate "1";
  check "matching preparation seals" (Update_admission.seal gate "1");
  check "abort only records intent" (Update_admission.request_abort gate "1" = `Pending);
  refused "still aborting" (fun () -> Update_admission.require_input gate "still aborting");
  check "drained coordinator releases" (Update_admission.finish_release gate "1");
  check "release acknowledgement is idempotent" (Update_admission.request_abort gate "1" = `Released);
  Update_admission.begin_prepare gate "2";
  check "old abort cannot release a newer reservation" (Update_admission.request_abort gate "1" = `Stale);
  check "old completion cannot seal a newer reservation" (not (Update_admission.seal gate "1"));
  check "new reservation remains current" (Update_admission.current gate "2");
  check "current abort records intent" (Update_admission.request_abort gate "2" = `Pending);
  check "unfinished save cannot release" (not (Update_admission.finish_release gate "2"));
  Update_admission.finish_save gate "2";
  check "current completed abort releases" (Update_admission.finish_release gate "2");
  ignore (Native_embed.press id);
  check "abort resumes the existing retained handler" (!presses = 2);
  ignore (Lui_app.dispose app);
  Native_embed.current_app := None

let native_worker_admission () =
  let invokes = ref 0 in
  let worker : Worker_client.t = {
    invoke_fn = (fun _ _ -> incr invokes; Js.Promise.resolve Wire.Nil);
    on_message = (fun _ _ -> ());
    dead = Js.Promise.liveness ()
  } in
  let gate = Update_admission.application in
  Update_admission.begin_prepare gate "3";
  ignore (Worker_client.invoke worker "thread-api/apply-outliner-ops" []);
  check "save/drain calls remain admitted while preparing" (!invokes = 1);
  check "worker is idle before seal" (Worker_client.idle ());
  Update_admission.finish_save gate "3";
  check "worker preparation seals" (Update_admission.seal gate "3");
  let rejected = Worker_client.invoke worker "thread-api/apply-outliner-ops" [] in
  check "late background write is rejected before the actual provider"
    (match rejected.Js.Promise.state with
     | Js.Promise.Rejected (Update_admission.Refused _) -> !invokes = 1
     | _ -> false);
  ignore (Update_admission.request_abort gate "3");
  ignore (Update_admission.finish_release gate "3");
  ignore (Worker_client.invoke worker "thread-api/apply-outliner-ops" []);
  check "release resumes ordinary worker admission" (!invokes = 2)

let ordered_mailbox_barrier () =
  let seen = ref [] in
  Host.enqueue (fun () ->
    seen := "parent" :: !seen;
    Host.enqueue (fun () -> seen := "nested model callback" :: !seen));
  Host.after_drain (fun () -> seen := "barrier" :: !seen);
  Host.drain ();
  check "tail barrier waits for callbacks enqueued by accepted callbacks"
    (List.rev !seen = ["parent"; "nested model callback"; "barrier"])

let promise_observation () =
  let scope = Ui_task.Activity.create () in
  let promise, resolve, _ = Ui_task.Activity.within scope Js.Promise.pending in
  ignore (Ui_task.Activity.within scope Js.Promise.liveness);
  check "infinite transport liveness is explicitly not finite work"
    ((Ui_task.Activity.snapshot scope).pending = 1);
  let completed = ref false in
  ignore (Ui_task.Activity.within scope (fun () ->
    Js.Promise.then_ (fun () -> completed := true; Js.Promise.resolve ()) promise));
  check "finite promise and its continuation are observed"
    ((Ui_task.Activity.snapshot scope).pending = 2);
  resolve ();
  check "observing preserves native synchronous promise settlement"
    (!completed && (Ui_task.Activity.snapshot scope).pending = 0)

let deferred_worker () =
  let pending = Queue.create () in
  let worker : Worker_client.t = {
    invoke_fn = (fun name _ ->
      let promise, resolve, reject = Js.Promise.pending () in
      Queue.add (name, resolve, reject) pending;
      promise);
    on_message = (fun _ _ -> ());
    dead = Js.Promise.liveness ()
  } in
  worker, pending

let start_actual_save scope id responses =
  Update_preparation.start ~gate:Update_admission.application ~scope
    ~save:(fun ~current -> Native_embed.prepare_window_close ~current ())
    ~flush:(fun () -> ()) ~logical_idle:Native_embed.update_logical_idle
    ~respond:(fun phase ok error -> responses := (phase, ok, error) :: !responses) id

let abort_waits_for_initial_worker_and_skips_later_mutation_boundaries () =
  let scope = Ui_task.Activity.create () in
  let worker, pending = deferred_worker () in
  ignore (Ui_task.Activity.within scope (fun () -> Worker_client.invoke worker "old write" []));
  let _, resolve, _ = Queue.take pending in
  let old_close = !Editor_state.close_property_editor in
  let closes = ref 0 and draft = ref "old draft" and responses = ref [] in
  Editor_state.close_property_editor := (fun () -> incr closes; draft := "old callback overwrite");
  Fun.protect ~finally:(fun () -> Editor_state.close_property_editor := old_close) (fun () ->
    let owner = start_actual_save scope "4" responses in
    Host.drain ();
    Update_preparation.abort owner;
    Host.drain ();
    check "abort cannot acknowledge while the initial accepted write is pending" (!responses = []);
    refused "input stays fenced" (fun () -> Update_admission.require_input Update_admission.application "input stays fenced");
    check "pending abort has not run a later property commit" (!closes = 0);
    resolve Wire.Nil;
    Host.drain ();
    check "matching release occurs only after the accepted I/O settles"
      (!responses = ["released", true, ""]);
    check "cancelled save cannot enter later mutation boundaries" (!closes = 0);
    draft := "later user draft";
    Host.drain ();
    check "old save cannot overwrite a draft after release" (!draft = "later user draft"))

let rejected_worker_still_waits_for_accepted_sibling () =
  let scope = Ui_task.Activity.create () in
  let worker, pending = deferred_worker () in
  Ui_task.Activity.within scope (fun () ->
    ignore (Worker_client.invoke worker "first" []);
    ignore (Worker_client.invoke worker "sibling" []));
  let _, _, reject = Queue.take pending in
  let _, resolve, _ = Queue.take pending in
  let responses = ref [] in
  let owner = start_actual_save scope "5" responses in
  Host.drain ();
  Update_preparation.abort owner;
  reject (Failure "first write failed");
  Host.drain ();
  check "Promise.all first failure cannot release while a sibling is pending" (!responses = []);
  refused "sibling pending" (fun () -> Update_admission.require_input Update_admission.application "sibling pending");
  resolve Wire.Nil;
  Host.drain ();
  check "all accepted siblings finish before release" (!responses = ["released", true, ""])

let abort_waits_for_detached_save_timer_and_its_model_continuation () =
  let scope = Ui_task.Activity.create () in
  let worker, pending = deferred_worker () in
  let old_close = !Editor_state.close_property_editor in
  let draft = ref "old draft" and responses = ref [] and at_release = ref None in
  Editor_state.close_property_editor := (fun () ->
    ignore (Host.set_timeout (fun () ->
      ignore (Js.Promise.then_ (fun _ ->
        draft := "accepted save descendant";
        Js.Promise.resolve ())
        (Worker_client.invoke worker "detached refresh" []))) 0));
  Fun.protect ~finally:(fun () -> Editor_state.close_property_editor := old_close) (fun () ->
    let owner = Update_preparation.start ~gate:Update_admission.application ~scope
      ~save:(fun ~current -> Native_embed.prepare_window_close ~current ())
      ~flush:(fun () -> ()) ~logical_idle:Native_embed.update_logical_idle
      ~respond:(fun phase ok error ->
        if phase = "released" then at_release := Some !draft;
        responses := (phase, ok, error) :: !responses) "6" in
    Host.drain ();
    check "real save's detached timer/worker prevents premature Prepared" (!responses = []);
    check "detached callback reached actual worker invoke" (Queue.length pending = 1);
    Update_preparation.abort owner;
    Host.drain ();
    check "abort stays fenced while detached descendant is pending" (!responses = []);
    refused "detached work pending" (fun () -> Update_admission.require_input Update_admission.application "detached work pending");
    let _, resolve, _ = Queue.take pending in
    resolve Wire.Nil;
    Host.drain ();
    check "descendant model callback happens BEFORE the release acknowledgement"
      (!at_release = Some "accepted save descendant" && !responses = ["released", true, ""]);
    draft := "new draft after release";
    resolve Wire.Nil;
    Host.drain ();
    check "settled old descendant cannot later overwrite the new draft" (!draft = "new draft after release"))

let finite_timer_observation_and_cancel_race () =
  let scope = Ui_task.Activity.create () in
  let fired = ref 0 in
  let id = Ui_task.Activity.within scope (fun () -> Host.set_timeout (fun () -> incr fired) 0) in
  check "one-shot timer is counted until fire or cancellation" ((Ui_task.Activity.snapshot scope).pending = 1);
  Host.clear_timeout id;
  check "cancellation releases timer work immediately" ((Ui_task.Activity.snapshot scope).pending = 0);
  Host.drain ();
  check "queued cancelled timer neither runs nor releases twice" (!fired = 0 && (Ui_task.Activity.snapshot scope).pending = 0);
  let finish = ref None in
  ignore (Ui_task.Activity.within scope (fun () -> Host.set_timeout ~observe:false (fun () ->
    let _, resolve, _ = Js.Promise.pending () in finish := Some resolve) 0));
  check "known recurring wait is classified as liveness" ((Ui_task.Activity.snapshot scope).pending = 0);
  Host.drain ();
  check "liveness callback still observes its actual finite work" ((Ui_task.Activity.snapshot scope).pending = 1);
  Option.get !finish ();
  check "liveness child work settles normally" ((Ui_task.Activity.snapshot scope).pending = 0)

let opaque_logical_save_does_not_release_or_self_poll_at_zero_activity () =
  let scope = Ui_task.Activity.create () in
  let old_ready = !Outliner_ops.pending_save_ready in
  let draft = ref "old draft" and responses = ref [] in
  Outliner_ops.pending_save_ready := Some (fun () -> draft := "old ready callback");
  Fun.protect ~finally:(fun () -> Outliner_ops.pending_save_ready := old_ready) (fun () ->
    let owner = start_actual_save scope "7" responses in
    Host.drain ();
    Update_preparation.abort owner;
    Host.drain ();
    check "opaque accepted logical save cannot receive Released"
      (not (List.exists (fun (phase, _, _) -> phase = "released") !responses));
    refused "logical save pending" (fun () -> Update_admission.require_input Update_admission.application "logical save pending");
    let epoch = Host.activity_epoch () in
    Host.drain (); Host.drain ();
    check "zero-count logical save does not create a self-poll loop" (Host.activity_epoch () = epoch);
    Ui_task.Activity.within scope (fun () ->
      let _, resolve, _ = Js.Promise.pending () in
      Outliner_ops.pending_save_ready := None;
      resolve ());
    Host.drain ();
    check "real subsequent observed work permits the matching release"
      (List.exists (fun (phase, ok, _) -> phase = "released" && ok) !responses);
    draft := "new draft after logical release";
    Outliner_ops.resume_pending_save ();
    check "released admission has no old logical callback to replay"
      (!draft = "new draft after logical release"))

let sparse_feedback_materializes_while_held_through_actual_ffi () =
  let open Lui_protocol in
  let backend : backend = {
    backend_profile = profile MacOS NshHost;
    apply_batch = (fun batch -> Queue.add batch Native_embed.pending_batches; true)
  } in
  let view _context _model _send context parent =
    let source = Signal.constant context.Lui_ui.ui_scheduler (List.init 100_000 Fun.id) in
    Lui_elements.virtual_list ~overscan:0 ~item_extent:20.
      [Lui_elements.virtual_rows ~source ~key:Fun.id ~cmp:Int.compare
        ~mount:(fun item -> Lui_elements.text
          ~value:("Maintenance row " ^ string_of_int (Signal.sample item)) []) ()]
      context parent
  in
  let app = Lui_app.create backend Model.initial (fun model (_ : Action.t) -> model) view in
  let gate = Update_admission.application in
  Native_embed.current_app := Some app;
  Fun.protect ~finally:(fun () ->
    ignore (Lui_app.dispose app);
    Native_embed.current_app := None;
    Queue.clear Native_embed.pending_batches;
    Update_admission.reset gate) (fun () ->
    ignore (Lui_app.start app); ignore (Lui_app.flush app);
    let runtime = Lui_app.runtime app and list = Lui_app.root_node app in
    let properties () = Hashtbl.find runtime.Lui_runtime.runtime_properties list in
    let epoch = match Property_map.find VirtualGeneration (properties ()) with
      | IntValue epoch -> epoch | _ -> failwith "Missing native sparse generation" in
    let text node = match Hashtbl.find_opt runtime.Lui_runtime.runtime_properties node with
      | Some props -> (match Property_map.find_opt TextValue props with
        | Some (StringValue value) -> value | _ -> "")
      | None -> "" in
    let initial = Lui_runtime.children runtime list in
    check "native sparse bootstrap is bounded" (initial <> [] && List.length initial < 32);
    let pin = List.hd initial in
    let previous = ref 0 in
    let ordered encoded =
      let batches = match Yojson.Safe.from_string encoded with
        | `List batches -> batches | _ -> failwith "Actual Ffi must return ordered batch array" in
      List.iter (function
        | `Assoc fields -> (match List.assoc_opt "generation" fields with
          | Some (`Int generation) ->
              check "native Ffi never drops or reorders a queued generation" (generation = !previous + 1);
              previous := generation
          | _ -> failwith "Missing Ffi batch generation")
        | _ -> failwith "Invalid native Ffi batch") batches;
      List.length batches
    in
    ignore (ordered (Native_embed.Ffi.encode_batches (Native_embed.take_patches ())));
    Update_admission.begin_prepare gate "8";
    Update_admission.finish_save gate "8";
    check "fixture reaches actual Held admission" (Update_admission.seal gate "8");
    refused "held input" (fun () -> Update_admission.require_input gate "held input");
    (* Keep an earlier accepted batch pending: Ffi maintenance must deliver it
       before the newly requested rows, through the actual production encoder. *)
    Lui_runtime.set_prop runtime list Gap (IntValue 1);
    ignore (Lui_app.flush app);
    let response = Native_embed.Ffi.virtual_window list epoch 40_000 40_003 [pin] in
    check "actual Ffi retains the earlier accepted publication" (ordered response >= 2);
    let rows = Lui_runtime.children runtime list in
    check "held maintenance materializes requested distant rows"
      (List.exists (fun node -> text node = "Maintenance row 40000") rows);
    check "explicit native pinned owner survives the bounded window"
      (List.mem pin rows && List.length rows = 4);
    ignore (ordered (Native_embed.Ffi.virtual_window list epoch 90_000 90_002 []));
    let rows = Lui_runtime.children runtime list in
    check "next actual Ffi window retires the released pin and earlier rows"
      (List.length rows = 2 && not (List.mem pin rows)
       && List.exists (fun node -> text node = "Maintenance row 90000") rows);
    ignore (Native_embed.Ffi.virtual_window list (epoch + 1) 1 2 []);
    check "canonical stale source feedback cannot mutate retained children"
      (Lui_runtime.children runtime list = rows);
    refused "ordinary-ui" (fun () -> Native_embed.press list);
    ignore (Update_admission.request_abort gate "8");
    check "fixture releases only its matching settled preparation"
      (Update_admission.finish_release gate "8"))

let () =
  let owner = Thread.id (Thread.self ()) in
  Ui_task.install { enqueue = Host.enqueue;
    assert_owner = (fun () -> check "native callbacks stay on their app owner" (Thread.id (Thread.self ()) = owner)) };
  native_entry_admission ();
  native_worker_admission ();
  ordered_mailbox_barrier ();
  promise_observation ();
  abort_waits_for_initial_worker_and_skips_later_mutation_boundaries ();
  rejected_worker_still_waits_for_accepted_sibling ();
  abort_waits_for_detached_save_timer_and_its_model_continuation ();
  finite_timer_observation_and_cancel_race ();
  opaque_logical_save_does_not_release_or_self_poll_at_zero_activity ();
  sparse_feedback_materializes_while_held_through_actual_ffi ();
  print_endline "PASS real native save/abort/worker/timer races and post-release draft safety"
