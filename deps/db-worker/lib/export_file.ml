(* logseq.common.export.file — render page/block trees to markdown file
   content. Shared by the markdown mirror and the export endpoints. *)

open Datascript

(* Render context shared by one export run (cljs `context` map). *)
type context =
  { export_bullet_indentation : string
  ; excluded_properties : attr list
  ; export_properties_as_list_items : bool
  ; export_node_property_values_as_page_refs : bool
  ; export_default_property_values_as_blocks : bool
  ; preserve_block_refs : bool
  ; date_formatter : string option
  ; encode_highlight_as_mark : bool }

(* cljs block->content-context used by the markdown mirror. *)
let mirror_context =
  { export_bullet_indentation = "  "
  ; excluded_properties = [ "logseq.property/status" ]
  ; export_properties_as_list_items = true
  ; export_node_property_values_as_page_refs = true
  ; export_default_property_values_as_blocks = true
  ; preserve_block_refs = true
  ; date_formatter = None
  ; encode_highlight_as_mark = false }

type tree_opts =
  { init_level : int option
  ; link : bool
  ; include_page_properties : bool
  ; open_blocks_only : bool
  ; heading_to_list : bool
  ; include_properties : bool }

let default_tree_opts =
  { init_level = None
  ; link = false
  ; include_page_properties = false
  ; open_blocks_only = false
  ; heading_to_list = false
  ; include_properties = true }

let str_contains s sub =
  let n = String.length s and m = String.length sub in
  let rec loop i = i + m <= n && (String.sub s i m = sub || loop (i + 1)) in
  m = 0 || loop 0

let split_lines s = if s = "" then [] else String.split_on_char '\n' s

(* ---------- db-property predicates ---------- *)

let logseq_property_namespaces =
  [ "logseq.property"; "logseq.property.tldraw"; "logseq.property.pdf";
    "logseq.property.fsrs"; "logseq.property.linked-references";
    "logseq.property.asset"; "logseq.property.table"; "logseq.property.node";
    "logseq.property.code"; "logseq.property.repeat"; "logseq.property.journal";
    "logseq.property.class"; "logseq.property.view"; "logseq.property.user";
    "logseq.property.history"; "logseq.property.reaction";
    "logseq.property.sync"; "logseq.property.publish"; "logseq.property.recycle";
    "logseq.property.comments"; "logseq.property.agent" ]

(* db-property/property? — user-visible property idents. *)
let is_property_attr (a : attr) : bool =
  match String.index_opt a '/' with
  | Some i ->
      let ns = String.sub a 0 i in
      List.mem ns logseq_property_namespaces
      || str_contains ns ".property"
      || List.mem a Plain_value.public_db_attribute_properties
  | None -> List.mem a Plain_value.public_db_attribute_properties

(* db-property/db-attribute-properties *)
let db_attribute_properties =
  [ "block/alias"; "block/tags"; "block/parent"; "block/order";
    "block/collapsed?"; "block/page"; "block/refs"; "block/link"; "block/title";
    "block/closed-value-property"; "block/journal-day"; "block/created-at";
    "block/updated-at" ]

(* db-property/properties — entity's user-visible property pairs. *)
let properties (e : entity) : (attr * tx_value) list =
  Datascript.entity_attrs e |> List.filter (fun (a, _) -> is_property_attr a)

let is_many (tv : tx_value) : bool =
  match tv with Many_values _ | Many_entities _ -> true | _ -> false

(* tx_value -> plain values; entity refs resolve through the db. *)
let tx_values db (tv : tx_value) : value list =
  let ref_of (te : tx_entity) =
    match te.db_id with
    | Some (Entity_id id) -> Some (Ref id)
    | Some r -> Option.map (fun (e : entity) -> Ref e.id) (Datascript.entity db r)
    | None -> None
  in
  match tv with
  | One_value v -> [ v ]
  | Many_values vs -> vs
  | One_entity te -> Option.to_list (ref_of te)
  | Many_entities tes -> List.filter_map ref_of tes

(* db-property/sort-properties — by :block/order then :block/uuid;
   nil order sorts last. *)
let sort_properties (props : entity list) : entity list =
  let uuid_of e =
    match Ldb.value e "block/uuid" with Some (Uuid u) -> u | _ -> ""
  in
  List.stable_sort
    (fun a b ->
       match Ldb.value a "block/order", Ldb.value b "block/order" with
       | None, None -> compare (uuid_of a) (uuid_of b)
       | None, Some _ -> 1
       | Some _, None -> -1
       | Some x, Some y ->
           (match compare x y with 0 -> compare (uuid_of a) (uuid_of b) | c -> c))
    props

let ent_of_value db (v : value) : entity option =
  match v with Ref id -> Ldb.ent_of_id db id | _ -> None

(* ---------- value rendering ---------- *)

let string_of_value (v : value) : string =
  match v with
  | Int n -> string_of_int n
  | Float f -> Printf.sprintf "%g" f
  | String s -> s
  | Bool b -> string_of_bool b
  | Keyword k -> k
  | Symbol s -> s
  | Uuid u -> u
  | Instant ms -> Int64.to_string ms
  | Ref id -> string_of_int id
  | _ -> ""

(* journal title for a yyyymmdd int using the context formatter. *)
let journal_day_title day (ctx : context) : string =
  Ldb.journal_title_of_day day
    (Option.value ctx.date_formatter ~default:"MMM do, yyyy")

let datetime_value_to_string (v : value) (ctx : context) : string option =
  match v with
  | Int n when n >= 10000101 && n <= 99991231 -> Some (journal_day_title n ctx)
  | Int n when n >= 100000000000 ->
      let y, m, d, h, mi = Clock.localtime_ms (float_of_int n) in
      let day = (y * 10000) + (m * 100) + d in
      Some (Printf.sprintf "%s %02d:%02d" (journal_day_title day ctx) h mi)
  | _ -> None

(* cljs entity-content: :block/title or :logseq.property/value. *)
let entity_content (e : entity) : string option =
  match Ldb.string_value e "block/title" with
  | Some _ as s -> s
  | None ->
      (match Ldb.value e "logseq.property/value" with
       | Some (String s) -> Some s
       | Some v -> Some (string_of_value v)
       | None -> None)

let property_type (property : entity) : string option =
  match Ldb.value property "logseq.property/type" with
  | Some (Keyword k) -> Some k
  | Some (String s) -> Some s
  | _ -> None

let rec property_value_to_string db (property : entity) (v : value) (ctx : context)
    : string option =
  let node_ref content =
    if ctx.export_node_property_values_as_page_refs
       && property_type property = Some "node" && String.trim content <> ""
    then "[[" ^ content ^ "]]"
    else content
  in
  let values_string vs =
    List.filter_map
      (fun v -> property_value_to_string db property v ctx)
      vs
    |> String.concat ", "
  in
  match v with
  | Ref id ->
      (match Ldb.ent_of_id db id with
       | Some e ->
           (match entity_content e with
            | Some c -> Some (node_ref c)
            | None -> Some (node_ref ""))
       | None -> Some "")
  | Keyword k -> Some k
  | Int _ | Float _ ->
      if property_type property = Some "datetime" then
        (match datetime_value_to_string v ctx with
         | Some s -> Some s
         | None -> Some (string_of_value v))
      else Some (string_of_value v)
  | Set vs | Vector vs | List vs -> Some (values_string vs)
  | String s -> Some s
  | Bool b -> Some (string_of_bool b)
  | Symbol s -> Some s
  | Uuid s -> Some s
  | Nil -> None
  | _ -> Some (string_of_value v)

(* sort key: entities with :block/order first by order, rest by rendered
   value (cljs property-value-sort-key). *)
let property_value_sort_key db property v ctx =
  match ent_of_value db v with
  | Some e ->
      (match Ldb.value e "block/order" with
       | Some (String s) -> (0, s)
       | _ -> (1, Option.value (property_value_to_string db property v ctx) ~default:""))
  | None -> (1, Option.value (property_value_to_string db property v ctx) ~default:"")

let property_values_seq db property (tv : tx_value) (ctx : context) : value list =
  let vs = tx_values db tv in
  if is_many tv then
    List.stable_sort
      (fun a b ->
         compare
           (property_value_sort_key db property a ctx)
           (property_value_sort_key db property b ctx))
      vs
  else vs

let property_line_content property_title (value : string option) spaces
    (ctx : context) : string =
  spaces
  ^ (if ctx.export_properties_as_list_items then "* " else "")
  ^ property_title ^ "::"
  ^ (match value with Some v -> " " ^ v | None -> "")

let default_property_values_as_blocks property (tv : tx_value) (ctx : context) : bool =
  ctx.export_default_property_values_as_blocks
  && property_type property = Some "default"
  && not
       (List.exists
          (fun v ->
             match ent_of_value property.db v with
             | Some e -> Option.is_some (Ldb.value e "block/closed-value-property")
             | None -> false)
          (tx_values property.db tv))

(* ---------- mutually recursive renderers ---------- *)

let rec block_properties_content db (block : entity) spaces (ctx : context)
    : string option =
  let props =
    properties block
    |> List.filter (fun (a, _) -> not (List.mem a db_attribute_properties))
    |> List.filter (fun (a, _) -> not (List.mem a ctx.excluded_properties))
    |> List.filter (fun (a, _) ->
           match Datascript.entity db (Ident a) with
           | Some pe -> not (Ldb.truthy (Ldb.value pe "logseq.property/hide?"))
           | None -> true)
  in
  match props with
  | [] -> None
  | props ->
      let sorted =
        List.filter_map (fun (a, _) -> Datascript.entity db (Ident a)) props
        |> sort_properties
      in
      let lines =
        List.filter_map
          (fun (property : entity) ->
             match Ldb.value property "db/ident" with
             | Some (Keyword ident) ->
                 (match List.assoc_opt ident props with
                  | Some tv ->
                      let property_title =
                        match Ldb.string_value property "block/title" with
                        | Some t -> t
                        | None ->
                            (match Ldb.string_value property "block/raw-title" with
                             | Some t -> t
                             | None -> ident)
                      in
                      if default_property_values_as_blocks property tv ctx then
                        Some
                          (property_line_content property_title None spaces ctx
                           ^ "\n"
                           ^ property_value_blocks_content db property tv
                               (spaces ^ "  ") ctx)
                      else
                        let value =
                          match tx_values db tv with
                          | [ v ] -> property_value_to_string db property v ctx
                          | vs ->
                              Some
                                (List.filter_map
                                   (fun v -> property_value_to_string db property v ctx)
                                   vs
                                 |> String.concat ", ")
                        in
                        Some
                          (property_line_content property_title value spaces ctx)
                  | None -> None)
             | _ -> None)
          sorted
      in
      (match lines with [] -> None | _ -> Some (String.concat "\n" lines))

(* property-value-block-title — value entity's title through
   recur-replace-uuid (preserving block refs when context asks). *)
and property_value_block_title db property (v : value) (ctx : context)
    : string option =
  match ent_of_value db v with
  | Some e ->
      Db_content.recur_replace_uuid_in_block_title ~max_depth:10
        ~replace_block_refs:(not ctx.preserve_block_refs) e
  | None -> property_value_to_string db property v ctx

and default_property_value_block_content db property (v : value) spaces
    (ctx : context) : string =
  let line =
    spaces ^ "- "
    ^ Option.value (property_value_block_title db property v ctx) ~default:""
  in
  match ent_of_value db v with
  | Some value_e ->
      let props = block_properties_content db value_e (spaces ^ "  ") ctx in
      let children = property_value_children_content db value_e spaces ctx in
      String.concat ""
        (List.filter_map Fun.id
           [ Some line;
             Option.map (fun c -> "\n" ^ c) props;
             Option.map (fun c -> "\n" ^ c) children ])
  | None -> line

and property_value_blocks_content db property (tv : tx_value) spaces
    (ctx : context) : string =
  property_values_seq db property tv ctx
  |> List.map (fun v -> default_property_value_block_content db property v spaces ctx)
  |> String.concat "\n"

(* property-value-children-content — value entity's own children rendered
   one level deeper. *)
and property_value_children_content db (value_e : entity) spaces (ctx : context)
    : string option =
  match Ldb.sort_by_order (Ldb.parent_children value_e) with
  | [] -> None
  | children ->
      let indent = ctx.export_bullet_indentation in
      let child_level = 2 + (String.length spaces / max 1 (String.length indent)) in
      let contents =
        List.filter_map
          (fun (c : entity) ->
             match Ldb.value c "block/uuid" with
             | Some (Uuid u) ->
                 Some
                   (block_to_content db ~block_uuid:u
                      ~opts:{ default_tree_opts with init_level = Some child_level }
                      ~ctx)
             | _ -> None)
          children
      in
      (match contents with [] -> None | _ -> Some (String.concat "\n" contents))

(* property-value-block-content — "property:: value" line for blocks
   created from a property value. *)
and property_value_block_content db (b : entity) (ctx : context) : string option =
  match Ldb.ref_ent b "logseq.property/created-from-property" with
  | Some property ->
      let property_title =
        match Ldb.string_value property "block/title" with
        | Some t -> Some t
        | None ->
            (match Ldb.string_value property "block/raw-title" with
             | Some t -> Some t
             | None ->
                 (match Ldb.value property "db/ident" with
                  | Some (Keyword k) -> Some k
                  | _ -> None))
      in
      (match property_title with
       | Some title ->
           let value =
             match Ldb.string_value b "block/title" with
             | Some _ as s -> s
             | None ->
                 (match Ldb.value b "logseq.property/value" with
                  | Some v -> property_value_to_string db property v ctx
                  | None -> None)
           in
           Some (property_line_content title value "" ctx)
       | None -> None)
  | None -> None

and block_title_content db (b : entity) (ctx : context) : string option =
  match property_value_block_content db b ctx with
  | Some s -> Some s
  | None ->
      Db_content.recur_replace_uuid_in_block_title ~max_depth:10
        ~replace_block_refs:(not ctx.preserve_block_refs) b

(* ---------- formatting ---------- *)

and indented_block_content content spaces =
  String.concat ("\n" ^ spaces) (split_lines content)

and bounded_heading_level (heading : value option) level =
  match heading with
  | Some (Int n) -> Some (max 1 (min 6 n))
  | Some (Bool true) -> Some (min (level + 1) 6)
  | _ -> None

and strip_heading_prefix (content : string) : string =
  let s = String.trim content in
  let n = String.length s in
  let i = ref 0 in
  while !i < n && s.[!i] = '#' do
    incr i
  done;
  let j = ref !i in
  while !j < n && (s.[!j] = ' ' || s.[!j] = '\t') do
    incr j
  done;
  if !i = 0 then s else String.sub s !j (n - !j)

and quote_content (content : string) : string =
  match split_lines content with
  | [] -> ">"
  | lines ->
      String.concat "\n"
        (List.map (fun l -> if String.trim l = "" then ">" else "> " ^ l) lines)

and code_fence (content : string) : string =
  let max_run = ref 0 in
  let run = ref 0 in
  String.iter
    (fun c ->
       if c = '`' then begin
         incr run;
         if !run > !max_run then max_run := !run
       end
       else run := 0)
    content;
  String.make (max 3 (!max_run + 1)) '`'

and format_markdown_block_content (b : entity) content level heading_to_list
    : string =
  let kw_string v = match v with Some (Keyword k) -> Some k | _ -> None in
  match kw_string (Ldb.value b "logseq.property.node/display-type") with
  | Some "quote" -> quote_content content
  | Some "code" ->
      let lang =
        match Ldb.value b "logseq.property.code/lang" with
        | Some (String s) -> s
        | _ -> ""
      in
      let fence = code_fence content in
      fence
      ^ (if String.trim lang <> "" then lang else "")
      ^ "\n" ^ content ^ "\n" ^ fence
  | Some "math" -> "$$\n" ^ content ^ "\n$$"
  | _ ->
      (match bounded_heading_level (Ldb.value b "logseq.property/heading") level with
       | Some hl when not heading_to_list ->
           String.make hl '#' ^ " " ^ strip_heading_prefix content
       | _ -> content)

and highlighted_block (b : entity) : bool =
  Option.is_some (Ldb.value b "logseq.property/background-color")

and transform_content db (b : entity) level ~heading_to_list ~include_properties
    (ctx : context) : string =
  let heading = Ldb.value b "logseq.property/heading" in
  let content = Option.value (block_title_content db b ctx) ~default:"" in
  let content =
    if ctx.encode_highlight_as_mark
       && (match Ldb.value b "logseq.property.node/display-type" with
           | Some (Keyword ("code" | "math")) -> false
           | _ -> true)
       && String.trim content <> ""
       && highlighted_block b
    then "^^" ^ content ^ "^^"
    else content
  in
  let level =
    if heading_to_list then
      match heading with Some (Int n) -> if n > 1 then n - 1 else n | _ -> level
    else level
  in
  let spaces =
    let b' = Buffer.create 16 in
    for _ = 1 to max 0 (level - 1) do
      Buffer.add_string b' ctx.export_bullet_indentation
    done;
    Buffer.contents b'
  in
  let prefix = spaces ^ "-" in
  let property_spaces = spaces ^ "  " in
  let content =
    if heading_to_list then strip_heading_prefix content
    else format_markdown_block_content b content level heading_to_list
  in
  let new_content = indented_block_content (String.trim content) property_spaces in
  let sep = if String.trim new_content = "" then "" else " " in
  let content = prefix ^ sep ^ new_content in
  match
    (if include_properties then block_properties_content db b property_spaces ctx
     else None)
  with
  | Some props -> content ^ "\n" ^ props
  | None -> content

(* ---------- tree render ---------- *)

and node_children ~open_blocks_only (e : entity) : entity list =
  if open_blocks_only && Ldb.truthy (Ldb.value e "block/collapsed?") then []
  else Ldb.sort_by_order (Ldb.parent_children e)

(* cljs page? in tree->file-content: node has no :block/page. *)
and is_page_node (e : entity) : bool = Option.is_none (Ldb.value e "block/page")

and node_to_lines db (e : entity) level ~(opts : tree_opts) ~(ctx : context)
    : string list =
  let page = is_page_node e in
  let content =
    if page && not opts.link && opts.include_page_properties then
      block_properties_content db e "" ctx
    else if page && not opts.link then None
    else
      Some
        (transform_content db e level ~heading_to_list:opts.heading_to_list
           ~include_properties:opts.include_properties ctx)
  in
  let children = node_children ~open_blocks_only:opts.open_blocks_only e in
  (match content with Some c -> [ c ] | None -> [])
  @ List.concat_map
      (fun c -> node_to_lines db c (level + 1) ~opts ~ctx)
      children

and tree_to_file_content db (root : entity) ~(opts : tree_opts) ~(ctx : context)
    : string =
  let level = Option.value opts.init_level ~default:1 in
  node_to_lines db root level ~opts ~ctx
  |> List.filter (fun c -> String.trim c <> "")
  |> String.concat "\n"

(* block->content — entity's subtree rendered as markdown. *)
and block_to_content db ~block_uuid ~(opts : tree_opts) ~(ctx : context) : string =
  match Datascript.entity db (Lookup_ref ("block/uuid", Uuid block_uuid)) with
  | None -> ""
  | Some root ->
      let init_level =
        match opts.init_level with
        | Some l -> l
        | None -> if Ldb.is_page root then 0 else 1
      in
      tree_to_file_content db root
        ~opts:{ opts with init_level = Some init_level } ~ctx

(* get-all-page->content — export every page as (title, content). *)
let get_all_page_content db ~(ctx : context) : (string * string) list =
  let built_in_pages = [ "Library"; "Quick add"; "Contents" ] in
  Datascript.datoms db Datascript.Avet ~a:"block/name" ()
  |> Seq.filter_map (fun (d : datom) -> Ldb.ent_of_id db d.e)
  |> List.of_seq
  |> List.filter (fun ent ->
         (not (Ldb.built_in ent))
         || List.mem
              (Option.value (Ldb.string_value ent "block/title") ~default:"")
              built_in_pages)
  |> List.filter_map (fun (e : entity) ->
         match Ldb.string_value e "block/title", Ldb.value e "block/uuid" with
         | Some title, Some (Uuid u) ->
             Some
               (title, block_to_content db ~block_uuid:u ~opts:default_tree_opts ~ctx)
         | _ -> None)
