(ns frontend.worker.rtc.crypt
  "rtc e2ee related.
  Each user has an RSA key pair.
  Each graph has an AES key.
  Server stores the encrypted AES key, public key, and encrypted private key."
  (:require ["/frontend/idbkv" :as idb-keyval]
            [frontend.common.crypt :as crypt]
            [frontend.common.missionary :as c.m]
            [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker.rtc.ws-util :as ws-util]
            [frontend.worker.state :as worker-state]
            [logseq.db :as ldb]
            [missionary.core :as m]
            [promesa.core :as p])
  (:import [missionary Cancelled]))

(defonce ^:private store (delay (idb-keyval/newStore "localforage" "keyvaluepairs" 2)))

(defn- <get-item
  [k]
  (assert (and k @store))
  (p/let [r (idb-keyval/get k @store)]
    (js->clj r :keywordize-keys true)))

(defn- <set-item!
  [k value]
  (assert (and k @store))
  (idb-keyval/set k value @store))

(comment
  (defn- <remove-item!
    [k]
    (idb-keyval/del k @store)))

(defn- graph-encrypted-aes-key-idb-key
  [repo]
  (assert (some? repo))
  (str "rtc-encrypted-aes-key###" repo))

(comment
  (defn- user-rsa-key-pair-idb-key
    [user-uuid]
    (assert (some? user-uuid))
    (str "user-rsa-key-pair###" user-uuid)))

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
        (throw (ex-info (:ex-message response)
                        (assoc (:ex-data response) :type :rtc.exception/upload-user-rsa-key-pair-error)))))))

(defn task--fetch-user-rsa-key-pair
  "Fetches the user's RSA key pair from server.
  Return {:public-key CryptoKey, :encrypted-private-key [array,array,array]}
  Return nil if not exists"
  [get-ws-create-task user-uuid]
  (letfn [(task--import-public-key [public-key-transit-str]
            (m/sp
              (when-let [exported-public-key (ldb/read-transit-str public-key-transit-str)]
                (c.m/<? (crypt/<import-public-key exported-public-key)))))]
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
              {:public-key (m/? (task--import-public-key public-key))
               :encrypted-private-key (ldb/read-transit-str encrypted-private-key)})))))))

(defn task--fetch-graph-aes-key
  "Fetches the AES key for a graph, from indexeddb or server.
  Return nil if not exists"
  [get-ws-create-task graph-uuid private-key]
  (m/sp
    (let [encrypted-aes-key (c.m/<? (<get-item (graph-encrypted-aes-key-idb-key graph-uuid)))]
      (if encrypted-aes-key
        (c.m/<? (crypt/<decrypt-aes-key private-key encrypted-aes-key))
        (let [response (m/? (ws-util/send&recv get-ws-create-task
                                               {:action "fetch-graph-encrypted-aes-key"
                                                :graph-uuid graph-uuid}))]
          (if (:ex-data response)
            (throw (ex-info (:ex-message response) (assoc (:ex-data response)
                                                          :type :rtc.exception/fetch-graph-aes-key-error)))
            (let [{:keys [encrypted-aes-key]} response]
              (when-let [encrypted-aes-key* (ldb/read-transit-str encrypted-aes-key)]
                (let [aes-key (c.m/<? (crypt/<decrypt-aes-key private-key encrypted-aes-key*))]
                  (c.m/<? (<set-item! (graph-encrypted-aes-key-idb-key graph-uuid) encrypted-aes-key*))
                  aes-key)))))))))

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
  [get-ws-create-task user-uuid graph-uuid]
  (m/sp
    (let [{:keys [_public-key private-key]} (m/? (task--get-decrypted-rsa-key-pair get-ws-create-task user-uuid))]
      (m/? (task--fetch-graph-aes-key get-ws-create-task graph-uuid private-key)))))

(defn task--reset-user-rsa-private-key
  "Throw if decrypt encrypted-private-key failed."
  [get-ws-create-task user-uuid old-password new-password]
  (m/sp
    (let [{:keys [public-key encrypted-private-key]}
          (m/? (task--fetch-user-rsa-key-pair get-ws-create-task user-uuid))
          private-key (c.m/<? (crypt/<decrypt-private-key old-password encrypted-private-key))
          new-encrypted-private-key (c.m/<? (crypt/<encrypt-private-key new-password private-key))]
      (m/? (task--upload-user-rsa-key-pair get-ws-create-task user-uuid public-key new-encrypted-private-key
                                           :reset-private-key true)))))

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
  [token user-uuid]
  (m/sp
    (try
      (let [{:keys [get-ws-create-task]} (ws-util/gen-get-ws-create-map--memoized (ws-util/get-ws-url token))]
        (when-not (m/? (task--fetch-user-rsa-key-pair get-ws-create-task user-uuid))
          (let [{:keys [publicKey privateKey]} (c.m/<? (crypt/<generate-rsa-key-pair))
                {:keys [password]} (c.m/<? (worker-state/<invoke-main-thread :thread-api/request-e2ee-password))
                encrypted-private-key (c.m/<? (crypt/<encrypt-private-key password privateKey))]
            (m/? (task--upload-user-rsa-key-pair get-ws-create-task user-uuid publicKey encrypted-private-key))
            nil)))
      (catch Cancelled _)
      (catch :default e e))))

(def-thread-api :thread-api/reset-e2ee-password
  [token user-uuid old-password new-password]
  (m/sp
    (let [{:keys [get-ws-create-task]} (ws-util/gen-get-ws-create-map--memoized (ws-util/get-ws-url token))]
      (m/? (task--reset-user-rsa-private-key get-ws-create-task user-uuid old-password new-password)))))
