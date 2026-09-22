(* WebCrypto surface; filled out during the sync/RTC port. *)

let sha256_hex _ = Db_worker_effect.error (Failure "Crypto.sha256_hex: not implemented yet")

let random_bytes n =
  Bytes.init n (fun _ -> Char.chr (Js.Math.random_int 0 256)) |> Bytes.to_string

module Aes_gcm = struct
  type key = string

  let import_key _ = Db_worker_effect.error (Failure "Crypto.Aes_gcm: not implemented yet")
  let export_key _ = Db_worker_effect.error (Failure "Crypto.Aes_gcm: not implemented yet")
  let encrypt ~key:_ ~iv:_ _ = Db_worker_effect.error (Failure "Crypto.Aes_gcm: not implemented yet")
  let decrypt ~key:_ ~iv:_ _ = Db_worker_effect.error (Failure "Crypto.Aes_gcm: not implemented yet")
end

module Rsa = struct
  type key_pair =
    { public_key : string
    ; private_key : string
    }

  let generate () = Db_worker_effect.error (Failure "Crypto.Rsa: not implemented yet")
  let encrypt ~public_key:_ _ = Db_worker_effect.error (Failure "Crypto.Rsa: not implemented yet")
  let decrypt ~private_key:_ _ = Db_worker_effect.error (Failure "Crypto.Rsa: not implemented yet")
  let sign ~private_key:_ _ = Db_worker_effect.error (Failure "Crypto.Rsa: not implemented yet")
end
