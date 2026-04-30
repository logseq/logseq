(ns frontend.handler.db-based.sync
  "DB-sync handler based on Cloudflare Durable Objects."
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.user :as user-handler]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.db-sync.malli-schema :as db-sync-schema]
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
  (or (config/db-sync-http-base)
      (ws->http-base (config/db-sync-ws-url))))

(defn- auth-headers []
  (when-let [token (state/get-auth-id-token)]
    {"authorization" (str "Bearer " token)}))

(defn- with-auth-headers [opts]
  (if-let [auth (auth-headers)]
    (assoc opts :headers (merge (or (:headers opts) {}) auth))
    opts))

(declare fetch-json)

(declare coerce-http-response)
(declare <sync-auth-state-to-db-worker!)

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

(defn- remote-graph
  [repo]
  (some #(when (= repo (:url %)) %) (state/get-rtc-graphs)))

(defn- graph-has-local-rtc-id?
  [repo]
  (boolean (some-> (db/get-db repo)
                   ldb/get-graph-rtc-uuid)))

(defn- should-start-rtc?
  [repo]
  (and (not (true? (:rtc/uploading? @state/state)))
       (let [graph (remote-graph repo)]
         (and (some? graph)
              (not= false (:graph-ready-for-use? graph))))))

(defn- normalize-graph-e2ee?
  [graph-e2ee?]
  (if (nil? graph-e2ee?)
    true
    (true? graph-e2ee?)))

(defn- <ensure-download-runtime-bound!
  [repo]
  (if (util/electron?)
    (p/let [_ (persist-db/<fetch-init-data repo {:sync-download-graph? true})
            _ (<sync-auth-state-to-db-worker!)]
      nil)
    (p/resolved nil)))

(defn- <ensure-user-rsa-keys-on-server!
  [{:keys [server-rsa-keys-exists?]}]
  (if (not= false server-rsa-keys-exists?)
    (p/resolved nil)
    (if @state/*db-worker
      (-> (state/<invoke-db-worker :thread-api/db-sync-ensure-user-rsa-keys
                                    {:ensure-server? true
                                     :server-rsa-keys-exists? false})
          (p/catch (fn [error]
                     (log/error :db-sync/ensure-user-rsa-keys-failed
                                {:error error
                                 :reason :server-rsa-keys-missing})
                     nil)))
      (do
        (log/warn :db-sync/ensure-user-rsa-keys-skipped
                  {:reason :db-worker-not-ready
                   :server-rsa-keys-exists? server-rsa-keys-exists?})
        (p/resolved nil)))))

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

(defn- sync-app-state-payload
  []
  (cond-> (select-keys @state/state [:git/current-repo :config
                                     :auth/id-token :auth/access-token :auth/refresh-token
                                     :auth/oauth-token-url :auth/oauth-domain :auth/oauth-client-id
                                     :user/info])
    (seq config/OAUTH-DOMAIN)
    (assoc :auth/oauth-domain config/OAUTH-DOMAIN)

    (seq config/COGNITO-CLIENT-ID)
    (assoc :auth/oauth-client-id config/COGNITO-CLIENT-ID)))

(defn- <sync-auth-state-to-db-worker!
  []
  (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
          payload (sync-app-state-payload)]
    (state/<invoke-db-worker :thread-api/sync-app-state payload)))

(defn <rtc-start!
  [repo & {:keys [_stop-before-start?] :as _opts}]
  (p/let [_ (<wait-for-db-worker-ready!)]
    (if (should-start-rtc? repo)
      (do
        (log/info :db-sync/start {:repo repo})
        (p/let [_ (<sync-auth-state-to-db-worker!)]
          (state/<invoke-db-worker :thread-api/db-sync-start repo)))
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
   (<rtc-create-graph! repo true true))
  ([repo graph-e2ee?]
   (<rtc-create-graph! repo graph-e2ee? true))
  ([repo graph-e2ee? graph-ready-for-use?]
   (state/<invoke-db-worker :thread-api/db-sync-create-remote-graph
                            repo graph-e2ee? graph-ready-for-use?)))

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
   (state/pub-event!
    [:rtc/log {:type :rtc.log/download
               :sub-type :download-progress
               :graph-uuid graph-uuid
               :message "Preparing graph snapshot download"}])
   (let [graph-e2ee? (normalize-graph-e2ee? graph-e2ee?)
         base (http-base)]
     (-> (if (and graph-uuid base)
           (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
                   graph (str config/db-version-prefix graph-name)
                   _ (<ensure-download-runtime-bound! graph)
                   _ (state/<invoke-db-worker :thread-api/db-sync-download-graph-by-id
                                              graph graph-uuid graph-e2ee?)]
             true)
           (p/rejected (ex-info "db-sync missing graph info"
                                {:type :db-sync/invalid-graph
                                 :graph-uuid graph-uuid
                                 :base base})))
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
                  _ (<ensure-user-rsa-keys-on-server! {:server-rsa-keys-exists?
                                                       (:user-rsa-keys-exists? resp)})
                  graphs (:graphs resp)
                  result (mapv (fn [graph]
                                 (let [graph-e2ee? (if (contains? graph :graph-e2ee?)
                                                     (normalize-graph-e2ee? (:graph-e2ee? graph))
                                                     true)
                                       graph-ready-for-use? (not= false (:graph-ready-for-use? graph))]
                                   (merge
                                    {:url (str config/db-version-prefix (:graph-name graph))
                                     :GraphName (:graph-name graph)
                                     :GraphSchemaVersion (:schema-version graph)
                                     :GraphUUID (:graph-id graph)
                                     :rtc-graph? true
                                     :graph-e2ee? graph-e2ee?
                                     :graph-ready-for-use? graph-ready-for-use?
                                     :graph<->user-user-type (:role graph)
                                     :graph<->user-grant-by-user (:invited-by graph)}
                                    (dissoc graph :graph-id :graph-name :schema-version :role :invited-by :graph-ready-for-use?))))
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
         (notification/show! (t :sync/invitation-sent) :success))
       (p/catch (fn [e]
                  (if (= "user not found" (get-in (ex-data e) [:body :error]))
                    (notification/show! (t :sync/user-doesnt-exist-yet) :warning)
                    (do
                      (notification/show! (t :sync/something-wrong) :error)
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
  [repo _graph-e2ee?]
  (p/do!
   (state/<invoke-db-worker :thread-api/db-sync-upload-graph repo)
   (<get-remote-graphs)
   (<rtc-start! repo)))

(defn <rtc-create-graph-and-start-sync!
  [repo graph-e2ee?]
  (p/let [graph-id (<rtc-create-graph! repo graph-e2ee? true)]
    (when (nil? graph-id)
      (throw (ex-info "graph id doesn't exist when creating remote graph" {:repo repo})))
    (p/do!
     (<get-remote-graphs)
     (<rtc-start! repo))))
