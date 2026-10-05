(* Native twin of assets/asset_dom.ml — asset blocks render through the
   "asset" logseq-* extension tag; the Swift side resolves the file and
   shows it. Upload flows route through the file-picker dom-event. *)

open Promise_ext

module S = Editor_state
module W = Wire

let dom = Logseq_dom.dom
let t = Lui_elements.spacer ~key:"asset-dom" []

let upload_files (_files : Js.Json.t array) : unit = ()

(* ---------- file drop upload ---------- *)

(* Native source is real file paths (window drag & drop); bytes and the
   assets dir both live on the filesystem. Mirrors cljs
   db-based-save-assets!: write assets/<uuid>.<ext> then insert-blocks
   with the logseq.class/Asset tag. *)

let ext_of_name name =
  match String.rindex_opt name '.' with
  | Some i when i > 0 ->
      String.lowercase_ascii
        (String.sub name (i + 1) (String.length name - i - 1))
  | _ -> ""

let title_of_name name ext =
  let base = Filename.basename name in
  let n =
    if ext <> "" && String.length base > String.length ext + 1
    then String.sub base 0 (String.length base - String.length ext - 1)
    else base
  in
  if n = "image" then Printf.sprintf "%.0f" (Js.Date.now ()) else n

let asset_block_map ~block_id ~title ~ext ~size ~checksum =
  W.Map
    [ W.String "block/uuid", W.Uuid block_id
    ; W.String "block/title", W.String title
    ; W.String "logseq.property.asset/type", W.String ext
    ; W.String "logseq.property.asset/size", W.Int64 (Int64.of_int size)
    ; W.String "logseq.property.asset/checksum", W.String checksum
    ; W.String "block/tags", W.Array [ W.Keyword "logseq.class/Asset" ] ]

let find_by_checksum checksum k =
  (let* w =
     Runtime.invoke2 "thread-api/q"
       (W.String (Runtime.repo ()))
       (W.Array
          [ W.String
              "[:find (pull ?b [:block/uuid :block/title]) . :in $ ?c \
               :where [?b :logseq.property.asset/checksum ?c]]"
          ; W.String checksum ])
   in
   let* v =
     Js.Promise.resolve
       (match
          ( W.map_get_uuid w "block/uuid"
          , W.map_get_string w "block/title" )
        with
        | Some u, Some t -> Some (u, t)
        | _ -> None)
   in
   k v)
  |> Js.Promise.catch (fun _ -> k None)

let read_file_bytes path =
  let ic = open_in_bin path in
  let n = in_channel_length ic in
  let b = really_input_string ic n in
  close_in ic;
  Bytes.of_string b

let asset_of_path ~idx ~edit_uuid ~empty_target path =
  let name = Filename.basename path in
  let ext = ext_of_name name in
  let title = title_of_name name ext in
  if ext = "" || not (Sys.file_exists path) then begin
    if ext = "" then Toast.error (I18n.tf "asset/invalid-ext-error" [ name ]);
    Js.Promise.resolve None
  end
  else
    let u8 = read_file_bytes path in
    let* checksum = Asset_store.sha256_hex u8 in
    find_by_checksum checksum (function
      | Some (uuid, t) ->
          Toast.warning (I18n.asset_already_exists t uuid);
          Js.Promise.resolve None
      | None ->
          let block_id =
            match idx = 0, empty_target, edit_uuid with
            | true, true, Some u -> u
            | _ -> Platform.random_uuid ()
          in
          let* () =
            Asset_store.write_asset ~repo:(Runtime.repo ())
              ~name:(block_id ^ "." ^ ext) ~u8
          in
          Js.Promise.resolve
            (Some
               (asset_block_map ~block_id ~title ~ext
                  ~size:(Bytes.length u8) ~checksum)))

(* cljs db-based-save-assets! — target = edit block when it exists, else
   current page, else today's journal *)
let upload_paths (paths : string list) =
  if paths <> [] then
    let edit = S.editing () in
    let edit_uuid = Option.map (fun e -> e.S.uuid) edit in
    let empty_target =
      match edit with
      | Some e -> String.trim e.S.buffer = ""
      | None -> false
    in
    let rec go i paths acc =
      match paths with
      | [] -> Js.Promise.resolve (List.rev acc)
      | path :: tl ->
          let* v =
            asset_of_path ~idx:i ~edit_uuid ~empty_target path
          in
          (match v with
           | Some b -> go (i + 1) tl (b :: acc)
           | None -> go (i + 1) tl acc)
    in
    let target =
      match edit_uuid with
      | Some u -> Some u
      | None -> (
          match !Runtime.current_page with
          | Some (p : Model.page) -> p.Model.page_uuid
          | None -> (
              match !Runtime.current_journals with
              | j :: _ -> j.Model.page_uuid
              | [] -> None))
    in
    match target with
    | None -> ()
    | Some t ->
        ignore
          (let* save_ops =
             match S.editing () with
             | Some e -> (
                 match S.find e.S.uuid with
                 | Some b when b.Model.block_title <> e.S.buffer ->
                     let* o =
                       Outliner_ops.save_block_parsed e.S.uuid e.S.buffer
                     in
                     Js.Promise.resolve [ o ]
                 | _ -> Js.Promise.resolve [])
             | None -> Js.Promise.resolve []
           in
           let* blocks = go 0 paths [] in
           if blocks = [] then Js.Promise.resolve ()
           else
             let sibling = edit_uuid = Some t in
             let* () =
               Outliner_ops.apply_and_refresh
                 ~opts:(Outliner_ops.op_opts "insert-blocks")
                 (save_ops
                 @ [ Outliner_ops.op "insert-blocks"
                       [ W.List blocks
                       ; W.Uuid t
                       ; W.Map
                           [ W.Keyword "sibling?", W.Bool sibling
                           ; W.Keyword "keep-uuid?", W.Bool true
                           ; W.Keyword "bottom?", W.Bool true
                           ; W.Keyword "replace-empty-target?",
                               W.Bool sibling
                           ; W.Keyword "outliner-op",
                               W.Keyword "insert-blocks" ] ] ])
             in
             if empty_target then
               ignore (Outliner_ops.resync_open_editor ());
             Js.Promise.resolve ())

(* The file picker is imperative — the "upload" editor command calls
   Browser_ui.open_file_picker (host NSOpenPanel) and feeds the picked
   file snapshots through upload_paths. No hidden input node. *)
let pick_files () =
  Browser_ui.open_file_picker (fun files ->
      upload_paths
        (List.filter_map
           (fun f -> Dom_ext.str_prop "path" f)
           (Array.to_list files)))

let on_asset_write_finish ~repo':_ ~asset_id:_ = ()
let retry_pending () = ()

(* cljs objects.cljs build-class-object-columns :file — native version:
   the Swift renderer resolves the file path from data-asset-file (same
   contract as the imperative file_cell) *)
let file_cell_el (w : Wire.t) : Lui_elements.t =
  let uuid = Option.value (Wire.map_get_uuid w "block/uuid") ~default:"" in
  let ext =
    Option.value
      (Wire.map_get_string w "logseq.property.asset/type") ~default:""
  in
  let file = uuid ^ "." ^ ext in
  Lui_elements.box ~style_class:"block-content" ~max_height:30
    [ (* TODO(component): data-asset-file is the Swift asset-resolution
         contract — no component attr channel *)
      dom ~tag:"img"
        ~attrs:[ ("title", file); ("data-asset-file", file) ]
        [] ]

(* web opens PhotoSwipe on pdf preview thumbs; native shows previews
   inline via the asset extension tag — nothing to lightbox *)
let preview_images (_items : Wire.t list) : unit = ()

(* minimal asset render — the asset extension tag carries the block
   uuid + stored file path so the Swift renderer can resolve it *)
let file_cell (w : Wire.t) : Views_dom.el =
  let uuid =
    Option.value (Wire.map_get_uuid w "block/uuid") ~default:"" in
  let ext =
    Option.value
      (Wire.map_get_string w "logseq.property.asset/type") ~default:"" in
  Views_dom.h ~tag:"img"
    ~attrs:[ ("title", uuid ^ "." ^ ext); ("data-asset-file", uuid ^ "." ^ ext) ]
    ()

let block_view uuid (b : Model.block) : Lui_elements.t =
  let ext = Option.value b.Model.block_asset_type ~default:"" in
  let is_pdf = ext = "pdf" in
  (* TODO(component): data-asset-* attrs are the native
     asset-resolution contract — no component attr channel *)
  dom ~key:("asset-" ^ uuid) ~tag:"div"
    ~style_class:
      ("asset-container" ^ if is_pdf then " ls-pdf-asset" else "")
    ~attrs:
      [ ("data-asset-uuid", uuid); ("data-asset-type", ext) ]
    ~events:(if is_pdf then "click" else "")
    ~on_dom_event:(fun name _ ->
      if name = "click" && is_pdf then
        Pdf_assets.open_pdf_file ~uuid ~ext ~b)
    [ (if is_pdf then
         Lui_elements.text ~key:("asset-link-" ^ uuid)
           ~style_class:"ls-pdf-asset-link"
           ~value:(uuid ^ "." ^ ext) []
       else Lui_elements.spacer ~key:("asset-empty-" ^ uuid) []) ]

let install () =
  (* slash "Upload an asset" dispatches ls:editor-command
     {command:"upload"} — the picker op replaces the hidden input the
     web used to click *)
  Platform.add_event_listener "ls:editor-command" (fun j ->
      match Dom_ext.prop "detail" j with
      | Js.Json.JObject _ as d -> (
          match Dom_ext.str_prop "command" d with
          | Some "upload" -> pick_files ()
          | _ -> ())
      | _ -> ());
  (* window-level file drop — the Swift host posts
     platform_event "file-drop" {"paths": [...]} when files are dropped
     on the window *)
  Platform.add_event_listener "file-drop" (fun payload ->
      match payload with
      | Js.Json.JObject kvs -> (
          match List.assoc_opt "paths" kvs with
          | Some (Js.Json.JArray items) ->
              upload_paths
                (List.filter_map Js.Json.decodeString
                   (Array.to_list items))
          | _ -> ())
      | _ -> ())

let delete_asset uuid =
  let ext =
    match Editor_state.find uuid with
    | Some b -> Option.value b.Model.block_asset_type ~default:""
    | None -> ""
  in
  if ext <> "" then
    ignore (Asset_store.delete_asset ~repo:(Runtime.repo ()) ~name:(uuid ^ "." ^ ext));
  ignore
    (Outliner_ops.apply_and_refresh
       [ Outliner_ops.delete_blocks [ uuid ] ])


