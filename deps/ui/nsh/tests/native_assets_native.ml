let check label condition = if not condition then failwith label

let render_asset_kinds () =
  let previous_model = !Runtime.read_model in
  let repo="native-asset-kinds" in
  Runtime.read_model := (fun () -> {Model.initial with repo=Some repo});
  let block uuid ext title = Decode.block_of_wire (Wire.Map [
    Wire.Keyword "block/uuid",Wire.Uuid uuid;
    Wire.Keyword "block/title",Wire.String title;
    Wire.Keyword "logseq.property.asset/type",Wire.String ext]) in
  let image=block "image" "PNG" "Photo"
  and video=block "video" "mp4" "Movie"
  and document=block "document" "txt" "Notes"
  and pdf=block "pdf" "pdf" "Report"
  and audio=block "audio" "webm" "Audio-recording" in
  check "native media classification recognizes recorded webm audio"
    (Asset_dom.asset_kind ~ext:"webm" ~title:"Audio-recording"=Asset_dom.Audio);
  let registry=Lui_extension.registry () in
  Logseq_el.register_all registry;
  Logseq_codemirror.register registry;
  Logseq_editor.register registry;
  let backend : Lui_protocol.backend = {
    backend_profile=Lui_protocol.profile Lui_protocol.MacOS Lui_protocol.NshHost;
    apply_batch=(fun _ -> true)} in
  let app=Lui_app.create_with_extensions backend registry () (fun () () -> ())
    (fun _ _ _ -> Lui_elements.column [Asset_dom.block_view "image" image;
      Asset_dom.block_view "video" video; Asset_dom.block_view "document" document;
      Asset_dom.block_view "pdf" pdf; Asset_dom.block_view "audio" audio]) in
  Fun.protect ~finally:(fun () -> ignore (Lui_app.dispose app); Runtime.read_model:=previous_model)
    (fun () ->
      ignore (Lui_app.start app); ignore (Lui_app.flush app);
      let runtime=Lui_app.runtime app in
      let kind_count kind = Hashtbl.fold (fun _ actual count ->
        if actual=kind then count+1 else count) runtime.Lui_runtime.mounted_nodes 0 in
      check "actual native asset views emit only image assets as Image"
        (kind_count Lui_protocol.Image=1);
      check "actual native video uses the typed media surface"
        (kind_count Lui_protocol.MediaSurface=1);
      check "recorded native webm mounts the actual audio factory, not an image or external link"
        (Hashtbl.fold (fun _ identifier count -> if identifier="logseq-audio" then count+1 else count)
          runtime.Lui_runtime.runtime_extension_nodes 0=1);
      Hashtbl.iter (fun node kind -> if kind=Lui_protocol.MediaSurface then
        check "video source is the current graph's actual asset path"
          (Lui_protocol.Property_map.find_opt Lui_protocol.UrlValue
            (Hashtbl.find runtime.Lui_runtime.runtime_properties node)
            =Some (Lui_protocol.StringValue (Asset_store.asset_path repo "video.mp4"))))
        runtime.Lui_runtime.mounted_nodes;
      let links=Hashtbl.fold (fun node identifier found ->
        if identifier="logseq-a" then node::found else found)
        runtime.Lui_runtime.runtime_extension_nodes [] in
      check "generic native assets mount one managed link, not an image" (List.length links=1);
      let properties=Hashtbl.find runtime.Lui_runtime.runtime_extension_properties (List.hd links) in
      let string name = match Lui_protocol.String_map.find_opt name properties with
        | Some (Lui_protocol.StringValue value) -> value
        | _ -> failwith ("missing native asset extension property: " ^ name) in
      let attrs=Yojson.Safe.from_string (string "attrs") in
      check "managed file activation carries exact captured graph and filename"
        (Yojson.Safe.Util.member "data-asset-graph" attrs=`String repo
         && Yojson.Safe.Util.member "data-asset-file" attrs=`String "document.txt");
      check "managed asset label uses the user-facing title" (string "text"="Notes.txt"))

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
      Pdf_state.current := None;
      ignore (Lui_app.start app); ignore (Lui_app.flush app);
      let runtime = Lui_app.runtime app in
      let pressable = Hashtbl.fold (fun id properties found ->
        if Lui_protocol.Property_map.find_opt Lui_protocol.PressEnabled properties
          =Some (Lui_protocol.BoolValue true)
          && Hashtbl.mem runtime.Lui_runtime.event_handlers id then id::found else found)
        runtime.Lui_runtime.runtime_properties [] in
      let button=match pressable with [node] -> node
        | _ -> failwith "inline PDF must own exactly one retained press handler" in
      let press () =
        check "inline PDF's actual retained node accepts its canonical press"
          (Lui_app.dispatch_event app (Lui_protocol.Press button));
        (* Runtime dispatch queues owner effects; flush before observing state. *)
        ignore (Lui_app.flush app) in
      press ();
      check "actual native PDF install opens inline documents without inventing an asset entity"
        (match !Pdf_state.current with
         | Some asset -> asset.Model.pdf_url=path && asset.pdf_block_uuid=None
         | None -> false);
      Pdf_state.current := None;
      current_model := {Model.initial with repo=Some "different-graph"};
      press ();
      check "retained inline PDF presses cannot open against a different graph"
        (!Pdf_state.current=None);
      current_model := Model.initial;
      press ();
      check "closed graphs do not open retained inline PDF links" (!Pdf_state.current=None));
  print_endline "PASS actual native inline PDF opener and local asset path ownership"
