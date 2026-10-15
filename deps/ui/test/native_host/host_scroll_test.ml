open Lui_scene

let check name condition = if not condition then failwith name

let () =
  let viewport = rect 3. 48. 1274. 852. in
  let bounds rects = Host_scroll.content_bounds ~viewport ~padding_x:16. ~padding_y:32. ~rect_of:Fun.id ~children:(fun _ -> []) rects in
  let left, top, right, bottom = bounds [ rect 35. 80. 1226. 788.; rect 0. 0. 0. 0. ] in
  check "unlaid nodes at the origin do not create a short-page scroll range"
    (left = viewport.x && top = viewport.y
     && right = viewport.x +. viewport.w && bottom = viewport.y +. viewport.h);
  let left, top, right, bottom = bounds [] in
  check "empty content keeps finite viewport bounds"
    (left = 3. && top = 48. && right = 1277. && bottom = 900.);
  let _, top, _, bottom = bounds [ rect 35. 80. 1226. 2000. ] in
  check "long content retains both leading and trailing container padding"
    (top = 48. && bottom = 2112. && bottom -. top -. viewport.h = 1212.);
  let _, top, _, bottom = bounds [ rect 0. (-500.) 0. 2000. ] in
  check "zero-width placeholders do not affect the scroll extent"
    (top = 48. && bottom = 900.);
  let _, top, _, bottom = bounds [ rect 30. (-500.) 40. 200. ] in
  check "overflow before the scroll origin does not add positive scroll range"
    (top = 48. && bottom = 900.);
  let scaled_viewport = rect 6. 96. 2548. 1704. in
  let _, top, _, bottom = Host_scroll.content_bounds ~viewport:scaled_viewport
      ~padding_x:32. ~padding_y:64. ~rect_of:Fun.id ~children:(fun _ -> [])
      [ rect 70. 160. 2452. 2000. ] in
  check "device-pixel scroll bounds retain scaled padding"
    (bottom -. top -. scaled_viewport.h = 424.);
  let child_viewport = rect 35. 100. 800. 200.
  and child_content = rect 35. 100. 800. 2000. in
  let rect_of = function 1 -> child_viewport | _ -> child_content in
  let _, top, _, bottom = Host_scroll.content_bounds ~viewport ~padding_x:16.
      ~padding_y:32. ~rect_of ~children:(fun _ -> []) [ 1 ] in
  check "a fixed-height nested scroller contributes only its own viewport"
    (bottom -. top -. viewport.h = 0.);
  let _, top, _, bottom = Host_scroll.content_bounds ~viewport:child_viewport
      ~padding_x:0. ~padding_y:0. ~rect_of ~children:(fun _ -> []) [ 2 ] in
  check "nested content still scrolls inside its own owner"
    (bottom -. top -. child_viewport.h = 1800.);
  let rect_of = function 1 -> rect 35. 80. 1226. 788. | _ -> rect 168. 80. 960. 1586. in
  let _, top, _, bottom = Host_scroll.content_bounds ~viewport ~padding_x:16.
      ~padding_y:32. ~rect_of ~children:(function 1 -> [ 2 ] | _ -> []) [ 1 ] in
  check "visible descendant overflow does not double-add container padding"
    (bottom -. top = 1618.);
  let nested_store = Lui_store.create () and nested_ui = Lui_window.Ui.create () in
  Lui_store.apply_batch nested_store { Lui_protocol.generation = 1;
    ops = [ CreateNode (1, Scroll); CreateNode (2, Scroll); CreateNode (3, Column);
            InsertChild (1, 2, 0); InsertChild (2, 3, 0) ] };
  let children node =
    if Lui_window.Ui.hidden nested_ui nested_store node
       || (not (Lui_paint.unboxed nested_store node)
           && Lui_paint.clips (Lui_store.kind nested_store node) nested_store node)
    then [] else Lui_store.child_ids nested_store node in
  let rect_of = function 2 -> child_viewport | _ -> child_content in
  let _, top, _, bottom = Host_scroll.content_bounds ~viewport ~padding_x:16.
      ~padding_y:32. ~rect_of ~children (Lui_store.child_ids nested_store 1) in
  check "production clipping policy excludes a nested scroller's descendants"
    (bottom -. top -. viewport.h = 0.);
  let store = Lui_store.create () and ui = Lui_window.Ui.create () in
  Lui_store.apply_batch store { Lui_protocol.generation = 1;
    ops = [ CreateNode (1, Scroll) ] };
  Lui_window.Ui.set_scroll_cap ui 1 902.;
  ignore (Lui_window.Ui.scroll_to ui store 1 902.);
  let painted_scroll_epoch = Lui_window.Ui.scroll_epoch ui in
  Lui_window.Ui.set_scroll_cap ui 1 702.;
  check "a shrinking layout cap clamps the offset" (Lui_window.Ui.scroll_offset ui 1 = 702.);
  check "a post-paint clamp requests the next frame rather than losing its dirty state"
    (Host_scroll.finish_frame ui ~painted_scroll_epoch);
  check "an unchanged scroll epoch does not keep the host repainting"
    (not (Host_scroll.finish_frame ui ~painted_scroll_epoch:(Lui_window.Ui.scroll_epoch ui)));
  print_endline "native scroll geometry: OK"

let () =
  let ui = Lui_window.Ui.create () in
  let store_ref = ref None in
  let plans = ref 0 in
  let hooks =
    { Lui_paint.default_hooks with
      layout = (fun _ -> Lui_paint.placement_of_rect (rect 0. 0. 100. 40.))
    ; state_of = (fun id ->
        if id = 2 then incr plans;
        Lui_window.Ui.state_of ui (Option.get !store_ref) id) } in
  let host = Lui_host.create ~hooks ~width:100 ~height:40 ~scale:1.
      ~renderer:{ Lui_host.name = "recording"; render = (fun _ -> Bytes.empty) } () in
  let store = Lui_host.store host in
  store_ref := Some store;
  ignore (Lui_host.apply_batch host
      { Lui_protocol.generation = 1
      ; ops = [ CreateNode (1, Root); CreateNode (2, Button); InsertChild (1, 2, 0) ] });
  ignore (Host_scroll.prepare_frame ui host);
  ignore (Lui_host.repaint host);
  let before = !plans in
  check "the production host painted the initial button" (before > 0);
  let rects = Lui_window.Rects.create () in
  Hashtbl.replace rects 1 (rect 0. 0. 100. 40.);
  Hashtbl.replace rects 2 (rect 0. 0. 100. 40.);
  ignore (Lui_window.Ui.handle ui store rects (Lui_window.Input.Move (10., 10.)));
  check "pointer movement changes the production interaction state"
    (Lui_window.Ui.hovered ui = 2);
  ignore (Lui_host.repaint host);
  check "without interaction hints the retained button keeps its old paint plan"
    (!plans = before);
  ignore (Host_scroll.prepare_frame ui host);
  ignore (Lui_host.repaint host);
  check "native interaction hints replan a hovered retained button without store changes"
    (!plans > before);
  let before_focus = !plans in
  Lui_window.Ui.set_focused ui store 2;
  ignore (Host_scroll.prepare_frame ui host);
  ignore (Lui_host.repaint host);
  check "native focus changes replan the retained control"
    (!plans > before_focus);
  let before_press = !plans in
  ignore (Lui_window.Ui.handle ui store rects
      (Lui_window.Input.Button_down (10., 10., Lui_window.Input.Left, 1,
         Lui_window.Input.mods_none)));
  ignore (Host_scroll.prepare_frame ui host);
  ignore (Lui_host.repaint host);
  check "native pressed changes replan the retained control"
    (!plans > before_press)
