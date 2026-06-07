type span = float
type date = Js.Date.t

let finite value =
  match classify_float value with FP_nan | FP_infinite -> false | _ -> true

let invalid_time () = invalid_arg "invalid POSIX timestamp"
let invalid_span () = invalid_arg "invalid POSIX time span"

let time_of_epoch_ms_float ms =
  if finite ms then
    let time = Js.Date.fromFloat ms in
    if finite (Js.Date.getTime time) then time else invalid_time ()
  else invalid_time ()

let time_of_float_s seconds =
  if finite seconds then time_of_epoch_ms_float (seconds *. 1000.)
  else invalid_time ()

let now () = Js.Date.make ()
let epoch = time_of_epoch_ms_float 0.
let max_time = time_of_epoch_ms_float 8_640_000_000_000_000.
let time_of_epoch_ms ms = time_of_epoch_ms_float (Int64.to_float ms)
let time_to_epoch_ms time = Int64.of_float (Js.Date.getTime time)
let time_to_epoch_seconds time = Int64.of_float (Js.Date.getTime time /. 1000.)
let time_to_epoch_seconds_float time = Js.Date.getTime time /. 1000.

let compare_time left right =
  Float.compare (Js.Date.getTime left) (Js.Date.getTime right)

let span_of_ms ms =
  let span = Int64.to_float ms in
  if finite span then span else invalid_span ()

let span_to_ms span = Int64.of_float span
let span_to_ms_float span = span
let span_to_seconds_float span = span /. 1000.
let zero_span = 0.
let compare_span = Float.compare
let add_span_value left right = left +. right

let add_span time span =
  let ms = Js.Date.getTime time +. span in
  if finite ms then Some (Js.Date.fromFloat ms) else None

let local_date time =
  ( int_of_float (Js.Date.getFullYear time),
    int_of_float (Js.Date.getMonth time) + 1,
    int_of_float (Js.Date.getDate time) )

let utc_date_time time =
  ( int_of_float (Js.Date.getUTCFullYear time),
    int_of_float (Js.Date.getUTCMonth time) + 1,
    int_of_float (Js.Date.getUTCDate time),
    int_of_float (Js.Date.getUTCHours time),
    int_of_float (Js.Date.getUTCMinutes time),
    int_of_float (Js.Date.getUTCSeconds time) )

let non_negative_diff ~start_time ~end_time =
  max 0. (Js.Date.getTime end_time -. Js.Date.getTime start_time)

let avg_span span count =
  if count <= 0 then zero_span else span /. float_of_int count

let rfc3339_millis time = Js.Date.toISOString time

let valid_parsed_ms ms =
  try Some (time_of_epoch_ms_float ms) with Invalid_argument _ -> None

let parse_rfc3339 text =
  let valid_shape =
    String.length text >= 20
    && text.[4] = '-'
    && text.[7] = '-'
    && (text.[10] = 'T' || text.[10] = 't')
    && text.[13] = ':'
    && text.[16] = ':'
  in
  if valid_shape then valid_parsed_ms (Js.Date.parseAsFloat text) else None

let parse_date_as_utc text =
  if String.length text = 10 && text.[4] = '-' && text.[7] = '-' then
    parse_rfc3339 (text ^ "T00:00:00Z")
  else None

let parse_time text =
  let text = String.trim text in
  if text = "" then None
  else
    match parse_rfc3339 text with
    | Some _ as time -> time
    | None -> (
        match Int64.of_string_opt text with
        | Some ms -> Some (time_of_epoch_ms ms)
        | None -> parse_date_as_utc text)
