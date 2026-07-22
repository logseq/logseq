open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let row index keys : View_order.row = { index; keys = Rrbvec.of_list keys }

let sorted rows directions =
  View_order.sort_indices (Rrbvec.of_list rows) (Rrbvec.of_list directions)
  |> Rrbvec.to_list

let () =
  Fest.test "DB view ordering sorts typed scalar values" (fun () ->
      expect_equal "number asc"
        (sorted
           [
             row 0 [ View_order.Number 10. ];
             row 1 [ Number 2. ];
             row 2 [ Number 1. ];
           ]
           [ View_order.Asc ])
        [ 2; 1; 0 ];
      expect_equal "text desc"
        (sorted
           [
             row 0 [ View_order.Text "a" ];
             row 1 [ Text "c" ];
             row 2 [ Text "b" ];
           ]
           [ View_order.Desc ])
        [ 1; 2; 0 ];
      expect_equal "bool asc"
        (sorted
           [ row 0 [ View_order.Bool true ]; row 1 [ Bool false ] ]
           [ View_order.Asc ])
        [ 1; 0 ]);
  Fest.test "DB view ordering preserves missing and stable equal values"
    (fun () ->
      expect_equal "missing asc"
        (sorted
           [
             row 0 [ View_order.Number 1. ];
             row 1 [ Missing ];
             row 2 [ Number 1. ];
           ]
           [ View_order.Asc ])
        [ 1; 0; 2 ];
      expect_equal "missing desc"
        (sorted
           [
             row 0 [ View_order.Number 1. ];
             row 1 [ Missing ];
             row 2 [ Number 1. ];
           ]
           [ View_order.Desc ])
        [ 0; 2; 1 ]);
  Fest.test "DB view ordering applies minor keys only after major equality"
    (fun () ->
      expect_equal "multi"
        (sorted
           [
             row 0 [ View_order.Text "a"; Number 1. ];
             row 1 [ Text "b"; Number 9. ];
             row 2 [ Text "a"; Number 3. ];
             row 3 [ Text "a"; Number 2. ];
           ]
           [ View_order.Asc; Desc ])
        [ 2; 3; 0; 1 ]);
  Fest.test "DB view ordering supports an explicit missing-last policy"
    (fun () ->
      expect_equal "missing last asc"
        (View_order.sort_indices_with_missing_last
           (Rrbvec.of_list
              [
                row 0 [ View_order.Missing ];
                row 1 [ Number 2. ];
                row 2 [ Number 1. ];
              ])
           (Rrbvec.of_list [ View_order.Asc ])
           (Rrbvec.of_list [ true ])
        |> Rrbvec.to_list)
        [ 2; 1; 0 ];
      expect_equal "missing first desc"
        (View_order.sort_indices_with_missing_last
           (Rrbvec.of_list
              [
                row 0 [ View_order.Missing ];
                row 1 [ Number 2. ];
                row 2 [ Number 1. ];
              ])
           (Rrbvec.of_list [ View_order.Desc ])
           (Rrbvec.of_list [ true ])
        |> Rrbvec.to_list)
        [ 0; 1; 2 ])
