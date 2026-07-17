module Domain = Melange_db.View_order

type encoded_value = {
  kind : string;
  text : string;
  numberValue : float;
  boolValue : bool;
}

type encoded_row = { index : int; keys : encoded_value array }

let decode_value (value : encoded_value) =
  match value.kind with
  | "missing" -> Domain.Missing
  | "bool" -> Bool value.boolValue
  | "number" -> Number value.numberValue
  | "text" -> Text value.text
  | kind -> invalid_arg ("DB view ordering: unknown value kind " ^ kind)

let sortIndices rows ascending =
  let rows =
    rows
    |> Array.map (fun (row : encoded_row) ->
        ({
           index = row.index;
           keys = row.keys |> Array.map decode_value |> Rrbvec.of_array;
         }
          : Domain.row))
    |> Rrbvec.of_array
  in
  let directions =
    ascending
    |> Array.map (fun asc -> if asc then Domain.Asc else Desc)
    |> Rrbvec.of_array
  in
  Domain.sort_indices rows directions |> Rrbvec.to_array

let sortIndicesWithMissingLast rows ascending missing_last =
  let rows =
    rows
    |> Array.map (fun (row : encoded_row) ->
        ({
           index = row.index;
           keys = row.keys |> Array.map decode_value |> Rrbvec.of_array;
         }
          : Domain.row))
    |> Rrbvec.of_array
  in
  let directions =
    ascending
    |> Array.map (fun asc -> if asc then Domain.Asc else Desc)
    |> Rrbvec.of_array
  in
  Domain.sort_indices_with_missing_last rows directions
    (Rrbvec.of_array missing_last)
  |> Rrbvec.to_array
