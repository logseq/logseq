(ns logseq.db-sync.e2ee-semantic-test
  (:require [cljs.test :refer [async deftest is]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.test-sql :as test-sql]
            [logseq.db-sync.worker.handler.e2ee :as e2ee]
            [logseq.db-sync.worker.handler.sync :as sync]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.outliner.page :as outliner-page]
            [promesa.core :as p]))

(defn- request [path method body]
  (js/Request. (str "http://localhost" path "?graph-id=graph-1&graph-e2ee=true")
               (clj->js {:method method
                         :headers {"content-type" "application/json"}
                         :body (js/JSON.stringify (clj->js body))})))

(defn- <encrypt [key value]
  (p/let [iv (js/crypto.getRandomValues (js/Uint8Array. 12))
          payload (.encrypt js/crypto.subtle #js {:name "AES-GCM" :iv iv} key
                            (.encode (js/TextEncoder.) (ldb/write-transit-str value)))]
    (ldb/write-transit-str [iv (js/Uint8Array. payload)])))

(defn- <decrypt [key package]
  (let [[iv payload] (ldb/read-transit-str package)]
    (p/let [plain (.decrypt js/crypto.subtle #js {:name "AES-GCM" :iv iv} key payload)]
      (ldb/read-transit-str (.decode (js/TextDecoder.) plain)))))

(defn- <key []
  (.generateKey js/crypto.subtle #js {:name "AES-GCM" :length 256} true #js ["encrypt" "decrypt"]))

(defn- self [conn & [bucket]]
  #js {:conn conn :sql (test-sql/make-sql) :schema-ready true
       :env #js {"LOGSEQ_SYNC_ASSETS" bucket}})

(deftest encrypted-page-tag-and-property-names-round-trip-test
  (async done
         (-> (p/let [key (<key)
                     title (<encrypt key "Secret 名称")
                     name (<encrypt key "secret 名称")
                     renamed-title (<encrypt key "Renamed 名称")
                     renamed-name (<encrypt key "renamed 名称")]
               (p/loop [routes [["pages" "page"] ["tags" "tag"] ["properties" "property"]]]
                 (when-let [[route kind] (first routes)]
                   (let [conn (sqlite-export/create-conn)
                         ctx (self conn)]
                     (p/let [response (sync/handle-http ctx (request (str "/semantic/" route) "POST"
                                                                     {:title title :name name :type "number"}))
                             body (.json response)
                             entity (d/entity @conn [:block/uuid (uuid (aget body "uuid"))])
                             decrypted-title (<decrypt key (:block/title entity))
                             decrypted-name (<decrypt key (:block/name entity))]
                       (is (= 201 (.-status response)) kind)
                       (is (= "Secret 名称" decrypted-title) kind)
                       (is (= "secret 名称" decrypted-name) kind)
                       (p/let [updated (sync/handle-http ctx
                                                         (request (str "/semantic/" route "/" (aget body "uuid"))
                                                                  "PATCH" {:title renamed-title :name renamed-name}))
                               entity (d/entity @conn [:block/uuid (uuid (aget body "uuid"))])
                               decrypted-title (<decrypt key (:block/title entity))
                               decrypted-name (<decrypt key (:block/name entity))]
                         (is (= 200 (.-status updated)) kind)
                         (is (= "Renamed 名称" decrypted-title) kind)
                         (is (= "renamed 名称" decrypted-name) kind))
                       (p/recur (next routes)))))))
             (p/catch #(is false (str %)))
             (p/finally done))))

(deftest encrypted-page-writes-require-name-and-reject-invalid-packages-test
  (async done
         (-> (p/let [key (<key)
                     title (<encrypt key "Secret")
                     name (<encrypt key "secret")
                     conn (sqlite-export/create-conn)
                     ctx (self conn)
                     before @conn
                     invalid-bodies [{:title title}
                                     {:title title :name "plaintext"}
                                     {:title (ldb/write-transit-str {:logseq.e2ee/keys {}}) :name name}
                                     {:title (ldb/write-transit-str [(js/Uint8Array. 11) (js/Uint8Array. 16)]) :name name}
                                     {:title (ldb/write-transit-str [(js/Uint8Array. 12) (js/Uint8Array. 15)]) :name name}]]
               (p/loop [bodies invalid-bodies]
                 (when-let [body (first bodies)]
                   (p/let [response (sync/handle-http ctx (request "/semantic/pages" "POST" body))]
                     (is (= 400 (.-status response)))
                     (is (true? (= before @conn)) "rejected writes do not mutate the graph")
                     (p/recur (next bodies))))))
             (p/catch #(is false (str %)))
             (p/finally done))))

(deftest encrypted-block-route-can-rename-page-test
  (async done
         (-> (p/let [key (<key)
                     conn (sqlite-export/create-conn)
                     [_ id] (outliner-page/create! conn "Disposable" {})
                     title (<encrypt key "Renamed")
                     name (<encrypt key "renamed")
                     response (sync/handle-http (self conn)
                                                (request (str "/semantic/blocks/" id) "PATCH"
                                                         {:title title :name name}))
                     entity (d/entity @conn [:block/uuid id])
                     decrypted-title (<decrypt key (:block/title entity))
                     decrypted-name (<decrypt key (:block/name entity))]
               (is (= 200 (.-status response)))
               (is (= "Renamed" decrypted-title))
               (is (= "renamed" decrypted-name)))
             (p/catch #(is false (str %)))
             (p/finally done))))

(deftest encrypt-helper-requires-a-256-bit-graph-key-test
  (async done
         (-> (p/let [pair (.generateKey js/crypto.subtle
                                        #js {:name "RSA-OAEP" :modulusLength 2048
                                             :publicExponent (js/Uint8Array. #js [1 0 1]) :hash "SHA-256"}
                                        true #js ["encrypt" "decrypt"])
                     public (.exportKey js/crypto.subtle "spki" (.-publicKey pair))]
               (p/with-redefs [index/<graph-member-public-keys
                              (fn [_ _] (p/resolved [{:user-id "user-1"
                                                     :public-key (ldb/write-transit-str (js/Uint8Array. public))}]))]
                 (p/loop [keys [nil (js/btoa (apply str (repeat 16 "a")))
                                (js/btoa (apply str (repeat 24 "a"))) "bad base64"]]
                   (when (seq keys)
                     (p/let [response (e2ee/handle
                                       {:request (request "/api/v1/graphs/graph-1/e2ee/encrypt" "POST"
                                                          (cond-> {:texts ["Secret"]} (first keys) (assoc :key (first keys))))
                                        :env #js {"DB" #js {}}
                                        :graph-id "graph-1" :handler :semantic/e2ee-encrypt})]
                       (is (= 400 (.-status response)))
                       (p/recur (next keys)))))))
             (p/catch #(is false (str %)))
             (p/finally done))))

(defn- <asset-upload [ctx page-id title payload size checksum encoding]
  (let [params (js/URLSearchParams.
                (clj->js (cond-> {:graph-id "graph-1" :graph-e2ee "true"
                                 :file-name "secret.txt" :title title :page-id (str page-id)
                                 :size (str size) :checksum checksum}
                           encoding (assoc :encoding encoding))))
        body (if (string? payload) (.encode (js/TextEncoder.) payload) payload)
        chunks (js/ReadableStream.
                #js {:start (fn [controller]
                              (dotimes [offset (.-length body)]
                                (.enqueue controller (.slice body offset (inc offset))))
                              (.close controller))})]
    (sync/handle-http ctx (js/Request. (str "http://localhost/semantic/assets?" params)
                                       #js {:method "POST" :duplex "half"
                                            :headers #js {"content-type" "application/octet-stream"}
                                            :body chunks}))))

(deftest encrypted-assets-reject-plaintext-and-stream-canonical-packages-test
  (async done
         (let [original-fixed-stream (.-FixedLengthStream js/globalThis)
               fixed-stream (fn [size]
                              (let [received (atom 0)
                                    stream (js/TransformStream.
                                            #js {:transform
                                                 (fn [chunk controller]
                                                   (swap! received + (.-byteLength chunk))
                                                   (when (> @received size)
                                                     (throw (js/RangeError. "fixed-length overflow")))
                                                   (.enqueue controller chunk))
                                                 :flush
                                                 (fn [_]
                                                   (when-not (= size @received)
                                                     (throw (js/RangeError. "fixed-length underflow"))))})]
                                #js {:readable (.-readable stream) :writable (.-writable stream)}))
               stored (atom {})
               bucket #js {:put (fn [key payload _]
                                  (p/let [buf (.arrayBuffer (js/Response. payload))]
                                    (swap! stored assoc key buf)
                                    #js {}))
                           :delete (fn [key] (swap! stored dissoc key) (p/resolved nil))}]
           (aset js/globalThis "FixedLengthStream" fixed-stream)
           (-> (p/let [key (<key)
                       title (<encrypt key "Secret asset")
                       conn (sqlite-export/create-conn)
                       [_ page-id] (outliner-page/create! conn "Disposable" {})
                       ctx (self conn bucket)
                       before @conn
                       rejected (<asset-upload ctx page-id title "private data" 12 (apply str (repeat 64 "a")) nil)]
                 (is (= 400 (.-status rejected)))
                 (is (empty? @stored))
                 (is (true? (= before @conn)))
                 (p/let [iv (js/crypto.getRandomValues (js/Uint8Array. 12))
                         plaintext (.encode (js/TextEncoder.) "private data")
                         ciphertext (.encrypt js/crypto.subtle #js {:name "AES-GCM" :iv iv} key plaintext)
                         package (ldb/write-transit-str [iv (js/Uint8Array. ciphertext)])
                         response (<asset-upload ctx page-id title package 12 (apply str (repeat 64 "b")) nil)
                         body (.json response)
                         entity (d/entity @conn [:block/uuid (uuid (aget body "uuid"))])
                         uploaded (get @stored (str "graph-1/" (aget body "uuid") ".txt"))
                         [uploaded-iv uploaded-data] (ldb/read-transit-str (.decode (js/TextDecoder.) uploaded))
                         decrypted (.decrypt js/crypto.subtle #js {:name "AES-GCM" :iv uploaded-iv} key uploaded-data)]
                   (is (= 201 (.-status response)))
                   (is (= 12 (:logseq.property.asset/size entity)))
                   (is (= "private data" (.decode (js/TextDecoder.) decrypted)))
                   (p/let [encoded (js/btoa package)
                           response (<asset-upload ctx page-id title encoded 12 (apply str (repeat 64 "c")) "base64")]
                     (is (= 201 (.-status response))))
                   (p/let [count-before (count @stored)
                           invalid (<asset-upload ctx page-id title (str package "junk") 12
                                                  (apply str (repeat 64 "d")) nil)
                           truncated-utf8 (.encode (js/TextEncoder.) package)
                           malformed (js/Uint8Array. (inc (.-length truncated-utf8)))
                           _ (.set malformed truncated-utf8)
                           _ (aset malformed (.-length truncated-utf8) 195)
                           invalid-utf8 (<asset-upload ctx page-id title malformed 12
                                                       (apply str (repeat 64 "f")) nil)
                           too-small (<asset-upload ctx page-id title package 0
                                                    (apply str (repeat 64 "1")) nil)
                           wrong-size (<asset-upload ctx page-id title package 13
                                                     (apply str (repeat 64 "e")) nil)]
                     (is (= 400 (.-status invalid)))
                     (is (= 400 (.-status wrong-size)))
                     (is (= 400 (.-status invalid-utf8)))
                     (is (= 400 (.-status too-small)))
                     (is (= count-before (count @stored))))))
               (p/catch #(is false (str %)))
               (p/finally (fn []
                            (aset js/globalThis "FixedLengthStream" original-fixed-stream)
                            (done)))))))
