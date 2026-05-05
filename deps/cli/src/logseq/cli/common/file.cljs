(ns logseq.cli.common.file
  "Convert blocks to file content. Used for frontend exports and CLI"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.outliner.tree :as otree]))

(defn- indented-block-content
  [content spaces-tabs]
  (let [lines (string/split-lines content)]
    (string/join (str "\n" spaces-tabs) lines)))

(defn- datetime-journal-title
  [v context]
  (when (integer? v)
    (let [journal-day (cond
                        (<= 10000101 v 99991231)
                        v

                        (>= v 100000000000)
                        (date-time-util/ms->journal-day v)

                        :else
                        nil)]
      (when journal-day
        (date-time-util/int->journal-title
         journal-day
         (or (:date-formatter context)
             date-time-util/default-journal-title-formatter))))))

(defn- property-value->string
  [db property v context]
  (letfn [(entity-map [x]
            (cond
              (map? x) x
              (de/entity? x) (into {} x)))
          (entity-content [x]
            (let [m (entity-map x)]
              (or (:block/title m)
                  (:logseq.property/value m))))]
    (cond
      (some? (entity-content v))
      (str (entity-content v))

      (some? (:db/id (entity-map v)))
      (let [entity (d/entity db (:db/id (entity-map v)))]
        (str (or (entity-content entity)
                 (entity-content v)
                 "")))

      (set? v)
      (->> v
           (sort-by (fn [item]
                      [(if (:block/order item) 0 1)
                       (str (or (:block/order item)
                                (property-value->string db property item context)))]))
           (map #(property-value->string db property % context))
           (string/join ", "))

      (sequential? v)
      (->> v
           (map #(property-value->string db property % context))
           (string/join ", "))

      (keyword? v)
      (name v)

      (and (= :datetime (:logseq.property/type property))
           (integer? v))
      (or (datetime-journal-title v context)
          (str v))

      (some? v)
      (str v))))

(defn- block-properties-content
  [db block spaces-tabs context]
  (let [block (or (when-let [id (:db/id block)]
                    (d/entity db id))
                  (when-let [block-uuid (:block/uuid block)]
                    (d/entity db [:block/uuid block-uuid]))
                  block)
        properties (->> (db-property/properties block)
                        (remove (fn [[k _]]
                                  (contains? db-property/db-attribute-properties k)))
                        (remove (fn [[k _]]
                                  (:logseq.property/hide? (d/entity db k))))
                        (into {}))]
    (when (seq properties)
      (let [sorted-properties (->> (keys properties)
                                   (keep (fn [k] (d/entity db k)))
                                   db-property/sort-properties)]
        (->> sorted-properties
             (keep (fn [property]
                     (let [property-ident (:db/ident property)]
                       (when (contains? properties property-ident)
                       (str spaces-tabs
                            (or (:block/title property)
                                (:block/raw-title property)
                                (name property-ident))
                            ":: "
                            (property-value->string db property (get properties property-ident) context))))))
             (string/join "\n"))))))

(defn- property-value-block-content
  [db b context]
  (when-let [raw-block (d/entity db (:db/id b))]
    (when-let [property (:logseq.property/created-from-property raw-block)]
      (let [property-title (or (:block/title property)
                               (:block/raw-title property)
                               (some-> property :db/ident name))
            value (property-value->string db property
                                          (or (:block/title raw-block)
                                              (:logseq.property/value raw-block))
                                          context)]
        (when property-title
          (str property-title ":: " value))))))

(defn- block-title-content
  [db b context]
  (or (property-value-block-content db b context)
      (db-content/recur-replace-uuid-in-block-title (d/entity db (:db/id b)))))

(defn- transform-content
  [db b level {:keys [heading-to-list? include-properties?]
               :or {include-properties? true}} context]
  (let [heading (:logseq.property/heading b)
        ;; replace [[uuid]] with block's content
        title (block-title-content db b context)
        content (or title "")
        level (if (and heading-to-list? heading)
                (if (> heading 1)
                  (dec heading)
                  heading)
                level)
        spaces-tabs (->>
                     (repeat (dec level) (:export-bullet-indentation context))
                     (apply str))
        prefix (str spaces-tabs "-")
        property-spaces-tabs (str spaces-tabs "  ")
        content (if heading-to-list?
                  (-> (string/replace content #"^\s?#+\s+" "")
                      (string/replace #"^\s?#+\s?$" ""))
                  content)
        new-content (indented-block-content (string/trim content) property-spaces-tabs)
        sep (if (string/blank? new-content)
              ""
              " ")
        content (str prefix sep new-content)]
    (if-let [properties-content (when-not (false? include-properties?)
                                  (block-properties-content db b property-spaces-tabs context))]
      (str content "\n" properties-content)
      content)))

(defn- tree->file-content-aux
  [db tree {:keys [init-level link] :as opts} context]
  (let [block-contents (transient [])]
    (loop [[f & r] tree level init-level]
      (if (nil? f)
        (->> block-contents persistent! flatten (remove nil?))
        (let [page? (nil? (:block/page f))
              content (cond
                        (and page? (not link) (:include-page-properties? opts))
                        (block-properties-content db f "" context)

                        (and page? (not link))
                        nil

                        :else
                        (transform-content db f level opts context))
              new-content
              (if-let [children (seq (:block/children f))]
                (cons content (tree->file-content-aux db children {:init-level (inc level)} context))
                [content])]
          #_:clj-kondo/ignore
          (conj! block-contents new-content)
          (recur r level))))))

(defn tree->file-content
  [db tree opts context]
  (->> (tree->file-content-aux db tree opts context) (string/join "\n")))

(defn- remove-collapsed-descendants
  [tree]
  (mapv
   (fn [node]
     (let [children (:block/children node)]
       (cond
         (and (:block/collapsed? node) (seq children))
         (dissoc node :block/children)

         (seq children)
         (assoc node :block/children (remove-collapsed-descendants children))

         :else
         node)))
   tree))

(defn block->content
  "Converts a block including its children (recursively) to plain-text."
  [db root-block-uuid tree->file-opts context]
  (assert (uuid? root-block-uuid))
  (let [init-level (or (:init-level tree->file-opts)
                       (if (ldb/page? (d/entity db [:block/uuid root-block-uuid]))
                         0
                         1))
        blocks (->> (d/pull-many db '[*] (keep :db/id (ldb/get-block-and-children db root-block-uuid)))
                    (map #(db-content/update-block-content db % (:db/id %))))
        tree (otree/blocks->vec-tree db blocks (str root-block-uuid))
        tree (if (:open-blocks-only? tree->file-opts)
               (remove-collapsed-descendants tree)
               tree)
        tree->file-opts (dissoc tree->file-opts :open-blocks-only?)]
    (tree->file-content db tree
                        (assoc tree->file-opts :init-level init-level)
                        context)))

(defn get-all-page->content
  "Exports a graph's pages as tuples of page name and page content"
  [db options]
  (let [filter-fn (fn [ent]
                    (or (not (:logseq.property/built-in? ent))
                        (contains? sqlite-create-graph/built-in-pages-names (:block/title ent))))]
    (->> (d/datoms db :avet :block/name)
         (map #(d/entity db (:e %)))
         (filter filter-fn)
         (map (fn [e]
                [(:block/title e)
                 (block->content db (:block/uuid e) {} options)])))))
