let slash_re = Js.Re.fromStringWithFlags "(?:/|\\\\)+" ~flags:"g"
let file_drive_re = Js.Re.fromStringWithFlags "^/([a-z])%3a(?=/|$)" ~flags:"i"
let windows_drive_re = Js.Re.fromString "^[a-zA-Z]:(?:/|\\\\)"
let windows_url_path_re = Js.Re.fromStringWithFlags "^/[a-z]:" ~flags:"i"
let protocol_url_re = Js.Re.fromString "^[a-zA-Z0-9_+\\-.]{2,}:"
let custom_scheme_re = Js.Re.fromString "^[a-zA-Z0-9_+\\-.]+://"
let leading_slashes_re = Js.Re.fromString "^/+"
let trailing_slashes_re = Js.Re.fromString "/+$"

let safe_decode_uri_component value =
  try Js.Global.decodeURIComponent value |> Js.String.normalize ~form:`NFC
  with _ -> value

let is_file_url value =
  String.starts_with ~prefix:"memory://" value
  || String.starts_with ~prefix:"assets://" value
  || String.starts_with ~prefix:"file://" value

let filename path =
  if String.ends_with ~suffix:"/" path then None
  else
    let parts = Js.String.split ~sep:"/" path in
    let name = parts.(Array.length parts - 1) in
    if (not (String.equal name "")) && is_file_url path then
      Some (safe_decode_uri_component name)
    else Some name

let split_ext path =
  let name =
    match filename path with
    | Some name -> name
    | None -> failwith "cannot split the extension of a directory path"
  in
  let position = Js.String.lastIndexOf ~search:"." name in
  if position <= 0 then (name, "")
  else
    ( String.sub name 0 position,
      String.sub name (position + 1) (String.length name - position - 1)
      |> Js.String.toLowerCase )

let file_stem path = split_ext path |> fst
let file_ext path = split_ext path |> snd

let normalize_separators value =
  Js.String.replaceByRe ~regexp:slash_re ~replacement:"/" value

let split_segment value =
  if String.equal value "/" then Rrbvec.singleton ""
  else
    let parts = Js.String.split ~sep:"/" value in
    let rec trailing_length length =
      if length > 0 && String.equal parts.(length - 1) "" then
        trailing_length (length - 1)
      else length
    in
    let length = trailing_length (Array.length parts) in
    Rrbvec.init length (fun index -> parts.(index))

let input_segments base segments =
  let values = ref Rrbvec.empty in
  (match base with
  | Some value -> values := Rrbvec.push_back !values value
  | None -> ());
  Array.iter
    (fun value ->
      match value with
      | Some value -> values := Rrbvec.push_back !values value
      | None -> ())
    segments;
  !values

let flatten_segments ~uri base segments =
  input_segments base segments
  |> Rrbvec.filter (fun value ->
      if uri then not (String.equal value "")
      else not (String.equal (String.trim value) ""))
  |> Rrbvec.concat_map (fun value ->
      value |> normalize_separators |> split_segment
      |> if uri then Rrbvec.map Js.Global.encodeURIComponent else Fun.id)

let normalize_flat_segments segments =
  Rrbvec.fold_left
    (fun result segment ->
      if String.equal segment "" then Rrbvec.singleton ""
      else if String.equal segment ".." then
        match Rrbvec.peek_back_opt result with
        | Some ".." -> Rrbvec.push_back result segment
        | Some "" -> result
        | None -> Rrbvec.singleton ".."
        | Some _ -> (
            match Rrbvec.pop_back result with
            | Some (_, remaining) -> remaining
            | None -> result)
      else if String.equal segment "." then result
      else Rrbvec.push_back result segment)
    Rrbvec.empty segments

let join_segments segments =
  match Rrbvec.length segments with
  | 0 -> "."
  | 1 when String.equal (Rrbvec.nth segments 0) "" -> "/"
  | length ->
      let result = ref (Rrbvec.nth segments 0) in
      for index = 1 to length - 1 do
        result := !result ^ "/" ^ Rrbvec.nth segments index
      done;
      !result

let join_internal ~uri base segments =
  flatten_segments ~uri base segments
  |> normalize_flat_segments |> join_segments

let regexp_match regexp value =
  match Js.Re.exec ~str:value regexp with
  | None -> None
  | Some result ->
      Js.Re.captures result |> fun captures ->
      captures.(0) |> Js.Nullable.toOption

let preserve_file_url_win_drive scheme encoded_path =
  if String.equal scheme "file:" then
    Js.String.replaceByRe ~regexp:file_drive_re ~replacement:"/$1:" encoded_path
  else encoded_path

let url_join base_url segments =
  let custom_scheme = regexp_match custom_scheme_re base_url in
  let custom_scheme =
    Option.bind custom_scheme (fun scheme ->
        if String.equal scheme "file://" then None else Some scheme)
  in
  let url_input =
    match custom_scheme with
    | Some scheme ->
        "file://"
        ^ String.sub base_url (String.length scheme)
            (String.length base_url - String.length scheme)
    | None -> base_url
  in
  let url =
    try Url_support.make (safe_decode_uri_component url_input)
    with _ -> Url_support.make "file:///"
  in
  let scheme =
    match custom_scheme with
    | Some scheme -> String.sub scheme 0 (String.length scheme - 2)
    | None -> Url_support.protocol url
  in
  let path = Url_support.pathname url in
  let host = Url_support.host url in
  let domain =
    if not (String.equal host "") then host
    else if Option.is_some custom_scheme || String.starts_with ~prefix:"/" path
    then ""
    else "/"
  in
  let encoded_path =
    join_internal ~uri:true (Some path) segments
    |> preserve_file_url_win_drive scheme
  in
  scheme ^ "//" ^ domain ^ encoded_path

let path_join base segments =
  match base with
  | Some base when is_file_url base -> url_join base segments
  | _ -> (
      let joined = join_internal ~uri:false base segments in
      match base with
      | Some base when String.starts_with ~prefix:"//" base -> "/" ^ joined
      | _ -> joined)

let prepend_protocol protocol path =
  if String.starts_with ~prefix:protocol path then path
  else if String.starts_with ~prefix:"//" path then protocol ^ path
  else path_join (Some (protocol ^ "//")) [| Some path |]

let url_normalize origin_url =
  let url =
    try Some (Url_support.make (safe_decode_uri_component origin_url))
    with _ -> None
  in
  match url with
  | None -> origin_url
  | Some url ->
      let scheme = Url_support.protocol url in
      let host = Url_support.host url in
      let domain = if String.equal host "" then "/" else host in
      let encoded_path =
        join_internal ~uri:true (Some (Url_support.pathname url)) [||]
        |> preserve_file_url_win_drive scheme
      in
      scheme ^ "//" ^ domain ^ encoded_path

let path_normalize path =
  (if is_file_url path then url_normalize path else path_join (Some path) [||])
  |> Js.String.normalize ~form:`NFC

let replace_assets_scheme value =
  if String.starts_with ~prefix:"assets://" value then
    "file://"
    ^ String.sub value
        (String.length "assets://")
        (String.length value - String.length "assets://")
  else value

let url_to_path original_url =
  if not (is_file_url original_url) then original_url
  else
    let url =
      try
        original_url |> safe_decode_uri_component |> replace_assets_scheme
        |> Url_support.make |> Option.some
      with _ -> None
    in
    match url with
    | None -> original_url
    | Some url ->
        let path = Url_support.pathname url in
        let path =
          if String.starts_with ~prefix:"///" path then
            String.sub path 2 (String.length path - 2)
          else path
        in
        let path =
          if Option.is_some (Js.Re.exec ~str:path windows_url_path_re) then
            String.sub path 1 (String.length path - 1)
          else path
        in
        let host = Url_support.host url in
        if String.equal host "" then path else "//" ^ host ^ path

let file_url_or_path_to_path = url_to_path

let trim_leading_slashes value =
  Js.String.replaceByRe ~regexp:leading_slashes_re ~replacement:"" value

let trim_dir_prefix base_path sub_path =
  let base_path = path_normalize base_path in
  let sub_path = path_normalize sub_path in
  if String.starts_with ~prefix:base_path sub_path then
    let suffix =
      String.sub sub_path (String.length base_path)
        (String.length sub_path - String.length base_path)
      |> trim_leading_slashes
    in
    if is_file_url base_path then Some (safe_decode_uri_component suffix)
    else Some suffix
  else None

let parent path =
  if Js.String.includes path ~search:"/" then
    Some (path_normalize (path ^ "/.."))
  else None

let basename path =
  let path =
    Js.String.replaceByRe ~regexp:trailing_slashes_re ~replacement:"" path
  in
  match filename path with
  | Some name -> name
  | None -> failwith "basename normalization retained a trailing separator"

let is_absolute path =
  let path = path_normalize path in
  is_file_url path
  || String.starts_with ~prefix:"/" path
  || Option.is_some (Js.Re.exec ~str:path windows_drive_re)

let is_protocol_url path =
  Option.is_some (Js.Re.exec ~str:path protocol_url_re)
  && not (Js.String.includes path ~search:" ")
