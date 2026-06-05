val hostname : unit -> string

type login_callback_request = { target : string option }
type login_callback_response = { status : int; body : string }

type login_callback_server_error =
  | Login_callback_timeout
  | Login_callback_server_start_failed of string
  | Login_callback_server_aborted of string

val login_callback_server :
  host:string ->
  port:int ->
  timeout_span:Ptime.span ->
  on_listen:(unit -> (unit, string) result Cli_effect.t) ->
  handle_request:(login_callback_request -> login_callback_response * 'result) ->
  ('result, login_callback_server_error) result Cli_effect.t

module HTTP : sig
  val request :
    ?timeout_span:Ptime.span ->
    Cohttp.Code.meth ->
    Uri.t ->
    headers:Cohttp.Header.t ->
    body:Cohttp_lwt.Body.t ->
    (Cohttp.Response.t * Cohttp_lwt.Body.t) Cli_effect.t
end
