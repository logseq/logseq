type kind = Page | Block | Tag | Property | Task | Asset | Unknown

type t = {
  id : Cli_primitive.db_id option;
  uuid : Cli_primitive.uuid option;
  ident : Cli_primitive.keyword option;
  name : string option;
  title : string option;
  kind : kind;
  tags : Cli_primitive.keyword list;
  created_at : Js.Date.t option;
  updated_at : Js.Date.t option;
  deleted_at : Js.Date.t option;
  raw : Melange_edn.any;
}

let of_value raw =
  {
    id = Edn_util.get_int64 raw "db/id";
    uuid = Edn_util.get_string raw "block/uuid";
    ident = Option.bind (Edn_util.get raw "db/ident") Edn_util.as_keyword_t;
    name = Edn_util.get_string raw "name";
    title = Edn_util.get_string raw "block/title";
    kind = Unknown;
    tags = [];
    created_at = None;
    updated_at = None;
    deleted_at = None;
    raw;
  }

let label t =
  match t.title with
  | Some _ as x -> x
  | None -> (
      match t.name with
      | Some _ as x -> x
      | None -> Option.map Edn_util.keyword_to_string t.ident)

let is_recycled t = Option.is_some t.deleted_at
let has_tag tag t = List.mem tag t.tags
let is_page t = t.kind = Page
let is_block t = t.kind = Block
let is_tag t = t.kind = Tag
let is_property t = t.kind = Property
