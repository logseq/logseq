(* Shared pure-helper behavior invariants — runs identically under
   byte/native (task_native_test) and melange (task_web_test), after
   Ui_services_scenarios has installed the fake service surface. *)

let check label condition = if not condition then failwith label

let eqs label a b =
  if a <> b then failwith (label ^ ": expected " ^ b ^ ", got " ^ a)

(* UTC civil-date conversions for the fake [time] service installed by
   the scenarios — keeps the assertions host-TZ-free *)
let days_from_civil y m d =
  let y = if m <= 2 then y - 1 else y in
  let era = (if y >= 0 then y else y - 399) / 400 in
  let yoe = y - (era * 400) in
  let mp = (m + 9) mod 12 in
  let doy = ((153 * mp) + 2) / 5 + d - 1 in
  let doe = (yoe * 365) + (yoe / 4) - (yoe / 100) + doy in
  (era * 146097) + doe - 719468

let civil_from_days z =
  let z = z + 719468 in
  let era = (if z >= 0 then z else z - 146096) / 146097 in
  let doe = z - (era * 146097) in
  let yoe = (doe - (doe / 1460) + (doe / 36524) - (doe / 146096)) / 365 in
  let y = yoe + (era * 400) in
  let doy = doe - ((365 * yoe) + (yoe / 4) - (yoe / 100)) in
  let mp = ((5 * doy) + 2) / 153 in
  let d = doy - (((153 * mp) + 2) / 5) + 1 in
  let m = if mp < 10 then mp + 3 else mp - 9 in
  ((if m <= 2 then y + 1 else y), m, d)

let fake_time : Ui_services.time =
  let local_fields ms =
    let days = int_of_float (ms /. 86400000.) in
    let within = int_of_float (Float.rem ms 86400000.) in
    let wday = ((days + 4) mod 7 + 7) mod 7 in
    let y, m, d = civil_from_days days in
    { Ui_services.year = y
    ; month = m
    ; day = d
    ; wday
    ; hours = within / 3600000
    ; minutes = within mod 3600000 / 60000
    ; seconds = within mod 60000 / 1000
    ; ms = within mod 1000
    }
  in
  { now = (fun () -> 0.)
  ; local_fields
  ; of_fields =
      (fun f ->
        (* float math — the day*86400000 product overflows melange's
           32-bit int *)
        (float_of_int (days_from_civil f.year f.month f.day) *. 86400000.)
        +. float_of_int
             ((f.hours * 3600000) + (f.minutes * 60000) + (f.seconds * 1000)
             + f.ms))
  ; parse =
      (fun s ->
        match String.split_on_char '-' s with
        | [ ys; ms'; ds' ] -> (
            match
              (int_of_string_opt ys, int_of_string_opt ms', int_of_string_opt ds')
            with
            | Some y, Some m, Some d when m >= 1 && m <= 12 && d >= 1 && d <= 31
              -> Some (float_of_int (days_from_civil y m d) *. 86400000.)
            | _ -> None)
        | _ -> None)
  ; fmt_date =
      (fun ms ->
        let f = local_fields ms in
        let months =
          [| "Jan"; "Feb"; "Mar"; "Apr"; "May"; "Jun"; "Jul"; "Aug"; "Sep"
           ; "Oct"; "Nov"; "Dec" |]
        in
        Printf.sprintf "%s %d, %d" months.(f.month - 1) f.day f.year)
  }

let run () =
  (* ---- fuzzy ---- *)
  check "fuzzy nfkc fullwidth"
    (Fuzzy.fuzzy_search ~extract:Fun.id ~limit:9 [ "full-width"; "x" ]
       "ＦＵＬＬ"
     = [ "full-width" ]);
  check "fuzzy accent fold nfc->nfd text"
    (Fuzzy.fuzzy_search ~extract:Fun.id ~limit:9 [ "cafe\xCC\x81 menu"; "x" ]
       "café"
     = [ "cafe\xCC\x81 menu" ]);
  check "fuzzy accent fold nfd query"
    (Fuzzy.fuzzy_search ~extract:Fun.id ~limit:9 [ "café menu"; "x" ]
       "cafe\xCC\x81"
     = [ "café menu" ]);
  eqs "fuzzy lowercase dotted-i" (Fuzzy.lowercase "İ") "i\xCC\x87";
  eqs "fuzzy lowercase sigma final" (Fuzzy.lowercase "ΑΣ") "ας";
  eqs "fuzzy clean_str unicode" (Fuzzy.clean_str "A[B]C é") "abcé";
  eqs "fuzzy search_normalize folds accent" (Fuzzy.search_normalize "café") "cafe";
  eqs "fuzzy search_normalize fullwidth" (Fuzzy.search_normalize "ＡＢＣ")
    "ABC";

  (* ---- sprintf ---- *)
  eqs "sprintf basic" (Sprintf.sprintf "%s-%d" "a" 1) "a-1";
  eqs "sprintf width" (Sprintf.sprintf "%5d" 7) "    7";
  eqs "sprintf left" (Sprintf.sprintf "%-5d" 7) "7    ";
  eqs "sprintf zero-pad" (Sprintf.sprintf "%05d" 7) "00007";
  eqs "sprintf hex" (Sprintf.sprintf "%x" 255) "ff";
  eqs "sprintf float" (Sprintf.sprintf "%.2f" 3.14159) "3.14";
  eqs "sprintf pct" (Sprintf.sprintf "%%") "%";
  eqs "sprintf arg-width" (Sprintf.sprintf "%*d" 5 42) "   42";
  check "sprintf unsupported fails"
    (try ignore (Sprintf.sprintf "%t" (fun _ -> "")); false
     with Invalid_argument _ -> true);

  (* ---- dates ---- *)
  eqs "journal ymd" (Dates.journal_title_ymd ~y:2026 ~m:9 ~d:27)
    "Sep 27th, 2026";
  eqs "journal ymd 11th" (Dates.journal_title_ymd ~y:2026 ~m:3 ~d:11)
    "Mar 11th, 2026";
  eqs "journal ymd 21st" (Dates.journal_title_ymd ~y:2026 ~m:3 ~d:21)
    "Mar 21st, 2026";
  eqs "journal ymd 23rd" (Dates.journal_title_ymd ~y:2026 ~m:3 ~d:23)
    "Mar 23rd, 2026";
  check "journal parts roundtrip"
    (Dates.journal_title_parts "Sep 27th, 2026" = Some (27, 9, 2026));
  check "journal parts rejects bad month"
    (Dates.journal_title_parts "Foo 1st, 2026" = None);
  check "is_journal_title" (Dates.is_journal_title "Sep 27th, 2026");
  check "is_journal_title rejects" (not (Dates.is_journal_title "notes"));
  check "days_in_month leap"
    (Dates.days_in_month ~y:2024 ~m:2 = 29
     && Dates.days_in_month ~y:2025 ~m:2 = 28
     && Dates.days_in_month ~y:2026 ~m:4 = 30
     && Dates.days_in_month ~y:2026 ~m:12 = 31);

  (* ---- json ---- *)
  eqs "json stringify escapes" (Json.stringify (Json.String "a\"b\n\x01"))
    "\"a\\\"b\\n\\u0001\"";
  eqs "json stringify integral" (Json.stringify (Json.Number 42.)) "42";
  eqs "json stringify float" (Json.stringify (Json.Number 1.5)) "1.5";
  eqs "json stringify nonfinite"
    (Json.stringify (Json.Number Float.nan)) "null";
  eqs "json object order"
    (Json.stringify
       (Json.Object [ "b", Json.Number 1.; "a", Json.String "x" ]))
    "{\"b\":1,\"a\":\"x\"}";

  (* ---- sdk_convert ---- *)
  let wj w = Sdk_convert.wire_to_string w in
  let wmap kvs = Wire.Map (List.map (fun (k, v) -> (Wire.kw k, v)) kvs) in
  eqs "json order + alias appended"
    (wj
       (wmap
          [ "block/uuid", Wire.String "u"; "block/title", Wire.String "T" ]))
    "{\"uuid\":\"u\",\"title\":\"T\",\"content\":\"T\",\"fullTitle\":\"T\"}";
  eqs "json existing content keeps slot"
    (wj
       (wmap
          [ "block/title", Wire.String "T"
          ; "block/uuid", Wire.String "u"
          ; "block/content", Wire.String "OLD" ]))
    "{\"title\":\"T\",\"uuid\":\"u\",\"content\":\"T\",\"fullTitle\":\"T\"}";
  eqs "json user fullTitle wins"
    (wj
       (wmap
          [ "block/uuid", Wire.String "u"
          ; "block/title", Wire.String "T"
          ; "block/fullTitle", Wire.String "mine" ]))
    "{\"uuid\":\"u\",\"title\":\"T\",\"fullTitle\":\"mine\",\"content\":\"T\"}";
  let j =
    Sdk_convert.result_json_of_wire
      (wmap
         [ "block/tags", Wire.Map [ Wire.kw "db/id", Wire.Int 7 ]
         ; "block/other", Wire.Map [ Wire.kw "db/id", Wire.Int 8 ]
         ; "logseq.property/x", Wire.Map [ Wire.kw "db/id", Wire.Int 9 ] ])
  in
  check "tags ref collapses"
    ((match Json.get "tags" j with Some v -> Json.as_number v = Some 7. | None -> false));
  check "qualified block-ns ref stays map"
    (match Json.get "other" j with
        Some o -> Json.get "id" o |> Option.map Json.as_number = Some (Some 8.)
      | None -> false);
  check "kept-ns ref collapses"
    ((match Json.get ":logseq.property/x" j with Some v -> Json.as_number v = Some 9. | None -> false));
  check "wire_of_json object->String keys"
    (match
       Sdk_convert.wire_of_json
         (Json.Object [ "a", Json.Number 1.; "b", Json.Bool true ])
     with
     | Wire.Map [ (Wire.String "a", Wire.Int 1); (Wire.String "b", Wire.Bool true) ]
       -> true
     | _ -> false);

  (* ---- icons ---- *)
  eqs "kebab camel" (Icons.kebab "arrowRight") "arrow-right";
  eqs "kebab space" (Icons.kebab "arrow right") "arrow-right";
  check "builtin check" (Icons.name_ref "check" = `check);
  check "app name kebabed"
    (Icons.name_ref "arrowRightCircle" = `app "arrow-right-circle");
  check "is_filled" (Icons.is_filled "star-filled");
  check "is_filled neg" (not (Icons.is_filled "star"));
  eqs "svg children"
    (Icons.svg_of_children ~size:24. "x" [ ("path", [ ("d", "M0 0") ]) ])
    "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" \
     height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" \
     stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" \
     stroke-linejoin=\"round\" class=\"tabler-icon tabler-icon-x\"><path \
     d=\"M0 0\"></path></svg>";
  eqs "data uri encodes svg"
    (Icons.data_uri_of_svg "<svg a=\"b\">")
    "data:image/svg+xml,%3Csvg%20a%3D%22b%22%3E";
  eqs "encode uri utf8 + unreserved"
    (Icons.encode_uri_component "é!~*'()") "%C3%A9!~*'()";

  (* ---- icon_tabler_data decode (fixture source) ---- *)
  Icon_tabler_data.install
    { get =
        (fun name ->
          if name = "good" then
            Some
              (Json.Array
                 [| Json.Array
                      [| Json.String "path"
                       ; Json.Object [ "d", Json.String "M0 0" ]
                      |]
                 |])
          else Some (Json.Array [| Json.Null |]))
    ; keys = (fun () -> [| "good" |])
    };
  check "tabler decode"
    (Icon_tabler_data.tabler_children "good"
     = [ ("path", [ ("d", "M0 0") ]) ]);
  check "tabler decode drops malformed"
    (Icon_tabler_data.tabler_children "bad" = []);
  check "icon names populated" (Array.length Icon_picker_names.items > 1000);
  check "version app set" (String.length Version.app > 0)
