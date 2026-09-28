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
let ensure_all_pages () =
  match !Runtime.current_route with
  | Some Model.All_pages ->
      Ed.for_each_selector ".cp__sidebar-main-content > .mx-auto" (fun main ->
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

(* tag/class and property pages get an objects view above the block
   list (class-objects / property-objects) *)
let rec ensure_object_view () =
  Ed.for_each_selector ".page-inner" (fun inner ->
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
          match Ed.el_query inner ".ls-views-wrap" with
          | Some el -> D.el_remove el
          | None -> ())
      | Some kind -> (
          let uuid =
            match kind with
            | V.KTagPage u | V.KPropertyPage u -> u
            | _ -> ""
          in
          match Ed.el_query inner ".ls-views-wrap" with
          | Some el ->
              (* remount when the page changed underneath *)
              if Ed.el_get_attr el "data-views-owner" <> Some uuid then begin
                D.el_remove el;
                ensure_object_view_container inner uuid kind
              end
          | None -> ensure_object_view_container inner uuid kind))

and ensure_object_view_container inner uuid kind =
  (* cljs objects.cljs class-objects: [:div.ml-1 [view]] *)
  let container = D.h ~cls:"ls-views-wrap ml-1 w-full" () in
  D.el_set_attr container "data-views-owner" uuid;
  (* .page-blocks-inner is nested inside .ls-page-blocks, a direct child of
     .page-inner — insertBefore requires a direct-child reference node *)
  D.el_insert_before inner container
    (Ed.el_query inner ".ls-page-blocks");
  let inst =
    Views_view.mount ~kind ~owner:(W.Uuid uuid) ~container
  in
  mark container inst

(* logseq.class/Query blocks render a .custom-query-results shell; mount
   a query-result view inside it *)
let ensure_query_shells () =
  Ed.for_each_selector ".custom-query-results" (fun shell ->
      match mounted_id shell with
      | Some _ -> ()
      | None -> (
          match Ed.el_closest shell ".ls-block" with
          | None -> ()
          | Some block_el -> (
              match Ed.el_get_attr block_el "blockid" with
              | None -> ()
              | Some buuid ->
                  let inner = D.h ~cls:"views-query-inner" () in
                  D.el_append_child shell inner;
                  let inst =
                    Views_view.mount ~kind:(V.KQuery { block_uuid = buuid })
                      ~owner:(W.Uuid buuid) ~container:inner
                  in
                  mark shell inst;
                  Views_query.wire_settings_button inst shell)))

(* worker tx broadcast (sync-db-changes) invalidates query resources —
   re-run every still-connected query inst so results stay live *)
let refresh_query_insts () =
  Hashtbl.iter
    (fun _ (inst : V.inst) ->
      match inst.V.kind with
      | V.KQuery _ when D.el_is_connected inst.V.container ->
          Views_view.refresh inst
      | _ -> ())
    insts

(* ---------- observer ---------- *)

let scan () =
  ensure_all_pages ();
  ensure_object_view ();
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
