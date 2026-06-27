module Platform : sig
  type node_platform
  type node_options = Js.Json.t

  val node_platform : node_options Js.Nullable.t -> node_platform
  val node : node_platform
end
