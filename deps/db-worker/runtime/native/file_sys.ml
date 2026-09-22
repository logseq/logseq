let wrap f =
  try Db_worker_effect.pure (f ()) with exn -> Db_worker_effect.error exn

let read_text path =
  wrap (fun () ->
      let ic = open_in_bin path in
      let n = in_channel_length ic in
      let s = really_input_string ic n in
      close_in ic;
      s)

let read_binary = read_text

let write_text path contents =
  wrap (fun () ->
      let oc = open_out_bin path in
      output_string oc contents;
      close_out oc)

let write_binary = write_text

let exists path = wrap (fun () -> Sys.file_exists path)

let mkdir_p path =
  wrap (fun () ->
      let rec mkdir path =
        if path <> "" && path <> "/" && not (Sys.file_exists path) then begin
          mkdir (Filename.dirname path);
          Unix.mkdir path 0o755
        end
      in
      mkdir path)

let readdir path = wrap (fun () -> Array.to_list (Sys.readdir path))

let remove path =
  wrap (fun () ->
      let rec rm path =
        if Sys.file_exists path then
          if Sys.is_directory path then begin
            Array.iter (fun f -> rm (Filename.concat path f)) (Sys.readdir path);
            Unix.rmdir path
          end else Sys.remove path
      in
      rm path)

let write_text_atomic path contents =
  wrap (fun () ->
      (* cljs write-text-atomic!: ensure-dir + .<base>.tmp-<uuid> + rename *)
      let dir = Filename.dirname path in
      let tmp =
        Filename.concat dir
          ("." ^ Filename.basename path ^ ".tmp-" ^ Uuid_gen.uuid ())
      in
      let rec mkdir p =
        if p <> "" && p <> "/" && not (Sys.file_exists p) then begin
          mkdir (Filename.dirname p);
          Unix.mkdir p 0o755
        end
      in
      mkdir dir;
      let oc = open_out_bin tmp in
      output_string oc contents;
      close_out oc;
      Unix.rename tmp path)

type file_stat = { mtime_ms : float option; birthtime_ms : float option }

let stat _path = Db_worker_effect.pure None

let append_text path contents =
  wrap (fun () ->
      let oc =
        open_out_gen [ Open_wronly; Open_append; Open_creat; Open_text ] 0o644 path
      in
      output_string oc contents;
      close_out oc)

let write_file_exclusive path contents =
  wrap (fun () ->
      let oc =
        open_out_gen [ Open_wronly; Open_creat; Open_excl; Open_text ] 0o644 path
      in
      output_string oc contents;
      close_out oc)

let rename src dst = wrap (fun () -> Unix.rename src dst)
let is_directory path = wrap (fun () -> Sys.is_directory path)
let is_file path =
  wrap (fun () -> (Unix.stat path).Unix.st_kind = Unix.S_REG)

let copy_file src dst =
  wrap (fun () ->
      let ic = open_in_bin src in
      let oc = open_out_bin dst in
      let buf = Bytes.create 65536 in
      let rec loop () =
        match input ic buf 0 65536 with
        | 0 -> ()
        | n ->
          output oc buf 0 n;
          loop ()
      in
      loop ();
      close_in ic;
      close_out oc)

let symlink ~target ~link = wrap (fun () -> Unix.symlink target link)

let check_read_write path =
  wrap (fun () -> Unix.access path [ Unix.R_OK; Unix.W_OK ])

let realpath path = wrap (fun () -> Unix.realpath path)
