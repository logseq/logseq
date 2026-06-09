open Cli_effect.Infix

type parsed = Parsed_login | Parsed_logout
type action = Login | Logout

let command_id = function
  | Parsed_login -> Command_id.Login
  | Parsed_logout -> Logout

let validate_parsed _ = Ok ()

let build ?registry:_ _ _ = function
  | Parsed_login -> Ok Login
  | Parsed_logout -> Ok Logout

let login_value (result : Auth_state.login_result) =
  let fields =
    [
      (Edn_util.keyword "auth-path", Edn_util.string result.auth_path);
      (Edn_util.keyword "authorize-url", Edn_util.string result.authorize_url);
      (Edn_util.keyword "opened", Edn_util.bool result.opened);
      ( Edn_util.keyword "updated-at",
        Edn_util.int64 (Time.time_to_epoch_ms result.updated_at) );
    ]
  in
  let fields =
    match result.email with
    | Some email -> (Edn_util.keyword "email", Edn_util.string email) :: fields
    | None -> fields
  in
  let fields =
    match result.sub with
    | Some sub -> (Edn_util.keyword "sub", Edn_util.string sub) :: fields
    | None -> fields
  in
  Edn_util.map (List.rev fields)

let logout_value (result : Auth_state.logout_result) =
  Edn_util.map
    [
      (Edn_util.keyword "auth-path", Edn_util.string result.auth_path);
      (Edn_util.keyword "deleted", Edn_util.bool result.deleted);
      (Edn_util.keyword "logout-url", Edn_util.string result.logout_url);
      (Edn_util.keyword "opened", Edn_util.bool result.opened);
      ( Edn_util.keyword "logout-completed",
        Edn_util.bool result.logout_completed );
    ]

let execute action config mode =
  match action with
  | Login -> (
      Auth_state.login config >>= function
      | Ok result ->
          Cli_effect.pure
            (Cli_result.ok ~command:Command_id.Login mode
               (Raw (login_value result)))
      | Error err ->
          Cli_effect.pure (Output_mode.error ~command:Command_id.Login mode err)
      )
  | Logout -> (
      Auth_state.logout config >>= function
      | Ok result ->
          Cli_effect.pure
            (Cli_result.ok ~command:Command_id.Logout mode
               (Raw (logout_value result)))
      | Error err ->
          Cli_effect.pure
            (Output_mode.error ~command:Command_id.Logout mode err))

let meta id doc =
  {
    Command_registry.id;
    path = Command_id.to_path id;
    doc;
    long_doc = None;
    examples = [];
    options = [];
    category = Command_registry.Authentication;
    requires_graph = Command_id.requires_graph id;
    requires_auth = Command_id.requires_auth id;
    write_command = Command_id.is_write id;
  }

let metadata () = [ meta Command_id.Login "Login"; meta Logout "Logout" ]
