(ns frontend.worker.search
  "Full-text and fuzzy search"
  (:require [cljs-bean.core :as bean]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.common.search-fuzzy :as fuzzy]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.util.namespace :as ns-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.content :as db-content]
            [logseq.graph-parser.text :as text]))

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

(defn- create-blocks-title-index!
  [db]
  (.exec db "CREATE INDEX IF NOT EXISTS blocks_title_nocase_idx ON blocks(title COLLATE NOCASE)"))

(defn create-tables-and-triggers!
  "Open a SQLite db for search index"
  [db]
  (try
    (create-blocks-table! db)
    (create-blocks-fts-table! db)
    (create-blocks-title-index! db)
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

(def ^:private upsert-blocks-batch-size 2000)

(def ^:private upsert-blocks-sql
  (memoize
   (fn [row-count]
     (str "INSERT INTO blocks (id, title, page) VALUES "
          (string/join ", " (repeat row-count "(?, ?, ?)"))
          " ON CONFLICT (id) DO UPDATE SET (title, page) = (excluded.title, excluded.page)"))))

(defn- valid-upsert-block?
  [item]
  (and (common-util/uuid-string? (.-id item))
       (common-util/uuid-string? (.-page item))))

(defn- throw-upsert-blocks-error!
  [item]
  (js/console.error "Upsert blocks wrong data: ")
  (js/console.dir item)
  (throw (ex-info "Search upsert-blocks wrong data: "
                  (bean/->clj item))))

(defn- upsert-bind-params
  [batch]
  (into-array
   (mapcat (fn [item]
             [(.-id item) (.-title item) (.-page item)])
           batch)))

(defn upsert-blocks!
  [^Object db blocks]
  (assert db ::upsert-blocks!)
  (.transaction db (fn [tx]
                     (doseq [batch (partition-all upsert-blocks-batch-size blocks)]
                       (doseq [item batch]
                         (when-not (valid-upsert-block? item)
                           (throw-upsert-blocks-error! item)))
                       (.exec tx #js {:sql (upsert-blocks-sql (count batch))
                                      :bind (upsert-bind-params batch)})))))

(defn delete-blocks!
  [db ids]
  (assert db ::delete-blocks!)
  (let [sql (str "DELETE from blocks WHERE id IN " (clj-list->sql ids))]
    (.exec db sql)))

(def ^:private max-snippet-length 250)
(def ^:private snippet-prefix-length 50)
(def ^:private snippet-merge-distance 200)
(def ^:private snippet-highlight-start "$pfts_2lqh>$")
(def ^:private snippet-highlight-end "$<pfts_2lqh$")
(def ^:private snippet-ellipsis "\u00A0\u00A0\u00A0...\u00A0\u00A0\u00A0") ;; \u00A0 is No-Break Space (NBSP)
(def ^:private query-boolean-operators #{"and" "or" "not" "|" "&"})
(def ^:private query-break-chars #{\, \. \; \! \? \uFF0C \u3002 \uFF1B \uFF01 \uFF1F \u3001}) ;; , . ; ! ? ， 。 ； ！ ？ 、

(defn- query->terms
  [q]
  (->> (string/split (string/trim q) #"\s+")
       (remove string/blank?)
       (remove #(contains? query-boolean-operators (string/lower-case %)))))

(defn- overlap-match?
  [{idx-1 :idx end-1 :end}
   {idx-2 :idx end-2 :end}]
  (and (< idx-1 end-2)
       (< idx-2 end-1)))

(defn- find-non-overlap-term-match
  [text-lc term selected-matches]
  (let [term-lc (string/lower-case term)
        term-len (count term)]
    (loop [from 0]
      (when-let [idx (string/index-of text-lc term-lc from)]
        (let [match {:term term
                     :idx idx
                     :len term-len
                     :end (+ idx term-len)}]
          (if (some #(overlap-match? match %) selected-matches)
            (recur (inc idx))
            match))))))

(defn- find-matches
  ([text terms]
   (find-matches text terms <))
  ([text terms sort-fn]
   (let [text-lc (string/lower-case text)]
     (->> terms
          (map-indexed vector)
          (sort-by (fn [[order term]]
                     [(- (count term)) order]))
          (reduce (fn [selected-matches [_ term]]
                    (if-let [match (find-non-overlap-term-match text-lc term selected-matches)]
                      (conj selected-matches match)
                      selected-matches))
                  [])
          (sort-by :idx sort-fn)))))

(defn- find-break-before
  [s start end]
  (loop [i (dec end)]
    (if (< i start)
      nil
      (if (contains? query-break-chars (.charAt s i))
        i
        (recur (dec i))))))

(defn- snippet-window-around
  [text idx match-len window-len]
  (let [text-len (count text)
        window-start (max 0 (- idx (quot window-len 2)))
        min-end (min text-len (+ idx match-len))
        window-end (min text-len (max min-end (+ window-start window-len)))
        break-idx (find-break-before text window-start idx)
        snippet-start (min window-end (max window-start (if break-idx (inc break-idx) window-start)))
        snippet-end (min text-len (+ snippet-start window-len))
        snippet (subs text snippet-start snippet-end)]
    ;; (prn :debug {:snippet snippet :snippet-start snippet-start :snippet-end snippet-end})
    snippet))

(defn- highlight-terms
  [text terms max-len]
  (let [clipped-text (if (> (count text) max-len)
                       (subs text 0 max-len)
                       text)
        matches (find-matches clipped-text terms >)]
    (reduce
     (fn [acc {:keys [idx len]}]
       (str (subs acc 0 idx)
            snippet-highlight-start
            (subs acc idx (+ idx len))
            snippet-highlight-end
            (subs acc (+ idx len))))
     clipped-text
     matches)))

(defn- enough-highlighted?
  [text num]
  (loop [from 0
         cnt 0]
    (let [idx (string/index-of text snippet-highlight-start from)]
      (cond
        (nil? idx) false
        (>= (inc cnt) num) true
        :else (recur (+ idx (count snippet-highlight-start)) (inc cnt))))))

(defn- strip-highlight-markers
  [s]
  (some-> s
          (string/replace snippet-highlight-start "")
          (string/replace snippet-highlight-end "")))

(defn- keep-result-tail?
  [result text]
  (let [plain-result (strip-highlight-markers result)
        last-ellipsis-idx (string/last-index-of plain-result snippet-ellipsis)
        tail-part (if (some? last-ellipsis-idx)
                    (subs plain-result (+ last-ellipsis-idx (count snippet-ellipsis)))
                    plain-result)]
    (or (string/blank? tail-part)
        (string/ends-with? text tail-part))))

(defn ensure-highlighted-snippet
  "Ensure snippet includes SQLite-style highlight markers. Uses `title` as a fallback
  when snippet is missing or unhighlighted."
  [snippet title q]
  (let [base (or snippet title)
        text (or title snippet)
        terms (query->terms q)
        expect-highlight-num (if (> (count terms) 2) 2 (count terms))]
    ;; (prn :debug {:snippet snippet :title title :q q :terms terms})
    (cond
      (string/blank? base) base
      (string/blank? q) base
      (and (enough-highlighted? base expect-highlight-num)
           (string/includes? text (some-> snippet
                                          strip-highlight-markers
                                          (string/replace #"^(?:\.{3})|(?:\.{3})$" "")))) base
      :else
      (let [text (strip-highlight-markers text)
            matches (and text (find-matches text terms))]
        (if (seq matches)
          (let [prefix (subs text 0 (min snippet-prefix-length (count text)))
                merged-window-len (max 0 (- max-snippet-length snippet-prefix-length (count snippet-ellipsis)))
                split-window-len (max 0 (quot (- max-snippet-length snippet-prefix-length (* 2 (count snippet-ellipsis))) 2))
                match-terms (map :term matches)
                {:keys [term idx len end]} (first matches)
                match-2 (second matches)
                term-2 (:term match-2)
                idx-2 (:idx match-2)
                len-2 (:len match-2)
                end-2 (:end match-2)
                use-window? (and (> (count text) max-snippet-length)
                                 (>= (or end-2 end) max-snippet-length))
                close? (and end-2 (<= (- end-2 idx) snippet-merge-distance))
                use-merge? (or (nil? idx-2) close?)
                result (if-not use-window?
                         (highlight-terms text terms max-snippet-length)
                         (if use-merge?
                           (let [snippet (snippet-window-around text idx len merged-window-len)]
                             (str prefix snippet-ellipsis (highlight-terms snippet match-terms merged-window-len)))
                           (let [prefix-len (count prefix)
                                 prefix-full-hit? (and (< idx prefix-len)
                                                       (<= end prefix-len))
                                 cross-prefix-hit? (and (< idx prefix-len)
                                                        (> end prefix-len))]
                             (cond
                               prefix-full-hit?
                               (let [snippet-2 (snippet-window-around text idx-2 len-2 split-window-len)
                                     highlighted-prefix (highlight-terms prefix [term] snippet-prefix-length)]
                                 (str highlighted-prefix
                                      snippet-ellipsis
                                      (highlight-terms snippet-2 [term-2] split-window-len)))

                               cross-prefix-hit?
                               (let [prefix-for-split (subs text 0 (min end (count text)))
                                     cross-window-len (max 0 (- max-snippet-length
                                                                (count prefix-for-split)
                                                                (count snippet-ellipsis)))
                                     snippet-2 (snippet-window-around text idx-2 len-2 cross-window-len)
                                     highlighted-prefix (highlight-terms prefix-for-split [term] (count prefix-for-split))]
                                 (str highlighted-prefix
                                      snippet-ellipsis
                                      (highlight-terms snippet-2 [term-2] cross-window-len)))

                               :else
                               (let [snippet (snippet-window-around text idx len split-window-len)
                                     snippet-2 (snippet-window-around text idx-2 len-2 split-window-len)]
                                 (str prefix
                                      snippet-ellipsis
                                      (highlight-terms snippet [term] split-window-len)
                                      snippet-ellipsis
                                      (highlight-terms snippet-2 [term-2] split-window-len)))))))]
            ;; (prn :debug {:matches matches :use-window? use-window? :close? close? :use-merge? use-merge?})
            (if (and (string? result)
                     (not (string/ends-with? result "..."))
                     (not (keep-result-tail? result text)))
              (str result "...")
              result))
          base)))))

(defn- fts-phrase-input
  [match-input]
  (str "\"" (string/replace match-input "\"" "\"\"") "\"*"))

(defn- dangling-boolean-operator?
  [match-input]
  (boolean (re-find #"(?:^|\s)(?:AND|OR|NOT)\s*$" match-input)))

(defn- get-match-input
  [q]
  (let [match-input (-> q
                        (string/replace " and " " AND ")
                        (string/replace " & " " AND ")
                        (string/replace " or " " OR ")
                        (string/replace " | " " OR ")
                        (string/replace " not " " NOT "))]
    (cond
      (dangling-boolean-operator? match-input)
      (fts-phrase-input match-input)

      (and (re-find #"[^\w\s]" q)
           (or (string/includes? match-input "\"")
               (not (some #(string/includes? match-input %) ["AND" "OR" "NOT"]))
               (string/includes? q "/")))            ; punctuations
      (fts-phrase-input match-input)

      (not= q match-input)
      (string/replace match-input "," "")

      :else
      match-input)))

(defn- build-search-bind
  [q input page limit use-namespace-last-part?]
  (let [namespace? (and use-namespace-last-part?
                        (ns-util/namespace-page? q))
        last-part (when namespace?
                    (some-> (text/get-namespace-last-part q)
                            get-match-input))]
    (cond
      (and namespace? page)
      [page input last-part limit]
      page
      [page input limit]
      namespace?
      [input last-part limit]
      :else
      [input limit])))

(defn- search-blocks-aux
  ([db sql q input page limit]
   (search-blocks-aux db sql q input page limit false))
  ([db sql q input page limit use-namespace-last-part?]
   (try
     (let [bind (build-search-bind q input page limit use-namespace-last-part?)
           result (.exec db (bean/->js
                             {:sql sql
                              :bind bind
                              :rowMode "array"}))
           blocks (bean/->clj result)]
       (keep (fn [block]
               (let [[id page title _rank snippet] block]
                 (when title
                   {:id id
                    :keyword-score (fuzzy/score q title)
                    :page page
                    :title title
                    :snippet snippet}))) blocks))
     (catch :default e
       (prn :debug "Search blocks failed: ")
       (js/console.error e)))))

(def fuzzy-search-candidate-multiplier 4)
(def fuzzy-search-min-candidate-limit 40)
(def fuzzy-search-max-candidate-limit 400)

(defn- fuzzy-candidate-limit
  [limit]
  (-> (* fuzzy-search-candidate-multiplier limit)
      (max fuzzy-search-min-candidate-limit)
      (min fuzzy-search-max-candidate-limit)))

(defn- like-escape-char
  [c]
  (let [s (str c)]
    (if (#{"%" "_" "\\"} s)
      (str "\\" s)
      s)))

(defn- fuzzy-like-pattern
  [q]
  (str "%" (string/join "%" (map like-escape-char q)) "%"))

(defn- exec-search-blocks-fuzzy
  [db sql bind]
  (-> (.exec db (bean/->js
                 {:sql sql
                  :bind bind
                  :rowMode "array"}))
      bean/->clj))

(defn- fuzzy-block-rows->results
  [q blocks]
  (->> blocks
       (keep (fn [[id page title]]
               (when title
                 (let [keyword-score (fuzzy/score q title)]
                   (when (pos? keyword-score)
                     {:id id
                      :keyword-score keyword-score
                      :page page
                      :title title})))))
       (sort-by (juxt (fn [{:keys [id page]}]
                        (not= id page))
                      (comp - :keyword-score)))))

(defn- multi-term-query?
  [q]
  (boolean (re-find #"\S\s+\S" q)))

(defn- exact-title-query?
  [q]
  (not (re-find #"\s" q)))

(defn- search-blocks-exact-title-aux
  [db q page limit]
  (try
    (let [sql (str "select id, page, title from blocks where "
                   (if page "page = ? and " "")
                   "title = ? COLLATE NOCASE limit ?")
          bind (if page [page q limit] [q limit])
          blocks (exec-search-blocks-fuzzy db sql bind)]
      (fuzzy-block-rows->results q blocks))
    (catch :default e
      (prn :debug "Exact title search blocks failed: ")
      (js/console.error e))))

(defn- search-blocks-fuzzy-aux
  [db q page limit]
  (let [q (some-> q
                  (fuzzy/search-normalize true)
                  fuzzy/clean-str)
        q (if (= \# (first q)) (subs q 1) q)]
    (when-not (string/blank? q)
      (try
        (let [candidate-limit (fuzzy-candidate-limit limit)
              pattern (fuzzy-like-pattern q)
              blocks (if page
                       (exec-search-blocks-fuzzy
                        db
                        "select id, page, title from blocks where page = ? and lower(title) like ? escape '\\' limit ?"
                        [page pattern candidate-limit])
                       (let [page-blocks (exec-search-blocks-fuzzy
                                          db
                                          "select id, page, title from blocks where id = page and lower(title) like ? escape '\\' limit ?"
                                          [pattern candidate-limit])
                             page-ids (set (map first page-blocks))
                             remaining (- candidate-limit (count page-blocks))]
                         (if (pos? remaining)
                           (let [block-candidates (exec-search-blocks-fuzzy
                                                   db
                                                   "select id, page, title from blocks where lower(title) like ? escape '\\' limit ?"
                                                   [pattern (+ remaining (count page-blocks))])
                                 block-candidates (->> block-candidates
                                                       (remove (fn [[id]]
                                                                 (contains? page-ids id)))
                                                       (take remaining))]
                             (concat page-blocks block-candidates))
                           page-blocks)))]
          (fuzzy-block-rows->results q blocks))
        (catch :default e
          (prn :debug "Fuzzy search blocks failed: ")
          (js/console.error e))))))

(defn hidden-entity?
  [entity]
  (or (ldb/hidden? entity)
      (let [page (:block/page entity)]
        (and (ldb/hidden? page)
             (not= (:block/title page) common-config/quick-add-page-name)))))

(defn- page-or-object?
  [entity]
  (and (or (ldb/page? entity) (ldb/object? entity))
       (not (hidden-entity? entity))))

(defn- sanitize
  [content]
  (some-> content
          (fuzzy/search-normalize true {:lower-case? false})))

(defn- block-search-title
  "Build display title from block entity with original casing."
  [block]
  (cond->
    (let [block' (update block :block/title ldb/get-title-with-parents)]
      (db-content/recur-replace-uuid-in-block-title block'))
    (ldb/journal? block)
    (str " " (:block/journal-day block))))

(defn block->index
  "Convert a block to the index for searching"
  [{:block/keys [uuid page title] :as block}]
  (when-not (or
             (ldb/closed-value? block)
             (and (string? title) (> (count title) 10000))
             (string/blank? title))        ; empty page or block
    (try
      (let [title (block-search-title block)]
        (when uuid
          {:id (str uuid)
           :page (str (or (:block/uuid page) uuid))
           :title (if (page-or-object? block) title (sanitize title))}))
      (catch :default e
        (prn "Error: failed to run block->index on block " (:db/id block))
        (js/console.error e)))))

(def ^:private search-result-block-key ::block)

(def ^:private search-result-pull-selector
  '[:db/id
    :block/uuid
    :block/title
    {:block/page [:block/uuid]}
    {:block/parent [:db/id :block/uuid :block/title :logseq.property/built-in?
                    :logseq.property/hide? :logseq.property/deleted-at]}
    {:block/tags [:db/id :db/ident :block/title :logseq.property/icon]}
    {:block/_alias [:block/uuid :block/title]}
    :logseq.property/icon
    :logseq.property.node/display-type
    :logseq.property/hide?
    :logseq.property/deleted-at
    :logseq.property/built-in?])

(defn- pull-search-result-blocks
  [db results]
  (let [lookup-refs (mapv (fn [{:keys [id]}]
                            [:block/uuid (uuid id)])
                          results)]
    (if (seq lookup-refs)
      (->> (d/pull-many db search-result-pull-selector lookup-refs)
           (keep (fn [block]
                   (when-let [id (:block/uuid block)]
                     [(str id) block])))
           (into {}))
      {})))

;; Combine and re-rank keyword results
(defn combine-results
  [db keyword-results]
  (let [unique-results (loop [seen #{}
                              results []
                              remaining (seq keyword-results)]
                         (if-let [{:keys [id] :as result} (first remaining)]
                           (if (or (nil? id) (contains? seen id))
                             (recur seen results (next remaining))
                             (recur (conj seen id) (conj results result) (next remaining)))
                           results))
        block-by-id (pull-search-result-blocks db unique-results)
        merged (keep (fn [{:keys [id] :as result}]
                       (let [block (get block-by-id id)]
                         (when-not (ldb/hidden? block)
                           (let [keyword-score (if (ldb/page? block)
                                                 (+ (or (:keyword-score result) 0.0) 2)
                                                 (or (:keyword-score result) 0.0))
                                 combined-score (+ keyword-score
                                                   (cond
                                                     (ldb/page? block)
                                                     0.02
                                                     (:block/tags block)
                                                     0.01
                                                     :else
                                                     0))]
                             (assoc result
                                    search-result-block-key block
                                    :combined-score combined-score
                                    :keyword-score keyword-score)))))
                     unique-results)
        sorted-result (sort-by :combined-score #(compare %2 %1) merged)]
    sorted-result))

(defn- code-block?
  [code-class block]
  (boolean
   (and (not (ldb/page? block))
        (or (= :code (:logseq.property.node/display-type block))
            (and code-class
                 (ldb/class-instance? code-class block))))))

(defn- include-search-block?
  [conn block code-class {:keys [library-page-search? page-only? dev? built-in? code-only?]}]
  (and
   (not
    (or
     ;; remove pages that already have parents
     (and library-page-search?
          (or (ldb/page-in-library? @conn block)
              (not (ldb/internal-page? block))))
     ;; remove non-page blocks when asking for pages only
     (and page-only? (not (ldb/page? block)))))
   (if dev?
     true
     (if built-in?
       (or (not (ldb/built-in? block))
           (not (ldb/private-built-in-page? block))
           (ldb/class? block))
       (or (not (ldb/built-in? block))
           (ldb/class? block))))
   (or (not code-only?)
       (code-block? code-class block))))

(defn- search-result->block-result
  [conn q code-class option {:keys [id page title snippet] :as result}]
  (let [block-id (uuid id)]
    (when-let [block (or (get result search-result-block-key)
                         (d/entity @conn [:block/uuid block-id]))]
      (when (include-search-block? conn block code-class option)
        (let [display-title (if (:enable-snippet? option)
                              (ensure-highlighted-snippet snippet title q)
                              (or snippet title))
              block-page (or
                          (:block/uuid (:block/page block))
                          (when (and page (common-util/uuid-string? page))
                            (uuid page)))
              parent-id (:db/id (:block/parent block))
              tag-ids (seq (map :db/id (:block/tags block)))
              icon (:logseq.property/icon block)
              alias (some-> (first (:block/_alias block))
                            (select-keys [:block/uuid :block/title]))]
          (cond-> {:db/id (:db/id block)
                   :block/uuid (:block/uuid block)
                   :block/title display-title
                   :block.temp/original-title (:block/title block)
                   :page? (ldb/page? block)}
            block-page
            (assoc :block/page block-page)

            parent-id
            (assoc :block/parent parent-id)

            tag-ids
            (assoc :block/tags tag-ids)

            icon
            (assoc :logseq.property/icon icon)

            alias
            (assoc :alias alias)))))))

(defn- search-result-visible?
  [conn code-class option {:keys [id] :as result}]
  (let [block-id (uuid id)]
    (when-let [block (or (get result search-result-block-key)
                         (d/entity @conn [:block/uuid block-id]))]
      (include-search-block? conn block code-class option))))

(defn search-blocks
  "Options:
   * :page - the page to specifically search on
   * :limit - Number of result to limit search results. Defaults to 100
   * :search-limit - Number of result to limit sqlite search results. Defaults to nil
   * :enable-snippet? - Whether to replace title with snippet. Defaults to true
   * :dev? - Allow all nodes to be seen for development. Defaults to false
   * :code-only? - Whether to return only code blocks. Defaults to false
   * :built-in?  - Whether to return public built-in nodes for db graphs. Defaults to false"
  [conn search-db q {:keys [limit search-limit page enable-snippet? page-only? code-only? include-matched-count?]
                     :as option
                     :or {enable-snippet? true}}]
  (when-not (string/blank? q)
    (let [option (assoc option :enable-snippet? enable-snippet?)
          match-input (get-match-input q)
          non-match-input (when (<= (count q) 2)
                            (str "%" (string/replace q #"\s+" "%") "%"))
          limit (or limit 100)
          limit-p (or search-limit limit)
          exact-title-result (when (and (not page-only?)
                                        (exact-title-query? q))
                               (search-blocks-exact-title-aux search-db q page limit-p))
          enough-exact-title-results? (>= (count exact-title-result) limit-p)
          ;; don't use sqlite snippet function anymore, all snippets will be handled by ensure-highlighted-snippet
          select "select id, page, title, rank from blocks_fts where "
          pg-sql (if page "page = ? and" "")
          match-sql (if (ns-util/namespace-page? q)
                      (str select pg-sql " title match ? or title match ? limit ?")
                      (str select pg-sql " title match ? limit ?"))
          non-match-sql (str select pg-sql " title like ? limit ?")
          matched-result (when (and (not page-only?)
                                    (not enough-exact-title-results?))
                           (search-blocks-aux search-db match-sql q match-input page limit-p (ns-util/namespace-page? q)))
          non-match-result (when (and (not page-only?) non-match-input)
                             (->> (search-blocks-aux search-db non-match-sql q non-match-input page limit-p)
                                  (map (fn [result]
                                         (assoc result :keyword-score (fuzzy/score q (:title result)))))))
          skip-fuzzy? (or enough-exact-title-results?
                          (and (multi-term-query? q)
                               (seq matched-result)))
          fuzzy-result (when-not skip-fuzzy?
                         (search-blocks-fuzzy-aux search-db q page limit))
          ;;  _ (prn :debug "Search results before combine:" enable-snippet? (map :snippet matched-result))
          ;;  _ (doseq [item (concat fuzzy-result matched-result)]
          ;;      (prn :debug :keyword-search-result item))
          combined-result (combine-results @conn (concat exact-title-result fuzzy-result matched-result non-match-result))
          code-class (when code-only?
                       (d/entity @conn :logseq.class/Code-block))
          matched-count (when include-matched-count?
                          (count (filter #(search-result-visible? conn code-class option %) combined-result)))
          result (->> combined-result
                      (common-util/distinct-by :id)
                      (keep #(search-result->block-result conn q code-class option %)))]
      (if include-matched-count?
        {:items (take limit result)
         :matched-count matched-count}
        (take limit result)))))

(defn truncate-table!
  [db]
  (drop-tables-and-triggers! db)
  (create-tables-and-triggers! db)
  (.exec db "PRAGMA user_version = 0"))

(defn get-all-blocks
  [db]
  (when db
    (->> (d/datoms db :avet :block/uuid)
         (map :v)
         (keep #(d/entity db [:block/uuid %]))
         (remove hidden-entity?))))

(defn build-blocks-indice
  [db]
  (->> (get-all-blocks db)
       (keep block->index)))

(defn- get-blocks-from-datoms-impl
  [{:keys [db-after db-before]} datoms]
  (letfn [(page-descendants [page]
            (loop [pages [page]
                   result []]
              (if-let [page' (first pages)]
                (let [children (->> (:block/_parent page')
                                    (filter ldb/page?)
                                    ldb/sort-by-order)]
                  (recur (concat (rest pages) children)
                         (conj result page')))
                result)))
          (page-tree [db page]
            (->> (page-descendants page)
                 (mapcat (fn [page']
                           (concat
                            [page']
                            (mapcat #(ldb/get-block-and-children db (:block/uuid %))
                                    (ldb/sort-by-order (:block/_page page'))))))
                 distinct))
          (entity-tree [db entity]
            (cond
              (nil? entity) []
              (ldb/page? entity) (page-tree db entity)
              (:block/uuid entity) (ldb/get-block-and-children db (:block/uuid entity))
              :else [entity]))
          (referrer-eids [db eids]
            (->> eids
                 (mapcat (fn [id]
                           (map :db/id (:block/_refs (d/entity db id)))))
                 set))
          (entities-for [db eids {:keys [include-tree? include-refs?]}]
            (let [entities (keep #(d/entity db %) eids)
                  entities' (if include-tree?
                              (mapcat #(entity-tree db %) entities)
                              entities)
                  entities'' (if include-refs?
                               (concat entities'
                                       (keep #(d/entity db %)
                                             (referrer-eids db eids)))
                               entities')]
              (->> entities''
                   distinct
                   (remove nil?))))]
    (when (seq datoms)
      (let [ref-affecting-attrs #{:block/uuid :block/name :block/title :block/properties}
            visibility-affecting-attrs #{:logseq.property/deleted-at :block/parent :block/page}
            ref-eids (->> datoms
                          (filter #(contains? ref-affecting-attrs (:a %)))
                          (map :e)
                          set)
            visibility-eids (->> datoms
                                 (filter #(contains? visibility-affecting-attrs (:a %)))
                                 (map :e)
                                 set)]
        {:blocks-to-remove (concat (entities-for db-before ref-eids {:include-refs? true})
                                   (entities-for db-before visibility-eids {:include-tree? true}))
         :blocks-to-add (->> (concat (entities-for db-after ref-eids {:include-refs? true})
                                     (entities-for db-after visibility-eids {:include-tree? true}))
                             (remove hidden-entity?))}))))

(defn- get-affected-blocks
  [tx-report]
  (let [data (:tx-data tx-report)
        datoms (filter
                (fn [datom]
                  ;; Capture any direct change on page display title, page ref or block content
                  (contains? #{:block/uuid :block/name :block/title :block/properties} (:a datom)))
                data)]
    (when (seq datoms)
      (get-blocks-from-datoms-impl tx-report datoms))))

(defn sync-search-indice
  [tx-report]
  (let [{:keys [blocks-to-add blocks-to-remove]} (get-affected-blocks tx-report)]
    ;; update block indice
    (when (or (seq blocks-to-add) (seq blocks-to-remove))
      (let [blocks-to-add' (keep block->index blocks-to-add)
            blocks-to-remove (set (concat (map (comp str :block/uuid) blocks-to-remove)
                                          (->>
                                           (set/difference
                                            (set (map :block/uuid blocks-to-add))
                                            (set (map :block/uuid blocks-to-add')))
                                           (map str))))]
        {:blocks-to-remove-set blocks-to-remove
         :blocks-to-add        blocks-to-add'}))))
