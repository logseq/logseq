(* frontend.worker.search-benchmark — benchmark helpers for comparing
   worker search result quality. cljs results/cases are untyped maps;
   ids are modelled as [Wire.t] (map -> :id, else the value itself). *)

open Db_worker_effect

(* result-id *)
let result_id (result : Wire.t) : Wire.t =
  match result with
  | Wire.Map _ -> Cljs_map.get result "id" |> Option.value ~default:Wire.Nil
  | _ -> result

let wire_mem (v : Wire.t) (xs : Wire.t list) : bool = List.mem v xs

(* hits-within *)
let hits_within (result_ids : Wire.t list) (expected_ids : Wire.t list)
    (k : int) : int =
  let top = List.filteri (fun i _ -> i < k) result_ids in
  List.length (List.filter (fun e -> wire_mem e top) expected_ids)

let take (n : int) (xs : 'a list) : 'a list =
  List.filteri (fun i _ -> i < n) xs

let float_div (a : int) (b : int) : float =
  if b = 0 then 0. else Float.of_int a /. Float.of_int b

type score =
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

(* score-results *)
let score_results (results : Wire.t list) (expected_ids : Wire.t list)
    (top_k : int) : score =
  let result_ids = List.map result_id results in
  let n_expected = List.length expected_ids in
  let matched_ids =
    List.filter (fun e -> wire_mem e result_ids) expected_ids
  in
  let hits_at_k = hits_within result_ids expected_ids top_k in
  let precision_denominator = min top_k n_expected in
  let precision_at_k =
    if precision_denominator > 0 then
      Float.of_int hits_at_k /. Float.of_int precision_denominator
    else 0.
  in
  let recall =
    if n_expected > 0 then
      Float.of_int (List.length matched_ids) /. Float.of_int n_expected
    else 0.
  in
  let recall_at_k k =
    if n_expected > 0 then
      Float.of_int (hits_within result_ids expected_ids k)
      /. Float.of_int n_expected
    else 0.
  in
  let first_match_rank =
    let rec go i = function
      | [] -> None
      | id :: rest ->
          if wire_mem id expected_ids then Some (i + 1) else go (i + 1) rest
    in
    go 0 result_ids
  in
  let mrr =
    match first_match_rank with
    | Some rank -> 1. /. Float.of_int rank
    | None -> 0.
  in
  let f1 =
    if precision_at_k +. recall > 0. then
      2. *. precision_at_k *. recall /. (precision_at_k +. recall)
    else 0.
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
      List.filter (fun e -> not (wire_mem e matched_ids)) expected_ids
  }

type backend =
  { id : string
  ; search : Wire.t -> Wire.t list Db_worker_effect.t
  }

type backend_score =
  { score : score
  ; case_id : Wire.t option
  ; backend_id : string
  ; query : Wire.t option
  ; latency_ms : float
  ; result_ids : Wire.t list
  }

(* run-backend-case *)
let run_backend_case (backend : backend) (benchmark_case : Wire.t)
    : backend_score Db_worker_effect.t =
  let start = Clock.now_ms () in
  let expected_ids =
    match Cljs_map.get benchmark_case "expected-ids" with
    | Some (Wire.Array xs | Wire.List xs) -> xs
    | _ -> []
  in
  let expected_in_top_k =
    match Cljs_map.get benchmark_case "expected-in-top-k" with
    | Some (Wire.Int k) -> k
    | Some (Wire.Int64 k) -> Int64.to_int k
    | _ -> 5
  in
  bind (backend.search benchmark_case) (fun results ->
      pure
        { score = score_results results expected_ids expected_in_top_k
        ; case_id = Cljs_map.get benchmark_case "id"
        ; backend_id = backend.id
        ; query = Cljs_map.get benchmark_case "query"
        ; latency_ms = Clock.now_ms () -. start
        ; result_ids = List.map result_id results
        })

(* avg *)
let avg (values : float list) : float =
  match values with
  | [] -> 0.
  | _ -> List.fold_left ( +. ) 0. values /. Float.of_int (List.length values)

type backend_summary =
  { avg_precision_at_k : float
  ; avg_recall : float
  ; avg_recall_at_1 : float
  ; avg_recall_at_3 : float
  ; avg_recall_at_5 : float
  ; avg_mrr : float
  ; avg_f1 : float
  ; avg_latency_ms : float
  }

let summarize_backend (results : backend_score list) : backend_summary =
  { avg_precision_at_k = avg (List.map (fun r -> r.score.precision_at_k) results)
  ; avg_recall = avg (List.map (fun r -> r.score.recall) results)
  ; avg_recall_at_1 = avg (List.map (fun r -> r.score.recall_at_1) results)
  ; avg_recall_at_3 = avg (List.map (fun r -> r.score.recall_at_3) results)
  ; avg_recall_at_5 = avg (List.map (fun r -> r.score.recall_at_5) results)
  ; avg_mrr = avg (List.map (fun r -> r.score.mrr) results)
  ; avg_f1 = avg (List.map (fun r -> r.score.f1) results)
  ; avg_latency_ms = avg (List.map (fun r -> r.latency_ms) results)
  }

(* summarize-results — group-by :backend-id, preserving first-seen
   backend order like cljs group-by into {} *)
let summarize_results (results : backend_score list)
    : (string * backend_summary) list =
  let order = ref [] and tbl : (string, backend_score list) Hashtbl.t =
    Hashtbl.create 7
  in
  List.iter
    (fun (r : backend_score) ->
      (match Hashtbl.find_opt tbl r.backend_id with
       | None ->
           order := !order @ [ r.backend_id ];
           Hashtbl.replace tbl r.backend_id [ r ]
       | Some rs -> Hashtbl.replace tbl r.backend_id (rs @ [ r ])))
    results;
  List.map (fun id -> (id, summarize_backend (Hashtbl.find tbl id))) !order

type benchmark_result =
  { results : backend_score list
  ; summary : (string * backend_summary) list
  }

(* run-benchmark — p/all over the cases x backends cross product *)
let run_benchmark (cases : Wire.t list) (backends : backend list)
    : benchmark_result Db_worker_effect.t =
  let tasks =
    List.concat_map
      (fun benchmark_case ->
        List.map (fun backend -> run_backend_case backend benchmark_case)
          backends)
      cases
  in
  bind (all tasks) (fun results ->
      pure { results; summary = summarize_results results })
