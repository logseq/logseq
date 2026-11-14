type zone = Top | Nested | Sibling
type 'block target = 'block * zone
type 'block drop = 'block * 'block * zone

type ('context, 'block) gesture =
  | Idle
  | Armed of 'context * 'block * float * float
  | Active of 'context * 'block * 'block target option

type ('context, 'block) t =
  { gesture : ('context, 'block) gesture; suppress_click : bool }

let empty = { gesture = Idle; suppress_click = false }

let arm ~context ~source ~x ~y =
  { gesture = Armed (context, source, x, y); suppress_click = false }

let source state =
  match state.gesture with
  | Idle -> None
  | Armed (_, source, _, _) | Active (_, source, _) -> Some source

let preview state =
  match state.gesture with
  | Active (_, source, target) -> Some (source, target)
  | Idle | Armed _ -> None

let cancel state =
  { gesture = Idle;
    suppress_click = state.suppress_click || state.gesture <> Idle }

let move ~context ~x ~y ~target state =
  match state.gesture with
  | Idle -> state
  | Armed (owner, _, _, _) | Active (owner, _, _) when owner <> context ->
      cancel state
  | Armed (owner, source, x0, y0) ->
      let dx = x -. x0 and dy = y -. y0 in
      if dx *. dx +. dy *. dy < 16. then state
      else { state with gesture = Active (owner, source, target) }
  | Active (owner, source, _) ->
      { state with gesture = Active (owner, source, target) }

let release ~context ~target state =
  match state.gesture with
  | Active (owner, source, _) ->
      let drop =
        if owner = context then
          Option.map (fun (target, zone) -> source, target, zone) target
        else None
      in
      cancel state, drop
  | Idle -> state, None
  | Armed _ -> empty, None

let consume_click state =
  let state = cancel state in
  empty, state.suppress_click

let zone ~first ~left ~top ~x ~y =
  if first && Float.abs (y -. top) <= 16. then Top
  else if x -. left > 50. then Nested
  else Sibling

let zone_name = function Top -> "top" | Nested -> "nested" | Sibling -> "sibling"
