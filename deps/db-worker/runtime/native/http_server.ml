(* Node `http` server — threaded POSIX implementation.

   One accept thread plus one connection thread per client. Each
   request is parsed (request line + headers + Content-Length/chunked
   body), dispatched to the handler, and the connection stays open for
   HTTP/1.1 keep-alive until the peer disconnects or the server is
   closed. Responses without a Content-Length are chunked like Node's
   http.ServerResponse. *)

module E = Db_worker_effect

type res =
  { res_fd : Unix.file_descr
  ; res_mu : Mutex.t
  ; mutable res_head_sent : bool
  ; mutable res_chunked : bool
  ; mutable res_ended : bool
  ; mutable res_close : bool
  }

type req =
  { req_method : string
  ; req_url : string
  ; req_headers : (string * string) list
  ; req_body : string
  ; req_conn : conn
  }

and conn =
  { conn_fd : Unix.file_descr
  ; conn_mu : Mutex.t
  ; mutable conn_closed : bool
  ; conn_on_close : (unit -> unit) list ref
  ; conn_server : server
  }

and server =
  { srv_handler : req -> res -> unit
  ; srv_mu : Mutex.t
  ; mutable srv_listen : Unix.file_descr option
  ; srv_conns : conn list ref
  }

(* ---- buffered socket reader ---- *)

type reader =
  { fd : Unix.file_descr
  ; buf : Bytes.t
  ; mutable pos : int
  ; mutable len : int
  }

let reader_of_fd fd = { fd; buf = Bytes.create 65536; pos = 0; len = 0 }

(* None on clean EOF / closed connection. *)
let reader_fill (r : reader) : bool =
  if r.pos < r.len then true
  else begin
    r.pos <- 0;
    r.len <- 0;
    match (try Unix.read r.fd r.buf 0 (Bytes.length r.buf)
           with Unix.Unix_error _ -> -1) with
    | n when n <= 0 -> false
    | n -> r.len <- n; true
  end

(* Reads a CRLF-terminated line (no limit: header lines here are
   small). Returns the line without CRLF, or [None] on EOF. *)
let reader_line (r : reader) : string option =
  let out = Buffer.create 256 in
  let prev_cr = ref false in
  let rec go () =
    if not (reader_fill r) then
      (if Buffer.length out = 0 then None else Some (Buffer.contents out))
    else begin
      let c = Bytes.get r.buf r.pos in
      r.pos <- r.pos + 1;
      if c = '\n' && !prev_cr then begin
        (* drop the CR we appended *)
        Buffer.truncate out (Buffer.length out - 1);
        Some (Buffer.contents out)
      end
      else begin
        prev_cr := (c = '\r');
        Buffer.add_char out c;
        go ()
      end
    end
  in
  go ()

let reader_read (r : reader) (n : int) : string =
  let out = Buffer.create n in
  let remaining = ref n in
  while !remaining > 0 do
    if not (reader_fill r) then remaining := 0
    else begin
      let take = min !remaining (r.len - r.pos) in
      Buffer.add_subbytes out r.buf r.pos take;
      r.pos <- r.pos + take;
      remaining := !remaining - take
    end
  done;
  Buffer.contents out

let header_lookup (headers : (string * string) list) (name : string) :
    string option =
  let name = String.lowercase_ascii name in
  let rec go = function
    | [] -> None
    | (k, v) :: rest ->
        if String.lowercase_ascii k = name then Some v else go rest
  in
  go headers

let header_present (headers : (string * string) list) (name : string) : bool =
  header_lookup headers name <> None

(* ---- request parsing ---- *)

let parse_request_line (line : string) : (string * string) option =
  match String.split_on_char ' ' line with
  | meth :: url :: _ when meth <> "" && url <> "" -> Some (meth, url)
  | _ -> None

let parse_header_line (line : string) : (string * string) option =
  match String.index_opt line ':' with
  | Some i when i > 0 ->
      let name = String.sub line 0 i in
      let value = String.sub line (i + 1) (String.length line - i - 1) in
      Some (String.trim name, String.trim value)
  | _ -> None

let read_headers (r : reader) : (string * string) list option =
  let rec go acc =
    match reader_line r with
    | None -> None
    | Some "" -> Some (List.rev acc)
    | Some line ->
        (match parse_header_line line with
         | Some h -> go (h :: acc)
         | None -> go acc)
  in
  go []

let read_chunked_body (r : reader) : string =
  let out = Buffer.create 4096 in
  let rec go () =
    match reader_line r with
    | None -> ()
    | Some line ->
        let size_str =
          match String.index_opt line ';' with
          | Some i -> String.sub line 0 i
          | None -> line
        in
        (match int_of_string_opt ("0x" ^ String.trim size_str) with
         | None | Some 0 ->
             (* trailing CRLF / trailers *)
             ignore (read_headers r)
         | Some n ->
             Buffer.add_string out (reader_read r n);
             ignore (reader_line r);
             go ())
  in
  go ();
  Buffer.contents out

let read_body_of (r : reader) (headers : (string * string) list) : string =
  match header_lookup headers "content-length" with
  | Some len_s ->
      (match int_of_string_opt (String.trim len_s) with
       | Some n when n > 0 -> reader_read r n
       | _ -> "")
  | None ->
      (match header_lookup headers "transfer-encoding" with
       | Some te when String.lowercase_ascii (String.trim te) = "chunked" ->
           read_chunked_body r
       | _ -> "")

(* ---- response ---- *)

let write_all (fd : Unix.file_descr) (data : string) : unit =
  let rec go off =
    if off < String.length data then
      let n = Unix.write fd (Bytes.unsafe_of_string data) off
          (String.length data - off) in
      go (off + n)
  in
  go 0

let status_reason = function
  | 200 -> "OK" | 204 -> "No Content" | 400 -> "Bad Request"
  | 404 -> "Not Found" | 405 -> "Method Not Allowed"
  | 410 -> "Gone" | 500 -> "Internal Server Error"
  | 503 -> "Service Unavailable"
  | code -> string_of_int code

let res_send_raw (res : res) (data : string) : unit =
  if String.length data > 0 then write_all res.res_fd data

let write_head (res : res) ~status ~headers : unit =
  Mutex.lock res.res_mu;
  (try
     if res.res_ended || res.res_head_sent then invalid_arg "write_head after end"
     else begin
       res.res_head_sent <- true;
       res.res_chunked <- not (header_present headers "Content-Length");
       let b = Buffer.create 512 in
       Buffer.add_string b
         (Printf.sprintf "HTTP/1.1 %d %s\r\n" status (status_reason status));
       List.iter
         (fun (k, v) -> Buffer.add_string b (k ^ ": " ^ v ^ "\r\n"))
         headers;
       (match header_lookup headers "Connection" with
        | Some v when String.lowercase_ascii (String.trim v) = "close" ->
            res.res_close <- true
        | _ -> ());
       if res.res_chunked then
         Buffer.add_string b "Transfer-Encoding: chunked\r\n";
       Buffer.add_string b "\r\n";
       res_send_raw res (Buffer.contents b)
     end
   with exn -> Mutex.unlock res.res_mu; raise exn);
  Mutex.unlock res.res_mu

let write (res : res) (data : string) : unit =
  Mutex.lock res.res_mu;
  (try
     if not res.res_ended then begin
       if res.res_chunked then
         res_send_raw res
           (Printf.sprintf "%x\r\n%s\r\n" (String.length data) data)
       else res_send_raw res data
     end
   with exn -> Mutex.unlock res.res_mu; raise exn);
  Mutex.unlock res.res_mu

let res_end (res : res) : unit =
  Mutex.lock res.res_mu;
  (try
     if not res.res_ended then begin
       res.res_ended <- true;
       if res.res_chunked then res_send_raw res "0\r\n\r\n";
       if res.res_close then
         (try Unix.shutdown res.res_fd Unix.SHUTDOWN_ALL
          with Unix.Unix_error _ -> ())
     end
   with exn -> Mutex.unlock res.res_mu; raise exn);
  Mutex.unlock res.res_mu

(* ---- request ---- *)

let req_method (req : req) : string = req.req_method
let req_url (req : req) : string = req.req_url
let on_close (req : req) (f : unit -> unit) : unit =
  req.req_conn.conn_on_close := f :: !(req.req_conn.conn_on_close)
let read_body (req : req) : string E.t = E.pure req.req_body
let read_body_buffer (req : req) : string E.t = E.pure req.req_body

(* ---- connection handling ---- *)

let conn_fire_close (conn : conn) : unit =
  List.iter
    (fun f -> try f () with _ -> ())
    (List.rev !(conn.conn_on_close));
  conn.conn_on_close := []

let conn_close (conn : conn) : unit =
  Mutex.lock conn.conn_mu;
  (if not conn.conn_closed then begin
     conn.conn_closed <- true;
     (try Unix.shutdown conn.conn_fd Unix.SHUTDOWN_ALL
      with Unix.Unix_error _ -> ());
     (try Unix.close conn.conn_fd with Unix.Unix_error _ -> ())
   end);
  Mutex.unlock conn.conn_mu;
  let srv = conn.conn_server in
  Mutex.lock srv.srv_mu;
  srv.srv_conns :=
    List.filter (fun c -> not (c == conn)) !(srv.srv_conns);
  Mutex.unlock srv.srv_mu;
  conn_fire_close conn

let serve_connection (conn : conn) : unit =
  let r = reader_of_fd conn.conn_fd in
  let rec loop () =
    match reader_line r with
    | None -> conn_close conn
    | Some "" -> loop ()
    | Some request_line ->
        (match parse_request_line request_line with
         | None -> conn_close conn
         | Some (meth, url) ->
             (match read_headers r with
              | None -> conn_close conn
              | Some headers ->
                  let body = read_body_of r headers in
                  let req =
                    { req_method = meth
                    ; req_url = url
                    ; req_headers = headers
                    ; req_body = body
                    ; req_conn = conn }
                  in
                  let res =
                    { res_fd = conn.conn_fd
                    ; res_mu = Mutex.create ()
                    ; res_head_sent = false
                    ; res_chunked = false
                    ; res_ended = false
                    ; res_close = false }
                  in
                  (try conn.conn_server.srv_handler req res
                   with exn ->
                     (* Node logs and leaves the response open; we answer
                        500 when the head is still unsent. *)
                     (try
                        if not res.res_head_sent then
                          write_head res ~status:500 ~headers:[]
                     with _ -> ());
                     (try res_end res with _ -> ());
                     Worker_log.error "http-server-handler-failed"
                       [ ("error", Printexc.to_string exn) ]);
                  if res.res_ended && not res.res_close then loop ()
                  else if conn.conn_closed then ()
                  else if res.res_ended && res.res_close then conn_close conn
                  else
                    (* Handler kept the response open (SSE). Block on the
                       socket so we notice disconnects; pipelined input is
                       left unread until the response ends — matching how
                       clients actually use this daemon. *)
                    let rec wait_end () =
                      if res.res_ended then
                        (if res.res_close then conn_close conn else loop ())
                      else if conn.conn_closed then ()
                      else
                        match
                          (try Unix.select [ conn.conn_fd ] [] [] 5.0
                           with Unix.Unix_error _ -> ([], [], []))
                        with
                        | [], _, _ -> wait_end ()
                        | _ ->
                            (* readable: peer data or EOF *)
                            (match reader_fill r with
                             | false -> conn_close conn
                             | true ->
                                 (* discard pipelined bytes until the
                                    response ends *)
                                 wait_end ())
                    in
                    wait_end ()))
  in
  (try loop () with _ -> conn_close conn)

(* ---- server ---- *)

let create (handler : req -> res -> unit) : server =
  { srv_handler = handler
  ; srv_mu = Mutex.create ()
  ; srv_listen = None
  ; srv_conns = ref [] }

let disable_timeouts (_server : server) : unit = ()

let address_port (server : server) : int option =
  match server.srv_listen with
  | None -> None
  | Some fd ->
      (match Unix.getsockname fd with
       | Unix.ADDR_INET (_, port) -> Some port
       | _ -> None)

let accept_loop (server : server) (listen_fd : Unix.file_descr) : unit =
  let rec go () =
    match
      (try Some (Unix.accept listen_fd)
       with Unix.Unix_error _ -> None)
    with
    | None -> ()
    | Some (client_fd, _addr) ->
        let conn =
          { conn_fd = client_fd
          ; conn_mu = Mutex.create ()
          ; conn_closed = false
          ; conn_on_close = ref []
          ; conn_server = server }
        in
        Mutex.lock server.srv_mu;
        server.srv_conns := conn :: !(server.srv_conns);
        Mutex.unlock server.srv_mu;
        (match server.srv_listen with
         | Some fd when fd == listen_fd ->
             ignore (Thread.create serve_connection conn)
         | _ -> conn_close conn);
        go ()
  in
  go ()

let listen (server : server) ~port ~host : int E.t =
  try
    let fd = Unix.socket ~cloexec:true Unix.PF_INET Unix.SOCK_STREAM 0 in
    Unix.setsockopt fd Unix.SO_REUSEADDR true;
    let addr =
      Unix.ADDR_INET
        ((try Unix.inet_addr_of_string host
          with _ -> Unix.inet_addr_loopback),
         port)
    in
    Unix.bind fd addr;
    Unix.listen fd 128;
    server.srv_listen <- Some fd;
    ignore (Thread.create (fun () -> accept_loop server fd) ());
    E.pure
      (match Unix.getsockname fd with
       | Unix.ADDR_INET (_, bound) -> bound
       | _ -> port)
  with exn -> E.error exn

let close (server : server) : bool E.t =
  Mutex.lock server.srv_mu;
  let listen_fd = server.srv_listen in
  server.srv_listen <- None;
  let conns = !(server.srv_conns) in
  Mutex.unlock server.srv_mu;
  (match listen_fd with
   | Some fd ->
       (try Unix.shutdown fd Unix.SHUTDOWN_ALL
        with Unix.Unix_error _ -> ());
       (try Unix.close fd with Unix.Unix_error _ -> ())
   | None -> ());
  List.iter (fun conn -> conn_close conn) conns;
  E.pure true
