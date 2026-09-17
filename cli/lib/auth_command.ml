open Cli_effect.Infix

type parsed =
  | Parsed_login of { username : string option; password : string option }
  | Parsed_logout

type action = Login of Auth_state.login_mode | Logout

let command_id = function
  | Parsed_login _ -> Command_id.Login
  | Parsed_logout -> Logout

let login_mode username password =
  match (username, password) with
  | None, None -> Ok Auth_state.Browser_login
  | Some username, Some password when username <> "" && password <> "" ->
      Ok (Auth_state.Password_login { username; password })
  | _ ->
      Error
        (Error.invalid_options
           "login requires both --username and --password with non-empty values")

let validate_parsed = function
  | Parsed_login { username; password } ->
      Error.map (fun _ -> ()) (login_mode username password)
  | Parsed_logout -> Ok ()

let build ?registry:_ _ _ = function
  | Parsed_login { username; password } ->
      Error.map (fun mode -> Login mode) (login_mode username password)
  | Parsed_logout -> Ok Logout

let login_value (result : Auth_state.login_result) =
  let fields =
    Vec.of_array
      [|
        (Edn_util.keyword "auth-path", Edn_util.string result.auth_path);
        ( Edn_util.keyword "updated-at",
          Edn_util.int64 (Time.time_to_epoch_ms result.updated_at) );
      |]
  in
  let fields =
    match result.details with
    | Auth_state.Password_login_result -> fields
    | Auth_state.Browser_login_result { authorize_url; opened } ->
        Vec.append_array fields
          [|
            (Edn_util.keyword "authorize-url", Edn_util.string authorize_url);
            (Edn_util.keyword "opened", Edn_util.bool opened);
          |]
  in
  let fields =
    match result.email with
    | Some email ->
        Vec.push_back fields (Edn_util.keyword "email", Edn_util.string email)
    | None -> fields
  in
  let fields =
    match result.sub with
    | Some sub ->
        Vec.push_back fields (Edn_util.keyword "sub", Edn_util.string sub)
    | None -> fields
  in
  Edn_util.map_vec fields

let logout_value (result : Auth_state.logout_result) =
  Edn_util.map_vec
    (Vec.of_array
       [|
         (Edn_util.keyword "auth-path", Edn_util.string result.auth_path);
         (Edn_util.keyword "deleted", Edn_util.bool result.deleted);
         (Edn_util.keyword "logout-url", Edn_util.string result.logout_url);
         (Edn_util.keyword "opened", Edn_util.bool result.opened);
         ( Edn_util.keyword "logout-completed",
           Edn_util.bool result.logout_completed );
       |])

let execute_with_mode action config mode =
  match action with
  | Login login_mode -> (
      Auth_state.login config login_mode >>= function
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
    examples = Vec.empty;
    options = Vec.empty;
    category = Command_registry.Authentication;
    requires_graph = Command_id.requires_graph id;
    requires_auth = Command_id.requires_auth id;
    write_command = Command_id.is_write id;
    human_table_headers_order = Vec.empty;
  }

let metadata () =
  Vec.of_array [| meta Command_id.Login "Login"; meta Logout "Logout" |]

let execute action config =
  let (Output.Mode.Packed mode) = Output_mode.for_config config in
  execute_with_mode action config mode
