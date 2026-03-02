(ns frontend.handler.agent-cancel
  (:require [frontend.db :as db]
            [frontend.handler.db-based.sync :as db-sync]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(def ^:private terminal-session-statuses
  #{"completed" "failed" "canceled"})

(defn- session-key
  [block-uuid]
  (some-> block-uuid str))

(defn- stop-session-stream!
  [block-uuid]
  (when-let [controller (get-in (state/sub :agent/sessions) [(session-key block-uuid) :stream-controller])]
    (.abort controller))
  (state/update-state! :agent/sessions
                       (fn [sessions]
                         (let [key (session-key block-uuid)
                               session (get sessions key)]
                           (if (map? session)
                             (assoc sessions key (assoc session
                                                        :status "canceled"
                                                        :streaming? false
                                                        :stream-controller nil))
                             sessions)))))

(defn- <cancel-session-by-block-uuid!
  [block-uuid]
  (let [session (get (state/sub :agent/sessions) (session-key block-uuid))
        session-id (:session-id session)
        base (db-sync/http-base)]
    (when (and (string? base)
               (string? session-id)
               (not (contains? terminal-session-statuses (:status session))))
      (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)]
        (-> (db-sync/fetch-json (str base "/sessions/" session-id "/cancel")
                                {:method "POST"
                                 :headers {"content-type" "application/json"}}
                                {:response-schema :sessions/cancel})
            (p/then (fn [resp]
                      (stop-session-stream! block-uuid)
                      resp))
            (p/catch (fn [error]
                       (when-not (= 404 (:status (ex-data error)))
                         (log/error :agent/cancel-on-status-change-failed error))
                       nil)))))))

(defn- status-canceled-datom?
  [datom canceled-status-id]
  (and (:added datom)
       (= :logseq.property/status (:a datom))
       (= canceled-status-id (:v datom))))

(defn maybe-cancel-sessions-on-db-change!
  [tx-data]
  (when (seq tx-data)
    (let [canceled-status-id (:db/id (db/entity :logseq.property/status.canceled))]
      (doseq [block-uuid (->> tx-data
                              (filter #(status-canceled-datom? % canceled-status-id))
                              (keep (fn [datom]
                                      (:block/uuid (db/entity (:e datom)))))
                              distinct)]
        (<cancel-session-by-block-uuid! block-uuid)))))
