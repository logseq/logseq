(ns frontend.worker.db-worker-node-test
  (:require ["http" :as http]
            [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [frontend.test.node-helper :as node-helper]
            [frontend.worker.db-worker-node :as db-worker-node]
            [logseq.db :as ldb]
            [logseq.db.sqlite.util :as sqlite-util]
            [promesa.core :as p]))

(defn- http-request
  [opts body]
  (p/create
   (fn [resolve reject]
     (let [req (.request http (clj->js opts)
                         (fn [^js res]
                           (let [chunks (array)]
                             (.on res "data" (fn [chunk] (.push chunks chunk)))
                             (.on res "end" (fn []
                                              (resolve {:status (.-statusCode res)
                                                        :body (.toString (js/Buffer.concat chunks) "utf8")}))))))
           finish! (fn []
                     (when body (.write req body))
                     (.end req))]
       (.on req "error" reject)
       (finish!)))))

(defn- http-get
  [host port path]
  (http-request {:hostname host
                 :port port
                 :path path
                 :method "GET"}
                nil))

(defn- invoke
  [host port method args]
  (let [payload (js/JSON.stringify
                 (clj->js {:method method
                           :directPass false
                           :argsTransit (ldb/write-transit-str args)}))]
    (p/let [{:keys [status body]}
            (http-request {:hostname host
                           :port port
                           :path "/v1/invoke"
                           :method "POST"
                           :headers {"Content-Type" "application/json"}}
                          payload)
            parsed (js->clj (js/JSON.parse body) :keywordize-keys true)]
      (when (not= 200 status)
        (println "[db-worker-node-test] invoke failed"
                 {:method method
                  :status status
                  :body body}))
      (is (= 200 status))
      (is (:ok parsed))
      (ldb/read-transit-str (:resultTransit parsed)))))

(deftest db-worker-node-daemon-smoke-test
  (async done
    (let [daemon (atom nil)
          data-dir (node-helper/create-tmp-dir "db-worker-daemon")
          repo (str "logseq_db_smoke_" (subs (str (random-uuid)) 0 8))
          now (js/Date.now)
          page-uuid (random-uuid)
          block-uuid (random-uuid)]
      (-> (p/let [{:keys [host port stop!]}
                  (db-worker-node/start-daemon!
                   {:host "127.0.0.1"
                    :port 0
                    :data-dir data-dir})
                  health (http-get host port "/healthz")
                  ready (http-get host port "/readyz")
                  _ (do
                      (reset! daemon {:host host :port port :stop! stop!})
                      (println "[db-worker-node-test] daemon started" {:host host :port port})
                      (println "[db-worker-node-test] /healthz" health)
                      (is (= 200 (:status health)))
                      (println "[db-worker-node-test] /readyz" ready)
                      (is (= 200 (:status ready)))
                      (println "[db-worker-node-test] repo" repo))
                  _ (invoke host port "thread-api/create-or-open-db" [repo {}])
                  dbs (invoke host port "thread-api/list-db" [])
                  _ (do
                      (println "[db-worker-node-test] list-db" dbs)
                      (let [prefix sqlite-util/db-version-prefix
                            expected-name (if (string/starts-with? repo prefix)
                                            (subs repo (count prefix))
                                            repo)]
                        (is (some #(= expected-name (:name %)) dbs))))
                  _ (invoke host port "thread-api/transact"
                            [repo
                             [{:block/uuid page-uuid
                               :block/title "Smoke Page"
                               :block/name "smoke-page"
                               :block/tags #{:logseq.class/Page}
                               :block/created-at now
                               :block/updated-at now}
                              {:block/uuid block-uuid
                               :block/title "Smoke Test"
                               :block/page [:block/uuid page-uuid]
                               :block/parent [:block/uuid page-uuid]
                               :block/order "a0"
                               :block/created-at now
                               :block/updated-at now}]
                             {}
                             nil])
                  result (invoke host port "thread-api/q"
                                 [repo
                                  ['[:find ?e
                                     :in $ ?uuid
                                     :where [?e :block/uuid ?uuid]]
                                   block-uuid]])]
            (println "[db-worker-node-test] q result" result)
            (is (seq result)))
          (p/catch (fn [e]
                     (println "[db-worker-node-test] e:" e)
                     (is false (str e))))
          (p/finally (fn []
                       (if-let [stop! (:stop! @daemon)]
                         (-> (stop!)
                             (p/finally (fn [] (done))))
                         (done))))))))
