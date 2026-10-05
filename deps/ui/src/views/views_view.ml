(* View orchestrator — [view ~kind ~owner] is a Lui_elements.t the mount
   sites inline into their own trees (all-pages route, tag/property
   .page-tabs, right-sidebar object tabs, .custom-query-results shells).
   The element owns the inst lifecycle (create on mount, dispose on
   unmount), kicks the data-load chain, and implements view CRUD /
   object creation / export. The body repaints through a dyn on the
   vstate signal — nothing scans the DOM to find mounted views. *)

open Promise_ext
module D = Logseq_dom
module E = Web_dom
module V = Views_state
module Wr = Views_wire
module W = Wire
module I = I18n
module P = Views_popup
module A = Action
module M = Model
module Db = Views_db

type t = Lui_elements.t

let dom = D.dom
let sig_of (inst : V.inst) : V.vstate Signal.signal =
  inst.V.st.Signal.state_signal

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
  match Hashtbl.find_opt (V.get inst).V.blocks u with
  | Some b ->
      Wr.prop_text (Option.value (W.get b "block/title") ~default:W.Nil)
  | None -> u

(* ---------- :view hiccup wire -> elements ---------- *)

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
let rec hiccup_els inst (w : W.t) : t list =
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
      [ dom ~tag ~attrs (List.concat_map (hiccup_els inst) children) ]
  | W.Array xs | W.List xs | W.Set xs ->
      List.concat_map (hiccup_els inst) xs
  | W.String s ->
      [ dom ~tag:"raw-text" ~attrs:[ ("data-raw-text", s) ] [] ]
  | W.Uuid u ->
      [ dom ~tag:"raw-text" ~attrs:[ ("data-raw-text", title_of_uuid inst u) ]
          [] ]
  | w -> [ dom ~tag:"raw-text" ~attrs:[ ("data-raw-text", Edn.to_string w) ] [] ]

(* ---------- elements ---------- *)

(* remount key for the body segment: row-relevant fields only — selection,
   collapsed groups, search input and popup state stay reactive inside a
   mounted body instead of rebuilding it *)
let body_eq (a : V.vstate) (b : V.vstate) =
  a.V.data = b.V.data
  && a.V.blocks == b.V.blocks
  && a.V.display_type = b.V.display_type
  && a.V.columns = b.V.columns
  && a.V.hidden = b.V.hidden
  && a.V.ordered = b.V.ordered
  && a.V.pinned = b.V.pinned
  && a.V.group_by = b.V.group_by
  && a.V.group_sort_by = b.V.group_sort_by
  && a.V.group_desc = b.V.group_desc
  && a.V.sorting = b.V.sorting
  && a.V.filters = b.V.filters
  && a.V.filters_or = b.V.filters_or
  && a.V.loading = b.V.loading
  && a.V.query_rows = b.V.query_rows
  && a.V.query_scalar_rows = b.V.query_scalar_rows
  && a.V.query_view = b.V.query_view
  && a.V.query_error = b.V.query_error
  && a.V.is_advanced = b.V.is_advanced
  && a.V.qsrc = b.V.qsrc
  && a.V.view_uuid = b.V.view_uuid
  && a.V.views = b.V.views
  && a.V.asset_class = b.V.asset_class

(* cljs views.cljs view: view container > div > .flex.flex-col.gap-2 >
   .flex.flex-col.gap-2.grid > foldable(key="view") with the whole body
   inside ls-foldable-content *)
let view_el inst : t =
  dom
    [ dom ~style_class:"flex flex-col gap-2"
        [ dom ~style_class:"flex flex-col gap-2 grid"
            [ Views_table.foldable inst ~key:"view"
                ~title:(Views_head.render_head inst)
                ~body:
                  (D.dyn ~equal:body_eq
                     (fun s ->
                       Views_table.body_el inst s
                         ~filters:(Views_head.filters_row inst))
                     (sig_of inst))
            ]
        ]
    ]

(* cljs custom-query: .views-query-inner holds [builder?; results] —
   the :view hiccup / scalar list / query-result table / loading /
   empty states — and the raw-source .CodeMirror editor is a sibling of
   the inner inside .custom-query-results *)
let query_content inst (s : V.vstate) : t =
  let is_dsl_blank =
    match Views_query.parse_src s.V.qsrc with
    | Views_query.QBlank -> true
    | Views_query.QDsl d -> String.trim d = ""
    | _ -> false
  in
  if is_dsl_blank then D.nothing
  else if s.V.query_view <> W.Nil then
    (* :view fn output replaces the default table (cljs custom-query) *)
    D.fragment (hiccup_els inst s.V.query_view)
  else if s.V.query_scalar_rows <> [] then
    dom ~tag:"ul"
      (List.map
         (fun item ->
           let text =
             match item with
             | W.String s -> s
             | other -> Edn.to_string other
           in
           dom ~tag:"li" ~text [])
         s.V.query_scalar_rows)
  else if s.V.query_rows <> [] || not s.V.loading then
    (* block results → the query-result view. cljs renders the foldable
       live-query shell ("Live query (n)" head + view-actions + table)
       even when the result is empty — only the loading state replaces
       it *)
    dom ~style_class:"query-result w-full"
      [ dom ~style_class:"flex flex-col gap-2"
          [ dom ~style_class:"flex flex-col gap-2 grid"
              [ Views_table.foldable inst ~key:"qr"
                  ~title:(Views_head.render_head inst)
                  ~body:
                    (Views_table.body_el inst s
                       ~filters:(Views_head.filters_row inst))
              ]
          ]
      ]
  else if s.V.loading then
    dom ~style_class:"p-2 text-sm opacity-50" ~text:I.loading_ []
  else dom ~style_class:"text-sm mt-2 opacity-90" ~text:I.no_matched_result []

let query_view_el inst : t =
  D.fragment
    [ dom ~style_class:"views-query-inner"
        [ D.dyn ~equal:body_eq
            (fun s ->
              dom
                [ (* dsl queries (and blank ones) get the builder panel;
                     datalog don't *)
                  (match Views_query.parse_src s.V.qsrc with
                   | Views_query.QDatalog _ -> D.nothing
                   | _ ->
                       if s.V.is_advanced then D.nothing
                       else
                         Views_builder.builder_el inst
                           ~tree:(Views_builder.tree_for inst))
                ; query_content inst s
                ])
            (sig_of inst)
        ]
    ; Views_query.cm_host inst
    ]

(* ---------- data load ---------- *)

let load_blocks inst uuids f =
  if uuids = [] then (
    V.update inst (fun s -> { s with V.blocks = Hashtbl.create 64 });
    f ())
  else
    Db.get_blocks uuids ~metadata:true (fun bs ->
        let blocks = Hashtbl.create 64 in
        List.iter
          (fun b ->
            match W.map_get_uuid b "block/uuid" with
            | Some u -> Hashtbl.replace blocks u b
            | None -> ())
          bs;
        V.update inst (fun s -> { s with V.blocks });
        f ())

let load_props inst f =
  if (V.get inst).V.props_loaded then f ()
  else
    Db.get_all_properties (fun props ->
        let all_props = Hashtbl.create 17 in
        List.iter
          (fun p ->
            match
              Wr.ident_of_value
                (Option.value (W.get p "db/ident") ~default:W.Nil)
            with
            | Some id -> Hashtbl.replace all_props id p
            | None -> ())
          props;
        V.update inst (fun s -> { s with V.props_loaded = true; all_props });
        f ())

let build_columns inst =
  let apply props =
    let columns = Views_table.build_columns inst props in
    V.update inst (fun s -> { s with V.columns })
  in
  match inst.V.kind with
  | V.KTagPage owner_uuid ->
      (* cljs objects.cljs build-class-object-columns: the Asset class
         gets an extra "File" column — detect it by the class ident *)
      Db.get_blocks [ owner_uuid ] (fun ents ->
          let asset_class =
            match ents with
            | [ e ] ->
                W.as_keyword
                  (Option.value (W.get e "db/ident") ~default:W.Nil)
                = Some "logseq.class/Asset"
            | _ -> false
          in
          V.update inst (fun s -> { s with V.asset_class });
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
  let view_uuid = (V.get inst).V.view_uuid in
  let key = Db.key_view_data view_uuid ctx in
  Db.snapshots
    ~f:(fun snap ->
      match Wr.snapshot_slot_value snap key with
      | None -> V.update inst (fun s -> { s with V.data = Wr.VEmpty; loading = false })
      | Some v ->
          let d =
            try Wr.decode_view_data v
            with e ->
              Platform.console_error ("view-data decode failed", e);
              Wr.VEmpty
          in
          V.update inst (fun s ->
              { s with
                V.data = d
              ; loading = false
              ; query_idents =
                  (match d with
                   | Wr.VFlat { qprops; _ } -> qprops
                   | _ -> s.V.query_idents)
              });
          let uuids =
            (* group-value entity uuids ride along — the group header
               titles resolve through inst.blocks like row titles *)
            row_uuids_of d
            @ (match d with
               | Wr.VGrouped gs ->
                   List.filter_map
                     (fun g -> Wr.group_value_uuid g.Wr.gv)
                     gs
               | Wr.VGroupedList gs ->
                   List.filter_map
                     (fun g -> Wr.group_value_uuid g.Wr.glv)
                     gs
               | _ -> [])
            @ (match (V.get inst).V.query_view with
               | W.Nil -> []
               | v -> Views_query.collect_uuids v [])
          in
          load_blocks inst uuids (fun () ->
              load_props inst (fun () -> build_columns inst)))
    [ Db.resource_view_data view_uuid ctx ]

let refresh inst =
  match inst.V.kind with
  | V.KQuery _ ->
      (* keep stale results visible during a refetch — only show the
         spinner when there is nothing rendered yet *)
      if (V.get inst).V.query_rows = [] then
        V.update inst (fun s -> { s with V.loading = true });
      Views_query.refresh_block inst (fun () ->
          Views_query.run inst (fun () ->
              if (V.get inst).V.query_rows <> [] then load_view_data inst
              else V.update inst (fun s -> { s with V.loading = false })))
  | _ ->
      V.update inst (fun s -> { s with V.loading = true });
      load_view_data inst

(* ---------- view selection / CRUD ---------- *)

let select_view inst v =
  V.update inst (fun s ->
      { (V.apply_view_entity s v) with V.selected = V.Sset.empty });
  refresh inst

let load_views inst ~on_done =
  let key = Db.key_views inst.V.owner inst.V.feature in
  Db.snapshots
    ~f:(fun snap ->
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
              V.update inst (fun s ->
                  { s with
                    V.views = List.filter_map (Hashtbl.find_opt by_uuid) us
                  });
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
  match (V.get inst).V.views with
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
                        match (V.get inst).V.views with
                        | v :: _ -> select_view inst v
                        | [] ->
                            V.update inst
                              (fun s -> { s with V.view_uuid = uuid });
                            refresh inst)) ()
            | None -> ()))

(* ---------- actions ---------- *)

let rename_view inst (v : Wr.view_ent) anchor =
  let input =
    E.h ~tag:"input"
      ~cls:"cp__select-input w-full !p-1.5"
      ~attrs:[ ("type", "text") ] ()
  in
  E.el_set_value input v.Wr.vtitle;
  let wrap = E.h ~cls:"block-title-wrap p-2" ~children:[ input ] () in
  let commit () =
    let t = E.el_value input in
    P.close_all ();
    Db.save_block_title v.Wr.vu t (fun () ->
        load_views inst ~on_done:(fun () -> refresh inst))
  in
  E.el_on input "keydown" (fun ev ->
      match E.ev_key ev with
      | "Enter" ->
          E.ev_prevent_default ev;
          commit ()
      | "Escape" -> P.close_all ()
      | _ -> ());
  ignore (P.show_menu ~anchor [ P.MCustom wrap ]);
  E.el_focus input

let export_edn inst =
  let s =
    (V.get inst).V.blocks |> Hashtbl.to_seq_values |> List.of_seq
    |> List.map (fun b -> Edn.to_string b)
    |> String.concat "\n"
  in
  ignore
    (let* () = Platform.clipboard_write_text s in
     Runtime.send
       (A.Toast_push
          { M.toast_id = 0; toast_key = None; toast_text = I.copied_view_nodes
          ; toast_kind = "success" });
     Js.Promise.resolve ())

let add_new_object inst =
  match inst.V.kind with
  | V.KTagPage owner_uuid ->
      let uuid = Platform.random_uuid () in
      Db.insert_object_block ~uuid ~page_uuid:owner_uuid ~title:""
        ~tags:[ owner_uuid ] ~props:[] (fun _ ->
          let detail = Js.Dict.empty () in
          Js.Dict.set detail "uuid" (Js.Json.string uuid);
          E.dispatch_custom "ls:open-right-sidebar"
            (Js.Json.object_ detail);
          let rec try_edit n =
            if n <= 0 then ()
            else
              match E.get_element_by_id ("ls-block-" ^ uuid) with
              | Some _ -> Editor_actions.enter_edit ~scope:"sidebar" uuid 0
              | None -> E.set_timeout (fun () -> try_edit (n - 1)) 100
          in
          try_edit 20)
  | _ -> ()

let install_ops () =
  V.install_ops
    { V.o_refresh = refresh
    ; o_refresh_src =
        (fun inst src ->
          (* the caller supplies the fresh query source — skip the
             get_blocks re-read and evaluate immediately; the dyn repaints
             as soon as rows land instead of waiting for the row-data
             roundtrip *)
          V.update inst
            (fun s -> { s with V.qsrc = src; loading = false });
          Views_query.run inst (fun () ->
              if (V.get inst).V.query_rows <> [] then load_view_data inst))
    ; o_create_view =
        (fun inst ->
          let uuid = Platform.random_uuid () in
          create_view ~title:"" ~uuid inst ~after:(fun () ->
              match
                List.find_opt (fun v -> v.Wr.vu = uuid) (V.get inst).V.views
              with
              | Some v -> select_view inst v
              | None -> refresh inst))
    ; o_rename =
        (fun inst v ->
          match
            E.get_element_by_id (Views_head.view_tab_anchor_id inst v)
          with
          | Some anchor -> rename_view inst v anchor
          | None -> ())
    ; o_export = export_edn
    ; o_add_object = add_new_object
    ; o_title_of_uuid = title_of_uuid
    }

(* ---------- mount ---------- *)

(* one inst per {{query}} block: the block row is rebuilt on every save, so
   a new .custom-query-results shell re-attaches the existing inst instead
   of leaving a stale duplicate mounted *)
let query_insts : (string, V.inst) Hashtbl.t = Hashtbl.create 8

(* currently-mounted insts — refreshed on the worker's sync-db-changes
   broadcast; an inst leaves the table when its host unmounts *)
let live : (int, V.inst) Hashtbl.t = Hashtbl.create 16

let view ~kind ~owner : t =
 fun ctx parent ->
  let sched = ctx.Lui_ui.ui_scheduler in
  let inst, fresh =
    match kind with
    | V.KQuery { block_uuid } -> (
        match Hashtbl.find_opt query_insts block_uuid with
        | Some inst -> (inst, false)
        | None ->
            let inst =
              V.make ~sched ~kind ~feature:(feature_of_kind kind) ~owner
            in
            Hashtbl.replace query_insts block_uuid inst;
            (* staged, not flushed — V.update flushes, and a flush inside
               the element mount corrupts the pending op stream *)
            Signal.set inst.V.st
              { (V.get inst) with
                V.is_advanced =
                  (let t = String.trim (V.get inst).V.qsrc in
                   String.length t > 0 && t.[0] = '{')
              ; view_uuid = block_uuid
              };
            (inst, true))
    | _ ->
        (V.make ~sched ~kind ~feature:(feature_of_kind kind) ~owner, true)
  in
  Hashtbl.replace live inst.V.id inst;
  (* defer to post-mount: refresh flushes signals, which must not run
     while the mount is still emitting ops (a microtask, so the current
     mount + its enclosing flush settle first) *)
  ignore
    Js.Promise.(
      resolve ()
      |> then_ (fun () ->
          (match kind, fresh with
           | V.KQuery _, _ -> refresh inst
           | _, true ->
               load_views inst ~on_done:(fun () ->
                   ensure_default_view inst)
           | _ -> ());
          resolve ()));
  Signal.on_dispose ctx.Lui_ui.ui_scope (fun () ->
      Hashtbl.remove live inst.V.id;
      match inst.V.kind with
      | V.KQuery _ -> ()
      | _ -> Views_builder.drop_tree inst);
  (match inst.V.kind with
   | V.KQuery _ -> query_view_el inst
   | _ -> view_el inst)
    ctx parent

(* toggle the raw-source editor for the query block's view — called by
   the .ls-query-setting button render.ml emits inside
   .custom-query-results *)
let toggle_query_editor ~block_uuid =
  match Hashtbl.find_opt query_insts block_uuid with
  | Some inst -> Views_query.toggle_source_editor inst
  | None -> ()

(* re-run every mounted view — subscribed to the worker's
   "sync-db-changes" broadcast (Runtime.on_sync, run by worker_events) so
   result membership updates live; debounced so a burst of tx broadcasts
   coalesces into one refetch *)
let debounced_refresh = E.debounce 150

let refresh_live_insts () =
  debounced_refresh (fun () ->
      Hashtbl.iter (fun _ inst -> refresh inst) live)

let () =
  install_ops ();
  ignore (Runtime.on_sync (fun _ -> refresh_live_insts ()))
