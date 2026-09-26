(* Port of src/electron/electron/keychain.cljs — E2EE secrets stored in
   the OS keychain via the keytar npm module. *)

open Electron_bindings

type keytar =
  < setPassword : string -> string -> string -> unit Js.Promise.t
      [@mel.meth]
  ; getPassword : string -> string -> string Js.Nullable.t Js.Promise.t
      [@mel.meth]
  ; deletePassword : string -> string -> bool Js.Promise.t [@mel.meth] >
  Js.t

external node_require : string -> keytar = "require"

external promise_error_as_exn : Js.Promise.error -> exn = "%identity"

(* cljs `(boolean keytar)`: the shadow-cljs require could in principle be
   nil; here a missing module surfaces as a require exception. *)
let keytar () : keytar option =
  try Some (node_require "keytar") with _ -> None

let supported () = Option.is_some (keytar ())

let service_name =
  lazy
    (let app_name =
       try App.get_name App.t with _ -> ""
     in
     if String.equal (Js.String.trim app_name) "" then "Logseq"
     else app_name)

let keychain_service () = Lazy.force service_name ^ " E2EE"

let log_error tag (e : Js.Promise.error) =
  Electron_logger.error "%s {:error %s}" tag (Js.String.make e)

let set_password (key : string option) (encrypted_text : string)
    : bool Js.Promise.t =
  match keytar (), key with
  | Some kt, Some account ->
      kt##setPassword (keychain_service ()) account encrypted_text
      |> Js.Promise.then_ (fun () -> Js.Promise.resolve true)
      |> Js.Promise.catch (fun e ->
             log_error ":electron.keychain/set-password" e;
             Js.Promise.reject (promise_error_as_exn e))
  | _ -> Js.Promise.resolve false

let get_password (key : string option)
    : string Js.Nullable.t Js.Promise.t =
  match keytar (), key with
  | Some kt, Some account ->
      kt##getPassword (keychain_service ()) account
      |> Js.Promise.catch (fun e ->
             log_error ":electron.keychain/get-password" e;
             Js.Promise.reject (promise_error_as_exn e))
  | _ -> Js.Promise.resolve Js.Nullable.null

let delete_password (key : string option) : bool Js.Promise.t =
  match keytar (), key with
  | Some kt, Some account ->
      kt##deletePassword (keychain_service ()) account
      |> Js.Promise.then_ (fun _ -> Js.Promise.resolve true)
      |> Js.Promise.catch (fun e ->
             log_error ":electron.keychain/delete-password" e;
             Js.Promise.reject (promise_error_as_exn e))
  | _ -> Js.Promise.resolve false
