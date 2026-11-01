(* JavaScript renderers are not available in the retained native host.
   Code editing uses MyGo's language highlighter; rendered formulae still
   retain their source as plain text, not KaTeX parity. *)
open Promise_ext

(* These registrations are host hints, not readiness acknowledgements. *)

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
