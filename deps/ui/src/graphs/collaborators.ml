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

let if_ = Logseq_dom.if_
let keyed = Logseq_dom.keyed
let fragment = Logseq_dom.fragment

type member =
  { m_uuid : string
  ; m_name : string
  ; m_email : string option
  ; m_role : string
  }

(* ---------- REST (cljs fetch-json over http-base) ---------- *)

let auth_init ?body ~method_ () =
  match Platform.local_storage_get "id-token" with
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

let menu_item ~cls label on_click =
  let b = Web_dom.create_element "div" in
  Web_dom.el_set_attr b "role" "menuitem";
  Web_dom.el_set_class b (Menu_item.graphs_cls ^ " " ^ cls);
  Web_dom.el_set_text_content b label;
  Web_dom.el_on b "click" (fun _ ->
      (match Web_dom.query_selector ".collab-member-menu" with
       | Some m -> Web_dom.el_remove m
       | None -> ());
      on_click ());
  b

let open_member_menu ~uuid ~member_id ~render anchor =
  (match Web_dom.query_selector ".collab-member-menu" with
   | Some m -> Web_dom.el_remove m
   | None -> ());
  let menu = Web_dom.create_element "div" in
  Web_dom.el_set_class menu
    "collab-member-menu ui__dropdown-menu-content z-50 min-w-[8rem] \
     rounded-md border bg-popover p-1 text-popover-foreground shadow-md";
  Web_dom.el_set_attr menu "role" "menu";
  let r = Web_dom.el_bounding_rect anchor in
  Web_dom.el_set_attr menu "style"
    (Printf.sprintf "position:fixed;left:%.0fpx;top:%.0fpx"
       (Web_dom.rect_right r) (Web_dom.rect_top r));
  Web_dom.el_append_child menu
    (menu_item ~cls:""
       (T.t "collaboration/remove-access") (fun () ->
         ignore
           (let* ok = remove_member ~uuid ~member_id in
            if ok then render ()
            else Toast.error (T.t "collaboration/remove-access-error");
            Js.Promise.resolve ())));
  (match Web_dom.query_selector "body" with Some b -> Web_dom.el_append_child b menu | None -> ())

let member_row ~manager ~uuid (m : member) (render : unit -> unit) : Web_dom.el =
  let row = Web_dom.create_element "div" in
  Web_dom.el_set_class row "flex flex-row items-center gap-2";
  let n = Web_dom.create_element "div" in
  Web_dom.el_set_text_content n m.m_name;
  Web_dom.el_append_child row n;
  (match m.m_email with
   | Some e ->
       let em = Web_dom.create_element "div" in
       Web_dom.el_set_class em "opacity-50 text-sm";
       Web_dom.el_set_text_content em e;
       Web_dom.el_append_child row em
   | None -> ());
  if m.m_role <> "" then begin
    let ty = Web_dom.create_element "div" in
    Web_dom.el_set_class ty "opacity-50 text-sm";
    Web_dom.el_set_text_content ty m.m_role;
    Web_dom.el_append_child row ty
  end;
  (* cljs: remove-access only for managers, and only on member rows *)
  if manager && m.m_role = "member" then begin
    let btn = Web_dom.create_element "button" in
    Web_dom.el_set_class btn
      "ui__button as-ghost px-1 h-7 inline-flex items-center \
       justify-center";
    Web_dom.el_set_attr btn "type" "button";
    Web_dom.el_set_attr btn "aria-haspopup" "menu";
    Web_dom.el_set_inner_html btn
      "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" \
       height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" \
       stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" \
       stroke-linejoin=\"round\" class=\"tabler-icon tabler-icon-dots \">\
       <path d=\"M4 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0\"/>\
       <path d=\"M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0\"/>\
       <path d=\"M18 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0\"/></svg>";
    Web_dom.el_on btn "click" (fun _ ->
        open_member_menu ~uuid ~member_id:m.m_uuid ~render btn);
    Web_dom.el_append_child row btn
  end;
  row

(* imperative member-list render into .ls-collab-users (membership
   comes from REST, so rows rebuild like graphs_view does) *)
let rec render_users ~repo ~uuid host () =
  ignore
    (let* ms = fetch_members uuid in
     Web_dom.el_set_inner_html host "";
     let manager =
       match Rtc_flows.user_uuid () with
       | Some uid ->
           List.exists
             (fun (m : member) -> m.m_uuid = uid && m.m_role = "manager")
             ms
       | None -> false
     in
     List.iter
       (fun m ->
         Web_dom.el_append_child host
           (member_row ~manager ~uuid m
              (render_users ~repo ~uuid host)))
       ms;
     Js.Promise.resolve ())

and submit_invite ~repo ~uuid host () =
  match Web_dom.query_selector ".ls-collab-invite input" with
  | Some el ->
      let email = String.trim (Web_dom.el_value el) in
      if email <> "" then begin
        Web_dom.el_set_value el "";
        ignore
          (let* () = invite_email ~repo ~uuid ~email in
           render_users ~repo ~uuid host ();
           Js.Promise.resolve ())
      end
  | None -> ()

(* dialog body — cljs dialog content: [:div.p-2.-mb-8
   [:h1.text-3xl.-mt-2.-ml-2 "Members:"] (settings-collaboration)] *)
let body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let start () =
    match Web_dom.query_selector ".ls-collab-users" with
    | Some host -> (
        match (Runtime.model ()).Model.repo, !Rtc_flows.db_rtc_uuid with
        | Some repo, Some uuid -> render_users ~repo ~uuid host ()
        | _ -> ())
    | None -> ()
  and submit () =
    match Web_dom.query_selector ".ls-collab-users" with
    | Some host -> (
        match (Runtime.model ()).Model.repo, !Rtc_flows.db_rtc_uuid with
        | Some repo, Some uuid -> submit_invite ~repo ~uuid host ()
        | _ -> ())
    | None -> ()
  in
  let root =
    column ~key:"collab" ~padding:8 ~style_class:"-mb-8"
      [ heading ~key:"collab-h" ~level:1
          ~style_class:"text-3xl -mt-2 -ml-2"
          ~value:(T.t "collaboration/members") []
      ; column ~key:"collab-w"
          ~style_class:"panel-wrap mb-8"
          [ column ~key:"collab-m" ~gap:8 ~style_class:"mt-4"
              [ column ~key:"collab-users" ~gap:4
                  ~style_class:"ls-collab-users" []
              ; column ~key:"collab-form" ~gap:16 ~style_class:"mt-4"
                  [ box ~key:"collab-inv" ~style_class:"ls-collab-invite"
                      [ input ~key:"collab-in" ~style_class:"ui__input"
                          ~placeholder:(T.t "collaboration/email-address")
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
  in
  (* the dialog is mounted synchronously; fetch after the DOM lands *)
  ignore (Web_dom.set_timeout start 32);
  root ctx parent

(* ---------- header widget (.rtc-collaborators) ---------- *)

(* cljs rtc-collaborators: user-plus ghost-icon opens the members
   dialog; an avatar per online user (visible under the same
   rtc-indicator-visible? gate as the cloud indicator) *)
let widget (ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let model_sig =
    Logseq_dom.own ctx
      (Signal.map (fun (m : Model.t) -> (m.repo, m.rtc)) ms)
  in
  let vis_sig =
    Logseq_dom.own ctx
      (Signal.map
         (fun ((repo : string option), (r : Model.rtc option)) ->
           Rtc_flows.refresh_db_rtc_uuid repo;
           Rtc_flows.logged_in () && Rtc_flows.rtc_group ()
           && repo <> None
           && (!Rtc_flows.db_rtc_uuid <> None || r <> None))
         model_sig)
  in
  (fragment
     [ if_ ~test:(Logseq_dom.own ctx (Signal.map not vis_sig))
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
                  (Logseq_dom.own ctx
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
