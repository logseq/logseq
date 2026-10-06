val last_page_block_content : Env.t -> Playwright.locator Js.Promise.t
val open_last_block : ?in_retry:bool -> Env.t -> unit Js.Promise.t
val save_block : Env.t -> string -> unit Js.Promise.t
val focus_new_block :
  Env.t ->
  previous_editor_id:string ->
  ?expected:string ->
  unit ->
  string Js.Promise.t
val new_block : Env.t -> string -> unit Js.Promise.t
val new_blocks : Env.t -> string list -> unit Js.Promise.t
val delete_blocks : Env.t -> unit Js.Promise.t
val assert_blocks_visible : Env.t -> string list -> unit Js.Promise.t
val jump_to_block : Env.t -> string -> unit Js.Promise.t
val wait_editor_text : Env.t -> string -> 'a Js.Promise.t
val copy : Env.t -> unit Js.Promise.t
val paste : Env.t -> unit Js.Promise.t
val undo : Env.t -> unit Js.Promise.t
val redo : Env.t -> unit Js.Promise.t
val wait_for_editor_x_change :
  Env.t -> float -> (float -> float -> bool) -> float Js.Promise.t
val indent_outdent : Env.t -> indent:bool -> unit Js.Promise.t
val indent : Env.t -> unit Js.Promise.t
val outdent : Env.t -> unit Js.Promise.t
val toggle_property : Env.t -> string -> string -> unit Js.Promise.t
val select_blocks : Env.t -> int -> unit Js.Promise.t
