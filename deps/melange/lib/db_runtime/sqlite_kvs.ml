module Melange_edn = Melange_edn_melange
module Transit = Transit_melange.Transit.Json

type database = Js.Json.t
type statement
type exec_options

let non_referenced_addresses_sql =
  "WITH all_referenced AS (\n\
  \     SELECT CAST(value AS INTEGER) AS addr\n\
  \     FROM kvs, json_each(kvs.addresses)\n\
  \   )\n\
  \   SELECT kvs.addr\n\
  \   FROM kvs\n\
  \   WHERE kvs.addr NOT IN (SELECT addr FROM all_referenced)"

let schema_wasm_sql = "select content from kvs where addr = 0"
let schema_node_sql = "select content from kvs where addr = ?"
let addresses_sql = "select addr, addresses from kvs"
let delete_address_sql = "Delete from kvs where addr = ?"
let count_sql = "select count(*) as c from kvs"

external exec_options : sql:string -> rowMode:string -> unit -> exec_options
  = ""
[@@mel.obj]

external exec_options_with_bind :
  sql:string -> rowMode:string -> bind:Js.Json.t array -> unit -> exec_options
  = ""
[@@mel.obj]

external exec : database -> exec_options -> Js.Json.t array array = "exec"
[@@mel.send]

external transaction_wasm : database -> ((database -> unit)[@u]) -> unit
  = "transaction"
[@@mel.send]

external prepare : database -> string -> statement = "prepare" [@@mel.send]
external get_by_address : statement -> int -> Js.Json.t = "get" [@@mel.send]
external get : statement -> Js.Json.t = "get" [@@mel.send]
external all : statement -> Js.Json.t array = "all" [@@mel.send]
external run : statement -> int -> unit = "run" [@@mel.send]

external transaction_node :
  database -> ((int array -> unit)[@u]) -> int array -> unit = "transaction"
[@@mel.send]

let fail message = invalid_arg ("SQLite kvs: " ^ message)

let json_object value context =
  match Js.Json.decodeObject value with
  | Some object_ -> object_
  | None -> fail (context ^ " expects object")

let json_string context value =
  match Js.Json.decodeString value with
  | Some value -> value
  | None -> fail (context ^ " expects string")

let json_int context value =
  match Js.Json.decodeNumber value with
  | Some value -> int_of_float value
  | None -> fail (context ^ " expects number")

let field object_ name context =
  match Js.Dict.get object_ name with
  | Some value -> value
  | None -> fail (context ^ " missing field " ^ name)

let row_pair row context =
  if Array.length row < 2 then fail (context ^ " expects [addr, addresses]")
  else (row.(0), row.(1))

let parse_transit text =
  try text |> Transit.of_string |> Transit.to_edn
  with Transit.Decode_error message ->
    fail ("Transit decode error: " ^ message)

let map_get (Melange_edn.Any value) key =
  match value with
  | Melange_edn.Map entries ->
      Array.find_map
        (fun (Melange_edn.Any entry_key, entry_value) ->
          match entry_key with
          | Melange_edn.Keyword keyword
            when String.equal (Melange_edn.keyword_to_string keyword) key ->
              Some entry_value
          | _ -> None)
        entries
  | _ -> fail "schema root expects Transit map"

let int_value (Melange_edn.Any value) context =
  match value with
  | Melange_edn.Int value -> Int64.to_int value
  | _ -> fail (context ^ " expects int")

let required_map_value schema key =
  match map_get schema key with
  | Some value -> value
  | None -> fail ("schema missing " ^ key)

let schema_roots_from_content content =
  let schema = parse_transit content in
  [|
    int_value (required_map_value schema "eavt") "eavt";
    int_value (required_map_value schema "avet") "avet";
    int_value (required_map_value schema "aevt") "aevt";
  |]

let wasm_schema_roots database =
  let rows =
    exec database (exec_options ~sql:schema_wasm_sql ~rowMode:"array" ())
  in
  if Array.length rows = 0 || Array.length rows.(0) = 0 then
    fail "schema row missing";
  rows.(0).(0) |> json_string "schema content" |> schema_roots_from_content

let node_schema_roots database =
  let statement = prepare database schema_node_sql in
  get_by_address statement 0 |> fun row ->
  field (json_object row "schema row") "content" "schema row"
  |> json_string "schema content"
  |> schema_roots_from_content

let parse_addresses text =
  match text |> Js.Json.parseExn |> Js.Json.decodeArray with
  | Some values -> Array.map (json_int "address") values
  | None -> fail "addresses expects JSON array"

let wasm_rows database =
  exec database (exec_options ~sql:addresses_sql ~rowMode:"array" ())

let node_rows database = prepare database addresses_sql |> all

let wasm_non_referenced database =
  exec database
    (exec_options ~sql:non_referenced_addresses_sql ~rowMode:"array" ())
  |> Array.map (fun row ->
      if Array.length row = 0 then fail "non-referenced row expects addr";
      json_int "non-referenced address" row.(0))

let node_non_referenced database =
  prepare database non_referenced_addresses_sql
  |> all
  |> Array.map (fun row ->
      field (json_object row "non-referenced row") "addr" "non-referenced row"
      |> json_int "non-referenced address")

let node_edges database =
  node_rows database
  |> Array.map (fun row ->
      let object_ = json_object row "edge row" in
      let address =
        field object_ "addr" "edge row" |> json_int "edge address"
      in
      let children =
        field object_ "addresses" "edge row"
        |> json_string "edge addresses"
        |> parse_addresses
      in
      (address, Rrbvec.of_array children))

let wasm_delete database addresses =
  transaction_wasm database (fun[@u] tx ->
      Array.iter
        (fun address ->
          let bind = [| Js.Json.number (float_of_int address) |] in
          ignore
            (exec tx
               (exec_options_with_bind ~sql:delete_address_sql ~rowMode:"array"
                  ~bind ())))
        (Rrbvec.to_array addresses))

let node_delete database addresses =
  let statement = prepare database delete_address_sql in
  let delete =
    transaction_node database (fun[@u] values ->
        Array.iter (run statement) values)
  in
  delete (Rrbvec.to_array addresses)

let node_address_count database =
  prepare database count_sql |> get |> fun row ->
  field (json_object row "count row") "c" "count row" |> json_int "count"
