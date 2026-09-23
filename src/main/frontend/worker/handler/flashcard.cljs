(ns frontend.worker.handler.flashcard
  "Flashcard scheduling queries for the db worker."
  (:require
   [clojure.string :as string]
   [datascript.core :as d]
   [frontend.common.thread-api :refer [def-thread-api]]
   [frontend.worker.query-dsl :as query-dsl]
   [frontend.worker.state :as worker-state]
   [logseq.db.frontend.class :as db-class]))

(defn- cards-query
  [db cards-id]
  (let [cards (when (and cards-id (not (contains? #{:global "global"} cards-id)))
                (d/entity db cards-id))
        query (when cards
                (when-let [query (:logseq.property/query cards)]
                  (when-not (string/blank? (:block/title query))
                    (:block/title query))))]
    {:query query
     :result (query-dsl/parse query db {})}))

(defn- append-cards-query
  [q query result]
  (if query
    (let [query* (:query result)]
      (concat q (if (coll? (first query*)) query* [query*])))
    q))

(defn- fsrs-card-block-ids
  "Return #Card block ids for a deck. When due-only?, keep the review queue
  (overdue, due now, or never scheduled). Otherwise return every matching card
  so All cards / category browse still works when the due count is 0."
  [db cards-id {:keys [due-only?]}]
  (let [{:keys [query result]} (cards-query db cards-id)
        card-tag-id (:db/id (d/entity db :logseq.class/Card))
        card-tag-children-ids (db-class/get-structured-children db card-tag-id)
        card-ids (cons card-tag-id card-tag-children-ids)
        q-due '[:find [?b ...]
                :in $ [?t ...] ?now-inst-ms %
                :where
                [?b :block/tags ?t]
                (or-join [?b ?now-inst-ms]
                         (and
                          [?b :logseq.property.fsrs/due ?due]
                          [(>= ?now-inst-ms ?due)])
                         [(missing? $ ?b :logseq.property.fsrs/due)])
                [?b :block/uuid]]
        q-all '[:find [?b ...]
                :in $ [?t ...] %
                :where
                [?b :block/tags ?t]
                [?b :block/uuid]]]
    (if due-only?
      (d/q (append-cards-query q-due query result)
           db card-ids (inst-ms (js/Date.)) (:rules result))
      (d/q (append-cards-query q-all query result)
           db card-ids (:rules result)))))

(def-thread-api :thread-api/get-fsrs-due-card-block-ids
  [repo cards-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (fsrs-card-block-ids @conn cards-id {:due-only? true})))

(def-thread-api :thread-api/get-fsrs-card-block-ids
  [repo cards-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (fsrs-card-block-ids @conn cards-id {:due-only? false})))
