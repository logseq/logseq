(** Named keyboard shortcuts, mirroring clj-e2e's [keyboard.clj]. *)


let press env ?delay key = Pw.press env ?delay key
let press_all env ?delay keys = Pw.press_all env ?delay keys
let enter env = Pw.press env "Enter"
let esc env = Pw.press env "Escape"
let backspace env = Pw.press env "Backspace"
let delete env = Pw.press env "Delete"
let tab env = Pw.press env "Tab"
let shift_tab env = Pw.press env "Shift+Tab"
let shift_enter env = Pw.press env "Shift+Enter"
let shift_arrow_up env = Pw.press env "Shift+ArrowUp"
let shift_arrow_down env = Pw.press env "Shift+ArrowDown"
let arrow_up env = Pw.press env "ArrowUp"
let arrow_down env = Pw.press env "ArrowDown"
let arrow_left env = Pw.press env "ArrowLeft"
let arrow_right env = Pw.press env "ArrowRight"

let meta_shift_arrow_up env =
  Pw.press env ((if Config.mac then "Meta" else "Alt") ^ "+Shift+ArrowUp")

let meta_shift_arrow_down env =
  Pw.press env ((if Config.mac then "Meta" else "Alt") ^ "+Shift+ArrowDown")
