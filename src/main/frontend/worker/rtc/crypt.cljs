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

(defn- <remove-item!
  [k]
  (idb-keyval/del k @store))

(defn- graph-encrypted-aes-key-idb-key
  [repo]
  (assert (some? repo))
  (str "rtc-encrypted-aes-key###" repo))

(defn- user-rsa-key-pair-idb-key
  [user-uuid]
  (assert (some? user-uuid))
  (str "user-rsa-key-pair###" user-uuid))

(defn task--upload-user-rsa-key-pair
  "Uploads the user's RSA key pair to the server."
  [get-ws-create-task user-uuid public-key encrypted-private-key]
  (m/sp
    (let [exported-public-key-str (ldb/write-transit-str (c.m/<? (crypt/<export-public-key public-key)))
          encrypted-private-key-str (ldb/write-transit-str encrypted-private-key)
          response (m/? (ws-util/send&recv get-ws-create-task
                                           {:action "upload-user-rsa-key-pair"
                                            :user-uuid user-uuid
                                            :public-key exported-public-key-str
                                            :encrypted-private-key encrypted-private-key-str}))]
      (when (:ex-data response)
        (throw (ex-info (:ex-message response)
                        (assoc (:ex-data response) :type :rtc.exception/upload-user-rsa-key-pair-error)))))))

(defn task--fetch-user-rsa-key-pair
  "Fetches the user's RSA key pair, from indexeddb or server.
  Return nil if not exists"
  [get-ws-create-task user-uuid]
  (letfn [(select-keys-fn [m] (select-keys m [:public-key :encrypted-private-key]))]
    (m/sp
      (let [key-pair (c.m/<? (<get-item (user-rsa-key-pair-idb-key user-uuid)))]
        (if key-pair
          (select-keys-fn key-pair)
          (let [response (m/? (ws-util/send&recv get-ws-create-task
                                                 {:action "fetch-user-rsa-key-pair"
                                                  :user-uuid user-uuid}))]
            (if (:ex-data response)
              (throw (ex-info (:ex-message response)
                              (assoc (:ex-data response)
                                     :type :rtc.exception/fetch-user-rsa-key-pair-error)))
              (let [{:keys [public-key encrypted-private-key] :as key-pair} (select-keys-fn response)]
                (when (and public-key encrypted-private-key)
                  (c.m/<? (<set-item! (user-rsa-key-pair-idb-key user-uuid)
                                      (clj->js key-pair)))
                  key-pair)))))))))

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
              (when encrypted-aes-key
                (let [aes-key (c.m/<? (crypt/<decrypt-aes-key private-key encrypted-aes-key))]
                  (c.m/<? (<set-item! (graph-encrypted-aes-key-idb-key graph-uuid) encrypted-aes-key))
                  aes-key)))))))))

(defn task--persist-graph-encrypted-aes-key
  [graph-uuid encrypted-aes-key]
  (m/sp
    (c.m/<? (<set-item! (graph-encrypted-aes-key-idb-key graph-uuid) encrypted-aes-key))))

(defn task--generate-graph-aes-key
  []
  (m/sp (c.m/<? (crypt/<generate-aes-key))))

(defn task--get-rsa-key-pair
  [get-ws-create-task user-uuid]
  (m/sp
    (let [{:keys [password]} (c.m/<? (worker-state/<invoke-main-thread :thread-api/request-e2ee-password))
          {:keys [public-key encrypted-private-key]}
          (m/? (task--fetch-user-rsa-key-pair get-ws-create-task user-uuid))
          private-key (c.m/<? (crypt/<decrypt-private-key password encrypted-private-key))]
      {:public-key public-key
       :private-key private-key})))

(defn task--get-aes-key
  [get-ws-create-task user-uuid graph-uuid]
  (m/sp
    (let [{:keys [_public-key private-key]} (m/? (task--get-rsa-key-pair get-ws-create-task user-uuid))]
      (m/? (task--fetch-graph-aes-key get-ws-create-task graph-uuid private-key)))))

(def-thread-api :thread-api/get-user-rsa-key-pair-from-indexeddb
  [user-uuid]
  (<get-item (user-rsa-key-pair-idb-key user-uuid)))

(def-thread-api :thread-api/init-user-rsa-key-pair
  [token user-uuid]
  (m/sp
    (try
      (let [{:keys [get-ws-create-task]} (ws-util/gen-get-ws-create-map--memoized (ws-util/get-ws-url token))]
        (when-not (m/? (task--fetch-user-rsa-key-pair get-ws-create-task user-uuid))
          (let [{:keys [publicKey privateKey]} (c.m/<? (crypt/<generate-rsa-key-pair))
                password (c.m/<? (worker-state/<invoke-main-thread :thread-api/request-e2ee-password))
                encrypted-private-key (c.m/<? (crypt/<encrypt-private-key password privateKey))]
            (m/? (task--upload-user-rsa-key-pair get-ws-create-task user-uuid publicKey encrypted-private-key))
            ;; fetch again
            (m/? (task--fetch-user-rsa-key-pair get-ws-create-task user-uuid)))))
      (catch Cancelled _)
      (catch :default e e))))

(comment
  (do
    (defn- array-buffers-equal?
      [buf1 buf2]
      (if (not= (.-byteLength buf1) (.-byteLength buf2))
        false
        (let [arr1 (js/Uint8Array. buf1)
              arr2 (js/Uint8Array. buf2)]
          (= (vec arr1) (vec arr2)))))

    (def user-uuid "test-user-uuid")
    (def graph-uuid "test-graph-uuid")
    (def password "test-password")
    (def token "test-token")

    ;; Prepare keys
    (def prepare-keys-task
      (m/sp
        (let [rsa-key-pair          (c.m/<? (crypt/<generate-rsa-key-pair))
              public-key            (:publicKey rsa-key-pair)
              private-key           (:privateKey rsa-key-pair)
              encrypted-private-key (c.m/<? (crypt/<encrypt-private-key password private-key))
              aes-key               (c.m/<? (crypt/<generate-aes-key))
              encrypted-aes-key     (c.m/<? (crypt/<encrypt-aes-key public-key aes-key))]
          {:public-key            public-key
           :private-key           private-key
           :encrypted-private-key encrypted-private-key
           :aes-key               aes-key
           :encrypted-aes-key     encrypted-aes-key})))

    ;; Run test
    (def cancel
      (c.m/run-task*
       (m/sp
         (prn "--- Start testing crypt.cljs ---")
         (let [{:keys [public-key private-key encrypted-private-key aes-key encrypted-aes-key] :as xxx}
               (m/? prepare-keys-task)]
           (def xxx xxx)
           (prn "1. Test fetch from local storage")
           (prn "   Clean local storage first")
           (c.m/<? (<remove-item! (user-rsa-key-pair-idb-key user-uuid)))
           (c.m/<? (<remove-item! (graph-encrypted-aes-key-idb-key graph-uuid)))

           (prn "   Set items to local storage")
           (c.m/<? (<set-item! (user-rsa-key-pair-idb-key user-uuid)
                               (clj->js
                                {:public-key            public-key
                                 :encrypted-private-key encrypted-private-key})))
           (c.m/<? (<set-item! (graph-encrypted-aes-key-idb-key graph-uuid) encrypted-aes-key))

           (prn "   Fetch user rsa key pair from local storage")
           (let [fetched-key-pair (m/? (task--fetch-user-rsa-key-pair token user-uuid password))
                 exported-public-key (c.m/<? (.exportKey crypt/subtle "spki" public-key))
                 exported-fetched-public-key (c.m/<? (.exportKey crypt/subtle "spki" (:public-key fetched-key-pair)))]
             (assert (array-buffers-equal? exported-public-key exported-fetched-public-key))
             (prn "   Fetched user rsa key pair successfully"))

           (prn "   Fetch graph aes key from local storage")
           (let [fetched-aes-key (m/? (task--fetch-graph-aes-key token graph-uuid private-key))
                 exported-aes-key (c.m/<? (.exportKey crypt/subtle "raw" aes-key))
                 exported-fetched-aes-key (c.m/<? (.exportKey crypt/subtle "raw" fetched-aes-key))]
             (assert (array-buffers-equal? exported-aes-key exported-fetched-aes-key))
             (prn "   Fetched graph aes key successfully"))

           (prn "--- Test finished ---")))))))
