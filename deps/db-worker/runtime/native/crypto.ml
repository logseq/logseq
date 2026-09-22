(* Native crypto via mirage-crypto (AES-GCM, RSA-OAEP), x509
   (spki/pkcs8 DER), and pbkdf — the same WebCrypto primitives the
   melange impl delegates to crypto.subtle. *)

exception Operation_error

let () = Mirage_crypto_rng_unix.use_default ()

module Gcm = Mirage_crypto.AES.GCM
module Oaep = Mirage_crypto_pk.Rsa.OAEP (Digestif.SHA256)

let sha256_hex s =
  Db_worker_effect.pure
    Digestif.SHA256.(to_hex (digest_string s))

let random_bytes n = Mirage_crypto_rng.generate n

module Aes_gcm = struct
  (* raw 32-byte key material; Gcm.key is rebuilt per op so export is
     just the string itself. *)
  type key = string

  let generate () = Db_worker_effect.pure (Mirage_crypto_rng.generate 32)

  let import_key raw =
    if String.length raw <> 32
    then Db_worker_effect.error (Failure "Crypto.Aes_gcm.import_key: key must be 32 bytes")
    else Db_worker_effect.pure raw

  let export_key key = Db_worker_effect.pure key

  let encrypt ~key ~iv data =
    try
      Db_worker_effect.pure
        (Gcm.authenticate_encrypt ~key:(Gcm.of_secret key) ~nonce:iv data)
    with e -> Db_worker_effect.error e

  let decrypt ~key ~iv data =
    try
      match Gcm.authenticate_decrypt ~key:(Gcm.of_secret key) ~nonce:iv data with
      | Some plain -> Db_worker_effect.pure plain
      | None -> Db_worker_effect.error Operation_error
    with e -> Db_worker_effect.error e
end

module Rsa = struct
  type key_pair =
    { public_key : string
    ; private_key : string
    }

  let generate () =
    Db_worker_effect.pure
      (let priv = X509.Private_key.generate ~bits:4096 `RSA in
       { public_key = X509.Public_key.encode_der (X509.Private_key.public priv)
       ; private_key = X509.Private_key.encode_der priv
       })

  let encrypt ~public_key data =
    match X509.Public_key.decode_der public_key with
    | Ok (`RSA pub) ->
        (try Db_worker_effect.pure (Oaep.encrypt ~key:pub data)
         with e -> Db_worker_effect.error e)
    | _ ->
        Db_worker_effect.error
          (Failure "Crypto.Rsa.encrypt: invalid spki public key")

  let decrypt ~private_key data =
    match X509.Private_key.decode_der private_key with
    | Ok (`RSA priv) ->
        (match
           try Oaep.decrypt ~key:priv data
           with _ -> None
         with
         | Some plain -> Db_worker_effect.pure plain
         | None -> Db_worker_effect.error Operation_error)
    | _ ->
        Db_worker_effect.error
          (Failure "Crypto.Rsa.decrypt: invalid pkcs8 private key")

  let sign ~private_key:_ _ =
    Db_worker_effect.error (Failure "Crypto.Rsa.sign: not implemented on native yet")
end

module Pbkdf2 = struct
  let derive_aes_gcm_256 ~password ~salt ~iterations =
    Db_worker_effect.pure
      (Pbkdf.pbkdf2 ~prf:`SHA256 ~password ~salt ~count:iterations ~dk_len:32l)
end
