type timer = Native_test_hooks.timer_handle

let real_set_timeout (ms : int) (f : unit -> unit) : timer =
  let t = { Native_test_hooks.cancelled = false } in
  ignore
    (Thread.create
       (fun () ->
          let deadline = Unix.gettimeofday () +. (float_of_int ms /. 1000.0) in
          let rec loop () =
            if t.cancelled then ()
            else
              let remaining = deadline -. Unix.gettimeofday () in
              if remaining <= 0.0 then f ()
              else (Thread.delay (min remaining 0.05); loop ())
          in
          loop ())
       ());
  t

let real_set_interval (ms : int) (f : unit -> unit) : timer =
  let t = { Native_test_hooks.cancelled = false } in
  ignore
    (Thread.create
       (fun () ->
          let rec loop () =
            if t.cancelled then ()
            else
              ( Thread.delay (float_of_int ms /. 1000.0);
                if t.cancelled then () else (f (); loop ()) )
          in
          loop ())
       ());
  t

let set_timeout_impl = ref real_set_timeout
let set_interval_impl = ref real_set_interval

let set_timeout ms f = !set_timeout_impl ms f
let set_interval ms f = !set_interval_impl ms f

let clear (t : timer) = t.Native_test_hooks.cancelled <- true

let () =
  Native_test_hooks.install_timers_fn := (fun t i ->
      set_timeout_impl := t; set_interval_impl := i);
  Native_test_hooks.restore_timers_fn := (fun () ->
      set_timeout_impl := real_set_timeout;
      set_interval_impl := real_set_interval)
