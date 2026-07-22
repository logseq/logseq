let left_braces = "{{"
let right_braces = "}}"

let is_macro value =
  let trimmed = Js.String.trim value in
  String.starts_with ~prefix:left_braces trimmed
  && String.ends_with ~suffix:right_braces trimmed

let replace_all value target replacement =
  value |> Js.String.split ~sep:target |> Js.Array.join ~sep:replacement

let substitute_vector macro_content arguments =
  let rec loop result index =
    match Rrbvec.nth_opt arguments index with
    | None -> result
    | Some argument ->
        loop
          (replace_all result ("$" ^ string_of_int (index + 1)) argument)
          (index + 1)
  in
  loop macro_content 0

let substitute macro_content arguments =
  substitute_vector macro_content (Rrbvec.of_array arguments)

let expansion_re = Js.Re.fromString "^\\{\\{(\\S+)\\s+(.*)\\}\\}$"
let whitespace_re = Js.Re.fromString "\\s+"
let capture captures index = captures.(index) |> Js.Nullable.toOption

let expansion value =
  match Js.Re.exec ~str:value expansion_re with
  | None -> None
  | Some result ->
      let captures = Js.Re.captures result in
      Option.bind (capture captures 1) (fun name ->
          capture captures 2 |> Option.map (fun arguments -> (name, arguments)))

let split_arguments arguments =
  arguments
  |> Js.String.splitByRe ~regexp:whitespace_re
  |> Array.map (function
    | Some argument -> argument
    | None -> failwith "macro argument split produced a missing value")
  |> Rrbvec.of_array

let expand_value_if_macro value lookup =
  if not (is_macro value) then value
  else
    match expansion value with
    | None -> value
    | Some (name, arguments) -> (
        match lookup name with
        | None -> value
        | Some content -> substitute_vector content (split_arguments arguments))
