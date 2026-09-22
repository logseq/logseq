(* @logseq/graph-lifecycle via a lazy require — the same seam the
   cljs daemon uses. *)

type storage =
  { root : string
  ; graphs_dir : string
  ; lifecycle_dir : string
  }

type runtime = Js.Json.t

external require_ : string -> 'a = "require"

let gl : Js.Json.t lazy_t = lazy (require_ "@logseq/graph-lifecycle")

external get_str : Js.Json.t -> string -> string = "" [@@mel.get_index]
external get_str_opt : Js.Json.t -> string -> string option = ""
  [@@mel.get_index] [@@mel.return { undefined_to_opt }]

external resolve_storage_ :
  Js.Json.t -> string -> string -> Js.Json.t = "resolveStorage" [@@mel.send]

external admit_ : Js.Json.t -> Js.Json.t -> Js.Json.t Js.Promise.t = "admit"
  [@@mel.send]

external check_admission_ : Js.Json.t -> Js.Json.t -> unit = "checkAdmission"
  [@@mel.send]

external assert_ownership_ : Js.Json.t -> Js.Json.t -> unit = "assertOwnership"
  [@@mel.send]

external release_ownership_ : Js.Json.t -> Js.Json.t -> unit = "releaseOwnership"
  [@@mel.send]

external record_stop_ : Js.Json.t -> Js.Json.t -> Js.Json.t -> unit = "recordStop"
  [@@mel.send]

external abort_admission_ : Js.Json.t -> Js.Json.t -> Js.Json.t -> unit
  = "abortAdmission" [@@mel.send]

external publish_ :
  Js.Json.t -> Js.Json.t -> int -> (unit -> unit [@u]) -> Js.Json.t Js.Promise.t
  = "publish" [@@mel.send]

external create_graph_ :
  Js.Json.t -> Js.Json.t -> string -> Js.Json.t Js.Promise.t
  = "createGraph" [@@mel.send]

external context_ : Js.Json.t -> Js.Json.t -> string -> Js.Json.t
  = "context" [@@mel.send]

external ownership_path_ : Js.Json.t -> Js.Json.t -> string
  = "ownershipPath" [@@mel.send]

external acquire_ownership_ : Js.Json.t -> Js.Json.t -> Js.Json.t
  = "acquireOwnership" [@@mel.send]

external release_ : Js.Json.t -> unit = "release" [@@mel.send]

let resolve_storage ~root ~graphs_dir =
  let m = Lazy.force gl in
  let s = resolve_storage_ m root graphs_dir in
  { root = get_str s "root"
  ; graphs_dir = get_str s "graphsDir"
  ; lifecycle_dir = get_str s "lifecycleDir"
  }

(* promise -> Db_worker_effect.t (http_bytes task_of_promise pattern).
   cljs callers read (.-code e) off the rejection (repo-locked etc.), so
   the JS error object itself is kept as the exn box. %identity is safe
   here: the rejection value already is the JS Error. *)
external promise_error_as_exn : Js.Promise.error -> exn = "%identity"

let await_promise promise =
  let task, resolver = Db_worker_effect.wait () in
  let finish result =
    if Db_worker_effect.is_pending task then Db_worker_effect.wakeup resolver result
  in
  let on_ok value = finish (Ok value); Js.Promise.resolve () in
  let on_error error =
    finish (Error (promise_error_as_exn error));
    Js.Promise.resolve ()
  in
  ignore
    (promise |> Js.Promise.then_ on_ok |> Js.Promise.catch on_error
      : unit Js.Promise.t);
  Db_worker_effect.bind task (function
    | Ok value -> Db_worker_effect.pure value
    | Error error -> Db_worker_effect.error error)

let storage_json (storage : storage) : Js.Json.t =
  let storage_obj = Js.Dict.empty () in
  Js.Dict.set storage_obj "root" (Js.Json.string storage.root);
  Js.Dict.set storage_obj "graphsDir" (Js.Json.string storage.graphs_dir);
  Js.Dict.set storage_obj "lifecycleDir" (Js.Json.string storage.lifecycle_dir);
  Js.Json.object_ storage_obj

let admit ~storage ~repo ~owner ?ticket ?generation () =
  let m = Lazy.force gl in
  let opts = Js.Dict.empty () in
  Js.Dict.set opts "storage" (storage_json storage);
  Js.Dict.set opts "repo" (Js.Json.string repo);
  Js.Dict.set opts "owner" (Js.Json.string owner);
  (match ticket with
   | Some t -> Js.Dict.set opts "ticket" (Js.Json.string t)
   | None -> ());
  (match generation with
   | Some g -> Js.Dict.set opts "generation" (Js.Json.string g)
   | None -> ());
  Db_worker_effect.map (fun r -> r) (await_promise (admit_ m (Js.Json.object_ opts)))

let runtime_ticket r = get_str_opt r "ticket"
let runtime_generation r = get_str_opt r "generation"
let runtime_root r = get_str r "root"
let runtime_graphs_dir r = get_str r "graphsDir"
let runtime_lifecycle_dir r = get_str r "lifecycleDir"

let runtime_storage r =
  { root = runtime_root r
  ; graphs_dir = runtime_graphs_dir r
  ; lifecycle_dir = runtime_lifecycle_dir r
  }

let check_admission r = check_admission_ (Lazy.force gl) r
let assert_ownership r = assert_ownership_ (Lazy.force gl) r
let release_ownership r = release_ownership_ (Lazy.force gl) r

let js_error_opt = function
  | Some message -> Js.Json.string message
  | None -> Js.Json.null

let record_stop r error = record_stop_ (Lazy.force gl) r (js_error_opt error)
let abort_admission r error = abort_admission_ (Lazy.force gl) r (js_error_opt error)

let publish r port expose_ready =
  Db_worker_effect.map (fun _ -> ())
    (await_promise (publish_ (Lazy.force gl) r port (fun [@u] () -> expose_ready ())))

let create_graph ~storage ~repo =
  Db_worker_effect.map (fun _ -> ())
    (await_promise
       (create_graph_ (Lazy.force gl) (storage_json storage) repo))

type ctx = Js.Json.t

let context ~storage ~repo =
  context_ (Lazy.force gl) (storage_json storage) repo

let ownership_path ctx = ownership_path_ (Lazy.force gl) ctx

type ownership_handle = Js.Json.t

let acquire_ownership ctx = acquire_ownership_ (Lazy.force gl) ctx
let release handle = release_ handle
