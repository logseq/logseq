(ns frontend.handler.query
  "Provides util handler fns for query"
  (:require [clojure.walk :as walk]))

(defn normalize-query-function
  [ast result]
  (let [ast (walk/prewalk
             (fn [f]
               (if (and (list? f)
                        (keyword? (second f))
                        (contains? #{'sum 'average 'count 'min 'max} (first f)))
                 (if (contains? #{'min 'max} (first f))
                   (list
                    'apply
                    (first f)
                    (list 'map (second f) 'result))
                   (list
                    (first f)
                    (list 'map (second f) 'result)))
                 f))
             ast)]
    (walk/postwalk
     (fn [f]
       (cond
         (keyword? f)
         (case f
           :block
           :block/content

           :page
           :block/name

           :created-at
           :block/created-at

           :updated-at
           :block/updated-at

           (let [vals (map #(get-in % [:block/properties f]) result)
                 int? (some integer? vals)]
             `(~'fn [~'b]
               (~'let [~'result-str (~'get-in ~'b [:block/properties ~f])
                       ~'result-num (~'parseFloat ~'result-str)
                       ~'result (if (~'isNaN ~'result-num) ~'result-str ~'result-num)]
                (~'or ~'result (~'when ~int? 0))))))

         :else
         f))
     ast)))
