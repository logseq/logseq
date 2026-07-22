let names values =
  values |> Rrbvec.map Support.Property_type.to_string |> Rrbvec.to_array

let internalBuiltIn = names Support.Property_type.internal_built_in
let userBuiltIn = names Support.Property_type.user_built_in
let userAllowedInternal = names Support.Property_type.user_allowed_internal
let closedValue = names Support.Property_type.closed_value
let cardinality = names Support.Property_type.cardinality
let defaultValueRef = names Support.Property_type.default_value_ref
let textRef = names Support.Property_type.text_ref
let originalValueRef = names Support.Property_type.original_value_ref
let valueRef = names Support.Property_type.value_ref
let userRef = names Support.Property_type.user_ref
let allRef = names Support.Property_type.all_ref
let withDb = names Support.Property_type.with_db

let infer number url boolean =
  Support.Property_type.infer ~number ~url ~boolean
  |> Support.Property_type.to_string

let propertyValueContent property_type property_is_default block_type =
  Support.Property_type.property_value_content
    ~property_type:
      (Option.bind
         (Js.Nullable.toOption property_type)
         Support.Property_type.of_string)
    ~property_is_default
    ~block_type:
      (Option.bind
         (Js.Nullable.toOption block_type)
         Support.Property_type.of_string)
