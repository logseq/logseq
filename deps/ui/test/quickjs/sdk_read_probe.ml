open Plugin_protocol

let check name value = if not value then failwith name
let repo = "logseq_db_quickjs_sdk_probe"
let uuid = "00000000-0000-0000-0000-000000000099"
let first_uuid = "00000000-0000-0000-0000-000000000100"
let last_uuid = "00000000-0000-0000-0000-000000000101"
let model = ref Model.initial

let spin ready =
  let deadline = Unix.gettimeofday () +. 20. in
  let rec loop () =
    Host.drain ();
    if not (ready ()) then begin
      if Unix.gettimeofday () > deadline then failwith "probe deadline";
      Thread.delay 0.001;
      loop ()
    end
  in
  loop ()

let promise task =
  spin (fun () -> match task.Js.Promise.state with Js.Promise.Pending -> false | _ -> true);
  match task.Js.Promise.state with
  | Js.Promise.Resolved value -> value
  | Js.Promise.Rejected error -> raise error
  | Js.Promise.Pending -> assert false

let task pending =
  let result = ref None in
  let observer = Ui_task.bind pending (fun value -> result := Some (Ok value); Ui_task.resolve ()) in
  ignore (Ui_task.catch observer (fun error -> result := Some (Error error); Ui_task.resolve ()));
  spin (fun () -> Option.is_some !result);
  match !result with Some (Ok value) -> value | Some (Error error) -> raise error | None -> assert false

let success = function
  | Ok value -> value
  | Error error -> failwith (error_name error)

let source path =
  let channel = open_in_bin path in
  Fun.protect ~finally:(fun () -> close_in channel)
    (fun () -> really_input_string channel (in_channel_length channel))

let cleanup () =
  List.iter (fun (pid, _) ->
    try match Unix.waitpid [Unix.WNOHANG] pid with
    | 0, _ -> Unix.kill pid Sys.sigterm; ignore (Unix.waitpid [] pid)
    | _ -> ()
    with Unix.Unix_error (Unix.ECHILD, _, _) -> ()) (Daemon_client.read_server_list ())

let run path =
  let root = Sys.getenv "LOGSEQ_ROOT_DIR" in
  check "probe requires an owned root"
    (Sys.file_exists (Filename.concat root ".quickjs-sdk-probe"));
  let owner = Thread.id (Thread.self ()) in
  let assert_owner () = check "owner thread" (Thread.id (Thread.self ()) = owner) in
  Platform.install_ui_services ~paints_caret:true ~assert_owner ~request_flush:(fun () -> ())
    ~dom:Ui_dom_native.ops ~timers:Ui_dom_native.timers ~files:Ui_dom_native.files;
  Runtime.read_model := (fun () -> !model);
  let worker = Worker_client.create () in
  Runtime.worker := Some worker;
  let invoke name args = promise (Worker_client.invoke worker name args) in
  ignore (invoke "thread-api/create-or-open-db" [Wire.String repo; Wire.Map []]);
  let page = Wire.Map [
    Wire.kw "block/name", Wire.String "quickjs sdk probe";
    Wire.kw "block/title", Wire.String "quickjs sdk probe";
    Wire.kw "block/uuid", Wire.Uuid uuid;
    Wire.kw "block/created-at", Wire.Int 1;
    Wire.kw "block/updated-at", Wire.Int 1;
    Wire.kw "block/tags", Wire.Set [Wire.kw "logseq.class/Page"];
  ] in
  ignore (invoke "thread-api/transact" [Wire.String repo; Wire.Array [page]; Wire.Nil; Wire.Nil]);
  let block block_uuid parent order title = Wire.Map [
    Wire.kw "block/uuid", Wire.Uuid block_uuid;
    Wire.kw "block/title", Wire.String title;
    Wire.kw "block/order", Wire.String order;
    Wire.kw "block/created-at", Wire.Int 1;
    Wire.kw "block/updated-at", Wire.Int 1;
    Wire.kw "block/parent", Wire.Array [Wire.kw "block/uuid"; Wire.Uuid parent];
    Wire.kw "block/page", Wire.Array [Wire.kw "block/uuid"; Wire.Uuid uuid]] in
  ignore (invoke "thread-api/transact" [Wire.String repo; Wire.Array [
    block first_uuid uuid "a0" "first";
    block last_uuid uuid "a1" "last";
    block "00000000-0000-0000-0000-000000000102" first_uuid "a0" "nested"];
    Wire.Nil; Wire.Nil]);
  let page = match Decode.page_of_summary page with Some page -> page | None -> failwith "page" in
  let source_page = "00000000-0000-0000-0000-000000000103" in
  let reference source_page suffix order = match block
      ("00000000-0000-0000-0000-000000000" ^ suffix) source_page order "[[quickjs sdk probe]]" with
    | Wire.Map fields -> Wire.Map ((Wire.kw "block/refs", Wire.Set [Wire.Array [Wire.kw "block/uuid"; Wire.Uuid uuid]])
        :: (Wire.kw "block/page", Wire.Array [Wire.kw "block/uuid"; Wire.Uuid source_page])
        :: List.filter (fun (key, _) -> key <> Wire.kw "block/page") fields)
    | _ -> assert false in
  let source_page_map uuid title = Wire.Map [Wire.kw "block/uuid", Wire.Uuid uuid;
    Wire.kw "block/name", Wire.String title; Wire.kw "block/title", Wire.String title;
    Wire.kw "block/tags", Wire.Set [Wire.kw "logseq.class/Page"];
    Wire.kw "block/created-at", Wire.Int 1; Wire.kw "block/updated-at", Wire.Int 1] in
  let other_page = "00000000-0000-0000-0000-000000000106" in
  ignore (invoke "thread-api/transact" [Wire.String repo; Wire.Array [
    source_page_map source_page "quickjs source page";
    source_page_map other_page "quickjs other source page";
    reference source_page "104" "a0"; reference other_page "107" "a0";
    reference source_page "105" "a1"]; Wire.Nil; Wire.Nil]);
  let property = Wire.kw "plugin.property.sdk-probe/score" in
  ignore (invoke "thread-api/apply-outliner-ops" [Wire.String repo; Wire.Array [
    Wire.Array [Wire.kw "upsert-property"; Wire.Array [property;
      Wire.Map [Wire.kw "logseq.property/type", Wire.kw "number"; Wire.kw "db/cardinality", Wire.kw "db.cardinality/one"];
      Wire.Map [Wire.kw "property-name", Wire.String "score"]]];
    Wire.Array [Wire.kw "set-block-property"; Wire.Array [Wire.Uuid first_uuid; property; Wire.Int 7]];
    Wire.Array [Wire.kw "set-block-property"; Wire.Array [Wire.Uuid first_uuid; Wire.kw "block/collapsed?"; Wire.Bool true]]]; Wire.Map []]);
  model := { Model.initial with repo = Some repo; route = Model.Page page.Model.page_title;
    route_page = Some page };
  let scheduler = Signal.scheduler () in
  let backend = { Lui_protocol.backend_profile = Lui_protocol.profile Lui_protocol.MacOS Lui_protocol.GenericHost;
    apply_batch = (fun _ -> true) } in
  let application = Lui_runtime.create scheduler backend in
  let scope = Signal.scope "sdk-probe" in
  Editor_state.ensure (Lui_ui.context application scope);
  let editing = Editor_state.mk_editing ~uuid ~buffer:"unsaved probe text" ~scope:"main" ~base:"quickjs sdk probe" () in
  Editor_state.set_silent (fun state -> {state with editing = Some editing});
  let id = success (plugin_id "sdk-probe") in
  let source = source path in
  let grants = [Editor_read; Graph_read; Db_query] in
  for mask = 0 to 7 do
    let id = success (plugin_id ("sdk-probe-grants-" ^ string_of_int mask)) in
    let grants = List.filter_map (fun (bit, capability) ->
      if mask land bit <> 0 then Some capability else None)
      [1, Editor_read; 2, Graph_read; 4, Db_query] in
    let grants = List.rev (grants @ grants) in
    let runner = task (Plugin_host.load_read_plugin ~id ~grants ~source) |> success in
    Plugin_host.unload_read_plugin runner
  done;
  let runner = task (Plugin_host.load_read_plugin ~id ~grants ~source) |> success in
  Plugin_host.unload_read_plugin runner;
  Plugin_host.unload_read_plugin runner;
  check "graph permission" (task (Plugin_host.load_read_plugin ~id ~grants:[Editor_read] ~source) = Error Permission_denied);
  let services, reads = Plugin_read_services.capture ~id in
  let broker = Plugin_broker.create () in
  let session = Plugin_broker.open_session broker id [Graph_read] in
  let invocation = Plugin_broker.begin_invocation ~reads broker session services in
  let sibling = task (Plugin_broker.get_sibling_block broker session invocation
    ~direction:Next_sibling (Uuid first_uuid)) |> success in
  check "typed OCaml sibling read"
    (Option.map (fun value -> Json.get "uuid" (reply_value (Block (Some value)))) sibling
      = Some (Some (Json.String last_uuid)));
  let pending_sibling = Plugin_broker.get_sibling_block broker session invocation
    ~direction:Previous_sibling (Uuid last_uuid) in
  let pending = reads.get_block (Uuid uuid) in
  let pending_tree = Plugin_broker.get_block_tree broker session invocation (Uuid first_uuid) in
  let pending_refs = Plugin_broker.get_page_linked_references broker session invocation (Uuid uuid) in
  model := {!model with context_revision = (!model).context_revision + 1};
  check "late reply must be stale" (task pending = Error Stale_context);
  check "late sibling reply must be stale" (task pending_sibling = Error Stale_context);
  check "late tree reply must be stale" (task pending_tree = Error Stale_context);
  check "late reference reply must be stale" (task pending_refs = Error Stale_context);
  Plugin_broker.close_session broker session;
  check "read runner cannot receive command grants"
    (task (Plugin_host.load_read_plugin ~id ~grants:[Editor_command] ~source) = Error Permission_denied);
  model := Model.initial;
  Editor_state.set_silent (fun state -> {state with editing = None});
  let id = success (plugin_id "sdk-probe-empty") in
  let runner = task (Plugin_host.load_read_plugin ~id ~grants ~source) |> success in
  Plugin_host.unload_read_plugin runner;
  Signal.dispose_scope scope;
  let failure_id = success (plugin_id "sdk-probe-failure") in
  let log_reader, log_writer = Unix.pipe () in
  let original_stderr = Unix.dup Unix.stderr in
  flush stderr;
  Unix.dup2 log_writer Unix.stderr;
  Unix.close log_writer;
  let failed = Fun.protect
    ~finally:(fun () -> flush stderr; Unix.dup2 original_stderr Unix.stderr; Unix.close original_stderr)
    (fun () -> task (Plugin_host.load_read_plugin ~id:failure_id ~grants:[] ~source)) in
  let log_channel = Unix.in_channel_of_descr log_reader in
  let diagnostic = Fun.protect ~finally:(fun () -> close_in log_channel)
    (fun () -> In_channel.input_all log_channel) in
  check "initialization diagnostics survive failure"
    (failed = Error Runtime_failure
     && String.trim diagnostic = "[plugin:sdk-probe-failure] initialization failed");
  print_endline "SDK/QuickJS/application/worker graph contract passed"

let () =
  if Array.length Sys.argv <> 2 then invalid_arg "sdk_read_probe <bundle.mjs>";
  Fun.protect ~finally:cleanup (fun () -> run Sys.argv.(1))
