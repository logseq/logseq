(* Blocking networking plumbing for the native daemon.

   The daemon already multiplexes work across OS threads (one thread per
   inbound HTTP connection), so each outbound request/connection runs its
   own [Eio_run.run] loop on its own thread — no shared scheduler, no
   cross-domain promise juggling. *)

module type RUNTIME = sig
  type t

  val next_read_operation : t -> [ `Read | `Yield | `Close ]
  val read : t -> Bigstringaf.t -> off:int -> len:int -> int
  val read_eof : t -> Bigstringaf.t -> off:int -> len:int -> int
  val yield_reader : t -> (unit -> unit) -> unit

  val next_write_operation
    :  t
    -> [ `Write of Bigstringaf.t Faraday.iovec list
       | `Yield
       | `Close of int ]

  val report_write_result : t -> [ `Ok of int | `Closed ] -> unit
  val yield_writer : t -> (unit -> unit) -> unit
  val report_exn : t -> exn -> unit
  val is_closed : t -> bool
  val shutdown : t -> unit
end

(* Minimal IO surface — a record rather than a flow type so plain sockets
   and [Tls_eio.t] (different tag sets) are handled uniformly. *)
type io =
  { read : Cstruct.t -> int
  ; write : Cstruct.t list -> unit
  ; shutdown : [ `Send | `Receive | `All ] -> unit
  ; close : unit -> unit
  }

let io_of_flow (flow : _ Eio.Flow.two_way) : io =
  { read = (fun c -> Eio.Flow.single_read flow c)
  ; write = (fun cs -> Eio.Flow.write flow cs)
  ; shutdown = (fun d -> (try Eio.Flow.shutdown flow d with _ -> ()))
  ; close = (fun () -> (try Eio.Resource.close flow with _ -> ()))
  }

(* Gluten-style IO pump (cf. gluten-eio [IO_loop.start]), but typed on
   [io] so it also drives [Tls_eio.t] flows, which lack the stream-socket
   tags that [Gluten_eio.Client.create] requires. *)
let pump (module R : RUNTIME) t (flow : io) =
  let open Eio in
  let read_buffer = Bigstringaf.create 0x4000 in
  let pending_off = ref 0 in
  let pending_len = ref 0 in
  let rec read_loop () =
    match R.next_read_operation t with
    | `Read when !pending_len > 0 ->
        let consumed = R.read t read_buffer ~off:!pending_off ~len:!pending_len in
        pending_off := !pending_off + consumed;
        pending_len := !pending_len - consumed;
        read_loop ()
    | `Read ->
        (match flow.read (Cstruct.of_bigarray read_buffer) with
         | exception End_of_file ->
             let rec drain_eof () =
               match R.next_read_operation t with
               | `Read ->
                   let consumed =
                     R.read_eof t read_buffer ~off:!pending_off ~len:!pending_len
                   in
                   pending_off := !pending_off + consumed;
                   pending_len := !pending_len - consumed;
                   drain_eof ()
               | `Yield ->
                   let p, u = Promise.create () in
                   R.yield_reader t (fun () -> Promise.resolve u ());
                   Promise.await p;
                   drain_eof ()
               | `Close -> ()
             in
             drain_eof ()
         | n ->
             pending_off := 0;
             pending_len := n;
             read_loop ())
    | `Yield ->
        let p, u = Promise.create () in
        R.yield_reader t (fun () -> Promise.resolve u ());
        Promise.await p;
        read_loop ()
    | `Close ->
        flow.shutdown `Receive
  in
  let rec write_loop () =
    match R.next_write_operation t with
    | `Write iovecs ->
        let write_result =
          try
            let total =
              List.fold_left
                (fun acc (io : Bigstringaf.t Faraday.iovec) ->
                   flow.write
                     [ Cstruct.of_bigarray ~off:io.off ~len:io.len io.buffer ];
                   acc + io.len)
                0
                iovecs
            in
            `Ok total
          with
          | End_of_file | Eio.Io _ -> `Closed
        in
        R.report_write_result t write_result;
        write_loop ()
    | `Yield ->
        let p, u = Promise.create () in
        R.yield_writer t (fun () -> Promise.resolve u ());
        Promise.await p;
        write_loop ()
    | `Close _ ->
        flow.shutdown `Send
  in
  Fiber.both read_loop write_loop

let authenticator =
  lazy
    (match Ca_certs_nss.authenticator () with
     | Ok a -> a
     | Error (`Msg m) -> failwith ("ca-certs-nss: " ^ m))

let rng_init = lazy (Mirage_crypto_rng_unix.use_default ())

let tls_client_flow (flow : _ Eio.Flow.two_way) ~host : Tls_eio.t =
  Lazy.force rng_init;
  let host_dn =
    match Domain_name.of_string host with
    | Ok d ->
        (match Domain_name.host d with
         | Ok h -> Some h
         | Error _ -> None)
    | Error _ -> None
  in
  let config =
    match Tls.Config.client ~authenticator:(Lazy.force authenticator) () with
    | Ok c -> c
    | Error (`Msg m) -> failwith ("Tls.Config.client: " ^ m)
  in
  Tls_eio.client_of_flow config ?host:host_dn flow

let parse_url url =
  let split ~scheme s =
    let rest = String.sub s (String.length scheme) (String.length s - String.length scheme) in
    (* authority ends at '/', '?' or '#' — a bare `host?query` URL must
       not leak the query into the hostname; the request target still
       carries it, rooted at '/'. *)
    let authority_end =
      let cut c =
        match String.index_opt rest c with
        | Some i -> i
        | None -> String.length rest
      in
      min (cut '/') (min (cut '?') (cut '#'))
    in
    let authority = String.sub rest 0 authority_end in
    (* '#' only ends the authority — the fragment itself never goes on
       the wire, so the target stops there too. *)
    let target =
      if authority_end < String.length rest
      then
        let target_end =
          match String.index_from_opt rest authority_end '#' with
          | Some i -> i
          | None -> String.length rest
        in
        let tail = String.sub rest authority_end (target_end - authority_end) in
        if String.length tail = 0
        then "/"
        else if rest.[authority_end] = '/' then tail else "/" ^ tail
      else "/"
    in
    let host, port =
      match String.rindex_opt authority ':' with
      | Some i ->
          (String.sub authority 0 i, int_of_string (String.sub authority (i + 1) (String.length authority - i - 1)))
      | None -> authority, (if scheme = "http://" || scheme = "ws://" then 80 else 443)
    in
    host, port, target
  in
  if String.length url >= 8 && String.sub url 0 8 = "https://" then
    let host, port, target = split ~scheme:"https://" url in
    (`Tls, host, port, target)
  else if String.length url >= 7 && String.sub url 0 7 = "http://" then
    let host, port, target = split ~scheme:"http://" url in
    (`Plain, host, port, target)
  else if String.length url >= 6 && String.sub url 0 6 = "wss://" then
    let host, port, target = split ~scheme:"wss://" url in
    (`Tls, host, port, target)
  else if String.length url >= 5 && String.sub url 0 5 = "ws://" then
    let host, port, target = split ~scheme:"ws://" url in
    (`Plain, host, port, target)
  else invalid_arg ("unsupported URL scheme: " ^ url)

let connect_flow ~(env : Eio_unix.Stdenv.base) ~sw url =
  let security, host, port, target = parse_url url in
  let addrs = Eio.Net.getaddrinfo_stream env#net host ~service:(string_of_int port) in
  let socket =
    let rec try_addrs = function
      | [] ->
          failwith (Printf.sprintf "connect %s:%d: no reachable address" host port)
      | addr :: rest ->
          (match Eio.Net.connect ~sw env#net addr with
           | s -> s
           | exception _ -> try_addrs rest)
    in
    try_addrs addrs
  in
  let flow =
    match security with
    | `Tls -> io_of_flow (tls_client_flow (socket :> _ Eio.Flow.two_way) ~host)
    | `Plain -> io_of_flow socket
  in
  host, target, flow
