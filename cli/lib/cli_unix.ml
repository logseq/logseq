type error = EAGAIN | EWOULDBLOCK | ETIMEDOUT | ESRCH | EPERM
type access_permission = R_OK | W_OK
type open_flag = O_RDWR
type socket_domain = PF_INET
type socket_type = SOCK_STREAM
type socket_bool_option = SO_REUSEADDR
type socket_float_option = SO_RCVTIMEO | SO_SNDTIMEO
type shutdown_command = SHUTDOWN_ALL
type inet_addr = string
type file_descr = int
type sockaddr = ADDR_INET of inet_addr * int
type host_entry = { h_addr_list : inet_addr array }

type tm = {
  tm_sec : int;
  tm_min : int;
  tm_hour : int;
  tm_mday : int;
  tm_mon : int;
  tm_year : int;
}

type stats = { st_size : int; st_mtime : float }
type process_result = { status : int; stdout : string; stderr : string }
type mkdir_result = Created | Already_exists

exception Cli_unix_error of error * string * string

let inet_addr_loopback = "127.0.0.1"

type js

external js_string : string -> js = "caml_js_from_string"
external js_to_string : js -> string = "caml_js_to_string"
external js_eval_string : string -> js = "caml_js_eval_string"
external js_fun_call : 'a -> js array -> 'b = "caml_js_fun_call"

let js_runtime_available =
  lazy
    (try
       ignore
         (js_eval_string
            "(function() { return function() { return 'ok'; }; })()");
       true
     with _ -> false)

let js_backend () = Lazy.force js_runtime_available

let js_call_string source args =
  let source = String.trim source in
  let fn =
    js_eval_string
      ({|
(function() {
  const __nodeRequire = function(name) {
    if (globalThis.process && typeof globalThis.process.getBuiltinModule === "function") {
      return globalThis.process.getBuiltinModule(name);
    }
    if (typeof module !== "undefined" && module.require) {
      return module.require(name);
    }
    throw new Error("Node builtin module is unavailable: " + name);
  };
  const require = __nodeRequire;
  return |}
     ^ source ^ {|;
})()
       |})
  in
  js_to_string (js_fun_call fn (Array.map js_string args))

let js_call_ok source args op detail =
  match js_call_string source args with
  | "ok" -> ()
  | message ->
      raise
        (Cli_unix_error (EPERM, op, if message = "" then detail else message))

let unix_error = function
  | Unix.EAGAIN -> EAGAIN
  | Unix.EWOULDBLOCK -> EWOULDBLOCK
  | Unix.ETIMEDOUT -> ETIMEDOUT
  | Unix.ESRCH | Unix.ENOENT -> ESRCH
  | Unix.EPERM | Unix.EACCES -> EPERM
  | _ -> EPERM

let wrap_unix op detail f =
  try f ()
  with Unix.Unix_error (err, _op, arg) ->
    raise
      (Cli_unix_error (unix_error err, op, if arg = "" then detail else arg))

let gettimeofday () =
  if js_backend () then
    float_of_string
      (js_call_string
         {|
(function() {
  return String(Date.now() / 1000);
})
         |}
         [||])
  else Unix.gettimeofday ()

let time () = gettimeofday ()

let iso_now () =
  if js_backend () then
    js_call_string
      {|
(function() {
  return new Date().toISOString();
})
      |}
      [||]
  else
    let tm = Unix.gmtime (Unix.gettimeofday ()) in
    Printf.sprintf "%04d-%02d-%02dT%02d:%02d:%02d.%03dZ"
      (tm.Unix.tm_year + 1900)
      (tm.Unix.tm_mon + 1)
      tm.Unix.tm_mday tm.Unix.tm_hour tm.Unix.tm_min tm.Unix.tm_sec 0

let floor_div a b =
  let q = a / b in
  let r = a mod b in
  if r <> 0 && r < 0 <> (b < 0) then q - 1 else q

let civil_from_days days =
  let z = days + 719468 in
  let era = floor_div (if z >= 0 then z else z - 146096) 146097 in
  let doe = z - (era * 146097) in
  let yoe = (doe - (doe / 1460) + (doe / 36524) - (doe / 146096)) / 365 in
  let y = yoe + (era * 400) in
  let doy = doe - ((365 * yoe) + (yoe / 4) - (yoe / 100)) in
  let mp = ((5 * doy) + 2) / 153 in
  let d = doy - (((153 * mp) + 2) / 5) + 1 in
  let m = mp + if mp < 10 then 3 else -9 in
  let y = y + if m <= 2 then 1 else 0 in
  (y, m, d)

let gmtime seconds =
  let whole = int_of_float (floor seconds) in
  let days = floor_div whole 86400 in
  let second_of_day = whole - (days * 86400) in
  let y, m, d = civil_from_days days in
  {
    tm_year = y - 1900;
    tm_mon = m - 1;
    tm_mday = d;
    tm_hour = second_of_day / 3600;
    tm_min = second_of_day mod 3600 / 60;
    tm_sec = second_of_day mod 60;
  }

let localtime seconds =
  if js_backend () then
    match
      String.split_on_char '\n'
        (js_call_string
           {|
(function(seconds) {
  const date = new Date(Number(seconds) * 1000);
  return [
    date.getSeconds(),
    date.getMinutes(),
    date.getHours(),
    date.getDate(),
    date.getMonth(),
    date.getFullYear() - 1900
  ].join("\n");
})
           |}
           [| string_of_float seconds |])
    with
    | [ sec; min; hour; mday; mon; year ] ->
        {
          tm_sec = int_of_string sec;
          tm_min = int_of_string min;
          tm_hour = int_of_string hour;
          tm_mday = int_of_string mday;
          tm_mon = int_of_string mon;
          tm_year = int_of_string year;
        }
    | _ -> gmtime seconds
  else
    let tm = Unix.localtime seconds in
    {
      tm_sec = tm.Unix.tm_sec;
      tm_min = tm.tm_min;
      tm_hour = tm.tm_hour;
      tm_mday = tm.tm_mday;
      tm_mon = tm.tm_mon;
      tm_year = tm.tm_year;
    }

let mkdir path perm =
  if js_backend () then
    js_call_ok
      {|
(function(path, perm) {
  try {
    require("fs").mkdirSync(path, { mode: Number(perm) });
    return "ok";
  } catch (error) {
    return error && error.message ? error.message : String(error);
  }
})
    |}
      [| path; string_of_int perm |]
      "mkdir" path
  else wrap_unix "mkdir" path (fun () -> Unix.mkdir path perm)

let rmdir path =
  if js_backend () then
    js_call_ok
      {|
(function(path) {
  try {
    require("fs").rmdirSync(path);
    return "ok";
  } catch (error) {
    return error && error.message ? error.message : String(error);
  }
})
    |}
      [| path |] "rmdir" path
  else wrap_unix "rmdir" path (fun () -> Unix.rmdir path)

let mkdir_exclusive path perm =
  if js_backend () then
    match
      js_call_string
        {|
(function(path, perm) {
  try {
    require("fs").mkdirSync(path, { mode: Number(perm) });
    return "created";
  } catch (error) {
    if (error && error.code === "EEXIST") return "exists";
    return "error\u0000" + (error && error.message ? error.message : String(error));
  }
})
        |}
        [| path; string_of_int perm |]
    with
    | "created" -> Created
    | "exists" -> Already_exists
    | message ->
        let detail =
          match String.index_opt message '\000' with
          | None -> ""
          | Some index ->
              String.sub message (index + 1) (String.length message - index - 1)
        in
        raise
          (Cli_unix_error
             (EPERM, "mkdir", if detail = "" then path else detail))
  else
    try
      Unix.mkdir path perm;
      Created
    with
    | Unix.Unix_error (Unix.EEXIST, _, _) -> Already_exists
    | Unix.Unix_error (err, _op, arg) ->
        raise
          (Cli_unix_error
             (unix_error err, "mkdir", if arg = "" then path else arg))

let file_exists path =
  if js_backend () then
    js_call_string
      {|
(function(path) {
  return require("fs").existsSync(path) ? "true" : "false";
})
      |}
      [| path |]
    = "true"
  else Sys.file_exists path

let is_directory path =
  if js_backend () then
    js_call_string
      {|
(function(path) {
  try {
    return require("fs").statSync(path).isDirectory() ? "true" : "false";
  } catch (_) {
    return "false";
  }
})
      |}
      [| path |]
    = "true"
  else Sys.file_exists path && Sys.is_directory path

let rec mkdir_p path =
  if path = "" || path = Filename.dirname path || file_exists path then ()
  else (
    mkdir_p (Filename.dirname path);
    match mkdir_exclusive path 0o755 with Created | Already_exists -> ())

let write_text_file path content =
  if js_backend () then
    js_call_ok
      {|
(function(path, content) {
  try {
    require("fs").writeFileSync(path, content, "utf8");
    return "ok";
  } catch (error) {
    return error && error.message ? error.message : String(error);
  }
})
      |}
      [| path; content |]
      "write" path
  else
    wrap_unix "write" path (fun () ->
        let oc = open_out_bin path in
        Fun.protect
          ~finally:(fun () -> close_out_noerr oc)
          (fun () -> output_string oc content))

let read_text_file path =
  if js_backend () then
    js_call_string
      {|
(function(path) {
  return require("fs").readFileSync(path, "utf8");
})
      |}
      [| path |]
  else
    wrap_unix "read" path (fun () ->
        let ic = open_in_bin path in
        Fun.protect
          ~finally:(fun () -> close_in_noerr ic)
          (fun () ->
            let len = in_channel_length ic in
            really_input_string ic len))

let rec remove_tree path =
  if js_backend () then
    js_call_ok
      {|
(function(path) {
  try {
    require("fs").rmSync(path, { recursive: true, force: true });
    return "ok";
  } catch (error) {
    return error && error.message ? error.message : String(error);
  }
})
      |}
      [| path |] "rm" path
  else if not (file_exists path) then ()
  else if is_directory path then (
    Sys.readdir path
    |> Array.iter (fun name -> remove_tree (Filename.concat path name));
    rmdir path)
  else Sys.remove path

let getpid () =
  if js_backend () then
    int_of_string
      (js_call_string
         {|
(function() {
  return String(process.pid || 0);
})
         |}
         [||])
  else Unix.getpid ()

let process_running pid =
  if pid <= 0 then false
  else if js_backend () then
    js_call_string
      {|
(function(pidText) {
  try {
    process.kill(Number(pidText), 0);
    return "true";
  } catch (error) {
    return error && error.code === "ESRCH" ? "false" : "true";
  }
})
      |}
      [| string_of_int pid |]
    = "true"
  else
    try
      Unix.kill pid 0;
      true
    with
    | Unix.Unix_error (Unix.ESRCH, _, _) -> false
    | Unix.Unix_error _ -> true

let chmod path perm =
  if js_backend () then
    js_call_ok
      {|
(function(path, perm) {
  try {
    require("fs").chmodSync(path, Number(perm));
    return "ok";
  } catch (error) {
    return error && error.message ? error.message : String(error);
  }
})
    |}
      [| path; string_of_int perm |]
      "chmod" path
  else wrap_unix "chmod" path (fun () -> Unix.chmod path perm)

let access path permissions =
  let flag =
    List.fold_left
      (fun acc -> function R_OK -> acc lor 4 | W_OK -> acc lor 2)
      0 permissions
  in
  if js_backend () then
    try
      js_call_ok
        {|
(function(path, flag) {
  try {
    const fs = require("fs");
    let mode = 0;
    if ((Number(flag) & 4) !== 0) mode |= fs.constants.R_OK;
    if ((Number(flag) & 2) !== 0) mode |= fs.constants.W_OK;
    fs.accessSync(path, mode);
    return "ok";
  } catch (error) {
    return error && error.message ? error.message : String(error);
  }
})
      |}
        [| path; string_of_int flag |]
        "access" path
    with Cli_unix_error _ ->
      if Sys.file_exists path then
        raise (Cli_unix_error (EPERM, "access", path))
      else raise (Cli_unix_error (ESRCH, "access", path))
  else
    let permission = function R_OK -> Unix.R_OK | W_OK -> Unix.W_OK in
    wrap_unix "access" path (fun () ->
        Unix.access path (List.map permission permissions))

let stat path =
  let fallback () =
    let size =
      if Sys.file_exists path && not (Sys.is_directory path) then
        let ic = open_in_bin path in
        Fun.protect
          ~finally:(fun () -> close_in_noerr ic)
          (fun () -> in_channel_length ic)
      else 0
    in
    { st_size = size; st_mtime = gettimeofday () }
  in
  if js_backend () then
    try
      match
        String.split_on_char '\n'
          (js_call_string
             {|
(function(path) {
  const fs = require("fs");
  const stat = fs.statSync(path);
  return String(stat.size) + "\n" + String(stat.mtimeMs / 1000);
})
           |}
             [| path |])
      with
      | size :: mtime :: _ ->
          { st_size = int_of_string size; st_mtime = float_of_string mtime }
      | _ -> fallback ()
    with _ -> fallback ()
  else
    wrap_unix "stat" path (fun () ->
        let stat = Unix.stat path in
        { st_size = stat.Unix.st_size; st_mtime = stat.st_mtime })

let environment () =
  if js_backend () then
    try
      let data =
        js_call_string
          {|
(function() {
  if (typeof process === "undefined" || !process.env) return "";
  return Object.keys(process.env)
    .map(function(key) { return key + "=" + process.env[key]; })
    .join("\u0000");
})
        |}
          [||]
      in
      if data = "" then [||]
      else String.split_on_char '\000' data |> Array.of_list
    with _ -> [||]
  else Unix.environment ()

let gethostname () =
  if js_backend () then
    try
      js_call_string
        {|
(function() {
  try { return require("os").hostname(); }
  catch (_) { return ""; }
})
      |}
        [||]
    with _ -> Option.value (Sys.getenv_opt "HOSTNAME") ~default:""
  else wrap_unix "gethostname" "" Unix.gethostname

let native_fds : (file_descr, Unix.file_descr) Hashtbl.t = Hashtbl.create 16
let native_next_fd = ref 3

let register_native_fd fd =
  let id = !native_next_fd in
  incr native_next_fd;
  Hashtbl.replace native_fds id fd;
  id

let native_fd id =
  match id with
  | 0 -> Unix.stdin
  | 1 -> Unix.stdout
  | 2 -> Unix.stderr
  | _ -> (
      match Hashtbl.find_opt native_fds id with
      | Some fd -> fd
      | None -> raise (Cli_unix_error (EPERM, "fd", string_of_int id)))

let openfile _path _flags _perm = 0

let close fd =
  if js_backend () then ()
  else
    match Hashtbl.find_opt native_fds fd with
    | None -> ()
    | Some unix_fd ->
        Hashtbl.remove native_fds fd;
        wrap_unix "close" (string_of_int fd) (fun () -> Unix.close unix_fd)

let command_args argv =
  match Array.to_list argv with
  | "env" :: command :: args -> (command, args)
  | command :: args -> (command, args)
  | [] ->
      raise (Cli_unix_error (EPERM, "create_process_env", "missing command"))

let join_nul values = String.concat "\000" values

let spawn_detached command args env =
  int_of_string
    (js_call_string
       {|
(function(command, argsText, envText) {
  const childProcess = require("child_process");
  const args = argsText === "" ? [] : argsText.split("\u0000");
  const env = Object.assign({}, process.env);
  if (envText !== "") {
    envText.split("\u0000").forEach(function(entry) {
      const index = entry.indexOf("=");
      if (index >= 0) env[entry.slice(0, index)] = entry.slice(index + 1);
    });
  }
  const child = childProcess.spawn(command, args, {
    detached: true,
    stdio: "ignore",
    env: env,
    shell: false
  });
  child.unref();
  return String(child.pid || 0);
})
       |}
       [| command; join_nul args; join_nul (Array.to_list env) |])

let create_process_env _prog argv _env _stdin _stdout _stderr =
  let command, args = command_args argv in
  if js_backend () then
    try spawn_detached command args _env
    with _ -> raise (Cli_unix_error (EPERM, "create_process_env", command))
  else
    wrap_unix "create_process_env" command (fun () ->
        Unix.create_process_env command
          (Array.of_list (command :: args))
          _env (native_fd _stdin) (native_fd _stdout) (native_fd _stderr))

let split_once sep value =
  match String.index_opt value sep with
  | None -> (value, "")
  | Some idx ->
      ( String.sub value 0 idx,
        String.sub value (idx + 1) (String.length value - idx - 1) )

let read_channel_all ic =
  let buffer = Buffer.create 1024 in
  let chunk = Bytes.create 4096 in
  let rec loop () =
    match input ic chunk 0 (Bytes.length chunk) with
    | 0 -> Buffer.contents buffer
    | n ->
        Buffer.add_subbytes buffer chunk 0 n;
        loop ()
  in
  loop ()

let line_has_session_id line =
  let line = String.lowercase_ascii line in
  String.contains line 's'
  && (String.contains line 'i' || String.contains line 'd')
  &&
  let contains needle =
    let needle_len = String.length needle in
    let rec loop index =
      index + needle_len <= String.length line
      && (String.sub line index needle_len = needle || loop (index + 1))
    in
    loop 0
  in
  contains "session" || contains "thread"

let read_session_stdout_line ic =
  let rec loop () =
    match input_line ic with
    | line when line_has_session_id line -> line
    | _ -> loop ()
    | exception End_of_file -> ""
  in
  loop ()

let run_process_capture command args env =
  if js_backend () then
    let output =
      js_call_string
        {|
(function(command, argsText, envText) {
  const childProcess = require("child_process");
  const args = argsText === "" ? [] : argsText.split("\u0000");
  const env = Object.assign({}, process.env);
  if (envText !== "") {
    envText.split("\u0000").forEach(function(entry) {
      const index = entry.indexOf("=");
      if (index >= 0) env[entry.slice(0, index)] = entry.slice(index + 1);
    });
  }
  const result = childProcess.spawnSync(command, args, {
    encoding: "utf8",
    env: env,
    shell: false
  });
  const status = result.status == null ? 1 : result.status;
  return String(status) + "\u0000" + (result.stdout || "") + "\u0000" +
    (result.stderr || (result.error && result.error.message) || "");
})
        |}
        [| command; join_nul args; join_nul (Array.to_list env) |]
    in
    let status_text, rest = split_once '\000' output in
    let stdout, stderr = split_once '\000' rest in
    { status = int_of_string status_text; stdout; stderr }
  else
    wrap_unix "run_process_capture" command (fun () ->
        let argv = Array.of_list (command :: args) in
        let ic, oc, ec = Unix.open_process_args_full command argv env in
        close_out_noerr oc;
        let stdout = read_channel_all ic in
        let stderr = read_channel_all ec in
        let status =
          match Unix.close_process_full (ic, oc, ec) with
          | Unix.WEXITED code -> code
          | Unix.WSIGNALED signal | Unix.WSTOPPED signal -> 128 + signal
        in
        { status; stdout; stderr })

let start_process_capture_session_line command args env =
  if js_backend () then
    let output =
      js_call_string
        {|
(function(command, argsText, envText) {
  const childProcess = require("child_process");
  const args = argsText === "" ? [] : argsText.split("\u0000");
  const env = Object.assign({}, process.env);
  if (envText !== "") {
    envText.split("\u0000").forEach(function(entry) {
      const index = entry.indexOf("=");
      if (index >= 0) env[entry.slice(0, index)] = entry.slice(index + 1);
    });
  }
  const childEnv = Object.assign({}, env);
  function slimEnv(source) {
    const keys = [
      "PATH", "HOME", "USER", "SHELL", "TMPDIR", "LANG", "LC_ALL",
      "http_proxy", "https_proxy", "all_proxy",
      "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY",
      "OPENAI_API_KEY", "OPENAI_BASE_URL", "OPENAI_ORG_ID",
      "CODEX_HOME", "RUST_LOG"
    ];
    const result = {};
    for (const key of keys) {
      if (source[key] != null) result[key] = source[key];
    }
    return result;
  }
  const helper = `
const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const command = process.argv[1];
const args = JSON.parse(process.argv[2] || "[]");
const env = JSON.parse(process.argv[3] || "{}");
function slimEnv(source) {
  const keys = [
    "PATH", "HOME", "USER", "SHELL", "TMPDIR", "LANG", "LC_ALL",
    "http_proxy", "https_proxy", "all_proxy",
    "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY",
    "OPENAI_API_KEY", "OPENAI_BASE_URL", "OPENAI_ORG_ID",
    "CODEX_HOME", "RUST_LOG"
  ];
  const result = {};
  for (const key of keys) {
    if (source[key] != null) result[key] = source[key];
  }
  return result;
}
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "logseq-cli-session-"));
const stdoutPath = path.join(tmpDir, "stdout.log");
const stderrPath = path.join(tmpDir, "stderr.log");
const stdoutFd = fs.openSync(stdoutPath, "a");
const stderrFd = fs.openSync(stderrPath, "a");
function finish(status, line, stderr) {
  try { fs.closeSync(stdoutFd); } catch (_) {}
  try { fs.closeSync(stderrFd); } catch (_) {}
  process.stdout.write(String(status) + "\\u0000" + (line || "") + "\\u0000" + (stderr || ""));
  process.exit(0);
}
function hasSession(line) {
  const lower = String(line || "").toLowerCase();
  return lower.includes("session") || lower.includes("thread");
}
const child = childProcess.spawn(command, args, {
  detached: true,
  stdio: ["ignore", stdoutFd, stderrFd],
  env,
  shell: false
});
let settled = false;
let lastStdout = "";
function readFile(path) {
  try { return fs.readFileSync(path, "utf8"); } catch (_) { return ""; }
}
function findSessionLine(text) {
  const lines = text.split(/\\r?\\n/);
  for (const line of lines) {
    if (hasSession(line)) return line;
  }
  return "";
}
const interval = setInterval(() => {
  if (settled) return;
  lastStdout = readFile(stdoutPath);
  const line = findSessionLine(lastStdout);
  if (line) {
    settled = true;
    clearInterval(interval);
    child.unref();
    finish(0, line, readFile(stderrPath));
  }
}, 50);
child.on("error", error => {
  if (!settled) {
    settled = true;
    clearInterval(interval);
    finish(1, "", error && error.message ? error.message : String(error));
  }
});
child.on("close", code => {
  if (!settled) {
    settled = true;
    clearInterval(interval);
    lastStdout = readFile(stdoutPath);
    const line = findSessionLine(lastStdout);
    const stderr = readFile(stderrPath);
    if (line) finish(0, line, stderr);
    else finish(code == null ? 1 : code, lastStdout, stderr);
  }
});
setTimeout(() => {
  if (!settled) {
    settled = true;
    clearInterval(interval);
    child.unref();
    finish(124, lastStdout, readFile(stderrPath) || "timed out waiting for session id");
  }
}, 30000);
`;
  const result = childProcess.spawnSync(process.execPath, [
    "-e", helper, command, JSON.stringify(args), JSON.stringify(childEnv)
  ], {encoding: "utf8", env: slimEnv(env), shell: false});
  const status = result.status == null ? 1 : result.status;
  return result.stdout || (String(status) + "\u0000\u0000" + (result.stderr || ""));
})
        |}
        [| command; join_nul args; join_nul (Array.to_list env) |]
    in
    let status_text, rest = split_once '\000' output in
    let stdout, stderr = split_once '\000' rest in
    { status = int_of_string status_text; stdout; stderr }
  else
    wrap_unix "start_process_capture_session_line" command (fun () ->
        let stdout_r, stdout_w = Unix.pipe () in
        let devnull = Unix.openfile "/dev/null" [ Unix.O_RDONLY ] 0 in
        let stderr_null = Unix.openfile "/dev/null" [ Unix.O_WRONLY ] 0 in
        let argv = Array.of_list (command :: args) in
        let _pid =
          Unix.create_process_env command argv env devnull stdout_w stderr_null
        in
        Unix.close devnull;
        Unix.close stderr_null;
        Unix.close stdout_w;
        let ic = Unix.in_channel_of_descr stdout_r in
        let stdout = read_session_stdout_line ic in
        close_in_noerr ic;
        { status = (if stdout = "" then 1 else 0); stdout; stderr = "" })

let kill pid signal =
  if js_backend () then
    try
      js_call_ok
        {|
(function(pid, signal) {
  try {
    process.kill(Number(pid), Number(signal));
    return "ok";
  } catch (error) {
    return error && error.code ? error.code : String(error);
  }
})
      |}
        [| string_of_int pid; string_of_int signal |]
        "kill" (string_of_int pid)
    with Cli_unix_error _ ->
      raise (Cli_unix_error (ESRCH, "kill", string_of_int pid))
  else wrap_unix "kill" (string_of_int pid) (fun () -> Unix.kill pid signal)

let open_url url =
  if js_backend () then
    try
      js_call_string
        {|
(function(url) {
  try {
    const childProcess = require("child_process");
    const platform = process.platform;
    let command;
    let args;
    if (platform === "darwin") {
      command = "open";
      args = [url];
    } else if (platform === "linux") {
      command = "xdg-open";
      args = [url];
    } else if (platform === "win32") {
      command = "cmd.exe";
      args = ["/d", "/c", "start", "", url];
    } else {
      return "unsupported";
    }
    const child = childProcess.spawn(command, args, {
      detached: true,
      stdio: "ignore",
      shell: false
    });
    child.unref();
    return "ok";
  } catch (error) {
    return error && error.message ? error.message : String(error);
  }
})
      |}
        [| url |]
      = "ok"
    with _ -> false
  else false

let sleepf seconds =
  if js_backend () then
    let deadline = gettimeofday () +. seconds in
    while gettimeofday () < deadline do
      ()
    done
  else Unix.sleepf seconds

let write_stdout text =
  if js_backend () then
    ignore
      (js_call_string
         {|
(function(text) {
  try {
    process.stdout.write(text);
    return "ok";
  } catch (error) {
    return error && error.message ? error.message : String(error);
  }
})
         |}
         [| text |])
  else (
    output_string stdout text;
    flush stdout)

let socket _domain _kind _protocol : file_descr =
  if js_backend () then
    raise (Cli_unix_error (EPERM, "socket", "sockets are unavailable in wasm"))
  else
    let domain = match _domain with PF_INET -> Unix.PF_INET in
    let kind = match _kind with SOCK_STREAM -> Unix.SOCK_STREAM in
    wrap_unix "socket" "" (fun () ->
        Unix.socket domain kind _protocol |> register_native_fd)

let unix_sockaddr = function
  | ADDR_INET (host, port) ->
      Unix.ADDR_INET (Unix.inet_addr_of_string host, port)

let cli_sockaddr = function
  | Unix.ADDR_INET (addr, port) ->
      ADDR_INET (Unix.string_of_inet_addr addr, port)
  | Unix.ADDR_UNIX path -> ADDR_INET (path, 0)

let bind socket addr : unit =
  if js_backend () then raise (Cli_unix_error (EPERM, "bind", ""))
  else
    wrap_unix "bind" "" (fun () ->
        Unix.bind (native_fd socket) (unix_sockaddr addr))

let listen socket backlog : unit =
  if js_backend () then raise (Cli_unix_error (EPERM, "listen", ""))
  else wrap_unix "listen" "" (fun () -> Unix.listen (native_fd socket) backlog)

let accept socket : file_descr * sockaddr =
  if js_backend () then raise (Cli_unix_error (EPERM, "accept", ""))
  else
    wrap_unix "accept" "" (fun () ->
        let fd, addr = Unix.accept (native_fd socket) in
        (register_native_fd fd, cli_sockaddr addr))

let connect socket addr : unit =
  if js_backend () then raise (Cli_unix_error (EPERM, "connect", ""))
  else
    wrap_unix "connect" "" (fun () ->
        Unix.connect (native_fd socket) (unix_sockaddr addr))

let shutdown socket _command =
  if js_backend () then ()
  else
    let command = match _command with SHUTDOWN_ALL -> Unix.SHUTDOWN_ALL in
    wrap_unix "shutdown" "" (fun () -> Unix.shutdown (native_fd socket) command)

let select read write except timeout =
  if js_backend () then ([], [], [])
  else
    let fd_pairs fds = List.map (fun fd -> (fd, native_fd fd)) fds in
    let ready original ready_fds =
      original
      |> List.filter (fun (_id, fd) -> List.exists (( == ) fd) ready_fds)
      |> List.map fst
    in
    let read_pairs = fd_pairs read in
    let write_pairs = fd_pairs write in
    let except_pairs = fd_pairs except in
    wrap_unix "select" "" (fun () ->
        let r, w, e =
          Unix.select (List.map snd read_pairs) (List.map snd write_pairs)
            (List.map snd except_pairs)
            timeout
        in
        (ready read_pairs r, ready write_pairs w, ready except_pairs e))

let setsockopt socket option value =
  if js_backend () then ()
  else
    let option = match option with SO_REUSEADDR -> Unix.SO_REUSEADDR in
    wrap_unix "setsockopt" "" (fun () ->
        Unix.setsockopt (native_fd socket) option value)

let setsockopt_float socket option value =
  if js_backend () then ()
  else
    let option =
      match option with
      | SO_RCVTIMEO -> Unix.SO_RCVTIMEO
      | SO_SNDTIMEO -> Unix.SO_SNDTIMEO
    in
    wrap_unix "setsockopt_float" "" (fun () ->
        Unix.setsockopt_float (native_fd socket) option value)

let in_channel_of_descr fd =
  if js_backend () then failwith "socket input is unavailable in wasm"
  else Unix.in_channel_of_descr (native_fd fd)

let out_channel_of_descr fd =
  if js_backend () then failwith "socket output is unavailable in wasm"
  else Unix.out_channel_of_descr (native_fd fd)

let gethostbyname host =
  if js_backend () then { h_addr_list = [| host |] }
  else
    wrap_unix "gethostbyname" host (fun () ->
        let entry = Unix.gethostbyname host in
        {
          h_addr_list =
            Array.map Unix.string_of_inet_addr entry.Unix.h_addr_list;
        })
