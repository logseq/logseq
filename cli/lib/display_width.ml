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

let utf8_code_at text index =
  let len = String.length text in
  let byte = Char.code text.[index] in
  if byte land 0x80 = 0 then (byte, index + 1)
  else if byte land 0xe0 = 0xc0 && index + 1 < len then
    let b1 = Char.code text.[index + 1] in
    (((byte land 0x1f) lsl 6) lor (b1 land 0x3f), index + 2)
  else if byte land 0xf0 = 0xe0 && index + 2 < len then
    let b1 = Char.code text.[index + 1] in
    let b2 = Char.code text.[index + 2] in
    ( ((byte land 0x0f) lsl 12) lor ((b1 land 0x3f) lsl 6) lor (b2 land 0x3f),
      index + 3 )
  else if byte land 0xf8 = 0xf0 && index + 3 < len then
    let b1 = Char.code text.[index + 1] in
    let b2 = Char.code text.[index + 2] in
    let b3 = Char.code text.[index + 3] in
    ( ((byte land 0x07) lsl 18)
      lor ((b1 land 0x3f) lsl 12)
      lor ((b2 land 0x3f) lsl 6)
      lor (b3 land 0x3f),
      index + 4 )
  else (byte, index + 1)

let width text =
  let rec loop index acc =
    if index >= String.length text then acc
    else
      let code, next = utf8_code_at text index in
      loop next (acc + char_width code)
  in
  loop 0 0

let take text max_width =
  let rec loop index acc_width =
    if index >= String.length text then text
    else
      let code, next = utf8_code_at text index in
      let next_width = acc_width + char_width code in
      if next_width > max_width then String.sub text 0 index
      else loop next next_width
  in
  if max_width <= 0 then "" else loop 0 0

let ellipsis = "…"

let truncate text max_width =
  let max_width = max 1 max_width in
  if width text <= max_width then text
  else
    let ellipsis_width = width ellipsis in
    if max_width <= ellipsis_width then take ellipsis max_width
    else take text (max_width - ellipsis_width) ^ ellipsis
