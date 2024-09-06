(ns frontend.worker.handler.page.db-based.page
  "Page operations for DB graphs"
  (:require [logseq.db :as ldb]
            [logseq.graph-parser.block :as gp-block]
            [logseq.db.sqlite.util :as sqlite-util]
            [datascript.core :as d]
            [clojure.string :as string]
            [logseq.graph-parser.text :as text]
            [logseq.common.util :as common-util]
            [logseq.db.frontend.order :as db-order]
            [logseq.db.frontend.property.util :as db-property-util]
            [logseq.db.frontend.property.build :as db-property-build]
            [logseq.db.frontend.class :as db-class]))

(defn- build-page-tx [conn properties page {:keys [whiteboard? class? tags]}]
  (when (:block/uuid page)
    (let [page (assoc page :block/type (cond class? "class"
                                             whiteboard? "whiteboard"
                                             (:block/type page) (:block/type page)
                                             :else "page"))
          page' (cond-> page
                  (seq tags)
                  (update :block/tags
                          (fnil into [])
                          (mapv (fn [tag]
                                  (if (uuid? tag)
                                    (d/entity @conn [:block/uuid tag])
                                    tag))
                                tags)))
          property-vals-tx-m
          ;; Builds property values for built-in properties like logseq.property.pdf/file
          (db-property-build/build-property-values-tx-m
           page'
           (->> properties
                (keep (fn [[k v]]
                        ;; TODO: Pass in property type in order to support property
                        ;; types other than :default
                        (when (db-property-util/built-in-has-ref-value? k)
                          [k v])))
                (into {})))]
      (cond-> [(if class? (db-class/build-new-class @conn page') page')]
        (seq property-vals-tx-m)
        (into (vals property-vals-tx-m))
        true
        (conj (merge {:block/uuid (:block/uuid page)}
                     properties
                     (db-property-build/build-properties-with-ref-values property-vals-tx-m)))))))

;; TODO: Revisit title cleanup as this was copied from file implementation
(defn sanitize-title
  [title]
  (let [title      (-> (string/trim title)
                       (text/page-ref-un-brackets!)
                        ;; remove `#` from tags
                       (string/replace #"^#+" ""))
        title      (common-util/remove-boundary-slashes title)]
    title))

(defn build-first-block-tx
  [page-uuid format]
  (let [page-id [:block/uuid page-uuid]]
    [(sqlite-util/block-with-timestamps
      {:block/uuid (ldb/new-block-id)
       :block/page page-id
       :block/parent page-id
       :block/order (db-order/gen-key nil nil)
       :block/title ""
       :block/format format})]))

(defn create!
  [conn title*
   {:keys [create-first-block? properties uuid persist-op? whiteboard? class? today-journal?]
    :or   {create-first-block?      true
           properties               nil
           uuid                     nil
           persist-op?              true}
    :as options}]
  (let [date-formatter (:logseq.property.journal/title-format (d/entity @conn :logseq.class/Journal))
        title (sanitize-title title*)
        type (cond class?
                   "class"
                   whiteboard?
                   "whiteboard"
                   today-journal?
                   "journal"
                   :else
                   "page")]
    (when-not (ldb/page-exists? @conn title type)
      (let [format    :markdown
            page      (-> (gp-block/page-name->map title @conn true date-formatter
                                                   {:class? class?
                                                    :page-uuid (when (uuid? uuid) uuid)
                                                    :skip-existing-page-check? true})
                          (assoc :block/format format))
            page-uuid (:block/uuid page)
            page-txs  (build-page-tx conn properties page (select-keys options [:whiteboard? :class? :tags]))
            first-block-tx (when (and
                                  (nil? (d/entity @conn [:block/uuid page-uuid]))
                                  create-first-block?
                                  (not (or whiteboard? class?))
                                  page-txs)
                             (build-first-block-tx (:block/uuid (first page-txs)) format))
            txs      (concat
                      page-txs
                      first-block-tx)]
        (when (seq txs)
          (ldb/transact! conn txs (cond-> {:persist-op? persist-op?
                                           :outliner-op :create-page}
                                    today-journal?
                                    (assoc :create-today-journal? true
                                           :today-journal-name title))))
        [title page-uuid]))))
