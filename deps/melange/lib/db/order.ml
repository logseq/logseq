let base_62_digits =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

let invalid message = invalid_arg ("DB fractional order: " ^ message)

let character_index digits character =
  match String.index_opt digits character with
  | Some index -> index
  | None -> invalid ("invalid digit " ^ String.make 1 character)

let integer_length head =
  if head >= 'a' && head <= 'z' then Char.code head - Char.code 'a' + 2
  else if head >= 'A' && head <= 'Z' then Char.code 'Z' - Char.code head + 2
  else invalid ("invalid order key head " ^ String.make 1 head)

let validate_integer value =
  if String.length value = 0 then invalid "empty integer part";
  if String.length value <> integer_length value.[0] then
    invalid ("invalid integer part " ^ value);
  String.iteri
    (fun index character ->
      if index > 0 then ignore (character_index base_62_digits character))
    value

let slice value start finish =
  if start >= 0 && finish > start && finish <= String.length value then
    String.sub value start (finish - start)
  else ""

let slice_from value start = slice value start (String.length value)

let integer_part key =
  if String.length key = 0 then invalid "empty order key";
  let length = integer_length key.[0] in
  if length > String.length key then invalid ("invalid order key " ^ key);
  let result = String.sub key 0 length in
  validate_integer result;
  result

let minimum_integer = "A" ^ String.make 26 base_62_digits.[0]

let validate_order_key key =
  if String.equal key minimum_integer then invalid ("invalid order key " ^ key);
  let integer = integer_part key in
  let fractional = slice_from key (String.length integer) in
  String.iter
    (fun character -> ignore (character_index base_62_digits character))
    fractional;
  if
    String.length fractional > 0
    && fractional.[String.length fractional - 1] = base_62_digits.[0]
  then invalid ("invalid order key " ^ key);
  true

let increment_integer value =
  validate_integer value;
  let payload = Bytes.of_string value in
  let carry = ref true in
  let index = ref (String.length value - 1) in
  while !carry && !index > 0 do
    let digit = character_index base_62_digits (Bytes.get payload !index) + 1 in
    if digit = String.length base_62_digits then
      Bytes.set payload !index base_62_digits.[0]
    else (
      Bytes.set payload !index base_62_digits.[digit];
      carry := false);
    decr index
  done;
  if not !carry then Some (Bytes.to_string payload)
  else
    match value.[0] with
    | 'Z' -> Some ("a" ^ String.make 1 base_62_digits.[0])
    | 'z' -> None
    | head ->
        let next_head = Char.chr (Char.code head + 1) in
        let digits = slice_from (Bytes.to_string payload) 1 in
        if next_head > 'a' then
          Some
            (String.make 1 next_head ^ digits ^ String.make 1 base_62_digits.[0])
        else
          Some
            (String.make 1 next_head
            ^ String.sub digits 0 (String.length digits - 1))

let decrement_integer value =
  validate_integer value;
  let payload = Bytes.of_string value in
  let borrow = ref true in
  let index = ref (String.length value - 1) in
  while !borrow && !index > 0 do
    let digit = character_index base_62_digits (Bytes.get payload !index) - 1 in
    if digit = -1 then
      Bytes.set payload !index base_62_digits.[String.length base_62_digits - 1]
    else (
      Bytes.set payload !index base_62_digits.[digit];
      borrow := false);
    decr index
  done;
  if not !borrow then Some (Bytes.to_string payload)
  else
    match value.[0] with
    | 'a' ->
        Some
          ("Z" ^ String.make 1 base_62_digits.[String.length base_62_digits - 1])
    | 'A' -> None
    | head ->
        let previous_head = Char.chr (Char.code head - 1) in
        let digits = slice_from (Bytes.to_string payload) 1 in
        if previous_head < 'Z' then
          Some
            (String.make 1 previous_head
            ^ digits
            ^ String.make 1 base_62_digits.[String.length base_62_digits - 1])
        else
          Some
            (String.make 1 previous_head
            ^ String.sub digits 0 (String.length digits - 1))

let last_is_zero value =
  String.length value > 0
  && value.[String.length value - 1] = base_62_digits.[0]

let first_difference left right =
  let result = ref None in
  let index = ref 0 in
  while !result = None && !index < String.length right do
    let left_character =
      if !index < String.length left then left.[!index] else base_62_digits.[0]
    in
    if left_character <> right.[!index] then result := Some !index;
    incr index
  done;
  !result

let rec midpoint left right =
  Option.iter
    (fun upper ->
      if String.compare left upper >= 0 then invalid (left ^ " >= " ^ upper))
    right;
  if last_is_zero left || Option.fold ~none:false ~some:last_is_zero right then
    invalid "trailing zero";
  match Option.bind right (first_difference left) with
  | Some index when index > 0 ->
      let upper = Option.get right in
      slice upper 0 index
      ^ midpoint (slice_from left index) (Some (slice_from upper index))
  | _ -> (
      let left_digit =
        if String.length left = 0 then 0
        else character_index base_62_digits left.[0]
      in
      let right_digit =
        match right with
        | None -> String.length base_62_digits
        | Some value when String.length value = 0 -> 0
        | Some value -> character_index base_62_digits value.[0]
      in
      if right_digit - left_digit > 1 then
        String.make 1 base_62_digits.[(left_digit + right_digit + 1) / 2]
      else
        match right with
        | Some value when String.length value > 1 -> String.sub value 0 1
        | _ ->
            String.make 1 base_62_digits.[left_digit]
            ^ midpoint (slice_from left 1) None)

let generate_key_between lower upper =
  Option.iter (fun value -> ignore (validate_order_key value)) lower;
  Option.iter (fun value -> ignore (validate_order_key value)) upper;
  (match (lower, upper) with
  | Some left, Some right when String.compare left right >= 0 ->
      invalid (left ^ " >= " ^ right)
  | _ -> ());
  let result =
    match (lower, upper) with
    | None, None -> "a" ^ String.make 1 base_62_digits.[0]
    | None, Some right -> (
        let integer = integer_part right in
        let fractional = slice_from right (String.length integer) in
        if String.compare integer right < 0 then
          integer ^ midpoint "" (Some fractional)
        else
          match decrement_integer integer with
          | Some value -> value
          | None -> invalid "cannot decrement any more")
    | Some left, None -> (
        let integer = integer_part left in
        let fractional = slice_from left (String.length integer) in
        match increment_integer integer with
        | Some value -> value
        | None -> integer ^ midpoint fractional None)
    | Some left, Some right -> (
        let left_integer = integer_part left in
        let left_fractional = slice_from left (String.length left_integer) in
        let right_integer = integer_part right in
        let right_fractional = slice_from right (String.length right_integer) in
        if String.equal left_integer right_integer then
          left_integer ^ midpoint left_fractional (Some right_fractional)
        else
          match increment_integer left_integer with
          | None -> invalid "cannot increment any more"
          | Some incremented ->
              if String.compare incremented right < 0 then incremented
              else left_integer ^ midpoint left_fractional None)
  in
  if
    Option.fold ~none:false
      ~some:(fun value -> String.compare value result >= 0)
      lower
    || Option.fold ~none:false
         ~some:(fun value -> String.compare result value >= 0)
         upper
  then invalid "generated key is outside its bounds";
  result

let rec generate_n_keys_between count lower upper =
  if count < 0 then invalid "key count must be nonnegative";
  if count = 0 then Rrbvec.empty
  else if count = 1 then Rrbvec.singleton (generate_key_between lower upper)
  else
    match (lower, upper) with
    | _, None ->
        let result = ref Rrbvec.empty in
        for _ = 1 to count do
          let current =
            Option.fold ~none:lower
              ~some:(fun value -> Some value)
              (Rrbvec.peek_back_opt !result)
          in
          result := Rrbvec.push_back !result (generate_key_between current None)
        done;
        !result
    | None, Some right ->
        let result = ref Rrbvec.empty in
        for _ = 1 to count do
          let current =
            Option.fold ~none:(Some right)
              ~some:(fun value -> Some value)
              (Rrbvec.peek_back_opt !result)
          in
          result := Rrbvec.push_back !result (generate_key_between None current)
        done;
        Rrbvec.rev !result
    | Some left, Some right ->
        let middle_count = count / 2 in
        let middle = generate_key_between (Some left) (Some right) in
        let left_values =
          generate_n_keys_between middle_count (Some left) (Some middle)
          |> fun values -> Rrbvec.push_back values middle
        in
        let right_values =
          generate_n_keys_between
            (count - middle_count - 1)
            (Some middle) (Some right)
        in
        Rrbvec.append left_values right_values

let advance_max_key current candidate =
  match (current, candidate) with
  | current, None -> current
  | None, Some value -> Some value
  | Some maximum, Some value ->
      if String.compare value maximum > 0 then Some value else current

let max_order_with ~nil_value ~keyword_from_string ~rseek_datoms ~datom_value =
  match
    rseek_datoms
      (keyword_from_string "avet")
      [| keyword_from_string "block/order" |]
  with
  | [||] -> nil_value
  | datoms -> datom_value datoms.(0)

type state = { mutable maximum : string option }

let create_state () = { maximum = None }
let state_maximum state = state.maximum
let reset_state state value = state.maximum <- value

let advance_state state candidate =
  state.maximum <- advance_max_key state.maximum candidate

let generate_tracked_key_between state lower upper =
  let lower = match lower with Some _ -> lower | None -> state.maximum in
  let key = generate_key_between lower upper in
  advance_state state (Some key);
  key

let generate_tracked_n_keys_between state count lower upper =
  let keys = generate_n_keys_between count lower upper in
  advance_state state (Rrbvec.peek_back_opt keys);
  keys

let default_state = create_state ()

let previous_order ~value_order ~candidates =
  candidates |> Rrbvec.rev
  |> Rrbvec.find_opt (fun candidate -> String.compare candidate value_order < 0)

let next_order ~value_order ~candidates =
  Rrbvec.find_opt
    (fun candidate -> String.compare candidate value_order > 0)
    candidates
