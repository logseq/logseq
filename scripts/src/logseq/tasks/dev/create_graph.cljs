(ns create-graph
  "Script that generates a DB graph using an EDN format"
  (:require [nbb.core :as nbb]
            [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db.sqlite.util :as sqlite-util]
            [cljs-bean.core :as bean]
            [logseq.db :as ldb]
            [clojure.string :as string]
            [datascript.core :as d]
            ["fs" :as fs]
            ["path" :as path]
            ;; These namespaces should move to deps/
            [frontend.modules.datascript-report.core :as ds-report]
            [frontend.modules.outliner.pipeline-util :as pipeline-util]))

(defn- invoke-hooks
  "Modified copy frontend.modules.outliner.pipeline/invoke-hooks that doesn't
  handle path-ref recalculation or persist to app db"
  [{:keys [db-after] :as tx-report}]
  ;; TODO: Add :block/path-refs to blocks
  (let [{:keys [blocks]} (ds-report/get-blocks-and-pages tx-report)
        deleted-block-uuids (set (pipeline-util/filter-deleted-blocks (:tx-data tx-report)))
        upsert-blocks (pipeline-util/build-upsert-blocks blocks deleted-block-uuids db-after)]
    {:blocks upsert-blocks
     :deleted-block-uuids deleted-block-uuids}))

(defn- update-sqlite-db
  "Modified copy of :db-transact-data defmethod in electron.handler"
  [db-name {:keys [blocks deleted-block-uuids]}]
  (when (seq deleted-block-uuids)
    (sqlite-db/delete-blocks! db-name deleted-block-uuids))
  (when (seq blocks)
    (let [blocks' (mapv sqlite-util/ds->sqlite-block blocks)]
      (sqlite-db/upsert-blocks! db-name (bean/->js blocks')))))

(defn- translate-property-value
  "Translates a property value as needed. A value wrapped in vector indicates a reference type
   e.g. [:page \"some page\"]"
  [val {:keys [page-uuids block-uuids]}]
  (if (vector? val)
    (case (first val)
      :page
      (or (page-uuids (second val))
          (throw (ex-info (str "No uuid for page '" (second val) "'") {:name (second val)})))
      :block
      (or (block-uuids (second val))
          (throw (ex-info (str "No uuid for block '" (second val) "'") {:name (second val)})))
      (throw (ex-info "Invalid property value type. Valid values are :block and :page" {})))
    val))

(defn- ->block-properties-tx [properties {:keys [property-uuids] :as uuid-maps}]
  (->> properties
       (map
        (fn [[prop-name val]]
          [(or (property-uuids prop-name)
               (throw (ex-info "No uuid for property" {:name prop-name})))
            ;; set indicates a :many value
           (if (set? val)
             (set (map #(translate-property-value % uuid-maps) val))
             (translate-property-value val uuid-maps))]))
       (into {})))

(defn- create-uuid-maps
  "Creates maps of unique page names, block contents and property names to their uuids"
  [pages-and-blocks]
  (let [property-uuids (->> pages-and-blocks
                            (map #(-> (:blocks %) vec (conj (:page %))))
                            (mapcat #(->> % (map :properties) (mapcat keys)))
                            set
                            (map #(vector % (random-uuid)))
                            (into {}))
        page-uuids (->> pages-and-blocks
                        (map :page)
                        (map (juxt :block/name :block/uuid))
                        (into {}))
        block-uuids (->> pages-and-blocks
                         (mapcat :blocks)
                         (map (juxt :block/content :block/uuid))
                         (into {}))]
    {:property-uuids property-uuids
     :page-uuids page-uuids
     :block-uuids block-uuids}))

(defn- create-blocks-tx
  "For a map of pages to their blocks, this creates frontend blocks assuming only top level blocks
   are desired. Anything more complex starts to recreate outliner namespaces"
  [{:keys [pages-and-blocks properties]}]
  (let [;; add uuids before tx for refs in :properties
        pages-and-blocks' (mapv (fn [{:keys [page blocks]}]
                                  (cond-> {:page (merge {:block/uuid (random-uuid)} page)}
                                    (seq blocks)
                                    (assoc :blocks (mapv #(merge {:block/uuid (random-uuid)} %) blocks))))
                                pages-and-blocks)
        {:keys [property-uuids] :as uuid-maps} (create-uuid-maps pages-and-blocks')
        page-count (atom 100001)
        new-db-id #(swap! page-count inc)
        created-at (js/Date.now)
        new-properties-tx (mapv (fn [[prop-name uuid]]
                                  {:block/uuid uuid
                                   :block/schema (merge {:type :default}
                                                        (get-in properties [prop-name :block/schema]))
                                   :block/original-name (name prop-name)
                                   :block/name (string/lower-case (name prop-name))
                                   :block/type "property"
                                   :block/created-at created-at
                                   :block/updated-at created-at})
                                property-uuids)
        pages-and-blocks-tx
        (vec
         (mapcat
          (fn [{:keys [page blocks]}]
            (let [page-id (new-db-id)]
              (into
               ;; page tx
               [(merge (dissoc page :properties)
                       {:db/id page-id
                        :block/original-name (string/capitalize (:block/name page))
                        :block/created-at created-at
                        :block/updated-at created-at}
                       (when (seq (:properties page))
                         {:block/properties (->block-properties-tx (:properties page) uuid-maps)}))]
               ;; blocks tx
               (reduce (fn [acc m]
                         (conj acc
                               (merge (dissoc m :properties)
                                      {:db/id (new-db-id)
                                       :block/format :markdown
                                       :block/path-refs [{:db/id page-id}]
                                       :block/page {:db/id page-id}
                                       :block/left {:db/id (or (:db/id (last acc)) page-id)}
                                       :block/parent {:db/id page-id}
                                       :block/created-at created-at
                                       :block/updated-at created-at}
                                      (when (seq (:properties m))
                                        {:block/properties (->block-properties-tx (:properties m) uuid-maps)}))))
                       []
                       blocks))))
          pages-and-blocks'))]
    (into pages-and-blocks-tx new-properties-tx)))

(defn- setup-db-graph
  "Create sqlite DB and initialize datascript connection to sync to it"
  [dir db-name]
  (fs/mkdirSync (path/join dir db-name) #js {:recursive true})
  (sqlite-db/open-db! dir db-name)
  ;; Same order as frontend.db.conn/start!
  (let [conn (ldb/start-conn :create-default-pages? false)]
    (d/listen! conn :persist-to-sqlite (fn persist-to-sqlite [tx-report]
                                         (update-sqlite-db db-name (invoke-hooks tx-report))))
    (ldb/create-default-pages! conn)
    conn))

(defn- date-journal-title [date]
  (let [title (.toLocaleString date "en-US" #js {:month "short" :day "numeric" :year "numeric"})
        suffixes {1 "th" 21 "th" 31 "th" 2 "nd" 22 "nd" 3 "rd" 33 "rd"}]
    (string/lower-case
     (string/replace-first title #"(\d+)" (str "$1" (suffixes (.getDate date) "th"))))))

(defn- date-journal-day [date]
  (js/parseInt (str (.toLocaleString date "en-US" #js {:year "numeric"})
                    (.toLocaleString date "en-US" #js {:month "2-digit"})
                    (.toLocaleString date "en-US" #js {:day "2-digit"}))))

(defn- create-init-data
  []
  {:pages-and-blocks
   [{:page
     (let [today (new js/Date)]
       {:block/name (date-journal-title today) :block/journal? true :block/journal-day (date-journal-day today)})
     :blocks
     [{:block/content "[[Properties]]"}
      {:block/content "[[Queries]]"}]}
    {:page {:block/name "properties"}
     :blocks
     [{:block/content "default property block" :properties {:default "haha"}}
      {:block/content "url property block" :properties {:url "https://logseq.com"}}
      {:block/content "default-many property block" :properties {:default-many #{"woo" "hoo"}}}
      {:block/content "url-many property block" :properties {:url-many #{"https://logseq.com" "https://docs.logseq.com"}}}
      {:block/content "checkbox property block" :properties {:checkbox true}}
      {:block/content "number property block" :properties {:number 5}}
      {:block/content "number-many property block" :properties {:number-many #{5 10}}}
      {:block/content "page property block" :properties {:page [:page "page 1"]}}
      {:block/content "page-many property block" :properties {:page-many #{[:page "page 1"] [:page "page 2"]}}}
      {:block/content "block property block" :properties {:block [:block "yee"]}}
      {:block/content "block-many property block" :properties {:block-many #{[:block "yee"] [:block "haw"]}}}]}
    {:page {:block/name "queries"}
     :blocks
     [{:block/content "{{query (property :default \"haha\")}}"}
      {:block/content "{{query (property :url \"https://logseq.com\")}}"}
      {:block/content "{{query (property :default-many \"woo\")}}"}
      {:block/content "{{query (property :url-many \"https://logseq.com\")}}"}
      {:block/content "{{query (property :checkbox true)}}"}
      {:block/content "{{query (property :number 5)}}"}
      {:block/content "{{query (property :number-many 10)}}"}
      {:block/content "{{query (property :page \"Page 1\")}}"}
      {:block/content "{{query (property :page-many \"Page 2\")}}"}]}
    {:page {:block/name "page 1"}
     :blocks
     [{:block/content "yee"}
      {:block/content "haw"}]}
    {:page {:block/name "page 2"}}]
   :properties
   (->> [:default :url :checkbox :number :page :block]
        (mapcat #(cond-> [[% {:block/schema {:type %}}]]
                   (not= % :checkbox)
                   (conj [(keyword (str (name %) "-many")) {:block/schema {:type % :cardinality :many}}])))
        (into {}))})

(defn -main [args]
  (when (not= 1 (count args))
    (println "Usage: $0 GRAPH-DIR")
    (js/process.exit 1))
  (let [[dir db-name] ((juxt path/dirname path/basename) (first args))
        conn (setup-db-graph dir db-name)
        blocks-tx (create-blocks-tx (create-init-data))]
    (println "Generating" (count (filter :block/name blocks-tx)) "pages and"
             (count (filter :block/content blocks-tx)) "blocks ...")
    (d/transact! conn blocks-tx)
    (println "Created graph" (str db-name "!"))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))