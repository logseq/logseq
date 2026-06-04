let assert_equal ~name expected actual =
  Alcotest.(check string) name expected actual

let contains ~needle haystack =
  let needle_len = String.length needle in
  let haystack_len = String.length haystack in
  let rec loop index =
    index + needle_len <= haystack_len
    &&
    if String.sub haystack index needle_len = needle then true
    else loop (index + 1)
  in
  needle_len = 0 || loop 0

let assert_contains ~name needle haystack =
  if not (contains ~needle haystack) then
    Alcotest.failf "%s\nexpected to contain: %S\nactual: %S" name needle
      haystack

let assert_not_contains ~name needle haystack =
  if contains ~needle haystack then
    Alcotest.failf "%s\nexpected to not contain: %S\nactual: %S" name needle
      haystack

let first_line text =
  match String.split_on_char '\n' text with line :: _ -> line | [] -> text

let char_width code =
  if
    code = 0 || code < 32
    || (code >= 0x7f && code < 0xa0)
    || (code >= 0x0300 && code <= 0x036f)
    || (code >= 0x1ab0 && code <= 0x1aff)
    || (code >= 0x1dc0 && code <= 0x1dff)
    || (code >= 0x20d0 && code <= 0x20ff)
    || (code >= 0xfe20 && code <= 0xfe2f)
  then 0
  else if
    code >= 0x1100
    && (code <= 0x115f || code = 0x2329 || code = 0x232a
       || (code >= 0x2e80 && code <= 0xa4cf && code <> 0x303f)
       || (code >= 0xac00 && code <= 0xd7a3)
       || (code >= 0xf900 && code <= 0xfaff)
       || (code >= 0xfe10 && code <= 0xfe19)
       || (code >= 0xfe30 && code <= 0xfe6f)
       || (code >= 0xff00 && code <= 0xff60)
       || (code >= 0xffe0 && code <= 0xffe6))
  then 2
  else 1

let utf8_char_width_at text index =
  let byte = Char.code text.[index] in
  if byte land 0x80 = 0 then (char_width byte, index + 1)
  else if byte land 0xe0 = 0xc0 && index + 1 < String.length text then
    let code =
      ((byte land 0x1f) lsl 6) lor (Char.code text.[index + 1] land 0x3f)
    in
    (char_width code, index + 2)
  else if byte land 0xf0 = 0xe0 && index + 2 < String.length text then
    let code =
      ((byte land 0x0f) lsl 12)
      lor ((Char.code text.[index + 1] land 0x3f) lsl 6)
      lor (Char.code text.[index + 2] land 0x3f)
    in
    (char_width code, index + 3)
  else if byte land 0xf8 = 0xf0 && index + 3 < String.length text then
    let code =
      ((byte land 0x07) lsl 18)
      lor ((Char.code text.[index + 1] land 0x3f) lsl 12)
      lor ((Char.code text.[index + 2] land 0x3f) lsl 6)
      lor (Char.code text.[index + 3] land 0x3f)
    in
    (char_width code, index + 4)
  else (1, index + 1)

let display_width text =
  let rec loop index width =
    if index >= String.length text then width
    else
      let char_width, next = utf8_char_width_at text index in
      loop next (width + char_width)
  in
  loop 0 0

let test_config () =
  let defaults = Cli_config.defaults () in
  {
    Cli_config.graph = None;
    repo = None;
    root_dir = defaults.root_dir;
    config_path = Cli_config.default_config_path defaults.root_dir;
    timeout_ms = defaults.timeout_ms;
    login_timeout_ms = defaults.login_timeout_ms;
    logout_timeout_ms = defaults.logout_timeout_ms;
    list_title_max_display_width = defaults.list_title_max_display_width;
    output_format = None;
    verbose = false;
    profile = false;
    ws_url = None;
    http_base = None;
    auth_path = None;
    id_token = None;
    access_token = None;
    refresh_token = None;
    base_url = None;
    owner_source = Cli_primitive.Unknown;
    project_dir = None;
    raw_file_config = None;
    profile_session = None;
  }

let test_config_with_title_width width =
  { (test_config ()) with list_title_max_display_width = width }

let isolated_config () =
  let root = Filename.temp_file "logseq-cli-human-output-" "" in
  Sys.remove root;
  {
    (test_config ()) with
    root_dir = root;
    config_path = Cli_config.default_config_path root;
  }

let cases () =
  assert_equal ~name:"humanize count uses grouped digits" "12,345"
    (Humanize_types.format_count 12345);

  assert_equal ~name:"humanize pluralizes non-trivial nouns" "parties"
    (Humanize_types.pluralize_noun 2 "party");

  assert_equal ~name:"humanize count with noun uses grouped digits and plural"
    "12,345 parties"
    (Humanize_types.format_count_with_noun 12345 "party");

  assert_equal ~name:"humanize filesize uses readable units" "3.0KB"
    (Humanize_types.format_filesize (Some 3000L));

  assert_equal ~name:"humanize missing filesize remains a dash" "-"
    (Humanize_types.format_filesize None);

  assert_equal ~name:"humanize relative datetime uses natural language"
    "1 hour ago"
    (Humanize_types.relative_datetime ~then_ms:0L ~now_ms:3_600_000L);

  let many_items = List.init 1000 (fun index -> Edn_util.int (index + 1)) in
  let result = Cli_result.ok Output.Mode.Human (Cli_result.Items many_items) in
  assert_contains ~name:"large human count footers are humanized" "Count: 1,000"
    (Format_types.format_result result (test_config ()));

  let result = Cli_result.ok Output.Mode.Human (Cli_result.Message "hello") in
  assert_equal ~name:"human message table output" "hello"
    (Format_types.format_result result (test_config ()));

  let empty_cell_table =
    Output.Human_output.create ~headers:[ "Name"; "Note" ]
      ~rows:[ [ "Home"; "" ] ]
      ()
  in
  assert_equal ~name:"empty table cells display as dash" "Name  Note\nHome  -"
    (Format.asprintf "%a" Output.Human_output.pp empty_cell_table);

  let time_table =
    Output.Human_output.create
      ~headers:[ "block/created-at"; "updated-at" ]
      ~rows:[ [ "0"; "1000" ] ]
      ()
  in
  let time_output = Format.asprintf "%a" Output.Human_output.pp time_table in
  assert_not_contains ~name:"created-at columns do not use fallback ms text"
    "ms ago" time_output;
  assert_not_contains ~name:"time columns do not render raw integers"
    "\n0  1000" time_output;

  let large_time_table =
    Output.Human_output.create
      ~headers:[ "block/created-at"; "updated-at" ]
      ~rows:[ [ "1700000000000"; "1780411164893" ] ]
      ()
  in
  let large_time_output =
    Format.asprintf "%a" Output.Human_output.pp large_time_table
  in
  assert_not_contains ~name:"large millisecond timestamps do not render raw"
    "1700000000000" large_time_output;
  assert_not_contains ~name:"large millisecond timestamps avoid zero years"
    "zero years" large_time_output;

  let field_value_time_table =
    Output.Human_output.create ~headers:[ "Field"; "Value" ]
      ~rows:[ [ "logseq.kv/graph-created-at"; "1700000000" ] ]
      ()
  in
  let field_value_time_output =
    Format.asprintf "%a" Output.Human_output.pp field_value_time_table
  in
  assert_not_contains
    ~name:"field value created-at rows do not use fallback ms text" "ms ago"
    field_value_time_output;
  assert_not_contains ~name:"field value time rows do not render raw integers"
    "1700000000" field_value_time_output;

  let list_page_value =
    Edn_util.map
      [
        ( Edn_util.keyword ":items",
          Edn_util.vector
            [
              Edn_util.map
                [
                  (Edn_util.keyword ":db/id", Edn_util.int 1);
                  (Edn_util.keyword ":block/title", Edn_util.string "Home");
                ];
            ] );
      ]
  in
  let result =
    Cli_result.ok ~command:Command_id.List_page Output.Mode.Human
      (Cli_result.Raw list_page_value)
  in
  assert_equal ~name:"list page human output is a table"
    "db/id  block/title\n1      Home\nCount: 1"
    (Format_types.format_result result (test_config ()));

  let login_value =
    Edn_util.map
      [
        (Edn_util.keyword ":auth-path", Edn_util.string "/tmp/auth.edn");
        (Edn_util.keyword ":opened", Edn_util.bool true);
      ]
  in
  let result =
    Cli_result.ok ~command:Command_id.Login Output.Mode.Human
      (Cli_result.Raw login_value)
  in
  assert_equal ~name:"login human output omits field headers"
    "auth-path  /tmp/auth.edn\nopened     true"
    (Format_types.format_result result (test_config ()));

  let logout_value =
    Edn_util.map
      [
        (Edn_util.keyword ":auth-path", Edn_util.string "/tmp/auth.edn");
        (Edn_util.keyword ":deleted", Edn_util.bool true);
      ]
  in
  let result =
    Cli_result.ok ~command:Command_id.Logout Output.Mode.Human
      (Cli_result.Raw logout_value)
  in
  assert_equal ~name:"logout human output omits field headers"
    "auth-path  /tmp/auth.edn\ndeleted    true"
    (Format_types.format_result result (test_config ()));

  let cleanup_value =
    Edn_util.map
      [
        (Edn_util.keyword ":checked", Edn_util.int 2);
        (Edn_util.keyword ":killed", Edn_util.vector []);
      ]
  in
  let result =
    Cli_result.ok ~command:Command_id.Server_cleanup Output.Mode.Human
      (Cli_result.Raw cleanup_value)
  in
  assert_equal ~name:"summary maps omit generic field value headers"
    "checked  2\nkilled   []"
    (Format_types.format_result result (test_config ()));

  let graph_list_value =
    Edn_util.map
      [
        ( Edn_util.keyword ":graphs",
          Edn_util.vector [ Edn_util.string "alpha"; Edn_util.string "beta" ] );
      ]
  in
  let result =
    Cli_result.ok ~command:Command_id.Graph_list Output.Mode.Human
      (Cli_result.Raw graph_list_value)
  in
  assert_equal ~name:"graph list human output is a graph table"
    "alpha\nbeta\nCount: 2"
    (Format_types.format_result result (isolated_config ()));

  let query_list_value =
    Edn_util.map
      [
        ( Edn_util.keyword ":queries",
          Edn_util.vector
            [
              Edn_util.map
                [
                  (Edn_util.keyword ":name", Edn_util.string "todo");
                  (Edn_util.keyword ":source", Edn_util.keyword ":builtin");
                ];
            ] );
      ]
  in
  let result =
    Cli_result.ok ~command:Command_id.Query_list Output.Mode.Human
      (Cli_result.Raw query_list_value)
  in
  assert_equal ~name:"query list human output is an inferred table"
    "name  source\ntodo  builtin\nCount: 1"
    (Format_types.format_result result (test_config ()));

  let result_ids_value =
    Edn_util.map
      [
        ( Edn_util.keyword ":result",
          Edn_util.vector [ Edn_util.int 10; Edn_util.int 11 ] );
      ]
  in
  let result =
    Cli_result.ok ~command:Command_id.Upsert_page Output.Mode.Human
      (Cli_result.Raw result_ids_value)
  in
  assert_equal ~name:"single result vector human output is a value table"
    "Value\n10\n11\nCount: 2"
    (Format_types.format_result result (test_config ()));

  let query_result_value =
    Edn_util.map
      [
        ( Edn_util.keyword ":result",
          Edn_util.vector
            [
              Edn_util.vector [ Edn_util.string "Home"; Edn_util.int 1 ];
              Edn_util.vector [ Edn_util.string "Journal"; Edn_util.int 2 ];
            ] );
      ]
  in
  let result =
    Cli_result.ok ~command:Command_id.Query Output.Mode.Human
      (Cli_result.Query_result query_result_value)
  in
  assert_equal ~name:"query result vectors render as a multi-column table"
    "Column 1  Column 2\nHome      1\nJournal   2\nCount: 2"
    (Format_types.format_result result (test_config ()))

let cjk_table_aligns_by_display_width () =
  assert_equal ~name:"test helper counts CJK display width" "4"
    (string_of_int (display_width "中文"));
  let cjk_table =
    Output.Human_output.create ~headers:[ "Title"; "Next" ]
      ~rows:[ [ "ABC"; "1" ]; [ "中文"; "2" ]; [ "日本語"; "3" ] ]
      ()
  in
  assert_equal ~name:"CJK cells align by display width"
    "Title   Next\nABC     1\n中文    2\n日本語  3"
    (Format.asprintf "%a" Output.Human_output.pp cjk_table)

let list_page_title_truncates_by_display_width () =
  let list_page_long_title_value =
    Edn_util.map
      [
        ( Edn_util.keyword ":items",
          Edn_util.vector
            [
              Edn_util.map
                [
                  (Edn_util.keyword ":db/id", Edn_util.int 1);
                  (Edn_util.keyword ":block/title", Edn_util.string "中文图谱Alpha");
                ];
              Edn_util.map
                [
                  (Edn_util.keyword ":db/id", Edn_util.int 2);
                  (Edn_util.keyword ":block/title", Edn_util.string "Home");
                ];
            ] );
      ]
  in
  let result =
    Cli_result.ok ~command:Command_id.List_page Output.Mode.Human
      (Cli_result.Raw list_page_long_title_value)
  in
  assert_equal
    ~name:"list page title column truncates by configured display width"
    "db/id  block/title\n1      中文…\n2      Home\nCount: 2"
    (Format_types.format_result result (test_config_with_title_width 6))

let search_block_header_order_keeps_full_title () =
  let search_block_value =
    Edn_util.map
      [
        ( Edn_util.keyword ":items",
          Edn_util.vector
            [
              Edn_util.map
                [
                  (Edn_util.keyword ":db/ident", Edn_util.keyword ":task");
                  ( Edn_util.keyword ":block/title",
                    Edn_util.string "EnglishLong" );
                  (Edn_util.keyword ":db/id", Edn_util.int 7);
                ];
            ] );
      ]
  in
  let result =
    Cli_result.ok ~command:Command_id.Search_block Output.Mode.Human
      (Cli_result.Raw search_block_value)
  in
  assert_equal ~name:"search block keeps db/id first and full block/title last"
    "db/id  db/ident  block/title\n7      task      EnglishLong\nCount: 1"
    (Format_types.format_result result (test_config_with_title_width 6))

let search_tag_header_order_keeps_full_title () =
  let search_tag_value =
    Edn_util.map
      [
        ( Edn_util.keyword ":items",
          Edn_util.vector
            [
              Edn_util.map
                [
                  (Edn_util.keyword ":db/ident", Edn_util.keyword ":project");
                  (Edn_util.keyword ":block/title", Edn_util.string "中文图谱Alpha");
                  (Edn_util.keyword ":db/id", Edn_util.int 8);
                ];
            ] );
      ]
  in
  let result =
    Cli_result.ok ~command:Command_id.Search_tag Output.Mode.Human
      (Cli_result.Raw search_tag_value)
  in
  assert_equal ~name:"search tag keeps full block/title last"
    "db/id  db/ident  block/title\n8      project   中文图谱Alpha\nCount: 1"
    (Format_types.format_result result (test_config_with_title_width 6))

let json_output_keeps_full_title () =
  let list_page_long_title_value =
    Edn_util.map
      [
        ( Edn_util.keyword ":items",
          Edn_util.vector
            [
              Edn_util.map
                [
                  (Edn_util.keyword ":db/id", Edn_util.int 1);
                  (Edn_util.keyword ":block/title", Edn_util.string "中文图谱Alpha");
                ];
            ] );
      ]
  in
  let result =
    Cli_result.ok ~command:Command_id.List_page Output.Mode.Json
      (Cli_result.Raw list_page_long_title_value)
  in
  let json_config =
    {
      (test_config_with_title_width 6) with
      output_format = Some (Output.Mode.Packed Output.Mode.Json);
    }
  in
  assert_contains ~name:"json output keeps full title" "中文图谱Alpha"
    (Format_types.format_result result json_config)

let timestamp_columns_are_last () =
  let timestamped_items_value =
    Edn_util.map
      [
        ( Edn_util.keyword ":items",
          Edn_util.vector
            [
              Edn_util.map
                [
                  (Edn_util.keyword ":block/updated-at", Edn_util.int 2000);
                  (Edn_util.keyword ":db/id", Edn_util.int 1);
                  (Edn_util.keyword ":block/title", Edn_util.string "Home");
                  (Edn_util.keyword ":block/created-at", Edn_util.int 1000);
                  (Edn_util.keyword ":block/uuid", Edn_util.string "u1");
                ];
            ] );
      ]
  in
  let result =
    Cli_result.ok Output.Mode.Human (Cli_result.Raw timestamped_items_value)
  in
  assert_equal
    ~name:"created-at and updated-at columns are last in inferred tables"
    "db/id  block/title  block/uuid  block/created-at  block/updated-at"
    (Format_types.format_result result (test_config ()) |> first_line)

let () =
  Alcotest.run "human output"
    [
      ( "formatting",
        [
          Alcotest.test_case "cases" `Quick cases;
          Alcotest.test_case "CJK table aligns by display width" `Quick
            cjk_table_aligns_by_display_width;
          Alcotest.test_case "list page title truncates by display width" `Quick
            list_page_title_truncates_by_display_width;
          Alcotest.test_case "search block keeps full title last" `Quick
            search_block_header_order_keeps_full_title;
          Alcotest.test_case "search tag keeps full title last" `Quick
            search_tag_header_order_keeps_full_title;
          Alcotest.test_case "json output keeps full title" `Quick
            json_output_keeps_full_title;
          Alcotest.test_case "timestamp columns are last" `Quick
            timestamp_columns_are_last;
        ] );
    ]
