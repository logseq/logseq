(* App chrome — mirrors components/container.cljs shell:

   <main#app-container-wrapper.theme-container-inner>
     <button#skip-to-main>
     <div#app-container>
       <div#left-container>
         <header#head .cp__header> ... nav buttons ... </header>
         <div#main-container .cp__sidebar-main-layout>
           <div#main-content-container .scrollbar-spacing>
             <div .cp__sidebar-main-content> [page] </div>
           </div>
         </div>
       </div>
     </div>
   </main>
*)

open Lui_elements

module Wd = Web_dom


let skip_to_main =
  button ~key:"skip" ~accessibility_identifier:"skip-to-main"
    ~text:(I18n.t "nav/skip-to-main-content") []

(* cljs shui/button :ghost :size :sm — semantic classes only; the button
   kind's ~variant:`ghost ~size:`icon carries the layout bundle that the
   tailwind classes used to paint *)
let ghost_btn_cls ?(mid = "") ?(tail = "") () =
  "ui__button as-ghost " ^ mid ^ tail

(* TODO(component): data-tooltip/data-tooltip-keys have no typed-prop
   equivalent; ~label lands as aria-label, which popups/tooltip.ml also
   matches — the ⌘K keycap row is lost for these buttons *)
let icon_btn ?tip ~key ~id ~cls ~icon ~on_click () =
  button ~key ~variant:`ghost ~size:`icon
    ?accessibility_identifier:(if id = "" then None else Some id)
    ?label:tip ~style_class:cls ~icon:(Icons.name_ref icon)
    ~on_press:(fun _ -> on_click None) []

(* cljs header.cljs with-shortcut :go/search — title + ⌘K keycap *)
let search_button =
  icon_btn ~key:"search-btn" ~id:"search-button" ~cls:(ghost_btn_cls ())
    ~icon:"search" ~tip:(I18n.t "nav/search")
    ~on_click:(fun _ -> Runtime.send Action.Toggle_search) ()

(* cljs ui/tooltip (t :header/more) — .toolbar-dots-btn stays the
   imperative query_selector anchor for the dropdown position *)
let dots_button =
  button ~key:"dots-btn" ~variant:`ghost ~size:`icon
    ~style_class:(ghost_btn_cls ~tail:"toolbar-dots-btn" ())
    ~label:(I18n.t "header/more") ~icon:(`app "dots")
    ~on_press:(fun _ ->
      (* cljs anchors the dropdown to the trigger's right edge, not
         the click position *)
      match Web_dom.query_selector ".toolbar-dots-btn" with
      | Some el ->
          let r = Web_dom.el_bounding_rect el in
          Runtime.send
            (Action.Page_menu_set
               (Some
                  ( Web_dom.rect_right r
                  , Web_dom.rect_bottom r +. 4.
                  , true
                  , None )))
      | None -> ())
    []

(* components/rtc/indicator.cljs — cloud status button + hidden rtc-tx
   element the e2e reads EDN from. Visible once the worker broadcasts
   rtc-sync-state (i.e. sync is running on the current graph). *)
let rtc_tx_text (r : Model.rtc) =
  let tx = function Some n -> string_of_int n | None -> "nil" in
  Printf.sprintf "{:local-tx %s, :remote-tx %s}"
    (tx r.rtc_local_tx) (tx r.rtc_remote_tx)

(* cljs header.cljs rtc-indicator-visible? — the indicator shows when
   the open repo is a remote/rtc graph: logged in, rtc-group, and the
   graph's rtc uuid known (db-rtc-uuid) or sync already broadcasting
   state. The uuid resolution lives in Rtc_flows (shared with
   Collaborators) *)
let last_rtc : Model.rtc option ref = ref None

(* cljs indicator.cljs details — dropdown under the cloud button:
   online/offline, pending counts, last-synced, debug toggle and a
   Start sync action when the lock isn't open *)
let rtc_details_popup : Wd.el option ref = ref None

let close_rtc_details () =
  match !rtc_details_popup with
  | Some el ->
      Wd.el_remove el;
      rtc_details_popup := None
  | None -> ()

let el_ ?(cls = "") ?(text = "") () =
  let d = Wd.create_element "div" in
  Wd.el_set_class d cls;
  if text <> "" then Wd.el_set_text_content d text;
  d

let pend_row cls_key n =
  let d = el_ () in
  let s = Wd.create_element "span" in
  Wd.el_set_class s "font-medium mr-1";
  Wd.el_set_text_content s (string_of_int n);
  let l = Wd.create_element "span" in
  Wd.el_set_text_content l (I18n.t cls_key);
  Wd.el_append_child d s;
  Wd.el_append_child d l;
  d

let rtc_debug_text (r : Model.rtc option) =
  let lock =
    match r with Some r -> if r.rtc_lock then ":open" else ":close"
    | None -> ":close"
  in
  let num f = match r with Some r -> string_of_int (f r) | None -> "0" in
  Printf.sprintf
    "{:pending-local-ops %s\n :pending-asset-ops %s\n :pending-server-ops \
     %s\n :local-tx %s\n :remote-tx %s\n :rtc-state %s}"
    (num (fun r -> r.rtc_pending_local))
    (num (fun r -> r.rtc_pending_asset))
    (num (fun r -> r.rtc_pending_server))
    (match r with
     | Some r -> (
         match r.rtc_local_tx with
         | Some n -> string_of_int n
         | None -> "nil")
     | None -> "nil")
    (match r with
     | Some r -> (
         match r.rtc_remote_tx with
         | Some n -> string_of_int n
         | None -> "nil")
     | None -> "nil")
    lock

external ev_target : Js.Json.t -> Js.Json.t = "target" [@@mel.get]

external el_contains : Wd.el -> Js.Json.t -> bool = "contains"
  [@@mel.send]

external ev_key : Js.Json.t -> string = "key" [@@mel.get]

(* tabler alert-triangle glyph — cljs ui/icon inside the
   missing-asset-files rows *)
let alert_triangle_svg () =
  let s = Web_dom.create_element "span" in
  Web_dom.el_set_inner_html s
    "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" \
     height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" \
     stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" \
     stroke-linejoin=\"round\" class=\"tabler-icon \
     tabler-icon-alert-triangle \"><path d=\"M12 9v4\"/><path \
     d=\"M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 \
     1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z\"\
     /><path d=\"M12 16h.01\"/></svg>";
  s

(* cljs missing-asset-files: <details.assets-missing-files> listing the
   files waiting for an upload *)
let missing_files_details (files : string list) =
  let det = Web_dom.create_element "details" in
  Web_dom.el_set_class det "assets-missing-files";
  let sum = Web_dom.create_element "summary" in
  Web_dom.el_set_text_content sum
    (I18n.t1 "sync/missing-asset-files-count"
       (string_of_int (List.length files)));
  Web_dom.el_append_child det sum;
  let inner = Web_dom.create_element "div" in
  Web_dom.el_set_class inner "flex flex-col gap-1 text-sm";
  List.iter
    (fun f ->
      let row = Web_dom.create_element "div" in
      Web_dom.el_set_class row "flex flex-row gap-1 items-center";
      Web_dom.el_append_child row (alert_triangle_svg ());
      let sp = Web_dom.create_element "span" in
      Web_dom.el_set_class sp "truncate";
      Web_dom.el_set_text_content sp f;
      Web_dom.el_append_child row sp;
      Web_dom.el_append_child inner row)
    files;
  Web_dom.el_append_child det inner;
  det

(* cljs assets-progressing rows resolve block titles via <get-blocks;
   fill each title span when the worker answers *)
let enrich_asset_title (sp : Web_dom.el) (repo : string) (asset_id : string) =
  ignore
    (let open Promise_ext in
    let* w =
      Runtime.invoke2 "thread-api/get-blocks" (Wire.String repo)
        (Wire.List
           [ Wire.Map
               [ (Wire.Keyword "id", Wire.String asset_id)
               ; ( Wire.Keyword "opts"
                 , Wire.Map [ (Wire.Keyword "children?", Wire.Bool false) ] )
               ]
           ])
    in
    (match w with
     | Wire.Array items | Wire.List items ->
         List.iter
           (fun item ->
             match Wire.get item "block" with
             | Some b -> (
                 match Wire.map_get_string b "block/title" with
                 | Some t when t <> "" -> Web_dom.el_set_text_content sp t
                 | _ -> ())
             | _ -> ())
           items
     | _ -> ());
    Js.Promise.resolve ())

(* one-shot guards: the same click that opened the menu bubbles up to
   document, and the doc listeners themselves can't be unbound *)
let rtc_doc_hooked = ref false
let rtc_open_guard = ref false

let hook_rtc_doc_close () =
  if not !rtc_doc_hooked then (
    rtc_doc_hooked := true;
    Wd.on_document_event "click" (fun ev ->
        match !rtc_details_popup with
        | Some el
          when (not !rtc_open_guard) && not (el_contains el (ev_target ev))
          -> close_rtc_details ()
        | _ -> ());
    Wd.on_document_event "keydown" (fun ev ->
        if ev_key ev = "Escape" && !rtc_details_popup <> None then
          close_rtc_details ()))

let open_rtc_details () =
  close_rtc_details ();
  hook_rtc_doc_close ();
  rtc_open_guard := true;
  ignore (Wd.set_timeout (fun () -> rtc_open_guard := false) 0);
  let r = !last_rtc in
  let open_ =
    match r with
    | Some r -> Platform.online () && r.rtc_lock
    | None -> false
  in
  let menu = Wd.create_element "div" in
  Wd.el_set_class menu
    "ui__dropdown-menu-content z-50 min-w-[8rem] rounded-md border \
     bg-popover p-1 text-popover-foreground shadow-md";
  Wd.el_set_attr menu "role" "menu";
  (match Wd.query_selector ".cp__rtc-sync-indicator .cloud" with
   | Some anchor ->
       let rect = Wd.el_bounding_rect anchor in
       let left = Float.max 8.0 (Wd.rect_right rect -. 240.0) in
       Wd.el_set_attr menu "style"
         (Printf.sprintf
            "position:fixed;left:%.0fpx;top:%.0fpx;width:240px"
            left (Wd.rect_bottom rect +. 4.0))
   | None -> ());
  let info = el_ ~cls:"rtc-info flex flex-col gap-1 p-2 text-gray-11" () in
  Wd.el_append_child info
    (el_ ~cls:"font-medium mb-2"
       ~text:(I18n.t (if Platform.online () then "sync/online" else "sync/offline"))
       ());
  let p_local =
    match r with Some r -> r.rtc_pending_local | None -> 0
  and p_asset =
    match r with Some r -> r.rtc_pending_asset | None -> 0
  and p_server =
    match r with Some r -> r.rtc_pending_server | None -> 0
  in
  (* cljs asset-status-rows: missing files, remaining pending uploads,
     live upload/download transfers — each row only while positive *)
  let missing_files =
    match r with Some r -> r.rtc_missing_files | None -> []
  in
  let missing_count = List.length missing_files in
  let p_upload = max 0 (p_asset - missing_count) in
  let n_up, n_down =
    match (Runtime.model ()).Model.repo with
    | Some repo -> Asset_progress.transfer_counts repo
    | None -> (0, 0)
  in
  Web_dom.el_append_child info (pend_row "sync/pending-local-changes" p_local);
  if missing_count > 0 then
    Web_dom.el_append_child info (pend_row "sync/missing-asset-files" missing_count);
  if p_upload > 0 then
    Web_dom.el_append_child info (pend_row "sync/pending-asset-uploads" p_upload);
  if n_up > 0 then
    Web_dom.el_append_child info (pend_row "sync/assets-uploading" n_up);
  if n_down > 0 then
    Web_dom.el_append_child info (pend_row "sync/assets-downloading" n_down);
  Web_dom.el_append_child info (pend_row "sync/pending-server-changes" p_server);
  if missing_files <> [] then
    Web_dom.el_append_child info (missing_files_details missing_files);
  (* cljs assets-progressing: <details> per direction with
     percent + block title *)
  let in_flight =
    match (Runtime.model ()).Model.repo with
    | Some repo -> Asset_progress.in_flight repo
    | None -> []
  in
  if in_flight <> [] then begin
    let wrap = Web_dom.create_element "div" in
    Web_dom.el_set_class wrap "assets-sync-progress flex flex-col gap-2";
    List.iter
      (fun (dir, label_key) ->
        let rows =
          List.filter
            (fun (p : Asset_progress.t) ->
              p.ap_direction = dir)
            in_flight
        in
        if rows <> [] then begin
          let det = Web_dom.create_element "details" in
          let sum = Web_dom.create_element "summary" in
          Web_dom.el_set_text_content sum
            (I18n.t1 label_key (string_of_int (List.length rows)));
          Web_dom.el_append_child det sum;
          let inner = Web_dom.create_element "div" in
          Web_dom.el_set_class inner "flex flex-col gap-1 text-sm";
          List.iter
            (fun (p : Asset_progress.t) ->
              let row = Web_dom.create_element "div" in
              Web_dom.el_set_class row "flex flex-row gap-1 items-center";
              let pct = Web_dom.create_element "span" in
              Web_dom.el_set_class pct "indicator-progress-pie";
              Web_dom.el_set_text_content pct
                (string_of_int
                   (int_of_float
                      (100.0 *. Float.of_int p.ap_loaded
                      /. Float.of_int p.ap_total))
                ^ "%");
              Web_dom.el_append_child row pct;
              let sp = Web_dom.create_element "span" in
              Web_dom.el_set_class sp "truncate";
              Web_dom.el_set_text_content sp p.ap_id;
              (match (Runtime.model ()).Model.repo with
               | Some repo -> enrich_asset_title sp repo p.ap_id
               | None -> ());
              Web_dom.el_append_child row sp;
              Web_dom.el_append_child inner row)
            rows;
          Web_dom.el_append_child det inner;
          Web_dom.el_append_child wrap det
        end)
      [ ("download", "sync/assets-downloading-count")
      ; ("upload", "sync/assets-uploading-count") ];
    Web_dom.el_append_child info wrap
  end;
  (match !Rtc_flows.last_sync_ms with
   | Some ms ->
       Wd.el_append_child info
         (el_ ~cls:"text-sm"
            ~text:
              (I18n.t1 "sync/last-synced-time-label"
                 (Platform.fmt_time (Int64.to_float ms)))
            ())
   | None -> ());
  (* More debug info toggle *)
  let dbg_link = Wd.create_element "a" in
  Wd.el_set_class dbg_link "fade-link text-sm";
  Wd.el_set_text_content dbg_link (I18n.t "sync/more-debug-info");
  let dbg_on = ref false in
  let dbg_el = ref (Wd.create_element "div") in
  Wd.el_append_child info dbg_link;
  Wd.el_on dbg_link "click" (fun _ ->
      dbg_on := not !dbg_on;
      if !dbg_on then (
        let d = el_ ~cls:"rtc-info-debug" () in
        let pre = Wd.create_element "pre" in
        Wd.el_set_class pre "select-text";
        Wd.el_set_text_content pre (rtc_debug_text r);
        Wd.el_append_child d pre;
        dbg_el := d;
        Wd.el_append_child info d)
      else Wd.el_remove !dbg_el);
  (match Wd.query_selector "body" with Some b -> Wd.el_append_child b menu | None -> ());
  (* Start sync (cljs: shown when rtc-state <> :open) *)
  if not open_ then (
    let row = el_ ~cls:"mt-4" () in
    let btn = Wd.create_element "button" in
    Wd.el_set_class btn
      (Settings_controls.btn_cls ~variant:`Solid ~size:`Sm ());
    Wd.el_set_attr btn "type" "button";
    Wd.el_set_text_content btn (I18n.t "sync/start-sync");
    Wd.el_on btn "click" (fun _ ->
        close_rtc_details ();
        match (Runtime.model ()).Model.repo with
        | Some repo -> Rtc_ops.start repo
        | None -> ());
    Wd.el_append_child row btn;
    Wd.el_append_child info row);
  Wd.el_append_child menu info;
  rtc_details_popup := Some menu

let toggle_rtc_details () =
  match !rtc_details_popup with
  | Some _ -> close_rtc_details ()
  | None -> open_rtc_details ()

let rtc_indicator (ms : Model.t Signal.signal) : t =
  reactive
    (fun ((repo : string option), (r : Model.rtc option)) ->
      Rtc_flows.refresh_db_rtc_uuid repo;
      last_rtc := r;
      let visible =
        (Rtc_flows.logged_in () && Rtc_flows.rtc_group ()
        && repo <> None
        && (!Rtc_flows.db_rtc_uuid <> None || r <> None))
        || (Platform.rtc_test_mode () && repo <> None)
      in
      if not visible then
        spacer ~key:"rtc-off" ~style_class:"hidden" []
      else (
        let open_ =
          Platform.online ()
          && (match r with Some r -> r.rtc_lock | None -> false)
        in
        let syncing =
          open_
          && (match r with Some r -> r.rtc_pending_server > 0
              | None -> false)
        in
        let idle =
          open_
          && (match r with
             | Some r ->
                 r.rtc_pending_local = 0 && r.rtc_pending_asset = 0
                 && r.rtc_pending_server = 0
             | None -> true)
        in
        let queuing =
          match r with
          | Some r -> r.rtc_pending_local > 0 || r.rtc_pending_asset > 0
          | None -> false
        in
        let cls =
          ghost_btn_cls ()
          ^ "cloud"
          ^ (if open_ then " on" else "")
          ^ (if syncing then " syncing" else "")
          ^ (if idle then " idle" else "")
          ^ (if queuing then " queuing" else "")
        in
        (* TODO(component): e2e reads [data-testid="rtc-tx"]; the kind
           layer emits it as the id attr via accessibility_identifier
           (#rtc-tx) — selector needs updating or kept in sync *)
        box ~key:"rtc" ~style_class:"cp__rtc-sync"
          [ box ~key:"rtc-tx" ~style_class:"hidden"
              ~accessibility_identifier:"rtc-tx"
              [ (match r with
                 | Some r -> text ~key:"rtc-tx-v" ~value:(rtc_tx_text r) []
                 | None -> spacer ~key:"rtc-tx-v" []) ]
          ; row ~key:"rtc-ind" ~cross:`center ~gap:4
              ~style_class:"cp__rtc-sync-indicator"
              [ button ~key:"rtc-btn" ~variant:`ghost ~size:`icon
                  ~style_class:cls ~label:"rtc sync"
                  ~icon:(`app "cloud")
                  ~on_press:(fun _ -> toggle_rtc_details ())
                  []
              ]
          ]))
    (Signal.map (fun (m : Model.t) -> (m.repo, m.rtc)) ms)

(* cljs indicator.cljs downloading-detail / uploading-detail — ghost
   buttons visible while the latest rtc.log download|upload entry's
   sub-type isn't *-completed; gated on logged-in only (header.cljs) *)
let transfer_detail_widget ~downloading (ms : Model.t Signal.signal) : t
    =
  reactive
    (fun (active : bool) ->
      if not (Rtc_flows.logged_in () && active) then
        spacer ~key:"td-off" ~style_class:"hidden" []
      else
        button ~key:"td" ~variant:`ghost
          ~style_class:"ui__button as-ghost opacity-50"
          ~text:
            (I18n.t
               (if downloading then "sync/downloading"
                else "sync/uploading"))
          [])
    (Signal.map
       (fun (m : Model.t) ->
         if downloading then m.rtc_downloading else m.rtc_uploading)
       ms)

(* cljs header.cljs local-graph-sync-button — cloud ghost button that
   uploads the open local graph to the sync server. Visible when the
   current repo is a local (non-remote, non-rtc) graph and the user is
   logged in + rtc-group. The rtc-graph-uuid lookup is async, same as
   cljs use-db-rtc-uuid (the button can flash on a remote graph until
   the uuid resolves — cljs has the same window) *)
let local_graph_sync_button (ms : Model.t Signal.signal) : t =
  reactive
    (fun ((repo : string option), (repos : string list), (_rtc : Model.rtc option)) ->
      (* m.rtc joins the input so the db-sync-start broadcast after an
         upload re-renders — refresh_db_rtc_uuid then resolves the new
         uuid and hides the button *)
      Rtc_flows.refresh_db_rtc_uuid repo;
      let uploadable =
        match repo with
        | Some r ->
            Rtc_flows.logged_in () && Rtc_flows.rtc_group ()
            && List.mem r repos
            && !Rtc_flows.db_rtc_uuid = None
        | None -> false
      in
      if uploadable then
        (* the title attr has no typed-prop equivalent — ~label covers
           the a11y name and feeds the tooltip layer *)
        button ~key:"lgs" ~variant:`ghost ~size:`icon
          ~style_class:(ghost_btn_cls ~tail:"local-graph-sync-btn" ())
          ~label:(I18n.t "graph/use-sync-beta") ~icon:(`app "cloud")
          ~on_press:(fun _ ->
            match (Runtime.model ()).Model.repo with
            | Some r -> Graphs_ops.ask_upload r
            | None -> ())
          []
      else spacer ~key:"lgs-off" ~style_class:"hidden" [])
    (Signal.map (fun (m : Model.t) -> (m.repo, m.repos, m.rtc)) ms)

(* cljs components/svg.cljs loader-fn — the ui/loading spinner
   (.lui-spinner default is size-5 = the old w-5 h-5 animate-spin svg) *)
let loader_svg : t = spinner ~key:"ldr" []

(* cljs header.cljs search-index-progress — renders while the worker
   reports its FTS index build for the current repo *)
let index_progress (ms : Model.t Signal.signal) : t =
  reactive
    ~equal:(fun (a : Model.t) (b : Model.t) ->
      a.index_build = b.index_build)
    (fun (m : Model.t) ->
      let ib = m.Model.index_build in
      if
        (ib.ib_visible || ib.ib_running) && m.repo = Some ib.ib_repo
      then
        (* the progress kind emits the fill via --lui-progress-position;
           the __bar class keeps the chip's track sizing on web *)
        row ~key:"sip" ~cross:`center ~style_class:"search-index-progress"
          [ box ~key:"sip-l" ~style_class:"icon-loading"
              [ box ~key:"sip-i" ~style_class:"icon" [ loader_svg ] ]
          ; text ~key:"sip-t"
              ~style_class:"search-index-progress__text"
              ~value:
                (I18n.tf "search/index-progress"
                   [ string_of_int ib.ib_progress ])
              []
          ; progress ~key:"sip-b"
              ~style_class:"search-index-progress__bar"
              ~value:(Float.of_int ib.ib_progress /. 100.0)
              []
          ]
      else spacer ~key:"sip-none" [])
    ms

(* cljs header.cljs with-shortcut :ui/toggle-left-sidebar *)
let left_menu_button =
  icon_btn ~key:"left-menu-btn" ~id:"left-menu"
    ~cls:(ghost_btn_cls ~mid:"cp__header-left-menu" ())
    ~icon:"menu-2" ~tip:(I18n.t "header/toggle-left-sidebar")
    ~on_click:(fun _ -> Runtime.send Action.Toggle_left_sidebar) ()

(* cljs header.cljs: home button hidden on the :home route and on a
   custom home page *)
let home_button ms =
  reactive
    ~equal:(fun (a : Model.t) (b : Model.t) -> a.route = b.route)
    (fun (m : Model.t) ->
      match m.route with
      | Model.Home -> spacer ~key:"home-none" []
      | _ ->
          icon_btn ~key:"home-btn" ~id:"" ~cls:(ghost_btn_cls ())
            ~icon:"home" ~tip:(I18n.t "nav/home")
            ~on_click:(fun _ ->
              Platform.set_location_hash "#/";
              Web_dom.dispatch_custom "ls:navigate" Js.Json.null)
            ())
    ms

(* cljs open-right-sidebar! seeds a "contents" item when the sidebar
   is empty (state/sidebar-add-content-when-open!) *)
let right_toggle_button ms =
  icon_btn ~key:"rs-toggle" ~id:""
    ~cls:(ghost_btn_cls ~tail:"toggle-right-sidebar" ())
    ~icon:"layout-sidebar-right"
    ~tip:(I18n.t "command.ui/toggle-right-sidebar")
    ~on_click:(fun _ ->
      Runtime.send Action.Toggle_right_sidebar;
      Sidebar_state.ensure_contents (Sidebar_state.ensure ms))
    ()

let header (ms : Model.t Signal.signal) =
  (* TODO(component): cljs sets inline fontSize:50 on .cp__header —
     no typed-prop equivalent and the icon kind sizes itself, dropped *)
  row ~key:"head" ~accessibility_identifier:"head"
    ~style_class:"cp__header drag-region"
    ~main:`space_between ~cross:`center
    [ row ~key:"head-inner" ~cross:`center ~style_class:"l drag-region"
        [ left_menu_button; search_button ]
    ; row ~key:"head-r" ~grow:1. ~main:`space_between ~cross:`center
        ~gap:8 ~style_class:"r drag-region overflow-x-hidden"
        [ row ~key:"head-crumb" ~grow:1.
            [ reactive
                ~equal:(fun (a : Model.t) (b : Model.t) ->
                  (* only the zoomed-block trail renders here *)
                  Option.map
                    (fun (p : Model.page) ->
                      List.map
                        (fun (pb : Model.block) -> pb.Model.block_uuid)
                        p.Model.page_parents)
                    a.Model.route_page
                  = Option.map
                      (fun (p : Model.page) ->
                        List.map
                          (fun (pb : Model.block) -> pb.Model.block_uuid)
                          p.Model.page_parents)
                      b.Model.route_page)
                (fun (m : Model.t) ->
                  (* cljs header.cljs block-breadcrumb: ancestor trail in
                     the header only while zoomed into a block (the page
                     itself carries its own breadcrumb) *)
                  match m.Model.route_page with
                  | Some p when p.Model.page_parents <> [] ->
                      let item key ~href ~text =
                        link ~key ~style_class:"breadcrumb-item"
                          ~url:href ~text []
                      in
                      box ~key:"head-bc" ~style_class:"breadcrumb"
                        (List.mapi
                           (fun i (pb : Model.block) ->
                             item
                               ("hbc-" ^ string_of_int i)
                               ~href:
                                 ("#/block/"
                                 ^ Option.value pb.Model.block_uuid
                                     ~default:"")
                               ~text:pb.Model.block_title)
                           p.Model.page_parents
                        @ [ item "hbc-cur"
                              ~href:
                                ("#/block/"
                                ^ Option.value p.Model.page_uuid
                                    ~default:"")
                              ~text:p.Model.page_title ])
                  | _ -> spacer ~key:"head-bc-empty" [])
                ms ]
        ; row ~key:"head-acts" ~cross:`center
            [ (* cljs header.cljs: inside the same rtc-indicator-visible?
                 gate — collaborators then the cloud indicator *)
              Collaborators.widget ms
            ; rtc_indicator ms
            ; transfer_detail_widget ~downloading:true ms
            ; transfer_detail_widget ~downloading:false ms
            ; local_graph_sync_button ms
            ; index_progress ms
            ; home_button ms
            ; (* cljs header.cljs hook-ui-items :toolbar renders
                 .ui-items-container only when a plugin actually
                 contributes a toolbar item *)
              Left_sidebar_view.plugins_toolbar ms
            ; dots_button; right_toggle_button ms ]
        ]
    ]

(* cljs right_sidebar.cljs: #right-sidebar.cp__right-sidebar.h-screen
   carries .open/.closed; only renders contents while open *)
let right_sidebar (ms : Model.t Signal.signal) =
  Ui_parts.class_signal ms
    (fun (m : Model.t) ->
      "cp__right-sidebar h-screen "
      ^ if m.right_sidebar_open then "open" else "closed")
    (box ~key:"right-sidebar" ~accessibility_identifier:"right-sidebar"
       ~style_class:"cp__right-sidebar h-screen closed"
       [ Right_sidebar_view.render ms ])

(* left_sidebar.cljs:570 — div#left-sidebar.cp__sidebar-left-layout
   holds .left-sidebar-inner (contents) + .shade-mask + .left-sidebar-
   resizer. #left-sidebar{display:none} on desktop keeps the overlay
   out of the click path when closed. *)
let left_sidebar (ms : Model.t Signal.signal) =
  Ui_parts.class_signal ms
    (fun (m : Model.t) ->
      "cp__sidebar-left-layout"
      ^ if m.left_sidebar_open then " is-open" else "")
    (box ~key:"left-sidebar" ~accessibility_identifier:"left-sidebar"
       ~style_class:"cp__sidebar-left-layout"
       [ column ~key:"ls-inner" ~grow:1. ~min_height:0
           ~style_class:"left-sidebar-inner as-container"
           [ box ~key:"ls-wrap" ~style_class:"wrap"
               [ box ~key:"ls-head" ~style_class:"sidebar-header-container"
                   [ Left_sidebar_view.header ms ]
               ; Left_sidebar_view.contents ms
               ]
           ]
       ; Ui_parts.pressable
           ~on_press:(fun _ -> Runtime.send Action.Toggle_left_sidebar)
           (box ~key:"shade" ~style_class:"shade-mask" [])
       ; box ~key:"resizer" ~style_class:"left-sidebar-resizer" []
       ])

let main_content (ms : Model.t Signal.signal) =
  Ui_parts.class_signal ms
    (fun (m : Model.t) ->
      "cp__sidebar-main-layout"
      ^ if m.left_sidebar_open then " is-left-sidebar-open" else "")
    (row ~key:"main-container" ~accessibility_identifier:"main-container"
       ~grow:1. ~style_class:"cp__sidebar-main-layout"
       [ left_sidebar ms
       ; (* data-is-margin-less-pages was always emitted "false" and its
            CSS only matches 'true' — dead attr, dropped *)
         scroll ~key:"main-content"
           ~accessibility_identifier:"main-content-container"
           ~orientation:`vertical ~main:`center
           ~style_class:"scrollbar-spacing relative"
           [ Ui_parts.class_signal ms
               (fun (m : Model.t) ->
                 (* cljs container.cljs: data-is-full-width on
                    all-pages/all-files/my-publishing routes — mirrored
                    as .is-full-width (stylesheet class; attrs have no
                    kind-level signal channel) *)
                 "cp__sidebar-main-content"
                 ^ (match m.route with
                    | Model.All_pages -> " is-full-width"
                    | _ -> ""))
               (column ~key:"main-inner" ~grow:1.
                  ~style_class:"cp__sidebar-main-content"
                  [ Ui_parts.class_signal ms
                      (fun (m : Model.t) ->
                        (* cljs container.cljs: div.mx-auto.pb-24 around
                           main-content; home/margin-less routes keep an
                           empty class + 0 margin *)
                        match m.route with
                        | Model.Journals | Model.Home ->
                            "cp__content-wrap cp__content-wrap--flush"
                        | _ -> "cp__content-wrap")
                      (box ~key:"content-wrap" [ Page.region ms ])
                  ])
           ]
       ])

(* Overlay layer — cmdk palette, popups (autocomplete/slash/context
   menus), dialogs and toasts mount here (single shared container;
   the keyed wrapper keeps these dynamic segments off #app-container's
   child list so nav-time reconciles can't tear down a freshly
   mounted overlay mid-batch). cljs mounts them via portals, which
   are their own container nodes anyway. *)
let overlays (ms : Model.t Signal.signal) =
  box ~key:"overlays" ~style_class:"cp__overlays"
    [ Cmdk_view.render ms
    ; Popups_view.render ms
    ; Left_sidebar_view.menus ms
    ; Dialogs_view.render ms
    ; Cards_view.render ms
    ; Toasts_view.render ms
    ; Properties_view.overlays
    ; reactive
        ~equal:(fun (a : Model.t) (b : Model.t) ->
          (* the menu reads only page scalars — comparing them skips the
             per-publish deep [=] on the whole route page record *)
          a.page_menu = b.page_menu && a.confirm = b.confirm
          && a.data_gen = b.data_gen
          && List.map
               (fun (p : Model.page) -> (p.page_uuid, p.page_journal_day))
               a.journals
             = List.map
                 (fun (p : Model.page) ->
                   (p.page_uuid, p.page_journal_day))
                 b.journals
          && Option.map
               (fun (p : Model.page) ->
                 ( p.page_uuid
                 , p.page_db_id
                 , p.page_is_tag
                 , p.page_internal
                 , p.page_built_in ))
               a.route_page
             = Option.map
                 (fun (p : Model.page) ->
                   ( p.page_uuid
                   , p.page_db_id
                   , p.page_is_tag
                   , p.page_internal
                   , p.page_built_in ))
                 b.route_page)
        (fun m -> Page_menu.dialog_view m)
        ms
    ; reactive
        ~equal:(fun (a : Model.t) (b : Model.t) ->
          a.appearance = b.appearance)
        (fun m ->
          match m.Model.appearance with
          | Some pos -> Settings_page.appearance_body pos
          | None -> spacer ~key:"app-none" [])
        ms
    ]

(* cljs container.cljs emits hidden <a> anchors used by export flows.
   TODO(component): export code finds these by getElementById, sets href
   and click()s them — a real hidden <a> is required; keep the dom until
   the export path moves to a typed download mechanism *)
let export_anchors : t =
  Logseq_dom.fragment
    (List.map
       (fun id ->
         Logseq_dom.dom ~key:("a-" ^ id) ~tag:"a" ~id
           ~style_class:"hidden" [])
       [ "download"; "download-as-edn-v2"; "download-as-json-v2"
       ; "download-as-transit-debug"; "download-as-sqlite-db"
       ; "download-as-db-edn"; "download-as-roam-json"
       ; "download-as-html"; "download-as-zip"; "export-as-markdown"
       ; "export-as-opml"
       ; "convert-markdown-to-unordered-list-or-heading" ])

(* cljs container.cljs help-button: fixed bottom-right "?" — click toggles
   the help menu popup *)
(* cljs container.cljs help-button: inline tabler help-small svg *)
let help_svg : t =
  icon ~key:"help-svg" ~name:(`app "help-small") ~point_size:24
    ~style_class:"icon icon-tabler icon-tabler-help-small scale-125" []

external open_url : string -> unit = "open" [@@mel.scope "window"]

(* cljs container.cljs help-menu-items -> .cp__sidebar-help-menu-popup;
   the <a> carries no href (act closes the menu or opens an url) →
   pressable row, not the link kind *)
let help_item key title icon_name act =
  Ui_parts.pressable
    ~on_press:(fun _ -> act ())
    (row ~key ~cross:`center ~style_class:"it"
       [ box ~key:(key ^ "-i") ~style_class:"ls-hm-icon"
           [ Icons.icon ~size:20. icon_name ]
       ; text ~key:(key ^ "-t") ~style_class:"ls-hm-title" ~value:title []
       ])

let help_menu_popup : t =
  let close () =
    Runtime.send Action.Help_toggle;
    Runtime.flush ()
  in
  box ~key:"help-menu" ~style_class:"cp__sidebar-help-menu-popup"
    [ column ~key:"hm-wrap" ~style_class:"list-wrap"
        [ help_item "hm-handbook" (I18n.help_handbook) "book-2" close
        ; help_item "hm-shortcuts" (I18n.help_shortcuts) "command" close
        ; help_item "hm-docs" (I18n.help_docs) "help" (fun () ->
            open_url "https://docs.logseq.com/"; close ())
        ; divider ~key:"hm-hr1" ~style_class:"ls-hm-hr" []
        ; help_item "hm-bug" (I18n.help_bug) "bug" close
        ; help_item "hm-feature" (I18n.help_feature) "git-pull-request"
            (fun () ->
              open_url
                "https://discuss.logseq.com/c/feedback/feature-requests/";
              close ())
        ; help_item "hm-feedback" (I18n.help_feedback) "messages"
            (fun () ->
              open_url "https://discuss.logseq.com/c/feedback/13"; close ())
        ; divider ~key:"hm-hr2" ~style_class:"ls-hm-hr" []
        ; help_item "hm-discord" (I18n.help_discord) "brand-discord"
            (fun () -> open_url "https://discord.com/invite/KpN4eHY"; close ())
        ; help_item "hm-forum" (I18n.help_forum) "message" (fun () ->
            open_url "https://discuss.logseq.com/"; close ())
        ; divider ~key:"hm-hr3" ~style_class:"ls-hm-hr" []
        ; help_item "hm-notes" (I18n.help_release_notes) "asterisk"
            (fun () ->
              open_url "https://docs.logseq.com/#/page/changelog"; close ())
        ]
    ; column ~key:"hm-ft" ~style_class:"ft"
        ([ text ~key:"hm-ver" ~style_class:"ls-hm-meta"
             ~value:(Printf.sprintf "Logseq %s" Version.app) [] ]
        @ (match Version.revision () with
           | "" -> []
           | rev ->
               [ text ~key:"hm-rev" ~style_class:"ls-hm-meta"
                   ~value:(I18n.tf "help/revision" [ rev ]) [] ]))
    ]

let help_area (ms : Model.t Signal.signal) : t =
  Logseq_dom.fragment
    [ box ~key:"help" ~style_class:"cp__sidebar-help-btn"
        [ Ui_parts.pressable
            ~on_press:(fun _ ->
              Runtime.send Action.Help_toggle; Runtime.flush ())
            (box ~key:"help-inner" ~style_class:"inner" [ help_svg ]) ]
    ; reactive
        ~equal:(fun (a : Model.t) (b : Model.t) -> a.help_open = b.help_open)
        (fun (m : Model.t) ->
          if m.help_open then help_menu_popup
          else spacer ~key:"help-none" [])
        ms
    ]

(* cljs page.cljs not-found: replaces the whole app chrome. Rendered
   as a fixed overlay (remounting the whole app tree inside a reactive
   hits a retained-store crash on the swap). *)
let not_found_page : t =
  (* .cp__not-found (stylesheet) carries the fixed-overlay positioning the
     inline style used to; text-size/color utility classes stay — they
     have no typed-prop equivalent *)
  column ~key:"nf-full" ~main:`center ~cross:`center
    ~style_class:"cp__not-found"
    [ heading ~key:"nf-h1" ~level:1
        ~style_class:"text-6xl font-bold text-gray-12 mb-4" ~value:"404" []
    ; heading ~key:"nf-h2" ~level:2
        ~style_class:"text-2xl font-semibold text-gray-10 mb-6"
        ~value:(I18n.t "page/not-found-title") []
    ; paragraph ~key:"nf-p" ~style_class:"text-gray-500 mb-8"
        ~value:(I18n.t "page/not-found-desc") []
    ; button ~key:"nf-btn" ~variant:`outline ~height:40
        ~padding_horizontal:16 ~padding_vertical:8
        ~style_class:"ui__button as-outline" ~icon:(`app "home")
        ~icon_placement:`leading ~text:(I18n.t "page/go-back-home")
        ~on_press:(fun _ -> Platform.set_location_hash "#/") []
    ]

let shell (ms : Model.t Signal.signal) : t =
  (* the ls-left-sidebar-open/ls-right-sidebar-open classes had no CSS
     rules — dead, dropped; the class is now static *)
  box ~key:"wrapper" ~accessibility_identifier:"app-container-wrapper"
    ~style_class:"theme-container-inner ls-hl-colored"
    [ skip_to_main
    ; row ~key:"app" ~accessibility_identifier:"app-container" ~grow:1.
        [ Ui_parts.class_signal ms
            (fun (m : Model.t) ->
              (* cljs container.cljs: overflow-hidden while RIGHT
                 sidebar is open *)
              if m.right_sidebar_open then "overflow-hidden" else "w-full")
            (column ~key:"left-container"
               ~accessibility_identifier:"left-container" ~grow:1.
               ~style_class:"w-full"
               [ header ms; main_content ms ])
        ; right_sidebar ms
        ; box ~key:"asc" ~accessibility_identifier:"app-single-container"
            []
        ]
    ; overlays ms
    ; export_anchors
    ; help_area ms
    ; reactive
            ~equal:(fun (a : Model.t) (b : Model.t) ->
              match a.route, b.route with
              | Model.Not_found _, Model.Not_found _ -> true
              | Model.Not_found _, _ | _, Model.Not_found _ -> false
              | _ -> true)
            (fun (m : Model.t) ->
              match m.route with
              | Model.Not_found _ -> not_found_page
              | _ -> spacer ~key:"route-none" [])
            ms
    ]
