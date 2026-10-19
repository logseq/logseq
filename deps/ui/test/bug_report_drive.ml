open Test_check
module S = Drive.Session
module M = Drive.Model

let hook_host : (string -> unit) -> (string -> unit Js.Promise.t) -> (string -> unit) -> (unit -> unit) =
  [%mel.raw "function (navigate, write, open) {
    const location = globalThis.location, window = globalThis.window, navigator = globalThis.navigator;
    const hash = Object.getOwnPropertyDescriptor(location, 'hash');
    let currentHash = location.hash;
    Object.defineProperty(location, 'hash', {configurable: true, get: () => currentHash,
      set: value => {currentHash = value; navigate(value)}});
    const descriptors = Object.fromEntries(['userAgent', 'language', 'clipboard'].map(key => [key, Object.getOwnPropertyDescriptor(navigator, key)]));
    Object.defineProperties(navigator, {
      userAgent: {configurable: true, value: 'FixtureOS/1.0 (Model); x\\nExtra'},
      language: {configurable: true, value: 'en-US'},
      clipboard: {configurable: true, value: {writeText: write}}
    });
    const originalOpen = window.open, originalTimeout = globalThis.setTimeout, timers = [];
    window.open = open;
    globalThis.setTimeout = (f, ms, ...args) => {const id = originalTimeout(f, ms, ...args); timers.push(id); return id};
    return () => {
      Object.defineProperty(location, 'hash', hash);
      for (const [key, descriptor] of Object.entries(descriptors)) {
        if (descriptor) Object.defineProperty(navigator, key, descriptor); else delete navigator[key];
      }
      window.open = originalOpen; globalThis.setTimeout = originalTimeout;
      timers.forEach(clearTimeout);
    };
  }"]

let run ~finish =
  let previous_send= !Runtime.app_send and previous_flush= !Runtime.app_flush
  and previous_read= !Runtime.read_model in
  let restore_host=ref (fun () -> ()) in
  let fixture=ref None and navigation=ref "" and writes=ref [] and toasts=ref [] in
  let urls=ref [] in
  let pending=ref None and on_toast=ref (fun () -> ()) in
  let session ()=Option.get !fixture in
  let nodes ()=M.all_nodes (session ()).S.tree in
  let has_text value=List.exists (fun n -> M.string_prop n "text"=Some value) (nodes ()) in
  let press key=
    match List.find_opt (fun n -> n.M.kind="button" &&
      M.string_prop n "accessibility-label"=Some (I18n.t key)) (nodes ()) with
    | None -> check ("Bug report action is available: " ^ key) false;false
    | Some button -> S.press (session ()) button.M.id;true in
  let cleanup ()=
    ignore (Lui_app.dispose (session ()).S.app);
    (!restore_host) ();Runtime.app_send:=previous_send;
    Runtime.app_flush:=previous_flush;Runtime.read_model:=previous_read;
    finish () in
  restore_host:=hook_host
    (fun hash -> navigation:=hash;
      let route=Router.parse_hash () in
      ignore (Lui_app.send (session ()).S.app (fun model -> {model with Model.route}));
      S.flush (session ()))
    (fun value ->
      writes:=value::!writes;
      let resolve_ref=ref (fun () -> ()) and reject_ref=ref (fun _ -> ()) in
      let promise=Js.Promise.make (fun ~resolve ~reject ->
        resolve_ref:=(fun () -> let value=() in resolve value [@u]);
        reject_ref:=(fun error -> reject error [@u])) in
      pending:=Some (promise,!resolve_ref,!reject_ref);promise)
    (fun url -> urls:=url::!urls);
  let registry=Lui_extension.registry () in
  Logseq_emoji.register registry;Logseq_katex.register registry;Logseq_el.register registry;
  Logseq_editor.register registry;Logseq_codemirror.register registry;Logseq_virt.register registry;
  let app=S.mount ~registry ~profile:Logseq_el.web_profile
    ~initial:{Model.initial with phase=Model.Ready;route=Model.Bug_report}
    ~reducer:(fun model update -> update model)
    ~view:(fun _ ms _ -> Page.region ms) () in
  fixture:=Some app;
  Runtime.app_flush:=(fun () -> S.flush app);
  Runtime.read_model:=(fun () -> Lui_app.model app.S.app);
  Runtime.app_send:=(function
    | Action.Toast_push toast -> toasts:=toast.Model.toast_text::!toasts;(!on_toast) ();false
    | _ -> false);
  check "Bug report route parses its canonical URL" (Router.parse_path "/bug-report"=Model.Bug_report);
  check "Clipboard tool route parses its canonical URL"
    (Router.parse_path "/bug-report-tool/clipboard-data-inspector"=Model.Bug_report_clipboard);
  check "Unknown diagnostic tools retain the not-found route"
    (Router.parse_path "/bug-report-tool/unknown"=Model.Not_found "bug-report-tool/unknown");
  List.iter (fun key -> check ("Bug report renders canonical text: " ^ key) (has_text (I18n.t key)))
    ["bug-report/title";"bug-report/desc";"bug-report.clipboard/title";"bug-report.issue/title"];
  ignore (press "bug-report.issue/action-title");
  check "Issue action opens the existing template with sanitized host diagnostics"
    (match !urls with
     | [url] -> I18n.contains url "https://github.com/logseq/db-test/issues/new?title=&template=bug_report.yaml&labels=from:in-app&platform=" &&
       I18n.contains url (Ui_services.uri_encode_component "Platform: FixtureOS/1.0 (Model) x Extra\nLanguage: en-US\nPlugins:")
     | _ -> false);
  if not (press "bug-report.clipboard/action-title") then cleanup () else begin
    check "Clipboard helper navigates inside the application"
      (!navigation="#/bug-report-tool/clipboard-data-inspector");
    check "The initial clipboard step owns paste input" (Paste_capture.active ());
    let source={js|<b>Diagnostic café 中文 😀</b>|js} in
    let paste ()=
      let event=Ui_dom_web.ev_of (Ui_dom_web_regression_test.clipboard_event ()) in
      let snapshot={Ui_services.clipboard_formats=["text/plain",source;"text/html","<b>rich</b>";
        "application/x-custom","opaque"];clipboard_items=["string","text/plain";"file","image/png"];
        clipboard_files=["attachment.png","image/png",12.]} in
      let prevented=ref false and stopped=ref false in
      Editor_keys.on_paste {event with Ui_services.clipboard_snapshot=(fun () -> snapshot);
        prevent_default=(fun () -> prevented:=true);stop_immediate=(fun () -> stopped:=true)};
      S.flush app;
      check "Diagnostics consume paste before the editor can change graph content" (!prevented && !stopped);
      check "The result step releases its paste ownership" (not (Paste_capture.active ()));
      check "The result step offers copying" (List.exists (fun n ->
        M.string_prop n "accessibility-label"=Some (I18n.t "bug-report.inspector/copy")) (nodes ())) in
    paste ();
    let result_id ()=List.find_opt (fun node -> M.string_prop node "accessibility-identifier"=
      Some "clipboard-inspection-result") (nodes ()) |> Option.map (fun node -> node.M.id) in
    List.iter (fun (name,update) ->
      let initial_result=result_id () in
      ignore (Lui_app.send app.S.app update);S.flush app;
      check ("Diagnostics retain their result across " ^ name)
        (Option.is_some initial_result && result_id ()=initial_result && not (Paste_capture.active ()));
      if Paste_capture.active () then paste ())
      ["opening the toolbar menu",(fun model -> {model with Model.page_menu=Some (100.,40.,50.,true,None)});
       "closing the toolbar menu",(fun model -> {model with Model.page_menu=None});
       "graph data publication",(fun model -> {model with Model.data_gen=model.data_gen+1});
       "theme changes",(fun model -> {model with Model.theme_dark=not model.theme_dark})];
    ignore (press "bug-report.inspector/back");
    check "Reset returns to a fresh paste step" (Paste_capture.active ());
    ignore (press "bug-report.inspector/back");
    check "Back from the initial step returns to Bug report"
      (!navigation="#/bug-report" && not (Paste_capture.active ()));
    ignore (press "bug-report.clipboard/action-title");paste ();
    ignore (press "bug-report.inspector/create-issue");
    check "Both issue actions use the same diagnostic URL"
      (match !urls with [a;b] -> a=b | _ -> false);
    ignore (press "bug-report.inspector/copy");
    let copied=List.hd !writes in
    check "Copied diagnostics use readable JSON" (String.contains copied '\n');
    check "Copied diagnostics preserve all admitted representations"
      (Ui_dom_web.json_of_js (Js.Json.parseExn copied)=
       Json.Object ["items",Json.Array [|Json.Object ["kind",Json.String "string";"type",Json.String "text/plain"];
         Json.Object ["kind",Json.String "file";"type",Json.String "image/png"]|];
         "types",Json.Array [|Json.Object ["type",Json.String "text/plain";"data",Json.String source];
           Json.Object ["type",Json.String "text/html";"data",Json.String "<b>rich</b>"];
           Json.Object ["type",Json.String "application/x-custom";"data",Json.String "opaque"]|];
         "files",Json.Array [|Json.Object ["name",Json.String "attachment.png";
           "type",Json.String "image/png";"size",Json.Number 12.]|]]);
    on_toast:=(fun () ->
      check "Copy confirmation follows successful host completion"
        (List.hd !toasts=I18n.t "bug-report.inspector/copied");
      on_toast:=(fun () ->
        check "Rejected copy reports its own error instead of success"
          (List.hd !toasts=I18n.t "bug-report.inspector/copy-error");
        on_toast:=(fun () -> check "Disposed diagnostics must not emit a copy notification" false);
        ignore (press "bug-report.inspector/copy");
        let promise,resolve,_=Option.get !pending in
        ignore (press "bug-report.inspector/back");
        ignore (press "bug-report.inspector/back");
        check "Leaving the inspector releases paste ownership" (not (Paste_capture.active ()));
        ignore (Js.Promise.then_ (fun () ->
          Js.Promise.then_ (fun () ->
            check "Leaving diagnostics ignores late clipboard completion" (List.length !toasts=2);
            cleanup ();Js.Promise.resolve ()) (Js.Promise.resolve ())) promise);
        resolve ());
      ignore (press "bug-report.inspector/copy");
      let _,_,reject=Option.get !pending in reject (Failure "clipboard denied"));
    check "Pending copy does not show a success notification" (!toasts=[]);
    let _,resolve,_=Option.get !pending in resolve ()
  end
