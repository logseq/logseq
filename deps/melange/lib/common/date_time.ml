let now_ms () = Js.Date.now ()
let is_leap_year year = year mod 400 = 0 || (year mod 4 = 0 && year mod 100 <> 0)

let days_in_month ~year = function
  | 0 | 2 | 4 | 6 | 7 | 9 | 11 -> 31
  | 3 | 5 | 8 | 10 -> 30
  | 1 -> if is_leap_year year then 29 else 28
  | _ -> invalid_arg "month must use the JavaScript zero-based range"

let subtract_months now_ms months =
  let date = Js.Date.fromFloat now_ms in
  let year = int_of_float (Js.Date.getUTCFullYear date) in
  let month = int_of_float (Js.Date.getUTCMonth date) in
  let day = int_of_float (Js.Date.getUTCDate date) in
  let target = (year * 12) + month - months in
  let target_year = target / 12 in
  let target_month = target mod 12 in
  let target_day = min day (days_in_month ~year:target_year target_month) in
  Js.Date.utc ~year:(float_of_int target_year)
    ~month:(float_of_int target_month)
    ~date:(float_of_int target_day) ~hours:(Js.Date.getUTCHours date)
    ~minutes:(Js.Date.getUTCMinutes date)
    ~seconds:(Js.Date.getUTCSeconds date)
    ()
  +. Js.Date.getUTCMilliseconds date

let relative_timestamp_ms ~now_ms = function
  | "1 day ago" -> Some (now_ms -. 86_400_000.)
  | "3 days ago" -> Some (now_ms -. 259_200_000.)
  | "1 week ago" -> Some (now_ms -. 604_800_000.)
  | "1 month ago" -> Some (subtract_months now_ms 1)
  | "3 months ago" -> Some (subtract_months now_ms 3)
  | "1 year ago" -> Some (subtract_months now_ms 12)
  | _ -> None

let journal_day_components_unchecked journal_day =
  let text = string_of_int journal_day in
  let length = String.length text in
  if length <> 7 && length <> 8 then invalid_arg "journal day must use YYYYMMDD"
  else
    let year = int_of_string (String.sub text 0 4) in
    let month = int_of_string (String.sub text 4 2) in
    let day = int_of_string (String.sub text 6 (length - 6)) in
    (year, month, day)

let journal_day_of_ms milliseconds =
  let date = Js.Date.fromFloat milliseconds in
  let year = int_of_float (Js.Date.getFullYear date) in
  let month = int_of_float (Js.Date.getMonth date) + 1 in
  let day = int_of_float (Js.Date.getDate date) in
  (year * 10000) + (month * 100) + day

let local_date_ms_of_journal_day journal_day =
  let year, month, day = journal_day_components_unchecked journal_day in
  Js.Date.make ~year:(float_of_int year)
    ~month:(float_of_int (month - 1))
    ~date:(float_of_int day) ()
  |> Js.Date.getTime

let journal_day_to_utc_ms journal_day =
  let year, month, day = journal_day_components_unchecked journal_day in
  match Melange_runtime.Date_time.of_ymd ~year ~month ~day with
  | Error message -> invalid_arg message
  | Ok _ ->
      Js.Date.utc ~year:(float_of_int year)
        ~month:(float_of_int (month - 1))
        ~date:(float_of_int day) ()

let default_journal_title_formatter = "MMM do, yyyy"

let japanese_journal_title_formatter =
  "yyyy"
  ^ Js.String.fromCodePointMany [| 0x5e74 |]
  ^ "MM"
  ^ Js.String.fromCodePointMany [| 0x6708 |]
  ^ "dd"
  ^ Js.String.fromCodePointMany [| 0x65e5 |]

let built_in_journal_title_formatters =
  [|
    "do MMM yyyy";
    "do MMMM yyyy";
    default_journal_title_formatter;
    "MMMM do, yyyy";
    "E, dd-MM-yyyy";
    "E, dd.MM.yyyy";
    "E, MM/dd/yyyy";
    "E, yyyy/MM/dd";
    "EEE, dd-MM-yyyy";
    "EEE, dd.MM.yyyy";
    "EEE, MM/dd/yyyy";
    "EEE, yyyy/MM/dd";
    "EEEE, dd-MM-yyyy";
    "EEEE, dd.MM.yyyy";
    "EEEE, MM/dd/yyyy";
    "EEEE, yyyy/MM/dd";
    "dd-MM-yyyy";
    "MM/dd/yyyy";
    "MM-dd-yyyy";
    "MM_dd_yyyy";
    "yyyy/MM/dd";
    "yyyy-MM-dd";
    "yyyy-MM-dd EEE";
    "yyyy-MM-dd EEEE";
    "yyyy_MM_dd";
    "yyyyMMdd";
    japanese_journal_title_formatter;
  |]
  |> Rrbvec.of_array

let slash_journal_title_formatters =
  Rrbvec.filter
    (fun formatter -> String.contains formatter '/')
    built_in_journal_title_formatters

let contains equal values value =
  let found = ref false in
  let index = ref 0 in
  while (not !found) && !index < Rrbvec.length values do
    found := equal (Rrbvec.nth values !index) value;
    index := !index + 1
  done;
  !found

let push_unique equal values value =
  if contains equal values value then values else Rrbvec.push_back values value

let journal_title_formatters custom_formatter =
  Rrbvec.fold_left
    (fun result formatter ->
      push_unique (Option.equal String.equal) result (Some formatter))
    (Rrbvec.singleton custom_formatter)
    built_in_journal_title_formatters

let safe_journal_title_formatters custom_formatter =
  [|
    custom_formatter;
    Some default_journal_title_formatter;
    Some "yyyy-MM-dd";
    Some "yyyy_MM_dd";
  |]
  |> Rrbvec.of_array
  |> Rrbvec.fold_left
       (fun result formatter ->
         match formatter with
         | Some formatter when String.trim formatter <> "" ->
             push_unique String.equal result formatter
         | Some _ | None -> result)
       Rrbvec.empty

type formatter_token =
  | Year of int
  | Month of int
  | Day of int
  | Ordinal_day
  | Weekday of int
  | Hour24 of int
  | Hour12 of int
  | Minute of int
  | Second of int
  | Fraction of int
  | Am_pm
  | Literal of string

let formatter_tokens formatter =
  let length = Js.String.length formatter in
  let tokens = ref Rrbvec.empty in
  let literal = ref "" in
  let flush_literal () =
    if not (String.equal !literal "") then (
      tokens := Rrbvec.push_back !tokens (Literal !literal);
      literal := "")
  in
  let append_literal value = literal := !literal ^ value in
  let character index = Js.String.get formatter index in
  let rec repeated_count value index =
    if index < length && String.equal (character index) value then
      repeated_count value (index + 1)
    else index
  in
  let is_ascii_letter value =
    let code = Js.String.charCodeAt ~index:0 value |> int_of_float in
    (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
  in
  let token value count =
    match value with
    | "y" | "Y" -> Year count
    | "M" -> Month count
    | "d" -> Day count
    | "E" -> Weekday count
    | "H" -> Hour24 count
    | "h" -> Hour12 count
    | "m" -> Minute count
    | "s" -> Second count
    | "S" -> Fraction count
    | "a" -> Am_pm
    | _ -> invalid_arg ("unsupported date formatter token: " ^ value)
  in
  let rec loop index quoted =
    if index >= length then (
      if quoted then invalid_arg "unterminated date formatter literal";
      flush_literal ();
      !tokens)
    else
      let current = character index in
      if String.equal current "'" then
        if index + 1 < length && String.equal (character (index + 1)) "'" then (
          append_literal "'";
          loop (index + 2) quoted)
        else loop (index + 1) (not quoted)
      else if quoted then (
        append_literal current;
        loop (index + 1) true)
      else if
        String.equal current "d"
        && index + 1 < length
        && String.equal (character (index + 1)) "o"
      then (
        flush_literal ();
        tokens := Rrbvec.push_back !tokens Ordinal_day;
        loop (index + 2) false)
      else if is_ascii_letter current then (
        let stop = repeated_count current (index + 1) in
        flush_literal ();
        tokens := Rrbvec.push_back !tokens (token current (stop - index));
        loop stop false)
      else (
        append_literal current;
        loop (index + 1) false)
  in
  loop 0 false

let short_month_names =
  [|
    "Jan";
    "Feb";
    "Mar";
    "Apr";
    "May";
    "Jun";
    "Jul";
    "Aug";
    "Sep";
    "Oct";
    "Nov";
    "Dec";
  |]

let long_month_names =
  [|
    "January";
    "February";
    "March";
    "April";
    "May";
    "June";
    "July";
    "August";
    "September";
    "October";
    "November";
    "December";
  |]

let short_weekday_names = [| "Sun"; "Mon"; "Tue"; "Wed"; "Thu"; "Fri"; "Sat" |]

let long_weekday_names =
  [|
    "Sunday"; "Monday"; "Tuesday"; "Wednesday"; "Thursday"; "Friday"; "Saturday";
  |]

let zero_pad width value =
  let text = string_of_int value in
  let padding = max 0 (width - String.length text) in
  String.make padding '0' ^ text

let ordinal value =
  let suffix =
    if value mod 100 >= 11 && value mod 100 <= 13 then "th"
    else match value mod 10 with 1 -> "st" | 2 -> "nd" | 3 -> "rd" | _ -> "th"
  in
  string_of_int value ^ suffix

let weekday ~year ~month ~day =
  let offsets = [| 0; 3; 2; 5; 0; 3; 5; 1; 4; 6; 2; 4 |] in
  let adjusted_year = if month < 3 then year - 1 else year in
  (adjusted_year + (adjusted_year / 4) - (adjusted_year / 100)
 + (adjusted_year / 400)
  + offsets.(month - 1)
  + day)
  mod 7

let validate_date_time ~year ~month ~day ~hour ~minute ~second =
  (match Melange_runtime.Date_time.of_ymd ~year ~month ~day with
  | Ok _ -> ()
  | Error message -> invalid_arg message);
  if hour < 0 || hour > 23 then invalid_arg "hour must be between 0 and 23";
  if minute < 0 || minute > 59 then
    invalid_arg "minute must be between 0 and 59";
  if second < 0 || second > 59 then
    invalid_arg "second must be between 0 and 59"

let format_date_time ~year ~month ~day ~hour ~minute ~second ~formatter =
  validate_date_time ~year ~month ~day ~hour ~minute ~second;
  let weekday = weekday ~year ~month ~day in
  let render = function
    | Year count ->
        if count = 2 then zero_pad 2 (year mod 100) else zero_pad count year
    | Month count ->
        if count = 1 then string_of_int month
        else if count = 2 then zero_pad 2 month
        else if count = 3 then short_month_names.(month - 1)
        else long_month_names.(month - 1)
    | Day count -> if count = 1 then string_of_int day else zero_pad count day
    | Ordinal_day -> ordinal day
    | Weekday count ->
        if count <= 3 then short_weekday_names.(weekday)
        else long_weekday_names.(weekday)
    | Hour24 count ->
        if count = 1 then string_of_int hour else zero_pad count hour
    | Hour12 count ->
        let value = match hour mod 12 with 0 -> 12 | value -> value in
        if count = 1 then string_of_int value else zero_pad count value
    | Minute count ->
        if count = 1 then string_of_int minute else zero_pad count minute
    | Second count ->
        if count = 1 then string_of_int second else zero_pad count second
    | Fraction count -> String.make count '0'
    | Am_pm -> if hour < 12 then "AM" else "PM"
    | Literal value -> value
  in
  formatter_tokens formatter
  |> Rrbvec.fold_left (fun result token -> result ^ render token) ""

let format_journal_day ~journal_day ~formatter =
  let year, month, day = journal_day_components_unchecked journal_day in
  format_date_time ~year ~month ~day ~hour:0 ~minute:0 ~second:0 ~formatter

type parsed_field =
  | Parsed_year
  | Parsed_month_number
  | Parsed_month_name
  | Parsed_day
  | Parsed_hour24
  | Parsed_hour12
  | Parsed_minute
  | Parsed_second

let escaped_regexp_literal value =
  let result = ref "" in
  for index = 0 to Js.String.length value - 1 do
    let character = Js.String.get value index in
    let escaped =
      match character with
      | "\\" | "^" | "$" | "." | "*" | "+" | "?" | "(" | ")" | "[" | "]" | "{"
      | "}" | "|" ->
          "\\" ^ character
      | _ -> character
    in
    result := !result ^ escaped
  done;
  !result

let month_name_pattern =
  "(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"

let weekday_pattern =
  "(?:Sun(?:day)?|Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?)"

let parser_regexp tokens =
  Rrbvec.fold_left
    (fun (pattern, fields) token ->
      match token with
      | Year _ -> (pattern ^ "([0-9]{1,9})", Rrbvec.push_back fields Parsed_year)
      | Month count when count <= 2 ->
          (pattern ^ "([0-9]{1,2})", Rrbvec.push_back fields Parsed_month_number)
      | Month _ ->
          ( pattern ^ month_name_pattern,
            Rrbvec.push_back fields Parsed_month_name )
      | Day _ -> (pattern ^ "([0-9]{1,2})", Rrbvec.push_back fields Parsed_day)
      | Ordinal_day ->
          ( pattern ^ "([0-9]{1,2})(?:st|nd|rd|th)",
            Rrbvec.push_back fields Parsed_day )
      | Weekday _ -> (pattern ^ weekday_pattern, fields)
      | Hour24 _ ->
          (pattern ^ "([0-9]{1,2})", Rrbvec.push_back fields Parsed_hour24)
      | Hour12 _ ->
          (pattern ^ "([0-9]{1,2})", Rrbvec.push_back fields Parsed_hour12)
      | Minute _ ->
          (pattern ^ "([0-9]{1,2})", Rrbvec.push_back fields Parsed_minute)
      | Second _ ->
          (pattern ^ "([0-9]{1,2})", Rrbvec.push_back fields Parsed_second)
      | Fraction _ -> (pattern ^ "(?:[0-9]+)", fields)
      | Am_pm -> (pattern ^ "(?:AM|PM|Am|Pm)", fields)
      | Literal value -> (pattern ^ escaped_regexp_literal value, fields))
    ("^", Rrbvec.empty) tokens
  |> fun (pattern, fields) -> (Js.Re.fromString (pattern ^ "$"), fields)

let month_of_name value =
  let result = ref None in
  let index = ref 0 in
  while Option.is_none !result && !index < Array.length short_month_names do
    if
      String.equal value short_month_names.(!index)
      || String.equal value long_month_names.(!index)
    then result := Some (!index + 1);
    index := !index + 1
  done;
  !result

let normalized_parsed_year value =
  if value >= 100 then value
  else
    let current_year = Js.Date.make () |> Js.Date.getFullYear |> int_of_float in
    let lower_bound = current_year - 80 in
    let century_candidate = (lower_bound / 100 * 100) + value in
    if century_candidate < lower_bound then century_candidate + 100
    else century_candidate

let parse_with_formatter ~title formatter =
  let regexp, fields = formatter |> formatter_tokens |> parser_regexp in
  match Js.Re.exec ~str:title regexp with
  | None -> None
  | Some result -> (
      let captures = Js.Re.captures result in
      let year = ref None in
      let month = ref None in
      let day = ref None in
      let hour24 = ref None in
      let hour12 = ref None in
      let minute = ref None in
      let second = ref None in
      let valid = ref true in
      for index = 0 to Rrbvec.length fields - 1 do
        let captured = captures.(index + 1) |> Js.Nullable.toOption in
        match captured with
        | None -> valid := false
        | Some captured -> (
            match Rrbvec.nth fields index with
            | Parsed_year -> year := Some (int_of_string captured)
            | Parsed_month_number -> month := Some (int_of_string captured)
            | Parsed_month_name -> month := month_of_name captured
            | Parsed_day -> day := Some (int_of_string captured)
            | Parsed_hour24 -> hour24 := Some (int_of_string captured)
            | Parsed_hour12 -> hour12 := Some (int_of_string captured)
            | Parsed_minute -> minute := Some (int_of_string captured)
            | Parsed_second -> second := Some (int_of_string captured))
      done;
      if not !valid then None
      else
        match (!year, !month, !day) with
        | Some year, Some month, Some day ->
            let year = normalized_parsed_year year in
            let valid_hour24 =
              Option.fold ~none:true
                ~some:(fun value -> value >= 0 && value <= 23)
                !hour24
            in
            let valid_hour12 =
              Option.fold ~none:true
                ~some:(fun value -> value >= 1 && value <= 12)
                !hour12
            in
            let valid_minute =
              Option.fold ~none:true
                ~some:(fun value -> value >= 0 && value <= 59)
                !minute
            in
            let valid_second =
              Option.fold ~none:true
                ~some:(fun value -> value >= 0 && value <= 59)
                !second
            in
            if valid_hour24 && valid_hour12 && valid_minute && valid_second then
              Melange_runtime.Date_time.of_ymd ~year ~month ~day
              |> Result.to_option
              |> Option.map Melange_runtime.Date_time.to_journal_day
            else None
        | _ -> None)

let parse_journal_title_day ~title ~formatters =
  let rec loop index =
    if index >= Rrbvec.length formatters then None
    else
      match Rrbvec.nth formatters index with
      | None -> loop (index + 1)
      | Some formatter -> (
          match parse_with_formatter ~title formatter with
          | Some _ as result -> result
          | None -> loop (index + 1)
          | exception _ -> loop (index + 1))
  in
  loop 0
