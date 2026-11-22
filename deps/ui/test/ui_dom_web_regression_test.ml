open Test_check
module W = Wire

(* A FileList is array-like, including during protected dragover mode. *)
let event : string -> bool -> Js.Json.t = [%mel.raw
  "function (channel, protectedMode) {
    const files = protectedMode ? {length: 0} : {
      0: {name: 'attachment.png', size: 12}, length: 1
    };
    return {[channel]: {files, types: ['Files']}, prevented: false,
      preventDefault() {this.prevented = true},
      stopPropagation() {}, stopImmediatePropagation() {}};
  }"]

let prevented : Js.Json.t -> bool = [%mel.raw "e => e.prevented"]

let clipboard_event : unit -> Js.Json.t = [%mel.raw
  "function () {
    const values = {'text/plain': '<b>café 中文 😀</b>', 'text/html': '<b>café 中文 😀</b>', 'application/x-parity': 'opaque', Files: ''};
    return {reads: 0, clipboardData: {
      types: {0: 'text/plain', 1: 'text/html', 2: 'application/x-parity', 3: 'Files', length: 4},
      items: {0: {kind: 'string', type: 'text/plain'}, 1: {kind: 'file', type: 'image/png'}, length: 2},
      files: {0: {name: 'attachment.png', size: 12, type: 'image/png'}, length: 1},
      getData(type) { this.owner.reads++; return values[type]; }
    }};
  }"]
let attach_clipboard_owner : Js.Json.t -> unit = [%mel.raw "e => {e.clipboardData.owner=e}"]
let clipboard_reads : Js.Json.t -> int = [%mel.raw "e => e.reads"]

let video_fixture : unit -> Js.Json.t = [%mel.raw {|
  function () {
    const previous = {YT: window.YT, getFrames: document.getElementsByTagName,
      active: document.activeElement};
    const first = {src: 'https://www.youtube.com/embed/first', time: 10,
      compareDocumentPosition() {return 4}};
    const second = {src: 'https://www.youtube-nocookie.com/embed/second', time: 125.9,
      compareDocumentPosition() {return 4}};
    const following = {src: 'https://www.youtube.com/embed/following', time: 999,
      compareDocumentPosition() {return 0}};
    let frames = [first, second, following];
    document.getElementsByTagName = () => frames;
    document.activeElement = {};
    window.YT = {Player: function (frame, options) {
      frame.ready = () => options.events.onReady({target: {getCurrentTime: () => frame.time}});
    }};
    return {first, second, following, phase(name) {
      if (name === 'ready') frames.forEach(frame => frame.ready());
      if (name === 'advance') second.time = 241.6;
      if (name === 'invalid') second.time = NaN;
      if (name === 'empty') frames = [];
      if (name === 'restore') {
        window.YT = previous.YT;
        document.getElementsByTagName = previous.getFrames;
        document.activeElement = previous.active;
      }
    }};
  }
|}]
external video_phase : Js.Json.t -> string -> unit = "phase" [@@mel.send]

let test_video_player () =
  let fixture = video_fixture () in
  Fun.protect ~finally:(fun () -> video_phase fixture "restore") (fun () ->
    List.iter (fun name -> Render_libs.register_youtube (Stub_dom.get_field fixture name))
      ["first"; "second"; "following"];
    check "A YouTube iframe without readiness cannot supply a timestamp"
      (Render_libs.video_timestamp () = Runtime.Player_pending);
    video_phase fixture "ready";
    check "Playback reads the nearest preceding player, not the following iframe"
      (Render_libs.video_timestamp () = Runtime.Playback_time 125);
    video_phase fixture "advance";
    check "Playback timestamp queries current time rather than caching a timestamp"
      (Render_libs.video_timestamp () = Runtime.Playback_time 241);
    video_phase fixture "invalid";
    check "Invalid player time cannot produce a timestamp macro"
      (Render_libs.video_timestamp () = Runtime.Player_pending);
    video_phase fixture "empty";
    check "Without an embedded video timestamp insertion has no target"
      (Render_libs.video_timestamp () = Runtime.No_video))

let calc_fixture : string -> Code_mirror.t = [%mel.raw {|function (source) {
  const output = document.createElement('div');
  const wrapper = document.createElement('div');
  const container = document.createElement('div');
  wrapper.closest = () => container;
  container.querySelector = () => output;
  return {output, getValue() {return source}, getWrapperElement() {return wrapper}};
}|}]

let calc_lines : Code_mirror.t -> Js.Json.t array = [%mel.raw
  "cm => Array.from(cm.output.children)"]

let test_calc_output () =
  List.iter (fun source ->
    let cm = calc_fixture source in
    Code_mirror.update_calc cm;
    Code_mirror.update_calc cm;
    let lines = Array.to_list (calc_lines cm) in
    check "Live calculator updates replace results without wrapping long lines"
      (List.map (fun line -> Stub_dom.get_field line "textContent") lines
       = Render_calc.results source
       && List.for_all (fun line ->
         let get : string -> string = Stub_dom.get_field line "getAttribute" in
         get "style" = "white-space:pre;line-height:1.45rem;height:1.45rem") lines))
    ["1+1"; "2^256"; ""; "bad("]

let rename_nav_fixture : unit -> (unit -> unit) = [%mel.raw {|
  function () {
    const hash = location.hash, replace = history.replaceState;
    history.replaceState = (_, __, url) => { location.hash = String(url).slice(String(url).indexOf('#')); };
    location.hash = '#/page/Old%20title';
    return () => { location.hash = hash; history.replaceState = replace; };
  }
|}]

let page_rename_route ~finish =
  let open Promise_ext in
  Edit_flow_test.reset_editor ();
  let restore_nav = rename_nav_fixture () in
  let wait_ms ms = Js.Promise.make (fun ~resolve ~reject:_ ->
    ignore (Js.Global.setTimeout ~f:(fun () -> let value = () in resolve value [@u]) ms)) in
  let old_read = !Runtime.read_model and old_send = !Runtime.app_send
  and old_worker = !Runtime.worker
  and old_refresh = Runtime.hooks.refresh_after_ops
  and old_properties = Runtime.hooks.refresh_property_areas
  and old_loaded = !Router.loaded_route and old_gen = !Runtime.load_gen in
  let uuid = "00000000-0000-4000-8000-000000000123" in
  let page = {(Test_check.page []) with Model.page_uuid = Some uuid; page_title = "Old title"} in
  let model = ref {Model.initial with Model.repo = Some "rename-route-fixture";
    route = Model.Page "Old title"; route_page = Some page} in
  let requests = ref []
  and writes = ref 0 and reject_write = ref false in
  Runtime.read_model := (fun () -> !model);
  Runtime.app_send := (fun action -> model := Update.update !model action; true);
  Runtime.hooks.refresh_after_ops <- (fun () -> Subs_state.task_of_promise (Js.Promise.resolve ()));
  Runtime.hooks.refresh_property_areas <- (fun () -> Subs_state.task_of_promise (Js.Promise.resolve ()));
  Runtime.worker := Some {Worker_client.invoke_fn = (fun name args ->
    if name = "thread-api/apply-outliner-ops" then (
      incr writes;
      if !reject_write then Js.Promise.reject (Failure "Rename rejected") else Js.Promise.resolve W.Nil)
    else (
      if name = "thread-api/get-page-route-info" then requests := args :: !requests;
      Js.Promise.resolve W.Nil));
    on_message = (fun _ _ -> ()); dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
  let restore () =
    Ui_services.timers_clear_timeout !Router.reload_timer;
    Runtime.read_model := old_read; Runtime.app_send := old_send; Runtime.worker := old_worker;
    restore_nav ();
    Runtime.hooks.refresh_after_ops <- old_refresh;
    Runtime.hooks.refresh_property_areas <- old_properties;
    Router.loaded_route := old_loaded; Runtime.load_gen := old_gen in
  let task =
    let* () = Page_ops.rename uuid "New title" in
    check "Renaming a title-routed page commits its UUID route, not just the URL"
      ((!model).Model.route = Model.Page uuid);
    Router.reload ();
    let* () = wait_ms 40 in
    check "Reload after rename resolves the UUID instead of the old title"
      (match !requests with args :: _ -> List.mem (W.Uuid uuid) args | [] -> false);
    model := {!model with Model.route_page = Some page};
    let before_hash = Ui_services.nav_hash () in
    let* () = Page_ops.rename "00000000-0000-4000-8000-000000000124" "Other title" in
    check "Renaming an offscreen page does not replace the active page route"
      ((!model).Model.route = Model.Page uuid && Ui_services.nav_hash () = before_hash);
    let before = !writes in
    let* () = Page_ops.rename uuid "  " in
    check "An empty page rename does not write" (!writes = before);
    reject_write := true;
    let rejected = ref false and before_hash = Ui_services.nav_hash () in
    let* () = Page_ops.rename uuid "Rejected title" |> Js.Promise.catch (fun _ ->
      rejected := true; Js.Promise.resolve ()) in
    check "A failed rename preserves the current route" (!rejected && Ui_services.nav_hash () = before_hash);
    reject_write := false;
    let pending = Page_ops.rename uuid "Late title" in
    model := {!model with Model.route = Model.Settings};
    let* () = pending in
    check "A completed rename cannot redirect a newer navigation"
      ((!model).Model.route = Model.Settings && Ui_services.nav_hash () = before_hash);
    restore ();
    Js.Promise.resolve ()
  in
  ignore (task |> Js.Promise.catch (fun error ->
    restore (); Test_check.check "Page rename route workflow completes" false;
    Ui_services.log_error ("Page rename route test failed", error);
    Js.Promise.resolve ()) |> Js.Promise.then_ (fun () -> finish (); Js.Promise.resolve ()))

let run () =
  List.iter (fun (key, code, ctrl, alt, expected) ->
    let raw = Js.Json.object_ (Js.Dict.fromList
      ["key", Js.Json.string key; "code", Js.Json.string code;
       "ctrlKey", Js.Json.boolean ctrl; "altKey", Js.Json.boolean alt]) in
    check ("Shortcut key respects layout and modifier recovery: " ^ key ^ "/" ^ code)
      (Editor_keys.stroke_of (Ui_dom_web.ev_of raw) = expected))
    ["z", "KeyY", true, false, Some "ctrl+z";
     "y", "KeyZ", true, false, Some "ctrl+y";
     "a", "KeyQ", true, false, Some "ctrl+a";
     "Escape", "BracketLeft", true, false, Some "ctrl+open-square-bracket";
     "å", "KeyA", false, true, Some "alt+a";
     "z", "", true, false, Some "ctrl+z";
     "Control", "ControlLeft", true, false, None];
  test_calc_output ();
  test_video_player ();
  let raw=clipboard_event () in
  attach_clipboard_owner raw;
  let clip=Ui_dom_web.ev_of raw in
  check "Clipboard inspection does not read payloads during event construction" (clipboard_reads raw=0);
  let snapshot=clip.Ui_services.clipboard_snapshot () in
  check "Clipboard inspection preserves actual array-like MIME entries and Unicode"
    (snapshot.Ui_services.clipboard_formats=
      ["text/plain",{js|<b>café 中文 😀</b>|js};"text/html",{js|<b>café 中文 😀</b>|js};
       "application/x-parity","opaque";"Files",""]);
  check "Clipboard inspection reads each admitted format exactly once" (clipboard_reads raw=4);
  check "Clipboard inspection preserves item kinds and MIME types"
    (snapshot.clipboard_items=["string","text/plain";"file","image/png"]);
  check "Clipboard inspection retains file metadata without reading contents"
    (snapshot.clipboard_files=["attachment.png","image/png",12.]);
  check "Non-clipboard events expose an empty inspection"
    ((Ui_dom_web.ev_of (Js.Json.object_ (Js.Dict.empty ()))).Ui_services.clipboard_snapshot ()=
     Ui_services.empty_clipboard_snapshot);
  List.iter (fun channel ->
      let ev = Ui_dom_web.ev_of (event channel false) in
      check (channel ^ " retains an array-like FileList")
        (match ev.Ui_services.files with
         | [ f ] -> f.file_name = "attachment.png" && f.file_size = 12.
         | _ -> false)) [ "clipboardData"; "dataTransfer" ];
  let raw = event "dataTransfer" true in
  Editor_keys.on_file_dragover (Ui_dom_web.ev_of raw);
  check "protected file dragover enables the later drop" (prevented raw);
  let text_event = Js.Json.object_ (Js.Dict.fromList
      [ "dataTransfer", Js.Json.object_ (Js.Dict.fromList
          [ "files", Js.Json.array [||]
          ; "types", Js.Json.array [| Js.Json.string "text/plain" |] ]) ]) in
  let ev = Ui_dom_web.ev_of text_event in
  let cancelled = ref false in
  Editor_keys.on_file_dragover { ev with prevent_default = (fun () -> cancelled := true) };
  check "text drags retain their default behavior" (not !cancelled)
