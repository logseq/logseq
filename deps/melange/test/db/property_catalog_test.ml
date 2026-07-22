open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let find_entry ident =
  let entries = Property_catalog.entries |> Rrbvec.to_array in
  let rec find index =
    if index = Array.length entries then failwith ("missing entry: " ^ ident)
    else
      let entry = entries.(index) in
      if Property_catalog.ident entry = ident then entry else find (index + 1)
  in
  find 0

let names values = Rrbvec.to_array values

let () =
  Fest.test "DB built-in property catalog preserves typed entries" (fun () ->
      expect_equal "entry count" (Rrbvec.length Property_catalog.entries) 118;
      expect_equal "first entry"
        (Rrbvec.nth Property_catalog.entries 0 |> Property_catalog.ident)
        "logseq.property/type";
      expect_equal "last entry"
        (Rrbvec.nth Property_catalog.entries 117 |> Property_catalog.ident)
        "logseq.property.sync/large-title-object";
      let no_title = find_entry "logseq.property/ls-type" in
      expect_equal "absent title" (Property_catalog.title no_title) None;
      let external_url = find_entry "logseq.property.asset/external-url" in
      let external_schema = Property_catalog.schema external_url in
      expect_equal "explicit public"
        (Property_catalog.schema_public external_schema)
        (Some true);
      expect_equal "explicit visible"
        (Property_catalog.schema_hide external_schema)
        (Some false);
      expect_equal "explicit queryable"
        (Property_catalog.queryable external_url)
        (Some true);
      let hidden_choice = find_entry "logseq.property/choice-checkbox-state" in
      expect_equal "explicit non-queryable"
        (Property_catalog.queryable hidden_choice)
        (Some false);
      let assignee = find_entry "logseq.property/assignee" in
      expect_equal "schema classes"
        (Property_catalog.schema_classes (Property_catalog.schema assignee)
        |> Rrbvec.to_array)
        [| "logseq.class/Page" |]);
  Fest.test "DB built-in property closed values preserve exact metadata"
    (fun () ->
      let status = find_entry "logseq.property/status" in
      let values = Property_catalog.closed_values status in
      expect_equal "status count" (Rrbvec.length values) 6;
      let todo = Rrbvec.nth values 1 in
      expect_equal "todo ident"
        (Property_catalog.closed_value_ident todo)
        "logseq.property/status.todo";
      expect_equal "todo UUID"
        (Property_catalog.closed_value_uuid todo)
        "00000002-1615-5853-7700-000000000000";
      expect_equal "todo icon"
        (Property_catalog.closed_value_icon todo)
        (Some { Property_catalog.icon_type = "tabler-icon"; id = "Todo" });
      expect_equal "todo checkbox properties"
        (Property_catalog.closed_value_properties todo)
        (Property_catalog.Checkbox false);
      let frequency = find_entry "logseq.property.repeat/recur-frequency" in
      expect_equal "numeric default"
        (Property_catalog.properties frequency |> Rrbvec.to_array)
        [|
          ("logseq.property/hide-empty-value", Property_catalog.Bool true);
          ("logseq.property/default-value", Property_catalog.Int 1);
        |]);
  Fest.test "DB built-in property derived catalogs preserve legacy order"
    (fun () ->
      expect_equal "public DB attributes"
        (names Property_catalog.public_db_attribute_properties)
        [| "block/alias"; "block/tags" |];
      expect_equal "read-only properties"
        (names Property_catalog.read_only_properties)
        [| "logseq.property/built-in?" |];
      expect_equal "schema property mapping"
        (Property_catalog.schema_properties_map |> Rrbvec.to_array)
        [|
          ("cardinality", "db/cardinality");
          ("type", "logseq.property/type");
          ("hide?", "logseq.property/hide?");
          ("public?", "logseq.property/public?");
          ("ui-position", "logseq.property/ui-position");
          ("view-context", "logseq.property/view-context");
          ("classes", "logseq.property/classes");
        |];
      expect_equal "namespace count"
        (Rrbvec.length Property_catalog.logseq_property_namespaces)
        21;
      expect_equal "schema entries"
        (Property_catalog.schema_entries ~ident_of:Fun.id
           (Rrbvec.of_array
              [|
                ("block/title", 1);
                ("db/cardinality", 2);
                ("logseq.property/type", 3);
              |])
        |> Rrbvec.to_array)
        [| ("db/cardinality", 2); ("logseq.property/type", 3) |])
