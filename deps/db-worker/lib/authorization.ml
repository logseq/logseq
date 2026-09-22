(* logseq.common.authorization — jwt token authorization.

   Faithful port: JWKS fetched over HTTP with a 6h cache, verified
   payloads cached per token for 1h (or until the token's own exp). The
   cljs version calls WebCrypto's RSASSA-PKCS1-v1_5 verify; here
   Rsa_pkcs1 implements the same check in pure OCaml so both targets
   share one code path. *)

open Db_worker_effect
open Db_worker_effect.Infix

let jwks_ttl_ms = 6. *. 60. *. 60. *. 1000.

let token_ttl_ms = 60. *. 60. *. 1000.

(* *jwks-cache — {:url :keys :fetched-at} *)
type jwks_cache =
  { url : string option
  ; keys : Wire.t list
  ; fetched_at : float
  }

let jwks_cache : jwks_cache ref =
  ref { url = None; keys = []; fetched_at = 0. }

(* *token-cache-state — {:tokens {} :expiry-queue queue} *)
type token_entry =
  { payload : Wire.t
  ; exp : float
  ; cached_at : float
  }

type token_state =
  { tokens : (string, token_entry) Hashtbl.t
  ; mutable expiry_queue : (string * float) list
  }

let token_state : token_state =
  { tokens = Hashtbl.create 17; expiry_queue = [] }

let now_ms () = Clock.now_ms ()

let json_number (m : Wire.t) (k : string) : float option =
  match Cljs_map.get m k with
  | Some (Wire.Int n) -> Some (Float.of_int n)
  | Some (Wire.Int64 n) -> Some (Int64.to_float n)
  | Some (Wire.Float f) -> Some f
  | _ -> None

let json_string (m : Wire.t) (k : string) : string option =
  match Cljs_map.get m k with
  | Some (Wire.String s) -> Some s
  | _ -> None

(* cached-token *)
let cached_token (token : string) ~(now_s : float) ~(now : float)
    : Wire.t option =
  match Hashtbl.find_opt token_state.tokens token with
  | Some e when e.exp > now_s && now -. e.cached_at < token_ttl_ms ->
      Some e.payload
  | _ -> None

(* remove-expired-tokens — pop expired front entries; an entry only
   dissocs its token when it is still the latest cache write. *)
let remove_expired_tokens (now : float) : unit =
  let rec loop (q : (string * float) list) : (string * float) list =
    match q with
    | (token, cached_at) :: rest when now -. cached_at >= token_ttl_ms ->
        (match Hashtbl.find_opt token_state.tokens token with
         | Some e when e.cached_at = cached_at ->
             Hashtbl.remove token_state.tokens token
         | _ -> ());
        loop rest
    | _ -> q
  in
  token_state.expiry_queue <- loop token_state.expiry_queue

(* cache-token! *)
let cache_token ~(token : string) ~(payload : Wire.t) : unit =
  match json_number payload "exp" with
  | Some exp ->
      let cached_at = now_ms () in
      remove_expired_tokens cached_at;
      Hashtbl.replace token_state.tokens token
        { payload; exp; cached_at };
      token_state.expiry_queue <-
        token_state.expiry_queue @ [ (token, cached_at) ]
  | None -> ()

(* get-jwks-keys *)
let get_jwks_keys ?(force : bool = false) (url : string)
    : Wire.t list Db_worker_effect.t =
  let now = now_ms () in
  let c = !jwks_cache in
  let fresh =
    (not force)
    && c.url = Some url
    && c.keys <> []
    && now -. c.fetched_at < jwks_ttl_ms
  in
  if fresh then pure c.keys
  else
    bind
      (Http.send
         { Http.url; method_ = "GET"; headers = []; body = None })
      (fun (resp : Http.response) ->
         if resp.status < 200 || resp.status >= 300 then
           error (Failure "jwks")
         else
           let jwks = Json.parse resp.body in
           let keys =
             match Cljs_map.get jwks "keys" with
             | Some (Wire.Array ks | Wire.List ks) -> ks
             | _ -> []
           in
           jwks_cache := { url = Some url; keys; fetched_at = now };
           pure keys)

(* decode-jwt-part — base64url decode + JSON.parse *)
let decode_jwt_part (part : string) : Wire.t =
  Json.parse (Worker_util.decode_base64url part)

let is_blank (s : string) : bool =
  let rec loop i =
    i >= String.length s
    || (match s.[i] with
        | ' ' | '\t' | '\n' | '\r' | '\x0b' | '\x0c' | '\xa0' ->
            loop (i + 1)
        | _ -> false)
  in
  loop 0

(* client-id-allowed? — cljs (contains? allowed-client-ids client-id)
   where client-id must be a non-blank string; a non-string claim (e.g.
   an aud array) fails the check exactly like cljs string?. *)
let client_id_allowed ~(env : string -> string option)
    (client_id : Wire.t option) : bool =
  let primary = env "COGNITO_CLIENT_ID" in
  let additional =
    env "COGNITO_CLIENT_IDS"
    |> Option.value ~default:""
    |> String.split_on_char ','
    |> List.map String.trim
    |> List.filter (fun s -> not (is_blank s))
  in
  let allowed =
    additional
    @ (match primary with
       | Some p when not (is_blank p) -> [ p ]
       | _ -> [])
  in
  match client_id with
  | Some (Wire.String id) when not (is_blank id) -> List.mem id allowed
  | _ -> false

let find_kid (keys : Wire.t list) (kid : string option) : Wire.t option =
  List.find_opt
    (fun (k : Wire.t) ->
       match kid, Cljs_map.get k "kid" with
       | Some kid, Some (Wire.String s) -> s = kid
       | _ -> false)
    keys

(* verify-jwt *)
let verify_jwt (token : string) ~(env : string -> string option)
    : Wire.t option Db_worker_effect.t =
  let parts = String.split_on_char '.' token in
  match parts with
  | [ header_part; payload_part; signature_part ] ->
      let now = now_ms () in
      let now_s = Float.floor (now /. 1000.) in
      (match cached_token token ~now_s ~now with
       | Some payload -> pure (Some payload)
       | None ->
           let header = decode_jwt_part header_part in
           let payload = decode_jwt_part payload_part in
           let issuer = env "COGNITO_ISSUER" in
           (* cljs (or (aget payload "aud") (aget payload
              "client_id")) — first truthy wins, even a non-string. *)
           let client_id_claim =
             match Cljs_map.get payload "aud" with
             | Some v when not (Wire.is_nil v) -> Some v
             | _ -> Cljs_map.get payload "client_id"
           in
           if json_string payload "iss" <> issuer then
             error (Failure "iss not found")
           else if not (client_id_allowed ~env client_id_claim) then
             error (Failure "aud not found")
           else
             (match json_number payload "exp" with
              | Some exp when exp < now_s -> error (Failure "exp")
              | _ ->
                  let jwks_url = env "COGNITO_JWKS_URL" in
                  (match jwks_url with
                   | None -> error (Failure "jwks url")
                   | Some url ->
                       let header_kid = json_string header "kid" in
                       get_jwks_keys url >>= fun keys ->
                       (match find_kid keys header_kid with
                        | Some _ as k -> pure k
                        | None ->
                            get_jwks_keys ~force:true url >>= fun keys' ->
                            pure (find_kid keys' header_kid))
                       >>= (function
                        | None -> error (Failure "kid")
                        | Some jwk ->
                            (match
                               ( json_string jwk "n"
                               , json_string jwk "e" )
                             with
                             | Some n, Some e ->
                                 let data =
                                   header_part ^ "." ^ payload_part
                                 in
                                 let signature =
                                   Worker_util.decode_base64url
                                     signature_part
                                 in
                                 Rsa_pkcs1.verify ~n ~e ~signature ~data
                                 >>= fun ok ->
                                 if ok then (
                                   cache_token ~token ~payload;
                                   pure (Some payload))
                                 else pure None
                             | _ -> error (Failure "bad jwk"))))))
  | _ -> error (Failure "invalid")
