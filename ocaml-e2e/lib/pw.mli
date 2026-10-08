val page : Env.t -> Playwright.page
val q : Env.t -> string -> Playwright.locator
val qq :
  Env.t ->
  ?has:'a ->
  ?has_not:'b ->
  ?has_text:'c -> ?has_not_text:'d -> string -> Playwright.locator
val qs : Env.t -> string -> Playwright.locator array Js.Promise.t
val sub : Playwright.locator -> string -> Playwright.locator
val sub_first : Playwright.locator -> string -> Playwright.locator
val click : Env.t -> string -> unit Js.Promise.t
val click_l :
  ?button:'a ->
  ?timeout:'b ->
  ?modifiers:'c array -> Playwright.locator -> unit Js.Promise.t
val click_right : Env.t -> string -> unit Js.Promise.t
val dblclick : Env.t -> string -> unit Js.Promise.t
val fill : Env.t -> string -> string -> unit Js.Promise.t
val fill_l : ?timeout:'a -> Playwright.locator -> string -> unit Js.Promise.t
val hover_l : ?timeout:'a -> Playwright.locator -> unit Js.Promise.t
val wait_for :
  Env.t -> ?state:string -> ?timeout:'a -> string -> 'b Js.Promise.t
val wait_for_hidden : Env.t -> ?timeout:'a -> string -> 'b Js.Promise.t
val wait_for_l :
  ?state:string -> ?timeout:'a -> Playwright.locator -> unit Js.Promise.t
val wait_for_hidden_l :
  ?timeout:'a -> Playwright.locator -> unit Js.Promise.t
val visible : Env.t -> string -> bool Js.Promise.t
val visible_l : Playwright.locator -> bool Js.Promise.t
val count : Env.t -> string -> int Js.Promise.t
val count_l : Playwright.locator -> int Js.Promise.t
val all_text : Env.t -> string -> string array Js.Promise.t
val all_text_l : Playwright.locator -> string array Js.Promise.t
val text_of_l : Playwright.locator -> string Js.Promise.t
val attr : Env.t -> string -> string -> string option Js.Promise.t
val attr_l : Playwright.locator -> string -> string option Js.Promise.t
val input_value : Env.t -> string -> string Js.Promise.t
val input_value_l : Playwright.locator -> string Js.Promise.t
val bounding_xy_l : Playwright.locator -> (float * float) Js.Promise.t
val navigate : Env.t -> string -> 'a Js.Promise.t
val refresh : Env.t -> 'a Js.Promise.t
val go_back : Env.t -> 'a Js.Promise.t
val go_forward : Env.t -> 'a Js.Promise.t
val url : Env.t -> string
val wait_timeout : Env.t -> float -> unit Js.Promise.t
val press : Env.t -> ?delay:float -> string -> unit Js.Promise.t
val press_all : Env.t -> ?delay:float -> string list -> unit Js.Promise.t
val get_by_test_id : Env.t -> string -> Playwright.locator
val get_by_text : Env.t -> ?exact:bool -> string -> Playwright.locator
val get_by_label : Env.t -> ?exact:bool -> string -> Playwright.locator
val get_by_role : Env.t -> ?name:'a -> string -> Playwright.locator
val eval_js : Env.t -> string -> 'a Js.Promise.t
external json_stringify : 'a -> string = "stringify" [@@mel.scope "JSON"]
val eval_js_arg : Env.t -> string -> 'a -> 'b Js.Promise.t
val eval_on_element : Env.t -> 'a -> string -> 'b Js.Promise.t
val on_console : Env.t -> (Playwright.console_message -> unit) -> unit
val screenshot : Env.t -> path:'a -> 'b Js.Promise.t
val clipboard_text : Env.t -> 'a Js.Promise.t
val grant_permissions : Env.t -> string array -> unit Js.Promise.t
val set_default_timeout : Env.t -> float -> unit
val maybe : 'a Js.Promise.t -> 'a option Js.Promise.t
val catch_timeout :
  'a Js.Promise.t -> (unit -> 'a Js.Promise.t) -> 'a Js.Promise.t
val ignore_timeout : unit Js.Promise.t -> unit Js.Promise.t
val find_one_by_text :
  Env.t -> string -> string -> Playwright.locator option Js.Promise.t
val drag_to :
  ?target_x:'a ->
  ?target_y:'b ->
  ?steps:'c -> Playwright.locator -> Playwright.locator -> unit Js.Promise.t
