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
