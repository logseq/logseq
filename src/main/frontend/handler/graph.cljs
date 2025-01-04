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
            [logseq.db :as ldb]))

(defn- build-links
  [links]
  (keep (fn [[from to]]
          (when (and from to)
            {:source (str from)
             :target (str to)}))
        links))

(defn- build-nodes
  [dark? current-page page-links tags nodes namespaces]
  (let [parents (set (map last namespaces))
        current-page (or current-page "")
        pages (util/distinct-by :db/id nodes)]
    (->>
     pages
     (remove nil?)
     (mapv (fn [p]
             (let [page-title (:block/title p)
                   current-page? (= page-title current-page)
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
                 :label page-title
                 :size size
                 :color color
                 :block/created-at (:block/created-at p)}
                 (contains? parents (:db/id p))
                 (assoc :parent true))))))))

                  ;; slow
(defn- uuid-or-asset?
  [label]
  (or (util/uuid-string? label)
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

(defn- normalize-page-name
  [{:keys [nodes links]}]
  (let [nodes' (->> (remove-uuids-and-files! nodes)
                    (util/distinct-by (fn [node] (:id node)))
                    (remove nil?))]
    {:nodes nodes'
     :links links}))

(defn build-global-graph
  [theme {:keys [journal? orphan-pages? builtin-pages? excluded-pages? created-at-filter]}]
  (let [dark? (= "dark" theme)
        current-page (or (:block/name (db/get-current-page)) "")]
    (when-let [repo (state/get-current-repo)]
      (let [relation (db/get-pages-relation repo journal?)
            tagged-pages (db-model/get-all-tagged-pages repo)
            namespaces (db/get-all-namespace-relation repo)
            tags (set (map second tagged-pages))
            full-pages (db/get-all-pages repo)
            db-based? (config/db-based-graph? repo)
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
            links (concat relation tagged-pages namespaces)
            linked (set (mapcat identity links))
            build-in-pages (->> (if db-based? sqlite-create-graph/built-in-pages-names gp-db/built-in-pages-names)
                                (map string/lower-case)
                                set)
            nodes (cond->> full-pages'
                    (not builtin-pages?)
                    (remove #(contains? build-in-pages (:block/name %)))
                    (not orphan-pages?)
                    (filter #(contains? linked (:db/id %))))
            links (map (fn [[x y]] [(str x) (str y)]) links)
            page-links (reduce (fn [m [k v]] (-> (update m k inc)
                                                 (update v inc))) {} links)
            links (build-links links)
            nodes (build-nodes dark? (string/lower-case current-page) page-links tags nodes namespaces)]
        (-> {:nodes nodes
             :links links}
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
            tags (when (config/db-based-graph? repo)
                   (set (map :db/id (:block/tags page-entity))))
            tags (set (remove #(= page-id %) tags))
            ref-pages (db/get-page-referenced-pages repo page-id)
            mentioned-pages (db/get-pages-that-mentioned-page repo page-id show-journal)
            namespaces (db/get-all-namespace-relation repo)
            links (concat
                   namespaces
                   (map (fn [ref-page]
                          [page-id ref-page]) ref-pages)
                   (map (fn [page]
                          [page-id page]) mentioned-pages)
                   (map (fn [tag]
                          [page-id tag])
                        tags))
            other-pages (->> (concat ref-pages mentioned-pages)
                             (remove nil?)
                             (set))
            other-pages-links (mapcat
                               (fn [page-id]
                                 (let [ref-pages (-> (db/get-page-referenced-pages repo page-id)
                                                     (set)
                                                     (set/intersection other-pages))
                                       mentioned-pages (-> (db/get-pages-that-mentioned-page repo page-id show-journal)
                                                           (set)
                                                           (set/intersection other-pages))]
                                   (concat
                                    (map (fn [p] [page-id p]) ref-pages)
                                    (map (fn [p] [p page-id]) mentioned-pages))))
                               other-pages)
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
                       (map db/entity)
                       (util/distinct-by :db/id))
            nodes (build-nodes dark? page links tags nodes namespaces)]
        (normalize-page-name
         {:nodes nodes
          :links links})))))

(defn build-block-graph
  "Builds a citation/reference graph for a given block uuid."
  [block-uuid theme]
  (when-let [repo (state/get-current-repo)]
    (when-let [block (and (uuid? block-uuid) (db/entity [:block/uuid block-uuid]))]
      (let [dark? (= "dark" theme)
            ref-blocks (->> (concat (:block/_refs block) (:block/refs block))
                            (map (fn [b]
                                   (if (ldb/page? b) b (:block/page b))))
                            (remove (fn [node] (= (:db/id block) (:db/id node))))
                            (util/distinct-by :db/id))
            namespaces (db/get-all-namespace-relation repo)
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
          :links links})))))

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
