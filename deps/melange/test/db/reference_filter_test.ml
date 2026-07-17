open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let node ?parent ?(refs = []) ?(children = []) ?(class_ok = true) id :
    Reference_filter.node =
  {
    id;
    parent;
    own_refs = Rrbvec.of_list refs;
    children = Rrbvec.of_list children;
    class_ok;
  }

let sorted values = values |> Rrbvec.to_list |> List.sort String.compare

type entity = {
  id : string;
  title : string option;
  refs : string array;
  linked : bool;
  built_in : bool;
}

let entity ?title ?(refs = [||]) ?(linked = false) ?(built_in = false) id =
  { id; title; refs; linked; built_in }

let () =
  Fest.test "DB reference filters prune includes below excluded branches"
    (fun () ->
      let result =
        Reference_filter.select
          (Rrbvec.of_list
             [
               node ~refs:[ "foo" ] ~children:[ "2" ] "1";
               node ~parent:"1" ~refs:[ "baz" ] ~children:[ "3" ] "2";
               node ~parent:"2" ~refs:[ "bar" ] "3";
               node ~refs:[ "foo" ] ~children:[ "5" ] "4";
               node ~parent:"4" ~refs:[ "bar" ] "5";
             ])
          ~top_ids:(Rrbvec.of_list [ "1"; "4" ])
          ~includes:(Rrbvec.of_list [ "bar" ])
          ~excludes:(Rrbvec.of_list [ "baz" ])
      in
      expect_equal "tops" (sorted result.top_ids) [ "4" ];
      expect_equal "children" (sorted result.child_ids) [ "5" ]);
  Fest.test "DB reference excludes apply to a node, not its ancestors"
    (fun () ->
      let result =
        Reference_filter.select
          (Rrbvec.of_list
             [
               node ~refs:[ "foo" ] ~children:[ "2" ] "1";
               node ~parent:"1" ~refs:[ "baz" ] ~children:[ "3" ] "2";
               node ~parent:"2" ~refs:[ "bar" ] "3";
             ])
          ~top_ids:(Rrbvec.of_list [ "1" ]) ~includes:Rrbvec.empty
          ~excludes:(Rrbvec.of_list [ "baz" ])
      in
      expect_equal "top remains" (sorted result.top_ids) [ "1" ];
      expect_equal "excluded children" (sorted result.child_ids) []);
  Fest.test "DB reference class exclusions still traverse descendants"
    (fun () ->
      let result =
        Reference_filter.select
          (Rrbvec.of_list
             [
               node ~refs:[ "foo" ] ~children:[ "2" ] "1";
               node ~parent:"1" ~refs:[ "bar" ] ~class_ok:false
                 ~children:[ "3" ] "2";
               node ~parent:"2" ~refs:[ "bar" ] "3";
             ])
          ~top_ids:(Rrbvec.of_list [ "1" ]) ~includes:(Rrbvec.of_list [ "bar" ])
          ~excludes:Rrbvec.empty
      in
      expect_equal "top expands from descendant" (sorted result.top_ids) [ "1" ];
      expect_equal "matched chain" (sorted result.child_ids) [ "2"; "3" ]);
  Fest.test "DB unlinked references own title scans and filtering" (fun () ->
      let values =
        [
          entity ~title:"Target Page" "1";
          entity ~title:"mentions target page" "2";
          entity ~title:"direct target page" ~refs:[| "1" |] "3";
          entity ~title:"linked target page" ~linked:true "4";
          entity ~title:"built-in target page" ~built_in:true "5";
          entity ~title:"other" "6";
        ]
      in
      let find id = List.find (fun value -> String.equal value.id id) values in
      let calls = ref [] in
      let result =
        Reference_filter.unlinked_with
          ~entity:(fun id ->
            calls := !calls @ [ "entity:" ^ id ];
            find id)
          ~title:(fun value -> value.title)
          ~title_datoms:(fun () ->
            calls := !calls @ [ "datoms" ];
            values
            |> List.filter_map (fun value ->
                Option.map (fun title -> (value.id, title)) value.title)
            |> Array.of_list)
          ~datom_entity:fst ~datom_title:snd ~id_equals:String.equal
          ~references:(fun value -> value.refs)
          ~linked:(fun value -> value.linked)
          ~built_in:(fun value -> value.built_in)
          ~lowercase:String.lowercase_ascii "1"
      in
      expect_equal "unlinked result"
        (result
        |> Option.map (fun entities ->
            entities |> Array.to_list |> List.map (fun value -> value.id)))
        (Some [ "2" ]);
      expect_equal "scan calls" !calls
        [ "entity:1"; "datoms"; "entity:2"; "entity:3"; "entity:4"; "entity:5" ];
      expect_equal "blank title"
        (Reference_filter.unlinked_with
           ~entity:(fun _ -> entity ~title:"  " "blank")
           ~title:(fun value -> value.title)
           ~title_datoms:(fun () -> assert false)
           ~datom_entity:fst ~datom_title:snd ~id_equals:String.equal
           ~references:(fun value -> value.refs)
           ~linked:(fun value -> value.linked)
           ~built_in:(fun value -> value.built_in)
           ~lowercase:String.lowercase_ascii "blank")
        None)
