(* logseq.common.log — the nbb shim of lambdaisland.glogi.
   cljs: (apply js/console.error (map clj->js msgs)) — the OCaml log
   sink flattens to text the way console.error renders. *)

let error msgs = Worker_log.error "common-log/error" [ ("messages", String.concat " " msgs) ]
