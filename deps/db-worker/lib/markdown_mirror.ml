(* frontend.worker.markdown-mirror — derived markdown mirror for DB
   graphs. Ported 1:1; filesystem effects go through File_sys inside
   Db_worker_effect. *)

open Datascript

(* ---------- regexes / small helpers ---------- *)

let invalid_file_name_chars_re = Regexp.compile "[<>:\"|?*\\\\/]"

(* \u escapes (not \xNN) — Regexp.translate expands them to the raw
   bytes, which Re.Pcre accepts inside a character class. *)
let ascii_control_re = Regexp.compile "[\\u0000-\\u001F]"

let trailing_space_or_dot_re = Regexp.compile "[ \\.]+$"

let markdown_block_line_re = Regexp.compile "^(\\s*)-\\s?(.*)$"

let markdown_property_line_re =
  Regexp.compile "^(\\s*)\\*\\s+[^:\\s][^:]*::\\s?.*$"

let property_line_re = Regexp.compile "^(\\s*)[^:\\s][^:]*::\\s?.*$"

let ref_or_tag_re = Regexp.compile "(#?)\\[\\[([^\\[\\]]+)\\]\\]"

let simple_hashtag_re =
  Regexp.compile "(^|\\s)#([^\\s#\\[\\]\\(\\),.;:'\"`]+)"

let whitespace_re = Regexp.compile "\\s+"

let simple_tag_token_re = Regexp.compile "[^\\s#\\[\\]\\(\\),.;:'\"`]+"

let str_blank s = String.trim s = ""

let split_lines s = if s = "" then [] else String.split_on_char '\n' s

let replace_all_const re rep s =
  Regexp.replace_all re ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> rep) s

let replace_one_const re rep s =
  Regexp.replace re ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> rep) s

let group m i = if i < Array.length m.Regexp.groups then m.Regexp.groups.(i) else None

let group_str m i = Option.value ~default:"" (group m i)

(* re-seq over capture groups *)
let find_all_groups re s : Regexp.re_match list =
  let rec loop pos acc =
    match Regexp.exec ~pos re s with
    | None -> List.rev acc
    | Some m ->
        let next = if m.Regexp.last <= pos then pos + 1 else m.Regexp.last in
        loop next (m :: acc)
  in
  loop 0 []

(* re-matches: anchored full match *)
let full_match re s : Regexp.re_match option =
  match Regexp.exec ~pos:0 re s with
  | Some m when m.Regexp.offset = 0 && m.last = String.length s -> Some m
  | _ -> None

(* ---------- options / state ---------- *)

type opts =
  { defer : bool
  ; debounce_ms : int
  ; date_formatter : string option
  ; supported_runtime_override : bool option
  ; journal_file_stem_fn : int option -> string option }

type job =
  { repo : string
  ; page_id : entity_id
  ; db : db
  ; opts : opts
  ; old_path : string option
  ; new_path : string option
  ; delete_ : bool }

let repo_enabled : (string, unit) Hashtbl.t = Hashtbl.create 8

let queued_page_jobs : (string, (entity_id, job) Hashtbl.t) Hashtbl.t =
  Hashtbl.create 8

let flush_timers : (string, Timers.timer) Hashtbl.t = Hashtbl.create 8

module SS = Set.Make (String)

type stem_index = (string, SS.t) Hashtbl.t

let stem_cache : (string, db * stem_index) Hashtbl.t = Hashtbl.create 8

(* ---------- file stems ---------- *)

let reserved_windows_device_names =
  List.map
    (fun f -> f ())
    [ (fun () -> "CON"); (fun () -> "PRN"); (fun () -> "AUX");
      (fun () -> "NUL") ]
  @ List.init 9 (fun i -> "COM" ^ string_of_int (i + 1))
  @ List.init 9 (fun i -> "LPT" ^ string_of_int (i + 1))

let max_file_stem_length = 160

let reserved_windows_device_name s =
  List.mem (String.uppercase_ascii s) reserved_windows_device_names

let normalize_file_stem (s : string) : string option =
  let s =
    Unicode.nfc s
    |> replace_all_const invalid_file_name_chars_re "_"
    |> replace_all_const ascii_control_re "_"
    |> replace_all_const trailing_space_or_dot_re ""
  in
  let s =
    if String.length s > max_file_stem_length then
      String.sub s 0 max_file_stem_length
    else s
  in
  if str_blank s || reserved_windows_device_name s then None else Some s

let normalize_file_stem_opt (s : string option) : string option =
  Option.bind s normalize_file_stem

let journal_file_stem (journal_day : int option) : string option =
  match journal_day with
  | Some d ->
      let s = string_of_int d in
      if String.length s = 8 then
        Some (String.sub s 0 4 ^ "_" ^ String.sub s 4 2 ^ "_" ^ String.sub s 6 2)
      else None
  | None -> None

let default_opts =
  { defer = false
  ; debounce_ms = 1000
  ; date_formatter = None
  ; supported_runtime_override = None
  ; journal_file_stem_fn = journal_file_stem }

(* ---------- stem index ---------- *)

let non_journal_page (page : entity) : bool =
  Ldb.is_page page && not (Ldb.is_journal page)

let uuid_of (e : entity) : string =
  match Ldb.value e "block/uuid" with Some (Uuid u) -> u | _ -> ""

let build_stem_index db : stem_index =
  let index = Hashtbl.create 256 in
  Datascript.datoms db Datascript.Avet ~a:"block/name" ()
  |> Seq.iter (fun (d : datom) ->
         match Ldb.ent_of_id db d.e with
         | Some page when non_journal_page page ->
             (match
                ( normalize_file_stem_opt (Ldb.string_value page "block/title"),
                  Ldb.value page "block/uuid" )
              with
              | Some stem, Some (Uuid u) ->
                  let s =
                    Option.value (Hashtbl.find_opt index stem)
                      ~default:SS.empty
                  in
                  Hashtbl.replace index stem (SS.add u s)
              | _ -> ())
         | _ -> ());
  index

let stem_index repo db : stem_index =
  match Hashtbl.find_opt stem_cache repo with
  | Some (cached_db, index) when cached_db == db -> index
  | _ ->
      let index = build_stem_index db in
      Hashtbl.replace stem_cache repo (db, index);
      index

let update_stem_index index ~db_before ~db_after ~page_ids : stem_index =
  let index' = Hashtbl.copy index in
  let remove_uuid page =
    match normalize_file_stem_opt (Ldb.string_value page "block/title") with
    | Some old_stem ->
        (match Hashtbl.find_opt index' old_stem with
         | Some uuids ->
             let uuids' = SS.remove (uuid_of page) uuids in
             if SS.is_empty uuids' then Hashtbl.remove index' old_stem
             else Hashtbl.replace index' old_stem uuids'
         | None -> ())
    | None -> ()
  in
  let add_uuid page =
    match normalize_file_stem_opt (Ldb.string_value page "block/title") with
    | Some new_stem ->
        let s =
          Option.value (Hashtbl.find_opt index' new_stem) ~default:SS.empty
        in
        Hashtbl.replace index' new_stem (SS.add (uuid_of page) s)
    | None -> ()
  in
  List.iter
    (fun pid ->
       (match entity db_before (Entity_id pid) with
        | Some p when non_journal_page p -> remove_uuid p
        | _ -> ());
       match entity db_after (Entity_id pid) with
       | Some p when non_journal_page p -> add_uuid p
       | _ -> ())
    page_ids;
  index'

let pages_with_file_stem repo db stem : entity list =
  match Hashtbl.find_opt (stem_index repo db) stem with
  | None -> []
  | Some uuids ->
      SS.elements uuids
      |> List.filter_map (fun u ->
             entity db (Lookup_ref ("block/uuid", Uuid u)))
      |> List.sort (fun a b -> compare (uuid_of a) (uuid_of b))

let page_relative_path repo db (page : entity) ~(opts : opts) : string option =
  if Ldb.is_journal page then
    let day =
      match Ldb.value page "block/journal-day" with
      | Some (Int n) -> Some n
      | _ -> None
    in
    (match normalize_file_stem_opt (opts.journal_file_stem_fn day) with
     | Some stem -> Some ("journals/" ^ stem ^ ".md")
     | None -> None)
  else
    match normalize_file_stem_opt (Ldb.string_value page "block/title") with
    | None -> None
    | Some stem ->
        let dups = pages_with_file_stem repo db stem in
        let idx =
          match List.find_index (fun p -> uuid_of p = uuid_of page) dups with
          | Some i -> i + 1
          | None -> 1
        in
        let stem' =
          if idx = 1 then stem else stem ^ " (" ^ string_of_int idx ^ ")"
        in
        Some ("pages/" ^ stem' ^ ".md")

let repo_mirror_dir repo =
  match Graph_dir.repo_to_encoded_graph_dir_name repo with
  | Some d -> d ^ "/mirror/markdown"
  | None -> "mirror/markdown"

let mirror_path repo relative_path =
  repo_mirror_dir repo ^ "/" ^ relative_path

(* ---------- affected pages ---------- *)

let page_id_for_entity db (eid : entity_id) : entity_id option =
  match entity db (Entity_id eid) with
  | None -> None
  | Some ent ->
      if Ldb.is_page ent then Some ent.id
      else
        (match Ldb.ref_ent ent "block/page" with
         | Some p -> Some p.id
         | None ->
             (match Ldb.ref_ent ent "block/parent" with
              | Some parent when Ldb.is_page parent -> Some parent.id
              | Some parent ->
                  Option.map (fun (p : entity) -> p.id)
                    (Ldb.ref_ent parent "block/page")
              | None -> None))

let referring_page_ids db (page_eid : entity_id) : entity_id list =
  match entity db (Entity_id page_eid) with
  | None -> []
  | Some e ->
      Ldb.ref_ents e "block/_refs"
      |> List.filter_map (fun (b : entity) -> page_id_for_entity db b.id)

let dedup_ids ids =
  let seen = Hashtbl.create 16 in
  List.filter
    (fun id ->
       if Hashtbl.mem seen id then false
       else begin
         Hashtbl.add seen id ();
         true
       end)
    ids

let affected_page_ids ~(db_before : db) ~(db_after : db) ~(tx_data : datom list)
    : entity_id list =
  List.concat_map
    (fun (d : datom) ->
       let base =
         List.filter_map Fun.id
           [ page_id_for_entity db_before d.e;
             page_id_for_entity db_after d.e ]
       in
       let base =
         if d.a = "block/page" then
           match d.v with Ref pid -> pid :: base | _ -> base
         else base
       in
       if
         d.added
         && (d.a = "block/title" || d.a = "block/name")
         &&
         (match entity db_after (Entity_id d.e) with
          | Some e -> Ldb.is_page e
          | None -> false)
       then base @ referring_page_ids db_after d.e
       else base)
    tx_data
  |> dedup_ids

(* ---------- enabled / platform ---------- *)

let set_enabled repo enabled_ =
  if enabled_ then Hashtbl.replace repo_enabled repo ()
  else begin
    (match Hashtbl.find_opt flush_timers repo with
     | Some t -> Timers.clear t
     | None -> ());
    Hashtbl.remove repo_enabled repo;
    Hashtbl.remove queued_page_jobs repo;
    Hashtbl.remove flush_timers repo
  end;
  ()

let enabled repo = Hashtbl.mem repo_enabled repo

let supported_runtime (opts : opts) : bool =
  match opts.supported_runtime_override with
  | Some b -> b
  | None ->
      Runtime_env.kind () <> Runtime_env.Browser_worker
      || Runtime_env.electron_owner ()

let is_not_found_exn exn =
  let msg =
    match exn with
    | Sys_error m -> m
    | Failure m -> m
    | _ -> Printexc.to_string exn
  in
  Export_file.str_contains msg "ENOENT"
  || Export_file.str_contains msg "No such file"
  || Export_file.str_contains msg "NotFoundError"

let read_text_opt path : string option Db_worker_effect.t =
  Db_worker_effect.catch
    (Db_worker_effect.map Option.some (File_sys.read_text path))
    (fun exn ->
       if is_not_found_exn exn then Db_worker_effect.pure None
       else Db_worker_effect.error exn)

let write_text_atomic path content = File_sys.write_text_atomic path content

let delete_file path = File_sys.remove path

(* ---------- content decoration ---------- *)

type ref_target = { title : string; tag : bool }

let content_ref_targets (title : string) : ref_target list =
  let page_ref_targets =
    find_all_groups ref_or_tag_re title
    |> List.filter_map (fun m ->
           let page_title = group_str m 2 in
           if not (Ldb.is_uuid_string page_title) then
             Some { title = page_title; tag = group_str m 1 = "#" }
           else None)
  in
  let tag_targets =
    find_all_groups simple_hashtag_re title
    |> List.filter_map (fun m ->
           let t = group_str m 2 in
           if not (Ldb.is_uuid_string t) then Some { title = t; tag = true }
           else None)
  in
  let seen = Hashtbl.create 8 in
  List.filter
    (fun (r : ref_target) ->
       if Hashtbl.mem seen (r.title, r.tag) then false
       else begin
         Hashtbl.add seen (r.title, r.tag) ();
         true
       end)
    (page_ref_targets @ tag_targets)

let status_marker_content (content : string) : string option =
  let c = String.trim content in
  if c = "" then None
  else
    Some
      (String.uppercase_ascii c
       |> replace_all_const whitespace_re "-")

(* status value -> marker (cljs status-marker) *)
let status_marker db (v : value) : string option =
  match v with
  | Keyword k -> status_marker_content k
  | Ref id ->
      (match Ldb.ent_of_id db id with
       | Some status ->
           (match Ldb.string_value status "block/title" with
            | Some c -> status_marker_content c
            | None ->
                (match Ldb.value status "logseq.property/value" with
                 | Some (String c) -> status_marker_content c
                 | Some (Int n) -> status_marker_content (string_of_int n)
                 | _ -> None))
       | None -> None)
  | _ -> None

let simple_tag_token title = Regexp.test simple_tag_token_re title

let token_title token =
  if
    String.length token >= 5
    && String.sub token 0 3 = "#[["
    && String.sub token (String.length token - 2) 2 = "]]"
  then String.sub token 3 (String.length token - 5)
  else if String.length token >= 1 && token.[0] = '#' then
    String.sub token 1 (String.length token - 1)
  else token

let tag_token (tag : entity) : string option =
  let title =
    match Ldb.string_value tag "block/title" with
    | Some t -> Some t
    | None -> Ldb.string_value tag "block/name"
  in
  match title with
  | Some title when String.trim title <> "" ->
      Some
        (if simple_tag_token title then "#" ^ title
         else "#[[" ^ title ^ "]]")
  | _ -> None

let built_in_tag (tag : entity) : bool =
  Ldb.built_in tag
  ||
  match Ldb.value tag "db/ident" with
  | Some (Keyword k) ->
      (match String.index_opt k '/' with
       | Some i -> String.sub k 0 i = "logseq.class"
       | None -> false)
  | _ -> false

let mirror_tag_tokens (block : entity) : string list =
  Ldb.ref_ents block "block/tags"
  |> List.filter (fun t -> not (built_in_tag t))
  |> List.filter_map tag_token
  |> List.sort compare

let id_property_line block_uuid = "id:: " ^ block_uuid

let content_has_status_marker content marker =
  content = marker
  || (String.length content > String.length marker
      && String.sub content 0 (String.length marker + 1) = marker ^ " ")

let content_tag_titles content : (string, unit) Hashtbl.t =
  let titles = Hashtbl.create 8 in
  content_ref_targets content
  |> List.iter (fun r ->
         if r.tag then
           Hashtbl.replace titles (String.lowercase_ascii r.title) ());
  titles

let decorate_block_content ~status ~tag_tokens content : string =
  let content = Option.value ~default:"" content in
  let content =
    match status with
    | Some m when not (content_has_status_marker content m) ->
        if str_blank content then m else m ^ " " ^ content
    | _ -> content
  in
  let existing = content_tag_titles content in
  let tokens' =
    List.filter
      (fun token ->
         not
           (Hashtbl.mem existing (String.lowercase_ascii (token_title token))))
      tag_tokens
  in
  match tokens' with
  | [] -> content
  | _ -> content ^ " " ^ String.concat " " tokens'

(* ---------- block line infos ---------- *)

type block_line_info =
  { first_line_fragment : string
  ; code_block : bool
  ; status : string option
  ; tag_tokens : string list
  ; marker : string
  ; embed_target : entity option }

let order_list_number (block : entity) : bool =
  let content =
    match Ldb.value block "logseq.property/order-list-type" with
    | Some (Keyword k) -> Some k
    | Some (String s) -> Some s
    | Some (Ref id) ->
        Option.bind (Ldb.ent_of_id block.db id) Ldb.property_value_content
    | _ -> None
  in
  Option.value ~default:"" (Option.map String.lowercase_ascii content)
  = "number"

let embed_target (block : entity) : entity option =
  match Ldb.ref_ent block "block/link" with
  | Some target ->
      if Option.is_some (Ldb.value target "block/uuid")
         && not (Ldb.is_page target)
      then Some target
      else None
  | None -> None

let content_first_line content =
  match split_lines (Option.value ~default:"" content) with
  | [] -> ""
  | l :: _ -> String.trim l

let block_first_line_fragment (block : entity) : string =
  content_first_line (Ldb.string_value block "block/title")

let code_fence_block_line content =
  let t = String.trim content in
  String.length t >= 3 && String.sub t 0 3 = "```"

let normalize_rendered_match_text (content : string) : string =
  content
  |> Regexp.replace_all ref_or_tag_re ~f:(fun ~match_:_ ~groups ~offset:_ ~input:_ ->
         let g i = Option.value ~default:"" (if i < Array.length groups then groups.(i) else None) in
         g 1 ^ "[[]]")
  |> Regexp.replace_all simple_hashtag_re
       ~f:(fun ~match_:_ ~groups ~offset:_ ~input:_ ->
         let g i = Option.value ~default:"" (if i < Array.length groups then groups.(i) else None) in
         g 1 ^ "#[[]]")
  |> replace_all_const whitespace_re " "
  |> String.trim
  |> String.lowercase_ascii

let rendered_line_matches_block (info : block_line_info option) (content : string)
    : bool =
  match info with
  | None -> false
  | Some info ->
      let content' = normalize_rendered_match_text content in
      let fragment' = normalize_rendered_match_text info.first_line_fragment in
      if info.code_block then code_fence_block_line content
      else if str_blank fragment' then str_blank content
      else Export_file.str_contains content' fragment'

(* db/class-instance? — class via tags incl. transitive class/extends. *)
let class_instance (cls : entity) (obj : entity) : bool =
  let tags = Ldb.ref_ents obj "block/tags" in
  if List.exists (fun (t : entity) -> t.id = cls.id) tags then true
  else begin
    let is_class e = Ldb.has_tag e "logseq.class/Tag" in
    let rec extends_all acc = function
      | [] -> acc
      | c :: rest ->
          let ext = Ldb.ref_ents c "logseq.property.class/extends" in
          extends_all (acc @ ext) (rest @ ext)
    in
    let parents =
      List.filter is_class tags |> extends_all [] |> List.map (fun e -> e.id)
    in
    List.exists (fun id -> id = cls.id) parents
  end

let code_block (block : entity) : bool =
  (match Ldb.value block "logseq.property.node/display-type" with
   | Some (Keyword "code") -> true
   | _ -> false)
  || Ldb.ref_ents block "block/tags"
     |> List.exists (fun t ->
            match Ldb.value t "db/ident" with
            | Some (Keyword "logseq.class/Code-block") -> true
            | _ -> false)

let block_line_info db (block : entity) marker : block_line_info =
  let has_status_datoms =
    Datascript.datoms db Datascript.Eavt ~e:block.id
      ~a:"logseq.property/status" ()
    |> Seq.take 1 |> List.of_seq
    |> fun l -> l <> []
  in
  let is_task =
    match entity db (Ident "logseq.class/Task") with
    | Some task -> class_instance task block
    | None -> false
  in
  let status =
    if has_status_datoms || is_task then
      (* cljs lookup-kv-with-default-value: a missing status datom falls
         back to the property's :logseq.property/default-value. *)
      let status_value =
        match Ldb.value block "logseq.property/status" with
        | Some _ as v -> v
        | None ->
            (match entity db (Ident "logseq.property/status") with
             | Some prop ->
                 (match Ldb.value prop "logseq.property/default-value" with
                  | Some (Keyword k) ->
                      Option.map
                        (fun (e : entity) -> Ref e.id)
                        (entity db (Ident k))
                  | v -> v)
             | None -> None)
      in
      Option.bind status_value (status_marker db)
    else None
  in
  { first_line_fragment = block_first_line_fragment block
  ; code_block = code_block block
  ; status
  ; tag_tokens = mirror_tag_tokens block
  ; marker
  ; embed_target = embed_target block }

let property_derived_block (block : entity) : bool =
  Option.is_some (Ldb.value block "logseq.property/created-from-property")
  || Option.is_some (Ldb.value block "block/closed-value-property")

let outline_children (block : entity) : entity list =
  Ldb.ref_ents block "block/_parent"
  |> List.filter (fun c -> not (property_derived_block c))
  |> Ldb.sort_by_order

let page_root_blocks (page : entity) : entity list = outline_children page

(* flattened pre-order with sibling ordering numbers *)
let block_line_infos db (blocks : entity list) : block_line_info list =
  let rec loop number result = function
    | [] -> List.rev result
    | block :: more ->
        let ordered = order_list_number block in
        let marker = if ordered then string_of_int number ^ "." else "-" in
        let info = block_line_info db block marker in
        let children = loop 1 [] (outline_children block) in
        loop
          (if ordered then number + 1 else number)
          (List.rev_append (List.rev children) (info :: result))
          more
  in
  loop 1 [] blocks

let rendered_block_line_infos db (page : entity) : block_line_info list =
  block_line_infos db (page_root_blocks page)

(* ---------- decorate rendered content ---------- *)

let line_level spaces (opts : opts) =
  let indent_width = max 1 (String.length "  ") in
  let _ = opts in
  1 + (String.length spaces / indent_width)

let render_ctx (opts : opts) : Export_file.context =
  { Export_file.mirror_context with
    date_formatter = opts.date_formatter }

let block_content db block_uuid ~init_level (opts : opts) : string =
  Export_file.block_to_content db ~block_uuid
    ~opts:{ Export_file.default_tree_opts with init_level }
    ~ctx:(render_ctx opts)

let rec decorate_rendered_content db content line_infos (opts : opts)
    ~initial_lines ~insert_blank_before_first_block : string list =
  let lines_in = split_lines content in
  let rec loop lines infos out seen_block property_indent in_code_block =
    match lines with
    | [] -> out
    | line :: more ->
        if in_code_block then
          loop more infos (line :: out) seen_block property_indent
            (not (code_fence_block_line line))
        else if property_value_line line property_indent then
          loop more infos (line :: out) seen_block property_indent false
        else
          (match full_match markdown_block_line_re line with
           | Some m ->
               let title = group_str m 2 in
               let spaces = group_str m 1 in
               (match infos with
                | info :: rest_infos when rendered_line_matches_block (Some info) title ->
                    let out' =
                      if insert_blank_before_first_block && not seen_block then
                        "" :: out
                      else out
                    in
                    let out'' =
                      List.rev_append
                        (decorate_block_line db info line ~spaces ~title opts)
                        out'
                    in
                    loop more rest_infos out'' true None
                      (info.code_block && code_fence_block_line title)
                | _ ->
                    loop more infos (line :: out) seen_block property_indent
                      false)
           | None ->
               loop more infos (line :: out) seen_block
                 (property_line_indent line) false)
  in
  List.rev
    (loop lines_in line_infos (List.rev initial_lines) false None false)

and property_value_line line (property_indent : int option) : bool =
  match property_indent with
  | Some n -> (not (str_blank line)) && n < leading_space_count line
  | None -> false

and leading_space_count line : int =
  let n = String.length line in
  let rec count i =
    if i < n && (line.[i] = ' ' || line.[i] = '\t') then count (i + 1) else i
  in
  count 0

and property_line_indent line : int option =
  match Regexp.exec ~pos:0 markdown_property_line_re line with
  | Some m when m.Regexp.offset = 0 -> Some (String.length (group_str m 1))
  | _ ->
      (match Regexp.exec ~pos:0 property_line_re line with
       | Some m when m.Regexp.offset = 0 ->
           Some (String.length (group_str m 1))
       | _ -> None)

and decorate_block_line db (info : block_line_info) line ~spaces ~title
    (opts : opts) : string list =
  let _ = line in
  match info.embed_target with
  | Some target ->
      (match Ldb.value target "block/uuid" with
       | Some (Uuid u) ->
           let content =
             block_content db u
               ~init_level:(Some (line_level spaces opts))
               opts
           in
           decorate_rendered_content db content
             (block_line_infos db [ target ])
             opts ~initial_lines:[] ~insert_blank_before_first_block:false
       | _ -> [ line ])
  | None ->
      let content =
        decorate_block_content ~status:info.status ~tag_tokens:info.tag_tokens
          (Some title)
      in
      [ spaces ^ info.marker
        ^ (if str_blank content then "" else " " ^ content) ]

(* id:: line + decorated content *)
let add_page_id_to_rendered_content db (page : entity) content (opts : opts)
    : string =
  let lines =
    decorate_rendered_content db content (rendered_block_line_infos db page)
      opts
      ~initial_lines:
        [ (match Ldb.value page "block/uuid" with
           | Some (Uuid u) -> id_property_line u
           | _ -> "id:: ") ]
      ~insert_blank_before_first_block:true
  in
  String.concat "\n" lines

let render_page_content db (page : entity) (opts : opts) : string =
  let content =
    Export_file.block_to_content db
      ~block_uuid:(uuid_of page)
      ~opts:{ Export_file.default_tree_opts with include_page_properties = true }
      ~ctx:(render_ctx opts)
  in
  add_page_id_to_rendered_content db page content opts

(* ---------- page selection ---------- *)

let contents_page (page : entity) : bool =
  match Ldb.string_value page "block/name" with
  | Some "contents" -> true
  | _ -> false

let mirrorable_page (page : entity) : bool =
  Ldb.is_page page
  && (not (Ldb.built_in page) || contents_page page)
  && not (Ldb.is_property page)
  && not (Ldb.hidden page)
  && Option.is_none (Ldb.value page "logseq.property.user/email")

let mirrorable_pages db : entity list =
  Datascript.datoms db Datascript.Avet ~a:"block/name" ()
  |> Seq.filter_map (fun (d : datom) -> Ldb.ent_of_id db d.e)
  |> List.of_seq
  |> List.filter mirrorable_page
  |> List.stable_sort (fun (a : entity) (b : entity) ->
         let day e =
           match Ldb.value e "block/journal-day" with
           | Some (Int n) -> string_of_int n
           | _ -> ""
         in
         let title e =
           String.lowercase_ascii
             (Option.value ~default:"" (Ldb.string_value e "block/title"))
         in
         compare
           ( (if Ldb.is_journal a then 0 else 1),
             day a, title a, uuid_of a )
           ( (if Ldb.is_journal b then 0 else 1),
             day b, title b, uuid_of b ))

(* ---------- jobs / writes ---------- *)

type mirror_status =
  | Written
  | Skipped of string
  | Deleted
  | Error of string
  | Completed

let write_if_changed path content : (string * string) Db_worker_effect.t =
  let open Db_worker_effect.Infix in
  read_text_opt path >>= fun current ->
  if current = Some content then
    Db_worker_effect.pure ("skipped", "unchanged")
  else
    write_text_atomic path content
    >>= fun () -> Db_worker_effect.pure ("written", "")

let result_wire status repo page extra =
  Wire.Map
    ([ (Wire.Keyword "status", Wire.Keyword status) ]
     @ (match repo with
        | Some r -> [ (Wire.Keyword "repo", Wire.String r) ]
        | None -> [])
     @ extra
     @ (match page with
        | Some e ->
            [ (Wire.Keyword "page-uuid", Wire.String (uuid_of e)) ]
        | None -> []))

let mirror_page repo db (page_id : entity_id) (opts : opts)
    : Wire.t Db_worker_effect.t =
  let open Db_worker_effect.Infix in
  if not (supported_runtime opts) then
    Db_worker_effect.pure (result_wire "skipped" None None
                             [ (Wire.Keyword "reason",
                                Wire.Keyword "unsupported-runtime") ])
  else
    match entity db (Entity_id page_id) with
    | None ->
        Db_worker_effect.pure
          (result_wire "skipped" (Some repo) None
             [ (Wire.Keyword "reason", Wire.Keyword "missing-page");
               (Wire.Keyword "page-id", Wire.Int page_id) ])
    | Some page ->
        if not (mirrorable_page page) then
          Db_worker_effect.pure
            (result_wire "skipped" (Some repo) (Some page)
               [ (Wire.Keyword "reason", Wire.Keyword "excluded-page");
                 (Wire.Keyword "page-id", Wire.Int page_id) ])
        else
          let journal_day =
            match Ldb.value page "block/journal-day" with
            | Some (Int n) -> Some n
            | _ -> None
          in
          let duplicate_day =
            Ldb.is_journal page
            && (match journal_day with
                | Some day ->
                    Datascript.datoms db Datascript.Avet
                      ~a:"block/journal-day" ~v:(Int day) ()
                    |> Seq.take 2 |> List.of_seq |> List.length > 1
                | None -> false)
          in
          if duplicate_day then
            Db_worker_effect.pure
              (result_wire "error" (Some repo) (Some page)
                 [ (Wire.Keyword "reason", Wire.Keyword "duplicate-journal-day");
                   ( Wire.Keyword "journal-day",
                     Option.value ~default:Wire.nil
                       (Option.map (fun d -> Wire.Int d) journal_day) ) ])
          else
            (match page_relative_path repo db page ~opts with
             | None ->
                 Worker_log.error "markdown-mirror/invalid-file-name"
                   [ ("repo", repo) ];
                 Db_worker_effect.pure
                   (result_wire "error" (Some repo) (Some page)
                      [ (Wire.Keyword "reason",
                         Wire.Keyword "invalid-file-name") ])
             | Some relative_path ->
                 let path = mirror_path repo relative_path in
                 let content = render_page_content db page opts in
                 write_if_changed path content
                 >>= fun (status, reason) ->
                 Db_worker_effect.pure
                   (result_wire status (Some repo) (Some page)
                      ([ (Wire.Keyword "path", Wire.String path) ]
                       @ (match reason with
                          | "" -> []
                          | r ->
                              [ (Wire.Keyword "reason", Wire.Keyword r) ]))))

let deleted_page (page : entity option) : bool =
  match page with
  | None -> true
  | Some p -> not (mirrorable_page p)

let page_job repo ~(db_before : db) ~(db_after : db) (page_id : entity_id)
    (opts : opts) : job =
  let before_page = entity db_before (Entity_id page_id) in
  let after_page = entity db_after (Entity_id page_id) in
  let old_path =
    Option.bind before_page (fun p ->
        Option.map
          (fun r -> mirror_path repo r)
          (page_relative_path repo db_before p ~opts))
  in
  let new_path =
    Option.bind after_page (fun p ->
        Option.map
          (fun r -> mirror_path repo r)
          (page_relative_path repo db_after p ~opts))
  in
  { repo
  ; page_id
  ; db = db_after
  ; opts
  ; old_path
  ; new_path
  ; delete_ = deleted_page after_page }

let queue_job (job : job) : unit =
  let table =
    match Hashtbl.find_opt queued_page_jobs job.repo with
    | Some t -> t
    | None ->
        let t = Hashtbl.create 16 in
        Hashtbl.replace queued_page_jobs job.repo t;
        t
  in
  Hashtbl.replace table job.page_id
    (match Hashtbl.find_opt table job.page_id with
     | Some old when old.old_path <> None ->
         { job with old_path = (match job.old_path with Some _ -> job.old_path | None -> old.old_path) }
     | _ -> job)

let drain_repo_jobs repo : job list =
  match Hashtbl.find_opt queued_page_jobs repo with
  | None -> []
  | Some t ->
      Hashtbl.remove queued_page_jobs repo;
      Hashtbl.fold (fun _ j acc -> j :: acc) t []

let rec run_job (job : job) : Wire.t Db_worker_effect.t =
  let open Db_worker_effect.Infix in
  if job.delete_ then
    match job.old_path with
    | Some old_path ->
        delete_file old_path
        >>= fun () ->
        Db_worker_effect.pure
          (Wire.Map
             [ (Wire.Keyword "status", Wire.Keyword "deleted");
               (Wire.Keyword "path", Wire.String old_path) ])
    | None ->
        Db_worker_effect.pure
          (Wire.Map
             [ (Wire.Keyword "status", Wire.Keyword "skipped");
               (Wire.Keyword "reason", Wire.Keyword "missing-old-path") ])
  else
    mirror_page job.repo job.db job.page_id job.opts
    >>= fun result ->
    (match job.old_path, job.new_path with
     | Some old_path, Some new_path
       when old_path <> new_path
            && (match Wire.get "status" result with
                | Some (Wire.Keyword "written") -> true
                | Some (Wire.Keyword "skipped") ->
                    Wire.get "reason" result
                    = Some (Wire.Keyword "unchanged")
                | _ -> false) ->
         delete_file old_path
     | _ -> Db_worker_effect.pure ())
    >>= fun () -> Db_worker_effect.pure result

and schedule_flush repo (opts : opts) : unit =
  if not (Hashtbl.mem flush_timers repo) then begin
    let t =
      Timers.set_timeout opts.debounce_ms (fun () ->
          Hashtbl.remove flush_timers repo;
          Db_worker_effect.async (fun () ->
              Db_worker_effect.map (fun _ -> ())
                (Db_worker_effect.catch (flush_repo repo opts) (fun e ->
                     Worker_log.error "markdown-mirror/flush-failed"
                       [ ("repo", repo); ("error", Printexc.to_string e) ];
                     Db_worker_effect.pure Wire.nil))))
    in
    Hashtbl.replace flush_timers repo t
  end

and flush_repo repo (_opts : opts) : Wire.t Db_worker_effect.t =
  drain_repo_jobs repo
  |> List.map run_job
  |> Db_worker_effect.all
  |> Db_worker_effect.map (fun results -> Wire.Array results)

let handle_tx_report repo (report : tx_report) (opts : opts)
    : Wire.t Db_worker_effect.t =
  if enabled repo && supported_runtime opts then
    let affected = affected_page_ids ~db_before:report.db_before
                     ~db_after:report.db_after ~tx_data:report.tx_data in
    let index_before = stem_index repo report.db_before in
    let index_after =
      update_stem_index index_before ~db_before:report.db_before
        ~db_after:report.db_after ~page_ids:affected
    in
    Hashtbl.replace stem_cache repo (report.db_after, index_after);
    let from_disk =
      List.exists
        (fun (k, v) ->
           k = "from-disk?"
           && (match v with Bool true -> true | _ -> false))
        report.tx_meta
    in
    if from_disk then
      Db_worker_effect.pure
        (Wire.Map
           [ (Wire.Keyword "status", Wire.Keyword "skipped");
             (Wire.Keyword "reason", Wire.Keyword "from-disk") ])
    else
      let jobs =
        List.map
          (fun pid ->
             page_job repo ~db_before:report.db_before
               ~db_after:report.db_after pid opts)
          affected
      in
      if opts.defer then begin
        List.iter queue_job jobs;
        schedule_flush repo opts;
        Db_worker_effect.pure
          (Wire.Map
             [ (Wire.Keyword "status", Wire.Keyword "queued");
               (Wire.Keyword "count", Wire.Int (List.length jobs)) ])
      end else
        Db_worker_effect.map (fun rs -> Wire.Array rs)
          (Db_worker_effect.all (List.map run_job jobs))
  else
    Db_worker_effect.pure
      (Wire.Map
         [ (Wire.Keyword "status", Wire.Keyword "skipped");
           (Wire.Keyword "reason",
            Wire.Keyword "disabled-or-unsupported") ])

let mirror_repo repo db (opts : opts) : Wire.t Db_worker_effect.t =
  if not (supported_runtime opts) then
    Db_worker_effect.pure
      (Wire.Map
         [ (Wire.Keyword "status", Wire.Keyword "skipped");
           (Wire.Keyword "reason", Wire.Keyword "unsupported-runtime") ])
  else
    mirrorable_pages db
    |> List.map (fun (p : entity) -> mirror_page repo db p.id opts)
    |> Db_worker_effect.all
    |> Db_worker_effect.map (fun results ->
           Wire.Map
             [ (Wire.Keyword "status", Wire.Keyword "completed");
               (Wire.Keyword "count", Wire.Int (List.length results));
               (Wire.Keyword "results", Wire.Array results) ])
