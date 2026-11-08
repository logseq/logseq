(* Native annotation persistence and ref-block lifecycle. Assets live
   under the graph's assets dir; area images arrive as host-rendered bytes. *)

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

type write_context =
  { model : Model.t
  ; repo : string
  ; history : W.t
  ; runtime_url : string
  ; current : unit -> bool
  ; journal_day : int
  ; journal_title : string
  }

let capture_write_context ?(current = fun () -> true) () =
  let model = Runtime.model () in
  match model.Model.repo with
  | None -> invalid_arg "PDF annotations require an open graph"
  | Some repo ->
      let asset = !Pdf_state.current in
      let history = Outliner_ops.current_history_opts (W.Map []) in
      let journal_day = Dates.today_journal_day () in
      let journal_title = Dates.today () in
      let* runtime =
        Daemon_client.ipc
          [ W.String "db-worker-runtime"; W.String repo; W.Map [] ]
      in
      (match W.map_get_string runtime "base-url" with
       | Some runtime_url when runtime_url <> "" ->
           Js.Promise.resolve
             { model; repo; history; runtime_url; journal_day; journal_title
             ; current = (fun () ->
                 Runtime.repo () = repo && !Pdf_state.current = asset
                 && current ()) }
       | _ -> Js.Promise.reject (Failure "PDF graph runtime has no endpoint"))

let invoke_for context name args =
  Daemon_client.post_invoke context.runtime_url ("thread-api/" ^ name)
    (W.String context.repo :: args)

let entity_for context ref_wire = invoke_for context "entity" [ ref_wire ]

let apply_for context ?(opts = W.Map []) ops =
  let opts =
    match opts, context.history with
    | W.Map kvs, W.Map history -> W.Map (kvs @ history)
    | _ -> invalid_arg "PDF transaction options must be a map"
  in
  (* Accepted asset writes outlive their view; only UI refresh is guarded. *)
  let current () =
    context.current () && Outliner_ops.context_current context.model
  in
  let invoke3 name repo ops opts =
    Daemon_client.post_invoke context.runtime_url name [ repo; ops; opts ]
  in
  let* result =
    Outliner_ops.submit_result ~invoke3 ~current context.model opts ops
  in
  if current () then
    Outliner_ops.refresh_via_delta result
  else Js.Promise.resolve ()

let entity_of ref_wire = Properties_data.entity ref_wire

let entity_uuid (w : W.t) = W.map_get_uuid w "block/uuid"

let entity_dbid (w : W.t) = W.map_get_int w "db/id"

let entity_prop_dbid (w : W.t) k =
  match W.get w k with
  | Some m -> W.map_get_int m "db/id"
  | None -> None

(* cljs <highlight-color-id — closed values of hl-color, match by title *)
let highlight_color_id context color =
  let* ws =
    invoke_for context "get-property-closed-values"
      [ W.Keyword "logseq.property.pdf/hl-color" ]
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
let ensure_ref_block ?context
    (asset : Model.pdf_asset) (hl : Model.hl)
    : unit Js.Promise.t =
  let* context =
    match context with
    | Some context -> Js.Promise.resolve context
    | None -> capture_write_context ()
  in
  match hl.hl_id, asset.Model.pdf_block_uuid with
  | None, _ | _, None -> Js.Promise.resolve ()
  | Some id, Some block_uuid ->
      let* w = entity_for context (Properties_data.uuid_ref id) in
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
                 let* i = highlight_color_id context c in
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
                        apply_for context
                          ~opts:(Outliner_ops.op_opts "insert-blocks")
                          [ Outliner_ops.insert_blocks ~bottom:true
                              [ bm ] block_uuid ~sibling:false ]))
  |> Js.Promise.then_ (fun () ->
         match hl.hl_id, hl.hl_image with
         | Some id, Some image_id ->
             let* image = entity_for context (W.Int64 image_id) in
             (match entity_uuid image with
              | Some uuid ->
                  apply_for context
                    [ Outliner_ops.move_blocks [ uuid ] id ~sibling:false ]
              | None -> Js.Promise.resolve ())
         | _ -> Js.Promise.resolve ())

(* cljs update-hl-block! — mirror color onto the ref block property *)
let update_hl_block_for context (hl : Model.hl) =
  match hl.hl_id, hl.hl_color with
  | Some uuid, Some color ->
      let* id = highlight_color_id context color in
      (match id with
       | Some cid ->
           apply_for context
             [ Outliner_ops.set_block_property uuid
                 "logseq.property.pdf/hl-color" (W.Int cid) ]
       | None -> Js.Promise.resolve ())
  | _ -> Js.Promise.resolve ()

let update_hl_block (hl : Model.hl) =
  ignore
    (let* context = capture_write_context () in
     update_hl_block_for context hl)

(* cljs del-ref-block! *)
let del_ref_block (hl : Model.hl) =
  match hl.hl_id with
  | Some uuid ->
      ignore
        (Outliner_ops.apply_and_refresh
           [ Outliner_ops.delete_blocks [ uuid ] ])
  | None -> ()

(* cljs copy-hl-ref! — ensure the ref block exists, then copy ((uuid)) *)
let copy_hl_ref_for context asset (hl : Model.hl) =
  match hl.hl_id with
  | Some id ->
      let* () = ensure_ref_block ~context asset hl in
      if context.current () then Platform.copy_to_clipboard ("((" ^ id ^ "))");
      Js.Promise.resolve ()
  | None -> Js.Promise.resolve ()

let copy_hl_ref (hl : Model.hl) =
  match !Pdf_state.current with
  | Some asset ->
      ignore
        (let* context = capture_write_context () in
         copy_hl_ref_for context asset hl)
  | None -> ()

(* cljs goto-block-ref! — open the ref block's page *)
let goto_block_ref_for context asset (hl : Model.hl) =
  match hl.hl_id with
  | Some id ->
      let* () = ensure_ref_block ~context asset hl in
      if context.current () then
        Platform.set_location_hash (Runtime.nav_hash ("#/page/" ^ id));
      Js.Promise.resolve ()
  | None -> Js.Promise.resolve ()

let goto_block_ref (hl : Model.hl) =
  match !Pdf_state.current with
  | Some asset ->
      ignore
        (let* context = capture_write_context () in
         goto_block_ref_for context asset hl)
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
               let external_url =
                 W.map_get_string aw
                   "logseq.property.asset/external-url"
               in
               Pdf_state.open_highlight
                 (inflate ~uuid:(Some uuid) ~db_id:(Some asset_dbid)
                    ~external_url ~path) hl;
               Js.Promise.resolve ()
             end)
  | _ -> ()

(* cljs goto the hl-image asset block (asset-action-bar ref button) *)
let goto_asset_block uuid =
  Platform.set_location_hash (Runtime.nav_hash ("#/page/" ^ uuid))

(* ---------- area image capture + persist ---------- *)

(* cljs editor-assets db-based-save-assets! {:pdf-area? true} — write
   assets/<uuid>.png, insert an asset block into today's journal *)
let save_area_png ~context (png : Bytes.t) : int Js.Promise.t =
  let journal_page () =
    invoke_for context "get-journal-page-by-day" [ W.Int context.journal_day ]
  in
  let uuid = Platform.random_uuid () in
  let* checksum = Asset_store.sha256_hex png in
  let* () =
    Asset_store.write_asset ~repo:context.repo ~name:(uuid ^ ".png")
      ~u8:png
  in
  let size = Bytes.length png in
  let* w =
    let* w = journal_page () in
    match W.map_get_uuid w "block/uuid" with
    | Some _ -> Js.Promise.resolve w
    | None ->
        let* () =
          apply_for context
            [ Outliner_ops.op "create-page"
                [ W.String context.journal_title
                ; W.Map
                    [ W.Keyword "today-journal?", W.Bool true
                    ; W.Keyword "split-namespace?", W.Bool false ] ] ]
        in
        journal_page ()
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
      let* () =
        apply_for context
          ~opts:(Outliner_ops.op_opts "insert-blocks")
          [ Outliner_ops.insert_blocks ~bottom:true [ bm ] page_uuid
              ~sibling:false ]
      in
      let* e = entity_for context (Properties_data.uuid_ref uuid) in
      (match entity_dbid e with
       | Some id -> Js.Promise.resolve id
       | None -> Js.Promise.reject (Failure "PDF area asset was not created"))
  | None -> Js.Promise.reject (Failure "PDF area journal was not created")

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
