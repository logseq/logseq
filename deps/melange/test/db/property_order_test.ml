open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let entry index order uuid : Property_order.entry = { index; order; uuid }

let () =
  Fest.test "DB property order sorts present orders before missing orders"
    (fun () ->
      let entries =
        Rrbvec.of_array
          [|
            entry 0 None "uuid-d";
            entry 1 (Some "a") "uuid-a";
            entry 2 None "uuid-e";
            entry 3 (Some "b") "uuid-b";
            entry 4 (Some "b") "uuid-c";
          |]
      in
      expect_equal "sorted indices"
        (Property_order.sort_indices entries |> Rrbvec.to_array)
        [| 1; 3; 4; 0; 2 |]);
  Fest.test "DB property order plans duplicate and missing order updates"
    (fun () ->
      let entries =
        Rrbvec.of_array
          [|
            entry 0 (Some "a0") "uuid-a";
            entry 1 (Some "bbb") "uuid-b";
            entry 2 (Some "bbb") "uuid-c";
            entry 3 None "uuid-d";
            entry 4 None "uuid-e";
          |]
      in
      let updates =
        Property_order.normalize_orders entries |> Rrbvec.to_array
      in
      expect_equal "updated indices"
        (Array.map
           (fun (update : Property_order.update) -> update.index)
           updates)
        [| 1; 2; 3; 4 |];
      expect_equal "updated orders"
        (Array.map
           (fun (update : Property_order.update) -> update.order)
           updates)
        [| "a0V"; "a1"; "a2"; "a3" |]);
  Fest.test
    "DB property order leaves unique orders and one missing order unchanged"
    (fun () ->
      let entries =
        Rrbvec.of_array
          [|
            entry 0 (Some "a0") "uuid-a";
            entry 1 (Some "a1") "uuid-b";
            entry 2 None "uuid-c";
          |]
      in
      expect_equal "no updates"
        (Property_order.normalize_orders entries |> Rrbvec.to_array)
        [||])
