(* Port of extensions/pdf/assets.cljs — annotation persistence,
   ref-block lifecycle, and open-by-ref navigation (web paths only:
   Electron windows.cljs, zotero file:// URLs, and file-graph hls .edn
   files are out of scope). *)

module W = Wire
module D = Web_dom
let ( let* ) = Pdf_utils.( let* )

let repo () = Runtime.repo ()

let q query inputs =
  Runtime.invoke2 "thread-api/q" (W.String (repo ()))
    (W.Array ([ W.String query ] @ inputs))

(* cljs (hash url) on a string == goog.string.hashCode *)
let string_hash s =
  let h = ref 0 in
  String.iter (fun c -> h := (!h * 31 + Char.code c) land 0xffffffff) s;
  !h

external decode_uri_component : string -> string = "decodeURIComponent"
  [@@mel.scope "window"]

(* sanitize-filename npm port (cljs safe-sanitize-file-name): strip
   / ? % * : | and < > chars, drop trailing dots/spaces, cap at 255
   bytes *)
let safe_sanitize_file_name s =
  let b = Buffer.create (String.length s) in
  String.iter
    (fun c ->
      let code = Char.code c in
      if code < 0x20 || code = 0x7f then ()
      else
        match c with
        | '/' | '?' | '%' | '*' | ':' | '|' | '"' | '<' | '>' | '\\' ->
            ()
        | _ -> Buffer.add_char b c)
    s;
  let s = Buffer.contents b in
  let n = min (String.length s) 255 in
  let s = String.sub s 0 n |> String.trim in
  let rec strip i = if i > 0 && s.[i - 1] = '.' then strip (i - 1) else i in
  String.sub s 0 (strip (String.length s))

let basename path =
  match String.rindex_opt path '/' with
  | Some i -> String.sub path (i + 1) (String.length path - i - 1)
  | None -> path

let web_link s = String.length s >= 4 && String.sub s 0 4 = "http"

(* cljs protocol-path? — js/URL parses; roughly "<scheme>:..." where
   scheme is [a-zA-Z][a-zA-Z0-9+.-]* *)
let protocol_link s =
  match String.index_opt s ':' with
  | None -> false
  | Some i ->
      i > 0
      && String.for_all
           (fun c ->
             (c >= 'a' && c <= 'z')
             || (c >= 'A' && c <= 'Z')
             || (c >= '0' && c <= '9')
             || c = '+' || c = '-' || c = '.')
           (String.sub s 0 i)

let local_protocol_asset s =
  String.length s >= 8 && String.sub s 0 8 = "asset://"

(* cljs get-in-repo-assets-full-filename — keep tail after "/assets/" *)
let in_repo_assets_full_filename url =
  match Str_util.index_of "/assets/" url with
  | Some i -> String.sub url (i + 8) (String.length url - i - 8)
  | None -> url

(* cljs pdf-assets/inflate-asset *)
let inflate_asset ~original_path ~href ~block_uuid ~block_db_id
    ~block_external_url : Model.pdf_asset option =
  let web_link' = web_link original_path in
  let protocol' = protocol_link href in
  let local_asset' = local_protocol_asset href in
  let filename = basename original_path in
  let url =
    if local_asset' then href
    else if protocol' then href
    else String.trim original_path
  in
  let filename' =
    if protocol' then filename
    else
      let decoded =
        try decode_uri_component url with _ -> url
      in
      let full = in_repo_assets_full_filename decoded in
      let b = Buffer.create (String.length full) in
      String.iter
        (fun c -> Buffer.add_char b (if c = '/' then '_' else c))
        full;
      Buffer.contents b
  in
  let ext_len = 4 (* ".pdf" *) in
  let filekey =
    if String.length filename' > ext_len then
      safe_sanitize_file_name
        (String.sub filename' 0 (String.length filename' - ext_len))
    else ""
  in
  if filekey = "" then None
  else
    let key =
      if web_link' then filekey ^ "__" ^ string_of_int (string_hash url)
      else filekey
    in
    let n = String.length key in
    Some
      { Model.pdf_key = key
      ; pdf_block_uuid = block_uuid
      ; pdf_block_db_id = block_db_id
      ; pdf_block_external_url = block_external_url
      ; pdf_identity = String.sub key (max 0 (n - 15)) (min 15 n)
      ; pdf_filename = filename
      ; pdf_url = url
      ; pdf_original_path = original_path
      }

(* cljs open-pdf-file — asset link click: resolve to a loadable URL
   (object URL for pfs assets) then set-current-pdf *)
let open_pdf_file ~(original_path : string) ~(href : string)
    ~(b : Model.block) =
  match
    inflate_asset ~original_path ~href
      ~block_uuid:b.Model.block_uuid ~block_db_id:b.block_db_id
      ~block_external_url:b.block_asset_url
  with
  | Some asset -> Pdf_state.set_current (Some asset)
  | None ->
      Platform.console_error ("pdf inflate failed", original_path)

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

let entity_prop (w : W.t) k = W.get w k

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
         let hls =
           match rows with
           | W.Array xs | W.List xs ->
               List.filter_map
                 (fun row ->
                   match row with
                   | W.Array es | W.List es ->
                       List.find_map
                         (fun e ->
                           Decode.hl_of_wire
                             (W.get e "logseq.property.pdf/hl-value"))
                         es
                   | _ -> None)
                 xs
           | _ -> []
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
             if image' then
               Platform.date_to_localedate (Platform.make_date (Js.Date.now ()))
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
         let file_path =
           match
             W.map_get_string aw "logseq.property.asset/external-url"
           with
           | Some u -> u
           | None -> (
               match W.map_get_uuid aw "block/uuid" with
               | Some u -> "../assets/" ^ u ^ ".pdf"
               | None -> "")
         in
         if file_path = "" then Js.Promise.resolve ()
         else
           let asset_uuid = W.map_get_uuid aw "block/uuid" in
           let external_url =
             W.map_get_string aw "logseq.property.asset/external-url"
           in
           (* cljs <make-asset-url — object URL for pfs, plain
              passthrough for web links *)
           let* href =
             match file_path with
             | p when web_link p -> Js.Promise.resolve p
             | _ -> (
                 match asset_uuid with
                 | Some u ->
                     Asset_store.object_url ~repo:(repo ())
                       ~name:(u ^ ".pdf") ~mime:"application/pdf"
                 | None -> Js.Promise.resolve file_path)
           in
           Pdf_state.ref_hl := Some hl;
           (match
              inflate_asset ~original_path:file_path ~href
                ~block_uuid:asset_uuid ~block_db_id:(Some asset_dbid)
                ~block_external_url:external_url
            with
            | Some a -> Pdf_state.set_current (Some a)
            | None ->
                Platform.console_error ("pdf inflate failed", file_path));
           Js.Promise.resolve ())
  | _ -> ()

(* cljs area-display helpers — resolve the hl-image asset block *)
let hl_image_src (b : Model.block) : string option Js.Promise.t =
  match b.Model.block_hl_image with
  | None -> Js.Promise.resolve None
  | Some db_id ->
      (let* w = entity_of (W.Int db_id) in
       match entity_uuid w with
       | Some u ->
           let* s =
             Asset_store.object_url ~repo:(repo ())
               ~name:(u ^ ".png") ~mime:"image/png"
           in
           Js.Promise.resolve (Some s)
       | None -> Js.Promise.resolve None)
      |> Js.Promise.catch (fun _ -> Js.Promise.resolve None)

let hl_image_block (b : Model.block)
    : (string option * int option) Js.Promise.t =
  match b.Model.block_hl_image with
  | None -> Js.Promise.resolve (None, None)
  | Some db_id ->
      (let* w = entity_of (W.Int db_id) in
       let resize_w =
         match entity_prop w "logseq.property.asset/resize-metadata" with
         | Some m -> W.map_get_int m "width"
         | None -> None
       in
       Js.Promise.resolve (entity_uuid w, resize_w))
      |> Js.Promise.catch (fun _ -> Js.Promise.resolve (None, None))

(* cljs goto the hl-image asset block (asset-action-bar ref button) *)
let goto_asset_block uuid =
  Platform.set_location_hash (Runtime.nav_hash ("#/page/" ^ uuid))

(* ---------- area image capture + persist ---------- *)

external canvas_get_context :
  D.el -> string -> Js.Json.t -> Js.Json.t = "getContext" [@@mel.send]

external ctx_draw_image :
  Js.Json.t -> D.el -> float -> float -> float -> float -> float
  -> float -> float -> float -> unit = "drawImage" [@@mel.send]

external ctx_set_smoothing : Js.Json.t -> bool -> unit
  = "imageSmoothingEnabled" [@@mel.set]

external canvas_to_blob :
  D.el -> (Js.Json.t -> unit) -> unit = "toBlob" [@@mel.send]

external canvas_set_width : D.el -> float -> unit = "width"
  [@@mel.set]

external canvas_set_height : D.el -> float -> unit = "height"
  [@@mel.set]

external device_pixel_ratio : float = "devicePixelRatio"
  [@@mel.scope "window"]

external blob_array_buffer :
  Js.Json.t -> Js.Typed_array.ArrayBuffer.t Js.Promise.t = "arrayBuffer"
  [@@mel.send]

external blob_size : Js.Json.t -> float = "size" [@@mel.get]

external u8_from_buffer :
  Js.Typed_array.ArrayBuffer.t -> Js.Typed_array.Uint8Array.t
  = "Uint8Array" [@@mel.new]

(* cljs editor-assets db-based-save-assets! {:pdf-area? true} — write
   assets/<uuid>.png to pfs, insert an asset block into today's journal *)
let save_area_png (png : Js.Json.t) : int option Js.Promise.t =
  let uuid = Platform.random_uuid () in
  let* buf = blob_array_buffer png in
  let u8 = u8_from_buffer buf in
  let* checksum = Asset_store.sha256_hex u8 in
  let* () =
    Asset_store.write_asset ~repo:(repo ()) ~name:(uuid ^ ".png") ~u8
  in
  let size = int_of_float (blob_size png) in
  (* cljs db-based-save-assets {:pdf-area? true} — insert into today's
     journal page (creating it when missing) *)
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

(* cljs persist-hl-area-image$ — crop the page canvas, save the png,
   return the new asset block's db/id for hl content.image *)
let persist_hl_area_image ~(viewer : Pdf_state.viewer)
    ~(new_hl : Model.hl) ~(region : Model.hl_rect)
    : int64 option Js.Promise.t =
  match Pdf_utils.get_page_view viewer (new_hl.hl_page - 1) with
  | None -> Js.Promise.resolve None
  | Some pv -> (
      let canvas = Pdf_utils.pv_canvas pv in
      let dpr = device_pixel_ratio in
      let dw = region.hl_w *. dpr and dh = region.hl_h *. dpr in
      let c2 = Web_dom.create_element "canvas" in
      canvas_set_width c2 dw;
      canvas_set_height c2 dh;
      let ctx =
        canvas_get_context c2 "2d"
          (Web_dom.json_props [ "alpha", Js.Json.boolean false ])
      in
      ctx_set_smoothing ctx false;
      ctx_draw_image ctx canvas (region.hl_x1 *. dpr)
        (region.hl_y1 *. dpr) (region.hl_w *. dpr) (region.hl_h *. dpr)
        0. 0. dw dh;
      Js.Promise.make @@ fun ~resolve ~reject:_ ->
      canvas_to_blob c2 (fun png ->
          ignore
            ((let* id = save_area_png png in
              resolve (Option.map Int64.of_int id) [@u];
              Js.Promise.resolve ())
             |> Js.Promise.catch (fun e ->
                    Platform.console_error
                      ("[write area image Error]", e);
                    resolve None [@u];
                    Js.Promise.resolve ()))))

(* cljs area-image-for-db — ref block -> hl-image asset block -> object
   url *)
let hl_list_image_src ~hl_id : string option Js.Promise.t =
  let* w = entity_of (Properties_data.uuid_ref hl_id) in
  match entity_prop_dbid w "logseq.property.pdf/hl-image" with
  | Some db_id ->
      let* iw = entity_of (W.Int db_id) in
      (match entity_uuid iw with
       | Some u ->
           let* s =
             Asset_store.object_url ~repo:(repo ())
               ~name:(u ^ ".png") ~mime:"image/png"
           in
           Js.Promise.resolve (Some s)
       | None -> Js.Promise.resolve None)
  | None -> Js.Promise.resolve None
