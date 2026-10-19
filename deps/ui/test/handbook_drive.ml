open Test_check
module S=Drive.Session
module M=Drive.Model

let hook_host : (string -> Js.Json.t Js.Promise.t) -> (string -> unit Js.Promise.t) -> (string -> unit) -> (unit -> unit) =
  [%mel.raw "function(fetch,copy,open){
    const oldFetch=globalThis.fetch,oldOpen=window.open,clipboard=Object.getOwnPropertyDescriptor(navigator,'clipboard');
    globalThis.fetch=fetch;
    window.open=open;
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:copy}});
    return ()=>{globalThis.fetch=oldFetch;window.open=oldOpen;if(clipboard)Object.defineProperty(navigator,'clipboard',clipboard);else delete navigator.clipboard};
  }"]
let response : bool -> int -> string -> Js.Json.t =
  [%mel.raw "function(ok,status,body){return {ok,status,text:()=>Promise.resolve(body)}}"]
let online_response : unit -> Js.Json.t =
  [%mel.raw "function(){return {ok:true,json:()=>Promise.resolve({approximate_presence_count:42})}}"]
let escape_target : string -> Js.Json.t =
  [%mel.raw "function(id){
    const panel=document.createElement('div'),input=document.createElement('input');
    panel.setAttribute('class','cp__handbooks-popup');input.setAttribute('id',id);
    panel.appendChild(input);document.body.appendChild(panel);
    return input;
  }"]
let target_lookup : Js.Json.t -> (unit -> unit) =
  [%mel.raw "function(input){
    const previous=document.getElementById;
    document.getElementById=id=>id===input.id?input:previous.call(document,id);
    return ()=>{document.getElementById=previous};
  }"]
let focused_target : Js.Json.t -> bool =
  [%mel.raw "function(input){return document.activeElement===input}"]
let remove_target : Js.Json.t -> unit =
  [%mel.raw "function(input){document.body.removeChild(input.parentNode)}"]
let escape id =
  let target=escape_target id in
  Fun.protect ~finally:(fun () -> remove_target target) (fun () ->
    Stub_dom.fire_on ~fields:["key",Js.Json.string "Escape";"keyCode",Js.Json.number 27.] target "keydown")

let run ~finish =
  let initial_dialogs=(Dialogs_state.value ()).dialogs in
  let previous_send= !Runtime.app_send and previous_flush= !Runtime.app_flush and previous_read= !Runtime.read_model in
  let previous_sidebar= !Sidebar_state.st_ref and previous_ms= !Sidebar_state.model_signal
  and previous_sources= !Editor_state.extra_sources and previous_loaded= !Sidebar_state.loaded_repo in
  Sidebar_state.st_ref:=None;Sidebar_state.model_signal:=None;Sidebar_state.loaded_repo:=None;
  let requests=ref [] and copies=ref [] and external_urls=ref [] in
  let restore=hook_host (fun url ->
    if url="https://plugins.logseq.io/ds" then Js.Promise.resolve (online_response ()) else
    let promise,resolve=let resolve_ref=ref (fun _ -> ()) in
      let promise=Js.Promise.make (fun ~resolve ~reject:_ -> resolve_ref:=(fun value -> resolve value [@u])) in
      promise,!resolve_ref in
    requests:= !requests @ [url,resolve];promise)
    (fun value -> copies:=value::!copies;Js.Promise.resolve ())
    (fun url -> external_urls:=url::!external_urls) in
  let registry=Lui_extension.registry () in
  Logseq_el.register registry;Logseq_editor.register registry;Logseq_codemirror.register registry;
  Logseq_emoji.register registry;Logseq_katex.register registry;Logseq_virt.register registry;
  let app=S.mount ~registry ~profile:Logseq_el.web_profile
    ~initial:{Model.initial with phase=Model.Ready;repo=Some "logseq_db_handbook";route=Model.Journals;right_sidebar_open=false}
    ~reducer:Update.update ~view:(fun _ ms _ -> Ui_components.overlay_typography
      (Lui_elements.column [Chrome.help_area ms;Right_sidebar_view.render ms])) () in
  Runtime.read_model:=(fun () -> Lui_app.model app.S.app);
  Runtime.app_flush:=(fun () -> S.flush app);
  Runtime.app_send:=(fun action -> let changed=Lui_app.send app.S.app action in S.flush app;changed);
  let cleanup ()=
    ignore (Lui_app.dispose app.S.app);restore ();
    Sidebar_state.st_ref:=previous_sidebar;Sidebar_state.model_signal:=previous_ms;
    Sidebar_state.loaded_repo:=previous_loaded;Editor_state.extra_sources:=previous_sources;
    Runtime.app_send:=previous_send;Runtime.app_flush:=previous_flush;Runtime.read_model:=previous_read;
    finish () in
  let nodes ()=M.all_nodes app.S.tree in
  let find id=List.find_opt (fun node -> M.string_prop node "accessibility-identifier"=Some id) (nodes ()) in
  let has id=Option.is_some (find id) in
  let text value=List.exists (fun node -> M.string_prop node "text"=Some value) (nodes ()) in
  let press_label key=match List.find_opt (fun node -> node.M.kind="button" &&
    M.string_prop node "accessibility-label"=Some (I18n.t key)) (nodes ()) with
    | None -> check ("Handbook control available: " ^ key) false
    | Some node -> S.press app node.M.id in
  let press id=match find id with None -> check ("Handbook control available: " ^ id) false | Some node -> S.press app node.M.id in
  let input value=match find "handbook-search" with None -> check "Handbook search remains available" false
    | Some node -> S.text_changed app node.M.id value in
  let later f=ignore (Ui_services.timers_timeout (fun () -> S.flush app;f ()) 0) in
  let open_ ()=press_label "help/toggle-menu";press_label "help/handbook" in
  open_ ();
  check "Real Help Handbook entry opens its shared panel" (has "handbook-panel");
  check "Handbook entry closes Help before opening its panel" (not (Lui_app.model app.S.app).Model.help_open);
  check "Handbook starts with a translated loading state" (text (I18n.t "ui/loading"));
  if not (has "handbook-panel") then cleanup () else later (fun () ->
    check "Handbook reads its actual content endpoint once"
      (List.map fst !requests=["https://handbooks.pages.dev/handbooks.edn"]);
    match !requests with
    | [] -> cleanup ()
    | (_,resolve)::_ ->
      let source=Str_util.replace_all Handbook_scenarios.fixture ~pat:"</strong></p>"
        ~rep:"</strong> <a href='2.Second-Topic.edn'>Next topic</a> <a href='https://example.test/handbook'>Website</a></p>" in
      resolve (response true 200 source);
      later (fun () ->
        check "Handbook renders its populated dashboard" (text (I18n.t "help.handbook/popular-topics") &&
          has "handbook-topic-1.start/_1.first_topic" && has "handbook-category-1.start" &&
          not (has "handbook-category-2.empty"));
        check "Handbook keeps one bounded independent scroll surface"
          (List.exists (fun node -> node.M.kind="scroll" && M.string_prop node "accessibility-identifier"=Some "handbook-scroll") (nodes ()));
        let panel=Option.get (find "handbook-panel") in
        check "Handbook remains a nonmodal standard panel" (panel.M.kind="popover" && (Dialogs_state.value ()).dialogs=initial_dialogs);
        press "handbook-topic-1.start/_1.first_topic";
        check "Handbook opens real rich topic content" (text "One " && text "bold" && not (has "handbook-search"));
        let press_link url=match List.find_opt (fun node -> node.M.kind="link" && M.string_prop node "url"=Some url) (nodes ()) with
          | None -> check ("Handbook link available: " ^ url) false | Some node -> S.press app node.M.id in
        press_link "https://example.test/handbook";
        check "Handbook external links reach their host action" (!external_urls=["https://example.test/handbook"]);
        press_link "logseq://handbook/1.start/_2.second_topic";
        check "Handbook relative links navigate inside its panel" (text "Two");
        press_label "help.handbook/prev-chapter";
        press_label "help.handbook/next-chapter";
        check "Handbook next chapter changes its content" (text "Two");
        press_label "help.handbook/prev-chapter";
        check "Handbook previous chapter restores its content" (text "One ");
        press "handbook-copy-link";
        later (fun () ->
          check "Handbook copies the canonical topic link"
            (!copies=["logseq://handbook/1.start/_1.first_topic"]);
          press "handbook-back";
          check "Chapter steps retain one return destination" (text (I18n.t "help.handbook/popular-topics"));
          press "handbook-category-1.start";input "guide";
          check "Handbook search shows scoped chapter results"
            (has "handbook-topic-1.start/_3.guide/second" && not (has "handbook-topic-3.sync/_1.setup"));
          let search=Option.get (find "handbook-search") in
          S.dispatch app (Lui_protocol.NavigateNext search.M.id);
          S.dispatch app (Lui_protocol.Submit search.M.id);
          check "Handbook arrow selection and Enter open a result" (text "Start");
          press "handbook-back";
          let retained=Option.get (find "handbook-search") in
          input "sync";
          let target=escape_target "handbook-search" in
          let restore_lookup=target_lookup target in
          Fun.protect ~finally:(fun () -> restore_lookup ();remove_target target) (fun () ->
            press_label "help.handbook/clear-search";
            check "Handbook clear restores input focus" (focused_target target);
            check "Handbook clear retains its mounted search field"
              (Option.map (fun node -> node.M.id) (find "handbook-search")=Some retained.M.id &&
               M.string_prop (Option.get (find "handbook-search")) "text"=Some ""));
          input "sync";escape "handbook-search";S.flush app;
          check "Handbook Escape clears search before closing"
            (has "handbook-panel" && Option.map (fun node -> node.M.id) (find "handbook-search")=Some retained.M.id &&
             M.string_prop (Option.get (find "handbook-search")) "text"=Some "");
          escape "handbook-search";S.flush app;
          check "Handbook Escape from empty search closes the panel" (not (has "handbook-panel"));
          open_ ();later (fun () ->
            check "Reopening Handbook loads a fresh panel" (has "handbook-panel" && List.length !requests=2);
            let _,late=List.nth !requests 1 in
            press "handbook-close";
            late (response true 200 Handbook_scenarios.fixture);
            later (fun () ->
              check "Late Handbook content cannot reopen a closed panel" (not (has "handbook-panel"));
              open_ ();later (fun () ->
                let _,load=List.nth !requests 2 in
                load (response false 503 "unavailable");later (fun () ->
                  check "Handbook HTTP failures stay visible and closable" (has "handbook-panel" &&
                    not (text (I18n.t "ui/loading")) && has "handbook-load-error");
                  press "handbook-close";
                  open_ ();later (fun () ->
                    let _,load=List.nth !requests 3 in
                    load (response true 200 Handbook_scenarios.fixture);later (fun () ->
                      press "handbook-shortcuts";
                      check "Handbook shortcut action opens the actual sidebar and closes its panel"
                        ((Lui_app.model app.S.app).Model.right_sidebar_open && not (has "handbook-panel") &&
                         List.exists (fun node -> M.string_prop node "style-class"=Some "cp__shortcut-page") (nodes ()));
                      cleanup ())))))))))
