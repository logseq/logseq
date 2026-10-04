(* db-worker/ui-request handling (frontend/handler/worker.cljs
   <db-worker-ui-action): the worker asks the UI for input while a sync
   operation is in flight. request-e2ee-password shows the e2ee password
   modal (components/e2ee.cljs); native-* keychain requests resolve with
   {:supported? false} on web; anything else is rejected. *)

open Lui_elements

let dom = Logseq_dom.dom
let dyn = Logseq_dom.dyn

let resolve id result =
  ignore
    (Runtime.invoke2 "thread-api/resolve-ui-request" (Wire.String id)
       result)

let reject id =
  ignore
    (Runtime.invoke2 "thread-api/reject-ui-request" (Wire.String id)
       (Wire.Map [ (Wire.kw "code", Wire.kw "ui-request-rejected") ]))

let handle (w : Wire.t) =
  match
    ( Wire.map_get_string w "request-id"
    , Option.bind (Wire.get w "action") Wire.as_keyword )
  with
  | Some id, Some action -> (
      match action with
      | "request-e2ee-password" ->
          let reason =
            match Wire.get w "payload" with
            | Some p -> (
                match Wire.get p "reason" with
                | Some (Wire.Keyword s) | Some (Wire.String s) -> s
                | _ -> "")
            | None -> ""
          in
          Dialogs_state.open_ui_request
            { Dialogs_state.ur_id = id
            ; ur_reason = reason
            ; ur_reject = (fun () -> reject id)
            }
      | "native-save-e2ee-password" | "native-get-e2ee-password"
      | "native-delete-e2ee-password" ->
          resolve id (Wire.Map [ (Wire.kw "supported?", Wire.Bool false) ])
      | _ -> reject id)
  | _ -> ()

(* -- e2ee password modal (components/e2ee.cljs) -- *)

let input_value sel =
  match Web_dom.query_selector (".e2ee-password-modal-content " ^ sel) with
  | Some el -> Web_dom.el_value el
  | None -> ""

let submit r two warn =
  let pw = input_value ".ls-toggle-password-input input" in
  if String.length pw = 0 then ()
  else if
    two
    && pw
       <> input_value "input[placeholder='Enter password again']"
  then Runtime.signal_set warn true
  else (
    resolve r.Dialogs_state.ur_id (Wire.Map [ (Wire.kw "password", Wire.String pw) ]);
    Dialogs_state.clear_ui_request ())

let pw_input ~key ~placeholder ~on_enter =
  dom ~key ~style_class:"ls-toggle-password-input"
    [ dom ~key:(key ^ "-i") ~tag:"input"
        ~style_class:"form-input"
        ~attrs:
          [ ("type", "password"); ("placeholder", placeholder)
          ; ("autocomplete", "off"); ("autofocus", "true") ]
        ~events:"keydown"
        ~on_dom_event:(fun n p ->
          if
            n = "keydown"
            && Platform.payload_str p "key"
               = "Enter"
          then on_enter ())
        []
    ; dom ~key:(key ^ "-eye") ~tag:"button"
        ~style_class:"ls-eye-btn"
        ~attrs:[ ("type", "button") ]
        [ dom ~key:"ic" ~tag:"i" ~style_class:"ti ti-eye" [] ]
    ]

let view (r : Dialogs_state.ui_request) : t =
 fun ctx parent ->
  let warn = Signal.state ctx.ui_scheduler false in
  (* cljs: reason :decrypt-user-rsa-private-key -> single input *)
  let two = r.Dialogs_state.ur_reason <> "decrypt-user-rsa-private-key" in
  let submit_now () = submit r two warn in
  let title, extra =
    if two
    then (I18n.e2ee_set_password_title, " encryption-password")
    else (I18n.e2ee_enter_password_title, "")
  in
  dom ~key:"e2ee-ov"
    ~style_class:"e2ee-password-modal-overlay ui__dialog-overlay"
    [ dom ~key:"e2ee-c"
        ~style_class:
          ("e2ee-password-modal-content ui__dialog-content"
          ^ extra)
        [ dom ~key:"t" ~style_class:"ls-e2ee-title" ~text:title []
        ; dom ~key:"f" ~style_class:"ls-e2ee-form"
            ( [ pw_input ~key:"p1"
                  ~placeholder:I18n.e2ee_password_ph
                  ~on_enter:submit_now ]
            @ ( if two
                then
                  [ pw_input ~key:"p2"
                      ~placeholder:I18n.e2ee_password_again_ph
                      ~on_enter:submit_now
                  ; if_ ~test:warn.Signal.state_signal
                      (dom ~key:"mm"
                         ~style_class:"ls-warn-text"
                         ~text:I18n.e2ee_password_not_matched
                         [])
                  ]
                else [] )
            @ [ dom ~key:"s" ~tag:"button"
                  ~style_class:"ui__button ls-btn-primary"
                  ~attrs:[ ("type", "button") ]
                  ~text:I18n.submit ~events:"click"
                  ~on_dom_event:(fun n _ ->
                    if n = "click" then submit_now ())
                  []
              ] )
        ]
    ]
    ctx parent
