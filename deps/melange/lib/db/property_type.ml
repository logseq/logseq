type t =
  | Raw_number
  | Property
  | Coll
  | Page
  | String
  | Keyword
  | Class
  | Json
  | Entity
  | Map
  | Any
  | Default
  | Number
  | Date
  | Datetime
  | Checkbox
  | Url
  | Node
  | Asset

let to_string = function
  | Raw_number -> "raw-number"
  | Property -> "property"
  | Coll -> "coll"
  | Page -> "page"
  | String -> "string"
  | Keyword -> "keyword"
  | Class -> "class"
  | Json -> "json"
  | Entity -> "entity"
  | Map -> "map"
  | Any -> "any"
  | Default -> "default"
  | Number -> "number"
  | Date -> "date"
  | Datetime -> "datetime"
  | Checkbox -> "checkbox"
  | Url -> "url"
  | Node -> "node"
  | Asset -> "asset"

let of_string = function
  | "raw-number" -> Some Raw_number
  | "property" -> Some Property
  | "coll" -> Some Coll
  | "page" -> Some Page
  | "string" -> Some String
  | "keyword" -> Some Keyword
  | "class" -> Some Class
  | "json" -> Some Json
  | "entity" -> Some Entity
  | "map" -> Some Map
  | "any" -> Some Any
  | "default" -> Some Default
  | "number" -> Some Number
  | "date" -> Some Date
  | "datetime" -> Some Datetime
  | "checkbox" -> Some Checkbox
  | "url" -> Some Url
  | "node" -> Some Node
  | "asset" -> Some Asset
  | _ -> None

let property_value_content ~property_type ~property_is_default ~block_type =
  property_type = Some Number
  || (property_is_default && block_type = Some Number)

let infer ~number ~url ~boolean =
  if number then Number
  else if url then Url
  else if boolean then Checkbox
  else Default

let internal_built_in =
  Rrbvec.of_array
    [|
      Raw_number;
      Property;
      Coll;
      Page;
      String;
      Keyword;
      Class;
      Json;
      Entity;
      Map;
      Any;
    |]

let user_built_in =
  Rrbvec.of_array
    [| Default; Number; Date; Datetime; Checkbox; Url; Node; Asset |]

let user_allowed_internal = Rrbvec.of_array [| Map; Json; String |]
let closed_value = Rrbvec.of_array [| Default; Number; Url |]
let cardinality = Rrbvec.of_array [| Default; Number; Url; Date; Node; Asset |]
let default_value_ref = Rrbvec.of_array [| Default; Number; Checkbox |]
let text_ref = Rrbvec.of_array [| Default; Url; Entity |]
let original_value_ref = Rrbvec.of_array [| Number |]
let value_ref = Rrbvec.of_array [| Default; Url; Number |]
let user_ref = Rrbvec.of_array [| Date; Node; Asset; Default; Url; Number |]

let all_ref =
  Rrbvec.of_array
    [| Date; Number; Default; Property; Page; Node; Class; Url; Entity; Asset |]

let with_db = all_ref
