(ns frontend.db.model
  "Core db functions."
  (:require [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [frontend.common.graph-view :as graph-view]
            [frontend.db.conn :as conn]
            [frontend.db.react :as react]
            [frontend.db.utils :as db-utils]
            [frontend.state :as state]
            [frontend.util :as util :refer [react]]
            [logseq.db :as ldb]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.rules :as rules]))

;; TODO: extract to specific models and move data transform logic to the
;; corresponding handlers.

(def hidden-page? ldb/hidden?)

(defn get-alias-source-page
  "return the source page of an alias"
  [repo alias-id]
  (when-let [db (conn/get-db repo)]
    (ldb/get-alias-source-page db alias-id)))

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
  [repo page-uuid-str route-name]
  (let [db (conn/get-db repo)]
    (->> (d/q '[:find (pull ?b [:block/uuid])
                :in $ ?page-uuid ?route-name ?content-matches %
                :where
                [?page :block/uuid ?page-uuid]
                [?b :block/page ?page]
                (has-property ?b :logseq.property/heading)
                [?b :block/title ?content]
                [(?content-matches ?content ?route-name ?b)]]
              db
              (uuid page-uuid-str)
              route-name
              (fn content-matches? [block-content external-content block-id]
                (let [block (db-utils/entity repo block-id)
                      ref-tags (distinct (concat (:block/tags block) (:block/refs block)))]
                  (= (-> (db-content/id-ref->title-ref block-content ref-tags)
                         (db-content/content-id-ref->page ref-tags)
                         heading-content->route-name)
                     (string/lower-case external-content))))
              (rules/extract-rules rules/db-query-dsl-rules [:has-property]))
         ffirst)))

(defn get-page-format
  [_page-name]
  {:post [(keyword? %)]}
  :markdown)

(defn page-alias-set
  [repo-url page-id]
  (ldb/page-alias-set (conn/get-db repo-url) page-id))

(defn with-pages
  [blocks]
  (let [pages-ids (->> (map (comp :db/id :block/page) blocks)
                       (remove nil?))
        pages (when (seq pages-ids)
                (db-utils/pull-many '[:db/id :block/name :block/title :block/journal-day] pages-ids))
        pages-map (reduce (fn [acc p]
                            (if (map? p)
                              (assoc acc (:db/id p) p)
                              acc))
                          {}
                          pages)
        blocks (map
                (fn [block]
                  (assoc block
                         :block/page
                         (or (get pages-map (:db/id (:block/page block)))
                             (:block/page block))))
                blocks)]
    blocks))

(def sort-by-order ldb/sort-by-order)

(defn sub-block
  "Used together with rum/reactive db-mixins/query"
  [id & {:keys [ref?]
         :or {ref? false}}]
  (when-let [repo (state/get-current-repo)]
    (when id
      (let [ref (react/q repo [:frontend.worker.react/block id]
                         {:query-fn (fn [_]
                                      (db-utils/entity id))}
                         nil)]
        (if ref? ref
            (let [e (-> ref react)]
              (when-let [id (:db/id e)]
                (db-utils/entity id))))))))

(defn sort-by-order-recursive
  [form]
  (walk/postwalk (fn [f]
                   (if (and (map? f)
                            (:block/_parent f))
                     (let [children (:block/_parent f)]
                       (-> f
                           (dissoc :block/_parent)
                           (assoc :block/children (sort-by-order children))))
                     f))
                 form))

(defn has-children?
  ([block-id]
   (has-children? (conn/get-db) block-id))
  ([db block-id]
   (ldb/has-children? db block-id)))

(comment
  (defn top-block?
    [block]
    (= (:db/id (:block/parent block))
       (:db/id (:block/page block)))))

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
  (when db
    (loop [node (db-utils/entity db db-id)]
      (if-let [last-child-id (get-block-last-direct-child-id db (:db/id node) true)]
        (let [e (db-utils/entity db last-child-id)]
          (if (or (:block/collapsed? e) (empty? (:block/_parent e)))
            last-child-id
            (recur e)))
        nil))))

(def page? ldb/page?)

(defn get-next
  "Get next block, either its right sibling, or loop to find its next block."
  [db db-id & {:keys [skip-collapsed? init?]
               :or {skip-collapsed? true
                    init? true}
               :as opts}]
  (when-let [entity (db-utils/entity db db-id)]
    (or (when-not (and (:block/collapsed? entity) skip-collapsed? init?)
          (ldb/get-right-sibling (d/entity db db-id)))
        (let [parent-id (:db/id (:block/parent (db-utils/entity db db-id)))]
          (get-next db parent-id (assoc opts :init? false))))))

(defn get-prev
  "Get prev block, either its left sibling if the sibling is collapsed or no children,
  or get sibling's last deep displayable child (collaspsed parent or non-collapsed child)."
  [db db-id]
  (when-let [entity (db-utils/entity db db-id)]
    (or
     (when-let [prev-sibling (ldb/get-left-sibling entity)]
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
  [page-name tags]
  (let [repo (state/get-current-repo)]
    (when-let [db (conn/get-db repo)]
      (ldb/page-exists? db page-name tags))))

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
    (ldb/get-children db block-uuid)))

(defn get-block-and-children
  [repo block-uuid & {:as opts}]
  (let [db (conn/get-db repo)]
    (ldb/get-block-and-children db block-uuid opts)))

(defn get-page
  [page-id-name-or-uuid]
  (when page-id-name-or-uuid
    (ldb/get-page (conn/get-db) page-id-name-or-uuid)))

(defn get-journal-page
  [page-name]
  (when page-name
    (ldb/get-journal-page (conn/get-db) page-name)))

(defn get-case-page
  [page-name-or-uuid]
  (when page-name-or-uuid
    (ldb/get-case-page (conn/get-db) page-name-or-uuid)))

(defn get-latest-journals
  ([n]
   (get-latest-journals (state/get-current-repo) n))
  ([repo-url n]
   (when-let [db (conn/get-db repo-url)]
     (take n (ldb/get-latest-journals db)))))

;; get pages who mentioned this page
(defn get-pages-that-mentioned-page
  [repo page-id include-journals?]
  (when-let [db (conn/get-db repo)]
    (graph-view/get-pages-that-mentioned-page db page-id include-journals?)))

(defn journal-page?
  "sanitized page-name only"
  [page-name]
  (when (string? page-name)
    (ldb/journal? (ldb/get-page (conn/get-db) page-name))))

;; FIXME: use `Untitled` instead of UUID for db based graphs
(defn untitled-page?
  [page-name]
  (when (some->> page-name (ldb/get-page (conn/get-db)))
    (some? (parse-uuid page-name))))

(defn get-all-classes
  [repo & {:keys [except-root-class? except-private-tags?
                  except-extends-hidden-tags?]
           :or {except-root-class? false
                except-private-tags? true
                except-extends-hidden-tags? false}}]
  (let [db (conn/get-db repo)
        classes (->> (d/datoms db :avet :block/tags :logseq.class/Tag)
                     (map (fn [d]
                            (db-utils/entity db (:e d))))
                     (remove (fn [d]
                               (and except-private-tags?
                                    (contains? ldb/private-tags (:db/ident d)))))
                     (remove (fn [d]
                               (and except-extends-hidden-tags?
                                    (contains? ldb/extends-hidden-tags (:db/ident d))))))]
    (if except-root-class?
      (keep (fn [e] (when-not (= :logseq.class/Root (:db/ident e)) e)) classes)
      classes)))

(defn ui-non-suitable-property?
  [block m {:keys [class-schema?]}]
  (when block
    (let [block-page? (ldb/page? block)
          block-types (let [types (ldb/get-entity-types block)]
                        (cond-> types
                          (and block-page? (not (contains? types :page)))
                          (conj :page)
                          (empty? types)
                          (conj :block)))
          view-context (get m :logseq.property/view-context :all)]
      (or (contains? #{:logseq.property/query} (:db/ident m))
          (and (not block-page?) (contains? #{:block/alias} (:db/ident m)))
          ;; Filters out properties from being in wrong :view-context and :never view-contexts
          (and (not= view-context :all) (not (contains? block-types view-context)))
          (and (ldb/built-in? block) (contains? #{:logseq.property.class/extends} (:db/ident m)))
          ;; Filters out adding buggy class properties e.g. Alias and Parent
          (and class-schema? (ldb/public-built-in-property? m) (:logseq.property/view-context m))))))

(defn get-all-properties
  "Return seq of all property names except for private built-in properties."
  [graph & {:keys [remove-built-in-property? remove-non-queryable-built-in-property? remove-ui-non-suitable-properties?
                   class-schema? block]
            :or {remove-built-in-property? true
                 remove-non-queryable-built-in-property? false
                 remove-ui-non-suitable-properties? false}}]
  (let [db (conn/get-db graph)
        result (sort-by (juxt (fn [p]
                                (some-> (:db/ident p)
                                        (db-property/plugin-property?)))
                              ldb/built-in?
                              :block/title)
                        (ldb/get-all-properties db))]
    (cond->> result
      remove-built-in-property?
      ;; remove private built-in properties
      (remove (fn [p]
                (let [ident (:db/ident p)]
                  (and (ldb/built-in? p)
                       (not (ldb/public-built-in-property? p))
                       (not= ident :logseq.property/icon)))))
      remove-non-queryable-built-in-property?
      (remove (fn [p]
                (let [ident (:db/ident p)]
                  (and (ldb/built-in? p)
                       (not (:queryable? (db-property/built-in-properties ident)))))))
      remove-ui-non-suitable-properties?
      (remove (fn [p]
                (ui-non-suitable-property? block p {:class-schema? class-schema?}))))))

(defn get-all-readable-classes
  "Gets all classes that are used in a read only context e.g. querying or used
  for property value selection. This should _not_ be used in a write context e.g.
  adding a tag to a node or creating a new node with a tag"
  [repo opts]
  (get-all-classes repo (merge opts {:except-private-tags? false})))

(defn get-structured-children
  [repo eid]
  (db-class/get-structured-children (conn/get-db repo) eid))

(defn get-class-objects
  [repo class-id]
  (when-let [class (db-utils/entity repo class-id)]
    (->>
     (if (first (:logseq.property.class/_extends class))        ; has children classes
       (let [all-classes (conj (->> (get-structured-children repo class-id)
                                    (map #(db-utils/entity repo %)))
                               class)]
         (->> (mapcat :block/_tags all-classes)
              distinct))
       (:block/_tags class))
     (remove ldb/hidden?))))

(comment
  ;; For debugging
  (defn get-all-blocks
    []
    (let [repo (state/get-current-repo)]
      (d/q
       '[:find [(pull ?b [*]) ...]
         :where
         [?b :block/uuid]]
       (conn/get-db repo)))))
