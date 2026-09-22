(* logseq.cli.style — ANSI styling for the CLI and db-worker-node
   console output. picocolors-equivalent: bold wraps with \x1b[1m /
   \x1b[22m. *)

let ansi_re = Regexp.compile "\\u001b\\[[0-9;]*m"

let strip_ansi (s : string) : string =
  Regexp.replace ansi_re
    ~f:(fun ~match_:_ ~groups:_ ~offset:_ ~input:_ -> "")
    s

(* TERM=dumb terminals get no color. *)
let term_dumb () : bool =
  match Runtime_env.env "TERM" with
  | Some "dumb" -> true
  | _ -> false

(* cljs style/*color-enabled?* — a dynamic override tests bind; None
   defers to the TTY check. *)
let color_enabled_override : bool option ref = ref None

(* color-supported?: stdout TTY and not a dumb terminal (picocolors'
   createColors uses the same check for isColorSupported). *)
let color_supported () : bool =
  match !color_enabled_override with
  | Some b -> b
  | None -> Node_process.stdout_is_tty () && not (term_dumb ())

let apply_style (s : string) ~(open_ : string) ~(close : string) : string =
  if color_supported () then "\027[" ^ open_ ^ "m" ^ s ^ "\027[" ^ close ^ "m"
  else s

let bold (s : string) : string = apply_style s ~open_:"1" ~close:"22"
let dim (s : string) : string = apply_style s ~open_:"2" ~close:"22"
let green (s : string) : string = apply_style s ~open_:"32" ~close:"39"
