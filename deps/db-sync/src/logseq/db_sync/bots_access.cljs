(ns logseq.db-sync.bots-access
  (:require [logseq.db-sync.index :as index]
            [logseq.db-sync.worker.auth :as auth]
            [promesa.core :as p]))

(defn <subject [request env]
  (p/let [claims (auth/auth-claims request env)
          subject (when claims (aget claims "sub"))]
    (when (and (string? subject) (seq subject)) subject)))

(defn graph-access [db]
  #js {:graphsFor (fn [user-id]
                    (p/let [graphs (index/<index-list db user-id)]
                      (clj->js (mapv :graph-id graphs))))
       :canShareGraph (fn [user-id graph-id]
                        (p/let [manager? (index/<user-is-manager? db graph-id user-id)]
                          (if manager?
                            (p/let [members (index/<graph-members-list db graph-id)]
                              (boolean (some #(not= user-id (:user-id %)) members)))
                            false)))})
