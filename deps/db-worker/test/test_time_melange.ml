(* Tests for the Time platform spec (spec/platform/time.mli),
   melange/node target backed by js/Date + performance.now.

   Mirrors test/native/test_time_native.ml — same test names in the same
   order — so any divergence between the Js.Date-backed and
   Unix/arithmetic-backed implementations is caught here.

   Determinism: every case uses fixed instants and fixed-offset
   timezones; the only zone-relative cases go through [local_tz] and are
   written to hold in any timezone. *)

let ok (b : bool) = Fest.expect |> Fest.ok b
let int64_eq (a : int64) (b : int64) = Fest.expect |> Fest.ok (Int64.equal a b)
let string_eq (a : string) (b : string) = Fest.expect |> Fest.equal a b
let int_eq (a : int) (b : int) = Fest.expect |> Fest.equal a b

let epoch_ms_to_int64' e = Time.epoch_ms_to_int64 e

let fields_eq actual expected =
  ok (Time.civil_fields actual = expected)

let epoch_civil_roundtrip tz ms =
  let e = Time.epoch_ms ms in
  int64_eq
    (epoch_ms_to_int64'
       (Time.epoch_ms_of_civil tz (Time.civil_of_epoch_ms tz e)))
    ms

(* ---- shared fixtures ---- *)

let instants : (string * int64) list =
  [ ("epoch", 0L)
  ; ("pre-epoch", -86400001L) (* 1969-12-30T23:59:59.999Z *)
  ; ("2023-11-14", 1700000000000L)
  ; ("leap-2024-02-29", 1709210096789L) (* 2024-02-29T12:34:56.789Z *)
  ]

let expected_utc_fields : (int64 * (int * int * int * int * int * int * int)) list =
  [ (0L, (1970, 1, 1, 0, 0, 0, 0))
  ; (-86400001L, (1969, 12, 30, 23, 59, 59, 999))
  ; (1700000000000L, (2023, 11, 14, 22, 13, 20, 0))
  ; (1709210096789L, (2024, 2, 29, 12, 34, 56, 789))
  ]

let offset_tzs : (string * Time.tz) list =
  [ ("utc", Time.utc)
  ; ("utc+480", Time.tz_of_offset_minutes 480)
  ; ("utc-300", Time.tz_of_offset_minutes (-300))
  ; ("utc+0", Time.tz_of_offset_minutes 0)
  ]

(* ---- tests ---- *)

let () =
  Fest.test "epoch-ms-basics-test" (fun () ->
      int64_eq (epoch_ms_to_int64' (Time.epoch_ms 42L)) 42L;
      int64_eq (epoch_ms_to_int64' (Time.epoch_ms 0L)) 0L;
      int64_eq (epoch_ms_to_int64' (Time.epoch_ms (-1000L))) (-1000L);
      int64_eq
        (epoch_ms_to_int64' (Time.epoch_ms_of_float 1700000000123.))
        1700000000123L;
      ok
        (Time.epoch_ms_to_float (Time.epoch_ms 1700000000123L)
         = 1700000000123.);
      ok (Time.compare_epoch_ms (Time.epoch_ms 1L) (Time.epoch_ms 2L) < 0);
      ok (Time.compare_epoch_ms (Time.epoch_ms 2L) (Time.epoch_ms 1L) > 0);
      ok (Time.compare_epoch_ms (Time.epoch_ms 1L) (Time.epoch_ms 1L) = 0));

  Fest.test "epoch-civil-roundtrip-test" (fun () ->
      List.iter
        (fun (_instant_name, ms) ->
          List.iter
            (fun (_tz_name, tz) -> epoch_civil_roundtrip tz ms)
            offset_tzs)
        instants;
      List.iter
        (fun (ms, expected) ->
          fields_eq (Time.civil_of_epoch_ms Time.utc (Time.epoch_ms ms)) expected)
        expected_utc_fields;
      fields_eq
        (Time.civil_of_epoch_ms (Time.tz_of_offset_minutes 480)
           (Time.epoch_ms 1700000000000L))
        (2023, 11, 15, 6, 13, 20, 0);
      fields_eq
        (Time.civil_of_epoch_ms (Time.tz_of_offset_minutes (-300))
           (Time.epoch_ms 1700000000000L))
        (2023, 11, 14, 17, 13, 20, 0);
      fields_eq
        (Time.civil_of_epoch_ms (Time.tz_of_offset_minutes 480)
           (Time.epoch_ms 0L))
        (1970, 1, 1, 8, 0, 0, 0));

  Fest.test "epoch-ms-of-civil-rollover-test" (fun () ->
      (* Expected values computed independently from js/Date-setter
         semantics (Date.UTC): month spills into year, day/hour/etc.
         spill into adjacent units, ms adds arithmetically. *)
      int64_eq
        (epoch_ms_to_int64'
           (Time.epoch_ms_of_civil Time.utc
              (Time.civil ~year:2026 ~month:13 ~day:1 ~hour:0 ~minute:0
                 ~second:0 ~ms:0)))
        1798761600000L (* 2027-01-01T00:00:00.000Z *);
      int64_eq
        (epoch_ms_to_int64'
           (Time.epoch_ms_of_civil Time.utc
              (Time.civil ~year:2026 ~month:1 ~day:32 ~hour:0 ~minute:0
                 ~second:0 ~ms:0)))
        1769904000000L (* 2026-02-01T00:00:00.000Z *);
      int64_eq
        (epoch_ms_to_int64'
           (Time.epoch_ms_of_civil Time.utc
              (Time.civil ~year:2026 ~month:1 ~day:15 ~hour:25 ~minute:0
                 ~second:0 ~ms:0)))
        1768525200000L (* 2026-01-16T01:00:00.000Z *);
      int64_eq
        (epoch_ms_to_int64'
           (Time.epoch_ms_of_civil Time.utc
              (Time.civil ~year:2026 ~month:3 ~day:0 ~hour:0 ~minute:0
                 ~second:0 ~ms:0)))
        1772236800000L (* 2026-02-28T00:00:00.000Z *);
      int64_eq
        (epoch_ms_to_int64'
           (Time.epoch_ms_of_civil Time.utc
              (Time.civil ~year:2026 ~month:1 ~day:15 ~hour:10 ~minute:30
                 ~second:45 ~ms:1500)))
        1768473046500L (* 2026-01-15T10:30:46.500Z *);
      int64_eq
        (epoch_ms_to_int64'
           (Time.epoch_ms_of_civil Time.utc
              (Time.civil ~year:2026 ~month:1 ~day:15 ~hour:10 ~minute:30
                 ~second:90 ~ms:0)))
        1768473090000L (* 2026-01-15T10:31:30.000Z *);
      int64_eq
        (epoch_ms_to_int64'
           (Time.epoch_ms_of_civil Time.utc
              (Time.civil ~year:2026 ~month:1 ~day:15 ~hour:10 ~minute:(-1)
                 ~second:0 ~ms:0)))
        1768471140000L (* 2026-01-15T09:59:00.000Z *);
      (* fixed-offset tz shifts the civil reading east *)
      int64_eq
        (epoch_ms_to_int64'
           (Time.epoch_ms_of_civil (Time.tz_of_offset_minutes 480)
              (Time.civil ~year:2026 ~month:1 ~day:15 ~hour:10 ~minute:30
                 ~second:45 ~ms:0)))
        1768444245000L (* 2026-01-15T10:30:45 +08:00 *));

  Fest.test "local-date-test" (fun () ->
      (match Time.local_date ~year:2026 ~month:3 ~day:15 ~tz:Time.utc with
       | Some d -> ok (Time.local_date_fields d = (2026, 3, 15))
       | None -> ok false);
      (match Time.local_date ~year:2024 ~month:2 ~day:29 ~tz:Time.utc with
       | Some d -> ok (Time.local_date_fields d = (2024, 2, 29))
       | None -> ok false);
      ok (Time.local_date ~year:2026 ~month:13 ~day:1 ~tz:Time.utc = None);
      ok (Time.local_date ~year:2026 ~month:2 ~day:31 ~tz:Time.utc = None);
      ok (Time.local_date ~year:2026 ~month:1 ~day:0 ~tz:Time.utc = None);
      ok
        (Time.local_date ~year:2023 ~month:2 ~day:29 ~tz:Time.utc = None);
      let utc_d =
        Option.get (Time.local_date ~year:2026 ~month:3 ~day:15 ~tz:Time.utc)
      and off_d =
        Option.get
          (Time.local_date ~year:2026 ~month:3 ~day:15
             ~tz:(Time.tz_of_offset_minutes 480))
      and next_d =
        Option.get (Time.local_date ~year:2026 ~month:3 ~day:16 ~tz:Time.utc)
      in
      (* compare on fields only; equal also requires same tz *)
      ok (Time.compare_local_date utc_d off_d = 0);
      ok (Time.compare_local_date utc_d next_d < 0);
      ok (Time.compare_local_date next_d utc_d > 0);
      ok (not (Time.equal_local_date utc_d off_d));
      ok
        (Time.equal_local_date utc_d
           (Option.get
              (Time.local_date ~year:2026 ~month:3 ~day:15 ~tz:Time.utc)));
      ok
        (Time.equal_local_date utc_d
           (Option.get
              (Time.local_date ~year:2026 ~month:3 ~day:15
                 ~tz:(Time.tz_of_offset_minutes 0)))));

  Fest.test "journal-day-test" (fun () ->
      let d1 =
        Option.get (Time.local_date ~year:2026 ~month:3 ~day:15 ~tz:Time.utc)
      in
      int_eq (Time.journal_day_of_local_date d1) 20260315;
      let d2 =
        Option.get (Time.local_date ~year:2024 ~month:2 ~day:29 ~tz:Time.utc)
      in
      int_eq (Time.journal_day_of_local_date d2) 20240229;
      (match Time.local_date_of_journal_day Time.utc 20260315 with
       | Some d ->
           ok (Time.local_date_fields d = (2026, 3, 15));
           ok (Time.equal_local_date d d1)
       | None -> ok false);
      ok (Time.local_date_of_journal_day Time.utc 20261301 = None);
      ok (Time.local_date_of_journal_day Time.utc 20260230 = None);
      ok (Time.local_date_of_journal_day Time.utc 999 = None));

  Fest.test "iso-string-of-epoch-ms-test" (fun () ->
      string_eq
        (Time.iso_string_of_epoch_ms (Time.epoch_ms 0L))
        "1970-01-01T00:00:00.000Z";
      string_eq
        (Time.iso_string_of_epoch_ms (Time.epoch_ms 1709210096789L))
        "2024-02-29T12:34:56.789Z";
      string_eq
        (Time.iso_string_of_epoch_ms (Time.epoch_ms (-1L)))
        "1969-12-31T23:59:59.999Z";
      string_eq
        (Time.iso_string_of_epoch_ms (Time.epoch_ms 1700000000000L))
        "2023-11-14T22:13:20.000Z");

  Fest.test "epoch-ms-of-iso-string-test" (fun () ->
      (* Only ISO forms both implementations accept: explicit tz suffix
         (Z/z, +HH:MM, +HHMM), T or space separator, optional seconds and
         fractional part.
         Known divergences kept out of this list on purpose:
         - date-time with no tz suffix ("2026-03-15T10:30"): js/Date.parse
           reads it as local time; native reads it as UTC.
         - "+05" (offset without minutes): native accepts; Date.parse ->
           NaN.
         - trailing junk ("...45.123junk"): native's scanner skips it;
           Date.parse -> NaN.
         - day overflow ("2026-02-30"): Date.parse rolls to 2026-03-02;
           native -> None.
         - non-ISO separators ("2026/03/15"): Date.parse accepts (local
           time); native -> None. *)
      let cases : (string * int64) list =
        [ ("2026-03-15T10:30:45.123Z", 1773570645123L)
        ; ("2026-03-15T10:30:45.123+08:00", 1773541845123L)
        ; ("2026-03-15T10:30:45.123+0800", 1773541845123L)
        ; ("2026-03-15T10:30:45.123-05:00", 1773588645123L)
        ; ("2026-03-15T10:30Z", 1773570600000L)
        ; ("2026-03-15T10:30:45Z", 1773570645000L)
        ; ("2026-03-15T10:30:45.5Z", 1773570645500L)
        ; ("2026-03-15T10:30:45.1234Z", 1773570645123L)
        ; ("2026-03-15 10:30:45.123Z", 1773570645123L)
        ; ("2026-03-15T10:30:45z", 1773570645000L)
        ; ("2026-03-15", 1773532800000L)
        ; ("1970-01-01T00:00:00.000Z", 0L)
        ; ("1969-12-31T23:59:59.999Z", -1L)
        ]
      in
      List.iter
        (fun (s, expected) ->
          match Time.epoch_ms_of_iso_string s with
          | Some e -> int64_eq (epoch_ms_to_int64' e) expected
          | None -> ok false)
        cases;
      List.iter
        (fun s -> ok (Time.epoch_ms_of_iso_string s = None))
        [ "not a date"
        ; ""
        ; "2026-13-45"
        ; "2026-00-15"
        ; "2026-03-15T25:00:00Z" ]);

  Fest.test "monotonic-test" (fun () ->
      let a = Time.monotonic_now () in
      let b = Time.monotonic_now () in
      ok (Time.diff_monotonic_ms a b >= 0.);
      ok (Time.diff_monotonic_ms a b < 60000.);
      ok (Time.compare_monotonic_ms a b <= 0);
      ok (Time.compare_monotonic_ms b a >= 0);
      ok (Time.compare_monotonic_ms a a = 0));

  Fest.test "local-tz-test" (fun () ->
      (* TZ-agnostic assertions: structural tz on local_date, and
         epoch<->civil roundtrips through local_tz hold in any zone. *)
      let local_d =
        Option.get
          (Time.local_date ~year:2026 ~month:3 ~day:15 ~tz:(Time.local_tz ()))
      and utc_d =
        Option.get (Time.local_date ~year:2026 ~month:3 ~day:15 ~tz:Time.utc)
      in
      ok (Time.equal_local_date local_d local_d);
      (* local_tz is structurally distinct from any fixed offset, even
         where the machine zone coincides with UTC. *)
      ok (not (Time.equal_local_date local_d utc_d));
      ok (Time.compare_local_date local_d utc_d = 0);
      let local = Time.local_tz () in
      List.iter
        (fun (_name, ms) -> epoch_civil_roundtrip local ms)
        (instants
         @ [ ("summer-2024-07-15", 1721070000000L) (* 2024-07-15T19:00Z *)
           ]))
