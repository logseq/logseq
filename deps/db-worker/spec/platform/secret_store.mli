(* Durable secret text storage (e2ee password ciphertexts).

   cljs: browser stores via the kv store; node prefers keytar
   (service "Logseq E2EE") with kv fallback, skipping the keychain
   when owner-source is :cli and CLI_E2E_TEST is truthy. *)

val save : key:string -> string -> unit Db_worker_effect.t
val read : key:string -> string option Db_worker_effect.t
val delete : key:string -> unit Db_worker_effect.t
