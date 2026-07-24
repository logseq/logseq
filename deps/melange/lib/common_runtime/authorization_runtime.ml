include Melange_common.Authorization

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
            let header = P.decode_header platform (header_part parts) in
            let claims = P.decode_claims platform (payload_part parts) in
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
                        (header_part parts ^ "." ^ payload_part parts)
                    in
                    let signature =
                      P.base64url_decode platform (signature_part parts)
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

module Default_platform = struct
  type t = unit
  type payload = Js.Json.t
  type jwk = Js.Json.t
  type crypto_key
  type bytes
  type global
  type response
  type crypto
  type subtle
  type text_encoder
  type text_decoder
  type header = { kid : string option }

  type claims = {
    payload : payload;
    issuer : string option;
    audience_present : bool;
    audience : string option;
    client_id : string option;
    expiration_seconds : float option;
  }

  external global_this : global = "globalThis"
  external date_now : unit -> float = "now" [@@mel.scope "Date"]
  external atob : string -> string = "atob"
  external make_error : string -> exn = "Error" [@@mel.new]

  external fetch : global -> string -> response Js.Promise.t = "fetch"
  [@@mel.send]

  external response_ok : response -> bool = "ok" [@@mel.get]

  external response_json : response -> Js.Json.t Js.Promise.t = "json"
  [@@mel.send]

  external crypto : global -> crypto option = "crypto"
  [@@mel.get] [@@mel.return { undefined_to_opt }]

  external subtle : crypto -> subtle = "subtle" [@@mel.get]
  external text_encoder : unit -> text_encoder = "TextEncoder" [@@mel.new]
  external text_decoder : unit -> text_decoder = "TextDecoder" [@@mel.new]

  external utf8_encode_ : text_encoder -> string -> bytes = "encode"
  [@@mel.send]

  external utf8_decode : text_decoder -> bytes -> string = "decode" [@@mel.send]
  external uint8_array : int array -> bytes = "Uint8Array" [@@mel.new]

  external import_key :
    subtle ->
    string ->
    jwk ->
    Js.Json.t Js.Dict.t ->
    bool ->
    string array ->
    crypto_key Js.Promise.t = "importKey"
  [@@mel.send]

  external verify :
    subtle -> string -> crypto_key -> bytes -> bytes -> bool Js.Promise.t
    = "verify"
  [@@mel.send]

  let crypto_subtle () =
    match crypto global_this with
    | Some crypto -> subtle crypto
    | None -> invalid_arg "Authorization requires crypto.subtle"

  let rsa_algorithm () =
    let algorithm = Js.Dict.empty () in
    Js.Dict.set algorithm "name" (Js.Json.string "RSASSA-PKCS1-v1_5");
    Js.Dict.set algorithm "hash" (Js.Json.string "SHA-256");
    algorithm

  let string_field object_ name =
    match Js.Dict.get object_ name with
    | None -> None
    | Some value -> Js.Json.decodeString value

  let number_field object_ name =
    match Js.Dict.get object_ name with
    | None -> None
    | Some value -> Js.Json.decodeNumber value

  let object_or_empty value =
    value |> Js.Json.decodeObject |> Option.value ~default:(Js.Dict.empty ())

  let base64url_decode _ value =
    let remainder = String.length value mod 4 in
    let padding =
      if remainder = 0 then "" else String.make (4 - remainder) '='
    in
    let base64 =
      String.map
        (function '-' -> '+' | '_' -> '/' | character -> character)
        value
      ^ padding
    in
    let raw = atob base64 in
    Array.init (String.length raw) (fun index ->
        Js.String.charCodeAt ~index raw |> int_of_float)
    |> uint8_array

  let decode_jwt_part part =
    part |> base64url_decode ()
    |> utf8_decode (text_decoder ())
    |> Js.Json.parseExn

  let now_ms _ = date_now ()

  let decode_header _ part =
    let object_ = part |> decode_jwt_part |> object_or_empty in
    { kid = string_field object_ "kid" }

  let decode_claims _ part =
    let payload = decode_jwt_part part in
    let object_ = object_or_empty payload in
    let audience_value = Js.Dict.get object_ "aud" in
    {
      payload;
      issuer = string_field object_ "iss";
      audience_present =
        (match Option.map Js.Json.classify audience_value with
        | None | Some JSONNull | Some JSONFalse -> false
        | Some _ -> true);
      audience = string_field object_ "aud";
      client_id = string_field object_ "client_id";
      expiration_seconds = number_field object_ "exp";
    }

  let fetch_jwks _ url =
    fetch global_this url
    |> Js.Promise.then_ (fun response ->
        if response_ok response then response_json response
        else Js.Promise.reject (make_error "jwks"))
    |> Js.Promise.then_ (fun jwks ->
        let keys =
          jwks |> object_or_empty |> fun object_ -> Js.Dict.get object_ "keys"
        in
        let keys =
          match keys with None -> None | Some keys -> Js.Json.decodeArray keys
        in
        keys |> Option.value ~default:[||] |> Rrbvec.of_array
        |> Js.Promise.resolve)

  let jwk_kid _ key =
    key |> object_or_empty |> fun object_ -> string_field object_ "kid"

  let import_rsa_pkcs1_sha256 _ key =
    import_key (crypto_subtle ()) "jwk" key (rsa_algorithm ()) false
      [| "verify" |]

  let utf8_encode _ value = utf8_encode_ (text_encoder ()) value

  let verify_rsa_pkcs1_sha256 _ key ~data ~signature =
    verify (crypto_subtle ()) "RSASSA-PKCS1-v1_5" key signature data
end

module Default_workflow = Make (Default_platform)

let default_state = Default_workflow.create_state ()

let verify_jwt_default token expected_issuer expected_client_id jwks_url =
  Default_workflow.verify_jwt default_state () ~token ~expected_issuer
    ~expected_client_id ~jwks_url
