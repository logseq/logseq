(* Publish page dialog — cljs page_menu.cljs publish-page-dialog +
   handler/publish.cljs publish-page! (payload + x-publish-meta POST to
   {publish-api-base}/pages). cljs also uploads page assets and custom
   publish assets before posting — not ported (migrate-report). *)

open Promise_ext
open Lui_elements

module W = Wire
type pst = {
  page_uuid : string option;
  page_db_id : int option;
  password : string;
  visible : bool;
  publishing : bool;
}

include State_cell.Make (struct
  type t = pst
  let name = "publish"
end)

let st ctx =
  get_or_init ctx.Lui_ui.ui_scheduler
    { page_uuid = None
    ; page_db_id = None
    ; password = ""
    ; visible = false
    ; publishing = false }

let pending : (string * int option) option ref = ref None

let arm uuid db_id = pending := Some (uuid, db_id)



(* cljs util/time-ms *)
let now_ms () = Platform.date_now_ms () |> int_of_float |> string_of_int

let json_str b k v =
  Buffer.add_string b (Printf.sprintf "\"%s\":\"%s\"," k v)

(* cljs publish-meta: underscore keys, owner_* nil when logged out *)
let meta_json ~graph_uuid ~page_uuid ~block_count ~schema_version
    ~content_hash ~content_len =
  let b = Buffer.create 256 in
  Buffer.add_char b '{';
  json_str b "graph" graph_uuid;
  json_str b "page_uuid" page_uuid;
  Buffer.add_string b
    (Printf.sprintf "\"block_count\":%d,\"schema_version\":\"%s\",\
      \"format\":\"transit\",\"compression\":\"none\",\"content_hash\":\"%s\",\
      \"content_length\":%d,\"owner_sub\":null,\"owner_username\":null,\
      \"created_at\":%s"
       block_count schema_version content_hash content_len (now_ms ()));
  Buffer.add_char b '}';
  Buffer.contents b

let map_items = function W.Map kvs -> kvs | _ -> []

let map_get w k =
  List.find_map
    (fun (kk, v) ->
      match kk with
      | (W.String s | W.Keyword s) when s = k -> Some v
      | _ -> None)
    (map_items w)

let get_str w k =
  match map_get w k with
  | Some (W.String s | W.Uuid s) -> s
  | _ -> ""

let get_int w k =
  match map_get w k with
  | Some (W.Int i) -> i
  | Some (W.Int64 i) -> Int64.to_int i
  | _ -> 0

let post_payload ~(st : pst) payload ~graph_uuid ~page_uuid ~block_count
    ~schema_version =
  let body_wire =
    let items = map_items payload in
    let pw = Str_util.trim st.password in
    let items =
      if pw = "" then items
      else items @ [ (W.kw "page-password", W.String pw) ]
    in
    W.Map items
  in
  let body = Transit.to_string body_wire in
  let* content_hash = Asset_store.sha256_hex (Web_dom.binary_to_u8 body) in
  let meta =
    meta_json ~graph_uuid ~page_uuid ~block_count ~schema_version
      ~content_hash ~content_len:(String.length body)
  in
  let publish_body =
    W.Map
      (map_items body_wire
      @ [ ( W.kw "meta"
          , W.Map
              [ (W.kw "graph", W.String graph_uuid)
              ; (W.kw "page_uuid", W.String page_uuid)
              ; (W.kw "block_count", W.Int block_count)
              ; (W.kw "schema_version", W.String schema_version)
              ; (W.kw "format", W.Keyword "transit")
              ; (W.kw "compression", W.Keyword "none")
              ; (W.kw "content_hash", W.String content_hash)
              ; (W.kw "content_length"
                , W.Int (String.length body))
              ; (W.kw "owner_sub", W.Nil)
              ; (W.kw "owner_username", W.Nil)
              ; (W.kw "created_at", W.Int (Platform.date_now_ms () |> int_of_float)) ] ) ])
  in
  let headers =
    [| ("content-type", "application/transit+json")
     ; ("x-publish-meta", meta) |]
    |> (fun a ->
    match Platform.local_storage_get "id-token" with
    | Some t ->
        Array.append a [| ("authorization", "Bearer " ^ t) |]
    | None -> a)
  in
  let init =
    Fetch.RequestInit.make ~method_:Post
      ~headers:(Fetch.HeadersInit.makeWithArray headers)
      ~body:
        (Fetch.BodyInit.make
           (Transit.to_string publish_body))
      ()
  in
  let* _resp = Fetch.fetchWithInit "https://logseq.io/pages" init in
  Js.Promise.resolve ()

let submit ctx =
  let st = st ctx in
  let cur = Runtime.signal_get st in
  if cur.publishing then ()
  else begin
    Signal.update st (fun s -> { s with publishing = true });
    Runtime.flush ();
    (let* _ =
      (match cur.page_uuid, cur.page_db_id with
       | None, None -> Js.Promise.resolve ()
       | _ ->
           let eid =
             match cur.page_uuid with
             | Some u -> W.List [ W.Keyword "block/uuid"; W.Uuid u ]
             | None -> W.Int (Option.get cur.page_db_id)
           in
           let repo =
             match (Runtime.model ()).Model.repo with
             | Some r -> r
             | None -> "logseq_db_Demo"
           in
           (let* payload =
             Runtime.invoke "thread-api/build-publish-page-payload"
               [ W.String repo; eid ]
           in
           match payload with
           | W.Nil ->
               Toast.error (I18n.t "publish/page-not-found-error");
               Js.Promise.resolve ()
           | _ ->
               let page_uuid =
                 match get_str payload "page-uuid" with
                 | "" -> Option.value ~default:"" cur.page_uuid
                 | s -> s
               in
               let schema_version =
                 get_str payload "schema-version"
               in
               let block_count = get_int payload "block-count" in
               let graph_uuid = get_str payload "graph-uuid" in
               let finish_graph_uuid g =
                 post_payload ~st:cur payload ~graph_uuid:g ~page_uuid
                   ~block_count ~schema_version
               in
               if graph_uuid <> "" then finish_graph_uuid graph_uuid
               else
                 let* w =
                   Runtime.invoke1 "thread-api/get-graph-uuid"
                     (W.String repo)
                 in
                 finish_graph_uuid (Option.value ~default:"" (W.as_string w))))
    in
    Signal.update st (fun s -> { s with publishing = false });
    Runtime.flush ();
    Dialogs_state.close_top ();
    Js.Promise.resolve ())
    |> Js.Promise.catch (fun _ ->
           Toast.error (I18n.t "publish/publish-error");
           Signal.update st (fun s -> { s with publishing = false });
           Runtime.flush ();
           Dialogs_state.close_top ();
           Js.Promise.resolve ())
    |> ignore
  end

let ghost_btn () =
  button ~key:"pub-cancel" ~variant:`ghost
    ~style_class:"ui__button as-ghost"
    ~text:(I18n.t "ui/cancel")
    ~on_press:(fun _ -> Dialogs_state.close_top ())
    []

(* password input + trailing visibility toggle — the field kind itself
   swaps (secure_field <-> input), a structural branch, so if_ mounts the
   alternative; the eye icon is just a prop flip -> ~icon_signal *)
let toggle_pw ctx =
  let st_sig = Signal.value (st ctx) in
  let pw_input ~key ~visible =
    let value_sig = Signal.map (fun (s : pst) -> s.password) st_sig in
    let on_input ev =
      match ev with
      | Lui_protocol.TextChanged (_, v) ->
          Signal.update (st ctx) (fun s -> { s with password = v })
      | _ -> ()
    in
    let placeholder = I18n.t "publish/password-optional-placeholder" in
    if visible then
      input ~key ~style_class:"ui__input" ~placeholder
        ~text_signal:value_sig ~on_input []
    else
      secure_field ~key ~style_class:"ui__input" ~placeholder
        ~text_signal:value_sig ~on_input
        ~on_submit:(fun _ -> submit ctx)
        []
  in
  overlay ~key:"pub-pw-wrap" ~alignment:`trailing
    ~style_class:"ls-toggle-password-input"
    [ reactive
        (fun visible -> pw_input ~key:"pub-pw" ~visible)
        (Signal.map (fun (s : pst) -> s.visible) st_sig)
    ; if_
        ~test:
          (Signal.map (fun (s : pst) -> Str_util.trim s.password <> "") st_sig)
        (Ui_parts.prop_signal Lui_protocol.AccessibilityLabel
           (Signal.map (fun (s : pst) -> s.visible) st_sig)
           (fun v ->
             I18n.t
               (if v then "publish/hide-password" else "publish/show-password"))
           (button ~key:"pub-eye" ~variant:`ghost ~size:`sm
              ~style_class:"ui__button as-ghost"
              ~icon:(reactive
                   (fun (s : pst) ->
                     if s.visible then `app "eye-off" else `app "eye")
                   st_sig)
              ~on_press:(fun _ ->
                Signal.update (st ctx) (fun x ->
                    { x with visible = not x.visible }))
              [])) ]

let body (_ms : Model.t Signal.signal) : t =
  fun ctx parent ->
    let st = st ctx in
    let uuid, db_id =
      match !pending with
      | Some (u, d) -> (Some u, d)
      | None -> (None, None)
    in
    pending := None;
    Signal.update st (fun _ ->
        { page_uuid = uuid
        ; page_db_id = db_id
        ; password = ""
        ; visible = false
        ; publishing = false });
    (* cljs <form onsubmit> -> column; Enter submits through the
       field's ~on_submit *)
    column ~key:"publish" ~gap:16 ~padding:8
      [ text ~key:"pub-t" ~value:(I18n.t "publish/dialog-title") []
      ; text ~key:"pub-d" ~value:(I18n.t "publish/dialog-desc") []
      ; toggle_pw ctx
      ; row ~key:"pub-btns" ~main:`end_ ~gap:8
          [ ghost_btn ()
          ; button ~key:"pub-submit" ~variant:`primary
              ~style_class:"ui__button as-solid" ~autofocus:true
              ~disabled:(reactive
                   (fun (s : pst) -> s.publishing)
                   (Signal.value st))
              ~on_press:(fun _ -> submit ctx)
              ~text:(reactive
                   (fun (s : pst) ->
                     if s.publishing then "Publishing..." else "Publish")
                   (Signal.value st))
              [] ] ]
      ctx parent
