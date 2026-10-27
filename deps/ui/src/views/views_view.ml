(* View orchestrator — [view ~kind ~owner] is a Lui_elements.t the mount
   sites inline into their own trees (all-pages route, tag/property
   .page-tabs, right-sidebar object tabs, .custom-query-results shells).
   The element owns the inst lifecycle (create on mount, dispose on
   unmount), kicks the data-load chain, and implements view CRUD /
   object creation / export. The body repaints through a reactive on the
   vstate signal — nothing scans the DOM to find mounted views. *)

open Promise_ext
module D = Logseq_el
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
  (Signal.value (inst.V.st))
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
  | _ -> (I.t "view/all")

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
  | None -> Option.value (Hashtbl.find_opt (V.get inst).V.ref_titles u) ~default:u

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
  && a.V.view_error = b.V.view_error
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

(* Result refreshes must not retire the active filter editor's draft or focus. *)
let body_el ?(equal=body_eq) inst : t =
  column ~gap:0 ~min_width:0 ~min_height:0 ~margin_top:4 ~style_class:"ls-view-body" ~grow:1.
    [ Views_head.filters_row ~margin_bottom:8 inst
    ; reactive ~equal (Views_table.result_el inst) (sig_of inst)
    ]

(* cljs views.cljs view: view container > div > .flex.flex-col.gap-2 >
   .flex.flex-col.gap-2.grid > foldable(key="view") with the whole body
   inside ls-foldable-content *)
let view_el inst : t =
  (* ref rows mount a prefix of the decoded result. [fetch_limit] is
     that prefix; without it in the equality the body keeps the empty
     first frame after the batch lands. Other features ignore it. *)
  let equal a b =
    body_eq a b
    &&
    match inst.V.kind with
    | V.KLinkedRefs | V.KUnlinkedRefs ->
        a.V.fetch_limit = b.V.fetch_limit
        && V.Sset.equal a.V.collapsed_groups b.V.collapsed_groups
    | _ -> true
  in
  let inner =
    column ~gap:0 ~grow:1. ~min_width:0 ~min_height:0
      [ Views_table.foldable inst ~key:"view"
          ~title:(Views_head.render_head inst)
          ~body:(body_el ~equal inst) ]
  in
  (* An empty linked-refs result (page with no mentions) unmounts the
     section once the snapshot has settled. While it is loading, or
     the wire count is still unknown (VEmpty), the head stays so the
     first rows are not gated on block-ref-count. *)
  fun ctx parent ->
    if inst.V.kind <> V.KLinkedRefs then inner ctx parent
    else
      let show =
        D.own ctx
          (Signal.map
             (fun (s : V.vstate) ->
               let settled_empty =
                 (not s.V.loading)
                 && s.V.data <> Wr.VEmpty
                 && s.V.items_count = 0
                 && Wr.row_count s.V.data = 0
                 && s.V.view_error = None
                 && s.V.filters = [] && s.V.input = ""
                 && s.V.ref_includes = [] && s.V.ref_excludes = []
               in
               not settled_empty)
             (Signal.value inst.V.st))
      in
      if_ ~test:show inner ctx parent

(* cljs custom-query: .views-query-inner holds [builder?; results] —
   the :view hiccup / scalar list / query-result table / loading /
   empty states — and the raw-source .CodeMirror editor is a sibling of
   the inner inside .custom-query-results *)
let query_content_key (s : V.vstate) =
  match Views_query.parse_src_result s.V.qsrc with
  | Error message -> `Error message
  | Ok Views_query.QBlank -> `Blank
  | Ok _ ->
      if s.V.query_error <> None then `Error (Option.get s.V.query_error)
      else if s.V.query_view <> W.Nil then `Custom s.V.query_view
      else if s.V.query_scalar_rows <> [] then `Scalar s.V.query_scalar_rows
      else if s.V.query_rows <> [] || s.V.data <> Wr.VEmpty || not s.V.loading then `Table
      else `Loading

let query_content inst (s : V.vstate) : t =
  match query_content_key s with
  | `Blank -> spacer ~key:"blank" []
  | `Custom view ->
    (* :view fn output replaces the default table (cljs custom-query) *)
    column ~min_width:0 ~gap:0 (hiccup_els inst view)
  | `Error error ->
    Views_table.error_el ~title:(I.t "query/error") ~content:error
  | `Scalar rows ->
    list
      (List.map
         (fun item ->
           let v =
             match item with
             | W.String s -> s
             | other -> Edn.to_string other
           in
           list_item ~text:v [])
         rows)
  | `Table ->
    (* block results → the query-result view. cljs renders the foldable
       live-query shell ("Live query (n)" head + view-actions + table)
       even when the result is empty. Keep this shell during a refresh. *)
    column ~style_class:"query-result" ~gap:0 ~grow:1. ~min_width:0 ~min_height:0
      [ Views_table.foldable inst ~key:"qr"
          ~title:(Views_head.render_head inst)
          ~body:(body_el inst) ]
  | `Loading ->
    text ~value:(I.t "ui/loading") ~padding:8 ~foreground:"muted-foreground" []

let query_view_el inst : t =
  Logseq_el.fragment
    [ column ~gap:0 ~min_width:0 ~min_height:0 ~grow:1.
        [ column ~gap:0 ~min_width:0 ~min_height:0 ~grow:1.
            [ reactive ~equal:body_eq
                (fun s ->
                  (* DSL queries, including blank ones, get the builder panel. *)
                  match Views_query.parse_src_result s.V.qsrc with
                  | Error _ | Ok (Views_query.QDatalog _) -> spacer ~key:"builder-off" []
                  | Ok _ ->
                      if s.V.is_advanced then spacer ~key:"builder-off" []
                      else Views_builder.builder_el inst ~tree:(Views_builder.tree_for inst))
                (sig_of inst)
            ; reactive ~equal:(fun a b -> query_content_key a=query_content_key b
                && (a.V.query_view = W.Nil || a.V.blocks == b.V.blocks))
                (query_content inst) (sig_of inst)
            ]
        ]
    ; Views_query.cm_host inst
    ]

(* ---------- data load ---------- *)

let ref_kind inst =
  match inst.V.kind with
  | V.KLinkedRefs | V.KUnlinkedRefs -> true
  | _ -> false

(* One in-flight reference batch per view. A second virt-end in the
   same frame (or a stale get-blocks finishing after a refresh) must
   not start another 48-uuid fetch or clear the newer ticket. *)
let ref_inflight : (int, int) Hashtbl.t = Hashtbl.create 4
let ref_ticket = ref 0

let ref_busy inst = Hashtbl.mem ref_inflight inst.V.id

let ref_begin inst =
  incr ref_ticket;
  let t = !ref_ticket in
  Hashtbl.replace ref_inflight inst.V.id t;
  t

let ref_end inst t =
  match Hashtbl.find_opt ref_inflight inst.V.id with
  | Some t' when t' = t -> Hashtbl.remove ref_inflight inst.V.id
  | _ -> ()

(* block-ref-count walks every referring entity. Run it only after
   this view's get-blocks has returned, and only for the route page,
   so it cannot sit ahead of the first reference rows. A remount is
   a new inst id and kicks again. *)
let extras_once : (int, unit) Hashtbl.t = Hashtbl.create 4

let kick_page_extras inst =
  if inst.V.kind = V.KLinkedRefs && not (Hashtbl.mem extras_once inst.V.id)
  then
    match (Runtime.model ()).M.route_page with
    | Some p -> (
        match p.M.page_uuid, inst.V.owner with
        | Some u, W.Uuid u' when u = u' ->
            Hashtbl.add extras_once inst.V.id ();
            !Runtime.refresh_page_side p
        | _ -> ())
    | None -> ()

let dedupe_uuids xs =
  let seen = Hashtbl.create (max 1 (List.length xs)) in
  List.filter
    (fun u ->
      if Hashtbl.mem seen u then false
      else (
        Hashtbl.add seen u ();
        true))
    xs

let copy_blocks src =
  let dst = Hashtbl.create (max 16 (Hashtbl.length src)) in
  Hashtbl.iter (Hashtbl.add dst) src;
  dst

(* [~merge] copies the previous table into a fresh one so [blocks ==]
   changes and a refetch does not wipe rows already on screen.
   [~set_limit] is published in that same update: the body must not
   mount a wider prefix until those entities are in the table.
   [~fresh] drops a response whose snapshot was superseded. [~finally]
   runs on success and on worker failure so the batch ticket clears. *)
let load_blocks ?(merge = false) ?set_limit ?(fresh = fun () -> true)
    ?(finally = fun () -> ()) inst uuids f =
  let rec references acc = function
    | W.Uuid uuid -> uuid::acc
    | W.Array values | W.List values | W.Set values -> List.fold_left references acc values
    | _ -> acc in
  let filter_refs=List.fold_left (fun acc (clause:V.filter_clause) ->
    match clause.c_val with Some value -> references acc value | None -> acc) [] (V.get inst).V.filters in
  let uuids=dedupe_uuids (uuids @ List.rev filter_refs) in
  let apply blocks =
    Fun.protect ~finally (fun () ->
        if fresh () then begin
          V.update inst (fun s ->
              let s = { s with V.blocks } in
              match set_limit with
              | None -> s
              | Some n -> { s with V.fetch_limit = n });
          f ()
        end)
  in
  if uuids = [] then
    apply
      (if merge then copy_blocks (V.get inst).V.blocks else Hashtbl.create 64)
  else
    let blocks =
      if merge then copy_blocks (V.get inst).V.blocks
      else Hashtbl.create (max 16 (List.length uuids))
    in
    Db.get_blocks uuids ~metadata:true ~on_error:finally (fun bs ->
        List.iter
          (fun b ->
            match W.map_get_uuid b "block/uuid" with
            | Some u -> Hashtbl.replace blocks u b
            | None -> ())
          bs;
        apply blocks)

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
          V.update inst (fun s ->
              { s with V.data = Wr.VEmpty; view_error = None; loading = false })
      | Some v when W.get v "error" <> None ->
          let error = Option.get (W.get v "error") in
          let message = Option.get (W.map_get_string error "message") in
          V.update inst (fun s ->
              { s with V.data = Wr.VEmpty; view_error = Some message; loading = false })
      | Some v ->
          let d =
            try Wr.decode_view_data v
            with e ->
              Ui_services.log_error ("view-data decode failed", e);
              Wr.VEmpty
          in
          let continue () =
            if V.fetch_fresh inst gen then
              load_props inst (fun () ->
                if V.fetch_fresh inst gen then build_columns inst)
          in
          if ref_kind inst then begin
            (* The worker may return a prefix (linked refs send
               initial-row-count) or the full uuid list. [items_count]
               is the wire total so the header stays exact while
               get-blocks only the staged window. fetch_limit stays 0
               until the first entities land, so the body mounts no
               rows and no Loading text. A growth keeps the prefix
               already on screen. *)
            let decoded = Wr.row_count d in
            let wire_count =
              Option.value (W.map_get_int v "count") ~default:0
            in
            let items_count =
              if wire_count > 0 then wire_count else decoded
            in
            let staged =
              if fetch_limit > 0 then fetch_limit else Wr.ref_window
            in
            let n = min staged decoded in
            let first = Wr.row_window d ~start:0 ~stop:n in
            let prev_limit = (V.get inst).V.fetch_limit in
            let growing = fetch_limit > prev_limit && prev_limit > 0 in
            let have =
              n > 0
              && List.for_all
                   (fun u -> Hashtbl.mem (V.get inst).V.blocks u)
                   first.Wr.rows
            in
            V.update inst (fun s ->
                { s with
                  V.data = d
                ; view_error = None
                ; loading = false
                ; items_count
                ; fetch_limit =
                    (if have then n else if growing then s.V.fetch_limit else 0)
                ; ref_pages_count = Wr.decode_ref_counts v
                ; query_idents =
                    (match d with
                     | Wr.VFlat { qprops; _ } -> qprops
                     | _ -> s.V.query_idents)
                });
            if n = 0 || have then begin
              continue ();
              kick_page_extras inst
            end
            else
              let ticket = ref_begin inst in
              let uuids = dedupe_uuids (first.Wr.rows @ first.Wr.headers) in
              (* Kick only from the callback. Invoking the count at
                 the same time as get-blocks races two HTTP threads,
                 and the count was winning and delaying the rows. *)
              load_blocks ~merge:growing ~set_limit:n
                ~fresh:(fun () -> V.fetch_fresh inst gen)
                ~finally:(fun () -> ref_end inst ticket)
                inst uuids (fun () ->
                  continue ();
                  kick_page_extras inst)
          end
          else begin
            V.update inst (fun s ->
                { s with
                  V.data = d
                ; view_error = None
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
            load_blocks ~fresh:(fun () -> V.fetch_fresh inst gen)
              inst uuids continue
          end
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
      V.table_clear_selection (V.apply_view_entity s v));
  refresh inst

let load_views inst ~on_done =
  let gen = V.new_fetch inst in
  let key = Db.key_views inst.V.owner inst.V.feature in
  Db.snapshots
    ~f:(fun snap ->
      if V.fetch_fresh inst gen then
      match Wr.snapshot_slot_value snap key with
      | Some (W.Array uuids) | Some (W.List uuids) -> (
          let us = List.filter_map W.as_uuid uuids in
          Db.get_blocks us ~metadata:true (fun ents ->
            if V.fetch_fresh inst gen then begin
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
              on_done () end))
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
  column ~style_class:"block-title-wrap" ~padding:8 ~cross:`stretch
    [ Ui_components.with_props
        [ Ui_components.Prop.font_size "16px"
        ; Ui_components.Prop.focus_shadow "none" ]
        (Ui_components.input ~padding:6 ~height:32
           ~text:v.Wr.vtitle ~autofocus:true
           ~background:"transparent" ~border_width:0
           ~foreground:"var(--ls-secondary-text-color)"
           ~on_input:(function
             | Lui_protocol.TextChanged (_, s) -> value := s
             | _ -> ())
           ~on_submit:(fun _ -> commit ()) []) ]

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
          { M.toast_id = 0; toast_key = None; toast_text = (I.t "export/view-nodes-data-copied")
          ; toast_kind = "success" });
     Ui_task.resolve ()))

(* Next reference window. A worker that ignored row-limit left every
   uuid in [data]; slice that locally. A windowed worker returned only
   the prefix, so ask for a larger initial-row-count. Skips while a
   batch is in flight or the current prefix is not in [blocks], so
   virt-end cannot stack fetches. *)
let load_more_refs inst =
  let s = V.get inst in
  let decoded = Wr.row_count s.V.data in
  let total =
    if s.V.items_count > decoded then s.V.items_count else decoded
  in
  if s.V.fetch_limit <= 0 || s.V.fetch_limit >= total || ref_busy inst then
    ()
  else if decoded > s.V.fetch_limit then
    let have = Wr.row_window s.V.data ~start:0 ~stop:s.V.fetch_limit in
    if not (List.for_all (fun u -> Hashtbl.mem s.V.blocks u) have.Wr.rows)
    then ()
    else
      let stop = min total (s.V.fetch_limit + Wr.ref_window) in
      let gen = !(inst.V.data_gen) in
      let ticket = ref_begin inst in
      let next = Wr.row_window s.V.data ~start:s.V.fetch_limit ~stop in
      let uuids = dedupe_uuids (next.Wr.rows @ next.Wr.headers) in
      load_blocks ~merge:true ~set_limit:stop
        ~fresh:(fun () -> V.fetch_fresh inst gen)
        ~finally:(fun () -> ref_end inst ticket)
        inst uuids (fun () -> ())
  else
    let stop = min total (s.V.fetch_limit + Wr.ref_window) in
    load_view_data ~fetch_limit:stop inst

(* windowed view-data growth — the row stream's virt-end dom-event fires
   when its last child nears the viewport; each bump doubles the fetched
   window until it covers the full result count (cljs
   offset-view-row-count). Reference features window the decoded uuids
   instead of resending the snapshot. *)
let load_more_rows inst =
  if ref_kind inst then load_more_refs inst
  else
    match (V.get inst).V.data with
    | Wr.VFlat { rows; count; _ }
      when List.length rows < count ->
        let limit = min count (2 * List.length rows) in
        V.update inst (fun s -> { s with V.fetch_limit = limit });
        load_view_data ~fetch_limit:limit inst
    | _ -> ()

(* Fetch the unwindowed resource for destructive actions without replacing
   the visible prefix or hydrating the entire graph into the viewport. *)
let ensure_full_action_rows inst on_done =
  let context_revision = (Runtime.model ()).Model.context_revision in
  let repo = Db.repo () in
  let route = Runtime.route () in
  let gen = !(inst.V.data_gen) in
  let view_uuid = (V.get inst).V.view_uuid in
  let full_ctx () =
    match V.ctx_of inst with
    | W.Map fields ->
        W.Map
          (List.filter
             (fun (key, _) -> key <> W.kw "initial-row-count") fields)
    | _ -> invalid_arg "View context must be a map"
  in
  let ctx = full_ctx () in
  let fresh () =
    (Runtime.model ()).Model.context_revision = context_revision
    && Db.repo () = repo && Runtime.route () = route
    && V.fetch_fresh inst gen
    && (V.get inst).V.view_uuid = view_uuid
    && full_ctx () = ctx
  in
  let settled = ref false in
  let finish result =
    if not !settled then begin
      settled := true;
      on_done (if fresh () then result else Error "View context changed")
    end
  in
  if view_uuid = "" then finish (Error "No selected view")
  else
    let key = Db.key_view_data view_uuid ctx in
    let fetch () = Db.snapshots
      ~f:(fun snap ->
        if not (fresh ()) then finish (Error "View context changed")
        else
          match Wr.snapshot_slot_value snap key with
          | None -> finish (Error "Full view data is unavailable")
          | Some (W.Map _ as wire) ->
              (match W.get wire "error" with
               | Some error ->
                   finish (Error (Option.value
                     (W.map_get_string error "message")
                     ~default:"Full view data is unavailable"))
               | None ->
                   (try
                      let expected = match W.map_get_int wire "count" with
                        | Some count when count >= 0 -> count
                        | _ -> invalid_arg "Invalid full view-data count" in
                      let entries key value = match W.get value key with
                        | Some (W.Array entries | W.List entries) -> entries
                        | _ -> invalid_arg "Invalid full view-data rows" in
                      let check_rows value =
                        List.iter (fun row ->
                          if W.as_uuid row = None then
                            invalid_arg "Invalid full view-data row")
                          (entries "rows" value) in
                      (match W.get wire "partition" with
                       | Some (W.Keyword "grouped") ->
                           List.iter check_rows (entries "groups" wire)
                       | Some (W.Keyword "grouped-list") ->
                           List.iter (fun group ->
                             List.iter (fun part ->
                               if W.map_get_uuid part "breadcrumb-uuid" = None then
                                 invalid_arg "Invalid full view-data partition";
                               check_rows part) (entries "partitions" group))
                             (entries "groups" wire)
                       | Some (W.Keyword "flat") | None -> check_rows wire
                       | _ -> invalid_arg "Invalid full view-data partition");
                      let data = Wr.decode_view_data wire in
                      let actual = List.length (row_uuids_of data) in
                      if expected > actual then
                        finish (Error "Full view data is incomplete")
                      else finish (Ok data)
                    with e ->
                      Ui_services.log_error ("full view-data decode failed", e);
                      finish (Error "Full view data is invalid")))
          | Some _ -> finish (Error "Full view data is invalid"))
      [ Db.resource_view_data view_uuid ctx ]
    in
    try fetch () with e ->
      Ui_services.log_error ("full view-data request failed", e);
      finish (Error "Full view data is unavailable")

let add_new_object inst =
  let repo = Db.repo () in
  let context = repo, Runtime.route () in
  let same_context () = context = (Db.repo (), Runtime.route ()) in
  let insert owner_uuid ~tags ~props =
    if same_context () then
      let uuid = Ui_services.env_random_uuid () in
      Db.insert_object_block ~uuid ~page_uuid:owner_uuid ~title:"" ~tags ~props (fun _ ->
        if same_context () then
          Sidebar_state.open_uuid ~edit:true (Option.get (Sidebar_state.current ())) uuid)
  in
  match inst.V.kind with
  | V.KTagPage owner_uuid -> insert owner_uuid ~tags:[owner_uuid] ~props:[]
  | V.KPropertyPage owner_uuid ->
      ignore ((let* property = Runtime.invoke3 "thread-api/pull"
          (W.String repo) (W.String "[:db/ident :logseq.property/type]")
          (W.Array [W.kw "block/uuid";W.Uuid owner_uuid]) in
        let ident = Option.get (W.get property "db/ident") in
        let* value =
          if W.get property "logseq.property/type" = Some (W.Keyword "checkbox") then
            Js.Promise.resolve (W.Bool false)
          else
            let* placeholder = Runtime.invoke3 "thread-api/pull"
              (W.String repo) (W.String "[:db/id]")
              (W.Keyword "logseq.property/empty-placeholder") in
            Js.Promise.resolve (W.Int (Option.get (W.map_get_int placeholder "db/id")))
        in
        insert owner_uuid ~tags:[] ~props:[ident,value];
        Js.Promise.resolve ()) |> Db.catch_write)
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
    ; o_full_action_rows = ensure_full_action_rows
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
let debounced_refresh = lazy (Ui_services.timers_debounce 150)

let refresh_live_insts () =
  (Lazy.force debounced_refresh) (fun () ->
      Hashtbl.iter (fun _ inst ->
        load_views inst ~on_done:(fun () ->
          if Hashtbl.mem live inst.V.id then begin
            let s = V.get inst in
            match List.find_opt (fun v -> v.Wr.vu = s.V.view_uuid) s.V.views with
            | Some v ->
                V.update inst (fun s -> V.apply_view_entity s v);
                refresh inst
            | None -> ensure_default_view inst
          end)) live)

let () =
  install_ops ();
  ignore (Runtime.on_sync (fun _ -> refresh_live_insts ()))
