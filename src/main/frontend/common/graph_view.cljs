(ns frontend.common.graph-view
  "Main namespace for graph view fns."
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]))

(defn- build-links
  [links]
  (keep (fn [[from to]]
          (when (and from to)
            {:source (str from)
             :target (str to)}))
        links))

(defn- normalize-view-mode
  [view-mode]
  (if (= view-mode :all-pages)
    :all-pages
    :tags-and-objects))

(def ^:private large-all-pages-fast-threshold 10000)

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
  (persistent!
   (reduce (fn [m {id :e value :v}]
             (if (contains? ids id)
               (let [m (assoc! m id value)]
                 (if (= (count m) (count ids))
                   (reduced m)
                   m))
               m))
           (transient {})
           (datoms-for db :avet attr))))

(defn- entity-id-subset-with
  [db attr ids]
  (persistent!
   (reduce (fn [matches {id :e}]
             (if (contains? ids id)
               (conj! matches id)
               matches))
           (transient #{})
           (datoms-for db :avet attr))))

(defn- entity-id-set-with-true
  [db attr]
  (persistent!
   (reduce (fn [ids {id :e value :v}]
             (if (true? value)
               (conj! ids id)
               ids))
           (transient #{})
           (datoms-for db :avet attr))))

(defn- scalar-node
  [{:keys [title-by-id name-by-id uuid-by-id icon-by-id]} id kind page?]
  (let [title (get title-by-id id)
        name (get name-by-id id)
        uuid (get uuid-by-id id)
        icon (get icon-by-id id)]
    (cond->
     {:id (str id)
      :db-id id
      :uuid (some-> uuid str)
      :page? page?
      :label (or title name (some-> uuid str) (str id))
      :kind kind}
      (some? icon)
      (assoc :icon icon))))

(defn- build-node-context
  [db node-ids]
  (let [title-by-id (entity-value-map db :block/title node-ids)
        title-missing-ids (set/difference node-ids (set (keys title-by-id)))
        name-by-id (if (empty? title-missing-ids)
                     {}
                     (entity-value-map db :block/name title-missing-ids))
        name-missing-ids (set/difference title-missing-ids (set (keys name-by-id)))]
    {:title-by-id title-by-id
     :name-by-id name-by-id
     :uuid-by-id (if (empty? name-missing-ids)
                   {}
                   (entity-value-map db :block/uuid name-missing-ids))
     :icon-by-id (entity-value-map db :logseq.property/icon node-ids)}))

(defn- visible-object-id-set
  [hidden-ids deleted-ids class-ids property-ids object-ids]
  (->> object-ids
       (remove #(or (contains? hidden-ids %)
                    (contains? deleted-ids %)
                    (contains? class-ids %)
                    (contains? property-ids %)))
       set))

(defn- build-tags-and-objects-graph
  [db]
  (let [tag-datoms (vec (datoms-for db :avet :block/tags))
        class-ids (entity-ids-with db :block/tags :logseq.class/Tag)
        property-ids (entity-ids-with db :block/tags :logseq.class/Property)
        hidden-ids (entity-id-set-with-true db :logseq.property/hide?)
        deleted-ids (entity-ids-with db :logseq.property/deleted-at)
        built-in-ids (entity-id-set-with-true db :logseq.property/built-in?)
        tag-id-set (->> class-ids
                        (remove #(or (contains? hidden-ids %)
                                     (contains? deleted-ids %)
                                     (contains? built-in-ids %)
                                     (contains? property-ids %)))
                        set)]
    (if (empty? tag-id-set)
      {:nodes []
       :links []}
      (let [tag-links (->> tag-datoms
                           (keep (fn [{from-id :e tag-id :v}]
                                   (when (and (contains? tag-id-set tag-id)
                                              (not (contains? tag-id-set from-id)))
                                     [from-id tag-id])))
                           distinct
                           vec)
            object-ids (set (map first tag-links))
            object-id-set (visible-object-id-set hidden-ids deleted-ids class-ids property-ids object-ids)
            node-ids (set/union tag-id-set object-id-set)
            context (build-node-context db node-ids)
            page-ids (entity-id-subset-with db :block/name object-id-set)
            tags (mapv #(scalar-node context % "tag" true) tag-id-set)
            objects (mapv #(scalar-node context % "object" (contains? page-ids %))
                          object-id-set)
            nodes (into tags objects)
            links (->> tag-links
                       (filter (fn [[from-id _tag-id]]
                                 (contains? object-id-set from-id)))
                       (build-links)
                       vec)]
        {:nodes (vec nodes)
         :links links}))))

(defn- build-nodes
  [dark? current-page page-links tags nodes namespaces]
  (let [page-parents (set (map last namespaces))
        current-page (or current-page "")
        pages (common-util/distinct-by :db/id nodes)]
    (->>
     pages
     (remove ldb/hidden?)
     (remove nil?)
     (keep (fn [p]
             (if-let [page-title (:block/title p)]
               (let [current-page? (= page-title current-page)
                     color (case [dark? current-page?] ; FIXME: Put it into CSS
                             [false false] "#999"
                             [false true]  "#045591"
                             [true false]  "#93a1a1"
                             [true true]   "#ffffff")
                     color (if (contains? tags (:db/id p))
                             (if dark? "orange" "green")
                             color)
                     n (get page-links page-title 1)
                     size (int (* 8 (max 1.0 (js/Math.cbrt n))))]
                 (cond->
                  {:id (str (:db/id p))
                   :db-id (:db/id p)
                   :uuid (some-> (:block/uuid p) str)
                   :page? true
                   :label page-title
                   :kind (cond
                           (ldb/class? p) "tag"
                           (ldb/property? p) "property"
                           (ldb/journal? p) "journal"
                           :else "page")
                   :size size
                   :color color
                   :block/created-at (:block/created-at p)}
                   (contains? page-parents (:db/id p))
                   (assoc :parent true)))
               (js/console.error (str "Page doesn't have :block/title " p)))))
     vec)))

(defn- tag-ident-set
  [entity]
  (set (keep :db/ident (:block/tags entity))))

(defn- page-kind
  [tag-idents]
  (cond
    (contains? tag-idents :logseq.class/Tag) "tag"
    (contains? tag-idents :logseq.class/Property) "property"
    (contains? tag-idents :logseq.class/Journal) "journal"
    :else "page"))

(defn- build-page-node
  [dark? current-page page-links tags page-parents entity tag-idents]
  (when-let [page-title (:block/title entity)]
    (let [current-page? (= page-title (or current-page ""))
          color (case [dark? current-page?] ; FIXME: Put it into CSS
                  [false false] "#999"
                  [false true]  "#045591"
                  [true false]  "#93a1a1"
                  [true true]   "#ffffff")
          color (if (contains? tags (:db/id entity))
                  (if dark? "orange" "green")
                  color)
          n (get page-links (str (:db/id entity)) 1)
          size (int (* 8 (max 1.0 (js/Math.cbrt n))))]
      (cond->
       {:id (str (:db/id entity))
        :db-id (:db/id entity)
        :uuid (some-> (:block/uuid entity) str)
        :page? true
        :label page-title
        :kind (page-kind tag-idents)
        :size size
        :color color
        :block/created-at (:block/created-at entity)}
        (some? (:logseq.property/icon entity))
        (assoc :icon (:logseq.property/icon entity))
        (contains? page-parents (:db/id entity))
        (assoc :parent true)))))

(defn- tag-ident-by-id
  [db tag-ids]
  (into {}
        (keep (fn [tag-id]
                (when-let [ident (:db/ident (d/entity db tag-id))]
                  [tag-id ident])))
        tag-ids))

(defn- build-page-id->tag-idents
  [tagged-pages tag-ident-by-id]
  (reduce
   (fn [m [page-id tag-id]]
     (if-let [ident (get tag-ident-by-id tag-id)]
       (update m page-id (fnil conj #{}) ident)
       m))
   {}
   tagged-pages))

(defn- page-relation-links
  [db with-journal? page-id->tag-idents]
  (keep
   (fn [{block-id :e ref-page-id :v}]
     (let [block (d/entity db block-id)
           page (:block/page block)
           page-id (:db/id page)]
       (when (and page
                  (or with-journal?
                      (not (contains? (get page-id->tag-idents page-id)
                                      :logseq.class/Journal))))
         [page-id ref-page-id])))
   (d/datoms db :avet :block/refs)))

(defn- property-page?
  [tag-idents]
  (contains? tag-idents :logseq.class/Property))

(defn- tagged-page-links
  [db]
  (map (fn [{from-id :e tag-id :v}]
         [from-id tag-id])
       (d/datoms db :avet :block/tags)))

(declare remove-uuids-and-files!)

(defn- datom-entity-id-set
  ([db attr]
   (set (map :e (d/datoms db :avet attr))))
  ([db attr value]
   (set (map :e (d/datoms db :avet attr value)))))

(defn- build-large-all-pages-graph
  [db {:keys [theme journal? orphan-pages? builtin-pages? excluded-pages?]} name-datoms]
  (let [dark? (= "dark" theme)
        tagged-pages (vec (tagged-page-links db))
        tag-id->ident (tag-ident-by-id db (set (map second tagged-pages)))
        page-id->tag-idents (build-page-id->tag-idents tagged-pages tag-id->ident)
        page-ids (set (map :e name-datoms))
        icon-by-id (entity-value-map db :logseq.property/icon page-ids)
        tagged-page-ids (set (map first tagged-pages))
        build-in-pages (->> sqlite-create-graph/built-in-pages-names
                            (map string/lower-case)
                            set)
        hidden-page-ids (datom-entity-id-set db :logseq.property/hide? true)
        deleted-page-ids (datom-entity-id-set db :logseq.property/deleted-at)
        excluded-page-ids (datom-entity-id-set db :logseq.property/exclude-from-graph-view true)
        nodes (reduce
               (fn [nodes {page-id :e page-name :v}]
                 (let [tag-idents (get page-id->tag-idents page-id #{})]
                   (if (or (contains? hidden-page-ids page-id)
                           (contains? deleted-page-ids page-id)
                           (property-page? tag-idents)
                           (and (not journal?)
                                (contains? tag-idents :logseq.class/Journal))
                           (and (not excluded-pages?)
                                (contains? excluded-page-ids page-id))
                           (and (not builtin-pages?)
                                (contains? build-in-pages page-name))
                           (and (not orphan-pages?)
                                (not (contains? tagged-page-ids page-id))))
                     nodes
                     (let [id (str page-id)
                           color (if dark? "#93a1a1" "#999")]
                       (conj nodes
                             (cond->
                              {:id id
                               :db-id page-id
                               :page? true
                               :label page-name
                               :kind (page-kind tag-idents)
                               :size 8
                               :color color}
                               (contains? icon-by-id page-id)
                               (assoc :icon (get icon-by-id page-id))))))))
               []
               name-datoms)]
    {:nodes (vec (remove-uuids-and-files! nodes))
     :links []
     :all-pages {:created-at-min 0
                 :created-at-max 0}}))

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
      (let [dark? (= "dark" theme)
            tagged-pages (vec (tagged-page-links db))
            tag-id->ident (tag-ident-by-id db (set (map second tagged-pages)))
            page-id->tag-idents (build-page-id->tag-idents tagged-pages tag-id->ident)
            relation (page-relation-links db journal? page-id->tag-idents)
            ;; FIXME: Implement for DB graphs
            namespaces []
            tags (set (map second tagged-pages))
            full-pages (vec (ldb/get-all-pages db))
            created-ats (map :block/created-at full-pages)
            links (concat relation tagged-pages namespaces)
            linked (set (mapcat identity links))
            build-in-pages (->> sqlite-create-graph/built-in-pages-names
                                (map string/lower-case)
                                set)
            links (map (fn [[x y]] [(str x) (str y)]) links)
            page-links (reduce (fn [m [k v]] (-> (update m k inc)
                                                 (update v inc))) {} links)
            links (build-links links)
            created-at-min (apply min created-ats)
            created-at-max (apply max created-ats)
            created-at-cutoff (when created-at-filter
                                (+ created-at-min created-at-filter))
            page-parents (set (map last namespaces))
            nodes (reduce
                   (fn [nodes page]
                     (let [tag-idents (get page-id->tag-idents (:db/id page) #{})]
                       (if (or (and created-at-cutoff
                               (> (:block/created-at page) created-at-cutoff))
                               (property-page? tag-idents)
                               (and (not journal?)
                                    (contains? tag-idents :logseq.class/Journal))
                               (and (not excluded-pages?)
                                    (true? (get page :logseq.property/exclude-from-graph-view)))
                               (and (not builtin-pages?)
                                    (contains? build-in-pages (:block/name page)))
                               (and (not orphan-pages?)
                                    (not (contains? linked (:db/id page)))))
                         nodes
                         (if-let [node (build-page-node dark?
                                                        nil
                                                        page-links
                                                        tags
                                                        page-parents
                                                        page
                                                        tag-idents)]
                           (conj nodes node)
                           nodes))))
                   []
                   full-pages)]
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
  (let [dark? (= "dark" theme)
        page-entity (d/entity db [:block/uuid page-uuid])
        page-id (:db/id page-entity)
        tags (set (map :db/id (:block/tags page-entity)))
        tags (set (remove #(= page-id %) tags))
        ref-pages (get-page-referenced-pages db page-id)
        mentioned-pages (get-pages-that-mentioned-page db page-id show-journal)
        ;; FIXME: Implement for DB graphs
        namespaces []
        links (concat
               namespaces
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
        nodes (build-nodes dark? (:block/title page-entity) links tags nodes namespaces)]
    (normalize-page-name
     {:nodes nodes
      :links links})))

(defn- build-block-graph
  "Builds a citation/reference graph for a given block uuid."
  [db block-uuid theme]
  (when-let [block (and (uuid? block-uuid) (d/entity db [:block/uuid block-uuid]))]
    (let [dark? (= "dark" theme)
          ref-blocks (->> (concat (:block/_refs block) (:block/refs block))
                          (map (fn [b]
                                 (if (ldb/page? b) b (:block/page b))))
                          (remove (fn [node] (= (:db/id block) (:db/id node))))
                          (common-util/distinct-by :db/id))
          ;; FIXME: Implement for DB graphs
          namespaces []
          links (->> (concat
                      namespaces
                      (map (fn [p] [(:db/id block) (:db/id p)]) ref-blocks))
                     (remove nil?)
                     (distinct)
                     (build-links))
          nodes (->> (cons block ref-blocks)
                     distinct
                       ;; FIXME: get block tags
                     )
          nodes (build-nodes dark? block links #{} nodes namespaces)]
      (normalize-page-name
       {:nodes nodes
        :links links}))))

(defn build-graph
  [db opts]
  (case (:type opts)
    :global (build-global-graph db opts)
    :block (build-block-graph db (:block/uuid opts) (:theme opts))
    :page (build-page-graph db (:block/uuid opts) (:theme opts) (:show-journal? opts))))
