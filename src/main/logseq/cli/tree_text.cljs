(ns logseq.cli.tree-text
  "Pure tree text renderer shared by CLI commands."
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [logseq.cli.style :as style]
            [logseq.cli.uuid-refs :as uuid-refs]
            [logseq.db.frontend.property :as db-property]))

(defn- entity-id-text
  [entity]
  (str (or (:db/id entity) "-")))

(defn- id-column-width
  [entities]
  (apply max (map (comp count entity-id-text) entities)))

(defn- render-id-column
  [entity id-width]
  (let [id-text (entity-id-text entity)
        padding (max 0 (- id-width (count id-text)))]
    (style/dim (str id-text (apply str (repeat padding " "))))))

(defn- render-id-column-padding
  [id-width]
  (style/dim (apply str (repeat (inc id-width) " "))))

(defn- tag-label
  [tag]
  (or (:block/title tag)
      (:block/name tag)
      (some-> (:block/uuid tag) str)))

(defn- tags->suffix
  [tags]
  (let [labels (->> tags
                    (map tag-label)
                    (remove string/blank?))]
    (when (seq labels)
      (string/join " " (map #(style/bold (str "#" %)) labels)))))

(def ^:private displayable-built-in-properties
  (set/difference db-property/public-built-in-properties
                  #{:block/tags :logseq.property/status}))

(defn- user-property-key?
  [k]
  (and (qualified-keyword? k)
       (= db-property/default-user-namespace (namespace k))))

(defn- displayable-property-key?
  [k]
  (or (user-property-key? k)
      (contains? displayable-built-in-properties k)))

(defn- nonblank-string
  [value]
  (when (and (string? value) (not (string/blank? value)))
    value))

(defn- lookup-ref?
  [value]
  (and (vector? value)
       (= 2 (count value))
       (= :block/uuid (first value))
       (uuid? (second value))))

(defn- db-id-ref?
  [value]
  (and (vector? value)
       (= 2 (count value))
       (= :db/id (first value))
       (number? (second value))))

(defn- property-value->string
  ([value] (property-value->string value nil nil))
  ([value labels] (property-value->string value labels nil))
  ([value labels uuid->label]
   (let [render-visible (fn [text]
                          (some-> text
                                  nonblank-string
                                  (uuid-refs/replace-uuid-refs uuid->label)))]
     (cond
       (string? value) (render-visible value)
       (number? value) (render-visible (or (get labels value) (str value)))
       (uuid? value) (render-visible (or (get labels value) (str value)))
       (db-id-ref? value) (let [id (second value)]
                            (render-visible (get labels id)))
       (lookup-ref? value) (let [uuid (second value)]
                             (render-visible (or (get labels uuid) (str uuid))))
       (boolean? value) (str value)
       (keyword? value) (str value)
       (map? value) (or (render-visible (:block/title value))
                        (render-visible (:block/name value))
                        (when-let [id (:db/id value)]
                          (render-visible (get labels id)))
                        (when-let [uuid (:block/uuid value)]
                          (render-visible (get labels uuid)))
                        (when-let [val (:logseq.property/value value)]
                          (if (string? val)
                            (render-visible val)
                            (str val)))
                        (pr-str value))
       (some? value) (str value)
       :else nil))))

(defn- normalize-property-values
  ([value] (normalize-property-values value nil nil))
  ([value labels] (normalize-property-values value labels nil))
  ([value labels uuid->label]
   (let [values (cond
                  (set? value) (seq value)
                  (or (db-id-ref? value)
                      (lookup-ref? value)) [value]
                  (sequential? value) value
                  (nil? value) nil
                  :else [value])
         rendered (->> values
                       (map #(property-value->string % labels uuid->label))
                       (remove string/blank?)
                       vec)]
     (if (set? value)
       (vec (sort rendered))
       rendered))))

(defn- node-user-property-entries
  ([node] (node-user-property-entries node nil nil))
  ([node labels] (node-user-property-entries node labels nil))
  ([node labels uuid->label]
   (->> node
        (filter (fn [[k _]] (displayable-property-key? k)))
        (map (fn [[k v]] [k (normalize-property-values v labels uuid->label)]))
        (remove (fn [[_ values]] (empty? values)))
        vec)))

(defn- sort-property-entries
  [property-entries]
  (sort-by (comp name first) property-entries))

(defn- property-title-for
  [property-titles property-key]
  (let [title (get property-titles property-key)]
    (nonblank-string title)))

(defn- format-property-lines
  [indent title values]
  (let [title* (style/bold title)]
    (when (seq values)
      (if (= 1 (count values))
        [(str indent title* ": " (first values))]
        (let [item-indent (str indent "  ")]
          (into [(str indent title* ":")]
                (map #(str item-indent "- " %) values)))))))

(defn- node-property-lines
  [node property-titles property-value-labels uuid->label indent]
  (let [property-entries (->> (node-user-property-entries node property-value-labels uuid->label)
                              sort-property-entries)]
    (->> property-entries
         (mapcat (fn [[property-key values]]
                   (when-let [title (property-title-for property-titles property-key)]
                     (format-property-lines indent title values))))
         vec)))

(def ^:private status-color-map
  {:logseq.property/status.backlog style/magenta
   :logseq.property/status.todo style/yellow
   :logseq.property/status.doing style/blue
   :logseq.property/status.in-review style/cyan
   :logseq.property/status.done style/green
   :logseq.property/status.canceled style/red})

(defn- style-status
  [status]
  (when (seq status)
    (let [color-fn (get status-color-map (:db/ident status) identity)]
      (style/bold (color-fn (:block/title status))))))

(defn- block-label
  [node]
  (let [text (:block/title node)
        status (style-status (:logseq.property/status node))
        uuid->label (:uuid->label node)
        base (cond
               (and text (seq status)) (str status " " text)
               text text
               (:block/name node) (:block/name node)
               (:block/uuid node) (some-> (:block/uuid node) str))
        base (uuid-refs/replace-uuid-refs base uuid->label)
        tags-suffix (tags->suffix (:block/tags node))]
    (cond
      (and base tags-suffix) (str base " " tags-suffix)
      tags-suffix tags-suffix
      :else base)))

(defn tree->text
  [{:keys [root uuid->label property-titles property-value-labels]}]
  (let [label (fn [node]
                (let [label* (or (block-label (assoc node :uuid->label uuid->label)) "-")]
                  (if (:show/linked-display? node)
                    (str (style/dim "→ ") label*)
                    label*)))
        collect-nodes (fn collect-nodes [node]
                        (if-let [children (:block/children node)]
                          (into [node] (mapcat collect-nodes children))
                          [node]))
        nodes (collect-nodes root)
        id-width (id-column-width nodes)
        id-padding (render-id-column-padding id-width)
        split-lines (fn [value]
                      (string/split (or value "") #"\n"))
        style-glyph (fn [value]
                      (style/dim value))
        lines (atom [])
        property-indent (fn [prefix]
                          (str id-padding (style-glyph prefix)))
        append-property-lines (fn [node prefix]
                                (let [indent (property-indent prefix)
                                      prop-lines (node-property-lines node property-titles property-value-labels uuid->label indent)]
                                  (doseq [line prop-lines]
                                    (swap! lines conj line))))
        walk (fn walk [node prefix]
               (let [children (:block/children node)
                     total (count children)]
                 (doseq [[idx child] (map-indexed vector children)]
                   (let [last-child? (= idx (dec total))
                         branch (if last-child? "└── " "├── ")
                         next-prefix (str prefix (if last-child? "    " "│   "))
                         rows (split-lines (label child))
                         first-row (first rows)
                         rest-rows (rest rows)
                         line (str (render-id-column child id-width) " "
                                   (style-glyph prefix)
                                   (style-glyph branch)
                                   first-row)]
                     (swap! lines conj line)
                     (doseq [row rest-rows]
                       (swap! lines conj (str id-padding (style-glyph next-prefix) row)))
                     (append-property-lines child next-prefix)
                     (walk child next-prefix)))))]
    (let [rows (split-lines (label root))
          first-row (first rows)
          rest-rows (rest rows)]
      (swap! lines conj (str (render-id-column root id-width) " " first-row))
      (doseq [row rest-rows]
        (swap! lines conj (str id-padding row))))
    (append-property-lines root "")
    (walk root "")
    (string/join "\n" @lines)))
