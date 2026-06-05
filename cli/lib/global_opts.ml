type t = {
  graph : Cli_primitive.graph option;
  root_dir : Cli_primitive.path option;
  config_path : Cli_primitive.path option;
  timeout_span : Ptime.span option;
  output_format : Output.Mode.packed option;
  verbose : bool;
  profile : bool;
}

let create ?graph ?root_dir ?config_path ?timeout_span ?output_format
    ?(verbose = false) ?(profile = false) () =
  {
    graph;
    root_dir;
    config_path;
    timeout_span;
    output_format;
    verbose;
    profile;
  }

let choose a b = match b with Some _ -> b | None -> a

let merge ~earlier ~later =
  {
    graph = choose earlier.graph later.graph;
    root_dir = choose earlier.root_dir later.root_dir;
    config_path = choose earlier.config_path later.config_path;
    timeout_span = choose earlier.timeout_span later.timeout_span;
    output_format = choose earlier.output_format later.output_format;
    verbose = earlier.verbose || later.verbose;
    profile = earlier.profile || later.profile;
  }

let with_graph graph t = { t with graph }
