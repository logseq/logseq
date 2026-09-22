(* Dependency hooks for the render-resource port.

   The cljs render endpoints depend on subsystems that have not been
   ported yet (full-text search, sci result transforms). Keeping them
   behind `*_fn option ref` hooks — same pattern as
   `Sync_deps.canonical_blocks_fn` — lets a later session wire the real
   implementation without touching these files. Callers fail fast when a
   hook is unset. *)

(* search-handler/search-blocks — repo, query string, limit -> matching
   block entities, in the order search returns them. Used by
   :block-unlinked-ref-exists and by quoted-string DSL query resources. *)
let search_blocks_fn :
    (repo:string -> db:Datascript.db -> string -> int -> Datascript.entity list) option ref =
  ref None

(* sci/eval-string result transform — :result-transform-edn EDN source ->
   row list -> row list. Rows/result are Wire.t so the hook stays free of
   entity representations; the cljs transform sees the same normalized
   maps/values the renderer would. *)
let result_transform_fn : (string -> Wire.t list -> Wire.t) option ref =
  ref None

let search_blocks ~repo ~db query limit : Datascript.entity list =
  match !search_blocks_fn with
  | Some f -> f ~repo ~db query limit
  | None ->
      raise
        (Dispatcher.Exn_info
           ("Search is not available in this worker", []))

let apply_result_transform (edn : string) (rows : Wire.t list) : Wire.t =
  match !result_transform_fn with
  | Some f -> f edn rows
  | None ->
      raise
        (Dispatcher.Exn_info
           ("Query result transforms are not available in this worker",
            [ (Wire.Keyword "result-transform-edn", Wire.String edn) ]))
