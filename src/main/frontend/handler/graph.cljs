(ns frontend.handler.graph
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.db.default :as default-db]
            [frontend.state :as state]
            [frontend.util :as util]))

(defn- build-links
  [links]
  (map (fn [[from to]]
         {:source from
          :target to})
       links))

(defn- get-connections
  [page links]
  (count (filter (fn [{:keys [source target]}]
                   (or (= source page)
                       (= target page)))
                 links)))

(defn- build-nodes
  [dark? current-page page-links tags nodes namespaces]
  (let [parents (set (map last namespaces))
        current-page (or current-page "")
        pages (->> (set (flatten nodes))
                   (remove nil?))]
    (->>
     (mapv (fn [p]
             (when p
               (let [p (str p)
                     current-page? (= p current-page)
                     color (case [dark? current-page?] ; FIXME: Put it into CSS
                             [false false] "#999"
                             [false true]  "#045591"
                             [true false]  "#93a1a1"
                             [true true]   "#ffffff")
                     color (if (contains? tags p)
                             (if dark? "orange" "green")
                             color)]
                 (let [n (get page-links p 1)
                       size-v (if (> n 2)
                                (js/Math.cbrt n)
                                n)
                       size-v (if (< size-v 1)
                                1
                                (int size-v))
                       size (* size-v 8)]
                   (cond->
                     {:id p
                      :label p
                      :size size
                      :color color}
                     (contains? parents p)
                     (assoc :parent true))))))
           pages)
     (remove nil?))))

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
  [{:keys [nodes links page-name->original-name]}]
  (let [links (->>
               (map
                 (fn [{:keys [source target]}]
                   (let [source (get page-name->original-name source)
                         target (get page-name->original-name target)]
                     (when (and source target)
                       {:source source :target target})))
                 links)
               (remove nil?))
        nodes (->> (remove-uuids-and-files! nodes)
                   (util/distinct-by (fn [node] (:id node)))
                   (map (fn [node]
                          (if-let [original-name (get page-name->original-name (:id node))]
                            (assoc node :id original-name :label original-name)
                            nil)))
                   (remove nil?))]
    {:nodes nodes
     :links links}))

(defn build-global-graph
  [theme {:keys [journal? orphan-pages? builtin-pages?] :as settings}]
  (let [dark? (= "dark" theme)
        current-page (or (:block/name (db/get-current-page)) "")]
    (when-let [repo (state/get-current-repo)]
      (let [relation (db/get-pages-relation repo journal?)
            tagged-pages (db/get-all-tagged-pages repo)
            namespaces (db/get-all-namespace-relation repo)
            tags (set (map second tagged-pages))
            full-pages (db/get-all-pages repo)
            get-original-name (fn [p] (or (:block/original-name p) (:block/name p)))
            all-pages (map get-original-name full-pages)
            page-name->original-name (zipmap (map :block/name full-pages) all-pages)
            pages-after-journal-filter (if-not journal?
                                         (remove :block/journal? full-pages)
                                         full-pages)
            links (concat (seq relation)
                          (seq tagged-pages)
                          (seq namespaces))
            linked (set (flatten links))
            nodes (cond->> (map :block/name pages-after-journal-filter)
                    (not builtin-pages?)
                    (remove (fn [p] (default-db/built-in-pages-names (string/upper-case p))))
                    (not orphan-pages?)
                    (filter #(contains? linked (string/lower-case %))))
            page-links (reduce (fn [m [k v]] (-> (update m k inc)
                                                 (update v inc))) {} links)
            links (build-links (remove (fn [[_ to]] (nil? to)) links))
            nodes (build-nodes dark? (string/lower-case current-page) page-links tags nodes namespaces)]
        (normalize-page-name
         {:nodes nodes
          :links links
          :page-name->original-name page-name->original-name})))))

(defn build-page-graph
  [page theme]
  (let [dark? (= "dark" theme)]
    (when-let [repo (state/get-current-repo)]
      (let [page (string/lower-case page)
            page-entity (db/entity [:block/name page])
            original-page-name (:block/original-name page-entity)
            tags (:tags (:block/properties page-entity))
            tags (remove #(= page %) tags)
            ref-pages (db/get-page-referenced-pages repo page)
            mentioned-pages (db/get-pages-that-mentioned-page repo page)
            namespaces (db/get-all-namespace-relation repo)
            links (concat
                   namespaces
                   (map (fn [[p aliases]]
                          [page p]) ref-pages)
                   (map (fn [[p aliases]]
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
                                 (let [ref-pages (-> (map first (db/get-page-referenced-pages repo page))
                                                     (set)
                                                     (set/intersection other-pages))
                                       mentioned-pages (-> (map first (db/get-pages-that-mentioned-page repo page))
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
            get-original-name (fn [p] (or (:block/original-name p)
                                         (:block/name p)))
            all-pages (map get-original-name full-pages)
            page-name->original-name (zipmap (map :block/name full-pages) all-pages)]
        (normalize-page-name
         {:nodes nodes
          :links links
          :page-name->original-name page-name->original-name})))))

(defn build-block-graph
  "Builds a citation/reference graph for a given block uuid."
  [block theme]
  (let [dark? (= "dark" theme)]
    (when-let [repo (state/get-current-repo)]
      (let [ref-blocks (db/get-block-referenced-blocks block)
            namespaces (db/get-all-namespace-relation repo)
            links (concat
                   (map (fn [[p aliases]]
                          [block p]) ref-blocks)
                   namespaces)
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
            links (->> (concat links other-blocks-links)
                       (remove nil?)
                       (distinct)
                       (build-links))
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
