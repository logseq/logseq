(* Publish page dialog — cljs page_menu.cljs publish-page-dialog +
   handler/publish.cljs publish-page! (payload + x-publish-meta POST to
   {publish-api-base}/pages). cljs also uploads page assets and custom
   publish assets before posting — not ported (migrate-report). *)

open Promise_ext
open Lui_elements

let dom = Logseq_dom.dom
module W = Wire
module B = Browser_ui

type pst = {
  page_uuid : string option;
  page_db_id : int option;
  password : string;
  visible : bool;
  publishing : bool;
}

let st_ref : pst Signal.state option ref = ref None

let st ctx =
  match !st_ref with
  | Some s -> s
  | None ->
      let s =
        Signal.state ctx.Lui_ui.ui_scheduler
          { page_uuid = None
          ; page_db_id = None
          ; password = ""
          ; visible = false
          ; publishing = false }
      in
      st_ref := Some s;
      s

let pending : (string * int option) option ref = ref None

let arm uuid db_id = pending := Some (uuid, db_id)


let btn_base =
  "ui__button inline-flex cursor-pointer items-center justify-center \
   whitespace-nowrap rounded-md text-sm gap-1 font-medium \
   ring-offset-background transition-colors focus-visible:outline-none \
   focus-visible:ring-2 focus-visible:ring-ring \
   focus-visible:ring-offset-2 disabled:pointer-events-none \
   disabled:opacity-50 select-none"

let input_cls =
  "ui__input flex h-10 w-full rounded-md border border-input \
   bg-background px-3 py-2 text-sm ring-offset-background file:border-0 \
   file:bg-transparent file:text-sm file:font-medium \
   placeholder:text-muted-foreground focus-visible:outline-none \
   focus-visible:ring-2 focus-visible:ring-ring \
   focus-visible:ring-offset-2 disabled:cursor-not-allowed \
   disabled:opacity-50"

let trim s =
  let n = String.length s in
  let a = ref 0 and b = ref (n - 1) in
  while !a < n && (s.[!a] = ' ' || s.[!a] = '\t' || s.[!a] = '\n') do incr a done;
  while !b >= !a && (s.[!b] = ' ' || s.[!b] = '\t' || s.[!b] = '\n') do decr b done;
  if !b < !a then "" else String.sub s !a (!b - !a + 1)

(* cljs util/time-ms *)
let now_ms () = B.now_ms () |> int_of_float |> string_of_int

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
    let pw = trim st.password in
    let items =
      if pw = "" then items
      else items @ [ (W.kw "page-password", W.String pw) ]
    in
    W.Map items
  in
  let body = Transit.to_string body_wire in
  let* content_hash = Asset_store.sha256_hex (B.binary_to_u8 body) in
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
              ; (W.kw "created_at", W.Int (B.now_ms () |> int_of_float)) ] ) ])
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
  let cur = Signal.get_state st in
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
             match !Runtime.current_repo with
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
  dom ~key:"pub-cancel" ~tag:"button"
    ~style_class:
      (btn_base
     ^ " h-10 rounded px-4 py-2 hover:bg-secondary/70 \
        hover:text-secondary-foreground active:opacity-80 as-ghost")
    ~attrs:[ ("type", "button") ] ~events:"click"
    ~on_dom_event:(fun n _ ->
      if n = "click" then Dialogs_state.close_top ())
    ~text:(I18n.t "ui/cancel") []

let toggle_pw ctx =
  let st_sig = Signal.value (st ctx) in
  dom ~key:"pub-pw-wrap" ~style_class:"ls-toggle-password-input relative"
    [ dom ~key:"pub-pw" ~tag:"input" ~style_class:input_cls
        ~attrs_signal_v:(Logseq_dom.reactive_attrs
             (fun (s : pst) ->
               [ ("type", if s.visible then "text" else "password")
               ; ("placeholder", I18n.t "publish/password-optional-placeholder") ])
             st_sig)
        ~events:"input"
        ~on_dom_event:(fun n payload ->
          if n = "input" then
            match payload with
            | Some _ ->
                Signal.update (st ctx) (fun s ->
                    { s with
                      password = Platform.payload_str payload "value" })
            | None -> ())
        ~text_signal:(Logseq_dom.reactive_text (fun (s : pst) -> s.password) st_sig)
        []
    ; if_
        ~test:
          (Signal.map (fun (s : pst) -> trim s.password <> "") st_sig)
        (dom ~key:"pub-eye" ~tag:"button"
           ~style_class:
             (btn_base
            ^ " h-8 rounded px-3 py-1 hover:bg-secondary/70 \
               hover:text-secondary-foreground active:opacity-80 as-ghost \
               absolute right-1")
           ~attrs:[ ("type", "button"); ("style", "top: 6px") ]
           ~events:"click"
           ~on_dom_event:(fun n _ ->
             if n = "click" then
               Signal.update (st ctx) (fun x ->
                   { x with visible = not x.visible }))
           [ if_
               ~test:(Signal.map (fun (s : pst) -> s.visible) st_sig)
               (Icons.icon ~size:15. "eye-off")
           ; if_
               ~test:
                 (Signal.map (fun (s : pst) -> not s.visible) st_sig)
               (Icons.icon ~size:15. "eye") ]) ]

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
    dom ~key:"publish" ~tag:"form"
      ~style_class:"flex flex-col gap-4 p-2"
      ~attrs:[ ("onsubmit", "return false") ]
      ~events:"submit"
      ~on_dom_event:(fun n _ -> if n = "submit" then submit ctx)
      [ dom ~key:"pub-t" ~style_class:"text-lg font-medium"
          ~text:(I18n.t "publish/dialog-title") []
      ; dom ~key:"pub-d" ~style_class:"text-sm opacity-70"
          ~text:(I18n.t "publish/dialog-desc") []
      ; toggle_pw ctx
      ; dom ~key:"pub-btns" ~style_class:"flex justify-end gap-2"
          [ ghost_btn ()
          ; dom ~key:"pub-submit" ~tag:"button"
              ~style_class:
                (btn_base
               ^ " h-10 rounded px-4 py-2 bg-primary \
                  text-primary-foreground hover:bg-primary/90")
              ~attrs_signal_v:(Logseq_dom.reactive_attrs
                   (fun (s : pst) ->
                     [ ("type", "submit"); ("autofocus", "") ]
                     @ if s.publishing then [ ("disabled", "") ] else [])
                   (Signal.value st))
              ~events:"click"
              ~on_dom_event:(fun n _ ->
                if n = "click" then submit ctx)
              ~text_signal:(Logseq_dom.reactive_text
                   (fun (s : pst) ->
                     if s.publishing then "Publishing..." else "Publish")
                   (Signal.value st))
              [] ] ]
      ctx parent
