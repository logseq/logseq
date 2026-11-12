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
  let hello, _ = Native_embed.Ffi.agent "{\"op\":\"hello\"}" in
  check "native diagnostics are discoverable on the existing agent channel"
    (match Yojson.Safe.from_string hello with
     | `Assoc fields ->
         (match List.assoc_opt "ops" fields with
          | Some (`List ops) -> List.mem (`String "gc-stats") ops
          | _ -> false)
     | _ -> false);
  let diagnostics, _ = Native_embed.Ffi.agent "{\"op\":\"gc-stats\"}" in
  check "heap diagnostics remain read-only during save"
    (match Yojson.Safe.from_string diagnostics with
     | `Assoc fields ->
         List.assoc_opt "ok" fields = Some (`Bool true)
         && (match List.assoc_opt "gc" fields with
             | Some (`Assoc gc) ->
                 let integer name = match List.assoc_opt name gc with
                   | Some (`Int value) -> value
                   | _ -> failwith ("Missing integer heap diagnostic: " ^ name) in
                 let word_bytes = integer "word-bytes" in
                 (word_bytes = 4 || word_bytes = 8)
                 && integer "major-heap-capacity-bytes"
                    = integer "major-heap-words" * word_bytes
                 && integer "current-domain-minor-heap-limit-bytes" > 0
                 && integer "minor-collections" >= 0
                 && integer "major-collections" >= 0
                 && integer "compactions" >= 0
                 && List.assoc_opt "live-bytes" gc = None
             | _ -> false)
     | _ -> false);
  check "heap queries do not invoke application input handlers"
    (!presses = 1 && !documents = 0);
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

let editor_keyboard_capture_order () =
  let original_capture = Hashtbl.find_opt Platform.capture_listeners "keydown" in
  let restore () =
    (match original_capture with
     | Some listeners -> Hashtbl.replace Platform.capture_listeners "keydown" listeners
     | None -> Hashtbl.remove Platform.capture_listeners "keydown");
    Native_embed.current_app := None in
  Fun.protect ~finally:restore (fun () ->
    let observed = ref [] and consume = ref false and remove = ref false in
    let backend : Lui_protocol.backend = {
      backend_profile = Lui_protocol.profile Lui_protocol.MacOS Lui_protocol.NshHost;
      apply_batch = (fun _ -> true)
    } in
    let registry = Lui_extension.registry () in
    Lui_extension.register_component registry Logseq_editor.schema;
    let app = Lui_app.create_with_extensions backend registry Model.initial
      (fun model (_ : Action.t) -> model)
      (fun _ _ _ context parent ->
        let node = Lui_ui.extension context "logseq-editor" in
        Lui_ui.extension_property context node "block-id" (Lui_protocol.StringValue "keyboard-fixture");
        Lui_ui.on_event context node (function
          | Lui_protocol.ExtensionEvent (_, _, "key", _) -> observed := !observed @ ["conduit"]
          | _ -> ());
        Option.iter (fun p -> Lui_ui.append context p node) parent;
        node) in
    Native_embed.current_app := Some app;
    ignore (Lui_app.start app);
    ignore (Lui_app.flush app);
    let node = Lui_app.root_node app in
    Hashtbl.replace Platform.capture_listeners "keydown" [(fun payload ->
      Native_embed.assert_entry_owner ();
      observed := !observed @ ["capture"];
      check "native key capture preserves its mounted target and modifiers"
        (match payload with
         | Js.Json.JObject fields ->
             List.assoc_opt "nodeId" fields = Some (Js.Json.JNumber (float_of_int node))
             && List.assoc_opt "key" fields = Some (Js.Json.JString "Enter")
             && List.assoc_opt "metaKey" fields = Some (Js.Json.boolean true)
         | _ -> false);
      if !consume then Platform.request_prevent ();
      if !remove then ignore (Lui_app.dispose app))];
    let key () = ignore (Native_embed.extension_event node "logseq-editor" "key"
      {|{"key":"Enter","meta":true}|}) in
    key ();
    check "native document capture runs before exactly one conduit event"
      (!observed = ["capture"; "conduit"]);
    observed := []; consume := true;
    key ();
    check "a popup-consumed native key never reaches the editor" (!observed = ["capture"]);
    observed := []; consume := false; remove := true;
    key ();
    check "a sink removed during capture never receives the key" (!observed = ["capture"]);
    key ();
    check "a retired sink cannot dispatch another document key" (!observed = ["capture"]))

let native_dom_events = ref []

let native_outliner_content_events () =
  let recorded = native_dom_events in
  recorded := [];
  let prior_target = !Platform.event_target_of
  and prior_capture = Hashtbl.find_opt Platform.capture_listeners "pointerdown"
  and prior_state = !Editor_state.st
  and prior_fields = !Editor_state.field_sigs_opt in
  Fun.protect ~finally:(fun () ->
    Platform.event_target_of := prior_target;
    (match prior_capture with
     | Some listeners -> Hashtbl.replace Platform.capture_listeners "pointerdown" listeners
     | None -> Hashtbl.remove Platform.capture_listeners "pointerdown");
    Editor_state.st := prior_state;
    Editor_state.field_sigs_opt := prior_fields;
    Native_embed.current_app := None) (fun () ->
    List.iter (fun (os, host, native) ->
      let backend : Lui_protocol.backend = {
        backend_profile = Lui_protocol.profile os host;
        apply_batch = (fun _ -> true)
      } in
      let registry = Lui_extension.registry () in
      Logseq_el.register registry;
      let block = Model.empty_block ~uuid:"native-content" ~title:"Content target" ~is_page:false in
      let app = Lui_app.create_with_extensions backend registry Model.initial
        (fun model (_ : Action.t) -> model)
        (fun context _ _ ->
          Editor_state.ensure context;
          Lui_elements.column ~style_class:"ls-block"
          ~data_attrs:["data-blockid","native-content";"data-cid","main"]
          [ Tree.content_el "native-content" block
          ; Tree.control_wrap ~scope:"main" ~library:false "native-content" block ]) in
      Native_embed.current_app := Some app;
      Fun.protect ~finally:(fun () -> ignore (Lui_app.dispose app)) (fun () ->
        ignore (Lui_app.start app); ignore (Lui_app.flush app);
        let runtime = Lui_app.runtime app in
        let node = List.hd (Lui_runtime.children runtime (Lui_app.root_node app)) in
        let props = Hashtbl.find runtime.Lui_runtime.runtime_properties node in
        let enabled = Lui_protocol.Property_map.find_opt Lui_protocol.PointerEnabled props
          = Some (Lui_protocol.BoolValue true) in
        check "only NSH content registers a native pointer owner" (enabled = native);
        let bullet = Hashtbl.fold (fun id props found ->
          if Lui_protocol.Property_map.find_opt Lui_protocol.AccessibilityIdentifier props
             = Some (Lui_protocol.StringValue "dot-native-content")
          then Some id else found) runtime.Lui_runtime.runtime_properties None
          |> Option.get in
        let bullet_properties = Hashtbl.find runtime.Lui_runtime.runtime_properties bullet in
        check "only NSH bullets register their native activation owner"
          ((Lui_protocol.Property_map.find_opt Lui_protocol.PointerEnabled bullet_properties
           = Some (Lui_protocol.BoolValue true)) = native);
        if native then begin
          Platform.event_target_of := (fun node -> Some (Native_embed.ext_snapshot runtime node));
          Hashtbl.replace Platform.capture_listeners "pointerdown"
            [(fun payload -> Block_selection.pointerdown (Ui_dom_native.ev_of payload))];
          Editor_state.set (fun state -> {state with selected=Editor_state.String_set.empty;anchor=None});
          recorded := [];
          ignore (Native_embed.pointer_down node 31. 47. 1 0 "");
          check "Ctrl pointerdown reaches the existing block selection controller"
            (Editor_state.String_set.mem "native-content" (Editor_state.selected ()));
          ignore (Native_embed.pointer_up node 31. 47. 1 0 "");
          ignore (Native_embed.press_detail node 31. 47. 1 0 "");
          check "native content emits ordered pointer and click phases"
            (List.map fst !recorded=["pointerdown";"mousedown";"pointerup";"click"]);
          List.iter (fun (name,payload) ->
            check "native content preserves genuine target, coordinates and primary button state"
              (match payload with
               | Js.Json.JObject fields ->
                   List.assoc_opt "nodeId" fields=Some (Js.Json.JNumber (float_of_int node))
                   && List.assoc_opt "clientX" fields=Some (Js.Json.JNumber 31.)
                   && List.assoc_opt "clientY" fields=Some (Js.Json.JNumber 47.)
                   && List.assoc_opt "ctrlKey" fields=Some (Js.Json.boolean true)
                   && List.assoc_opt "buttons" fields=Some (Js.Json.JNumber
                     (if name="pointerdown" || name="mousedown" then 1. else 0.))
               | _ -> false)) !recorded;
          check "input delivery retains the same mounted content owner"
            (List.hd (Lui_runtime.children runtime (Lui_app.root_node app))=node);
          recorded := [];
          ignore (Native_embed.pointer_down bullet 9. 12. 0 0 "");
          ignore (Native_embed.pointer_up bullet 9. 12. 0 0 "");
          ignore (Native_embed.press_detail bullet 9. 12. 0 0 "");
          check "native bullet activation reaches the shared document owner once"
            (List.map fst !recorded=["pointerdown";"mousedown";"pointerup";"click"]);
          check "the native bullet retains its controller's prefixed target identity"
            (match List.assoc_opt "click" !recorded with
             | Some payload -> (match (Ui_dom_native.ev_of payload).Ui_services.target with
                 | Some target -> (match target.Ui_services.closest ".bullet-container" with
                     | Some bullet -> bullet.Ui_services.id () = "dot-native-content"
                     | None -> false)
                 | None -> false)
             | None -> false)
        end))
      Lui_protocol.[MacOS,NshHost,true;IOS,SwiftUIHost,false;AndroidOS,KotlinHost,false])

let native_route_document_data () =
  let prior_worker = !Runtime.worker and prior_model = !Runtime.read_model
  and prior_send = !Runtime.app_send and prior_host = !Host.host_op
  and prior_request = !Platform.host_request and prior_route = !Router.loaded_route
  and prior_generation = !Runtime.load_gen and prior_init = !Editor_state.on_init
  and prior_zoom = !Editor_actions.pending_zoom in
  let prior_overrides = Hashtbl.copy Editor_state.display_overrides in
  let requests = ref [] and loaded = ref None and failed = ref false in
  let title = "Native route metadata" in
  let route = Model.Page title in
  let model = {Model.initial with repo=Some "native-route";route} in
  let restore_data key value = match value with
    | Some value -> Hashtbl.replace Platform.doc_data key value
    | None -> Hashtbl.remove Platform.doc_data key in
  let prior_page = Hashtbl.find_opt Platform.doc_data "page"
  and prior_settings = Hashtbl.find_opt Platform.doc_data "settings-tab" in
  Fun.protect ~finally:(fun () ->
    Runtime.worker := prior_worker; Runtime.read_model := prior_model;
    Runtime.app_send := prior_send; Host.host_op := prior_host;
    Platform.host_request := prior_request; Router.loaded_route := prior_route;
    Runtime.load_gen := prior_generation; Editor_state.on_init := prior_init;
    Editor_actions.pending_zoom := prior_zoom;
    Hashtbl.clear Editor_state.display_overrides;
    Hashtbl.iter (Hashtbl.replace Editor_state.display_overrides) prior_overrides;
    restore_data "page" prior_page; restore_data "settings-tab" prior_settings) (fun () ->
    Host.set_host_op (fun operation _ -> failwith ("Unexpected native DOM request: " ^ operation));
    Platform.host_request := (fun request -> requests := request :: !requests);
    Runtime.read_model := (fun () -> model);
    Runtime.app_send := (fun action ->
      (match action with
       | Action.Page_loaded page -> loaded := Some page
       | Action.Page_load_failed -> failed := true
       | _ -> ()); true);
    Runtime.worker := Some {
      Worker_client.invoke_fn = (fun name _ -> Js.Promise.resolve (match name with
        | "thread-api/get-page-route-info" -> Wire.Map [Wire.Keyword "block/title", Wire.String title]
        | "thread-api/get-page-blocks-tree" -> Wire.Array []
        | "thread-api/get-case-page" -> Wire.Map []
        | _ -> failwith ("Unexpected route endpoint: " ^ name)));
      on_message=(fun _ _ -> ());dead=Js.Promise.liveness ()};
    Router.loaded_route := None;
    ignore (Router.load_page_ref route (Wire.String title));
    Host.drain ();
    check "actual native page route commits without unsupported set-attr"
      (not !failed && Option.map (fun page -> page.Model.page_title) !loaded=Some title);
    let body = Ui_services.dom_body () in
    check "native document adapters retain their owned snapshot identity"
      (Ui_dom_native.token_el body=Dom_ext.document_el);
    check "route metadata remains readable through a fresh native body handle"
      (body.Ui_services.attr "data-page"=Some title);
    body.Ui_services.set_attr "data-settings-tab" "editor";
    check "native document handles share application metadata"
      ((Ui_services.dom_root ()).Ui_services.attr "data-settings-tab"=Some "editor");
    check "document changes use the existing ui-state channel"
      (List.exists (fun request -> match String.split_on_char '\n' request with
        | "ui-state" :: payload ->
            (match Yojson.Safe.from_string (String.concat "\n" payload) with
             | `Assoc fields -> (match List.assoc_opt "data" fields with
                | Some (`Assoc data) -> List.assoc_opt "page" data=Some (`String title)
                    && List.assoc_opt "settings-tab" data=Some (`String "editor")
                | _ -> false)
             | _ -> false)
        | _ -> false) !requests);
    body.Ui_services.rm_attr "data-settings-tab";
    check "removal retires native document metadata"
      ((Ui_services.dom_body ()).Ui_services.attr "data-settings-tab"=None);
    check "native semantic attributes still require their actual owner"
      (match body.Ui_services.set_attr "contenteditable" "true" with
       | () -> false
       | exception Failure message -> message="Unexpected native DOM request: dom-op"))
let persisted_journal_hash_links_delegate_through_the_native_owner () =
  let previous_worker = !Runtime.worker in
  Runtime.worker := Some {
    Worker_client.invoke_fn = (fun _ _ -> Js.Promise.resolve Wire.Nil);
    on_message = (fun _ _ -> ()); dead = Js.Promise.liveness () };
  let backend : Lui_protocol.backend = {
    backend_profile = Lui_protocol.profile Lui_protocol.MacOS Lui_protocol.NshHost;
    apply_batch = (fun _ -> true)
  } in
  let registry = Lui_extension.registry () in
  Logseq_el.register_all registry;
  Logseq_codemirror.register registry;
  Logseq_editor.register registry;
  let block = Model.empty_block ~uuid:"persisted-journal-link"
    ~title:"Persisted [[Page]] #tag" ~is_page:false in
  let app = Lui_app.create_with_extensions backend registry Model.initial
    (fun model (_ : Action.t) -> model)
    (fun context _ _ ->
      Editor_state.ensure context;
      Lui_elements.column ~style_class:"ls-block"
        ~data_attrs:["data-blockid","persisted-journal-link";"data-cid","main"]
        [Tree.content_el "persisted-journal-link" block]) in
  let previous_app = !Native_embed.current_app in
  let previous_target = !Platform.event_target_of in
  let previous_clicks = Hashtbl.find_opt Platform.window_listeners "click" in
  Native_embed.current_app := Some app;
  Fun.protect ~finally:(fun () ->
    ignore (Lui_app.dispose app);
    Runtime.worker := previous_worker;
    Native_embed.current_app := previous_app;
    Platform.event_target_of := previous_target;
    match previous_clicks with
    | Some listeners -> Hashtbl.replace Platform.window_listeners "click" listeners
    | None -> Hashtbl.remove Platform.window_listeners "click") (fun () ->
    ignore (Lui_app.start app); ignore (Lui_app.flush app);
    let runtime = Lui_app.runtime app in
    let links = Hashtbl.fold (fun node kind acc ->
      if kind = Lui_protocol.Link then node :: acc else acc)
      runtime.Lui_runtime.mounted_nodes [] in
    check "persisted Journal body contains real page/tag Link nodes" (links <> []);
    List.iter (fun node ->
      let properties = Hashtbl.find runtime.Lui_runtime.runtime_properties node in
      check "every internal hash Link opts into the application press path"
        (Lui_protocol.Property_map.find_opt Lui_protocol.PressEnabled properties
         = Some (Lui_protocol.BoolValue true))) links;
    Platform.event_target_of := (fun node -> Some (Native_embed.ext_snapshot runtime node));
    let observed = ref [] in
    Hashtbl.replace Platform.window_listeners "click" [fun event ->
      Platform.request_prevent ();
      observed := event :: !observed];
    let node = List.hd links in
    Platform.last_click_ms := 0.;
    ignore (Native_embed.press_ex node 2);
    check "one native Shift activation reaches the existing delegated controller"
      (match !observed with
       | [Js.Json.JObject fields] ->
           List.assoc_opt "nodeId" fields = Some (Js.Json.JNumber (float_of_int node))
           && List.assoc_opt "shiftKey" fields = Some (Js.Json.boolean true)
           && (match List.assoc_opt "target" fields with
               | Some target -> Dom_ext.get_attribute target "href" = Some "#"
               | None -> false)
       | _ -> false);
    check "delegated navigation retains the same mounted Link"
      (Hashtbl.mem runtime.Lui_runtime.mounted_nodes node))

let native_click_delivery_follows_the_active_host_profile () =
  let previous_app = !Native_embed.current_app
  and previous_clicks = Hashtbl.find_opt Platform.capture_listeners "click"
  and previous_ms = !Platform.last_click_ms in
  let observed = ref [] in
  let run host =
    let backend : Lui_protocol.backend = {
      backend_profile = Lui_protocol.profile Lui_protocol.MacOS host;
      apply_batch = (fun _ -> true) } in
    let app = Lui_app.create backend Model.initial
      (fun model (_ : Action.t) -> model)
      (fun _ _ _ -> Lui_elements.column []) in
    Native_embed.current_app := Some app;
    Fun.protect ~finally:(fun () -> ignore (Lui_app.dispose app)) (fun () ->
      ignore (Lui_app.start app); ignore (Lui_app.flush app);
      observed := [];
      Hashtbl.replace Platform.capture_listeners "click" [fun event ->
        observed := event :: !observed];
      let emit node = Platform.emit_event "click"
        (Js.Json.object_list ["nodeId", Js.Json.number (float_of_int node)]) in
      (* A future stamp deterministically exercises the coalescing window
         without relying on wall-clock speed or sleeping between events. *)
      Platform.last_click_ms := max_float;
      emit 101; emit 102; emit 102;
      !observed) in
  Fun.protect ~finally:(fun () ->
    Native_embed.current_app := previous_app;
    Platform.last_click_ms := previous_ms;
    match previous_clicks with
    | Some listeners -> Hashtbl.replace Platform.capture_listeners "click" listeners
    | None -> Hashtbl.remove Platform.capture_listeners "click") (fun () ->
    let events = run Lui_protocol.NshHost in
    let nodes = List.rev_map (function
      | Js.Json.JObject fields -> List.assoc_opt "nodeId" fields
      | _ -> None) events in
    check "NSH delivers rapid clicks across controls and on the same control"
      (nodes = List.map (fun node -> Some (Js.Json.number (float_of_int node))) [101;102;102]);
    check "Apple retains its legacy monitor duplicate coalescing"
      (run Lui_protocol.SwiftUIHost = []))

let native_add_button_events_reach_the_shared_document_owner () =
  let previous_app = !Native_embed.current_app
  and previous_target = !Platform.event_target_of in
  let names = ["pointerdown"; "mousedown"; "pointerup"; "click"] in
  let previous_listeners = List.map (fun name ->
    name, Hashtbl.find_opt Platform.capture_listeners name) names in
  let backend : Lui_protocol.backend = {
    backend_profile = Lui_protocol.profile Lui_protocol.MacOS Lui_protocol.NshHost;
    apply_batch = (fun _ -> true) } in
  let app = Lui_app.create backend Model.initial
    (fun model (_ : Action.t) -> model)
    (fun context _ _ ->
      Add_button.el ~puuid:"native-empty-page"
        ~flags:(fun _ -> Signal.constant context.Lui_ui.ui_scheduler (false, false))) in
  Native_embed.current_app := Some app;
  Fun.protect ~finally:(fun () ->
    ignore (Lui_app.dispose app);
    Native_embed.current_app := previous_app;
    Platform.event_target_of := previous_target;
    List.iter (fun (name, previous) -> match previous with
      | Some listeners -> Hashtbl.replace Platform.capture_listeners name listeners
      | None -> Hashtbl.remove Platform.capture_listeners name) previous_listeners) (fun () ->
    ignore (Lui_app.start app); ignore (Lui_app.flush app);
    let runtime = Lui_app.runtime app in
    Platform.event_target_of := (fun id -> Some (Native_embed.ext_snapshot runtime id));
    let observed = ref [] in
    List.iter (fun name -> Hashtbl.replace Platform.capture_listeners name
      [fun payload ->
        let event = Ui_dom_native.ev_of payload in
        check "native add activation preserves its shared add-button target"
          (match event.Ui_services.target with
           | Some target -> (match target.Ui_services.closest ".block-add-button" with
               | Some add -> add.Ui_services.attr "data-parentblockid" = Some "native-empty-page"
               | None -> false)
           | None -> false);
        observed := name :: !observed]) names;
    let node = Lui_app.root_node app in
    let properties = Hashtbl.find runtime.Lui_runtime.runtime_properties node in
    check "the empty native add row owns native activation"
      (Lui_protocol.Property_map.find_opt Lui_protocol.PressEnabled properties
       = Some (Lui_protocol.BoolValue true));
    ignore (Native_embed.pointer_down node 12. 8. 0 0 "");
    ignore (Native_embed.pointer_up node 12. 8. 0 0 "");
    ignore (Native_embed.press_detail node 12. 8. 0 0 "");
    check "native empty-page add reaches the shared document sequence once"
      (List.rev !observed = names))

let native_block_click_mounts_shared_editor () =
  let prior_model = !Runtime.read_model and prior_flush = !Runtime.app_flush
  and prior_host = !Host.host_op and prior_target = !Platform.event_target_of
  and prior_elements = !Dom_ext.doc_elements_provider
  and prior_subtree = !Dom_ext.subtree_elements_provider
  and prior_state = !Editor_state.st and prior_fields = !Editor_state.field_sigs_opt
  and prior_pending = !Editor_state.pending_focus and prior_click = !Editor_state.click_point in
  let captures = List.map (fun name -> name, Hashtbl.find_opt Platform.capture_listeners name)
    ["pointerdown";"mousedown";"click";"copy"] in
  let requests = ref [] in
  let uuid = "native-edit-entry" in
  let block = Model.empty_block ~uuid ~title:"A real editable block" ~is_page:false in
  let page = Option.get (Decode.page_of_summary (Wire.Map [Wire.Keyword "block/title", Wire.String "Native editing"])) in
  let page = {page with Model.page_blocks=[block]} in
  let model = {Model.initial with repo=Some "native-edit";route=Model.Page "Native editing";route_page=Some page} in
  let backend : Lui_protocol.backend = {
    backend_profile=Lui_protocol.profile Lui_protocol.MacOS Lui_protocol.NshHost;
    apply_batch=(fun _ -> true)} in
  let registry = Lui_extension.registry () in
  Logseq_el.register_all registry;
  Logseq_codemirror.register registry;
  Logseq_editor.register registry;
  Editor_state.st := None; Editor_state.field_sigs_opt := None;
  let app = Lui_app.create_with_extensions backend registry model
    (fun model (_ : Action.t) -> model)
    (fun context _ _ ->
      Editor_state.ensure context;
      Lui_elements.column ~style_class:"ls-block"
        ~accessibility_identifier:("ls-block-" ^ uuid)
        ~data_attrs:["data-blockid",uuid;"data-cid","main"]
        [Tree.content_or_editor ~editable:true uuid "main" block]) in
  Fun.protect ~finally:(fun () ->
    ignore (Lui_app.dispose app); Native_embed.current_app := None;
    Runtime.read_model := prior_model; Runtime.app_flush := prior_flush;
    Host.host_op := prior_host; Platform.event_target_of := prior_target;
    Dom_ext.doc_elements_provider := prior_elements;
    Dom_ext.subtree_elements_provider := prior_subtree;
    Editor_state.st := prior_state; Editor_state.field_sigs_opt := prior_fields;
    Editor_state.pending_focus := prior_pending; Editor_state.click_point := prior_click;
    List.iter (fun (name, previous) -> match previous with
      | Some listeners -> Hashtbl.replace Platform.capture_listeners name listeners
      | None -> Hashtbl.remove Platform.capture_listeners name) captures) (fun () ->
    Native_embed.current_app := Some app;
    Runtime.read_model := (fun () -> Lui_app.model app);
    Runtime.app_flush := (fun () -> ignore (Lui_app.flush app));
    Host.set_host_op (fun operation payload -> requests := (operation,payload) :: !requests);
    Dom_ext.doc_elements_provider := Native_embed.collect_elements;
    Dom_ext.subtree_elements_provider := Native_embed.collect_subtree;
    let runtime = Lui_app.runtime app in
    Platform.event_target_of := (fun node -> Some (Native_embed.ext_snapshot runtime node));
    List.iter (fun (name, handler) -> Hashtbl.replace Platform.capture_listeners name
      [(fun payload -> handler (Ui_dom_native.ev_of payload))])
      ["pointerdown",Block_selection.pointerdown;"mousedown",Editor_keys.on_mousedown;
       "click",Editor_keys.on_click;"copy",Editor_keys.on_copy];
    ignore (Lui_app.start app); ignore (Lui_app.flush app);
    let node = Hashtbl.fold (fun id props found ->
      if Lui_protocol.Property_map.find_opt Lui_protocol.AccessibilityIdentifier props
        = Some (Lui_protocol.StringValue ("block-content-" ^ uuid)) then Some id else found)
      runtime.Lui_runtime.runtime_properties None |> Option.get in
    ignore (Native_embed.pointer_down node 31. 47. 0 0 "");
    ignore (Native_embed.pointer_up node 31. 47. 0 0 "");
    ignore (Native_embed.press_detail node 31. 47. 0 0 "");
    ignore (Lui_app.flush app);
    check "actual native content click enters the shared editor in its original scope"
      (match Editor_state.editing () with
       | Some editing -> editing.Editor_state.uuid=uuid && editing.scope="main"
       | None -> false);
    check "click replaces rendered content with the actual editor conduit"
      (Hashtbl.fold (fun _ identifier found -> found || identifier="logseq-editor")
        runtime.Lui_runtime.runtime_extension_nodes false);
    Editor_actions.apply_focus ();
    check "shared focus emits its actual native focus command"
      (List.exists (fun (operation,payload) -> operation="dom-op"
        && String.starts_with ~prefix:"set-input-focus\n" payload) !requests);
    let sink = Hashtbl.fold (fun id identifier found ->
      if identifier="logseq-editor" then Some id else found)
      runtime.Lui_runtime.runtime_extension_nodes None |> Option.get in
    let copy () = ignore (Native_embed.extension_event sink "logseq-editor" "dom-event"
      (Js.Json.stringify (Js.Json.object_list
        ["name",Js.Json.string "copy";"payload",Js.Json.string
          (Js.Json.stringify (Js.Json.object_list ["nodeId",Js.Json.number (float_of_int sink)]))]))) in
    Editor_actions.update_model uuid (fun model -> Edit_model.select model ~anchor:0 ~focus:6);
    ignore (Lui_app.flush app);
    requests := [];
    copy ();
    check "native copy reaches the real shared source-selection controller"
      (List.mem ("clipboard","A real") !requests);
    Editor_actions.update_model uuid (fun model -> Edit_model.select model ~anchor:0 ~focus:0);
    ignore (Lui_app.flush app);
    requests := [];
    copy ();
    check "native collapsed copy keeps the shared block-reference policy"
      (List.mem ("clipboard","[[" ^ uuid ^ "]]") !requests))

let native_graph_menu_contract () =
  let backend : Lui_protocol.backend = {
    backend_profile=Lui_protocol.profile Lui_protocol.MacOS Lui_protocol.NshHost;
    apply_batch=(fun _ -> true)} in
  let registry = Lui_extension.registry () in
  Logseq_el.register_all registry;
  Logseq_codemirror.register registry; Logseq_editor.register registry;
  let initial = {Model.initial with repo=Some "menu-contract";repos=["menu-contract"]} in
  let app = Lui_app.create_with_extensions backend registry initial
    (fun _ next -> next)
    (fun context model _ ->
      let state value = Signal.state context.Lui_ui.ui_scheduler value in
      let sidebar : Sidebar_state.t = {
        favorites=state [];home_page=state None;favorite_drop=state None;recents=state [];
        nav_checked=state [];nav_tag_titles=state [];items=state [];open_menu=state "";
        groups_collapsed=state [];left_width=state 246.;right_fraction=state 0.3;
        viewport_w=state 1440.} in
      Left_sidebar_view.graphs_selector sidebar model) in
  Fun.protect ~finally:(fun () -> ignore (Lui_app.dispose app)) (fun () ->
    ignore (Lui_app.start app); ignore (Lui_app.flush app);
    let runtime = Lui_app.runtime app in
    let attachments () = Hashtbl.fold (fun node kind found ->
      if kind=Lui_protocol.ContextMenu then node::found else found)
      runtime.Lui_runtime.mounted_nodes [] in
    let attachment = match attachments () with
      | [node] -> node
      | _ -> failwith "native graph selector must have exactly one attached Menu" in
    check "actual native graph menu mounts direct canonical items without contract errors"
      (Hashtbl.fold (fun _ kind found -> found || kind=Lui_protocol.MenuItem)
        runtime.Lui_runtime.mounted_nodes false);
    ignore (Lui_app.send app {initial with repo=Some "another-menu-contract";
      repos=["menu-contract";"another-menu-contract"]});
    ignore (Lui_app.flush app);
    check "actual native graph updates retain their original attached Menu identity"
      (attachments ()=[attachment]))

let native_favorite_menu_contract () =
  let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model
  and previous_flush = !Runtime.app_flush and previous_context = !Sidebar_state.lp_ctx in
  let sidebar = ref None in
  let page = Option.get (Decode.page_of_summary (Wire.Map [
    Wire.Keyword "block/uuid",Wire.Uuid "favorite-contract";
    Wire.Keyword "block/title",Wire.String "Favorite contract"])) in
  let backend : Lui_protocol.backend = {
    backend_profile=Lui_protocol.profile Lui_protocol.MacOS Lui_protocol.NshHost;
    apply_batch=(fun _ -> true)} in
  let registry=Lui_extension.registry () in
  Logseq_el.register_all registry;
  Logseq_codemirror.register registry;Logseq_editor.register registry;
  let initial={Model.initial with repo=Some "favorite-contract"} in
  let app=Lui_app.create_with_extensions backend registry initial (fun model () -> model)
    (fun context _ _ ->
      let state value=Signal.state context.Lui_ui.ui_scheduler value in
      let st : Sidebar_state.t = {
        favorites=state [page];home_page=state None;favorite_drop=state None;recents=state [];
        nav_checked=state [];nav_tag_titles=state [];items=state [];open_menu=state "";
        groups_collapsed=state [];left_width=state 246.;right_fraction=state 0.3;
        viewport_w=state 1440.} in
      sidebar:=Some st;
      Lui_elements.column [Left_sidebar_view.page_item_el st page
        ~li_class:"favorite-item" ~recent:false ~key:"favorite-contract";
        Left_sidebar_view.menu_host st]) in
  Fun.protect ~finally:(fun () ->
    ignore (Lui_app.dispose app);Runtime.worker:=previous_worker;
    Runtime.read_model:=previous_model;Runtime.app_flush:=previous_flush;
    Sidebar_state.lp_ctx:=previous_context) (fun () ->
    Runtime.read_model:=(fun () -> Lui_app.model app);
    Runtime.app_flush:=(fun () -> ignore (Lui_app.flush app));
    Runtime.worker:=Some {Worker_client.invoke_fn=(fun _ _ ->
      Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()));
      on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
    ignore (Lui_app.start app);ignore (Lui_app.flush app);
    let runtime=Lui_app.runtime app in
    let button=Hashtbl.fold (fun node props found ->
      if Lui_protocol.Property_map.find_opt Lui_protocol.AccessibilityLabel props
        =Some (Lui_protocol.StringValue (I18n.t "ui/show-more")) then Some node else found)
      runtime.Lui_runtime.runtime_properties None |> Option.get in
    let detail : Lui_protocol.pointer_detail={x=10.;y=10.;button=0;modifiers=0;target_class=""} in
    ignore (Lui_app.dispatch_event app (Lui_protocol.PressDetail (button,detail)));
    ignore (Lui_app.flush app);
    check "native Favorites opening keeps its row active without an external menu popover"
      (Runtime.signal_get (Option.get !sidebar).Sidebar_state.open_menu="lp-favorite-contract"
       && not (Hashtbl.fold (fun _ kind found -> found || kind=Lui_protocol.Popover)
         runtime.Lui_runtime.mounted_nodes false));
    let attachment=Hashtbl.fold (fun node kind found ->
      if kind=Lui_protocol.ContextMenu then Some node else found)
      runtime.Lui_runtime.mounted_nodes None |> Option.get in
    ignore (Lui_app.dispatch_event app (Lui_protocol.Dismiss attachment));
    ignore (Lui_app.flush app);
    check "native Menu dismissal clears the Favorites row's open appearance"
      (Runtime.signal_get (Option.get !sidebar).Sidebar_state.open_menu=""))

external bridge_platform_event : string -> int = "caml_logseq_test_platform_event"

let native_platform_exception_reporting () =
  let previous_control = Gc.get () in
  let calls = ref 0 in
  Fun.protect ~finally:(fun () ->
    Gc.set previous_control;
    Callback.register "lui_ocaml_platform_event" Native_embed.Ffi.platform_event) (fun () ->
    Gc.set {previous_control with minor_heap_size=4096};
    Callback.register "lui_ocaml_platform_event" (fun payload ->
      incr calls;
      let allocated = Array.init 1024 (fun i -> String.make 128 (Char.chr (65+i mod 26))) in
      Gc.full_major ();
      if payload="raise-platform-event" then
        failwith (String.concat "" ["platform-event-callback-";"regression"])
      else ignore (Sys.opaque_identity allocated));
    check "actual platform-event ABI reports a callback exception without crashing"
      (bridge_platform_event "raise-platform-event"=0);
    check "actual platform-event ABI remains callable after the exception"
      (bridge_platform_event "accept-platform-event"=1 && !calls=2))

let () =
  let owner = Thread.id (Thread.self ()) in
  let assert_owner () =
    check "native callbacks stay on their app owner" (Thread.id (Thread.self ()) = owner) in
  let dom = {Ui_dom_native.ops with Ui_services.emit_json = (fun name payload ->
    native_dom_events := !native_dom_events @ [name, Js.Json.parseExn payload];
    Ui_dom_native.ops.Ui_services.emit_json name payload)} in
  Platform.install_ui_services ~paints_caret:true ~assert_owner
    ~request_flush:(fun () -> ()) ~dom ~timers:Ui_dom_native.timers ~files:Ui_dom_native.files;
  Editor_clipboard_native.run ();
  native_platform_exception_reporting ();
  native_entry_admission ();
  editor_keyboard_capture_order ();
  native_worker_admission ();
  ordered_mailbox_barrier ();
  promise_observation ();
  abort_waits_for_initial_worker_and_skips_later_mutation_boundaries ();
  rejected_worker_still_waits_for_accepted_sibling ();
  abort_waits_for_detached_save_timer_and_its_model_continuation ();
  finite_timer_observation_and_cancel_race ();
  opaque_logical_save_does_not_release_or_self_poll_at_zero_activity ();
  sparse_feedback_materializes_while_held_through_actual_ffi ();
  native_outliner_content_events ();
  native_route_document_data ();
  persisted_journal_hash_links_delegate_through_the_native_owner ();
  native_click_delivery_follows_the_active_host_profile ();
  native_add_button_events_reach_the_shared_document_owner ();
  native_block_click_mounts_shared_editor ();
  native_graph_menu_contract ();
  native_favorite_menu_contract ();
  print_endline "PASS real native save/abort/worker/timer races and post-release draft safety"
