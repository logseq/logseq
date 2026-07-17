module Config = Melange_common.Config
module Cognito_config = Melange_common.Cognito_config

let fail message =
  Fest.expect |> Fest.equal message "";
  failwith message

let expect_equal label actual expected =
  if actual <> expected then fail (label ^ ": unexpected value")

let () =
  Fest.test "configuration constants preserve shared names and paths" (fun () ->
      expect_equal "app name" Config.app_name "logseq";
      expect_equal "asset protocol" Config.asset_protocol "assets://";
      expect_equal "db prefix" Config.db_version_prefix "logseq_db_";
      expect_equal "file prefix" Config.file_version_prefix "logseq_local_";
      expect_equal "graphs directory" Config.default_graphs_dir
        "~/logseq/graphs";
      expect_equal "assets directory" Config.local_assets_dir "assets";
      expect_equal "unlinked directory" Config.unlinked_graphs_dir
        "Unlinked graphs";
      expect_equal "favorites" Config.favorites_page_name "$$$favorites";
      expect_equal "views" Config.views_page_name "$$$views";
      expect_equal "library" Config.library_page_name "Library";
      expect_equal "quick add" Config.quick_add_page_name "Quick add";
      expect_equal "recycle" Config.recycle_page_name "Recycle";
      expect_equal "block pattern" Config.block_pattern "-");

  Fest.test "repo prefix functions preserve display and canonical forms"
    (fun () ->
      [|
        ("graph", "graph");
        ("logseq_db_graph", "graph");
        ("logseq_db_logseq_db_graph", "logseq_db_graph");
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input
            (Config.strip_leading_db_version_prefix input)
            expected);
      [|
        ("", None);
        ("graph", Some "logseq_db_graph");
        ("logseq_db_graph", Some "logseq_db_graph");
        ("logseq_db_logseq_db_graph", Some "logseq_db_graph");
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input
            (Config.canonicalize_db_version_repo input)
            expected));

  Fest.test "asset and protocol predicates preserve URL behavior" (fun () ->
      [|
        ("assets/test.png", true);
        ("../assets/test.png", true);
        ("./assets/test.png", true);
        ("assets\\test.png", true);
        ("assets://test.png", false);
        ("http://assets/test.png", false);
        ("file://assets/test.png", false);
        ("xassets/test.png", false);
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Config.is_local_relative_asset input) expected);
      [|
        ("assets://", true);
        ("assets://test.png", true);
        ("file://assets/test.png", false);
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Config.is_local_protocol_asset input) expected);
      [|
        ("https://example.com/a", true);
        ("file:///tmp/a", true);
        ("assets://test.png", true);
        ("mailto:user@example.com", true);
        ("assets/test.png", false);
        ("//example.com/a", false);
        ("not a url", false);
        ("", false);
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Config.is_protocol_path input) expected);
      expect_equal "asset replacement"
        (Config.remove_asset_protocol "assets://folder/a.png")
        "file://folder/a.png";
      expect_equal "non-asset replacement"
        (Config.remove_asset_protocol "https://example.com/a.png")
        "https://example.com/a.png");

  Fest.test "format predicates preserve keyword-name membership" (fun () ->
      [| ("md", true); ("markdown", true); ("sh", true); ("pdf", false) |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Config.is_text_format input) expected);
      [| ("png", true); ("cr2", true); ("heic", false); ("mp4", false) |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Config.is_image_format input) expected);
      expect_equal "text format count"
        (Array.length (Config.text_format_keys ()))
        25;
      expect_equal "image format count"
        (Array.length (Config.image_format_keys ()))
        10);

  Fest.test "hidden paths preserve leading slash normalization" (fun () ->
      let patterns = [| ".git"; "/node_modules"; "logseq/bak" |] in
      [|
        (".git/config", true);
        ("/.git/config", true);
        ("node_modules/a.js", true);
        ("/node_modules/a.js", true);
        ("logseq/bak/a.md", true);
        ("pages/a.md", false);
      |]
      |> Array.iter (fun (input, expected) ->
          expect_equal input (Config.is_hidden input patterns) expected));

  Fest.test "file-only config keys preserve descriptions and order" (fun () ->
      let keys = Config.file_only_config_keys () in
      expect_equal "key count" (Array.length keys) 23;
      expect_equal "first key" keys.(0) "file/name-format";
      expect_equal "last key" keys.(22) "default-templates";
      expect_equal "common deprecation"
        (Config.file_only_config_description "hidden")
        (Some Config.unused_in_db_graphs_deprecation);
      expect_equal "special deprecation"
        (Config.file_only_config_description "preferred-format")
        (Some "is not used in DB graphs as there is only markdown mode.");
      expect_equal "unknown key"
        (Config.file_only_config_description "unknown")
        None);

  Fest.test "Cognito configuration preserves shared production values"
    (fun () ->
      expect_equal "web client" Cognito_config.cognito_client_id
        "69cs1lgme7p8kbgld8n5kseii6";
      expect_equal "CLI client" Cognito_config.cli_cognito_client_id
        "69cs1lgme7p8kbgld8n5kseii6";
      expect_equal "domain" Cognito_config.oauth_domain
        "logseq-prod.auth.us-east-1.amazoncognito.com";
      expect_equal "scope" Cognito_config.oauth_scope "email openid phone")
