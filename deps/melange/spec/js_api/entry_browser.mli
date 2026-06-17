module Platform : sig
  type browser_platform

  val browser_platform : unit -> browser_platform
  val browser : browser_platform
end
