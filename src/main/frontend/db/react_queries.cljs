(ns frontend.db.react-queries
  (:require [frontend.util :as util]
            [frontend.db.declares :as declares]
            [frontend.db.utils :as db-utils]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.state :as state]
            [clojure.set :as set]
            [frontend.date :as date]))

(def react util/react)

;; Query atom of map of Key ([repo q inputs]) -> atom
;; TODO: replace with LRUCache, only keep the latest 20 or 50 items?
(defonce query-state (atom {}))

(def ^:dynamic *query-component*)

(defn add-q!
  [k query inputs result-atom transform-fn query-fn inputs-fn]
  (swap! query-state assoc k {:query query
                              :inputs inputs
                              :result result-atom
                              :transform-fn transform-fn
                              :query-fn query-fn
                              :inputs-fn inputs-fn})
  result-atom)

(defn remove-q!
  [k]
  (swap! query-state dissoc k))

(defn clear-query-state!
  []
  (reset! query-state {}))

(defn set-new-result!
  [k new-result]
  (when-let [result-atom (get-in @query-state [k :result])]
    (reset! result-atom new-result)))

;; query-components

(defonce query-components (atom {}))

(defn add-query-component!
  [key component]
  (swap! query-components update key
    (fn [components]
      (distinct (conj components component)))))

(defn remove-query-component!
  [component]
  (reset!
    query-components
    (->> (for [[k components] @query-components
               :let [new-components (remove #(= component %) components)]]
           (if (empty? new-components) ; no subscribed components
             (do (remove-q! k)
                 nil)
             [k new-components]))
      (keep identity)
      (into {}))))

(defn clear-query-state-without-refs-and-embeds!
  []
  (let [state @query-state
        state (->> (filter (fn [[[_repo k] v]]
                             (contains? #{:blocks :block/block :custom} k)) state)
                (into {}))]
    (reset! query-state state)))

(defn q
  [repo k {:keys [use-cache? files-db? transform-fn query-fn inputs-fn]
           :or {use-cache? true
                files-db? false
                transform-fn identity}} query & inputs]
  (let [kv? (and (vector? k) (= :kv (first k)))
        k (vec (cons repo k))]
    (when-let [conn (if files-db?
                      (when-let [files-conn (declares/get-files-conn repo)]
                        (deref files-conn))
                      (declares/get-conn repo))]
      (let [result-atom (:result (get @query-state k))]
        (when-let [component *query-component*]
          (add-query-component! k component))
        (if (and use-cache? result-atom)
          result-atom
          (let [result (cond
                         query-fn
                         (query-fn conn)

                         inputs-fn
                         (let [inputs (inputs-fn)]
                           (apply d/q query conn inputs))

                         kv?
                         (d/entity conn (last k))

                         (seq inputs)
                         (apply d/q query conn inputs)

                         :else
                         (d/q query conn))
                result (transform-fn result)
                result-atom (or result-atom (atom nil))]
            ;; Don't notify watches now
            (set! (.-state result-atom) result)
            (add-q! k query inputs result-atom transform-fn query-fn inputs-fn)))))))

(defn get-block-referenced-blocks
  [block-uuid]
  (when-let [repo (state/get-current-repo)]
    (when (declares/get-conn repo)
      (->> (q repo [:block/refed-blocks block-uuid] {}
             '[:find (pull ?ref-block [*])
               :in $ ?block-uuid
               :where
               [?block :block/uuid ?block-uuid]
               [?ref-block :block/ref-blocks ?block]]
             block-uuid)
        react
        db-utils/seq-flatten
        db-utils/sort-blocks
        db-utils/group-by-page))))

(defn get-file
  ([path]
   (get-file (state/get-current-repo) path))
  ([repo path]
   (when (and repo path)
     (->
       (q repo [:file/content path]
         {:files-db? true
          :use-cache? true}
         '[:find ?content
           :in $ ?path
           :where
           [?file :file/path ?path]
           [?file :file/content ?content]]
         path)
       react
       ffirst))))

(defn get-page-blocks-cache-atom
  [repo page-id]
  (:result (get @query-state [repo :page/blocks page-id])))

(defn get-block-blocks-cache-atom
  [repo block-id]
  (:result (get @query-state [repo :block/block block-id])))

(defn remove-custom-query!
  [repo query]
  (remove-q! [repo :custom query]))

(defn query-entity-in-component
  ([id-or-lookup-ref]
   (db-utils/entity (state/get-current-repo) id-or-lookup-ref))
  ([repo id-or-lookup-ref]
   (let [k [:entity id-or-lookup-ref]
         result-atom (:result (get @query-state k))]
     (when-let [component *query-component*]
       (add-query-component! k component))
     (when-let [db (declares/get-conn repo)]
       (let [result (d/entity db id-or-lookup-ref)
             result-atom (or result-atom (atom nil))]
         (set! (.-state result-atom) result)
         (add-q! k nil nil result-atom identity identity identity))))))

(defn sub-key-value
  ([key]
   (sub-key-value (state/get-current-repo) key))
  ([repo-url key]
   (when (declares/get-conn repo-url)
     (-> (q repo-url [:kv key] {} key key)
         react
         key))))

(defn pull-block
  [id]
  (let [repo (state/get-current-repo)]
    (when (declares/get-conn repo)
      (->
        (q repo [:blocks id] {}
          '[:find (pull ?block [*])
            :in $ ?id
            :where
            [?block :block/uuid ?id]]
          id)
        react
        ffirst))))

(defn get-custom-css
  []
  (get-file "logseq/custom.css"))

(defn get-date-scheduled-or-deadlines
  [journal-title]
  (when-let [date (date/journal-title->int journal-title)]
    (when-let [repo (state/get-current-repo)]
      (when-let [conn (declares/get-conn repo)]
        (->> (q repo [:custom :scheduled-deadline journal-title] {}
               '[:find (pull ?block [*])
                 :in $ ?day
                 :where
                 (or
                   [?block :block/scheduled ?day]
                   [?block :block/deadline ?day])]
               date)
          react
          db-utils/seq-flatten
          db-utils/sort-blocks
          db-utils/group-by-page
          (remove (fn [[page _blocks]]
                    (= journal-title (:page/original-name page)))))))))

(defn build-block-graph
  "Builds a citation/reference graph for a given block uuid."
  [block theme]
  (let [dark? (= "dark" theme)]
    (when-let [repo (state/get-current-repo)]
      (let [ref-blocks (get-block-referenced-blocks block)
            edges (concat
                    (map (fn [[p aliases]]
                           [block p]) ref-blocks))
            other-blocks (->> (concat (map first ref-blocks))
                           (remove nil?)
                           (set))
            other-blocks-edges (mapcat
                                 (fn [block]
                                   (let [ref-blocks (-> (map first (get-block-referenced-blocks block))
                                                        (set)
                                                        (set/intersection other-blocks))]
                                     (concat
                                       (map (fn [p] [block p]) ref-blocks))))
                                 other-blocks)
            edges (->> (concat edges other-blocks-edges)
                    (remove nil?)
                    (distinct)
                    (db-utils/build-edges))
            nodes (->> (concat
                         [block]
                         (map first ref-blocks))
                    (remove nil?)
                    (distinct)
                    (db-utils/build-nodes dark? block edges))]
        {:nodes nodes
         :links edges}))))

(defn get-blocks-by-priority
  [repo priority]
  (let [priority (string/capitalize priority)]
    (when (declares/get-conn repo)
      (->> (q repo [:priority/blocks priority] {}
             '[:find (pull ?h [*])
               :in $ ?priority
               :where
               [?h :block/priority ?priority]]
             priority)
        react
        db-utils/seq-flatten
        db-utils/sort-blocks
        db-utils/group-by-page))))

(defn get-ref-pages
  [repo page-id pages]
  (->> (q repo [:page/ref-pages page-id] {:use-cache? false}
         '[:find ?ref-page-name
           :in $ ?pages
           :where
           [?block :block/page ?p]
           [(contains? ?pages ?p)]
           [?block :block/ref-pages ?ref-page]
           [?ref-page :page/name ?ref-page-name]]
         pages)
    react
    db-utils/seq-flatten))

(defn get-mentioned-pages
  [repo page-id pages page-name]
  (->> (q repo [:page/mentioned-pages page-id] {:use-cache? false}
         '[:find ?mentioned-page-name
           :in $ ?pages ?page-name
           :where
           [?block :block/ref-pages ?p]
           [(contains? ?pages ?p)]
           [?block :block/page ?mentioned-page]
           [?mentioned-page :page/name ?mentioned-page-name]]
         pages
         page-name)
    react
    db-utils/seq-flatten))

(defn get-page-referenced-blocks
  [repo page-id pages]
  (->> (q repo [:page/refed-blocks page-id] {}
         '[:find (pull ?block [*])
           :in $ ?pages
           :where
           [?block :block/ref-pages ?ref-page]
           [(contains? ?pages ?ref-page)]]
         pages)
    react
    db-utils/seq-flatten))

(defn get-marker-blocks
  [repo-url marker]
  (-> (q repo-url [:marker/blocks marker]
        {:use-cache? true}
        '[:find (pull ?h [*])
          :in $ ?marker
          :where
          [?h :block/marker ?m]
          [(= ?marker ?m)]]
        marker)
      react
      db-utils/seq-flatten))