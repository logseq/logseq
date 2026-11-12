(* Native twin of assets/asset_store.ml — pfs becomes the real
   filesystem under the graph's assets dir. *)

open Promise_ext

type pfs = string

let graphs_dir () = Daemon_client.graphs_dir ()

let graph_dir repo =
  Filename.concat (graphs_dir ()) (Daemon_client.encode_graph repo)

let asset_dir repo =
  Filename.concat (graph_dir repo) "assets"

let asset_path repo name =
  if repo = "" then invalid_arg "Graph assets require an open graph";
  Resource_native.asset_path ~asset_dir:(asset_dir repo) name

(* Inline links name graph assets, or an explicitly absolute local document.
   Decode URL paths once; ordinary absolute OS filenames remain literal. *)
let local_asset_path ~repo source =
  if repo = "" then invalid_arg "Graph assets require an open graph";
  if source = "" || String.contains source '\000' || String.starts_with ~prefix:"//" source then
    invalid_arg "Invalid local asset source";
  if not (Filename.is_relative source) then source
  else begin
    let uri = Uri.of_string source in
    let decode path =
      let rec escapes i =
        if i < String.length path then
          if path.[i] = '%' then begin
            let hex c = match c with '0'..'9' | 'a'..'f' | 'A'..'F' -> true | _ -> false in
            if i + 2 >= String.length path || not (hex path.[i+1] && hex path.[i+2]) then
              invalid_arg "Invalid local asset path escape";
            escapes (i + 3)
          end else escapes (i + 1)
      in
      escapes 0;
      let path = Uri.pct_decode path in
      if String.contains path '\000' then invalid_arg "Invalid local asset path";
      path
    in
    if Uri.query uri <> [] || Uri.fragment uri <> None
       || Uri.userinfo uri <> None || Uri.port uri <> None then
      invalid_arg "Local asset links cannot contain credentials, query or fragment";
    match Uri.scheme uri with
    | Some "file" ->
        if not (List.mem (Uri.host uri) [None; Some "localhost"]) then
          invalid_arg "Local asset links cannot name a remote file host";
        let path = decode (Uri.path uri) in
        let path =
          if Sys.win32 && String.length path > 3 && path.[0] = '/'
             && path.[2] = ':' then String.sub path 1 (String.length path - 1)
          else path in
        Resource_native.absolute_root path
    | Some _ -> invalid_arg "The native PDF viewer requires a local document"
    | None ->
        if Uri.host uri <> None then invalid_arg "Invalid graph asset host";
        let path = decode source in
        let path =
          match List.find_opt (fun prefix -> String.starts_with ~prefix path)
            ["../assets/"; "./assets/"; "assets/"] with
          | Some prefix -> String.sub path (String.length prefix) (String.length path - String.length prefix)
          | None -> path in
        asset_path repo path
  end

let publish_resource_context ~repo =
  if repo = "" then Resource_native.publish ~repo ~graph_dir:"" ~asset_dir:""
  else
    Resource_native.publish ~repo ~graph_dir:(graph_dir repo)
      ~asset_dir:(asset_dir repo)

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

let write_asset ~repo ~name ~u8 =
  let path = asset_path repo name in
  Daemon_client.mkdir_p (Filename.dirname path);
  let oc = open_out_bin path in
  output_bytes oc u8;
  close_out oc;
  Js.Promise.resolve ()

let delete_asset ~(repo : string) ~(name : string) : unit Js.Promise.t =
  let path = asset_path repo name in
  (try Sys.remove path with _ -> ());
  Js.Promise.resolve ()
