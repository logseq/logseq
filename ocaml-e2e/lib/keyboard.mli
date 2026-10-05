val press : Env.t -> ?delay:float -> string -> unit Js.Promise.t
val press_all : Env.t -> ?delay:float -> string list -> unit Js.Promise.t
val enter : Env.t -> unit Js.Promise.t
val esc : Env.t -> unit Js.Promise.t
val backspace : Env.t -> unit Js.Promise.t
val delete : Env.t -> unit Js.Promise.t
val tab : Env.t -> unit Js.Promise.t
val shift_tab : Env.t -> unit Js.Promise.t
val shift_enter : Env.t -> unit Js.Promise.t
val shift_arrow_up : Env.t -> unit Js.Promise.t
val shift_arrow_down : Env.t -> unit Js.Promise.t
val arrow_up : Env.t -> unit Js.Promise.t
val arrow_down : Env.t -> unit Js.Promise.t
val arrow_left : Env.t -> unit Js.Promise.t
val arrow_right : Env.t -> unit Js.Promise.t
val meta_shift_arrow_up : Env.t -> unit Js.Promise.t
val meta_shift_arrow_down : Env.t -> unit Js.Promise.t
