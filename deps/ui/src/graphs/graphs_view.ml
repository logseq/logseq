(* All-graphs page content (route #/all-graphs). Rendered imperatively
   into a host div appended under #main-content-container (page.ml owns
   the LUI children there; we can't touch it). Mirrors
   components/repo.cljs repos-inner: div#graphs > h1 "All graphs" +
   "Create a new graph" button + local rows + remote section. *)

open Promise_ext
module T = I18n
module B = Browser_ui

let short_name repo =
  let p = "logseq_db_" in
  let lp = String.length p in
  if String.length repo > lp && String.sub repo 0 lp = p then
    String.sub repo lp (String.length repo - lp)
  else repo

let ghost_btn_cls =
  "ui__button inline-flex cursor-pointer items-center justify-center \
   whitespace-nowrap rounded-md text-sm gap-1 font-medium \
   ring-offset-background transition-colors focus-visible:outline-none \
   focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 \
   disabled:pointer-events-none disabled:opacity-50 select-none \
   hover:bg-secondary/70 hover:text-secondary-foreground active:opacity-80 \
   as-ghost h-7 rounded py-1"

(* tabler dots glyph — cljs ui/icon renders the inline svg inside
   span.ls-icon-dots.ui__icon.ti *)
let dots_icon () =
  let s = B.create "span" in
  B.set_class s "ls-icon-dots ui__icon ti";
  B.inner_html_set s
    "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"15\" height=\"15\" \
     viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" \
     stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" \
     class=\"tabler-icon tabler-icon-dots \"><path d=\"M4 12a1 1 0 1 0 2 \
     0a1 1 0 1 0 -2 0\"/><path d=\"M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 \
     0\"/><path d=\"M18 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0\"/></svg>";
  s

let dropdown_open : B.E.t option ref = ref None

let close_dropdown () =
  match !dropdown_open with
  | Some el ->
      B.remove el;
      dropdown_open := None
  | None -> ()

(* cljs shui/dropdown-menu-item: text sits directly on the menuitem div,
   disabled items keep cursor-pointer and get data-disabled/aria-disabled *)
let menu_item ~cls label ~disabled on_click =
  let b = B.create "div" in
  B.set_attr b "role" "menuitem";
  B.set_class b (Menu_item.graphs_cls ^ cls);
  B.set_text b label;
  if disabled then (
    B.set_attr b "data-disabled" "";
    B.set_attr b "aria-disabled" "true")
  else
    B.add_listener b "click" (fun _ ->
        close_dropdown ();
        on_click ());
  b

(* cljs open-new-window-or-tab!: window.open(origin + pathname +
   '#/?graph-id=' + uuid) *)
let open_in_another_tab repo =
  match Graphs_meta.uuid_of repo with
  | Some uuid ->
      B.open_url
        (B.location_origin () ^ B.location_pathname ()
       ^ "#/?graph-id=" ^ uuid)
  | None -> ()

let open_menu repo anchor =
  close_dropdown ();
  let menu = B.create "div" in
  B.set_class menu
    "ui__dropdown-menu-content z-50 min-w-[8rem] rounded-md border \
     bg-popover p-1 text-popover-foreground shadow-md";
  B.set_attr menu "role" "menu";
  B.set_attr menu "data-side" "bottom";
  B.set_attr menu "data-align" "end";
  let r = B.rect_of anchor in
  B.set_attr menu "style"
    (Printf.sprintf "position:fixed;left:%.0fpx;top:%.0fpx"
       (B.rect_right r) (B.rect_top r));
  B.append menu
    (menu_item ~cls:"open-in-another-tab-menu-item" T.open_in_another_tab
       ~disabled:false (fun () -> open_in_another_tab repo));
  B.append menu
    (menu_item ~cls:"delete-local-graph-menu-item" T.delete_local_graph
       ~disabled:(not (Graphs_ops.removable repo))
       (fun () -> Graphs_ops.ask_delete ~remote:false repo));
  (* remote graphs section below only exists for sync graphs; the local
     row menu still exposes the remote-delete entry so tests can reach it
     when the user is logged in *)
  B.append menu
    (menu_item ~cls:"delete-remote-graph-menu-item" T.delete_remote_graph
       ~disabled:false
       (fun () -> Graphs_ops.ask_delete ~remote:true repo));
  (match B.qs "body" with Some b -> B.append b menu | None -> ());
  dropdown_open := Some menu

(* cljs repo.cljs repo-item row *)
let graph_row repo =
  let row = B.create "div" in
  B.set_attr row "data-testid" repo;
  B.set_class row "flex justify-between mb-2 items-center group";
  let left = B.create "div" in
  let gap = B.create "span" in
  B.set_class gap "flex items-center gap-1";
  let title_wrap = B.create "span" in
  B.set_class title_wrap "flex items-center";
  (* e2e: div[data-testid='logseq_db_<n>'] span:has-text('<n>') *)
  let link = B.create "a" in
  B.set_attr link "title" ("logseq/graphs/" ^ short_name repo);
  B.set_class link "flex items-center";
  let label = B.create "span" in
  B.set_text label (short_name repo);
  B.set_attr label "style" "cursor:pointer";
  B.add_listener label "click" (fun _ ->
      ignore (Graphs_ops.navigate_journal repo));
  B.append link label;
  B.append title_wrap link;
  B.append gap title_wrap;
  let small = B.create "small" in
  B.set_class small "text-muted-foreground";
  B.set_text small
    (T.last_opened_at
       (match Graphs_ops.meta_last_seen repo with
        | Some ms -> B.fmt_time ms
        | None -> "-"));
  B.append left gap;
  B.append left small;
  let controls = B.create "div" in
  B.set_class controls "controls";
  let wrap = B.create "div" in
  B.set_class wrap "flex flex-row items-center";
  let btn = B.create "button" in
  B.set_class btn (ghost_btn_cls ^ " graph-action-btn !px-1");
  B.set_attr btn "type" "button";
  B.set_attr btn "aria-haspopup" "menu";
  B.append btn (dots_icon ());
  B.add_listener btn "click" (fun _ -> open_menu repo btn);
  B.append wrap btn;
  B.append controls wrap;
  B.append row left;
  B.append row controls;
  row

let remote_menu name _uuid anchor =
  close_dropdown ();
  let menu = B.create "div" in
  B.set_class menu
    "ui__dropdown-menu-content z-50 min-w-[8rem] rounded-md border \
     bg-popover p-1 text-popover-foreground shadow-md";
  let r = B.rect_of anchor in
  B.set_attr menu "style"
    (Printf.sprintf "position:fixed;left:%.0fpx;top:%.0fpx"
       (B.rect_right r) (B.rect_top r));
  (* cljs shows the local-delete item on a remote row too when the graph
     is also downloaded locally (repo.cljs: root is truthy) *)
  let local_repo = Graph.full_graph_name name in
  if List.mem local_repo !Graphs_ops.repos then
    B.append menu
      (menu_item ~cls:"delete-local-graph-menu-item" T.delete_local_graph
         ~disabled:(not (Graphs_ops.removable local_repo))
         (fun () -> Graphs_ops.ask_delete ~remote:false local_repo));
  B.append menu
    (menu_item ~cls:"delete-remote-graph-menu-item" T.delete_remote_graph
       ~disabled:false
       (fun () ->
         Graphs_ops.ask_delete ~remote:true
           (Graph.full_graph_name name)));
  (match B.qs "body" with Some b -> B.append b menu | None -> ());
  dropdown_open := Some menu

(* e2e: (.last (w/-query "div[data-testid='logseq_db_<n>']
   span:has-text('<n>')")) clicks the remote row to download+switch *)
let remote_row (name, uuid, e2ee) =
  let row = B.create "div" in
  B.set_attr row "data-testid" ("logseq_db_" ^ name);
  B.set_class row "flex justify-between mb-2 items-center group";
  let left = B.create "div" in
  let name_span = B.create "div" in
  B.set_class name_span "flex items-center gap-1";
  let label = B.create "span" in
  B.set_text label name;
  B.set_attr label "style" "cursor:pointer";
  B.add_listener label "click" (fun _ ->
      (* cljs: clicking a merged remote row with a local root switches
         instead of re-downloading *)
      let repo = Graph.full_graph_name name in
      let local = List.mem repo !Graphs_ops.repos in
      if local then
        ignore (Graphs_ops.navigate_journal repo)
      else ignore (Graphs_ops.download_remote ~name ~uuid ~e2ee));
  B.append name_span label;
  B.append left name_span;
  let controls = B.create "div" in
  B.set_class controls "controls";
  let wrap = B.create "div" in
  B.set_class wrap "flex flex-row items-center";
  let btn = B.create "button" in
  B.set_class btn (ghost_btn_cls ^ " graph-action-btn !px-1");
  B.set_attr btn "type" "button";
  B.set_attr btn "aria-haspopup" "menu";
  B.append btn (dots_icon ());
  B.add_listener btn "click" (fun _ -> remote_menu name uuid btn);
  B.append wrap btn;
  B.append controls wrap;
  B.append row left;
  B.append row controls;
  row

(* cljs repos-cp remote section: hr + h2 Remote graphs: + refresh button +
   rows — only rendered for a logged-in user with remote graphs.
   The Refresh button is a ui/button with an inner span; disabled while
   the remote list is loading (e2e asserts the [disabled] toggle) *)
let remote_section rerender =
  let sec = B.create "div" in
  let hr = B.create "hr" in
  B.set_class hr "mt-8";
  B.append sec hr;
  let head = B.create "div" in
  B.set_class head "flex align-items justify-between";
  let h = B.create "h2" in
  B.set_class h "text-lg font-medium mb-4";
  B.set_text h T.remote_graphs;
  B.append head h;
  let refresh_btn = B.create "button" in
  B.set_attr refresh_btn "type" "button";
  B.set_class refresh_btn "ui__button flex items-center gap-1";
  let refresh_label = B.create "span" in
  B.set_class refresh_label "flex items-center";
  B.set_text refresh_label T.refresh;
  B.append refresh_btn refresh_label;
  B.add_listener refresh_btn "click" (fun _ ->
      B.set_attr refresh_btn "disabled" "true";
      (let* _ = Graphs_ops.refresh () in
      let* _ = Graphs_ops.list_remote_graphs () in
      B.remove_attr refresh_btn "disabled";
      rerender ();
      Js.Promise.resolve ())
      |> Js.Promise.catch (fun _ ->
             B.remove_attr refresh_btn "disabled";
             Js.Promise.resolve ())
      |> ignore);
  B.append head refresh_btn;
  B.append sec head;
  List.iter
    (fun rg -> B.append sec (remote_row rg))
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
  let existing = B.qs_in host "#graphs" in
  let sig_ = view_sig () in
  if existing <> None && sig_ = !last_sig then ()
  else begin
    last_sig := sig_;
    (match existing with Some g -> B.remove g | None -> ());
    render_fresh host
  end

and render_fresh host =
  let root = B.create "div" in
  B.set_attr root "id" "graphs";
  let h1 = B.create "h1" in
  B.set_class h1 "title";
  B.set_text h1 T.all_graphs;
  B.append root h1;
  let content = B.create "div" in
  B.set_class content "mt-8 pl-1 content";
  let btn_row = B.create "div" in
  B.set_class btn_row "flex flex-row my-8";
  let btn_col = B.create "div" in
  B.set_class btn_col "mr-8";
  let create_btn = B.create "button" in
  B.set_attr create_btn "type" "button";
  B.set_class create_btn
    "ui__button inline-flex cursor-pointer items-center justify-center \
     whitespace-nowrap rounded-md text-sm gap-1 font-medium \
     ring-offset-background transition-colors focus-visible:outline-none \
     focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 \
     disabled:pointer-events-none disabled:opacity-50 select-none \
     bg-primary/90 hover:bg-primary/100 active:opacity-90 \
     text-primary-foreground hover:text-primary-foreground as-solid h-7 \
     rounded px-3 py-1";
  B.set_text create_btn T.create_new_graph;
  B.add_listener create_btn "click" (fun _ ->
      Dialogs_state.open_ "new-graph");
  B.append btn_col create_btn;
  B.append btn_row btn_col;
  B.append content btn_row;
  let local = B.create "div" in
  let h2 = B.create "h2" in
  B.set_class h2 "text-lg font-medium mb-4";
  B.set_text h2 T.local_graphs;
  B.append local h2;
  (* cljs combine-local-&-remote-graphs merges by :url — a remote graph
     that exists locally renders once, under Remote graphs *)
  let remote_names =
    List.map (fun (n, _, _) -> n) !Graphs_ops.remote_graphs
  in
  List.iter
    (fun r ->
      if not (List.mem (short_name r) remote_names) then
        B.append local (graph_row r))
    !Graphs_ops.repos;
  B.append content local;
  if !Graphs_ops.remote_graphs <> [] then
    B.append content (remote_section (fun () -> rerender ()));
  B.append root content;
  B.append host root

and rerender () =
  match B.qs ".graphs-host" with
  | Some host -> render_into host
  | None -> ()

let rec show ?(tries = 40) () =
  Graphs_ops.on_repos_changed := (fun () ->
      match B.qs ".graphs-host" with
      | Some host ->
          ignore
            (let* _ = (Graphs_ops.list_remote_graphs ()) in
            render_into host; Js.Promise.resolve ())
      | None -> ());
  (* cljs mounts #graphs inside .cp__sidebar-main-content > .mx-auto.pb-24
     (the route content column) — append our host there so centering and
     margins match exactly *)
  match B.qs ".cp__sidebar-main-content .mx-auto" with
  | Some parent -> (
      match B.qs ".graphs-host" with
      | Some _ -> rerender ()
      | None ->
          let host = B.create "div" in
          B.set_class host "graphs-host";
          B.append parent host;
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
        ignore (B.set_timeout (fun () -> show ~tries:(tries - 1) ()) 50)

let hide () =
  close_dropdown ();
  match B.qs ".graphs-host" with
  | Some host -> B.remove host
  | None -> ()
