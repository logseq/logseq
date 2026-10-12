val first_load_timeout_ms : float
external after : (unit -> unit Js.Promise.t) -> unit = "after"
[@@mel.module "node:test"]
val test_url : ?port:int -> unit -> string
val open_app : Env.t -> port:int -> 'a Js.Promise.t
val setup_page_env : env:Env.t -> port:int -> bool Js.Promise.t
val make_page :
  ?headless:bool ->
  ?slow_mo:float ->
  ?port:int -> unit -> (Env.t * Playwright.browser) Js.Promise.t
val with_page_open :
  ?headless:bool ->
  ?slow_mo:float ->
  ?port:int -> (Env.t -> 'a Js.Promise.t) -> 'a Js.Promise.t
val shared_open_page :
  ?headless:bool -> ?port:int -> unit -> Env.t Js.Promise.t
val shared_2_pages :
  ?headless:bool -> ?port:int -> unit -> (Env.t * Env.t) Js.Promise.t
val open_new_context :
  ?headless:bool ->
  ?slow_mo:float ->
  ?port:int -> unit -> (Playwright.context * Playwright.browser) Js.Promise.t
val shared_new_context :
  ?headless:bool ->
  ?slow_mo:float ->
  ?port:int -> unit -> (Playwright.context * Playwright.browser) Js.Promise.t
val context_open_page :
  ?env:Env.t ->
  ?port:int -> Playwright.context -> Playwright.page Js.Promise.t
val context_pages : Playwright.context -> Playwright.page array
val open_pages :
  ?env:Env.t ->
  ?port:int -> Playwright.context -> int -> Playwright.page list Js.Promise.t
val create_page : ?name:string -> Env.t -> string Js.Promise.t
val new_logseq_page : Env.t -> unit Js.Promise.t
val validate_graph : Env.t -> unit Js.Promise.t
val with_validate_graph :
  Env.t -> (unit -> unit Js.Promise.t) -> unit Js.Promise.t
val inst_string : unit -> string
val new_logseq_page_in_rtc :
  Env.t ->
  Playwright.page ->
  Playwright.page -> ?name:string -> unit -> unit Js.Promise.t
val prepare_rtc_graph_fixture :
  Env.t ->
  Playwright.page ->
  Playwright.page -> string -> (string -> 'a Js.Promise.t) -> 'a Js.Promise.t
