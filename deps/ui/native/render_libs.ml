(* Native rendering needs no JavaScript library initialization.
   Logseq_katex emits visible TeX source, not KaTeX output. No pending
   browser slots are sent to the native host. *)

let ensure () : unit = ()
