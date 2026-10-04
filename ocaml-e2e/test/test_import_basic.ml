(** Port of import_basic_test.clj. *)

open Fest.Promise

let env = Fixtures.shared_open_page ()

external process_cwd : Node.Process.t -> string = "cwd" [@@mel.send]

let open_import env =
  let* () = Util.double_esc env in
  let* () = Pw.click env ".toolbar-dots-btn" in
  let* () =
    Pw.click_l
      (Ls_locator.filter env ~has_text:"Import"
         "[role='menuitem']")
  in
  Pw.wait_for env ".importer"

let () =
  Fest.Promise.test
    "import-options-and-invalid-edn-preserve-current-graph-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* current_graph =
      Api.ls_api_call env "app.getCurrentGraph" [||]
    in
    let invalid_file =
      Node.Path.join2 (process_cwd Node.Process.process)
        "../clj-e2e/resources/invalid-db-export.edn"
      |> Node.Path.normalize
    in
    let graph_name = "invalid-import-" ^ Js.String.make (Js.Date.now ()) in
    let* () = open_import env in
    let rec go = function
      | [] -> Js.Promise.resolve ()
      | selector :: rest ->
          let* () = E2e_assert.have_count env selector 1 in
          go rest
    in
    let* () =
      go [ "#import-sqlite-db"; "#import-sqlite-zip"; "#import-file-graph"
         ; "#import-debug-transit"; "#import-db-edn" ]
    in
    let* () =
      Playwright.set_input_files (Pw.q env "#import-db-edn") invalid_file
    in
    let* () = Pw.wait_for env "#modal-headline" in
    let* () =
      Pw.click_l
        (Ls_locator.filter env ~has_text:"Submit" "button")
    in
    let* _ = E2e_assert.is_visible env ".ui__toast" in
    let* _ = E2e_assert.is_visible env "#modal-headline" in
    let* () = Pw.fill env ".form-input" graph_name in
    let* () =
      Pw.click_l
        (Ls_locator.filter env ~has_text:"Submit" "button")
    in
    let* () = Pw.wait_for env ".ui__toast" in
    let* _ = E2e_assert.is_hidden env ".ui__loading, .loading-graph" in
    let* g2 = Api.ls_api_call env "app.getCurrentGraph" [||] in
    Fest.deep_equal g2 current_graph Fest.expect;
    let* () = Graph.goto_all_graphs env in
    let* _ =
      E2e_assert.is_hidden_l
        (Ls_locator.filter env ~has_text:graph_name
           "#main-content-container")
    in
    Fixtures.validate_graph env)
