let alphabet =
  "_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

let non_int_char_range = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

let starts_with value prefix =
  let value_length = String.length value in
  let prefix_length = String.length prefix in
  value_length >= prefix_length && String.sub value 0 prefix_length = prefix

let is_ascii_digit value = value >= '0' && value <= '9'

let is_allowed = function
  | '0' .. '9' | 'a' .. 'z' | 'A' .. 'Z' -> true
  | '*' | '+' | '!' | '_' | '\'' | '?' | '<' | '>' | '=' | '-' -> true
  | _ -> false

let normalize_name_part value =
  let result = Buffer.create (String.length value + 4) in
  if String.length value > 0 && is_ascii_digit value.[0] then
    Buffer.add_string result "NUM-";
  String.iter
    (fun character ->
      if is_allowed character then Buffer.add_char result character)
    value;
  Buffer.contents result

let nano_id payload =
  Rrbvec.fold_left
    (fun result byte ->
      if byte < 0 || byte > 255 then
        invalid_arg "DB ident random byte must be between 0 and 255";
      let index = byte land 0x3f in
      Buffer.add_char result alphabet.[index];
      result)
    (Buffer.create (Rrbvec.length payload))
    payload
  |> Buffer.contents

let is_plugin_class_namespace namespace_ =
  starts_with namespace_ "plugin.class."

let is_internal_namespace namespace_ =
  namespace_ = "logseq" || namespace_ = "block"
  || starts_with namespace_ "logseq."
  || starts_with namespace_ "block."

let requires_random_suffix ~namespace_ ~stable =
  (not stable) && not (is_plugin_class_namespace namespace_)

let validate_suffix suffix =
  if String.length suffix <> 8 then
    invalid_arg "DB ident random suffix must contain exactly eight characters";
  if is_ascii_digit suffix.[0] then
    invalid_arg "DB ident random suffix must start with a non-numeric character";
  String.iter
    (fun character ->
      if not (is_allowed character) then
        invalid_arg "DB ident random suffix contains an invalid character")
    suffix

let create ~namespace_ ~name ~suffix =
  if is_internal_namespace namespace_ then
    invalid_arg "New DB ident cannot use an internal namespace";
  let name = normalize_name_part name in
  let suffix =
    if is_plugin_class_namespace namespace_ then ""
    else
      match suffix with
      | None -> ""
      | Some value ->
          validate_suffix value;
          "-" ^ value
  in
  namespace_ ^ "/" ^ name ^ suffix

let create_with ~stable_idents ~random_index ~random_bytes ~namespace_ ~name =
  let stable = stable_idents () in
  let suffix =
    if requires_random_suffix ~namespace_ ~stable then (
      let index = random_index (String.length non_int_char_range) in
      if index < 0 || index >= String.length non_int_char_range then
        invalid_arg "DB ident random index is outside the requested range";
      Some (String.make 1 non_int_char_range.[index] ^ nano_id (random_bytes 7)))
    else None
  in
  create ~namespace_ ~name ~suffix

let ensure_unique ~base ~base_exists ~existing =
  if not base_exists then base
  else
    let prefix = base ^ "-" in
    let maximum =
      Rrbvec.fold_left
        (fun maximum candidate ->
          if starts_with candidate prefix then
            let suffix =
              String.sub candidate (String.length prefix)
                (String.length candidate - String.length prefix)
            in
            match int_of_string_opt suffix with
            | Some value ->
                Some (Option.fold ~none:value ~some:(max value) maximum)
            | None -> maximum
          else maximum)
        None existing
    in
    base ^ "-"
    ^ string_of_int (Option.fold ~none:1 ~some:(fun v -> v + 1) maximum)

let uniqueness_query =
  let open Datalog_form in
  vector_form
    [|
      keyword "find";
      vector_form [| symbol "?ident"; symbol "..." |];
      keyword "in";
      symbol "$";
      symbol "?ident-name";
      keyword "where";
      vector_form [| symbol "?b"; keyword "db/ident"; symbol "?ident" |];
      vector_form
        [| list_form [| symbol "str"; symbol "?ident" |]; symbol "?str-ident" |];
      vector_form
        [|
          list_form
            [|
              symbol "clojure.string/starts-with?";
              symbol "?str-ident";
              symbol "?ident-name";
            |];
        |];
    |]

let ensure_unique_with ~encode_form ~keyword_to_string ~keyword_from_string
    ~string_to_value ~collection_to_array ~entity_exists ~query ident =
  let base = keyword_to_string ident in
  let base_exists = entity_exists ident in
  let existing =
    if base_exists then
      query
        (encode_form uniqueness_query)
        [| string_to_value (":" ^ base ^ "-") |]
      |> collection_to_array
      |> Array.map keyword_to_string
      |> Rrbvec.of_array
    else Rrbvec.empty
  in
  ensure_unique ~base ~base_exists ~existing |> keyword_from_string
