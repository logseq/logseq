let vector_contains values expected =
  Rrbvec.fold_left
    (fun found value -> found || String.equal value expected)
    false values

let is_logseq_property_namespace = function
  | None -> false
  | Some namespace_ ->
      vector_contains Property_catalog.logseq_property_namespaces namespace_

let contains_substring value substring =
  let value_length = String.length value in
  let substring_length = String.length substring in
  let rec loop index =
    if index + substring_length > value_length then false
    else if String.sub value index substring_length = substring then true
    else loop (index + 1)
  in
  substring_length = 0 || loop 0

let is_user_property_namespace value = contains_substring value ".property"

let is_plugin_property_namespace = function
  | None -> false
  | Some namespace_ -> String.starts_with ~prefix:"plugin.property." namespace_

let is_public_db_attribute ident =
  vector_contains Property_catalog.public_db_attribute_properties ident

let is_internal_property ~namespace_ ~ident ~is_keyword =
  is_logseq_property_namespace namespace_
  || (is_keyword && is_public_db_attribute ident)

let is_property ~namespace_ ~ident ~is_keyword =
  match namespace_ with
  | None -> false
  | Some value ->
      is_logseq_property_namespace namespace_
      || is_user_property_namespace value
      || (is_keyword && is_public_db_attribute ident)

let visible_entries ~namespace_of ~ident_of ~is_keyword entries =
  Rrbvec.filter
    (fun (key, _value) ->
      is_property ~namespace_:(namespace_of key) ~ident:(ident_of key)
        ~is_keyword:(is_keyword key))
    entries

let valid_property_name value =
  not
    (String.starts_with ~prefix:"#" value
    || String.starts_with ~prefix:"[[" value)

let remove_trailing_question_mark value =
  let length = String.length value in
  if length > 0 && value.[length - 1] = '?' then String.sub value 0 (length - 1)
  else value

let built_in_i18n_key ~namespace_ ~name =
  match namespace_ with
  | Some "logseq.class" -> Some ("class.built-in", String.lowercase_ascii name)
  | Some namespace_
    when String.equal namespace_ "logseq.property"
         || String.starts_with ~prefix:"logseq.property." namespace_ -> (
      let sub_namespace =
        if String.equal namespace_ "logseq.property" then None
        else
          Some
            (String.sub namespace_
               (String.length "logseq.property.")
               (String.length namespace_ - String.length "logseq.property."))
      in
      let clean_name = remove_trailing_question_mark name in
      match String.index_opt name '.' with
      | Some index ->
          let property_name = String.sub clean_name 0 index in
          let choice_name =
            String.sub clean_name (index + 1)
              (String.length clean_name - index - 1)
          in
          let subdomain =
            Option.fold ~none:property_name
              ~some:(fun value -> value ^ "-" ^ property_name)
              sub_namespace
          in
          Some ("property." ^ subdomain, choice_name)
      | None ->
          let key_name =
            Option.fold ~none:clean_name
              ~some:(fun value -> value ^ "-" ^ clean_name)
              sub_namespace
          in
          Some ("property.built-in", key_name))
  | Some "block" ->
      Some ("property.built-in", remove_trailing_question_mark name)
  | _ -> None

let built_in_i18n_key_for_ident ident =
  match String.rindex_opt ident '/' with
  | None -> None
  | Some index ->
      let namespace_ = String.sub ident 0 index in
      let name =
        String.sub ident (index + 1) (String.length ident - index - 1)
      in
      built_in_i18n_key ~namespace_:(Some namespace_) ~name

let built_in_has_ref_value ident =
  match
    Rrbvec.find_opt
      (fun entry -> String.equal (Property_catalog.ident entry) ident)
      Property_catalog.entries
  with
  | None -> false
  | Some entry -> (
      let property_type =
        entry |> Property_catalog.schema
        |> Property_catalog.schema_property_type |> Property_type.of_string
      in
      match property_type with
      | Some value -> Rrbvec.mem value Property_type.value_ref
      | None -> false)
