type kind = Page | Block | Tag | Property | Task | Asset | Unknown

type t = {
  id : Cli_primitive.db_id option;
  uuid : Cli_primitive.uuid option;
  ident : Cli_primitive.keyword option;
  name : string option;
  title : string option;
  kind : kind;
  tags : Cli_primitive.keyword list;
  created_at : Time.date option;
  updated_at : Time.date option;
  deleted_at : Time.date option;
  raw : Melange_edn_melange.any;
}

val of_value : Melange_edn_melange.any -> t
