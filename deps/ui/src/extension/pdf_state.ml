(* Shared pdf viewer state — cljs :pdf/current, :pdf/ref-highlight and the
   atoms shared between core.cljs and toolbar.cljs. The viewer itself is
   imperative: pdf.ml boots pdfjs machinery into a container that lives
   outside the LUI reconcile tree (portal into #app-single-container). *)

(* pdfjs viewer object — a JS object handle *)
type viewer = Js.Json.t

(* the open pdf asset (cljs :pdf/current) *)
let current : Model.pdf_asset option ref = ref None

(* cljs set-current-pdf! fires the React effect that boots the viewer —
   pdf.ml installs this hook so feature modules can request an open
   without depending on the viewer module *)
let open_request : (Model.pdf_asset option -> unit) ref =
  ref (fun _ -> ())

(* saving an area png may need today's journal page — hooked by pdf.ml
   to Graph.create_today_journal so pdf_assets stays below the app
   layer *)
let create_today_journal : (unit -> unit Js.Promise.t) ref =
  ref (fun () -> Js.Promise.resolve ())

(* cljs set-current-pdf!: same identity is a no-op; a different pdf
   settles through nil (unmount) first — imperative teardown handles the
   swap inline so the 16ms defer isn't needed *)
let set_current (a : Model.pdf_asset option) =
  let same =
    match !current, a with
    | Some c, Some n -> c.Model.pdf_identity = n.Model.pdf_identity
    | None, None -> true
    | _ -> false
  in
  if not same then begin
    current := a;
    !open_request a
  end

(* block ref click armed a scroll target for the next/current viewer *)
let ref_hl : Model.hl option ref = ref None

(* the live pdfjs viewer (cljs window.lsActivePdfViewer mirrors this) *)
let active_viewer : viewer option ref = ref None

(* per-identity loaded highlights — cljs use-state in pdf-highlights *)
let hls : Model.hl list ref = ref []

let set_hls xs = hls := xs

(* toolbar atoms (cljs *area-mode? *highlight-mode? *area-dashed?
   *highlight-last-color) *)
let area_mode = ref false

let highlight_mode = ref false

let last_color = ref "yellow"

(* ---- storage-backed flags (cljs ls-* keys) ---- *)

let storage_bool key ~default =
  match Ui_services.storage_get key with
  | Some "false" | Some "0" -> false
  | Some _ -> true
  | None -> default

let storage_set key v =
  Ui_services.storage_set key (if v then "true" else "false")

let area_dashed () = storage_bool "ls-pdf-area-is-dashed" ~default:false

let set_area_dashed v = storage_set "ls-pdf-area-is-dashed" v

let hl_colored () = storage_bool "ls-pdf-hl-block-is-colored" ~default:true

let set_hl_colored v =
  storage_set "ls-pdf-hl-block-is-colored" v;
  (* .theme-container-inner carries ls-hl-colored — flip it live; the
     class_signal recomputes from storage on the next publish too *)
  (match Ui_services.dom_query ".theme-container-inner" with
   | Some el ->
       if v then el.Ui_services.add_class "ls-hl-colored"
       else el.Ui_services.remove_class "ls-hl-colored"
   | None -> ())

(* cljs state.cljs: `(not= false (storage/get "ls-pdf-auto-open-ctx-menu"))`
   — unset storage means ON, only a stored false disables *)
let auto_open_ctx () =
  storage_bool "ls-pdf-auto-open-ctx-menu" ~default:true

let set_auto_open_ctx v = storage_set "ls-pdf-auto-open-ctx-menu" v

(* cljs storage key "ls-pdf-viewer-theme" — "" | "light" | "warm" | "dark" *)
let viewer_theme () =
  Option.value (Ui_services.storage_get "ls-pdf-viewer-theme")
    ~default:""

let set_viewer_theme t =
  Ui_services.storage_set "ls-pdf-viewer-theme" t;
  match !current with
  | Some a -> (
      match
        Ui_services.dom_query ("#pdf-layout-container_" ^ a.Model.pdf_identity)
      with
      | Some el -> el.Ui_services.set_attr "data-theme" t
      | None -> ())
  | None -> ()

(* last-visit scale is per pdf block (cljs pdf-last-visit-scale/<db-id>) *)
let last_scale_key db_id = "pdf-last-visit-scale/" ^ string_of_int db_id

let stored_scale db_id =
  Option.value
    (Ui_services.storage_get (last_scale_key db_id))
    ~default:"auto"

let set_stored_scale db_id s =
  Ui_services.storage_set (last_scale_key db_id)
    (if s = "" then "auto" else s)

(* interact.js handles live on hls-region elements inside removed
   layers — collected so teardown can unset them *)
let hls_interactables : Js.Json.t list ref = ref []
