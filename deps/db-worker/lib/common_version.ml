(* logseq.common.version — build metadata helpers.

   cljs goog-define BUILD_TIME/REVISION are compile-time constants; the
   OCaml analog reads process env at runtime (LOGSEQ_BUILD_TIME /
   LOGSEQ_BUILD_REVISION, the latter already used by sync-util). *)

let build_time () =
  match Runtime_env.env "LOGSEQ_BUILD_TIME" with
  | Some t -> t
  | None -> "unknown"

let revision () =
  match Runtime_env.env "LOGSEQ_BUILD_REVISION" with
  | Some r -> r
  | None -> "dev"

let format_version () =
  Printf.sprintf "Build time: %s\nRevision: %s" (build_time ())
    (revision ())
