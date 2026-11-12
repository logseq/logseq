(* The rich NSH paste snapshot enters the real native clipboard/file facade.
   Text is never re-read from the machine clipboard after the paste event. *)
let check label condition = if not condition then failwith label

let natural_date_tasks () =
  let previous_host = !Host.host_op and previous_support = !Platform.natural_dates_supported in
  let previous_model = !Runtime.read_model and previous_flush = !Runtime.app_flush in
  let requests = ref [] in
  Host.set_host_op (fun operation payload -> requests:=(operation,Yojson.Safe.from_string payload)::!requests);
  Fun.protect ~finally:(fun () ->
    Platform.cancel_host_tasks ();
    Runtime.read_model:=previous_model;Runtime.app_flush:=previous_flush;
    Host.set_host_op previous_host;
    Platform.configure_natural_dates ~nsh:previous_support) (fun () ->
    let observe task =
      let result = ref None in
      ignore (Ui_task.catch
        (Ui_task.bind task (fun value -> result:=Some (Ok value);Ui_task.resolve ()))
        (fun error -> result:=Some (Error error);Ui_task.resolve ()));
      result in
    Platform.configure_natural_dates ~nsh:false;
    let unsupported = observe (Platform.date_parse_natural ~reference:0. "Next week") in
    Host.drain ();
    check "non-NSH native hosts explicitly reject NLP without emitting an operation"
      (!requests=[] && match !unsupported with Some (Error _) -> true | _ -> false);
    Platform.configure_natural_dates ~nsh:true;
    let request_id () = match !requests with
      | ("natural-date-parse",`Assoc fields)::_ ->
          (match List.assoc "request-id" fields with `String id -> id | _ -> failwith "date request ID")
      | _ -> failwith "missing real natural date request" in
    let reply id fields =
      Native_embed.platform_event ("natural-date-result\n" ^ Yojson.Safe.to_string
        (`Assoc (("request-id",`String id)::fields)));
      Host.drain () in
    let first_task=Platform.date_parse_natural ~reference:0. "Next week" in
    let first=observe first_task and first_id=request_id () in
    Ui_task.cancel first_task;
    let second=observe (Platform.date_parse_natural ~reference:0. "Tomorrow") in
    let second_id=request_id () in
    reply second_id ["status",`String "parsed";"epoch-ms",`Int 86400000];
    reply first_id ["status",`String "parsed";"epoch-ms",`Int 604800000];
    check "a cancelled date reply cannot replace the next request's result"
      (!first=Some (Error Ui_task.Cancelled) && !second=Some (Ok (Some 86400000.)));
    let no_match=observe (Platform.date_parse_natural ~reference:0. "not a date") in
    reply (request_id ()) ["status",`String "no-match"];
    check "native no-match remains distinct from a failed host service" (!no_match=Some (Ok None));
    let failed=observe (Platform.date_parse_natural ~reference:0. "today") in
    reply (request_id ()) ["status",`String "error";"error",`String "injected provider failure"];
    check "native service errors reject instead of becoming invalid-date results"
      (match !failed with Some (Error (Failure "injected provider failure")) -> true | _ -> false);
    let model=ref {Model.initial with repo=Some "natural-date-origin"} in
    Runtime.read_model:=(fun () -> !model);
    let picks=ref [] and notices=ref [] in
    let backend={Lui_protocol.backend_profile=Lui_protocol.profile Lui_protocol.MacOS Lui_protocol.NshHost;
      apply_batch=(fun _ -> true)} in
    let app=Lui_app.create backend () (fun () () -> ()) (fun context _ _ ->
      Ui_services.dom_subscribe_document_event ~scope:context.Lui_ui.ui_scope "ls:toast"
        (fun event -> notices:=event.Ui_services.detail "cls" :: !notices);
      Ui_components.calendar ~initial:0. ~is_current:(fun () -> Runtime.repo ()="natural-date-origin")
        ~week_starts_on:0 ~month_label:I18n.calendar_month_label
        ~day_label:I18n.calendar_day_label ~translate:I18n.t
        ~on_pick:(fun value -> picks:=value :: !picks) ()) in
    ignore (Lui_app.start app);ignore (Lui_app.flush app);
    Runtime.app_flush:=(fun () -> ignore (Lui_app.flush app));
    let runtime=Lui_app.runtime app in
    let field=Hashtbl.fold (fun node _ found ->
      match found with Some _ -> found | None ->
      if Lui_protocol.Property_map.find_opt Lui_protocol.AccessibilityIdentifier
           (Hashtbl.find runtime.runtime_properties node)=Some (Lui_protocol.StringValue "calendar-date-input")
      then Some node else None) runtime.mounted_nodes None |> Option.get in
    let dispatch event=ignore (Lui_app.dispatch_event app event);ignore (Lui_app.flush app) in
    let submit value=dispatch (Lui_protocol.TextChanged (field,value));
      dispatch (Lui_protocol.Submit field);request_id () in
    let app_disposed=ref false in
    let dispose () = if not !app_disposed then
      (app_disposed:=true;ignore (Lui_app.dispose app)) in
    Fun.protect ~finally:dispose (fun () ->
      let old=submit "Next week" in
      let fresh=submit "Tomorrow" in
      reply old ["status",`String "parsed";"epoch-ms",`Int 604800000];
      check "actual native calendar ignores the previous input's completion" (!picks=[] && !notices=[]);
      reply fresh ["status",`String "parsed";"epoch-ms",`Int 86400000];
      check "actual native calendar publishes the current free-text result once" (List.length !picks=1);
      let stale=submit "Next week" in
      model:={!model with Model.repo=Some "natural-date-destination"};
      reply stale ["status",`String "no-match"];
      check "a graph change suppresses late invalid-date notifications" (List.length !picks=1 && !notices=[]);
      model:={!model with Model.repo=Some "natural-date-origin"};
      let failure=submit "Today" in
      reply failure ["status",`String "error";"error",`String "injected provider failure"];
      check "a native calendar service failure uses an error notification, not invalid-date warning"
        (!notices=[Some "error"] && List.length !picks=1);
      notices:=[];
      let no_match=submit "not a date" in
      reply no_match ["status",`String "no-match"];
      check "a native calendar non-match keeps its warning semantics" (!notices=[Some "warning"]);
      notices:=[];
      let disposed=submit "Next week" in
      dispose ();
      reply disposed ["status",`String "parsed";"epoch-ms",`Int 604800000];
      check "disposing the calendar cancels its task before a late reply" (List.length !picks=1 && !notices=[]));
    let clipboard=observe (Platform.clipboard_write_text "owned clipboard") in
    let id=match !requests with
      | ("clipboard-write",`Assoc fields)::_ ->
          (match List.assoc "request-id" fields with `String id -> id | _ -> failwith "clipboard request ID")
      | _ -> failwith "missing real clipboard request" in
    Platform.note_clipboard_write (`Assoc ["request-id",`String id;"ok",`Bool true]);
    Host.drain ();
    check "sharing the existing request owner preserves clipboard acknowledgements" (!clipboard=Some (Ok ())));
  print_endline "PASS native date task channel: cancellation, reordered replies, errors and clipboard isolation"

let run () =
  natural_date_tasks ();
  let event = Ui_dom_native.ev_of (Js.Json.parseExn
    {|{"clipboardData":{"text":"plain","html":"<strong>rich</strong>","types":["text/plain","text/html","Files"],"items":[{"kind":"string","type":"text/plain"},{"kind":"string","type":"text/html"},{"kind":"file","type":"image/png"}],"files":[{"name":"clip.png","type":"image/png","size":3,"data-b64":"AID/"}]}}|}) in
  check "native clipboard preserves plain text" (event.Ui_services.clipboard_get "text/plain" = "plain");
  check "native clipboard exposes the actual rich HTML" (event.Ui_services.clipboard_get "text/html" = "<strong>rich</strong>");
  let snapshot = event.Ui_services.clipboard_snapshot () in
  check "native clipboard inspection preserves all advertised formats"
    (snapshot.Ui_services.clipboard_formats = ["text/plain","plain";"text/html","<strong>rich</strong>";"Files",""]);
  check "captured image enters the shared upload file channel" event.Ui_services.has_files;
  let file = List.hd event.Ui_services.files in
  check "image metadata is the captured payload metadata"
    (file.Ui_services.file_name = "clip.png" && file.file_size = Some 3.);
  let received = ref None in
  ignore (Ui_task.bind (file.Ui_services.file_binary ())
    (fun binary -> received := Some binary; Ui_task.resolve ()));
  let deadline = Unix.gettimeofday () +. 2. in
  while !received = None && Unix.gettimeofday () < deadline do
    Host.drain (); Thread.yield ()
  done;
  check "native file facade decodes captured binary without text corruption"
    (!received = Some "\000\128\255");
  print_endline "PASS native rich clipboard formats and captured image file bytes"


let async_file_read_keeps_the_application_owner_responsive () =
  let owner = Thread.id (Thread.self ()) in
  let lock = Mutex.create () and condition = Condition.create () in
  let started = ref false and released = ref false and worker = ref owner in
  let received = ref None and owner_progress = ref false in
  let read _ =
    Mutex.lock lock;
    worker := Thread.id (Thread.self ());
    started := true;
    Condition.broadcast condition;
    while not !released do Condition.wait condition lock done;
    Mutex.unlock lock;
    "async bytes" in
  let task = Ui_dom_native.task_of (Browser_ui.read_snapshot_async read Js.Json.null) in
  ignore (Ui_task.bind task (fun payload ->
    check "file completion returns to the application owner" (Thread.id (Thread.self ()) = owner);
    received := Some (Bytes.to_string payload); Ui_task.resolve ()));
  Mutex.lock lock;
  while not !started do Condition.wait condition lock done;
  Mutex.unlock lock;
  Host.enqueue (fun () -> owner_progress := true);
  Host.drain ();
  check "native path read runs off the application owner" (!worker <> owner);
  check "accepted input can continue while a file read is pending" (!owner_progress && !received = None);
  Mutex.lock lock; released := true; Condition.broadcast condition; Mutex.unlock lock;
  let deadline = Unix.gettimeofday () +. 2. in
  while !received = None && Unix.gettimeofday () < deadline do Host.drain (); Thread.yield () done;
  check "existing mailbox delivers the original file result" (!received = Some "async bytes");
  let path_snapshot = Js.Json.object_list ["name",Js.Json.string "lazy.txt";"path",Js.Json.string "/unread/lazy.txt"] in
  let file = Ui_dom_native.file_of_json path_snapshot in
  check "unread path size remains explicitly unknown" (file.Ui_services.file_size = None);
  print_endline "PASS native file reads remain off-owner and complete through the existing mailbox"
