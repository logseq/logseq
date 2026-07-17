module Domain = Melange_db.Class_catalog

type encoded_value = {
  kind : string;
  text : string;
  boolValue : bool;
  extra : string;
}

let encode_value = function
  | Domain.Keyword value ->
      { kind = "keyword"; text = value; boolValue = false; extra = "" }
  | String_literal value ->
      { kind = "string"; text = value; boolValue = false; extra = "" }
  | Bool value -> { kind = "bool"; text = ""; boolValue = value; extra = "" }
  | Icon { icon_type; id } ->
      { kind = "icon"; text = icon_type; boolValue = false; extra = id }

let entries =
  Domain.entries
  |> Rrbvec.map (fun entry ->
      ( Domain.ident entry,
        Domain.title entry,
        Domain.properties entry
        |> Rrbvec.map (fun (name, value) -> (name, encode_value value))
        |> Rrbvec.to_array,
        Domain.schema_properties entry |> Rrbvec.to_array,
        Domain.required_properties entry |> Rrbvec.to_array ))
  |> Rrbvec.to_array

let names values = Rrbvec.to_array values
let pageChildrenClasses = names Domain.page_children_classes
let pageClasses = names Domain.page_classes
let internalTags = names Domain.internal_tags
let privateTags = names Domain.private_tags
let blockKindTags = names Domain.block_kind_tags
let disallowedInlineTags = names Domain.disallowed_inline_tags
let extendsHiddenTags = names Domain.extends_hidden_tags
let hiddenTags = names Domain.hidden_tags
