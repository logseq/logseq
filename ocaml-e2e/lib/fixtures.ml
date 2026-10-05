(** Test fixtures, mirroring clj-e2e's [fixtures.clj]. Each [.ml] test file is
    emitted as its own module run by [node --test] in a fresh process, so
    "once" state is a lazily-opened shared env per file. *)

open Fest.Promise

let first_load_timeout_ms = 60000.

external after : (unit -> unit Js.Promise.t) -> unit = "after"
[@@mel.module "node:test"]

let test_url ?(port = Config.port) () =
  Printf.sprintf "http://localhost:%d?rtc-test=true" port

let open_app env ~port =
  let* _ = Pw.navigate env (test_url ~port ()) in
  Pw.wait_for env ~timeout:first_load_timeout_ms "#search-button"

let setup_page_env ~env ~port =
  let page = Env.page env in
  Playwright.set_default_timeout page 30000.;
  let context = Playwright.page_context page in
  let* () = Settings.install_init_script context in
  let* () =
    Playwright.grant_permissions context
      [| "clipboard-write"; "clipboard-read" |]
  in
  Pw.on_console env (Env.record_console env);
  let* () = open_app env ~port in
  let* _ = Settings.developer_mode env in
  Settings.refresh_test_env env

(** wally's [make-page {:persistent false}]: [chromium.launch] then
    [browser.newPage]. Returns [(env, browser)]; closing the browser at the
    end is the caller's job. *)
let make_page ?(headless = Config.headless) ?(slow_mo = Config.slow_mo) ?(port = Config.port) () =
  let* browser = Playwright.launch ~headless ~slow_mo Playwright.chromium in
  let* page = Playwright.browser_new_page browser in
  let env = Env.make page in
  let* _ = setup_page_env ~env ~port in
  Js.Promise.resolve (env, browser)

(** wally's [with-page-open] around [make-page]: runs [f env], always closes
    the browser afterwards. *)
let with_page_open ?headless ?slow_mo ?port f =
  let* env, browser = make_page ?headless ?slow_mo ?port () in
  f env
  |> Js.Promise.then_ (fun r ->
         Js.Promise.then_
           (fun () -> Js.Promise.resolve r)
           (Playwright.browser_close browser))
  |> Js.Promise.catch (fun e ->
         Js.Promise.then_
           (fun () -> Playwright.throw_error e)
           (Playwright.browser_close browser))

(* {2 Shared (":once") envs} *)

(** Lazily-opened shared env, closed by a node:test [after] hook the first
    time it is opened. *)
let shared_open_page =
  let cell = ref None in
  fun ?headless ?port () ->
    match !cell with
    | Some p ->
        Js.Promise.then_
          (fun (env, _browser) -> Js.Promise.resolve env)
          p
    | None ->
        let p = make_page ?headless ?port () in
        cell := Some p;
        after (fun () ->
            Js.Promise.then_
              (fun (env, browser) ->
                ignore env;
                Playwright.browser_close browser)
              p);
        Js.Promise.then_
          (fun (env, _browser) -> Js.Promise.resolve env)
          p

let shared_2_pages =
  let cell = ref None in
  fun ?headless ?port () ->
    match !cell with
    | Some p ->
        Js.Promise.then_
          (fun (e1, e2, _) -> Js.Promise.resolve (e1, e2))
          p
    | None ->
        let p =
          let* e1, b1 = make_page ?headless ?port () in
          let* e2, b2 = make_page ?headless ?port () in
          Js.Promise.resolve (e1, e2, [ b1; b2 ])
        in
        cell := Some p;
        after (fun () ->
            Js.Promise.then_
              (fun (_, _, browsers) ->
                Js.Promise.then_
                  (fun _ -> Js.Promise.resolve ())
                  (Js.Promise.all
                     (Array.of_list
                        (List.map Playwright.browser_close browsers))))
              p);
        Js.Promise.then_
          (fun (e1, e2, _) -> Js.Promise.resolve (e1, e2)) p

(** [open_new_context]: one shared browser with a fresh [BrowserContext]
    that tests fill with N tab pages. Returns [(context, browser)] — closing
    the browser at the end is the caller's job. *)
let open_new_context ?headless ?slow_mo ?port () =
  let* env, browser = make_page ?headless ?slow_mo ?port () in
  let page = Env.page env in
  let context = Playwright.page_context page in
  let browser_obj = Playwright.context_browser context in
  let* new_ctx = Playwright.context_new_context browser_obj in
  let* () = Playwright.context_close context in
  let* () = Settings.install_init_script new_ctx in
  ignore env;
  Js.Promise.resolve (new_ctx, browser)

(** Lazily-created shared context, browser closed by an [after] hook. *)
let shared_new_context =
  let cell = ref None in
  fun ?headless ?slow_mo ?port () ->
    match !cell with
    | Some p -> p
    | None ->
        let p = open_new_context ?headless ?slow_mo ?port () in
        cell := Some p;
        after (fun () ->
            Js.Promise.then_
              (fun (_ctx, browser) -> Playwright.browser_close browser)
              p);
        p

(** pw-page/open-pages: newPage + navigate + graph-loaded wait per tab.
    Pages in one context share cookies/storage. When [env] is given, each
    tab's console messages are recorded into it. *)
let context_open_page ?env ?(port = Config.port) context =
  let* page = Playwright.new_page context in
  Playwright.set_default_timeout page 30000.;
  (match env with
   | Some env -> Playwright.on_console page (Env.record_console env)
   | None -> ());
  let* _ = Playwright.goto page ~wait_until:"commit" (test_url ~port ()) in
  Playwright.wait_for_selector page ~timeout:first_load_timeout_ms
    "[data-testid='page title']"
  |> Js.Promise.then_ (fun _ -> Js.Promise.resolve page)

let context_pages context = Playwright.context_pages context

(* {2 Per-test (":each") fixtures} *)

(** pw-page/open-pages for N tabs at once. *)
let open_pages ?env ?port context n =
  let rec go i acc =
    if i >= n then Js.Promise.resolve (List.rev acc)
    else
      let* page = context_open_page ?env ?port context in
      go (i + 1) (page :: acc)
  in
  go 0 []

let create_page ?name env =
  let page_name =
    match name with Some n -> n | None -> Const.next_page_name ()
  in
  let* () = Ls_page.new_page env page_name in
  Js.Promise.resolve page_name

let new_logseq_page env =
  let* right_open = Pw.visible env ".cp__right-sidebar.open" in
  let* () =
    if right_open then
      let* () = Pw.click env ".toggle-right-sidebar" in
      Pw.wait_for_hidden env ".cp__right-sidebar.open"
    else Js.Promise.resolve ()
  in
  let* () =
    Pw.eval_js env
      "(() => { const url = new URL(location.href); \
       url.searchParams.delete('virtualized'); \
       history.replaceState(null, '', url.pathname + url.search + url.hash); })()"
  in
  let* _ = create_page env in
  Js.Promise.resolve ()

let validate_graph env =
  let* _ = Graph.validate_graph env in
  Js.Promise.resolve ()

(** Runs [body env], then always validates the graph — clj's
    [fixtures/validate-graph] :each wrapper. *)
let with_validate_graph env body =
  body () |> Js.Promise.then_ (fun () -> validate_graph env)

(* {2 RTC fixtures} *)

let inst_string () =
  (* yyyy-MM-dd'T'HH-mm-ss in UTC *)
  let d = Js.Date.make () in
  Printf.sprintf "%04d-%02d-%02dT%02d-%02d-%02d"
    (int_of_float (Js.Date.getUTCFullYear d))
    (int_of_float (Js.Date.getUTCMonth d) + 1)
    (int_of_float (Js.Date.getUTCDate d))
    (int_of_float (Js.Date.getUTCHours d))
    (int_of_float (Js.Date.getUTCMinutes d))
    (int_of_float (Js.Date.getUTCSeconds d))

let new_logseq_page_in_rtc env page1 page2 ?name () =
  let page_name = ref "" in
  let* _tx =
    Env.with_page env page1 (fun () ->
        Rtc.with_wait_tx_updated env (fun () ->
            let* name = create_page ?name env in
            page_name := name;
            Js.Promise.resolve ()))
  in
  Env.with_page env page2 (fun () ->
      let tx =
        match _tx.Rtc.remote_tx with Some t -> t | None -> 0
      in
      let* _ = Rtc.wait_tx_update_to env tx in
      Ls_page.goto_page env !page_name)

(** opens 2 app instances, creates an rtc graph on page1 and waits for it on
    page2, then runs [f graph_name] and removes the remote graph. *)
let prepare_rtc_graph_fixture env page1 page2 graph_name_prefix f =
  let graph_name = graph_name_prefix ^ "-" ^ inst_string () in
  let* _ =
    Js.Promise.all2
      ( Env.with_page env page1 (fun () ->
            let* _ = Settings.developer_mode env in
            let* _ = Settings.refresh_test_env env in
            Util.login_test_account env)
      , Env.with_page env page2 (fun () ->
            let* _ = Settings.developer_mode env in
            let* _ = Settings.refresh_test_env env in
            Util.login_test_account env) )
  in
  let* () =
    Env.with_page env page1 (fun () ->
        Graph.new_graph env graph_name ~enable_sync:true ~graph_e2ee:false ())
  in
  let* () =
    Env.with_page env page2 (fun () ->
        let* () = Graph.wait_for_remote_graph env graph_name in
        let* _ =
          Graph.switch_graph env graph_name ~wait_sync:true
            ~need_input_password:true
        in
        Js.Promise.resolve ())
  in
  f graph_name
  |> Js.Promise.then_ (fun r ->
         Js.Promise.then_
           (fun () -> Js.Promise.resolve r)
           (Env.with_page env page2 (fun () ->
                Graph.remove_remote_graph env graph_name)))
  |> Js.Promise.catch (fun e ->
         Js.Promise.then_
           (fun () -> Playwright.throw_error e)
           (Env.with_page env page2 (fun () ->
                Graph.remove_remote_graph env graph_name)))
