module Runtime = Melange_runtime
module Keyword = Runtime.Keyword
module Uuid = Runtime.Uuid
module Date_time = Runtime.Date_time
module Vector = Runtime.Persistent_vector
module Melange_edn = Melange_edn_melange
module Transit = Transit_melange.Transit.Json

let fail message =
  Fest.expect |> Fest.equal message "";
  failwith message

let expect_true label condition =
  if not condition then fail (label ^ ": expected true")

let expect_false label condition =
  if condition then fail (label ^ ": expected false")

let expect_equal label actual expected =
  try Fest.expect |> Fest.equal actual expected
  with _ -> fail (label ^ ": values differ")

let expect_edn_equal label actual expected =
  expect_equal label
    (Melange_edn.to_edn_string actual)
    (Melange_edn.to_edn_string expected)

let decode_transit text = Transit.to_edn (Transit.of_string text)

let encode_transit ?(mode = Transit.Normal) value =
  Transit.to_string ~mode (Transit.of_edn value)

let expect_ok label = function
  | Ok value -> value
  | Error message -> fail (label ^ ": " ^ message)

let expect_error label = function
  | Error message -> expect_true (label ^ " message") (String.length message > 0)
  | Ok _ -> fail (label ^ ": expected Error")

let vector values = Vector.of_array values

let () =
  Fest.test "qualified and Unicode keywords preserve namespace and name"
    (fun () ->
      let qualified =
        expect_ok "qualified keyword" (Keyword.of_string "block/title")
      in
      let unicode = expect_ok "unicode keyword" (Keyword.of_string "页面/标题") in
      let unqualified =
        expect_ok "unqualified keyword" (Keyword.of_string "title")
      in
      expect_equal "qualified text" (Keyword.to_string qualified) "block/title";
      expect_true "qualified namespace"
        (Keyword.namespace qualified = Some "block");
      expect_equal "qualified name" (Keyword.name qualified) "title";
      expect_true "unicode namespace" (Keyword.namespace unicode = Some "页面");
      expect_equal "unicode name" (Keyword.name unicode) "标题";
      expect_true "unqualified namespace" (Keyword.namespace unqualified = None);
      expect_equal "unqualified name" (Keyword.name unqualified) "title");

  Fest.test "malformed keyword names return explicit errors" (fun () ->
      [| ""; ":block/title"; "/"; "/title"; "bad key"; "bad\nkey" |]
      |> Array.iter (fun text ->
          expect_error ("keyword " ^ text) (Keyword.of_string text)));

  Fest.test "UUID parsing validates canonical form and normalizes case"
    (fun () ->
      let canonical = "11111111-1111-4111-8111-111111111111" in
      let uppercase = "AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE" in
      let first = expect_ok "canonical uuid" (Uuid.of_string canonical) in
      let second = expect_ok "uppercase uuid" (Uuid.of_string uppercase) in
      expect_equal "canonical uuid text" (Uuid.to_string first) canonical;
      expect_equal "normalized uuid text" (Uuid.to_string second)
        "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
      expect_true "uuid equality"
        (Uuid.equal first
           (expect_ok "same uuid"
              (Uuid.of_string (String.uppercase_ascii canonical)))));

  Fest.test "malformed UUID strings return explicit errors" (fun () ->
      [|
        "";
        "11111111111141118111111111111111";
        "11111111-1111-4111-8111-11111111111";
        "11111111-1111-4111-8111-11111111111g";
        "{11111111-1111-4111-8111-111111111111}";
      |]
      |> Array.iter (fun text ->
          expect_error ("uuid " ^ text) (Uuid.of_string text)));

  Fest.test "calendar dates validate leap years and round trip journal days"
    (fun () ->
      let leap =
        expect_ok "leap date" (Date_time.of_ymd ~year:2024 ~month:2 ~day:29)
      in
      let century =
        expect_ok "century leap date" (Date_time.of_iso_date "2000-02-29")
      in
      expect_equal "leap ISO date" (Date_time.to_iso_date leap) "2024-02-29";
      expect_equal "leap journal day" (Date_time.to_journal_day leap) 20240229;
      expect_true "journal day equality"
        (Date_time.equal leap
           (expect_ok "journal day" (Date_time.of_journal_day 20240229)));
      expect_equal "century year" (Date_time.year century) 2000;
      expect_equal "century month" (Date_time.month century) 2;
      expect_equal "century day" (Date_time.day century) 29);

  Fest.test "invalid and malformed calendar dates return explicit errors"
    (fun () ->
      [|
        Date_time.of_ymd ~year:1900 ~month:2 ~day:29;
        Date_time.of_ymd ~year:2024 ~month:13 ~day:1;
        Date_time.of_ymd ~year:2024 ~month:4 ~day:31;
        Date_time.of_ymd ~year:0 ~month:1 ~day:1;
        Date_time.of_journal_day 20240230;
        Date_time.of_journal_day 202401;
        Date_time.of_iso_date "2024-2-29";
        Date_time.of_iso_date "2024/02/29";
      |]
      |> Array.iteri (fun index result ->
          expect_error ("invalid date " ^ string_of_int index) result));

  Fest.test "persistent vectors preserve order and previous versions" (fun () ->
      let input = [| 1; 2; 3 |] in
      let original = Vector.of_array input in
      input.(0) <- 99;
      let updated =
        expect_ok "vector set" (Vector.set original 1 20) |> fun values ->
        Vector.push_back values 4
      in
      expect_equal "original first"
        (expect_ok "nth 0" (Vector.nth original 0))
        1;
      expect_equal "original second"
        (expect_ok "nth 1" (Vector.nth original 1))
        2;
      expect_equal "updated second"
        (expect_ok "updated nth" (Vector.nth updated 1))
        20;
      Fest.expect |> Fest.deep_equal (Vector.to_array updated) [| 1; 20; 3; 4 |];
      let output = Vector.to_array original in
      output.(0) <- 88;
      expect_equal "copied output"
        (expect_ok "copied nth" (Vector.nth original 0))
        1);

  Fest.test "persistent vector boundaries and large paths are explicit"
    (fun () ->
      let values = Vector.init 10000 (fun index -> index) in
      let mapped = Vector.map (fun value -> value + 1) values in
      expect_equal "large vector length" (Vector.length mapped) 10000;
      expect_equal "large vector first"
        (expect_ok "large first" (Vector.nth mapped 0))
        1;
      expect_equal "large vector last"
        (expect_ok "large last" (Vector.nth mapped 9999))
        10000;
      expect_error "negative vector index" (Vector.nth mapped (-1));
      expect_error "large vector index" (Vector.nth mapped 10000);
      expect_error "set outside vector" (Vector.set mapped 10000 0));

  Fest.test "compile-time EDN fixtures support typed antiquotation" (fun () ->
      let title = Melange_edn.string "Alpha" in
      let value =
        [%edn
          {|{:block/title ?title
             :items [nil false #uuid "11111111-1111-4111-8111-111111111111"]}|}]
      in
      let expected =
        [%edn
          {|{:block/title "Alpha"
             :items [nil false #uuid "11111111-1111-4111-8111-111111111111"]}|}]
      in
      expect_edn_equal "typed antiquotation" value expected);

  Fest.test "EDN round trips maps collections keywords and UUID tags"
    (fun () ->
      let source =
        "{:block/title \"Alpha\" :items [nil false #uuid \
         \"11111111-1111-4111-8111-111111111111\"]}"
      in
      let decoded = Melange_edn.of_edn_string source in
      let encoded = Melange_edn.to_edn_string decoded in
      let round_trip = Melange_edn.of_edn_string encoded in
      let expected =
        [%edn
          {|{:block/title "Alpha"
             :items [nil false #uuid "11111111-1111-4111-8111-111111111111"]}|}]
      in
      expect_edn_equal "decoded EDN" decoded expected;
      expect_edn_equal "EDN semantic round trip" round_trip expected);

  Fest.test "EDN preserves supported scalar collection and tagged values"
    (fun () ->
      let source =
        "(\\newline #\"a+\" #{:tag} 9223372036854775808N 1.25M 1/3 #custom/tag \
         {:x 1} ##NaN)"
      in
      let decoded = Melange_edn.of_edn_string source in
      let encoded = Melange_edn.to_edn_string decoded in
      let round_trip = Melange_edn.of_edn_string encoded in
      let expected =
        [%edn
          {|(\newline #"a+" #{:tag} 9223372036854775808N 1.25M 1/3
             #custom/tag {:x 1} ##NaN)|}]
      in
      expect_edn_equal "decoded tagged EDN" decoded expected;
      expect_edn_equal "tagged EDN semantic round trip" round_trip expected);

  Fest.test "Transit round trips supported Logseq boundary values"
    (fun () ->
      let binary = Melange_edn.string "\000\255" in
      let value =
        [%edn
          {|{:block/title
             [#uuid "11111111-1111-4111-8111-111111111111"
              #transit/time 1704067200000
              9223372036854775808N
              1234567890.123456789M
              #transit/bytes ?binary
              #transit/uri "https://logseq.com/页面"
              #{"a" "b"}
              (1 true)
              #custom "value"]}|}]
      in
      let normal = encode_transit value in
      let verbose = encode_transit ~mode:Transit.Verbose value in
      expect_edn_equal "normal Transit round trip"
        (decode_transit normal) value;
      expect_edn_equal "verbose Transit round trip"
        (decode_transit verbose) value);

  Fest.test "Transit rejects malformed input" (fun () ->
      let rejected =
        try
          ignore (Transit.of_string "[");
          false
        with Transit.Decode_error _ -> true
      in
      expect_true "malformed Transit" rejected);

  Fest.test "Transit decodes current SQLite content"
    (fun () ->
      let decoded =
        decode_transit
          "[\"^ \",\"~:eavt\",2,\"~:avet\",3,\"~:aevt\",4,\"~:block/uuid\",\"~u11111111-1111-4111-8111-111111111111\",\"~:items\",[\"~#set\",[\"~:a\",\"~:b\"]],\"~:nested\",[[\"^ \",\"~:x\",1]]]"
      in
      let expected =
        [%edn
          {|{:eavt 2
             :avet 3
             :aevt 4
             :block/uuid #uuid "11111111-1111-4111-8111-111111111111"
             :items #{:a :b}
             :nested [{:x 1}]}|}]
      in
      expect_edn_equal "sqlite Transit value" decoded expected);

  Fest.test "Transit maps EDN-only values to tagged values"
    (fun () ->
      let encoded = encode_transit [%edn {|[\newline 1/3 #"a+"]|}] in
      let decoded = decode_transit encoded in
      expect_edn_equal "Transit-compatible EDN values" decoded
        [%edn {|["\n" #edn/ratio "1/3" #edn/regex "a+"]|}])
