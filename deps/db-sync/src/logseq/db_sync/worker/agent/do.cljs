(ns logseq.db-sync.worker.agent.do
  (:require [lambdaisland.glogi :as log]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.platform.core :as platform]
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
                               _ (<put-events! self events)]
                         (http/json-response :sessions/create
                                             {:session-id task-id
                                              :status (:status session)
                                              :stream-url (stream-url request task-id)}))))))))))

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
                                                          :by user-id}})]
                   (if (= (:error res) :missing-session)
                     (http/not-found)
                     (http/json-response :sessions/message {:ok true})))))))))

(defn- handle-cancel [^js self request]
  (let [user-id (user-id-from-request request)]
    (if-not (string? user-id)
      (http/unauthorized)
      (p/let [res (<append-event! self {:type "session.canceled"
                                        :data {:by user-id}})]
        (if (= (:error res) :missing-session)
          (http/not-found)
          (http/json-response :sessions/cancel {:ok true}))))))

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

        (= path "/__session__/cancel")
        (handle-cancel self request)

        (= path "/__session__/stream")
        (handle-stream self request)

        :else
        (http/not-found))
      (catch :default error
        (log/error :agent/session-do-error error)
        (http/error-response "server error" 500)))))
