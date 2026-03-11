(ns frontend.handler.db-based.sync
  "DB-sync handler based on Cloudflare Durable Objects."
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
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

(defn http-base []
  (or config/db-sync-http-base
      (ws->http-base config/db-sync-ws-url)))

(defn- auth-headers []
  (when-let [token (state/get-auth-id-token)]
    {"authorization" (str "Bearer " token)}))

(defn- with-auth-headers [opts]
  (if-let [auth (auth-headers)]
    (assoc opts :headers (merge (or (:headers opts) {}) auth))
    opts))

(declare fetch-json)

(declare coerce-http-response)

(defn fetch-json
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

(defn- graph-in-remote-list?
  [repo]
  (some #(= repo (:url %)) (state/get-rtc-graphs)))

(defn- graph-has-local-rtc-id?
  [repo]
  (boolean (some-> (db/get-db repo)
                   ldb/get-graph-rtc-uuid)))

(defn- remote-graphs-unknown?
  []
  (not= false (:rtc/loading-graphs? @state/state)))

(defn- should-start-rtc?
  [repo]
  (or (graph-in-remote-list? repo)
      ;; During startup, remote graph list might not be fetched yet.
      ;; If local DB already has graph UUID, start optimistically to reduce cold-start latency.
      (and (remote-graphs-unknown?)
           (graph-has-local-rtc-id? repo))))

(defn- normalize-graph-e2ee?
  [graph-e2ee?]
  (if (nil? graph-e2ee?)
    true
    (true? graph-e2ee?)))

(defn- <wait-for-db-worker-ready!
  []
  (if @state/*db-worker
    (p/resolved true)
    (let [ready (p/deferred)
          watch-key (keyword "frontend.handler.db-based.sync"
                             (str "wait-db-worker-ready-" (random-uuid)))]
      (add-watch state/*db-worker watch-key
                 (fn [_ _ _ worker]
                   (when worker
                     (remove-watch state/*db-worker watch-key)
                     (p/resolve! ready true))))
      ;; If worker becomes ready between the initial check and add-watch.
      (when @state/*db-worker
        (remove-watch state/*db-worker watch-key)
        (p/resolve! ready true))
      ready)))

(defn <rtc-stop!
  []
  (log/info :db-sync/stop true)
  (state/<invoke-db-worker :thread-api/db-sync-stop))

(defn <rtc-start!
  [repo & {:keys [_stop-before-start?] :as _opts}]
  (p/let [_ (<wait-for-db-worker-ready!)]
    (if (should-start-rtc? repo)
      (do
        (log/info :db-sync/start {:repo repo})
        (state/<invoke-db-worker :thread-api/db-sync-start repo))
      (do
        (log/info :db-sync/skip-start {:repo repo :reason :graph-not-in-remote-list
                                       :remote-graphs-loading? (:rtc/loading-graphs? @state/state)
                                       :has-local-rtc-id? (graph-has-local-rtc-id? repo)})
        (<rtc-stop!)))))

(defonce ^:private debounced-update-presence
  (util/debounce
   (fn [editing-block-uuid]
     (state/<invoke-db-worker :thread-api/db-sync-update-presence editing-block-uuid))
   1000))

(defn <rtc-update-presence!
  [editing-block-uuid]
  (debounced-update-presence editing-block-uuid))

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
  ([repo]
   (<rtc-create-graph! repo true))
  ([repo graph-e2ee?]
   (let [schema-version (some-> (ldb/get-graph-schema-version (db/get-db)) :major str)
         graph-e2ee? (normalize-graph-e2ee? graph-e2ee?)
         base (http-base)]
     (if base
       (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
               body (coerce-http-request :graphs/create
                                         {:graph-name (common-config/strip-leading-db-version-prefix repo)
                                          :schema-version schema-version
                                          :graph-e2ee? graph-e2ee?})
               result (if (nil? body)
                        (p/rejected (ex-info "db-sync invalid create-graph body"
                                             {:repo repo}))
                        (fetch-json (str base "/graphs")
                                    {:method "POST"
                                     :headers {"content-type" "application/json"}
                                     :body (js/JSON.stringify (clj->js body))}
                                    {:response-schema :graphs/create}))
               graph-id (:graph-id result)
               graph-e2ee? (normalize-graph-e2ee?
                            (if (contains? result :graph-e2ee?)
                              (:graph-e2ee? result)
                              graph-e2ee?))]
         (if graph-id
           (p/do!
            (ldb/transact! repo [(sqlite-util/kv :logseq.kv/db-type "db")
                                 (sqlite-util/kv :logseq.kv/graph-uuid (uuid graph-id))
                                 (sqlite-util/kv :logseq.kv/graph-rtc-e2ee? graph-e2ee?)])
            graph-id)
           (p/rejected (ex-info "db-sync missing graph id in create response"
                                {:type :db-sync/invalid-graph
                                 :response result}))))
       (p/rejected (ex-info "db-sync missing graph info"
                            {:type :db-sync/invalid-graph
                             :base base}))))))

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
  ([graph-name graph-uuid]
   (<rtc-download-graph! graph-name graph-uuid true))
  ([graph-name graph-uuid graph-e2ee?]
   (state/set-state! :rtc/downloading-graph-uuid graph-uuid)
   (let [graph-e2ee? (normalize-graph-e2ee? graph-e2ee?)
         graph (common-config/canonicalize-db-version-repo graph-name)]
     (-> (if (seq graph-uuid)
           (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)]
             (state/<invoke-db-worker :thread-api/db-sync-download-graph-by-id
                                      graph graph-uuid graph-e2ee?))
           (p/rejected (ex-info "db-sync missing graph info"
                                {:type :db-sync/invalid-graph
                                 :graph-uuid graph-uuid
                                 :base (http-base)})))
         (p/catch (fn [error]
                    (throw error)))
         (p/finally
           (fn []
             (state/set-state! :rtc/downloading-graph-uuid nil)))))))

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
                                 (let [repo (common-config/canonicalize-db-version-repo (:graph-name graph))
                                       graph-name (common-config/strip-leading-db-version-prefix repo)
                                       graph-e2ee? (if (contains? graph :graph-e2ee?)
                                                     (normalize-graph-e2ee? (:graph-e2ee? graph))
                                                     true)]
                                   (merge
                                    {:url repo
                                     :GraphName graph-name
                                     :GraphSchemaVersion (:schema-version graph)
                                     :GraphUUID (:graph-id graph)
                                     :rtc-graph? true
                                     :graph-e2ee? graph-e2ee?
                                     :graph<->user-user-type (:role graph)
                                     :graph<->user-grant-by-user (:invited-by graph)}
                                    (dissoc graph :graph-id :graph-name :schema-version :role :invited-by))))
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
                  (if (= "user not found" (get-in (ex-data e) [:body :error]))
                    (notification/show! "User doesn't exist yet." :warning)
                    (do
                      (notification/show! "Something wrong, please try again." :error)
                      (log/error :db-sync/invite-email-failed
                                 {:error e
                                  :graph-uuid graph-uuid
                                  :email email}))))))
      (p/rejected (ex-info "db-sync missing invite info"
                           {:type :db-sync/invalid-invite
                            :graph-uuid graph-uuid
                            :email email
                            :base base})))))

(defn <rtc-remove-member!
  [graph-uuid member-id]
  (let [base (http-base)
        graph-uuid (some-> graph-uuid str)
        member-id (some-> member-id str)]
    (if (and base (string? graph-uuid) (string? member-id))
      (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)]
        (fetch-json (str base "/graphs/" graph-uuid "/members/" member-id)
                    {:method "DELETE"}
                    {:response-schema :graph-members/delete}))
      (p/rejected (ex-info "db-sync missing member info"
                           {:type :db-sync/invalid-member
                            :graph-uuid graph-uuid
                            :member-id member-id
                            :base base})))))

(defn <rtc-leave-graph!
  [graph-uuid]
  (if-let [member-id (user-handler/user-uuid)]
    (<rtc-remove-member! graph-uuid member-id)
    (p/rejected (ex-info "db-sync missing user id"
                         {:type :db-sync/invalid-member
                          :graph-uuid graph-uuid}))))

(defn <rtc-upload-graph!
  [repo graph-e2ee?]
  (let [graph-e2ee? (normalize-graph-e2ee? graph-e2ee?)]
    (p/do!
     (ldb/transact! repo [(sqlite-util/kv :logseq.kv/graph-rtc-e2ee? graph-e2ee?)])
     (state/<invoke-db-worker :thread-api/db-sync-upload-graph repo)
     (<get-remote-graphs)
     (<rtc-start! repo))))
