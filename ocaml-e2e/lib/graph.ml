(** Graph management helpers, mirroring clj-e2e's [graph.clj]. *)

open Fest.Promise

let refresh_all_remote_graphs env =
  let enabled_refresh = "button:not([disabled]):has-text(\"Refresh\")" in
  let* () = Pw.wait_for env ~timeout:30000. enabled_refresh in
  Pw.click_l ~timeout:30000. (Pw.q env enabled_refresh)

let goto_all_graphs env = Util.search_and_click env "Go to all graphs"

let e2ee_password_modal = ".e2ee-password-modal-content"

let e2ee_new_password_input =
  e2ee_password_modal ^ " input[placeholder=\"Enter password\"]"

let e2ee_new_password_confirm_input =
  e2ee_password_modal ^ " input[placeholder=\"Enter password again\"]"

let e2ee_password_input =
  e2ee_password_modal ^ " .ls-toggle-password-input input"

let e2ee_password_submit = e2ee_password_modal ^ " button:text(\"Submit\")"
let cloud_ready_indicator = "button.cloud.on.idle"
let new_graph_dialog = ".new-graph"
let new_graph_submit = new_graph_dialog ^ " button:not([disabled]):text(\"Submit\")"
let rtc_sync_toggle = "button#rtc-sync"
let rtc_graph_e2ee_toggle = "button#rtc-graph-e2ee"
let e2ee_password_poll_ms = 250.
let e2ee_password_prompt_grace_ms = 2000.

let input_e2ee_password env =
  let* confirm = Pw.visible env e2ee_new_password_confirm_input in
  let* () =
    if confirm then
      let* () = Pw.click env e2ee_new_password_input in
      let* () = Util.input env "e2etest" in
      let* () = Pw.click env e2ee_new_password_confirm_input in
      Util.input env "e2etest"
    else
      let* () = Pw.click_l (Playwright.locator_first (Pw.q env e2ee_password_input)) in
      Util.input env "e2etest"
  in
  let* () = Pw.click env e2ee_password_submit in
  Pw.wait_for_hidden env e2ee_password_modal

(** Password prompt is optional for accounts whose keys are already
    initialized. Cloud-ready may still be visible from the previous graph
    right after submit, so require it to stay visible briefly before treating
    it as the terminal state.  Dependencies are injectable so the pure state
    machine can be unit-tested (mirroring graph-test.clj's with-redefs). *)
let maybe_input_e2ee_password_gen ~visible ~wait_timeout ~input_password () =
  let rec loop remaining_ms cloud_ready_ms =
    let* modal = visible e2ee_password_modal in
    if modal then input_password ()
    else
      let* cloud_ready = visible cloud_ready_indicator in
      if cloud_ready_ms >= e2ee_password_prompt_grace_ms && cloud_ready then
        Js.Promise.resolve ()
      else if remaining_ms <= 0. then Js.Promise.resolve ()
      else
        let* () = wait_timeout e2ee_password_poll_ms in
        loop
          (remaining_ms -. e2ee_password_poll_ms)
          (if cloud_ready then cloud_ready_ms +. e2ee_password_poll_ms
           else 0.)
  in
  loop 20000. 0.

let maybe_input_e2ee_password env =
  maybe_input_e2ee_password_gen
    ~visible:(Pw.visible env)
    ~wait_timeout:(Util.wait_timeout env)
    ~input_password:(fun () -> input_e2ee_password env)
    ()

let cloud_idle_dump env =
  let* dump =
    Pw.eval_js env
      "(() => JSON.stringify({rtc: logseq.api.get_state_from_store('rtc/state'), log: logseq.api.get_state_from_store('rtc/log'), user: logseq.api.get_state_from_store('user/info'), loginUser: logseq.api.get_state_from_store('auth/current-login-user'), btn: document.querySelector('button.cloud') ? document.querySelector('button.cloud').className : 'none', url: location.hash, dialogs: [...document.querySelectorAll('.ui__dialog, [role=dialog], [data-radix-popper-content-wrapper]')].map(d => (d.className || '') + ' :: ' + d.innerText.replace(/\\s+/g, ' ').slice(0, 200)), inputs: [...document.querySelectorAll('.ui__dialog input, [role=dialog] input')].map(i => i.placeholder || i.type), rtcToggle: document.querySelector('button#rtc-sync') ? document.querySelector('button#rtc-sync').outerHTML.slice(0, 200) : 'absent', toasts: [...document.querySelectorAll('.ui__toast')].map(t => t.textContent.slice(0,200))}))()"
  in
  let* () = Js.Promise.resolve (Js.log2 "cloud-idle-timeout" dump) in
  Env.console_logs env |> List.rev
  |> (fun l ->
      let rec take n = function [] -> [] | x :: tl -> if n <= 0 then [] else x :: take (n - 1) tl in
      take 50 l)
  |> List.iter (fun m -> Js.log ("[cloud-idle-console] " ^ m));
  Js.Promise.resolve ()

let new_graph_helper env graph_name ~enable_sync ~graph_e2ee =
  let* () = Util.search_and_click env "Add a DB graph" in
  let* () = Pw.wait_for env "h2:text(\"Create a new graph\")" in
  let* () = Pw.click env "input[placeholder=\"your graph name\"]" in
  let* () = Util.input env graph_name in
  let* () =
    if enable_sync then
      let* () = Pw.wait_for env ~timeout:3000. rtc_sync_toggle in
      (* verify the toggle actually flipped — under parallel load the
         first click can land while the control is still settling and
         the graph is silently created local (cloud button never
         mounts; rtc/state stays {}). Switches expose aria-checked. *)
      let rec toggle_until_on tries =
        let* (on : bool) =
          Pw.eval_js env
            "(() => document.querySelector('button#rtc-sync')?.getAttribute('aria-checked') === 'true' || document.querySelector('button#rtc-sync')?.dataset?.state === 'checked')()"
        in
        if on then Js.Promise.resolve ()
        else if tries <= 0 then
          Js.Promise.reject
            (Failure "rtc-sync toggle did not switch on after retries")
        else
          let* () = Pw.click env rtc_sync_toggle in
          let* () = Util.wait_timeout env 300. in
          toggle_until_on (tries - 1)
      in
      let* () = toggle_until_on 4 in
      if not graph_e2ee then
        let* () = Pw.wait_for env ~timeout:3000. rtc_graph_e2ee_toggle in
        Pw.click env rtc_graph_e2ee_toggle
      else Js.Promise.resolve ()
    else Js.Promise.resolve ()
  in
  let* () = Pw.click env new_graph_submit in
  let* () =
    if enable_sync then
      let* () = maybe_input_e2ee_password env in
      (* the cloud button mounts as soon as the rtc indicator becomes
         visible (repo registered + logged in); if it never mounts the
         graph was created local — dump state instead of burning the
         whole idle wait *)
      let* () =
        Pw.wait_for env ~timeout:120000. "button.cloud"
        |> Js.Promise.catch (fun e ->
            let* () = cloud_idle_dump env in
            Playwright.throw_error e)
      in
      Pw.wait_for env ~timeout:300000. cloud_ready_indicator
      |> Js.Promise.catch (fun e ->
          let* () = cloud_idle_dump env in
          Playwright.throw_error e)
    else Js.Promise.resolve ()
  in
  let* () = Pw.wait_for_hidden env ~timeout:30000. new_graph_dialog in
  E2e_assert.graph_loaded env

let new_graph env graph_name ~enable_sync ?(graph_e2ee = true) () =
  let* _ = new_graph_helper env graph_name ~enable_sync ~graph_e2ee in
  Js.Promise.resolve ()

let wait_for_remote_graph env graph_name =
  let* () = goto_all_graphs env in
  let target =
    Pw.q env (Printf.sprintf "div[data-testid='logseq_db_%s']" graph_name)
  in
  Util.repeat_until_visible env 5 target (fun () ->
      refresh_all_remote_graphs env)

let remove_graph env ~menu_item graph_name =
  let* () = wait_for_remote_graph env graph_name in
  let action_btn =
    Playwright.locator_first
      (Pw.q env
         (Printf.sprintf "div[data-testid='logseq_db_%s'] .graph-action-btn"
            graph_name))
  in
  let* () = Pw.click_l action_btn in
  let* () = Pw.click env menu_item in
  Pw.click env "div[role='alertdialog'] button:text('Confirm')"

let remove_local_graph env graph_name =
  remove_graph env ~menu_item:".delete-local-graph-menu-item" graph_name

let remove_remote_graph env graph_name =
  remove_graph env ~menu_item:".delete-remote-graph-menu-item" graph_name

let switch_graph env to_graph_name ~wait_sync ~need_input_password =
  (* clicking the graph row can hit a stale element while the all-graphs
     list re-renders — verify the app actually navigated away from #/ and
     retry the click, instead of waiting on a page that never loads *)
  let rec click_until_navigated tries =
    let* () = goto_all_graphs env in
    let* () =
      Pw.click_l
        (Playwright.locator_last
           (Pw.q env
              (Printf.sprintf
                 "div[data-testid='logseq_db_%s'] span:has-text('%s')"
                 to_graph_name to_graph_name)))
    in
    let deadline = Js.Date.now () +. 15000. in
    let rec poll () =
      let* hash =
        Pw.eval_js env "(() => location.hash)()"
        |> Js.Promise.then_ (fun h ->
               Js.Promise.resolve
                 (match Js.Json.decodeString h with
                  | Some s -> s
                  | None -> ""))
      in
      if hash <> "#/" && hash <> "" then Js.Promise.resolve true
      else if Js.Date.now () > deadline then Js.Promise.resolve false
      else
        let* () = Pw.wait_timeout env 250. in
        poll ()
    in
    let* navigated = poll () in
    if navigated then Js.Promise.resolve ()
    else if tries <= 1 then Js.Promise.resolve ()
    else click_until_navigated (tries - 1)
  in
  let* () = click_until_navigated 3 in
  let* () =
    if wait_sync then
      let* () =
        if need_input_password then maybe_input_e2ee_password env
        else Js.Promise.resolve ()
      in
      let* () =
        Pw.wait_for env ~timeout:120000. "button.cloud"
        |> Js.Promise.catch (fun e ->
            let* () = cloud_idle_dump env in
            Playwright.throw_error e)
      in
      Pw.wait_for env ~timeout:300000. cloud_ready_indicator
      |> Js.Promise.catch (fun e ->
          let* () = cloud_idle_dump env in
          Playwright.throw_error e)
    else Js.Promise.resolve ()
  in
  E2e_assert.graph_loaded env

type summary = { valid : bool }

let validate_graph env =
  let success_toast = ".ui__toast:has-text('Your graph is valid')" in
  let attempt () =
    let* () = Keyboard.esc env in
    let* () = Keyboard.esc env in
    let* () = Util.search_and_click env "(Dev) Validate current graph" in
    Pw.catch_timeout
      (Js.Promise.then_ (fun () -> Js.Promise.resolve true)
         (Pw.wait_for env ~timeout:60000. success_toast))
      (fun () ->
        let* toasts =
          Pw.eval_js env
            "(() => [...document.querySelectorAll('.ui__toast')].map(t => t.textContent.slice(0,300)).join('\\n---\\n'))()"
        in
        let* () = Js.Promise.resolve (Js.log2 "[validate-dbg] toasts:" toasts) in
        Js.Promise.resolve false)
  in
  let* ok = attempt () in
  (* the validator auto-fixes invalid blocks and asks for a re-run *)
  let* ok =
    if ok then Js.Promise.resolve true
    else
      let* () =
        Pw.eval_js env
          "(() => document.querySelectorAll('.ui__toast button').forEach(b => b.click()))()"
      in
      attempt ()
  in
  let* () =
    if ok then Js.Promise.resolve ()
    else (
      let* toasts =
        Pw.eval_js env
          "(() => [...document.querySelectorAll('.ui__toast')].map(t => t.textContent.slice(0,400)).join('\\n---\\n'))()"
      in
      let toast_text =
        match Js.Json.decodeString toasts with
        | Some s -> s
        | None -> "<none>"
      in
      Js.log ("[validate-dbg] toasts: " ^ toast_text);
      Env.console_logs env |> List.rev
      |> (fun l -> let rec take n = function [] -> [] | x::tl -> if n<=0 then [] else x :: take (n-1) tl in take 60 l)
      |> List.iter (fun m -> Js.log ("[validate-dbg] " ^ m));
      Js.Promise.reject (Failure "validate_graph: no success toast"))
  in
  let* () =
    Pw.eval_js env
      "(() => document.querySelectorAll('.ui__toast.success button')\
       .forEach((button) => button.click()))()"
  in
  Js.Promise.resolve { valid = true }
