(ns frontend.worker.search
  "Full-text and fuzzy search"
  (:require [clojure.string :as string]
            [promesa.core :as p]
            [cljs-bean.core :as bean]
            ["fuse.js" :as fuse]
            [goog.object :as gobj]
            [datascript.core :as d]
            [frontend.common.search-fuzzy :as fuzzy]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]))

;; TODO: use sqlite for fuzzy search
;; maybe https://github.com/nalgeon/sqlean/blob/main/docs/fuzzy.md?
(defonce fuzzy-search-indices (atom {}))

(defn- add-blocks-fts-triggers!
  "Table bindings of blocks tables and the blocks FTS virtual tables"
  [db]
  (let [triggers [;; delete
                  "CREATE TRIGGER IF NOT EXISTS blocks_ad AFTER DELETE ON blocks
                  BEGIN
                      DELETE from blocks_fts where id = old.id;
                  END;"
                  ;; insert
                  "CREATE TRIGGER IF NOT EXISTS blocks_ai AFTER INSERT ON blocks
                  BEGIN
                      INSERT INTO blocks_fts (id, title, page)
                      VALUES (new.id, new.title, new.page);
                  END;"
                  ;; update
                  "CREATE TRIGGER IF NOT EXISTS blocks_au AFTER UPDATE ON blocks
                  BEGIN
                      DELETE from blocks_fts where id = old.id;
                      INSERT INTO blocks_fts (id, title, page)
                      VALUES (new.id, new.title, new.page);
                  END;"]]
    (doseq [trigger triggers]
      (.exec db trigger))))

(defn- create-blocks-table!
  [db]
  ;; id -> block uuid, page -> page uuid
  (.exec db "CREATE TABLE IF NOT EXISTS blocks (
                        id TEXT NOT NULL PRIMARY KEY,
                        title TEXT NOT NULL,
                        page TEXT)"))

(defn- create-blocks-fts-table!
  [db]
  ;; The trigram tokenizer extends FTS5 to support substring matching in general, instead of the usual token matching. When using the trigram tokenizer, a query or phrase token may match any sequence of characters within a row, not just a complete token.
  ;; Check https://www.sqlite.org/fts5.html#the_experimental_trigram_tokenizer.
  (.exec db "CREATE VIRTUAL TABLE IF NOT EXISTS blocks_fts USING fts5(id, title, page, tokenize=\"trigram\")"))

(defn create-tables-and-triggers!
  "Open a SQLite db for search index"
  [db]
  (try
    (create-blocks-table! db)
    (create-blocks-fts-table! db)
    (add-blocks-fts-triggers! db)
    (catch :default e
      (prn "Failed to create tables and triggers")
      (js/console.error e)
      ;; FIXME:
      ;; (try
      ;;   ;; unlink db
      ;;   (catch :default e
      ;;     (js/console.error "cannot unlink search db:" e)))
      )))

(defn drop-tables-and-triggers!
  [db]
  (.exec db "
DROP TABLE IF EXISTS blocks;
DROP TABLE IF EXISTS blocks_fts;
DROP TRIGGER IF EXISTS blocks_ad;
DROP TRIGGER IF EXISTS blocks_ai;
DROP TRIGGER IF EXISTS blocks_au;
"))

(defn- clj-list->sql
  "Turn clojure list into SQL list
   '(1 2 3 4)
   ->
   \"('1','2','3','4')\""
  [ids]
  (str "(" (->> (map (fn [id] (str "'" id "'")) ids)
                (string/join ", ")) ")"))

(defn upsert-blocks!
  [^Object db blocks]
  (.transaction db (fn [tx]
                     (doseq [item blocks]
                       (if (and (common-util/uuid-string? (.-id item))
                                (common-util/uuid-string? (.-page item)))
                         (.exec tx #js {:sql "INSERT INTO blocks (id, title, page) VALUES ($id, $title, $page) ON CONFLICT (id) DO UPDATE SET (title, page) = ($title, $page)"
                                        :bind #js {:$id (.-id item)
                                                   :$title (.-title item)
                                                   :$page (.-page item)}})
                         (do
                           (js/console.error "Upsert blocks wrong data: ")
                           (js/console.dir item)
                           (throw (ex-info "Search upsert-blocks wrong data: "
                                          (bean/->clj item)))))))))

(defn delete-blocks!
  [db ids]
  (let [sql (str "DELETE from blocks WHERE id IN " (clj-list->sql ids))]
    (.exec db sql)))

(defonce max-snippet-length 250)

(defn- snippet-by
  [content length]
  (str (subs content 0 length) (when (> (count content) max-snippet-length) "...")))

(defn- get-snippet-result
  [snippet]
  (let [;; Cut snippet to limited size chars for non-matched results
        flag-highlight "$pfts_2lqh>$ "
        snippet (if (string/includes? snippet flag-highlight)
                  snippet
                  (snippet-by snippet max-snippet-length))]
    snippet))

(defn- search-blocks-aux
  [db sql input page limit enable-snippet?]
  (try
    (p/let [result (if page
                     (.exec db #js {:sql sql
                                    :bind #js [page input limit]
                                    :rowMode "array"})
                     (.exec db #js {:sql sql
                                    :bind #js [input limit]
                                    :rowMode "array"}))
            blocks (bean/->clj result)]
      (map (fn [block]
             (let [[id page title snippet] (if enable-snippet?
                                             (update block 3 get-snippet-result)
                                             block)]
               {:id id
                :page page
                :title title
                :snippet snippet})) blocks))
    (catch :default e
      (prn :debug "Search blocks failed: ")
      (js/console.error e))))

(defn- get-match-input
  [q]
  (let [match-input (-> q
                        (string/replace " and " " AND ")
                        (string/replace " & " " AND ")
                        (string/replace " or " " OR ")
                        (string/replace " | " " OR ")
                        (string/replace " not " " NOT "))]
    (if (not= q match-input)
      (string/replace match-input "," "")
      (str "\"" match-input "\"*"))))

(defn exact-matched?
  "Check if two strings points toward same search result"
  [q match]
  (when (and (string? q) (string? match))
    (boolean
     (reduce
      (fn [coll char]
        (let [coll' (drop-while #(not= char %) coll)]
          (if (seq coll')
            (rest coll')
            (reduced false))))
      (seq (fuzzy/search-normalize match true))
      (seq (fuzzy/search-normalize q true))))))

(defn- page-or-object?
  [entity]
  (and (or (ldb/page? entity) (seq (:block/tags entity)))
       (not (ldb/hidden? entity))))

(defn get-all-fuzzy-supported-blocks
  "Only pages and objects are supported now."
  [db]
  (let [page-ids (->> (d/datoms db :avet :block/name)
                      (map :e))
        object-ids (->> (d/datoms db :avet :block/tags)
                        (map :e))
        blocks (->> (distinct (concat page-ids object-ids))
                    (map #(d/entity db %)))]
    (remove ldb/hidden? blocks)))

(defn- sanitize
  [content]
  (some-> content
          (fuzzy/search-normalize true)))

(defn block->index
  "Convert a block to the index for searching"
  [{:block/keys [uuid page title] :as block}]
  (when-not (or
             (ldb/closed-value? block)
             (and (string? title) (> (count title) 10000))
             (string/blank? title))        ; empty page or block
      ;; Should properties be included in the search indice?
      ;; It could slow down the search indexing, also it can be confusing
      ;; if the showing properties are not useful to users.
      ;; (let [content (if (and db-based? (seq (:block/properties block)))
      ;;                 (str content (when (not= content "") "\n") (get-db-properties-str db properties))
      ;;                 content)])
    (when uuid
      {:id (str uuid)
       :page (str (or (:block/uuid page) uuid))
       :title (if (page-or-object? block) title (sanitize title))})))

(defn build-fuzzy-search-indice
  "Build a block title indice from scratch.
   Incremental page title indice is implemented in frontend.search.sync-search-indice!"
  [repo db]
  (let [blocks (->> (get-all-fuzzy-supported-blocks db)
                    (map block->index)
                    (bean/->js))
        indice (fuse. blocks
                      (clj->js {:keys ["title"]
                                :shouldSort true
                                :tokenize true
                                :distance 1024
                                :threshold 0.5 ;; search for 50% match from the start
                                :minMatchCharLength 1}))]
    (swap! fuzzy-search-indices assoc-in repo indice)
    indice))

(defn fuzzy-search
  "Return a list of blocks (pages && tagged blocks) that match the query. Takes the following
  options:
   * :limit - Number of result to limit search results. Defaults to 100"
  [repo db q {:keys [limit]
              :or {limit 100}}]
  (when repo
    (let [q (fuzzy/search-normalize q true)
          q (fuzzy/clean-str q)
          q (if (= \# (first q)) (subs q 1) q)]
      (when-not (string/blank? q)
        (let [indice (or (get @fuzzy-search-indices repo)
                         (build-fuzzy-search-indice repo db))
              result (->> (.search indice q (clj->js {:limit limit}))
                          (bean/->clj))]
          (->> (map :item result)
               (filter (fn [{:keys [title]}]
                         (exact-matched? q title)))))))))

(defn search-blocks
  "Options:
   * :page - the page to specifically search on
   * :limit - Number of result to limit search results. Defaults to 100
   * :built-in?  - Whether to return built-in pages for db graphs. Defaults to false"
  [repo conn search-db q {:keys [limit page enable-snippet?
                                 built-in?] :as option
                          :or {enable-snippet? true}}]
  (when-not (string/blank? q)
    (p/let [match-input (get-match-input q)
            limit  (or limit 100)
            ;; https://www.sqlite.org/fts5.html#the_highlight_function
            ;; the 2nd column in blocks_fts (content)
            ;; pfts_2lqh is a key for retrieval
            ;; highlight and snippet only works for some matching with high rank
            snippet-aux "snippet(blocks_fts, 1, '$pfts_2lqh>$', '$<pfts_2lqh$', '...', 32)"
            select (if enable-snippet?
                     (str "select id, page, title, " snippet-aux " from blocks_fts where ")
                     "select id, page, title from blocks_fts where ")
            pg-sql (if page "page = ? and" "")
            match-sql (str select
                           pg-sql
                           " title match ? order by rank limit ?")
            matched-result (search-blocks-aux search-db match-sql match-input page limit enable-snippet?)
            fuzzy-result (when-not page (fuzzy-search repo @conn q option))]
      (let [result (->> (concat fuzzy-result matched-result)
                        (common-util/distinct-by :id)
                        (keep (fn [result]
                                (let [{:keys [id page title snippet]} result
                                      block-id (uuid id)]
                                  (when-let [block (d/entity @conn [:block/uuid block-id])]
                                    (when-not (and (not built-in?) (ldb/built-in? block))
                                      {:db/id (:db/id block)
                                       :block/uuid block-id
                                       :block/title (or snippet title)
                                       :block/page (if (common-util/uuid-string? page)
                                                     (uuid page)
                                                     nil)
                                       :block/tags (seq (map :db/id (:block/tags block)))
                                       :page? (ldb/page? block)}))))))
            page-or-object-result (filter (fn [b] (or (:page? b) (:block/tags result))) result)]
        (->>
         (concat page-or-object-result
                 (remove (fn [b] (or (:page? b) (:block/tags result))) result))
         (common-util/distinct-by :block/uuid))))))

(defn truncate-table!
  [db]
  (drop-tables-and-triggers! db)
  (create-tables-and-triggers! db))

(comment
  (defn- property-value-when-closed
    "Returns property value if the given entity is type 'closed value' or nil"
    [ent]
    (when (= (:block/type ent) "closed value")
      (:block/title ent))))

(comment
  (defn- get-db-properties-str
    "Similar to db-pu/readable-properties but with a focus on making property values searchable"
    [db properties]
    (->> properties
         (keep
          (fn [[k v]]
            (let [property (d/entity db k)
                  values
                  (->> (if (set? v) v #{v})
                       (map (fn [val]
                              (if (= :db.type/ref (:db/valueType property))
                                (let [e (d/entity db (:db/id val))
                                      value (or
                                           ;; closed value
                                             (property-value-when-closed e)
                                           ;; :page or :date properties
                                             (:block/title e)
                                             ;; first child
                                             (let [parent-id (:db/id e)]
                                               (:block/title (ldb/get-first-child db parent-id))))]
                                  value)
                                val)))
                       (remove string/blank?))
                  hide? (get-in property [:block/schema :hide?])]
              (when (and (not hide?) (seq values))
                (str (:block/title property)
                     ": "
                     (string/join "; " values))))))
         (string/join ", "))))

(defn get-all-block-contents
  [db]
  (when db
    (->> (d/datoms db :avet :block/uuid)
         (map :v)
         (keep #(d/entity db [:block/uuid %])))))

(defn build-blocks-indice
  [repo db]
  (build-fuzzy-search-indice repo db)
  (->> (get-all-block-contents db)
       (keep block->index)
       (bean/->js)))

(defn- get-blocks-from-datoms-impl
  [repo {:keys [db-after db-before]} datoms]
  (when (seq datoms)
    (let [blocks-to-add-set (->> (filter :added datoms)
                                 (map :e)
                                 (set))
          blocks-to-remove-set (->> (remove :added datoms)
                                    (filter #(= :block/uuid (:a %)))
                                    (map :e)
                                    (set))
          blocks-to-add-set' (if (and (sqlite-util/db-based-graph? repo) (seq blocks-to-add-set))
                               (->> blocks-to-add-set
                                    (mapcat (fn [id] (map :db/id (:block/_refs (d/entity db-after id)))))
                                    (concat blocks-to-add-set)
                                    set)
                               blocks-to-add-set)]
      {:blocks-to-remove     (->>
                              (keep #(d/entity db-before %) blocks-to-remove-set)
                              (remove ldb/hidden?))
       :blocks-to-add        (->>
                              (keep #(d/entity db-after %) blocks-to-add-set')
                              (remove ldb/hidden?))})))

(defn- get-affected-blocks
  [repo tx-report]
  (let [data (:tx-data tx-report)
        datoms (filter
                (fn [datom]
                  ;; Capture any direct change on page display title, page ref or block content
                  (contains? #{:block/uuid :block/name :block/title :block/properties :block/schema} (:a datom)))
                data)]
    (when (seq datoms)
      (get-blocks-from-datoms-impl repo tx-report datoms))))

(defn sync-search-indice
  [repo tx-report]
  (let [{:keys [blocks-to-add blocks-to-remove]} (get-affected-blocks repo tx-report)]
    ;; update page title indice
    (let [fuzzy-blocks-to-add (filter page-or-object? blocks-to-add)
          fuzzy-blocks-to-remove (filter page-or-object? blocks-to-remove)]
      (when (or (seq fuzzy-blocks-to-add) (seq fuzzy-blocks-to-remove))
        (swap! fuzzy-search-indices update-in repo
               (fn [indice]
                 (when indice
                   (doseq [page-entity fuzzy-blocks-to-remove]
                     (.remove indice (fn [page] (= (str (:block/uuid page-entity)) (gobj/get page "id")))))
                   (doseq [page fuzzy-blocks-to-add]
                     (.remove indice (fn [p] (= (str (:block/uuid page)) (gobj/get p "id"))))
                     (.add indice (bean/->js (block->index page))))
                   indice)))))

    ;; update block indice
    (when (or (seq blocks-to-add) (seq blocks-to-remove))
      (let [blocks-to-add (keep block->index blocks-to-add)
            blocks-to-remove (set (map (comp str :block/uuid) blocks-to-remove))]
        {:blocks-to-remove-set blocks-to-remove
         :blocks-to-add        blocks-to-add}))))
