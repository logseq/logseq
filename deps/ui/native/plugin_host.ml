(* Native stub of sdk/plugin_host.ml — the JS plugin runtime
   (LSPluginCore sandbox) does not exist on native, so every surface
   reports "no plugins". api_methods stays empty so Sdk_api installs
   cleanly. *)

type ui_item = { it_pid : string; it_type : string; it_opts : Js.Json.t }

let getf (o : Js.Json.t) (k : string) : Js.Json.t =
  match o with
  | Js.Json.JObject kvs -> (
      match List.assoc_opt k kvs with
      | Some v -> v
      | None -> Js.Json.JNull)
  | _ -> Js.Json.JNull

let jstr o k = Option.value ~default:"" (Js.Json.decodeString (getf o k))
let jbool o k = Option.value ~default:false (Js.Json.decodeBoolean (getf o k))

let dirty : int Signal.signal option ref = ref None

let dirty_signal (owner : Signal.scheduler) : int Signal.signal =
  let st = Signal.state owner 0 in
  let s = Signal.value st in
  dirty := Some s;
  s

let dirty_value (owner : Signal.scheduler) : int Signal.signal =
  match !dirty with
  | Some s -> s
  | None ->
      let s = Signal.value (Signal.state owner 0) in
      dirty := Some s;
      s
let toolbar_items () : ui_item list = []
let has_installed_plugins () = false
let slot_id it = "pl-injected-ui-item-pl-" ^ jstr it.it_opts "key" ^ "-" ^ it.it_pid
let inject_toolbar_ui () = ()
let pinned () : string list = []
let toggle_pinned (_ : string) = ()
let slash_cmd_tags () : (string * string) list = []
let exec_slash_command ?insert:_ _pid _tag = ()
let fire_db_hooks (_ : Wire.t) = ()
let fire_route_changed (_ : Model.route) = ()

(* kept annotation-free to avoid a Plugin_host <-> Sdk_api module
   cycle; the shape must match Sdk_api.api_fn *)
let api_methods = []

let setup () = ()

let palette_commands () : Commands_data.cmd list = []

let exec_palette_command (_cid : string) : unit = ()

let open_settings_pid : string option ref = ref None
let pending_dialog_tab : string option ref = ref None
let hook_app (_ : string) (_ : Js.Json.t) (_ : Js.Json.t) = ()
let fire_theme_mode_changed (_ : string) = ()
let fire_sidebar_visible_changed (_ : bool) = ()
let fire_current_graph_changed () = ()
let simple_commands_of_type (_ : string) : (string * string * string) list = []
let exec_simple_command ?args:_ ?ctx:_ (_ : string) (_ : string) = ()
let item_slot (_ : ui_item) : string = ""
let ui_items_of_type (_ : string) : ui_item list = []
let make_asset_url (_ : Js.Json.t) (_ : Js.Json.t) (_ : Js.Json.t)
    (_ : Js.Json.t) : Js.Json.t Js.Promise.t = Js.Promise.resolve Js.Json.null
let open_pdf_viewer (_ : Js.Json.t) (_ : Js.Json.t) (_ : Js.Json.t)
    (_ : Js.Json.t) : Js.Json.t Js.Promise.t = Js.Promise.resolve Js.Json.null
