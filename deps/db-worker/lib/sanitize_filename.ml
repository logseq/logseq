(* Port of npm `sanitize-filename` (sans the truncate-255-byte edge): removes
   illegal chars (slash, question mark, angle brackets, backslash, colon,
   star, pipe, quote), control chars, leading dots, windows reserved names
   and trailing dot-space sequences. *)

let illegal_re = Regexp.compile "[/\\?<>\\\\:\\*\\|\"]"
let control_re = Regexp.compile "[\\u0000-\\u001f\\u0080-\\u009f]"
let reserved_re = Regexp.compile "^\\.+$"
let windows_reserved_re =
  Regexp.compile "^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\\..*)?$"
let windows_trailing_re = Regexp.compile "[\\. ]+$"

let sanitize ?(replacement : string = "") (input : string) : string =
  let s = Regexp.replace_all illegal_re ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> replacement) input in
  let s = Regexp.replace_all control_re ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> replacement) s in
  let s = if Regexp.test reserved_re s then replacement else s in
  let s = if Regexp.test windows_reserved_re s then s ^ replacement else s in
  let s = Regexp.replace_all windows_trailing_re ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> replacement) s in
  (* npm version truncates to 255 bytes; keep it faithful *)
  if String.length s > 255 then String.sub s 0 255 else s

let of_string (s : string) : string = sanitize s
