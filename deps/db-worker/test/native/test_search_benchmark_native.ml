(* cljs -> ocaml translation, 1:1:
   src/test/frontend/worker/search_benchmark_test.cljs (2 deftests)

   Ports lib/search_benchmark.ml (cljs frontend.worker.search-benchmark)
   — retrieval metrics over search results. cljs deftest names are kept
   as OCaml test names. The cljs async-done wrapper is a plain
   Db_worker_effect await here. *)

let check (name : string) (ok : bool) =
  Alcotest.(check bool) name true ok

let await (t : 'a Db_worker_effect.t) : 'a =
  let result = ref None in
  Db_worker_effect.on_any t
    (fun v -> result := Some (Ok v))
    (fun e -> result := Some (Error e));
  match !result with
  | Some (Ok v) -> v
  | Some (Error e) -> raise e
  | None -> failwith "task still pending"

(* (deftest score-results-computes-retrieval-metrics-test ...) *)
let test_score_results_computes_retrieval_metrics () =
  let score =
    Search_benchmark.score_results
      [ Wire.String "wrong"
      ; Wire.String "expected-b"
      ; Wire.String "expected-a"
      ]
      [ Wire.String "expected-a"; Wire.String "expected-b" ]
      3
  in
  check "precision-at-k" (score.Search_benchmark.precision_at_k = 1.);
  check "recall" (score.recall = 1.);
  check "recall-at-1" (score.recall_at_1 = 0.);
  check "recall-at-3" (score.recall_at_3 = 1.);
  check "recall-at-5" (score.recall_at_5 = 1.);
  check "mrr" (score.mrr = 0.5);
  check "f1" (score.f1 = 1.);
  check "hits-at-k" (score.hits_at_k = 2);
  check "matched-ids"
    (score.matched_ids
    = [ Wire.String "expected-a"; Wire.String "expected-b" ]);
  check "unmatched-expected-ids" (score.unmatched_expected_ids = [])

(* (deftest run-benchmark-compares-backends-and-summarizes-test ...) *)
let test_run_benchmark_compares_backends_and_summarizes () =
  let cases : Wire.t list =
    [ Wire.kw_map
        [ "id", Wire.String "exact-title"
        ; "query", Wire.String "alpha"
        ; "expected-ids", Wire.Array [ Wire.String "a" ]
        ; "expected-in-top-k", Wire.Int 3
        ]
    ; Wire.kw_map
        [ "id", Wire.String "cross-block"
        ; "query", Wire.String "distributed idea"
        ; "expected-ids", Wire.Array [ Wire.String "b" ]
        ; "expected-in-top-k", Wire.Int 3
        ]
    ]
  in
  let id_map id = Wire.kw_map [ "id", Wire.String id ] in
  let case_id c =
    match Wire.get "id" c with
    | Some (Wire.String s) -> s
    | _ -> ""
  in
  let backends : Search_benchmark.backend list =
    [ { Search_benchmark.id = Wire.String "keyword"
      ; search =
          (fun c ->
            Db_worker_effect.pure
              (match case_id c with
               | "exact-title" -> [ id_map "a" ]
               | "cross-block" -> [ id_map "wrong" ]
               | _ -> []))
      }
    ; { Search_benchmark.id = Wire.String "hybrid"
      ; search =
          (fun c ->
            Db_worker_effect.pure
              (match case_id c with
               | "exact-title" -> [ id_map "a" ]
               | "cross-block" -> [ id_map "b" ]
               | _ -> []))
      }
    ]
  in
  let results, summary = await (Search_benchmark.run_benchmark cases backends) in
  check "result count" (List.length results = 4);
  let summary_of id = List.assoc (Some (Wire.String id)) summary in
  let keyword_summary = summary_of "keyword" in
  let hybrid_summary = summary_of "hybrid" in
  check "keyword avg-recall-at-1"
    (keyword_summary.Search_benchmark.avg_recall_at_1 = 0.5);
  check "hybrid avg-recall-at-1"
    (hybrid_summary.avg_recall_at_1 = 1.);
  check "hybrid avg-mrr" (hybrid_summary.avg_mrr = 1.)

let cases =
  [ Alcotest.test_case "score-results-computes-retrieval-metrics-test" `Quick
      test_score_results_computes_retrieval_metrics
  ; Alcotest.test_case "run-benchmark-compares-backends-and-summarizes-test"
      `Quick test_run_benchmark_compares_backends_and_summarizes
  ]
