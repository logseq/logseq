(* db-worker/ui-request handling (frontend/handler/worker.cljs
   <db-worker-ui-action): the worker asks the UI for input while a sync
   operation is in flight. request-e2ee-password shows the e2ee password
   modal (components/e2ee.cljs); native-* keychain requests resolve with
   {:supported? false} on web; anything else is rejected. *)

open Lui_elements

let dyn = Logseq_dom.dyn
let if_ = Logseq_dom.if_

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

let text_of ev =
  match ev with
  | Lui_protocol.TextChanged (_, s) -> s
  | _ -> ""

let submit r two warn pw1 pw2 =
  let pw = Lui_elements.get_state pw1 in
  if String.length pw = 0 then ()
  else if two && pw <> Lui_elements.get_state pw2 then
    Runtime.signal_set warn true
  else (
    resolve r.Dialogs_state.ur_id
      (Wire.Map [ (Wire.kw "password", Wire.String pw) ]);
    Dialogs_state.clear_ui_request ())

(* cljs shui/toggle-password: the eye button toggles the field between
   password and text once it has content *)
let pw_input ctx ~key ~placeholder ~autofocus ~value ~on_enter =
  let visible = Signal.state ctx.Lui_ui.ui_scheduler false in
  let field =
    (* the kind itself switches (secure_field <-> text_field), so this
       branch is structural — a reactive prop can't express it *)
    dyn ~equal:( = )
      (fun vis ->
        let ctor = if vis then text_field else secure_field in
        ctor ~key:(key ^ "-i")
          ~style_class:"form-input"
          ~placeholder ~autofocus ~submit_on_enter:true
          ~text_signal:(Signal.value value)
          ~on_input:(fun ev -> Signal.set value (text_of ev))
          ~on_submit:(fun _ -> on_enter ())
          [])
      (Signal.value visible)
  in
  row ~key ~style_class:"ls-toggle-password-input" ~cross:`center
    [ field
    ; if_ ~test:(Signal.map (fun v -> v <> "") (Signal.value value))
        (button ~key:(key ^ "-eye") ~variant:`ghost
           ~style_class:"ls-eye-btn"
           ~label:I18n.e2ee_show_password
           ~icon:(reactive
                    (fun vis -> if vis then `app "eye-off" else `eye)
                    (Signal.value visible))
           ~on_press:(fun _ ->
             Runtime.signal_set visible (not (Signal.get_state visible)))
           [])
    ]

let view (r : Dialogs_state.ui_request) : t =
 fun ctx parent ->
  let warn = Signal.state ctx.Lui_ui.ui_scheduler false in
  let pw1 = Signal.state ctx.Lui_ui.ui_scheduler "" in
  let pw2 = Signal.state ctx.Lui_ui.ui_scheduler "" in
  (* cljs: reason :decrypt-user-rsa-private-key -> single input *)
  let two = r.Dialogs_state.ur_reason <> "decrypt-user-rsa-private-key" in
  let submit_now () = submit r two warn pw1 pw2 in
  let title, extra =
    if two
    then (I18n.e2ee_set_password_title, " encryption-password")
    else (I18n.e2ee_enter_password_title, "")
  in
  box ~key:"e2ee-ov"
    ~style_class:"e2ee-password-modal-overlay ui__dialog-overlay"
    [ column ~key:"e2ee-c"
        ~style_class:
          ("e2ee-password-modal-content ui__dialog-content"
          ^ extra)
        ~gap:32
        [ text ~key:"t" ~style_class:"ls-e2ee-title" ~value:title []
        ; column ~key:"f" ~style_class:"ls-e2ee-form" ~gap:16
            ( [ pw_input ctx ~key:"p1" ~value:pw1 ~autofocus:true
                  ~placeholder:I18n.e2ee_password_ph
                  ~on_enter:submit_now ]
            @ ( if two
                then
                  [ pw_input ctx ~key:"p2" ~value:pw2
                      ~autofocus:false
                      ~placeholder:I18n.e2ee_password_again_ph
                      ~on_enter:submit_now
                  ; if_ ~test:warn.Signal.state_signal
                      (text ~key:"mm"
                         ~style_class:"ls-warn-text"
                         ~value:I18n.e2ee_password_not_matched
                         [])
                  ]
                else [] )
            @ [ button ~key:"s" ~variant:`primary
                  ~style_class:"ui__button ls-btn-primary"
                  ~text:I18n.submit
                  ~on_press:(fun _ -> submit_now ())
                  []
              ] )
        ]
    ]
    ctx parent
