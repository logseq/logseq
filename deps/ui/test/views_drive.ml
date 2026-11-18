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
              (fun (_, scope) -> Editor_state.clear_collapse_scope ~scope)
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

let run ~finish =
  query_result_replacement ();
  let h = host () in
  grouped_entity_headers h ~finish:(fun () ->
      Shared_scenarios_views.run h ~finish)
