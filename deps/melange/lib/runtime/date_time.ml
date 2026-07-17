type t = { year : int; month : int; day : int }

let is_leap_year year = year mod 400 = 0 || (year mod 4 = 0 && year mod 100 <> 0)

let days_in_month ~year = function
  | 1 | 3 | 5 | 7 | 8 | 10 | 12 -> Some 31
  | 4 | 6 | 9 | 11 -> Some 30
  | 2 -> Some (if is_leap_year year then 29 else 28)
  | _ -> None

let of_ymd ~year ~month ~day =
  if year < 1 || year > 9999 then Error "year must be between 1 and 9999"
  else
    match days_in_month ~year month with
    | None -> Error "month must be between 1 and 12"
    | Some maximum when day < 1 || day > maximum ->
        Error "day is outside the selected month"
    | Some _ -> Ok { year; month; day }

let of_journal_day value =
  if value < 10000101 || value > 99991231 then
    Error "journal day must use YYYYMMDD"
  else
    let year = value / 10000 in
    let month = value / 100 mod 100 in
    let day = value mod 100 in
    of_ymd ~year ~month ~day

let digits text start length =
  let stop = start + length in
  let rec loop index =
    index = stop
    || match text.[index] with '0' .. '9' -> loop (index + 1) | _ -> false
  in
  loop start

let of_iso_date value =
  if
    String.length value <> 10
    || value.[4] <> '-'
    || value.[7] <> '-'
    || not (digits value 0 4 && digits value 5 2 && digits value 8 2)
  then Error "date must use YYYY-MM-DD"
  else
    let year = int_of_string (String.sub value 0 4) in
    let month = int_of_string (String.sub value 5 2) in
    let day = int_of_string (String.sub value 8 2) in
    of_ymd ~year ~month ~day

let to_journal_day value =
  (value.year * 10000) + (value.month * 100) + value.day

let to_iso_date value =
  Printf.sprintf "%04d-%02d-%02d" value.year value.month value.day

let year value = value.year
let month value = value.month
let day value = value.day

let equal left right =
  left.year = right.year && left.month = right.month && left.day = right.day
