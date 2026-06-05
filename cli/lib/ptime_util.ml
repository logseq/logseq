let time_of_float_s seconds =
  match Ptime.of_float_s seconds with
  | Some time -> time
  | None -> invalid_arg "invalid POSIX timestamp"

let now = Ptime_clock.now
let time_of_epoch_ms ms = time_of_float_s (Int64.to_float ms /. 1000.)
let time_to_epoch_ms time = Int64.of_float (Ptime.to_float_s time *. 1000.)
let time_to_epoch_seconds time = Int64.of_float (Ptime.to_float_s time)

let span_of_ms ms =
  match Ptime.Span.of_float_s (Int64.to_float ms /. 1000.) with
  | Some span -> span
  | None -> invalid_arg "invalid POSIX time span"

let span_to_ms span = Int64.of_float (Ptime.Span.to_float_s span *. 1000.)
let span_to_ms_float span = Ptime.Span.to_float_s span *. 1000.
let span_to_seconds_float = Ptime.Span.to_float_s

let local_date time =
  match Ptime_clock.current_tz_offset_s () with
  | Some tz_offset_s ->
      let (year, month, day), _ = Ptime.to_date_time ~tz_offset_s time in
      (year, month, day)
  | None -> invalid_arg "local time zone offset is unavailable"

let non_negative_diff ~start_time ~end_time =
  let span = Ptime.diff end_time start_time in
  if Ptime.Span.compare span Ptime.Span.zero < 0 then Ptime.Span.zero else span

let avg_span span count =
  if count <= 0 then Ptime.Span.zero
  else
    match
      Ptime.Span.of_float_s (Ptime.Span.to_float_s span /. float_of_int count)
    with
    | Some span -> span
    | None -> Ptime.Span.zero

let rfc3339_millis time = Ptime.to_rfc3339 ~frac_s:3 ~tz_offset_s:0 time

let parse_rfc3339 text =
  match Ptime.of_rfc3339 text with
  | Ok (time, _, _) -> Some time
  | Error _ -> None

let parse_date_as_utc text =
  if String.length text = 10 then parse_rfc3339 (text ^ "T00:00:00Z") else None

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
