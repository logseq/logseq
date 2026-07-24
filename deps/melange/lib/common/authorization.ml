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
