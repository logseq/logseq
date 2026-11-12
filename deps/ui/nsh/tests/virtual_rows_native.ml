(* Exercise the production native adapters against the retained LUI runtime.
   This opens no OS window and does not claim native geometry qualification. *)
open Lui_protocol
open Lui_elements

type item = { uuid : string; title : string }
type action = Replace of item list | Edit of string * string

let check name condition = if not condition then failwith name
let items count = List.init count (fun index ->
  let uuid = "block-" ^ string_of_int index in { uuid; title = uuid })
let key item = item.uuid
let reduce model = function
  | Replace next -> next
  | Edit (uuid, title) -> List.map (fun item ->
      if item.uuid = uuid then { item with title } else item) model

let property runtime node property =
  Option.bind (Hashtbl.find_opt runtime.Lui_runtime.runtime_properties node)
    (fun properties -> Property_map.find_opt property properties)

let integer runtime node name = match property runtime node name with
  | Some (IntValue value) -> value
  | _ -> failwith "Missing canonical integer metadata"

let find runtime predicate =
  Hashtbl.fold (fun node kind result ->
    if predicate node kind then Some node else result)
    runtime.Lui_runtime.mounted_nodes None |> Option.get

let identified runtime uuid = find runtime (fun node _ ->
  property runtime node AccessibilityIdentifier = Some (StringValue uuid))

let test_rows_sig ~lazy_children count () =
  let ended = ref 0 in
  let backend = {
    backend_profile = profile MacOS NshHost;
    apply_batch = (fun _ -> true)
  } in
  let view _ source send =
    let mount item =
        text_field ~accessibility_identifier:(Signal.get item).uuid
          ~text:(reactive (fun value -> value.title) item)
          ~on_input:(function
            | TextChanged (_, title) -> ignore (send (Edit ((Signal.get item).uuid, title)))
            | _ -> ()) [] in
    scroll [if lazy_children then
      Lazy_children.lazy_rows ~active_key:None ~key ~cmp:String.compare
        ~estimate_height:(fun _ -> 32.) ~mount ~source
    else
      Virt_list.rows_sig ~key ~cmp:String.compare ~estimate_size:(fun _ -> 32.)
        ~on_end:(fun () -> incr ended) ~mount source] in
  let app = Lui_app.create backend (items count) reduce view in
  Fun.protect ~finally:(fun () -> ignore (Lui_app.dispose app)) (fun () ->
    ignore (Lui_app.start app);
    ignore (Lui_app.flush app);
    let runtime = Lui_app.runtime app in
    let list = find runtime (fun _ kind -> kind = VirtualList) in
    check "the surrounding Scroll remains the viewport owner"
      (property runtime list VirtualViewport = Some (StringValue "parent"));
    check "full business data remains in the canonical source"
      (integer runtime list VirtualTotalCount = count);
    let bounded () = check "mounted native production rows remain bounded"
      (Hashtbl.length runtime.mounted_nodes < 256) in
    bounded ();
    let window ?(pins = []) first last =
      ignore (Lui_app.dispatch_event app
        (VirtualWindow (list, integer runtime list VirtualGeneration, first, last, pins)));
      ignore (Lui_app.flush app);
      bounded () in
    window 100 111;
    let row = identified runtime "block-103" in
    ignore (Lui_app.dispatch_event app (TextChanged (row, "edited λ 😀")));
    ignore (Lui_app.flush app);
    check "signal-aware content updates retain the actual input node"
      (identified runtime "block-103" = row);
    check "controlled Unicode text follows the model"
      (property runtime row TextValue = Some (StringValue "edited λ 😀"));
    let model = Lui_app.model app in
    let moved = List.find (fun item -> item.uuid = "block-103") model in
    let rest = List.filter (fun item -> item.uuid <> moved.uuid) model in
    let rec insert index = function
      | tail when index = 0 -> moved :: tail
      | head :: tail -> head :: insert (index - 1) tail
      | [] -> failwith "Invalid fixture reorder" in
    ignore (Lui_app.send app (Replace (insert 105 rest)));
    ignore (Lui_app.flush app);
    check "UUID reorder retains the mounted input node"
      (identified runtime "block-103" = row);
    check "UUID reorder preserves the controlled editor draft"
      (property runtime row TextValue = Some (StringValue "edited λ 😀"));
    window ~pins:[row] 500 511;
    check "native interaction pins retain an offscreen input"
      (identified runtime "block-103" = row);
    window 500 511;
    window 100 111;
    check "evicted rows restore their authoritative draft"
      (property runtime (identified runtime "block-103") TextValue
       = Some (StringValue "edited λ 😀"));
    if not lazy_children then begin
    let range first last =
      ignore (Lui_app.dispatch_event app (VisibleRange (list, first, last)));
      ignore (Lui_app.flush app) in
    range (count - 5) count;
    range (count - 5) count;
    check "repeated end feedback does not duplicate pagination" (!ended = 1);
    range 100 110;
    range (count - 5) count;
    check "returning to the end can retry pagination" (!ended = 2)
    end)

let test_array_list () =
  let pin_state = ref None in
  let backend = {
    backend_profile = profile MacOS NshHost;
    apply_batch = (fun _ -> true)
  } in
  let view ctx source _ =
    let pin = Signal.state ctx.Lui_ui.ui_scheduler None in
    pin_state := Some pin;
    scroll [Virt_list.list ~key_of:key ~estimate_size:(fun _ -> 32.)
      ~pin_key:(fun () -> Signal.get_state pin)
      ~pin_sig:(fun () -> Some (Signal.value pin))
      ~data_sig:(fun _ -> Some source)
      ~render:(fun item -> text_field ~accessibility_identifier:item.uuid
        ~text:item.title []) (Signal.get source)] in
  let app = Lui_app.create backend (Array.of_list (items 100_000))
      (fun _ next -> next) view in
  Fun.protect ~finally:(fun () -> ignore (Lui_app.dispose app)) (fun () ->
    ignore (Lui_app.start app);
    ignore (Lui_app.flush app);
    let runtime = Lui_app.runtime app in
    let list = find runtime (fun _ kind -> kind = VirtualList) in
    check "array source does not eagerly mount 100k row snapshots"
      (Hashtbl.length runtime.mounted_nodes < 256);
    let window () =
      ignore (Lui_app.dispatch_event app
        (VirtualWindow (list, integer runtime list VirtualGeneration, 100, 111, [])));
      ignore (Lui_app.flush app) in
    window ();
    let retained = identified runtime "block-103" in
    let next = Array.copy (Lui_app.model app) in
    next.(104) <- { next.(104) with title = "changed neighbor" };
    let moved = next.(103) in
    next.(103) <- next.(105);
    next.(105) <- moved;
    ignore (Lui_app.send app next);
    ignore (Lui_app.flush app);
    check "array row reorder and neighbor edit retain the untouched input"
      (identified runtime "block-103" = retained);
    let changed = identified runtime "block-104" in
    check "changed snapshots repaint within the existing key"
      (property runtime changed TextValue = Some (StringValue "changed neighbor"));
    let pin = Option.get !pin_state in
    Signal.set pin (Some "block-90000");
    ignore (Lui_app.flush app);
    check "offscreen editor activation uses the canonical key target"
      (property runtime list ScrollTarget = Some (StringValue "block-90000"));
    check "offscreen editor activation issues a request token"
      (integer runtime list ScrollToken = 1);
    check "offscreen target resolves to its canonical source index"
      (integer runtime list VirtualScrollIndex = 90_000);
    (* The native host requests the target window after resolving the command;
       a target property alone does not pretend to be native viewport feedback. *)
    ignore (Lui_app.dispatch_event app
      (VirtualWindow (list, integer runtime list VirtualGeneration, 90_000, 90_011, [])));
    ignore (Lui_app.flush app);
    check "native target feedback mounts no intermediate rows"
      (property runtime (identified runtime "block-90000") TextValue
       = Some (StringValue "block-90000")
       && Hashtbl.length runtime.mounted_nodes < 256);
    Signal.set pin None;
    ignore (Lui_app.flush app);
    Signal.set pin (Some "block-90000");
    ignore (Lui_app.flush app);
    check "repeated activation of the same key receives a fresh token"
      (integer runtime list ScrollToken = 2))

(* Exercise the same grid builder the production picker uses, including both
   complete generated datasets. Count real mounted controls and render calls. *)
let test_picker_grid label data () =
  let chosen = ref None and rendered = ref 0 in
  let backend = {
    backend_profile = profile MacOS NshHost;
    apply_batch = (fun _ -> true)
  } in
  let view _ _ _ =
    scroll ~height:176 ~width:400
      [Icon_picker.grid_rows ~label ~render:(fun item ->
        incr rendered;
        let key = Icon_picker.item_key item in
        button ~accessibility_identifier:key ~text:key ~width:36 ~height:36
          ~on_press:(fun _ -> chosen := Some key) []) (Array.to_list data)] in
  let app = Lui_app.create backend () (fun () () -> ()) view in
  Fun.protect ~finally:(fun () -> ignore (Lui_app.dispose app)) (fun () ->
    ignore (Lui_app.start app);
    ignore (Lui_app.flush app);
    let runtime = Lui_app.runtime app in
    let list = find runtime (fun _ kind -> kind = VirtualList) in
    let count = Array.length data in
    let rows = (count + 8) / 9 in
    let controls () = Hashtbl.fold (fun _ kind count ->
      if kind = Button then count + 1 else count) runtime.mounted_nodes 0 in
    let bounded () =
      check (label ^ " mounts only a bounded set of actual picker buttons")
        (controls () <= 126 && Hashtbl.length runtime.mounted_nodes < 512) in
    check (label ^ " keeps every generated item in the canonical row source")
      (integer runtime list VirtualTotalCount = rows);
    check (label ^ " borrows its enclosing picker Scroll")
      (property runtime list VirtualViewport = Some (StringValue "parent"));
    check (label ^ " does not eagerly construct every picker cell")
      (!rendered = controls () && !rendered <= 126);
    bounded ();
    let window ?(pins = []) first last =
      ignore (Lui_app.dispatch_event app
        (VirtualWindow (list, integer runtime list VirtualGeneration, first, last, pins)));
      ignore (Lui_app.flush app);
      bounded () in
    let item_key index = Icon_picker.item_key data.(index) in
    window 100 107;
    check (label ^ " renders precisely the requested seven grid rows")
      (controls () = 63);
    let cell = identified runtime (item_key (103 * 9 + 4)) in
    (* The host pins the canonical direct child of the virtual list, not
       the nested grid that happens to parent an individual button. *)
    let rec row_owner node =
      let parent = Hashtbl.find runtime.runtime_parents node in
      if Lui_runtime.canonical_node runtime parent
         = Lui_runtime.canonical_node runtime list
      then node else row_owner parent in
    let row = row_owner cell in
    window 101 108;
    check (label ^ " preserves overlapping cell identity during scrolling")
      (identified runtime (item_key (103 * 9 + 4)) = cell);
    ignore (Lui_app.dispatch_event app (Press cell));
    ignore (Lui_app.flush app);
    check (label ^ " keeps the selected item identity after scrolling")
      (!chosen = Some (item_key (103 * 9 + 4)));
    window ~pins:[row] (rows - 2) rows;
    check (label ^ " retains the host-pinned interaction row")
      (identified runtime (item_key (103 * 9 + 4)) = cell);
    window (rows - 2) rows;
    check (label ^ " retires cells when their unpinned row leaves the viewport")
      (not (Hashtbl.mem runtime.mounted_nodes cell));
    let last = identified runtime (item_key (count - 1)) in
    ignore (Lui_app.dispatch_event app (Press last));
    ignore (Lui_app.flush app);
    check (label ^ " reaches and activates the final item without truncation")
      (!chosen = Some (item_key (count - 1)));
    window 0 3;
    check (label ^ " returns to the first items without retaining old windows")
      (controls () = 27
       && property runtime (identified runtime (item_key 0)) TextValue
          = Some (StringValue (item_key 0))))

let test_picker_grids () =
  let emojis = Emoji_mart.all_emojis () |> List.map (fun (id, name) ->
    Icon_picker.Emoji_item (id, name)) |> Array.of_list in
  let icons = Icon_picker.icon_items () |> List.map (fun (display, kebab) ->
    Icon_picker.Tabler_item (display, kebab)) |> Array.of_list in
  check "native Emoji and icon fixtures each exceed 1k items"
    (Array.length emojis > 1_000 && Array.length icons > 1_000);
  List.iter (fun (label, data) ->
    test_picker_grid (label ^ " 1k") (Array.sub data 0 1_000) ();
    test_picker_grid (label ^ " complete") data ())
    ["Emoji", emojis; "Icon", icons]

let with_picker_services run =
  let previous_host = !Host.host_op in
  Fun.protect ~finally:(fun () -> Host.host_op:=previous_host) (fun () ->
    let unsupported name = failwith ("Unexpected native picker fixture capability: " ^ name) in
    Host.set_host_op (fun operation _ -> unsupported operation);
    (* This is the executable's final, owned case. Install its private services
       once through the public boundary; they remain until this process exits. *)
    let values=Hashtbl.create 8 in
    let services : Ui_services.t={
      storage={get=Hashtbl.find_opt values;set=Hashtbl.replace values;remove=Hashtbl.remove values};
      native_performance=None;
      desktop_updates=None;
      request_flush=(fun () -> ());assert_owner=(fun () -> ());
      theme={mode=(fun () -> "light");system_default=(fun () -> true);
        prefers_dark=(fun () -> false);set_system_pref=(fun _ -> ());set_theme_pref=(fun _ -> ());
        apply_dataset=(fun _ -> ());apply_classes=(fun _ -> ());apply_snapshot=(fun _ -> ())};
      doc={set_lang=(fun _ -> ());preferred_lang=(fun () -> "en");set_lang_pref=(fun _ -> ());
        set_data=(fun _ _ -> ());rm_data=(fun _ -> ());set_title=(fun _ -> ());reload=(fun () -> ())};
      nav={hash=(fun () -> "");set_hash=(fun _ -> unsupported "set_hash");
        replace_hash=(fun _ -> unsupported "replace_hash");back=(fun () -> unsupported "back");
        forward=(fun () -> unsupported "forward");on_change=(fun _ -> unsupported "on_change");
        subscribe_change=(fun _ -> unsupported "subscribe_change");
        on_navigate=(fun _ -> unsupported "on_navigate");search=(fun () -> "");
        query_param=(fun _ -> None);hash_query_param=(fun _ -> None);decode_uri=Fun.id;
        reload=(fun () -> unsupported "reload");origin=(fun () -> "");pathname=(fun () -> "")};
      time={now=(fun () -> 0.);local_fields=(fun _ -> unsupported "local_fields");
        of_fields=(fun _ -> unsupported "of_fields");parse=(fun _ -> unsupported "parse");
        parse_natural=(fun ~reference:_ _ -> Ui_task.reject (Failure "Unused natural date capability"));
        fmt_date=(fun _ -> unsupported "fmt_date")};
      log={error=(fun _ -> ());info=(fun _ -> ());error_message=prerr_endline};
      perf={mark=(fun _ -> ())};uri={encode_component=(fun _ -> unsupported "uri")};
      clipboard={copy=(fun _ -> unsupported "clipboard copy");
        write_text=(fun _ -> unsupported "clipboard write");read_text=(fun () -> unsupported "clipboard read")};
      session={get=Hashtbl.find_opt values;set=Hashtbl.replace values};
      env={publishing=(fun () -> false);dev_build=(fun () -> false);rtc_test_mode=(fun () -> false);
        online=(fun () -> false);is_mac=(fun () -> true);user_agent=(fun () -> "Private picker fixture");
        language=(fun () -> "en");native_drag=(fun () -> true);native_block_controls=(fun () -> true);
        css_transform_icons=(fun () -> false);edit_units=(fun () -> `Bytes);
        random_uuid=(fun () -> unsupported "random_uuid");open_url=(fun _ -> unsupported "open_url");
        resource_url=(fun _ -> unsupported "resource_url");paints_caret=(fun () -> true);
        component_menus=(fun () -> true);css_animations=(fun () -> false)};
      dom={Ui_dom_native.ops with query=(fun _ -> None)};
      timers=Ui_dom_native.timers;files=Ui_dom_native.files} in
    Ui_services.install services;
    run ())

let test_picker_viewport_ownership () = with_picker_services (fun () ->
  let backend = {backend_profile=profile MacOS NshHost; apply_batch=(fun _ -> true)} in
  let registry=Lui_extension.registry () in
  Logseq_el.register_all registry;
  Logseq_codemirror.register registry;
  Logseq_editor.register registry;
  let app = Lui_app.create_with_extensions backend registry () (fun () () -> ()) (fun _ _ _ ->
    Icon_picker.picker_view ~del:true ~emoji_only:false
      ~on_chosen:(fun _ -> ()) ~close:(fun () -> ())) in
  let previous_flush = !Runtime.app_flush
  and previous_schedule = !Runtime.schedule_flush
  and previous_pending = !Runtime.flush_pending
  and previous_preset = Ui_services.storage_get "ls-icon-color-preset" in
  Runtime.schedule_flush := (fun _ -> ());
  Runtime.app_flush := (fun () -> ignore (Lui_app.flush app));
  Runtime.flush_pending := false;
  Fun.protect ~finally:(fun () ->
    ignore (Lui_app.dispose app);
    Runtime.app_flush := previous_flush;
    Runtime.schedule_flush := previous_schedule;
    Runtime.flush_pending := previous_pending;
    match previous_preset with
    | Some value -> Ui_services.storage_set "ls-icon-color-preset" value
    | None -> Ui_services.storage_remove "ls-icon-color-preset") (fun () ->
    ignore (Lui_app.start app);ignore (Lui_app.flush app);
    let runtime = Lui_app.runtime app in
    let send event =
      ignore (Lui_app.dispatch_event app event);ignore (Lui_app.flush app);
      Runtime.flush_pending := false in
    let body () = find runtime (fun _ kind -> kind=Scroll) in
    let input () = find runtime (fun _ kind -> kind=SearchField) in
    let tab name = find runtime (fun node kind -> kind=ToggleButton
      && property runtime node TextValue=Some (StringValue (I18n.t ("icon/tab-" ^ name)))) in
    let list () = find runtime (fun _ kind -> kind=VirtualList) in
    let far_window () =
      let source=list () in
      let count=integer runtime source VirtualTotalCount in
      send (VirtualWindow(source,integer runtime source VirtualGeneration,max 0 (count-7),count,[]));
      check "complete native picker retains bounded far-down cells"
        (Hashtbl.length runtime.mounted_nodes<512);
      source in
    send (ToggleChanged(tab "icons",true));
    let icon_body=body () in
    let old_list=far_window () in
    send (ToggleChanged(tab "emojis",true));
    check "native tab transition retires the scrolled owner and source"
      (body ()<>icon_body && not (Hashtbl.mem runtime.mounted_nodes old_list));
    let emoji_body=body () in
    ignore (far_window ());
    send (ToggleChanged(tab "icons",true));
    check "native reverse tab transition creates a fresh viewport" (body ()<>emoji_body);
    let icon_body=body () and field=input () in
    let old_list=far_window () in
    send (TextChanged(field,"zzzz-no-matching-icon"));
    let empty_body=body () in
    check "native empty filter retires far-down rows without remounting search"
      (empty_body<>icon_body && input ()=field
       && not (Hashtbl.mem runtime.mounted_nodes old_list));
    send (TextChanged(field,"star"));
    let filtered_body=body () in
    check "native short filter receives a new owner" (filtered_body<>empty_body);
    let clear=find runtime (fun node kind -> kind=Button
      && property runtime node AccessibilityLabel=Some (StringValue (I18n.t "icon/clear-search"))) in
    send (Press clear);
    check "native clear restores a fresh unfiltered owner and retained input"
      (body ()<>filtered_body && input ()=field
       && property runtime field TextValue=Some (StringValue ""));
    ignore (far_window ());
    let color_body=body () in
    let color_source=list () in
    let color_generation=integer runtime color_source VirtualGeneration in
    let color_indices=property runtime color_source VirtualIndices in
    let last_display=fst (List.hd (List.rev (Icon_picker.icon_items ()))) in
    let last_cell=find runtime (fun node kind -> kind=Button
      && property runtime node AccessibilityLabel=Some (StringValue last_display)) in
    let palette=find runtime (fun node kind -> kind=Button
      && property runtime node AccessibilityLabel=Some (StringValue (I18n.t "icon/select-color"))) in
    send (Press palette);
    let preset=find runtime (fun node kind -> kind=Button
      && property runtime node BackgroundValue=Some (StringValue "#5e69d2")) in
    send (Press preset);
    check "native far-down color edit retains the Scroll and search owner"
      (body ()=color_body && input ()=field);
    check "native color paint keeps the exact virtual source revision and far window"
      (list ()=color_source && integer runtime color_source VirtualGeneration=color_generation
       && property runtime color_source VirtualIndices=color_indices);
    check "native color paint updates the retained last icon without a window wake"
      (Hashtbl.mem runtime.mounted_nodes last_cell
       && property runtime last_cell ForegroundValue=Some (StringValue "#5e69d2"))))

let () =
  test_rows_sig ~lazy_children:false 1_000 ();
  test_rows_sig ~lazy_children:false 100_000 ();
  test_rows_sig ~lazy_children:true 1_000 ();
  test_rows_sig ~lazy_children:true 100_000 ();
  test_array_list ();
  test_picker_grids ();
  test_picker_viewport_ownership ();
  print_endline "Production native virtual rows and picker grids: bounded 1k/100k, complete Emoji/icons, retained interactions and pagination passed"
