(ns frontend.worker.handler.page.file-based.page
  "Page operations for file graphs"
  (:require [logseq.db :as ldb]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.property :as gp-property]
            [logseq.outliner.core :as outliner-core]
            [datascript.core :as d]
            [clojure.string :as string]
            [logseq.graph-parser.text :as text]
            [logseq.common.util :as common-util]
            [logseq.common.config :as common-config]
            [frontend.common.date :as common-date]
            [logseq.db.frontend.order :as db-order]))

(defn- file-based-properties-block
  [repo conn config date-formatter properties format page]
  (let [content (gp-property/insert-properties repo format "" properties)
        refs (gp-block/get-page-refs-from-properties properties @conn date-formatter config)]
    {:block/pre-block? true
     :block/uuid (ldb/new-block-id)
     :block/properties properties
     :block/properties-order (keys properties)
     :block/refs refs
     :block/order (db-order/gen-key nil nil)
     :block/format format
     :block/title content
     :block/parent page
     :block/page page}))

(defn- build-page-tx [repo conn config date-formatter format properties page {:keys [whiteboard? tags]}]
  (when (:block/uuid page)
    (let [page-entity   [:block/uuid (:block/uuid page)]
          page'          (merge page
                                (when whiteboard? {:block/type "whiteboard"})
                                (when tags {:block/tags (mapv #(hash-map :db/id
                                                                         (:db/id (d/entity @conn [:block/uuid %])))
                                                              tags)}))
          file-page (merge page'
                           (when (seq properties) {:block/properties properties}))]
      (if (and (seq properties)
               (not whiteboard?)
               (ldb/page-empty? @conn (:block/name page)))
        [file-page (file-based-properties-block repo conn config date-formatter properties format page-entity)]
        [file-page]))))

(defn get-title-and-pagename
  [title]
  (let [title      (-> (string/trim title)
                       (text/page-ref-un-brackets!)
                        ;; remove `#` from tags
                       (string/replace #"^#+" ""))
        title      (common-util/remove-boundary-slashes title)
        page-name  (common-util/page-name-sanity-lc title)]
    [title page-name]))

(defn- build-first-block-tx
  [page-uuid format]
  (let [page-id [:block/uuid page-uuid]]
    [(outliner-core/block-with-timestamps
      {:block/uuid (ldb/new-block-id)
       :block/page page-id
       :block/parent page-id
       :block/order (db-order/gen-key nil nil)
       :block/title ""
       :block/format format})]))

(defn create!
  [repo conn config title {:keys [create-first-block? format properties uuid persist-op? whiteboard? today-journal?]
                           :or   {create-first-block?      true
                                  format                   nil
                                  properties               nil
                                  uuid                     nil
                                  persist-op?              true}
                           :as options}]
  (let [date-formatter (common-config/get-date-formatter config)
        split-namespace? (not (or (string/starts-with? title "hls__")
                                  (common-date/valid-journal-title? date-formatter title)))
        [title page-name] (get-title-and-pagename title)]
    (when-not (ldb/get-page @conn page-name)
      (let [pages    (if split-namespace?
                       (common-util/split-namespace-pages title)
                       [title])
            format   (or format (common-config/get-preferred-format config))
            pages    (map (fn [page]
                            ;; only apply uuid to the deepest hierarchy of page to create if provided.
                            (-> (gp-block/page-name->map page @conn true date-formatter
                                                         {:page-uuid (when (uuid? uuid) uuid)})
                                (assoc :block/format format)))
                          pages)
            txs      (->> pages
                            ;; for namespace pages, only last page need properties
                          drop-last
                          (mapcat #(build-page-tx repo conn config date-formatter format nil % {}))
                          (remove nil?))
            txs      (map-indexed (fn [i page]
                                    (if (zero? i)
                                      page
                                      (assoc page :block/namespace
                                             [:block/uuid (:block/uuid (nth txs (dec i)))])))
                                  txs)
            page-uuid (:block/uuid (last pages))
            page-txs (build-page-tx repo conn config date-formatter format properties (last pages) (select-keys options [:whiteboard? :tags]))
            page-txs (if (seq txs)
                       (update page-txs 0
                               (fn [p]
                                 (assoc p :block/namespace [:block/uuid (:block/uuid (last txs))])))
                       page-txs)
            first-block-tx (when (and
                                  (nil? (d/entity @conn [:block/uuid page-uuid]))
                                  create-first-block?
                                  (not whiteboard?)
                                  page-txs)
                             (build-first-block-tx (:block/uuid (first page-txs)) format))
            txs      (concat
                      txs
                      page-txs
                      first-block-tx)]
        (when (seq txs)
          (ldb/transact! conn txs (cond-> {:persist-op? persist-op?
                                           :outliner-op :create-page}
                                    today-journal?
                                    (assoc :create-today-journal? true
                                           :today-journal-name page-name))))
        [page-name page-uuid]))))
