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
      (empty? pages)
      {:found false :title title :page_uuid nil}

      (= 1 (count pages))
      {:found true
       :title title
       :page_uuid (or (:uuid (first pages))
                      (:block/uuid (first pages)))}

      :else
      {:found false
       :title title
       :page_uuid nil
       :reason (str (count pages) " pages share this title; use a UUID")
       :candidates (mapv #(or (:uuid %) (:block/uuid %)) pages)})))

(defn tag-uuid-result
  [title tags]
  (let [tags (vec tags)]
    (cond
      (empty? tags)
      {:found false :title title :tag_uuid nil}

      (= 1 (count tags))
      {:found true :title title :tag_uuid (:uuid (first tags))}

      :else
      {:found false
       :title title
       :tag_uuid nil
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
      (empty? properties)
      {:found false :title title :ident nil}

      (= 1 (count properties))
      {:found true
       :title title
       :ident (or (:ident (first properties))
                  (:db/ident (first properties)))
       :type (or (:type (first properties))
                 (:logseq.property/type (first properties)))}

      :else
      {:found false
       :title title
       :ident nil
       :reason (str (count properties) " properties share this title")
       :candidates (mapv #(or (:ident %) (:db/ident %)) properties)})))

(defn block-result
  [block-uuid blocks]
  (if-let [block (first blocks)]
    (if (or (:name block) (:block/name block))
      {:found false
       :block_uuid block-uuid
       :block nil
       :reason "target is a page, not a block"}
      {:found true :block_uuid block-uuid :block block})
    {:found false :block_uuid block-uuid :block nil}))

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
                (if (and (= 1 (count rows)) (vector? (first rows)))
                  (first rows)
                  rows)))))

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

(defn upsert-nodes
  [call-api-fn args]
  (call-api-fn "logseq.cli.upsertNodes"
               [(aget args "operations") #js {:dry-run (aget args "dry-run")}]))