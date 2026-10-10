(* Sync/publish server URL editor dialogs — mirrors cljs
   sync-server-url-settings-container / publish-server-url-settings-container
   + config.cljs custom-url helpers. Storage is a plain string under
   "sync-server-url" / "publish-server-url" (removeItem clears). *)

open Promise_ext
open Lui_elements

module T = I18n

let default_sync_http = "https://api.logseq.io"
let default_sync_ws = "wss://api.logseq.io/sync/%s"
let default_publish_base = "https://logseq.io"

let get_url key =
  match Ui_services.storage_get key with
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
  let read_input () = Runtime.signal_get url in
  let reset () =
    Ui_services.storage_remove storage_key;
    on_saved ();
    Runtime.signal_set url "";
    Toast.success cleared_msg;
    Dialogs_state.close_named key
  in
  let save () =
    let trimmed = String.trim (read_input ()) in
    if trimmed = "" then reset ()
    else if not (valid_url trimmed) then Toast.error T.url_invalid
    else (
      Ui_services.storage_set storage_key trimmed;
      on_saved ();
      Toast.success saved_msg;
      Dialogs_state.close_named key)
  in
  let node =
    column ~key ~style_class:("cp__settings-" ^ key ^ "-cnt") ~gap:8
      [ heading ~key:(key ^ "-h") ~level:1
          ~style_class:"ls-dialog-title-lg"
          ~font_size:"1.5rem" ~font_weight:700 ~value:title []
      ; column ~key:(key ^ "-b") ~style_class:"ls-pad" ~padding:8
          [ paragraph ~key:(key ^ "-d")
              ~style_class:"ls-desc ls-mb-sm"
              ~font_size:"0.875rem"
              ~data_attrs:[ ("style", "opacity:0.7;margin-bottom:1rem") ]
              ~value:desc []
          ; box ~key:(key ^ "-i")
              [ label ~key:(key ^ "-il") ~value:"URL" []
              ; input ~key:(key ^ "-in")
                  ~accessibility_identifier:(key ^ "-input")
                  ~style_class:"form-input is-small"
                  ~text_signal:(Signal.value url) ~placeholder
                  ~on_input:(fun ev ->
                    match ev with
                    | Lui_protocol.TextChanged (_, q) ->
                        Runtime.signal_set url q
                    | _ -> ())
                  []
              ]
          ; (* cljs [:p.pt-2.flex.gap-2] — left-aligned buttons;
               the base .ls-form-actions rule stays for the
               plugins_view emitter until its batch lands *)
            row ~key:(key ^ "-btns") ~gap:8 ~main:`start
              ~style_class:"ls-form-actions"
              ([ button ~key:(key ^ "-save")
                   ~variant:(Settings_controls.btn_variant `Solid)
                   ~size:`sm
                   ~style_class:
                     (Settings_controls.btn_cls ~variant:`Solid
                        ~size:`Sm ())
                   ~text:T.save
                   ~on_press:(fun _ -> save ())
                   [] ]
              @ [ if_ ~test:(reactive (fun value -> String.trim value <> "") (Signal.value url))
                  (button ~key:(key ^ "-reset")
                    ~variant:(Settings_controls.btn_variant `Outline)
                    ~size:`sm
                    ~style_class:
                      (Settings_controls.btn_cls ~variant:`Outline
                         ~size:`Sm ())
                    ~text:T.reset_default
                    ~on_press:(fun _ -> reset ())
                    []) ])
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
