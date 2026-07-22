type token_parts
type claim_validation_error = Invalid_issuer | Invalid_audience | Expired

val token_capacity : int
val split_token : string -> token_parts option
val header_part : token_parts -> string
val payload_part : token_parts -> string
val signature_part : token_parts -> string

val validate_claims :
  expected_issuer:string ->
  expected_client_id:string ->
  issuer:string option ->
  audience_present:bool ->
  audience:string option ->
  client_id_claim:string option ->
  expiration_seconds:float option ->
  now_seconds:float ->
  (unit, claim_validation_error) result

val claim_error_message : claim_validation_error -> string

val is_cached_token_valid :
  expiration_seconds:float option ->
  now_seconds:float ->
  cached_at_ms:float ->
  now_ms:float ->
  bool

val should_retain_token_cache_entry :
  expiration_seconds:float option -> cached_at_ms:float -> now_ms:float -> bool

val is_jwks_cache_fresh :
  force:bool ->
  same_url:bool ->
  has_keys:bool ->
  fetched_at_ms:float ->
  now_ms:float ->
  bool

val matching_key_index :
  requested_kid:string option -> string option Rrbvec.t -> int option

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

module Make (P : Platform) : sig
  type state

  val create_state : unit -> state

  val cached_token :
    state ->
    token:string ->
    now_seconds:float ->
    current_ms:float ->
    P.payload option

  val cache_token :
    state ->
    token:string ->
    payload:P.payload ->
    expiration_seconds:float ->
    current_ms:float ->
    unit

  val verify_jwt :
    state ->
    P.t ->
    token:string ->
    expected_issuer:string ->
    expected_client_id:string ->
    jwks_url:string ->
    P.payload option Js.Promise.t
end
