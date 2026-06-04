let is_unreserved_uri_char = function
  | 'A' .. 'Z'
  | 'a' .. 'z'
  | '0' .. '9'
  | '-' | '_' | '.' | '!' | '*' | '\'' | '(' | ')' ->
      true
  | _ -> false

let hex_digit value =
  Char.uppercase_ascii
    (Char.chr
       (if value < 10 then Char.code '0' + value else Char.code 'A' + value - 10))

let encode_graph_dir_name graph_name =
  let buffer = Buffer.create (String.length graph_name) in
  String.iter
    (fun c ->
      match c with
      | ' ' -> Buffer.add_char buffer ' '
      | _ when is_unreserved_uri_char c -> Buffer.add_char buffer c
      | _ ->
          let code = Char.code c in
          Buffer.add_char buffer '~';
          Buffer.add_char buffer (hex_digit (code lsr 4));
          Buffer.add_char buffer (hex_digit (code land 0x0f)))
    graph_name;
  Buffer.contents buffer

let graph_dir_name_of_repo repo =
  Cli_config.repo_to_graph repo
  |> Cli_primitive.string_of_graph
  |> encode_graph_dir_name

let hex_value = function
  | '0' .. '9' as c -> Some (Char.code c - Char.code '0')
  | 'a' .. 'f' as c -> Some (10 + Char.code c - Char.code 'a')
  | 'A' .. 'F' as c -> Some (10 + Char.code c - Char.code 'A')
  | _ -> None

let decode_graph_dir_name dir_name =
  let len = String.length dir_name in
  let buffer = Buffer.create len in
  let rec loop index =
    if index >= len then Some (Buffer.contents buffer)
    else
      match dir_name.[index] with
      | '~' when index + 2 < len -> (
          match
            (hex_value dir_name.[index + 1], hex_value dir_name.[index + 2])
          with
          | Some hi, Some lo ->
              Buffer.add_char buffer (Char.chr ((hi lsl 4) lor lo));
              loop (index + 3)
          | _ -> None)
      | '~' -> None
      | c ->
          Buffer.add_char buffer c;
          loop (index + 1)
  in
  loop 0

let canonical_graph_name_of_dir dir_name =
  match decode_graph_dir_name dir_name with
  | Some graph_name
    when graph_name <> "" && encode_graph_dir_name graph_name = dir_name ->
      Some graph_name
  | _ -> None
