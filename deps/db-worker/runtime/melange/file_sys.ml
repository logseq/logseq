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

(* OPFS (browser worker) — cljs frontend.common.file.opfs: the root
   navigator.storage directory, single-segment getFileHandle names. *)
module Opfs_file = struct
  type dir_handle
  type file_handle
  type file
  type writable

  external get_directory : unit -> dir_handle Js.Promise.t = "getDirectory"
    [@@mel.scope "navigator.storage"]

  external get_file_handle : dir_handle -> string -> file_handle Js.Promise.t
    = "getFileHandle" [@@mel.send]

  external create_file_handle
    :  dir_handle
    -> string
    -> < create : bool > Js.t
    -> file_handle Js.Promise.t = "getFileHandle" [@@mel.send]

  external get_directory_handle
    :  dir_handle
    -> string
    -> dir_handle Js.Promise.t = "getDirectoryHandle" [@@mel.send]

  external get_file : file_handle -> file Js.Promise.t = "getFile" [@@mel.send]
  external text : file -> string Js.Promise.t = "text" [@@mel.send]

  external create_writable : file_handle -> writable Js.Promise.t
    = "createWritable" [@@mel.send]

  external write : writable -> string -> unit Js.Promise.t = "write" [@@mel.send]
  external close : writable -> unit Js.Promise.t = "close" [@@mel.send]
end

external promise_error_message : Js.Promise.error -> string option = "message"
  [@@mel.get] [@@mel.return { undefined_to_opt }]

let task_of_promise promise =
  let task, resolver = Db_worker_effect.wait () in
  let finish result =
    if Db_worker_effect.is_pending task then Db_worker_effect.wakeup resolver result
  in
  let on_ok value = finish (Ok value); Js.Promise.resolve () in
  let on_error error =
    let message =
      Option.value (promise_error_message error) ~default:"JavaScript promise rejected"
    in
    finish (Error message);
    Js.Promise.resolve ()
  in
  ignore
    (promise |> Js.Promise.then_ on_ok |> Js.Promise.catch on_error
      : unit Js.Promise.t);
  Db_worker_effect.bind task (function
    | Ok value -> Db_worker_effect.pure value
    | Error message -> Db_worker_effect.error (Failure message))

let is_browser () =
  match Runtime_env.kind () with
  | Runtime_env.Browser_worker -> true
  | _ -> false

let unsupported op =
  Db_worker_effect.error
    (Failure (Printf.sprintf "File_sys.%s is not supported on this platform" op))

let read_text path =
  if is_browser () then
    (* cljs <read-text!: root.getFileHandle(path) -> getFile -> text *)
    Db_worker_effect.bind
      (task_of_promise (Opfs_file.get_directory ()))
      (fun root ->
        Db_worker_effect.bind
          (task_of_promise (Opfs_file.get_file_handle root path))
          (fun file_handle ->
            Db_worker_effect.bind
              (task_of_promise (Opfs_file.get_file file_handle))
              (fun file -> task_of_promise (Opfs_file.text file))))
  else wrap (fun () -> Node.Fs.readFileAsUtf8Sync path)

let read_binary path =
  if is_browser () then unsupported "read_binary"
  else wrap (fun () -> Node.Buffer.toString (Fs_ext.readFileSync_buffer path))

let write_text path contents =
  if is_browser () then
    (* cljs <write-text!: getFileHandle {create:true} -> createWritable
       -> write -> close *)
    Db_worker_effect.bind
      (task_of_promise (Opfs_file.get_directory ()))
      (fun root ->
        Db_worker_effect.bind
          (task_of_promise
             (Opfs_file.create_file_handle root path [%mel.obj { create = true }]))
          (fun file_handle ->
            Db_worker_effect.bind
              (task_of_promise (Opfs_file.create_writable file_handle))
              (fun writable ->
                Db_worker_effect.bind
                  (task_of_promise (Opfs_file.write writable contents))
                  (fun () -> task_of_promise (Opfs_file.close writable)))))
  else wrap (fun () -> Node.Fs.writeFileAsUtf8Sync path contents)

let write_binary path contents =
  if is_browser () then unsupported "write_binary"
  else
    wrap (fun () -> Fs_ext.writeFileSync_buffer path (Node.Buffer.fromString contents))

let exists path =
  if is_browser () then
    Db_worker_effect.catch
      (Db_worker_effect.bind
         (task_of_promise (Opfs_file.get_directory ()))
         (fun root ->
           Db_worker_effect.catch
             (Db_worker_effect.map (fun _ -> true)
                (task_of_promise (Opfs_file.get_file_handle root path)))
             (fun _ ->
               Db_worker_effect.catch
                 (Db_worker_effect.map (fun _ -> true)
                    (task_of_promise (Opfs_file.get_directory_handle root path)))
                 (fun _ -> Db_worker_effect.pure false))))
      (fun _ -> Db_worker_effect.pure false)
  else wrap (fun () -> Node.Fs.existsSync path)

let mkdir_p path =
  if is_browser () then unsupported "mkdir_p"
  else wrap (fun () -> Fs_ext.mkdirSync path [%mel.obj { recursive = true }])

let readdir path =
  if is_browser () then unsupported "readdir"
  else wrap (fun () -> Array.to_list (Node.Fs.readdirSync path))

let remove path =
  if is_browser () then unsupported "remove" (* cljs delete-file! throws *)
  else
    wrap (fun () -> Fs_ext.rmSync path [%mel.obj { recursive = true; force = true }])

external renameSync : string -> string -> unit = "renameSync" [@@mel.module "fs"]

let write_text_atomic path contents =
  if is_browser () then unsupported "write_text_atomic"
  else
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

