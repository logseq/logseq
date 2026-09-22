(* logseq.common.graph-dir — encoded graph directory names. *)

let str_replace_all s old_s new_s =
  let n = String.length s and m = String.length old_s in
  if m = 0 then s
  else begin
    let b = Buffer.create n in
    let rec loop i =
      if i + m <= n && String.sub s i m = old_s then begin
        Buffer.add_string b new_s;
        loop (i + m)
      end else if i < n then begin
        Buffer.add_char b s.[i];
        loop (i + 1)
      end
    in
    loop 0;
    Buffer.contents b
  end

(* js/encodeURIComponent: everything except unreserved marks is
   UTF-8 %-escaped. *)
let uri_encode s =
  let unreserved c =
    (c >= 'A' && c <= 'Z')
    || (c >= 'a' && c <= 'z')
    || (c >= '0' && c <= '9')
    || List.mem c [ '-'; '_'; '.'; '!'; '~'; '*'; '\''; '('; ')' ]
  in
  let b = Buffer.create (String.length s) in
  String.iter
    (fun c ->
       if unreserved c then Buffer.add_char b c
       else Buffer.add_string b (Printf.sprintf "%%%02X" (Char.code c)))
    s;
  Buffer.contents b

(* encode-graph-dir-name *)
let encode_graph_dir_name (graph_name : string) : string =
  let encoded = uri_encode (String.trim graph_name) in
  encoded
  |> fun s -> str_replace_all s "%20" " "
  |> fun s -> str_replace_all s "~" "%7E"
  |> fun s -> str_replace_all s "%" "~"

(* repo->encoded-graph-dir-name: strip the logseq_db_ prefix first. *)
let db_version_prefix = "logseq_db_"

let repo_to_encoded_graph_dir_name (repo : string) : string option =
  let key =
    let trimmed = String.trim repo in
    if
      String.length trimmed > String.length db_version_prefix
      && String.sub trimmed 0 (String.length db_version_prefix)
         = db_version_prefix
    then
      String.sub trimmed
        (String.length db_version_prefix)
        (String.length trimmed - String.length db_version_prefix)
    else trimmed
  in
  if key = "" then None else Some (encode_graph_dir_name key)

(* repo->graph-dir-key — leading db-version-prefix strip + not-empty. *)
let repo_to_graph_dir_key (repo : string) : string option =
  let trimmed = String.trim repo in
  let key =
    if
      String.length trimmed > String.length db_version_prefix
      && String.sub trimmed 0 (String.length db_version_prefix)
         = db_version_prefix
    then
      String.sub trimmed
        (String.length db_version_prefix)
        (String.length trimmed - String.length db_version_prefix)
    else trimmed
  in
  if key = "" then None else Some key

(* repo-identity / same-repo? — canonical repo comparison used by the
   daemon's bound-repo check. *)
let repo_identity = repo_to_graph_dir_key

let same_repo (a : string) (b : string) : bool =
  match repo_identity a, repo_identity b with
  | Some a', Some b' -> a' = b'
  | _ -> false

(* worker-util/get-pool-name: "logseq-pool-" + graph with all
   db-version-prefix occurrences removed, "/" "\\" ":" -> "_" *)
let pool_name repo =
  let graph = String.trim (str_replace_all repo db_version_prefix "") in
  let graph =
    String.map (fun c -> match c with '/' | '\\' | ':' -> '_' | c -> c) graph
  in
  "logseq-pool-" ^ graph

(* ---------- decoding (list-graphs) ---------- *)

let contains_substring (s : string) (sub : string) : bool =
  let n = String.length s and m = String.length sub in
  let rec find i =
    i + m <= n && (String.sub s i m = sub || find (i + 1))
  in
  m = 0 || find 0

let valid_utf8 (s : string) : bool =
  let n = String.length s in
  let rec loop i =
    i >= n
    ||
    (let dec = String.get_utf_8_uchar s i in
     Uchar.utf_decode_is_valid dec
     && loop (i + Uchar.utf_decode_length dec))
  in
  loop 0

(* js/decodeURIComponent: %XX sequences are UTF-8 code units; malformed
   percent escapes or invalid UTF-8 raise a URIError, mapped to [None]. *)
let uri_decode (s : string) : string option =
  let hex c =
    match c with
    | '0' .. '9' -> Some (Char.code c - Char.code '0')
    | 'a' .. 'f' -> Some (Char.code c - Char.code 'a' + 10)
    | 'A' .. 'F' -> Some (Char.code c - Char.code 'A' + 10)
    | _ -> None
  in
  let n = String.length s in
  let b = Buffer.create n in
  let rec loop i =
    if i >= n then Some ()
    else
      match s.[i] with
      | '%' ->
          if i + 2 < n then
            (match hex s.[i + 1], hex s.[i + 2] with
             | Some h1, Some h2 ->
                 Buffer.add_char b (Char.chr ((h1 * 16) + h2));
                 loop (i + 3)
             | _ -> None)
          else None
      | c ->
          Buffer.add_char b c;
          loop (i + 1)
  in
  match loop 0 with
  | None -> None
  | Some () ->
      let bytes = Buffer.contents b in
      if valid_utf8 bytes then Some bytes else None

(* decode-graph-dir-name — cljs rejects names carrying the legacy
   encodings ("++" or "+3A+") outright, then requires the decoded name to
   be canonical: equal to its own trim and non-empty. *)
let decode_graph_dir_name (dir_name : string) : string option =
  if contains_substring dir_name "++" || contains_substring dir_name "+3A+" then
    None
  else
    match uri_decode (str_replace_all dir_name "~" "%") with
    | None -> None
    | Some decoded ->
        let trimmed = String.trim decoded in
        if decoded = trimmed && trimmed <> "" then Some trimmed else None

(* decode-canonical-graph-dir-key — decoded name must not re-enter the
   db-version-prefix namespace. *)
let decode_canonical_graph_dir_key (encoded : string) : string option =
  match decode_graph_dir_name encoded with
  | Some decoded
    when not
           (String.length decoded >= String.length db_version_prefix
            && String.sub decoded 0 (String.length db_version_prefix)
               = db_version_prefix) ->
      Some decoded
  | _ -> None
