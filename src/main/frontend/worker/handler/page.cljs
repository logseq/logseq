(ns frontend.worker.handler.page
  (:require [logseq.db :as ldb]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.property :as gp-property]
            [logseq.db.sqlite.util :as sqlite-util]
            [datascript.core :as d]
            [clojure.string :as string]
            [frontend.worker.date :as date]
            [logseq.graph-parser.text :as text]
            [logseq.common.util :as common-util]
            [logseq.common.config :as common-config]))

(defn properties-block
  [repo conn config date-formatter properties format page]
  (let [content (gp-property/insert-properties repo format "" properties)
        refs (gp-block/get-page-refs-from-properties properties @conn date-formatter config)]
    {:block/pre-block? true
     :block/uuid (ldb/new-block-id)
     :block/properties properties
     :block/properties-order (keys properties)
     :block/refs refs
     :block/left page
     :block/format format
     :block/content content
     :block/parent page
     :block/page page}))

(defn- build-page-tx [repo conn config date-formatter format properties page {:keys [whiteboard? class? tags]}]
  (when (:block/uuid page)
    (let [page-entity   [:block/uuid (:block/uuid page)]
          page          (merge page
                               (when (seq properties) {:block/properties properties})
                               (when whiteboard? {:block/type "whiteboard"})
                               (when class? {:block/type "class"})
                               (when tags {:block/tags (mapv #(hash-map :db/id
                                                                        (:db/id (d/entity @conn [:block/uuid %])))
                                                             tags)}))
          page-empty?   (ldb/page-empty? @conn (:block/name page))
          db-based? (sqlite-util/db-based-graph? repo)]
      (if (and (seq properties)
               (not whiteboard?)
               (not db-based?)
               page-empty?)
        [page (properties-block repo conn config date-formatter properties format page-entity)]
        [page]))))

(defn create!
  "Create page. Has the following options:

   * :create-first-block? - when true, create an empty block if the page is empty.
   * :uuid                - when set, use this uuid instead of generating a new one.
   * :class?              - when true, adds a :block/type 'class'
   * :whiteboard?         - when true, adds a :block/type 'whiteboard'
   * :tags                - tag uuids that are added to :block/tags
   * :persist-op?         - when true, add an update-page op
   TODO: Add other options"
  [repo conn config title
   & {:keys [create-first-block? format properties uuid rename? persist-op? whiteboard? class?]
      :or   {create-first-block? true
             rename?             false
             format              nil
             properties          nil
             uuid                nil
             persist-op?         true}
      :as options}]
  (let [date-formatter (common-config/get-date-formatter config)
        split-namespace? (not (or (string/starts-with? title "hls__")
                                  (date/valid-journal-title? date-formatter title)))
        title      (-> (string/trim title)
                       (text/page-ref-un-brackets!)
                        ;; remove `#` from tags
                       (string/replace #"^#+" ""))
        title      (common-util/remove-boundary-slashes title)
        page-name  (common-util/page-name-sanity-lc title)
        with-uuid? (if (uuid? uuid) uuid true)] ;; FIXME: prettier validation
    (when (or (ldb/page-empty? @conn page-name) rename?)
      (let [pages    (if split-namespace?
                       (common-util/split-namespace-pages title)
                       [title])
            format   (or format (common-config/get-preferred-format config))
            pages    (map (fn [page]
                             ;; only apply uuid to the deepest hierarchy of page to create if provided.
                            (-> (gp-block/page-name->map page (if (= page title) with-uuid? true) @conn true date-formatter)
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
            last-txs (build-page-tx repo conn config date-formatter format properties (last pages) (select-keys options [:whiteboard? :class? :tags]))
            last-txs (if (seq txs)
                       (update last-txs 0
                               (fn [p]
                                 (assoc p :block/namespace [:block/uuid (:block/uuid (last txs))])))
                       last-txs)
            first-block-tx (when (and
                                  create-first-block?
                                  (not (or whiteboard? class?))
                                  (ldb/page-empty? @conn (:db/id (d/entity @conn [:block/name page-name])))
                                  (seq txs))
                             (let [page-id [:block/uuid (:block/uuid (last txs))]]
                               [(sqlite-util/block-with-timestamps
                                 {:block/uuid (ldb/new-block-id)
                                  :block/page page-id
                                  :block/parent page-id
                                  :block/left page-id
                                  :block/content ""
                                  :block/format format})]))
            txs      (concat
                      (when (and rename? uuid)
                        (when-let [e (d/entity @conn [:block/uuid uuid])]
                          [[:db/retract (:db/id e) :block/namespace]
                           [:db/retract (:db/id e) :block/refs]]))
                      txs
                      last-txs
                      first-block-tx)]
        (when (seq txs)
          (d/transact! conn txs {:persist-op? persist-op?})
          page-name)))))
