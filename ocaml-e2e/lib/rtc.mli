type rtc_tx = { local_tx : int option; remote_tx : int option; }
val int_after : label:string -> string -> int option
val get_rtc_tx : Env.t -> rtc_tx Js.Promise.t
val with_wait_tx_updated :
  Env.t -> (unit -> unit Js.Promise.t) -> rtc_tx Js.Promise.t
val wait_tx_update_to : Env.t -> int -> int Js.Promise.t
val rtc_start : Env.t -> unit Js.Promise.t
val rtc_stop : Env.t -> unit Js.Promise.t
val dump_sync_logs : Env.t -> unit
val validate_graphs_in_2_pages :
  Env.t -> Playwright.page -> Playwright.page -> unit Js.Promise.t
val validate_graphs_in_2_envs : Env.t -> Env.t -> unit Js.Promise.t
