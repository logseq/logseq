(ns frontend.worker.db-core-test
  (:require [cljs.test :refer [async deftest is]]
            [datascript.core :as d]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.db-core :as db-core]
            [frontend.worker.platform :as platform]
            [frontend.worker.search :as search]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.download :as sync-download]
            [goog.object :as gobj]
            [logseq.db.frontend.schema :as db-schema]
            [promesa.core :as p]
            [shadow.resource :as rc]))

(def ^:private test-repo "db-core-test-repo")

(defn- build-test-platform
  ([]
   (build-test-platform {}))
  ([{:keys [post-message! remove-vfs! runtime import-db]
     :or {post-message! (fn [& _] nil)
          remove-vfs! (fn [_] nil)
          runtime :browser}}]
   {:env {:publishing? false
          :runtime runtime}
    :storage {:install-opfs-pool (fn [_sqlite _pool-name]
                                   (p/resolved #js {:pauseVfs (fn [] nil)
                                                    :unpauseVfs (fn [] nil)}))
              :list-graphs (fn [] (p/resolved []))
              :db-exists? (fn [_] (p/resolved false))
              :resolve-db-path (fn [_repo _pool path] path)
              :export-file (fn [_pool _path] (p/resolved (js/Uint8Array. 0)))
              :import-db (or import-db (fn [_pool _path _data] (p/resolved nil)))
              :remove-vfs! remove-vfs!
              :read-text! (fn [_path] (p/resolved ""))
              :write-text! (fn [_path _text] (p/resolved nil))
              :transfer (fn [data _transferables] data)}
    :kv {:get (fn [_] nil)
         :set! (fn [_ _] nil)}
    :broadcast {:post-message! post-message!}
    :websocket {:connect (fn [_] #js {})}
    :sqlite {:init! (fn [] nil)
             :open-db (fn [_opts] #js {})
             :close-db (fn [db] (.close db))
             :exec (fn [db sql-or-opts] (.exec db sql-or-opts))
             :transaction (fn [db f] (.transaction db f))}
    :crypto {}
    :timers {:set-interval! (fn [_ _] nil)}}))

(defn- restoring-worker-state
  [f]
  (let [state-prev @worker-state/*state
        config-prev @worker-state/*db-sync-config
        sqlite-prev @worker-state/*sqlite
        sqlite-conns-prev @worker-state/*sqlite-conns
        datascript-prev @worker-state/*datascript-conns
        client-ops-prev @worker-state/*client-ops-conns
        opfs-prev @worker-state/*opfs-pools
        main-thread-prev @worker-state/*main-thread
        platform-prev @@#'platform/*platform
        search-build-prev @(deref #'db-core/*search-index-build-ids)
        cleanup (fn []
                  (reset! worker-state/*state state-prev)
                  (reset! worker-state/*db-sync-config config-prev)
                  (reset! worker-state/*sqlite sqlite-prev)
                  (reset! worker-state/*sqlite-conns sqlite-conns-prev)
                  (reset! worker-state/*datascript-conns datascript-prev)
                  (reset! worker-state/*client-ops-conns client-ops-prev)
                  (reset! worker-state/*opfs-pools opfs-prev)
                  (reset! worker-state/*main-thread main-thread-prev)
                  (reset! (deref #'db-core/*search-index-build-ids) search-build-prev)
                  (reset! @#'platform/*platform platform-prev))]
    (platform/set-platform! (build-test-platform))
    (reset! worker-state/*sqlite #js {})
    (reset! worker-state/*sqlite-conns {})
    (reset! worker-state/*datascript-conns {})
    (reset! worker-state/*client-ops-conns {})
    (reset! worker-state/*opfs-pools {})
    (reset! worker-state/*main-thread nil)
    (reset! (deref #'db-core/*search-index-build-ids) {})
    (let [result (f)]
      (if (p/promise? result)
        (p/finally result cleanup)
        (do
          (cleanup)
          result)))))

(defn- fake-db
  ([]
   (fake-db {}))
  ([{:keys [user-version sql-calls close-calls close-label]
     :or {user-version 0}}]
   #js {:exec (fn [sql-or-opts]
                (let [sql (if (string? sql-or-opts)
                            sql-or-opts
                            (gobj/get sql-or-opts "sql"))]
                  (when sql-calls
                    (swap! sql-calls conj sql))
                  (if (= sql "PRAGMA user_version")
                    #js [#js [user-version]]
                    #js [])))
        :close (fn []
                 (when close-calls
                   (swap! close-calls conj close-label)))}))

(deftest db-core-registers-db-sync-thread-apis
  (let [api-map @thread-api/*thread-apis]
    (is (contains? api-map :thread-api/set-db-sync-config))
    (is (contains? api-map :thread-api/db-sync-start))
    (is (contains? api-map :thread-api/db-sync-stop))
    (is (contains? api-map :thread-api/db-sync-update-presence))
    (is (contains? api-map :thread-api/db-sync-request-asset-download))
    (is (contains? api-map :thread-api/db-sync-grant-graph-access))
    (is (contains? api-map :thread-api/db-sync-ensure-user-rsa-keys))
    (is (contains? api-map :thread-api/db-sync-upload-graph))))

(deftest resolve-initial-config-falls-back-to-template-config-test
  (let [resolve-initial-config #'db-core/resolve-initial-config
        template-config (rc/inline "templates/config.edn")]
    (is (= template-config (resolve-initial-config nil)))
    (is (= "" (resolve-initial-config "")))
    (is (= "{:foo true}" (resolve-initial-config "{:foo true}")))))

(deftest import-db-base64-uses-active-pool-after-close-db
  (async done
    (->
     (restoring-worker-state
      (fn []
        (let [import-db! (get @thread-api/*thread-apis :thread-api/import-db-base64)
              imported-pool-ids (atom [])
              pool-seq (atom 0)
              make-pool (fn [id]
                          (let [pool #js {:id id
                                          :paused false}]
                            (set! (.-pauseVfs pool) (fn [] (set! (.-paused pool) true)))
                            (set! (.-unpauseVfs pool) (fn [] (set! (.-paused pool) false)))
                            pool))
              existing-pool (make-pool "existing-pool")
              sqlite-data (.encode (js/TextEncoder.) "SQLite format 3")
              sqlite-base64 (.toString (js/Buffer.from sqlite-data) "base64")]
          (reset! worker-state/*opfs-pools {test-repo existing-pool})
          (let [platform' (build-test-platform
                           {:import-db (fn [pool _path _data]
                                         (swap! imported-pool-ids conj (.-id pool))
                                         (if (.-paused pool)
                                           (p/rejected (js/Error. "No available handles to import to."))
                                           (p/resolved nil)))})]
            (platform/set-platform!
             (assoc platform'
                    :storage
                    (assoc (:storage platform')
                           :install-opfs-pool (fn [_sqlite _pool-name]
                                                (let [id (str "new-pool-" (swap! pool-seq inc))]
                                                  (p/resolved (make-pool id))))))))
          (-> (import-db! test-repo sqlite-base64)
              (p/then (fn [_]
                        (is (= ["new-pool-1"] @imported-pool-ids))))
              (p/catch (fn [error]
                         (is false (str "expected import to succeed with active pool, got " error))))))))
     (p/finally done))))

(deftest set-db-sync-config-keeps-only-non-auth-fields-test
  (let [set-config! (get @thread-api/*thread-apis :thread-api/set-db-sync-config)
        get-config (get @thread-api/*thread-apis :thread-api/get-db-sync-config)
        state-prev @worker-state/*state
        config-prev @worker-state/*db-sync-config]
    (try
      (reset! worker-state/*state (assoc state-prev
                                         :auth/id-token "existing-id-token"
                                         :auth/oauth-token-url "https://existing.example.com/oauth2/token"
                                         :auth/oauth-domain "existing.example.com"
                                         :auth/oauth-client-id "existing-client-id"))
      (set-config! {:ws-url "wss://example.com/sync/%s"
                    :http-base "https://example.com"
                    :enabled? true
                    :auth-token "id-token-from-config"
                    :oauth-token-url "https://auth.example.com/oauth2/token"
                    :oauth-domain "auth.example.com"
                    :oauth-client-id "worker-client-id"})
      (is (= {:ws-url "wss://example.com/sync/%s"
              :http-base "https://example.com"
              :enabled? true}
             @worker-state/*db-sync-config))
      (is (= {:ws-url "wss://example.com/sync/%s"
              :http-base "https://example.com"
              :enabled? true}
             (get-config)))
      (is (= "existing-id-token" (:auth/id-token @worker-state/*state)))
      (is (= "https://existing.example.com/oauth2/token"
             (:auth/oauth-token-url @worker-state/*state)))
      (is (= "existing.example.com" (:auth/oauth-domain @worker-state/*state)))
      (is (= "existing-client-id" (:auth/oauth-client-id @worker-state/*state)))
      (finally
        (reset! worker-state/*state state-prev)
        (reset! worker-state/*db-sync-config config-prev)))))

(deftest get-db-sync-config-strips-auth-fields-test
  (let [get-config (get @thread-api/*thread-apis :thread-api/get-db-sync-config)
        config-prev @worker-state/*db-sync-config]
    (try
      (reset! worker-state/*db-sync-config {:ws-url "wss://example.com/sync/%s"
                                            :auth-token "leaked-token"
                                            :oauth-client-id "leaked-client"})
      (is (= {:ws-url "wss://example.com/sync/%s"}
             (get-config)))
      (finally
        (reset! worker-state/*db-sync-config config-prev)))))

(deftest init-service-does-not-close-db-when-graph-unchanged
  (async done
         (let [service {:status {:ready (p/resolved true)}
                        :proxy #js {}}
               close-calls (atom [])
               create-calls (atom 0)
               *service @#'db-core/*service
               old-service @*service]
           (reset! *service ["graph-a" service])
           (with-redefs [db-core/close-db! (fn [repo]
                                             (swap! close-calls conj repo)
                                             nil)
                         shared-service/<create-service (fn [& _]
                                                          (swap! create-calls inc)
                                                          (p/resolved service))]
             (-> (#'db-core/<init-service! "graph-a" {})
                 (p/then (fn [result]
                           (is (= service result))
                           (is (= [] @close-calls))
                           (is (zero? @create-calls))))
                 (p/catch (fn [e]
                            (is false (str "unexpected error: " e))))
                 (p/finally (fn []
                              (reset! *service old-service)
                              (done))))))))

(deftest search-build-blocks-indice-in-worker-reports-progress-to-main-thread-test
  (async done
    (->
     (restoring-worker-state
      (fn []
        (let [build-index! (get @thread-api/*thread-apis :thread-api/search-build-blocks-indice-in-worker)
              conn (d/create-conn db-schema/schema)
              search-db (fake-db)
              progress-calls (atom [])
              idle-status-atom (:thread-atom/search-input-idle-status @worker-state/*state)]
          (d/transact! conn [{:block/uuid (random-uuid)}])
          (reset! worker-state/*sqlite-conns {test-repo {:search search-db}})
          (reset! worker-state/*datascript-conns {test-repo conn})
          (reset! idle-status-atom {test-repo {:idle? true
                                               :ts (.now js/Date)}})
          (reset! worker-state/*main-thread
                  (fn [qkw & args]
                    (when (= qkw :thread-api/search-index-build-progress)
                      (let [[repo payload] args]
                        (swap! progress-calls conj {:qkw qkw
                                                    :repo repo
                                                    :payload payload})))
                    (p/resolved nil)))
          (with-redefs [search/truncate-table! (fn [_db] nil)
                        search/upsert-blocks! (fn [_db _blocks] nil)
                        search/hidden-entity? (constantly false)
                        search/block->index (fn [_entity]
                                              {:id "block-1"
                                               :page "page-1"
                                               :title "Hello"})]
            (-> (p/let [_ (build-index! test-repo true)
                        _ (p/loop [remaining 20]
                            (if (or (seq @progress-calls)
                                    (zero? remaining))
                              nil
                              (p/let [_ (p/delay 5)]
                                (p/recur (dec remaining)))))]
                  (let [statuses (map (comp :status :payload) @progress-calls)
                        completed (some #(when (= :completed (get-in % [:payload :status]))
                                           %)
                                        @progress-calls)]
                    (is (= test-repo (:repo (first @progress-calls))))
                    (is (= :running (first statuses)))
                    (is (some #{:completed} statuses))
                    (is (= :idle (last statuses)))
                    (is (= 1 (get-in completed [:payload :processed])))
                    (is (= 1 (get-in completed [:payload :total])))))
                (p/catch (fn [error]
                           (is false (str error)))))))))
     (p/finally done))))

(deftest release-access-handles-clears-active-import-state-test
  (restoring-worker-state
   (fn []
     (let [release-access-handles! (get @thread-api/*thread-apis :thread-api/release-access-handles)
           *import-state @#'sync-download/*import-state
           import-state-prev @*import-state
           closed (atom [])
           removed-pools (atom [])
           pause-calls (atom 0)]
       (try
         (platform/set-platform! (build-test-platform {:remove-vfs! (fn [pool]
                                                                      (swap! removed-pools conj pool)
                                                                      (p/resolved nil))}))
         (reset! worker-state/*opfs-pools {test-repo #js {:pauseVfs (fn [] (swap! pause-calls inc))}})
         (reset! *import-state {:repo test-repo
                                :graph-id "graph-1"
                                :import-id "import-1"
                                :rows-db #js {:close (fn [] (swap! closed conj :rows-db))}
                                :rows-pool :rows-pool})

         (release-access-handles! test-repo)

         (is (nil? @*import-state))
         (is (= [:rows-db] @closed))
         (is (= [:rows-pool] @removed-pools))
         (is (= 1 @pause-calls))
         (finally
           (reset! *import-state import-state-prev)))))))

(deftest close-db-clears-active-import-state-test
  (restoring-worker-state
   (fn []
     (let [*import-state @#'sync-download/*import-state
           import-state-prev @*import-state
           closed (atom [])
           removed-pools (atom [])
           pause-calls (atom 0)]
       (try
         (platform/set-platform! (build-test-platform {:remove-vfs! (fn [pool]
                                                                      (swap! removed-pools conj pool)
                                                                      (p/resolved nil))}))
         (reset! worker-state/*sqlite-conns
                 {test-repo {:db (fake-db {:close-calls closed :close-label :db})
                             :search (fake-db {:close-calls closed :close-label :search})
                             :client-ops (fake-db {:close-calls closed :close-label :client-ops})}})
         (reset! worker-state/*datascript-conns {test-repo :datascript})
         (reset! worker-state/*client-ops-conns {test-repo :client-ops})
         (reset! worker-state/*opfs-pools {test-repo #js {:pauseVfs (fn [] (swap! pause-calls inc))}})
         (reset! *import-state {:repo test-repo
                                :graph-id "graph-1"
                                :import-id "import-1"
                                :rows-db #js {:close (fn [] (swap! closed conj :rows-db))}
                                :rows-pool :rows-pool})

         (db-core/close-db! test-repo)

         (is (nil? @*import-state))
         (is (= #{:rows-db :db :search :client-ops} (set @closed)))
         (is (= [:rows-pool] @removed-pools))
         (is (= 1 @pause-calls))
         (finally
           (reset! *import-state import-state-prev)))))))
