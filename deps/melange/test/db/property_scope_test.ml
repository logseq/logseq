open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let entry index id scope_ids recycled : Property_scope.entry =
  { index; id = Some id; scope_ids = Rrbvec.of_array scope_ids; recycled }

type value = {
  value_id : string option;
  scopes : string array;
  recycled : bool;
  exclusions : value array;
}

let value ?id ?(scopes = [||]) ?(recycled = false) ?(exclusions = [||]) () =
  { value_id = id; scopes; recycled; exclusions }

type closed_value = {
  closed_id : string;
  order : string option;
  deleted : bool;
  content : string;
}

let closed_value ?order ?(deleted = false) closed_id content =
  { closed_id; order; deleted; content }

let () =
  Fest.test "DB property scope keeps global and matching class choices"
    (fun () ->
      let entries =
        Rrbvec.of_array
          [|
            entry 0 "global" [||] false;
            entry 1 "class-a" [| "class-a" |] false;
            entry 2 "class-b" [| "class-b" |] false;
            entry 3 "recycled" [||] true;
          |]
      in
      expect_equal "selected indices"
        (Property_scope.filter_indices entries
           ~class_ids:(Rrbvec.of_array [| "class-a" |])
           ~excluded_ids:Rrbvec.empty
        |> Rrbvec.to_array)
        [| 0; 1 |]);
  Fest.test "DB property scope excludes global choices by class" (fun () ->
      let entries =
        Rrbvec.of_array
          [|
            entry 0 "global-a" [||] false;
            entry 1 "global-b" [||] false;
            entry 2 "scoped" [| "class-a" |] false;
          |]
      in
      expect_equal "selected indices"
        (Property_scope.filter_indices entries
           ~class_ids:(Rrbvec.of_array [| "class-a" |])
           ~excluded_ids:(Rrbvec.of_array [| "global-b" |])
        |> Rrbvec.to_array)
        [| 0; 2 |]);
  Fest.test "DB property scope rejects scoped choices without a matching class"
    (fun () ->
      let entries =
        Rrbvec.of_array
          [|
            entry 0 "global" [||] false; entry 1 "scoped" [| "class-a" |] false;
          |]
      in
      expect_equal "selected indices"
        (Property_scope.filter_indices entries ~class_ids:Rrbvec.empty
           ~excluded_ids:Rrbvec.empty
        |> Rrbvec.to_array)
        [| 0 |]);
  Fest.test "DB property scope owns value and class extraction" (fun () ->
      let global = value ~id:"global" () in
      let scoped = value ~id:"scoped" ~scopes:[| "class" |] () in
      let excluded = value ~id:"excluded" () in
      let deleted = value ~id:"deleted" ~recycled:true () in
      let class_value = value ~id:"class" ~exclusions:[| excluded |] () in
      let result =
        Property_scope.filter_values_with
          ~id_text:(fun value -> value.value_id)
          ~scope_ids:(fun value -> value.scopes)
          ~recycled:(fun value -> value.recycled)
          ~class_id:(fun value -> value.value_id)
          ~class_entity:true ~block_id:(Some "class")
          ~exclusions:(fun value -> value.exclusions)
          ~values:[| global; scoped; excluded; deleted |]
          ~classes:[| class_value |]
      in
      expect_equal "scoped values" (Array.to_list result) [ global; scoped ]);
  Fest.test "DB property scope owns closed value lookup filtering and order"
    (fun () ->
      let missing = closed_value "missing" "Missing" in
      let first = closed_value ~order:"a0" "first" "First" in
      let second = closed_value ~order:"a1" "second" "Second" in
      let deleted =
        closed_value ~order:"a2" ~deleted:true "deleted" "Deleted"
      in
      let lookup = function
        | "property" -> Some [| second; deleted; missing; first |]
        | _ -> None
      in
      let values = Fun.id in
      let result =
        Property_scope.closed_values_with ~lookup ~values
          ~recycled:(fun value -> value.deleted)
          ~order:(fun value -> value.order)
          "property"
      in
      expect_equal "ordered values" result (Some [| missing; first; second |]);
      expect_equal "missing property"
        (Property_scope.closed_values_with ~lookup ~values
           ~recycled:(fun value -> value.deleted)
           ~order:(fun value -> value.order)
           "absent")
        None;
      expect_equal "value by content"
        (Property_scope.find_closed_value_with ~lookup ~values
           ~recycled:(fun value -> value.deleted)
           ~order:(fun value -> value.order)
           ~content:(fun value -> value.content)
           ~equals:String.equal "property" "Second")
        (Some second))
