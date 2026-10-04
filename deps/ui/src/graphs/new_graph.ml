(* Create-a-new-graph dialog body (.new-graph): name input, Logseq Sync /
   E2EE checkboxes (rtc-test mode only), Submit. Mirrors
   components/repo.cljs new-db-graph-inner: validation toasts +
   create-or-open-db via Graph.create_graph; the sync path calls the
   worker db-sync endpoints like the cljs flow does. *)

open Promise_ext
open Lui_elements

let dom = Logseq_dom.dom
let dyn = Logseq_dom.dyn
let if_ = Logseq_dom.if_
module T = I18n

let checkbox_cls checked =
  "ui__checkbox peer h-4 w-4 shrink-0 cursor-pointer rounded-sm border \
   border-primary focus-visible:outline-none"
  ^ if checked then " data-checked" else ""

let checkbox ~key ~id ~checked ~on_click =
  dom ~key ~tag:"button" ~id
    ~style_class_signal:(Logseq_dom.reactive_class checkbox_cls checked)
    ~attrs_signal_v:(Logseq_dom.reactive_attrs
         (fun c ->
           [ ("role", "checkbox")
           ; ("type", "button")
           ; ("aria-checked", string_of_bool c)
           ; ("data-state", if c then "checked" else "unchecked")
           ])
         checked)
    ~events:"click"
    ~on_dom_event:(fun n _ -> if n = "click" then on_click ())
    [ if_ ~test:checked
        (dom ~key:(key ^ "-ck") ~tag:"i" ~style_class:"ti ti-check ls-icon-sm"
           []) ]

let name_input () =
  match Web_dom.query_selector ".new-graph input" with
  | Some el -> Web_dom.el_value el |> String.trim
  | None -> ""

let invalid_name name = Graphs_ops.invalid_chars name <> []

let already_exists name = Graphs_ops.already_exists name

let submit cloud e2ee creating =
  let name = name_input () in
  if String.trim name = "" then
    Toast.warning T.name_reserved_warning
  else if already_exists name then
    Toast.error (T.already_exists name)
  else if invalid_name name then
    Toast.warning T.name_reserved_warning
  else (
    Signal.set creating true;
    Runtime.flush ();
    ignore
      (let* repo =
        (if Signal.get_state cloud then
           (* cljs: db-sync-ensure-user-rsa-keys runs before
              create-remote-graph so the private key is available (the
              worker may ui-request an e2ee password here) *)
           let e2ee = Signal.get_state e2ee in
           let* _ =
             (if e2ee then Rtc_ops.ensure_rsa_keys ()
              else Js.Promise.resolve true)
           in
           Graphs_ops.create_remote name e2ee
         else Graph.create_graph name)
      in
      Graphs_ops.remember_open repo;
      Dialogs_state.close_named "new-graph";
      ignore (Graphs_ops.navigate_journal repo);
      Js.Promise.resolve () (* cljs: db-sync-ensure-user-rsa-keys runs before
               create-remote-graph so the private key is available (the
               worker may ui-request an e2ee password here) *)))

let body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let cloud = Signal.state ctx.ui_scheduler false in
  (* cljs new-db-graph-inner: graph-e2ee? defaults to true *)
  let e2ee = Signal.state ctx.ui_scheduler true in
  let creating = Signal.state ctx.ui_scheduler false in
  let node =
    dom ~key:"new-graph" ~style_class:"new-graph"
      [ dom ~key:"ng-in" ~tag:"input"
          ~style_class:"ui__input"
          ~attrs:
            [ ("placeholder", T.graph_name_placeholder)
            ; ("autocomplete", "off")
            ; ("type", "text")
            ]
          ~events:"keydown"
          ~on_dom_event:(fun n p ->
            match n with
            | "keydown" -> (
                match
                  Platform.payload_str p
                    "key"
                with
                | "Enter" -> submit cloud e2ee creating
                | _ -> ())
            | _ -> ())
          []
      ; if Platform.rtc_test_mode () then
          dom ~key:"ng-rtc" ~style_class:"ls-ng-rtc"
            [ dom ~key:"ng-rtc-row"
                ~style_class:"ls-ng-row"
                [ checkbox ~key:"rtc" ~id:"rtc-sync"
                    ~checked:(Signal.value cloud)
                    ~on_click:(fun () ->
                      Signal.set cloud (not (Signal.get_state cloud));
                      Runtime.flush ())
                ; dom ~key:"rtc-lbl" ~tag:"label"
                    ~style_class:"ls-ng-label"
                    ~attrs:[ ("for", "rtc-sync") ]
                    ~text:T.use_sync_label []
                ; if_ ~test:(Signal.value cloud)
                    (dom ~key:"ng-e2ee-row"
                       ~style_class:"ls-ng-row ls-ng-sub"
                       [ checkbox ~key:"e2ee" ~id:"rtc-graph-e2ee"
                           ~checked:(Signal.value e2ee)
                           ~on_click:(fun () ->
                             Signal.set e2ee
                               (not (Signal.get_state e2ee));
                             Runtime.flush ())
                       ; dom ~key:"e2ee-lbl" ~tag:"label"
                           ~style_class:"ls-ng-label"
                           ~attrs:[ ("for", "rtc-graph-e2ee") ]
                           ~text:T.encrypt_data_label []
                       ])
                ]
            ]
        else box ~key:"ng-no-rtc" ~style_class:"hidden" []
      ; dom ~key:"ng-submit" ~tag:"button" ~text:T.submit ~events:"click"
          ~style_class:"ui__button ls-btn-primary"
          ~attrs_signal_v:(Logseq_dom.reactive_attrs
               (fun c -> if c then [ ("disabled", "true") ] else [])
               (Signal.value creating))
          ~on_dom_event:(fun n _ ->
            if n = "click" then submit cloud e2ee creating)
          []
      ]
  in
  ignore
    (Web_dom.set_timeout_id
       (fun () ->
         match Web_dom.query_selector ".new-graph input" with
         | Some el -> Web_dom.el_focus el
         | None -> ())
       32);
  node ctx parent
