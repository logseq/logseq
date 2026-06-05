let hostname () = Unix.gethostname ()

open Lwt.Infix

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
