(ns logseq.db-sync.bots-access
  (:require [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.worker.auth :as auth]
            [logseq.db-sync.worker.presence :as presence]
            [promesa.core :as p]))

(defn <subject [request env]
  (p/let [claims (auth/auth-claims request env)
          subject (when claims (aget claims "sub"))]
    (when (and (string? subject) (seq subject)) subject)))

(defn <identity [request env]
  (p/let [claims (auth/auth-claims request env)
          user (presence/claims->user claims)
          expires (when claims (aget claims "exp"))]
    (when user
      #js {:account (:user-id user)
           :user (clj->js user)
           :expiresAt (if (number? expires) (* expires 1000) (+ (.now js/Date) 300000))})))

(defn graph-access [db]
  #js {:graphsFor (fn [user-id]
                    (p/let [graphs (index/<index-list db user-id)]
                      (clj->js (mapv :graph-id graphs))))
       :hasGraphAccess (fn [user-id graph-id]
                         (index/<user-has-access-to-graph? db graph-id user-id))
       :graphMembers (fn [graph-id]
                       (p/let [result (common/<d1-all db {:session "first-primary"}
                                                      (str "select user_id from graphs where graph_id=? "
                                                           "union select user_id from graph_members where graph_id=?")
                                                      graph-id graph-id)]
                         (to-array (map #(aget % "user_id") (common/get-sql-rows result)))))
       :canShareGraph (fn [user-id graph-id]
                        (p/let [manager? (index/<user-is-manager? db graph-id user-id)]
                          (if manager?
                            (p/let [members (index/<graph-members-list db graph-id)]
                              (boolean (some #(not= user-id (:user-id %)) members)))
                            false)))})
