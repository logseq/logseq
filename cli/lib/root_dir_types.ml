let default_root_dir () = Cli_config.default_root_dir ()

let starts_with ~prefix value =
  let prefix_len = String.length prefix in
  String.length value >= prefix_len && String.sub value 0 prefix_len = prefix

let expand_home path =
  match Sys.getenv_opt "HOME" with
  | Some home when path = "~" -> home
  | Some home when starts_with ~prefix:"~/" path ->
      Filename.concat home (String.sub path 2 (String.length path - 2))
  | _ -> path

let normalize_root_dir root =
  let path =
    root |> Option.value ~default:(default_root_dir ()) |> expand_home
  in
  if Filename.is_relative path then Filename.concat (Sys.getcwd ()) path
  else path

let rec mkdir_p path =
  if path = "" || path = Filename.dirname path || Cli_unix.file_exists path then
    ()
  else (
    mkdir_p (Filename.dirname path);
    Cli_unix.mkdir path 0o755)

let root_dir_error path message =
  Error.make
    ~context:(Edn_util.map [ (Edn_util.keyword "path", Edn_util.string path) ])
    (Error.Root_dir_permission)
    message

let ensure_root_dir root =
  let path = normalize_root_dir root in
  try
    mkdir_p path;
    if not (Cli_unix.is_directory path) then
      Error (root_dir_error path ("root-dir is not a directory: " ^ path))
    else (
      Cli_unix.access path [ Cli_unix.R_OK; Cli_unix.W_OK ];
      Ok path)
  with exn ->
    Error
      (root_dir_error path
         ("root-dir is not readable/writable: " ^ path ^ " ("
        ^ Printexc.to_string exn ^ ")"))
