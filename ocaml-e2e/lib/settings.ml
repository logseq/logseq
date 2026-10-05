(** Test-env localStorage setup, mirroring clj-e2e's [settings.clj]. *)

open Fest.Promise

let e2e_init_script =
  "localStorage.setItem('preferred-language', '\"en\"'); \
   localStorage.setItem('developer-mode', '\"true\"');"

let refresh_ready_script =
  "(() => document.documentElement.lang === 'en' \
   && localStorage.getItem('preferred-language') === '\"en\"' \
   && localStorage.getItem('developer-mode') === '\"true\"')()"

let install_init_script context =
  Playwright.add_init_script context e2e_init_script

let wait_test_env_ready env =
  let rec loop remaining =
    let* ready = Pw.eval_js env refresh_ready_script in
    if ready then Js.Promise.resolve true
    else if remaining <= 0 then
      Js.Promise.reject (Failure "test env not ready after refresh")
    else
      let* () = Util.wait_timeout env 250. in
      loop (remaining - 1)
  in
  loop 20

let test_env_ready env =
  Pw.catch_timeout
    (wait_test_env_ready env)
    (fun () -> Js.Promise.resolve false)
  |> Js.Promise.catch (fun _ -> Js.Promise.resolve false)

let refresh_test_env env =
  (* The init script installs the test env before the first navigation, so a
     fresh page is usually already ready — check first and skip the reload. *)
  let* already_ready = test_env_ready env in
  if already_ready then Js.Promise.resolve true
  else
    let rec loop attempt =
      let* () = Pw.refresh env in
      let* _ = E2e_assert.graph_loaded env in
      let* ready = test_env_ready env in
      if ready then Js.Promise.resolve true
      else if attempt < 2 then loop (attempt + 1)
      else wait_test_env_ready env
    in
    loop 0

let developer_mode env =
  let* () = Pw.eval_js env e2e_init_script in
  E2e_assert.in_normal_mode env
