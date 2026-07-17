open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let child ?(excluded = false) id order : Tree_read.child =
  { id; order; excluded }

let node id order children : Tree_read.node =
  { id; order; children = Rrbvec.of_list children }

let () =
  Fest.test "DB tree reads sort stable fractional orders" (fun () ->
      expect_equal "sort"
        (Tree_read.sort_ids
           (Rrbvec.of_list
              [ child 1 "a2"; child 2 "a0"; child 3 "a1"; child 4 "a1" ])
        |> Rrbvec.to_list)
        [ 2; 3; 4; 1 ]);
  Fest.test "DB tree reads select eligible siblings" (fun () ->
      let children =
        Rrbvec.of_list
          [
            child 1 "a0";
            child ~excluded:true 2 "a1";
            child 3 "a2";
            child 4 "a3";
          ]
      in
      expect_equal "right"
        (Tree_read.neighbor_id ~direction:Right ~current_order:"a0" children)
        (Some 3);
      expect_equal "left"
        (Tree_read.neighbor_id ~direction:Left ~current_order:"a3" children)
        (Some 3);
      expect_equal "none"
        (Tree_read.neighbor_id ~direction:Right ~current_order:"a3" children)
        None);
  Fest.test "DB tree reads traverse children in preorder" (fun () ->
      expect_equal "preorder"
        (Tree_read.preorder_ids ~root_id:0
           (Rrbvec.of_list
              [
                node 0 "root" [ 1; 2 ];
                node 1 "a1" [ 3; 4 ];
                node 2 "a0" [];
                node 3 "b1" [];
                node 4 "b0" [];
              ])
        |> Rrbvec.to_list)
        [ 2; 1; 4; 3 ])
