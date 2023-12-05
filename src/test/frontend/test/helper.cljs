(ns frontend.test.helper
  "Common helper fns for tests"
  (:require [frontend.handler.repo :as repo-handler]
            [frontend.state :as state]
            [frontend.db.conn :as conn]
            [clojure.string :as string]
            [clojure.set :as set]
            [logseq.db.sqlite.util :as sqlite-util]
            [frontend.db :as db]
            [frontend.date :as date]
            [datascript.core :as d]
            [logseq.graph-parser.text :as text]))

(def node? (exists? js/process))

(def test-db-name "test-db")
(def test-db-name-db-version "logseq_db_test-db")
(def test-db
  (if (and node? (some? js/process.env.DB_GRAPH)) test-db-name-db-version test-db-name))

(defn start-test-db!
  [& {:as opts}]
  (let [test-db (if (or (:db-graph? opts) (some? js/process.env.DB_GRAPH))
                  test-db-name-db-version
                  test-db-name)]
    (conn/start! test-db opts)))

(defn destroy-test-db!
  []
  (conn/destroy-all!))

(defn reset-test-db!
  [& {:as opts}]
  (destroy-test-db!)
  (start-test-db! opts))

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
       (keep #(let [[k v] (string/split % #"::\s*" 2)]
               (when (string/includes? % "::")
                 [(keyword k) (parse-property-value v)])))
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
                     ;; If no property chars may accidentally parse child blocks
                     ;; so don't do property parsing
                     :properties (when (and (string/includes? s ":: ") props)
                                   (property-lines->properties props))}))))}
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
             {:file/block-properties (vec (keep #(when (seq (:properties %)) %)
                                                [{:name-or-content (file-path->page-name (:file/path file))
                                                  :properties page-properties
                                                  :page-properties? true}]))})
      (merge file
             {:file/block-properties
              ;; Filter out empty empty properties to avoid needless downstream processing
              (cond-> (vec (keep #(when (seq (:properties %)) %) block-properties))
                                       ;; Optionally add page properties as a page block
                (re-find #"^\s*[^-]+" (:name-or-content (first block-properties)))
                (conj {:name-or-content (file-path->page-name (:file/path file))
                       :properties (->> (:name-or-content (first block-properties))
                                        string/split-lines
                                        property-lines->properties)
                       :page-properties? true}))}
             ;; Rewrite content to strip it of properties which shouldn't be in content
             ;; but only if properties are detected
             (when (some #(seq (:properties %)) block-properties)
               {:file/content (string/join "\n"
                                           (map (fn [x] (str "- " (:name-or-content x))) block-properties))})))))

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
                                    (sqlite-util/block-with-timestamps
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
                          (sqlite-util/block-with-timestamps
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
                (cond-> {:block/uuid (if page-properties?
                                       (or (page-name-map name-or-content)
                                           (throw (ex-info "No uuid for page" {:page-name name-or-content})))
                                       (or (content-uuid-map name-or-content)
                                           (throw (ex-info "No uuid for content" {:content name-or-content}))))
                         :block/properties
                         (->> (dissoc properties :created-at)
                              (map
                               (fn [[prop-name val]]
                                 [(or (property-uuids prop-name)
                                      (throw (ex-info "No uuid for property" {:name prop-name})))
                                  (if (set? val)
                                    (set (map (fn [p] (or (page-uuids p) (throw (ex-info "No uuid for page" {:name p}))))
                                              val))
                                    val)]))
                              (into {}))}
                  (:created-at properties)
                  (assoc :block/created-at (:created-at properties))))
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

(defn initial-test-page-and-blocks
  []
  (let [page-uuid (random-uuid)
        first-block-uuid (random-uuid)
        second-block-uuid (random-uuid)
        page-id [:block/uuid page-uuid]]
    (->>
     [;; page
      {:block/uuid page-uuid
       :block/name "test"
       :block/original-name "test"}
      ;; first block
      {:block/uuid first-block-uuid
       :block/page page-id
       :block/parent page-id
       :block/left page-id
       :block/content "block 1"
       :block/format :markdown}
      ;; second block
      {:block/uuid second-block-uuid
       :block/page page-id
       :block/parent page-id
       :block/left [:block/uuid first-block-uuid]
       :block/content "block 2"
       :block/format :markdown}]
     (map sqlite-util/block-with-timestamps))))

(defn start-and-destroy-db
  "Sets up a db connection and current repo like fixtures/reset-datascript. It
  also seeds the db with the same default data that the app does and destroys a db
  connection when done with it."
  [f & {:as start-opts}]
  ;; Set current-repo explicitly since it's not the default
  (state/set-current-repo!
   (if (or (:db-graph? start-opts) (some? js/process.env.DB_GRAPH))
     test-db-name-db-version
     test-db-name))
  (start-test-db! start-opts)
  (when-let [init-f (:init-data start-opts)]
    (assert (fn? f) "init-data should be a fn")
    (init-f (db/get-db test-db-name-db-version false)))
  (f)
  (state/set-current-repo! nil)
  (destroy-test-db!))

(defn db-based-start-and-destroy-db
  [f & {:as start-opts}]
  (start-and-destroy-db f (assoc start-opts :db-graph? true)))

(def start-and-destroy-db-map-fixture
  "To avoid 'Fixtures may not be of mixed types' error
  when use together with other map-type fixtures"
  {:before #(do (state/set-current-repo! test-db)
                (start-test-db!))
   :after #(do (state/set-current-repo! nil)
               (destroy-test-db!))})
