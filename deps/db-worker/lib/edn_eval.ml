(* Minimal sci/eval-string evaluator for :result-transform.

   cljs runs the EDN source through SCI inside the worker
   (handler/render_resource/query.cljs apply-result-transform). This module
   interprets the same EDN forms over Datascript.value. Query-result entities
   cross in as [Ent eid] so keyword lookups resolve against the live db via
   the caller-supplied [entity_attr] resolver.

   Scope: the core-fn surface result transforms realistically use — seq
   manipulation (map/filter/remove/keep/group-by/sort-by/take/drop/...),
   map access (get/assoc/dissoc/select-keys/update-in/...), fn shorthand
   (#(%), fn with & rest and basic destructuring), threading (->, ->>,
   cond->, some->), let/if/when/cond/case, clojure.string basics, and
   try/catch via Throw_value. Unsupported forms fail fast with Eval_error
   rather than guessing. *)

open Datascript

exception Eval_error of string
exception Throw_value of value

let eval_error fmt = Printf.ksprintf (fun msg -> raise (Eval_error msg)) fmt

(* Runtime values: plain EDN values plus closures and pooled entities
   (datascript/Entity cells decoded by the render-resource caller).

   [Seq] is a lazy-seq of runtime values: cljs seqs preserve the identity of
   their elements, but [value] collections cannot hold [Ent]/[Fn]. Seq ops
   that just select or reorder elements (map/filter/take/drop/...) return
   [Seq] so entity rows keep keyword attr access and tagged re-emission on
   the way back out. Concrete constructors (vec/set/hash-map, mapv/filterv,
   values nested inside maps) still collapse to [value] — the cljs values
   they hold are not entities either. *)
type rt =
  | V of value
  | Ent of entity_id
  | Fn of (rt list -> rt)
  | Seq of rt list

type ctx = { entity_attr : entity_id -> attr -> value }

(* Core-fn table entries see ctx through this ref — set for the duration of
   each [apply_edn] call (worker is single-threaded). *)
let current_ctx : ctx option ref = ref None

let ctx () =
  match !current_ctx with
  | Some c -> c
  | None -> eval_error "edn_eval used outside apply_edn"

type env =
  { vars : (string, rt) Hashtbl.t
  ; parent : env option
  }

let env_create parent = { vars = Hashtbl.create 8; parent }
let env_bind env name v = Hashtbl.replace env.vars name v

let rec env_lookup env name =
  match Hashtbl.find_opt env.vars name with
  | Some v -> Some v
  | None -> (match env.parent with Some p -> env_lookup p name | None -> None)

(* ---- wire <-> rt marshalling ---- *)

let rt_of_wire (w : Wire.t) : rt =
  match w with
  | Wire.Tagged ("datascript/Entity", Wire.Int eid) -> Ent eid
  | Wire.Tagged ("datascript/Entity", Wire.Int64 n) -> Ent (Int64.to_int n)
  | _ -> V (Ds_wire.value_of_transit w)

let rec wire_of_rt (r : rt) : Wire.t =
  match r with
  | V v -> Ds_wire.transit_of_value v
  | Ent eid -> Wire.Tagged ("datascript/Entity", Wire.Int eid)
  | Fn _ -> eval_error "function escapes result-transform"
  | Seq xs -> Wire.Array (List.map wire_of_rt xs)

let rec value_of_rt = function
  | V v -> v
  | Ent eid -> Ref eid
  | Fn _ -> eval_error "function used as a value"
  | Seq xs -> List (List.map value_of_rt xs)

(* ---- value semantics (cljs core) ---- *)

let truthy = function
  | V Nil | V (Bool false) -> false
  | _ -> true

let rt_equal a b =
  match a, b with
  | Ent x, Ent y -> x = y
  | Fn f, Fn g -> f == g
  | Ent e, V (Keyword k) | V (Keyword k), Ent e -> (
      match (ctx ()).entity_attr e "db/ident" with
      | Keyword ik -> String.equal ik k
      | _ -> false)
  | Fn _, _ | _, Fn _ -> false
  | _ -> Util.value_equal (value_of_rt a) (value_of_rt b)

(* cljs compare — numbers compare numerically across int/float/instant. *)
let rt_compare a b =
  let as_float = function
    | Int n -> Some (float_of_int n)
    | Float f -> Some f
    | Instant n -> Some (Int64.to_float n)
    | _ -> None
  in
  match a, b with
  | V x, V y -> (
      match as_float x, as_float y with
      | Some fx, Some fy -> compare fx fy
      | _ -> Util.compare_value x y)
  | Ent x, Ent y -> compare x y
  | Fn _, _ | _, Fn _ -> eval_error "compare on incomparable runtime values"
  | _ -> Util.compare_value (value_of_rt a) (value_of_rt b)

let num_of = function
  | V (Int n) -> float_of_int n
  | V (Float f) -> f
  | V (Instant n) -> Int64.to_float n
  | _ -> eval_error "expected number"

(* seqable: colls -> element list; maps -> [k v] vectors; nil -> [] *)
let elems_of_rt = function
  | Seq xs -> xs
  | V (List xs) | V (Vector xs) | V (Set xs) -> List.map (fun v -> V v) xs
  | V (Map kvs) -> List.map (fun (k, v) -> V (Vector [ k; v ])) kvs
  | V (Tuple vs) ->
      List.filter_map (function Some v -> Some (V v) | None -> None) vs
  | V Nil -> []
  | V (String s) ->
      List.init (String.length s) (fun i -> V (String (String.make 1 s.[i])))
  | _ -> eval_error "value is not seqable"

let seq_coll xs =
  match xs with [] -> V Nil | _ -> Seq xs

let take_elems n xs =
  let rec go acc i = function
    | _ when i = 0 -> List.rev acc
    | x :: rest -> go (x :: acc) (i - 1) rest
    | [] -> List.rev acc
  in
  go [] n xs

let drop_elems n xs =
  let rec go i = function
    | xs when i <= 0 -> xs
    | _ :: rest -> go (i - 1) rest
    | [] -> []
  in
  go n xs

(* cljs get — map/vector/set/entity/nil *)
let rt_get m k ~default =
  match m, k with
  | V (Map kvs), V kv -> (
      match
        List.find_map
          (fun (mk, mv) -> if Util.value_equal mk kv then Some mv else None)
          kvs
      with
      | Some v -> V v
      | None -> default)
  | Ent e, V (Keyword a) -> V ((ctx ()).entity_attr e a)
  | Ent e, V (String a) -> V ((ctx ()).entity_attr e a)
  | V (Vector xs), V (Int i) when i >= 0 && i < List.length xs ->
      V (List.nth xs i)
  | V (Set xs), V kv ->
      if List.exists (fun x -> Util.value_equal x kv) xs then V kv else default
  | V Nil, _ -> default
  | _ -> default

let rt_assoc m k v =
  match m, k with
  | V (Map kvs), V kv ->
      let rec go acc = function
        | [] -> List.rev ((kv, value_of_rt v) :: acc)
        | (mk, _) :: rest when Util.value_equal mk kv ->
            List.rev_append acc ((kv, value_of_rt v) :: rest)
        | kv' :: rest -> go (kv' :: acc) rest
      in
      V (Map (go [] kvs))
  | V (Vector xs), V (Int i) when i >= 0 && i < List.length xs ->
      V (Vector (List.mapi (fun j x -> if j = i then value_of_rt v else x) xs))
  | Ent e, _ -> eval_error "assoc on entity %d is not supported" e
  | _ -> eval_error "assoc on non-associative value"

let rt_dissoc m ks =
  match m with
  | V (Map kvs) ->
      let kvs' =
        List.fold_left
          (fun acc rk ->
            let k = value_of_rt rk in
            List.filter (fun (mk, _) -> not (Util.value_equal mk k)) acc)
          kvs ks
      in
      V (Map kvs')
  | _ -> eval_error "dissoc on non-map"

let rec get_in_value m path ~default =
  match path with
  | [] -> m
  | k :: rest -> (
      let missing = V (Symbol "logseq.edn-eval/missing") in
      let step = rt_get m k ~default:missing in
      match step with
      | V (Symbol "logseq.edn-eval/missing") -> default
      | _ -> get_in_value step rest ~default)

(* ---- evaluator ---- *)

let core_table : (string, rt list -> rt) Hashtbl.t option ref = ref None

let rec eval_form env (form : value) : rt =
  match form with
  | Symbol s -> (
      match env_lookup env s with
      | Some v -> v
      | None -> (
          let tbl =
            match !core_table with
            | Some t -> t
            | None ->
                let t = build_core_fns () in
                core_table := Some t;
                t
          in
          match Hashtbl.find_opt tbl s with
          | Some f -> Fn f
          | None -> eval_error "unbound symbol %s" s))
  | List xs -> eval_list env xs
  | Vector xs ->
      V (Vector (List.map (fun f -> value_of_rt (eval_form env f)) xs))
  | Map kvs ->
      V
        (Map
           (List.map
              (fun (k, v) ->
                (value_of_rt (eval_form env k), value_of_rt (eval_form env v)))
              kvs))
  | Set xs ->
      V (Set (List.map (fun f -> value_of_rt (eval_form env f)) xs))
  | other -> V other

and eval_list env xs =
  match xs with
  | [] -> V (List [])
  | head :: args -> (
      match head with
      | Symbol "quote" -> (
          match args with
          | [ x ] -> V x
          | _ -> eval_error "quote takes one form")
      | Symbol ("fn" | "fn*") -> make_fn env args
      | Symbol "let" | Symbol "let*" | Symbol "loop" -> eval_let env args
      | Symbol "if" -> (
          match args with
          | c :: t :: e ->
              let branch =
                if truthy (eval_form env c) then t
                else match e with [ e ] -> e | _ -> Nil
              in
              eval_form env branch
          | _ -> eval_error "if wants test/then[/else]")
      | Symbol "when" -> (
          match args with
          | c :: body ->
              if truthy (eval_form env c) then eval_do env body else V Nil
          | _ -> eval_error "when wants test/body")
      | Symbol "when-not" -> (
          match args with
          | c :: body ->
              if truthy (eval_form env c) then V Nil else eval_do env body
          | _ -> eval_error "when-not wants test/body")
      | Symbol "do" -> eval_do env args
      | Symbol "and" -> eval_and env args
      | Symbol "or" -> eval_or env args
      | Symbol "->" -> eval_form env (thread true args)
      | Symbol "->>" -> eval_form env (thread false args)
      | Symbol "cond->" -> eval_cond_thread env args ~first:true
      | Symbol "cond->>" -> eval_cond_thread env args ~first:false
      | Symbol "some->" -> eval_some_thread env args ~first:true
      | Symbol "some->>" -> eval_some_thread env args ~first:false
      | Symbol "cond" -> eval_cond env args
      | Symbol "case" -> eval_case env args
      | Symbol ("if-let" | "when-let" | "if-some" | "when-some") ->
          eval_bind_cond env head args
      | Symbol "try" -> eval_try env args
      | Symbol "throw" -> (
          match List.map (eval_form env) args with
          | [ v ] -> raise (Throw_value (value_of_rt v))
          | _ -> eval_error "throw takes one argument")
      | Symbol "comment" -> V Nil
      | _ ->
          let f = eval_form env head in
          apply_rt f (List.map (eval_form env) args))

and splice_into acc f first =
  match f, first with
  | List (h :: tl), true -> List (h :: acc :: tl)
  | List (h :: tl), false -> List (h :: (tl @ [ acc ]))
  | other, _ -> List [ other; acc ]

and thread first = function
  | x :: forms -> List.fold_left (fun acc f -> splice_into acc f first) x forms
  | [] -> Nil

and eval_cond_thread env args ~first =
  match args with
  | x :: pairs ->
      let rec go acc = function
        | c :: f :: rest ->
            if truthy (eval_form env c) then
              go (value_of_rt (eval_form env (splice_into acc f first))) rest
            else go acc rest
        | [] -> acc
        | _ -> eval_error "cond-> wants even clauses"
      in
      V (go x pairs)
  | _ -> eval_error "cond-> wants expr + clauses"

and eval_some_thread env args ~first =
  match args with
  | x :: forms ->
      let rec go acc = function
        | f :: rest -> (
            match acc with
            | Nil -> Nil
            | _ -> go (value_of_rt (eval_form env (splice_into acc f first))) rest)
        | [] -> acc
      in
      V (go x forms)
  | _ -> eval_error "some-> wants expr + forms"

and eval_cond env args =
  match args with
  | Symbol ":else" :: e :: _ -> eval_form env e
  | Keyword ":else" :: e :: _ -> eval_form env e
  | c :: e :: rest ->
      if truthy (eval_form env c) then eval_form env e
      else eval_cond env rest
  | [ c ] -> eval_form env c
  | [] -> V Nil

and eval_case env args =
  match args with
  | x :: clauses ->
      let xv = eval_form env x in
      let rec go = function
        | c :: e :: rest -> if rt_equal xv (V c) then Some e else go rest
        | [ default ] -> Some default
        | [] -> None
      in
      (match go clauses with
       | Some e -> eval_form env e
       | None -> eval_error "no matching clause")
  | _ -> eval_error "case wants expr + clauses"

and eval_bind_cond env head args =
  let name = match head with Symbol s -> s | _ -> "" in
  let is_some = String.ends_with ~suffix:"-some" name in
  let is_when = String.starts_with ~prefix:"when" name in
  match args with
  | Vector [ Symbol b; bound ] :: branches ->
      let v = eval_form env bound in
      let ok =
        if is_some then not (Util.value_equal (value_of_rt v) Nil)
        else truthy v
      in
      if ok then (
        let env' = env_create (Some env) in
        env_bind env' b v;
        if is_when then eval_do env' branches
        else eval_form env' (List.hd branches))
      else if is_when then V Nil
      else (match branches with [ _; e ] -> eval_form env e | _ -> V Nil)
  | _ -> eval_error "binding form malformed"

and eval_try env args =
  let rec split acc = function
    | (List (Symbol "catch" :: _) as c) :: rest -> (List.rev acc, Some c, rest)
    | (List (Symbol "finally" :: _) as f) :: rest -> (List.rev acc, None, f :: rest)
    | x :: rest -> split (x :: acc) rest
    | [] -> (List.rev acc, None, [])
  in
  let body, catch_form, finally_forms = split [] args in
  let run_finally () =
    List.iter
      (fun f ->
        match f with
        | List (Symbol "finally" :: fs) -> ignore (eval_do env fs)
        | _ -> ())
      finally_forms
  in
  try
    let r = eval_do env body in
    run_finally ();
    r
  with e -> (
    match catch_form with
    | Some (List (Symbol "catch" :: _err :: binding :: handlers)) ->
        let env' = env_create (Some env) in
        let payload =
          match e with
          | Throw_value v -> V v
          | Eval_error m -> V (String m)
          | exn -> V (String (Printexc.to_string exn))
        in
        (match binding with Symbol b -> env_bind env' b payload | _ -> ());
        run_finally ();
        eval_do env' handlers
    | _ ->
        run_finally ();
        raise e)

and eval_do env body =
  match body with
  | [] -> V Nil
  | [ last ] -> eval_form env last
  | f :: rest ->
      ignore (eval_form env f);
      eval_do env rest

and eval_and env = function
  | [] -> V (Bool true)
  | [ last ] -> eval_form env last
  | f :: rest -> (
      match eval_form env f with
      | v when truthy v -> eval_and env rest
      | v -> v)

and eval_or env = function
  | [] -> V Nil
  | f :: rest -> (
      match eval_form env f with v when truthy v -> v | _ -> eval_or env rest)

and bind_pattern env pat value =
  match pat, value with
  | Symbol s, v -> env_bind env s v
  | Vector pats, v ->
      let elems = elems_of_rt v in
      let rec go i = function
        | [] -> ()
        | Symbol "&" :: Symbol r :: _ ->
            env_bind env r (Seq (drop_elems i elems))
        | ((Symbol _ | Vector _) as sub) :: rest ->
            let elem = match List.nth_opt elems i with Some x -> x | None -> V Nil in
            bind_pattern env sub elem;
            go (i + 1) rest
        | _ :: rest -> go (i + 1) rest
      in
      go 0 pats
  | Map pats, v ->
      List.iter
        (fun (k, p) ->
          match k, p with
          | Symbol s, Keyword kw ->
              env_bind env s (rt_get v (V (Keyword kw)) ~default:(V Nil))
          | Keyword "keys", Vector syms ->
              List.iter
                (fun sym ->
                  match sym with
                  | Symbol s ->
                      env_bind env s (rt_get v (V (Keyword s)) ~default:(V Nil))
                  | _ -> ())
                syms
          | Keyword "strs", Vector syms ->
              List.iter
                (fun sym ->
                  match sym with
                  | Symbol s ->
                      env_bind env s (rt_get v (V (String s)) ~default:(V Nil))
                  | _ -> ())
                syms
          | Keyword "syms", Vector syms ->
              List.iter
                (fun sym ->
                  match sym with
                  | Symbol s ->
                      env_bind env s (rt_get v (V (Symbol s)) ~default:(V Nil))
                  | _ -> ())
                syms
          | Symbol s, Map _ ->
              (* {s {:keys [...]}} — nested destructure of (:s m) *)
              bind_pattern env p (rt_get v (V (Keyword s)) ~default:(V Nil))
          | _ -> eval_error "unsupported map binding pattern")
        pats
  | _ -> eval_error "unsupported binding pattern"

and eval_let env = function
  | Vector bindings :: body ->
      let env' = env_create (Some env) in
      let rec go = function
        | pat :: expr :: rest ->
            bind_pattern env' pat (eval_form env' expr);
            go rest
        | [] -> eval_do env' body
        | _ -> eval_error "let wants even bindings"
      in
      go bindings
  | _ -> eval_error "let wants a bindings vector"

and is_pct_sym s =
  String.length s > 0
  && s.[0] = '%'
  && (String.equal s "%" || String.equal s "%&"
      || (String.length s > 1
          && String.for_all
               (fun c -> c >= '0' && c <= '9')
               (String.sub s 1 (String.length s - 1))))

(* fn / fn* — #(..) lands as (fn* [] body) with % placeholders in body *)
and make_fn env args =
  let params, body =
    match args with
    | Symbol _named :: Vector ps :: body -> (ps, body)
    | Vector ps :: body -> (ps, body)
    | _ -> eval_error "fn wants [params] body"
  in
  let anon_syms =
    let rec collect acc = function
      | Symbol s :: rest when is_pct_sym s -> collect (s :: acc) rest
      | List xs :: rest -> collect (collect acc xs) rest
      | Vector xs :: rest -> collect (collect acc xs) rest
      | Set xs :: rest -> collect (collect acc xs) rest
      | Map kvs :: rest ->
          collect (collect acc (List.concat_map (fun (a, b) -> [ a; b ]) kvs)) rest
      | _ :: rest -> collect acc rest
      | [] -> acc
    in
    collect [] body |> List.sort_uniq String.compare
  in
  let variadic =
    List.mem "%&" anon_syms
    || List.exists (function Symbol "&" -> true | _ -> false) params
  in
  let param_names =
    List.filter_map
      (function
        | Symbol s -> Some s
        | _ -> eval_error "unsupported fn parameter")
      params
  in
  let positional =
    if param_names = [] then (
      let max_n =
        List.fold_left
          (fun mx s ->
            match s with
            | "%" -> max mx 1
            | "%&" -> mx
            | _ -> (
                match int_of_string_opt (String.sub s 1 (String.length s - 1)) with
                | Some n -> max mx n
                | None -> mx))
          0 anon_syms
      in
      List.init max_n (fun i -> "%" ^ string_of_int (i + 1)))
    else List.filter (fun s -> not (String.equal s "&")) param_names
  in
  Fn
    (fun call_args ->
      let env' = env_create (Some env) in
      if param_names = [] then (
        List.iteri
          (fun i a -> env_bind env' ("%" ^ string_of_int (i + 1)) a)
          call_args;
        (match call_args with first :: _ -> env_bind env' "%" first | [] -> ());
        if variadic then
          env_bind env' "%&"
            (Seq (drop_elems (List.length positional) call_args)))
      else (
        let rec bind ps args =
          match ps, args with
          | "&" :: r :: _, rest -> env_bind env' r (Seq rest)
          | p :: prest, a :: arest ->
              env_bind env' p a;
              bind prest arest
          | p :: prest, [] ->
              env_bind env' p (V Nil);
              bind prest []
          | [], _ -> ()
        in
        bind param_names call_args);
      eval_do env' body)

and apply_rt f args =
  match f with
  | Fn g -> g args
  | V (Keyword k) -> (
      match args with
      | m :: rest ->
          let default = match rest with d :: _ -> d | [] -> V Nil in
          rt_get m (V (Keyword k)) ~default
      | [] -> eval_error "keyword fn wants a map")
  | Ent e -> (
      match args with
      | V (Keyword k) :: _ -> V ((ctx ()).entity_attr e k)
      | V (String k) :: _ -> V ((ctx ()).entity_attr e k)
      | _ -> V Nil)
  | V (Map kvs) -> (
      match args with
      | k :: _ -> rt_get (V (Map kvs)) k ~default:(V Nil)
      | [] -> V Nil)
  | V (Vector xs) -> (
      match args with
      | V (Int i) :: _ when i >= 0 && i < List.length xs -> V (List.nth xs i)
      | _ -> V Nil)
  | V (Set xs) -> (
      match args with
      | k :: _ -> (
          let kv = value_of_rt k in
          if List.exists (fun x -> Util.value_equal x kv) xs then V kv else V Nil)
      | [] -> V Nil)
  | V Nil -> V Nil
  | V (Symbol s) -> eval_error "%s is not callable" s
  | _ -> eval_error "value is not callable"

(* ---- helpers used by the core-fn table ---- *)

and one = function [ x ] -> x | _ -> eval_error "arity error"

and str_of_rt = function
  | V (String s) -> s
  | V Nil -> ""
  | V (Uuid s) -> s
  | V (Instant ms) -> Ds_wire.iso_of_ms ms
  | V v -> Edn_util.pr_str v
  | Ent eid -> "#datascript/Entity " ^ string_of_int eid
  | Fn _ -> "#fn"
  | Seq xs -> Edn_util.pr_str (List (List.map value_of_rt xs))

and str_one args =
  match one args with V (String s) -> s | v -> str_of_rt v

and strip_colon s =
  if String.length s > 0 && s.[0] = ':' then
    String.sub s 1 (String.length s - 1)
  else s

and last_seg s =
  match String.rindex_opt s '/' with
  | Some i -> String.sub s (i + 1) (String.length s - i - 1)
  | None -> s

and contains_sub s p =
  let ls = String.length s and lp = String.length p in
  let rec go i = i + lp <= ls && (String.sub s i lp = p || go (i + 1)) in
  lp = 0 || go 0

and replace_sub s from to_ =
  if from = "" then s
  else (
    let ls = String.length s and lf = String.length from in
    let buf = Buffer.create ls in
    let rec go i =
      if i + lf <= ls && String.sub s i lf = from then (
        Buffer.add_string buf to_;
        go (i + lf))
      else if i < ls then (
        Buffer.add_char buf s.[i];
        go (i + 1))
    in
    go 0;
    Buffer.contents buf)

(* ---- core fn table ---- *)

and build_core_fns () =
  let tbl = Hashtbl.create 256 in
  let reg name f = Hashtbl.replace tbl name f in

  (* comparisons / logic *)
  reg "=" (fun args ->
      match args with
      | [] -> V (Bool true)
      | first :: rest -> V (Bool (List.for_all (rt_equal first) rest)));
  reg "not=" (fun args ->
      match args with
      | [] -> V (Bool true)
      | first :: rest -> V (Bool (not (List.for_all (rt_equal first) rest))));
  List.iter
    (fun (name, pred) ->
      reg name (fun args ->
          let rec go = function
            | a :: b :: rest ->
                if pred (rt_compare a b) then go (b :: rest) else V (Bool false)
            | _ -> V (Bool true)
          in
          go args))
    [ "<", (fun c -> c < 0)
    ; ">", (fun c -> c > 0)
    ; "<=", (fun c -> c <= 0)
    ; ">=", (fun c -> c >= 0)
    ];
  reg "compare" (fun args ->
      match args with
      | [ a; b ] -> V (Int (rt_compare a b))
      | _ -> eval_error "compare wants 2 args");
  reg "not" (fun args -> V (Bool (not (truthy (one args)))));
  reg "boolean" (fun args -> V (Bool (truthy (one args))));
  reg "nil?" (fun args ->
      match args with [ V Nil ] -> V (Bool true) | _ -> V (Bool false));
  reg "some?" (fun args ->
      match args with [ V Nil ] -> V (Bool false) | [ _ ] -> V (Bool true) | _ -> eval_error "some?");
  reg "true?" (fun args ->
      match args with [ V (Bool true) ] -> V (Bool true) | _ -> V (Bool false));
  reg "false?" (fun args ->
      match args with [ V (Bool false) ] -> V (Bool true) | _ -> V (Bool false));
  reg "fn?" (fun args ->
      match args with [ Fn _ ] -> V (Bool true) | _ -> V (Bool false));
  reg "ifn?" (fun args ->
      match args with
      | [ (Fn _ | V (Keyword _ | Map _ | Vector _ | Set _)) ] -> V (Bool true)
      | _ -> V (Bool false));
  reg "number?" (fun args ->
      match args with
      | [ V (Int _ | Float _ | Instant _) ] -> V (Bool true)
      | _ -> V (Bool false));
  reg "integer?" (fun args ->
      match args with [ V (Int _ | Instant _) ] -> V (Bool true) | _ -> V (Bool false));
  reg "float?" (fun args ->
      match args with [ V (Float _) ] -> V (Bool true) | _ -> V (Bool false));
  reg "string?" (fun args ->
      match args with [ V (String _) ] -> V (Bool true) | _ -> V (Bool false));
  reg "keyword?" (fun args ->
      match args with [ V (Keyword _) ] -> V (Bool true) | _ -> V (Bool false));
  reg "symbol?" (fun args ->
      match args with [ V (Symbol _) ] -> V (Bool true) | _ -> V (Bool false));
  reg "uuid?" (fun args ->
      match args with [ V (Uuid _) ] -> V (Bool true) | _ -> V (Bool false));
  reg "map?" (fun args ->
      match args with [ V (Map _) ] -> V (Bool true) | _ -> V (Bool false));
  reg "vector?" (fun args ->
      match args with [ V (Vector _) ] -> V (Bool true) | _ -> V (Bool false));
  reg "set?" (fun args ->
      match args with [ V (Set _) ] -> V (Bool true) | _ -> V (Bool false));
  reg "sequential?" (fun args ->
      match args with [ V (Vector _ | List _) ] -> V (Bool true) | _ -> V (Bool false));
  reg "coll?" (fun args ->
      match args with
      | [ V (Map _ | Vector _ | List _ | Set _) ] -> V (Bool true)
      | _ -> V (Bool false));
  reg "seq?" (fun args ->
      match args with [ V (List _) ] -> V (Bool true) | _ -> V (Bool false));
  reg "zero?" (fun args -> V (Bool (num_of (one args) = 0.0)));
  reg "pos?" (fun args -> V (Bool (num_of (one args) > 0.0)));
  reg "neg?" (fun args -> V (Bool (num_of (one args) < 0.0)));
  reg "even?" (fun args -> V (Bool (Float.rem (num_of (one args)) 2.0 = 0.0)));
  reg "odd?" (fun args -> V (Bool (Float.rem (num_of (one args)) 2.0 <> 0.0)));
  reg "empty?" (fun args -> V (Bool (elems_of_rt (one args) = [])));

  (* arithmetic *)
  let num_val args f =
    let xs = List.map num_of args in
    let r = f xs in
    if
      List.for_all (function V (Int _) | V (Instant _) -> true | _ -> false) args
      && Float.equal r (Float.of_int (int_of_float r))
    then V (Int (int_of_float r))
    else V (Float r)
  in
  reg "+" (fun args -> num_val args (List.fold_left ( +. ) 0.0));
  reg "-" (fun args ->
      match args with
      | [ V (Int n) ] -> V (Int (-n))
      | [ x ] -> V (Float (Float.neg (num_of x)))
      | x :: rest -> V (Float (List.fold_left (fun a b -> a -. b) (num_of x) (List.map num_of rest)))
      | [] -> eval_error "- wants args");
  reg "*" (fun args -> num_val args (List.fold_left ( *. ) 1.0));
  reg "/" (fun args ->
      let xs = List.map num_of args in
      match xs with
      | [ x ] -> V (Float (1.0 /. x))
      | x :: rest -> V (Float (List.fold_left (fun a b -> a /. b) x rest))
      | [] -> eval_error "/ wants args");
  reg "inc" (fun args ->
      match args with
      | [ V (Int n) ] -> V (Int (n + 1))
      | [ V (Instant n) ] -> V (Instant (Int64.add n 1L))
      | [ x ] -> V (Float (num_of x +. 1.0))
      | _ -> eval_error "inc");
  reg "dec" (fun args ->
      match args with
      | [ V (Int n) ] -> V (Int (n - 1))
      | [ V (Instant n) ] -> V (Instant (Int64.sub n 1L))
      | [ x ] -> V (Float (num_of x -. 1.0))
      | _ -> eval_error "dec");
  reg "min" (fun args ->
      match List.map num_of args with
      | [] -> eval_error "min wants args"
      | x :: rest -> V (Float (List.fold_left Float.min x rest)));
  reg "max" (fun args ->
      match List.map num_of args with
      | [] -> eval_error "max wants args"
      | x :: rest -> V (Float (List.fold_left Float.max x rest)));
  reg "mod" (fun args ->
      match args with
      | [ V (Int a); V (Int b) ] -> V (Int (a mod b))
      | [ a; b ] -> V (Float (Float.rem (num_of a) (num_of b)))
      | _ -> eval_error "mod");
  reg "rem" (fun args ->
      match args with
      | [ a; b ] -> V (Float (Float.rem (num_of a) (num_of b)))
      | _ -> eval_error "rem");
  reg "quot" (fun args ->
      match args with
      | [ a; b ] -> V (Int (int_of_float (num_of a) / int_of_float (num_of b)))
      | _ -> eval_error "quot");
  reg "abs" (fun args -> V (Float (Float.abs (num_of (one args)))));

  (* seq access *)
  reg "first" (fun args ->
      match elems_of_rt (one args) with x :: _ -> x | [] -> V Nil);
  reg "second" (fun args ->
      match elems_of_rt (one args) with _ :: x :: _ -> x | _ -> V Nil);
  reg "last" (fun args ->
      match List.rev (elems_of_rt (one args)) with x :: _ -> x | [] -> V Nil);
  reg "rest" (fun args ->
      match elems_of_rt (one args) with
      | _ :: t -> Seq t
      | [] -> Seq []);
  reg "next" (fun args ->
      match elems_of_rt (one args) with
      | _ :: (_ :: _ as t) -> Seq t
      | _ -> V Nil);
  reg "nth" (fun args ->
      match args with
      | coll :: V (Int i) :: default -> (
          match List.nth_opt (elems_of_rt coll) i with
          | Some x -> x
          | None -> (
              match default with
              | d :: _ -> d
              | [] -> eval_error "nth out of bounds"))
      | _ -> eval_error "nth wants (coll i [default])");
  reg "seq" (fun args -> seq_coll (elems_of_rt (one args)));
  reg "count" (fun args ->
      match args with
      | [ V (String s) ] -> V (Int (String.length s))
      | [ x ] -> V (Int (List.length (elems_of_rt x)))
      | _ -> eval_error "count");
  reg "empty" (fun args ->
      match args with
      | [ V (Vector _) ] -> V (Vector [])
      | [ V (Set _) ] -> V (Set [])
      | [ V (Map _) ] -> V (Map [])
      | _ -> V (List []));
  reg "cons" (fun args ->
      match args with
      | [ x; coll ] -> Seq (x :: elems_of_rt coll)
      | _ -> eval_error "cons");
  reg "conj" (fun args ->
      match args with
      | coll :: xs -> (
          match coll with
          | V (Vector es) -> V (Vector (es @ List.map value_of_rt xs))
          | V (List es) -> Seq (List.rev xs @ List.map (fun v -> V v) es)
          | Seq es -> Seq (List.rev xs @ es)
          | V (Set es) ->
              V
                (Set
                   (List.fold_left
                      (fun a x ->
                        let xv = value_of_rt x in
                        if List.exists (fun y -> Util.value_equal y xv) a then a
                        else xv :: a)
                      es xs))
          | V (Map kvs) ->
              List.fold_left
                (fun acc x ->
                  match x with
                  | V (Vector [ k; v ]) | V (List [ k; v ]) ->
                      rt_assoc acc (V k) (V v)
                  | _ -> eval_error "conj into map wants [k v]")
                (V (Map kvs)) xs
          | V Nil -> Seq (List.rev xs)
          | _ -> eval_error "conj")
      | [] -> eval_error "conj");
  reg "concat" (fun args -> Seq (List.concat_map elems_of_rt args));
  reg "reverse" (fun args -> Seq (List.rev (elems_of_rt (one args))));
  reg "distinct" (fun args ->
      let seen = ref [] in
      Seq
        (List.filter_map
           (fun x ->
             let v = value_of_rt x in
             if List.exists (fun y -> Util.value_equal y v) !seen then None
             else (
               seen := v :: !seen;
               Some x))
           (elems_of_rt (one args))));
  reg "dedupe" (fun args ->
      let rec go acc prev = function
        | x :: rest -> (
            let v = value_of_rt x in
            match prev with
            | Some p when Util.value_equal p v -> go acc prev rest
            | _ -> go (x :: acc) (Some v) rest)
        | [] -> List.rev acc
      in
      Seq (go [] None (elems_of_rt (one args))));
  reg "flatten" (fun args ->
      let rec flat acc xs =
        List.fold_left
          (fun a x ->
            match x with
            | V (List _ | Vector _ | Set _) | Seq _ -> flat a (elems_of_rt x)
            | _ -> x :: a)
          acc xs
      in
      Seq (List.rev (flat [] (elems_of_rt (one args)))));
  reg "sort" (fun args ->
      Seq (List.stable_sort rt_compare (elems_of_rt (one args))));
  reg "range" (fun args ->
      let lo, hi, step =
        match args with
        | [] -> eval_error "unbounded range is not supported"
        | [ a ] -> (0.0, num_of a, 1.0)
        | [ a; b ] -> (num_of a, num_of b, 1.0)
        | [ a; b; s ] -> (num_of a, num_of b, num_of s)
        | _ -> eval_error "range wants 1-3 args"
      in
      let rec go acc x =
        if (step > 0.0 && x < hi) || (step < 0.0 && x > hi) then
          go (x :: acc) (x +. step)
        else List.rev acc
      in
      V
        (List
           (List.map
              (fun f ->
                if Float.equal f (Float.of_int (int_of_float f)) then
                  Int (int_of_float f)
                else Float f)
              (go [] lo))));
  reg "repeat" (fun args ->
      match args with
      | [ V (Int n); x ] -> Seq (List.init n (fun _ -> x))
      | _ -> eval_error "repeat");
  reg "repeatedly" (fun args ->
      match args with
      | [ V (Int n); f ] -> Seq (List.init n (fun _ -> apply_rt f []))
      | _ -> eval_error "repeatedly wants (repeatedly n f)");
  reg "take" (fun args ->
      match args with
      | [ V (Int n); coll ] -> Seq (take_elems n (elems_of_rt coll))
      | _ -> eval_error "take");
  reg "drop" (fun args ->
      match args with
      | [ V (Int n); coll ] -> Seq (drop_elems n (elems_of_rt coll))
      | _ -> eval_error "drop");
  reg "take-last" (fun args ->
      match args with
      | [ V (Int n); coll ] ->
          let xs = elems_of_rt coll in
          Seq (drop_elems (max 0 (List.length xs - n)) xs)
      | _ -> eval_error "take-last");
  reg "drop-last" (fun args ->
      match args with
      | coll :: rest ->
          let n = match rest with [ V (Int n) ] -> n | _ -> 1 in
          let xs = elems_of_rt coll in
          Seq (take_elems (max 0 (List.length xs - n)) xs)
      | _ -> eval_error "drop-last");
  reg "butlast" (fun args ->
      let xs = elems_of_rt (one args) in
      Seq (take_elems (max 0 (List.length xs - 1)) xs));
  reg "take-while" (fun args ->
      match args with
      | [ p; coll ] ->
          let rec go acc = function
            | x :: rest when truthy (apply_rt p [ x ]) -> go (x :: acc) rest
            | _ -> List.rev acc
          in
          Seq (go [] (elems_of_rt coll))
      | _ -> eval_error "take-while");
  reg "drop-while" (fun args ->
      match args with
      | [ p; coll ] ->
          let rec go = function
            | _ :: rest as xs ->
                (match xs with
                 | x :: _ when truthy (apply_rt p [ x ]) -> go rest
                 | _ -> xs)
            | [] -> []
          in
          Seq (go (elems_of_rt coll))
      | _ -> eval_error "drop-while");
  reg "take-nth" (fun args ->
      match args with
      | [ V (Int n); coll ] ->
          let kept =
            elems_of_rt coll
            |> List.mapi (fun i x -> i, x)
            |> List.filter (fun (i, _) -> i mod n = 0)
            |> List.map snd
          in
          Seq kept
      | _ -> eval_error "take-nth");
  reg "interleave" (fun args ->
      let cols = List.map elems_of_rt args in
      let rec go acc cols =
        if List.exists (fun c -> c = []) cols then List.rev acc
        else
          go
            (List.rev_append (List.map (fun c -> List.hd c) cols) acc)
            (List.map List.tl cols)
      in
      Seq (go [] cols));
  reg "interpose" (fun args ->
      match args with
      | [ sep; coll ] -> (
          match elems_of_rt coll with
          | [] -> Seq []
          | x :: rest ->
              Seq
                (List.rev
                   (List.fold_left (fun a x -> x :: sep :: a) [ x ] rest)))
      | _ -> eval_error "interpose");
  reg "partition" (fun args ->
      match args with
      | V (Int n) :: rest ->
          let step, coll =
            match rest with
            | [ coll ] -> (n, coll)
            | [ V (Int s); coll ] -> (s, coll)
            | _ -> eval_error "partition wants n [step] coll"
          in
          let rec go acc xs =
            if List.length xs >= n then
              go (Seq (take_elems n xs) :: acc) (drop_elems step xs)
            else List.rev acc
          in
          Seq (go [] (elems_of_rt coll))
      | _ -> eval_error "partition");
  reg "split-at" (fun args ->
      match args with
      | [ V (Int n); coll ] ->
          let xs = elems_of_rt coll in
          V
            (Vector
               [ List (List.map value_of_rt (take_elems n xs))
               ; List (List.map value_of_rt (drop_elems n xs))
               ])
      | _ -> eval_error "split-at");
  reg "split-with" (fun args ->
      match args with
      | [ p; coll ] ->
          let rec go acc = function
            | x :: rest when truthy (apply_rt p [ x ]) -> go (x :: acc) rest
            | xs -> (List.rev acc, xs)
          in
          let a, b = go [] (elems_of_rt coll) in
          V (Vector [ List (List.map value_of_rt a); List (List.map value_of_rt b) ])
      | _ -> eval_error "split-with");

  (* higher order *)
  let map_cols colls =
    let cols = List.map elems_of_rt colls in
    let rec go acc cols =
      if List.exists (fun c -> c = []) cols then List.rev acc
      else
        go
          ((List.map (fun c -> List.hd c) cols) :: acc)
          (List.map List.tl cols)
    in
    go [] cols
  in
  reg "map" (fun args ->
      match args with
      | f :: colls ->
          Seq (List.map (fun heads -> apply_rt f heads) (map_cols colls))
      | [] -> eval_error "map");
  reg "mapv" (fun args ->
      match args with
      | f :: colls ->
          V
            (Vector
               (List.map
                  (fun heads -> value_of_rt (apply_rt f heads))
                  (map_cols colls)))
      | [] -> eval_error "mapv");
  reg "map-indexed" (fun args ->
      match args with
      | [ f; coll ] ->
          Seq
            (List.mapi
               (fun i x -> apply_rt f [ V (Int i); x ])
               (elems_of_rt coll))
      | _ -> eval_error "map-indexed");
  reg "filter" (fun args ->
      match args with
      | [ p; coll ] ->
          Seq (List.filter (fun x -> truthy (apply_rt p [ x ])) (elems_of_rt coll))
      | _ -> eval_error "filter");
  reg "filterv" (fun args ->
      match args with
      | [ p; coll ] ->
          V
            (Vector
               (List.filter_map
                  (fun x ->
                    if truthy (apply_rt p [ x ]) then Some (value_of_rt x)
                    else None)
                  (elems_of_rt coll)))
      | _ -> eval_error "filterv");
  reg "remove" (fun args ->
      match args with
      | [ p; coll ] ->
          Seq (List.filter (fun x -> not (truthy (apply_rt p [ x ]))) (elems_of_rt coll))
      | _ -> eval_error "remove");
  reg "keep" (fun args ->
      match args with
      | [ f; coll ] ->
          Seq
            (List.filter_map
               (fun x ->
                 match apply_rt f [ x ] with
                 | V Nil -> None
                 | r -> Some r)
               (elems_of_rt coll))
      | _ -> eval_error "keep");
  reg "keep-indexed" (fun args ->
      match args with
      | [ f; coll ] ->
          let kept =
            elems_of_rt coll
            |> List.mapi (fun i x -> i, x)
            |> List.filter_map (fun (i, x) ->
                   match apply_rt f [ V (Int i); x ] with
                   | V Nil -> None
                   | r -> Some r)
          in
          Seq kept
      | _ -> eval_error "keep-indexed");
  reg "mapcat" (fun args ->
      match args with
      | f :: colls ->
          Seq
            (List.concat_map
               (fun heads -> elems_of_rt (apply_rt f heads))
               (map_cols colls))
      | [] -> eval_error "mapcat");
  reg "reduce" (fun args ->
      match args with
      | [ f; coll ] -> (
          match elems_of_rt coll with
          | [] -> apply_rt f []
          | x :: rest ->
              List.fold_left (fun acc x -> apply_rt f [ acc; x ]) x rest)
      | [ f; init; coll ] ->
          List.fold_left (fun acc x -> apply_rt f [ acc; x ]) init
            (elems_of_rt coll)
      | _ -> eval_error "reduce");
  reg "apply" (fun args ->
      match args with
      | f :: args' ->
          let rec prefix acc = function
            | [ last ] -> acc @ elems_of_rt last
            | x :: rest -> prefix (acc @ [ x ]) rest
            | [] -> acc
          in
          apply_rt f (prefix [] args')
      | [] -> eval_error "apply");
  reg "some" (fun args ->
      match args with
      | [ p; coll ] ->
          let rec go = function
            | x :: rest -> (
                let r = apply_rt p [ x ] in
                if truthy r then r else go rest)
            | [] -> V Nil
          in
          go (elems_of_rt coll)
      | _ -> eval_error "some");
  reg "every?" (fun args ->
      match args with
      | [ p; coll ] ->
          V (Bool (List.for_all (fun x -> truthy (apply_rt p [ x ])) (elems_of_rt coll)))
      | _ -> eval_error "every?");
  reg "not-every?" (fun args ->
      match args with
      | [ p; coll ] ->
          V
            (Bool
               (not (List.for_all (fun x -> truthy (apply_rt p [ x ])) (elems_of_rt coll))))
      | _ -> eval_error "not-every?");
  reg "not-any?" (fun args ->
      match args with
      | [ p; coll ] ->
          V
            (Bool
               (not (List.exists (fun x -> truthy (apply_rt p [ x ])) (elems_of_rt coll))))
      | _ -> eval_error "not-any?");
  reg "sort-by" (fun args ->
      match args with
      | [ f; coll ] ->
          let sorted =
            List.stable_sort
              (fun a b -> rt_compare (apply_rt f [ a ]) (apply_rt f [ b ]))
              (elems_of_rt coll)
          in
          Seq sorted
      | [ f; cmp; coll ] ->
          let sorted =
            List.stable_sort
              (fun a b ->
                match apply_rt cmp [ apply_rt f [ a ]; apply_rt f [ b ] ] with
                | V (Int n) -> n
                | V (Float x) -> int_of_float x
                | r -> if truthy r then -1 else 0)
              (elems_of_rt coll)
          in
          Seq sorted
      | _ -> eval_error "sort-by");
  reg "group-by" (fun args ->
      match args with
      | [ f; coll ] ->
          let order = ref [] in
          List.iter
            (fun x ->
              let k = value_of_rt (apply_rt f [ x ]) in
              match
                List.find_map
                  (fun (kk, vs) -> if Util.value_equal kk k then Some vs else None)
                  !order
              with
              | Some vs -> vs := value_of_rt x :: !vs
              | None -> order := (k, ref [ value_of_rt x ]) :: !order)
            (elems_of_rt coll);
          V (Map (List.rev_map (fun (k, vs) -> (k, Vector (List.rev !vs))) !order))
      | _ -> eval_error "group-by");
  reg "frequencies" (fun args ->
      let order = ref [] in
      List.iter
        (fun x ->
          let v = value_of_rt x in
          match
            List.find_map
              (fun (k, c) -> if Util.value_equal k v then Some c else None)
              !order
          with
          | Some c -> incr c
          | None -> order := (v, ref 1) :: !order)
        (elems_of_rt (one args));
      V (Map (List.rev_map (fun (k, c) -> (k, Int !c)) !order)));
  reg "zipmap" (fun args ->
      match args with
      | [ ks; vs ] ->
          V
            (Map
               (List.combine
                  (List.map value_of_rt (elems_of_rt ks))
                  (List.map value_of_rt (elems_of_rt vs))))
      | _ -> eval_error "zipmap");

  (* fn combinators *)
  reg "comp" (fun args ->
      let fs = List.rev args in
      Fn
        (fun call_args ->
          match fs with
          | [] -> (match call_args with [ x ] -> x | _ -> eval_error "comp")
          | first :: rest ->
              List.fold_left
                (fun acc f -> apply_rt f [ acc ])
                (apply_rt first call_args)
                rest));
  reg "partial" (fun args ->
      match args with
      | f :: bound -> Fn (fun rest -> apply_rt f (bound @ rest))
      | [] -> eval_error "partial");
  reg "juxt" (fun args ->
      let apply_each call_args =
        List.map (fun f -> value_of_rt (apply_rt f call_args)) args
      in
      Fn (fun call_args -> V (Vector (apply_each call_args))));
  reg "complement" (fun args ->
      match args with
      | [ f ] ->
          let complemented xs = not (truthy (apply_rt f xs)) in
          Fn (fun xs -> V (Bool (complemented xs)))
      | _ -> eval_error "complement");
  reg "fnil" (fun args ->
      match args with
      | f :: defaults ->
          let default_at i x =
            match x, List.nth_opt defaults i with
            | V Nil, Some d -> d
            | _ -> x
          in
          Fn (fun xs -> apply_rt f (List.mapi default_at xs))
      | [] -> eval_error "fnil");
  reg "identity" (fun args -> one args);
  reg "constantly" (fun args -> Fn (fun _ -> one args));

  (* map ops *)
  reg "get" (fun args ->
      match args with
      | m :: k :: rest ->
          let d = match rest with d :: _ -> d | [] -> V Nil in
          rt_get m k ~default:d
      | _ -> eval_error "get");
  reg "get-in" (fun args ->
      match args with
      | m :: path :: rest ->
          let d = match rest with d :: _ -> d | [] -> V Nil in
          get_in_value m (List.map (fun p -> V p) (List.map value_of_rt (elems_of_rt path))) ~default:d
      | _ -> eval_error "get-in");
  reg "assoc" (fun args ->
      match args with
      | m :: kvs ->
          let rec go acc = function
            | k :: v :: rest -> go (rt_assoc acc k v) rest
            | [] -> acc
            | _ -> eval_error "assoc wants even kvs"
          in
          go m kvs
      | _ -> eval_error "assoc");
  reg "assoc-in" (fun args ->
      match args with
      | [ m; path; v ] ->
          let rec assoc_at m = function
            | [ k ] -> rt_assoc m k v
            | k :: rest ->
                let inner =
                  match rt_get m k ~default:(V Nil) with
                  | V Nil -> V (Map [])
                  | x -> x
                in
                rt_assoc m k (assoc_at inner rest)
            | [] -> m
          in
          assoc_at m (List.map (fun p -> V p) (List.map value_of_rt (elems_of_rt path)))
      | _ -> eval_error "assoc-in");
  reg "dissoc" (fun args ->
      match args with m :: ks -> rt_dissoc m ks | _ -> eval_error "dissoc");
  reg "update" (fun args ->
      match args with
      | m :: k :: f :: extra ->
          rt_assoc m k (apply_rt f (rt_get m k ~default:(V Nil) :: extra))
      | _ -> eval_error "update");
  reg "update-in" (fun args ->
      match args with
      | m :: path :: f :: extra ->
          let rec upd m = function
            | [ k ] ->
                rt_assoc m k (apply_rt f (rt_get m k ~default:(V Nil) :: extra))
            | k :: rest ->
                let inner =
                  match rt_get m k ~default:(V Nil) with
                  | V Nil -> V (Map [])
                  | x -> x
                in
                rt_assoc m k (upd inner rest)
            | [] -> m
          in
          upd m (List.map (fun p -> V p) (List.map value_of_rt (elems_of_rt path)))
      | _ -> eval_error "update-in");
  reg "merge" (fun args ->
      match args with
      | [] -> V Nil
      | first :: rest ->
          List.fold_left
            (fun acc m ->
              match acc, m with
              | _, V Nil -> acc
              | V (Map _), V (Map b) ->
                  List.fold_left
                    (fun acc' (k, v) -> rt_assoc acc' (V k) (V v))
                    acc b
              | _ -> eval_error "merge wants maps")
            first rest);
  reg "merge-with" (fun args ->
      match args with
      | f :: maps ->
          let order = ref [] in
          List.iter
            (fun m ->
              match m with
              | V (Map kvs) ->
                  List.iter
                    (fun (k, v) ->
                      match
                        List.find_map
                          (fun (kk, vv) -> if Util.value_equal kk k then Some vv else None)
                          !order
                      with
                      | Some vv -> vv := value_of_rt (apply_rt f [ V !vv; V v ])
                      | None -> order := (k, ref v) :: !order)
                    kvs
              | _ -> eval_error "merge-with wants maps")
            maps;
          V (Map (List.rev_map (fun (k, vr) -> (k, !vr)) !order))
      | [] -> V Nil);
  reg "select-keys" (fun args ->
      match args with
      | [ m; keys ] ->
          let kvs = match m with V (Map kvs) -> kvs | _ -> [] in
          V
            (Map
               (List.filter_map
                  (fun kr ->
                    let k = value_of_rt kr in
                    match
                      List.find_map
                        (fun (mk, mv) -> if Util.value_equal mk k then Some mv else None)
                        kvs
                    with
                    | Some mv -> Some (k, mv)
                    | None -> None)
                  (elems_of_rt keys)))
      | _ -> eval_error "select-keys");
  reg "keys" (fun args ->
      match args with [ V (Map kvs) ] -> V (List (List.map fst kvs)) | _ -> V (List []));
  reg "vals" (fun args ->
      match args with [ V (Map kvs) ] -> V (List (List.map snd kvs)) | _ -> V (List []));
  reg "find" (fun args ->
      match args with
      | [ V (Map kvs); k ] -> (
          let kv = value_of_rt k in
          match
            List.find_map
              (fun (mk, mv) -> if Util.value_equal mk kv then Some mv else None)
              kvs
          with
          | Some mv -> V (Vector [ kv; mv ])
          | None -> V Nil)
      | _ -> V Nil);
  reg "contains?" (fun args ->
      match args with
      | [ m; k ] -> (
          match m with
          | V (Map kvs) ->
              let kv = value_of_rt k in
              V (Bool (List.exists (fun (mk, _) -> Util.value_equal mk kv) kvs))
          | V (Vector xs) -> (
              match k with
              | V (Int i) -> V (Bool (i >= 0 && i < List.length xs))
              | _ -> V (Bool false))
          | V (Set xs) ->
              let kv = value_of_rt k in
              V (Bool (List.exists (fun x -> Util.value_equal x kv) xs))
          | Ent e -> (
              match value_of_rt k with
              | Keyword a ->
                  V (Bool (match (ctx ()).entity_attr e a with Nil -> false | _ -> true))
              | _ -> V (Bool false))
          | _ -> V (Bool false))
      | _ -> eval_error "contains?");

  (* constructors / strings *)
  reg "vector" (fun args -> V (Vector (List.map value_of_rt args)));
  reg "vec" (fun args ->
      V (Vector (List.map value_of_rt (elems_of_rt (one args)))));
  reg "list" (fun args -> V (List (List.map value_of_rt args)));
  reg "hash-map" (fun args ->
      let rec go acc = function
        | k :: v :: rest -> go (acc @ [ (value_of_rt k, value_of_rt v) ]) rest
        | [] -> acc
        | _ -> eval_error "hash-map wants even args"
      in
      V (Map (go [] args)));
  reg "set" (fun args ->
      let xs = List.map value_of_rt (elems_of_rt (one args)) in
      V
        (Set
           (List.fold_left
              (fun a x -> if List.exists (fun y -> Util.value_equal y x) a then a else a @ [ x ])
              [] xs)));
  reg "into" (fun args ->
      match args with
      | [ to_; from ] -> (
          let elems = elems_of_rt from in
          match to_ with
          | V (Vector xs) -> V (Vector (xs @ List.map value_of_rt elems))
          | V (List xs) -> V (List (xs @ List.map value_of_rt elems))
          | V (Set xs) ->
              V
                (Set
                   (List.fold_left
                      (fun a x -> if List.exists (fun y -> Util.value_equal y x) a then a else a @ [ x ])
                      xs (List.map value_of_rt elems)))
          | V (Map kvs) ->
              List.fold_left
                (fun acc x ->
                  match x with
                  | V (Vector [ k; v ]) | V (List [ k; v ]) | V (Map [ (k, v) ]) ->
                      rt_assoc acc (V k) (V v)
                  | _ -> eval_error "into map wants [k v] entries")
                (V (Map kvs)) elems
          | V Nil -> V (List (List.map value_of_rt elems))
          | _ -> eval_error "into")
      | _ -> eval_error "into");
  reg "str" (fun args -> V (String (String.concat "" (List.map str_of_rt args))));
  reg "pr-str" (fun args ->
      V
        (String
           (String.concat " "
              (List.map (fun a -> Edn_util.pr_str (value_of_rt a)) args))));
  reg "name" (fun args ->
      match args with
      | [ V (Keyword k) ] | [ V (Symbol k) ] -> V (String (last_seg k))
      | [ V (String s) ] -> V (String s)
      | _ -> eval_error "name");
  reg "namespace" (fun args ->
      match args with
      | [ V (Keyword k) ] | [ V (Symbol k) ] -> (
          match String.rindex_opt k '/' with
          | Some i -> V (String (String.sub k 0 i))
          | None -> V Nil)
      | _ -> V Nil);
  reg "keyword" (fun args ->
      match args with
      | [ V (String s) ] -> V (Keyword (strip_colon s))
      | [ V (Keyword k) ] -> V (Keyword k)
      | [ V (Symbol s) ] -> V (Keyword s)
      | [ V (String ns); V (String n) ] -> V (Keyword (ns ^ "/" ^ n))
      | _ -> eval_error "keyword");
  reg "symbol" (fun args ->
      match args with
      | [ V (String s) ] -> V (Symbol s)
      | [ V (Symbol s) ] -> V (Symbol s)
      | [ V (Keyword k) ] -> V (Symbol k)
      | _ -> eval_error "symbol");
  reg "uuid" (fun args ->
      match args with [ V (String s) ] -> V (Uuid s) | _ -> eval_error "uuid");
  reg "subs" (fun args ->
      match args with
      | [ V (String s); V (Int i) ] -> V (String (String.sub s i (String.length s - i)))
      | [ V (String s); V (Int i); V (Int j) ] -> V (String (String.sub s i (j - i)))
      | _ -> eval_error "subs");
  reg "subvec" (fun args ->
      match args with
      | [ V (Vector xs); V (Int i) ] -> V (Vector (drop_elems i xs))
      | [ V (Vector xs); V (Int i); V (Int j) ] ->
          V (Vector (take_elems (j - i) (drop_elems i xs)))
      | _ -> eval_error "subvec");
  List.iter
    (fun (names, f) -> List.iter (fun n -> reg n f) names)
    [ ( [ "clojure.string/lower-case"; "string/lower-case" ]
      , fun args -> V (String (Unicode.lowercase (str_one args))) )
    ; ( [ "clojure.string/upper-case"; "string/upper-case" ]
      , fun args -> V (String (Unicode.uppercase (str_one args))) )
    ; ( [ "clojure.string/trim"; "string/trim" ]
      , fun args -> V (String (Unicode.trim (str_one args))) )
    ; ( [ "clojure.string/blank?"; "string/blank?" ]
      , fun args ->
          match args with
          | [ V Nil ] | [ V (String "") ] -> V (Bool true)
          | [ V (String s) ] -> V (Bool (Unicode.trim s = ""))
          | _ -> V (Bool false) )
    ; ( [ "clojure.string/join"; "string/join" ]
      , fun args ->
          match args with
          | [ coll ] ->
              V (String (String.concat "" (List.map str_of_rt (elems_of_rt coll))))
          | [ V (String sep); coll ] ->
              V (String (String.concat sep (List.map str_of_rt (elems_of_rt coll))))
          | _ -> eval_error "join" )
    ; ( [ "clojure.string/starts-with?"; "string/starts-with?" ]
      , fun args ->
          match args with
          | [ V (String s); V (String p) ] -> V (Bool (String.starts_with ~prefix:p s))
          | _ -> eval_error "starts-with?" )
    ; ( [ "clojure.string/ends-with?"; "string/ends-with?" ]
      , fun args ->
          match args with
          | [ V (String s); V (String p) ] -> V (Bool (String.ends_with ~suffix:p s))
          | _ -> eval_error "ends-with?" )
    ; ( [ "clojure.string/includes?"; "string/includes?" ]
      , fun args ->
          match args with
          | [ V (String s); V (String p) ] -> V (Bool (contains_sub s p))
          | _ -> eval_error "includes?" )
    ; ( [ "clojure.string/replace"; "string/replace" ]
      , fun args ->
          match args with
          | [ V (String s); V (String from); V (String to_) ] ->
              V (String (replace_sub s from to_))
          | _ -> eval_error "replace" )
    ; ( [ "clojure.string/split"; "string/split" ]
      , fun args ->
          match args with
          | [ V (String s); V (Regex r) ] | [ V (String s); V (String r) ] ->
              let parts =
                if String.length r = 1 then String.split_on_char r.[0] s
                else String.split_on_char ',' s
              in
              V (Vector (List.map (fun p -> String p) parts))
          | _ -> eval_error "split" )
    ];
  reg "ex-info" (fun args ->
      match args with
      | V (String m) :: _ -> V (Map [ (Keyword "logseq/ex-message", String m) ])
      | _ -> eval_error "ex-info");
  tbl

(* entry point: eval-string then apply to rows *)
let apply_edn ~(entity_attr : entity_id -> attr -> value) (edn : string)
    (rows : Wire.t list) : Wire.t =
  let c = { entity_attr } in
  let saved = !current_ctx in
  current_ctx := Some c;
  Fun.protect
    ~finally:(fun () -> current_ctx := saved)
    (fun () ->
      let form = Edn_util.read_string edn in
      let transform = eval_form (env_create None) form in
      (match transform with
       | Fn _ -> ()
       | _ -> eval_error "Query result transform is not a function");
      (* cljs applies the transform to ONE collection argument:
         (transform rows). Elements go in as [rt] so entity cells keep
         their datascript/Entity identity through the fn body. *)
      let out = apply_rt transform [ Seq (List.map rt_of_wire rows) ] in
      match out with
      | V (List xs) | V (Vector xs) | V (Set xs) ->
          Wire.Array (List.map (fun v -> wire_of_rt (V v)) xs)
      | other -> wire_of_rt other)

(* production wiring for the Render_deps result-transform hook *)
let () =
  Render_deps.result_transform_fn :=
    Some (fun ~entity_attr edn rows -> apply_edn ~entity_attr edn rows)
