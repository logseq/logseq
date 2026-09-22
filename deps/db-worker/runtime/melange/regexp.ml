type t = Js.Re.t

external make_regexp : string -> string -> Js.Re.t = "RegExp" [@@mel.new]

let compile s = make_regexp s "i"

let test t s =
  match Js.Re.exec ~str:s t with
  | Some _ -> true
  | None -> false

let replace t ~f s =
  match Js.Re.exec ~str:s t with
  | None -> s
  | Some result ->
      let captures = Js.Re.captures result in
      let groups =
        Array.map Js.Nullable.toOption captures
      in
      let match_ =
        match groups with
        | [||] -> ""
        | xs -> Option.value ~default:"" xs.(0)
      in
      let offset = Js.Re.index result in
      let input = Js.Re.input result in
      let rep = f ~match_ ~groups ~offset ~input in
      String.sub s 0 offset
      ^ rep
      ^ String.sub s (offset + String.length match_)
          (String.length s - offset - String.length match_)
