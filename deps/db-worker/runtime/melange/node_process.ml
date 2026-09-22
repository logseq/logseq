(* Node `process` externals — melange.node covers argv/exit/cwd/env;
   the rest are small externals like file_sys.ml's Fs_ext. *)

external pid_ : int = "pid" [@@mel.module "process"]

let argv () = Array.to_list Node.Process.argv
let pid () = pid_
let exit code = ignore (Node.Process.exit code)
let cwd = Node.Process.cwd
let set_env = Node.Process.putEnvVar

external homedir : unit -> string = "homedir" [@@mel.module "os"]

let home_dir = homedir

external on_ : Node.Process.t -> string -> (unit -> unit [@u]) -> unit = "on"
  [@@mel.send]

let on_signal sig_name f = on_ Node.Process.process sig_name (fun [@u] () -> f ())

external kill_ : int -> int -> bool = "kill" [@@mel.scope "process"]

external exn_code : Js.Exn.t -> string option = "code"
  [@@mel.get] [@@mel.return { undefined_to_opt }]

type pid_status =
  | Alive
  | Not_found
  | No_permission
  | Error

let kill0 pid =
  try ignore (kill_ pid 0); Alive
  with Js.Exn.Error e ->
    (match exn_code e with
     | Some "ESRCH" -> Not_found
     | Some "EPERM" -> No_permission
     | _ -> Error)

(* cljs sleep-sync! — SharedArrayBuffer + Atomics.wait. *)
module Atomics = struct
  type shared_buffer

  external shared_array_buffer : int -> shared_buffer = "SharedArrayBuffer"
    [@@mel.new]

  external int32_array : shared_buffer -> Js.Typed_array.Int32Array.t = "Int32Array"
    [@@mel.new]

  external wait : Js.Typed_array.Int32Array.t -> int -> int -> int -> string = "wait"
    [@@mel.scope "Atomics"]
end

let sleep_sync_ms ms =
  let shared = Atomics.shared_array_buffer 4 in
  let view = Atomics.int32_array shared in
  ignore (Atomics.wait view 0 0 ms)

(* child_process.spawnSync(cmd, args, {}) — melange.node's binding
   doesn't take args/opts, so this is a local external. *)
module Spawn = struct
  type result =
    < status : int Js.null
    ; stdout : Node.Buffer.t Js.null >
    Js.t

  external spawnSync : string -> string array -> Js.Json.t -> result = "spawnSync"
    [@@mel.module "child_process"]
end

let spawn_stdout cmd args =
  let result =
    Spawn.spawnSync cmd (Array.of_list args) (Js.Json.object_ (Js.Dict.empty ()))
  in
  match Js.nullToOption result##status, Js.nullToOption result##stdout with
  | Some status, Some stdout -> Some (status, Node.Buffer.toString stdout)
  | _ -> None

external stdout_ : < isTTY : bool Js.undefined > Js.t = "stdout"
  [@@mel.scope "process"]

let stdout_is_tty () =
  match Js.undefinedToOption stdout_##isTTY with
  | Some v -> v
  | None -> false
