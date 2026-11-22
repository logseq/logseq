(* Web adapter check — Ui_theme.apply delivers derived application tokens
   to document.body.style in both modes and leaves source-owned globals
   to CSS. Runs under node with Stub_dom's element stubs;
   style.setProperty records into __props. *)

let check label condition = if not condition then failwith label

let style_prop : string -> string option =
  [%mel.raw
    "function (n) { var p = document.body.style.__props; \
     return p ? p[n] : undefined }"]

let custom_css_fixture : unit -> (unit -> unit) = [%mel.raw {|
  function () {
    const query = document.querySelector, get = document.getElementById;
    const head = document.createElement('head');
    document.querySelector = selector => selector === 'head' ? head : query.call(document, selector);
    document.getElementById = id => Array.from(head.children).find(el => el.getAttribute('id') === id) || get.call(document, id);
    return () => { document.querySelector = query; document.getElementById = get; };
  }
|}]

let custom_css_href () =
  Option.bind (Web_dom.get_element_by_id Custom_css.theme_id)
    (fun el -> Web_dom.el_get_attr el "href")

let test_custom_css_clearing () =
  let restore = custom_css_fixture () in
  Fun.protect ~finally:restore (fun () ->
    Custom_css.apply_content "body { color: red; }";
    check "Custom CSS creates a stylesheet" (custom_css_href () <> None);
    Custom_css.on_file_saved "logseq/config.edn" "";
    check "An unrelated file cannot clear custom CSS" (custom_css_href () <> None);
    Custom_css.on_file_saved Custom_css.file_path "";
    check "Saving an empty custom.css removes the previous stylesheet" (custom_css_href () = None);
    Custom_css.apply_content "body { color: blue; }";
    Custom_css.on_file_saved Custom_css.file_path " \n\t";
    check "Whitespace-only custom.css removes the previous stylesheet" (custom_css_href () = None))

let custom_css_graph_switch ~finish =
  let open Promise_ext in
  let old_read = !Runtime.read_model and old_worker = !Runtime.worker in
  let restore_dom = custom_css_fixture () in
  let config url = Wire.Map [Wire.kw "custom-css-url", Wire.String url] in
  let model = ref {Model.initial with Model.repo = Some "old-css";
    graph_config = config "https://old.invalid/style.css"} in
  let stage repo graph_config =
    model := {!model with Model.repo = Some repo; graph_config} in
  let replies = ref [] and requested = ref [] in
  Runtime.read_model := (fun () -> !model);
  Runtime.worker := Some
    {Worker_client.invoke_fn = (fun _ args ->
       match args with
       | [Wire.String "error-css"; _] -> Js.Promise.reject (Failure "CSS read failed")
       | [Wire.String repo; Wire.String path] ->
           requested := (repo,path) :: !requested;
           Js.Promise.make (fun ~resolve ~reject:_ ->
             replies := (repo, (fun value -> resolve value [@u])) :: !replies)
       | _ -> Js.Promise.resolve Wire.Nil);
     on_message = (fun _ _ -> ());
     dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ())};
  let restore () = Runtime.read_model := old_read; Runtime.worker := old_worker; restore_dom () in
  let task =
    let pending = Custom_css.reset_for_repo "url-css" in
    stage "url-css" (config "https://new.invalid/style.css");
    let* () = pending in
    check "Graph open reads the configuration published after its hook"
      (custom_css_href () = Some "https://new.invalid/style.css");
    let pending = Custom_css.reset_for_repo "file-css" in
    stage "file-css" (Wire.Map []);
    let* () = Js.Promise.resolve () in
    check "A graph without a CSS URL reads its own local stylesheet"
      (List.mem ("file-css", Custom_css.file_path) !requested);
    (List.assoc "file-css" !replies) (Wire.String "body { color: blue; }");
    let* () = pending in
    check "Local graph styles are installed" (custom_css_href () <> None);
    let pending = Custom_css.reset_for_repo "late-css" in
    stage "late-css" (Wire.Map []);
    let* () = Js.Promise.resolve () in
    let replacement = Custom_css.reset_for_repo "replacement-css" in
    stage "replacement-css" (config "https://replacement.invalid/style.css");
    let* () = replacement in
    (List.assoc "late-css" !replies) (Wire.String "body { color: red; }");
    let* () = pending in
    check "A previous graph's delayed CSS cannot overwrite the active graph"
      (custom_css_href () = Some "https://replacement.invalid/style.css");
    let* () = Custom_css.reset_for_repo "superseded-css" in
    check "A superseded graph-open hook cannot remove the active stylesheet"
      (custom_css_href () = Some "https://replacement.invalid/style.css");
    stage "empty-css" (Wire.Map []);
    let pending = Custom_css.reset_for_repo "empty-css" in
    let* () = Js.Promise.resolve () in
    (List.assoc "empty-css" !replies) Wire.Nil;
    let* () = pending in
    check "Missing graph CSS leaves no previous stylesheet" (custom_css_href () = None);
    stage "error-css" (Wire.Map []);
    let rejected = ref false in
    let* () = Custom_css.reset_for_repo "error-css"
      |> Js.Promise.catch (fun _ -> rejected := true; Js.Promise.resolve ()) in
    check "CSS read failures propagate without retaining another graph's styles"
      (!rejected && custom_css_href () = None);
    Js.Promise.resolve ()
  in
  ignore (task |> Js.Promise.catch (fun error ->
    Test_check.check "Custom stylesheet graph-switch workflow completes" false;
    Ui_services.log_error ("CSS graph-switch test failed", error);
    Js.Promise.resolve ()) |> Js.Promise.then_ (fun () ->
      restore (); finish (); Js.Promise.resolve ()))

let run () =
  test_custom_css_clearing ();
  Ui_theme.apply "dark";
  List.iter (fun name -> check ("stylesheet owns " ^ name) (style_prop name = None))
    [ "--background"; "--card"; "--border"; "--primary"; "--ring"
    ; "--rx-gray-12"; "--rx-gray-12-hsl"; "--lx-gray-12" ];
  check "stylesheet owns title size"
    (style_prop "--ls-page-title-size" = None);
  check "dark canonical twin"
    (style_prop "--lx-page-title-size" = Some "var(--ls-page-title-size)");
  check "dark accent-bound canonical ref"
    (style_prop "--lx-primary-background-color"
     = Some "var(--ls-primary-background-color)");
  check "dark accent-bound literal withheld"
    (style_prop "--ls-primary-background-color" = None);
  check "dark lui semantic ref"
    (style_prop "--lui-background" = Some "hsl(var(--background))");
  check "stylesheet owns dark level ladder"
    (style_prop "--color-level-1" = None);
  check "dark overlay literal"
    (style_prop "--lx-overlay-color" = Some "#00000088");
  check "typography var"
    (style_prop "--lx-text-input" = Some "1.25rem");
  Ui_theme.apply "light";
  check "stylesheet owns light title size"
    (style_prop "--ls-page-title-size" = None);
  check "stylesheet owns light level ladder"
    (style_prop "--color-level-1" = None);
  check "light overlay literal"
    (style_prop "--lx-overlay-color" = Some "#00000066");
  check "stylesheet owns light bullet color"
    (style_prop "--ls-block-bullet-color" = None)
