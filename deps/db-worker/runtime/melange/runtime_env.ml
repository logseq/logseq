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
