(* Browser runtimes have no vector-index capability or native dependencies. *)

type index = unit

type doc =
  { id : string
  ; page : string
  ; embedding : float array
  ; vector_title : string option
  }

type query_result =
  { id : string
  ; page : string option
  ; vector_score : float
  ; vector_title : string option
  }

let open_index ~path:_ ~dimension:_ = Db_worker_effect.pure None
let query _ ~embedding:_ ~limit:_ ~page:_ = []
let upsert _ _ = ()
let delete _ _ = ()
let truncate _ = ()

let vector_query_topks limit page =
  match page with
  | Some _ -> List.map (fun multiplier -> limit * multiplier) [ 4; 16; 64 ]
  | None -> [ limit ]

let set_metadata _ _ = Db_worker_effect.pure ()
