open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let option_name to_string = Option.map to_string

let entry_tuple entry =
  ( Schema.keyword entry,
    option_name Schema.uniqueness_to_string (Schema.uniqueness entry),
    option_name Schema.value_type_to_string (Schema.value_type entry),
    Schema.indexed entry,
    option_name Schema.cardinality_to_string (Schema.cardinality entry) )

let names values = values |> Rrbvec.to_array

let () =
  Fest.test "DB schema preserves entries and legacy map order" (fun () ->
      expect_equal "schema entries"
        (Schema.entries |> Rrbvec.map entry_tuple |> Rrbvec.to_array)
        [|
          ("file/created-at", None, None, false, None);
          ("block/tx-id", None, None, false, None);
          ("file/content", None, None, false, None);
          ( "block/alias",
            None,
            Some "db.type/ref",
            true,
            Some "db.cardinality/many" );
          ("kv/value", None, None, false, None);
          ("block/link", None, Some "db.type/ref", true, None);
          ("block/uuid", Some "db.unique/identity", None, false, None);
          ("block/updated-at", None, None, true, None);
          ("file/size", None, None, false, None);
          ( "block/refs",
            None,
            Some "db.type/ref",
            false,
            Some "db.cardinality/many" );
          ( "block/closed-value-property",
            None,
            Some "db.type/ref",
            false,
            Some "db.cardinality/many" );
          ("file/last-modified-at", None, None, false, None);
          ("block/created-at", None, None, true, None);
          ("block/collapsed?", None, None, false, None);
          ("block/journal-day", None, None, true, None);
          ( "block/tags",
            None,
            Some "db.type/ref",
            false,
            Some "db.cardinality/many" );
          ("block/title", None, None, true, None);
          ("db/ident", Some "db.unique/identity", None, false, None);
          ("block/parent", None, Some "db.type/ref", true, None);
          ("block/order", None, None, true, None);
          ("block/page", None, Some "db.type/ref", true, None);
          ("block/name", None, None, true, None);
          ("file/path", Some "db.unique/identity", None, false, None);
        |]);
  Fest.test "DB schema derived attribute catalogs preserve legacy order"
    (fun () ->
      expect_equal "retract"
        (names Schema.retract_attributes)
        [| "block/warning" |];
      expect_equal "ref"
        (names Schema.ref_type_attributes)
        [|
          "block/alias";
          "block/link";
          "block/refs";
          "block/closed-value-property";
          "block/tags";
          "block/parent";
          "block/page";
        |];
      expect_equal "many"
        (names Schema.card_many_attributes)
        [|
          "block/alias";
          "block/refs";
          "block/closed-value-property";
          "block/tags";
        |];
      expect_equal "many ref"
        (names Schema.card_many_ref_type_attributes)
        [|
          "block/alias";
          "block/refs";
          "block/closed-value-property";
          "block/tags";
        |];
      expect_equal "one ref"
        (names Schema.card_one_ref_type_attributes)
        [| "block/link"; "block/parent"; "block/page" |];
      expect_equal "non ref"
        (names Schema.db_non_ref_attributes)
        [|
          "file/created-at";
          "block/tx-id";
          "file/content";
          "kv/value";
          "block/uuid";
          "block/updated-at";
          "file/size";
          "file/last-modified-at";
          "block/created-at";
          "block/collapsed?";
          "block/journal-day";
          "block/title";
          "db/ident";
          "block/order";
          "block/name";
          "file/path";
        |])
