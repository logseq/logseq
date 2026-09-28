(* Faithful port of logseq.db.frontend.inputs
   (deps/db/src/logseq/db/frontend/inputs.cljs): resolves the special
   :inputs keywords (:current-page, :query-page, :current-block,
   :parent-block, :today/:yesterday/:tomorrow, :right-now-ms), relative
   dates (:+7d, :-1w, ...), time-suffixed dates (:today-0230,
   :+7d-0230, :1d-before-ms ...), and [[page-ref]] string inputs into
   concrete query input values. *)

open Datascript

(* cljs opts map: {:keys [current-block-uuid current-page-fn]} *)
type context =
  { current_block_uuid : string option
  ; current_page_fn : unit -> string option
  }

let kw_name (k : string) : string =
  match String.index_opt k '/' with
  | Some i -> String.sub k (i + 1) (String.length k - i - 1)
  | None -> k

let kw_namespace (k : string) : string option =
  match String.index_opt k '/' with
  | Some i -> Some (String.sub k 0 i)
  | None -> None

let is_digit c = c >= '0' && c <= '9'

(* Split "+7d" into (direction, amount, unit); unit "" when absent.
   For inputs like "+7d-ms"/"-3w-start" also returns the trailing
   "-ms"/"-start"/"-0230" part. *)
let split_offset (name : string) : (string * int * string * string option) option =
  let n = String.length name in
  if n < 2 || (name.[0] <> '+' && name.[0] <> '-') then None
  else
    let direction = String.sub name 0 1 in
    let i = ref 1 in
    while !i < n && is_digit name.[!i] do
      incr i
    done;
    if !i = 1 || !i >= n then None
    else
      let amount = int_of_string (String.sub name 1 (!i - 1)) in
      let unit = String.sub name !i 1 in
      if not (String.contains "dwmy" unit.[0]) then None
      else if !i + 1 = n then Some (direction, amount, unit, None)
      else Some (direction, amount, unit, Some (String.sub name (!i + 1) (n - !i - 1)))

(* keyword-input-dispatch — cljs re-find equivalents, hand-implemented
   (the Regexp platform vm only supports first-match). *)

(* #"^[+-]\d+[dwmy]?$" *)
let match_relative_date (name : string) : bool =
  match split_offset name with
  | Some (_, _, _, None) -> true
  | _ -> false

(* #"^[+-]\d+[dwmy]-(ms|start|end|\d{2}|\d{4}|\d{6}|\d{9})?$" *)
let match_relative_date_time (name : string) : bool =
  match split_offset name with
  | Some (_, _, _, Some suffix) ->
      let suffix = String.sub suffix 1 (String.length suffix - 1) in
      (* suffix after the '-' *)
      (* cljs dispatch regex allows an empty optional group after the
         '-', but the resolve re-find requires a non-empty ts, so "+7d-"
         is dispatched then resolves to nil (unresolved). *)
      if suffix = "ms" || suffix = "start" || suffix = "end" then true
      else
        let l = String.length suffix in
        (l = 2 || l = 4 || l = 6 || l = 9)
        && (let rec digits i = i >= l || (is_digit suffix.[i] && digits (i + 1)) in
            digits 0)
  | _ -> false

(* #"^today-(start|end|\d{2}|\d{4}|\d{6}|\d{9})$" *)
let match_today_time (name : string) : bool =
  if String.length name > 6 && String.sub name 0 6 = "today-" then
    let suffix = String.sub name 6 (String.length name - 6) in
    if suffix = "start" || suffix = "end" then true
    else
      let l = String.length suffix in
      (l = 2 || l = 4 || l = 6 || l = 9)
      && (let rec digits i = i >= l || (is_digit suffix.[i] && digits (i + 1)) in
          digits 0)
  else false

(* #"^\d+d(-before|-after|-before-ms|-after-ms)?$" *)
let match_deprecated (name : string) : bool =
  let n = String.length name in
  let i = ref 0 in
  while !i < n && is_digit name.[!i] do
    incr i
  done;
  !i > 0
  && !i < n
  && name.[!i] = 'd'
  && (let rest = String.sub name (!i + 1) (n - !i - 1) in
      rest = "" || rest = "-before" || rest = "-after" || rest = "-before-ms"
      || rest = "-after-ms")

type dispatch =
  | Fixed
  | Relative_date
  | Relative_date_time
  | Today_time
  | Deprecated_relative_date
  | Unresolved

let dispatch (k : string) : dispatch =
  match k with
  | "current-page" | "query-page" | "current-block" | "parent-block"
  | "today" | "yesterday" | "tomorrow" | "right-now-ms" ->
      Fixed
  | _ ->
      let name = kw_name k in
      if match_relative_date name then Relative_date
      else if match_relative_date_time name then Relative_date_time
      else if k = "start-of-today-ms" || k = "end-of-today-ms" || match_today_time name
      then Today_time
      else if match_deprecated name then Deprecated_relative_date
      else Unresolved

let ends_with s suffix =
  let n = String.length s and l = String.length suffix in
  n >= l && String.sub s (n - l) l = suffix

let contains_sub s sub =
  let n = String.length s and l = String.length sub in
  let rec find i =
    if i + l > n then false
    else if String.sub s i l = sub then true
    else find (i + 1)
  in
  l > 0 && find 0

(* old->new-relative-date-format: :1d-before -> :today/-1d,
   :1d-after-ms -> :today/+1d-ms *)
let old_to_new_relative_date_format (k : string) : string =
  let name = kw_name k in
  let i = ref 0 in
  while !i < String.length name && is_digit name.[!i] do
    incr i
  done;
  let count' = String.sub name 0 !i in
  let plus_minus = if contains_sub name "after" then "+" else "-" in
  let ms = if ends_with name "-ms" then "-ms" else "" in
  "today/" ^ plus_minus ^ count' ^ "d" ^ ms

(* get-relative-date — only the "today" namespace is supported in cljs *)
let get_relative_date (k : string) : int64 =
  match kw_namespace k with
  | None | Some "today" -> Date_time_util.today_ms ()
  | Some ns -> invalid_arg ("unsupported date namespace: " ^ ns)

(* get-offset-date *)
let get_offset_date (relative_to : int64) (direction : string) (amount : int)
    (unit : string) : int64 =
  let p =
    match unit with
    | "d" -> Date_time_util.Days
    | "w" -> Date_time_util.Weeks
    | "m" -> Date_time_util.Months
    | "y" -> Date_time_util.Years
    | _ -> invalid_arg ("unsupported offset unit: " ^ unit)
  in
  match direction with
  | "+" -> Date_time_util.plus p amount relative_to
  | "-" -> Date_time_util.minus p amount relative_to
  | _ -> invalid_arg ("unsupported offset direction: " ^ direction)

(* get-ts-units — offset-time is the raw suffix string ("ms", "start",
   "end", or HHMM[SS[mmm]] digits). *)
let get_ts_units (offset_direction : string) (offset_time : string) :
    int * int * int * int =
  match offset_time with
  | "ms" ->
      if offset_direction = "+" then (23, 59, 59, 999) else (0, 0, 0, 0)
  | "start" -> (0, 0, 0, 0)
  | "end" -> (23, 59, 59, 999)
  | _ ->
      let t = offset_time ^ "000000000" in
      let pair i = int_of_string (String.sub t i 2) in
      (min 23 (pair 0), min 59 (pair 2), min 59 (pair 4),
       min 999 (int_of_string (String.sub t 6 3)))

let current_block_ent (db : db) (ctx : context) : entity option =
  match ctx.current_block_uuid with
  | Some uuid -> entity db (Lookup_ref ("block/uuid", Uuid uuid))
  | None -> None

(* resolve-keyword-input — returns None for the cljs nil cases;
   resolve-input falls back to the unresolved input. *)
let rec resolve_keyword_input (db : db) (k : string) (ctx : context) :
    value option =
  match dispatch k with
  | Fixed ->
      (match k with
       | "current-page" ->
           (match ctx.current_page_fn () with
            | Some title -> Some (String (Unicode.lowercase title))
            | None -> None)
       | "query-page" ->
           (match current_block_ent db ctx with
            | Some block ->
                (match Entity_refs.ref_ent block "block/page" with
                 | Some page -> Ldb.value page "block/name"
                 | None -> None)
            | None -> None)
       | "current-block" ->
           Option.map (fun (e : entity) -> Int64 (Int64.of_int e.id)) (current_block_ent db ctx)
       | "parent-block" ->
           (match current_block_ent db ctx with
            | Some block ->
                Option.map (fun (p : entity) -> Int64 (Int64.of_int p.id))
                  (Entity_refs.ref_ent block "block/parent")
            | None -> None)
       | "today" ->
           Some
             (Int64
                (Int64.of_int
                   (Date_time_util.date_to_int (Date_time_util.today_ms ()))))
       | "yesterday" ->
           Some
             (Int64
                (Int64.of_int
                   (Date_time_util.date_to_int
                    (Date_time_util.minus Days 1 (Date_time_util.today_ms ())))))
       | "tomorrow" ->
           Some
             (Int64
                (Int64.of_int
                   (Date_time_util.date_to_int
                    (Date_time_util.plus Days 1 (Date_time_util.today_ms ())))))
       | "right-now-ms" ->
           Some (Common_util.value_of_ms (Date_time_util.time_ms ()))
       | _ -> None)
  | Today_time ->
      let hh, mm, ss, ms =
        match k with
        | "start-of-today-ms" -> (0, 0, 0, 0)
        | "end-of-today-ms" -> (23, 59, 59, 999)
        | _ -> get_ts_units "" (String.sub (kw_name k) 6 (String.length (kw_name k) - 6))
      in
      Some
        (Common_util.value_of_ms
           (Date_time_util.date_at_local_ms
              (Date_time_util.today_ms ()) hh mm ss ms))
  | Relative_date ->
      let name = kw_name k in
      let relative_to = get_relative_date k in
      (match split_offset name with
       | Some (direction, amount, unit, None) ->
           let offset_date = get_offset_date relative_to direction amount unit in
           Some (Int64 (Int64.of_int (Date_time_util.date_to_int offset_date)))
       | _ -> invalid_arg ("invalid relative date input: " ^ k))
  | Relative_date_time ->
      let name = kw_name k in
      let relative_to = get_relative_date k in
      (match split_offset name with
       | Some (direction, amount, unit, Some suffix) when suffix <> "" ->
           let ts = String.sub suffix 1 (String.length suffix - 1) in
           let offset_date =
             get_offset_date relative_to direction amount unit
           in
           let hh, mm, ss, ms = get_ts_units direction ts in
           Some
             (Common_util.value_of_ms
                (Date_time_util.date_at_local_ms offset_date hh mm ss ms))
       | _ -> invalid_arg ("invalid relative date-time input: " ^ k))
  | Deprecated_relative_date ->
      resolve_keyword_input db (old_to_new_relative_date_format k) ctx
  | Unresolved -> None

(* resolve-input *)
let resolve_input (db : db) (input : value) (ctx : context) : value =
  match input with
  | Keyword k ->
      (match resolve_keyword_input db k ctx with
       | Some v -> v
       | None -> input)
  | String s when Page_ref.is_page_ref s ->
      (match Page_ref.get_page_name s with
       | Some name -> String (Unicode.lowercase name)
       | None -> input)
  | _ -> input
