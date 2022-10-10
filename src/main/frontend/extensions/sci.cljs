(ns frontend.extensions.sci
  (:require [sci.core :as sci]
            [frontend.util :as util]))

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
                                   'isNaN js/isNaN
                                   'log js/console.log
                                   'pprint util/pp-str}})
    (catch :default e
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