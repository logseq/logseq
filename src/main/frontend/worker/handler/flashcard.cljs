(ns frontend.worker.handler.flashcard
  "Flashcard scheduling queries for the db worker."
  (:require
   [clojure.string :as string]
   [datascript.core :as d]
   [frontend.common.thread-api :refer [def-thread-api]]
   [frontend.worker.query-dsl :as query-dsl]
   [frontend.worker.state :as worker-state]
   [logseq.db.frontend.class :as db-class]))

(defn- fsrs-card-block-ids
  "Block uuids of cards in the scope of `cards-id`.
  When `due-only?`, restricts to cards due now or without a scheduled due date."
  [db cards-id due-only?]
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
        q (cond-> '[:find [?b ...]
                    :in $ [?t ...] ?now-inst-ms %
                    :where
                    [?b :block/tags ?t]]
            due-only?
            (concat '[(or-join [?b ?now-inst-ms]
                               (and
                                [?b :logseq.property.fsrs/due ?due]
                                [(>= ?now-inst-ms ?due)])
                               [(missing? $ ?b :logseq.property.fsrs/due)])])
            true
            (concat '[[?b :block/uuid]]))
        q' (if query
             (let [query* (:query result)]
               (concat q (if (coll? (first query*)) query* [query*])))
             q)]
    (d/q q' db card-ids now-inst-ms (:rules result))))

(def-thread-api :thread-api/get-fsrs-due-card-block-ids
  [repo cards-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (fsrs-card-block-ids @conn cards-id true)))

(def-thread-api :thread-api/get-fsrs-card-block-ids
  [repo cards-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (fsrs-card-block-ids @conn cards-id false)))
