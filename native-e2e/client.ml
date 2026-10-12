open Yojson.Safe.Util

type element = Yojson.Safe.t
type rect = { x : float; y : float; width : float; height : float }
type sdk_namespace = Api | Ui | Utils | Assets | Experiments | Debug
exception Timeout of string
type t =
  { repo : string; artifacts : string; directory : string; root : string;
    settings : string; socket : string; mutable pid : int option;
    mutable log_fd : Unix.file_descr option; mutable inputs : int;
    on_input : unit -> unit; mutable closed : bool }

let rec mkdir path =
  if not (Sys.file_exists path) then (mkdir (Filename.dirname path); Unix.mkdir path 0o700)

let read_file path =
  let ic = open_in_bin path in
  Fun.protect ~finally:(fun () -> close_in ic) (fun () -> really_input_string ic (in_channel_length ic))

let write_file path value =
  let oc = open_out_bin path in
  Fun.protect ~finally:(fun () -> close_out oc) (fun () -> output_string oc value)

let append path value =
  let oc = open_out_gen [ Open_creat; Open_append; Open_text ] 0o600 path in
  Fun.protect ~finally:(fun () -> close_out oc) (fun () -> output_string oc (value ^ "\n"))

let poll ?(timeout = 15.) description check =
  let deadline = Unix.gettimeofday () +. timeout in
  let rec loop () =
    match check () with
    | Some value -> value
    | None ->
      let remaining = deadline -. Unix.gettimeofday () in
      if remaining <= 0. then raise (Timeout description);
      Unix.sleepf (min 0.05 remaining);
      loop ()
  in loop ()

let create ?root ?(on_input = fun () -> ()) ~repo ~artifacts ~label () =
  let directory = Filename.temp_file "ln-e2e-" "" in
  Unix.unlink directory;
  Unix.mkdir directory 0o700;
  let root = Option.value root ~default:(Filename.concat directory "data") in
  let settings = Filename.concat directory "settings" in
  let artifacts = Filename.concat artifacts label in
  mkdir root; mkdir settings; mkdir artifacts;
  { repo; artifacts; directory; root; settings; socket = Filename.concat directory "host.sock";
    pid = None; log_fd = None; inputs = 0; on_input; closed = false }

let root app = app.root
let settings app = app.settings
let artifacts app = app.artifacts
let input_count app = app.inputs
let host app = Filename.concat app.repo "deps/ui/_build/default/ocaml_host/logseq_native.exe"
let daemon_bin app = Filename.concat app.repo "deps/db-worker/_build/default/bin/main.exe"

let request app op values =
  let json = `Assoc (("op", `String op) :: values) in
  append (Filename.concat app.artifacts "protocol.jsonl") (Yojson.Safe.to_string json);
  let fd = Unix.socket Unix.PF_UNIX Unix.SOCK_STREAM 0 in
  Unix.set_close_on_exec fd;
  Fun.protect ~finally:(fun () -> Unix.close fd) (fun () ->
      Unix.connect fd (Unix.ADDR_UNIX app.socket);
      Unix.set_nonblock fd;
      let deadline = Unix.gettimeofday () +. 8. in
      let ready read =
        let remaining = deadline -. Unix.gettimeofday () in
        if remaining <= 0. then raise (Timeout ("socket " ^ op));
        let rs, ws, _ = Unix.select (if read then [fd] else []) (if read then [] else [fd]) [] remaining in
        if rs = [] && ws = [] then raise (Timeout ("socket " ^ op))
      in
      let data = Yojson.Safe.to_string json ^ "\n" in
      let rec send offset =
        if offset < String.length data then begin
          ready false;
          let n = Unix.write_substring fd data offset (String.length data - offset) in
          send (offset + n)
        end
      in send 0;
      let buffer = Buffer.create 1024 and chunk = Bytes.create 8192 in
      let rec receive () =
        ready true;
        let n = Unix.read fd chunk 0 (Bytes.length chunk) in
        if n = 0 then failwith ("Host disconnected during " ^ op);
        Buffer.add_subbytes buffer chunk 0 n;
        if Buffer.length buffer > 8_388_608 then failwith "Automation response exceeds bound";
        let contents = Buffer.contents buffer in
        match String.index_opt contents '\n' with
        | None -> receive ()
        | Some pos -> Yojson.Safe.from_string (String.sub contents 0 pos)
      in
      let response = receive () in
      if response |> member "ok" |> to_bool then member "result" response
      else failwith (response |> member "error" |> to_string))

let status app = request app "status" []
let snapshot app = request app "snapshot" [] |> to_list
let query app selector = request app "query" ["selector", `String selector] |> to_list
let rect el =
  let r = member "rect" el in
  let num k = r |> member k |> to_number in
  { x = num "x"; y = num "y"; width = num "width"; height = num "height" }
let text_content el = el |> member "text-content" |> to_string
let attr el name = match el |> member "attrs" |> member name with `String s -> Some s | `Null -> None | _ -> failwith "Non-string native attribute"
let visible el = let r = rect el in r.width > 0. && r.height > 0.
let normalize_space value =
  let out = Buffer.create (String.length value) and pending = ref false in
  let rec scan i =
    if i < String.length value then
      let byte = Char.code value.[i] in
      let whitespace = byte = 32 || (byte >= 9 && byte <= 13) in
      let nbsp = byte = 0xc2 && i + 1 < String.length value && Char.code value.[i+1] = 0xa0 in
      if whitespace || nbsp then (pending := Buffer.length out > 0; scan (i + if nbsp then 2 else 1))
      else begin
        if !pending then Buffer.add_char out ' ';
        pending := false;
        Buffer.add_char out value.[i];
        scan (i+1)
      end
  in scan 0; Buffer.contents out
let wait_for ?timeout ?text app selector =
  poll ?timeout ("native selector " ^ selector) (fun () ->
      let els = query app selector |> List.filter (fun el -> visible el &&
          match text with None -> true | Some s ->
            let content = normalize_space (text_content el) and s = normalize_space s in
            let rec contains i = i + String.length s <= String.length content &&
              (String.sub content i (String.length s) = s || contains (i + 1)) in contains 0) in
      if els = [] then None else Some els)

let input app kind values =
  ignore (request app "input" (("kind", `String kind) :: values));
  app.inputs <- app.inputs + 1;
  app.on_input ()

let move ?(dx = 0) ?(dy = 0) app x y =
  input app "move" ["x", `Int x; "y", `Int y; "dx", `Int dx; "dy", `Int dy]
let button ?(button = 1) ?(clicks = 1) ?(modifiers = 0) app ~down x y =
  input app "button" ["x", `Int x; "y", `Int y; "button", `Int button;
                      "clicks", `Int clicks; "modifiers", `Int modifiers; "down", `Bool down]
let click_at ?button:btn ?clicks ?modifiers app x y =
  move app x y;
  button ?button:btn ?clicks ?modifiers app ~down:true x y;
  button ?button:btn ?clicks ?modifiers app ~down:false x y
let click ?text ?(index = 0) ?button ?clicks ?modifiers app selector =
  let el = List.nth (wait_for ?text app selector) index in
  let r = rect el in
  let x = int_of_float (r.x +. r.width /. 2.) and y = int_of_float (r.y +. r.height /. 2.) in
  let state = status app in
  if x < 0 || y < 0 || x >= (state |> member "width" |> to_int) || y >= (state |> member "height" |> to_int) then
    failwith "Target outside viewport: scroll before clicking";
  click_at ?button ?clicks ?modifiers app x y
let drag ?(steps = 12) ?(modifiers = 0) app (x0, y0) (x1, y1) =
  if steps <= 0 then invalid_arg "drag steps";
  move app x0 y0;
  button ~modifiers app ~down:true x0 y0;
  for i = 1 to steps do
    move ~dx:((x1-x0)/steps) ~dy:((y1-y0)/steps) app (x0+(x1-x0)*i/steps) (y0+(y1-y0)*i/steps)
  done;
  button ~modifiers app ~down:false x1 y1
let key ?(modifiers = 0) app ~down scancode =
  input app "key" ["scancode", `Int scancode; "modifiers", `Int modifiers; "down", `Bool down]
let press app chord =
  let parts = String.split_on_char '+' chord in
  let modifiers, code = List.fold_left (fun (mods, code) part ->
      match part with
      | "Shift" -> mods lor 0x0003, code | "Ctrl" -> mods lor 0x00c0, code
      | "Alt" -> mods lor 0x0300, code | "Meta" | "Mod" -> mods lor 0x0c00, code
      | "Enter" -> mods, Some 40 | "Escape" -> mods, Some 41 | "Backspace" -> mods, Some 42
      | "Tab" -> mods, Some 43 | "Space" -> mods, Some 44 | "Delete" -> mods, Some 76
      | "Home" -> mods, Some 74 | "End" -> mods, Some 77 | "PageUp" -> mods, Some 75
      | "PageDown" -> mods, Some 78 | "Right" -> mods, Some 79 | "Left" -> mods, Some 80
      | "Down" | "ArrowDown" -> mods, Some 81 | "Up" | "ArrowUp" -> mods, Some 82
      | s when String.length s = 1 && Char.lowercase_ascii s.[0] >= 'a' && Char.lowercase_ascii s.[0] <= 'z' ->
        mods, Some (Char.code (Char.lowercase_ascii s.[0]) - Char.code 'a' + 4)
      | _ -> invalid_arg ("Unknown SDL key: " ^ part)) (0, None) parts in
  let scancode = match code with Some c -> c | None -> invalid_arg "Chord has no key" in
  key ~modifiers app ~down:true scancode; key ~modifiers app ~down:false scancode
let text app value =
  let length = String.length value in
  let rec chunks offset =
    if offset < length then begin
      let ending = ref (min length (offset + 31)) in
      while !ending < length && Char.code value.[!ending] land 0xc0 = 0x80 do decr ending done;
      if !ending = offset then invalid_arg "Invalid UTF-8 SDL input";
      input app "text" ["text", `String (String.sub value offset (!ending - offset))];
      chunks !ending
    end
  in chunks 0
let fill app selector value = click app selector; press app "Mod+A"; text app value
let wheel ?(x = 0) ?(modifiers = 0) app y = input app "wheel" ["x", `Int x; "y", `Int y; "modifiers", `Int modifiers]
let focused app = status app |> member "focused" |> to_int
let clipboard_read app = request app "clipboard_read" [] |> to_string
let clipboard_write app value = ignore (request app "clipboard_write" ["text", `String value])

let command_capture executable args =
  let rd, wr = Unix.pipe () in
  Unix.set_close_on_exec rd;
  let pid = Unix.create_process executable (Array.of_list (executable :: args)) Unix.stdin wr Unix.stderr in
  Unix.close wr;
  let ic = Unix.in_channel_of_descr rd in
  let buffer = Buffer.create 1024 in
  (try while true do Buffer.add_string buffer (input_line ic); Buffer.add_char buffer '\n' done with End_of_file -> ());
  close_in ic;
  match snd (Unix.waitpid [] pid) with
  | Unix.WEXITED 0 -> Buffer.contents buffer
  | _ -> failwith ("Command failed: " ^ executable ^ " " ^ String.concat " " args)

let http url data =
  let args = ["--silent"; "--show-error"; "--fail-with-body"; "--max-time"; "15"] in
  let args = match data with None -> args | Some body ->
    args @ ["-H"; "Content-Type: application/json"; "--data-binary"; body] in
  command_capture "/usr/bin/curl" (args @ [url]) |> Yojson.Safe.from_string

let daemon_opt ?repo app =
  let path = Filename.concat app.root "server-list" in
  if not (Sys.file_exists path) then None else
    read_file path |> String.split_on_char '\n' |> List.find_map (fun line ->
        match String.split_on_char ' ' (String.trim line) |> List.filter ((<>) "") with
        | [pid; port] ->
          (try
             let base = "http://127.0.0.1:" ^ port in
             let health = http (base ^ "/healthz") None in
             let actual = health |> member "repo" |> to_string in
             if (health |> member "status" |> to_string) = "ready" &&
                (match repo with None -> true | Some r -> r = actual) then
               Some (int_of_string pid, base, actual) else None
           with Failure _ | Yojson.Json_error _ -> None)
        | [] -> None | _ -> failwith "Invalid isolated server-list")
let daemon ?repo app = poll ~timeout:45. "ready real daemon" (fun () -> daemon_opt ?repo app)
let invoke_fixture ?repo app method_name args =
  let _, base, _ = daemon ?repo app in
  let body = `Assoc ["method", `String method_name; "argsTransit", `String (Transit.to_string (Wire.Array args))] in
  append (Filename.concat app.artifacts "protocol.jsonl") (Yojson.Safe.to_string body);
  let result = http (base ^ "/v1/invoke") (Some (Yojson.Safe.to_string body)) in
  if (result |> member "ok" |> to_bool) <> true then failwith (Yojson.Safe.to_string result);
  Transit.of_string (result |> member "resultTransit" |> to_string)
let read ?repo app method_name args =
  let allowed = ["thread-api/q"; "thread-api/pull"; "thread-api/get-blocks";
                 "thread-api/get-page-blocks-tree"; "thread-api/get-block-parents";
                 "thread-api/get-all-pages"; "thread-api/get-page-route-info";
                 "thread-api/get-display-properties"; "thread-api/get-property-closed-values";
                 "thread-api/get-bidirectional-properties"] in
  if not (List.mem method_name allowed) then invalid_arg ("Not a read oracle: " ^ method_name);
  invoke_fixture ?repo app method_name args
let validate ?repo app =
  let _, _, actual = daemon ?repo app in
  invoke_fixture ~repo:actual app "thread-api/validate-db"
    [Wire.String actual; Wire.Map [Wire.kw "fix", Wire.Bool false]]
let q ?repo ?(inputs = []) app query =
  let _, _, actual = daemon ?repo app in
  read ~repo:actual app "thread-api/q" [Wire.String actual; Wire.Array (Wire.String query :: inputs)]
let sdk_call ?(namespace = Api) app method_name args =
  let namespace = match namespace with Api -> "api" | Ui -> "sdk.ui" | Utils -> "sdk.utils"
    | Assets -> "sdk.assets" | Experiments -> "sdk.experiments" | Debug -> "sdk.debug" in
  let token = request app "sdk-call" ["namespace", `String namespace; "method", `String method_name; "args", `List args] |> to_int in
  let response = poll "production SDK result" (fun () ->
      match request app "sdk-result" ["token", `Int token] with `Null -> None | value -> Some value) in
  if response |> member "ok" |> to_bool then member "value" response
  else failwith (response |> member "error" |> to_string)

let start app =
  if app.closed || app.pid <> None then invalid_arg "Invalid app start state";
  List.iter (fun path -> if not (Sys.file_exists path) then failwith ("Missing build prerequisite: " ^ path)) [host app; daemon_bin app];
  let variables = ["LOGSEQ_ROOT_DIR", app.root; "LOGSEQ_UI_STATE_DIR", app.settings;
                   "LOGSEQ_DB_WORKER_BIN", daemon_bin app; "LOGSEQ_NATIVE_E2E_SOCKET", app.socket;
                   "LOGSEQ_NO_LOGIN_DAEMON", "1"; "LOGSEQ_BOOT_TRACE", "1"] in
  let variables = match Sys.getenv_opt "LOGSEQ_NATIVE_SDL_PREFIX" with
    | None -> variables
    | Some prefix ->
      let library = Filename.concat prefix "lib/libSDL2.dylib" in
      if not (Sys.file_exists library) then failwith ("Missing genuine SDL2: " ^ library);
      ("DYLD_LIBRARY_PATH", Filename.concat prefix "lib") :: variables in
  let env = Unix.environment () |> Array.to_list |> List.filter (fun entry ->
      let name = List.hd (String.split_on_char '=' entry) in not (List.mem_assoc name variables)) in
  let env = Array.of_list (List.map (fun (k,v) -> k ^ "=" ^ v) variables @ env) in
  let fd = Unix.openfile (Filename.concat app.artifacts "host.log") [Unix.O_CREAT; Unix.O_APPEND; Unix.O_WRONLY] 0o600 in
  app.log_fd <- Some fd;
  app.pid <- Some (Unix.create_process_env (host app) [|host app|] env Unix.stdin fd fd);
  ignore (poll ~timeout:45. "native retained tree" (fun () ->
      let pid = Option.get app.pid in
      match Unix.waitpid [Unix.WNOHANG] pid with
      | 0, _ ->
        if not (Sys.file_exists app.socket) then None
        else (match snapshot app with [] -> None | elements -> Some elements)
      | _, exit -> app.pid <- None;
        failwith ("Host exited during boot: " ^ (match exit with Unix.WEXITED c -> string_of_int c | Unix.WSIGNALED s -> "signal " ^ string_of_int s | Unix.WSTOPPED s -> "stopped " ^ string_of_int s))));
  if (Unix.stat app.socket).Unix.st_perm <> 0o600 then failwith "Unsafe automation socket permissions";
  if status app |> member "renderer" |> to_string = "noop" then failwith "No native renderer";
  ignore (daemon app)

let stop_daemons app =
  let path = Filename.concat app.root "server-list" in
  if Sys.file_exists path then
    read_file path |> String.split_on_char '\n' |> List.iter (fun line ->
        match String.split_on_char ' ' (String.trim line) |> List.filter ((<>) "") with
        | [pid_text; _] ->
          let pid = int_of_string pid_text in
          let owned =
            try
              let command = command_capture "/bin/ps" ["-p"; pid_text; "-o"; "command="] |> String.trim in
              String.starts_with ~prefix:(daemon_bin app ^ " --root-dir " ^ app.root ^ " ") command
            with Failure _ -> false in
          if owned then begin
            (try Unix.kill pid Sys.sigterm with Unix.Unix_error (Unix.ESRCH, _, _) -> ());
            (try ignore (poll ~timeout:5. "daemon shutdown" (fun () ->
                 try Unix.kill pid 0; None with Unix.Unix_error (Unix.ESRCH, _, _) -> Some ()))
             with Timeout _ -> (try Unix.kill pid Sys.sigkill with Unix.Unix_error (Unix.ESRCH, _, _) -> ()))
          end
        | [] -> () | _ -> failwith "Invalid server-list during cleanup")

let stop ?(daemon = true) app =
  (match app.pid with
   | None -> ()
   | Some pid ->
     (match Unix.waitpid [Unix.WNOHANG] pid with
      | 0, _ ->
        (try ignore (request app "quit" []) with Unix.Unix_error _ | Failure _ | Timeout _ -> ());
        let wait () = poll ~timeout:5. "host shutdown" (fun () -> match Unix.waitpid [Unix.WNOHANG] pid with 0, _ -> None | _ -> Some ()) in
        (try ignore (wait ()) with Timeout _ ->
           Unix.kill pid Sys.sigterm;
           (try ignore (wait ()) with Timeout _ -> Unix.kill pid Sys.sigkill; ignore (Unix.waitpid [] pid)))
      | _, state ->
        append (Filename.concat app.artifacts "host-exit.txt")
          (match state with Unix.WEXITED code -> "exit " ^ string_of_int code
           | Unix.WSIGNALED signum -> "signal " ^ string_of_int signum
           | Unix.WSTOPPED signum -> "stopped " ^ string_of_int signum));
     app.pid <- None);
  Option.iter Unix.close app.log_fd; app.log_fd <- None;
  if daemon then stop_daemons app;
  if Sys.file_exists app.socket then Unix.unlink app.socket
let restart ?daemon app () = stop ?daemon app; start app
let reload app = restart ~daemon:false app ()
let rec remove path =
  if Sys.file_exists path then
    if (Unix.lstat path).Unix.st_kind = Unix.S_DIR then
      (Sys.readdir path |> Array.iter (fun name -> remove (Filename.concat path name)); Unix.rmdir path)
    else Unix.unlink path
let close app =
  if not app.closed then Fun.protect ~finally:(fun () -> remove app.directory; app.closed <- true) (fun () -> stop app)
let screenshot ?(name = "desktop.png") app =
  let path = Filename.concat app.artifacts name in
  ignore (command_capture "/usr/sbin/screencapture" ["-x"; path]); path
let evidence app reason =
  write_file (Filename.concat app.artifacts "failure.txt") reason;
  List.iter (fun (name, probe) ->
      try write_file (Filename.concat app.artifacts name) (Yojson.Safe.pretty_to_string (probe ()))
      with exn -> write_file (Filename.concat app.artifacts (name ^ ".error.txt")) (Printexc.to_string exn))
    ["tree.json", (fun () -> `List (snapshot app)); "status.json", (fun () -> status app)];
  (try ignore (screenshot app) with exn -> write_file (Filename.concat app.artifacts "screenshot-error.txt") (Printexc.to_string exn));
  Sys.readdir app.root |> Array.iter (fun file -> if Filename.check_suffix file ".log" then
      write_file (Filename.concat app.artifacts file) (read_file (Filename.concat app.root file)))
