(* Browser asset file store — window.pfs (lightning-fs) installed by
   Worker_client.set_worker_fs. Path convention mirrors cljs
   memory-fs + deps/db-worker/runtime/melange/asset_store.ml:
   /<graph-sans-logseq_db_>/assets/<name>. *)

open Promise_ext
type pfs

external window_pfs : pfs Js.Undefined.t = "pfs" [@@mel.scope "window"]

external pfs_stat
  :  pfs
  -> string
  -> < size : float ; type_ : string > Js.t Js.Promise.t = "stat"
  [@@mel.send]

external pfs_mkdir : pfs -> string -> unit Js.Promise.t = "mkdir"
  [@@mel.send]

external pfs_read
  :  pfs
  -> string
  -> Js.Typed_array.Uint8Array.t Js.Promise.t = "readFile" [@@mel.send]

external pfs_write
  :  pfs
  -> string
  -> Js.Typed_array.Uint8Array.t
  -> unit Js.Promise.t = "writeFile" [@@mel.send]

external pfs_unlink : pfs -> string -> unit Js.Promise.t = "unlink"
  [@@mel.send]

external crypto_subtle : Js.Json.t = "subtle" [@@mel.scope "crypto"]

external subtle_digest
  :  Js.Json.t
  -> string
  -> Js.Typed_array.ArrayBuffer.t
  -> Js.Typed_array.ArrayBuffer.t Js.Promise.t = "digest" [@@mel.send]

external u8_buffer : Js.Typed_array.Uint8Array.t -> Js.Typed_array.ArrayBuffer.t
  = "buffer" [@@mel.get]

let strip_db_prefix repo =
  let prefix = "logseq_db_" in
  let n = String.length prefix in
  if
    String.length repo >= n && String.sub repo 0 n = prefix
  then String.sub repo n (String.length repo - n)
  else repo

let repo_dir repo = "/" ^ strip_db_prefix repo
let assets_dir repo = repo_dir repo ^ "/assets"
let asset_path repo name = assets_dir repo ^ "/" ^ name

let unit_promise () = Js.Promise.resolve ()

(* recursive mkdir -p over pfs (no recursive option in lightning-fs) *)
let rec ensure_dir p dir =
  if dir = "" || dir = "/" || dir = "." then unit_promise ()
  else
    (let* _ = pfs_stat p dir in
    unit_promise ())
    |> Js.Promise.catch (fun _ ->
           let parent = Filename.dirname dir in
           let* () = ensure_dir p parent in
           pfs_mkdir p dir)

let write_asset ~repo ~name ~u8 =
  match Js.Undefined.toOption window_pfs with
  | None ->
      Js.Promise.reject (Failure "window.pfs is not available")
  | Some p ->
      let* () = ensure_dir p (assets_dir repo) in
      pfs_write p (asset_path repo name) u8

let read_asset ~repo ~name =
  match Js.Undefined.toOption window_pfs with
  | None -> Js.Promise.reject (Failure "window.pfs is not available")
  | Some p -> pfs_read p (asset_path repo name)

(* (repo,name) -> object URL, cached so re-renders reuse it; revoked in
   delete_asset *)
let url_cache : (string, string) Hashtbl.t = Hashtbl.create 17

external make_url : Webapi.Blob.t -> string = "createObjectURL"
  [@@mel.scope "URL"]

let cache_key repo name = repo ^ "|" ^ name

let clear_url ~repo ~name =
  let k = cache_key repo name in
  match Hashtbl.find_opt url_cache k with
  | Some url ->
      Hashtbl.remove url_cache k;
      Webapi.Url.revokeObjectURL url
  | None -> ()

let delete_asset ~repo ~name =
  match Js.Undefined.toOption window_pfs with
  | None -> Js.Promise.resolve ()
  | Some p ->
      clear_url ~repo ~name;
      pfs_unlink p (asset_path repo name)
      |> Js.Promise.catch (fun e ->
             Platform.console_error
               ("asset delete failed", asset_path repo name, e);
             Js.Promise.resolve ())

let sha256_hex (u8 : Js.Typed_array.Uint8Array.t) : string Js.Promise.t =
  let* dig = subtle_digest crypto_subtle "SHA-256" (u8_buffer u8) in
  let d = Js.Typed_array.Uint8Array.fromBuffer dig () in
  let n = Js.Typed_array.Uint8Array.length d in
  let b = Buffer.create (n * 2) in
  for i = 0 to n - 1 do
    Printf.bprintf b "%02x"
      (Js.Typed_array.Uint8Array.unsafe_get d i)
  done;
  Js.Promise.resolve (Buffer.contents b)

(* resolved object URL for assets/<uuid>.<ext>; extension drives the Blob
   MIME so <img> can decode it *)
let object_url ~repo ~name ~mime : string Js.Promise.t =
  if Platform.publishing () then (
    let url = "assets/" ^ Platform.encode_uri_component name in
    Hashtbl.replace url_cache (cache_key repo name) url;
    Js.Promise.resolve url)
  else
  let k = cache_key repo name in
  match Hashtbl.find_opt url_cache k with
  | Some url -> Js.Promise.resolve url
  | None ->
      let* u8 = read_asset ~repo ~name in
      let blob =
        Web_dom.make_blob [| u8 |]
          (Web_dom.json_props
             [ ("type", Js.Json.string mime) ])
      in
      let url = make_url blob in
      Hashtbl.replace url_cache k url;
      Js.Promise.resolve url
