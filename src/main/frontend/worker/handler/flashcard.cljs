(ns frontend.worker.handler.flashcard
  "Flashcard scheduling queries for the db worker."
  (:require
   [clojure.string :as string]
   [datascript.core :as d]
   [frontend.common.thread-api :refer [def-thread-api]]
   [frontend.worker.query-dsl :as query-dsl]
   [frontend.worker.state :as worker-state]
   [logseq.db.frontend.class :as db-class]))

(defn- fsrs-due-card-block-ids
  [db cards-id]
  (let [now-inst-ms (inst-ms (js/Date.))
        cards (when (and cards-id (not (contains? #{:global "global"} cards-id)))
                (d/entity db cards-id))
        query (when cards
                (when-let [query (:logseq.property/query cards)]
                  (when-not (string/blank? (:block/title query))
                    (:block/title query))))
        result (query-dsl/parse query db {})
        card-tag-id (:db/id (d/entity db :logseq.class/Card))
        card-tag-children-ids (db-class/get-structured-children db card-tag-id)
        card-ids (cons card-tag-id card-tag-children-ids)
        q '[:find [?b ...]
            :in $ [?t ...] ?now-inst-ms %
            :where
            [?b :block/tags ?t]
            (or-join [?b ?now-inst-ms]
                     (and
                      [?b :logseq.property.fsrs/due ?due]
                      [(>= ?now-inst-ms ?due)])
                     [(missing? $ ?b :logseq.property.fsrs/due)])
            [?b :block/uuid]]
        q' (if query
             (let [query* (:query result)]
               (concat q (if (coll? (first query*)) query* [query*])))
             q)]
    (d/q q' db card-ids now-inst-ms (:rules result))))

(def-thread-api :thread-api/get-fsrs-due-card-block-ids
  [repo cards-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (fsrs-due-card-block-ids @conn cards-id)))
