(ns frontend.db.model
  "Core db functions."
  ;; TODO: Remove this config once how repos are passed to this ns are standardized
  {:clj-kondo/config {:linters {:unused-binding {:level :off}}}}
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [frontend.date :as date]
            [frontend.db.conn :as conn]
            [frontend.db.react :as react]
            [frontend.db.utils :as db-utils]
            [frontend.state :as state]
            [frontend.util :as util :refer [react]]
            [logseq.db.frontend.rules :as rules]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.graph-parser.db :as gp-db]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [frontend.config :as config]
            [logseq.db :as ldb]
            [logseq.graph-parser.text :as text]))

;; TODO: extract to specific models and move data transform logic to the
;; corresponding handlers.

(def block-attrs ldb/block-attrs)

(def hidden-page? ldb/hidden-page?)

(defn get-all-tagged-pages
  [repo]
  (d/q '[:find ?page-name ?tag
         :where
         [?page :block/tags ?e]
         [?e :block/original-name ?tag]
         [?page :block/name ?page-name]]
       (conn/get-db repo)))

(defn get-all-pages
  [repo]
  (->>
   (d/q
    '[:find [(pull ?page [*]) ...]
      :where
      [?page :block/name]]
     (conn/get-db repo))
   (remove hidden-page?)))

(defn get-all-page-original-names
  [repo]
  (let [db (conn/get-db repo)]
    (->>
     (d/datoms db :avet :block/name)
     (map #(:block/original-name (d/entity db (:e %))))
     (remove hidden-page?)
     (remove nil?))))

(defn get-page-alias
  [repo page-name]
  (when-let [db (and repo (conn/get-db repo))]
    (some->> (d/q '[:find ?alias
                    :in $ ?page-name
                    :where
                    [?page :block/name ?page-name]
                    [?page :block/alias ?alias]]
                  db
                  (util/page-name-sanity-lc page-name))
             db-utils/seq-flatten
             distinct)))

(defn get-alias-source-page
  "return the source page of an alias"
  [repo alias-id]
  (when-let [db (conn/get-db repo)]
    (ldb/get-alias-source-page db alias-id)))

(defn get-files-blocks
  [repo-url paths]
  (let [paths (set paths)
        pred (fn [_db e]
               (contains? paths e))]
    (-> (d/q '[:find ?block
               :in $ ?pred
               :where
               [?file :file/path ?path]
               [(?pred $ ?path)]
               [?p :block/file ?file]
               [?block :block/page ?p]]
             (conn/get-db repo-url) pred)
        db-utils/seq-flatten)))

(defn set-file-last-modified-at!
  "Refresh file timestamps to DB"
  [repo path last-modified-at]
  (when (and repo path last-modified-at)
    (db-utils/transact! repo
                        [{:file/path path
                          :file/last-modified-at last-modified-at}]
                        {:skip-refresh? true})))

(defn get-file-last-modified-at
  [repo path]
  (when (and repo path)
    (when-let [db (conn/get-db repo)]
      (-> (db-utils/entity db [:file/path path])
          :file/last-modified-at))))

(defn file-exists?
  [repo path]
  (when (and repo path)
    (when-let [db (conn/get-db repo)]
      (db-utils/entity db [:file/path path]))))

(defn get-files-full
  [repo]
  (when-let [db (conn/get-db repo)]
    (->>
     (d/q
      '[:find (pull ?file [*])
        :where
        [?file :file/path]]
      db)
     (flatten))))

(defn get-file
  ([path]
   (get-file (state/get-current-repo) path))
  ([repo path]
   (when (and repo path)
     (when-let [db (conn/get-db repo)]
       (:file/content (db-utils/entity db [:file/path path]))))))

(defn get-custom-css
  []
  (when-let [repo (state/get-current-repo)]
    (get-file repo "logseq/custom.css")))

(defn get-block-by-uuid
  [id]
  (db-utils/entity [:block/uuid (if (uuid? id) id (uuid id))]))

(defn query-block-by-uuid
  "Return block or page entity, depends on the uuid"
  [id]
  (db-utils/pull [:block/uuid (if (uuid? id) id (uuid id))]))

(defn heading-content->route-name
  "Converts a heading block's content to its route name. This works
independent of format as format specific heading characters are stripped"
  [block-content]
  (some->> block-content
           (re-find #"^#{0,}\s*(.*)(?:\n|$)")
           second
           string/lower-case))

(defn get-block-by-page-name-and-block-route-name
  "Returns first block for given page name and block's route name. Block's route
  name must match the content of a page's block header"
  [repo page-name route-name]
  (let [db (conn/get-db repo)]
    (if (config/db-based-graph? repo)
      (->> (d/q '[:find (pull ?b [:block/uuid])
                  :in $ ?page-name ?route-name ?content-matches
                  :where
                  [?page :block/name ?page-name]
                  [?b :block/page ?page]
                  [?b :block/properties ?prop]
                  [?prop-b :block/name "heading"]
                  [?prop-b :block/type "property"]
                  [?prop-b :block/uuid ?prop-uuid]
                  [(get ?prop ?prop-uuid) _]
                  [?b :block/content ?content]
                  [(?content-matches ?content ?route-name ?b)]]
                db
                page-name
                route-name
                (fn content-matches? [block-content external-content block-id]
                  (let [block (db-utils/entity repo block-id)
                        ref-tags (distinct (concat (:block/tags block) (:block/refs block)))]
                    (= (-> block-content
                           (db-content/special-id-ref->page-ref ref-tags)
                           (db-content/special-id-ref->page ref-tags)
                           heading-content->route-name)
                       (string/lower-case external-content)))))
           ffirst)

      (->> (d/q '[:find (pull ?b [:block/uuid])
                  :in $ ?page-name ?route-name ?content-matches
                  :where
                  [?page :block/name ?page-name]
                  [?b :block/page ?page]
                  [?b :block/properties ?prop]
                  [(get ?prop :heading) _]
                  [?b :block/content ?content]
                  [(?content-matches ?content ?route-name)]]
                db
                page-name
                route-name
                (fn content-matches? [block-content external-content]
                  (= (heading-content->route-name block-content)
                     (string/lower-case external-content))))
           ffirst))))

(defn get-page-format
  [page-name]
  {:post [(keyword? %)]}
  (if (config/db-based-graph? (state/get-current-repo))
    :markdown
    (keyword
     (or
      (let [page (ldb/get-page (conn/get-db) page-name)]
        (or
         (:block/format page)
         (when-let [file (:block/file page)]
           (when-let [path (:file/path (db-utils/entity (:db/id file)))]
             (common-util/get-format path)))))
      (state/get-preferred-format)
      :markdown))))

(defn page-alias-set
  [repo-url page-id]
  (->>
   (ldb/get-page-alias (conn/get-db repo-url) page-id)
   (set)
   (set/union #{page-id})))

(defn get-page-alias-names
  [repo page-id]
  (let [page (db-utils/entity page-id)
        alias-ids (->> (page-alias-set repo page-id)
                       (remove #{page-id}))]
    (when (seq alias-ids)
      (map (fn [id] (:block/original-name (db-utils/entity id))) alias-ids))))

(defn with-pages
  [blocks]
  (let [pages-ids (->> (map (comp :db/id :block/page) blocks)
                       (remove nil?))
        pages (when (seq pages-ids)
                (db-utils/pull-many '[:db/id :block/name :block/original-name :block/journal-day] pages-ids))
        pages-map (reduce (fn [acc p] (assoc acc (:db/id p) p)) {} pages)
        blocks (map
                (fn [block]
                  (assoc block :block/page
                         (get pages-map (:db/id (:block/page block)))))
                blocks)]
    blocks))

(def sort-by-left ldb/sort-by-left)

(defn sub-block
  [id]
  (when-let [repo (state/get-current-repo)]
    (->
     (react/q repo [:frontend.worker.react/block id]
              {:query-fn (fn [_]
                           (let [e (db-utils/entity id)]
                             [e (:block/tx-id e)]))}
              nil)
     react
     first)))

(defn sort-by-left-recursive
  [form]
  (walk/postwalk (fn [f]
                   (if (and (map? f)
                            (:block/_parent f))
                     (let [children (:block/_parent f)]
                       (-> f
                           (dissoc :block/_parent)
                           (assoc :block/children (sort-by-left children f))))
                     f))
                 form))

;; File-based only
;; Diverged of get-sorted-page-block-ids
(defn get-sorted-page-block-ids-and-levels
  "page-name: the page name, original name
   return: a list with elements in:
       :id    - a list of block ids, sorted by :block/left
       :level - the level of the block, 1 for root, 2 for children of root, etc."
  [page-name]
  {:pre [(string? page-name)]}
  (let [root (ldb/get-page (conn/get-db) page-name)]
    (loop [result []
           children (sort-by-left (:block/_parent root) root)
           ;; BFS log of walking depth
           levels (repeat (count children) 1)]
      (if (seq children)
        (let [child (first children)
              cur-level (first levels)
              next-children (sort-by-left (:block/_parent child) child)]
          (recur (conj result {:id (:db/id child) :level cur-level})
                 (concat
                  next-children
                  (rest children))
                 (concat
                  (repeat (count next-children) (inc cur-level))
                  (rest levels))))
        result))))

(defn has-children?
  ([block-id]
   (has-children? (conn/get-db) block-id))
  ([db block-id]
   (ldb/has-children? db block-id)))

(def get-by-parent-&-left ldb/get-by-parent-&-left)

(defn top-block?
  [block]
  (= (:db/id (:block/parent block))
     (:db/id (:block/page block))))

(defn get-block-parent
  ([block-id]
   (get-block-parent (state/get-current-repo) block-id))
  ([repo block-id]
   (when-let [db (conn/get-db repo)]
     (when-let [block (db-utils/entity db [:block/uuid block-id])]
       (:block/parent block)))))

(defn get-block-parents
  [repo block-id opts]
  (when-let [db (conn/get-db repo)]
    (ldb/get-block-parents db block-id opts)))

;; Use built-in recursive
(defn get-block-parents-v2
  [repo block-id]
  (d/pull (conn/get-db repo)
          '[:db/id :block/collapsed? {:block/parent ...}]
          [:block/uuid block-id]))

(def get-block-last-direct-child-id ldb/get-block-last-direct-child-id)

(defn get-block-deep-last-open-child-id
  [db db-id]
  (loop [node (db-utils/entity db db-id)]
    (if-let [last-child-id (get-block-last-direct-child-id db (:db/id node) true)]
      (let [e (db-utils/entity db last-child-id)]
        (if (or (:block/collapsed? e) (empty? (:block/_parent e)))
          last-child-id
          (recur e)))
      nil)))

(def get-prev-sibling ldb/get-prev-sibling)

(def get-right-sibling ldb/get-right-sibling)

(defn get-next
  "Get next block, either its right sibling, or loop to find its next block."
  [db db-id & {:keys [skip-collapsed? init?]
               :or {skip-collapsed? true
                    init? true}
               :as opts}]
  (when-let [entity (db-utils/entity db db-id)]
    (or (when-not (and (:block/collapsed? entity) skip-collapsed? init?)
          (get-right-sibling db db-id))
        (let [parent-id (:db/id (:block/parent (db-utils/entity db db-id)))]
          (get-next db parent-id (assoc opts :init? false))))))

(def page? ldb/page?)

(defn get-prev
  "Get prev block, either its left sibling if the sibling is collapsed or no children,
  or get sibling's last deep displayable child (collaspsed parent or non-collapsed child)."
  [db db-id]
  (when-let [entity (db-utils/entity db db-id)]
    (or
     (when-let [prev-sibling (get-prev-sibling db db-id)]
       (if (or (:block/collapsed? prev-sibling)
               (empty? (:block/_parent prev-sibling)))
         prev-sibling
         (some->> (get-block-deep-last-open-child-id db (:db/id prev-sibling))
                  (db-utils/entity db))))
     (let [parent (:block/parent entity)]
       (when-not (page? parent)
         parent)))))

(defn get-page-blocks-no-cache
  ([page-id]
   (get-page-blocks-no-cache (state/get-current-repo) page-id nil))
  ([repo page-id]
   (get-page-blocks-no-cache repo page-id nil))
  ([repo page-id opts]
   (when-let [db (conn/get-db repo)]
     (ldb/get-page-blocks db page-id opts))))

(defn get-page-blocks-count
  [repo page-id]
  (when-let [db (conn/get-db repo)]
    (ldb/get-page-blocks-count db page-id)))

(defn page-exists?
  "Whether a page exists."
  [page-name]
  (let [repo (state/get-current-repo)]
    (when-let [db (conn/get-db repo)]
     (ldb/page-exists? db page-name))))

(defn page-empty?
  "Whether a page is empty. Does it has a non-page block?
  `page-id` could be either a string or a db/id."
  [repo page-id]
  (when-let [db (conn/get-db repo)]
    (ldb/page-empty? db page-id)))

(defn parents-collapsed?
  [repo block-uuid]
  (when-let [block (:block/parent (get-block-parents-v2 repo block-uuid))]
    (->> (tree-seq map? (fn [x] [(:block/parent x)]) block)
         (some util/collapsed?))))

(defn get-block-page
  [repo block-uuid]
  (assert (uuid? block-uuid) (str "get-block-page requires block-uuid to be of type uuid but got " block-uuid))
  (when-let [block (db-utils/entity repo [:block/uuid block-uuid])]
    (db-utils/entity repo (:db/id (:block/page block)))))

(defn get-block-immediate-children
  "Doesn't include nested children."
  [repo block-uuid]
  (when-let [db (conn/get-db repo)]
    (ldb/get-block-immediate-children db block-uuid)))

(defn get-block-children
  "Including nested children."
  [repo block-uuid]
  (when-let [db (conn/get-db repo)]
    (let [ids (ldb/get-block-children-ids db block-uuid)]
     (when (seq ids)
       (let [ids' (map (fn [id] [:block/uuid id]) ids)]
         (db-utils/pull-many repo '[*] ids'))))))

(defn get-block-and-children
  [repo block-uuid]
  (let [db (conn/get-db repo)]
    (ldb/get-block-and-children repo db block-uuid)))

(defn get-file-page
  ([file-path]
   (get-file-page file-path true))
  ([file-path original-name?]
   (when-let [repo (state/get-current-repo)]
     (when-let [db (conn/get-db repo)]
       (some->
        (d/q
         (if original-name?
           '[:find ?page-name
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?page :block/file ?file]
             [?page :block/original-name ?page-name]]
           '[:find ?page-name
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?page :block/file ?file]
             [?page :block/name ?page-name]])
         db file-path)
        db-utils/seq-flatten
        first)))))

(defn get-page-file
  ([page-name]
   (get-page-file (state/get-current-repo) page-name))
  ([repo page-name]
   (when-let [db (conn/get-db repo)]
     (gp-db/get-page-file db page-name))))

(defn get-block-file-path
  [block]
  (when-let [page-id (:db/id (:block/page block))]
    (:file/path (:block/file (db-utils/entity page-id)))))

(defn get-file-page-id
  [file-path]
  (when-let [repo (state/get-current-repo)]
    (when-let [db (conn/get-db repo)]
      (some->
       (d/q
        '[:find ?page
          :in $ ?path
          :where
          [?file :file/path ?path]
          [?page :block/name]
          [?page :block/file ?file]]
        db file-path)
       db-utils/seq-flatten
       first))))

(defn get-page
  [page-name-or-uuid]
  (when page-name-or-uuid
    (ldb/get-page (conn/get-db) page-name-or-uuid)))

(defn get-case-page
  [page-name-or-uuid]
  (when page-name-or-uuid
    (ldb/get-case-page (conn/get-db) page-name-or-uuid)))

(defn get-redirect-page-name
  "Given any readable page-name, return the exact page-name in db. If page
   doesn't exists yet, will return the passed `page-name`. Accepts both
   sanitized or unsanitized names.
   alias?: if true, alias is allowed to be returned; otherwise, it would be deref."
  ([page-name] (get-redirect-page-name page-name false))
  ([page-name alias?]
   (when page-name
     (let [page-entity (ldb/get-page (conn/get-db) page-name)]
       (cond
         alias?
         (or (:block/name page-entity) page-name)

         (nil? page-entity)
         (if-let [journal-name (date/journal-title->custom-format page-name)]
           (util/page-name-sanity-lc journal-name)
           page-name)

         :else
         (let [source-page (get-alias-source-page (state/get-current-repo) (:db/id page-entity))]
           (or (:block/name source-page)
               (:block/name page-entity)
               page-name)))))))

(defn get-page-original-name
  [page-name]
  (when (string? page-name)
    (let [page (ldb/get-page (conn/get-db) page-name)]
      (:block/original-name page))))

(defn get-journals-length
  []
  (let [today (date-time-util/date->int (js/Date.))]
    (d/q '[:find (count ?page) .
           :in $ ?today
           :where
           [?page :block/type "journal"]
           [?page :block/journal-day ?journal-day]
           [(<= ?journal-day ?today)]]
         (conn/get-db (state/get-current-repo))
         today)))

(defn get-latest-journals
  ([n]
   (get-latest-journals (state/get-current-repo) n))
  ([repo-url n]
   (when (conn/get-db repo-url)
     (let [date (js/Date.)
           _ (.setDate date (- (.getDate date) (dec n)))
           today (date-time-util/date->int (js/Date.))]
       (->>
        (react/q repo-url [:frontend.worker.react/journals] {:use-cache? false}
                 '[:find [(pull ?page [*]) ...]
                   :in $ ?today
                   :where
                   [?page :block/name ?page-name]
                   [?page :block/journal-day ?journal-day]
                   [(<= ?journal-day ?today)]]
                 today)
        (react)
        (sort-by :block/journal-day)
        (reverse)
        (take n))))))

;; get pages that this page referenced
(defn get-page-referenced-pages
  [repo page-id]
  (when-let [db (conn/get-db repo)]
    (let [pages (page-alias-set repo page-id)
          ref-pages (d/q
                     '[:find [?ref-page ?ref-page-name]
                       :in $ ?pages
                       :where
                       [(untuple ?pages) [?page ...]]
                       [?block :block/page ?page]
                       [?block :block/refs ?ref-page]
                       [?ref-page :block/name ?ref-page-name]]
                     db
                     pages)]
      (mapv (fn [[ref-page ref-page-name]] [ref-page-name (get-page-alias repo ref-page)]) ref-pages))))

;; get pages who mentioned this page
(defn get-pages-that-mentioned-page
  [repo page-id include-journals?]
  (when (conn/get-db repo)
    (let [pages (page-alias-set repo page-id)
          mentioned-pages (->> (react/q repo [:frontend.worker.react/page<-pages page-id]
                                        {:query-fn (fn [_]
                                                     (->>
                                                      (mapcat
                                                       (fn [id]
                                                         (let [page (db-utils/entity repo id)]
                                                           (->> (:block/_refs page)
                                                                (keep (fn [ref]
                                                                        (:block/page ref)))
                                                                (util/distinct-by :db/id))))
                                                       pages)))}
                                        {:use-cache? false})
                               react)]
      (->> mentioned-pages
           (keep (fn [page]
                   (when-not (and (not include-journals?) (ldb/journal-page? page))
                     page)))
           (mapv (fn [page]
                   [(:block/name page) (get-page-alias-names repo (:db/id page))]))))))

(defn get-page-referenced-blocks-full
  ([page-id]
   (get-page-referenced-blocks-full (state/get-current-repo) page-id nil))
  ([page-id options]
   (get-page-referenced-blocks-full (state/get-current-repo) page-id options))
  ([repo page-id options]
   (when (and repo page-id)
     (when-let [db (conn/get-db repo)]
       (let [pages (page-alias-set repo page-id)
             aliases (set/difference pages #{page-id})]
         (->>
          (d/q
           '[:find [(pull ?block ?block-attrs) ...]
             :in $ [?ref-page ...] ?block-attrs
             :where
             [?block :block/path-refs ?ref-page]]
           db
           pages
           (butlast block-attrs))
          (remove (fn [block] (= page-id (:db/id (:block/page block)))))
          db-utils/group-by-page
          (map (fn [[k blocks]]
                 (let [k (if (contains? aliases (:db/id k))
                           (assoc k :block/alias? true)
                           k)]
                   [k blocks])))))))))

(defn get-page-referenced-blocks
  ([page-id]
   (get-page-referenced-blocks (state/get-current-repo) page-id nil))
  ([page-id options]
   (get-page-referenced-blocks (state/get-current-repo) page-id options))
  ([repo page-id options]
   (when repo
     (when (conn/get-db repo)
       (let [pages (page-alias-set repo page-id)]
         (->>
          (react/q repo
                   [:frontend.worker.react/refs page-id]
                   {:query-fn (fn []
                                (let [entities (mapcat (fn [id]
                                                         (:block/_path-refs (db-utils/entity id))) pages)
                                      blocks (map (fn [e]
                                                    {:block/parent (:block/parent e)
                                                     :block/left (:block/left e)
                                                     :block/page (:block/page e)
                                                     :block/collapsed? (:block/collapsed? e)}) entities)]
                                  {:entities entities
                                   :blocks blocks}))}
                   nil)
          react
          :entities
          (remove (fn [block]
                    (= page-id (:db/id (:block/page block)))))
          (util/distinct-by :db/id)))))))

;; TODO: no need to use datalog query, `:block/_refs`
(defn get-block-referenced-blocks
  ([block-id]
   (get-block-referenced-blocks block-id {}))
  ([block-id options]
   (when-let [repo (state/get-current-repo)]
     (when (conn/get-db repo)
       (let [block (db-utils/entity block-id)
             query-result (->> (react/q repo [:frontend.worker.react/refs
                                              (:db/id block)]
                                        {}
                                        '[:find [(pull ?ref-block ?block-attrs) ...]
                                          :in $ ?block-id ?block-attrs
                                          :where
                                          [?ref-block :block/refs ?block-id]]
                                        block-id
                                        block-attrs)
                               react
                               (sort-by-left-recursive))]
         (db-utils/group-by-page query-result))))))

(defn journal-page?
  "sanitized page-name only"
  [page-name]
  (ldb/journal-page? (ldb/get-page (conn/get-db) page-name)))

(defn get-block-property-values
  "Get blocks which have this property."
  [property-id]
  (let [db (conn/get-db)]
    (map :v (d/datoms db :avet property-id))))

(defn get-classes-with-property
  "Get classes which have given property as a class property"
  [property-id]
  (ldb/get-classes-with-property (conn/get-db) property-id))

(defn get-all-referenced-blocks-uuid
  "Get all uuids of blocks with any back link exists."
  []
  (when-let [db (conn/get-db)]
    (d/q '[:find [?refed-uuid ...]
           :where
           ;; ?referee-b is block with ref towards ?refed-b
           [?refed-b   :block/uuid ?refed-uuid]
           [?referee-b :block/refs ?refed-b]] db)))

(defn delete-blocks
  [repo-url files _delete-page?]
  (when (seq files)
    (let [blocks (->> (get-files-blocks repo-url files)
                      (remove nil?))]
      (mapv (fn [eid] [:db.fn/retractEntity eid]) blocks))))

(defn delete-files
  [files]
  (mapv (fn [path] [:db.fn/retractEntity [:file/path path]]) files))

;; file-based only so it's safe to use :block/name lookup refs here
(defn delete-pages-by-files
  [files]
  (let [pages (->> (mapv get-file-page files)
                   (remove nil?))]
    (when (seq pages)
      (mapv (fn [page] [:db.fn/retractEntity [:block/name page]]) (map util/page-name-sanity-lc pages)))))

(defn set-file-content!
  ([repo path content]
   (set-file-content! repo path content {}))
  ([repo path content opts]
   (when (and repo path)
     (let [tx-data {:file/path path
                    :file/content content}]
       (db-utils/transact! repo [tx-data] (merge opts {:skip-refresh? true}))))))

;; TODO: check whether this works when adding pdf back on Web
(defn get-pre-block
  [repo page-id]
  (-> (d/q '[:find (pull ?b [*])
             :in $ ?page
             :where
             [?b :block/page ?page]
             [?b :block/pre-block? true]]
           (conn/get-db repo)
           page-id)
      ffirst))

(defn whiteboard-page?
  "Given a page entity, page object or page name, check if it is a whiteboard page"
  [page]
  (let [page (if (string? page)
               (get-page page)
               page)]
    (ldb/whiteboard-page? page)))

(defn get-orphaned-pages
  [opts]
  (let [db (conn/get-db)]
    (ldb/get-orphaned-pages db
                            (merge opts
                                   {:built-in-pages-names
                                    (if (config/db-based-graph? (state/get-current-repo))
                                      sqlite-create-graph/built-in-pages-names
                                      gp-db/built-in-pages-names)}))))

;; FIXME: use `Untitled` instead of UUID for db based graphs
(defn untitled-page?
  [page-name]
  (when (ldb/get-page (conn/get-db) page-name)
    (some? (parse-uuid page-name))))

(defn get-all-whiteboards
  [repo]
  (d/q
    '[:find [(pull ?page [:db/id
                          :block/uuid
                          :block/name
                          :block/original-name
                          :block/created-at
                          :block/updated-at]) ...]
      :where
      [?page :block/name]
      [?page :block/type "whiteboard"]]
    (conn/get-db repo)))

(defn get-whiteboard-id-nonces
  [repo page-id]
  (let [db-based? (config/db-based-graph? repo)
        key (if db-based?
              :logseq.property.tldraw/shape
              :logseq.tldraw.shape)
        page (db-utils/entity page-id)]
    (->> (:block/_page page)
         (keep (fn [{:block/keys [uuid] :as b}]
                 (when-let [shape (if db-based?
                                    (get b key)
                                    (get (:block/properties b) key))]
                   {:id (str uuid)
                    :nonce (:nonce shape)}))))))

(defn get-all-classes
  [repo]
  (d/q
   '[:find ?name ?id
     :where
     [?page :block/type ?t]
     [(= ?t "class")]
     [?page :block/original-name ?name]
     [?page :block/uuid ?id]]
    (conn/get-db repo)))

(defn get-class-children
  [repo eid]
  (->>
   (d/q '[:find [?children ...]
          :in $ ?parent %
          :where
          (class-parent ?parent ?children)]
        (conn/get-db repo)
        eid
        (:class-parent rules/rules))
   distinct))

;; FIXME: async query
(defn get-class-objects
  [repo class-id]
  (when-let [class (db-utils/entity repo class-id)]
    (if (first (:class/_parent class))        ; has children classes
      (d/q
       '[:find [?object ...]
         :in $ % ?parent
         :where
         (class-parent ?parent ?c)
         (or-join [?object ?c]
          [?object :block/tags ?parent]
          [?object :block/tags ?c])]
       (conn/get-db repo)
       (:class-parent rules/rules)
       class-id)
      (map :db/id (:block/_tags class)))))


(defn get-all-namespace-relation
  [repo]
  (d/q '[:find ?page-name ?parent
         :where
         [?page :block/name ?page-name]
         [?page :block/namespace ?e]
         [?e :block/original-name ?parent]]
    (conn/get-db repo)))

(defn get-all-namespace-parents
  [repo]
  (->> (get-all-namespace-relation repo)
       (map second)))

(def ns-char "/")
(def ns-re #"/")

(defn- get-parents-namespace-list
  "Return list of parents namespace"
  [page-namespace & nested-found]
  (if (text/namespace-page? page-namespace)
    (let [pre-nested-vec (drop-last (string/split page-namespace ns-re))
          my-nested-found (if (nil? nested-found)
                            []
                            nested-found)]
      (if (= (count pre-nested-vec) 1)
        (conj my-nested-found (nth pre-nested-vec 0))
        (let [pre-nested-str (string/join ns-char pre-nested-vec)]
          (recur pre-nested-str (conj my-nested-found pre-nested-str)))))
    []))

(defn- get-unnecessary-namespaces-name
  "Return unnecessary namespace from a list of page's name"
  [pages-list]
  (->> pages-list
       (remove nil?)
       (mapcat get-parents-namespace-list)
       distinct))

(defn- remove-nested-namespaces-link
  "Remove relations between pages and their nested namespace"
  [pages-relations]
  (let [pages-relations-to-return (distinct (mapcat
                                             identity
                                             (for [item (for [a-link-from (mapv (fn [a-rel] (first a-rel)) pages-relations)]
                                                          [a-link-from (mapv
                                                                        (fn [a-rel] (second a-rel))
                                                                        (filterv
                                                                         (fn [link-target] (=  a-link-from (first link-target)))
                                                                         pages-relations))])
                                                   :let [list-to (get item 1)
                                                         page (get item 0)
                                                         namespaces-to-remove (get-unnecessary-namespaces-name list-to)
                                                         list-to-without-nested-ns (filterv (fn [elem] (not (some #{elem} namespaces-to-remove))) list-to)
                                                         node-links (for [item-ok list-to-without-nested-ns]
                                                                      [page item-ok])]]
                                               (seq node-links))))]
    pages-relations-to-return))

;; Ignore files with empty blocks for now
(defn get-pages-relation
  [repo with-journal?]
  (when-let [db (conn/get-db repo)]
    (let [q (if with-journal?
              '[:find ?page ?ref-page-name
                :where
                [?p :block/name ?page]
                [?block :block/page ?p]
                [?block :block/refs ?ref-page]
                [?ref-page :block/name ?ref-page-name]]
              '[:find ?page ?ref-page-name
                :where
                [?p :block/name ?page]
                [(get-else $ ?p :block/type "N/A") ?type]
                [(not= ?type "journal")]
                [?block :block/page ?p]
                [?block :block/refs ?ref-page]
                [?ref-page :block/name ?ref-page-name]])]
      (->>
       (d/q q db)
       (map (fn [[page ref-page-name]]
              [page ref-page-name]))
       (remove-nested-namespaces-link)))))

(defn get-namespace-pages
  "Accepts both sanitized and unsanitized namespaces"
  [repo namespace]
  (ldb/get-namespace-pages (conn/get-db repo) namespace {:db-graph? (config/db-based-graph? repo)}))

(defn- tree [flat-col root]
  (let [sort-fn #(sort-by :block/name %)
        children (group-by :block/namespace flat-col)
        namespace-children (fn namespace-children [parent-id]
                             (map (fn [m]
                                    (assoc m :namespace/children
                                           (sort-fn (namespace-children {:db/id (:db/id m)}))))
                                  (sort-fn (get children parent-id))))]
    (namespace-children root)))

(defn get-namespace-hierarchy
  "Unsanitized namespaces"
  [repo namespace]
  (let [children (get-namespace-pages repo namespace)
        namespace-id (:db/id (db-utils/entity [:block/name (util/page-name-sanity-lc namespace)]))
        root {:db/id namespace-id}
        col (conj children root)]
    (tree col root)))

(defn get-page-namespace
  [repo page]
  (:block/namespace (db-utils/entity repo [:block/name (util/page-name-sanity-lc page)])))

(defn get-page-namespace-routes
  [repo page]
  (assert (string? page))
  (when-let [db (conn/get-db repo)]
    (when-not (string/blank? page)
      (let [page (util/page-name-sanity-lc (string/trim page))
            page-exist? (db-utils/entity repo [:block/name page])
            ids (if page-exist?
                  '()
                  (->> (d/datoms db :aevt :block/name)
                       (filter (fn [datom]
                                 (string/ends-with? (:v datom) (str "/" page))))
                       (map :e)))]
        (when (seq ids)
          (db-utils/pull-many repo
                              '[:db/id :block/name :block/original-name
                                {:block/file [:db/id :file/path]}]
                              ids))))))

(comment
  ;; For debugging
  (defn get-all-blocks
    []
    (let [repo (state/get-current-repo)]
      (d/q
       '[:find [(pull ?b [*]) ...]
         :where
         [?b :block/uuid]]
        (conn/get-db repo))))
  )
