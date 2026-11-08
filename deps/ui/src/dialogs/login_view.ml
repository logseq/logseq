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

(* Form field values belong to one mounted body and reset on tab switches. *)
type fields =
  { email : string Signal.state
  ; username : string Signal.state
  ; password : string Signal.state
  ; confirm_password : string Signal.state
  ; code : string Signal.state
  ; pending : bool Signal.state
  ; invalid_field : string Signal.state
  }

let fields_of ctx : fields =
  let st () = Signal.state ctx.Lui_ui.ui_scheduler "" in
  { email = st ()
  ; username = st ()
  ; password = st ()
  ; confirm_password = st ()
  ; code = st ()
  ; pending = Signal.state ctx.Lui_ui.ui_scheduler false
  ; invalid_field = st ()
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
  let* () = Platform.save_auth_tokens id acc refresh in
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
  Rtc_flows.notify_login ();
  Js.Promise.resolve ()

(* cljs components/user/login.cljs authenticator — a small tab state
   machine over the dialog: login / signup / reset-password / confirm-code,
   plus a logged-in pane when a session already exists. Tab switches only
   swap the inner form; the dialog chrome stays. *)

type auth_tab =
  | Login
  | Signup
  | Reset_pw
  | Reset_confirm of string (* username the reset code was sent for *)
  | Confirm_code of string * string option (* username, delivery destination *)

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
  if Ui_effect.alive ctx.Lui_ui.ui_scope then (
    Signal.update (auth_st ctx) f;
    Runtime.flush ())

let set_tab ctx fields tab =
  if Ui_effect.alive ctx.Lui_ui.ui_scope then (
    List.iter (fun field -> Signal.set field "")
      [ fields.email; fields.username; fields.password; fields.confirm_password
      ; fields.code; fields.invalid_field ];
    set_auth ctx (fun a -> { a with tab; err = "" });
    (* autofocus alone doesn't refire on a patched-in node *)
    ignore
      (Ui_effect.timeout ~scope:ctx.Lui_ui.ui_scope 32 (fun () ->
           match Ui_services.dom_query ".cp__user-login [autofocus]" with
           | Some el -> el.Ui_services.focus ()
           | None -> ())))

let fail ctx msg = set_auth ctx (fun a -> { a with err = msg })

let focus_field id =
  Option.iter (fun el -> el.Ui_services.focus ())
    (Ui_services.dom_query ("#auth-" ^ id))

let invalid ctx fields id message =
  Runtime.signal_set fields.invalid_field id;
  fail ctx message;
  focus_field id

let required ctx fields values =
  if Runtime.signal_get fields.pending then false
  else
    match List.find_opt (fun (_, value) -> String.trim value = "") values with
    | Some (id, _) ->
        invalid ctx fields id (T.t "account/auth-error-invalid-parameter");
        false
    | None ->
        Runtime.signal_set fields.invalid_field "";
        set_auth ctx (fun a -> { a with err = "" });
        true

let request fields work =
  Runtime.signal_set fields.pending true;
  let operation = Js.Promise.resolve () |> Js.Promise.then_ work in
  (operation
   |> Js.Promise.catch (fun _ ->
          Runtime.signal_set fields.pending false;
          operation)
   |> Js.Promise.then_ (fun () ->
          Runtime.signal_set fields.pending false;
          Js.Promise.resolve ()))
  |> ignore

let auth_json ctx init =
  (let* resp = Fetch.fetchWithInit cognito_url init in
   Fetch.Response.json resp)
  |> Js.Promise.then_ (fun json -> Js.Promise.resolve (Some json))
  |> Js.Promise.catch (fun _ ->
         fail ctx (T.t "account/auth-error-generic");
         Js.Promise.resolve None)

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
  | None -> T.t "account/auth-error-generic"

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

let validate_password ctx fields pw =
  if valid_password pw then true
  else (
    invalid ctx fields "password" (I18n.t "account/password-policy-tip");
    false)

let cognito_call ctx fields target payload f_ok =
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
  request fields (fun () ->
   let* json = auth_json ctx init in
   match json with
   | None -> Js.Promise.resolve ()
   | Some json -> (match Js.Json.decodeObject json with
   | Some o -> (
       match dict_str o "__type" with
       | Some _ -> fail ctx (error_message json); Js.Promise.resolve ()
       | None -> f_ok json)
   | None -> f_ok json))

let submit ctx fields =
  let user = String.trim (Runtime.signal_get fields.email)
  and pass = Runtime.signal_get fields.password in
  if not (required ctx fields [ ("email", user); ("password", pass) ]) then ()
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
    request fields (fun () ->
    let* json = auth_json ctx init in
    match Option.bind json tokens_of with
    | Some (id, acc, refresh) ->
        let* () = store_tokens id acc refresh in
        if Ui_effect.alive ctx.Lui_ui.ui_scope then
          Dialogs_state.close_named "login";
        Js.Promise.resolve ()
    | None ->
        Option.iter (fun json ->
            match error_name_of json with
            | Some "PasswordResetRequiredException" -> set_tab ctx fields Reset_pw
            | Some "UserNotConfirmedException" ->
                set_tab ctx fields (Confirm_code (user, None))
            | _ -> fail ctx (error_message json)) json;
        Js.Promise.resolve ())

let json_obj xs = Js.Json.object_ (Js.Dict.fromList xs)

let signup_submit ctx fields =
  let email = Runtime.signal_get fields.email
  and user = Runtime.signal_get fields.username
  and pass = Runtime.signal_get fields.password
  and confirm = Runtime.signal_get fields.confirm_password in
  if not (required ctx fields
    [ ("email", email); ("username", user); ("password", pass)
    ; ("confirm-password", confirm) ]) then ()
  else if not (validate_password ctx fields pass) then ()
  else if pass <> confirm then
    invalid ctx fields "confirm-password" (I18n.t "account/passwords-do-not-match")
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
    cognito_call ctx fields "SignUp" payload (fun json ->
        let confirmed, destination =
          match Js.Json.decodeObject json with
          | Some o -> (
              let confirmed =
                Option.bind (Js.Dict.get o "UserConfirmed") Js.Json.decodeBoolean
                = Some true
              in
              let destination =
                Option.bind
                  (Option.bind (Js.Dict.get o "CodeDeliveryDetails") Js.Json.decodeObject)
                  (fun details -> dict_str details "Destination")
              in
              confirmed, destination)
          | None -> false, None
        in
        set_tab ctx fields
          (if confirmed then Login else Confirm_code (user, destination));
        Js.Promise.resolve ())

let forgot_submit ctx fields =
  let user = String.trim (Runtime.signal_get fields.email) in
  if not (required ctx fields [ ("email", user) ]) then ()
  else
    let payload =
      Js.Json.stringify
        (json_obj
           [ ("ClientId", Js.Json.string client_id)
           ; ("Username", Js.Json.string user) ])
    in
    cognito_call ctx fields "ForgotPassword" payload (fun _ ->
        set_tab ctx fields (Reset_confirm user);
        Js.Promise.resolve ())

let reset_submit ctx fields user =
  let code = Runtime.signal_get fields.code
  and pass = Runtime.signal_get fields.password
  and confirm = Runtime.signal_get fields.confirm_password in
  if not (required ctx fields
    [ ("code", code); ("password", pass); ("confirm-password", confirm) ]) then ()
  else if not (validate_password ctx fields pass) then ()
  else if pass <> confirm then
    invalid ctx fields "confirm-password" (I18n.t "account/passwords-do-not-match")
  else
    let payload =
      Js.Json.stringify
        (json_obj
           [ ("ClientId", Js.Json.string client_id)
           ; ("Username", Js.Json.string user)
           ; ("ConfirmationCode", Js.Json.string code)
           ; ("Password", Js.Json.string pass) ])
    in
    cognito_call ctx fields "ConfirmForgotPassword" payload (fun _ ->
        set_tab ctx fields Login;
        Js.Promise.resolve ())

let confirm_submit ctx fields user =
  let code = Runtime.signal_get fields.code in
  if not (required ctx fields [ ("code", code) ]) then ()
  else
    let payload =
      Js.Json.stringify
        (json_obj
           [ ("ClientId", Js.Json.string client_id)
           ; ("Username", Js.Json.string user)
           ; ("ConfirmationCode", Js.Json.string code) ])
    in
    cognito_call ctx fields "ConfirmSignUp" payload (fun _ ->
        set_tab ctx fields Login;
        Js.Promise.resolve ())

let sign_out ctx =
  (let* () = Rtc_flows.sign_out () in
   set_auth ctx (fun _ -> { tab = Login; err = ""; session_user = None });
   Js.Promise.resolve ())
  |> Js.Promise.catch (fun _ ->
       fail ctx (I18n.t "account/sign-out-error");
       Js.Promise.resolve ())
  |> ignore

(* cljs user.cljs username — the id-token's cognito:username claim *)
let session_username = Rtc_flows.username

let input_row fields ~key ~id ~caption ?(autofocus = false) ~secure ~value
    ~on_submit =
  (* cljs .cp__user-login rows stretch to the form width;
     ls-auth-field carries the cljs label lh-5 + wrapper pb-1 *)
  Ui_components.with_props [ Ui_components.Prop.padding_bottom 4 ]
    (column ~key ~gap:12 ~cross:`stretch ~style_class:"ls-auth-field"
    [ label ~key:"l" ~line_height:"20px" ~value:caption
        ~accessibility_identifier:("auth-label-" ^ id) []
    ; (if secure then Ui_components.secure_field else Ui_components.input ~kind:`text)
        ~key:"i" ~style_class:"ui__input"
        ~height:40 ~min_height:40
        ~accessibility_identifier:("auth-" ^ id) ~label:caption ~autofocus
        ~data_attrs:(reactive (fun invalid ->
          [ ("aria-labelledby", "auth-label-" ^ id); ("aria-required", "true")
          ; ("aria-describedby", "auth-error")
          ; ("aria-invalid", if invalid = id then "true" else "false") ])
          (Signal.value fields.invalid_field))
        ~text_signal:(Signal.value value)
        ~on_input:(fun ev -> Signal.set value (text_of ev))
        ~on_submit:(fun _ -> on_submit ())
        []
    ])

(* Login controls use the shared default button size. *)
let submit_btn fields ~key label on_submit =
  Ui_components.button ~key ~variant:`primary ~text:label
    ~disabled_signal:(Signal.value fields.pending)
    ~data_attrs:(reactive (fun pending ->
      [ ("aria-busy", string_of_bool pending) ]) (Signal.value fields.pending))
    ~on_press:(fun _ -> on_submit ()) []

(* Auth navigation keeps link styling with native keyboard button semantics. *)
let action_link fields ~key ctx text_ tab =
  Ui_components.with_props
    [ Ui_components.Prop.cursor `pointer
    ; Ui_components.Prop.hover_opacity 1.
    ; Ui_components.Prop.opacity 0.8
    ; Ui_components.Prop.font_size "0.875rem"
    ; Ui_components.Prop.text_decoration "underline" ]
    (button ~key ~style_class:"ls-auth-link" ~text:text_ ~label:text_
       ~variant:`ghost ~height:24 ~min_height:24 ~padding:0
       ~background:"transparent" ~border_width:0
       ~disabled_signal:(Signal.value fields.pending)
       ~on_press:(fun _ -> set_tab ctx fields tab)
       [])

let back_link ctx fields =
  (* stays centered inside the stretch-aligned form columns *)
  column ~key:"back" ~cross:`center
    [ action_link fields ~key:"a" ctx (I18n.t "account/back-to-login") Login ]

let login_panel ctx fields =
  let on_submit () = submit ctx fields in
  column ~key:"f-login" ~gap:16 ~cross:`stretch
    [ input_row fields ~key:"r-email" ~id:"email" ~caption:(I18n.t "account/email")
        ~autofocus:true ~secure:false ~value:fields.email ~on_submit
    ; input_row fields ~key:"r-pw" ~id:"password" ~caption:(I18n.t "account/password")
        ~secure:true ~value:fields.password ~on_submit
    ; submit_btn fields ~key:"lg-btn" (I18n.t "account/sign-in") on_submit
    ; Ui_components.with_props [ Ui_components.Prop.padding_top 16 ]
      (column ~key:"lg-foot" ~cross:`center ~gap:0
        ~style_class:"ls-auth-foot"
        [ row ~key:"f1" ~gap:4 ~min_height:24
            [ Ui_components.with_props [ Ui_components.Prop.opacity 0.8 ]
              (text ~key:"f1a" ~style_class:"ls-auth-muted"
                ~font_size:"0.875rem"
                ~value:(I18n.t "account/dont-have-account-question" ^ " ")
                [])
            ; action_link fields ~key:"f1b" ctx (I18n.t "account/sign-up")
                Signup ]
        ; row ~key:"f2" ~gap:4 ~min_height:24
            [ Ui_components.with_props [ Ui_components.Prop.opacity 0.8 ]
              (text ~key:"f1d" ~style_class:"ls-auth-muted"
                ~font_size:"0.875rem"
                ~value:(I18n.t "account/or" ^ " ") [])
            ; action_link fields ~key:"f2a" ctx
                (I18n.t "encryption/forgot-password-question") Reset_pw ]
        ])
    ]

let signup_panel ctx fields =
  let on_submit () = signup_submit ctx fields in
  column ~key:"f-signup" ~gap:16 ~cross:`stretch
    [ input_row fields ~key:"r-email" ~id:"email"
        ~caption:(I18n.t "account/email")
        ~autofocus:true ~secure:false ~value:fields.email ~on_submit
    ; input_row fields ~key:"r-user" ~id:"username"
        ~caption:(I18n.t "account/username")
        ~secure:false ~value:fields.username ~on_submit
    ; input_row fields ~key:"r-pw" ~id:"password"
        ~caption:(I18n.t "account/password")
        ~secure:true ~value:fields.password ~on_submit
    ; input_row fields ~key:"r-pw2" ~id:"confirm-password"
        ~caption:(I18n.t "account/confirm-password")
        ~secure:true ~value:fields.confirm_password ~on_submit
    ; submit_btn fields ~key:"su-btn" (I18n.t "account/create-account") on_submit
    ; back_link ctx fields
    ]

let reset_panel ctx fields =
  let on_submit () = forgot_submit ctx fields in
  column ~key:"f-reset" ~gap:16 ~cross:`stretch
    [ input_row fields ~key:"r-email" ~id:"email"
        ~caption:(I18n.t "account/enter-email")
        ~autofocus:true ~secure:false ~value:fields.email ~on_submit
    ; submit_btn fields ~key:"rs-btn" (I18n.t "account/send-code") on_submit
    ; back_link ctx fields
    ]

let reset_confirm_panel ctx fields user =
  let on_submit () = reset_submit ctx fields user in
  column ~key:"f-rset2" ~gap:16 ~cross:`stretch
    [ input_row fields ~key:"r-code" ~id:"code" ~caption:(I18n.t "account/enter-code")
        ~autofocus:true ~secure:false ~value:fields.code ~on_submit
    ; input_row fields ~key:"r-pw" ~id:"password"
        ~caption:(I18n.t "account/password")
        ~secure:true ~value:fields.password ~on_submit
    ; input_row fields ~key:"r-pw2" ~id:"confirm-password"
        ~caption:(I18n.t "account/confirm-password")
        ~secure:true ~value:fields.confirm_password ~on_submit
    ; submit_btn fields ~key:"rc-btn" (I18n.t "account/reset-password") on_submit
    ; back_link ctx fields
    ]

let confirm_panel ctx fields user destination =
  let on_submit () = confirm_submit ctx fields user in
  column ~key:"f-confirm" ~gap:16 ~cross:`stretch
    [ Ui_components.with_props
      [ Ui_components.Prop.opacity 0.6; Ui_components.Prop.padding_bottom 8 ]
      (paragraph ~key:"cc-hint" ~style_class:"ls-auth-muted"
        ~font_size:"0.875rem"
        ~value:(match destination with
          | Some destination -> I18n.t1 "account/code-sent-to-email" destination
          | None -> I18n.t "account/code-on-the-way-tip") [])
    ; input_row fields ~key:"r-code" ~id:"code" ~caption:(I18n.t "account/enter-code")
        ~autofocus:true ~secure:false ~value:fields.code ~on_submit
    ; submit_btn fields ~key:"cc-btn" (I18n.t "account/confirm") on_submit
    ; back_link ctx fields
    ]

let panel ctx fields (a : auth_ui) : t =
  let title, inner =
    match a.session_user with
    | Some u ->
        ( I18n.t "ui/login"
        , [ column ~key:"lg-in" ~cross:`center ~gap:16
              [ paragraph ~key:"p"
                  ~value:(I18n.t1 "account/already-logged-in-as" u) []
              ; Ui_components.button ~key:"so"
                  ~variant:`outline ~size:`default
                  ~text:(I18n.t "account/sign-out")
                  ~on_press:(fun _ -> sign_out ctx) [] ] ] )
    | None -> (
        match a.tab with
        | Login -> (I18n.t "ui/login", [ login_panel ctx fields ])
        | Signup -> (I18n.t "account/sign-up", [ signup_panel ctx fields ])
        | Reset_pw ->
            (I18n.t "account/reset-password", [ reset_panel ctx fields ])
        | Reset_confirm user ->
            ( I18n.t "account/reset-password"
            , [ reset_confirm_panel ctx fields user ] )
        | Confirm_code (user, destination) ->
            ( I18n.t "account/confirm"
            , [ confirm_panel ctx fields user destination ] ))
  in
  Logseq_el.fragment
    ((* cljs card-header (p-6 + pb-7) + card-title (text-2xl) *)
     Ui_components.with_props
       [ Ui_components.Prop.padding_top 24; Ui_components.Prop.padding_bottom 28 ]
       (heading ~key:"lg-t" ~level:2 ~margin:0 ~letter_spacing:(-0.24)
       ~font_size:"1.5rem" ~font_weight:600 ~line_height:"1"
       ~style_class:"ui__dialog-title ls-auth-title"
       ~value:title [])
     :: (if a.err = "" then []
         else
           (* cljs shui/alert {:variant :destructive} + alert-description —
              the .cp__user-login .ui__alert rule's chrome now rides
              the alert kind's typed props (same fixed oklch bg the
              rule hard-coded for both themes); the spacer replaces
              its margin-bottom:1rem *)
           [ alert ~key:"err" ~variant:`destructive
               ~accessibility_identifier:"auth-error"
               ~background:"oklch(80.8% 0.114 19.571)"
               ~border_width:1 ~border_color:"transparent"
               ~corner_radius:8 ~padding:16
               [ paragraph ~key:"err-d" ~value:a.err [] ]
           ; spacer ~height:16 [] ])
    @ inner)

let body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  Signal.update (auth_st ctx) (fun _ ->
      { tab = Login; err = ""; session_user = session_username () });
  let fields = fields_of ctx in
  (reactive ~equal:( == ) (fun a ->
       column ~key:"login" ~style_class:"cp__user-login" ~cross:`stretch
         ~max_width:440 ~min_width:0 ~padding_horizontal:4
         [ panel ctx fields a ])
     (Signal.value ((auth_st ctx))))
    ctx parent
