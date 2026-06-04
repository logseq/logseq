(** Cmdliner term assembly.

    This module maps command-family parsed option terms to [Cli_request.t]. It
    must not resolve config, parse EDN payloads, start db-worker servers, or
    execute actions. *)

val global_opts : Global_opts.t Cmdliner_boundary.term
val graph_nodes : unit -> Cmdliner_boundary.node list
val list_nodes : unit -> Cmdliner_boundary.node list
val upsert_nodes : unit -> Cmdliner_boundary.node list
val remove_nodes : unit -> Cmdliner_boundary.node list
val search_nodes : unit -> Cmdliner_boundary.node list
val query_nodes : unit -> Cmdliner_boundary.node list
val show_nodes : unit -> Cmdliner_boundary.node list
val server_nodes : unit -> Cmdliner_boundary.node list
val sync_nodes : unit -> Cmdliner_boundary.node list
val utility_nodes : unit -> Cmdliner_boundary.node list
val auth_nodes : unit -> Cmdliner_boundary.node list
val all_nodes : unit -> Cmdliner_boundary.node list
val app : ?version:string -> unit -> Cmdliner_boundary.app
