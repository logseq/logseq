(* frontend.handler.export.common-impl — shared helpers for the
   block-ast -> simple-ast -> string export pipeline.
   Source: src/main/frontend/handler/export/common_impl.cljs

   cljs dynamic vars become explicit context here:
   - *block-ast-resolver*, *block-children-ast-resolver*,
     *page-ast-resolver* → the [resolvers] record.
   - *state* → the mutable [state] record threaded through every fn;
     cljs (binding [*state* ...]) sites become snapshot/restore.

   cljs meta maps on block-ast vectors carry only :origin-ast,
   :embed-depth and :heading-prefix — modeled as [block_meta]. *)

open Datascript

module CV = Clj_value

(* ---------------- ast & meta ---------------- *)

type block_meta =
  { origin_ast : value option
  ; embed_depth : int
  ; heading_prefix : value option
  }

let no_meta = { origin_ast = None; embed_depth = 0; heading_prefix = None }

type block_ast =
  { node : value
  ; meta : block_meta
  }

let ast_type (node : value) : string =
  match node with
  | Vector (String t :: _) | List (String t :: _) -> t
  | _ -> ""

let ast_content (node : value) : value =
  match node with
  | Vector (_ :: c :: _) | List (_ :: c :: _) -> c
  | _ -> Nil

let ast_rest (node : value) : value list =
  match node with
  | Vector (_ :: rest) -> rest
  | List (_ :: rest) -> rest
  | _ -> []

let pair_of (a : block_ast) : string * value = (ast_type a.node, ast_content a.node)

let mk_block_ast node meta : block_ast = { node; meta }

let mk_paragraph_ast (inline_coll : value) (meta : block_meta) : block_ast =
  { node = Vector [ String "Paragraph"; inline_coll ]; meta }

(* ---------------- dynamic var ports ---------------- *)

type resolvers =
  { block_ast : string -> block_ast list
  ; block_children_ast : string -> block_ast list
  ; page_ast : string -> block_ast list
  }

(* cljs *state* :export-options submap. *)
type export_options =
  { indent_style : string
  ; remove_page_ref_brackets : bool
  ; remove_emphasis : bool
  ; remove_tags : bool
  ; remove_properties : bool
  ; keep_only_level_n : int option (* :keep-only-level<=N *)
  ; newline_after_block : bool
  }

(* cljs *state* — flat mutable record standing in for the nested map:
   :current-level, :outside-em-symbol, :indent-after-break-line?,
   :replace-ref-embed {:current-level :block-ref-replaced?
                       :block&page-embed-replaced?},
   :newline-after-block {:current-block-is-first-heading-block?}. *)
type state =
  { mutable current_level : int
  ; mutable outside_em_symbol : string option
  ; mutable indent_after_break_line : bool
  ; mutable rre_current_level : int
  ; mutable rre_block_ref_replaced : bool
  ; mutable rre_embed_replaced : bool
  ; mutable nab_first_heading : bool
  ; export_options : export_options
  }

let default_export_options =
  { indent_style = "dashes"
  ; remove_page_ref_brackets = false
  ; remove_emphasis = false
  ; remove_tags = false
  ; remove_properties = true
  ; keep_only_level_n = None
  ; newline_after_block = false
  }

let default_state ~(export_options : export_options) : state =
  { current_level = 1
  ; outside_em_symbol = None
  ; indent_after_break_line = false
  ; rre_current_level = 1
  ; rre_block_ref_replaced = false
  ; rre_embed_replaced = false
  ; nab_first_heading = true
  ; export_options
  }

(* cljs (binding [*state* ...]) — run f with [patch] applied, restore
   every mutable field afterwards. *)
let with_bound_state (st : state) (patch : state -> unit) (f : unit -> 'a) : 'a =
  let saved =
    ( st.current_level, st.outside_em_symbol, st.indent_after_break_line
    , st.rre_current_level, st.rre_block_ref_replaced, st.rre_embed_replaced
    , st.nab_first_heading )
  in
  patch st;
  Common_util.protect
    ~finally:(fun () ->
      let l, es, ib, rl, br, er, fh = saved in
      st.current_level <- l;
      st.outside_em_symbol <- es;
      st.indent_after_break_line <- ib;
      st.rre_current_level <- rl;
      st.rre_block_ref_replaced <- br;
      st.rre_embed_replaced <- er;
      st.nab_first_heading <- fh)
    f

(* ---------------- value helpers ---------------- *)

let mget = CV.map_get
let mgeto = CV.map_get_opt

let mstr m k =
  match mgeto m k with Some (String s) -> Some s | _ -> None

let mint m k =
  match mgeto m k with
  | Some (Int n) -> Some n
  | Some (Float f) -> Some (int_of_float f)
  | _ -> None

let mcoll m k = CV.coll_items (mget m k)

let assoc_v (m : value) (k : attr) (v : value) : value = CV.map_assoc m k v

(* cljs (vector ...) etc on our ast values *)
let vec xs = Vector xs

let remove_nil xs = List.filter (fun v -> v <> Nil) xs

let mapcatv f xs = List.concat_map f xs

let removev p xs = List.filter (fun x -> not (p x)) xs

(* clojure.string bits used below *)
let str_blank (s : string) = Unicode.trim s = ""
let str_triml = Common_util.str_triml
let str_trimr = Common_util.str_trimr

let str_starts (s : string) (pre : string) : bool =
  let n = String.length s and m = String.length pre in
  n >= m && String.sub s 0 m = pre

let str_ends (s : string) (suf : string) : bool =
  let n = String.length s and m = String.length suf in
  n >= m && String.sub s (n - m) m = suf

let split_lines (s : string) : string list =
  let parts = String.split_on_char '\n' s in
  List.map
    (fun l ->
      let n = String.length l in
      if n > 0 && l.[n - 1] = '\r' then String.sub l 0 (n - 1) else l)
    parts

(* cljs string/join over mixed values used by raw-text — all args are
   strings in this pipeline. *)
let strs (xs : string list) : string = String.concat "" xs

let repeat_str (n : int) (s : string) : string =
  String.concat "" (List.init (max 0 n) (fun _ -> s))

(* cljs (uuid x) — identity on the string uuids here *)
let uuid_of s = s

(* common-util/zero-pad — pad to 2 chars; non-strings stringify. *)
let zero_pad (v : value) : string =
  let s =
    match v with
    | String s -> s
    | Int n -> string_of_int n
    | Float f -> Common_util.js_string_of_float f
    | _ -> ""
  in
  if String.length s = 1 then "0" ^ s else s

(* ---------------- utils ---------------- *)

(* priority->string *)
let priority_to_string (priority : string) : string =
  "[#" ^ priority ^ "]"

(* repetition-to-string [[[kind] [duration] n]] *)
let repetition_to_string (repetition : value) : string =
  match CV.coll_items repetition with
  | [ Vector [ String kind ] | List [ String kind ]
    ; Vector [ String duration ] | List [ String duration ]
    ; n ] ->
      let kind =
        match kind with
        | "Dotted" -> "."
        | "Plus" -> "+"
        | _ -> "++"
      in
      let ns =
        match n with
        | Int i -> string_of_int i
        | String s -> s
        | _ -> ""
      in
      kind ^ ns ^ Unicode.lowercase (String.sub duration 0 1)
  | _ -> ""

(* timestamp-to-string — {:date {:year :month :day} :time {:hour :min}
   :repetition :wday :active} *)
let timestamp_to_string (ts : value) : string =
  let date = mget ts "date" in
  let time = mget ts "time" in
  let open_, close =
    if CV.truthy (mget ts "active") then ("<", ">") else ("[", "]")
  in
  let year = mstr date "year" |> Option.value ~default:"" in
  let month = zero_pad (mget date "month") in
  let day = zero_pad (mget date "day") in
  let wday = mstr ts "wday" |> Option.value ~default:"" in
  let hour_v = mgeto time "hour" and min_v = mgeto time "min" in
  let time_s =
    match Option.map zero_pad hour_v, Option.map zero_pad min_v with
    | Some h, Some m -> Printf.sprintf " %s:%s" h m
    | Some h, None -> Printf.sprintf " %s" h
    | _ -> ""
  in
  let repetition_s =
    match mgeto ts "repetition" with
    | Some r when r <> Nil -> " " ^ repetition_to_string r
    | _ -> ""
  in
  Printf.sprintf "%s%s-%s-%s %s%s%s%s" open_ year month day wday time_s
    repetition_s close

(* hashtag-value->string — inline-coll -> "[[page]]"-free text *)
let hashtag_value_to_string (inline_coll : value) : string =
  CV.coll_items inline_coll
  |> List.map (fun inline ->
         match ast_type inline with
         | "Nested_link" -> mstr (ast_content inline) "content" |> Option.value ~default:""
         | "Link" -> mstr (ast_content inline) "full_text" |> Option.value ~default:""
         | "Plain" ->
             (match ast_content inline with String s -> s | _ -> "")
         | _ -> "")
  |> String.concat ""

(* ---------------- replace block-ref ---------------- *)

(* "Link" {:url ["Block_ref" block-uuid]} -> title inline-coll of the
   referenced block's ast. Returns [item list]. *)
let replace_link_block_ref ~(resolvers : resolvers) ~(st : state)
    (inline : value) : value list =
  match inline with
  | Vector [ String "Link"; link ] | List [ String "Link"; link ] ->
      (match CV.coll_items (mget link "url") with
       | [ String "Block_ref"; String block_uuid ] ->
           (match resolvers.block_ast (uuid_of block_uuid) with
            | first :: _ ->
                st.rre_block_ref_replaced <- true;
                mcoll (ast_content first.node) "title"
            | [] -> [])
       | _ -> [ inline ])
  | _ -> [ inline ]

let rec replace_block_references ~(resolvers : resolvers) ~(st : state)
    (block_ast : block_ast) : block_ast =
  let t, c = pair_of block_ast in
  match t with
  | "Heading" ->
      { block_ast with
        node =
          mk_node "Heading"
            (assoc_v c "title"
               (vec
                  (mapcatv
                     (replace_link_block_ref ~resolvers ~st)
                     (mcoll c "title")))) }
  | "Paragraph" ->
      mk_paragraph_ast
        (vec (mapcatv (replace_link_block_ref ~resolvers ~st) (CV.coll_items c)))
        block_ast.meta
  | "List" ->
      { block_ast with
        node = mk_node "List" (replace_block_reference_in_list ~resolvers ~st c) }
  | "Quote" ->
      { block_ast with
        node =
          mk_node "Quote"
            (vec
               (List.map
                  (fun b ->
                    (replace_block_references ~resolvers ~st
                       { node = b; meta = no_meta })
                      .node)
                  (CV.coll_items c))) }
  | "Table" ->
      let walk_col col =
        vec (mapcatv (replace_link_block_ref ~resolvers ~st) (CV.coll_items col))
      in
      let header = vec (List.map walk_col (mcoll c "header")) in
      let groups =
        vec
          (List.map
             (fun group ->
               vec
                 (List.map
                    (fun row -> vec (List.map walk_col (CV.coll_items row)))
                    (CV.coll_items group)))
             (mcoll c "groups"))
      in
      { block_ast with
        node =
          mk_node "Table"
            (assoc_v (assoc_v c "header" header) "groups" groups) }
  | _ -> block_ast

and mk_node (t : string) (c : value) : value = Vector [ String t; c ]

and replace_block_reference_in_list ~(resolvers : resolvers) ~(st : state)
    (list_items : value) : value =
  vec
    (List.map
       (fun (item : value) ->
         let content =
           vec
             (List.map
                (fun b ->
                  (replace_block_references ~resolvers ~st
                     { node = b; meta = no_meta })
                    .node)
                (mcoll item "content"))
         in
         let items =
           replace_block_reference_in_list ~resolvers ~st (mget item "items")
         in
         assoc_v (assoc_v item "content" content) "items" items)
       (CV.coll_items list_items))

(* cljs binding [*state* *state*] — mutations inside don't leak. *)
let replace_block_references_until_stable ~(resolvers : resolvers)
    ~(st : state) (block_ast : block_ast) : block_ast =
  with_bound_state st (fun _ -> ()) (fun () ->
      let rec loop a =
        let a' = replace_block_references ~resolvers ~st a in
        if st.rre_block_ref_replaced then begin
          st.rre_block_ref_replaced <- false;
          loop a'
        end
        else a'
      in
      loop block_ast)

(* ---------------- replace block/page embeds ---------------- *)

let plain_indent_inline_ast (level : int) : value =
  Vector [ String "Plain"; String (repeat_str (level - 1) "\t" ^ "  ") ]

let update_level_in_block_ast_coll (block_asts : block_ast list)
    (origin_level : int) : block_ast list =
  List.map
    (fun (block_ast : block_ast) ->
      let t, c = pair_of block_ast in
      if t = "Heading" then
        let level =
          (* cljs (+ (dec level) origin-level); nil level -> -1 *)
          match mint c "level" with
          | Some n -> n - 1 + origin_level
          | None -> origin_level - 1
        in
        { block_ast with
          node = mk_node "Heading" (assoc_v c "level" (Int level)) }
      else block_ast)
    block_asts

(* the embed argument forms: "((block-uuid))" or "[[page-name]]" *)
type embed_target =
  | Embed_block of string
  | Embed_page of string

let parse_embed_arg (arg : string) : embed_target option =
  if str_starts arg "((" && str_ends arg "))" then
    Some (Embed_block (String.sub arg 2 (String.length arg - 4)))
  else if str_starts arg "[[" && str_ends arg "]]" then
    Some (Embed_page (String.sub arg 2 (String.length arg - 4)))
  else None

(* replace-block-embeds-helper / replace-page-embeds-helper: append the
   pending paragraph (when non-empty) then the resolved ast coll. *)
let embeds_helper ~(resolvers : resolvers)
    (current_paragraph_inlines : value list) (target : embed_target)
    (acc : block_ast list) (level : int) : block_ast list =
  let ast_coll =
    match target with
    | Embed_block uuid ->
        update_level_in_block_ast_coll
          (resolvers.block_children_ast (uuid_of uuid))
          level
    | Embed_page page_name ->
        update_level_in_block_ast_coll
          (resolvers.page_ast page_name)
          level
  in
  let acc =
    if current_paragraph_inlines <> [] then
      acc @ [ { node = Vector [ String "Paragraph"; vec current_paragraph_inlines ]
              ; meta = no_meta } ]
    else acc
  in
  acc @ ast_coll

let macro_embed_arg (inline : value) : string option =
  match inline with
  | Vector [ String "Macro"; m ] | List [ String "Macro"; m ]
    when mstr m "name" = Some "embed" ->
      (match mcoll m "arguments" with
       | [ String arg ] -> Some arg
       | _ -> None)
  | _ -> None

let rec replace_block_page_embeds_in_heading ~(resolvers : resolvers)
    ~(st : state) (ast_content : value) : block_ast list =
  let inline_coll = mcoll ast_content "title" in
  let origin_level =
    match mint ast_content "level" with Some l -> l | None -> 0
  in
  st.rre_current_level <- origin_level;
  if inline_coll = [] then
    [ { node = mk_node "Heading" ast_content; meta = no_meta } ]
  else
    let rec loop inlines heading_exist cpi r =
      match inlines with
      | [] ->
          if cpi <> [] then
            r
            @ [ (if heading_exist then
                   { node = Vector [ String "Paragraph"; vec cpi ]
                   ; meta = no_meta }
                 else
                   { node =
                       mk_node "Heading" (assoc_v ast_content "title" (vec cpi))
                   ; meta = no_meta }) ]
          else r
      | inline :: rest ->
          (match macro_embed_arg inline with
           | Some arg ->
               (match parse_embed_arg arg with
                | Some (Embed_block _ as target) ->
                    st.rre_embed_replaced <- true;
                    loop rest true [] (embeds_helper ~resolvers cpi target r origin_level)
                | Some (Embed_page _ as target) ->
                    st.rre_embed_replaced <- true;
                    loop rest true [] (embeds_helper ~resolvers cpi target r origin_level)
                | None -> loop rest heading_exist cpi r)
           | None ->
               let cpi =
                 if cpi = [] && heading_exist then
                   cpi @ [ plain_indent_inline_ast origin_level ]
                 else cpi
               in
               loop rest heading_exist (cpi @ [ inline ]) r)
    in
    loop inline_coll false [] []

and replace_block_page_embeds_in_paragraph ~(resolvers : resolvers)
    ~(st : state) (inline_coll : value) (meta : block_meta) : block_ast list =
  let current_level = st.rre_current_level in
  let rec loop inlines cpi just_after_embed blocks =
    match inlines with
    | [] ->
        let blocks =
          if cpi <> [] then
            blocks
            @ [ { node = Vector [ String "Paragraph"; vec cpi ]
                ; meta = no_meta } ]
          else blocks
        in
        (match blocks with
         | first :: rest -> { first with meta } :: rest
         | [] -> [])
    | inline :: rest ->
        (match macro_embed_arg inline with
         | Some arg ->
             (match parse_embed_arg arg with
              | Some target ->
                  st.rre_embed_replaced <- true;
                  loop rest [] true
                    (embeds_helper ~resolvers cpi target blocks current_level)
              | None -> loop rest cpi false blocks)
         | None ->
             let cpi =
               if just_after_embed then
                 cpi @ [ plain_indent_inline_ast current_level ]
               else cpi
             in
             loop rest (cpi @ [ inline ]) false blocks)
  in
  loop (CV.coll_items inline_coll) [] false []

and replace_block_page_embeds_in_list_helper ~(resolvers : resolvers)
    ~(st : state) (list_items : value) : value =
  with_bound_state st
    (fun s -> s.rre_current_level <- s.rre_current_level + 1)
    (fun () ->
      vec
        (List.map
           (fun (item : value) ->
             let content =
               vec
                 (List.map (fun (b : block_ast) -> b.node)
                    (mapcatv
                       (fun b ->
                         replace_block_page_embeds ~resolvers ~st
                           { node = b; meta = no_meta })
                       (mcoll item "content")))
             in
             let items =
               replace_block_page_embeds_in_list_helper ~resolvers ~st
                 (mget item "items")
             in
             assoc_v (assoc_v item "content" content) "items" items)
           (CV.coll_items list_items)))

and replace_block_page_embeds ~(resolvers : resolvers) ~(st : state)
    (block_ast : block_ast) : block_ast list =
  let t, c = pair_of block_ast in
  match t with
  | "Heading" -> replace_block_page_embeds_in_heading ~resolvers ~st c
  | "Paragraph" ->
      replace_block_page_embeds_in_paragraph ~resolvers ~st c block_ast.meta
  | "List" ->
      [ { node =
            mk_node "List"
              (replace_block_page_embeds_in_list_helper ~resolvers ~st c)
        ; meta = no_meta } ]
  | "Quote" ->
      [ { node =
            mk_node "Quote"
              (vec
                 (List.concat_map
                    (fun b ->
                      List.map (fun (x : block_ast) -> x.node)
                        (replace_block_page_embeds ~resolvers ~st
                           { node = b; meta = no_meta }))
                    (CV.coll_items c)))
        ; meta = no_meta } ]
  | _ -> [ block_ast ]

(* replace-block&page-reference&embed — two-queue loop: replace refs
   until stable, embeds expand back into the refs queue while the flag
   is set; embed-depth >= 5 stops re-embedding (cycle guard). *)
let replace_block_and_page_reference_and_embed ~(resolvers : resolvers)
    ~(st : state) (coll : block_ast list) : block_ast list =
  let rec loop (remaining : block_ast list) (result_rev : block_ast list)
      (refs_q : block_ast list) (embeds_q : block_ast list) : block_ast list =
    match refs_q, embeds_q with
    | first :: rest_refs, _ ->
        let embed_depth = first.meta.embed_depth in
        let replaced =
          { (replace_block_references_until_stable ~resolvers ~st first) with
            meta = { no_meta with embed_depth } }
        in
        if embed_depth >= 5 then
          loop remaining (replaced :: result_rev) rest_refs embeds_q
        else
          loop remaining result_rev rest_refs (embeds_q @ [ replaced ])
    | [], first :: rest_embeds ->
        let embed_depth = first.meta.embed_depth in
        let replaced_coll =
          List.map
            (fun (b : block_ast) ->
              { b with meta = { no_meta with embed_depth = embed_depth + 1 } })
            (replace_block_page_embeds ~resolvers ~st first)
        in
        if st.rre_embed_replaced then begin
          st.rre_embed_replaced <- false;
          loop remaining result_rev replaced_coll rest_embeds
        end
        else
          loop remaining (List.rev replaced_coll @ result_rev) [] rest_embeds
    | [], [] ->
        (match remaining with
         | [] -> List.rev result_rev
         | next :: rest -> loop rest result_rev [ next ] [])
  in
  loop coll [] [] []

(* ---------------- block-ast misc ---------------- *)

(* remove-block-ast-pos — [[ast pos] ...] -> [ast ...] *)
let remove_block_ast_pos (pair : value) : block_ast =
  match pair with
  | Vector (b :: _) | List (b :: _) -> { node = b; meta = no_meta }
  | v -> { node = v; meta = no_meta }

let properties_block_ast (a : block_ast) : bool =
  fst (pair_of a) = "Properties"

(* replace-Heading-with-Paragraph — no-indent mode; heading title gets
   [size# marker priority] Plain prefixes; meta {:origin-ast heading}. *)
let replace_heading_with_paragraph (heading_ast : block_ast) : block_ast =
  let t, c = pair_of heading_ast in
  if t = "Heading" then
    let title = mcoll c "title" in
    let title =
      match mstr c "priority" with
      | Some p -> Vector [ String "Plain"; String (priority_to_string p ^ " ") ] :: title
      | None -> title
    in
    let title =
      match mstr c "marker" with
      | Some m -> Vector [ String "Plain"; String (m ^ " ") ] :: title
      | None -> title
    in
    let title =
      match mint c "size" with
      | Some s -> Vector [ String "Plain"; String (repeat_str s "#" ^ " ") ] :: title
      | None -> title
    in
    { node = Vector [ String "Paragraph"; Vector title ]
    ; meta = { no_meta with origin_ast = Some heading_ast.node } }
  else heading_ast

(* keep-only-level<=n — drop blocks until a heading with level <= n
   appears; headings above n also close the run. *)
let keep_only_level_n (coll : block_ast list) (n : int) : block_ast list =
  let rec go accepted acc = function
    | [] -> List.rev acc
    | (ast : block_ast) :: rest ->
        let is_heading = fst (pair_of ast) = "Heading" in
        if (not is_heading) && accepted then go accepted (ast :: acc) rest
        else if not is_heading then go accepted acc rest
        else
          let level_ok =
            match mint (ast_content ast.node) "level" with
            | Some l -> l <= n
            | None -> true (* cljs (<= nil n) is true *)
          in
          if level_ok then go true (ast :: acc) rest else go false acc rest
  in
  go false [] coll

(* ---------------- inline transformers ---------------- *)

(* remove-emphasis — :mapcat-fns-on-inline-ast; Emphasis [em coll] ->
   coll items. *)
let remove_emphasis (inline : value) : value list =
  match inline with
  | Vector [ String "Emphasis"; c ] | List [ String "Emphasis"; c ] ->
      (match CV.coll_items c with
       | [ _em; coll ] -> CV.coll_items coll
       | _ -> [ inline ])
  | _ -> [ inline ]

(* remove-page-ref-brackets — :map-fns-on-inline-ast *)
let remove_page_ref_brackets (inline : value) : value =
  match inline with
  | Vector [ String "Link"; link ] | List [ String "Link"; link ] ->
      let url = CV.coll_items (mget link "url") in
      let label_empty =
        match mgeto link "label" with
        | None -> true
        | Some l ->
            CV.coll_items l = []
            || l = Vector [ Vector [ String "Plain"; String "" ] ]
            || l = List [ Vector [ String "Plain"; String "" ] ]
            || l = List [ List [ String "Plain"; String "" ] ]
      in
      (match url with
       | String "Page_ref" :: String page :: _ when label_empty ->
           Vector [ String "Plain"; String page ]
       | _ -> inline)
  | _ -> inline

(* remove-tags — :mapcat-fns-on-inline-ast; Tag -> [] *)
let remove_tags (inline : value) : value list =
  match ast_type inline with
  | "Tag" -> []
  | _ -> [ inline ]

(* remove-prefix-spaces-in-Plain — :fns-on-inline-coll; trim leading
   whitespace off the first Plain after a break line (state starts at
   break-line). *)
let remove_prefix_spaces_in_plain (inline_coll : value) : value =
  let r, _abl =
    List.fold_left
      (fun (r, after_break_line) (ast : value) ->
        match ast_type ast with
        | "Plain" ->
            let content = ast_content ast in
            let trimmed =
              match content with String s -> str_triml s | _ -> ""
            in
            if after_break_line then
              if trimmed = "" then (r, false)
              else (r @ [ Vector [ String "Plain"; String trimmed ] ], false)
            else (r @ [ ast ], false)
        | "Break_Line" | "Hard_Break_Line" -> (r @ [ ast ], true)
        | _ -> (r @ [ ast ], false))
      ([], true) (CV.coll_items inline_coll)
  in
  Vector r

(* ---------------- walk-block-ast ---------------- *)

type walk_fns =
  { map_fns : (value -> value) list
  ; mapcat_fns : (value -> value list) list
  ; coll_fns : (value -> value) list
  }

let no_walk_fns = { map_fns = []; mapcat_fns = []; coll_fns = [] }

let walk_block_ast_helper (fns : walk_fns) (inline_coll : value) : value =
  let coll =
    List.fold_left (fun c f -> f c) inline_coll fns.coll_fns
  in
  let items = CV.coll_items coll in
  let items =
    List.map (fun i -> List.fold_left (fun a f -> f a) i fns.map_fns) items
  in
  Vector
    (List.concat_map
       (fun i ->
         List.fold_left
           (fun acc f -> List.concat_map f acc)
           [ i ] fns.mapcat_fns)
       items)

let rec walk_block_ast (fns : walk_fns) (block_ast : block_ast) : block_ast =
  let t, c = pair_of block_ast in
  match t with
  | "Paragraph" ->
      mk_paragraph_ast (walk_block_ast_helper fns c) block_ast.meta
  | "Heading" ->
      { block_ast with
        node =
          mk_node "Heading"
            (assoc_v c "title" (walk_block_ast_helper fns (mget c "title"))) }
  | "List" ->
      (* cljs drops :fns-on-inline-coll for list recursion *)
      let fns' = { fns with coll_fns = [] } in
      { block_ast with
        node = mk_node "List" (walk_block_ast_for_list fns' c) }
  | "Quote" ->
      { block_ast with
        node =
          mk_node "Quote"
            (vec
               (List.map
                  (fun b ->
                    (walk_block_ast fns { node = b; meta = no_meta }).node)
                  (CV.coll_items c))) }
  | "Footnote_Definition" ->
      (match ast_rest block_ast.node with
       | [ name; contents ] ->
           { block_ast with
             node =
               Vector
                 [ String "Footnote_Definition"; name
                 ; walk_block_ast_helper fns contents ] }
       | _ -> block_ast)
  | "Table" ->
      let header =
        vec
          (List.map (fun h -> walk_block_ast_helper fns h) (mcoll c "header"))
      in
      let groups =
        vec
          (List.map
             (fun group ->
               vec
                 (List.map
                    (fun row ->
                      vec
                        (List.map
                           (fun col -> walk_block_ast_helper fns col)
                           (CV.coll_items row)))
                    (CV.coll_items group)))
             (mcoll c "groups"))
      in
      { block_ast with
        node =
          mk_node "Table"
            (assoc_v (assoc_v c "header" header) "groups" groups) }
  | _ -> block_ast

and walk_block_ast_for_list (fns : walk_fns) (list_items : value) : value =
  vec
    (List.map
       (fun (item : value) ->
         let content =
           vec
             (List.map
                (fun b ->
                  (walk_block_ast fns { node = b; meta = no_meta }).node)
                (mcoll item "content"))
         in
         let items = walk_block_ast_for_list fns (mget item "items") in
         assoc_v (assoc_v item "content" content) "items" items)
       (CV.coll_items list_items))

(* ---------------- simple-ast ---------------- *)

type simple_ast =
  | Raw_text of string
  | Space
  | Newline of int
  | Indent of int * int (* level, extra-space-count *)

let raw_text s = Raw_text s
let space = Space
let newline_star n = Newline n
let indent level extra = Indent (level, extra)

let simple_ast_to_string = function
  | Raw_text s -> s
  | Space -> " "
  | Newline n -> repeat_str n "\n"
  | Indent (level, extra) -> repeat_str level "\t" ^ repeat_str extra " "

(* merge-adjacent-spaces&newlines — exact port of the cljs loop. *)
let merge_adjacent_spaces_newlines (asts : simple_ast list) : simple_ast list =
  let rec loop r last_ast last_space_suffix last_newline_suffix = function
    | [] ->
        (match last_ast with
         | Some a -> List.rev (a :: r)
         | None -> List.rev r)
    | ast :: rest ->
        let last_type =
          match last_ast with
          | Some (Raw_text _) -> `raw_text
          | Some Space -> `space
          | Some (Newline _) -> `newline
          | Some (Indent _) -> `indent
          | None -> `none
        in
        (match ast with
         | Space ->
             (match last_type with
              | `space | `newline | `indent ->
                  loop r last_ast last_space_suffix last_newline_suffix rest
              | _ when last_space_suffix || last_newline_suffix ->
                  loop r last_ast last_space_suffix last_newline_suffix rest
              | _ ->
                  let r = match last_ast with Some a -> a :: r | None -> r in
                  loop r (Some ast) false false rest)
         | Newline _ ->
             (match last_type with
              | `space | `indent ->
                  loop r (Some ast) false false rest
              | `newline ->
                  let kept =
                    match last_ast, ast with
                    | Some (Newline a), Newline b when a > b -> last_ast
                    | _ -> Some ast
                  in
                  loop r kept false false rest
              | `raw_text ->
                  if last_newline_suffix then
                    loop r last_ast last_space_suffix last_newline_suffix rest
                  else
                    let r =
                      match last_ast with Some a -> a :: r | None -> r
                    in
                    loop r (Some ast) false false rest
              | `none -> loop r (Some ast) false false rest)
         | Indent _ ->
             (match last_type with
              | `space | `indent -> loop r (Some ast) false false rest
              | `newline ->
                  let r = match last_ast with Some a -> a :: r | None -> r in
                  loop r (Some ast) false false rest
              | `raw_text ->
                  if last_space_suffix then
                    loop r last_ast last_space_suffix last_newline_suffix rest
                  else
                    let r =
                      match last_ast with Some a -> a :: r | None -> r
                    in
                    loop r (Some ast) false false rest
              | `none -> loop r (Some ast) false false rest)
         | Raw_text content ->
             let len = String.length content in
             if len = 0 then
               loop r last_ast last_space_suffix last_newline_suffix rest
             else begin
               let first_ch = content.[0] in
               let last_ch = content.[len - 1] in
               let newline_prefix = first_ch = '\r' || first_ch = '\n' in
               let newline_suffix = last_ch = '\n' in
               let space_prefix = first_ch = ' ' in
               let space_suffix = last_ch = ' ' in
               if newline_prefix then begin
                 let r =
                   match last_type with
                   | `space | `indent | `newline -> r
                   | `raw_text | `none ->
                       (match last_ast with Some a -> a :: r | None -> r)
                 in
                 loop r (Some ast) space_suffix newline_suffix rest
               end
               else if space_prefix then begin
                 let r =
                   match last_type with
                   | `space | `indent -> r
                   | `newline | `raw_text | `none ->
                       (match last_ast with Some a -> a :: r | None -> r)
                 in
                 loop r (Some ast) space_suffix newline_suffix rest
               end
               else begin
                 let r = match last_ast with Some a -> a :: r | None -> r in
                 loop r (Some ast) space_suffix newline_suffix rest
               end
             end)
  in
  loop [] None false false asts

let simple_asts_to_string (asts : simple_ast list) : string =
  asts
  |> merge_adjacent_spaces_newlines
  |> merge_adjacent_spaces_newlines
  |> List.map simple_ast_to_string
  |> String.concat ""
