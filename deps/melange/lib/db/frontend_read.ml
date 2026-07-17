let contains values target =
  Rrbvec.fold_left
    (fun found value -> found || String.equal value target)
    false values

let join ~separator values =
  let buffer = Buffer.create (Rrbvec.length values * 16) in
  Rrbvec.iteri
    (fun index value ->
      if index > 0 then Buffer.add_string buffer separator;
      Buffer.add_string buffer value)
    values;
  Buffer.contents buffer

let built_in_class_property ~class_built_in ~class_value ~property_built_in
    ~property_ident ~schema_properties =
  class_built_in && class_value && property_built_in
  && contains schema_properties property_ident

let private_built_in_page ~property ~public_property ~class_value ~internal_page
    =
  if property then not public_property
  else if class_value || internal_page then false
  else true

let page_title parent_titles title =
  Rrbvec.push_back parent_titles title
  |> join ~separator:"/"

type extend = { title : string option; built_in : bool }

let class_title_with_extends ~title extends =
  extends
  |> Rrbvec.map (fun (extend : extend) ->
      ({ title = extend.title; built_in = extend.built_in }
        : Block_title.extend))
  |> Block_title.class_title_with_extends ~stored_title:title
       ~display_title:None

let class_instance ~class_id ~tag_ids ~parent_ids =
  contains tag_ids class_id || contains parent_ids class_id

let substring_exists text target =
  let text_length = String.length text in
  let target_length = String.length target in
  let rec search index =
    if index + target_length > text_length then false
    else if String.sub text index target_length = target then true
    else search (index + 1)
  in
  target_length = 0 || search 0

let inline_tag title uuid = substring_exists title ("#[[" ^ uuid ^ "]]")

let node_display_type_classes =
  Rrbvec.of_array
    [|
      "logseq.class/Code-block";
      "logseq.class/Math-block";
      "logseq.class/Quote-block";
    |]

let class_ident_by_display_type = function
  | "code" -> Some "logseq.class/Code-block"
  | "math" -> Some "logseq.class/Math-block"
  | "quote" -> Some "logseq.class/Quote-block"
  | _ -> None

let display_type_by_class_ident = function
  | "logseq.class/Code-block" -> Some "code"
  | "logseq.class/Math-block" -> Some "math"
  | "logseq.class/Quote-block" -> Some "quote"
  | _ -> None

let library ~built_in ~title ~library_title =
  built_in && String.equal title library_title
