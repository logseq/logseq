(* Shared pieces of the imperative popup/overlay systems: the document
   outside-press listener and the named-layer z-order. *)

(* index of the first stack element whose DOM subtree contains the press
   target — None when the press lands outside every open element *)
let hit_index els target =
  List.find_index (fun el -> Web_dom.el_contains el target) els

(* fire `on_hit` on document `event` with the index into `els ()` of the
   topmost open element containing the press target — None when the
   press is outside every open element; skipped while the stack is
   empty *)
let on_document_press event ~els ~on_hit =
  Web_dom.add_document_listener event
    (fun ev ->
      match Web_dom.ev_target ev with
      | None -> ()
      | Some target ->
          let els = els () in
          if els <> [] then on_hit (hit_index els target))
    true

(* named-layer z-order (cljs shui modal stack): most recently touched
   layer renders on top — z = base + position in the order list *)
let touch order id = order := List.filter (( <> ) id) !order @ [ id ]

let release order id = order := List.filter (( <> ) id) !order

let z_index ~base order id =
  let rec go i = function
    | [] -> 0
    | x :: rest -> if x = id then i else go (i + 1) rest
  in
  base + go 0 !order
