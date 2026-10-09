(* Run the same shared views against the web and native recording hosts. *)
open Test_check
module M = Drive.Model
module S = Drive.Session
module P = Lui_protocol

let nodes s = M.all_nodes s.S.tree
let class_has n cls =
  List.mem cls
    (String.split_on_char ' '
       (Option.value (M.string_prop n "style-class") ~default:""))

let button_properties n =
  List.fold_left
    (fun props p ->
      match Hashtbl.find_opt n.M.props (Lui_wire_schema.property_name p) with
      | Some v -> P.Property_map.add p v props
      | None -> props)
    P.Property_map.empty [ P.TextValue; P.AccessibilityLabel ]

let run_views ~registry ~profile ~finish =
  let previous_flush = !Runtime.app_flush in
  let previous_preset = Ui_services.storage_get "ls-icon-color-preset" in
  let previous_used = Ui_services.storage_get "ls-icons-used" in
  let restore_storage key = function
    | Some value -> Ui_services.storage_set key value
    | None -> Ui_services.storage_remove key
  in
  let mount view =
    let s = S.mount ~registry ~profile ~initial:Model.initial
      ~reducer:(fun m () -> m) ~view:(fun _ctx ms _send -> view ms) () in
    Runtime.app_flush := (fun () -> S.flush s);
    s
  in
  let chosen = ref None in
  let picker = mount (fun _ ->
      Icon_picker.picker_view ~del:true ~emoji_only:false
        ~on_chosen:(fun c -> chosen := Some c) ~close:(fun () -> ())) in
  let buttons () = List.filter (fun n -> n.M.kind = "button") (nodes picker) in
  let labelled () = List.for_all (fun n ->
      P.node_properties_supported P.Button (button_properties n)) (buttons ()) in
  check "icon picker buttons satisfy the host label contract" (labelled ());
  let presets () = List.filter (fun n -> class_has n "it") (buttons ()) in
  check "icon color presets start closed" (presets () = []);
  let trigger = List.find (fun n -> class_has n "color-picker") (buttons ()) in
  S.press picker trigger.M.id;
  eqi "palette trigger opens every preset" 9 (List.length (presets ()));
  check "color preset buttons satisfy the host label contract" (labelled ());
  S.press picker trigger.M.id;
  check "palette trigger closes presets" (presets () = []);
  S.press picker trigger.M.id;
  (match List.find_opt (fun n -> M.string_prop n "background" = Some "#6e7b8b") (presets ()) with
   | Some n -> S.press picker n.M.id
   | None -> check "gray preset exists" false);
  check "selecting a preset closes the palette" (presets () = []);
  eqs "selected icon color is persisted" "#6e7b8b"
    (Option.value (Ui_services.storage_get "ls-icon-color-preset") ~default:"");
  let icon = List.find_opt (fun n -> class_has n "ls-emoji-cell") (buttons ()) in
  (match icon with
   | Some n -> S.press picker n.M.id;
       check "selected icon carries the preset color"
         (match !chosen with Some (Icon_picker.Tabler (_, Some "#6e7b8b")) -> true | _ -> false)
   | None -> check "icon picker renders icon buttons" false);
  ignore (Lui_app.dispose picker.S.app);
  restore_storage "ls-icon-color-preset" previous_preset;
  restore_storage "ls-icons-used" previous_used;
  let remote_before = !Graphs_view.remote_st_ref in
  let members_before = !Collaborators.members_sig_ref in
  let repos_changed_before = !Graphs_ops.on_repos_changed in
  Graphs_view.remote_st_ref := None;
  Collaborators.members_sig_ref := None;
  let visible = ref None in
  let s = mount (fun ms ctx parent ->
      let st = Signal.state ctx.Lui_ui.ui_scheduler false in
      visible := Some st;
      Lui_elements.column
        [ Lui_elements.if_ ~test:(Signal.value st)
            (Lui_elements.column [ Graphs_view.view ms; Collaborators.body ms ]) ]
        ctx parent) in
  (* new Signal.subscribers is an opaque linked registry — probe leaked
     downstream work instead: publishing to the sources after unmount must
     perform no more computation than it did before the views mounted *)
  let sched = (Option.get !visible).Signal.state_signal.Signal.owner in
  let st r default =
    match !r with
    | Some s -> s
    | None ->
        let s = Signal.state sched default in
        r := Some s;
        s
  in
  let publish_work () =
    Signal.set (st Graphs_view.remote_st_ref []) [];
    Signal.set (st Collaborators.members_sig_ref ([], false)) ([], false);
    Signal.stabilize sched;
    let d = Signal.last_stabilization sched in
    d.Signal.stabilization_rounds + d.Signal.stabilization_dirty_tasks
  in
  let baseline = publish_work () in
  for cycle = 1 to 5 do
    Signal.set (Option.get !visible) true;
    S.flush s;
    Signal.set (Option.get !visible) false;
    S.flush s;
    check (Printf.sprintf "unmounted graph and members views release subscriptions (%d)" cycle)
      (publish_work () = baseline)
  done;
  ignore (Lui_app.dispose s.S.app);
  (* Logged-out graph refreshes resolve on the next web microtask. Let
     them finish against their original state before restoring globals. *)
  ignore (Js.Promise.then_ (fun () ->
      Graphs_view.remote_st_ref := remote_before;
      Collaborators.members_sig_ref := members_before;
      Graphs_ops.on_repos_changed := repos_changed_before;
      Runtime.app_flush := previous_flush;
      finish ();
      Js.Promise.resolve ()) (Js.Promise.resolve ()))

let popup_press (ev : Ui_services.ev) =
  let state_before = Editor_state.read () in
  Editor_state.set (fun v -> { v with editing = Some
      (Editor_state.mk_editing ~uuid:"b1" ~buffer:"text"
         ~scope:"main" ~base:"text" ()) });
  let popup : Editor_commands.popup =
    { kind = Editor_commands.Link_form false; uuid = "b1"; from = 0
    ; cy = 2026; cm = 10; cd = 9; hour = 0; tmin = 0; x = 0.; y = 0.
    ; menu = None; rpt = None } in
  Editor_commands.active := Some popup;
  Editor_keys.on_mousedown ev;
  check "pressing inside the editor popup keeps it open"
    (!Editor_commands.active <> None);
  check "pressing inside the editor popup does not schedule a blur commit"
    (!Editor_actions.pending_blur_uuid = None);
  Editor_actions.clear_pending_blur ();
  Editor_commands.active := None;
  Runtime.editor_popup_open := false;
  Editor_state.set (fun _ -> state_before)

let dates () =
  for month = 1 to 12 do
    let source = Printf.sprintf "2026-%02d-15T12:34:56" month in
    match Properties_value.parse_ms source with
    | None -> check ("property datetime parses " ^ source) false
    | Some ms ->
        let f = Ui_services.time_local_fields ms in
        check ("property datetime preserves local fields " ^ source)
          (f.year = 2026 && f.month = month && f.day = 15
           && f.hours = 12 && f.minutes = 34 && f.seconds = 56)
  done
