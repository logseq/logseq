val refresh_all_remote_graphs : Env.t -> unit Js.Promise.t
val goto_all_graphs : Env.t -> unit Js.Promise.t
val e2ee_password_modal : string
val e2ee_new_password_input : string
val e2ee_new_password_confirm_input : string
val e2ee_password_input : string
val e2ee_password_submit : string
val cloud_ready_indicator : string
val new_graph_dialog : string
val new_graph_submit : string
val rtc_sync_toggle : string
val rtc_graph_e2ee_toggle : string
val e2ee_password_poll_ms : float
val e2ee_password_prompt_grace_ms : float
val input_e2ee_password : Env.t -> 'a Js.Promise.t
val maybe_input_e2ee_password_gen :
  visible:(string -> bool Js.Promise.t) ->
  wait_timeout:(float -> unit Js.Promise.t) ->
  input_password:(unit -> unit Js.Promise.t) -> unit -> unit Js.Promise.t
val maybe_input_e2ee_password : Env.t -> unit Js.Promise.t
val new_graph_helper :
  Env.t -> string -> enable_sync:bool -> graph_e2ee:bool -> bool Js.Promise.t
val new_graph :
  Env.t ->
  string -> enable_sync:bool -> ?graph_e2ee:bool -> unit -> unit Js.Promise.t
val wait_for_remote_graph : Env.t -> string -> unit Js.Promise.t
val remove_graph : Env.t -> menu_item:string -> string -> unit Js.Promise.t
val remove_local_graph : Env.t -> string -> unit Js.Promise.t
val remove_remote_graph : Env.t -> string -> unit Js.Promise.t
val switch_graph :
  Env.t ->
  string -> wait_sync:bool -> need_input_password:bool -> bool Js.Promise.t
type summary = { valid : bool; }
val validate_graph : Env.t -> summary Js.Promise.t
