(ns frontend.components.query.result
  "Query result related functionality for query components"
  (:require [frontend.db.utils :as db-utils]
            [frontend.search :as search]
            [frontend.db :as db]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.state :as state]
            [logseq.graph-parser.util :as gp-util]
            [frontend.util :as util]
            [clojure.string :as string]
            [promesa.core :as p]
            [rum.core :as rum]
            [frontend.modules.outliner.tree :as tree]))

(defn trigger-custom-query!
  [state *query-error *query-triggered?]
  (let [[config query] (:rum/args state)
        repo (state/get-current-repo)
        result-atom (atom nil)
        current-block-uuid (or (:block/uuid (:block config))
                               (:block/uuid config))
        _ (reset! *query-error nil)
        query-atom (try
                     (cond
                       (:dsl-query? config)
                       (let [q (:query query)
                             form (gp-util/safe-read-string q)]
                         (cond
                           ;; Searches like 'foo' or 'foo bar' come back as symbols
                           ;; and are meant to go directly to full text search
                           (and (util/electron?) (symbol? form)) ; full-text search
                           (p/let [blocks (search/block-search repo (string/trim (str form)) {:limit 30})]
                             (when (seq blocks)
                               (let [result (db/pull-many (state/get-current-repo) '[*] (map (fn [b] [:block/uuid (uuid (:block/uuid b))]) blocks))]
                                 (reset! result-atom result))))

                           (symbol? form)
                           (atom nil)

                           :else
                           (query-dsl/query (state/get-current-repo) q)))

                       :else
                       (db/custom-query query {:current-block-uuid current-block-uuid}))
                     (catch :default e
                       (reset! *query-error e)
                       (atom nil)))]
    (when *query-triggered?
      (reset! *query-triggered? true))
    (if (instance? Atom query-atom)
      query-atom
      result-atom)))

(defn get-group-by-page [{:keys [result-transform query] :as q}
                         {:keys [table?]}]
  (if table?
    false ;; Immediately return false as table view can't handle grouping
    (get q :group-by-page?
         (and (not result-transform)
              (not (and (string? query) (string/includes? query "(by-page false)")))))))

(defn get-query-result
  [state config *query-error *query-triggered? current-block-uuid q options]
  (or (when-let [*result (:query-result config)] @*result)
      (let [query-atom (trigger-custom-query! state *query-error *query-triggered?)
            query-result (and query-atom (rum/react query-atom))
            ;; exclude the current one, otherwise it'll loop forever
            remove-blocks (if current-block-uuid [current-block-uuid] nil)
            transformed-query-result (when query-result
                                       (let [result (db/custom-query-result-transform query-result remove-blocks q)]
                                         (if (and query-result (coll? result) (:block/uuid (first result)))
                                           (cond-> result
                                            (get q :remove-block-children? true)
                                            tree/filter-top-level-blocks)
                                           result)))
            group-by-page? (get-group-by-page q options)
            result (if (and group-by-page? (:block/uuid (first transformed-query-result)))
                     (let [result (db-utils/group-by-page transformed-query-result)]
                       (if (map? result)
                         (dissoc result nil)
                         result))
                     transformed-query-result)]
        (when query-atom
          (util/safe-with-meta result (meta @query-atom))))))
