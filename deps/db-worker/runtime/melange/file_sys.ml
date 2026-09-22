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
