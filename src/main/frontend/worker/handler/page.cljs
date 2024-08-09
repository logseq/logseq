(ns frontend.worker.handler.page
  "Page operations"
  (:require [logseq.db :as ldb]
            [logseq.graph-parser.db :as gp-db]
            [logseq.graph-parser.block :as gp-block]
            [logseq.db.sqlite.util :as sqlite-util]
            [datascript.core :as d]
            [logseq.common.config :as common-config]
            [logseq.db.frontend.content :as db-content]
            [frontend.worker.handler.page.db-based.page :as db-worker-page]
            [frontend.worker.handler.page.file-based.page :as file-worker-page]))

(defn rtc-create-page!
  [conn config title {:keys [uuid]}]
  (assert (uuid? uuid) (str "rtc-create-page! `uuid` is not a uuid " uuid))
  (let [date-formatter    (common-config/get-date-formatter config)
        [title page-name] (db-worker-page/get-title-and-pagename title)
        page              (-> (gp-block/page-name->map title @conn true date-formatter
                                                       {:page-uuid uuid
                                                        :skip-existing-page-check? true})
                              (assoc :block/format :markdown))
        result            (ldb/transact! conn [page] {:persist-op? false
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
  [repo conn config title & {:as options}]
  (if (ldb/db-based-graph? @conn)
    (db-worker-page/create! conn config title options)
    (file-worker-page/create! repo conn config title options)))

(defn db-refs->page
  "Replace [[page name]] with page name"
  [repo page-entity]
  (when (sqlite-util/db-based-graph? repo)
    (let [refs (:block/_refs page-entity)
          id-ref->page #(db-content/special-id-ref->page % [page-entity])]
      (when (seq refs)
        (let [tx-data (mapcat (fn [{:block/keys [raw-title] :as ref}]
                                ;; block content
                                (let [content' (id-ref->page raw-title)
                                      content-tx (when (not= raw-title content')
                                                   {:db/id (:db/id ref)
                                                    :block/title content'})
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
        (if (or (ldb/built-in? page) (ldb/hidden? page))
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
