type opts = { selector : string list }
type parsed = Parsed_example of opts

type action = {
  selector : string;
  selector_path : string list;
  matched_commands : string list;
  examples : string list;
  message : string;
}

val resolve_selector :
  Command_registry.t -> string list -> action Error.build_result

include Command_spec.S with type parsed := parsed and type action := action
