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
  Platform.resource_url (Asset_store.asset_path (Runtime.repo ()) file)

let image_extension ext =
  List.mem (String.lowercase_ascii ext)
    [ "gif"; "svg"; "jpeg"; "jpe"; "jfif"; "ico"; "png"; "jpg"; "bmp"; "webp"; "avif";
      "cr2"; "jxl"; "heic"; "heif" ]

let audio_extension ext =
  List.mem (String.lowercase_ascii ext)
    [ "mp3"; "ogg"; "mpeg"; "wav"; "m4a"; "flac"; "wma"; "aac" ]

let video_extension ext =
  List.mem (String.lowercase_ascii ext)
    [ "mp4"; "webm"; "mov"; "flv"; "avi"; "mkv" ]

let media_props (b : Model.block) video =
  let width =
    match b.Model.block_asset_resize with
    | Some resize -> resize
    | None -> if video then 480 else 320
  in
  let height =
    if video then
      match b.Model.block_asset_width, b.Model.block_asset_height with
      | Some asset_width, Some asset_height when asset_width > 0 ->
        width * asset_height / asset_width
      | _ -> width * 9 / 16
    else 40
  in
  [ "width", Lui_protocol.StringValue (Printf.sprintf "%dpx" width)
  ; "height", Lui_protocol.StringValue (Printf.sprintf "%dpx" height) ]

let file_cell_el (w : Wire.t) : Lui_elements.t =
  let uuid = Option.value (Wire.map_get_uuid w "block/uuid") ~default:"" in
  let ext =
    Option.value
      (Wire.map_get_string w "logseq.property.asset/type") ~default:""
  in
  let file = uuid ^ "." ^ ext in
  Lui_elements.box ~style_class:"block-content" ~max_height:30
    [ if image_extension ext then
        Lui_elements.image ~url:(asset_source file) ~alt:file ~max_height:30 []
      else Lui_elements.text ~value:file [] ]

let gallery_cover ~width ~height (value : W.t) : Lui_elements.t =
  let block = Decode.block_of_wire value in
  match block.Model.block_uuid, block.Model.block_asset_type with
  | Some uuid, Some ext when image_extension ext ->
      let file = uuid ^ "." ^ ext in
      let source = match block.Model.block_asset_url with
        | Some url when url <> "" -> url
        | _ -> asset_source file in
      Lui_elements.image ~url:source ~alt:block.Model.block_title ~width ~height []
  | _ -> Lui_elements.spacer []

(* web opens PhotoSwipe on pdf preview thumbs; native shows previews
   inline via the asset extension tag — nothing to lightbox *)
let preview_images (_items : Wire.t list) : unit = ()

let lightbox_key = "native-asset-lightbox"

let close_image_lightbox () =
  Properties_state.remove_view_overlay lightbox_key

(* Native retained-overlay approximation of the web PhotoSwipe surface.
   It intentionally keeps the first implementation scoped to the core
   desktop interaction: display the clicked asset fitted to the window,
   close on backdrop press, the close control, or Escape through the
   cover dialog. PhotoSwipe's multi-image navigation, pinch/zoom and
   sharing chrome remain documented parity gaps. *)
let image_lightbox_view ~source ~alt : Lui_elements.t =
  let close () = close_image_lightbox () in
  Ui_parts.viewport_cover
    (Lui_elements.dialog ~key:lightbox_key
       ~style_class:"pswp native-asset-lightbox"
       ~background:"rgba(0,0,0,0.92)" ~border_width:0 ~corner_radius:0
       ~padding:0
       ~on_dismiss:(fun _ -> close ())
       [ Lui_elements.stack ~key:"lb-stack" ~container_relative_frame:`both
           [ Ui_parts.pressable ~on_press:(fun _ -> close ())
               (Lui_elements.column ~key:"lb-backdrop"
                  ~container_relative_frame:`both ~main:`center ~cross:`center
                  ~padding:32
                  [ Ui_parts.pressable ~on_press:(fun _ -> ())
                      (Lui_elements.box ~key:"lb-image-box"
                         [ Lui_elements.image ~key:"lb-image" ~url:source ~alt [] ]) ])
           ; Lui_elements.overlay ~key:"lb-chrome" ~alignment:`top_trailing
               ~padding:16
               [ Lui_elements.icon_button ~key:"lb-close" ~variant:`ghost
                   ~size:`icon ~icon:(`app "x") ~label:(I18n.t "ui/close")
                   ~autofocus:true
                   ~foreground:"white" ~background:"rgba(0,0,0,0.35)"
                   ~on_press:(fun _ -> close ()) [] ]
           ]
       ])

let open_image_lightbox ~source ~alt =
  ignore
    (Properties_state.push_view_overlay_ctxfree ~key:lightbox_key
       ~view:(image_lightbox_view ~source ~alt)
       ~on_escape:(fun () -> ()))

(* minimal asset render — the asset extension tag carries the block
   uuid + stored file path so the Swift renderer can resolve it *)
let block_view uuid (b : Model.block) : Lui_elements.t =
 fun context parent ->
  let ext = Option.value b.Model.block_asset_type ~default:"" in
  let is_pdf = ext = "pdf" in
  (* TODO(component): the logseq-div extension element + its
     click event carry the native asset-resolution contract — the
     attrs could ride ~data_attrs but the extension tag itself has no
     kind equivalent *)
  Logseq_el.el ~tag:"div"
    ~style_class:
      "asset-container"
    ~attrs:
      ([ ("data-asset-uuid", uuid); ("data-asset-type", ext) ]
       @ if is_pdf then [ ("data-keep-selection", "true") ] else [])
    ~events:(if is_pdf then "click" else "")
    ~on_dom_event:(fun name payload ->
      if name = "click" && is_pdf then
        let mod_click =
          match payload with
          | Some event ->
              if Ui_services.env_is_mac () then Ui_dom_native.jbool "metaKey" (Js.Json.parseExn event)
              else Ui_dom_native.jbool "ctrlKey" (Js.Json.parseExn event)
          | None -> false
        in
        if mod_click then Pdf_assets.open_pdf_file_in_new_window ~uuid ~ext ~b
        else Pdf_assets.open_pdf_file ~uuid ~ext ~b)
    [ (if is_pdf then
         Lui_elements.text ~value:(uuid ^ "." ^ ext) []
       else
         let file = uuid ^ "." ^ ext in
         let source =
           match b.Model.block_asset_url with
           | Some url when url <> "" -> url
           | _ -> asset_source file
         in
         if image_extension ext then
           Ui_parts.pressable
             ~on_press:(fun _ -> open_image_lightbox ~source ~alt:file)
             (Lui_elements.row ~key:("asset-lb-open-" ^ uuid)
                ~container_relative_frame:`horizontal
                ~on_navigation_key:(fun nav ->
                  match nav.Lui_elements.key with
                  | "Enter" | " " ->
                      open_image_lightbox ~source ~alt:file
                  | _ -> ())
                [ Lui_elements.image ~url:source
                    ~alt:file ~container_relative_frame:`horizontal [] ])
         else if audio_extension ext then
           Logseq_el.el ~key:("au-" ^ uuid) ~tag:"audio"
             ~ext_props:(( "src", Lui_protocol.StringValue source ) :: media_props b false)
             []
         else if video_extension ext then
           Logseq_el.el ~key:("vd-" ^ uuid) ~tag:"video"
             ~style_class:"asset-video"
             ~ext_props:(( "src", Lui_protocol.StringValue source ) :: media_props b true)
             []
         else Lui_elements.text ~value:file []) ] context parent

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
