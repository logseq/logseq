(ns frontend.handler.block
  (:require [frontend.util :as util]
            [clojure.walk :as walk]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.format.mldoc :as mldoc]
            [frontend.date :as date]
            [frontend.config :as config]
            [datascript.core :as d]
            [clojure.set :as set]
            [medley.core :as medley]
            [frontend.format.block :as block]
            [frontend.debug :as debug]))

(defn blocks->vec-tree
  "Deprecated: use frontend.modules.outliner.core/blocks->vec-tree instead."
  [col]
  (let [col (map (fn [h] (cond->
                           h
                           (not (:block/dummy? h))
                           (dissoc h :block/meta))) col)
        parent? (fn [item children]
                  (and (seq children)
                       (every? #(< (:block/level item) (:block/level %)) children)))
        get-all-refs (fn [block]
                       (let [refs (if-let [refs (seq (:block/refs-with-children block))]
                                    refs
                                    (concat
                                     (:block/refs block)
                                     (:block/tags block)))]
                         (distinct refs)))]
    (loop [col (reverse col)
           children (list)]
      (if (empty? col)
        children
        (let [[item & others] col
              cur-level (:block/level item)
              bottom-level (:block/level (first children))
              pre-block? (:block/pre-block? item)
              item (assoc item :block/refs-with-children (->> (get-all-refs item)
                                                              (remove nil?)))]
          (cond
            (empty? children)
            (recur others (list item))

            (<= bottom-level cur-level)
            (recur others (conj children item))

            pre-block?
            (recur others (cons item children))

            (> bottom-level cur-level)      ; parent
            (let [[children other-children] (split-with (fn [h]
                                                          (> (:block/level h) cur-level))
                                                        children)
                  refs-with-children (->> (mapcat get-all-refs (cons item children))
                                          (remove nil?)
                                          distinct)
                  children (cons
                            (assoc item
                                   :block/children children
                                   :block/refs-with-children refs-with-children)
                            other-children)]
              (recur others children))))))))


;; recursively with children content for tree
(defn get-block-content-rec
  ([block]
   (get-block-content-rec block (fn [block] (:block/content block))))
  ([block transform-fn]
   (let [contents (atom [])
         _ (walk/prewalk
            (fn [form]
              (when (map? form)
                (when-let [content (:block/content form)]
                  (swap! contents conj (transform-fn form))))
              form)
            block)]
     (apply util/join-newline @contents))))

;; with children content
(defn get-block-full-content
  ([repo block-id]
   (get-block-full-content repo block-id (fn [block] (:block/content block))))
  ([repo block-id transform-fn]
   (let [blocks (db/get-block-and-children-no-cache repo block-id)]
     (->> blocks
          (map transform-fn)
          (apply util/join-newline)))))

(defn get-block-end-pos-rec
  [repo block]
  (let [children (:block/children block)]
    (if (seq children)
      (get-block-end-pos-rec repo (last children))
      (if-let [end-pos (get-in block [:block/meta :end-pos])]
        end-pos
        (when-let [block (db/entity repo [:block/uuid (:block/uuid block)])]
          (get-in block [:block/meta :end-pos]))))))

(defn get-block-ids
  [block]
  (let [ids (atom [])
        _ (walk/prewalk
           (fn [form]
             (when (map? form)
               (when-let [id (:block/uuid form)]
                 (swap! ids conj id)))
             form)
           block)]
    @ids))

(defn collapse-block!
  [block]
  (let [repo (:block/repo block)]
    (db/transact! repo
      [{:block/uuid (:block/uuid block)
        :block/collapsed? true}])))

(defn collapse-blocks!
  [block-ids]
  (let [repo (state/get-current-repo)]
    (db/transact! repo
      (map
        (fn [id]
          {:block/uuid id
           :block/collapsed? true})
        block-ids))))

(defn expand-block!
  [block]
  (let [repo (:block/repo block)]
    (db/transact! repo
      [{:block/uuid (:block/uuid block)
        :block/collapsed? false}])))

(defn expand-blocks!
  [block-ids]
  (let [repo (state/get-current-repo)]
    (db/transact! repo
      (map
        (fn [id]
          {:block/uuid id
           :block/collapsed? false})
        block-ids))))

(defn pre-block-with-only-title?
  [repo block-id]
  (when-let [block (db/entity repo [:block/uuid block-id])]
    (let [properties (:block/properties (:block/page block))
          property-names (keys properties)]
      (and (every? #(contains? #{:title :filters} %) property-names)
           (let [ast (mldoc/->edn (:block/content block) (mldoc/default-config (:block/format block)))]
             (and
              (= "Properties" (ffirst (first ast)))
              (or
               (empty? (rest ast))
               (every? (fn [[[typ break-lines]] _]
                         (and (= typ "Paragraph")
                              (every? #(= % ["Break_Line"]) break-lines))) (rest ast)))))))))

(defn with-dummy-block
  ([blocks format]
   (with-dummy-block blocks format {} {}))
  ([blocks format default-option {:keys [journal? page-name]
                                  :or {journal? false}}]
   (let [format (or format (state/get-preferred-format) :markdown)
         blocks (if (and journal?
                         (seq blocks)
                         (when-let [title (second (first (:block/title (first blocks))))]
                           (date/valid-journal-title? title)))
                  (rest blocks)
                  blocks)
         blocks (vec blocks)]
     (cond
       (and (seq blocks)
            (or (and (> (count blocks) 1)
                     (:block/pre-block? (first blocks)))
                (and (>= (count blocks) 1)
                     (not (:block/pre-block? (first blocks))))))
       blocks

       :else
       (let [last-block (last blocks)
             end-pos (get-in last-block [:block/meta :end-pos] 0)
             dummy (merge last-block
                          {:block/uuid (db/new-block-id)
                           :block/title ""
                           :block/content (config/default-empty-block format)
                           :block/format format
                           :block/level 2
                           :block/priority nil
                           :block/meta {:start-pos end-pos
                                        :end-pos end-pos}
                           :block/body nil
                           :block/dummy? true
                           :block/marker nil
                           :block/pre-block? false}
                          default-option)]
         (conj blocks dummy))))))

(defn filter-blocks
  [repo ref-blocks filters group-by-page?]
  (let [ref-pages (->> (if group-by-page?
                         (mapcat last ref-blocks)
                         ref-blocks)
                       (mapcat (fn [b] (concat (:block/refs b) (:block/children-refs b))))
                       (distinct)
                       (map :db/id)
                       (db/pull-many repo '[:db/id :block/name]))
        ref-pages (zipmap (map :block/name ref-pages) (map :db/id ref-pages))
        exclude-ids (->> (map (fn [page] (get ref-pages page)) (get filters false))
                         (remove nil?)
                         (set))
        include-ids (->> (map (fn [page] (get ref-pages page)) (get filters true))
                         (remove nil?)
                         (set))]
    (if (empty? filters)
      ref-blocks
      (let [filter-f (fn [ref-blocks]
                       (cond->> ref-blocks
                         (seq exclude-ids)
                         (remove (fn [block]
                                   (let [ids (set (concat (map :db/id (:block/refs block))
                                                          (map :db/id (:block/children-refs block))))]
                                     (seq (set/intersection exclude-ids ids)))))

                         (seq include-ids)
                         (remove (fn [block]
                                   (let [ids (set (concat (map :db/id (:block/refs block))
                                                          (map :db/id (:block/children-refs block))))]
                                     (empty? (set/intersection include-ids ids)))))
                         ))]
        (if group-by-page?
          (->> (map (fn [[p ref-blocks]]
                      [p (filter-f ref-blocks)]) ref-blocks)
               (remove #(empty? (second %))))
          (->> (filter-f ref-blocks)
               (remove nil?)))))))

;; TODO: reduced version
(defn walk-block
  [block check? transform]
  (let [result (atom nil)]
    (walk/postwalk
     (fn [x]
       (if (check? x)
         (reset! result (transform x))
         x))
     (:block/body block))
    @result))

(defn get-timestamp
  [block typ]
  (walk-block block
              (fn [x]
                (and (block/timestamp-block? x)
                     (= typ (first (second x)))))
              #(second (second %))))

(defn get-scheduled-ast
  [block]
  (get-timestamp block "Scheduled"))

(defn get-deadline-ast
  [block]
  (get-timestamp block "Deadline"))
