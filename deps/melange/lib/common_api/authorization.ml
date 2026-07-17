(** Stateful authorization workflow boundary. *)

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

  external utf8_decode : text_decoder -> bytes -> string = "decode"
  [@@mel.send]

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
    subtle ->
    string ->
    crypto_key ->
    bytes ->
    bytes ->
    bool Js.Promise.t = "verify"
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
        (function
          | '-' -> '+'
          | '_' -> '/'
          | character -> character)
        value
      ^ padding
    in
    let raw = atob base64 in
    Array.init (String.length raw) (fun index ->
        Js.String.charCodeAt ~index raw |> int_of_float)
    |> uint8_array

  let decode_jwt_part part =
    part |> base64url_decode () |> utf8_decode (text_decoder ())
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
          match keys with
          | None -> None
          | Some keys -> Js.Json.decodeArray keys
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

module Default_workflow = Melange_common.Authorization.Make (Default_platform)

let default_state = Default_workflow.create_state ()

module Authorization = struct
  let verifyJwtDefault token expected_issuer expected_client_id jwks_url =
    Default_workflow.verify_jwt default_state () ~token ~expected_issuer
      ~expected_client_id ~jwks_url
    |> Js.Promise.then_ (fun payload ->
        payload |> Js.Nullable.fromOption |> Js.Promise.resolve)
end
