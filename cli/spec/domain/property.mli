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

val empty_update_plan : update_plan
val parse_key : Melange_edn_melange.any -> key option
val kind_of_string : string -> kind option
val string_of_kind : kind -> string
val cardinality_of_string : string -> cardinality option
