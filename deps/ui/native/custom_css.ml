(* Native stub — web injects #logseq-custom-theme-id via Web_dom; the
   iOS host applies user CSS through its own stylesheet channel. *)

let remove () = ()
let apply_content _ = ()
let apply_for_repo _ = Js.Promise.resolve ()
let reset_for_repo _ = Js.Promise.resolve ()
let on_file_saved _ _ = ()
