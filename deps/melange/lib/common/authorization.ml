type token_parts = {
  header_part : string;
  payload_part : string;
  signature_part : string;
}

type claim_validation_error = Invalid_issuer | Invalid_audience | Expired

let jwks_ttl_ms = 6. *. 60. *. 60. *. 1000.
let token_ttl_ms = 60. *. 60. *. 1000.
let token_capacity = 200

let split_token token =
  let parts = Js.String.split ~sep:"." token in
  let effective_length = ref (Array.length parts) in
  while
    !effective_length > 0 && String.equal parts.(!effective_length - 1) ""
  do
    decr effective_length
  done;
  if !effective_length = 3 then
    Some
      {
        header_part = parts.(0);
        payload_part = parts.(1);
        signature_part = parts.(2);
      }
  else None

let header_part parts = parts.header_part
let payload_part parts = parts.payload_part
let signature_part parts = parts.signature_part

let validate_claims ~expected_issuer ~expected_client_id ~issuer
    ~audience_present ~audience ~client_id_claim ~expiration_seconds
    ~now_seconds =
  if not (Option.equal String.equal issuer (Some expected_issuer)) then
    Error Invalid_issuer
  else
    let selected_client_id =
      if audience_present then audience else client_id_claim
    in
    if
      not
        (Option.exists
           (fun selected ->
             expected_client_id |> Js.String.split ~sep:","
             |> Array.exists (fun allowed ->
                 let allowed = String.trim allowed in
                 (not (String.equal allowed ""))
                 && String.equal allowed selected))
           selected_client_id)
    then Error Invalid_audience
    else if
      Option.exists
        (fun expiration -> expiration < now_seconds)
        expiration_seconds
    then Error Expired
    else Ok ()

let claim_error_message = function
  | Invalid_issuer -> "iss not found"
  | Invalid_audience -> "aud not found"
  | Expired -> "exp"

let is_cached_token_valid ~expiration_seconds ~now_seconds ~cached_at_ms ~now_ms
    =
  Option.exists
    (fun expiration ->
      expiration > now_seconds && now_ms -. cached_at_ms < token_ttl_ms)
    expiration_seconds

let should_retain_token_cache_entry ~expiration_seconds ~cached_at_ms ~now_ms =
  let now_seconds = Float.floor (now_ms /. 1000.) in
  Option.exists
    (fun expiration ->
      expiration > now_seconds && now_ms -. cached_at_ms < token_ttl_ms)
    expiration_seconds

let is_jwks_cache_fresh ~force ~same_url ~has_keys ~fetched_at_ms ~now_ms =
  (not force) && same_url && has_keys && now_ms -. fetched_at_ms < jwks_ttl_ms

let matching_key_index ~requested_kid key_ids =
  let result = ref None in
  let index = ref 0 in
  while Option.is_none !result && !index < Rrbvec.length key_ids do
    if Option.equal String.equal requested_kid (Rrbvec.nth key_ids !index) then
      result := Some !index;
    incr index
  done;
  !result

module type Platform = sig
  type t
  type payload
  type jwk
  type crypto_key
  type bytes
  type header = { kid : string option }

  type claims = {
    payload : payload;
    issuer : string option;
    audience_present : bool;
    audience : string option;
    client_id : string option;
    expiration_seconds : float option;
  }

  val now_ms : t -> float
  val decode_header : t -> string -> header
  val decode_claims : t -> string -> claims
  val fetch_jwks : t -> string -> jwk Rrbvec.t Js.Promise.t
  val jwk_kid : t -> jwk -> string option
  val import_rsa_pkcs1_sha256 : t -> jwk -> crypto_key Js.Promise.t
  val utf8_encode : t -> string -> bytes
  val base64url_decode : t -> string -> bytes

  val verify_rsa_pkcs1_sha256 :
    t -> crypto_key -> data:bytes -> signature:bytes -> bool Js.Promise.t
end

module Make (P : Platform) = struct
  type token_cache_entry = {
    payload : P.payload;
    expiration_seconds : float;
    cached_at_ms : float;
  }

  type jwks_cache = {
    mutable url : string option;
    mutable keys : P.jwk Rrbvec.t;
    mutable fetched_at_ms : float;
  }

  type state = {
    jwks : jwks_cache;
    tokens : (string, token_cache_entry) Hashtbl.t;
  }

  let create_state () =
    {
      jwks = { url = None; keys = Rrbvec.empty; fetched_at_ms = 0. };
      tokens = Hashtbl.create token_capacity;
    }

  let rejected message =
    Js.Promise.make (fun ~resolve:_ ~reject:_ -> Js.Exn.raiseError message)

  let cached_token state ~token ~now_seconds ~current_ms =
    match Hashtbl.find_opt state.tokens token with
    | Some entry
      when is_cached_token_valid
             ~expiration_seconds:(Some entry.expiration_seconds) ~now_seconds
             ~cached_at_ms:entry.cached_at_ms ~now_ms:current_ms ->
        Some entry.payload
    | Some _ | None -> None

  let prune_token_cache state ~current_ms =
    if Hashtbl.length state.tokens > token_capacity then (
      let discarded = ref Rrbvec.empty in
      Hashtbl.iter
        (fun token entry ->
          if
            not
              (should_retain_token_cache_entry
                 ~expiration_seconds:(Some entry.expiration_seconds)
                 ~cached_at_ms:entry.cached_at_ms ~now_ms:current_ms)
          then discarded := Rrbvec.push_back !discarded token)
        state.tokens;
      Rrbvec.iter (Hashtbl.remove state.tokens) !discarded)

  let cache_token state ~token ~payload ~expiration_seconds ~current_ms =
    Hashtbl.replace state.tokens token
      { payload; expiration_seconds; cached_at_ms = current_ms };
    prune_token_cache state ~current_ms

  let get_jwks state platform ~url ~force =
    let current_ms = P.now_ms platform in
    let cached = state.jwks in
    if
      is_jwks_cache_fresh ~force
        ~same_url:(Option.equal String.equal cached.url (Some url))
        ~has_keys:(not (Rrbvec.is_empty cached.keys))
        ~fetched_at_ms:cached.fetched_at_ms ~now_ms:current_ms
    then Js.Promise.resolve cached.keys
    else
      P.fetch_jwks platform url
      |> Js.Promise.then_ (fun keys ->
          cached.url <- Some url;
          cached.keys <- keys;
          cached.fetched_at_ms <- current_ms;
          Js.Promise.resolve keys)

  let matching_key platform ~requested_kid keys =
    let key_ids = Rrbvec.map (P.jwk_kid platform) keys in
    matching_key_index ~requested_kid key_ids |> Option.map (Rrbvec.nth keys)

  let key_for_header state platform ~url ~requested_kid =
    get_jwks state platform ~url ~force:false
    |> Js.Promise.then_ (fun keys ->
        match matching_key platform ~requested_kid keys with
        | Some key -> Js.Promise.resolve key
        | None ->
            get_jwks state platform ~url ~force:true
            |> Js.Promise.then_ (fun refreshed_keys ->
                match matching_key platform ~requested_kid refreshed_keys with
                | Some key -> Js.Promise.resolve key
                | None -> rejected "kid"))

  let verify_jwt state platform ~token ~expected_issuer ~expected_client_id
      ~jwks_url =
    match split_token token with
    | None -> Js.Exn.raiseError "invalid"
    | Some parts -> (
        let current_ms = P.now_ms platform in
        let now_seconds = Float.floor (current_ms /. 1000.) in
        match cached_token state ~token ~now_seconds ~current_ms with
        | Some payload -> Js.Promise.resolve (Some payload)
        | None -> (
            let header = P.decode_header platform parts.header_part in
            let claims = P.decode_claims platform parts.payload_part in
            match
              validate_claims ~expected_issuer ~expected_client_id
                ~issuer:claims.issuer ~audience_present:claims.audience_present
                ~audience:claims.audience ~client_id_claim:claims.client_id
                ~expiration_seconds:claims.expiration_seconds ~now_seconds
            with
            | Error error -> rejected (claim_error_message error)
            | Ok () ->
                key_for_header state platform ~url:jwks_url
                  ~requested_kid:header.kid
                |> Js.Promise.then_ (P.import_rsa_pkcs1_sha256 platform)
                |> Js.Promise.then_ (fun key ->
                    let data =
                      P.utf8_encode platform
                        (parts.header_part ^ "." ^ parts.payload_part)
                    in
                    let signature =
                      P.base64url_decode platform parts.signature_part
                    in
                    P.verify_rsa_pkcs1_sha256 platform key ~data ~signature)
                |> Js.Promise.then_ (fun valid ->
                    if valid then
                      Option.iter
                        (fun expiration_seconds ->
                          cache_token state ~token ~payload:claims.payload
                            ~expiration_seconds ~current_ms)
                        claims.expiration_seconds;
                    Js.Promise.resolve
                      (if valid then Some claims.payload else None))))
end
