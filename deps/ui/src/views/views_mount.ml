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
   .ls-all-pages container to .cp__sidebar-main-content *)
let ensure_all_pages () =
  match !Runtime.current_route with
  | Some Model.All_pages ->
      Ed.for_each_selector ".cp__sidebar-main-content" (fun main ->
          match Ed.el_query main ".ls-all-pages" with
          | Some _ -> ()
          | None ->
              let container =
                D.h ~cls:"ls-all-pages w-full mx-auto" ()
              in
              D.el_append_child main container;
              ignore
                (Views_view.mount ~kind:V.KAllPages
                   ~owner:(W.String "$$$views") ~container)
      )
  | _ -> (
      (* route left all-pages: drop the container if LUI kept it *)
      match Ed.el_query Ed.document_element ".ls-all-pages" with
      | Some el -> D.el_remove el
      | None -> ())

(* tag/class pages get a class-objects view above the block list *)
let rec ensure_tag_page () =
  Ed.for_each_selector ".page-inner" (fun inner ->
      let tag_uuid =
        match !Runtime.current_page with
        | Some p when p.Model.page_is_tag -> p.Model.page_uuid
        | _ -> None
      in
      match tag_uuid with
      | None -> (
          match Ed.el_query inner ".ls-views-wrap" with
          | Some el -> D.el_remove el
          | None -> ())
      | Some uuid -> (
          match Ed.el_query inner ".ls-views-wrap" with
          | Some el ->
              (* remount when the page changed underneath *)
              if Ed.el_get_attr el "data-views-owner" <> Some uuid then begin
                D.el_remove el;
                ensure_tag_page_container inner uuid
              end
          | None -> ensure_tag_page_container inner uuid))

and ensure_tag_page_container inner uuid =
  let container = D.h ~cls:"ls-views-wrap w-full" () in
  D.el_set_attr container "data-views-owner" uuid;
  (* .page-blocks-inner is nested inside .ls-page-blocks, a direct child of
     .page-inner — insertBefore requires a direct-child reference node *)
  D.el_insert_before inner container
    (Ed.el_query inner ".ls-page-blocks");
  let inst =
    Views_view.mount ~kind:(V.KTagPage uuid) ~owner:(W.Uuid uuid)
      ~container
  in
  mark container inst

(* {{query ...}} blocks render a .custom-query-results shell; mount a
   query-result view inside it *)
let ensure_query_shells () =
  Ed.for_each_selector ".custom-query-results" (fun shell ->
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
              | Some _, Some _ -> ()
              | _ ->
                  let inner = D.h ~cls:"views-query-inner" () in
                  D.el_append_child shell inner;
                  let inst =
                    Views_view.mount_query ~block_uuid:buuid ~container:inner
                  in
                  mark shell inst;
                  Views_query.wire_settings_button inst shell)))

(* ---------- observer ---------- *)

(* chain onto worker.on_message once the worker exists: query views hold
   worker data outside the model, so refresh them on every
   "sync-db-changes" broadcast (same pattern as properties_state) *)
let worker_chained = ref false

let chain_worker () =
  match !worker_chained, !Runtime.worker with
  | true, _ | _, None -> ()
  | false, Some w ->
      worker_chained := true;
      let prev = w.Worker_client.on_message in
      w.Worker_client.on_message <-
        (fun kind payload ->
          (try prev kind payload with _ -> ());
          if kind = "sync-db-changes" then Views_view.refresh_query_insts ())

let scan () =
  chain_worker ();
  ensure_all_pages ();
  ensure_tag_page ();
  ensure_query_shells ()

let installed = ref false

let install () =
  if not !installed then begin
    installed := true;
    let obs = Ed.new_observer scan in
    Ed.observe obs Ed.document_element
      (Ed.observe_opts ~childList:true ~subtree:true);
    scan ()
  end
