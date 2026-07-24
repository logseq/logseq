module Domain = Melange_db.Property_catalog

type encoded_scalar = {
  kind : string;
  text : string;
  boolValue : bool;
  intValue : int;
}

type encoded_schema = {
  typeName : string;
  cardinality : string Js.Nullable.t;
  hide : bool Js.Nullable.t;
  publicValue : bool Js.Nullable.t;
  viewContext : string Js.Nullable.t;
  uiPosition : string Js.Nullable.t;
  classes : string array;
}

type encoded_closed_value = {
  ident : string;
  value : string;
  uuid : string;
  iconType : string Js.Nullable.t;
  iconId : string Js.Nullable.t;
  propertiesKind : string;
  checkboxState : bool Js.Nullable.t;
}

type encoded_entry = {
  ident : string;
  title : string Js.Nullable.t;
  attribute : string Js.Nullable.t;
  schema : encoded_schema;
  queryable : bool Js.Nullable.t;
  properties : (string * encoded_scalar) array;
  closedValues : encoded_closed_value array;
  rtcIgnoreAttrWhenSyncing : bool;
}

let nullable value = Js.Nullable.fromOption value

let encode_scalar = function
  | Domain.Keyword value ->
      { kind = "keyword"; text = value; boolValue = false; intValue = 0 }
  | String_literal value ->
      { kind = "string"; text = value; boolValue = false; intValue = 0 }
  | Bool value -> { kind = "bool"; text = ""; boolValue = value; intValue = 0 }
  | Int value ->
      { kind = "int"; text = ""; boolValue = false; intValue = value }

let encode_schema schema =
  {
    typeName = Domain.schema_property_type schema;
    cardinality = Domain.schema_cardinality schema |> nullable;
    hide = Domain.schema_hide schema |> nullable;
    publicValue = Domain.schema_public schema |> nullable;
    viewContext = Domain.schema_view_context schema |> nullable;
    uiPosition = Domain.schema_ui_position schema |> nullable;
    classes = Domain.schema_classes schema |> Rrbvec.to_array;
  }

let encode_closed_value value =
  let icon_type, icon_id =
    match Domain.closed_value_icon value with
    | None -> (None, None)
    | Some icon -> (Some icon.icon_type, Some icon.id)
  in
  let properties_kind, checkbox_state =
    match Domain.closed_value_properties value with
    | Absent -> ("absent", None)
    | Nil -> ("nil", None)
    | Checkbox value -> ("checkbox", Some value)
  in
  {
    ident = Domain.closed_value_ident value;
    value = Domain.closed_value_value value;
    uuid = Domain.closed_value_uuid value;
    iconType = nullable icon_type;
    iconId = nullable icon_id;
    propertiesKind = properties_kind;
    checkboxState = nullable checkbox_state;
  }

let entries =
  Domain.entries
  |> Rrbvec.map (fun entry ->
      {
        ident = Domain.ident entry;
        title = Domain.title entry |> nullable;
        attribute = Domain.attribute entry |> nullable;
        schema = Domain.schema entry |> encode_schema;
        queryable = Domain.queryable entry |> nullable;
        properties =
          Domain.properties entry
          |> Rrbvec.map (fun (name, value) -> (name, encode_scalar value))
          |> Rrbvec.to_array;
        closedValues =
          Domain.closed_values entry
          |> Rrbvec.map encode_closed_value
          |> Rrbvec.to_array;
        rtcIgnoreAttrWhenSyncing = Domain.rtc_ignore_attr_when_syncing entry;
      })
  |> Rrbvec.to_array

let closedValues ident =
  match
    Domain.entries |> Rrbvec.find_opt (fun entry -> Domain.ident entry = ident)
  with
  | None -> Js.Nullable.undefined
  | Some entry ->
      let values = Domain.closed_values entry in
      if Rrbvec.is_empty values then Js.Nullable.undefined
      else
        values
        |> Rrbvec.map encode_closed_value
        |> Rrbvec.to_array |> Js.Nullable.return

let names values = Rrbvec.to_array values
let publicBuiltInProperties = names Domain.public_built_in_properties
let dbAttributeProperties = names Domain.db_attribute_properties
let privateDbAttributeProperties = names Domain.private_db_attribute_properties
let publicDbAttributeProperties = names Domain.public_db_attribute_properties
let readOnlyProperties = names Domain.read_only_properties
let schemaPropertiesMap = Domain.schema_properties_map |> Rrbvec.to_array
let schemaProperties = names Domain.schema_properties
let logseqPropertyNamespaces = names Domain.logseq_property_namespaces
