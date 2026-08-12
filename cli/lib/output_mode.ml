type t = Output.Mode.packed

let all =
  [
    Output.Mode.Packed Output.Mode.Human;
    Output.Mode.Packed Output.Mode.Json;
    Output.Mode.Packed Output.Mode.Edn;
  ]

let default = Output.Mode.Packed Output.Mode.Human
let of_string = Output.Mode.of_string
let to_string (Output.Mode.Packed mode) = Output.Mode.to_string mode
let structured (Output.Mode.Packed mode) = Output.Mode.structured mode
let merge_preference xs = Vec.find_map (fun x -> x) xs
let for_config config = Option.value config.Cli_config.output_format ~default

let error ?command ?context mode err =
  Cli_result.error ?command ?context mode err
