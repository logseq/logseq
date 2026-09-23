(* frontend.worker.handler.markdown — markdown mirror endpoints. *)

let require_repo args =
  match List.nth_opt args 0 with
  | Some (Wire.String repo) -> repo
  | Some Wire.Nil | None -> ""
  | _ -> invalid_arg "first arg must be repo name"

let set_enabled args =
  let repo = require_repo args in
  let enabled =
    match List.nth_opt args 1 with
    | Some t -> Option.value ~default:false (Wire.as_bool t)
    | None -> false
  in
  Markdown_mirror.set_enabled repo enabled;
  Db_worker_effect.pure Wire.nil

let () = Dispatcher.register "thread-api/markdown-mirror-set-enabled" set_enabled

let flush args =
  let repo = require_repo args in
  Markdown_mirror.flush_repo repo Markdown_mirror.default_opts

let () = Dispatcher.register "thread-api/markdown-mirror-flush" flush

let regenerate args =
  let repo = require_repo args in
  match Worker_state.datascript_conn repo with
  | None -> Db_worker_effect.pure Wire.nil
  | Some conn -> Markdown_mirror.mirror_repo repo (Datascript.db conn)
                   Markdown_mirror.default_opts

let () = Dispatcher.register "thread-api/markdown-mirror-regenerate" regenerate
