(* Per-instance view state. A `view` is mounted inside a DOM container;
   its data lives here and re-renders on sync-db-changes / user actions. *)

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

type inst =
  { id : int
  ; kind : inst_kind
  ; feature : feature
  ; owner : W.t (* [:views] resource owner lookup *)
  ; mutable container : Views_dom.el (* .ls-view-body mount point *)
  ; mutable view_uuid : string (* selected view entity uuid *)
  ; mutable views : Views_wire.view_ent list
  ; mutable view_ent : Views_wire.view_ent option
  ; mutable sorting : sort_item list
  ; mutable filters_or : bool
  ; mutable filters : filter_clause list
  ; mutable input : string
  ; mutable search_open : bool
  ; mutable group_by : string option
  ; mutable group_sort_by : string option
  ; mutable group_desc : bool option
  ; mutable display_type : string (* ident tail: "table" | "list" | "gallery" *)
  ; mutable selected : Sset.t
  ; mutable hidden : Sset.t
  ; mutable ordered : string list
  ; mutable pinned : Sset.t
  ; mutable columns : column list
  ; mutable data : Views_wire.view_data
  ; mutable blocks : (string, W.t) Hashtbl.t (* uuid -> block map *)
  ; mutable loading : bool
  ; mutable collapsed_groups : Sset.t
  ; mutable query_rows : string list (* query-result feature input *)
  ; mutable query_error : string option
  ; mutable asset_class : bool (* KTagPage owner ident is logseq.class/Asset *)
  ; mutable query_idents : string list (* property idents from view-data *)
  ; mutable is_advanced : bool (* datalog query source *)
  ; mutable query_scalar_rows : W.t list (* non-block query rows *)
  ; mutable query_view : W.t (* hiccup wire produced by :view fn, Nil none *)
  ; mutable qsrc : string (* query source text (value block title) *)
  ; mutable query_block_uuid : string
        (* logseq.property/query value block uuid — query writes target it *)
  ; mutable query_editor_open : bool
        (* raw-source CodeMirror visible — page remounts re-open it on the
           fresh shell so a rebuild never silently loses the editor *)
  ; all_props : (string, W.t) Hashtbl.t (* ident -> property entity *)
  ; mutable props_loaded : bool
  ; ref_titles : (string, string) Hashtbl.t (* referenced uuid -> title *)
  ; mutable watch : (W.t list * bool) option
      (** unioned [:resource] slot watches recorded as snapshots land
          (Views_wire.snapshot_slot_watch): keys + all?. None until the
          first snapshot — refresh conservatively. Sync subs skip an
          inst the batch's affected-keys can't reach *)
  }

let next_id = ref 0

let make ~kind ~feature ~owner ~container : inst =
  incr next_id;
  { id = !next_id
  ; kind
    ; feature
    ; owner
    ; container
    ; view_uuid = ""
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
    ; all_props = Hashtbl.create 17
    ; props_loaded = false
    ; ref_titles = Hashtbl.create 8
    ; asset_class = false
    ; watch = None
    }

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
  let base =
    [ (W.kw "feature-type", W.Keyword inst.feature)
    ; (W.kw "sorting", sorting_to_wire inst.sorting)
    ; (W.kw "input", W.String inst.input)
    ]
  in
  let base =
    match inst.filters with
    | [] -> base
    | fs -> base @ [ (W.kw "filters", filters_to_wire fs inst.filters_or) ]
  in
  let base =
    match inst.group_by with
    | Some g -> base @ [ (W.kw "group-by-property-ident", W.Keyword g) ]
    | None -> base
  in
  let base =
    (* cljs loaded-view-resource-plan: un-grouped all-pages/class-objects
       are windowed — initial-row-count = min 1000 (ceil viewport/33) *)
    match inst.feature, inst.group_by with
    | ("all-pages" | "class-objects"), None ->
        let n =
          Views_dom.window_inner_height /. 33.
          |> max 0. |> ceil |> int_of_float |> max 1 |> min 1000
        in
        base @ [ (W.kw "initial-row-count", W.Int n) ]
    | _ -> base
  in
  let base =
    if inst.feature = "query-result" then
      base
      @ [ ( W.kw "query-row-uuids"
          , W.Array (List.map (fun u -> W.Uuid u) inst.query_rows) ) ]
    else base
  in
  W.Map base

(* apply persisted view-entity state into the instance *)
let apply_view_entity inst (v : Views_wire.view_ent) =
  inst.view_uuid <- v.vu;
  inst.view_ent <- Some v;
  inst.display_type <-
    (match v.vtype with
     | "logseq.property.view/type.list" -> "list"
     | "logseq.property.view/type.gallery" -> "gallery"
     | _ -> "table");
  inst.group_by <-
    (match v.vgroup_by with
     | Some g -> Some g
     | None when inst.display_type = "list" -> Some "block/page"
     | None -> None);
  inst.sorting <-
    (match v.vsorting with
     | Some w -> sorting_of_wire w
     | None -> [ { s_id = "block/updated-at"; s_asc = false } ]);
  (match v.vfilters with
   | Some w ->
       let fs, or_ = filters_of_wire w in
       inst.filters <- fs;
       inst.filters_or <- or_
   | None ->
       inst.filters <- [];
       inst.filters_or <- false);
  inst.hidden <-
    List.fold_left (fun s x -> Sset.add x s) Sset.empty v.vhidden;
  inst.ordered <- v.vordered;
  inst.pinned <-
    List.fold_left (fun s x -> Sset.add x s) Sset.empty v.vpinned;
  inst.group_sort_by <- v.vgroup_sort_by;
  inst.group_desc <- v.vgroup_desc

let display_title (v : Views_wire.view_ent) =
  if String.trim v.vtitle = "" then I18n.new_view else v.vtitle

(* persisted write helpers *)
let persist_sorting inst =
  Views_db.set_view_property inst.view_uuid "logseq.property.table/sorting"
    (sorting_to_wire inst.sorting)
    (fun () -> ())

let persist_filters inst =
  Views_db.set_view_property inst.view_uuid "logseq.property.table/filters"
    (filters_to_wire inst.filters inst.filters_or)
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
  match inst.group_by with
  | Some g ->
      resolve_property_id g (fun id ->
          match id with
          | Some id ->
              Views_db.set_view_property inst.view_uuid
                "logseq.property.view/group-by-property" (W.Int id)
                (fun () -> ())
          | None -> ())
  | None ->
      Views_db.remove_view_property inst.view_uuid
        "logseq.property.view/group-by-property" (fun () -> ())

let persist_hidden inst =
  Views_db.set_view_property inst.view_uuid
    "logseq.property.table/hidden-columns"
    (W.Array (List.map (fun k -> W.Keyword k) (Sset.elements inst.hidden)))
    (fun () -> ())

(* fold a snapshot slot's watch into the inst's union — repeated
   resources accumulate keys; all? sticks once set *)
let note_watch (inst : inst) (snap : W.t) (rk : W.t) =
  let keys, all = Views_wire.snapshot_slot_watch snap rk in
  inst.watch <-
    Some
      (match inst.watch with
       | None -> (keys, all)
       | Some (ks, a) -> (ks @ keys, a || all))

(* can this batch's affected-keys reach the inst — [] = no info ->
   refresh *)
let inst_hits (inst : inst) (affected : W.t list) =
  if affected = [] then true
  else
    match inst.watch with
    | None | Some (_, true) -> true
    | Some (keys, false) ->
        List.exists (fun k -> List.mem k keys) affected

let persist_display_type inst =
  Views_db.set_view_property inst.view_uuid "logseq.property.view/type"
    (W.Keyword ("logseq.property.view/type." ^ inst.display_type))
    (fun () -> ())

let persist_group_sort_by inst v =
  match v with
  | Some id ->
      Views_db.set_view_property inst.view_uuid
        "logseq.property.view/sort-groups-by-property"
        (W.Int id) (fun () -> ())
  | None ->
      Views_db.remove_view_property inst.view_uuid
        "logseq.property.view/sort-groups-by-property" (fun () -> ())

let persist_group_desc inst d =
  inst.group_desc <- Some d;
  Views_db.set_view_property inst.view_uuid
    "logseq.property.view/sort-groups-desc?" (W.Bool d) (fun () -> ())

let persist_group_sort_by_ident inst ident f =
  inst.group_sort_by <- Some ident;
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
