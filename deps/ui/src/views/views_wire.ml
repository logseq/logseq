(* Wire decoding helpers for view snapshots — slot maps, view-data values,
   entity plain maps. *)

module W = Wire

let as_float = function
  | W.Float f -> Some f
  | W.Int n -> Some (float_of_int n)
  | W.Int64 n -> Some (Int64.to_float n)
  | _ -> None

(* entity ref inside a value: {:db/id n} | {:block/uuid u} | bare Int/Uuid *)
let ref_uuid v =
  match v with
  | W.Map _ -> W.map_get_uuid v "block/uuid"
  | W.Uuid u -> Some u
  | _ -> None

let ref_title v =
  match v with
  | W.Map _ -> W.map_get_string v "block/title"
  | _ -> None

let ref_id v =
  match v with
  | W.Map _ -> W.map_get_int v "db/id"
  | _ -> None

(* snapshot: {basis-rev, slots:{key->val}, groups} where slots key is
   [:resource <rk>] and val is {watch, value} *)
let snapshot_slot_value snap rk =
  match W.get snap "slots" with
  | Some (W.Map slots) ->
      List.find_map
        (fun (k, v) ->
          match k with
          | W.Array (W.Keyword "resource" :: rk' :: _) when rk' = rk ->
              W.get v "value"
          | _ -> None)
        slots
  | _ -> None

(* the slot's declared watch ({keys: #{affected-keys}, all?: bool}) —
   sync-db-changes refreshes gate on these so an unrelated tx doesn't
   refetch a resource it couldn't change. ([], true) = unknown —
   refresh conservatively *)
let snapshot_slot_watch snap rk : W.t list * bool =
  match W.get snap "slots" with
  | Some (W.Map slots) ->
      List.find_map
        (fun (k, v) ->
          match k with
          | W.Array (W.Keyword "resource" :: rk' :: _) when rk' = rk -> (
              match W.get v "watch" with
              | Some w ->
                  let keys =
                    match W.get w "keys" with
                    | Some ws -> W.elems ws
                    | None -> []
                  in
                  let all =
                    match W.get w "all?" with
                    | Some (W.Bool b) -> b
                    | _ -> true
                  in
                  Some (keys, all)
              | None -> Some ([], true))
          | _ -> None)
        slots
      |> Option.value ~default:([], true)
  | _ -> ([], true)

(* view entity fields used by views *)
type view_ent =
  { vu : string (* block/uuid *)
  ; vid : int (* db/id *)
  ; vtitle : string
  ; vtype : string (* logseq.property.view/type.* ident *)
  ; vfeature : string
  ; vsorting : W.t option
  ; vfilters : W.t option
  ; vhidden : string list
  ; vordered : string list
  ; vpinned : string list (* property idents *)
  ; vsized : (string * int) list
  ; vgroup_by : string option (* property ident *)
  ; vgroup_sort_by : string option
  ; vgroup_desc : bool option
  ; vgallery_display : string list
  ; vgallery_asset : string option
  ; vgallery_size : string option
  ; vgallery_width : int option
  ; vgallery_height : int option
  }

let ident_of_value v =
  match v with
  | W.Keyword s -> Some s
  | W.Map _ -> (
      match W.get v "db/ident" with
      | Some (W.Keyword s) -> Some s
      | _ -> None)
  | _ -> None

let str_list v =
  W.elems v
  |> List.filter_map (fun x ->
         match x with
         | W.Keyword s -> Some s
         | W.String s -> Some s
         | _ -> None)

let column_sizes = function
  | W.Nil -> []
  | W.Map entries ->
      List.map
        (fun (key, value) ->
          match key, as_float value with
          | W.Keyword id, Some size
            when Float.is_finite size && size >= 0.
                 && size < float_of_int max_int ->
              id, int_of_float (Float.round size)
          | _ -> invalid_arg "Invalid view column width")
        entries
  | _ -> invalid_arg "Expected a view column widths map"

let gallery_dimension m key =
  match Option.bind (W.get m key) as_float with
  | Some value when Float.is_finite value && value > 0. ->
      Some (int_of_float (Float.round (max 100. (min 1024. value))))
  | _ -> None

let decode_view_ent (m : W.t) : view_ent option =
  match W.map_get_uuid m "block/uuid" with
  | Some vu ->
      Some
        { vu
        ; vid = Option.value (W.map_get_int m "db/id") ~default:0
        ; vtitle = Option.value (W.map_get_string m "block/title") ~default:""
        ; vtype =
            Option.value
              (ident_of_value
                 (Option.value (W.get m "logseq.property.view/type")
                    ~default:W.Nil))
              ~default:"logseq.property.view/type.table"
        ; vfeature =
            Option.value
              (ident_of_value
                 (Option.value
                    (W.get m "logseq.property.view/feature-type")
                    ~default:W.Nil))
              ~default:""
        ; vsorting = W.get m "logseq.property.table/sorting"
        ; vfilters = W.get m "logseq.property.table/filters"
        ; vsized =
            column_sizes
              (Option.value (W.get m "logseq.property.table/sized-columns")
                 ~default:W.Nil)
        ; vhidden =
            str_list
              (Option.value (W.get m "logseq.property.table/hidden-columns")
                 ~default:W.Nil)
        ; vordered =
            str_list
              (Option.value
                 (W.get m "logseq.property.table/ordered-columns")
                 ~default:W.Nil)
        ; vpinned =
            W.elems
              (Option.value
                 (W.get m "logseq.property.table/pinned-columns")
                 ~default:W.Nil)
            |> List.filter_map ident_of_value
        ; vgroup_by =
            ident_of_value
              (Option.value
                 (W.get m "logseq.property.view/group-by-property")
                 ~default:W.Nil)
        ; vgroup_sort_by =
            ident_of_value
              (Option.value
                 (W.get m "logseq.property.view/sort-groups-by-property")
                 ~default:W.Nil)
        ; vgroup_desc =
            (match W.get m "logseq.property.view/sort-groups-desc?" with
             | Some (W.Bool b) -> Some b
             | _ -> None)
        ; vgallery_display =
            W.elems
              (Option.value
                 (W.get m "logseq.property.view/gallery-display-properties")
                 ~default:W.Nil)
            |> List.filter_map ident_of_value
        ; vgallery_asset =
            ident_of_value
              (Option.value
                 (W.get m "logseq.property.view/gallery-asset-property-ident")
                 ~default:W.Nil)
        ; vgallery_size =
            ident_of_value
              (Option.value
                 (W.get m "logseq.property.view/gallery-card-size")
                 ~default:W.Nil)
        ; vgallery_width =
            gallery_dimension m "logseq.property.view/gallery-card-width"
        ; vgallery_height =
            gallery_dimension m "logseq.property.view/gallery-card-height"
        }
  | None -> None

let gallery_dimensions view =
  match view with
  | Some { vgallery_size = Some "compact"; _ } -> 160, 232
  | Some { vgallery_size = Some "custom"
         ; vgallery_width = Some width; vgallery_height = Some height; _ }
    when width > 0 && height > 0 ->
      max 100 (min 1024 width), max 100 (min 1024 height)
  | _ -> 220, 320

let gallery_asset_ident ~asset_class ~infer ~cover_idents view =
  if asset_class then Some "block/uuid"
  else match Option.bind view (fun view -> view.vgallery_asset) with
    | Some ident -> Some ident
    | None -> if infer then (match cover_idents with [ident] -> Some ident | _ -> None)
        else None

let gallery_display_idents ~column_idents ~asset_ident view =
  let configured = Option.fold ~none:[] ~some:(fun view -> view.vgallery_display) view in
  let selected = if configured = [] then ["block/title"]
    else List.filter (fun ident -> List.mem ident configured) column_idents in
  List.filter (fun ident -> ident <> "select" && ident <> "id"
    && Some ident <> asset_ident) selected

(* view-data value decode *)
type vrow_group =
  { gv : W.t (* group value: Nil | entity map | scalar *)
  ; grows : string list
  }
type vrow_group_list =
  { glv : W.t
  ; glparts : (string * string list) list (* breadcrumb-uuid, rows *)
  }
type view_data =
  | VFlat of
      { rows : string list
      ; count : int
      ; previews : (string, W.t) Hashtbl.t
      ; qprops : string list (* query-result requested property idents *)
      }
  | VGrouped of vrow_group list
  | VGroupedList of vrow_group_list list
  | VEmpty

let uuids_of w =
  W.elems w |> List.filter_map (fun x -> W.as_uuid x)

(* normalized group value {kind:entity, uuid} -> uuid *)
let group_value_uuid (v : W.t) : string option =
  match W.as_keyword (Option.value (W.get v "kind") ~default:W.Nil) with
  | Some "entity" -> W.as_uuid (Option.value (W.get v "uuid") ~default:W.Nil)
  | _ -> None

(* How many linked/unlinked reference rows to materialize at once.
   Linked references send this as initial-row-count so the worker
   returns a prefix plus the index total. Unlinked stays client-side:
   the worker has no row-limit fast path for that scan. Zero
   fetch_limit means the first batch has not landed — render no rows
   rather than a Loading placeholder. *)
let ref_window = 16

let row_count = function
  | VFlat { rows; count; _ } -> max count (List.length rows)
  | VGrouped gs ->
      List.fold_left (fun n g -> n + List.length g.grows) 0 gs
  | VGroupedList gs ->
      List.fold_left
        (fun n g ->
          n
          + List.fold_left (fun n2 (_, rows) -> n2 + List.length rows) 0
              g.glparts)
        0 gs
  | VEmpty -> 0

let rec take_acc n acc = function
  | _ when n <= 0 -> List.rev acc
  | [] -> List.rev acc
  | x :: xs -> take_acc (n - 1) (x :: acc) xs

let take n xs = take_acc n [] xs

(* Prefix of [n] rows. Groups and partitions past the window are
   dropped so a page with thousands of reference groups does not mount
   an empty foldable per group. [VFlat.count] is left alone: it is the
   server total, not the mounted prefix. *)
let slice_view_data (d : view_data) n : view_data =
  if n <= 0 then
    match d with
    | VFlat f -> VFlat { f with rows = [] }
    | VGrouped _ -> VGrouped []
    | VGroupedList _ -> VGroupedList []
    | VEmpty -> VEmpty
  else
    match d with
    | VEmpty -> VEmpty
    | VFlat f -> VFlat { f with rows = take n f.rows }
    | VGrouped gs ->
        let rec go n acc = function
          | _ when n <= 0 -> List.rev acc
          | [] -> List.rev acc
          | g :: rest ->
              let rows = take n g.grows in
              let k = List.length rows in
              if k = 0 then go n acc rest
              else go (n - k) ({ g with grows = rows } :: acc) rest
        in
        VGrouped (go n [] gs)
    | VGroupedList gs ->
        let rec go_parts n acc = function
          | _ when n <= 0 -> List.rev acc
          | [] -> List.rev acc
          | (bu, rows) :: rest ->
              let rows' = take n rows in
              let k = List.length rows' in
              if k = 0 then go_parts n acc rest
              else go_parts (n - k) ((bu, rows') :: acc) rest
        in
        let rec go_groups n acc = function
          | _ when n <= 0 -> List.rev acc
          | [] -> List.rev acc
          | g :: rest ->
              let parts = go_parts n [] g.glparts in
              let k =
                List.fold_left (fun a (_, rs) -> a + List.length rs) 0 parts
              in
              if k = 0 then go_groups n acc rest
              else go_groups (n - k) ({ g with glparts = parts } :: acc) rest
        in
        VGroupedList (go_groups n [] gs)

type row_window = { rows : string list; headers : string list }

(* Row uuids with index in [start, stop), plus the group-value and
   breadcrumb uuids of groups that overlap that range. Later groups are
   not walked once [stop] is reached. *)
let row_window (d : view_data) ~start ~stop : row_window =
  if stop <= start || start < 0 then { rows = []; headers = [] }
  else
    let rows = ref [] in
    let headers = ref [] in
    let i = ref 0 in
    let add_header u = headers := u :: !headers in
    let eat_list xs =
      let rec go = function
        | _ when !i >= stop -> ()
        | [] -> ()
        | u :: rest ->
            let k = !i in
            incr i;
            if k >= start && k < stop then rows := u :: !rows;
            go rest
      in
      go xs
    in
    let note_overlap start_i uopt =
      if start_i < stop && !i > start && !i > start_i then
        match uopt with Some u -> add_header u | None -> ()
    in
    (match d with
    | VEmpty -> ()
    | VFlat { rows = rs; _ } -> eat_list rs
    | VGrouped gs ->
        let rec groups = function
          | _ when !i >= stop -> ()
          | [] -> ()
          | g :: rest ->
              let start_i = !i in
              eat_list g.grows;
              note_overlap start_i (group_value_uuid g.gv);
              groups rest
        in
        groups gs
    | VGroupedList gs ->
        let rec groups = function
          | _ when !i >= stop -> ()
          | [] -> ()
          | g :: rest ->
              let start_i = !i in
              List.iter
                (fun (bu, rs) ->
                  if !i < stop then begin
                    let p0 = !i in
                    eat_list rs;
                    if p0 < stop && !i > start && !i > p0 then add_header bu
                  end)
                g.glparts;
              note_overlap start_i (group_value_uuid g.glv);
              groups rest
        in
        groups gs);
    { rows = List.rev !rows; headers = List.rev !headers }

let decode_view_data (v : W.t) : view_data =
  match v with
  | W.Map _ -> (
      let count = Option.value (W.map_get_int v "count") ~default:0 in
      match W.map_get_string v "partition" |> Option.map (fun s -> s),
            W.get v "partition" with
      | _, Some (W.Keyword "grouped") ->
          let groups =
            W.elems (Option.value (W.get v "groups") ~default:W.Nil)
            |> List.map (fun g ->
                   { gv = Option.value (W.get g "value") ~default:W.Nil
                   ; grows =
                       uuids_of
                         (Option.value (W.get g "rows") ~default:W.Nil)
                   })
          in
          VGrouped groups
      | _, Some (W.Keyword "grouped-list") ->
          let groups =
            W.elems (Option.value (W.get v "groups") ~default:W.Nil)
            |> List.map (fun g ->
                   let parts =
                     W.elems
                       (Option.value (W.get g "partitions") ~default:W.Nil)
                     |> List.filter_map (fun p ->
                            match W.get p "breadcrumb-uuid" with
                            | Some (W.Uuid u) ->
                                Some
                                  (u, uuids_of
                                        (Option.value (W.get p "rows")
                                           ~default:W.Nil))
                            | _ -> None)
                   in
                   { glv = Option.value (W.get g "value") ~default:W.Nil
                   ; glparts = parts })
          in
          VGroupedList groups
      | _ ->
          let previews = Hashtbl.create 17 in
          (match W.get v "row-previews" with
           | Some (W.Map kvs) ->
               List.iter
                 (fun (k, pv) ->
                   match W.as_uuid k with
                   | Some u -> Hashtbl.replace previews u pv
                   | None -> ())
                 kvs
           | _ -> ());
          let qprops =
            W.elems (Option.value (W.get v "properties") ~default:W.Nil)
            |> List.filter_map ident_of_value
          in
          VFlat
            { rows = uuids_of (Option.value (W.get v "rows") ~default:W.Nil)
            ; count
            ; previews
            ; qprops
            })
  | _ -> VEmpty

(* :ref-pages-count on the normalized view-data map — [[title count]...]
   sorted desc by count (cljs get-ref-pages-count) *)
let decode_ref_counts (v : W.t) : (string * int) list =
  match W.get v "ref-pages-count" with
  | Some arr ->
      W.elems arr
      |> List.filter_map (fun p ->
             match W.elems p with
             | [ title; n ] ->
                 (match W.as_string title, W.as_int n with
                  | Some t, Some n -> Some (t, n)
                  | _ -> None)
             | _ -> None)
  | None -> []

let rec prop_text v =
  match v with
  | W.String s -> s
  | W.Int n -> string_of_int n
  | W.Float f ->
      let s = Printf.sprintf "%g" f in
      s
  | W.Bool true -> "true"
  | W.Bool false -> "false"
  | W.Uuid u -> u
  | W.Keyword s -> s
  | W.Map _ -> Option.value (ref_title v) ~default:""
  | W.Array xs | W.List xs | W.Set xs ->
      String.concat ", " (List.map prop_text xs)
  | _ -> ""
