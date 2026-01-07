(ns frontend.test.helper
  "Common helper fns for tests"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.background-tasks]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.conn :as conn]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.test.repo :as file-repo-handler]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.pipeline :as worker-pipeline]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.test.helper :as db-test]))

(def bare-marker-pattern
  #"(NOW|LATER|TODO|DOING|DONE|WAITING|WAIT|CANCELED|CANCELLED|IN-PROGRESS){1}\s+")

(def node? (exists? js/process))

(def test-db-name "test-db")
(def test-db-name-db-version "logseq_db_test-db")
(def test-db
  (if (and node? (some? js/process.env.DB_GRAPH)) test-db-name-db-version test-db-name))

(defn start-test-db!
  [& {:as opts}]
  (let [db-graph? (or (:db-graph? opts) (and node? (some? js/process.env.DB_GRAPH)))
        test-db' (if db-graph? test-db-name-db-version test-db-name)]
    (state/set-current-repo! test-db')
    (conn/start! test-db' opts)
    (ldb/register-transact-pipeline-fn!
     (fn [tx-report]
       (worker-pipeline/transact-pipeline test-db' tx-report)))
    (let [conn (conn/get-db test-db' false)]
      (when db-graph?
        (d/transact! conn (sqlite-create-graph/build-db-initial-data "")))
      (d/listen! conn ::listen-db-changes!
                 (fn [tx-report]
                   (worker-pipeline/invoke-hooks conn tx-report {}))))))

(defn destroy-test-db!
  []
  (conn/destroy-all!))

(def file-to-db-statuses
  {"TODO" :logseq.property/status.todo
   "LATER" :logseq.property/status.todo
   "IN-PROGRESS" :logseq.property/status.doing
   "NOW" :logseq.property/status.doing
   "DOING" :logseq.property/status.doing
   "DONE" :logseq.property/status.done
   "WAIT" :logseq.property/status.backlog
   "WAITING" :logseq.property/status.backlog
   "CANCELED" :logseq.property/status.canceled
   "CANCELLED" :logseq.property/status.canceled})

(defn- build-test-block
  [block]
  (if-let [status (some->> (:build.test/title block)
                           (re-find bare-marker-pattern)
                           second
                           file-to-db-statuses)]
    (-> {:block/title
         (string/replace-first (:build.test/title block) bare-marker-pattern "")}
        (assoc :block/tags [{:db/ident :logseq.class/Task}])
        (update :build/properties merge {:logseq.property/status status}))
    block))

(defn load-test-files-for-db-graph
  "Wrapper around sqlite-build/build-blocks-tx with frontend defaults. Also supports
   the following special keys:
   * :build.test/title - Only available to top-level blocks. Convenient for writing tasks quickly"
  [options*]
  (let [;; Builds options from markdown :file/content unless given explicit build-blocks config
        options (cond (:page (first options*))
                      {:pages-and-blocks options* :auto-create-ontology? true}
                      :else
                      (assoc options* :auto-create-ontology? true))
        options' (update options
                         :pages-and-blocks
                         (fn [pbs]
                           (mapv (fn [m]
                                   (update m :blocks
                                           (fn [blocks]
                                             (mapv build-test-block blocks))))
                                 pbs)))
        {:keys [init-tx block-props-tx] :as _txs} (sqlite-build/build-blocks-tx options')
        ;; Allow pages to reference each other via uuid and for unordered init-tx
        init-index (map #(select-keys % [:block/uuid]) init-tx)]
    ;; (cljs.pprint/pprint _txs)
    (db/transact! test-db-name-db-version (concat init-index init-tx block-props-tx))))

(defn load-test-files
  "Given a collection of file maps, loads them into the current test-db.
This can be called in synchronous contexts as no async fns should be invoked"
  [files]
  (if (and node? (or js/process.env.DB_GRAPH
                     ;; TODO: Remove once tests are converted
                     (-> files first :page)))
    (load-test-files-for-db-graph files)
    (file-repo-handler/parse-files-and-load-to-db!
     test-db
     files)))

(defn initial-test-page-and-blocks
  [& {:keys [page-uuid]}]
  (let [page-uuid (or page-uuid (random-uuid))
        first-block-uuid (random-uuid)
        second-block-uuid (random-uuid)
        page-id [:block/uuid page-uuid]]
    (->>
     [;; page
      {:block/uuid page-uuid
       :block/name "test"
       :block/title "Test"
       ;; :block/tags #{:logseq.class/Page}
       }
      ;; first block
      {:block/uuid first-block-uuid
       :block/page page-id
       :block/parent page-id
       :block/order (db-order/gen-key nil)
       :block/title "block 1"}
      ;; second block
      {:block/uuid second-block-uuid
       :block/page page-id
       :block/parent page-id
       :block/order (db-order/gen-key nil)
       :block/title "block 2"}]
     (map sqlite-util/block-with-timestamps))))

(defn start-and-destroy-db
  "Sets up a db connection and current repo like fixtures/reset-datascript. It
  also seeds the db with the same default data that the app does and destroys a db
  connection when done with it."
  [f & {:as start-opts}]
  ;; Set current-repo explicitly since it's not the default
  (let [db-graph? (or (:db-graph? start-opts) (and node? (some? js/process.env.DB_GRAPH)))
        repo (if db-graph? test-db-name-db-version test-db-name)]
    (state/set-current-repo! repo)
    (start-test-db! start-opts)
    (when db-graph?
      (let [built-in-data (sqlite-create-graph/build-db-initial-data
                           config/config-default-content)]
        (db/transact! repo built-in-data)))
    (when-let [init-f (:init-data start-opts)]
      (assert (fn? f) "init-data should be a fn")
      (init-f (db/get-db repo false)))
    (f)
    (state/set-current-repo! nil)
    (destroy-test-db!)))

(defn db-based-start-and-destroy-db
  [f & {:as start-opts}]
  (start-and-destroy-db f (assoc start-opts :db-graph? true)))

(def db-based-start-and-destroy-db-map-fixture
  "To avoid 'Fixtures may not be of mixed types' error
  when use together with other map-type fixtures"
  {:before #(start-test-db! {:db-graph? true})
   :after #(destroy-test-db!)})

(defn save-block!
  "Wrapper around editor-handler/save-block! that also adds tags"
  [repo block-uuid content {:keys [tags]}]
  (editor-handler/save-block! repo block-uuid content)
  (doseq [tag tags]
    (db-property-handler/set-block-property! block-uuid :block/tags
                                             (db/get-page tag))))

(defn create-page!
  [title & {:as opts}]
  (let [repo (state/get-current-repo)
        conn (db/get-db repo false)
        [page-name _page-uuid] (worker-page/create! conn title opts)]
    page-name))

(defn find-page-by-title [page-title]
  (db-test/find-page-by-title (conn/get-db) page-title))

(defn find-block-by-content [block-title]
  (db-test/find-block-by-content (conn/get-db) block-title))