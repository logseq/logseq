(ns frontend.test.helper
  "Common helper fns for tests"
  (:require [frontend.handler.repo :as repo-handler]
            [frontend.state :as state]
            [frontend.db.conn :as conn]
            [clojure.string :as string]
            [clojure.set :as set]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.db :as db]
            [datascript.core :as d]))

(defonce test-db (if (some? js/process.env.DB_GRAPH) "logseq_db_test-db" "test-db"))

(defn start-test-db!
  []
  (conn/start! test-db))

(defn destroy-test-db!
  []
  (conn/destroy-all!))

(defn reset-test-db!
  []
  (destroy-test-db!)
  (start-test-db!))

;; Currently this only works for load-test-files that have added a :file/blocks for each file arg
(defn- load-test-files-for-db-graph
  [files*]
  (let [files (mapv #(assoc % :file/content
                            (string/join "\n"
                                         (map (fn [x] (str "- " (first x))) (:file/blocks %))))
                    files*)]
    ;; TODO: Use sqlite instead of file graph to create client db
    (repo-handler/parse-files-and-load-to-db!
     test-db
     files
     {:re-render? false :verbose false :refresh? true})
    (let [content-uuid-map (into {} (d/q
                                     '[:find ?content ?uuid
                                       :where
                                       [?b :block/content ?content]
                                       [?b :block/uuid ?uuid]]
                                     (frontend.db/get-db test-db)))
          property-uuids (->> files
                              (mapcat #(->> % :file/blocks (map second) (mapcat keys)))
                              set
                              (map #(vector % (random-uuid)))
                              (into {}))
            ;; from upsert-property!
          property-tx (mapv (fn [[prop-name uuid]]
                              (outliner-core/block-with-timestamps
                               {:block/schema {:type :default}
                                :block/original-name (name prop-name)
                                :block/name (string/lower-case (name prop-name))
                                :block/uuid uuid
                                :block/type "property"}))
                            property-uuids)
          page-uuids (->> files
                          (mapcat #(->> %
                                        :file/blocks
                                        (map second)
                                        (mapcat (fn [m]
                                                  (->> m vals (filter set?) (apply set/union))))))
                          set
                          (map #(vector % (random-uuid)))
                          (into {}))
          page-tx (mapv (fn [[page-name uuid]]
                          (outliner-core/block-with-timestamps
                           {:block/name (string/lower-case page-name)
                            :block/original-name page-name
                            :block/uuid uuid}))
                        page-uuids)
            ;; from add-property!
          block-tx (mapcat
                    (fn [file]
                      (map
                       (fn [[content props]]
                         {:block/uuid (or (content-uuid-map content)
                                          (throw (ex-info "No uuid for content" {:content content})))
                          :block/properties
                          (->> props
                               (map
                                (fn [[prop-name val]]
                                  [(or (property-uuids prop-name)
                                       (throw (ex-info "No uuid for property" {:name prop-name})))
                                   (if (set? val)
                                     (set (map (fn [p] (or (page-uuids p) (throw (ex-info "No uuid for page" {:name p}))))
                                               val))
                                     val)]))
                               (into {}))})
                       (:file/blocks file)))
                    files)]
      (db/transact! test-db (vec (concat page-tx property-tx block-tx))))))

(defn load-test-files
  "Given a collection of file maps, loads them into the current test-db.
This can be called in synchronous contexts as no async fns should be invoked"
  [files]
  (if js/process.env.DB_GRAPH
    (load-test-files-for-db-graph files)
    (repo-handler/parse-files-and-load-to-db!
     test-db
     files
   ;; Set :refresh? to avoid creating default files in after-parse
     {:re-render? false :verbose false :refresh? true})))

(defn start-and-destroy-db
  "Sets up a db connection and current repo like fixtures/reset-datascript. It
  also seeds the db with the same default data that the app does and destroys a db
  connection when done with it."
  [f]
  ;; Set current-repo explicitly since it's not the default
  (state/set-current-repo! test-db)
  (start-test-db!)
  (f)
  (state/set-current-repo! nil)
  (destroy-test-db!))
