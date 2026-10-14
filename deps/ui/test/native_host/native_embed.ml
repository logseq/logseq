(* Record the host's outbound replies without starting an application graph. *)
let replies : string list ref = ref []
let platform_event message = replies := message :: !replies
let extension_event _node _identifier _name _fields = ""
