(* Native twin of icon/emoji_mart.ml — emoji dataset + search over a
   generated table from the same @emoji-mart/data source the web bundle
   ships (resources/js/emoji-data.js). Stored {type:emoji,id} values keep
   the emoji-mart ids so graphs stay web-compatible. *)

let install () = ()

let emoji_id_valid (id : string) : bool = id <> ""

(* GENERATED module: Emoji_mart_data.table is produced at build time by
   tools/emoji_gen.exe from resources/js/emoji-data.js (@emoji-mart/data
   native set) — (id, display name, native char, search keywords)
   mirroring the web picker dataset so stored {type:emoji,id} values
   stay mart-compatible. *)
let table = Emoji_mart_data.table

let emoji_char (id : string) : string option =
  let found = ref None in
  Array.iter
    (fun (eid, _name, ch, _kw) -> if eid = id then found := Some ch)
    table;
  !found

let all_emojis () : (string * string) list =
  Array.to_list (Array.map (fun (eid, name, _ch, _kw) -> (eid, name)) table)

let emoji_count () = Array.length table

(* sync variant of the mart SearchIndex lookup: substring match on id,
   name, and keywords; ordered by id-then-name match quality *)
let search (q : string) (f : (string * string) list -> unit) =
  let q = String.lowercase_ascii (String.trim q) in
  if q = "" then f []
  else begin
    let contains_ci hay needle =
      let h = String.lowercase_ascii hay in
      let n = String.length needle and m = String.length h in
      let rec go i =
        if i + n > m then false
        else if String.sub h i n = needle then true
        else go (i + 1)
      in
      go 0
    in
    let hits =
      Array.to_list table
      |> List.filter (fun (eid, name, _ch, kw) ->
             contains_ci eid q || contains_ci name q || contains_ci kw q)
      |> List.stable_sort (fun (a, _, _, _) (b, _, _, _) ->
             let ap =
               String.starts_with ~prefix:q (String.lowercase_ascii a)
             in
             let bp =
               String.starts_with ~prefix:q (String.lowercase_ascii b)
             in
             compare bp ap)
    in
    let rec take n xs =
      match n, xs with
      | 0, _ | _, [] -> []
      | n, x :: tl -> x :: take (n - 1) tl
    in
    f (List.map (fun (eid, name, _ch, _kw) -> (eid, name)) (take 100 hits))
  end
