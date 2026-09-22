(* logseq.common.graph-registry — graph registry normalization and
   lookup helpers. Registry entries stay as [Wire.Map] keyword maps so
   unknown keys are preserved through normalize-entry, matching cljs. *)

let db_version_prefix = "logseq_db_"

(* clojure.string/blank?: nil or whitespace-only *)
let is_blank (s : string) : bool =
  let rec loop i =
    if i >= String.length s then true
    else
      match s.[i] with
      | ' ' | '\t' | '\n' | '\r' | '\x0b' | '\x0c' | '\xa0' -> loop (i + 1)
      | _ -> false
  in
  loop 0

let trim (s : string) : string = String.trim s

let lower (s : string) : string = String.lowercase_ascii s

let get_string (k : string) (e : Wire.t) : string option =
  match Cljs_map.get e k with
  | Some (Wire.String s) -> Some s
  | _ -> None

let present_string (k : string) (e : Wire.t) : bool =
  match get_string k e with
  | Some s -> not (is_blank s)
  | None -> false

let present_string_value (s : Wire.t option) : string option =
  match s with
  | Some (Wire.String v) when not (is_blank v) -> Some v
  | _ -> None

(* normalize-entry *)
let normalize_entry (entry : Wire.t) : Wire.t =
  let local_graph_id = get_string "local-graph-id" entry in
  let graph_id =
    match present_string_value (Cljs_map.get entry "graph-id") with
    | Some s -> Some s
    | None ->
        (match local_graph_id with
         | Some s when not (is_blank s) -> Some s
         | _ -> None)
  in
  (match graph_id with
   | None ->
       raise
         (Dispatcher.Exn_info
            ( "Missing graph identity"
            , [ (Wire.Keyword "entry", entry) ] ))
   | Some gid ->
       let e = Cljs_map.assoc entry "graph-id" (Wire.String gid) in
       let e = Cljs_map.dissoc e "rtc-graph-id" in
       let e =
         match get_string "repo" e with
         | Some r -> Cljs_map.assoc e "repo" (Wire.String (trim r))
         | None -> e
       in
       (match get_string "graph-name" e with
        | Some n -> Cljs_map.assoc e "graph-name" (Wire.String (trim n))
        | None -> e))

(* upsert-entry *)
let upsert_entry (registry : Wire.t list) (entry : Wire.t) : Wire.t list =
  let entry' = normalize_entry entry in
  let gid = get_string "graph-id" entry' in
  let repo = get_string "repo" entry' in
  let lgid = get_string "local-graph-id" entry' in
  let same (e : Wire.t) : bool =
    gid = get_string "graph-id" e
    || (match repo with
        | Some r when not (is_blank r) -> Some r = get_string "repo" e
        | _ -> false)
    || (match lgid with
        | Some l when not (is_blank l) ->
            Some l = get_string "local-graph-id" e
        | _ -> false)
  in
  entry' :: List.filter (fun e -> not (same e)) registry

let normalize_comparable (s : string) : string = lower (trim s)

let normalize_comparable_opt (s : string option) : string option =
  Option.map normalize_comparable s

(* canonical-repo: strip every leading "logseq_db_" then re-add one. *)
let canonical_repo (s : string) : string option =
  if s = "" then None
  else
    let trimmed = trim s in
    let n = String.length db_version_prefix in
    let rec strip name =
      if String.length name >= n && String.sub name 0 n = db_version_prefix
      then
        strip
          (trim
             (String.sub name n (String.length name - n)))
      else name
    in
    Some (db_version_prefix ^ strip trimmed)

let identifier_match (entry : Wire.t) (graph_identifier : string) : bool =
  let identifier = normalize_comparable graph_identifier in
  let repo = normalize_comparable_opt (get_string "repo" entry) in
  let graph_name = normalize_comparable_opt (get_string "graph-name" entry) in
  let graph_id = normalize_comparable_opt (get_string "graph-id" entry) in
  let canonical =
    match canonical_repo graph_identifier with
    | Some c -> Some (normalize_comparable c)
    | None -> None
  in
  Some identifier = repo
  || Some identifier = graph_name
  || Some identifier = graph_id
  || canonical = repo

(* resolve-target *)
let resolve_target (registry : Wire.t list) ~(graph_id : string option)
    ~(graph_identifier : string option) : Wire.t option =
  match graph_id with
  | Some gid when not (is_blank gid) ->
      List.find_opt (fun e -> get_string "graph-id" e = Some gid) registry
  | _ ->
      (match graph_identifier with
       | Some ident when not (is_blank ident) ->
           List.find_opt (fun e -> identifier_match e ident) registry
       | _ -> None)
