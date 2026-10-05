val is_visible_l : ?timeout:'a -> Playwright.locator -> unit Js.Promise.t
val is_visible : Env.t -> string -> bool Js.Promise.t
val is_hidden_l : Playwright.locator -> bool Js.Promise.t
val is_hidden : Env.t -> string -> bool Js.Promise.t
val have_count : ?timeout:float -> Env.t -> string -> int -> unit Js.Promise.t
val have_count_l : ?timeout:float -> Playwright.locator -> int -> unit Js.Promise.t
val non_editor_mode : Env.t -> 'a Js.Promise.t
val in_normal_mode : Env.t -> bool Js.Promise.t
val graph_loaded : Env.t -> bool Js.Promise.t
val editor_mode : ?uuid:string -> Env.t -> unit Js.Promise.t
val selected_block_text : Env.t -> string -> bool Js.Promise.t
val to_have_text_re :
  ?timeout:'a -> Playwright.locator -> 'b -> unit Js.Promise.t
val graph_summary_equal : 'a -> 'a -> unit
