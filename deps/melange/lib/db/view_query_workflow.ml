type 'value capabilities = {
  field : 'value -> string -> 'value;
  map_keys : 'value -> 'value array;
  resolve_ident : 'value -> 'value option;
  resolve_uuid : 'value -> 'value option;
  nil_value : 'value;
  is_nil : 'value -> bool;
  is_entity : 'value -> bool;
  is_collection : 'value -> bool;
  is_string : 'value -> bool;
  is_bool : 'value -> bool;
  is_number : 'value -> bool;
  is_keyword : 'value -> bool;
  is_uuid : 'value -> bool;
  is_instant : 'value -> bool;
  value_truthy : 'value -> bool;
  bool_from_value : 'value -> bool;
  float_from_value : 'value -> float;
  string_from_value : 'value -> string;
  string_to_value : string -> 'value;
  lowercase : string -> string;
  ident_text : 'value -> string;
  collection_to_array : 'value -> 'value array;
  value_to_string : 'value -> string;
  equal : 'value -> 'value -> bool;
  instant_to_ms : 'value -> float;
  now_ms : unit -> float;
  relative_timestamp_ms : now_ms:float -> string -> float option;
}

type operator =
  | Is
  | Is_not
  | Text_contains
  | Text_not_contains
  | Number_gt
  | Number_gte
  | Number_lt
  | Number_lte
  | Between
  | Date_before
  | Date_after
  | Before
  | After

let operator_of_string = function
  | "is" -> Is
  | "is-not" -> Is_not
  | "text-contains" -> Text_contains
  | "text-not-contains" -> Text_not_contains
  | "number-gt" -> Number_gt
  | "number-gte" -> Number_gte
  | "number-lt" -> Number_lt
  | "number-lte" -> Number_lte
  | "between" -> Between
  | "date-before" -> Date_before
  | "date-after" -> Date_after
  | "before" -> Before
  | "after" -> After
  | operator -> invalid_arg ("Unsupported DB view filter operator: " ^ operator)

let optional_field capabilities entity name =
  let value = capabilities.field entity name in
  if capabilities.is_nil value then None else Some value

let nth_opt values index =
  if index < 0 || index >= Rrbvec.length values then None
  else Some (Rrbvec.nth values index)

let values capabilities value =
  if capabilities.is_nil value then Rrbvec.empty
  else if capabilities.is_collection value then
    value |> capabilities.collection_to_array |> Rrbvec.of_array
  else Rrbvec.singleton value

let property_value_content capabilities entity =
  let title = capabilities.field entity "block/title" in
  if capabilities.value_truthy title then title
  else capabilities.field entity "logseq.property/value"

let content capabilities value =
  if capabilities.is_uuid value then
    value |> capabilities.resolve_uuid
    |> Option.fold ~none:capabilities.nil_value
         ~some:(property_value_content capabilities)
  else if capabilities.is_entity value then
    property_value_content capabilities value
  else if capabilities.is_keyword value then
    value |> capabilities.value_to_string |> capabilities.string_to_value
  else value

let is_empty capabilities value =
  capabilities.is_nil value
  || capabilities.is_keyword value
     && String.equal
          (capabilities.ident_text value)
          "logseq.property/empty-placeholder"
  || capabilities.is_string value
     && String.equal (String.trim (capabilities.string_from_value value)) ""
  || capabilities.is_collection value
     && Array.length (capabilities.collection_to_array value) = 0

let property_matches_as_entity capabilities value property =
  let has_ident =
    capabilities.field value "db/ident" |> capabilities.is_nil |> not
  in
  let property_type =
    Option.bind (optional_field capabilities property "logseq.property/type")
      (fun value -> value |> capabilities.ident_text |> Property_type.of_string)
  in
  has_ident
  || Option.fold ~none:true
       ~some:(fun property_type ->
         not (Rrbvec.mem property_type Property_type.closed_value))
       property_type

let match_values capabilities match_ = values capabilities match_

let reference_id capabilities value =
  if capabilities.is_number value then Some value
  else if capabilities.is_uuid value then
    Option.bind (capabilities.resolve_uuid value) (fun entity ->
        optional_field capabilities entity "db/id")
  else optional_field capabilities value "db/id"

let property_is_ref capabilities = function
  | None -> false
  | Some property ->
      optional_field capabilities property "db/valueType"
      |> Option.exists (fun value ->
          String.equal (capabilities.ident_text value) "db.type/ref")

let membership_hit capabilities ~property ~matches ~match_ids ~match_contents
    ~row_values =
  if property_is_ref capabilities property && not (Rrbvec.is_empty match_ids)
  then
    row_values
    |> Rrbvec.filter_map (reference_id capabilities)
    |> Rrbvec.exists (fun id -> Rrbvec.exists (capabilities.equal id) match_ids)
  else
    match nth_opt row_values 0 with
    | Some first when capabilities.is_entity first -> (
        match property with
        | Some property
          when property_matches_as_entity capabilities first property ->
            Rrbvec.exists
              (fun value ->
                let uuid = capabilities.field value "block/uuid" in
                Rrbvec.exists (capabilities.equal uuid) matches)
              row_values
        | Some _ | None ->
            let contents =
              Rrbvec.map (property_value_content capabilities) row_values
            in
            match_contents
            |> Rrbvec.exists (fun candidate ->
                Rrbvec.exists (capabilities.equal candidate) contents))
    | Some _ | None ->
        Rrbvec.exists
          (fun value -> Rrbvec.exists (capabilities.equal value) matches)
          row_values

let number_values capabilities row_values =
  row_values
  |> Rrbvec.map (content capabilities)
  |> Rrbvec.filter capabilities.is_number
  |> Rrbvec.map capabilities.float_from_value

let number_target capabilities value =
  if capabilities.is_number value then capabilities.float_from_value value
  else invalid_arg "DB view number filter target must be numeric"

let boundary capabilities values index =
  match nth_opt values index with
  | None -> None
  | Some value when capabilities.is_nil value -> None
  | Some value -> Some (number_target capabilities value)

let timestamp capabilities value =
  if capabilities.is_nil value then None
  else if capabilities.is_number value then
    Some (capabilities.float_from_value value)
  else if capabilities.is_instant value then
    Some (capabilities.instant_to_ms value)
  else if capabilities.is_string value then
    capabilities.relative_timestamp_ms ~now_ms:(capabilities.now_ms ())
      (capabilities.string_from_value value)
  else invalid_arg "DB view timestamp filter value is unsupported"

let compile_clause capabilities clause =
  let parts = clause |> capabilities.collection_to_array |> Rrbvec.of_array in
  match (nth_opt parts 0, nth_opt parts 1, nth_opt parts 2) with
  | Some property_ident, Some operator, Some match_ -> (
      if capabilities.is_nil match_ then fun _ -> true
      else
        let operator =
          operator |> capabilities.ident_text |> operator_of_string
        in
        let property = capabilities.resolve_ident property_ident in
        let matches = match_values capabilities match_ in
        let match_ids = Rrbvec.filter_map (reference_id capabilities) matches in
        let match_contents =
          matches
          |> Rrbvec.filter_map capabilities.resolve_uuid
          |> Rrbvec.map (property_value_content capabilities)
        in
        fun row ->
          let value =
            capabilities.field row (capabilities.ident_text property_ident)
          in
          let row_values = values capabilities value in
          let negated = operator = Is_not in
          match operator with
          | Is | Is_not ->
              if capabilities.is_bool match_ then
                View_filter.boolean_match ~negated
                  ~value:
                    (content capabilities value |> capabilities.value_truthy)
                  ~expected:(capabilities.bool_from_value match_)
              else if
                capabilities.is_keyword match_
                && String.equal (capabilities.ident_text match_) "empty"
              then
                View_filter.empty_match ~negated
                  ~empty:(is_empty capabilities value)
              else
                View_filter.membership_match ~negated
                  ~match_empty:(Rrbvec.is_empty matches)
                  ~hit:
                    (membership_hit capabilities ~property ~matches ~match_ids
                       ~match_contents ~row_values)
          | Text_contains ->
              let pattern =
                match_ |> capabilities.string_from_value
                |> capabilities.lowercase
              in
              let texts =
                row_values
                |> Rrbvec.filter_map (fun value ->
                    let value = content capabilities value in
                    if capabilities.is_nil value then None
                    else
                      Some
                        (value |> capabilities.string_from_value
                       |> capabilities.lowercase))
              in
              View_filter.text_contains texts pattern
          | Text_not_contains ->
              let texts =
                row_values
                |> Rrbvec.map (content capabilities)
                |> Rrbvec.map capabilities.value_to_string
              in
              View_filter.text_not_contains texts
                (capabilities.string_from_value match_)
          | Number_gt | Number_gte | Number_lt | Number_lte ->
              let operator =
                match operator with
                | Number_gt -> View_filter.Gt
                | Number_gte -> Gte
                | Number_lt -> Lt
                | Number_lte -> Lte
                | _ -> invalid_arg "unreachable"
              in
              View_filter.number_match operator
                (number_values capabilities row_values)
                (number_target capabilities match_)
          | Between ->
              let boundaries = match_values capabilities match_ in
              if Rrbvec.is_empty boundaries then true
              else
                View_filter.between
                  (number_values capabilities row_values)
                  ~start:(boundary capabilities boundaries 0)
                  ~end_:(boundary capabilities boundaries 1)
          | Date_before | Date_after ->
              let operator =
                if operator = Date_before then View_filter.Lt else Gt
              in
              let journal_days =
                row_values
                |> Rrbvec.filter_map (fun value ->
                    optional_field capabilities value "block/journal-day")
                |> Rrbvec.filter capabilities.is_number
                |> Rrbvec.map capabilities.float_from_value
              in
              View_filter.number_match operator journal_days
                (capabilities.field match_ "block/journal-day"
                |> number_target capabilities)
          | Before | After ->
              View_filter.timestamp_match ~before:(operator = Before)
                ~value:(timestamp capabilities value)
                ~target:(timestamp capabilities match_))
  | _ ->
      invalid_arg
        "DB view filter clause must contain property, operator, and match"

let filter_entities_with capabilities ~filters ~input entities =
  let clauses =
    capabilities.field filters "filters"
    |> capabilities.collection_to_array
    |> Array.map (compile_clause capabilities)
    |> Rrbvec.of_array
  in
  let or_ =
    let value = capabilities.field filters "or?" in
    (not (capabilities.is_nil value)) && capabilities.value_truthy value
  in
  let input = String.trim input |> capabilities.lowercase in
  let matches row =
    let input_match =
      if String.equal input "" then true
      else
        capabilities.field row "block/title"
        |> capabilities.string_from_value |> capabilities.lowercase
        |> fun title -> View_filter.text_contains (Rrbvec.singleton title) input
    in
    input_match
    && View_filter.combine ~or_ (Rrbvec.map (fun clause -> clause row) clauses)
  in
  Rrbvec.filter matches entities

let distinct equal values =
  Rrbvec.fold_left
    (fun result value ->
      if Rrbvec.exists (equal value) result then result
      else Rrbvec.push_back result value)
    Rrbvec.empty values

let explicit_properties ~collection_to_array ~ident_text query =
  let query = query |> collection_to_array |> Rrbvec.of_array in
  match (nth_opt query 0, nth_opt query 1) with
  | Some find, Some expression when String.equal (ident_text find) "find" ->
      let expression = expression |> collection_to_array |> Rrbvec.of_array in
      if
        nth_opt expression 0
        |> Option.exists (fun value -> String.equal (ident_text value) "pull")
      then
        nth_opt expression (Rrbvec.length expression - 1)
        |> Option.map (fun properties ->
            properties |> collection_to_array |> Rrbvec.of_array)
      else None
  | _ -> None

let query_properties ~map_keys ~collection_to_array ~ident_text ~equal ~query
    ~entities =
  match explicit_properties ~collection_to_array ~ident_text query with
  | Some properties
    when not
           (Rrbvec.length properties = 1
           && nth_opt properties 0
              |> Option.exists (fun value ->
                  String.equal (ident_text value) "*")) ->
      properties
  | Some _ | None ->
      entities
      |> Rrbvec.concat_map (fun entity -> entity |> map_keys |> Rrbvec.of_array)
      |> distinct equal

let query_properties_with capabilities ~query ~entities =
  query_properties ~map_keys:capabilities.map_keys
    ~collection_to_array:capabilities.collection_to_array
    ~ident_text:capabilities.ident_text ~equal:capabilities.equal ~query
    ~entities
