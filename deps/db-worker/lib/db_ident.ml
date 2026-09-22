(* Port of logseq.db.frontend.db-ident (deps/db/src/logseq/db/frontend/db_ident.cljc)
   and the user-namespace wrappers in db-class/db-property. *)

open Datascript

(* db-ident/ensure-unique-db-ident *)
let ensure_unique_db_ident db (db_ident : string) : string =
  match entity db (Ident db_ident) with
  | None -> db_ident
  | Some _ ->
      let prefix = db_ident ^ "-" in
      let rows =
        q_string db
          ~inputs:[ Arg_scalar (Result_value (String prefix)) ]
          "[:find [?ident ...] :in $ ?ident-name :where \
           [?b :db/ident ?ident] [(str ?ident) ?str-ident] \
           [(clojure.string/starts-with? ?str-ident ?ident-name)]]"
      in
      let idents =
        List.filter_map
          (function
            | [ Result_value (Keyword k) ] -> Some k
            | _ -> None)
          rows
      in
      let nums =
        List.filter_map
          (fun ident ->
             if String.length ident > String.length prefix
                && String.sub ident 0 (String.length prefix) = prefix
             then int_of_string_opt
                    (String.sub ident (String.length prefix)
                       (String.length ident - String.length prefix))
             else None)
          idents
      in
      let suffix =
        match nums with
        | [] -> 1
        | _ -> List.fold_left max min_int nums + 1
      in
      (match String.index_opt db_ident '/' with
       | Some i ->
           String.sub db_ident 0 (i + 1)
           ^ String.sub db_ident (i + 1) (String.length db_ident - i - 1)
           ^ "-" ^ string_of_int suffix
       | None -> db_ident ^ "-" ^ string_of_int suffix)

(* db-ident/non-int-char-range *)
let non_int_char_range =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

(* db-ident/alphabet *)
let alphabet =
  "_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

(* db-ident/nano-id *)
let nano_id ?(size = 21) () : string =
  let bytes = Crypto.random_bytes size in
  let buf = Buffer.create size in
  String.iter
    (fun c -> Buffer.add_char buf alphabet.[Char.code c land 0x3f])
    bytes;
  Buffer.contents buf

(* db-ident/normalize-ident-name-part *)
let normalize_ident_name_part (name_string : string) : string =
  let s =
    if String.length name_string > 0
       && name_string.[0] >= '0' && name_string.[0] <= '9'
    then "NUM-" ^ name_string
    else name_string
  in
  let keep c =
    (c >= '0' && c <= '9') || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
    || String.contains "=*+!_'?<>=-" c
  in
  String.to_seq s |> Seq.filter keep |> String.of_seq

(* db-ident/create-db-ident-from-name *)
let create_db_ident_from_name ~(user_namespace : string) ~(name_string : string) : string =
  let ns =
    match String.index_opt user_namespace '/' with
    | Some i -> String.sub user_namespace (i + 1) (String.length user_namespace - i - 1)
    | None -> user_namespace
  in
  (* assert (not (re-find #"^(logseq|block)(\.|$)" (name user-namespace))) *)
  if String.length ns >= 6 && String.sub ns 0 6 = "logseq"
     && (String.length ns = 6 || ns.[6] = '.')
  then invalid_arg "New ident is not allowed to use an internal namespace"
  else if String.length ns >= 5 && String.sub ns 0 5 = "block"
          && (String.length ns = 5 || ns.[5] = '.')
  then invalid_arg "New ident is not allowed to use an internal namespace";
  if Option.is_some (Runtime_env.env "LOGSEQ_STABLE_IDENTS") then
    user_namespace ^ "/" ^ normalize_ident_name_part name_string
  else
    let plugin =
      String.length user_namespace >= 13
      && String.sub user_namespace 0 13 = "plugin.class."
    in
    let suffix =
      if plugin then ""
      else
        let rc = Crypto.random_bytes 1 in
        "-"
        ^ String.make 1 non_int_char_range.[Char.code rc.[0] mod 52]
        ^ nano_id ~size:7 ()
    in
    user_namespace ^ "/" ^ normalize_ident_name_part name_string ^ suffix

(* db-class/create-user-class-ident-from-name *)
let create_user_class_ident_from_name ?(db : db option) ?(ident_namespace = "user.class")
    (class_name : string) : string =
  let db_ident =
    create_db_ident_from_name ~user_namespace:ident_namespace ~name_string:class_name
  in
  match db with
  | Some db -> ensure_unique_db_ident db db_ident
  | None -> db_ident

(* db-property/default-user-namespace *)
let default_user_namespace = "user.property"

(* db-property/create-user-property-ident-from-name *)
let create_user_property_ident_from_name ?(user_namespace = default_user_namespace)
    (property_name : string) : string =
  create_db_ident_from_name ~user_namespace ~name_string:property_name

(* db-ident/replace-db-ident-random-suffix *)
let replace_db_ident_random_suffix (ident : string) (new_suffix : string) : string =
  assert (String.length new_suffix = 8);
  match String.index_opt ident '/' with
  | Some i ->
      let ns = String.sub ident 0 i in
      let name = String.sub ident (i + 1) (String.length ident - i - 1) in
      let name' =
        let n = String.length name in
        if n >= 9 && name.[n - 9] = '-'
        then String.sub name 0 (n - 9) ^ "-" ^ new_suffix
        else name
      in
      ns ^ "/" ^ name'
  | None -> ident
