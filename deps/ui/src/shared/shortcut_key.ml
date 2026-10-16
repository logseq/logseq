(* cljs shortcut tables key on the unshifted key plus modifier flags; DOM
   `key` already applies Shift ("Z", ">"), so letter/symbol shortcuts must
   be normalized back before matching *)
let normalize key =
  match String.lowercase_ascii key with
  | ">" -> "."
  | "<" -> ","
  | "?" -> "/"
  | ":" -> ";"
  | "\"" -> "'"
  | "~" -> "`"
  | "{" -> "["
  | "}" -> "]"
  | "|" -> "\\"
  | "_" -> "-"
  | "+" -> "="
  | "!" -> "1"
  | "@" -> "2"
  | "#" -> "3"
  | "$" -> "4"
  | "%" -> "5"
  | "^" -> "6"
  | "&" -> "7"
  | "*" -> "8"
  | "(" -> "9"
  | ")" -> "0"
  | k -> k

let of_event ev = normalize (Option.value ~default:"" ev.Ui_services.key)

(* the native host folds a held shift into the key name for platform
   shortcuts —
   cmd+shift+p arrives as {key="P", shift=false} and cmd+shift+/ as
   {key="?", shift=false}. With a modifier held, a shifted glyph
   (uppercase letter or shifted symbol) means the flag was folded away;
   reconstruct it so mod+p and mod+shift+p stay distinct *)
let shift_held ev =
  if ev.Ui_services.shift then true
  else if not (ev.Ui_services.meta || ev.Ui_services.ctrl) then false
  else
    match Option.value ~default:"" ev.Ui_services.key with
    | k when String.length k = 1 ->
        k <> String.lowercase_ascii k || normalize k <> k
    | _ -> false
