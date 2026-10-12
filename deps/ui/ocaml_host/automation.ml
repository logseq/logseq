(* Private opt-in transport, serviced exclusively by the SDL main loop. *)
type peer =
  { fd : Unix.file_descr
  ; input : Buffer.t
  ; mutable output : string option
  ; mutable sent : int
  ; deadline : float
  }

type t =
  { listener : Unix.file_descr
  ; path : string
  ; mutable peers : peer list
  }

let start () =
  match Sys.getenv_opt "LOGSEQ_NATIVE_E2E_SOCKET" with
  | None -> None
  | Some path ->
    if path = "" || Filename.is_relative path then
      invalid_arg "LOGSEQ_NATIVE_E2E_SOCKET must be absolute";
    let dir = Unix.stat (Filename.dirname path) in
    if dir.Unix.st_kind <> Unix.S_DIR || dir.st_uid <> Unix.getuid ()
       || dir.st_perm land 0o077 <> 0 then
      invalid_arg "Automation socket requires an owned private directory (0700)";
    let listener = Unix.socket Unix.PF_UNIX Unix.SOCK_STREAM 0 in
    Unix.set_close_on_exec listener;
    let old_mask = Unix.umask 0o077 in
    (try
       Unix.bind listener (Unix.ADDR_UNIX path);
       ignore (Unix.umask old_mask);
       Unix.chmod path 0o600;
       Unix.listen listener 8;
       Unix.set_nonblock listener
     with exn ->
       ignore (Unix.umask old_mask);
       Unix.close listener;
       raise exn);
    Some { listener; path; peers = [] }

let would_block = function
  | Unix.Unix_error ((Unix.EAGAIN | Unix.EWOULDBLOCK), _, _) -> true
  | _ -> false

let service server handle =
  match server with
  | None -> ()
  | Some state ->
    (try
       let fd, _ = Unix.accept state.listener in
       Unix.set_close_on_exec fd;
       Unix.set_nonblock fd;
       if List.length state.peers >= 8 then Unix.close fd
       else
         state.peers <-
           { fd; input = Buffer.create 256; output = None; sent = 0;
             deadline = Unix.gettimeofday () +. 10. } :: state.peers
     with exn when would_block exn -> ());
    let service_peer peer =
      try
        if Unix.gettimeofday () > peer.deadline then raise End_of_file;
        (match peer.output with
         | Some _ -> ()
         | None ->
           let chunk = Bytes.create 8192 in
           let count = Unix.read peer.fd chunk 0 (Bytes.length chunk) in
           if count = 0 then raise End_of_file;
           Buffer.add_subbytes peer.input chunk 0 count;
           if Buffer.length peer.input > 1_048_576 then raise End_of_file;
           let input = Buffer.contents peer.input in
           (match String.index_opt input '\n' with
            | None -> ()
            | Some end_pos ->
              let result =
                try
                  let request = Yojson.Safe.from_string (String.sub input 0 end_pos) in
                  `Assoc [ "ok", `Bool true; "result", handle request ]
                with exn ->
                  `Assoc [ "ok", `Bool false; "error", `String (Printexc.to_string exn) ]
              in
              peer.output <- Some (Yojson.Safe.to_string result ^ "\n")));
        match peer.output with
        | None -> true
        | Some response ->
          let count = Unix.write_substring peer.fd response peer.sent
              (String.length response - peer.sent) in
          peer.sent <- peer.sent + count;
          if peer.sent < String.length response then true
          else (Unix.close peer.fd; false)
      with
      | exn when would_block exn -> true
      | End_of_file
      | Unix.Unix_error ((Unix.ECONNRESET | Unix.EPIPE), _, _) ->
        Unix.close peer.fd;
        false
    in
    state.peers <- List.filter service_peer state.peers

let close = function
  | None -> ()
  | Some state ->
    List.iter (fun peer -> Unix.close peer.fd) state.peers;
    Unix.close state.listener;
    Unix.unlink state.path
