module Uuid = Melange_common.Uuid

let fail message =
  Fest.expect |> Fest.equal message "";
  failwith message

let expect_equal label actual expected =
  if actual <> expected then fail (label ^ ": unexpected value")

let expect_raises label f =
  match f () with
  | _ -> fail (label ^ ": expected an exception")
  | exception _ -> ()

let () =
  Fest.test "UUID text validation preserves canonical shape behavior" (fun () ->
      [|
        ("", false);
        ("550e8400-e29b-41d4-a716-446655440000", true);
        ("550E8400-E29B-41D4-A716-446655440000", true);
        ("00000000-0000-0000-0000-000000000000", true);
        ("550e8400e29b41d4a716446655440000", false);
        ("550e8400-e29b-41d4-a716-44665544000", false);
        ("550e8400-e29b-41d4-a716-4466554400000", false);
        ("550e8400-e29b-41d4-a716-44665544000g", false);
        ("{550e8400-e29b-41d4-a716-446655440000}", false);
        (" 550e8400-e29b-41d4-a716-446655440000", false);
        ("页面8400-e29b-41d4-a716-446655440000", false);
      |]
      |> Array.iter (fun (value, expected) ->
          expect_equal value (Uuid.is_string value) expected));

  Fest.test "journal UUID families preserve deterministic composition"
    (fun () ->
      expect_equal "journal page"
        (Uuid.journal_page 20240101)
        "00000001-2024-0101-0000-000000000000";
      expect_equal "historical journal page"
        (Uuid.journal_page 19650201)
        "00000001-1965-0201-0000-000000000000";
      expect_equal "journal template"
        (Uuid.journal_template
           ~journal_uuid:"00000001-2026-0113-0000-000000000000"
           ~template_block_uuid:"12345678-1234-1234-1234-123456789abc")
        "00000005-2026-0113-0000-123456789abc";
      expect_raises "short journal day" (fun () -> Uuid.journal_page 1);
      expect_raises "long journal day" (fun () -> Uuid.journal_page 202401011));

  Fest.test "hash-derived UUID families preserve CLJS hash behavior" (fun () ->
      let page_namespace = Js.String.fromCodePointMany [| 0x9875; 0x9762 |] in
      let title_name = Js.String.fromCodePointMany [| 0x6807; 0x9898 |] in
      let unicode_builtin =
        Js.String.fromCodePointMany [| 0x9875; 0x9762; 0x1f642 |]
      in
      expect_equal "db ident"
        (Uuid.db_ident_block ~namespace_:(Some "block") ~name:"title")
        "00000002-7104-4568-4000-000000000000";
      expect_equal "unqualified db ident"
        (Uuid.db_ident_block ~namespace_:None ~name:"title")
        "00000002-6365-0558-3000-000000000000";
      expect_equal "Unicode db ident"
        (Uuid.db_ident_block ~namespace_:(Some page_namespace) ~name:title_name)
        "00000002-1755-5178-9900-000000000000";
      expect_equal "builtin string"
        (Uuid.builtin_block "Recycle")
        "00000004-7238-1304-3000-000000000000";
      expect_equal "empty builtin string" (Uuid.builtin_block "")
        "00000004-0000-0000-0000-000000000000";
      expect_equal "Unicode builtin string"
        (Uuid.builtin_block unicode_builtin)
        "00000004-1999-9557-4700-000000000000";
      expect_equal "negative string hash"
        (Uuid.builtin_block "polygenelubricants")
        "00000004-1718-2987-3200-000000000000";
      expect_equal "string hash collision" (Uuid.builtin_block "Aa")
        (Uuid.builtin_block "BB");
      expect_equal "builtin keyword"
        (Uuid.builtin_keyword_block ~namespace_:(Some "logseq.property")
           ~name:"empty-placeholder")
        "00000004-1595-0218-3700-000000000000";
      expect_equal "view block"
        (Uuid.view_block "550e8400-e29b-41d4-a716-446655440000gallery")
        "00000006-1979-0177-8500-000000000000")
