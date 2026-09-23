(* mldoc pos_meta positions are UTF-8 byte offsets, so titles must be sliced
   out of the UTF-8 encoding of the source text, not the UTF-16 JS string.
   Buffer.from produces UTF-8 bytes; reading them back as latin1 preserves
   each byte as a character so String.sub can use the byte offsets. *)
let utf8_encode text =
  Node.Buffer.fromString text |> Node.Buffer.toString ~encoding:`latin1

type pos = { start : int; stop : int }

type item =
  | Heading of { level : int; heading : int option; unordered : bool; pos : pos }
  | Drawer of (string * string) list * pos
  | Other of string * int option

let pos_of_json json =
  match Js.Json.decodeObject json with
  | Some obj -> (
      match (Js.Dict.get obj "start_pos", Js.Dict.get obj "end_pos") with
      | Some start, Some stop -> (
          match (Js.Json.decodeNumber start, Js.Json.decodeNumber stop) with
          | Some start, Some stop ->
              Some { start = int_of_float start; stop = int_of_float stop }
          | _ -> None)
      | _ -> None)
  | None -> None

let item_of_json json =
  match Js.Json.decodeArray json with
  | Some pair when Array.length pair >= 2 -> (
      let pos = pos_of_json pair.(1) in
      match Js.Json.decodeArray pair.(0) with
      | Some node when Array.length node >= 1 -> (
          match Js.Json.decodeString node.(0) with
          | Some "Heading" -> (
              match
                ( pos,
                  if Array.length node >= 2 then Js.Json.decodeObject node.(1)
                  else None )
              with
              | Some pos, Some content ->
                  let level =
                    Option.bind
                      (Js.Dict.get content "level")
                      Js.Json.decodeNumber
                    |> Option.map int_of_float |> Option.value ~default:1
                  in
                  let heading =
                    Option.bind
                      (Js.Dict.get content "size")
                      Js.Json.decodeNumber
                    |> Option.map int_of_float
                  in
                  let unordered =
                    Option.bind
                      (Js.Dict.get content "unordered")
                      Js.Json.decodeBoolean
                    |> Option.value ~default:true
                  in
                  Heading { level; heading; unordered; pos }
              | _ -> Other ("Heading", Option.map (fun p -> p.start) pos))
          | Some "Property_Drawer" ->
              let pairs =
                match
                  if Array.length node >= 2 then Js.Json.decodeArray node.(1)
                  else None
                with
                | Some entries ->
                    entries
                    |> Array.to_list
                    |> List.filter_map (fun entry ->
                        match Js.Json.decodeArray entry with
                        | Some fields when Array.length fields >= 2 -> (
                            match
                              ( Js.Json.decodeString fields.(0),
                                Js.Json.decodeString fields.(1) )
                            with
                            | Some key, Some value -> Some (key, value)
                            | _ -> None)
                        | _ -> None)
                | None -> []
              in
              Drawer (pairs, Option.value pos ~default:{ start = 0; stop = 0 })
          | Some kind -> Other (kind, Option.map (fun p -> p.start) pos)
          | None -> Other ("?", None))
      | _ -> Other ("?", None))
  | _ -> Other ("?", None)

type node = {
  title : string;
  level : int;
  heading : int option;
  properties : (string * string) list;
  children : int Vec.t ref;
}

let is_space = function ' ' | '\t' | '\n' | '\r' -> true | _ -> false

let trim_left text =
  let length = String.length text in
  let rec loop index =
    if index < length && is_space text.[index] then loop (index + 1) else index
  in
  let start = loop 0 in
  String.sub text start (length - start)

(* Port of graph-parser text/remove-level-spaces for markdown:
   trim-left then strip a leading run of '-' plus one optional space. *)
let remove_level_spaces text =
  let text = trim_left text in
  let length = String.length text in
  let index = ref 0 in
  while !index < length && text.[!index] = '-' do
    incr index
  done;
  if !index > 0 then (
    if !index < length && is_space text.[!index] then incr index;
    String.sub text !index (length - !index))
  else text

let safe_sub text start length =
  if start >= String.length text then ""
  else
    String.sub text start (min length (String.length text - start))

(* Port of graph-parser mldoc/remove-indentation-spaces (remove-first-line?
   false): non-first lines drop `level` leading columns when they are all
   whitespace, otherwise their leading whitespace is trimmed. *)
let remove_indentation_spaces text level =
  match String.split_on_char '\n' text with
  | [] -> text
  | first :: rest ->
      let rest =
        List.map
          (fun line ->
            if String.trim (safe_sub line 0 level) = "" then
              safe_sub line level (String.length line - level)
            else trim_left line)
          rest
      in
      String.concat "\n" (first :: rest)

let strip_heading_marker title =
  let length = String.length title in
  let rec hashes index =
    if index < length && title.[index] = '#' then hashes (index + 1)
    else index
  in
  let index = hashes 0 in
  if index > 0 && index <= 6 then
    let rec spaces i =
      if i < length && is_space title.[i] then spaces (i + 1) else i
    in
    String.sub title (spaces index) (length - spaces index)
  else title

let title_of_range payload ~start ~stop ~exclude_ranges ~level ~heading =
  let ranges = List.sort (fun (a, _) (b, _) -> compare a b) exclude_ranges in
  let rec parts cursor ranges =
    match ranges with
    | (s, e) :: rest when s < stop && e > start ->
        let s' = max s start and e' = min e stop in
        if s' > cursor then
          String.sub payload cursor (s' - cursor) :: parts e' rest
        else parts (max cursor e') rest
    | _ :: rest -> parts cursor rest
    | [] ->
        if cursor < stop then
          [ String.sub payload cursor (stop - cursor) ]
        else []
  in
  let text = String.concat "" (parts start ranges) in
  let text = remove_level_spaces text in
  let text = remove_indentation_spaces text (level + 1) in
  let text = match heading with Some _ -> strip_heading_marker text | None -> text in
  String.trim text |> Ustring.of_string |> Ustring.to_string

type frame = {
  node_index : int;
  parent_index : int;
  level : int;
  indent : int;
}

let of_markdown text =
  let payload = utf8_encode text in
  let text_length = String.length payload in
  let items =
    match Js.Json.decodeArray (Mldoc.parse_ast text) with
    | Some items -> Array.map item_of_json items
    | None -> [||]
  in
  let headings =
    let collected = ref [] in
    let pending = ref [] in
    let next_start = ref text_length in
    let first_heading_start = ref max_int in
    let others = ref [] in
    for i = Array.length items - 1 downto 0 do
      match items.(i) with
      | Drawer (pairs, pos) -> pending := (pairs, pos) :: !pending
      | Heading { level; heading; unordered; pos } ->
          let input_level =
            if Option.is_some heading && not unordered then 1 else level
          in
          let drawers = List.rev !pending in
          let exclude_ranges =
            List.map (fun (_, p) -> (p.start, p.stop)) drawers
          in
          let properties =
            List.concat_map (fun (pairs, _) -> pairs) drawers
          in
          let title =
            title_of_range payload ~start:pos.start ~stop:!next_start
              ~exclude_ranges ~level:input_level ~heading
          in
          collected :=
            {
              title;
              level = input_level;
              heading;
              properties;
              children = ref Vec.empty;
            }
            :: !collected;
          pending := [];
          next_start := pos.start;
          first_heading_start := pos.start
      | Other (kind, start) -> others := (kind, start) :: !others
    done;
    let dropped =
      (* Non-heading AST nodes inside an outline are harmless — their source
         text lands in the surrounding heading's title slice. Only content
         before the first heading is lost entirely. *)
      !others
      |> List.filter_map (fun (kind, start) ->
             match start with
             | Some start when start < !first_heading_start -> Some kind
             | _ -> None)
    in
    (Array.of_list !collected, !pending, dropped)
  in
  let headings, leading_drawers, dropped = headings in
  if dropped <> [] then
    Error
      (Error.make Error.Invalid_blocks
         ("unsupported markdown content before the first block: "
         ^ String.concat ", " (List.rev dropped)))
  else if leading_drawers <> [] then
    Error
      (Error.make Error.Invalid_blocks
         "properties before the first block are not supported")
  else if Array.length headings = 0 then
    Error
      (Error.make Error.Invalid_blocks
         "blocks markdown produced no blocks")
  else
    let count = Array.length headings in
    let parents = Array.make count (-1) in
    let depths = Array.make count 1 in
    let stack =
      ref [ { node_index = -1; parent_index = -1; level = 0; indent = 0 } ]
    in
    Array.iteri
      (fun index (node : node) ->
        let input = node.level in
        let last_popped = ref None in
        while input < (List.hd !stack).indent do
          let top = List.hd !stack in
          stack := List.tl !stack;
          last_popped := Some top
        done;
        let top = List.hd !stack in
        if input = top.indent then (
          let parent_index = top.parent_index in
          parents.(index) <- parent_index;
          depths.(index) <- top.level;
          stack := List.tl !stack;
          stack :=
            { node_index = index; parent_index; level = top.level; indent = input }
            :: !stack)
        else if Option.is_none !last_popped then (
          parents.(index) <- top.node_index;
          depths.(index) <- top.level + 1;
          stack :=
            {
              node_index = index;
              parent_index = top.node_index;
              level = top.level + 1;
              indent = input;
            }
            :: !stack)
        else
          let popped = Option.get !last_popped in
          parents.(index) <- top.node_index;
          depths.(index) <- popped.level;
          stack :=
            {
              node_index = index;
              parent_index = top.node_index;
              level = popped.level;
              indent = popped.indent;
            }
            :: !stack)
      headings;
    Array.iteri
      (fun index _ ->
        let parent = parents.(index) in
        if parent >= 0 then
          headings.(parent).children :=
            Vec.push_back !(headings.(parent).children) index)
      headings;
    let rec to_block index =
      let node = headings.(index) in
      let properties =
        Vec.of_list
          (List.map
             (fun (key, value) ->
               { Property.key = Property.Key_name key;
                 value = Edn_util.string value })
             node.properties)
      in
      let properties =
        match node.heading with
        | Some size ->
            Vec.push_front properties
              {
                Property.key =
                  Property.Key_ident
                    (Edn_util.keyword_t "logseq.property/heading");
                value = Edn_util.int64 (Int64.of_int size);
              }
        | None -> properties
      in
      {
        (Block.make ~title:node.title
           ~children:(Vec.map to_block !(node.children))
           ())
        with
        Block.level = Some depths.(index);
        properties;
      }
    in
    let roots =
      Vec.of_list
        (Array.to_list (Array.mapi (fun i _ -> i) headings)
        |> List.filter (fun i -> parents.(i) < 0)
        |> List.map to_block)
    in
    Ok roots
