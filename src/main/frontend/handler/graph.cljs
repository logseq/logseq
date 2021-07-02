(ns frontend.handler.graph
  (:require [frontend.db :as db]
            [clojure.string :as string]
            [frontend.util :as util]
            [frontend.date :as date]
            [frontend.state :as state]
            [clojure.set :as set]
            [medley.core :as medley]
            [frontend.db.default :as default-db]))

(defn- build-edges
  [edges]
  (map (fn [[from to]]
         {:source from
          :target to})
       edges))

(defn- get-connections
  [page edges]
  (count (filter (fn [{:keys [source target]}]
                   (or (= source page)
                       (= target page)))
                 edges)))

(defn- build-nodes
  [dark? current-page edges tags nodes]
  (let [pages (->> (set (flatten nodes))
                   (remove nil?))]
    (->>
     (mapv (fn [p]
             (when p
               (let [p (str p)
                     current-page? (= p current-page)
                     block? (and p (util/uuid-string? p))
                     color (if block?
                             "#1a6376"
                             (case [dark? current-page?] ; FIXME: Put it into CSS
                              [false false] "#333"
                              [false true]  "#045591"
                              [true false]  "#8abbbb"
                              [true true]   "#ffffff"))
                     color (if (contains? tags (string/lower-case (str p)))
                             (if dark? "orange" "green")
                             color)]
                 (let [size-v (js/Math.cbrt (get-connections (string/lower-case p) edges))
                       size (* (if (zero? size-v) 1 size-v) 8)]
                   {:id p
                    :label p
                    :size size
                    :style {:fill color
                            :stroke color}
                    :labelCfg {:style {:fill color}}}))))
           pages)
     (remove nil?))))

(defn- uuid-or-asset?
  [id]
  (let [id (str id)]
    (or (util/uuid-string? id)
       (string/starts-with? id "../assets/")
       (= id "..")
       (string/starts-with? id "assets/")
       (string/ends-with? id ".gif")
       (string/ends-with? id ".jpg")
       (string/ends-with? id ".png"))))

(defn- remove-uuids-and-files!
  [nodes]
  (remove
   (fn [node] (uuid-or-asset? (:id node)))
   nodes))

(defn- normalize-page-name
  [{:keys [nodes edges] :as g}]
  (let [all-pages (->> (set (apply concat
                                   [(map :id nodes)
                                    (map :source edges)
                                    (map :target edges)]))
                       (map string/lower-case))
        names (db/pull-many '[:block/name :block/original-name] (mapv (fn [page]
                                                                        (if (util/uuid-string? page)
                                                                          [:block/uuid (uuid page)]
                                                                          [:block/name page])) all-pages))
        names (zipmap (map (fn [x] (get x :block/name)) names)
                      (map (fn [x]
                             (get x :block/original-name (:block/name x))) names))
        nodes (mapv (fn [node] (assoc node :id (get names (:id node) (:id node)))) nodes)
        edges (->>
               edges
               (remove (fn [{:keys [source target]}]
                         (or (nil? source) (nil? target))))
               (mapv (fn [{:keys [source target]}]
                       (when (and (not (uuid-or-asset? source))
                                  (not (uuid-or-asset? target)))
                         {:source (get names (string/lower-case source))
                          :target (get names (string/lower-case target))})))
               (remove nil?)
               (remove (fn [{:keys [source target]}]
                         (or (nil? source) (nil? target)))))
        nodes (->> (remove-uuids-and-files! nodes)
                   (util/distinct-by #(string/lower-case (:id %))))]
    {:nodes nodes
     :edges edges}))

(defn build-global-graph
  [theme {:keys [journal? orphan-pages? builtin-pages?] :as settings}]
  (let [dark? (= "dark" theme)
        current-page (:block/name (db/get-current-page))]
    (when-let [repo (state/get-current-repo)]
      (let [relation (db/get-pages-relation repo journal?)
            tagged-pages (db/get-all-tagged-pages repo)
            tags (set (map second tagged-pages))
            all-pages (db/get-pages repo)
            edges (concat (seq relation)
                          (seq tagged-pages))
            linked (set (flatten edges))
            nodes (cond->> all-pages
                          (not journal?)
                          (remove date/valid-journal-title?)

                          (not builtin-pages?)
                          (remove (fn [p] (default-db/built-in-pages-names (string/upper-case p))))

                          (not orphan-pages?)
                          (filter #(contains? linked (string/lower-case %))))
            edges (build-edges (remove (fn [[_ to]] (nil? to)) edges))
            nodes (build-nodes dark? current-page edges tags nodes)]
        (normalize-page-name
         {:nodes nodes
          :edges edges})))))

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
            edges (concat
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
            other-pages-edges (mapcat
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
            edges (->> (concat edges other-pages-edges)
                       (remove nil?)
                       (distinct)
                       (build-edges))
            nodes (->> (concat
                        [page]
                        (map first ref-pages)
                        (map first mentioned-pages)
                        tags)
                       (remove nil?)
                       (distinct)
                       (build-nodes dark? page edges (set tags)))]
        (normalize-page-name
         {:nodes nodes
          :edges edges})))))

(defn build-block-graph
  "Builds a citation/reference graph for a given block uuid."
  [block theme]
  (let [dark? (= "dark" theme)]
    (when-let [repo (state/get-current-repo)]
      (let [ref-blocks (db/get-block-referenced-blocks block)
            edges (concat
                   (map (fn [[p aliases]]
                          [block p]) ref-blocks))
            other-blocks (->> (concat (map first ref-blocks))
                              (remove nil?)
                              (set))
            other-blocks-edges (mapcat
                                (fn [block]
                                  (let [ref-blocks (-> (map first (db/get-block-referenced-blocks block))
                                                       (set)
                                                       (set/intersection other-blocks))]
                                    (concat
                                     (map (fn [p] [block p]) ref-blocks))))
                                other-blocks)
            edges (->> (concat edges other-blocks-edges)
                       (remove nil?)
                       (distinct)
                       (build-edges))
            nodes (->> (concat
                        [block]
                        (map first ref-blocks))
                       (remove nil?)
                       (distinct)
                       ;; FIXME: get block tags
                       (build-nodes dark? block edges #{}))]
        (normalize-page-name
         {:nodes nodes
          :edges edges})))))

(defn n-hops
  "Get all nodes that are n hops from nodes (a collection of node ids)"
  [{:keys [edges] :as graph} nodes level]
  (def graph graph)
  (def nodes nodes)
  (def level level)
  (let [edges (group-by :source edges)
        nodes (loop [nodes nodes
                     level level]
                (if (zero? level)
                  nodes
                  (recur (distinct (apply concat nodes
                                     (map
                                       (fn [id]
                                         (->> (get edges id) (map :target)))
                                       nodes)))
                         (dec level))))
        nodes (set nodes)]
    (update graph :nodes
            (fn [full-nodes]
              (filter (fn [node] (contains? nodes (:id node)))
                      full-nodes)))))
