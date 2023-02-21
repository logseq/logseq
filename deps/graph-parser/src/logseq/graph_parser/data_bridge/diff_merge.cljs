(ns logseq.graph-parser.data-bridge.diff-merge
  (:require ["./diff-merge.umd.cjs" :refer [Merger visualizeAsHTML]]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.util.db :as db-util]
            [logseq.graph-parser.utf8 :as utf8]
            [cljs-bean.core :as bean]
            [datascript.core :as d]
            [clojure.string :as string]))

(defn diff-merge
  "Accept: blocks
   https://github.com/logseq/diff-merge/blob/44546f2427f20bd417b898c8ba7b7d10a9254774/lib/mldoc.ts#L17-L22
   https://github.com/logseq/diff-merge/blob/85ca7e9bf7740d3880ed97d535a4f782a963395d/lib/merge.ts#L40"
  [base & branches]
  (let [mldoc gp-mldoc/MldocInstance
        merger (Merger. mldoc)]
    (.mergeBlocks merger base (bean/->js branches))))

(defonce getHTML visualizeAsHTML)

(defn db->diff-blocks
  "db: datascript db
   page-name: string"
  [db page-name]
  {:pre (string? page-name)}
  (let [walked (db-util/get-sorted-page-block-ids db page-name)
        blocks (d/pull-many db [:block/uuid :block/content :block/level] (map :id walked))
        levels (map :level walked)
        blocks (map (fn [block level]
                      {:uuid   (:block/uuid block)
                       :bodies (string/split-lines (:block/content block))
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
              (recur (conj headings {:body content
                                     :level (:level (second block))
                                     :uuid (:id properties)})
                     (rest blocks) {} (:start_pos pos-meta))) ;; The current block's start pos is the next block's end pos

            (gp-property/properties-ast? block)
            (let [new-props (:properties (gp-block/extract-properties (second block) (assoc user-config :format format)))]
              ;; sending the current end pos to next, as it's not finished yet
              ;; supports multiple properties sub-block possible in future
              (recur headings (rest blocks) (merge properties new-props) (:end_pos pos-meta)))

            :else
            (recur headings (rest blocks) properties (:end_pos pos-meta))))
        (reverse headings)))))
