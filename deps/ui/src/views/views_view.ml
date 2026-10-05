(* View orchestrator — mounts a view instance inside a container element,
   loads [:views]/[:view-data] snapshots, renders head + filters + body,
   and implements view CRUD / object creation / export. *)

open Promise_ext
module D = Views_dom
module V = Views_state
module Wr = Views_wire
module W = Wire
module I = I18n
module P = Views_popup
module A = Action
module M = Model
module Db = Views_db

let feature_of_kind = function
  | V.KAllPages -> "all-pages"
  | V.KTagPage _ -> "class-objects"
  | V.KPropertyPage _ -> "property-objects"
  | V.KQuery _ -> "query-result"

let row_uuids_of (d : Wr.view_data) : string list =
  match d with
  | Wr.VFlat f -> f.rows
  | Wr.VGrouped gs -> List.concat_map (fun g -> g.Wr.grows) gs
  | Wr.VGroupedList gs ->
      List.concat_map (fun g -> List.concat_map snd g.Wr.glparts) gs
  | Wr.VEmpty -> []

let title_of_uuid inst u =
  match Hashtbl.find_opt inst.V.blocks u with
  | Some b ->
      Wr.prop_text (Option.value (W.get b "block/title") ~default:W.Nil)
  | None -> u

(* ---------- :view hiccup wire -> els ---------- *)

(* :div.foo -> ("div", "foo"); namespaced :ui/x -> "x" *)
let hiccup_tag k =
  let base =
    match String.rindex_opt k '/' with
    | Some i -> String.sub k (i + 1) (String.length k - i - 1)
    | None -> k
  in
  match String.index_opt base '.' with
  | Some i ->
      ( String.sub base 0 i
      , String.sub base (i + 1) (String.length base - i - 1)
        |> String.map (fun c -> if c = '.' then ' ' else c) )
  | None -> (base, "")

let rec hiccup_attr_value = function
  | W.String s -> s
  | W.Keyword k -> k
  | W.Int n -> string_of_int n
  | W.Int64 n -> Int64.to_string n
  | W.Float f -> Printf.sprintf "%g" f
  | W.Bool b -> string_of_bool b
  | W.Array xs | W.List xs | W.Set xs ->
      String.concat " " (List.map hiccup_attr_value xs)
  | W.Map kvs ->
      String.concat " "
        (List.map
           (fun (k, v) ->
             let kn =
               match k with W.Keyword s -> s | _ -> Edn.to_string k
             in
             kn ^ ": " ^ hiccup_attr_value v ^ ";")
           kvs)
  | w -> Edn.to_string w

(* [:tag {attrs} children...] -> element; bare uuid -> hydrated title;
   other scalars -> edn text *)
let rec hiccup_els inst (w : W.t) : D.el list =
  match w with
  | W.Array (W.Keyword tag_k :: rest) | W.List (W.Keyword tag_k :: rest) ->
      let tag, shorthand_cls = hiccup_tag tag_k in
      let attrs, children =
        match rest with
        | W.Map kvs :: tl ->
            ( List.filter_map
                (fun (k, v) ->
                  match k with
                  | W.Keyword name -> Some (name, hiccup_attr_value v)
                  | _ -> None)
                kvs
            , tl )
        | _ -> ([], rest)
      in
      let attrs =
        if shorthand_cls = "" then attrs
        else
          ("class", shorthand_cls)
          :: List.filter (fun (k, _) -> k <> "class") attrs
      in
      [ D.h ~tag ~attrs
          ~children:(List.concat_map (hiccup_els inst) children)
          () ]
  | W.Array xs | W.List xs | W.Set xs ->
      List.concat_map (hiccup_els inst) xs
  | W.String s -> [ Editor_dom.create_text_node s ]
  | W.Uuid u -> [ Editor_dom.create_text_node (title_of_uuid inst u) ]
  | w -> [ Editor_dom.create_text_node (Edn.to_string w) ]

(* ---------- render ---------- *)

let rec render inst =
  match inst.V.kind with
  | V.KQuery _ -> render_query inst
  | _ ->
      D.clear inst.V.container;
      let refresh = (V.ops ()).V.o_refresh in
      (* cljs views.cljs view: .flex.flex-col.gap-2.grid with filters-row
         as first child of .ls-view-body *)
      let grid = D.h ~cls:"flex flex-col gap-2 grid" () in
      let body =
        Views_table.render_body inst ~refresh
          ~filters:(Views_head.filters_row inst ~refresh)
          ()
      in
      D.el_append_child grid
        (Views_table.foldable inst ~refresh ~key:"view"
           ~title_el:(Views_head.render_head inst ~refresh)
           ~body:(fun () -> body));
      (* cljs: view container > div > .flex.flex-col.gap-2 > .flex.flex-col
         .gap-2.grid > foldable *)
      D.el_append_child inst.V.container
        (D.h
           ~children:
             [ D.h ~cls:"flex flex-col gap-2" ~children:[ grid ] () ]
           ())

and render_query inst =
  D.clear inst.V.container;
  let refresh = (V.ops ()).V.o_refresh in
  (* dsl queries (and blank ones) get the builder panel; datalog don't *)
  let src_kind = Views_query.parse_src inst.V.qsrc in
  (match src_kind with
   | Views_query.QDatalog _ -> ()
   | _ ->
       if not inst.V.is_advanced then
         D.el_append_child inst.V.container
           (Views_builder.builder_el inst
              ~tree:(Views_builder.tree_for inst)
              ~refresh));
  let is_dsl_blank =
    match src_kind with
    | Views_query.QBlank -> true
    | Views_query.QDsl s -> String.trim s = ""
    | _ -> false
  in
  if is_dsl_blank then ()
  else if inst.V.query_view <> W.Nil then begin
    (* :view fn output replaces the default table (cljs custom-query) *)
    List.iter (D.el_append_child inst.V.container)
      (hiccup_els inst inst.V.query_view)
  end
  else if inst.V.query_scalar_rows <> [] then begin
    let ul = D.h ~tag:"ul" () in
    List.iter
      (fun item ->
        let s =
          match item with
          | W.String s -> s
          | other -> Edn.to_string other
        in
        D.el_append_child ul (D.h ~tag:"li" ~text:s ()))
      inst.V.query_scalar_rows;
    D.el_append_child inst.V.container ul
  end
  else if inst.V.query_rows <> [] then begin
    (* block results → the query-result view *)
    let inner = D.h ~cls:"query-result w-full" () in
    D.el_append_child inner (Views_head.render_head inst ~refresh);
    (match Views_head.filters_row inst ~refresh with
     | Some r -> D.el_append_child inner r
     | None -> ());
    D.el_append_child inner (Views_table.render_body inst ~refresh ());
    D.el_append_child inst.V.container inner
  end
  else if inst.V.loading then
    D.el_append_child inst.V.container
      (D.h ~cls:"p-2 text-sm opacity-50" ~text:I.loading_ ())
  else
    D.el_append_child inst.V.container
      (D.h ~cls:"text-sm mt-2 opacity-90" ~text:I.no_matched_result ())

(* ---------- data load ---------- *)

let load_blocks inst uuids f =
  if uuids = [] then (
    Hashtbl.reset inst.V.blocks;
    f ())
  else
    Db.get_blocks uuids ~metadata:true (fun bs ->
        Hashtbl.reset inst.V.blocks;
        List.iter
          (fun b ->
            match W.map_get_uuid b "block/uuid" with
            | Some u -> Hashtbl.replace inst.V.blocks u b
            | None -> ())
          bs;
        f ())

let load_props inst f =
  if inst.V.props_loaded then f ()
  else
    Db.get_all_properties (fun props ->
        inst.V.props_loaded <- true;
        List.iter
          (fun p ->
            match
              Wr.ident_of_value
                (Option.value (W.get p "db/ident") ~default:W.Nil)
            with
            | Some id -> Hashtbl.replace inst.V.all_props id p
            | None -> ())
          props;
        f ())

let build_columns inst =
  let apply props =
    inst.V.columns <- Views_table.build_columns inst props;
    render inst
  in
  match inst.V.kind with
  | V.KTagPage owner_uuid ->
      (* cljs objects.cljs build-class-object-columns: the Asset class
         gets an extra "File" column — detect it by the class ident *)
      Db.get_blocks [ owner_uuid ] (fun ents ->
          inst.V.asset_class <-
            (match ents with
             | [ e ] ->
                 W.as_keyword
                   (Option.value (W.get e "db/ident") ~default:W.Nil)
                 = Some "logseq.class/Asset"
             | _ -> false);
          (* thread-api entity refs take lookup-refs, not bare uuids *)
          Db.get_class_properties
            (W.List [ W.Keyword "block/uuid"; W.Uuid owner_uuid ])
            apply)
  | V.KPropertyPage owner_uuid ->
      (* cljs build-property-object-columns: the property itself is the
         only property column *)
      Db.get_all_properties (fun props ->
          apply
            (List.filter
               (fun p -> W.map_get_uuid p "block/uuid" = Some owner_uuid)
               props))
  | _ -> apply []

let load_view_data inst =
  let ctx = V.ctx_of inst in
  let key = Db.key_view_data inst.V.view_uuid ctx in
  Db.snapshots
    ~f:(fun snap ->
      V.note_watch inst snap key;
      match Wr.snapshot_slot_value snap key with
      | None ->
          inst.V.data <- Wr.VEmpty;
          inst.V.loading <- false;
          render inst
      | Some v ->
          let d =
            try Wr.decode_view_data v
            with e ->
              Platform.console_error ("view-data decode failed", e);
              Wr.VEmpty
          in
          inst.V.data <- d;
          (match d with
           | Wr.VFlat { qprops; _ } -> inst.V.query_idents <- qprops
           | _ -> ());
          inst.V.loading <- false;
          let uuids =
            row_uuids_of d
            @ (match inst.V.query_view with
               | W.Nil -> []
               | v -> Views_query.collect_uuids v [])
          in
          load_blocks inst uuids (fun () ->
              load_props inst (fun () -> build_columns inst)))
    [ Db.resource_view_data inst.V.view_uuid ctx ]

let refresh inst =
  match inst.V.kind with
  | V.KQuery _ ->
      (* keep stale results visible during a refetch — only show the
         spinner when there is nothing rendered yet *)
      if inst.V.query_rows = [] then inst.V.loading <- true;
      render inst;
      Views_query.refresh_block inst (fun () ->
          Views_query.run inst (fun () ->
              if inst.V.query_rows <> [] then load_view_data inst
              else begin
                inst.V.loading <- false;
                render inst
              end))
  | _ ->
      inst.V.loading <- true;
      render inst;
      load_view_data inst

(* ---------- view selection / CRUD ---------- *)

let select_view inst v =
  V.apply_view_entity inst v;
  inst.V.selected <- V.Sset.empty;
  refresh inst

let load_views inst ~on_done =
  let key = Db.key_views inst.V.owner inst.V.feature in
  Db.snapshots
    ~f:(fun snap ->
      V.note_watch inst snap key;
      match Wr.snapshot_slot_value snap key with
      | Some (W.Array uuids) | Some (W.List uuids) -> (
          let us = List.filter_map W.as_uuid uuids in
          Db.get_blocks us ~metadata:true (fun ents ->
              (* get_blocks order is storage order — tabs follow the
                 resource's uuid order (cljs view-uuids), which also picks
                 the default view (first tab) *)
              let by_uuid = Hashtbl.create (List.length us) in
              List.iter
                (fun e ->
                  match Wr.decode_view_ent e with
                  | Some v -> Hashtbl.replace by_uuid v.Wr.vu v
                  | None -> ())
                ents;
              inst.V.views <-
                List.filter_map (Hashtbl.find_opt by_uuid) us;
              on_done ()))
      | _ -> on_done ())
    [ Db.resource_views inst.V.owner inst.V.feature ]

(* resolve the uuid of the owner page/entity behind inst.owner *)
let owner_uuid inst f =
  match inst.V.owner with
  | W.Uuid u -> f u
  | W.String name -> (
      let key = Db.key_page_identity name in
      Db.snapshots
        ~f:(fun snap ->
          V.note_watch inst snap key;
          match Wr.snapshot_slot_value snap key with
          | Some (W.Uuid u) -> f u
          | _ -> ())
        [ Db.res key ])
  | _ -> ()

(* cljs create-view! parents view blocks under the shared $$$views page
   (common-config/views-page-name) and skips the insert when that page
   cannot be resolved *)
let views_page_uuid f =
  let key = Db.key_page_identity "$$$views" in
  Db.snapshots
    ~f:(fun snap ->
      match Wr.snapshot_slot_value snap key with
      | Some (W.Uuid u) -> f (Some u)
      | _ -> f None)
    [ Db.res key ]

let create_view ~title ~uuid inst ~after =
  owner_uuid inst (fun ouuid ->
      views_page_uuid (function
        | Some vpuuid ->
            Db.insert_view_block ~title ~uuid ~page_uuid:vpuuid
              ~owner_uuid:ouuid ~feature_type:inst.V.feature
              ~after:(fun () ->
                load_views inst ~on_done:(fun () -> after ())) ()
        | None -> ()))

(* auto-create the default "All" view (cljs create-view! auto-triggered?) *)
let ensure_default_view inst =
  match inst.V.views with
  | v :: _ -> select_view inst v
  | [] ->
      owner_uuid inst (fun ouuid ->
          let uuid =
            Db.gen_view_uuid ~owner:ouuid ~feature_type:inst.V.feature
          in
          views_page_uuid (function
            | Some vpuuid ->
                Db.insert_view_block ~title:I.all ~uuid ~page_uuid:vpuuid
                  ~owner_uuid:ouuid ~feature_type:inst.V.feature
                  ~after:(fun () ->
                    load_views inst ~on_done:(fun () ->
                        match inst.V.views with
                        | v :: _ -> select_view inst v
                        | [] ->
                            inst.V.view_uuid <- uuid;
                            refresh inst)) ()
            | None -> ()))

(* ---------- actions ---------- *)

let rename_view inst (v : Wr.view_ent) anchor =
  let input =
    D.h ~tag:"input"
      ~cls:"cp__select-input w-full !p-1.5"
      ~attrs:[ ("type", "text") ] ()
  in
  D.el_set_value input v.Wr.vtitle;
  let wrap = D.h ~cls:"block-title-wrap p-2" ~children:[ input ] () in
  let commit () =
    let t = Editor_dom.el_value input in
    P.close_all ();
    Db.save_block_title v.Wr.vu t (fun () ->
        load_views inst ~on_done:(fun () -> refresh inst))
  in
  D.el_add_listener input "keydown" (fun ev ->
      match Editor_dom.ev_key ev with
      | "Enter" ->
          Editor_dom.prevent_default ev;
          commit ()
      | "Escape" -> P.close_all ()
      | _ -> ());
  ignore (P.show_menu ~anchor [ P.MCustom wrap ]);
  D.focus_end input

let export_edn inst =
  let s =
    inst.V.blocks |> Hashtbl.to_seq_values |> List.of_seq
    |> List.map (fun b -> Edn.to_string b)
    |> String.concat "\n"
  in
  ignore
    (let* () = D.clipboard_write s in
     Runtime.send
       (A.Toast_push
          { M.toast_id = 0; toast_key = None; toast_text = I.copied_view_nodes
          ; toast_kind = "success" });
     Js.Promise.resolve ())

let add_new_object inst =
  match inst.V.kind with
  | V.KTagPage owner_uuid -> (
      let uuid = Platform.random_uuid () in
      Db.insert_object_block ~uuid ~page_uuid:owner_uuid ~title:""
        ~tags:[ owner_uuid ] ~props:[] (fun _ ->
          let detail = Js.Dict.empty () in
          Js.Dict.set detail "uuid" (Js.Json.string uuid);
          D.dispatch_custom "ls:open-right-sidebar"
            (Js.Json.object_ detail);
          let rec try_edit n =
            if n <= 0 then ()
            else
              match
                Editor_dom.get_element_by_id ("ls-block-" ^ uuid)
              with
              | Some _ -> Editor_actions.enter_edit ~scope:"sidebar" uuid 0
              | None ->
                  Editor_dom.set_timeout (fun () -> try_edit (n - 1)) 100
          in
          try_edit 20))
  | _ -> ()

let install_ops () =
  V.install_ops
    { V.o_refresh = (fun inst -> refresh inst)
    ; o_refresh_src =
        (fun inst src ->
          (* the caller supplies the fresh query source — skip the
             get_blocks re-read and evaluate immediately; render the
             result header/count as soon as rows land instead of waiting
             for the row-data roundtrip *)
          inst.V.qsrc <- src;
          inst.V.loading <- false;
          Views_query.run inst (fun () ->
              render inst;
              if inst.V.query_rows <> [] then load_view_data inst))
    ; o_create_view =
        (fun inst ->
          let uuid = Platform.random_uuid () in
          create_view ~title:"" ~uuid inst ~after:(fun () ->
              match
                List.find_opt (fun v -> v.Wr.vu = uuid) inst.V.views
              with
              | Some v -> select_view inst v
              | None -> refresh inst))
    ; o_rename =
        (fun inst v ->
          let anchor =
            match
              D.query_inside inst.V.container
                ("[data-view-tab-id='view-tab-" ^ v.Wr.vu ^ "']")
            with
            | Some a -> a
            | None -> inst.V.container
          in
          rename_view inst v anchor)
    ; o_export = export_edn
    ; o_add_object = add_new_object
    ; o_title_of_uuid = title_of_uuid
    }

(* ---------- mount ---------- *)

(* one inst per {{query}} block: the block row is rebuilt on every save, so
   a new .custom-query-results shell re-attaches the existing inst instead
   of leaving a stale duplicate mounted *)
let query_insts : (string, V.inst) Hashtbl.t = Hashtbl.create 8

let mount ~kind ~owner ~container : V.inst =
  let feature = feature_of_kind kind in
  let inst = V.make ~kind ~feature ~owner ~container in
  (match kind with
   | V.KQuery { block_uuid } ->
       Hashtbl.replace query_insts block_uuid inst;
       inst.V.is_advanced <-
         (let t = String.trim inst.V.qsrc in
          String.length t > 0 && t.[0] = '{');
       inst.V.view_uuid <-
         (match kind with V.KQuery { block_uuid } -> block_uuid | _ -> "");
       refresh inst
   | _ ->
       load_views inst ~on_done:(fun () -> ensure_default_view inst));
  inst

(* mount a query-result view for `block_uuid`: reuse the existing inst when
   the shell was rebuilt, re-pointing it at the new inner container *)
let mount_query ~block_uuid ~container : V.inst =
  match Hashtbl.find_opt query_insts block_uuid with
  | Some inst ->
      inst.V.container <- container;
      refresh inst;
      inst
  | None ->
      mount ~kind:(V.KQuery { block_uuid }) ~owner:(W.Uuid block_uuid)
        ~container

(* re-run every mounted query view — called on the worker's
   "sync-db-changes" broadcast so result membership updates live;
   debounced so a burst of tx broadcasts coalesces into one refetch *)
let debounced_refresh_queries = D.debounce 150

let refresh_query_insts affected =
  debounced_refresh_queries (fun () ->
      let dead = ref [] in
      Hashtbl.iter
        (fun uuid inst ->
          if not (D.el_is_connected inst.V.container) then
            dead := uuid :: !dead
          else if V.inst_hits inst affected then refresh inst)
        query_insts;
      (* drop insts whose query block is gone — mount_query re-creates an
         equivalent inst from worker state if the block re-renders *)
      List.iter
        (fun uuid ->
          match Hashtbl.find_opt query_insts uuid with
          | Some inst ->
              Views_builder.drop_tree inst;
              Hashtbl.remove query_insts uuid
          | None -> ())
        !dead)

let () = install_ops ()
