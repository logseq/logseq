(** Per-test fixture state. Holds the "current page" that wally's dynamic
    [*page*] provided, plus captured console output used by the failure dump. *)

type t =
  { mutable page : Playwright.page
  ; console_logs : string Queue.t
  }

let make page = { page; console_logs = Queue.create () }
let page env = env.page

let with_page env p f =
  let old = env.page in
  env.page <- p;
  f ()
  |> Js.Promise.then_ (fun r ->
         env.page <- old;
         Js.Promise.resolve r)
  |> Js.Promise.catch (fun e ->
         env.page <- old;
         Playwright.throw_error e)

let record_console env msg =
  Queue.add (Playwright.console_text msg) env.console_logs

let console_logs env = Queue.fold (fun acc m -> m :: acc) [] env.console_logs
