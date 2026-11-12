let check label condition = if not condition then failwith label

let run () =
  let repo = "native-inline-pdf" in
  let path = Asset_store.asset_path repo "图 report.pdf" in
  List.iter (fun source ->
    check "inline PDF paths decode once inside the graph asset directory"
      (Asset_store.local_asset_path ~repo source = path))
    ["图%20report.pdf"; "../assets/图%20report.pdf";
     "./assets/%E5%9B%BE%20report.pdf"; "assets/图 report.pdf"];
  check "absolute native filenames keep literal percent and hash characters"
    (Asset_store.local_asset_path ~repo (Filename.concat (Asset_store.asset_dir repo) "100%#real.pdf")
     = Filename.concat (Asset_store.asset_dir repo) "100%#real.pdf");
  check "local file URLs decode their path once"
    (Asset_store.local_asset_path ~repo (Uri.to_string (Uri.make ~scheme:"file" ~path ())) = path);
  List.iter (fun source ->
    match Asset_store.local_asset_path ~repo source with
    | _ -> failwith ("unsafe inline PDF path was admitted: " ^ source)
    | exception Invalid_argument _ -> ())
    ["../../outside.pdf"; "../assets/../outside.pdf"; "bad%Q0.pdf";
     "file://other-host/document.pdf"; "https://example.invalid/a.pdf";
     "a.pdf#page=2"; "a.pdf?token=1"; "%00.pdf"; "//host/share.pdf"];
  let prior_model = !Runtime.read_model and prior_press = !Render_inline.pdf_link_press
  and prior_open = !Pdf_state.open_request and prior_journal = !Pdf_state.create_today_journal
  and prior_current = !Pdf_state.current in
  let current_model = ref {Model.initial with repo=Some repo} in
  Runtime.read_model := (fun () -> !current_model);
  let backend : Lui_protocol.backend = {
    backend_profile=Lui_protocol.profile Lui_protocol.MacOS Lui_protocol.NshHost;
    apply_batch=(fun _ -> true)} in
  let app = Lui_app.create backend () (fun () () -> ())
    (fun _ _ _ -> Render_inline.pdf_link_el ~src:"../assets/图%20report.pdf" ~alt:"Report") in
  Fun.protect ~finally:(fun () ->
    ignore (Lui_app.dispose app); Runtime.read_model := prior_model;
    Render_inline.pdf_link_press := prior_press; Pdf_state.open_request := prior_open;
    Pdf_state.create_today_journal := prior_journal; Pdf_state.current := prior_current)
    (fun () ->
      Pdf.install ();
      ignore (Lui_app.start app); ignore (Lui_app.flush app);
      let runtime = Lui_app.runtime app in
      let button = Hashtbl.fold (fun id kind found ->
        if kind=Lui_protocol.Text then Some id else found)
        runtime.Lui_runtime.mounted_nodes None |> Option.get in
      ignore (Lui_app.dispatch_event app (Lui_protocol.Press button));
      check "actual native PDF install opens inline documents without inventing an asset entity"
        (match !Pdf_state.current with
         | Some asset -> asset.Model.pdf_url=path && asset.pdf_block_uuid=None
         | None -> false);
      Pdf_state.current := None;
      current_model := {Model.initial with repo=Some "different-graph"};
      ignore (Lui_app.dispatch_event app (Lui_protocol.Press button));
      check "retained inline PDF presses cannot open against a different graph"
        (!Pdf_state.current=None);
      current_model := Model.initial;
      ignore (Lui_app.dispatch_event app (Lui_protocol.Press button));
      check "closed graphs do not open retained inline PDF links" (!Pdf_state.current=None));
  print_endline "PASS actual native inline PDF opener and local asset path ownership"
