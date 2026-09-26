(* Port of frontend.worker.search-benchmark — benchmark helpers for
   comparing worker search result quality. Ids and case/backend fields
   are cljs values, carried as [Wire.t]. *)
open Db_worker_effect
open Db_worker_effect.Infix

type scores =
  { precision_at_k : float
  ; recall : float
  ; recall_at_1 : float
  ; recall_at_3 : float
  ; recall_at_5 : float
  ; mrr : float
  ; f1 : float
  ; hits_at_k : int
  ; matched_ids : Wire.t list
  ; unmatched_expected_ids : Wire.t list
  }

(* result-id — (if (map? result) (:id result) result) *)
let result_id (r : Wire.t) : Wire.t =
  match r with
  | Wire.Map _ -> (match Wire.get "id" r with Some id -> id | None -> Wire.Nil)
  | _ -> r

(* hits-within — count of expected ids found in (set (take k result-ids)) *)
let hits_within (result_ids : Wire.t list) (expected_ids : Wire.t list)
    (k : int) : int =
  let top = List.filteri (fun i _ -> i < k) result_ids in
  List.fold_left
    (fun n e -> if List.exists (fun x -> x = e) top then n + 1 else n)
    0 expected_ids

(* score-results *)
let score_results (results : Wire.t list) (expected_ids : Wire.t list)
    (top_k : int) : scores =
  let result_ids = List.map result_id results in
  let in_results x = List.exists (fun r -> r = x) result_ids in
  let matched_ids = List.filter in_results expected_ids in
  let hits_at_k = hits_within result_ids expected_ids top_k in
  let precision_denominator = min top_k (List.length expected_ids) in
  let precision_at_k =
    if precision_denominator > 0 then
      float_of_int hits_at_k /. float_of_int precision_denominator
    else 0.0
  in
  let expected_count = List.length expected_ids in
  let recall =
    if expected_count > 0 then
      float_of_int (List.length matched_ids) /. float_of_int expected_count
    else 0.0
  in
  let recall_at_k k =
    if expected_count > 0 then
      float_of_int (hits_within result_ids expected_ids k)
      /. float_of_int expected_count
    else 0.0
  in
  let first_match_rank =
    let rec go i = function
      | [] -> None
      | id :: tl ->
          if List.exists (fun e -> e = id) expected_ids then Some (i + 1)
          else go (i + 1) tl
    in
    go 0 result_ids
  in
  let mrr =
    match first_match_rank with
    | Some rank -> 1.0 /. float_of_int rank
    | None -> 0.0
  in
  let f1 =
    if precision_at_k +. recall > 0.0 then
      2.0 *. precision_at_k *. recall /. (precision_at_k +. recall)
    else 0.0
  in
  { precision_at_k
  ; recall
  ; recall_at_1 = recall_at_k 1
  ; recall_at_3 = recall_at_k 3
  ; recall_at_5 = recall_at_k 5
  ; mrr
  ; f1
  ; hits_at_k
  ; matched_ids
  ; unmatched_expected_ids =
      List.filter (fun e -> not (in_results e)) expected_ids
  }

type case_result =
  { scores : scores
  ; case_id : Wire.t option
  ; backend_id : Wire.t option
  ; query : Wire.t option
  ; latency_ms : float
  ; result_ids : Wire.t list
  }

(* benchmark cases are kw maps: {:id :query :expected-ids
   :expected-in-top-k?}; a backend is {id, search : case -> promise}. *)
type backend =
  { id : Wire.t
  ; search : Wire.t -> Wire.t list Db_worker_effect.t
  }

let wire_int (v : Wire.t option) : int option =
  match v with
  | Some (Wire.Int n) -> Some n
  | Some (Wire.Int64 n) -> Some (Int64.to_int n)
  | _ -> None

(* run-backend-case *)
let run_backend_case (backend : backend) (benchmark_case : Wire.t)
    : case_result Db_worker_effect.t =
  let expected_ids =
    match Wire.get "expected-ids" benchmark_case with
    | Some (Wire.Array xs) | Some (Wire.List xs) -> xs
    | _ -> []
  in
  let top_k =
    Option.value
      (wire_int (Wire.get "expected-in-top-k" benchmark_case))
      ~default:5
  in
  let start = Time.monotonic_now () in
  backend.search benchmark_case
  >>= fun results ->
  pure
    { scores = score_results results expected_ids top_k
    ; case_id = Wire.get "id" benchmark_case
    ; backend_id = Some backend.id
    ; query = Wire.get "query" benchmark_case
    ; latency_ms = Time.diff_monotonic_ms start (Time.monotonic_now ())
    ; result_ids = List.map result_id results
    }

type summary =
  { avg_precision_at_k : float
  ; avg_recall : float
  ; avg_recall_at_1 : float
  ; avg_recall_at_3 : float
  ; avg_recall_at_5 : float
  ; avg_mrr : float
  ; avg_f1 : float
  ; avg_latency_ms : float
  }

let avg (values : float list) : float =
  match values with
  | [] -> 0.0
  | xs -> List.fold_left ( +. ) 0.0 xs /. float_of_int (List.length xs)

(* summarize-backend *)
let summarize_backend (results : case_result list) : summary =
  { avg_precision_at_k =
      avg (List.map (fun r -> r.scores.precision_at_k) results)
  ; avg_recall = avg (List.map (fun r -> r.scores.recall) results)
  ; avg_recall_at_1 = avg (List.map (fun r -> r.scores.recall_at_1) results)
  ; avg_recall_at_3 = avg (List.map (fun r -> r.scores.recall_at_3) results)
  ; avg_recall_at_5 = avg (List.map (fun r -> r.scores.recall_at_5) results)
  ; avg_mrr = avg (List.map (fun r -> r.scores.mrr) results)
  ; avg_f1 = avg (List.map (fun r -> r.scores.f1) results)
  ; avg_latency_ms = avg (List.map (fun r -> r.latency_ms) results)
  }

(* summarize-results — group-by :backend-id *)
let summarize_results (results : case_result list)
    : (Wire.t option * summary) list =
  let rec add_to groups r =
    match groups with
    | [] -> [ (r.backend_id, [ r ]) ]
    | (k, rs) :: rest ->
        if k = r.backend_id then (k, r :: rs) :: rest
        else (k, rs) :: add_to rest r
  in
  let groups = List.fold_left add_to [] results in
  List.map
    (fun (backend_id, rs) -> (backend_id, summarize_backend (List.rev rs)))
    groups

(* run-benchmark — p/all over cases × backends *)
let run_benchmark (cases : Wire.t list) (backends : backend list)
    : (case_result list * (Wire.t option * summary) list) Db_worker_effect.t =
  all
    (List.concat_map
       (fun benchmark_case ->
         List.map
           (fun backend -> run_backend_case backend benchmark_case)
           backends)
       cases)
  >>= fun results -> pure (results, summarize_results results)
