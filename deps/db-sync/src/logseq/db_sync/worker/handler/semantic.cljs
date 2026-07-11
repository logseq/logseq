(ns logseq.db-sync.worker.handler.semantic
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.storage :as storage]
            [logseq.db-sync.worker.asset-link :as asset-link]
            [logseq.db-sync.worker.http :as http]
            [logseq.db-sync.worker.ws :as ws]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.db :as db-db]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.property :as outliner-property]
            [logseq.outliner.tree :as otree]
            [promesa.core :as p]))

(def ^:private default-limit 50)
(def ^:private max-limit 200)

(defn- ensure-conn! [^js self]
  (when-not (true? (.-schema-ready self))
    (storage/init-schema! (.-sql self))
    (set! (.-schema-ready self) true))
  (when-not (.-conn self)
    (set! (.-conn self) (storage/open-conn (.-sql self))))
  (.-conn self))

(defn- uuid-string [value]
  (when value (str value)))

(defn- page? [entity]
  (or (ldb/internal-page? entity) (ldb/journal? entity)))

(defn- asset? [entity]
  (string? (:logseq.property.asset/type entity)))

(defn- entity-ident [entity]
  (when-let [ident (:db/ident entity)]
    (str (namespace ident) "/" (name ident))))

(defn- tag? [entity]
  (ldb/class? entity))

(defn- property? [entity]
  (ldb/property? entity))

(defn- block-kind [entity]
  (cond
    (asset? entity) "asset"
    (property? entity) "property"
    (tag? entity) "tag"
    (page? entity) "page"
    :else "block"))

(defn- block-response [block]
  (cond-> {:uuid (uuid-string (:block/uuid block))
           :kind (block-kind block)
           :title (:block/title block)
           :order (:block/order block)}
    (:block/parent block) (assoc :parent-id (uuid-string (:block/uuid (:block/parent block))))
    (:block/page block) (assoc :page-id (uuid-string (:block/uuid (:block/page block))))
    (seq (:block/children block)) (assoc :children (mapv block-response (:block/children block)))))

(defn- tag-response [entity]
  {:uuid (uuid-string (:block/uuid entity))
   :ident (entity-ident entity)
   :title (:block/title entity)})

(defn- property-choice-response [entity]
  {:uuid (uuid-string (:block/uuid entity))
   :ident (entity-ident entity)
   :title (:block/title entity)
   :value (:logseq.property/value entity)})

(defn- property-response [entity]
  (cond-> {:uuid (uuid-string (:block/uuid entity))
           :ident (entity-ident entity)
           :title (:block/title entity)
           :type (some-> (:logseq.property/type entity) name)
           :cardinality (some-> (:db/cardinality entity) name)}
    (seq (:block/_closed-value-property entity))
    (assoc :choices (mapv property-choice-response (:block/_closed-value-property entity)))))

(defn- asset-response [entity]
  {:uuid (uuid-string (:block/uuid entity))
   :title (:block/title entity)
   :type (:logseq.property.asset/type entity)
   :size (:logseq.property.asset/size entity)
   :checksum (:logseq.property.asset/checksum entity)})

(defn- entities-by-avet [db attribute & [value]]
  (->> (if (some? value)
         (d/datoms db :avet attribute value)
         (d/datoms db :avet attribute))
       (map #(d/entity db (:e %)))
       (remove entity-util/hidden?)))

(defn- parse-limit [url]
  (let [raw (.get (.-searchParams url) "limit")
        parsed (when raw (js/parseInt raw 10))]
    (cond
      (nil? raw) default-limit
      (or (js/isNaN parsed) (not (pos? parsed))) nil
      :else (min parsed max-limit))))

(def ^:private text-encoder (js/TextEncoder.))
(def ^:private text-decoder (js/TextDecoder.))

(defn- encode-cursor [key]
  (let [payload (.encode text-encoder (js/JSON.stringify (clj->js key)))
        binary (.join (.map (js/Array.from payload) #(js/String.fromCharCode %)) "")]
    (js/btoa binary)))

(defn- decode-cursor [value]
  (when value
    (try
      (let [binary (js/atob value)
            payload (js/Uint8Array.from (js/Array.from binary #(.charCodeAt % 0)))
            decoded (js->clj (js/JSON.parse (.decode text-decoder payload)))]
        (when (and (vector? decoded) (= 2 (count decoded)) (every? string? decoded)) decoded))
      (catch :default _ nil))))

(defn- sort-key [item]
  [(or (:order item) (string/lower-case (or (:title item) ""))) (or (:uuid item) "")])

(defn- paginate [items limit cursor]
  (let [sorted (sort-by sort-key items)
        remaining (if cursor (drop-while #(not (pos? (compare (sort-key %) cursor))) sorted) sorted)
        selected (vec (take (inc limit) remaining))
        more? (> (count selected) limit)
        page (vec (take limit selected))]
    (cond-> {:items page}
      more? (assoc :next-cursor (encode-cursor (sort-key (last page)))))))

(defn- pagination-options [url]
  (let [raw-cursor (.get (.-searchParams url) "cursor")]
    {:limit (parse-limit url)
     :raw-cursor raw-cursor
     :cursor (decode-cursor raw-cursor)}))

(defn- paginated-response [url response-key items]
  (let [{:keys [limit raw-cursor cursor]} (pagination-options url)]
    (cond
      (nil? limit) (http/bad-request "invalid limit")
      (and raw-cursor (nil? cursor)) (http/bad-request "invalid cursor")
      :else (let [{:keys [items next-cursor]} (paginate items limit cursor)]
              (http/json-response nil (cond-> {response-key items}
                                        next-cursor (assoc :next-cursor next-cursor)))))))

(defn- indexed-reference-response
  ([db url response-key attribute target-id]
   (indexed-reference-response db url response-key attribute target-id {}))
  ([db url response-key attribute target-id {:keys [entity-filter response-fn]
                                              :or {entity-filter (constantly true)
                                                   response-fn block-response}}]
  (let [{:keys [limit raw-cursor cursor]} (pagination-options url)
        cursor-e (when (= "entity-id" (first cursor))
                   (js/parseInt (second cursor) 10))]
    (cond
      (nil? limit) (http/bad-request "invalid limit")
      (and raw-cursor (or (nil? cursor) (js/isNaN cursor-e))) (http/bad-request "invalid cursor")
      :else
      (let [datoms (cond->> (d/datoms db :avet attribute target-id)
                     cursor-e (drop-while #(<= (:e %) cursor-e))
                     true (remove #(entity-util/hidden? (d/entity db (:e %))))
                     true (filter #(entity-filter (d/entity db (:e %)))))
            selected (vec (take (inc limit) datoms))
            more? (> (count selected) limit)
            page (take limit selected)]
        (http/json-response
         nil
         (cond-> {response-key (mapv #(response-fn (d/entity db (:e %))) page)}
           more? (assoc :next-cursor
                        (encode-cursor ["entity-id" (str (:e (last page)))])))))))))

(defn- find-entity [db id]
  (when-let [parsed (try (uuid id) (catch :default _ nil))]
    (d/entity db [:block/uuid parsed])))

(defn- find-visible-entity [db id]
  (when-let [entity (find-entity db id)]
    (when-not (entity-util/hidden? entity) entity)))

(defn- page-blocks [db page]
  (let [blocks (ldb/get-page-blocks db (:db/id page)
                                    :pull-keys [:db/id :block/uuid :block/title :block/order
                                                {:block/parent [:db/id :block/uuid]}
                                                {:block/page [:db/id :block/uuid]}])]
    (mapv block-response (otree/non-consecutive-blocks->vec-tree
                          (remove #(entity-util/hidden? (d/entity db (:db/id %))) blocks)))))

(defn- body-clj [request]
  (p/let [body (common/read-json request)]
    (when body (js->clj body :keywordize-keys true))))

(defn- broadcast-change! [^js self]
  (ws/broadcast! self nil {:type "changed" :t (storage/get-t (.-sql self))}))

(defn- list-pages [db]
  (->> [:logseq.class/Page :logseq.class/Journal]
       (keep #(d/entid db %))
       (mapcat #(entities-by-avet db :block/tags %))
       (mapv block-response)))

(defn- page-ref-values [title]
  (when (string? title)
    (->> (re-seq page-ref/page-ref-re title)
         (map (comp string/trim second))
         (remove string/blank?)
         distinct)))

(defn- integer-string? [value]
  (boolean (re-matches #"-?\d+" value)))

(defn- resolve-page-ref! [conn value]
  (cond
    (common-util/uuid-string? value)
    (when-let [entity (d/entity @conn [:block/uuid (uuid value)])]
      {:block/uuid (:block/uuid entity)
       :block/title value})

    (integer-string? value)
    (when-let [entity (d/entity @conn (js/parseInt value 10))]
      {:block/uuid (:block/uuid entity)
       :block/title value})

    :else
    (let [page (or (ldb/get-page @conn value)
                   (let [[_ page-id] (outliner-page/create! conn value {})]
                     (d/entity @conn [:block/uuid page-id])))]
      {:block/uuid (:block/uuid page)
       :block/title (:block/title page)})))

(defn- prepare-block-title! [conn title]
  (let [refs (->> (page-ref-values title)
                  (keep #(resolve-page-ref! conn %))
                  (reduce (fn [result ref]
                            (assoc result (:block/uuid ref) ref)) {})
                  vals
                  vec)]
    {:block/title (db-content/title-ref->id-ref title refs :replace-tag? false)
     :block/refs (mapv #(vector :block/uuid (:block/uuid %)) refs)}))

(defn- tree-block [conn node]
  (assoc (prepare-block-title! conn (:title node)) :block/uuid (random-uuid)))

(defn- insert-tree! [conn target nodes position]
  (let [nodes (vec nodes)
        blocks (mapv #(tree-block conn %) nodes)]
    (when (seq blocks)
      (outliner-core/insert-blocks! conn blocks target
                                    {:sibling? false :top? (= position "prepend")
                                     :bottom? (not= position "prepend") :keep-uuid? true})
      (mapv (fn [node block]
              (let [children (when (seq (:children node))
                               (insert-tree! conn (d/entity @conn [:block/uuid (:block/uuid block)])
                                             (:children node) "append"))]
                (cond-> {:uuid (str (:block/uuid block)) :title (:title node)}
                  (seq children) (assoc :children children))))
            nodes blocks))))

(defn- today-journal-day []
  (let [now (js/Date.)]
    (+ (* (.getFullYear now) 10000) (* (inc (.getMonth now)) 100) (.getDate now))))

(defn- ensure-today-page! [conn]
  (let [day (today-journal-day)]
    (or (ldb/get-journal-page-by-day @conn day)
        (let [formatter (:logseq.property.journal/title-format (d/entity @conn :logseq.class/Journal))
              title (date-time-util/int->journal-title day formatter)
              [_ page-id] (outliner-page/create! conn title {:journal? true :today-journal? true})]
          (d/entity @conn [:block/uuid page-id])))))

(defn- resolve-property-ident [db value]
  (or (when-let [entity (find-entity db value)] (:db/ident entity))
      (when (string? value)
        (let [ident (keyword value)] (when (d/entity db ident) ident)))))

(defn- resolve-ref-entity [db property-ident value]
  (let [entity (cond
                 (number? value) (d/entity db value)
                 (qualified-keyword? value) (d/entity db value)
                 (and (string? value) (common-util/uuid-string? value))
                 (d/entity db [:block/uuid (uuid value)])
                 (string? value)
                 (or (d/entity db (keyword value))
                     (some->> (d/datoms db :avet :block/title value)
                              (map #(d/entity db (:e %)))
                              (filter #(if (= property-ident :block/tags)
                                         (entity-util/class? %)
                                         true))
                              first))
                 :else nil)]
    (when (and entity
               (or (not= property-ident :block/tags) (entity-util/class? entity)))
      (:db/id entity))))

(defn- prepare-property-value [db property-ident value]
  (let [property (d/entity db property-ident)]
    (if-not (= :db.type/ref (:db/valueType property))
      {:value value}
      (let [many-input? (or (sequential? value) (set? value))
            values (if many-input? value [value])
            resolved (mapv #(resolve-ref-entity db property-ident %) values)]
        (if (every? some? resolved)
          {:value (if many-input? resolved (first resolved))}
          {:error (if (= property-ident :block/tags)
                    "property value must resolve to an existing class by UUID, ident, or title"
                    "property value must resolve to an existing entity by UUID, ident, or title")})))))

(defn- set-prepared-property! [conn block-id property-ident value reset-existing-values?]
  (if (coll? value)
    (do
      (when reset-existing-values?
        (outliner-property/remove-block-property! conn block-id property-ident))
      (doseq [item value]
        (outliner-property/batch-set-property! conn [block-id] property-ident item {:entity-id? true})))
    (outliner-property/set-block-property! conn block-id property-ident value)))

(def ^:private task-status-idents
  {"todo" :logseq.property/status.todo
   "doing" :logseq.property/status.doing
   "in-review" :logseq.property/status.in-review
   "done" :logseq.property/status.done
   "canceled" :logseq.property/status.canceled
   "backlog" :logseq.property/status.backlog})

(def ^:private task-priority-idents
  {"low" :logseq.property/priority.low
   "medium" :logseq.property/priority.medium
   "high" :logseq.property/priority.high
   "urgent" :logseq.property/priority.urgent})

(defn- task-response [task]
  (cond-> (block-response task)
    (:logseq.property/status task)
    (assoc :status (property-choice-response (:logseq.property/status task)))
    (:logseq.property/priority task)
    (assoc :priority (property-choice-response (:logseq.property/priority task)))
    (:logseq.property/scheduled task) (assoc :scheduled (:logseq.property/scheduled task))
    (:logseq.property/deadline task) (assoc :deadline (:logseq.property/deadline task))))

(defn- resolve-property-choice [db property-ident aliases selector]
  (let [selector (get aliases selector selector)
        choice-id (resolve-ref-entity db property-ident selector)
        choice (when choice-id (d/entity db choice-id))
        property-id (d/entid db property-ident)]
    (when (and choice-id
               (some #(= property-id (:v %))
                     (d/datoms db :eavt choice-id :block/closed-value-property)))
      choice)))

(defn- search-results [db query types]
  (let [needle (string/lower-case query)
        enabled (if (seq types) (set (string/split types #",")) #{"blocks" "tags" "properties" "assets"})
        title-matches (keep (fn [datom]
                              (try
                                (when (string/includes? (string/lower-case (:v datom)) needle)
                                  (:e datom))
                                (catch :default _
                                  nil)))
                            (d/datoms db :avet :block/title))]
    (->> title-matches
         (map #(d/entity db %))
         (remove entity-util/hidden?)
         (keep (fn [entity]
                 (let [kind (block-kind entity)
                       type (case kind "tag" "tags" "property" "properties" "asset" "assets" "blocks")
                       response (case kind
                                  "tag" (tag-response entity)
                                  "property" (property-response entity)
                                  "asset" (asset-response entity)
                                  (block-response entity))]
                   (when (and (contains? enabled type)
                              (string/includes? (string/lower-case (or (:title response) "")) needle))
                     (assoc response :resource type)))))
         vec)))

(defn- handle-pages [{:keys [^js self request ^js url conn db handler path-params]}]
  (case handler
    :semantic/pages-list
    (paginated-response url :blocks (list-pages db))

    :semantic/pages-create
    (p/let [body (body-clj request)]
      (if-not (seq (:title body))
        (http/bad-request "missing title")
        (let [[title page-id] (outliner-page/create! conn (:title body) {})]
          (broadcast-change! self)
          (http/json-response nil {:uuid (str page-id) :kind "page" :title title} 201))))

    :semantic/pages-blocks
    (if-let [page (find-visible-entity db (:page-id path-params))]
      (if-not (page? page)
        (http/bad-request "block is not a page")
        (paginated-response url :blocks (page-blocks db page)))
      (http/not-found))

    :semantic/pages-references
    (if-let [page (find-visible-entity db (:page-id path-params))]
      (if (page? page)
        (indexed-reference-response db url :references :block/refs (:db/id page))
        (http/not-found))
      (http/not-found))

    :semantic/pages-get
    (if-let [page (find-visible-entity db (:page-id path-params))]
      (if (page? page) (http/json-response nil (block-response page)) (http/not-found))
      (http/not-found))

    :semantic/pages-update
    (p/let [body (body-clj request)
            page (find-entity db (:page-id path-params))]
      (if (or (not (page? page)) (not (seq (:title body))))
        (http/bad-request "invalid page-id or title")
        (do
          (outliner-core/save-block! conn {:block/uuid (:block/uuid page) :block/title (:title body)})
          (broadcast-change! self)
          (http/json-response nil (assoc (block-response page) :title (:title body))))))

    :semantic/pages-delete
    (if-let [page (find-entity db (:page-id path-params))]
      (if-not (page? page)
        (http/bad-request "block is not a page")
        (do
          (outliner-page/delete! conn (:block/uuid page))
          (broadcast-change! self)
          (js/Response. nil #js {:status 204})))
      (http/not-found))))

(defn- handle-blocks [{:keys [^js self request conn db handler path-params]}]
  (case handler

    :semantic/blocks-get
    (if-let [block (find-visible-entity db (:block-id path-params))]
      (http/json-response nil (block-response block))
      (http/not-found))

    :semantic/blocks-update
    (p/let [body (body-clj request)
            block (find-entity db (:block-id path-params))]
      (if (or (nil? block) (not (seq (:title body))))
        (http/bad-request "invalid block-id or title")
        (do
          (outliner-core/save-block! conn
                                     (assoc (prepare-block-title! conn (:title body))
                                            :block/uuid (:block/uuid block)))
          (broadcast-change! self)
          (http/json-response nil {:uuid (str (:block/uuid block)) :kind (block-kind block) :title (:title body)}))))

    :semantic/blocks-delete
    (if-let [block (find-entity db (:block-id path-params))]
      (do
        (if (page? block)
          (outliner-page/delete! conn (:block/uuid block))
          (outliner-core/delete-blocks! conn [block] {}))
        (broadcast-change! self)
        (js/Response. nil #js {:status 204}))
      (http/not-found))

    :semantic/blocks-move
    (p/let [body (body-clj request)
            block-ids (:block-ids body)
            blocks (mapv #(find-entity db %) block-ids)
            target (find-entity db (:target-id body))]
      (if (or (not (seq block-ids))
              (some nil? blocks) (nil? target)
              (not= (count blocks) (count (distinct (map :db/id blocks))))
              (some #(= (:db/id target) (:db/id %)) blocks)
              (not (contains? #{"before" "after" "first-child" "last-child"} (:position body))))
        (http/bad-request "invalid blocks, target, or position")
        (let [position (:position body)
              opts (case position
                     "before" {:sibling? true :top? true}
                     "after" {:sibling? true :bottom? true}
                     "first-child" {:sibling? false :top? true}
                     "last-child" {:sibling? false :bottom? true})]
          (outliner-core/move-blocks! conn blocks target opts)
          (broadcast-change! self)
          (http/json-response nil {:uuids (mapv #(str (:block/uuid %)) blocks) :moved true}))))

    :semantic/blocks-insert-children
    (p/let [body (body-clj request)
            target (find-entity db (:block-id path-params))]
      (if (or (nil? target) (not (contains? #{"append" "prepend"} (:position body)))
              (not (seq (:blocks body))))
        (http/bad-request "invalid target, position, or blocks")
        (let [inserted (insert-tree! conn target (:blocks body) (:position body))]
          (broadcast-change! self)
          (http/json-response nil {:blocks inserted} 201))))

    :semantic/blocks-insert-tree
    (p/let [body (body-clj request)
            target (find-entity db (:target-id body))]
      (if (or (nil? target) (not (seq (:blocks body))))
        (http/bad-request "invalid target or blocks")
        (let [inserted (insert-tree! conn target (:blocks body) (or (:position body) "append"))]
          (broadcast-change! self)
          (http/json-response nil {:blocks inserted} 201))))))

(defn- handle-block-properties [{:keys [^js self request conn db handler path-params]}]
  (case handler

    :semantic/blocks-set-property
    (p/let [body (body-clj request)
            block (find-entity db (:block-id path-params))
            property-ident (resolve-property-ident db (:property-id path-params))
            prepared (when property-ident (prepare-property-value db property-ident (:value body)))]
      (if (or (nil? block) (nil? property-ident) (not (contains? body :value)))
        (http/bad-request "invalid block, property, or value")
        (if-let [error (:error prepared)]
          (http/bad-request error)
          (do (set-prepared-property! conn (:db/id block) property-ident (:value prepared) true)
              (broadcast-change! self)
              (http/json-response nil {:updated true})))))

    :semantic/blocks-delete-property
    (let [block (find-entity db (:block-id path-params))
          property-ident (resolve-property-ident db (:property-id path-params))]
      (if (or (nil? block) (nil? property-ident))
        (http/bad-request "invalid block or property")
        (do
          (outliner-property/remove-block-property! conn (:db/id block) property-ident)
          (broadcast-change! self)
          (js/Response. nil #js {:status 204}))))

    :semantic/blocks-batch-set-property
    (p/let [body (body-clj request)
            entries (:entries body)
            resolved (mapv (fn [{:keys [block-id property-id value]}]
                             (let [property-ident (resolve-property-ident db property-id)]
                               {:block (find-entity db block-id)
                                :property-ident property-ident
                                :prepared (when property-ident
                                            (prepare-property-value db property-ident value))})) entries)]
      (if (or (not (seq entries))
              (some #(or (nil? (:block %)) (nil? (:property-ident %))
                         (:error (:prepared %))) resolved))
        (http/bad-request "invalid batch property entry")
        (do (ldb/batch-transact-with-temp-conn!
             conn {:outliner-op :batch-set-property}
             (fn [temp-conn]
               (doseq [{:keys [block property-ident prepared]} resolved]
                 (set-prepared-property! temp-conn (:db/id block) property-ident (:value prepared)
                                         (true? (:isResetExistingValues body))))))
            (broadcast-change! self)
            (http/json-response nil {:updated (count resolved)}))))

    :semantic/blocks-batch-delete-property
    (p/let [body (body-clj request)
            entries (:entries body)
            resolved (mapv (fn [{:keys [block-id property-id]}]
                             {:block (find-entity db block-id)
                              :property-ident (resolve-property-ident db property-id)}) entries)]
      (if (or (not (seq entries)) (some #(or (nil? (:block %)) (nil? (:property-ident %))) resolved))
        (http/bad-request "invalid batch property entry")
        (do
          (ldb/batch-transact-with-temp-conn!
           conn {:outliner-op :batch-remove-property}
           (fn [temp-conn]
             (doseq [{:keys [block property-ident]} resolved]
               (outliner-property/remove-block-property! temp-conn (:db/id block) property-ident))))
          (broadcast-change! self)
          (http/json-response nil {:deleted (count resolved)}))))))

(defn- handle-capture-and-tags [{:keys [^js self request ^js url conn db handler path-params]}]
  (case handler

    :semantic/capture
    (p/let [body (body-clj request)]
      (if-not (seq (:blocks body))
        (http/bad-request "missing blocks")
        (let [today (ensure-today-page! conn)
              inserted (insert-tree! conn today (:blocks body) "append")]
          (broadcast-change! self)
          (http/json-response nil {:page-id (str (:block/uuid today)) :blocks inserted} 201))))

    :semantic/tags-list
    (paginated-response url :tags (->> (entities-by-avet db :block/tags :logseq.class/Tag)
                                       (mapv tag-response)))

    :semantic/tags-create
    (p/let [body (body-clj request)]
      (if-not (seq (:title body))
        (http/bad-request "missing title")
        (let [[title tag-id] (outliner-page/create! conn (:title body) {:class? true})]
          (broadcast-change! self)
          (http/json-response nil {:uuid (str tag-id) :title title} 201))))

    :semantic/tags-get
    (if-let [tag (find-visible-entity db (:tag-id path-params))]
      (if (tag? tag) (http/json-response nil (tag-response tag)) (http/not-found))
      (http/not-found))

    :semantic/tags-objects
    (if-let [tag (find-visible-entity db (:tag-id path-params))]
      (if (tag? tag)
        (indexed-reference-response db url :objects :block/tags (:db/id tag))
        (http/not-found))
      (http/not-found))

    :semantic/tags-update
    (p/let [body (body-clj request)
            tag (find-entity db (:tag-id path-params))]
      (if (or (not (tag? tag)) (not (seq (:title body))))
        (http/bad-request "invalid tag-id or title")
        (do
          (outliner-core/save-block! conn {:block/uuid (:block/uuid tag) :block/title (:title body)})
          (broadcast-change! self)
          (http/json-response nil (assoc (tag-response tag) :title (:title body))))))

    :semantic/tags-delete
    (if-let [tag (find-entity db (:tag-id path-params))]
      (if-not (tag? tag)
        (http/not-found)
        (do
          (outliner-page/delete! conn (:block/uuid tag))
          (broadcast-change! self)
          (js/Response. nil #js {:status 204})))
      (http/not-found))))

(defn- handle-tasks [{:keys [^js self request ^js url conn db handler]}]
  (case handler
    :semantic/tasks-list
    (let [status (.get (.-searchParams url) "status")
          priority (.get (.-searchParams url) "priority")
          content (some-> (.get (.-searchParams url) "content") string/lower-case)
          status-choice (when status (resolve-property-choice db :logseq.property/status
                                                              task-status-idents status))
          priority-choice (when priority (resolve-property-choice db :logseq.property/priority
                                                                  task-priority-idents priority))]
      (cond
        (and status (nil? status-choice)) (http/bad-request "invalid task status")
        (and priority (nil? priority-choice)) (http/bad-request "invalid task priority")
        :else
        (indexed-reference-response
         db url :tasks :block/tags :logseq.class/Task
         {:entity-filter
          (fn [entity]
            (and (or (nil? status-choice)
                     (= (:db/id status-choice) (:db/id (:logseq.property/status entity))))
                 (or (nil? priority-choice)
                     (= (:db/id priority-choice) (:db/id (:logseq.property/priority entity))))
                 (or (nil? content)
                     (string/includes? (string/lower-case (or (:block/title entity) "")) content))))
          :response-fn task-response})))

    :semantic/tasks-create
    (p/let [body (body-clj request)]
      (let [status (or (:status body) "todo")
            priority (:priority body)
            status-choice (resolve-property-choice db :logseq.property/status task-status-idents status)
            priority-choice (when priority
                              (resolve-property-choice db :logseq.property/priority
                                                       task-priority-idents priority))
            target (if-let [page-id (:page-id body)]
                     (find-entity db page-id)
                     (ensure-today-page! conn))]
        (cond
          (not (seq (:title body))) (http/bad-request "missing task title")
          (nil? status-choice) (http/bad-request "invalid task status")
          (and priority (nil? priority-choice)) (http/bad-request "invalid task priority")
          (not (page? target)) (http/bad-request "invalid task page-id")
          :else
          (let [inserted (first (insert-tree! conn target [{:title (:title body)}] "append"))
                task (d/entity @conn [:block/uuid (uuid (:uuid inserted))])]
            (outliner-property/set-block-property! conn (:db/id task) :block/tags
                                                   (:db/id (d/entity @conn :logseq.class/Task)))
            (outliner-property/set-block-property! conn (:db/id task) :logseq.property/status
                                                   (:db/id status-choice))
            (when priority-choice
              (outliner-property/set-block-property! conn (:db/id task) :logseq.property/priority
                                                     (:db/id priority-choice)))
            (doseq [property-ident [:logseq.property/scheduled :logseq.property/deadline]
                    :let [value (get body (keyword (name property-ident)))]
                    :when (some? value)]
              (outliner-property/set-block-property! conn (:db/id task) property-ident value))
            (broadcast-change! self)
            (http/json-response nil (task-response (d/entity @conn (:db/id task))) 201)))))))

(defn- handle-properties-assets-and-search
  [{:keys [^js self request ^js url conn db handler path-params]}]
  (case handler

    :semantic/properties-list
    (paginated-response url :properties (->> (db-db/get-all-properties db)
                                              (remove entity-util/hidden?)
                                              (mapv property-response)))

    :semantic/properties-create
    (p/let [body (body-clj request)]
      (if-not (seq (:title body))
        (http/bad-request "missing title")
        (let [property (outliner-property/upsert-property!
                        conn nil
                        {:logseq.property/type (keyword (or (:type body) "default"))
                         :db/cardinality (keyword (or (:cardinality body) "db.cardinality/one"))}
                        {:property-name (:title body)})]
          (broadcast-change! self)
          (http/json-response nil (property-response property) 201))))

    :semantic/properties-get
    (if-let [property (find-visible-entity db (:property-id path-params))]
      (if (property? property) (http/json-response nil (property-response property)) (http/not-found))
      (http/not-found))

    :semantic/properties-update
    (p/let [body (body-clj request)
            property (find-entity db (:property-id path-params))]
      (if (or (not (property? property)) (empty? body))
        (http/bad-request "invalid property-id or update")
        (let [schema (cond-> {}
                       (:type body) (assoc :logseq.property/type (keyword (:type body)))
                       (:cardinality body) (assoc :db/cardinality (keyword (:cardinality body))))
              updated (outliner-property/upsert-property!
                       conn (:db/ident property) schema
                       (cond-> {} (:title body) (assoc :property-name (:title body))))]
          (broadcast-change! self)
          (http/json-response nil (property-response updated)))))

    :semantic/properties-delete
    (if-let [property (find-entity db (:property-id path-params))]
      (if-not (property? property)
        (http/not-found)
        (do
          (outliner-page/delete! conn (:block/uuid property))
          (broadcast-change! self)
          (js/Response. nil #js {:status 204})))
      (http/not-found))

    :semantic/assets-get
    (if-let [asset (find-visible-entity db (:asset-block-id path-params))]
      (if-not (asset? asset)
        (http/bad-request "block is not an asset")
        (p/let [link (asset-link/<temporary-url request (.-env self)
                                                (.get (.-searchParams url) "graph-id")
                                                (:block/uuid asset)
                                                (:logseq.property.asset/type asset))]
          (http/json-response nil (merge (asset-response asset) link))))
      (http/not-found))

    :semantic/search
    (let [query (.get (.-searchParams url) "q")]
      (if-not (seq query)
        (http/bad-request "missing q")
        (paginated-response url :results
                            (search-results db query (.get (.-searchParams url) "types")))))))

(def ^:private page-handlers
  #{:semantic/pages-list :semantic/pages-create :semantic/pages-blocks :semantic/pages-references :semantic/pages-get
    :semantic/pages-update :semantic/pages-delete})

(def ^:private block-handlers
  #{:semantic/blocks-get :semantic/blocks-update :semantic/blocks-delete :semantic/blocks-move
    :semantic/blocks-insert-children :semantic/blocks-insert-tree})

(def ^:private block-property-handlers
  #{:semantic/blocks-set-property :semantic/blocks-delete-property
    :semantic/blocks-batch-set-property :semantic/blocks-batch-delete-property})

(def ^:private capture-and-tag-handlers
  #{:semantic/capture :semantic/tags-list :semantic/tags-create :semantic/tags-get :semantic/tags-objects
    :semantic/tags-update :semantic/tags-delete})

(def ^:private task-handlers
  #{:semantic/tasks-list :semantic/tasks-create})

(def ^:private property-asset-and-search-handlers
  #{:semantic/properties-list :semantic/properties-create :semantic/properties-get
    :semantic/properties-update :semantic/properties-delete :semantic/assets-get :semantic/search})

(defn handle [{:keys [^js self route] :as context}]
  (let [conn (ensure-conn! self)
        handler (:handler route)
        context (assoc context :conn conn :db @conn :handler handler :path-params (:path-params route))]
    (cond
      (contains? page-handlers handler) (handle-pages context)
      (contains? block-handlers handler) (handle-blocks context)
      (contains? block-property-handlers handler) (handle-block-properties context)
      (contains? capture-and-tag-handlers handler) (handle-capture-and-tags context)
      (contains? task-handlers handler) (handle-tasks context)
      (contains? property-asset-and-search-handlers handler) (handle-properties-assets-and-search context)
      :else (http/not-found))))
