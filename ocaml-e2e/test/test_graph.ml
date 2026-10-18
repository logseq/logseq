(** Port of graph_test.clj — pure unit tests of the
    maybe-input-e2ee-password state machine with injected dependencies. *)

open Fest.Promise

let () =
  Fest.Promise.test
    "maybe-input-e2ee-password-skips-when-cloud-ready-test" (fun () ->
    let wait_calls = ref 0 in
    let input_calls = ref 0 in
    let visible q = Js.Promise.resolve (q = "button.cloud.on.idle") in
    let wait_timeout _ms =
      incr wait_calls;
      Js.Promise.resolve ()
    in
    let input_password () =
      incr input_calls;
      Js.Promise.resolve ()
    in
    let* () =
      Graph.maybe_input_e2ee_password_gen ~visible ~wait_timeout
        ~input_password ()
    in
    Fest.equal !wait_calls 8 Fest.expect;
    Fest.equal !input_calls 0 Fest.expect;
    Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "maybe-input-e2ee-password-inputs-when-modal-appears-test" (fun () ->
    let ticks = ref 0 in
    let input_calls = ref 0 in
    let visible q =
      Js.Promise.resolve
        (if q = ".e2ee-password-modal-content" then !ticks >= 2
         else if q = "button.cloud.on.idle" then false
         else false)
    in
    let wait_timeout _ms =
      incr ticks;
      Js.Promise.resolve ()
    in
    let input_password () =
      incr input_calls;
      Js.Promise.resolve ()
    in
    let* () =
      Graph.maybe_input_e2ee_password_gen ~visible ~wait_timeout
        ~input_password ()
    in
    Fest.equal !ticks 2 Fest.expect;
    Fest.equal !input_calls 1 Fest.expect;
    Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "maybe-input-e2ee-password-does-not-exit-on-stale-cloud-ready-test"
    (fun () ->
    let ticks = ref 0 in
    let input_calls = ref 0 in
    let visible q =
      Js.Promise.resolve
        (if q = ".e2ee-password-modal-content" then !ticks >= 2
         else if q = "button.cloud.on.idle" then true
         else false)
    in
    let wait_timeout _ms =
      incr ticks;
      Js.Promise.resolve ()
    in
    let input_password () =
      incr input_calls;
      Js.Promise.resolve ()
    in
    let* () =
      Graph.maybe_input_e2ee_password_gen ~visible ~wait_timeout
        ~input_password ()
    in
    Fest.equal !ticks 2 Fest.expect;
    Fest.equal !input_calls 1 Fest.expect;
    Js.Promise.resolve ())
