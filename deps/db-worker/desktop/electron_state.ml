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

let window_graph : (int, string) Hashtbl.t = Hashtbl.create 8

let once_graph_ready : (unit -> unit) option ref = ref None

let window_graph_path window =
  match Hashtbl.find_opt window_graph (Browser_window.id window) with
  | Some repo -> Some repo
  | None -> None

let set_window_graph window repo =
  Hashtbl.replace window_graph (Browser_window.id window) repo

let close_window window =
  Hashtbl.remove window_graph (Browser_window.id window)
