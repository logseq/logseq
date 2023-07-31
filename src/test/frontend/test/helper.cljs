(ns frontend.test.helper
  "Common helper fns for tests"
  (:require [frontend.handler.repo :as repo-handler]
            [frontend.state :as state]
            [frontend.db.conn :as conn]
            [clojure.string :as string]
            [clojure.set :as set]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.db :as db]
            [frontend.date :as date]
            [datascript.core :as d]
            [logseq.graph-parser.text :as text]))

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

(defn- parse-property-value [value]
  (if-let [refs (seq (map #(or (second %) (get % 2))
                          (re-seq #"#(\S+)|\[\[(.*?)\]\]" value)))]
    (set refs)
    (if-some [new-val (text/parse-non-string-property-value value)]
      new-val
      value)))

(defn- property-lines->properties
  [property-lines]
  (->> property-lines
       (map #(let [[k v] (string/split % #"::\s*" 2)]
               [(keyword k) (parse-property-value v)]))
       (into {})))

(defn- build-block-properties
  "Parses out properties from a file's content and associates it with the page name
   or block content"
  [file-content]
  (if (string/includes? file-content "\n-")
    {:block-properties
     (->> (string/split file-content #"\n-\s*")
          (mapv (fn [s]
                  (let [[content & props] (string/split-lines s)]
                    {:name-or-content content
                     :properties (property-lines->properties props)}))))}
    {:page-properties
     (->> file-content
          string/split-lines
          property-lines->properties)}))

(defn- file-path->page-name
  [file-path]
  (or (if (string/starts-with? file-path "journals")
        (some-> (second (re-find #"([^/]+).md" file-path))
                date/normalize-date
                date/journal-name
                string/lower-case)
        (second (re-find #"([^/]+).md" file-path)))
      (throw (ex-info "No page found" {}))))

(defn- update-file-for-db-graph
  "Adds properties by block/page for a file and updates block content"
  [file]
  (let [{:keys [block-properties page-properties]}
        (build-block-properties (:file/content file))]
    (if page-properties
      (merge file
             {:file/block-properties [{:name-or-content (file-path->page-name (:file/path file))
                                       :properties page-properties
                                       :page-properties? true}]
              :page-properties? false})
      (merge file
             {:file/block-properties (cond-> block-properties
                                       ;; Optionally add page properties as a page block
                                       (re-find #"^\s*[^-]+" (:name-or-content (first block-properties)))
                                       (conj {:name-or-content (file-path->page-name (:file/path file))
                                              :properties (->> (:name-or-content (first block-properties))
                                                               string/split-lines
                                                               property-lines->properties)
                                              :page-properties? true}))
              ;; Rewrite content to strip it of properties which shouldn't be in content
              :file/content (string/join "\n"
                                         (map (fn [x] (str "- " (:name-or-content x))) block-properties))}))))

(defn- load-test-files-for-db-graph
  [files*]
  (let [files (mapv update-file-for-db-graph files*)]
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
                                     (db/get-db test-db)))
          page-name-map (into {} (d/q
                                  '[:find ?name ?uuid
                                    :where
                                    [?b :block/name ?name]
                                    [?b :block/uuid ?uuid]]
                                  (db/get-db test-db)))
          property-uuids (->> files
                              (mapcat #(->> % :file/block-properties (map :properties) (mapcat keys)))
                              set
                              ;; Property pages may be created by file graphs automatically,
                              ;; usually by page properties. Delete this if file graphs are long
                              ;; used to create datascript db
                              (map #(vector % (or (page-name-map (name %)) (random-uuid))))
                              (into {}))
          ;; from upsert-property!
          new-properties-tx (mapv (fn [[prop-name uuid]]
                                    (outliner-core/block-with-timestamps
                                     {:block/uuid uuid
                                      :block/schema {:type :default}
                                      :block/original-name (name prop-name)
                                      :block/name (string/lower-case (name prop-name))
                                      :block/type "property"}))
                                  property-uuids)
          page-uuids (->> files
                          (mapcat #(->> %
                                        :file/block-properties
                                        (map :properties)
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
          block-properties-tx
          (mapcat
           (fn [file]
             (map
              (fn [{:keys [name-or-content properties page-properties?]}]
                {:block/uuid (if page-properties?
                               (or (page-name-map name-or-content)
                                   (throw (ex-info "No uuid for page" {:page-name name-or-content})))
                               (or (content-uuid-map name-or-content)
                                   (throw (ex-info "No uuid for content" {:content name-or-content}))))
                 :block/properties
                 (->> properties
                      (map
                       (fn [[prop-name val]]
                         [(or (property-uuids prop-name)
                              (throw (ex-info "No uuid for property" {:name prop-name})))
                          (if (set? val)
                            (set (map (fn [p] (or (page-uuids p) (throw (ex-info "No uuid for page" {:name p}))))
                                      val))
                            val)]))
                      (into {}))})
              (:file/block-properties file)))
           files)]
      (db/transact! test-db (vec (concat page-tx new-properties-tx block-properties-tx))))))

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
