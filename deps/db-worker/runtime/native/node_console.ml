let log = print_endline
let warn s = Printf.eprintf "%s\n%!" s
let error s = Printf.eprintf "%s\n%!" s

let tap_stdio _tap =
  invalid_arg "Node_console.tap_stdio: unsupported on native"
