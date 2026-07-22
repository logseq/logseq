open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let () =
  Fest.test "DB SQLite policy sanitizes graph names" (fun () ->
      expect_equal "prefixed"
        (Sqlite_policy.sanitize_db_name ~prefix:"logseq_db_"
           "logseq_db_work/team:one\\two")
        "work_team_one_two";
      expect_equal "not DB"
        (Sqlite_policy.db_based_graph ~prefix:"logseq_db_" "work")
        false;
      expect_equal "DB"
        (Sqlite_policy.db_based_graph ~prefix:"logseq_db_" "logseq_db_work")
        true);
  Fest.test "DB SQLite policy finds reachable and unused addresses" (fun () ->
      let edges =
        Rrbvec.of_list
          [
            (10, Rrbvec.of_list [ 11; 12 ]);
            (11, Rrbvec.of_list [ 13 ]);
            (13, Rrbvec.of_list [ 10 ]);
          ]
      in
      expect_equal "reachable"
        (Sqlite_policy.reachable_addresses ~roots:(Rrbvec.of_list [ 10 ]) edges
        |> Rrbvec.to_list)
        [ 10; 11; 12; 13 ];
      expect_equal "unused"
        (Sqlite_policy.unused_addresses
           ~internal:(Rrbvec.of_list [ 0; 1; 10 ])
           ~all:(Rrbvec.of_list [ 0; 1; 10; 11; 20 ])
           ~referenced:(Rrbvec.of_list [ 11 ])
        |> Rrbvec.to_list)
        [ 20 ];
      expect_equal "missing"
        (Sqlite_policy.missing_addresses
           ~required:(Rrbvec.of_list [ 0; 1; 10; 11; 12 ])
           ~present:(Rrbvec.of_list [ 0; 1; 10; 12 ])
        |> Rrbvec.to_list)
        [ 11 ]);
  Fest.test "DB SQLite policy plans standard property values" (fun () ->
      let input : Sqlite_policy.property_input =
        {
          namespace_ = "user.property";
          name = "Score";
          normalized_name = "score";
          title = None;
          property_type = "number";
          cardinality = "many";
          explicit_ref_type = false;
          known_ref_type = true;
          uuid = "property-uuid";
          order = "a0";
        }
      in
      let plan = Sqlite_policy.property input in
      expect_equal "title" plan.title "Score";
      expect_equal "name" plan.normalized_name "score";
      expect_equal "cardinality" plan.cardinality "db.cardinality/many";
      expect_equal "ref" plan.ref_type true);
  Fest.test "DB SQLite policy plans class page and import values" (fun () ->
      expect_equal "root class"
        (Sqlite_policy.add_root_extends ~ident:"logseq.class/Root"
           ~has_extends:false)
        false;
      expect_equal "user class"
        (Sqlite_policy.add_root_extends ~ident:"user.class/Task"
           ~has_extends:false)
        true;
      expect_equal "quick add"
        (Sqlite_policy.hide_page ~title:"Quick Add" ~quick_add_title:"Quick Add")
        true;
      expect_equal "import retracts"
        (Sqlite_policy.import_retract_idents |> Rrbvec.to_list)
        [
          "logseq.kv/graph-uuid";
          "logseq.kv/graph-local-tx";
          "logseq.kv/remote-schema-version";
          "logseq.kv/graph-rtc-e2ee?";
        ])
