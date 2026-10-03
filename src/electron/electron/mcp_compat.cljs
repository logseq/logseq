(ns electron.mcp-compat
  (:require [clojure.string :as string]
            [promesa.core :as p]))

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
                                :type (or (:type (first properties))
                                          (:logseq.property/type (first properties)))}
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
                              (recur (inc j) (conj row value)))))]
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
         structural-property-value? query-result-rows get-block-uuids)

    (defn inspect-page
      [api-fn args]
      (let [page-uuid (aget args "page_uuid")
      detail (or (aget args "detail") "page")]
        (when-not (and (string? page-uuid)
           (re-matches page-stats-uuid-pattern page-uuid))
          (throw (js/Error. "page_uuid must be a UUID")))
        (when-not (contains? page-details detail)
          (throw (js/Error. "detail must be one of: page, blocks, tags, properties, declared, all")))
        (let [page-query (str "[:find (pull ?entity [*]) . :where "
            "[?entity :block/uuid #uuid \"" page-uuid "\"]]")]
          (p/let [page-result (api-fn "logseq.DB.datascriptQuery" [page-query])
            page (js->clj page-result :keywordize-keys true)]
      (cond
        (nil? page)
        {:found false :page_uuid page-uuid :page nil}

        (not (page-stats-field page :name))
        {:found false :page_uuid page-uuid :page nil
         :reason "target is a block, not a page"}

        :else
        (let [page-id (page-stats-field page :id)
        with-blocks? (contains? #{"blocks" "all"} detail)
        with-tags? (contains? #{"tags" "all"} detail)
        with-properties? (contains? #{"properties" "all"} detail)
        with-declared? (contains? #{"declared" "all"} detail)]
          (p/let [blocks (when with-blocks?
               (get-block-uuids api-fn #js {"page_uuid" page-uuid}))
            tags-result (when with-tags?
              (api-fn "logseq.DB.datascriptQuery"
                ["[:find [(pull ?holder [:db/id :block/uuid :block/title :block/name {:block/tags [:db/id :db/ident :block/title]}]) ...] :in $ ?page :where (or-join [?page ?holder] [(identity ?page) ?holder] [?holder :block/page ?page]) [?holder :block/tags _]]" page-id]))
            property-class (when with-properties?
                 (api-fn "logseq.DB.datascriptQuery"
                   ["[:find ?class . :where [?class :db/ident :logseq.class/Property]]"]))
            property-rows-result (when with-properties?
                 (api-fn "logseq.DB.datascriptQuery"
                   ["[:find (pull ?prop [:db/id :db/ident :block/title]) (pull ?holder [:db/id :block/uuid :block/title :block/name]) ?value :in $ ?page ?class :where (or-join [?page ?holder] [(identity ?page) ?holder] [?holder :block/page ?page]) [?prop :block/tags ?class] [?prop :db/ident ?attr] [?holder ?attr ?value]]" page-id property-class]))
            declared-result (when with-declared?
                  (api-fn "logseq.DB.datascriptQuery"
                    ["[:find (pull ?class [:db/ident :block/title]) (pull ?prop [:db/id :db/ident :block/uuid :block/title :logseq.property/type]) :in $ ?page :where [?page :block/tags ?class] [?class :logseq.property.class/properties ?prop]]" page-id]))
            tags (when with-tags? (query-result-rows tags-result))
            properties (if with-properties?
             (let [rows (filterv #(and (vector? %) (= 3 (count %))
                     (not (structural-property-value? (first %))))
                     (js->clj property-rows-result :keywordize-keys true))
                   entity-ids (->> rows
                       (keep #(nth % 2))
                       (filter #(and (number? %) (not (boolean? %))))
                       set)
                   resolved-query "[:find [(pull ?e [:db/id :db/ident :block/title :logseq.property/value]) ...] :in $ [?e ...] :where [?e ?a _]]"]
               (p/let [resolved-result (if (seq entity-ids)
                       (api-fn "logseq.DB.datascriptQuery"
                         [resolved-query (clj->js (vec entity-ids))])
                       [])
                 resolved (into {}
                    (keep (fn [entity]
                      (let [id (page-stats-field entity :id)]
                        (when (some? id) [id entity]))))
                    (query-result-rows resolved-result))]
                 (mapv (fn [[property holder value]]
                   {:property property
                    :holder holder
                    :value value
                    :value_entity (when (and (number? value)
                           (not (boolean? value)))
                        (get resolved value))})
                 rows)))
             nil)
            declared (when with-declared?
                 (mapv (fn [[class property]]
                   {:class class :property property})
                 (js->clj declared-result :keywordize-keys true)))]
            (cond-> {:found true :page_uuid page-uuid :page page}
        with-blocks? (assoc :blocks blocks)
        with-tags? (assoc :tags tags)
        with-properties? (assoc :properties properties)
        with-declared? (assoc :declared_properties declared)))))))))
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
          (let [tag-uuid (aget args "tag_uuid")
            query "[:find [(pull ?tag [:block/uuid :block/title :block/name]) ...]
                 :in $ ?uuid
                 :where
                 [?tag :block/uuid ?uuid]
                 [?tag :block/tags ?class]
                 [?class :db/ident :logseq.class/Tag]]"]
            (p/let [result (api-fn "logseq.DB.datascriptQuery" [query tag-uuid])
            tags (js->clj result :keywordize-keys true)
            tags (if (and (= 1 (count tags)) (vector? (first tags)))
               (first tags)
               tags)]
          (tag-result tag-uuid tags))))

    (defn get-tag-users
      [api-fn args]
      (let [tag-uuid (aget args "tag_uuid")
            query "[:find [(pull ?holder [:block/uuid :block/title :block/name
                                           :block/page]) ...]
                     :in $ ?tag
                     :where [?holder :block/tags ?tag]]"]
        (p/let [result (api-fn "logseq.DB.datascriptQuery" [query tag-uuid])
                users (js->clj result :keywordize-keys true)]
          (if (and (= 1 (count users)) (vector? (first users)))
            (first users)
            users))))

    (defn get-block-uuids
      [api-fn args]
      (let [page-uuid (aget args "page_uuid")
            query "[:find ?uuid ?title ?order
                     :in $ ?page-uuid
                     :where
                     [?page :block/uuid ?page-uuid]
                     [?block :block/parent+ ?page]
                     [?block :block/uuid ?uuid]
                     [?block :block/title ?title]
                     [?block :block/order ?order]]"]
        (p/let [result (api-fn "logseq.DB.datascriptQuery" [query page-uuid])
                rows (js->clj result :keywordize-keys true)]
          (mapv (fn [[uuid title order]]
                  {:uuid uuid :title title :order order :page_uuid page-uuid})
          rows))))

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
              truncated* (atom false)]
          (letfn [(build [node depth]
                    (swap! count* inc)
                    (let [node' (dissoc node :parent_uuid)
                          child-rows (get children (:uuid node))]
                      (if (or (>= depth max-depth)
                              (>= @count* max-nodes))
                        (do
                          (when (seq child-rows) (reset! truncated* true))
                          (assoc node' :children []))
                        (assoc node' :children
                               (mapv #(if (< @count* max-nodes)
                                        (build % (inc depth))
                                        (do (reset! truncated* true) nil))
                                     child-rows)))))]
            {:found true
             :block_uuid block-uuid
             :block (build root 0)
             :node_count @count*
             :truncated @truncated*}))))

    (defn get-block-tree
      [api-fn args]
      (let [block-uuid (aget args "block_uuid")
            max-depth (or (aget args "max_depth") 20)
            max-nodes (or (aget args "max_nodes") 1000)
            root-query "[:find [(pull ?root [:block/uuid :block/title :block/name :block/order]) ...]
                          :in $ ?uuid
                          :where [?root :block/uuid ?uuid]]"
            descendants-query "[:find ?uuid ?title ?order ?parent-uuid
                                  :in $ ?root-uuid
                                  :where
                                  [?root :block/uuid ?root-uuid]
                                  [?block :block/parent+ ?root]
                                  [?block :block/uuid ?uuid]
                                  [?block :block/title ?title]
                                  [?block :block/order ?order]
                                  [?block :block/parent ?parent]
                                  [?parent :block/uuid ?parent-uuid]]"]
        (p/let [root-result (api-fn "logseq.DB.datascriptQuery" [root-query block-uuid])
                descendants-result (api-fn "logseq.DB.datascriptQuery"
                                           [descendants-query block-uuid])
                roots (js->clj root-result :keywordize-keys true)
                rows (js->clj descendants-result :keywordize-keys true)
                roots (if (and (= 1 (count roots)) (vector? (first roots)))
                        (first roots)
                        roots)
                rows (if (and (= 1 (count rows)) (vector? (first rows)))
                       (first rows)
                       rows)
                root (first roots)
                rows (mapv (fn [[uuid title order parent-uuid]]
                             {:uuid uuid :title title :order order
                              :parent_uuid parent-uuid}) rows)]
          (block-tree-result block-uuid root rows max-depth max-nodes))))

        (defn find-backlinks
          [api-fn args]
          (let [target-uuid (aget args "target_uuid")
            holder "[:block/uuid :block/title :block/name :block/page]"
            refs-query (str "[:find [(pull ?entity " holder ") ...] :in $ ?target"
                " :where [?entity :block/refs ?target]]")
            tags-query (str "[:find [(pull ?entity " holder ") ...] :in $ ?target"
                " :where [?entity :block/tags ?target]]")
            values-query (str "[:find (pull ?entity " holder ") "
                  "(pull ?property [:db/ident :block/title]) "
                  ":in $ ?target :where "
                  "[?property :db/ident ?attribute] "
                  "[?entity ?attribute ?target]]")]
            (p/let [refs-result (api-fn "logseq.DB.datascriptQuery" [refs-query target-uuid])
            tags-result (api-fn "logseq.DB.datascriptQuery" [tags-query target-uuid])
            values-result (api-fn "logseq.DB.datascriptQuery" [values-query target-uuid])
            refs (js->clj refs-result :keywordize-keys true)
            tagged (js->clj tags-result :keywordize-keys true)
            values (js->clj values-result :keywordize-keys true)
            refs (if (and (= 1 (count refs)) (vector? (first refs))) (first refs) refs)
            tagged (if (and (= 1 (count tagged)) (vector? (first tagged))) (first tagged) tagged)
            values (if (and (= 1 (count values)) (vector? (first values))) (first values) values)
            property-values (mapv (fn [[holder property]]
                    {:holder holder :property property}) values)
            total (+ (count refs) (count tagged) (count property-values))]
          {:target_uuid target-uuid
           :total total
           :refs refs
           :tagged tagged
           :property_values property-values
           :diagnostic (if (pos? total)
                 (str (count refs) " reference(s), "
                  (count tagged) " tag holder(s), "
                  (count property-values) " property value(s).")
                 "Nothing refers to this entity.")})))

(defn find-orphans
  [api-fn args]
  (let [page-uuid (aget args "page_uuid")
        query "[:find [(pull ?block [:block/uuid :block/title :block/page
                                      :block/parent :block/order]) ...]
                 :in $ ?page-uuid
                 :where
                 [?page :block/uuid ?page-uuid]
                 [?block :block/parent+ ?page]
                 [?block :block/page ?stored-page]
                 (not [?stored-page :block/uuid ?page-uuid])]" ]
    (p/let [result (api-fn "logseq.DB.datascriptQuery" [query page-uuid])
            rows (js->clj result :keywordize-keys true)
            rows (if (and (= 1 (count rows)) (vector? (first rows)))
                   (first rows)
                   rows)]
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

(defn- page-stats-subtree
  [tree root-id]
  (let [own (atom 0)
        nested (atom 0)
        orphans (atom 0)]
    (letfn [(walk [node expected-page]
              (doseq [child (or (page-stats-field node :_parent) [])]
                (let [child-id (page-stats-field child :id)
                      page (page-stats-field child :page)
                      page-id (if (map? page) (page-stats-field page :id) page)]
                  (if (page-stats-field child :name)
                    (do
                      (swap! nested inc)
                      (walk child child-id))
                    (do
                      (if (= page-id expected-page)
                        (swap! own inc)
                        (swap! orphans inc))
                      (walk child expected-page))))))]
      (walk tree root-id)
      {:own @own :nested @nested :orphans @orphans})))

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
    (let [entity-query (str "[:find (pull ?entity [*]) . :where "
                            "[?entity :block/uuid #uuid \"" page-uuid "\"]]")]
      (p/let [entity-result (api-fn "logseq.DB.datascriptQuery" [entity-query])
              page (js->clj entity-result :keywordize-keys true)]
        (when-not page
          (throw (js/Error. (str "No entity exists with exact UUID " page-uuid))))
        (when-not (page-stats-field page :name)
          (throw (js/Error. "UUID identifies a block, not a page")))
        (let [page-id (page-stats-field page :id)
              tree-query (str "[:find (pull ?root [:db/id :block/uuid :block/title :block/name "
                               "{:block/page [:db/id]} {:block/_parent ...}]) . :where "
                               "[?root :block/uuid #uuid \"" page-uuid "\"]]")
              aliases-by-query "[:find [(pull ?holder [:db/id :block/uuid :block/title :block/name]) ...] :in $ ?target :where (or-join [?holder ?target] [?holder :logseq.property/alias ?target] [?holder :block/alias ?target])]"
              aliases-query "[:find [(pull ?alias [:db/id :block/uuid :block/title :block/name]) ...] :in $ ?page :where (or-join [?page ?alias] [?page :logseq.property/alias ?alias] [?page :block/alias ?alias])]"
              property-values-query "[:find (pull ?prop [:db/ident]) ?e :in $ ?target ?class :where [?prop :block/tags ?class] [?prop :db/ident ?attr] [?e ?attr ?target]]"]
          (p/let [tree-result (api-fn "logseq.DB.datascriptQuery" [tree-query])
                  aliases-by-result (api-fn "logseq.DB.datascriptQuery"
                                            [aliases-by-query page-id])
                  aliases-result (api-fn "logseq.DB.datascriptQuery"
                                         [aliases-query page-id])
                  by-page-result (api-fn "logseq.DB.datascriptQuery"
                                         ["[:find (count ?b) . :in $ ?page :where [?b :block/page ?page]]" page-id])
                  empty-result (api-fn "logseq.DB.datascriptQuery"
                                       ["[:find (count ?b) . :in $ ?page :where [?b :block/page ?page] [?b :block/title \"\"]" page-id])
                  refs-result (api-fn "logseq.DB.datascriptQuery"
                                      ["[:find (count ?e) . :in $ ?target :where [?e :block/refs ?target]]" page-id])
                  tag-holders-result (api-fn "logseq.DB.datascriptQuery"
                                             ["[:find (count ?e) . :in $ ?target :where [?e :block/tags ?target]]" page-id])
                  property-class-result (api-fn "logseq.DB.datascriptQuery"
                                                ["[:find ?class . :where [?class :db/ident :logseq.class/Property]]"])
                  property-values-result (api-fn "logseq.DB.datascriptQuery"
                                                 [property-values-query page-id property-class-result])]
            (let [{:keys [own nested orphans]}
                  (page-stats-subtree (js->clj tree-result :keywordize-keys true) page-id)
                  aliases (js->clj aliases-result :keywordize-keys true)
                  aliased-by (js->clj aliases-by-result :keywordize-keys true)
                  alias-uuids (vec (keep #(page-stats-field % :uuid) aliases))
                  alias-of (vec (keep #(page-stats-field % :uuid) aliased-by))
                  by-page (if (number? by-page-result) by-page-result 0)
                  empty-count (if (number? empty-result) empty-result 0)
                  refs (if (number? refs-result) refs-result 0)
                  tag-holders (if (number? tag-holders-result) tag-holders-result 0)
                  value-rows (js->clj property-values-result :keywordize-keys true)
                  property-values (count (remove #(structural-property-value? (first %)) value-rows))
                  counts-note (str (- by-page empty-count) " block(s) with content, "
                                   by-page " own block(s) including " empty-count " empty, "
                                   nested " nested page(s), "
                                   (+ refs tag-holders property-values) " inbound reference(s)"
                                   (when (pos? orphans)
                                     (str ", " orphans " ORPHANED block(s)"))
                                   (when (pos? empty-count)
                                     ". content_blocks is the figure to pair with the reference count when judging whether a page is empty; own_blocks counts the empty block createPage seeds and so is never 0 on a page that was created through this API"))
                  alias-note (when (or (seq alias-of) (seq alias-uuids))
                               (str "ALIAS RELATION: this page "
                                    (string/join " and "
                                      (remove nil? [(when (seq alias-of)
                                                      (str "is an alias of " (count alias-of) " page(s)"))
                                                    (when (seq alias-uuids)
                                                      (str "declares " (count alias-uuids) " alias(es)"))]))
                                    ". Deleting either side breaks resolution, and `alias` is a built-in property outside this server's writable namespace, so it cannot be restored afterwards. An empty page in an alias relation is NOT a dead stub."
                                    (when (> (count alias-of) 1)
                                      " More than one page claims this one as an alias, which is itself irregular -- read both before touching either.")))
                  diagnostic (str (string/replace counts-note #"\.?$" ".")
                                  (when alias-note (str " " alias-note)))]
              {:page_uuid page-uuid
               :title (page-stats-field page :title)
               :own_blocks by-page
               :empty_blocks empty-count
               :content_blocks (- by-page empty-count)
               :subtree_blocks (+ own nested orphans)
               :nested_pages nested
               :true_orphans orphans
               :refs refs
               :tag_holders tag-holders
               :property_values property-values
               :is_alias_of (first alias-of)
               :aliases alias-uuids
               :diagnostic diagnostic})))))))

(defn title-holder-kind
  [entity]
  (let [idents (set (keep #(or (:ident %) (:db/ident %))
                          (or (:tags entity) (:block/tags entity) [])))]
    (cond
      (or (:name entity) (:block/name entity)) "page"
      (contains? idents :logseq.class/Property) "property"
      (contains? idents :logseq.class/Tag) "tag"
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
  (let [title (aget args "title")
        query "[:find [(pull ?entity [:block/uuid :block/title :block/name :db/ident
                                       :block/tags :logseq.property/deleted-at
                                       {:block/tags [:db/ident]}]) ...]
                 :in $ ?title
                 :where [?entity :block/title ?title]]"]
    (p/let [result (api-fn "logseq.DB.datascriptQuery" [query title])
            entities (js->clj result :keywordize-keys true)
            entities (if (and (= 1 (count entities))
                              (vector? (first entities)))
                       (first entities)
                       entities)]
      (title-availability-result title entities))))

(defn list-recycled
  [api-fn _args]
  (let [query "[:find [(pull ?page [:block/uuid :block/name :block/title
                                      :logseq.property/deleted-at]) ...]
                 :where [?page :logseq.property/deleted-at _]]"]
    (p/let [result (api-fn "logseq.DB.datascriptQuery" [query])
            pages (js->clj result :keywordize-keys true)]
      (if (and (= 1 (count pages)) (vector? (first pages)))
        (first pages)
        pages))))

(defn list-status
  [api-fn _args]
  (let [query "[:find (pull ?entity [:block/uuid :block/title :block/name
                                       :block/page])
                      (pull ?value [:db/ident :block/title])
                 :where [?entity :logseq.property/status ?value]]"]
    (p/let [result (api-fn "logseq.DB.datascriptQuery" [query])
            rows (js->clj result :keywordize-keys true)]
      (if (and (= 1 (count rows)) (vector? (first rows)))
        (first rows)
        rows))))

(defn list-closed-values
  [api-fn _args]
  (let [query "[:find (pull ?property [:db/ident :block/title])
                      (pull ?value [:db/ident :block/title :block/order])
                 :where [?value :block/closed-value-property ?property]]"]
    (p/let [result (api-fn "logseq.DB.datascriptQuery" [query])
            rows (js->clj result :keywordize-keys true)]
      (if (and (= 1 (count rows)) (vector? (first rows)))
        (first rows)
        rows))))

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
                    :type (:logseq.property/type entry)})))
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
      (let [title (aget args "title")
            query "[:find [(pull ?property [:db/ident :block/title :logseq.property/type]) ...]
                     :in $ ?title
                     :where
                     [?property :block/title ?title]
                     [?property :block/tags ?class]
                     [?class :db/ident :logseq.class/Property]]"]
        (p/let [result (api-fn "logseq.DB.datascriptQuery" [query title])
                properties (js->clj result :keywordize-keys true)
                properties (if (and (= 1 (count properties))
                                    (vector? (first properties)))
                             (first properties)
                             properties)]
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
                  actual-type (or (:logseq.property/type property) (:type property))
                  actual-type (if (keyword? actual-type) (name actual-type) actual-type)]
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

                            (or (:db/cardinality property) (:cardinality property))
                            (conj (str "cardinality is "
                                       (or (:db/cardinality property) (:cardinality property))))

                            (:db/valueType property)
                            (conj (str "values are stored as " (:db/valueType property)
                                       " -- a write supplies a literal and Logseq mints the value entity")))
                    diagnostic (when (seq notes) (string/join "; " notes))]
                (if verbose?
                  {:response response-map
                   :verified_state property
                   :recovered_after_timeout false
                   :previous_state nil
                   :diagnostic diagnostic
                   :verified true
                   :observed_state nil}
                  (merge {:verified true
                          :ident ident
                          :diagnostic diagnostic}
                     (property-digest property)))))))))))

(defn- sweep-property-value-blocks
  [api-fn block-uuids]
  (reduce (fn [remaining-p block-uuid]
            (p/let [remaining remaining-p
                    left (-> (p/let [_ (api-fn "logseq.DB.removeBlock" [block-uuid])
                                     entity (api-fn "logseq.DB.datascriptQuery"
                                                    ["[:find ?e . :in $ ?uuid :where [?e :block/uuid ?uuid]]"
                                                     block-uuid])]
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
                       resolved (or (:logseq.property/value entity)
                                    (:value entity)
                                    (:title entity))]
                   (cond-> []
                     (some? value-id) (conj value-id)
                     (some? resolved) (conj resolved)
                     (nil? value-id) (conj value))))
               held)))))

(defn- property-entity-value
  [entity ident]
  (let [bare-ident (subs ident 1)]
    (some (fn [[key value]]
            (when (= bare-ident (string/replace-first (str key) #"^:+" ""))
              value))
          entity)))

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
                      (p/let [block-result (api-fn "logseq.DB.datascriptQuery" [block-query block-uuid])
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
      (p/let [previous-result (api-fn "logseq.DB.datascriptQuery" [query block-uuid])
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
                  current-result (api-fn "logseq.DB.datascriptQuery" [query block-uuid])
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
    (p/let [source-result (api-fn "logseq.DB.datascriptQuery" [entity-query block-uuid])
            source (js->clj source-result :keywordize-keys true)]
      (when-not source
        (throw (js/Error. (str "No entity exists with exact UUID " block-uuid))))
      (when (or (:name source) (:block/name source))
        (throw (js/Error. "UUID identifies a page, not a block")))
      (p/let [target-result (api-fn "logseq.DB.datascriptQuery" [entity-query target-uuid])
              target (js->clj target-result :keywordize-keys true)]
        (when-not target
          (throw (js/Error. (str "No entity exists with exact UUID " target-uuid))))
        (when (= (:id source) (:id target))
          (throw (js/Error. "A block cannot be moved relative to itself")))
        (when (and (contains? #{"before" "after"} placement)
                   (or (:name target) (:block/name target)))
          (throw (js/Error. "A page has no siblings; use child or last-child")))
        (let [descendants-query "[:find ?uuid :in $ ?root-uuid :where [?root :block/uuid ?root-uuid] [?descendant :block/parent+ ?root] [?descendant :block/uuid ?uuid]]"]
          (p/let [descendants-result (api-fn "logseq.DB.datascriptQuery" [descendants-query block-uuid])
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
                  children-query "[:find (pull ?child [:db/id :block/uuid :block/order]) ...] :in $ ?parent-uuid :where [?parent :block/uuid ?parent-uuid] [?child :block/parent ?parent]]"]
              (when-not (and expected-parent expected-page)
                (throw (js/Error. "The target is missing the parent or page needed for placement")))
              (p/let [before-result (if (= placement "last-child")
                                      (api-fn "logseq.DB.datascriptQuery" [children-query target-uuid])
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
                (if source-already-last?
                  {:verified true
                   :diagnostic "No move was needed: the block is already the last child of the target."
                   :previous_entities [source] :verified_entities [source]}
                  (p/let [response (api-fn "logseq.DB.moveBlock" [block-uuid anchor-uuid options])
                          current-result (api-fn "logseq.DB.datascriptQuery" [entity-query block-uuid])
                          current (js->clj current-result :keywordize-keys true)
                          descendants-after-result
                          (api-fn "logseq.DB.datascriptQuery"
                                  ["[:find (pull ?descendant [:db/id :block/uuid {:block/page [:db/id]}]) ...] :in $ ?root-uuid :where [?root :block/uuid ?root-uuid] [?descendant :block/parent+ ?root]]"
                                   block-uuid])
                          descendants-after (js->clj descendants-after-result :keywordize-keys true)
                          stranded? (some #(not= expected-page
                                                 (entity-ref-id (or (:page %) (:block/page %))))
                                          descendants-after)
                          after-result (if (= placement "last-child")
                                         (api-fn "logseq.DB.datascriptQuery" [children-query target-uuid])
                                         [])
                          after-children (sort-by #(str (or (:order %) (:block/order %)))
                                                  (js->clj after-result :keywordize-keys true))
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

                      stranded?
                      {:response response :verified false :verified_entities [current]
                       :previous_entities [source] :observed_entities descendants-after
                       :diagnostic "The block moved but one or more descendants still belong to the old page"}

                      (and (= placement "last-child")
                           (not= block-uuid (or (:uuid (last after-children))
                                                (:block/uuid (last after-children)))))
                      {:response response :verified false :verified_entities [current]
                       :previous_entities [source]
                       :diagnostic "The block is under the requested parent but is not the last child"}

                      verbose?
                      {:response response :verified true :verified_entities [current]
                       :previous_entities [source] :diagnostic nil}

                      :else
                      (merge {:response response :verified true :diagnostic nil :previous_count 1}
                         (entity-write-digest current)))))))))))))

(defn remove-block
  [api-fn args]
  (let [block-uuid (aget args "block_uuid")
        verbose? (not (false? (aget args "verbose")))
        entity-query "[:find (pull ?entity [:db/id :block/uuid :block/title :block/name :block/order {:block/parent [:db/id :block/uuid]} {:block/page [:db/id :block/uuid]}]) . :in $ ?uuid :where [?entity :block/uuid ?uuid]]"
        children-query "[:find [(pull ?child [*]) ...] :in $ ?parent-id :where [?child :block/parent ?parent-id]]"]
    (when-not (and (string? block-uuid)
                   (re-matches page-stats-uuid-pattern block-uuid))
      (throw (js/Error. "block_uuid must be a UUID")))
    (p/let [root-result (api-fn "logseq.DB.datascriptQuery" [entity-query block-uuid])
            root (js->clj root-result :keywordize-keys true)]
      (when-not root
        (throw (js/Error. (str "No entity exists with exact UUID " block-uuid))))
      (when (or (:name root) (:block/name root))
        (throw (js/Error. "UUID identifies a page, not a block")))
      (when-not (and (or (:id root) (:db/id root))
                     (entity-ref-id (or (:parent root) (:block/parent root)))
                     (entity-ref-id (or (:page root) (:block/page root))))
        (throw (js/Error. "The block is missing required id, parent, or page data")))
      (p/let [subtree (loop [queue [root], collected [root]]
                        (if-let [parent (first queue)]
                          (p/let [children-result
                                  (api-fn "logseq.DB.datascriptQuery"
                                          [children-query (or (:id parent) (:db/id parent))])
                                  children (js->clj children-result :keywordize-keys true)
                                  collected (into collected children)]
                            (when (> (count collected) 1000)
                              (throw (js/Error. "Subtree exceeds the 1000-block safety limit")))
                            (recur (into (subvec queue 1) children) collected))
                          (p/resolved collected)))
              response (api-fn "logseq.DB.removeBlock" [block-uuid])
              remaining (loop [entities subtree, found []]
                          (if-let [entity (first entities)]
                            (p/let [result (api-fn "logseq.DB.datascriptQuery"
                                                  [entity-query (:uuid entity)])
                                    current (js->clj result :keywordize-keys true)]
                              (recur (rest entities) (cond-> found current (conj current))))
                            (p/resolved found)))
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
            verbose? (assoc :previous_entities subtree))))))

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
                                          [by-uuid-query created-uuid])
                                  nil)
                    page-from-uuid (js->clj page-result :keywordize-keys true)
                    page (or page-from-uuid
                             (first (query-pages api-fn page-title-query title)))]
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
      (p/let [page-result (api-fn "logseq.DB.datascriptQuery" [page-query page-uuid])
              page (js->clj page-result :keywordize-keys true)
              availability (is-title-available api-fn #js {"title" new-title})
              clashes (remove #(= page-uuid (or (:uuid %) (:block/uuid %)))
                              (:held_by availability))]
        (when-not page
          (throw (js/Error. (str "No live page exists with exact UUID " page-uuid))))
        (when (:logseq.property/deleted-at page)
          (throw (js/Error. (str "Page " page-uuid " is recycled and cannot be renamed"))))
        (when (seq clashes)
          (throw (js/Error. (str "An entity titled " (pr-str new-title)
                                 " already exists; renaming onto it would make the two indistinguishable"))))
        (p/let [response (api-fn "logseq.DB.renamePage" [page-uuid new-title])]
          (when-let [error (and response (aget response "error"))]
            (throw (js/Error. (str error))))
          (p/let [current-result (api-fn "logseq.DB.datascriptQuery" [page-query page-uuid])
                  current (js->clj current-result :keywordize-keys true)]
            (cond
              (or (nil? current) (not= new-title (or (:title current) (:block/title current)))
                  (not (or (:name current) (:block/name current)))
                  (some? (:logseq.property/deleted-at current)))
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
        (let [type (or (:logseq.property/type property) (:type property))
              type (if (keyword? type) (name type) type)
              value-id (property-value-id value)]
          (when (and (contains? reference-property-types type)
                     (not (valid-reference-property-value? value)))
            (throw (js/Error. (str ident " is a " (pr-str type)
                                   " property, so its value must be an entity id"))))
          (let [many? (string/ends-with? (str (:db/cardinality property)
                                               (:cardinality property)) "/many")
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
  (let [block-uuid (aget args "block_uuid")
        query "[:find [(pull ?block [:block/uuid :block/title :block/name
                                      :block/page :block/parent]) ...]
                 :in $ ?uuid
                 :where [?block :block/uuid ?uuid]]"]
    (p/let [result (api-fn "logseq.DB.datascriptQuery" [query block-uuid])
            blocks (js->clj result :keywordize-keys true)
            blocks (if (and (= 1 (count blocks))
                            (vector? (first blocks)))
                     (first blocks)
                     blocks)]
      (block-result block-uuid blocks))))
(defn list-pages
  [call-api-fn args]
  (call-api-fn "logseq.cli.listPages" [#js {:expand (aget args "expand")}]))

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
              (p/let [tag-result (api-fn "logseq.DB.datascriptQuery" [tag-query tag-uuid])
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
      (p/let [tag-result (api-fn "logseq.DB.datascriptQuery" [tag-query tag-uuid])
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
                                                 [tag-query tag-uuid])
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
              tag-result (api-fn "logseq.DB.datascriptQuery" [tag-query tag-uuid tag-class])
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
              tag-result (api-fn "logseq.DB.datascriptQuery" [tag-query tag-uuid tag-class])
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
    (p/let [result (api-fn "logseq.DB.datascriptQuery"
                           ["[:find [(pull ?page [:db/id :block/uuid :block/name :block/title :block/journal-day]) ...] :where [?page :block/journal-day _]]"])
            journals (->> (query-result-rows result)
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
    (p/let [page-class (api-fn "logseq.DB.datascriptQuery"
                               ["[:find ?class . :where [?class :db/ident :logseq.class/Page]]"])
            tag-class (api-fn "logseq.DB.datascriptQuery"
                              ["[:find ?class . :where [?class :db/ident :logseq.class/Tag]]"])
            inventory-result (api-fn "logseq.DB.datascriptQuery"
                                     ["[:find [(pull ?e [:db/id :block/uuid :block/title :block/name :logseq.property/deleted-at {:block/tags [:db/id]}]) ...] :in $ [?class ...] :where [?e :block/tags ?class]]"
                                      #js [page-class tag-class]])
            inventory (query-result-rows inventory-result)
            candidates (->> inventory
                            (keep (fn [entity]
                                    (let [title (or (:title entity) (:block/title entity))
                                          deleted-at (or (:logseq.property/deleted-at entity)
                                                         (:deleted-at entity))
                                          recycled? (some? deleted-at)
                                          id (or (:id entity) (:db/id entity))
                                          class-ids (set (keep #(or (:id %) (:db/id %))
                                                               (or (:tags entity) (:block/tags entity))))]
                                      (when (and (map? entity) (seq title) id
                                                 (or include-recycled? (not recycled?)))
                                        {:id id
                                         :uuid (or (:uuid entity) (:block/uuid entity))
                                         :title title
                                         :kind (if (contains? class-ids tag-class) "tag" "page")
                                         :recycled (boolean recycled?)}))))
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
  (call-api-fn "logseq.cli.listTags" [#js {:expand (aget args "expand")}]))

(defn list-properties
  [call-api-fn args]
  (call-api-fn "logseq.cli.listProperties" [#js {:expand (aget args "expand")}]))

(defn search-blocks
  [call-api-fn args]
  (call-api-fn "logseq.app.search"
               [(aget args "searchTerm") #js {:enable-snippet? false}]))

(def ^:private capability-tool-routes
  {:listPages ["logseq.cli.listPages"]
   :listJournals ["logseq.DB.datascriptQuery"]
   :getPage ["logseq.cli.getPageData"]
   :searchBlocks ["logseq.app.search"]
   :listTags ["logseq.cli.listTags"]
   :listProperties ["logseq.cli.listProperties"]
   :getPageUUID ["logseq.DB.datascriptQuery"]
   :pageStats ["logseq.DB.datascriptQuery"]
   :inspectPage ["logseq.DB.datascriptQuery"]
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
   :getTag ["logseq.DB.datascriptQuery"]
   :getPropertyIndent ["logseq.DB.datascriptQuery"]
   :getBlock ["logseq.DB.datascriptQuery"]
   :getTagUsers ["logseq.DB.datascriptQuery"]
   :getBlockUUID ["logseq.DB.datascriptQuery"]
   :getBlockTree ["logseq.DB.datascriptQuery"]
   :findBacklinks ["logseq.DB.datascriptQuery"]
   :findOrphans ["logseq.DB.datascriptQuery"]
   :isTitleAvailable ["logseq.DB.datascriptQuery"]
   :findDuplicateTitles ["logseq.DB.datascriptQuery"]
   :getProperyUsers ["logseq.DB.datascriptQuery"]
   :createProperty ["logseq.DB.upsertProperty"]
   :removeProperty ["logseq.DB.datascriptQuery" "logseq.DB.removeBlockProperty"]
   :addProperty ["logseq.DB.datascriptQuery" "logseq.DB.upsertBlockProperty"]
   :deleteProperty ["logseq.DB.datascriptQuery"
              "logseq.DB.removeProperty"
              "logseq.DB.removeBlock"]
   :listRecycled ["logseq.DB.datascriptQuery"]
   :listStatus ["logseq.DB.datascriptQuery"]
   :listClosedValues ["logseq.DB.datascriptQuery"]
   :listOrphanTags ["logseq.DB.datascriptQuery"]
   :listOrphanProperties ["logseq.DB.getAllProperties" "logseq.DB.datascriptQuery"]
   :listAssets ["logseq.DB.datascriptQuery"]})

(def ^:private capability-probe-args
  {"logseq.DB.datascriptQuery" ["[:find ?e . :where [?e :block/uuid]]"]
   "logseq.DB.getTagsByName" ["__mcp_capability_probe__"]
   "logseq.DB.getAllProperties" []
   "logseq.cli.listPages" [#js {}]
   "logseq.cli.listTags" [#js {}]
   "logseq.cli.listProperties" [#js {}]
   "logseq.cli.getPageData" ["__mcp_capability_probe__"]
   "logseq.DB.upsertProperty" ["__mcp_capability_probe__/invalid" #js {}]
   "logseq.DB.createTag" ["__mcp_capability_probe__/invalid"]
   "logseq.DB.insertBlock" ["__mcp_capability_probe__" "__mcp_capability_probe__" #js {:sibling false}]
   "logseq.DB.renamePage" ["__mcp_capability_probe__" "__mcp_capability_probe__"]
   "logseq.DB.updateBlock" ["__mcp_capability_probe__" "__mcp_capability_probe__"]
  "logseq.DB.moveBlock" ["__mcp_capability_probe__" "__mcp_capability_probe__" #js {:before false}]
  "logseq.DB.removeBlock" ["__mcp_capability_probe__"]
   "logseq.DB.deletePage" ["__mcp_capability_probe__"]
   "logseq.DB.addBlockTag" ["__mcp_capability_probe__" "__mcp_capability_probe__"]
   "logseq.DB.removeBlockTag" ["__mcp_capability_probe__" "__mcp_capability_probe__"]
   "logseq.DB.upsertBlockProperty" ["__mcp_capability_probe__"
                                    "__mcp_capability_probe__"
                                    "__mcp_capability_probe__"]
   "logseq.DB.removeBlockProperty" ["__mcp_capability_probe__" "__mcp_capability_probe__"]
   "logseq.DB.removeProperty" ["__mcp_capability_probe__"]
   "logseq.DB.removeBlock" ["__mcp_capability_probe__"]
   "logseq.app.search" ["__mcp_capability_probe__" #js {:enable-snippet? false}]})

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
    (when-not (true? (:supportDb info))
      (throw (js/Error. "Connected Logseq instance does not report DB support")))
    (when-not (true? graph-result)
      (throw (js/Error. "The current Logseq graph is not a DB graph")))
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
      body)))