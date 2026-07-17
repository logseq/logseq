open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let vector values = Rrbvec.of_array values

let () =
  Fest.test "DB SQLite GC repeats full collection until stable" (fun () ->
      let scans = ref 0 in
      let deleted = ref Rrbvec.empty in
      let capabilities : string Sqlite_gc_workflow.capabilities =
        {
          index_roots = (fun _ -> vector [| 10; 20; 30 |]);
          non_referenced =
            (fun _ ->
              incr scans;
              if !scans = 1 then vector [| 0; 40; 41 |]
              else if !scans = 2 then vector [| 42 |]
              else Rrbvec.empty);
          edges = (fun _ -> Rrbvec.empty);
          delete =
            (fun _ addresses ->
              deleted := Rrbvec.push_back !deleted (Rrbvec.to_array addresses));
          address_count = (fun _ -> 6);
        }
      in
      Sqlite_gc_workflow.collect_wasm_with capabilities (Some "db")
        ~full_gc:true;
      expect_equal "scan count" !scans 3;
      expect_equal "deletion batches" (Rrbvec.to_array !deleted)
        [| [| 40; 41 |]; [| 42 |] |]);
  Fest.test "DB SQLite GC skips missing WASM databases" (fun () ->
      let called = ref false in
      let capabilities : string Sqlite_gc_workflow.capabilities =
        {
          index_roots = (fun _ -> Rrbvec.empty);
          non_referenced =
            (fun _ ->
              called := true;
              Rrbvec.empty);
          edges = (fun _ -> Rrbvec.empty);
          delete = (fun _ _ -> ());
          address_count = (fun _ -> 0);
        }
      in
      Sqlite_gc_workflow.collect_wasm_with capabilities None ~full_gc:true;
      expect_equal "no scan" !called false);
  Fest.test "DB SQLite GC walk mode deletes unreachable addresses once"
    (fun () ->
      let scans = ref 0 in
      let deleted = ref Rrbvec.empty in
      let capabilities : string Sqlite_gc_workflow.capabilities =
        {
          index_roots = (fun _ -> vector [| 10 |]);
          non_referenced =
            (fun _ -> failwith "walk mode must not use the recursive query");
          edges =
            (fun _ ->
              incr scans;
              vector
                [|
                  (10, vector [| 11 |]); (11, Rrbvec.empty); (12, Rrbvec.empty);
                |]);
          delete =
            (fun _ addresses ->
              deleted := Rrbvec.push_back !deleted (Rrbvec.to_array addresses));
          address_count = (fun _ -> 5);
        }
      in
      Sqlite_gc_workflow.collect_node_with capabilities "db" ~walk:true;
      expect_equal "walk scans" !scans 1;
      expect_equal "unreachable deletion" (Rrbvec.to_array !deleted)
        [| [| 12 |] |]);
  Fest.test "DB SQLite GC reports whether recursive garbage remains" (fun () ->
      let capabilities : string Sqlite_gc_workflow.capabilities =
        {
          index_roots = (fun _ -> vector [| 10; 20; 30 |]);
          non_referenced = (fun _ -> vector [| 0; 1; 99 |]);
          edges = (fun _ -> Rrbvec.empty);
          delete = (fun _ _ -> ());
          address_count = (fun _ -> 0);
        }
      in
      expect_equal "garbage remains"
        (Sqlite_gc_workflow.ensure_no_garbage_with capabilities "db")
        false)
