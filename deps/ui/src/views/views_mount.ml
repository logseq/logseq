(* Mount points for the views system. The LUI view tree renders plain
   shells (.cp__sidebar-main-content / .page-inner / .custom-query-results);
   a MutationObserver watches for them and attaches view instances, like
   blocks/add_button.ml does. js_app/main.ml must call [install]. *)

module D = Views_dom
module V = Views_state
module W = Wire
module Ed = Editor_dom

let next_id = ref 0

(* live instances keyed by the container's data-views-inst id *)
let insts : (int, V.inst) Hashtbl.t = Hashtbl.create 16

let mounted_id el =
  match Ed.el_get_attr el "data-views-inst" with
  | Some s -> ( try Some (int_of_string s) with _ -> None )
  | None -> None

let mark el inst =
  next_id := !next_id + 1;
  D.el_set_attr el "data-views-inst" (string_of_int !next_id);
  Hashtbl.replace insts !next_id inst

(* ---------- mount points ---------- *)

(* all-pages route: page.ml renders an empty graphs-view box; append the
   .ls-all-pages container into the .mx-auto.pb-24 content wrapper, like
   cljs all_pages.cljs which renders inside the page wrapper *)
let ensure_all_pages roots =
  match !Runtime.current_route with
  | Some Model.All_pages ->
      Ed.for_each_touched roots ".cp__sidebar-main-content > .mx-auto" (fun main ->
          match
            (Ed.el_query main ".ls-all-pages", Ed.el_closest main ".ls-all-pages")
          with
          | Some _, _ | _, Some _ -> ()
          | None, None ->
              (* no mx-auto here — the anchor wrapper already centers, and
                 under the native engine's descendant-style '>' matching an
                 mx-auto container would re-match the anchor selector *)
              let container = D.h ~cls:"ls-all-pages w-full" () in
              D.el_append_child main container;
              ignore
                (Views_view.mount ~kind:V.KAllPages
                   ~owner:(W.String "$$$views") ~container)
      )
  | _ ->
      (* route left all-pages: drop the container if LUI kept it *)
      (match Ed.el_query Ed.document_element ".ls-all-pages" with
       | Some el -> D.el_remove el
       | None -> ())

(* right-sidebar items render their own .page-inner (data-sb-inner);
   their objects view mounts into the emitted .ml-1 host off
   data-sb-views-owner / data-sb-kind instead of the route page *)
let ensure_sidebar_object_view inner =
  match Ed.el_query inner ".ml-1[data-sb-views-owner]" with
  | None -> ()
  | Some container -> (
      match mounted_id container with
      | Some _ -> ()
      | None -> (
          match
            ( Ed.el_get_attr container "data-sb-views-owner"
            , Ed.el_get_attr container "data-sb-kind" )
          with
          | Some uuid, Some "tag" ->
              let inst =
                Views_view.mount ~kind:(V.KTagPage uuid)
                  ~owner:(W.Uuid uuid) ~container
              in
              mark container inst
          | Some uuid, _ ->
              let inst =
                Views_view.mount ~kind:(V.KPropertyPage uuid)
                  ~owner:(W.Uuid uuid) ~container
              in
              mark container inst
          | _ -> ()))

(* tag/class and property pages get an objects view above the block
   list (class-objects / property-objects) *)
let rec ensure_object_view roots =
  Ed.for_each_touched roots ".page-inner" (fun inner ->
      match Ed.el_get_attr inner "data-sb-inner" with
      | Some _ -> ensure_sidebar_object_view inner
      | None -> (
      let kind =
        match !Runtime.current_page with
        | Some p when p.Model.page_is_tag ->
            Option.map (fun u -> V.KTagPage u) p.Model.page_uuid
        | Some p when p.Model.page_is_property ->
            Option.map (fun u -> V.KPropertyPage u) p.Model.page_uuid
        | _ -> None
      in
      match kind with
      | None -> (
          match Ed.el_query inner ".page-tabs" with
          | Some el -> D.el_remove el
          | None -> ())
      | Some kind -> (
          let uuid =
            match kind with
            | V.KTagPage u | V.KPropertyPage u -> u
            | _ -> ""
          in
          match Ed.el_query inner ".page-tabs" with
          | Some el ->
              (* remount when the page changed underneath *)
              if Ed.el_get_attr el "data-views-owner" <> Some uuid then begin
                D.el_remove el;
                ensure_object_view_container inner uuid kind
              end
          | None -> ensure_object_view_container inner uuid kind))
      )

and ensure_object_view_container inner uuid kind =
  (* cljs page.cljs: tag/property objects live inside
     .page-tabs > .w-full > .ui__tabs-content > .ml-1 (objects.cljs) *)
  let container = D.h ~cls:"ml-1" () in
  let tabpanel =
    D.h
      ~cls:"ui__tabs-content mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      ~attrs:
        [ ("data-orientation", "horizontal"); ("role", "tabpanel")
        ; ("tabindex", "0"); ("data-index", "0") ]
      ~children:[ container ] ()
  in
  let tabs =
    D.h ~cls:"w-full"
      ~attrs:
        [ ("data-orientation", "horizontal")
        ; ("data-activation-direction", "none") ]
      ~children:[ tabpanel ] ()
  in
  let wrapper =
    D.h ~cls:"page-tabs"
      ~attrs:[ ("data-views-owner", uuid) ] ~children:[ tabs ] ()
  in
  (* .page-blocks-inner is nested inside .ls-page-blocks, a direct child of
     .page-inner — insertBefore requires a direct-child reference node *)
  D.el_insert_before inner wrapper (Ed.el_query inner ".ls-page-blocks");
  let inst =
    Views_view.mount ~kind ~owner:(W.Uuid uuid) ~container
  in
  mark container inst

(* mount a query-result view for `block_uuid` inside `shell` and mark the
   shell — returns the inst on success *)
let mount_query_shell ~block_uuid shell =
  let inner = D.h ~cls:"views-query-inner" () in
  D.el_append_child shell inner;
  try
    let inst =
      Views_view.mount_query ~block_uuid ~container:inner
    in
    mark shell inst;
    Some inst
  with e ->
    Platform.console_error ("mount_query exn: " ^ Printexc.to_string e);
    None

(* logseq.class/Query blocks render a .custom-query-results shell; mount
   a query-result view inside it *)
let ensure_query_shells roots =
  Ed.for_each_touched roots ".custom-query-results" (fun shell ->
      match Ed.el_closest shell ".ls-block" with
      | None -> ()
      | Some block_el -> (
          match Ed.el_get_attr block_el "blockid" with
          | None -> ()
          | Some buuid -> (
              (* a mounted shell must still contain its inner — DOM patching
                 can rebuild a shell's children while keeping the marker *)
              match
                (mounted_id shell, Ed.el_query shell ".views-query-inner")
              with
              | Some id, Some _ -> (
                  (* DOM patching can rebuild the shell's children while
                     keeping the marker — restore the source editor when
                     the inst says it was open *)
                  match Hashtbl.find_opt insts id with
                  | Some inst
                    when inst.V.query_editor_open
                         && Ed.el_query shell ".CodeMirror" = None ->
                      Views_query.open_editor inst shell
                  | _ -> ())
              | _ -> (
                  match mount_query_shell ~block_uuid:buuid shell with
                  | Some inst ->
                      (* a page remount rebuilt the shell — restore the raw
                         source editor if it was open before the rebuild *)
                      if inst.V.query_editor_open then
                        Views_query.open_editor inst shell
                  | None -> ()))))

(* worker tx broadcast (sync-db-changes) invalidates view resources —
   refresh every still-connected inst so rows/columns stay live (cljs
   refetches the view-data resource on each tx) *)
(* debounced: a sync-db-changes burst should coalesce into one view
   refetch — the reload debounce in worker_events already collapses the
   page side *)
let debounced_refresh = D.debounce 150

let refresh_query_insts () =
  debounced_refresh (fun () ->
      let dead = ref [] in
      Hashtbl.iter
        (fun id (inst : V.inst) ->
          if not (D.el_is_connected inst.V.container) then dead := id :: !dead
          else
            match inst.V.kind with
            | V.KQuery _ ->
                (* query insts are refreshed through
                   Views_view.refresh_query_insts — running them again here
                   would refetch twice per broadcast *)
                ()
            | _ -> Views_view.refresh inst)
        insts;
      (* a detached container never comes back — the observer mounts a
         fresh inst when the route re-renders — so drop the bookkeeping
         instead of leaking the inst's rows/caches *)
      List.iter
        (fun id ->
          match Hashtbl.find_opt insts id with
          | Some inst ->
              Views_builder.drop_tree inst;
              Hashtbl.remove insts id
          | None -> ())
        !dead)

(* ---------- observer ---------- *)

(* query views hold worker data outside the model, so they refresh on
   every "sync-db-changes" broadcast via the shared subscription list *)
let worker_chained = ref false

let chain_worker () =
  if not !worker_chained then begin
    worker_chained := true;
    Runtime.on_sync (fun () -> Views_view.refresh_query_insts ())
  end

let scan roots =
  chain_worker ();
  ensure_all_pages roots;
  ensure_object_view roots;
  ensure_query_shells roots

let installed = ref false

(* delegated click handler for every `.ls-query-setting` button —
   per-shell wiring raced with clicks arriving before the mutation scan
   ran, so the inst is resolved at click time instead *)
let on_document_click (ev : Ed.ev) =
  match Ed.ev_target ev with
  | None -> ()
  | Some target -> (
      match Ed.el_closest target ".ls-query-setting" with
      | None -> ()
      | Some btn -> (
          Ed.stop_propagation ev;
          match Ed.el_closest btn ".custom-query-results" with
          | None -> ()
          | Some shell -> (
              let inst =
                match mounted_id shell with
                | Some id -> Hashtbl.find_opt insts id
                | None -> (
                    (* click beat the mutation scan — mount now *)
                    match Ed.el_closest shell ".ls-block" with
                    | Some block_el -> (
                        match Ed.el_get_attr block_el "blockid" with
                        | Some buuid ->
                            mount_query_shell ~block_uuid:buuid shell
                        | None -> None)
                    | None -> None)
              in
              match inst with
              | Some inst -> Views_query.toggle_source_editor inst shell
              | None -> ())))

let install () =
  if not !installed then begin
    installed := true;
    Ed.document_add_listener "click" on_document_click false;
    Views_popup.install_listeners ();
    Ed.register_doc_scan scan
  end
