(* Handles whose close raised during setup teardown. They are not
   registered in Worker_state.sqlite_conns (a half-initialized conn must
   never be handed back to callers), so teardown tracks them here and
   retries the close on the next close_db_aux. *)

let pending : (string, Sqlite.db list) Hashtbl.t = Hashtbl.create 7

let note repo db =
  let existing = Option.value (Hashtbl.find_opt pending repo) ~default:[] in
  Hashtbl.replace pending repo (db :: existing)

let take repo =
  let handles = Option.value (Hashtbl.find_opt pending repo) ~default:[] in
  Hashtbl.remove pending repo;
  handles
