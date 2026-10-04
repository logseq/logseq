(* pdf.cljs core: container mount into #app-single-container, getDocument
   loader (error dispatch + password retry), pdfjs viewer boot, resizer.
   cljs: extensions/pdf/core.cljs pdf-container/pdf-loader/pdf-viewer *)

module D = Web_dom
module U = Pdf_utils
module S = Pdf_state

let ( let* ) = U.( let* )

(* ---------- window globals ---------- *)

external pdfjs_lib : Js.Json.t = "pdfjsLib" [@@mel.scope "window"]

external pdfjs_viewer_ns : Js.Json.t = "pdfjsViewer"
  [@@mel.scope "window"]

external get_document : Js.Json.t -> Js.Json.t -> Js.Json.t
  = "getDocument" [@@mel.send]

external location_host : string = "host" [@@mel.scope "window.location"]

let location_open : string -> unit =
  [%mel.raw "function (u) { window.location.href = u }"]

let new_of : Js.Json.t -> string -> Js.Json.t -> Js.Json.t =
  [%mel.raw "function (ns, n, o) { return new ns[n](o) }"]

let set_active_raw : Js.Json.t -> unit =
  [%mel.raw "function (v) { window.lsActivePdfViewer = v }"]

let set_active_viewer (v : S.viewer option) : unit =
  set_active_raw (match v with Some v -> v | None -> Js.Json.null)

let jso pairs = Web_dom.json_props pairs

(* ---------- mount state ---------- *)

type mount =
  { identity : string
  ; container : D.el
  ; mutable doc : Js.Json.t option
  ; mutable viewer : S.viewer option
  ; mutable interactables : Js.Json.t list
  ; mutable generation : int
  }

let current_mount : mount option ref = ref None

let teardown () =
  (match !current_mount with
   | Some m ->
       (match m.viewer with
        | Some v -> U.cleanup v
        | None -> ());
       set_active_viewer None;
       (match m.doc with
        | Some d -> ignore (U.doc_destroy d)
        | None -> ());
       m.doc <- None;
       m.viewer <- None;
       Pdf_hls.uninstall ();
       Pdf_toolbar.uninstall ();
       List.iter U.interact_unset m.interactables;
       List.iter U.interact_unset !S.hls_interactables;
       m.interactables <- [];
       S.hls_interactables := [];
       Web_dom.el_remove m.container
   | None -> ());
  current_mount := None;
  Web_dom.body_rm_class "is-pdf-active"

(* ---------- debounced last-visit persistence (cljs
   debounce-set-last-visit-page!/scale! at 300ms) ---------- *)

let extra_timer : int option ref = ref None

let set_hls_extra (asset : Model.pdf_asset) (extra : Js.Json.t) =
  (match !extra_timer with
   | Some t -> Web_dom.clear_timeout t
   | None -> ());
  extra_timer :=
    Some
      (Web_dom.set_timeout_id
         (fun () ->
           (match asset.pdf_block_uuid, U.json_f extra "page" with
            | Some uuid, Some p when p > 0. ->
                ignore
                  (Properties_data.set_block_property ~block_uuid:uuid
                     ~ident:"logseq.property.asset/last-visit-page"
                     ~value:(Wire.Int (int_of_float p)))
            | _ -> ());
           match U.json_s extra "scale", asset.pdf_block_db_id with
           | Some s, Some dbid -> S.set_stored_scale dbid s
           | _ -> ())
         300)

(* ---------- getDocument ---------- *)

let cmap_url () =
  (if Str_util.ends_with location_host "logseq.com" then "./static/" else "./")
  ^ "js/pdfjs/cmaps/"

let get_doc ~url ~password : Js.Json.t Js.Promise.t =
  let opts =
    jso
      [ "url", Js.Json.string url
      ; "password", Js.Json.string password
      ; "ownerDocument", D.document_el
      ; "cMapUrl", Js.Json.string (cmap_url ())
      ; "cMapPacked", Js.Json.boolean true
      ; "supportsMouseWheelZoomCtrlKey", Js.Json.boolean true
      ; "supportsMouseWheelZoomMetaKey", Js.Json.boolean true ]
  in
  U.doc_promise (get_document pdfjs_lib opts)

(* ---------- loader UI ---------- *)

let loading_view (parent : D.el) =
  let el = Web_dom.create_element "div" in
  Web_dom.el_set_class el
    "flex justify-center items-center h-screen text-gray-500 text-lg";
  Web_dom.el_set_inner_html el
    "<svg class=\"animate-spin w-5 h-5\" version=\"1.1\" viewBox=\"0 0 \
     24 24\" fill=\"none\" style=\"display:inline-block\"><circle \
     class=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" \
     stroke=\"currentColor\" stroke-width=\"4\"></circle><path \
     class=\"opacity-75\" fill=\"currentColor\" d=\"M4 12a8 8 0 \
     018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 \
     3.042 1.135 5.824 3 7.938l3-2.647z\"></path></svg>";
  Web_dom.el_append_child parent el

(* cljs pdf-password-input — the shared prompt dialog host (.container >
   h3#modal-headline + input.form-input + Submit) renders the cljs
   two-line body when a desc is supplied *)
let ask_password ~(on_submit : string -> unit) : unit =
  Dialogs_state.prompt ~title:(I18n.t "pdf/password-required")
    ~desc:(I18n.t "pdf/password-protected-desc")
    ~on_submit:(fun pw ->
      Dialogs_state.close_prompt ();
      on_submit pw)
    ()

(* ---------- viewer boot (cljs pdf-viewer effect) ---------- *)

let boot_viewer (m : mount) (el : D.el) (pdf_doc : Js.Json.t) :
    S.viewer * Js.Json.t =
  let bus = new_of pdfjs_viewer_ns "EventBus" Js.Json.null in
  let link =
    new_of pdfjs_viewer_ns "PDFLinkService"
      (jso
         [ "eventBus", bus
         ; "externalLinkTarget", Js.Json.number 2. ])
  in
  let finder =
    new_of pdfjs_viewer_ns "PDFFindController"
      (jso [ "linkService", link; "eventBus", bus ])
  in
  let viewer : S.viewer =
    new_of pdfjs_viewer_ns "PDFViewer"
      (jso
         [ "container", el
         ; "eventBus", bus
         ; "linkService", link
         ; "findController", finder
         ; "textLayerMode", Js.Json.number 2.
         ; "annotationMode", Js.Json.number 2.
         ; "removePageBorders", Js.Json.boolean true ])
  in
  U.set_group_identity viewer m.identity;
  U.set_in_system_window viewer false;
  let set_docs : Js.Json.t -> Js.Json.t -> Js.Json.t -> unit =
    [%mel.raw
    "function (l, d, v) { l.setDocument(d); l.setViewer(v);
        v.setDocument(d) }"]
  in
  set_docs link pdf_doc viewer;
  m.doc <- Some pdf_doc;
  m.viewer <- Some viewer;
  S.active_viewer := Some viewer;
  set_active_viewer (Some viewer);
  (viewer, bus)

(* cljs event-bus wiring: pagesinit -> initial scale + ready; resizing
   re-pins "auto"; ls-update-extra-state + scaleChanging persist the
   last-visit extra state *)
let wire_bus ~(bus : Js.Json.t) ~(viewer : S.viewer)
    ~(initial_scale : string) ~(on_page_ready : unit -> unit) : unit =
  U.bus_on bus "pagesinit" (fun _ ->
      U.set_scale_value viewer
        (if initial_scale = "" then "auto" else initial_scale);
      on_page_ready ());
  U.bus_on bus "resizing" (fun _ ->
      match U.scale_value viewer with
      | Some "auto" -> U.set_scale_value viewer "auto"
      | _ -> ());
  let push_extra data =
    match !S.current with
    | Some a -> set_hls_extra a data
    | None -> ()
  in
  U.bus_on bus "ls-update-extra-state" push_extra;
  U.bus_on bus "scaleChanging" (fun data ->
      (match U.json_f data "scale" with
       | Some s -> U.set_scale_value viewer (Printf.sprintf "%g" s)
       | None -> (
           match U.json_s data "scale" with
           | Some s -> U.set_scale_value viewer s
           | None -> ()));
      push_extra data)

(* cljs pdf-resizer — interact.draggable handle writes
   --ph-view-container-width + container width 20-80vw *)
let mount_resizer (m : mount) (parent : D.el) (viewer : S.viewer) :
    unit =
  let el = Web_dom.create_element "span" in
  Web_dom.el_set_class el "extensions__pdf-resizer";
  Web_dom.el_append_child parent el;
  let adjust width =
    Web_dom.doc_style_set_property "--ph-view-container-width" width;
    U.adjust_viewer_size viewer
  in
  match
    U.interact_draggable_resizer ~el
      ~on_move:(fun offset ->
        let vw =
          Float.min
            (Float.max (offset /. Web_dom.doc_client_width *. 100.) 20.)
            80.
        in
        let width = Printf.sprintf "%gvw" vw in
        (match
           Web_dom.el_query D.document_el
             ("#pdf-layout-container_" ^ m.identity)
         with
         | Some target -> Web_dom.el_style_set_property target "width" width
         | None -> ());
        adjust width)
      ~on_start:(fun () -> Web_dom.doc_add_class "is-resizing-buf")
      ~on_end:(fun () -> Web_dom.doc_rm_class "is-resizing-buf")
  with
  | Some it -> m.interactables <- it :: m.interactables
  | None -> ()

(* cljs pdf-highlight-finder — armed ref-hl scrolls into view once the
   viewer exists (500ms first open); a 1s timer disarms it *)
let apply_ref_hl (viewer : S.viewer) : unit =
  match !S.ref_hl with
  | None -> ()
  | Some hl ->
      ignore
        (Web_dom.set_timeout_id
           (fun () ->
             match hl.Model.hl_id with
             | Some _ -> U.scroll_to_highlight viewer hl
             | None ->
                 U.set_current_page viewer
                   (if hl.hl_page > 0 then hl.hl_page else 1))
           500);
      ignore (Web_dom.set_timeout_id (fun () -> S.ref_hl := None) 1000)

(* cljs pdf-viewer render: cnt > viewer(.pdfViewer + .pp-holder) +
   resizer + toolbar; highlights attach after pagesinit *)
let mount_viewer (m : mount) (loader : D.el) (pdf_doc : Js.Json.t)
    ~(initial_hls : Model.hl list) ~(initial_page : int)
    ~(initial_scale : string) : unit =
  Web_dom.el_set_inner_html loader "";
  let cnt = Web_dom.create_element "div" in
  Web_dom.el_set_class cnt "extensions__pdf-viewer-cnt visible-scrollbar";
  let vel = Web_dom.create_element "div" in
  Web_dom.el_set_class vel "extensions__pdf-viewer overflow-x-auto absolute";
  if S.area_dashed () then Web_dom.el_class_add vel "is-area-dashed";
  let pv = Web_dom.create_element "div" in
  Web_dom.el_set_class pv "pdfViewer";
  Web_dom.el_append_child vel pv;
  let holder = Web_dom.create_element "div" in
  Web_dom.el_set_class holder "pp-holder";
  Web_dom.el_append_child vel holder;
  Web_dom.el_append_child cnt vel;
  Web_dom.el_append_child loader cnt;
  let viewer, bus = boot_viewer m vel pdf_doc in
  S.hls := initial_hls;
  U.bus_on bus "textlayerrendered" (fun ev ->
      match U.json_f ev "pageNumber" with
      | Some p ->
          Pdf_hls.render_page ~viewer ~page:(int_of_float p)
      | None -> ());
  wire_bus ~bus ~viewer ~initial_scale
    ~on_page_ready:(fun () ->
      Pdf_hls.install ~viewer ~el:vel ~holder);
  (* cljs: initial page applied 16ms after viewer construction *)
  ignore
    (Web_dom.set_timeout_id
       (fun () -> U.set_current_page viewer initial_page)
       16);
  mount_resizer m cnt viewer;
  Pdf_toolbar.mount ~viewer ~parent:cnt ~bus;
  apply_ref_hl viewer

(* cljs pdf-loader: hls data + getDocument in parallel; error dispatch
   on error.name; PasswordException opens the prompt and retries *)
let rec load (m : mount) (loader : D.el) (asset : Model.pdf_asset)
    ~(password : string) : unit =
  let gen = m.generation in
  ignore
    ((let* (hls, page, scale), doc =
        Js.Promise.all2
          (Pdf_assets.load_hls_data asset,
           get_doc ~url:asset.pdf_url ~password)
      in
      if m.generation = gen then
        mount_viewer m loader doc ~initial_hls:hls
          ~initial_page:(Option.value page ~default:1)
          ~initial_scale:scale;
      Js.Promise.resolve ())
     |> Js.Promise.catch (fun err ->
            if m.generation = gen then
              handle_load_error m loader asset err;
            Js.Promise.resolve ()))

and handle_load_error (m : mount) (loader : D.el)
    (asset : Model.pdf_asset) (err : Js.Promise.error) : unit =
  let err : Js.Json.t = Platform.error_inner err in
  match U.err_name err with
  | "MissingPDFException" ->
      Toast.error
        (I18n.sub (I18n.t "pdf/missing-file-error")
           [ U.err_message err ]);
      S.set_current None
  | "InvalidPDFException" ->
      Toast.error
        (I18n.sub (I18n.t "pdf/corrupted-file-error")
           [ U.err_message err ]);
      S.set_current None
  | "PasswordException" ->
      ask_password ~on_submit:(fun pw -> load m loader asset ~password:pw)
  | _ -> (
      match asset.pdf_block_external_url with
      | Some ext when Str_util.starts_with ext "http://" || Str_util.starts_with ext "https://"
        ->
          location_open ext;
          S.set_current None
      | _ ->
          Toast.error
            (I18n.sub (I18n.t "pdf/generic-error")
               [ U.err_name err; U.err_message err ]);
          S.set_current None)

(* cljs pdf-container: .extensions__pdf-container#pdf-layout-container_<id>
   inside #app-single-container; 100ms delay before the loader mounts *)
let mount_container (asset : Model.pdf_asset) : unit =
  teardown ();
  match Web_dom.el_query D.document_el "#app-single-container" with
  | None -> ()
  | Some host ->
      Web_dom.body_add_class "is-pdf-active";
      let el = Web_dom.create_element "div" in
      Web_dom.el_set_class el "extensions__pdf-container";
      Web_dom.el_set_attr el "id" ("pdf-layout-container_" ^ asset.pdf_identity);
      Web_dom.el_dataset_set el "theme" (S.viewer_theme ());
      Web_dom.el_append_child host el;
      let m =
        { identity = asset.pdf_identity
        ; container = el
        ; doc = None
        ; viewer = None
        ; interactables = []
        ; generation = 0 }
      in
      current_mount := Some m;
      ignore
        (Web_dom.set_timeout_id
           (fun () ->
             match !current_mount with
             | Some mm when mm == m -> (
                 m.generation <- m.generation + 1;
                 let loader = Web_dom.create_element "div" in
                 Web_dom.el_set_class loader "extensions__pdf-loader";
                 Web_dom.el_append_child el loader;
                 load m loader asset ~password:"")
             | _ -> ())
           100)

(* ---------- install: hook open/close into Pdf_state ---------- *)

let on_current_change (asset : Model.pdf_asset option) : unit =
  match asset with
  | Some a -> mount_container a
  | None -> teardown ()

let install () : unit =
  S.open_request := on_current_change;
  S.create_today_journal :=
    (fun () ->
      let* _ = Graph.create_today_journal (Runtime.repo ()) in
      Js.Promise.resolve ())
