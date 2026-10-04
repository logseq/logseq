(* All-graphs page content (route #/all-graphs). Rendered imperatively
   into a host div appended under #main-content-container (page.ml owns
   the LUI children there; we can't touch it). Mirrors
   components/repo.cljs repos-inner: div#graphs > h1 "All graphs" +
   "Create a new graph" button + local rows + remote section. *)

open Promise_ext
module T = I18n
let short_name repo =
  let p = "logseq_db_" in
  let lp = String.length p in
  if String.length repo > lp && String.sub repo 0 lp = p then
    String.sub repo lp (String.length repo - lp)
  else repo

let ghost_btn_cls = Ui_parts.ghost_btn_cls ~extra:"h-7 rounded py-1" ()

(* tabler dots glyph — cljs ui/icon renders the inline svg inside
   span.ls-icon-dots.ui__icon.ti *)
let dots_icon () =
  let s = Web_dom.create_element "span" in
  Web_dom.el_set_class s "ls-icon-dots ui__icon ti";
  Web_dom.el_set_inner_html s
    "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"15\" height=\"15\" \
     viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" \
     stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" \
     class=\"tabler-icon tabler-icon-dots \"><path d=\"M4 12a1 1 0 1 0 2 \
     0a1 1 0 1 0 -2 0\"/><path d=\"M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 \
     0\"/><path d=\"M18 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0\"/></svg>";
  s

let dropdown_open : Web_dom.el option ref = ref None

let close_dropdown () =
  match !dropdown_open with
  | Some el ->
      Web_dom.el_remove el;
      dropdown_open := None
  | None -> ()

(* cljs shui/dropdown-menu-item: text sits directly on the menuitem div,
   disabled items keep cursor-pointer and get data-disabled/aria-disabled *)
let menu_item ~cls label ~disabled on_click =
  let b = Web_dom.create_element "div" in
  Web_dom.el_set_attr b "role" "menuitem";
  Web_dom.el_set_class b (Menu_item.graphs_cls ^ cls);
  Web_dom.el_set_text_content b label;
  if disabled then (
    Web_dom.el_set_attr b "data-disabled" "";
    Web_dom.el_set_attr b "aria-disabled" "true")
  else
    Web_dom.el_on b "click" (fun _ ->
        close_dropdown ();
        on_click ());
  b

(* cljs open-new-window-or-tab!: window.open(origin + pathname +
   '#/?graph-id=' + uuid) *)
let open_in_another_tab repo =
  match Graphs_meta.uuid_of repo with
  | Some uuid ->
      Web_dom.win_open
        (Platform.location_origin ^ Platform.location_pathname
       ^ "#/?graph-id=" ^ uuid)
  | None -> ()

let open_menu repo anchor =
  close_dropdown ();
  let menu = Web_dom.create_element "div" in
  Web_dom.el_set_class menu
    "ui__dropdown-menu-content z-50 min-w-[8rem] rounded-md border \
     bg-popover p-1 text-popover-foreground shadow-md";
  Web_dom.el_set_attr menu "role" "menu";
  Web_dom.el_set_attr menu "data-side" "bottom";
  Web_dom.el_set_attr menu "data-align" "end";
  let r = Web_dom.el_bounding_rect anchor in
  Web_dom.el_set_attr menu "style"
    (Printf.sprintf "position:fixed;left:%.0fpx;top:%.0fpx"
       (Web_dom.rect_right r) (Web_dom.rect_top r));
  Web_dom.el_append_child menu
    (menu_item ~cls:"open-in-another-tab-menu-item" T.open_in_another_tab
       ~disabled:false (fun () -> open_in_another_tab repo));
  Web_dom.el_append_child menu
    (menu_item ~cls:"delete-local-graph-menu-item" T.delete_local_graph
       ~disabled:(not (Graphs_ops.removable repo))
       (fun () -> Graphs_ops.ask_delete ~remote:false repo));
  (* cljs repo.cljs: "Use Logseq Sync (Beta testing)" only for a local,
     non-remote graph that is currently open, logged in + rtc-group *)
  let remote_names =
    List.map (fun (n, _, _) -> n) !Graphs_ops.remote_graphs
  in
  if
    Rtc_flows.logged_in () && Rtc_flows.rtc_group ()
    && not (List.mem (short_name repo) remote_names)
    && (Runtime.model ()).Model.repo = Some repo
  then
    Web_dom.el_append_child menu
      (menu_item ~cls:"use-logseq-sync-menu-item"
         (I18n.t "graph/use-sync-beta") ~disabled:false
         (fun () -> Graphs_ops.ask_upload repo));
  (match Web_dom.query_selector "body" with
   | Some b -> Web_dom.el_append_child b menu
   | None -> ());
  dropdown_open := Some menu

(* cljs repo.cljs repo-item row *)
let graph_row repo =
  let row = Web_dom.create_element "div" in
  Web_dom.el_set_attr row "data-testid" repo;
  Web_dom.el_set_class row "flex justify-between mb-2 items-center group";
  let left = Web_dom.create_element "div" in
  let gap = Web_dom.create_element "span" in
  Web_dom.el_set_class gap "flex items-center gap-1";
  let title_wrap = Web_dom.create_element "span" in
  Web_dom.el_set_class title_wrap "flex items-center";
  (* e2e: div[data-testid='logseq_db_<n>'] span:has-text('<n>') *)
  let link = Web_dom.create_element "a" in
  Web_dom.el_set_attr link "title" ("logseq/graphs/" ^ short_name repo);
  Web_dom.el_set_class link "flex items-center";
  let label = Web_dom.create_element "span" in
  Web_dom.el_set_text_content label (short_name repo);
  Web_dom.el_set_attr label "style" "cursor:pointer";
  Web_dom.el_on label "click" (fun _ ->
      ignore (Graphs_ops.navigate_journal repo));
  Web_dom.el_append_child link label;
  Web_dom.el_append_child title_wrap link;
  Web_dom.el_append_child gap title_wrap;
  let small = Web_dom.create_element "small" in
  Web_dom.el_set_class small "text-muted-foreground";
  Web_dom.el_set_text_content small
    (T.last_opened_at
       (match Graphs_ops.meta_last_seen repo with
        | Some ms -> Platform.fmt_time ms
        | None -> "-"));
  Web_dom.el_append_child left gap;
  Web_dom.el_append_child left small;
  let controls = Web_dom.create_element "div" in
  Web_dom.el_set_class controls "controls";
  let wrap = Web_dom.create_element "div" in
  Web_dom.el_set_class wrap "flex flex-row items-center";
  let btn = Web_dom.create_element "button" in
  Web_dom.el_set_class btn (ghost_btn_cls ^ " graph-action-btn !px-1");
  Web_dom.el_set_attr btn "type" "button";
  Web_dom.el_set_attr btn "aria-haspopup" "menu";
  Web_dom.el_append_child btn (dots_icon ());
  Web_dom.el_on btn "click" (fun _ -> open_menu repo btn);
  Web_dom.el_append_child wrap btn;
  Web_dom.el_append_child controls wrap;
  Web_dom.el_append_child row left;
  Web_dom.el_append_child row controls;
  row

let remote_menu name _uuid anchor =
  close_dropdown ();
  let menu = Web_dom.create_element "div" in
  Web_dom.el_set_class menu
    "ui__dropdown-menu-content z-50 min-w-[8rem] rounded-md border \
     bg-popover p-1 text-popover-foreground shadow-md";
  let r = Web_dom.el_bounding_rect anchor in
  Web_dom.el_set_attr menu "style"
    (Printf.sprintf "position:fixed;left:%.0fpx;top:%.0fpx"
       (Web_dom.rect_right r) (Web_dom.rect_top r));
  (* cljs shows the local-delete item on a remote row too when the graph
     is also downloaded locally (repo.cljs: root is truthy) *)
  let local_repo = Graph.full_graph_name name in
  if List.mem local_repo !Graphs_ops.repos then
    Web_dom.el_append_child menu
      (menu_item ~cls:"delete-local-graph-menu-item" T.delete_local_graph
         ~disabled:(not (Graphs_ops.removable local_repo))
         (fun () -> Graphs_ops.ask_delete ~remote:false local_repo));
  Web_dom.el_append_child menu
    (menu_item ~cls:"delete-remote-graph-menu-item" T.delete_remote_graph
       ~disabled:false
       (fun () ->
         Graphs_ops.ask_delete ~remote:true
           (Graph.full_graph_name name)));
  (match Web_dom.query_selector "body" with Some b -> Web_dom.el_append_child b menu | None -> ());
  dropdown_open := Some menu

(* e2e: (.last (w/-query "div[data-testid='logseq_db_<n>']
   span:has-text('<n>')")) clicks the remote row to download+switch *)
let remote_row (name, uuid, e2ee) =
  let row = Web_dom.create_element "div" in
  Web_dom.el_set_attr row "data-testid" ("logseq_db_" ^ name);
  Web_dom.el_set_class row "flex justify-between mb-2 items-center group";
  let left = Web_dom.create_element "div" in
  let name_span = Web_dom.create_element "div" in
  Web_dom.el_set_class name_span "flex items-center gap-1";
  let label = Web_dom.create_element "span" in
  Web_dom.el_set_text_content label name;
  Web_dom.el_set_attr label "style" "cursor:pointer";
  Web_dom.el_on label "click" (fun _ ->
      (* cljs: clicking a merged remote row with a local root switches
         instead of re-downloading *)
      let repo = Graph.full_graph_name name in
      let local = List.mem repo !Graphs_ops.repos in
      if local then
        ignore (Graphs_ops.navigate_journal repo)
      else ignore (Graphs_ops.download_remote ~name ~uuid ~e2ee));
  Web_dom.el_append_child name_span label;
  Web_dom.el_append_child left name_span;
  let controls = Web_dom.create_element "div" in
  Web_dom.el_set_class controls "controls";
  let wrap = Web_dom.create_element "div" in
  Web_dom.el_set_class wrap "flex flex-row items-center";
  let btn = Web_dom.create_element "button" in
  Web_dom.el_set_class btn (ghost_btn_cls ^ " graph-action-btn !px-1");
  Web_dom.el_set_attr btn "type" "button";
  Web_dom.el_set_attr btn "aria-haspopup" "menu";
  Web_dom.el_append_child btn (dots_icon ());
  Web_dom.el_on btn "click" (fun _ -> remote_menu name uuid btn);
  Web_dom.el_append_child wrap btn;
  Web_dom.el_append_child controls wrap;
  Web_dom.el_append_child row left;
  Web_dom.el_append_child row controls;
  row

(* cljs repos-cp remote section: hr + h2 Remote graphs: + refresh button +
   rows — only rendered for a logged-in user with remote graphs.
   The Refresh button is a ui/button with an inner span; disabled while
   the remote list is loading (e2e asserts the [disabled] toggle) *)
let remote_section rerender =
  let sec = Web_dom.create_element "div" in
  let hr = Web_dom.create_element "hr" in
  Web_dom.el_set_class hr "mt-8";
  Web_dom.el_append_child sec hr;
  let head = Web_dom.create_element "div" in
  Web_dom.el_set_class head "flex align-items justify-between";
  let h = Web_dom.create_element "h2" in
  Web_dom.el_set_class h "text-lg font-medium mb-4";
  Web_dom.el_set_text_content h T.remote_graphs;
  Web_dom.el_append_child head h;
  let refresh_btn = Web_dom.create_element "button" in
  Web_dom.el_set_attr refresh_btn "type" "button";
  Web_dom.el_set_class refresh_btn "ui__button flex items-center gap-1";
  let refresh_label = Web_dom.create_element "span" in
  Web_dom.el_set_class refresh_label "flex items-center";
  Web_dom.el_set_text_content refresh_label T.refresh;
  Web_dom.el_append_child refresh_btn refresh_label;
  Web_dom.el_on refresh_btn "click" (fun _ ->
      Web_dom.el_set_attr refresh_btn "disabled" "true";
      (let* _ = Graphs_ops.refresh () in
      let* _ = Graphs_ops.list_remote_graphs () in
      Web_dom.el_remove_attr refresh_btn "disabled";
      rerender ();
      Js.Promise.resolve ())
      |> Js.Promise.catch (fun _ ->
             Web_dom.el_remove_attr refresh_btn "disabled";
             Js.Promise.resolve ())
      |> ignore);
  Web_dom.el_append_child head refresh_btn;
  Web_dom.el_append_child sec head;
  List.iter
    (fun rg -> Web_dom.el_append_child sec (remote_row rg))
    !Graphs_ops.remote_graphs;
  sec

(* cljs React reconciles rows in place, so a Playwright locator keeps
   pointing at the same DOM node while remote/local lists refetch. Our
   render rebuilds #graphs wholesale; when the underlying data is
   unchanged the rebuild only detaches nodes mid-interaction (e2e
   switch-graph click retries on "element was detached from the DOM"),
   so skip it. *)
let last_sig = ref ""

let view_sig () =
  let local =
    List.map
      (fun r ->
        r ^ ":"
        ^
        (match Graphs_ops.meta_last_seen r with
         | Some ms -> Printf.sprintf "%.0f" ms
         | None -> "-"))
      !Graphs_ops.repos
  in
  let remote =
    List.map
      (fun (n, u, e) -> Printf.sprintf "%s:%s:%b" n u e)
      !Graphs_ops.remote_graphs
  in
  String.concat "|" (local @ [ "##" ] @ remote)

let rec render_into host =
  let existing = Web_dom.el_query host "#graphs" in
  let sig_ = view_sig () in
  if existing <> None && sig_ = !last_sig then ()
  else begin
    last_sig := sig_;
    (match existing with Some g -> Web_dom.el_remove g | None -> ());
    render_fresh host
  end

and render_fresh host =
  let root = Web_dom.create_element "div" in
  Web_dom.el_set_attr root "id" "graphs";
  let h1 = Web_dom.create_element "h1" in
  Web_dom.el_set_class h1 "title";
  Web_dom.el_set_text_content h1 T.all_graphs;
  Web_dom.el_append_child root h1;
  let content = Web_dom.create_element "div" in
  Web_dom.el_set_class content "mt-8 pl-1 content";
  let btn_row = Web_dom.create_element "div" in
  Web_dom.el_set_class btn_row "flex flex-row my-8";
  let btn_col = Web_dom.create_element "div" in
  Web_dom.el_set_class btn_col "mr-8";
  let create_btn = Web_dom.create_element "button" in
  Web_dom.el_set_attr create_btn "type" "button";
  Web_dom.el_set_class create_btn
    "ui__button inline-flex cursor-pointer items-center justify-center \
     whitespace-nowrap rounded-md text-sm gap-1 font-medium \
     ring-offset-background transition-colors focus-visible:outline-none \
     focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 \
     disabled:pointer-events-none disabled:opacity-50 select-none \
     bg-primary/90 hover:bg-primary/100 active:opacity-90 \
     text-primary-foreground hover:text-primary-foreground as-solid h-7 \
     rounded px-3 py-1";
  Web_dom.el_set_text_content create_btn T.create_new_graph;
  Web_dom.el_on create_btn "click" (fun _ ->
      Dialogs_state.open_ "new-graph");
  Web_dom.el_append_child btn_col create_btn;
  Web_dom.el_append_child btn_row btn_col;
  Web_dom.el_append_child content btn_row;
  let local = Web_dom.create_element "div" in
  let h2 = Web_dom.create_element "h2" in
  Web_dom.el_set_class h2 "text-lg font-medium mb-4";
  Web_dom.el_set_text_content h2 T.local_graphs;
  Web_dom.el_append_child local h2;
  (* cljs combine-local-&-remote-graphs merges by :url — a remote graph
     that exists locally renders once, under Remote graphs *)
  let remote_names =
    List.map (fun (n, _, _) -> n) !Graphs_ops.remote_graphs
  in
  List.iter
    (fun r ->
      if not (List.mem (short_name r) remote_names) then
        Web_dom.el_append_child local (graph_row r))
    !Graphs_ops.repos;
  Web_dom.el_append_child content local;
  if !Graphs_ops.remote_graphs <> [] then
    Web_dom.el_append_child content (remote_section (fun () -> rerender ()));
  Web_dom.el_append_child root content;
  Web_dom.el_append_child host root

and rerender () =
  match Web_dom.query_selector ".graphs-host" with
  | Some host -> render_into host
  | None -> ()

let rec show ?(tries = 40) () =
  Graphs_ops.on_repos_changed := (fun () ->
      match Web_dom.query_selector ".graphs-host" with
      | Some host ->
          ignore
            (let* _ = (Graphs_ops.list_remote_graphs ()) in
            render_into host; Js.Promise.resolve ())
      | None -> ());
  (* cljs mounts #graphs inside .cp__sidebar-main-content > .mx-auto.pb-24
     (the route content column) — append our host there so centering and
     margins match exactly *)
  match Web_dom.query_selector ".cp__sidebar-main-content .mx-auto" with
  | Some parent -> (
      match Web_dom.query_selector ".graphs-host" with
      | Some _ -> rerender ()
      | None ->
          let host = Web_dom.create_element "div" in
          Web_dom.el_set_class host "graphs-host";
          Web_dom.el_append_child parent host;
          if !Graphs_ops.repos = [] then
            ignore
              (let* _ = (Graphs_ops.refresh ()) in
              rerender (); Js.Promise.resolve ());
          ignore
            (let* _ = (Graphs_ops.list_remote_graphs ()) in
            rerender (); Js.Promise.resolve ());
          render_into host)
  | None ->
      (* cold #/graphs load: the route commits Ready before the content
         column flushes, so the host parent isn't there on the first
         model emission — retry briefly; on_model re-invokes on every
         change anyway, so this is a bridge, not a loop *)
      if tries > 0 then
        ignore (Web_dom.set_timeout_id (fun () -> show ~tries:(tries - 1) ()) 50)

let hide () =
  close_dropdown ();
  match Web_dom.query_selector ".graphs-host" with
  | Some host -> Web_dom.el_remove host
  | None -> ()
