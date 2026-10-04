(* Login dialog body — .cp__user-login form posting real Cognito
   USER_PASSWORD_AUTH (frontend/handler/user.cljs flow). On success the
   tokens land in localStorage (id-token/access-token/refresh-token) and
   are pushed to the worker via thread-api/sync-app-state so db-sync can
   refresh them. No SECRET_HASH — the cljs e2e helper signs with a client
   secret that the browser app doesn't hold; the public-client flow is
   what the prod app uses. *)

open Promise_ext
open Lui_elements

let dom = Logseq_dom.dom
module T = I18n

(* Cognito constants live in Rtc_ops (they're sync config the worker
   needs too) *)
let cognito_url = Rtc_ops.cognito_url
let client_id = Rtc_ops.client_id
let oauth_token_url = Rtc_ops.oauth_token_url

let field_value name =
  match Browser_ui.qs (".cp__user-login input[name=" ^ name ^ "]") with
  | Some el -> Browser_ui.value el
  | None -> ""

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
  Platform.local_storage_set "id-token" id;
  Platform.local_storage_set "access-token" acc;
  if refresh <> "" then Platform.local_storage_set "refresh-token" refresh;
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
  ignore
    (Browser_ui.set_timeout
       (fun () ->
         match Browser_ui.qs ".cp__user-login [autofocus]" with
         | Some el -> Browser_ui.focus el
         | None -> ())
       32)

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

let submit ctx =
  let user = field_value "email" and pass = field_value "password" in
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

let signup_submit ctx =
  let email = field_value "email"
  and user = field_value "username"
  and pass = field_value "password"
  and confirm = field_value "confirm-password" in
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

let forgot_submit ctx =
  let user = field_value "email" in
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

let reset_submit ctx user =
  let code = field_value "code"
  and pass = field_value "password"
  and confirm = field_value "confirm-password" in
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

let confirm_submit ctx user _next_step =
  let code = field_value "code" in
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

let input_row ~key ~id ~name ~type_ ~label ~autocomplete ?(autofocus = false) () =
  dom ~key ~style_class:"relative w-full flex flex-col gap-3 pb-1"
    [ dom ~key:"l" ~tag:"label" ~style_class:"text-sm font-medium"
        ~attrs:[ ("for", id) ] ~text:label []
    ; dom ~key:"i" ~tag:"input" ~style_class:"ui__input"
        ~attrs:
          ([ ("id", id); ("name", name); ("type", type_)
           ; ("autocomplete", autocomplete); ("required", "") ]
          @ if autofocus then [ ("autofocus", "") ] else [])
        []
    ]

let submit_btn ~key label on_submit =
  dom ~key ~tag:"button" ~text:label
    ~style_class:"ui__button ls-btn-primary w-full"
    ~attrs:[ ("type", "submit") ]
    ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then on_submit ())
    []

let back_link ctx =
  dom ~key:"back" ~tag:"p" ~style_class:"pt-1 text-center"
    [ dom ~key:"a" ~tag:"a"
        ~style_class:"text-sm opacity-60 hover:opacity-80 underline"
        ~text:(I18n.t "account/back-to-login")
        ~events:"click"
        ~on_dom_event:(fun n _ -> if n = "click" then set_tab ctx Login)
        [] ]

let form ~key on_submit children =
  dom ~key ~tag:"form"
    ~style_class:"relative flex flex-col justify-center items-center gap-4 w-full"
    ~attrs:
      [ ("onsubmit", "return false"); ("novalidate", "")
      ; ("autocomplete", "off") ]
    ~events:"submit"
    ~on_dom_event:(fun n _ -> if n = "submit" then on_submit ())
    children

let login_panel ctx =
  form ~key:"f-login"
    (fun () -> submit ctx)
    [ input_row ~key:"r-email" ~id:"email" ~name:"email" ~type_:"text"
        ~label:(I18n.t "account/email") ~autocomplete:"username"
        ~autofocus:true ()
    ; input_row ~key:"r-pw" ~id:"password" ~name:"password"
        ~type_:"password" ~label:(I18n.t "account/password")
        ~autocomplete:"current-password" ()
    ; dom ~key:"lg-sub" ~style_class:"w-full"
        [ submit_btn ~key:"lg-btn" (I18n.t "account/sign-in")
            (fun () -> submit ctx)
        ; dom ~key:"lg-foot" ~tag:"p" ~style_class:"pt-4 text-center"
            [ dom ~key:"f1" ~tag:"span" ~style_class:"text-sm"
                [ dom ~key:"f1a" ~tag:"span" ~style_class:"opacity-50"
                    ~text:(I18n.t "account/dont-have-account-question" ^ " ")
                    []
                ; dom ~key:"f1b" ~tag:"a"
                    ~style_class:"underline opacity-60 hover:opacity-80"
                    ~text:(I18n.t "account/sign-up")
                    ~events:"click"
                    ~on_dom_event:(fun n _ ->
                      if n = "click" then set_tab ctx Signup)
                    []
                ; dom ~key:"f1c" ~tag:"br" []
                ; dom ~key:"f1d" ~tag:"span" ~style_class:"opacity-50"
                    ~text:(I18n.t "account/or" ^ " ") [] ]
            ; dom ~key:"f2" ~tag:"a"
                ~style_class:"text-sm opacity-60 hover:opacity-80 underline"
                ~text:(I18n.t "encryption/forgot-password-question")
                ~events:"click"
                ~on_dom_event:(fun n _ ->
                  if n = "click" then set_tab ctx Reset_pw)
                [] ]
        ]
    ]

let signup_panel ctx =
  form ~key:"f-signup" (fun () -> signup_submit ctx)
    [ input_row ~key:"r-email" ~id:"email" ~name:"email" ~type_:"email"
        ~label:(I18n.t "account/email") ~autocomplete:"email"
        ~autofocus:true ()
    ; input_row ~key:"r-user" ~id:"username" ~name:"username"
        ~type_:"text" ~label:(I18n.t "account/username")
        ~autocomplete:"username" ()
    ; input_row ~key:"r-pw" ~id:"password" ~name:"password"
        ~type_:"password" ~label:(I18n.t "account/password")
        ~autocomplete:"new-password" ()
    ; input_row ~key:"r-pw2" ~id:"confirm-password" ~name:"confirm-password"
        ~type_:"password" ~label:(I18n.t "account/confirm-password")
        ~autocomplete:"new-password" ()
    ; dom ~key:"su-sub" ~style_class:"w-full"
        [ submit_btn ~key:"su-btn" (I18n.t "account/create-account")
            (fun () -> signup_submit ctx) ]
    ; back_link ctx
    ]

let reset_panel ctx =
  form ~key:"f-reset" (fun () -> forgot_submit ctx)
    [ input_row ~key:"r-email" ~id:"email" ~name:"email" ~type_:"email"
        ~label:(I18n.t "account/enter-email") ~autocomplete:"email"
        ~autofocus:true ()
    ; dom ~key:"rs-sub" ~style_class:"w-full"
        [ submit_btn ~key:"rs-btn" (I18n.t "account/send-code")
            (fun () -> forgot_submit ctx) ]
    ; back_link ctx
    ]

let reset_confirm_panel ctx user =
  form ~key:"f-rset2" (fun () -> reset_submit ctx user)
    [ input_row ~key:"r-code" ~id:"code" ~name:"code" ~type_:"text"
        ~label:(I18n.t "account/enter-code") ~autocomplete:"off"
        ~autofocus:true ()
    ; input_row ~key:"r-pw" ~id:"password" ~name:"password"
        ~type_:"password" ~label:(I18n.t "account/password")
        ~autocomplete:"new-password" ()
    ; input_row ~key:"r-pw2" ~id:"confirm-password" ~name:"confirm-password"
        ~type_:"password" ~label:(I18n.t "account/confirm-password")
        ~autocomplete:"new-password" ()
    ; dom ~key:"rc-sub" ~style_class:"w-full"
        [ submit_btn ~key:"rc-btn" (I18n.t "account/reset-password")
            (fun () -> reset_submit ctx user) ]
    ; back_link ctx
    ]

let confirm_panel ctx user next_step =
  form ~key:"f-confirm" (fun () -> confirm_submit ctx user next_step)
    [ dom ~key:"cc-hint" ~tag:"p" ~style_class:"pb-2 opacity-60"
        ~text:(I18n.t "account/code-on-the-way-tip") []
    ; input_row ~key:"r-code" ~id:"code" ~name:"code" ~type_:"text"
        ~label:(I18n.t "account/enter-code") ~autocomplete:"off"
        ~autofocus:true ()
    ; dom ~key:"cc-sub" ~style_class:"w-full"
        [ submit_btn ~key:"cc-btn" (I18n.t "account/confirm")
            (fun () -> confirm_submit ctx user next_step) ]
    ; back_link ctx
    ]

let panel ctx (a : auth_ui) : t =
  let title, inner =
    match a.session_user with
    | Some u ->
        ( I18n.t "ui/login"
        , [ dom ~key:"lg-in" ~style_class:"w-full text-center"
              [ dom ~key:"p" ~tag:"p" ~style_class:"mb-4"
                  ~text:(I18n.t1 "account/already-logged-in-as" u) []
              ; dom ~key:"so" ~tag:"button"
                  ~text:(I18n.t "account/sign-out")
                  ~style_class:"ui__button ls-btn w-full"
                  ~events:"click"
                  ~on_dom_event:(fun n _ ->
                    if n = "click" then sign_out ctx)
                  [] ] ] )
    | None -> (
        match a.tab with
        | Login -> (I18n.t "ui/login", [ login_panel ctx ])
        | Signup -> (I18n.t "account/sign-up", [ signup_panel ctx ])
        | Reset_pw -> (I18n.t "account/reset-password", [ reset_panel ctx ])
        | Reset_confirm user ->
            (I18n.t "account/reset-password", [ reset_confirm_panel ctx user ])
        | Confirm_code (user, next_step) ->
            (I18n.t "account/confirm", [ confirm_panel ctx user next_step ]))
  in
  Logseq_dom.fragment
    (dom ~key:"lg-t" ~tag:"h2" ~style_class:"ui__dialog-title ls-auth-title"
       ~text:title []
     :: (if a.err = "" then []
         else
           (* cljs shui/alert {:variant :destructive :class "mb-4"} +
              alert-description *)
           [ dom ~key:"err" ~tag:"div"
               ~style_class:
                 "ui__alert relative w-full rounded-lg border p-4 mb-4"
               ~attrs:[ ("variant", "destructive") ]
               [ dom ~key:"err-d" ~tag:"div"
                   ~style_class:
                     "ui__alert-description text-sm [&_p]:leading-relaxed"
                   ~text:a.err [] ] ])
     @ inner)

let body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  Signal.update (auth_st ctx) (fun _ ->
      { tab = Login; err = ""; session_user = session_username () });
  Logseq_dom.dyn ~equal:( == )
    (fun a -> dom ~key:"login" ~style_class:"cp__user-login" [ panel ctx a ])
    (auth_st ctx).Signal.state_signal ctx parent
