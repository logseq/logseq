(* All-graphs page content (route #/all-graphs). Rendered imperatively
   into a host div appended under #main-content-container (page.ml owns
   the LUI children there; we can't touch it). Mirrors
   components/repo.cljs repos-inner: div#graphs > h1 "All graphs" +
   "Create a new graph" button + local rows + remote section. *)

module T = Graphs_text
module B = Browser_ui

let short_name repo =
  let p = "logseq_db_" in
  let lp = String.length p in
  if String.length repo > lp && String.sub repo 0 lp = p then
    String.sub repo lp (String.length repo - lp)
  else repo

let dropdown_open : B.E.t option ref = ref None

let close_dropdown () =
  match !dropdown_open with
  | Some el ->
      B.remove el;
      dropdown_open := None
  | None -> ()

let menu_item ~cls label ~disabled on_click =
  let b = B.create "div" in
  B.set_attr b "role" "menuitem";
  B.set_class b
    ("ui__dropdown-menu-item relative flex select-none items-center \
      rounded-sm px-2 py-1.5 text-sm outline-none "
    ^ (if disabled then "opacity-50 cursor-not-allowed " ^ cls
       else "cursor-pointer " ^ cls));
  let t = B.create "div" in
  B.set_text t label;
  B.append b t;
  if not disabled then
    B.add_listener b "click" (fun _ ->
        close_dropdown ();
        on_click ());
  b

let open_menu repo anchor =
  close_dropdown ();
  let menu = B.create "div" in
  B.set_class menu
    "ui__dropdown-menu-content z-50 min-w-[8rem] rounded-md border \
     bg-popover p-1 text-popover-foreground shadow-md";
  let r = B.rect_of anchor in
  B.set_attr menu "style"
    (Printf.sprintf "position:fixed;left:%.0fpx;top:%.0fpx"
       (B.rect_right r) (B.rect_top r));
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

let graph_row repo =
  let row = B.create "div" in
  B.set_attr row "data-testid" repo;
  B.set_class row "flex justify-between mb-2 items-center group";
  let left = B.create "div" in
  let name_span = B.create "div" in
  B.set_class name_span "flex items-center gap-1";
  (* e2e: div[data-testid='logseq_db_<n>'] span:has-text('<n>') *)
  let label = B.create "span" in
  B.set_text label (short_name repo);
  B.set_attr label "style" "cursor:pointer";
  B.add_listener label "click" (fun _ ->
      ignore (Graphs_ops.navigate_journal repo));
  B.append name_span label;
  let small = B.create "small" in
  B.set_class small "text-muted-foreground";
  B.set_text small
    (T.last_opened_at
       (match Graphs_ops.meta_last_seen repo with
        | Some ms -> B.fmt_time ms
        | None -> "-"));
  B.append left name_span;
  B.append left small;
  let controls = B.create "div" in
  B.set_class controls "controls";
  let wrap = B.create "div" in
  B.set_class wrap "flex flex-row items-center";
  let btn = B.create "button" in
  B.set_class btn "graph-action-btn";
  B.set_attr btn "type" "button";
  let icon = B.create "i" in
  B.set_class icon "ti ti-dots";
  B.append btn icon;
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
  B.append menu
    (menu_item ~cls:"delete-remote-graph-menu-item" T.delete_remote_graph
       ~disabled:false
       (fun () ->
         Graphs_ops.ask_delete ~remote:true
           (Graph.full_graph_name name)));
  (match B.qs "body" with Some b -> B.append b menu | None -> ());
  dropdown_open := Some menu

let remote_row (name, uuid) =
  let row = B.create "div" in
  B.set_attr row "data-testid" ("remote_" ^ name);
  B.set_class row "flex justify-between mb-2 items-center group";
  let left = B.create "div" in
  let label = B.create "div" in
  B.set_text label name;
  B.append left label;
  let controls = B.create "div" in
  B.set_class controls "controls";
  let wrap = B.create "div" in
  B.set_class wrap "flex flex-row items-center";
  let btn = B.create "button" in
  B.set_class btn "graph-action-btn";
  B.set_attr btn "type" "button";
  let icon = B.create "i" in
  B.set_class icon "ti ti-dots";
  B.append btn icon;
  B.add_listener btn "click" (fun _ -> remote_menu name uuid btn);
  B.append wrap btn;
  B.append controls wrap;
  B.append row left;
  B.append row controls;
  row

let remote_section rerender =
  let sec = B.create "div" in
  let h = B.create "h2" in
  B.set_text h T.remote_graphs;
  B.append sec h;
  List.iter
    (fun rg -> B.append sec (remote_row rg))
    !Graphs_ops.remote_graphs;
  let refresh_btn = B.create "button" in
  B.set_attr refresh_btn "type" "button";
  B.set_text refresh_btn T.refresh;
  B.add_listener refresh_btn "click" (fun _ ->
      Graphs_ops.refresh ()
      |> Js.Promise.then_ (fun _ -> Graphs_ops.list_remote_graphs ())
      |> Js.Promise.then_ (fun _ ->
             rerender ();
             Js.Promise.resolve ())
      |> ignore);
  B.append sec refresh_btn;
  sec

let rec render_into host =
  (match B.qs_in host "#graphs" with Some g -> B.remove g | None -> ());
  let root = B.create "div" in
  B.set_attr root "id" "graphs";
  let h1 = B.create "h1" in
  B.set_class h1 "title";
  B.set_text h1 T.all_graphs;
  B.append root h1;
  let create_btn = B.create "button" in
  B.set_attr create_btn "type" "button";
  B.set_text create_btn T.create_new_graph;
  B.add_listener create_btn "click" (fun _ ->
      Dialogs_state.open_ "new-graph");
  B.append root create_btn;
  let h2 = B.create "h2" in
  B.set_text h2 T.local_graphs;
  B.append root h2;
  List.iter (fun r -> B.append root (graph_row r)) !Graphs_ops.repos;
  B.append root (remote_section (fun () -> rerender ()));
  B.append host root

and rerender () =
  match B.qs ".graphs-host" with
  | Some host -> render_into host
  | None -> ()

(* TODO(shared): #main-container should get class `is-left-sidebar-open`
   (style.css `#main-container.is-left-sidebar-open{padding-left:...}`)
   so main content reflows; chrome.ml only sets `ls-left-sidebar-open` on
   the wrapper. Until then pad the host ourselves so the open sidebar
   overlay doesn't cover/intercept the graphs UI. *)
let pad_for_sidebar host sidebar_open =
  if sidebar_open then
    B.set_attr host "style" "padding-left:var(--ls-left-sidebar-width)"
  else B.set_attr host "style" ""

let show sidebar_open =
  Graphs_ops.on_repos_changed := (fun () ->
      match B.qs ".graphs-host" with
      | Some host ->
          ignore
            (Js.Promise.then_
               (fun _ -> render_into host; Js.Promise.resolve ())
               (Graphs_ops.list_remote_graphs ()))
      | None -> ());
  match B.qs "#main-content-container" with
  | Some parent -> (
      match B.qs ".graphs-host" with
      | Some host ->
          pad_for_sidebar host sidebar_open;
          rerender ()
      | None ->
          let host = B.create "div" in
          B.set_class host "graphs-host";
          pad_for_sidebar host sidebar_open;
          B.append parent host;
          if !Graphs_ops.repos = [] then
            ignore
              (Js.Promise.then_
                 (fun _ -> rerender (); Js.Promise.resolve ())
                 (Graphs_ops.refresh ()));
          ignore
            (Js.Promise.then_
               (fun _ -> rerender (); Js.Promise.resolve ())
               (Graphs_ops.list_remote_graphs ()));
          render_into host)
  | None -> ()

let hide () =
  close_dropdown ();
  match B.qs ".graphs-host" with
  | Some host -> B.remove host
  | None -> ()
