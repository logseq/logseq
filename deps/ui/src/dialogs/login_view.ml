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
  match Web_dom.query_selector (".cp__user-login input[name=" ^ name ^ "]") with
  | Some el -> Web_dom.el_value el
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

let submit () =
  let user = field_value "username" and pass = field_value "password" in
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
        Toast.success T.login_title;
        Js.Promise.resolve ()
    | None ->
        let msg =
          match Js.Json.decodeObject json with
          | Some o -> (
              match dict_str o "message" with
              | Some m -> m
              | None -> (
                  match dict_str o "__type" with
                  | Some m -> m
                  | None -> T.login_failed))
          | None -> T.login_failed
        in
        Toast.error msg;
        Js.Promise.resolve ())
    |> Js.Promise.catch (fun _ ->
           Toast.error T.login_failed;
           Js.Promise.resolve ())
    |> ignore

let field ~key ~name ~type_ ~placeholder ~autofocus =
  dom ~key ~tag:"input"
    ~style_class:"form-input ls-login-input"
    ~attrs:
      ([ ("name", name); ("type", type_); ("placeholder", placeholder)
       ; ("autocomplete", "off") ]
      @ if autofocus then [ ("autofocus", "") ] else [])
    ~events:"keydown"
    ~on_dom_event:(fun n p ->
      match n with
      | "keydown" -> (
          match
            Platform.payload_str p "key"
          with
          | "Enter" -> submit ()
          | _ -> ())
      | _ -> ())
    []

let body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let node =
    dom ~key:"login" ~tag:"form" ~style_class:"cp__user-login"
      ~attrs:[ ("onsubmit", "return false"); ("novalidate", "") ]
      ~events:"submit"
      ~on_dom_event:(fun n _ -> if n = "submit" then submit ())
      [ dom ~key:"lg-t" ~tag:"h2"
          ~style_class:"ui__dialog-title" ~text:T.login_title []
      ; field ~key:"lg-u" ~name:"username" ~type_:"text"
          ~placeholder:T.login_username ~autofocus:true
      ; field ~key:"lg-p" ~name:"password" ~type_:"password"
          ~placeholder:T.login_password ~autofocus:false
      ; dom ~key:"lg-s" ~tag:"button" ~text:T.submit
          ~style_class:"ui__button ls-btn-primary"
          ~attrs:[ ("type", "submit") ]
          ~events:"click"
          ~on_dom_event:(fun n _ -> if n = "click" then submit ())
          []
      ]
  in
  ignore
    (Web_dom.set_timeout_id
       (fun () ->
         match
           Web_dom.query_selector ".cp__user-login input[name=username]"
         with
         | Some el -> Web_dom.el_focus el
         | None -> ())
       32);
  node ctx parent
