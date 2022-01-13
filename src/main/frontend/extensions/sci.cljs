(ns frontend.extensions.sci
  (:require [sci.core :as sci]))

;; Some helpers
(def sum (partial apply +))

(defn average [coll]
  (/ (reduce + coll) (count coll)))

(defn eval-string
  [s]
  (try
    (sci/eval-string s {:bindings {'sum sum
                                   'average average
                                   'parseFloat js/parseFloat
                                   'isNaN js/isNaN}})
    (catch js/Error e
      (println "Query: sci eval failed:")
      (js/console.error e))))

(defn call-fn
  [f & args]
  (apply f args))

(defn eval-result
  [code]
  [:div
   [:code "Results:"]
   [:div.results.mt-1
    [:pre.code
     (let [result (eval-string code)]
       (str result))]]])
