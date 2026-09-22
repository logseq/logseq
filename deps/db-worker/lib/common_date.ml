(* Port of the journal-date parsing in logseq.common.date /
   logseq.common.util.date-time that the outliner validators reach
   (normalize-date, journal-title->int).

   cljs side parses with cljs-time (goog DateTimeFormat). This is a
   hand-written equivalent for the fixed token set used by the built-in
   formatters: yyyy MM dd do MMM MMMM E EEE EEEE plus literals. *)

type token =
  | Lit of string
  | F_year4
  | F_month2
  | F_day2
  | F_day_ord
  | F_month_abbr
  | F_month_full
  | F_wd_abbr
  | F_wd_full

type date = { y : int; m : int; d : int }

let month_short = Ldb.month_short
let month_long = Ldb.month_long

let weekday_short =
  [| "Sun"; "Mon"; "Tue"; "Wed"; "Thu"; "Fri"; "Sat" |]

let weekday_long =
  [| "Sunday"; "Monday"; "Tuesday"; "Wednesday"; "Thursday"; "Friday";
     "Saturday" |]

(* note: goog/cljs-time matches names case-insensitively in practice via
   capitalize-all on the input; we match case-insensitively too. *)
let starts_with_ci (s : string) (i : int) (prefix : string) : bool =
  let n = String.length prefix in
  i + n <= String.length s
  &&
  (let rec go j =
     j >= n
     || (Char.lowercase_ascii s.[i + j] = Char.lowercase_ascii prefix.[j]
         && go (j + 1))
   in
   go 0)

(* Tokenize a format string into literals and fields. *)
let tokens_of_format (fmt : string) : token list =
  let n = String.length fmt in
  let same i j c =
    i + (j - i) <= n
    &&
    (let rec go k = k >= j || (fmt.[k] = c && go (k + 1)) in
     go i)
  in
  let rec toks i acc =
    if i >= n then List.rev acc
    else
      let c = fmt.[i] in
      let run j = j < n && fmt.[j] = c in
      let rec runlen j = if run j then runlen (j + 1) else j - i in
      let len = runlen i in
      let tok =
        match c, len with
        | 'y', 4 -> Some F_year4
        | 'M', 2 -> Some F_month2
        | 'M', 3 -> Some F_month_abbr
        | 'M', 4 -> Some F_month_full
        | 'd', 2 -> Some F_day2
        | 'd', 1 when same (i + 1) (i + 2) 'o' -> Some F_day_ord
        | 'E', l when l <= 3 -> Some F_wd_abbr
        | 'E', _ -> Some F_wd_full
        | _ -> None
      in
      match tok with
      | Some F_day_ord ->
          (* consumes "do" (2 chars) *)
          toks (i + 2) (F_day_ord :: acc)
      | Some t -> toks (i + len) (t :: acc)
      | None ->
          (* accumulate a literal run up to the next field char *)
          let rec lit_end j =
            if j >= n then j
            else if fmt.[j] = 'y' || fmt.[j] = 'M' || fmt.[j] = 'd' || fmt.[j] = 'E'
            then j
            else lit_end (j + 1)
          in
          let j = lit_end i in
          toks j (Lit (String.sub fmt i (j - i)) :: acc)
  in
  toks 0 []

let is_digit c = c >= '0' && c <= '9'

let digits_n (s : string) (i : int) (n : int) : int option =
  if i + n <= String.length s then
    let rec go j =
      if j >= n then Some (int_of_string (String.sub s i n))
      else if is_digit s.[i + j] then go (j + 1)
      else None
    in
    go 0
  else None

(* Match tokens against input; returns (y,m,d) on a full match. *)
let parse_tokens (toks : token list) (s : string) : date option =
  let n = String.length s in
  let rec go toks i y m d =
    match toks with
    | [] -> if i = n then Some { y; m; d } else None
    | Lit lit :: rest ->
        if i + String.length lit <= n
           && String.sub s i (String.length lit) = lit
        then go rest (i + String.length lit) y m d
        else None
    | F_year4 :: rest ->
        (match digits_n s i 4 with
         | Some v -> go rest (i + 4) v m d
         | None -> None)
    | F_month2 :: rest ->
        (match digits_n s i 2 with
         | Some v when v >= 1 && v <= 12 -> go rest (i + 2) y v d
         | _ -> None)
    | F_day2 :: rest ->
        (match digits_n s i 2 with
         | Some v when v >= 1 && v <= 31 -> go rest (i + 2) y m v
         | _ -> None)
    | F_day_ord :: rest ->
        let rec digits j =
          if i + j < n && is_digit s.[i + j] then digits (j + 1) else j
        in
        let dl = digits 0 in
        if dl = 0 || dl > 2 then None
        else
          let day = int_of_string (String.sub s i dl) in
          let suffixes = [ "st"; "nd"; "rd"; "th" ] in
          (match
             List.find_opt (fun suf -> starts_with_ci s (i + dl) suf) suffixes
           with
           | Some _ when day >= 1 && day <= 31 ->
               go rest (i + dl + 2) y m day
           | _ -> None)
    | F_month_abbr :: rest ->
        let rec find j =
          if j >= 12 then None
          else if starts_with_ci s i month_short.(j) then Some j
          else find (j + 1)
        in
        (match find 0 with
         | Some j -> go rest (i + 3) y (j + 1) d
         | None -> None)
    | F_month_full :: rest ->
        let rec find j =
          if j >= 12 then None
          else if starts_with_ci s i month_long.(j) then Some j
          else find (j + 1)
        in
        (match find 0 with
         | Some j -> go rest (i + String.length month_long.(j)) y (j + 1) d
         | None -> None)
    | F_wd_abbr :: rest ->
        let rec find j =
          if j >= 7 then None
          else if starts_with_ci s i weekday_short.(j) then Some j
          else find (j + 1)
        in
        (match find 0 with
         | Some _ -> go rest (i + 3) y m d
         | None -> None)
    | F_wd_full :: rest ->
        let rec find j =
          if j >= 7 then None
          else if starts_with_ci s i weekday_long.(j) then Some j
          else find (j + 1)
        in
        (match find 0 with
         | Some j -> go rest (i + String.length weekday_long.(j)) y m d
         | None -> None)
  in
  go toks 0 0 0 0

(* common-date/built-in-journal-title-formatters (date.cljs 10-36) *)
let built_in_journal_title_formatters =
  [ "do MMM yyyy"; "do MMMM yyyy"; "MMM do, yyyy"; "MMMM do, yyyy";
    "E, dd-MM-yyyy"; "E, dd.MM.yyyy"; "E, MM/dd/yyyy"; "E, yyyy/MM/dd";
    "EEE, dd-MM-yyyy"; "EEE, dd.MM.yyyy"; "EEE, MM/dd/yyyy"; "EEE, yyyy/MM/dd";
    "EEEE, dd-MM-yyyy"; "EEEE, dd.MM.yyyy"; "EEEE, MM/dd/yyyy";
    "EEEE, yyyy/MM/dd"; "dd-MM-yyyy"; "MM/dd/yyyy"; "MM-dd-yyyy";
    "MM_dd_yyyy"; "yyyy/MM/dd"; "yyyy-MM-dd"; "yyyy-MM-dd EEE";
    "yyyy-MM-dd EEEE"; "yyyy_MM_dd"; "yyyyMMdd";
    "yyyy年MM月dd日" ]

(* common-date/journal-title-formatters *)
let journal_title_formatters (date_formatter : string option) : string list =
  let fs =
    match date_formatter with
    | Some f -> f :: built_in_journal_title_formatters
    | None -> built_in_journal_title_formatters
  in
  List.sort_uniq String.compare fs

(* common-util/capitalize-all *)
let capitalize_all (s : string) : string =
  String.split_on_char ' ' s
  |> List.map
       (fun w ->
          if String.length w = 0 then w
          else
            String.make 1 (Char.uppercase_ascii w.[0])
            ^ String.lowercase_ascii (String.sub w 1 (String.length w - 1)))
  |> String.concat " "

(* common-date/normalize-date — try each formatter on the capitalized
   title; truthy when one fully parses. *)
let normalize_date (s : string) (date_formatter : string option) : bool =
  let input = capitalize_all s in
  journal_title_formatters date_formatter
  |> List.exists
       (fun fmt ->
          match parse_tokens (tokens_of_format fmt) input with
          | Some _ -> true
          | None -> false)

(* date-time/default-journal-title-formatter *)
let default_journal_title_formatter = "MMM do, yyyy"

(* date-time/safe-journal-title-formatters *)
let safe_journal_title_formatters (date_formatter : string option) : string list =
  [ (match date_formatter with Some f -> f | None -> "");
    default_journal_title_formatter; "yyyy-MM-dd"; "yyyy_MM_dd" ]
  |> List.filter (fun f -> String.trim f <> "")
  |> List.sort_uniq String.compare

(* date-time/journal-title->int — first safe formatter that parses the
   capitalized title, rendered as a yyyyMMdd int. *)
let journal_title_to_int (journal_title : string option)
    (formatters : string list) : int option =
  match journal_title with
  | None -> None
  | Some title ->
      if String.trim title = "" then None
      else
        let input = capitalize_all title in
        List.find_map
          (fun fmt ->
             match parse_tokens (tokens_of_format fmt) input with
             | Some d -> Some ((d.y * 10000) + (d.m * 100) + d.d)
             | None -> None)
          formatters

(* date-time/int->journal-title — same engine as
   Ldb.journal_title_of_day. *)
let int_to_journal_title (day : int) (date_formatter : string) : string =
  Ldb.journal_title_of_day day date_formatter

(* date-time/journal-title-> — convenience: safe formatters for a
   configured formatter. *)
let journal_title_to_int_safe (journal_title : string)
    (date_formatter : string option) : int option =
  journal_title_to_int (Some journal_title)
    (safe_journal_title_formatters date_formatter)
