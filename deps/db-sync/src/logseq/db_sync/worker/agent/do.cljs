(ns logseq.db-sync.worker.agent.do
  (:require [lambdaisland.glogi :as log]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.platform.core :as platform]
            [logseq.db-sync.worker.agent.sandbox :as sandbox]
            [logseq.db-sync.worker.agent.session :as session]
            [logseq.db-sync.worker.http :as http]
            [promesa.core :as p]))

(defn- header [request name]
  (.get (.-headers request) name))

(defn- user-id-from-request [request]
  (header request "x-user-id"))

(defn- sse-encode [event]
  (str "data: " (js/JSON.stringify (clj->js event)) "\n\n"))

(defn- <storage-get [storage key]
  (p/let [value (.get storage key)]
    (when value (js->clj value :keywordize-keys true))))

(defn- <storage-put! [storage key value]
  (.put storage key (clj->js value)))

(defn- <get-session [^js self]
  (<storage-get (.-storage self) "session"))

(defn- <get-events [^js self]
  (p/let [events (<storage-get (.-storage self) "events")]
    (vec (or events []))))

(defn- <put-session! [^js self session]
  (<storage-put! (.-storage self) "session" session))

(defn- <put-events! [^js self events]
  (<storage-put! (.-storage self) "events" events))

(defn- <save-session! [^js self session]
  (p/let [_ (<put-session! self session)]
    session))

(defn- stream-url [request session-id]
  (let [base (or (header request "x-stream-base")
                 (.-origin (platform/request-url request)))]
    (str base "/sessions/" session-id "/stream")))

(defn- broadcast-event! [^js self event]
  (let [streams (.-streams self)]
    (when streams
      (.forEach streams
                (fn [writer key]
                  (-> (.write writer (sse-encode event))
                      (.catch (fn [_]
                                (.delete streams key)))))))))

(defn- <append-event! [^js self event-opts]
  (p/let [session (<get-session self)
          events (<get-events self)]
    (if (nil? session)
      {:error :missing-session}
      (let [[session events event] (session/append-event session events event-opts)]
        (p/let [_ (<put-session! self session)
                _ (<put-events! self events)]
          (broadcast-event! self event)
          {:session session :event event})))))

(defn- session-conflict [message]
  (http/error-response message 409))

(defn- <transition! [^js self to-status event-type data]
  (p/let [session (<get-session self)]
    (cond
      (nil? session)
      (http/not-found)

      (not (session/transition-allowed? (:status session) to-status))
      (session-conflict (str "cannot transition from " (:status session) " to " to-status))

      :else
      (p/let [res (<append-event! self {:type event-type :data data})]
        (if (= (:error res) :missing-session)
          (http/not-found)
          (http/json-response :sessions/pause {:ok true}))))))

(defn- sandbox-base [^js env]
  (aget env "SANDBOX_AGENT_URL"))

(defn- sandbox-token [^js env]
  (aget env "SANDBOX_AGENT_TOKEN"))

(defn- <provision-sandbox! [^js self task session-id]
  (let [base (sandbox-base (.-env self))]
    (if-not (string? base)
      (p/resolved nil)
      (let [sandbox-base (sandbox/normalize-base-url base)]
        (p/let [payload {:agent (:agent task)
                         :model (get-in task [:agent :model])
                         :permission-mode (get-in task [:agent :permission-mode])}
                response (sandbox/<create-session sandbox-base (sandbox-token (.-env self)) session-id payload)
                sandbox-session-id (:session-id response)
                runtime {:sandbox {:base sandbox-base
                                   :session-id sandbox-session-id}}]
          (p/let [session (<get-session self)
                  events (<get-events self)]
            (if (nil? session)
              nil
              (let [session (assoc session :runtime runtime)
                    [session events _event] (session/append-event session events {:type "session.provisioned"
                                                                                  :data {:sandbox-session-id sandbox-session-id}
                                                                                  :ts (common/now-ms)})]
                (p/let [_ (<put-session! self session)
                        _ (<put-events! self events)]
                  runtime)))))))))

(defn- handle-init [^js self request]
  (p/let [existing (<get-session self)]
    (if existing
      (let [session-id (:id existing)]
        (http/json-response :sessions/create
                            {:session-id session-id
                             :status (:status existing)
                             :stream-url (stream-url request session-id)}))
      (.then (common/read-json request)
             (fn [result]
               (if (nil? result)
                 (http/bad-request "missing body")
                 (let [task (js->clj result :keywordize-keys true)
                       task-id (:id task)
                       user-id (user-id-from-request request)
                       now (common/now-ms)
                       audit-default {:requested-by user-id
                                      :requested-at now}
                       audit (merge audit-default (:audit task))]
                   (cond
                     (not (string? user-id))
                     (http/unauthorized)

                     (not (string? task-id))
                     (http/bad-request "invalid session id")

                     (and (string? (:requested-by audit))
                          (not= (:requested-by audit) user-id))
                     (http/forbidden)

                     :else
                     (let [session (session/initial-session task audit now)
                           [session events _event] (session/append-event session [] {:type "session.created" :data {:requested-by user-id} :ts now})]
                       (p/let [_ (<put-session! self session)
                               _ (<put-events! self events)
                               _ (<provision-sandbox! self task task-id)]
                         (http/json-response :sessions/create
                                             {:session-id task-id
                                              :status (:status session)
                                              :stream-url (stream-url request task-id)})))))))))))

(defn- handle-status [^js self _request]
  (p/let [session (<get-session self)]
    (if (nil? session)
      (http/not-found)
      (http/json-response :sessions/get
                          {:session-id (:id session)
                           :status (:status session)
                           :task (:task session)
                           :audit (:audit session)
                           :created-at (:created-at session)
                           :updated-at (:updated-at session)}))))

(defn- handle-messages [^js self request]
  (.then (common/read-json request)
         (fn [result]
           (if (nil? result)
             (http/bad-request "missing body")
             (let [body (js->clj result :keywordize-keys true)
                   message (:message body)
                   user-id (user-id-from-request request)]
               (cond
                 (not (string? user-id))
                 (http/unauthorized)

                 (not (string? message))
                 (http/bad-request "invalid message")

                 :else
                 (p/let [res (<append-event! self {:type "audit.log"
                                                   :data {:message message
                                                          :kind (:kind body)
                                                          :by user-id}})
                         current-session (<get-session self)]
                   (cond
                     (= (:error res) :missing-session)
                     (http/not-found)

                     (contains? #{"completed" "failed" "canceled"} (:status current-session))
                     (session-conflict "session is not writable")

                     (= "paused" (:status current-session))
                     (let [next-session (session/enqueue-order current-session {:message message
                                                                                :kind (:kind body)
                                                                                :by user-id})]
                       (p/let [_ (<save-session! self next-session)]
                         (http/json-response :sessions/message {:ok true})))

                     :else
                     (let [runtime (get-in current-session [:runtime :sandbox])]
                       (p/let [_ (when (and runtime (string? (:session-id runtime)))
                                   (sandbox/<send-message (:base runtime)
                                                          (sandbox-token (.-env self))
                                                          (:session-id runtime)
                                                          {:message message
                                                           :kind (:kind body)}))]
                         (http/json-response :sessions/message {:ok true})))))))))))

(defn- handle-cancel [^js self request]
  (let [user-id (user-id-from-request request)]
    (if-not (string? user-id)
      (http/unauthorized)
      (p/let [res (<append-event! self {:type "session.canceled"
                                        :data {:by user-id}})]
        (if (= (:error res) :missing-session)
          (http/not-found)
          (http/json-response :sessions/cancel {:ok true}))))))

(defn- <flush-pending-orders! [^js self]
  (p/let [current-session (<get-session self)]
    (if (nil? current-session)
      nil
      (let [[orders next-session] (session/drain-orders current-session)
            runtime (get-in current-session [:runtime :sandbox])]
        (p/let [_ (<save-session! self next-session)
                _ (when (and runtime (string? (:session-id runtime)))
                    (p/all
                     (map (fn [order]
                            (sandbox/<send-message (:base runtime)
                                                   (sandbox-token (.-env self))
                                                   (:session-id runtime)
                                                   {:message (:message order)
                                                    :kind (:kind order)}))
                          orders)))]
          (count orders))))))

(defn- handle-pause [^js self request]
  (let [user-id (user-id-from-request request)]
    (if-not (string? user-id)
      (http/unauthorized)
      (<transition! self "paused" "session.paused" {:by user-id :reason "user-pause"}))))

(defn- handle-resume [^js self request]
  (let [user-id (user-id-from-request request)]
    (if-not (string? user-id)
      (http/unauthorized)
      (p/let [resp (<transition! self "running" "session.running" {:by user-id :reason "user-resume"})]
        (if-not (= 200 (.-status resp))
          resp
          (p/let [flushed (<flush-pending-orders! self)]
            (http/json-response :sessions/resume {:ok true
                                                  :flushed (or flushed 0)})))))))

(defn- handle-interrupt [^js self request]
  (let [user-id (user-id-from-request request)]
    (if-not (string? user-id)
      (http/unauthorized)
      (<transition! self "paused" "session.paused" {:by user-id :reason "interrupt"}))))

(defn- handle-stream [^js self request]
  (let [streams (.-streams self)
        stream (js/TransformStream.)
        writer (.getWriter (.-writable stream))
        stream-id (str (random-uuid))
        cleanup (fn []
                  (.delete streams stream-id)
                  (.close writer))]
    (.set streams stream-id writer)
    (.addEventListener (.-signal request) "abort" cleanup)
    (p/let [events (<get-events self)]
      (doseq [event events]
        (.write writer (sse-encode event))))
    (js/Response.
     (.-readable stream)
     #js {:status 200
          :headers (js/Object.assign
                    #js {"content-type" "text/event-stream"
                         "cache-control" "no-cache"
                         "connection" "keep-alive"}
                    (common/cors-headers))})))

(defn- parse-int [value]
  (when (string? value)
    (let [parsed (js/parseInt value 10)]
      (when (js/Number.isFinite parsed) parsed))))

(defn- handle-events [^js self request]
  (let [url (platform/request-url request)
        since-ts (parse-int (.get (.-searchParams url) "since"))
        limit (parse-int (.get (.-searchParams url) "limit"))
        user-id (user-id-from-request request)]
    (log/info :agent/session-events-request {:user-id user-id
                                             :since since-ts
                                             :limit limit})
    (p/let [session (<get-session self)]
      (if (nil? session)
        (http/not-found)
        (p/let [events (<get-events self)
                filtered (session/filter-events events {:since-ts since-ts :limit limit})]
          (http/json-response :sessions/events {:events filtered}))))))

(defn handle-fetch [^js self request]
  (let [url (platform/request-url request)
        path (.-pathname url)
        method (.-method request)]
    (try
      (cond
        (contains? #{"OPTIONS" "HEAD"} method)
        (common/options-response)

        (= path "/__session__/init")
        (handle-init self request)

        (= path "/__session__/status")
        (handle-status self request)

        (= path "/__session__/messages")
        (handle-messages self request)

        (= path "/__session__/pause")
        (handle-pause self request)

        (= path "/__session__/resume")
        (handle-resume self request)

        (= path "/__session__/interrupt")
        (handle-interrupt self request)

        (= path "/__session__/cancel")
        (handle-cancel self request)

        (= path "/__session__/stream")
        (handle-stream self request)

        (= path "/__session__/events")
        (handle-events self request)

        :else
        (http/not-found))
      (catch :default error
        (log/error :agent/session-do-error error)
        (http/error-response "server error" 500)))))
