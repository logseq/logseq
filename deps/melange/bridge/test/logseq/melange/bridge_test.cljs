(ns logseq.melange.bridge-test
  (:require ["@logseq/melange-js-api/browser" :as browser-api]
            ["@logseq/melange-js-api/db" :as db-api]
            ["@logseq/melange-js-api/node" :as node-api]
            [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [datascript.core :as d]
            [flatland.ordered.map :refer [ordered-map]]
            [logseq.melange.bridge.common.authorization :as authorization]
            [logseq.melange.bridge.common.util :as common-util]
            [logseq.melange.bridge.db.asset :as asset]
            [logseq.melange.bridge.db.core :as db-core]
            [logseq.melange.bridge.db.db-ident :as db-ident]
            [logseq.melange.bridge.db.delete-blocks :as delete-blocks]
            [logseq.melange.bridge.db.initial-data :as initial-data]
            [logseq.melange.bridge.db.schema :as db-schema]
            [logseq.melange.bridge.db.sqlite.build :as sqlite-build]
            [logseq.melange.bridge.db.sqlite.export :as sqlite-export]
            [logseq.melange.bridge.platform.browser :as platform-browser]
            [logseq.melange.bridge.platform.datascript :as platform-datascript]
            [logseq.melange.bridge.platform.node :as platform-node]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private missing (js/Symbol "missing-melange-bridge-method"))

(def ^:private bridge-methods
  ["keywordToString"
   "keywordFromString"
   "symbolFromString"
   "nilValue"
   "stringToValue"
   "stringFromValue"
   "stringLowercase"
   "boolToValue"
   "boolFromValue"
   "intToValue"
   "intFromValue"
   "floatToValue"
   "floatFromValue"
   "valueEquals"
   "valueTruthy"
   "valueToString"
   "valueIsNil"
   "valueIsString"
   "valueIsBool"
   "valueIsNumber"
   "valueIsInteger"
   "valueIsKeyword"
   "valueIsUuid"
   "valueIsInstant"
   "instantToMs"
   "valueIsVector"
   "valueIsSet"
   "valueIsMap"
   "valueIsSequential"
   "uuidToString"
   "uuidFromString"
   "collectionToArray"
   "arrayToList"
   "vectorToArray"
   "arrayToVector"
   "setToArray"
   "arrayToSet"
   "mapToEntries"
   "entriesToMap"
   "mapGet"
   "mapAssoc"
   "mapDissoc"
   "mapContains"
   "valueMeta"
   "valueWithMeta"
   "orderedMapToEntries"
   "entriesToOrderedMap"
   "invokeCallback"
   "logValues"
   "rejectPromise"
   "datascriptCreateConn"
   "datascriptCreateConnWithStorage"
   "datascriptRestoreConn"
   "datascriptDatabase"
   "datascriptDatabaseSchema"
   "datascriptEntity"
   "datascriptEntityGet"
   "datascriptEntityIs"
   "datascriptDatoms"
   "datascriptRseekDatoms"
   "datascriptQuery"
   "datascriptPull"
   "datascriptPullMany"
   "datascriptWith"
   "datascriptTransact"
   "datascriptListen"
   "datascriptUnlisten"
   "datascriptReportDbBefore"
   "datascriptReportDbAfter"
   "datascriptReportDatoms"
   "datascriptReportTxMetadata"
   "datascriptDatomEntity"
   "datascriptDatomAttribute"
   "datascriptDatomValue"
   "datascriptDatomEquals"
   "datascriptStorageFor"
   "datascriptStore"
   "datascriptStoreAfterTransact"
   "datascriptRunCallbacks"
   "datascriptSquuid"])

(defn- bridge
  [module]
  (.-Bridge module))

(defn- invoke
  [module method & args]
  (let [bridge* (bridge module)
        f (aget bridge* method)
        adapter (if (string/starts-with? method "datascript")
                  (platform-datascript/adapter)
                  (runtime/runtime-adapter))]
    (if (nil? f)
      missing
      (.apply f bridge* (to-array (cons adapter args))))))

(defn- missing?
  [value]
  (identical? missing value))

(defn- array->pairs
  [entries]
  (mapv (fn [entry]
          [(aget entry 0) (aget entry 1)])
        (array-seq entries)))

(defn- configure!
  [_module])

(defn- seed-conn
  []
  (let [conn (d/create-conn {:block/uuid {:db/unique :db.unique/identity}})]
    (d/transact! conn [{:block/uuid #uuid "11111111-1111-4111-8111-111111111111"
                        :block/title "Alpha"}])
    conn))

(deftest runtime-validation-primitives
  (let [adapter (runtime/runtime-adapter)
        string-is-url (.-stringIsUrl adapter)
        log-error (.-logError adapter)
        log-values (.-logValues adapter)
        value-is-instant (.-valueIsInstant adapter)
        value-meta (.-valueMeta adapter)
        value-with-meta (.-valueWithMeta adapter)]
    (is (fn? string-is-url))
    (is (fn? log-error))
    (is (fn? log-values))
    (is (fn? value-is-instant))
    (is (fn? value-with-meta))
    (is (= {:source :export}
           (value-meta (with-meta [:block/uuid (random-uuid)]
                         {:source :export}))))
    (is (= {:source :melange}
           (value-meta (value-with-meta [:block/uuid (random-uuid)]
                         {:source :melange}))))
    (when string-is-url
      (is (true? (string-is-url "https://example.com/path")))
      (is (false? (string-is-url "not a url"))))
    (when value-is-instant
      (is (true? (value-is-instant (js/Date. 0))))
      (is (false? (value-is-instant 0))))))

(deftest datascript-transaction-metadata-primitive
  (let [adapter (platform-datascript/adapter)
        report-tx-metadata (.-reportTxMetadata adapter)
        metadata {:source :test}]
    (is (fn? report-tx-metadata))
    (when report-tx-metadata
      (is (= metadata (report-tx-metadata {:tx-meta metadata}))))))

(deftest datascript-datom-projection-primitive
  (let [adapter (platform-datascript/adapter)
        datom-from-value (.-datomFromValue adapter)
        datom {:e 1 :a :block/title :v "Title" :added true}]
    (is (fn? datom-from-value))
    (when datom-from-value
      (is (= datom (datom-from-value datom)))
      (is (nil? (datom-from-value {:not :a-datom}))))))

(deftest db-ident-generated-by-ml-runtime
  (let [create-generated (.-createGenerated (.-DbIdent db-api))]
    (is (fn? create-generated))
    (when create-generated
      (is (= "user.property/Priority"
             (create-generated "user.property" "Priority")))
      (is (keyword? (db-ident/create-db-ident-from-name :user.property
                                                        "Priority"))))))

(deftest asset-checksum-uses-ml-web-crypto
  (async done
    (-> (asset/<get-file-array-buffer-checksum "abc")
        (.then (fn [checksum]
                 (is (= "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
                        checksum))
                 (done)))
        (.catch (fn [error]
                  (is false (.-message error))
                  (done))))))

(def ^:private jwt-text-encoder (js/TextEncoder.))

(defn- bytes->base64url
  [data]
  (let [encoded-bytes (js/Uint8Array. data)
        binary (apply str
                      (map #(js/String.fromCharCode %)
                           (array-seq encoded-bytes)))]
    (-> (js/btoa binary)
        (string/replace "+" "-")
        (string/replace "/" "_")
        (string/replace #"=+$" ""))))

(defn- json->base64url
  [value]
  (bytes->base64url
   (.encode jwt-text-encoder (.stringify js/JSON value))))

(defn- sign-jwt
  [private-key header payload]
  (let [header-part (json->base64url header)
        payload-part (json->base64url payload)
        signing-input (str header-part "." payload-part)]
    (-> (.sign js/crypto.subtle
               "RSASSA-PKCS1-v1_5"
               private-key
               (.encode jwt-text-encoder signing-input))
        (.then (fn [signature]
                 (str signing-input "." (bytes->base64url signature)))))))

(defn- generate-rsa-key-pair
  []
  (.generateKey js/crypto.subtle
                #js {:name "RSASSA-PKCS1-v1_5"
                     :modulusLength 1024
                     :publicExponent (js/Uint8Array. #js [1 0 1])
                     :hash "SHA-256"}
                true
                #js ["sign" "verify"]))

(defn- rejection-message
  [promise]
  (.then (js/Promise.resolve promise)
         (fn [_] nil)
         (fn [error] (.-message error))))

(defn- authorization-env
  [issuer client-id jwks-url]
  #js {"COGNITO_ISSUER" issuer
       "COGNITO_CLIENT_ID" client-id
       "COGNITO_JWKS_URL" jwks-url})

(deftest platform-package-adapters-delegate-once
  (testing "browser platform"
    (is (= "browser" (some-> (platform-browser/browser-platform)
                               .-env
                               .-runtime))))
  (testing "Node graph filesystem"
    (is (= "relative/path" (platform-node/expand-home "relative/path")))
    (is (string? (platform-node/get-default-graphs-dir)))
    (is (string? (platform-node/get-db-graphs-dir)))))

(deftest datascript-platform-unlisten-removes-listener
  (let [conn (d/create-conn {})
        calls (atom 0)]
    (d/listen! conn ::listener (fn [_report] (swap! calls inc)))
    (platform-datascript/unlisten conn ::listener)
    (d/transact! conn [{:db/ident :test/entity}])
    (is (zero? @calls))))

(deftest common-util-preserves-cljs-representations-and-capabilities
  (testing "JSON, lazy distinct values, formatting, and sorting"
    (is (= {:outer {:value 1} :items [false nil]}
           (common-util/json->clj "{\"outer\":{\"value\":1},\"items\":[false,null]}")))
    (let [calls (atom 0)
          values (common-util/distinct-by
                  (fn [value]
                    (swap! calls inc)
                    (mod value 2))
                  (range))]
      (is (= [0 1] (vec (take 2 values))))
      (is (= 2 @calls)))
    (is (= [{:id 1 :value "last"} {:id 2 :value "only"}]
           (vec (common-util/distinct-by-last-wins
                 :id
                 [{:id 1 :value "first"}
                  {:id 1 :value "last"}
                  {:id 2 :value "only"}]))))
    (is (= "value=7" (common-util/format "value=%d" 7)))
    (let [compare-items (common-util/by-sorting
                         [{:get-value :group :asc? true}
                          {:get-value :rank :asc? false}])]
      (is (= [{:group "a" :rank 2}
              {:group "a" :rank 1}
              {:group "b" :rank 1}]
             (vec (sort compare-items
                        [{:group "b" :rank 1}
                         {:group "a" :rank 1}
                         {:group "a" :rank 2}]))))))
  (testing "EDN failures, maps, and block timestamp ownership"
    (is (= {:value false}
           (common-util/safe-read-string "{:value false}")))
    (is (nil? (common-util/safe-read-string {:log-error? false} "[")))
    (is (= {} (common-util/safe-read-map-string "{")))
    (let [existing (common-util/block-with-timestamps {:block/created-at 1})
          missing-block (common-util/block-with-timestamps {})]
      (is (= 1 (:block/created-at existing)))
      (is (number? (:block/updated-at existing)))
      (is (= (:block/created-at missing-block)
             (:block/updated-at missing-block))))))

(deftest authorization-verifies-real-signatures-and-preserves-cache-and-errors
  (async done
         (let [original-fetch (.-fetch js/globalThis)
               original-date-now (.-now js/Date)
               now-ms (atom 1700000000000)
               fetch-calls (atom [])]
           (set! (.-now js/Date) (fn [] @now-ms))
           (-> (js/Promise.all #js [(generate-rsa-key-pair)
                                    (generate-rsa-key-pair)])
               (.then
                (fn [pairs]
                  (let [key-pair (aget pairs 0)
                        wrong-key-pair (aget pairs 1)]
                    (-> (.exportKey js/crypto.subtle "jwk" (.-publicKey key-pair))
                        (.then
                         (fn [jwk]
                           (set! (.-kid jwk) "main-key")
                           (set! (.-fetch js/globalThis)
                                 (fn [url]
                                   (swap! fetch-calls conj url)
                                   (js/Promise.resolve
                                    #js {:ok true
                                         :json (fn []
                                                 (js/Promise.resolve
                                                  #js {:keys #js [jwk]}))})))
                           (let [now-s (js/Math.floor (/ @now-ms 1000))
                                 env (authorization-env "issuer" "client" "https://jwks/main")
                                 header #js {"alg" "RS256" "kid" "main-key"}
                                 payload #js {"iss" "issuer" "aud" "client"
                                              "exp" (+ now-s 600) "sub" "用户"}
                                 client-id-payload #js {"iss" "issuer" "client_id" "client"
                                                        "exp" (+ now-s 600)}
                                 no-exp-payload #js {"iss" "issuer" "aud" "client"}
                                 boundary-payload #js {"iss" "issuer" "aud" "client"
                                                       "exp" now-s}
                                 expired-payload #js {"iss" "issuer" "aud" "client"
                                                      "exp" (dec now-s)}]
                             (-> (js/Promise.all
                                  #js [(sign-jwt (.-privateKey key-pair) header payload)
                                       (sign-jwt (.-privateKey key-pair) header client-id-payload)
                                       (sign-jwt (.-privateKey key-pair) header no-exp-payload)
                                       (sign-jwt (.-privateKey key-pair) header boundary-payload)
                                       (sign-jwt (.-privateKey key-pair) header expired-payload)
                                       (sign-jwt (.-privateKey wrong-key-pair) header payload)])
                                 (.then
                                  (fn [tokens]
                                    (let [valid-token (aget tokens 0)
                                          client-id-token (aget tokens 1)
                                          no-exp-token (aget tokens 2)
                                          boundary-token (aget tokens 3)
                                          expired-token (aget tokens 4)
                                          wrong-signature-token (aget tokens 5)
                                          wrong-issuer-env (authorization-env "wrong" "client" "https://jwks/main")]
                                      (-> (js/Promise.resolve)
                                          (.then (fn []
                                                   (let [message (try
                                                                   (authorization/verify-jwt "a.b" env)
                                                                   nil
                                                                   (catch :default error
                                                                     (.-message error)))]
                                                     (is (= "invalid" message)))))
                                          (.then (fn [] (authorization/verify-jwt valid-token env)))
                                          (.then (fn [claims]
                                                   (is (= "用户" (aget claims "sub")))
                                                   (is (= 1 (count @fetch-calls)))))
                                          (.then (fn []
                                                   (authorization/verify-jwt valid-token wrong-issuer-env)))
                                          (.then (fn [claims]
                                                   (is (= "用户" (aget claims "sub")))
                                                   (is (= 1 (count @fetch-calls)))))
                                          (.then (fn [] (authorization/verify-jwt client-id-token env)))
                                          (.then (fn [claims]
                                                   (is (= "client" (aget claims "client_id")))))
                                          (.then (fn [] (authorization/verify-jwt no-exp-token env)))
                                          (.then (fn [claims]
                                                   (is (= "issuer" (aget claims "iss")))))
                                          (.then (fn []
                                                   (rejection-message
                                                    (authorization/verify-jwt no-exp-token wrong-issuer-env))))
                                          (.then (fn [message]
                                                   (is (= "iss not found" message))))
                                          (.then (fn [] (authorization/verify-jwt boundary-token env)))
                                          (.then (fn [claims]
                                                   (is (= now-s (aget claims "exp")))))
                                          (.then (fn []
                                                   (rejection-message
                                                    (authorization/verify-jwt boundary-token wrong-issuer-env))))
                                          (.then (fn [message]
                                                   (is (= "iss not found" message))))
                                          (.then (fn []
                                                   (rejection-message
                                                    (authorization/verify-jwt expired-token env))))
                                          (.then (fn [message]
                                                   (is (= "exp" message))))
                                          (.then (fn []
                                                   (rejection-message
                                                    (authorization/verify-jwt
                                                     valid-token
                                                     (authorization-env "issuer" "wrong" "https://jwks/main")))))
                                          (.then (fn [message]
                                                   (is (= nil message)
                                                       "cached tokens bypass later environment changes")))
                                          (.then (fn []
                                                   (authorization/verify-jwt wrong-signature-token env)))
                                          (.then (fn [claims]
                                                   (is (nil? claims))))
                                          (.then (fn []
                                                   (let [unknown-header #js {"alg" "RS256" "kid" "unknown"}]
                                                     (sign-jwt (.-privateKey key-pair)
                                                               unknown-header payload))))
                                          (.then (fn [token]
                                                   (rejection-message
                                                    (authorization/verify-jwt token env))))
                                          (.then (fn [message]
                                                   (is (= "kid" message))
                                                   (is (= 2 (count @fetch-calls)))))
                                          (.then (fn []
                                                   (set! (.-fetch js/globalThis)
                                                         (fn [_]
                                                           (js/Promise.reject
                                                            (js/Error. "network failure"))))
                                                   (let [network-env (authorization-env
                                                                      "issuer" "client"
                                                                      "https://jwks/network")]
                                                     (.then
                                                      (sign-jwt (.-privateKey key-pair)
                                                                header no-exp-payload)
                                                      #(rejection-message
                                                        (authorization/verify-jwt % network-env))))))
                                          (.then (fn [message]
                                                   (is (= "network failure" message))))
                                          (.then (fn []
                                                   (set! (.-fetch js/globalThis)
                                                         (fn [_]
                                                           (js/Promise.resolve #js {:ok false})))
                                                   (let [http-env (authorization-env
                                                                   "issuer" "client"
                                                                   "https://jwks/http")]
                                                     (.then
                                                      (sign-jwt (.-privateKey key-pair)
                                                                header no-exp-payload)
                                                      #(rejection-message
                                                        (authorization/verify-jwt % http-env))))))
                                          (.then (fn [message]
                                                   (is (= "jwks" message))))
                                          (.then (fn []
                                                   (set! (.-fetch js/globalThis)
                                                         (fn [_]
                                                           (js/Promise.resolve
                                                            #js {:ok true
                                                                 :json (fn []
                                                                         (js/Promise.resolve
                                                                          #js {:keys #js [jwk]}))})))
                                                   (let [ttl-env (authorization-env
                                                                  "issuer" "client"
                                                                  "https://jwks/ttl")]
                                                     (.then
                                                      (sign-jwt
                                                       (.-privateKey key-pair)
                                                       header
                                                       #js {"iss" "issuer" "aud" "client"
                                                            "exp" (+ now-s 10000)})
                                                      (fn [token]
                                                        (.then
                                                         (authorization/verify-jwt token ttl-env)
                                                         (fn [_]
                                                           (swap! now-ms + 3600000)
                                                           (rejection-message
                                                            (authorization/verify-jwt
                                                             token
                                                             (authorization-env
                                                              "wrong" "client"
                                                              "https://jwks/ttl"))))))))))
                                          (.then (fn [message]
                                                   (is (= "iss not found" message))))))))))))))))
               (.then (fn [_]
                        (set! (.-fetch js/globalThis) original-fetch)
                        (set! (.-now js/Date) original-date-now)
                        (done)))
               (.catch (fn [error]
                         (set! (.-fetch js/globalThis) original-fetch)
                         (set! (.-now js/Date) original-date-now)
                         (is false (str "authorization integration failed: " error))
                         (done)))))))

(deftest runtime-and-datascript-adapters-export-the-complete-contract
  (let [expected (set bridge-methods)
        browser-methods (set (js/Object.keys (bridge browser-api)))
        node-methods (set (js/Object.keys (bridge node-api)))]
    (is (= expected browser-methods))
    (is (= expected node-methods))))

(deftest datascript-database-schema-is-a-named-primitive
  (let [schema {:block/uuid {:db/unique :db.unique/identity}}
        conn (d/create-conn schema)]
    (is (= schema
           (invoke node-api "datascriptDatabaseSchema"
                   (d/db conn))))))

(deftest datascript-datom-equality-is-a-named-primitive
  (let [conn (d/create-conn {:block/title {:db/index true}})
        _ (d/transact! conn [{:db/id -1 :block/title "One"}
                             {:db/id -2 :block/title "Two"}])
        datoms (d/datoms (d/db conn) :avet :block/title)
        first-datom (first datoms)
        second-datom (second datoms)]
    (is (true? (invoke node-api "datascriptDatomEquals"
                       first-datom first-datom)))
    (is (false? (invoke node-api "datascriptDatomEquals"
                        first-datom second-datom)))))

(deftest initial-data-delegates-once-to-the-domain-workflow
  (let [conn (d/create-conn
              (merge db-schema/schema
                     {:logseq.property/order-list-type {:db/index true}
                      :logseq.property.user/email {:db/index true}}))
        _ (d/transact! conn [{:db/ident :logseq.class/Tag}
                             {:db/ident :logseq.class/Property}])
        api (.-InitialDataWorkflow db-api)
        original (.-getWith api)
        calls (atom 0)]
    (set! (.-getWith api)
          (fn [_runtime _datascript database]
            (swap! calls inc)
            (is (= (d/db conn) database))
            #js {:schema :schema-result
                 :initialData #js ["datom"]}))
    (try
      (is (= {:schema :schema-result
              :initial-data ["datom"]}
             (update (initial-data/get-initial-data (d/db conn))
                     :initial-data vec)))
      (is (= 1 @calls))
      (finally
        (set! (.-getWith api) original)))))

(deftest initial-projection-delegates-once-to-the-domain-workflow
  (let [api (.-InitialDataWorkflow db-api)
        original-parent (.-withParentWith api)
        original-blocks (.-blockAndChildrenWith api)
        calls (atom [])
        db :database
        block {:db/id 1 :block/page 10}]
    (set! (.-withParentWith api)
          (fn [_runtime _datascript database value]
            (swap! calls conj [:parent database value])
            :with-parent))
    (set! (.-blockAndChildrenWith api)
          (fn [_runtime _datascript database lookup children? properties
               include-collapsed?]
            (swap! calls conj
                   [:blocks database lookup children? (vec properties)
                    include-collapsed?])
            {:block :root :children [:child]}))
    (try
      (is (= :with-parent (initial-data/with-parent db block)))
      (is (= {:block :root :children [:child]}
             (initial-data/get-block-and-children
              db 1 {:children? true
                    :properties [:block/title]
                    :include-collapsed-children? true})))
      (is (= [[:parent db block]
              [:blocks db 1 true [:block/title] true]]
             @calls))
      (finally
        (set! (.-withParentWith api) original-parent)
        (set! (.-blockAndChildrenWith api) original-blocks)))))

(deftest initial-projection-preserves-datascript-entities
  (let [schema {:block/uuid {:db/unique :db.unique/identity}
                :block/page {:db/valueType :db.type/ref}
                :block/parent {:db/valueType :db.type/ref :db/index true}}
        conn (d/create-conn schema)
        root-uuid #uuid "11111111-1111-4111-8111-111111111111"
        _ (d/transact! conn
                       [{:db/id 10
                         :block/uuid #uuid "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
                         :block/title "Page"}
                        {:db/id 1
                         :block/uuid root-uuid
                         :block/title "Stored"
                         :block/raw-title "Raw"
                         :block/page 10
                         :block/parent 10}
                        {:db/id 2
                         :block/uuid #uuid "22222222-2222-4222-8222-222222222222"
                         :block/title "Child"
                         :block/page 10
                         :block/parent 1}])
        database (d/db conn)
        result (initial-data/get-block-and-children
                database root-uuid
                {:children? true :properties [:block/title]})
        with-parent (initial-data/with-parent
                     database (d/pull database '[*] 1))]
    (is (= "Raw" (get-in result [:block :block/title])))
    (is (= "Child" (:block/title (first (:children result)))))
    (is (= 10 (get-in with-parent [:block/parent :db/id])))))

(deftest tree-operations-delegate-once-to-the-domain-workflow
  (let [api (.-TreeWorkflow db-api)
        original-sort (.-sortWith api)
        original-tree (.-blockAndChildrenWith api)
        sort-calls (atom 0)
        tree-calls (atom 0)
        blocks [{:db/id 1 :block/order "a0"}
                {:db/id 2 :block/order "a1"}]
        conn (d/create-conn {:block/uuid {:db/unique :db.unique/identity}})
        uuid #uuid "44444444-4444-4444-8444-444444444444"
        _ (d/transact! conn [{:block/uuid uuid :block/title "Root"}])]
    (set! (.-sortWith api)
          (fn [_runtime _datascript values]
            (swap! sort-calls inc)
            (is (= blocks (vec values)))
            (to-array (reverse values))))
    (set! (.-blockAndChildrenWith api)
          (fn [_runtime _datascript database block-uuid include-property?]
            (swap! tree-calls inc)
            (is (= (d/db conn) database))
            (is (= uuid block-uuid))
            (is (true? include-property?))
            #js ["root" "child"]))
    (try
      (is (= (reverse blocks) (db-core/sort-by-order blocks)))
      (is (= ["root" "child"]
             (vec (db-core/get-block-and-children
                   (d/db conn) uuid {:include-property-block? true}))))
      (is (= 1 @sort-calls))
      (is (= 1 @tree-calls))
      (finally
        (set! (.-sortWith api) original-sort)
        (set! (.-blockAndChildrenWith api) original-tree)))))

(deftest sibling-operations-delegate-once-to-the-domain-workflow
  (let [api (.-TreeWorkflow db-api)
        original (.-siblingWith api)
        calls (atom [])
        schema {:block/uuid {:db/unique :db.unique/identity}
                :block/parent {:db/valueType :db.type/ref
                               :db/index true}
                :block/order {:db/index true}
                :block/closed-value-property {:db/valueType :db.type/ref
                                              :db/index true}
                :logseq.property/created-from-property {:db/valueType :db.type/ref
                                                        :db/index true}}
        conn (d/create-conn schema)
        parent-uuid #uuid "55555555-5555-4555-8555-555555555555"
        block-uuid #uuid "66666666-6666-4666-8666-666666666666"
        _ (d/transact! conn [{:block/uuid parent-uuid}
                             {:block/uuid block-uuid
                              :block/parent [:block/uuid parent-uuid]
                              :block/order "a1"}])
        block (d/entity (d/db conn) [:block/uuid block-uuid])
        left-result #js {:direction "left"}
        right-result #js {:direction "right"}]
    (set! (.-siblingWith api)
          (fn [_runtime _datascript candidate direction]
            (swap! calls conj direction)
            (is (= (:db/id block) (:db/id candidate)))
            (case direction
              "left" left-result
              "right" right-result)))
    (try
      (is (identical? right-result (db-core/get-right-sibling block)))
      (is (identical? left-result (db-core/get-left-sibling block)))
      (is (= ["right" "left"] @calls))
      (finally
        (set! (.-siblingWith api) original)))))

(deftest child-operations-delegate-once-to-the-domain-workflow
  (let [api (.-TreeWorkflow db-api)
        original-first-of (.-firstChildOfWith api)
        original-first (.-firstChildWith api)
        original-children (.-childrenByReferenceWith api)
        first-of-calls (atom 0)
        first-calls (atom [])
        children-calls (atom [])
        conn (d/create-conn {:block/uuid {:db/unique :db.unique/identity}})
        entity-result #js {:kind "entity-first"}
        lookup-result #js {:kind "lookup-first"}
        child-results #js [#js {:id 1} #js {:id 2}]
        parent-uuid #uuid "77777777-7777-4777-8777-777777777777"
        _ (d/transact! conn [{:db/id 10 :block/uuid parent-uuid}])
        db (d/db conn)
        parent (d/entity db 10)]
    (set! (.-firstChildOfWith api)
          (fn [_runtime _datascript candidate]
            (swap! first-of-calls inc)
            (is (identical? parent candidate))
            entity-result))
    (set! (.-firstChildWith api)
          (fn [_runtime _datascript database kind value]
            (swap! first-calls conj [database kind value])
            lookup-result))
    (set! (.-childrenByReferenceWith api)
          (fn [_runtime _datascript database value]
            (swap! children-calls conj [database value])
            child-results))
    (try
      (is (identical? entity-result (db-core/get-down parent)))
      (is (identical? lookup-result (db-core/get-first-child db 10)))
      (is (= [1 2] (map #(.-id %) (db-core/get-children db 10))))
      (is (= [1 2]
             (map #(.-id %) (db-core/get-children db parent-uuid))))
      (is (= [1 2]
             (map #(.-id %) (db-core/get-children parent))))
      (is (= 1 @first-of-calls))
      (is (= [[db "id" 10]] @first-calls))
      (is (= [[db 10]
              [db parent-uuid]
              [nil parent]]
             @children-calls))
      (finally
        (set! (.-firstChildOfWith api) original-first-of)
        (set! (.-firstChildWith api) original-first)
        (set! (.-childrenByReferenceWith api) original-children)))))

(deftest core-relation-and-library-operations-delegate-once
  (let [api (.-CoreRead db-api)
        original-relations (.-pagesRelationWith api)
        original-tagged (.-allTaggedPagesWith api)
        original-library (.-pageInLibraryWith api)
        calls (atom [])
        conn (d/create-conn {:block/tags {:db/valueType :db.type/ref
                                         :db/cardinality :db.cardinality/many}
                             :block/uuid {:db/unique :db.unique/identity}
                             :db/ident {:db/unique :db.unique/identity}})
        _ (d/transact! conn [{:db/id 1 :db/ident :logseq.class/Page}
                             {:db/id 2 :block/tags [1]}])
        db (d/db conn)
        page (d/entity db 2)]
    (set! (.-pagesRelationWith api)
          (fn [_runtime _datascript database with-journal?]
            (swap! calls conj [:relations database with-journal?])
            #js ["relation"]))
    (set! (.-allTaggedPagesWith api)
          (fn [_runtime _datascript database]
            (swap! calls conj [:tagged database])
            #js ["tagged"]))
    (set! (.-pageInLibraryWith api)
          (fn [_runtime _datascript database candidate]
            (swap! calls conj [:library database (:db/id candidate)])
            true))
    (try
      (is (= ["relation"] (vec (db-core/get-pages-relation db true))))
      (is (= ["tagged"] (vec (db-core/get-all-tagged-pages db))))
      (is (true? (db-core/page-in-library? db page)))
      (is (= [[:relations db true]
              [:tagged db]
              [:library db 2]]
             @calls))
      (finally
        (set! (.-pagesRelationWith api) original-relations)
        (set! (.-allTaggedPagesWith api) original-tagged)
        (set! (.-pageInLibraryWith api) original-library)))))

(deftest core-page-lookups-delegate-once
  (let [api (.-CoreRead db-api)
        original-page (.-pageByReferenceWith api)
        original-journal (.-journalPageByDatabaseWith api)
        original-case (.-casePageByReferenceWith api)
        calls (atom [])
        conn (d/create-conn {:block/uuid {:db/unique :db.unique/identity}
                             :block/name {:db/index true}
                             :block/title {:db/index true}})
        db (d/db conn)
        result #js {:page true}
        page-uuid #uuid "88888888-8888-4888-8888-888888888888"]
    (set! (.-pageByReferenceWith api)
          (fn [_runtime _datascript database value]
            (swap! calls conj [:page database value])
            result))
    (set! (.-journalPageByDatabaseWith api)
          (fn [_runtime _datascript database value]
            (swap! calls conj [:journal database value])
            result))
    (set! (.-casePageByReferenceWith api)
          (fn [_runtime _datascript database value]
            (swap! calls conj [:case database value])
            result))
    (try
      (is (identical? result (db-core/get-page db 42)))
      (is (identical? result (db-core/get-page db page-uuid)))
      (is (identical? result (db-core/get-page db "Named")))
      (is (identical? result (db-core/get-journal-page db "Journal")))
      (is (identical? result (db-core/get-case-page db page-uuid)))
      (is (identical? result (db-core/get-case-page db "Titled")))
      (is (= [[:page db 42]
              [:page db page-uuid]
              [:page db "Named"]
              [:journal db "Journal"]
              [:case db page-uuid]
              [:case db "Titled"]]
             @calls))
      (finally
        (set! (.-pageByReferenceWith api) original-page)
        (set! (.-journalPageByDatabaseWith api) original-journal)
        (set! (.-casePageByReferenceWith api) original-case)))))

(deftest core-page-state-operations-delegate-once
  (let [api (.-CoreRead db-api)
        original-empty (.-pageEmptyByReferenceWith api)
        original-has-children (.-hasChildrenByReferenceWith api)
        original-last-child (.-lastDirectChildIdWith api)
        calls (atom [])
        conn (d/create-conn {:block/parent {:db/valueType :db.type/ref}
                             :block/order {:db/index true}})
        _ (d/transact! conn [{:db/id 1 :block/title "Root"}
                             {:db/id 2
                              :block/title "Child"
                              :block/parent 1
                              :block/order "a0"}])
        db (d/db conn)]
    (set! (.-pageEmptyByReferenceWith api)
          (fn [_runtime _datascript database value]
            (swap! calls conj [:empty database value])
            true))
    (set! (.-hasChildrenByReferenceWith api)
          (fn [_runtime _datascript database value]
            (swap! calls conj [:has-children database value])
            false))
    (set! (.-lastDirectChildIdWith api)
          (fn [_runtime _datascript database value not-collapsed?]
            (swap! calls conj [:last database value not-collapsed?])
            99))
    (try
      (is (true? (db-core/page-empty? db 1)))
      (is (false? (db-core/has-children? db 1)))
      (is (= 99 (db-core/get-block-last-direct-child-id db 1 true)))
      (is (= [[:empty db 1]
              [:has-children db 1]
              [:last db 1 true]]
             @calls))
      (finally
        (set! (.-pageEmptyByReferenceWith api) original-empty)
        (set! (.-hasChildrenByReferenceWith api) original-has-children)
        (set! (.-lastDirectChildIdWith api) original-last-child)))))

(deftest core-orphaned-pages-delegates-once
  (let [api (.-CoreRead db-api)
        original-orphaned (.-orphanedPagesWith api)
        calls (atom [])
        db (d/empty-db)
        pages ["one" "two"]
        built-ins #{"built-in"}
        empty-ref-f (fn [_page] true)
        result #js [#js {:page true}]]
    (set! (.-orphanedPagesWith api)
          (fn [_runtime _datascript database candidates names callback]
            (swap! calls conj
                   [:orphaned database (vec candidates) (set names) callback])
            result))
    (try
      (is (identical? (aget result 0)
                      (first (db-core/get-orphaned-pages
                              db
                              {:pages pages
                               :empty-ref-f empty-ref-f
                               :built-in-pages-names built-ins}))))
      (is (= [[:orphaned db pages built-ins empty-ref-f]] @calls))
      (finally
        (set! (.-orphanedPagesWith api) original-orphaned)))))

(deftest core-alias-and-hidden-tag-operations-delegate-once
  (let [api (.-CoreRead db-api)
        original-source (.-aliasSourcePageWith api)
        original-set (.-pageAliasSetWith api)
        original-hidden (.-hiddenOrInternalTagWith api)
        calls (atom [])
        db (d/empty-db)
        entity #js {:entity true}
        source #js {:source true}]
    (set! (.-aliasSourcePageWith api)
          (fn [_runtime _datascript database alias-id]
            (swap! calls conj [:source database alias-id])
            source))
    (set! (.-pageAliasSetWith api)
          (fn [_runtime _datascript database page-id]
            (swap! calls conj [:set database page-id])
            #js [page-id 9]))
    (set! (.-hiddenOrInternalTagWith api)
          (fn [_runtime _datascript candidate]
            (swap! calls conj [:hidden candidate])
            true))
    (try
      (is (identical? source (db-core/get-alias-source-page db 7)))
      (is (= #{7 9} (db-core/page-alias-set db 7)))
      (is (true? (db-core/hidden-or-internal-tag? entity)))
      (is (= [[:source db 7] [:set db 7] [:hidden entity]] @calls))
      (finally
        (set! (.-aliasSourcePageWith api) original-source)
        (set! (.-pageAliasSetWith api) original-set)
        (set! (.-hiddenOrInternalTagWith api) original-hidden)))))

(deftest core-bidirectional-properties-delegates-once
  (let [api (.-Bidirectional db-api)
        original-properties (.-getPropertiesWith api)
        calls (atom [])
        db (d/empty-db)
        group {:title "Tasks" :class {:db/id 10} :entities []}]
    (set! (.-getPropertiesWith api)
          (fn [_runtime _datascript database target-id]
            (swap! calls conj [:properties database target-id])
            #js [group]))
    (try
      (is (= [group] (vec (db-core/get-bidirectional-properties db 99))))
      (is (= [[:properties db 99]] @calls))
      (finally
        (set! (.-getPropertiesWith api) original-properties)))))

(deftest core-page-order-operations-delegate-once
  (let [api (.-CoreRead db-api)
        original-sort (.-sortPageRandomBlocksWith api)
        original-last (.-lastChildBlockWith api)
        original-gaps (.-nonConsecutiveBlocksWith api)
        calls (atom [])
        db (d/empty-db)
        blocks [#js {:db-id 2} #js {:db-id 3}]]
    (set! (.-sortPageRandomBlocksWith api)
          (fn [_runtime _datascript database values]
            (swap! calls conj [:sort database (vec values)])
            (to-array (reverse values))))
    (set! (.-lastChildBlockWith api)
          (fn [_runtime _datascript database parent-id child-id]
            (swap! calls conj [:last database parent-id child-id])
            true))
    (set! (.-nonConsecutiveBlocksWith api)
          (fn [_runtime _datascript database values]
            (swap! calls conj [:gaps database (vec values)])
            #js []))
    (try
      (is (= (vec (reverse blocks))
             (vec (db-core/sort-page-random-blocks db blocks))))
      (is (true? (db-core/last-child-block? db 1 2)))
      (is (= [] (db-core/get-non-consecutive-blocks db blocks)))
      (is (= [[:sort db blocks] [:last db 1 2] [:gaps db blocks]] @calls))
      (finally
        (set! (.-sortPageRandomBlocksWith api) original-sort)
        (set! (.-lastChildBlockWith api) original-last)
        (set! (.-nonConsecutiveBlocksWith api) original-gaps)))))

(deftest core-transaction-preparation-delegates-once
  (let [workflow-api (.-TransactionWorkflow db-api)
        execution-api (.-TransactionExecution db-api)
        original-replace (.-replaceEntities workflow-api)
        original-transact (.-transactOwnedWith execution-api)
        calls (atom [])]
    (set! (.-replaceEntities workflow-api)
          (fn [_runtime _datascript value]
            (swap! calls conj [:replace value])
            :replaced))
    (set! (.-transactOwnedWith execution-api)
          (fn [_runtime _datascript _execution target tx-data tx-meta batch?]
            (swap! calls conj [:transact target (vec tx-data) tx-meta batch?])
            :report))
    (try
      (is (= :replaced (db-core/entity->db-id {:block/link :entity})))
      (is (= :report (db-core/transact! "repo" [{:block/title "raw"}] {:source :test})))
      (is (= [[:replace {:block/link :entity}]
              [:transact "repo" [{:block/title "raw"}] {:source :test} false]]
             @calls))
      (finally
        (set! (.-replaceEntities workflow-api) original-replace)
        (set! (.-transactOwnedWith execution-api) original-transact)))))

(deftest core-transaction-preserves-datascript-exception-data
  (let [conn (d/create-conn {:block/uuid {:db/unique :db.unique/identity}})
        missing-uuid #uuid "11111111-1111-4111-8111-111111111111"
        error (try
                (db-core/transact!
                 conn
                 [[:db/add [:block/uuid missing-uuid] :block/title "Missing"]]
                 {:db-sync/suppress-transact-failed-log? true})
                nil
                (catch :default error
                  error))]
    (is (some? error))
    (is (= :entity-id/missing (:error (ex-data error))))
    (is (= [:block/uuid missing-uuid] (:entity-id (ex-data error))))))

(deftest core-batch-transactions-delegate-once
  (let [execution-api (.-TransactionExecution db-api)
        original-temp (.-batchWithTemp execution-api)
        original-batch (.-batchWith execution-api)
        calls (atom [])
        conn (atom :database)
        batch-fn (fn [& _args] :batch)
        listen-fn (fn [_report] :listen)
        before-fn (fn [] :before)]
    (set! (.-batchWithTemp execution-api)
          (fn [_runtime _datascript _execution connection tx-meta callback
               listener before commit listener-key]
            (swap! calls conj
                   [:temp connection tx-meta callback listener before commit listener-key])
            :temp-report))
    (set! (.-batchWith execution-api)
          (fn [_runtime _datascript _execution connection tx-meta callback
               listener listener-key]
            (swap! calls conj
                   [:batch connection tx-meta callback listener listener-key])
            :batch-report))
    (try
      (is (= :temp-report
             (db-core/batch-transact-with-temp-conn!
              conn {:source :temp} batch-fn
              :listen-db listen-fn
              :before-commit before-fn)))
      (is (= :batch-report
             (db-core/batch-transact! conn {:source :batch} batch-fn
                                      :listen-db listen-fn)))
      (is (= 2 (count @calls)))
      (is (= [:temp conn {:source :temp} batch-fn listen-fn before-fn]
             (subvec (first @calls) 0 6)))
      (is (= [:batch conn {:source :batch}]
             (subvec (second @calls) 0 3)))
      (finally
        (set! (.-batchWithTemp execution-api) original-temp)
        (set! (.-batchWith execution-api) original-batch)))))

(deftest delete-workflow-delegates-once
  (let [api (.-DeleteWorkflow db-api)
        original-expand (.-expandWith api)
        original-cleanup (.-cleanupWith api)
        calls (atom [])
        db :database
        txs [[:db/retractEntity 1]]
        tx-meta {:outliner-op :delete-blocks}]
    (set! (.-expandWith api)
          (fn [_runtime _datascript database transaction-data metadata]
            (swap! calls conj [:expand database transaction-data metadata])
            '([:db/retractEntity 1] [:db/retractEntity 2])))
    (set! (.-cleanupWith api)
          (fn [_runtime _datascript database transaction-data]
            (swap! calls conj [:cleanup database transaction-data])
            '([:db/retractEntity 3])))
    (try
      (is (= [[:db/retractEntity 1] [:db/retractEntity 2]]
             (vec (delete-blocks/expand-delete-blocks-tx db txs tx-meta))))
      (is (= [[:db/retractEntity 3]]
             (vec (delete-blocks/update-refs-history db txs tx-meta))))
      (is (= [[:expand db txs tx-meta]
              [:cleanup db txs]]
             @calls))
      (finally
        (set! (.-expandWith api) original-expand)
        (set! (.-cleanupWith api) original-cleanup)))))

(deftest sqlite-build-tree-helpers-delegate-once
  (let [api (.-SqliteBuild db-api)
        original-extract (.-extractBlocksWith api)
        original-update (.-updateBlocksWith api)
        calls (atom [])
        blocks [{:block/title "root"}]
        callback (fn [block] [(:block/title block)])]
    (set! (.-extractBlocksWith api)
          (fn [_runtime values f]
            (swap! calls conj [:extract (vec values) f])
            '("root" "child")))
    (set! (.-updateBlocksWith api)
          (fn [_runtime values f]
            (swap! calls conj [:update (vec values) f])
            [{:block/title "updated"}]))
    (try
      (is (= ["root" "child"]
             (vec (sqlite-build/extract-from-blocks blocks callback))))
      (is (= [{:block/title "updated"}]
             (sqlite-build/update-each-block blocks callback)))
      (is (= [[:extract blocks callback] [:update blocks callback]] @calls))
      (finally
        (set! (.-extractBlocksWith api) original-extract)
        (set! (.-updateBlocksWith api) original-update)))))

(deftest sqlite-export-collection-helpers-delegate-once
  (let [api (.-SqliteExport db-api)
        original-sort (.-sortPagesWith api)
        original-import (.-importTransactionDataWith api)
        calls (atom [])
        pages [{:page {:block/title "Page"}}]
        transactions {:init-tx [1] :block-props-tx [2] :misc-tx [3]}]
    (set! (.-sortPagesWith api)
          (fn [_runtime values]
            (swap! calls conj [:sort values])
            [:sorted]))
    (set! (.-importTransactionDataWith api)
          (fn [_runtime values]
            (swap! calls conj [:import values])
            [:transactions]))
    (try
      (is (= [:sorted] (sqlite-export/sort-pages-and-blocks pages)))
      (is (= [:transactions] (sqlite-export/import-tx-data transactions)))
      (is (= [[:sort pages] [:import transactions]] @calls))
      (finally
        (set! (.-sortPagesWith api) original-sort)
        (set! (.-importTransactionDataWith api) original-import)))))

(deftest keyword-round-trip-preserves-qualified-name
  (doseq [module [browser-api node-api]]
    (configure! module)
    (let [value :block/title
          encoded (invoke module "keywordToString" value)
          decoded (invoke module "keywordFromString" "block/title")]
      (is (= "block/title" encoded))
      (is (= value decoded)))))

(deftest runtime-scalar-form-and-map-codecs-preserve-cljs-values
  (let [keyword-value (invoke node-api "keywordFromString" "block/title")
        symbol-value (invoke node-api "symbolFromString" "?title")
        list-value (invoke node-api "arrayToList" #js [symbol-value keyword-value])
        map-value (invoke node-api "entriesToMap" #js [#js [keyword-value "Alpha"]])
        updated (invoke node-api "mapAssoc" map-value keyword-value "Beta")
        removed (invoke node-api "mapDissoc" updated keyword-value)]
    (is (= '?title symbol-value))
    (is (= '(?title :block/title) list-value))
    (is (= [symbol-value keyword-value]
           (vec (invoke node-api "collectionToArray" list-value))))
    (is (nil? (invoke node-api "nilValue")))
    (is (= "Alpha" (invoke node-api "mapGet" map-value keyword-value)))
    (is (= "Beta" (invoke node-api "mapGet" updated keyword-value)))
    (is (true? (invoke node-api "mapContains" updated keyword-value)))
    (is (false? (invoke node-api "mapContains" removed keyword-value)))
    (is (= "text" (invoke node-api "stringFromValue"
                           (invoke node-api "stringToValue" "text"))))
    (is (= "äbc" (invoke node-api "stringLowercase" "ÄBC")))
    (is (true? (invoke node-api "boolFromValue"
                        (invoke node-api "boolToValue" true))))
    (is (= 42 (invoke node-api "floatFromValue"
                      (invoke node-api "intToValue" 42))))
    (is (= 42 (invoke node-api "intFromValue"
                      (invoke node-api "intToValue" 42))))
    (is (= 1.5 (invoke node-api "floatFromValue"
                       (invoke node-api "floatToValue" 1.5))))
    (is (true? (invoke node-api "valueEquals" keyword-value :block/title)))
    (is (true? (invoke node-api "valueTruthy" "present")))
    (is (false? (invoke node-api "valueTruthy" nil)))
    (is (= ":block/title" (invoke node-api "valueToString" keyword-value)))
    (is (true? (invoke node-api "valueIsNil" nil)))
    (is (true? (invoke node-api "valueIsString" "text")))
    (is (true? (invoke node-api "valueIsBool" false)))
    (is (true? (invoke node-api "valueIsNumber" 1.5)))
    (is (true? (invoke node-api "valueIsInteger" 42)))
    (is (true? (invoke node-api "valueIsKeyword" keyword-value)))
    (is (true? (invoke node-api "valueIsUuid" (random-uuid))))
    (is (true? (invoke node-api "valueIsVector" [])))
    (is (true? (invoke node-api "valueIsSet" #{})))
    (is (true? (invoke node-api "valueIsMap" {})))
    (is (true? (invoke node-api "valueIsSequential" list-value)))))

(deftest keyword-representation-conversion-preserves-public-contract
  (testing "keyword names"
    (is (= "title" (runtime/to-string :title)))
    (is (= "block/title" (runtime/to-string :block/title)))
    (is (= "alpha/beta/gamma"
           (runtime/to-string (keyword "alpha/beta/gamma")))))
  (testing "non-keyword passthrough"
    (doseq [value [nil false 42 "title" {:block/title "Title"}]]
      (is (identical? value (runtime/to-string value))))))

(deftest uuid-round-trip-preserves-cljs-equality
  (doseq [module [browser-api node-api]]
    (configure! module)
    (let [value #uuid "11111111-1111-4111-8111-111111111111"
          encoded (invoke module "uuidToString" value)
          decoded (invoke module "uuidFromString" encoded)]
      (is (= (str value) encoded))
      (is (= value decoded)))))

(deftest vector-and-set-round-trips-preserve-values
  (configure! node-api)
  (let [vector-value [:block/title nil false 42]
        vector-array (invoke node-api "vectorToArray" vector-value)
        vector-result (invoke node-api "arrayToVector" vector-array)
        set-value #{:block/title nil false 42}
        set-array (invoke node-api "setToArray" set-value)
        set-result (invoke node-api "arrayToSet" set-array)]
    (is (not (missing? vector-array)))
    (is (not (missing? vector-result)))
    (when-not (or (missing? vector-array) (missing? vector-result))
      (is (array? vector-array))
      (is (= vector-value vector-result)))
    (is (not (missing? set-array)))
    (is (not (missing? set-result)))
    (when-not (or (missing? set-array) (missing? set-result))
      (is (array? set-array))
      (is (= set-value set-result)))))

(deftest map-round-trip-preserves-keyword-keys-nil-false-and-missing
  (configure! node-api)
  (let [value (array-map :present-nil nil
                         :present-false false
                         :block/title "Alpha")
        entries (invoke node-api "mapToEntries" value)
        result (invoke node-api "entriesToMap" entries)]
    (is (not (missing? entries)))
    (is (not (missing? result)))
    (when-not (or (missing? entries) (missing? result))
      (is (array? entries))
      (is (= value result))
      (is (contains? result :present-nil))
      (is (contains? result :present-false))
      (is (not (contains? result :missing))))))

(deftest ordered-map-round-trip-preserves-entry-order
  (configure! node-api)
  (let [value (ordered-map :first 1 :second 2 :third 3)
        entries (invoke node-api "orderedMapToEntries" value)
        result (invoke node-api "entriesToOrderedMap" entries)]
    (is (not (missing? entries)))
    (is (not (missing? result)))
    (when-not (or (missing? entries) (missing? result))
      (is (array? entries))
      (is (= [[:first 1] [:second 2] [:third 3]] (array->pairs entries)))
      (is (= [:first :second :third] (vec (keys result))))
      (is (= value result)))))

(deftest large-vector-round-trip-does-not-change-values
  (configure! node-api)
  (let [value (vec (range 10000))
        array-value (invoke node-api "vectorToArray" value)
        result (invoke node-api "arrayToVector" array-value)]
    (is (not (missing? array-value)))
    (is (not (missing? result)))
    (when-not (or (missing? array-value) (missing? result))
      (is (array? array-value))
      (is (= 10000 (alength array-value)))
      (is (= 0 (first result)))
      (is (= 9999 (peek result))))))

(deftest callback-result-and-exception-propagate
  (configure! node-api)
  (testing "callback result"
    (is (= 42 (invoke node-api "invokeCallback" #(* 2 %) 21))))
  (testing "callback exception"
    (is (thrown-with-msg? js/Error #"callback failed"
                          (invoke node-api "invokeCallback"
                                  (fn [_]
                                    (throw (js/Error. "callback failed")))
                                  nil)))))

(deftest promise-rejection-propagates
  (async done
         (configure! node-api)
         (-> (js/Promise.resolve (invoke node-api "rejectPromise" "rejected by adapter"))
             (.then (fn [_]
                      (is false "Bridge should preserve adapter Promise rejection")
                      (done)))
             (.catch (fn [error]
                       (is (= "rejected by adapter" (.-message error)))
                       (done))))))

(deftest datascript-create-conn-uses-injected-runtime
  (configure! node-api)
  (let [conn (invoke node-api "datascriptCreateConn"
                     {:block/uuid {:db/unique :db.unique/identity}}
                     nil)]
    (is (not (missing? conn)))
    (when-not (missing? conn)
      (is (some? (d/db conn))))))

(deftest datascript-db-preserves-the-real-database
  (configure! node-api)
  (let [conn (seed-conn)
        expected (d/db conn)
        result (invoke node-api "datascriptDatabase" conn)]
    (is (not (missing? result)))
    (is (= expected result))))

(deftest datascript-transact-returns-a-real-report
  (configure! node-api)
  (let [conn (d/create-conn {:block/uuid {:db/unique :db.unique/identity}})
        tx-data [{:block/uuid #uuid "22222222-2222-4222-8222-222222222222"
                  :block/title "Beta"}]
        report (invoke node-api "datascriptTransact" conn tx-data nil)]
    (is (not (missing? report)))
    (is (= "Beta" (:block/title (d/entity (d/db conn)
                                           [:block/uuid #uuid "22222222-2222-4222-8222-222222222222"]))))))

(deftest datascript-entity-preserves-keyword-lookup-and-values
  (configure! node-api)
  (let [conn (seed-conn)
        entity (invoke node-api "datascriptEntity" (d/db conn)
                       [:block/uuid #uuid "11111111-1111-4111-8111-111111111111"])]
    (is (not (missing? entity)))
    (is (= "Alpha" (:block/title entity)))
    (is (= "Alpha"
           (invoke node-api "datascriptEntityGet" entity :block/title)))))

(deftest datascript-datoms-preserve-real-datom-values
  (configure! node-api)
  (let [conn (seed-conn)
        datoms (invoke node-api "datascriptDatoms" (d/db conn) :eavt #js [])]
    (is (not (missing? datoms)))
    (when-not (missing? datoms)
      (is (seq datoms))
      (is (some #(= :block/title (:a %)) datoms)))))

(deftest datascript-datom-fields-preserve-real-values
  (configure! node-api)
  (let [conn (seed-conn)
        datom (first (d/datoms (d/db conn) :aevt :block/title))]
    (is (= (:e datom)
           (invoke node-api "datascriptDatomEntity" datom)))
    (is (= (:a datom)
           (invoke node-api "datascriptDatomAttribute" datom)))))

(deftest datascript-report-accessors-preserve-before-after-and-datoms
  (configure! node-api)
  (let [conn (d/create-conn {:block/uuid {:db/unique :db.unique/identity}})
        report (d/transact! conn [{:block/uuid #uuid "33333333-3333-4333-8333-333333333333"
                                   :block/title "Gamma"}])]
    (is (= (:db-before report)
           (invoke node-api "datascriptReportDbBefore" report)))
    (is (= (:db-after report)
           (invoke node-api "datascriptReportDbAfter" report)))
    (is (= (:tx-data report)
           (vec (invoke node-api "datascriptReportDatoms" report))))))

(deftest datascript-squuid-preserves-native-uuid-time-prefix-and-uniqueness
  (doseq [module [browser-api node-api]]
    (let [before-ms (.now js/Date)
          values (repeatedly 256 #(invoke module "datascriptSquuid"))
          after-ms (.now js/Date)
          before-seconds (js/Math.floor (/ before-ms 1000))
          after-seconds (js/Math.floor (/ after-ms 1000))]
      (is (not-any? missing? values))
      (is (every? uuid? values))
      (is (= 256 (count (distinct values))))
      (is (every? (fn [value]
                    (let [prefix-seconds
                          (js/parseInt (subs (str value) 0 8) 16)]
                      (<= before-seconds prefix-seconds after-seconds)))
                  values)))))

(deftest datascript-large-datom-path-preserves-count
  (configure! node-api)
  (let [conn (d/create-conn {:block/uuid {:db/unique :db.unique/identity}})
        tx-data (mapv (fn [index]
                        {:block/uuid (random-uuid)
                         :block/title (str "Block " index)})
                      (range 10000))]
    (d/transact! conn tx-data)
    (let [expected (d/datoms (d/db conn) :eavt)
          result (invoke node-api "datascriptDatoms" (d/db conn) :eavt #js [])]
      (is (not (missing? result)))
      (when-not (missing? result)
        (is (= (count expected) (count result)))))))
