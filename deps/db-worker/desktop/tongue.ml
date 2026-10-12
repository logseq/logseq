(* Port of tongue.core (v0.4.4) — the translation engine used by
   electron.i18n. Dictionaries are EDN data, so function-valued
   templates (:tongue/format-number, :tongue/format-inst,
   interpolable fns) never occur; arguments are raw JS values
   formatted the way cljs str would format them. *)

open Datascript

(* A compiled dictionary: flattened "ns.dotted/name" -> value. *)
type dict = (string, value) Hashtbl.t

(* ---- tags ------------------------------------------------------------ *)

let tags_cache : (string, string list) Hashtbl.t = Hashtbl.create 8

(* :az-Arab-IR -> ("az-Arab-IR" "az-Arab" "az"), memoized *)
let tags (locale : string) : string list =
  match Hashtbl.find_opt tags_cache locale with
  | Some ts -> ts
  | None ->
      let rec go last acc = function
        | [] -> List.rev acc
        | subtag :: rest ->
            let tag =
              match last with
              | Some l -> l ^ "-" ^ subtag
              | None -> subtag
            in
            go (Some tag) (tag :: acc) rest
      in
      let ts = go None [] (String.split_on_char '-' locale) in
      Hashtbl.replace tags_cache locale ts;
      ts

(* ---- lookup ---------------------------------------------------------- *)

(* (contains? dict key) then get — a key present with a nil value counts
   as found and masks lower-priority tags/fallback, like the cljs
   reduced-nil does. *)
let lookup_template_for_locale ~(dict_for : string -> dict option)
    (locale : string option) (key : string) : value option =
  match locale with
  | None -> None
  | Some locale ->
      let rec loop = function
        | [] -> None
        | tag :: rest ->
            (match dict_for tag with
             | Some d when Hashtbl.mem d key -> Hashtbl.find_opt d key
             | _ -> loop rest)
      in
      loop (tags locale)

let lookup_template ~dict_for ~fallback ~locale ~key =
  match lookup_template_for_locale ~dict_for (Some locale) key with
  | Some v -> Some v
  | None -> lookup_template_for_locale ~dict_for (Some fallback) key

(* ---- argument formatting --------------------------------------------- *)

external get_index : 'a -> string -> 'b Js.Undefined.t = ""
  [@@mel.get_index]

(* isNullable on a raw 'a — same prim as Js.Nullable.isNullable *)
external is_nullable : 'a -> bool = "#is_nullable"

external get_utc_full_year : 'a -> float = "getUTCFullYear" [@@mel.send]
external get_utc_month : 'a -> float = "getUTCMonth" [@@mel.send]
external get_utc_date : 'a -> float = "getUTCDate" [@@mel.send]
external get_utc_hours : 'a -> float = "getUTCHours" [@@mel.send]
external get_utc_minutes : 'a -> float = "getUTCMinutes" [@@mel.send]
external get_utc_seconds : 'a -> float = "getUTCSeconds" [@@mel.send]

(* inst? — duck-typed: a JS Date has a getTime method. get_index on
   null/undefined throws, so gate on typeof first. *)
let is_date (x : 'a) : bool =
  (Js.typeof x = "object" || Js.typeof x = "function")
  && not (is_nullable x)
  &&
  (match Js.Undefined.toOption (get_index x "getTime") with
   | Some f -> Js.typeof f = "function"
   | None -> false)

(* tongue/format-inst-iso: "{year}-{month-numeric-padded}-{day-padded}
   T{hour24-padded}:{minutes-padded}:{seconds-padded}", UTC fields. *)
let format_inst_iso (d : 'a) : string =
  Printf.sprintf "%04d-%02d-%02dT%02d:%02d:%02d"
    (int_of_float (get_utc_full_year d))
    (int_of_float (get_utc_month d) + 1)
    (int_of_float (get_utc_date d))
    (int_of_float (get_utc_hours d))
    (int_of_float (get_utc_minutes d))
    (int_of_float (get_utc_seconds d))

(* cljs str on a JS value: nil/undefined -> "", everything else ->
   String(x). Numbers therefore print like JS toString ("8080", "1.5"). *)
let str_of_arg (x : 'a) : string =
  if is_nullable x then ""
  else if is_date x then format_inst_iso x
  else Js.String.make x

(* cljs str on a template/dict value — used for non-string templates. *)
let rec str_of_value (v : value) : string =
  match v with
  | Nil -> ""
  | Bool b -> if b then "true" else "false"
  | String s -> s
  | Symbol s -> s
  | Keyword s -> ":" ^ s
  | Int64 n -> Int64.to_string n
  | Float f -> Common_util.js_string_of_float f
  | Uuid s -> s
  | Instant n -> Int64.to_string n
  | Regex s -> s
  | Ref n -> string_of_int n
  | TxRef -> ":db/current-tx"
  | Ref_to _ -> "#<ref>"
  | List xs -> "(" ^ String.concat " " (List.map str_of_value xs) ^ ")"
  | Vector xs -> "[" ^ String.concat " " (List.map str_of_value xs) ^ "]"
  | Set xs -> "#{" ^ String.concat " " (List.map str_of_value xs) ^ "}"
  | Map kvs ->
      "{"
      ^ String.concat ", "
          (List.map (fun (k, v) -> str_of_value k ^ " " ^ str_of_value v) kvs)
      ^ "}"
  | Tuple vs ->
      "["
      ^ String.concat " " (List.filter_map (Option.map str_of_value) vs)
      ^ "]"

let template_string (v : value) : string =
  match v with
  | String s -> s
  | other -> invalid_arg ("tongue: non-string template " ^ str_of_value other)

(* ---- interpolation ---------------------------------------------------- *)

let positional_re = Regexp.compile "\\{(\\d+)\\}"

let interpolate_positional (template : string) (args : string array)
    : string =
  Regexp.replace_all positional_re template
    ~f:(fun ~match_:_ ~groups ~offset:_ ~input:_ ->
      match groups.(1) with
      | Some n ->
          let idx = int_of_string n in
          if idx >= 1 && idx <= Array.length args then args.(idx - 1)
          else "{Missing index " ^ n ^ "}"
      | None -> "")

(* {name} or {ns/name} — named interpolations read properties off a JS
   object arg; missing keys format nil -> "". *)
let named_re =
  Regexp.compile
    "\\{([\\w*!_?$%&=<>'\\-+.#0-9]+|[\\w*!_?$%&=<>'\\-+.#0-9]+/[\\w*!_?$%&=<>'\\-+.#0-9:]+)\\}"

let interpolate_named (template : string) (interpolations : 'a) : string =
  Regexp.replace_all named_re template
    ~f:(fun ~match_:_ ~groups ~offset:_ ~input:_ ->
      match groups.(1) with
      | Some k ->
          (match Js.Undefined.toOption (get_index interpolations k) with
           | Some v -> str_of_arg v
           | None -> "")
      | None -> "")

(* ---- translate -------------------------------------------------------- *)

let translate_missing ~dict_for ~fallback ~locale ~key : string =
  match
    lookup_template ~dict_for ~fallback ~locale ~key:"tongue/missing-key"
  with
  | Some Nil -> ""
  | Some t -> interpolate_positional (template_string t) [| ":" ^ key |]
  | None -> "{Missing key :" ^ key ^ "}"

(* translate dicts locale key & args — args are raw JS values; a map arg
   triggers named interpolation, anything else positional. *)
let translate ~(dict_for : string -> dict option) ~(fallback : string)
    ~(locale : string) ~(key : string) ~(args : 'a array) : string =
  match lookup_template ~dict_for ~fallback ~locale ~key with
  | Some Nil -> translate_missing ~dict_for ~fallback ~locale ~key
  | Some v ->
      (match Array.length args with
       | 0 -> str_of_value v
       | 1 ->
           let x = args.(0) in
           if
             Js.typeof x = "object"
             && (not (is_nullable x))
             && (not (Js.Array.isArray x))
             && not (is_date x)
           then interpolate_named (template_string v) x
           else interpolate_positional (template_string v) [| str_of_arg x |]
       | _ ->
           interpolate_positional (template_string v)
             (Array.map str_of_arg args))
  | None -> translate_missing ~dict_for ~fallback ~locale ~key

(* ---- build-dict -------------------------------------------------------- *)

let append_ns ns segment =
  match ns with Some ns -> ns ^ "." ^ segment | None -> segment

(* build-dict: {:ns {:key v}} -> {"ns/key" v}, {:a {:b {:c v}}} ->
   {"a.b/c" v}. :tongue/* keys only allowed at top level (cljs assert). *)
let build_dict (raw : value) : dict =
  let d = Hashtbl.create 256 in
  let rec go ns (m : value) =
    List.iter
      (fun (k, v) ->
        match Clj_value.string_of_kwish k with
        | None -> ()
        | Some kname ->
            let kns = Clj_value.kw_namespace k in
            if kns = Some "tongue" then begin
              if ns <> None then
                invalid_arg
                  ":tongue/... keys can only be specified at top level";
              Hashtbl.replace d kname v
            end else begin
              match Clj_value.kw_name k with
              | None -> ()
              | Some kname' ->
                  (match v with
                   | Map _ -> go (Some (append_ns ns kname')) v
                   | _ ->
                       (* (keyword (or ns (namespace key)) (name key)) *)
                       let key' =
                         match ns with
                         | Some ns' -> ns' ^ "/" ^ kname'
                         | None -> kname
                       in
                       Hashtbl.replace d key' v)
            end)
      (Clj_value.map_entries m)
  in
  go None raw;
  d

(* resolve-alias-1 — follows a keyword value while it names another key
   in the same map; a cycle throws. *)
let resolve_alias_1 (m : dict) (v : value) : value =
  let rec loop v path =
    if List.mem v path then
      invalid_arg "tongue: unable to resolve mutually recursive alias";
    let next =
      match v with
      | Keyword s ->
          (match Hashtbl.find_opt m s with Some x -> x | None -> v)
      | _ -> v
    in
    if next = v then v else loop next (v :: path)
  in
  loop v []

let compile_dict (raw : value) : dict =
  let d = build_dict raw in
  (* resolve-aliases *)
  let keys = Hashtbl.fold (fun k _ acc -> k :: acc) d [] in
  List.iter
    (fun k ->
      match Hashtbl.find_opt d k with
      | Some v -> Hashtbl.replace d k (resolve_alias_1 d v)
      | None -> ())
    keys;
  d
