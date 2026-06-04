let global_opts = Cmdliner_boundary.global_opts_term

let request_for id =
  let path = Command_id.to_path id in
  Cli_request.make ~globals:(Global_opts.create ()) ~path
    ~command:Cli_request.Version ~raw_args:path

let leaf meta =
  let term = Cmdliner.Term.const (request_for meta.Command_registry.id) in
  Cmdliner_boundary.Leaf (Cmdliner_boundary.make_leaf meta term)

let nodes_of metas = List.map leaf metas
let graph_nodes () = nodes_of (Graph.metadata ())
let list_nodes () = nodes_of (List_command.metadata ())
let upsert_nodes () = nodes_of (Upsert.metadata ())
let remove_nodes () = nodes_of (Remove.metadata ())
let search_nodes () = nodes_of (Search.metadata ())
let query_nodes () = nodes_of (Query.metadata ())
let show_nodes () = nodes_of (Show.metadata ())
let server_nodes () = nodes_of (Server_command.metadata ())
let sync_nodes () = nodes_of (Sync.metadata ())

let utility_nodes () =
  nodes_of
    (Completion.metadata () @ Skill.metadata () @ Example.metadata ()
   @ Doctor.metadata () @ Debug.metadata () @ Agent.metadata ())

let auth_nodes () = nodes_of (Auth_command.metadata ())

let all_nodes () =
  graph_nodes () @ list_nodes () @ upsert_nodes () @ remove_nodes ()
  @ search_nodes () @ query_nodes () @ show_nodes () @ server_nodes ()
  @ sync_nodes () @ utility_nodes () @ auth_nodes ()

let app ?version () = Cmdliner_boundary.make_app ?version (all_nodes ())
