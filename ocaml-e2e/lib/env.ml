(** Per-test fixture state. Holds the "current page" that wally's dynamic
    [*page*] provided, plus captured console output used by the failure dump. *)

type t =
  { mutable page : Playwright.page
  ; console_logs : string Queue.t
  }

(* every env's own page gets a console queue at [make]; with_page reuses an
   existing env to drive a foreign page (e.g. the second client in rtc
   tests), so keep a page→queue registry and have [console_logs] answer the
   queue of whichever page the env currently drives. *)
let page_queues : (Playwright.page * string Queue.t) list ref = ref []

let make page =
  let q = Queue.create () in
  page_queues := (page, q) :: !page_queues;
  { page; console_logs = q }

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
  let text = Playwright.console_text msg in
  Queue.add text env.console_logs;
  if Config.env_opt "LOG_CONSOLE" <> None then
    Js.log ("[console] " ^ text)

let console_logs env =
  let q =
    match
      List.find_opt (fun (p, _) -> p == env.page) !page_queues
    with
    | Some (_, q) -> q
    | None -> env.console_logs
  in
  Queue.fold (fun acc m -> m :: acc) [] q
