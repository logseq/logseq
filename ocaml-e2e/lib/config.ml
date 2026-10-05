(** Runtime knobs, mirroring clj-e2e's [config.clj]. Overridable through the
    [E2E_PORT], [E2E_HEADLESS] and [E2E_SLOW_MO] env vars. *)

external process_env : Node.Process.t -> string Js.Dict.t = "env" [@@mel.get]

let env_opt name = Js.Dict.get (process_env Node.Process.process) name

let port =
  match Option.bind (env_opt "E2E_PORT") int_of_string_opt with
  | Some p when p > 0 -> p
  | _ -> 3002

let headless = env_opt "E2E_HEADLESS" <> Some "false"

let slow_mo =
  match Option.bind (env_opt "E2E_SLOW_MO") float_of_string_opt with
  | Some v -> v
  | None -> 30.

let mac = false
