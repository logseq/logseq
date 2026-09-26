(* cljs-style map/collection operations over Datascript.value.
   The graph-parser cljs code manipulates heterogeneous maps with keyword
   keys; we model them as [Map (Keyword a, v)] pairs in insertion order,
   matching cljs array-map/hash-map behavior for assoc (replace in place,
   append at end) and dissoc. *)

open Datascript

let kw (s : attr) : value = Keyword s
let str (s : string) : value = String s

let key_eq (k : value) (name : attr) : bool =
  match k with Keyword s | String s -> s = name | _ -> false

let map_get (m : value) (a : attr) : value =
  match m with
  | Map kvs ->
    (match List.find_opt (fun (k, _) -> key_eq k a) kvs with
     | Some (_, v) -> v
     | None -> Nil)
  | _ -> Nil

let map_get_opt (m : value) (a : attr) : value option =
  match map_get m a with Nil -> None | v -> Some v

let map_get_str (m : value) (a : attr) : string option =
  match map_get m a with String s -> Some s | _ -> None

let map_get_int (m : value) (a : attr) : int option =
  match map_get m a with
  | Int64 n -> Datascript.Util.int64_to_int n
  | Float f -> Some (int_of_float f)
  | Instant n -> Some (Int64.to_int n)
  | _ -> None

let map_get_bool (m : value) (a : attr) : bool option =
  match map_get m a with Bool b -> Some b | _ -> None

let map_assoc (m : value) (a : attr) (v : value) : value =
  match m with
  | Map kvs ->
    if List.exists (fun (k, _) -> key_eq k a) kvs then
      Map (List.map (fun (k, v') -> if key_eq k a then (k, v) else (k, v')) kvs)
    else Map (kvs @ [ (kw a, v) ])
  | _ -> Map [ (kw a, v) ]

let map_assoc_pair (m : value) ((a, v) : attr * value) : value = map_assoc m a v

let map_dissoc (m : value) (names : attr list) : value =
  match m with
  | Map kvs -> Map (List.filter (fun (k, _) -> not (List.exists (key_eq k) names)) kvs)
  | _ -> m

let map_merge (m1 : value) (m2 : value) : value =
  match m1, m2 with
  | Map a, Map b ->
    List.fold_left map_assoc_pair (Map a)
      (List.map
         (fun (k, v) ->
           match k with
           | Keyword s | String s -> (s, v)
           | _ -> (Edn_util.pr_str k, v))
         b)
  | Map a, _ -> Map a
  | _, Map b -> Map b
  | _ -> Nil

let map_merge_with (f : attr -> value -> value -> value) (m1 : value) (m2 : value)
    : value =
  match m1, m2 with
  | Map a, Map b ->
    List.fold_left
      (fun acc (k, v) ->
        match k with
        | Keyword s | String s ->
          let cur = map_get acc s in
          map_assoc acc s (if cur = Nil then v else f s cur v)
        | _ -> acc)
      (Map a) b
  | _ -> m1

let map_update (m : value) (a : attr) (f : value -> value) : value =
  map_assoc m a (f (map_get m a))

let get_in (m : value) (path : attr list) : value =
  List.fold_left map_get m path

let get_in_opt (m : value) (path : attr list) : value option =
  match get_in m path with Nil -> None | v -> Some v

let rec assoc_in (m : value) (path : attr list) (v : value) : value =
  match path with
  | [] -> v
  | a :: rest -> map_assoc m a (assoc_in (map_get m a) rest v)

let rec update_in (m : value) (path : attr list) (f : value -> value) : value =
  match path with
  | [] -> f m
  | a :: rest -> map_assoc m a (update_in (map_get m a) rest f)

(* coll helpers *)
let coll_items (v : value) : value list =
  match v with
  | Vector xs | List xs | Set xs -> xs
  | _ -> []

let is_coll (v : value) : bool =
  match v with Vector _ | List _ | Set _ -> true | _ -> false

let is_map (v : value) : bool = match v with Map _ -> true | _ -> false
let is_string (v : value) : bool = match v with String _ -> true | _ -> false

let truthy (v : value) : bool = not (v = Nil || v = Bool false)

(* cljs (keyword m) lookup: keys can be keywords or strings *)
let kw_opt (v : value) : string option =
  match v with Keyword s -> Some s | _ -> None

let string_of_kwish (v : value) : string option =
  match v with Keyword s | String s | Symbol s -> Some s | _ -> None

let kw_name (v : value) : string option =
  match v with
  | Keyword s ->
    (match String.rindex_opt s '/' with
     | Some i -> Some (String.sub s (i + 1) (String.length s - i - 1))
     | None -> Some s)
  | _ -> None

let kw_namespace (v : value) : string option =
  match v with
  | Keyword s ->
    (match String.rindex_opt s '/' with
     | Some i when i > 0 -> Some (String.sub s 0 i)
     | _ -> None)
  | _ -> None

let kw_qualified (v : value) : bool =
  match kw_namespace v with Some _ -> true | _ -> false

(* cljs set ops on Set values *)
let set_of (xs : value list) : value = Set xs

let set_union (a : value) (b : value) : value =
  Set (List.sort_uniq compare (coll_items a @ coll_items b))

let set_intersection (a : value) (b : value) : value =
  Set (List.sort_uniq compare (List.filter (fun x -> List.mem x (coll_items b)) (coll_items a)))

let set_difference (a : value) (b : value) : value =
  let bs = coll_items b in
  Set (List.filter (fun x -> not (List.mem x bs)) (coll_items a))

let set_contains (s : value) (v : value) : bool = List.mem v (coll_items s)

(* seq of map entries *)
let map_entries (m : value) : (value * value) list =
  match m with Map kvs -> kvs | _ -> []

let map_entries_named (m : value) : (attr * value) list =
  List.filter_map
    (fun (k, v) -> match k with Keyword s | String s -> Some (s, v) | _ -> None)
    (map_entries m)
