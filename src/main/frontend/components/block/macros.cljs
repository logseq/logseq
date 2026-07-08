(ns frontend.components.block.macros
  "Logseq macros that render and evaluate in blocks"
  (:require [clojure.walk :as walk]
            [frontend.extensions.sci :as sci]
            [frontend.handler.common :as common-handler]
            [goog.string :as gstring]
            [goog.string.format]
            [logseq.db.frontend.property :as db-property]))

(defn- properties-by-name
  "Given a block from a query result, returns a map of its properties indexed by
  property idents and titles"
  [block]
  (->> (db-property/properties block)
       (mapcat (fn [[k v]]
	                 ;; For now just support cardinality :one
	                 (when-not (set? v)
	                   (let [prop-val (if (map? v)
	                                    (db-property/property-value-content v)
	                                    v)
	                         property-title (or (get-in db-property/built-in-properties [k :title])
	                                            (name k))]
	                     [[(keyword property-title) prop-val]
	                      [k prop-val]]))))
       (into {})))

(defn- normalize-query-function
  [ast* result]
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
             ast*)]
    (walk/postwalk
     (fn [f]
       (cond
         (keyword? f)
         (let [vals (map #(get-in % [:block/properties f]) result)
               int? (some integer? vals)]
           `(~'fn [~'b]
                  (~'let [~'result-str (~'get-in ~'b [:block/properties ~f])
                          ~'result-num (~'parseFloat ~'result-str)
                          ~'result (if (~'isNaN ~'result-num) ~'result-str ~'result-num)]
                         (~'or ~'result (~'when ~int? 0)))))

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
        query-result' (->> query-result
	                           (map #(hash-map :block/properties (properties-by-name %))))
        fn-string (-> (gstring/format "(fn [result] %s)" (first arguments))
                      (common-handler/safe-read-string "failed to parse function")
                      (normalize-query-function query-result')
                      (str))
        f (sci/eval-string fn-string)]
    (when (fn? f)
      (try (f query-result')
           (catch :default e
             (js/console.error e))))))
