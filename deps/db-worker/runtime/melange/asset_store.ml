(* Per-repo binary asset store. Node: <LOGSEQ_WORKER_DB_DIR>/<repo>/
   assets/<name>. Browser worker: window.pfs / globalThis.pfs under
   memory:///<graph>/assets (cljs platform/browser.cljs). *)

type pfs

external window_ : < pfs : pfs Js.Undefined.t > Js.t Js.Undefined.t = "window"
  [@@mel.scope "globalThis"]

external global_pfs : pfs Js.Undefined.t = "pfs" [@@mel.scope "globalThis"]

external pfs_stat
  :  pfs
  -> string
  -> < size : float ; type_ : string > Js.t Js.Promise.t = "stat" [@@mel.send]

external pfs_mkdir : pfs -> string -> unit Js.Promise.t = "mkdir" [@@mel.send]

external pfs_read : pfs -> string -> Js.Typed_array.Uint8Array.t Js.Promise.t
  = "readFile" [@@mel.send]

external pfs_write
  :  pfs
  -> string
  -> Js.Typed_array.Uint8Array.t
  -> unit Js.Promise.t = "writeFile" [@@mel.send]

external pfs_unlink : pfs -> string -> unit Js.Promise.t = "unlink"
  [@@mel.send]

external promise_error_message : Js.Promise.error -> string option = "message"
  [@@mel.get] [@@mel.return { undefined_to_opt }]

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

let is_browser () =
  match Runtime_env.kind () with
  | Runtime_env.Browser_worker -> true
  | _ -> false

(* cljs browser-pfs *)
let browser_pfs () =
  match Js.Undefined.toOption window_ with
  | Some w ->
      (match Js.Undefined.toOption w##pfs with
       | Some p -> Db_worker_effect.pure p
       | None ->
           (match Js.Undefined.toOption global_pfs with
            | Some p -> Db_worker_effect.pure p
            | None ->
                Db_worker_effect.error
                  (Failure "browser pfs is not available")))
  | None ->
      (match Js.Undefined.toOption global_pfs with
       | Some p -> Db_worker_effect.pure p
       | None ->
           Db_worker_effect.error (Failure "browser pfs is not available"))

(* cljs graph-assets-dir / asset-path: memory:///<graph>/assets/<name>
   where <graph> strips one leading logseq_db_ prefix. *)
let db_version_prefix = "logseq_db_"

let strip_db_prefix repo =
  let trimmed = String.trim repo in
  let n = String.length db_version_prefix in
  if
    String.length trimmed >= n
    && String.sub trimmed 0 n = db_version_prefix
  then String.trim (String.sub trimmed n (String.length trimmed - n))
  else trimmed

let browser_path ~repo ~name =
  "memory:///" ^ strip_db_prefix repo ^ "/assets/" ^ name

let base_dir () =
  match Runtime_env.env "LOGSEQ_WORKER_DB_DIR" with
  | Some dir -> dir
  | None -> "."

let sanitize_repo_name repo =
  String.map (fun c -> match c with '/' | '\\' | ':' -> '-' | c -> c) repo

let path ~repo ~name =
  if is_browser () then browser_path ~repo ~name
  else
    let repo_dir =
      match Graph_dir.repo_to_encoded_graph_dir_name repo with
      | Some dir -> dir
      | None -> sanitize_repo_name repo
    in
    Filename.concat
      (Filename.concat (base_dir ()) repo_dir)
      (Filename.concat "assets" name)

let pfs_parent dir = Filename.dirname dir

(* cljs ensure-pfs-dir!: stat dir; on miss ensure parent then mkdir. *)
let rec ensure_pfs_dir pfs dir =
  if dir = "" || dir = "/" || dir = "." then Db_worker_effect.pure ()
  else
    Db_worker_effect.catch
      (Db_worker_effect.map (fun _ -> ())
         (task_of_promise (pfs_stat pfs dir)))
      (fun _ ->
        Db_worker_effect.bind (ensure_pfs_dir pfs (pfs_parent dir))
          (fun () -> task_of_promise (pfs_mkdir pfs dir)))

let u8_of_string s =
  let n = String.length s in
  let a = Js.Typed_array.Uint8Array.fromLength n in
  for i = 0 to n - 1 do
    Js.Typed_array.Uint8Array.unsafe_set a i (Char.code (String.unsafe_get s i))
  done;
  a

let string_of_u8 a =
  let n = Js.Typed_array.Uint8Array.length a in
  String.init n (fun i -> Char.chr (Js.Typed_array.Uint8Array.unsafe_get a i))

let read_bytes ~repo ~name =
  if is_browser () then
    Db_worker_effect.bind (browser_pfs ()) (fun pfs ->
        Db_worker_effect.map string_of_u8
          (task_of_promise (pfs_read pfs (browser_path ~repo ~name))))
  else File_sys.read_binary (path ~repo ~name)

let write_bytes ~repo ~name bytes =
  if is_browser () then
    Db_worker_effect.bind (browser_pfs ()) (fun pfs ->
        let file_path = browser_path ~repo ~name in
        Db_worker_effect.bind
          (ensure_pfs_dir pfs (pfs_parent file_path))
          (fun () -> task_of_promise (pfs_write pfs file_path (u8_of_string bytes))))
  else begin
    let p = path ~repo ~name in
    Db_worker_effect.bind (File_sys.mkdir_p (Filename.dirname p)) (fun () ->
        File_sys.write_binary p bytes)
  end

let exists ~repo ~name =
  if is_browser () then
    Db_worker_effect.catch
      (Db_worker_effect.bind (browser_pfs ()) (fun pfs ->
           Db_worker_effect.map (fun _ -> true)
             (task_of_promise (pfs_stat pfs (browser_path ~repo ~name)))))
      (fun _ -> Db_worker_effect.pure false)
  else File_sys.exists (path ~repo ~name)

let delete ~repo ~name =
  if is_browser () then
    Db_worker_effect.catch
      (Db_worker_effect.bind (browser_pfs ()) (fun pfs ->
           task_of_promise (pfs_unlink pfs (browser_path ~repo ~name))))
      (fun _ -> Db_worker_effect.pure ())
  else File_sys.remove (path ~repo ~name)
