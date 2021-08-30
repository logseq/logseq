(ns frontend.modules.outliner.yjs
  (:require ["yjs" :as y]
            ["y-websocket" :as y-ws]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.format.block :as block]
            [frontend.format.mldoc :as mldoc]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.db.model :as db-model]))


(def doc-local (y/Doc.))
(def doc-remote (y/Doc.))

;; (def wsProvider1 (y-ws/WebsocketProvider. "ws://192.168.1.149:1234", "test-user", doc-remote))

(defn- contentmap [] (.getMap doc-local "content"))
(defn- struct [page-name] (.getArray doc-local (str page-name "-struct")))


(defn- distinct-struct [struct id-set]
  (loop [i 0]
    (when (< i (.-length struct))
      (let [s (.get struct i)]
        (if (instance? y/Array s)
          (do
            (distinct-struct s id-set)
            (recur (inc i)))
          (if (contains? @id-set s)
            (do
              (if (and
                   (>= (dec i) 0)
                   (< (inc i) (.-length struct))
                   (instance? y/Array (.get struct (dec i)))
                   (instance? y/Array (.get struct (inc i))))
                (let [next-item (.get struct (inc i))]
                  (distinct-struct next-item id-set)
                  (.push (.get struct (dec i)) (.toArray next-item))
                  (.delete struct (inc i))
                  (.delete struct i)
                  (recur i))
                (do
                  (.delete struct i)
                  (recur i))))
            (do
              (swap! id-set #(conj % s))
              (recur (inc i)))))))))

(defn- ->content-map [blocks map]
  (clojure.walk/postwalk (fn [v]
                           (when (and (map? v) (:block/uuid v))
                             (.set map (str (:block/uuid v)) (y/Text. (:block/content v))))
                           v)
                         blocks))

(defn- ->struct-array [blocks arr]
  (let [arr (or arr (y/Array.))]
    (mapv (fn [block-or-children]
            (when (map? block-or-children)
              (println arr)
              (.push arr (clj->js [(or (:block/content block-or-children) "")]))
              (when-let [children (:block/children block-or-children)]
                (let [child (->struct-array children nil)]
                  (when (and child (> (.-length child) 0))
                    (.push arr (clj->js [child])))))))
          blocks)
    arr))

(defn page-blocks->doc [page-blocks page-name]
  (let [t (tree/blocks->vec-tree page-blocks page-name)
        content (contentmap)
        struct (struct page-name)]
    (->content-map t content)
    (->struct-array t struct)))

(defn- update-block-content [uuid]
  (let [content-map (contentmap)
        new-content (.get content-map uuid)
        block (db-model/query-block-by-uuid uuid)
        updated-block (update block :block/content (fn [_] new-content))]
    (outliner-core/save-node (outliner-core/Block updated-block))))


(defn- get-item-left&parent [item id]
  (let [item-content id
        item-array (.toArray (.-parent item))
        item-index (.indexOf item-array item-content)
        left-content (loop [i (dec item-index)]
                       (when (>= i 0)
                         (when-let [content (nth item-array i)]
                           (if (instance? y/Array content)
                             (recur (dec i))
                             content))))
        parent-array (.toArray (.-parent (.-parent item)))
        array-index (loop [i 0]
                      (when (< i (count parent-array))
                        (when-let [item (nth parent-array i)]
                          (if (instance? y/Array item)
                            (if (not= -1 (.indexOf (.toArray item) item-content))
                              i
                              (recur (inc i)))
                            (recur (inc i))
                            ))))
        parent-content (loop [i (dec array-index)]
                         (when (>= i 0)
                           (when-let [content (nth parent-array i)]
                             (if (instance? y/Array content)
                               (recur (dec i))
                               content))))]
    [left-content parent-content]))

(defn- insert-node [left-id parent-id id contentmap]
  {:pre [(seq parent-id)]}
  (let [left-id (or left-id parent-id)
        content (str "- " (.get contentmap id))
        target-node (outliner-core/block (db/query-block-by-uuid left-id))
        format (:block/format target-node)
        new-node (outliner-core/block
                  (or (db-model/query-block-by-uuid id)
                      (first (block/extract-blocks (mldoc/->edn content)
                                                   (mldoc/default-config format)
                                                   content true format))))

        sibling? (not= parent-id left-id)]
    (outliner-core/insert-node new-node target-node sibling?)))

(defn- delete-node [id]
  (when-let [block (db-model/query-block-by-uuid id)]
    (outliner-core/delete-node (outliner-core/block block) false)))

(defn- observe-struct-fn [events]
  (mapv (fn [event]
          (let [added-items (into [] (.-added (.-changes event)))
                deleted-items (into [] (.-deleted (.-changes event)))]
            (mapv (fn [item]
                    (mapv (fn [id]
                            (let [[left-content parent-content] (get-item-left&parent item id)]
                              (insert-node left-content parent-content id (contentmap))))
                          (.-arr (.-content item)))) added-items)
            (mapv (fn [item]
                    (mapv #(delete-node %) (.-arr (.-content item)))) deleted-items)))
        events))

(defn- observe-content-fn [event]
  (let [keys (js->clj (into [] (.-keys event)))]
    (mapv (fn [[k v]]
            (when (= "update" (get "action" v))
              (update-block-content k))) keys)))

(defn observe-page-struct [page-name doc]
  (let [struct (.getArray doc (str page-name "-struct"))
        content(.getMap doc (str page-name "-content"))]
    (.unobserveDeep struct observe-struct-fn)
    (.unobserve struct observe-content-fn)
    (.observeDeep struct observe-struct-fn)
    (.observe struct observe-content-fn)))

(defn merge-doc [doc1 doc2]
  (let [s1 (y/encodeStateVector doc1)
        s2 (y/encodeStateVector doc2)
        d1 (y/encodeStateAsUpdate doc1 s2)
        d2 (y/encodeStateAsUpdate doc2 s1)]
    (y/applyUpdate doc1 d2)
    (y/applyUpdate doc2 d1)))

(defn sync-doc [local remote]
  (.on remote "update" (fn [update]
                         (y/applyUpdate local update)))
  ;; (.on local "update" (fn [update]
  ;;                       (y/applyUpdate remote update)))
  )


(defn init-page-doc [page-name]
  (let [page-blocks (db/get-page-blocks page-name)]
    (page-blocks->doc page-blocks page-name)
    (observe-page-struct page-name doc-local)))

(defn page-doc->nodes [doc]

  )

(defn save-node [node]

  )
