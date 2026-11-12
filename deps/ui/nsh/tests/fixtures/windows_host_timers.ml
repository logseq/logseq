(* Real Windows Host initialization and wake-channel behavior; no app, daemon,
   OS window or display frame is started. The external runner owns the timeout. *)
let check label condition = if not condition then failwith label

let () =
  if Sys.os_type <> "Win32" then failwith "This fixture requires native Windows";
  (* Success proves Host initialized socket-backed descriptors rather than
     reaching Windows ioctlsocket on an anonymous pipe HANDLE. *)
  ignore (Unix.getpeername Host.timer_read);
  ignore (Unix.getpeername Host.timer_write);
  let lock = Mutex.create () and changed = Condition.create () in
  let wake_epoch = ref 0 in
  Host.set_wakeup (fun () ->
    Mutex.lock lock;
    incr wake_epoch;
    Condition.signal changed;
    Mutex.unlock lock);
  let rec wait predicate =
    Mutex.lock lock;
    let before = !wake_epoch in
    Mutex.unlock lock;
    Host.drain ();
    if not (predicate ()) then begin
      Mutex.lock lock;
      while !wake_epoch = before do Condition.wait changed lock done;
      Mutex.unlock lock;
      wait predicate
    end
  in
  let fired = ref 0 and cancelled = ref 0 in
  ignore (Host.set_timeout (fun () -> incr fired) 5);
  wait (fun () -> !fired = 1);
  let later = Host.set_timeout (fun () -> incr cancelled) 100000 in
  Host.clear_timeout later;
  let queued = Host.set_timeout (fun () -> incr cancelled) 0 in
  Host.clear_timeout queued;
  for _ = 1 to 512 do Host.notify_timers () done;
  ignore (Host.set_timeout (fun () -> incr fired) 1);
  wait (fun () -> !fired = 2);
  check "cleared delayed/queued timers never execute" (!cancelled = 0);
  let ordinary = ref false in
  Host.enqueue (fun () -> ordinary := true);
  Host.drain ();
  check "ordinary mailbox still drains after nonblocking wake bursts" !ordinary;
  ignore (Host.set_timeout (fun () -> incr fired) 1);
  wait (fun () -> !fired = 3);
  check "timer worker remains live after wake-channel draining" (!cancelled = 0);
  print_endline "PASS native Windows Host socket wake, delayed/zero timers, cancellation and mailbox drain"
