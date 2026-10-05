(ns electron.mcp-compat
  (:require [clojure.string :as string]
            [promesa.core :as p]))

(declare property-entity-value property-type)

(defn get-page
  [call-api-fn args]
  (call-api-fn "logseq.cli.getPageData" [(aget args "pageName")]))

(def ^:private page-title-query
  "[:find [(pull ?page [:block/uuid :block/title :block/name]) ...]
    :in $ ?title
    :where
    [?page :block/title ?title]
    [?page :block/tags ?class]
    [?class :db/ident :logseq.class/Page]
    (not [?page :logseq.property/deleted-at _])]" )

(def ^:private page-name-query
  "[:find [(pull ?page [:block/uuid :block/title :block/name]) ...]
    :in $ ?name
    :where
    [?page :block/name ?name]
    [?page :block/tags ?class]
    [?class :db/ident :logseq.class/Page]
    (not [?page :logseq.property/deleted-at _])]" )

(defn page-uuid-result
  [title pages]
  (let [pages (vec pages)]
    (cond
      (empty? pages) {:found false :title title :page_uuid nil}
      (= 1 (count pages)) {:found true :title title
                           :page_uuid (or (:uuid (first pages))
                                          (:block/uuid (first pages)))}
      :else {:found false :title title :page_uuid nil
             :reason (str (count pages) " pages share this title; use a UUID")
             :candidates (mapv #(or (:uuid %) (:block/uuid %)) pages)})))

(defn tag-uuid-result
  [title tags]
  (let [tags (vec tags)]
    (cond
      (empty? tags) {:found false :title title :tag_uuid nil}
      (= 1 (count tags)) {:found true :title title :tag_uuid (:uuid (first tags))}
      :else {:found false :title title :tag_uuid nil
             :reason (str (count tags) " tags share this title; use a UUID")
             :candidates (mapv :uuid tags)})))

(defn tag-result
  [tag-uuid tags]
  (if-let [tag (first tags)]
    (assoc tag :found true :tag_uuid tag-uuid)
    {:found false :tag_uuid tag-uuid}))

(defn property-ident-result
  [title properties]
  (let [properties (vec properties)]
    (cond
      (empty? properties) {:found false :title title :ident nil}
      (= 1 (count properties)) {:found true :title title
                                :ident (or (:ident (first properties))
                                           (:db/ident (first properties)))
                                :type (property-type (first properties))}
      :else {:found false :title title :ident nil
             :reason (str (count properties) " properties share this title")
             :candidates (mapv #(or (:ident %) (:db/ident %)) properties)})))

(defn block-result
  [block-uuid blocks]
  (if-let [block (first blocks)]
    (if (or (:name block) (:block/name block))
      {:found false :block_uuid block-uuid :block nil
       :reason "target is a page, not a block"}
      {:found true :block_uuid block-uuid :block block})
    {:found false :block_uuid block-uuid :block nil}))

(def ^:private max-fuzzy-titles 2000)

(defn grouping-key
  [title mode]
  (if (= mode "exact")
    title
    (let [words (-> title
        string/lower-case
        (string/replace #"[^\w\s]+" " ")
        (string/replace #"\s+" " ")
        string/trim
        (string/split #" "))]
      (string/join " "
                   (map (fn [word]
                          (cond
                            (and (> (count word) 4) (string/ends-with? word "es"))
                            (subs word 0 (- (count word) 2))

                            (and (> (count word) 3)
                                 (string/ends-with? word "s")
                                 (not (string/ends-with? word "ss")))
                            (subs word 0 (dec (count word)))

                            :else word))
                        words)))))

(defn- within-edit-distance?
  [left right allowed]
  (let [left-count (count left)
        right-count (count right)]
    (if (> (js/Math.abs (- left-count right-count)) allowed)
      false
      (loop [i 0
             previous (vec (range (inc right-count)))]
        (if (= i left-count)
          (<= (peek previous) allowed)
          (let [current (loop [j 0
                               row [(inc i)]]
                          (if (= j right-count)
                            row
                            (let [cost (if (= (.charAt left i) (.charAt right j)) 0 1)
                                  value (min (inc (nth previous (inc j)))
                                             (inc (peek row))
                                             (+ (nth previous j) cost))]
                              (recur (inc j) (conj row value))))) ]
            (if (> (apply min current) allowed)
              false
              (recur (inc i) current))))))))

(defn- group-title-candidates
  [candidates normalize]
  (let [buckets (reduce (fn [result candidate]
                          (update result (grouping-key (:title candidate) normalize)
                                  (fnil conj []) candidate))
                        {}
                        candidates)
        initial-groups (->> buckets vals (filter #(> (count %) 1)) vec)]
    (if-not (= normalize "fuzzy")
      initial-groups
      (do
        (when (> (count candidates) max-fuzzy-titles)
          (throw (js/Error.
                  (str (count candidates) " titles exceeds the " max-fuzzy-titles
                       " limit for edit-distance matching, which compares every pair. Use normalize=loose."))))
        (let [keys (vec (keys buckets))
              adjacency (reduce (fn [result key]
                                  (assoc result key #{key}))
                                {}
                                keys)
              adjacency (reduce (fn [result [left-index left]]
                                  (reduce (fn [result right]
                                            (let [allowed (if (< (min (count left) (count right)) 8) 1 2)]
                                              (if (within-edit-distance? left right allowed)
                                                (-> result
                                                    (update left (fnil conj #{}) right)
                                                    (update right (fnil conj #{}) left))
                                                result)))
                                          result
                                          (subvec keys (inc left-index))))
                                adjacency
                                (map-indexed vector keys))]
          (loop [remaining keys
                 seen #{}
                 groups []]
            (if-let [key (first remaining)]
              (if (contains? seen key)
                (recur (rest remaining) seen groups)
                (let [cluster (get adjacency key)
                      members (vec (mapcat buckets cluster))]
                  (recur (rest remaining)
                         (into seen cluster)
                         (cond-> groups (> (count members) 1) (conj members)))))
              groups)))))))

(def ^:private page-details
  #{"page" "blocks" "tags" "properties" "declared" "all"})

(declare page-stats-uuid-pattern page-stats-field
         structural-property-value? query-result-rows get-block-uuids uuid-query-input)
(defn inspect-page
  [api-fn args]
  (let [page-uuid (aget args "page_uuid")
        detail (or (aget args "detail") "page")]
    (when-not (and (string? page-uuid)
                   (re-matches page-stats-uuid-pattern page-uuid))
      (throw (js/Error. "page_uuid must be a UUID")))
    (when-not (contains? page-details detail)
      (throw (js/Error. "detail must be one of: page, blocks, tags, properties, declared, all")))
    (p/let [result (api-fn "logseq.DB.inspectPage" [page-uuid detail])]
      (js->clj result :keywordize-keys true))))
(defn- query-pages
  [api-fn query value]
  (p/let [result (api-fn "logseq.DB.datascriptQuery" [query value])
          rows (js->clj result :keywordize-keys true)]
    (if (and (= 1 (count rows)) (vector? (first rows)))
      (first rows)
      rows)))

(defn get-page-uuid
  [api-fn args]
  (let [title (aget args "title")]
(p/let [by-title (query-pages api-fn page-title-query title)
        pages (if (seq by-title)
                by-title
                (query-pages api-fn page-name-query (string/lower-case title)))]
  (page-uuid-result title pages))))

(defn get-tag-uuid
  [api-fn args]
  (let [title (aget args "title")]
    (p/let [result (api-fn "logseq.DB.getTagsByName" [title])
            tags (js->clj result :keywordize-keys true)]
      (tag-uuid-result title tags))))

(defn get-tag
  [api-fn args]
  (let [tag-uuid (aget args "tag_uuid")]
    (p/let [result (api-fn "logseq.DB.getTag" [tag-uuid])
            tag (js->clj result :keywordize-keys true)]
      (tag-result tag-uuid (if tag [tag] [])))))

    (defn get-tag-users
      [api-fn args]
      (let [tag-uuid (aget args "tag_uuid")]
        (p/let [result (api-fn "logseq.DB.getTagUsers" [tag-uuid])]
          (js->clj result :keywordize-keys true))))

    (defn get-block-uuids
  [api-fn args]
  (let [page-uuid (aget args "page_uuid")]
    (p/let [result (api-fn "logseq.DB.getPageBlockUUIDs" [page-uuid])]
      (js->clj result :keywordize-keys true))))

    (defn block-tree-result
      [block-uuid root rows max-depth max-nodes]
      (cond
        (nil? root)
        {:found false :block_uuid block-uuid :block nil :node_count 0 :truncated false}

        (or (:name root) (:block/name root))
        {:found false
         :block_uuid block-uuid
         :block nil
         :node_count 0
         :truncated false
         :reason "target is a page, not a block"}

        :else
        (let [children (group-by :parent_uuid rows)
              count* (atom 0)
            truncated* (atom false)
            visited* (atom #{})]
          (letfn [(build [node depth]
              (when (contains? @visited* (:uuid node))
                (throw (js/Error. "Block hierarchy contains a cycle")))
              (swap! visited* conj (:uuid node))
                    (swap! count* inc)
                    (let [node' (dissoc node :parent_uuid)
                child-rows (sort-by #(str (:order %)) (get children (:uuid node)))]
                      (if (or (>= depth max-depth)
                              (>= @count* max-nodes))
                        (do
                          (when (seq child-rows) (reset! truncated* true))
                          (assoc node' :children []))
                        (assoc node' :children
                               (reduce (fn [built child]
                                         (if (< @count* max-nodes)
                                           (conj built (build child (inc depth)))
                                           (do (reset! truncated* true) (reduced built))))
                                       [] child-rows))))) ]
            {:found true
             :block_uuid block-uuid
             :block (build root 0)
             :node_count @count*
             :truncated @truncated*}))))

    (defn get-block-tree
      [api-fn args]
      (let [block-uuid (aget args "block_uuid")
            max-depth (or (aget args "max_depth") 20)
            max-nodes (or (aget args "max_nodes") 1000)]
        (when-not (and (number? max-depth) (js/Number.isInteger max-depth) (<= 0 max-depth 100))
          (throw (js/Error. "max_depth must be an integer between 0 and 100")))
        (when-not (and (number? max-nodes) (js/Number.isInteger max-nodes) (<= 1 max-nodes 1000))
          (throw (js/Error. "max_nodes must be an integer between 1 and 1000")))
        (p/let [result (api-fn "logseq.DB.getBlockTree" [block-uuid max-depth max-nodes])]
          (js->clj result :keywordize-keys true))))

        (defn find-backlinks
          [api-fn args]
          (let [target-uuid (aget args "target_uuid")]
            (p/let [result (api-fn "logseq.DB.getBacklinks" [target-uuid])]
              (js->clj result :keywordize-keys true))))

(defn find-orphans
  [api-fn args]
  (let [page-uuid (aget args "page_uuid")]
    (p/let [result (api-fn "logseq.DB.getPageBlockUUIDs" [page-uuid])
            blocks (js->clj result :keywordize-keys true)
            rows (filterv (fn [block]
                            (let [page (page-stats-field block :page)
                                  stored-page-uuid (when (map? page)
                                                     (page-stats-field page :uuid))]
                              (and stored-page-uuid
                                   (not= page-uuid stored-page-uuid))))
                          blocks)]
      {:page_uuid page-uuid
       :orphans rows
       :count (count rows)
       :diagnostic (if (seq rows)
                     "These blocks render through parent ancestry; this tool reports them without repairing them."
                     "No blocks have a page/parent mismatch.")})))

(def ^:private page-stats-uuid-pattern
  #"(?i)^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")

(def ^:private structural-property-idents
  #{"parent" "page" "order" "title" "name" "uuid" "ident"
    "content" "full-title" "raw-title" "refs" "path-refs"
    "tx-id" "created-at" "updated-at" "format" "collapsed?"
    "journal-day" "journal?" "left"})

(defn- page-stats-field
  [entity field]
  (or (get entity field)
      (case field
        :id (:db/id entity)
        :uuid (:block/uuid entity)
        :name (:block/name entity)
        :title (:block/title entity)
        :page (:block/page entity)
        :_parent (:block/_parent entity)
        nil)))

(defn- structural-property-value?
  [property]
  (let [ident (or (:ident property) (:db/ident property))
        bare (some-> ident (string/replace-first #"^:" ""))]
    (or (and bare (or (string/starts-with? bare "block/")
                      (string/starts-with? bare "db/")))
        (and bare
             (not (string/includes? bare "/"))
             (contains? structural-property-idents bare)))))

(defn page-stats
  [api-fn args]
  (let [page-uuid (aget args "page_uuid")]
    (when-not (and (string? page-uuid)
                   (re-matches page-stats-uuid-pattern page-uuid))
      (throw (js/Error. "page_uuid must be a UUID")))
    (p/let [result (api-fn "logseq.DB.getPageStats" [page-uuid])]
      (js->clj result :keywordize-keys true))))

(defn title-holder-kind
  [entity]
  (let [idents (set (keep #(or (:ident %) (:db/ident %))
                          (or (:tags entity) (:block/tags entity) [])))]
    (cond
      (contains? idents :logseq.class/Property) "property"
      (contains? idents :logseq.class/Tag) "tag"
      (or (contains? idents :logseq.class/Page)
          (:name entity) (:block/name entity)) "page"
      (:ident entity) "property"
      (:db/ident entity) "property"
      :else "block")))

(defn title-availability-result
  [title entities]
  (let [holders (mapv (fn [entity]
                        {:uuid (or (:uuid entity) (:block/uuid entity))
                         :kind (title-holder-kind entity)
                         :title (or (:title entity) (:block/title entity))
                         :recycled (boolean (or (:deleted-at entity)
                                                (:logseq.property/deleted-at entity)))})
                      entities)]
    {:title title
     :available (empty? holders)
     :held_by holders}))

(defn is-title-available
  [api-fn args]
  (let [title (aget args "title")]
    (p/let [result (api-fn "logseq.DB.getTitleHolders" [title])
      entities (js->clj result :keywordize-keys true)]
      (title-availability-result title entities))))

(defn list-recycled
  [api-fn _args]
  (p/let [result (api-fn "logseq.DB.listRecycled" [])]
    (js->clj result :keywordize-keys true)))

(defn list-status
  [api-fn _args]
  (p/let [result (api-fn "logseq.DB.getStatusRows" [])]
    (js->clj result :keywordize-keys true)))

(defn list-closed-values
  [api-fn _args]
  (p/let [result (api-fn "logseq.DB.getClosedValues" [])]
    (js->clj result :keywordize-keys true)))

(defn list-orphan-tags
  [api-fn _args]
  (let [query "[:find [(pull ?tag [:db/id :db/ident :block/uuid :block/title]) ...]
                 :where
                 [?tag :block/tags ?class]
                 [?class :db/ident :logseq.class/Tag]
                 [(missing? $ ?tag :block/_tags)]]"]
    (p/let [result (api-fn "logseq.DB.datascriptQuery" [query])
            tags (js->clj result :keywordize-keys true)]
      (if (and (= 1 (count tags)) (vector? (first tags)))
        (first tags)
        tags))))

(def ^:private query-ident-pattern
  #"(?i):[a-z][\w.-]*/[\w.?!+-]+")

(defn- query-ident
  [value]
  (when (and (string? value)
             (re-matches query-ident-pattern (string/trim value)))
    (string/trim value)))

(defn list-orphan-properties
  [api-fn _args]
  (p/let [result (api-fn "logseq.DB.getAllProperties" [])
          properties (js->clj result :keywordize-keys true)]
    (reduce
     (fn [orphans-p entry]
       (if-let [ident (when (map? entry)
                        (query-ident (or (:ident entry) (:db/ident entry))))]
         (p/let [orphans orphans-p
                 result (api-fn "logseq.DB.datascriptQuery"
                                [(str "[:find [?holder ...] :where [?holder "
                                      ident " _]]")])
                 holders (js->clj result :keywordize-keys true)]
           (if (seq holders)
             orphans
             (conj orphans
                   {:ident ident
                    :title (:title entry)
                    :type (property-type entry)})))
         orphans-p))
     (p/resolved [])
     properties)))

(defn list-assets
  [api-fn _args]
  (let [query "[:find [?attr ...] :where [_ ?attr _] [(str ?attr) ?s] [(clojure.string/includes? ?s \"asset\")]]"]
    (p/let [result (api-fn "logseq.DB.datascriptQuery" [query])
            attributes (js->clj result :keywordize-keys true)]
      (if (and (= 1 (count attributes)) (vector? (first attributes)))
        (first attributes)
        attributes))))

    (defn get-property-ident
      [api-fn args]
      (let [title (aget args "title")]
        (p/let [result (api-fn "logseq.DB.getPropertiesByTitle" [title])
                properties (js->clj result :keywordize-keys true)]
          (property-ident-result title properties))))

(defn get-property-users
  [api-fn args]
  (let [ident (query-ident (aget args "property_ident"))]
    (when-not ident
      (throw (js/Error. "Expected an exact namespaced property ident such as :plugin.property.my_plugin/Effort, not a title or a UUID")))
    (let [query (str "[:find (pull ?holder [:db/id :block/uuid :block/title "
                      ":block/name {:block/page [:db/id :block/uuid :block/title]}]) "
                      "?value :where [?holder " ident " ?value]]")]
      (p/let [result (api-fn "logseq.DB.datascriptQuery" [query])
              rows (filterv #(and (vector? %) (= 2 (count %)))
                            (js->clj result :keywordize-keys true))
              entity-ids (->> rows
                              (map second)
                              (filter #(and (number? %) (not (boolean? %))))
                              set)
              resolve-query "[:find [(pull ?e [:db/id :db/ident :block/title :logseq.property/value]) ...] :in $ [?e ...] :where [?e ?a _]]"
              resolved-result (if (seq entity-ids)
                                (api-fn "logseq.DB.datascriptQuery"
                                        [resolve-query (clj->js (vec entity-ids))])
                                [])
              resolved (into {}
                             (keep (fn [entity]
                                     (let [id (page-stats-field entity :id)]
                                       (when (some? id) [id entity]))))
                             (query-result-rows resolved-result))]
        (mapv (fn [[holder value]]
                {:holder holder
                 :value value
                 :value_entity (when (and (number? value) (not (boolean? value)))
                                 (get resolved value))})
              rows)))))

(defn- property-digest
  [property]
  {:uuid (:uuid property)
   :parent (let [parent (:parent property)]
             (if (map? parent) (:id parent) parent))
   :page (let [page (:page property)]
           (if (map? page) (:id page) page))})

(defn create-property
  [api-fn args]
  (let [title (aget args "title")
        schema (aget args "schema")
        options (or (aget args "options") #js {})
        verbose? (not (false? (aget args "verbose")))]
    (when-not (and (string? title) (not (string/blank? title)))
      (throw (js/Error. "Property title must not be empty")))
    (when (string/includes? title "/")
      (throw (js/Error. "Property title must be a plain title, not a namespaced ident")))
    (p/let [response (api-fn "logseq.DB.upsertProperty" [title schema options])]
      (if-let [error (and response (aget response "error"))]
        response
        (let [response-map (js->clj response :keywordize-keys true)
              ident (query-ident (or (:ident response-map) (:db/ident response-map)))]
          (when-not ident
            (throw (js/Error. "Property creation did not return a namespaced ident")))
          (p/let [property-result (api-fn "logseq.DB.datascriptQuery"
                                          [(str "[:find (pull ?property [*]) . :where "
                                                "[?property :db/ident " ident "]]" )])
                  property (js->clj property-result :keywordize-keys true)]
            (when-not property
              (throw (js/Error. "Property creation reported success but the property is absent")))
            (let [requested-type (when schema (aget schema "type"))
              actual-type (property-type property)
              cardinality (or (property-entity-value property ":db/cardinality") (:cardinality property))
              value-type (or (property-entity-value property ":db/valueType") (:valueType property))]
              (when (and requested-type (not= requested-type actual-type))
                (throw (js/Error. (str "Property " ident " was created with type "
                                       (pr-str actual-type) ", not the requested "
                                       (pr-str requested-type)))))
              (let [notes (cond-> []
                            (and (string? (:title property))
                                 (not= title (:title property)))
                            (conj (str "Logseq normalized the title " (pr-str title)
                                       " to " (pr-str (:title property))
                                       "; use the exact ident " (pr-str ident) " for later operations"))

                            cardinality
                            (conj (str "cardinality is " cardinality))

                            value-type
                            (conj (str "values are stored as " value-type
                                       " -- a write supplies a literal and Logseq mints the value entity")))
                    diagnostic (when (seq notes) (string/join "; " notes))]
                (if verbose?
                  {:response response-map
                   :ident ident
                   :title (:title property)
                   :verified_state property
                   :recovered_after_timeout false
                   :previous_state nil
                   :diagnostic diagnostic
                   :verified true
                   :observed_state nil}
                  (merge {:verified true
                          :ident ident
                      :title (:title property)
                          :diagnostic diagnostic}
                     (property-digest property)))))))))))

(defn- sweep-property-value-blocks
  [api-fn block-uuids]
  (reduce (fn [remaining-p block-uuid]
            (p/let [remaining remaining-p
                    left (-> (p/let [_ (api-fn "logseq.DB.removeBlock" [block-uuid])
                                     entity (api-fn "logseq.DB.datascriptQuery"
                                                    ["[:find ?e . :in $ ?uuid :where [?e :block/uuid ?uuid]]"
                                                     (uuid-query-input block-uuid)])]
                            (when (some? entity) block-uuid))
                          (p/catch (fn [_error] block-uuid)))]
              (cond-> remaining left (conj left))))
          (p/resolved [])
          block-uuids))

(defn delete-property
  [api-fn args]
  (let [ident (query-ident (aget args "property_ident"))
        acknowledge? (true? (aget args "acknowledge_value_loss"))
        verbose? (not (false? (aget args "verbose")))]
    (when-not ident
      (throw (js/Error. "Expected an exact namespaced property ident")))
    (when-not (string/starts-with? (subs ident 1) "plugin.property.")
      (throw (js/Error. (str "Property " ident " is outside the writable plugin-property namespace"))))
    (let [property-query (str "[:find (pull ?property [*]) . :where "
                              "[?property :db/ident " ident "]]")]
      (p/let [property-result (api-fn "logseq.DB.datascriptQuery" [property-query])
              property (js->clj property-result :keywordize-keys true)]
        (when-not property
          (throw (js/Error. (str "No property exists with exact ident " ident))))
        (let [property-id (or (:id property) (:db/id property))
              previous-state-fn (fn [usage]
                                  {:property property :usage usage})]
          (p/let [usage (get-property-users api-fn #js {"property_ident" ident})]
            (if (and (seq usage) (not acknowledge?))
              (let [diagnostic (str (count usage) " entities hold a value for " ident
                                    ", and deleting the definition destroys every one of them. "
                                    "Recreating the property does not restore them. Set "
                                    "acknowledge_value_loss=true to proceed.")]
                (if verbose?
                  {:response nil
                   :verified_state nil
                   :recovered_after_timeout false
                   :previous_state (previous-state-fn usage)
                   :diagnostic diagnostic
                   :verified false
                   :observed_state usage}
                  {:verified false
                   :uuid nil
                   :parent nil
                   :page nil
                   :diagnostic diagnostic
                   :observed (mapv (fn [_] {:uuid nil :parent nil :page nil}) usage)}))
              (p/let [value-blocks-result (api-fn "logseq.DB.datascriptQuery"
                                                  ["[:find [?uuid ...] :in $ ?property :where [?block :logseq.property/created-from-property ?property] [?block :block/uuid ?uuid]]"
                                                   property-id])
                      value-blocks (query-result-rows value-blocks-result)
                      response (api-fn "logseq.DB.removeProperty" [ident])]
                (when-let [error (and response (aget response "error"))]
                  (throw (js/Error. (str error))))
                (p/let [current-result (api-fn "logseq.DB.datascriptQuery" [property-query])
                        current (js->clj current-result :keywordize-keys true)]
                  (when current
                    (throw (js/Error. (str "Property " ident
                                           " is still present after removal"))))
                  (p/let [remaining (get-property-users api-fn #js {"property_ident" ident})]
                    (when (seq remaining)
                      (throw (js/Error. "Property definition is gone but values remain attached")))
                    (p/let [left (sweep-property-value-blocks api-fn value-blocks)
                            swept (- (count value-blocks) (count left))
                            diagnostic (str "Removed " ident
                                            (when (pos? swept)
                                              (str "; swept " swept " orphaned value block(s)"))
                                            (when (seq left)
                                              (str "; " (count left)
                                                   " value block(s) could not be removed and remain on their pages")))]
                      (if verbose?
                        {:response (js->clj response :keywordize-keys true)
                         :verified_state nil
                         :recovered_after_timeout false
                         :previous_state (previous-state-fn usage)
                         :diagnostic diagnostic
                         :verified true
                         :observed_state nil}
                        {:verified true
                         :uuid nil
                         :parent nil
                         :page nil
                         :diagnostic diagnostic}))))))))))))

(def ^:private reference-property-types
  #{"node" "page" "class" "property"})

(defn- property-value-id
  [value]
  (if (map? value)
    (or (:db/id value) (:id value))
    value))

(defn valid-reference-property-value?
  [value]
  (let [value-id (property-value-id value)]
    (and (number? value-id)
         (js/Number.isInteger value-id)
          (not (boolean? value-id)))))

(defn- held-property-values
  [value]
  (cond
    (nil? value) []
    (sequential? value) (vec value)
    :else [value]))

(defn- resolve-property-values
  [api-fn held]
  (let [held (held-property-values held)
        entity-ids (->> held
                        (map property-value-id)
                        (filter #(and (number? %) (js/Number.isInteger %)
                                      (not (boolean? %))))
                        set)
        resolve-query "[:find [(pull ?e [:db/id :db/ident :block/title :logseq.property/value]) ...] :in $ [?e ...] :where [?e ?a _]]"]
    (p/let [entities-result (if (seq entity-ids)
                              (api-fn "logseq.DB.datascriptQuery"
                                      [resolve-query (clj->js (vec entity-ids))])
                              [])
            entities (into {}
                           (keep (fn [entity]
                                   (let [id (or (:id entity) (:db/id entity))]
                                     (when (some? id) [id entity]))))
                           (query-result-rows entities-result))]
      (vec
       (mapcat (fn [value]
                 (let [value-id (property-value-id value)
                       entity (when (number? value-id) (get entities value-id))
                       resolved (if-some [stored (property-entity-value entity ":logseq.property/value")]
                                  stored
                                  (or (:value entity) (:title entity)))]
                   (cond-> []
                     (some? value-id) (conj value-id)
                     (some? resolved) (conj resolved)
                     (nil? value-id) (conj value))))
               held)))))

(defn- property-entity-value
  [entity ident]
  (let [bare-ident (subs ident 1)]
    (first (some (fn [[key value]]
            (when (= bare-ident (string/replace-first (str key) #"^:+" ""))
          [value]))
        entity))))

(defn- property-type
  [property]
  (let [value (or (property-entity-value property ":logseq.property/type") (:type property))]
    (if (keyword? value) (name value) value)))

(defn- entity-write-digest
  [entity]
  (cond-> {:uuid (:uuid entity)
           :parent (let [parent (:parent entity)]
                     (if (map? parent) (:id parent) parent))
           :page (let [page (:page entity)]
                   (if (map? page) (:id page) page))}
    (some? (:order entity)) (assoc :order (:order entity))))

(defn- entity-ref-id
  [value]
  (if (map? value)
    (or (:id value) (:db/id value))
    value))

(defn validated-uuid
  [value]
  (when-not (and (string? value) (re-matches page-stats-uuid-pattern value))
    (throw (js/Error. "Entity query requires a UUID")))
  value)

(defn- uuid-query-input
  [value]
  (str "#uuid " (pr-str (validated-uuid value))))

(defn- content-loss
  [sent stored]
  (let [sent (string/replace sent #"\s+$" "")
        stored (string/replace stored #"\s+$" "")
        sent-lines (string/split sent #"\n" -1)
        stored-lines (string/split stored #"\n" -1)
        last-line (string/trim (last sent-lines))]
    (cond
      (not= (count sent-lines) (count stored-lines))
      (str (count sent-lines) " line(s) sent, " (count stored-lines)
           " stored -- content was dropped on write")

      (and (not (string/blank? last-line))
           (not (string/includes? last-line "[["))
           (not (string/includes? last-line "#"))
           (not (string/ends-with? stored last-line)))
      "The stored text does not end with the last line sent"

      :else nil)))

(defn create-block
  [api-fn args]
  (let [parent-uuid (aget args "parent_uuid")
        title (aget args "title")
        dry-run? (true? (aget args "dry_run"))
        verbose? (not (false? (aget args "verbose")))]
    (when-not (and (string? parent-uuid)
                   (re-matches page-stats-uuid-pattern parent-uuid))
      (throw (js/Error. "parent_uuid must be a UUID")))
    (when-not (and (string? title) (not (string/blank? title)))
      (throw (js/Error. "Expected a non-empty title")))
    (when (re-find #"(?m)^[\t ]*-\s" title)
      (throw (js/Error. "title: a line begins with '- '; Logseq truncates the block there")))
    (let [parent-query (str "[:find (pull ?parent [:db/id :block/uuid :block/name :block/title "
                            "{:block/page [:db/id]}]) . :where "
                            "[?parent :block/uuid #uuid \"" parent-uuid "\"]]")
          children-query "[:find [(pull ?child [:db/id :block/uuid :block/title :block/order {:block/parent [:db/id]} {:block/page [:db/id]}]) ...] :in $ ?parent-id :where [?child :block/parent ?parent-id]]"]
      (p/let [parent-result (api-fn "logseq.DB.datascriptQuery" [parent-query])
              parent (js->clj parent-result :keywordize-keys true)]
        (when-not parent
          (throw (js/Error. (str "No entity exists with exact UUID " parent-uuid))))
        (let [parent-id (or (:id parent) (:db/id parent))
              page? (boolean (or (:name parent) (:block/name parent)))
              expected-page-id (if page? parent-id (entity-ref-id (or (:page parent) (:block/page parent))))]
          (if dry-run?
            {:validation {:parent parent :title title}
             :response nil
             :verified_entities []
             :recovered_after_timeout false
             :verified false
             :diagnostic "Dry run: nothing was written, so verified is false by design. The parent exists and the title is usable."}
            (p/let [before-result (api-fn "logseq.DB.datascriptQuery" [children-query parent-id])
                    before-rows (js->clj before-result :keywordize-keys true)
                    before-children (if (and (= 1 (count before-rows)) (vector? (first before-rows)))
                                      (first before-rows)
                                      before-rows)
                    before-ids (set (keep #(or (:id %) (:db/id %)) before-children))
                    response (api-fn "logseq.DB.insertBlock" [parent-uuid title #js {:sibling false}])
                    response-map (js->clj response :keywordize-keys true)]
              (when-let [error (and response (aget response "error"))]
                (throw (js/Error. (str error))))
              (let [created-uuid (or (:uuid response-map) (:block/uuid response-map))]
                (p/let [after-result (api-fn "logseq.DB.datascriptQuery" [children-query parent-id])
                        after-rows (js->clj after-result :keywordize-keys true)
                        after-children (if (and (= 1 (count after-rows)) (vector? (first after-rows)))
                                         (first after-rows)
                                         after-rows)
                        created (or (some #(when (= created-uuid (or (:uuid %) (:block/uuid %))) %) after-children)
                                    (first (filter #(and (not (contains? before-ids (or (:id %) (:db/id %))))
                                                         (= title (or (:title %) (:block/title %))))
                                           after-children)))]
                  (if-not created
                    {:validation nil
                     :response response-map
                     :verified_entities []
                     :previous_entities [parent]
                     :recovered_after_timeout false
                     :verified false
                     :diagnostic "The block was not observed under the requested parent"}
                    (let [block-uuid (or (:uuid created) (:block/uuid created))
                          block-query "[:find (pull ?block [:db/id :block/uuid :block/title :block/order {:block/parent [:db/id]} {:block/page [:db/id]}]) . :in $ ?uuid :where [?block :block/uuid ?uuid]]"]
                      (p/let [block-result (api-fn "logseq.DB.datascriptQuery" [block-query (uuid-query-input block-uuid)])
                              block (js->clj block-result :keywordize-keys true)
                              actual-parent-id (entity-ref-id (or (:parent block) (:block/parent block)))
                              actual-page-id (entity-ref-id (or (:page block) (:block/page block)))
                              loss (content-loss title (or (:title block) (:block/title block) ""))]
                        (cond
                          (not= actual-parent-id parent-id)
                          {:validation nil :response response-map :verified_entities [block]
                           :previous_entities [parent] :observed_entities [block]
                           :recovered_after_timeout false :verified false
                           :diagnostic "The block was created under the wrong parent"}

                          (not= actual-page-id expected-page-id)
                          {:validation nil :response response-map :verified_entities [block]
                           :previous_entities [parent] :observed_entities [block]
                           :recovered_after_timeout false :verified false
                           :diagnostic "The block's owning page is wrong; run findOrphans and remove it"}

                          loss
                          {:validation nil :response response-map :verified_entities [block]
                           :previous_entities [parent] :observed_entities [block]
                           :recovered_after_timeout false :verified false
                           :diagnostic (str "The block was created in the right place but its content differs. " loss)}

                          verbose?
                          {:validation nil :response response-map :verified_entities [block]
                           :previous_entities [parent] :recovered_after_timeout false
                           :verified true :diagnostic nil}

                          :else
                          (merge {:verified true :diagnostic nil}
                                 (entity-write-digest block)))))))))))))))

(defn update-block
  [api-fn args]
  (let [block-uuid (aget args "block_uuid")
        title (aget args "title")
        dry-run? (true? (aget args "dry_run"))
        verbose? (not (false? (aget args "verbose")))]
    (when-not (and (string? block-uuid)
                   (re-matches page-stats-uuid-pattern block-uuid))
      (throw (js/Error. "block_uuid must be a UUID")))
    (when-not (and (string? title) (not (string/blank? title)))
      (throw (js/Error. "Expected a non-empty title")))
    (when (re-find #"(?m)^[\t ]*-\s" title)
      (throw (js/Error. "title: a line begins with '- '; Logseq truncates the block there")))
    (let [query "[:find (pull ?block [:db/id :block/uuid :block/title :block/name :block/order {:block/parent [:db/id]} {:block/page [:db/id]}]) . :in $ ?uuid :where [?block :block/uuid ?uuid]]"]
      (p/let [previous-result (api-fn "logseq.DB.datascriptQuery" [query (uuid-query-input block-uuid)])
              previous (js->clj previous-result :keywordize-keys true)]
        (when-not previous
          (throw (js/Error. (str "No entity exists with exact UUID " block-uuid))))
        (when (or (:name previous) (:block/name previous))
          (throw (js/Error. "UUID identifies a page, not a block. Use renamePage instead.")))
        (if dry-run?
          {:validation {:block previous :title title}
           :response nil
           :verified_entities []
           :previous_entities [previous]
           :recovered_after_timeout false
           :verified false
           :diagnostic "Dry run: nothing was written, so verified is false by design. The block exists and the title is usable."}
          (p/let [response (api-fn "logseq.DB.updateBlock" [block-uuid title])
                  _ (when-let [error (and response (aget response "error"))]
                      (throw (js/Error. (str error))))
                  current-result (api-fn "logseq.DB.datascriptQuery" [query (uuid-query-input block-uuid)])
                  current (js->clj current-result :keywordize-keys true)
                  previous-title (or (:title previous) (:block/title previous))
                  current-title (or (:title current) (:block/title current))
                  loss (when current (content-loss title (or current-title "")))]
            (cond
              (nil? current)
              {:validation nil :response (js->clj response :keywordize-keys true)
               :verified_entities [] :previous_entities [previous]
               :recovered_after_timeout false :verified false
               :diagnostic "The block disappeared during the edit"}

              (and (= current-title previous-title) (not= title previous-title))
              {:validation nil :response (js->clj response :keywordize-keys true)
               :verified_entities [] :previous_entities [previous]
               :observed_entities [current] :recovered_after_timeout false
               :verified false
               :diagnostic "The edit was not observed; the block still has its original title."}

              loss
              {:validation nil :response (js->clj response :keywordize-keys true)
               :verified_entities [current] :previous_entities [previous]
               :observed_entities [current] :recovered_after_timeout false
               :verified false :diagnostic (str "The block was edited but its content is not what was sent. " loss)}

              verbose?
              {:validation nil :response (js->clj response :keywordize-keys true)
               :verified_entities [current] :previous_entities [previous]
               :recovered_after_timeout false :verified true :diagnostic nil}

              :else
              (merge {:verified true :diagnostic nil :previous_count 1}
                     (entity-write-digest current)))))))))

(defn move-block
  [api-fn args]
  (let [block-uuid (aget args "block_uuid")
        target-uuid (aget args "target_uuid")
        placement (or (aget args "placement") "child")
        verbose? (not (false? (aget args "verbose")))
        entity-query "[:find (pull ?entity [:db/id :block/uuid :block/title :block/name :block/order {:block/parent [:db/id]} {:block/page [:db/id]}]) . :in $ ?uuid :where [?entity :block/uuid ?uuid]]"]
    (doseq [[field value] [["block_uuid" block-uuid] ["target_uuid" target-uuid]]]
      (when-not (and (string? value) (re-matches page-stats-uuid-pattern value))
        (throw (js/Error. (str field " must be a UUID")))))
    (when-not (contains? #{"child" "last-child" "before" "after"} placement)
      (throw (js/Error. "placement must be child, last-child, before, or after")))
    (p/let [source-result (api-fn "logseq.DB.datascriptQuery" [entity-query (uuid-query-input block-uuid)])
            source (js->clj source-result :keywordize-keys true)]
      (when-not source
        (throw (js/Error. (str "No entity exists with exact UUID " block-uuid))))
      (when (or (:name source) (:block/name source))
        (throw (js/Error. "UUID identifies a page, not a block")))
      (p/let [target-result (api-fn "logseq.DB.datascriptQuery" [entity-query (uuid-query-input target-uuid)])
              target (js->clj target-result :keywordize-keys true)]
        (when-not target
          (throw (js/Error. (str "No entity exists with exact UUID " target-uuid))))
        (when (= (:id source) (:id target))
          (throw (js/Error. "A block cannot be moved relative to itself")))
        (when (and (contains? #{"before" "after"} placement)
                   (or (:name target) (:block/name target)))
          (throw (js/Error. "A page has no siblings; use child or last-child")))
        (let [descendants-query "[:find ?uuid :in $ ?root-uuid :where [?root :block/uuid ?root-uuid] [?descendant :block/parent+ ?root] [?descendant :block/uuid ?uuid]]"]
          (p/let [descendants-result (api-fn "logseq.DB.datascriptQuery" [descendants-query (uuid-query-input block-uuid)])
                  descendants (js->clj descendants-result :keywordize-keys true)]
            (when (contains? (set (map first descendants)) target-uuid)
              (throw (js/Error. "The target is inside the block's own subtree")))
            (let [target-id (or (:id target) (:db/id target))
                  expected-parent (if (contains? #{"child" "last-child"} placement)
                                    target-id
                                    (entity-ref-id (or (:parent target) (:block/parent target))))
                  expected-page (if (or (:name target) (:block/name target))
                                  target-id
                                  (entity-ref-id (or (:page target) (:block/page target))))
                  children-query "[:find [(pull ?child [:db/id :block/uuid :block/order]) ...] :in $ ?parent-id :where [?child :block/parent ?parent-id]]"]
              (when-not (and expected-parent expected-page)
                (throw (js/Error. "The target is missing the parent or page needed for placement")))
              (p/let [before-result (if (= placement "last-child")
                                      (api-fn "logseq.DB.datascriptQuery" [children-query expected-parent])
                                      [])
                      before-children (js->clj before-result :keywordize-keys true)
                      before-children (sort-by #(str (or (:order %) (:block/order %))) before-children)
                      source-already-last? (and (= placement "last-child")
                                                (= block-uuid
                                                   (or (:uuid (last before-children))
                                                       (:block/uuid (last before-children)))))
                      other-children (remove #(= block-uuid (or (:uuid %) (:block/uuid %)))
                                             before-children)
                      anchor-uuid (if (and (= placement "last-child") (seq other-children))
                                    (or (:uuid (last other-children)) (:block/uuid (last other-children)))
                                    target-uuid)
                      options (cond
                                (and (= placement "last-child") (seq other-children)) #js {:before false}
                                (contains? #{"child" "last-child"} placement) #js {:children true}
                                :else #js {:before (= placement "before")})]
                (p/let [response (if source-already-last?
                                  nil
                                  (api-fn "logseq.DB.moveBlock" [block-uuid anchor-uuid options]))
                          current-result (api-fn "logseq.DB.datascriptQuery" [entity-query (uuid-query-input block-uuid)])
                          current (js->clj current-result :keywordize-keys true)
                          descendants-after-result
                          (api-fn "logseq.DB.datascriptQuery"
                                  ["[:find [(pull ?descendant [:db/id :block/uuid {:block/page [:db/id]}]) ...] :in $ ?root-uuid :where [?root :block/uuid ?root-uuid] [?descendant :block/parent+ ?root]]"
                                   (uuid-query-input block-uuid)])
                          descendants-after (js->clj descendants-after-result :keywordize-keys true)
                          stranded? (some #(not= expected-page
                                                 (entity-ref-id (or (:page %) (:block/page %))))
                                          descendants-after)
                            descendant-uuids-after (set (map #(or (:uuid %) (:block/uuid %)) descendants-after))
                            missing-descendants? (some #(not (contains? descendant-uuids-after (first %))) descendants)
                            after-result (api-fn "logseq.DB.datascriptQuery" [children-query expected-parent])
                          after-children (sort-by #(str (or (:order %) (:block/order %)))
                                                  (js->clj after-result :keywordize-keys true))
                            sibling-uuids (mapv #(or (:uuid %) (:block/uuid %)) after-children)
                            block-index (.indexOf (to-array sibling-uuids) block-uuid)
                            target-index (.indexOf (to-array sibling-uuids) target-uuid)
                            order-valid? (and (every? #(string? (or (:order %) (:block/order %))) after-children)
                                        (= (count after-children)
                                          (count (set (map #(or (:order %) (:block/order %)) after-children))))
                                        (case placement
                                         "child" (= block-uuid (first sibling-uuids))
                                         "last-child" (= block-uuid (last sibling-uuids))
                                         "before" (and (not (neg? block-index)) (= (inc block-index) target-index))
                                         "after" (and (not (neg? target-index)) (= (inc target-index) block-index))))
                          actual-parent (entity-ref-id (or (:parent current) (:block/parent current)))
                          actual-page (entity-ref-id (or (:page current) (:block/page current)))
                          response (js->clj response :keywordize-keys true)]
                    (cond
                      (nil? current)
                      {:response response :verified false :verified_entities []
                       :previous_entities [source] :diagnostic "The block disappeared during the move"}

                      (not= expected-parent actual-parent)
                      {:response response :verified false :verified_entities [current]
                       :previous_entities [source] :observed_entities [current]
                       :diagnostic "The move was not observed; the block still has its original parent"}

                      (not= expected-page actual-page)
                      {:response response :verified false :verified_entities [current]
                       :previous_entities [source] :observed_entities [current]
                       :diagnostic "The block moved but its owning page did not follow; run findOrphans"}

                      (or stranded? missing-descendants?)
                      {:response response :verified false :verified_entities [current]
                       :previous_entities [source] :observed_entities descendants-after
                       :diagnostic "The block moved but one or more descendants are missing or belong to the old page"}

                        (not order-valid?)
                      {:response response :verified false :verified_entities [current]
                       :previous_entities [source]
                       :diagnostic "The block is under the requested parent but its requested sibling placement was not verified"}

                      verbose?
                      {:response response :verified true :verified_entities [current]
                       :previous_entities [source] :diagnostic nil}

                      :else
                      (merge {:response response :verified true :diagnostic nil :previous_count 1}
                         (entity-write-digest current))))))))))))

(defn remove-block
  [api-fn args]
  (let [block-uuid (aget args "block_uuid")
        verbose? (not (false? (aget args "verbose")))
        entity-query "[:find (pull ?entity [* {:block/parent [:db/id :block/uuid]} {:block/page [:db/id :block/uuid]}]) . :in $ ?uuid :where [?entity :block/uuid ?uuid]]"
        children-query "[:find [(pull ?child [*]) ...] :in $ ?parent-id :where [?child :block/parent ?parent-id]]"]
    (when-not (and (string? block-uuid)
                   (re-matches page-stats-uuid-pattern block-uuid))
      (throw (js/Error. "block_uuid must be a UUID")))
    (p/let [root-result (api-fn "logseq.DB.datascriptQuery" [entity-query (uuid-query-input block-uuid)])
            root (js->clj root-result :keywordize-keys true)]
      (when-not root
        (throw (js/Error. (str "No entity exists with exact UUID " block-uuid))))
      (when (or (:name root) (:block/name root))
        (throw (js/Error. "UUID identifies a page, not a block")))
      (when-not (and (or (:id root) (:db/id root))
                     (entity-ref-id (or (:parent root) (:block/parent root)))
                     (entity-ref-id (or (:page root) (:block/page root))))
        (throw (js/Error. "The block is missing required id, parent, or page data")))
      (letfn [(collect-subtree [queue collected]
                (if-let [parent (first queue)]
                  (p/let [children-result
                          (api-fn "logseq.DB.datascriptQuery"
                                  [children-query (or (:id parent) (:db/id parent))])
                          children (js->clj children-result :keywordize-keys true)
                          collected (into collected children)]
                    (when (> (count collected) 1000)
                      (throw (js/Error. "Subtree exceeds the 1000-block safety limit")))
                    (collect-subtree (into (subvec queue 1) children) collected))
                  (p/resolved collected)))
              (find-remaining [entities found]
                (if-let [entity (first entities)]
                  (p/let [result (api-fn "logseq.DB.datascriptQuery"
                                         [entity-query (uuid-query-input (or (:uuid entity) (:block/uuid entity)))])
                          current (js->clj result :keywordize-keys true)]
                    (find-remaining (rest entities) (cond-> found current (conj current))))
                  (p/resolved found)))]
        (p/let [subtree (collect-subtree [root] [root])
            _ (doseq [entity subtree]
              (uuid-query-input (or (:uuid entity) (:block/uuid entity))))
                response (api-fn "logseq.DB.removeBlock" [block-uuid])
                remaining (find-remaining subtree [])
                response (js->clj response :keywordize-keys true)]
          (if (seq remaining)
            {:response response
             :verified false
             :verified_entities []
             :previous_entities subtree
             :observed_entities remaining
             :diagnostic (if (some #(= block-uuid (:uuid %)) remaining)
                           "Deletion was not observed; the block is still present"
                           "Target is absent but one or more descendants remain")}
            (cond-> {:response response
                     :verified true
                     :verified_entities []
                     :previous_count (count subtree)
                     :diagnostic "Exact UUID and its subtree are absent after deletion"}
              verbose? (assoc :previous_entities subtree))))))))

(defn split-block-parts
  [title offset delimiter]
  (when (= (some? offset) (some? delimiter))
    (throw (js/Error. "Pass exactly one of offset or delimiter")))
  (let [parts
        (if (some? delimiter)
          (do
            (when-not (and (string? delimiter) (not (string/blank? delimiter)))
              (throw (js/Error. "delimiter cannot be empty")))
            (when-not (string/includes? title delimiter)
              (throw (js/Error. "The delimiter does not occur in this block")))
            (mapv string/trim (array-seq (.split title delimiter))))
          (let [characters (vec (array-seq (js/Array.from title)))]
            (when-not (and (number? offset) (js/Number.isInteger offset)
                           (< 0 offset (count characters)))
              (throw (js/Error. "offset must be inside the block text")))
            (let [head (apply str (subvec characters 0 offset))
                  tail (apply str (subvec characters offset))]
              (when (or (not= head (string/trimr head))
                        (not= tail (string/triml tail)))
                (throw (js/Error. "The offset falls on whitespace, which Logseq trims from block edges")))
              [head tail])))]
    (when (some string/blank? parts)
      (throw (js/Error. "The split would produce an empty part")))
    (when (> (count parts) 20)
      (throw (js/Error. "The split exceeds the 20-part limit")))
    (when (some #(re-find #"(?m)^[\t ]*-\s" %) parts)
      (throw (js/Error. "A split part contains a bullet line that Logseq truncates")))
    parts))

(defn move-blocks
  [api-fn args]
  (let [uuids (vec (js->clj (aget args "block_uuids")))
        target-uuid (aget args "target_uuid")
        placement (or (aget args "placement") "last-child")
        all-or-nothing? (true? (aget args "all_or_nothing"))
        query "[:find (pull ?entity [:db/id :block/uuid :block/name :block/title {:block/parent [:db/id :block/uuid]} {:block/page [:db/id]}]) . :in $ ?uuid :where [?entity :block/uuid ?uuid]]"]
    (when-not (seq uuids)
      (throw (js/Error. "block_uuids must be a non-empty list")))
    (doseq [uuid (conj uuids target-uuid)] (uuid-query-input uuid))
    (when-not (= (count uuids) (count (set uuids)))
      (throw (js/Error. "block_uuids contains duplicate UUIDs")))
    (when (contains? (set uuids) target-uuid)
      (throw (js/Error. "The target cannot also be a selected block")))
    (when-not (contains? #{"child" "last-child" "before" "after"} placement)
      (throw (js/Error. "placement must be child, last-child, before, or after")))
    (letfn [(read-entity [uuid]
              (p/let [result (api-fn "logseq.DB.datascriptQuery" [query (uuid-query-input uuid)])]
                (js->clj result :keywordize-keys true)))
            (preflight [remaining sources]
              (if-let [uuid (first remaining)]
                (p/let [entity (read-entity uuid)
                        descendants-result (api-fn "logseq.DB.datascriptQuery"
                                                   ["[:find ?child-uuid :in $ ?root-uuid :where [?root :block/uuid ?root-uuid] [?child :block/parent+ ?root] [?child :block/uuid ?child-uuid]]"
                                                    (uuid-query-input uuid)])
                        descendants (set (map first (js->clj descendants-result)))]
                  (when-not entity (throw (js/Error. (str "Missing block " uuid))))
                  (when (or (:name entity) (:block/name entity))
                    (throw (js/Error. "A selected UUID identifies a page")))
                  (when-not (and (entity-ref-id (:parent entity)) (entity-ref-id (:page entity)))
                    (throw (js/Error. "A selected block lacks parent or page data")))
                  (when (or (contains? descendants target-uuid) (some descendants uuids))
                    (throw (js/Error. "The selection contains nested blocks or a target inside a selected subtree")))
                  (preflight (rest remaining) (assoc sources uuid entity)))
                (p/resolved sources)))
            (move-run [remaining anchor mode moved]
              (if-let [uuid (first remaining)]
                (p/let [outcome (-> (p/then (p/resolved nil)
                                           (fn [_] (move-block api-fn #js {"block_uuid" uuid "target_uuid" anchor
                                                                          "placement" mode "verbose" false})))
                                   (p/catch (fn [error] {:verified false :diagnostic (.-message error)})))
                        moved (conj moved {:uuid uuid :verified (:verified outcome)
                                           :diagnostic (:diagnostic outcome)})]
                  (if (:verified outcome)
                    (move-run (rest remaining) uuid "after" moved)
                    {:moved moved :remaining (vec (rest remaining)) :stopped (:diagnostic outcome)}))
                (p/resolved {:moved moved :remaining []})))
            (rollback-run [remaining sources restored]
              (if-let [uuid (first remaining)]
                (let [parent-uuid (get-in sources [uuid :parent :uuid])]
                  (p/let [outcome (-> (p/then (p/resolved nil)
                                             (fn [_] (move-block api-fn #js {"block_uuid" uuid "target_uuid" parent-uuid
                                                                            "placement" "last-child" "verbose" false})))
                                     (p/catch (fn [error] {:verified false :diagnostic (.-message error)})))]
                    (rollback-run (rest remaining) sources
                                  (conj restored {:uuid uuid :verified (:verified outcome)
                                                  :diagnostic (:diagnostic outcome)}))))
                (p/resolved restored)))]
      (p/let [target (read-entity target-uuid)]
        (when-not target (throw (js/Error. "The target does not exist")))
        (when (and (contains? #{"before" "after"} placement) (:name target))
          (throw (js/Error. "A page has no siblings")))
        (p/let [sources (preflight uuids {})
                outcome (move-run (take 50 uuids) target-uuid placement [])
                moved (:moved outcome)
                landed (mapv :uuid (filter :verified moved))
                parent-id (if (contains? #{"child" "last-child"} placement)
                            (:id target) (entity-ref-id (:parent target)))
                siblings-result (api-fn "logseq.DB.datascriptQuery"
                                        ["[:find [(pull ?child [:block/uuid :block/order]) ...] :in $ ?parent-id :where [?child :block/parent ?parent-id]]"
                                         parent-id])
                siblings (sort-by :order (js->clj siblings-result :keywordize-keys true))
                observed (mapv :uuid (filter #(contains? (set landed) (:uuid %)) siblings))
                order-preserved? (= landed observed)
                failed? (or (:stopped outcome) (not order-preserved?))
                restored (if (and failed? all-or-nothing?) (rollback-run landed sources []) [])
                not-attempted (into (:remaining outcome) (drop 50 uuids))]
          {:verified (and (not failed?) (empty? not-attempted))
           :target_uuid target-uuid :placement placement :moved moved
           :summary {:requested (count uuids) :attempted (count moved)
                     :landed (- (count landed) (count (filter :verified restored)))
                     :failed (count (remove :verified moved)) :not_attempted (count not-attempted)}
           :order_preserved order-preserved? :not_attempted not-attempted :rolled_back restored
           :diagnostic (str (or (:stopped outcome) "Sequential moves completed; inspect each verdict.")
                            (when (seq restored)
                              " Rollback is best-effort: parentage can be restored, original positions cannot."))})))))

(defn split-block
  [api-fn args]
  (let [block-uuid (aget args "block_uuid")
        query "[:find (pull ?block [:db/id :block/uuid :block/title :block/name {:block/parent [:db/id]} {:block/page [:db/id]}]) . :in $ ?uuid :where [?block :block/uuid ?uuid]]"]
    (p/let [result (api-fn "logseq.DB.datascriptQuery" [query (uuid-query-input block-uuid)])
            block (js->clj result :keywordize-keys true)]
      (when-not block
        (throw (js/Error. "No block exists with this UUID")))
      (when (or (:name block) (:block/name block))
        (throw (js/Error. "UUID identifies a page, not a block")))
      (when-not (and (entity-ref-id (or (:parent block) (:block/parent block)))
                     (entity-ref-id (or (:page block) (:block/page block))))
        (throw (js/Error. "The block is missing its parent or owning page")))
      (let [parts (split-block-parts (or (:title block) (:block/title block) "")
                                     (aget args "offset") (aget args "delimiter"))]
        (letfn [(create-tails [remaining created]
                  (if-let [title (first remaining)]
                    (p/let [outcome (create-block api-fn #js {"parent_uuid" block-uuid "title" title "verbose" true})]
                      (if (:verified outcome)
                        (create-tails (rest remaining) (conj created (first (:verified_entities outcome))))
                        {:created created :failure (:diagnostic outcome)}))
                    (p/resolved {:created created})))
                (place-tails [remaining anchor placed]
                  (if-let [tail (first remaining)]
                    (p/let [outcome (move-block api-fn #js {"block_uuid" (:uuid tail)
                                                           "target_uuid" anchor "placement" "after" "verbose" true})]
                      (if (:verified outcome)
                        (place-tails (rest remaining) (:uuid tail)
                               (conj placed (first (:verified_entities outcome))))
                        {:failure (:diagnostic outcome) :placed placed}))
                      (p/resolved {:placed placed})))
                (report [created verified diagnostic]
                  {:block_uuid block-uuid :parts (count parts)
                   :created (mapv entity-write-digest created)
                   :verified verified :diagnostic diagnostic})]
          (p/let [creation (create-tails (rest parts) [])
                  created (:created creation)]
            (if (:failure creation)
              (report created false (str "Tail creation failed; original text is unchanged. " (:failure creation)))
                    (p/let [placement (place-tails created block-uuid [])
                      created (into (:placed placement) (drop (count (:placed placement)) created))]
                (if (:failure placement)
                  (report created false (str "Tail placement failed; original text is unchanged. " (:failure placement)))
                  (p/let [current-result (api-fn "logseq.DB.datascriptQuery" [query (uuid-query-input block-uuid)])
                          current (js->clj current-result :keywordize-keys true)]
                    (if (not= (or (:title block) (:block/title block))
                              (or (:title current) (:block/title current)))
                      (report created false "The original was edited during the split; it was not truncated.")
                      (p/let [updated (update-block api-fn #js {"block_uuid" block-uuid "title" (first parts)})]
                        (report created (:verified updated)
                                (if (:verified updated)
                                  "Tail siblings were verified before truncating the original."
                                  (str "Tails exist but updating the original did not verify. " (:diagnostic updated))))))))))))))))

(defn migrate-page
  [api-fn args]
  (let [source-uuid (aget args "source_uuid")
        target-uuid (aget args "target_uuid")
        contains-text (aget args "contains")
        placement (or (aget args "placement") "last-child")
        dry-run? (true? (aget args "dry_run"))
        query "[:find (pull ?entity [:db/id :block/uuid :block/name :block/title]) . :in $ ?uuid :where [?entity :block/uuid ?uuid]]"
        children-query "[:find [(pull ?child [:block/uuid :block/title :block/order]) ...] :in $ ?parent-id :where [?child :block/parent ?parent-id]]"]
    (uuid-query-input source-uuid)
    (uuid-query-input target-uuid)
    (when (= source-uuid target-uuid)
      (throw (js/Error. "The source and target are the same page")))
    (when (and (some? contains-text) (or (not (string? contains-text)) (string/blank? contains-text)))
      (throw (js/Error. "contains cannot be blank; omit it to select every top-level block")))
    (when-not (contains? #{"child" "last-child" "before" "after"} placement)
      (throw (js/Error. "Invalid placement")))
    (p/let [source-result (api-fn "logseq.DB.datascriptQuery" [query (uuid-query-input source-uuid)])
            source (js->clj source-result :keywordize-keys true)
            target-result (api-fn "logseq.DB.datascriptQuery" [query (uuid-query-input target-uuid)])
            target (js->clj target-result :keywordize-keys true)]
      (when-not (:name source) (throw (js/Error. "The source must be an existing page")))
      (when-not target (throw (js/Error. "The target does not exist")))
      (when (and (:name target) (contains? #{"before" "after"} placement))
        (throw (js/Error. "A page has no siblings")))
      (p/let [children-result (api-fn "logseq.DB.datascriptQuery" [children-query (:id source)])
              children (sort-by :order (js->clj children-result :keywordize-keys true))
              selected (filterv #(or (nil? contains-text)
                                    (string/includes? (or (:title %) "") contains-text)) children)
              planned (mapv (fn [block] {:uuid (:uuid block) :order (:order block)
                                         :preview (subs (or (:title block) "") 0 (min 80 (count (or (:title block) ""))))})
                            selected)
              base {:source_uuid source-uuid :target_uuid target-uuid :planned planned}]
        (cond
          (empty? selected)
          (assoc base :verified true :moved [] :remaining (count children) :diagnostic "Nothing matched the selection.")

          dry-run?
          (assoc base :verified false :moved [] :remaining (count children)
                 :diagnostic "Dry run: nothing moved. Check the selected top-level previews.")

          :else
          (p/let [outcome (move-blocks api-fn #js {"block_uuids" (clj->js (mapv :uuid selected))
                                                  "target_uuid" target-uuid "placement" placement})
                  left-result (api-fn "logseq.DB.datascriptQuery" [children-query (:id source)])
                  left (js->clj left-result :keywordize-keys true)
                  expected-left (set (map :uuid (remove (set selected) children)))
                  actual-left (set (map :uuid left))]
            (merge base outcome {:verified (and (:verified outcome) (= expected-left actual-left))
                                 :remaining (count left)})))))))

(defn- recycled-entity?
  [entity]
  (some? (or (:logseq.property/deleted-at entity)
             (get entity (keyword ":logseq.property/deleted-at")))))

(defn- page-mutation-context
  [api-fn page-uuid]
  (p/let [page-result (api-fn "logseq.DB.datascriptQuery"
                             ["[:find (pull ?page [*]) . :in $ ?uuid :where [?page :block/uuid ?uuid]]"
                              (uuid-query-input page-uuid)])
          page (js->clj page-result :keywordize-keys true)]
    (when-not (and page (:name page))
      (throw (js/Error. "UUID must identify an existing page")))
    (p/let [blocks-result (api-fn "logseq.DB.datascriptQuery"
                                 ["[:find [(pull ?block [* {:block/parent [:db/id :block/uuid]}]) ...] :in $ ?page :where (or-join [?block ?page] [?block :block/parent+ ?page] [?block :block/page ?page])]"
                                  (:id page)])
            aliases-result (api-fn "logseq.DB.datascriptQuery"
                                  ["[:find [(pull ?related [:db/id :block/uuid :block/title :block/name]) ...] :in $ ?page :where (or-join [?related ?page] [?page :logseq.property/alias ?related] [?related :logseq.property/alias ?page] [?page :block/alias ?related] [?related :block/alias ?page])]"
                                   (:id page)])
            inbound-result (api-fn "logseq.DB.datascriptQuery"
                                  ["[:find [(pull ?holder [:db/id :block/uuid :block/title :block/name]) ...] :in $ ?page :where [?holder ?attribute ?page] [(not= ?attribute :block/parent)] [(not= ?attribute :block/parent+)] [(not= ?attribute :block/page)]]"
                                   (:id page)])
            blocks (js->clj blocks-result :keywordize-keys true)]
      (when (> (count blocks) 1000)
        (throw (js/Error. "Page inventory exceeds the 1000-block safety limit")))
      {:page page :blocks blocks
       :aliases (js->clj aliases-result :keywordize-keys true)
       :inbound (js->clj inbound-result :keywordize-keys true)})))

(defn delete-page
  [api-fn args]
  (let [page-uuid (aget args "page_uuid")
        verbose? (not (false? (aget args "verbose")))]
    (p/let [context (page-mutation-context api-fn page-uuid)
            page (:page context)
            previous (into [page] (:blocks context))]
      (when (recycled-entity? page) (throw (js/Error. "Page is already recycled")))
      (cond
        (and (seq (:aliases context)) (not (true? (aget args "acknowledge_alias_loss"))))
        {:verified false :previous_entities previous :observed_entities (:aliases context)
         :diagnostic "Alias relations cannot be restored through this API; acknowledge_alias_loss is required."}

        (and (seq (:inbound context)) (not (true? (aget args "acknowledge_reference_rewrite"))))
        {:verified false :previous_entities previous :observed_entities (:inbound context)
         :diagnostic "Inbound references are not rewritten; acknowledge_reference_rewrite is required."}

        :else
        (p/let [response (api-fn "logseq.DB.deletePage" [page-uuid])
                current-result (api-fn "logseq.DB.datascriptQuery"
                                       ["[:find (pull ?page [*]) . :in $ ?uuid :where [?page :block/uuid ?uuid]]"
                                        (uuid-query-input page-uuid)])
                current (js->clj current-result :keywordize-keys true)
                deleted? (or (nil? current) (recycled-entity? current))]
          (cond-> {:response (js->clj response :keywordize-keys true)
                   :verified deleted? :verified_entities (if deleted? (cond-> [] current (conj current)) [])
                   :previous_count (count previous) :observed_entities (:inbound context)
                   :diagnostic (if deleted? "Page is absent or recycled; inbound references were not rewritten."
                                   "Deletion was not observed; the page is still live.")}
            (or verbose? (not deleted?)) (assoc :previous_entities previous)))))))

(defn clear-page
  [api-fn args]
  (let [page-uuid (aget args "page_uuid")
        verbose? (not (false? (aget args "verbose")))]
    (p/let [context (page-mutation-context api-fn page-uuid)
            page (:page context)
            blocks (:blocks context)]
      (when (recycled-entity? page) (throw (js/Error. "Page is recycled")))
      (if (some :name blocks)
        {:verified false :previous_entities (into [page] blocks)
         :diagnostic "The page contains nested pages; migrate them before clearing it"}
        (let [by-id (into {} (map (juxt :id identity) blocks))
            value-ids (set (keep (fn [block]
                                  (when (or (:logseq.property/created-from-property block)
                                            (get block (keyword ":logseq.property/created-from-property")))
                                    (:id block))) blocks))
            protected? (fn [block]
                         (loop [current block, seen #{}]
                           (let [id (:id current)
                                 parent-id (entity-ref-id (:parent current))]
                             (cond
                               (contains? value-ids id) true
                               (= parent-id (:id page)) false
                               (or (contains? seen id) (nil? (get by-id parent-id)))
                               (throw (js/Error. "The page parent inventory is incomplete or cyclic; nothing was cleared"))
                               :else (recur (get by-id parent-id) (conj seen id))))))
            protected (filterv protected? blocks)
            content (filterv #(not (protected? %)) blocks)
            roots (filterv #(= (:id page) (entity-ref-id (:parent %))) content)
            metadata (fn [entity]
                       (dissoc entity :updated-at :block/updated-at :tx-id
                               :logseq.property/updated-at (keyword ":logseq.property/updated-at")))]
        (doseq [block blocks] (uuid-query-input (:uuid block)))
        (letfn [(clear-roots [remaining outcomes]
                  (if-let [root (first remaining)]
                    (p/let [result (remove-block api-fn #js {"block_uuid" (:uuid root) "verbose" true})]
                      (if (:verified result)
                        (clear-roots (rest remaining) (conj outcomes result))
                        {:outcomes (conj outcomes result) :failure (:diagnostic result)}))
                    (p/resolved {:outcomes outcomes})))]
          (p/let [outcome (clear-roots roots [])
                  after (page-mutation-context api-fn page-uuid)
                  expected-ids (set (map :uuid protected))
                  actual-ids (set (map :uuid (:blocks after)))
                  verified? (and (nil? (:failure outcome)) (= expected-ids actual-ids)
                                 (= (metadata page) (metadata (:page after))))]
            (cond-> {:verified verified? :verified_entities [(:page after)]
                     :previous_count (count content) :preserved_property_blocks (count protected)
                     :observed_entities (:blocks after)
                     :diagnostic (or (:failure outcome)
                                     (if verified? "Content cleared; page metadata and property-value subtrees are preserved."
                                         "Clear did not verify; inspect the remaining blocks and page metadata."))}
              (or verbose? (not verified?)) (assoc :previous_entities (into [page] content))))))))))

(defn parse-outline
  [text]
  (when-not (string? text) (throw (js/Error. "outline must be a string")))
  (let [lines (keep-indexed (fn [index raw]
                              (when-not (string/blank? raw)
                                (let [expanded (string/replace raw "\t" "    ")
                                      indent (count (re-find #"^ *" expanded))
                                      title (string/replace-first (string/trim raw) #"^[-*+]\s+" "")]
                                  {:line (inc index) :indent indent :title title})))
                            (string/split-lines text))
        unit (or (:indent (first (filter #(pos? (:indent %)) lines))) 1)]
    (loop [remaining lines, entries [], counts {}, last-paths {}]
      (if-let [{:keys [line indent title]} (first remaining)]
        (let [depth (/ indent unit)
              parent (if (zero? depth) [] (get last-paths (dec depth)))
              path (conj parent (get counts parent 0))]
          (when (or (not (zero? (mod indent unit))) (nil? parent) (> depth 20)
                    (string/blank? title) (re-find #"^[-*+]$" title))
            (throw (js/Error. (str "Invalid outline indentation or empty bullet at line " line))))
          (when (>= (count entries) 1000) (throw (js/Error. "Outline exceeds the 1000-block limit")))
          (recur (rest remaining) (conj entries {:path path :title title})
                 (update counts parent (fnil inc 0))
                 (assoc (into {} (filter #(<= (key %) depth) last-paths)) depth path)))
        entries))))

(defn- create-outline-entries
  [api-fn page-uuid entries dry-run? verbose?]
  (let [groups (->> entries (group-by #(pop (:path %)))
                    (sort-by (fn [[path _]] [(count path) path])) vec)
        query "[:find (pull ?entity [* {:block/parent [:db/id]} {:block/page [:db/id]}]) . :in $ ?uuid :where [?entity :block/uuid ?uuid]]"]
    (uuid-query-input page-uuid)
    (when (empty? entries) (throw (js/Error. "Outline is empty")))
    (letfn [(read-entity [uuid]
              (p/let [result (api-fn "logseq.DB.datascriptQuery" [query (uuid-query-input uuid)])]
                (js->clj result :keywordize-keys true)))
            (verify-created [remaining items parent-id page-id found]
              (if-let [uuid (first remaining)]
                (p/let [entity (read-entity uuid)]
                  (if (and (= uuid (:uuid entity))
                           (= parent-id (entity-ref-id (:parent entity)))
                           (= page-id (entity-ref-id (:page entity)))
                             (let [sent (:title (first items))
                               heading (re-find #"^(#{1,6})\s+" sent)
                               expected (if heading (subs sent (count (first heading))) sent)
                               stored (or (:title entity) "")]
                             (and (if (:verbatim (first items))
                                (= (string/replace expected #"\s+$" "") stored)
                                (nil? (content-loss expected stored)))
                                (or (nil? heading)
                                  (= (count (second heading))
                                   (or (:logseq.property/heading entity)
                                     (get entity (keyword ":logseq.property/heading"))))))))
                    (verify-created (rest remaining) (rest items) parent-id page-id (conj found entity))
                    {:created found :failure (str "Created block " uuid " did not verify parent, page, or content.")}))
                (p/resolved {:created found})))
            (insert-groups [remaining parents page-id created calls]
              (if-let [[parent-path items] (first remaining)]
                (p/let [parent-uuid (get parents parent-path)
                        parent (read-entity parent-uuid)
                        response (api-fn "logseq.DB.insertBatchBlock"
                                         [parent-uuid (clj->js (mapv #(hash-map :content (:title %)) items))
                                          #js {:sibling false}])
                        returned (js->clj response :keywordize-keys true)
                        uuids (mapv #(or (:uuid %) (:block/uuid %)) returned)]
                  (if-not (and (= (count items) (count uuids))
                               (= (count uuids) (count (set uuids)))
                               (every? #(and (string? %) (re-matches page-stats-uuid-pattern %)) uuids))
                    {:verified false :created created :calls (inc calls) :response returned
                     :diagnostic "Batch returned an unexpected inventory; outline may be partially built."}
                    (p/let [verification (verify-created uuids items (:id parent) page-id [])
                            children-result (api-fn "logseq.DB.datascriptQuery"
                                                    ["[:find [(pull ?child [:block/uuid :block/order]) ...] :in $ ?parent-id :where [?child :block/parent ?parent-id]]"
                                                     (:id parent)])
                            children (js->clj children-result :keywordize-keys true)
                            observed (mapv :uuid (filter #(contains? (set uuids) (:uuid %)) (sort-by :order children)))
                            created (into created (:created verification))]
                      (if (or (:failure verification) (not= uuids observed))
                        {:verified false :created created :calls (inc calls)
                         :diagnostic (or (:failure verification) "Batch sibling order did not verify; outline is partially built.")}
                        (insert-groups (rest remaining) (into parents (map vector (map :path items) uuids))
                                       page-id created (inc calls))))))
                (p/resolved {:verified true :created created :calls calls :diagnostic nil})))]
      (p/let [page (read-entity page-uuid)]
        (when-not (and (:name page) (not (recycled-entity? page)))
          (throw (js/Error. "page_uuid must identify a live page")))
        (if dry-run?
          {:verified false :dry_run true :block_count (count entries) :estimated_calls (count groups)
           :levels (apply max (map #(count (:path %)) entries))}
          (p/let [outcome (insert-groups groups {[] page-uuid} (:id page) [] 0)]
            (cond-> (assoc outcome :page_uuid page-uuid :created_count (count (:created outcome))
                           :levels (apply max (map #(count (:path %)) entries)))
              (and (not verbose?) (:verified outcome)) (update :created #(mapv entity-write-digest %)))))))))

(defn create-page-of-blocks
  [api-fn args]
  (create-outline-entries api-fn (aget args "page_uuid") (parse-outline (aget args "outline"))
                          (true? (aget args "dry_run")) (not (false? (aget args "verbose")))))

(defn- escape-import-references
  [text]
  (-> text
      (string/replace #"#\[\[([^\]]+)\]\]" (fn [[_ name]] (str "{{tag:" (string/trim name) "}}")))
      (string/replace #"\[\[([^\]]+)\]\]" (fn [[_ name]] (str "{{link:" (string/trim name) "}}")))
      (string/replace #"(^|[^\w#])#([A-Za-z0-9_/-]+)"
                      (fn [[_ prefix name]] (str prefix "{{tag:" name "}}")))))

(defn parse-import
  [input]
  (let [input (if (and (string? input) (string/starts-with? (string/triml input) "["))
                (js->clj (js/JSON.parse input) :keywordize-keys true)
                (if (array? input) (js->clj input :keywordize-keys true) input))
        verbatim? (vector? input)
        parsed
        (if verbatim?
          {:rows (mapv (fn [element]
                         (let [text (if (string? element) element (or (:text element) (:content element)))
                               depth (if (string? element) 0 (get element :depth 0))]
                           (when-not (and (string? text) (not (string/blank? text))
                                          (number? depth) (js/Number.isInteger depth) (<= 0 depth 20))
                             (throw (js/Error. "Each import block needs non-empty text and an integer depth from 0 to 20")))
                           (when (re-find #"(?m)^[\t ]*-\s" text)
                             (throw (js/Error. "A verbatim block contains a bullet line that Logseq truncates")))
                           {:text text :depth depth})) input)
           :page_properties {} :warnings []}
          (do
            (when-not (and (string? input) (not (string/blank? input)))
              (throw (js/Error. "markdown must be a non-empty string or block list")))
            (let [lines (string/split-lines input)
                  unit (or (some (fn [line]
                                   (when-let [[_ indent] (re-find #"^([\t ]+)-\s" line)]
                                     (count (string/replace indent "\t" " ")))) lines) 1)]
              (reduce (fn [{:keys [rows] :as result} line]
                        (if-let [[_ indent text] (re-find #"^([\t ]*)-\s(.*)$" line)]
                          (let [depth (js/Math.floor (/ (count (string/replace indent "\t" " ")) unit))]
                            (when (string/blank? text) (throw (js/Error. "Markdown contains an empty bullet")))
                            (update result :rows conj {:text (string/trim text) :depth depth}))
                          (cond
                            (string/blank? line) result
                            (seq rows) (update-in result [:rows (dec (count rows)) :text] str "\n" (string/trim line))
                            :else (if-let [[_ name value] (re-find #"^([A-Za-z][\w.-]*)::\s*(.*)$" (string/trim line))]
                                    (assoc-in result [:page_properties name] value)
                                    (throw (js/Error. "Text before the first bullet would be discarded; use a block list instead"))))))
                      {:rows [] :page_properties {} :warnings []} lines))))]
    (when (or (empty? (:rows parsed)) (> (count (:rows parsed)) 500))
      (throw (js/Error. "Import requires between 1 and 500 blocks")))
    (loop [remaining (:rows parsed), entries [], counts {}, last-paths {}, warnings (:warnings parsed)]
      (if-let [{:keys [text depth]} (first remaining)]
        (let [maximum-depth (count last-paths)
              actual-depth (if verbatim? depth (min depth maximum-depth))
              parent (if (zero? actual-depth) [] (get last-paths (dec actual-depth)))
              path (conj parent (get counts parent 0))
              escaped (escape-import-references text)]
          (when (or (> depth 20) (nil? parent))
            (throw (js/Error. "Import depth skips a parent or exceeds 20 levels")))
          (recur (rest remaining) (conj entries {:path path :title escaped :verbatim verbatim?})
                 (update counts parent (fnil inc 0))
                 (assoc (into {} (filter #(<= (key %) actual-depth) last-paths)) actual-depth path)
                 (cond-> warnings (not= depth actual-depth) (conj "An indentation jump was flattened to one available level."))))
        (assoc parsed :entries entries :warnings warnings
               :escaped_links (vec (sort (set (map second (mapcat #(re-seq #"\{\{link:([^}]+)\}\}" (:title %)) entries)))))
               :escaped_tags (vec (sort (set (map second (mapcat #(re-seq #"\{\{tag:([^}]+)\}\}" (:title %)) entries))))))))))

(defn create-page
  [api-fn args]
  (let [title (aget args "title")
        dry-run? (true? (aget args "dry_run"))
        verbose? (not (false? (aget args "verbose")))]
    (when-not (and (string? title) (not (string/blank? title)))
      (throw (js/Error. "Expected a non-empty title")))
    (p/let [availability (is-title-available api-fn #js {"title" title})]
      (when-not (:available availability)
        (let [kinds (->> (:held_by availability) (map :kind) distinct (string/join ", "))]
          (throw (js/Error. (str "An entity titled " (pr-str title)
                                 " already exists (" kinds "). Pages, tags and blocks share a title space.")))))
      (if dry-run?
        {:validation {:title title :checked "locally"}
         :response nil
         :verified_entities []
         :recovered_after_timeout false
         :verified false
         :diagnostic (str "Dry run: nothing was written, so verified is false by design. "
                          "This checks the title locally; createPage has no server-side dry run.")}
        (p/let [response (api-fn "logseq.DB.createPage" [title])
                response-map (js->clj response :keywordize-keys true)]
          (when-let [error (and response (aget response "error"))]
            (throw (js/Error. (str error))))
          (let [created-uuid (or (:uuid response-map) (:block/uuid response-map))
                by-uuid-query "[:find (pull ?page [:db/id :block/uuid :block/name :block/title]) . :in $ ?uuid :where [?page :block/uuid ?uuid] [?page :block/tags ?class] [?class :db/ident :logseq.class/Page]]"]
            (p/let [page-result (if created-uuid
                                  (api-fn "logseq.DB.datascriptQuery"
                      [by-uuid-query (uuid-query-input created-uuid)])
                                  nil)
                    page-from-uuid (js->clj page-result :keywordize-keys true)
                  pages-by-title (when-not page-from-uuid (query-pages api-fn page-title-query title))
                  page (or page-from-uuid (first pages-by-title))]
              (if-not (and page (or (:name page) (:block/name page)))
                {:validation nil
                 :response response-map
                 :verified_entities []
                 :recovered_after_timeout false
                 :verified false
                 :diagnostic (str "No page titled " (pr-str title) " is present after the write.")}
                (if verbose?
                  {:validation nil
                   :response response-map
                   :verified_entities [page]
                   :recovered_after_timeout false
                   :verified true
                   :diagnostic "createPage creates the page with one empty block; later block counts include it."}
                  (merge {:verified true
                          :diagnostic "createPage creates the page with one empty block; later block counts include it."}
                         (entity-write-digest page)))))))))))

(defn import-page
  [api-fn args]
  (let [target (aget args "target")
        parsed (parse-import (aget args "markdown"))
        entries (:entries parsed)
        base {:blocks (count entries) :escaped_links (:escaped_links parsed) :escaped_tags (:escaped_tags parsed)
              :page_properties (:page_properties parsed)
              :warnings (cond-> (:warnings parsed) (seq (:page_properties parsed))
                          (conj "Page properties were parsed but not applied; they are outside the writable namespace."))}]
    (when-not (and (string? target) (not (string/blank? target)))
      (throw (js/Error. "target must be a page UUID or non-empty title")))
    (if (true? (aget args "dry_run"))
      (assoc base :verified false :created_page false :calls (count (set (map #(pop (:path %)) entries)))
             :diagnostic "Dry run: nothing was written; references will be escaped as placeholders.")
      (p/let [pages (if (re-matches page-stats-uuid-pattern target) [] (query-pages api-fn page-title-query target))
              _ (when (> (count pages) 1) (throw (js/Error. "Multiple pages share target title; supply an exact UUID")))
              creation (when (and (not (re-matches page-stats-uuid-pattern target)) (empty? pages))
                         (create-page api-fn #js {"title" target "verbose" true}))
              page-uuid (cond (re-matches page-stats-uuid-pattern target) target
                              (seq pages) (:uuid (first pages))
                              :else (get-in creation [:verified_entities 0 :uuid]))
              base (assoc base :page_uuid page-uuid :created_page (boolean creation))]
        (if (and creation (not (:verified creation)))
          (assoc base :verified false :diagnostic (:diagnostic creation))
          (p/let [before (page-mutation-context api-fn page-uuid)
                  _ (when (recycled-entity? (:page before)) (throw (js/Error. "Cannot import into a recycled page")))
                  cleared (when (true? (aget args "replace"))
                            (clear-page api-fn #js {"page_uuid" page-uuid "verbose" true}))]
            (if (and cleared (not (:verified cleared)))
              (assoc base :verified false :diagnostic (:diagnostic cleared)
                     :replaced_entities (:previous_entities cleared))
              (p/let [baseline (if cleared (page-mutation-context api-fn page-uuid) before)
                      outcome (create-outline-entries api-fn page-uuid entries false true)
                      after (page-mutation-context api-fn page-uuid)
                      expected-ids (into (set (map :uuid (:blocks baseline))) (map :uuid (:created outcome)))
                      actual-ids (set (map :uuid (:blocks after)))
                      verified? (and (:verified outcome) (= (count entries) (count (:created outcome)))
                                     (= expected-ids actual-ids))]
                (cond-> (assoc base :page_title (:title (:page after)) :verified verified?
                               :calls (:calls outcome) :created_uuids (mapv :uuid (:created outcome))
                               :diagnostic (when-not verified? (or (:diagnostic outcome)
                                                                  "Import inventory did not verify; inspect the page before retrying.")))
                  cleared (assoc :replaced_entities (:previous_entities cleared)))))))))))

(defn rename-page
  [api-fn args]
  (let [page-uuid (aget args "page_uuid")
        new-title (aget args "new_title")
        verbose? (not (false? (aget args "verbose")))]
    (when-not (and (string? page-uuid)
                   (re-matches page-stats-uuid-pattern page-uuid))
      (throw (js/Error. "page_uuid must be a UUID")))
    (when-not (and (string? new-title) (not (string/blank? new-title)))
      (throw (js/Error. "Expected a non-empty title")))
    (let [page-query "[:find (pull ?page [:db/id :block/uuid :block/name :block/title :logseq.property/deleted-at]) . :in $ ?uuid :where [?page :block/uuid ?uuid] [?page :block/tags ?class] [?class :db/ident :logseq.class/Page]]"]
      (p/let [page-result (api-fn "logseq.DB.datascriptQuery" [page-query (uuid-query-input page-uuid)])
              page (js->clj page-result :keywordize-keys true)
              availability (is-title-available api-fn #js {"title" new-title})
              clashes (remove #(= page-uuid (or (:uuid %) (:block/uuid %)))
                              (:held_by availability))]
        (when-not page
          (throw (js/Error. (str "No live page exists with exact UUID " page-uuid))))
        (when (recycled-entity? page)
          (throw (js/Error. (str "Page " page-uuid " is recycled and cannot be renamed"))))
        (when (seq clashes)
          (throw (js/Error. (str "An entity titled " (pr-str new-title)
                                 " already exists; renaming onto it would make the two indistinguishable"))))
        (p/let [response (api-fn "logseq.DB.renamePage" [page-uuid new-title])]
          (when-let [error (and response (aget response "error"))]
            (throw (js/Error. (str error))))
          (p/let [current-result (api-fn "logseq.DB.datascriptQuery" [page-query (uuid-query-input page-uuid)])
                  current (js->clj current-result :keywordize-keys true)]
            (cond
              (or (nil? current) (not= new-title (or (:title current) (:block/title current)))
                  (not (or (:name current) (:block/name current)))
                  (recycled-entity? current))
              {:validation nil
               :response (js->clj response :keywordize-keys true)
               :verified_entities []
               :recovered_after_timeout false
               :verified false
               :previous_entities [page]
               :observed_entities (if current [current] [])
               :diagnostic "Rename was not observed on the original page UUID."}

              verbose?
              {:validation nil
               :response (js->clj response :keywordize-keys true)
               :verified_entities [current]
               :recovered_after_timeout false
               :verified true
               :previous_entities [page]
               :diagnostic nil}

              :else
              (merge {:verified true :diagnostic nil :previous_count 1}
                     (entity-write-digest current)))))))))

(defn retitle-over-duplicate
  [api-fn args]
  (let [from-uuid (aget args "from_uuid")
        to-title (aget args "to_title")
        suffix (or (aget args "park_suffix") "(parked)")]
    (uuid-query-input from-uuid)
    (when-not (and (string? to-title) (not (string/blank? to-title))
                   (string? suffix) (not (string/blank? suffix)))
      (throw (js/Error. "to_title and park_suffix must be non-empty strings")))
    (letfn [(rename-read [page title]
              (-> (p/let [response (api-fn "logseq.DB.renamePage" [(:uuid page) title])
                          result (api-fn "logseq.DB.datascriptQuery"
                                         ["[:find (pull ?page [*]) . :in $ ?uuid :where [?page :block/uuid ?uuid]]"
                                          (uuid-query-input (:uuid page))])
                          current (js->clj result :keywordize-keys true)]
                    {:verified (and (= (:uuid page) (:uuid current)) (= title (:title current))
                                    (= (recycled-entity? page) (recycled-entity? current)))
                     :entity current :response (js->clj response :keywordize-keys true)})
                  (p/catch (fn [error] {:verified false :diagnostic (.-message error)}))))]
      (p/let [source (page-mutation-context api-fn from-uuid)
              availability (is-title-available api-fn #js {"title" to-title})
              holders (vec (remove #(= from-uuid (:uuid %)) (:held_by availability)))
              base {:from_uuid from-uuid :to_title to-title :renamed nil :parked nil
                    :references {:from (count (:inbound source))}}]
        (cond
          (> (count holders) 1)
          (assoc base :verified false :diagnostic "Multiple entities hold this title; nothing was renamed.")

          (empty? holders)
          (p/let [outcome (rename-read (:page source) to-title)]
            (assoc base :verified (:verified outcome) :renamed (:entity outcome)
                   :diagnostic (if (:verified outcome) "No holder needed parking; source renamed by UUID."
                                   "The source rename did not verify.")))

          (not= "page" (:kind (first holders)))
          (assoc base :verified false :diagnostic "The title holder is not a page; nothing was renamed.")

          :else
          (p/let [holder (page-mutation-context api-fn (:uuid (first holders)))
                  base (assoc-in base [:references :holder] (count (:inbound holder)))
                  parked-title (str to-title " " (string/trim suffix))]
            (cond
              (seq (:aliases holder))
              (assoc base :verified false :diagnostic "The holder is in an alias relation; nothing was renamed.")

              (some #(not (string/blank? (:title %))) (:blocks holder))
              (assoc base :verified false :diagnostic "The holder has content; merging is a caller decision.")

              :else
              (p/let [parking (is-title-available api-fn #js {"title" parked-title})]
                (if-not (:available parking)
                  (assoc base :verified false :diagnostic "The parking title is occupied; choose another suffix.")
                  (p/let [park (rename-read (:page holder) parked-title)]
                    (if-not (:verified park)
                      (assoc base :verified false :diagnostic "Parking did not verify; source was not renamed.")
                      (p/let [renamed (rename-read (:page source) to-title)]
                        (assoc base :verified (:verified renamed)
                               :renamed (:entity renamed) :parked (:entity park)
                               :parked_original_title (:title (:page holder))
                               :diagnostic (if (:verified renamed)
                                             "Two verified renames; both UUIDs and their references are retained."
                                             (str "Partially applied. To undo, rename " (:uuid (:page holder))
                                                  " back to " (pr-str to-title) ". Original positions and content were not edited.")))))))))))))))

(defn add-property
  [api-fn args]
  (let [target-uuid (aget args "target_uuid")
        ident (query-ident (aget args "property_ident"))
        value-js (aget args "value")
        value (js->clj value-js :keywordize-keys true)
        options (or (aget args "options") #js {})
        verbose? (not (false? (aget args "verbose")))]
    (when-not (and (string? target-uuid)
                   (re-matches page-stats-uuid-pattern target-uuid))
      (throw (js/Error. "target_uuid must be a UUID")))
    (when-not ident
      (throw (js/Error. "Expected an exact namespaced property ident")))
    (when-not (string/starts-with? (subs ident 1) "plugin.property.")
      (throw (js/Error. (str "Property " ident " is outside this caller's namespace"))))
    (let [target-query (str "[:find (pull ?target [*]) . :where "
                            "[?target :block/uuid #uuid \"" target-uuid "\"]]")
          property-query (str "[:find (pull ?property [*]) . :where "
                              "[?property :db/ident " ident "]]" )]
      (p/let [target-result (api-fn "logseq.DB.datascriptQuery" [target-query])
              target (js->clj target-result :keywordize-keys true)
              property-result (api-fn "logseq.DB.datascriptQuery" [property-query])
              property (js->clj property-result :keywordize-keys true)]
        (when-not target
          (throw (js/Error. (str "No entity exists with exact UUID " target-uuid))))
        (when-not property
          (throw (js/Error. (str "No property exists with exact ident " ident))))
          (let [type (property-type property)
              value-id (property-value-id value)]
          (when (and (contains? reference-property-types type)
                     (not (valid-reference-property-value? value)))
            (throw (js/Error. (str ident " is a " (pr-str type)
                                   " property, so its value must be an entity id"))))
              (let [cardinality (or (property-entity-value property ":db/cardinality") (:cardinality property))
                many? (= "many" (last (string/split (string/replace-first (str cardinality) #"^:" "") #"/")))
                previous-value (property-entity-value target ident)]
            (p/let [previous-values (resolve-property-values api-fn previous-value)]
              (if (and many? (some #(= value-id %) previous-values))
                (let [diagnostic (str ident " already holds this value and is cardinality-many; writing again would add a duplicate rather than replace it, so nothing was sent.")]
                  (if verbose?
                    {:response nil :verified_state target :recovered_after_timeout false
                     :previous_state target :diagnostic diagnostic :verified true
                     :observed_state nil}
                    (merge {:verified true :diagnostic diagnostic}
                           (entity-write-digest target))))
                (p/let [response (api-fn "logseq.DB.upsertBlockProperty"
                                          [target-uuid ident value-js options])]
                  (when-let [error (and response (aget response "error"))]
                    (throw (js/Error. (str error))))
                  (p/let [current-result (api-fn "logseq.DB.datascriptQuery" [target-query])
                          current (js->clj current-result :keywordize-keys true)
                          held-values (resolve-property-values api-fn
                                                               (property-entity-value current ident))]
                    (when-not current
                      (throw (js/Error. (str "Target " target-uuid " disappeared during property write"))))
                    (when-not (some #(= value-id %) held-values)
                      (if (some? (property-entity-value current ident))
                        (throw (js/Error. (str "Property " ident " was set but its stored value does not match the requested value")))
                        (throw (js/Error. (str "Property " ident " was not set on the target")))))
                    (if verbose?
                      {:response (js->clj response :keywordize-keys true)
                       :verified_state current :recovered_after_timeout false
                       :previous_state target :diagnostic nil :verified true
                       :observed_state current}
                      (merge {:verified true :diagnostic nil}
                         (entity-write-digest current)))))))))))))

(defn remove-property
  [api-fn args]
  (let [target-uuid (aget args "target_uuid")
        ident (query-ident (aget args "property_ident"))
        verbose? (not (false? (aget args "verbose")))]
    (when-not (and (string? target-uuid)
                   (re-matches page-stats-uuid-pattern target-uuid))
      (throw (js/Error. "target_uuid must be a UUID")))
    (when-not ident
      (throw (js/Error. "Expected an exact namespaced property ident")))
    (when-not (string/starts-with? (subs ident 1) "plugin.property.")
      (throw (js/Error. (str "Property " ident " is outside this caller's namespace"))))
    (let [target-query (str "[:find (pull ?target [*]) . :where "
                            "[?target :block/uuid #uuid \"" target-uuid "\"]]")
          property-query (str "[:find (pull ?property [*]) . :where "
                              "[?property :db/ident " ident "]]" )]
      (p/let [target-result (api-fn "logseq.DB.datascriptQuery" [target-query])
              target (js->clj target-result :keywordize-keys true)
              property-result (api-fn "logseq.DB.datascriptQuery" [property-query])
              property (js->clj property-result :keywordize-keys true)]
        (when-not target
          (throw (js/Error. (str "No entity exists with exact UUID " target-uuid))))
        (when-not property
          (throw (js/Error. (str "No property exists with exact ident " ident))))
        (let [previous (property-entity-value target ident)]
          (p/let [response (api-fn "logseq.DB.removeBlockProperty" [target-uuid ident])]
            (when-let [error (and response (aget response "error"))]
              (throw (js/Error. (str error))))
            (p/let [current-result (api-fn "logseq.DB.datascriptQuery" [target-query])
                    current (js->clj current-result :keywordize-keys true)]
              (when-not current
                (throw (js/Error. (str "Target " target-uuid " disappeared during property removal"))))
              (when (some? (property-entity-value current ident))
                (throw (js/Error. (str "Property " ident " is still set on the target"))))
              (if verbose?
                {:response (js->clj response :keywordize-keys true)
                 :verified_state current
                 :recovered_after_timeout false
                 :previous_state target
                 :diagnostic nil
                 :verified true
                 :observed_state nil}
                (merge {:verified true :diagnostic nil}
                  (entity-write-digest current))))))))))

(defn get-block
  [api-fn args]
  (let [block-uuid (validated-uuid (aget args "block_uuid"))]
    (p/let [response (api-fn "logseq.DB.getBlock"
                            [block-uuid #js {:includeChildren false :includePage true}])
            block (js->clj response :keywordize-keys true)]
      (cond
        (and response (aget response "error"))
        (p/rejected (js/Error. (str (aget response "error"))))

        (and block (not= block-uuid (:uuid block)))
        (p/rejected (js/Error. "Application block API returned a different UUID"))

        :else
        (block-result block-uuid (if block [block] []))))))
(defn list-pages
  [call-api-fn args]
  (call-api-fn "logseq.DB.listPages" [#js {:expand (aget args "expand")}]))

(defn- query-result-rows
  [result]
  (let [rows (js->clj result :keywordize-keys true)]
    (if (and (= 1 (count rows)) (vector? (first rows)))
      (first rows)
      rows)))

(defn create-tag
  [api-fn args]
  (let [title (aget args "title")
        options (or (aget args "options") #js {})
        verbose? (not (false? (aget args "verbose")))]
    (when-not (and (string? title) (not (string/blank? title)))
      (throw (js/Error. "Tag title must not be empty")))
    (when (string/includes? title "/")
      (throw (js/Error. "Tag title should not include forward slash")))
    (let [clash-query "[:find [(pull ?e [:db/id :block/uuid :block/title :block/name]) ...] :in $ ?title :where [?e :block/name] [?e :block/title ?title]]"]
      (p/let [clashes-result (api-fn "logseq.DB.datascriptQuery" [clash-query title])
              clashes (query-result-rows clashes-result)]
        (when (seq clashes)
          (throw (js/Error. (str "An entity titled " (pr-str title)
                                 " already exists. Tags and pages share a title space, so creating this tag would make both unresolvable by title."))))
        (p/let [response (api-fn "logseq.DB.createTag" [title options])]
          (when-let [error (and response (aget response "error"))]
            (throw (js/Error. (str error))))
          (let [response-map (js->clj response :keywordize-keys true)
                tag-uuid (or (:uuid response-map) (:block/uuid response-map))]
            (when-not (string? tag-uuid)
              (throw (js/Error. "Tag creation did not return an entity with a UUID")))
            (let [tag-query "[:find (pull ?tag [:db/id :db/ident :block/uuid :block/title {:block/tags [:db/ident]}]) . :in $ ?uuid :where [?tag :block/uuid ?uuid] [?tag :block/tags ?class] [?class :db/ident :logseq.class/Tag]]"]
              (p/let [tag-result (api-fn "logseq.DB.datascriptQuery" [tag-query (uuid-query-input tag-uuid)])
                      tag (js->clj tag-result :keywordize-keys true)]
                (when-not tag
                  (throw (js/Error. "Tag creation reported success but the tag is not present")))
                (if verbose?
                  {:response response-map
                   :verified_state tag
                   :recovered_after_timeout false
                   :previous_state nil
                   :diagnostic nil
                   :verified true
                   :observed_state nil}
                  {:verified true
                   :uuid (or (:uuid tag) (:block/uuid tag))
                   :ident (or (:ident tag) (:db/ident tag))
                   :diagnostic nil})))))))))

(defn delete-tag
  [api-fn args]
  (let [tag-uuid (aget args "tag_uuid")
        acknowledge-child-reparent? (true? (aget args "acknowledge_child_reparent"))
        acknowledge-detach? (true? (aget args "acknowledge_detach"))
        verbose? (not (false? (aget args "verbose")))]
    (when-not (and (string? tag-uuid)
                   (re-matches page-stats-uuid-pattern tag-uuid))
      (throw (js/Error. "tag_uuid must be a UUID")))
    (let [tag-query "[:find (pull ?tag [*]) . :in $ ?uuid :where [?tag :block/uuid ?uuid] [?tag :block/tags ?class] [?class :db/ident :logseq.class/Tag]]"]
      (p/let [tag-result (api-fn "logseq.DB.datascriptQuery" [tag-query (uuid-query-input tag-uuid)])
              tag (js->clj tag-result :keywordize-keys true)]
        (when-not tag
          (throw (js/Error. (str "Tag does not exist with UUID " tag-uuid))))
        (let [tag-id (or (:id tag) (:db/id tag))
              previous (fn [holders children]
                         {:tag tag :holders holders :child_tags children})]
          (p/let [children-result (api-fn "logseq.DB.datascriptQuery"
                                          ["[:find [(pull ?child [:db/id :db/ident :block/uuid :block/title]) ...] :in $ ?parent :where [?child :logseq.property.class/extends ?parent]]"
                                           tag-id])
                  children (query-result-rows children-result)]
            (when (and (seq children) (not acknowledge-child-reparent?))
              (throw (js/Error. "Deleting this tag will reparent its child tags; set acknowledge_child_reparent=true to proceed")))
            (p/let [holders (get-tag-users api-fn #js {"tag_uuid" tag-uuid})]
              (if (and (seq holders) (not acknowledge-detach?))
                (let [diagnostic (str (count holders) " pages or blocks carry this tag and will lose it. Set acknowledge_detach=true to proceed.")]
                  (if verbose?
                    {:response nil
                     :verified_state nil
                     :recovered_after_timeout false
                     :previous_state (previous holders children)
                     :diagnostic diagnostic
                     :verified false
                     :observed_state holders}
                    {:verified false
                     :uuid tag-uuid
                     :parent nil
                     :page nil
                     :diagnostic diagnostic
                     :observed (mapv (fn [holder] (entity-write-digest holder)) holders)}))
                (p/let [response (api-fn "logseq.DB.deletePage" [tag-uuid])]
                  (when-let [error (and response (aget response "error"))]
                    (throw (js/Error. (str error))))
                  (p/let [current-result (api-fn "logseq.DB.datascriptQuery"
                                                 [tag-query (uuid-query-input tag-uuid)])
                          current (js->clj current-result :keywordize-keys true)]
                    (when current
                      (throw (js/Error. "Tag deletion was not observed; the tag is still present. This route is unverified and may require a name rather than a UUID.")))
                    (p/let [tag-holders-result (api-fn "logseq.DB.datascriptQuery"
                                                       ["[:find [?entity ...] :in $ ?target :where [?entity :block/tags ?target]]"
                                                        tag-id])
                            refs-result (api-fn "logseq.DB.datascriptQuery"
                                                ["[:find [?entity ...] :in $ ?target :where [?entity :block/refs ?target]]"
                                                 tag-id])
                            dangling (into (set (js->clj tag-holders-result))
                                           (js->clj refs-result))]
                      (when (seq dangling)
                        (throw (js/Error. (str "Tag deletion left dangling references on entities " (pr-str (sort dangling))))))
                      (let [diagnostic (str "Deleted " tag-uuid)]
                        (if verbose?
                          {:response (js->clj response :keywordize-keys true)
                           :verified_state nil
                           :recovered_after_timeout false
                           :previous_state (previous holders children)
                           :diagnostic diagnostic
                           :verified true
                           :observed_state nil}
                          {:verified true
                           :uuid tag-uuid
                           :parent nil
                           :page nil
                           :diagnostic diagnostic})))))))))))))

(defn- entity-reference-id
  [value]
  (if (map? value)
    (or (:id value) (:db/id value))
    value))

(defn add-tag
  [api-fn args]
  (let [target-uuid (aget args "target_uuid")
        tag-uuid (aget args "tag_uuid")
        verbose? (not (false? (aget args "verbose")))]
    (when-not (and (string? target-uuid)
                   (re-matches page-stats-uuid-pattern target-uuid))
      (throw (js/Error. "target_uuid must be a UUID")))
    (when-not (and (string? tag-uuid)
                   (re-matches page-stats-uuid-pattern tag-uuid))
      (throw (js/Error. "tag_uuid must be a UUID")))
    (let [target-query (str "[:find (pull ?target [*]) . :where "
                            "[?target :block/uuid #uuid \"" target-uuid "\"]]")
          class-query "[:find ?class . :where [?class :db/ident :logseq.class/Tag]]"]
      (p/let [target-result (api-fn "logseq.DB.datascriptQuery" [target-query])
              target (js->clj target-result :keywordize-keys true)
              tag-class (api-fn "logseq.DB.datascriptQuery" [class-query])
              tag-query (str "[:find (pull ?tag [*]) . :in $ ?uuid ?class :where "
                             "[?tag :block/uuid ?uuid] [?tag :block/tags ?class]]")
              tag-result (api-fn "logseq.DB.datascriptQuery" [tag-query (uuid-query-input tag-uuid) tag-class])
              tag (js->clj tag-result :keywordize-keys true)]
        (when-not target
          (throw (js/Error. (str "No entity exists with exact UUID " target-uuid))))
        (when-not tag
          (throw (js/Error. (str "UUID " tag-uuid " does not identify a tag"))))
        (let [tag-id (or (:id tag) (:db/id tag))
              previous-page? (boolean (or (:name target) (:block/name target)))]
          (p/let [response (api-fn "logseq.DB.addBlockTag" [target-uuid tag-uuid])]
            (when-let [error (and response (aget response "error"))]
              (throw (js/Error. (str error))))
            (p/let [current-result (api-fn "logseq.DB.datascriptQuery" [target-query])
                    current (js->clj current-result :keywordize-keys true)]
              (when-not current
                (throw (js/Error. (str "Target " target-uuid " disappeared during tag addition"))))
              (let [tags (or (:tags current) (:block/tags current) [])
                    tag-present? (contains? (set (keep entity-reference-id tags)) tag-id)]
                (when-not tag-present?
                  (throw (js/Error. "Tag addition was not observed on the target")))
                (when (and previous-page?
                           (not (or (:name current) (:block/name current))))
                  (throw (js/Error. "Target lost its page identity during the tag change")))
                (if verbose?
                  {:response (js->clj response :keywordize-keys true)
                   :verified_state current
                   :recovered_after_timeout false
                   :previous_state target
                   :diagnostic nil
                   :verified true
                   :observed_state current}
                  (merge {:verified true :diagnostic nil}
                        (entity-write-digest current)))))))))))

(defn remove-tag
  [api-fn args]
  (let [target-uuid (aget args "target_uuid")
        tag-uuid (aget args "tag_uuid")
        verbose? (not (false? (aget args "verbose")))]
    (when-not (and (string? target-uuid)
                   (re-matches page-stats-uuid-pattern target-uuid))
      (throw (js/Error. "target_uuid must be a UUID")))
    (when-not (and (string? tag-uuid)
                   (re-matches page-stats-uuid-pattern tag-uuid))
      (throw (js/Error. "tag_uuid must be a UUID")))
    (let [target-query (str "[:find (pull ?target [*]) . :where "
                            "[?target :block/uuid #uuid \"" target-uuid "\"]]")
          class-query "[:find ?class . :where [?class :db/ident :logseq.class/Tag]]"]
      (p/let [target-result (api-fn "logseq.DB.datascriptQuery" [target-query])
              target (js->clj target-result :keywordize-keys true)
              tag-class (api-fn "logseq.DB.datascriptQuery" [class-query])
              tag-query (str "[:find (pull ?tag [*]) . :in $ ?uuid ?class :where "
                             "[?tag :block/uuid ?uuid] [?tag :block/tags ?class]]")
              tag-result (api-fn "logseq.DB.datascriptQuery" [tag-query (uuid-query-input tag-uuid) tag-class])
              tag (js->clj tag-result :keywordize-keys true)]
        (when-not target
          (throw (js/Error. (str "No entity exists with exact UUID " target-uuid))))
        (when-not tag
          (throw (js/Error. (str "UUID " tag-uuid " does not identify a tag"))))
        (let [tag-id (or (:id tag) (:db/id tag))
              previous-page? (boolean (or (:name target) (:block/name target)))
              previous-tag-ids (set (keep entity-reference-id
                                           (or (:tags target) (:block/tags target))))]
          (p/let [response (api-fn "logseq.DB.removeBlockTag" [target-uuid tag-uuid])]
            (when-let [error (and response (aget response "error"))]
              (throw (js/Error. (str error))))
            (p/let [current-result (api-fn "logseq.DB.datascriptQuery" [target-query])
                    current (js->clj current-result :keywordize-keys true)]
              (when-not current
                (throw (js/Error. (str "Target " target-uuid " disappeared during tag removal"))))
              (let [current-tags (or (:tags current) (:block/tags current) [])
                    current-tag-ids (set (keep entity-reference-id current-tags))]
                (when (contains? current-tag-ids tag-id)
                  (throw (js/Error. "Tag removal was not observed on the target")))
                (when (and previous-page?
                           (not (or (:name current) (:block/name current))))
                  (throw (js/Error. "Target lost its page identity during the tag change")))
                (when-not (every? current-tag-ids (disj previous-tag-ids tag-id))
                  (throw (js/Error. "Removing the tag also removed another target tag")))
                (if verbose?
                  {:response (js->clj response :keywordize-keys true)
                   :verified_state current
                   :recovered_after_timeout false
                   :previous_state target
                   :diagnostic nil
                   :verified true
                   :observed_state current}
                  (merge {:verified true :diagnostic nil}
                         (entity-write-digest current)))))))))))

(defn- count-index
  [result]
  (let [rows (js->clj result :keywordize-keys true)]
    (into {}
          (keep (fn [row]
                  (when (and (vector? row) (= 2 (count row)))
                    [(first row) (second row)])))
          rows)))

(defn- count-journals
  [api-fn journals]
  (let [page-ids (keep #(or (:id %) (:db/id %)) journals)
        ids (clj->js (vec page-ids))]
    (if (seq page-ids)
      (p/let [own (api-fn "logseq.DB.datascriptQuery"
                          ["[:find ?page (count ?block) :in $ [?page ...] :where [?block :block/page ?page]]"
                           ids])
              empty (api-fn "logseq.DB.datascriptQuery"
                            ["[:find ?page (count ?block) :in $ [?page ...] :where [?block :block/page ?page] [?block :block/title \"\"]]"
                             ids])
              refs (api-fn "logseq.DB.datascriptQuery"
                           ["[:find ?target (count ?holder) :in $ [?target ...] :where [?holder :block/refs ?target]]"
                            ids])]
        [(count-index own)
         (count-index empty)
         (count-index refs)])
      (p/resolved [{} {} {}]))))

(defn list-journals
  [api-fn args]
  (let [with-counts? (true? (aget args "with_counts"))
        limit (aget args "limit")]
    (when (and (some? limit)
               (not (and (number? limit)
                         (js/Number.isInteger limit)
                         (pos? limit))))
      (throw (js/Error. "limit must be a positive integer")))
        (p/let [result (api-fn "logseq.DB.getJournalCandidates" [])
          journals (->> (js->clj result :keywordize-keys true)
                          (sort-by #(or (:journal-day %) (:block/journal-day %) 0) >)
                          vec)
            total (count journals)
            counted (if with-counts?
                      (vec (take (or limit 500) journals))
                      (if limit (vec (take limit journals)) journals))]
      (if-not with-counts?
        counted
        (p/let [[own empty refs] (count-journals api-fn counted)
                rows (mapv (fn [page]
                             (let [id (or (:id page) (:db/id page))
                                   own-blocks (get own id 0)
                                   empty-blocks (get empty id 0)]
                               (assoc page
                                      :own_blocks own-blocks
                                      :content_blocks (- own-blocks empty-blocks)
                                      :refs (get refs id 0))))
                           counted)
                truncated? (> total (count rows))]
          {:journals rows
           :total total
           :counted (count rows)
           :truncated truncated?
           :diagnostic (str "own_blocks includes the empty block createPage seeds and any trailing empty block, so content_blocks is the figure to pair with refs when judging whether a page carries anything."
                            (when truncated?
                              (str " Counts cover the first " (count rows) " of " total
                                   "; raise or set limit for a different slice, or use pageStats for specific pages.")))})))))

(defn- classify-duplicate-title-group
  [members own empty refs aliased]
  (let [detailed (mapv (fn [member]
                         (let [id (:id member)
                               own-blocks (get own id 0)]
                           (-> (dissoc member :id)
                               (assoc :own_blocks own-blocks
                                      :content_blocks (- own-blocks (get empty id 0))
                                      :block_refs (get refs id 0)
                                      :alias (contains? aliased id)))))
                       members)
        titles (->> detailed (map :title) set sort vec)
        with-content (filterv #(pos? (:content_blocks %)) detailed)
        empty-members (filterv #(zero? (:content_blocks %)) detailed)
        stubs (filterv #(zero? (:block_refs %)) empty-members)
        referenced (filterv #(pos? (:block_refs %)) empty-members)
        same-title? (= 1 (count titles))]
    (cond
      (some :alias detailed)
      {:titles titles
       :members detailed
       :classification "alias"
       :rank 5
       :reading "NOT a duplicate. At least one of these is in an alias relation, which is live resolution wiring and looks identical to an abandoned stub in every count. Deleting either side breaks resolution and cannot be repaired through this API. Leave it alone."}

      (> (count with-content) 1)
      {:titles titles
       :members detailed
       :classification "genuine_split"
       :rank 4
       :reading "Both sides hold content. Merging is a human decision -- read both pages. No tool should choose for you."}

      (and (seq with-content) (seq stubs) (empty? referenced))
      {:titles titles
       :members detailed
       :classification "dead_stub"
       :rank (if same-title? 0 1)
       :reading (str (count stubs) " empty entity(s) with no BLOCK references, beside one holding content. The safest class -- but block_refs does not count tag holders or property values, so run pageStats on the specific page before recycling it, and remember a recycled page keeps its title.")}

      (and (seq with-content) (seq referenced))
      {:titles titles
       :members detailed
       :classification "split_identity"
       :rank 2
       :reading "One side is empty but REFERENCED, the other holds the content. Recycling the empty one strands its inbound references. If it is the empty side holding the title you want, retitleOverDuplicate moves the title in two renames without touching a block."}

      :else
      {:titles titles
       :members detailed
       :classification (if same-title? "both_empty" "near_title")
       :rank 3
       :reading "Similar titles, and nothing here distinguishes them by content or references. They may be two intentional pages: a plural and a singular, or two short words one character apart. Read them before assuming otherwise."})))

(defn find-duplicate-titles
  [api-fn args]
  (let [normalize (or (aget args "normalize") "loose")
        include-recycled? (not (false? (aget args "include_recycled")))]
    (when-not (contains? #{"exact" "loose" "fuzzy"} normalize)
      (throw (js/Error. "normalize must be exact, loose, or fuzzy")))
        (p/let [inventory-result (api-fn "logseq.DB.getTitleInventory" [])
          inventory (js->clj inventory-result :keywordize-keys true)
            candidates (->> inventory
                            (keep (fn [entity]
                (when (and (map? entity)
                     (seq (:title entity))
                     (:id entity)
                     (or include-recycled? (not (:recycled entity))))
                  entity)))
                            vec)
            groups (group-title-candidates candidates normalize)]
      (if (empty? groups)
        {:normalize normalize
         :titles_examined (count candidates)
         :groups []
         :diagnostic (str "No title collisions among " (count candidates)
                          " pages and tags at this normalisation. Try normalize=fuzzy for typo pairs, which is off by default because it also matches legitimately distinct short titles.")}
        (p/let [[own empty refs] (count-journals api-fn
                                                 (mapv #(select-keys % [:id])
                                                       (mapcat identity groups)))
                alias-result (api-fn "logseq.DB.datascriptQuery"
                                     ["[:find ?holder ?target :where (or-join [?holder ?target] [?holder :logseq.property/alias ?target] [?holder :block/alias ?target])] "])
                alias-rows (js->clj alias-result :keywordize-keys true)
                aliased (into #{} (mapcat identity) alias-rows)
                reports (->> groups
                             (map #(classify-duplicate-title-group % own empty refs aliased))
                             (sort-by (juxt :rank (comp - count :members)))
                             vec)]
          {:normalize normalize
           :titles_examined (count candidates)
           :groups reports
           :diagnostic (str (count reports) " group(s) among " (count candidates)
                            " pages and tags. Ranked cheapest-certainty first; `alias` and `genuine_split` groups are NOT actionable and are ranked last. `block_refs` counts :block/refs ONLY -- tag holders and property values are inbound references too and are not counted here, so a 0 does not mean nothing points at the page; pageStats reports all three. Nothing here has been changed, and no classification is an instruction -- confirm a symptom in the Logseq UI before any write.")})))))

(defn list-tags
  [call-api-fn args]
  (call-api-fn "logseq.DB.listTags" [#js {:expand (aget args "expand")}]))

(defn list-properties
  [call-api-fn args]
  (call-api-fn "logseq.DB.listProperties" [#js {:expand (aget args "expand")}]))

(defn search-blocks
  [call-api-fn args]
  (call-api-fn "logseq.DB.search"
               [(aget args "searchTerm") #js {:enable-snippet? false}]))

(defn repair-links
  [api-fn args]
  (let [page-uuid (aget args "page_uuid")
        tags? (true? (aget args "include_tags"))
        create? (true? (aget args "create_missing"))
        page-cap (or (aget args "max_pages_to_create") 5)
        tag-cap (or (aget args "max_tags_to_create") 5)
        pattern #"\{\{(link|tag):([^}]+)\}\}"
        entity-query "[:find (pull ?entity [* {:block/refs [:block/uuid]} {:block/tags [:block/uuid]}]) . :in $ ?uuid :where [?entity :block/uuid ?uuid]]"]
    (when page-uuid (uuid-query-input page-uuid))
    (doseq [cap [page-cap tag-cap]]
      (when-not (and (number? cap) (js/Number.isInteger cap) (<= 0 cap 500))
        (throw (js/Error. "Creation caps must be integers between 0 and 500"))))
    (letfn [(resolve-names [remaining kind found missing ambiguous]
              (if-let [name (first remaining)]
                (p/let [result (api-fn "logseq.DB.datascriptQuery"
                                       ["[:find [(pull ?entity [:block/uuid :block/name :block/title :logseq.property/deleted-at {:block/tags [:db/ident]}]) ...] :in $ ?title :where [?entity :block/title ?title]]" name])
                        candidates (filterv (fn [entity]
                                              (and (not (recycled-entity? entity))
                                                   (some #(= (string/replace-first (str (:ident %)) #"^:" "")
                                                             (if (= kind "link") "logseq.class/Page" "logseq.class/Tag"))
                                                         (:tags entity))))
                                            (js->clj result :keywordize-keys true))]
                  (case (count candidates)
                    0 (resolve-names (rest remaining) kind found (conj missing name) ambiguous)
                    1 (resolve-names (rest remaining) kind (assoc found name (:uuid (first candidates))) missing ambiguous)
                    (resolve-names (rest remaining) kind found missing (conj ambiguous name))))
                (p/resolved {:resolved found :missing missing :ambiguous ambiguous})))
            (create-targets [remaining kind resolved created failures]
              (if-let [name (first remaining)]
                (p/let [outcome (-> (p/then (p/resolved nil)
                                           (fn [_] (if (= kind "link")
                                                     (create-page api-fn #js {"title" name})
                                                     (create-tag api-fn #js {"title" name}))))
                                   (p/catch (fn [error] {:verified false :diagnostic (.-message error)})))
                        refreshed (resolve-names [name] kind {} [] [])
                        uuid (get (:resolved refreshed) name)]
                  (if (and (:verified outcome) uuid)
                    (create-targets (rest remaining) kind (assoc resolved name uuid) (conj created {:name name :uuid uuid}) failures)
                    {:resolved resolved :created created :failures (conj failures {:name name :reason (:diagnostic outcome)})}))
                (p/resolved {:resolved resolved :created created :failures failures})))
            (rewrite [remaining links tags updated unverified]
              (if-let [block (first remaining)]
                (let [original (:title block)
                      matches (re-seq pattern original)
                      resolved (keep (fn [[_ kind name]]
                                       (when-let [uuid (get (if (= kind "link") links tags) name)] [kind uuid])) matches)
                      text (string/replace original pattern
                                           (fn [[full kind name]]
                                             (if-let [uuid (get (if (= kind "link") links tags) name)]
                                               (if (= kind "tag") (str "#[[" name "]]") (str "[[" uuid "]]")) full)))
                      normalized-text (string/replace original pattern
                                                      (fn [[full kind name]]
                                                        (if-let [uuid (get (if (= kind "link") links tags) name)]
                                                          (str (when (= kind "tag") "#") "[[" uuid "]]") full)))]
                  (if (= original text)
                    (rewrite (rest remaining) links tags updated unverified)
                    (p/let [outcome (-> (p/then (p/resolved nil)
                                               (fn [_] (update-block api-fn #js {"block_uuid" (:uuid block) "title" text})))
                                       (p/catch (fn [error] {:verified false :diagnostic (.-message error)})))
                            result (api-fn "logseq.DB.datascriptQuery" [entity-query (uuid-query-input (:uuid block))])
                            current (js->clj result :keywordize-keys true)
                            verified? (and (:verified outcome)
                                           (contains? #{text normalized-text} (:title current))
                                           (every? (fn [[kind uuid]]
                                                     (some #(= uuid (:uuid %)) (get current (if (= kind "link") :refs :tags)))) resolved))]
                      (rewrite (rest remaining) links tags (if verified? (inc updated) updated)
                               (cond-> unverified (not verified?) (conj {:uuid (:uuid block)
                                                                       :reason "Text and reference relations did not both verify."}))))))
                (p/resolved {:blocks_updated updated :unverified unverified})))]
      (p/let [context (when page-uuid (page-mutation-context api-fn page-uuid))
              scan-result (if context (clj->js (:blocks context))
                              (api-fn "logseq.DB.datascriptQuery"
                                      [(str "[:find [(pull ?block [:block/uuid :block/title {:block/page [:block/uuid]}]) ...] :where "
                                            "[?block :block/title ?title] [?block :block/page ?page] [?page :block/name _] "
                                            "(not [?page :logseq.property/deleted-at _]) (not [?block :block/name _]) "
                                            (if tags? "(or-join [?title] [(clojure.string/includes? ?title \"{{link:\")] [(clojure.string/includes? ?title \"{{tag:\")])"
                                                "[(clojure.string/includes? ?title \"{{link:\")]") "]")]))
              blocks (filterv #(and (string? (:title %))
                                    (some (fn [[_ kind _]] (or tags? (= kind "link"))) (re-seq pattern (:title %))))
                              (js->clj scan-result :keywordize-keys true))
              _ (when (> (count blocks) 1000) (throw (js/Error. "Repair exceeds the 1000-block limit; scope it to one page")))
              wanted (mapcat #(re-seq pattern (:title %)) blocks)
              link-names (sort (set (map #(nth % 2) (filter #(= "link" (second %)) wanted))))
              tag-names (if tags? (sort (set (map #(nth % 2) (filter #(= "tag" (second %)) wanted)))) [])
              links (resolve-names link-names "link" {} [] [])
              tags (resolve-names tag-names "tag" {} [] [])
              base {:pages_scanned (if page-uuid 1 (count (set (keep #(get-in % [:page :uuid]) blocks))))
                    :blocks_with_placeholders (count blocks)
                    :resolved (vec (sort (keys (:resolved links)))) :missing (:missing links) :ambiguous (:ambiguous links)
                    :tags_resolved (vec (sort (keys (:resolved tags)))) :tags_missing (:missing tags) :tags_ambiguous (:ambiguous tags)
                    :would_create (if create? (:missing links) []) :would_create_tags (if create? (:missing tags) [])}
              blocked? (and create?
                            (or (and (seq (:missing links)) (not (true? (aget args "acknowledge_page_creation"))))
                                (and (seq (:missing tags)) (not (true? (aget args "acknowledge_tag_creation"))))
                                (> (count (:missing links)) page-cap) (> (count (:missing tags)) tag-cap)))]
        (if (or blocked? (true? (aget args "dry_run")))
          (assoc base :verified false :blocks_updated 0
                 :diagnostic (if blocked? "Missing targets require separate page/tag creation acknowledgements and sufficient caps; no writes performed."
                                 "Dry run: no targets created and no blocks rewritten."))
          (p/let [new-links (create-targets (if create? (:missing links) []) "link" (:resolved links) [] [])
                  new-tags (if (seq (:failures new-links))
                             {:resolved (:resolved tags) :created [] :failures []}
                             (create-targets (if create? (:missing tags) []) "tag" (:resolved tags) [] []))
                  failures (into (:failures new-links) (:failures new-tags))
                  outcome (if (seq failures) {:blocks_updated 0 :unverified failures}
                              (rewrite blocks (:resolved new-links) (:resolved new-tags) 0 []))]
            (merge base outcome {:verified (empty? (:unverified outcome))
                                 :resolved (vec (sort (keys (:resolved new-links))))
                                 :tags_resolved (vec (sort (keys (:resolved new-tags))))
                                 :missing (vec (remove #(contains? (:resolved new-links) %) (:missing links)))
                                 :tags_missing (vec (remove #(contains? (:resolved new-tags) %) (:missing tags)))
                                 :created_pages (:created new-links) :created_tags (:created new-tags)
                                 :diagnostic "Unresolved or ambiguous placeholders remain unchanged. Inspect unverified writes before retrying."})))))))

(def ^:private capability-tool-routes
  {:listPages ["logseq.DB.listPages"]
  :listJournals ["logseq.DB.getJournalCandidates" "logseq.DB.datascriptQuery"]
   :getPage ["logseq.cli.getPageData"]
   :searchBlocks ["logseq.DB.search"]
   :listTags ["logseq.DB.listTags"]
   :listProperties ["logseq.DB.listProperties"]
   :getPageUUID ["logseq.DB.datascriptQuery"]
   :pageStats ["logseq.DB.getPageStats"]
   :inspectPage ["logseq.DB.inspectPage"]
   :getTagUUID ["logseq.DB.getTagsByName"]
   :creatTag ["logseq.DB.createTag"]
   :deleteTag ["logseq.DB.deletePage" "logseq.DB.datascriptQuery"]
   :addTag ["logseq.DB.addBlockTag" "logseq.DB.datascriptQuery"]
   :removeTag ["logseq.DB.removeBlockTag" "logseq.DB.datascriptQuery"]
   :createPage ["logseq.DB.datascriptQuery" "logseq.DB.createPage"]
   :renamePage ["logseq.DB.datascriptQuery" "logseq.DB.renamePage"]
   :createBlock ["logseq.DB.insertBlock" "logseq.DB.datascriptQuery"]
   :updateBlock ["logseq.DB.updateBlock" "logseq.DB.datascriptQuery"]
   :moveBlock ["logseq.DB.moveBlock" "logseq.DB.datascriptQuery"]
   :removeBlock ["logseq.DB.removeBlock" "logseq.DB.datascriptQuery"]
   :splitBlock ["logseq.DB.datascriptQuery" "logseq.DB.insertBlock" "logseq.DB.moveBlock" "logseq.DB.updateBlock"]
   :moveBlocks ["logseq.DB.datascriptQuery" "logseq.DB.moveBlock"]
   :migratePage ["logseq.DB.datascriptQuery" "logseq.DB.moveBlock"]
   :deletePage ["logseq.DB.datascriptQuery" "logseq.DB.deletePage"]
   :clearPage ["logseq.DB.datascriptQuery" "logseq.DB.removeBlock"]
   :retitleOverDuplicate ["logseq.DB.datascriptQuery" "logseq.DB.renamePage"]
   :createPageofBlocks ["logseq.DB.datascriptQuery" "logseq.DB.insertBatchBlock"]
   :importPage ["logseq.DB.datascriptQuery" "logseq.DB.createPage" "logseq.DB.insertBatchBlock" "logseq.DB.removeBlock"]
   :repairLinks ["logseq.DB.datascriptQuery" "logseq.DB.createPage" "logseq.DB.createTag" "logseq.DB.updateBlock"]
   :getTag ["logseq.DB.getTag"]
   :getTagUsers ["logseq.DB.getTagUsers"]
   :getPropertyIndent ["logseq.DB.getPropertiesByTitle"]
   :getBlock ["logseq.DB.getBlock"]
   :getBlockUUID ["logseq.DB.getPageBlockUUIDs"]
   :getBlockTree ["logseq.DB.getBlockTree"]
   :findBacklinks ["logseq.DB.getBacklinks"]
   :findOrphans ["logseq.DB.getPageBlockUUIDs"]
   :isTitleAvailable ["logseq.DB.getTitleHolders"]
   :findDuplicateTitles ["logseq.DB.getTitleInventory" "logseq.DB.datascriptQuery"]
   :getProperyUsers ["logseq.DB.datascriptQuery"]
   :createProperty ["logseq.DB.upsertProperty"]
   :removeProperty ["logseq.DB.datascriptQuery" "logseq.DB.removeBlockProperty"]
   :addProperty ["logseq.DB.datascriptQuery" "logseq.DB.upsertBlockProperty"]
   :deleteProperty ["logseq.DB.datascriptQuery"
              "logseq.DB.removeProperty"
              "logseq.DB.removeBlock"]
  :listRecycled ["logseq.DB.listRecycled"]
  :listStatus ["logseq.DB.getStatusRows"]
  :listClosedValues ["logseq.DB.getClosedValues"]
   :listOrphanTags ["logseq.DB.datascriptQuery"]
   :listOrphanProperties ["logseq.DB.getAllProperties" "logseq.DB.datascriptQuery"]
   :listAssets ["logseq.DB.datascriptQuery"]})

(def ^:private capability-probe-args
  {"logseq.DB.datascriptQuery" ["[:find ?e . :where [?e :block/uuid]]"]
   "logseq.DB.getBlock" ["__mcp_capability_probe__" #js {:includeChildren false :includePage true}]
   "logseq.DB.getTag" ["__mcp_capability_probe__"]
   "logseq.DB.getTagUsers" ["00000000-0000-4000-8000-000000000999"]
   "logseq.DB.inspectPage" ["00000000-0000-4000-8000-000000000999" "page"]
  "logseq.DB.getPageStats" ["00000000-0000-4000-8000-000000000999"]
  "logseq.DB.getPageBlockUUIDs" ["00000000-0000-4000-8000-000000000999"]
  "logseq.DB.getBlockTree" ["00000000-0000-4000-8000-000000000999" 20 1000]
  "logseq.DB.getBacklinks" ["00000000-0000-4000-8000-000000000999"]
  "logseq.DB.getTitleHolders" ["__mcp_capability_probe__"]
  "logseq.DB.getJournalCandidates" []
  "logseq.DB.listRecycled" []
  "logseq.DB.getStatusRows" []
  "logseq.DB.getClosedValues" []
  "logseq.DB.getPropertiesByTitle" ["__mcp_capability_probe__"]
   "logseq.DB.getTagsByName" ["__mcp_capability_probe__"]
   "logseq.DB.getAllProperties" []
   "logseq.DB.listPages" [#js {:expand false}]
   "logseq.DB.listTags" [#js {:expand false}]
   "logseq.DB.listProperties" [#js {:expand false}]
   "logseq.cli.getPageData" ["__mcp_capability_probe__"]
   "logseq.DB.upsertProperty" ["__mcp_capability_probe__/invalid" #js {}]
   "logseq.DB.createTag" ["__mcp_capability_probe__/invalid"]
   "logseq.DB.insertBlock" ["__mcp_capability_probe__" "__mcp_capability_probe__" #js {:sibling false}]
   "logseq.DB.insertBatchBlock" ["__mcp_capability_probe__" #js [] #js {}]
   "logseq.DB.renamePage" ["__mcp_capability_probe__" "__mcp_capability_probe__"]
   "logseq.DB.updateBlock" ["__mcp_capability_probe__" "__mcp_capability_probe__"]
   "logseq.DB.moveBlock" ["__mcp_capability_probe__" "__mcp_capability_probe__" #js {:before false}]
   "logseq.DB.deletePage" ["__mcp_capability_probe__"]
   "logseq.DB.addBlockTag" ["__mcp_capability_probe__" "__mcp_capability_probe__"]
   "logseq.DB.removeBlockTag" ["__mcp_capability_probe__" "__mcp_capability_probe__"]
   "logseq.DB.upsertBlockProperty" ["__mcp_capability_probe__"
                                    "__mcp_capability_probe__"
                                    "__mcp_capability_probe__"]
   "logseq.DB.removeBlockProperty" ["__mcp_capability_probe__" "__mcp_capability_probe__"]
   "logseq.DB.removeProperty" ["__mcp_capability_probe__"]
   "logseq.DB.removeBlock" ["__mcp_capability_probe__"]
  "logseq.DB.search" ["__mcp_capability_probe__" #js {:enable-snippet? false}]})

(def ^:private capability-absent-markers
  ["no method found" "unknown method" "not supported" "not implemented"
   "is not a function" "unsupported"])

(def ^:private capability-present-markers
  ["invalid" "missing required" "should be either" "disallowed"
  "expected" "required" "forward slash"
  "plugins can only upsert its own properties"])

(defn- capability-finding
  [method error-message result]
  (let [message (some-> error-message str string/lower-case)]
    (cond
      (and message (some #(string/includes? message %) capability-absent-markers))
      {:method method :state "unavailable" :basis "probed"
       :detail (subs (str error-message) 0 (min 200 (count (str error-message))))}

      (and message (some #(string/includes? message %) capability-present-markers))
      {:method method :state "available" :basis "probed"
       :detail "rejected probe arguments, so the method exists"}

      message
      {:method method :state "unknown" :basis "probed"
       :detail (str "unrecognised error: "
                    (subs (str error-message) 0 (min 200 (count (str error-message)))))}

      (nil? result)
      {:method method :state "unknown" :basis "probed"
       :detail "returned null for probe arguments; cannot distinguish a missing method from a silent no-op"}

      :else
      {:method method :state "available" :basis "probed" :detail "returned a result"})))

(defn- probe-capability-method
  [api-fn method]
  (if (= method "logseq.DB.createPage")
    (p/resolved {:method method
                 :state "unknown"
                 :basis "not-probed"
                 :detail "Skipped because probing createPage could create a graph page."})
    (-> (p/let [result (api-fn method (get capability-probe-args method))
                error-message (when (and result (object? result))
                                (or (aget result "error") (get result "error")))]
          (capability-finding method error-message result))
        (p/catch (fn [error]
                   (capability-finding method (.-message error) nil))))))

(defn- capability-tool-status
  [tool findings]
  (let [severity {"available" 0 "unknown" 1 "unavailable" 2}
        routes (get capability-tool-routes tool)
        statuses (mapv #(get findings % {:state "unknown"
                                         :detail "a required route was not probed"})
                       routes)
        worst (last (sort-by #(get severity (:state %) 1) statuses))]
    [tool (cond-> {:state (:state worst) :basis "inferred"}
            (and (not= "available" (:state worst)) (:detail worst))
            (assoc :detail (:detail worst)))]))

(defn capabilities
  [api-fn args]
  (p/let [info-result (api-fn "logseq.App.getAppInfo" [])
          graph-result (api-fn "logseq.App.checkCurrentIsDbGraph" [])
          info (js->clj info-result :keywordize-keys true)]
    (cond
      (not (true? (:supportDb info)))
      (p/rejected (js/Error. "Connected Logseq instance does not report DB support"))

      (not (true? graph-result))
      (p/rejected (js/Error. "The current Logseq graph is not a DB graph"))

      :else
    (p/let [probe-methods (->> capability-tool-routes vals (apply concat) distinct sort)
            findings (p/all (map #(probe-capability-method api-fn %) probe-methods))
            findings-by-method (into {} (map (juxt :method identity) findings))
                 tools (into (sorted-map)
                   (map (fn [[tool _routes]]
                     (capability-tool-status tool findings-by-method)))
                   (sort-by key capability-tool-routes))
            unavailable (->> tools (keep (fn [[tool status]]
                                           (when (= "unavailable" (:state status)) (name tool)))) sort vec)
            unknown (->> tools (keep (fn [[tool status]]
                                      (when (= "unknown" (:state status)) (name tool)))) sort vec)
            version (:version info)
            body {:graph {:version version
                          :verified_against "2.0.1"
                          :version_matches (= version "2.0.1")
                          :checked_at (/ (.now js/Date) 1000)}
                  :tools tools
                  :what_available_means "The route exists and responds. Probes send deliberately invalid arguments, so `available` establishes reachability, not that the route accepts a real payload."}
            body (cond-> body
                   (seq unavailable) (assoc :unavailable unavailable)
                   (seq unknown) (assoc :unknown unknown
                                        :note "`unknown` means the probe was inconclusive, not that the tool is unavailable. Try it and check the result.")
                   (not= version "2.0.1")
                   (assoc-in [:graph :caveat]
                             "This graph is not the version these tools were verified against; behaviour may differ.")
                   (true? (aget args "include_diagnostics"))
                   (assoc :diagnostics {:routes (into (sorted-map)
                                                      (map (fn [[tool routes]]
                                                             [(name tool) routes]))
                                                      capability-tool-routes)
                                        :method_findings (vec (sort-by :method findings))}))]
      body))))