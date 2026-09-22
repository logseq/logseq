(* logseq.common.util.macro — `{{macro arg}}` helpers. *)

let open_char = "{{"
let close_char = "}}"

let macro (s : string) : bool =
  Common_util.str_starts_with s open_char && Common_util.str_ends_with s close_char

(* macro/macro-subs — replace $N placeholders with args *)
let macro_subs (s : string) (args : string list) : string =
  let rec loop s args n =
    match args with
    | [] -> s
    | arg :: rest ->
      loop (Common_util.str_replace_all s ("$" ^ string_of_int n) arg) rest (n + 1)
  in
  loop s args 1

let macro_expansion_re = Regexp.compile "\\{\\{(\\S+)\\s+(.*)\\}\\}"

(* macro/macro-expand-value *)
let macro_expand_value (value : string) (macros : (string * string) list) : string =
  match Regexp.exec macro_expansion_re value with
  | Some m ->
    (match m.groups.(1), m.groups.(2) with
     | Some macro, Some args ->
       (match List.assoc_opt macro macros with
        | Some content -> macro_subs content (String.split_on_char ' '
                             args |> List.filter (fun s -> s <> ""))
        | None -> value)
     | _ -> value)
  | None -> value

(* macro/expand-value-if-macro — the cljs version is generic; the import
   path only ever calls it on already-verified non-collection values. *)
let expand_value_if_macro (s : Datascript.value) (macros : (string * string) list)
    : Datascript.value =
  match s with
  | Datascript.String s when macro s -> Datascript.String (macro_expand_value s macros)
  | _ -> s
