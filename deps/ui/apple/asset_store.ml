(* Native twin of assets/asset_store.ml — pfs becomes the real
   filesystem under the graph's assets dir. *)

open Promise_ext

type pfs = string

let graphs_dir () = Daemon_client.graphs_dir ()

let graph_dir repo =
  Filename.concat (graphs_dir ())
    (Platform.strip_db_prefix repo)

let asset_dir repo =
  Filename.concat (graph_dir repo) "assets"

let ensure_dir path =
  Daemon_client.mkdir_p path;
  Js.Promise.resolve ()

let pfs_root () =
  match Platform.pfs_handle () with
  | Some p -> p
  | None -> graphs_dir ()

let abs_path (_pfs : pfs) (path : string) : string =
  if String.length path > 0 && path.[0] = '/' then path
  else Filename.concat (pfs_root ()) path

let write_file pfs path (u8 : Js.Typed_array.Uint8Array.t) =
  let p = abs_path pfs path in
  Daemon_client.mkdir_p (Filename.dirname p);
  let oc = open_out_bin p in
  output_bytes oc u8;
  close_out oc;
  Js.Promise.resolve ()

let read_file pfs path =
  let p = abs_path pfs path in
  let ic = open_in_bin p in
  let n = in_channel_length ic in
  let b = Bytes.of_string (really_input_string ic n) in
  close_in ic;
  Js.Promise.resolve b

let stat pfs path =
  let p = abs_path pfs path in
  if Sys.file_exists p then Js.Promise.resolve true
  else Js.Promise.resolve false

let unlink pfs path =
  (try Sys.remove (abs_path pfs path) with _ -> ());
  Js.Promise.resolve ()

let sha256_hex (u8 : Js.Typed_array.Uint8Array.t) : string Js.Promise.t =
  Js.Promise.resolve
    (Digestif.SHA256.(to_hex (digest_bytes u8)))

let make_url (_ : Webapi.Blob.t) : string = ""

let delete_asset ~(repo : string) ~(name : string) : unit Js.Promise.t =
  let path = Filename.concat (asset_dir repo) name in
  (try Sys.remove path with _ -> ());
  Js.Promise.resolve ()
