(* The rich NSH paste snapshot enters the real native clipboard/file facade.
   Text is never re-read from the machine clipboard after the paste event. *)
let check label condition = if not condition then failwith label

let run () =
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
