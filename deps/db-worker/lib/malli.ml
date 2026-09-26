(* Minimal malli engine subset for db validation — ports the parts of
   malli.core / malli.error / malli.util that
   logseq.db.frontend.malli-schema + validate.cljs exercise:

     schema forms: :map (required/:optional keys, :error/path props),
     :sequential, :set, :or, :and, :multi (+ :malli.core/default),
     :fn, :enum, :=, primitives (:int :double :boolean :string :keyword
     :qualified-keyword :any :uuid inst? :map :coll :number :nil).

     validate/explain produce cljs-shaped errors {:in :path :schema
     :value :type :message}; humanize spells errors into nested maps
     keyed by :in (malli.error/humanize); closed_schema marks maps
     closed (malli.util/closed-schema). *)

open Datascript

type error =
  { e_in : value list (* :in — Keyword attr or Int64 index *)
  ; e_path : string list (* :path — schema path, for debugging *)
  ; e_message : string
  ; e_type : string
  }

type vctx = { db : db }

type map_entry =
  { me_key : string
  ; me_optional : bool
  ; me_schema : schema
  ; me_error_path : string option
  }

and schema =
  | Prim of prim
  | Enum of value list
  | Eq of value
  | Fn of string * (vctx -> value -> bool)
  | And of schema list
  | Or of schema list
  | Multi of (vctx -> value -> string) * (string * schema) list
  | MMap of map_entry list * bool (* closed? *)
  | SeqOf of schema
  | SetOf of schema

and prim =
  | PAny
  | PInt
  | PDouble
  | PBoolean
  | PString
  | PKeyword
  | PQualKeyword
  | PUuid
  | PInst
  | PMapT
  | PColl
  | PNumber
  | PNil

(* cljs integer? — a JS number with no decimal part *)
let integer_float (f : float) : bool =
  match classify_float f with
  | FP_nan | FP_infinite -> false
  | _ -> Float.equal f (Float.floor f)

(* cljs pred semantics over datascript values. Instant doubles as the
   int64 scalar rep: epoch-ms values (block/created-at, updated-at,
   tx-id, datetime property values) exceed int32 on melange and decode
   from storage/transit as Instant, so it counts wherever cljs would
   see the plain number (integer?, double?, number?). *)
let prim_ok (p : prim) (v : value) : bool =
  match p with
  | PAny -> true
  (* cljs int? — integer? accepts any number with no decimal part *)
  | PInt ->
      (match v with
       | Int64 _ -> true
       | Float f -> integer_float f
       | _ -> false)
  (* cljs double? is number? — JS numbers are all doubles, ints included *)
  | PDouble -> (match v with Int64 _ | Float _ -> true | _ -> false)
  | PNumber -> (match v with Int64 _ | Float _ -> true | _ -> false)
  | PBoolean -> (match v with Bool _ -> true | _ -> false)
  | PString -> (match v with String _ -> true | _ -> false)
  | PKeyword -> (match v with Keyword _ -> true | _ -> false)
  | PQualKeyword ->
      (match v with
       | Keyword s ->
           (match String.index_opt s '/' with
            | Some i -> i > 0 && i < String.length s - 1
            | None -> false)
       | _ -> false)
  | PUuid -> (match v with Uuid _ -> true | _ -> false)
  | PInst -> (match v with Instant _ -> true | _ -> false)
  | PMapT -> (match v with Map _ -> true | _ -> false)
  | PColl -> (match v with List _ | Vector _ | Set _ -> true | _ -> false)
  | PNil -> (match v with Nil -> true | _ -> false)

let prim_name = function
  | PAny -> ":any" | PInt -> ":int" | PDouble -> ":double"
  | PNumber -> ":number" | PBoolean -> ":boolean" | PString -> ":string"
  | PKeyword -> ":keyword" | PQualKeyword -> ":qualified-keyword"
  | PUuid -> ":uuid" | PInst -> "inst?" | PMapT -> ":map" | PColl -> ":coll"
  | PNil -> ":nil"

let map_get (k : string) (v : value) : value option =
  match v with
  | Map kvs ->
      List.find_map
        (fun (key, x) ->
          match key with
          | Keyword s | String s when s = k -> Some x
          | _ -> None)
        kvs
  | _ -> None

let coll_items = function
  | List xs | Vector xs | Set xs -> xs
  | _ -> []

let rec validate (ctx : vctx) (s : schema) (v : value) ~(in_ : value list)
    ~(path : string list) : error list =
  match s with
  | Prim p ->
      if prim_ok p v then []
      else
        [ { e_in = List.rev in_
          ; e_path = List.rev path
          ; e_message = "should be " ^ prim_name p
          ; e_type = "invalid-type" } ]
  | Enum vs ->
      if List.exists (Util.value_equal v) vs then []
      else
        [ { e_in = List.rev in_
          ; e_path = List.rev path
          ; e_message = "should be a valid enum value"
          ; e_type = "invalid-type" } ]
  | Eq x ->
      if Util.value_equal v x then []
      else
        [ { e_in = List.rev in_
          ; e_path = List.rev path
          ; e_message = "should be equal"
          ; e_type = "invalid-type" } ]
  | Fn (msg, f) ->
      if f ctx v then []
      else
        [ { e_in = List.rev in_
          ; e_path = List.rev path
          ; e_message = msg
          ; e_type = "fn" } ]
  | And ss -> List.concat_map (fun s -> validate ctx s v ~in_ ~path) ss
  | Or ss ->
      if List.exists (fun s -> validate ctx s v ~in_ ~path = []) ss then []
      else
        (* malli explains each failing branch; the first branch's errors
           carry the same :in keys consumers use *)
        (match ss with
         | s :: _ -> validate ctx s v ~in_ ~path
         | [] ->
             [ { e_in = List.rev in_
               ; e_path = List.rev path
               ; e_message = "invalid value"
               ; e_type = "invalid-type" } ])
  | Multi (dispatch, branches) ->
      let key = dispatch ctx v in
      (match
         List.find_opt (fun (k, _) -> k = key) branches
         |> Option.map snd
         |> function
         | Some s -> Some s
         | None ->
             List.find_opt
               (fun (k, _) -> k = "malli.core/default" || k = ":malli.core/default")
               branches
             |> Option.map snd
       with
       | Some s -> validate ctx s v ~in_ ~path
       | None ->
           [ { e_in = List.rev in_
             ; e_path = List.rev path
             ; e_message = "invalid dispatch value"
             ; e_type = "invalid-dispatch-value" } ])
  | MMap (entries, closed) ->
      (match v with
       | Map kvs ->
           let get k = map_get k v in
           let key_errors =
             List.concat_map
               (fun (e : map_entry) ->
                 match get e.me_key with
                 | Some x ->
                     let path' =
                       match e.me_error_path with
                       | Some ep -> ep :: path
                       | None -> e.me_key :: path
                     in
                     validate ctx e.me_schema x ~in_:(Keyword e.me_key :: in_)
                       ~path:path'
                 | None ->
                     if e.me_optional then []
                     else
                       [ { e_in = List.rev (Keyword e.me_key :: in_)
                         ; e_path = List.rev (e.me_key :: path)
                         ; e_message = "missing required key"
                         ; e_type = "malli.core/missing-key" } ])
               entries
           in
           let extra_errors =
             if closed then
               List.filter_map
                 (fun (k, _) ->
                   match k with
                   | Keyword s | String s
                     when not (List.exists (fun (e : map_entry) -> e.me_key = s) entries) ->
                       Some
                         { e_in = List.rev (Keyword s :: in_)
                         ; e_path = List.rev (s :: path)
                         ; e_message = "disallowed key"
                         ; e_type = "malli.core/extra-key" }
                   | _ -> None)
                 kvs
             else []
           in
           key_errors @ extra_errors
       | _ ->
           [ { e_in = List.rev in_
             ; e_path = List.rev path
             ; e_message = "should be a map"
             ; e_type = "invalid-type" } ])
  | SeqOf s ->
      (match v with
       | List xs | Vector xs ->
           List.concat_map Fun.id
             (List.mapi
                (fun i x ->
                  validate ctx s x ~in_:(Int64 (Int64.of_int i) :: in_) ~path:(string_of_int i :: path))
                xs)
       | _ ->
           [ { e_in = List.rev in_
             ; e_path = List.rev path
             ; e_message = "should be a sequential"
             ; e_type = "invalid-type" } ])
  | SetOf s ->
      (match v with
       | Set xs ->
           List.concat_map Fun.id
             (List.mapi
                (fun i x ->
                  validate ctx s x ~in_:(Int64 (Int64.of_int i) :: in_) ~path:(string_of_int i :: path))
                xs)
       | _ ->
           [ { e_in = List.rev in_
             ; e_path = List.rev path
             ; e_message = "should be a set"
             ; e_type = "invalid-type" } ])

let valid ctx s v = validate ctx s v ~in_:[] ~path:[] = []

let explain ctx s v = validate ctx s v ~in_:[] ~path:[]

(* malli.error/humanize — spells errors into a nested map following each
   error's :in path; leaves are vectors of message strings. *)
let humanize (errors : error list) : value =
  let rec insert (pairs : (value * value) list) (path : value list) (msg : string)
      : (value * value) list =
    match path with
    | [] -> pairs
    | k :: rest ->
        let cur = List.assoc_opt k pairs in
        (match rest with
         | [] ->
             let leaf =
               match cur with
               | Some (Vector msgs) -> Vector (msgs @ [ String msg ])
               | _ -> Vector [ String msg ]
             in
             (k, leaf) :: List.remove_assoc k pairs
         | _ ->
             let sub =
               match cur with Some (Map ps) -> ps | _ -> []
             in
             (k, Map (insert sub rest msg)) :: List.remove_assoc k pairs)
  in
  Map
    (List.fold_left
       (fun acc (e : error) -> insert acc e.e_in e.e_message)
       [] errors)

(* malli.util/closed-schema — mark every :map closed *)
let rec closed_schema (s : schema) : schema =
  match s with
  | MMap (entries, _) ->
      MMap
        ( List.map
            (fun (e : map_entry) -> { e with me_schema = closed_schema e.me_schema })
            entries,
          true )
  | And ss -> And (List.map closed_schema ss)
  | Or ss -> Or (List.map closed_schema ss)
  | SeqOf s -> SeqOf (closed_schema s)
  | SetOf s -> SetOf (closed_schema s)
  | Multi (d, branches) ->
      Multi (d, List.map (fun (k, s) -> (k, closed_schema s)) branches)
  | s -> s

(* constructors matching cljs schema vector shapes *)
let mmap ?(closed = false) ?(error_path : string option) entries : schema =
  ignore error_path;
  MMap
    ( List.map
        (fun (key, optional, s, ep) ->
          { me_key = key
          ; me_optional = optional
          ; me_schema = s
          ; me_error_path = ep })
        entries,
      closed )

let entry ?(optional = false) ?(error_path : string option) key s =
  (key, optional, s, error_path)
