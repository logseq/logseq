type kind =
  | Browser_worker
  | Node
  | Native

let kind () =
  match Js.typeof Node.Process.process with
  | "undefined" -> Browser_worker
  | _ -> Node

let env name =
  match kind () with
  | Node -> Js.Dict.get (Node.Process.process##env) name
  | _ -> None

type search_params

external new_url_search_params : string -> search_params = "URLSearchParams"
  [@@mel.new]

external get_param : search_params -> string -> string Js.Nullable.t = "get"
  [@@mel.send]

external location_search : unit -> string = "location.search"
  [@@mel.scope "window"]

let search_param_true name =
  try
    let params = new_url_search_params (location_search ()) in
    match Js.Nullable.toOption (get_param params name) with
    | Some ("true" | "1") -> true
    | _ -> false
  with _ -> false

let electron_owner () = search_param_true "electron"
