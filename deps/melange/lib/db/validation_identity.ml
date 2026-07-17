let vector_contains values expected =
  Rrbvec.fold_left
    (fun found value -> found || String.equal value expected)
    false values

let namespace_contains namespace_ marker =
  let value_length = String.length namespace_ in
  let marker_length = String.length marker in
  let rec loop index =
    if index + marker_length > value_length then false
    else if String.sub namespace_ index marker_length = marker then true
    else loop (index + 1)
  in
  marker_length = 0 || loop 0

let is_user_property_ident ~namespace_ ~qualified =
  qualified
  && Option.fold ~none:false
       ~some:(fun value -> namespace_contains value ".property")
       namespace_

let is_class_ident ~namespace_ ~qualified =
  qualified
  && Option.fold ~none:false
       ~some:(fun value -> namespace_contains value ".class")
       namespace_

let is_logseq_ident_namespace = function
  | "logseq.class" | "logseq.kv" -> true
  | value -> vector_contains Property_catalog.logseq_property_namespaces value

let is_internal_ident ~namespace_ ~ident =
  vector_contains Property_catalog.db_attribute_properties ident
  || Option.fold ~none:false ~some:is_logseq_ident_namespace namespace_
