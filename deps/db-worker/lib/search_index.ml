(* Port of frontend.worker.search — full-text + fuzzy + vector search
   over the per-repo sqlite search db and the platform vector index.

   String ops that cljs runs on JS strings (count/subs/indexOf/charAt/
   lastIndexOf/includes/endsWith) are UTF-16 code-unit operations — the
   snippet engine below works on int arrays of code units via U16 and
   re-encodes to UTF-8 when slicing results back out. *)

open Datascript
module Ev = Entity_view
module Fz = Search_fuzzy
module Bb = Block_breadcrumb

(* ---- utf-16 code-unit string ops (JS string semantics) ---- *)

module U16 = struct
  type t = int array

  let of_string = Fz.utf16_units

  (* encode code units back to utf-8; lone surrogates -> U+FFFD like JS
     string -> utf8 encoders. *)
  let to_string (u : t) : string =
    let buf = Buffer.create (Array.length u) in
    let emit cp =
      if cp < 0x80 then Buffer.add_char buf (Char.chr cp)
      else if cp < 0x800 then begin
        Buffer.add_char buf (Char.chr (0xC0 lor (cp lsr 6)));
        Buffer.add_char buf (Char.chr (0x80 lor (cp land 0x3F)))
      end else if cp < 0x10000 then begin
        Buffer.add_char buf (Char.chr (0xE0 lor (cp lsr 12)));
        Buffer.add_char buf (Char.chr (0x80 lor ((cp lsr 6) land 0x3F)));
        Buffer.add_char buf (Char.chr (0x80 lor (cp land 0x3F)))
      end else begin
        Buffer.add_char buf (Char.chr (0xF0 lor (cp lsr 18)));
        Buffer.add_char buf (Char.chr (0x80 lor ((cp lsr 12) land 0x3F)));
        Buffer.add_char buf (Char.chr (0x80 lor ((cp lsr 6) land 0x3F)));
        Buffer.add_char buf (Char.chr (0x80 lor (cp land 0x3F)))
      end
    in
    let n = Array.length u in
    let rec loop i =
      if i < n then begin
        let w = u.(i) in
        if w >= 0xD800 && w <= 0xDBFF && i + 1 < n
           && u.(i + 1) >= 0xDC00 && u.(i + 1) <= 0xDFFF
        then begin
          emit (0x10000 + ((w - 0xD800) lsl 10) + (u.(i + 1) - 0xDC00));
          loop (i + 2)
        end else if w >= 0xD800 && w <= 0xDFFF then begin
          emit 0xFFFD;
          loop (i + 1)
        end else begin
          emit w;
          loop (i + 1)
        end
      end
    in
    loop 0;
    Buffer.contents buf

  let length = Array.length
  let sub_u (u : t) start len =
    let n = Array.length u in
    let start = max 0 start in
    let len = max 0 (min len (n - start)) in
    Array.sub u start len

  let sub_string (u : t) start len = to_string (sub_u u start len)

  let index_of (text : t) (sub : t) (from : int) : int option =
    let n = Array.length text and m = Array.length sub in
    if m = 0 then Some (min (max 0 from) n)
    else begin
      let rec go i =
        if i + m > n then None
        else begin
          let rec eq j = j >= m || (text.(i + j) = sub.(j) && eq (j + 1)) in
          if eq 0 then Some i else go (i + 1)
        end
      in
      if from >= n then None else go (max 0 from)
    end

  let last_index_of (text : t) (sub : t) : int option =
    let n = Array.length text and m = Array.length sub in
    if m = 0 then Some (n - 1)
    else if m > n then None
    else begin
      let rec go i =
        if i < 0 then None
        else begin
          let rec eq j = j >= m || (text.(i + j) = sub.(j) && eq (j + 1)) in
          if eq 0 then Some i else go (i - 1)
        end
      in
      go (n - m)
    end

  let starts_with (text : t) (prefix : t) : bool =
    let n = Array.length text and m = Array.length prefix in
    m <= n
    && (let rec eq i = i >= m || (text.(i) = prefix.(i) && eq (i + 1)) in
        eq 0)

  let ends_with (text : t) (suffix : t) : bool =
    let n = Array.length text and m = Array.length suffix in
    m <= n
    && (let rec eq i = i >= m || (text.(n - m + i) = suffix.(i) && eq (i + 1)) in
        eq 0)

  let char_at (u : t) i = u.(i)
end

let is_blank (s : string) : bool =
  let rec all i =
    i >= String.length s
    || ((match s.[i] with ' ' | '\t' | '\n' | '\r' | '\011' | '\012' -> true | _ -> false)
        && all (i + 1))
  in
  all 0

let is_blank_opt = function Some s -> is_blank s | None -> true

(* UTF-16 code-unit truncation — cljs (count title)/(subs title 0 n)
   operate on UTF-16 units, not codepoints. *)
let utf16_truncate ~max_units (s : string) : string =
  let u = U16.of_string s in
  if Array.length u > max_units then U16.to_string (U16.sub_u u 0 max_units)
  else s

(* ---- tables & triggers ---- *)

let create_blocks_table (db : Sqlite.db) =
  Sqlite.exec db ~sql:"CREATE TABLE IF NOT EXISTS blocks (
                        id TEXT NOT NULL PRIMARY KEY,
                        title TEXT NOT NULL,
                        page TEXT)" ~bind:[||]

let create_blocks_fts_table (db : Sqlite.db) =
  Sqlite.exec db
    ~sql:"CREATE VIRTUAL TABLE IF NOT EXISTS blocks_fts USING fts5(id, title, page, tokenize=\"trigram\")"
    ~bind:[||]

let create_blocks_title_index (db : Sqlite.db) =
  Sqlite.exec db
    ~sql:"CREATE INDEX IF NOT EXISTS blocks_title_nocase_idx ON blocks(title COLLATE NOCASE)"
    ~bind:[||]

let add_blocks_fts_triggers (db : Sqlite.db) =
  List.iter
    (fun sql -> Sqlite.exec db ~sql ~bind:[||])
    [ "CREATE TRIGGER IF NOT EXISTS blocks_ad AFTER DELETE ON blocks
                  BEGIN
                      DELETE from blocks_fts where id = old.id;
                  END;"
    ; "CREATE TRIGGER IF NOT EXISTS blocks_ai AFTER INSERT ON blocks
                  BEGIN
                      INSERT INTO blocks_fts (id, title, page)
                      VALUES (new.id, new.title, new.page);
                  END;"
    ; "CREATE TRIGGER IF NOT EXISTS blocks_au AFTER UPDATE ON blocks
                  BEGIN
                      DELETE from blocks_fts where id = old.id;
                      INSERT INTO blocks_fts (id, title, page)
                      VALUES (new.id, new.title, new.page);
                  END;" ]

let create_tables_and_triggers (db : Sqlite.db) =
  try
    create_blocks_table db;
    create_blocks_fts_table db;
    create_blocks_title_index db;
    add_blocks_fts_triggers db
  with exn ->
    Worker_log.error "Failed to create tables and triggers"
      [ ("error", Printexc.to_string exn) ]

let drop_tables_and_triggers (db : Sqlite.db) =
  Sqlite.exec db ~sql:"DROP TABLE IF EXISTS blocks" ~bind:[||];
  Sqlite.exec db ~sql:"DROP TABLE IF EXISTS blocks_fts" ~bind:[||];
  Sqlite.exec db ~sql:"DROP TRIGGER IF EXISTS blocks_ad" ~bind:[||];
  Sqlite.exec db ~sql:"DROP TRIGGER IF EXISTS blocks_ai" ~bind:[||];
  Sqlite.exec db ~sql:"DROP TRIGGER IF EXISTS blocks_au" ~bind:[||]

(* ---- upsert / delete / truncate ---- *)

let clj_list_to_sql ids =
  "(" ^ String.concat ", " (List.map (fun id -> "'" ^ id ^ "'") ids) ^ ")"

let upsert_blocks_batch_size = 2000

let upsert_blocks_sql row_count =
  "INSERT INTO blocks (id, title, page) VALUES "
  ^ String.concat ", " (List.init row_count (fun _ -> "(?, ?, ?)"))
  ^ " ON CONFLICT (id) DO UPDATE SET (title, page) = (excluded.title, excluded.page)"

(* search upsert/delete items — the cljs bean {:id :title :page
   :embedding :vector-title}. *)
type index_item =
  { item_id : string
  ; item_page : string
  ; item_title : string
  ; item_vector_title : string option
  ; item_embedding : float array option
  }

let mk_index_item ~id ~page ~title ?vector_title ?embedding () =
  { item_id = id; item_page = page; item_title = title
  ; item_vector_title = vector_title; item_embedding = embedding }

let valid_upsert_block (it : index_item) =
  Ldb.is_uuid_string it.item_id && Ldb.is_uuid_string it.item_page

let upsert_blocks (db : Sqlite.db) (blocks : index_item list) : unit =
  Sqlite.transaction db (fun () ->
      let rec batches = function
        | [] -> []
        | xs ->
            let rec take n acc rest =
              if n = 0 then (List.rev acc, rest)
              else match rest with
                | [] -> (List.rev acc, [])
                | x :: tl -> take (n - 1) (x :: acc) tl
            in
            let b, rest = take upsert_blocks_batch_size [] xs in
            b :: batches rest
      in
      List.iter
        (fun batch ->
           List.iter
             (fun it ->
                if not (valid_upsert_block it) then
                  failwith
                    (Printf.sprintf
                       "Search upsert-blocks wrong data: {:id %s :page %s}"
                       it.item_id it.item_page))
             batch;
           let binds =
             Array.concat
               (List.map
                  (fun it ->
                     [| Sqlite.Text it.item_id
                      ; Sqlite.Text it.item_title
                      ; Sqlite.Text it.item_page |])
                  batch)
           in
           Sqlite.exec db ~sql:(upsert_blocks_sql (List.length batch)) ~bind:binds)
        (batches blocks))

let delete_blocks (db : Sqlite.db) (ids : string list) : unit =
  Sqlite.exec db
    ~sql:("DELETE from blocks WHERE id IN " ^ clj_list_to_sql ids)
    ~bind:[||]

let truncate_table (db : Sqlite.db) : unit =
  drop_tables_and_triggers db;
  create_tables_and_triggers db;
  Sqlite.exec db ~sql:"PRAGMA user_version = 0" ~bind:[||]

(* ---- snippet / highlight ---- *)

let max_snippet_length = 250
let snippet_prefix_length = 50
let snippet_merge_distance = 200
let snippet_highlight_start = "$pfts_2lqh>$"
let snippet_highlight_end = "$<pfts_2lqh$"
let snippet_ellipsis = "\xc2\xa0\xc2\xa0\xc2\xa0...\xc2\xa0\xc2\xa0\xc2\xa0" (* NBSP...NBSP *)

let hl_start_u = U16.of_string snippet_highlight_start
let hl_end_u = U16.of_string snippet_highlight_end
let ellipsis_u = U16.of_string snippet_ellipsis

let query_boolean_operators = [ "and"; "or"; "not"; "|"; "&" ]

(* , . ; ! ? ， 。 ； ！ ？ 、 *)
let query_break_units =
  [ 0x2C; 0x2E; 0x3B; 0x21; 0x3F; 0xFF0C; 0x3002; 0xFF1B; 0xFF01; 0xFF1F; 0x3001 ]

let vector_embedding_dimension = 384
let vector_context_version = 3
let rrf_k = 60.0
let keyword_rrf_weight = 1.25
let vector_rrf_weight = 1.0
let source_score_tie_break_weight = 0.000001
let primary_title_term_match_boost = 0.004
let title_term_match_boost = 0.002
let context_term_match_boost = 0.0005
let max_vector_term_match_boost = 0.005

let split_ws (s : string) : string list =
  (* string/split on #"\s+" *)
  let re = Regexp.compile "\\s+" in
  let n = String.length s in
  let rec go pos acc =
    if pos >= n then List.rev acc
    else
      match Regexp.exec ~pos re s with
      | None -> List.rev (String.sub s pos (n - pos) :: acc)
      | Some m ->
          let acc' =
            if m.offset > pos then String.sub s pos (m.offset - pos) :: acc
            else acc
          in
          go m.last acc'
  in
  go 0 []

let query_to_terms (q : string) : string list =
  split_ws (String.trim q)
  |> List.filter (fun t -> not (is_blank t))
  |> List.filter (fun t ->
         not (List.mem (Unicode.lowercase t) query_boolean_operators))

type term_match = { term : string; idx : int; len : int; mend : int }

let overlap_match (a : term_match) (b : term_match) =
  a.idx < b.mend && b.idx < a.mend

(* works on UTF-16 units; term measured in units too *)
let find_non_overlap_term_match (text_lc : U16.t) (term : string)
    (term_u : U16.t) (selected : term_match list) : term_match option =
  let rec loop from =
    match U16.index_of text_lc term_u from with
    | None -> None
    | Some idx ->
        let m = { term; idx; len = Array.length term_u; mend = idx + Array.length term_u } in
        if List.exists (overlap_match m) selected then loop (idx + 1)
        else Some m
  in
  loop 0

let find_matches ?(descending = false) (text : string) (terms : string list) : term_match list =
  let text_lc = U16.of_string (Unicode.lowercase text) in
  let with_order = List.mapi (fun i t -> (i, t)) terms in
  let sorted =
    List.stable_sort
      (fun (i1, t1) (i2, t2) ->
        let l1 = Fz.utf16_length t1 and l2 = Fz.utf16_length t2 in
        if l1 <> l2 then compare l2 l1 else compare i1 i2)
      with_order
  in
  let selected =
    List.fold_left
      (fun sel (_, term) ->
         match find_non_overlap_term_match text_lc term
                 (U16.of_string (Unicode.lowercase term)) sel with
         | Some m -> m :: sel
         | None -> sel)
      [] sorted
  in
  List.stable_sort
    (fun a b -> if descending then compare b.idx a.idx else compare a.idx b.idx)
    selected

let find_break_before (s : U16.t) (start : int) (e : int) : int option =
  let rec loop i =
    if i < start then None
    else if List.mem (U16.char_at s i) query_break_units then Some i
    else loop (i - 1)
  in
  loop (e - 1)

let snippet_window (text : U16.t) (idx : int) (match_len : int) (window_len : int) : string =
  let text_len = Array.length text in
  let window_start = max 0 (idx - (window_len / 2)) in
  let min_end = min text_len (idx + match_len) in
  let window_end = min text_len (max min_end (window_start + window_len)) in
  let break_idx = find_break_before text window_start idx in
  let snippet_start =
    min window_end
      (max window_start (match break_idx with Some b -> b + 1 | None -> window_start))
  in
  let snippet_end = min text_len (snippet_start + window_len) in
  U16.sub_string text snippet_start (snippet_end - snippet_start)

let highlight_terms_u (text_u : U16.t) (terms : string list) (max_len : int) : string =
  let clipped = U16.sub_u text_u 0 max_len in
  (* find-matches must see the clipped *string*: cljs clips the string
     then indexes it, so work on the clipped text's own unit array. *)
  let clipped_s = U16.to_string clipped in
  let matches = find_matches ~descending:true clipped_s terms in
  List.fold_left
    (fun (acc : string) (m : term_match) ->
       let acc_u = U16.of_string acc in
       U16.sub_string acc_u 0 m.idx
       ^ snippet_highlight_start
       ^ U16.sub_string acc_u m.idx m.len
       ^ snippet_highlight_end
       ^ U16.sub_string acc_u (m.idx + m.len) (Array.length acc_u - m.idx - m.len))
    clipped_s matches

let highlight_terms (text : string) (terms : string list) (max_len : int) : string =
  highlight_terms_u (U16.of_string text) terms max_len

let enough_highlighted (text : string) (num : int) : bool =
  let text_u = U16.of_string text in
  let rec loop from cnt =
    match U16.index_of text_u hl_start_u from with
    | None -> false
    | Some idx ->
        if cnt + 1 >= num then true
        else loop (idx + Array.length hl_start_u) (cnt + 1)
  in
  loop 0 0

let strip_highlight_markers (s : string) : string =
  let rep_all (src : string) ~(pattern : string) =
    let n = String.length src and m = String.length pattern in
    let b = Buffer.create n in
    let rec go i =
      if i + m <= n && String.sub src i m = pattern then begin
        Buffer.add_string b ""; go (i + m)
      end else if i < n then begin
        Buffer.add_char b src.[i]; go (i + 1)
      end
    in
    go 0; Buffer.contents b
  in
  rep_all (rep_all s ~pattern:snippet_highlight_start) ~pattern:snippet_highlight_end

let keep_result_tail (result : string) (text : string) : bool =
  let plain = U16.of_string (strip_highlight_markers result) in
  let text_u = U16.of_string text in
  let tail =
    match U16.last_index_of plain ellipsis_u with
    | Some idx ->
        U16.sub_u plain (idx + Array.length ellipsis_u)
          (Array.length plain - idx - Array.length ellipsis_u)
    | None -> plain
  in
  U16.length tail = 0 || U16.ends_with text_u tail

(* strip leading/trailing literal "..." (cljs replace #"^(?:\.{3})|(?:\.{3})$") *)
let strip_edge_dots (s : string) : string =
  let n = String.length s in
  let i0 = if n >= 3 && String.sub s 0 3 = "..." then 3 else 0 in
  let n' = if n - i0 >= 3 && String.sub s (n - 3) 3 = "..." then n - 3 else n in
  String.sub s i0 (n' - i0)

let ensure_highlighted_snippet (snippet : string option) (title : string option)
    (q : string) : string option =
  let base = match snippet with Some s -> Some s | None -> title in
  let text = match title with Some t -> Some t | None -> snippet in
  let terms = query_to_terms q in
  let expect_highlight_num = if List.length terms > 2 then 2 else List.length terms in
  match base with
  | Some b when is_blank b -> base
  | None -> base
  | Some base_s ->
      if is_blank q then base
      else if
        enough_highlighted base_s expect_highlight_num
        && (match text with
            | Some t ->
                (match snippet with
                 | Some sn ->
                     Ns_util.str_contains t
                       (strip_edge_dots (strip_highlight_markers sn))
                 | None -> Ns_util.str_contains t "null")
            | None -> false)
      then base
      else
        let text' = Option.map strip_highlight_markers text in
        let matches =
          match text' with
          | Some t -> find_matches t terms
          | None -> []
        in
        (match text', matches with
         | Some text_s, (m1 :: _ as ms) ->
             let text_u = U16.of_string text_s in
             let prefix =
               U16.sub_string text_u 0 (min snippet_prefix_length (Array.length text_u))
             in
             let merged_window_len =
               max 0 (max_snippet_length - snippet_prefix_length - Array.length ellipsis_u)
             in
             let split_window_len =
               max 0
                 ((max_snippet_length - snippet_prefix_length - (2 * Array.length ellipsis_u))
                  / 2)
             in
             let match_terms = List.map (fun m -> m.term) ms in
             let m2 = match ms with _ :: m2 :: _ -> Some m2 | _ -> None in
             let use_window =
               Array.length text_u > max_snippet_length
               && (match m2 with Some m -> m.mend | None -> m1.mend) >= max_snippet_length
             in
             let close =
               match m2 with
               | Some m -> m.mend - m1.idx <= snippet_merge_distance
               | None -> false
             in
             let use_merge = match m2 with None -> true | Some _ -> close in
             let term2 = match m2 with Some m -> [ m.term ] | None -> [] in
             let result =
               if not use_window then highlight_terms text_s terms max_snippet_length
               else if use_merge then
                 let snip = snippet_window text_u m1.idx m1.len merged_window_len in
                 prefix ^ snippet_ellipsis
                 ^ highlight_terms snip match_terms merged_window_len
               else begin
                 let prefix_len = U16.length (U16.of_string prefix) in
                 let prefix_full_hit = m1.idx < prefix_len && m1.mend <= prefix_len in
                 let cross_prefix_hit = m1.idx < prefix_len && m1.mend > prefix_len in
                 if prefix_full_hit then
                   let snip2 =
                     match m2 with
                     | Some m -> snippet_window text_u m.idx m.len split_window_len
                     | None -> ""
                   in
                   let hp =
                     highlight_terms prefix [ m1.term ] snippet_prefix_length
                   in
                   hp ^ snippet_ellipsis ^ highlight_terms snip2 term2 split_window_len
                 else if cross_prefix_hit then
                   let prefix_for_split =
                     U16.sub_string text_u 0 (min m1.mend (Array.length text_u))
                   in
                   let cross_window_len =
                     max 0
                       (max_snippet_length
                        - U16.length (U16.of_string prefix_for_split)
                        - Array.length ellipsis_u)
                   in
                   let snip2 =
                     match m2 with
                     | Some m -> snippet_window text_u m.idx m.len cross_window_len
                     | None -> ""
                   in
                   let hp =
                     highlight_terms prefix_for_split [ m1.term ]
                       (U16.length (U16.of_string prefix_for_split))
                   in
                   hp ^ snippet_ellipsis ^ highlight_terms snip2 term2 cross_window_len
                 else
                   let snip1 = snippet_window text_u m1.idx m1.len split_window_len in
                   let snip2 =
                     match m2 with
                     | Some m -> snippet_window text_u m.idx m.len split_window_len
                     | None -> ""
                   in
                   prefix ^ snippet_ellipsis
                   ^ highlight_terms snip1 [ m1.term ] split_window_len
                   ^ snippet_ellipsis
                   ^ highlight_terms snip2 term2 split_window_len
               end
             in
             if (not (String.length result >= 3
                      && String.sub result (String.length result - 3) 3 = "..."))
                && not (keep_result_tail result text_s)
             then Some (result ^ "...")
             else Some result
         | _ -> base)

(* ---- fts match input ---- *)

let fts_phrase_input (match_input : string) : string =
  "\"" ^ (let n = String.length match_input in
          let b = Buffer.create n in
          String.iter (fun c -> if c = '"' then Buffer.add_string b "\"\"" else Buffer.add_char b c) match_input;
          Buffer.contents b) ^ "\"*"

let dangling_bool_re = Regexp.compile "(^|\\s)(AND|OR|NOT)\\s*$"
let dangling_boolean_operator (s : string) = Regexp.test dangling_bool_re s
let non_word_re = Regexp.compile "[^\\w\\s]"

let str_replace_literal src ~pattern ~replacement =
  let n = String.length src and m = String.length pattern in
  let b = Buffer.create n in
  let rec go i =
    if i + m <= n && String.sub src i m = pattern then begin
      Buffer.add_string b replacement; go (i + m)
    end else if i < n then begin
      Buffer.add_char b src.[i]; go (i + 1)
    end
  in
  go 0; Buffer.contents b

let get_match_input (q : string) : string =
  let match_input =
    q
    |> fun s -> str_replace_literal s ~pattern:" and " ~replacement:" AND "
    |> fun s -> str_replace_literal s ~pattern:" & " ~replacement:" AND "
    |> fun s -> str_replace_literal s ~pattern:" or " ~replacement:" OR "
    |> fun s -> str_replace_literal s ~pattern:" | " ~replacement:" OR "
    |> fun s -> str_replace_literal s ~pattern:" not " ~replacement:" NOT "
  in
  if dangling_boolean_operator match_input then fts_phrase_input match_input
  else if
    Regexp.test non_word_re q
    && (Ns_util.str_contains match_input "\""
        || not (List.exists (Ns_util.str_contains match_input) [ "AND"; "OR"; "NOT" ])
        || Ns_util.str_contains q "/")
  then fts_phrase_input match_input
  else if q <> match_input then
    str_replace_literal match_input ~pattern:"," ~replacement:""
  else match_input

(* ---- result record ---- *)

type result =
  { id : string
  ; page : string option
  ; title : string option
  ; snippet : string option
  ; keyword_score : float option
  ; vector_score : float option
  ; vector_title : string option
  ; rrf_score : float option (* cljs :rrf-score — set by reciprocal-rank-fusion *)
  ; block : Ev.node option  (* cljs ::block key *)
  ; combined_score : float
  }

(* cljs search-blocks option map. *)
type search_opts =
  { opt_limit : int
  ; opt_search_limit : int option
  ; opt_page : string option
  ; opt_enable_snippet : bool
  ; opt_dev : bool
  ; opt_code_only : bool
  ; opt_page_only : bool
  ; opt_built_in : bool
  ; opt_library_page_search : bool
  ; opt_include_breadcrumb : bool
  ; opt_include_matched_count : bool
  ; opt_enable_semantic_search : bool
  ; opt_query_embedding : float array option
  }

let default_opts =
  { opt_limit = 100; opt_search_limit = None; opt_page = None
  ; opt_enable_snippet = true; opt_dev = false; opt_code_only = false
  ; opt_page_only = false; opt_built_in = false
  ; opt_library_page_search = false; opt_include_breadcrumb = false
  ; opt_include_matched_count = false; opt_enable_semantic_search = false
  ; opt_query_embedding = None }

let result_of_row ~(id : string) ?page ?title ?snippet ?keyword_score
    ?vector_score ?vector_title ?rrf_score ?block ?(combined_score = 0.) () =
  { id; page; title; snippet; keyword_score; vector_score; vector_title; rrf_score
  ; block; combined_score }

let bind_text = function Sqlite.Text s -> s | _ -> ""
let bind_text_opt = function Sqlite.Text s -> Some s | _ -> None

(* ---- build-search-bind / search-blocks-aux ---- *)

let build_search_bind q input page limit use_namespace_last_part : Sqlite.bind array =
  let namespace = use_namespace_last_part && Ns_util.namespace_page (Some q) in
  let last_part =
    if namespace then
      Some (get_match_input (Ns_util.get_last_part q))
    else None
  in
  let t s = Sqlite.Text s in
  match namespace, page, last_part with
  | true, Some p, Some lp -> [| t p; t input; t lp; Sqlite.Integer (Int64.of_int limit) |]
  | _, Some p, _ -> [| t p; t input; Sqlite.Integer (Int64.of_int limit) |]
  | true, None, Some lp -> [| t input; t lp; Sqlite.Integer (Int64.of_int limit) |]
  | _ -> [| t input; Sqlite.Integer (Int64.of_int limit) |]

let search_blocks_aux ?(use_namespace_last_part = false) (db : Sqlite.db) ~sql ~q
    ~input ~page ~limit : result list =
  try
    let bind = build_search_bind q input page limit use_namespace_last_part in
    let rows = Sqlite.query db ~sql ~bind in
    List.filter_map
      (fun row ->
         match row with
         | [| id; page; title; _rank |] ->
             (match bind_text_opt title with
              | Some t ->
                  Some
                    (result_of_row ~id:(bind_text id) ?page:(bind_text_opt page)
                       ~title:t ~keyword_score:(Fz.score q t) ())
              | None -> None)
         | _ -> None)
      rows
  with exn ->
    Worker_log.error "Search blocks failed" [ ("error", Printexc.to_string exn) ];
    []

(* ---- fuzzy ---- *)

let fuzzy_search_candidate_multiplier = 4
let fuzzy_search_min_candidate_limit = 40
let fuzzy_search_max_candidate_limit = 400

let fuzzy_candidate_limit limit =
  min fuzzy_search_max_candidate_limit
    (max fuzzy_search_min_candidate_limit (fuzzy_search_candidate_multiplier * limit))

(* cljs fuzzy-like-pattern: "%" + string/join("%", map like-escape-char q) + "%" *)
let fuzzy_like_pattern (q : string) : string =
  let b = Buffer.create (String.length q * 2 + 2) in
  Buffer.add_char b '%';
  String.iter
    (fun c ->
       (match c with '%' | '_' | '\\' -> Buffer.add_char b '\\' | _ -> ());
       Buffer.add_char b c;
       Buffer.add_char b '%')
    q;
  Buffer.contents b

let exec_rows (db : Sqlite.db) ~sql ~bind = Sqlite.query db ~sql ~bind

let fuzzy_block_rows_to_results (q : string) (rows : Sqlite.row list) : result list =
  let scored =
    List.filter_map
      (fun row ->
         match row with
         | [| id; page; title |] ->
             (match bind_text_opt title with
              | Some t ->
                  let score = Fz.score q t in
                  if score > 0. then
                    Some
                      (result_of_row ~id:(bind_text id) ?page:(bind_text_opt page)
                         ~title:t ~keyword_score:score ())
                  else None
              | None -> None)
         | _ -> None)
      rows
  in
  List.stable_sort
    (fun a b ->
      let ka = (a.id <> Option.value a.page ~default:"") in
      let kb = (b.id <> Option.value b.page ~default:"") in
      if ka <> kb then compare ka kb
      else compare (Option.value b.keyword_score ~default:0.)
             (Option.value a.keyword_score ~default:0.))
    scored

let ws_re = Regexp.compile "\\s"

let multi_term_query (q : string) : bool =
  Regexp.test (Regexp.compile "\\S\\s+\\S") q

let tag_title_query (q : string) : string option =
  if String.length q > 0 && q.[0] = '#' && not (Regexp.test ws_re q) then
    let rest = String.sub q 1 (String.length q - 1) in
    if rest = "" then None else Some rest
  else None

let exact_title_query (q : string) : bool = not (Regexp.test ws_re q)

let search_blocks_exact_title_aux (db : Sqlite.db) ~q ~page ~limit : result list =
  try
    let sql =
      "select id, page, title from blocks where "
      ^ (if page <> None then "page = ? and " else "")
      ^ "title = ? COLLATE NOCASE limit ?"
    in
    let bind =
      match page with
      | Some p -> [| Sqlite.Text p; Sqlite.Text q; Sqlite.Integer (Int64.of_int limit) |]
      | None -> [| Sqlite.Text q; Sqlite.Integer (Int64.of_int limit) |]
    in
    fuzzy_block_rows_to_results q (exec_rows db ~sql ~bind)
  with exn ->
    Worker_log.error "Exact title search blocks failed"
      [ ("error", Printexc.to_string exn) ];
    []

let search_blocks_fuzzy_aux (db : Sqlite.db) ~(q : string) ~page ~limit : result list =
  let q' = Fz.clean_str (Fz.search_normalize true q) in
  let q' =
    if String.length q' > 0 && q'.[0] = '#' then String.sub q' 1 (String.length q' - 1)
    else q'
  in
  if is_blank q' then []
  else
    try
      let candidate_limit = fuzzy_candidate_limit limit in
      let pattern = fuzzy_like_pattern q' in
      let rows =
        match page with
        | Some p ->
            exec_rows db
              ~sql:"select id, page, title from blocks where page = ? and lower(title) like ? escape '\\' limit ?"
              ~bind:[| Sqlite.Text p; Sqlite.Text pattern
                     ; Sqlite.Integer (Int64.of_int candidate_limit) |]
        | None ->
            let page_blocks =
              exec_rows db
                ~sql:"select id, page, title from blocks where id = page and lower(title) like ? escape '\\' limit ?"
                ~bind:[| Sqlite.Text pattern; Sqlite.Integer (Int64.of_int candidate_limit) |]
            in
            let page_ids =
              List.fold_left
                (fun s row -> match row with
                   | [| Sqlite.Text id; _; _ |] -> id :: s
                   | _ -> s)
                [] page_blocks
            in
            let remaining = candidate_limit - List.length page_blocks in
            if remaining > 0 then
              let block_candidates =
                exec_rows db
                  ~sql:"select id, page, title from blocks where lower(title) like ? escape '\\' limit ?"
                  ~bind:[| Sqlite.Text pattern
                         ; Sqlite.Integer
                             (Int64.of_int (remaining + List.length page_blocks)) |]
                |> List.filter (fun row ->
                       match row with
                       | [| Sqlite.Text id; _; _ |] -> not (List.mem id page_ids)
                       | _ -> false)
              in
              let rec take n = function
                | [] -> []
                | _ when n <= 0 -> []
                | x :: tl -> x :: take (n - 1) tl
              in
              page_blocks @ take remaining block_candidates
            else page_blocks
      in
      fuzzy_block_rows_to_results q' rows
    with exn ->
      Worker_log.error "Fuzzy search blocks failed"
        [ ("error", Printexc.to_string exn) ];
      []

(* ---- entity predicates ---- *)

let hidden_search_node (n : Ev.node) : bool =
  if Ev.is_property n then
    (match Ev.value n "logseq.property/deleted-at" with Some _ -> true | None -> false)
    || (Ev.built_in n && Ev.private_built_in_page n)
  else Ev.hidden n

let hidden_entity (n : Ev.node) : bool =
  hidden_search_node n
  ||
  (match Ev.ref_node n "block/page" with
   | Some page ->
       Ev.hidden page
       && Ev.title page <> Some "Quick add"
   | None -> false)

let page_or_object (n : Ev.node) : bool =
  (Ev.is_page n || Ev.object_ n) && not (hidden_entity n)

let sanitize (content : string) : string =
  Fz.search_normalize ~lower_case:false true content

(* ---- recur-replace-uuid-in-block-title on nodes ----
   Same as Db_content but operates on Entity_view nodes and accepts the
   (possibly overridden) title — cljs assocs :block/title before calling. *)

let id_or_tag_ref_re =
  Regexp.compile
    "(#?)\\[\\[([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\\]\\]"

let title_ref_replacement id_to_title ~match_ ~groups ~offset:_ ~input:_ =
  (* spec regexp groups: groups.(0) is the whole match, captures start at 1 *)
  let hash_prefix = match groups.(1) with Some s -> s | None -> "" in
  let id = match groups.(2) with Some s -> s | None -> "" in
  match List.assoc_opt (String.lowercase_ascii id) id_to_title with
  | Some ref_title ->
      if hash_prefix = "#" && not (String.contains ref_title ' ') then
        "#" ^ ref_title
      else hash_prefix ^ "[[" ^ ref_title ^ "]]"
  | None -> match_

let replace_title_refs_once content id_to_title =
  Regexp.replace_all id_or_tag_ref_re ~f:(title_ref_replacement id_to_title) content

let node_ref_title_entry ~replace_block_refs (r : Ev.node) =
  match Ev.uuid r, Ev.title r with
  | Some u, Some t when replace_block_refs || Ev.is_page r ->
      Some (String.lowercase_ascii u, t)
  | _ -> None

let node_block_ref_id_to_title (ent : Ev.node) max_depth replace_block_refs =
  let rec loop frontier seen acc depth =
    if depth >= max_depth || frontier = [] then acc
    else begin
      let new_refs =
        List.filter
          (fun n ->
             match Ev.uuid n with
             | Some u -> not (List.mem (String.lowercase_ascii u) seen)
             | None -> false)
          frontier
      in
      let seen' =
        seen @ List.filter_map (fun n ->
            Option.map String.lowercase_ascii (Ev.uuid n)) new_refs
      in
      let acc' =
        acc @ List.filter_map (node_ref_title_entry ~replace_block_refs) new_refs
      in
      let next = List.concat_map (fun n -> Ev.ref_nodes n "block/refs") new_refs in
      loop next seen' acc' (depth + 1)
    end
  in
  loop (Ev.ref_nodes ent "block/refs") [] [] 0

let recur_replace_title ?(max_depth = 10) ?(replace_block_refs = true)
    (block : Ev.node) (title : string) : string =
  if not (Regexp.test id_or_tag_ref_re title) then title
  else
    let id_to_title =
      node_block_ref_id_to_title block max_depth replace_block_refs
    in
    let rec loop result depth =
      if depth >= max_depth || not (Regexp.test id_or_tag_ref_re result) then result
      else begin
        let next = replace_title_refs_once result id_to_title in
        if next = result then result else loop next (depth + 1)
      end
    in
    loop title 0

let recur_replace_uuid_in_block_title ?max_depth ?replace_block_refs
    (block : Ev.node) : string option =
  match Ev.title block with
  | Some t -> Some (recur_replace_title ?max_depth ?replace_block_refs block t)
  | None -> None

(* ---- block->index ---- *)

let block_search_title (block : Ev.node) : string option =
  let title = Ev.get_title_with_parents block in
  let title =
    match title with
    | Some t -> Some (recur_replace_title block t)
    | None -> None
  in
  let title =
    match title, Ev.is_journal block, Ev.int_value block "block/journal-day" with
    | Some t, true, Some day -> Some (t ^ " " ^ string_of_int day)
    | _ -> title
  in
  match title with
  | Some t when page_or_object block ->
      let aliases =
        List.filter_map Ev.title (Ev.ref_nodes block "block/alias")
      in
      let all =
        List.fold_left
          (fun acc s -> if is_blank s || List.mem s acc then acc else acc @ [ s ])
          [] (t :: aliases)
      in
      Some (String.concat " " all)
  | other -> other

let block_result_title (block : Ev.node) : string option =
  recur_replace_uuid_in_block_title block

(* alias payload: (uuid, title option) — cljs select-keys keeps the
   map even when :block/title is absent. *)
let matched_alias (q : string) (block : Ev.node) : (string * string option) option =
  if is_blank q then None
  else
    let q' = Unicode.lowercase q in
    (match
       Ev.ref_nodes block "block/alias"
       |> List.find_opt (fun a ->
              match Ev.title a with
              | Some t -> Ns_util.str_contains (Unicode.lowercase t) q'
              | None -> false)
     with
     | Some a ->
         (match Ev.uuid a with
          | Some u -> Some (u, Ev.title a)
          | None -> None)
     | None -> None)

let block_to_index ?(include_vector_title = false) (block : Ev.node) : index_item option =
  let uuid = Ev.uuid block in
  let title_raw = Ev.title block in
  if Ev.closed_value block
     || (match title_raw with Some t when Fz.utf16_length t > 10000 -> true | _ -> false)
     || is_blank_opt title_raw
  then None
  else
    try
      let title = block_search_title block in
      match uuid with
      | Some u ->
          let page_uuid =
            match Ev.ref_node block "block/page" with
            | Some p -> (match Ev.uuid p with Some pu -> pu | None -> u)
            | None -> u
          in
          Some
            (mk_index_item ~id:u ~page:page_uuid
               ~title:(sanitize (Option.value title ~default:""))
               ?vector_title:(if include_vector_title then title else None)
               ())
      | None -> None
    with exn ->
      Worker_log.error "Error: failed to run block->index on block"
        [ ("db/id", string_of_int (Option.value (Ev.db_id block) ~default:(-1)))
        ; ("error", Printexc.to_string exn) ];
      None

(* ---- pull search-result blocks ---- *)

let search_result_pull_selector =
  "[:db/id :block/uuid :block/title {:block/page [:block/uuid :block/name :block/title]} {:block/parent [:db/id :block/uuid :block/title :logseq.property/built-in? :logseq.property/hide? :logseq.property/deleted-at]} {:block/tags [:db/id :db/ident :block/title :logseq.property/icon]} {:block/alias [:block/uuid :block/title]} {:block/_alias [:block/uuid :block/title]} :logseq.property/icon :logseq.property.node/display-type :logseq.property/hide? :logseq.property/deleted-at :logseq.property/built-in?]"

let pull_search_result_blocks (db : db) (results : result list) :
    (string, Ev.node) Hashtbl.t =
  let lookup_refs =
    List.map (fun r -> Lookup_ref ("block/uuid", Uuid r.id)) results
  in
  let tbl = Hashtbl.create (max 7 (List.length lookup_refs)) in
  (match lookup_refs with
   | [] -> ()
   | refs ->
       List.iter
         (fun p ->
            match p with
            | Some pe ->
                (match
                   List.assoc_opt (Keyword "block/uuid") pe.pulled_attrs
                 with
                 | Some (Pulled_scalar (Uuid u)) ->
                     Hashtbl.replace tbl u (Ev.of_pulled pe)
                 | _ -> ())
            | None -> ())
         (pull_many_string db search_result_pull_selector refs));
  tbl

(* ---- merge / unique / RRF ---- *)

let merge_search_result (l : result) (r : result) : result =
  (* cljs (merge left right {...}) — right wins for plain keys *)
  let pick a b = match b with Some _ -> b | None -> a in
  let merge_score a b =
    match a, b with
    | Some x, Some y -> Some (max x y)
    | _, Some y -> Some y
    | x, None -> x
  in
  { id = r.id
  ; page = pick l.page r.page
  ; title = pick l.title r.title
  ; snippet = pick l.snippet r.snippet
  ; keyword_score = merge_score l.keyword_score r.keyword_score
  ; vector_score = merge_score l.vector_score r.vector_score
  ; vector_title = pick l.vector_title r.vector_title
  ; rrf_score = pick l.rrf_score r.rrf_score
  ; block = pick l.block r.block
  ; combined_score = max l.combined_score r.combined_score
  }

let unique_search_results (results : result list) : result list =
  let order = ref [] in
  let by_id = Hashtbl.create 17 in
  List.iter
    (fun r ->
       if not (Hashtbl.mem by_id r.id) then order := r.id :: !order;
       (match Hashtbl.find_opt by_id r.id with
        | Some prev -> Hashtbl.replace by_id r.id (merge_search_result prev r)
        | None -> Hashtbl.replace by_id r.id r))
    results;
  List.filter_map
    (fun id -> Hashtbl.find_opt by_id id)
    (List.rev !order)

let rrf_score_by_id (result_lists : result list list) (weights : float list) :
    (string, float) Hashtbl.t =
  let scores = Hashtbl.create 17 in
  List.iteri
    (fun li results ->
       let weight = match List.nth_opt weights li with Some w -> w | None -> 1.0 in
       List.iteri
         (fun rank r ->
            let cur = Option.value (Hashtbl.find_opt scores r.id) ~default:0. in
            Hashtbl.replace scores r.id
              (cur +. (weight /. (rrf_k +. float_of_int rank +. 1.))))
         results)
    result_lists;
  scores

let reciprocal_rank_fusion ?(weights = []) (result_lists : result list list) : result list =
  let tbl : (string, result * float * int) Hashtbl.t = Hashtbl.create 17 in
  List.iteri
    (fun li results ->
       let weight = match List.nth_opt weights li with Some w -> w | None -> 1.0 in
       List.iteri
         (fun rank r ->
            let cur = Hashtbl.find_opt tbl r.id in
            let res, score, top_rank =
              match cur with
              | Some (res, s, tr) -> (res, s, tr)
              | None -> (r, 0., max_int)
            in
            Hashtbl.replace tbl r.id
              (res, score +. (weight /. (rrf_k +. float_of_int rank +. 1.)),
               min top_rank rank))
         results)
    result_lists;
  Hashtbl.fold (fun _ (res, score, tr) acc -> (res, score, tr) :: acc) tbl []
  |> List.stable_sort (fun (r1, s1, t1) (r2, s2, t2) ->
         if s1 <> s2 then compare s2 s1
         else if t1 <> t2 then compare t1 t2
         else compare r1.id r2.id)
  |> List.map (fun (res, score, _) -> { res with rrf_score = Some score })

let matched_term_set (text : string option) (terms : string list) : string list =
  match text with
  | Some t when not (is_blank t) ->
      List.map (fun m -> Unicode.lowercase m.term) (find_matches t terms)
      |> List.sort_uniq compare
  | _ -> []

let vector_term_match_score (q : string) (r : result) (block : Ev.node) : float =
  if is_blank q || r.vector_score = None then 0.
  else begin
    let terms = query_to_terms q in
    let title_matches =
      matched_term_set
        (match r.title with Some t -> Some t | None -> Ev.title block)
        terms
    in
    let context_matches = matched_term_set r.vector_title terms in
    let score =
      List.mapi
        (fun idx term ->
           let term = Unicode.lowercase term in
           if List.mem term title_matches then
             if idx = 0 then primary_title_term_match_boost
             else title_term_match_boost
           else if List.mem term context_matches then context_term_match_boost
           else 0.)
        terms
      |> List.fold_left ( +. ) 0.
    in
    min max_vector_term_match_boost score
  end

(* ---- combine-results ---- *)

let combine_results ?(vector_results = []) ?(q = "") (db : db)
    (keyword_results : result list) : result list =
  let use_rrf = vector_results <> [] in
  let fused =
    if use_rrf then
      Some
        (rrf_score_by_id
           [ keyword_results; vector_results ]
           [ keyword_rrf_weight; vector_rrf_weight ])
    else None
  in
  let unique = unique_search_results (keyword_results @ vector_results) in
  let block_by_id = pull_search_result_blocks db unique in
  (* cljs (hidden-entity? nil) / (ldb/page? nil) are all false — a result
     whose block failed to pull keeps ::block nil and flows through. *)
  let merged =
    List.filter_map
      (fun r ->
         let block = Hashtbl.find_opt block_by_id r.id in
         let hidden = match block with Some b -> hidden_entity b | None -> false in
         if hidden then None
         else begin
           let is_page = match block with Some b -> Ev.is_page b | None -> false in
           let keyword_score =
             (match r.keyword_score with Some s -> s | None -> 0.)
             +. (if is_page then 2. else 0.)
           in
           let vector_score = Option.value r.vector_score ~default:0. in
           let base_score =
             match fused with
             | Some m -> Option.value (Hashtbl.find_opt m r.id) ~default:0.
             | None -> keyword_score
           in
           let vector_match =
             match block with
             | Some b when use_rrf -> vector_term_match_score q r b
             | _ -> 0.
           in
           let combined =
             base_score
             +. vector_match
             +. source_score_tie_break_weight *. (keyword_score +. vector_score)
             +. if use_rrf then 0.
                else if is_page then 0.02
                else (match block with
                      | Some b when Ev.value b "block/tags" <> None -> 0.01
                      | _ -> 0.)
           in
           Some
             { r with
               block
             ; title =
                 (match r.title with
                  | Some t -> Some t
                  | None -> (match block with Some b -> Ev.title b | None -> None))
             ; combined_score = combined
             ; keyword_score = Some keyword_score
             }
         end)
      unique
  in
  List.stable_sort
    (fun a b -> compare b.combined_score a.combined_score)
    merged

(* ---- include-search-block? / result conversion ---- *)

let code_block (code_class : entity option) (block : Ev.node) : bool =
  (not (Ev.is_page block))
  && ((match Ev.keyword_value block "logseq.property.node/display-type" with
       | Some "code" -> true
       | _ -> false)
      || (match code_class with
          | Some cc -> Ev.class_instance (Ev.of_entity cc) block
          | None -> false))

let include_search_block ~(conn : conn) (block : Ev.node)
    ~(code_class : entity option)
    ~(library_page_search : bool) ~(page_only : bool) ~(dev : bool)
    ~(built_in : bool) ~(code_only : bool) : bool =
  (not
     ((library_page_search
       && (Ev.page_in_library (Datascript.db conn) block
           || not (Ev.internal_page block)))
      || (page_only && not (Ev.is_page block))))
  && (if dev then true
      else if built_in then
        (not (Ev.built_in block))
        || (not (Ev.private_built_in_page block))
        || Ev.is_class block
      else not (Ev.built_in block))
  && ((not code_only) || code_block code_class block)

let distinct_by (f : 'a -> string) (xs : 'a list) : 'a list =
  let seen = Hashtbl.create 17 in
  List.filter
    (fun x ->
       let k = f x in
       if Hashtbl.mem seen k then false else (Hashtbl.replace seen k (); true))
    xs

type block_result = (string * value) list

let search_result_to_block_result ~(conn : conn) ~(q : string)
    ~(code_class : entity option) ~opts
    (r : result) : block_result option =
  let db = Datascript.db conn in
  let block_id = r.id in
  let block =
    match r.block with
    | Some b -> Some b
    | None ->
        (match Datascript.entity db (Lookup_ref ("block/uuid", Uuid block_id)) with
         | Some e -> Some (Ev.of_entity e)
         | None -> None)
  in
  match block with
  | None -> None
  | Some block ->
      if
        not
          (include_search_block ~conn block ~code_class
             ~library_page_search:opts.opt_library_page_search
             ~page_only:opts.opt_page_only ~dev:opts.opt_dev
             ~built_in:opts.opt_built_in ~code_only:opts.opt_code_only)
      then None
      else begin
        let alias_source =
          match List.nth_opt (Ev.ref_nodes block "block/_alias") 0 with
          | Some a ->
              (match Ev.uuid a with
               | Some u -> Some (u, Ev.title a)
               | None -> None)
          | None -> None
        in
        let alias_match = matched_alias q block in
        let page_or_obj = page_or_object block in
        let result_title =
          if page_or_obj then block_result_title block
          else match r.title with Some t -> Some t | None -> Ev.title block
        in
        let display_title =
          if opts.opt_enable_snippet then
            ensure_highlighted_snippet r.snippet result_title q
          else if page_or_obj then result_title
          else match r.snippet with Some s -> Some s | None -> result_title
        in
        let block_page =
          match Ev.ref_node block "block/page" with
          | Some p -> Ev.uuid p
          | None ->
              (match r.page with
               | Some p when Ldb.is_uuid_string p -> Some p
               | _ -> None)
        in
        let parent_id =
          match Ev.ref_node block "block/parent" with
          | Some p -> Ev.db_id p
          | None -> None
        in
        let tags =
          Ev.ref_nodes block "block/tags"
          |> List.map (fun t ->
                 [ Some ("db/id", Int (Option.value (Ev.db_id t) ~default:0))
                 ; (match Ev.ident t with
                    | Some i -> Some ("db/ident", Keyword i)
                    | None -> None)
                 ; (match Ev.title t with
                    | Some s -> Some ("block/title", String s)
                    | None -> None)
                 ; (match Ev.value t "logseq.property/icon" with
                    | Some v -> Some ("logseq.property/icon", v)
                    | None -> None) ]
                 |> List.filter_map Fun.id)
          |> List.map (fun pairs ->
                 Map (List.map (fun (a, v) -> (Keyword a, v)) pairs))
        in
        let icon = Ev.value block "logseq.property/icon" in
        let alias = match alias_source with Some a -> Some a | None -> alias_match in
        let unique_title =
          Db_block_title.block_unique_title ~truncate:false
            ?alias:(match alias with Some (_, t) -> t | None -> None)
            ?display_title:display_title
            (Some db) block
        in
        let base =
          [ ("db/id", Int (Option.value (Ev.db_id block) ~default:0))
          ; ("block/uuid",
             (match Ev.uuid block with Some u -> Uuid u | None -> String ""))
          ; ("block/title",
             (match display_title with Some s -> String s | None -> String ""))
          ; ("block.temp/original-title",
             (match Ev.title block with Some s -> String s | None -> Nil))
          ; ("block.temp/unique-title",
             (match unique_title with Some s -> String s | None -> Nil))
          ; ("page?", Bool (Ev.is_page block)) ]
        in
        Some
          (base
           @ (if opts.opt_include_breadcrumb then
             [ ("block.temp/breadcrumb",
                List
                  (List.map
                     (fun crumbs ->
                        Map (List.map (fun (a, v) -> (Keyword a, v)) crumbs))
                     (Bb.block_breadcrumb db block))) ]
           else [])
        @ (match block_page with Some p -> [ ("block/page", Uuid p) ] | None -> [])
        @ (match parent_id with Some i -> [ ("block/parent", Int i) ] | None -> [])
        @ (match tags with [] -> [] | ts -> [ ("block/tags", List ts) ])
        @ (match icon with Some v -> [ ("logseq.property/icon", v) ] | None -> [])
        @ (match alias with
           | Some (u, t) ->
               [ ("alias",
                  Map
                    ([ (Keyword "block/uuid", Uuid u) ]
                     @ (match t with
                        | Some t -> [ (Keyword "block/title", String t) ]
                        | None -> []))) ]
           | None -> []))
      end

let search_result_visible ~(conn : conn) ~(code_class : entity option) ~opts
    (r : result) : bool =
  let block =
    match r.block with
    | Some b -> Some b
    | None ->
        (match
           Datascript.entity (Datascript.db conn)
             (Lookup_ref ("block/uuid", Uuid r.id))
         with
         | Some e -> Some (Ev.of_entity e)
         | None -> None)
  in
  match block with
  | None -> false
  | Some b ->
      include_search_block ~conn b ~code_class
        ~library_page_search:opts.opt_library_page_search
        ~page_only:opts.opt_page_only ~dev:opts.opt_dev ~built_in:opts.opt_built_in
        ~code_only:opts.opt_code_only

(* ---- vector search ---- *)

let max_vector_search_results = 10
let min_vector_search_score = 0.5
let vector_upsert_batch_size = 1024

let vector_search_blocks (vector_index : Vector_index.index) ~(limit : int)
    ~(page : string option) ~(query_embedding : float array option) : result list =
  match query_embedding with
  | Some emb when Array.length emb > 0 ->
      let limit' = min max_vector_search_results limit in
      Vector_index.query vector_index ~embedding:emb ~limit:limit' ~page
      |> List.filter_map
           (fun (qr : Vector_index.query_result) ->
              if qr.vector_score > min_vector_search_score then
                Some
                  (result_of_row ~id:qr.id ?page:qr.page
                     ~vector_score:qr.vector_score ?vector_title:qr.vector_title
                     ())
              else None)
      |> List.filteri (fun i _ -> i < limit')
  | _ -> []

(* ---- upsert/delete/truncate vector ---- *)

let upsert_vector_blocks (vector_index : Vector_index.index)
    (blocks : index_item list) : unit =
  let docs =
    List.filter_map
      (fun it ->
         match it.item_embedding with
         | Some emb when Array.length emb > 0 ->
             Some
               { Vector_index.id = it.item_id
               ; page = it.item_page
               ; embedding = emb
               ; vector_title = it.item_vector_title
               }
         | _ -> None)
      blocks
  in
  if docs <> [] then begin
    let rec batches = function
      | [] -> []
      | xs ->
          let rec take n acc rest =
            if n = 0 then (List.rev acc, rest)
            else match rest with [] -> (List.rev acc, []) | x :: tl -> take (n - 1) (x :: acc) tl
          in
          let b, rest = take vector_upsert_batch_size [] xs in
          b :: batches rest
    in
    List.iter (fun b -> Vector_index.upsert vector_index b) (batches docs)
  end

let delete_vector_blocks (vector_index : Vector_index.index option) (ids : string list) =
  match vector_index with
  | Some i when ids <> [] -> Vector_index.delete i ids
  | _ -> ()

let truncate_vector_index (vector_index : Vector_index.index option) =
  match vector_index with Some i -> Vector_index.truncate i | None -> ()

(* ---- build index ---- *)

let get_all_blocks (db : db) : entity list =
  datoms db Avet ~a:"block/uuid" ()
  |> Seq.filter_map (fun (d : datom) ->
         match d.v with
         | Uuid u -> entity db (Lookup_ref ("block/uuid", Uuid u))
         | _ -> None)
  |> List.of_seq
  |> List.filter (fun e -> not (hidden_entity (Ev.of_entity e)))

let build_blocks_indice ?(include_vector_title = false) (db : db) : index_item list =
  List.filter_map
    (fun e -> block_to_index ~include_vector_title (Ev.of_entity e))
    (get_all_blocks db)

(* ---- tx-report diff (get-affected-blocks / sync-search-indice) ---- *)

let page_descendants (page : entity) : entity list =
  let rec loop (pages : entity list) (result : entity list) =
    match pages with
    | [] -> result
    | p :: rest ->
        let children =
          Ldb.ref_ents p "block/_parent"
          |> List.filter Ldb.is_page
          |> Ldb.sort_by_order
        in
        loop (rest @ children) (result @ [ p ])
  in
  loop [ page ] []

let page_tree (db : db) (page : entity) : entity list =
  page_descendants page
  |> List.concat_map (fun p ->
         p
         :: List.concat_map
              (fun b ->
                 match Ldb.value b "block/uuid" with
                 | Some (Uuid u) -> Ldb.get_block_and_children db u
                 | _ -> [])
              (Ldb.sort_by_order (Ldb.ref_ents p "block/_page")))
  |> List.fold_left
       (fun acc (e : entity) ->
          if List.exists (fun (x : entity) -> x.id = e.id) acc then acc else acc @ [ e ])
       []

let entity_tree (db : db) (e : entity) : entity list =
  if Ldb.is_page e then page_tree db e
  else
    match Ldb.value e "block/uuid" with
    | Some (Uuid u) -> Ldb.get_block_and_children db u
    | _ -> [ e ]

let referrer_eids (db : db) (eids : entity_id list) : entity_id list =
  List.concat_map
    (fun id ->
       match Ldb.ent_of_id db id with
       | Some e ->
           List.map (fun (r : entity) -> r.id)
             (Ldb.ref_ents e "block/_refs" @ Ldb.ref_ents e "block/_alias")
       | None -> [])
    eids

let entities_for (db : db) (eids : entity_id list) : entity list =
  List.fold_left
    (fun acc id ->
       match Ldb.ent_of_id db id with
       | Some e when not (List.exists (fun (x : entity) -> x.id = e.id) acc) -> acc @ [ e ]
       | _ -> acc)
    [] eids

let eids_of (ents : entity list) = List.map (fun (e : entity) -> e.id) ents

let get_affected_blocks (r : tx_report) : (entity list * entity list) option =
  let watch_attrs =
    [ "block/uuid"; "block/name"; "block/title"; "block/properties"
    ; "block/alias"; "block/parent"; "block/page"; "block/order"
    ; "logseq.property/deleted-at" ]
  in
  let datoms' =
    List.filter (fun (d : datom) -> List.mem d.a watch_attrs) r.tx_data
  in
  if datoms' = [] then None
  else begin
    let ref_affecting =
      [ "block/uuid"; "block/name"; "block/title"; "block/properties"; "block/alias" ]
    in
    let direct_vis = [ "block/parent"; "block/page"; "block/order" ] in
    let ref_eids =
      List.concat_map
        (fun (d : datom) ->
           if List.mem d.a ref_affecting then
             d.e :: (match d.v, d.a = "block/alias" with
                     | (Ref v | Int v), true -> [ v ]
                     | _ -> [])
           else [])
        datoms'
    in
    let direct_visibility_eids =
      List.filter_map
        (fun (d : datom) -> if List.mem d.a direct_vis then Some d.e else None)
        datoms'
    in
    let block_page_eids =
      List.filter_map
        (fun (d : datom) -> if d.a = "block/page" then Some d.e else None)
        datoms'
    in
    let page_hierarchy_eids =
      List.filter_map
        (fun (d : datom) ->
           if List.mem d.a [ "block/parent"; "block/page" ]
              && not (List.mem d.e block_page_eids)
           then Some d.e
           else None)
        datoms'
    in
    let uniq = List.sort_uniq compare in
    let page_eids_for db eids =
      uniq
        (List.filter_map
           (fun id ->
              match Ldb.ent_of_id db id with
              | Some e when Ldb.is_page e -> Some e.id
              | _ -> None)
           eids)
    in
    let page_descendant_eids_for db eids =
      uniq
        (List.concat_map
           (fun id ->
              match Ldb.ent_of_id db id with
              | Some e -> eids_of (page_descendants e)
              | None -> [])
           eids)
    in
    let entity_tree_eids db eids =
      uniq
        (List.concat_map
           (fun id ->
              match Ldb.ent_of_id db id with
              | Some e -> eids_of (entity_tree db e)
              | None -> [])
           eids)
    in
    let hidden_status_changed =
      List.filter
        (fun id ->
           let hid db =
             match Ldb.ent_of_id db id with
             | Some e -> hidden_entity (Ev.of_entity e)
             | None -> false
           in
           hid r.db_before <> hid r.db_after)
        direct_visibility_eids
    in
    let deleted_eids =
      List.filter_map
        (fun (d : datom) ->
           if d.a = "logseq.property/deleted-at" then Some d.e else None)
        datoms'
    in
    let ref_eids = uniq ref_eids in
    let direct_visibility_eids = uniq direct_visibility_eids in
    let deleted_eids = uniq deleted_eids in
    let ph_before = page_eids_for r.db_before (uniq page_hierarchy_eids) in
    let ph_after = page_eids_for r.db_after (uniq page_hierarchy_eids) in
    let hidden_changed = uniq hidden_status_changed in
    let referrers_before = uniq (referrer_eids r.db_before ref_eids) in
    let referrers_after = uniq (referrer_eids r.db_after ref_eids) in
    let union a b = uniq (a @ b) in
    let remove_eids =
      List.fold_left union ref_eids
        [ referrers_before
        ; direct_visibility_eids
        ; entity_tree_eids r.db_before hidden_changed
        ; page_descendant_eids_for r.db_before ph_before
        ; entity_tree_eids r.db_before deleted_eids ]
    in
    let add_eids =
      List.fold_left union ref_eids
        [ referrers_before
        ; referrers_after
        ; direct_visibility_eids
        ; entity_tree_eids r.db_after hidden_changed
        ; page_descendant_eids_for r.db_after ph_after
        ; entity_tree_eids r.db_after deleted_eids ]
    in
    Some
      ( entities_for r.db_before remove_eids
      , List.filter
          (fun e -> not (hidden_entity (Ev.of_entity e)))
          (entities_for r.db_after add_eids) )
  end

type sync_indice_result =
  { blocks_to_remove : string list
  ; blocks_to_add : index_item list
  }

let sync_search_indice ?(include_vector_title = false) (r : tx_report) :
    sync_indice_result option =
  match get_affected_blocks r with
  | None -> None
  | Some (to_remove, to_add) ->
      if to_remove = [] && to_add = [] then None
      else begin
        let add =
          List.filter_map
            (fun e -> block_to_index ~include_vector_title (Ev.of_entity e))
            to_add
        in
        let added_uuids =
          List.filter_map
            (fun (e : entity) ->
               match Ldb.value e "block/uuid" with Some (Uuid u) -> Some u | _ -> None)
            to_add
        in
        let indexed_uuids = List.map (fun it -> it.item_id) add in
        let removed_uuids =
          List.filter_map
            (fun (e : entity) ->
               match Ldb.value e "block/uuid" with Some (Uuid u) -> Some u | _ -> None)
            to_remove
        in
        let dropped =
          List.filter (fun u -> not (List.mem u indexed_uuids)) added_uuids
        in
        Some
          { blocks_to_remove = List.sort_uniq compare (removed_uuids @ dropped)
          ; blocks_to_add = add
          }
      end

(* ---- search-blocks (top-level) ---- *)

type search_outcome =
  | Rows of block_result list
  | Rows_with_count of block_result list * int

let ws_plus_re = Regexp.compile "\\s+"

let ws_to_pct s =
  Regexp.replace_all ws_plus_re
    ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> "%")
    s

let rec take n = function
  | [] -> []
  | _ when n <= 0 -> []
  | x :: tl -> x :: take (n - 1) tl

let search_blocks ~(conn : conn) ~(search_db : Sqlite.db option)
    ~(vector_index : Vector_index.index option) ~(q0 : string) ~(opts : search_opts)
    : search_outcome =
  let db_ctx = Datascript.db conn in
  let tag_q = tag_title_query q0 in
  let tag_title = tag_q <> None in
  let q = Option.value tag_q ~default:q0 in
  if is_blank q then Rows []
  else begin
    let db =
      match search_db with
      | Some d -> d
      | None -> failwith "search-blocks: search db missing"
    in
    let match_input = get_match_input q in
    let non_match_input =
      if String.length q <= 2 then Some ("%" ^ ws_to_pct q ^ "%") else None
    in
    let limit = opts.opt_limit in
    let limit_p = Option.value opts.opt_search_limit ~default:limit in
    let exact_title_result =
      if (not opts.opt_page_only) && exact_title_query q then
        search_blocks_exact_title_aux db ~q ~page:opts.opt_page ~limit:limit_p
      else []
    in
    let enough_exact_title = List.length exact_title_result >= limit_p in
    let select = "select id, page, title, rank from blocks_fts where " in
    let pg_sql = if opts.opt_page <> None then "page = ? and" else "" in
    let match_sql =
      if Ns_util.namespace_page (Some q) then
        select ^ pg_sql ^ " title match ? or title match ? limit ?"
      else select ^ pg_sql ^ " title match ? limit ?"
    in
    let non_match_sql = select ^ pg_sql ^ " title like ? limit ?" in
    let matched_result =
      if (not opts.opt_page_only) && (not tag_title) && (not enough_exact_title)
      then
        search_blocks_aux db ~sql:match_sql ~q ~input:match_input ~page:opts.opt_page
          ~limit:limit_p ~use_namespace_last_part:(Ns_util.namespace_page (Some q))
      else []
    in
    let non_match_result =
      match non_match_input with
      | Some input when (not opts.opt_page_only) && (not tag_title) ->
          search_blocks_aux db ~sql:non_match_sql ~q ~input ~page:opts.opt_page
            ~limit:limit_p
          |> List.map (fun r ->
                 { r with
                   keyword_score =
                     Some (Fz.score q (Option.value r.title ~default:"")) })
      | _ -> []
    in
    let skip_fuzzy =
      enough_exact_title || tag_title
      || (multi_term_query q && matched_result <> [])
    in
    let fuzzy_result =
      if skip_fuzzy then []
      else search_blocks_fuzzy_aux db ~q ~page:opts.opt_page ~limit
    in
    let vector_result =
      match vector_index, opts.opt_page_only, opts.opt_enable_semantic_search with
      | Some vi, false, true ->
          vector_search_blocks vi ~limit:limit_p ~page:opts.opt_page
            ~query_embedding:opts.opt_query_embedding
      | _ -> []
    in
    let combined =
      combine_results ~vector_results:vector_result ~q db_ctx
        (exact_title_result @ fuzzy_result @ matched_result @ non_match_result)
    in
    let code_class =
      if opts.opt_code_only then
        Datascript.entity db_ctx (Ident "logseq.class/Code-block")
      else None
    in
    let matched_count0 =
      if opts.opt_include_matched_count then
        List.length
          (List.filter
             (fun r -> search_result_visible ~conn ~code_class ~opts r)
             combined)
      else 0
    in
    let results =
      combined
      |> distinct_by (fun r -> r.id)
      |> List.filter_map (search_result_to_block_result ~conn ~q ~code_class ~opts)
      |> List.filter (fun br -> br <> [])
      |> distinct_by (fun br ->
             match List.assoc_opt "block/uuid" br with
             | Some (Uuid u) -> u
             | _ -> "")
    in
    let matched_count = max matched_count0 (List.length results) in
    if opts.opt_include_matched_count then
      Rows_with_count (take limit results, matched_count)
    else Rows (take limit results)
  end
