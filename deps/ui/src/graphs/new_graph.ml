(* Create-a-new-graph dialog body (.new-graph): name input, Logseq Sync /
   E2EE checkboxes (rtc-test mode only), Submit. Mirrors
   components/repo.cljs new-db-graph-inner: validation toasts +
   create-or-open-db via Graph.create_graph; the sync path calls the
   worker db-sync endpoints like the cljs flow does. *)

open Promise_ext
open Lui_elements

let if_ = Lui_elements.if_
module T = I18n

let toggle st =
  Signal.set st (not (Runtime.signal_get st));
  Runtime.flush ()

(* shui/checkbox — the kind draws its own check indicator *)
let checkbox ~key ~id ~checked ~on_toggle =
  checkbox ~key ~accessibility_identifier:id
    ~style_class:"ui__checkbox" ~checked_signal:checked
    ~on_toggle:(fun _ -> on_toggle ()) []

let invalid_name name = Graphs_ops.invalid_chars name <> []

let already_exists name = Graphs_ops.already_exists name

let submit name_st cloud e2ee creating =
  let name = String.trim (Runtime.signal_get name_st) in
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
        (if Runtime.signal_get cloud then
           (* cljs: db-sync-ensure-user-rsa-keys runs before
              create-remote-graph so the private key is available (the
              worker may ui-request an e2ee password here) *)
           let e2ee = Runtime.signal_get e2ee in
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
      Js.Promise.resolve ()))

let body (_ms : Model.t Signal.signal) : t =
 fun ctx parent ->
  let cloud = Signal.state ctx.ui_scheduler false in
  (* cljs new-db-graph-inner: graph-e2ee? defaults to true *)
  let e2ee = Signal.state ctx.ui_scheduler true in
  let creating = Signal.state ctx.ui_scheduler false in
  let name_st = Signal.state ctx.ui_scheduler "" in
  column ~key:"new-graph" ~style_class:"new-graph"
      [ (* cljs shui/input is h-10; .ui__input defaults to the 29px
           compact variant *)
        input ~key:"ng-in" ~style_class:"ui__input" ~height:40
          ~placeholder:T.graph_name_placeholder
          ~autofocus:true
          ~text_signal:(Signal.value name_st)
          ~on_input:(fun ev ->
            match ev with
            | Lui_protocol.TextChanged (_, v) ->
                Runtime.signal_set name_st v
            | _ -> ())
          ~on_submit:(fun _ -> submit name_st cloud e2ee creating)
          []
      ; (* cljs new-db-graph-inner: the sync row shows when
           user-handler/rtc-group? (dev build, custom sync server, or a
           cognito rtc group). ?rtc-test=true keeps it reachable in e2e
           without auth *)
        (if Ui_services.env_rtc_test_mode () || Rtc_flows.rtc_group () then
           column ~key:"ng-rtc" ~style_class:"ls-ng-rtc"
             [ row ~key:"ng-rtc-row" ~style_class:"ls-ng-row"
                 [ checkbox ~key:"rtc" ~id:"rtc-sync"
                     ~checked:(Signal.value cloud)
                     ~on_toggle:(fun () -> toggle cloud)
                 ; text ~key:"rtc-lbl" ~style_class:"ls-ng-label"
                     ~value:T.use_sync_label
                     ~on_press:(fun _ -> toggle cloud)
                     []
                 ; if_ ~test:(Signal.value cloud)
                     (row ~key:"ng-e2ee-row"
                        ~style_class:"ls-ng-row ls-ng-sub"
                        [ checkbox ~key:"e2ee" ~id:"rtc-graph-e2ee"
                            ~checked:(Signal.value e2ee)
                            ~on_toggle:(fun () -> toggle e2ee)
                        ; text ~key:"e2ee-lbl"
                            ~style_class:"ls-ng-label"
                            ~value:T.encrypt_data_label
                            ~on_press:(fun _ -> toggle e2ee)
                            []
                        ])
                 ]
             ]
         else box ~key:"ng-no-rtc" ~style_class:"hidden" [])
      ; button ~key:"ng-submit" ~style_class:"ui__button ls-btn-primary"
          ~text:T.submit
          ~disabled_signal:(Signal.value creating)
          ~on_press:(fun _ -> submit name_st cloud e2ee creating)
          []
      ]
    ctx parent
