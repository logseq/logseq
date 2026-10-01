(* Browser: kv store (Idb) directly, mirroring browser.cljs.

   Node: keytar (service "Logseq E2EE") with the transit-encoded
   kv-store.json fallback, skipping the keychain when owner-source is
   :cli and CLI_E2E_TEST is truthy — mirrors node.cljs. *)

type keytar =
  < setPassword : string -> string -> string -> unit Js.Promise.t [@mel.meth]
  ; getPassword : string -> string -> string Js.Nullable.t Js.Promise.t [@mel.meth]
  ; deletePassword : string -> string -> bool Js.Promise.t [@mel.meth] >
  Js.t

external node_require : string -> 'a = "require"

external promise_error_message : Js.Promise.error -> string option = "message"
  [@@mel.get] [@@mel.return { undefined_to_opt }]

let service = "Logseq E2EE"

let task_of_promise promise =
  let task, resolver = Db_worker_effect.wait () in
  let finish result =
    if Db_worker_effect.is_pending task then Db_worker_effect.wakeup resolver result
  in
  let on_ok value = finish (Ok value); Js.Promise.resolve () in
  let on_error error =
    let message =
      Option.value (promise_error_message error) ~default:"JavaScript promise rejected"
    in
    finish (Error message);
    Js.Promise.resolve ()
  in
  ignore
    (promise |> Js.Promise.then_ on_ok |> Js.Promise.catch on_error
      : unit Js.Promise.t);
  Db_worker_effect.bind task (function
    | Ok value -> Db_worker_effect.pure value
    | Error message -> Db_worker_effect.error (Failure message))

let truthy_env name =
  match Runtime_env.env name with
  | Some v ->
      List.mem
        (String.lowercase_ascii (String.trim v))
        [ "1"; "true"; "yes"; "on" ]
  | None -> false

let is_node () =
  match Runtime_env.kind () with
  | Runtime_env.Browser_worker -> false
  | Runtime_env.Node | Runtime_env.Native -> true

let use_keychain () =
  is_node ()
  && not
       (String.equal (Runtime_env.owner_source ()) "cli"
        && truthy_env "CLI_E2E_TEST")

(* All fallback operations share Idb's typed KV store. *)

let keytar_opt () : keytar option =
  if is_node () then
    try Some (node_require "keytar") with _ -> None
  else None

let save ~key text =
  if not (is_node ()) then Idb.set key text
  else if use_keychain () then
    match keytar_opt () with
    | Some k ->
        Db_worker_effect.catch
          (Db_worker_effect.map (fun () -> ())
             (task_of_promise (k##setPassword service key text)))
          (fun _exn ->
            Worker_log.warn "db-worker/keychain-save-failed" [ ("key", key) ];
            Idb.set key text)
    | None -> Idb.set key text
  else Idb.set key text

let read ~key =
  if not (is_node ()) then Idb.get key
  else if use_keychain () then
    match keytar_opt () with
    | Some k ->
        Db_worker_effect.catch
          (Db_worker_effect.map Js.Nullable.toOption
             (task_of_promise (k##getPassword service key)))
          (fun _exn ->
            Worker_log.warn "db-worker/keychain-read-failed" [ ("key", key) ];
            Idb.get key)
    | None -> Idb.get key
  else Idb.get key

let delete ~key =
  if not (is_node ()) then Idb.delete key
  else if use_keychain () then
    match keytar_opt () with
    | Some k ->
        Db_worker_effect.catch
          (Db_worker_effect.map (fun _ -> ())
             (task_of_promise (k##deletePassword service key)))
          (fun _exn ->
            Worker_log.warn "db-worker/keychain-delete-failed" [ ("key", key) ];
            Idb.delete key)
    | None -> Idb.delete key
  else Idb.delete key
