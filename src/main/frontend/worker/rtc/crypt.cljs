(ns frontend.worker.rtc.crypt
  "rtc e2ee related.
  Each user has an RSA key pair.
  Each graph has an AES key.
  Server stores the encrypted AES key, public key, and encrypted private key."
  (:require ["/frontend/idbkv" :as idb-keyval]
            [clojure.string :as string]
            [frontend.common.crypt :as crypt]
            [frontend.common.file.opfs :as opfs]
            [frontend.common.missionary :as c.m]
            [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker.rtc.ws-util :as ws-util]
            [frontend.worker.state :as worker-state]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [missionary.core :as m]
            [promesa.core :as p])
  (:import [missionary Cancelled]))

(defonce ^:private store (delay (idb-keyval/newStore "localforage" "keyvaluepairs" 2)))
(defonce ^:private e2ee-password-file "e2ee-password")
(defonce ^:private native-env?
  (let [href (try (.. js/self -location -href)
                  (catch :default _ nil))]
    (boolean (and (string? href)
                  (or (string/includes? href "electron=true")
                      (string/includes? href "capacitor=true"))))))

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

(defn- <get-item
  [k]
  (assert (and k @store))
  (p/let [r (idb-keyval/get k @store)]
    (js->clj r :keywordize-keys true)))

(defn- <set-item!
  [k value]
  (assert (and k @store))
  (idb-keyval/set k value @store))

(defn- graph-encrypted-aes-key-idb-key
  [repo]
  (assert (some? repo))
  (str "rtc-encrypted-aes-key###" repo))

(defn- <import-public-key-transit-str
  "Return js/CryptoKey"
  [public-key-transit-str]
  (when-let [exported-public-key (ldb/read-transit-str public-key-transit-str)]
    (crypt/<import-public-key exported-public-key)))

(defn task--upload-user-rsa-key-pair
  "Uploads the user's RSA key pair to the server."
  [get-ws-create-task user-uuid public-key encrypted-private-key & {:keys [reset-private-key]
                                                                    :or {reset-private-key false}}]
  (m/sp
    (let [exported-public-key-str (ldb/write-transit-str (c.m/<? (crypt/<export-public-key public-key)))
          encrypted-private-key-str (ldb/write-transit-str encrypted-private-key)
          response (m/? (ws-util/send&recv get-ws-create-task
                                           {:action "upload-user-rsa-key-pair"
                                            :user-uuid user-uuid
                                            :public-key exported-public-key-str
                                            :encrypted-private-key encrypted-private-key-str
                                            :reset-private-key reset-private-key}))]
      (when (:ex-data response)
        (throw (ex-info (:ex-message response) (:ex-data response)))))))

(defn task--reset-user-rsa-key-pair
  "Reset rsa-key-pair in server."
  [get-ws-create-task user-uuid public-key encrypted-private-key]
  (assert (and public-key encrypted-private-key))
  (m/sp
    (let [exported-public-key-str (ldb/write-transit-str (c.m/<? (crypt/<export-public-key public-key)))
          encrypted-private-key-str (ldb/write-transit-str encrypted-private-key)
          resp (m/? (ws-util/send&recv get-ws-create-task
                                       {:action "reset-user-rsa-key-pair"
                                        :user-uuid user-uuid
                                        :public-key exported-public-key-str
                                        :encrypted-private-key encrypted-private-key-str}))]
      (when (:ex-data resp)
        (throw (ex-info (:ex-message resp) (:ex-data resp)))))))

(defn task--fetch-user-rsa-key-pair
  "Fetches the user's RSA key pair from server.
  Return {:public-key CryptoKey, :encrypted-private-key [array,array,array]}
  Return nil if not exists"
  [get-ws-create-task user-uuid]
  (m/sp
    (let [response (m/? (ws-util/send&recv get-ws-create-task
                                           {:action "fetch-user-rsa-key-pair"
                                            :user-uuid user-uuid}))]
      (if (:ex-data response)
        (throw (ex-info (:ex-message response)
                        (assoc (:ex-data response)
                               :type :rtc.exception/fetch-user-rsa-key-pair-error)))
        (let [{:keys [public-key encrypted-private-key]} response]
          (when (and public-key encrypted-private-key)
            {:public-key (c.m/<? (<import-public-key-transit-str public-key))
             :encrypted-private-key (ldb/read-transit-str encrypted-private-key)}))))))

(defn- task--remote-fetch-graph-encrypted-aes-key
  "Return nil if not exists."
  [get-ws-create-task graph-uuid]
  (m/sp
    (let [response (m/? (ws-util/send&recv get-ws-create-task
                                           {:action "fetch-graph-encrypted-aes-key"
                                            :graph-uuid graph-uuid}))]
      (if (:ex-data response)
        (throw (ex-info (:ex-message response) (assoc (:ex-data response)
                                                      :type :rtc.exception/fetch-graph-aes-key-error)))
        (ldb/read-transit-str (:encrypted-aes-key response))))))

(defn task--fetch-graph-aes-key
  "Fetches the AES key for a graph, from indexeddb or server.
  Return nil if not exists"
  [get-ws-create-task graph-uuid private-key]
  (m/sp
    (let [encrypted-aes-key (c.m/<? (<get-item (graph-encrypted-aes-key-idb-key graph-uuid)))]
      (if encrypted-aes-key
        (c.m/<? (crypt/<decrypt-aes-key private-key encrypted-aes-key))
        (when-let [encrypted-aes-key (m/? (task--remote-fetch-graph-encrypted-aes-key get-ws-create-task graph-uuid))]
          (let [aes-key (c.m/<? (crypt/<decrypt-aes-key private-key encrypted-aes-key))]
            (c.m/<? (<set-item! (graph-encrypted-aes-key-idb-key graph-uuid) encrypted-aes-key))
            aes-key))))))

(defn task--persist-graph-encrypted-aes-key
  [graph-uuid encrypted-aes-key]
  (m/sp
    (c.m/<? (<set-item! (graph-encrypted-aes-key-idb-key graph-uuid) encrypted-aes-key))))

(defn task--generate-graph-aes-key
  []
  (m/sp (c.m/<? (crypt/<generate-aes-key))))

(defn task--get-decrypted-rsa-key-pair
  [get-ws-create-task user-uuid]
  (m/sp
    (let [{:keys [public-key encrypted-private-key]}
          (m/? (task--fetch-user-rsa-key-pair get-ws-create-task user-uuid))
          exported-private-key (c.m/<? (worker-state/<invoke-main-thread
                                        :thread-api/decrypt-user-e2ee-private-key encrypted-private-key))
          private-key (c.m/<? (crypt/<import-private-key exported-private-key))]
      {:public-key public-key
       :private-key private-key})))

(defn task--get-aes-key
  "Return nil if not exists"
  [get-ws-create-task user-uuid graph-uuid]
  (m/sp
    (let [{:keys [_public-key private-key]} (m/? (task--get-decrypted-rsa-key-pair get-ws-create-task user-uuid))]
      (m/? (task--fetch-graph-aes-key get-ws-create-task graph-uuid private-key)))))

(defn task--reset-user-rsa-private-key
  "Throw if decrypt encrypted-private-key failed."
  [get-ws-create-task refresh-token user-uuid old-password new-password]
  (m/sp
    (let [{:keys [public-key encrypted-private-key]}
          (m/? (task--fetch-user-rsa-key-pair get-ws-create-task user-uuid))
          private-key (c.m/<? (crypt/<decrypt-private-key old-password encrypted-private-key))
          new-encrypted-private-key (c.m/<? (crypt/<encrypt-private-key new-password private-key))]
      (m/? (task--upload-user-rsa-key-pair get-ws-create-task user-uuid public-key new-encrypted-private-key
                                           :reset-private-key true))
      (c.m/<? (<save-e2ee-password refresh-token new-password)))))

(defn- task--fetch-user-rsa-public-key
  "Fetches the user's RSA public-key from server.
  Return js/CryptoKey.
  Return nil if not exists"
  [get-ws-create-task user-email]
  (m/sp
    (let [{:keys [public-key] :as response}
          (m/? (ws-util/send&recv get-ws-create-task
                                  {:action "fetch-user-rsa-public-key"
                                   :user/email user-email}))]
      (if (:ex-data response)
        (throw (ex-info (:ex-message response)
                        (assoc (:ex-data response)
                               :type :rtc.exception/fetch-user-rsa-public-key-error)))
        (when public-key
          (c.m/<? (<import-public-key-transit-str public-key)))))))

(defn task--encrypt-graph-aes-key-by-other-user-public-key
  "Return encrypted-aes-key,
  which is decrypted by current user's private-key, then other-user's public-key"
  [get-ws-create-task graph-uuid user-uuid other-user-email]
  (m/sp
    (when-let [graph-aes-key (m/? (task--get-aes-key get-ws-create-task user-uuid graph-uuid))]
      (when-let [public-key (m/? (task--fetch-user-rsa-public-key get-ws-create-task other-user-email))]
        (c.m/<? (crypt/<encrypt-aes-key public-key graph-aes-key))))))

(def-thread-api :thread-api/get-user-rsa-key-pair
  [token user-uuid]
  (m/sp
    (let [{:keys [get-ws-create-task]} (ws-util/gen-get-ws-create-map--memoized (ws-util/get-ws-url token))
          {:keys [public-key encrypted-private-key]}
          (m/? (task--fetch-user-rsa-key-pair get-ws-create-task user-uuid))]
      (when (and public-key encrypted-private-key)
        {:public-key (c.m/<? (crypt/<export-public-key public-key))
         :encrypted-private-key encrypted-private-key}))))

(def-thread-api :thread-api/init-user-rsa-key-pair
  [token refresh-token user-uuid]
  (m/sp
    (try
      (let [{:keys [get-ws-create-task]} (ws-util/gen-get-ws-create-map--memoized (ws-util/get-ws-url token))]
        (when-not (m/? (task--fetch-user-rsa-key-pair get-ws-create-task user-uuid))
          (let [{:keys [publicKey privateKey]} (c.m/<? (crypt/<generate-rsa-key-pair))
                {:keys [password]} (c.m/<? (worker-state/<invoke-main-thread :thread-api/request-e2ee-password))
                encrypted-private-key (c.m/<? (crypt/<encrypt-private-key password privateKey))]
            (m/? (task--upload-user-rsa-key-pair get-ws-create-task user-uuid publicKey encrypted-private-key))
            (c.m/<? (<save-e2ee-password refresh-token password))
            nil)))
      (catch Cancelled _)
      (catch :default e e))))

(def-thread-api :thread-api/reset-user-rsa-key-pair
  [token refresh-token user-uuid new-password]
  (m/sp
    (try
      (let [{:keys [get-ws-create-task]} (ws-util/gen-get-ws-create-map--memoized (ws-util/get-ws-url token))]
        (when (some? (m/? (task--fetch-user-rsa-key-pair get-ws-create-task user-uuid)))
          (let [{:keys [publicKey privateKey]} (c.m/<? (crypt/<generate-rsa-key-pair))
                encrypted-private-key (c.m/<? (crypt/<encrypt-private-key new-password privateKey))]
            (m/? (task--reset-user-rsa-key-pair get-ws-create-task user-uuid publicKey encrypted-private-key))
            (c.m/<? (<save-e2ee-password refresh-token new-password))
            nil)))
      (catch Cancelled _)
      (catch :default e e))))

(def-thread-api :thread-api/reset-e2ee-password
  [token refresh-token user-uuid old-password new-password]
  (m/sp
    (let [{:keys [get-ws-create-task]} (ws-util/gen-get-ws-create-map--memoized (ws-util/get-ws-url token))]
      (m/? (task--reset-user-rsa-private-key get-ws-create-task refresh-token user-uuid old-password new-password)))))

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
