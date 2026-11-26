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
  && a.V.query_has_settings = b.V.query_has_settings
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
  | Ok source ->
      let plain_text = match source with
        | Views_query.QDsl dsl -> String.length dsl > 0 && dsl.[0] = '"'
        | _ -> false in
      if s.V.query_error <> None then `Error (Option.get s.V.query_error)
      else if s.V.query_view <> W.Nil then `Custom s.V.query_view
      else if s.V.query_scalar_rows <> [] then `Scalar s.V.query_scalar_rows
      else if plain_text || s.V.query_rows <> [] || (s.V.loading && s.V.data <> Wr.VEmpty) then `Table
      else if s.V.loading then `Loading
      else `Empty

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
    (* Raw block results can produce an empty filtered view. *)
    column ~style_class:"query-result" ~gap:0 ~grow:1. ~min_width:0 ~min_height:0
      [ Views_table.foldable inst ~key:"qr"
          ~title:(Views_head.render_head inst)
          ~body:(body_el inst) ]
  | `Empty ->
    Ui_components.with_props [Ui_components.Prop.opacity 0.9]
      (text ~font_size:"0.875rem" ~margin_top:8 ~value:(I.t "search/no-result") [])
  | `Loading -> spacer ~key:"query-loading" []

let query_setting_el inst : t =
  let current = V.current_view inst in
  let label = I.t "block/set-query" in
  Ui_components.icon_button ~key:"qs" ~variant:`ghost ~size:`icon
    ~width:24 ~height:24 ~style_class:"ls-query-setting"
    ~transition:"opacity .3s ease-in"
    ~foreground:"var(--ls-secondary-text-color, var(--lx-gray-11))"
    ~label ~data_attrs:[ "data-tooltip", "" ]
    ~icon:(`app "settings")
    ~on_press:(fun _ -> if current () then Views_query.toggle_source_editor inst)
    [ tooltip ~key:"query-setting-tip" ~text:label ~anchor:`above
        ~anchor_alignment:`center ~anchor_offset:8. ~tooltip_delay:500 [] ]

let query_builder_el inst ~active (s : V.vstate) : t =
  let tree = Views_builder.tree_for inst in
  let current () = active () && Views_builder.tree_for inst == tree in
  let untitled =
    Ui_components.with_props
      [ Ui_components.Prop.opacity 0.75; Ui_components.Prop.hover_opacity 1. ]
      (text ~font_size:"1rem" ~value:(I.t "block/untitled-query") [])
  in
  match Views_query.parse_src_result s.V.qsrc with
  | Ok (Views_query.QDatalog query) -> (
      match W.map_get_string query "title" with
      | Some title -> text ~font_weight:500 ~value:title []
      | None -> untitled)
  | _ when s.V.is_advanced -> untitled
  | Error _ -> D.nothing
  | Ok _ ->
      row ~key:"query-builder-header" ~style_class:"block-head-wrap"
        ~cross:`center ~gap:4 ~min_width:0 ~flex_wrap:`wrap
        [ Views_builder.builder_el inst ~tree ~active:current ]

let query_settings_el inst (s : V.vstate) : t =
  if s.V.query_has_settings && not (Ui_services.env_publishing ()) then
    query_setting_el inst
  else D.nothing

let query_view_el inst : t =
  Logseq_el.fragment
    [ column ~gap:0 ~min_width:0 ~min_height:0 ~grow:1.
        [ column ~gap:0 ~min_width:0 ~min_height:0 ~grow:1.
            [ reactive ~equal:(fun a b -> query_content_key a=query_content_key b
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

let fail_view inst gen () =
  if V.fetch_fresh inst gen then
    V.update inst (fun s -> { s with V.loading = false; view_error = Some "" })

let collapsed_updates_for_list_rows row_uuids blocks =
  let row_set = Hashtbl.create (max 1 (List.length row_uuids)) in
  List.iter (fun uuid -> Hashtbl.replace row_set uuid ()) row_uuids;
  let add = ref Editor_state.String_set.empty in
  let rem = ref Editor_state.String_set.empty in
  let rec walk = function
    | W.Map _ as block ->
        let uuid =
          Option.get (W.map_get_uuid block "block/uuid")
        in
        (match W.get block "block/collapsed?" with
        | Some (W.Bool true) -> add := Editor_state.String_set.add uuid !add
        | Some (W.Bool false) | None ->
            rem := Editor_state.String_set.add uuid !rem
        | Some _ -> invalid_arg "List block collapsed flag must be a boolean");
        (match W.get block "block/children" with
        | None -> ()
        | Some (W.Array children | W.List children | W.Set children) ->
            List.iter walk children
        | Some _ -> invalid_arg "List block children must be a collection")
    | W.Array blocks | W.List blocks | W.Set blocks -> List.iter walk blocks
    | _ -> invalid_arg "List block tree node must be a map"
  in
  List.iter
    (fun block ->
      match W.map_get_uuid block "block/uuid" with
      | Some uuid when Hashtbl.mem row_set uuid -> walk block
      | Some _ | None -> ())
    blocks;
  !add, !rem

(* [~merge] copies the previous table into a fresh one so [blocks ==]
   changes and a refetch does not wipe rows already on screen.
   [~set_limit] is published in that same update: the body must not
   mount a wider prefix until those entities are in the table.
   [~fresh] drops a response whose snapshot was superseded. [~finally]
   runs on success and on worker failure so the batch ticket clears. *)
let load_blocks ?(merge = false) ?set_limit ?(fresh = fun () -> true)
    ?(on_error = fun () -> ())
    ?(finally = fun () -> ()) inst uuids f =
  let rec references acc = function
    | W.Uuid uuid -> uuid::acc
    | W.Array values | W.List values | W.Set values -> List.fold_left references acc values
    | _ -> acc in
  let filter_refs=List.fold_left (fun acc (clause:V.filter_clause) ->
    match clause.c_val with Some value -> references acc value | None -> acc) [] (V.get inst).V.filters in
  let uuids=dedupe_uuids (uuids @ List.rev filter_refs) in
  let state = V.get inst in
  let list_row_uuids =
    if state.V.display_type = "list" then row_uuids_of state.V.data else []
  in
  let child_uuids = Hashtbl.create (max 1 (List.length list_row_uuids)) in
  List.iter
    (fun uuid -> Hashtbl.replace child_uuids uuid ())
    list_row_uuids;
  let apply ?loaded_wire blocks =
    Fun.protect ~finally (fun () ->
        if fresh () then begin
          Option.iter
            (fun loaded_wire ->
              if list_row_uuids <> [] then begin
                let add, rem =
                  collapsed_updates_for_list_rows list_row_uuids loaded_wire
                in
                Outliner_ops.merge_collapsed ~current:fresh add rem
              end)
            loaded_wire;
          V.update inst (fun s ->
              let s = { s with V.blocks } in
              match set_limit with
              | None -> s
              | Some n -> { s with V.fetch_limit = n });
          if fresh () then f ()
        end)
  in
  if not (fresh ()) then finally ()
  else if uuids = [] then
    apply
      (if merge then copy_blocks (V.get inst).V.blocks else Hashtbl.create 64)
  else
    let blocks =
      if merge then copy_blocks (V.get inst).V.blocks
      else Hashtbl.create (max 16 (List.length uuids))
    in
    Db.get_blocks uuids ~metadata:true
      ~children_for:(fun uuid ->
        if Hashtbl.mem child_uuids uuid then Db.Complete_tree
        else Db.No_children)
      ~on_error:(fun () -> finally (); on_error ()) (fun bs ->
        List.iter
          (fun b ->
            match W.map_get_uuid b "block/uuid" with
            | Some u -> Hashtbl.replace blocks u b
            | None -> ())
          bs;
        apply ~loaded_wire:bs blocks)

let load_props inst f =
  let gen = !(inst.V.data_gen) in
  if (V.get inst).V.props_loaded then f ()
  else
    Db.get_all_properties ~on_error:(fail_view inst gen) (fun props ->
      if V.fetch_fresh inst gen then begin
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
        if V.fetch_fresh inst gen then f () end)

let build_columns inst =
  let gen = !(inst.V.data_gen) in
  let apply props =
    if V.fetch_fresh inst gen then begin
      let columns = Views_table.build_columns inst props in
      V.update inst (fun s -> { s with V.columns })
    end
  in
  match inst.V.kind with
  | V.KTagPage owner_uuid ->
      (* cljs objects.cljs build-class-object-columns: the Asset class
         gets an extra "File" column — detect it by the class ident *)
      Db.get_blocks [ owner_uuid ] ~on_error:(fail_view inst gen) (fun ents ->
        if V.fetch_fresh inst gen then begin
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
            ~on_error:(fail_view inst gen)
            (W.List [ W.Keyword "block/uuid"; W.Uuid owner_uuid ])
            apply end)
  | V.KPropertyPage owner_uuid ->
      (* cljs build-property-object-columns: the property itself is the
         only property column *)
      Db.get_all_properties ~on_error:(fail_view inst gen) (fun props ->
          apply
            (List.filter
               (fun p -> W.map_get_uuid p "block/uuid" = Some owner_uuid)
               props))
  | _ -> apply []

(* [fetch_limit] overrides the vstate's staged value — Signal.set is
   pending until the next stabilize, so a same-tick [V.ctx_of] would
   still read the old limit *)
let load_view_data ?(fetch_limit = 0) ?(built_in=false) inst =
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
          fail_view inst gen ()
      | Some v when W.get v "error" <> None ->
          let error = Option.get (W.get v "error") in
          let message = Option.get (W.map_get_string error "message") in
          V.update inst (fun s ->
              { s with V.data = Wr.VEmpty; view_error = Some message; loading = false })
      | Some v ->
          let d = Wr.decode_view_data v in
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
                ~on_error:(fail_view inst gen)
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
              ~on_error:(fail_view inst gen)
              inst uuids continue
          end
  in
  if built_in then begin
    let repo = Db.repo () in
    ignore ((let* entities = Runtime.invoke3 "thread-api/pull-many"
        (W.String repo) (W.String "[:db/id]")
        (W.Array (List.map (fun uuid -> W.Array [W.kw "block/uuid"; W.Uuid uuid])
          (V.get inst).V.query_rows)) in
      Outliner_ops.check_loader_result entities;
      if not (V.fetch_fresh inst gen) then Js.Promise.resolve () else
      let fields = match ctx with W.Map fields -> fields | _ -> assert false in
      let fields = List.filter_map (fun (k,v) -> match k with
        | W.Keyword "query-row-uuids" | W.Keyword "group-by-property-ident" -> None
        | W.Keyword "feature-type" -> Some (W.kw "view-feature-type",v)
        | _ -> Some (k,v)) fields in
      let fields = (W.kw "render?",W.Bool true) ::
        (W.kw "query-entity-ids",W.Array (List.map (fun entity ->
          W.Int (Option.get (W.map_get_int entity "db/id"))) (W.elems entities))) :: fields in
      let* data = Runtime.invoke3 "thread-api/get-view-data" (W.String repo) W.Nil (W.Map fields) in
      Outliner_ops.check_loader_result data;
      apply (Some data); Js.Promise.resolve ()) |> Db.catch_quiet ~on_error:(fail_view inst gen))
  end else if Ui_services.env_publishing () && view_uuid = "" then
    let repo = Db.repo () in
    let owner_ref = match inst.V.owner with
      | W.String name -> W.Array [ W.kw "block/name"; W.String name ]
      | W.Uuid uuid -> W.Array [ W.kw "block/uuid"; W.Uuid uuid ]
      | _ -> invalid_arg "View owner must be a page name or UUID" in
    ignore ((let* owner = Runtime.invoke3 "thread-api/pull"
        (W.String repo) (W.String "[:db/id]") owner_ref in
      Outliner_ops.check_loader_result owner;
      if not (V.fetch_fresh inst gen) then Js.Promise.resolve () else
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
          (W.String repo) W.Nil (W.Map fields) in
      Outliner_ops.check_loader_result data;
      apply (Some data);
      Js.Promise.resolve ()) |> Db.catch_quiet ~on_error:(fail_view inst gen))
  else Db.snapshots ~on_error:(fail_view inst gen)
    ~f:(fun snap -> apply (Db.snapshot_value snap key))
    [ Db.resource_view_data view_uuid ctx ]

let load_query_results ?(built_in=false) inst =
  if (V.get inst).V.query_rows <> [] then load_view_data ~built_in inst
  else begin
    build_columns inst;
    V.update inst (fun s -> { s with V.loading = false })
  end

let configured_query ~(page : Model.page) query : t =
 fun ctx parent ->
  let uuid = match page.Model.page_uuid with Some uuid -> uuid | None -> Ui_services.env_random_uuid () in
  let inst = V.make ~sched:ctx.Lui_ui.ui_scheduler
    ~kind:(V.KQuery {block_uuid=uuid}) ~feature:"query-result" ~owner:(W.Uuid uuid) in
  let inst = {inst with V.virtualize=false} in
  let collapsed = Signal.state ctx.Lui_ui.ui_scheduler true in
  let render_content = Signal.state ctx.Lui_ui.ui_scheduler false in
  let hovered = Signal.state ctx.Lui_ui.ui_scheduler false in
  let collapse_timer = ref None in
  let clear_collapse_timer () =
    match !collapse_timer with
    | Some id ->
        Ui_services.timers_clear_timeout id;
        collapse_timer := None
    | None -> ()
  in
  let toggle_collapsed () =
    clear_collapse_timer ();
    let next = not (Runtime.signal_get collapsed) in
    if not next then Signal.set render_content true;
    Signal.set collapsed next;
    if next then
      collapse_timer :=
        Some
          (Ui_services.timers_timeout
             (fun () ->
               collapse_timer := None;
               Signal.set render_content false;
               Runtime.flush ())
             200);
    Runtime.flush ()
  in
  let title = match W.get query "title", W.get query "title-key" with
    | _, Some (W.Keyword key) -> text ~value:(I.t key) []
    | Some (W.String title), _ -> row ~flex_wrap:`wrap (Render_inline.parse title)
    | Some (W.Array _ as title), _ -> column ~gap:0 (hiccup_els inst title)
    | _ -> text ~value:(I.t "block/untitled-query") [] in
  V.update inst (fun s -> {s with V.qsrc=Edn.to_string query;is_advanced=true;
    display_type=(if W.get query "table-view?"=Some (W.Bool true) then "table" else "list");
    group_by=None});
  let refresh () =
    if Ui_effect.alive ctx.Lui_ui.ui_scope then
      Views_query.run ~page_title:page.page_title ~built_in:true inst
        (fun () -> load_query_results ~built_in:true inst) in
  let refresh_pending = ref false in
  let schedule_refresh () =
    if not !refresh_pending then begin
      refresh_pending := true;
      ignore (Js.Promise.(resolve () |> then_ (fun () ->
        refresh_pending := false; refresh (); resolve ())))
    end in
  let sub = Runtime.on_sync (fun _ -> refresh ()) in
  ignore (Signal.own ctx.Lui_ui.ui_scope
    (Signal.subscribe ~emit_initial:false (Runtime.model_signal ()) (fun model ->
      if model.Model.context_revision <> !(inst.V.data_context_revision) then
        schedule_refresh ())));
  Signal.on_dispose ctx.Lui_ui.ui_scope (fun () ->
    clear_collapse_timer ();
    Runtime.off_sync sub; incr inst.V.data_gen;
    Editor_state.clear_collapse_scope ~descendants:true ~scope:inst.V.collapse_scope ());
  schedule_refresh ();
  let collapsed_sig = Signal.value collapsed in
  let control_cls =
    Logseq_el.own ctx
      (Signal.map2
         (fun h c ->
           if h || c then "control-show cursor-pointer" else "control-hide")
         (Signal.value hovered) collapsed_sig)
  in
  let arrow =
    if Ui_services.env_css_animations () then
      Ui_parts.class_signal collapsed_sig
        (fun c ->
          if c then "rotating-arrow collapsed" else "rotating-arrow not-collapsed")
        (box ~key:"query-caret-rot"
           [ icon ~key:"query-caret" ~point_size:16
               ~name:(`app "rotating-arrow")
               ~transition:"transform 100ms ease-in" [] ])
    else
      icon ~key:"query-caret" ~point_size:16
        ~name:
          (reactive
             (fun c ->
               `app (if c then "rotating-arrow" else "rotating-arrow-down"))
             collapsed_sig)
        []
  in
  let header =
    row ~style_class:"ls-foldable-title content"
      ~on_pointer_enter:(fun _ -> Signal.set hovered true; Runtime.flush ())
      ~on_pointer_leave:(fun _ -> Signal.set hovered false; Runtime.flush ())
      [ Ui_parts.pressable
          ~on_press:(fun _ -> toggle_collapsed ())
          (row ~style_class:"foldable-title custom-query-title" ~grow:1.
             [ (row ~cross:`center ~gap:4 ~min_height:24
                 ~style_class:"ls-foldable-header"
                 [ Ui_components.with_props
                     [ Ui_components.Prop.cursor `pointer
                     ; Ui_components.Prop.opacity 0.5
                     ; Ui_components.Prop.hover_opacity 1. ]
                     (Ui_components.foldable_control
                        [ Ui_parts.class_signal control_cls (fun cls -> cls)
                            (box ~key:"ch" [ arrow ]) ])
                 ; column ~style_class:"title-text" ~min_width:0 ~grow:1. [ title ]
                 ; Ui_components.with_props [ Ui_components.Prop.opacity 0.6 ]
                     (text ~style_class:"results-count" ~font_size:"0.875rem" ~margin_left:8
                        ~height:24 ~line_height:"20px"
                        ~value:
                          (reactive
                             (fun s ->
                               I.result_count
                                 (List.length s.V.query_rows + List.length s.V.query_scalar_rows))
                             (sig_of inst))
                        []) ])
             ]) ]
  in
  let results =
    Ui_parts.class_signal collapsed_sig
      (fun c -> "ls-foldable-content" ^ if c then " is-collapsed" else "")
      (box ~key:"query-fold" ~grow:1.
         ~transition:"grid-template-rows 0.2s ease-in-out"
         [ box ~key:"query-fold-inner" ~style_class:"ls-foldable-content-inner" ~grow:1.
             ~transition:"opacity 0.2s ease-in-out, transform 0.2s ease-in-out"
             [ if_ ~test:(Signal.value render_content)
                 (column ~style_class:"custom-query-results" ~margin_left:4 ~margin_top:4
                    [ reactive ~equal:body_eq
                        (fun s ->
                          match query_content_key s with
                          | `Table -> Views_table.result_el inst s
                          | _ -> query_content inst s)
                        (sig_of inst) ]) ] ])
  in
  (if_ ~test:(reactive (fun s -> s.V.query_error<>None || s.V.query_rows<>[]
          || s.V.query_scalar_rows<>[]) (sig_of inst))
     (column ~style_class:"custom-query" ~min_width:0 ~gap:0 ~margin_left:2
        [ header; results ])) ctx parent

let refresh inst =
  match inst.V.kind with
  | V.KQuery _ ->
      (* keep stale results visible during a refetch — only show the
         spinner when there is nothing rendered yet *)
      if (V.get inst).V.query_rows = [] then
        V.update inst (fun s -> { s with V.loading = true });
      Views_query.refresh_block inst (fun () ->
          Views_query.run inst (fun () -> load_query_results inst))
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
  let fail = fail_view inst gen in
  let key = Db.key_views inst.V.owner inst.V.feature in
  Db.snapshots
    ~on_error:fail
    ~f:(fun snap ->
      if V.fetch_fresh inst gen then
      match Db.snapshot_value snap key with
      | Some (W.Array uuids) | Some (W.List uuids) -> (
          let us = List.map (fun uuid ->
              match W.as_uuid uuid with
              | Some uuid -> uuid
              | None -> invalid_arg "Invalid view catalog UUID") uuids in
          Db.get_blocks us ~metadata:true ~on_error:fail (fun ents ->
            if V.fetch_fresh inst gen then begin
              (* get_blocks order is storage order — tabs follow the
                 resource's uuid order (cljs view-uuids), which also picks
                 the default view (first tab) *)
              let by_uuid = Hashtbl.create (List.length us) in
              List.iter
                (fun e ->
                  match Wr.decode_view_ent e with
                  | Some v -> Hashtbl.replace by_uuid v.Wr.vu v
                  | None -> invalid_arg "Invalid view catalog entity")
                ents;
              if not (List.for_all (Hashtbl.mem by_uuid) us) then
                invalid_arg "Incomplete view catalog entities";
              V.update inst (fun s ->
                  { s with
                    V.views = List.filter_map (Hashtbl.find_opt by_uuid) us
                  });
              if V.fetch_fresh inst gen then on_done () end))
      | _ -> fail ())
    [ Db.resource_views inst.V.owner inst.V.feature ]

(* resolve the uuid of the owner page/entity behind inst.owner — f
   gets None when the page is absent (cljs all_pages gates the view on
   [:page-identity views-page-name] and renders nothing when missing) *)
let owner_uuid inst ~on_error f =
  match inst.V.owner with
  | W.Uuid u -> f (Some u)
  | W.String name -> (
      let key = Db.key_page_identity name in
      Db.snapshots
        ~on_error
        ~f:(fun snap ->
          match Db.snapshot_value snap key with
          | Some (W.Uuid u) -> f (Some u)
          | _ -> f None)
        [ Db.res key ])
  | _ -> f None

(* cljs create-view! parents view blocks under the shared $$$views page
   (common-config/views-page-name) and skips the insert when that page
   cannot be resolved *)
let views_page_uuid ~on_error f =
  let key = Db.key_page_identity "$$$views" in
  Db.snapshots
    ~on_error
    ~f:(fun snap ->
      match Db.snapshot_value snap key with
      | Some (W.Uuid u) -> f (Some u)
      | _ -> f None)
    [ Db.res key ]

let create_view ~title ~uuid inst ~after =
  let gen = !(inst.V.data_gen) in
  let current () = V.fetch_fresh inst gen in
  let on_error = fail_view inst gen in
  owner_uuid inst ~on_error (function
    | _ when not (current ()) -> ()
    | Some ouuid ->
        views_page_uuid ~on_error (function
          | _ when not (current ()) -> ()
          | Some vpuuid ->
              Db.insert_view_block ~current ~on_error ~title ~uuid ~page_uuid:vpuuid
                ~owner_uuid:ouuid ~feature_type:inst.V.feature
                ~after:(fun () ->
                  load_views inst ~on_done:(fun () -> after ())) ()
          | None -> ())
    | None -> ())

(* auto-create the default "All" view (cljs create-view! auto-triggered?);
   when the owner or $$$views page cannot be resolved the view settles
   into its empty state instead of staying on Loading *)
let ensure_default_view inst =
  let gen = !(inst.V.data_gen) in
  let current () = V.fetch_fresh inst gen in
  let on_error = fail_view inst gen in
  match (V.get inst).V.views with
  | v :: _ -> select_view inst v
  | [] when Ui_services.env_publishing () -> refresh inst
  | [] ->
      owner_uuid inst ~on_error (function
        | _ when not (current ()) -> ()
        | Some ouuid ->
            let create () =
            let uuid =
              Db.gen_view_uuid ~owner:ouuid ~feature_type:inst.V.feature
            in
            views_page_uuid ~on_error (function
              | _ when not (current ()) -> ()
              | Some vpuuid ->
                  Db.insert_view_block ~current ~on_error ~title:(default_view_title inst)
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
            in
            if inst.V.kind = V.KLinkedRefs then
              let key = Db.key_ref_count ouuid in
              Db.snapshots ~on_error [Db.res key] ~f:(fun snap ->
                if current () then
                  match Db.snapshot_value snap key with
                  | Some (W.Int count) when count > 0 -> create ()
                  | Some (W.Int 0) ->
                      V.update inst (fun s -> {s with V.loading=false; items_count=0;
                        data=Wr.VGroupedList []; view_error=None});
                      kick_page_extras inst
                  | _ -> invalid_arg "Missing linked-reference count before default view creation")
            else create ()
        | None -> V.update inst (fun s -> { s with V.loading = false }))

(* ---------- actions ---------- *)

(* cljs view-tab menu: Rename is a dropdown-menu-sub whose sub-content
   holds a block-container title editor (inline rename). The head mounts
   the returned box as MCustom inside the Rename MSub; the popup layer
   focuses the input when the sub-content opens. *)
let rename_editor_box inst (v : Wr.view_ent) : Lui_elements.t =
 fun context parent ->
  let value = Signal.state context.Lui_ui.ui_scheduler v.Wr.vtitle in
  let commit () =
    P.close_all ();
    Db.save_block_title v.Wr.vu (Signal.get_state value) (fun () ->
        load_views inst ~on_done:(fun () -> refresh inst))
  in
  column ~style_class:"block-title-wrap" ~padding:8 ~cross:`stretch
    [ Ui_components.with_props
        [ Ui_components.Prop.font_size "16px"
        ; Ui_components.Prop.focus_shadow "none" ]
        (Ui_components.input ~padding:6 ~height:32
           ~text:(reactive Fun.id (Signal.value value)) ~autofocus:true
           ~background:"transparent" ~border_width:0
           ~foreground:"var(--ls-secondary-text-color)"
           ~on_input:(function
             | s -> Signal.set value s)
           ~on_submit:(fun _ -> commit ()) []) ] context parent

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
          ; toast_kind = "success"; toast_code = None; toast_duration = None });
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
      ~on_error:(fun () -> finish (Error "Full view data is unavailable"))
      ~f:(fun snap ->
        if not (fresh ()) then finish (Error "View context changed")
        else
          match Db.snapshot_value snap key with
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
  let same_context = V.current_view inst in
  let insert owner_uuid ~tags ~props =
    if same_context () then
      let uuid = Ui_services.env_random_uuid () in
      Db.insert_object_block ~uuid ~page_uuid:owner_uuid ~title:"" ~tags ~props (fun _ ->
        if same_context () then begin
          (* Open the sidebar first — refresh can sync-fail when the
             worker rejects get-render-snapshots (tests, offline), and
             must not block the edit handoff. *)
          Sidebar_state.open_uuid ~edit:true (Option.get (Sidebar_state.current ())) uuid;
          (* cljs class-objects view-data updates with the insert;
             refresh so + New shows the row without waiting on
             debounced sync-db-changes. *)
          (try refresh inst with _ -> ())
        end)
  in
  match inst.V.kind with
  | V.KTagPage _ when (V.get inst).V.asset_class ->
      (* cljs objects.cljs: Asset + New opens the file picker and
         uploads; do not mint an empty untitled Asset node. *)
      Editor_actions.trigger_asset_upload ()
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
          Views_query.run inst (fun () -> load_query_results inst))
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

(* One inst per repo/query block: row saves re-attach the existing source
   draft and editor. Model publications retire fetches, not the draft. *)
let query_insts : (string * string, V.inst) Hashtbl.t = Hashtbl.create 8

(* currently-mounted insts — refreshed on the worker's sync-db-changes
   broadcast; an inst leaves the table when its host unmounts *)
let live : (int, V.inst) Hashtbl.t = Hashtbl.create 16

let query_inst ~sched ~kind ~owner block_uuid =
  let repo = Runtime.repo () in
  match Hashtbl.find_opt query_insts (repo, block_uuid) with
  | Some inst ->
      if !(inst.V.data_context_revision) <>
          (Runtime.model ()).Model.context_revision then begin
        incr inst.V.data_gen;
        Signal.set inst.V.st (V.table_clear_selection (V.get inst))
      end;
      (inst, false)
  | None ->
      let inst =
        V.make ~sched ~kind ~feature:(feature_of_kind kind) ~owner
      in
      Hashtbl.replace query_insts (repo, block_uuid) inst;
      (* staged, not flushed — V.update flushes, and a flush inside
         the element mount corrupts the pending op stream *)
      Signal.set inst.V.st
        { (V.get inst) with
          V.is_advanced =
            (let t = String.trim (V.get inst).V.qsrc in
             String.length t > 0 && t.[0] = '{')
        ; view_uuid = block_uuid
        };
      (inst, true)

let query_title_owners : (int, int) Hashtbl.t = Hashtbl.create 8

(* cljs block-title-aux: a class-Query block's title row carries the
   query builder (or "Untitled query" for advanced queries) when the
   title is blank, followed by the query-setting button *)
let query_title_el ~block_uuid ~(title : t option) : t =
 fun ctx parent ->
  let kind = V.KQuery { block_uuid } in
  let inst, _ =
    query_inst ~sched:ctx.Lui_ui.ui_scheduler ~kind
      ~owner:(W.Uuid block_uuid) block_uuid
  in
  let repo = Runtime.repo () and route = Runtime.route () in
  Hashtbl.replace query_title_owners inst.V.id
    (1 + Option.value (Hashtbl.find_opt query_title_owners inst.V.id) ~default:0);
  Signal.on_dispose ctx.Lui_ui.ui_scope (fun () ->
    let owners = Hashtbl.find query_title_owners inst.V.id in
    if owners = 1 then Hashtbl.remove query_title_owners inst.V.id
    else Hashtbl.replace query_title_owners inst.V.id (owners - 1));
  let active () = Runtime.repo () = repo && Runtime.route () = route
    && Hashtbl.mem query_title_owners inst.V.id in
  row ~key:"query-title" ~cross:`center ~gap:4 ~min_width:0
    [ (match title with
       | Some t -> t
       | None -> reactive ~equal:body_eq
           (query_builder_el inst ~active)
           (sig_of inst))
    ; reactive ~equal:body_eq (query_settings_el inst) (sig_of inst)
    ] ctx parent

let view_with_virtualization ~virtualize ~kind ~owner : t =
 fun ctx parent ->
  let sched = ctx.Lui_ui.ui_scheduler in
  let repo = Runtime.repo () in
  let inst, fresh =
    match kind with
    | V.KQuery { block_uuid } -> query_inst ~sched ~kind ~owner block_uuid
    | _ ->
        (V.make ~sched ~kind ~feature:(feature_of_kind kind) ~owner, true)
  in
  let inst =
    { inst with
      V.virtualize
    ; V.collapse_scope =
        (if fresh then inst.V.collapse_scope else V.fresh_collapse_scope ())
    }
  in
  Hashtbl.replace live inst.V.id inst;
  (* defer to post-mount: refresh flushes signals, which must not run
     while the mount is still emitting ops (a microtask, so the current
     mount + its enclosing flush settle first) *)
  ignore
    Js.Promise.(
      resolve ()
      |> then_ (fun () ->
          if Ui_effect.alive ctx.Lui_ui.ui_scope && Runtime.repo () = repo then
          (match kind, fresh with
           | V.KQuery _, _ -> refresh inst
           | _, true ->
               load_views inst ~on_done:(fun () ->
                   ensure_default_view inst)
           | _ -> ());
          resolve ()));
  Signal.on_dispose ctx.Lui_ui.ui_scope (fun () ->
      Hashtbl.remove live inst.V.id;
      Editor_state.clear_collapse_scope ~descendants:true ~scope:inst.V.collapse_scope ();
      match inst.V.kind with
      | V.KQuery _ -> ()
      | _ -> incr inst.V.data_gen; Views_builder.drop_tree inst);
  (match inst.V.kind with
   | V.KQuery _ -> query_view_el inst
   | _ -> view_el inst)
    ctx parent

(* Admit result windows only after retained ownership is known. Constructors
   may be detached even inside an already mounted projected row. No result
   subtree is built before this decision, including cached query results. *)
let view ~kind ~owner : t =
 fun ctx parent ->
  let anchor = box ~display:`contents [] ctx parent in
  Outline_viewport_state.after_attachment ctx (fun () ->
    let virtualize = not (Outline_viewport_state.inside_rows ctx (Some anchor)) in
    ignore (view_with_virtualization ~virtualize ~kind ~owner ctx (Some anchor)));
  anchor

(* Toggle the raw-source editor of the cached query instance. *)
let toggle_query_editor ~block_uuid =
  match Hashtbl.find_opt query_insts (Runtime.repo (), block_uuid) with
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
