type extend = { title : string option; built_in : bool }

let join ~separator values =
  let buffer = Buffer.create (Rrbvec.length values * 16) in
  Rrbvec.iteri
    (fun index value ->
      if index > 0 then Buffer.add_string buffer separator;
      Buffer.add_string buffer value)
    values;
  Buffer.contents buffer

let first_some left right = match left with Some _ -> left | None -> right

let class_title_with_extends ~stored_title extends ~display_title =
  let _, titles =
    Rrbvec.fold_left
      (fun (count, titles) extend ->
        if
          count >= 2 || extend.built_in
          || Option.equal String.equal stored_title extend.title
        then (count, titles)
        else
          ( count + 1,
            Rrbvec.push_back titles (Option.value ~default:"" extend.title) ))
      (0, Rrbvec.empty) extends
  in
  let title = first_some display_title stored_title in
  if Rrbvec.length titles = 0 then title
  else
    Some
      (join ~separator:" | " titles
      ^ "/"
      ^ Option.value ~default:"" title)

let truncate_title ~truncate = function
  | Some title when truncate && String.length title > 256 ->
      Some (String.sub title 0 256)
  | title -> title

let append_tags tag_titles title =
  if Rrbvec.length tag_titles = 0 then title
  else
    let rendered =
      tag_titles |> Rrbvec.map (fun value -> "#" ^ value)
      |> join ~separator:", "
    in
    Some (Option.value ~default:"" title ^ " " ^ rendered)

let unique_title ~built_in ~stored_title ~class_ ~class_conflict ~extends
    ~display_title ~truncate ~tag_titles ~alias =
  if built_in then stored_title
  else
    let base_title =
      if class_ && class_conflict then
        class_title_with_extends ~stored_title extends ~display_title
      else first_some display_title stored_title
    in
    let title =
      base_title |> truncate_title ~truncate |> append_tags tag_titles
    in
    Option.map
      (fun value ->
        match alias with
        | None -> value
        | Some alias -> value ^ " -> alias: " ^ alias)
      title
