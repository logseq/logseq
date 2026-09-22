type storage =
  { root : string
  ; graphs_dir : string
  ; lifecycle_dir : string
  }

type runtime = unit

let resolve_storage ~root:_ ~graphs_dir:_ =
  invalid_arg "Graph_lifecycle: unsupported on native"

let admit ~storage:_ ~repo:_ ~owner:_ ?ticket:_ ?generation:_ () =
  invalid_arg "Graph_lifecycle: unsupported on native"

let runtime_ticket _ = invalid_arg "Graph_lifecycle: unsupported on native"
let runtime_generation _ = invalid_arg "Graph_lifecycle: unsupported on native"
let runtime_root _ = invalid_arg "Graph_lifecycle: unsupported on native"
let runtime_storage _ = invalid_arg "Graph_lifecycle: unsupported on native"
let check_admission _ = invalid_arg "Graph_lifecycle: unsupported on native"
let assert_ownership _ = invalid_arg "Graph_lifecycle: unsupported on native"
let release_ownership _ = invalid_arg "Graph_lifecycle: unsupported on native"
let record_stop _ _ = invalid_arg "Graph_lifecycle: unsupported on native"
let abort_admission _ _ = invalid_arg "Graph_lifecycle: unsupported on native"
let publish _ _ _ = invalid_arg "Graph_lifecycle: unsupported on native"

let create_graph ~storage:_ ~repo:_ =
  invalid_arg "Graph_lifecycle: unsupported on native"

type ctx = unit

let context ~storage:_ ~repo:_ =
  invalid_arg "Graph_lifecycle: unsupported on native"

let ownership_path _ = invalid_arg "Graph_lifecycle: unsupported on native"

type ownership_handle = unit

let acquire_ownership _ =
  invalid_arg "Graph_lifecycle: unsupported on native"

let release _ = invalid_arg "Graph_lifecycle: unsupported on native"
