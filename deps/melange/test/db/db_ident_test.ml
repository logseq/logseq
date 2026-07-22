open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let expect_invalid label f =
  match f () with
  | _ -> failwith (label ^ ": expected Invalid_argument")
  | exception Invalid_argument _ -> ()

let () =
  Fest.test "DB ident normalization preserves the legacy symbol alphabet"
    (fun () ->
      expect_equal "invalid punctuation"
        (Db_ident.normalize_name_part "f@!{h[#")
        "f!h";
      expect_equal "allowed punctuation"
        (Db_ident.normalize_name_part "foo*+!_'?<>=-")
        "foo*+!_'?<>=-";
      expect_equal "leading digit"
        (Db_ident.normalize_name_part "2nd.City")
        "NUM-2ndCity";
      expect_equal "Unicode removed"
        (Db_ident.normalize_name_part "café😀")
        "caf");
  Fest.test "DB nano-id maps typed random bytes to the fixed alphabet"
    (fun () ->
      expect_equal "alphabet" Db_ident.alphabet
        "_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
      expect_equal "byte masking"
        (Db_ident.nano_id (Rrbvec.of_array [| 0; 1; 2; 63; 64; 255 |]))
        "_-0Z_Z");
  Fest.test
    "DB ident creation rejects internal namespaces and composes suffixes"
    (fun () ->
      expect_equal "stable ident"
        (Db_ident.create ~namespace_:"user.property" ~name:"2nd City"
           ~suffix:None)
        "user.property/NUM-2ndCity";
      expect_equal "random suffix"
        (Db_ident.create ~namespace_:"user.property" ~name:"Title"
           ~suffix:(Some "a_012345"))
        "user.property/Title-a_012345";
      expect_equal "plugin class ignores suffix"
        (Db_ident.create ~namespace_:"plugin.class.demo" ~name:"Title"
           ~suffix:(Some "a_012345"))
        "plugin.class.demo/Title";
      expect_equal "stable suffix requirement"
        (Db_ident.requires_random_suffix ~namespace_:"user.property"
           ~stable:true)
        false;
      expect_equal "random suffix requirement"
        (Db_ident.requires_random_suffix ~namespace_:"user.property"
           ~stable:false)
        true;
      expect_invalid "internal namespace" (fun () ->
          Db_ident.create ~namespace_:"logseq.property" ~name:"Title"
            ~suffix:None));
  Fest.test "DB ident creation owns runtime randomness decisions" (fun () ->
      let calls = ref [] in
      let actual =
        Db_ident.create_with
          ~stable_idents:(fun () ->
            calls := !calls @ [ "stable" ];
            false)
          ~random_index:(fun upper_bound ->
            calls := !calls @ [ "index:" ^ string_of_int upper_bound ];
            1)
          ~random_bytes:(fun count ->
            calls := !calls @ [ "bytes:" ^ string_of_int count ];
            Rrbvec.of_list [ 0; 1; 2; 3; 4; 5; 6 ])
          ~namespace_:"user.property" ~name:"Title"
      in
      expect_equal "random ident" actual "user.property/Title-b_-01234";
      expect_equal "random calls" !calls [ "stable"; "index:52"; "bytes:7" ];
      calls := [];
      let stable =
        Db_ident.create_with
          ~stable_idents:(fun () ->
            calls := !calls @ [ "stable" ];
            true)
          ~random_index:(fun _ -> failwith "random index should not be called")
          ~random_bytes:(fun _ -> failwith "random bytes should not be called")
          ~namespace_:"user.property" ~name:"Title"
      in
      expect_equal "stable ident" stable "user.property/Title";
      expect_equal "stable calls" !calls [ "stable" ]);
  Fest.test "DB ident uniqueness uses the greatest numeric suffix" (fun () ->
      let existing =
        Rrbvec.of_array
          [|
            "user.property/title-1";
            "user.property/title-x";
            "user.property/title-9";
            "other/title-100";
          |]
      in
      expect_equal "unused"
        (Db_ident.ensure_unique ~base:"user.property/title" ~base_exists:false
           ~existing)
        "user.property/title";
      expect_equal "next suffix"
        (Db_ident.ensure_unique ~base:"user.property/title" ~base_exists:true
           ~existing)
        "user.property/title-10";
      expect_equal "first suffix"
        (Db_ident.ensure_unique ~base:"user.property/new" ~base_exists:true
           ~existing:Rrbvec.empty)
        "user.property/new-1");
  Fest.test "DB ident uniqueness owns query construction and execution"
    (fun () ->
      let calls = ref [] in
      let query_form = ref None in
      let result =
        Db_ident.ensure_unique_with
          ~encode_form:(fun form ->
            query_form := Some form;
            "encoded-query")
          ~keyword_to_string:(fun value -> value)
          ~keyword_from_string:(fun value -> "keyword:" ^ value)
          ~string_to_value:(fun value -> value)
          ~collection_to_array:(fun value ->
            expect_equal "query result" value "query-result";
            [| "user.property/title-1"; "user.property/title-9" |])
          ~entity_exists:(fun ident ->
            calls := !calls @ [ "entity:" ^ ident ];
            true)
          ~query:(fun form inputs ->
            calls :=
              !calls
              @ [
                  "query:" ^ form ^ ":"
                  ^ String.concat "," (Array.to_list inputs);
                ];
            "query-result")
          "user.property/title"
      in
      expect_equal "unique keyword" result "keyword:user.property/title-10";
      expect_equal "calls" !calls
        [
          "entity:user.property/title";
          "query:encoded-query::user.property/title-";
        ];
      match !query_form with
      | Some (Datalog_form.Vector_form values) ->
          expect_equal "query clause count" (Rrbvec.length values) 9
      | _ -> failwith "expected a typed Datalog vector")
