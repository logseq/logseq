(* node:fs sync calls lifted into the effect — the worker's fs is
   synchronous anyway. mkdirSync/rmSync are missing from melange.node
   so they get minimal externals here. *)
module Fs_ext = struct
  external mkdirSync : string -> < recursive : bool > Js.t -> unit = "mkdirSync"
    [@@mel.module "fs"]

  external rmSync : string -> < recursive : bool ; force : bool > Js.t -> unit = "rmSync"
    [@@mel.module "fs"]

  external readFileSync_buffer : string -> Node.Buffer.t = "readFileSync" [@@mel.module "fs"]

  external writeFileSync_buffer : string -> Node.Buffer.t -> unit = "writeFileSync"
    [@@mel.module "fs"]
end

let wrap f =
  try Db_worker_effect.pure (f ())
  with Js.Exn.Error e ->
    Db_worker_effect.error
      (Failure (match Js.Exn.message e with Some m -> m | None -> "fs error"))

let read_text path = wrap (fun () -> Node.Fs.readFileAsUtf8Sync path)
let read_binary path = wrap (fun () -> Node.Buffer.toString (Fs_ext.readFileSync_buffer path))
let write_text path contents = wrap (fun () -> Node.Fs.writeFileAsUtf8Sync path contents)

let write_binary path contents =
  wrap (fun () -> Fs_ext.writeFileSync_buffer path (Node.Buffer.fromString contents))

let exists path = wrap (fun () -> Node.Fs.existsSync path)

let mkdir_p path =
  wrap (fun () -> Fs_ext.mkdirSync path [%mel.obj { recursive = true }])

let readdir path = wrap (fun () -> Array.to_list (Node.Fs.readdirSync path))

let remove path =
  wrap (fun () -> Fs_ext.rmSync path [%mel.obj { recursive = true; force = true }])

external renameSync : string -> string -> unit = "renameSync" [@@mel.module "fs"]

let write_text_atomic path contents =
  wrap (fun () ->
      let tmp = path ^ ".tmp" in
      Node.Fs.writeFileAsUtf8Sync tmp contents;
      renameSync tmp path)

module Fs_stat = struct
  external statSync : string -> < mtimeMs : float ; birthtimeMs : float > Js.t = "statSync"
    [@@mel.module "fs"]
end

type file_stat = { mtime_ms : float option; birthtime_ms : float option }

let stat path =
  match Runtime_env.kind () with
  | Runtime_env.Node ->
    Db_worker_effect.catch
      (wrap (fun () ->
           let s = Fs_stat.statSync path in
           Some
             { mtime_ms = Some s##mtimeMs
             ; birthtime_ms = Some s##birthtimeMs }))
      (fun _ -> Db_worker_effect.pure None)
  | _ -> Db_worker_effect.pure None

module Fs_more = struct
  external appendFileSync : string -> string -> unit = "appendFileSync"
    [@@mel.module "fs"]

  external openSync : string -> string -> int = "openSync" [@@mel.module "fs"]
  external writeFileSync_fd : int -> string -> unit = "writeFileSync"
    [@@mel.module "fs"]

  external closeSync : int -> unit = "closeSync" [@@mel.module "fs"]
  external realpathSync : string -> string = "realpathSync" [@@mel.module "fs"]
  external accessSync : string -> int -> unit = "accessSync" [@@mel.module "fs"]
  external statSync_obj : string -> Js.Json.t = "statSync" [@@mel.module "fs"]
  external is_dir : Js.Json.t -> bool = "isDirectory" [@@mel.send]
  external fs_constants : Js.Json.t = "constants" [@@mel.scope "fs"]
  external const_int : Js.Json.t -> string -> int = "" [@@mel.get_index]
end

let append_text path contents =
  wrap (fun () -> Fs_more.appendFileSync path contents)

(* openSync 'wx' — exclusive create, fails EEXIST like the cljs
   server-list lock file. *)
let write_file_exclusive path contents =
  wrap (fun () ->
      let fd = Fs_more.openSync path "wx" in
      try
        Fs_more.writeFileSync_fd fd contents;
        Fs_more.closeSync fd
      with exn ->
        Fs_more.closeSync fd;
        raise exn)

let rename src dst = wrap (fun () -> renameSync src dst)

let is_directory path = wrap (fun () -> Fs_more.is_dir (Fs_more.statSync_obj path))

(* fs.constants.R_OK | W_OK *)
let check_read_write path =
  wrap (fun () ->
      let c = Fs_more.fs_constants in
      Fs_more.accessSync path
        (Fs_more.const_int c "R_OK" lor Fs_more.const_int c "W_OK"))

let realpath path = wrap (fun () -> Fs_more.realpathSync path)

