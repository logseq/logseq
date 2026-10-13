(ns frontend.worker.sync.upload-mutation3-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.apply-txs :as sync-apply]
            [frontend.worker.sync.auth :as sync-auth]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.temp-sqlite :as sync-temp-sqlite]
            [frontend.worker.sync.upload :as sync-upload]
            [frontend.worker.sync.util :as sync-util]
            [logseq.db :as ldb]
            [logseq.db-sync.checksum :as sync-checksum]
            [logseq.db.sqlite.util :as sqlite-util]
            [promesa.core :as p]))

(defn- <outcome
  "Calls f; resolves to its value, or to {::error e} when it throws or rejects."
  [f]
  (-> (p/resolved nil)
      (p/then (fn [_] (f)))
      (p/catch (fn [error] {::error error}))))

(defn- finish [promise done]
  (-> promise
      (p/catch (fn [error] (is false (str "unexpected error: " error))))
      (p/finally done)))

(defn- error-of [outcome]
  (::error outcome))

(def ^:private upload-url-prefix "https://sync.example.test/sync/graph-1/snapshot/upload")

;; ---------------------------------------------------------------- small fns

(deftest ensure-client-graph-uuid-updates-only-for-a-non-empty-graph-id-test
  (let [calls* (atom [])]
    (with-redefs [client-op/update-graph-uuid (fn [repo graph-id] (swap! calls* conj [repo graph-id]))]
      (#'sync-upload/ensure-client-graph-uuid! "repo" "graph-1")
      (#'sync-upload/ensure-client-graph-uuid! "repo" "")
      (#'sync-upload/ensure-client-graph-uuid! "repo" nil))
    (is (= [["repo" "graph-1"]] @calls*))))

(deftest fetch-kvs-rows-queries-rows-after-the-last-addr-test
  (let [opts* (atom nil)
        rows #js [#js [1 "content" "[]"]]
        db #js {:exec (fn [opts] (reset! opts* opts) rows)}]
    (is (identical? rows (sync-upload/fetch-kvs-rows db 7 500)))
    (let [^js opts @opts*]
      (is (= "select addr, content, addresses from kvs where addr > ? order by addr asc limit ?"
             (.-sql opts)))
      (is (= [7 500] (vec (.-bind opts))))
      (is (= "array" (.-rowMode opts))))))

(deftest datom-value-byte-length-is-the-transit-encoded-size-test
  (let [value {:title "héllo"}]
    (is (= (.-byteLength (.encode (js/TextEncoder.) (sqlite-util/write-transit-str value)))
           (#'sync-upload/datom-value-byte-length value)))))

(deftest snapshot-rows-byte-length-adds-the-frame-header-test
  (let [rows [[1 "a" "[]"] [2 "b" "[]"]]]
    (is (= (+ 4 (.-byteLength (sync-upload/encode-snapshot-rows rows)))
           (#'sync-upload/snapshot-rows-byte-length rows)))))

(deftest drop-oversized-upload-datoms-keeps-datoms-at-the-threshold-test
  (let [datoms [{:e 3 :a :logseq.property.tldraw/page :v "huge"}
                {:e 1 :a :block/title :v "safe"}
                {:e 4 :a :logseq.property.tldraw/page :v "edge"}]]
    (with-redefs [sync-upload/datom-value-byte-length
                  (fn [value] (case value
                                "huge" 1500000
                                "edge" 999996
                                0))]
      (let [{:keys [kept dropped]} (#'sync-upload/drop-oversized-upload-datoms datoms)]
        (is (= [1 4] (mapv :e kept)))
        (is (= [{:a :logseq.property.tldraw/page :e 3 :bytes 1500000}] dropped))))))

(deftest drop-oversized-upload-datoms-without-drops-returns-empty-vectors-test
  (let [datoms [{:e 1 :a :block/title :v "safe"}]
        {:keys [kept dropped]} (#'sync-upload/drop-oversized-upload-datoms datoms)]
    (is (= datoms kept))
    (is (= [] dropped))
    (is (vector? dropped))
    (is (= {:kept [] :dropped []}
           (#'sync-upload/drop-oversized-upload-datoms [])))))

(deftest split-snapshot-rows-by-max-bytes-reports-the-first-oversized-row-test
  (let [sizes {:big-1 11 :big-2 12}
        rows [[:big-1 "content-1" "[]"] [:big-2 "content-2" "[]"]]]
    (with-redefs [sync-upload/snapshot-rows-byte-length
                  (fn [rows'] (reduce + (map (fn [[addr]] (get sizes addr 0)) rows')))]
      (let [error (try (#'sync-upload/split-snapshot-rows-by-max-bytes rows 10)
                       nil
                       (catch :default e e))]
        (is (= {:max-bytes 10 :row-size 11 :addr :big-1}
               (ex-data error)))))))

(deftest frame-bytes-prefixes-the-big-endian-length-test
  (is (= [0 0 0 3 1 2 3]
         (vec (sync-upload/frame-bytes (js/Uint8Array. #js [1 2 3]))))))

(deftest upload-snapshot-rows-batches-uploads-each-batch-in-order-test
  (async done
         (let [calls* (atom [])
               rows-batches [[[1 "a" nil]] [[2 "b" nil]] [[3 "c" nil]]]]
           (finish
            (p/let [_ (p/with-redefs [sync-upload/<snapshot-upload-body
                                      (fn [rows] (p/resolved {:body rows :encoding "gzip"}))]
                        (#'sync-upload/<upload-snapshot-rows-batches!
                         rows-batches
                         {:base "https://sync.example.test"
                          :graph-id "graph-1"
                          :first-batch? false
                          :finished? false
                          :checksum "abc"
                          :auth-fetch-f (fn [url headers body]
                                          (swap! calls* conj {:url url :headers headers :body body})
                                          (p/resolved true))}))]
              (is (= rows-batches (mapv :body @calls*)))
              (is (every? #(= {"content-type" "application/transit+json"
                               "content-encoding" "gzip"}
                              (:headers %))
                          @calls*))
              (is (every? #(= (str upload-url-prefix "?reset=false&finished=false") (:url %))
                          @calls*)))
            done))))

;; ------------------------------------------------------------ graph identity

(deftest graph-id->uuid-fails-fast-on-a-missing-graph-id-test
  (let [missing (try (#'sync-upload/graph-id->uuid "repo" "") nil (catch :default e e))]
    (is (= "missing-field" (ex-message missing)))
    (is (= {:repo "repo" :field :graph-id} (ex-data missing)))))

(deftest set-graph-sync-metadata-transacts-the-graph-kvs-test
  (let [graph-uuid (random-uuid)
        calls* (atom [])]
    (with-redefs [worker-state/get-datascript-conn (fn [_repo] :conn)
                  ldb/transact! (fn [conn tx-data opts] (swap! calls* conj [conn tx-data opts]))]
      (#'sync-upload/set-graph-sync-metadata! "repo" (str graph-uuid) false)
      (#'sync-upload/set-graph-sync-metadata! "repo" (str graph-uuid) true))
    (is (= [[:conn
             [(ldb/kv :logseq.kv/graph-uuid graph-uuid)
              (ldb/kv :logseq.kv/graph-remote? true)
              (ldb/kv :logseq.kv/graph-rtc-e2ee? false)]
             {:outliner-op :set-kvs}]
            [:conn
             [(ldb/kv :logseq.kv/graph-uuid graph-uuid)
              (ldb/kv :logseq.kv/graph-remote? true)
              (ldb/kv :logseq.kv/graph-rtc-e2ee? true)]
             {:outliner-op :set-kvs}]]
           @calls*))))

(deftest persist-upload-graph-identity-returns-string-graph-id-and-updates-client-test
  (let [graph-uuid (random-uuid)
        calls* (atom [])]
    (with-redefs [worker-state/get-datascript-conn (fn [_repo] nil)
                  client-op/update-graph-uuid (fn [repo graph-id] (swap! calls* conj [repo graph-id]))]
      (is (= {:graph-id (str graph-uuid) :graph-e2ee? true}
             (#'sync-upload/persist-upload-graph-identity! "repo" graph-uuid nil)))
      (is (= [["repo" (str graph-uuid)]] @calls*))
      (let [error (try (#'sync-upload/persist-upload-graph-identity! "repo" nil false)
                       nil
                       (catch :default e e))]
        (is (= "missing-field" (ex-message error)))
        (is (= {:repo "repo" :field :graph-id} (ex-data error)))))))

;; --------------------------------------------------------- remote graph calls

(defn- <create-aux!
  "Runs <create-remote-graph-aux! with the network edges redefined; resolves to
  {:outcome .. :calls ..}."
  [repo opts {:keys [base coerce-result fetch-result conn]}]
  (let [calls* (atom [])]
    (p/let [outcome (p/with-redefs [sync-upload/http-base-url (fn [] base)
                                    worker-state/get-datascript-conn (fn [_repo] conn)
                                    ldb/get-graph-schema-version (fn [_db] {:major 63 :minor 2})
                                    sync-util/require-auth-token! (fn [context] (swap! calls* conj [:require-auth context]))
                                    sync-crypt/ensure-user-rsa-keys! (fn [opts] (swap! calls* conj [:ensure-rsa opts]) (p/resolved nil))
                                    sync-util/coerce-http-request (fn [schema-key body]
                                                                    (swap! calls* conj [:coerce schema-key body])
                                                                    coerce-result)
                                    sync-util/fetch-json (fn [url request opts]
                                                           (swap! calls* conj [:fetch url request opts])
                                                           (p/resolved fetch-result))
                                    sync-upload/persist-upload-graph-identity! (fn [repo graph-id graph-e2ee?]
                                                                                 (swap! calls* conj [:persist repo graph-id graph-e2ee?])
                                                                                 nil)]
                      (<outcome #(#'sync-upload/<create-remote-graph-aux! repo opts)))]
      {:outcome outcome :calls @calls*})))

(deftest create-remote-graph-aux-requests-the-graph-and-takes-e2ee-from-the-response-test
  (async done
         (finish
          (p/let [{:keys [outcome calls]} (<create-aux! "repo-1" {:graph-e2ee? true :graph-ready-for-use? false}
                                                        {:base "https://sync.example.test"
                                                         :coerce-result {:graph-name "repo-1"}
                                                         :fetch-result {:graph-id "g1" :graph-e2ee? false}})
                  {outcome-no-key :outcome} (<create-aux! "repo-1" {:graph-e2ee? false :graph-ready-for-use? true}
                                                          {:base "https://sync.example.test"
                                                           :coerce-result {:graph-name "repo-1"}
                                                           :fetch-result {:graph-id "g2"}})]
            (is (= {:graph-id "g1" :graph-e2ee? false} outcome))
            (is (= [[:require-auth {:repo "repo-1" :field :auth-token}]
                    [:ensure-rsa {:ensure-server? true}]
                    [:coerce :graphs/create {:graph-name "repo-1"
                                             :schema-version nil
                                             :graph-e2ee? true
                                             :graph-ready-for-use? false}]
                    [:fetch "https://sync.example.test/graphs"
                     {:method "POST"
                      :headers {"content-type" "application/json"}
                      :body "{\"graph-name\":\"repo-1\"}"}
                     {:response-schema :graphs/create}]
                    [:persist "repo-1" "g1" false]]
                   calls))
            (is (= {:graph-id "g2" :graph-e2ee? false} outcome-no-key)))
          done)))

(deftest create-remote-graph-aux-sends-the-stripped-graph-name-and-schema-major-test
  (async done
         (finish
          (p/let [{:keys [calls]} (<create-aux! "logseq_db_repo-1" {:graph-e2ee? false}
                                                {:base "https://sync.example.test"
                                                 :conn (atom :db)
                                                 :coerce-result {}
                                                 :fetch-result {:graph-id "g1"}})]
            (is (= [:coerce :graphs/create {:graph-name "repo-1"
                                            :schema-version "63"
                                            :graph-e2ee? false
                                            :graph-ready-for-use? true}]
                   (nth calls 1))))
          done)))

(deftest create-remote-graph-aux-fails-fast-on-missing-inputs-test
  (async done
         (finish
          (p/let [no-base (<create-aux! "repo-1" {} {:base "" :coerce-result {}})
                  no-name (<create-aux! "" {} {:base "https://sync.example.test" :coerce-result {}})
                  no-body (<create-aux! "repo-1" {:graph-e2ee? false}
                                        {:base "https://sync.example.test" :coerce-result nil})
                  no-graph-id (<create-aux! "repo-1" {:graph-e2ee? false}
                                            {:base "https://sync.example.test"
                                             :coerce-result {} :fetch-result {}})]
            (is (= ["missing-field" {:repo "repo-1" :field :http-base}]
                   ((juxt ex-message ex-data) (error-of (:outcome no-base)))))
            (is (= ["missing-field" {:repo "" :field :graph-name}]
                   ((juxt ex-message ex-data) (error-of (:outcome no-name)))))
            (is (= ["invalid-field" {:repo "repo-1" :field :create-graph-body}]
                   ((juxt ex-message ex-data) (error-of (:outcome no-body)))))
            (is (= ["missing-field" {:repo "repo-1" :field :graph-id :op :create-graph}]
                   ((juxt ex-message ex-data) (error-of (:outcome no-graph-id))))))
          done)))

(deftest list-remote-graphs-fetches-the-graph-list-test
  (async done
         (let [calls* (atom [])]
           (finish
            (p/let [graphs (p/with-redefs [sync-auth/http-base-url (fn [_config] "https://sync.example.test")
                                           sync-util/require-auth-token! (fn [context] (swap! calls* conj [:require-auth context]))
                                           sync-util/fetch-json (fn [url request opts]
                                                                  (swap! calls* conj [:fetch url request opts])
                                                                  (p/resolved {:graphs [{:graph-name "a"} {:graph-name "b"}]}))]
                             (sync-upload/list-remote-graphs!))
                    empty-graphs (p/with-redefs [sync-auth/http-base-url (fn [_config] "https://sync.example.test")
                                                 sync-util/require-auth-token! (fn [_context] nil)
                                                 sync-util/fetch-json (fn [_url _request _opts] (p/resolved {}))]
                                   (sync-upload/list-remote-graphs!))
                    no-base-graphs (p/with-redefs [sync-auth/http-base-url (fn [_config] "")
                                                   sync-util/fetch-json (fn [& _] (throw (ex-info "must not fetch" {})))]
                                     (sync-upload/list-remote-graphs!))]
              (is (= [{:graph-name "a"} {:graph-name "b"}] graphs))
              (is (vector? graphs))
              (is (= [[:require-auth {:op :list-remote-graphs}]
                      [:fetch "https://sync.example.test/graphs" {:method "GET"} {:response-schema :graphs/list}]]
                     @calls*))
              (is (= [] empty-graphs))
              (is (= [] no-base-graphs)))
            done))))

(deftest fail-upload-graph-already-exists-carries-its-context-test
  (let [error (try (#'sync-upload/fail-upload-graph-already-exists!
                    "repo-1" {:graph-id "g1" :graph-name "my-graph"})
                   nil
                   (catch :default e e))]
    (is (= {:code :db-sync/graph-already-exists
            :repo "repo-1"
            :graph-id "g1"
            :graph-name "my-graph"}
           (ex-data error)))))

(deftest create-remote-graph-strips-the-db-version-prefix-before-matching-test
  (async done
         (finish
          (p/let [prefixed (<outcome
                            #(p/with-redefs [sync-upload/list-remote-graphs! (fn [] (p/resolved [{:graph-name "my-graph"}]))]
                               (sync-upload/create-remote-graph! "logseq_db_my-graph" {})))
                  unnamed (<outcome #(sync-upload/create-remote-graph! "" {}))]
            (is (= :db-sync/graph-already-exists (:code (ex-data (error-of prefixed)))))
            (is (= "my-graph" (:graph-name (ex-data (error-of prefixed)))))
            (is (= ["missing-field" {:repo "" :field :graph-name}]
                   ((juxt ex-message ex-data) (error-of unnamed)))))
          done)))

(deftest create-remote-graph-fails-on-several-matching-graphs-test
  (async done
         (finish
          (p/let [ambiguous (<outcome
                             #(p/with-redefs [sync-upload/list-remote-graphs! (fn [] (p/resolved [{:graph-name "repo-1"}
                                                                                                  {:graph-name "repo-1"}]))]
                                (sync-upload/create-remote-graph! "repo-1" {})))]
            (is (= ["ambiguous-graph-match" {:repo "repo-1" :graph-name "repo-1" :match-count 2}]
                   ((juxt ex-message ex-data) (error-of ambiguous)))))
          done)))

;; ------------------------------------------------------------- upload-graph!

(defn- <run-upload-graph!
  "Runs upload-graph! with every edge redefined; resolves to
  {:outcome .. :calls .. :printed ..}."
  [{:keys [base e2ee? aes-key conn total-rows batches]
    :or {base "https://sync.example.test"}
    :as opts}]
  (let [conn (if (contains? opts :conn) conn (atom {:max-tx 99}))
        calls* (atom [])
        batches* (atom batches)
        printed* (atom "")
        record! (fn [& entry] (swap! calls* conj (vec entry)))
        original-print-fn *print-fn*]
    (set! *print-fn* (fn [s] (swap! printed* str s)))
    (-> (p/with-redefs [sync-upload/http-base-url (fn [] base)
                        worker-state/get-datascript-conn (fn [_repo] conn)
                        sync-crypt/graph-e2ee? (fn [_repo] e2ee?)
                        sync-upload/create-remote-graph! (fn [repo opts]
                                                           (record! :create-remote-graph repo opts)
                                                           (p/resolved {:graph-id "graph-1"}))
                        sync-crypt/<ensure-graph-aes-key (fn [repo graph-id]
                                                           (record! :ensure-aes-key repo graph-id)
                                                           (p/resolved aes-key))
                        sync-checksum/recompute-checksum (fn [_db] "chk")
                        client-op/update-local-checksum (fn [repo checksum max-tx]
                                                          (record! :update-local-checksum repo checksum max-tx))
                        worker-util/post-message (fn [kind payload] (record! :post-message kind payload))
                        sync-upload/<prepare-upload-temp-sqlite! (fn [repo graph-id _conn key _update-progress]
                                                                   (record! :prepare repo graph-id key)
                                                                   (p/resolved {:db :temp-db}))
                        sync-upload/count-kvs-rows (fn [db] (record! :count db) total-rows)
                        sync-upload/fetch-kvs-rows (fn [db last-addr limit]
                                                     (record! :fetch-kvs db last-addr limit)
                                                     (let [batch (first @batches*)]
                                                       (swap! batches* rest)
                                                       (or batch #js [])))
                        sync-upload/<snapshot-upload-body (fn [rows] (p/resolved {:body rows :encoding nil}))
                        sync-util/fetch-json (fn [url request opts]
                                               (record! :fetch-json url request opts)
                                               (p/resolved {}))
                        sync-apply/clear-pending-txs! (fn [repo] (record! :clear-pending-txs repo))
                        client-op/reset-local-tx (fn [repo] (record! :reset-local-tx repo))
                        client-op/add-all-exists-asset-as-ops (fn [repo] (record! :add-asset-ops repo))
                        sync-temp-sqlite/cleanup-temp-sqlite! (fn [temp] (record! :cleanup temp))]
          (<outcome #(sync-upload/upload-graph! "repo-1")))
        (p/then (fn [outcome] {:outcome outcome :calls @calls* :printed @printed*}))
        (p/finally (fn [] (set! *print-fn* original-print-fn))))))

(def ^:private upload-rows-1 #js [#js [1 "a" "[]"] #js [2 "b" "[]"]])
(def ^:private upload-rows-2 #js [#js [5 "c" "[]"]])

(defn- progress [payload]
  [:post-message :rtc-log (merge {:type :rtc.log/upload} payload)])

(deftest upload-graph-uploads-the-temp-db-in-batches-test
  (async done
         (finish
          (p/let [{:keys [outcome calls printed]}
                  (<run-upload-graph! {:e2ee? false :total-rows 3 :batches [upload-rows-1 upload-rows-2]})
                  rows-1 [[1 "a" "[]"] [2 "b" "[]"]]
                  rows-2 [[5 "c" "[]"]]
                  payload-bytes (#'sync-upload/snapshot-rows-byte-length rows-1)]
            (is (= {:graph-id "graph-1"} outcome))
            (is (= [[:create-remote-graph "repo-1" {:graph-e2ee? false :graph-ready-for-use? false}]
                    [:update-local-checksum "repo-1" "chk" 99]
                    (progress {:sub-type :upload-progress :message "Preparing..."})
                    [:prepare "repo-1" "graph-1" nil]
                    [:count :temp-db]
                    [:fetch-kvs :temp-db -1 500]
                    [:fetch-json (str upload-url-prefix "?reset=true&finished=false")
                     {:method "POST" :headers {"content-type" "application/transit+json"} :body rows-1}
                     {:response-schema :sync/snapshot-upload}]
                    (progress {:sub-type :upload-progress :message "Uploading 2/3"})
                    [:fetch-kvs :temp-db 2 500]
                    [:fetch-json (str upload-url-prefix "?reset=false&finished=true&checksum=chk")
                     {:method "POST" :headers {"content-type" "application/transit+json"} :body rows-2}
                     {:response-schema :sync/snapshot-upload}]
                    (progress {:sub-type :upload-progress :message "Uploading 3/3"})
                    [:fetch-kvs :temp-db 5 500]
                    [:clear-pending-txs "repo-1"]
                    [:reset-local-tx "repo-1"]
                    [:add-asset-ops "repo-1"]
                    (progress {:sub-type :upload-completed :message "Graph upload finished!"})
                    [:cleanup {:db :temp-db}]]
                   calls))
            (is (string/starts-with?
                 printed
                 (pr-str :db-sync/upload-kvs-batch
                         {:total-kvs-rows 3
                          :fetched-kvs-rows 2
                          :upload-kvs-batch-size 500
                          :split-batch-count 1
                          :split-batches [{:rows 2 :payload-bytes payload-bytes}]
                          :max-request-bytes 1000000}))))
          done)))

(deftest upload-graph-with-e2ee-fetches-the-graph-aes-key-test
  (async done
         (finish
          (p/let [{:keys [outcome calls]}
                  (<run-upload-graph! {:e2ee? true :aes-key "aes" :total-rows 1 :batches [upload-rows-2]})]
            (is (= {:graph-id "graph-1"} outcome))
            (is (= [[:create-remote-graph "repo-1" {:graph-e2ee? true :graph-ready-for-use? false}]
                    [:ensure-aes-key "repo-1" "graph-1"]
                    [:update-local-checksum "repo-1" "chk" 99]
                    (progress {:sub-type :upload-progress :message "Encrypting..."})
                    [:prepare "repo-1" "graph-1" "aes"]]
                   (take 5 calls))))
          done)))

(deftest upload-graph-fails-fast-without-an-aes-key-test
  (async done
         (finish
          (p/let [{:keys [outcome calls]}
                  (<run-upload-graph! {:e2ee? true :aes-key nil :total-rows 1 :batches [upload-rows-2]})]
            (is (= ["missing-field" {:repo "repo-1" :field :aes-key}]
                   ((juxt ex-message ex-data) (error-of outcome))))
            (is (not-any? #(= :prepare (first %)) calls)))
          done)))

(deftest upload-graph-rejects-a-missing-base-and-a-missing-conn-test
  (async done
         (finish
          (p/let [{no-base :outcome} (<run-upload-graph! {:base "" :e2ee? false})
                  {no-conn :outcome} (<run-upload-graph! {:conn nil :e2ee? false})]
            (is (= ["db-sync missing base" {:repo "repo-1" :base ""}]
                   ((juxt ex-message ex-data) (error-of no-base))))
            (is (= ["db-sync missing datascript conn" {:repo "repo-1"}]
                   ((juxt ex-message ex-data) (error-of no-conn)))))
          done)))

;; --------------------------------------------- <prepare-upload-temp-sqlite!

(defn- <prepare!
  "Runs <prepare-upload-temp-sqlite! over the given [e a v] triples; resolves to
  {:datoms .. :tx-metas .. :progress .. :printed ..} of the temp conn."
  [triples aes-key]
  (let [source-conn (d/create-conn {})
        temp-conn (d/create-conn {})
        tx-metas* (atom [])
        progress* (atom [])
        printed* (atom "")
        original-print-fn *print-fn*]
    (d/transact! source-conn (mapv (fn [[e a v]] [:db/add e a v]) triples))
    (d/listen! temp-conn (fn [report] (swap! tx-metas* conj (:tx-meta report))))
    (set! *print-fn* (fn [s] (swap! printed* str s)))
    (-> (p/with-redefs [sync-temp-sqlite/<create-temp-sqlite-conn (fn [_schema _datoms] (p/resolved {:conn temp-conn}))
                        sync-apply/upload-large-title! (fn [_repo _graph-id _title _aes-key]
                                                         (p/resolved {:asset-uuid "new-asset" :asset-type "txt"}))
                        sync-crypt/<encrypt-datoms (fn [_aes-key datoms]
                                                     (p/resolved (mapv (fn [datom] {:e (:e datom) :a (:a datom) :v (str "enc:" (:v datom))})
                                                                       datoms)))
                        sync-upload/upload-prepare-datoms-batch-size 2]
          (sync-upload/<prepare-upload-temp-sqlite!
           "repo" "graph-1" source-conn aes-key
           (fn [payload] (swap! progress* conj payload))))
        (p/then (fn [_]
                  {:datoms (set (map (juxt :e :a :v) (d/datoms @temp-conn :eavt)))
                   :tx-metas @tx-metas*
                   :progress-payloads @progress*
                   :printed @printed*}))
        (p/finally (fn [] (set! *print-fn* original-print-fn))))))

(def ^:private large-title-attr :logseq.property.sync/large-title-object)

(deftest prepare-upload-temp-sqlite-offloads-large-titles-in-batches-test
  (async done
         (let [big-title (apply str (repeat 4097 "x"))
               stale-object {:asset-uuid "old-asset" :asset-type "txt"}
               kept-object {:asset-uuid "kept-asset" :asset-type "txt"}]
           (finish
            (p/let [{:keys [datoms tx-metas progress-payloads printed]}
                    (<prepare! [[1 :block/title "small"]
                                [2 :block/title big-title]
                                [2 large-title-attr stale-object]
                                [4 :block/title "other"]
                                [4 large-title-attr kept-object]]
                               nil)]
              (is (= #{[1 :block/title "small"]
                       [2 :block/title ""]
                       [2 large-title-attr {:asset-uuid "new-asset" :asset-type "txt"}]
                       [4 :block/title "other"]
                       [4 large-title-attr kept-object]}
                     datoms))
              (is (= [{:initial-db? true} {:initial-db? true} {:initial-db? true}] tx-metas))
              (is (= [{:sub-type :upload-progress :message "Preparing 2/5"}
                      {:sub-type :upload-progress :message "Preparing 4/5"}
                      {:sub-type :upload-progress :message "Preparing 5/5"}]
                     progress-payloads))
              (is (= "" printed)))
            done))))

(deftest prepare-upload-temp-sqlite-encrypts-datoms-with-the-aes-key-test
  (async done
         (finish
          (p/let [{:keys [datoms progress-payloads]}
                  (<prepare! [[1 :block/title "small"]
                              [2 :block/title "other"]]
                             "aes")]
            (is (= #{[1 :block/title "enc:small"] [2 :block/title "enc:other"]} datoms))
            (is (= [{:sub-type :upload-progress :message "Encrypting 2/2"}] progress-payloads)))
          done)))

(deftest prepare-upload-temp-sqlite-logs-and-skips-oversized-datoms-test
  (async done
         (finish
          (p/let [{:keys [datoms printed]}
                  (p/with-redefs [sync-upload/datom-value-byte-length (fn [value] (if (= "huge" value) 1500000 10))]
                    (<prepare! [[1 :logseq.property.tldraw/page "huge"]
                                [2 :block/title "other"]]
                               nil))]
            (is (= #{[2 :block/title "other"]} datoms))
            (is (= (string/trim
                    (pr-str :db-sync/drop-oversized-upload-datoms
                            {:repo "repo"
                             :count 1
                             :attrs [:logseq.property.tldraw/page]
                             :max-bytes 1500000}))
                   (string/trim printed))))
          done)))
