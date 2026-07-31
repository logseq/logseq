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

type assignment = { key : key; value : Melange_edn_melange.any }

type update_plan = {
  update_tags : Selector.tag Rrbvec.t;
  remove_tags : Selector.tag Rrbvec.t;
  update_properties : assignment Rrbvec.t;
  remove_properties : key Rrbvec.t;
}

let empty_update_plan =
  {
    update_tags = Vec.empty;
    remove_tags = Vec.empty;
    update_properties = Vec.empty;
    remove_properties = Vec.empty;
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
