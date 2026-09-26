(* Port of src/electron/electron/state.cljs — in-memory app state:
   the main-window BrowserWindow handle plus per-window graph routing. *)

open Electron_bindings

(* electron.utils/*win — the main window. *)
let main_window : Browser_window.t option ref = ref None

let mac = String.equal process_platform "darwin"
let win32 = String.equal process_platform "win32"
let linux = String.equal process_platform "linux"
let prod =
  match Js.Dict.get (process_env ()) "NODE_ENV" with
  | Some "production" -> true
  | _ -> false
let dev = not prod

(* state.atom {:config, :window/graph window->repo, :window/once-graph-ready} *)

(* :config — mirror of (config/get-config); Electron_main seeds it via
   set_config once Electron_configs is available. *)
let config : Js.Json.t ref = ref Js.Json.null

let set_config (value : Js.Json.t) : unit = config := value

let get_config () : Js.Json.t = !config

(* state/set-state! [:config k] v *)
let set_config_item (key : string) (value : Js.Json.t) : unit =
  match Js.Json.classify !config with
  | Js.Json.JSONObject dict -> Js.Dict.set dict key value
  | _ -> ()

let window_graph : (int, string) Hashtbl.t = Hashtbl.create 8

(* :window/once-graph-ready — called with (window, graph-name) on the
   :graphReady IPC, then cleared. *)
let once_graph_ready :
    (Browser_window.t -> string -> unit) option ref =
  ref None

let set_once_graph_ready f = once_graph_ready := f
let take_once_graph_ready () =
  let f = !once_graph_ready in
  once_graph_ready := None;
  f

let window_graph_path window =
  match Hashtbl.find_opt window_graph (Browser_window.id window) with
  | Some repo -> Some repo
  | None -> None

let set_window_graph window repo =
  Hashtbl.replace window_graph (Browser_window.id window) repo

let close_window window =
  Hashtbl.remove window_graph (Browser_window.id window)
