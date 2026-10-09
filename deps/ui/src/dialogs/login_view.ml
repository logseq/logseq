(* Login dialog body — .cp__user-login form posting real Cognito
   USER_PASSWORD_AUTH (frontend/handler/user.cljs flow). On success the
   tokens land in localStorage (id-token/access-token/refresh-token) and
   are pushed to the worker via thread-api/sync-app-state so db-sync can
   refresh them. No SECRET_HASH — the cljs e2e helper signs with a client
   secret that the browser app doesn't hold; the public-client flow is
   what the prod app uses. *)

open Promise_ext
open Lui_elements

module T = I18n

(* Cognito constants live in Rtc_ops (they're sync config the worker
   needs too) *)
let cognito_url = Rtc_ops.cognito_url
let client_id = Rtc_ops.client_id
let oauth_token_url = Rtc_ops.oauth_token_url

let text_of ev =
  match ev with
  | Lui_protocol.TextChanged (_, s) -> s
  | _ -> ""

(* Form field values ride Signal.state now (previously read back from
   the DOM via input[name=…] selectors at submit time). One record per
   mounted body; a field's state survives tab switches so re-mounted
   inputs restore through ~text_signal. *)
type fields =
  { email : string Signal.state
  ; username : string Signal.state
  ; password : string Signal.state
  ; confirm_password : string Signal.state
  ; code : string Signal.state
  }

let fields_of ctx : fields =
  let st () = Signal.state ctx.Lui_ui.ui_scheduler "" in
  { email = st ()
  ; username = st ()
  ; password = st ()
  ; confirm_password = st ()
  ; code = st ()
  }

let json_str s = Js.Json.string s

let body_json user pass =
  let open Js.Json in
  let auth =
    object_
      (Js.Dict.fromList
         [ ("USERNAME", json_str user); ("PASSWORD", json_str pass) ])
  in
  stringify
    (object_
       (Js.Dict.fromList
          [ ("AuthFlow", json_str "USER_PASSWORD_AUTH")
          ; ("ClientId", json_str client_id)
          ; ("AuthParameters", auth)
          ]))

let dict_str (o : Js.Json.t Js.Dict.t) k =
  match Js.Dict.get o k with
  | Some v -> Js.Json.decodeString v
  | None -> None

let dict_obj (o : Js.Json.t Js.Dict.t) k =
  match Js.Dict.get o k with
  | Some v -> Js.Json.decodeObject v
  | None -> None

let tokens_of resp =
  match Js.Json.decodeObject resp with
  | None -> None
  | Some o -> (
      match dict_obj o "AuthenticationResult" with
      | None -> None
      | Some ar -> (
          match
            ( dict_str ar "IdToken", dict_str ar "AccessToken"
            , dict_str ar "RefreshToken" )
          with
          | Some id, Some acc, refresh ->
              Some (id, acc, Option.value refresh ~default:"")
          | _ -> None))

let store_tokens id acc refresh =
  Ui_services.storage_set "id-token" id;
  Ui_services.storage_set "access-token" acc;
  if refresh <> "" then Ui_services.storage_set "refresh-token" refresh;
  ignore
    (Runtime.invoke1 "thread-api/sync-app-state"
       (Wire.Map
          [ (Wire.kw "auth/id-token", Wire.String id)
          ; (Wire.kw "auth/access-token", Wire.String acc)
          ; (Wire.kw "auth/refresh-token", Wire.String refresh)
          ; (Wire.kw "auth/oauth-client-id", Wire.String client_id)
          ; (Wire.kw "auth/oauth-token-url", Wire.String oauth_token_url)
          ]));
  (* cljs flows/current-login-user watch -> trigger-start-rtc [:login] *)
  Rtc_flows.notify_login ()

(* cljs components/user/login.cljs authenticator — a small tab state
   machine over the dialog: login / signup / reset-password / confirm-code,
   plus a logged-in pane when a session already exists. Tab switches only
   swap the inner form; the dialog chrome stays. *)

type auth_tab =
  | Login
  | Signup
  | Reset_pw
  | Reset_confirm of string (* username the reset code was sent for *)
  | Confirm_code of string * string (* username, next-step *)

type auth_ui =
  { tab : auth_tab
  ; err : string
  ; session_user : string option
  }

let auth_ref : auth_ui Signal.state option ref = ref None

let auth_st ctx =
  match !auth_ref with
  | Some s -> s
  | None ->
      let s =
        Signal.state ctx.Lui_ui.ui_scheduler
          { tab = Login; err = ""; session_user = None }
      in
      auth_ref := Some s;
      s

let set_auth ctx f =
  Signal.update (auth_st ctx) f;
  Runtime.flush ()

let set_tab ctx tab =
  set_auth ctx (fun a -> { a with tab; err = "" });
  (* autofocus alone doesn't refire on a patched-in node *)
  Ui_services.timers_later ~ms:32 (fun () ->
      match Ui_services.dom_query ".cp__user-login [autofocus]" with
      | Some el -> el.Ui_services.focus ()
      | None -> ())

let fail ctx msg = set_auth ctx (fun a -> { a with err = msg })

(* cognito's REST __type may carry a namespace prefix
   (com.amazon.coral.service#NotAuthorizedException); cljs reads the
   amplify error's bare name/code *)
let error_name_of (json : Js.Json.t) =
  match Js.Json.decodeObject json with
  | Some o -> (
      match dict_str o "__type" with
      | Some t -> (
          let short_after pred s =
            match String.rindex_opt s pred with
            | Some i -> String.sub s (i + 1) (String.length s - i - 1)
            | None -> s
          in
          Some (short_after '.' (short_after '#' t)))
      | None -> None)
  | None -> None

(* cljs login.cljs auth-error-message — cognito exception name ->
   i18n copy; unknown errors get the generic message *)
let error_message (json : Js.Json.t) =
  let key name =
    match name with
    | "UserNotFoundException" -> "account/auth-error-user-not-found"
    | "NotAuthorizedException" -> "account/auth-error-invalid-credentials"
    | "UserNotConfirmedException" -> "account/auth-error-user-not-confirmed"
    | "UsernameExistsException" -> "account/auth-error-username-exists"
    | "InvalidPasswordException" -> "account/password-policy-tip"
    | "CodeMismatchException" -> "account/auth-error-code-mismatch"
    | "ExpiredCodeException" -> "account/auth-error-code-expired"
    | "LimitExceededException" | "TooManyRequestsException" ->
        "account/auth-error-too-many-requests"
    | "TooManyFailedAttemptsException" ->
        "account/auth-error-too-many-attempts"
    | "CodeDeliveryFailureException" ->
        "account/auth-error-code-delivery-failed"
    | "UserAlreadyAuthenticatedException" ->
        "account/auth-error-already-authenticated"
    | "InvalidParameterException" -> "account/auth-error-invalid-parameter"
    | _ -> "account/auth-error-generic"
  in
  match error_name_of json with
  | Some n -> I18n.t (key n)
  | None -> T.login_failed

(* cljs login.cljs validate-password! — client-side policy check before
   the signup / confirm-reset calls *)
let valid_password pw =
  let has pred =
    let rec go i = i < String.length pw && (pred pw.[i] || go (i + 1)) in
    go 0
  in
  let is_lower c = c >= 'a' && c <= 'z' in
  let is_upper c = c >= 'A' && c <= 'Z' in
  let sym = "!@#$%^&*()_+-=[]{};':\"\\|,.<>/?~`" in
  String.length pw >= 8 && has is_lower && has is_upper
  && has (fun c -> String.contains sym c)

let validate_password ctx pw =
  if valid_password pw then true
  else (
    fail ctx (I18n.t "account/password-policy-tip");
    false)

let cognito_call ctx target payload f_ok =
  let init =
    Fetch.RequestInit.make ~method_:Post
      ~headers:
        (Fetch.HeadersInit.makeWithArray
           [| ( "X-Amz-Target"
              , "AWSCognitoIdentityProviderService." ^ target )
            ; ("Content-Type", "application/x-amz-json-1.1") |])
      ~body:(Fetch.BodyInit.make payload)
      ()
  in
  (let* resp = Fetch.fetchWithInit cognito_url init in
   let* json = Fetch.Response.json resp in
   match Js.Json.decodeObject json with
   | Some o -> (
       match dict_str o "__type" with
       | Some _ -> fail ctx (error_message json); Js.Promise.resolve ()
       | None -> f_ok json)
   | None -> f_ok json)
  |> Js.Promise.catch (fun _ ->
         fail ctx T.login_failed;
         Js.Promise.resolve ())
  |> ignore

let submit ctx fields =
  let user = Runtime.signal_get fields.email
  and pass = Runtime.signal_get fields.password in
  if user = "" || pass = "" then ()
  else
    let init =
      Fetch.RequestInit.make ~method_:Post
        ~headers:
          (Fetch.HeadersInit.makeWithArray
             [| ( "X-Amz-Target"
                , "AWSCognitoIdentityProviderService.InitiateAuth" )
              ; ("Content-Type", "application/x-amz-json-1.1")
              |])
        ~body:(Fetch.BodyInit.make (body_json user pass))
        ()
    in
    (let* resp = Fetch.fetchWithInit cognito_url init in
    let* json = Fetch.Response.json resp in
    match tokens_of json with
    | Some (id, acc, refresh) ->
        store_tokens id acc refresh;
        Dialogs_state.close_named "login";
        Js.Promise.resolve ()
    | None ->
        fail ctx (error_message json);
        Js.Promise.resolve ())
    |> Js.Promise.catch (fun _ ->
           fail ctx T.login_failed;
           Js.Promise.resolve ())
    |> ignore

let json_obj xs = Js.Json.object_ (Js.Dict.fromList xs)

let signup_submit ctx fields =
  let email = Runtime.signal_get fields.email
  and user = Runtime.signal_get fields.username
  and pass = Runtime.signal_get fields.password
  and confirm = Runtime.signal_get fields.confirm_password in
  if user = "" || pass = "" || email = "" then ()
  else if not (validate_password ctx pass) then ()
  else if pass <> confirm then
    fail ctx (I18n.t "account/passwords-do-not-match")
  else
    let open Js.Json in
    let payload =
      stringify
        (json_obj
           [ ("ClientId", string client_id)
           ; ("Username", string user)
           ; ("Password", string pass)
           ; ( "UserAttributes"
             , array
                 [| json_obj
                      [ ("Name", string "email"); ("Value", string email) ]
                 |] )
           ])
    in
    (* cognito returns nextStep.signUpStep in the REST response *)
    cognito_call ctx "SignUp" payload (fun json ->
        let confirmed =
          match Js.Json.decodeObject json with
          | Some o -> (
              match Js.Dict.get o "UserConfirmed" with
              | Some v -> Js.Json.decodeBoolean v = Some true
              | None -> false)
          | None -> false
        in
        set_tab ctx
          (if confirmed then Login else Confirm_code (user, "CONFIRM_SIGN_UP"));
        Js.Promise.resolve ())

let forgot_submit ctx fields =
  let user = Runtime.signal_get fields.email in
  if user = "" then ()
  else
    let payload =
      Js.Json.stringify
        (json_obj
           [ ("ClientId", Js.Json.string client_id)
           ; ("Username", Js.Json.string user) ])
    in
    cognito_call ctx "ForgotPassword" payload (fun _ ->
        set_tab ctx (Reset_confirm user);
        Js.Promise.resolve ())

let reset_submit ctx fields user =
  let code = Runtime.signal_get fields.code
  and pass = Runtime.signal_get fields.password
  and confirm = Runtime.signal_get fields.confirm_password in
  if code = "" || pass = "" then ()
  else if not (validate_password ctx pass) then ()
  else if pass <> confirm then
    fail ctx (I18n.t "account/passwords-do-not-match")
  else
    let payload =
      Js.Json.stringify
        (json_obj
           [ ("ClientId", Js.Json.string client_id)
           ; ("Username", Js.Json.string user)
           ; ("ConfirmationCode", Js.Json.string code)
           ; ("Password", Js.Json.string pass) ])
    in
    cognito_call ctx "ConfirmForgotPassword" payload (fun _ ->
        set_tab ctx Login;
        Js.Promise.resolve ())

let confirm_submit ctx fields user _next_step =
  let code = Runtime.signal_get fields.code in
  if code = "" then ()
  else
    let payload =
      Js.Json.stringify
        (json_obj
           [ ("ClientId", Js.Json.string client_id)
           ; ("Username", Js.Json.string user)
           ; ("ConfirmationCode", Js.Json.string code) ])
    in
    cognito_call ctx "ConfirmSignUp" payload (fun _ ->
        set_tab ctx Login;
        Js.Promise.resolve ())

let sign_out ctx =
  Rtc_flows.sign_out ();
  set_auth ctx (fun _ -> { tab = Login; err = ""; session_user = None })

(* cljs user.cljs username — the id-token's cognito:username claim *)
let session_username = Rtc_flows.username

(* cljs login.css input rows: label + shui input stacked in a
   relative w-full flex flex-col gap-3 pb-1 wrapper. The <form>'s
   submit event is gone — Enter submits through each field's
   on_submit instead; name/autocomplete attrs have no component
   equivalent (fields are read from signal state, not the DOM). *)
let input_row ~key ~caption ?(autofocus = false) ~secure ~value ~on_submit =
  (* cljs .cp__user-login rows stretch to the form width;
     ls-auth-field carries the cljs label lh-5 + wrapper pb-1 *)
  column ~key ~gap:12 ~cross:`stretch ~style_class:"ls-auth-field"
    [ label ~key:"l" ~value:caption []
    ; (if secure then secure_field else input ~kind:`text)
        ~key:"i" ~style_class:"ui__input"
        ~autofocus
        ~text_signal:(Signal.value value)
        ~on_input:(fun ev -> Signal.set value (text_of ev))
        ~on_submit:(fun _ -> on_submit ())
        []
    ]

let submit_btn ~key label on_submit =
  button ~key ~variant:`primary ~text:label
    ~style_class:"ui__button ls-btn-primary"
    ~on_press:(fun _ -> on_submit ())
    []

(* cljs "Back to login"/"Sign up"/"Forgot password" are <a> action
   links — component-wise they're pressable text (the ls-auth-link
   class keeps the underline/muted styling the cljs utility classes
   carried) *)
let action_link ~key ctx text_ tab =
  text ~key ~style_class:"ls-auth-link" ~value:text_
    ~on_press:(fun _ -> set_tab ctx tab)
    []

let back_link ctx =
  (* stays centered inside the stretch-aligned form columns *)
  column ~key:"back" ~cross:`center
    [ action_link ~key:"a" ctx (I18n.t "account/back-to-login") Login ]

let login_panel ctx fields =
  let on_submit () = submit ctx fields in
  column ~key:"f-login" ~gap:16 ~cross:`stretch
    [ input_row ~key:"r-email" ~caption:(I18n.t "account/email")
        ~autofocus:true ~secure:false ~value:fields.email ~on_submit
    ; input_row ~key:"r-pw" ~caption:(I18n.t "account/password")
        ~secure:true ~value:fields.password ~on_submit
    ; submit_btn ~key:"lg-btn" (I18n.t "account/sign-in") on_submit
    ; column ~key:"lg-foot" ~cross:`center ~gap:0
        ~style_class:"ls-auth-foot"
        [ row ~key:"f1" ~gap:4
            [ text ~key:"f1a" ~style_class:"ls-auth-muted"
                ~value:(I18n.t "account/dont-have-account-question" ^ " ")
                []
            ; action_link ~key:"f1b" ctx (I18n.t "account/sign-up")
                Signup ]
        ; row ~key:"f2" ~gap:4
            [ text ~key:"f1d" ~style_class:"ls-auth-muted"
                ~value:(I18n.t "account/or" ^ " ") []
            ; action_link ~key:"f2a" ctx
                (I18n.t "encryption/forgot-password-question") Reset_pw ]
        ]
    ]

let signup_panel ctx fields =
  let on_submit () = signup_submit ctx fields in
  column ~key:"f-signup" ~gap:16 ~cross:`stretch
    [ input_row ~key:"r-email" ~caption:(I18n.t "account/email")
        ~autofocus:true ~secure:false ~value:fields.email ~on_submit
    ; input_row ~key:"r-user" ~caption:(I18n.t "account/username")
        ~secure:false ~value:fields.username ~on_submit
    ; input_row ~key:"r-pw" ~caption:(I18n.t "account/password")
        ~secure:true ~value:fields.password ~on_submit
    ; input_row ~key:"r-pw2" ~caption:(I18n.t "account/confirm-password")
        ~secure:true ~value:fields.confirm_password ~on_submit
    ; submit_btn ~key:"su-btn" (I18n.t "account/create-account") on_submit
    ; back_link ctx
    ]

let reset_panel ctx fields =
  let on_submit () = forgot_submit ctx fields in
  column ~key:"f-reset" ~gap:16 ~cross:`stretch
    [ input_row ~key:"r-email" ~caption:(I18n.t "account/enter-email")
        ~autofocus:true ~secure:false ~value:fields.email ~on_submit
    ; submit_btn ~key:"rs-btn" (I18n.t "account/send-code") on_submit
    ; back_link ctx
    ]

let reset_confirm_panel ctx fields user =
  let on_submit () = reset_submit ctx fields user in
  column ~key:"f-rset2" ~gap:16 ~cross:`stretch
    [ input_row ~key:"r-code" ~caption:(I18n.t "account/enter-code")
        ~autofocus:true ~secure:false ~value:fields.code ~on_submit
    ; input_row ~key:"r-pw" ~caption:(I18n.t "account/password")
        ~secure:true ~value:fields.password ~on_submit
    ; input_row ~key:"r-pw2" ~caption:(I18n.t "account/confirm-password")
        ~secure:true ~value:fields.confirm_password ~on_submit
    ; submit_btn ~key:"rc-btn" (I18n.t "account/reset-password") on_submit
    ; back_link ctx
    ]

let confirm_panel ctx fields user next_step =
  let on_submit () = confirm_submit ctx fields user next_step in
  column ~key:"f-confirm" ~gap:16 ~cross:`center
    [ paragraph ~key:"cc-hint" ~style_class:"ls-auth-muted"
        ~value:(I18n.t "account/code-on-the-way-tip") []
    ; input_row ~key:"r-code" ~caption:(I18n.t "account/enter-code")
        ~autofocus:true ~secure:false ~value:fields.code ~on_submit
    ; submit_btn ~key:"cc-btn" (I18n.t "account/confirm") on_submit
    ; back_link ctx
    ]

let panel ctx fields (a : auth_ui) : t =
  let title, inner =
    match a.session_user with
    | Some u ->
        ( I18n.t "ui/login"
        , [ column ~key:"lg-in" ~cross:`center ~gap:16
              [ paragraph ~key:"p"
                  ~value:(I18n.t1 "account/already-logged-in-as" u) []
              ; button ~key:"so" ~variant:`outline
                  ~text:(I18n.t "account/sign-out")
                  ~style_class:"ui__button ls-btn"
                  ~on_press:(fun _ -> sign_out ctx)
                  [] ] ] )
    | None -> (
        match a.tab with
        | Login -> (I18n.t "ui/login", [ login_panel ctx fields ])
        | Signup -> (I18n.t "account/sign-up", [ signup_panel ctx fields ])
        | Reset_pw ->
            (I18n.t "account/reset-password", [ reset_panel ctx fields ])
        | Reset_confirm user ->
            ( I18n.t "account/reset-password"
            , [ reset_confirm_panel ctx fields user ] )
        | Confirm_code (user, next_step) ->
            ( I18n.t "account/confirm"
            , [ confirm_panel ctx fields user next_step ] ))
  in
  Logseq_el.fragment
    (heading ~key:"lg-t" ~level:2
       ~style_class:"ui__dialog-title ls-auth-title" ~value:title []
     :: (if a.err = "" then []
         else
           (* cljs shui/alert {:variant :destructive} + alert-description —
              destructive styling comes from the .cp__user-login .ui__alert
              rules *)
           [ column ~key:"err" ~style_class:"ui__alert"
               [ paragraph ~key:"err-d"
                   ~style_class:"ui__alert-description"
                   ~value:a.err [] ] ])
    @ inner)

let body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  Signal.update (auth_st ctx) (fun _ ->
      { tab = Login; err = ""; session_user = session_username () });
  let fields = fields_of ctx in
  (reactive ~equal:( == ) (fun a ->
       box ~key:"login" ~style_class:"cp__user-login"
         [ panel ctx fields a ])
     (auth_st ctx).Signal.state_signal)
    ctx parent
