open Plugin_protocol

let check name value = if not value then failwith name
let success = function Ok value -> value | Error error -> failwith (error_name error)
let repo = "logseq_db_quickjs_command_probe"
let page_uuid = "00000000-0000-0000-0000-000000000098"
let uuid = "00000000-0000-0000-0000-000000000099"
let model = ref Model.initial

let spin ready =
  let deadline = Unix.gettimeofday () +. 20. in
  let rec loop () =
    Host.drain ();
    if not (ready ()) then begin
      if Unix.gettimeofday () > deadline then failwith "command probe deadline";
      Thread.delay 0.001;
      loop ()
    end in
  loop ()

let promise task =
  spin (fun () -> match task.Js.Promise.state with Js.Promise.Pending -> false | _ -> true);
  match task.Js.Promise.state with
  | Js.Promise.Resolved value -> value
  | Js.Promise.Rejected error -> raise error
  | Js.Promise.Pending -> assert false

let observe task =
  let result = ref None in
  ignore (Ui_task.catch
    (Ui_task.bind task (fun value -> result := Some (Ok value); Ui_task.resolve ()))
    (fun error -> result := Some (Error error); Ui_task.resolve ()));
  result

let await result =
  spin (fun () -> Option.is_some !result);
  match Option.get !result with Ok value -> value | Error error -> raise error
let task pending = await (observe pending)

let source path =
  let channel = open_in_bin path in
  Fun.protect ~finally:(fun () -> close_in channel)
    (fun () -> really_input_string channel (in_channel_length channel))

let cleanup () =
  List.iter (fun (pid, _) ->
    try match Unix.waitpid [Unix.WNOHANG] pid with
    | 0, _ ->
        Unix.kill pid Sys.sigterm;
        let rec reap remaining =
          match Unix.waitpid [Unix.WNOHANG] pid with
          | 0, _ when remaining > 0 -> Thread.delay 0.01; reap (remaining - 1)
          | 0, _ -> Unix.kill pid Sys.sigkill; ignore (Unix.waitpid [] pid)
          | _ -> () in
        reap 200
    | _ -> ()
    with Unix.Unix_error (Unix.ECHILD, _, _) -> ()) (Daemon_client.read_server_list ())

let run path =
  check "owned graph root" (Sys.file_exists
    (Filename.concat (Sys.getenv "LOGSEQ_ROOT_DIR") ".quickjs-sdk-probe"));
  let owner = Thread.id (Thread.self ()) in
  Platform.install_ui_services ~paints_caret:true
    ~assert_owner:(fun () -> check "owner thread" (Thread.id (Thread.self ()) = owner))
    ~request_flush:(fun () -> ()) ~dom:Ui_dom_native.ops
    ~timers:Ui_dom_native.timers ~files:Ui_dom_native.files;
  Runtime.read_model := (fun () -> !model);
  let worker = Worker_client.create () in
  Runtime.worker := Some worker;
  let invoke name args = promise (Worker_client.invoke worker name args) in
  ignore (invoke "thread-api/create-or-open-db" [Wire.String repo; Wire.Map []]);
  let page = Wire.Map [
    Wire.kw "block/name", Wire.String "quickjs command probe";
    Wire.kw "block/title", Wire.String "quickjs command probe";
    Wire.kw "block/uuid", Wire.Uuid page_uuid;
    Wire.kw "block/created-at", Wire.Int 1;
    Wire.kw "block/updated-at", Wire.Int 1;
    Wire.kw "block/tags", Wire.Set [Wire.kw "logseq.class/Page"]] in
  let block = Wire.Map [
    Wire.kw "block/uuid", Wire.Uuid uuid;
    Wire.kw "block/title", Wire.String "seed";
    Wire.kw "block/order", Wire.String "a0";
    Wire.kw "block/created-at", Wire.Int 1;
    Wire.kw "block/updated-at", Wire.Int 1;
    Wire.kw "block/parent", Wire.Array [Wire.kw "block/uuid"; Wire.Uuid page_uuid];
    Wire.kw "block/page", Wire.Array [Wire.kw "block/uuid"; Wire.Uuid page_uuid]] in
  ignore (invoke "thread-api/transact" [Wire.String repo; Wire.Array [page; block]; Wire.Nil; Wire.Nil]);
  let page = Option.get (Decode.page_of_summary page) in
  let initial = {Model.initial with repo=Some repo; route=Model.Page page.Model.page_title;
    route_page=Some page} in
  model := initial;
  let scheduler = Signal.scheduler () in
  let backend = {Lui_protocol.backend_profile=Lui_protocol.profile Lui_protocol.MacOS Lui_protocol.GenericHost;
    apply_batch=(fun _ -> true)} in
  let application = Lui_runtime.create scheduler backend in
  let scope = Signal.scope "command-probe" in
  Runtime.app_flush := (fun () -> ignore (Lui_runtime.flush application));
  Runtime.schedule_flush := (fun callback -> callback ());
  Editor_state.ensure (Lui_ui.context application scope);
  let popup = Popups_state.make scheduler in
  let editing text =
    model := initial;
    let editor = Editor_state.mk_editing ~uuid ~buffer:text ~scope:"main" ~base:"seed"
      ~caret:(String.length text) () in
    Editor_state.set_silent (fun state -> {state with editing=Some editor});
    ignore (Lui_runtime.flush application);
    Popups_state.open_ac ~tpos:0 popup Popups_state.Slash;
    ignore (Lui_runtime.flush application);
    Option.get (Popups_state.get popup).ac in
  let buffer () = Option.get (Editor_state.editing ()) |> fun editor -> editor.buffer in
  let id = success (plugin_id "command-probe") in
  let source = source path in
  let grants = [Editor_read; Editor_command; Graph_read; Db_query; Graph_write] in
  let load ?(id=id) ?(grants=grants) ?(source=source) () =
    task (Plugin_host.load_command_plugin ~id ~grants ~source) |> success in
  let handle key =
    List.find (fun handle -> command_key (command_metadata handle) = key)
      (Plugin_host.portable_commands ()) in
  let runner = load () in
  check "all registrations published" (List.length (Plugin_host.portable_commands ()) = 9);
  let ac = editing "/editor-api-v1" in
  check "editor graph writes preserve configured ownership and the editing buffer"
    (task (Popups_state.run_portable_command popup ac (handle "editor-api-v1")) = Ok ()
     && buffer () = "/editor-api-v1");
  let changed_uuid = "00000000-0000-0000-0000-000000000107" in
  let mutation = Plugin_protocol.Mutate (Update_block (Uuid changed_uuid, "must not commit")) in
  List.iter (fun mode ->
    model := initial;
    let services, reads, writes = Plugin_read_services.capture_editor ~id in
    let broker = Plugin_broker.create () in
    let grants = if mode = "denied" then [Editor_command] else [Editor_command; Graph_write] in
    let session = Plugin_broker.open_session broker id grants in
    if mode <> "registering" then ignore (Plugin_broker.activate_commands broker session |> success);
    let invocation = Plugin_broker.begin_invocation ~reads ~writes broker session services in
    let request = Plugin_broker.dispatch broker session invocation mutation in
    let observed = observe request in
    let expected = match mode with
      | "denied" -> Permission_denied
      | "registering" -> Unsupported
      | "stale" ->
          check "write preparation is pending" (!observed = None);
          model := {initial with context_revision=initial.context_revision + 1}; Stale_context
      | "cancelled" -> Plugin_broker.cancel broker invocation; Cancelled
      | "unloaded" -> Plugin_broker.close_session broker session; Cancelled
      | _ -> assert false in
    let result = try await observed with Ui_task.Cancelled -> Error Cancelled in
    check (mode ^ " cannot commit an editor write") (result = Error expected);
    Plugin_broker.close_session broker session;
    model := initial;
    ignore (promise (Sdk_util.get_entity_for_repo repo changed_uuid));
    let block = promise (Sdk_util.get_entity_for_repo repo changed_uuid) in
    check "refused writes leave the graph unchanged"
      (Wire.map_get_string block "block/title" = Some "portable updated")
  ) ["denied"; "registering"; "stale"; "cancelled"; "unloaded"];
  let identity = Json.String changed_uuid in
  List.iter (fun (operation, arguments, error) ->
    check "editor wire arguments fail closed"
      (Plugin_protocol.decode_request ~operation (Json.Array arguments) = Error error)) [
    11, [|Json.String "page name"|], Invalid_request;
    12, [|identity; Json.String "text"; Json.Object ["start", Json.Bool true; "end", Json.Bool true]|], Invalid_request;
    12, [|identity; Json.String "text"; Json.Object ["unknown", Json.Bool true]|], Invalid_request;
    12, [|identity; Json.String "text"; Json.Object ["properties", Json.Object []]|], Unsupported;
    13, [|identity; Json.String (String.make (max_string_bytes + 1) 'x')|], Resource_limit;
    14, [|identity; Json.String "db/id"; Json.Number 3.|], Invalid_request;
    14, [|identity; Json.String "value"; Json.Null|], Invalid_request;
    14, [|identity; Json.String "value"; Json.Array [||]|], Unsupported;
    15, [|identity; Json.String (String.make 65 'x')|], Resource_limit;
    15, [|identity|], Invalid_request;
  ];
  let property_name = "plugin.property.command-probe/portable-score" in
  let set_title title = ignore (invoke "thread-api/apply-outliner-ops" [Wire.String repo;
    Wire.Array [
      Wire.Array [Wire.kw "save-block"; Wire.Array [Wire.Map [Wire.kw "block/uuid", Wire.Uuid changed_uuid;
        Wire.kw "block/title", Wire.String title]; Wire.Map []]];
      Wire.Array [Wire.kw "set-block-property";
        Wire.Array [Wire.Uuid changed_uuid; Wire.kw property_name; Wire.Int 4]]];
    Wire.Map []]) in
  set_title (String.make (max_string_bytes + 1) 'x');
  let services, reads = Plugin_read_services.capture ~id in
  let broker = Plugin_broker.create () in
  let session = Plugin_broker.open_session broker id [Graph_read] in
  let invocation = Plugin_broker.begin_invocation ~reads broker session services in
  let properties = task (Plugin_broker.dispatch broker session invocation
      (Get_block_properties (Uuid changed_uuid))) |> success in
  check "property projection ignores an unrelated oversized title"
    (match properties with Properties value -> Json.get (":" ^ property_name) value = Some (Json.Number 4.)
     | _ -> false);
  Plugin_broker.close_session broker session;
  set_title "portable updated";
  check "duplicate live plugin ID denied"
    (task (Plugin_host.load_command_plugin ~id ~grants ~source) = Error Invalid_request);
  let greet = handle "greet" in
  let ac = editing "/greet" in
  let item = List.find (fun item -> match item.Popups_state.ai_act with
    | Popups_state.Portable_command handle -> command_key (command_metadata handle) = "greet"
    | _ -> false) ac.items in
  Popups_state.apply_item popup ac ~meta:false item;
  spin (fun () -> buffer () = "Hello 1 🦉");
  check "exact configured caret" ((Option.get (Editor_state.editing ())).model.caret = String.length "Hello 1 🦉");
  ignore (promise (Outliner_ops.flush_pending_save ()));
  let _, reads = Plugin_read_services.capture ~id in
  let stored = task (reads.get_block (Uuid uuid)) |> success |> Option.get in
  check "normal save persisted configured text"
    (Json.get "content" (reply_value (Block (Some stored))) = Some (Json.String "Hello 1 🦉"));
  let ac = editing "/greet" in
  check "same callback reuses initialized SDK"
    (task (Popups_state.run_portable_command popup ac greet) = Ok () && buffer () = "Hello 2 🦉");
  ignore (promise (Outliner_ops.flush_pending_save ()));
  let ac = editing "/empty" in
  let ticket = success (Popups_state.prepare_command popup ac (handle "empty")) in
  check "empty program succeeds without erasing trigger"
    (task (Popups_state.invoke_command ticket) = Ok () && buffer () = "/empty");
  check "ticket cannot replay"
    (task (Popups_state.execute_command ticket (success (program []))) = Error Cancelled);
  let sink = ref None in
  Popups_state.install_configured_ui (fun checkpoint ~current action ->
    sink := Some (checkpoint, current, action); true);
  let ac = editing "/date" in
  check "terminal date program" (task (Popups_state.run_portable_command popup ac (handle "date")) = Ok ());
  let checkpoint, current, action = Option.get !sink in
  check "owned insert permits terminal handoff" (buffer () = "Date"
    && action = Popups_state.Configured_date_picker && current ()
    && Popups_state.configured_checkpoint_current checkpoint);
  Plugin_host.unload_command_plugin runner;
  check "unload invalidates delayed UI lease"
    (not (current ()) && not (Popups_state.configured_checkpoint_current checkpoint));
  Plugin_host.unload_command_plugin runner;
  let runner = load () in
  check "reload cannot revive old handle" (not (Plugin_host.command_current greet));
  let ac = editing "/explicit" in
  let ticket = success (Popups_state.prepare_command popup ac (handle "explicit")) in
  let accepted = task (Plugin_host.invoke_command ticket.ticket_handle ticket.ticket_services ticket.ticket_reads) |> success in
  Plugin_host.unload_command_plugin runner;
  check "unload between acceptance and application"
    (task (Popups_state.execute_command ticket accepted) = Error Stale_context && buffer () = "/explicit");
  List.iter (fun (key, expected) ->
    let runner = load () in
    let ac = editing ("/" ^ key) in
    let before = buffer () in
    check (key ^ " rejects without changing trigger")
      (task (Popups_state.run_portable_command popup ac (handle key)) = Error expected && buffer () = before);
    check (key ^ " retires registrations") (Plugin_host.portable_commands () = []);
    Plugin_host.unload_command_plugin runner)
    ["invalid", Invalid_request; "late", Unsupported];
  let runner = load () in
  let ac = editing "/exit" in
  check "exit terminal" (task (Popups_state.run_portable_command popup ac (handle "exit")) = Ok ());
  spin (fun () -> Editor_state.editing () = None);
  Plugin_host.unload_command_plugin runner;
  let mutations = [
    "route", (fun () -> model := {!model with route=Model.Page "elsewhere"});
    "graph", (fun () -> model := {!model with repo=Some "other"});
    "context", (fun () -> model := {!model with context_revision=1});
    "generation", (fun () -> incr Runtime.load_gen);
    "epoch", (fun () -> let editor = Option.get (Editor_state.editing ()) in
      Editor_state.set_silent (fun state -> {state with editing=Some {editor with epoch=ref 0}}));
    "scope", (fun () -> let editor = Option.get (Editor_state.editing ()) in
      Editor_state.set_silent (fun state -> {state with editing=Some {editor with scope="sidebar"}}));
    "typing", (fun () -> Editor_actions.update_model uuid (fun editor -> Edit_model.splice editor 0 0 "new"));
    "caret", (fun () -> Editor_actions.update_model uuid (fun editor -> Edit_model.select editor ~anchor:0 ~focus:0));
    "selection", (fun () -> Editor_actions.update_model uuid (fun editor -> Edit_model.select editor ~anchor:0 ~focus:editor.caret));
    "composition", (fun () -> Editor_actions.update_model uuid (fun editor ->
      {editor with composition=Some (editor.caret, editor.caret)}));
    "input", (fun () -> incr Editor_state.edit_input_seq);
    "popup", (fun () -> Popups_state.open_ac ~tpos:0 popup Popups_state.Slash);
  ] in
  let reload_deferred () =
    Worker_events.ui_busy ~now:(Ui_services.time_now () +. 10000.) ~last_fire:0. in
  List.iter (fun (name, mutate) ->
    let runner = load () in
    let ac = editing "/read" in
    let ticket = success (Popups_state.prepare_command popup ac (handle "read")) in
    let pending, resolve, _ = Ui_task.pending () in
    let requested = ref false in
    let reads = {ticket.ticket_reads with Plugin_broker.current_block=(fun () -> requested := true; pending)} in
    let ticket = {ticket with Popups_state.ticket_reads=reads} in
    let invocation = Popups_state.invoke_command ticket in
    let result = observe invocation in
    spin (fun () -> !requested);
    check "pending command defers subscription publication" (reload_deferred ());
    check "busy invocation denied without disturbing active command"
      (task (Plugin_host.invoke_command ticket.ticket_handle ticket.ticket_services reads) = Error Invalid_request);
    mutate ();
    let before = buffer () in
    resolve (Ok None);
    check (name ^ " invalidates pending command") (await result = Error Stale_context && buffer () = before);
    check (name ^ " retires session") (not (Plugin_host.command_current ticket.ticket_handle));
    check "retired command releases subscription deferral" (not (reload_deferred ()));
    Plugin_host.unload_command_plugin runner) mutations;
  List.iter (fun cancel ->
    let runner = load () in
    let ac = editing "/read" in
    let ticket = success (Popups_state.prepare_command popup ac (handle "read")) in
    let pending, resolve, _ = Ui_task.pending () in
    let requested = ref false in
    let reads = {ticket.ticket_reads with Plugin_broker.current_block=(fun () -> requested := true; pending)} in
    let ticket = {ticket with Popups_state.ticket_reads=reads} in
    let invocation = Popups_state.invoke_command ticket in
    let result = observe invocation in
    spin (fun () -> !requested);
    if cancel then Ui_task.cancel invocation else Plugin_host.unload_command_plugin runner;
    spin (fun () -> Option.is_some !result);
    check "unload/cancel retires pending work" (not (Plugin_host.command_current ticket.ticket_handle));
    resolve (Ok None);
    Host.drain ();
    check "late callback cannot edit" (buffer () = "/read");
    Plugin_host.unload_command_plugin runner) [false; true];
  List.iter (fun (name, source, expected) ->
    let id = success (plugin_id ("failed-" ^ name)) in
    check name (task (Plugin_host.load_command_plugin ~id ~grants ~source) = Error expected);
    check "failed activation publishes nothing" (Plugin_host.portable_commands () = [])) [
    "activation", {|export async function run(host) {
      await host.registerEditorCommand({key:"test",label:"Test"},()=>[]);
      throw new Error("activation failed"); }|}, Runtime_failure;
    "duplicate", {|export async function run(host) {
      await host.registerEditorCommand({key:"test",label:"Test"},()=>[]);
      await host.registerEditorCommand({key:"test",label:"Test"},()=>[]); return []; }|}, Invalid_request;
    "metadata", {|export async function run(host) {
      await host.registerEditorCommand({key:"test",label:"\u0080"},()=>[]); return []; }|}, Invalid_request;
    "limit", {|export async function run(host) {
      for(let i=0;i<33;i++) await host.registerEditorCommand({key:"test"+i,label:"Test"},()=>[]);
      return []; }|}, Resource_limit;
  ];
  let runner = load ~source:{|export async function run(host) {
    await host.registerEditorCommand({key:"missing",label:"Missing"},()=>{}); return [];
  }|} () in
  let ac = editing "/missing" in
  check "undefined is not an empty program"
    (task (Popups_state.run_portable_command popup ac (handle "missing")) = Error Invalid_request
     && buffer () = "/missing");
  Plugin_host.unload_command_plugin runner;
  check "command loader needs command authority"
    (task (Plugin_host.load_command_plugin ~id ~grants:[Editor_read] ~source) = Error Permission_denied);
  let runner = load ~grants:[Editor_command] () in
  let ac = editing "/greet" in
  check "command authority does not imply reads"
    (task (Popups_state.run_portable_command popup ac (handle "greet")) = Error Permission_denied
     && buffer () = "/greet");
  Plugin_host.unload_command_plugin runner;
  Signal.dispose_scope scope;
  print_endline "SDK/QuickJS/command/configured/worker graph contract passed"

let () =
  if Array.length Sys.argv <> 2 then invalid_arg "sdk_command_probe <bundle.mjs>";
  Fun.protect ~finally:cleanup (fun () -> run Sys.argv.(1))
