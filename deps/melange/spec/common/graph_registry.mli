type entry
type normalization
type upsert_result

val make_entry :
  ?graph_id:string ->
  ?local_graph_id:string ->
  ?repo:string ->
  ?graph_id_text:string ->
  ?repo_text:string ->
  ?graph_name_text:string ->
  unit ->
  entry

val normalize_entry : entry -> normalization
val normalization_error : entry -> string option
val normalized_graph_id : normalization -> string
val remove_rtc_graph_id : normalization -> bool
val upsert_entry : entry Rrbvec.t -> entry -> upsert_result
val upsert_normalization : upsert_result -> normalization
val upsert_retained_indices : upsert_result -> int Rrbvec.t

val resolve_target_index :
  entry Rrbvec.t ->
  graph_id:string option ->
  graph_identifier:string option ->
  int option
