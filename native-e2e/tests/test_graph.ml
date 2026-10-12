module Poll = E2ee_password_poll.Make (struct
  type 'a t = 'a
  let return value = value
  let bind value f = f value
end)

let tests =
  [ Suite.test ~contract:Suite.Helper
      ~covers:["ocaml-e2e/test/test_graph.ml::maybe-input-e2ee-password-skips-when-cloud-ready-test"]
      "maybe-input-e2ee-password-skips-when-cloud-ready-test" (fun ctx ->
        let waits = ref 0 and inputs = ref 0 in
        Poll.run
          ~visible:(fun selector -> selector = E2ee_password_poll.cloud_ready_selector)
          ~wait_timeout:(fun _ -> incr waits)
          ~input_password:(fun () -> incr inputs) ();
        Suite.equal ctx "Sustained ready waits for the modal grace period" !waits 8;
        Suite.equal ctx "No password entry after sustained ready" !inputs 0)
  ; Suite.test ~contract:Suite.Helper
      ~covers:["ocaml-e2e/test/test_graph.ml::maybe-input-e2ee-password-inputs-when-modal-appears-test"]
      "maybe-input-e2ee-password-inputs-when-modal-appears-test" (fun ctx ->
        let ticks = ref 0 and inputs = ref 0 in
        Poll.run
          ~visible:(fun selector ->
            selector = E2ee_password_poll.modal_selector && !ticks >= 2)
          ~wait_timeout:(fun _ -> incr ticks)
          ~input_password:(fun () -> incr inputs) ();
        Suite.equal ctx "Late password prompt waits two ticks" !ticks 2;
        Suite.equal ctx "Late password prompt triggers one input" !inputs 1)
  ; Suite.test ~contract:Suite.Helper
      ~covers:["ocaml-e2e/test/test_graph.ml::maybe-input-e2ee-password-does-not-exit-on-stale-cloud-ready-test"]
      "maybe-input-e2ee-password-does-not-exit-on-stale-cloud-ready-test" (fun ctx ->
        let ticks = ref 0 and inputs = ref 0 in
        Poll.run
          ~visible:(fun selector ->
            selector = E2ee_password_poll.cloud_ready_selector
            || (selector = E2ee_password_poll.modal_selector && !ticks >= 2))
          ~wait_timeout:(fun _ -> incr ticks)
          ~input_password:(fun () -> incr inputs) ();
        Suite.equal ctx "Stale ready still waits for late modal" !ticks 2;
        Suite.equal ctx "Stale ready cannot bypass password input" !inputs 1)
  ]
