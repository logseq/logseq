let is_combining code =
  (code >= 0x0300 && code <= 0x036f)
  || (code >= 0x1ab0 && code <= 0x1aff)
  || (code >= 0x1dc0 && code <= 0x1dff)
  || (code >= 0x20d0 && code <= 0x20ff)
  || (code >= 0xfe20 && code <= 0xfe2f)

let is_wide code =
  code >= 0x1100
  && (code <= 0x115f || code = 0x2329 || code = 0x232a
     || (code >= 0x2e80 && code <= 0xa4cf && code <> 0x303f)
     || (code >= 0xac00 && code <= 0xd7a3)
     || (code >= 0xf900 && code <= 0xfaff)
     || (code >= 0xfe10 && code <= 0xfe19)
     || (code >= 0xfe30 && code <= 0xfe6f)
     || (code >= 0xff00 && code <= 0xff60)
     || (code >= 0xffe0 && code <= 0xffe6))

let char_width code =
  if code = 0 || code < 32 || (code >= 0x7f && code < 0xa0) then 0
  else if is_combining code then 0
  else if is_wide code then 2
  else 1

external chars_of_string : string -> string array = "from" [@@mel.scope "Array"]

let unicode_chars text =
  Ustring.(of_string text |> to_string) |> chars_of_string

let code_point ch =
  match Js.String.codePointAt ~index:0 ch with Some code -> code | None -> 0

let width text =
  unicode_chars text
  |> Array.fold_left (fun acc ch -> acc + char_width (code_point ch)) 0

let take text max_width =
  let rec loop chars index acc_width acc =
    if index >= Array.length chars then Vec.string_concat "" (Vec.rev acc)
    else
      let ch = chars.(index) in
      let next_width = acc_width + char_width (code_point ch) in
      if next_width > max_width then Vec.string_concat "" (Vec.rev acc)
      else loop chars (index + 1) next_width (Vec.push_front acc ch)
  in
  if max_width <= 0 then "" else loop (unicode_chars text) 0 0 Vec.empty

let ellipsis = Cli_platform.Symbols.ellipsis

let truncate text max_width =
  let max_width = max 1 max_width in
  if width text <= max_width then text
  else
    let ellipsis_width = width ellipsis in
    if max_width <= ellipsis_width then take ellipsis max_width
    else take text (max_width - ellipsis_width) ^ ellipsis
