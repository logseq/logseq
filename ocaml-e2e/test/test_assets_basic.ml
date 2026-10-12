(** Port of assets_basic_test.clj. *)

open Fest.Promise

let env = Fixtures.shared_open_page ()

let asset_path rel =
  Node.Path.normalize (Node.Path.join2 "../" rel)

external path_absolute : string -> string = "resolve" [@@mel.module "node:path"]

let asset_path_abs rel = path_absolute (asset_path rel)

let img_q = ".ls-page-blocks .asset-container img"

let () =
  Fest.Promise.test "image-upload-lightbox-and-resize-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let page = Env.page env in
    let files =
      [| asset_path_abs "assets/icon.png";
         asset_path_abs "assets/splash.png";
         asset_path_abs "resources/img/logo.png" |]
    in
    let pending = ref (Array.to_list files) in
    let chooser_handler (fc : Playwright.file_chooser) =
      match !pending with
      | file :: rest ->
          pending := rest;
          ignore (Playwright.file_chooser_set_files fc [| file |])
      | [] -> ()
    in
    Playwright.on_event page "filechooser" chooser_handler;
    let* () = Block.new_block env "image uploads" in
    let rec upload i =
      if i > Array.length files then Js.Promise.resolve ()
      else
        let* () = Util.input_command env "Upload an asset" in
        let* () = E2e_assert.have_count env img_q i in
        upload (i + 1)
    in
    let* () = upload 1 in
    let* () = E2e_assert.have_count env img_q 3 in
    (* the page is shared by every test in this namespace *)
    Playwright.off_event page "filechooser" chooser_handler;
    let imgs = Pw.q env img_q in
    let* n = Playwright.count imgs in
    let rec check_src i =
      if i >= n then Js.Promise.resolve ()
      else
        let img = Playwright.locator_nth imgs i in
        let* src = Playwright.get_attribute img "src" in
        Fest.equal (String.trim (Option.value ~default:"" src) <> "") true
          Fest.expect;
        let* (w_ : float) =
          Pw.eval_js env
            (Printf.sprintf
               "document.querySelectorAll('%s')[%d].naturalWidth" img_q i)
        in
        Fest.equal (w_ > 0.) true Fest.expect;
        check_src (i + 1)
    in
    let* () = check_src 0 in
    let first_image = Playwright.locator_first imgs in
    let first_block =
      Playwright.locator_first
        (Pw.q env ".ls-page-blocks .ls-block:has(.asset-container img)")
    in
    let* block_uuid = Playwright.get_attribute first_block "blockid" in
    let* () = Pw.click_l first_image in
    let* _ = E2e_assert.is_visible env ".pswp.pswp--open" in
    let* _ =
      Playwright.wait_for_function page "window.pswp?.opener?.isOpen"
    in
    let* () =
      Pw.click_l
        (Playwright.locator_first (Pw.get_by_label env "Close"))
    in
    let* _ = E2e_assert.is_hidden env ".pswp.pswp--open" in
    let* () =
      Playwright.hover
        (Playwright.locator_first (Pw.q env ".ls-page-blocks .ls-resize-image"))
    in
    let handle =
      Playwright.locator_first
        (Pw.q env ".ls-page-blocks .image-resize.handle-right")
    in
    let target =
      Playwright.locator_first (Pw.q env ".ls-page-blocks .block-content")
    in
    let* _ = E2e_assert.is_visible_l handle in
    let* () = Playwright.drag_to handle target in
    let* () = Util.wait_timeout env 250. in
    let rec wait_props i =
      let* block =
        Api.ls_api_call env "editor.getBlock"
          [| Api.str (Option.value ~default:"" block_uuid) |]
      in
      let metadata = Api.get block "properties" in
      if Js.Nullable.toOption metadata <> None then
        Js.Promise.resolve true
      else if i <= 0 then Js.Promise.resolve false
      else
        let* () = Util.wait_timeout env 500. in
        wait_props (i - 1)
    in
    let* has_metadata = wait_props 6 in
    Fest.equal has_metadata true Fest.expect;
    let* () = Pw.refresh env in
    let* () = E2e_assert.have_count env img_q 3 in
    let* asset_tag =
      Api.ls_api_call env "editor.getTag"
        [| Api.str "logseq.class/Asset" |]
    in
    let* _ =
      Api.ls_api_call env "app.pushState"
        [| Api.str "page";
           Api.obj [ ("name", Api.str (Option.value ~default:"" (Api.get_uuid asset_tag ()))) ];
           Api.null |]
    in
    let* () = Pw.wait_for env ".ls-view-body .ls-table-row" in
    let* () = E2e_assert.have_count env ".ls-view-body .ls-table-row" 3 in
    let* _ =
      E2e_assert.is_visible env ".ls-table-header-cell:has-text('File')"
    in
    let* _ =
      E2e_assert.is_hidden env ".ls-table-header-cell:has-text('checksum')"
    in
    Fixtures.validate_graph env)

let () =
  Fest.Promise.test "image-action-menu-delete-test" (fun () ->
    let* env = env in
    let* () = Fixtures.new_logseq_page env in
    let page = Env.page env in
    (* a file the upload test above has not added: a second upload of the same
       bytes is refused as a duplicate *)
    let file = asset_path_abs "resources/icons/logseq.png" in
    let chooser_handler (fc : Playwright.file_chooser) =
      ignore (Playwright.file_chooser_set_files fc [| file |])
    in
    Playwright.on_event page "filechooser" chooser_handler;
    let* () = Block.new_block env "image to delete" in
    let* () = Util.input_command env "Upload an asset" in
    let* () = E2e_assert.have_count env img_q 1 in
    Playwright.off_event page "filechooser" chooser_handler;
    let* () = Util.double_esc env in
    let container =
      Playwright.locator_first (Pw.q env ".ls-page-blocks .asset-container")
    in
    let* () = Playwright.hover container in
    let* () =
      Pw.click_l
        (Playwright.locator_first
           (Pw.q env ".ls-page-blocks .asset-action-bar button"))
    in
    let* _ = E2e_assert.is_visible env "[role=menu]" in
    let* () =
      Pw.click_l (Playwright.locator_first (Util.get_by_text env "Delete image" true))
    in
    let* _ =
      E2e_assert.is_visible_l
        (Playwright.locator_first
           (Util.get_by_text env "Are you sure you want to delete this image?"
              true))
    in
    let* () =
      Pw.click_l (Playwright.locator_first (Util.get_by_text env "Confirm" true))
    in
    let* () = E2e_assert.have_count env img_q 0 in
    Fixtures.validate_graph env)
