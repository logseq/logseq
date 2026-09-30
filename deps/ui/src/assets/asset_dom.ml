(* Asset blocks — hidden upload input + pfs storage + image render with
   lightbox / resize handles / action menu.
   Mirrors cljs components/block.cljs asset-cp / resizable-image /
   open-lightbox! and handler/editor/assets.cljs db-based-save-assets! /
   delete-asset-of-block!. *)

open Promise_ext
module E = Webapi.Dom.Element
module S = Editor_state
module W = Wire
module B = Browser_ui
module A = Asset_store
module D = Views_dom

open Lui_elements

let dom = Logseq_dom.dom
let repo = Runtime.repo

(* ---------- raw externals ---------- *)

external file_size : Js.Json.t -> float = "size" [@@mel.get]
external el_of_json : Js.Json.t -> E.t = "%identity"
external json_of_el : E.t -> Js.Json.t = "%identity"
external el_to_dom : E.t -> D.el = "%identity"

external get_attr
  :  E.t
  -> string
  -> string Js.Nullable.t = "getAttribute" [@@mel.send]

external nat_w : E.t -> float = "naturalWidth" [@@mel.get]
external nat_h : E.t -> float = "naturalHeight" [@@mel.get]
external offset_w : E.t -> float = "offsetWidth" [@@mel.get]

external win_on : string -> (Js.Json.t -> unit) -> unit =
  "addEventListener" [@@mel.scope "window"]

external win_off : string -> (Js.Json.t -> unit) -> unit =
  "removeEventListener" [@@mel.scope "window"]

let root_add_class : string -> unit =
  [%mel.raw "function (c) { document.documentElement.classList.add(c) }"]

let root_rm_class : string -> unit =
  [%mel.raw "function (c) { document.documentElement.classList.remove(c) }"]

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

let qs_all sel =
  let f : string -> Js.Json.t array =
    [%mel.raw
      "function (s) { return Array.from(document.querySelectorAll(s)) }"]
  in
  Array.map el_of_json (f sel)

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
      match B.qs ("#edit-block-" ^ e.S.uuid) with
      | None -> ()
      | Some ta ->
          let ta = json_of_el ta in
          let v = Dom_ext.value ta in
          let pos = min (Dom_ext.selection_start ta) (String.length v) in
          (match String.rindex_opt (String.sub v 0 pos) '/' with
           | None -> ()
           | Some i ->
               let nv =
                 String.sub v 0 i
                 ^ String.sub v pos (String.length v - pos)
               in
               Dom_ext.set_value ta nv;
               Dom_ext.set_selection_range ta i i;
               S.set_silent (fun st ->
                   { st with
                     S.editing = Some { e with S.buffer = nv } })))

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
            | _ -> Platform.random_uuid ()
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
          match !Runtime.current_page with
          | Some (p : Model.page) -> p.Model.page_uuid
          | None -> (
              (* cljs falls back to today's journal — the journals view
                 is fetched newest-first so today's page leads
                 current_journals *)
              match !Runtime.current_journals with
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
        let save_ops =
          match S.editing () with
          | Some e -> (
              match S.find e.S.uuid with
              | Some b when b.Model.block_title <> e.S.buffer ->
                  [ Outliner_ops.save_block e.S.uuid e.S.buffer ]
              | _ -> [])
          | None -> []
        in
        ignore
          (let* blocks = blocks_p in
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

(* hidden <input type=file> inside every editor — cljs
   components/editor.cljs image-uploader; the slash command clicks it *)
let upload_input key : t =
  dom ~key ~style_class:"image-uploader"
    [ dom ~key:(key ^ "-in") ~tag:"input" ~id:"upload-file"
        ~attrs:[ ("type", "file"); ("hidden", "") ]
        ~events:"change"
        ~on_dom_event:(fun name _ ->
          if name = "change" then
            match B.qs "#upload-file" with
            | Some el ->
                upload_files (B.files_of el);
                (* allow picking the same file twice in a row *)
                Dom_ext.set_value (json_of_el el) ""
            | None -> ())
        [] ]

(* ---------- lightbox ---------- *)

let open_lightbox clicked =
  let imgs = qs_all ".asset-container img" in
  let n = Array.length imgs in
  if n > 0 then begin
    let rec find i =
      if i >= n then 0
      else if
        Js.Nullable.return (get_attr imgs.(i) "id")
        = Js.Nullable.return (get_attr clicked "id")
      then i
      else find (i + 1)
    in
    let idx = find 0 in
    let items =
      Array.init n (fun j ->
          let img = imgs.((idx + j) mod n) in
          let src =
            Option.value
              (Js.Nullable.toOption (get_attr img "src"))
              ~default:""
          in
          B.json_props
            [ "src", B.str_to_json src
            ; "w", B.str_to_json (Printf.sprintf "%.0f" (nat_w img))
            ; "h", B.str_to_json (Printf.sprintf "%.0f" (nat_h img)) ])
    in
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
  end

(* ---------- resize ---------- *)

let finish_drag uuid w =
  root_rm_class "is-resizing-buf";
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
  match B.qs ("#ls-block-" ^ uuid) with
  | None -> ()
  | Some row -> (
      match B.qs_in row ".ls-resize-image", B.qs_in row "img" with
      | Some box, Some img ->
          let start_w = offset_w box in
          root_add_class "is-resizing-buf";
          let rec on_move ev =
            let dx =
              if side = `Left then start_x -. Dom_ext.client_x ev
              else Dom_ext.client_x ev -. start_x
            in
            let w = start_w +. dx in
            if w > 60. || dx > 0. then
              B.set_attr img "width"
                (string_of_int (int_of_float w))
          and on_up _ev =
            win_off "pointermove" on_move;
            win_off "pointerup" on_up;
            finish_drag uuid (offset_w box)
          in
          win_on "pointermove" on_move;
          win_on "pointerup" on_up
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
  dom ~key:("aab-" ^ uuid) ~style_class:"asset-action-bar"
    ~attrs:[ ("aria-hidden", "true") ]
    [ dom ~key:("aabbtn-" ^ uuid) ~tag:"button"
        ~id:("asset-menu-btn-" ^ uuid)
        ~style_class:"h-6 w-6 inline-flex items-center justify-center"
        ~events:"click"
        ~on_dom_event:(fun name _ ->
          if name = "click" then
            match B.qs ("#asset-menu-btn-" ^ uuid) with
            | Some el ->
                Views_popup.show_menu ~anchor:(el_to_dom el)
                  (menu_items uuid b)
            | None -> ())
        [ dom ~key:("aabi-" ^ uuid) ~tag:"i"
            ~style_class:"ti ti-dots-vertical" [] ]
    ]

let img_attrs uuid (b : Model.block) =
  (* cljs img-metadata: resize-metadata width, else 250 *)
  let w =
    match b.Model.block_asset_resize with
    | Some r -> r
    | None -> 250
  in
  let base =
    [ ("id", "asset-img-" ^ uuid); ("loading", "lazy")
    ; ("referrerPolicy", "no-referrer"); ("title", b.Model.block_title)
    ; ("width", string_of_int w) ]
  in
  match b.Model.block_asset_width, b.Model.block_asset_height with
  | Some aw, Some ah when aw > 0 ->
      base @ [ ("height", string_of_int (w * ah / aw)) ]
  | _ -> base

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
        if repo' = r && not (Signal.get st.Signal.state_signal) then begin
          Hashtbl.remove download_requested uuid;
          resolve_img uuid (uuid ^ "." ^ ext) ext st
        end)
      ready_sigs

(* record asset/width+height once the img decodes — cljs measure-image! *)
let measure_on_load uuid (b : Model.block) =
  match b.Model.block_asset_width, b.Model.block_asset_height with
  | Some _, Some _ -> ()
  | _ -> (
      match B.qs ("#asset-img-" ^ uuid) with
      | Some img when nat_w img > 0. && nat_h img > 0. ->
          ignore
            (Outliner_ops.apply
               [ Outliner_ops.set_block_property uuid
                   "logseq.property.asset/width"
                   (W.Int (int_of_float (nat_w img)))
               ; Outliner_ops.set_block_property uuid
                   "logseq.property.asset/height"
                   (W.Int (int_of_float (nat_h img))) ])
      | _ -> ())

let asset_img uuid (b : Model.block) file : t =
  let src =
    (* url_cache keys are repo|name — see Asset_store.cache_key *)
    match Hashtbl.find_opt A.url_cache (A.cache_key (repo ()) file) with
    | Some u -> u
    | None -> ""
  in
  dom ~key:("acimg-" ^ uuid) ~tag:"img"
    ~style_class:"rounded-sm relative fade-in fade-in-faster"
    ~attrs:
      ( img_attrs uuid b
      @ if src = "" then [] else [ ("src", src) ] )
    ~events:"load"
    ~on_dom_event:(fun name _ ->
      if name = "load" then measure_on_load uuid b)
    []

let asset_placeholder : t =
  dom ~key:"acph" ~style_class:"img-placeholder asset-container"
    ~attrs:[ ("style", "width: 250px") ] []

let asset_container uuid (b : Model.block) : t =
  let ext = Option.value b.Model.block_asset_type ~default:"" in
  let file = uuid ^ "." ^ ext in
  fun context parent ->
    let ready = ready_for uuid ext context in
    (if not (Signal.get ready.Signal.state_signal) then
       resolve_img uuid file ext ready);
    (dom ~key:("ac-" ^ uuid) ~style_class:"asset-container"
       ~events:"click"
       ~on_dom_event:(fun name payload ->
         (* clicks on the action bar inside the container must not open the
            lightbox — cljs stops propagation on the trigger instead *)
         let on_img =
           let s = Platform.payload_str payload "targetId" in
           String.length s >= 10 && String.sub s 0 10 = "asset-img-"
         in
         if name = "click" && on_img then
           match B.qs ("#asset-img-" ^ uuid) with
           | Some img -> open_lightbox img
           | None -> ())
       [ dyn ~equal:(=) (fun r -> if r then asset_img uuid b file else asset_placeholder)
           ready.Signal.state_signal
       ; action_bar uuid b ])
      context parent

let resize_handle uuid side : t =
  let cls =
    match side with
    | `Left -> "handle-left image-resize"
    | `Right -> "handle-right image-resize"
  in
  dom ~key:("rh-" ^ uuid ^ (if side = `Left then "l" else "r"))
    ~tag:"span" ~style_class:cls
    ~events:"pointerdown"
    ~on_dom_event:(fun name payload ->
      match name, payload with
      | "pointerdown", Some _ ->
          start_drag ~side ~uuid
            ~start_x:(Platform.payload_num payload "clientX")
      | _ -> ())
    []

let image_block uuid (b : Model.block) : t =
  let align = Option.value b.Model.block_asset_align ~default:"left" in
  dom ~key:("ri-" ^ uuid) ~style_class:"ls-resize-inner w-full select-none"
    [ dom ~key:("rim-" ^ uuid)
        ~style_class:("ls-resize-image rounded-md align-" ^ align)
        [ asset_container uuid b
        ; resize_handle uuid `Left
        ; resize_handle uuid `Right ] ]

(* link fallback for non-image assets *)
let file_block uuid (b : Model.block) : t =
  let ext = Option.value b.Model.block_asset_type ~default:"" in
  let file = uuid ^ "." ^ ext in
  dom ~key:("af-" ^ uuid) ~style_class:"asset-ref"
    [ dom ~key:("afl-" ^ uuid) ~tag:"a"
        ~attrs:[ ("href", "#"); ("download", file); ("title", file) ]
        ~text:file [] ]

(* whole asset branch — .asset-block-wrap replaces .block-content inside
   .block-content-wrapper (cljs block.cljs asset render path) *)
let block_view uuid (b : Model.block) : t =
  let body =
    match b.Model.block_asset_type with
    | Some ext when is_image ext -> image_block uuid b
    | _ -> file_block uuid b
  in
  dom ~key:("abw-" ^ uuid)
    ~style_class:"flex flex-col asset-block-wrap w-full"
    [ dom ~key:("abcc-" ^ uuid) ~style_class:"flex flex-1" [ body ]
    ; dom ~key:("abt-" ^ uuid)
        ~style_class:"asset-title-slot text-xs opacity-60 mt-1 cursor-text"
        ~attrs:[ ("style", "min-height: 24px") ]
        ~events:"click"
        ~on_dom_event:(fun name _ ->
          if name = "click" then Editor_actions.enter_edit uuid 0)
        [ dom ~key:("abtt-" ^ uuid) ~tag:"span"
            ~style_class:"block-title-wrap"
            ~text:b.Model.block_title [] ] ]

(* File-column cell for the Asset class tag page (cljs objects.cljs
   build-class-object-columns :file) *)
let file_cell (w : W.t) : D.el =
  let uuid = Option.value (W.map_get_uuid w "block/uuid") ~default:"" in
  let ext =
    Option.value
      (W.map_get_string w "logseq.property.asset/type")
      ~default:""
  in
  let file = uuid ^ "." ^ ext in
  let img = D.h ~tag:"img" ~attrs:[ ("title", file) ] () in
  (match Hashtbl.find_opt A.url_cache file with
   | Some url -> D.el_set_attr img "src" url
   | None ->
       ignore
         ((let* url = A.object_url ~repo:(repo ()) ~name:file ~mime:(mime_of_ext ext) in
          D.el_set_attr img "src" url;
          Js.Promise.resolve ())
          |> Js.Promise.catch (fun _ -> Js.Promise.resolve ())));
  D.h ~cls:"block-content overflow-hidden"
    ~attrs:[ ("style", "max-height: 30px") ]
    ~children:[ img ] ()

(* ---------- command hookup ---------- *)

(* slash "Upload an asset" emits ls:editor-command {command} — cljs
   :editor/click-hidden-file-input clicks the hidden input *)
let install () =
  Platform.on_document_event "ls:editor-command" (fun ev ->
      match
        Js.Json.decodeObject (Platform.json_prop ev "detail")
      with
      | Some d -> (
          match
            Option.bind (Js.Dict.get d "command") Js.Json.decodeString
          with
          | Some "upload" -> (
              match B.qs "#upload-file" with
              | Some el -> B.click el
              | None -> ())
          | _ -> ())
      | None -> ())
