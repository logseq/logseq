(require '[babashka.curl :as curl]
         '[cheshire.core :as json]
         '[cognitect.transit :as transit]
         '[clojure.pprint :as pprint]
         '[clojure.string :as string])

(def base-url (or (System/getenv "DB_WORKER_URL") "http://127.0.0.1:9101"))

(defn write-transit [v]
  (let [out (java.io.ByteArrayOutputStream.)
        w (transit/writer out :json)]
    (transit/write w v)
    (.toString out "UTF-8")))

(defn read-transit [s]
  (let [in (java.io.ByteArrayInputStream. (.getBytes s "UTF-8"))
        r (transit/reader in :json)]
    (transit/read r)))

(defn invoke [method direct-pass? args]
  (let [payload (if direct-pass?
                  {:method method :directPass true :args args}
                  {:method method :directPass false :argsTransit (write-transit args)})
        resp (curl/post (str base-url "/v1/invoke")
                        {:headers {"Content-Type" "application/json"}
                         :body (json/generate-string payload)})
        body (json/parse-string (:body resp) true)]
    (if (<= 200 (:status resp) 299)
      (if direct-pass?
        (:result body)
        (read-transit (:resultTransit body)))
      (throw (ex-info "db-worker invoke failed" {:status (:status resp) :body (:body resp)})))))

(def suffix (subs (str (random-uuid)) 0 8))
(def repo (str "logseq_db_smoke_" suffix))
(def page-uuid (random-uuid))
(def block-uuid (random-uuid))
(def now (long (System/currentTimeMillis)))

(println "== db-worker-node smoke test ==")
(println "Base URL:" base-url)
(println "Repo:" repo)
(println "Step 1/4: list-db (before)")
(println "Result:" (json/generate-string (invoke "thread-api/list-db" false [])
                                         {:pretty true}))

(println "Step 2/4: create-or-open-db")
(invoke "thread-api/create-or-open-db" false [repo {}])
(println "Step 3/4: list-db (after)")
(println "Result:" (json/generate-string (invoke "thread-api/list-db" false [])
                                         {:pretty true}))

(println "Step 4/4: transact + q")
(invoke "thread-api/transact" false
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

(let [query '[:find ?e
              :in $ ?uuid
              :where [?e :block/uuid ?uuid]]
      result (invoke "thread-api/q" false [repo [query block-uuid]])]
  (println "Query result:" result)
  (when (empty? result)
    (throw (ex-info "Query returned no results" {:uuid block-uuid}))))

(let [page-query '[:find (pull ?e [:db/id :block/uuid :block/title :block/name :block/tags])
                   :in $ ?uuid
                   :where [?e :block/uuid ?uuid]]
      blocks-query '[:find (pull ?e [:db/id :block/uuid :block/title :block/order :block/parent])
                     :in $ ?page-uuid
                     :where [?page :block/uuid ?page-uuid]
                            [?e :block/page ?page]]
      page-result (invoke "thread-api/q" false [repo [page-query page-uuid]])
      blocks-result (invoke "thread-api/q" false [repo [blocks-query page-uuid]])]
  (println "Page + blocks (pretty):")
  (pprint/pprint {:page page-result
                  :blocks blocks-result}))

(println "Smoke test OK")
