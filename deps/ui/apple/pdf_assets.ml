(* Native twin of src/extension/pdf_assets.ml — annotation persistence,
   ref-block lifecycle, and open-by-ref navigation for the PDFKit
   viewer. Assets live on disk under the graph's assets dir (no pfs),
   Js.Promise resolves synchronously, and area images arrive as bytes
   rendered by the Swift side. *)

open Promise_ext
module W = Wire

let t = Lui_elements.spacer ~key:"pdf-assets" []

let repo () = Runtime.repo ()

let q query inputs =
  Runtime.invoke2 "thread-api/q" (W.String (repo ()))
    (W.Array ([ W.String query ] @ inputs))

(* cljs inflate_asset — the pdf_asset record the viewer opens on *)
let inflate ~uuid ~db_id ~external_url ~path : Model.pdf_asset =
  let n = String.length path in
  { Model.pdf_key = path
  ; pdf_block_uuid = uuid
  ; pdf_block_db_id = db_id
  ; pdf_block_external_url = external_url
  ; pdf_identity =
      (if n > 15 then String.sub path (n - 15) 15 else path)
  ; pdf_filename = Filename.basename path
  ; pdf_url = path
  ; pdf_original_path = path
  }

(* cljs open_pdf_file — an asset block's open affordance *)
let open_pdf_file ~uuid ~ext ~(b : Model.block) : unit =
  let path =
    Filename.concat
      (Asset_store.asset_dir (Runtime.repo ()))
      (uuid ^ "." ^ ext)
  in
  Pdf_state.set_current
    (Some
       (inflate ~uuid:b.Model.block_uuid ~db_id:b.block_db_id
          ~external_url:b.Model.block_asset_url ~path))

(* ---------- hl <-> wire ---------- *)

let sc_rect_wire (r : Model.hl_rect) : W.t =
  W.Map
    [ W.Keyword "x1", W.Float r.hl_x1
    ; W.Keyword "y1", W.Float r.hl_y1
    ; W.Keyword "x2", W.Float r.hl_x2
    ; W.Keyword "y2", W.Float r.hl_y2
    ; W.Keyword "width", W.Float r.hl_w
    ; W.Keyword "height", W.Float r.hl_h
    ]

(* cljs hl -> :logseq.property.pdf/hl-value map *)
let hl_to_wire (hl : Model.hl) : W.t =
  W.Map
    ([ W.Keyword "page", W.Int hl.hl_page
     ; W.Keyword "position",
       W.Map
         [ W.Keyword "bounding", sc_rect_wire hl.hl_bounding
         ; W.Keyword "rects",
           W.Array (List.map sc_rect_wire hl.hl_rects)
         ; W.Keyword "page", W.Int hl.hl_page
         ]
     ; W.Keyword "content",
       W.Map
         ([ W.Keyword "text", W.String hl.hl_text ]
          @
          match hl.hl_image with
          | Some i -> [ W.Keyword "image", W.Int64 i ]
          | None -> [])
     ; W.Keyword "properties",
       W.Map
         (match hl.hl_color with
          | Some c -> [ W.Keyword "color", W.Keyword c ]
          | None -> [])
     ]
    @
    match hl.hl_id with
    | Some id -> [ W.Keyword "id", W.Uuid id ]
    | None -> [])

let area_highlight (hl : Model.hl) = hl.hl_image <> None

(* ---------- worker access ---------- *)

let entity_of ref_wire = Properties_data.entity ref_wire

let entity_uuid (w : W.t) = W.map_get_uuid w "block/uuid"

let entity_dbid (w : W.t) = W.map_get_int w "db/id"

let entity_prop_dbid (w : W.t) k =
  match W.get w k with
  | Some m -> W.map_get_int m "db/id"
  | None -> None

(* cljs <highlight-color-id — closed values of hl-color, match by title *)
let highlight_color_id color =
  let* ws =
    Properties_data.closed_values
      (W.Keyword "logseq.property.pdf/hl-color")
  in
  Js.Promise.resolve
    (List.find_map
       (fun (w : W.t) ->
         match W.map_get_string w "block/title" with
         | Some t when t = color -> W.map_get_int w "db/id"
         | _ -> None)
       (W.elems ws))

(* cljs :logseq.property.asset/last-visit-page off the pdf block *)
let last_visit_page (asset : Model.pdf_asset) : int option Js.Promise.t =
  match asset.Model.pdf_block_db_id with
  | None -> Js.Promise.resolve None
  | Some id ->
      (let* w = entity_of (W.Int id) in
       Js.Promise.resolve
         (W.map_get_int w "logseq.property.asset/last-visit-page"))
      |> Js.Promise.catch (fun _ -> Js.Promise.resolve None)

(* cljs db-based-load-hls-data$ — annotation blocks point at the pdf
   asset via :logseq.property/asset; their hl-value maps are the hls.
   Returns (hls, last-visit-page, last-visit-scale) like cljs
   {highlights extra}. *)
let load_hls_data (asset : Model.pdf_asset)
    : (Model.hl list * int option * string) Js.Promise.t =
  match asset.Model.pdf_block_db_id with
  | None -> Js.Promise.resolve ([], None, "auto")
  | Some ref_id ->
      let hls_p =
        (let* rows =
           q "[:find (pull ?e [*]) :in $ ?ref-id \
              :where [?e :logseq.property/asset ?ref-id]]"
             [ W.Int ref_id ]
         in
         (* the daemon wire preserves datascript result sets as
            W.Set — elems covers Array/List/Set *)
         let hls =
           List.filter_map
             (fun row ->
               List.find_map
                 (fun e ->
                   Decode.hl_of_wire
                     (W.get e "logseq.property.pdf/hl-value"))
                 (W.elems row))
             (W.elems rows)
         in
         Js.Promise.resolve hls)
        |> Js.Promise.catch (fun e ->
               Platform.console_error ("pdf hls load failed", e);
               Js.Promise.resolve [])
      in
      let* hls, page = Js.Promise.all2 (hls_p, last_visit_page asset) in
      Js.Promise.resolve (hls, page, Pdf_state.stored_scale ref_id)

(* cljs db-based-ensure-ref-block! — annotation ref block under the pdf
   asset block, created on demand when the hl is first referenced *)
let ensure_ref_block (asset : Model.pdf_asset) (hl : Model.hl)
    : unit Js.Promise.t =
  match hl.hl_id, asset.Model.pdf_block_uuid with
  | None, _ | _, None -> Js.Promise.resolve ()
  | Some id, Some block_uuid ->
      let* w = entity_of (Properties_data.uuid_ref id) in
      (match W.map_get_string w "block/title" with
       | Some _ -> Js.Promise.resolve ()
       | None ->
           let image' = hl.hl_image <> None in
           let text =
             if image' then Dates.short_date_of_ts (Js.Date.now ())
             else hl.hl_text
           in
           let* color_kvs =
             match hl.hl_color with
             | Some c ->
                 let* i = highlight_color_id c in
                 Js.Promise.resolve
                   (match i with
                    | Some cid ->
                        [ "logseq.property.pdf/hl-color", W.Int cid ]
                    | None -> [])
             | None -> Js.Promise.resolve []
           in
           (let kvs =
                          [ "block/uuid", W.Uuid id
                          ; "block/title", W.String text
                          ; "block/tags",
                            W.Set
                              [ W.Keyword "logseq.class/Pdf-annotation" ]
                          ; "logseq.property/ls-type",
                            W.Keyword "annotation"
                          ]
                          @ color_kvs
                          @ (match asset.pdf_block_db_id with
                             | Some bid ->
                                 [ "logseq.property/asset", W.Int bid ]
                             | None -> [])
                          @ [ "logseq.property.pdf/hl-page",
                              W.Int hl.hl_page
                            ; "logseq.property.pdf/hl-value",
                              hl_to_wire hl
                            ]
                          @
                          if image' then
                            [ "block/collapsed?", W.Bool true
                            ; "logseq.property.pdf/hl-type",
                              W.Keyword "area"
                            ]
                            @
                            (match hl.hl_image with
                             | Some i ->
                                 [ "logseq.property.pdf/hl-image",
                                   W.Int (Int64.to_int i)
                                 ]
                             | None -> [])
                          else []
                        in
                        let bm =
                          W.Map
                            (List.map (fun (k, v) -> (W.String k, v)) kvs)
                        in
                        let* _ =
                          Outliner_ops.apply_result
                            ~opts:(Outliner_ops.op_opts "insert-blocks")
                            [ Outliner_ops.insert_blocks ~bottom:true
                                [ bm ] block_uuid ~sibling:false ]
                        in
                        (* keep the blocks pane in sync like
                           apply_and_refresh *)
                        Outliner_ops.apply_and_refresh []))

(* cljs update-hl-block! — mirror color onto the ref block property *)
let update_hl_block (hl : Model.hl) =
  match hl.hl_id, hl.hl_color with
  | Some uuid, Some color ->
      ignore
        (let* id = highlight_color_id color in
         match id with
         | Some cid ->
             Properties_data.set_block_property ~block_uuid:uuid
               ~ident:"logseq.property.pdf/hl-color"
               ~value:(W.Int cid)
         | None -> Js.Promise.resolve (W.Map []))
  | _ -> ()

(* cljs del-ref-block! *)
let del_ref_block (hl : Model.hl) =
  match hl.hl_id with
  | Some uuid ->
      ignore
        (Outliner_ops.apply_and_refresh
           [ Outliner_ops.delete_blocks [ uuid ] ])
  | None -> ()

(* cljs copy-hl-ref! — ensure the ref block exists, then copy ((uuid)) *)
let copy_hl_ref (hl : Model.hl) =
  match !Pdf_state.current, hl.hl_id with
  | Some asset, Some id ->
      ignore
        (let* () = ensure_ref_block asset hl in
         Platform.copy_to_clipboard ("((" ^ id ^ "))");
         Js.Promise.resolve ())
  | _ -> ()

(* cljs goto-block-ref! — open the ref block's page *)
let goto_block_ref (hl : Model.hl) =
  match hl.hl_id with
  | Some id ->
      ignore
        (let* () =
           match !Pdf_state.current with
           | Some asset -> ensure_ref_block asset hl
           | None -> Js.Promise.resolve ()
         in
         Platform.set_location_hash
           (Runtime.nav_hash ("#/page/" ^ id));
         Js.Promise.resolve ())
  | None -> ()

(* cljs goto-annotations-page! — pdf block page, optionally anchored to
   one annotation block *)
let goto_annotations_page ?id (asset : Model.pdf_asset) =
  match asset.Model.pdf_block_uuid with
  | Some u ->
      let anchor =
        match id with
        | Some id -> "?anchor=block-content-" ^ id
        | None -> ""
      in
      Platform.set_location_hash
        (Runtime.nav_hash ("#/page/" ^ u ^ anchor))
  | None -> ()

(* cljs db-based-open-block-ref! — annotation-block click opens its pdf
   and arms :pdf/ref-highlight for the next viewer boot *)
let open_block_ref (b : Model.block) =
  match b.Model.block_asset_ref, b.block_hl with
  | Some asset_dbid, Some hl ->
      ignore
        (let* aw = entity_of (W.Int asset_dbid) in
         match W.map_get_uuid aw "block/uuid" with
         | None -> Js.Promise.resolve ()
         | Some uuid ->
             let path =
               Filename.concat
                 (Asset_store.asset_dir (repo ()))
                 (uuid ^ ".pdf")
             in
             if not (Sys.file_exists path) then Js.Promise.resolve ()
             else begin
               Pdf_state.ref_hl := Some hl;
               let external_url =
                 W.map_get_string aw
                   "logseq.property.asset/external-url"
               in
               Pdf_state.set_current
                 (Some
                    (inflate ~uuid:(Some uuid) ~db_id:(Some asset_dbid)
                       ~external_url ~path));
               Js.Promise.resolve ()
             end)
  | _ -> ()

(* cljs goto the hl-image asset block (asset-action-bar ref button) *)
let goto_asset_block uuid =
  Platform.set_location_hash (Runtime.nav_hash ("#/page/" ^ uuid))

(* ---------- area image capture + persist ---------- *)

(* cljs editor-assets db-based-save-assets! {:pdf-area? true} — write
   assets/<uuid>.png, insert an asset block into today's journal *)
let save_area_png (png : Bytes.t) : int option Js.Promise.t =
  let uuid = Platform.random_uuid () in
  let* checksum = Asset_store.sha256_hex png in
  let* () =
    Asset_store.write_asset ~repo:(repo ()) ~name:(uuid ^ ".png")
      ~u8:png
  in
  let size = Bytes.length png in
  let day = Dates.today_journal_day () in
  let* w =
    let* w = Properties_data.journal_page_by_day day in
    match W.map_get_uuid w "block/uuid" with
    | Some _ -> Js.Promise.resolve w
    | None ->
        let* () = !Pdf_state.create_today_journal () in
        Properties_data.journal_page_by_day day
  in
  match W.map_get_uuid w "block/uuid" with
  | Some page_uuid ->
      let bm =
        W.Map
          [ W.String "block/uuid", W.Uuid uuid
          ; W.String "block/title", W.String "pdf area highlight"
          ; W.String "block/tags",
            W.Set [ W.Keyword "logseq.class/Asset" ]
          ; W.String "logseq.property.asset/type", W.String "png"
          ; W.String "logseq.property.asset/size", W.Int size
          ; W.String "logseq.property.asset/checksum",
            W.String checksum
          ]
      in
      let* _ =
        Outliner_ops.apply_result
          ~opts:(Outliner_ops.op_opts "insert-blocks")
          [ Outliner_ops.insert_blocks ~bottom:true [ bm ] page_uuid
              ~sibling:false ]
      in
      let* e = entity_of (Properties_data.uuid_ref uuid) in
      Js.Promise.resolve (entity_dbid e)
  | None -> Js.Promise.resolve None

(* the on-disk path an area hl's image asset resolves to (content.image
   is the asset block's db/id) *)
let hl_image_path (db_id : int64) : string option Js.Promise.t =
  (let* w = entity_of (W.Int (Int64.to_int db_id)) in
   match entity_uuid w with
   | Some u ->
       Js.Promise.resolve
         (Some
            (Filename.concat
               (Asset_store.asset_dir (repo ()))
               (u ^ ".png")))
   | None -> Js.Promise.resolve None)
  |> Js.Promise.catch (fun _ -> Js.Promise.resolve None)
