type opts = { selector : string Rrbvec.t }
type parsed = Parsed_example of opts

type action = {
  selector : string;
  selector_path : string Rrbvec.t;
  matched_commands : string Rrbvec.t;
  examples : string Rrbvec.t;
  message : string;
}

val resolve_selector :
  Command_registry.t -> string Rrbvec.t -> action Error.build_result

include Command_spec.S with type parsed := parsed and type action := action
