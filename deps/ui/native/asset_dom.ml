(* Native twin of assets/asset_dom.ml — asset blocks render through the
   "asset" logseq-* extension tag; the host side resolves the file and
   shows it. Upload flows route through the file-picker dom-event. *)

open Promise_ext

module S = Editor_state
module W = Wire

let dom = Logseq_el.el
let t = Lui_elements.spacer ~key:"asset-dom" []

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

let find_by_checksum ~repo checksum k =
  (let* w =
     Runtime.invoke2 "thread-api/q"
       (W.String repo)
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

let read_file_bytes path =
  let ic = open_in_bin path in
  let n = in_channel_length ic in
  let b = really_input_string ic n in
  close_in ic;
  Bytes.of_string b

let asset_of_path ~upload ~idx path =
  Editor_actions.check_asset_upload upload;
  let repo = upload.Editor_actions.upload_repo in
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
    Editor_actions.check_asset_upload upload;
    find_by_checksum ~repo checksum (function
      | Some (uuid, t) ->
          if Editor_actions.asset_upload_current upload then
            Toast.warning (I18n.asset_already_exists t uuid);
          Js.Promise.resolve None
      | None ->
          Editor_actions.check_asset_upload upload;
          let block_id =
            match idx = 0, upload.upload_empty with
            | true, true -> upload.upload_target
            | _ -> Platform.random_uuid ()
          in
          let* () =
            Asset_store.write_asset ~repo
              ~name:(block_id ^ "." ^ ext) ~u8
          in
          Js.Promise.resolve
            (Some
               (asset_block_map ~block_id ~title ~ext
                  ~size:(Bytes.length u8) ~checksum)))

(* cljs db-based-save-assets! — target = edit block when it exists, else
   current page, else today's journal *)
let upload_paths ?upload (paths : string list) =
  let upload = match upload with Some upload -> Some upload
    | None -> Editor_actions.capture_asset_upload () in
  match upload with
  | Some upload when paths <> [] && Editor_actions.asset_upload_current upload ->
    let rec go i paths acc =
      match paths with
      | [] -> Js.Promise.resolve (List.rev acc)
      | path :: tl ->
          Editor_actions.check_asset_upload upload;
          let* v =
            asset_of_path ~upload ~idx:i path
          in
          (match v with
           | Some b -> go (i + 1) tl (b :: acc)
           | None -> go (i + 1) tl acc)
    in
        (let* blocks = go 0 paths [] in
         Editor_actions.commit_uploaded_assets upload blocks)
        |> Js.Promise.catch (fun error ->
             Ui_services.log_error ("Asset upload failed", error);
             if Editor_actions.asset_upload_current upload then
               Toast.error (I18n.t1 "ui/error-boundary-error" "asset-upload:failed");
             Js.Promise.resolve ())
        |> ignore
  | _ -> ()

(* The file picker is imperative — the "upload" editor command calls
   Browser_ui.open_file_picker (host NSOpenPanel) and feeds the picked
   file snapshots through upload_paths. No hidden input node. *)
let upload_files ?upload files =
  let file_path (f : Js.Json.t) : string option =
    match f with
    | Js.Json.JObject kvs -> (
        match List.assoc_opt "path" kvs with
        | Some v -> Js.Json.decodeString v
        | None -> None)
    | _ -> None
  in
  let paths = List.filter_map file_path (Array.to_list files) in
  if List.length paths <> Array.length files then
    Toast.error (I18n.t1 "ui/error-boundary-error" "asset-upload:path-required")
  else upload_paths ?upload paths

let pick_files () =
  Option.iter (fun upload -> Browser_ui.open_file_picker (fun files ->
    if Editor_actions.asset_upload_current upload then upload_files ~upload files))
    (Editor_actions.capture_asset_upload ())

let on_asset_write_finish ~repo':_ ~asset_id:_ = ()
let retry_pending () = ()

let asset_source file =
  Asset_store.asset_path (Runtime.repo ()) file

let image_exts =
  [ "gif"; "svg"; "jpeg"; "ico"; "png"; "jpg"; "bmp"; "webp"; "avif";
    "cr2"; "jxl"; "heic" ]

let video_exts = [ "mp4"; "webm"; "mov"; "flv"; "avi"; "mkv" ]
let audio_exts = [ "mp3"; "ogg"; "mpeg"; "wav"; "m4a"; "flac"; "wma"; "aac" ]

type asset_kind = Image | Pdf | Video | Audio | File

let asset_kind ~ext ~title =
  let ext = String.lowercase_ascii ext in
  if List.mem ext image_exts then Image
  else if ext = "pdf" then Pdf
  else if List.mem ext audio_exts
    || (ext = "webm" && Str_util.starts_with title "Audio-") then Audio
  else if List.mem ext video_exts then Video
  else File

let file_label ~file (b : Model.block) =
  if b.Model.block_title = "" then file
  else
    let ext = Option.value b.Model.block_asset_type ~default:"" in
    if ext = "" then b.Model.block_title else b.Model.block_title ^ "." ^ ext

let managed_file_link ~repo ~file ~source ~external_url ~label =
  let identity = ["data-asset-graph",repo; "href",source] in
  Logseq_el.el ~tag:"a" ~style_class:"asset-ref" ~text:label
    ~attrs:(if external_url then identity else ("data-asset-file",file)::identity) []

let audio_labels () =
  Yojson.Safe.to_string (`Assoc [
    "play",`String (I18n.t "asset.audio/play");
    "pause",`String (I18n.t "asset.audio/pause");
    "seek",`String (I18n.t "asset.audio/seek");
    "volume",`String (I18n.t "asset.audio/volume");
    "loading",`String (I18n.t "asset.audio/loading")])

let asset_leaf ~compact uuid (b : Model.block) =
  let repo = Runtime.repo () in
  let ext = Option.value b.Model.block_asset_type ~default:"" in
  let file = uuid ^ "." ^ ext in
  let external_url, source = match b.Model.block_asset_url with
    | Some url when url <> "" -> true,url
    | _ -> false,Asset_store.asset_path repo file in
  let label = file_label ~file b in
  match asset_kind ~ext ~title:b.Model.block_title with
  | Image -> Lui_elements.image ~key:("asset-image-" ^ uuid) ~url:source ~alt:label
      ~max_height:(if compact then 30 else 800) []
  | Pdf -> Ui_parts.pressable ~on_press:(fun _ ->
      if repo <> "" && Runtime.repo () = repo then Pdf_assets.open_pdf_file ~uuid ~ext ~b)
      (Lui_elements.text ~key:("asset-link-" ^ uuid) ~style_class:"is-pdf" ~value:label [])
  | Video when not compact ->
      Lui_elements.media_surface ~key:("asset-video-" ^ uuid) ~url:source ~label
        ~width:640 ~height:360 ~max_width:800 []
  | Audio ->
      let identity=["data-asset-graph",repo; "src",source;
        "labels",audio_labels (); "aria-label",label; "controls",""] in
      Logseq_el.el ~key:("asset-audio-" ^ uuid) ~tag:"audio"
        ~attrs:(if external_url then identity else ("data-asset-file",file)::identity) []
  | Video | File -> managed_file_link ~repo ~file ~source ~external_url ~label

let file_cell_el (w : Wire.t) : Lui_elements.t =
  let block = Decode.block_of_wire w in
  match block.Model.block_uuid with
  | None -> Lui_elements.spacer []
  | Some uuid ->
      let ext=Option.value block.Model.block_asset_type ~default:"" in
      if asset_kind ~ext ~title:block.Model.block_title=Audio then
        Lui_elements.box ~style_class:"block-content" [asset_leaf ~compact:true uuid block]
      else Lui_elements.box ~style_class:"block-content" ~max_height:30
        [asset_leaf ~compact:true uuid block]

let gallery_cover ~width ~height (value : W.t) : Lui_elements.t =
  let block = Decode.block_of_wire value in
  match block.Model.block_uuid, block.Model.block_asset_type with
  | Some uuid, Some ext when List.mem (String.lowercase_ascii ext) image_exts ->
      let file = uuid ^ "." ^ ext in
      let source = match block.Model.block_asset_url with
        | Some url when url <> "" -> url
        | _ -> asset_source file in
      Lui_elements.image ~url:source ~alt:block.Model.block_title ~width ~height []
  | _ -> Lui_elements.spacer []

(* web opens PhotoSwipe on pdf preview thumbs; native shows previews
   inline via the asset extension tag — nothing to lightbox *)
let preview_images (_items : Wire.t list) : unit = ()

let block_view uuid (b : Model.block) : Lui_elements.t =
  Lui_elements.box ~key:("asset-" ^ uuid) ~style_class:"asset-container"
    [asset_leaf ~compact:false uuid b]

let content_view = block_view

let install () =
  Render_inline.inline_asset_renderer := Some block_view;
  (* "upload" is dispatched by the shared editor command dispatcher —
     Editor_cmds calls pick_files through the installed host *)
  (* window-level file drop — the native host posts
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
