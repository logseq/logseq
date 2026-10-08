type t = { mutable page : Playwright.page; console_logs : string Queue.t; }
val make : Playwright.page -> t
val page : t -> Playwright.page
val with_page :
  t -> Playwright.page -> (unit -> 'a Js.Promise.t) -> 'a Js.Promise.t
val record_console : t -> Playwright.console_message -> unit
val console_logs : t -> string list
