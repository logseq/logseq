open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let names values = Rrbvec.to_array values

let entry_names entries =
  entries |> Rrbvec.map Class_catalog.ident |> Rrbvec.to_array

let () =
  Fest.test "DB class catalog preserves entries and source order" (fun () ->
      expect_equal "entry names"
        (entry_names Class_catalog.entries)
        [|
          "logseq.class/Root";
          "logseq.class/Tag";
          "logseq.class/Property";
          "logseq.class/Page";
          "logseq.class/Journal";
          "logseq.class/Whiteboard";
          "logseq.class/Task";
          "logseq.class/Comments";
          "logseq.class/Comment";
          "logseq.class/Query";
          "logseq.class/Card";
          "logseq.class/Cards";
          "logseq.class/Asset";
          "logseq.class/Code-block";
          "logseq.class/Quote-block";
          "logseq.class/Math-block";
          "logseq.class/Pdf-annotation";
          "logseq.class/Template";
        |];
      let comments = Rrbvec.nth Class_catalog.entries 7 in
      expect_equal "comments title" (Class_catalog.title comments) "Comments";
      expect_equal "comments properties"
        (Class_catalog.properties comments |> Rrbvec.to_array)
        [|
          ("logseq.property.class/hide-from-node", Class_catalog.Bool true);
          ( "logseq.property/icon",
            Class_catalog.Icon
              { icon_type = "tabler-icon"; id = "message-circle" } );
        |];
      expect_equal "comments schema"
        (Class_catalog.schema_properties comments |> Rrbvec.to_array)
        [| "logseq.property.comments/blocks" |];
      expect_equal "comments required schema"
        (Class_catalog.required_properties comments |> Rrbvec.to_array)
        [||]);
  Fest.test "DB class derived catalogs preserve legacy iteration order"
    (fun () ->
      expect_equal "page children"
        (names Class_catalog.page_children_classes)
        [| "logseq.class/Journal"; "logseq.class/Whiteboard" |];
      expect_equal "page classes"
        (names Class_catalog.page_classes)
        [|
          "logseq.class/Page";
          "logseq.class/Tag";
          "logseq.class/Property";
          "logseq.class/Journal";
          "logseq.class/Whiteboard";
        |];
      expect_equal "internal tags"
        (names Class_catalog.internal_tags)
        [|
          "logseq.class/Page";
          "logseq.class/Property";
          "logseq.class/Tag";
          "logseq.class/Root";
          "logseq.class/Asset";
        |];
      expect_equal "private tags"
        (names Class_catalog.private_tags)
        [|
          "logseq.class/Page";
          "logseq.class/Property";
          "logseq.class/Tag";
          "logseq.class/Asset";
          "logseq.class/Journal";
          "logseq.class/Whiteboard";
          "logseq.class/Pdf-annotation";
        |];
      expect_equal "block-kind tags"
        (names Class_catalog.block_kind_tags)
        [|
          "logseq.class/Cards";
          "logseq.class/Code-block";
          "logseq.class/Math-block";
          "logseq.class/Quote-block";
          "logseq.class/Query";
          "logseq.class/Pdf-annotation";
          "logseq.class/Template";
        |];
      expect_equal "disallowed inline tags"
        (names Class_catalog.disallowed_inline_tags)
        [|
          "logseq.class/Asset";
          "logseq.class/Quote-block";
          "logseq.class/Property";
          "logseq.class/Page";
          "logseq.class/Math-block";
          "logseq.class/Code-block";
          "logseq.class/Cards";
          "logseq.class/Whiteboard";
          "logseq.class/Journal";
          "logseq.class/Query";
          "logseq.class/Pdf-annotation";
          "logseq.class/Tag";
          "logseq.class/Template";
        |];
      expect_equal "extends-hidden tags"
        (names Class_catalog.extends_hidden_tags)
        (names Class_catalog.disallowed_inline_tags);
      expect_equal "hidden tags"
        (names Class_catalog.hidden_tags)
        [| "logseq.class/Page"; "logseq.class/Root"; "logseq.class/Asset" |])
