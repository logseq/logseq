(* All-graphs page content (route #/all-graphs) — a LUI view mounted by
   Page.region for Model.All_graphs. Mirrors components/repo.cljs
   repos-inner: .graphs-host > h1.title "All graphs" + "Create a new
   graph" button + local rows + remote section. *)

open Promise_ext
open Lui_elements
module T = I18n

let short_name repo =
  let p = "logseq_db_" in
  let lp = String.length p in
  if String.length repo > lp && String.sub repo 0 lp = p then
    String.sub repo lp (String.length repo - lp)
  else repo

(* remote graphs live outside the model (the Graphs_ops.remote_graphs
   ref), so the view mirrors them in a signal populated on mount and
   refreshed after ops; local repos arrive through the model signal *)
type remote_graph = string * string * bool * string

let remote_st_ref : remote_graph list Signal.state option ref = ref None

let remote_st ctx =
  match !remote_st_ref with
  | Some s -> s
  | None ->
      let s = Signal.state ctx.Lui_ui.ui_scheduler [] in
      remote_st_ref := Some s;
      s

let refresh_remote ctx =
  let* _ = Graphs_ops.list_remote_graphs () in
  Runtime.signal_set (remote_st ctx) !Graphs_ops.remote_graphs;
  Js.Promise.resolve ()

(* cljs open-new-window-or-tab!: window.open(origin + pathname +
   '#/?graph-id=' + uuid) *)
let open_in_another_tab repo =
  match Graphs_meta.uuid_of repo with
  | Some uuid ->
      Ui_services.env_open_url
        (Ui_services.nav_origin () ^ Ui_services.nav_pathname ()
       ^ "#/?graph-id=" ^ uuid)
  | None -> ()

(* cljs repo.cljs repo-item row *)
let graph_row repo : t =
 fun ctx parent ->
  let sync_item =
    (* cljs repo.cljs: "Use Logseq Sync (Beta testing)" only for a
       local, non-remote graph that is currently open, logged in +
       rtc-group *)
    let remote_names =
      List.map (fun (n, _, _, _) -> n) !Graphs_ops.remote_graphs
    in
    if
      Rtc_flows.logged_in () && Rtc_flows.rtc_group ()
      && not (List.mem (short_name repo) remote_names)
      && (Runtime.model ()).Model.repo = Some repo
    then
      [ ("", I18n.t "graph/use-sync-beta", false, fun () ->
            Graphs_ops.ask_upload repo) ]
    else []
  in
  row ~key:("gr-" ^ repo) ~main:`space_between ~cross:`center
    ~style_class:"group"
    ~data_attrs:[ ("data-testid", repo) ]
    [ column ~key:("grl-" ^ repo)
        [ row ~key:("grt-" ^ repo) ~gap:4 ~cross:`center
            (* e2e: div[data-testid='logseq_db_<n>'] span:has-text('<n>') *)
            [ text ~key:("grn-" ^ repo) ~style_class:"cursor-pointer"
                ~data_attrs:[ ("aria-label", "logseq/graphs/" ^ short_name repo) ]
                ~value:(short_name repo)
                ~on_press:(fun _ ->
                  ignore (Graphs_ops.navigate_journal repo))
                []
            ]
        ; text ~key:("grs-" ^ repo) ~as_:`Small
            ~style_class:"text-muted-foreground"
            ~value:
              (T.last_opened_at
                 (match Graphs_ops.meta_last_seen repo with
                  | Some ms -> Ui_services.time_fmt_date ms
                  | None -> "-"))
            []
        ]
    ; column ~key:("grc-" ^ repo) ~style_class:"controls"
        [ Menu_item.dots_menu ~key:("grm-" ^ repo)
            ([ ( "open-in-another-tab-menu-item"
               , T.open_in_another_tab
               , false
               , fun () -> open_in_another_tab repo )
             ; ( "delete-local-graph-menu-item"
               , T.delete_local_graph
               , not (Graphs_ops.removable repo)
               , fun () -> Graphs_ops.ask_delete ~remote:false repo )
             ]
            @ sync_item)
        ]
    ]
    ctx parent

(* cljs remote row — e2e: (.last (w/-query "div[data-testid='logseq_db_<n>']
   span:has-text('<n>')")) clicks the remote row to download+switch *)
let remote_row (name, uuid, e2ee, role) : t =
 fun ctx parent ->
  let local_repo = Graph.full_graph_name name in
  let leave_item =
    (* cljs repo.cljs: leave-shared-graph only for a remote graph the
       caller doesn't manage *)
    if role <> "manager" then
      [ ("", I18n.t "graph/leave-action", false, fun () ->
            Dialogs_state.ask ~title:""
              ~desc:(I18n.t "graph/leave-confirm-desc")
              ~on_confirm:(fun () ->
                ignore
                  ((if (Runtime.model ()).Model.repo = Some local_repo
                    then Rtc_ops.stop ());
                   let* ok = Collaborators.leave_graph ~uuid in
                   if ok then begin
                     Toast.success (I18n.t "graph/left");
                     refresh_remote ctx
                   end
                   else begin
                     Toast.error (I18n.t "graph/leave-error");
                     Js.Promise.resolve ()
                   end)) ()) ]
    else []
  in
  let items =
    (* cljs shows the local-delete item on a remote row too when the
       graph is also downloaded locally (repo.cljs: root is truthy) *)
    (if List.mem local_repo !Graphs_ops.repos then
       [ ( "delete-local-graph-menu-item"
         , T.delete_local_graph
         , not (Graphs_ops.removable local_repo)
         , fun () -> Graphs_ops.ask_delete ~remote:false local_repo )
       ]
     else [])
    @ ( "delete-remote-graph-menu-item"
      , T.delete_remote_graph
      , false
      , fun () -> Graphs_ops.ask_delete ~remote:true local_repo )
      :: leave_item
  in
  row ~key:("rr-" ^ uuid) ~main:`space_between ~cross:`center
    ~style_class:"group"
    ~data_attrs:[ ("data-testid", "logseq_db_" ^ name) ]
    [ column ~key:("rrl-" ^ uuid)
        [ row ~key:("rrt-" ^ uuid) ~gap:4 ~cross:`center
            [ text ~key:("rrn-" ^ uuid) ~style_class:"cursor-pointer"
                ~value:name
                ~on_press:(fun _ ->
                  (* cljs: clicking a merged remote row with a local
                     root switches instead of re-downloading *)
                  let repo = Graph.full_graph_name name in
                  if List.mem repo !Graphs_ops.repos then
                    ignore (Graphs_ops.navigate_journal repo)
                  else
                    ignore (Graphs_ops.download_remote ~name ~uuid ~e2ee))
                []
            ; (* cljs repos-cp: strong.px-1 > ui/icon lock (e2ee) |
                 cloud for every remote row *)
              icon ~key:("rri-" ^ uuid)
                ~name:(Icons.name_ref (if e2ee then "lock" else "cloud"))
                ~point_size:14 []
            ]
        ]
    ; column ~key:("rrc-" ^ uuid) ~style_class:"controls"
        [ Menu_item.dots_menu ~key:("rrm-" ^ uuid) items ]
    ]
    ctx parent

(* cljs repos-cp remote section: hr + h2 "Remote graphs:" + refresh
   button + rows — only rendered for a logged-in user with remote
   graphs. The refresh button stays disabled while loading (e2e
   asserts the [disabled] toggle) *)
let remote_section (remote_sig : remote_graph list Signal.signal) : t =
 fun ctx parent ->
  let refreshing = Signal.state ctx.Lui_ui.ui_scheduler false in
  column ~key:"remote-sec"
    [ divider ~key:"remote-hr" ~style_class:"mt-8" []
    ; row ~key:"remote-head" ~main:`space_between ~cross:`center
        [ heading ~key:"rh" ~level:2 ~style_class:"graphs-h2"
            ~value:T.remote_graphs []
        ; button ~key:"refresh" ~text:T.refresh
            ~disabled_signal:(Signal.value refreshing)
            ~on_press:(fun _ ->
              Runtime.signal_set refreshing true;
              ignore
                ((let* _ = Graphs_ops.refresh () in
                  let* _ = refresh_remote ctx in
                  Runtime.signal_set refreshing false;
                  Js.Promise.resolve ())
                 |> Js.Promise.catch (fun _ ->
                        Runtime.signal_set refreshing false;
                        Js.Promise.resolve ())))
            []
        ]
    ; keyed ~source:remote_sig
        ~key:(fun (_, u, _, _) -> u)
        ~cmp:String.compare
        ~mount:(fun rs -> remote_row (Signal.get rs))
    ]
    ctx parent

let view (ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let remote_sig = Signal.value (remote_st ctx) in
  (* local repos minus the graphs the sync server also hosts — cljs
     combine-local-&-remote-graphs merges by :url so a downloaded
     remote renders once, under Remote graphs *)
  let local_sig =
    Signal.map2
      (fun (m : Model.t) remote ->
        let remote_names =
          List.map (fun (n, _, _, _) -> n) remote
        in
        List.filter
          (fun r -> not (List.mem (short_name r) remote_names))
          m.Model.repos)
      ms remote_sig
  in
  let remote_nonempty =
    Signal.map (fun (r : remote_graph list) -> r <> []) remote_sig
  in
  (* mount effects: repos usually arrive via Action.Repos_loaded at
     boot; a cold open of #/all-graphs refreshes once, and the remote
     list is always fetched (list_remote_graphs resolves [] logged
     out). on_repos_changed fires after remote-graph-gone broadcasts —
     keep the remote mirror in step *)
  if !Graphs_ops.repos = [] then ignore (Graphs_ops.refresh ());
  ignore (refresh_remote ctx);
  Graphs_ops.on_repos_changed :=
    (fun () -> ignore (refresh_remote ctx));
  column ~key:"graphs-root" ~style_class:"graphs-host"
    [ heading ~key:"title" ~level:1 ~style_class:"title"
        ~value:T.all_graphs []
    ; column ~key:"content" ~style_class:"content" ~padding_horizontal:4
        [ row ~key:"create-row" ~padding_vertical:32
            [ button ~key:"create" ~variant:`primary ~size:`sm
                ~text:T.create_new_graph
                ~on_press:(fun _ -> Dialogs_state.open_ "new-graph")
                []
            ]
        ; column ~key:"local"
            [ heading ~key:"lh" ~level:2 ~style_class:"graphs-h2"
                ~value:T.local_graphs []
            ; keyed ~source:local_sig ~key:(fun r -> r)
                ~cmp:String.compare
                ~mount:(fun rs -> graph_row (Signal.get rs))
            ]
        ; if_ ~test:remote_nonempty (remote_section remote_sig)
        ]
    ]
    ctx parent
