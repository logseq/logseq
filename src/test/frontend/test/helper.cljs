(ns frontend.test.helper
  "Common helper fns for tests"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.background-tasks]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.conn :as conn]
            [frontend.db.react :as react]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.pipeline :as worker-pipeline]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.test.helper :as db-test]))

(defn react-components
  [f]
  (reset! react/*query-state {})
  (let [r (f)]
    (reset! react/*query-state {})
    r))

(def bare-marker-pattern
  #"(TODO|DOING|DONE|WAIT|CANCELED|CANCELLED){1}\s+")

(def test-db "logseq_db_test-db")

(defn start-test-db!
  [& {:keys [build-init-data?] :or {build-init-data? true} :as opts}]
  (state/set-current-repo! test-db)
  (conn/start! test-db opts)
  (ldb/register-transact-pipeline-fn!
   (fn [tx-report]
     (worker-pipeline/transact-pipeline test-db tx-report)))
  (let [conn (conn/get-db test-db false)]
    (when build-init-data? (d/transact! conn (sqlite-create-graph/build-db-initial-data config/config-default-content)))
    (d/listen! conn ::listen-db-changes!
               (fn [tx-report]
                 (worker-pipeline/invoke-hooks conn tx-report {})))))

(defn destroy-test-db!
  []
  (conn/destroy-all!))

(def file-to-db-statuses
  {"TODO" :logseq.property/status.todo
   "DOING" :logseq.property/status.doing
   "DONE" :logseq.property/status.done
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

(defn load-test-files
  "Builds the given data into the current test-db.
   Wrapper around sqlite-build/build-blocks-tx with frontend defaults. Also supports
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
    (db/transact! test-db (concat init-index init-tx block-props-tx))))

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
  (state/set-current-repo! test-db)
  (start-test-db! start-opts)
  (when-let [init-f (:init-data start-opts)]
    (assert (fn? f) "init-data should be a fn")
    (init-f (db/get-db test-db false)))
  (f)
  (state/set-current-repo! nil)
  (destroy-test-db!))

(def start-and-destroy-db-map-fixture
  "To avoid 'Fixtures may not be of mixed types' error
  when use together with other map-type fixtures"
  {:before start-test-db!
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