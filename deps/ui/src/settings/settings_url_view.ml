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

let decimal_in_range limit s =
  s <> "" && String.for_all (function '0' .. '9' -> true | _ -> false) s
  && match int_of_string_opt s with Some value -> value <= limit | None -> false

let valid_ipv6 address =
  let count_groups ~ipv4 s =
    let rec count = function
      | [] -> Some 0
      | [group] when ipv4 && String.contains group '.' ->
          let octets = String.split_on_char '.' group in
          if List.length octets = 4
             && List.for_all (fun octet -> String.length octet <= 3
                 && decimal_in_range 255 octet) octets
          then Some 2 else None
      | group :: rest ->
          if group = "" || String.length group > 4
             || not (String.for_all (function
                 | '0' .. '9' | 'a' .. 'f' | 'A' .. 'F' -> true | _ -> false) group)
          then None
          else Option.map ((+) 1) (count rest)
    in
    count (if s = "" then [] else String.split_on_char ':' s)
  in
  match Str_util.index_of address "::" with
  | None -> count_groups ~ipv4:true address = Some 8
  | Some index ->
      let left = String.sub address 0 index in
      let right = String.sub address (index + 2) (String.length address - index - 2) in
      match count_groups ~ipv4:false left, count_groups ~ipv4:true right with
      | Some left, Some right -> left + right < 8
      | _ -> false

let valid_authority authority =
  let port s = String.length s <= 5 && decimal_in_range 65535 s in
  let host s = s <> "" && not (String.exists (function
      | '[' | ']' | '%' | '<' | '>' | '"' | '^' | '|' -> true | _ -> false) s) in
  if Str_util.starts_with authority "[" then
    match String.index_opt authority ']' with
    | None -> false
    | Some close ->
        let address = String.sub authority 1 (close - 1) in
        let suffix = String.sub authority (close + 1) (String.length authority - close - 1) in
        valid_ipv6 address && (suffix = "" ||
          (Str_util.starts_with suffix ":" && port (String.sub suffix 1 (String.length suffix - 1))))
  else match String.split_on_char ':' authority with
    | [name] -> host name
    | [name; number] -> host name && port number
    | _ -> false

let valid_url s =
  let offset =
    if Str_util.starts_with s "https://" then Some 8
    else if Str_util.starts_with s "http://" then Some 7
    else None
  in
  match offset with
  | None -> false
  | Some offset ->
      let rest = String.sub s offset (String.length s - offset) in
      let authority = List.hd (String.split_on_char '/' rest) in
      valid_authority authority && not (String.contains authority '@')
      && not (String.exists (fun c -> c <= ' ' || c = '\127'
          || c = '\\' || c = '?' || c = '#') s)

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
let push_sync_config url =
  let ws, http =
    match url with
    | Some u -> (url_to_ws u, Str_util.strip_trailing_slashes u)
    | None -> (default_sync_ws, default_sync_http)
  in
  let* result = Runtime.invoke1 "thread-api/set-db-sync-config"
    (Wire.Map
       [ (Wire.kw "enabled?", Wire.Bool true)
       ; (Wire.kw "ws-url", Wire.String ws)
       ; (Wire.kw "http-base", Wire.String http)
       ]) in
  if Rtc_error.is_error result then failwith "Failed to update sync configuration";
  Js.Promise.resolve ()

let url_editor_body ~key ~storage_key ~title ~desc ~placeholder
    ~saved_msg ~cleared_msg ?prepare ~on_saved
    (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let url = Signal.state ctx.ui_scheduler (Option.value (get_url storage_key) ~default:"") in
  let saving = Signal.state ctx.ui_scheduler false in
  let read_input () = Runtime.signal_get url in
  let finish value =
    (match value with
     | Some value -> Ui_services.storage_set storage_key value
     | None -> Ui_services.storage_remove storage_key);
    on_saved ();
    Settings_state.poke ();
    if Ui_effect.alive ctx.ui_scope then begin
      Runtime.signal_set url (Option.value value ~default:"");
      Runtime.signal_set saving false;
      Toast.success (if value = None then cleared_msg else saved_msg);
      Dialogs_state.close_named key
    end
  in
  let failed () =
    if Ui_effect.alive ctx.ui_scope then begin
      Runtime.signal_set saving false;
      Toast.error (T.t "ui/save-changes-error")
    end
  in
  let commit value =
    if not (Runtime.signal_get saving) then begin
      match prepare with
      | None -> (try finish value with _ -> failed ())
      | Some prepare ->
          Runtime.signal_set saving true;
          ignore
            ((let* () = Js.Promise.resolve () in
              let* () = prepare value in
              finish value;
              Js.Promise.resolve ())
             |> Js.Promise.catch (fun _ -> failed (); Js.Promise.resolve ()))
    end
  in
  let reset () = commit None in
  let save () =
    let trimmed = String.trim (read_input ()) in
    if trimmed = "" then reset ()
    else if not (valid_url trimmed) then Toast.error (T.t "settings.sync-server/url-invalid-error")
    else commit (Some trimmed)
  in
  let node =
    column ~key ~style_class:("cp__settings-" ^ key ^ "-cnt")
      [ heading ~key:(key ^ "-h") ~level:1
          ~style_class:"ls-dialog-title-lg" ~value:title []
      ; column ~key:(key ^ "-b") ~style_class:"ls-pad"
          [ paragraph ~key:(key ^ "-d")
              ~style_class:"ls-desc ls-mb-sm" ~margin_bottom:16
              ~value:desc []
          ; box ~key:(key ^ "-i")
              [ label ~key:(key ^ "-il") ~value:"URL" []
              ; Ui_components.input ~key:(key ^ "-in")
                  ~accessibility_identifier:(key ^ "-input")
                  ~style_class:"form-input is-small"
                  ~text_signal:(Signal.value url) ~placeholder
                  ~disabled:(reactive (fun value -> value) (Signal.value saving))
                  ~on_input:(fun ev ->
                    match ev with
                    | Lui_protocol.TextChanged (_, q) ->
                        Runtime.signal_set url q
                    | _ -> ())
                  []
              ]
          ; row ~key:(key ^ "-btns") ~gap:8 ~main:`start
              ~style_class:"ls-form-actions"
              ([ Ui_components.button ~key:(key ^ "-save")
                   ~variant:(Settings_controls.btn_variant `Solid)
                   ~size:`sm
                   ~style_class:
                     (Settings_controls.btn_cls ~variant:`Solid
                        ~size:`Sm ())
                   ~text:(T.t "ui/save")
                   ~disabled:(reactive (fun value -> value) (Signal.value saving))
                   ~on_press:(fun _ -> save ())
                   [] ]
              @ [ if_ ~test:(reactive (fun value -> String.trim value <> "") (Signal.value url))
                  (Ui_components.button ~key:(key ^ "-reset")
                    ~variant:(Settings_controls.btn_variant `Outline)
                    ~size:`sm
                    ~style_class:
                      (Settings_controls.btn_cls ~variant:`Outline
                         ~size:`Sm ())
                    ~text:(T.t "settings.sync-server/reset")
                    ~disabled:(reactive (fun value -> value) (Signal.value saving))
                    ~on_press:(fun _ -> reset ())
                    [])
                ; Ui_components.button ~key:(key ^ "-cancel") ~variant:`outline ~size:`sm
                    ~text:(T.t "ui/cancel")
                    ~disabled:(reactive (fun value -> value) (Signal.value saving))
                    ~on_press:(fun _ -> Dialogs_state.close_named key) [] ])
          ]
      ]
  in
  node ctx parent

let sync_body model =
  (url_editor_body ~key:"sync-server" ~storage_key:"sync-server-url"
    ~title:(T.t "settings.sync-server/url") ~desc:(T.t "settings.sync-server/url-desc")
    ~placeholder:default_sync_http ~saved_msg:(T.t "settings.sync-server/save-success")
    ~cleared_msg:(T.t "settings.sync-server/clear-success")
    ~prepare:push_sync_config ~on_saved:(fun () -> ())) model

let publish_body model =
  (url_editor_body ~key:"publish-server" ~storage_key:"publish-server-url"
    ~title:(T.t "settings-page/publish-server-url") ~desc:(T.t "settings-page/publish-server-url-desc")
    ~placeholder:default_publish_base ~saved_msg:(T.t "settings-page/publish-server-url-saved")
    ~cleared_msg:(T.t "settings-page/publish-server-url-cleared")
    ~on_saved:(fun () -> ())) model
