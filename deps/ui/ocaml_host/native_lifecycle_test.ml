let check message condition = if not condition then failwith message

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
