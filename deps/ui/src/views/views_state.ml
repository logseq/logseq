(* Per-instance view state. A `view` is a mounted LUI element subtree;
   its data lives in a single immutable `vstate` carried by a Signal.state
   — every mutation publishes through `update` so the declarative tree
   repaints. Instances are created by Views_view.view at mount time and
   disposed with their mount scope. *)

open Promise_ext
module W = Wire
module Sset = Set.Make (String)

type feature = string (* "all-pages" | "class-objects" | "query-result" ... *)

type sort_item = { s_id : string; s_asc : bool }

type filter_clause =
  { c_prop : string (* property ident or built-in column id *)
  ; c_op : string
  ; c_val : W.t option
  }

(* column descriptor — mirrors views.cljs build-columns entries *)
type column =
  { c_id : string (* kw string: "block/title", property ident, "id", "select" *)
  ; c_name : string
  ; c_type : string (* logseq.property/type name *)
  ; c_prop : W.t option (* underlying property entity map, if any *)
  ; c_disable_hide : bool
  ; c_many : bool
  }

type inst_kind =
  | KAllPages
  | KTagPage of string (* owner tag page uuid *)
  | KPropertyPage of string (* owner property page uuid *)
  | KQuery of { block_uuid : string }

(* All view data + view-local UI state. Whole-record updates publish a new
   snapshot; collections that load wholesale (blocks, all_props,
   ref_titles) swap in a fresh table so renders see a consistent map. *)
type vstate =
  { view_uuid : string (* selected view entity uuid *)
  ; views : Views_wire.view_ent list
  ; view_ent : Views_wire.view_ent option
  ; sorting : sort_item list
  ; filters_or : bool
  ; filters : filter_clause list
  ; input : string
  ; search_open : bool
  ; group_by : string option
  ; group_sort_by : string option
  ; group_desc : bool option
  ; display_type : string (* ident tail: "table" | "list" | "gallery" *)
  ; selected : Sset.t
  ; hidden : Sset.t
  ; ordered : string list
  ; pinned : Sset.t
  ; columns : column list
  ; data : Views_wire.view_data
  ; blocks : (string, W.t) Hashtbl.t (* uuid -> block map *)
  ; loading : bool
  ; collapsed_groups : Sset.t
  ; query_rows : string list (* query-result feature input *)
  ; query_error : string option
  ; asset_class : bool (* KTagPage owner ident is logseq.class/Asset *)
  ; query_idents : string list (* property idents from view-data *)
  ; is_advanced : bool (* datalog query source *)
  ; query_scalar_rows : W.t list (* non-block query rows *)
  ; query_view : W.t (* hiccup wire produced by :view fn, Nil none *)
  ; qsrc : string (* query source text (value block title) *)
  ; query_block_uuid : string
        (* logseq.property/query value block uuid — query writes target it *)
  ; query_editor_open : bool (* raw-source CodeMirror visible *)
  ; props_loaded : bool
  ; all_props : (string, W.t) Hashtbl.t (* ident -> property entity *)
  ; ref_titles : (string, string) Hashtbl.t (* referenced uuid -> title *)
  }

type inst =
  { id : int
  ; kind : inst_kind
  ; feature : feature
  ; owner : W.t (* [:views] resource owner lookup *)
  ; st : vstate Signal.state
  }

let empty_vstate () : vstate =
  { view_uuid = ""
  ; views = []
  ; view_ent = None
  ; sorting = []
  ; filters_or = false
  ; filters = []
  ; input = ""
  ; search_open = false
  ; group_by = None
  ; group_sort_by = None
  ; group_desc = None
  ; display_type = "table"
  ; selected = Sset.empty
  ; hidden = Sset.empty
  ; ordered = []
  ; pinned = Sset.empty
  ; columns = []
  ; data = Views_wire.VEmpty
  ; blocks = Hashtbl.create 64
  ; loading = true
  ; collapsed_groups = Sset.empty
  ; query_rows = []
  ; query_error = None
  ; query_idents = []
  ; is_advanced = false
  ; query_scalar_rows = []
  ; query_view = W.Nil
  ; qsrc = ""
  ; query_block_uuid = ""
  ; query_editor_open = false
  ; props_loaded = false
  ; all_props = Hashtbl.create 17
  ; ref_titles = Hashtbl.create 8
  ; asset_class = false
  }

let next_id = ref 0

let make ~sched ~kind ~feature ~owner : inst =
  incr next_id;
  { id = !next_id
  ; kind
  ; feature
  ; owner
  ; st = Signal.state sched (empty_vstate ())
  }

let get inst : vstate = Runtime.signal_get inst.st

(* publish a new vstate — the only way view state changes *)
let set inst (s : vstate) = Runtime.signal_set inst.st s

let update inst f = set inst (f (get inst))

(* -- wire encode/decode of persisted table state -- *)

let sorting_to_wire sorting =
  W.Array
    (List.map
       (fun s ->
         W.Map
           [ (W.kw "id", W.Keyword s.s_id); (W.kw "asc?", W.Bool s.s_asc) ])
       sorting)

let sorting_of_wire = function
  | W.Array xs | W.List xs ->
      List.filter_map
        (fun m ->
          match W.get m "id", W.get m "asc?" with
          | Some (W.Keyword id), Some (W.Bool b) ->
              Some { s_id = id; s_asc = b }
          | Some (W.Keyword id), None -> Some { s_id = id; s_asc = true }
          | _ -> None)
        xs
  | _ -> []

let filter_val v = match v with W.Nil -> None | v -> Some v

let filters_of_wire w : filter_clause list * bool =
  match w with
  | W.Map _ -> (
      let or_ =
        match W.get w "or?" with Some (W.Bool b) -> b | _ -> false
      in
      match W.get w "filters" with
      | Some fs ->
          ( List.filter_map
              (fun c ->
                match c with
                | W.Array (W.Keyword p :: W.Keyword o :: rest) ->
                    Some
                      { c_prop = p; c_op = o
                      ; c_val =
                          (match rest with
                           | v :: _ -> filter_val v
                           | [] -> None)
                      }
                | _ -> None)
              (W.elems fs)
          , or_ )
      | None -> ([], or_))
  | _ -> ([], false)

let filters_to_wire filters or_ =
  W.Map
    [ (W.kw "or?", W.Bool or_)
    ; ( W.kw "filters"
      , W.Array
          (List.map
             (fun c ->
               match c.c_val with
               | Some v ->
                   W.Array
                     [ W.Keyword c.c_prop; W.Keyword c.c_op; v ]
               | None -> W.Array [ W.Keyword c.c_prop; W.Keyword c.c_op ])
             filters) )
    ]

(* view-data context for the [:view-data uuid ctx] resource *)
let ctx_of inst : W.t =
  let s = get inst in
  let base =
    [ (W.kw "feature-type", W.Keyword inst.feature)
    ; (W.kw "sorting", sorting_to_wire s.sorting)
    ; (W.kw "input", W.String s.input)
    ]
  in
  let base =
    match s.filters with
    | [] -> base
    | fs -> base @ [ (W.kw "filters", filters_to_wire fs s.filters_or) ]
  in
  let base =
    (* cljs effective group-by: stored group-by-property, else block/page
       for the list display — computed per request, so switching to List
       View without a stored group still partitions by parent page *)
    let group_by =
      match s.group_by with
      | Some _ -> s.group_by
      | None when s.display_type = "list" -> Some "block/page"
      | None -> None
    in
    match group_by with
    | Some g -> base @ [ (W.kw "group-by-property-ident", W.Keyword g) ]
    | None -> base
  in
  let base =
    (* cljs loaded-view-resource-plan: un-grouped all-pages/class-objects
       are windowed — initial-row-count = min 1000 (ceil viewport/33) *)
    match inst.feature, s.group_by with
    | ("all-pages" | "class-objects"), None ->
        let n =
          Web_dom.win_inner_height /. 33.
          |> max 0. |> ceil |> int_of_float |> max 1 |> min 1000
        in
        base @ [ (W.kw "initial-row-count", W.Int n) ]
    | _ -> base
  in
  let base =
    if inst.feature = "query-result" then
      base
      @ [ ( W.kw "query-row-uuids"
          , W.Array (List.map (fun u -> W.Uuid u) s.query_rows) ) ]
    else base
  in
  W.Map base

(* apply persisted view-entity state — pure vstate -> vstate *)
let apply_view_entity s (v : Views_wire.view_ent) : vstate =
  let display_type =
    match v.vtype with
    | "logseq.property.view/type.list" -> "list"
    | "logseq.property.view/type.gallery" -> "gallery"
    | _ -> "table"
  in
  let fs, or_ =
    match v.vfilters with Some w -> filters_of_wire w | None -> ([], false)
  in
  { s with
    view_uuid = v.vu
  ; view_ent = Some v
  ; display_type
  ; group_by =
      (match v.vgroup_by with
       | Some g -> Some g
       | None when display_type = "list" -> Some "block/page"
       | None -> None)
  ; sorting =
      (match v.vsorting with
       (* cljs effective-view-sorting: nil, empty or placeholder all fall
          back to updated-at desc *)
       | Some w -> (
           match sorting_of_wire w with
           | [] -> [ { s_id = "block/updated-at"; s_asc = false } ]
           | xs -> xs)
       | None -> [ { s_id = "block/updated-at"; s_asc = false } ])
  ; filters = fs
  ; filters_or = or_
  ; hidden =
      List.fold_left (fun s x -> Sset.add x s) Sset.empty v.vhidden
  ; ordered = v.vordered
  ; pinned =
      List.fold_left (fun s x -> Sset.add x s) Sset.empty v.vpinned
  ; group_sort_by = v.vgroup_sort_by
  ; group_desc = v.vgroup_desc
  }

let display_title (v : Views_wire.view_ent) =
  if String.trim v.vtitle = "" then I18n.new_view else v.vtitle

(* persisted write helpers *)
let persist_sorting inst =
  let s = get inst in
  Views_db.set_view_property s.view_uuid "logseq.property.table/sorting"
    (sorting_to_wire s.sorting)
    (fun () -> ())

let persist_filters inst =
  let s = get inst in
  Views_db.set_view_property s.view_uuid "logseq.property.table/filters"
    (filters_to_wire s.filters s.filters_or)
    (fun () -> ())

(* property ident -> :db/id via thread-api/pull [:db/id] ident *)
let resolve_property_id ident f =
  (let* w =
     Runtime.invoke3 "thread-api/pull" (W.String (Views_db.repo ()))
       (W.String "[:db/id]") (W.Keyword ident)
   in
   f (W.map_get_int w "db/id");
   Js.Promise.resolve ())
  |> Views_db.catch_quiet
  |> ignore

let persist_group_by inst =
  let s = get inst in
  match s.group_by with
  | Some g ->
      resolve_property_id g (fun id ->
          match id with
          | Some id ->
              Views_db.set_view_property s.view_uuid
                "logseq.property.view/group-by-property" (W.Int id)
                (fun () -> ())
          | None -> ())
  | None ->
      Views_db.remove_view_property s.view_uuid
        "logseq.property.view/group-by-property" (fun () -> ())

let persist_hidden inst =
  let s = get inst in
  Views_db.set_view_property s.view_uuid
    "logseq.property.table/hidden-columns"
    (W.Array (List.map (fun k -> W.Keyword k) (Sset.elements s.hidden)))
    (fun () -> ())

let persist_display_type inst =
  let s = get inst in
  Views_db.set_view_property s.view_uuid "logseq.property.view/type"
    (W.Keyword ("logseq.property.view/type." ^ s.display_type))
    (fun () -> ())

let persist_group_sort_by inst v =
  let s = get inst in
  match v with
  | Some id ->
      Views_db.set_view_property s.view_uuid
        "logseq.property.view/sort-groups-by-property"
        (W.Int id) (fun () -> ())
  | None ->
      Views_db.remove_view_property s.view_uuid
        "logseq.property.view/sort-groups-by-property" (fun () -> ())

let persist_group_desc inst d =
  update inst (fun s -> { s with group_desc = Some d });
  Views_db.set_view_property (get inst).view_uuid
    "logseq.property.view/sort-groups-desc?" (W.Bool d) (fun () -> ())

let persist_group_sort_by_ident inst ident f =
  update inst (fun s -> { s with group_sort_by = Some ident });
  resolve_property_id ident (fun id ->
      persist_group_sort_by inst id;
      f ())

(* operations implemented by views_view.ml, registered at install time to
   keep the module graph acyclic (head/table renderers call back through
   this record) *)
type ops =
  { o_refresh : inst -> unit
  ; o_refresh_src : inst -> string -> unit
  ; o_create_view : inst -> unit
  ; o_rename : inst -> Views_wire.view_ent -> unit
  ; o_export : inst -> unit
  ; o_add_object : inst -> unit
  ; o_title_of_uuid : inst -> string -> string
  }

let ops_ref : ops option ref = ref None

let ops () =
  match !ops_ref with
  | Some o -> o
  | None -> failwith "views: ops not installed"

let install_ops o = ops_ref := Some o
