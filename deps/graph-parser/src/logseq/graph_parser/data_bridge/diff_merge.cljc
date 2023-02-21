(ns logseq.graph-parser.data-bridge.diff-merge
  ;; Disable clj linters since we don't support clj
  #?(:clj {:clj-kondo/config {:linters {:unresolved-namespace {:level :off}
                                        :unresolved-symbol {:level :off}}}})
  (:require #?(:org.babashka/nbb ["./diff-merge.cjs$default" :refer [Merger Differ visualizeAsHTML]]
               :default ["./diffmerge.js" :refer [Differ Merger visualizeAsHTML]])
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.utf8 :as utf8]
            [cljs-bean.core :as bean]
            [datascript.core :as d]
            [clojure.pprint :as clj-pp]
            [logseq.graph-parser.util :as gp-util]))

(defn diff-merge
  "N-ways diff & merge
   Accept: blocks
   https://github.com/logseq/diff-merge/blob/44546f2427f20bd417b898c8ba7b7d10a9254774/lib/mldoc.ts#L17-L22
   https://github.com/logseq/diff-merge/blob/85ca7e9bf7740d3880ed97d535a4f782a963395d/lib/merge.ts#L40"
  [base & branches]
  (let [merger (Merger.)]
    (.mergeBlocks merger (bean/->js base) (bean/->js branches))))

(defn diff 
  "2-ways diff
   Accept: blocks
   https://github.com/logseq/diff-merge/blob/44546f2427f20bd417b898c8ba7b7d10a9254774/lib/mldoc.ts#L17-L22"
  [base income]
  (let [differ (Differ.)]
    (.diff_logseqMode differ (bean/->js base) (bean/->js income))))

(defonce getHTML visualizeAsHTML)


;; Copy of db/sort-by-left
(defn- sort-by-left
  ([db blocks parent]
   (sort-by-left db blocks parent {:check? true}))
  ([db blocks parent {:keys [check?]}]
   (let [blocks (gp-util/distinct-by :db/id (seq blocks))]
     (when (and check?
                ;; Top-level blocks on whiteboards have no relationships of :block/left
                (not= "whiteboard" (:block/type (d/entity db (:db/id parent)))))
       (when (not= (count blocks) (count (set (map :block/left blocks))))
         (let [duplicates (->> (map (comp :db/id :block/left) blocks)
                               frequencies
                               (filter (fn [[_k v]] (> v 1)))
                               (map (fn [[k _v]]
                                      (let [left (d/pull db '[*] k)]
                                        {:left left
                                         :duplicates (->>
                                                      (filter (fn [block]
                                                                (= k (:db/id (:block/left block))))
                                                              blocks)
                                                      (map #(select-keys % [:db/id :block/level :block/content :block/file])))}))))]
           (clj-pp/pprint duplicates)))
       (assert (= (count blocks) (count (set (map :block/left blocks)))) "Each block should have a different left node"))

     (let [left->blocks (reduce (fn [acc b] (assoc acc (:db/id (:block/left b)) b)) {} blocks)]
       (loop [block parent
              result []]
         (if-let [next (get left->blocks (:db/id block))]
           (recur next (conj result next))
           (vec result)))))))

;; Diverged of db-model/get-sorted-page-block-ids
(defn get-sorted-page-block-ids
  "page-name: the page name, original name
   return: a list with elements in:
       :id    - a list of block ids, sorted by :block/left
       :level - the level of the block, 1 for root, 2 for children of root, etc."
  [db page-name]
  {:pre [(string? page-name)]}
  (let [sanitized-page (gp-util/page-name-sanity-lc page-name)
        page-id (:db/id (d/entity db [:block/name sanitized-page]))
        root (d/entity db page-id)] ;; TODO Junyi
    (loop [result []
           children (sort-by-left db (:block/_parent root) root)
           ;; BFS log of walking depth
           levels (repeat (count children) 1)]
      (if (seq children)
        (let [child (first children)
              cur-level (first levels)
              next-children (sort-by-left db (:block/_parent child) child)]
          (recur (conj result {:id (:db/id child) :level cur-level})
                 (concat
                  next-children
                  (rest children))
                 (concat
                  (repeat (count next-children) (inc cur-level))
                  (rest levels))))
        result))))


(defn db->diff-blocks
  "db: datascript db
   page-name: string"
  [db page-name]
  {:pre (string? page-name)}
  (let [walked (get-sorted-page-block-ids db page-name)
        blocks (d/pull-many db [:block/uuid :block/content :block/level] (map :id walked))
        levels (map :level walked)
        blocks (map (fn [block level]
                      {:uuid   (:block/uuid block)
                       :body   (:block/content block)
                       :level  level})
                    blocks levels)]
    blocks))

;; Diverged from gp-block/extract-blocks
;; From back to first to ensure end_pos is correct
(defn ast->diff-blocks
  "Prepare the blocks for diff-merge
   blocks: ast of blocks
   content: corresponding raw content"
  [blocks content format {:keys [user-config block-pattern]}]
  {:pre [(seq blocks) (string? content) (contains? #{:markdown :org} format)]}
  (let [encoded-content (utf8/encode content)]
    (loop [headings []
           blocks (reverse blocks)
           properties {}
           end-pos nil]
      (if (seq blocks)
        (let [[block pos-meta] (first blocks)
                  ;; fix start_pos
                  ;; if end-pos is nil, it's the first block; no need to fix
                  ;; otherwise, the end_pos of the current block should be the start_pos of the previous block
                  ;; (as we are iterating from back to first)
              pos-meta (if end-pos
                         (assoc pos-meta :end_pos end-pos)
                         pos-meta)]
          (cond
            (or (= 0 (:end_pos pos-meta)) ;; pre-block or first block
                (gp-block/heading-block? block))
            (let [content (gp-block/get-block-content encoded-content block format pos-meta block-pattern)]
              (recur (conj headings {:body  content
                                     :level (:level (second block))
                                     :uuid  (:id properties)})
                     (rest blocks) {} (:start_pos pos-meta))) ;; The current block's start pos is the next block's end pos

            (gp-property/properties-ast? block)
            (let [new-props (:properties (gp-block/extract-properties (second block) (assoc user-config :format format)))]
              ;; sending the current end pos to next, as it's not finished yet
              ;; supports multiple properties sub-block possible in future
              (recur headings (rest blocks) (merge properties new-props) (:end_pos pos-meta)))

            :else
            (recur headings (rest blocks) properties (:end_pos pos-meta))))
        (reverse headings)))))
