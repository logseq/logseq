(* Native twin — the pdf viewer is a declarative logseq-pdf extension
   element inside #app-single-container (PDFKit on the Swift side),
   instead of the imperative pdf.js portal. S.open_request pushes the
   asset into a signal the chrome's container reads.

   Annotation layer: the element's `attrs` prop carries the viewer
   state (hls, initial page, scale, armed ref-highlight, mode flags) as
   JSON strings; the Swift side reports user actions back as pdf-*
   dom-events whose payloads this module persists through
   Pdf_assets. *)

open Promise_ext
module W = Wire
module J = Js.Json

let current_sig : Model.pdf_asset option Signal.state option ref =
  ref None

(* mounted viewer state — None until load_hls_data resolves *)
type view =
  { asset : Model.pdf_asset
  ; hls : Model.hl list
  ; image_paths : (string * string) list (* hl id -> area png path *)
  ; page : int
  ; scale : string
  ; ref_hl : string option
  ; rev : int (* bump to force an attrs re-publish *)
  }

let view_sig : view option Signal.state option ref = ref None

let get_view () =
  match !view_sig with
  | Some s -> Signal.get s.Signal.state_signal
  | None -> None

let set_view v =
  match !view_sig with
  | Some s -> Runtime.signal_set s v
  | None -> ()

let update_view f =
  match get_view () with
  | Some v -> set_view (Some (f v))
  | None -> ()

(* created lazily inside the view where ui_scheduler exists; before
   that, set_current's write to S.current is picked up on first read *)
let asset_signal context : Model.pdf_asset option Signal.signal =
  match !current_sig with
  | Some s -> s.Signal.state_signal
  | None ->
      let s =
        Signal.state context.Lui_ui.ui_scheduler !Pdf_state.current
      in
      current_sig := Some s;
      s.Signal.state_signal

let view_signal context : view option Signal.signal =
  match !view_sig with
  | Some s -> s.Signal.state_signal
  | None ->
      let s = Signal.state context.Lui_ui.ui_scheduler None in
      view_sig := Some s;
      s.Signal.state_signal

(* ---------- attrs ---------- *)

let hl_rect_json (r : Model.hl_rect) : J.t =
  J.object_list
    [ "x1", J.number r.hl_x1
    ; "y1", J.number r.hl_y1
    ; "x2", J.number r.hl_x2
    ; "y2", J.number r.hl_y2
    ; "w", J.number r.hl_w
    ; "h", J.number r.hl_h
    ]

let hl_json image_paths (hl : Model.hl) : J.t =
  let image =
    match hl.hl_id, hl.hl_image with
    | Some id, Some _ -> (
        match List.assoc_opt id image_paths with
        | Some p -> J.string p
        | None -> J.null)
    | _ -> J.null
  in
  J.object_list
    [ "id", J.string (Option.value hl.hl_id ~default:"")
    ; "page", J.number (float_of_int hl.hl_page)
    ; ( "color"
      , match hl.hl_color with
        | Some c -> J.string c
        | None -> J.null )
    ; "bounding", hl_rect_json hl.hl_bounding
    ; "rects",
      J.array (Array.of_list (List.map hl_rect_json hl.hl_rects))
    ; "text", J.string hl.hl_text
    ; "image", image
    ]

let bool_str b = if b then "true" else "false"

let attrs_of_view (v : view) : (string * string) list =
  [ "path", v.asset.Model.pdf_url
  ; "filename", v.asset.Model.pdf_filename
  ; "hls",
    J.stringify (J.array (Array.of_list (List.map (hl_json v.image_paths) v.hls)))
  ; "page", string_of_int v.page
  ; "scale", v.scale
  ; "ref_hl", Option.value v.ref_hl ~default:""
  ; "theme", Pdf_state.viewer_theme ()
  ; "dashed", bool_str (Pdf_state.area_dashed ())
  ; "colored", bool_str (Pdf_state.hl_colored ())
  ; "automenu", bool_str (Pdf_state.auto_open_ctx ())
  ; "hl_mode", bool_str !Pdf_state.highlight_mode
  ; "area_mode", bool_str !Pdf_state.area_mode
  ]

(* ---------- event payload parsing ---------- *)

let jget (j : J.t) k =
  match J.decodeObject j with
  | Some d -> Js.Dict.get d k
  | None -> None

let jstr j k = Option.bind (jget j k) J.decodeString

let jnum j k = Option.bind (jget j k) J.decodeNumber

let jobj j k = jget j k

let jarr j k =
  match jget j k with
  | Some j -> (
      match J.decodeArray j with
      | Some a -> Array.to_list a
      | None -> [])
  | None -> []

let hl_rect_of_json (j : J.t) : Model.hl_rect =
  let f k = Option.value (jnum j k) ~default:0. in
  { Model.hl_x1 = f "x1"
  ; hl_y1 = f "y1"
  ; hl_x2 = f "x2"
  ; hl_y2 = f "y2"
  ; hl_w = f "w"
  ; hl_h = f "h"
  }

(* Swift emits the hl in the same shape as cljs position/content/
   properties maps *)
let hl_of_json (j : J.t) : Model.hl =
  let bounding =
    Option.map hl_rect_of_json (jobj j "bounding")
    |> Option.value ~default:(hl_rect_of_json J.null)
  in
  { Model.hl_id = jstr j "id"
  ; hl_page = Option.value (Option.map int_of_float (jnum j "page"))
        ~default:1
  ; hl_bounding = bounding
  ; hl_rects = List.map hl_rect_of_json (jarr j "rects")
  ; hl_text = Option.value (jstr j "text") ~default:""
  ; hl_image = None
  ; hl_color = jstr j "color"
  }

(* ---------- dom events from Swift ---------- *)

let update_hls f =
  update_view (fun v ->
      let hls = f v.hls in
      Pdf_state.set_hls hls;
      { v with hls; rev = v.rev + 1 })

let add_hl hl =
  update_hls (fun hls -> hls @ [ hl ]);
  ignore (Pdf_assets.copy_hl_ref hl)

let add_area_hl (j : J.t) =
  match jstr j "png" with
  | None -> ()
  | Some b64 ->
      let hl = hl_of_json j in
      ignore
        (let png = Bytes.of_string (Transit.base64_decode b64) in
         let* db_id = Pdf_assets.save_area_png png in
         let hl =
           { hl with
             Model.hl_image = Option.map Int64.of_int db_id }
         in
         update_hls (fun hls -> hls @ [ hl ]);
         Pdf_assets.copy_hl_ref hl;
         Js.Promise.resolve ())

let del_hl id =
  match get_view () with
  | None -> ()
  | Some v -> (
      match
        List.find_opt (fun (hl : Model.hl) -> hl.hl_id = Some id) v.hls
      with
      | Some hl ->
          update_hls
            (fun hls ->
              List.filter (fun (h : Model.hl) -> h.hl_id <> Some id) hls);
          Pdf_assets.del_ref_block hl
      | None -> ())

let color_hl id color =
  update_hls
    (fun hls ->
      List.map
        (fun (hl : Model.hl) ->
          if hl.hl_id = Some id then
            let hl' = { hl with Model.hl_color = Some color } in
            Pdf_assets.update_hl_block hl';
            hl'
          else hl)
        hls)

let with_hl id f =
  match get_view () with
  | Some v -> (
      match
        List.find_opt (fun (hl : Model.hl) -> hl.hl_id = Some id) v.hls
      with
      | Some hl -> f hl
      | None -> ())
  | None -> ()

let set_flag name value =
  (match name with
   | "dashed" -> Pdf_state.set_area_dashed (value = "true")
   | "colored" -> Pdf_state.set_hl_colored (value = "true")
   | "automenu" -> Pdf_state.set_auto_open_ctx (value = "true")
   | "theme" -> Pdf_state.set_viewer_theme value
   | _ -> ());
  update_view (fun v -> { v with rev = v.rev + 1 })

let set_mode name on =
  (match name with
   | "area" -> Pdf_state.area_mode := on
   | "highlight" -> Pdf_state.highlight_mode := on
   | _ -> ());
  update_view (fun v -> { v with rev = v.rev + 1 })

let persist_page n =
  match get_view () with
  | Some { asset = { Model.pdf_block_uuid = Some uuid; _ }; _ } ->
      ignore
        (Properties_data.set_block_property ~block_uuid:uuid
           ~ident:"logseq.property.asset/last-visit-page"
           ~value:(W.Int n))
  | _ -> ()

let persist_scale s =
  match get_view () with
  | Some { asset = { Model.pdf_block_db_id = Some id; _ }; _ } ->
      Pdf_state.set_stored_scale id s
  | _ -> ()

let events =
  "pdf-close pdf-hl-add pdf-hl-area pdf-hl-del pdf-hl-color \
   pdf-hl-ref pdf-hl-link pdf-annots pdf-page pdf-scale pdf-flag \
   pdf-mode"

let on_dom_event name payload =
  let j =
    match payload with
    | Some p -> ( try J.parseExn p with _ -> J.null)
    | None -> J.null
  in
  match name with
  | "pdf-close" -> Pdf_state.set_current None
  | "pdf-hl-add" -> add_hl (hl_of_json j)
  | "pdf-hl-area" -> add_area_hl j
  | "pdf-hl-del" -> (
      match jstr j "id" with
      | Some id -> del_hl id
      | None -> ())
  | "pdf-hl-color" -> (
      match jstr j "id", jstr j "color" with
      | Some id, Some color -> color_hl id color
      | _ -> ())
  | "pdf-hl-ref" -> (
      match jstr j "id" with
      | Some id -> with_hl id Pdf_assets.copy_hl_ref
      | None -> ())
  | "pdf-hl-link" -> (
      match jstr j "id" with
      | Some id -> with_hl id Pdf_assets.goto_block_ref
      | None -> ())
  | "pdf-annots" -> (
      match get_view () with
      | Some v -> Pdf_assets.goto_annotations_page v.asset
      | None -> ())
  | "pdf-page" -> (
      match jnum j "page" with
      | Some n -> persist_page (int_of_float n)
      | None -> ())
  | "pdf-scale" -> (
      match jstr j "scale" with
      | Some s -> persist_scale s
      | None -> ())
  | "pdf-flag" -> (
      match jstr j "name", jstr j "value" with
      | Some n, Some v -> set_flag n v
      | _ -> ())
  | "pdf-mode" -> (
      match jstr j "name", jstr j "on" with
      | Some n, Some v -> set_mode n (v = "true")
      | _ -> ())
  | _ -> ()

(* ---------- element ---------- *)

(* resolves hl-image asset db/ids to on-disk png paths *)
let image_paths_of (hls : Model.hl list) :
    (string * string) list Js.Promise.t =
  let* pairs =
    Js.Promise.all
      (Array.of_list
         (List.filter_map
            (fun (hl : Model.hl) ->
              match hl.hl_id, hl.hl_image with
              | Some id, Some db_id ->
                  Some
                    (let* p = Pdf_assets.hl_image_path db_id in
                     Js.Promise.resolve
                       (match p with
                        | Some path -> Some (id, path)
                        | None -> None))
              | _ -> None)
            hls))
  in
  Js.Promise.resolve (List.filter_map Fun.id (Array.to_list pairs))

let load_view (a : Model.pdf_asset) =
  ignore
    (let* hls, page_opt, scale = Pdf_assets.load_hls_data a in
     let* image_paths = image_paths_of hls in
     Pdf_state.set_hls hls;
     let ref_hl =
       match !Pdf_state.ref_hl with
       | Some hl -> hl.hl_id
       | None -> None
     in
     let page =
       match !Pdf_state.ref_hl with
       | Some hl -> hl.hl_page
       | None -> Option.value page_opt ~default:1
     in
     set_view
       (Some
          { asset = a
          ; hls
          ; image_paths
          ; page
          ; scale
          ; ref_hl
          ; rev = 0
          });
     Js.Promise.resolve ())

let viewer_el : Lui_elements.t =
 fun context parent ->
  let view_s = view_signal context in
  Logseq_dom.dyn
    ~equal:(fun (a : Model.pdf_asset option) b ->
      match a, b with
      | Some x, Some y -> x.pdf_identity = y.pdf_identity
      | None, None -> true
      | _ -> false)
    (fun ao ->
      match ao with
      | None ->
          set_view None;
          Logseq_dom.nothing
      | Some a ->
          (match get_view () with
           | Some v when v.asset.pdf_identity = a.pdf_identity -> ()
           | _ -> load_view a);
          (* the whole viewer — canvas, toolbar, sidebar, popovers — is
             the native logseq-pdf component; OCaml supplies only data
             (hls/page/scale/modes/flags) and receives annotation events *)
          Logseq_dom.dom ~tag:"pdf"
            ~style_class:"w-full h-full"
            ~events
            ~on_dom_event
            ~attrs_signal_v:
              (Logseq_dom.attrs_signal view_s (fun vo ->
                   match vo with
                   | Some v -> attrs_of_view v
                   | None -> [ "path", a.Model.pdf_url ]))
            [])
    (asset_signal context)
    context parent

(* the sibling of #left-container in #app-container: grows to take the
   right half only while a pdf is open *)
let container_el ~key ~id : Lui_elements.t =
 fun context parent ->
  Logseq_dom.dom ~key ~id
    ~style_class_signal:
      (Logseq_dom.class_signal
         (asset_signal context)
         (fun ao -> if Option.is_some ao then "grow" else ""))
    [ viewer_el ] context parent

let install () =
  Pdf_state.open_request :=
    (fun a ->
      match !current_sig with
      | Some s -> Runtime.signal_set s a
      | None -> ());
  Pdf_state.create_today_journal :=
    (fun () ->
      let* _ = Graph.create_today_journal (Runtime.repo ()) in
      Js.Promise.resolve ())
