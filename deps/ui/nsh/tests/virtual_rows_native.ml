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

let () =
  test_rows_sig ~lazy_children:false 1_000 ();
  test_rows_sig ~lazy_children:false 100_000 ();
  test_rows_sig ~lazy_children:true 1_000 ();
  test_rows_sig ~lazy_children:true 100_000 ();
  test_array_list ();
  print_endline "Production native Virt_list/Lazy_children: bounded 1k/100k, edit, reorder, pin and pagination passed"
