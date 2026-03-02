(ns frontend.handler.agent-cancel
  (:require [frontend.db :as db]
            [frontend.handler.db-based.sync :as db-sync]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defn- session-key
  [block-uuid]
  (some-> block-uuid str))

(def ^:private canceled-status-ident :logseq.property/status.canceled)

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
               (string? session-id))
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

(defn- canceled-status-value?
  [status-value canceled-status-id]
  (or (= canceled-status-ident status-value)
      (= canceled-status-id status-value)))

(defn- status-canceled-datom?
  [datom canceled-status-id]
  (and (:added datom)
       (= :logseq.property/status (:a datom))
       (canceled-status-value? (:v datom) canceled-status-id)))

(defn maybe-cancel-session-on-status-change!
  [block property-id property-value]
  (let [canceled-status-id (:db/id (db/entity canceled-status-ident))]
    (when (and (= :logseq.property/status property-id)
               (canceled-status-value? property-value canceled-status-id))
      (<cancel-session-by-block-uuid! (:block/uuid block)))))

(defn maybe-cancel-sessions-on-db-change!
  [tx-data]
  (if (seq tx-data)
    (let [canceled-status-id (:db/id (db/entity canceled-status-ident))
          cancel-promises (->> tx-data
                               (filter #(status-canceled-datom? % canceled-status-id))
                               (keep (fn [datom]
                                       (:block/uuid (db/entity (:e datom)))))
                               distinct
                               (map <cancel-session-by-block-uuid!)
                               (remove nil?)
                               vec)]
      (if (seq cancel-promises)
        (p/all cancel-promises)
        (p/resolved nil)))
    (p/resolved nil)))
