(ns frontend.worker.rtc.ws-util
  "Add RTC related logic to the function based on ws."
  (:require [cljs-http-missionary.client :as http]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.rtc.db :as rtc-db]
            [frontend.worker.rtc.malli-schema :as rtc-schema]
            [frontend.worker.rtc.ws :as ws]
            [frontend.worker.state :as worker-state]
            [goog.string :as gstring]
            [logseq.graph-parser.utf8 :as utf8]
            [missionary.core :as m]))

(def ^:private remote-e-type->ex-info
  {:ws-conn-already-disconnected
   (ex-info "websocket conn is already disconnected" {:type :rtc.exception/ws-already-disconnected})
   :graph-not-exist
   (ex-info "remote graph not exist" {:type :rtc.exception/remote-graph-not-exist})
   :graph-not-ready
   (ex-info "remote graph still creating" {:type :rtc.exception/remote-graph-not-ready})
   :bad-request-body
   (ex-info "bad request body" {:type :rtc.exception/bad-request-body})
   :not-allowed
   (ex-info "not allowed" {:type :rtc.exception/not-allowed})
   :client-graph-too-old
   (ex-info "local graph too old" {:type :rtc.exception/local-graph-too-old})})

(defn- handle-remote-ex
  [resp]
  (when (= :graph-not-exist (:type (:ex-data resp)))
    (rtc-db/remove-rtc-data-in-conn! (worker-state/get-current-repo))
    (worker-util/post-message :remote-graph-gone []))
  (if-let [e (get remote-e-type->ex-info (:type (:ex-data resp)))]
    (throw e)
    resp))

(defn- put-apply-ops-message-on-s3-if-too-huge
  "Return a task that return s3-key"
  [ws message]
  {:pre [(= "apply-ops" (:action message))]}
  (m/sp
    (let [decoded-message (rtc-schema/data-to-ws-coercer (assoc message :req-id "temp-id"))
          message-str (js/JSON.stringify
                       (clj->js (select-keys (rtc-schema/data-to-ws-encoder decoded-message)
                                             ["graph-uuid" "ops" "t-before" "schema-version" "api-version"])))
          len (.-length (utf8/encode message-str))]
      (when (< 100000 len)
        (let [{:keys [url key]} (m/? (ws/send&recv ws {:action "presign-put-temp-s3-obj"}))
              {:keys [status] :as resp} (m/? (http/put url {:body message-str :with-credentials? false}))]
          (when-not (http/unexceptional-status? status)
            (throw (ex-info "failed to upload apply-ops message" {:resp resp})))
          key)))))

(defn send&recv
  "Return a task: throw exception if recv ex-data response.
  This function will attempt to reconnect and retry once after the ws closed(js/CloseEvent).
  For huge apply-ops request(>100KB),
  - upload its request message to s3 first,
    then add `s3-key` key to request message map"
  [get-ws-create-task message & {:keys [timeout-ms] :or {timeout-ms 10000}}]
  (let [task--helper
        (m/sp
          (let [ws (m/? get-ws-create-task)
                opts {:timeout-ms timeout-ms}
                s3-key (when (= "apply-ops" (:action message))
                         (m/? (put-apply-ops-message-on-s3-if-too-huge ws message)))
                message* (if s3-key
                           (-> message
                               (assoc :s3-key s3-key)
                               (dissoc :graph-uuid :ops :t-before :schema-version))
                           message)]
            (handle-remote-ex (m/? (ws/send&recv ws message* opts)))))]
    (m/sp
      (try
        (m/? task--helper)
        (catch js/CloseEvent _
          ;; retry once
          (m/? task--helper))))))

(defn get-ws-url
  [token]
  (assert (some? token))
  (when-let [url @worker-state/*rtc-ws-url]
    (gstring/format url token)))

(defn- gen-get-ws-create-map
  "Return a map with atom *current-ws and a task
  that get current ws, create one if needed(closed or not created yet)"
  [url & {:keys [retry-count open-ws-timeout]
          :or {retry-count 10 open-ws-timeout 10000}}]
  (let [*current-ws (atom nil)
        ws-create-task (ws/mws-create url {:retry-count retry-count :open-ws-timeout open-ws-timeout})]
    {:*current-ws *current-ws
     :get-ws-create-task
     (m/sp
       (let [ws @*current-ws]
         (if (and ws
                  (not (ws/closed? ws)))
           ws
           (let [ws (m/? ws-create-task)]
             (reset! *current-ws ws)
             ws))))}))

(def gen-get-ws-create-map--memoized
  "Return a memoized task to reuse the same websocket."
  (memoize gen-get-ws-create-map))
