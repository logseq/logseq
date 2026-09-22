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
      let tmp = path ^ ".tmp" in
      let oc = open_out_bin tmp in
      output_string oc contents;
      close_out oc;
      Unix.rename tmp path)

type file_stat = { mtime_ms : float option; birthtime_ms : float option }

let stat _path = Db_worker_effect.pure None
