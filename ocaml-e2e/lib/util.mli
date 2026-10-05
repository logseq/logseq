val wait_timeout : Env.t -> float -> unit Js.Promise.t
val editor_q : string
val editor_q_first : string
val get_active_element : Env.t -> Playwright.locator
val get_editor : Env.t -> Playwright.locator option Js.Promise.t
val get_edit_block_container : Env.t -> Playwright.locator Js.Promise.t
val input : Env.t -> string -> unit Js.Promise.t
val press_seq : Env.t -> ?delay:float -> string -> unit Js.Promise.t
val exit_edit : Env.t -> unit Js.Promise.t
val double_esc : Env.t -> unit Js.Promise.t
val cmdk_search_settle_ms : float
val fill_cmdk_search : Env.t -> string -> unit Js.Promise.t
val cmdk_open : Env.t -> bool Js.Promise.t
val search : Env.t -> string -> unit Js.Promise.t
val repeat_until_visible :
  'a ->
  int ->
  Playwright.locator -> (unit -> unit Js.Promise.t) -> unit Js.Promise.t
val search_and_click : Env.t -> string -> unit Js.Promise.t
val wait_editor_gone : ?editor:string -> Env.t -> 'a Js.Promise.t
val wait_editor_visible : Env.t -> 'a Js.Promise.t
val count_elements : Env.t -> string -> int Js.Promise.t
val blocks_count : Env.t -> int Js.Promise.t
val page_blocks_count : Env.t -> int Js.Promise.t
val get_text_of : Playwright.locator -> string Js.Promise.t
val get_text : Env.t -> string -> string Js.Promise.t
val get_edit_content : Env.t -> string option Js.Promise.t
val edit_content : Env.t -> string Js.Promise.t
val wait_edit_content : Env.t -> string -> bool Js.Promise.t
val bounding_xy_l : Playwright.locator -> (float * float) Js.Promise.t
val repeat_keyboard : Env.t -> int -> string -> unit Js.Promise.t
val get_page_blocks_contents : Env.t -> string array Js.Promise.t
val wait_page_blocks_contents : Env.t -> string list -> string array Js.Promise.t
val settled_page_blocks_contents : Env.t -> string array Js.Promise.t
val login_test_account :
  ?username:string -> ?password:string -> Env.t -> 'a Js.Promise.t
val goto_journals : Env.t -> unit Js.Promise.t
val refresh_until_graph_loaded : Env.t -> bool Js.Promise.t
val move_cursor_to_end : Env.t -> unit Js.Promise.t
val move_cursor_to_start : Env.t -> unit Js.Promise.t
val input_command : Env.t -> string -> unit Js.Promise.t
val set_tag : ?hidden:bool -> Env.t -> string -> unit Js.Promise.t
val query_last : Env.t -> string -> Playwright.locator
val get_by_text : Env.t -> string -> bool -> Playwright.locator
val contains_sub : string -> string -> bool
external crypto_random_uuid : unit -> string = "randomUUID"
  [@@mel.scope "crypto"]
val random_uuid : unit -> string
val clipboard_text : Env.t -> 'a Js.Promise.t
val clipboard_write : Env.t -> 'a -> unit Js.Promise.t
val is_mac : unit -> 'a
val is_main : string -> bool
