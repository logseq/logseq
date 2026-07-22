module Date_time = Melange_common.Date_time

let fail message =
  Fest.expect |> Fest.equal message "";
  failwith message

let expect_true label condition =
  if not condition then fail (label ^ ": expected true")

let expect_equal label actual expected =
  if actual <> expected then fail (label ^ ": unexpected value")

let expect_raises label f =
  match f () with
  | _ -> fail (label ^ ": expected an exception")
  | exception _ -> ()

let () =
  Fest.test "current milliseconds preserve JavaScript epoch clock behavior"
    (fun () ->
      let before = Js.Date.now () in
      let actual = Date_time.now_ms () in
      let after = Js.Date.now () in
      expect_true "bounded timestamp" (before <= actual && actual <= after);
      expect_true "integer milliseconds" (Float.floor actual = actual);
      expect_true "safe integer milliseconds" (actual < 9_007_199_254_740_991.));

  Fest.test "relative timestamp tokens preserve calendar subtraction" (fun () ->
      [|
        ("1 day ago", Some 1_706_572_800_000.);
        ("3 days ago", Some 1_706_400_000_000.);
        ("1 week ago", Some 1_706_054_400_000.);
        ("1 month ago", Some 1_703_980_800_000.);
        ("3 months ago", Some 1_698_710_400_000.);
        ("1 year ago", Some 1_675_123_200_000.);
        ("unknown", None);
      |]
      |> Array.iter (fun (token, expected) ->
          if
            Date_time.relative_timestamp_ms ~now_ms:1_706_659_200_000. token
            <> expected
          then fail (token ^ ": unexpected relative timestamp"));
      if
        Date_time.relative_timestamp_ms ~now_ms:1_711_843_200_000. "1 month ago"
        <> Some 1_709_164_800_000.
      then fail "month-end subtraction did not clamp to leap day");

  Fest.test "journal days preserve UTC storage and local calendar boundaries"
    (fun () ->
      let local_date = Js.Date.make ~year:2024. ~month:1. ~date:29. () in
      let local_ms = Js.Date.getTime local_date in
      expect_true "local journal day"
        (Date_time.journal_day_of_ms local_ms = 20240229);
      expect_true "local midnight round trip"
        (Date_time.journal_day_of_ms
           (Date_time.local_date_ms_of_journal_day 20240229)
        = 20240229);
      expect_true "UTC journal storage"
        (Date_time.journal_day_to_utc_ms 20240229 = 1_709_164_800_000.);
      expect_true "seven-digit January journal storage"
        (Date_time.journal_day_to_utc_ms 2024011 = 1_704_067_200_000.);
      expect_true "local date normalization"
        (Date_time.journal_day_of_ms
           (Date_time.local_date_ms_of_journal_day 20230229)
        = 20230301);
      expect_raises "invalid leap day" (fun () ->
          Date_time.journal_day_to_utc_ms 20230229);
      expect_raises "invalid month" (fun () ->
          Date_time.journal_day_to_utc_ms 20241301));

  Fest.test "journal formatter catalogs preserve order and selection" (fun () ->
      let japanese_formatter =
        "yyyy"
        ^ Js.String.fromCodePointMany [| 0x5e74 |]
        ^ "MM"
        ^ Js.String.fromCodePointMany [| 0x6708 |]
        ^ "dd"
        ^ Js.String.fromCodePointMany [| 0x65e5 |]
      in
      let built_in =
        [|
          "do MMM yyyy";
          "do MMMM yyyy";
          "MMM do, yyyy";
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
          japanese_formatter;
        |]
      in
      expect_equal "default formatter" Date_time.default_journal_title_formatter
        "MMM do, yyyy";
      expect_equal "built-in formatters"
        (Rrbvec.to_array Date_time.built_in_journal_title_formatters)
        built_in;
      expect_equal "slash formatters"
        (Rrbvec.to_array Date_time.slash_journal_title_formatters)
        [|
          "E, MM/dd/yyyy";
          "E, yyyy/MM/dd";
          "EEE, MM/dd/yyyy";
          "EEE, yyyy/MM/dd";
          "EEEE, MM/dd/yyyy";
          "EEEE, yyyy/MM/dd";
          "MM/dd/yyyy";
          "yyyy/MM/dd";
        |];
      expect_equal "missing custom formatter"
        (Rrbvec.to_array (Date_time.journal_title_formatters None))
        (Array.append [| None |] (Array.map Option.some built_in));
      expect_equal "duplicate custom formatter"
        (Rrbvec.to_array
           (Date_time.journal_title_formatters (Some "yyyy-MM-dd")))
        (Array.map Option.some
           (Array.append [| "yyyy-MM-dd" |]
              (Array.to_seq built_in
              |> Seq.filter (fun value -> value <> "yyyy-MM-dd")
              |> Array.of_seq)));
      expect_equal "custom formatter"
        (Rrbvec.to_array
           (Date_time.journal_title_formatters (Some "dd/MM/yyyy")))
        (Array.map Option.some (Array.append [| "dd/MM/yyyy" |] built_in));
      expect_equal "missing safe custom formatter"
        (Rrbvec.to_array (Date_time.safe_journal_title_formatters None))
        [| "MMM do, yyyy"; "yyyy-MM-dd"; "yyyy_MM_dd" |];
      expect_equal "blank safe custom formatter"
        (Rrbvec.to_array (Date_time.safe_journal_title_formatters (Some "  ")))
        [| "MMM do, yyyy"; "yyyy-MM-dd"; "yyyy_MM_dd" |];
      expect_equal "duplicate safe custom formatter"
        (Rrbvec.to_array
           (Date_time.safe_journal_title_formatters (Some "yyyy-MM-dd")))
        [| "yyyy-MM-dd"; "MMM do, yyyy"; "yyyy_MM_dd" |];
      expect_equal "custom safe formatter"
        (Rrbvec.to_array
           (Date_time.safe_journal_title_formatters (Some "dd/MM/yyyy")))
        [| "dd/MM/yyyy"; "MMM do, yyyy"; "yyyy-MM-dd"; "yyyy_MM_dd" |]);

  Fest.test "journal title parsing preserves lenient legacy fields" (fun () ->
      let parse title formatters =
        Date_time.parse_journal_title_day ~title
          ~formatters:(Array.map Option.some formatters |> Rrbvec.of_array)
      in
      let unicode_year = Js.String.fromCodePointMany [| 0x5e74 |] in
      let unicode_month = Js.String.fromCodePointMany [| 0x6708 |] in
      let unicode_day = Js.String.fromCodePointMany [| 0x65e5 |] in
      let unicode_formatter =
        "yyyy" ^ unicode_year ^ "MM" ^ unicode_month ^ "dd" ^ unicode_day
      in
      let unicode_title =
        "2026" ^ unicode_year ^ "04" ^ unicode_month ^ "05" ^ unicode_day
      in
      expect_equal "ISO title"
        (parse "2026-04-05" [| "yyyy-MM-dd" |])
        (Some 20260405);
      expect_equal "variable numeric widths"
        (parse "2026-4-5" [| "yyyy-MM-dd" |])
        (Some 20260405);
      expect_equal "proper-case month"
        (parse "Apr 5th, 2026" [| "MMM do, yyyy" |])
        (Some 20260405);
      expect_equal "raw lowercase remains case-sensitive"
        (parse "apr 5th, 2026" [| "MMM do, yyyy" |])
        None;
      expect_equal "Unicode title"
        (parse unicode_title [| unicode_formatter |])
        (Some 20260405);
      expect_equal "leap day"
        (parse "2024-02-29" [| "yyyy-MM-dd" |])
        (Some 20240229);
      [| "2023-02-29"; "2024-00-01"; "2024-13-01"; "2024-01-32" |]
      |> Array.iter (fun title ->
          expect_equal title (parse title [| "yyyy-MM-dd" |]) None);
      expect_equal "loose short year"
        (parse "3/4/5" [| "MM/dd/yyyy" |])
        (Some 20050304);
      expect_equal "weekday match"
        (parse "Sunday, 05-04-2026" [| "EEEE, dd-MM-yyyy" |])
        (Some 20260405);
      expect_equal "weekday mismatch is ignored"
        (parse "Monday, 05-04-2026" [| "EEEE, dd-MM-yyyy" |])
        (Some 20260405);
      expect_equal "ordinal suffix is not cross-validated"
        (parse "Apr 1th, 2026" [| "MMM do, yyyy" |])
        (Some 20260401);
      expect_equal "invalid ordinal text"
        (parse "Apr 1xx, 2026" [| "MMM do, yyyy" |])
        None;
      expect_equal "leading whitespace"
        (parse " 2026-04-05" [| "yyyy-MM-dd" |])
        None;
      expect_equal "trailing text" (parse "2026-04-05x" [| "yyyy-MM-dd" |]) None;
      expect_equal "blank title" (parse " " [| "yyyy-MM-dd" |]) None;
      expect_equal "missing formatter is skipped"
        (Date_time.parse_journal_title_day ~title:"2026-04-05"
           ~formatters:(Rrbvec.of_array [| None; Some "yyyy-MM-dd" |]))
        (Some 20260405);
      let current_year =
        Js.Date.make () |> Js.Date.getFullYear |> int_of_float
      in
      let low_year = current_year - 80 in
      let lower_suffix = low_year mod 100 in
      let preceding_suffix = (lower_suffix + 99) mod 100 in
      expect_equal "two-digit pivot lower bound"
        (parse (Printf.sprintf "%04d-01-02" lower_suffix) [| "yyyy-MM-dd" |])
        (Some ((low_year * 10000) + 102));
      expect_equal "two-digit pivot upper bound"
        (parse
           (Printf.sprintf "%04d-01-02" preceding_suffix)
           [| "yyyy-MM-dd" |])
        (Some (((low_year + 99) * 10000) + 102));
      expect_equal "three-digit year"
        (parse "0100-01-02" [| "yyyy-MM-dd" |])
        (Some 1000102));

  Fest.test "journal formatting preserves patterns and date components"
    (fun () ->
      let format_day formatter =
        Date_time.format_journal_day ~journal_day:20260405 ~formatter
      in
      [|
        ("do MMM yyyy", "5th Apr 2026");
        ("do MMMM yyyy", "5th April 2026");
        ("MMM do, yyyy", "Apr 5th, 2026");
        ("MMMM do, yyyy", "April 5th, 2026");
        ("E, dd-MM-yyyy", "Sun, 05-04-2026");
        ("EEE, dd.MM.yyyy", "Sun, 05.04.2026");
        ("EEEE, MM/dd/yyyy", "Sunday, 04/05/2026");
        ("yyyy-MM-dd EEE", "2026-04-05 Sun");
        ("yyyy-MM-dd EEEE", "2026-04-05 Sunday");
        ("yyyyMMdd", "20260405");
      |]
      |> Array.iter (fun (formatter, expected) ->
          expect_equal formatter (format_day formatter) expected);
      let unicode_formatter =
        "yyyy"
        ^ Js.String.fromCodePointMany [| 0x5e74 |]
        ^ "MM"
        ^ Js.String.fromCodePointMany [| 0x6708 |]
        ^ "dd"
        ^ Js.String.fromCodePointMany [| 0x65e5 |]
      in
      let unicode_expected =
        "2026"
        ^ Js.String.fromCodePointMany [| 0x5e74 |]
        ^ "04"
        ^ Js.String.fromCodePointMany [| 0x6708 |]
        ^ "05"
        ^ Js.String.fromCodePointMany [| 0x65e5 |]
      in
      expect_equal "Unicode formatting"
        (format_day unicode_formatter)
        unicode_expected;
      [|
        (1, "1st Apr 2026");
        (2, "2nd Apr 2026");
        (3, "3rd Apr 2026");
        (4, "4th Apr 2026");
        (11, "11th Apr 2026");
        (12, "12th Apr 2026");
        (13, "13th Apr 2026");
        (21, "21st Apr 2026");
        (22, "22nd Apr 2026");
        (23, "23rd Apr 2026");
      |]
      |> Array.iter (fun (day, expected) ->
          expect_equal (string_of_int day)
            (Date_time.format_journal_day ~journal_day:(20260400 + day)
               ~formatter:"do MMM yyyy")
            expected);
      expect_equal "seven-digit journal day"
        (Date_time.format_journal_day ~journal_day:1000102
           ~formatter:"yyyy-MM-dd")
        "1000-10-02";
      expect_equal "time formatting"
        (Date_time.format_date_time ~year:2026 ~month:4 ~day:5 ~hour:9 ~minute:7
           ~second:8 ~formatter:"MMM do, yyyy HH:mm")
        "Apr 5th, 2026 09:07";
      expect_equal "spring DST before"
        (Date_time.format_date_time ~year:2024 ~month:3 ~day:10 ~hour:1
           ~minute:30 ~second:0 ~formatter:"yyyy-MM-dd HH:mm:ss")
        "2024-03-10 01:30:00";
      expect_equal "spring DST after"
        (Date_time.format_date_time ~year:2024 ~month:3 ~day:10 ~hour:3
           ~minute:30 ~second:0 ~formatter:"yyyy-MM-dd HH:mm:ss")
        "2024-03-10 03:30:00";
      expect_equal "fall DST repeated component"
        (Date_time.format_date_time ~year:2024 ~month:11 ~day:3 ~hour:1
           ~minute:30 ~second:0 ~formatter:"yyyy-MM-dd HH:mm:ss")
        "2024-11-03 01:30:00";
      expect_raises "invalid journal day" (fun () ->
          Date_time.format_journal_day ~journal_day:20230229
            ~formatter:"yyyy-MM-dd");
      expect_raises "unsupported formatter" (fun () ->
          Date_time.format_journal_day ~journal_day:20260405 ~formatter:"yyyy Q"))
