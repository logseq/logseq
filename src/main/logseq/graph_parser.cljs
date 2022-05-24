(ns ^:nbb-compatible logseq.graph-parser
  "Main ns for parsing graph from source files"
  (:require [datascript.core :as d]
            [logseq.graph-parser.extract :as extract]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.date-time-util :as date-time-util]
            [logseq.graph-parser.config :as gp-config]
            [clojure.set :as set]))

(defn- db-set-file-content!
  "Modified copy of frontend.db.model/db-set-file-content!"
  [db path content]
  (let [tx-data {:file/path path
                 :file/content content}]
    (d/transact! db [tx-data] {:skip-refresh? true})))

(defn parse-file
  "Parse file and save parsed data to the given db"
  [db file content {:keys [new? delete-blocks-fn new-graph? extract-options]
                    :or {new? true
                         new-graph? false
                         delete-blocks-fn (constantly [])}}]
  (db-set-file-content! db file content)
  (let [format (gp-util/get-format file)
        file-content [{:file/path file}]
        tx (if (contains? gp-config/mldoc-support-formats format)
             (let [extract-options' (merge {:block-pattern (gp-config/get-block-pattern format)
                                            :date-formatter "MMM do, yyyy"
                                            :supported-formats (gp-config/supported-formats)}
                                           extract-options)
                   [pages blocks]
                   (extract/extract-blocks-pages
                    file
                    content
                    (merge extract-options' {:db @db}))
                   delete-blocks (delete-blocks-fn (first pages) file)
                   block-ids (map (fn [block] {:block/uuid (:block/uuid block)}) blocks)
                   block-refs-ids (->> (mapcat :block/refs blocks)
                                       (filter (fn [ref] (and (vector? ref)
                                                              (= :block/uuid (first ref)))))
                                       (map (fn [ref] {:block/uuid (second ref)}))
                                       (seq))
                   ;; To prevent "unique constraint" on datascript
                   block-ids (set/union (set block-ids) (set block-refs-ids))
                   pages (extract/with-ref-pages pages blocks)
                   pages-index (map #(select-keys % [:block/name]) pages)]
               ;; does order matter?
               (concat file-content pages-index delete-blocks pages block-ids blocks))
             file-content)
        tx (concat tx [(cond-> {:file/path file}
                               new?
                               ;; TODO: use file system timestamp?
                               (assoc :file/created-at (date-time-util/time-ms)))])]
    (d/transact! db (gp-util/remove-nils tx) (when new-graph? {:new-graph? true}))))

(defn parse
  "Main parse fn"
  ([db files]
   (parse db files {}))
  ([db files {:keys [config]}]
   (let [extract-options {:date-formatter (gp-config/get-date-formatter config)}]
     (doseq [{:file/keys [path content]} files]
       (parse-file db path content {:extract-options extract-options})))))
