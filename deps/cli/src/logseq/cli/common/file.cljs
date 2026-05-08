(ns logseq.cli.common.file
  "Convert blocks to file content. Used for frontend exports and CLI"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.outliner.tree :as otree]))

(defn- indented-block-content
  [content spaces-tabs]
  (let [lines (string/split-lines content)]
    (string/join (str "\n" spaces-tabs) lines)))

(defn- journal-day-title
  [journal-day context]
  (date-time-util/int->journal-title
   journal-day
   (or (:date-formatter context)
       date-time-util/default-journal-title-formatter)))

(defn- datetime-value->string
  [v context]
  (when (integer? v)
    (cond
      (<= 10000101 v 99991231)
      (journal-day-title v context)

      (>= v 100000000000)
      (date-time-util/format
       (t/to-default-time-zone (tc/from-long v))
       (str (or (:date-formatter context)
                date-time-util/default-journal-title-formatter)
            " HH:mm")))))

(declare property-value->string block-properties-content)

(defn- property-value-sort-key
  [db property item context]
  [(if (:block/order item) 0 1)
   (str (or (:block/order item)
            (property-value->string db property item context)))])

(defn- property-values->seq
  [db property v context]
  (if (set? v)
    (sort-by #(property-value-sort-key db property % context) v)
    [v]))

(defn- property-values->string
  [db property v context]
  (->> (property-values->seq db property v context)
       (map #(property-value->string db property % context))
       (string/join ", ")))

(defn- property-value->string
  [db property v context]
  (letfn [(entity-map [x]
            (cond
              (map? x) x
              (de/entity? x) (into {} x)))
          (entity-content [x]
            (let [m (entity-map x)]
              (or (:block/title m)
                  (:logseq.property/value m))))
          (node-ref-content [content]
            (if (and (:export-node-property-values-as-page-refs? context)
                     (= :node (:logseq.property/type property))
                     (string? content)
                     (not (string/blank? content)))
              (page-ref/->page-ref content)
              content))]
    (cond
      (some? (entity-content v))
      (str (node-ref-content (entity-content v)))

      (some? (:db/id (entity-map v)))
      (let [entity (d/entity db (:db/id (entity-map v)))]
        (str (node-ref-content (or (entity-content entity)
                                   (entity-content v)
                                   ""))))

      (set? v)
      (property-values->string db property v context)

      (sequential? v)
      (property-values->string db property v context)

      (keyword? v)
      (name v)

      (and (= :datetime (:logseq.property/type property))
           (integer? v))
      (or (datetime-value->string v context)
          (str v))

      (some? v)
      (str v))))

(defn- property-value-block-title
  [db property v context]
  (letfn [(entity-map [x]
            (cond
              (map? x) x
              (de/entity? x) (into {} x)))]
    (if-let [id (:db/id (entity-map v))]
      (db-content/recur-replace-uuid-in-block-title
       (d/entity db id)
       10
       {:replace-block-refs? (not (:preserve-block-refs? context))})
      (property-value->string db property v context))))

(defn- default-property-value-block-content
  [db property v spaces-tabs context]
  (let [line (str spaces-tabs "- " (property-value-block-title db property v context))
        properties-content (when-let [id (:db/id v)]
                             (block-properties-content db (d/entity db id) (str spaces-tabs "  ") context))]
    (cond-> line
      properties-content
      (str "\n" properties-content))))

(defn- property-value-blocks-content
  [db property v spaces-tabs context]
  (->> (property-values->seq db property v context)
       (map #(default-property-value-block-content db property % spaces-tabs context))
       (string/join "\n")))

(defn- property-line-content
  [property-title value spaces-tabs context]
  (str spaces-tabs
       (when (:export-properties-as-list-items? context) "* ")
       property-title
       "::"
       (when (some? value)
         (str " " value))))

(defn- default-property-values-as-blocks?
  [property value context]
  (and (:export-default-property-values-as-blocks? context)
       (= :default (:logseq.property/type property))
       (not (if (set? value)
              (some :block/closed-value-property value)
              (:block/closed-value-property value)))))

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
                                  (contains? (:excluded-properties context) k)))
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
                         (let [property-title (or (:block/title property)
                                                  (:block/raw-title property)
                                                  (name property-ident))
                               value (get properties property-ident)]
                           (if (default-property-values-as-blocks? property value context)
                             (str (property-line-content property-title nil spaces-tabs context)
                                  "\n"
                                  (property-value-blocks-content db property value (str spaces-tabs "  ") context))
                             (property-line-content
                              property-title
                              (property-value->string db property value context)
                              spaces-tabs
                              context)))))))
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
          (property-line-content property-title value "" context))))))

(defn- block-title-content
  [db b context]
  (or (property-value-block-content db b context)
      (db-content/recur-replace-uuid-in-block-title
       (d/entity db (:db/id b))
       10
       {:replace-block-refs? (not (:preserve-block-refs? context))})))

(defn- bounded-heading-level
  [heading level]
  (cond
    (integer? heading)
    (-> heading (max 1) (min 6))

    (true? heading)
    (min (inc level) 6)

    :else
    nil))

(defn- strip-heading-prefix
  [content]
  (-> (string/replace content #"^\s?#+\s+" "")
      (string/replace #"^\s?#+\s?$" "")))

(defn- quote-content
  [content]
  (->> (or (seq (string/split-lines content)) [""])
       (map (fn [line]
              (if (string/blank? line)
                ">"
                (str "> " line))))
       (string/join "\n")))

(defn- code-fence
  [content]
  (apply str (repeat (max 3 (inc (apply max 0 (map count (re-seq #"`+" content))))) "`")))

(defn- fenced-code-content
  [content lang]
  (let [fence (code-fence content)]
    (str fence (when-not (string/blank? lang) lang)
         "\n" content "\n" fence)))

(defn- displayed-math-content
  [content]
  (str "$$\n" content "\n$$"))

(defn- format-markdown-block-content
  [b content level heading-to-list?]
  (let [content (or content "")]
    (case (:logseq.property.node/display-type b)
      :quote
      (quote-content content)

      :code
      (fenced-code-content content (:logseq.property.code/lang b))

      :math
      (displayed-math-content content)

      (if-let [heading-level (and (not heading-to-list?)
                                  (bounded-heading-level (:logseq.property/heading b) level))]
        (str (apply str (repeat heading-level "#")) " " (strip-heading-prefix content))
        content))))

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
                  (strip-heading-prefix content)
                  (format-markdown-block-content b content level heading-to-list?))
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
