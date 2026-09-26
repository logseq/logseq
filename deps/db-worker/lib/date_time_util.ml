(* Faithful port of logseq.common.util.date-time plus the cljs-time /
   goog.date subset that logseq.db.frontend.inputs and the worker
   query-dsl rely on.

   All instants are epoch-milliseconds int64. Civil <-> epoch
   conversion goes through the Time platform module, which is
   local-timezone aware — matching cljs-time's goog.date DateTime
   arithmetic (JS Date getters/setters). *)

type period =
  | Days
  | Weeks
  | Months
  | Years
  | Hours
  | Minutes

let days_in_month year month =
  match month with
  | 1 | 3 | 5 | 7 | 8 | 10 | 12 -> 31
  | 4 | 6 | 9 | 11 -> 30
  | 2 ->
      if (year mod 4 = 0 && year mod 100 <> 0) || year mod 400 = 0 then 29 else 28
  | _ -> invalid_arg "month out of range"

let time_ms () = Time.epoch_ms_to_int64 (Time.now ())

let civil_of_ms (ms : int64) : Time.civil =
  Time.civil_of_epoch_ms (Time.local_tz ()) (Time.epoch_ms ms)

let ms_of_civil (c : Time.civil) : int64 =
  Time.epoch_ms_to_int64 (Time.epoch_ms_of_civil (Time.local_tz ()) c)

(* t/today — local midnight of today. *)
let today_ms () =
  let year, month, day, _, _, _, _ = Time.civil_fields (civil_of_ms (time_ms ())) in
  ms_of_civil (Time.civil ~year ~month ~day ~hour:0 ~minute:0 ~second:0 ~ms:0)

(* t/plus / t/minus. Day/week/hour/minute offsets shift the matching
   civil field and let Date normalization roll over (same as
   goog.date.DateTime.add — wall-clock arithmetic, DST-safe). Months
   and years go through month arithmetic with joda-style clamping of
   the day to the target month's length. *)
let shift (p : period) (n : int) (ms : int64) : int64 =
  let year, month, day, hour, minute, second, c_ms =
    Time.civil_fields (civil_of_ms ms)
  in
  match p with
  | Days ->
      ms_of_civil
        (Time.civil ~year ~month ~day:(day + n) ~hour ~minute ~second
           ~ms:c_ms)
  | Weeks ->
      ms_of_civil
        (Time.civil ~year ~month ~day:(day + (7 * n)) ~hour ~minute
           ~second ~ms:c_ms)
  | Hours ->
      ms_of_civil
        (Time.civil ~year ~month ~day ~hour:(hour + n) ~minute ~second
           ~ms:c_ms)
  | Minutes ->
      ms_of_civil
        (Time.civil ~year ~month ~day ~hour ~minute:(minute + n) ~second
           ~ms:c_ms)
  | Months | Years ->
      let delta = match p with Months -> n | Years -> n * 12 | _ -> 0 in
      let total = (year * 12) + (month - 1) + delta in
      let year' = total / 12 and m0 = total mod 12 in
      let year', m0 = if m0 < 0 then (year' - 1, m0 + 12) else (year', m0) in
      let month' = m0 + 1 in
      let day' = min day (days_in_month year' month') in
      ms_of_civil
        (Time.civil ~year:year' ~month:month' ~day:day' ~hour ~minute
           ~second ~ms:c_ms)

let plus p n ms = shift p n ms
let minus p n ms = shift p (-n) ms

(* common-date/date-at-local-ms:
   (.setHours (js/Date. date) hours mins secs millisecs) — returns epoch
   ms of the same local date with the given time fields. *)
let date_at_local_ms (date : int64) hours mins secs millisecs : int64 =
  let year, month, day, _, _, _, _ = Time.civil_fields (civil_of_ms date) in
  ms_of_civil
    (Time.civil ~year ~month ~day ~hour:hours ~minute:mins ~second:secs
       ~ms:millisecs)

(* date-time-util/date->int — yyyymmdd int of a date. *)
let date_to_int (ms : int64) : int =
  let year, month, day, _, _, _, _ = Time.civil_fields (civil_of_ms ms) in
  (year * 10000) + (month * 100) + day

(* int->local-date / journal-day->ms — local midnight of a yyyymmdd int. *)
let int_to_local_ms (day : int) : int64 =
  ms_of_civil
    (Time.civil ~year:(day / 10000) ~month:((day / 100) mod 100)
       ~day:(day mod 100) ~hour:0 ~minute:0 ~second:0 ~ms:0)

(* local midnight of a local_date in the date's own tz. *)
let local_date_start_ms (d : Time.local_date) : int64 =
  let year, month, day = Time.local_date_fields d in
  Time.epoch_ms_to_int64
    (Time.epoch_ms_of_civil (Time.local_date_tz d)
       (Time.civil ~year ~month ~day ~hour:0 ~minute:0 ~second:0 ~ms:0))

(* ---------- journal title parsing ----------

   common-util/capitalize-all *)
let capitalize_all (s : string) : string =
  String.split_on_char ' ' s
  |> List.map (fun w ->
         if w = "" then w
         else
           Unicode.uppercase (String.sub w 0 1)
           ^ Unicode.lowercase (String.sub w 1 (String.length w - 1)))
  |> String.concat " "

let month_short =
  [| "Jan"; "Feb"; "Mar"; "Apr"; "May"; "Jun"; "Jul"; "Aug"; "Sep"; "Oct";
     "Nov"; "Dec" |]

let month_long =
  [| "January"; "February"; "March"; "April"; "May"; "June"; "July";
     "August"; "September"; "October"; "November"; "December" |]

let weekday_names =
  [| "mon"; "tue"; "wed"; "thu"; "fri"; "sat"; "sun"; "monday"; "tuesday";
     "wednesday"; "thursday"; "friday"; "saturday"; "sunday" |]

(* common-date/built-in-journal-title-formatters *)
let built_in_journal_title_formatters =
  [ "do MMM yyyy"; "do MMMM yyyy"; "MMM do, yyyy"; "MMMM do, yyyy";
    "E, dd-MM-yyyy"; "E, dd.MM.yyyy"; "E, MM/dd/yyyy"; "E, yyyy/MM/dd";
    "EEE, dd-MM-yyyy"; "EEE, dd.MM.yyyy"; "EEE, MM/dd/yyyy";
    "EEE, yyyy/MM/dd"; "EEEE, dd-MM-yyyy"; "EEEE, dd.MM.yyyy";
    "EEEE, MM/dd/yyyy"; "EEEE, yyyy/MM/dd"; "dd-MM-yyyy"; "MM/dd/yyyy";
    "MM-dd-yyyy"; "MM_dd_yyyy"; "yyyy/MM/dd"; "yyyy-MM-dd";
    "yyyy-MM-dd EEE"; "yyyy-MM-dd EEEE"; "yyyy_MM_dd"; "yyyyMMdd";
    "yyyy\xE5\xB9\xB4MM\xE6\x9C\x88dd\xE6\x97\xA5" (* yyyy年MM月dd日 *) ]

(* common-date/journal-title-formatters — cljs (distinct (cons f
   built-in)) keeps the first occurrence, so f always leads even when it
   duplicates a built-in. *)
let journal_title_formatters (date_formatter : string option) : string list =
  match date_formatter with
  | None -> built_in_journal_title_formatters
  | Some f -> f :: List.filter (fun x -> x <> f) built_in_journal_title_formatters

(* ---- formatter lexer ---- *)

(* Token widths recorded for the inverse (format) direction:
   yy vs yyyy, MMM vs MMMM, E/EEE vs EEEE. *)
type tok =
  | TokYear of int
  | TokMonthNum
  | TokMonthName of int
  | TokDay
  | TokDayOrd
  | TokWeekday of int
  | TokLit of char

let tokens_of_formatter (fmt : string) : tok list =
  let n = String.length fmt in
  let try_at i t tok =
    let l = String.length t in
    if i + l <= n && String.sub fmt i l = t then Some (tok, i + l) else None
  in
  let rec lex i acc =
    if i >= n then List.rev acc
    else
      match
        List.find_map Fun.id
          [ try_at i "yyyy" (TokYear 4); try_at i "yy" (TokYear 2);
            try_at i "MMMM" (TokMonthName 4); try_at i "MMM" (TokMonthName 3);
            try_at i "MM" TokMonthNum; try_at i "dd" TokDay;
            try_at i "do" TokDayOrd; try_at i "EEEE" (TokWeekday 4);
            try_at i "EEE" (TokWeekday 3); try_at i "E" (TokWeekday 3) ]
      with
      | Some (t, i') -> lex i' (t :: acc)
      | None -> lex (i + 1) (TokLit fmt.[i] :: acc)
  in
  lex 0 []

let is_digit c = c >= '0' && c <= '9'

(* Backtracking matcher for a tokenized formatter. tf/parse equivalent:
   full-string match, numeric tokens consume greedily with backtracking,
   month names match case-insensitively, weekday names are consumed but
   ignored for the value. Returns (year, month, day). *)
let date_of_formatter (fmt : string) (s : string) : (int * int * int) option =
  let toks = tokens_of_formatter fmt in
  let n = String.length s in
  let ends_at i l = i + l <= n in
  let digit_len ?(max = 2) i =
    let rec count j = if j < n && j - i < max && is_digit s.[j] then count (j + 1) else j - i in
    count i
  in
  let num_at i l = int_of_string_opt (String.sub s i l) in
  let name_at i (names : string array) =
    Array.fold_left
      (fun best name ->
        let l = String.length name in
        if ends_at i l
           && Unicode.lowercase (String.sub s i l) = Unicode.lowercase name
        then match best with
             | Some (bl, _) when bl >= l -> best
             | _ -> Some (l, name)
        else best)
      None names
  in
  let rec go toks i (y, m, d) : (int * int * int) option =
    match toks with
    | [] -> if i = n then Some (y, m, d) else None
    | tok :: rest ->
        (match tok with
         | TokLit c ->
             if i < n && s.[i] = c then go rest (i + 1) (y, m, d) else None
         | TokYear _ ->
             try_num rest i (y, m, d) 8 (fun v (_, mm, dd) -> (v, mm, dd))
         | TokMonthNum ->
             try_num rest i (y, m, d) 2 (fun v (yy, _, dd) -> (yy, v, dd))
         | TokDay ->
             try_num rest i (y, m, d) 2 (fun v (yy, mm, _) -> (yy, mm, v))
         | TokDayOrd ->
             (* digits + ordinal suffix (st|nd|rd|th); plain digits also
                accepted — joda "do" is lenient on parse *)
             let l = digit_len i in
             if l = 0 then None
             else
               let v = num_at i l in
               let i' = i + l in
               let has_suffix =
                 ends_at i' 2
                 && (let suf = Unicode.lowercase (String.sub s i' 2) in
                     suf = "st" || suf = "nd" || suf = "rd" || suf = "th")
               in
               (match v with
                | Some v ->
                    (match go rest (if has_suffix then i' + 2 else i') (y, m, v) with
                     | Some r -> Some r
                     | None ->
                         if has_suffix then go rest i' (y, m, v) else None)
                | None -> None)
         | TokMonthName _ ->
             let index_of names name =
               let rec find j =
                 if j >= Array.length names then -1
                 else if Unicode.lowercase names.(j) = Unicode.lowercase name then j + 1
                 else find (j + 1)
               in
               find 0
             in
             let try_names names =
               match name_at i names with
               | Some (l, name) ->
                   let mi = index_of names name in
                   if mi < 0 then None else go rest (i + l) (y, mi, d)
               | None -> None
             in
             (match try_names month_long with
              | Some _ as r -> r
              | None -> try_names month_short)
         | TokWeekday _ ->
             (match name_at i weekday_names with
              | Some (l, _) -> go rest (i + l) (y, m, d)
              | None -> None))
  and try_num rest i (y, m, d) max_len f =
    let l = min (digit_len ~max:max_len i) max_len in
    if l = 0 then None
    else
      let rec attempt l =
        if l = 0 then None
        else
          match num_at i l with
          | Some v ->
              (match go rest (i + l) (f v (y, m, d)) with
               | Some r -> Some r
               | None -> attempt (l - 1))
          | None -> attempt (l - 1)
      in
      attempt l
  in
  match go toks 0 (0, 0, 0) with
  | Some (y, m, d) when m >= 1 && m <= 12 && d >= 1 && d <= days_in_month y m ->
      Some (y, m, d)
  | _ -> None

(* date-time-util/journal-title-> with then-fn = tc/to-long: local
   midnight ms of the parsed date, or None. *)
let parse_journal_title ?(formatters = built_in_journal_title_formatters)
    (title : string) : int64 option =
  if Unicode.trim title = "" then None
  else
    let title' = capitalize_all title in
    List.find_map
      (fun fmt ->
        match date_of_formatter fmt title' with
        | Some (year, month, day) ->
            Some
              (ms_of_civil
                 (Time.civil ~year ~month ~day ~hour:0 ~minute:0 ~second:0
                    ~ms:0))
        | None -> None)
      formatters

(* date-time-util/journal-title->int *)
let journal_title_to_int ?(formatters = built_in_journal_title_formatters)
    (title : string) : int option =
  match parse_journal_title ~formatters title with
  | Some ms -> Some (date_to_int ms)
  | None -> None

(* common-date/valid-journal-title? *)
let valid_journal_title ?(formatters = built_in_journal_title_formatters)
    (title : string) : bool =
  Option.is_some (parse_journal_title ~formatters title)

(* Days-from-civil (Howard Hinnant) — days since 1970-01-01 UTC. *)
let days_from_civil (y : int) (mo : int) (d : int) : int =
  let y' = if mo <= 2 then y - 1 else y in
  let era = (if y' >= 0 then y' else y' - 399) / 400 in
  let yoe = y' - (era * 400) in
  let doy = ((153 * (if mo > 2 then mo - 3 else mo + 9)) + 2) / 5 + d - 1 in
  let doe = (yoe * 365) + (yoe / 4) - (yoe / 100) + doy in
  (era * 146097) + doe - 719468

(* Inverse of the #inst writer: parse "YYYY-MM-DDTHH:MM:SS[.sss]Z"
   (UTC, timezone suffix ignored) back to epoch ms. Used to convert
   transit Date query literals — rare, but keeps wire fidelity. *)
let epoch_ms_of_iso (s : string) : int64 option =
  let parse_int a b =
    if b > a then
      try Some (int_of_string (String.sub s a (b - a))) with _ -> None
    else None
  in
  let digits a b = String.for_all (fun c -> c >= '0' && c <= '9') (String.sub s a (b - a)) in
  let n = String.length s in
  if n < 20 || s.[4] <> '-' || s.[7] <> '-' || s.[10] <> 'T' then None
  else if not (digits 0 4 && digits 5 7 && digits 8 10) then None
  else
    let rec find i c = if i >= n then None else if s.[i] = c then Some i else find (i + 1) c in
    let t = String.sub s 11 (min 8 (n - 11)) in
    if String.length t < 8 || t.[2] <> ':' || t.[5] <> ':' then None
    else
      match
        ( parse_int 0 4, parse_int 5 7, parse_int 8 10,
          parse_int 11 13, parse_int 14 16, parse_int 17 19 )
      with
      | Some y, Some mo, Some d, Some h, Some mi, Some sec ->
          let days = days_from_civil y mo d in
          let frac =
            match find 19 '.' with
            | Some dot ->
                let rec take i = if i < n && s.[i] >= '0' && s.[i] <= '9' then take (i + 1) else i in
                let stop = min (take (dot + 1)) (dot + 4) in
                if stop > dot + 1 then
                  int_of_string
                    (String.sub s (dot + 1) (stop - dot - 1)
                     ^ String.make (3 - (stop - dot - 1)) '0')
                else 0
            | None -> 0
          in
          (* offset suffix after the seconds/fraction: 'Z', or
             ±HH[:MM|MM] — cljs js/Date honors it *)
          let offset_min =
            let rec scan i =
              if i >= n then 0
              else
                match s.[i] with
                | 'Z' -> 0
                | '+' | '-' ->
                    let sign = if s.[i] = '-' then -1 else 1 in
                    let rec skip_digits j =
                      if j < n && s.[j] >= '0' && s.[j] <= '9' then
                        skip_digits (j + 1)
                      else j
                    in
                    let j1 = skip_digits (i + 1) in
                    let hh =
                      try int_of_string (String.sub s (i + 1) (j1 - i - 1))
                      with _ -> 0
                    in
                    let mm =
                      if j1 < n && s.[j1] = ':' then
                        let j2 = skip_digits (j1 + 1) in
                        try
                          int_of_string (String.sub s (j1 + 1) (j2 - j1 - 1))
                        with _ -> 0
                      else if j1 - i - 1 >= 4 then
                        (* +HHMM form: last two digits are minutes *)
                        hh mod 100
                      else 0
                    in
                    let hh = if j1 - i - 1 >= 4 then hh / 100 else hh in
                    sign * ((hh * 60) + mm)
                | _ -> scan (i + 1)
            in
            scan 19
          in
          Some
            (Int64.sub
               (Int64.add
                  (Int64.mul
                     (Int64.of_int
                        (((days * 86400) + (h * 3600) + (mi * 60) + sec)))
                     1000L)
                  (Int64.of_int frac))
               (Int64.of_int (offset_min * 60000)))
      | _ -> None

(* js/Date.parse — covers the formats V8 accepts: ISO
   "YYYY-MM-DD[ T]HH:MM[:SS[.fff]][Z|±HH:MM|±HHMM]" (date-only = UTC
   midnight; datetime without offset = local), "YYYY/MM/DD" and
   "MM/DD/YYYY" (local), and month-name forms "Jan 15 2024" /
   "15 Jan 2024" / "Mon, 15 Jan 2024 10:00:00 GMT". Pure numeric strings
   ("1704067200000") are NaN in V8 — they do not parse here. *)
let js_date_parse (s0 : string) : int64 option =
  let s = Unicode.trim s0 in
  let is_digit c = c >= '0' && c <= '9' in
  let all_digits s = s <> "" && String.for_all is_digit s in
  let month_names =
    [| "january"; "february"; "march"; "april"; "may"; "june"; "july"
     ; "august"; "september"; "october"; "november"; "december" |]
  in
  let month_of w =
    let w = String.lowercase_ascii w in
    let rec go i =
      if i >= 12 then None
      else if
        w = String.sub month_names.(i) 0 3 || w = month_names.(i)
      then Some (i + 1)
      else go (i + 1)
    in
    go 0
  in
  (* split a "HH:MM[:SS[.fff]]" time token, stripping an embedded tz
     suffix (Z/GMT.../±HH:MM) *)
  let time_and_tz (t : string) : (int64 * int option) option =
    let n = String.length t in
    let tz_start =
      let rec find i =
        if i >= n then n
        else
          match t.[i] with
          | 'Z' | '+' | '-' -> i
          | 'G' | 'U' when i > 0 && t.[i - 1] <> ':' -> i
          | _ -> find (i + 1)
      in
      find 0
    in
    let tz =
      if tz_start >= n then None
      else
        let tzs = String.sub t tz_start (n - tz_start) in
        let tzs =
          let l = String.lowercase_ascii tzs in
          if l = "gmt" || l = "utc" then "Z" else tzs
        in
        let tzs =
          let l = String.lowercase_ascii tzs in
          if
            String.length l > 3
            && (String.sub l 0 3 = "gmt" || String.sub l 0 3 = "utc")
          then String.sub tzs 3 (String.length tzs - 3)
          else tzs
        in
        (match tzs with
         | "Z" -> Some 0
         | _ when String.length tzs > 1 && (tzs.[0] = '+' || tzs.[0] = '-') ->
             let sign = if tzs.[0] = '-' then -1 else 1 in
             let body = String.sub tzs 1 (String.length tzs - 1) in
             let hh, mm =
               match String.split_on_char ':' body with
               | [ h; m ] ->
                   ((try int_of_string h with _ -> -1),
                    (try int_of_string m with _ -> -1))
               | [ h ] ->
                   let h = try int_of_string h with _ -> -1 in
                   if String.length body >= 4 then (h / 100, h mod 100)
                   else (h, 0)
               | _ -> (-1, -1)
             in
             if hh < 0 || mm < 0 || hh > 23 || mm > 59 then None
             else Some (sign * ((hh * 60) + mm))
         | _ -> None)
    in
    let tstr =
      let body = String.sub t 0 tz_start in
      if String.length body > 0 && not (is_digit body.[0]) then ""
      else body
    in
    match String.split_on_char ':' tstr with
    | [ h; m ] | [ h; m; _ ] when all_digits h && all_digits m ->
        let sec_str, frac =
          match String.split_on_char ':' tstr with
          | [ _; _; s' ] ->
              let dot = try String.index s' '.' with Not_found -> -1 in
              if dot >= 0 then
                ( String.sub s' 0 dot
                , String.sub s' (dot + 1) (String.length s' - dot - 1) )
              else (s', "")
          | _ -> ("", "")
        in
        let sec = if sec_str = "" then 0 else
          if all_digits sec_str then int_of_string sec_str else -1 in
        let frac_ms =
          if frac = "" then 0
          else if all_digits frac then
            let f = String.sub frac 0 (min 3 (String.length frac)) in
            int_of_string f
            * int_of_float (10. ** float_of_int (3 - String.length f))
          else -1
        in
        if sec < 0 || frac_ms < 0 then None
        else
          let h = int_of_string h and m = int_of_string m in
          if h > 24 || m > 59 || sec > 59 then None
          else
            Some
              ( Int64.of_int ((((h * 60) + m) * 60 + sec) * 1000 + frac_ms)
              , tz )
    | _ -> None
  in
  (* numeric date token "a-b-c"/"a/b/c" — year-first when a is 4 digits
     or > 31; otherwise US m/d/y. Returns (y, m, d, iso) where iso=true
     only for '-' separators (V8 treats slash dates as local). *)
  let date_fields (t : string) : (int * int * int * bool) option =
    let sep =
      if String.contains t '-' then '-'
      else if String.contains t '/' then '/'
      else ' '
    in
    if sep = ' ' then None
    else
      match String.split_on_char sep t with
      | [ a; b; c ] when all_digits a && all_digits b && all_digits c ->
          if String.length a >= 4 || int_of_string a > 31 then
            Some (int_of_string a, int_of_string b, int_of_string c,
                  sep = '-')
          else
            Some (int_of_string c, int_of_string a, int_of_string b,
                  false)
      | _ -> None
  in
  let tokens =
    String.split_on_char ' ' s
    |> List.filter (fun t -> t <> "")
    |> List.concat_map (fun t ->
           (* ISO 'T' separator sits between digits *)
           match String.index_opt t 'T' with
           | Some i
             when i > 0 && i < String.length t - 1
                  && is_digit t.[i - 1] && is_digit t.[i + 1] ->
               [ String.sub t 0 i
               ; String.sub t (i + 1) (String.length t - i - 1) ]
           | _ -> [ t ])
    |> List.filter (fun t -> t <> "")
    |> List.map (fun t ->
           if
             String.length t > 0
             && (t.[String.length t - 1] = ',')
           then String.sub t 0 (String.length t - 1)
           else t)
  in
  let tokens =
    (* drop a leading weekday name ("Mon," / "Monday") *)
    match tokens with
    | w :: rest
      when List.mem
             (String.lowercase_ascii
                (if String.length w > 3 then String.sub w 0 3 else w))
             [ "mon"; "tue"; "wed"; "thu"; "fri"; "sat"; "sun" ] -> rest
    | _ -> tokens
  in
  let year, month, day, iso_dash, time_ms, tz =
    List.fold_left
      (fun (y, mo, d, iso, t, tz) tok ->
        match date_fields tok with
        | Some (yy, mm, dd, iso') -> (Some yy, Some mm, Some dd, iso', t, tz)
        | None ->
            (match month_of tok with
             | Some mm -> (y, Some mm, d, iso, t, tz)
             | None ->
                 if String.contains tok ':' then
                   (match time_and_tz tok with
                    | Some (ms, tz') -> (y, mo, d, iso, Some ms, tz')
                    | None -> (y, mo, d, iso, t, tz))
                 else if all_digits tok then
                   let n = int_of_string tok in
                   if String.length tok >= 4 || n > 31 then
                     (Some n, mo, d, iso, t, tz)
                   else if d = None then (y, mo, Some n, iso, t, tz)
                   else (Some n, mo, d, iso, t, tz)
                 else
                   (* bare tz token *)
                   (match String.lowercase_ascii tok with
                    | "z" | "gmt" | "utc" -> (y, mo, d, iso, t, Some 0)
                    | _ -> (y, mo, d, iso, t, tz))))
      (None, None, None, false, None, None)
      tokens
  in
  match year, month, day with
  | Some y, Some mo, Some d ->
      (match tz, time_ms, iso_dash with
       | Some off, _, _ ->
           let utc_ms =
             Int64.add (Int64.mul (Int64.of_int (days_from_civil y mo d))
                          86400000L)
               (Option.value time_ms ~default:0L)
           in
           Some (Int64.sub utc_ms (Int64.of_int (off * 60000)))
       | None, None, true ->
           (* ISO date-only ("YYYY-MM-DD") is UTC midnight *)
           Some (Int64.mul (Int64.of_int (days_from_civil y mo d))
                  86400000L)
       | _ ->
           (* everything else without an offset is local time *)
           let ms = Option.value time_ms ~default:0L in
           Some
             (ms_of_civil
                (Time.civil ~year:y ~month:mo ~day:d
                   ~hour:(Int64.to_int (Int64.div ms 3600000L))
                   ~minute:
                     (Int64.to_int (Int64.div (Int64.rem ms 3600000L) 60000L))
                   ~second:
                     (Int64.to_int (Int64.div (Int64.rem ms 60000L) 1000L))
                   ~ms:(Int64.to_int (Int64.rem ms 1000L)))))
  | _ -> None

(* date-time-util/default-journal-title-formatter *)
let default_journal_title_formatter = "MMM do, yyyy"

(* date-time-util/safe-journal-title-formatters *)
let safe_journal_title_formatters (date_formatter : string option) : string list =
  let default = default_journal_title_formatter in
  [ (match date_formatter with Some f -> f | None -> "")
  ; default
  ; "yyyy-MM-dd"
  ; "yyyy_MM_dd" ]
  |> List.filter (fun s -> Unicode.trim s <> "")
  |> List.fold_left (fun acc f -> if List.mem f acc then acc else acc @ [ f ]) []

(* common-date/valid-journal-title-with-slash? — parses under a slash
   formatter (journal titles that legitimately contain "/") *)
let valid_journal_title_with_slash (title : string) : bool =
  List.exists
    (fun fmt ->
      Ns_util.str_contains fmt "/"
      && Option.is_some (date_of_formatter fmt (capitalize_all title)))
    built_in_journal_title_formatters

(* date-time-util/ms->journal-day — local date as yyyymmdd int. *)
let ms_to_journal_day (ms : int64) : int = date_to_int ms

(* ---------- journal title formatting ---------- *)

let ordinal_suffix d =
  if d >= 11 && d <= 13 then "th"
  else match d mod 10 with
       | 1 -> "st" | 2 -> "nd" | 3 -> "rd" | _ -> "th"

(* Zeller-congruence weekday index aligned with weekday_names:
   0 = Mon .. 6 = Sun. *)
let weekday_index (y, m, d) =
  let y', m' = if m < 3 then (y - 1, m + 12) else (y, m) in
  let k = y' mod 100 and j = y' / 100 in
  (* h: 0 = Saturday *)
  let h =
    (d + ((13 * (m' + 1)) / 5) + k + (k / 4) + (j / 4) + (5 * j)) mod 7
  in
  let h = ((h mod 7) + 7) mod 7 in
  (h + 5) mod 7

(* tf/format inverse of date_of_formatter for the tokenized
   journal-title formatters. *)
let formatter_of_date (fmt : string) (year, month, day : int * int * int)
    : string =
  let pad2 n = Printf.sprintf "%02d" n in
  let b = Buffer.create 32 in
  List.iter
    (fun tok ->
      match tok with
      | TokLit c -> Buffer.add_char b c
      | TokYear w ->
          if w = 2 then Buffer.add_string b (pad2 (year mod 100))
          else Buffer.add_string b (Printf.sprintf "%04d" year)
      | TokMonthNum -> Buffer.add_string b (pad2 month)
      | TokMonthName w ->
          Buffer.add_string
            b
            (if w = 4 then month_long.(month - 1)
             else month_short.(month - 1))
      | TokDay -> Buffer.add_string b (pad2 day)
      | TokDayOrd ->
          Buffer.add_string
            b
            (string_of_int day ^ ordinal_suffix day)
      | TokWeekday w ->
          let i = weekday_index (year, month, day) in
          let name =
            if w = 4 then weekday_names.(i + 7) else weekday_names.(i)
          in
          (* tf/format emits capitalized English weekday names *)
          Buffer.add_string b (String.capitalize_ascii name))
    (tokens_of_formatter fmt);
  Buffer.contents b

(* common-date/int->journal-title *)
let int_to_journal_title (day : int) (date_formatter : string) : string =
  formatter_of_date
    date_formatter
    (day / 10000, (day / 100) mod 100, day mod 100)
