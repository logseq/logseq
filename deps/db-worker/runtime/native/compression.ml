let supported () = true

let wrap run =
  try Db_worker_effect.pure (run ()) with error -> Db_worker_effect.error error

let gzip_encode payload =
  wrap (fun () ->
    let output = Buffer.create (String.length payload / 2) in
    let encoder = Gz.Def.encoder (`String payload) (`Buffer output) ~mtime:0l Gz.Unix
        ~q:(De.Queue.create 0x10000) ~w:(De.Lz77.make_window ~bits:15) ~level:4 in
    match Gz.Def.encode encoder with
    | `End _ -> Buffer.contents output
    | `Await _ | `Flush _ -> failwith "gzip encoder: unexpected manual I/O request")

let gzip_decode payload =
  wrap (fun () ->
    let output = Bigstringaf.create Gz.io_buffer_size in
    let result = Buffer.create (String.length payload) in
    let drain decoder =
      Buffer.add_string result
        (Bigstringaf.substring output ~off:0 ~len:(Gz.io_buffer_size - Gz.Inf.dst_rem decoder)) in
    let rec decode decoder =
      match Gz.Inf.decode decoder with
      | `Flush next -> drain next; decode (Gz.Inf.flush next)
      | `End next ->
          if Gz.Inf.src_rem next <> 0 then failwith "Unexpected data after gzip member";
          drain next; Buffer.contents result
      | `Malformed message -> failwith ("Invalid gzip: " ^ message)
      | `Await _ -> failwith "gzip decoder: unexpected manual input request" in
    decode (Gz.Inf.decoder (`String payload) ~o:output))
