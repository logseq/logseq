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
