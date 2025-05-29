(ns frontend.worker.handler.page
  "Page operations"
  (:require [datascript.core :as d]
            [frontend.worker.handler.page.db-based.page :as db-worker-page]
            [frontend.worker.handler.page.file-based.page :as file-worker-page]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.db :as gp-db]))

(defn rtc-create-page!
  [conn config title {:keys [uuid]}]
  (assert (uuid? uuid) (str "rtc-create-page! `uuid` is not a uuid " uuid))
  (let [date-formatter    (common-config/get-date-formatter config)
        title (db-worker-page/sanitize-title title)
        page-name (common-util/page-name-sanity-lc title)
        page              (gp-block/page-name->map title @conn true date-formatter
                                                   {:page-uuid uuid
                                                    :skip-existing-page-check? true})
        result            (ldb/transact! conn [page] {:persist-op? false
                                                      :outliner-op :create-page})]
    [result page-name (:block/uuid page)]))

(defn create!
  "Create page. Has the following options:

   * :create-first-block?      - when true, create an empty block if the page is empty.
   * :uuid                     - when set, use this uuid instead of generating a new one.
   * :class?                   - when true, adds a :block/tags ':logseq.class/Tag'
   * :whiteboard?              - when true, adds a :block/tags ':logseq.class/Whiteboard'
   * :tags                     - tag uuids that are added to :block/tags
   * :persist-op?              - when true, add an update-page op
   * :properties               - properties to add to the page
  TODO: Add other options"
  [repo conn config title & {:as options}]
  (if (ldb/db-based-graph? @conn)
    (db-worker-page/create! conn title options)
    (file-worker-page/create! repo conn config title options)))

(defn db-refs->page
  "Replace [[page name]] with page name"
  [repo page-entity]
  (when (sqlite-util/db-based-graph? repo)
    (let [refs (:block/_refs page-entity)
          id-ref->page #(db-content/content-id-ref->page % [page-entity])]
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
                delete-property-tx (when (ldb/property? page)
                                     (concat
                                      (let [datoms (d/datoms @conn :avet (:db/ident page))]
                                        (map (fn [d] [:db/retract (:e d) (:a d)]) datoms))
                                      (map (fn [d] [:db/retractEntity (:e d)])
                                           (d/datoms @conn :avet :logseq.property.history/property (:db/ident page)))))
                delete-page-tx (concat (db-refs->page repo page)
                                       delete-property-tx
                                       [[:db.fn/retractEntity (:db/id page)]])
                restore-class-parent-tx (when db-based?
                                          (->> (filter (fn [p] (ldb/class? p)) (:logseq.property/_parent page))
                                               (map (fn [p]
                                                      {:db/id (:db/id p)
                                                       :logseq.property/parent :logseq.class/Root}))))
                tx-data (concat truncate-blocks-tx-data
                                restore-class-parent-tx
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
