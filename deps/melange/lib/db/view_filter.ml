type number_operator = Gt | Gte | Lt | Lte

let any predicate values =
  Rrbvec.fold_left (fun result value -> result || predicate value) false values

let all predicate values =
  Rrbvec.fold_left (fun result value -> result && predicate value) true values

let contains text pattern =
  let text_length = String.length text in
  let pattern_length = String.length pattern in
  let rec loop index =
    if pattern_length = 0 then true
    else if index + pattern_length > text_length then false
    else if String.sub text index pattern_length = pattern then true
    else loop (index + 1)
  in
  loop 0

let text_contains values pattern =
  any (fun value -> contains value pattern) values

let text_not_contains values pattern =
  all (fun value -> not (contains value pattern)) values

let number_match operator values target =
  let predicate =
    match operator with
    | Gt -> fun value -> value > target
    | Gte -> fun value -> value >= target
    | Lt -> fun value -> value < target
    | Lte -> fun value -> value <= target
  in
  any predicate values

let between values ~start ~end_ =
  any
    (fun value ->
      Option.fold ~none:true ~some:(fun start -> start <= value) start
      && Option.fold ~none:true ~some:(fun end_ -> value <= end_) end_)
    values

let boolean_match ~negated ~value ~expected =
  if negated then value <> expected else value = expected

let empty_match ~negated ~empty = if negated then not empty else empty

let membership_match ~negated ~match_empty ~hit =
  if match_empty then true else if negated then not hit else hit

let timestamp_match ~before ~value ~target =
  match (value, target) with
  | None, _ -> false
  | Some _, None -> true
  | Some value, Some target ->
      if before then value <= target else value >= target

let combine ~or_ results =
  if or_ then any Fun.id results else all Fun.id results
