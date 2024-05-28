(ns frontend.worker.handler.page
  "Page operations"
  (:require [logseq.db :as ldb]
            [logseq.graph-parser.db :as gp-db]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.property :as gp-property]
            [logseq.db.sqlite.util :as sqlite-util]
            [datascript.core :as d]
            [clojure.string :as string]
            [logseq.graph-parser.text :as text]
            [logseq.common.util :as common-util]
            [logseq.common.config :as common-config]
            [logseq.db.frontend.content :as db-content]
            [medley.core :as medley]
            [frontend.worker.date :as date]
            [logseq.db.frontend.order :as db-order]
            [logseq.db.frontend.property.util :as db-property-util]
            [logseq.db.frontend.property.build :as db-property-build]
            [logseq.db.frontend.class :as db-class]))

(defn properties-block
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
     :block/content content
     :block/parent page
     :block/page page}))

(defn- build-page-tx [repo conn config date-formatter format properties page {:keys [whiteboard? class? tags]}]
  (when (:block/uuid page)
    (let [page-entity   [:block/uuid (:block/uuid page)]
          page'          (merge page
                                (when whiteboard? {:block/type "whiteboard"})
                                (when tags {:block/tags (mapv #(hash-map :db/id
                                                                         (:db/id (d/entity @conn [:block/uuid %])))
                                                              tags)}))]
      (if (sqlite-util/db-based-graph? repo)
        (let [property-vals-tx-m
              ;; Builds property values for built-in properties like logseq.property.pdf/file
              (db-property-build/build-property-values-tx-m
               page'
               (->> properties
                    (keep (fn [[k v]]
                            (when (db-property-util/built-in-has-ref-value? k)
                              [k v])))
                    (into {})))]
          (cond-> [(if class? (db-class/build-new-class @conn page') page')]
            (seq property-vals-tx-m)
            (into (vals property-vals-tx-m))
            true
            (conj (merge {:block/uuid (:block/uuid page)}
                       ;; FIXME: Add refs for properties?
                         properties
                         (db-property-build/build-properties-with-ref-values property-vals-tx-m)))))
        (let [file-page (merge page'
                               (when (seq properties) {:block/properties properties}))]
          (if (and (seq properties)
                   (not whiteboard?)
                   (ldb/page-empty? @conn (:block/name page)))
            [file-page (properties-block repo conn config date-formatter properties format page-entity)]
            [file-page]))))))

(defn get-title-and-pagename
  [title]
  (let [title      (-> (string/trim title)
                       (text/page-ref-un-brackets!)
                        ;; remove `#` from tags
                       (string/replace #"^#+" ""))
        title      (common-util/remove-boundary-slashes title)
        page-name  (common-util/page-name-sanity-lc title)]
    [title page-name]))

(defn create!
  "Create page. Has the following options:

   * :create-first-block? - when true, create an empty block if the page is empty.
   * :uuid                - when set, use this uuid instead of generating a new one.
   * :class?              - when true, adds a :block/type 'class'
   * :whiteboard?         - when true, adds a :block/type 'whiteboard'
   * :tags                - tag uuids that are added to :block/tags
   * :persist-op?         - when true, add an update-page op
   * :properties          - properties to add to the page
   TODO: Add other options"
  [repo conn config title
   & {:keys [create-first-block? format properties uuid persist-op? whiteboard? class? today-journal?]
      :or   {create-first-block? true
             format              nil
             properties          nil
             uuid                nil
             persist-op?         true}
      :as options}]
  (let [db-based? (ldb/db-based-graph? @conn)
        date-formatter (common-config/get-date-formatter config)
        split-namespace? (and
                          (not db-based?)
                          (not (or (string/starts-with? title "hls__")
                                   (date/valid-journal-title? date-formatter title))))
        [title page-name] (get-title-and-pagename title)
        with-uuid? (if (uuid? uuid) uuid true)
        [page-uuid result] (when (ldb/page-empty? @conn page-name)
                             (let [pages    (if split-namespace?
                                              (common-util/split-namespace-pages title)
                                              [title])
                                   format   (or format (common-config/get-preferred-format config))
                                   pages    (map (fn [page]
                                                   ;; only apply uuid to the deepest hierarchy of page to create if provided.
                                                   (-> (gp-block/page-name->map page (if (= page title) with-uuid? true) @conn true date-formatter :class? class?)
                                                       (assoc :block/format format)))
                                                 pages)
                                   txs      (when-not db-based?
                                              (->> pages
                                                   ;; for namespace pages, only last page need properties
                                                   drop-last
                                                   (mapcat #(build-page-tx repo conn config date-formatter format nil % {}))
                                                   (remove nil?)))
                                   txs      (when-not db-based?
                                              (map-indexed (fn [i page]
                                                             (if (zero? i)
                                                               page
                                                               (assoc page :block/namespace
                                                                      [:block/uuid (:block/uuid (nth txs (dec i)))])))
                                                           txs))
                                   txs      (when-not db-based?
                                              (map-indexed (fn [i page]
                                                             (if (zero? i)
                                                               page
                                                               (assoc page :block/namespace
                                                                      [:block/uuid (:block/uuid (nth txs (dec i)))])))
                                                           txs))
                                   page-uuid (:block/uuid (last pages))
                                   page-txs (build-page-tx repo conn config date-formatter format properties (last pages) (select-keys options [:whiteboard? :class? :tags]))
                                   page-txs (if (and (seq txs) (not db-based?))
                                              (update page-txs 0
                                                      (fn [p]
                                                        (assoc p :block/namespace [:block/uuid (:block/uuid (last txs))])))
                                              page-txs)
                                   first-block-tx (when (and
                                                         create-first-block?
                                                         (not (or whiteboard? class?))
                                                         page-txs)
                                                    (let [page-id [:block/uuid (:block/uuid (first page-txs))]]
                                                      [(sqlite-util/block-with-timestamps
                                                        {:block/uuid (ldb/new-block-id)
                                                         :block/page page-id
                                                         :block/parent page-id
                                                         :block/order (db-order/gen-key nil nil)
                                                         :block/content ""
                                                         :block/format format})]))
                                   txs      (concat
                                             txs
                                             page-txs
                                             first-block-tx)]
                               (when (seq txs)
                                 [page-uuid (ldb/transact! conn txs (cond-> {:persist-op? persist-op?
                                                                             :outliner-op :create-page}
                                                                      today-journal?
                                                                      (assoc :create-today-journal? true
                                                                             :today-journal-name page-name)))])))] ;; FIXME: prettier validation
    [result page-name page-uuid]))

(defn db-refs->page
  "Replace [[page name]] with page name"
  [repo page-entity]
  (when (sqlite-util/db-based-graph? repo)
    (let [refs (:block/_refs page-entity)
          id-ref->page #(db-content/special-id-ref->page % [page-entity])]
      (when (seq refs)
        (let [tx-data (mapcat (fn [{:block/keys [raw-content properties] :as ref}]
                                ;; block content or properties
                                (let [content' (id-ref->page raw-content)
                                      content-tx (when (not= raw-content content')
                                                   {:db/id (:db/id ref)
                                                    :block/content content'})
                                      page-uuid (:block/uuid page-entity)
                                      properties' (-> (medley/map-vals (fn [v]
                                                                         (cond
                                                                           (and (coll? v) (uuid? (first v)))
                                                                           (vec (remove #{page-uuid} v))

                                                                           (and (uuid? v) (= v page-uuid))
                                                                           nil

                                                                           (and (coll? v) (string? (first v)))
                                                                           (mapv id-ref->page v)

                                                                           (string? v)
                                                                           (id-ref->page v)

                                                                           :else
                                                                           v)) properties)
                                                      (common-util/remove-nils-non-nested))
                                      tx (merge
                                          content-tx
                                          (when (not= (seq properties) (seq properties'))
                                            {:db/id (:db/id ref)
                                             ;; FIXME: properties
                                             :block/properties properties'}))]
                                  (concat
                                   [[:db/retract (:db/id ref) :block/refs (:db/id page-entity)]]
                                   (when tx [tx])))) refs)]
          tx-data)))))

(defn- page-unable-to-delete
  "If a page is unable to delete, returns a map with more information. Otherwise returns nil"
  [conn page]
  (try
    (cond
      ;; TODO: allow users to delete not built-in properties
      (contains? (:block/type page) "property")
      (cond (seq (ldb/get-classes-with-property @conn (:block/uuid page)))
            {:msg "Page content deleted but unable to delete this page because classes use this property"}
            (seq (ldb/get-block-property-values @conn (:block/uuid page)))
            {:msg "Page content deleted but unable to delete this page because blocks use this property"})

      (or (seq (:block/_refs page)) (contains? (:block/type page) "hidden"))
      {:msg "Page content deleted but unable to delete this page because there are still references to it"})

    (catch :default e
      (js/console.error e)
      {:msg (str "An unexpected failure while deleting: " e)})))

(defn delete!
  "Deletes a page. Returns true if able to delete page. If unable to delete,
  calls error-handler fn and returns false"
  [repo conn page-uuid & {:keys [persist-op? rename? error-handler]
                          :or {persist-op? true
                               error-handler (fn [{:keys [msg]}] (js/console.error msg))}}]
  (when (and repo page-uuid)
    (let [page (d/entity @conn [:block/uuid page-uuid])
          property? (contains? (:block/type page) "property")
          page-name (:block/name page)
          blocks (:block/_page page)
          truncate-blocks-tx-data (mapv
                                   (fn [block]
                                     [:db.fn/retractEntity [:block/uuid (:block/uuid block)]])
                                   blocks)
          db-based? (sqlite-util/db-based-graph? repo)]
      (if (ldb/built-in? page)
        (do
          (error-handler {:msg "Built-in page cannot be deleted"})
          false)
        (if-let [msg (and db-based? (page-unable-to-delete conn page))]
          (do
            (ldb/transact! conn truncate-blocks-tx-data
                           {:outliner-op :truncate-page-blocks :persist-op? persist-op?})
            (error-handler msg)
            false)
          (let [db @conn
                file (gp-db/get-page-file db page-name)
                file-path (:file/path file)
                delete-file-tx (when file
                                 [[:db.fn/retractEntity [:file/path file-path]]])
                delete-page-tx (concat (db-refs->page repo page)
                                       [[:db.fn/retractEntity (:db/id page)]])

                ;; TODO: is this still needed?
                delete-property-pairs-tx (when property?
                                           (map (fn [d] [:db.fn/retractEntity (:e d)]) (d/datoms db :avet (:db/ident page))))
                tx-data (concat truncate-blocks-tx-data
                                delete-page-tx
                                delete-file-tx
                                delete-property-pairs-tx)]

            (ldb/transact! conn tx-data
                           (cond-> {:outliner-op :delete-page
                                    :deleted-page page-name
                                    :persist-op? persist-op?}
                             rename?
                             (assoc :real-outliner-op :rename-page)
                             file-path
                             (assoc :file-path file-path)))
            true))))))
