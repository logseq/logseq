type parsed =
  | Parsed_login of { username : string option; password : string option }
  | Parsed_logout

type action = Login of Auth_state.login_mode | Logout

include Command_spec.S with type parsed := parsed and type action := action
