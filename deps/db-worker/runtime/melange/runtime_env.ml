type kind =
  | Browser_worker
  | Node
  | Native

(* globalThis.process — a plain property read (no module import) so
   the browser bundle doesn't need the node "process" shim and
   detection stays correct under bundlers. *)
external process_global : 'a Js.Undefined.t = "process"
  [@@mel.scope "globalThis"]

let kind () =
  match Js.Undefined.toOption process_global with
  | None -> Browser_worker
  | Some _ -> Node

let env name =
  match kind () with
  | Node -> Js.Dict.get (Node.Process.process##env) name
  | _ -> None

external os_homedir : unit -> string = "homedir" [@@mel.module "os"]

let home_dir () =
  match kind () with
  | Node -> os_homedir ()
  | Browser_worker | Native -> invalid_arg "home_dir: no home directory on this platform"

type search_params

external new_url_search_params : string -> search_params = "URLSearchParams"
  [@@mel.new]

external get_param : search_params -> string -> string Js.Nullable.t = "get"
  [@@mel.send]

(* globalThis.location — dedicated workers have self.location but
   no window object; the main thread never loads this bundle. *)
external location_search : unit -> string = "location.search"
  [@@mel.scope "globalThis"]

let search_param_true name =
  try
    let params = new_url_search_params (location_search ()) in
    match Js.Nullable.toOption (get_param params name) with
    | Some ("true" | "1") -> true
    | _ -> false
  with _ -> false

let owner_source () =
  match kind () with
  | Browser_worker ->
      if search_param_true "capacitor" then "capacitor"
      else if search_param_true "electron" then "electron"
      else "browser"
  | Node | Native ->
      (match env "LOGSEQ_OWNER_SOURCE" with
       | Some s -> s
       | None -> "unknown")

let electron_owner () = String.equal (owner_source ()) "electron"

external location_href : unit -> string = "location.href"
  [@@mel.scope "globalThis"]

let publishing () =
  match kind () with
  | Browser_worker ->
      (try Graph_dir.contains_substring (location_href ()) "publishing=true"
       with _ -> false)
  | Node | Native -> false
