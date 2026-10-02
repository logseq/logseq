(* Native stub — katex/hljs are JS libraries; math + code highlight
   render as plain text on native until ported *)
open Promise_ext

let ensure () = ()

(* KaTeX/hljs slots — pending registrations are pushed to the host so
   the Swift logseq-code/logseq-math extensions render natively
   (Highlightr / SwiftMath). *)

let ensure () : unit = ()

let katex_ready : bool ref = ref false
let katex_register_pending (id : string) (display : bool) : unit =
  Host.dom_op "katex-pending"
    (Js.Json.stringify
       (Js.Json.JObject
          [ ("id", Js.Json.JString id)
          ; ("display", Js.Json.JBoolean display) ]))

let hljs_ready : bool ref = ref false
let hljs_register_pending (id : string) (lang : string) : unit =
  Host.dom_op "hljs-pending"
    (Js.Json.stringify
       (Js.Json.JObject
          [ ("id", Js.Json.JString id)
          ; ("lang", Js.Json.JString lang) ]))
