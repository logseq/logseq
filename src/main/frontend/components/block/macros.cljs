(ns frontend.components.block.macros
  "Logseq macros that render and evaluate in blocks"
  (:require [clojure.walk :as walk]
            [frontend.extensions.sci :as sci]
            [frontend.handler.common :as common-handler]
            [frontend.handler.db-based.property.util :as db-pu]
            [goog.string :as gstring]
            [goog.string.format]
            [frontend.state :as state]
            [frontend.config :as config]))

(defn- normalize-query-function
  [ast repo result]
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
           :block/title

           :page
           :block/name

           :created-at
           :block/created-at

           :updated-at
           :block/updated-at

           (let [prop-key (if (config/db-based-graph? repo) (name f) f)
                 vals (map #(get-in % [:block/properties prop-key]) result)
                 int? (some integer? vals)]
             `(~'fn [~'b]
                    (~'let [~'result-str (~'get-in ~'b [:block/properties ~prop-key])
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
        repo (state/get-current-repo)
        query-result' (if (config/db-based-graph? repo)
                       (map #(assoc % :block/properties (db-pu/properties-by-name repo %)) query-result)
                       query-result)
        fn-string (-> (gstring/format "(fn [result] %s)" (first arguments))
                      (common-handler/safe-read-string "failed to parse function")
                      (normalize-query-function repo query-result')
                      (str))
        f (sci/eval-string fn-string)]
    (when (fn? f)
      (try (f query-result')
           (catch :default e
             (js/console.error e))))))
