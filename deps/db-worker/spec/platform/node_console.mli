(* Node console surface: direct console writes (logseq.common.log)
   plus the stdio taps the db-worker-node log installer wraps
   (logseq.db-worker.log wrap-console!/wrap-streams!/wrap-print!).
   Node-only: the native implementation raises [Invalid_argument]. *)

val log : string -> unit
val warn : string -> unit
val error : string -> unit

(* cljs log installer's console/process-stream wrapping, collapsed
   into one tap: every write to console.{log,warn,error} or
   process.{stdout,stderr}.write invokes [tap ~source ~text] where
   source is "console.log"|"console.warn"|"console.error"|"stdout"|
   "stderr" and text is the joined write payload. Returns the
   uninstall function restoring the original fns. *)
val tap_stdio : (source:string -> text:string -> unit) -> unit -> unit
