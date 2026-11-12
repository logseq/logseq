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
  check "matching preparation seals" (Update_admission.seal gate "1");
  check "matching abort releases" (Update_admission.release gate "1");
  check "release acknowledgement is idempotent" (Update_admission.release gate "1");
  Update_admission.begin_prepare gate "2";
  check "old abort cannot release a newer reservation" (not (Update_admission.release gate "1"));
  check "old completion cannot seal a newer reservation" (not (Update_admission.seal gate "1"));
  check "new reservation remains current" (Update_admission.current gate "2");
  check "current abort releases" (Update_admission.release gate "2");
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
  check "worker preparation seals" (Update_admission.seal gate "3");
  let rejected = Worker_client.invoke worker "thread-api/apply-outliner-ops" [] in
  check "late background write is rejected before the actual provider"
    (match rejected.Js.Promise.state with
     | Js.Promise.Rejected (Update_admission.Refused _) -> !invokes = 1
     | _ -> false);
  ignore (Update_admission.release gate "3");
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

let () =
  native_entry_admission ();
  native_worker_admission ();
  ordered_mailbox_barrier ();
  promise_observation ();
  print_endline "PASS actual native admission, worker rejection, mailbox order and finite-work observation"
