(* Sync/publish server URL editor dialogs — mirrors cljs
   sync-server-url-settings-container / publish-server-url-settings-container
   + config.cljs custom-url helpers. Storage is a plain string under
   "sync-server-url" / "publish-server-url" (removeItem clears). *)

open Promise_ext
open Lui_elements

let dom = Logseq_dom.dom
module T = I18n

let default_sync_http = "https://api.logseq.io"
let default_sync_ws = "wss://api.logseq.io/sync/%s"
let default_publish_base = "https://logseq.io"

let get_url key =
  match Platform.local_storage_get key with
  | Some v when String.trim v <> "" -> Some (String.trim v)
  | _ -> None

let valid_url s =
  String.length s >= 7
  && (String.sub s 0 7 = "http://" || String.length s >= 8
      && String.sub s 0 8 = "https://")

let url_to_ws s =
  let scheme =
    if String.length s >= 5 && String.sub s 0 5 = "https" then "wss"
    else "ws"
  in
  let base =
    Str_util.strip_trailing_slashes
      (if String.length s >= 7 && String.sub s 0 7 = "http://" then
         String.sub s 7 (String.length s - 7)
       else String.sub s 8 (String.length s - 8))
  in
  scheme ^ "://" ^ base ^ "/sync/%s"

(* settings.cljs push-sync-config-to-worker! *)
let push_sync_config () =
  let ws, http =
    match get_url "sync-server-url" with
    | Some u -> (url_to_ws u, Str_util.strip_trailing_slashes u)
    | None -> (default_sync_ws, default_sync_http)
  in
  Runtime.invoke1 "thread-api/set-db-sync-config"
    (Wire.Map
       [ (Wire.kw "enabled?", Wire.Bool true)
       ; (Wire.kw "ws-url", Wire.String ws)
       ; (Wire.kw "http-base", Wire.String http)
       ])

let url_editor_body ~key ~storage_key ~title ~desc ~placeholder
    ~saved_msg ~cleared_msg ~on_saved
    (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let url = Signal.state ctx.ui_scheduler (Option.value (get_url storage_key) ~default:"") in
  let read_input () =
    match Web_dom.query_selector ("#" ^ key ^ "-input") with
    | Some el -> Web_dom.el_value el
    | None -> Signal.get_state url
  in
  let reset () =
    Platform.local_storage_remove storage_key;
    on_saved ();
    Runtime.signal_set url "";
    Toast.success cleared_msg;
    Dialogs_state.close_top ()
  in
  let save () =
    let trimmed = String.trim (read_input ()) in
    if trimmed = "" then reset ()
    else if not (valid_url trimmed) then Toast.error T.url_invalid
    else (
      Platform.local_storage_set storage_key trimmed;
      on_saved ();
      Toast.success saved_msg;
      Dialogs_state.close_top ())
  in
  let node =
    dom ~key ~style_class:("cp__settings-" ^ key ^ "-cnt")
      [ dom ~key:(key ^ "-h") ~tag:"h1"
          ~style_class:"ls-dialog-title-lg" ~text:title []
      ; dom ~key:(key ^ "-b") ~style_class:"ls-pad"
          [ dom ~key:(key ^ "-d") ~tag:"p"
              ~style_class:"ls-desc ls-mb-sm" ~text:desc []
          ; dom ~key:(key ^ "-i") ~tag:"p"
              [ dom ~key:(key ^ "-il") ~tag:"label"
                  [ dom ~key:(key ^ "-is") ~tag:"strong" ~text:"URL" []
                  ; dom ~key:(key ^ "-in") ~tag:"input"
                      ~id:(key ^ "-input")
                      ~style_class:"form-input is-small"
                      ~attrs:
                        [ ("value", Signal.get_state url)
                        ; ("placeholder", placeholder)
                        ; ("style", "width: 100%") ]
                      []
                  ]
              ]
          ; dom ~key:(key ^ "-btns") ~tag:"p"
              ~style_class:"ls-form-actions"
              ([ dom ~key:(key ^ "-save") ~tag:"button"
                   ~style_class:
                     (Settings_page.btn_base ^ " "
                    ^ Settings_page.variant_cls `Solid ^ " "
                    ^ Settings_page.size_cls `Sm)
                   ~attrs:[ ("type", "button") ]
                   ~text:T.save ~events:"click"
                   ~on_dom_event:(fun n _ -> if n = "click" then save ())
                   [] ]
              @
              if Signal.get_state url = "" then []
              else
                [ dom ~key:(key ^ "-reset") ~tag:"button"
                    ~style_class:
                      (Settings_page.btn_base ^ " "
                     ^ Settings_page.variant_cls `Outline ^ " "
                     ^ Settings_page.size_cls `Sm)
                    ~attrs:[ ("type", "button") ]
                    ~text:T.reset_default ~events:"click"
                    ~on_dom_event:(fun n _ ->
                      if n = "click" then reset ())
                    []
                ])
          ]
      ]
  in
  node ctx parent

let sync_body =
  url_editor_body ~key:"sync-server" ~storage_key:"sync-server-url"
    ~title:T.sync_server_url ~desc:T.sync_url_desc
    ~placeholder:default_sync_http ~saved_msg:T.sync_saved
    ~cleared_msg:T.sync_cleared
    ~on_saved:(fun () ->
      ignore
        ((let* _ = push_sync_config () in
         Js.Promise.resolve ())
         |> Js.Promise.catch (fun _ ->
                Toast.error (I18n.t "settings/update-worker-error");
                Js.Promise.resolve ())))

let publish_body =
  url_editor_body ~key:"publish-server" ~storage_key:"publish-server-url"
    ~title:T.publish_server_url ~desc:T.publish_url_desc
    ~placeholder:default_publish_base ~saved_msg:T.publish_saved
    ~cleared_msg:T.publish_cleared ~on_saved:(fun () -> ())
