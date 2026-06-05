let hostname () = Unix.gethostname ()

open Lwt.Infix

type login_callback_request = { target : string option }
type login_callback_response = { status : int; body : string }

type login_callback_server_error =
  | Login_callback_timeout
  | Login_callback_server_start_failed of string
  | Login_callback_server_aborted of string

let trim_cr value =
  let len = String.length value in
  if len > 0 && value.[len - 1] = '\r' then String.sub value 0 (len - 1)
  else value

let read_headers ic =
  let rec loop () =
    match input_line ic |> trim_cr with
    | "" -> ()
    | _ -> loop ()
    | exception End_of_file -> ()
  in
  loop ()

let send_text_response oc response =
  Printf.fprintf oc "HTTP/1.1 %d OK\r\n" response.status;
  Printf.fprintf oc "Content-Type: text/plain; charset=utf-8\r\n";
  Printf.fprintf oc "Content-Length: %d\r\n" (String.length response.body);
  Printf.fprintf oc "Connection: close\r\n\r\n%s%!" response.body

let sockaddr_of_host_port host port =
  let inet_addr =
    if host = "localhost" then Unix.inet_addr_loopback
    else (Unix.gethostbyname host).Unix.h_addr_list.(0)
  in
  Unix.ADDR_INET (inet_addr, port)

let request_target ic =
  match input_line ic |> trim_cr |> String.split_on_char ' ' with
  | _method :: target :: _ -> Some target
  | _ -> None

let login_callback_server ~host ~port ~timeout_span ~on_listen ~handle_request =
  let socket = Unix.socket Unix.PF_INET Unix.SOCK_STREAM 0 in
  let close_socket () = try Unix.close socket with Unix.Unix_error _ -> () in
  Cli_effect.of_lwt
    (Lwt.finalize
       (fun () ->
         Lwt.catch
           (fun () ->
             Unix.setsockopt socket Unix.SO_REUSEADDR true;
             Unix.bind socket (sockaddr_of_host_port host port);
             Unix.listen socket 1;
             Cli_effect.to_lwt (on_listen ()) >>= function
             | Error message ->
                 Lwt.return (Error (Login_callback_server_aborted message))
             | Ok () -> (
                 let timeout = Ptime.Span.to_float_s timeout_span in
                 match Unix.select [ socket ] [] [] timeout with
                 | [], _, _ -> Lwt.return (Error Login_callback_timeout)
                 | _ ->
                     let client, _addr = Unix.accept socket in
                     let ic = Unix.in_channel_of_descr client in
                     let oc = Unix.out_channel_of_descr client in
                     Fun.protect
                       ~finally:(fun () ->
                         close_in_noerr ic;
                         close_out_noerr oc)
                       (fun () ->
                         let target = request_target ic in
                         read_headers ic;
                         let response, result = handle_request { target } in
                         send_text_response oc response;
                         Lwt.return (Ok result))))
           (fun exn ->
             Lwt.return
               (Error
                  (Login_callback_server_start_failed (Printexc.to_string exn)))))
       (fun () ->
         close_socket ();
         Lwt.return_unit))

module HTTP = struct
  let request_headers headers =
    Cohttp.Header.add_unless_exists headers "connection" "close"

  let timeout_seconds = function
    | Some timeout_span when Ptime.Span.compare timeout_span Ptime.Span.zero > 0
      ->
        Some (Ptime.Span.to_float_s timeout_span)
    | _ -> None

  let with_timeout timeout_span operation =
    match timeout_seconds timeout_span with
    | None -> operation ()
    | Some seconds ->
        Lwt.catch
          (fun () -> Lwt_unix.with_timeout seconds operation)
          (function
            | Lwt_unix.Timeout -> Lwt.fail_with "request timeout"
            | exn -> Lwt.fail exn)

  let request ?timeout_span meth uri ~headers ~body =
    let ctx = Cohttp_lwt_unix.Client.custom_ctx () in
    let headers = request_headers headers in
    let operation () =
      Lwt.pause () >>= fun () ->
      Cohttp_lwt_unix.Client.call ~ctx ~headers ~body ~chunked:false meth uri
    in
    Cli_effect.of_lwt (with_timeout timeout_span operation)
end
