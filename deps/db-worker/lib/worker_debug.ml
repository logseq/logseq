(* frontend.worker.debug — debug helpers for the current graph's
   datascript conn. *)

open Datascript

(* get-conn — worker-state/get-datascript-conn of the current repo *)
let get_conn () : conn option =
  match Worker_state.state_get "git/current-repo" with
  | Some (Wire.String repo) -> Worker_state.datascript_conn repo
  | _ -> None

(* get-db — cljs (some-> (get-conn) deref) *)
let get_db () : db option =
  match get_conn () with
  | Some conn -> Some (Datascript.db conn)
  | None -> None

(* pull [eid] — cljs (d/pull '[*] eid); nil-safe via some-> *)
let pull (eid : entity_id) : pulled_entity option =
  match get_db () with
  | Some db -> Datascript.pull db [ Pull_wildcard ] (Entity_id eid)
  | None -> None

(* entity [eid] — cljs (d/entity eid) *)
let entity (eid : entity_id) : entity option =
  match get_db () with
  | Some db -> Datascript.entity db (Entity_id eid)
  | None -> None
