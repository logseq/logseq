type t = Js.Re.t

type re_match =
  { groups : string option array
  ; offset : int
  ; last : int }

external make_regexp : string -> string -> Js.Re.t = "RegExp" [@@mel.new]

external source : Js.Re.t -> string = "source" [@@mel.get]

external ignoreCase : Js.Re.t -> bool = "ignoreCase" [@@mel.get]

external set_lastIndex : Js.Re.t -> int -> unit = "lastIndex" [@@mel.set]

(* cljs re-pattern is case-sensitive; (?i) maps to the "i" flag. *)
let compile ?(caseless = false) s =
  make_regexp s (if caseless then "i" else "")

let global t =
  make_regexp (source t) (if ignoreCase t then "gi" else "g")

let exec_result_to_match (result : Js.Re.result) : re_match =
  let groups = Array.map Js.Nullable.toOption (Js.Re.captures result) in
  let match_ =
    match groups with [||] -> "" | xs -> Option.value ~default:"" xs.(0)
  in
  let offset = Js.Re.index result in
  { groups; offset; last = offset + String.length match_ }

let test t s =
  match Js.Re.exec ~str:s t with Some _ -> true | None -> false

let exec ?(pos = 0) t s =
  if pos = 0 then
    Option.map exec_result_to_match (Js.Re.exec ~str:s t)
  else
    (* global flag makes lastIndex meaningful *)
    let g = global t in
    set_lastIndex g pos;
    Option.map exec_result_to_match (Js.Re.exec ~str:s g)

let replace t ~f s =
  match Js.Re.exec ~str:s t with
  | None -> s
  | Some result ->
      let m = exec_result_to_match result in
      let match_ =
        match m.groups with [||] -> "" | xs -> Option.value ~default:"" xs.(0)
      in
      let rep = f ~match_ ~groups:m.groups ~offset:m.offset ~input:s in
      String.sub s 0 m.offset
      ^ rep
      ^ String.sub s m.last (String.length s - m.last)

let replace_all t ~f s =
  let b = Buffer.create (String.length s) in
  let g = global t in
  let rec loop pos =
    set_lastIndex g pos;
    match Js.Re.exec ~str:s g with
    | None -> Buffer.add_string b (String.sub s pos (String.length s - pos))
    | Some result ->
        let m = exec_result_to_match result in
        let match_ =
          match m.groups with [||] -> "" | xs -> Option.value ~default:"" xs.(0)
        in
        Buffer.add_string b (String.sub s pos (m.offset - pos));
        Buffer.add_string b (f ~match_ ~groups:m.groups ~offset:m.offset ~input:s);
        (* empty match: emit one char and advance, as JS /g does *)
        if m.last = m.offset && m.last < String.length s then begin
          Buffer.add_char b s.[m.last];
          loop (m.last + 1)
        end else if m.last > m.offset then loop m.last
  in
  loop 0;
  Buffer.contents b
