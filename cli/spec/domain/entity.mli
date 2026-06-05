type kind = Page | Block | Tag | Property | Task | Asset | Unknown

type t = {
  id : Cli_primitive.db_id option;
  uuid : Cli_primitive.uuid option;
  ident : Cli_primitive.keyword option;
  name : string option;
  title : string option;
  kind : kind;
  tags : Cli_primitive.keyword list;
  created_at : Ptime.t option;
  updated_at : Ptime.t option;
  deleted_at : Ptime.t option;
  raw : Edn_ocaml.any;
}

val of_value : Edn_ocaml.any -> t
val label : t -> string option
val is_recycled : t -> bool
val has_tag : Cli_primitive.keyword -> t -> bool
val is_page : t -> bool
val is_block : t -> bool
val is_tag : t -> bool
val is_property : t -> bool
