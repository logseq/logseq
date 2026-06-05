val hostname : unit -> string

module HTTP : sig
  val request :
    ?timeout_span:Ptime.span ->
    Cohttp.Code.meth ->
    Uri.t ->
    headers:Cohttp.Header.t ->
    body:Cohttp_lwt.Body.t ->
    (Cohttp.Response.t * Cohttp_lwt.Body.t) Cli_effect.t
end
