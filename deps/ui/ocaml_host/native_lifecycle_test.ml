let check message condition = if not condition then failwith message

let () = Native_embed.with_entry_lock (fun () ->
  let previous_host = !Host.host_op in
  Fun.protect ~finally:(fun () -> Host.host_op := previous_host) (fun () ->
    Host.set_host_op (fun name payload ->
      failwith ("Native math requested a browser renderer: " ^ name ^ " " ^ payload));
    List.iter (fun (block, display) ->
      let tex = "\\frac{a}{b} + x^2" in
      let store = Lui_store.create () in
      let backend = Lui_protocol.{backend_profile=generic_profile ();
        apply_batch=(fun batch -> Lui_store.apply_batch store batch; true)} in
      let app = Lui_app.create backend Model.initial (fun model _ -> model)
        (fun _ _ _ -> Logseq_katex.el ~block ~display ~tex ()) in
      Fun.protect ~finally:(fun () -> ignore (Lui_app.dispose app)) (fun () ->
        ignore (Lui_app.start app); ignore (Lui_app.flush app);
        check "Native math must retain its readable TeX source"
          (List.exists (fun id -> Lui_store.string_prop store id "text" = Some tex)
            (Lui_store.preorder store)))) [true,true; false,false]);
  print_endline "native math source without a browser renderer: OK")

let () =
  let disposed = ref 0 in
  let backend = Lui_protocol.{backend_profile=generic_profile (); apply_batch=(fun _ -> true)} in
  let app : (Model.t, Action.t) Lui_app.reducer_app =
    Lui_app.create backend Model.initial (fun model _ -> model)
      (fun context _ _ ->
        Signal.on_dispose context.Lui_ui.ui_scope (fun () ->
          Native_embed.assert_entry_owner ();
          incr disposed);
        Lui_elements.column [])
  in
  Native_embed.current_app := Some app;
  ignore (Native_embed.dispose ());
  check "Native disposal skipped UI cleanup" (!disposed = 1);
  check "Native disposal retained its application" (!(Native_embed.current_app) = None);
  ignore (Native_embed.dispose ());
  check "Native disposal ran cleanup twice" (!disposed = 1);
  Native_embed.with_entry_lock Native_embed.assert_entry_owner;
  print_endline "native lifecycle: OK"

(* Exercise the real cross-thread mailbox and SDL blocking-wait boundary. *)
let () =
  Native_embed.wakeup ();
  let sdl_ok = function Ok value -> value | Error (`Msg message) -> failwith message in
  sdl_ok (Tsdl.Sdl.init Tsdl.Sdl.Init.events);
  Fun.protect ~finally:Tsdl.Sdl.quit (fun () ->
    let event = Tsdl.Sdl.Event.create () in
    let drain () = while Tsdl.Sdl.poll_event (Some event) do () done in
    drain ();
    Atomic.set Bridge.pending_wakeup false;
    Host.set_wakeup Native_embed.wakeup;
    let delivered = ref 0 in
    let sender = Thread.create (fun () ->
      Thread.delay 0.05;
      Host.enqueue (fun () -> incr delivered)) () in
    let started = Unix.gettimeofday () in
    let woke = Tsdl.Sdl.wait_event_timeout None 500 in
    Thread.join sender;
    check "Mailbox delivery did not interrupt the blocking native wait" woke;
    check "Mailbox delivery waited for the idle polling deadline"
      (Unix.gettimeofday () -. started < 0.4);
    check "Native wait consumed the mailbox notification"
      (Tsdl.Sdl.poll_event (Some event)
       && Tsdl.Sdl.Event.get event Tsdl.Sdl.Event.typ = Tsdl.Sdl.Event.user_event
       && Tsdl.Sdl.Event.get event Tsdl.Sdl.Event.user_code = 0x4c53574b);
    check "Mailbox wake lost its pending flag" (Atomic.get Bridge.pending_wakeup);
    Host.drain ();
    check "Waking the native loop lost the queued callback" (!delivered = 1);
    drain ();
    Atomic.set Bridge.pending_wakeup false;
    for _ = 1 to 100 do Host.enqueue (fun () -> incr delivered) done;
    let notifications = ref 0 in
    while Tsdl.Sdl.poll_event (Some event) do incr notifications done;
    check "A mailbox burst posts duplicate native wake events" (!notifications = 1);
    Host.drain ();
    check "Coalesced wake events dropped mailbox work" (!delivered = 101);
    Atomic.set Bridge.pending_wakeup false);
  Native_embed.wakeup ();
  Atomic.set Bridge.pending_wakeup false;
  print_endline "native mailbox blocking wake: OK"

let () =
  let failures = ref [] in
  let expect message condition = if not condition then failures := message :: !failures in
  Host.set_wakeup Native_embed.wakeup;
  Host.drain ();
  let await_wakeup () =
    let deadline = Unix.gettimeofday () +. 2. in
    while not (Atomic.get Bridge.pending_wakeup) && Unix.gettimeofday () < deadline do
      Thread.delay 0.001
    done;
    check "A native timer did not enqueue its callback" (Atomic.exchange Bridge.pending_wakeup false) in
  Atomic.set Bridge.pending_wakeup false;
  let called = ref false in
  let id = Host.set_timeout (fun () -> called := true) 0 in
  expect "A zero-delay timer ran inline" (not !called);
  await_wakeup ();
  Host.clear_timeout id;
  Host.drain ();
  expect "Cancelling a due timer still executes its queued callback" (not !called);
  let schedule_resource weak delay =
    let resource = Bytes.make 1_048_576 'x' in
    Weak.set weak 0 (Some resource);
    Host.set_timeout (fun () -> ignore (Sys.opaque_identity resource)) delay in
  List.iter (fun delay ->
    let weak = Weak.create 1 in
    Atomic.set Bridge.pending_wakeup false;
    let id = schedule_resource weak delay in
    if delay=0 then await_wakeup ();
    Host.clear_timeout id;
    Gc.full_major (); Gc.full_major ();
    expect (Printf.sprintf "Cancelled %d ms timer retains its captured payload" delay)
      (not (Weak.check weak 0));
    Host.drain ()) [0;60_000];
  Atomic.set Bridge.pending_wakeup false;
  let order = ref [] and owner = Thread.id (Thread.self ()) in
  for index = 1 to 32 do
    ignore (Host.set_timeout (fun () ->
      expect "A native timer callback ran outside the entry thread"
        (Thread.id (Thread.self ()) = owner);
      order := index :: !order) 0)
  done;
  await_wakeup (); Thread.delay 0.02; Host.drain ();
  expect "Zero-delay timers lost registration order" (List.rev !order = List.init 32 ((+) 1));
  Atomic.set Bridge.pending_wakeup false;
  let second = ref 0 and seen = ref [] in
  ignore (Host.set_timeout (fun () -> seen := "first" :: !seen; Host.clear_timeout !second) 0);
  second := Host.set_timeout (fun () -> seen := "second" :: !seen) 0;
  await_wakeup (); Thread.delay 0.02; Host.drain ();
  expect "A callback cannot cancel another queued timer" (!seen = ["first"]);
  Atomic.set Bridge.pending_wakeup false;
  let seen = ref [] in
  let late = Host.set_timeout (fun () -> seen := "late" :: !seen) 1000 in
  ignore (Host.set_timeout (fun () -> seen := "early" :: !seen) 10);
  await_wakeup (); Host.drain (); Host.clear_timeout late;
  expect "An earlier timer did not interrupt a later deadline" (!seen = ["early"]);
  Gc.full_major (); Gc.full_major ();
  let before = (Gc.stat ()).live_words in
  for id = 1_000_000 to 1_009_999 do Host.clear_timeout id done;
  Gc.full_major (); Gc.full_major ();
  let retained = ((Gc.stat ()).live_words - before) * (Sys.word_size / 8) in
  Printf.printf "clearing inactive timers retained %d bytes\n%!" retained;
  expect "Clearing inactive timer handles retains cancellation records" (retained < 65_536);
  Atomic.set Bridge.pending_wakeup false;
  List.iter prerr_endline (List.rev !failures);
  check "Native timer cancellation and ownership" (!failures = []);
  print_endline "native timer cancellation and ownership: OK"


(* Unsupported menu keys must not scan the document during text input. *)
let () = Native_embed.with_entry_lock (fun () ->
  let failures = ref [] in
  let expect message condition = if not condition then failures := message :: !failures in
  let queries = ref 0 and menu_node = ref None and target = ref None in
  let focused = ref (-1) and clicked = ref 0 and item_nodes = ref [] in
  let previous_context = !Popups_state.active in
  let scheduler = Signal.scheduler () in
  let context = Popups_state.make scheduler in
  let dom = { Ui_dom_native.ops with by_id = (fun identifier ->
    incr queries;
    if identifier="block-context-menu" then !menu_node
    else List.assoc_opt identifier !item_nodes);
    dispatch_json = (fun name _ -> if name="ls:editor-command" then incr clicked) } in
  Platform.install_ui_services ~paints_caret:true ~assert_owner:Native_embed.assert_entry_owner
    ~request_flush:(fun () -> ()) ~dom ~timers:Ui_dom_native.timers ~files:Ui_dom_native.files;
  let event key =
    {(Ui_dom_native.ev_of (Js.Json.JObject
       (match key with None -> [] | Some key -> ["key", Js.Json.JString key])))
     with Ui_services.target = !target} in
  List.iter (fun key ->
    queries := 0;
    expect "Unsupported menu input was consumed" (not (Popups_view.menu_keydown context (event key)));
    expect "Unsupported menu input scanned the document" (!queries = 0))
    [None; Some "a"; Some "你"; Some "Backspace"; Some "Escape";
     Some "Tab"; Some "ArrowLeft"; Some "ArrowRight"; Some "Shift"; Some "Dead"];
  let base = Ui_dom_native.el_of (Js.Json.JObject []) in
  target:=Some {base with Ui_services.closest=(fun selector ->
    if selector="#block-context-menu, #block-context-submenu" then Some base else None)};
  let cm : Popups_state.cm = {epoch=0;cx=0.;cy=0.;atop=0.;flip=false;block_id="context-fixture";
    multi=false;entries=[Ci_item ("First",None,"fixture-first");Ci_item ("Last",None,"fixture-last")];
    sub_open=(-1);sub_xy=(0.,0.);highlighted=None;tag=None;native=false;native_acts=[]} in
  Signal.set context.vs {ac=None;cm=Some cm;pv=None};
  Signal.stabilize scheduler;
  List.iter (fun key ->
    queries := 0;
    expect "A missing menu consumed navigation" (not (Popups_view.menu_keydown context (event (Some key))));
    expect "Supported menu navigation did not resolve its owned menu" (!queries = 1))
    ["ArrowDown"; "ArrowUp"; "Home"; "End"; "Enter"];
  let item index =
    let attrs = Hashtbl.create 4 in
    let base = Ui_dom_native.el_of (Js.Json.JObject []) in
    { base with Ui_services.attr = (Hashtbl.find_opt attrs);
      set_attr = Hashtbl.replace attrs; rm_attr = Hashtbl.remove attrs;
      focus = (fun () -> focused := index);
      scroll_into_view_nearest = (fun () -> ());
      click = (fun () -> incr clicked) } in
  let items = [item 0; item 1] in
  item_nodes := List.mapi (fun index node -> "cm-item-" ^ string_of_int index, node) items;
  let base = Ui_dom_native.el_of (Js.Json.JObject []) in
  let menu = {base with Ui_services.rect = (fun () -> 0.,0.,100.,80.);
    query_all = (fun _ -> items)} in
  menu_node := Some menu;
  List.iter (fun (key,index) ->
    expect "Menu navigation was not consumed" (Popups_view.menu_keydown context (event (Some key)));
    expect "Menu navigation selected the wrong item" (!focused = index))
    ["ArrowDown",0; "ArrowUp",1; "Home",0; "End",1];
  expect "Enter did not activate the highlighted menu item"
    (Popups_view.menu_keydown context (event (Some "Enter")) && !clicked = 1);
  menu_node := Some {menu with Ui_services.rect = (fun () -> 0.,0.,0.,0.)};
  expect "A hidden menu consumed navigation"
    (not (Popups_view.menu_keydown context (event (Some "ArrowDown"))));
  menu_node := Some {menu with Ui_services.query_all = (fun _ -> [])};
  Signal.set context.vs {ac=None;cm=Some {cm with entries=[]};pv=None};
  Signal.stabilize scheduler;
  expect "An empty menu consumed navigation"
    (not (Popups_view.menu_keydown context (event (Some "ArrowDown"))));
  let nodes = List.init 2048 (fun _ -> Js.Json.JObject
    ["className",Js.Json.JString "ls-block"]) in
  Dom_ext.doc_elements_provider := (fun () -> nodes);
  let ev = event (Some "a") in
  ignore (Popups_view.menu_keydown context ev);
  queries := 0;
  Gc.full_major ();
  let before = Gc.allocated_bytes () in
  for _ = 1 to 200 do ignore (Popups_view.menu_keydown context ev) done;
  let allocated = Gc.allocated_bytes () -. before in
  Printf.printf "ordinary menu input: %.0f bytes for 200 keys, %d document queries\n%!"
    allocated !queries;
  expect "Ordinary typing allocates menu snapshots" (allocated < 65_536. && !queries = 0);
  Dom_ext.doc_elements_provider := (fun () -> []);
  Popups_state.active := previous_context;
  List.iter prerr_endline (List.rev !failures);
  check "Menu keyboard dispatch and allocation" (!failures = []);
  print_endline "native menu keyboard dispatch: OK")

(* Window notifications must reach the shared sidebar observer on the UI entry. *)
let () =
  let failures = ref [] in
  let expect message condition = if not condition then failures := message :: !failures in
  let previous_app = !Native_embed.current_app
  and previous_flush = !Runtime.app_flush
  and previous_read = !Runtime.read_model
  and previous_sidebar = !Sidebar_state.st_ref
  and previous_model = !Sidebar_state.model_signal
  and previous_width = Host.inner_width ()
  and previous_height = Host.inner_height () in
  let listeners = Hashtbl.copy Platform.window_listeners in
  let mounted = ref None in
  Fun.protect ~finally:(fun () ->
    Native_embed.with_entry_lock (fun () ->
      Option.iter (fun app -> ignore (Lui_app.dispose app)) !mounted;
      Native_embed.current_app := previous_app;
      Runtime.app_flush := previous_flush;
      Runtime.read_model := previous_read;
      Sidebar_state.st_ref := previous_sidebar;
      Sidebar_state.model_signal := previous_model;
      Host.set_window_size previous_width previous_height;
      Hashtbl.clear Platform.window_listeners;
      Hashtbl.iter (Hashtbl.replace Platform.window_listeners) listeners)) (fun () ->
    let sidebar = ref None and observed = ref [] in
    Native_embed.with_entry_lock (fun () ->
      Host.drain ();
      Host.set_window_size 1440. 900.;
      Sidebar_state.st_ref := None;
      Sidebar_state.model_signal := None;
      let backend = Lui_protocol.{backend_profile=generic_profile (); apply_batch=(fun _ -> true)} in
      let app = Lui_app.create backend Model.initial Update.apply
        (fun _ ms _ ->
          sidebar := Some (Sidebar_state.ensure ms);
          Lui_elements.column []) in
      mounted := Some app;
      Native_embed.current_app := Some app;
      Runtime.app_flush := (fun () -> ignore (Lui_app.flush app));
      Runtime.read_model := (fun () -> Lui_app.model app);
      ignore (Lui_app.start app);
      ignore (Lui_app.flush app);
      Ui_services.dom_on_window_event "resize" (fun _ ->
        Native_embed.assert_entry_owner ();
        observed := (Ui_services.dom_viewport_width (), Ui_services.dom_viewport_height ()) :: !observed));
    let st = Option.get !sidebar in
    let resize width height =
      Native_embed.platform_event
        (Printf.sprintf "window-size\n{\"width\":%g,\"height\":%g}" width height) in
    let pump () = ignore (Native_embed.pump ()) in
    List.iter (fun right_open ->
      let app = Option.get !mounted in
      Native_embed.with_entry_lock (fun () ->
        if (Lui_app.model app).Model.right_sidebar_open <> right_open then
          ignore (Lui_app.send app Action.Toggle_right_sidebar);
        Runtime.signal_set st.right_fraction 0.3;
        Runtime.signal_set st.left_width 288.);
      let initial = Signal.get (Signal.value st.left_width) in
      List.iter (fun (width,height) ->
        let count = List.length !observed in
        resize width height;
        expect "Native resize ran an observer outside the application pump"
          (List.length !observed = count);
        pump ();
        expect "Native resize did not deliver the updated viewport to observers"
          (List.length !observed = count + 1 && List.hd !observed = (width,height));
        expect "Native resize left the shared sidebar viewport stale"
          (Signal.get (Signal.value st.viewport_w) = width);
        expect "Native window resizing changed the left sidebar pixel width"
          (abs_float (Signal.get (Signal.value st.left_width) -. initial) < 0.0001))
        [1000.,700.; 1600.,1000.; 1600.,800.; 1600.,800.; 1440.,900.])
      [false;true];
    observed := [];
    List.iter (fun (w,h) -> resize w h) [1200.,800.; 1000.,700.; 1440.,900.];
    pump ();
    expect "Queued native resizes lost their viewport ordering"
      (List.rev !observed = [1200.,800.; 1000.,700.; 1440.,900.]);
    expect "A native resize burst drifted the sidebar width"
      (abs_float (Signal.get (Signal.value st.left_width) -. 288.) < 0.0001));
  List.iter prerr_endline (List.rev !failures);
  check "Native window resize delivery and shared sidebar geometry" (!failures = []);
  print_endline "native window resize delivery and shared sidebar geometry: OK"

let () =
  let previous = !Host.host_op and requests = Queue.create () in
  let drain () = Native_embed.with_entry_lock Host.drain in
  Fun.protect ~finally:(fun () -> Host.host_op := previous) (fun () ->
    Host.set_host_op (fun name payload -> Queue.add (name,payload) requests);
    let seen = ref [] in
    let write text = Native_embed.with_entry_lock (fun () ->
      let task = Ui_services.clipboard_write_text text in
      ignore (Ui_task.catch
        (Ui_task.bind task (fun () -> seen := (text,Ok ()) :: !seen; Ui_task.resolve ()))
        (fun error -> seen := (text,Error error) :: !seen; Ui_task.resolve ()));
      task) in
    let first = write "first" and second = write "second" in
    drain ();
    check "Native clipboard enqueue must not acknowledge OS ownership" (!seen = []);
    let request () =
      let name,payload = Queue.take requests in
      check "Task writes must use the identity-bearing operation" (name="clipboard-write");
      Yojson.Safe.Util.(Yojson.Safe.from_string payload |> member "request-id" |> to_string) in
    let older = request () and newer = request () in
    let reply id fields =
      Native_embed.platform_event ("clipboard-write-result\n" ^ Yojson.Safe.to_string
        (`Assoc (("request-id",`String id)::fields)));
      drain () in
    reply newer ["ok",`Bool false;"error",`String "ownership refused"];
    check "A failed write must reject only its own task"
      (match !seen with
       | ["second",Error (Failure _)] -> true
       | _ -> false);
    reply older ["ok",`Bool true];
    check "A successful ACK must complete the matching older write"
      (match !seen with
       | ["first",Ok ();"second",Error (Failure _)] -> true
       | _ -> false);
    reply older ["ok",`Bool true];
    check "Duplicate terminals must not redeliver completion" (List.length !seen=2);
    List.iter (fun body ->
      let rejected = try Native_embed.platform_event ("clipboard-write-result\n" ^ body); false
        with Invalid_argument _ | Yojson.Json_error _ -> true in
      check "Malformed clipboard result must fail fast" rejected)
      ["{"; "[]"; "{}";
       Printf.sprintf {|{"request-id":"%s","ok":false}|} older;
       Printf.sprintf {|{"request-id":"%s","ok":true,"error":"unexpected"}|} older;
       Printf.sprintf {|{"request-id":"%s","ok":true,"ok":true}|} older;
       Printf.sprintf {|{"request-id":"0%s","ok":true}|} older;
       {|{"request-id":"999999999","ok":true}|}];
    ignore first; ignore second;
    let cancelled = write "cancelled" in
    let id = request () in
    Native_embed.with_entry_lock (fun () -> Ui_task.cancel cancelled); drain ();
    reply id ["ok",`Bool true];
    check "A late ACK must not revive cancellation"
      (match !seen with ("cancelled",Error Ui_task.Cancelled)::_ -> List.length !seen=3 | _ -> false);
    ignore (write "disposed");
    let id = request () in
    ignore (Native_embed.dispose ()); drain ();
    reply id ["ok",`Bool true];
    check "Disposal must reject pending writes rather than deliver late success"
      (match !seen with ("disposed",Error Ui_task.Cancelled)::_ -> List.length !seen=4 | _ -> false));
  print_endline "native clipboard identity and terminal lifecycle: OK"

let () = Native_embed.with_entry_lock (fun () ->
  let module S = Editor_state in
  let module A = Editor_actions in
  let previous_host = !Host.host_op and previous_state = !S.st
  and previous_frame = !S.active_frame and previous_generation = !Runtime.load_gen in
  let requests = Queue.create () in
  Fun.protect ~finally:(fun () ->
    Outliner_ops.cancel_pending_save ();
    Host.host_op := previous_host; S.st := previous_state;
    S.active_frame := previous_frame; Runtime.load_gen := previous_generation)
    (fun () ->
      Host.set_host_op (fun name payload -> Queue.add (name,payload) requests);
      List.iter (fun scenario ->
        let scheduler = Signal.scheduler () in
        let editing () =
          let e = S.mk_editing ~uuid:"clipboard-block" ~buffer:"alpha"
              ~scope:"main" ~base:"alpha" () in
          S.with_model e (Edit_model.select e.S.model ~anchor:1 ~focus:3) in
        S.st := Some (Signal.state scheduler {S.initial with editing = Some (editing ())});
        S.active_frame := Some (Signal.state scheduler Edit_input.empty_frame);
        let outcome = ref None in
        let task = A.cut_editing_text "clipboard-block" in
        ignore (Ui_task.catch
          (Ui_task.bind task (fun () -> outcome := Some (Ok ()); Ui_task.resolve ()))
          (fun error -> outcome := Some (Error error); Ui_task.resolve ()));
        Host.drain ();
        check (scenario ^ ": cut deleted before ownership ACK")
          (A.live_buffer "clipboard-block" = "alpha" && !outcome = None);
        let name,payload = Queue.take requests in
        check "Cut bypassed the shared clipboard task" (name = "clipboard-write");
        let id = Yojson.Safe.Util.(Yojson.Safe.from_string payload |> member "request-id" |> to_string) in
        let change f = S.set_silent (fun st ->
          {st with S.editing = Option.map f st.S.editing}) in
        (match scenario with
         | "source-ABA" ->
             change (fun e -> S.with_model e (Edit_model.set_source e.S.model "other"));
             change (fun e -> S.with_model e (Edit_model.set_source e.S.model "alpha"))
         | "selection-ABA" ->
             change (fun e -> S.with_model e (Edit_model.select e.S.model ~anchor:0 ~focus:0));
             change (fun e -> S.with_model e (Edit_model.select e.S.model ~anchor:1 ~focus:3))
         | "owner-ABA" -> S.set_silent (fun st -> {st with S.editing = Some (editing ())})
         | "mount-ABA" -> S.active_frame := Some (Signal.state scheduler Edit_input.empty_frame)
         | "route-generation-ABA" -> Runtime.load_gen := !Runtime.load_gen + 2
         | "dispose" -> A.cancel_clipboard_actions ()
         | "cancel" -> Ui_task.cancel task
         | "success" | "failure" -> ()
         | _ -> assert false);
        let fields = if scenario = "failure" then
          ["ok",`Bool false; "error",`String "ownership refused"] else ["ok",`Bool true] in
        Native_embed.platform_event ("clipboard-write-result\n" ^ Yojson.Safe.to_string
          (`Assoc (("request-id",`String id)::fields)));
        Host.drain ();
        check (scenario ^ ": cut mutated a stale or failed source")
          (A.live_buffer "clipboard-block" = (if scenario = "success" then "aha" else "alpha"));
        check (scenario ^ ": cut terminal outcome is incorrect")
          (match scenario, !outcome with
           | "success",Some (Ok ()) -> true
           | "failure",Some (Error (Failure _)) -> true
           | ("source-ABA" | "selection-ABA" | "owner-ABA" | "mount-ABA"
             | "route-generation-ABA" | "dispose" | "cancel"),
             Some (Error Ui_task.Cancelled) -> true
           | _ -> false);
        Outliner_ops.cancel_pending_save ())
        ["success"; "failure"; "source-ABA"; "selection-ABA"; "owner-ABA";
         "mount-ABA"; "route-generation-ABA"; "dispose"; "cancel"]);
  print_endline "native deferred cut source and owner freshness: OK")
