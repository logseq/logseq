(* Internal cross-module hooks for graph lifecycle side effects. The
   endpoint implementation cannot depend on the daemon transport without
   creating a module cycle; native daemons register their bound repo here
   while browser workers keep the empty hook table. *)

let local_graph_deleted_hooks : (string, unit -> unit) Hashtbl.t =
  Hashtbl.create 3

let on_local_graph_deleted repo f =
  Hashtbl.replace local_graph_deleted_hooks repo f

let local_graph_deleted repo =
  match Hashtbl.find_opt local_graph_deleted_hooks repo with
  | Some f -> f ()
  | None -> ()
