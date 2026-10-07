(* Native stub — document-level virtual scrolling is off; blocks render
   eagerly (the native host already lazily realize cells). *)
let enabled () = false
let sync () = ()
let install () = ()
