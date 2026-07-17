open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let expect_invalid label f =
  match f () with
  | _ -> failwith (label ^ ": expected Invalid_argument")
  | exception Invalid_argument _ -> ()

let expect_keys label actual expected =
  expect_equal label (Rrbvec.to_array actual) expected

let () =
  Fest.test "DB fractional order generates keys at every boundary" (fun () ->
      let cases =
        [|
          (None, None, "a0");
          (None, Some "a0", "Zz");
          (None, Some "Zz", "Zy");
          (Some "a0", None, "a1");
          (Some "a1", None, "a2");
          (Some "a0", Some "a1", "a0V");
          (Some "a1", Some "a2", "a1V");
          (Some "a0V", Some "a1", "a0l");
          (Some "Zz", Some "a0", "ZzV");
          (Some "Zz", Some "a1", "a0");
          (None, Some "Y00", "Xzzz");
          (Some "bzz", None, "c000");
          (Some "a0", Some "a0V", "a0G");
          (Some "a0", Some "a0G", "a08");
          (Some "b125", Some "b129", "b127");
          (Some "a0", Some "a1V", "a1");
          (Some "Zz", Some "a01", "a0");
          (None, Some "a0V", "a0G");
          (None, Some "b999", "b995");
          ( None,
            Some "A000000000000000000000000001",
            "A000000000000000000000000000V" );
          ( Some "zzzzzzzzzzzzzzzzzzzzzzzzzzy",
            None,
            "zzzzzzzzzzzzzzzzzzzzzzzzzzz" );
          ( Some "zzzzzzzzzzzzzzzzzzzzzzzzzzz",
            None,
            "zzzzzzzzzzzzzzzzzzzzzzzzzzzV" );
        |]
      in
      Array.iteri
        (fun index (start, finish, expected) ->
          expect_equal
            ("case " ^ string_of_int index)
            (Order.generate_key_between start finish)
            expected)
        cases);
  Fest.test "DB fractional order rejects malformed and reversed bounds"
    (fun () ->
      expect_invalid "reserved minimum" (fun () ->
          Order.generate_key_between None (Some "A00000000000000000000000000"));
      expect_invalid "trailing zero" (fun () ->
          Order.generate_key_between (Some "a00") None);
      expect_invalid "invalid head" (fun () ->
          Order.generate_key_between (Some "0") (Some "1"));
      expect_invalid "reversed" (fun () ->
          Order.generate_key_between (Some "a1") (Some "a0"));
      expect_equal "valid predicate" (Order.validate_order_key "a0V") true;
      expect_invalid "invalid predicate" (fun () ->
          Order.validate_order_key "a00"));
  Fest.test "DB fractional order generates persistent key vectors" (fun () ->
      expect_keys "empty" (Order.generate_n_keys_between 0 None None) [||];
      expect_keys "single"
        (Order.generate_n_keys_between 1 (Some "a0") (Some "a1"))
        [| "a0V" |];
      expect_keys "open right"
        (Order.generate_n_keys_between 10 (Some "a4") None)
        [| "a5"; "a6"; "a7"; "a8"; "a9"; "aA"; "aB"; "aC"; "aD"; "aE" |];
      expect_keys "open left"
        (Order.generate_n_keys_between 5 None (Some "a0"))
        [| "Zv"; "Zw"; "Zx"; "Zy"; "Zz" |];
      expect_keys "closed"
        (Order.generate_n_keys_between 20 (Some "ZxV") (Some "Zy7"))
        [|
          "ZxX";
          "ZxZ";
          "Zxd";
          "Zxf";
          "Zxh";
          "Zxl";
          "Zxn";
          "Zxp";
          "Zxt";
          "Zxx";
          "Zy";
          "Zy0V";
          "Zy1";
          "Zy2";
          "Zy3";
          "Zy4";
          "Zy4V";
          "Zy5";
          "Zy6";
          "Zy6V";
        |]);
  Fest.test "DB fractional order owns max-key and neighbor decisions" (fun () ->
      expect_equal "initial max"
        (Order.advance_max_key None (Some "a0"))
        (Some "a0");
      expect_equal "retain max"
        (Order.advance_max_key (Some "a1") (Some "a0"))
        (Some "a1");
      expect_equal "absent candidate"
        (Order.advance_max_key (Some "a1") None)
        (Some "a1");
      let candidates = Rrbvec.of_array [| "a0"; "a1"; "a2"; "a1" |] in
      expect_equal "previous"
        (Order.previous_order ~value_order:"a1V" ~candidates)
        (Some "a1");
      expect_equal "next"
        (Order.next_order ~value_order:"a1V" ~candidates)
        (Some "a2");
      expect_equal "no previous"
        (Order.previous_order ~value_order:"Zz" ~candidates)
        None);
  Fest.test "DB fractional order owns maximum-order DataScript reads" (fun () ->
      let calls = ref [] in
      let max_order =
        Order.max_order_with ~nil_value:"nil"
          ~keyword_from_string:(fun value -> "keyword:" ^ value)
          ~rseek_datoms:(fun index components ->
            calls :=
              !calls
              @ [ index ^ ":" ^ String.concat "," (Array.to_list components) ];
            [| "datom" |])
          ~datom_value:(fun value ->
            expect_equal "datom" value "datom";
            "a9")
      in
      expect_equal "maximum" max_order "a9";
      expect_equal "query" !calls [ "keyword:avet:keyword:block/order" ];
      expect_equal "missing"
        (Order.max_order_with ~nil_value:"nil"
           ~keyword_from_string:(fun value -> value)
           ~rseek_datoms:(fun _ _ -> [||])
           ~datom_value:(fun value -> value))
        "nil");
  Fest.test "DB fractional order state is explicit and isolated" (fun () ->
      let left = Order.create_state () in
      let right = Order.create_state () in
      expect_equal "left first"
        (Order.generate_tracked_key_between left None None)
        "a0";
      expect_equal "left second"
        (Order.generate_tracked_key_between left None None)
        "a1";
      expect_equal "right remains isolated"
        (Order.generate_tracked_key_between right None None)
        "a0";
      Order.reset_state left (Some "a9");
      expect_equal "reset advances from explicit value"
        (Order.generate_tracked_key_between left None None)
        "aA";
      Order.reset_state left (Some "bE5");
      expect_keys "tracked ranges preserve an explicit open lower bound"
        (Order.generate_tracked_n_keys_between left 3 None (Some "bE5"))
        [| "bE2"; "bE3"; "bE4" |];
      expect_equal "tracked ranges still advance the maximum"
        (Order.state_maximum left)
        (Some "bE5"))
