(** Shared constants, mirroring clj-e2e's [const.clj]. *)

let page_counter = ref 0

let next_page_name () =
  incr page_counter;
  "page " ^ string_of_int !page_counter

let graph_name = "e2e-test"
