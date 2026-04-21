(ns frontend.worker.sync.crypt
  "E2EE helpers for db-sync."
  (:require [clojure.string :as string]
            [frontend.common.crypt :as crypt]
            [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.platform :as platform]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.auth :as sync-auth]
            [frontend.worker.sync.const :as sync-const]
            [frontend.worker.ui-request :as ui-request]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [promesa.core :as p]
            [frontend.worker.sync.util :refer [fail-fast fetch-json coerce-http-request] :as sync-util]))

(defonce ^:private *graph->aes-key (atom {}))
(defonce ^:private *user-rsa-key-pair-inflight (atom {}))
(defonce ^:private node-default-auth-file "~/logseq/auth.json")
(defonce ^:private e2ee-password-secret-key "logseq-encrypted-password")
(def ^:private invalid-transit ::invalid-transit)

(defn- runtime
  [platform']
  (get-in platform' [:env :runtime]))

(defn- read-transit-safe
  [value]
  (try
    (ldb/read-transit-str value)
    (catch :default _
      invalid-transit)))

(defn- browser-runtime?
  [platform']
  (= :browser (runtime platform')))

(defn- owner-source
  [platform']
  (get-in platform' [:env :owner-source]))

(defn- capacitor-runtime?
  [platform']
  (and (= :browser (runtime platform'))
       (= :capacitor (owner-source platform'))))

(defn- auth-file-path
  []
  node-default-auth-file)

(defn- interactive-runtime?
  []
  (let [env (:env (platform/current))
        runtime' (:runtime env)
        owner-source' (:owner-source env)]
    (or (= :browser runtime')
        (and (= :node runtime')
             (= :electron owner-source')))))

(defn- missing-e2ee-password-ex
  [data]
  (ex-info "missing-e2ee-password"
           (merge {:code :db-sync/missing-e2ee-password
                   :field :e2ee-password}
                  data)))

(defn- fail-missing-e2ee-password!
  [data]
  (fail-fast :db-sync/missing-e2ee-password
             (merge {:code :db-sync/missing-e2ee-password
                     :field :e2ee-password}
                    data)))

(defn- throw-missing-e2ee-password!
  [data]
  (throw (missing-e2ee-password-ex data)))

(defn- ensure-refresh-token!
  [refresh-token]
  (when-not (seq refresh-token)
    (fail-missing-e2ee-password! {:reason :missing-refresh-token
                                  :hint "Run logseq login first."})))

(defn- missing-persisted-password-error?
  [error]
  (let [data (ex-data error)]
    (and (contains? #{:db-sync/missing-e2ee-password
                      :missing-e2ee-password}
                    (or (:code data)
                        (some-> error ex-message keyword)))
         (= :missing-persisted-password (:reason data)))))

(defn- parse-auth-file
  [text]
  (when (seq text)
    (try
      (js->clj (js/JSON.parse text) :keywordize-keys true)
      (catch :default _
        invalid-transit))))

(defn- <read-refresh-token-from-auth-file
  [platform']
  (p/let [text (-> (platform/read-text! platform' (auth-file-path))
                   (p/catch (fn [_]
                              nil)))
          auth-data (parse-auth-file text)]
    (when (= invalid-transit auth-data)
      (fail-missing-e2ee-password! {:reason :invalid-auth-file
                                    :hint "Run logseq login first."}))
    (let [refresh-token (:refresh-token auth-data)]
      (ensure-refresh-token! refresh-token)
      refresh-token)))

(defn- <save-e2ee-password
  [password]
  (p/let [platform' (platform/current)
          refresh-token (if (browser-runtime? platform')
                          (:auth/refresh-token @worker-state/*state)
                          (<read-refresh-token-from-auth-file platform'))
          _ (ensure-refresh-token! refresh-token)
          result (crypt/<encrypt-text-by-text-password refresh-token password)
          text (ldb/write-transit-str result)
          native-saved? (if (capacitor-runtime? platform')
                          (-> (ui-request/<request :native-save-e2ee-password
                                                   {:key e2ee-password-secret-key
                                                    :encrypted-text text})
                              (p/then (fn [resp]
                                        (true? (:supported? resp))))
                              (p/catch (fn [e]
                                         (log/warn :db-sync/save-e2ee-password-native-failed {:error e})
                                         false)))
                          false)]
    (if native-saved?
      nil
      (platform/save-secret-text! platform' e2ee-password-secret-key text))))

(defn- <read-platform-e2ee-password-text
  [platform']
  (-> (platform/read-secret-text platform' e2ee-password-secret-key)
      (p/catch (fn [e]
                 (log/warn :db-sync/read-e2ee-password-secret-failed {:error e})
                 nil))))

(defn- <read-e2ee-password
  [refresh-token]
  (ensure-refresh-token! refresh-token)
  (p/let [platform' (platform/current)
          native-result (if (capacitor-runtime? platform')
                          (-> (ui-request/<request :native-get-e2ee-password
                                                   {:key e2ee-password-secret-key})
                              (p/catch (fn [e]
                                         (log/warn :db-sync/read-e2ee-password-native-failed {:error e})
                                         {:supported? false})))
                          {:supported? false})
          text (if (:supported? native-result)
                 (:encrypted-text native-result)
                 (<read-platform-e2ee-password-text platform'))]
    (when-not (seq text)
      (throw-missing-e2ee-password! {:reason :missing-persisted-password
                                     :hint "Provide --e2ee-password to persist it."}))
    (let [data (try
                 (ldb/read-transit-str text)
                 (catch :default _
                   invalid-transit))]
      (when (= invalid-transit data)
        (fail-fast :db-sync/invalid-e2ee-password-payload
                   {:field :e2ee-password
                    :reason :invalid-transit-payload}))
      (crypt/<decrypt-text-by-text-password refresh-token data))))

(defn- <clear-e2ee-password!
  []
  (p/let [platform' (platform/current)
          native-deleted? (if (capacitor-runtime? platform')
                            (-> (ui-request/<request :native-delete-e2ee-password
                                                     {:key e2ee-password-secret-key})
                                (p/then (fn [resp]
                                          (true? (:supported? resp))))
                                (p/catch (fn [e]
                                           (log/warn :db-sync/delete-e2ee-password-native-failed {:error e})
                                           false)))
                            false)
          _ (when-not native-deleted?
              (-> (platform/delete-secret-text! platform' e2ee-password-secret-key)
                  (p/catch (fn [e]
                             (log/warn :db-sync/delete-e2ee-password-secret-failed {:error e})
                             nil))))]
    nil))

(defn e2ee-base
  []
  (or (:http-base @worker-state/*db-sync-config)
      (when-let [ws-url (:ws-url @worker-state/*db-sync-config)]
        (let [base (cond
                     (string/starts-with? ws-url "wss://")
                     (str "https://" (subs ws-url (count "wss://")))

                     (string/starts-with? ws-url "ws://")
                     (str "http://" (subs ws-url (count "ws://")))

                     :else ws-url)]
          (string/replace base #"/sync/%s$" "")))))

(defn graph-e2ee?
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (true? (ldb/get-graph-rtc-e2ee? @conn))))

(defn- get-user-uuid []
  (some-> (sync-util/auth-token) worker-util/parse-jwt :sub))

(defn- token->user-uuid
  [token]
  (some-> token worker-util/parse-jwt :sub))

(defn- <resolve-user-uuid
  []
  (let [user-id (get-user-uuid)]
    (if (seq user-id)
      (p/resolved user-id)
      (-> (sync-auth/<resolve-ws-token)
          (p/then token->user-uuid)
          (p/catch (fn [_error]
                     nil))))))

(defn- <get-item
  [k]
  (assert k)
  (p/let [r (platform/kv-get (platform/current) k)]
    (cond
      (instance? js/ArrayBuffer r) (js/Uint8Array. r)
      :else r)))

(defn- <set-item!
  [k value]
  (assert k)
  (platform/kv-set! (platform/current) k value))

(defn- <clear-item!
  [k]
  (assert k)
  (platform/kv-set! (platform/current) k nil))

(defn- graph-encrypted-aes-key-idb-key
  [graph-id]
  (str "rtc-encrypted-aes-key###" graph-id))

(defn- user-rsa-key-pair-idb-key
  [user-id]
  (str "rtc-user-rsa-key-pair###" user-id))

(defn <fetch-user-rsa-key-pair-raw
  [base]
  (fetch-json (str base "/e2ee/user-keys")
              {:method "GET"}
              {:response-schema :e2ee/user-keys}))

(defn- user-rsa-key-pair-valid?
  [pair]
  (and (map? pair)
       (string? (:public-key pair))
       (string? (:encrypted-private-key pair))))

(defn- <set-user-rsa-key-pair-to-idb!
  [base user-id pair]
  (when (and (string? base)
             (string? user-id)
             (user-rsa-key-pair-valid? pair))
    (<set-item! (user-rsa-key-pair-idb-key user-id)
                (ldb/write-transit-str pair)))
  pair)

(defn- <get-user-rsa-key-pair-from-idb
  [base user-id]
  (when (and (string? base) (string? user-id))
    (p/let [pair-str (<get-item (user-rsa-key-pair-idb-key user-id))
            pair (ldb/read-transit-str pair-str)]
      (when (user-rsa-key-pair-valid? pair)
        pair))))

(defn- <clear-user-rsa-key-pair-cache!
  [base user-id]
  (let [k [base user-id]]
    (swap! *user-rsa-key-pair-inflight dissoc k)
    (when (and (string? base) (string? user-id))
      (<clear-item! (user-rsa-key-pair-idb-key user-id)))))

(defn- <get-user-rsa-key-pair-raw
  [base]
  (p/let [user-id (<resolve-user-uuid)]
    (when-not (and (string? base) (string? user-id))
      (fail-fast :db-sync/missing-field {:base base :user-id user-id :field :user-rsa-key-pair}))
    (let [k [base user-id]]
      (if-let [inflight (get @*user-rsa-key-pair-inflight k)]
        inflight
        (let [task (-> (p/let [cached (<get-user-rsa-key-pair-from-idb base user-id)]
                         (if cached
                           cached
                           (p/let [pair (<fetch-user-rsa-key-pair-raw base)]
                             (if (user-rsa-key-pair-valid? pair)
                               (p/let [_ (<set-user-rsa-key-pair-to-idb! base user-id pair)]
                                 pair)
                               nil))))
                       (p/finally (fn []
                                    (swap! *user-rsa-key-pair-inflight dissoc k))))]
          (swap! *user-rsa-key-pair-inflight assoc k task)
          task)))))

(defn <upload-user-rsa-key-pair!
  [base public-key encrypted-private-key]
  (let [body (coerce-http-request :e2ee/user-keys
                                  {:public-key public-key
                                   :encrypted-private-key encrypted-private-key})]
    (when (nil? body)
      (fail-fast :db-sync/invalid-field {:type :e2ee/user-keys :body body}))
    (p/let [pair (fetch-json (str base "/e2ee/user-keys")
                             {:method "POST"
                              :headers {"content-type" "application/json"}
                              :body (js/JSON.stringify (clj->js body))}
                             {:response-schema :e2ee/user-keys})
            user-id (<resolve-user-uuid)
            _ (<set-user-rsa-key-pair-to-idb! base user-id pair)]
      pair)))

(defn- <request-e2ee-password-from-ui
  [payload]
  (p/let [{:keys [password]} (ui-request/<request :request-e2ee-password
                                                   payload
                                                   {:hint "Provide e2ee-password to continue."})]
    (when-not (seq password)
      (fail-fast :db-sync/missing-e2ee-password {:field :e2ee-password
                                                 :reason :empty-ui-password}))
    password))

(defn- <verify-and-save-e2ee-password!
  [password encrypted-private-key-or-str]
  (when-not (seq password)
    (fail-missing-e2ee-password! {:reason :empty-password}))
  (p/let [encrypted-private-key (if (string? encrypted-private-key-or-str)
                                  (ldb/read-transit-str encrypted-private-key-or-str)
                                  encrypted-private-key-or-str)
          private-key (crypt/<decrypt-private-key password encrypted-private-key)
          _ (<save-e2ee-password password)]
    private-key))

(defn- <verify-and-save-e2ee-password-from-server!
  [password]
  (let [base (e2ee-base)]
    (when-not (string? base)
      (fail-fast :db-sync/missing-field {:base base
                                         :field :e2ee-base}))
    (p/let [{:keys [encrypted-private-key]} (<get-user-rsa-key-pair-raw base)]
      (when-not (string? encrypted-private-key)
        (fail-fast :db-sync/missing-field {:base base
                                           :field :encrypted-private-key}))
      (<verify-and-save-e2ee-password! password encrypted-private-key))))

(defn- <generate-and-upload-user-rsa-key-pair!
  [base {:keys [password]}]
  (p/let [{:keys [publicKey privateKey]} (crypt/<generate-rsa-key-pair)
          password (cond
                     (and (string? password) (seq password))
                     password

                     (interactive-runtime?)
                     (<request-e2ee-password-from-ui {:reason :generate-user-rsa-key-pair})

                     :else
                     (fail-missing-e2ee-password! {:reason :missing-password-for-generate-user-rsa-key-pair
                                                   :hint "Provide --e2ee-password when running sync ensure-keys --upload-keys."}))
          encrypted-private-key (crypt/<encrypt-private-key password privateKey)
          exported-public-key (crypt/<export-public-key publicKey)
          public-key-str (ldb/write-transit-str exported-public-key)
          encrypted-private-key-str (ldb/write-transit-str encrypted-private-key)]
    (p/let [_ (<upload-user-rsa-key-pair! base public-key-str encrypted-private-key-str)]
      {:public-key public-key-str
       :encrypted-private-key encrypted-private-key-str
       :password password})))

(defn- <ensure-user-rsa-key-pair-raw
  [base {:keys [ensure-server? server-rsa-keys-exists?] :as opts}]
  (p/let [existing (<get-user-rsa-key-pair-raw base)
          existing-valid? (user-rsa-key-pair-valid? existing)
          server-rsa-keys-exists?
          (cond
            (boolean? server-rsa-keys-exists?) server-rsa-keys-exists?
            (and ensure-server? existing-valid?)
            (p/let [server-pair (<fetch-user-rsa-key-pair-raw base)]
              (user-rsa-key-pair-valid? server-pair))
            :else nil)]
    (cond
      (and existing-valid? (not= false server-rsa-keys-exists?))
      existing

      existing-valid?
      (p/let [_ (<upload-user-rsa-key-pair! base (:public-key existing) (:encrypted-private-key existing))]
        existing)

      :else
      (<generate-and-upload-user-rsa-key-pair! base opts))))

(defn ensure-user-rsa-keys!
  ([]
   (ensure-user-rsa-keys! nil))
  ([opts]
   (let [base (e2ee-base)]
     (if (string? base)
       (<ensure-user-rsa-key-pair-raw base opts)
       (do
         (log/info :db-sync/skip-ensure-user-rsa-keys {:reason :missing-e2ee-base})
         (p/resolved nil))))))

(defn- <decrypt-private-key
  [encrypted-private-key-str]
  (let [<decrypt-in-headless
        (fn [encrypted-private-key]
          (let [refresh-token (:auth/refresh-token @worker-state/*state)]
            (p/let [password (<read-e2ee-password refresh-token)]
              (when-not (seq password)
                (fail-missing-e2ee-password! {:reason :headless-empty-password
                                              :hint "Provide --e2ee-password to persist it."}))
              (crypt/<decrypt-private-key password encrypted-private-key))))

        <decrypt-with-ui-request
        (fn [encrypted-private-key]
          (p/let [password (<request-e2ee-password-from-ui {:reason :decrypt-user-rsa-private-key})]
            (<verify-and-save-e2ee-password! password encrypted-private-key)))]
    (p/let [encrypted-private-key (ldb/read-transit-str encrypted-private-key-str)]
      (-> (<decrypt-in-headless encrypted-private-key)
          (p/catch (fn [headless-error]
                     (if-not (interactive-runtime?)
                       (p/rejected headless-error)
                       (-> (<decrypt-with-ui-request encrypted-private-key)
                           (p/catch (fn [ui-error]
                                      (if (missing-persisted-password-error? headless-error)
                                        (p/rejected ui-error)
                                        (p/rejected headless-error))))))))))))

(defn- <import-public-key
  [public-key-str]
  (p/let [exported (ldb/read-transit-str public-key-str)]
    (crypt/<import-public-key exported)))

(defn- <fetch-user-public-key-by-email
  [base email]
  (fetch-json (str base "/e2ee/user-public-key?email=" (js/encodeURIComponent email))
              {:method "GET"}
              {:response-schema :e2ee/user-public-key}))

(defn- <fetch-graph-encrypted-aes-key-raw
  [base graph-id]
  (fetch-json (str base "/e2ee/graphs/" graph-id "/aes-key")
              {:method "GET"}
              {:response-schema :e2ee/graph-aes-key}))

(defn- <fetch-graph-encrypted-aes-key
  [base graph-id]
  (when graph-id
    (p/let [resp (<fetch-graph-encrypted-aes-key-raw base graph-id)]
      (when-let [encrypted-aes-key (:encrypted-aes-key resp)]
        (ldb/read-transit-str encrypted-aes-key)))))

(defn- <upsert-graph-encrypted-aes-key!
  [base graph-id encrypted-aes-key]
  (let [body (coerce-http-request :e2ee/graph-aes-key
                                  {:encrypted-aes-key encrypted-aes-key})]
    (when (nil? body)
      (fail-fast :db-sync/invalid-field {:type :e2ee/graph-aes-key :body body}))
    (fetch-json (str base "/e2ee/graphs/" graph-id "/aes-key")
                {:method "POST"
                 :headers {"content-type" "application/json"}
                 :body (js/JSON.stringify (clj->js body))}
                {:response-schema :e2ee/graph-aes-key})))

(defn- <load-user-rsa-key-material
  [base user-id graph-id]
  (letfn [(<load-once []
            (p/let [{:keys [public-key encrypted-private-key]} (<ensure-user-rsa-key-pair-raw base nil)
                    _ (when-not (and (string? public-key) (string? encrypted-private-key))
                        (fail-fast :db-sync/missing-field
                                   {:base base
                                    :user-id user-id
                                    :graph-id graph-id
                                    :field :user-rsa-key-pair}))
                    public-key' (<import-public-key public-key)
                    private-key' (<decrypt-private-key encrypted-private-key)]
              {:public-key public-key'
               :private-key private-key'}))]
    (-> (<load-once)
        (p/catch (fn [error]
                   (-> (p/let [_ (<clear-user-rsa-key-pair-cache! base user-id)]
                         (<load-once))
                       (p/catch (fn [retry-error]
                                  (log/warn :db-sync/user-rsa-key-cache-invalid
                                            {:base base
                                             :user-id user-id
                                             :graph-id graph-id
                                             :first-error error
                                             :retry-error retry-error})
                                  (throw retry-error)))))))))

(defn <ensure-graph-aes-key
  [repo graph-id]
  (if-not (graph-e2ee? repo)
    (p/resolved nil)
    (if-let [cached (get @*graph->aes-key graph-id)]
      (p/resolved cached)
      (let [base (e2ee-base)]
        (p/let [user-id (<resolve-user-uuid)]
          (when-not (and (string? base) (string? user-id))
            (fail-fast :db-sync/missing-field {:base base :user-id user-id :graph-id graph-id}))
          (p/let [{:keys [public-key private-key]} (<load-user-rsa-key-material base user-id graph-id)
                  local-encrypted (when graph-id
                                    (<get-item (graph-encrypted-aes-key-idb-key graph-id)))
                  remote-encrypted (when (and (nil? local-encrypted) graph-id)
                                     (<fetch-graph-encrypted-aes-key base graph-id))
                  encrypted-aes-key (or local-encrypted remote-encrypted)
                  aes-key (if encrypted-aes-key
                            (-> (crypt/<decrypt-aes-key private-key encrypted-aes-key)
                                (p/catch (fn [error]
                                           (if-not (and graph-id local-encrypted)
                                             (throw error)
                                             (let [aes-key-k (graph-encrypted-aes-key-idb-key graph-id)]
                                               (-> (p/let [_ (<clear-item! aes-key-k)
                                                           refetched-encrypted (<fetch-graph-encrypted-aes-key base graph-id)]
                                                     (if-not refetched-encrypted
                                                       (throw error)
                                                       (p/let [aes-key (crypt/<decrypt-aes-key private-key refetched-encrypted)
                                                               _ (<set-item! aes-key-k refetched-encrypted)]
                                                         aes-key)))
                                                   (p/catch (fn [retry-error]
                                                              (log/warn :db-sync/graph-aes-key-cache-invalid
                                                                        {:base base
                                                                         :user-id user-id
                                                                         :graph-id graph-id
                                                                         :first-error error
                                                                         :retry-error retry-error})
                                                              (throw retry-error)))))))))
                            (p/let [aes-key (crypt/<generate-aes-key)
                                    encrypted (crypt/<encrypt-aes-key public-key aes-key)
                                    encrypted-str (ldb/write-transit-str encrypted)
                                    _ (<upsert-graph-encrypted-aes-key! base graph-id encrypted-str)
                                    _ (<set-item! (graph-encrypted-aes-key-idb-key graph-id) encrypted)]
                              aes-key))
                  _ (when (and graph-id encrypted-aes-key (nil? local-encrypted))
                      (<set-item! (graph-encrypted-aes-key-idb-key graph-id) encrypted-aes-key))]
            (swap! *graph->aes-key assoc graph-id aes-key)
            aes-key))))))

(defn <fetch-graph-aes-key-for-download
  [graph-id]
  (let [base (e2ee-base)
        aes-key-k (graph-encrypted-aes-key-idb-key graph-id)]
    (when-not (and (string? base) (string? graph-id))
      (fail-fast :db-sync/missing-field {:base base :graph-id graph-id}))
    (letfn [(<fetch-once [{:keys [public-key encrypted-private-key]}]
              (p/let [_ (<clear-item! aes-key-k)]
                (when-not (and (string? public-key) (string? encrypted-private-key))
                  (fail-fast :db-sync/missing-field {:graph-id graph-id :field :user-rsa-key-pair}))
                (p/let [private-key (<decrypt-private-key encrypted-private-key)
                        encrypted-aes-key (p/let [resp (<fetch-graph-encrypted-aes-key-raw base graph-id)]
                                            (when-let [encrypted-aes-key (:encrypted-aes-key resp)]
                                              (ldb/read-transit-str encrypted-aes-key)))]
                  (if-not encrypted-aes-key
                    (fail-fast :db-sync/missing-field {:graph-id graph-id :field :encrypted-aes-key})
                    (<set-item! aes-key-k encrypted-aes-key))
                  (p/let [aes-key (crypt/<decrypt-aes-key private-key encrypted-aes-key)]
                    (swap! *graph->aes-key assoc graph-id aes-key)
                    aes-key))))]
      (p/let [pair (<get-user-rsa-key-pair-raw base)]
        (-> (<fetch-once pair)
            (p/catch
             (fn [error]
               (let [user-id (get-user-uuid)]
                 (if (and (= "decrypt-aes-key" (ex-message error))
                          (string? user-id))
                   (-> (p/let [_ (<clear-user-rsa-key-pair-cache! base user-id)
                               refreshed-pair (<get-user-rsa-key-pair-raw base)]
                         (<fetch-once refreshed-pair))
                       (p/catch (fn [retry-error]
                                  (log/warn :db-sync/user-rsa-key-cache-invalid-on-download
                                            {:base base
                                             :user-id user-id
                                             :graph-id graph-id
                                             :first-error error
                                             :retry-error retry-error})
                                  (throw retry-error))))
                   (throw error))))))))))

(defn <grant-graph-access!
  [repo graph-id target-email]
  (if-not (graph-e2ee? repo)
    (p/resolved nil)
    (let [base (e2ee-base)]
      (when-not (string? base)
        (fail-fast :db-sync/missing-field {:base base :graph-id graph-id}))
      (p/let [aes-key (<ensure-graph-aes-key repo graph-id)
              _ (when (nil? aes-key)
                  (fail-fast :db-sync/missing-field {:repo repo :field :aes-key}))
              resp (<fetch-user-public-key-by-email base target-email)
              public-key-str (:public-key resp)]
        (if-not (string? public-key-str)
          (fail-fast :db-sync/missing-field {:repo repo :field :public-key :email target-email})
          (p/let [public-key (<import-public-key public-key-str)
                  encrypted (crypt/<encrypt-aes-key public-key aes-key)
                  encrypted-str (ldb/write-transit-str encrypted)
                  body (coerce-http-request :e2ee/grant-access
                                            {:target-user-email+encrypted-aes-key-coll
                                             [{:email target-email
                                               :encrypted-aes-key encrypted-str}]})
                  _ (when (nil? body)
                      (fail-fast :db-sync/invalid-field {:type :e2ee/grant-access :body body}))
                  _ (fetch-json (str base "/e2ee/graphs/" graph-id "/grant-access")
                                {:method "POST"
                                 :headers {"content-type" "application/json"}
                                 :body (js/JSON.stringify (clj->js body))}
                                {:response-schema :e2ee/grant-access})]
            nil))))))

(defn <encrypt-text-value
  [aes-key value]
  (assert (string? value) (str "encrypting value should be a string, value: " value))
  (p/let [encrypted (crypt/<encrypt-text aes-key (ldb/write-transit-str value))]
    (ldb/write-transit-str encrypted)))

(defn <decrypt-text-value
  [aes-key value]
  (assert (string? value) (str "encrypted value should be a string, value: " value))
  (let [decoded (read-transit-safe value)]
    (if (= decoded invalid-transit)
      (p/resolved value)
      (p/let [value (or (crypt/<decrypt-text-if-encrypted aes-key decoded)
                        decoded)
              value' (if (string? value)
                       (read-transit-safe value)
                       value)]
        (if (= value' invalid-transit)
          value
          value')))))

(defn- encrypt-tx-item
  [aes-key item]
  (cond
    (and (vector? item) (<= 4 (count item)))
    (let [attr (nth item 2)
          v (nth item 3)]
      (if (contains? sync-const/encrypt-attr-set attr)
        (p/let [v' (<encrypt-text-value aes-key v)]
          (assoc item 3 v'))
        (p/resolved item)))

    :else
    (p/resolved item)))

(defn- decrypt-tx-item
  [aes-key item]
  (cond
    (and (vector? item) (<= 4 (count item)))
    (let [attr (nth item 2)
          v (nth item 3)]
      (if (contains? sync-const/encrypt-attr-set attr)
        (p/let [v' (<decrypt-text-value aes-key v)]
          (assoc item 3 v'))
        (p/resolved item)))

    :else
    (p/resolved item)))

(defn <encrypt-tx-data
  [aes-key tx-data]
  (p/let [items (p/all (mapv (fn [item] (encrypt-tx-item aes-key item)) tx-data))]
    items))

(defn <decrypt-tx-data
  [aes-key tx-data]
  (p/let [items (p/all (mapv (fn [item] (decrypt-tx-item aes-key item)) tx-data))]
    items))

(defn- <decrypt-datoms
  [aes-key data]
  (p/all
   (map
    (fn [[e a v t]]
      (if (contains? sync-const/encrypt-attr-set a)
        (p/let [v' (<decrypt-text-value aes-key v)]
          [e a v' t])
        [e a v t]))
    data)))

(defn- <decrypt-snapshot-row
  [aes-key row]
  (let [[addr raw-content raw-addresses] row
        data (ldb/read-transit-str raw-content)
        addresses (when raw-addresses
                    (js/JSON.parse raw-addresses))]
    (if (map? data)
      (p/let [keys (:keys data)
              keys' (if (seq keys)
                      (<decrypt-datoms aes-key (:keys data))
                      keys)
              result (assoc data :keys keys')]
        [addr (ldb/write-transit-str (cond-> result
                                       (some? addresses)
                                       (assoc :addresses addresses)))
         raw-addresses])
      (p/let [result (p/all (map #(<decrypt-datoms aes-key %) data))]
        [addr (ldb/write-transit-str result) raw-addresses]))))

(defn <decrypt-snapshot-rows-batch
  [aes-key rows-batch]
  (p/all (map #(<decrypt-snapshot-row aes-key %) rows-batch)))

(defn <decrypt-snapshot-datoms-batch
  [aes-key datoms]
  (p/all
   (map (fn [{:keys [a v] :as datom}]
          (if (contains? sync-const/encrypt-attr-set a)
            (p/let [v' (<decrypt-text-value aes-key v)]
              (assoc datom :v v'))
            (p/resolved datom)))
        datoms)))

(defn <encrypt-datoms
  ([aes-key datoms]
   (<encrypt-datoms aes-key datoms nil))
  ([aes-key datoms progress-f]
   (let [batch-size 5000
         total-count (count datoms)
         batches (partition-all batch-size datoms)]
     (p/loop [remaining batches
              result []
              encrypted-count 0]
       (if (empty? remaining)
         result
         (p/let [batch (first remaining)
                 encrypted (p/all (map (fn [datom]
                                         (if (contains? sync-const/encrypt-attr-set (:a datom))
                                           (p/let [v' (<encrypt-text-value aes-key (:v datom))]
                                             (assoc datom :v v'))
                                           (p/resolved datom)))
                                       batch))]
           (let [encrypted-count' (+ encrypted-count (count batch))]
             (when progress-f
               (progress-f encrypted-count' total-count))
             (p/recur (rest remaining) (into result encrypted) encrypted-count'))))))))

(defn- <re-encrypt-private-key
  [encrypted-private-key-str old-password new-password]
  (p/let [encrypted-private-key (ldb/read-transit-str encrypted-private-key-str)
          private-key (crypt/<decrypt-private-key old-password encrypted-private-key)
          new-encrypted-private-key (crypt/<encrypt-private-key new-password private-key)]
    (ldb/write-transit-str new-encrypted-private-key)))

(defn <change-e2ee-password!
  [_refresh-token user-uuid old-password new-password]
  (let [base (e2ee-base)]
    (when-not (string? base)
      (fail-fast :db-sync/missing-field {:base base :user-uuid user-uuid}))
    (p/let [{:keys [public-key encrypted-private-key]} (<get-user-rsa-key-pair-raw base)]
      (when-not (and (string? public-key) (string? encrypted-private-key))
        (fail-fast :db-sync/missing-field {:base base :user-uuid user-uuid :field :user-rsa-key-pair}))
      (p/let [encrypted-private-key' (<re-encrypt-private-key encrypted-private-key old-password new-password)
              _ (<upload-user-rsa-key-pair! base public-key encrypted-private-key')
              _ (<save-e2ee-password new-password)]
        nil))))

(defn cancel-ui-requests!
  [context]
  (ui-request/cancel-all! context))

(def-thread-api :thread-api/get-user-rsa-key-pair
  [_token _user-uuid]
  (let [base (e2ee-base)]
    (when-not (string? base)
      (fail-fast :db-sync/missing-field {:base base}))
    (p/let [{:keys [public-key encrypted-private-key]} (<get-user-rsa-key-pair-raw base)]
      (when (and public-key encrypted-private-key)
        {:public-key public-key
         :encrypted-private-key encrypted-private-key}))))

(def-thread-api :thread-api/init-user-rsa-key-pair
  [_token _refresh-token _user-uuid]
  (let [base (e2ee-base)]
    (when-not (string? base)
      (fail-fast :db-sync/missing-field {:base base}))
    (p/let [existing (<get-user-rsa-key-pair-raw base)]
      (when-not (and (string? (:public-key existing))
                     (string? (:encrypted-private-key existing)))
        (p/let [{:keys [publicKey privateKey]} (crypt/<generate-rsa-key-pair)
                password (<request-e2ee-password-from-ui {:reason :init-user-rsa-key-pair})
                encrypted-private-key (crypt/<encrypt-private-key password privateKey)
                exported-public-key (crypt/<export-public-key publicKey)
                public-key-str (ldb/write-transit-str exported-public-key)
                encrypted-private-key-str (ldb/write-transit-str encrypted-private-key)
                _ (<upload-user-rsa-key-pair! base public-key-str encrypted-private-key-str)
                _ (<save-e2ee-password password)]
          nil)))))

(def-thread-api :thread-api/reset-user-rsa-key-pair
  [_token _refresh-token _user-uuid new-password]
  (p/let [{:keys [publicKey privateKey]} (crypt/<generate-rsa-key-pair)
          encrypted-private-key (crypt/<encrypt-private-key new-password privateKey)
          exported-public-key (crypt/<export-public-key publicKey)
          public-key-str (ldb/write-transit-str exported-public-key)
          encrypted-private-key-str (ldb/write-transit-str encrypted-private-key)
          base (e2ee-base)]
    (when-not (string? base)
      (fail-fast :db-sync/missing-field {:base base}))
    (p/let [_ (<upload-user-rsa-key-pair! base public-key-str encrypted-private-key-str)
            _ (<save-e2ee-password new-password)]
      nil)))

(def-thread-api :thread-api/change-e2ee-password
  [_token refresh-token user-uuid old-password new-password]
  (<change-e2ee-password! refresh-token user-uuid old-password new-password))

(def-thread-api :thread-api/verify-and-save-e2ee-password
  [_refresh-token password]
  (p/let [_ (<verify-and-save-e2ee-password-from-server! password)]
    nil))

(def-thread-api :thread-api/get-e2ee-password
  [refresh-token]
  (p/let [password (<read-e2ee-password refresh-token)]
    {:password password}))

(def-thread-api :thread-api/save-e2ee-password
  [password]
  (<save-e2ee-password password))

(def-thread-api :thread-api/clear-e2ee-password
  []
  (<clear-e2ee-password!))
