(* Minimal cljs-map/vector/set operations on [Wire.t] values, used when
   building tx-data maps the way the cljs code does with persistent maps. *)

let assoc (m : Wire.t) (k : string) (v : Wire.t) : Wire.t =
  match m with
  | Wire.Map entries ->
      let replaced =
        List.exists
          (fun (ek, _) -> match ek with
             | Wire.Keyword s | Wire.String s -> String.equal s k
             | _ -> false)
          entries
      in
      if replaced then
        Wire.Map
          (List.map
             (fun (ek, ev) ->
                match ek with
                | Wire.Keyword s | Wire.String s when String.equal s k ->
                    (ek, v)
                | _ -> (ek, ev))
             entries)
      else Wire.Map (entries @ [ (Wire.Keyword k, v) ])
  | _ -> invalid_arg "assoc: not a map"

let assoc_list (m : Wire.t) (kvs : (string * Wire.t) list) : Wire.t =
  List.fold_left (fun acc (k, v) -> assoc acc k v) m kvs

let dissoc (m : Wire.t) (k : string) : Wire.t =
  match m with
  | Wire.Map entries ->
      Wire.Map
        (List.filter
           (fun (ek, _) ->
              match ek with
              | Wire.Keyword s | Wire.String s -> not (String.equal s k)
              | _ -> true)
           entries)
  | _ -> invalid_arg "dissoc: not a map"

let dissoc_list (m : Wire.t) (ks : string list) : Wire.t =
  List.fold_left dissoc m ks

let merge (a : Wire.t) (b : Wire.t) : Wire.t =
  match b with
  | Wire.Map entries ->
      List.fold_left
        (fun acc (ek, ev) ->
           match ek with
           | Wire.Keyword s | Wire.String s -> assoc acc s ev
           | _ -> acc)
        a entries
  | _ -> a

let get (m : Wire.t) (k : string) : Wire.t option = Wire.get k m

let get_in (m : Wire.t) (path : string list) : Wire.t option =
  List.fold_left
    (fun acc k -> match acc with Some v -> Wire.get k v | None -> None)
    (Some m) path

let contains (m : Wire.t) (k : string) : bool =
  match Wire.get k m with Some _ -> true | None -> false

let keys (m : Wire.t) : string list =
  match m with
  | Wire.Map entries ->
      List.filter_map
        (fun (ek, _) ->
           match ek with
           | Wire.Keyword s | Wire.String s -> Some s
           | _ -> None)
        entries
  | _ -> []

(* cljs conj on a set or vector *)
let conj (xs : Wire.t) (v : Wire.t) : Wire.t =
  match xs with
  | Wire.Set elems ->
      if List.exists (fun e -> e = v) elems then xs else Wire.Set (elems @ [ v ])
  | Wire.Array elems | Wire.List elems -> Wire.Array (elems @ [ v ])
  | Wire.Nil -> Wire.Set [ v ]
  | _ -> invalid_arg "conj: not a collection"

let empty_map : Wire.t = Wire.Map []
