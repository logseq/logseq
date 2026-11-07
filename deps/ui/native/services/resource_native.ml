(* Graph identity and filesystem roots remain owned by the OCaml asset store.
   Publish before the retained batch that uses them, including graph close. *)
type context =
  { graph : string
  ; graph_dir : string
  ; asset_dir : string
  }

let current : context option ref = ref None

let absolute_root path =
  if path = "" || Filename.is_relative path || String.contains path '\000' then
    invalid_arg "Resource roots must be absolute paths";
  path

let asset_path ~asset_dir filename =
  if filename = "" || filename = "." || filename = ".."
     || String.exists (function '/' | '\\' | '\000' -> true | _ -> false) filename
  then invalid_arg "Invalid graph asset filename";
  Filename.concat (absolute_root asset_dir) filename

let publish ~repo ~graph_dir ~asset_dir =
  if String.contains repo '\000' then invalid_arg "Invalid resource graph identity";
  let next =
    if repo = "" then { graph = ""; graph_dir = ""; asset_dir = "" }
    else { graph = repo; graph_dir = absolute_root graph_dir; asset_dir = absolute_root asset_dir }
  in
  if !current <> Some next then begin
    let payload =
      Yojson.Safe.to_string
        (`Assoc
          [ "graph", `String next.graph
          ; "graph-dir", `String next.graph_dir
          ; "asset-dir", `String next.asset_dir ])
    in
    !Host.host_op "resource-context" payload;
    current := Some next
  end

let reset () = current := None
