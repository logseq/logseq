(ns logseq.publish.meta-store
  "Handles storing Durable Object in SQLite"
  (:require [clojure.string :as string]
            [logseq.publish.common :as publish-common])
  (:require-macros [logseq.publish.async :refer [js-await]]))

(defn init-schema! [sql]
  (let [cols (publish-common/get-sql-rows (publish-common/sql-exec sql "PRAGMA table_info(pages);"))
        drop? (some #(contains? #{"page_id" "graph"} (aget % "name")) cols)]
    (when drop?
      (publish-common/sql-exec sql "DROP TABLE IF EXISTS pages;"))
    (publish-common/sql-exec sql
                             (str "CREATE TABLE IF NOT EXISTS pages ("
                                  "page_uuid TEXT NOT NULL,"
                                  "page_title TEXT,"
                                  "page_tags TEXT,"
                                  "graph_uuid TEXT NOT NULL,"
                                  "schema_version TEXT,"
                                  "block_count INTEGER,"
                                  "content_hash TEXT NOT NULL,"
                                  "content_length INTEGER,"
                                  "r2_key TEXT NOT NULL,"
                                  "owner_sub TEXT,"
                                  "owner_username TEXT,"
                                  "created_at INTEGER,"
                                  "updated_at INTEGER,"
                                  "password_hash TEXT,"
                                  "PRIMARY KEY (graph_uuid, page_uuid)"
                                  ");"))
    (let [cols (publish-common/get-sql-rows (publish-common/sql-exec sql "PRAGMA table_info(pages);"))
          col-names (set (map #(aget % "name") cols))]
      (when-not (contains? col-names "page_title")
        (publish-common/sql-exec sql "ALTER TABLE pages ADD COLUMN page_title TEXT;"))
      (when-not (contains? col-names "page_tags")
        (publish-common/sql-exec sql "ALTER TABLE pages ADD COLUMN page_tags TEXT;"))
      (when-not (contains? col-names "short_id")
        (publish-common/sql-exec sql "ALTER TABLE pages ADD COLUMN short_id TEXT;"))
      (when-not (contains? col-names "owner_username")
        (publish-common/sql-exec sql "ALTER TABLE pages ADD COLUMN owner_username TEXT;"))
      (when-not (contains? col-names "password_hash")
        (publish-common/sql-exec sql "ALTER TABLE pages ADD COLUMN password_hash TEXT;")))
    (let [cols (publish-common/get-sql-rows (publish-common/sql-exec sql "PRAGMA table_info(page_refs);"))
          col-names (set (map #(aget % "name") cols))]
      (when (seq col-names)
        (when-not (contains? col-names "target_page_title")
          (publish-common/sql-exec sql "ALTER TABLE page_refs ADD COLUMN target_page_title TEXT;"))
        (when-not (contains? col-names "target_page_name")
          (publish-common/sql-exec sql "ALTER TABLE page_refs ADD COLUMN target_page_name TEXT;"))))
    (publish-common/sql-exec sql
                             (str "CREATE TABLE IF NOT EXISTS page_refs ("
                                  "graph_uuid TEXT NOT NULL,"
                                  "target_page_uuid TEXT NOT NULL,"
                                  "target_page_title TEXT,"
                                  "target_page_name TEXT,"
                                  "source_page_uuid TEXT NOT NULL,"
                                  "source_page_title TEXT,"
                                  "source_block_uuid TEXT,"
                                  "source_block_content TEXT,"
                                  "source_block_format TEXT,"
                                  "updated_at INTEGER,"
                                  "PRIMARY KEY (graph_uuid, target_page_uuid, source_block_uuid)"
                                  ");"))
    (publish-common/sql-exec sql
                             (str "CREATE TABLE IF NOT EXISTS page_tags ("
                                  "graph_uuid TEXT NOT NULL,"
                                  "tag_page_uuid TEXT NOT NULL,"
                                  "tag_title TEXT,"
                                  "source_page_uuid TEXT NOT NULL,"
                                  "source_page_title TEXT,"
                                  "source_block_uuid TEXT NOT NULL,"
                                  "source_block_content TEXT,"
                                  "source_block_format TEXT,"
                                  "updated_at INTEGER,"
                                  "PRIMARY KEY (graph_uuid, tag_page_uuid, source_block_uuid)"
                                  ");"))
    (publish-common/sql-exec sql
                             (str "CREATE TABLE IF NOT EXISTS page_blocks ("
                                  "graph_uuid TEXT NOT NULL,"
                                  "page_uuid TEXT NOT NULL,"
                                  "block_uuid TEXT NOT NULL,"
                                  "block_content TEXT,"
                                  "updated_at INTEGER,"
                                  "PRIMARY KEY (graph_uuid, block_uuid)"
                                  ");"))))

(defn parse-page-tags [value]
  (cond
    (nil? value) #js []
    (array? value) value
    (string? value) (try
                      (js/JSON.parse value)
                      (catch :default _
                        #js []))
    :else #js []))

(defn row->meta [row]
  (let [data (js->clj row :keywordize-keys false)
        page-tags (parse-page-tags (get data "page_tags"))
        short-id (get data "short_id")]
    (assoc data
           "graph" (get data "graph_uuid")
           "page_tags" page-tags
           "short_id" short-id
           "short_url" (when short-id (str "/p/" short-id))
           "content_hash" (get data "content_hash")
           "content_length" (get data "content_length"))))

(defn ^:large-vars/cleanup-todo do-fetch [^js self request]
  (let [sql (.-sql self)]
    (init-schema! sql)
    (cond
      (= "POST" (.-method request))
      (js-await [body (.json request)]
                (let [page-uuid (aget body "page_uuid")
                      graph-uuid (aget body "graph")]
                  (if (and (string? page-uuid) (string? graph-uuid))
                    (publish-common/sql-exec sql
                                             (str "INSERT INTO pages ("
                                                  "page_uuid,"
                                                  "page_title,"
                                                  "page_tags,"
                                                  "graph_uuid,"
                                                  "schema_version,"
                                                  "block_count,"
                                                  "content_hash,"
                                                  "content_length,"
                                                  "r2_key,"
                                                  "owner_sub,"
                                                  "owner_username,"
                                                  "created_at,"
                                                  "updated_at,"
                                                  "short_id,"
                                                  "password_hash"
                                                  ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                                                  " ON CONFLICT(graph_uuid, page_uuid) DO UPDATE SET"
                                                  " page_uuid=excluded.page_uuid,"
                                                  " page_title=excluded.page_title,"
                                                  " page_tags=excluded.page_tags,"
                                                  " schema_version=excluded.schema_version,"
                                                  " block_count=excluded.block_count,"
                                                  " content_hash=excluded.content_hash,"
                                                  " content_length=excluded.content_length,"
                                                  " r2_key=excluded.r2_key,"
                                                  " owner_sub=excluded.owner_sub,"
                                                  " owner_username=excluded.owner_username,"
                                                  " updated_at=excluded.updated_at,"
                                                  " short_id=excluded.short_id,"
                                                  " password_hash=excluded.password_hash;")
                                             page-uuid
                                             (aget body "page_title")
                                             (aget body "page_tags")
                                             graph-uuid
                                             (aget body "schema_version")
                                             (aget body "block_count")
                                             (aget body "content_hash")
                                             (aget body "content_length")
                                             (aget body "r2_key")
                                             (aget body "owner_sub")
                                             (aget body "owner_username")
                                             (aget body "created_at")
                                             (aget body "updated_at")
                                             (aget body "short_id")
                                             (aget body "password_hash"))
                    (throw (js/Error. "publish: missing page_uuid or graph")))
                  (let [refs (aget body "refs")
                        tagged-nodes (aget body "tagged_nodes")
                        blocks (aget body "blocks")
                        graph-uuid (aget body "graph")
                        page-uuid (aget body "page_uuid")]
                    (when (and graph-uuid page-uuid)
                      (publish-common/sql-exec sql
                                               "DELETE FROM page_refs WHERE graph_uuid = ? AND source_page_uuid = ?;"
                                               graph-uuid
                                               page-uuid)
                      (publish-common/sql-exec sql
                                               "DELETE FROM page_tags WHERE graph_uuid = ? AND source_page_uuid = ?;"
                                               graph-uuid
                                               page-uuid)
                      (doseq [ref refs]
                        (publish-common/sql-exec sql
                                                 (str "INSERT OR REPLACE INTO page_refs ("
                                                      "graph_uuid, target_page_uuid, target_page_title, target_page_name, source_page_uuid, "
                                                      "source_page_title, source_block_uuid, source_block_content, "
                                                      "source_block_format, updated_at"
                                                      ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);")
                                                 (aget ref "graph_uuid")
                                                 (aget ref "target_page_uuid")
                                                 (aget ref "target_page_title")
                                                 (aget ref "target_page_name")
                                                 (aget ref "source_page_uuid")
                                                 (aget ref "source_page_title")
                                                 (aget ref "source_block_uuid")
                                                 (aget ref "source_block_content")
                                                 (aget ref "source_block_format")
                                                 (aget ref "updated_at")))

                      (doseq [tag tagged-nodes]
                        (publish-common/sql-exec sql
                                                 (str "INSERT OR REPLACE INTO page_tags ("
                                                      "graph_uuid, tag_page_uuid, tag_title, source_page_uuid, "
                                                      "source_page_title, source_block_uuid, source_block_content, "
                                                      "source_block_format, updated_at"
                                                      ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);")
                                                 (aget tag "graph_uuid")
                                                 (aget tag "tag_page_uuid")
                                                 (aget tag "tag_title")
                                                 (aget tag "source_page_uuid")
                                                 (aget tag "source_page_title")
                                                 (aget tag "source_block_uuid")
                                                 (aget tag "source_block_content")
                                                 (aget tag "source_block_format")
                                                 (aget tag "updated_at"))))
                    (publish-common/sql-exec sql
                                             "DELETE FROM page_blocks WHERE graph_uuid = ? AND page_uuid = ?;"
                                             graph-uuid
                                             page-uuid)
                    (doseq [block blocks]
                      (publish-common/sql-exec sql
                                               (str "INSERT OR REPLACE INTO page_blocks ("
                                                    "graph_uuid, page_uuid, block_uuid, block_content, updated_at"
                                                    ") VALUES (?, ?, ?, ?, ?);")
                                               (aget body "graph")
                                               (aget block "page_uuid")
                                               (aget block "block_uuid")
                                               (aget block "block_content")
                                               (aget block "updated_at"))))
                  (publish-common/json-response {:ok true})))

      (= "GET" (.-method request))
      (let [url (js/URL. (.-url request))
            parts (string/split (.-pathname url) #"/")
            graph-uuid (nth parts 2 nil)
            page-uuid (nth parts 3 nil)]
        (cond
          (= (nth parts 1 nil) "search")
          (let [graph-uuid (nth parts 2 nil)
                query (.get (.-searchParams url) "q")
                query (some-> query string/trim)
                query (when (and query (not (string/blank? query)))
                        (string/lower-case query))]
            (if (or (string/blank? graph-uuid) (string/blank? query))
              (publish-common/bad-request "missing graph uuid or query")
              (let [like-query (str "%" query "%")
                    pages (publish-common/get-sql-rows
                           (publish-common/sql-exec sql
                                                    (str "SELECT page_uuid, page_title, short_id "
                                                         "FROM pages "
                                                         "WHERE graph_uuid = ? "
                                                         "AND password_hash IS NULL "
                                                         "AND page_title IS NOT NULL "
                                                         "AND lower(page_title) LIKE ? "
                                                         "ORDER BY updated_at DESC "
                                                         "LIMIT 20;")
                                                    graph-uuid
                                                    like-query))
                    blocks (publish-common/get-sql-rows
                            (publish-common/sql-exec sql
                                                     (str "SELECT page_blocks.page_uuid, page_blocks.block_uuid, "
                                                          "page_blocks.block_content, pages.page_title, pages.short_id "
                                                          "FROM page_blocks "
                                                          "LEFT JOIN pages "
                                                          "ON pages.graph_uuid = page_blocks.graph_uuid "
                                                          "AND pages.page_uuid = page_blocks.page_uuid "
                                                          "WHERE page_blocks.graph_uuid = ? "
                                                          "AND pages.password_hash IS NULL "
                                                          "AND page_blocks.block_content IS NOT NULL "
                                                          "AND lower(page_blocks.block_content) LIKE ? "
                                                          "ORDER BY page_blocks.updated_at DESC "
                                                          "LIMIT 50;")
                                                     graph-uuid
                                                     like-query))]
                (publish-common/json-response {:pages pages :blocks blocks}))))

          (= (nth parts 1 nil) "tag")
          (let [tag-name (when-let [raw (nth parts 2 nil)]
                           (js/decodeURIComponent raw))
                tagged-rows (publish-common/get-sql-rows
                             (publish-common/sql-exec sql
                                                      (str "SELECT page_tags.graph_uuid, page_tags.tag_page_uuid, page_tags.tag_title, "
                                                           "page_tags.source_page_uuid, page_tags.source_page_title, page_tags.source_block_uuid, "
                                                           "page_tags.source_block_content, page_tags.source_block_format, page_tags.updated_at, "
                                                           "pages.short_id "
                                                           "FROM page_tags "
                                                           "LEFT JOIN pages "
                                                           "ON pages.graph_uuid = page_tags.graph_uuid "
                                                           "AND pages.page_uuid = page_tags.source_page_uuid "
                                                           "WHERE page_tags.tag_title = ? "
                                                           "ORDER BY page_tags.updated_at DESC;")
                                                      tag-name))
                page-rows (publish-common/get-sql-rows
                           (publish-common/sql-exec sql
                                                    (str "SELECT page_tags.graph_uuid, page_tags.source_page_uuid, page_tags.source_page_title, "
                                                         "pages.short_id, "
                                                         "MAX(page_tags.updated_at) AS updated_at "
                                                         "FROM page_tags "
                                                         "LEFT JOIN pages "
                                                         "ON pages.graph_uuid = page_tags.graph_uuid "
                                                         "AND pages.page_uuid = page_tags.source_page_uuid "
                                                         "WHERE page_tags.tag_title = ? "
                                                         "GROUP BY page_tags.graph_uuid, page_tags.source_page_uuid, page_tags.source_page_title, pages.short_id "
                                                         "ORDER BY updated_at DESC;")
                                                    tag-name))]
            (publish-common/json-response {:pages (map (fn [row]
                                                         (js->clj row :keywordize-keys false))
                                                       page-rows)
                                           :tagged_nodes (map (fn [row]
                                                                (js->clj row :keywordize-keys false))
                                                              tagged-rows)}))

          (= (nth parts 1 nil) "ref")
          (let [ref-name (when-let [raw (nth parts 2 nil)]
                           (js/decodeURIComponent raw))
                rows (publish-common/get-sql-rows
                      (publish-common/sql-exec sql
                                               (str "SELECT page_refs.graph_uuid, page_refs.source_page_uuid, page_refs.source_page_title, "
                                                    "pages.short_id, "
                                                    "MAX(page_refs.updated_at) AS updated_at "
                                                    "FROM page_refs "
                                                    "LEFT JOIN pages "
                                                    "ON pages.graph_uuid = page_refs.graph_uuid "
                                                    "AND pages.page_uuid = page_refs.source_page_uuid "
                                                    "WHERE (lower(page_refs.target_page_title) = lower(?)) "
                                                    "OR (page_refs.target_page_name = lower(?)) "
                                                    "GROUP BY page_refs.graph_uuid, page_refs.source_page_uuid, page_refs.source_page_title, pages.short_id "
                                                    "ORDER BY updated_at DESC;")
                                               ref-name
                                               ref-name))]
            (publish-common/json-response {:pages (map (fn [row]
                                                         (js->clj row :keywordize-keys false))
                                                       rows)}))

          (= (nth parts 1 nil) "short")
          (let [short-id (nth parts 2 nil)
                rows (publish-common/get-sql-rows
                      (publish-common/sql-exec sql
                                               (str "SELECT page_uuid, graph_uuid, page_title, short_id "
                                                    "FROM pages WHERE short_id = ? LIMIT 1;")
                                               short-id))
                row (first rows)]
            (publish-common/json-response {:page (when row (js->clj row :keywordize-keys false))}))

          (= (nth parts 1 nil) "user")
          (let [raw-username (nth parts 2 nil)
                username (when raw-username (js/decodeURIComponent raw-username))
                rows (publish-common/get-sql-rows
                      (publish-common/sql-exec sql
                                               (str "SELECT page_uuid, page_title, short_id, graph_uuid, updated_at, owner_username "
                                                    "FROM pages WHERE owner_username = ? ORDER BY updated_at DESC;")
                                               username))]
            (publish-common/json-response {:user {:username username}
                                           :pages (map (fn [row]
                                                         (js->clj row :keywordize-keys false))
                                                       rows)}))

          (= (nth parts 4 nil) "password")
          (let [rows (publish-common/get-sql-rows
                      (publish-common/sql-exec sql
                                               (str "SELECT password_hash "
                                                    "FROM pages WHERE graph_uuid = ? AND page_uuid = ? LIMIT 1;")
                                               graph-uuid
                                               page-uuid))
                row (first rows)]
            (if-not row
              (publish-common/not-found)
              (publish-common/json-response {:password_hash (aget row "password_hash")})))

          (= (nth parts 4 nil) "refs")
          (let [rows (publish-common/get-sql-rows
                      (publish-common/sql-exec sql
                                               (str "SELECT graph_uuid, target_page_uuid, source_page_uuid, "
                                                    "target_page_title, target_page_name, source_page_title, source_block_uuid, source_block_content, "
                                                    "source_block_format, updated_at "
                                                    "FROM page_refs WHERE graph_uuid = ? AND target_page_uuid = ? "
                                                    "ORDER BY updated_at DESC;")
                                               graph-uuid
                                               page-uuid))]
            (publish-common/json-response {:refs (map (fn [row]
                                                        (js->clj row :keywordize-keys false))
                                                      rows)}))

          (= (nth parts 4 nil) "tagged_nodes")
          (let [rows (publish-common/get-sql-rows
                      (publish-common/sql-exec sql
                                               (str "SELECT graph_uuid, tag_page_uuid, tag_title, source_page_uuid, "
                                                    "source_page_title, source_block_uuid, source_block_content, "
                                                    "source_block_format, updated_at "
                                                    "FROM page_tags WHERE graph_uuid = ? AND tag_page_uuid = ? "
                                                    "ORDER BY updated_at DESC;")
                                               graph-uuid
                                               page-uuid))]
            (publish-common/json-response {:tagged_nodes (map (fn [row]
                                                                (js->clj row :keywordize-keys false))
                                                              rows)}))

          (and graph-uuid page-uuid)
          (let [rows (publish-common/get-sql-rows
                      (publish-common/sql-exec sql
                                               (str "SELECT page_uuid, page_title, page_tags, short_id, graph_uuid, schema_version, block_count, "
                                                    "content_hash, content_length, r2_key, owner_sub, owner_username, created_at, updated_at "
                                                    "FROM pages WHERE graph_uuid = ? AND page_uuid = ? LIMIT 1;")
                                               graph-uuid
                                               page-uuid))
                row (first rows)]
            (if-not row
              (publish-common/not-found)
              (publish-common/json-response (row->meta row))))

          graph-uuid
          (let [rows (publish-common/get-sql-rows
                      (publish-common/sql-exec sql
                                               (str "SELECT page_uuid, page_title, page_tags, short_id, graph_uuid, schema_version, block_count, "
                                                    "content_hash, content_length, r2_key, owner_sub, owner_username, created_at, updated_at "
                                                    "FROM pages WHERE graph_uuid = ? ORDER BY updated_at DESC;")
                                               graph-uuid))]
            (publish-common/json-response {:pages (map row->meta rows)}))

          :else
          (let [rows (publish-common/get-sql-rows
                      (publish-common/sql-exec sql
                                               (str "SELECT page_uuid, page_title, page_tags, short_id, graph_uuid, schema_version, block_count, "
                                                    "content_hash, content_length, r2_key, owner_sub, owner_username, created_at, updated_at "
                                                    "FROM pages ORDER BY updated_at DESC;")))]
            (publish-common/json-response {:pages (map row->meta rows)}))))

      (= "DELETE" (.-method request))
      (let [url (js/URL. (.-url request))
            parts (string/split (.-pathname url) #"/")
            graph-uuid (nth parts 2 nil)
            page-uuid (nth parts 3 nil)]
        (cond
          (and graph-uuid page-uuid)
          (do
            (publish-common/sql-exec sql
                                     "DELETE FROM pages WHERE graph_uuid = ? AND page_uuid = ?;"
                                     graph-uuid
                                     page-uuid)
            (publish-common/sql-exec sql
                                     "DELETE FROM page_refs WHERE graph_uuid = ? AND source_page_uuid = ?;"
                                     graph-uuid
                                     page-uuid)
            (publish-common/sql-exec sql
                                     "DELETE FROM page_tags WHERE graph_uuid = ? AND source_page_uuid = ?;"
                                     graph-uuid
                                     page-uuid)
            (publish-common/json-response {:ok true}))

          graph-uuid
          (do
            (publish-common/sql-exec sql "DELETE FROM pages WHERE graph_uuid = ?;" graph-uuid)
            (publish-common/sql-exec sql "DELETE FROM page_refs WHERE graph_uuid = ?;" graph-uuid)
            (publish-common/sql-exec sql "DELETE FROM page_tags WHERE graph_uuid = ?;" graph-uuid)
            (publish-common/json-response {:ok true}))

          :else
          (publish-common/bad-request "missing graph uuid or page uuid")))

      :else
      (publish-common/json-response {:error "method not allowed"} 405))))
