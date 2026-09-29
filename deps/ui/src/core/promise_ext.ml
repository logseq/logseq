(* Promise sequencing syntax for deps/ui: new code prefers `let*`
   (async-looking sequential binds) over `|> Js.Promise.then_`
   callback chains. `open Promise_ext` where needed. *)

let ( let* ) p f = Js.Promise.then_ f p
