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

let trim_trailing_slashes s =
  let n = String.length s in
  let rec go i = if i > 0 && s.[i - 1] = '/' then go (i - 1) else i in
  String.sub s 0 (go n)

(* cljs config.cljs custom-url->ws-url: https->wss else ws, strip scheme +
   trailing slashes, append /sync/%s *)
let ws_url () =
  match Platform.local_storage_get "sync-server-url" with
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
        (trim_trailing_slashes s))
  | _ -> "wss://api.logseq.io/sync/%s"

(* cljs custom-url->http-base: strip trailing slashes *)
let http_base () =
  match Platform.local_storage_get "sync-server-url" with
  | Some custom when String.length custom > 0 ->
      trim_trailing_slashes custom
  | _ -> "https://api.logseq.io"

let db_sync_config () =
  Wire.Map
    [ (Wire.Keyword "enabled?", Wire.Bool true)
    ; (Wire.Keyword "ws-url", Wire.String (ws_url ()))
    ; (Wire.Keyword "http-base", Wire.String (http_base ()))
    ]

let set_sync_config () =
  ignore (Runtime.invoke1 "thread-api/set-db-sync-config" (db_sync_config ()))

(* cljs sync-app-state-payload: worker needs git/current-repo plus auth/*
   tokens to open the websocket on our behalf. *)
let sync_app_state repo =
  (* cljs dissocs :git/current-repo when nil — keeps the worker's
     'sync-app-state: :git/current-repo is nil' error path clean *)
  let repo_pair =
    match repo with
    | Some r -> [ (Wire.Keyword "git/current-repo", Wire.String r) ]
    | None -> []
  in
  ignore
    (Runtime.invoke1 "thread-api/sync-app-state"
       (Wire.Map
          (repo_pair
          @ [ ( Wire.Keyword "auth/id-token"
            , match Platform.local_storage_get "id-token" with
              | Some s -> Wire.String s
              | None -> Wire.Nil )
          ; ( Wire.Keyword "auth/access-token"
            , match Platform.local_storage_get "access-token" with
              | Some s -> Wire.String s
              | None -> Wire.Nil )
          ; ( Wire.Keyword "auth/refresh-token"
            , match Platform.local_storage_get "refresh-token" with
              | Some s -> Wire.String s
              | None -> Wire.Nil )
          ; (Wire.Keyword "auth/oauth-client-id", Wire.String client_id)
          ; ( Wire.Keyword "auth/oauth-token-url"
            , Wire.String oauth_token_url )
            ])))

(* cljs <rtc-start! => :rtc/sync-auth-state + invoke :thread-api/db-sync-start *)
let start repo =
  sync_app_state (Some repo);
  set_sync_config ();
  ignore
    ((let* w =
        Runtime.invoke1 "thread-api/db-sync-start" (Wire.String repo)
      in
      (* worker failures resolve as error transits — toast the known
         ones (wrong e2ee password, exceed limits) *)
      Rtc_error.report_outcome "db-sync-start" w;
      Js.Promise.resolve ())
     |> Js.Promise.catch (fun e ->
            Platform.console_error ("db-sync-start failed", e);
            Js.Promise.resolve ()))

(* cljs <rtc-stop! => invoke :thread-api/db-sync-stop (no args) *)
let stop () =
  ignore
    (Runtime.invoke "thread-api/db-sync-stop" []
     |> Js.Promise.catch (fun e ->
            Platform.console_error ("db-sync-stop failed", e);
            Js.Promise.resolve Wire.Nil))

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
         Platform.console_error ("ensure-user-rsa-keys failed", e);
         Js.Promise.resolve false)

(* cljs <rtc-download-graph! — resolves false on failure so callers
   can abort the download -> switch -> start chain like the cljs
   rejected-promise path did *)
let download repo uuid e2ee =
  sync_app_state (Some repo);
  set_sync_config ();
  (* the header indicator still shows the last broadcast (which may be an
     idle state from a conn being replaced); drop it so "cloud on idle"
     only reappears once the new graph's conn reports *)
  Worker_events.reset_rtc ();
  Runtime.send Action.Rtc_state_clear;
  Runtime.flush ();
  (let* w =
     Runtime.invoke3 "thread-api/db-sync-download-graph-by-id"
       (Wire.String repo) (Wire.String uuid) (Wire.Bool e2ee)
   in
   if Rtc_error.is_error w then begin
     if not (Rtc_error.report w) then
       Platform.console_error ("download-graph-by-id failed", w);
     Js.Promise.resolve false
   end
   else Js.Promise.resolve true)
  |> Js.Promise.catch (fun e ->
         Platform.console_error ("download-graph-by-id failed", e);
         Js.Promise.resolve false)
