(* logseq.common.authorization — jwt token authorization.

   env in cljs is the worker env object; here it is a record of the
   COGNITO_* bindings the verifier reads. *)

open Db_worker_effect.Infix

type env =
  { cognito_client_id : string option
  ; cognito_client_ids : string option
  ; cognito_issuer : string option
  ; cognito_jwks_url : string option
  }

let jwks_ttl_ms = 6. *. 60. *. 60. *. 1000.
let token_ttl_ms = 60. *. 60. *. 1000.

(* cljs *jwks-cache {:url :keys :fetched-at} *)
type jwks_cache =
  { jwks_url : string option
  ; jwks_keys : Wire.t list option
  ; jwks_fetched_at : float
  }

let jwks_cache = ref { jwks_url = None; jwks_keys = None; jwks_fetched_at = 0. }

(* cljs *token-cache-state {:tokens {token {:payload :exp :cached-at}}
   :expiry-queue PersistentQueue} — queue entries are (token, cached-at)
   pairs, FIFO. *)
type cached_token =
  { token_payload : Wire.t
  ; token_exp : float
  ; token_cached_at : float
  }

type token_cache_state =
  { tokens : (string * cached_token) list
  ; expiry_queue : (string * float) list
  }

let token_cache_state = ref { tokens = []; expiry_queue = [] }

let get_now_ms () = Clock.now_ms ()

let cached_token token now_s now_ms =
  match List.assoc_opt token (!token_cache_state).tokens with
  | Some { token_payload; token_exp; token_cached_at }
    when token_exp > now_s && now_ms -. token_cached_at < token_ttl_ms ->
      Some token_payload
  | _ -> None

let rec remove_expired_tokens state now_ms =
  match state.expiry_queue with
  | (token, cached_at) :: rest when now_ms -. cached_at >= token_ttl_ms ->
      let tokens =
        match List.assoc_opt token state.tokens with
        | Some entry when entry.token_cached_at = cached_at ->
            List.remove_assoc token state.tokens
        | _ -> state.tokens
      in
      remove_expired_tokens { tokens; expiry_queue = rest } now_ms
  | _ -> state

let number_field name (w : Wire.t) : float option =
  match Wire.get name w with
  | Some (Wire.Int n) -> Some (Float.of_int n)
  | Some (Wire.Int64 n) -> Some (Int64.to_float n)
  | Some (Wire.Float f) -> Some f
  | _ -> None

let string_field name (w : Wire.t) : string option =
  match Wire.get name w with
  | Some (Wire.String s) -> Some s
  | _ -> None

let cache_token token payload =
  match number_field "exp" payload with
  | Some exp ->
      let cached_at = get_now_ms () in
      let state = remove_expired_tokens !token_cache_state cached_at in
      token_cache_state :=
        { tokens =
            ( token
            , { token_payload = payload; token_exp = exp; token_cached_at = cached_at } )
            :: List.remove_assoc token state.tokens
        ; expiry_queue = state.expiry_queue @ [ (token, cached_at) ]
        }
  | None -> ()

(* cljs get-jwks-keys — {:keys [...]} fetch with 6h per-url cache; a
   forced refetch bypasses the cache entirely. *)
let get_jwks_keys ?(force = false) url =
  let now = get_now_ms () in
  let cache = !jwks_cache in
  match (not force && cache.jwks_url = Some url, cache.jwks_keys) with
  | true, Some keys when now -. cache.jwks_fetched_at < jwks_ttl_ms ->
      Db_worker_effect.pure keys
  | _ ->
      Http.send { url; method_ = "GET"; headers = []; body = None }
      >>= fun resp ->
      if resp.status < 200 || resp.status >= 300 then
        Db_worker_effect.error (Sync_util.ex_info "jwks" [])
      else
        (let jwks = Json.parse resp.body in
         let keys =
           match Wire.get "keys" jwks with
           | Some (Wire.Array ks) -> ks
           | _ -> []
         in
         jwks_cache :=
           { jwks_url = Some url; jwks_keys = Some keys; jwks_fetched_at = now };
         Db_worker_effect.pure keys)

let decode_jwt_part part =
  match Sync_util.decode_b64url part with
  | Some s -> Json.parse s
  | None -> raise (Sync_util.ex_info "invalid" [])

(* cljs client-id-allowed? — COGNITO_CLIENT_ID + comma-separated
   COGNITO_CLIENT_IDS set membership. *)
let client_id_allowed env client_id =
  let allowed =
    let additional =
      env.cognito_client_ids
      |> Option.value ~default:""
      |> String.split_on_char ','
      |> List.map String.trim
      |> List.filter (fun s -> s <> "")
    in
    match env.cognito_client_id with
    | Some primary when String.trim primary <> "" -> primary :: additional
    | _ -> additional
  in
  match client_id with
  | Some cid when String.trim cid <> "" -> List.mem cid allowed
  | _ -> false

(* cljs truthiness for claim values (0, "", false, null are falsy). *)
let truthy = function
  | Wire.Nil | Wire.Bool false -> false
  | Wire.Int 0 | Wire.Int64 0L -> false
  | Wire.Float f when f = 0. -> false
  | Wire.String "" -> false
  | _ -> true

(* cljs verify-jwt — resolves the verified payload, raises (rejects) on
   malformed tokens or failing checks. *)
let verify_jwt token env =
  match String.split_on_char '.' token with
  | [ header_part; payload_part; signature_part ] ->
      let now_ms = get_now_ms () in
      let now_s = Float.floor (now_ms /. 1000.) in
      (match cached_token token now_s now_ms with
       | Some payload -> Db_worker_effect.pure (Some payload)
       | None ->
           (try
              let header = decode_jwt_part header_part in
              let payload = decode_jwt_part payload_part in
              if string_field "iss" payload <> env.cognito_issuer then
                raise (Sync_util.ex_info "iss not found" []);
              let client_id_claim =
                match Wire.get "aud" payload with
                | Some v when truthy v -> Some v
                | _ -> Wire.get "client_id" payload
              in
              let client_id =
                match client_id_claim with
                | Some (Wire.String s) -> Some s
                | _ -> None
              in
              if not (client_id_allowed env client_id) then
                raise (Sync_util.ex_info "aud not found" []);
              (match number_field "exp" payload with
               | Some exp when exp < now_s -> raise (Sync_util.ex_info "exp" [])
               | _ -> ());
              let signature =
                match Sync_util.decode_b64url signature_part with
                | Some s -> s
                | None -> raise (Sync_util.ex_info "invalid" [])
              in
              match env.cognito_jwks_url with
              | None -> Db_worker_effect.error (Sync_util.ex_info "jwks" [])
              | Some jwks_url ->
                  let header_kid = string_field "kid" header in
                  let find_key keys =
                    List.find_opt
                      (fun key -> string_field "kid" key = header_kid)
                      keys
                  in
                  get_jwks_keys jwks_url
                  >>= fun keys ->
                  (match find_key keys with
                   | Some jwk -> Db_worker_effect.pure jwk
                   | None ->
                       get_jwks_keys ~force:true jwks_url
                       >>= fun keys' ->
                       (match find_key keys' with
                        | Some jwk -> Db_worker_effect.pure jwk
                        | None ->
                            Db_worker_effect.error (Sync_util.ex_info "kid" [])))
                  >>= fun jwk ->
                  Crypto.Rsa.verify_rs256_jwk ~jwk:(Json.stringify jwk)
                    ~signature ~data:(header_part ^ "." ^ payload_part)
                  >>= fun ok ->
                  if ok then begin
                    cache_token token payload;
                    Db_worker_effect.pure (Some payload)
                  end
                  else Db_worker_effect.pure None
            with e -> Db_worker_effect.error e))
  | _ -> Db_worker_effect.error (Sync_util.ex_info "invalid" [])
