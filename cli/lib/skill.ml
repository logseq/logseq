type install_opts = { global : bool }
type parsed = Parsed_show | Parsed_install of install_opts

type action =
  | Skill_show of { source_path : Cli_primitive.path option }
  | Skill_install of {
      global : bool;
      source_path : Cli_primitive.path option;
      destination_dir : Cli_primitive.path option;
      destination_file : Cli_primitive.path option;
    }

type install_target = {
  scope : Cli_primitive.keyword;
  path : Cli_primitive.path;
  update_command : string;
}

type update_status = {
  installed : bool;
  outdated : bool;
  outdated_targets : install_target Rrbvec.t;
  error : Error.t option;
}

let skill_dir_name = "logseq-cli"
let skill_file_name = "SKILL.md"

let skill_file_under base =
  Filename.concat
    (Filename.concat
       (Filename.concat (Filename.concat base ".agents") "skills")
       skill_dir_name)
    skill_file_name

external process_argv : string array = "argv" [@@mel.module "process"]

let executable_dir_candidates () =
  let candidates_for_script script =
    let script_dir = Filename.dirname script in
    Vec.of_array
      [|
        skill_file_under script_dir;
        skill_file_under (Filename.dirname script_dir);
      |]
  in
  if Array.length process_argv >= 2 then candidates_for_script process_argv.(1)
  else if Array.length process_argv = 1 then
    candidates_for_script process_argv.(0)
  else Vec.empty

let non_empty value =
  match Option.map String.trim value with
  | Some "" | None -> None
  | Some value -> Some value

let resolve_install_target ~global ~cwd ~home_dir =
  match (global, non_empty home_dir) with
  | true, None ->
      Error
        (Error.make Error.Skill_home_dir_unavailable
           "home directory is unavailable; cannot resolve --global install \
            target")
  | _ ->
      let base =
        if global then Option.value (non_empty home_dir) ~default:cwd else cwd
      in
      Ok
        {
          scope = Edn_util.keyword_t (if global then "global" else "local");
          path = skill_file_under base;
          update_command =
            (if global then "logseq skill install --global"
             else "logseq skill install");
        }

let installed_skill_targets ~cwd ~home_dir =
  let local = resolve_install_target ~global:false ~cwd ~home_dir in
  let global = resolve_install_target ~global:true ~cwd ~home_dir in
  Vec.of_array [| local; global |]
  |> Vec.filter_map (function Ok target -> Some target | Error _ -> None)

let read_file = Cli_unix.read_text_file

let rec mkdir_p path =
  if path = "" || path = Filename.dirname path || Cli_unix.file_exists path then
    ()
  else (
    mkdir_p (Filename.dirname path);
    Cli_unix.mkdir path 0o755)

let write_file path content =
  mkdir_p (Filename.dirname path);
  Cli_unix.write_text_file path content

let default_source_candidates config =
  let executable = executable_dir_candidates () in
  let project =
    match config.Cli_config.project_dir with
    | Some project_dir -> Vec.singleton (skill_file_under project_dir)
    | None -> Vec.empty
  in
  let home =
    match Sys.getenv_opt "HOME" with
    | Some home -> Vec.singleton (skill_file_under home)
    | None -> Vec.empty
  in
  Vec.append executable project |> fun candidates ->
  Vec.append candidates home |> fun candidates ->
  Vec.push_back candidates (skill_file_under (Sys.getcwd ()))

let resolve_source_path ?source_path config =
  match non_empty source_path with
  | Some path when Cli_unix.file_exists path -> Ok path
  | Some path ->
      Error
        (Error.make
           ~context:
             (Edn_util.vector_vec (Vec.of_array [| Edn_util.string path |]))
           Error.Skill_source_not_found
           ("skill source file not found: " ^ path))
  | None -> (
      let candidates = default_source_candidates config in
      match Vec.find_opt Cli_unix.file_exists candidates with
      | Some path -> Ok path
      | None ->
          Error
            (Error.make
               ~context:
                 (Edn_util.vector_vec
                    (candidates |> Vec.map (fun path -> Edn_util.string path)))
               Error.Skill_source_not_found
               ("skill source file not found. Checked paths: "
               ^ Vec.string_concat ", " candidates)))

let command_id = function
  | Parsed_show -> Command_id.Skill_show
  | Parsed_install _ -> Skill_install

let validate_parsed _ = Ok ()

let build ?registry:_ config _globals = function
  | Parsed_show -> Ok (Skill_show { source_path = None })
  | Parsed_install { global } ->
      let cwd =
        Option.value config.Cli_config.project_dir ~default:(Sys.getcwd ())
      in
      let home_dir = Sys.getenv_opt "HOME" in
      Error.bind (resolve_install_target ~global ~cwd ~home_dir) (fun target ->
          Ok
            (Skill_install
               {
                 global;
                 source_path = None;
                 destination_dir = Some (Filename.dirname target.path);
                 destination_file = Some target.path;
               }))

let target_from_action config global destination_dir destination_file =
  match (destination_dir, destination_file) with
  | Some dir, Some file -> Ok (dir, file)
  | _ ->
      let cwd =
        Option.value config.Cli_config.project_dir ~default:(Sys.getcwd ())
      in
      Error.bind
        (resolve_install_target ~global ~cwd ~home_dir:(Sys.getenv_opt "HOME"))
        (fun target -> Ok (Filename.dirname target.path, target.path))

let execute_show config mode source_path =
  let command = Command_id.Skill_show in
  match resolve_source_path ?source_path config with
  | Error err -> Cli_effect.pure (Output_mode.error ~command mode err)
  | Ok path -> (
      match read_file path with
      | content ->
          Cli_effect.pure (Cli_result.ok ~command mode (Message content))
      | exception exn ->
          Cli_effect.pure
            (Output_mode.error ~command mode
               (Error.make Error.Skill_show_failed
                  ("failed to read skill source: " ^ Printexc.to_string exn))))

let install_value ~source ~file =
  Edn_util.map_vec
    (Vec.of_array
       [|
         (Edn_util.keyword "source-path", Edn_util.string source);
         (Edn_util.keyword "installed-path", Edn_util.string file);
         ( Edn_util.keyword "message",
           Edn_util.string ("Installed skill to " ^ file) );
       |])

let execute_install config mode ~global ~source_path ~destination_dir
    ~destination_file =
  let command = Command_id.Skill_install in
  match resolve_source_path ?source_path config with
  | Error err -> Cli_effect.pure (Output_mode.error ~command mode err)
  | Ok source -> (
      match
        target_from_action config global destination_dir destination_file
      with
      | Error err -> Cli_effect.pure (Output_mode.error ~command mode err)
      | Ok (dir, file) -> (
          try
            if Cli_unix.file_exists dir && not (Cli_unix.is_directory dir) then
              raise (Invalid_argument ("destination path is a file: " ^ dir));
            let content = read_file source in
            write_file file content;
            Cli_effect.pure
              (Cli_result.ok ~command mode (Raw (install_value ~source ~file)))
          with exn ->
            Cli_effect.pure
              (Output_mode.error ~command mode
                 (Error.make Error.Skill_install_failed
                    ("failed to install skill: " ^ Printexc.to_string exn)))))

let execute_with_mode action config mode =
  match action with
  | Skill_show { source_path } -> execute_show config mode source_path
  | Skill_install { global; source_path; destination_dir; destination_file } ->
      execute_install config mode ~global ~source_path ~destination_dir
        ~destination_file

let meta id doc =
  {
    Command_registry.id;
    path = Command_id.to_path id;
    doc;
    long_doc = None;
    examples = Vec.empty;
    options = Vec.empty;
    category = Command_registry.Utilities;
    requires_graph = Command_id.requires_graph id;
    requires_auth = Command_id.requires_auth id;
    write_command = Command_id.is_write id;
    human_table_headers_order = Vec.empty;
  }

let metadata () =
  Vec.of_array
    [|
      meta Command_id.Skill_show "Show built-in logseq-cli skill";
      meta Skill_install "Install built-in logseq-cli skill";
    |]

let execute action config =
  let (Output.Mode.Packed mode) = Output_mode.for_config config in
  execute_with_mode action config mode
