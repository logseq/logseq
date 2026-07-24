module Domain = Melange_db.Tree_read

type encoded_child = { id : int; order : string; excluded : bool }
type encoded_node = { id : int; order : string; children : int array }

let decode_child (child : encoded_child) : Domain.child =
  { id = child.id; order = child.order; excluded = child.excluded }

let sortIds children =
  children |> Array.map decode_child |> Rrbvec.of_array |> Domain.sort_ids
  |> Rrbvec.to_array

let neighborId direction current_order children =
  let direction =
    match direction with
    | "left" -> Domain.Left
    | "right" -> Right
    | direction -> invalid_arg ("DB tree reads: unknown direction " ^ direction)
  in
  children |> Array.map decode_child |> Rrbvec.of_array
  |> Domain.neighbor_id ~direction ~current_order
  |> Js.Nullable.fromOption

let preorderIds root_id nodes =
  nodes
  |> Array.map (fun (node : encoded_node) ->
      ({
         id = node.id;
         order = node.order;
         children = Rrbvec.of_array node.children;
       }
        : Domain.node))
  |> Rrbvec.of_array
  |> Domain.preorder_ids ~root_id
  |> Rrbvec.to_array
