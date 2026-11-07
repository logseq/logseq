module D = Block_drag

let check label condition = if not condition then failwith label

let () =
  let context = "graph/page" in
  let target = Some ("target", D.Sibling) in
  let armed () = D.arm ~context ~source:"source" ~x:0. ~y:0. in
  let move ?(context = context) target state =
    D.move ~context ~x:5. ~y:0. ~target state
  in
  let active () = move target (armed ()) in
  let cases =
    [ "valid release", active (), context, target,
        Some ("source", "target", D.Sibling), true
    ; "left all targets", move None (active ()), context, None, None, true
    ; "release target differs", active (), context, Some ("other", D.Top),
        Some ("source", "other", D.Top), true
    ; "invalid release", active (), context, None, None, true
    ; "canceled gesture", D.cancel (active ()), context, target, None, true
    ; "graph changed", active (), "other-graph/page", target, None, true
    ; "context changed while moving", move ~context:"graph/other-page" target (active ()),
        context, target, None, true
    ; "plain bullet click", armed (), context, target, None, false
    ; "below distance threshold",
        D.move ~context ~x:2. ~y:2. ~target (armed ()), context, target, None, false
    ]
  in
  List.iter (fun (label, state, context, target, expected, suppressed) ->
    let next, drop = D.release ~context ~target state in
    check (label ^ ": move intent") (drop = expected);
    check (label ^ ": cleared preview") (D.preview next = None);
    let next, suppress = D.consume_click next in
    check (label ^ ": release click") (suppress = suppressed);
    let _, repeated = D.consume_click next in
    check (label ^ ": click suppression is consumed") (not repeated);
    let _, duplicate = D.release ~context ~target next in
    check (label ^ ": no duplicate move") (duplicate = None)) cases;
  check "leaving clears the preview target"
    (D.preview (move None (active ())) = Some ("source", None));
  print_endline "PASS block drag commits only a current active release"
