(* Native rendering needs no JavaScript library initialization.
   Logseq_katex emits visible TeX source, not KaTeX output; code editing
   uses MyGo's language highlighter. No pending browser slots are sent
   to the native host. *)

let ensure () : unit = ()
