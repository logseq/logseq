(ns logseq.cli.command.show
  "Show-related CLI commands."
  (:require ["fs" :as fs]
            [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [logseq.cli.command.core :as core]
            [logseq.cli.command.id :as id-command]
            [logseq.cli.humanize :as cli-humanize]
            [logseq.cli.output-mode :as output-mode]
            [logseq.cli.server :as cli-server]
            [logseq.cli.style :as style]
            [logseq.cli.transport :as transport]
            [logseq.cli.uuid-refs :as uuid-refs]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.property :as db-property]
            [promesa.core :as p]
            ["string-width" :default string-width]))

(def ^:private show-spec
  {:id {:desc "Block db/id or EDN vector of ids"}
   :uuid {:desc "Block UUID"
          :validate {:pred (comp parse-uuid str)
                     :ex-msg (constantly "Option uuid must be a valid UUID string")}}
   :page {:desc "Page name"
          :complete :pages}
   :page-hierarchy {:desc "Show child page hierarchy for page targets (default false)"
                    :coerce :boolean}
   :linked-references {:desc "Include linked references (default true)"
                       :coerce :boolean}
   :ref-id-footer {:desc "Show referenced entity id footer (default true)"
                   :coerce :boolean}
   :level {:desc "Limit tree depth (default 10)"
           :coerce :long}})

(def entries
  [(core/command-entry ["show"] :show "Show tree" show-spec
                       {:examples ["logseq show --graph my-graph --page Home"
                                   "logseq show --graph my-graph --page Foo --page-hierarchy true"
                                   "logseq show --graph my-graph --page \"Meeting Notes\" --level 2"
                                   "logseq show --graph my-graph --id 123 --level 3"
                                   "logseq show --graph my-graph --id '[123,456,789]'"
                                   "logseq show --graph my-graph --uuid 11111111-1111-1111-1111-111111111111"]})])

(def ^:private multi-id-delimiter "\n================================================================\n")
(def ^:private show-breadcrumb-segment-max-display-width 24)
(def ^:private breadcrumb-separator " > ")
(def ^:private breadcrumb-truncation-suffix "…")
(def ^:private breadcrumb-truncation-suffix-width (string-width breadcrumb-truncation-suffix))
(def ^:private schema-definition-class-idents
  #{:logseq.class/Tag
    :logseq.class/Property
    :logseq.class/Page})

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

(defn- breadcrumb-label
  [entity]
  (or (:block/title entity)
      (:block/name entity)
      (some-> (:block/uuid entity) str)
      (some-> (:db/id entity) str)))

(defn- breadcrumb-display-width
  [value]
  (string-width (str (or value ""))))

(defn- take-to-display-width
  [text max-width]
  (loop [remaining-chars (seq (js/Array.from (or text "")))
         acc ""]
    (if-let [ch (first remaining-chars)]
      (let [candidate (str acc ch)]
        (if (<= (breadcrumb-display-width candidate) max-width)
          (recur (next remaining-chars) candidate)
          acc))
      acc)))

(defn- truncate-breadcrumb-segment
  ([value]
   (truncate-breadcrumb-segment value show-breadcrumb-segment-max-display-width))
  ([value max-width]
   (let [value (str (or value ""))
         max-width (max 1 max-width)]
     (if (<= (breadcrumb-display-width value) max-width)
       value
       (if (<= max-width breadcrumb-truncation-suffix-width)
         (take-to-display-width breadcrumb-truncation-suffix max-width)
         (str (take-to-display-width value (- max-width breadcrumb-truncation-suffix-width))
              breadcrumb-truncation-suffix))))))

(defn- schema-definition-root?
  [root]
  (boolean (some schema-definition-class-idents
                 (keep :db/ident (:block/tags root)))))

(declare property-value-block?)

(defn- ordinary-block-root?
  [root]
  (and (map? root)
       (some? (get-in root [:block/page :db/id]))
       (not (property-value-block? root))
       (not (schema-definition-root? root))))

(defn- fetch-breadcrumb-parents
  [config repo root]
  (if (and (ordinary-block-root? root)
           (:db/id root))
    (-> (transport/invoke config :thread-api/get-block-parents [repo (:db/id root)])
        (p/then (fn [parents]
                  (or parents []))))
    (p/resolved [])))

(defn- render-breadcrumb-line
  [parents]
  (let [rows (->> parents
                  (map (fn [parent]
                         (let [label (-> parent breadcrumb-label truncate-breadcrumb-segment)]
                           (when-not (string/blank? label)
                             {:parent parent
                              :label label}))))
                  (remove nil?)
                  vec)]
    (when (seq rows)
      (let [id-width (id-column-width (map :parent rows))]
        (->> rows
             (map-indexed (fn [idx {:keys [parent label]}]
                            (let [tree-indent (apply str (repeat (* idx 2) " "))]
                              (str (render-id-column parent id-width)
                                   tree-indent
                                   breadcrumb-separator
                                   label))))
             (string/join "\n"))))))

(defn read-stdin
  []
  (.toString (fs/readFileSync 0) "utf8"))

(defn- normalize-stdin-id
  [value]
  (let [text (string/trim (or value ""))
        last-line (-> text string/split-lines last (or "") string/trim)]
    (cond
      (string/blank? text) text
      (string/starts-with? text "[") text
      (re-matches #"-?\d+" text) text
      (re-matches #"\[[\d\s,]*\]" last-line) last-line
      :else
      (let [tokens (->> (string/split text #"\s+")
                        (remove string/blank?))]
        (if (and (seq tokens) (every? #(re-matches #"-?\d+" %) tokens))
          (str "[" (string/join " " tokens) "]")
          text)))))

(defn- resolve-stdin-id
  [options]
  (let [stdin (cond
                (contains? options :stdin) (:stdin options)
                (:id-from-stdin? options) (read-stdin)
                :else nil)
        normalized (normalize-stdin-id stdin)]
    (if (string/blank? normalized)
      options
      (assoc options :id normalized))))

(defn invalid-options?
  [opts]
  (let [level (:level opts)
        id-value (:id opts)
        id-missing? (and (:id-from-stdin? opts)
                         (or (nil? id-value)
                             (and (string? id-value) (string/blank? id-value))))
        id-result (when-not id-missing?
                    (id-command/parse-id-option id-value))]
    (cond
      (and (some? level) (< level 1))
      "level must be >= 1"

      (and (some? id-value) (not id-missing?) (not (:ok? id-result)))
      (:message id-result)

      :else
      nil)))

(def ^:private link-target-selector
  [:db/id
   :db/ident
   :block/name
   :block/uuid
   :block/title
   :block/order
   :logseq.property/built-in?
   :logseq.property/deleted-at
   :logseq.property/created-from-property
   {:logseq.property/status [:db/ident :block/title]}
   {:block/page [:db/id :block/title :block/name :block/uuid]}
   {:block/tags [:db/id :db/ident :block/name :block/title :block/uuid]}
   {:block/parent [:db/id
                   :block/name
                   :block/title
                   :block/uuid
                   {:block/page [:db/id :block/name :block/title :block/uuid]}]}])

(def ^:private show-root-selector
  (conj link-target-selector {:block/link link-target-selector}))

(def ^:private tree-block-selector
  [:db/id
   :db/ident
   :block/uuid
   :block/title
   :logseq.property/created-from-property
   {:logseq.property/status [:db/ident :block/title]}
   :block/order
   {:block/parent [:db/id]}
   {:block/tags [:db/id :db/ident :block/name :block/title :block/uuid]}
   {:block/link link-target-selector}])

(def ^:private page-hierarchy-child-selector
  [:db/id
   :db/ident
   :block/name
   :block/uuid
   :block/title
   :block/order
   :logseq.property/built-in?
   {:logseq.property/status [:db/ident :block/title]}
   {:block/parent [:db/id :block/name :block/title :block/uuid]}
   {:block/tags [:db/id :db/ident :block/name :block/title :block/uuid]}
   {:block/link link-target-selector}])

(def ^:private linked-ref-selector
  [:db/id
   :db/ident
   :block/uuid
   :block/title
   :logseq.property/created-from-property
   {:logseq.property/status [:db/ident :block/title]}
   {:block/tags [:db/id :block/name :block/title :block/uuid]}
   {:block/page [:db/id :block/name :block/title :block/uuid]}
   {:block/parent [:db/id
                   :block/name
                   :block/title
                   :block/uuid
                   {:block/page [:db/id :block/name :block/title :block/uuid]}]}
   {:block/link link-target-selector}])

(declare tree->text
         attach-user-properties
         attach-user-properties-to-entity)

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
  "Built-in properties that are displayed alongside user properties."
  (set/difference db-property/public-built-in-properties
                  ;; Exclude built-in properties handled elsewhere in this command
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

(defn- epoch-ms->iso-string
  [ms]
  (when-not (number? ms)
    (throw (ex-info "datetime value must be a number"
                    {:code :invalid-datetime-value
                     :value ms})))
  (when-not (js/Number.isFinite ms)
    (throw (ex-info "datetime value must be finite"
                    {:code :invalid-datetime-value
                     :value ms})))
  (.toISOString (js/Date. ms)))

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

(defn- resolve-uuid-refs-in-node
  [node uuid->label]
  (cond-> node
    (:block/title node) (update :block/title uuid-refs/replace-uuid-refs uuid->label)
    (:block/name node) (update :block/name uuid-refs/replace-uuid-refs uuid->label)
    (:block/children node) (update :block/children (fn [children]
                                                     (mapv #(resolve-uuid-refs-in-node % uuid->label) children)))
    (:block/page node) (update :block/page (fn [page]
                                             (if (map? page)
                                               (resolve-uuid-refs-in-node page uuid->label)
                                               page)))
    (:block/tags node) (update :block/tags (fn [tags]
                                             (mapv #(resolve-uuid-refs-in-node % uuid->label) tags)))))

(defn- resolve-uuid-refs-in-tree-data
  [{:keys [linked-references] :as tree-data} uuid->label]
  (let [resolve-node #(resolve-uuid-refs-in-node % uuid->label)]
    (cond-> (update tree-data :root resolve-node)
      (seq (:blocks linked-references))
      (update :linked-references
              (fn [refs]
                (update refs :blocks #(mapv resolve-node %)))))))

(defn- page-label
  [block]
  (let [page (:block/page block)]
    (or (:block/title page)
        (:block/name page)
        (some-> (:block/uuid page) str)
        (some-> (:block/uuid block) str))))

(defn- fetch-linked-references
  [config repo root-id]
  (p/let [refs (transport/invoke config :thread-api/get-block-refs [repo root-id])
          ref-ids (vec (keep :db/id refs))
          pulled (if (seq ref-ids)
                   (p/all (map (fn [id]
                                 (transport/invoke config :thread-api/pull [repo linked-ref-selector id]))
                               ref-ids))
                   [])]
    (let [blocks (vec (remove (fn [block]
                                (or (nil? block)
                                    (property-value-block? block)))
                              pulled))
          page-lookup-key (fn [value]
                            (cond
                              (map? value) (or (:db/id value)
                                               (when-let [uuid (:block/uuid value)]
                                                 [:block/uuid uuid]))
                              (number? value) value
                              (uuid? value) [:block/uuid value]
                              (and (string? value) (common-util/uuid-string? value)) [:block/uuid (uuid value)]
                              :else nil))
          page-id-from (fn [block]
                         (let [page (:block/page block)
                               parent (:block/parent block)
                               parent-page (:block/page parent)]
                           (or (page-lookup-key page)
                               (page-lookup-key parent-page)
                               (page-lookup-key parent))))
          page-ids (->> blocks
                        (keep page-id-from)
                        distinct
                        vec)]
      (p/let [blocks (attach-user-properties config repo blocks)
              pages (if (seq page-ids)
                      (p/all (map (fn [id]
                                    (transport/invoke config :thread-api/pull
                                                      [repo [:db/id :block/name :block/title :block/uuid] id]))
                                  page-ids))
                      [])]
        (let [page-id->page (zipmap page-ids pages)
              blocks (mapv (fn [block]
                             (let [page (:block/page block)
                                   parent (:block/parent block)
                                   parent-page (:block/page parent)
                                   page-id (page-id-from block)
                                   page (or (when (map? page)
                                              (select-keys page [:db/id :block/name :block/title :block/uuid]))
                                            (when (map? parent-page)
                                              (select-keys parent-page [:db/id :block/name :block/title :block/uuid]))
                                            (get page-id->page page-id)
                                            (when (map? parent)
                                              (select-keys parent [:db/id :block/name :block/title :block/uuid]))
                                            (when (or (:block/title block) (:block/name block) (:block/uuid block))
                                              (select-keys block [:db/id :block/name :block/title :block/uuid])))]
                               (cond-> (dissoc block :block/parent)
                                 page (assoc :block/page page))))
                           blocks)]
          {:count (count blocks)
           :blocks blocks})))))

(defn- linked-refs->text
  [blocks uuid->label property-titles property-value-labels]
  (let [page-key (fn [block]
                   (let [page (:block/page block)]
                     (or (:db/id page)
                         (:block/uuid page)
                         (page-label block))))
        page-node (fn [block]
                    (let [page (:block/page block)]
                      (cond
                        (map? page) page
                        (some? page) {:db/id page}
                        :else {})))
        groups (->> blocks
                    (group-by page-key)
                    (sort-by (fn [[_ page-blocks]]
                               (page-label (first page-blocks)))))]
    (string/join
     "\n\n"
     (map (fn [[_ page-blocks]]
            (let [root (page-node (first page-blocks))
                  root (assoc root :block/children (vec page-blocks))]
              (tree->text {:root root
                           :uuid->label uuid->label
                           :property-titles property-titles
                           :property-value-labels property-value-labels})))
          groups))))

(defn- collect-uuid-refs
  [{:keys [root]} linked-refs]
  (let [collect-nodes (fn collect-nodes [node]
                        (if-let [children (:block/children node)]
                          (into [node] (mapcat collect-nodes children))
                          [node]))
        nodes (when root (collect-nodes root))
        ref-blocks (:blocks linked-refs)
        pages (keep :block/page ref-blocks)
        texts (->> (concat nodes ref-blocks pages)
                   (mapcat (fn [node] (keep node [:block/title :block/name])))
                   (remove string/blank?))]
    (->> texts
         (mapcat uuid-refs/extract-uuid-refs)
         distinct
         vec)))

(defn- collect-user-property-keys
  [{:keys [root linked-references]}]
  (letfn [(collect-node [node]
            (let [node-keys (->> (keys node)
                                 (filter displayable-property-key?))]
              (reduce (fn [acc child]
                        (into acc (collect-node child)))
                      (set node-keys)
                      (or (:block/children node) []))))]
    (let [root-keys (if root (collect-node root) #{})
          linked-keys (reduce (fn [acc block]
                                (into acc (collect-node block)))
                              #{}
                              (or (:blocks linked-references) []))]
      (into root-keys linked-keys))))

(defn- property-value-label
  [entity]
  (when (map? entity)
    (or (nonblank-string (:block/title entity))
        (nonblank-string (:block/name entity))
        (when-let [val (:logseq.property/value entity)]
          (if (string? val)
            (nonblank-string val)
            (str val))))))

(defn- collect-property-value-refs
  [{:keys [root linked-references]}]
  (letfn [(collect-value [acc value]
            (cond
              (lookup-ref? value)
              (update acc :uuids conj (second value))

              (uuid? value)
              (update acc :uuids conj value)

              (number? value)
              (update acc :ids conj value)

              (map? value)
              (let [resolved? (or (nonblank-string (:block/title value))
                                  (nonblank-string (:block/name value))
                                  (some? (:logseq.property/value value)))]
                (if resolved?
                  acc
                  (cond-> acc
                    (:block/uuid value) (update :uuids conj (:block/uuid value))
                    (:db/id value) (update :ids conj (:db/id value)))))

              (set? value)
              (reduce collect-value acc value)

              (sequential? value)
              (reduce collect-value acc value)

              :else acc))
          (collect-node [acc node]
            (let [acc (reduce (fn [acc [k v]]
                                (if (displayable-property-key? k)
                                  (collect-value acc v)
                                  acc))
                              acc
                              node)]
              (reduce collect-node acc (or (:block/children node) []))))]
    (let [init {:ids #{} :uuids #{}}
          acc-root (if root (collect-node init root) init)]
      (reduce collect-node acc-root (or (:blocks linked-references) [])))))

(defn- property-visible?
  [entity]
  (and (map? entity)
       (not (true? (:logseq.property/hide? entity)))
       (not (false? (:logseq.property/public? entity)))))

(defn- property-entity-title
  [entity]
  (or (nonblank-string (:block/title entity))
      (nonblank-string (:block/name entity))))

(defn- property-value-block?
  [block]
  (some? (:logseq.property/created-from-property block)))

(defn- fetch-property-titles
  [config repo property-keys]
  (if (seq property-keys)
    (let [keys (vec property-keys)
          selector [:db/id :db/ident :block/title :block/name
                    :logseq.property/hide? :logseq.property/public?]]
      (p/let [entities (p/all (map (fn [property-key]
                                     (transport/invoke config :thread-api/pull
                                                       [repo selector [:db/ident property-key]]))
                                   keys))]
        (->> (map vector keys entities)
             (keep (fn [[property-key entity]]
                     (when (property-visible? entity)
                       (when-let [title (property-entity-title entity)]
                         [property-key title]))))
             (into {}))))
    (p/resolved {})))

(defn- fetch-property-value-labels
  [config repo {:keys [ids uuids]}]
  (if (or (seq ids) (seq uuids))
    (let [selector [:db/id :block/uuid :block/title :block/name :logseq.property/value]
          ids* (vec ids)
          uuids* (vec uuids)]
      (p/let [id-entities (if (seq ids*)
                            (p/all (map (fn [id]
                                          (transport/invoke config :thread-api/pull
                                                            [repo selector id]))
                                        ids*))
                            [])
              uuid-entities (if (seq uuids*)
                              (p/all (map (fn [uuid]
                                            (transport/invoke config :thread-api/pull
                                                              [repo selector [:block/uuid uuid]]))
                                          uuids*))
                              [])]
        (->> (concat id-entities uuid-entities)
             (remove nil?)
             (reduce (fn [acc entity]
                       (if-let [label (property-value-label entity)]
                         (cond-> acc
                           (:db/id entity) (assoc (:db/id entity) label)
                           (:block/uuid entity) (assoc (:block/uuid entity) label))
                         acc))
                     {}))))
    (p/resolved {})))

(defn- merge-fetched-property-value
  [existing value]
  (cond
    (nil? existing) value
    (= existing value) existing
    (sequential? existing) (if (some #(= % value) existing)
                             existing
                             (conj (vec existing) value))
    :else [existing value]))

(defn- fetch-user-properties
  [config repo block-ids]
  (if (seq block-ids)
    (let [idents-query '[:find ?a ?type
                         :where
                         [?e :db/ident ?a]
                         [(namespace ?a) ?ns]
                         [(= "user.property" ?ns)]
                         [(get-else $ ?e :logseq.property/type :default) ?type]]
          built-in-query '[:find ?a ?type
                           :in $ [?a ...]
                           :where
                           [?e :db/ident ?a]
                           [(get-else $ ?e :logseq.property/type :default) ?type]]
          props-query '[:find ?b ?a ?v
                        :in $ [?b ...] [?a ...]
                        :where
                        [?b ?a ?v]]
          ids (vec block-ids)
          built-in-idents (vec displayable-built-in-properties)]
      (p/let [user-pairs (transport/invoke config :thread-api/q [repo [idents-query]])
              built-in-pairs (transport/invoke config :thread-api/q
                                               [repo [built-in-query built-in-idents]])
              ident-type-pairs (into (vec user-pairs) built-in-pairs)
              datetime-idents (set (keep (fn [[a type]] (when (= :datetime type) a)) ident-type-pairs))
              property-idents (vec (map first ident-type-pairs))]
        (if (seq property-idents)
          (p/let [rows (transport/invoke config :thread-api/q
                                         [repo [props-query ids property-idents]])]
            (reduce (fn [acc [block-id attr value]]
                      (let [value (if (and (number? value) (contains? datetime-idents attr))
                                    (epoch-ms->iso-string value)
                                    value)]
                        (update-in acc [block-id attr] merge-fetched-property-value value)))
                    {}
                    rows))
          {})))
    (p/resolved {})))

(defn- attach-user-properties
  [config repo blocks]
  (let [block-ids (vec (keep :db/id blocks))]
    (p/let [id->props (fetch-user-properties config repo block-ids)]
      (mapv (fn [block]
              (if-let [props (get id->props (:db/id block))]
                (merge block props)
                block))
            blocks))))

(defn- attach-user-properties-to-entity
  [config repo entity]
  (if-let [block-id (:db/id entity)]
    (p/let [id->props (fetch-user-properties config repo [block-id])]
      (if-let [props (get id->props block-id)]
        (merge entity props)
        entity))
    (p/resolved entity)))

(defn- attach-property-titles
  [config repo tree-data]
  (let [property-keys (collect-user-property-keys tree-data)
        value-refs (collect-property-value-refs tree-data)]
    (p/let [titles (fetch-property-titles config repo property-keys)
            value-labels (fetch-property-value-labels config repo value-refs)]
      (assoc tree-data
             :property-titles titles
             :property-value-labels value-labels))))

(defn- fetch-blocks-for-page
  [config repo page-id]
  (let [query [:find (list 'pull '?b tree-block-selector)
               :in '$ '?page-id
               :where ['?b :block/page '?page-id]]]
    (p/let [rows (transport/invoke config :thread-api/q [repo [query page-id]])
            blocks (->> rows
                        (map first)
                        (remove property-value-block?)
                        vec)
            blocks (attach-user-properties config repo blocks)]
      blocks)))

(defn- build-tree
  [blocks root-id max-depth]
  (let [parent->children (group-by #(get-in % [:block/parent :db/id]) blocks)
        sort-children (fn [children]
                        (vec (sort-by :block/order children)))
        build (fn build [parent-id depth]
                (mapv (fn [b]
                        (let [children (build (:db/id b) (inc depth))]
                          (cond-> b
                            (seq children) (assoc :block/children children))))
                      (if (and max-depth (>= depth max-depth))
                        []
                        (sort-children (get parent->children parent-id)))))]
    (build root-id 1)))

(defn- library-page?
  [entity]
  (ldb/library? entity))

(defn- page-hierarchy-display-page?
  [entity]
  (and (ldb/page? entity)
       (not (or (ldb/class? entity)
                (ldb/property? entity)))))

(defn- page-hierarchy-target-page?
  [entity]
  (and (page-hierarchy-display-page? entity)
       (not (some? (get-in entity [:block/page :db/id])))))

(defn- fetch-page-hierarchy-children
  [config repo parent-id]
  (let [query [:find (list 'pull '?child page-hierarchy-child-selector)
               :in '$ '?parent-id
               :where ['?child :block/parent '?parent-id]]]
    (p/let [rows (transport/invoke config :thread-api/q [repo [query parent-id]])
            children (->> rows
                          (map first)
                          (filter page-hierarchy-display-page?)
                          (sort-by :block/order)
                          vec)
            children (attach-user-properties config repo children)]
      children)))

(defn- fetch-page-hierarchy-tree-for-entity
  [config repo entity max-depth]
  (letfn [(build-node [node depth visited]
            (let [node-id (:db/id node)]
              (when (and node-id (contains? visited node-id))
                (throw (ex-info "page hierarchy parent cycle detected"
                                {:code :page-hierarchy-parent-cycle
                                 :node-id node-id})))
              (let [visited* (cond-> visited node-id (conj node-id))
                    node* (dissoc node :block/children)]
                (if (and max-depth (>= depth max-depth))
                  (p/resolved node*)
                  (p/let [children (fetch-page-hierarchy-children config repo node-id)
                          children* (p/all (map #(build-node % (inc depth) visited*) children))]
                    (cond-> node*
                      (seq children*) (assoc :block/children (vec children*))))))))]
    (build-node entity 1 #{})))

(defn- link-target-key
  [link]
  (cond
    (map? link) (or (:db/id link)
                    (when-let [uuid (:block/uuid link)]
                      [:block/uuid uuid]))
    (number? link) link
    (uuid? link) [:block/uuid link]
    (and (vector? link) (= 2 (count link))) link
    :else nil))

(defn- link-target-id
  [link]
  (cond
    (map? link) (:db/id link)
    (number? link) link
    :else nil))

(declare fetch-tree-for-entity
         missing-show-entity?
         resolve-linked-blocks-in-node)

(defn- pull-link-target
  [config repo link]
  (if-let [target-key (link-target-key link)]
    (p/let [target (transport/invoke config :thread-api/pull [repo show-root-selector target-key])
            target (attach-user-properties-to-entity config repo target)]
      (if (missing-show-entity? target)
        (throw (ex-info "block link target not found"
                        {:code :block-link-target-not-found
                         :target target-key}))
        target))
    (throw (ex-info "block link target not found"
                    {:code :block-link-target-not-found
                     :target link}))))

(defn- remaining-linked-depth
  [max-depth depth]
  (when max-depth
    (max 1 (inc (- max-depth depth)))))

(defn- resolve-linked-target-node
  [config repo source-node max-depth depth visited page-hierarchy?]
  (let [source-id (:db/id source-node)
        link (:block/link source-node)
        target-id (link-target-id link)]
    (when (and target-id (contains? visited target-id))
      (throw (ex-info "block link cycle detected"
                      {:code :block-link-cycle
                       :source-id source-id
                       :target-id target-id})))
    (p/let [target (pull-link-target config repo link)
            target-id (:db/id target)]
      (when (contains? visited target-id)
        (throw (ex-info "block link cycle detected"
                        {:code :block-link-cycle
                         :source-id source-id
                         :target-id target-id})))
      (let [visited* (cond-> (conj visited target-id)
                       source-id (conj source-id))]
        (p/let [target-root (fetch-tree-for-entity config repo target (remaining-linked-depth max-depth depth) page-hierarchy?)
                resolved-target (resolve-linked-blocks-in-node config repo target-root max-depth depth visited* page-hierarchy?)]
          (assoc resolved-target
                 :show/linked-display? true
                 :show/link-source-id source-id
                 :show/link-source-uuid (:block/uuid source-node)))))))

(defn- resolve-linked-blocks-in-node
  [config repo node max-depth depth visited page-hierarchy?]
  (if (:block/link node)
    (resolve-linked-target-node config repo node max-depth depth visited page-hierarchy?)
    (let [children (:block/children node)]
      (if (seq children)
        (p/let [children* (p/all (map (fn [child]
                                        (resolve-linked-blocks-in-node config repo child max-depth (inc depth) visited page-hierarchy?))
                                      children))]
          (assoc node :block/children (vec children*)))
        (p/resolved node)))))

(defn- fetch-tree-for-entity
  [config repo entity max-depth page-hierarchy?]
  (let [entity-id (:db/id entity)]
    (cond
      (library-page? entity)
      (fetch-page-hierarchy-tree-for-entity config repo entity max-depth)

      (and page-hierarchy?
           (page-hierarchy-target-page? entity))
      (fetch-page-hierarchy-tree-for-entity config repo entity max-depth)

      (get-in entity [:block/page :db/id])
      (let [page-id (get-in entity [:block/page :db/id])]
        (p/let [blocks (fetch-blocks-for-page config repo page-id)
                children (build-tree blocks entity-id max-depth)]
          (assoc entity :block/children children)))

      entity-id
      (p/let [blocks (fetch-blocks-for-page config repo entity-id)
              children (build-tree blocks entity-id max-depth)]
        (assoc entity :block/children children))

      :else
      (throw (ex-info "block link target not found"
                      {:code :block-link-target-not-found})))))

(defn- resolve-linked-blocks-in-tree-data
  [config action tree-data]
  (let [max-depth (or (:level action) 10)]
    (p/let [root (resolve-linked-blocks-in-node config (:repo action) (:root tree-data) max-depth 1 #{} (:page-hierarchy? action))]
      (assoc tree-data :root root))))

(defn- resolve-linked-blocks-in-linked-references
  [config action linked-refs]
  (let [max-depth (or (:level action) 10)
        blocks (:blocks linked-refs)]
    (if (seq blocks)
      (p/let [blocks* (p/all (map (fn [block]
                                    (resolve-linked-blocks-in-node config (:repo action) block max-depth 1 #{} (:page-hierarchy? action)))
                                  blocks))]
        (assoc linked-refs :blocks (vec blocks*)))
      (p/resolved linked-refs))))

(defn- entity-id-only?
  [entity]
  (and (map? entity)
       (contains? entity :db/id)
       (= #{:db/id} (set (keys entity)))))

(defn- missing-show-entity?
  [entity]
  (or (nil? entity)
      (entity-id-only? entity)))

(defn- fetch-tree
  [config {:keys [repo id page level page-hierarchy?] :as opts}]
  (let [max-depth (or level 10)
        uuid-str (:uuid opts)]
    (cond
      (some? id)
      (p/let [entity (transport/invoke config :thread-api/pull
                                       [repo show-root-selector id])]
        (p/let [entity (attach-user-properties-to-entity config repo entity)]
          (if (missing-show-entity? entity)
            (throw (ex-info "entity not found" {:code :entity-not-found}))
            (p/let [root (fetch-tree-for-entity config repo entity max-depth page-hierarchy?)]
              {:root root}))))

      (seq uuid-str)
      (p/let [entity (transport/invoke config :thread-api/pull
                                       [repo show-root-selector
                                        [:block/uuid (uuid uuid-str)]])
              entity (if (:db/id entity)
                       entity
                       (transport/invoke config :thread-api/pull
                                         [repo show-root-selector
                                          [:block/uuid uuid-str]]))]
        (p/let [entity (attach-user-properties-to-entity config repo entity)]
          (if (missing-show-entity? entity)
            (throw (ex-info "entity not found" {:code :entity-not-found}))
            (p/let [root (fetch-tree-for-entity config repo entity max-depth page-hierarchy?)]
              {:root root}))))

      (seq page)
      (p/let [page-entity (transport/invoke config :thread-api/pull
                                            [repo show-root-selector [:block/name page]])]
        (p/let [page-entity (attach-user-properties-to-entity config repo page-entity)]
          (if (and (not (ldb/recycled? page-entity))
                   (:db/id page-entity))
            (p/let [root (fetch-tree-for-entity config repo page-entity max-depth page-hierarchy?)]
              {:root (dissoc root :logseq.property/deleted-at)})
            (throw (ex-info "page not found" {:code :page-not-found})))))

      :else
      (p/rejected (ex-info "block or page required" {:code :missing-target})))))

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

(defn- tree->text-with-linked-refs
  [{:keys [linked-references uuid->label property-titles property-value-labels] :as tree-data}]
  (let [tree-text (tree->text tree-data)
        refs (:blocks linked-references)
        count (:count linked-references)]
    (if (seq refs)
      (str tree-text
           "\n\n"
           "Linked References ("
           (cli-humanize/format-count count)
           ")\n"
           (linked-refs->text refs uuid->label property-titles property-value-labels))
      tree-text)))

(defn- referenced-entity-row
  [uuid uuid->entity]
  (let [{:keys [id label]} (get uuid->entity (string/lower-case uuid))
        id* (or id "-")
        label* (or label uuid)]
    (str id* " -> " label*)))

(defn- render-referenced-entities-footer
  [ordered-uuids uuid->entity]
  (let [ordered-uuids (vec (distinct (remove string/blank? ordered-uuids)))]
    (when (seq ordered-uuids)
      (str "Referenced Entities ("
           (cli-humanize/format-count (count ordered-uuids))
           ")\n"
           (string/join "\n" (map #(referenced-entity-row % uuid->entity) ordered-uuids))))))

(defn build-action
  [options repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for show"}}
    (let [options (resolve-stdin-id options)
          id-result (id-command/parse-id-option (:id options))
          ids (:value id-result)
          multi-id? (:multi? id-result)
          targets (filter some? [(:id options) (:uuid options) (:page options)])]
      (if (empty? targets)
        {:ok? false
         :error {:code :missing-target
                 :message "block or page is required"}}
        (if (and (some? (:id options)) (not (:ok? id-result)))
          {:ok? false
           :error {:code :invalid-options
                   :message (:message id-result)}}
          {:ok? true
           :action {:type :show
                    :repo repo
                    :id (when (and (seq ids) (not multi-id?)) (first ids))
                    :ids ids
                    :multi-id? multi-id?
                    :linked-references? (if (contains? options :linked-references)
                                          (:linked-references options)
                                          true)
                    :ref-id-footer? (if (contains? options :ref-id-footer)
                                      (:ref-id-footer options)
                                      true)
                    :page-hierarchy? (if (contains? options :page-hierarchy)
                                       (:page-hierarchy options)
                                       false)
                    :uuid (:uuid options)
                    :page (:page options)
                    :level (:level options)}})))))

(defn- build-tree-data
  [config action]
  (p/let [tree-data (fetch-tree config action)
          tree-data (resolve-linked-blocks-in-tree-data config action tree-data)
          root-id (get-in tree-data [:root :db/id])
          linked-enabled? (not= false (:linked-references? action))
          linked-refs (when (and linked-enabled? root-id)
                        (fetch-linked-references config (:repo action) root-id))
          linked-refs* (if linked-enabled?
                         (or linked-refs {:count 0 :blocks []})
                         {:count 0 :blocks []})
          linked-refs* (if linked-enabled?
                         (resolve-linked-blocks-in-linked-references config action linked-refs*)
                         linked-refs*)
          uuid-refs (collect-uuid-refs tree-data linked-refs*)
          uuid->entity (uuid-refs/fetch-uuid-entities config (:repo action) uuid-refs)
          uuid->label (->> uuid->entity
                           (keep (fn [[uuid-key {:keys [label]}]]
                                   (when (seq label)
                                     [uuid-key label])))
                           (into {}))
          tree-data (cond-> (assoc tree-data
                                   :referenced-uuids uuid-refs
                                   :uuid->entity uuid->entity
                                   :uuid->label uuid->label)
                      linked-enabled? (assoc :linked-references linked-refs*))
          tree-data (resolve-uuid-refs-in-tree-data tree-data uuid->label)]
    tree-data))

(defn- multi-id-error-message
  [id error]
  (let [data (ex-data error)
        code (:code data)
        message (or (:message data) (.-message error) (str error))]
    (if (or (= code :block-not-found)
            (= code :entity-not-found))
      (str "Entity " id " not found")
      (str "Entity " id ": " message))))

(defn- multi-id-error-entry
  [id error]
  (let [data (ex-data error)
        code (:code data)
        message (multi-id-error-message id error)
        error-map (cond-> {:message message}
                    code (assoc :code code))]
    {:id id
     :error error-map}))

(defn- collect-tree-ids
  [root]
  (letfn [(walk [node acc]
            (let [acc (cond-> acc
                        (:db/id node) (conj (:db/id node)))]
              (reduce (fn [memo child]
                        (walk child memo))
                      acc
                      (or (:block/children node) []))))]
    (if root
      (walk root #{})
      #{})))

(defn- strip-block-uuid
  [tree-data]
  (walk/postwalk
   (fn [entry]
     (if (map? entry)
       (dissoc entry :block/uuid)
       entry))
   tree-data))

(defn- strip-show-internal-data
  [tree-data]
  (walk/postwalk
   (fn [entry]
     (if (map? entry)
       (->> entry
            (remove (fn [[k _]]
                      (and (qualified-keyword? k)
                           (= "show" (namespace k)))))
            (into {}))
       entry))
   (dissoc tree-data :referenced-uuids :uuid->entity)))

(defn- render-tree-text
  [tree-data action]
  (let [tree-text (if (false? (:linked-references? action))
                    (tree->text tree-data)
                    (tree->text-with-linked-refs tree-data))
        breadcrumb-line (:breadcrumb-line tree-data)
        tree-text (if (seq breadcrumb-line)
                    (str breadcrumb-line "\n" tree-text)
                    tree-text)
        footer-enabled? (not= false (:ref-id-footer? action))
        linked-refs (when (not= false (:linked-references? action))
                      (:linked-references tree-data))
        ordered-uuids (or (:referenced-uuids tree-data)
                          (collect-uuid-refs tree-data linked-refs))
        footer (when footer-enabled?
                 (render-referenced-entities-footer ordered-uuids (:uuid->entity tree-data)))]
    (if (seq footer)
      (str tree-text "\n\n" footer)
      tree-text)))

(defn- attach-breadcrumb-line
  [config action tree-data]
  (p/let [parents (fetch-breadcrumb-parents config (:repo action) (:root tree-data))
          breadcrumb-line (render-breadcrumb-line parents)]
    (if (seq breadcrumb-line)
      (assoc tree-data :breadcrumb-line breadcrumb-line)
      tree-data)))

(defn- attach-property-value-uuid-labels
  [config action tree-data]
  (let [property-value-labels (:property-value-labels tree-data)
        nested-uuid-refs (uuid-refs/collect-uuid-refs-from-strings (vals property-value-labels))]
    (if (seq nested-uuid-refs)
      (p/let [nested-uuid->entity (uuid-refs/fetch-uuid-entities config (:repo action) nested-uuid-refs)
              nested-uuid->label (->> nested-uuid->entity
                                      (keep (fn [[uuid-key {:keys [label]}]]
                                              (when (seq label)
                                                [uuid-key label])))
                                      (into {}))]
        (-> tree-data
            (update :uuid->entity merge nested-uuid->entity)
            (update :uuid->label merge nested-uuid->label)
            (update :referenced-uuids #(vec (distinct (concat (or % []) nested-uuid-refs))))))
      (p/resolved tree-data))))

(defn- render-tree-text-with-properties
  [config action tree-data]
  (p/let [tree-data (attach-property-titles config (:repo action) tree-data)
          tree-data (attach-property-value-uuid-labels config action tree-data)
          tree-data (attach-breadcrumb-line config action tree-data)]
    (render-tree-text tree-data action)))

(defn- sanitize-structured-tree
  [tree-data]
  (-> tree-data
      strip-show-internal-data
      strip-block-uuid))

(defn- structured-show-result
  [mode data]
  {:status :ok
   :data data
   :output-format mode})

(defn- multi-id-structured-data
  [results]
  (mapv (fn [{:keys [ok? tree id error]}]
          (if ok?
            (sanitize-structured-tree tree)
            (multi-id-error-entry id error)))
        results))

(defn execute-show
  [action config]
  (p/let [cfg (cli-server/ensure-server! config (:repo action))
          mode (output-mode/parse (:output-format config))
          ids (:ids action)
          multi-id? (:multi-id? action)]
    (if (and (seq ids) multi-id?)
      (p/let [results (p/all (map (fn [id]
                                    (-> (build-tree-data cfg (assoc action :id id))
                                        (p/then (fn [tree-data]
                                                  {:ok? true
                                                   :id id
                                                   :tree tree-data}))
                                        (p/catch (fn [error]
                                                   {:ok? false
                                                    :id id
                                                    :error error}))))
                                  ids))
              ok-results (filter :ok? results)
              id->tree-ids (into {}
                                 (map (fn [{:keys [id tree]}]
                                        [id (collect-tree-ids (:root tree))]))
                                 ok-results)
              contained? (fn [id]
                           (some (fn [[other-id tree-ids]]
                                   (and (not= other-id id)
                                        (contains? tree-ids id)))
                                 id->tree-ids))
              results (vec (remove (fn [{:keys [ok? id]}]
                                     (and ok? (contained? id)))
                                   results))
              render-result (fn [{:keys [ok? tree id error]}]
                              (if ok?
                                (render-tree-text-with-properties cfg action tree)
                                (multi-id-error-message id error)))]
        (if (output-mode/structured? mode)
          (structured-show-result mode (multi-id-structured-data results))
          (p/let [messages (p/all (map render-result results))]
            {:status :ok
             :data {:message (string/join multi-id-delimiter messages)}})))
      (p/let [tree-data (build-tree-data cfg action)]
        (if (output-mode/structured? mode)
          (structured-show-result mode (sanitize-structured-tree tree-data))
          (p/let [message (render-tree-text-with-properties cfg action tree-data)]
            {:status :ok
             :data {:message message}}))))))
