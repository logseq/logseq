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
    (file.Ui_services.file_name = "clip.png" && file.file_size = 3.);
  let received = ref None in
  ignore (Ui_task.bind (file.Ui_services.file_binary ())
    (fun binary -> received := Some binary; Ui_task.resolve ()));
  Host.drain ();
  check "native file facade decodes captured binary without text corruption"
    (!received = Some "\000\128\255");
  print_endline "PASS native rich clipboard formats and captured image file bytes"
