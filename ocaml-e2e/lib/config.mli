external process_env : Node.Process.t -> string Js.Dict.t = "env" [@@mel.get]
val env_opt : Js.Dict.key -> string option
val port : int
val headless : bool
val slow_mo : float
val local_sync : bool
val mac : bool
