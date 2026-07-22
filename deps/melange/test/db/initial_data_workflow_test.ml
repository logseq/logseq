open Melange_db

type datom = { key : string; entity : int; attribute : string; value : int }
type entity = { id : int }

let datom ?(attribute = "block/uuid") ?(value = 0) key entity =
  { key; entity; attribute; value }

let entity_datoms = function
  | 100 ->
      [|
        datom "shared" 100;
        datom ~attribute:"block/updated-at" "excluded" 100;
        datom "structured" 100;
      |]
  | 101 -> [| datom "shared" 100; datom "property" 101 |]
  | 102 -> [| datom "description" 102 |]
  | 103 -> [| datom "closed" 103 |]
  | 104 -> [| datom "user" 104 |]
  | 105 -> [| datom "list" 105 |]
  | 106 -> [| datom "file" 106 |]
  | 107 -> [| datom "recent" 107 |]
  | 108 -> [| datom "ident" 108 |]
  | 109 -> [| datom "favorites" 109 |]
  | 110 -> [| datom "favorite-child-1" 110 |]
  | 111 -> [| datom "favorite-child-2" 111 |]
  | 112 -> [| datom "favorite-link" 112 |]
  | 113 -> [| datom "contents" 113 |]
  | 114 -> [| datom "views" 114 |]
  | 115 -> [| datom "recycle" 115 |]
  | 116 -> [| datom "quick" 116 |]
  | _ -> [||]

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let () =
  Fest.test "DB initial data workflow owns assembly order and filtering"
    (fun () ->
      let calls = ref [] in
      let record value = calls := !calls @ [ value ] in
      let capabilities :
          ( string,
            string,
            entity,
            int,
            datom )
          Initial_data_workflow.capabilities =
        {
          schema =
            (fun database ->
              record ("schema:" ^ database);
              "schema");
          max_order =
            (fun database ->
              record ("max-order:" ^ database);
              Some "a0");
          reset_max_order =
            (fun value ->
              record ("reset:" ^ Option.value ~default:"missing" value));
          entity_by_ident =
            (fun _ -> function
              | "logseq.class/Property" -> Some { id = 901 }
              | "logseq.kv/graph-uuid" -> Some { id = 108 }
              | "logseq.property.user/email" -> Some { id = 999 }
              | _ -> None);
          entity_by_id = (fun _ id -> Some { id });
          entity_id = (fun entity -> entity.id);
          entity_ref =
            (fun entity field ->
              match (entity.id, field) with
              | 101, "logseq.property/description" -> Some { id = 102 }
              | 110, "block/link" -> Some { id = 112 }
              | _ -> None);
          entity_refs =
            (fun entity field ->
              match (entity.id, field) with
              | 109, "block/_page" -> [| { id = 110 }; { id = 111 } |]
              | _ -> [||]);
          resolve_ident =
            (function
            | "logseq.class/Tag" -> 900
            | "logseq.class/Property" -> 901
            | _ -> 0);
          attribute_datoms =
            (fun _ -> function
              | "block/closed-value-property" ->
                  [| datom ~value:700 "closed-scan" 103 |]
              | "logseq.property.user/email" ->
                  [| datom ~value:1 "user-scan" 104 |]
              | "logseq.property/order-list-type" ->
                  [|
                    datom ~value:105 "list-scan-1" 200;
                    datom ~value:105 "list-scan-2" 201;
                  |]
              | "file/path" -> [| datom "file-scan" 106 |]
              | _ -> [||]);
          attribute_value_datoms =
            (fun _ attribute value ->
              match (attribute, value) with
              | "block/tags", 900 -> [| datom ~value:900 "tag-scan" 100 |]
              | "block/tags", 901 -> [| datom ~value:901 "property-scan" 101 |]
              | _ -> [||]);
          entity_datoms = (fun _ id -> entity_datoms id);
          datom_entity = (fun value -> value.entity);
          datom_attribute = (fun value -> value.attribute);
          datom_value = (fun value -> value.value);
          equal_value = Int.equal;
          equal_datom = (fun left right -> String.equal left.key right.key);
          oldest_page_by_name =
            (fun _ -> function "$$$favorites" -> Some 109 | _ -> None);
          oldest_page_by_title =
            (fun _ -> function
              | "Contents" -> Some 113
              | "$$$views" -> Some 114
              | "Recycle" -> Some 115
              | _ -> None);
          built_in_page =
            (fun _ -> function "Quick add" -> Some { id = 116 } | _ -> None);
          recent_pages = (fun _ -> [| { id = 107 } |]);
        }
      in
      let names : Initial_data_workflow.page_names =
        {
          favorites = "$$$favorites";
          contents = "Contents";
          quick_add = "Quick add";
          views = "$$$views";
          recycle = "Recycle";
        }
      in
      let result =
        Initial_data_workflow.get_with capabilities names "database"
      in
      expect_equal "schema" result.schema "schema";
      expect_equal "initial data"
        (result.initial_data |> Array.to_list
        |> List.map (fun value -> value.key))
        [
          "ident";
          "shared";
          "structured";
          "property";
          "description";
          "closed";
          "user";
          "list";
          "favorites";
          "favorite-link";
          "favorite-child-1";
          "favorite-child-2";
          "recent";
          "file";
          "contents";
          "quick";
          "views";
          "recycle";
        ];
      expect_equal "workflow prefix"
        (!calls |> List.filteri (fun index _ -> index < 3))
        [ "max-order:database"; "reset:a0"; "schema:database" ]);
  Fest.test "DB initial data workflow requires the Property class" (fun () ->
      let capabilities :
          (unit, unit, entity, int, datom) Initial_data_workflow.capabilities =
        {
          schema = (fun () -> ());
          max_order = (fun () -> None);
          reset_max_order = (fun _ -> ());
          entity_by_ident = (fun () _ -> None);
          entity_by_id = (fun () _ -> None);
          entity_id = (fun entity -> entity.id);
          entity_ref = (fun _ _ -> None);
          entity_refs = (fun _ _ -> [||]);
          resolve_ident = (fun _ -> 0);
          attribute_datoms = (fun () _ -> [||]);
          attribute_value_datoms = (fun () _ _ -> [||]);
          entity_datoms = (fun () _ -> [||]);
          datom_entity = (fun value -> value.entity);
          datom_attribute = (fun value -> value.attribute);
          datom_value = (fun value -> value.value);
          equal_value = Int.equal;
          equal_datom = (fun left right -> String.equal left.key right.key);
          oldest_page_by_name = (fun () _ -> None);
          oldest_page_by_title = (fun () _ -> None);
          built_in_page = (fun () _ -> None);
          recent_pages = (fun () -> [||]);
        }
      in
      let names : Initial_data_workflow.page_names =
        {
          favorites = "favorites";
          contents = "contents";
          quick_add = "quick";
          views = "views";
          recycle = "recycle";
        }
      in
      let failed =
        try
          ignore (Initial_data_workflow.get_with capabilities names ());
          false
        with Invalid_argument _ -> true
      in
      expect_equal "missing Property class" failed true)
