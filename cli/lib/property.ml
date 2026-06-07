type key =
  | Key_ident of Cli_primitive.keyword
  | Key_id of Cli_primitive.db_id
  | Key_name of string

type cardinality = One | Many

type kind =
  | Default
  | Page
  | Class
  | Property
  | Entity
  | Node
  | Date
  | Url
  | Checkbox
  | Number
  | Template
  | Other of Cli_primitive.keyword

type schema = {
  kind : kind option;
  cardinality : cardinality option;
  hidden : bool option;
  public : bool option;
}

type assignment = { key : key; value : Melange_edn.any }

type update_plan = {
  update_tags : Selector.tag list;
  remove_tags : Selector.tag list;
  update_properties : assignment list;
  remove_properties : key list;
}

let empty_update_plan =
  {
    update_tags = [];
    remove_tags = [];
    update_properties = [];
    remove_properties = [];
  }

let parse_key value =
  match
    ( Edn_util.as_int64 value,
      Edn_util.as_keyword_t value,
      Edn_util.as_string value )
  with
  | Some id, _, _ -> Some (Key_id id)
  | _, Some key, _ -> Some (Key_ident key)
  | _, _, Some name -> Some (Key_name name)
  | _ -> None

let kind_of_string = function
  | "default" -> Some Default
  | "page" -> Some Page
  | "class" -> Some Class
  | "property" -> Some Property
  | "entity" -> Some Entity
  | "node" -> Some Node
  | "date" -> Some Date
  | "url" -> Some Url
  | "checkbox" -> Some Checkbox
  | "number" -> Some Number
  | "template" -> Some Template
  | "" -> None
  | s -> Some (Other (Edn_util.keyword_t s))

let string_of_kind = function
  | Default -> "default"
  | Page -> "page"
  | Class -> "class"
  | Property -> "property"
  | Entity -> "entity"
  | Node -> "node"
  | Date -> "date"
  | Url -> "url"
  | Checkbox -> "checkbox"
  | Number -> "number"
  | Template -> "template"
  | Other k -> Edn_util.keyword_to_string k

let cardinality_of_string = function
  | "one" -> Some One
  | "many" -> Some Many
  | _ -> None

let string_of_cardinality = function One -> "one" | Many -> "many"

let schema_empty =
  { kind = None; cardinality = None; hidden = None; public = None }
