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
  ; vgroup_by : string option (* property ident *)
  ; vgroup_sort_by : string option
  ; vgroup_desc : bool option
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
        }
  | None -> None

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
