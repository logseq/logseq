(* Native Windows test of the existing bridge's owned process-handle boundary.
   Compile with unix/threads and native/logseq_lui_bridge.c; no application or
   graph starts. A PowerShell child reports its real OS pid over a private pipe. *)
external worker_process_id : int -> int = "caml_logseq_worker_process_id"

let () =
  if Sys.os_type <> "Win32" then failwith "This test requires native Windows";
  let powershell = Filename.concat (Sys.getenv "SystemRoot")
    "System32/WindowsPowerShell/v1.0/powershell.exe" in
  let read_end, write_end = Unix.pipe () in
  let null = Unix.openfile "NUL" [Unix.O_RDONLY] 0 in
  let child_handle =
    Fun.protect ~finally:(fun () -> Unix.close null; Unix.close write_end)
      (fun () -> Unix.create_process powershell
        [|powershell; "-NoLogo"; "-NoProfile"; "-NonInteractive";
          "-Command"; "[Console]::WriteLine($PID)"|]
        null write_end write_end) in
  let pid = worker_process_id child_handle in
  let input = Unix.in_channel_of_descr read_end in
  let reported = Fun.protect ~finally:(fun () -> close_in input)
    (fun () -> input_line input |> String.trim |> int_of_string) in
  if pid <= 0 || pid <> reported then failwith "Worker registry pid differs from the real child pid";
  let closed =
    try ignore (worker_process_id child_handle); false with
    | Failure message -> String.starts_with
        ~prefix:"GetProcessId failed with Windows error 6" message in
  if not closed then failwith "The worker process handle was not released";
  let invalid =
    try ignore (worker_process_id 0); false with
    | Failure message -> String.starts_with
        ~prefix:"GetProcessId failed with Windows error 6" message in
  if not invalid then failwith "Invalid native handle error was not preserved";
  print_endline "PASS native worker OS pid, consumed handle and error codes"
