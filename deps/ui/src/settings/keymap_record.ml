type change = Ignore | Close | Set of string list * bool

let canonical stroke =
  String.split_on_char '+' (String.lowercase_ascii stroke)
  |> List.sort String.compare |> String.concat "+"

let key ev =
  match ev.Ui_services.key with
  | None
  | Some
      ( "Control" | "Meta" | "Alt" | "Shift" | "CapsLock" | "Dead"
      | "Unidentified" ) ->
      None
  | Some key ->
      let key =
        match Shortcut_key.normalize key with
        | "arrowup" -> "up"
        | "arrowdown" -> "down"
        | "arrowleft" -> "left"
        | "arrowright" -> "right"
        | " " -> "space"
        | "[" -> "open-square-bracket"
        | "]" -> "close-square-bracket"
        | value -> value
      in
      Some
        (String.concat "+"
           ((if ev.meta then [ "meta" ] else [])
           @ (if ev.ctrl then [ "ctrl" ] else [])
           @ (if ev.alt then [ "alt" ] else [])
           @ (if Shortcut_key.shift_held ev then [ "shift" ] else [])
           @ [ key ]))

let update ~strokes ~committed ev =
  if ev.Ui_services.composing then Ignore
  else
    match ev.key with
    | Some "Escape" -> Close
    | Some "Backspace" ->
        Set
          ( (if committed then []
             else
               match List.rev strokes with
               | [] -> []
               | _ :: rest -> List.rev rest),
            false )
    | _ -> (
        match key ev with
        | None -> Ignore
        | Some stroke when ev.meta || ev.ctrl || ev.alt -> Set ([ stroke ], true)
        | Some stroke when committed -> Set ([ stroke ], false)
        | Some stroke when List.length strokes < 5 ->
            Set (strokes @ [ stroke ], false)
        | Some _ -> Ignore)

let keycaps stroke =
  String.split_on_char '+' stroke
  |> List.map (function
    | "meta" -> "⌘"
    | "ctrl" -> "Ctrl"
    | "alt" -> "⌥"
    | "shift" -> "⇧"
    | "enter" -> "⏎"
    | "backspace" -> "⌫"
    | "escape" -> "Esc"
    | "tab" -> "Tab"
    | "space" -> "Space"
    | "delete" -> "Delete"
    | "home" -> "Home"
    | "end" -> "End"
    | "pageup" -> "PageUp"
    | "pagedown" -> "PageDown"
    | "insert" -> "Insert"
    | "up" -> "↑"
    | "down" -> "↓"
    | "left" -> "←"
    | "right" -> "→"
    | "open-square-bracket" -> "["
    | "close-square-bracket" -> "]"
    | value -> String.uppercase_ascii value)
