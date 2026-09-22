let sha256_hex _ = Db_worker_effect.error (Failure "Crypto.sha256_hex: not implemented on native yet")

let random_bytes n =
  let ic = open_in_bin "/dev/urandom" in
  let b = Bytes.create n in
  really_input ic b 0 n;
  close_in ic;
  Bytes.to_string b

module Aes_gcm = struct
  type key = string

  let import_key _ = Db_worker_effect.error (Failure "Crypto.Aes_gcm: not implemented on native yet")
  let export_key _ = Db_worker_effect.error (Failure "Crypto.Aes_gcm: not implemented on native yet")
  let encrypt ~key:_ ~iv:_ _ = Db_worker_effect.error (Failure "Crypto.Aes_gcm: not implemented on native yet")
  let decrypt ~key:_ ~iv:_ _ = Db_worker_effect.error (Failure "Crypto.Aes_gcm: not implemented on native yet")
end

module Rsa = struct
  type key_pair =
    { public_key : string
    ; private_key : string
    }

  let generate () = Db_worker_effect.error (Failure "Crypto.Rsa: not implemented on native yet")
  let encrypt ~public_key:_ _ = Db_worker_effect.error (Failure "Crypto.Rsa: not implemented on native yet")
  let decrypt ~private_key:_ _ = Db_worker_effect.error (Failure "Crypto.Rsa: not implemented on native yet")
  let sign ~private_key:_ _ = Db_worker_effect.error (Failure "Crypto.Rsa: not implemented on native yet")
end
