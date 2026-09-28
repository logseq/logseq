(* Shared helpers for the logseq.api bridge methods. *)

let repo () =
  match !Runtime.current_repo with
  | Some r -> r
  | None -> ""

external as_undefined : Js.Json.t -> Js.Json.t Js.Undefined.t
  = "%identity"

(* api args arrive positionally; absent slots are undefined/null *)
let arg_is_nil j =
  Js.Undefined.toOption (as_undefined j) = None || j == Js.Json.null

let arg_wire j = if arg_is_nil j then Wire.Nil else Sdk_convert.wire_of_json j

let arg_string j =
  if arg_is_nil j then None else Js.Json.decodeString j

let arg_map j = if arg_is_nil j then Wire.Map [] else arg_wire j

let resolved j = Js.Promise.resolve j
let resolved_wire w = resolved (Sdk_convert.json_of_wire w)
let resolved_nil = resolved Js.Json.null

let call name args =
  Runtime.invoke name args
  |> Js.Promise.then_ (fun w -> resolved (Sdk_convert.json_of_wire w))

let is_hex c =
  ('0' <= c && c <= '9') || ('a' <= c && c <= 'f') || ('A' <= c && c <= 'F')

let is_uuid_string s =
  String.length s = 36
  && String.get s 8 = '-'
  && String.get s 13 = '-'
  && String.get s 18 = '-'
  && String.get s 23 = '-'
  && String.for_all (fun c -> is_hex c) (String.sub s 0 8)

let trim_leading s =
  let n = String.length s in
  let rec go i =
    if i >= n then n
    else
      match String.get s i with
      | ':' | '_' | ' ' | '\t' | '\n' -> go (i + 1)
      | _ -> i
  in
  String.sub s (go 0) (n - go 0)

(* db-ident/normalize-ident-name-part: keep alnum + =*+!_'?<>=-, and
   prefix NUM- when the name starts with a digit *)
let ident_char_ok c =
  ('a' <= c && c <= 'z')
  || ('A' <= c && c <= 'Z')
  || ('0' <= c && c <= '9')
  || String.contains "=*+!_'?<>=-" c

let normalize_ident_name s =
  let s = if String.length s > 0 && s.[0] >= '0' && s.[0] <= '9'
          then "NUM-" ^ s else s in
  String.to_seq s |> Seq.filter ident_char_ok |> String.of_seq

(* property-name->title: trim, strip leading ':', trim *)
let property_title name =
  String.trim (trim_leading name)

(* sanitize-user-property-name: trim, remove spaces, strip leading :_\s *)
let sanitize_property_name name =
  let s = String.trim name |> trim_leading in
  String.to_seq s |> Seq.filter (fun c -> c <> ' ') |> String.of_seq

(* property ident: unqualified names live in the test-plugin ns *)
let property_ident name =
  let stripped = property_title name in
  if String.contains stripped '/' then stripped
  else "plugin.property._test_plugin/" ^ normalize_ident_name stripped

(* transit vectors may decode as Array or List — treat both as seqs *)
let wire_elems w =
  match w with
  | Wire.Array xs | Wire.List xs | Wire.Set xs -> xs
  | _ -> []

(* ---------- [[name]] → [[uuid]] title refs (cljs wrap-parse-block) -------

   The worker rebuilds :block/refs only from [[uuid]] id-refs stored in a
   block's title (block_content_refs/get-matched-ids) — raw [[name]] text
   would leave the block unreferenced. So save-block/insert-blocks payloads
   pass through resolve_title_refs: each [[name]] resolves to the existing
   page's uuid (or a fresh uuid the worker turns into a page via the
   block/refs stub in resolve-page-refs), and the title is rewritten to
   [[uuid]]. *)

external str_lower : string -> string = "toLowerCase" [@@mel.send]
external str_normalize : string -> string -> string = "normalize"
  [@@mel.send]

(* common-util/page-name-sanity-lc: lowercase + NFC + boundary slashes *)
let page_name_sanity_lc (s : string) : string =
  let s = str_normalize (str_lower s) "NFC" in
  let s =
    if String.length s > 0 && s.[0] = '/' then
      String.sub s 1 (String.length s - 1)
    else s
  in
  let n = String.length s in
  if n > 0 && s.[n - 1] = '/' then String.sub s 0 (n - 1) else s

let find_from (s : string) (start : int) (sub : string) : int =
  let n = String.length sub and len = String.length s in
  let rec go i =
    if i + n > len then -1
    else if String.sub s i n = sub then i
    else go (i + 1)
  in
  go (max 0 start)

(* inner text of every [[..]] in [title]; already-id refs are skipped *)
let page_ref_names (title : string) : string list =
  let rec go pos acc =
    match find_from title pos "[[" with
    | i when i < 0 -> List.rev acc
    | i -> (
        match find_from title (i + 2) "]]" with
        | j when j < 0 -> List.rev acc
        | j ->
            let inner = String.trim (String.sub title (i + 2) (j - i - 2)) in
            go (j + 2)
              (if inner = "" || is_uuid_string inner || List.mem inner acc
               then acc
               else inner :: acc))
  in
  go 0 []

let replace_all (s : string) ~(pat : string) ~(rep : string) : string =
  let n = String.length pat in
  if n = 0 then s
  else
    let rec go pos acc =
      match find_from s pos pat with
      | i when i < 0 ->
          List.rev (String.sub s pos (String.length s - pos) :: acc)
      | i -> go (i + n) (rep :: String.sub s pos (i - pos) :: acc)
    in
    String.concat "" (go 0 [])

(* every block/title string anywhere in an op payload *)
let rec collect_title_strings (w : Wire.t) (acc : string list) =
  let acc =
    match Wire.map_get_string w "block/title" with
    | Some t -> t :: acc
    | None -> acc
  in
  match w with
  | Wire.Map kvs ->
      List.fold_left (fun a (_, v) -> collect_title_strings v a) acc kvs
  | Wire.Array xs | Wire.List xs | Wire.Set xs ->
      List.fold_left (fun a x -> collect_title_strings x a) acc xs
  | _ -> acc

let edn_escape (s : string) : string =
  replace_all
    (replace_all s ~pat:"\\" ~rep:"\\\\")
    ~pat:"\"" ~rep:"\\\""

(* every #tag token in [title]: '#' at a word boundary followed by a
   letter/underscore start char and tag chars (cljs parse-block extracts
   these into :block/tags when they resolve to classes) *)
let tag_char c =
  ('a' <= c && c <= 'z')
  || ('A' <= c && c <= 'Z')
  || ('0' <= c && c <= '9')
  || c = '_' || c = '-' || c = '.'

let hashtag_names (title : string) : string list =
  let n = String.length title in
  let rec go i acc =
    if i >= n then List.rev acc
    else if String.get title i = '#'
            && (i = 0
                || (match String.get title (i - 1) with
                    | ' ' | '\t' | '\n' | '(' | '[' -> true
                    | _ -> false))
            && i + 1 < n
            && (match String.get title (i + 1) with
                | 'a' .. 'z' | 'A' .. 'Z' | '_' -> true
                | _ -> false)
    then
      let j = ref (i + 1) in
      while !j < n && tag_char (String.get title !j) do
        incr j
      done;
      let tok = String.sub title (i + 1) (!j - i - 1) in
      go !j (if List.mem tok acc then acc else tok :: acc)
    else go (i + 1) acc
  in
  go 0 []

(* names that resolve to class entities (tagged :logseq.class/Tag) *)
let fetch_tag_names (names : string list) : string list Js.Promise.t =
  match names, repo () with
  | [], _ | _, "" -> resolved []
  | names, repo ->
      let set_edn =
        "#{"
        ^ String.concat " "
            (List.map (fun n -> "\"" ^ edn_escape n ^ "\"") names)
        ^ "}"
      in
      Runtime.invoke2 "thread-api/q" (Wire.String repo)
        (Wire.Array
           [ Wire.String
               ("[:find [?n ...] :where [?e :block/name ?n] \
                 [?e :block/tags ?t] [?t :db/ident :logseq.class/Tag] \
                 [(contains? " ^ set_edn ^ " ?n)]]")
           ])
      |> Js.Promise.then_ (fun w ->
             resolved (List.filter_map Wire.as_string (wire_elems w)))
      |> Js.Promise.catch (fun e ->
             Platform.console_error ("tag-name lookup failed", e);
             resolved [])

let fetch_ref_uuids (names : string list)
    : (string * string) list Js.Promise.t =
  match repo () with
  | "" -> resolved []
  | repo ->
      let set_edn =
        "#{"
        ^ String.concat " "
            (List.map (fun n -> "\"" ^ edn_escape n ^ "\"") names)
        ^ "}"
      in
      Runtime.invoke2 "thread-api/q" (Wire.String repo)
        (Wire.Array
           [ Wire.String
               ("[:find ?n ?u :where [?e :block/name ?n] \
                 [?e :block/uuid ?u] [(contains? " ^ set_edn ^ " ?n)]]")
           ])
      |> Js.Promise.then_ (fun w ->
             resolved
               (List.filter_map
                  (fun row ->
                    match wire_elems row with
                    | [ Wire.String n; u ] ->
                        Option.map (fun uuid -> (n, uuid)) (Wire.as_uuid u)
                    | _ -> None)
                  (wire_elems w)))
      |> Js.Promise.catch (fun e ->
             Platform.console_error ("page-ref uuid lookup failed", e);
             resolved [])

(* page-ref stub — resolve-page-refs turns block/type "page" stubs into
   the real page (creating it when the name is unknown) *)
let ref_stub (inner : string) (lc, u) : Wire.t =
  Wire.Map
    [ (Wire.Keyword "block/name", Wire.String lc)
    ; (Wire.Keyword "block/title", Wire.String inner)
    ; (Wire.Keyword "block/uuid", Wire.Uuid u)
    ; (Wire.Keyword "block/type", Wire.String "page")
    ]

(* tag stub for block/tags — carries block/name so worker-side
   resolve-page-refs enriches it with the resolved class uuid+ident *)
let tag_stub (inner : string) (lc, u) : Wire.t =
  Wire.Map
    [ (Wire.Keyword "block/name", Wire.String lc)
    ; (Wire.Keyword "block/title", Wire.String inner)
    ; (Wire.Keyword "block/uuid", Wire.Uuid u)
    ]

let rec rewrite_title_refs ~(tags : string list)
    (known : (string * string) list) (w : Wire.t) : Wire.t =
  let uuid_of inner =
    let lc = page_name_sanity_lc inner in
    (lc, Option.value (List.assoc_opt lc known)
           ~default:(Platform.random_uuid ()))
  in
  match w with
  | Wire.Map kvs -> (
      match Wire.map_get_string w "block/title" with
      | Some t when page_ref_names t <> [] || hashtag_names t <> [] ->
          let refs =
            List.map (fun inner -> (inner, uuid_of inner)) (page_ref_names t)
          in
          let title' =
            List.fold_left
              (fun acc (inner, (_lc, u)) ->
                replace_all acc ~pat:("[[" ^ inner ^ "]]")
                  ~rep:("[[" ^ u ^ "]]"))
              t refs
          in
          (* hashtags that resolve to classes go to block/tags; every
             hashtag also enters block/refs as a page ref (cljs parse-block
             marks #x as a ref regardless of class membership) *)
          let hashes = hashtag_names t in
          let hash_resolved =
            List.map (fun inner -> (inner, uuid_of inner)) hashes
          in
          let stubs =
            List.map (fun (i, lu) -> ref_stub i lu)
              (refs @ hash_resolved)
          in
          let tag_stubs =
            List.filter_map
              (fun (i, ((lc, _) as lu)) ->
                if List.mem lc tags then Some (tag_stub i lu) else None)
              hash_resolved
          in
          let kvs =
            List.map
              (fun (k, v) ->
                match k with
                | Wire.Keyword "block/title" | Wire.String "block/title" ->
                    (k, Wire.String title')
                | Wire.Keyword "block/refs" | Wire.String "block/refs" -> (
                    match v with
                    | Wire.List xs | Wire.Array xs | Wire.Set xs ->
                        (k, Wire.List (xs @ stubs))
                    | _ -> (k, Wire.List stubs))
                | Wire.Keyword "block/tags" | Wire.String "block/tags" -> (
                    match v with
                    | Wire.List xs | Wire.Array xs | Wire.Set xs ->
                        (k, Wire.List (xs @ tag_stubs))
                    | _ -> (k, Wire.List tag_stubs))
                | _ -> (k, rewrite_title_refs ~tags known v))
              kvs
          in
          let kvs =
            (if Wire.get (Wire.Map kvs) "block/refs" = None
               && stubs <> []
             then [ (Wire.Keyword "block/refs", Wire.List stubs) ]
             else [])
            @ (if Wire.get (Wire.Map kvs) "block/tags" = None
                  && tag_stubs <> []
               then [ (Wire.Keyword "block/tags", Wire.List tag_stubs) ]
               else [])
            @ kvs
          in
          Wire.Map kvs
      | _ ->
          Wire.Map
            (List.map
               (fun (k, v) -> (k, rewrite_title_refs ~tags known v))
               kvs))
  | Wire.Array xs -> Wire.Array (List.map (rewrite_title_refs ~tags known) xs)
  | Wire.List xs -> Wire.List (List.map (rewrite_title_refs ~tags known) xs)
  | Wire.Set xs -> Wire.Set (List.map (rewrite_title_refs ~tags known) xs)
  | _ -> w

let resolve_title_refs (ops : Wire.t list) : Wire.t list Js.Promise.t =
  let titles =
    List.rev (List.concat_map (fun w -> collect_title_strings w []) ops)
  in
  let names =
    List.sort_uniq String.compare
      (List.map page_name_sanity_lc
         (List.concat_map page_ref_names titles
          @ List.concat_map hashtag_names titles))
  in
  (match names with
   | [] -> resolved ([], [])
   | _ ->
       Js.Promise.all2
         (fetch_ref_uuids names, fetch_tag_names names))
  |> Js.Promise.then_ (fun (known, tags) ->
         resolved
           (List.map (rewrite_title_refs ~tags known) ops))

(* dispatch outliner ops; each op entry is [kw-name, [args...]].
   Response is {result: <last op result>, ...} — unwrap it. *)
let apply_ops ops opts =
  resolve_title_refs ops
  |> Js.Promise.then_ (fun ops ->
         Runtime.invoke3 "thread-api/apply-outliner-ops"
           (Wire.String (repo ()))
           (Wire.Array ops)
           opts
         |> Js.Promise.then_ (fun w ->
                Js.Promise.resolve
                  (match Wire.get w "result" with
                   | Some r -> r
                   | None -> Wire.Nil)))

let apply_op op args =
  apply_ops [ Wire.Array [ Wire.Keyword op; Wire.Array args ] ]
    (Wire.Map [])

(* get-blocks [{id, opts}] -> [[{id, block?}...]] — resolve first result *)
let get_by_id id_wire =
  Runtime.invoke2 "thread-api/get-blocks" (Wire.String (repo ()))
    (Wire.Array
       [ Wire.Map
           [ (Wire.String "id", id_wire); (Wire.String "opts", Wire.Map []) ]
       ])
  |> Js.Promise.then_ (fun w ->
         Js.Promise.resolve
           (match wire_elems w with
            | [ pair ] -> (
                match Wire.get pair "block" with
                | Some res -> res
                | None -> (
                    match wire_elems pair with
                    | [ _; res ] -> res
                    | _ -> Wire.Nil))
            | _ -> Wire.Nil))

(* id-or-name -> entity wire (uuid / namespaced ident / page name) *)
let get_entity id_or_name =
  let repo = repo () in
  if is_uuid_string id_or_name then get_by_id (Wire.String id_or_name)
  else
    Runtime.invoke2 "thread-api/get-case-page" (Wire.String repo)
      (Wire.String id_or_name)
    |> Js.Promise.then_ (fun w ->
           match w with
           | Wire.Nil when String.contains id_or_name '/' ->
               get_by_id (Wire.Keyword id_or_name)
           | _ -> Js.Promise.resolve w)

let get_entity_ident ident = get_by_id (Wire.Keyword ident)

(* api block target arg: uuid/name string or numeric db/id
   (cljs <get-block accepts both) *)
let entity_of_arg j =
  match Js.Json.classify j with
  | Js.Json.JSONNumber f -> get_by_id (Wire.Int (int_of_float f))
  | Js.Json.JSONString s -> get_entity s
  | _ -> resolved Wire.Nil

let block_uuid_of (w : Wire.t) = Wire.map_get_uuid w "block/uuid"
