(* View orchestrator — [view ~kind ~owner] is a Lui_elements.t the mount
   sites inline into their own trees (all-pages route, tag/property
   .page-tabs, right-sidebar object tabs, .custom-query-results shells).
   The element owns the inst lifecycle (create on mount, dispose on
   unmount), kicks the data-load chain, and implements view CRUD /
   object creation / export. The body repaints through a reactive on the
   vstate signal — nothing scans the DOM to find mounted views. *)

open Promise_ext
module D = Logseq_el
module E = Web_dom
module V = Views_state
module Wr = Views_wire
module W = Wire
module I = I18n
module P = Views_popup
module A = Action
module M = Model
module Db = Views_db

open Lui_elements

type t = Lui_elements.t

let sig_of (inst : V.inst) : V.vstate Signal.signal =
  inst.V.st.Signal.state_signal

let feature_of_kind = function
  | V.KAllPages -> "all-pages"
  | V.KTagPage _ -> "class-objects"
  | V.KPropertyPage _ -> "property-objects"
  | V.KQuery _ -> "query-result"
  | V.KLinkedRefs -> "linked-references"
  | V.KUnlinkedRefs -> "unlinked-references"

(* cljs create-view! default titles — the auto-triggered view names
   itself with the localized feature title *)
let default_view_title inst =
  match inst.V.feature with
  | "linked-references" -> I18n.t "view/linked-references"
  | "unlinked-references" -> I18n.t "view/unlinked-references"
  | _ -> I.all

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
      (* TODO(component): :view hiccup takes arbitrary user tags +
         attrs — no fixed component kind; keep dom for element nodes *)
      [ Logseq_el.el ~tag ~attrs (List.concat_map (hiccup_els inst) children) ]
  | W.Array xs | W.List xs | W.Set xs ->
      List.concat_map (hiccup_els inst) xs
  | W.String s -> [ text ~value:s [] ]
  | W.Uuid u ->
      (* the row title may itself contain [[uuid]]/#[[uuid]] refs —
         inline-parse so nested refs resolve (cljs map-inline) *)
      Render_inline.parse ~self:u (title_of_uuid inst u)
  | w -> [ text ~value:(Edn.to_string w) [] ]

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
  box
    [ column ~gap:8
        [ column ~gap:8
            [ Views_table.foldable inst ~key:"view"
                ~title:(Views_head.render_head inst)
                ~body:
                  (reactive ~equal:body_eq
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
  if is_dsl_blank then spacer ~key:"blank" []
  else if s.V.query_view <> W.Nil then
    (* :view fn output replaces the default table (cljs custom-query) *)
    Logseq_el.fragment (hiccup_els inst s.V.query_view)
  else if s.V.query_error <> None then
    text ~value:(Option.value s.V.query_error ~default:"query error")
      ~padding:8 ~foreground:"muted-foreground" []
  else if s.V.query_scalar_rows <> [] then
    list
      (List.map
         (fun item ->
           let v =
             match item with
             | W.String s -> s
             | other -> Edn.to_string other
           in
           list_item ~text:v [])
         s.V.query_scalar_rows)
  else if s.V.query_rows <> [] || not s.V.loading then
    (* block results → the query-result view. cljs renders the foldable
       live-query shell ("Live query (n)" head + view-actions + table)
       even when the result is empty — only the loading state replaces
       it *)
    box ~style_class:"query-result"
      [ column ~gap:8
          [ column ~gap:8
              [ Views_table.foldable inst ~key:"qr"
                  ~title:(Views_head.render_head inst)
                  ~body:
                    (Views_table.body_el inst s
                       ~filters:(Views_head.filters_row inst))
              ]
          ]
      ]
  else if s.V.loading then
    text ~value:I.loading_ ~padding:8 ~foreground:"muted-foreground" []
  else text ~value:I.no_matched_result ~padding_vertical:8 []

let query_view_el inst : t =
  Logseq_el.fragment
    [ box 
        [ reactive ~equal:body_eq
            (fun s ->
              column
                [ (* dsl queries (and blank ones) get the builder panel;
                     datalog don't *)
                  (match Views_query.parse_src s.V.qsrc with
                   | Views_query.QDatalog _ -> spacer ~key:"builder-off" []
                   | _ ->
                       if s.V.is_advanced then spacer ~key:"builder-off" []
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

(* [fetch_limit] overrides the vstate's staged value — Signal.set is
   pending until the next stabilize, so a same-tick [V.ctx_of] would
   still read the old limit *)
let load_view_data ?(fetch_limit = 0) inst =
  let gen = V.new_fetch inst in
  let ctx =
    match V.ctx_of inst, fetch_limit > 0 with
    | W.Map kvs, true ->
        W.Map
          ((W.kw "initial-row-count", W.Int fetch_limit)
          :: List.filter (fun (k, _) -> k <> W.kw "initial-row-count") kvs)
    | ctx, _ -> ctx
  in
  let view_uuid = (V.get inst).V.view_uuid in
  let key = Db.key_view_data view_uuid ctx in
  let apply = function
      | _ when not (V.fetch_fresh inst gen) ->
          (* stale response — a newer fetch (tab switch, filters,
             refresh) already superseded this request *)
          ()
      | None ->
          V.update inst (fun s -> { s with V.data = Wr.VEmpty; loading = false })
      | Some v ->
          let d =
            try Wr.decode_view_data v
            with e ->
              Ui_services.log_error ("view-data decode failed", e);
              Wr.VEmpty
          in
          V.update inst (fun s ->
              { s with
                V.data = d
              ; loading = false
              ; ref_pages_count = Wr.decode_ref_counts v
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
              load_props inst (fun () -> build_columns inst))
  in
  if Ui_services.env_publishing () && view_uuid = "" then
    let owner_ref = match inst.V.owner with
      | W.String name -> W.Array [ W.kw "block/name"; W.String name ]
      | W.Uuid uuid -> W.Array [ W.kw "block/uuid"; W.Uuid uuid ]
      | _ -> invalid_arg "View owner must be a page name or UUID" in
    ignore ((let* owner = Runtime.invoke3 "thread-api/pull"
        (W.String (Db.repo ())) (W.String "[:db/id]") owner_ref in
      let fields = match ctx with W.Map kvs -> kvs | _ -> assert false in
      let fields = List.map (fun (k, v) ->
        ((match k with
          | W.Keyword "feature-type" -> W.kw "view-feature-type"
          | W.Keyword "initial-row-count" -> W.kw "row-limit"
          | k -> k), v)) fields in
      let fields = (W.kw "render?", W.Bool true) :: fields in
      let fields = match W.get owner "db/id" with
        | Some id -> (W.kw "view-for-id", id) :: fields | None -> fields in
      let* data = Runtime.invoke3 "thread-api/get-view-data"
          (W.String (Db.repo ())) W.Nil (W.Map fields) in
      apply (Some data);
      Js.Promise.resolve ()) |> Db.catch_quiet)
  else Db.snapshots ~f:(fun snap -> apply (Wr.snapshot_slot_value snap key))
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
      (match inst.V.kind with
       | V.KLinkedRefs -> Views_head.load_ref_filters inst
       | _ -> ());
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

(* resolve the uuid of the owner page/entity behind inst.owner — f
   gets None when the page is absent (cljs all_pages gates the view on
   [:page-identity views-page-name] and renders nothing when missing) *)
let owner_uuid inst f =
  match inst.V.owner with
  | W.Uuid u -> f (Some u)
  | W.String name -> (
      let key = Db.key_page_identity name in
      Db.snapshots
        ~f:(fun snap ->
          match Wr.snapshot_slot_value snap key with
          | Some (W.Uuid u) -> f (Some u)
          | _ -> f None)
        [ Db.res key ])
  | _ -> f None

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
  owner_uuid inst (function
    | Some ouuid ->
        views_page_uuid (function
          | Some vpuuid ->
              Db.insert_view_block ~title ~uuid ~page_uuid:vpuuid
                ~owner_uuid:ouuid ~feature_type:inst.V.feature
                ~after:(fun () ->
                  load_views inst ~on_done:(fun () -> after ())) ()
          | None -> ())
    | None -> ())

(* auto-create the default "All" view (cljs create-view! auto-triggered?);
   when the owner or $$$views page cannot be resolved the view settles
   into its empty state instead of staying on Loading *)
let ensure_default_view inst =
  match (V.get inst).V.views with
  | v :: _ -> select_view inst v
  | [] when Ui_services.env_publishing () -> refresh inst
  | [] ->
      owner_uuid inst (function
        | Some ouuid ->
            let uuid =
              Db.gen_view_uuid ~owner:ouuid ~feature_type:inst.V.feature
            in
            views_page_uuid (function
              | Some vpuuid ->
                  Db.insert_view_block ~title:(default_view_title inst)
                    ~uuid ~page_uuid:vpuuid
                    ~owner_uuid:ouuid ~feature_type:inst.V.feature
                    ~after:(fun () ->
                      load_views inst ~on_done:(fun () ->
                          match (V.get inst).V.views with
                          | v :: _ -> select_view inst v
                          | [] ->
                              V.update inst
                                (fun s -> { s with V.view_uuid = uuid });
                              refresh inst)) ()
              | None ->
                  V.update inst (fun s -> { s with V.loading = false }))
        | None -> V.update inst (fun s -> { s with V.loading = false }))

(* ---------- actions ---------- *)

(* cljs view-tab menu: Rename is a dropdown-menu-sub whose sub-content
   holds a block-container title editor (inline rename). The head mounts
   the returned box as MCustom inside the Rename MSub; the popup layer
   focuses the input when the sub-content opens. *)
let rename_editor_box inst (v : Wr.view_ent) : Lui_elements.t =
  (* the typed value lives in a ref the input's on_input keeps current;
     submit (Enter) commits, Escape rides the enclosing popover's own
     dismiss *)
  let value = ref v.Wr.vtitle in
  let commit () =
    P.close_all ();
    Db.save_block_title v.Wr.vu !value (fun () ->
        load_views inst ~on_done:(fun () -> refresh inst))
  in
  Logseq_el.el ~style_class:"block-title-wrap p-2"
    [ input ~style_class:"cp__select-input w-full !p-1.5"
        ~data_attrs:[ ("type", "text") ]
        ~text:v.Wr.vtitle ~autofocus:true ~submit_on_enter:true
        ~on_input:(function
          | Lui_protocol.TextChanged (_, s) -> value := s
          | _ -> ())
        ~on_submit:(fun _ -> commit ()) [] ]

let export_edn inst =
  let s =
    (V.get inst).V.blocks |> Hashtbl.to_seq_values |> List.of_seq
    |> List.map (fun b -> Edn.to_string b)
    |> String.concat "\n"
  in
  ignore
    (Ui_task.bind (Ui_services.clipboard_write_text s) (fun () ->
     Runtime.send
       (A.Toast_push
          { M.toast_id = 0; toast_key = None; toast_text = I.copied_view_nodes
          ; toast_kind = "success" });
     Ui_task.resolve ()))

(* windowed view-data growth — the row stream's virt-end dom-event fires
   when its last child nears the viewport; each bump doubles the fetched
   window until it covers the full result count (cljs
   offset-view-row-count) *)
let load_more_rows inst =
  match (V.get inst).V.data with
  | Wr.VFlat { rows; count; _ }
    when List.length rows < count ->
      let limit = min count (2 * List.length rows) in
      V.update inst (fun s -> { s with V.fetch_limit = limit });
      load_view_data ~fetch_limit:limit inst
  | _ -> ()

let add_new_object inst =
  match inst.V.kind with
  | V.KTagPage owner_uuid ->
      let uuid = Ui_services.env_random_uuid () in
      Db.insert_object_block ~uuid ~page_uuid:owner_uuid ~title:""
        ~tags:[ owner_uuid ] ~props:[] (fun _ ->
          (* cljs edit-block! on the new page-child: the object mounts in
             the owner page's block tree and edits in place there — the
             right sidebar stays closed *)
          let rec try_edit n =
            if n <= 0 then ()
            else
              match E.get_element_by_id ("ls-block-" ^ uuid) with
              | Some _ -> Editor_actions.enter_edit uuid 0
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
             get_blocks re-read and evaluate immediately; the reactive repaints
             as soon as rows land instead of waiting for the row-data
             roundtrip *)
          V.update inst
            (fun s -> { s with V.qsrc = src; loading = false });
          Views_query.run inst (fun () ->
              if (V.get inst).V.query_rows <> [] then load_view_data inst))
    ; o_create_view =
        (fun inst ->
          let uuid = Ui_services.env_random_uuid () in
          create_view ~title:"" ~uuid inst ~after:(fun () ->
              match
                List.find_opt (fun v -> v.Wr.vu = uuid) (V.get inst).V.views
              with
              | Some v -> select_view inst v
              | None -> refresh inst))
    ; o_rename_box = rename_editor_box
    ; o_export = export_edn
    ; o_add_object = add_new_object
    ; o_title_of_uuid = title_of_uuid
    ; o_load_more = load_more_rows
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
