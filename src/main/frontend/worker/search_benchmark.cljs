(ns frontend.worker.search-benchmark
  "Small benchmark helpers for comparing worker search result quality."
  (:require [promesa.core :as p]))

(defn- result-id
  [result]
  (if (map? result)
    (:id result)
    result))

(defn- hits-within
  [result-ids expected-ids k]
  (let [top-ids (set (take k result-ids))]
    (count (filter top-ids expected-ids))))

(defn score-results
  [results expected-ids top-k]
  (let [result-ids (mapv result-id results)
        expected-ids (vec expected-ids)
        expected-set (set expected-ids)
        matched-ids (filterv (set result-ids) expected-ids)
        hits-at-k (hits-within result-ids expected-ids top-k)
        precision-denominator (min top-k (count expected-ids))
        precision-at-k (if (pos? precision-denominator)
                         (/ hits-at-k precision-denominator)
                         0)
        recall (if (seq expected-ids)
                 (/ (count matched-ids) (count expected-ids))
                 0)
        recall-at-1 (if (seq expected-ids)
                      (/ (hits-within result-ids expected-ids 1) (count expected-ids))
                      0)
        recall-at-3 (if (seq expected-ids)
                      (/ (hits-within result-ids expected-ids 3) (count expected-ids))
                      0)
        recall-at-5 (if (seq expected-ids)
                      (/ (hits-within result-ids expected-ids 5) (count expected-ids))
                      0)
        first-match-rank (some (fn [[idx id]]
                                 (when (expected-set id)
                                   (inc idx)))
                               (map-indexed vector result-ids))
        mrr (if first-match-rank
              (/ 1 first-match-rank)
              0)
        f1 (if (pos? (+ precision-at-k recall))
             (/ (* 2 precision-at-k recall)
                (+ precision-at-k recall))
             0)]
    {:precision-at-k precision-at-k
     :recall recall
     :recall-at-1 recall-at-1
     :recall-at-3 recall-at-3
     :recall-at-5 recall-at-5
     :mrr mrr
     :f1 f1
     :hits-at-k hits-at-k
     :matched-ids matched-ids
     :unmatched-expected-ids (filterv (complement (set matched-ids)) expected-ids)}))

(defn- run-backend-case
  [{search :search backend-id :id} {:keys [expected-ids expected-in-top-k] :as benchmark-case}]
  (let [start (.now js/Date)]
    (-> (search benchmark-case)
        (p/then (fn [results]
                  (assoc (score-results results expected-ids (or expected-in-top-k 5))
                         :case-id (:id benchmark-case)
                         :backend-id backend-id
                         :query (:query benchmark-case)
                         :latency-ms (- (.now js/Date) start)
                         :result-ids (mapv result-id results)))))))

(defn- avg
  [values]
  (let [values (vec values)]
    (if (seq values)
      (/ (reduce + values) (count values))
      0)))

(defn- summarize-backend
  [results]
  {:avg-precision-at-k (avg (map :precision-at-k results))
   :avg-recall (avg (map :recall results))
   :avg-recall-at-1 (avg (map :recall-at-1 results))
   :avg-recall-at-3 (avg (map :recall-at-3 results))
   :avg-recall-at-5 (avg (map :recall-at-5 results))
   :avg-mrr (avg (map :mrr results))
   :avg-f1 (avg (map :f1 results))
   :avg-latency-ms (avg (map :latency-ms results))})

(defn summarize-results
  [results]
  (->> results
       (group-by :backend-id)
       (map (fn [[backend-id backend-results]]
              [backend-id (summarize-backend backend-results)]))
       (into {})))

(defn run-benchmark
  [cases backends]
  (p/let [results (p/all
                   (for [benchmark-case cases
                         backend backends]
                     (run-backend-case backend benchmark-case)))]
    {:results (vec results)
     :summary (summarize-results results)}))
