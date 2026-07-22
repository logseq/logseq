open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let node id extends : Class_read.node = { id; extends = Rrbvec.of_list extends }
let object_candidate id hidden : Class_read.object_candidate = { id; hidden }

type entity = { entity_id : int; entity_extends : entity array }

let () =
  Fest.test "DB class reads preserve extends traversal order" (fun () ->
      expect_equal "diamond"
        (Class_read.extends_ids ~root_id:1
           (Rrbvec.of_list
              [ node 1 [ 2; 3 ]; node 2 [ 4 ]; node 3 [ 4 ]; node 4 [] ])
        |> Rrbvec.to_list)
        [ 4; 3; 2 ];
      let rec root = { entity_id = 1; entity_extends = [| left; right |] }
      and left = { entity_id = 2; entity_extends = [| leaf |] }
      and right = { entity_id = 3; entity_extends = [| leaf |] }
      and leaf = { entity_id = 4; entity_extends = [||] } in
      expect_equal "entity traversal"
        (Class_read.extends_entities_with
           ~entity_id:(fun entity -> entity.entity_id)
           ~entity_extends:(fun entity -> entity.entity_extends)
           root
        |> Array.to_list
        |> List.map (fun entity -> entity.entity_id))
        [ 4; 3; 2 ]);
  Fest.test "DB class reads own structured-child query construction" (fun () ->
      let query_form = ref None in
      let children =
        Class_read.structured_children_with
          ~encode_form:(fun form ->
            query_form := Some form;
            "query")
          ~query:(fun form inputs ->
            expect_equal "encoded query" form "query";
            expect_equal "query inputs" (Array.to_list inputs) [ "1"; "rule" ];
            "result")
          ~collection_to_array:(fun result ->
            expect_equal "query result" result "result";
            [| "1"; "2"; "3" |])
          ~value_equals:String.equal ~root:"1" ~rule:"rule"
      in
      expect_equal "children" (Array.to_list children) [ "2"; "3" ];
      match !query_form with
      | Some (Datalog_form.Vector_form values) ->
          expect_equal "query form size" (Rrbvec.length values) 8
      | _ -> failwith "expected a typed Datalog vector");
  Fest.test "DB class reads own class-object query and filtering" (fun () ->
      let calls = ref [] in
      let entities =
        Class_read.objects_with
          ~encode_form:(fun _ -> "query")
          ~query:(fun form inputs ->
            calls :=
              !calls
              @ [
                  "query:" ^ form ^ ":"
                  ^ String.concat "," (Array.to_list inputs);
                ];
            "children")
          ~collection_to_array:(fun result ->
            expect_equal "children result" result "children";
            [| "root"; "child" |])
          ~value_equals:String.equal
          ~datoms:(fun index components ->
            calls :=
              !calls
              @ [
                  "datoms:" ^ index ^ ":"
                  ^ String.concat "," (Array.to_list components);
                ];
            match components.(1) with
            | "root" -> [| "root-visible"; "duplicate" |]
            | "child" -> [| "child-hidden"; "duplicate" |]
            | value -> failwith ("unexpected class: " ^ value))
          ~datom_entity:(function
            | "root-visible" -> "10"
            | "child-hidden" -> "20"
            | "duplicate" -> "10"
            | value -> failwith ("unexpected datom: " ^ value))
          ~entity:(fun id ->
            calls := !calls @ [ "entity:" ^ id ];
            Some ("entity-" ^ id))
          ~hidden:(fun entity ->
            calls := !calls @ [ "hidden:" ^ entity ];
            String.equal entity "entity-20")
          ~root:"root" ~rule:"rule" ~index:"avet" ~attribute:"block/tags"
      in
      expect_equal "visible entities" (Array.to_list entities) [ "entity-10" ];
      expect_equal "workflow calls" !calls
        [
          "query:query:root,rule";
          "datoms:avet:block/tags,root";
          "datoms:avet:block/tags,child";
          "entity:10";
          "hidden:entity-10";
          "entity:20";
          "hidden:entity-20";
        ]);
  Fest.test "DB class reads deduplicate and filter object candidates" (fun () ->
      expect_equal "objects"
        (Class_read.object_ids
           (Rrbvec.of_list
              [
                object_candidate 10 false;
                object_candidate 10 false;
                object_candidate 20 true;
                object_candidate 30 false;
              ])
        |> Rrbvec.to_list)
        [ 10; 30 ]);
  Fest.test "DB class reads classify namespace text" (fun () ->
      expect_equal "logseq class" (Class_read.logseq_class "logseq.class") true;
      expect_equal "other namespace"
        (Class_read.logseq_class "user.class")
        false;
      expect_equal "user class"
        (Class_read.user_class_namespace "plugin.class.task")
        true;
      expect_equal "plain namespace"
        (Class_read.user_class_namespace "logseq.property")
        false)
