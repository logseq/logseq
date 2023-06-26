(ns frontend.fs.diff-merge
  "Implementation of text (file) based content diff & merge for conflict resolution"
  (:require ["@logseq/diff-merge" :refer [attach_uuids Differ Merger]]
            [cljs-bean.core :as bean]
            [frontend.db.model :as db-model]
            [frontend.db.utils :as db-utils]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.utf8 :as utf8]
            [clojure.string :as string]))


(defn diff
  "2-ways diff
   Accept: blocks in the struct with the required info
   Please refer to the `Block` struct in the link below
   https://github.com/logseq/diff-merge/blob/master/lib/mldoc.ts"
  [base incoming]
  (let [differ (Differ.)]
    (.diff_logseqMode differ (bean/->js base) (bean/->js incoming))))

;; (defonce getHTML visualizeAsHTML)

(defonce attachUUID attach_uuids)

(defn db->diff-blocks
  "db: datascript db
   page-name: string"
  [page-name]
  {:pre (string? page-name)}
  (let [walked (db-model/get-sorted-page-block-ids-and-levels page-name)
        blocks (db-utils/pull-many [:block/uuid :block/content :block/level] (map :id walked))
        levels (map :level walked)
        blocks (map (fn [block level]
                      {:uuid   (str (:block/uuid block)) ;; Force to be string
                       :body   (:block/content block)
                       :level  level})
                    blocks levels)]
    blocks))

;; TODO: Switch to ast->diff-blocks-alt
;; Diverged from gp-block/extract-blocks for decoupling
;; The process of doing 2 way diff is like:
;; 1. Given a base ver. of page (AST in DB), and a branch ver. of page (externally modified file content)
;; 2. Transform both base ver (done by THIS fn). & branch ver. into the same format (diff-blocks)
;; 3. Apply diff-merge/diff on them, which returns the resolved uuids of the branch ver
;; 4. Attach these resolved uuids into the blocks newly parsed by graph-parser
;; Keep all the diff-merge fns, including diff-merge/ast->diff-blocks out of the graph-parser,
;;   Only inject the step 4 into graph-parser as a hook
(defn ast->diff-blocks
  "Prepare the blocks for diff-merge
   blocks: ast of blocks
   content: corresponding raw content"
  [blocks content format {:keys [user-config block-pattern]}]
  {:pre [(string? content) (contains? #{:markdown :org} format)]}
  (let [encoded-content (utf8/encode content)]
    (loop [headings []
           blocks (reverse blocks)
           properties {}
           end-pos (.-length encoded-content)]
      (if (seq blocks)
        (let [[block pos-meta] (first blocks)
              ;; fix start_pos
              pos-meta (assoc pos-meta :end_pos end-pos)]
          (cond
            (gp-block/heading-block? block)
            (let [content (gp-block/get-block-content encoded-content (second block) format pos-meta block-pattern)]
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
        (if (empty? properties)
          (reverse headings)
          ;; Add pre-blocks
          (let [[block _] (first blocks)
                pos-meta {:start_pos 0 :end_pos end-pos}
                content (gp-block/get-block-content encoded-content block format pos-meta block-pattern)
                uuid (:id properties)]
            (cons {:body content
                   :level 1
                   :uuid uuid}
                  (reverse headings))))))))


(defn- get-sub-content-from-pos-meta
  "Replace gp-block/get-block-content, return bare content, without any trim"
  [raw-content pos-meta]
  (let [{:keys [start_pos end_pos]} pos-meta]
    (utf8/substring raw-content start_pos end_pos)))

;; Diverged from ast->diff-blocks
;; Add :meta :raw-body to the block
(defn- ast->diff-blocks-alt
  "Prepare the blocks for diff-merge
   blocks: ast of blocks
   content: corresponding raw content"
  [blocks content format {:keys [user-config block-pattern]}]
  {:pre [(string? content) (contains? #{:markdown :org} format)]}
  (let [utf8-encoded-content (utf8/encode content)]
    (loop [headings []
           blocks (reverse blocks)
           properties {}
           end-pos (.-length utf8-encoded-content)]
      (cond
        (seq blocks)
        (let [[block pos-meta] (first blocks)
              ;; fix start_pos for properties
              fixed-pos-meta (assoc pos-meta :end_pos end-pos)]
          (cond
            (gp-block/heading-block? block)
            (let [content (gp-block/get-block-content utf8-encoded-content (second block) format fixed-pos-meta block-pattern)
                  content-raw (get-sub-content-from-pos-meta utf8-encoded-content fixed-pos-meta)]
              (recur (conj headings {:body  content
                                     :meta  {:raw-body (string/trimr content-raw)}
                                     :level (:level (second block))
                                     :uuid  (:id properties)})
                     (rest blocks)
                     {}
                     (:start_pos fixed-pos-meta))) ;; The current block's start pos is the next block's end pos

            (gp-property/properties-ast? block)
            (let [new-props (:properties (gp-block/extract-properties (second block) (assoc user-config :format format)))]
              ;; sending the current end pos to next, as it's not finished yet
              ;; supports multiple properties sub-block possible in future
              (recur headings (rest blocks) (merge properties new-props) (:end_pos fixed-pos-meta)))

            :else
            (recur headings (rest blocks) properties (:end_pos fixed-pos-meta))))

        (empty? properties)
        (reverse headings)

        ;; Add pre-blocks
        :else ;; ??? unreachable
        (let [[block _] (first blocks)
              pos-meta {:start_pos 0 :end_pos end-pos}
              content (gp-block/get-block-content utf8-encoded-content block format pos-meta block-pattern)
              content-raw (get-sub-content-from-pos-meta utf8-encoded-content pos-meta)
              uuid (:id properties)]
          (cons {:body content
                 :meta {:raw-body (string/trimr content-raw)}
                 :level 1
                 :uuid uuid}
                (reverse headings)))))))

(defn- rebuild-content
  "translate [[[op block]]] to merged content"
  [_base-diffblocks diffs _format]
  ;; [[[0 {:body "attrib:: xxx", :level 1, :uuid nil}] ...] ...]
  (let  [ops-fn (fn [ops]
                  (map (fn [[op {:keys [meta]}]]
                         (when (or (= op 0) (= op 1)) ;; equal or insert
                           (:raw-body meta)))
                       ops))]
    (->> diffs
         (mapcat ops-fn)
         (filter seq)
         (string/join "\n"))))

(defn three-way-merge
  [base income current format]
  (let [->ast (fn [text] (if (= format :org)
                           (gp-mldoc/->edn text (gp-mldoc/default-config :org))
                           (gp-mldoc/->edn text (gp-mldoc/default-config :markdown))))
        options (if (= format :org)
                  {:block-pattern "*"}
                  {:block-pattern "-"})
        merger (Merger.)
        base-ast (->ast base)
        base-diffblocks (ast->diff-blocks-alt base-ast base format options)
        income-ast (->ast income)
        income-diffblocks (ast->diff-blocks-alt income-ast income format options)
        current-ast (->ast current)
        current-diffblocks (ast->diff-blocks-alt current-ast current format options)
        branch-diffblocks [income-diffblocks current-diffblocks]
        merged (.mergeBlocks merger (bean/->js base-diffblocks) (bean/->js branch-diffblocks))
        ;; For extracting diff-merge test cases
        ;; _ (prn "input:")
        ;; _ (prn (js/JSON.stringify (bean/->js base-diffblocks)))
        ;; _ (prn (js/JSON.stringify (bean/->js branch-diffblocks)))
        ;; _ (prn "logseq diff merge version: " version)
        ;; _ (prn "output:")
        ;; _ (prn (js/JSON.stringify merged))
        merged-diff (bean/->clj merged)
        merged-content (rebuild-content base-diffblocks merged-diff format)]
    merged-content))
