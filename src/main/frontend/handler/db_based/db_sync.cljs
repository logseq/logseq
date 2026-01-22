(ns frontend.handler.db-based.db-sync
  "DB-sync handler based on Cloudflare Durable Objects."
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.db-sync.malli-schema :as db-sync-schema]
            [logseq.db.sqlite.util :as sqlite-util]
            [promesa.core :as p]))

(defn- ws->http-base [ws-url]
  (when (string? ws-url)
    (let [base (cond
                 (string/starts-with? ws-url "wss://")
                 (str "https://" (subs ws-url (count "wss://")))

                 (string/starts-with? ws-url "ws://")
                 (str "http://" (subs ws-url (count "ws://")))

                 :else ws-url)
          base (string/replace base #"/sync/%s$" "")]
      base)))

(defn- http-base []
  (or config/db-sync-http-base
      (ws->http-base config/db-sync-ws-url)))

(def ^:private snapshot-text-decoder (js/TextDecoder.))

(defn- ->uint8 [data]
  (cond
    (instance? js/Uint8Array data) data
    (instance? js/ArrayBuffer data) (js/Uint8Array. data)
    (string? data) (.encode (js/TextEncoder.) data)
    :else (js/Uint8Array. data)))

(defn- decode-snapshot-rows [bytes]
  (sqlite-util/read-transit-str (.decode snapshot-text-decoder (->uint8 bytes))))

(defn- snapshot-rows-e2ee?
  [rows]
  (boolean
   (some (fn [[_ content _]]
           (try
             (let [data (sqlite-util/read-transit-str content)]
               (and (map? data)
                    (= :logseq.kv/graph-rtc-e2ee? (:db/ident data))))
             (catch :default _
               false)))
         rows)))

(defn- frame-len [^js data offset]
  (let [view (js/DataView. (.-buffer data) offset 4)]
    (.getUint32 view 0 false)))

(defn- concat-bytes
  [^js a ^js b]
  (cond
    (nil? a) b
    (nil? b) a
    :else
    (let [out (js/Uint8Array. (+ (.-byteLength a) (.-byteLength b)))]
      (.set out a 0)
      (.set out b (.-byteLength a))
      out)))

(defn- parse-framed-chunk
  [buffer chunk]
  (let [data (concat-bytes buffer chunk)
        total (.-byteLength data)]
    (loop [offset 0
           rows []]
      (if (< (- total offset) 4)
        {:rows rows
         :buffer (when (< offset total)
                   (.slice data offset total))}
        (let [len (frame-len data offset)
              next-offset (+ offset 4 len)]
          (if (<= next-offset total)
            (let [payload (.slice data (+ offset 4) next-offset)
                  decoded (decode-snapshot-rows payload)]
              (recur next-offset (into rows decoded)))
            {:rows rows
             :buffer (.slice data offset total)}))))))

(defn- finalize-framed-buffer
  [buffer]
  (if (or (nil? buffer) (zero? (.-byteLength buffer)))
    []
    (let [{:keys [rows buffer]} (parse-framed-chunk nil buffer)]
      (if (and (seq rows) (or (nil? buffer) (zero? (.-byteLength buffer))))
        rows
        (throw (ex-info "incomplete framed buffer" {:buffer buffer :rows rows}))))))

(defn- auth-headers []
  (when-let [token (state/get-auth-id-token)]
    {"authorization" (str "Bearer " token)}))

(defn- with-auth-headers [opts]
  (if-let [auth (auth-headers)]
    (assoc opts :headers (merge (or (:headers opts) {}) auth))
    opts))

(declare fetch-json)

(defn- fetch-graph-e2ee?
  [base graph-uuid]
  (if-not (and (string? base) (string? graph-uuid))
    false
    (p/let [resp (fetch-json (str base "/e2ee/graphs/" graph-uuid "/aes-key")
                             {:method "GET"}
                             {:response-schema :e2ee/graph-aes-key})
            encrypted-aes-key (:encrypted-aes-key resp)]
      (boolean (string? encrypted-aes-key)))))

(declare coerce-http-response)

(defn- fetch-json
  [url opts {:keys [response-schema error-schema] :or {error-schema :error}}]
  (p/let [resp (js/fetch url (clj->js (with-auth-headers opts)))
          text (.text resp)
          data (when (seq text) (js/JSON.parse text))]
    (if (.-ok resp)
      (let [body (js->clj data :keywordize-keys true)
            body (if response-schema
                   (coerce-http-response response-schema body)
                   body)]
        (if (or (nil? response-schema) body)
          body
          (throw (ex-info "db-sync invalid response"
                          {:status (.-status resp)
                           :url url
                           :body body}))))
      (let [body (when data (js->clj data :keywordize-keys true))
            body (if error-schema
                   (coerce-http-response error-schema body)
                   body)]
        (throw (ex-info "db-sync request failed"
                        {:status (.-status resp)
                         :url url
                         :body body}))))))

(def ^:private invalid-coerce ::invalid-coerce)

(defn- coerce
  [coercer value context]
  (try
    (coercer value)
    (catch :default e
      (log/error :db-sync/malli-coerce-failed (merge context {:error e :value value}))
      invalid-coerce)))

(defn- coerce-http-request [schema-key body]
  (if-let [coercer (get db-sync-schema/http-request-coercers schema-key)]
    (let [coerced (coerce coercer body {:schema schema-key :dir :request})]
      (when-not (= coerced invalid-coerce)
        coerced))
    body))

(defn- coerce-http-response [schema-key body]
  (if-let [coercer (get db-sync-schema/http-response-coercers schema-key)]
    (let [coerced (coerce coercer body {:schema schema-key :dir :response})]
      (when-not (= coerced invalid-coerce)
        coerced))
    body))

(defn <rtc-start!
  [repo & {:keys [_stop-before-start?] :as _opts}]
  (log/info :db-sync/start {:repo repo})
  (state/<invoke-db-worker :thread-api/db-sync-start repo))

(defn <rtc-stop!
  []
  (log/info :db-sync/stop true)
  (state/<invoke-db-worker :thread-api/db-sync-stop))

(defn <rtc-update-presence!
  [editing-block-uuid]
  (state/<invoke-db-worker :thread-api/db-sync-update-presence editing-block-uuid))

(defn <rtc-get-users-info
  []
  (when-let [graph-uuid (ldb/get-graph-rtc-uuid (db/get-db))]
    (let [base (http-base)
          repo (state/get-current-repo)]
      (if base
        (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
                resp (fetch-json (str base "/graphs/" graph-uuid "/members")
                                 {:method "GET"}
                                 {:response-schema :graph-members/list})
                members (:members resp)
                users (mapv (fn [{:keys [user-id role email username]}]
                              (let [name (or username email user-id)
                                    user-type (some-> role keyword)]
                                (cond-> {:user/uuid user-id
                                         :user/name name
                                         :graph<->user/user-type user-type}
                                  (string? email) (assoc :user/email email))))
                            members)]
          (state/set-state! :rtc/users-info {repo users}))
        (p/resolved nil)))))

(defn <rtc-create-graph!
  [repo]
  (let [schema-version (some-> (ldb/get-graph-schema-version (db/get-db)) :major str)
        base (http-base)]
    (if base
      (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
              body (coerce-http-request :graphs/create
                                        {:graph-name (string/replace repo config/db-version-prefix "")
                                         :schema-version schema-version})
              result (if (nil? body)
                       (p/rejected (ex-info "db-sync invalid create-graph body"
                                            {:repo repo}))
                       (fetch-json (str base "/graphs")
                                   {:method "POST"
                                    :headers {"content-type" "application/json"}
                                    :body (js/JSON.stringify (clj->js body))}
                                   {:response-schema :graphs/create}))
              graph-id (:graph-id result)]
        (if graph-id
          (p/do!
           (ldb/transact! repo [(sqlite-util/kv :logseq.kv/db-type "db")
                                (sqlite-util/kv :logseq.kv/graph-uuid (uuid graph-id))
                                (sqlite-util/kv :logseq.kv/graph-rtc-e2ee? true)])
           graph-id)
          (p/rejected (ex-info "db-sync missing graph id in create response"
                               {:type :db-sync/invalid-graph
                                :response result}))))
      (p/rejected (ex-info "db-sync missing graph info"
                           {:type :db-sync/invalid-graph
                            :base base})))))

(defn <rtc-delete-graph!
  [graph-uuid _schema-version]
  (let [base (http-base)]
    (if (and graph-uuid base)
      (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)]
        (fetch-json (str base "/graphs/" graph-uuid)
                    {:method "DELETE"}
                    {:response-schema :graphs/delete}))
      (p/rejected (ex-info "db-sync missing graph id"
                           {:type :db-sync/invalid-graph
                            :graph-uuid graph-uuid
                            :base base})))))

(defn <rtc-download-graph!
  [graph-name graph-uuid _graph-schema-version]
  (state/set-state! :rtc/downloading-graph-uuid graph-uuid)
  (let [base (http-base)]
    (-> (if (and graph-uuid base)
          (let [download-url* (atom nil)]
            (-> (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
                        graph (str config/db-version-prefix graph-name)
                        pull-resp (fetch-json (str base "/sync/" graph-uuid "/pull")
                                              {:method "GET"}
                                              {:response-schema :sync/pull})
                        remote-tx (:t pull-resp)
                        _ (when-not (integer? remote-tx)
                            (throw (ex-info "non-integer remote-tx when downloading graph"
                                            {:graph graph-name
                                             :remote-tx remote-tx})))
                        download-resp (fetch-json (str base "/sync/" graph-uuid "/snapshot/download")
                                                  {:method "GET"}
                                                  {:response-schema :sync/snapshot-download})
                        download-url (:url download-resp)
                        _ (reset! download-url* download-url)
                        _ (when-not (string? download-url)
                            (throw (ex-info "missing snapshot download url"
                                            {:graph graph-name
                                             :response download-resp})))
                        resp (js/fetch download-url (clj->js (with-auth-headers {:method "GET"})))]
                  (when-not (.-ok resp)
                    (throw (ex-info "snapshot download failed"
                                    {:graph graph-name
                                     :status (.-status resp)})))
                  (when-not (.-body resp)
                    (throw (ex-info "snapshot download missing body"
                                    {:graph graph-name})))
                  (p/let [reader (.getReader (.-body resp))]
                    (p/loop [buffer nil
                             total 0
                             total-rows []]
                      (p/let [chunk (.read reader)]
                        (if (.-done chunk)
                          (let [rows (finalize-framed-buffer buffer)
                                total' (+ total (count rows))
                                total-rows' (into total-rows rows)]
                            (when (seq total-rows')
                              (p/do!
                               (state/<invoke-db-worker :thread-api/db-sync-import-kvs-rows
                                                        graph total-rows' true graph-uuid)
                               (state/<invoke-db-worker :thread-api/db-sync-finalize-kvs-import graph remote-tx)))
                            total')
                          (let [value (.-value chunk)
                                {:keys [rows buffer]} (parse-framed-chunk buffer value)
                                total' (+ total (count rows))]
                            (p/recur buffer total' (into total-rows rows))))))))
                (p/finally
                  (fn []
                    (when-let [download-url @download-url*]
                      (js/fetch download-url (clj->js (with-auth-headers {:method "DELETE"}))))))))
          (p/rejected (ex-info "db-sync missing graph info"
                               {:type :db-sync/invalid-graph
                                :graph-uuid graph-uuid
                                :base base})))
        (p/catch (fn [error]
                   (throw error)))
        (p/finally
          (fn []
            (state/set-state! :rtc/downloading-graph-uuid nil))))))

(defn <get-remote-graphs
  []
  (let [base (http-base)]
    (if-not base
      (p/resolved [])
      (-> (p/let [_ (state/set-state! :rtc/loading-graphs? true)
                  _ (js/Promise. user-handler/task--ensure-id&access-token)
                  resp (fetch-json (str base "/graphs")
                                   {:method "GET"}
                                   {:response-schema :graphs/list})
                  graphs (:graphs resp)
                  result (mapv (fn [graph]
                                 (merge
                                  {:url (str config/db-version-prefix (:graph-name graph))
                                   :GraphName (:graph-name graph)
                                   :GraphSchemaVersion (:schema-version graph)
                                   :GraphUUID (:graph-id graph)
                                   :rtc-graph? true
                                   :graph<->user-user-type (:role graph)
                                   :graph<->user-grant-by-user (:invited-by graph)}
                                  (dissoc graph :graph-id :graph-name :schema-version :role :invited-by)))
                               graphs)]
            (state/set-state! :rtc/graphs result)
            (repo-handler/refresh-repos!)
            result)
          (p/finally
            (fn []
              (state/set-state! :rtc/loading-graphs? false)))))))

(defn <rtc-invite-email
  [graph-uuid email]
  (let [base (http-base)
        graph-uuid (str graph-uuid)]
    (if (and base (string? graph-uuid) (string? email))
      (->
       (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
               body (coerce-http-request :graph-members/create
                                         {:email email
                                          :role "member"})
               _ (when (nil? body)
                   (throw (ex-info "db-sync invalid invite body"
                                   {:graph-uuid graph-uuid
                                    :email email})))
               _ (fetch-json (str base "/graphs/" graph-uuid "/members")
                             {:method "POST"
                              :headers {"content-type" "application/json"}
                              :body (js/JSON.stringify (clj->js body))}
                             {:response-schema :graph-members/create})
               repo (state/get-current-repo)
               e2ee? (ldb/get-graph-rtc-e2ee? (db/get-db))
               _ (when (and repo e2ee?)
                   (state/<invoke-db-worker :thread-api/db-sync-grant-graph-access
                                            repo graph-uuid email))]
         (notification/show! "Invitation sent!" :success))
       (p/catch (fn [e]
                  (notification/show! "Something wrong, please try again." :error)
                  (log/error :db-sync/invite-email-failed
                             {:error e
                              :graph-uuid graph-uuid
                              :email email}))))
      (p/rejected (ex-info "db-sync missing invite info"
                           {:type :db-sync/invalid-invite
                            :graph-uuid graph-uuid
                            :email email
                            :base base})))))
