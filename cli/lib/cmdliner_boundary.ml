type 'a term = 'a
type 'a cmd = { name : string; term : 'a term }

type 'a conv =
  (string -> ('a, [ `Msg of string ]) result) * (Format.formatter -> 'a -> unit)

type request_term = Cli_request.t term
type request_cmd = Cli_request.t cmd

type leaf = {
  meta : Command_registry.command_meta;
  term : request_term;
  cmd : request_cmd;
}

type group = {
  name : string;
  doc : string;
  meta : Command_registry.group_meta option;
  children : node list;
}

and node = Leaf of leaf | Group of group

type app = {
  root : request_cmd;
  registry : Command_registry.t;
  leaves : leaf list;
}

type eval_result =
  | Parsed of Cli_request.t
  | Help of string
  | Version of string
  | Parse_error of Error.t

let output_format_conv =
  ( (fun s ->
      match Output.Mode.of_string s with
      | Some v -> Ok v
      | None -> Error (`Msg "invalid output format")),
    fun fmt (Output.Mode.Packed mode) ->
      Format.pp_print_string fmt (Output.Mode.to_string mode) )

let shell_conv =
  ( (fun s ->
      match Cli_primitive.shell_of_string s with
      | Some v -> Ok v
      | None -> Error (`Msg "invalid shell")),
    fun fmt s -> Format.pp_print_string fmt (Cli_primitive.string_of_shell s) )

let position_conv =
  ( (fun s ->
      match Block.position_of_string s with
      | Some v -> Ok v
      | None -> Error (`Msg "invalid position")),
    fun fmt p -> Format.pp_print_string fmt (Block.string_of_position p) )

let keyword_conv =
  ( (fun s -> Ok (Edn_util.keyword_t s)),
    fun fmt keyword ->
      Format.pp_print_string fmt (Edn_util.keyword_to_string keyword) )

let uuid_conv = ((fun s -> Ok s), Format.pp_print_string)
let global_opts_term = Global_opts.create ()

let make_leaf meta term =
  { meta; term; cmd = { name = String.concat "-" meta.path; term } }

let make_group ?meta ~name ~doc children = Group { name; doc; meta; children }

let rec flatten_leaves nodes =
  List.concat_map
    (function Leaf l -> [ l ] | Group g -> flatten_leaves g.children)
    nodes

let make_app ?version:_ nodes =
  let leaves = flatten_leaves nodes in
  let registry =
    Command_registry.make (List.map (fun (l : leaf) -> l.meta) leaves)
  in
  let dummy =
    Cli_request.make ~globals:(Global_opts.create ()) ~path:[]
      ~command:Cli_request.Version ~raw_args:[]
  in
  ({ root = { name = "logseq"; term = dummy }; registry; leaves } : app)

let has_help_flag argv =
  List.exists (fun token -> token = "--help" || token = "-h") argv

let has_version_flag argv = List.exists (fun token -> token = "--version") argv

let remove_help_flags argv =
  List.filter (fun token -> token <> "--help" && token <> "-h") argv

let positional argv =
  let _options, positional = Cli_parse.parse_tokens argv in
  positional

let top_level_names registry =
  Command_registry.top_level_paths registry
  |> List.filter_map (function [ name ] -> Some name | _ -> None)

let strip_program_name registry argv =
  match argv with
  | [] -> []
  | first :: rest ->
      if first = "" then rest
      else if String.length first > 0 && first.[0] = '-' then argv
      else if List.mem first (top_level_names registry) then argv
      else rest

let eval ?argv ?env:_ app =
  let argv =
    match argv with
    | Some argv -> Array.to_list argv
    | None -> Array.to_list Sys.argv
  in
  let argv = strip_program_name app.registry argv in
  if has_version_flag argv then Cli_effect.pure (Version "logseq-cli ocaml")
  else if has_help_flag argv then
    let group = positional (remove_help_flags argv) in
    Cli_effect.pure (Help (Command_registry.render_help ~group app.registry))
  else
    match Cli_parse.parse argv with
    | Ok request -> Cli_effect.pure (Parsed request)
    | Error err -> Cli_effect.pure (Parse_error err)
