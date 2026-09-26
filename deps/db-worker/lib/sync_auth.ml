(* frontend.worker.sync.auth — ws/http base urls + token refresh. *)

open Db_worker_effect.Infix

let str_field name (w : Wire.t) : string option =
  match Wire.get name w with
  | Some (Wire.String s) when s <> "" -> Some s
  | _ -> None

let ws_base_url (config : Wire.t) : string option = str_field "ws-url" config

let http_base_url (config : Wire.t) : string option =
  match str_field "http-base" config with
  | Some b -> Some b
  | None ->
      (match ws_base_url config with
       | Some ws_url ->
           let base =
             if String.length ws_url > 6
                && String.sub ws_url 0 6 = "wss://" then
               "https://" ^ String.sub ws_url 6 (String.length ws_url - 6)
             else if String.length ws_url > 5
                     && String.sub ws_url 0 5 = "ws://" then
               "http://" ^ String.sub ws_url 5 (String.length ws_url - 5)
             else ws_url
           in
           let suffix = "/sync/%s" in
           if Sync_transport.ends_with base suffix then
             Some (String.sub base 0 (String.length base - String.length suffix))
           else Some base
       | None -> None)

let id_token_expired_impl (token : string option) : bool =
  match token with
  | Some t ->
      (match Sync_util.jwt_exp t with
       | Some exp_s ->
         (* exp is JWT seconds; compare in ms like cljs *)
         Time.compare_epoch_ms
           (Time.epoch_ms_of_float (exp_s *. 1000.))
           (Time.epoch_ms_of_float (Sync_state.time_ms ()))
         <= 0
       | None -> true)
  | None -> true

(* test seam — cljs with-redefs [sync-auth/id-token-expired?] *)
let id_token_expired_fn = ref id_token_expired_impl

let id_token_expired (token : string option) : bool =
  !id_token_expired_fn token

let oauth_token_url () : string option =
  match Worker_state.state_get "auth/oauth-token-url" with
  | Some (Wire.String s) when s <> "" -> Some s
  | _ ->
      (match Worker_state.state_get "auth/oauth-domain" with
       | Some (Wire.String d) when d <> "" ->
           Some ("https://" ^ d ^ "/oauth2/token")
       | _ -> None)

let state_string key : string option =
  match Worker_state.state_get key with
  | Some (Wire.String s) when s <> "" -> Some s
  | _ -> None

let ex code msg extra =
  Sync_util.ex_info msg ((Wire.Keyword "code", Wire.Keyword code) :: extra)

(* <refresh-id&access-token -> (id-token, access-token) *)
let refresh_id_and_access_token () : (string option * string option) Db_worker_effect.t =
  let refresh_token = state_string "auth/refresh-token" in
  let token_url = oauth_token_url () in
  let oauth_client_id = state_string "auth/oauth-client-id" in
  (match refresh_token with
   | None ->
       raise (ex "missing-refresh-token" "worker auth refresh requires refresh token" [])
   | _ -> ());
  (match token_url with
   | None ->
       raise (ex "missing-oauth-token-url" "worker auth refresh requires oauth token url" [])
   | _ -> ());
  (match oauth_client_id with
   | None ->
       raise (ex "missing-oauth-client-id" "worker auth refresh requires oauth client id" [])
   | _ -> ());
  let token_url = Option.get token_url in
  let form =
    "grant_type=refresh_token&client_id="
    ^ Sync_transport.uri_encode (Option.get oauth_client_id)
    ^ "&refresh_token=" ^ Sync_transport.uri_encode (Option.get refresh_token)
  in
  Http.send
    { Http.url = token_url
    ; method_ = "POST"
    ; headers = [ ("content-type", "application/x-www-form-urlencoded") ]
    ; body = Some form }
  >>= fun (resp : Http.response) ->
  let data =
    if resp.body = "" then Wire.Map []
    else Json_codec.parse resp.body
  in
  if resp.status >= 200 && resp.status < 300 then
    Db_worker_effect.pure
      ( str_field "id_token" data, str_field "access_token" data )
  else
    raise
      (ex "auth-refresh-failed" "worker auth refresh failed"
         [ Wire.Keyword "status", Wire.Int resp.status
         ; Wire.Keyword "token-url", Wire.String token_url
         ; Wire.Keyword "body", data ])

(* <resolve-ws-token *)
let resolve_ws_token () : string option Db_worker_effect.t =
  let token = Sync_util.auth_token () in
  if (not (Sync_util.cli_node_owner ())) && id_token_expired token then
    refresh_id_and_access_token () >>= fun (id_token, access_token) ->
    (match id_token with
     | None ->
         raise
           (ex "auth-refresh-empty-id-token"
              "worker auth refresh returned empty id-token" [])
     | _ -> ());
    let pairs =
      (Wire.Keyword "auth/id-token", Wire.String (Option.get id_token))
      ::
      (match access_token with
       | Some a -> [ (Wire.Keyword "auth/access-token", Wire.String a) ]
       | None -> [])
    in
    Worker_state.merge_state (Wire.Map pairs);
    Db_worker_effect.pure id_token
  else Db_worker_effect.pure token

let get_user_uuid (id_token : string option) : string option =
  match id_token with
  | Some t -> Sync_util.jwt_payload_field t "sub"
  | None -> None

(* cljs sync-auth/auth-headers — nil (no header) when there is no token *)
let auth_headers () : (string * string) list =
  match Sync_util.auth_token () with
  | Some token -> [ "authorization", "Bearer " ^ token ]
  | None -> []

(* with-auth-headers: merge auth headers into a request record *)
let with_auth_headers (headers : (string * string) list) (req : Http.request)
    : Http.request =
  { req with headers = headers @ req.headers }
