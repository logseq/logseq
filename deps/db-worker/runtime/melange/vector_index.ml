(* This runtime has no vector-index backend. *)
type index = |
type doc = { id : string; page : string; embedding : float array; vector_title : string option }
type query_result = { id : string; page : string option; vector_score : float; vector_title : string option }
let open_index ~path:_ ~dimension:_ = Db_worker_effect.pure None
let query (index : index) ~embedding:_ ~limit:_ ~page:_ = match index with _ -> .
let upsert (index : index) _ = match index with _ -> .
let delete (index : index) _ = match index with _ -> .
let truncate (index : index) = match index with _ -> .
let close (index : index) = match index with _ -> .
let set_metadata (index : index) _ = match index with _ -> .
let vector_query_topks limit page =
  match page with Some _ -> List.map (fun factor -> limit * factor) [4; 16; 64] | None -> [limit]
