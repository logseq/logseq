(ns logseq.graph-parser.whiteboard
  "Whiteboard related parser utilities"
  (:require [logseq.db.frontend.property.util :as db-property-util]
            [logseq.db.sqlite.util :as sqlite-util]))

(defn block->shape [block]
  (get-in block [:block/properties :logseq.tldraw.shape]))

(defn shape-block? [block]
  (= :whiteboard-shape (get-in block [:block/properties :ls-type])))

;; tldraw shape props is now saved into [:block/properties :logseq.tldraw.shape]
;; migrate
(defn shape-block-needs-migrate? [block]
  (let [properties (:block/properties block)]
    (and (seq properties)
         (and (= :whiteboard-shape (:ls-type properties))
              (not (seq (get properties :logseq.tldraw.shape)))))))

(defn page-block-needs-migrate? [block]
  (let [properties (:block/properties block)]
    (and (seq properties)
         (and (= :whiteboard-page (:ls-type properties))
              (not (seq (get properties :logseq.tldraw.page)))))))

(defn migrate-shape-block [block]
  (if (shape-block-needs-migrate? block)
    (let [properties (:block/properties block)
          properties (assoc properties :logseq.tldraw.shape properties)]
      (assoc block :block/properties properties))
    block))

(defn migrate-page-block [block]
  (if (page-block-needs-migrate? block)
    (let [properties (:block/properties block)
          properties (assoc properties :logseq.tldraw.page properties)]
      (assoc block :block/properties properties))
    block))


(defn- get-shape-refs [shape]
  (let [portal-refs (when (= "logseq-portal" (:type shape))
                      [{:block/uuid (uuid (:pageId shape))}])
        shape-link-refs (->> (:refs shape)
                             (filter (complement empty?))
                             (keep (fn [ref] (when (parse-uuid ref)
                                              {:block/uuid (parse-uuid ref)}))))]
    (concat portal-refs shape-link-refs)))

(defn- with-whiteboard-block-refs
  [shape page-id]
  (let [refs (or (get-shape-refs shape) [])]
    (merge {:block/refs (if (seq refs) refs [])
            :block/path-refs (if (seq refs)
                               (conj refs page-id)
                               [])})))

(defn- with-whiteboard-content
  "Main purpose of this function is to populate contents when shapes are used as references in outliner."
  [shape]
  {:block/title (case (:type shape)
                    "text" (:text shape)
                    "logseq-portal" ""
                    "line" (str "whiteboard arrow" (when-let [label (:label shape)] (str ": " label)))
                    (str "whiteboard " (:type shape)))})

(defn with-whiteboard-block-props
  "Builds additional block attributes for a whiteboard block. Expects :block/properties
   to be in file graph format"
  [block page-id]
  (let [shape? (shape-block? block)
        shape (block->shape block)]
    (merge (when shape?
             (merge
              {:block/uuid (uuid (:id shape))}
              (with-whiteboard-block-refs shape page-id)
              (with-whiteboard-content shape)))
           (when (nil? (:block/parent block)) {:block/parent page-id})
           (when (nil? (:block/format block)) {:block/format :markdown}) ;; TODO: read from config
           {:block/page page-id})))

(defn shape->block [repo shape page-id]
  (let [block-uuid (if (uuid? (:id shape)) (:id shape) (uuid (:id shape)))
        properties {(db-property-util/get-pid repo :logseq.property/ls-type) :whiteboard-shape
                    (db-property-util/get-pid repo :logseq.property.tldraw/shape) shape}
        block {:block/uuid block-uuid
               :block/title ""
               :block/page page-id
               :block/parent page-id}
        block' (if (sqlite-util/db-based-graph? repo)
                 (merge block properties)
                 (assoc block :block/properties properties))
        additional-props (with-whiteboard-block-props block' page-id)]
    (merge block' additional-props)))
