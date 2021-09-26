(ns frontend.modules.outliner.yjs
  (:require ["yjs" :as y]
            ["y-websocket" :as y-ws]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.format.block :as block]
            [frontend.format.mldoc :as mldoc]
            [frontend.handler.common :as common-handler]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.util.property :as property]
            [clojure.zip :as zip]
            [datascript.core :as d]))
(set! *warn-on-infer* false)

(def ^:dynamic *debug* true)
(declare validate-struct)

(defonce doc-local (y/Doc.))
(defonce doc-remote (y/Doc.))

(def syncing-pages (atom #{}))


(defonce wsProvider1 (y-ws/WebsocketProvider. "ws://localhost:1234", "test-user", doc-remote))

(defn- contentmap [] (.getMap doc-local "content"))
(defn- structarray [page-name] (.getArray doc-local (str page-name "-struct")))

(defn- remote-contentmap [] (.getMap doc-remote "content"))
(defn- remote-structarray [page-name] (.getArray doc-remote (str page-name "-struct")))

(defn- assoc-contents [contents contentmap]
  (mapv (fn [[k v]]  (.set contentmap k v)) contents))

(defn- dissoc-contents [ids contentmap]
  (mapv (fn [id] (.delete contentmap id)) ids))

(defn- goto-innermost-struct-array [pos struct]
  (loop [i 0 s struct]
    (if (> i (- (count pos) 2))
      s
      (recur (inc i) (.get s (get pos i))))))

(deftype Pos [pos-vec]

  Object
  (toString [_] pos-vec)

  ;; [1 2 3] -> [1 2 2]
  ;; [1 2 0] -> nil
  (dec-pos [_] (Pos. (conj (vec (butlast pos-vec)) (dec (last pos-vec)))))
  ;; [1 2 3] -> [1 2 4]
  (inc-pos [_] (Pos. (conj (vec (butlast pos-vec)) (inc (last pos-vec)))))
  ;; [1 2 3] -> [1 2 4 0]
  (inc-level-pos [_] (Pos. (conj (conj (vec (butlast pos-vec)) (inc (last pos-vec))) 0)))
  ;; [1 2 3] -> [1 2 3 0]
  (add-next-level [_] (Pos. (conj pos-vec 0)))
  ;; [1 2 3] -> [1 2]
  (upper-level [_]
    (when-some [pos-vec* (vec (butlast pos-vec))]
      (Pos. pos-vec*)))

  (next-sibling-pos [_ struct]
    (let [inner-struct (goto-innermost-struct-array pos-vec struct)
          next-item (.get inner-struct (inc (last pos-vec)))]
      (if (instance? y/Array next-item)
        (Pos. (conj (vec (butlast pos-vec)) (+ 2 (last pos-vec))))
        (Pos. (conj (vec (butlast pos-vec)) (+ 1 (last pos-vec)))))))

  (next-non-sibling-pos! [this struct]
    "create a y/Array when no child follows item at POS"
    (let [inner-struct (goto-innermost-struct-array this struct)
          next-item (.get inner-struct (inc (last this)))]
      (when-not (instance? y/Array next-item)
        (.insert inner-struct (inc (last this)) (clj->js [(y/Array.)])))
      (.inc-level-pos this)))

  ICounted
  (-count [_] (count pos-vec))

  ILookup
  (-lookup [_ k] (get pos-vec k))
  (-lookup [_ k not-found] (get pos-vec k not-found))

  INext
  (-next [_] (next pos-vec))

  ISeq
  (-first [_] (first pos-vec))
  (-rest [_] (rest pos-vec))

  ISeqable
  (-seq [_] (seq pos-vec))
  ISequential

  IComparable
  (-compare [this other]
    (let [pos1 (.-pos-vec this)
          pos2 (.-pos-vec other)
          len1 (count pos1)
          len2 (count pos2)]
      (loop [i 0]
        (cond
          (and (< i len1) (>= i len2))
          -1
          (and (< i len2) (>= i len1))
          1
          (and (>= i len1) (>= i len2))
          0
          :else
          (let [nthi1 (nth pos1 i)
                nthi2 (nth pos2 i)]
            (cond
              (< nthi1 nthi2)
              -1
              (> nthi1 nthi2)
              1
              (= nthi1 nthi2)
              (recur (inc i)))))))))

(defn find-pos [struct id]
  (let [toplevel (js->clj (.toArray struct))
        index (.indexOf toplevel id)]
    (if (not= -1 index)
      (->Pos [index])
      (loop [i 0]
        (if (>= i (count toplevel))
          nil
          (let [sublevel (get toplevel i)]
            (if (instance? y/Array sublevel)
              (if-some [index-pos (find-pos sublevel id)]
                (let [index (flatten index-pos)]
                  (->Pos (vec (flatten [i index]))))
                (recur (+ i 1)))
              (recur (+ i 1)))))))))

(defn- get-pos-item [pos struct]
  (try
    (loop [i 0 s struct]
      (if (>= i (count pos))
        s
        (recur (inc i) (.get s (get pos i)))))
    (catch js/Error e
      (println e)
      (println (.toString pos) (.toJSON struct))
      (throw e))))

(defn- get-child-array [pos struct]
  "return child array if exists.
[1 [2 3]]
 ^
pos

return [2 3]
"
  (when-some [child (get-pos-item (.inc-pos pos) struct)]
    (when (instance? y/Array child)
      child)))

(defn- merge-consecutive-arrays [struct pos]
  "[1 [2] [3]] -> [1 [2 3]]
      ^
     POS"
  (let [inner-struct (goto-innermost-struct-array pos struct)
        pos-item (.get inner-struct (last pos))]
    (when (instance? y/Array pos-item)
      (loop [i (inc (last pos))]
        (when-some [next-item (.get inner-struct i)]
          (when (instance? y/Array next-item)
            (.push pos-item (.toJSON next-item))
            (.delete inner-struct i)
            (recur (inc i))))))))

(defn- distinct-struct [struct id-set]
  (loop [i 0]
    (when (< i (.-length struct))
      (let [s (.get struct i)]
        (if (instance? y/Array s)
          (do
            (distinct-struct s id-set)
            (if (= 0 (.-length s))
              (do
                (.delete struct i)
                (recur i))
              (recur (inc i))))
          (if (contains? @id-set s)
            (do
              (if (and
                   (>= (dec i) 0)
                   (< (inc i) (.-length struct))
                   (instance? y/Array (.get struct (dec i)))
                   (instance? y/Array (.get struct (inc i))))
                (let [next-item (.get struct (inc i))]
                  (distinct-struct next-item id-set)
                  (.push (.get struct (dec i)) (.toJSON next-item))
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
              (.push arr (clj->js [(or (str (:block/uuid block-or-children)) "")]))
              (when-some [children (:block/children block-or-children)]
                (let [child (->struct-array children nil)]
                  (when (and child (> (.-length child) 0))
                    (.push arr (clj->js [child])))))))
          blocks)
    arr))


(defn- ensure-block-data [block format other-props]
  (dissoc
   (merge (common-handler/wrap-parse-block block)
          {:block/format format}
          other-props)
   :block/pre-block?))

(defn- content->block [content format other-props]
  (->
   (assoc
    (first
     (block/extract-blocks (mldoc/->edn content (mldoc/default-config format))
                           content true format))
    :block/format format)
   (ensure-block-data format other-props)))

(defn page-blocks->doc [page-blocks page-name]
  (if-some [t (tree/blocks->vec-tree page-blocks page-name)]
    (let [content (contentmap)
          struct (structarray page-name)]
      (->content-map t content)
      (->struct-array t struct))))


(defn- update-block-content [id]
  (println "[YJS] update-block-content" id (.get (contentmap) id))
  (when-some [block (db-model/query-block-by-uuid id)]
    (let [content-map (contentmap)
          format (or (:block/format block) :markdown)
          new-content (.toString (.get content-map id)) ;TODO orgmode
          updated-block (content->block new-content format {:block/page (:block/page block)})]
      (def www updated-block)
      (outliner-core/save-node (outliner-core/block updated-block))
      (db/refresh! (state/get-current-repo) {:key :block/change :data [updated-block]}))))




(defn- get-item-left&parent [item id]
  (let [item-content id
        item-array (.toArray (.-parent item))
        item-index (.indexOf item-array item-content)
        left-content (loop [i (dec item-index)]
                       (when (>= i 0)
                         (when-some [content (nth item-array i)]
                           (if (instance? y/Array content)
                             (recur (dec i))
                             content))))
        parent-array (and (.-parent (.-parent item))
                          (.toArray (.-parent (.-parent item))))
        array-index (loop [i 0]
                      (when (< i (count parent-array))
                        (when-some [item (nth parent-array i)]
                          (if (instance? y/Array item)
                            (if (not= -1 (.indexOf (.toArray item) item-content))
                              i
                              (recur (inc i)))
                            (recur (inc i))
                            ))))
        parent-content (when array-index
                         (loop [i (dec array-index)]
                           (when (>= i 0)
                             (when-some [content (nth parent-array i)]
                               (if (instance? y/Array content)
                                 (recur (dec i))
                                 content)))))]
    [left-content parent-content]))

(defn- get-id-left&parent [struct id]
  (let [pos (find-pos struct id)
        upper-pos (.upper-level pos)
        parent-id (get-pos-item (.dec-pos upper-pos) struct)
        left-id (if-some [left-pos (.dec-pos pos)]
                  (let [left1 (get-pos-item left-pos struct)]
                    (if (instance? y/Array left1)
                      (get-pos-item (.dec-pos left-pos) struct)
                      left1))
                  parent-id)
        left-id (or left-id parent-id)]
    [left-id parent-id]))


(defn- events->array&items [events]
  "get related y/arrays and y/items from y/events, ignore local transactions"
  (let [arrays
        (->> (mapv (fn [event]
                     (when-not (.-local (.-transaction event))
                       (.-target event))) events)
             (remove nil?)
             (distinct))
        add-items
        (->> (mapv (fn [event]
                     (when-not (.-local (.-transaction event))
                       (into [] (.-added (.-changes event))))) events)
             (flatten)
             (remove nil?))
        delete-items
        (->> (mapv (fn [event]
                     (when-not (.-local (.-transaction event))
                       (into [] (.-added (.-changes event))))) events)
             (flatten)
             (remove nil?))]
    [arrays add-items delete-items]))





(defn- insert-node [left-id parent-id id contentmap]
  {:pre [(seq parent-id)]}
  (println "[YJS]insert-node:" left-id parent-id id)
  (let [left-id (or left-id parent-id)
        format :markdown
        content (property/insert-property
                       format
                       (property/remove-id-property format  (.get contentmap id))
                       "ID" id) ;TODO orgmode
        target-block (db-model/query-block-by-uuid left-id)
        target-node (outliner-core/block target-block)
        new-block (content->block content format
                                  {:block/page (:block/page target-block)
                                   :block/uuid (uuid id)} )
        new-node (outliner-core/block new-block)
        sibling? (not= parent-id left-id)]
    (def zzz [new-node target-node sibling?])
    (outliner-core/insert-node new-node target-node sibling?)
    (db/refresh! (state/get-current-repo) {:key :block/insert :data [new-block]})))

(defn- delete-node [id]
  (println "[YJS] delete-node" id)
  (when-some [block (db-model/query-block-by-uuid id)]
    (outliner-core/delete-node (outliner-core/block block) false)
    (db/refresh! (state/get-current-repo)  {:key :block/change :data [block]})))

(defn- observe-struct-fn-aux-insert-ids [ids page-name contentmap]
  (let [struct (structarray page-name)]
    (mapv (fn [id]
            (println "[YJS] observe-struct-fn id:" id)
            (let [[left-id parent-id] (get-id-left&parent struct id)
                  parent-id (or parent-id (:block/uuid (db/entity [:block/name page-name])))]
              (when-some [parent-id (and parent-id (str parent-id))]
                (when (db/entity [:block/uuid (uuid id)])
                  (delete-node id))
                (insert-node left-id parent-id id contentmap)))) ids)))

(defn- observe-struct-fn-aux-insert-items-array [yarray page-name contentmap]
  (let [struct (structarray page-name)
        array (js->clj (.toArray yarray))
        group (group-by #(instance? y/Array %) array)
        sub-arrays (group true)
        ids (group false)]
    (mapv (fn [id]
            (let [[left-id parent-id] (get-id-left&parent struct id)]
              (when (not (or left-id parent-id))
                (throw (js/Error. (str "empty left-id&parent-id of id: " id))))
              (let [parent-id (or parent-id (:block/uuid (db/entity [:block/name page-name])))
                    parent-id (and parent-id (str parent-id))]
                (when (db/entity [:block/uuid (uuid id)])
                  (delete-node id))
                (insert-node left-id parent-id id contentmap))))
          ids)
    (mapv #(observe-struct-fn-aux-insert-items-array % page-name contentmap) sub-arrays)))

(defn- observe-struct-fn [page-name]
  (fn [events]
    (try
      (let [[arrays added-items deleted-items] (events->array&items events)
            contentmap (contentmap)]
        (mapv
         (fn [item]
           (observe-struct-fn-aux-insert-ids (.-arr (.-content item)) page-name contentmap)
           (when-some [yarray (.-type (.-content item))]
             (observe-struct-fn-aux-insert-items-array yarray page-name contentmap)))
         added-items))
      (catch js/Error e
        (js/console.log "observe-struct-fn:")
        (js/console.log events)
        (js/console.log e)))))

(def observe-struct-fn-memo (memoize observe-struct-fn))

(defn- observe-content-fn [event]
  (try
    (when-not (.-local (.-transaction event))
      (let [keys (js->clj (into [] (.-keys event)))]
        (mapv (fn [[k v]]
                (case (get v "action")
                  "update" (update-block-content k)
                  "delete" (delete-node k)
                  (println "action" v))) keys)))
    (catch js/Error e
      (js/console.log "observe-content-fn:")
      (js/console.log event)
      (js/console.log e))))

(defn observe-page-doc [page-name doc]
  (let [struct (.getArray doc (str page-name "-struct"))
        contentmap (contentmap)]
    (.unobserveDeep struct (observe-struct-fn-memo page-name))
    (.unobserve contentmap observe-content-fn)
    (.observeDeep struct (observe-struct-fn-memo page-name))
    (.observe contentmap observe-content-fn)))

(defn unobserve-page-doc [page-name doc]
  (let [struct (.getArray doc (str page-name "-struct"))]
    (.unobserveDeep struct (observe-struct-fn-memo page-name))
    (.unobserve struct observe-content-fn)))

(defn merge-doc [doc1 doc2]
  (let [s1 (y/encodeStateVector doc1)
        s2 (y/encodeStateVector doc2)
        d1 (y/encodeStateAsUpdate doc1 s2)
        d2 (y/encodeStateAsUpdate doc2 s1)]
    (y/applyUpdate doc1 d2)
    (y/applyUpdate doc2 d1)))

(defn sync-doc [local remote]
  (.on remote "update" (fn [update]
                         (y/applyUpdate local update))))


(defn- remove-all-blocks-in-page [page-blocks page-name]
  (let [tx-data (mapv (fn [block]
                        [:db.fn/retractEntity [:block/uuid (:block/uuid block)]])
                      page-blocks)]
    (db/transact! tx-data)))

(defn- insert-doc-contents [page-name]
  (let [page-block (db/pull (:db/id (db/get-page page-name)))
        format (or (:block/format page-block)
                   (state/get-preferred-format))
        contentmap (contentmap)
        content-tree (loop [loc (zip/vector-zip (js->clj (.toJSON (structarray page-name))))]
                       (if (zip/end? loc)
                         (zip/root loc)
                         (cond
                           (string? (zip/node loc))
                           (recur (zip/next
                                   (zip/replace loc (property/insert-property
                                                     format
                                                     (property/remove-id-property
                                                      format (.toString (.get contentmap (zip/node loc))))
                                                     "ID" (zip/node loc)))))

                           :else
                           (recur (zip/next loc)))))
        node-tree (loop [loc (zip/vector-zip content-tree)]
                    (if (zip/end? loc)
                      (zip/root loc)
                      (cond
                        (string? (zip/node loc))
                        (let [block (first
                                     (block/extract-blocks
                                      (mldoc/->edn (zip/node loc) (mldoc/default-config format))
                                      (zip/node loc) true format))
                              block (merge
                                     (dissoc block
                                             :block/pre-block?
                                             :db/id
                                             :block/left
                                             :block/parent
                                             :block/file)
                                     {:block/page (select-keys page-block [:db/id])
                                      :block/format format
                                      :block/path-refs (->> (cons (:db/id page-block)
                                                                  (:block/path-refs block))
                                                            (remove nil?))})]
                          (if (:block/uuid block)
                            (recur (zip/next
                                    (zip/replace
                                     loc
                                     (outliner-core/block block))))
                            (recur (zip/remove loc))))
                        :else
                        (recur (zip/next loc)))))]
    (when-not (empty? node-tree)
      (outliner-core/insert-nodes node-tree (outliner-core/block page-block) false)
      (let [new-block-uuids (mapv (fn [n] (:block/uuid (:data n))) (flatten node-tree))
            new-blocks (db/pull-many (state/get-current-repo) '[*] (map (fn [id] [:block/uuid id]) new-block-uuids))]
        new-blocks))))

(defn doc->page-blocks [page-blocks page-name]
  (let [contentmap (contentmap)
        struct (structarray page-name)]
    (remove-all-blocks-in-page page-blocks page-name)
    (when-some [new-blocks (insert-doc-contents page-name)]
      (db/refresh! (state/get-current-repo) {:key :block/insert :data new-blocks}))))

(defn start-sync-page [page-name]
  (let [page-blocks (db/get-page-blocks-no-cache page-name)]
    (unobserve-page-doc page-name doc-local)
    (page-blocks->doc page-blocks page-name)
    (sync-doc doc-local doc-remote)
    (distinct-struct (structarray page-name) (atom #{}))
    (merge-doc doc-remote doc-local)
    (doc->page-blocks page-blocks page-name)
    (observe-page-doc page-name doc-local)))

(defn stop-sync-page [page-name]
  (unobserve-page-doc page-name doc-local))






(defn- delete-item [pos root-struct]
  "Delete item at POS. Also delete struct when empty"
  (let [inner-struct (goto-innermost-struct-array pos root-struct)
        last-pos-index (last pos)]
    (.delete inner-struct last-pos-index 1)
    (when-some [upper-pos (.upper-level pos)]
      (let [last-upper-pos-index (last upper-pos)]
        (when (= 0 (.-length inner-struct))
          (let [inner-upper-struct (goto-innermost-struct-array upper-pos root-struct)]
            (.delete inner-upper-struct last-upper-pos-index 1)))))))



(defn- common-prefix [vec1 vec2]
  (let [vec1 (or (.-pos-vec vec1) vec1)
        vec2 (or (.-pos-vec vec2) vec2)]
    (try
      (let [len1 (count vec1)
            len2 (count vec2)]
        (loop [i 0 r1 vec1 r2 vec2]
          (cond
            (or (>= i len1) (>= i len2))
            [(subvec vec1 0 i) r1 r2]

            (= (get vec1 i) (get vec2 i))
            (recur (inc i) (vec (rest r1)) (vec (rest r2)))

            :else
            [(subvec vec1 0 i) r1 r2])))
      (catch js/Error e
        (println e vec1 vec2)
        (js/console.trace)))))


;;;;;;;;;;;;;;;;;;;;;;;;;;
;; outliner op + yjs op ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;

;; (defn move-subtree [root target-node sibling?]
;;   (outliner-core/move-subtree root target-node sibling?))

(defn- nodes-tree->struct&content [nodes-tree]
  (let [contents (atom {})
        struct (clojure.walk/postwalk
                (fn [node]
                  (if (instance? outliner-core/Block node)
                    (let [block (:data node)
                          block-uuid (:block/uuid block)
                          block-content (:block/content block)]
                      (when block-uuid
                        (swap! contents (fn [o] (assoc o (str block-uuid) block-content))))
                      (str block-uuid))
                    node)) nodes-tree)]
    [struct @contents]))


(defn- insert-nodes-aux [insert-structs pos struct]
  "insert INSERT-STRUCTS at POS"
  (loop [i 0 pos pos]
    (when (< i (count insert-structs))
      (let [s (nth insert-structs i)
            struct* (goto-innermost-struct-array pos struct)]
        (cond
          (vector? s)
          (let [pos* (.add-next-level pos)]
            (.insert struct* (last pos) (clj->js [(y/Array.)]))
            (insert-nodes-aux s pos* struct)
            (recur (inc i) (.inc-pos pos)))

          :else
          (do
            (.insert struct* (last pos) (clj->js [s]))
            (recur (inc i) (.inc-pos pos))))))))


(defn insert-nodes-yjs [struct new-nodes-tree target-uuid sibling?]
  (let [[structs contents] (nodes-tree->struct&content new-nodes-tree)]
    (when-some [target-pos (find-pos struct (str target-uuid))]
      (let [pos (if sibling?
                  (.next-sibling-pos target-pos struct)
                  (.next-non-sibling-pos! target-pos struct))]
        (insert-nodes-aux structs pos struct)
        (assoc-contents contents (contentmap))))))

(defn insert-nodes-op [new-nodes-tree target-node sibling?]
  (let [target-block (:data target-node)]
    (when-some [page-name (or (:block/name target-block)
                              (:block/name (db/entity (:db/id (:block/page target-block)))))]
      (let [struct (structarray page-name)]
        (insert-nodes-yjs struct new-nodes-tree (str (:block/uuid target-block)) sibling?)
        (distinct-struct struct (atom #{}))
        (merge-doc doc-remote doc-local)
        (when *debug* (validate-struct struct))
        (outliner-core/insert-nodes new-nodes-tree target-node sibling?)))))

(defn insert-node-yjs [struct new-node target-uuid sibling?]
  (insert-nodes-yjs struct [new-node] target-uuid sibling?))

(defn insert-node-op
  ([new-node target-node sibling?]
   (insert-node-op new-node target-node sibling? nil))

  ([new-node target-node sibling? {:keys [blocks-atom skip-transact?]
                                   :or {skip-transact? false}
                                   :as opts}]
   (println "[YJS] insert-node-op" new-node)
   (let [target-block (:data target-node)]
     (when-some [page-name (or (:block/name target-block)
                               (:block/name (db/entity (:db/id (:block/page target-block)))))]
       (let [struct (structarray page-name)]
         (insert-node-yjs struct new-node (str (:block/uuid target-block)) sibling?)
         (distinct-struct struct (atom #{}))
         (merge-doc doc-remote doc-local)
         (when *debug* (validate-struct struct))
         (outliner-core/insert-node new-node target-node sibling? opts))))))

(defn- delete-range-nodes-aux [prefix-vec start-pos-vec end-pos-vec struct]
  {:pre [(> (count start-pos-vec) 0)
         (> (count end-pos-vec) 0)]}
  (let [start-pos-length (count start-pos-vec)
        end-pos-length (count end-pos-vec)
        *end-pos-vec (atom end-pos-vec)]
    (loop [i (dec start-pos-length)]
      (when (> i 0)
        (let [pos (->Pos (vec (concat prefix-vec (subvec start-pos-vec 0 (inc i)))))
              pos (if (instance? y/Array (get-pos-item pos struct)) (.inc-pos pos) pos)
              inner-struct (goto-innermost-struct-array pos struct)
              inner-parent-struct (goto-innermost-struct-array (.upper-level pos) struct)]
          (.delete inner-struct (last pos) (- (.-length inner-struct) (last pos)))
          (when (= 0 (.-length inner-struct))
            (.delete inner-parent-struct (last (.upper-level pos)))
            (when (= i 1)
              (swap! *end-pos-vec (fn [v] (vec (concat [(dec (first v))] (rest v)))))))
          (recur (dec i)))))
    (loop [i (dec end-pos-length)]
      (when (> i 0)
        (let [pos (->Pos (vec (concat prefix-vec (subvec @*end-pos-vec 0 (inc i)))))
              pos (if (instance? y/Array (get-pos-item pos struct)) (.dec-pos pos) pos)
              inner-struct (goto-innermost-struct-array pos struct)
              inner-parent-struct (goto-innermost-struct-array (.upper-level pos) struct)]
          (.delete inner-struct 0 (inc (last pos)))
          (if (= 0 (.-length inner-struct))
            (do
              (.delete inner-parent-struct (last (.upper-level pos)))
              (swap! *end-pos-vec
                     (fn [v]
                       (assoc v (dec i) (dec (v (dec i))))))
              (recur (dec i)))
            (recur (dec i))))))
    (let [start-pos (->Pos (conj prefix-vec (first start-pos-vec)))
          end-pos (->Pos (conj prefix-vec (first @*end-pos-vec)))
          inner-struct (goto-innermost-struct-array start-pos struct)
          start-index (if (instance? y/Array (get-pos-item start-pos struct))
                        (inc (last start-pos))
                        (last start-pos))
          end-index (if (instance? y/Array (get-pos-item end-pos struct))
                      (dec (last end-pos))
                      (last end-pos))]
      (.delete inner-struct start-index (inc (- end-index start-index)))
      (when (= 0 (.-length inner-struct))
        (let [inner-parent-struct
              (goto-innermost-struct-array (.upper-level start-pos) struct)]
          (.delete inner-parent-struct (last (.upper-level start-pos))))))))

(defn- delete-child-array [pos struct]
  (when (some? (get-child-array pos struct))
    (let [inner-struct (goto-innermost-struct-array pos struct)]
      (.delete inner-struct (last (.inc-pos pos))))))

(defn delete-range-nodes [start-pos end-pos struct]
  ;; {:pre [(<= (compare start-pos end-pos) 0)]}
  (let [[same-prefix-vec pos-vec1* pos-vec2*] (common-prefix start-pos end-pos)]
    (delete-child-array end-pos struct)
    (delete-range-nodes-aux same-prefix-vec pos-vec1* pos-vec2* struct)))

(defn delete-nodes-yjs [struct start-uuid end-uuid block-ids]
  (let [start-pos (find-pos struct (str start-uuid))
        end-pos (find-pos struct (str end-uuid))
        [start-pos end-pos] (if (< (compare start-pos end-pos) 0)
                              [start-pos end-pos]
                              [end-pos start-pos])
        ids (mapv (fn [id-tuple] (str (second id-tuple))) block-ids)]
    (println "[YJS] delete-nodes-yjs: "
             start-uuid end-uuid block-ids (.toString start-pos) (.toString end-pos))
    (delete-range-nodes start-pos end-pos struct)
    (dissoc-contents ids (contentmap))))


(defn delete-nodes-op [start-node end-node block-ids]
  (let [start-block (:data start-node)
        end-block (:data end-node)]
    (when-some [page-name (or (:block/name start-block)
                              (:block/name (db/entity (:db/id (:block/page start-block)))))]
      (when-some [start-uuid (:block/uuid start-block)]
        (when-some [end-uuid (:block/uuid end-block)]
          (let [struct (structarray page-name)]
            (delete-nodes-yjs struct start-uuid end-uuid block-ids)
            (distinct-struct struct (atom #{}))
            (merge-doc doc-remote doc-local)
            (when *debug* (validate-struct struct))
            (outliner-core/delete-nodes start-node end-node block-ids)))))))

(defn delete-node-yjs [struct id]
  (let [pos (find-pos struct id)]
    (delete-item pos struct)
    (dissoc-contents [id] (contentmap))))

(defn delete-node-op [node children?]
  (let [block (:data node)]
    (when-some [page-name (:block/name (db/entity (:db/id (:block/page block))))]
      (let [uuid (str (:block/uuid block))
            struct (structarray page-name)]
        (println "[YJS] delete-node-op: " uuid children?)
        (delete-node-yjs struct uuid)
        (merge-doc doc-remote doc-local)
        (when *debug* (validate-struct struct))
        (outliner-core/delete-node node children?)))))

(defn save-node-op [node]
  (let [block (:data node)
        contentmap (contentmap)]
    (when-some [page-name (:block/name (db/entity (:db/id (:block/page block))))]
      (when-some [block-uuid (:block/uuid block)]
        (let [struct (structarray page-name)]
          (.set contentmap (str block-uuid) (:block/content block))
          (distinct-struct struct (atom #{}))
          (merge-doc doc-remote doc-local)
          (when *debug* (validate-struct struct))
          (outliner-core/save-node node))))))

(defn- outdentable? [pos]
  (> (count pos) 1))

(defn- indentable? [pos]
  (not= 0 (last pos)))


(defn- indent-item [struct id]
  "indent an item(and its children)"
  (when-some [pos (find-pos struct id)]
    (when (indentable? pos)
      (let [item-parent-array (goto-innermost-struct-array pos struct)
            item (get-pos-item pos struct)
            item-children (get-child-array pos struct)
            item-children-clone (and item-children (.clone item-children))
            push-items (if item-children-clone
                         [item item-children-clone]
                         [item])]
        (let [prev-item (get-pos-item (.dec-pos pos) struct)]
          (.delete item-parent-array (last pos) (if item-children-clone 2 1))
                                        ; [other-item prev-item item]
          (if (instance? y/Array prev-item)  ;prev-item is array
            (do
              (.push prev-item (clj->js push-items)))
            ;; prev-item is not array
            (let [insert-pos (last pos)
                  new-array (y/Array.)]
              (.insert item-parent-array insert-pos (clj->js [new-array]))
              (.push new-array (clj->js push-items)))))))))

(defn- outdent-item [struct id]
  "outdent an item(and its children)"
  ;; struct=[1 [2 [3] 4]]
  ;; item-parent-array=[2 [3]]
  ;; item-parent-parent-array=[1 [2 [3] 4]]
  ;; item=2
  ;; item-children=[3]
  (when-some [pos (find-pos struct id)]
    (when (outdentable? pos)
      (let [upper-pos (.upper-level pos)
            item-parent-array (goto-innermost-struct-array pos struct)
            item-parent-parent-array (goto-innermost-struct-array upper-pos struct)
            item (get-pos-item pos struct)
            item-children (get-child-array pos struct)
            item-children-clone (and item-children (.clone item-children))
            item-parent-array-clone (.clone item-parent-array)]
        (.delete item-parent-array (last pos) (- (.-length item-parent-array) (last pos)))
        (.delete item-parent-array-clone 0 (+ (last pos) (if item-children-clone 2 1)))
        (let [empty-parent-array? (= 0 (.-length item-parent-array))
              insert-pos (if empty-parent-array? (last upper-pos) (inc (last upper-pos)))
              insert-items (if item-children-clone [item item-children-clone] [item])]
          (when empty-parent-array?
            (.delete item-parent-parent-array (last upper-pos) 1))
          (.insert item-parent-parent-array insert-pos (clj->js insert-items))
          (when (> (.-length item-parent-array-clone) 0)
            (.insert item-parent-parent-array (+ insert-pos (if item-children-clone 2 1))
                     (clj->js [item-parent-array-clone])))
          (when item-children-clone
            (merge-consecutive-arrays item-parent-parent-array
                                      (->Pos [(inc insert-pos)]))))))))

(defn- indent-outdent-nodes-yjs [struct ids indent?]
  (mapv
   (fn [id]
     (if indent?
       (indent-item struct id)
       (outdent-item struct id)))
   ids))

(defn indent-outdent-nodes-op [nodes indent?]
  (when-some [page-name
              (:block/name (db/entity (:db/id (:block/page (:data (first nodes))))))]
    (let [ids (mapv (fn [node] (str (:block/uuid (:data node)))) nodes)
          struct (structarray page-name)]
      (println "[YJS] indent-outdent-nodes(before):" nodes indent?)
      (indent-outdent-nodes-yjs struct ids indent?)
      (merge-doc doc-remote doc-local)
      (when *debug* (validate-struct struct))
      (outliner-core/indent-outdent-nodes nodes indent?)
      (println "[YJS] indent-outdent-nodes(after):"
               (mapv (fn [node]
                       (db/pull (:db/id (:data node))))
                     nodes)))))

(defn move-subtree-same-page-yjs [struct root-id target-id sibling?]
  (when (find-pos struct target-id)
    (when-some [root-pos (find-pos struct root-id)]
      (let [root-item (get-pos-item root-pos struct)
            root-item-parent-array (goto-innermost-struct-array root-pos struct)
            child-array (get-child-array root-pos struct)
            child-array-clone (and child-array (.clone child-array))
            insert-items (if child-array [root-item child-array-clone] [root-item])]
        (.delete root-item-parent-array (last root-pos) (if child-array 2 1))
        (when (= 0 (.-length root-item-parent-array))
          (let [upper-pos (.upper-level root-pos)
                root-item-parent-parent-array (goto-innermost-struct-array upper-pos struct)]
            (.delete root-item-parent-parent-array (last upper-pos))))
        (let [target-pos (find-pos struct target-id)
              target-item-parent-array (goto-innermost-struct-array target-pos struct)]
          (if sibling?
            (let [sibling-insert-pos (let [insert-pos (.inc-pos target-pos)
                                           next-item (get-pos-item insert-pos struct)]
                                       (if (instance? y/Array next-item)
                                         (inc (last insert-pos))
                                         (last insert-pos)))]
              (.insert target-item-parent-array sibling-insert-pos (clj->js insert-items)))
            (let [insert-pos (inc (last target-pos))
                  new-array (when-not (instance? y/Array (.get target-item-parent-array insert-pos))
                              (y/Array.))]
              (when new-array
                (.insert target-item-parent-array insert-pos (clj->js [new-array])))
              (let [target-child-array (.get target-item-parent-array insert-pos)]
                (.insert target-child-array 0 (clj->js insert-items))))))))))

(defn move-subtree-same-page-op [root target-node sibling?]
  (when-some [page-name (:block/name (db/entity (:db/id (:block/page (:data root)))))]
    (let [struct (structarray page-name)
          root-id (str (:block/uuid (:data root)))
          target-id (str (:block/uuid (:data target-node)))]
      (move-subtree-same-page-yjs struct root-id target-id sibling?)
      (merge-doc doc-remote doc-local)
      (when *debug* (validate-struct struct))
      (outliner-core/move-subtree root target-node sibling?))))

;;;;;;;;;;;;;;;;;;;;;;;;;
;; functions for debug ;;
;;;;;;;;;;;;;;;;;;;;;;;;;

(defn- struct->content-struct [struct contentmap]
  (mapv (fn [i]
          (cond
            (string? i)
            (try (.toString (.get contentmap i))
                 (catch js/Error e
                   (println e)
                   (println i)))

            :else
            (struct->content-struct i contentmap))) struct))

(defn- page-contents [page-name]
  (let [struct (.toJSON (structarray page-name))
        contentmap (contentmap)]
    (struct->content-struct struct contentmap)))

(defn- remote-page-contents [page-name]
  (let [struct (.toJSON (remote-structarray page-name))
        contentmap (remote-contentmap)]
    (struct->content-struct struct contentmap)))


(defn- build-test-struct []
  (def test-doc (y/Doc.))
  (def test-struct (.getArray test-doc "test-struct"))
  (.insert test-struct 0 (clj->js ["1"]))
  (.insert test-struct 1 (clj->js ["2"]))
  (.insert test-struct 2 (clj->js [(y/Array.)]))
  (.insert (.get test-struct 2) 0 (clj->js ["3"]))
  (.insert (.get test-struct 2) 1 (clj->js [(y/Array.)]))
  (.insert (.get test-struct 2) 2 (clj->js ["5"]))
  (.insert (.get test-struct 2) 3 (clj->js [(y/Array.)]))
  (.insert (get-pos-item (->Pos [2 1]) test-struct) 0 (clj->js ["4"]))
  (.insert (get-pos-item (->Pos [2 3]) test-struct) 0 (clj->js ["6"]))
  (.observeDeep test-struct (fn [e] (def eee e)))
  (println (.toJSON test-struct)))



(defn- validate-struct-aux [arr parent-pos]
  (loop [i 0]
    (when (< i (count arr))
      (when (vector? (arr i))
        (assert (not= 0 i)
                (str "vector at pos 0, pos: " (conj parent-pos i)))
        (assert (or (= i 0) (not (vector? (arr (dec i)))))
                (str "continuous arrays, pos: " (conj parent-pos i)))
        (validate-struct-aux (arr i) (conj parent-pos i)))
      (recur (inc i)))))

(defn- validate-struct [struct]
  "ensure struct array has a legal structure"
  (let [arr (js->clj (.toJSON struct))]
    (validate-struct-aux arr [])))
