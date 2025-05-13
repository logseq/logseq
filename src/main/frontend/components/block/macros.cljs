(ns frontend.components.block.macros
  "Logseq macros that render and evaluate in blocks"
  (:require [clojure.walk :as walk]
            [frontend.extensions.sci :as sci]
            [frontend.handler.common :as common-handler]
            [goog.string :as gstring]
            [goog.string.format]
            [frontend.state :as state]
            [frontend.config :as config]
            [datascript.core :as d]
            [logseq.db.frontend.property :as db-property]
            [frontend.db.conn :as db-conn]))

(defn- properties-by-name
  "Given a block from a query result, returns a map of its properties indexed by
  property idents and titles"
  [db block]
  (->> (db-property/properties block)
       (mapcat (fn [[k v]]
                 ;; For now just support cardinality :one
                 (when-not (set? v)
                   (let [prop-val (some->> (:db/id v)
                                           (d/entity db)
                                           db-property/property-value-content)
                         property (d/entity db k)]
                     [[(keyword (:block/title property)) prop-val]
                      [(:db/ident property) prop-val]]))))
       (into {})))

(defn- normalize-query-function
  [ast* repo result]
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
             ast*)
        db-based-graph? (config/db-based-graph? repo)
        ;; These keyword aliases should be the same as those used in the query-table for sorting
        special-file-graph-keywords
        {:block :block/title
         :page :block/name
         :created-at :block/created-at
         :updated-at :block/updated-at}]
    (walk/postwalk
     (fn [f]
       (cond
         (keyword? f)
         (if-let [kw (and (not db-based-graph?) (get special-file-graph-keywords f))]
           kw
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
        repo (state/get-current-repo)
        db (db-conn/get-db repo)
        query-result' (if (config/db-based-graph? repo)
                        (->> query-result
                             (map #(d/entity db (:db/id %)))
                             (map #(hash-map :block/properties (properties-by-name db %))))
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
