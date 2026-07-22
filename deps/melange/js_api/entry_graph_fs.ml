module GraphFs = struct
  module Common_graph = Melange_common.Graph

  type dirent =
    < name : string
    ; isDirectory : unit -> bool [@mel.meth]
    ; isSymbolicLink : unit -> bool [@mel.meth] >
    Js.t

  type readdir_options

  external make_readdir_options : withFileTypes:bool -> unit -> readdir_options
    = ""
  [@@mel.obj]

  external readdir_sync : string -> readdir_options -> dirent array
    = "readdirSync"
  [@@mel.module "node:fs"]

  type mkdir_options

  external make_mkdir_options : recursive:bool -> unit -> mkdir_options = ""
  [@@mel.obj]

  external mkdir_sync : string -> mkdir_options -> unit = "mkdirSync"
  [@@mel.module "node:fs"]

  external home_dir : unit -> string = "homedir" [@@mel.module "node:os"]

  let dir_entries directory =
    readdir_sync directory (make_readdir_options ~withFileTypes:true ())

  let visible entry =
    Common_graph.is_visible_filesystem_entry ~name:entry##name
      ~is_symbolic_link:(entry##isSymbolicLink ())

  let normalized_path path =
    Common_graph.normalize_filesystem_path
      ~win32:(String.equal Node.Process.process##platform "win32")
      path

  let rec collect_files directory files =
    Array.fold_left
      (fun files entry ->
        if visible entry then
          let path = Node.Path.join2 directory entry##name in
          if entry##isDirectory () then collect_files path files
          else Rrbvec.push_back files (normalized_path path)
        else files)
      files (dir_entries directory)

  let readdir root_dir = collect_files root_dir Rrbvec.empty |> Rrbvec.to_array

  let readDirectories root_dir =
    dir_entries root_dir |> Rrbvec.of_array
    |> Rrbvec.filter (fun entry -> visible entry && entry##isDirectory ())
    |> Rrbvec.map (fun entry -> entry##name)
    |> Rrbvec.to_array

  let getFiles graph_dir =
    readdir graph_dir |> Rrbvec.of_array
    |> Rrbvec.filter (fun path ->
        (not (Common_graph.is_ignored_path ~dir:graph_dir ~path))
        && Common_graph.is_allowed_file_path path)
    |> Rrbvec.to_array

  let getDefaultGraphsDir () =
    Common_graph.default_graphs_dir
      ~environment_value:
        (Js.Dict.get Node.Process.process##env "LOGSEQ_GRAPHS_DIR")

  let expandHome path =
    match Common_graph.home_relative_suffix path with
    | Some suffix -> Node.Path.join [| home_dir (); suffix |]
    | None -> path

  let getDbGraphsDir () = getDefaultGraphsDir () |> expandHome

  let getDbBasedGraphsInDir directory =
    mkdir_sync directory (make_mkdir_options ~recursive:true ());
    directory |> readDirectories |> Rrbvec.of_array
    |> Common_graph.canonical_db_graph_repos |> Rrbvec.to_array

  let getDbBasedGraphs () = getDbGraphsDir () |> getDbBasedGraphsInDir
end
