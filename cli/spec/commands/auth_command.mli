type parsed = Parsed_login | Parsed_logout
type action = Login | Logout

include Command_spec.S with type parsed := parsed and type action := action
