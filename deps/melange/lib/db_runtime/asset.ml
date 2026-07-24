type value

module Web_crypto = struct
  type global
  type crypto
  type subtle
  type text_encoder
  type uint8_array
  type digest

  external global_this : global = "globalThis"
  external type_of : value -> string = "typeof"

  external crypto : global -> crypto option = "crypto"
  [@@mel.get] [@@mel.return { undefined_to_opt }]

  external subtle : crypto -> subtle = "subtle" [@@mel.get]
  external text_encoder : unit -> text_encoder = "TextEncoder" [@@mel.new]
  external encode : text_encoder -> value -> value = "encode" [@@mel.send]

  external digest : subtle -> string -> value -> digest Js.Promise.t = "digest"
  [@@mel.send]

  external uint8_array : digest -> uint8_array = "Uint8Array" [@@mel.new]

  external array_from_uint8_array : uint8_array -> int array = "from"
  [@@mel.scope "Array"]

  let crypto_subtle () =
    match crypto global_this with
    | Some crypto -> subtle crypto
    | None -> invalid_arg "Asset checksum requires crypto.subtle"

  let buffer_of_value value =
    if String.equal (type_of value) "string" then encode (text_encoder ()) value
    else value

  let sha256 buffer = digest (crypto_subtle ()) "SHA-256" buffer

  let digest_bytes digest =
    digest |> uint8_array |> array_from_uint8_array |> Rrbvec.of_array
end

let checksum ~buffer_of_value ~sha256 ~digest_bytes value =
  value |> buffer_of_value |> sha256
  |> Js.Promise.then_ (fun digest ->
      digest |> digest_bytes |> Melange_db.Asset.digest_hex
      |> Js.Promise.resolve)

let digestHex bytes = bytes |> Rrbvec.of_array |> Melange_db.Asset.digest_hex

let checksumValue value =
  checksum ~buffer_of_value:Web_crypto.buffer_of_value ~sha256:Web_crypto.sha256
    ~digest_bytes:Web_crypto.digest_bytes value

let pathType = Melange_db.Asset.path_type
let nameTitle = Melange_db.Asset.name_title
