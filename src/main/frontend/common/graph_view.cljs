(ns frontend.common.graph-view
  "Main namespace for graph view fns."
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [lambdaisland.glogi :as log]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]))

(defn- build-links
  [links]
  (first
   (reduce
    (fn [[result index-by-endpoints] [from to label]]
      (if (and from to)
        (let [link {:source (str from)
                    :target (str to)}
              endpoints [(:source link) (:target link)]
              label? (and (string? label)
                          (not (string/blank? label)))]
          (if-let [idx (get index-by-endpoints endpoints)]
            [(if label?
               (assoc-in result [idx :label] label)
               result)
             index-by-endpoints]
            [(conj result (cond-> link
                            label?
                            (assoc :label label)))
             (assoc index-by-endpoints endpoints (count result))]))
        [result index-by-endpoints]))
    [[] {}]
    links)))

(defn- normalize-view-mode
  [view-mode]
  (if (= view-mode :all-pages)
    :all-pages
    :tags-and-objects))

(def ^:private large-all-pages-fast-threshold 10000)
(def ^:private large-all-pages-link-limit 20000)
(def ^:private hidden-built-in-tag-idents
  #{:logseq.class/Root
    :logseq.class/Tag
    :logseq.class/Property
    :logseq.class/Page
    :logseq.class/Whiteboard
    :logseq.class/Asset})

(defn- dark-theme?
  [theme]
  (contains? #{"dark" :dark} theme))

(defn- datoms-for
  ([db index attr]
   (if (d/entid db attr)
     (d/datoms db index attr)
     []))
  ([db index attr value]
   (let [value (if (keyword? value)
                 (d/entid db value)
                 value)]
     (if (and (d/entid db attr) value)
       (d/datoms db index attr value)
       []))))

(defn- entity-ids-with
  ([db attr]
   (set (map :e (datoms-for db :avet attr))))
  ([db attr value]
   (set (map :e (datoms-for db :avet attr value)))))

(defn- entity-value-map
  [db attr ids]
  (if (empty? ids)
    {}
    (persistent!
     (reduce (fn [m {id :e value :v}]
               (if (contains? ids id)
                 (let [m (assoc! m id value)]
                   (if (= (count m) (count ids))
                     (reduced m)
                     m))
                 m))
             (transient {})
             (datoms-for db :avet attr)))))

(defn- entity-value-map-by-id
  [db attr ids]
  (if (empty? ids)
    {}
    (persistent!
     (reduce
      (fn [m id]
        (if-let [value (:v (first (d/datoms db :eavt id attr)))]
          (assoc! m id value)
          m))
      (transient {})
      ids))))

(defn- entity-display-title
  [entity]
  (let [title (:block/title entity)]
    (cond-> (if (and (string? title)
                     (re-find db-content/id-ref-pattern title))
              (or (db-content/recur-replace-uuid-in-block-title entity 10)
                  title)
              title)
      (string? title)
      (string/replace #"#?\[\[([^\]]+)\]\]" "$1"))))

(defn- entity-title-map
  ([db ids]
   (entity-title-map db ids true))
  ([db ids normalize-id-refs?]
   (persistent!
    (reduce
     (fn [m {:keys [db/id block/title]}]
       (let [contains-ref? (and (string? title)
                                (string/includes? title "[["))
             title (if (and normalize-id-refs?
                            contains-ref?
                            (re-find db-content/id-ref-pattern title))
                     (or (some-> (d/entity db id)
                                 (db-content/recur-replace-uuid-in-block-title 10))
                         title)
                     title)]
         (if (some? title)
           (assoc! m id (cond-> title
                          contains-ref?
                          (string/replace #"#?\[\[([^\]]+)\]\]" "$1")))
           m)))
     (transient {})
     (d/pull-many db [:db/id :block/title] ids)))))

(defn- entity-id-subset-with
  [db attr ids]
  (persistent!
   (reduce (fn [matches {id :e}]
             (if (contains? ids id)
               (conj! matches id)
               matches))
           (transient #{})
           (datoms-for db :avet attr))))

(defn- scalar-node
  [{:keys [title-by-id name-by-id uuid-by-id icon-by-id created-at-by-id]} id kind page?]
  (let [title (get title-by-id id)
        name (get name-by-id id)
        uuid (get uuid-by-id id)
        icon (get icon-by-id id)
        created-at (get created-at-by-id id)]
    (cond->
     {:id (str id)
      :db-id id
      :uuid (some-> uuid str)
      :page? page?
      :label (or title name (some-> uuid str) (str id))
      :kind kind}
      (some? created-at)
      (assoc :block/created-at created-at)

      (some? icon)
      (assoc :icon icon))))

(defn- build-node-context
  ([db node-ids]
   (build-node-context db node-ids true))
  ([db node-ids normalize-id-refs?]
   (let [title-by-id (entity-title-map db node-ids normalize-id-refs?)
        title-missing-ids (set/difference node-ids (set (keys title-by-id)))
        name-by-id (if (empty? title-missing-ids)
                     {}
                     (entity-value-map db :block/name title-missing-ids))
        uuid-by-id (entity-value-map-by-id db :block/uuid node-ids)
        icon-by-id (entity-value-map db :logseq.property/icon node-ids)
        created-at-by-id (entity-value-map db :block/created-at node-ids)]
    {:title-by-id title-by-id
     :name-by-id name-by-id
     :uuid-by-id uuid-by-id
     :icon-by-id icon-by-id
     :created-at-by-id created-at-by-id})))

(defn- hidden-or-recycled?
  [entity]
  (when entity
    (or (ldb/hidden? entity)
        (ldb/recycled? entity))))

(defn- entity-or-parent-matches?
  [entity pred]
  (loop [entity entity
         seen #{}]
    (when entity
      (let [id (:db/id entity)]
        (when-not (contains? seen id)
          (or (pred entity)
              (recur (:block/parent entity) (conj seen id))))))))

(defn- graph-visible-entity?
  [entity]
  (boolean
   (when entity
     (let [page (:block/page entity)]
       (not (or (entity-or-parent-matches? entity hidden-or-recycled?)
                (hidden-or-recycled? page)))))))

(defn- excluded-from-graph?
  [entity]
  (let [page (:block/page entity)]
    (or (entity-or-parent-matches?
         entity
         #(true? (:logseq.property/exclude-from-graph-view %)))
        (true? (:logseq.property/exclude-from-graph-view page)))))

(defn- visible-entity?
  [entity]
  (and (graph-visible-entity? entity)
       (not (excluded-from-graph? entity))))

(defn- invisible-id-set
  [db]
  (set/union (entity-ids-with db :logseq.property/hide? true)
             (entity-ids-with db :logseq.property/deleted-at)
             (entity-ids-with db :logseq.property/exclude-from-graph-view true)))

(defn- parent-id-map
  [db ids]
  (loop [result {}
         frontier ids
         seen #{}]
    (let [frontier (set/difference (set frontier) seen)]
      (if (empty? frontier)
        result
        (let [parents (entity-value-map db :block/parent frontier)]
          (recur (merge result parents)
                 (set (vals parents))
                 (set/union seen frontier)))))))

(defn- invalid-id-or-parent?
  [invalid-ids parent-by-id id]
  (loop [id id
         seen #{}]
    (when id
      (let [id (if (map? id) (:db/id id) id)]
        (when-not (contains? seen id)
          (or (contains? invalid-ids id)
              (recur (get parent-by-id id) (conj seen id))))))))

(defn- visible-object-id-set
  [db class-ids property-ids object-ids]
  (let [object-ids (->> object-ids
                        (remove class-ids)
                        (remove property-ids)
                        set)
        invalid-ids (invisible-id-set db)
        parent-by-id (parent-id-map db object-ids)
        page-by-id (entity-value-map db :block/page object-ids)]
    (->> object-ids
         (remove #(invalid-id-or-parent? invalid-ids parent-by-id %))
         (remove #(contains? invalid-ids (get page-by-id %)))
         set)))

(defn- graph-link-node-id-map
  [db mode entity-ids node-id-set]
  (case mode
    :entity
    (into {} (map (juxt identity identity)) entity-ids)

    :page
    (let [direct-page-ids (set/intersection (set entity-ids) node-id-set)
          child-ids (set/difference (set entity-ids) direct-page-ids)
          page-by-child-id (entity-value-map db :block/page child-ids)]
      (merge (into {} (map (juxt identity identity)) direct-page-ids)
             page-by-child-id))))

(defn- property-link-title
  [db property-ident]
  (or (some-> (d/entity db property-ident) :block/title)
      (some-> property-ident name)))

(defn- ref-property-idents
  [db]
  (keep (fn [[property-ident schema]]
          (let [property (d/entity db property-ident)]
            (when (and (keyword? property-ident)
                       (= "user.property" (namespace property-ident))
                       (= :db.type/ref (:db/valueType schema))
                       (ldb/property? property))
              property-ident)))
        (d/schema db)))

(defn- property-ref-link-tuples
  [db node-id-set source-mode target-mode]
  (let [node-id-set (set node-id-set)
        raw-links (->> (ref-property-idents db)
                       (mapcat
                        (fn [property-ident]
                          (let [label (property-link-title db property-ident)]
                            (map (fn [{source-entity-id :e target-entity-id :v}]
                                   [source-entity-id target-entity-id label])
                                 (datoms-for db :avet property-ident)))))
                       vec)
        source-id-by-entity-id (graph-link-node-id-map db
                                                       source-mode
                                                       (map first raw-links)
                                                       node-id-set)
        target-id-by-entity-id (graph-link-node-id-map db
                                                       target-mode
                                                       (map second raw-links)
                                                       node-id-set)]
    (->> raw-links
         (keep (fn [[source-entity-id target-entity-id label]]
                 (let [source-id (get source-id-by-entity-id source-entity-id)
                       target-id (get target-id-by-entity-id target-entity-id)]
                   (when (and source-id
                              target-id
                              (not= source-id target-id)
                              (contains? node-id-set source-id)
                              (contains? node-id-set target-id))
                     [source-id target-id label]))))
         distinct
         vec)))

(defn- built-in-class-ident?
  [ident]
  (and (keyword? ident)
       (= "logseq.class" (namespace ident))))

(defn- build-tags-and-objects-graph
  [db]
  (let [tag-datoms (vec (datoms-for db :avet :block/tags))
        class-ids (entity-ids-with db :block/tags :logseq.class/Tag)
        property-ids (entity-ids-with db :block/tags :logseq.class/Property)
        ident-by-class-id (into {}
                                (keep (fn [id]
                                        (when-let [ident (:db/ident (d/entity db id))]
                                          [id ident])))
                                class-ids)
        allowed-tag-id? (fn [id]
                          (let [entity (d/entity db id)]
                            (and (visible-entity? entity)
                                 (not (contains? property-ids id))
                                 (not (contains? hidden-built-in-tag-idents (get ident-by-class-id id))))))
        user-tag-id-set (->> class-ids
                             (filter allowed-tag-id?)
                             (remove #(built-in-class-ident? (get ident-by-class-id %)))
                             set)
        allowed-built-in-tag-id-set (->> class-ids
                                         (filter allowed-tag-id?)
                                         (filter #(built-in-class-ident? (get ident-by-class-id %)))
                                         set)
        candidate-tag-id-set (set/union user-tag-id-set allowed-built-in-tag-id-set)
        candidate-tag-links (->> tag-datoms
                                 (keep (fn [{from-id :e tag-id :v}]
                                         (when (and (contains? candidate-tag-id-set tag-id)
                                                    (not (contains? candidate-tag-id-set from-id)))
                                           [from-id tag-id])))
                                 distinct
                                 vec)
        visible-object-ids (->> candidate-tag-links
                                (map first)
                                set
                                (visible-object-id-set db class-ids property-ids))
        visible-tag-links (->> candidate-tag-links
                               (filter (fn [[from-id _tag-id]]
                                         (contains? visible-object-ids from-id)))
                               vec)
        visible-tag-id-set (set (map second visible-tag-links))
        used-built-in-tag-id-set (set/intersection allowed-built-in-tag-id-set visible-tag-id-set)
        tag-id-set (set/union (set/intersection user-tag-id-set visible-tag-id-set)
                              used-built-in-tag-id-set)]
    (if (or (empty? tag-id-set)
            (empty? visible-object-ids))
      {:nodes []
       :links []}
      (let [tag-links (->> visible-tag-links
                           (filter (fn [[_from-id tag-id]]
                                     (contains? tag-id-set tag-id)))
                           vec)
            object-id-set (set (map first tag-links))
            node-ids (set/union tag-id-set object-id-set)
            page-ids (entity-id-subset-with db :block/name object-id-set)
            context (build-node-context db node-ids false)
            tags (mapv #(scalar-node context % "tag" true) tag-id-set)
            objects (mapv #(scalar-node context % "object" (contains? page-ids %))
                          object-id-set)
            nodes (into tags objects)
            node-id-set (set (map :id nodes))
            links (->> tag-links
                       (filter (fn [[from-id _tag-id]]
                                 (contains? object-id-set from-id)))
                       (build-links)
                       vec)
            property-links (->> (property-ref-link-tuples db node-ids :entity :entity)
                                build-links
                                (filter (fn [{:keys [source target]}]
                                          (and (contains? node-id-set source)
                                               (contains? node-id-set target)))))]
        {:nodes (vec nodes)
         :links (vec (distinct (concat links property-links)))}))))

(declare page-graph-node-color)

(defn- build-nodes
  [dark? current-page page-links _tags nodes]
  (let [current-page (or current-page "")
        pages (common-util/distinct-by :db/id nodes)]
    (->>
     pages
     (remove ldb/hidden?)
     (remove nil?)
     (keep (fn [p]
             (if-let [page-title (entity-display-title p)]
               (let [current-page? (= page-title current-page)
                     kind (cond
                            (ldb/class? p) "tag"
                            (ldb/property? p) "property"
                            (ldb/journal? p) "journal"
                            :else "page")
                     color (page-graph-node-color dark? kind current-page?)
                     n (get page-links page-title 1)
                     size (int (* 8 (max 1.0 (js/Math.cbrt n))))]
                 {:id (str (:db/id p))
                  :db-id (:db/id p)
                  :uuid (some-> (:block/uuid p) str)
                  :page? true
                  :label page-title
                  :kind kind
                  :size size
                  :color color
                  :block/created-at (:block/created-at p)})
               (do
                 (log/error :graph/page-missing-title {:page p})
                 nil))))
     vec)))

(defn- page-kind
  [tag-idents]
  (cond
    (contains? tag-idents :logseq.class/Tag) "tag"
    (contains? tag-idents :logseq.class/Property) "property"
    (contains? tag-idents :logseq.class/Journal) "journal"
    :else "page"))

(defn- page-graph-node-color
  [dark? kind current-page?]
  (cond
    current-page?
    (if dark? "#93C5FD" "#2563EB")

    (= kind "tag")
    (if dark? "#A78BFA" "#8B5CF6")

    (= kind "property")
    (if dark? "#F0B891" "#D97706")

    (= kind "journal")
    (if dark? "#7DD3FC" "#0284C7")

    :else
    (if dark? "#9CA3AF" "#CBD5E1")))

(defn- tag-ident-by-id
  [db tag-ids]
  (into {}
        (keep (fn [tag-id]
                (when-let [ident (:db/ident (d/entity db tag-id))]
                  [tag-id ident])))
        tag-ids))

(defn- build-page-id->tag-idents
  [tagged-pages tag-id->ident]
  (reduce
   (fn [m [page-id tag-id]]
     (if-let [ident (get tag-id->ident tag-id)]
       (update m page-id (fnil conj #{}) ident)
       m))
   {}
   tagged-pages))

(defn- page-relation-links
  [db with-journal? page-id->tag-idents]
  (let [ref-datoms (vec (d/datoms db :avet :block/refs))
        page-id-by-block-id (entity-value-map db
                                              :block/page
                                              (set (map :e ref-datoms)))]
    (keep
     (fn [{block-id :e ref-page-id :v}]
       (let [page-id (get page-id-by-block-id block-id)]
         (when (and page-id
                    (or with-journal?
                        (not (contains? (get page-id->tag-idents page-id)
                                        :logseq.class/Journal))))
           [page-id ref-page-id])))
     ref-datoms)))

(defn- property-page?
  [tag-idents]
  (contains? tag-idents :logseq.class/Property))

(defn- tagged-page-links
  [db]
  (map (fn [{from-id :e tag-id :v}]
         [from-id tag-id])
       (d/datoms db :avet :block/tags)))

(defn- page-tag-links
  [tagged-links page-id-set]
  (filter (fn [[from-id _tag-id]]
            (contains? page-id-set from-id))
          tagged-links))

(defn- rendered-page-tag-links
  [tagged-links page-id-set]
  (filter (fn [[from-id tag-id]]
            (and (contains? page-id-set from-id)
                 (contains? page-id-set tag-id)))
          tagged-links))

(defn- show-orphan-pages?
  [orphan-pages?]
  (not (false? orphan-pages?)))

(defn- bounded-visible-page-links
  [db visible-page-ids tagged-pages]
  (let [tag-links (->> tagged-pages
                       (filter (fn [[from-id tag-id]]
                                 (and (contains? visible-page-ids from-id)
                                      (contains? visible-page-ids tag-id))))
                       distinct
                       vec)
        initial-linked-page-ids (set (mapcat identity tag-links))]
    (loop [datoms (seq (d/datoms db :avet :block/refs))
           links tag-links
           linked-page-ids initial-linked-page-ids]
      (if (nil? datoms)
        {:links (vec (take large-all-pages-link-limit links))
         :linked-page-ids linked-page-ids}
        (let [{block-id :e ref-page-id :v} (first datoms)
              page-id (some-> (d/entity db block-id) :block/page :db/id)
              visible-link? (and (contains? visible-page-ids page-id)
                                 (contains? visible-page-ids ref-page-id))
              link [page-id ref-page-id]]
          (recur (next datoms)
                 (if (and visible-link?
                          (< (count links) large-all-pages-link-limit))
                   (conj links link)
                   links)
                 (if visible-link?
                   (conj linked-page-ids page-id ref-page-id)
                   linked-page-ids)))))))

(defn- all-pages-visible-page?
  [{:keys [journal? orphan-pages? builtin-pages? excluded-pages? build-in-pages linked-page-ids]} page tag-idents]
  (and (graph-visible-entity? page)
       (not (property-page? tag-idents))
       (or journal?
           (not (contains? tag-idents :logseq.class/Journal)))
       (or excluded-pages?
           (not (excluded-from-graph? page)))
       (or builtin-pages?
           (not (contains? build-in-pages (:block/name page))))
       (or orphan-pages?
           (contains? linked-page-ids (:db/id page)))))

(declare normalize-page-name)
(declare remove-uuids-and-files!)

(defn- build-large-all-pages-graph
  [db {:keys [theme journal? orphan-pages? builtin-pages? excluded-pages?]} name-datoms]
  (let [dark? (dark-theme? theme)
        orphan-pages? (show-orphan-pages? orphan-pages?)
        page-ids (set (map :e name-datoms))
        tagged-pages (vec (page-tag-links (tagged-page-links db) page-ids))
        tag-id->ident (tag-ident-by-id db (set (map second tagged-pages)))
        page-id->tag-idents (build-page-id->tag-idents tagged-pages tag-id->ident)
        title-by-id (entity-title-map db page-ids)
        icon-by-id (entity-value-map db :logseq.property/icon page-ids)
        uuid-by-id (entity-value-map-by-id db :block/uuid page-ids)
        created-at-by-id (entity-value-map db :block/created-at page-ids)
        build-in-pages (->> sqlite-create-graph/built-in-pages-names
                            (map string/lower-case)
                            set)
        base-visible-page-ids (->> name-datoms
                                   (keep (fn [{page-id :e}]
                                           (let [page (d/entity db page-id)
                                                 tag-idents (get page-id->tag-idents page-id #{})]
                                             (when (all-pages-visible-page?
                                                    {:journal? journal?
                                                     :orphan-pages? true
                                                     :builtin-pages? builtin-pages?
                                                     :excluded-pages? excluded-pages?
                                                     :build-in-pages build-in-pages
                                                     :linked-page-ids #{page-id}}
                                                    page
                                                    tag-idents)
                                               page-id))))
                                   set)
        {raw-links :links linked-page-ids :linked-page-ids}
        (bounded-visible-page-links db base-visible-page-ids tagged-pages)
        property-link-tuples (property-ref-link-tuples db base-visible-page-ids :page :page)
        raw-links (vec (distinct (concat raw-links property-link-tuples)))
        linked-page-ids (set/union linked-page-ids (set (mapcat (juxt first second) property-link-tuples)))
        visible-page-ids (if orphan-pages?
                           base-visible-page-ids
                           (set/intersection base-visible-page-ids linked-page-ids))
        nodes (reduce
               (fn [nodes {page-id :e page-name :v}]
                 (let [tag-idents (get page-id->tag-idents page-id #{})
                       page (d/entity db page-id)
                       page-title (get title-by-id page-id page-name)]
                   (if (not (and (contains? visible-page-ids page-id)
                                 (all-pages-visible-page?
                                  {:journal? journal?
                                   :orphan-pages? true
                                   :builtin-pages? builtin-pages?
                                   :excluded-pages? excluded-pages?
                                   :build-in-pages build-in-pages
                                   :linked-page-ids visible-page-ids}
                                  page
                                  tag-idents)))
                     nodes
                     (let [id (str page-id)
                           color (if dark? "#93a1a1" "#999")]
                       (conj nodes
                             (cond->
                              {:id id
                               :db-id page-id
                               :uuid (some-> (get uuid-by-id page-id) str)
                               :page? true
                               :label page-title
                               :kind (page-kind tag-idents)
                               :size 8
                               :color color}
                               (contains? created-at-by-id page-id)
                               (assoc :block/created-at (get created-at-by-id page-id))

                               (contains? icon-by-id page-id)
                               (assoc :icon (get icon-by-id page-id))))))))
               []
               name-datoms)]
    (-> {:nodes nodes
         :links (build-links raw-links)}
        normalize-page-name
        (assoc :all-pages {:created-at-min 0
                           :created-at-max 0}))))

;; slow
(defn- uuid-or-asset?
  [label]
  (or (common-util/uuid-string? label)
      (string/starts-with? label "../assets/")
      (= label "..")
      (string/starts-with? label "assets/")
      (string/ends-with? label ".gif")
      (string/ends-with? label ".jpg")
      (string/ends-with? label ".png")))

(defn- remove-uuids-and-files!
  [nodes]
  (remove
   (fn [node] (uuid-or-asset? (:label node)))
   nodes))

(defn- keep-links-with-nodes
  [links node-id-set]
  (filter (fn [{:keys [source target]}]
            (and (contains? node-id-set source)
                 (contains? node-id-set target)))
          links))

(defn- normalize-page-name
  [{:keys [nodes links]}]
  (let [nodes' (->> (remove-uuids-and-files! nodes)
                    (common-util/distinct-by (fn [node] (:id node)))
                    (remove nil?))
        node-id-set (set (map :id nodes'))
        links' (keep-links-with-nodes links node-id-set)]
    {:nodes nodes'
     :links links'}))

(defn- all-pages-visible-page-id?
  [{:keys [journal? orphan-pages? builtin-pages? excluded-pages?
           hidden-page-ids excluded-page-ids build-in-pages linked-page-ids]}
   page-id page-name tag-idents]
  (and (not (contains? hidden-page-ids page-id))
       (not (property-page? tag-idents))
       (or journal?
           (not (contains? tag-idents :logseq.class/Journal)))
       (or excluded-pages?
           (not (contains? excluded-page-ids page-id)))
       (or builtin-pages?
           (not (contains? build-in-pages page-name)))
       (or orphan-pages?
           (contains? linked-page-ids page-id))))

(defn- build-all-pages-node
  [{:keys [dark? page-links title-by-id uuid-by-id icon-by-id created-at-by-id page-id->tag-idents]}
   {page-id :e page-name :v}]
  (when-let [page-title (get title-by-id page-id page-name)]
    (let [created-at (get created-at-by-id page-id)
          tag-idents (get page-id->tag-idents page-id #{})
          kind (page-kind tag-idents)
          color (page-graph-node-color dark? kind false)
          n (get page-links (str page-id) 1)
          size (int (* 8 (max 1.0 (js/Math.cbrt n))))]
      (cond->
       {:id (str page-id)
        :db-id page-id
        :uuid (some-> (get uuid-by-id page-id) str)
        :page? true
        :label page-title
        :kind kind
        :size size
        :color color
        :block/created-at created-at}
        (nil? created-at)
        (dissoc :block/created-at)

        (contains? icon-by-id page-id)
        (assoc :icon (get icon-by-id page-id))))))

(defn- build-all-pages-graph
  [db {:keys [theme journal? orphan-pages? builtin-pages? excluded-pages? created-at-filter]}]
  (let [name-datoms (vec (d/datoms db :avet :block/name))]
    (if (and (nil? created-at-filter)
             (>= (count name-datoms) large-all-pages-fast-threshold))
      (build-large-all-pages-graph db
                                   {:theme theme
                                    :journal? journal?
                                    :orphan-pages? orphan-pages?
                                    :builtin-pages? builtin-pages?
                                    :excluded-pages? excluded-pages?}
                                   name-datoms)
      (let [dark? (dark-theme? theme)
            orphan-pages? (show-orphan-pages? orphan-pages?)
            name-page-ids (set (map :e name-datoms))
            hidden-name-page-ids (set/union (entity-ids-with db :logseq.property/hide? true)
                                            (entity-ids-with db :logseq.property/deleted-at))
            ident-by-name-page-id (entity-value-map-by-id db :db/ident name-page-ids)
            name-datoms (vec (remove (fn [{page-id :e}]
                                       (or (contains? hidden-name-page-ids page-id)
                                           (contains? db-class/internal-tags
                                                      (get ident-by-name-page-id page-id))))
                                     name-datoms))
            page-id-set (set (map :e name-datoms))
            title-by-id (entity-title-map db page-id-set)
            uuid-by-id (entity-value-map-by-id db :block/uuid page-id-set)
            icon-by-id (entity-value-map db :logseq.property/icon page-id-set)
            created-at-by-id (entity-value-map db :block/created-at page-id-set)
            tagged-pages (vec (page-tag-links (tagged-page-links db) page-id-set))
            rendered-tagged-pages (vec (rendered-page-tag-links tagged-pages page-id-set))
            property-link-tuples (property-ref-link-tuples db page-id-set :page :page)
            tag-id->ident (tag-ident-by-id db (set (map second tagged-pages)))
            page-id->tag-idents (build-page-id->tag-idents tagged-pages tag-id->ident)
            relation (page-relation-links db journal? page-id->tag-idents)
            links (concat relation rendered-tagged-pages property-link-tuples)
            linked (set (mapcat (juxt first second) links))
            build-in-pages (->> sqlite-create-graph/built-in-pages-names
                                (map string/lower-case)
                                set)
            excluded-page-ids (entity-ids-with db :logseq.property/exclude-from-graph-view true)
            visibility-opts {:journal? journal?
                             :orphan-pages? orphan-pages?
                             :builtin-pages? builtin-pages?
                             :excluded-pages? excluded-pages?
                             :hidden-page-ids hidden-name-page-ids
                             :excluded-page-ids excluded-page-ids
                             :build-in-pages build-in-pages
                             :linked-page-ids linked}
            links (map (fn [[x y label]] [(str x) (str y) label]) links)
            page-links (reduce (fn [m [k v]] (-> (update m k inc)
                                                 (update v inc))) {} links)
            links (build-links links)
            created-ats (vals created-at-by-id)
            created-at-min (if (seq created-ats) (apply min created-ats) 0)
            created-at-max (if (seq created-ats) (apply max created-ats) 0)
            created-at-cutoff (when created-at-filter
                                (+ created-at-min created-at-filter))
            node-context {:dark? dark?
                          :page-links page-links
                          :title-by-id title-by-id
                          :uuid-by-id uuid-by-id
                          :icon-by-id icon-by-id
                          :created-at-by-id created-at-by-id
                          :page-id->tag-idents page-id->tag-idents}
            nodes (reduce
                   (fn [nodes {page-id :e page-name :v}]
                     (let [created-at (get created-at-by-id page-id)
                           tag-idents (get page-id->tag-idents page-id #{})]
                       (if (or (and created-at-cutoff
                                    created-at
                                    (> created-at created-at-cutoff))
                               (not (all-pages-visible-page-id?
                                     visibility-opts page-id page-name tag-idents)))
                         nodes
                         (if-let [node (build-all-pages-node
                                        node-context
                                        {:e page-id :v page-name})]
                           (conj nodes node)
                           nodes))))
                   []
                   name-datoms)]
        (-> {:nodes nodes
             :links links}
            normalize-page-name
            (assoc :all-pages
                   {:created-at-min created-at-min
                    :created-at-max created-at-max}))))))

(defn- build-global-graph
  [db {:keys [view-mode] :as opts}]
  (let [view-mode (normalize-view-mode view-mode)
        result (case view-mode
                 :tags-and-objects
                 (build-tags-and-objects-graph db)
                 :all-pages
                 (build-all-pages-graph db opts))]
    (assoc result :meta {:view-mode view-mode})))

(defn get-pages-that-mentioned-page
  [db page-id include-journals?]
  (let [pages (ldb/page-alias-set db page-id)
        mentioned-pages (->>
                         (mapcat
                          (fn [id]
                            (let [page (d/entity db id)]
                              (->> (:block/_refs page)
                                   (keep (fn [ref]
                                           (if (ldb/page? ref)
                                             page
                                             (:block/page ref)))))))
                          pages)
                         (common-util/distinct-by :db/id))]
    (keep (fn [page]
            (when-not (and (not include-journals?) (ldb/journal? page))
              (:db/id page)))
          mentioned-pages)))

(defn get-page-referenced-pages
  [db page-id]
  (let [pages (ldb/page-alias-set db page-id)
        ref-pages (d/q
                   '[:find [?ref-page ...]
                     :in $ ?pages
                     :where
                     [(untuple ?pages) [?page ...]]
                     [?block :block/page ?page]
                     [?block :block/refs ?ref-page]]
                   db
                   pages)]
    ref-pages))

(defn- build-page-graph-other-page-links [db other-pages* show-journal]
  (let [other-pages (->> other-pages*
                         (remove nil?)
                         (set))]
    (mapcat
     (fn [page-id]
       (let [ref-pages (-> (get-page-referenced-pages db page-id)
                           (set)
                           (set/intersection other-pages))
             mentioned-pages (-> (get-pages-that-mentioned-page db page-id show-journal)
                                 (set)
                                 (set/intersection other-pages))]
         (concat
          (map (fn [p] [page-id p]) ref-pages)
          (map (fn [p] [p page-id]) mentioned-pages))))
     other-pages)))

(defn- build-page-graph
  [db page-uuid theme show-journal]
  (when-let [page-entity (and page-uuid (d/entity db [:block/uuid page-uuid]))]
    (let [dark? (dark-theme? theme)
          page-id (:db/id page-entity)
          tags (set (map :db/id (:block/tags page-entity)))
          tags (set (remove #(= page-id %) tags))
          ref-pages (get-page-referenced-pages db page-id)
          mentioned-pages (get-pages-that-mentioned-page db page-id show-journal)
          links (concat
                 (map (fn [ref-page]
                        [page-id ref-page]) ref-pages)
                 (map (fn [page]
                        [page-id page]) mentioned-pages)
                 (map (fn [tag]
                        [page-id tag])
                      tags))
          other-pages-links (build-page-graph-other-page-links db (concat ref-pages mentioned-pages) show-journal)
          links (->> (concat links other-pages-links)
                     (remove nil?)
                     (distinct)
                     (build-links))
          nodes (->> (concat
                      [page-id]
                      ref-pages
                      mentioned-pages
                      tags)
                     (remove nil?)
                     (map #(d/entity db %))
                     (common-util/distinct-by :db/id))
          nodes (->> (build-nodes dark? (:block/title page-entity) links tags nodes)
                     (mapv (fn [node]
                             (cond-> node
                               (= (:db-id node) page-id)
                               (assoc :root? true)))))]
      (normalize-page-name
       {:nodes nodes
        :links links}))))

(defn- build-block-graph
  "Builds a citation/reference graph for a given block uuid."
  [db block-uuid theme]
  (when-let [block (and (uuid? block-uuid) (d/entity db [:block/uuid block-uuid]))]
    (let [dark? (dark-theme? theme)
          ref-blocks (->> (concat (:block/_refs block) (:block/refs block))
                          (map (fn [b]
                                 (if (ldb/page? b) b (:block/page b))))
                          (remove (fn [node] (= (:db/id block) (:db/id node))))
                          (common-util/distinct-by :db/id))
          links (->> (map (fn [p] [(:db/id block) (:db/id p)]) ref-blocks)
                     (remove nil?)
                     (distinct)
                     (build-links))
          nodes (->> (cons block ref-blocks)
                     distinct)
          nodes (build-nodes dark? block links #{} nodes)]
      (normalize-page-name
       {:nodes nodes
        :links links}))))

(defn build-graph
  [db opts]
  (case (:type opts)
    :global (build-global-graph db opts)
    :block (build-block-graph db (:block/uuid opts) (:theme opts))
    :page (build-page-graph db (:block/uuid opts) (:theme opts) (:show-journal? opts))))
