(* logseq.common.version — build metadata. cljs goog-define
   BUILD_TIME/REVISION become env lookups here (same convention as
   sync_util's LOGSEQ_BUILD_REVISION). *)

let build_time () =
  match Runtime_env.env "LOGSEQ_BUILD_TIME" with
  | Some t -> t
  | None -> "unknown"

let revision () =
  match Runtime_env.env "LOGSEQ_BUILD_REVISION" with
  | Some r -> r
  | None -> "dev"

let format_version () =
  "Build time: " ^ build_time () ^ "\nRevision: " ^ revision ()
