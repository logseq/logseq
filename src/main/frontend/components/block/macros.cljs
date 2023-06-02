(ns frontend.components.block.macros
  "Logseq macros that render and evaluate in blocks"
  (:require [clojure.walk :as walk]
            [frontend.extensions.sci :as sci]
            [frontend.handler.common :as common-handler]
            [goog.string :as gstring]
            [goog.string.format]))

(defn- normalize-query-function
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
         ;; These keyword aliases should be the same as those used in the query-table for sorting
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

(defn function-macro
  "Provides functionality for {{function}}"
  [query-result* arguments]
  (let [query-result (if (map? query-result*)
                       ;; Ungroup results grouped by page in page view
                       (mapcat val query-result*)
                       query-result*)
        fn-string (-> (gstring/format "(fn [result] %s)" (first arguments))
                      (common-handler/safe-read-string "failed to parse function")
                      (normalize-query-function query-result)
                      (str))
        f (sci/eval-string fn-string)]
    (when (fn? f)
      (try (f query-result)
           (catch :default e
             (js/console.error e))))))