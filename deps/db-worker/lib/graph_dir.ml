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

(* worker-util/get-pool-name: "logseq-pool-" + graph with all
   db-version-prefix occurrences removed, "/" "\\" ":" -> "_" *)
let pool_name repo =
  let graph = str_replace_all (String.trim repo) db_version_prefix "" in
  let graph =
    String.map (fun c -> match c with '/' | '\\' | ':' -> '_' | c -> c) graph
  in
  "logseq-pool-" ^ graph
