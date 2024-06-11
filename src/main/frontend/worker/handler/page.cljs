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
            [frontend.worker.date :as date]
            [logseq.db.frontend.order :as db-order]
            [logseq.db.frontend.property.util :as db-property-util]
            [logseq.db.frontend.property.build :as db-property-build]
            [logseq.db.frontend.class :as db-class]))

(defn file-based-properties-block
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
                         properties
                         (db-property-build/build-properties-with-ref-values property-vals-tx-m)))))
        (let [file-page (merge page'
                               (when (seq properties) {:block/properties properties}))]
          (if (and (seq properties)
                   (not whiteboard?)
                   (ldb/page-empty? @conn (:block/name page)))
            [file-page (file-based-properties-block repo conn config date-formatter properties format page-entity)]
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

(defn- build-first-block-tx
  [page-uuid format]
  (let [page-id [:block/uuid page-uuid]]
    [(sqlite-util/block-with-timestamps
      {:block/uuid (ldb/new-block-id)
       :block/page page-id
       :block/parent page-id
       :block/order (db-order/gen-key nil nil)
       :block/content ""
       :block/format format})]))

(defn- file-based-create!
  [repo conn config title {:keys [create-first-block? format properties uuid persist-op? whiteboard? class? today-journal?]
                           :or   {create-first-block?      true
                                  format                   nil
                                  properties               nil
                                  uuid                     nil
                                  persist-op?              true}
                           :as options}]
  (let [date-formatter (common-config/get-date-formatter config)
        split-namespace? (not (or (string/starts-with? title "hls__")
                                  (date/valid-journal-title? date-formatter title)))
        [title page-name] (get-title-and-pagename title)
        with-uuid? (if (uuid? uuid) uuid true)]
    (when-not (ldb/get-page @conn page-name)
      (let [pages    (if split-namespace?
                       (common-util/split-namespace-pages title)
                       [title])
            format   (or format (common-config/get-preferred-format config))
            pages    (map (fn [page]
                            ;; only apply uuid to the deepest hierarchy of page to create if provided.
                            (-> (gp-block/page-name->map page (if (= page title) with-uuid? true) @conn true date-formatter :class? class?)
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
            page-txs (build-page-tx repo conn config date-formatter format properties (last pages) (select-keys options [:whiteboard? :class? :tags]))
            page-txs (if (seq txs)
                       (update page-txs 0
                               (fn [p]
                                 (assoc p :block/namespace [:block/uuid (:block/uuid (last txs))])))
                       page-txs)
            first-block-tx (when (and
                                  create-first-block?
                                  (not (or whiteboard? class?))
                                  page-txs)
                             (build-first-block-tx (:block/uuid (first page-txs)) format))
            txs      (concat
                      txs
                      page-txs
                      first-block-tx)
            [page-uuid result] (when (seq txs)
                                 [page-uuid (ldb/transact! conn txs (cond-> {:persist-op? persist-op?
                                                                             :outliner-op :create-page}
                                                                      today-journal?
                                                                      (assoc :create-today-journal? true
                                                                             :today-journal-name page-name)))])]
        [result page-name page-uuid]))))

(defn db-based-create!
  [repo conn config title
   {:keys [create-first-block? properties uuid persist-op? whiteboard? class? today-journal?]
    :or   {create-first-block?      true
           properties               nil
           uuid                     nil
           persist-op?              true}
    :as options}]
  (let [date-formatter (common-config/get-date-formatter config)
        [title page-name] (get-title-and-pagename title)
        with-uuid? (if (uuid? uuid) uuid true)]
    (when-not (ldb/get-page @conn page-name)
      (let [format    :markdown
            page      (-> (gp-block/page-name->map title with-uuid? @conn true date-formatter :class? class?)
                          (assoc :block/format format))
            page-uuid (:block/uuid page)
            page-txs  (build-page-tx repo conn config date-formatter format properties page (select-keys options [:whiteboard? :class? :tags]))
            first-block-tx (when (and
                                  create-first-block?
                                  (not (or whiteboard? class?))
                                  page-txs)
                             (build-first-block-tx (:block/uuid (first page-txs)) format))
            txs      (concat
                      page-txs
                      first-block-tx)
            [page-uuid result] (when (seq txs)
                                 [page-uuid (ldb/transact! conn txs (cond-> {:persist-op? persist-op?
                                                                             :outliner-op :create-page}
                                                                      today-journal?
                                                                      (assoc :create-today-journal? true
                                                                             :today-journal-name page-name)))])]
        [result page-name page-uuid]))))

(defn rtc-create-page!
  [conn config title {:keys [uuid]}]
  (assert (uuid? uuid) (str "rtc-create-page! `uuid` is not a uuid " uuid))
  (let [date-formatter (common-config/get-date-formatter config)
        [title page-name] (get-title-and-pagename title)
        page      (-> (gp-block/page-name->map title uuid @conn true date-formatter
                                               {:skip-existing-page-check? true})
                      (assoc :block/format :markdown))
        result (ldb/transact! conn [page] {:persist-op? false
                                           :outliner-op :create-page})]
    [result page-name (:block/uuid page)]))

(defn create!
  "Create page. Has the following options:

   * :create-first-block?      - when true, create an empty block if the page is empty.
   * :uuid                     - when set, use this uuid instead of generating a new one.
   * :class?                   - when true, adds a :block/type 'class'
   * :whiteboard?              - when true, adds a :block/type 'whiteboard'
   * :tags                     - tag uuids that are added to :block/tags
   * :persist-op?              - when true, add an update-page op
   * :properties               - properties to add to the page
  TODO: Add other options"
  [repo conn config title & options]
  (if (ldb/db-based-graph? @conn)
    (db-based-create! repo conn config title options)
    (file-based-create! repo conn config title options)))

(defn db-refs->page
  "Replace [[page name]] with page name"
  [repo page-entity]
  (when (sqlite-util/db-based-graph? repo)
    (let [refs (:block/_refs page-entity)
          id-ref->page #(db-content/special-id-ref->page % [page-entity])]
      (when (seq refs)
        (let [tx-data (mapcat (fn [{:block/keys [raw-content] :as ref}]
                                ;; block content
                                (let [content' (id-ref->page raw-content)
                                      content-tx (when (not= raw-content content')
                                                   {:db/id (:db/id ref)
                                                    :block/content content'})
                                      tx content-tx]
                                  (concat
                                   [[:db/retract (:db/id ref) :block/refs (:db/id page-entity)]]
                                   (when tx [tx])))) refs)]
          tx-data)))))

(defn delete!
  "Deletes a page. Returns true if able to delete page. If unable to delete,
  calls error-handler fn and returns false"
  [repo conn page-uuid & {:keys [persist-op? rename? error-handler]
                          :or {persist-op? true
                               error-handler (fn [{:keys [msg]}] (js/console.error msg))}}]
  (assert (uuid? page-uuid) (str "frontend.worker.handler.page/delete! srong page-uuid: " (if page-uuid page-uuid "nil")))
  (when (and repo page-uuid)
    (when-let [page (d/entity @conn [:block/uuid page-uuid])]
      (let [page-name (:block/name page)
            blocks (:block/_page page)
            truncate-blocks-tx-data (mapv
                                     (fn [block]
                                       [:db.fn/retractEntity [:block/uuid (:block/uuid block)]])
                                     blocks)
            db-based? (sqlite-util/db-based-graph? repo)]
        ;; TODO: maybe we should add $$$favorites to built-in pages?
        (if (or (ldb/built-in? page) (contains? (:block/type page) "hidden"))
          (do
            (error-handler {:msg "Built-in page cannot be deleted"})
            false)
          (let [db @conn
                file (when-not db-based? (gp-db/get-page-file db page-name))
                file-path (:file/path file)
                delete-file-tx (when file
                                 [[:db.fn/retractEntity [:file/path file-path]]])
                delete-page-tx (concat (db-refs->page repo page)
                                       [[:db.fn/retractEntity (:db/id page)]])

                tx-data (concat truncate-blocks-tx-data
                                delete-page-tx
                                delete-file-tx)]

            (ldb/transact! conn tx-data
                           (cond-> {:outliner-op :delete-page
                                    :deleted-page (str (:block/uuid page))
                                    :persist-op? persist-op?}
                             rename?
                             (assoc :real-outliner-op :rename-page)
                             file-path
                             (assoc :file-path file-path)))
            true))))))
