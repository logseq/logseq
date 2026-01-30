(ns frontend.worker.sync.crypt
  "E2EE helpers for db-sync."
  (:require ["/frontend/idbkv" :as idb-keyval]
            [clojure.string :as string]
            [frontend.common.crypt :as crypt]
            [frontend.common.file.opfs :as opfs]
            [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.const :as sync-const]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.db-sync.malli-schema :as db-sync-schema]
            [promesa.core :as p]))

(defonce ^:private *repo->aes-key (atom {}))
(defonce ^:private e2ee-store (delay (idb-keyval/newStore "localforage" "keyvaluepairs" 2)))
(defonce ^:private e2ee-password-file "e2ee-password")
(defonce ^:private native-env?
  (let [href (try (.. js/self -location -href)
                  (catch :default _ nil))]
    (boolean (and (string? href)
                  (or (string/includes? href "electron=true")
                      (string/includes? href "capacitor=true"))))))

(def ^:private invalid-coerce ::invalid-coerce)
(def ^:private invalid-transit ::invalid-transit)

(defn- native-worker?
  []
  native-env?)

(defn- <native-save-password-text!
  [encrypted-text]
  (worker-state/<invoke-main-thread :thread-api/native-save-e2ee-password encrypted-text))

(defn- <native-read-password-text
  []
  (worker-state/<invoke-main-thread :thread-api/native-get-e2ee-password))

(defn- <save-e2ee-password
  [refresh-token password]
  (p/let [result (crypt/<encrypt-text-by-text-password refresh-token password)
          text (ldb/write-transit-str result)]
    (if (native-worker?)
      (-> (p/let [_ (<native-save-password-text! text)]
            nil)
          (p/catch (fn [e]
                     (log/error :native-save-e2ee-password {:error e})
                     (opfs/<write-text! e2ee-password-file text))))
      (opfs/<write-text! e2ee-password-file text))))

(defn- <read-e2ee-password
  [refresh-token]
  (p/let [text (if (native-worker?)
                 (<native-read-password-text)
                 (opfs/<read-text! e2ee-password-file))
          data (ldb/read-transit-str text)
          password (crypt/<decrypt-text-by-text-password refresh-token data)]
    password))

(defn- auth-token []
  (worker-state/get-id-token))

(defn- auth-headers []
  (when-let [token (auth-token)]
    {"authorization" (str "Bearer " token)}))

(defn- with-auth-headers [opts]
  (if-let [auth (auth-headers)]
    (assoc opts :headers (merge (or (:headers opts) {}) auth))
    opts))

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

(defn fail-fast [tag data]
  (log/error tag data)
  (throw (ex-info (name tag) data)))

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

(defn graph-e2ee?
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (true? (ldb/get-graph-rtc-e2ee? @conn))))

(defn- get-user-uuid []
  (some-> (worker-state/get-id-token) worker-util/parse-jwt :sub))

(defn- <get-item
  [k]
  (assert (and k @e2ee-store))
  (p/let [r (idb-keyval/get k @e2ee-store)]
    (js->clj r :keywordize-keys true)))

(defn- <set-item!
  [k value]
  (assert (and k @e2ee-store))
  (idb-keyval/set k value @e2ee-store))

(defn- <clear-item!
  [k]
  (assert (and k @e2ee-store))
  (idb-keyval/del k @e2ee-store))

(defn- graph-encrypted-aes-key-idb-key
  [graph-id]
  (str "rtc-encrypted-aes-key###" graph-id))

(defn <fetch-user-rsa-key-pair-raw
  [base]
  (fetch-json (str base "/e2ee/user-keys")
              {:method "GET"}
              {:response-schema :e2ee/user-keys}))

(defn <upload-user-rsa-key-pair!
  [base public-key encrypted-private-key]
  (let [body (coerce-http-request :e2ee/user-keys
                                  {:public-key public-key
                                   :encrypted-private-key encrypted-private-key})]
    (when (nil? body)
      (fail-fast :db-sync/invalid-field {:type :e2ee/user-keys :body body}))
    (fetch-json (str base "/e2ee/user-keys")
                {:method "POST"
                 :headers {"content-type" "application/json"}
                 :body (js/JSON.stringify (clj->js body))}
                {:response-schema :e2ee/user-keys})))

(defn- <ensure-user-rsa-key-pair-raw
  [base]
  (p/let [existing (-> (<fetch-user-rsa-key-pair-raw base)
                       (p/catch (fn [error]
                                  (throw error))))]
    (if (and (string? (:public-key existing))
             (string? (:encrypted-private-key existing)))
      existing
      (p/let [{:keys [publicKey privateKey]} (crypt/<generate-rsa-key-pair)
              {:keys [password]} (worker-state/<invoke-main-thread :thread-api/request-e2ee-password)
              encrypted-private-key (crypt/<encrypt-private-key password privateKey)
              exported-public-key (crypt/<export-public-key publicKey)
              public-key-str (ldb/write-transit-str exported-public-key)
              encrypted-private-key-str (ldb/write-transit-str encrypted-private-key)]
        (p/let [_ (<upload-user-rsa-key-pair! base public-key-str encrypted-private-key-str)]
          {:public-key public-key-str
           :encrypted-private-key encrypted-private-key-str
           :password password})))))

(defn ensure-user-rsa-keys!
  []
  (let [base (e2ee-base)]
    (when-not (string? base)
      (fail-fast :db-sync/missing-field {:base base}))
    (<ensure-user-rsa-key-pair-raw base)))

(defn- <decrypt-private-key
  [encrypted-private-key-str]
  (p/let [encrypted-private-key (ldb/read-transit-str encrypted-private-key-str)
          exported-private-key (worker-state/<invoke-main-thread
                                :thread-api/decrypt-user-e2ee-private-key
                                encrypted-private-key)]
    (crypt/<import-private-key exported-private-key)))

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

(defn <ensure-graph-aes-key
  [repo graph-id]
  (if-not (graph-e2ee? repo)
    (p/resolved nil)
    (if-let [cached (get @*repo->aes-key repo)]
      (p/resolved cached)
      (let [base (e2ee-base)
            user-id (get-user-uuid)]
        (when-not (and (string? base) (string? user-id))
          (fail-fast :db-sync/missing-field {:base base :user-id user-id :graph-id graph-id}))
        (p/let [{:keys [public-key encrypted-private-key]} (<ensure-user-rsa-key-pair-raw base)
                public-key' (when (string? public-key) (<import-public-key public-key))
                private-key' (when (string? encrypted-private-key) (<decrypt-private-key encrypted-private-key))
                local-encrypted (when graph-id
                                  (<get-item (graph-encrypted-aes-key-idb-key graph-id)))
                remote-encrypted (when (and (nil? local-encrypted) graph-id)
                                   (p/let [resp (<fetch-graph-encrypted-aes-key-raw base graph-id)]
                                     (when-let [encrypted-aes-key (:encrypted-aes-key resp)]
                                       (ldb/read-transit-str encrypted-aes-key))))
                encrypted-aes-key (or local-encrypted remote-encrypted)
                aes-key (if encrypted-aes-key
                          (crypt/<decrypt-aes-key private-key' encrypted-aes-key)
                          (p/let [aes-key (crypt/<generate-aes-key)
                                  encrypted (crypt/<encrypt-aes-key public-key' aes-key)
                                  encrypted-str (ldb/write-transit-str encrypted)
                                  _ (<upsert-graph-encrypted-aes-key! base graph-id encrypted-str)
                                  _ (<set-item! (graph-encrypted-aes-key-idb-key graph-id) encrypted)]
                            aes-key))
                _ (when (and graph-id encrypted-aes-key (nil? local-encrypted))
                    (<set-item! (graph-encrypted-aes-key-idb-key graph-id) encrypted-aes-key))]
          (swap! *repo->aes-key assoc repo aes-key)
          aes-key)))))

(defn <fetch-graph-aes-key-for-download
  [repo graph-id]
  (let [base (e2ee-base)
        aes-key-k (graph-encrypted-aes-key-idb-key graph-id)]
    (when-not (and (string? base) (string? graph-id))
      (fail-fast :db-sync/missing-field {:base base :graph-id graph-id}))
    (p/let [{:keys [public-key encrypted-private-key]} (<fetch-user-rsa-key-pair-raw base)]
      (<clear-item! aes-key-k)
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
          (swap! *repo->aes-key assoc repo aes-key)
          aes-key)))))

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
  (let [decoded (ldb/read-transit-str value)]
    (if (= decoded invalid-transit)
      (p/resolved value)
      (p/let [value (crypt/<decrypt-text-if-encrypted aes-key decoded)
              value' (ldb/read-transit-str value)]
        value'))))

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

(defn <encrypt-datoms
  [aes-key datoms]
  (p/all (map (fn [d]
                (if (contains? sync-const/encrypt-attr-set (:a d))
                  (p/let [v' (<encrypt-text-value aes-key (:v d))]
                    (assoc d :v v'))
                  (p/resolved d)))
              datoms)))

(defn- <re-encrypt-private-key
  [encrypted-private-key-str old-password new-password]
  (p/let [encrypted-private-key (ldb/read-transit-str encrypted-private-key-str)
          private-key (crypt/<decrypt-private-key old-password encrypted-private-key)
          new-encrypted-private-key (crypt/<encrypt-private-key new-password private-key)]
    (ldb/write-transit-str new-encrypted-private-key)))

(defn <change-e2ee-password!
  [refresh-token user-uuid old-password new-password]
  (let [base (e2ee-base)]
    (when-not (string? base)
      (fail-fast :db-sync/missing-field {:base base :user-uuid user-uuid}))
    (p/let [{:keys [public-key encrypted-private-key]} (<fetch-user-rsa-key-pair-raw base)]
      (when-not (and (string? public-key) (string? encrypted-private-key))
        (fail-fast :db-sync/missing-field {:base base :user-uuid user-uuid :field :user-rsa-key-pair}))
      (p/let [encrypted-private-key' (<re-encrypt-private-key encrypted-private-key old-password new-password)
              _ (<upload-user-rsa-key-pair! base public-key encrypted-private-key')
              _ (<save-e2ee-password refresh-token new-password)]
        nil))))

(def-thread-api :thread-api/get-user-rsa-key-pair
  [_token _user-uuid]
  (let [base (e2ee-base)]
    (when-not (string? base)
      (fail-fast :db-sync/missing-field {:base base}))
    (p/let [{:keys [public-key encrypted-private-key]} (<fetch-user-rsa-key-pair-raw base)]
      (when (and public-key encrypted-private-key)
        {:public-key public-key
         :encrypted-private-key encrypted-private-key}))))

(def-thread-api :thread-api/init-user-rsa-key-pair
  [_token refresh-token _user-uuid]
  (let [base (e2ee-base)]
    (when-not (string? base)
      (fail-fast :db-sync/missing-field {:base base}))
    (p/let [existing (<fetch-user-rsa-key-pair-raw base)]
      (when-not (and (string? (:public-key existing))
                     (string? (:encrypted-private-key existing)))
        (p/let [{:keys [publicKey privateKey]} (crypt/<generate-rsa-key-pair)
                {:keys [password]} (worker-state/<invoke-main-thread :thread-api/request-e2ee-password)
                encrypted-private-key (crypt/<encrypt-private-key password privateKey)
                exported-public-key (crypt/<export-public-key publicKey)
                public-key-str (ldb/write-transit-str exported-public-key)
                encrypted-private-key-str (ldb/write-transit-str encrypted-private-key)
                _ (<upload-user-rsa-key-pair! base public-key-str encrypted-private-key-str)
                _ (<save-e2ee-password refresh-token password)]
          nil)))))

(def-thread-api :thread-api/reset-user-rsa-key-pair
  [_token refresh-token _user-uuid new-password]
  (p/let [{:keys [publicKey privateKey]} (crypt/<generate-rsa-key-pair)
          encrypted-private-key (crypt/<encrypt-private-key new-password privateKey)
          exported-public-key (crypt/<export-public-key publicKey)
          public-key-str (ldb/write-transit-str exported-public-key)
          encrypted-private-key-str (ldb/write-transit-str encrypted-private-key)
          base (e2ee-base)]
    (when-not (string? base)
      (fail-fast :db-sync/missing-field {:base base}))
    (p/let [_ (<upload-user-rsa-key-pair! base public-key-str encrypted-private-key-str)
            _ (<save-e2ee-password refresh-token new-password)]
      nil)))

(def-thread-api :thread-api/change-e2ee-password
  [_token refresh-token user-uuid old-password new-password]
  (<change-e2ee-password! refresh-token user-uuid old-password new-password))

(def-thread-api :thread-api/get-e2ee-password
  [refresh-token]
  (-> (p/let [password (<read-e2ee-password refresh-token)]
        {:password password})
      (p/catch (fn [e]
                 (log/error :read-e2ee-password e)
                 (ex-info ":thread-api/get-e2ee-password" {})))))

(def-thread-api :thread-api/save-e2ee-password
  [refresh-token password]
  (<save-e2ee-password refresh-token password))
