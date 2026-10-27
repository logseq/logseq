(* Logseq Sync (RTC) wiring — mirrors frontend/handler/db_based/sync.cljs +
   frontend/config.cljs db-sync values: a sync-app-state broadcast carrying
   git/current-repo + auth tokens, and the db-sync start/stop/ensure-keys
   endpoints. All real sync logic lives in the db-worker. *)

open Promise_ext

(* frontend/config.cljs Cognito values (config.cljs COGNITO-CLIENT-ID /
   OAUTH-TOKEN-URL / COGNITO-URL). The worker needs client-id +
   token-url in its merged app-state for refresh-id&access-token
   (sync_auth.ml), so they ship with every sync-app-state push, not just
   the login one *)
let cognito_url = "https://cognito-idp.us-east-1.amazonaws.com/"
let client_id = "69cs1lgme7p8kbgld8n5kseii6"
let oauth_token_url =
  "https://logseq-prod.auth.us-east-1.amazoncognito.com/oauth2/token"

(* cljs config.cljs custom-url->ws-url: https->wss else ws, strip scheme +
   trailing slashes, append /sync/%s *)
let ws_url () =
  match Ui_services.storage_get "sync-server-url" with
  | Some custom when String.length custom > 0 -> (
      let scheme =
        if String.length custom >= 5 && String.sub custom 0 5 = "https"
        then "wss"
        else "ws"
      in
      let s =
        match String.index_opt custom ':' with
        | Some i
          when i + 2 < String.length custom
               && String.sub custom i 3 = "://" ->
            String.sub custom (i + 3)
              (String.length custom - i - 3)
        | _ -> custom
      in
      Printf.sprintf "%s://%s/sync/%%s" scheme
        (Str_util.strip_trailing_slashes s))
  | _ -> "wss://api.logseq.io/sync/%s"

(* cljs custom-url->http-base: strip trailing slashes *)
let http_base () =
  match Ui_services.storage_get "sync-server-url" with
  | Some custom when String.length custom > 0 ->
      Str_util.strip_trailing_slashes custom
  | _ -> "https://api.logseq.io"

let db_sync_config () =
  Wire.Map
    [ (Wire.Keyword "enabled?", Wire.Bool true)
    ; (Wire.Keyword "ws-url", Wire.String (ws_url ()))
    ; (Wire.Keyword "http-base", Wire.String (http_base ()))
    ]

let set_sync_config () =
  Runtime.invoke1 "thread-api/set-db-sync-config" (db_sync_config ())

(* cljs sync-app-state-payload: worker needs git/current-repo plus auth/*
   tokens to open the websocket on our behalf. *)
let sync_app_state ?(invoke = Runtime.invoke) repo =
  (* cljs dissocs :git/current-repo when nil — keeps the worker's
     'sync-app-state: :git/current-repo is nil' error path clean *)
  let repo_pair =
    match repo with
    | Some r -> [ (Wire.Keyword "git/current-repo", Wire.String r) ]
    | None -> []
  in
  invoke "thread-api/sync-app-state"
    [ Wire.Map
       (repo_pair
       @ [ ( Wire.Keyword "auth/id-token"
           , match Ui_services.storage_get "id-token" with
             | Some s -> Wire.String s
             | None -> Wire.Nil )
         ; ( Wire.Keyword "auth/access-token"
           , match Ui_services.storage_get "access-token" with
             | Some s -> Wire.String s
             | None -> Wire.Nil )
         ; ( Wire.Keyword "auth/refresh-token"
           , match Ui_services.storage_get "refresh-token" with
             | Some s -> Wire.String s
             | None -> Wire.Nil )
         ; (Wire.Keyword "auth/oauth-client-id", Wire.String client_id)
         ; ( Wire.Keyword "auth/oauth-token-url"
           , Wire.String oauth_token_url )
           ]) ]

(* cljs <rtc-start! => :rtc/sync-auth-state + invoke :thread-api/db-sync-start *)
let start repo =
  let worker = !Runtime.worker in
  let scope =
    match worker with
    | Some worker when Worker_client.supports_recovery worker ->
        (Worker_client.lifecycle worker).scope
    | _ -> None
  in
  let current () =
    let model = Runtime.model () in
    model.Model.phase = Model.Ready && model.Model.repo = Some repo
    && Ui_services.storage_get "id-token" <> None
    && (match worker, !Runtime.worker with
        | Some expected, Some active when expected == active ->
            if Worker_client.supports_recovery active then
              let state = Worker_client.lifecycle active in
              state.phase = Worker_client.Ready && state.scope = scope
              && (match scope with Some scope -> scope.repo = repo | None -> false)
            else true
        | _ -> false)
  in
  (* db-sync-start fails missing-field on list-remote-graphs without an
     auth token — emit! gates on login too, so do the same here for the
     direct callers that bypass it *)
  if current () then
    (* cljs p/let awaits sync-auth-state + config before db-sync-start:
       on the daemon transport each invoke is its own POST, so an
       un-awaited pair can be dispatched to the worker out of order and
       db-sync-start runs list-remote-graphs before the auth merge *)
    ignore
      ((let* _ = sync_app_state (Some repo) in
        if not (current ()) then Js.Promise.resolve () else
        let* _ = set_sync_config () in
        if not (current ()) then Js.Promise.resolve () else
        let* w = Runtime.invoke1 "thread-api/db-sync-start" (Wire.String repo) in
        (* worker failures resolve as error transits — toast the known
           ones (wrong e2ee password, exceed limits) *)
        Rtc_error.report_outcome "db-sync-start" w;
        Js.Promise.resolve ())
       |> Js.Promise.catch (fun e ->
              Ui_services.log_error ("db-sync-start failed", e);
              Js.Promise.resolve ()))

(* cljs <rtc-stop! => invoke :thread-api/db-sync-stop (no args) *)
let stop_async ?(invoke = Runtime.invoke) () =
  let* result = invoke "thread-api/db-sync-stop" [] in
  if Rtc_error.is_error result then
    Js.Promise.reject (Failure "Database sync stop failed")
  else Js.Promise.resolve ()

let clear_auth_async ?(invoke = Runtime.invoke) () =
  let* result =
    invoke "thread-api/sync-app-state"
      [ Wire.Map
          [ (Wire.kw "auth/id-token", Wire.String "")
          ; (Wire.kw "auth/access-token", Wire.String "")
          ; (Wire.kw "auth/refresh-token", Wire.String "")
          ] ]
  in
  if Rtc_error.is_error result then
    Js.Promise.reject (Failure "Database sync auth clear failed")
  else Js.Promise.resolve ()

let stop () =
  ignore
    (stop_async ()
     |> Js.Promise.catch (fun e ->
            Ui_services.log_error ("db-sync-stop failed", e);
            Js.Promise.resolve ()))

(* cljs ensure-e2ee-rsa-key-for-cloud! *)
let ensure_rsa_keys () =
  (let* w =
     Runtime.invoke1 "thread-api/db-sync-ensure-user-rsa-keys"
       (Wire.Map [ (Wire.Keyword "ensure-server?", Wire.Bool true) ])
   in
   if Rtc_error.is_error w then begin
     (* wrong e2ee password -> wrong-password toast *)
     ignore (Rtc_error.report w);
     Js.Promise.resolve false
   end
   else Js.Promise.resolve true)
  |> Js.Promise.catch (fun e ->
         Ui_services.log_error ("ensure-user-rsa-keys failed", e);
         Js.Promise.resolve false)

(* cljs <rtc-download-graph! — resolves false on failure so callers
   can abort the download -> switch -> start chain like the cljs
   rejected-promise path did *)
let download repo uuid e2ee =
  (* the header indicator still shows the last broadcast (which may be an
     idle state from a conn being replaced); drop it so "cloud on idle"
     only reappears once the new graph's conn reports *)
  Worker_events.reset_rtc ();
  Runtime.send Action.Rtc_state_clear;
  Runtime.flush ();
  (let* _ = sync_app_state (Some repo) in
   let* _ = set_sync_config () in
   let* w =
     Runtime.invoke3 "thread-api/db-sync-download-graph-by-id"
       (Wire.String repo) (Wire.String uuid) (Wire.Bool e2ee)
   in
   if Rtc_error.is_error w then begin
     if not (Rtc_error.report w) then
       Ui_services.log_error ("download-graph-by-id failed", w);
     Js.Promise.resolve false
   end
   else Js.Promise.resolve true)
  |> Js.Promise.catch (fun e ->
         Ui_services.log_error ("download-graph-by-id failed", e);
         Js.Promise.resolve false)
