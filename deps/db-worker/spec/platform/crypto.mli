(* Crypto operations needed by the sync port. Both runtimes must raise
   [Failure] (fail fast) when the operation is genuinely unavailable; the
   sync layer never falls back silently. *)

exception Operation_error

val sha256_hex : string -> string Db_worker_effect.t
val random_bytes : int -> string

module Aes_gcm : sig
  (* Raw 32-byte key material so keys stay serializable/testable; the
     runtime imports it into a CryptoKey per operation. *)
  type key = string

  (* Random AES-GCM-256 key. *)
  val generate : unit -> key Db_worker_effect.t

  (* [import_key raw] loads a raw 32-byte key. *)
  val import_key : string -> key Db_worker_effect.t
  val export_key : key -> string Db_worker_effect.t

  (* [encrypt ~key ~iv data] -> ciphertext || tag (WebCrypto layout). *)
  val encrypt : key:key -> iv:string -> string -> string Db_worker_effect.t

  (* Returns [Error Operation_error] on tag mismatch (bad password/key),
     mirroring WebCrypto's OperationError. *)
  val decrypt : key:key -> iv:string -> string -> string Db_worker_effect.t
end

module Rsa : sig
  (* OAEP/SHA-256, 4096-bit. Keys are DER-encoded strings
     (spki for public, pkcs8 for private). *)
  type key_pair = { public_key : string; private_key : string }

  val generate : unit -> key_pair Db_worker_effect.t
  val encrypt : public_key:string -> string -> string Db_worker_effect.t

  (* Returns [Error Operation_error] on OAEP failure. *)
  val decrypt : private_key:string -> string -> string Db_worker_effect.t
  val sign : private_key:string -> string -> string Db_worker_effect.t

  (* RSASSA-PKCS1-v1_5 (RS256) signature verification against a JWK given
     as its JSON text ({"kty":"RSA","n":...,"e":...}). [signature] and
     [data] are raw bytes. Returns [false] when the signature does not
     verify; raises when the key cannot be imported (mirroring
     WebCrypto's importKey rejection). *)
  val verify_rs256_jwk
    :  jwk:string
    -> signature:string
    -> data:string
    -> bool Db_worker_effect.t
end

module Pbkdf2 : sig
  (* PBKDF2-HMAC-SHA256 -> raw 32-byte AES-GCM-256 key material. *)
  val derive_aes_gcm_256 :
    password:string -> salt:string -> iterations:int -> Aes_gcm.key Db_worker_effect.t
end
