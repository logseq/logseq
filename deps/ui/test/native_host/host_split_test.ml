open Lui_protocol
open Lui_scene

let check name value = if not value then failwith name
let close a b = Float.abs (a -. b) < 0.000001

let fixture scale side =
  let store = Lui_store.create () and rects = Lui_window.Rects.create () in
  let identifier = match side with `Left -> "left-sidebar-split" | `Right -> "right-sidebar-split" in
  Lui_store.apply_batch store { generation = 1; ops =
      [ CreateNode (1, Split); CreateNode (2, Box); CreateNode (3, Box)
      ; SetProp (1, AccessibilityIdentifier, StringValue identifier)
      ; SetProp (1, ProgressValue, FloatValue (if side = `Left then 246. /. 1280. else 0.6))
      ; InsertChild (1, 2, 0); InsertChild (1, 3, 1) ] };
  let boundary = if side = `Left then 246. else 768. in
  let put id x y w h = Hashtbl.replace rects id
      (rect (x *. scale) (y *. scale) (w *. scale) (h *. scale)) in
  put 1 0. 48. 1280. 852.;
  put 2 0. 48. boundary 852.;
  put 3 boundary 48. (1280. -. boundary) 852.;
  store, rects

let () =
  List.iter (fun scale ->
      let store, rects = fixture scale `Left in
      let state = Host_split.create () in
      check "the reference left grip overlaps the pane edge rather than consuming layout"
        (Host_split.pick store rects ~scale ~hit:3 ~x:246. ~y:450. <> None);
      check "ordinary content is not a split handle"
        (Host_split.pick store rects ~scale ~hit:3 ~x:300. ~y:450. = None);
      check "left pointer capture starts on the actual retained grip"
        (Host_split.start state store rects ~scale ~hit:3 ~x:246. ~y:450.);
      check "left drag preserves the reference handle's grabbed offset"
        (match Host_split.move state store rects ~scale ~x:310. with
         | Some (ValueChanged (1, value)) -> close (value *. 1280.) 309.
         | _ -> false);
      check "pointer capture survives leaving the grip"
        (Host_split.active state);
      check "release ends only the captured gesture" (Host_split.release state);
      check "released motion cannot resize a sidebar"
        (Host_split.move state store rects ~scale ~x:400. = None);
      Lui_store.apply_batch store { generation = 2; ops =
          [ SetProp (1, ProgressValue, FloatValue 0.0001) ] };
      check "closed panes are not draggable through stale geometry"
        (Host_split.pick store rects ~scale ~hit:3 ~x:246. ~y:450. = None);
      let right_store, right_rects = fixture scale `Right in
      check "the right grip uses the sidebar's inside edge"
        (Host_split.start state right_store right_rects ~scale ~hit:3 ~x:770. ~y:450.);
      check "right drag follows the reference viewport-pointer fraction"
        (match Host_split.move state right_store right_rects ~scale ~x:720. with
         | Some (ValueChanged (1, value)) -> close value 0.5625
         | _ -> false);
      Lui_store.apply_batch right_store { generation = 3; ops = [ DropNode 1 ] };
      check "a removed owner cancels capture"
        (Host_split.move state right_store right_rects ~scale ~x:700. = None
         && not (Host_split.active state));
      let popup_store, popup_rects = fixture scale `Left in
      Lui_store.apply_batch popup_store { generation = 4; ops =
          [ CreateNode (4, Popover); CreateNode (5, Box)
          ; InsertChild (2, 4, 0); InsertChild (4, 5, 0) ] };
      check "a presented popup does not resize a split behind it"
        (Host_split.pick popup_store popup_rects ~scale ~hit:5 ~x:246. ~y:450. = None))
    [ 1.; 2. ];
  print_endline "native split gestures: OK"
