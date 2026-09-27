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

(* ---------- ls:editor-insert (slash commands emitting text) ---------- *)

let json_str_field (j : Js.Json.t) (k : string) : string option =
  Js.Json.decodeString (Platform.json_prop j k)

let json_num_field (j : Js.Json.t) (k : string) : float option =
  Js.Json.decodeNumber (Platform.json_prop j k)

let on_editor_insert ev =
  let detail = Platform.json_prop ev "detail" in
  match json_str_field detail "text" with
  | None -> ()
  | Some text -> (
      match Editor_state.editing () with
      | None -> ()
      | Some e -> (
          match Ed.textarea_of e.Editor_state.uuid with
          | None -> ()
          | Some ta ->
              let buf = Ed.el_value ta in
              let from =
                int_of_float
                  (Option.value (json_num_field detail "from") ~default:0.)
              in
              let to_ =
                int_of_float
                  (Option.value (json_num_field detail "to") ~default:0.)
              in
              let n = String.length buf in
              let from = max 0 (min from n) and to_ = max from (min to_ n) in
              let nv =
                String.sub buf 0 from ^ text
                ^ String.sub buf to_ (n - to_)
              in
              Ed.el_set_value ta nv;
              Editor_actions.sync_buffer e.uuid nv;
              (* {{query ...}} blocks render the shell once the title is
                 committed — exit edit like cljs does *)
              if String.length text >= 8 && String.sub text 0 8 = "{{query "
              then Editor_actions.exit_edit ~select:false))

(* ---------- observer ---------- *)

let scan () =
  ensure_all_pages ();
  ensure_tag_page ();
  ensure_query_shells ()

let installed = ref false

let install () =
  if not !installed then begin
    installed := true;
    Platform.on_document_event "ls:editor-insert" on_editor_insert;
    let obs = Ed.new_observer scan in
    Ed.observe obs Ed.document_element
      (Ed.observe_opts ~childList:true ~subtree:true);
    scan ()
  end
