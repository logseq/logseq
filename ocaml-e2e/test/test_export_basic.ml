(** Port of export_basic_test.clj. *)

open Fest.Promise

let env = Fixtures.shared_open_page ()

external stat_sync : string -> 'a = "statSync" [@@mel.module "node:fs"]
external stat_size : 'a -> float = "size" [@@mel.get]

let file_size path = stat_size (stat_sync path)

let open_export env =
  let* () = Util.double_esc env in
  let* () = Pw.click env ".toolbar-dots-btn" in
  let* () =
    Pw.click_l
      (Ls_locator.filter env ~has_text:"Export graph"
         "[role='menuitem']")
  in
  Pw.wait_for env ".export"

let download env ?timeout label =
  let dl_p = Playwright.wait_for_event ?timeout (Env.page env) "download" in
  let* () =
    Pw.click_l
      (Ls_locator.filter env ~has_text:label ".export a")
  in
  dl_p

let nonempty_download (dl : Playwright.download) =
  let name = Playwright.download_suggested_filename dl in
  if String.trim name = "" then Js.Promise.resolve false
  else
    let* path = Playwright.download_path dl in
    Js.Promise.resolve (file_size path > 0.)

let () =
  Fest.Promise.test "graph-export-downloads-browser-artifacts-test"
    (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let* () =
      Block.new_blocks env [ "export root"; "export child" ]
    in
    let* _ = Util.set_tag env "export-tag" in
    let* () = Block.indent env in
    let* () = open_export env in
    let* _ =
      E2e_assert.is_visible_l
        (Ls_locator.filter env
           ~has_text:"Export SQLite DB"
           ".export a")
    in
    let rec go = function
      | [] -> Js.Promise.resolve ()
      | label :: rest ->
          let* dl = download env label in
          let* ok = nonempty_download dl in
          Fest.equal ok true Fest.expect;
          go rest
    in
    let* () =
      go [ "Export EDN file"; "Export as standard Markdown"
         ; "Export debug transit file" ]
    in
    let* dl = download env ~timeout:60000. "Export both SQLite DB and assets" in
    let* ok = nonempty_download dl in
    Fest.equal ok true Fest.expect;
    let* path = Playwright.download_path dl in
    let (entries : string) =
      Node.Child_process.execSync
        (Printf.sprintf "unzip -Z1 %s" path)
        (Node.Child_process.option ~encoding:"utf8" ())
    in
    let names =
      entries |> String.split_on_char '\n'
      |> List.filter (fun s -> String.trim s <> "")
    in
    Fest.equal
      (List.exists
         (fun s ->
           let n = String.length s in
           n >= 7 && String.sub s (n - 7) 7 = ".sqlite")
         names)
      true Fest.expect;
    Fest.equal (List.for_all (fun s -> String.trim s <> "") names) true
      Fest.expect;
    let* _ =
      E2e_assert.is_hidden env ".ui__loading, .loading-graph"
    in
    Fixtures.validate_graph env)
