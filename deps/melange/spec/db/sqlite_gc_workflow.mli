type 'database capabilities = {
  index_roots : 'database -> int Rrbvec.t;
  non_referenced : 'database -> int Rrbvec.t;
  edges : 'database -> (int * int Rrbvec.t) Rrbvec.t;
  delete : 'database -> int Rrbvec.t -> unit;
  address_count : 'database -> int;
}

val collect_wasm_with :
  'database capabilities -> 'database option -> full_gc:bool -> unit

val collect_node_with : 'database capabilities -> 'database -> walk:bool -> unit
val ensure_no_garbage_with : 'database capabilities -> 'database -> bool
