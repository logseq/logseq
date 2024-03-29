(ns logseq.graph-parser.whiteboard
  "Whiteboard related parser utilities"
  (:require [logseq.common.util :as common-util]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.frontend.property :as db-property]))

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
                      [(if (= (:blockType shape) "P")
                         {:block/name (common-util/page-name-sanity-lc (:pageId shape))}
                         {:block/uuid (uuid (:pageId shape))})])
        shape-link-refs (->> (:refs shape)
                             (filter (complement empty?))
                             (map (fn [ref] (if (parse-uuid ref)
                                              {:block/uuid (parse-uuid ref)}
                                              {:block/name (common-util/page-name-sanity-lc ref)}))))]
    (concat portal-refs shape-link-refs)))

(defn- with-whiteboard-block-refs
  [shape page-name]
  (let [refs (or (get-shape-refs shape) [])]
    (merge {:block/refs (if (seq refs) refs [])
            :block/path-refs (if (seq refs)
                               (conj refs {:block/name page-name})
                               [])})))

(defn- with-whiteboard-content
  "Main purpose of this function is to populate contents when shapes are used as references in outliner."
  [shape]
  {:block/content (case (:type shape)
                    "text" (:text shape)
                    "logseq-portal" (if (= (:blockType shape) "P")
                                      (page-ref/->page-ref (:pageId shape))
                                      (block-ref/->block-ref (:pageId shape)))
                    "line" (str "whiteboard arrow" (when-let [label (:label shape)] (str ": " label)))
                    (str "whiteboard " (:type shape)))})

(defn with-whiteboard-block-props
  "Builds additional block attributes for a whiteboard block. Expects :block/properties
   to be in file graph format"
  [block page-name]
  (let [shape? (shape-block? block)
        shape (block->shape block)
        default-page-ref {:block/name page-name}]
    (merge (when shape?
             (merge
              {:block/uuid (uuid (:id shape))}
              (with-whiteboard-block-refs shape page-name)
              (with-whiteboard-content shape)))
           (when (nil? (:block/parent block)) {:block/parent default-page-ref})
           (when (nil? (:block/format block)) {:block/format :markdown}) ;; TODO: read from config
           {:block/page default-page-ref})))

(defn shape->block [repo db shape page-name]
  (let [properties {(db-property/get-pid repo db :logseq.property/ls-type) :whiteboard-shape
                    (db-property/get-pid repo db :logseq.property.tldraw/shape) shape}
        page-name (common-util/page-name-sanity-lc page-name)
        block {:block/uuid (if (uuid? (:id shape)) (:id shape) (uuid (:id shape)))
               :block/page {:block/name page-name}
               :block/parent {:block/name page-name}
               :block/properties properties}
        additional-props (with-whiteboard-block-props
                           (assoc block :block/properties {:ls-type :whiteboard-shape :logseq.tldraw.shape shape})
                           page-name)]
    (merge block additional-props)))
