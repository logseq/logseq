open Melange_db

type node = { name : string; children : node Rrbvec.t }

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let () =
  Fest.test "DB SQLite build orders class properties deterministically"
    (fun () ->
      let constraints =
        Rrbvec.of_list
          [
            Rrbvec.of_list [ "p2"; "p1"; "p3" ];
            Rrbvec.of_list [ "p4"; "p2"; "p3" ];
            Rrbvec.of_list [ "p6"; "p5" ];
          ]
      in
      expect_equal "ordered"
        (Sqlite_build.class_property_order constraints |> Rrbvec.to_list)
        [ "p4"; "p2"; "p1"; "p3"; "p6"; "p5" ]);
  Fest.test "DB SQLite build rejects cyclic property constraints" (fun () ->
      let constraints =
        Rrbvec.of_list
          [ Rrbvec.of_list [ "p1"; "p2" ]; Rrbvec.of_list [ "p2"; "p1" ] ]
      in
      let failed =
        try
          ignore (Sqlite_build.class_property_order constraints);
          false
        with Invalid_argument _ -> true
      in
      expect_equal "cycle" failed true);
  Fest.test "DB SQLite build owns property schema inference decisions"
    (fun () ->
      let journal =
        Sqlite_build.property_schema ~collection:true
          (Sqlite_build.Page { journal = true })
      in
      expect_equal "journal type" journal.property_type "date";
      expect_equal "many" journal.cardinality (Some "many");
      let scalar =
        Sqlite_build.property_schema ~collection:false
          (Sqlite_build.Scalar "checkbox")
      in
      expect_equal "scalar" scalar.property_type "checkbox";
      expect_equal "one" scalar.cardinality None;
      let missing =
        Sqlite_build.property_schema ~collection:false Sqlite_build.Missing
      in
      expect_equal "missing" missing.property_type "default");
  Fest.test "DB SQLite build temp identifiers are explicit and isolated"
    (fun () ->
      let left = Sqlite_build.create_temp_id_state () in
      let right = Sqlite_build.create_temp_id_state () in
      expect_equal "left first" (Sqlite_build.next_temp_id left) (-1);
      expect_equal "left second" (Sqlite_build.next_temp_id left) (-2);
      expect_equal "right first" (Sqlite_build.next_temp_id right) (-1));
  Fest.test "DB SQLite build owns recursive block extraction" (fun () ->
      let blocks =
        Rrbvec.of_list
          [
            {
              name = "root";
              children =
                Rrbvec.of_list [ { name = "child"; children = Rrbvec.empty } ];
            };
            { name = "sibling"; children = Rrbvec.empty };
          ]
      in
      expect_equal "preorder"
        (Sqlite_build.extract_blocks
           ~children:(fun node -> node.children)
           ~apply:(fun node ->
             Rrbvec.of_list [ node.name; String.uppercase_ascii node.name ])
           blocks
        |> Rrbvec.to_list)
        [ "root"; "ROOT"; "child"; "CHILD"; "sibling"; "SIBLING" ]);
  Fest.test "DB SQLite build owns recursive block updates" (fun () ->
      let blocks =
        Rrbvec.of_list
          [
            {
              name = "root";
              children =
                Rrbvec.of_list [ { name = "child"; children = Rrbvec.empty } ];
            };
          ]
      in
      let result =
        Sqlite_build.update_blocks
          ~children:(fun node -> node.children)
          ~with_children:(fun node children -> { node with children })
          ~update:(fun node -> { node with name = node.name ^ "!" })
          blocks
      in
      expect_equal "updated root" (Rrbvec.nth result 0).name "root!";
      expect_equal "updated child"
        (Rrbvec.nth (Rrbvec.nth result 0).children 0).name "child!")
