(* Views slice drive harness (Melange side): mounts the real
   Views_view.view against a scripted Worker_client and runs
   Shared_scenarios_views — the same scenarios a native drive harness
   runs
   natively. The worker answers the views resource chain
   ([:views] -> view ents -> [:view-data] -> rows -> get-blocks ->
   get-all-properties) from mutable scenario state, so tests can change
   data, reorder rows, and hold/release responses mid-flight. *)

open Test_check
module M = Drive.Model
module S = Drive.Session
module W = Wire

(* ---------- scripted worker state ---------- *)

let requests : string list ref = ref []
let resources_log : string list ref = ref []
let views_list : (string * string * string) list ref = ref []
let view_flags : (string, string list) Hashtbl.t = Hashtbl.create 8
let view_rows : (string, (string * string) list) Hashtbl.t =
  Hashtbl.create 8
let view_data_overrides : (string, W.t) Hashtbl.t = Hashtbl.create 8
let titles : (string, string) Hashtbl.t = Hashtbl.create 64
let query_src : (string, string) Hashtbl.t = Hashtbl.create 8
let query_rows : (string, string list) Hashtbl.t = Hashtbl.create 8
let query_err : (string, string) Hashtbl.t = Hashtbl.create 8
let held : string list ref = ref []
let parked : (string * W.t * (W.t -> unit)) list ref = ref []
let filter_ref_uuid = "dd000000-0000-4000-8000-000000000001"
let flat_children : (string, W.t list) Hashtbl.t = Hashtbl.create 8
let block_requests : (string * bool * bool * bool) list ref = ref []
let collapsed_flags : (string, bool) Hashtbl.t = Hashtbl.create 8
let collapse_writes : (string * bool) list ref = ref []
let mounted_static_rows = ref []
let mounted_static_scopes = ref []

let kw s = W.Keyword s

let flag_view uuid name =
  match Hashtbl.find_opt view_flags uuid with
  | Some fs -> List.mem name fs
  | None -> false

(* the query block's value child — logseq.property/query holds a ref to
   the child whose block/title is the query source *)
let query_block_ent uuid : W.t =
  let vbu = uuid ^ "-v" in
  W.Map
    [ kw "block/uuid", W.Uuid uuid
    ; kw "db/id", W.Int 90
    ; kw "block/title", W.String ""
    ; kw "logseq.property.view/type", kw
        (if flag_view uuid "query-list" then "logseq.property.view/type.list"
         else "logseq.property.view/type.table")
    ; kw "logseq.property/query", W.Map [ kw "block/uuid", W.Uuid vbu ]
    ; ( kw "block/children"
      , W.Array
          [ W.Map
              [ kw "block/uuid", W.Uuid vbu
              ; kw "block/title"
              , W.String
                  (Option.value (Hashtbl.find_opt query_src uuid)
                     ~default:"") ] ] ) ]

let view_ent uuid title ty : W.t =
  let extra =
    (if flag_view uuid "sort" then
       [ ( kw "logseq.property.table/sorting"
         , W.Array
             [ W.Map [ kw "id", kw "block/title"; kw "asc?", W.Bool true ] ] )
       ]
     else [])
    @ (if flag_view uuid "filters" then
      [ ( kw "logseq.property.table/filters"
        , W.Map
            [ kw "or?", W.Bool false
            ; ( kw "filters"
              , W.Array
                  [ W.Array [ kw "user.property/p1"; kw "is"; W.String "x" ]
                  ] ) ] ) ]
    else [])
    @ (if flag_view uuid "filter-ref" then
      [ ( kw "logseq.property.table/filters"
        , W.Map
            [ kw "or?", W.Bool false
            ; ( kw "filters"
              , W.Array
                  [ W.Array
                      [ kw "user.property/p1"; kw "is"; W.Uuid filter_ref_uuid ] ] )
            ] ) ]
    else [])
    @ (if flag_view uuid "group-tags" then
      [ ( kw "logseq.property.view/group-by-property"
        , W.Map [ kw "db/ident", kw "block/tags" ] ) ]
    else [])
  in
  W.Map
    ([ kw "block/uuid", W.Uuid uuid
     ; kw "db/id", W.Int 42
     ; kw "block/title", W.String title
     ; kw "logseq.property.view/type", W.Map [ kw "db/ident", kw ty ] ]
    @ extra)

let ent_for uuid : W.t =
  match List.find_opt (fun (u, _, _) -> u = uuid) !views_list with
  | Some (u, t, ty) -> view_ent u t ty
  | None ->
      if Hashtbl.mem query_src uuid || Hashtbl.mem query_err uuid then
        query_block_ent uuid
      else
        W.Map
          ([ kw "block/uuid", W.Uuid uuid
           ; kw "db/id", W.Int 7
           ; kw "block/title"
           , W.String
               (Option.value (Hashtbl.find_opt titles uuid)
                  ~default:("Row " ^ uuid)) ]
          @ Option.fold ~none:[] ~some:(fun collapsed ->
                [ kw "block/collapsed?", W.Bool collapsed ])
              (Hashtbl.find_opt collapsed_flags uuid))

let blocks_response = function
  | Some (W.Array reqs) ->
      W.List
        (List.map
           (fun req ->
             let u =
               match W.get req "id" with
               | Some (W.Uuid u) | Some (W.String u) -> u
               | _ -> "?"
             in
             let children_requested =
               match W.get req "opts" with
               | Some opts -> W.get opts "children?" = Some (W.Bool true)
               | None -> false
             in
             let option_true name =
               match W.get req "opts" with
               | Some opts -> W.get opts name = Some (W.Bool true)
               | None -> false
             in
             block_requests :=
               (u, children_requested, option_true "all?",
                option_true "include-collapsed-children?")
               :: !block_requests;
             let children =
               if not children_requested then []
               else
                 match Hashtbl.find_opt flat_children u with
                 | Some children -> children
                 | None when Hashtbl.mem query_src u || Hashtbl.mem query_err u ->
                     [ W.Map
                         [ kw "block/uuid", W.Uuid (u ^ "-v")
                         ; kw "block/title"
                         , W.String
                             (Option.value (Hashtbl.find_opt query_src u)
                                ~default:"")
                         ; kw "block/parent-uuid", W.Uuid u
                         ; kw "block/order", W.String "000001" ] ]
                 | None -> []
             in
             W.Map
               ([ kw "id", W.Uuid u; kw "block", ent_for u ]
               @ (if children_requested then
                    [ kw "children", W.Array children ]
                  else [])))
           reqs)
  | _ -> W.List []

let view_data_value uuid : W.t =
  match Hashtbl.find_opt view_data_overrides uuid with
  | Some data -> data
  | None ->
      let rows =
        match Hashtbl.find_opt view_rows uuid with
        | Some rs -> List.map fst rs
        | None -> []
      in
      W.Map
        [ kw "count", W.Int (List.length rows)
        ; kw "rows", W.Array (List.map (fun u -> W.Uuid u) rows)
        ; kw "properties", W.List [ kw "block/title" ] ]

let query_value spec : W.t =
  (* spec carries :current-block-uuid — find the owning scripted query *)
  let qb =
    match W.get spec "current-block-uuid" with
    | Some (W.Uuid u) -> u
    | _ -> ""
  in
  match Hashtbl.find_opt query_err qb with
  | Some msg ->
      W.Map
        [ kw "error", W.Map [ kw "message", W.String msg ] ]
  | None ->
      W.Map
        [ ( kw "rows"
          , W.Array
              (List.map (fun u -> W.Uuid u)
                 (Option.value (Hashtbl.find_opt query_rows qb)
                    ~default:[]))) ]

let slot_value (rk : W.t) : W.t option =
  match rk with
  | W.Array (W.Keyword "views" :: _ :: _) ->
      Some
        (W.Array (List.map (fun (u, _, _) -> W.Uuid u) !views_list))
  | W.Array [W.Keyword "view-data";W.Uuid vu;ctx] when flag_view vu "windowed-refs" ->
      let rows = Hashtbl.find view_rows vu in
      let limit = Option.get (W.map_get_int ctx "initial-row-count") in
      Some (W.Map [kw "count",W.Int (List.length rows);
        kw "rows",W.Array (List.filteri (fun i _ -> i<limit) rows |> List.map (fun (u,_) -> W.Uuid u));
        kw "properties",W.Array [kw "block/title"]])
  | W.Array (W.Keyword "view-data" :: W.Uuid vu :: _) ->
      Some (view_data_value vu)
  | W.Array (W.Keyword "query" :: spec :: _) -> Some (query_value spec)
  | _ -> None

let rec wire_str (w : W.t) : string =
  match w with
  | W.Keyword s -> ":" ^ s
  | W.String s -> s
  | W.Uuid u -> u
  | W.Int i -> string_of_int i
  | W.Array xs | W.List xs | W.Set xs ->
      "[" ^ String.concat " " (List.map wire_str xs) ^ "]"
  | W.Map kvs ->
      "{"
      ^ String.concat " " (List.map (fun (k, v) -> wire_str k ^ " " ^ wire_str v) kvs)
      ^ "}"
  | _ -> "?"

let snapshots_response req : W.t =
  match W.get req "resources" with
  | Some (W.Array rks) ->
      resources_log :=
        !resources_log @ [ String.concat " " (List.map wire_str rks) ];
      W.Map
        [ ( kw "slots"
          , W.Map
              (List.filter_map
                 (fun rk ->
                   Option.map
                     (fun v ->
                       ( W.Array [ kw "resource"; rk ]
                       , W.Map [ kw "value", v ] ))
                     (slot_value rk))
                 rks) ) ]
  | _ -> W.Map []

let scripted_response (name : string) (args : W.t list) : W.t =
  match name with
  | "thread-api/get-render-snapshots" ->
      snapshots_response
        (match List.nth_opt args 1 with Some r -> r | None -> W.Map [])
  | "thread-api/get-blocks" -> blocks_response (List.nth_opt args 1)
  | "thread-api/get-all-properties" -> W.List []
  | "thread-api/get-file-content" -> W.String "{}"
  | "thread-api/pull-many" when List.nth_opt args 1=Some (W.String "[:db/id]") ->
      W.Array (W.elems (List.nth args 2) |> List.map (fun _ -> W.Map [kw "db/id",W.Int 99]))
  | "thread-api/get-view-data" ->
      let rows = Option.value (Hashtbl.find_opt query_rows "") ~default:[] in
      W.Map [kw "count",W.Int (List.length rows);kw "rows",W.Array (List.map (fun u -> W.Uuid u) rows)]
  | "thread-api/pull" | "thread-api/pull-many" -> W.List []
  | _ -> W.Map []

let invoke name args : W.t Js.Promise.t =
  requests := !requests @ [ name ];
  if name = "thread-api/apply-outliner-ops" then
    (match List.nth_opt args 1 with
     | Some (W.Array ops) ->
         List.iter
           (function
             | W.Array
                 [ W.Keyword "collapse-expand-blocks"
                 ; W.Array [ W.List blocks; W.Map _ ] ] ->
                 List.iter
                   (fun block ->
                     match
                       W.map_get_uuid block "block/uuid",
                       Option.bind (W.get block "block/collapsed?") W.as_bool
                     with
                     | Some uuid, Some collapsed ->
                         collapse_writes := (uuid, collapsed) :: !collapse_writes
                     | _ -> invalid_arg "Malformed collapse-expand-blocks operation")
                   blocks
             | W.Array [ W.Keyword "collapse-expand-blocks"; _ ] ->
                 invalid_arg "Malformed collapse-expand-blocks operation"
             | _ -> ())
           ops
     | _ -> invalid_arg "Missing apply-outliner-ops payload");
  let resp = scripted_response name args in
  if List.mem name !held then
    Js.Promise.make (fun ~resolve ~reject:_ ->
        (* snapshot the response now: a parked request answers with the
           data its context asked for, arriving late *)
        parked := !parked @ [ (name, resp, fun w -> resolve w [@u]) ])
  else Js.Promise.resolve resp

let install_worker () =
  let dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) in
  Runtime.worker :=
    Some
      { Worker_client.invoke_fn = (fun n a -> invoke n a)
      ; on_message = (fun _ _ -> ())
      ; dead
      }

(* ---------- mount ---------- *)

let registry () =
  let registry = Lui_extension.registry () in
  Logseq_emoji.register registry;
  Logseq_katex.register registry;
  Logseq_el.register registry;
  Logseq_editor.register registry;
  Logseq_codemirror.register registry;
  Logseq_virt.register registry;
  registry

let mount_view ~kind () =
  install_worker ();
  let vs =
    S.mount ~registry:(registry ()) ~profile:Logseq_el.web_profile
      ~initial:Model.initial ~reducer:Update.update
      ~view:(fun ctx _ms _send ->
      let extra_rows =
          List.mapi
            (fun index (row_kind, row_uuid, blk) ->
              let inst =
                Views_state.make ~sched:ctx.Lui_ui.ui_scheduler ~kind:row_kind
                  ~feature:(Views_view.feature_of_kind row_kind)
                  ~owner:(W.String "$$$views")
              in
              mounted_static_scopes :=
                (row_kind, inst.Views_state.collapse_scope)
                :: !mounted_static_scopes;
              Lui_elements.column ~key:("mounted-static-" ^ string_of_int index)
                [ Views_table.list_row_el inst ~row_uuid ~blk ])
            !mounted_static_rows
        in
        Logseq_el.el
          ([ Views_view.view ~kind ~owner:(W.String "$$$views") ] @ extra_rows))
      ()
  in
  let flush0 = !Runtime.app_flush in
  Runtime.app_flush :=
    (fun () -> flush0 (); ignore (Lui_app.flush vs.S.app));
  vs

(* ---------- host ---------- *)

let host () : (Model.t, Action.t) Shared_scenarios_views.host =
  { Shared_scenarios_views.check = Test_check.check
  ; mount_table =
      (fun () -> mount_view ~kind:Views_state.KAllPages ())
  ; mount_query =
      (fun ~uuid ->
        mount_view ~kind:(Views_state.KQuery { block_uuid = uuid }) ())
  ; after =
      (fun n f ->
        let rec go n = if n <= 0 then f () else after_tick (n - 1)
        and after_tick n =
          ignore
            Js.Promise.(
              resolve ()
              |> then_ (fun () ->
                     go n; Js.Promise.resolve ()))
        in
        go n)
  ; requests = (fun () -> !requests)
  ; resources = (fun () -> !resources_log)
  ; clear_requests = (fun () -> requests := [])
  ; set_views = (fun vs -> views_list := vs)
  ; set_view_flags =
      (fun uuid flags -> Hashtbl.replace view_flags uuid flags)
  ; set_rows =
      (fun ~view rows ->
        Hashtbl.replace view_rows view rows;
        List.iter (fun (u, t) -> Hashtbl.replace titles u t) rows)
  ; set_query =
      (fun ~uuid ~src ~rows ->
        Hashtbl.replace query_src uuid src;
        Hashtbl.replace query_rows uuid rows)
  ; set_query_error =
      (fun ~uuid ~msg -> Hashtbl.replace query_err uuid msg)
  ; hold = (fun name -> held := name :: !held)
  ; release =
      (fun name ->
        match
          List.find_opt (fun (n, _, _) -> n = name) !parked
        with
        | Some ((_, resp, resolve) as p) ->
            parked := List.filter (fun q -> q != p) !parked;
            (if not (List.exists (fun (n, _, _) -> n = name) !parked)
             then held := List.filter (fun n -> n <> name) !held);
            resolve resp
        | None -> check ("release: parked " ^ name) false)
  ; pending = (fun () -> List.map (fun (n, _, _) -> n) !parked)
  }

let query_result_replacement () =
  let module V = Views_state in
  let scheduler = Signal.scheduler () in
  List.iter (fun (name, result, scalar, error) ->
      let inst = V.make ~sched:scheduler
          ~kind:(V.KQuery { block_uuid = "query" }) ~feature:"query-result" ~owner:W.Nil in
      Signal.set inst.V.st
        { (V.empty_vstate ()) with
          V.loading = false
        ; qsrc = "(property :block/title)"
        ; query_rows = [ "old-row" ]
        ; query_idents = [ "block/title" ]
        ; items_count = 12
        ; data = Views_wire.VFlat
            { rows = [ "old-row" ]; count = 12; previews = Hashtbl.create 0; qprops = [] }
        };
      Signal.stabilize scheduler;
      Views_query.decode_result inst result;
      Signal.stabilize scheduler;
      let state = V.get inst in
      check ("query replaces prior block results: " ^ name)
        (state.V.query_rows = []
         && Views_wire.row_count state.V.data = 0
         && Views_head.count_of state = 0
         && state.V.query_idents = []
         && state.V.query_scalar_rows = scalar
         && state.V.query_error = error))
    [ "empty", W.Map [ kw "rows", W.Array [] ], [], None
    ; "scalar", W.Map [ kw "rows", W.Array [ W.Int 3 ] ], [ W.Int 3 ], None
    ; "error", W.Map [ kw "error", W.Map [ kw "message", W.String "invalid query" ] ],
        [], Some "invalid query"
    ]

let grouped_entity_value uuid =
  W.Map [ kw "kind", kw "entity"; kw "uuid", W.Uuid uuid ]

let grouped_view_data groups =
  let count = List.fold_left (fun n (_, rows) -> n + List.length rows) 0 groups in
  let groups =
    List.map
      (fun (value, rows) ->
        let rows = W.Array (List.map (fun uuid -> W.Uuid uuid) rows) in
        W.Map [ kw "value", value; kw "rows", rows ])
      groups
  in
  W.Map
    [ kw "count", W.Int count
    ; kw "partition", kw "grouped"
    ; kw "groups", W.Array groups
    ; kw "properties", W.List [ kw "block/title" ]
    ]

let grouped_entity_headers (h : (_, _) Shared_scenarios_views.host) ~finish =
  let uuid n = Printf.sprintf "cc000000-0000-4000-8000-%012d" n in
  let table_view = uuid 1 in
  let list_view = uuid 2 in
  let page_uuid = uuid 11 in
  let journal_uuid = uuid 12 in
  let rows = List.init 4 (fun i -> uuid (21 + i)) in
  let root_uuid = List.hd rows in
  let ref_uuid = uuid 51 in
  let ref_child_uuid = uuid 52 in
  let nested_wire uuid title ?(collapsed = false) children =
    W.Map
      ([ kw "block/uuid", W.Uuid uuid
       ; kw "block/title", W.String title ]
      @ (if collapsed then [ kw "block/collapsed?", W.Bool true ] else [])
      @ (if children = [] then [] else [ kw "block/children", W.Array children ]))
  in
  let ref_wire =
    nested_wire ref_uuid "Reference row" ~collapsed:true
      [ nested_wire ref_child_uuid "Reference child" [] ]
  in
  mounted_static_rows :=
    [ (Views_state.KLinkedRefs, ref_uuid, ref_wire)
    ; (Views_state.KLinkedRefs, ref_uuid, ref_wire)
    ; (Views_state.KUnlinkedRefs, ref_uuid, ref_wire) ];
  mounted_static_scopes := [];
  collapse_writes := [];
  let flat_block uuid title parent order =
    W.Map
      [ kw "block/uuid", W.Uuid uuid
      ; kw "block/title", W.String title
      ; kw "block/parent-uuid", W.Uuid parent
      ; kw "block/order", W.String order ]
  in
  Hashtbl.replace flat_children root_uuid
    [ flat_block (uuid 41) "Grandchild" (uuid 42) "000002"
    ; flat_block (uuid 43) "Second child" root_uuid "000002"
    ; (match flat_block (uuid 42) "First child" root_uuid "000001" with
      | W.Map fields -> W.Map (fields @ [ kw "block/collapsed?", W.Bool false ])
      | block -> block) ];
  Hashtbl.replace collapsed_flags root_uuid true;
  let stale_collapsed =
    List.fold_left
      (fun set uuid -> Editor_state.String_set.add uuid set)
      Editor_state.String_set.empty [ ref_uuid; uuid 42; uuid 43 ]
  in
  Outliner_ops.merge_collapsed stale_collapsed Editor_state.String_set.empty;
  block_requests := [];
  let empty_value = W.Map [ kw "kind", kw "empty" ] in
  let scalar_value =
    W.Map [ kw "kind", kw "scalar"; kw "value", W.String "High" ]
  in
  let groups rows =
    [ (grouped_entity_value page_uuid, [ List.nth rows 0 ])
    ; (grouped_entity_value journal_uuid, [ List.nth rows 1 ])
    ; (empty_value, [ List.nth rows 2 ])
    ; (scalar_value, [ List.nth rows 3 ])
    ]
  in
  h.set_views
    [ (table_view, "Grouped table", "logseq.property.view/type.table")
    ; (list_view, "Grouped list", "logseq.property.view/type.list")
    ];
  h.set_view_flags table_view [ "group-tags"; "filter-ref" ];
  h.set_view_flags list_view [ "group-tags"; "filter-ref" ];
  h.set_rows ~view:table_view
    (List.mapi
       (fun i row -> row, if i = 0 then "Root row" else "Grouped row " ^ string_of_int (i + 1))
       rows);
  h.set_rows ~view:list_view
    (List.mapi
       (fun i row -> row, if i = 0 then "Root row" else "Grouped row " ^ string_of_int (i + 1))
       rows);
  Hashtbl.replace titles page_uuid "Page";
  Hashtbl.replace titles journal_uuid "Journal";
  Hashtbl.replace view_data_overrides table_view
    (grouped_view_data (groups rows));
  Hashtbl.replace view_data_overrides list_view
    (grouped_view_data (groups rows));
  let original_read_model = !Runtime.read_model in
  Runtime.read_model :=
    (fun () ->
      { (original_read_model ()) with
        Model.repo = Some "views-collapse-test" });
  let s = h.mount_table () in
  let has_text value =
    List.exists
      (fun node -> M.string_prop node "text" = Some value)
      (M.all_nodes s.S.tree)
  in
  let check_group_headers name ~missing_group =
    List.iter
      (fun label -> h.check (name ^ ": group title " ^ label) (has_text label))
      [ "Page"; "Journal"; "High" ];
    if missing_group then
      h.check (name ^ ": missing group placeholder")
        (has_text (I18n.no_group_value "block/tags"))
  in
  let request_flags uuid =
    List.filter_map
      (fun (requested_uuid, children, all, include_collapsed) ->
        if requested_uuid = uuid then Some (children, all, include_collapsed)
        else None)
      (List.rev !block_requests)
  in
  let group_filter_children_disabled () =
    List.for_all
      (fun uuid ->
        let flags = request_flags uuid in
        flags <> []
        && List.for_all
             (fun (children, all, include_collapsed) ->
               not children && not all && not include_collapsed)
             flags)
      [ page_uuid; journal_uuid; filter_ref_uuid ]
  in
  h.after 40 (fun () ->
      check_group_headers "views: Table" ~missing_group:true;
      h.check "views: Table rows do not request child trees"
        (request_flags root_uuid = [ (false, false, false) ]);
      h.check "views: Table group and filter references do not request descendants"
        (group_filter_children_disabled ());
      h.check "views: Table does not render List descendants"
        (not (has_text "First child"));
      Shared_scenarios_views.click_tab h s list_view;
      h.after 40 (fun () ->
          check_group_headers "views: List" ~missing_group:true;
          h.check "views: List mode requests a complete child tree for the same row"
            (request_flags root_uuid
             = [ (false, false, false); (true, true, true) ]);
          h.check "views: List group and filter references remain child-free"
            (group_filter_children_disabled ());
          let root_tree_texts () =
            match
              List.find_opt
                (fun node ->
                  M.string_prop node "accessibility-identifier"
                  = Some ("ls-block-" ^ root_uuid))
                (M.all_nodes s.S.tree)
            with
            | Some root -> Shared_scenarios_views.subtree_texts s.S.tree root
            | None -> []
          in
          h.check "views: List applies the persisted collapsed flag"
            (not (List.mem "First child" (root_tree_texts ())));
          h.check "views: List hydrates persisted collapse for loaded row trees"
            (Editor_state.is_collapsed root_uuid
             && not (Editor_state.is_collapsed (uuid 42))
             && not (Editor_state.is_collapsed (uuid 43)));
          let control =
            List.find_opt
              (fun node ->
                M.string_prop node "accessibility-identifier"
                = Some ("control-" ^ root_uuid))
              (M.all_nodes s.S.tree)
          in
          let finish_workflow () =
            List.iter
              (fun (_, scope) -> Editor_state.clear_collapse_scope ~scope ())
              !mounted_static_scopes;
            mounted_static_rows := [];
            mounted_static_scopes := [];
            Outliner_ops.merge_collapsed ~current:(fun () -> true)
              Editor_state.String_set.empty
              (List.fold_left
                 (fun set uuid -> Editor_state.String_set.add uuid set)
                 Editor_state.String_set.empty
                 [ root_uuid; ref_uuid; uuid 42; uuid 43 ]);
            Runtime.read_model := original_read_model;
            finish ()
          in
          let writes () = List.rev !collapse_writes in
          let has_ref_child root =
            List.mem "Reference child"
              (Shared_scenarios_views.subtree_texts s.S.tree root)
          in
          let test_reference_rows () =
            let ref_controls =
              List.filter
                (fun node ->
                  M.string_prop node "accessibility-identifier"
                  = Some ("control-" ^ ref_uuid))
                (M.all_nodes s.S.tree)
            in
            let ref_roots =
              List.filter
                (fun node ->
                  M.string_prop node "accessibility-identifier"
                  = Some ("ls-block-" ^ ref_uuid))
                (M.all_nodes s.S.tree)
            in
            let mounted_kinds = List.map fst (List.rev !mounted_static_scopes) in
            match ref_controls, ref_roots, mounted_kinds with
            | [ linked_control; _second_control; unlinked_control ]
              , [ linked_root; second_root; unlinked_root ]
              , [ Views_state.KLinkedRefs; Views_state.KLinkedRefs
                ; Views_state.KUnlinkedRefs ] ->
                let before_refs = writes () in
                Shared_scenarios_views.click s linked_control;
                let linked_isolated =
                  has_ref_child linked_root && not (has_ref_child second_root)
                   && not (has_ref_child unlinked_root)
                in
                Shared_scenarios_views.click s unlinked_control;
                h.check "views: linked and unlinked references toggle locally and independently"
                  (linked_isolated
                   && has_ref_child linked_root && not (has_ref_child second_root)
                   && has_ref_child unlinked_root
                   && writes () = before_refs);
                finish_workflow ()
            | _ ->
                h.check "views: linked and unlinked reference rows are mounted" false;
                finish_workflow ()
          in
          let after_expand before_expand_writes =
            let tree_texts = root_tree_texts () in
            let child_titles = [ "First child"; "Grandchild"; "Second child" ] in
            let rendered_titles =
              List.filter (fun title -> List.mem title child_titles) tree_texts
            in
            h.check "views: List renders nested descendants in parent/order sequence"
              (rendered_titles = child_titles);
            h.check "views: List renders each descendant exactly once"
              (List.for_all
                 (fun title -> List.length (List.filter (( = ) title) tree_texts) = 1)
                 child_titles);
            h.check "views: List expand persists the root's canonical false payload"
              (writes () = before_expand_writes @ [ (root_uuid, false) ]);
            let root_rail =
              List.find_opt
                (fun node ->
                  Shared_scenarios_views.has_tok node "block-children-left-border")
                (M.all_nodes s.S.tree)
            in
            match root_rail with
            | None ->
                h.check "views: child rail is mounted for expanded List rows" false;
                test_reference_rows ()
            | Some root_rail ->
                let before_collapse_writes = writes () in
                Shared_scenarios_views.click s root_rail;
                h.after 20 (fun () ->
                    h.check "views: child rail collapse hides nested descendants"
                      (not (List.mem "First child" (root_tree_texts ())));
                    h.check "views: List collapse persists the root's canonical true payload"
                      (writes () = before_collapse_writes @ [ (root_uuid, true) ]);
                    test_reference_rows ())
          in
          match control with
          | None ->
              h.check "views: List parent collapse control is mounted" false;
              finish_workflow ()
          | Some control ->
              let before_expand_writes = writes () in
              Shared_scenarios_views.click s control;
              h.after 20 (fun () -> after_expand before_expand_writes)
    ))

let plain_text_queries (h : (_, _) Shared_scenarios_views.host) ~finish =
  let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model
  and previous_flush = !Runtime.app_flush in
  Runtime.read_model := (fun () -> {Model.initial with repo=Some "plain-text-query"});
  let query = Views_state.make ~sched:(Signal.scheduler ())
    ~kind:(Views_state.KQuery {block_uuid="empty-columns"}) ~feature:"query-result" ~owner:W.Nil in
  check "Empty query column construction already supplies the Master defaults"
    (List.map (fun column -> column.Views_state.c_id) (Views_table.build_columns query [])
     = ["select";"block/title";"block/created-at";"block/updated-at"]);
  let rec run = function
    | [] -> Runtime.worker := previous_worker; Runtime.read_model := previous_model;
        Runtime.app_flush := previous_flush; finish ()
    | (uuid, source, error) :: rest ->
        Hashtbl.replace query_src uuid source;
        Hashtbl.replace query_rows uuid [];
        Option.iter (fun message -> Hashtbl.replace query_err uuid message) error;
        install_worker ();
        let worker = Option.get !Runtime.worker in
        let specs = ref [] in
        Runtime.worker := Some {worker with Worker_client.invoke_fn=(fun name args ->
          (match name,args with
           | "thread-api/get-render-snapshots",[_;request] ->
               List.iter (function W.Array [W.Keyword "query";spec] -> specs := spec :: !specs
                 | _ -> ()) (W.elems (Option.value (W.get request "resources") ~default:W.Nil))
           | _ -> ());
          worker.invoke_fn name args)};
        let mounted = S.mount ~registry:(registry ()) ~profile:Logseq_el.web_profile
          ~initial:Model.initial ~reducer:Update.update
          ~view:(fun _ _ _ -> Lui_elements.column
            [Views_view.query_title_el ~block_uuid:uuid ~title:None;
             Views_view.view ~kind:(Views_state.KQuery {block_uuid=uuid}) ~owner:(W.Uuid uuid)]) () in
        Runtime.app_flush := (fun () -> S.flush mounted);
        h.after 40 (fun () ->
          S.flush mounted;
          let nodes = M.all_nodes mounted.S.tree in
          let has_text text = List.exists (fun node -> M.string_prop node "text"=Some text) nodes in
          let has_class name = List.exists (fun node -> Shared_scenarios_views.has_tok node name) nodes in
          check "Plain-text query builder keeps the Filter control"
            (List.exists (fun node -> node.M.kind="button"
              && M.string_prop node "accessibility-label"=Some (I18n.t "view.filter/filter")) nodes);
          check "Plain-text query builder displays the full search clause"
            (source="" || has_text (I18n.builder_search source));
          check "Query resource receives quoted full-text source, not a bare symbol"
            (if source="" then !specs=[] else List.exists (fun spec ->
              W.get spec "query"=Some (W.String (Edn.to_string (W.String source)))) !specs);
          check "Plain-text queries render an empty result table and preserve real errors"
            (match error with
             | Some message -> has_text message && not (has_class "query-result")
             | None -> if source="" then not (has_class "query-result")
                 else has_class "query-result");
          let has_headers () = List.for_all (fun key ->
            List.exists (fun node -> M.string_prop node "text"=Some (I18n.t key))
              (M.all_nodes mounted.S.tree))
            ["view.table/name-column";"page/created-at";"page/updated-at"] in
          check "Empty query tables retain Name, Created At and Updated At after a fresh mount"
            (if source<>"" && error=None then has_headers () else not (has_headers ()));
          let finish_case () =
            ignore (Lui_app.dispose mounted.S.app);
            let key = Runtime.repo (),uuid in
            Option.iter Views_builder.drop_tree (Hashtbl.find_opt Views_view.query_insts key);
            Hashtbl.remove Views_view.query_insts key;
            run rest
          in
          if source="" then begin
            let inst = Hashtbl.find Views_view.query_insts (Runtime.repo (),uuid) in
            (Views_state.ops ()).o_refresh_src inst "Search seed parity";
            h.after 40 (fun () ->
              S.flush mounted;
              check "Live query source evaluation builds default headers for an empty result"
                (has_headers ());
              finish_case ())
          end else finish_case ())
  in run ["plain-query", "Search seed parity", None; "blank-query", "", None;
          "failed-plain-query", "Rejected search", Some "search unavailable";
          "plain-query", "Search seed parity", None]

let positive_query_views (h : (_, _) Shared_scenarios_views.host) ~finish =
  let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model
  and previous_flush = !Runtime.app_flush in
  let uuid = "positive-query" and parent_uuid = "imported-parent"
  and child_uuid = "imported-child" and blank_uuid = "imported-blank" in
  Runtime.read_model := (fun () -> {Model.initial with repo=Some "positive-query"});
  Hashtbl.replace query_src uuid "Imported";
  Hashtbl.replace query_rows uuid [parent_uuid;child_uuid];
  Hashtbl.replace titles parent_uuid "Imported parent";
  Hashtbl.replace titles child_uuid "Imported child";
  Hashtbl.replace flat_children parent_uuid
    [W.Map [kw "block/uuid",W.Uuid blank_uuid; kw "block/title",W.String "";
            kw "block/parent-uuid",W.Uuid parent_uuid]];
  Hashtbl.replace view_data_overrides uuid
    (W.Map [kw "partition",kw "flat"; kw "count",W.Int 2;
            kw "rows",W.Array [W.Uuid parent_uuid;W.Uuid child_uuid];
            kw "properties",W.Array [kw "logseq.property/type"]]);
  install_worker ();
  let mount () =
    let mounted = S.mount ~registry:(registry ()) ~profile:Logseq_el.web_profile
      ~initial:Model.initial ~reducer:Update.update
      ~view:(fun _ _ _ -> Views_view.view
        ~kind:(Views_state.KQuery {block_uuid=uuid}) ~owner:(W.Uuid uuid)) () in
    Runtime.app_flush := (fun () -> S.flush mounted);
    mounted in
  let inst () = Hashtbl.find Views_view.query_insts (Runtime.repo (),uuid) in
  let dispose mounted =
    ignore (Lui_app.dispose mounted.S.app);
    Views_builder.drop_tree (inst ());
    Hashtbl.remove Views_view.query_insts (Runtime.repo (),uuid) in
  let check_rows mounted label =
    S.flush mounted;
    let state = Views_state.get (inst ()) in
    check label (state.Views_state.query_rows=[parent_uuid;child_uuid]
      && Views_head.count_of state=2
      && Views_wire.row_count state.Views_state.data=2) in
  let first = mount () in
  h.after 40 (fun () ->
    check_rows first "Full-text Table queries retain parent and child rows";
    check "Positive query tables retain the Property type column"
      (List.exists (fun c -> c.Views_state.c_id="logseq.property/type")
        (Views_state.get (inst ())).Views_state.columns);
    Hashtbl.replace view_flags uuid ["query-list"];
    Hashtbl.replace view_data_overrides uuid
      (W.Map [kw "partition",kw "grouped-list"; kw "count",W.Int 2;
        kw "groups",W.Array [W.Map [kw "value",W.Nil;
          kw "partitions",W.Array [W.Map [kw "breadcrumb-uuid",W.Uuid parent_uuid;
            kw "rows",W.Array [W.Uuid parent_uuid;W.Uuid child_uuid]]]]]]);
    Views_view.refresh (inst ());
    h.after 40 (fun () ->
      check_rows first "Switching a full-text query to List preserves both rows";
      check "List results render blank descendants without an editable outliner scope"
        (List.exists (fun n -> M.string_prop n "accessibility-identifier"
          =Some ("ls-block-" ^ blank_uuid)) (M.all_nodes first.S.tree));
      dispose first;
      let reloaded = mount () in
      h.after 40 (fun () ->
        check_rows reloaded "Reloading the persisted List query preserves both rows";
        check "Reloaded query retains its List display type and search source"
          (let state=Views_state.get (inst ()) in
           state.Views_state.display_type="list" && state.Views_state.qsrc="Imported");
        Hashtbl.replace query_rows uuid [];
        Views_view.refresh (inst ());
        h.after 40 (fun () ->
          check "An empty List query clears prior results"
            (Views_head.count_of (Views_state.get (inst ()))=0);
          Hashtbl.replace query_err uuid "search unavailable";
          Views_view.refresh (inst ());
          h.after 40 (fun () ->
            check "A rejected List query exposes the error without stale rows"
              (let state=Views_state.get (inst ()) in
               state.Views_state.query_error=Some "search unavailable"
               && Views_head.count_of state=0);
            dispose reloaded;
            List.iter (Hashtbl.remove titles) [parent_uuid;child_uuid];
            Hashtbl.remove flat_children parent_uuid;
            Hashtbl.remove view_flags uuid; Hashtbl.remove view_data_overrides uuid;
            Hashtbl.remove query_src uuid; Hashtbl.remove query_rows uuid;
            Hashtbl.remove query_err uuid;
            Runtime.worker:=previous_worker; Runtime.read_model:=previous_model;
            Runtime.app_flush:=previous_flush; finish ())))))

let reference_filter_removal (h : (_, _) Shared_scenarios_views.host) ~finish =
  let previous_worker = !Runtime.worker and previous_model = !Runtime.read_model
  and previous_flush = !Runtime.app_flush in
  let uuid = "reference-filter-view" in
  let rows = ["reference-a","Ref A";"reference-b","Ref B"] in
  Runtime.read_model := (fun () -> {Model.initial with repo=Some "reference-removal"});
  Hashtbl.replace view_flags uuid ["windowed-refs"];
  Hashtbl.replace view_rows uuid rows;
  List.iter (fun (u,title) -> Hashtbl.replace titles u title) rows;
  install_worker ();
  let instance = ref None in
  let mounted = S.mount ~registry:(registry ()) ~profile:Logseq_el.web_profile
    ~initial:Model.initial ~reducer:Update.update
    ~view:(fun context _ _ ->
      let inst = Views_state.make ~sched:context.Lui_ui.ui_scheduler
        ~kind:Views_state.KLinkedRefs ~feature:"linked-references" ~owner:(W.Uuid "reference-owner") in
      Views_state.update inst (fun s -> {s with view_uuid=uuid;display_type="list"});
      instance:=Some inst; Views_view.body_el inst) () in
  Runtime.app_flush := (fun () -> S.flush mounted);
  let inst = Option.get !instance in
  let check_rows label expected =
    S.flush mounted;
    let state = Views_state.get inst in
    check label (Views_head.count_of state=List.length expected
      && Views_wire.row_count state.data=List.length expected
      && state.fetch_limit=List.length expected
      && List.for_all (fun (uuid,_) -> List.exists (fun node ->
        M.string_prop node "accessibility-identifier"=Some ("ls-block-" ^ uuid))
        (M.all_nodes mounted.S.tree)) expected) in
  Views_view.refresh inst;
  h.after 30 (fun () ->
    check_rows "Unfiltered references render both referring rows" rows;
    Hashtbl.replace view_rows uuid [List.hd rows];
    Views_view.refresh inst;
    h.after 30 (fun () ->
      check_rows "A selected reference facet shrinks the materialized window" [List.hd rows];
      Hashtbl.replace view_rows uuid rows;
      Views_view.refresh inst;
      h.after 30 (fun () ->
        check_rows "Removing a reference facet restores both rows, not just the header count" rows;
        Hashtbl.replace view_rows uuid [];
        Views_view.refresh inst;
        h.after 30 (fun () ->
          check_rows "Empty references clear the previous materialized rows" [];
          Hashtbl.remove view_flags uuid;
          Hashtbl.replace view_data_overrides uuid (W.Map [kw "error",W.Map [kw "message",W.String "references unavailable"]]);
          Views_view.refresh inst;
          h.after 30 (fun () ->
            S.flush mounted;
            check "Failed reference refreshes expose their error without stale rows"
              ((Views_state.get inst).view_error=Some "references unavailable"
               && (Views_state.get inst).data=Views_wire.VEmpty);
            ignore (Lui_app.dispose mounted.S.app);
            Hashtbl.remove view_rows uuid; Hashtbl.remove view_data_overrides uuid;
            List.iter (fun (uuid,_) -> Hashtbl.remove titles uuid) rows;
            Runtime.worker:=previous_worker; Runtime.read_model:=previous_model;
            Runtime.app_flush:=previous_flush; finish ())))))

let configured_journal_queries (h : (_, _) Shared_scenarios_views.host) ~before_worker_restore ~finish =
  let previous_worker = !Runtime.worker and previous_read = !Runtime.read_model
  and previous_source = !Runtime.model_source and previous_flush = !Runtime.app_flush in
  let uuid = "configured-journal-marker" in
  let query = Edn.parse {|{:title "Journal default" :query [:find (pull ?b [*]) :in $ ?today :where [?b :block/title "Journal marker"]] :inputs [:today] :collapsed? false}|} in
  let config = W.Map [kw "default-queries",W.Map [kw "journals",W.Array [query]]] in
  let model = {Model.initial with repo=Some "configured-journals";graph_config=config} in
  let page = {(Test_check.page []) with Model.page_uuid=Some "journal-owner";
    page_title="Today's journal";page_journal_day=Some (Dates.today_journal_day ())} in
  Hashtbl.replace titles uuid "Journal marker";
  Hashtbl.replace query_rows "" [uuid];
  install_worker ();
  let specs = ref [] and contexts = ref [] in
  let worker = Option.get !Runtime.worker in
  Runtime.worker:=Some {worker with Worker_client.invoke_fn=(fun name args ->
    (match name,args with
     | "thread-api/get-render-snapshots",[_;request] ->
         List.iter (function W.Array [W.Keyword "query";spec] -> specs:=spec::!specs | _ -> ())
           (W.elems (Option.value (W.get request "resources") ~default:W.Nil))
     | "thread-api/get-view-data",[_;_;context] -> contexts:=context::!contexts
     | _ -> ()); worker.invoke_fn name args)};
  let mount ?(query=query) page =
    let model = {model with Model.graph_config=W.Map
      [kw "default-queries",W.Map [kw "journals",W.Array [query]]]} in
    let mounted = S.mount ~registry:(registry ()) ~profile:Logseq_el.web_profile
      ~initial:model ~reducer:Update.update ~view:(fun _ctx source _ ->
        Runtime.read_model:=(fun () -> Signal.get source);
        Runtime.model_source:=Some source;
        Page.today_queries page) () in
    Runtime.app_flush:=(fun () -> S.flush mounted); mounted in
  h.hold "thread-api/get-view-data";
  let mounted = mount page in
  let subscription = List.hd (List.rev !Subs_state.sync_subs) in
  let header mounted = List.find_opt (fun n ->
    Shared_scenarios_views.has_tok n "custom-query-title") (M.all_nodes mounted.S.tree) in
  let marker mounted = List.exists (fun n -> M.string_prop n "accessibility-identifier"
    =Some ("ls-block-" ^ uuid)) (M.all_nodes mounted.S.tree) in
  h.after 30 (fun () ->
    S.flush mounted;
    check "Initial configured query counts arrive before held view data"
      (header mounted<>None && List.mem "thread-api/get-view-data" (h.pending ()));
    ignore (Lui_app.send mounted.S.app (Action.Journals_loaded [page]));
    S.flush mounted;
    h.release "thread-api/get-view-data";
    h.after 30 (fun () ->
    S.flush mounted;
    check "Configured journal queries load collapsed, overriding configured collapsed=false"
      (header mounted<>None && not (marker mounted)
       && List.exists (fun n -> M.string_prop n "text"=Some "Journal default") (M.all_nodes mounted.S.tree));
    check "Configured journal queries use datalog and the owning journal date context"
      (List.exists (fun spec -> W.get spec "kind"=Some (kw "datalog")
        && W.get spec "current-block-uuid"=None
        && W.get spec "current-page-title"=Some (W.String page.page_title)
        && W.get spec "today-day"=Some (W.Int (Dates.today_journal_day ()))
        && W.get spec "inputs"=Some (W.Array [kw "today"])) !specs);
    S.press mounted (Option.get (header mounted)).M.id;
    check "Expanding a configured query renders its real result block and count"
      (marker mounted && List.exists (fun n -> M.string_prop n "text"=Some "1 result") (M.all_nodes mounted.S.tree));
    S.press mounted (Option.get (header mounted)).M.id;
    check "Recollapsing a configured query hides its result block"
      (not (marker mounted));
    check "Built-in journal query results request no containing-page grouping"
      (!contexts<>[] && List.for_all (fun context -> W.get context "group-by-property-ident"=None) !contexts);
    check "Journal query headings are plain foldable rows with an expanding title and separate count"
      ((Option.get (header mounted)).M.kind<>"button"
       && List.exists (fun n -> Shared_scenarios_views.has_tok n "title-text"
         && Hashtbl.find_opt n.M.props "grow"=Some (Lui_protocol.FloatValue 1.)) (M.all_nodes mounted.S.tree)
       && not (List.exists (fun n -> Shared_scenarios_views.has_tok n "ls-foldable") (M.all_nodes mounted.S.tree)));
    check "Configured journal queries rely on the block-region minimum instead of a fixed top inset"
      (List.exists (fun n -> M.string_prop n "accessibility-identifier"=Some "today-queries"
         && not (Hashtbl.mem n.M.props "margin-top")) (M.all_nodes mounted.S.tree)
       && List.for_all (fun n -> not (Shared_scenarios_views.has_tok n "custom-query")
         || not (Hashtbl.mem n.M.props "margin-left")) (M.all_nodes mounted.S.tree));
    check "Journal query title ink has a one-pixel inset and counts use Master's top-aligned text-sm line box"
      (Hashtbl.find_opt (Option.get (header mounted)).M.props "padding-horizontal"=Some (Lui_protocol.IntValue 1)
       && List.exists (fun n -> Shared_scenarios_views.has_tok n "results-count"
         && Hashtbl.find_opt n.M.props "height"=Some (Lui_protocol.IntValue 24)
         && M.string_prop n "line-height"=Some "20px") (M.all_nodes mounted.S.tree));
    Hashtbl.replace query_rows "" [];
    subscription.Subs_state.run [];
    h.after 30 (fun () ->
      S.flush mounted;
      check "Empty built-in journal queries disappear like Master" (header mounted=None && not (marker mounted));
      Hashtbl.replace query_err "" "Journal query failed";
      subscription.Subs_state.run [];
      h.after 30 (fun () ->
        S.flush mounted;
        check "Rejected journal queries render an error instead of stale results"
          (not (marker mounted) && List.exists (fun n ->
            M.string_prop n "text"=Some "Journal query failed") (M.all_nodes mounted.S.tree));
        ignore (Lui_app.dispose mounted.S.app);
        Hashtbl.remove query_err ""; Hashtbl.replace query_rows "" [uuid];
        let fresh = mount page in
        h.after 30 (fun () ->
          S.flush fresh;
          check "Reloading today's configured query restores its heading and initial collapse"
            (header fresh<>None && not (marker fresh));
          ignore (Lui_app.dispose fresh.S.app);
          let old = mount {page with Model.page_journal_day=Some 20000101} in
          check "Configured queries are not mounted for older journals" (header old=None);
          ignore (Lui_app.dispose old.S.app);
          let rec title_cases = function
            | [] ->
                Hashtbl.remove titles uuid; Hashtbl.remove query_rows "";
                Runtime.read_model:=previous_read;
                Runtime.model_source:=previous_source; Runtime.app_flush:=previous_flush;
                before_worker_restore (fun () -> Runtime.worker:=previous_worker; finish ())
            | (title,expected)::rest ->
                let query = match query with W.Map fields -> W.Map
                  ((kw "title",title)::List.remove_assoc (kw "title") fields) | _ -> assert false in
                let mounted = mount ~query page in
                h.after 30 (fun () ->
                  S.flush mounted;
                  let texts = List.filter_map (fun n -> M.string_prop n "text") (M.all_nodes mounted.S.tree) in
                  check "Configured Hiccup titles render their content, including empty vectors, without an untitled fallback"
                    (header mounted<>None && not (List.mem "Untitled query" texts)
                     && List.for_all (fun text -> List.mem text texts) expected);
                  S.press mounted (Option.get (header mounted)).M.id;
                  check "Hiccup titled journal queries retain foldable results" (marker mounted);
                  ignore (Lui_app.dispose mounted.S.app);
                  title_cases rest) in
          title_cases [Edn.parse {|[:h3 "Hiccup journal default"]|},["Hiccup journal default"];
                       W.Array [],[]])))))

let configured_journal_reload (h : (_, _) Shared_scenarios_views.host) ~mounted ~finish =
  let previous_model = Lui_app.model mounted.S.app in
  let send action = ignore (Lui_app.send mounted.S.app action); S.flush mounted in
  let rows = ["journal-reload-21"; "journal-reload-19"] in
  List.iter2 (Hashtbl.replace titles) rows ["21"; "19"];
  Hashtbl.replace query_rows "" rows;
  let today = {(Test_check.page []) with Model.page_uuid=Some "journal-reload-owner";
    page_title="Today's journal"; page_journal_day=Some (Dates.today_journal_day ())} in
  let older day = {today with Model.page_uuid=Some ("journal-reload-" ^ string_of_int day);
    page_title=string_of_int day; page_journal_day=Some day} in
  let days = [today; older 20000103; older 20000102; older 20000101] in
  let query = Edn.parse {|{:title "Journal numbers" :query [:find (pull ?b [*]) :where [?b :block/title ?title]] :table-view? true}|} in
  let repo = Option.get previous_model.Model.repo in
  send (Action.Graph_config_loaded (repo,
    W.Map [kw "default-queries",W.Map [kw "journals",W.Array [query]]]));
  send (Action.Navigate_to Model.Journals);
  let subscriptions = !Subs_state.sync_subs in
  send (Action.Journals_loaded days);
  let later f = h.after 30 (fun () -> S.flush mounted; f ()) in
  let nodes () = M.all_nodes mounted.S.tree in
  let header () = List.find_opt (fun n ->
    Shared_scenarios_views.has_tok n "custom-query-title") (nodes ()) in
  let visible_rows () = List.filter (fun n -> Shared_scenarios_views.has_tok n "ls-table-row") (nodes ()) in
  let publish days = send (Action.Journals_loaded days) in
  let refresh () = List.iter (fun sub -> sub.Subs_state.run [])
    (List.filter (fun sub -> not (List.exists ((==) sub) subscriptions)) !Subs_state.sync_subs) in
  later (fun () ->
    check "Journal route queries start collapsed" (header ()<>None && visible_rows ()=[]);
    S.press mounted (Option.get (header ())).M.id;
    let header_id = (Option.get (header ())).M.id in
    check "Expanding the Journals default table renders both rows" (List.length (visible_rows ())=2);
    Hashtbl.replace titles (List.hd rows) "39";
    publish (List.filteri (fun i _ -> i<3) days);
    refresh ();
    later (fun () ->
      check "A numeric-save reload keeps the default query expanded while older days are removed"
        (Option.map (fun n -> n.M.id) (header ())=Some header_id && List.length (visible_rows ())=2
         && List.exists (fun n -> M.string_prop n "text"=Some "39") (nodes ()));
      publish days;
      later (fun () ->
        check "Pagination restores older days without remounting the expanded query"
          (Option.map (fun n -> n.M.id) (header ())=Some header_id && List.length (visible_rows ())=2);
        Hashtbl.replace query_rows "" [];
        refresh ();
        later (fun () ->
          check "Empty refreshed journal queries remove their previous rows" (header ()=None && visible_rows ()=[]);
          Hashtbl.replace query_err "" "Journal reload failed";
          refresh ();
          later (fun () ->
            check "Failed journal result refreshes expose the error without stale rows"
              (visible_rows ()=[] && List.exists (fun n -> M.string_prop n "text"=Some "Journal reload failed") (nodes ()));
            Hashtbl.remove query_err "";
            Hashtbl.replace query_rows "" rows;
            refresh ();
            later (fun () ->
              check "Recovered journal results retain the user's expanded state" (List.length (visible_rows ())=2);
              publish [];
              check "An empty Journals route removes configured query rows" (header ()=None && visible_rows ()=[]);
              publish days;
              later (fun () ->
                check "Reloading an empty Journals route starts a fresh collapsed query" (header ()<>None && visible_rows ()=[]);
                send (Action.Graph_config_loaded (repo,previous_model.graph_config));
                send (Action.Navigate_to previous_model.route);
                publish previous_model.journals;
                Option.iter (fun page -> send (Action.Page_loaded page)) previous_model.route_page;
                List.iter (Hashtbl.remove titles) rows;
                Hashtbl.remove query_rows "";
                finish ())))))))

let short_page_spacing ~finish =
  let previous_flush = !Runtime.app_flush in
  let section : Outliner_projection.section =
    {section_key="short-page";repository=Some "short-page";scope="main";
     page=Test_check.page [];is_last=true} in
  let block = Outliner_projection.Block
    {block=Test_check.block "short-block" "Short";scope="main";section;depth=0;ancestors=[]} in
  let header = Outliner_projection.Header section and footer = Outliner_projection.Footer section in
  let measurements = ref None and rows_state = ref None and spacing = ref None in
  let mounted = S.mount ~registry:(registry ()) ~profile:Logseq_el.web_profile
    ~initial:Model.initial ~reducer:Update.update ~view:(fun ctx _ _ ->
      let rows = Signal.state ctx.Lui_ui.ui_scheduler [header;block;footer] in
      let measured = Virt_list.section_spacings ~blocks_only:true ctx ~minimum:32.
          ~rows:(Signal.value rows) in
      measurements := Some measured; rows_state := Some rows;
      spacing := Some (measured.spacing_for (Outliner_projection.key header));
      Properties_value.block_value_wrap (Lui_elements.text ~value:"SQLite roundtrip" [])) () in
  Runtime.app_flush := (fun () -> S.flush mounted);
  let measured = Option.get !measurements in
  let value () = Signal.get (Option.get !spacing) in
  let measure row kind height = measured.on_row_measure (Outliner_projection.key row)
    (Outliner_projection.key header) kind height in
  let change rows = Runtime.signal_set (Option.get !rows_state) rows; S.flush mounted in
  let later f = ignore (Js.Global.setTimeout ~f 10) in
  check "Property block values use the reference two-pixel vertical inset"
    (List.exists (fun node -> Shared_scenarios_views.has_tok node "property-block-container"
      && Hashtbl.find_opt node.M.props "padding-vertical"=Some (Lui_protocol.IntValue 2))
      (M.all_nodes mounted.S.tree));
  measure header "header" 100.; measure footer "footer" 200.; measure block "block" 28.;
  later (fun () ->
    check "A short page preserves sixty pixels for its block and add row" (value () +. 28. +. 28. = 60.);
    measure block "block" nan;
    later (fun () ->
      check "Invalid body measurements do not change page spacing" (value ()=4.);
      change [header;footer];
      check "Empty pages clear residual body spacing" (value ()=0.);
      change [header;block;footer]; measure block "block" 28.;
      later (fun () ->
        check "The first block restores short-page spacing after an empty page" (value ()=4.);
        measure block "block" 56.;
        later (fun () ->
          check "Wrapped or property-bearing blocks need no extra body spacing" (value ()=0.);
          let second = Outliner_projection.Block
            {block=Test_check.block "second-short-block" "Second";scope="main";section;depth=0;ancestors=[]} in
          change [header;block;second;footer];
          measure block "block" 28.; measure second "block" 28.;
          later (fun () ->
            check "Two journal roots use their actual height without an extra four-pixel inset"
              (value ()=0. && 28. +. 28. +. 28. +. value ()=84.);
            change [header;block;footer];
            check "Deleting the second journal root restores the sixty-pixel minimum"
              (value ()=4. && 28. +. 28. +. value ()=60.);
            change [header;block;second;footer]; measure second "block" 28.;
            later (fun () ->
              check "Undoing the second-root deletion removes only the minimum-height remainder"
                (value ()=0.);
              ignore (Lui_app.dispose mounted.S.app); Runtime.app_flush := previous_flush; finish ()))))))

let run ~session ~finish =
  query_result_replacement ();
  let h = host () in
  plain_text_queries h ~finish:(fun () -> positive_query_views h ~finish:(fun () -> reference_filter_removal h ~finish:(fun () -> configured_journal_queries h
    ~before_worker_restore:(fun finish -> configured_journal_reload h ~mounted:session ~finish)
    ~finish:(fun () -> short_page_spacing ~finish:(fun () ->
    grouped_entity_headers h ~finish:(fun () ->
      Shared_scenarios_views.run h ~finish))))))
