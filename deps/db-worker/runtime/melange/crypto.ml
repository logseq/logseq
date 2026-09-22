(* WebCrypto (crypto.subtle) bindings. Keys stay as CryptoKey handles
   where possible; RSA keys are exported to spki/pkcs8 DER strings at
   the spec boundary. *)

exception Operation_error

module T = Js.Typed_array

type crypto_key
type subtle

external subtle : subtle = "subtle" [@@mel.scope "crypto"]

type js_key_pair = < publicKey : crypto_key ; privateKey : crypto_key > Js.t

external generate_key_pair : subtle -> 'a -> bool -> string array -> js_key_pair Js.Promise.t
  = "generateKey"
[@@mel.send]

external generate_key_single : subtle -> 'a -> bool -> string array -> crypto_key Js.Promise.t
  = "generateKey"
[@@mel.send]

external js_import_key : subtle -> string -> 'b -> 'a -> bool -> string array -> crypto_key Js.Promise.t
  = "importKey"
[@@mel.send]

type array_buffer

external export_key : subtle -> string -> crypto_key -> array_buffer Js.Promise.t
  = "exportKey"
[@@mel.send]

external encrypt : subtle -> 'a -> crypto_key -> T.Uint8Array.t -> array_buffer Js.Promise.t
  = "encrypt"
[@@mel.send]

external decrypt : subtle -> 'a -> crypto_key -> T.Uint8Array.t -> array_buffer Js.Promise.t
  = "decrypt"
[@@mel.send]

external derive_key : subtle -> 'a -> crypto_key -> 'b -> bool -> string array -> crypto_key Js.Promise.t
  = "deriveKey"
[@@mel.send]

external digest : subtle -> string -> T.Uint8Array.t -> array_buffer Js.Promise.t
  = "digest"
[@@mel.send]

external verify : subtle -> string -> crypto_key -> T.Uint8Array.t -> T.Uint8Array.t -> bool Js.Promise.t
  = "verify"
[@@mel.send]

external json_parse : string -> 'a = "JSON.parse" [@@mel.scope "JSON"]

external get_random_values : T.Uint8Array.t -> T.Uint8Array.t = "getRandomValues"
  [@@mel.scope "crypto"]

external new_u8a : int -> T.Uint8Array.t = "Uint8Array" [@@mel.new]
external u8a_of_buffer : array_buffer -> T.Uint8Array.t = "Uint8Array" [@@mel.new]
external u8a_get : T.Uint8Array.t -> int -> int = "" [@@mel.get_index]
external u8a_set : T.Uint8Array.t -> int -> int -> unit = "" [@@mel.set_index]
external u8a_length : T.Uint8Array.t -> int = "length" [@@mel.get]

external error_name : Js.Promise.error -> string option = "name" [@@mel.get]
  [@@mel.return { undefined_to_opt }]

external error_message : Js.Promise.error -> string option = "message" [@@mel.get]
  [@@mel.return { undefined_to_opt }]

let string_of_u8a a = String.init (u8a_length a) (fun i -> Char.chr (u8a_get a i))
let string_of_buffer b = string_of_u8a (u8a_of_buffer b)

let u8a_of_string s =
  let a = new_u8a (String.length s) in
  String.iteri (fun i c -> u8a_set a i (Char.code c)) s;
  a

(* Promise -> effect, preserving the DOMException name so OperationError
   maps to Operation_error instead of collapsing to Failure. *)
let task_of_promise promise =
  let task, resolver = Db_worker_effect.wait () in
  let finish result =
    if Db_worker_effect.is_pending task then Db_worker_effect.wakeup resolver result
  in
  let on_ok value = finish (Ok value); Js.Promise.resolve () in
  let on_error error =
    let message = Option.value (error_message error) ~default:"crypto op rejected" in
    finish
      (Error
         (match error_name error with
          | Some "OperationError" -> Operation_error
          | _ -> Failure message));
    Js.Promise.resolve ()
  in
  ignore
    (promise |> Js.Promise.then_ on_ok |> Js.Promise.catch on_error
      : unit Js.Promise.t);
  Db_worker_effect.bind task (function
    | Ok value -> Db_worker_effect.pure value
    | Error exn -> Db_worker_effect.error exn)

(* cljs decode-digest: each byte toString(16) padStart(2,"0"), joined *)
let hex_of_u8a a =
  let buf = Buffer.create (u8a_length a * 2) in
  for i = 0 to u8a_length a - 1 do
    Buffer.add_string buf (Printf.sprintf "%02x" (u8a_get a i))
  done;
  Buffer.contents buf

let sha256_hex s =
  task_of_promise (digest subtle "SHA-256" (u8a_of_string s))
  |> Db_worker_effect.map (fun buffer -> hex_of_u8a (u8a_of_buffer buffer))

let random_bytes n = string_of_u8a (get_random_values (new_u8a n))

module Aes_gcm = struct
  (* raw 32-byte key material; imported per op so the spec type can be
     a plain string (test-injectable, serializable). *)
  type key = string

  let algo () = [%mel.obj { name = "AES-GCM"; length = 256 }]
  let usages = [| "encrypt"; "decrypt" |]

  let generate () =
    Db_worker_effect.bind
      (task_of_promise (generate_key_single subtle (algo ()) true usages))
      (fun k ->
        Db_worker_effect.map string_of_buffer
          (task_of_promise (export_key subtle "raw" k)))

  let import_key raw = Db_worker_effect.pure raw
  let export_key key = Db_worker_effect.pure key

  let encrypt ~key ~iv data =
    Db_worker_effect.bind
      (task_of_promise (js_import_key subtle "raw" (u8a_of_string key) (algo ()) false usages))
      (fun ck ->
        Db_worker_effect.map string_of_buffer
          (task_of_promise
             (encrypt subtle [%mel.obj { name = "AES-GCM"; iv = u8a_of_string iv }] ck
                (u8a_of_string data))))

  let decrypt ~key ~iv data =
    Db_worker_effect.bind
      (task_of_promise (js_import_key subtle "raw" (u8a_of_string key) (algo ()) false usages))
      (fun ck ->
        Db_worker_effect.map string_of_buffer
          (task_of_promise
             (decrypt subtle [%mel.obj { name = "AES-GCM"; iv = u8a_of_string iv }] ck
                (u8a_of_string data))))
end

module Rsa = struct
  type key_pair =
    { public_key : string
    ; private_key : string
    }

  let algo () =
    [%mel.obj
      { name = "RSA-OAEP"
      ; modulusLength = 4096
      ; publicExponent = u8a_of_string "\001\000\001"
      ; hash = "SHA-256"
      }]

  let generate () =
    Db_worker_effect.bind
      (task_of_promise (generate_key_pair subtle (algo ()) true [| "encrypt"; "decrypt" |]))
      (fun pair ->
           let public_key = pair##publicKey in
           let private_key = pair##privateKey in
           let open Db_worker_effect.Infix in
           task_of_promise (export_key subtle "spki" public_key)
           >>= fun spki ->
           task_of_promise (export_key subtle "pkcs8" private_key)
           >>= fun pkcs8 ->
           Db_worker_effect.pure
             { public_key = string_of_buffer spki
             ; private_key = string_of_buffer pkcs8
             })

  let import_public der =
    task_of_promise
      (js_import_key subtle "spki" (u8a_of_string der) (algo ()) false [| "encrypt" |])

  let import_private der =
    task_of_promise
      (js_import_key subtle "pkcs8" (u8a_of_string der) (algo ()) false [| "decrypt" |])

  let encrypt ~public_key data =
    let open Db_worker_effect.Infix in
    import_public public_key
    >>= fun key ->
    Db_worker_effect.map string_of_buffer
      (task_of_promise
         (encrypt subtle [%mel.obj { name = "RSA-OAEP" }] key (u8a_of_string data)))

  let decrypt ~private_key data =
    let open Db_worker_effect.Infix in
    import_private private_key
    >>= fun key ->
    Db_worker_effect.map string_of_buffer
      (task_of_promise
         (decrypt subtle [%mel.obj { name = "RSA-OAEP" }] key (u8a_of_string data)))

  let sign ~private_key:_ _ =
    Db_worker_effect.error (Failure "Crypto.Rsa.sign: not implemented yet")

  (* cljs authorization/import-rsa-key + subtle.verify — RSASSA-PKCS1-v1_5
     w/ SHA-256 against a JWK. *)
  let verify_rs256_jwk ~jwk ~signature ~data =
    let open Db_worker_effect.Infix in
    task_of_promise
      (js_import_key subtle "jwk" (json_parse jwk)
         [%mel.obj { name = "RSASSA-PKCS1-v1_5"; hash = "SHA-256" }]
         false [| "verify" |])
    >>= fun key ->
    task_of_promise
      (verify subtle "RSASSA-PKCS1-v1_5" key (u8a_of_string signature)
         (u8a_of_string data))
end

module Pbkdf2 = struct
  let derive_aes_gcm_256 ~password ~salt ~iterations =
    let open Db_worker_effect.Infix in
    task_of_promise
      (js_import_key subtle "raw" (u8a_of_string password)
         [%mel.obj { name = "PBKDF2" }]
         false [| "deriveKey" |])
    >>= fun base ->
    let params =
      [%mel.obj { name = "PBKDF2"; salt = u8a_of_string salt; iterations; hash = "SHA-256" }]
    in
    task_of_promise
      (derive_key subtle params base
         [%mel.obj { name = "AES-GCM"; length = 256 }]
         true [| "encrypt"; "decrypt" |])
    >>= fun key ->
    Db_worker_effect.map string_of_buffer
      (task_of_promise (export_key subtle "raw" key))
end
