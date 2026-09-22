(* frontend.handler.user — :thread-api/ensure-id&access-token.
   The cljs endpoint runs on the main thread where token refresh goes
   through Cognito (<refresh-id-token&access-token); the worker-side port
   refreshes through the sync-auth OAuth path (sync_auth.ml). The wire
   contract is unchanged: returns {:id-token} and raises
   {:type :expired-token} when the token is still missing/expired after
   a refresh attempt. *)

open Db_worker_effect.Infix

let kw s = Wire.Keyword s

let id_token () : string option =
  match Worker_state.state_get "auth/id-token" with
  | Some (Wire.String s) when s <> "" -> Some s
  | _ -> None

(* parse-jwt :exp — JWT exp is seconds; compare in ms like cljs
   handler.user does (:exp * 1000). *)
let jwt_exp_ms (token : string) : float option =
  Option.map (fun s -> s *. 1000.) (Sync_util.jwt_exp token)

(* handler.user/almost-expired? — exp < now + 1h *)
let almost_expired_or_expired (token : string option) : bool =
  match token with
  | Some t ->
      (match jwt_exp_ms t with
       | Some exp_ms -> exp_ms < Sync_state.time_ms () +. 3_600_000.
       | None -> true)
  | None -> true

let expired (token : string option) : bool =
  match token with
  | Some t ->
      (match jwt_exp_ms t with
       | Some exp_ms -> exp_ms <= Sync_state.time_ms ()
       | None -> true)
  | None -> true

(* merge refreshed tokens into app state, like sync-auth resolve-ws-token *)
let merge_tokens new_id_token access_token =
  let pairs =
    (kw "auth/id-token", Wire.String new_id_token)
    :: (match access_token with
        | Some a -> [ (kw "auth/access-token", Wire.String a) ]
        | None -> [])
  in
  Worker_state.merge_state (Wire.Map pairs)

(* handler.user/<ensure-id&access-token! *)
let ensure_id_and_access_token () : unit Db_worker_effect.t =
  if almost_expired_or_expired (id_token ()) then
    Sync_auth.refresh_id_and_access_token ()
    >>= fun (new_id, new_access) ->
    (match new_id with
     | Some t -> merge_tokens t new_access
     | None -> ());
    if expired (id_token ()) then
      raise
        (Dispatcher.Exn_info
           ( "empty or expired token and refresh failed"
           , [ (kw "type", kw "expired-token") ] ))
    else Db_worker_effect.pure ()
  else Db_worker_effect.pure ()

(* :thread-api/ensure-id&access-token [] -> {:id-token} *)
let () =
  Dispatcher.register "thread-api/ensure-id&access-token" (fun _args ->
      ensure_id_and_access_token () >>= fun () ->
      Db_worker_effect.pure
        (Wire.Map
           [ ( kw "id-token"
             , match id_token () with
               | Some t -> Wire.String t
               | None -> Wire.Nil ) ]))
