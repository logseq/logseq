let names values =
  values |> Rrbvec.map Melange_db.Property_type.to_string |> Rrbvec.to_array

let internalBuiltIn = names Melange_db.Property_type.internal_built_in
let userBuiltIn = names Melange_db.Property_type.user_built_in
let userAllowedInternal = names Melange_db.Property_type.user_allowed_internal
let closedValue = names Melange_db.Property_type.closed_value
let cardinality = names Melange_db.Property_type.cardinality
let defaultValueRef = names Melange_db.Property_type.default_value_ref
let textRef = names Melange_db.Property_type.text_ref
let originalValueRef = names Melange_db.Property_type.original_value_ref
let valueRef = names Melange_db.Property_type.value_ref
let userRef = names Melange_db.Property_type.user_ref
let allRef = names Melange_db.Property_type.all_ref
let withDb = names Melange_db.Property_type.with_db

let infer number url boolean =
  Melange_db.Property_type.infer ~number ~url ~boolean
  |> Melange_db.Property_type.to_string

let propertyValueContent property_type property_is_default block_type =
  Melange_db.Property_type.property_value_content
    ~property_type:
      (Option.bind
         (Js.Nullable.toOption property_type)
         Melange_db.Property_type.of_string)
    ~property_is_default
    ~block_type:
      (Option.bind
         (Js.Nullable.toOption block_type)
         Melange_db.Property_type.of_string)
