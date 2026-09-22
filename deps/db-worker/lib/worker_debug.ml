(* Port of frontend.worker.debug — debug helpers reading the current
   repo's conn. *)
open Datascript

let get_conn () : conn option =
  match Worker_state.state_get "git/current-repo" with
  | Some (Wire.String repo) -> Worker_state.datascript_conn repo
  | _ -> None

let get_db () : db option = Option.map Datascript.db (get_conn ())

let pull (eid : int) : pulled_entity option =
  match get_db () with
  | Some db -> Datascript.pull_string db "[*]" (Entity_id eid)
  | None -> None

let entity (eid : int) : entity option =
  match get_db () with
  | Some db -> Datascript.entity db (Entity_id eid)
  | None -> None
