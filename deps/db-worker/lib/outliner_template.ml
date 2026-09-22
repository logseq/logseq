(* outliner-template — dynamic "<%var%>" template resolution for the
   :apply-template outliner op.
   Source: deps/outliner/src/logseq/outliner/template.cljs *)

open Datascript

let template_re = Regexp.compile "<%([^%].*?)%>"

(* cljs (.toLocaleTimeString d locale #js{:hour "2-digit" :minute
   "2-digit" :hourCycle "h23"}) — zero-padded 24h HH:MM. *)
let current_time () : string =
  let c = Date_time.of_epoch_ms (Date_time_util.time_ms ()) in
  Printf.sprintf "%02d:%02d" c.Date_time.hour c.Date_time.minute

(* cljs (.setHours d 0 0 0 0) + (.setDate (+ (.getDate d) offset)) —
   local midnight of today shifted by offset days. *)
let date_with_day_offset (offset_days : int) : int64 =
  Date_time_util.plus Date_time_util.Days offset_days
    (Date_time_util.today_ms ())

let journal_day_of_offset (offset_days : int) : int =
  Date_time_util.date_to_int (date_with_day_offset offset_days)

let journal_variable_offsets =
  [ ("today", 0); ("yesterday", -1); ("tomorrow", 1) ]

(* template/journal-title — journal page title or the day int *)
let journal_title (db : db) (offset_days : int) : string =
  let journal_day = journal_day_of_offset offset_days in
  match
    Datascript.q_string db
      (Printf.sprintf
         "[:find ?title . :in $ ?journal-day :where \
          [?p :block/journal-day %d] [?p :block/title ?title]]"
         journal_day)
  with
  | [ [ Result_value (String t) ] ] -> t
  | _ -> string_of_int journal_day

(* template/journal-page *)
let journal_page (db : db) (offset_days : int) : entity option =
  let journal_day = journal_day_of_offset offset_days in
  match
    Datascript.q_string db
      (Printf.sprintf
         "[:find ?p . :in $ ?journal-day :where \
          [?p :block/journal-day %d]]"
         journal_day)
  with
  | [ [ Result_entity id ] ] -> entity db (Entity_id id)
  | [ [ Result_value (Int id) ] ] -> entity db (Entity_id id)
  | _ -> None

(* journal-page-or-title — either an entity or a title string *)
type page_or_title =
  | Page_ent of entity
  | Page_title of string

let journal_page_or_title (db : db) (offset_days : int) : page_or_title =
  match journal_page db offset_days with
  | Some p -> Page_ent p
  | None -> Page_title (journal_title db offset_days)

(* template/target-page — the block's page, or itself when a page *)
let target_page (target : entity) : entity option =
  if Ldb.is_page target then Some target
  else Ldb.ref_ent target "block/page"

(* template/page-ref-for — [[uuid]] when entity, else [[title]] *)
let page_ref_for (p : page_or_title) : string =
  let s =
    match p with
    | Page_ent e -> (
        match Ldb.uuid_value e "block/uuid" with
        | Some u -> u
        | None -> Option.value (Ldb.string_value e "block/title") ~default:"")
    | Page_title t -> t
  in
  "[[" ^ s ^ "]]"

(* template/dynamic-template-matches — trimmed lowercased <%...%>
   matches *)
let dynamic_template_matches (content : string) : string list =
  if content = "" then []
  else
    let rec loop pos acc =
      match Regexp.exec ~pos template_re content with
      | None -> List.rev acc
      | Some m ->
          let g =
            match m.Regexp.groups.(1) with
            | Some s -> String.lowercase_ascii (String.trim s)
            | None -> ""
          in
          loop m.Regexp.last (g :: acc)
    in
    loop 0 []

(* template/block-template-contents — title + raw-title +
   properties-text-values values *)
let block_template_contents (block : Block_map.t) : string list =
  let str_attr a =
    match Block_map.attr_value block a with
    | Some (String s) -> [ s ]
    | _ -> []
  in
  let pvs =
    match Block_map.attr_value block "block/properties-text-values" with
    | Some (Map kvs) ->
        List.filter_map (fun (_k, v) -> match v with String s -> Some s | _ -> None) kvs
    | _ -> []
  in
  str_attr "block/title" @ str_attr "block/raw-title" @ pvs

(* template/dynamic-template-journal-days *)
let dynamic_template_journal_days (blocks : Block_map.t list) : int list =
  blocks
  |> List.concat_map block_template_contents
  |> List.concat_map dynamic_template_matches
  |> List.filter_map (fun v -> List.assoc_opt v journal_variable_offsets)
  |> List.map journal_day_of_offset
  |> List.sort_uniq Stdlib.compare

(* template/variable-rules *)
let variable_rules (db : db) (target : entity) : (string * string) list =
  let today = journal_page_or_title db 0 in
  let current_page =
    match target_page target with
    | Some p -> Page_ent p
    | None -> today
  in
  [ ("today", page_ref_for today)
  ; ("yesterday", page_ref_for (journal_page_or_title db (-1)))
  ; ("tomorrow", page_ref_for (journal_page_or_title db 1))
  ; ("time", current_time ())
  ; ("current page", page_ref_for current_page) ]

(* template/resolve-string — replace each <%var%> via rules *)
let resolve_string (content : string) (rules : (string * string) list) : string =
  Regexp.replace_all template_re
    ~f:(fun ~match_:_ ~groups ~offset:_ ~input:_ ->
      match groups.(1) with
      | Some m ->
          let m' = String.trim m in
          if m' = "" then ""
          else
            let lowered = String.lowercase_ascii m' in
            (match List.assoc_opt lowered rules with
             | Some r -> r
             | None -> m')
      | None -> "")
    content

let resolve_field (v : value) (rules : (string * string) list) : value =
  match v with
  | String s -> String (resolve_string s rules)
  | _ -> v

let resolve_properties_text_values (v : value) (rules : (string * string) list)
    : value =
  match v with
  | Map kvs ->
      Map (List.map (fun (k, v') -> (k, resolve_field v' rules)) kvs)
  | _ -> v

(* template/resolve-block *)
let resolve_block (block : Block_map.t) (rules : (string * string) list)
    : Block_map.t =
  let resolve_attr block a f =
    match Block_map.attr_value block a with
    | Some v -> Block_map.put block a (f v rules)
    | None -> block
  in
  let block = resolve_attr block "block/title" resolve_field in
  let block = resolve_attr block "block/raw-title" resolve_field in
  resolve_attr block "block/properties-text-values" resolve_properties_text_values

(* template/normalize-block — cljs (into {} block) + keep :db/id.
   Converts entity-sourced maps to plain maps: (db/id, Ref id) becomes
   (db/id, Int id) so insert-blocks' de/entity? check routes them through
   the cljs (merge block m) path that preserves all attrs. *)
let normalize_block (block : Block_map.t) : Block_map.t =
  List.map
    (fun (k, v) ->
      if k = "db/id" then
        match v with Ref id -> (k, Int id) | _ -> (k, v)
      else (k, v))
    block

(* template/resolve-dynamic-template-blocks *)
let resolve_dynamic_template_blocks (db : db) (target : entity)
    (blocks : Block_map.t list) : Block_map.t list =
  let rules = variable_rules db target in
  List.map (fun b -> resolve_block (normalize_block b) rules) blocks
