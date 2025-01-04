(ns frontend.worker.db.validate
  "Validate db"
  (:require [cljs.pprint :as pprint]
            [frontend.worker.util :as worker-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.validate :as db-validate]))

(defn- counts-from-entities
  [entities]
  {:entities (count entities)
   :pages (count (filter :block/name entities))
   :blocks (count (filter :block/title entities))
   :classes (count (filter ldb/class? entities))
   :objects (count (filter #(seq (:block/tags %)) entities))
   :properties (count (filter ldb/property? entities))
   :property-values (count (mapcat :block/properties entities))})

(defn validate-db
  [db]
  (let [{:keys [errors datom-count entities]} (db-validate/validate-db! db)]
    (if errors
      (do
        (worker-util/post-message :log [:db-invalid :error
                                        {:msg (str "Validation detected " (count errors) " invalid block(s):")
                                         :counts (assoc (counts-from-entities entities) :datoms datom-count)}])
        (pprint/pprint errors)
        (worker-util/post-message :notification
                                  [(str "Validation detected " (count errors) " invalid block(s). These blocks may be buggy when you interact with them. See the javascript console for more.")
                                   :warning false]))

      (worker-util/post-message :notification
                                [(str "Your graph is valid! " (assoc (counts-from-entities entities) :datoms datom-count))
                                 :success false]))))
