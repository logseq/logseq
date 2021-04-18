(ns frontend.handler.graph
  (:require [frontend.db :as db]
            [clojure.string :as string]
            [frontend.util :as util]
            [frontend.date :as date]
            [frontend.state :as state]
            [clojure.set :as set]
            [medley.core :as medley]))

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
                              [false false] "#222222"
                              [false true]  "#045591"
                              [true false]  "#8abbbb"
                              [true true]   "#ffffff"))
                     color (if (contains? tags (string/lower-case (str p)))
                             (if dark? "orange" "green")
                             color)]
                 {:id p
                  :name p
                  :val (get-connections p edges)
                  :autoColorBy "group"
                  :group (js/Math.ceil (* (js/Math.random) 12))
                  :color color})))
           pages)
     (remove nil?))))

(defn- uuid-or-asset?
  [id]
  (or (util/uuid-string? id)
      (string/starts-with? id "../assets/")
      (= id "..")
      (string/starts-with? id "assets/")))

(defn- remove-uuids-and-files!
  [nodes]
  (remove
   (fn [node] (uuid-or-asset? (:id node)))
   nodes))

(defn- normalize-page-name
  [{:keys [nodes links] :as g}]
  (let [all-pages (->> (set (apply concat
                                   [(map :id nodes)
                                    (map :source links)
                                    (map :target links)]))
                       (map string/lower-case))
        names (db/pull-many '[:page/name :page/original-name] (mapv (fn [page] [:page/name page]) all-pages))
        names (zipmap (map :page/name names)
                      (map (fn [x] (get x :page/original-name (:page/name x))) names))
        nodes (mapv (fn [node] (assoc node :id (get names (:id node)))) nodes)
        links (->>
               (mapv (fn [{:keys [source target]}]
                       (when (and (not (uuid-or-asset? source))
                                  (not (uuid-or-asset? target)))
                         {:source (get names source)
                          :target (get names target)}))
                     links)
               (remove nil?))
        nodes (remove-uuids-and-files! nodes)]
    {:nodes nodes
     :links links}))

(defn build-global-graph
  [theme show-journal?]
  (let [dark? (= "dark" theme)
        current-page (:page/name (db/get-current-page))]
    (when-let [repo (state/get-current-repo)]
      (let [relation (db/get-pages-relation repo show-journal?)
            tagged-pages (db/get-all-tagged-pages repo)
            tags (set (map second tagged-pages))
            linked-pages (-> (concat
                              relation
                              tagged-pages)
                             flatten
                             set)
            all-pages (db/get-pages repo)
            other-pages (->> (remove linked-pages all-pages)
                             (remove nil?))
            other-pages (if show-journal? other-pages
                            (remove date/valid-journal-title? other-pages))
            other-pages (if (seq other-pages)
                          (map string/lower-case other-pages)
                          other-pages)
            nodes (concat (seq relation)
                          (seq tagged-pages)
                          (if (seq other-pages)
                            (map (fn [page]
                                   [page])
                                 other-pages)
                            []))
            edges (build-edges (remove
                                (fn [[_ to]]
                                  (nil? to))
                                nodes))
            nodes (build-nodes dark? current-page edges tags nodes)]
        (normalize-page-name
         {:nodes nodes
          :links edges})))))

(defn build-page-graph
  [page theme]
  (let [dark? (= "dark" theme)]
    (when-let [repo (state/get-current-repo)]
      (let [page (string/lower-case page)
            page-entity (db/entity [:page/name page])
            original-page-name (:page/original-name page-entity)
            tags (:tags (:page/properties page-entity))
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
          :links edges})))))

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
          :links edges})))))
