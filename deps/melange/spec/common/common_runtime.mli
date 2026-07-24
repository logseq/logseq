module Authorization_runtime : sig
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

  val verify_jwt_default :
    string -> string -> string -> string -> Js.Json.t option Js.Promise.t
end

module Graph_registry_runtime : sig
  type result

  val result_value : result -> Melange_cljs_runtime_spec.Value_codec.cljs_value
  val result_error : result -> string option

  val normalize_value :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    result

  val upsert_value :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    result

  val resolve_target_value :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value
end

module Regexp_runtime : sig
  val find : Js.Re.t -> string -> string option Rrbvec.t option

  type trace_callback = (unit -> unit[@u])

  val safe_find_value :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    Js.Re.t ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    trace_callback ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value
end

module Util_runtime : sig
  type now_callback = (unit -> float[@u])

  type compare_callback =
    (Melange_cljs_runtime_spec.Value_codec.cljs_value ->
     Melange_cljs_runtime_spec.Value_codec.cljs_value ->
     int
    [@u])

  type read_callback =
    (Melange_cljs_runtime_spec.Value_codec.cljs_value ->
     string ->
     Melange_cljs_runtime_spec.Value_codec.cljs_value
    [@u])

  type read_error_callback = (Js.Exn.t -> unit[@u])

  type sort_criterion = {
    get_value : Melange_cljs_runtime_spec.Value_codec.callback;
    ascending : bool;
  }

  val distinct_lazy :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    Melange_cljs_runtime_spec.Value_codec.callback ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value

  val fast_remove_nils :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value

  val distinct_by_last_wins :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    Melange_cljs_runtime_spec.Value_codec.callback ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value

  val block_with_timestamps :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    now_callback ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value

  val compare_by :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    compare_callback ->
    sort_criterion array ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    int

  val safe_read_string :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    read_callback ->
    read_error_callback ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    string ->
    bool ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value

  val safe_read_map_string :
    Melange_cljs_runtime_spec.Value_codec.adapter ->
    read_callback ->
    read_error_callback ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value ->
    string ->
    Melange_cljs_runtime_spec.Value_codec.cljs_value
end
