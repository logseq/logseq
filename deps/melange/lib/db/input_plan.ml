type direction = Plus | Minus
type unit_ = Days | Weeks | Months | Years
type time_of_day = { hour : int; minute : int; second : int; millisecond : int }
type offset = { direction : direction; amount : int; unit_ : unit_ }

type t =
  | Current_page
  | Query_page
  | Current_block
  | Parent_block
  | Today
  | Yesterday
  | Tomorrow
  | Right_now_ms
  | Today_time of time_of_day
  | Relative_date of offset
  | Relative_date_time of offset * time_of_day
  | Invalid_relative_namespace of string
  | Invalid_relative_format
  | Unresolved

let start_of_day = { hour = 0; minute = 0; second = 0; millisecond = 0 }
let end_of_day = { hour = 23; minute = 59; second = 59; millisecond = 999 }
let is_digit character = character >= '0' && character <= '9'

let all_digits value start stop =
  let valid = ref (start < stop) in
  let index = ref start in
  while !valid && !index < stop do
    valid := is_digit value.[!index];
    index := !index + 1
  done;
  !valid

let direction_of_char = function
  | '+' -> Some Plus
  | '-' -> Some Minus
  | _ -> None

let unit_of_char = function
  | 'd' -> Some Days
  | 'w' -> Some Weeks
  | 'm' -> Some Months
  | 'y' -> Some Years
  | _ -> None

let valid_relative_namespace = function
  | None | Some "today" -> true
  | Some _ -> false

let invalid_namespace = function
  | Some namespace_ -> Invalid_relative_namespace namespace_
  | None -> Invalid_relative_format

let parse_amount value start stop =
  int_of_string (String.sub value start (stop - start))

let relative_date ~namespace_ name =
  let length = String.length name in
  if length < 2 then None
  else
    match direction_of_char name.[0] with
    | None -> None
    | Some direction -> (
        match unit_of_char name.[length - 1] with
        | Some unit_ when all_digits name 1 (length - 1) ->
            let result =
              if valid_relative_namespace namespace_ then
                Relative_date
                  {
                    direction;
                    amount = parse_amount name 1 (length - 1);
                    unit_;
                  }
              else invalid_namespace namespace_
            in
            Some result
        | None when all_digits name 1 length -> Some Invalid_relative_format
        | Some _ | None -> None)

let clock_time value =
  let padded = value ^ "000000000" in
  let number start length = int_of_string (String.sub padded start length) in
  {
    hour = min 23 (number 0 2);
    minute = min 59 (number 2 2);
    second = min 59 (number 4 2);
    millisecond = min 999 (number 6 3);
  }

let valid_clock_length length =
  length = 2 || length = 4 || length = 6 || length = 9

let time_of_suffix direction suffix =
  match suffix with
  | "ms" -> Some (if direction = Plus then end_of_day else start_of_day)
  | "start" -> Some start_of_day
  | "end" -> Some end_of_day
  | _
    when valid_clock_length (String.length suffix)
         && all_digits suffix 0 (String.length suffix) ->
      Some (clock_time suffix)
  | _ -> None

let relative_date_time ~namespace_ name =
  let length = String.length name in
  if length < 4 then None
  else
    match direction_of_char name.[0] with
    | None -> None
    | Some direction -> (
        let unit_index = ref 1 in
        while !unit_index < length && is_digit name.[!unit_index] do
          unit_index := !unit_index + 1
        done;
        if
          !unit_index = 1
          || !unit_index + 1 >= length
          || name.[!unit_index + 1] <> '-'
        then None
        else
          match unit_of_char name.[!unit_index] with
          | None -> None
          | Some unit_ ->
              let suffix =
                String.sub name (!unit_index + 2) (length - !unit_index - 2)
              in
              let dispatches =
                String.equal suffix "" || String.equal suffix "ms"
                || String.equal suffix "start"
                || String.equal suffix "end"
                || valid_clock_length (String.length suffix)
                   && all_digits suffix 0 (String.length suffix)
              in
              if not dispatches then None
              else if not (valid_relative_namespace namespace_) then
                Some (invalid_namespace namespace_)
              else
                let offset =
                  { direction; amount = parse_amount name 1 !unit_index; unit_ }
                in
                Some
                  (match time_of_suffix direction suffix with
                  | Some time -> Relative_date_time (offset, time)
                  | None -> Invalid_relative_format))

let starts_with ~prefix value =
  let prefix_length = String.length prefix in
  String.length value >= prefix_length
  && String.sub value 0 prefix_length = prefix

let today_time ~namespace_ name =
  if namespace_ = None && String.equal name "start-of-today-ms" then
    Some (Today_time start_of_day)
  else if namespace_ = None && String.equal name "end-of-today-ms" then
    Some (Today_time end_of_day)
  else if starts_with ~prefix:"today-" name then
    let suffix = String.sub name 6 (String.length name - 6) in
    if String.equal suffix "start" then Some (Today_time start_of_day)
    else if String.equal suffix "end" then Some (Today_time end_of_day)
    else if
      valid_clock_length (String.length suffix)
      && all_digits suffix 0 (String.length suffix)
    then Some (Today_time (clock_time suffix))
    else None
  else None

let deprecated_relative name =
  let length = String.length name in
  let digit_stop = ref 0 in
  while !digit_stop < length && is_digit name.[!digit_stop] do
    digit_stop := !digit_stop + 1
  done;
  if !digit_stop = 0 || !digit_stop >= length || name.[!digit_stop] <> 'd' then
    None
  else
    let suffix = String.sub name (!digit_stop + 1) (length - !digit_stop - 1) in
    let direction, milliseconds =
      match suffix with
      | "" | "-before" -> (Some Minus, false)
      | "-after" -> (Some Plus, false)
      | "-before-ms" -> (Some Minus, true)
      | "-after-ms" -> (Some Plus, true)
      | _ -> (None, false)
    in
    Option.map
      (fun direction ->
        let offset =
          { direction; amount = parse_amount name 0 !digit_stop; unit_ = Days }
        in
        if milliseconds then
          Relative_date_time
            (offset, if direction = Plus then end_of_day else start_of_day)
        else Relative_date offset)
      direction

let exact_input ~namespace_ name =
  if namespace_ <> None then None
  else
    match name with
    | "current-page" -> Some Current_page
    | "query-page" -> Some Query_page
    | "current-block" -> Some Current_block
    | "parent-block" -> Some Parent_block
    | "today" -> Some Today
    | "yesterday" -> Some Yesterday
    | "tomorrow" -> Some Tomorrow
    | "right-now-ms" -> Some Right_now_ms
    | _ -> None

let plan ~namespace_ ~name =
  match exact_input ~namespace_ name with
  | Some result -> result
  | None -> (
      match relative_date ~namespace_ name with
      | Some result -> result
      | None -> (
          match relative_date_time ~namespace_ name with
          | Some result -> result
          | None -> (
              match today_time ~namespace_ name with
              | Some result -> result
              | None ->
                  Option.value ~default:Unresolved (deprecated_relative name))))
