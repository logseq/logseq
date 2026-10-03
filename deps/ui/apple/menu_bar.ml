(* Native menubar commands. The Swift host posts platform_event
   "menu-*" envelopes; each is routed to the same reducer action or
   dialog the in-app keymap and sidebar buttons already use. *)

let install () =
  let route name action =
    Platform.add_event_listener name (fun _ -> Runtime.send action)
  in
  route "menu-toggle-left-sidebar" Action.Toggle_left_sidebar;
  route "menu-toggle-right-sidebar" Action.Toggle_right_sidebar;
  route "menu-toggle-search" Action.Toggle_search;
  Platform.add_event_listener "menu-toggle-wide-mode" (fun _ ->
      Settings_state.toggle_wide_mode ());
  Platform.add_event_listener "menu-open-settings" (fun payload ->
      let tab =
        match payload with
        | Js.Json.JObject kvs -> (
            match List.assoc_opt "tab" kvs with
            | Some v -> Js.Json.decodeString v
            | None -> None)
        | _ -> None
      in
      (match tab with
      | Some t ->
          (* survives the mount-time activate which defaults the tab *)
          Settings_state.request_tab t;
          Dialogs_state.open_ "settings";
          if Settings_state.ready () then (
            (* pane already mounted — switch live and drop the pending
               request so the next open still defaults to general *)
            Settings_state.set_tab t;
            Settings_state.clear_pending_tab ())
      | None -> Dialogs_state.open_ "settings"))
