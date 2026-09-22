(* No vector backend on native — cljs platforms without [:vector
   :open-index] behave identically (vector-search paths become no-ops). *)

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

let vector_page_filter_topk_multipliers = [ 4; 16; 64 ]

let vector_query_topks limit page =
  match page with
  | Some _ -> List.map (fun mul -> limit * mul) vector_page_filter_topk_multipliers
  | None -> [ limit ]

let set_metadata _ _ = Db_worker_effect.pure ()
