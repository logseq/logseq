let is_string value = Result.is_ok (Melange_runtime.Uuid.of_string value)

let journal_page journal_day =
  if journal_day < 10_000_000 || journal_day > 99_999_999 then
    invalid_arg "journal day must use eight digits"
  else
    let value = string_of_int journal_day in
    "00000001-" ^ String.sub value 0 4 ^ "-" ^ String.sub value 4 4
    ^ "-0000-000000000000"

let canonical_uuid value =
  match Melange_runtime.Uuid.of_string value with
  | Ok uuid -> Melange_runtime.Uuid.to_string uuid
  | Error message -> invalid_arg message

let journal_template ~journal_uuid ~template_block_uuid =
  let journal_uuid = canonical_uuid journal_uuid in
  let template_block_uuid = canonical_uuid template_block_uuid in
  "00000005-"
  ^ String.sub journal_uuid 9 14
  ^ String.sub template_block_uuid 23 13

let rotate_left value bits =
  Int32.logor
    (Int32.shift_left value bits)
    (Int32.shift_right_logical value (32 - bits))

let m3_mix_k1 value =
  value |> Int32.mul 0xcc9e2d51l |> fun value ->
  rotate_left value 15 |> fun value -> Int32.mul value 0x1b873593l

let m3_mix_h1 hash value =
  Int32.logxor hash value |> fun value ->
  rotate_left value 13 |> fun value ->
  Int32.add (Int32.mul value 5l) 0xe6546b64l

let m3_fmix hash length =
  Int32.logxor hash length |> fun hash ->
  Int32.logxor hash (Int32.shift_right_logical hash 16) |> fun hash ->
  Int32.mul hash 0x85ebca6bl |> fun hash ->
  Int32.logxor hash (Int32.shift_right_logical hash 13) |> fun hash ->
  Int32.mul hash 0xc2b2ae35l |> fun hash ->
  Int32.logxor hash (Int32.shift_right_logical hash 16)

let m3_hash_int value =
  if Int32.equal value 0l then 0l
  else m3_fmix (m3_mix_h1 0l (m3_mix_k1 value)) 4l

let char_code_at value index =
  Js.String.charCodeAt ~index value |> int_of_float |> Int32.of_int

let string_hash_code value =
  let hash = ref 0l in
  for index = 0 to Js.String.length value - 1 do
    hash := Int32.add (Int32.mul 31l !hash) (char_code_at value index)
  done;
  !hash

let m3_hash_unencoded_chars value =
  let length = Js.String.length value in
  let hash = ref 0l in
  let index = ref 1 in
  while !index < length do
    let pair =
      Int32.logor
        (char_code_at value (!index - 1))
        (Int32.shift_left (char_code_at value !index) 16)
    in
    hash := m3_mix_h1 !hash (m3_mix_k1 pair);
    index := !index + 2
  done;
  if length land 1 = 1 then
    hash := Int32.logxor !hash (m3_mix_k1 (char_code_at value (length - 1)));
  m3_fmix !hash (Int32.of_int (2 * length))

let hash_combine seed hash =
  Int32.logxor seed
    (Int32.add hash
       (Int32.add 0x9e3779b9l
          (Int32.add (Int32.shift_left seed 6) (Int32.shift_right seed 2))))

let keyword_hash ~namespace_ ~name =
  let symbol_hash =
    hash_combine
      (m3_hash_unencoded_chars name)
      (Option.fold ~none:0l ~some:string_hash_code namespace_)
  in
  Int32.add symbol_hash 0x9e3779b9l

let string_hash value = value |> string_hash_code |> m3_hash_int

let absolute_hash_text hash =
  let value = Int64.of_int32 hash in
  (if Int64.compare value 0L < 0 then Int64.neg value else value)
  |> Int64.to_string

let padded_substring value start_index end_index target_length =
  let value_length = String.length value in
  let start_index = min start_index value_length in
  let end_index = min end_index value_length in
  let part = String.sub value start_index (end_index - start_index) in
  part ^ String.make (target_length - String.length part) '0'

let hash_block prefix hash =
  let value = absolute_hash_text hash in
  prefix ^ "-"
  ^ padded_substring value 0 4 4
  ^ "-"
  ^ padded_substring value 4 8 4
  ^ "-"
  ^ padded_substring value 8 12 4
  ^ "-"
  ^ padded_substring value 12 (String.length value) 12

let db_ident_block ~namespace_ ~name =
  hash_block "00000002" (keyword_hash ~namespace_ ~name)

let builtin_block value = hash_block "00000004" (string_hash value)

let builtin_keyword_block ~namespace_ ~name =
  hash_block "00000004" (keyword_hash ~namespace_ ~name)

let view_block value = hash_block "00000006" (string_hash value)
