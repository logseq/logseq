(ns frontend.handler.graph
  "Provides util handler fns for graph view"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.handler.property.util :as pu]
            [frontend.config :as config]
            [frontend.storage :as storage]
            [logseq.graph-parser.db :as gp-db]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [frontend.components.title :as title]))

(defn- build-links
  [links]
  (map (fn [[from to]]
         {:source from
          :target to})
       links))

(defn- build-nodes
  [dark? current-page page-links tags nodes namespaces]
  (let [parents (set (map last namespaces))
        current-page (or current-page "")
        pages (set (flatten nodes))]
    (->>
     pages
     (remove nil?)
     (mapv (fn [p]
             (let [p (str p)
                   current-page? (= p current-page)
                   color (case [dark? current-page?] ; FIXME: Put it into CSS
                           [false false] "#999"
                           [false true]  "#045591"
                           [true false]  "#93a1a1"
                           [true true]   "#ffffff")
                   color (if (contains? tags p)
                           (if dark? "orange" "green")
                           color)
                   n (get page-links p 1)
                   size (int (* 8 (max 1.0 (js/Math.cbrt n))))]
                (cond->
                  {:id p
                   :label p
                   :size size
                   :color color}
                  (contains? parents p)
                  (assoc :parent true))))))))

                  ;; slow
(defn- uuid-or-asset?
  [id]
  (or (util/uuid-string? id)
      (string/starts-with? id "../assets/")
      (= id "..")
      (string/starts-with? id "assets/")
      (string/ends-with? id ".gif")
      (string/ends-with? id ".jpg")
      (string/ends-with? id ".png")))

(defn- remove-uuids-and-files!
  [nodes]
  (remove
   (fn [node] (uuid-or-asset? (:id node)))
   nodes))

(defn- normalize-page-name
  [{:keys [nodes links page-name->title]}]
  (let [links (->>
               (map
                 (fn [{:keys [source target]}]
                   (let [source (get page-name->title source)
                         target (get page-name->title target)]
                     (when (and source target)
                       {:source source :target target})))
                 links)
               (remove nil?))
        nodes (->> (remove-uuids-and-files! nodes)
                   (util/distinct-by (fn [node] (:id node)))
                   (map (fn [node]
                          (if-let [title (get page-name->title (:id node))]
                            (assoc node :id title :label title)
                            nil)))
                   (remove nil?))]
    {:nodes nodes
     :links links}))

(defn build-global-graph
  [theme {:keys [journal? orphan-pages? builtin-pages? excluded-pages? created-at-filter]}]
  (let [dark? (= "dark" theme)
        current-page (or (:block/name (db/get-current-page)) "")]
    (when-let [repo (state/get-current-repo)]
      (let [relation (db/get-pages-relation repo journal?)
            tagged-pages (map (fn [[x y]] [x (common-util/page-name-sanity-lc y)]) (db-model/get-all-tagged-pages repo))
            namespaces (map (fn [[x y]] [x (common-util/page-name-sanity-lc y)]) (db/get-all-namespace-relation repo))
            tags (set (map second tagged-pages))
            full-pages (db/get-all-pages repo)
            full-pages-map (into {} (map (juxt :block/name identity) full-pages))
            all-pages (map title/block-unique-title full-pages)
            page-name->title (zipmap (map :block/name full-pages) all-pages)
            created-ats (map :block/created-at full-pages)

            ;; build up nodes
            full-pages'
            (cond->> full-pages
              created-at-filter
              (filter #(<= (:block/created-at %) (+ (apply min created-ats) created-at-filter)))
              (not journal?)
              (remove ldb/journal?)
              (not excluded-pages?)
              (remove (fn [p] (true? (pu/get-block-property-value p :logseq.property/exclude-from-graph-view)))))
            links (concat (seq relation)
                          (seq tagged-pages)
                          (seq namespaces))
            linked (set (flatten links))
            build-in-pages (->> (if (config/db-based-graph? repo) sqlite-create-graph/built-in-pages-names gp-db/built-in-pages-names)
                                (map string/lower-case)
                                set)
            nodes (cond->> (map :block/name full-pages')
                    (not builtin-pages?)
                    (remove (fn [p] (contains? build-in-pages (string/lower-case p))))
                    (not orphan-pages?)
                    (filter #(contains? linked (string/lower-case %))))

            page-links (reduce (fn [m [k v]] (-> (update m k inc)
                                                 (update v inc))) {} links)
            links (build-links (remove (fn [[_ to]] (nil? to)) links))
            nodes (build-nodes dark? (string/lower-case current-page) page-links tags nodes namespaces)]
        (-> {:nodes (map #(assoc % :block/created-at (get-in full-pages-map [(:id %) :block/created-at])) nodes)
             :links links
             :page-name->title page-name->title}
            normalize-page-name
            (assoc :all-pages
                   {:created-at-min (apply min created-ats)
                    :created-at-max (apply max created-ats)}))))))

(defn build-page-graph
  [page theme show-journal]
  (let [dark? (= "dark" theme)]
    (when-let [repo (state/get-current-repo)]
      (let [page-entity (db/get-page page)
            page-id (:db/id page-entity)
            tags (if (config/db-based-graph? repo)
                   (set (map #(:block/name (db/entity repo (:db/id %)))
                             (:block/tags page-entity)))
                   (:tags (:block/properties page-entity)))
            tags (remove #(= page %) tags)
            ref-pages (db/get-page-referenced-pages repo page-id)
            mentioned-pages (db/get-pages-that-mentioned-page repo page-id show-journal)
            namespaces (map (fn [[x y]] [x (common-util/page-name-sanity-lc y)]) (db/get-all-namespace-relation repo))
            links (concat
                   namespaces
                   (map (fn [[p _aliases]]
                          [page p]) ref-pages)
                   (map (fn [[p _aliases]]
                          [p page]) mentioned-pages)
                   (map (fn [tag]
                          [page tag])
                        tags))
            other-pages (->> (concat (map first ref-pages)
                                     (map first mentioned-pages))
                             (remove nil?)
                             (set))
            other-pages-links (mapcat
                               (fn [page]
                                 (let [page-id (:db/id (db/get-page page))
                                       ref-pages (-> (map first (db/get-page-referenced-pages repo page-id))
                                                     (set)
                                                     (set/intersection other-pages))
                                       mentioned-pages (-> (map first (db/get-pages-that-mentioned-page repo page-id show-journal))
                                                           (set)
                                                           (set/intersection other-pages))]
                                   (concat
                                    (map (fn [p] [page p]) ref-pages)
                                    (map (fn [p] [p page]) mentioned-pages))))
                               other-pages)
            links (->> (concat links other-pages-links)
                       (remove nil?)
                       (distinct)
                       (build-links))
            nodes (->> (concat
                        [page]
                        (map first ref-pages)
                        (map first mentioned-pages)
                        tags)
                       (remove nil?)
                       (distinct))
            nodes (build-nodes dark? page links (set tags) nodes namespaces)
            full-pages (db/get-all-pages repo)
            all-pages (map common-util/get-page-title full-pages)
            page-name->title (zipmap (map :block/name full-pages) all-pages)]
        (normalize-page-name
         {:nodes nodes
          :links links
          :page-name->title page-name->title})))))

(defn build-block-graph
  "Builds a citation/reference graph for a given block uuid."
  [block theme]
  (when-let [repo (state/get-current-repo)]
    (let [dark? (= "dark" theme)
          ref-blocks (db/get-block-referenced-blocks block)
          namespaces (map (fn [[x y]] [x (common-util/page-name-sanity-lc y)]) (db/get-all-namespace-relation repo))
          other-blocks (->> (concat (map first ref-blocks))
                            (remove nil?)
                            (set))
          other-blocks-links (mapcat
                              (fn [block]
                                (let [ref-blocks (-> (map first (db/get-block-referenced-blocks block))
                                                     (set)
                                                     (set/intersection other-blocks))]
                                  (concat
                                   (map (fn [p] [block p]) ref-blocks))))
                              other-blocks)
          links (concat
                 (->> other-blocks-links
                      (remove nil?)
                      (distinct)
                      (build-links))
                 namespaces)
          nodes (->> (concat
                      [block]
                      (map first ref-blocks))
                     (remove nil?)
                     (distinct)
                       ;; FIXME: get block tags
                     )
          nodes (build-nodes dark? block links #{} nodes namespaces)]
      (normalize-page-name
       {:nodes nodes
        :links links}))))

(defn n-hops
  "Get all nodes that are n hops from nodes (a collection of node ids)"
  [{:keys [links] :as graph} nodes level]
  (let [search-nodes (fn [forward?]
                       (let [links (group-by (if forward? :source :target) links)]
                         (loop [nodes nodes
                               level level]
                          (if (zero? level)
                            nodes
                            (recur (distinct (apply concat nodes
                                               (map
                                                 (fn [id]
                                                   (->> (get links id) (map (if forward? :target :source))))
                                                 nodes)))
                                   (dec level))))))
        nodes (concat (search-nodes true) (search-nodes false))
        nodes (set nodes)]
    (update graph :nodes
            (fn [full-nodes]
              (filter (fn [node] (contains? nodes (:id node)))
                      full-nodes)))))

(defn settle-metadata-to-local!
  [m]
  (when-let [repo (state/get-current-repo)]
    (try
      (let [k :ls-graphs-metadata
            ret (or (storage/get k) {})
            ret (update ret repo merge m {:_v (js/Date.now)})]
        (storage/set k ret))
      (catch js/Error e
        (js/console.warn e)))))

(defn get-metadata-local
  []
  (let [k :ls-graphs-metadata]
    (storage/get k)))
