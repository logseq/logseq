(* Port of logseq.common.date — journal title formatters and loose date
   normalization shared by worker and frontend namespaces. Formatter
   lists and parsing live in Date_time_util. *)

(* slash-journal-title-formatters *)
let slash_journal_title_formatters : string list =
  List.filter
    (fun f -> String.contains f '/')
    Date_time_util.built_in_journal_title_formatters

let journal_title_formatters (date_formatter : string option) : string list =
  Date_time_util.journal_title_formatters date_formatter

(* normalize-date — try each formatter on [s], first parse wins.
   Heavy-cost fn like the cljs original. Returns the parsed (y, m, d). *)
let normalize_date (s : string) (date_formatter : string option)
    : (int * int * int) option =
  List.find_map
    (fun fmt -> Date_time_util.date_of_formatter fmt s)
    (journal_title_formatters date_formatter)

(* normalize-journal-title — capitalize then normalize-date; nil title or
   unparseable title returns None. *)
let normalize_journal_title (title : string option)
    (date_formatter : string option) : (int * int * int) option =
  match title with
  | Some t -> normalize_date (Date_time_util.capitalize_all t) date_formatter
  | None -> None

(* valid-journal-title? — loose rule (also accepts strings like 3/4/5). *)
let valid_journal_title (title : string) (date_formatter : string option)
    : bool =
  Option.is_some (normalize_journal_title (Some title) date_formatter)

(* valid-journal-title-with-slash? *)
let valid_journal_title_with_slash (title : string) : bool =
  List.exists
    (fun f -> valid_journal_title title (Some f))
    slash_journal_title_formatters
