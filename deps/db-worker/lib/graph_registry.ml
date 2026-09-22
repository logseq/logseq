(* Port of logseq.common.graph-registry — registry normalization and
   lookup helpers. Entries are cljs maps carried as [Wire.Map] with
   keyword-name keys; the registry is a vector (list) with newest first. *)

let db_version_prefix = "logseq_db_"

let trim = String.trim
let blank s = String.trim s = ""
let present_string s = not (blank s)

(* cljs str *)
let cljs_str (v : Wire.t) : string =
  match v with
  | Wire.String s -> s
  | Wire.Keyword s -> ":" ^ s
  | Wire.Bool b -> if b then "true" else "false"
  | Wire.Int n -> string_of_int n
  | Wire.Float f -> string_of_float f
  | Wire.Nil -> ""
  | _ -> ""

(* cljs (present-string? v) — literal string, not blank *)
let present_string_opt (v : Wire.t option) : bool =
  match v with
  | Some (Wire.String s) -> present_string s
  | _ -> false

let string_field (e : Wire.t) (k : string) : string option =
  match Wire.get k e with
  | Some (Wire.String s) when present_string s -> Some s
  | _ -> None

(* normalize-entry — :graph-id falls back to :local-graph-id (both must
   be present strings), :repo and :graph-name are trimmed when strings,
   :rtc-graph-id dropped. Missing identity throws ex-info. *)
let normalize_entry (entry : Wire.t) : Wire.t =
  let graph_id =
    match string_field entry "graph-id" with
    | Some g -> Some g
    | None -> string_field entry "local-graph-id"
  in
  match graph_id with
  | None ->
      raise
        (Dispatcher.Exn_info
           ("Missing graph identity", [ (Wire.Keyword "entry", entry) ]))
  | Some g ->
      let entry = Cljs_map.assoc entry "graph-id" (Wire.String g) in
      let entry = Cljs_map.dissoc entry "rtc-graph-id" in
      let entry =
        match Wire.get "repo" entry with
        | Some (Wire.String s) ->
            Cljs_map.assoc entry "repo" (Wire.String (trim s))
        | _ -> entry
      in
      (match Wire.get "graph-name" entry with
       | Some (Wire.String s) ->
           Cljs_map.assoc entry "graph-name" (Wire.String (trim s))
       | _ -> entry)

(* upsert-entry — drop every existing entry whose :graph-id, present
   :repo, or present :local-graph-id equals the new entry's raw value;
   cons on front. *)
let upsert_entry (registry : Wire.t list) (entry : Wire.t) : Wire.t list =
  let entry' = normalize_entry entry in
  let eq_field k (e : Wire.t) =
    match Wire.get k entry', Wire.get k e with
    | Some a, Some b -> a = b
    | _ -> false
  in
  let same (e : Wire.t) =
    eq_field "graph-id" e
    || (present_string_opt (Wire.get "repo" entry') && eq_field "repo" e)
    || (present_string_opt (Wire.get "local-graph-id" entry')
        && eq_field "local-graph-id" e)
  in
  entry' :: List.filter (fun e -> not (same e)) registry

(* normalize-comparable — (some-> s str trim lower-case) *)
let normalize_comparable (v : Wire.t option) : string option =
  match v with
  | Some x ->
      (match x with
       | Wire.Nil -> None
       | _ -> Some (String.lowercase_ascii (trim (cljs_str x))))
  | None -> None

(* canonical-repo — ensure the logseq_db_ prefix exactly once; cljs
   strips the prefix repeatedly (leading ws tolerated each round) then
   re-prepends it. *)
let canonical_repo (s : string) : string option =
  if s = "" then None
  else
    let rec strip n =
      if
        String.length n >= String.length db_version_prefix
        && String.sub n 0 (String.length db_version_prefix) = db_version_prefix
      then
        strip
          (trim
             (String.sub n (String.length db_version_prefix)
                (String.length n - String.length db_version_prefix)))
      else n
    in
    Some (db_version_prefix ^ strip (trim (cljs_str (Wire.String s))))

let identifier_match (entry : Wire.t) (graph_identifier : string) : bool =
  let identifier = normalize_comparable (Some (Wire.String graph_identifier)) in
  let repo = normalize_comparable (Wire.get "repo" entry) in
  let graph_name = normalize_comparable (Wire.get "graph-name" entry) in
  let graph_id = normalize_comparable (Wire.get "graph-id" entry) in
  let canonical_repo_name =
    normalize_comparable
      (Option.map (fun s -> Wire.String s) (canonical_repo graph_identifier))
  in
  identifier = repo
  || identifier = graph_name
  || identifier = graph_id
  || canonical_repo_name = repo

(* resolve-target — exact :graph-id match first, else fuzzy
   :graph-identifier match (repo / graph-name / graph-id /
   canonical-repo). *)
let resolve_target (registry : Wire.t list) ~(graph_id : string option)
    ~(graph_identifier : string option) : Wire.t option =
  match graph_id with
  | Some gid when present_string gid ->
      List.find_opt
        (fun e -> Wire.get "graph-id" e = Some (Wire.String gid))
        registry
  | _ ->
      (match graph_identifier with
       | Some gi when present_string gi ->
           List.find_opt (fun e -> identifier_match e gi) registry
       | _ -> None)
