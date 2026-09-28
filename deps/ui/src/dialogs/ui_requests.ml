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
  match Browser_ui.qs (".e2ee-password-modal-content " ^ sel) with
  | Some el -> Browser_ui.value el
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
  dom ~key ~style_class:"ls-toggle-password-input relative"
    [ dom ~key:(key ^ "-i") ~tag:"input"
        ~style_class:"form-input block w-full sm:text-sm sm:leading-5"
        ~attrs:
          [ ("type", "password"); ("placeholder", placeholder)
          ; ("autocomplete", "off"); ("autofocus", "true") ]
        ~events:"keydown"
        ~on_dom_event:(fun n p ->
          if
            n = "keydown"
            && Platform.payload_str (Option.value p ~default:"{}") "key"
               = "Enter"
          then on_enter ())
        []
    ; dom ~key:(key ^ "-eye") ~tag:"button"
        ~style_class:"absolute right-1"
        ~attrs:[ ("type", "button"); ("style", "top:6px") ]
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
    then (Graphs_text.e2ee_set_password_title, " encryption-password")
    else (Graphs_text.e2ee_enter_password_title, "")
  in
  dom ~key:"e2ee-ov"
    ~style_class:
      "e2ee-password-modal-overlay fixed inset-0 z-50 bg-background/90 \
       flex justify-center items-center"
    [ dom ~key:"e2ee-c"
        ~style_class:
          ("e2ee-password-modal-content flex flex-col gap-8 p-4 \
            ui__dialog-content w-full max-w-2xl border bg-background \
            sm:rounded-lg shadow-lg"
          ^ extra)
        [ dom ~key:"t" ~style_class:"text-2xl font-medium" ~text:title []
        ; dom ~key:"f" ~style_class:"flex flex-col gap-4"
            ( [ pw_input ~key:"p1"
                  ~placeholder:Graphs_text.e2ee_password_ph
                  ~on_enter:submit_now ]
            @ ( if two
                then
                  [ pw_input ~key:"p2"
                      ~placeholder:Graphs_text.e2ee_password_again_ph
                      ~on_enter:submit_now
                  ; dyn ~equal:( = ) (fun w ->
                        if w
                        then
                          dom ~key:"mm"
                            ~style_class:"text-warning text-sm"
                            ~text:Graphs_text.e2ee_password_not_matched
                            []
                        else box ~key:"mm-ok" [])
                      warn.Signal.state_signal
                  ]
                else [] )
            @ [ dom ~key:"s" ~tag:"button"
                  ~style_class:
                    "ui__button inline-flex items-center justify-center \
                     rounded-md text-sm font-medium px-4 py-2 \
                     bg-primary text-primary-foreground"
                  ~attrs:[ ("type", "button") ]
                  ~text:Graphs_text.submit ~events:"click"
                  ~on_dom_event:(fun n _ ->
                    if n = "click" then submit_now ())
                  []
              ] )
        ]
    ]
    ctx parent
