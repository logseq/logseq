(* FSRS-6 scheduler — port of open-spaced-repetition/cljc-fsrs
   @eeef352 (deps.edn pin), consumed by cljs fsrs.cljs.

   Mirrors card.cljc + parameters.cljc + scheduler.cljc. Times are
   epoch milliseconds; intervals are whole days. *)

type rating = Again | Hard | Good | Easy
type card_state = New | Learning | Review | Relearning

type card =
  { due : int64
  ; stability : float
  ; difficulty : float
  ; elapsed_days : int
  ; scheduled_days : int
  ; reps : int
  ; lapses : int
  ; cstate : card_state
  ; last_repeat : int64
  }

let new_card ~now =
  { due = now
  ; stability = 0.
  ; difficulty = 0.
  ; elapsed_days = 0
  ; scheduled_days = 0
  ; reps = 0
  ; lapses = 0
  ; cstate = New
  ; last_repeat = now
  }

(* parameters.cljc default-params *)
let weights =
  [| 0.4; 0.6; 2.4; 5.8; 4.93; 0.94; 0.86; 0.01; 1.49; 0.14; 0.94; 2.18
   ; 0.05; 0.34; 1.26; 0.29; 2.61 |]

let request_retention = 0.9
let max_interval = 36500

let rating_idx = function Again -> 1 | Hard -> 2 | Good -> 3 | Easy -> 4

let rating_of_string = function
  | "again" -> Some Again
  | "hard" -> Some Hard
  | "good" -> Some Good
  | "easy" -> Some Easy
  | _ -> None

let string_of_rating = function
  | Again -> "again"
  | Hard -> "hard"
  | Good -> "good"
  | Easy -> "easy"

let state_of_string = function
  | "learning" -> Learning
  | "review" -> Review
  | "relearning" -> Relearning
  | _ -> New

let string_of_state = function
  | New -> "new"
  | Learning -> "learning"
  | Review -> "review"
  | Relearning -> "relearning"

(* parameters.cljc *)

let init_difficulty r =
  weights.(4) -. (weights.(5) *. float_of_int (rating_idx r - 3))

let init_stability r = Float.max 0.1 weights.(rating_idx r - 1)

let retrievability ~elapsed_days ~stability =
  Float.pow (1. +. (float_of_int elapsed_days /. (stability *. 9.))) (-1.)

let constrain_difficulty d = Float.min 10. (Float.max 1. d)

let mean_reversion d =
  (weights.(7) *. weights.(4)) +. ((1. -. weights.(7)) *. d)

let next_difficulty d r =
  constrain_difficulty
    (mean_reversion (d -. (weights.(6) *. float_of_int (rating_idx r - 3))))

let next_stability d s ret r =
  let recall_factor =
    Float.exp weights.(8)
    *. (11. -. d)
    *. Float.pow s (-.weights.(9))
    *. (Float.exp (weights.(10) *. (1. -. ret)) -. 1.)
  in
  match r with
  | Again ->
      Float.min
        (weights.(11)
        *. Float.pow d (-.weights.(12))
        *. (Float.pow (1. +. s) weights.(13) -. 1.)
        *. Float.exp (weights.(14) *. (1. -. ret)))
        s
  | Hard -> s *. (1. +. (recall_factor *. weights.(15)))
  | Good -> s *. (1. +. recall_factor)
  | Easy -> s *. (1. +. (recall_factor *. weights.(16)))

let next_interval s =
  let iv = s *. 9. *. ((1. /. request_retention) -. 1.) in
  Float.max 1. (Float.min (float_of_int max_interval) (Float.round iv))
  |> int_of_float

let ms_per_minute = 60_000L
let ms_per_day = 86_400_000L
let in_minutes ~now n = Int64.add now (Int64.mul ms_per_minute (Int64.of_int n))
let in_days ~now n = Int64.add now (Int64.mul ms_per_day (Int64.of_int n))

(* card.cljc repeat-card! -> scheduler/next-repeat-schedule: all four
   rating outcomes computed at once. *)
let schedule ~now card =
  let base =
    { card with
      reps = card.reps + 1
    ; elapsed_days =
        Int64.(to_int (div (sub now card.last_repeat) ms_per_day))
    ; last_repeat = now
    }
  in
  (* calculate-lapses: :again forgot the card *)
  let again0 = { base with lapses = base.lapses + 1 } in
  let hard0 = base and good0 = base and easy0 = base in
  (* calculate-state *)
  let st s c = { c with cstate = s } in
  let again1, hard1, good1, easy1 =
    match base.cstate with
    | New ->
        ( st Learning again0, st Learning hard0
        , st Learning good0, st Review easy0 )
    | Learning | Relearning ->
        (again0, hard0, st Review good0, st Review easy0)
    | Review -> (st Relearning again0, hard0, good0, easy0)
  in
  (* calculate-difficulty-stability *)
  let again2, hard2, good2, easy2 =
    match base.cstate with
    | New ->
        ( { again1 with
            difficulty = init_difficulty Again
          ; stability = init_stability Again }
        , { hard1 with
            difficulty = init_difficulty Hard
          ; stability = init_stability Hard }
        , { good1 with
            difficulty = init_difficulty Good
          ; stability = init_stability Good }
        , { easy1 with
            difficulty = init_difficulty Easy
          ; stability = init_stability Easy } )
    | Learning | Relearning -> (again1, hard1, good1, easy1)
    | Review ->
        let ret =
          retrievability ~elapsed_days:base.elapsed_days
            ~stability:base.stability
        in
        ( { again1 with
            difficulty = next_difficulty base.difficulty Again
          ; stability =
              next_stability base.difficulty base.stability ret Again }
        , { hard1 with
            difficulty = next_difficulty base.difficulty Hard
          ; stability =
              next_stability base.difficulty base.stability ret Hard }
        , { good1 with
            difficulty = next_difficulty base.difficulty Good
          ; stability =
              next_stability base.difficulty base.stability ret Good }
        , { easy1 with
            difficulty = next_difficulty base.difficulty Easy
          ; stability =
              next_stability base.difficulty base.stability ret Easy } )
  in
  (* calculate-due *)
  let sd n c = { c with scheduled_days = n } in
  match base.cstate with
  | New ->
      let easy_iv = next_interval easy2.stability in
      ( { again2 with due = in_minutes ~now 1 } |> sd 0
      , { hard2 with due = in_minutes ~now 5 } |> sd 0
      , { good2 with due = in_minutes ~now 10 } |> sd 0
      , { easy2 with due = in_days ~now easy_iv } |> sd easy_iv )
  | Learning | Relearning ->
      let good_iv = next_interval good2.stability in
      let easy_iv = max (good_iv + 1) (next_interval easy2.stability) in
      ( { again2 with due = in_minutes ~now 5 } |> sd 0
      , { hard2 with due = in_minutes ~now 10 } |> sd 0
      , { good2 with due = in_days ~now good_iv } |> sd good_iv
      , { easy2 with due = in_days ~now easy_iv } |> sd easy_iv )
  | Review ->
      let hard_iv = next_interval hard2.stability in
      let good_iv = next_interval good2.stability in
      let hard_iv = min hard_iv good_iv in
      let good_iv = max good_iv (hard_iv + 1) in
      let easy_iv = max (next_interval easy2.stability) (good_iv + 1) in
      ( { again2 with due = in_minutes ~now 5 } |> sd 0
      , { hard2 with due = in_days ~now hard_iv } |> sd hard_iv
      , { good2 with due = in_days ~now good_iv } |> sd good_iv
      , { easy2 with due = in_days ~now easy_iv } |> sd easy_iv )

let pick (a, h, g, e) = function
  | Again -> a
  | Hard -> h
  | Good -> g
  | Easy -> e

let next_card ~now card rating =
  pick (schedule ~now card) rating

(* cljs util/human-time {:ago? false} — "5 minutes", "1 day", ... *)
let human_due ~now due_ms =
  let units =
    [ ("second", 60., 1.)
    ; ("minute", 3600., 60.)
    ; ("hour", 86400., 3600.)
    ; ("day", 604800., 86400.)
    ; ("week", 2629743., 604800.)
    ; ("month", 31556926., 2629743.)
    ; ("year", Float.max_float, 31556926.) ]
  in
  let diff = Int64.(to_float (sub due_ms now)) /. 1000. in
  if diff < 5. then Printf.sprintf "%dseconds" (int_of_float diff)
  else
    let rec find = function
      | [] -> ("year", Float.max_float, 31556926.)
      | ((_, limit, _) as u) :: rest ->
          if diff >= limit then find rest else u
    in
    let name, _, in_sec = find units in
    let n = int_of_float (Float.floor (diff /. in_sec)) in
    Printf.sprintf "%d %s%s" n name (if n > 1 then "s" else "")

(* due label per rating, in ratings order — for the rating buttons *)
let due_labels ~now card =
  let sched = schedule ~now card in
  List.map
    (fun r -> human_due ~now (pick sched r).due)
    [ Again; Hard; Good; Easy ]

(* ---------- property-map wire codec ----------

   cljs fsrs.cljs fsrs-card-map->property-fsrs-state: instants become
   inst-ms numbers; the map goes into :logseq.property.fsrs/state minus
   :due, plus :logseq/last-rating. Keys are transit keywords. *)

let wire_num i = Wire.Int64 (Int64.of_int i)
let wire_f f = Wire.Float f

let state_wire ~rating card =
  let kw k v = (Wire.Keyword k, v) in
  Wire.Map
    [ kw "due" (wire_num (Int64.to_int card.due))
    ; kw "stability" (wire_f card.stability)
    ; kw "difficulty" (wire_f card.difficulty)
    ; kw "elapsed-days" (wire_num card.elapsed_days)
    ; kw "scheduled-days" (wire_num card.scheduled_days)
    ; kw "reps" (wire_num card.reps)
    ; kw "lapses" (wire_num card.lapses)
    ; kw "state" (Wire.Keyword (string_of_state card.cstate))
    ; kw "last-repeat" (wire_num (Int64.to_int card.last_repeat))
    ; kw "logseq/last-rating" (Wire.Keyword (string_of_rating rating))
    ]

let ms_of_wire = function
  | Wire.Int n -> Some (Int64.of_int n)
  | Wire.Int64 n -> Some n
  | Wire.Float f -> Some (Int64.of_float f)
  | Wire.Date_ms ms -> Some ms
  | _ -> None

let card_of_property_wire state_w due_w ~created_at ~now =
  match state_w, due_w with
  | Wire.Map _ as m, Some due -> (
      let num k = Option.bind (Wire.get m k) ms_of_wire |> Option.value ~default:0L in
      let flt k =
        match Wire.get m k with
        | Some (Wire.Float f) -> f
        | Some (Wire.Int n) -> float_of_int n
        | Some (Wire.Int64 n) -> Int64.to_float n
        | _ -> 0.
      in
      let state =
        match Wire.get m "state" with
        | Some (Wire.Keyword s) -> state_of_string s
        | Some (Wire.String s) -> state_of_string s
        | _ -> New
      in
      Some
        { due
        ; stability = flt "stability"
        ; difficulty = flt "difficulty"
        ; elapsed_days = Int64.to_int (num "elapsed-days")
        ; scheduled_days = Int64.to_int (num "scheduled-days")
        ; reps = Int64.to_int (num "reps")
        ; lapses = Int64.to_int (num "lapses")
        ; cstate = state
        ; last_repeat = num "last-repeat"
        })
  | _ ->
      (* get-card-map fallback: fresh card anchored at created-at *)
      let anchor = Option.value created_at ~default:now in
      Some { (new_card ~now:anchor) with due = anchor }
