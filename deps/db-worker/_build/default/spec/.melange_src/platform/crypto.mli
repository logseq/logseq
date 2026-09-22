# 1 "spec/platform/crypto.mli"
(* Crypto needed by db-sync: sha256 hashing, AES-GCM (RTC encrypt),
   RSA keypair (graph ownership). *)
val sha256_hex : string -> string Db_worker_effect.t
val random_bytes : int -> string

module Aes_gcm : sig
  type key

  val import_key : string -> key Db_worker_effect.t
  val export_key : key -> string Db_worker_effect.t
  val encrypt : key:key -> iv:string -> string -> string Db_worker_effect.t
  val decrypt : key:key -> iv:string -> string -> string Db_worker_effect.t
end

module Rsa : sig
  type key_pair =
    { public_key : string
    ; private_key : string
    }

  val generate : unit -> key_pair Db_worker_effect.t
  val encrypt : public_key:string -> string -> string Db_worker_effect.t
  val decrypt : private_key:string -> string -> string Db_worker_effect.t
  val sign : private_key:string -> string -> string Db_worker_effect.t
end
