(* Root view: shell + current route page. The view builds once; model
   changes flow through signal-driven props and reactive children. *)

open Lui_elements

let view _context model_source _send : t = Chrome.shell model_source
