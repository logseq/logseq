(* Share/members panel (the "rtc-collaborators" dialog body) + header
   .rtc-collaborators widget (user-plus button + online-user avatars).

   Mirrors:
   - components/settings.cljs settings-rtc-members (member rows, invite,
     remove-access)
   - components/header.cljs rtc-collaborators (.rtc-collaborators +
     avatar/user-avatar per online user)
   - handler/db_based/sync.cljs <rtc-invite-email / <rtc-remove-member! /
     <rtc-leave-graph! — plain REST against http-base, not worker
     endpoints (grant-graph-access is the one worker call: it needs the
     manager's decrypted graph AES key). *)

open Promise_ext
open Lui_elements
module T = I18n

let if_ = Lui_elements.if_
let keyed = Lui_elements.keyed
let fragment = Logseq_el.fragment

type member =
  { m_uuid : string
  ; m_name : string
  ; m_email : string option
  ; m_role : string
  }

(* ---------- REST (cljs fetch-json over http-base) ---------- *)

let auth_init ?body ~method_ () =
  match Ui_services.storage_get "id-token" with
  | None -> None
  | Some token ->
      Some
        (Fetch.RequestInit.make ~method_
           ~headers:
             (Fetch.HeadersInit.makeWithArray
                [| ("Authorization", "Bearer " ^ token)
                 ; ("content-type", "application/json") |])
           ?body
           ())

let jfield (o : Js.Json.t) (k : string) : Js.Json.t option =
  match Js.Json.classify o with
  | Js.Json.JSONObject d -> Js.Dict.get d k
  | _ -> None

let jstr o k = Option.bind (jfield o k) Js.Json.decodeString

let members_url uuid = Rtc_ops.http_base () ^ "/graphs/" ^ uuid ^ "/members"

let fetch_members (uuid : string) : member list Js.Promise.t =
  match auth_init ~method_:Fetch.Get () with
  | None -> Js.Promise.resolve []
  | Some init -> (
      let* resp = Fetch.fetchWithInit (members_url uuid) init in
      let* json = Fetch.Response.json resp in
      let ms =
        match jfield json "members" with
        | Some arr -> (
            match Js.Json.classify arr with
            | Js.Json.JSONArray xs -> xs
            | _ -> [||])
        | None -> [||]
      in
      Js.Promise.resolve
        (Array.to_list ms
        |> List.filter_map (fun m ->
               match jstr m "user-id" with
               | Some uuid ->
                   let name =
                     match jstr m "username", jstr m "email" with
                     | Some u, _ -> u
                     | None, Some e -> e
                     | _ -> uuid
                   in
                   Some
                     { m_uuid = uuid; m_name = name
                     ; m_email = jstr m "email"
                     ; m_role =
                         Option.value (jstr m "role") ~default:"member"
                     }
               | None -> None)))

let remove_member ~uuid ~member_id : bool Js.Promise.t =
  match auth_init ~method_:Fetch.Delete () with
  | None -> Js.Promise.resolve false
  | Some init -> (
      (let* _ = Fetch.fetchWithInit (members_url uuid ^ "/" ^ member_id) init in
       Js.Promise.resolve true)
      |> Js.Promise.catch (fun _ -> Js.Promise.resolve false))

(* cljs <rtc-invite-email: POST member -> grant-graph-access (worker
   encrypts the graph AES key for the invitee) -> refresh + toasts *)
let invite_email ~repo ~uuid ~email : unit Js.Promise.t =
  match
    auth_init ~method_:Fetch.Post
      ~body:
        (Fetch.BodyInit.make
           (Daemon_client.json_stringify
              (Daemon_client.jobj
                 [ ("email", Js.Json.string email)
                 ; ("role", Js.Json.string "member") ])))
      ()
  with
  | None -> Js.Promise.resolve ()
  | Some init -> (
      let* resp = Fetch.fetchWithInit (members_url uuid) init in
      let* json = Fetch.Response.json resp in
      match jstr json "error" with
      | Some "user not found" ->
          Toast.warning (T.t "sync/user-doesnt-exist-yet");
          Js.Promise.resolve ()
      | Some _ ->
          Toast.error (T.t "sync/something-wrong");
          Js.Promise.resolve ()
      | None -> (
          let* w =
            Runtime.invoke3 "thread-api/db-sync-grant-graph-access"
              (Wire.String repo) (Wire.String uuid) (Wire.String email)
          in
          if Rtc_error.is_error w then begin
            Rtc_error.report_outcome "grant-graph-access" w;
            Toast.error (T.t "sync/something-wrong")
          end
          else Toast.success (T.t "sync/invitation-sent");
          Js.Promise.resolve ()))

(* cljs <rtc-leave-graph!: DELETE the caller's own member row *)
let leave_graph ~uuid : bool Js.Promise.t =
  match Rtc_flows.user_uuid () with
  | None -> Js.Promise.resolve false
  | Some uid -> remove_member ~uuid ~member_id:uid

(* ---------- avatar (cljs avatar.cljs user-avatar) ---------- *)

(* cljs uuid-color via uniqolor — deterministic pastel; approximate
   with a stable hue from the uuid (no uniqolor in the bundle) *)
let uuid_color uuid =
  let h = ref 0 in
  String.iter (fun c -> h := (!h * 31 + Char.code c) land 0xffffff) uuid;
  Printf.sprintf "hsl(%d,60%%,70%%)" (!h mod 360)

(* cljs initials: 2 leading graphemes for latin/number-leading names,
   else 1 — covers the account names we render *)
let initials name =
  let s = String.trim name in
  if s = "" then ""
  else if String.length s >= 2 then String.uppercase_ascii (String.sub s 0 2)
  else String.uppercase_ascii s

(* cljs avatar.cljs user-avatar: rounded initials chip tinted by
   uuid-color (the app-region:no-drag attr has no component equivalent;
   avatars are text-only so far) *)
let avatar_of (usig : Model.rtc_user Signal.signal) : t =
  let u = Signal.get usig in
  Lui_elements.avatar ~key:u.ru_uuid ~width:20 ~height:20
     ~background:(uuid_color u.ru_uuid)
    ~text:(reactive (fun u -> initials u.Model.ru_name) usig)
    ~label:(Option.value u.ru_email ~default:"") []

(* ---------- members panel (dialog body) ---------- *)

let member_row ~manager ~uuid (m : member) ~refresh : t =
  row ~key:("mr-" ^ m.m_uuid) ~cross:`center ~gap:8
    ([ text ~key:("mrn-" ^ m.m_uuid) ~value:m.m_name [] ]
    @ (match m.m_email with
       | Some e ->
           [ text ~key:("mre-" ^ m.m_uuid) ~as_:`Small
               ~foreground:"var(--ls-secondary-text-color)"
               ~value:e []
           ]
       | None -> [])
    @ (if m.m_role <> "" then
         [ text ~key:("mrr-" ^ m.m_uuid) ~as_:`Small
             ~foreground:"var(--ls-secondary-text-color)"
             ~value:m.m_role []
         ]
       else [])
    @
    (* cljs: remove-access only for managers, and only on member rows *)
    if manager && m.m_role = "member" then
      [ Menu_item.dots_menu ~key:("mrm-" ^ m.m_uuid)
          ~menu_cls:"collab-member-menu"
          [ ( ""
            , T.t "collaboration/remove-access"
            , false
            , fun () ->
                ignore
                  (let* ok = remove_member ~uuid ~member_id:m.m_uuid in
                   if ok then refresh ()
                   else Toast.error (T.t "collaboration/remove-access-error");
                   Js.Promise.resolve ()) )
          ]
      ]
    else [])

(* members come from REST (not the model), so the view mirrors them in
   a signal refreshed on mount and after invite/remove *)
let members_sig_ref :
    (member list * bool) Signal.state option ref =
  ref None

let members_st ctx =
  match !members_sig_ref with
  | Some s -> s
  | None ->
      let s = Signal.state ctx.Lui_ui.ui_scheduler ([], false) in
      members_sig_ref := Some s;
      s

(* dialog body — cljs dialog content: [:div.p-2.-mb-8
   [:h1.text-3xl.-mt-2.-ml-2 "Members:"] (settings-collaboration)] *)
let body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let members_st = members_st ctx in
  let email_st = Signal.state ctx.Lui_ui.ui_scheduler "" in
  let graph () =
    (Runtime.model ()).Model.repo, !Rtc_flows.db_rtc_uuid
  in
  let rec refresh () =
    match graph () with
    | Some _, Some uuid ->
        ignore
          (let* ms = fetch_members uuid in
           let manager =
             match Rtc_flows.user_uuid () with
             | Some uid ->
                 List.exists
                   (fun (m : member) ->
                     m.m_uuid = uid && m.m_role = "manager")
                   ms
             | None -> false
           in
           Runtime.signal_set members_st (ms, manager);
           Js.Promise.resolve ())
    | _ -> ()
  and submit () =
    match graph () with
    | Some repo, Some uuid -> (
        let email = String.trim (Runtime.signal_get email_st) in
        if email <> "" then begin
          Runtime.signal_set email_st "";
          ignore
            (let* () = invite_email ~repo ~uuid ~email in
             refresh ();
             Js.Promise.resolve ())
        end)
    | _ -> ()
  in
  (* mount-time fetch replaces the old 32ms defer-to-DOM timer *)
  refresh ();
  (* own the derived source to the view scope: a bare Signal.map stays
     subscribed upstream after unmount and leaks computations *)
  let members_src =
    Logseq_el.own ctx (Signal.map fst (Signal.value members_st))
  in
  column ~key:"collab" ~padding:8 ~style_class:"-mb-8"
    [ heading ~key:"collab-h" ~level:1
        ~style_class:"text-3xl -mt-2 -ml-2"
        ~value:(T.t "collaboration/members") []
    ; column ~key:"collab-w"
        ~style_class:"panel-wrap mb-8"
        [ column ~key:"collab-m" ~gap:8 ~style_class:"mt-4"
            [ column ~key:"collab-users" ~gap:4
                ~style_class:"ls-collab-users"
                [ keyed
                    ~source:members_src
                    ~key:(fun (m : member) -> m.m_uuid)
                    ~cmp:Stdlib.compare
                    ~mount:(fun msig ->
                      let m = Signal.get msig in
                      let _, manager =
                        Runtime.signal_get members_st
                      in
                      member_row ~manager
                        ~uuid:
                          (Option.value !Rtc_flows.db_rtc_uuid
                             ~default:"")
                        m ~refresh)
                ]
            ; column ~key:"collab-form" ~gap:16 ~style_class:"mt-4"
                [ box ~key:"collab-inv" ~style_class:"ls-collab-invite"
                    [ input ~key:"collab-in" ~style_class:"ui__input"
                        ~text_signal:(Signal.value email_st)
                        ~placeholder:(T.t "collaboration/email-address")
                        ~on_input:(fun ev ->
                          match ev with
                          | Lui_protocol.TextChanged (_, v) ->
                              Runtime.signal_set email_st v
                          | _ -> ())
                        ~on_submit:(fun _ -> submit ())
                        [] ]
                ; button ~key:"collab-invite-btn"
                    ~style_class:"ui__button ls-btn-primary"
                    ~text:(T.t "collaboration/invite")
                    ~on_press:(fun _ -> submit ())
                    []
                ]
            ]
        ]
    ]
    ctx parent

(* ---------- header widget (.rtc-collaborators) ---------- *)

(* cljs rtc-collaborators: user-plus ghost-icon opens the members
   dialog; an avatar per online user (visible under the same
   rtc-indicator-visible? gate as the cloud indicator) *)
let widget (ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let model_sig =
    Logseq_el.own ctx
      (Signal.map (fun (m : Model.t) -> (m.repo, m.rtc)) ms)
  in
  let vis_sig =
    Logseq_el.own ctx
      (Signal.map
         (fun ((repo : string option), (r : Model.rtc option)) ->
           Rtc_flows.refresh_db_rtc_uuid repo;
           Rtc_flows.logged_in () && Rtc_flows.rtc_group ()
           && repo <> None
           && (!Rtc_flows.db_rtc_uuid <> None || r <> None))
         model_sig)
  in
  (fragment
     [ if_ ~test:(Logseq_el.own ctx (Signal.map not vis_sig))
         (box ~key:"collab-off" ~style_class:"hidden" [])
     ; if_ ~test:vis_sig
         (row ~key:"collab" ~gap:4 ~cross:`center
            [ button ~key:"collab-btn" ~size:`icon
                ~style_class:"ui__button as-ghost"
                ~icon:(`app "user-plus")
                ~label:"rtc collaborators"
                ~on_press:(fun _ ->
                  Dialogs_state.open_ "rtc-collaborators")
                []
            ; keyed
                ~source:
                  (Logseq_el.own ctx
                     (Signal.map
                        (fun ((_, r) : string option * Model.rtc option) ->
                          match r with
                          | Some r -> r.rtc_online_users
                          | None -> [])
                        model_sig))
                ~key:(fun (u : Model.rtc_user) -> u.ru_uuid)
                ~cmp:Stdlib.compare
                ~mount:avatar_of
            ])
     ])
    ctx parent
