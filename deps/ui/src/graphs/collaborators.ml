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

let dom = Logseq_dom.dom
let dyn = Logseq_dom.dyn

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

let avatar ~key ?(cls = "") ?(title = "") ~name ~uuid () : t =
  dom ~key ~tag:"span"
    ~style_class:
      ("ui__avatar relative flex h-10 w-10 shrink-0 overflow-hidden \
        rounded-full " ^ cls)
    ~attrs:
      ([ ("style", "app-region:no-drag") ]
      @ if title = "" then [] else [ ("title", title) ])
    [ dom ~key:(key ^ "-fb") ~tag:"span"
        ~style_class:
          "ui__avatar-fallback flex h-full w-full items-center \
           justify-center rounded-full bg-muted"
        ~attrs:
          [ ( "style"
            , Printf.sprintf "background-color:%s;font-size:11px"
                (uuid_color uuid) ) ]
        ~text:(initials name) [] ]

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
    (menu_item ~cls:"remove-member-menu-item"
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
    dom ~key:"collab" ~style_class:"p-2 -mb-8"
      [ dom ~key:"collab-h" ~tag:"h1" ~style_class:"text-3xl -mt-2 -ml-2"
          ~text:(T.t "collaboration/members") []
      ; dom ~key:"collab-w" ~style_class:"panel-wrap is-collaboration mb-8"
          [ dom ~key:"collab-m" ~style_class:"flex flex-col gap-2 mt-4"
              [ dom ~key:"collab-users"
                  ~style_class:"users flex flex-col gap-1 ls-collab-users" []
              ; dom ~key:"collab-form" ~style_class:"flex flex-col gap-4 mt-4"
                  [ dom ~key:"collab-inv" ~style_class:"ls-collab-invite"
                      [ dom ~key:"collab-in" ~tag:"input"
                          ~style_class:"ui__input"
                          ~attrs:
                            [ ( "placeholder"
                              , T.t "collaboration/email-address" )
                            ; ("autocomplete", "off"); ("type", "text") ]
                          ~events:"keydown"
                          ~on_dom_event:(fun n p ->
                            match n, Platform.payload_str p "key" with
                            | "keydown", "Enter" -> submit ()
                            | _ -> ())
                          [] ]
                  ; dom ~key:"collab-invite-btn" ~tag:"button"
                      ~style_class:"ui__button ls-btn-primary"
                      ~text:(T.t "collaboration/invite") ~events:"click"
                      ~on_dom_event:(fun n _ ->
                        if n = "click" then submit ())
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
  dyn ~equal:( = )
    (fun ((repo : string option), (r : Model.rtc option)) ->
      Rtc_flows.refresh_db_rtc_uuid repo;
      let visible =
        Rtc_flows.logged_in () && Rtc_flows.rtc_group ()
        && repo <> None
        && (!Rtc_flows.db_rtc_uuid <> None || r <> None)
      in
      if not visible then
        dom ~key:"collab-off" ~style_class:"hidden" []
      else
        let users =
          match r with Some r -> r.rtc_online_users | None -> []
        in
        dom ~key:"collab"
          ~style_class:
            "rtc-collaborators flex gap-1 text-sm bg-gray-01 items-center"
          ([ dom ~key:"collab-btn" ~tag:"button"
               ~style_class:
                 "ui__button as-ghost h-6 w-6 p-1 inline-flex \
                  items-center justify-center box-content"
               ~attrs:
                 [ ("type", "button")
                 ; ("aria-label", "rtc collaborators") ]
               ~events:"click"
               ~on_dom_event:(fun n _ ->
                 if n = "click" then
                   Dialogs_state.open_ "rtc-collaborators")
               [ Icons.icon ~size:20. ~cls:"" "user-plus" ] ]
          @ List.map
              (fun (u : Model.rtc_user) ->
                avatar ~key:("av-" ^ u.ru_uuid) ~cls:"w-5 h-5"
                  ~title:(Option.value u.ru_email ~default:"")
                  ~name:u.ru_name ~uuid:u.ru_uuid ())
              users))
    (Signal.map (fun (m : Model.t) -> (m.repo, m.rtc)) ms)
