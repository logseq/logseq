type auth_data = {
  provider : string;
  id_token : string option;
  access_token : string option;
  refresh_token : string option;
  expires_at : Time.date option;
  sub : string option;
  email : Cli_primitive.email option;
  updated_at : Time.date;
}

type login_result = {
  auth_path : Cli_primitive.path;
  authorize_url : Cli_primitive.url;
  opened : bool;
  email : Cli_primitive.email option;
  sub : string option;
  updated_at : Time.date;
}

type logout_result = {
  auth_path : Cli_primitive.path;
  deleted : bool;
  logout_url : Cli_primitive.url;
  opened : bool;
  logout_completed : bool;
}

val default_auth_path : unit -> Cli_primitive.path
val auth_path : Cli_config.t -> Cli_primitive.path

val read_auth_file :
  Cli_config.t -> auth_data option Error.build_result Cli_effect.t

val write_auth_file :
  Cli_config.t -> auth_data -> auth_data Error.build_result Cli_effect.t

val delete_auth_file : Cli_config.t -> unit Error.build_result Cli_effect.t
val expired_auth : auth_data -> bool

val refresh_auth :
  Cli_config.t -> auth_data -> auth_data Error.build_result Cli_effect.t

val resolve_auth : Cli_config.t -> auth_data Error.build_result Cli_effect.t
val resolve_auth_token : Cli_config.t -> string Error.build_result Cli_effect.t
val login : Cli_config.t -> login_result Error.build_result Cli_effect.t
val logout : Cli_config.t -> logout_result Error.build_result Cli_effect.t
