(* Asset blocks — hidden upload input + pfs storage + image render with
   lightbox / resize handles / action menu.
   Mirrors cljs components/block.cljs asset-cp / resizable-image /
   open-lightbox! and handler/editor/assets.cljs db-based-save-assets! /
   delete-asset-of-block!. *)

open Promise_ext
module S = Editor_state
module W = Wire
module B = Web_dom
module A = Asset_store

open Lui_elements

let dom = Logseq_el.el
let repo = Runtime.repo

(* ---------- raw externals ---------- *)

external file_size : Js.Json.t -> float = "size" [@@mel.get]

type lightbox

external new_lightbox : Js.Json.t -> lightbox = "PhotoSwipeLightbox"
  [@@mel.new] [@@mel.scope "window"]

external lb_init : lightbox -> unit = "init" [@@mel.send]
external lb_open : lightbox -> int -> unit = "loadAndOpen" [@@mel.send]

external pswp_module : Js.Json.t Js.Undefined.t = "PhotoSwipe"
  [@@mel.scope "window"]

(* cljs preview-images! keeps the live lightbox on
   window.photoLightbox *)
let set_photo_lightbox : lightbox -> unit =
  [%mel.raw "function (lb) { window.photoLightbox = lb }"]

let qs_all = Web_dom.query_selector_all_arr

(* ---------- upload pipeline ---------- *)

let image_exts =
  [ "gif"; "svg"; "jpeg"; "ico"; "png"; "jpg"; "bmp"; "webp"; "avif"; "cr2"
  ; "jxl"; "heic" ]

let is_image ext = List.mem ext image_exts

let mime_of_ext = function
  | "png" -> "image/png"
  | "jpg" | "jpeg" -> "image/jpeg"
  | "gif" -> "image/gif"
  | "webp" -> "image/webp"
  | "bmp" -> "image/bmp"
  | "svg" -> "image/svg+xml"
  | "ico" -> "image/x-icon"
  | "avif" -> "image/avif"
  | "heic" -> "image/heic"
  | "jxl" -> "image/jxl"
  | "cr2" -> "image/x-canon-cr2"
  | _ -> "application/octet-stream"

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
  (* cljs asset-name->title: a file literally named "image.*" gets a
     timestamp title (date/get-date-time-string-2) *)
  if n = "image" then Printf.sprintf "%.0f" (Js.Date.now ()) else n

(* cljs :editor/input "" {:last-pattern "/"} — cut from the last "/" up to
   the caret so save-assets reads the cleared edit-content *)
let clear_slash_text () =
  match S.editing () with
  | None -> ()
  | Some e -> (
      let m = e.S.model in
      let v = m.Edit_model.source in
      match Edit_model.selection_range m with
      | Some (pos, _) -> (
          match String.rindex_opt (String.sub v 0 pos) '/' with
          | None -> ()
          | Some i ->
              Editor_actions.update_model e.S.uuid (fun m ->
                  let m' = Edit_model.splice m i pos "" in
                  Edit_model.select m' ~anchor:i ~focus:i))
      | None -> ())

let find_by_checksum checksum k =
  (let* w =
    Runtime.invoke2 "thread-api/q" (W.String (repo ()))
      (W.Array
         [ W.String
             "[:find (pull ?b [:block/uuid :block/title]) . :in $ ?c \
              :where [?b :logseq.property.asset/checksum ?c]]"
         ; W.String checksum ])
  in
  let* v =
    Js.Promise.resolve
      ( match
          ( W.map_get_uuid w "block/uuid"
          , W.map_get_string w "block/title" )
      with
      | Some u, Some t -> Some (u, t)
      | _ -> None )
  in
  k v)
  |> Js.Promise.catch (fun _ -> k None)

(* cljs new-asset-block — the block/tags ident resolves through
   db/ident uniqueness in the worker *)
let asset_block_map ~block_id ~title ~ext ~size ~checksum =
  W.Map
    [ W.String "block/uuid", W.Uuid block_id
    ; W.String "block/title", W.String title
    ; W.String "logseq.property.asset/type", W.String ext
    ; W.String "logseq.property.asset/size", W.Int64 (Int64.of_float size)
    ; W.String "logseq.property.asset/checksum", W.String checksum
    ; W.String "block/tags", W.Array [ W.Keyword "logseq.class/Asset" ] ]

(* one file -> block map option; writes the pfs file on the way. idx=0
   reuses the editing block's uuid when its content is empty
   (cljs empty-target?) *)
let asset_of_file ~idx ~edit_uuid ~empty_target f =
  let name = B.file_name f in
  let ext = ext_of_name name in
  let title = title_of_name name ext in
  let size = file_size f in
  if ext = "" then (
    Toast.error (I18n.tf "asset/invalid-ext-error" [ name ]);
    Js.Promise.resolve None)
  else
    let* buf = B.file_buffer f in
    let u8 = Js.Typed_array.Uint8Array.fromBuffer buf () in
    let* checksum = A.sha256_hex u8 in
    find_by_checksum checksum (function
      | Some (uuid, t) ->
          Toast.warning
            (I18n.asset_already_exists t uuid);
          Js.Promise.resolve None
      | None ->
          let block_id =
            match idx = 0, empty_target, edit_uuid with
            | true, true, Some u -> u
            | _ -> Ui_services.env_random_uuid ()
          in
          let* () =
            A.write_asset ~repo:(repo ())
              ~name:(block_id ^ "." ^ ext) ~u8
          in
          Js.Promise.resolve
            (Some
               (asset_block_map ~block_id ~title ~ext
                  ~size ~checksum)))

let collect_files files =
  let edit = S.editing () in
  let edit_uuid = Option.map (fun e -> e.S.uuid) edit in
  let empty_target =
    match edit with
    | Some e -> String.trim e.buffer = ""
    | None -> false
  in
  let rec go i acc =
    if i >= Array.length files then Js.Promise.resolve (List.rev acc)
    else
      let* v = asset_of_file ~idx:i ~edit_uuid ~empty_target files.(i) in
      match v with Some b -> go (i + 1) (b :: acc)
    | None -> go (i + 1) acc
  in
  (go 0 [], edit_uuid, empty_target)

(* cljs db-based-save-assets! — target = edit block when it exists
   (sibling? + replace-empty-target? both true, bottom? true); else the
   current page (cljs falls back to today's journal). *)
let upload_files (files : Js.Json.t array) =
  if Array.length files > 0 then begin
    clear_slash_text ();
    let blocks_p, edit_uuid, empty_target = collect_files files in
    let target =
      match edit_uuid with
      | Some u -> Some u
      | None -> (
          match (Runtime.model ()).Model.route_page with
          | Some (p : Model.page) -> p.Model.page_uuid
          | None -> (
              (* cljs falls back to today's journal — the journals view
                 is fetched newest-first so today's page leads
                 model.journals *)
              match (Runtime.model ()).Model.journals with
              | j :: _ -> j.Model.page_uuid
              | [] -> None))
    in
    match target with
    | None -> ()
    | Some t ->
        (* cljs db-based-save-assets! commits the pending edit first
           (has-unsaved-edit? -> save-block-aux!) — the worker only honors
           replace-empty-target? when the stored target title is blank, so
           an uncommitted title would silently remap the block uuid *)
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
          let* blocks = blocks_p in
          if blocks = [] then Js.Promise.resolve ()
          else
            let sibling = edit_uuid = Some t in
            let* () =
              Outliner_ops.apply_and_refresh
                ~opts:(Outliner_ops.op_opts "insert-blocks")
                ( save_ops
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
                              W.Keyword "insert-blocks" ] ] ] )
            in
            (* cljs db-based-save-assets! re-enters edit
                        on the reused empty-target block so the
                        buffer holds the new asset title — a later
                        exit-edit then sees an unchanged buffer
                        instead of wiping the title with "". The
                        open textarea keeps its own value, so
                        resync (state + DOM), not enter_edit *)
            if empty_target then
              ignore (Outliner_ops.resync_open_editor ());
            Js.Promise.resolve ())
  end

(* cljs image-uploader hid an <input type=file> per editor; here the
   picker is imperative — a transient input via the open-file-picker
   op, no persistent node in the tree. Both the slash command and
   editor_actions.trigger_asset_upload go through this. *)
let pick_files () =
  Web_dom.open_file_picker (fun files -> upload_files files)

(* ---------- lightbox ---------- *)

(* lightbox/preview-images! — shared by asset imgs and pdf .hl-area imgs *)
let preview_images items =
  match Js.Undefined.toOption pswp_module with
  | None -> ()
  | Some m ->
      let opts =
        B.json_props
          [ "dataSource", Js.Json.array items
          ; "pswpModule", m
          ; "showHideAnimationType", B.str_to_json "fade" ]
      in
      let lb = new_lightbox opts in
      set_photo_lightbox lb;
      lb_init lb;
      lb_open lb 0

let open_lightbox clicked =
  let imgs = qs_all ".asset-container img" in
  let n = Array.length imgs in
  if n > 0 then begin
    let rec find i =
      if i >= n then 0
      else if imgs.(i) == clicked then i
      else find (i + 1)
    in
    let idx = find 0 in
    let items =
      Array.init n (fun j ->
          let img = imgs.((idx + j) mod n) in
          let src =
            Option.value (B.el_get_attr img "src") ~default:""
          in
          B.json_props
            [ "src", B.str_to_json src
            ; "w", B.str_to_json (Printf.sprintf "%.0f" (B.el_nat_width img))
            ; "h", B.str_to_json (Printf.sprintf "%.0f" (B.el_nat_height img)) ])
    in
    preview_images items
  end

(* ---------- resize ---------- *)

let finish_drag uuid w =
  B.doc_rm_class "is-resizing-buf";
  ignore
    (Outliner_ops.apply_and_refresh
       ~opts:(Outliner_ops.op_opts "set-block-property")
       [ Outliner_ops.set_block_property uuid
           "logseq.property.asset/resize-metadata"
           (W.Map [ W.Keyword "width", W.Int (int_of_float w) ]) ])

(* cljs resize-image-handles: interact.js seeds width from
   .ls-resize-image offsetWidth, live-updates the img width attr on move
   and writes logseq.property.asset/resize-metadata {:width} on end *)
let start_drag ~side ~uuid ~start_x =
  match B.query_selector ("#ls-block-" ^ uuid) with
  | None -> ()
  | Some row -> (
      match B.el_query row ".ls-resize-image", B.el_query row "img" with
      | Some box, Some img ->
          let start_w = B.el_offset_width box in
          B.doc_add_class "is-resizing-buf";
          let rec on_move ev =
            let dx =
              if side = `Left then start_x -. Web_dom.ev_client_x ev
              else Web_dom.ev_client_x ev -. start_x
            in
            let w = start_w +. dx in
            if w > 60. || dx > 0. then
              (* the kind's pixels img carries style width:100% — a live
                 drag preview has to override the style, not the attr *)
              B.el_style_set_property img "width"
                (string_of_int (int_of_float w) ^ "px")
          and on_up _ev =
            B.remove_window_listener "pointermove" on_move;
            B.remove_window_listener "pointerup" on_up;
            finish_drag uuid (B.el_offset_width box)
          in
          B.add_window_listener "pointermove" on_move;
          B.add_window_listener "pointerup" on_up
      | _ -> ())

(* ---------- action menu + delete ---------- *)

let delete_asset uuid =
  (* cljs delete-asset-of-block!: the block IS the asset here — delete
     both the pfs file and the block *)
  let ext =
    match S.find uuid with
    | Some b -> Option.value b.Model.block_asset_type ~default:""
    | None -> ""
  in
  if ext <> "" then
    ignore (A.delete_asset ~repo:(repo ()) ~name:(uuid ^ "." ^ ext));
  ignore
    (Outliner_ops.apply_and_refresh
       [ Outliner_ops.delete_blocks [ uuid ] ])

let set_align uuid a =
  ignore
    (Outliner_ops.apply_and_refresh
       ~opts:(Outliner_ops.op_opts "set-block-property")
       [ Outliner_ops.set_block_property uuid
           "logseq.property.asset/align" (W.String a) ])

let menu_items uuid (b : Model.block) : Views_popup.menu_item list =
  let align_v = b.Model.block_asset_align in
  [ Views_popup.MSub
      ( I18n.asset_align
      , [ Views_popup.MCheck
            ( I18n.asset_align_left
            , align_v = None || align_v = Some "left"
            , fun _ -> set_align uuid "left" )
        ; Views_popup.MCheck
            ( I18n.asset_align_center
            , align_v = Some "center"
            , fun _ -> set_align uuid "center" )
        ; Views_popup.MCheck
            ( I18n.asset_align_right
            , align_v = Some "right"
            , fun _ -> set_align uuid "right" )
        ] )
  ; Views_popup.MSep
  ; Views_popup.MItem
      ( I18n.asset_delete
      , fun () ->
          Runtime.send
            (Action.Confirm_set
               (Some (Model.Confirm_delete_asset uuid)));
          Runtime.flush () )
  ]

(* ---------- render ---------- *)

let action_bar uuid b : t =
  box ~key:("aab-" ^ uuid)
    [ button ~key:("aabbtn-" ^ uuid) ~variant:`ghost ~size:`icon
        ~label:(I18n.t "ui/show-more")
        ~accessibility_identifier:("asset-menu-btn-" ^ uuid)
        ~icon:(`app "dots-vertical")
        ~on_press:(fun _ ->
          match Ui_services.dom_query ("#asset-menu-btn-" ^ uuid) with
          | Some el ->
              Views_popup.show_menu ~anchor:el
                (menu_items uuid b)
          | None -> ())
        [] ]

let img_dims (b : Model.block) =
  (* cljs img-metadata: resize-metadata width, else 250 *)
  let w =
    match b.Model.block_asset_resize with
    | Some r -> r
    | None -> 250
  in
  match b.Model.block_asset_width, b.Model.block_asset_height with
  | Some aw, Some ah when aw > 0 -> (w, Some (w * ah / aw))
  | _ -> (w, None)

(* asset render readiness — the img only mounts once the asset file exists
   in pfs (cljs asset-cp renders asset-link only when file-ready?). A per-uuid
   signal flips true when the object URL resolves; remote downloads are
   requested once per uuid and retried on asset-file-write-finish *)
let ready_sigs
    : (string, string * string * bool Signal.state) Hashtbl.t =
  Hashtbl.create 17

let download_requested : (string, string) Hashtbl.t = Hashtbl.create 17

(* cljs maybe-request-remote-asset-download! — the worker no-ops when the
   asset lacks remote-metadata or the file already exists *)
let request_remote_download uuid ext =
  let r = repo () in
  if
    r <> "" && ext <> "" && not (Hashtbl.mem download_requested uuid)
  then begin
    Hashtbl.replace download_requested uuid ext;
    ignore
      ((let* _ =
         Runtime.invoke2 "thread-api/db-sync-request-asset-download"
           (W.String r) (W.String uuid)
       in
       Js.Promise.resolve ())
       |> Js.Promise.catch (fun _ -> Js.Promise.resolve ()))
  end

let resolve_img uuid file ext st =
  ignore
    ((let* _ = A.object_url ~repo:(repo ()) ~name:file ~mime:(mime_of_ext ext) in
     Runtime.signal_set st true;
     Js.Promise.resolve ())
     |> Js.Promise.catch (fun _ ->
            request_remote_download uuid ext;
            Js.Promise.resolve ()))

let ready_for uuid ext context : bool Signal.state =
  match Hashtbl.find_opt ready_sigs uuid with
  | Some (_, _, st) -> st
  | None ->
      let st = Signal.state context.Lui_ui.ui_scheduler false in
      Hashtbl.replace ready_sigs uuid (repo (), ext, st);
      st

(* worker wrote assets/<uuid>.<ext> to pfs after a remote download —
   re-resolve the object URL and flip the img on *)
let on_asset_write_finish ~repo' ~asset_id =
  if repo' = repo () then
    match Hashtbl.find_opt ready_sigs asset_id with
    | Some (_, ext, st) ->
        Hashtbl.remove download_requested asset_id;
        resolve_img asset_id (asset_id ^ "." ^ ext) ext st
    | None -> ()

(* a download request issued before db-sync-start has a live client is a
   silent no-op on the worker — on each rtc-sync-state broadcast re-resolve
   every still-pending img so it asks again once the client exists *)
let retry_pending () =
  let r = repo () in
  if r <> "" then
    Hashtbl.iter
      (fun uuid (repo', ext, st) ->
        if repo' = r && not (Runtime.signal_get st) then begin
          Hashtbl.remove download_requested uuid;
          resolve_img uuid (uuid ^ "." ^ ext) ext st
        end)
      ready_sigs

(* record asset/width+height once the img decodes — cljs measure-image! *)
let measure_on_load uuid (b : Model.block) =
  if Ui_services.env_publishing () then () else
  match b.Model.block_asset_width, b.Model.block_asset_height with
  | Some _, Some _ -> ()
  | _ -> (
      (* #asset-img-<uuid> ids the .lui-image wrapper; the pixels img
         inside carries the natural size *)
      match B.query_selector ("#asset-img-" ^ uuid ^ " .lui-image-pixels")
      with
      | Some img when B.el_nat_width img > 0. && B.el_nat_height img > 0. ->
          ignore
            (Outliner_ops.apply
               [ Outliner_ops.set_block_property uuid
                   "logseq.property.asset/width"
                   (W.Int (int_of_float (B.el_nat_width img)))
               ; Outliner_ops.set_block_property uuid
                   "logseq.property.asset/height"
                   (W.Int (int_of_float (B.el_nat_height img))) ])
      | _ -> ())

let asset_img uuid (b : Model.block) file : t =
  let src =
    (* url_cache keys are repo|name — see Asset_store.cache_key *)
    match Hashtbl.find_opt A.url_cache (A.cache_key (repo ()) file) with
    | Some u -> u
    | None -> ""
  in
  (* title tooltip is dropped — alt covers the same text; no tooltip
     prop exists on image. #asset-img-<uuid> ids the .lui-image wrapper —
     the lightbox and measure paths reach the inner .lui-image-pixels *)
  let w, h = img_dims b in
  image ~key:("acimg-" ^ uuid)
    ~accessibility_identifier:("asset-img-" ^ uuid)
    ~url:src ~alt:b.Model.block_title ~loading:`lazy_
    ~referrer_policy:`no_referrer ~width:w ?height:h
    ~style_class:"rounded-sm relative"
    ~on_load:(fun _ -> measure_on_load uuid b)
    []

let asset_placeholder : t =
  box ~key:"acph" ~style_class:"asset-container" ~width:250 []

let asset_container uuid (b : Model.block) : t =
  let ext = Option.value b.Model.block_asset_type ~default:"" in
  let file = uuid ^ "." ^ ext in
  fun context parent ->
    let ready = ready_for uuid ext context in
    (if not (Runtime.signal_get ready) then
       resolve_img uuid file ext ready);
    (* the lightbox press lives on the img branch only — clicks on the
       action bar (sibling, outside the pressable) must not open it *)
    (box ~key:("ac-" ^ uuid) ~style_class:"asset-container"
       ([ reactive (fun r ->
             if r then
               Ui_parts.pressable
                 ~on_press:(fun _ ->
                   match
                     B.query_selector
                       ("#asset-img-" ^ uuid ^ " .lui-image-pixels")
                   with
                   | Some img -> open_lightbox img
                   | None -> ())
                 (row ~key:("asset-press-" ^ uuid) [ asset_img uuid b file ])
             else asset_placeholder)
           ready.Signal.state_signal
       ] @ (if Ui_services.env_publishing () then [] else [ action_bar uuid b ])))
      context parent

(* pointerdown -> window pointermove/pointerup drag — the window
   listeners stay imperative (start_drag); only the trigger uses a
   kind event *)
let resize_handle uuid side : t =
  let cls =
    match side with
    | `Left -> "handle-left image-resize"
    | `Right -> "handle-right image-resize"
  in
  text ~key:("rh-" ^ uuid ^ (if side = `Left then "l" else "r"))
    ~style_class:cls
    ~on_pointer_down:(fun ev ->
      match ev with
      | Lui_protocol.PointerDown (_, d) ->
          start_drag ~side ~uuid ~start_x:d.Lui_protocol.x
      | _ -> ())
    []

let image_block uuid (b : Model.block) : t =
  box ~key:("ri-" ^ uuid) 
    [ (* ls-resize-image is an imperative query handle (start_drag) *)
      box ~key:("rim-" ^ uuid) ~corner_radius:6
        ~style_class:"ls-resize-image"
        (asset_container uuid b ::
         if Ui_services.env_publishing () then []
         else [ resize_handle uuid `Left; resize_handle uuid `Right ]) ]

(* resolved object URL for assets/<file> — shared by the pdf/media/
   asset-ref branches (attrs_signal_v so the patch lands in place) *)
let asset_url_sigs : (string, string Signal.state) Hashtbl.t =
  Hashtbl.create 8

let mime_of_ext ext =
  match ext with
  | "mp3" | "mpeg" -> "audio/mpeg"
  | "ogg" -> "audio/ogg"
  | "wav" -> "audio/wav"
  | "m4a" -> "audio/mp4"
  | "flac" -> "audio/flac"
  | "aac" -> "audio/aac"
  | "wma" -> "audio/x-ms-wma"
  | "mp4" -> "video/mp4"
  | "webm" -> "video/webm"
  | "mov" -> "video/quicktime"
  | "pdf" -> "application/pdf"
  | _ -> "application/octet-stream"

let asset_url_sig ~mime uuid file context =
  match Hashtbl.find_opt asset_url_sigs uuid with
  | Some st -> st
  | None ->
      let st = Signal.state context.Lui_ui.ui_scheduler "" in
      Hashtbl.replace asset_url_sigs uuid st;
      ignore
        ((let ( let* ) p f = Js.Promise.then_ f p in
          let* url =
            Asset_store.object_url ~repo:(repo ()) ~name:file ~mime
          in
          Runtime.signal_set st url;
          Js.Promise.resolve ())
         |> Js.Promise.catch (fun _ -> Js.Promise.resolve ()));
      st

let audio_exts =
  [ "mp3"; "ogg"; "mpeg"; "wav"; "m4a"; "flac"; "wma"; "aac" ]

let video_exts = [ "mp4"; "webm"; "mov"; "flv"; "avi"; "mkv" ]

(* cljs asset-link non-image branches: <audio>/<video> for media,
   a.asset-ref[href][download] for everything else — the elements ride
   the dom channel since controls/src/download/href have no props *)
let file_block uuid (b : Model.block) : t =
 fun context parent ->
  let ext = Option.value b.Model.block_asset_type ~default:"" in
  let file = uuid ^ "." ^ ext in
  let url =
    (asset_url_sig ~mime:(mime_of_ext ext) uuid file context)
      .Signal.state_signal
  in
  let src_attrs base =
    Logseq_el.attrs_signal url (fun u ->
        if u = "" then base else ("src", u) :: base)
  in
  let body =
    if
      List.mem ext audio_exts
      || (ext = "webm" && Str_util.starts_with b.Model.block_title "Audio-")
    then
      (* cljs audio-cp: <audio controls> — m4a carries a typed
         <source> child instead of a src attr *)
      Logseq_el.el ~key:("au-" ^ uuid) ~tag:"audio"
        ~attrs_signal_v:(src_attrs [ ("controls", "") ])
        (if ext = "m4a" then
           [ Logseq_el.el ~key:"src" ~tag:"source"
               ~attrs_signal_v:
                 (src_attrs [ ("type", "audio/mp4") ])
               [] ]
         else [])
    else if List.mem ext video_exts then
      (* cljs asset-video: <video.asset-video controls src> *)
      Logseq_el.el ~key:("vd-" ^ uuid) ~tag:"video" ~style_class:"asset-video"
        ~attrs_signal_v:(src_attrs [ ("controls", "") ])
        []
    else
      (* cljs web: a.asset-ref[href=src][download=file-name] *)
      Logseq_el.el ~key:("afl-" ^ uuid) ~tag:"a" ~style_class:"asset-ref"
        ~text:file
        ~attrs_signal_v:
          (Logseq_el.attrs_signal url (fun u ->
               if u = "" then [ ("download", file) ]
               else [ ("href", u); ("download", file) ]))
        []
  in
  box ~key:("af-" ^ uuid) [ body ] context parent

(* cljs a.asset-ref.is-pdf — data-url resolves to the blob object URL
   async via the same url signal *)

let pdf_block uuid (b : Model.block) : t =
 fun context parent ->
  let file = uuid ^ ".pdf" in
  let href = "../assets/" ^ file in
  let st = asset_url_sig ~mime:"application/pdf" uuid file context in
  (* cljs a.asset-ref.is-pdf — the click opens the in-app pdf viewer (not
     a navigation), and data-href/data-url have no readers, so this is a
     pressable label, not a link *)
  (Ui_parts.pressable ~on_press:(fun _ ->
       let url = Runtime.signal_get st in
       Pdf_assets.open_pdf_file ~original_path:href
         ~href:(if url = "" then href else url) ~b)
     (text ~key:("pdf-" ^ uuid) ~value:b.Model.block_title
         []))
    context parent

(* whole asset branch — .asset-block-wrap replaces .block-content inside
   .block-content-wrapper (cljs block.cljs asset render path) *)
let block_view uuid (b : Model.block) : t =
  let body =
    match b.Model.block_asset_type with
    | Some ext when is_image ext -> image_block uuid b
    | Some "pdf" -> pdf_block uuid b
    | _ -> file_block uuid b
  in
  column ~key:("abw-" ^ uuid) ~style_class:"asset-block-wrap" ~grow:1.
    [ box ~key:("abcc-" ^ uuid) ~grow:1. [ body ]
    ; Ui_parts.pressable
        ~on_press:(fun _ -> Editor_actions.enter_edit uuid 0)
        (box ~key:("abt-" ^ uuid) ~min_height:24
           [ text ~key:("abtt-" ^ uuid) ~value:b.Model.block_title
               ~style_class:"block-title-wrap" [] ]) ]

(* File-column cell for the Asset class tag page (cljs objects.cljs
   build-class-object-columns :file). The object-url resolves async —
   src binds through a mount-scoped signal instead of an attr poke. *)
let file_cell_el (w : W.t) : t =
 fun ctx parent ->
  let uuid = Option.value (W.map_get_uuid w "block/uuid") ~default:"" in
  let ext =
    Option.value
      (W.map_get_string w "logseq.property.asset/type")
      ~default:""
  in
  let file = uuid ^ "." ^ ext in
  let src = Signal.state ctx.Lui_ui.ui_scheduler "" in
  (match Hashtbl.find_opt A.url_cache file with
   | Some url -> Runtime.signal_set src url
   | None ->
       ignore
         ((let* url = A.object_url ~repo:(repo ()) ~name:file ~mime:(mime_of_ext ext) in
          Runtime.signal_set src url;
          Js.Promise.resolve ())
          |> Js.Promise.catch (fun _ -> Js.Promise.resolve ())));
  box ~style_class:"block-content" ~max_height:30
    [ image ~url_signal:src.Signal.state_signal ~alt:file [] ]
    ctx parent

(* ---------- command hookup ---------- *)

(* "upload" is dispatched by the shared editor command dispatcher —
   Editor_cmds calls pick_files through the installed host, so this
   hookup registers nothing on web. *)
let install () = ()
