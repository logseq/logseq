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
    let global_key () =
      Native_embed.platform_event ("native-key\n" ^ Js.Json.stringify (Js.Json.object_list
        ["nodeId",Js.Json.number (float_of_int node); "key",Js.Json.string "Enter";
         "metaKey",Js.Json.boolean true; "ctrlKey",Js.Json.boolean false;
         "shiftKey",Js.Json.boolean false; "altKey",Js.Json.boolean false;
         "isComposing",Js.Json.boolean false; "repeat",Js.Json.boolean false]));
      ignore (Native_embed.pump ()) in
    global_key ();
    check "global native keyboard uses the same capture-before-conduit transaction"
      (!observed = ["capture"; "conduit"]);
    observed := []; consume := true;
    global_key ();
    check "global native key capture can consume the conduit exactly once" (!observed = ["capture"]);
    observed := []; consume := false;
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
  and prior_worker = !Runtime.worker and prior_model = !Runtime.read_model
  and prior_capture = Hashtbl.find_opt Platform.capture_listeners "pointerdown"
  and prior_click = Hashtbl.find_opt Platform.capture_listeners "click"
  and prior_state = !Editor_state.st
  and prior_fields = !Editor_state.field_sigs_opt in
  Fun.protect ~finally:(fun () ->
    Platform.event_target_of := prior_target;
    Runtime.worker := prior_worker; Runtime.read_model := prior_model;
    (match prior_capture with
     | Some listeners -> Hashtbl.replace Platform.capture_listeners "pointerdown" listeners
     | None -> Hashtbl.remove Platform.capture_listeners "pointerdown");
    (match prior_click with
     | Some listeners -> Hashtbl.replace Platform.capture_listeners "click" listeners
     | None -> Hashtbl.remove Platform.capture_listeners "click");
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
      let model={Model.initial with repo=Some "native-motion-fixture"} in
      let render_reads=ref 0 and unexpected_reads=ref [] in
      let request=Wire.Map [Wire.String "id",Wire.Uuid "native-motion";
        Wire.String "opts",Wire.Map [Wire.Keyword "render-data?",Wire.Bool true]] in
      Runtime.worker:=Some {Worker_client.invoke_fn=(fun method_ args ->
        if method_="thread-api/get-blocks"
           && args=[Wire.String "native-motion-fixture";Wire.Array [request]] then (
          incr render_reads;
          Js.Promise.resolve (Wire.Array [Wire.Map [
            Wire.String "id",Wire.Uuid "native-motion";
            Wire.String "block",Wire.Map [
              Wire.Keyword "block/uuid",Wire.Uuid "native-motion";
              Wire.Keyword "block.temp/positioned-properties",Wire.Map [];
              Wire.Keyword "block.temp/display-properties",Wire.Map [
                Wire.String "full-properties",Wire.Array [];
                Wire.String "hidden-properties",Wire.Array []]]]]))
        else (
          unexpected_reads:=method_::!unexpected_reads;
          Js.Promise.reject (Failure ("Unexpected native row fixture read: " ^ method_))));
        on_message=(fun _ _ -> ());dead=Js.Promise.liveness ()};
      Runtime.read_model:=(fun () -> model);
      let block = Model.empty_block ~uuid:"native-content" ~title:"Content target" ~is_page:false in
      let app = Lui_app.create_with_extensions backend registry model
        (fun model (_ : Action.t) -> model)
        (fun context _ _ ->
          Editor_state.ensure context;
          Lui_elements.column ~style_class:"ls-block"
          ~data_attrs:["data-blockid","native-content";"data-cid","main"]
          [ Tree.content_el "native-content" block
          ; Tree.control_wrap ~scope:"main" ~library:false "native-content" block
          ; Lui_elements.column ~key:"motion-fixture" ~style_class:"ls-block"
              ~data_attrs:["data-blockid","native-motion";"data-cid","main"]
              [Tree.row_main ~editable:false ~library:false "main"
                (Model.empty_block ~uuid:"native-motion" ~title:"Motion target" ~is_page:false)] ]) in
      Native_embed.current_app := Some app;
      Fun.protect ~finally:(fun () ->
        ignore (Lui_app.dispose app);
        ignore (Properties_state.live_areas ())) (fun () ->
        ignore (Lui_app.start app); ignore (Lui_app.flush app);
        Properties_data.flush_render_data (); Host.drain ();
        ignore (Lui_app.flush app);
        check "actual row motion fixture resolves one coalesced render-data request"
          (!render_reads=1 && !unexpected_reads=[]);
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
        let motion=Hashtbl.fold (fun node key found ->
          if key="main-native-motion" then Some node else found)
          runtime.Lui_runtime.runtime_reload_keys None |> Option.get in
        let motion_props=Hashtbl.find runtime.Lui_runtime.runtime_properties motion in
        check "only NSH main rows register the shared document motion owner"
          ((Lui_protocol.Property_map.find_opt Lui_protocol.PointerEnabled motion_props
            =Some (Lui_protocol.BoolValue true))=native);
        recorded:=[];
        List.iter (fun (button,buttons) ->
          let before=List.length !recorded in
          ignore (Native_embed.pointer_move motion 53. 71. 23 button "");
          check "one canonical main-row movement produces one document movement"
            (List.length !recorded=before+(if native then 1 else 0));
          if native then (
            let name,payload=List.hd (List.rev !recorded) in
            check "native movement preserves its row, coordinates, modifiers and held buttons"
              (name="pointermove" && match payload with
               | Js.Json.JObject fields ->
                   List.assoc_opt "nodeId" fields=Some (Js.Json.JNumber (float_of_int motion))
                   && List.assoc_opt "clientX" fields=Some (Js.Json.JNumber 53.)
                   && List.assoc_opt "clientY" fields=Some (Js.Json.JNumber 71.)
                   && List.assoc_opt "button" fields=Some (Js.Json.JNumber (float_of_int button))
                   && List.assoc_opt "buttons" fields=Some (Js.Json.JNumber (float_of_int buttons))
                   && List.assoc_opt "ctrlKey" fields=Some (Js.Json.boolean true)
                   && List.assoc_opt "shiftKey" fields=Some (Js.Json.boolean true)
                   && List.assoc_opt "metaKey" fields=Some (Js.Json.boolean true)
                   && List.assoc_opt "altKey" fields=Some (Js.Json.boolean true)
               | _ -> false))) [-1,0;0,1;1,4;2,2;3,8;4,16];
        let before=List.length !recorded in
        ignore (Native_embed.pointer_cancel motion 53. 71. 0 0 "");
        check "native cancellation reaches the document once without a held button"
          (List.length !recorded=before+(if native then 1 else 0)
           && (not native || match List.hd (List.rev !recorded) with
               | "pointercancel",Js.Json.JObject fields ->
                   List.assoc_opt "buttons" fields=Some (Js.Json.JNumber 0.)
               | _ -> false));
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
          let bullet_target = ref None in
          Hashtbl.replace Platform.capture_listeners "click" [fun payload ->
            bullet_target := (Ui_dom_native.ev_of payload).Ui_services.target];
          ignore (Native_embed.pointer_down bullet 9. 12. 0 0 "");
          ignore (Native_embed.pointer_up bullet 9. 12. 0 0 "");
          ignore (Native_embed.press_detail bullet 9. 12. 0 0 "");
          check "native bullet activation reaches the shared document owner once"
            (List.map fst !recorded=["pointerdown";"mousedown";"pointerup";"click"]);
          check "the native bullet retains its controller's prefixed target identity"
            (match !bullet_target with
             | Some target -> (match target.Ui_services.closest ".bullet-container" with
                 | Some bullet -> bullet.Ui_services.id () = "dot-native-content"
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
      (List.mem ("clipboard","[[" ^ uuid ^ "]]") !requests);
    let upload = Option.get (Editor_actions.capture_asset_upload ()) in
    Editor_actions.update_model uuid (fun model -> Edit_model.insert_text model "typed after paste ");
    ignore (Lui_app.flush app);
    check "an accepted file paste retains its owner while later typing proceeds"
      (Editor_actions.asset_upload_current upload);
    Editor_state.set (fun state -> {state with Editor_state.editing=None});
    ignore (Lui_app.flush app);
    check "ending the editor activation rejects a late file upload"
      (not (Editor_actions.asset_upload_current upload)))

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

external bridge_adversarial_callbacks : bool -> unit = "caml_logseq_test_adversarial_callbacks"

external bridge_press_modifiers : int -> int -> int = "caml_logseq_test_press_modifiers"

let native_alt_mask_through_actual_ffi () =
  let previous_app= !Native_embed.current_app and received=ref None in
  let backend : Lui_protocol.backend={
    backend_profile=Lui_protocol.profile Lui_protocol.MacOS Lui_protocol.NshHost;
    apply_batch=(fun _ -> true)} in
  let app=Lui_app.create backend Model.initial (fun model (_ : Action.t) -> model)
    (fun _ _ _ -> Lui_elements.button ~text:"Native modifier ABI"
      ~on_press:(function
        | Lui_protocol.PressModifiers (_,mask) -> received:=Some mask
        | _ -> failwith "Native modifier ABI lost the supplied mask") []) in
  Fun.protect ~finally:(fun () ->
    ignore (Lui_app.dispose app);Native_embed.current_app:=previous_app) (fun () ->
    Native_embed.current_app:=Some app;
    ignore (Lui_app.start app);ignore (Lui_app.flush app);
    let node=Lui_app.root_node app in
    check "actual native C/OCaml ABI preserves Alt alongside all existing mask bits"
      (bridge_press_modifiers node 31=1 && !received=Some 31))

let native_primitive_unit_results () =
  let previous_wakeup = !Host.wakeup_cb and previous_left = !Host.titlebar_left in
  Host.drain ();
  bridge_adversarial_callbacks true;
  Fun.protect ~finally:(fun () ->
    bridge_adversarial_callbacks false;
    Host.set_wakeup previous_wakeup;
    Host.drain ();
    Host.set_titlebar_left (float_of_int previous_left);
    Callback.register "lui_ocaml_platform_event" Native_embed.Ffi.platform_event) (fun () ->
    Host.set_wakeup Native_embed.wakeup;
    Callback.register "lui_ocaml_platform_event" Native_embed.Ffi.platform_event;
    check "actual native Host.enqueue returns unit after an adversarial void wakeup"
      (bridge_platform_event
        "window-titlebar\n{\"height\":32,\"left\":84,\"right\":0}" = 1);
    Host.drain ();
    check "actual native platform event retains its queued state change"
      (!Host.titlebar_left = 84);
    check "actual platform_request returns unit after an adversarial void service callback"
      (bridge_platform_event "update-abort\n{\"id\":\"999\"}" = 1);
    Callback.register "lui_ocaml_platform_event" (fun _ -> Native_embed.wakeup ());
    check "direct wakeup callback result is an OCaml unit"
      (bridge_platform_event "tail-wakeup" = 1);
    Callback.register "lui_ocaml_platform_event"
      (fun payload -> Native_embed.platform_request payload);
    check "direct platform request callback result is an OCaml unit"
      (bridge_platform_event "tail-platform-request" = 1))

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
      (bridge_platform_event "accept-platform-event"=1 && !calls=2);
    Callback.register "lui_ocaml_platform_event" Native_embed.Ffi.platform_event;
    check "actual platform handler preserves its original rejection after OCaml logging"
      (bridge_platform_event "window-titlebar\n{}"=0))

let native_settings_route_links () =
  let previous_app = !Native_embed.current_app and previous_settings = !Settings_state.st
  and previous_model = !Runtime.read_model and previous_flush = !Runtime.app_flush
  and previous_worker = !Runtime.worker and previous_target = !Platform.event_target_of
  and previous_parent = !Platform.dom_parent_of
  and previous_default = !Platform.post_dispatch_hook
  and previous_elements = !Dom_ext.doc_elements_provider
  and previous_subtree = !Dom_ext.subtree_elements_provider
  and previous_hash = !Platform.hash_ref and previous_back = !Platform.back_stack
  and previous_forward = !Platform.fwd_stack and previous_changes = !Platform.hash_change_fns
  and previous_coalescing = !Platform.coalesce_duplicate_clicks in
  let captures=Hashtbl.find_opt Platform.capture_listeners "click"
  and listeners=Hashtbl.find_opt Platform.window_listeners "click" in
  let restore table previous = match previous with
    | Some value -> Hashtbl.replace table "click" value
    | None -> Hashtbl.remove table "click" in
  let backend : Lui_protocol.backend = {
    backend_profile=Lui_protocol.profile Lui_protocol.MacOS Lui_protocol.NshHost;
    apply_batch=(fun _ -> true)} in
  let registry=Lui_extension.registry () in
  Logseq_el.register_all registry;
  Logseq_codemirror.register registry;Logseq_editor.register registry;
  Settings_state.st:=None;
  Runtime.worker:=Some {Worker_client.invoke_fn=(fun _ _ ->
    Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()));
    on_message=(fun _ _ -> ());dead=Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
  let app=Lui_app.create_with_extensions backend registry
    {Model.initial with repo=Some "route-link-contract"}
    (fun model (_ : Action.t) -> model)
    (fun context _ _ ->
      Settings_state.ensure context;
      let property_context : Properties_value.ctx={
        owner_key="route-property";block_uuid="route-property-owner";block_id=Some 77;
        refresh=(fun () -> ());is_page=false;class_schema=false} in
      let date=Wire.Map [Wire.Keyword "block/uuid",Wire.Uuid "11111111-1111-4111-8111-111111111111";
        Wire.Keyword "block/title",Wire.String "Date route";
        Wire.Keyword "block/journal-day",Wire.Int 20261110] in
      let row kind value=Wire.Map [Wire.Keyword "property-id",Wire.Keyword "fixture/date";
        Wire.Keyword "property",Wire.Map [Wire.Keyword "logseq.property/type",Wire.Keyword kind];
        Wire.Keyword "value",value] in
      let routed url=Ui_components.faded_link ~url ~text:url () in
      Lui_elements.column [Settings_page.general_pane ~modal:false context;
        Ui_components.faded_link ~key:"routed-faded" ~url:"#/page/faded-route" ~text:"Routed fixture" ();
        Properties_value.date_view ~jump_target:false ~hover:None property_context (row "datetime" date);
        Properties_value.many_dates_view ~jump_target:false ~hover:None property_context
          (row "date" (Wire.Set [date]));
        Lui_elements.popover ~role:`dialog ~at:(20.,20.)
          ~accessibility_identifier:"routed-popover-owner"
          [routed "#/page/popup%20route?graph-id=route-graph"];
        Lui_elements.dialog ~text:"Route scope fixture"
          ~accessibility_identifier:"routed-dialog-owner"
          [routed "#/";routed "#/all-pages"];
        Lui_elements.column
          (List.map routed ["assets/readme.md";"../readme.md";"/absolute/path";
            "//example.com/path";"?query=value";"#section";"#";
            "https://example.com/path";"mailto:fixture@example.com"])]) in
  Fun.protect ~finally:(fun () ->
    ignore (Lui_app.dispose app);Native_embed.current_app:=previous_app;
    Settings_state.st:=previous_settings;Runtime.read_model:=previous_model;
    Runtime.app_flush:=previous_flush;Runtime.worker:=previous_worker;
    Platform.event_target_of:=previous_target;Platform.dom_parent_of:=previous_parent;
    Platform.post_dispatch_hook:=previous_default;
    Dom_ext.doc_elements_provider:=previous_elements;Dom_ext.subtree_elements_provider:=previous_subtree;
    Platform.hash_ref:=previous_hash;Platform.back_stack:=previous_back;
    Platform.fwd_stack:=previous_forward;Platform.hash_change_fns:=previous_changes;
    Platform.coalesce_duplicate_clicks:=previous_coalescing;
    restore Platform.capture_listeners captures;restore Platform.window_listeners listeners) (fun () ->
    Native_embed.current_app:=Some app;
    Runtime.read_model:=(fun () -> Lui_app.model app);
    Runtime.app_flush:=(fun () -> ignore (Lui_app.flush app));
    Dom_ext.doc_elements_provider:=Native_embed.collect_elements;
    Dom_ext.subtree_elements_provider:=Native_embed.collect_subtree;
    let runtime=Lui_app.runtime app in
    Platform.event_target_of:=(fun node -> Some (Native_embed.ext_snapshot runtime node));
    Platform.dom_parent_of:=(fun node -> Hashtbl.find_opt runtime.Lui_runtime.runtime_parents node);
    Platform.post_dispatch_hook:=Dom_ext.default_event;
    Platform.coalesce_duplicate_clicks:=(fun () -> false);
    Hashtbl.remove Platform.capture_listeners "click";
    Hashtbl.remove Platform.window_listeners "click";
    let observed=ref [] in
    Platform.hash_change_fns:=[fun () -> observed:=Platform.location_hash ()::!observed];
    ignore (Lui_app.start app);ignore (Lui_app.flush app);
    List.iter (fun href ->
      let node=Hashtbl.fold (fun node props found ->
        if Lui_protocol.Property_map.find_opt Lui_protocol.UrlValue props
          =Some (Lui_protocol.StringValue href) then Some node else found)
        runtime.Lui_runtime.runtime_properties None |> Option.get in
      let props=Hashtbl.find runtime.Lui_runtime.runtime_properties node in
      check "actual Settings hash Links declare the application press owner before rendering"
        (Lui_protocol.Property_map.find_opt Lui_protocol.PressEnabled props
         =Some (Lui_protocol.BoolValue true));
      Platform.hash_ref:="#/settings";Platform.back_stack:=[];Platform.fwd_stack:=[];
      ignore (Native_embed.press_ex node 0);
      check "actual native Settings Link follows the existing hashchange route controller"
        (Platform.location_hash ()=href && List.hd !observed=href);
      Platform.history_back ();
      check "native Settings Link participates in the existing navigation history"
        (Platform.location_hash ()="#/settings"))
      ["#/file/logseq%2Fconfig.edn";"#/file/logseq%2Fcustom.css";"#/page/faded-route";
       "#/page/11111111-1111-4111-8111-111111111111";
       "#/page/" ^ Ui_services.uri_encode_component (Dates.journal_title_ymd ~y:2026 ~m:11 ~d:10);
       "#/page/popup%20route?graph-id=route-graph";"#/";"#/all-pages"];
    let find_url href=Hashtbl.fold (fun node props found ->
      if Lui_protocol.Property_map.find_opt Lui_protocol.UrlValue props
        =Some (Lui_protocol.StringValue href) then Some node else found)
      runtime.Lui_runtime.runtime_properties None |> Option.get in
    List.iter (fun href ->
      let props=Hashtbl.find runtime.Lui_runtime.runtime_properties (find_url href) in
      check "generic routing never grants arbitrary relative or external URLs an application handler"
        (Lui_protocol.Property_map.find_opt Lui_protocol.PressEnabled props
         <>Some (Lui_protocol.BoolValue true)))
      ["assets/readme.md";"../readme.md";"/absolute/path";"//example.com/path";
       "?query=value";"#section";"#";"https://example.com/path";"mailto:fixture@example.com"];
    let latest=find_url "#/page/faded-route" in
    Lui_runtime.set_prop runtime latest Lui_protocol.UrlValue
      (Lui_protocol.StringValue "#/page/updated%20destination?graph-id=retained-graph");
    ignore (Native_embed.press_ex latest 0);
    check "retained native Link activation reads its current authored URL"
      (Platform.location_hash ()="#/page/updated%20destination?graph-id=retained-graph");
    let owner=Hashtbl.fold (fun node props found ->
      if Lui_protocol.Property_map.find_opt Lui_protocol.AccessibilityIdentifier props
        =Some (Lui_protocol.StringValue "routed-popover-owner") then Some node else found)
      runtime.Lui_runtime.runtime_properties None |> Option.get in
    let scoped=find_url "#/page/popup%20route?graph-id=route-graph" in
    let previous_handlers=Hashtbl.find_opt Platform.dom_handlers owner in
    Fun.protect ~finally:(fun () -> match previous_handlers with
      | None -> Hashtbl.remove Platform.dom_handlers owner
      | Some handlers -> Hashtbl.replace Platform.dom_handlers owner handlers) (fun () ->
      let shifted=ref false in
      Platform.register_dom_handler owner ~events:"click" (fun _ payload ->
        shifted:=(match Option.map Js.Json.parseExn payload with
          | Some (Js.Json.JObject fields) -> List.assoc_opt "shiftKey" fields=Some (Js.Json.boolean true)
          | _ -> false);
        Platform.request_prevent ());
      Platform.hash_ref:="#/settings";
      ignore (Native_embed.press_ex scoped 2);
      check "scoped native Link consumers receive modifiers and can prevent route defaults"
        (!shifted && Platform.location_hash ()="#/settings")))

let native_point_property_scroll () =
  let previous_app = !Native_embed.current_app in
  let width=Host.inner_width () and height=Host.inner_height () in
  let selected=ref (-1) in
  let backend : Lui_protocol.backend={
    backend_profile=Lui_protocol.profile Lui_protocol.MacOS Lui_protocol.NshHost;
    apply_batch=(fun _ -> true)} in
  Host.set_window_size 800. 600.;
  let app=Lui_app.create backend Model.initial (fun model (_ : Action.t) -> model)
    (fun _ _ _ -> Properties_dialog.point_popup ~x:40. ~y:160.
      (Lui_elements.column ~accessibility_identifier:"point-rich-body"
        (List.init 200 (fun index ->
          Lui_elements.button ~key:(string_of_int index)
            ~accessibility_identifier:("point-item-" ^ string_of_int index)
            ~text:(string_of_int index) ~height:28
            ~on_press:(fun _ -> selected:=index) [])))) in
  Fun.protect ~finally:(fun () ->
    ignore (Lui_app.dispose app);Native_embed.current_app:=previous_app;
    Host.set_window_size width height) (fun () ->
    Native_embed.current_app:=Some app;
    ignore (Lui_app.start app);ignore (Lui_app.flush app);
    let runtime=Lui_app.runtime app in
    let find_kind kind=Hashtbl.fold (fun node current found ->
      if current=kind then Some node else found) runtime.Lui_runtime.mounted_nodes None |> Option.get in
    let find identifier=Hashtbl.fold (fun node props found ->
      if Lui_protocol.Property_map.find_opt Lui_protocol.AccessibilityIdentifier props
        =Some (Lui_protocol.StringValue identifier) then Some node else found)
      runtime.Lui_runtime.runtime_properties None |> Option.get in
    let owner=find_kind Lui_protocol.Scroll and popup=find_kind Lui_protocol.Popover in
    let body=find "point-rich-body" and last=find "point-item-199" in
    let property node prop=Lui_protocol.Property_map.find_opt prop
      (Hashtbl.find runtime.Lui_runtime.runtime_properties node) in
    check "long point property body has an actual bounded native Scroll owner"
      (Hashtbl.find runtime.Lui_runtime.runtime_parents owner=popup
       && property owner Lui_protocol.MaxHeight=Some (Lui_protocol.IntValue 432));
    check "long property content stays unbounded inside its native Scroll"
      (property body Lui_protocol.MaxHeight=None
       && property body Lui_protocol.MaxHeightViewport=None);
    ignore (Native_embed.press_ex last 0);
    check "point property content retains its mounted action handlers" (!selected=199);
    Host.set_window_size 800. 360.;
    Platform.emit_event "resize" (Js.Json.object_list []);
    ignore (Lui_app.flush app);
    check "point property viewport follows height-only resize without replacing content"
      (find_kind Lui_protocol.Scroll=owner && find "point-rich-body"=body
       && find "point-item-199"=last
       && property owner Lui_protocol.MaxHeight=Some (Lui_protocol.IntValue 192)
       && property popup Lui_protocol.AvailableHeight=Some (Lui_protocol.FloatValue 192.));
    Host.set_window_size 800. 120.;
    Platform.emit_event "resize" (Js.Json.object_list []);
    ignore (Lui_app.flush app);
    check "native point property bounds remain valid when its anchor exceeds the viewport"
      (property owner Lui_protocol.MaxHeight=Some (Lui_protocol.IntValue 0)
       && property popup Lui_protocol.AvailableHeight=Some (Lui_protocol.FloatValue 0.)))

let native_wide_reading_column () =
  let previous_settings= !Settings_state.st and previous_sidebar= !Sidebar_state.st_ref
  and previous_sidebar_model= !Sidebar_state.model_signal
  and previous_model= !Runtime.read_model and previous_app= !Native_embed.current_app
  and previous_provider= !Dom_ext.doc_elements_provider and previous_host= !Host.host_op
  and previous_wide=Ui_services.storage_get "wide-mode" in
  let requests=ref [] in
  Fun.protect ~finally:(fun () ->
    Settings_state.st:=previous_settings;Sidebar_state.st_ref:=previous_sidebar;
    Sidebar_state.model_signal:=previous_sidebar_model;Runtime.read_model:=previous_model;
    Native_embed.current_app:=previous_app;Dom_ext.doc_elements_provider:=previous_provider;
    Host.host_op:=previous_host;
    match previous_wide with
    | Some value -> Ui_services.storage_set "wide-mode" value
    | None -> Ui_services.storage_remove "wide-mode") (fun () ->
    List.iter (fun (os,host) -> List.iter (fun (saved,expected) ->
      Settings_state.st:=None;Sidebar_state.st_ref:=None;
      (match saved with
       | Some value -> Ui_services.storage_set "wide-mode" value
       | None -> Ui_services.storage_remove "wide-mode");
      let backend : Lui_protocol.backend={
        backend_profile=Lui_protocol.profile os host;
        apply_batch=(fun _ -> true)} in
      let app=Lui_app.create backend Model.initial
        (fun model -> function
          | Action.Navigate_to route -> {model with Model.route}
          | _ -> model)
        (fun context model _ ->
          let state value=Signal.state context.Lui_ui.ui_scheduler value in
          Sidebar_state.st_ref:=Some {Sidebar_state.favorites=state [];home_page=state None;
            favorite_drop=state None;recents=state [];nav_checked=state [];nav_tag_titles=state [];
            items=state [];open_menu=state "";groups_collapsed=state [];left_width=state 246.;
            right_fraction=state 0.3;viewport_w=state 1920.};
          Sidebar_state.model_signal:=Some model;
          Lui_elements.column ~accessibility_identifier:"app-container-wrapper"
            [Chrome.main_scroll model]) in
      Fun.protect ~finally:(fun () -> ignore (Lui_app.dispose app)) (fun () ->
        Native_embed.current_app:=Some app;
        Dom_ext.doc_elements_provider:=Native_embed.collect_elements;
        Runtime.read_model:=(fun () -> Lui_app.model app);
        Host.set_host_op (fun name payload ->
          let name=if name="dom-op" then
            String.sub payload 0 (String.index payload '\n') else name in
          requests:=name::!requests);
        ignore (Lui_app.start app);ignore (Lui_app.flush app);
        let runtime=Lui_app.runtime app in
        let column ()=Hashtbl.fold (fun node props found ->
          if Lui_protocol.Property_map.find_opt Lui_protocol.StyleClass props
            =Some (Lui_protocol.StringValue "cp__sidebar-main-content") then Some node else found)
          runtime.Lui_runtime.runtime_properties None |> Option.get in
        let retained=column () in
        let width ()=Lui_protocol.Property_map.find_opt Lui_protocol.MaxWidth
          (Hashtbl.find runtime.Lui_runtime.runtime_properties (column ())) in
        let expected_width wide=Lui_protocol.IntValue
          (if wide then Ui_theme.reading_width_wide_default else Ui_theme.reading_width_default) in
        check "native reading width restores raw and quoted preferences before boot"
          (Settings_state.wide_mode ()=expected && width ()=Some (expected_width expected));
        List.iter (fun wide ->
          Settings_state.toggle_wide_mode ();ignore (Lui_app.flush app);
          check "native wide mode updates its retained reading column through typed state"
            (column ()=retained && Settings_state.wide_mode ()=wide
             && width ()=Some (expected_width wide));
          check "wide mode persists the existing quoted storage representation"
            (Ui_services.storage_get "wide-mode"=Some (if wide then "\"true\"" else "\"false\"")))
          [not expected;expected];
        ignore (Lui_app.send app (Action.Navigate_to Model.All_pages));
        ignore (Lui_app.flush app);
        check "All pages retains its full-width native layout independently of wide mode"
          (column ()=retained && width ()=Some (Lui_protocol.IntValue 1920));
        check "wide mode never sends unsupported class mutation requests"
          (not (List.exists (fun name -> name="class-add" || name="class-remove") !requests))))
      [None,false;Some "true",true;Some "\"true\"",true;
       Some "false",false;Some "\"false\"",false;Some "invalid",false])
      [Lui_protocol.MacOS,Lui_protocol.NshHost;Lui_protocol.MacOS,Lui_protocol.GenericHost;
       Lui_protocol.IOS,Lui_protocol.SwiftUIHost;Lui_protocol.AndroidOS,Lui_protocol.KotlinHost])

let native_popup_placement_contract () =
  let previous_overlays = !Properties_state.view_overlays_state
  and previous_generation = !Properties_state.overlay_generation
  and previous_flush = !Runtime.app_flush in
  Fun.protect ~finally:(fun () ->
    Properties_state.view_overlays_state:=previous_overlays;
    Properties_state.overlay_generation:=previous_generation;
    Runtime.app_flush:=previous_flush) (fun () ->
    List.iter (fun host ->
      List.iter (fun (retained,right) ->
        Properties_state.view_overlays_state:=None;
        Runtime.app_flush:=(fun () -> ());
        let backend : Lui_protocol.backend={
          backend_profile=Lui_protocol.profile Lui_protocol.MacOS host;
          apply_batch=(fun _ -> true)} in
        let app=Lui_app.create backend Model.initial (fun model () -> model)
          (fun context _ _ ->
            let overlays=Properties_state.view_overlays_state_of context in
            let anchor={ (Ui_services.dom_body ()) with
              Ui_services.attr=(fun name ->
                if retained && name="id" then Some "popup-placement-trigger" else None);
              rect=(fun () -> 80.,100.,24.,12.);
              rect_pending=(fun () -> false)} in
            ignore (Properties_popup.open_from_anchor ~right anchor
              (Lui_elements.text ~value:"Placement regression" []));
            let popup=match Runtime.signal_get overlays with
              | [popup] -> popup.Properties_state.vo_view
              | _ -> failwith "Placement fixture requires one popup" in
            Lui_elements.column
              [Lui_elements.button ~accessibility_identifier:"popup-placement-trigger"
                 ~text:"Popup trigger" [];
               popup]) in
        Fun.protect ~finally:(fun () -> ignore (Lui_app.dispose app)) (fun () ->
          ignore (Lui_app.start app);ignore (Lui_app.flush app);
          let runtime=Lui_app.runtime app in
          let popup=Hashtbl.fold (fun node kind found ->
            if kind=Lui_protocol.Popover then Some node else found)
            runtime.Lui_runtime.mounted_nodes None |> Option.get in
          let props=Hashtbl.find runtime.Lui_runtime.runtime_properties popup in
          let property prop=Lui_protocol.Property_map.find_opt prop props in
          let has prop=Lui_protocol.Property_map.mem prop props in
          check "actual anonymous and retained popup branches satisfy the canonical contract"
            (Lui_protocol.node_properties_supported Lui_protocol.Popover props);
          if retained then
            check "retained popup uses only its trigger's element placement"
              (property Lui_protocol.AnchorTarget=Some (Lui_protocol.StringValue "popup-placement-trigger")
               && property Lui_protocol.AnchorValue=Some (Lui_protocol.StringValue (if right then "right" else "below"))
               && not (has Lui_protocol.PopupX || has Lui_protocol.PopupY))
          else
            check "anonymous popup uses only its measured point placement"
              (property Lui_protocol.PopupX=Some (Lui_protocol.FloatValue (if right then 100. else 80.))
               && property Lui_protocol.PopupY=Some (Lui_protocol.FloatValue (if right then 96. else 116.))
               && not (List.exists has [Lui_protocol.AnchorValue;Lui_protocol.AnchorTarget;
                   Lui_protocol.AnchorAlignmentValue;Lui_protocol.AnchorOffset;
                   Lui_protocol.AnchorAlignmentOffset]))))
        [false,false;false,true;true,false;true,true])
      [Lui_protocol.NshHost;Lui_protocol.GenericHost])

let native_cmdk_controlled_input () =
  let previous_app = !Native_embed.current_app
  and previous_provider = !Dom_ext.doc_elements_provider
  and previous_subtree = !Dom_ext.subtree_elements_provider
  and previous_host = !Host.host_op in
  let state = ref None and services = ref None and requests = ref [] in
  let backend : Lui_protocol.backend = {
    backend_profile=Lui_protocol.profile Lui_protocol.MacOS Lui_protocol.NshHost;
    apply_batch=(fun _ -> true)} in
  let app=Lui_app.create backend Model.initial (fun model (_ : Action.t) -> model)
    (fun context _ _ ->
      let svs=Cmdk_host.services ~host:(Lui_ui.host context) () in
      let st=Cmdk_state.make ~register:false context.Lui_ui.ui_scheduler svs in
      services:=Some svs;state:=Some st;
      Lui_elements.column ~style_class:"cp__cmdk"
        [Cmdk_view.input_row svs st;Cmdk_view.scroller svs st]) in
  Fun.protect ~finally:(fun () ->
    ignore (Lui_app.dispose app);Native_embed.current_app:=previous_app;
    Dom_ext.doc_elements_provider:=previous_provider;
    Dom_ext.subtree_elements_provider:=previous_subtree;Host.host_op:=previous_host) (fun () ->
    Native_embed.current_app:=Some app;
    Dom_ext.doc_elements_provider:=Native_embed.collect_elements;
    Dom_ext.subtree_elements_provider:=Native_embed.collect_subtree;
    Host.set_host_op (fun name payload ->
      let operation,body = if name="dom-op" then
        let boundary=String.index payload '\n' in
        String.sub payload 0 boundary,
        String.sub payload (boundary+1) (String.length payload-boundary-1)
      else name,payload in
      requests:=(operation,body)::!requests);
    ignore (Lui_app.start app);ignore (Lui_app.flush app);
    let st=Option.get !state and svs=Option.get !services in
    let runtime=Lui_app.runtime app in
    let input=Hashtbl.fold (fun node kind found ->
      if kind=Lui_protocol.Input then Some node else found)
      runtime.Lui_runtime.mounted_nodes None |> Option.get in
    let text () = Lui_protocol.Property_map.find_opt Lui_protocol.TextValue
      (Hashtbl.find runtime.Lui_runtime.runtime_properties input) in
    let query={js|中😀|js} in
    Cmdk_state.set_in st (fun view -> {view with input=query});
    svs.Cmdk_services.set_input_value query;
    ignore (Lui_app.flush app);
    check "native search query is rendered through its actual controlled input"
      (text ()=Some (Lui_protocol.StringValue query));
    svs.Cmdk_services.focus_input_init query;
    let deadline=Unix.gettimeofday () +. 1. in
    while not (List.exists (fun (name,_) -> name="set-selection-range") !requests)
          && Unix.gettimeofday () < deadline do
      Thread.delay 0.002;Host.drain ()
    done;
    check "native search restore focuses its original mounted input"
      (List.exists (fun (name,_) -> name="focus") !requests);
    check "restored Unicode search selects UTF-16 units instead of bytes"
      (List.exists (fun (name,payload) -> name="set-selection-range"
        && (let json=Yojson.Safe.from_string payload in
            Yojson.Safe.Util.member "end" json=`Int 3)) !requests);
    Cmdk_state.set_in st (fun view -> {view with input=""});
    svs.Cmdk_services.set_input_value "";
    ignore (Lui_app.flush app);
    check "native search clearing updates the same controlled input"
      (text ()=Some (Lui_protocol.StringValue "")
       && Hashtbl.mem runtime.Lui_runtime.mounted_nodes input);
    check "native search restore and clearing never send unsupported DOM set-value"
      (not (List.exists (fun (name,_) -> name="set-value") !requests));
    let legacy=Cmdk_host.services ~host:Lui_protocol.GenericHost () in
    legacy.Cmdk_services.set_input_value "legacy mirror";
    check "maintained native hosts keep their existing imperative input mirror"
      (List.exists (fun (name,_) -> name="set-value") !requests);
    let item=Cmdk_state.command_item svs
      {Cmdk_services.id="ui/toggle-left-sidebar";label="Native row scroll";
       i18n=false;sc="";dev=false} in
    let group={Cmdk_state.gid=Cmdk_state.G_commands;gtitle="Commands";
      gitems=[{item with idx=0}];gtotal=1;glimit=20;gexpanded=false;gfilter_active=false} in
    Cmdk_state.set_in st (fun view -> {view with groups=[group];hl = -1});
    ignore (Lui_app.flush app);
    requests:=[];
    Cmdk_state.move_hl st 1;
    check "actual native command keyboard navigation requests its mounted row and Scroll owner"
      (match !requests with
       | [("scroll-row-into-view",payload)] ->
           let json=Yojson.Safe.from_string payload in
           let node field=Yojson.Safe.Util.(json |> member field |> member "node-id" |> to_int) in
           Hashtbl.find runtime.Lui_runtime.mounted_nodes (node "scroller")=Lui_protocol.Scroll
           && Hashtbl.mem runtime.Lui_runtime.mounted_nodes (node "row")
           && node "scroller" <> node "row"
       | _ -> false))

let native_click_producers () =
  let previous_app = !Native_embed.current_app
  and previous_provider = !Dom_ext.doc_elements_provider
  and previous_subtree = !Dom_ext.subtree_elements_provider
  and previous_host = !Host.host_op
  and previous_model = !Runtime.read_model
  and previous_flush = !Runtime.app_flush
  and previous_reply = !Comments_ops.reply_focus_request in
  let key = ref None and requests = ref [] and activated = ref 0 in
  let initial=Model.initial in
  Runtime.read_model:=(fun () -> initial);
  Comments_ops.reply_focus_request:=None;
  let backend : Lui_protocol.backend = {
    backend_profile=Lui_protocol.profile Lui_protocol.MacOS Lui_protocol.NshHost;
    apply_batch=(fun _ -> true)} in
  let app=Lui_app.create backend initial (fun model (_ : Action.t) -> model)
    (fun _ _ _ -> Lui_elements.column
      [ Lui_elements.column ~accessibility_identifier:"area-native-click-comments"
          [Comments_view.add_box ~scope:"main" "native-click-comments"]
      ; Views_popup.menu_level ~pid:987 ~cls:""
          ~register:(fun handler -> key:=Some handler)
          [Views_popup.MItem ("Native keyboard action",fun () -> incr activated)] ]) in
  Fun.protect ~finally:(fun () ->
    ignore (Lui_app.dispose app);Native_embed.current_app:=previous_app;
    Dom_ext.doc_elements_provider:=previous_provider;
    Dom_ext.subtree_elements_provider:=previous_subtree;
    Host.host_op:=previous_host;Runtime.read_model:=previous_model;
    Runtime.app_flush:=previous_flush;Comments_ops.reply_focus_request:=previous_reply) (fun () ->
    Native_embed.current_app:=Some app;
    Runtime.read_model:=(fun () -> Lui_app.model app);
    Runtime.app_flush:=(fun () -> ignore (Lui_app.flush app));
    Dom_ext.doc_elements_provider:=Native_embed.collect_elements;
    Dom_ext.subtree_elements_provider:=Native_embed.collect_subtree;
    Host.set_host_op (fun name payload -> if name="dom-op" then
      let boundary=String.index payload '\n' in
      requests:=(String.sub payload 0 boundary,
        String.sub payload (boundary+1) (String.length payload-boundary-1))::!requests);
    ignore (Lui_app.start app);ignore (Lui_app.flush app);
    Comments_ops.reveal "native-click-comments";
    let handle=Option.get !key in
    List.iter (fun key -> handle (Ui_dom_native.ev_of
      (Js.Json.object_list ["key",Js.Json.string key]))) ["ArrowDown";"Enter"];
    let runtime=Lui_app.runtime app in
    let clicks=List.filter_map (fun (name,payload) -> if name="click" then
      Some Yojson.Safe.Util.(Yojson.Safe.from_string payload |> member "ref" |> member "node-id" |> to_int)
      else None) (List.rev !requests) in
    check "actual Comments and popup keyboard owners request native controller activation once"
      (match clicks with
       | [reply;menu] ->
           let props node=Hashtbl.find runtime.Lui_runtime.runtime_properties node in
           Lui_protocol.Property_map.find_opt Lui_protocol.StyleClass (props reply)
             =Some (Lui_protocol.StringValue "ls-comment-reply-placeholder")
           && Lui_protocol.Property_map.find_opt Lui_protocol.AccessibilityIdentifier (props menu)
             =Some (Lui_protocol.StringValue "vp987-i0")
       | _ -> false);
    check "native click producers do not also dispatch duplicate semantic presses" (!activated=0))

let native_menu_scope_retention () =
  let open Lui_elements in
  let previous_model = !Runtime.read_model and previous_flush = !Runtime.app_flush
  and previous_schedule = !Runtime.schedule_flush and previous_worker = !Runtime.worker
  and previous_sidebar = !Sidebar_state.st_ref and previous_sidebar_model = !Sidebar_state.model_signal
  and previous_hash = !Platform.hash_ref and previous_back = !Platform.back_stack
  and previous_forward = !Platform.fwd_stack and previous_lp_context = !Sidebar_state.lp_ctx in
  let page uuid title = Option.get (Decode.page_of_summary (Wire.Map [
    Wire.Keyword "block/uuid",Wire.Uuid uuid;Wire.Keyword "block/title",Wire.String title])) in
  let first=page "11111111-1111-4111-8111-111111111111" "First favorite"
  and second=page "22222222-2222-4222-8222-222222222222" "Second favorite" in
  let initial={Model.initial with repo=Some "menu-scope-a";
    repos=["menu-scope-a";"menu-scope-b"];route_page=Some first} in
  let app_ref=ref None and sidebar=ref None and toolbar_shape=ref None
  and view_instance=ref None in
  let published=Hashtbl.create 32 in
  let publications=ref 0 in
  let backend : Lui_protocol.backend={
    backend_profile=Lui_protocol.profile Lui_protocol.MacOS Lui_protocol.NshHost;
    apply_batch=(fun _ ->
      incr publications;
      Option.iter (fun app ->
        let runtime=Lui_app.runtime app in
        Hashtbl.iter (fun node kind -> if kind=Lui_protocol.Button then (
          let attached=List.exists (fun child ->
            Hashtbl.find_opt runtime.Lui_runtime.mounted_nodes child=Some Lui_protocol.ContextMenu)
            (Lui_runtime.children runtime node) in
          (match Hashtbl.find_opt published node with
           | Some previous when previous<>attached -> failwith (Printf.sprintf
               "Actual native menu publication changed retained Button %d from %b to %b"
               node previous attached)
           | _ -> ());
          Hashtbl.replace published node attached)) runtime.Lui_runtime.mounted_nodes) !app_ref;
      true)} in
  let registry=Lui_extension.registry () in
  Logseq_el.register_all registry;
  Logseq_codemirror.register registry;Logseq_editor.register registry;
  Runtime.worker:=Some {Worker_client.invoke_fn=(fun _ _ -> Js.Promise.resolve Wire.Nil);
    on_message=(fun _ _ -> ());dead=Js.Promise.liveness ()};
  Runtime.read_model:=(fun () -> initial);
  let app=Lui_app.create_with_extensions backend registry initial (fun _ next -> next)
    (fun context model _ ->
      let state value=Signal.state context.Lui_ui.ui_scheduler value in
      let st : Sidebar_state.t={favorites=state [first;second];home_page=state None;
        favorite_drop=state None;recents=state [];nav_checked=state [];nav_tag_titles=state [];
        items=state [];open_menu=state "";groups_collapsed=state [];left_width=state 246.;
        right_fraction=state 0.3;viewport_w=state 1440.} in
      sidebar:=Some st;Sidebar_state.st_ref:=Some st;Sidebar_state.model_signal:=Some model;
      let shape=state false in
      toolbar_shape:=Some shape;
      let inst=Views_state.make ~sched:context.Lui_ui.ui_scheduler
        ~kind:Views_state.KAllPages ~feature:"retained-menu" ~owner:Wire.Nil in
      view_instance:=Some inst;
      Lui_elements.column [Left_sidebar_view.graphs_selector st model;
        Chrome.dots_btn model;Left_sidebar_view.favorites_group st;
        reactive (fun leading ->
          Lui_elements.row ((if leading then
            [Views_head.action_button ~label:"Leading fixture action" []] else [])
            @ [Views_head.display_type_el inst;Views_head.more_actions_el inst]))
          (Signal.value shape);
        Lui_elements.text_field ~key:"menu-retained-editor"
          ~accessibility_identifier:"menu-retained-editor" ~text:"kept editor" []]) in
  app_ref:=Some app;
  Fun.protect ~finally:(fun () ->
    ignore (Lui_app.dispose app);Runtime.read_model:=previous_model;
    Runtime.app_flush:=previous_flush;Runtime.schedule_flush:=previous_schedule;
    Runtime.worker:=previous_worker;Sidebar_state.st_ref:=previous_sidebar;
    Sidebar_state.model_signal:=previous_sidebar_model;Sidebar_state.lp_ctx:=previous_lp_context;
    Platform.hash_ref:=previous_hash;Platform.back_stack:=previous_back;
    Platform.fwd_stack:=previous_forward) (fun () ->
    Runtime.read_model:=(fun () -> Lui_app.model app);
    Runtime.app_flush:=(fun () -> ignore (Lui_app.flush app));
    Runtime.schedule_flush:=Host.enqueue;
    ignore (Lui_app.start app);ignore (Lui_app.flush app);Host.drain ();
    let runtime=Lui_app.runtime app in
    let named identifier=Hashtbl.fold (fun node props found ->
      if Lui_protocol.Property_map.find_opt Lui_protocol.AccessibilityIdentifier props
        =Some (Lui_protocol.StringValue identifier) then Some node else found)
      runtime.Lui_runtime.runtime_properties None |> Option.get in
    let attachment node=match List.filter (fun child ->
      Hashtbl.find_opt runtime.Lui_runtime.mounted_nodes child=Some Lui_protocol.ContextMenu)
      (Lui_runtime.children runtime node) with
      | [menu] -> menu
      | _ -> failwith "Actual native trigger must retain exactly one direct Menu" in
    let graph=named "graphs-selector-trigger" and more=named "toolbar-dots-btn"
    and editor=named "menu-retained-editor" in
    let graph_menu=attachment graph and more_menu=attachment more in
    let favorite_menus ()=Hashtbl.fold (fun node props found ->
      if Lui_protocol.Property_map.find_opt Lui_protocol.StyleClass props
          =Some (Lui_protocol.StringValue "sidebar-page-actions ui__button") then
        (node,attachment node)::found else found) runtime.Lui_runtime.runtime_properties []
      |> List.sort compare in
    let favorite_ids=favorite_menus () in
    let display_id="vtype-" ^ string_of_int (Option.get !view_instance).Views_state.id in
    let display=named display_id in
    let display_menu=attachment display in
    List.iter (fun leading ->
      Signal.set (Option.get !toolbar_shape) leading;
      ignore (Lui_app.flush app);Host.drain ();
      check "actual view-type trigger retains its identity when neighboring actions shift"
        (named display_id=display && attachment display=display_menu)) [true;false;true;false];
    List.iter (fun model ->
      ignore (Lui_app.send app model);ignore (Lui_app.flush app);Host.drain ();
      check "actual graph and More updates retain trigger, menu and editor identities"
        (named "graphs-selector-trigger"=graph && attachment graph=graph_menu
         && named "toolbar-dots-btn"=more && attachment more=more_menu
         && named "menu-retained-editor"=editor))
      [{initial with repo=Some "menu-scope-b";repos=List.rev initial.repos};
       {initial with route=Model.Page "Second favorite";route_page=Some second};
       {initial with route_page=Some {first with page_title="Renamed favorite"}};
       {initial with route=Model.All_pages;route_page=None};initial];
    let st=Option.get !sidebar in
    List.iter (fun favorites ->
      Signal.set st.Sidebar_state.favorites favorites;
      ignore (Lui_app.flush app);Host.drain ();
      check "Favorites reorder and metadata changes retain their Buttons and Menu scopes"
        (favorite_menus ()=favorite_ids))
      [[second;first];[{second with page_title="Renamed second"};first];[first;second]];
    let action=Hashtbl.fold (fun node key found ->
      if key="qa-all" then Some node else found) runtime.Lui_runtime.runtime_reload_keys None |> Option.get in
    let expected=Runtime.nav_hash "#/graphs" in
    Platform.hash_ref:="#/retained-menu-action-fixture";
    ignore (Lui_app.dispatch_event app (Lui_protocol.Press action));
    (* Dispatch enqueues the retained handler; observe it after the same
       scheduler/host barrier used by the preceding menu updates. *)
    ignore (Lui_app.flush app);Host.drain ();
    check "retained graph action still owns its handler after prior scopes retire"
      (Platform.location_hash ()=expected);
    check "native menu invariant was inspected across actual publications" (!publications>5))

let native_file_request_lifetimes () =
  let previous_host= !Host.host_op and previous_nsh= !Browser_ui.native_dialogs in
  let gate=Update_admission.application in
  let previous_gate={gate with Update_admission.phase=gate.phase} in
  let scope=Ui_task.Activity.create () and requests=ref [] in
  let pending_callback=ref None and delivered=ref 0 in
  let pending ()=(Ui_task.Activity.snapshot scope).pending in
  let payload operation =
    let body=List.find_map (fun (name,body) -> if name=operation then Some body else None) !requests |> Option.get in
    Yojson.Safe.from_string body in
  let pick_id ()=Yojson.Safe.Util.(payload "open-file-picker" |> member "request" |> to_int) in
  let emit_pick id=Platform.emit_event "files-picked"
    (Js.Json.JObject ["request",Js.Json.JNumber (float_of_int id);"files",Js.Json.JArray [||]]) in
  let download_id ()=Yojson.Safe.Util.(payload "download-binary" |> member "request-id" |> to_string) in
  let emit_download id=Platform.emit_event "file-download-result"
    (Js.Json.JObject ["request-id",Js.Json.JString id;"cancelled",Js.Json.JBoolean true]) in
  Fun.protect ~finally:(fun () ->
    Browser_ui.cancel_requests ();Ui_task.Activity.close scope;
    Browser_ui.configure ~nsh:previous_nsh;Host.host_op:=previous_host;
    gate.phase<-previous_gate.phase;gate.released<-previous_gate.released;
    gate.latest<-previous_gate.latest;gate.save_finished<-previous_gate.save_finished) (fun () ->
    Browser_ui.configure ~nsh:true;Update_admission.reset gate;
    Host.set_host_op (fun name body ->
      check "native file requests retain the existing host envelope" (name="dom-op");
      let boundary=String.index body '\n' in
      requests:=(String.sub body 0 boundary,
        String.sub body (boundary+1) (String.length body-boundary-1))::!requests);
    Ui_task.Activity.within scope (fun () ->
      Browser_ui.open_file_picker ~accept:".md,.txt" (fun _ ->
        incr delivered;
        ignore (Js.Promise.make (fun ~resolve ~reject:_ -> pending_callback:=Some resolve))));
    let first=pick_id () in
    check "accepted native picker participates in update activity" (pending ()=1);
    emit_pick first;
    check "native picker completion retains its callback observation context"
      (!delivered=1 && pending ()=1);
    (Option.get !pending_callback) ();pending_callback:=None;
    check "native picker callback completion releases its existing activity" (pending ()=0);
    emit_pick first;
    check "a duplicate picker reply cannot invoke its callback twice" (!delivered=1);
    Ui_task.Activity.within scope (fun () ->
      Browser_ui.download_binary ~filename:"fixture.bin" ~mime:"application/octet-stream" "\000\255A\000");
    let download=download_id () in
    check "native export preserves binary bytes and tracks native Save completion"
      (pending ()=1
       && Yojson.Safe.Util.(payload "download-binary" |> member "data-b64" |> to_string)="AP9BAA==");
    emit_download download;
    check "native Save cancellation releases accepted work" (pending ()=0);
    Ui_task.Activity.within scope (fun () ->
      Browser_ui.open_file_picker (fun _ -> incr delivered));
    let fenced=pick_id () in
    Update_admission.begin_prepare gate "1";
    refused "file-picker" (fun () -> Browser_ui.open_file_picker (fun _ -> incr delivered));
    refused "file-download" (fun () ->
      Browser_ui.download_text ~filename:"fixture.txt" ~mime:"text/plain" "x");
    emit_pick fenced;
    check "a picker completion during update preparation releases work without new UI actions"
      (!delivered=1 && pending ()=0);
    Update_admission.reset gate;
    Ui_task.Activity.within scope (fun () ->
      Browser_ui.open_file_picker (fun _ -> incr delivered);
      Browser_ui.download_binary ~filename:"retired.bin" ~mime:"application/octet-stream" "x");
    let retired=pick_id () and retired_download=download_id () in
    check "native owner retains only its outstanding file requests" (pending ()=2);
    Browser_ui.cancel_requests ();
    check "native retirement releases every file completion hook" (pending ()=0);
    emit_pick retired;emit_download retired_download;
    check "late native file replies cannot invoke a retired callback" (!delivered=1);
    Browser_ui.configure ~nsh:false;
    Browser_ui.download_binary ~filename:"legacy.bin" ~mime:"application/octet-stream" "x";
    check "other native hosts retain their existing download payload"
      (Yojson.Safe.Util.(payload "download-binary" |> member "request-id")=`Null))

let native_controlled_field_resets () =
  let previous_model= !Runtime.read_model and previous_flush= !Runtime.app_flush
  and previous_schedule= !Runtime.schedule_flush and previous_worker= !Runtime.worker
  and previous_host= !Host.host_op
  and previous_popup= !Editor_commands.active and previous_popup_signal= !Editor_commands.popup_vs in
  let repeat : Editor_commands.repeat={prop_id=1;repeated=true;freq=2;unit_id=1;
    unit_choices=[];rtype_id=1;rtype_choices=[];when_id=1;when_choices=[]} in
  let popup : Editor_commands.popup={kind=Cal_insert "";uuid="frequency-reset-owner";
    from=0;cy=2026;cm=11;cd=12;hour=0;tmin=0;x=0.;y=0.;menu=None;rpt=Some repeat} in
  Editor_commands.active:=Some popup;Editor_commands.popup_vs:=None;
  let pending=ref None and writes=ref 0 and dom_operations=ref [] in
  Runtime.worker:=Some {Worker_client.invoke_fn=(fun method_ _ ->
    if method_="thread-api/apply-outliner-ops" then (
      incr writes;
      Js.Promise.make (fun ~resolve ~reject:_ -> pending:=Some resolve))
    else Js.Promise.resolve Wire.Nil);
    on_message=(fun _ _ -> ());dead=Js.Promise.liveness ()};
  let publications=ref 0 in
  let backend : Lui_protocol.backend={
    backend_profile=Lui_protocol.profile Lui_protocol.MacOS Lui_protocol.NshHost;
    apply_batch=(fun _ -> incr publications;true)} in
  let initial={Model.initial with repo=Some "field-reset-owner"} in
  Runtime.read_model:=(fun () -> initial);
  let app=Lui_app.create backend initial
    (fun model (_ : Action.t) -> model)
    (fun context _ _ ->
      let ps=Signal.value (Editor_commands.popup_vs_of context) in
      Lui_elements.column [Editor_commands.freq_input ps;Comments.add_box "legacy-comment"]) in
  Fun.protect ~finally:(fun () ->
    Option.iter (fun resolve -> resolve Wire.Nil) !pending;
    ignore (Lui_app.dispose app);Runtime.read_model:=previous_model;
    Runtime.app_flush:=previous_flush;Runtime.schedule_flush:=previous_schedule;
    Host.host_op:=previous_host;
    Runtime.worker:=previous_worker;Editor_commands.active:=previous_popup;
    Editor_commands.popup_vs:=previous_popup_signal) (fun () ->
    Runtime.read_model:=(fun () -> Lui_app.model app);
    Host.set_host_op (fun operation payload ->
      if operation="dom-op" then begin
        let boundary=String.index payload '\n' in
        dom_operations:=String.sub payload 0 boundary :: !dom_operations
      end;
      previous_host operation payload);
    Runtime.app_flush:=(fun () -> ignore (Lui_app.flush app));
    Runtime.schedule_flush:=Host.enqueue;
    ignore (Lui_app.start app);ignore (Lui_app.flush app);
    let runtime=Lui_app.runtime app in
    let named identifier=Hashtbl.fold (fun node props found ->
      if Lui_protocol.Property_map.find_opt Lui_protocol.AccessibilityIdentifier props
        =Some (Lui_protocol.StringValue identifier) then Some node else found)
      runtime.Lui_runtime.runtime_properties None |> function
      | Some node -> node
      | None -> failwith ("actual native controlled field is missing: " ^ identifier) in
    let frequency=named "calendar-repeat-frequency"
    and comment=named "comment-reply-legacy-comment" in
    let comment_submit=Hashtbl.fold (fun node key found ->
      if key="cas-legacy-comment" then Some node else found)
      runtime.Lui_runtime.runtime_reload_keys None |> Option.get in
    let flush ()=ignore (Lui_app.flush app);Host.drain () in
    let text node=Option.bind (Hashtbl.find_opt runtime.Lui_runtime.runtime_properties node)
      (Lui_protocol.Property_map.find_opt Lui_protocol.TextValue) in
    let type_ node value=ignore (Lui_app.dispatch_event app (Lui_protocol.TextChanged (node,value)));flush () in
    let settle ()=match !pending with
      | None -> failwith "native controlled field write was not sent"
      | Some resolve -> pending:=None;resolve Wire.Nil;flush () in
    List.iter (fun invalid ->
      type_ frequency invalid;
      ignore (Lui_app.dispatch_event app (Lui_protocol.Submit frequency));flush ();
      check "invalid native frequency restores its actual controlled field without a write"
        (text frequency=Some (Lui_protocol.StringValue "2") && !writes=0))
      ["";"0";"-2";"invalid"];
    type_ frequency "3";
    ignore (Lui_app.dispatch_event app (Lui_protocol.Submit frequency));flush ();
    check "valid native frequency commits through its actual calendar owner"
      (text frequency=Some (Lui_protocol.StringValue "3") && !writes=1);
    settle ();
    type_ frequency "99";
    Editor_commands.update_rpt (fun current -> {current with freq=8});flush ();
    check "external calendar frequency replaces an older local draft on the retained field"
      (named "calendar-repeat-frequency"=frequency && text frequency=Some (Lui_protocol.StringValue "8"));
    type_ comment "First reply";
    ignore (Lui_app.dispatch_event app (Lui_protocol.Press comment_submit));flush ();
    type_ comment "Newer reply";settle ();
    check "asynchronous comment success preserves a newer draft on the retained textarea"
      (named "comment-reply-legacy-comment"=comment && text comment=Some (Lui_protocol.StringValue "Newer reply"));
    ignore (Lui_app.dispatch_event app (Lui_protocol.Press comment_submit));flush ();settle ();
    check "successful current comment clears through its controlled textarea owner"
      (text comment=Some (Lui_protocol.StringValue ""));
    type_ comment "Detached reply";
    ignore (Lui_app.dispatch_event app (Lui_protocol.Press comment_submit));flush ();
    ignore (Lui_app.dispose app);
    let after_disposal= !publications in
    settle ();
    check "a detached comment owner does not publish an asynchronous field reset"
      (!publications=after_disposal);
    check "actual native calendar and comment fields never emit imperative DOM setters"
      (not (List.exists (fun operation ->
        operation="set-value" || operation="set-text-content") !dom_operations)))

let native_owned_child_exit_proof () =
  List.iter (fun (code, fail_registration) ->
    let executable, arguments =
      if Sys.os_type="Win32" then
        let executable = Filename.concat (Sys.getenv "SystemRoot")
          "System32/WindowsPowerShell/v1.0/powershell.exe" in
        executable, [| executable; "-NoLogo"; "-NoProfile"; "-NonInteractive";
          "-Command"; Printf.sprintf "$null=[Console]::ReadLine(); exit %d" code |]
      else "/bin/sh", [| "/bin/sh"; "-c"; Printf.sprintf "read gate; exit %d" code |] in
    let read_end, write_end = Unix.pipe ~cloexec:true () in
    let null = Unix.openfile (if Sys.os_type="Win32" then "NUL" else "/dev/null")
      [Unix.O_WRONLY] 0 in
    let registered = ref None in
    let pid, child = Fun.protect ~finally:(fun () -> Unix.close read_end; Unix.close null)
      (fun () ->
        try
          let pid, child = Daemon_client.Child_process.spawn ~on_created:(fun child ->
            registered := Some child;
            if fail_registration then failwith "private-child-registration-probe")
            executable arguments (Unix.environment ()) read_end null null in
          Some pid, child
        with Failure message when fail_registration && message="private-child-registration-probe" ->
          None, Option.get !registered) in
    Option.iter (fun pid -> check "actual child process ID is positive" (pid>0)) pid;
    check "the opaque child remains available even when startup publication raises before OS-PID lookup"
      (Option.is_some !registered && (Option.is_none pid = fail_registration));
    let output = Unix.out_channel_of_descr write_end in
    let sent = ref false in
    let finish () = if not !sent then begin
      sent := true; output_string output "finish\n"; close_out output
    end in
    Fun.protect ~finally:finish (fun () ->
      check "captured child remains alive before its explicit private gate"
        (Daemon_client.Child_process.poll child=None);
      (match Daemon_client.Child_process.await_clean_exit ~timeout:0. child with
       | () -> failwith "A live child cannot prove completed worker shutdown"
       | exception Failure message -> check "unknown exit keeps shutdown unproven"
           (message="Owned worker exit is unproven after stop dispatch"));
      finish ();
      if code=0 then begin
        Daemon_client.Child_process.await_clean_exit ~timeout:5. child;
        check "exact child exit proof is retained after its OS handle is consumed"
          (Daemon_client.Child_process.poll child=Some (Unix.WEXITED 0))
      end else
        match Daemon_client.Child_process.await_clean_exit ~timeout:5. child with
        | () -> failwith "Nonzero child exit must not certify clean shutdown"
        | exception Failure message -> check "nonzero exit is explicitly refused"
            (message="Owned worker exited unsuccessfully: 7"))) [0,false;7,false;0,true]

let native_worker_update_identity () =
  let key = ("/store", "/store/graphs", "/store/lifecycle", "logseq_db_origin") in
  let origin : Daemon_client.worker_origin = {
    pid = 4321; port = 12345; executable = "/app/logseq-db-worker";
    session = "01234567-0123-4567-89ab-0123456789ab";
    instance = "11234567-0123-4567-89ab-0123456789ab"
  } in
  let health ?(pid=origin.pid) ?(instance=origin.instance) ?(shared=false)
      ?(generation="graph-generation") ?(ticket=`Null) ?(revision="worker-code") () =
    Yojson.Safe.to_string (`Assoc [
      "pid", `Int pid; "port", `Int origin.port; "repo", `String "logseq_db_origin";
      "status", `String "ready"; "owner-source", `String "electron";
      "generation", `String generation; "ticket", ticket; "revision", `String revision;
      "storage", `Assoc [ "root", `String "/store"; "graphsDir", `String "/store/graphs";
        "lifecycleDir", `String "/store/lifecycle" ];
      "nsh-app-ownership", `Assoc [ "session", `String origin.session;
        "instance", `String instance; "executable", `String origin.executable;
        "shared", `Bool shared ] ]) in
  let inspect body = Daemon_client.inspect_update_worker ~key ~origin body in
  let first = inspect (health ()) in
  check "actual child provenance retains the sampled current generation"
    (first.origin = origin && first.generation = "graph-generation" && first.ticket = None);
  let changed = inspect (health ~generation:"next-generation" ~ticket:(`String "next-ticket")
    ~revision:"new-worker-revision" ()) in
  check "graph ticket and revision are observations rather than immutable process ownership"
    (changed.origin = origin && changed.generation = "next-generation"
     && changed.ticket = Some "next-ticket" && changed.revision = "new-worker-revision");
  let reject label body =
    match inspect body with
    | _ -> failwith ("Update worker identity unexpectedly admitted: " ^ label)
    | exception Failure _ -> () in
  reject "reused pid" (health ~pid:9999 ());
  reject "same-pid replacement instance" (health ~instance:"replacement" ());
  reject "owned child later shared by another consumer" (health ~shared:true ());
  reject "owner-source alone is not ownership" "{\"owner-source\":\"electron\"}";
  let calls = ref 0 in
  let fetch ~port ~path =
    incr calls;
    check "worker identity only queries its exact loopback health endpoint"
      (port = origin.port && path = "/healthz");
    Some (200, health ()) in
  check "actual ownership verifier accepts the complete exact child descriptor"
    (List.length (Daemon_client.verify_update_workers ~fetch [key, Some origin]) = 1);
  let before = !calls in
  (match Daemon_client.verify_update_workers ~fetch [key, None] with
   | _ -> failwith "reused or externally owned workers must refuse preparation"
   | exception Failure _ -> ());
  check "refusing reused workers never sends them a management request" (!calls = before);
  let old_session = Sys.getenv_opt "LOGSEQ_NSH_APP_SESSION"
  and old_instance = Sys.getenv_opt "LOGSEQ_NSH_WORKER_INSTANCE" in
  let environment = Daemon_client.worker_environment ~session:origin.session ~instance:origin.instance
    |> Array.to_list in
  let matching prefix = List.filter (String.starts_with ~prefix) environment in
  check "child environment carries exactly one explicit process-origin stamp"
    (matching "LOGSEQ_NSH_APP_SESSION=" = ["LOGSEQ_NSH_APP_SESSION=" ^ origin.session]
     && matching "LOGSEQ_NSH_WORKER_INSTANCE=" = ["LOGSEQ_NSH_WORKER_INSTANCE=" ^ origin.instance]);
  check "worker origin never changes the parent application's environment"
    (Sys.getenv_opt "LOGSEQ_NSH_APP_SESSION" = old_session
     && Sys.getenv_opt "LOGSEQ_NSH_WORKER_INSTANCE" = old_instance)

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
  native_primitive_unit_results ();
  native_alt_mask_through_actual_ffi ();
  Editor_clipboard_native.async_file_read_keeps_the_application_owner_responsive ();
  native_settings_route_links ();
  native_cmdk_controlled_input ();
  native_click_producers ();
  native_point_property_scroll ();
  native_wide_reading_column ();
  native_popup_placement_contract ();
  native_controlled_field_resets ();
  native_file_request_lifetimes ();
  native_entry_admission ();
  editor_keyboard_capture_order ();
  native_worker_admission ();
  native_worker_update_identity ();
  native_owned_child_exit_proof ();
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
  native_menu_scope_retention ();
  native_favorite_menu_contract ();
  print_endline "PASS real native save/abort/worker/timer races and post-release draft safety"
