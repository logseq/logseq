(* 1:1 translation of
   src/test/frontend/worker/markdown_mirror_test.cljs (51 deftests).

   cljs deftest names are kept as OCaml test names.

   Fixture / harness mapping:

   - cljs fake-platform (in-memory :files / :writes / :deletes atoms) —
     the OCaml port has no platform injection: Markdown_mirror performs IO
     through the global File_sys module. Tests write real files under
     (Markdown_mirror.repo_mirror_dir repo), a relative path
     ("graph-xxx/mirror/markdown"). Each fs-touching test runs inside
     with_mirror_fs, which creates the mirror pages/journals dirs up front
     (native File_sys.write_text_atomic does not create parent dirs, unlike
     the cljs platform write-text-atomic!) and removes the graph dir
     afterwards. cljs atom observation maps to:
       @files   -> read_file_opt / file_exists on the real mirror path
       @writes  -> the returned result wire (:status "written"/"skipped"
                   + :path) plus final file content; the exact write *count*
                   is not observable (documented divergence).
       @deletes -> file absence.
   - cljs {:platform platform} opt -> Markdown_mirror.opts.
     {:runtime :browser :owner-source :electron} is expressed via
     supported_runtime_override (Runtime_env.kind () is always Native on
     this target, so the cljs browser/electron distinction is emulated by
     the override, not by env).
   - cljs async p/let chains -> synchronous [run] (native
     Db_worker_effect resolves callbacks immediately).
   - cljs (d/with @conn tx-data) -> Datascript.with_tx_string;
     (d/reset-conn! conn (:db-after r)) -> Datascript.reset_conn_bang.
   - cljs (ldb/transact! conn ops {:outliner-op ...}) ->
     Db_tx.transact ~tx_meta conn ops.
   - cljs (resolve 'markdown-mirror/<mirror-repo!) presence check -> direct
     Markdown_mirror.mirror_repo call (always present).
   - cljs (with-redefs worker-platform/current ...) in
     db-listener-transact-writes-updated-page-mirror-test is unnecessary
     here: the OCaml "markdown-mirror" deferred listener calls
     Markdown_mirror.handle_tx_report directly with
     {default_opts with defer = true} — no platform injection exists.
   - db_test_util fixture DSL (create_conn_with_blocks +
     pages_and_blocks/block_decl/page_decl) mirrors cljs
     db-test/create-conn-with-blocks options. Divergence: :build/children
     inside a {:build/property-value :block ...} map is not expanded by the
     OCaml fixture, so property-value child blocks are attached with an
     explicit follow-up transact (page-mirror-exports-default-property-
     value-children-test, page-mirror-does-not-export-url-property-value-
     children-test).
   - cljs (random-uuid) -> fixed uuid literals (Uuid_gen.uuid ()).
  - cljs ontology gaps in initial_data_edn are patched per test with
    :build/pre-txs helpers: status_ontology_pre_txs (the
    logseq.property/status.* closed-value entities + the status
    property's :logseq.property/default-value) and
    hidden_built_in_property_pre_txs (:logseq.property/hide? true on the
    logseq.property/created-from-property and logseq.property/built-in?
    property entities — cljs built-in-properties marks both :hide? true).
  - cljs entity-plus lookup-kv falls back to the property entity's
    :logseq.property/default-value when a block has no property datom;
    Ldb.value/ref_ent read raw datoms only, so
    page-mirror-emits-todo-for-task-with-default-status-test emulates
    the fallback via resolved_status_ident for its db assertion.

   All 51 deftests are ported; none skipped.

   KNOWN LIB BUGS (failing tests document OCaml-side divergences from
   cljs semantics; lib/ is intentionally untouched):

   1. Export_file.node_children reads :block/_parent unfiltered
      (Ldb.ref_ents), while cljs entity-plus :block/_parent removes
      children that carry :logseq.property/created-from-property or
      :block/closed-value-property (the filtered variant exists as
      Ldb.parent_children but is not used here). Property-value blocks
      therefore leak into the exported outline as extra
      "- * prop:: value" lines, including under the page root and inside
      their owner block's subtree. Failing: property-value-lines-do-not-
      render-db-id-comments-test, page-mirror-exports-property-values-
      test, page-mirror-preserves-numbered-list-markers-status-and-tags-
      test, page-mirror-exports-default-property-value-children-test,
      page-mirror-does-not-export-url-property-value-children-test,
      page-mirror-exports-page-property-values-test,
      journal-mirror-exports-page-and-block-property-values-test.
   2. Markdown_mirror.block_line_info resolves :logseq.property/status
      via Ldb.value only — no :logseq.property/default-value fallback
      (cljs entity-plus lookup-kv). A Task block without a status datom
      gets no TODO marker. Failing:
      page-mirror-emits-todo-for-task-with-default-status-test.
   3. Markdown_mirror.decorate_rendered_content splices the multi-line
      result of decorate_block_line (embed rendering) via
      `List.rev_append (List.rev decorated) out'` — the double reversal
      re-inverts the decorated lines, so an embedded node's subtree
      comes out children-first. Failing:
      page-mirror-renders-embedded-node-content-and-tags-test.
   4. Markdown_mirror.mirror_page drops write_if_changed's reason —
      the wire result carries :status :skipped but no :reason
      "unchanged" — so run_job's rename path never sees
      skipped+unchanged and keeps the old mirror file on a
      content-unchanged rename. Failing:
      rename-with-unchanged-content-removes-old-mirror-path-test. *)

open Datascript
open Test_shared
module MM = Markdown_mirror

let repo = "logseq_db_graph-xxx"

let opts = MM.default_opts

let page_path rel = MM.mirror_path repo rel

let mirror_dir () = MM.repo_mirror_dir repo

(* encoded graph dir — "graph-xxx" *)
let mirror_root () =
  Filename.dirname (Filename.dirname (mirror_dir ()))

(* ---------- generic effect runner (cljs await) ---------- *)

let run (t : 'a Db_worker_effect.t) : 'a =
  let result = ref None in
  Db_worker_effect.on_any t (fun v -> result := Some v) (fun e -> raise e);
  match !result with
  | Some v -> v
  | None -> failwith "effect still pending"

let run_catching (t : 'a Db_worker_effect.t) : ('a, exn) result =
  let result = ref (Error (Failure "pending")) in
  Db_worker_effect.on_any t
    (fun v -> result := Ok v)
    (fun e -> result := Error e);
  !result

(* ---------- mirror fs fixture ---------- *)

let write_file path contents =
  let oc = open_out_bin path in
  output_string oc contents;
  close_out oc

let read_file_opt path =
  if Sys.file_exists path && not (Sys.is_directory path) then
    let ic = open_in_bin path in
    let n = in_channel_length ic in
    let s = really_input_string ic n in
    close_in ic;
    Some s
  else None

let file_exists path = Sys.file_exists path && not (Sys.is_directory path)

let check_file name path expected =
  Alcotest.(check (option string)) name expected (read_file_opt path)

let contains_sub s sub =
  let n = String.length s and m = String.length sub in
  let rec go i = i + m <= n && (String.sub s i m = sub || go (i + 1)) in
  go 0

(* cljs fake-platform: clean graph dir + create pages/journals dirs +
   disabled mirror before/after (drops queued jobs and pending flush
   timers so no stray timer writes after the dir is gone). *)
let with_mirror_fs f =
  MM.set_enabled repo false;
  ignore (run (File_sys.remove (mirror_root ())));
  ignore (run (File_sys.mkdir_p (mirror_dir () ^ "/pages")));
  ignore (run (File_sys.mkdir_p (mirror_dir () ^ "/journals")));
  Fun.protect
    ~finally:(fun () ->
      MM.set_enabled repo false;
      ignore (run (File_sys.remove (mirror_root ()))))
    f

(* ---------- cljs helpers ---------- *)

let page_marker uuid = "id:: " ^ uuid

let first_block (page : entity) : entity =
  match Ldb.ref_ents page "block/_page" with
  | b :: _ -> b
  | [] -> failwith "page has no blocks"

let add_child_block conn (page : entity) title =
  ignore
    (Datascript.transact_conn_string conn
       (Printf.sprintf
          "[{:block/uuid #uuid \"%s\" :block/title \"%s\" :block/page %d :block/parent %d :block/order \"a0\"}]"
          (Uuid_gen.uuid ()) title page.id page.id))

(* cljs db-test/create-conn-with-blocks via the Db_test_util DSL *)
let conn_with_blocks ?(properties = []) ?(pages_and_blocks = [])
    ?(pre_txs = []) () =
  Db_test_util.create_conn_with_blocks ~properties ~pages_and_blocks
    ~pre_txs ()

(* cljs ontology pieces that initial_data_edn does not seed (see
   db.initial-data / built-in-properties): the logseq.property/status.*
   closed-value entities, the status property's
   :logseq.property/default-value, and :logseq.property/hide? on the
   created-from-property / built-in? property entities. Tests that
   exercise them seed them via :build/pre-txs. *)
let status_closed_value_decl ident title : (string * Db_test_util.edn) list =
  [ "db/ident", Db_test_util.Kw ident
  ; "block/title", Db_test_util.Str title
  ; "block/page", Db_test_util.Kw "logseq.property/status"
  ; "block/parent", Db_test_util.Kw "logseq.property/status"
  ; "block/closed-value-property", Db_test_util.Kw "logseq.property/status"
  ; "logseq.property/created-from-property", Db_test_util.Kw "logseq.property/status" ]

let status_ontology_pre_txs =
  [ status_closed_value_decl "logseq.property/status.todo" "Todo"
  ; status_closed_value_decl "logseq.property/status.doing" "Doing"
  ; status_closed_value_decl "logseq.property/status.done" "Done"
  ; status_closed_value_decl "logseq.property/status.canceled" "Canceled"
  ; [ "db/ident", Db_test_util.Kw "logseq.property/status"
    ; "logseq.property/default-value", Db_test_util.Kw "logseq.property/status.todo" ] ]

let hidden_built_in_property_pre_txs =
  List.map
    (fun ident ->
      [ "db/ident", Db_test_util.Kw ident; "logseq.property/hide?", Db_test_util.Bool true ])
    [ "logseq.property/created-from-property"; "logseq.property/built-in?" ]

(* cljs entity-plus: (:logseq.property/status block) falls back to the
   property entity's :logseq.property/default-value when the block has no
   status datom. Ldb.ref_ent is raw-datom only, so emulate the fallback
   here. *)
let resolved_status_ident db (block : entity) =
  match Ldb.ref_ent block "logseq.property/status" with
  | Some s -> Ldb.string_value s "db/ident"
  | None ->
      (match Datascript.entity db (Ident "logseq.property/status") with
       | Some prop ->
           (match Ldb.value prop "logseq.property/default-value" with
            | Some (Ref id) ->
                Option.bind (Ldb.ent_of_id db id)
                  (fun dv -> Ldb.string_value dv "db/ident")
            | Some (Keyword k) -> Some k
            | _ -> None)
       | None -> None)

let page_by_title db t =
  match Db_test_util.find_page_by_title db t with
  | Some e -> e
  | None -> failwith ("no page titled " ^ t)

let journal_by_day db day =
  match Db_test_util.find_journal_by_journal_day db day with
  | Some e -> e
  | None -> failwith ("no journal for day " ^ string_of_int day)

let ent_uuid_exn db u =
  match entity_at_uuid db u with
  | Some e -> e
  | None -> failwith ("no entity for uuid " ^ u)

let edit_block_title conn (block : entity) title : tx_report =
  Datascript.transact_conn_string conn
    (Printf.sprintf "[[:db/add %d :block/title \"%s\"]]" block.id title)

let with_title db (eid : entity_id) title : tx_report =
  Datascript.with_tx_string db
    (Printf.sprintf "[{:db/id %d :block/title \"%s\"}]" eid title)

(* cljs (:db/id (d/entity @conn [:block/uuid u])) *)
let page_id_of_uuid db u = (ent_uuid_exn db u).id

(* ---------- result wire helpers ---------- *)

let wk w k =
  match Wire.get k w with Some (Wire.Keyword s) -> Some s | _ -> None

let status_of w = wk w "status"
let reason_of w = wk w "reason"

let path_of w =
  match Wire.get "path" w with Some (Wire.String s) -> Some s | _ -> None

let wire_results w =
  match w with Wire.Array items | Wire.List items -> items | _ -> []

(* cljs <mirror-page! *)
let mirror_page db (page : entity) ?(o = opts) () : Wire.t =
  run (MM.mirror_page repo db page.id o)

let handle_tx_report report ?(o = opts) () : Wire.t =
  run (MM.handle_tx_report repo report o)

let flush_repo () : Wire.t = run (MM.flush_repo repo opts)

let mirror_repo db : Wire.t = run (MM.mirror_repo repo db opts)

let sorted ids = List.sort compare ids

(* cljs add_child_block with an existing page entity *)
let block_by_content db t =
  match Db_test_util.find_block_by_content db t with
  | Some e -> e
  | None -> failwith ("no block titled " ^ t)

(* ---------- deps/db markdown-mirror-test deftests ---------- *)

(* (deftest replacing-graph-keeps-colliding-mirror-paths-distinct-test ...) *)
let test_replacing_graph_keeps_colliding_mirror_paths_distinct_test () =
  with_mirror_fs (fun () ->
      let first_uuid = "11111111-1111-4111-8111-111111111111"
      and second_uuid = "22222222-2222-4222-8222-222222222222" in
      let old_conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "A:B"
                    ; pg_uuid = Some second_uuid }
                ; blocks = [ { default_block with b_title = Some "old body" } ] } ]
          ()
      in
      let new_conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "A/B"
                    ; pg_uuid = Some first_uuid }
                ; blocks = [ { default_block with b_title = Some "first body" } ] }
            ; Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "A:B"
                    ; pg_uuid = Some second_uuid }
                ; blocks = [ { default_block with b_title = Some "second body" } ] } ]
          ()
      in
      MM.set_enabled repo false;
      MM.set_enabled repo true;
      ignore
        (handle_tx_report
           (edit_block_title old_conn
              (first_block (ent_uuid_exn (db_of old_conn) second_uuid))
              "warm index")
           ());
      let first_page = ent_uuid_exn (db_of new_conn) first_uuid in
      ignore (mirror_page (db_of new_conn) first_page ());
      let first_content = read_file_opt (page_path "pages/A_B.md") in
      ignore
        (handle_tx_report
           (edit_block_title new_conn
              (first_block (ent_uuid_exn (db_of new_conn) second_uuid))
              "updated second body")
           ~o:{ opts with defer = true }
           ());
      ignore (flush_repo ());
      check
        "replacing the graph must not overwrite the other colliding page"
        (read_file_opt (page_path "pages/A_B.md") = first_content);
      check "colliding page written distinctly"
        (file_exists (page_path "pages/A_B (2).md")))

(* (deftest repo-mirror-dir-is-under-mirror-markdown-test ...) *)
let test_repo_mirror_dir_is_under_mirror_markdown_test () =
  check "repo-mirror-dir is under mirror/markdown"
    (MM.repo_mirror_dir repo = "graph-xxx/mirror/markdown")

(* (deftest normalize-file-name-is-cross-platform-and-deterministic-test ...) *)
let test_normalize_file_name_is_cross_platform_and_deterministic_test () =
  check "invalid filesystem characters and path separators are replaced"
    (MM.normalize_file_stem "A/B\\C:D<E>F\"G|H" = Some "A_B_C_D_E_F_G_H");
  check "trailing spaces and dots are removed"
    (MM.normalize_file_stem "title.  " = Some "title");
  check "unicode is normalized before sanitizing"
    (MM.normalize_file_stem "e\xcc\x81" = MM.normalize_file_stem "\xc3\xa9");
  check "reserved Windows device names are rejected"
    (MM.normalize_file_stem "CON" = None
     && MM.normalize_file_stem "lpt9" = None)

(* (deftest same-title-pages-write-distinct-stable-friendly-paths-test ...) *)
let test_same_title_pages_write_distinct_stable_friendly_paths_test () =
  with_mirror_fs (fun () ->
      let page_uuid_1 = "11111111-1111-4111-8111-111111111111"
      and page_uuid_2 = "22222222-2222-4222-8222-222222222222" in
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "Same Name"
                    ; pg_uuid = Some page_uuid_1 }
                ; blocks = [ { default_block with b_title = Some "first" } ] }
            ; Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "Same Name"
                    ; pg_uuid = Some page_uuid_2 }
                ; blocks = [ { default_block with b_title = Some "second" } ] } ]
          ()
      in
      let db = db_of conn in
      let pages =
        Datascript.datoms db Datascript.Avet ~a:"block/title"
          ~v:(String "Same Name") ()
        |> Seq.filter_map (fun (d : datom) -> entity db (Entity_id d.e))
        |> List.of_seq
        |> List.filter (fun (p : entity) ->
               Ldb.ref_ent p "block/page" = None)
        |> List.sort (fun (a : entity) (b : entity) ->
               compare (uuid_of a) (uuid_of b))
      in
      let paths =
        List.map (fun (p : entity) -> MM.page_relative_path repo db p ~opts) pages
      in
      check "same-title pages write distinct stable paths"
        (paths = [ Some "pages/Same Name.md"; Some "pages/Same Name (2).md" ]))

(* (deftest normalized-title-collisions-write-distinct-stable-paths-test ...) *)
let test_normalized_title_collisions_write_distinct_stable_paths_test () =
  with_mirror_fs (fun () ->
      let page_uuid_1 = "11111111-1111-4111-8111-111111111111"
      and page_uuid_2 = "22222222-2222-4222-8222-222222222222" in
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "A/B"
                    ; pg_uuid = Some page_uuid_1 }
                ; blocks = [ { default_block with b_title = Some "first" } ] }
            ; Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "A:B"
                    ; pg_uuid = Some page_uuid_2 }
                ; blocks = [ { default_block with b_title = Some "second" } ] } ]
          ()
      in
      let db = db_of conn in
      let pages =
        [ page_by_title db "A/B"; page_by_title db "A:B" ]
        |> List.sort (fun (a : entity) (b : entity) ->
               compare (uuid_of a) (uuid_of b))
      in
      let paths =
        List.map (fun (p : entity) -> MM.page_relative_path repo db p ~opts) pages
      in
      check "normalized collisions write distinct stable paths"
        (paths = [ Some "pages/A_B.md"; Some "pages/A_B (2).md" ]))

(* (deftest page-references-remain-wiki-links-test ...) *)
let test_page_references_remain_wiki_links_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ Db_test_util.
                { page = { default_page with pg_title = Some "Source" }
                ; blocks =
                    [ { default_block with b_title = Some "See [[Foo]]" } ] }
            ; Db_test_util.
                { page = { default_page with pg_title = Some "Foo" }
                ; blocks = [ { default_block with b_title = Some "target" } ] }
            ; Db_test_util.
                { page = { default_page with pg_title = Some "Foo" }
                ; blocks =
                    [ { default_block with b_title = Some "duplicate" } ] } ]
          ()
      in
      let db = db_of conn in
      let page = page_by_title db "Source" in
      ignore (mirror_page db page ());
      check_file "page references remain wiki links"
        (page_path "pages/Source.md")
        (Some (page_marker (uuid_of page) ^ "\n\n" ^ "- See [[Foo]]")))

(* (deftest affected-page-ids-detects-edited-block-page-test ...) *)
let test_affected_page_ids_detects_edited_block_page_test () =
  let conn =
    conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "Page A" }
            ; blocks = [ { default_block with b_title = Some "before" } ] } ]
      ()
  in
  let db = db_of conn in
  let page = page_by_title db "Page A" in
  let block = first_block page in
  let report = with_title db block.id "after" in
  check "affected-page-ids detects edited block's page"
    (sorted
       (MM.affected_page_ids ~db_before:report.db_before
          ~db_after:report.db_after ~tx_data:report.tx_data)
     = [ page.id ])

(* (deftest affected-page-ids-includes-linking-pages-on-page-rename-test ...) *)
let test_affected_page_ids_includes_linking_pages_on_page_rename_test () =
  let conn =
    conn_with_blocks
      ~pages_and_blocks:
        [ Db_test_util.
            { page = { default_page with pg_title = Some "TargetOld" }
            ; blocks = [ { default_block with b_title = Some "target" } ] }
        ; Db_test_util.
            { page = { default_page with pg_title = Some "Source" }
            ; blocks =
                [ { default_block with b_title = Some "See [[TargetOld]]" } ] } ]
      ()
  in
  let db = db_of conn in
  let target = page_by_title db "TargetOld" in
  let source = page_by_title db "Source" in
  let report =
    Datascript.with_tx_string db
      (Printf.sprintf
         "[{:db/id %d :block/title \"TargetNew\" :block/name \"targetnew\"}]"
         target.id)
  in
  let refs =
    Ldb.ref_ents (first_block source) "block/refs" |> List.map (fun e -> e.id)
  in
  check "source block refs include target"
    (List.mem target.id refs);
  check "rename includes linking pages"
    (sorted
       (MM.affected_page_ids ~db_before:report.db_before
          ~db_after:report.db_after ~tx_data:report.tx_data)
     = sorted [ target.id; source.id ])

(* shared mirror-content assertion: mirror_page then exact file content *)
let check_mirrored_content name conn page_title rel_path expected_body =
  let db = db_of conn in
  let page = page_by_title db page_title in
  ignore (mirror_page db page ());
  check_file name (page_path rel_path)
    (Some (page_marker (uuid_of page) ^ "\n\n" ^ expected_body))

let pb title ?uuid ?properties ?tags ?children () : Db_test_util.page_blocks =
  Db_test_util.
    { page =
        { default_page with
          pg_title = Some title
        ; pg_uuid = uuid
        ; pg_properties = Option.value properties ~default:[]
        ; pg_tags = Option.value tags ~default:[] }
    ; blocks = Option.value children ~default:[] }

let blk title ?properties ?tags ?children () : Db_test_util.block_decl =
  Db_test_util.
    { default_block with
      b_title = Some title
    ; b_properties = Option.value properties ~default:[]
    ; b_tags = Option.value tags ~default:[]
    ; b_children = Option.value children ~default:[] }

(* (deftest block-db-id-comments-are-not-written-to-block-lines-test ...) *)
let test_block_db_id_comments_are_not_written_to_block_lines_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Block Ids"
                ~uuid:"33333333-3333-4333-8333-333333333333"
                ~children:
                  [ blk "hello" (); blk "world" () ]
                () ]
          ()
      in
      check_mirrored_content
        "block db-id comments not written to block lines" conn "Block Ids"
        "pages/Block Ids.md" "- hello\n- world")

(* (deftest block-db-id-comments-are-not-written-to-mirror-markdown-test ...) *)
let test_block_db_id_comments_are_not_written_to_mirror_markdown_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Clean Markdown"
                ~uuid:"33333333-3333-4333-8333-333333333341"
                ~children:
                  [ blk "hello" (); blk "" () ]
                () ]
          ()
      in
      let db = db_of conn in
      let page = page_by_title db "Clean Markdown" in
      ignore (mirror_page db page ());
      let content =
        Option.value ~default:"" (read_file_opt (page_path "pages/Clean Markdown.md"))
      in
      check "mirror markdown content"
        (content = page_marker (uuid_of page) ^ "\n\n" ^ "- hello\n-");
      check "no <!-- id: comments" (not (contains_sub content "<!--")))

(* (deftest multiline-blocks-do-not-render-db-id-comments-test ...) *)
let test_multiline_blocks_do_not_render_db_id_comments_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Multiline"
                ~uuid:"33333333-3333-4333-8333-333333333334"
                ~children:
                  [ blk "block line1\nblock line2" () ]
                () ]
          ()
      in
      check_mirrored_content "multiline blocks render" conn "Multiline"
        "pages/Multiline.md" "- block line1\n  block line2")

(* (deftest empty-block-does-not-render-db-id-comment-test ...) *)
let test_empty_block_does_not_render_db_id_comment_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Empty"
                ~uuid:"33333333-3333-4333-8333-333333333338"
                ~children:
                  [ blk "" () ]
                () ]
          ()
      in
      check_mirrored_content "empty block renders bare dash" conn "Empty"
        "pages/Empty.md" "-")

(* (deftest multiline-markdown-list-lines-do-not-consume-next-block-db-id-test ...) *)
let test_multiline_markdown_list_lines_do_not_consume_next_block_db_id_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Multiline List"
                ~uuid:"33333333-3333-4333-8333-333333333340"
                ~children:
                  [ blk "first line\n- not a child" ()
                  ; blk "after multiline" () ]
                () ]
          ()
      in
      check_mirrored_content "multiline list lines" conn "Multiline List"
        "pages/Multiline List.md"
        "- first line\n  - not a child\n- after multiline")

(* (deftest nested-blocks-do-not-render-db-id-comments-and-preserve-indent-test ...) *)
let test_nested_blocks_do_not_render_db_id_comments_and_preserve_indent_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Nested"
                ~uuid:"33333333-3333-4333-8333-333333333335"
                ~children:
                  [ blk "parent" ~children:[ blk "child" () ] () ]
                () ]
          ()
      in
      check_mirrored_content "nested blocks preserve indent" conn "Nested"
        "pages/Nested.md" "- parent\n  - child")

(* (deftest code-blocks-still-render-without-db-id-comments-test ...) *)
let test_code_blocks_still_render_without_db_id_comments_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Code Mirror"
                ~uuid:"33333333-3333-4333-8333-333333333336"
                ~children:
                  [ blk "(println \"hi\")"
                      ~tags:[ "logseq.class/Code-block" ]
                      ~properties:
                        [ "logseq.property.node/display-type", Kw "code"
                        ; "logseq.property.code/lang", Str "clojure" ]
                      ()
                  ; blk "normal" () ]
                () ]
          ()
      in
      check_mirrored_content "code blocks render without id comments" conn
        "Code Mirror" "pages/Code Mirror.md"
        "- ```clojure\n  (println \"hi\")\n  ```\n- normal")

(* (deftest code-block-markdown-list-lines-do-not-consume-block-db-ids-test ...) *)
let test_code_block_markdown_list_lines_do_not_consume_block_db_ids_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Code List"
                ~uuid:"33333333-3333-4333-8333-333333333339"
                ~children:
                  [ blk "- not an outline block\n(+ 1 2)"
                      ~tags:[ "logseq.class/Code-block" ]
                      ~properties:
                        [ "logseq.property.node/display-type", Kw "code"
                        ; "logseq.property.code/lang", Str "clojure" ]
                      ()
                  ; blk "after code" () ]
                () ]
          ()
      in
      check_mirrored_content "code list lines do not consume ids" conn
        "Code List" "pages/Code List.md"
        "- ```clojure\n  - not an outline block\n  (+ 1 2)\n  ```\n- after code")

(* (deftest property-value-lines-do-not-render-db-id-comments-test ...) *)
let test_property_value_lines_do_not_render_db_id_comments_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~properties:
            [ "user.property/notes",
              Db_test_util.{ default_property with p_type = "default" } ]
          ~pages_and_blocks:
            [ pb "Properties"
                ~uuid:"33333333-3333-4333-8333-333333333337"
                ~children:
                  [ blk "body"
                      ~properties:
                        [ "user.property/notes", Str "property value bullet" ]
                      ()
                  ; blk "after" () ]
                () ]
          ~pre_txs:hidden_built_in_property_pre_txs ()
      in
      check_mirrored_content "property value lines render" conn "Properties"
        "pages/Properties.md"
        "- body\n  * notes::\n    - property value bullet\n- after")

(* (deftest enabled-electron-edit-writes-page-mirror-test ...) *)
let test_enabled_electron_edit_writes_page_mirror_test () =
  with_mirror_fs (fun () ->
      let page_uuid = "33333333-3333-4333-8333-333333333333" in
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Page A" ~uuid:page_uuid
                ~children:[ blk "hello" (); blk "world" () ] () ]
          ()
      in
      let db = db_of conn in
      let page = page_by_title db "Page A" in
      let result = mirror_page db page () in
      let path = page_path "pages/Page A.md" in
      let content =
        page_marker page_uuid ^ "\n\n" ^ "- hello\n- world"
      in
      check_file "mirror writes page file" path (Some content);
      check "one write to the mirror path"
        (status_of result = Some "written" && path_of result = Some path))

(* (deftest missing-mirror-file-read-still-writes-page-mirror-test ...) *)
let test_missing_mirror_file_read_still_writes_page_mirror_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Page A" ~children:[ blk "hello" () ] () ]
          ()
      in
      let db = db_of conn in
      let page = page_by_title db "Page A" in
      (* cljs injects a rejected ENOENT read; a simply-missing file produces
         the same not-found read error from real File_sys. *)
      let result = mirror_page db page () in
      let path = page_path "pages/Page A.md" in
      let content = page_marker (uuid_of page) ^ "\n\n" ^ "- hello" in
      check_file "missing mirror file still writes" path (Some content);
      check "one write" (status_of result = Some "written"))

(* (deftest unexpected-mirror-file-read-error-rejects-page-mirror-test ...) *)
let test_unexpected_mirror_file_read_error_rejects_page_mirror_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Page A" ~children:[ blk "hello" () ] () ]
          ()
      in
      let db = db_of conn in
      let page = page_by_title db "Page A" in
      let path = page_path "pages/Page A.md" in
      (* cljs injects a rejected non-ENOENT read; a directory at the mirror
         path makes File_sys.read_text fail with a non-not-found error. *)
      ignore (run (File_sys.mkdir_p path));
      (match run_catching (MM.mirror_page repo db page.id opts) with
       | Error _ -> ()
       | Ok _ -> check "mirror write must reject on unexpected read error" false);
      check "no write happened"
        (not (file_exists path)
         && not (Sys.file_exists (path ^ ".tmp"))))

(* (deftest page-mirror-exports-property-values-test ...) *)
let test_page_mirror_exports_property_values_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~properties:
            [ "user.property/reproducible-steps",
              Db_test_util.{ default_property with p_type = "default" }
            ; "user.property/rating",
              Db_test_util.{ default_property with p_type = "number" } ]
          ~pages_and_blocks:
            [ Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "Issue"
                    ; pg_properties =
                        [ "user.property/reproducible-steps", Str "Open settings"
                        ; "logseq.property/heading", Int 1 ] }
                ; blocks =
                    [ blk "TODO body"
                        ~properties:
                          [ "logseq.property/status",
                            Kw "logseq.property/status.todo"
                          ; "user.property/reproducible-steps", Str "Click mirror"
                          ; "user.property/rating", Int 5
                          ; "logseq.property/heading", Int 2 ]
                        () ] } ]
          ~pre_txs:(status_ontology_pre_txs
                    @ hidden_built_in_property_pre_txs)
          ()
      in
      let db = db_of conn in
      let page = page_by_title db "Issue" in
      ignore (mirror_page db page ());
      check_file "page mirror exports property values"
        (page_path "pages/Issue.md")
        (Some
             (page_marker (uuid_of page) ^ "\n"
              ^ "* reproducible-steps::\n  - Open settings\n\n"
              ^ "- TODO ## TODO body\n  * reproducible-steps::\n    - Click mirror\n  * rating:: 5")))

(* (deftest page-mirror-does-not-encode-background-color-as-highlight-test ...) *)
let test_page_mirror_does_not_encode_background_color_as_highlight_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Highlighted"
                ~children:
                  [ blk "Highlighted block"
                      ~properties:
                        [ "logseq.property/background-color", Str "red" ]
                      () ]
                () ]
          ()
      in
      let db = db_of conn in
      let page = page_by_title db "Highlighted" in
      ignore (mirror_page db page ());
      let content =
        Option.value ~default:"" (read_file_opt (page_path "pages/Highlighted.md"))
      in
      check "background-color is not encoded as ^^ highlight"
        (not (contains_sub content "^^"));
      check "content"
        (content
         = page_marker (uuid_of page) ^ "\n\n" ^ "- Highlighted block"))

(* (deftest page-mirror-preserves-markdown-semantic-block-formatting-test ...) *)
let test_page_mirror_preserves_markdown_semantic_block_formatting_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Formats"
                ~children:
                  [ blk "Heading block"
                      ~properties:[ "logseq.property/heading", Int 2 ] ()
                  ; blk "quote line 1\nquote line 2"
                      ~tags:[ "logseq.class/Quote-block" ]
                      ~properties:
                        [ "logseq.property.node/display-type", Kw "quote" ]
                      ()
                  ; blk "(println \"hi\")\n(+ 1 2)"
                      ~tags:[ "logseq.class/Code-block" ]
                      ~properties:
                        [ "logseq.property.node/display-type", Kw "code"
                        ; "logseq.property.code/lang", Str "clojure" ]
                      () ]
                () ]
          ()
      in
      check_mirrored_content "semantic block formatting preserved" conn
        "Formats" "pages/Formats.md"
        "- ## Heading block\n- > quote line 1\n  > quote line 2\n- ```clojure\n  (println \"hi\")\n  (+ 1 2)\n  ```")

(* (deftest page-mirror-emits-todo-for-task-with-default-status-test ...) *)
let test_page_mirror_emits_todo_for_task_with_default_status_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Tasks"
                ~children:
                  [ blk "default todo" ~tags:[ "logseq.class/Task" ] ()
                  ; blk "doing task" ~tags:[ "logseq.class/Task" ]
                      ~properties:
                        [ "logseq.property/status",
                          Kw "logseq.property/status.doing" ]
                      ()
                  ; blk "done task" ~tags:[ "logseq.class/Task" ]
                      ~properties:
                        [ "logseq.property/status",
                          Kw "logseq.property/status.done" ]
                      ()
                  ; blk "canceled task" ~tags:[ "logseq.class/Task" ]
                      ~properties:
                        [ "logseq.property/status",
                          Kw "logseq.property/status.canceled" ]
                      () ]
                () ]
          ~pre_txs:status_ontology_pre_txs ()
      in
      let db = db_of conn in
      let page = page_by_title db "Tasks" in
      let default_block = block_by_content db "default todo" in
      ignore (mirror_page db page ());
      check "no status datom on default task"
        (Datascript.datoms db Datascript.Eavt ~e:default_block.id
           ~a:"logseq.property/status" ()
         |> Seq.is_empty);
      check "resolved default status is todo"
        (resolved_status_ident db default_block
         = Some "logseq.property/status.todo");
      check_file "todo markers emitted"
        (page_path "pages/Tasks.md")
        (Some
             (page_marker (uuid_of page) ^ "\n\n"
              ^ "- TODO default todo\n- DOING doing task\n- DONE done task\n- CANCELED canceled task")))

(* (deftest page-mirror-skips-empty-placeholder-status-test ...) *)
let test_page_mirror_skips_empty_placeholder_status_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Cleared"
                ~children:
                  [ blk "cleared status" ~tags:[ "logseq.class/Task" ]
                      ~properties:
                        [ "logseq.property/status",
                          Kw "logseq.property/empty-placeholder" ]
                      () ]
                () ]
          ()
      in
      check_mirrored_content "empty placeholder status skipped" conn "Cleared"
        "pages/Cleared.md" "- cleared status")

(* (deftest page-mirror-preserves-numbered-list-markers-status-and-tags-test ...) *)
let test_page_mirror_preserves_numbered_list_markers_status_and_tags_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Ordered"
                ~children:
                  [ blk "first" ~tags:[ "Project" ]
                      ~properties:
                        [ "logseq.property/status",
                          Kw "logseq.property/status.todo"
                        ; "logseq.property/order-list-type", Str "number" ]
                      ~children:[ blk "child" () ]
                      ()
                  ; blk "second"
                      ~properties:
                        [ "logseq.property/order-list-type", Str "number" ]
                      () ]
                () ]
          ~properties:
            [ "logseq.property/order-list-type",
              Db_test_util.{ default_property with p_type = "default" } ]
          ~pre_txs:(status_ontology_pre_txs
                    @ hidden_built_in_property_pre_txs)
          ()
      in
      check_mirrored_content "numbered list markers preserved" conn "Ordered"
        "pages/Ordered.md" "1. TODO first #Project\n  - child\n2. second")

(* (deftest page-mirror-does-not-treat-numbered-content-lines-as-blocks-test ...) *)
let test_page_mirror_does_not_treat_numbered_content_lines_as_blocks_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Numbered Content"
                ~children:
                  [ blk "intro\n1. continuation" ~tags:[ "Project" ] ()
                  ; blk "1. code line" ~tags:[ "Snippet" ]
                      ~properties:
                        [ "logseq.property.node/display-type", Kw "code" ]
                      ()
                  ; blk "second" ~tags:[ "Next" ]
                      ~properties:
                        [ "logseq.property/status",
                          Kw "logseq.property/status.todo" ]
                      () ]
                () ]
          ~pre_txs:status_ontology_pre_txs ()
      in
      check_mirrored_content "numbered content lines are not blocks" conn
        "Numbered Content" "pages/Numbered Content.md"
        "- intro #Project\n  1. continuation\n- ``` #Snippet\n  1. code line\n  ```\n- TODO second #Next")

(* (deftest page-mirror-renders-embedded-node-content-and-tags-test ...) *)
let test_page_mirror_renders_embedded_node_content_and_tags_test () =
  with_mirror_fs (fun () ->
      let target_uuid = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
      and embed_uuid = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" in
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ Db_test_util.
                { page = { default_page with pg_title = Some "Source" }
                ; blocks =
                    [ { default_block with
                        b_title = Some ""
                      ; b_uuid = Some embed_uuid } ] }
            ; Db_test_util.
                { page = { default_page with pg_title = Some "Target Page" }
                ; blocks =
                    [ { default_block with
                        b_title = Some "Target"
                      ; b_uuid = Some target_uuid
                      ; b_tags = [ "Project" ]
                      ; b_children = [ blk "Target child" () ] } ] } ]
          ()
      in
      let db = db_of conn in
      let embed_eid = page_id_of_uuid db embed_uuid
      and target_eid = page_id_of_uuid db target_uuid in
      (* cljs :build/keep-uuid? — uuids are already fixed via b_uuid *)
      ignore
        (Datascript.transact_conn_string conn
           (Printf.sprintf "[{:db/id %d :block/link %d}]" embed_eid target_eid));
      let db = db_of conn in
      let page = page_by_title db "Source" in
      ignore (mirror_page db page ());
      check_file "embedded node content and tags rendered"
        (page_path "pages/Source.md")
        (Some
             (page_marker (uuid_of page) ^ "\n\n"
              ^ "- Target #Project\n  - Target child")))

(* cljs {:build/property-value :block :block/title t :build/children children}
   — the OCaml fixture does not expand :build/children inside a
   build/property-value map, so children are attached via follow-up txs. *)
let pvalue_ref title : Db_test_util.prop_value =
  Map
    [ "build/property-value", Kw "block"
    ; "block/title", Str title ]

let attach_children conn ~(parent : entity) ~(page_eid : entity_id) titles =
  List.iteri
    (fun i title ->
       ignore
         (Datascript.transact_conn_string conn
            (Printf.sprintf
               "[{:block/uuid #uuid \"%s\" :block/title \"%s\" :block/page %d :block/parent %d :block/order \"a%d\"}]"
               (Uuid_gen.uuid ()) title page_eid parent.id (i + 1))))
    titles

(* (deftest page-mirror-exports-default-property-value-children-test ...) *)
let test_page_mirror_exports_default_property_value_children_test () =
  with_mirror_fs (fun () ->
      let page_uuid = "33333333-3333-4333-8333-333333333342" in
      let conn =
        conn_with_blocks
          ~properties:
            [ "user.property/notes",
              Db_test_util.{ default_property with p_type = "default" } ]
          ~pages_and_blocks:
            [ Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "Text Prop Children"
                    ; pg_uuid = Some page_uuid
                    ; pg_properties =
                        [ "user.property/notes", pvalue_ref "page value" ] }
                ; blocks =
                    [ blk "body"
                        ~properties:
                          [ "user.property/notes", pvalue_ref "block value" ]
                        ()
                    ; blk "after" () ] } ]
          ~pre_txs:hidden_built_in_property_pre_txs ()
      in
      (* attach the :build/children of each property-value block *)
      let db = db_of conn in
      let page = page_by_title db "Text Prop Children" in
      let page_value = block_by_content db "page value" in
      let block_value = block_by_content db "block value" in
      attach_children conn ~parent:page_value ~page_eid:page.id
        [ "page value child" ];
      attach_children conn ~parent:block_value ~page_eid:page.id
        [ "child of value" ];
      let child_of_value = block_by_content (db_of conn) "child of value" in
      attach_children conn ~parent:child_of_value ~page_eid:page.id
        [ "grandchild" ];
      let db = db_of conn in
      let page = page_by_title db "Text Prop Children" in
      ignore (mirror_page db page ());
      check_file "default property value children exported"
        (page_path "pages/Text Prop Children.md")
        (Some
             (page_marker page_uuid ^ "\n"
              ^ "* notes::\n  - page value\n    - page value child\n\n"
              ^ "- body\n  * notes::\n    - block value\n      - child of value\n        - grandchild\n- after")))

(* (deftest page-mirror-does-not-export-url-property-value-children-test ...) *)
let test_page_mirror_does_not_export_url_property_value_children_test () =
  with_mirror_fs (fun () ->
      let page_uuid = "33333333-3333-4333-8333-333333333343" in
      let conn =
        conn_with_blocks
          ~properties:
            [ "user.property/website",
              Db_test_util.{ default_property with p_type = "url" } ]
          ~pages_and_blocks:
            [ Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "Url Prop Children"
                    ; pg_uuid = Some page_uuid }
                ; blocks =
                    [ blk "body"
                        ~properties:
                          [ "user.property/website",
                            pvalue_ref "https://example.com" ]
                        ()
                    ; blk "after" () ] } ]
          ~pre_txs:hidden_built_in_property_pre_txs ()
      in
      let db = db_of conn in
      let page = page_by_title db "Url Prop Children" in
      let url_value = block_by_content db "https://example.com" in
      attach_children conn ~parent:url_value ~page_eid:page.id
        [ "should not appear" ];
      let db = db_of conn in
      let page = page_by_title db "Url Prop Children" in
      ignore (mirror_page db page ());
      let content =
        Option.value ~default:""
          (read_file_opt (page_path "pages/Url Prop Children.md"))
      in
      check "url property value is inline"
        (content
         = page_marker page_uuid ^ "\n\n"
           ^ "- body\n  * website:: https://example.com\n- after");
      check "url value children not exported"
        (not (contains_sub content "should not appear")))

(* (deftest page-mirror-exports-page-property-values-test ...) *)
let test_page_mirror_exports_page_property_values_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~properties:
            [ "user.property/p1",
              Db_test_util.{ default_property with p_type = "default" }
            ; "user.property/p2",
              Db_test_util.{ default_property with p_type = "number" }
            ; "user.property/p3",
              Db_test_util.{ default_property with p_type = "default" } ]
          ~pages_and_blocks:
            [ Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "Page Props"
                    ; pg_properties =
                        [ "user.property/p1", Str "hello"
                        ; "user.property/p2", Int 1
                        ; "user.property/p3", Str "Author 1" ] }
                ; blocks = [ blk "body" () ] } ]
          ~pre_txs:hidden_built_in_property_pre_txs ()
      in
      let db = db_of conn in
      let page = page_by_title db "Page Props" in
      ignore (mirror_page db page ());
      check_file "page property values exported"
        (page_path "pages/Page Props.md")
        (Some
             (page_marker (uuid_of page) ^ "\n"
              ^ "* p1::\n  - hello\n* p2:: 1\n* p3::\n  - Author 1\n\n- body")))

(* (deftest page-mirror-exports-node-property-values-as-page-refs-test ...) *)
let test_page_mirror_exports_node_property_values_as_page_refs_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~properties:
            [ "friend",
              Db_test_util.{ default_property with p_type = "node" } ]
          ~pages_and_blocks:
            [ Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "Alice"
                    ; pg_properties =
                        [ "friend",
                          Db_test_util.build_page_ref ~title:"Bob" () ] }
                ; blocks = [ blk "knows" () ] }
            ; Db_test_util.
                { page = { default_page with pg_title = Some "Bob" }
                ; blocks = [] } ]
          ()
      in
      let db = db_of conn in
      let page = page_by_title db "Alice" in
      ignore (mirror_page db page ());
      check_file "node property values exported as page refs"
        (page_path "pages/Alice.md")
        (Some
             (page_marker (uuid_of page) ^ "\n" ^ "* friend:: [[Bob]]\n\n- knows")))

(* (deftest journal-mirror-exports-page-and-block-property-values-test ...) *)
let test_journal_mirror_exports_page_and_block_property_values_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~properties:
            [ "user.property/p1",
              Db_test_util.{ default_property with p_type = "default" }
            ; "user.property/p2",
              Db_test_util.{ default_property with p_type = "number" }
            ; "user.property/p3",
              Db_test_util.{ default_property with p_type = "default" } ]
          ~pages_and_blocks:
            [ Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "May 5th, 2026"
                    ; pg_name = Some "may 5th, 2026"
                    ; pg_properties =
                        [ "user.property/p1", Str "hey" ]
                    ; pg_extra =
                        [ "block/journal-day", Int 20260505
                        ; "block/tags", Kw "logseq.class/Journal" ] }
                ; blocks =
                    [ blk "TODO hello great test"
                        ~properties:
                          [ "logseq.property/status",
                            Kw "logseq.property/status.todo"
                          ; "user.property/p1", Str "hello"
                          ; "user.property/p2", Int 1
                          ; "user.property/p3", Str "Author 1" ]
                        () ] } ]
          ~pre_txs:(status_ontology_pre_txs
                    @ hidden_built_in_property_pre_txs)
          ()
      in
      let db = db_of conn in
      let journal = journal_by_day db 20260505 in
      ignore (mirror_page db journal ());
      check_file "journal mirror exports page and block property values"
        (page_path "journals/2026_05_05.md")
        (Some
             (page_marker (uuid_of journal) ^ "\n"
              ^ "* p1::\n  - hey\n\n"
              ^ "- TODO hello great test\n  * p1::\n    - hello\n  * p2:: 1\n  * p3::\n    - Author 1")))

(* (deftest full-regeneration-writes-existing-non-built-in-non-property-pages-test ...) *)
let test_full_regeneration_writes_existing_non_built_in_non_property_pages_test
    () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~properties:
            [ "rating",
              Db_test_util.{ default_property with p_type = "default" } ]
          ~pages_and_blocks:
            [ pb "Page A" ~children:[ blk "alpha" () ] ()
            ; Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "Journal"
                    ; pg_extra =
                        [ "block/journal-day", Int 20240508
                        ; "block/tags", Kw "logseq.class/Journal" ] }
                ; blocks = [ blk "journal" () ] }
            ; Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "Built In"
                    ; pg_properties =
                        [ "logseq.property/built-in?", Bool true ] }
                ; blocks = [ blk "system" () ] }
            ; Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "Project"
                    ; pg_extra =
                        [ "block/tags", Kw "logseq.class/Tag"
                        ; "db/ident", Kw "user.class/Project" ] }
                ; blocks = [ blk "class" () ] }
            ; Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "rating"
                    ; pg_extra =
                        [ "block/tags", Kw "logseq.class/Property"
                        ; "db/ident", Kw "user.property/rating" ] }
                ; blocks = [ blk "property" () ] } ]
          ()
      in
      let db = db_of conn in
      ignore (mirror_repo db);
      let page_a = page_by_title db "Page A" in
      let journal = journal_by_day db 20240508 in
      let project = page_by_title db "Project" in
      check_file "Page A mirrored"
        (page_path "pages/Page A.md")
        (Some (page_marker (uuid_of page_a) ^ "\n\n- alpha"));
      check_file "journal mirrored"
        (page_path "journals/2024_05_08.md")
        (Some (page_marker (uuid_of journal) ^ "\n\n- journal"));
      check_file "class page mirrored"
        (page_path "pages/Project.md")
        (Some (page_marker (uuid_of project) ^ "\n\n- class"));
      check "built-in page not mirrored"
        (not (file_exists (page_path "pages/Built In.md")));
      check "property page not mirrored"
        (not (file_exists (page_path "pages/rating.md")));
      check "Library not mirrored"
        (not (file_exists (page_path "pages/Library.md")));
      check "Quick add not mirrored"
        (not (file_exists (page_path "pages/Quick add.md")));
      let contents = page_by_title db "Contents" in
      check "Contents is built-in" (Ldb.built_in contents);
      check "Contents mirrored despite built-in flag"
        (file_exists (page_path "pages/Contents.md")))

(* (deftest electron-browser-worker-runtime-is-supported-test ...) *)
let test_electron_browser_worker_runtime_is_supported_test () =
  with_mirror_fs (fun () ->
      let page_uuid = "88888888-8888-4888-8888-888888888888" in
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Page A" ~uuid:page_uuid
                ~children:[ blk "desktop" () ] () ]
          ()
      in
      let db = db_of conn in
      let page = page_by_title db "Page A" in
      (* cljs {:runtime :browser :owner-source :electron} *)
      ignore
        (mirror_page db page
           ~o:{ opts with supported_runtime_override = Some true }
           ());
      check_file "electron browser worker runtime writes mirror"
        (page_path "pages/Page A.md")
        (Some (page_marker page_uuid ^ "\n\n- desktop")))

(* (deftest non-electron-browser-runtime-is-skipped-test ...) *)
let test_non_electron_browser_runtime_is_skipped_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Page A" ~children:[ blk "web" () ] () ]
          ()
      in
      let db = db_of conn in
      let page = page_by_title db "Page A" in
      (* cljs {:runtime :browser :owner-source :browser} *)
      let result =
        mirror_page db page
          ~o:{ opts with supported_runtime_override = Some false }
          ()
      in
      check "status skipped" (status_of result = Some "skipped");
      check "reason unsupported-runtime"
        (reason_of result = Some "unsupported-runtime");
      check "nothing written"
        (not (file_exists (page_path "pages/Page A.md"))))

(* (deftest enabled-electron-edit-writes-journal-mirror-test ...) *)
let test_enabled_electron_edit_writes_journal_mirror_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ Db_test_util.
                { page = { default_page with pg_journal = Some 20240506 }
                ; blocks = [ blk "journal item" () ] } ]
          ()
      in
      let db = db_of conn in
      let journal = journal_by_day db 20240506 in
      ignore (mirror_page db journal ());
      check_file "journal mirror written"
        (page_path "journals/2024_05_06.md")
        (Some (page_marker (uuid_of journal) ^ "\n\n- journal item")))

(* (deftest disabled-setting-does-not-write-mirror-test ...) *)
let test_disabled_setting_does_not_write_mirror_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Page A" ~children:[ blk "before" () ] () ]
          ()
      in
      let db = db_of conn in
      let page = page_by_title db "Page A" in
      let block = first_block page in
      let report = with_title db block.id "after" in
      MM.set_enabled repo false;
      ignore (handle_tx_report report ());
      check "disabled mirror writes nothing"
        (not (file_exists (page_path "pages/Page A.md"))))

(* (deftest db-listener-transact-writes-updated-page-mirror-test ...) *)
let test_db_listener_transact_writes_updated_page_mirror_test () =
  with_mirror_fs (fun () ->
      let page_uuid = "33333333-3333-4333-8333-333333333334" in
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Page A" ~uuid:page_uuid
                ~children:[ blk "before" () ] () ]
          ()
      in
      let db = db_of conn in
      let page = page_by_title db "Page A" in
      let block = first_block page in
      MM.set_enabled repo true;
      Db_listener.listen_db_changes repo conn
        ~handler_keys:[ "markdown-mirror" ];
      ignore (mirror_page db page ());
      (* cljs (ldb/transact! conn [{...}] {:outliner-op :save-block}) —
         the deferred listener queues the mirror job; flush drains it. *)
      ignore
        (Db_tx.transact conn
           ~tx_meta:[ "outliner-op", Keyword "save-block" ]
           [ Entity
               { db_id = Some (Entity_id block.id)
               ; attrs = [ "block/title", One_value (String "after") ] } ]);
      ignore (flush_repo ());
      check_file "db-listener transact writes updated mirror"
        (page_path "pages/Page A.md")
        (Some (page_marker page_uuid ^ "\n\n- after")))

(* (deftest disabling-setting-drops-queued-mirror-work-test ...) *)
let test_disabling_setting_drops_queued_mirror_work_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Page A" ~children:[ blk "before" () ] () ]
          ()
      in
      let db = db_of conn in
      let page = page_by_title db "Page A" in
      let block = first_block page in
      let report = with_title db block.id "after" in
      MM.set_enabled repo true;
      ignore (handle_tx_report report ~o:{ opts with defer = true } ());
      MM.set_enabled repo false;
      ignore (flush_repo ());
      check "disabling drops queued mirror work"
        (not (file_exists (page_path "pages/Page A.md"))))

(* (deftest repeated-edits-coalesce-to-latest-content-test ...) *)
let test_repeated_edits_coalesce_to_latest_content_test () =
  with_mirror_fs (fun () ->
      let page_uuid = "44444444-4444-4444-8444-444444444444" in
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Page A" ~uuid:page_uuid
                ~children:[ blk "before" () ] () ]
          ()
      in
      let block =
        first_block (page_by_title (db_of conn) "Page A")
      in
      let report1 = with_title (db_of conn) block.id "middle" in
      ignore (Datascript.reset_conn_bang conn report1.db_after);
      let report2 = with_title (db_of conn) block.id "latest" in
      MM.set_enabled repo true;
      ignore (handle_tx_report report1 ~o:{ opts with defer = true } ());
      ignore (handle_tx_report report2 ~o:{ opts with defer = true } ());
      let results = flush_repo () in
      check "edits coalesce to one write"
        (List.length (wire_results results) = 1);
      check_file "coalesced write has latest content"
        (page_path "pages/Page A.md")
        (Some (page_marker page_uuid ^ "\n\n- latest")))

(* (deftest rename-removes-old-mirror-path-test ...) *)
let test_rename_removes_old_mirror_path_test () =
  with_mirror_fs (fun () ->
      let page_uuid = "55555555-5555-4555-8555-555555555555" in
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Old Name" ~uuid:page_uuid
                ~children:[ blk "body" () ] () ]
          ()
      in
      let db = db_of conn in
      let page = page_by_title db "Old Name" in
      let old_path = page_path "pages/Old Name.md" in
      write_file old_path (page_marker page_uuid ^ "\n\n- body");
      let report =
        Datascript.with_tx_string db
          (Printf.sprintf
             "[{:db/id %d :block/title \"New Name\" :block/name \"new name\"}]"
             page.id)
      in
      ignore (Datascript.reset_conn_bang conn report.db_after);
      MM.set_enabled repo true;
      ignore (handle_tx_report report ());
      check "old mirror path deleted" (not (file_exists old_path));
      check_file "new mirror path written"
        (page_path "pages/New Name.md")
        (Some (page_marker page_uuid ^ "\n\n- body")))

(* (deftest rename-updates-linking-page-mirror-test ...) *)
let test_rename_updates_linking_page_mirror_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ Db_test_util.
                { page = { default_page with pg_title = Some "TargetOld" }
                ; blocks = [ blk "target" () ] }
            ; Db_test_util.
                { page = { default_page with pg_title = Some "Source" }
                ; blocks = [ blk "See [[TargetOld]]" () ] } ]
          ()
      in
      let db = db_of conn in
      let source = page_by_title db "Source" in
      let target = page_by_title db "TargetOld" in
      MM.set_enabled repo true;
      ignore (mirror_page db source ());
      check_file "source mirror before rename"
        (page_path "pages/Source.md")
        (Some (page_marker (uuid_of source) ^ "\n\n- See [[TargetOld]]"));
      let report =
        Datascript.with_tx_string db
          (Printf.sprintf
             "[{:db/id %d :block/title \"TargetNew\" :block/name \"targetnew\"}]"
             target.id)
      in
      ignore (Datascript.reset_conn_bang conn report.db_after);
      ignore (handle_tx_report report ());
      let content =
        Option.value ~default:"" (read_file_opt (page_path "pages/Source.md"))
      in
      check "linking page mirror updated"
        (content
         = page_marker (uuid_of source) ^ "\n\n- See [[TargetNew]]");
      check "old title no longer linked"
        (not (contains_sub content "[[TargetOld]]")))

(* (deftest rename-with-unchanged-content-removes-old-mirror-path-test ...) *)
let test_rename_with_unchanged_content_removes_old_mirror_path_test () =
  with_mirror_fs (fun () ->
      let page_uuid = "55555555-5555-4555-8555-555555555556" in
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Old Name2" ~uuid:page_uuid
                ~children:[ blk "body" () ] () ]
          ()
      in
      let db = db_of conn in
      let page = page_by_title db "Old Name2" in
      let old_path = page_path "pages/Old Name2.md" in
      let new_path = page_path "pages/New Name2.md" in
      let content = page_marker page_uuid ^ "\n\n- body" in
      write_file old_path content;
      write_file new_path content;
      let report =
        Datascript.with_tx_string db
          (Printf.sprintf
             "[{:db/id %d :block/title \"New Name2\" :block/name \"new name2\"}]"
             page.id)
      in
      ignore (Datascript.reset_conn_bang conn report.db_after);
      MM.set_enabled repo true;
      ignore (handle_tx_report report ());
      check "old path removed even though content unchanged"
        (not (file_exists old_path));
      check "new path still present" (file_exists new_path))

(* (deftest delete-removes-mirror-file-test ...) *)
let test_delete_removes_mirror_file_test () =
  with_mirror_fs (fun () ->
      let page_uuid = "66666666-6666-4666-8666-666666666666" in
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Delete Me" ~uuid:page_uuid
                ~children:[ blk "body" () ] () ]
          ()
      in
      let db = db_of conn in
      let page = page_by_title db "Delete Me" in
      let old_path = page_path "pages/Delete Me.md" in
      write_file old_path (page_marker page_uuid ^ "\n\n- body");
      let report =
        Datascript.with_tx_string db
          (Printf.sprintf "[[:db/retractEntity %d]]" page.id)
      in
      ignore (Datascript.reset_conn_bang conn report.db_after);
      MM.set_enabled repo true;
      ignore (handle_tx_report report ());
      check "mirror file deleted" (not (file_exists old_path)))

(* (deftest unchanged-content-skips-write-test ...) *)
let test_unchanged_content_skips_write_test () =
  with_mirror_fs (fun () ->
      let page_uuid = "77777777-7777-4777-8777-777777777777" in
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Page A" ~uuid:page_uuid
                ~children:[ blk "same" () ] () ]
          ()
      in
      let db = db_of conn in
      let page = page_by_title db "Page A" in
      let path = page_path "pages/Page A.md" in
      let content = page_marker page_uuid ^ "\n\n- same" in
      write_file path content;
      let result = mirror_page db page () in
      check "unchanged content skips write"
        (status_of result = Some "skipped");
      check_file "file unchanged" path (Some content))

(* (deftest windows-reserved-journal-filename-fails-with-diagnostic-test ...) *)
let test_windows_reserved_journal_filename_fails_with_diagnostic_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "CON"
                    ; pg_name = Some "con"
                    ; pg_extra =
                        [ "block/journal-day", Int 20240507
                        ; "block/tags", Kw "logseq.class/Journal" ] }
                ; blocks = [ blk "journal" () ] } ]
          ()
      in
      let db = db_of conn in
      let journal = journal_by_day db 20240507 in
      let result =
        mirror_page db journal
          ~o:
            { opts with
              journal_file_stem_fn = (fun _ -> Some "CON") }
          ()
      in
      check "status error" (status_of result = Some "error");
      check "reason invalid-file-name"
        (reason_of result = Some "invalid-file-name");
      check "no writes"
        (let journals = page_path "journals" in
         not (Sys.file_exists (journals ^ "/CON.md"))))

(* (deftest duplicate-journal-day-fails-without-overwrite-test ...) *)
let test_duplicate_journal_day_fails_without_overwrite_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "May 7th, 2024"
                    ; pg_name = Some "may 7th, 2024"
                    ; pg_extra =
                        [ "block/journal-day", Int 20240507
                        ; "block/tags", Kw "logseq.class/Journal" ] }
                ; blocks = [ blk "first" () ] }
            ; Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "May 07, 2024"
                    ; pg_name = Some "may 07, 2024"
                    ; pg_uuid = Some "12121212-1212-4212-8212-121212121212"
                    ; pg_extra =
                        [ "block/journal-day", Int 20240507
                        ; "block/tags", Kw "logseq.class/Journal" ] }
                ; blocks = [ blk "second" () ] } ]
          ()
      in
      let db = db_of conn in
      let journal = journal_by_day db 20240507 in
      let result = mirror_page db journal () in
      check "status error" (status_of result = Some "error");
      check "reason duplicate-journal-day"
        (reason_of result = Some "duplicate-journal-day");
      check "nothing written"
        (not (file_exists (page_path "journals/2024_05_07.md"))))

(* (deftest contents-page-is-mirrored-despite-built-in-flag-test ...) *)
let test_contents_page_is_mirrored_despite_built_in_flag_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Page A" ~children:[ blk "alpha" () ] () ]
          ~pre_txs:hidden_built_in_property_pre_txs ()
      in
      let contents = page_by_title (db_of conn) "Contents" in
      add_child_block conn contents "sidebar notes";
      check "contents is built-in" (Ldb.built_in contents);
      check "contents is not hidden" (not (Ldb.hidden contents));
      let db = db_of conn in
      let contents = page_by_title db "Contents" in
      let result = mirror_page db contents () in
      let path = page_path "pages/Contents.md" in
      let content =
        page_marker (uuid_of contents) ^ "\n\n- sidebar notes"
      in
      check "status written" (status_of result = Some "written");
      check_file "contents mirror written" path (Some content);
      check "write path" (path_of result = Some path))

(* (deftest internal-built-in-and-hidden-pages-are-not-mirrored-test ...) *)
let test_internal_built_in_and_hidden_pages_are_not_mirrored_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~properties:
            [ "rating",
              Db_test_util.{ default_property with p_type = "default" } ]
          ~pages_and_blocks:
            [ Db_test_util.
                { page =
                    { default_page with
                      pg_title = Some "Hidden User"
                    ; pg_properties =
                        [ "logseq.property/hide?", Bool true ] }
                ; blocks = [ blk "secret" () ] } ]
          ()
      in
      let db = db_of conn in
      let library = page_by_title db "Library" in
      let quick_add = page_by_title db "Quick add" in
      let recycle = page_by_title db "Recycle" in
      let hidden_user = page_by_title db "Hidden User" in
      let rating = page_by_title db "rating" in
      check "library built-in" (Ldb.built_in library);
      check "quick-add built-in" (Ldb.built_in quick_add);
      check "quick-add hidden" (Ldb.hidden quick_add);
      check "recycle hidden" (Ldb.hidden recycle);
      check "hidden-user hidden" (Ldb.hidden hidden_user);
      check "rating is property" (Ldb.is_property rating);
      let results =
        run
          (Db_worker_effect.all
             [ MM.mirror_page repo db library.id opts
             ; MM.mirror_page repo db quick_add.id opts
             ; MM.mirror_page repo db recycle.id opts
             ; MM.mirror_page repo db hidden_user.id opts
             ; MM.mirror_page repo db rating.id opts ])
      in
      check "all skipped as excluded-page"
        (List.for_all
           (fun r ->
              status_of r = Some "skipped"
              && reason_of r = Some "excluded-page")
           results);
      check "no mirror files written"
        (not (file_exists (page_path "pages/Library.md"))
         && not (file_exists (page_path "pages/Quick add.md"))
         && not (file_exists (page_path "pages/Recycle.md"))
         && not (file_exists (page_path "pages/Hidden User.md"))
         && not (file_exists (page_path "pages/rating.md"))))

(* (deftest contents-page-edit-updates-mirror-without-deleting-test ...) *)
let test_contents_page_edit_updates_mirror_without_deleting_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Page A" ~children:[ blk "alpha" () ] () ]
          ~pre_txs:hidden_built_in_property_pre_txs ()
      in
      let contents = page_by_title (db_of conn) "Contents" in
      add_child_block conn contents "before";
      let db = db_of conn in
      let contents = page_by_title db "Contents" in
      let block = block_by_content db "before" in
      let path = page_path "pages/Contents.md" in
      write_file path (page_marker (uuid_of contents) ^ "\n\n- before");
      let report = with_title db block.id "after" in
      ignore (Datascript.reset_conn_bang conn report.db_after);
      MM.set_enabled repo true;
      ignore (handle_tx_report report ());
      check_file "contents mirror updated, not deleted" path
        (Some (page_marker (uuid_of contents) ^ "\n\n- after")))

(* (deftest unrelated-page-tx-does-not-delete-contents-mirror-test ...) *)
let test_unrelated_page_tx_does_not_delete_contents_mirror_test () =
  with_mirror_fs (fun () ->
      let conn =
        conn_with_blocks
          ~pages_and_blocks:
            [ pb "Page A" ~children:[ blk "before" () ] () ]
          ()
      in
      let db = db_of conn in
      let contents = page_by_title db "Contents" in
      let page = page_by_title db "Page A" in
      let block = first_block page in
      let contents_path = page_path "pages/Contents.md" in
      let contents_content =
        page_marker (uuid_of contents) ^ "\n\n- sidebar notes"
      in
      write_file contents_path contents_content;
      let report = with_title db block.id "after" in
      MM.set_enabled repo true;
      ignore (handle_tx_report report ());
      check_file "contents mirror not deleted" contents_path
        (Some contents_content))

let cases : unit Alcotest.test_case list =
  [ Alcotest.test_case
      "replacing-graph-keeps-colliding-mirror-paths-distinct-test" `Quick
      test_replacing_graph_keeps_colliding_mirror_paths_distinct_test
  ; Alcotest.test_case "repo-mirror-dir-is-under-mirror-markdown-test" `Quick
      test_repo_mirror_dir_is_under_mirror_markdown_test
  ; Alcotest.test_case
      "normalize-file-name-is-cross-platform-and-deterministic-test" `Quick
      test_normalize_file_name_is_cross_platform_and_deterministic_test
  ; Alcotest.test_case
      "same-title-pages-write-distinct-stable-friendly-paths-test" `Quick
      test_same_title_pages_write_distinct_stable_friendly_paths_test
  ; Alcotest.test_case
      "normalized-title-collisions-write-distinct-stable-paths-test" `Quick
      test_normalized_title_collisions_write_distinct_stable_paths_test
  ; Alcotest.test_case "page-references-remain-wiki-links-test" `Quick
      test_page_references_remain_wiki_links_test
  ; Alcotest.test_case "affected-page-ids-detects-edited-block-page-test"
      `Quick test_affected_page_ids_detects_edited_block_page_test
  ; Alcotest.test_case
      "affected-page-ids-includes-linking-pages-on-page-rename-test" `Quick
      test_affected_page_ids_includes_linking_pages_on_page_rename_test
  ; Alcotest.test_case
      "block-db-id-comments-are-not-written-to-block-lines-test" `Quick
      test_block_db_id_comments_are_not_written_to_block_lines_test
  ; Alcotest.test_case
      "block-db-id-comments-are-not-written-to-mirror-markdown-test" `Quick
      test_block_db_id_comments_are_not_written_to_mirror_markdown_test
  ; Alcotest.test_case
      "multiline-blocks-do-not-render-db-id-comments-test" `Quick
      test_multiline_blocks_do_not_render_db_id_comments_test
  ; Alcotest.test_case "empty-block-does-not-render-db-id-comment-test"
      `Quick test_empty_block_does_not_render_db_id_comment_test
  ; Alcotest.test_case
      "multiline-markdown-list-lines-do-not-consume-next-block-db-id-test"
      `Quick
      test_multiline_markdown_list_lines_do_not_consume_next_block_db_id_test
  ; Alcotest.test_case
      "nested-blocks-do-not-render-db-id-comments-and-preserve-indent-test"
      `Quick
      test_nested_blocks_do_not_render_db_id_comments_and_preserve_indent_test
  ; Alcotest.test_case
      "code-blocks-still-render-without-db-id-comments-test" `Quick
      test_code_blocks_still_render_without_db_id_comments_test
  ; Alcotest.test_case
      "code-block-markdown-list-lines-do-not-consume-block-db-ids-test"
      `Quick
      test_code_block_markdown_list_lines_do_not_consume_block_db_ids_test
  ; Alcotest.test_case
      "property-value-lines-do-not-render-db-id-comments-test" `Quick
      test_property_value_lines_do_not_render_db_id_comments_test
  ; Alcotest.test_case "enabled-electron-edit-writes-page-mirror-test" `Quick
      test_enabled_electron_edit_writes_page_mirror_test
  ; Alcotest.test_case
      "missing-mirror-file-read-still-writes-page-mirror-test" `Quick
      test_missing_mirror_file_read_still_writes_page_mirror_test
  ; Alcotest.test_case
      "unexpected-mirror-file-read-error-rejects-page-mirror-test" `Quick
      test_unexpected_mirror_file_read_error_rejects_page_mirror_test
  ; Alcotest.test_case "page-mirror-exports-property-values-test" `Quick
      test_page_mirror_exports_property_values_test
  ; Alcotest.test_case
      "page-mirror-does-not-encode-background-color-as-highlight-test"
      `Quick test_page_mirror_does_not_encode_background_color_as_highlight_test
  ; Alcotest.test_case
      "page-mirror-preserves-markdown-semantic-block-formatting-test" `Quick
      test_page_mirror_preserves_markdown_semantic_block_formatting_test
  ; Alcotest.test_case
      "page-mirror-emits-todo-for-task-with-default-status-test" `Quick
      test_page_mirror_emits_todo_for_task_with_default_status_test
  ; Alcotest.test_case "page-mirror-skips-empty-placeholder-status-test"
      `Quick test_page_mirror_skips_empty_placeholder_status_test
  ; Alcotest.test_case
      "page-mirror-preserves-numbered-list-markers-status-and-tags-test"
      `Quick
      test_page_mirror_preserves_numbered_list_markers_status_and_tags_test
  ; Alcotest.test_case
      "page-mirror-does-not-treat-numbered-content-lines-as-blocks-test"
      `Quick
      test_page_mirror_does_not_treat_numbered_content_lines_as_blocks_test
  ; Alcotest.test_case
      "page-mirror-renders-embedded-node-content-and-tags-test" `Quick
      test_page_mirror_renders_embedded_node_content_and_tags_test
  ; Alcotest.test_case
      "page-mirror-exports-default-property-value-children-test" `Quick
      test_page_mirror_exports_default_property_value_children_test
  ; Alcotest.test_case
      "page-mirror-does-not-export-url-property-value-children-test" `Quick
      test_page_mirror_does_not_export_url_property_value_children_test
  ; Alcotest.test_case "page-mirror-exports-page-property-values-test"
      `Quick test_page_mirror_exports_page_property_values_test
  ; Alcotest.test_case
      "page-mirror-exports-node-property-values-as-page-refs-test" `Quick
      test_page_mirror_exports_node_property_values_as_page_refs_test
  ; Alcotest.test_case
      "journal-mirror-exports-page-and-block-property-values-test" `Quick
      test_journal_mirror_exports_page_and_block_property_values_test
  ; Alcotest.test_case
      "full-regeneration-writes-existing-non-built-in-non-property-pages-test"
      `Quick
      test_full_regeneration_writes_existing_non_built_in_non_property_pages_test
  ; Alcotest.test_case
      "electron-browser-worker-runtime-is-supported-test" `Quick
      test_electron_browser_worker_runtime_is_supported_test
  ; Alcotest.test_case "non-electron-browser-runtime-is-skipped-test" `Quick
      test_non_electron_browser_runtime_is_skipped_test
  ; Alcotest.test_case "enabled-electron-edit-writes-journal-mirror-test"
      `Quick test_enabled_electron_edit_writes_journal_mirror_test
  ; Alcotest.test_case "disabled-setting-does-not-write-mirror-test" `Quick
      test_disabled_setting_does_not_write_mirror_test
  ; Alcotest.test_case
      "db-listener-transact-writes-updated-page-mirror-test" `Quick
      test_db_listener_transact_writes_updated_page_mirror_test
  ; Alcotest.test_case
      "disabling-setting-drops-queued-mirror-work-test" `Quick
      test_disabling_setting_drops_queued_mirror_work_test
  ; Alcotest.test_case "repeated-edits-coalesce-to-latest-content-test"
      `Quick test_repeated_edits_coalesce_to_latest_content_test
  ; Alcotest.test_case "rename-removes-old-mirror-path-test" `Quick
      test_rename_removes_old_mirror_path_test
  ; Alcotest.test_case "rename-updates-linking-page-mirror-test" `Quick
      test_rename_updates_linking_page_mirror_test
  ; Alcotest.test_case
      "rename-with-unchanged-content-removes-old-mirror-path-test" `Quick
      test_rename_with_unchanged_content_removes_old_mirror_path_test
  ; Alcotest.test_case "delete-removes-mirror-file-test" `Quick
      test_delete_removes_mirror_file_test
  ; Alcotest.test_case "unchanged-content-skips-write-test" `Quick
      test_unchanged_content_skips_write_test
  ; Alcotest.test_case
      "windows-reserved-journal-filename-fails-with-diagnostic-test" `Quick
      test_windows_reserved_journal_filename_fails_with_diagnostic_test
  ; Alcotest.test_case
      "duplicate-journal-day-fails-without-overwrite-test" `Quick
      test_duplicate_journal_day_fails_without_overwrite_test
  ; Alcotest.test_case
      "contents-page-is-mirrored-despite-built-in-flag-test" `Quick
      test_contents_page_is_mirrored_despite_built_in_flag_test
  ; Alcotest.test_case
      "internal-built-in-and-hidden-pages-are-not-mirrored-test" `Quick
      test_internal_built_in_and_hidden_pages_are_not_mirrored_test
  ; Alcotest.test_case
      "contents-page-edit-updates-mirror-without-deleting-test" `Quick
      test_contents_page_edit_updates_mirror_without_deleting_test
  ; Alcotest.test_case
      "unrelated-page-tx-does-not-delete-contents-mirror-test" `Quick
      test_unrelated_page_tx_does_not_delete_contents_mirror_test ]
